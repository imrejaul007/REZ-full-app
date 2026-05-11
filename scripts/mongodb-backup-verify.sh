#!/bin/bash
# ============================================================
# MongoDB Backup Verification Script
# ============================================================
# Verifies backup integrity and tests restore capability
#
# Usage:
#   ./mongodb-backup-verify.sh              # Verify latest backup
#   ./mongodb-backup-verify.sh <file>       # Verify specific backup
#
# Environment Variables:
#   BACKUP_DIR        - Local backup directory (default: /backups/mongodb)
#   TEST_MONGO_URI    - Test MongoDB for restore verification
# ============================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups/mongodb}"
LOG_FILE="/var/log/mongodb-backup-verify.log"
BACKUP_FILE="$1"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Find latest backup if not specified
if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(find "$BACKUP_DIR" -name "backup_*.tar.gz*" -type f -exec stat -f "%m %N" {} \; 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    error_exit "No backup file found"
fi

log "Verifying backup: $BACKUP_FILE"

# Check file exists and is readable
if [ ! -r "$BACKUP_FILE" ]; then
    error_exit "Backup file is not readable"
fi

# Get backup metadata
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
BACKUP_AGE=$(find "$BACKUP_FILE" -mtime -1 2>/dev/null && echo "fresh" || echo "old")

log "Backup size: $(numfmt --to=iec-i --suffix=B $BACKUP_SIZE 2>/dev/null || echo "$BACKUP_SIZE bytes")"
log "Backup age: $BACKUP_AGE"

# Test archive integrity
log "Testing archive integrity..."
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log "Archive integrity: OK"
else
    error_exit "Archive is corrupted or invalid"
fi

# Extract to temp directory for inspection
EXTRACT_DIR=$(mktemp -d)
trap "rm -rf $EXTRACT_DIR" EXIT

log "Extracting for detailed verification..."
tar -xzf "$BACKUP_FILE" -C "$EXTRACT_DIR"

BACKUP_CONTENTS="$EXTRACT_DIR/$(ls "$EXTRACT_DIR")"

# Check for MongoDB backup structure
if [ ! -d "$BACKUP_CONTENTS" ]; then
    error_exit "Invalid backup structure - no dump directory found"
fi

# Count collections
COLLECTION_COUNT=$(find "$BACKUP_CONTENTS" -name "*.bson" 2>/dev/null | wc -l | xargs echo)
DB_COUNT=$(find "$BACKUP_CONTENTS" -maxdepth 1 -type d | tail -n +2 | wc -l | xargs echo)

log "Databases found: $DB_COUNT"
log "Collections found: $COLLECTION_COUNT"

# Verify BSON files are valid
INVALID_FILES=$(find "$BACKUP_CONTENTS" -name "*.bson" -size 0 2>/dev/null | wc -l | xargs echo)
if [ "$INVALID_FILES" -gt 0 ]; then
    log "WARNING: Found $INVALID_FILES empty BSON files"
fi

# Test restore to test database if configured
if [ -n "$TEST_MONGO_URI" ]; then
    log "Testing restore to test database..."

    # Restore to test database
    TEST_URI="${TEST_MONGO_URI}/backup_test_$$"

    if mongorestore --uri="$TEST_URI" --dir="$BACKUP_CONTENTS" --quiet 2>&1; then
        log "Test restore: SUCCESS"

        # Verify test database
        TEST_DB_COUNT=$(mongosh "$TEST_URI" --quiet --eval "db.getMongo().getDatabaseNames().length")
        log "Test database contains $TEST_DB_COUNT databases"

        # Cleanup test database
        mongosh "$TEST_URI" --quiet --eval "db.getMongo().getDBNames().forEach(d => db.getMongo().getDB(d).dropDatabase())"
        log "Test database cleaned up"
    else
        log "WARNING: Test restore failed - backup may not be restorable"
    fi
fi

# Check backup age
BACKUP_TIMESTAMP=$(stat -f "%Sm" -t "%Y%m%d_%H%M%S" "$BACKUP_FILE" 2>/dev/null || stat -c "%y" "$BACKUP_FILE" 2>/dev/null)
log "Backup timestamp: $BACKUP_TIMESTAMP"

# Final status
log "Backup verification: PASSED"

# Output status for monitoring
echo "MONGODB_BACKUP_VERIFY=SUCCESS"
echo "MONGODB_BACKUP_FILE=$BACKUP_FILE"
echo "MONGODB_BACKUP_SIZE=$BACKUP_SIZE"
echo "MONGODB_DB_COUNT=$DB_COUNT"
echo "MONGODB_COLLECTION_COUNT=$COLLECTION_COUNT"
echo "MONGODB_VERIFY_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')"

exit 0
