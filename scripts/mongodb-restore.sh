#!/bin/bash
# ============================================================
# MongoDB Restore Script
# ============================================================
# Usage:
#   ./mongodb-restore.sh <backup_file>                    # Restore from local file
#   ./mongodb-restore.sh s3://bucket/path/to/backup.tar.gz  # Restore from S3
#   ./mongodb-restore.sh --latest                          # Restore from latest backup
#
# Options:
#   --dry-run       - Validate backup without restoring
#   --db <name>     - Restore specific database only
#   --drop          - Drop database before restore (CAREFUL!)
#
# Environment Variables:
#   MONGODB_URI              - Target MongoDB connection URI (required)
#   BACKUP_DIR               - Local backup directory (default: /backups/mongodb)
#   S3_BUCKET                - S3 bucket name
#   S3_PREFIX                - S3 key prefix (default: mongodb/)
# ============================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups/mongodb}"
S3_PREFIX="${S3_PREFIX:-mongodb}"
LOG_FILE="/var/log/mongodb-restore.log"
DRY_RUN=false
DROP_DATABASE=false
RESTORE_DB=""

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --drop)
            DROP_DATABASE=true
            shift
            ;;
        --db)
            RESTORE_DB="$2"
            shift 2
            ;;
        --latest)
            LATEST_BACKUP=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -exec stat -f "%m %N" {} \; | sort -rn | head -1 | cut -d' ' -f2)
            if [ -z "$LATEST_BACKUP" ]; then
                error_exit "No local backup found"
            fi
            BACKUP_FILE="$LATEST_BACKUP"
            shift
            ;;
        s3://*)
            BACKUP_FILE="$1"
            shift
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Validate inputs
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file|s3://path|--latest> [options]"
    echo ""
    echo "Options:"
    echo "  --dry-run       Validate backup without restoring"
    echo "  --db <name>     Restore specific database only"
    echo "  --drop          Drop database before restore (CAUTION!)"
    echo ""
    echo "Environment Variables:"
    echo "  MONGODB_URI     Target MongoDB connection URI"
    echo "  BACKUP_DIR      Local backup directory (default: /backups/mongodb)"
    echo "  S3_BUCKET       S3 bucket name for cloud restore"
    exit 1
fi

if [ -z "$MONGODB_URI" ]; then
    error_exit "MONGODB_URI environment variable is not set"
fi

log "Starting MongoDB restore..."

# Download from S3 if needed
if [[ "$BACKUP_FILE" == s3://* ]]; then
    log "Downloading backup from S3: $BACKUP_FILE"
    aws s3 cp "$BACKUP_FILE" /tmp/
    BACKUP_FILE=$(basename "$BACKUP_FILE")
    EXTRACT_DIR="/tmp/$(basename "$BACKUP_FILE" .tar.gz)"

    if [[ "$BACKUP_FILE" == *.gpg ]]; then
        log "Decrypting backup..."
        gpg --decrypt --output "/tmp/${BACKUP_FILE%.gpg}" "/tmp/$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE%.gpg}"
    fi

    tar -xzf "/tmp/$BACKUP_FILE" -C /tmp/
    BACKUP_PATH="$EXTRACT_DIR"
else
    # Local file
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file not found: $BACKUP_FILE"
    fi

    # Decrypt if needed
    if [[ "$BACKUP_FILE" == *.gpg ]]; then
        log "Decrypting backup..."
        gpg --decrypt --output "${BACKUP_FILE%.gpg}" "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE%.gpg}"
    fi

    # Extract to temp directory
    EXTRACT_DIR=$(mktemp -d)
    log "Extracting backup..."
    tar -xzf "$BACKUP_FILE" -C "$EXTRACT_DIR"
    BACKUP_PATH="$EXTRACT_DIR/$(ls "$EXTRACT_DIR" | head -n1)"
fi

# Validate backup contents
if [ ! -d "$BACKUP_PATH" ]; then
    error_exit "Invalid backup: directory not found after extraction"
fi

log "Backup contents validated at: $BACKUP_PATH"

# Show backup info
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
DB_COUNT=$(find "$BACKUP_PATH" -maxdepth 1 -type d | wc -l | xargs echo)
log "Backup size: $BACKUP_SIZE"
log "Databases in backup: $((DB_COUNT - 1))"

if [ "$DRY_RUN" = true ]; then
    log "DRY RUN MODE - Listing backup contents:"
    find "$BACKUP_PATH" -type d -maxdepth 2 | sed 's|'"$BACKUP_PATH"'/||' | head -20
    log "DRY RUN completed - no changes made"

    # Cleanup
    rm -rf "$EXTRACT_DIR" 2>/dev/null || true
    exit 0
fi

# Build restore command
RESTORE_OPTS="--uri=$MONGODB_URI --dir=$BACKUP_PATH --quiet"

if [ "$DROP_DATABASE" = true ]; then
    log "WARNING: DROP option enabled - will drop target database(s)"
    if [ -n "$RESTORE_DB" ]; then
        RESTORE_OPTS="$RESTORE_OPTS --drop --db=$RESTORE_DB"
    else
        RESTORE_OPTS="$RESTORE_OPTS --drop"
    fi
fi

if [ -n "$RESTORE_DB" ]; then
    log "Restoring database: $RESTORE_DB"
    RESTORE_OPTS="$RESTORE_OPTS --db=$RESTORE_DB"
fi

# Perform restore
log "Starting restore..."
if mongorestore $RESTORE_OPTS; then
    log "Restore completed successfully"
else
    error_exit "Restore failed with exit code $?"
fi

# Cleanup
log "Cleaning up temporary files..."
rm -rf "$EXTRACT_DIR" 2>/dev/null || true
rm -f "/tmp/$BACKUP_FILE" 2>/dev/null || true
rm -f "/tmp/${BACKUP_FILE%.gpg}" 2>/dev/null || true

log "Restore process complete"
echo "MONGODB_RESTORE_STATUS=SUCCESS"
echo "MONGODB_RESTORE_SOURCE=$BACKUP_FILE"
echo "MONGODB_RESTORE_DATE=$(date '+%Y-%m-%d %H:%M:%S')"

exit 0
