# MongoDB Backup System

Automated backup and restore system for the REZ MongoDB replica set.

## Quick Start

### 1. Start the backup container
```bash
docker compose up -d mongodb-backup
```

### 2. Run a manual backup
```bash
docker compose exec mongodb-backup /scripts/mongodb-backup.sh
```

### 3. Verify the backup
```bash
docker compose exec mongodb-backup /scripts/mongodb-backup-verify.sh
```

## Scripts

| Script | Purpose |
|--------|---------|
| `mongodb-backup.sh` | Create backup of all MongoDB databases |
| `mongodb-restore.sh` | Restore from a backup file |
| `mongodb-backup-verify.sh` | Verify backup integrity |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection URI |
| `BACKUP_DIR` | No | `/backups/mongodb` | Local backup directory |
| `RETENTION_DAYS` | No | `30` | Days to keep local backups |
| `S3_BUCKET` | No | - | S3 bucket for cloud storage |
| `S3_PREFIX` | No | `mongodb/` | S3 key prefix |
| `ENCRYPT_BACKUP` | No | `false` | Enable GPG encryption |
| `GPG_RECIPIENT` | No | - | GPG recipient email |

## Usage Examples

### Backup all databases
```bash
docker compose exec mongodb-backup mongodb-backup.sh
```

### Backup specific databases
```bash
docker compose exec mongodb-backup mongodb-backup.sh rez_auth rez_merchant
```

### Restore from latest backup
```bash
docker compose exec mongodb-backup mongodb-restore.sh --latest
```

### Restore from S3 backup
```bash
docker compose exec mongodb-backup mongodb-restore.sh s3://bucket/backup_20240101.tar.gz
```

### Verify backup integrity
```bash
docker compose exec mongodb-backup mongodb-backup-verify.sh
```

### Dry run restore (validate without modifying)
```bash
docker compose exec mongodb-backup mongodb-restore.sh backup_20240101.tar.gz --dry-run
```

## Cron Setup

For automated backups, add entries from `backup-cron.txt` to your crontab:

```bash
crontab -e
```

Add:
```
# Daily backup at 2 AM
0 2 * * * docker exec rez-mongodb-backup mongodb-backup.sh >> /var/log/mongodb-backup.log 2>&1

# Verify backups daily at 6 AM
0 6 * * * docker exec rez-mongodb-backup mongodb-backup-verify.sh >> /var/log/mongodb-backup-verify.log 2>&1
```

## Backup Location

Backups are stored in a Docker volume: `rez_mongodb_backup_data`

To inspect:
```bash
docker compose exec mongodb-backup ls -la /backups/mongodb/
```

## S3 Integration

For cloud backups, configure AWS credentials:
```bash
# In your .env file
MONGODB_S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

Backups will automatically be uploaded to:
`s3://your-backup-bucket/mongodb/backup_YYYYMMDD_HHMMSS.tar.gz`
