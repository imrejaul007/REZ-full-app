# REZ Ecosystem - Backup and Recovery Documentation

## Overview

This directory contains backup and recovery scripts for the REZ ecosystem services, including MongoDB, Redis, and PostgreSQL databases.

## Directory Structure

```
backup/
├── backup-all.sh         # Complete backup of all services
├── backup-mongodb.sh     # MongoDB-specific backup
├── backup-redis.sh       # Redis-specific backup
├── restore-all.sh         # Restore from backups
├── BACKUP_RECOVERY.md    # This documentation
└── (backups stored in ../backups/)
    ├── mongodb/
    ├── redis/
    ├── postgres/
    └── archives/
```

## Quick Start

### Run Full Backup

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/backup
./backup-all.sh
```

### Restore from Backup

```bash
./restore-all.sh --all
```

## Scripts

### 1. backup-all.sh

Backs up all services (MongoDB, Redis, PostgreSQL, configs) in a single operation.

**Usage:**
```bash
./backup-all.sh [OPTIONS]

Options:
  --verify       Verify backups after creation
  --compress     Create compressed archive (default: true)
  --upload-s3    Upload backup to S3 (requires AWS CLI)
  --help         Show help message
```

**Examples:**
```bash
# Basic backup
./backup-all.sh

# Backup with verification
./backup-all.sh --verify

# Backup and upload to S3
./backup-all.sh --verify --upload-s3
```

**Environment Variables:**
- `BACKUP_ROOT` - Backup root directory (default: ../backups)
- `RETENTION_DAYS` - Days to keep backups (default: 30)
- `S3_BUCKET` - S3 bucket for remote backups
- `S3_PREFIX` - S3 prefix for backups

---

### 2. backup-mongodb.sh

Backs up MongoDB databases with verification and metadata.

**Usage:**
```bash
./backup-mongodb.sh [OPTIONS]

Options:
  --all-databases    Backup all databases (including system)
  --single-db <name> Backup specific database only
  --help             Show help message
```

**Examples:**
```bash
# Backup application databases (default)
./backup-mongodb.sh

# Backup specific database
./backup-mongodb.sh --single-db rez_auth_dev

# Backup all databases
./backup-mongodb.sh --all-databases
```

**Output:**
- `mongodb/YYYYMMDD/*.bson` - Collection backups
- `mongodb/YYYYMMDD/metadata.json` - Backup metadata
- `mongodb/YYYYMMDD/mongodb_*.archive.gz` - Compressed archive

---

### 3. backup-redis.sh

Backs up Redis data using RDB snapshots and AOF files.

**Usage:**
```bash
./backup-redis.sh [OPTIONS]

Options:
  --rdb-only    Backup only RDB snapshot
  --aof-only    Backup only AOF file
  --all         Backup both RDB and AOF (default)
  --help        Show help message
```

**Examples:**
```bash
# Full Redis backup (default)
./backup-redis.sh

# RDB only
./backup-redis.sh --rdb-only
```

**Output:**
- `redis/YYYYMMDD/redis_*.rdb` - RDB snapshot
- `redis/YYYYMMDD/redis_*.aof` - AOF file (if enabled)
- `redis/YYYYMMDD/redis_info_*.txt` - Redis INFO output
- `redis/YYYYMMDD/backup_info.json` - Backup metadata

---

### 4. restore-all.sh

Restores services from backups with verification.

**Usage:**
```bash
./restore-all.sh [OPTIONS]

Options:
  --mongodb    Restore MongoDB only
  --redis      Restore Redis only
  --postgres   Restore PostgreSQL only
  --all        Restore all services (default)
  --date YYYYMMDD  Specific backup date
  --dry-run    Preview without restoring
  --yes        Skip confirmation
  --help       Show help message
```

**Examples:**
```bash
# Restore all services (latest backup)
./restore-all.sh --all

# Restore MongoDB from specific date
./restore-all.sh --mongodb --date 20260501

# Preview restore without making changes
./restore-all.sh --all --dry-run

# Restore without confirmation
./restore-all.sh --all --yes
```

---

## Cron Job Setup

### Automated Daily Backup

Add to crontab (`crontab -e`):

```cron
# Daily backup at 2:00 AM
0 2 * * * cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/backup && ./backup-all.sh >> ../backups/logs/cron_backup.log 2>&1

# Every 6 hours
0 */6 * * * cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/backup && ./backup-all.sh >> ../backups/logs/cron_backup.log 2>&1

# Weekly backup (Sunday at 3:00 AM)
0 3 * * 0 cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/backup && ./backup-all.sh --verify >> ../backups/logs/cron_weekly_backup.log 2>&1
```

### macOS LaunchAgent (Alternative)

Create `~/Library/LaunchAgents/com.rez.backup.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rez.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/rejaulkarim/Documents/ReZ Full App/backup/backup-all.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/rejaulkarim/Documents/ReZ Full App/backups/logs/launchd_backup.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/rejaulkarim/Documents/ReZ Full App/backups/logs/launchd_backup_error.log</string>
</dict>
</plist>
```

Load the agent:
```bash
launchctl load ~/Library/LaunchAgents/com.rez.backup.plist
```

---

## Recovery Procedures

### Disaster Recovery - Full System

**Pre-requisites:**
1. Docker must be running
2. All containers must be stopped
3. Backup files must be available

**Steps:**

```bash
# 1. Stop all services
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App
docker compose down

# 2. Backup current data (safety first)
./backup/backup-all.sh

# 3. Restore services
./backup/restore-all.sh --all

# 4. Verify services
docker compose ps
docker compose logs --tail=50
```

### MongoDB Recovery

**Scenario: Data corruption**

```bash
# 1. Identify backup date
ls backups/mongodb/

# 2. Restore specific backup
./backup/restore-all.sh --mongodb --date 20260501

# 3. Verify collections
docker exec rez-mongodb-primary mongosh --eval "db.adminCommand({listDatabases:1})"
```

**Scenario: Single collection recovery**

```bash
# 1. Extract specific database from backup
tar -xzf backups/mongodb/20260501/mongodb_*.archive.gz

# 2. Restore specific collection
docker exec rez-mongodb-primary mongorestore \
  --uri=mongodb://localhost:27017 \
  --nsFrom="rez_dev.orders" \
  --nsTo="rez_dev.orders" \
  --path=/path/to/backup
```

### Redis Recovery

**Scenario: Cache data loss**

```bash
# 1. Restore from RDB
./backup/restore-all.sh --redis

# 2. Verify keys
docker exec rez-redis redis-cli DBSIZE
docker exec rez-redis redis-cli KEYS "*" | head -20
```

### PostgreSQL Recovery

**Scenario: Transactional data recovery**

```bash
# 1. Restore database
./backup/restore-all.sh --postgres --date 20260501

# 2. Verify tables
docker exec rez-postgres psql -U rez -d rez_dev -c "\dt"
docker exec rez-postgres psql -U rez -d rez_dev -c "SELECT COUNT(*) FROM users;"
```

---

## Verification

### Manual Verification

```bash
# MongoDB
docker exec rez-mongodb-primary mongosh --eval "db.adminCommand({ping:1})"

# Redis
docker exec rez-redis redis-cli ping

# PostgreSQL
docker exec rez-postgres pg_isready -U rez
```

### Script Verification

```bash
./backup-all.sh --verify
```

### Check Backup Integrity

```bash
# Check backup files exist
ls -la backups/mongodb/$(date +%Y%m%d)/
ls -la backups/redis/$(date +%Y%m%d)/
ls -la backups/postgres/$(date +%Y%m%d)/

# Verify BSON files
find backups/mongodb/$(date +%Y%m%d) -name "*.bson" -exec file {} \;

# Verify RDB file
file backups/redis/$(date +%Y%m%d)/redis_*.rdb

# Verify SQL dump
zcat backups/postgres/$(date +%Y%m%d)/*.sql.gz | head -20
```

---

## Backup Retention

Default retention: **30 days**

| Backup Type | Location | Retention |
|-------------|---------|-----------|
| MongoDB | `backups/mongodb/YYYYMMDD/` | 30 days |
| Redis | `backups/redis/YYYYMMDD/` | 30 days |
| PostgreSQL | `backups/postgres/YYYYMMDD/` | 30 days |
| Archives | `backups/archives/` | 90 days |
| Logs | `backups/logs/` | 90 days |

To change retention:
```bash
RETENTION_DAYS=60 ./backup-all.sh
```

---

## Remote Backup (S3)

### Configure S3 Backup

Set environment variables:
```bash
export S3_BUCKET=your-bucket-name
export S3_PREFIX=rez-backups
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1
```

Run backup with S3 upload:
```bash
./backup-all.sh --upload-s3
```

### Restore from S3

```bash
# Download backup
aws s3 sync s3://your-bucket/rez-backups/20260501/ ./backups/

# Restore
./restore-all.sh --all --date 20260501
```

---

## Troubleshooting

### Backup Fails - MongoDB Container Not Running

```bash
# Start MongoDB
docker compose up -d mongodb-primary mongodb-secondary-1 mongodb-secondary-2

# Wait for healthy
docker compose ps mongodb-primary

# Retry backup
./backup-mongodb.sh
```

### Backup Fails - Redis Authentication Error

```bash
# Check Redis password in .env
grep REDIS_PASSWORD ../.env

# Set password if empty
export REDIS_PASSWORD=your-password
./backup-redis.sh
```

### Restore Fails - Container Not Stopped

```bash
# Stop container first
docker stop rez-redis

# Or use force
./restore-redis.sh --force
```

### Large Backup Size

MongoDB dumps can be large. Use compression:
```bash
# Enable compression (automatic in default scripts)
./backup-mongodb.sh

# Or manually
tar -czf backup.tar.gz backups/mongodb/20260501/
```

---

## Best Practices

1. **Schedule Regular Backups**
   - Daily incremental backups
   - Weekly full backups
   - Test restores monthly

2. **Monitor Backup Success**
   - Check logs: `backups/logs/backup-*.log`
   - Set up alerts for failures
   - Monitor disk usage

3. **Test Restores**
   - Test restore process quarterly
   - Verify data integrity
   - Document recovery time

4. **Secure Backups**
   - Restrict backup directory permissions
   - Encrypt sensitive data
   - Use secure remote storage

5. **Maintain Documentation**
   - Keep this file updated
   - Document any issues
   - Record recovery times

---

## Service Ports Reference

| Service | Port | Container Name |
|---------|------|---------------|
| MongoDB Primary | 27017 | rez-mongodb-primary |
| MongoDB Secondary 1 | 27018 | rez-mongodb-secondary-1 |
| MongoDB Secondary 2 | 27019 | rez-mongodb-secondary-2 |
| Redis | 6379 | rez-redis |
| PostgreSQL | 5432 | rez-postgres |

---

## Contact & Support

For issues or questions:
- Check logs: `backups/logs/`
- Review Docker status: `docker compose ps`
- Check service logs: `docker compose logs <service>`
