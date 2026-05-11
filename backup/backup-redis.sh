#!/bin/bash
# ============================================================
# REZ Ecosystem - Redis Backup Script
# ============================================================
# Backs up Redis data with RDB and AOF support
# Usage: ./backup-redis.sh [--rdb-only] [--aof-only] [--all]
# ============================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$APP_DIR/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DATE=$(date +%Y%m%d)
LOG_FILE="$BACKUP_ROOT/logs/redis-backup_${TIMESTAMP}.log"
RETENTION_DAYS="${REDIS_BACKUP_RETENTION_DAYS:-30}"

# Redis Configuration
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Options
BACKUP_RDB=true
BACKUP_AOF=true

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rdb-only)
            BACKUP_RDB=true
            BACKUP_AOF=false
            shift
            ;;
        --aof-only)
            BACKUP_RDB=false
            BACKUP_AOF=true
            shift
            ;;
        --all)
            BACKUP_RDB=true
            BACKUP_AOF=true
            shift
            ;;
        --help)
            echo "Usage: $0 [--rdb-only] [--aof-only] [--all]"
            echo ""
            echo "Options:"
            echo "  --rdb-only    Backup only RDB snapshot"
            echo "  --aof-only    Backup only AOF file"
            echo "  --all         Backup both RDB and AOF (default)"
            echo ""
            echo "Environment Variables:"
            echo "  REDIS_HOST     Redis host (default: localhost)"
            echo "  REDIS_PORT     Redis port (default: 6379)"
            echo "  REDIS_PASSWORD Redis password"
            echo "  BACKUP_ROOT    Backup root directory"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create directories
mkdir -p "$BACKUP_ROOT/redis/$BACKUP_DATE"
mkdir -p "$BACKUP_ROOT/redis/latest"
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

# Build redis-cli command
redis_cmd() {
    local cmd="docker exec rez-redis redis-cli"
    if [ -n "$REDIS_PASSWORD" ]; then
        cmd="$cmd -a $REDIS_PASSWORD"
    fi
    echo "$cmd"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    # Check Redis container
    if ! docker ps --format '{{.Names}}' | grep -q "rez-redis"; then
        log_error "Redis container (rez-redis) is not running"
        exit 1
    fi

    # Test Redis connection
    local redis_cli=$(redis_cmd)
    if ! $redis_cli ping 2>/dev/null | grep -q "PONG"; then
        log_error "Cannot connect to Redis"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Get Redis INFO
get_redis_info() {
    local redis_cli=$(redis_cmd)
    $redis_cli INFO 2>/dev/null
}

# Get database statistics
get_db_stats() {
    local redis_cli=$(redis_cmd)

    echo "=== Redis Database Statistics ==="
    echo "Keyspace:"
    $redis_cli INFO KEYSPACE 2>/dev/null || echo "No keyspace info available"
    echo ""
    echo "Memory Usage:"
    $redis_cli INFO MEMORY 2>/dev/null | grep -E "used_memory_human|peak_memory_human|maxmemory_human" || echo "No memory info"
    echo ""
    echo "Persistence:"
    $redis_cli INFO PERSISTENCE 2>/dev/null | grep -E "aof_enabled|rdb_changes_since_last_save" || echo "No persistence info"
}

# Backup RDB
backup_rdb() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"
    local rdb_file="redis_${TIMESTAMP}.rdb"
    local redis_cli=$(redis_cmd)

    log_info "Starting RDB backup..."

    # Get current RDB status
    local rdb_enabled=$(echo "$($redis_cli INFO PERSISTENCE 2>/dev/null)" | grep "rdb_save" | head -1)
    log_info "RDB Status: $rdb_enabled"

    # Trigger BGSAVE
    log_info "Triggering BGSAVE..."
    local bgsave_result=$($redis_cli BGSAVE 2>&1)
    log_info "BGSAVE result: $bgsave_result"

    # Wait for BGSAVE to complete
    local max_wait=60
    local wait=0
    while [ $wait -lt $max_wait ]; do
        local save_in_progress=$($redis_cli INFO PERSISTENCE 2>/dev/null | grep "rdb_save_in_progress" | cut -d: -f2 | tr -d '\r')
        if [ "$save_in_progress" = "0" ]; then
            log_success "BGSAVE completed"
            break
        fi
        sleep 1
        ((wait++))
    done

    if [ $wait -ge $max_wait ]; then
        log_warn "BGSAVE did not complete in ${max_wait}s, continuing anyway..."
    fi

    # Get LASTSAVE
    local lastsave=$($redis_cli LASTSAVE)
    log_info "Last save timestamp: $lastsave"

    # Copy RDB file
    log_info "Copying RDB file..."
    if docker cp "rez-redis:/data/dump.rdb" "$backup_dir/$rdb_file" 2>/dev/null; then
        local size=$(du -h "$backup_dir/$rdb_file" | cut -f1)
        log_success "RDB file backed up: $rdb_file ($size)"

        # Verify RDB file
        if file "$backup_dir/$rdb_file" | grep -q "Redis"; then
            log_success "RDB file verification passed"
        else
            log_warn "RDB file verification may have failed"
        fi

        return 0
    else
        log_error "Failed to copy RDB file"
        return 1
    fi
}

# Backup AOF
backup_aof() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"
    local aof_file="redis_${TIMESTAMP}.aof"
    local redis_cli=$(redis_cmd)

    log_info "Starting AOF backup..."

    # Check if AOF is enabled
    local aof_enabled=$(echo "$($redis_cli INFO PERSISTENCE 2>/dev/null)" | grep "aof_enabled" | cut -d: -f2 | tr -d '\r')
    if [ "$aof_enabled" != "1" ]; then
        log_warn "AOF is not enabled (aof_enabled=$aof_enabled)"
        return 0
    fi

    log_info "AOF is enabled, copying..."

    # Copy AOF file
    if docker cp "rez-redis:/data/appendonly.aof" "$backup_dir/$aof_file" 2>/dev/null; then
        local size=$(du -h "$backup_dir/$aof_file" | cut -f1)
        log_success "AOF file backed up: $aof_file ($size)"
        return 0
    else
        log_warn "AOF file not found at /data/appendonly.aof"
        return 1
    fi
}

# Save keyspace
save_keyspace() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"
    local redis_cli=$(redis_cmd)

    log_info "Saving keyspace information..."

    # Save key counts per database
    {
        echo "=== Redis Keyspace ==="
        echo "Timestamp: $TIMESTAMP"
        echo ""
        $redis_cli INFO KEYSPACE 2>/dev/null || echo "No keyspace info"
        echo ""
        echo "=== Database Sizes ==="
        for db in 0 1 2 3 4 5 6 7 8 9; do
            if [ -n "$REDIS_PASSWORD" ]; then
                count=$(docker exec rez-redis redis-cli -a "$REDIS_PASSWORD" -n $db DBSIZE 2>/dev/null | awk '{print $2}')
            else
                count=$(docker exec rez-redis redis-cli -n $db DBSIZE 2>/dev/null | awk '{print $2}')
            fi
            if [ "$count" -gt 0 ] 2>/dev/null; then
                echo "DB$db: $count keys"
            fi
        done
    } > "$backup_dir/redis_keyspace_${TIMESTAMP}.txt"

    log_success "Keyspace saved to redis_keyspace_${TIMESTAMP}.txt"
}

# Save Redis INFO
save_redis_info() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"

    log_info "Saving Redis INFO..."

    get_redis_info > "$backup_dir/redis_info_${TIMESTAMP}.txt"
    get_db_stats >> "$backup_dir/redis_info_${TIMESTAMP}.txt"

    log_success "Redis INFO saved"
}

# Create metadata
create_metadata() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"
    local redis_cli=$(redis_cmd)

    # Get current stats
    local key_count=$($redis_cli DBSIZE 2>/dev/null | awk '{print $2}')
    local used_memory=$($redis_cli INFO MEMORY 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
    local redis_version=$($redis_cli INFO SERVER 2>/dev/null | grep "redis_version" | cut -d: -f2 | tr -d '\r')

    cat > "$backup_dir/backup_info.json" <<EOF
{
    "timestamp": "$TIMESTAMP",
    "backup_date": "$BACKUP_DATE",
    "backup_type": "$([ "$BACKUP_RDB" = true ] && [ "$BACKUP_AOF" = true ] && echo "full" || ([ "$BACKUP_RDB" = true ] && echo "rdb" || echo "aof"))",
    "redis_version": "$redis_version",
    "key_count": $key_count,
    "used_memory": "$used_memory",
    "source_host": "$REDIS_HOST",
    "source_port": "$REDIS_PORT",
    "backup_path": "$backup_dir",
    "backup_host": "$(hostname)"
}
EOF

    log_info "Metadata file created"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    find "$BACKUP_ROOT/redis" -maxdepth 1 -type d -name "[0-9]*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true

    log_success "Cleanup completed"
}

# Main backup function
perform_backup() {
    local errors=0

    check_prerequisites

    log_info "Starting Redis backup..."
    log_info "Backup root: $BACKUP_ROOT"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Backup mode: $([ "$BACKUP_RDB" = true ] && [ "$BACKUP_AOF" = true ] && echo "Full (RDB+AOF)" || ([ "$BACKUP_RDB" = true ] && echo "RDB only" || echo "AOF only"))"

    # Create backup directory
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"
    mkdir -p "$backup_dir"

    # Save Redis INFO first (for debugging)
    save_redis_info

    # Backup based on options
    if [ "$BACKUP_RDB" = true ]; then
        backup_rdb || ((errors++))
    fi

    if [ "$BACKUP_AOF" = true ]; then
        backup_aof || ((errors++))
    fi

    # Save keyspace
    save_keyspace

    # Create metadata
    create_metadata

    # Create symlink to latest
    ln -sfn "$backup_dir" "$BACKUP_ROOT/redis/latest"

    # Cleanup
    cleanup_old_backups

    return $errors
}

# Print summary
print_summary() {
    local backup_dir="$BACKUP_ROOT/redis/$BACKUP_DATE"

    echo ""
    echo "========================================"
    echo "     REDIS BACKUP SUMMARY"
    echo "========================================"
    echo "Timestamp: $TIMESTAMP"
    echo "Date: $BACKUP_DATE"
    echo "Backup Location: $backup_dir"
    echo ""
    echo "Files created:"
    [ "$BACKUP_RDB" = true ] && echo "  - RDB: redis_${TIMESTAMP}.rdb"
    [ "$BACKUP_AOF" = true ] && echo "  - AOF: redis_${TIMESTAMP}.aof"
    echo "  - INFO: redis_info_${TIMESTAMP}.txt"
    echo "  - Keyspace: redis_keyspace_${TIMESTAMP}.txt"
    echo ""
    echo "Log File: $LOG_FILE"
    echo "========================================"
}

# Main
main() {
    echo "========================================"
    echo "  REDIS BACKUP"
    echo "========================================"
    echo ""

    local start_time=$(date +%s)

    if perform_backup; then
        print_summary
        log_success "Redis backup completed successfully!"
        exit 0
    else
        print_summary
        log_error "Redis backup completed with errors"
        exit 1
    fi
}

main
