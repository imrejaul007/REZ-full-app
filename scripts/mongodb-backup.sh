#!/bin/bash
# ============================================================
# MongoDB Backup Script
# ============================================================
# Usage:
#   ./mongodb-backup.sh                 # Default: backup all databases
#   ./mongodb-backup.sh <db1> <db2>     # Backup specific databases
#   MONGODB_URI=mongodb://... ./mongodb-backup.sh
#
# Environment Variables:
#   MONGODB_URI         - MongoDB connection URI (required)
#   BACKUP_DIR          - Local backup directory (default: /backups/mongodb)
#   RETENTION_DAYS      - Days to keep backups (default: 30)
#   S3_BUCKET           - S3 bucket name (optional)
#   S3_PREFIX           - S3 key prefix (default: mongodb/)
#   ENCRYPT_BACKUP      - Encrypt backup with GPG (default: false)
#   GPG_RECIPIENT       - GPG recipient email for encryption
# ============================================================

set -e

# Default configuration
BACKUP_DIR="${BACKUP_DIR:-/backups/mongodb}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_PREFIX="${S3_PREFIX:-mongodb}"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/mongodb-backup.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Validate MongoDB URI
if [ -z "$MONGODB_URI" ]; then
    error_exit "MONGODB_URI environment variable is not set"
fi

log "Starting MongoDB backup..."

# Backup filename
BACKUP_NAME="backup_${DATE}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
ARCHIVE_PATH="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"

# Determine which databases to backup
if [ $# -gt 0 ]; then
    # Backup specific databases
    DUMPS_PATH="$BACKUP_PATH"
    mkdir -p "$DUMPS_PATH"

    for db in "$@"; do
        log "Backing up database: $db"
        mongodump --uri="$MONGODB_URI" --db="$db" --out="$DUMPS_PATH" --quiet
    done
else
    # Backup all databases
    log "Backing up all databases"
    mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH" --quiet
fi

# Check if backup was successful
if [ ! -d "$BACKUP_PATH" ] || [ -z "$(ls -A "$BACKUP_PATH")" ]; then
    error_exit "Backup directory is empty - backup may have failed"
fi

# Get backup size for logging
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
log "Backup created: $BACKUP_PATH (size: $BACKUP_SIZE)"

# Compress backup
log "Compressing backup..."
tar -czf "$ARCHIVE_PATH" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

# Encrypt if enabled
if [ "$ENCRYPT_BACKUP" = "true" ] && [ -n "$GPG_RECIPIENT" ]; then
    log "Encrypting backup..."
    gpg --encrypt --recipient "$GPG_RECIPIENT" --output "${ARCHIVE_PATH}.gpg" "$ARCHIVE_PATH"
    rm "$ARCHIVE_PATH"
    ARCHIVE_PATH="${ARCHIVE_PATH}.gpg"
    log "Backup encrypted with GPG"
fi

# Upload to S3 if bucket is configured
if [ -n "$S3_BUCKET" ]; then
    log "Uploading backup to S3: s3://${S3_BUCKET}/${S3_PREFIX}/"
    aws s3 cp "$ARCHIVE_PATH" "s3://${S3_BUCKET}/${S3_PREFIX}/"

    if [ $? -eq 0 ]; then
        log "Backup uploaded to S3 successfully"

        # Create symlink to latest
        ln -sf "$ARCHIVE_PATH" "${BACKUP_DIR}/latest.tar.gz"
        aws s3 cp "$ARCHIVE_PATH" "s3://${S3_BUCKET}/${S3_PREFIX}/latest.tar.gz"
    else
        log "WARNING: Failed to upload backup to S3"
    fi
fi

# Clean up old local backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.tar.gz*" -mtime "+$RETENTION_DAYS" -delete 2>/dev/null || true

# Clean up broken symlinks
find "$BACKUP_DIR" -type l ! -exec test -e {} \; -delete 2>/dev/null || true

# Summary
log "Backup completed successfully"
log "Archive: $ARCHIVE_PATH"
log "Size: $(du -sh "$ARCHIVE_PATH" | cut -f1)"

# Output for alerting/monitoring
echo "MONGODB_BACKUP_STATUS=SUCCESS"
echo "MONGODB_BACKUP_FILE=$ARCHIVE_PATH"
echo "MONGODB_BACKUP_DATE=$DATE"

exit 0
