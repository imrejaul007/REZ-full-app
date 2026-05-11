#!/bin/bash
# ============================================================
# REZ Ecosystem - Complete Restore Script
# ============================================================
# Restores backups for MongoDB, Redis, PostgreSQL
# Usage: ./restore-all.sh [--mongodb] [--redis] [--postgres] [--all] [--date YYYYMMDD]
# ============================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_DIR/backups}"

# Default restore date (latest)
RESTORE_DATE=""
TASK_ID=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Options
RESTORE_MONGODB=false
RESTORE_REDIS=false
RESTORE_POSTGRES=false
RESTORE_ALL=false
DRY_RUN=false
AUTO_CONFIRM=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mongodb)
            RESTORE_MONGODB=true
            shift
            ;;
        --redis)
            RESTORE_REDIS=true
            shift
            ;;
        --postgres)
            RESTORE_POSTGRES=true
            shift
            ;;
        --all)
            RESTORE_ALL=true
            shift
            ;;
        --date)
            RESTORE_DATE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --yes)
            AUTO_CONFIRM=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--mongodb] [--redis] [--postgres] [--all] [--date YYYYMMDD] [--dry-run] [--yes]"
            echo ""
            echo "Options:"
            echo "  --mongodb    Restore MongoDB only"
            echo "  --redis      Restore Redis only"
            echo "  --postgres   Restore PostgreSQL only"
            echo "  --all        Restore all services (default if no service specified)"
            echo "  --date       Specific backup date to restore (YYYYMMDD format)"
            echo "  --dry-run    Show what would be restored without making changes"
            echo "  --yes        Skip confirmation prompts"
            echo ""
            echo "Examples:"
            echo "  $0 --all                    # Restore latest backups for all services"
            echo "  $0 --mongodb --date 20260501 # Restore MongoDB from specific date"
            echo "  $0 --redis --dry-run        # Preview Redis restore without executing"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If no specific service, restore all
if [ "$RESTORE_MONGODB" = false ] && [ "$RESTORE_REDIS" = false ] && [ "$RESTORE_POSTGRES" = false ]; then
    RESTORE_ALL=true
fi

if [ "$RESTORE_ALL" = true ]; then
    RESTORE_MONGODB=true
    RESTORE_REDIS=true
    RESTORE_POSTGRES=true
fi

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [$level] $message"
}

log_info() { log "INFO" "${BLUE}$*${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$*${NC}"; }
log_warn() { log "WARN" "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }

# Load environment
load_env() {
    if [ -f "$APP_DIR/.env" ]; then
        export $(grep -v '^#' "$APP_DIR/.env" | xargs)
    fi
}

# List available backups
list_backups() {
    echo ""
    echo "========================================"
    echo "     AVAILABLE BACKUPS"
    echo "========================================"
    echo ""

    echo "MongoDB Backups:"
    if [ -d "$BACKUP_ROOT/mongodb" ]; then
        ls -la "$BACKUP_ROOT/mongodb/" | grep "^d" | tail -n +2 | awk '{print "  " $NF}'
    else
        echo "  No backups found"
    fi
    echo ""

    echo "Redis Backups:"
    if [ -d "$BACKUP_ROOT/redis" ]; then
        ls -la "$BACKUP_ROOT/redis/" | grep "^d" | tail -n +2 | awk '{print "  " $NF}'
    else
        echo "  No backups found"
    fi
    echo ""

    echo "PostgreSQL Backups:"
    if [ -d "$BACKUP_ROOT/postgres" ]; then
        ls -la "$BACKUP_ROOT/postgres/" | grep "^d" | tail -n +2 | awk '{print "  " $NF}'
    else
        echo "  No backups found"
    fi
    echo ""
    echo "========================================"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Get backup date (latest if not specified)
get_backup_date() {
    local type=$1
    local backup_dir="$BACKUP_ROOT/$type"

    if [ -n "$RESTORE_DATE" ]; then
        if [ -d "$backup_dir/$RESTORE_DATE" ]; then
            echo "$RESTORE_DATE"
        else
            log_error "Backup not found for date $RESTORE_DATE in $backup_dir"
            return 1
        fi
    else
        # Get latest backup
        local latest=$(ls -td "$backup_dir"/[0-9]* 2>/dev/null | head -1)
        if [ -n "$latest" ]; then
            basename "$latest"
        else
            echo ""
        fi
    fi
}

# Confirm restore
confirm_restore() {
    if [ "$AUTO_CONFIRM" = true ]; then
        return 0
    fi

    echo ""
    echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
    echo ""
    echo "Restore configuration:"
    [ "$RESTORE_MONGODB" = true ] && echo "  - MongoDB: YES"
    [ "$RESTORE_REDIS" = true ] && echo "  - Redis: YES"
    [ "$RESTORE_POSTGRES" = true ] && echo "  - PostgreSQL: YES"
    echo ""

    local mongo_date=$(get_backup_date "mongodb")
    local redis_date=$(get_backup_date "redis")
    local pg_date=$(get_backup_date "postgres")

    [ -n "$mongo_date" ] && echo "  MongoDB backup: $mongo_date"
    [ -n "$redis_date" ] && echo "  Redis backup: $redis_date"
    [ -n "$pg_date" ] && echo "  PostgreSQL backup: $pg_date"
    echo ""

    read -p "Continue with restore? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
}

# Restore MongoDB
restore_mongodb() {
    local backup_date=$(get_backup_date "mongodb")

    if [ -z "$backup_date" ]; then
        log_warn "No MongoDB backup found, skipping..."
        return 0
    fi

    local backup_dir="$BACKUP_ROOT/mongodb/$backup_date"

    log_info "Restoring MongoDB from backup: $backup_date"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would restore MongoDB from $backup_dir"
        return 0
    fi

    # Stop services that depend on MongoDB
    log_info "Stopping dependent services..."
    docker compose stop rez-auth-service rez-merchant-service 2>/dev/null || true

    # Wait for MongoDB to be ready
    log_info "Waiting for MongoDB to be ready..."
    local max_wait=30
    local wait=0
    while [ $wait -lt $max_wait ]; do
        if docker exec rez-mongodb-primary mongosh --eval "db.runCommand({ping:1})" --quiet 2>/dev/null | grep -q "ok"; then
            break
        fi
        sleep 1
        ((wait++))
    done

    # Find the backup archive
    local archive_file=$(ls "$backup_dir"/*.archive.gz 2>/dev/null | head -1)

    if [ -n "$archive_file" ]; then
        log_info "Found archive: $(basename "$archive_file")"

        # Copy archive to container
        docker cp "$archive_file" "rez-mongodb-primary:/tmp/mongorestore_${TASK_ID}.archive.gz"

        # Restore using mongorestore
        docker exec rez-mongodb-primary mongorestore \
            --uri="${MONGODB_URI:-mongodb://localhost:27017}" \
            --drop \
            --archive="/tmp/mongorestore_${TASK_ID}.archive.gz" \
            --gzip \
            2>&1 | tee /dev/stderr

        # Cleanup
        docker exec rez-mongodb-primary rm -f "/tmp/mongorestore_${TASK_ID}.archive.gz"

        log_success "MongoDB restore completed"
    else
        # Try individual database directories
        local db_count=0
        for db_dir in "$backup_dir"/*/; do
            if [ -d "$db_dir" ]; then
                local db_name=$(basename "$db_dir")
                log_info "Restoring database: $db_name"

                docker exec rez-mongodb-primary mongorestore \
                    --uri="${MONGODB_URI:-mongodb://localhost:27017}" \
                    --db="$db_name" \
                    --drop \
                    --path="/data/db/$db_name" \
                    2>&1 | tee /dev/stderr || true

                ((db_count++))
            fi
        done

        if [ $db_count -gt 0 ]; then
            log_success "MongoDB restore completed ($db_count databases)"
        else
            log_error "No MongoDB backup files found"
            return 1
        fi
    fi

    # Restart services
    log_info "Restarting dependent services..."
    docker compose start rez-auth-service rez-merchant-service 2>/dev/null || true

    return 0
}

# Restore Redis
restore_redis() {
    local backup_date=$(get_backup_date "redis")

    if [ -z "$backup_date" ]; then
        log_warn "No Redis backup found, skipping..."
        return 0
    fi

    local backup_dir="$BACKUP_ROOT/redis/$backup_date"

    log_info "Restoring Redis from backup: $backup_date"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would restore Redis from $backup_dir"
        return 0
    fi

    # Find RDB file
    local rdb_file=$(ls "$backup_dir"/redis_*.rdb 2>/dev/null | head -1)

    if [ -n "$rdb_file" ]; then
        log_info "Found RDB file: $(basename "$rdb_file")"

        # Stop Redis
        log_info "Stopping Redis..."
        docker exec rez-redis redis-cli SHUTDOWN SAVE 2>/dev/null || \
            docker stop rez-redis 2>/dev/null

        # Wait for Redis to stop
        sleep 2

        # Copy RDB file
        docker cp "$rdb_file" "rez-redis:/data/dump.rdb"

        # Start Redis
        log_info "Starting Redis..."
        docker start rez-redis 2>/dev/null || \
            docker compose up -d redis 2>/dev/null

        # Wait for Redis to be ready
        sleep 3

        # Verify
        if docker exec rez-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            log_success "Redis restore completed"
        else
            log_error "Redis failed to start after restore"
            return 1
        fi
    else
        log_error "No Redis RDB file found in $backup_dir"
        return 1
    fi

    return 0
}

# Restore PostgreSQL
restore_postgres() {
    local backup_date=$(get_backup_date "postgres")

    if [ -z "$backup_date" ]; then
        log_warn "No PostgreSQL backup found, skipping..."
        return 0
    fi

    local backup_dir="$BACKUP_ROOT/postgres/$backup_date"

    log_info "Restoring PostgreSQL from backup: $backup_date"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would restore PostgreSQL from $backup_dir"
        return 0
    fi

    # Find SQL dump file
    local dump_file=$(ls "$backup_dir"/*.sql.gz 2>/dev/null | head -1)

    if [ -n "$dump_file" ]; then
        log_info "Found dump file: $(basename "$dump_file")"

        # Stop dependent services
        log_info "Stopping dependent services..."
        docker compose stop rendez-backend hotel-ota-api 2>/dev/null || true

        # Wait for PostgreSQL
        log_info "Waiting for PostgreSQL to be ready..."
        local max_wait=30
        local wait=0
        while [ $wait -lt $max_wait ]; do
            if docker exec rez-postgres pg_isready -U "${POSTGRES_USER:-rez}" 2>/dev/null; then
                break
            fi
            sleep 1
            ((wait++))
        done

        # Decompress and restore
        gunzip < "$dump_file" | docker exec -i rez-postgres psql \
            -U "${POSTGRES_USER:-rez}" \
            -d "${POSTGRES_DB:-rez_dev}" \
            2>&1 | tee /dev/stderr

        log_success "PostgreSQL restore completed"
    else
        log_error "No PostgreSQL dump file found in $backup_dir"
        return 1
    fi

    return 0
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."

    # MongoDB verification
    if [ "$RESTORE_MONGODB" = true ]; then
        log_info "Verifying MongoDB..."
        if docker exec rez-mongodb-primary mongosh --eval "db.adminCommand({ping:1})" --quiet 2>/dev/null | grep -q "ok"; then
            log_success "MongoDB is responding"
        else
            log_warn "MongoDB verification failed"
        fi
    fi

    # Redis verification
    if [ "$RESTORE_REDIS" = true ]; then
        log_info "Verifying Redis..."
        if docker exec rez-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            local key_count=$(docker exec rez-redis redis-cli DBSIZE 2>/dev/null | awk '{print $2}')
            log_success "Redis is responding (keys: $key_count)"
        else
            log_warn "Redis verification failed"
        fi
    fi

    # PostgreSQL verification
    if [ "$RESTORE_POSTGRES" = true ]; then
        log_info "Verifying PostgreSQL..."
        if docker exec rez-postgres pg_isready -U "${POSTGRES_USER:-rez}" 2>/dev/null; then
            log_success "PostgreSQL is responding"
        else
            log_warn "PostgreSQL verification failed"
        fi
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "========================================"
    echo "     RESTORE SUMMARY"
    echo "========================================"
    echo "Task ID: $TASK_ID"
    echo "Restore Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "Services restored:"
    [ "$RESTORE_MONGODB" = true ] && echo "  - MongoDB: $(get_backup_date "mongodb")"
    [ "$RESTORE_REDIS" = true ] && echo "  - Redis: $(get_backup_date "redis")"
    [ "$RESTORE_POSTGRES" = true ] && echo "  - PostgreSQL: $(get_backup_date "postgres")"
    echo ""
    echo "========================================"
}

# Main
main() {
    echo "========================================"
    echo "  REZ ECOSYSTEM - RESTORE"
    echo "========================================"
    echo ""

    load_env

    # Show available backups
    list_backups

    # Check prerequisites
    check_prerequisites

    # Confirm restore
    confirm_restore

    # Dry run mode
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN MODE - No changes will be made"
    fi

    echo ""

    local errors=0

    # Perform restores
    [ "$RESTORE_MONGODB" = true ] && restore_mongodb || ((errors++))
    [ "$RESTORE_REDIS" = true ] && restore_redis || ((errors++))
    [ "$RESTORE_POSTGRES" = true ] && restore_postgres || ((errors++))

    # Verify
    verify_restore

    print_summary

    if [ $errors -gt 0 ]; then
        log_error "$errors restore(s) had errors"
        exit 1
    fi

    log_success "All restores completed successfully!"
    exit 0
}

main
