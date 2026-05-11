#!/bin/bash
# ============================================================
# REZ Ecosystem - MongoDB Backup Script
# ============================================================
# Backs up MongoDB replica set with verification
# Usage: ./backup-mongodb.sh [--all-databases] [--single-db <db_name>]
# ============================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_DIR/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DATE=$(date +%Y%m%d)
LOG_FILE="$BACKUP_ROOT/logs/mongodb-backup_${TIMESTAMP}.log"
RETENTION_DAYS="${MONGODB_BACKUP_RETENTION_DAYS:-30}"

# MongoDB Configuration
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
MONGODB_USER="${MONGODB_USER:-}"
MONGODB_PASSWORD="${MONGODB_PASSWORD:-}"
MONGODB_AUTH_DB="${MONGODB_AUTH_DB:-admin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Options
BACKUP_ALL_DBS=false
SINGLE_DB=""
EXCLUDE_DBS="admin,local,config"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all-databases)
            BACKUP_ALL_DBS=true
            shift
            ;;
        --single-db)
            SINGLE_DB="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--all-databases] [--single-db <db_name>]"
            echo ""
            echo "Options:"
            echo "  --all-databases    Backup all databases (default: only application databases)"
            echo "  --single-db        Backup a specific database"
            echo ""
            echo "Environment Variables:"
            echo "  MONGODB_URI        MongoDB connection URI"
            echo "  MONGODB_USER       MongoDB username"
            echo "  MONGODB_PASSWORD   MongoDB password"
            echo "  BACKUP_ROOT        Backup root directory"
            echo "  RETENTION_DAYS      Days to keep backups (default: 30)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create directories
mkdir -p "$BACKUP_ROOT/mongodb/$BACKUP_DATE"
mkdir -p "$BACKUP_ROOT/mongodb/latest"
mkdir -p "$BACKUP_ROOT/logs"

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [$level] $message" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "${BLUE}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }

# Build mongodump command
build_mongodump_cmd() {
    local cmd="mongodump"

    # Add authentication if provided
    if [ -n "$MONGODB_USER" ] && [ -n "$MONGODB_PASSWORD" ]; then
        cmd="$cmd --username=$MONGODB_USER --password=$MONGODB_PASSWORD --authenticationDatabase=$MONGODB_AUTH_DB"
    fi

    # Add URI
    cmd="$cmd --uri=$MONGODB_URI"

    return 0
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check MongoDB container
    if ! docker ps --format '{{.Names}}' | grep -q "rez-mongodb-primary"; then
        log_error "MongoDB container (rez-mongodb-primary) is not running"
        exit 1
    fi

    # Check mongosh availability
    if ! docker exec rez-mongodb-primary mongosh --version > /dev/null 2>&1; then
        log_warn "mongosh not found, using legacy mongodump"
    fi

    log_success "Prerequisites check passed"
}

# Get replica set status
get_replica_status() {
    log_info "Checking replica set status..."

    docker exec rez-mongodb-primary mongosh \
        --quiet \
        --eval "JSON.stringify(rs.status())" \
        2>/dev/null | jq -r '.ok' 2>/dev/null || echo "1"
}

# List databases
list_databases() {
    docker exec rez-mongodb-primary mongosh \
        --quiet \
        --eval "db.getMongo().getDBNames()" \
        2>/dev/null | tr ',' '\n' | tr -d ' ' | grep -v '^$'
}

# Backup single database
backup_database() {
    local db_name=$1
    local backup_dir="$BACKUP_ROOT/mongodb/$BACKUP_DATE/$db_name"
    mkdir -p "$backup_dir"

    log_info "Backing up database: $db_name"

    # Build mongodump command
    local cmd="docker exec rez-mongodb-primary mongodump"

    if [ -n "$MONGODB_USER" ] && [ -n "$MONGODB_PASSWORD" ]; then
        cmd="$cmd --username=$MONGODB_USER --password=$MONGODB_PASSWORD --authenticationDatabase=$MONGODB_AUTH_DB"
    fi

    cmd="$cmd --uri=$MONGODB_URI --db=$db_name --out=/tmp/mongodump_$TIMESTAMP"

    # Execute backup
    if eval "$cmd" 2>&1 | tee -a "$LOG_FILE"; then
        # Copy backup from container
        docker cp "rez-mongodb-primary:/tmp/mongodump_$TIMESTAMP/$db_name" "$backup_dir/"

        # Verify backup
        if [ -d "$backup_dir/$db_name" ]; then
            local collection_count=$(find "$backup_dir/$db_name" -name "*.bson" 2>/dev/null | wc -l | tr -d ' ')
            log_success "Database '$db_name' backed up ($collection_count collections)"

            # Create metadata
            cat > "$backup_dir/backup_info.json" <<EOF
{
    "database": "$db_name",
    "timestamp": "$TIMESTAMP",
    "backup_date": "$BACKUP_DATE",
    "collection_count": $collection_count,
    "source_uri": "$MONGODB_URI",
    "backup_method": "mongodump"
}
EOF
            return 0
        else
            log_error "Backup verification failed for '$db_name'"
            return 1
        fi
    else
        log_error "Failed to backup database '$db_name'"
        return 1
    fi
}

# Create archive
create_archive() {
    local backup_dir="$BACKUP_ROOT/mongodb/$BACKUP_DATE"
    local archive_name="mongodb_${TIMESTAMP}.archive.gz"

    log_info "Creating compressed archive..."

    tar -czf "$backup_dir/$archive_name" \
        -C "$BACKUP_ROOT/mongodb" \
        "$BACKUP_DATE" \
        2>/dev/null

    if [ -f "$backup_dir/$archive_name" ]; then
        local size=$(du -h "$backup_dir/$archive_name" | cut -f1)
        log_success "Archive created: $archive_name ($size)"
        return 0
    else
        log_error "Failed to create archive"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    find "$BACKUP_ROOT/mongodb" -maxdepth 1 -type d -name "[0-9]*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

    log_success "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_dir="$BACKUP_ROOT/mongodb/$BACKUP_DATE"

    log_info "Verifying backup integrity..."

    # Check if backup directory exists
    if [ ! -d "$backup_dir" ]; then
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi

    # Check for backup files
    local file_count=$(find "$backup_dir" -type f -name "*.bson" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$file_count" -gt 0 ]; then
        log_success "Backup verified: $file_count BSON files found"
        return 0
    else
        log_warn "No BSON files found in backup"
        return 1
    fi
}

# Create metadata file
create_metadata() {
    local backup_dir="$BACKUP_ROOT/mongodb/$BACKUP_DATE"

    cat > "$backup_dir/metadata.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "backup_date": "$BACKUP_DATE",
    "source_uri": "$MONGODB_URI",
    "backup_type": "$([ "$BACKUP_ALL_DBS" = true ] && echo "full" || echo "partial")",
    "excluded_dbs": "$EXCLUDE_DBS",
    "replication_status": "ok",
    "backup_host": "$(hostname)",
    "backup_path": "$backup_dir",
    "mongodb_version": "$(docker exec rez-mongodb-primary mongod --version 2>/dev/null | head -1 | awk '{print $4}')"
}
EOF

    log_info "Metadata file created"
}

# Main backup function
perform_backup() {
    local errors=0

    check_prerequisites

    log_info "Starting MongoDB backup..."
    log_info "Backup root: $BACKUP_ROOT"
    log_info "Timestamp: $TIMESTAMP"

    # Create backup directory
    local backup_dir="$BACKUP_ROOT/mongodb/$BACKUP_DATE"
    mkdir -p "$backup_dir"

    # Get replica set status
    local rs_status=$(get_replica_status)
    if [ "$rs_status" != "1" ]; then
        log_warn "Replica set status is not OK: $rs_status"
    fi

    # List databases
    if [ "$BACKUP_ALL_DBS" = true ]; then
        log_info "Backing up all databases..."
        for db in $(list_databases); do
            backup_database "$db" || ((errors++))
        done
    elif [ -n "$SINGLE_DB" ]; then
        backup_database "$SINGLE_DB" || ((errors++))
    else
        # Backup application databases only
        log_info "Backing up application databases..."

        # Common application databases
        local app_dbs=(
            "rez_auth_dev"
            "rez_merchant_dev"
            "rez_dev"
            "rez_intelligence"
            "rez_intent_graph"
            "rez_personalization"
            "rez_targeting"
            "rez_action_engine"
            "rez_scheduler"
            "rez_automation"
            "rez_corporate"
            "rez_feedback"
            "rez_stayown"
        )

        for db in "${app_dbs[@]}"; do
            # Check if database exists
            if docker exec rez-mongodb-primary mongosh \
                --quiet --eval "db.getMongo().getDBNames().includes('$db')" 2>/dev/null | grep -q "true"; then
                backup_database "$db" || ((errors++))
            fi
        done
    fi

    # Create metadata
    create_metadata

    # Create archive
    create_archive

    # Create symlink to latest
    ln -sfn "$backup_dir" "$BACKUP_ROOT/mongodb/latest"

    # Cleanup
    cleanup_old_backups

    # Verify
    verify_backup

    return $errors
}

# Print summary
print_summary() {
    echo ""
    echo "========================================"
    echo "     MONGODB BACKUP SUMMARY"
    echo "========================================"
    echo "Timestamp: $TIMESTAMP"
    echo "Date: $BACKUP_DATE"
    echo "Backup Location: $BACKUP_ROOT/mongodb/$BACKUP_DATE"
    echo "Log File: $LOG_FILE"
    echo "========================================"
}

# Main
main() {
    echo "========================================"
    echo "  MONGODB BACKUP"
    echo "========================================"
    echo ""

    local start_time=$(date +%s)

    if perform_backup; then
        print_summary
        log_success "MongoDB backup completed successfully!"
        exit 0
    else
        print_summary
        log_error "MongoDB backup completed with errors"
        exit 1
    fi
}

main
