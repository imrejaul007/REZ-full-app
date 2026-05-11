#!/bin/bash
# ============================================================
# REZ Ecosystem - Complete Backup Script
# ============================================================
# Backs up: MongoDB, Redis, PostgreSQL, and critical data
# Usage: ./backup-all.sh [--verify] [--compress] [--upload-s3]
# ============================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_DIR/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DATE=$(date +%Y%m%d)
LOG_FILE="$BACKUP_ROOT/logs/backup-all_${TIMESTAMP}.log"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Options
VERIFY_BACKUP=false
COMPRESS_BACKUP=true
UPLOAD_S3=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verify)
            VERIFY_BACKUP=true
            shift
            ;;
        --compress)
            COMPRESS_BACKUP=true
            shift
            ;;
        --upload-s3)
            UPLOAD_S3=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--verify] [--compress] [--upload-s3]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create directories
mkdir -p "$BACKUP_ROOT/mongodb"
mkdir -p "$BACKUP_ROOT/redis"
mkdir -p "$BACKUP_ROOT/postgres"
mkdir -p "$BACKUP_ROOT/configs"
mkdir -p "$BACKUP_ROOT/logs"
mkdir -p "$BACKUP_ROOT/archives"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [$level] $message" | tee -a "$LOG_FILE"
}

# Log colors
log_info() { log "INFO" "${BLUE}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if required containers are running
check_containers() {
    local required_containers=("rez-mongodb-primary" "rez-redis")
    local missing=()

    for container in "${required_containers[@]}"; do
        if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            missing+=("$container")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warn "Missing containers: ${missing[*]}"
        log_warn "Some backups may fail. Proceeding anyway..."
    fi
}

# Load environment variables
load_env() {
    if [ -f "$APP_DIR/.env" ]; then
        export $(grep -v '^#' "$APP_DIR/.env" | xargs)
    fi
}

# Backup MongoDB
backup_mongodb() {
    local backup_dir="$BACKUP_ROOT/mongodb/$BACKUP_DATE"
    mkdir -p "$backup_dir"

    log_info "Starting MongoDB backup..."

    # Check if MongoDB container is running
    if ! docker ps --format '{{.Names}}' | grep -q "rez-mongodb-primary"; then
        log_error "MongoDB container (rez-mongodb-primary) is not running"
        return 1
    fi

    local mongo_uri="${MONGODB_URI:-mongodb://localhost:27017}"
    local db_name="${MONGODB_DB_NAME:-rez_dev}"
    local dump_file="mongodb_${TIMESTAMP}"
    local archive_file="${dump_file}.archive"

    # Create mongodump backup
    if docker exec rez-mongodb-primary mongodump \
        --uri="$mongo_uri" \
        --archive="$archive_file" \
        --gzip \
        2>&1 | tee -a "$LOG_FILE"; then
        # Copy from container
        docker cp "rez-mongodb-primary:/data/db/$archive_file" "$backup_dir/$archive_file" 2>/dev/null || \
        docker cp "rez-mongodb-primary:$archive_file" "$backup_dir/$archive_file"
        log_success "MongoDB backup completed: $backup_dir/$archive_file"
    else
        log_error "MongoDB backup failed"
        return 1
    fi

    # Create symlink to latest
    ln -sfn "$backup_dir" "$BACKUP_ROOT/mongodb/latest"

    # Store backup metadata
    cat > "$backup_dir/backup_info.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$BACKUP_DATE",
    "type": "mongodb",
    "source": "$mongo_uri",
    "archive_file": "$archive_file",
    "size_bytes": $(stat -f%z "$backup_dir/$archive_file" 2>/dev/null || stat -c%s "$backup_dir/$archive_file" 2>/dev/null || echo 0),
    "backup_host": "$(hostname)"
}
EOF

    return 0
}

# Backup Redis
backup_redis() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"
    mkdir -p "$backup_dir"

    log_info "Starting Redis backup..."

    # Check if Redis container is running
    if ! docker ps --format '{{.Names}}' | grep -q "rez-redis"; then
        log_error "Redis container (rez-redis) is not running"
        return 1
    fi

    local redis_password="${REDIS_PASSWORD:-}"
    local dump_file="redis_${TIMESTAMP}.rdb"
    local aof_file="redis_${TIMESTAMP}.aof"

    # Trigger BGSAVE for RDB backup
    if [ -n "$redis_password" ]; then
        docker exec rez-redis redis-cli -a "$redis_password" BGSAVE 2>&1 | tee -a "$LOG_FILE" || true
        sleep 2
        docker exec rez-redis redis-cli -a "$redis_password" LASTSAVE > "$backup_dir/lastsave.txt"
    else
        docker exec rez-redis redis-cli BGSAVE 2>&1 | tee -a "$LOG_FILE" || true
        sleep 2
        docker exec rez-redis redis-cli LASTSAVE > "$backup_dir/lastsave.txt"
    fi

    # Copy dump files
    docker cp "rez-redis:/data/dump.rdb" "$backup_dir/$dump_file" 2>/dev/null && \
        log_info "RDB dump copied: $backup_dir/$dump_file" || \
        log_warn "RDB dump not found"

    # Copy AOF file if exists
    docker cp "rez-redis:/data/appendonly.aof" "$backup_dir/$aof_file" 2>/dev/null && \
        log_info "AOF file copied: $backup_dir/$aof_file" || \
        log_info "AOF file not found (normal if AOF is disabled)"

    # Save Redis INFO
    if [ -n "$redis_password" ]; then
        docker exec rez-redis redis-cli -a "$redis_password" INFO > "$backup_dir/redis_info.txt"
    else
        docker exec rez-redis redis-cli INFO > "$backup_dir/redis_info.txt"
    fi

    # Get key count
    if [ -n "$redis_password" ]; then
        local key_count=$(docker exec rez-redis redis-cli -a "$redis_password" DBSIZE | awk '{print $2}')
    else
        local key_count=$(docker exec rez-redis redis-cli DBSIZE | awk '{print $2}')
    fi

    log_success "Redis backup completed: $backup_dir"

    # Store backup metadata
    cat > "$backup_dir/backup_info.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$BACKUP_DATE",
    "type": "redis",
    "rdb_file": "$dump_file",
    "aof_file": "$aof_file",
    "key_count": "$key_count",
    "backup_host": "$(hostname)"
}
EOF

    # Create symlink to latest
    ln -sfn "$backup_dir" "$BACKUP_ROOT/redis/latest"

    return 0
}

# Backup PostgreSQL
backup_postgres() {
    local backup_dir="$BACKUP_ROOT/postgres/$BACKUP_DATE"
    mkdir -p "$backup_dir"

    log_info "Starting PostgreSQL backup..."

    # Check if PostgreSQL container is running
    if ! docker ps --format '{{.Names}}' | grep -q "rez-postgres"; then
        log_warn "PostgreSQL container (rez-postgres) is not running, skipping..."
        return 0
    fi

    local pg_user="${POSTGRES_USER:-rez}"
    local pg_db="${POSTGRES_DB:-rez_dev}"
    local dump_file="postgres_${TIMESTAMP}.sql"

    # Create pg_dump backup
    docker exec rez-postgres pg_dump -U "$pg_user" -d "$pg_db" \
        --clean --if-exists \
        2>&1 | gzip > "$backup_dir/$dump_file.gz"

    log_success "PostgreSQL backup completed: $backup_dir/$dump_file.gz"

    # Store backup metadata
    cat > "$backup_dir/backup_info.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$BACKUP_DATE",
    "type": "postgres",
    "database": "$pg_db",
    "dump_file": "$dump_file.gz",
    "size_bytes": $(stat -f%z "$backup_dir/$dump_file.gz" 2>/dev/null || stat -c%s "$backup_dir/$dump_file.gz" 2>/dev/null || echo 0),
    "backup_host": "$(hostname)"
}
EOF

    # Create symlink to latest
    ln -sfn "$backup_dir" "$BACKUP_ROOT/postgres/latest"

    return 0
}

# Backup configuration files
backup_configs() {
    local backup_dir="$BACKUP_ROOT/configs/$BACKUP_DATE"
    mkdir -p "$backup_dir"

    log_info "Backing up configuration files..."

    # Copy important config files
    local config_files=(
        "$APP_DIR/.env"
        "$APP_DIR/docker-compose.yml"
        "$APP_DIR/docker-compose.*.yml"
        "$APP_DIR/.env.example"
    )

    for pattern in "${config_files[@]}"; do
        cp -r $pattern "$backup_dir/" 2>/dev/null || true
    done

    # Tar and compress configs
    local config_archive="configs_${TIMESTAMP}.tar.gz"
    tar -czf "$backup_dir/$config_archive" -C "$backup_dir" \
        .env docker-compose.yml .env.example 2>/dev/null || true

    log_success "Configuration backup completed: $backup_dir"

    return 0
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    # Find and remove old backups
    find "$BACKUP_ROOT/mongodb" -maxdepth 1 -type d -name "[0-9]*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    find "$BACKUP_ROOT/redis" -maxdepth 1 -type d -name "[0-9]*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    find "$BACKUP_ROOT/postgres" -maxdepth 1 -type d -name "[0-9]*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    find "$BACKUP_ROOT/configs" -maxdepth 1 -type d -name "[0-9]*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    find "$BACKUP_ROOT/logs" -name "*.log" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    log_success "Cleanup completed"
}

# Create full backup archive
create_full_archive() {
    if [ "$COMPRESS_BACKUP" = true ]; then
        log_info "Creating full backup archive..."

        local archive_name="rez_full_backup_${TIMESTAMP}.tar.gz"
        tar -czf "$BACKUP_ROOT/archives/$archive_name" \
            -C "$BACKUP_ROOT" \
            --exclude='logs' \
            mongodb/$BACKUP_DATE \
            redis/$BACKUP_DATE \
            postgres/$BACKUP_DATE \
            configs/$BACKUP_DATE \
            2>/dev/null || true

        log_success "Full archive created: $BACKUP_ROOT/archives/$archive_name"
    fi
}

# Upload to S3
upload_to_s3() {
    if [ "$UPLOAD_S3" = true ]; then
        log_info "Uploading backup to S3..."

        local s3_bucket="${S3_BUCKET:-}"
        local s3_prefix="${S3_PREFIX:-rez-backups}"

        if [ -z "$s3_bucket" ]; then
            log_warn "S3_BUCKET not set, skipping S3 upload"
            return 1
        fi

        # Upload using AWS CLI
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_ROOT/archives/rez_full_backup_${TIMESTAMP}.tar.gz" \
                "s3://$s3_bucket/$s3_prefix/${TIMESTAMP}/rez_full_backup_${TIMESTAMP}.tar.gz" \
                2>&1 | tee -a "$LOG_FILE"

            log_success "Backup uploaded to S3: s3://$s3_bucket/$s3_prefix/${TIMESTAMP}/"
        else
            log_warn "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

# Verify backups
verify_backups() {
    if [ "$VERIFY_BACKUP" = false ]; then
        return 0
    fi

    log_info "Verifying backups..."

    local errors=0

    # Verify MongoDB backup
    local mongo_backup="$BACKUP_ROOT/mongodb/$BACKUP_DATE"
    if [ -d "$mongo_backup" ]; then
        local mongo_archive=$(ls "$mongo_backup"/*.archive 2>/dev/null | head -1)
        if [ -f "$mongo_archive" ]; then
            log_success "MongoDB backup verified: $(basename "$mongo_archive")"
        else
            log_error "MongoDB backup archive not found"
            ((errors++))
        fi
    else
        log_warn "MongoDB backup directory not found"
        ((errors++))
    fi

    # Verify Redis backup
    local redis_backup="$BACKUP_ROOT/redis/$BACKUP_DATE"
    if [ -d "$redis_backup" ]; then
        local rdb_file=$(ls "$redis_backup"/*.rdb 2>/dev/null | head -1)
        if [ -f "$rdb_file" ]; then
            log_success "Redis backup verified: $(basename "$rdb_file")"
        else
            log_warn "Redis RDB file not found"
        fi
    else
        log_warn "Redis backup directory not found"
        ((errors++))
    fi

    # Verify PostgreSQL backup
    local pg_backup="$BACKUP_ROOT/postgres/$BACKUP_DATE"
    if [ -d "$pg_backup" ]; then
        local pg_archive=$(ls "$pg_backup"/*.sql.gz 2>/dev/null | head -1)
        if [ -f "$pg_archive" ]; then
            log_success "PostgreSQL backup verified: $(basename "$pg_archive")"
        else
            log_warn "PostgreSQL backup not found"
        fi
    else
        log_warn "PostgreSQL backup directory not found (optional)"
    fi

    return $errors
}

# Print backup summary
print_summary() {
    echo ""
    echo "========================================"
    echo "       BACKUP SUMMARY"
    echo "========================================"
    echo "Timestamp: $TIMESTAMP"
    echo "Date: $BACKUP_DATE"
    echo "Backup Root: $BACKUP_ROOT"
    echo ""
    echo "Backups created:"
    echo "  - MongoDB: $BACKUP_ROOT/mongodb/$BACKUP_DATE"
    echo "  - Redis: $BACKUP_ROOT/redis/$BACKUP_DATE"
    echo "  - PostgreSQL: $BACKUP_ROOT/postgres/$BACKUP_DATE"
    echo "  - Configs: $BACKUP_ROOT/configs/$BACKUP_DATE"
    echo ""
    echo "Log file: $LOG_FILE"
    echo "========================================"
}

# Main execution
main() {
    echo "========================================"
    echo "  REZ ECOSYSTEM - COMPLETE BACKUP"
    echo "========================================"
    echo ""

    load_env
    check_docker
    check_containers

    local start_time=$(date +%s)

    # Run all backups
    local backup_errors=0

    backup_mongodb || ((backup_errors++))
    backup_redis || ((backup_errors++))
    backup_postgres || ((backup_errors++))
    backup_configs || ((backup_errors++))

    # Cleanup and archive
    cleanup_old_backups
    create_full_archive
    upload_to_s3
    verify_backups || true

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    print_summary

    echo "Backup completed in ${duration}s"

    if [ $backup_errors -gt 0 ]; then
        log_warn "$backup_errors backup(s) had errors"
        exit 1
    fi

    log_success "All backups completed successfully!"
    exit 0
}

# Run main function
main
