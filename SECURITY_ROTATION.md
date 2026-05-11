# Security Rotation Guide

This directory contains automated security rotation scripts for the ReZ Full App ecosystem.

## Overview

Security rotation is the practice of regularly changing secrets, keys, and credentials to limit the impact of any potential compromise. This guide covers:

- [rotate-secrets.sh](#rotate-secretssh) - Master secret rotation
- [rotate-jwt.sh](#rotate-jwtsh) - JWT token rotation
- [rotate-api-keys.sh](#rotate-api-keyssh) - External API key rotation
- [audit-access.sh](#audit-accesssh) - Access auditing and compliance

## Quick Start

```bash
# Make scripts executable
chmod +x security/*.sh

# Preview what would rotate (dry run)
./security/rotate-secrets.sh --dry-run

# Rotate all secrets
./security/rotate-secrets.sh

# Run security audit
./security/audit-access.sh --report=full
```

## Script Details

### rotate-secrets.sh

Master script that rotates all types of secrets in the ReZ ecosystem.

**Usage:**
```bash
./security/rotate-secrets.sh [OPTIONS]

Options:
  --dry-run           Preview changes without applying
  --component=NAME    Rotate specific component:
                      - database    : Database passwords
                      - jwt         : JWT secrets
                      - api         : API keys
                      - encryption  : Encryption keys & Redis
                      - all         : Everything (default)
  --verbose           Show detailed output
```

**Components Rotated:**

| Component | Description | Files Modified |
|-----------|-------------|----------------|
| Database | MongoDB passwords | `.env` files |
| Encryption | AES-256 keys | `.env` files |
| Redis | Redis AUTH passwords | `.env` files |
| JWT | Access/Refresh tokens | `.env` files (delegates to rotate-jwt.sh) |
| API Keys | External service keys | `.env` files (delegates to rotate-api-keys.sh) |

**Examples:**
```bash
# Rotate everything
./security/rotate-secrets.sh

# Rotate only database passwords
./security/rotate-secrets.sh --component=database

# Preview JWT rotation
./security/rotate-secrets.sh --component=jwt --dry-run

# Rotate encryption keys only
./security/rotate-secrets.sh --component=encryption
```

---

### rotate-jwt.sh

Rotates JWT secrets for all ReZ services.

**Usage:**
```bash
./security/rotate-jwt.sh [OPTIONS]

Options:
  --dry-run           Preview changes without applying
  --service=NAME      Target specific service:
                      - backend    : Backend API
                      - merchant   : Merchant app
                      - admin      : Admin panel
                      - gateway    : API Gateway
                      - ledger     : Ledger service
                      - all        : All services (default)
```

**Services Covered:**

| Service | Env File | JWT Variables |
|---------|----------|--------------|
| Backend | `rezbackend/.../.env` | `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` |
| Merchant | `rezmerchant/.../.env` | `JWT_MERCHANT_SECRET` |
| Admin | `rezadmin/.../.env` | `JWT_ADMIN_SECRET` |
| Gateway | `rez-api-gateway/.env` | `JWT_SECRET` |
| Ledger | `REZ-Intelligence/.../.env` | `JWT_SECRET`, `LEDGER_JWT_SECRET` |

**JWT Configuration (Production):**
- Access Token Expiry: 15 minutes (recommended)
- Refresh Token Expiry: 7 days (recommended)
- Minimum secret length: 32 bytes (HS256 requirement)

**Examples:**
```bash
# Rotate all JWT secrets
./security/rotate-jwt.sh

# Rotate only backend JWT
./security/rotate-jwt.sh --service=backend

# Preview merchant JWT rotation
./security/rotate-jwt.sh --service=merchant --dry-run
```

---

### rotate-api-keys.sh

Rotates external API keys for payment gateways, cloud services, and third-party APIs.

**Usage:**
```bash
./security/rotate-api-keys.sh [OPTIONS]

Options:
  --dry-run           Preview changes without applying
  --provider=NAME     Target specific provider:
                      - razorpay   : Payment gateway
                      - stripe     : Payment gateway
                      - cloudinary : Media/CDN
                      - aws        : AWS credentials
                      - socket     : Socket.IO secrets
                      - all        : All providers (default)
```

**Provider Rotation Methods:**

| Provider | Rotation Method | Dashboard URL |
|----------|-----------------|---------------|
| Razorpay | Manual via Dashboard | [dashboard.razorpay.com](https://dashboard.razorpay.com/app/keys) |
| Stripe | Manual via Dashboard | [dashboard.stripe.com](https://dashboard.stripe.com/apikeys) |
| Cloudinary | Manual via Console | [console.cloudinary.com](https://console.cloudinary.com/settings/security) |
| AWS | Manual via IAM | [console.aws.amazon.com](https://console.aws.amazon.com/iam/) |
| Socket.IO | Auto-generated | N/A |

**Examples:**
```bash
# Rotate all API keys
./security/rotate-api-keys.sh

# Rotate only payment gateway keys
./security/rotate-api-keys.sh --provider=razorpay

# Scan for exposed keys (without rotating)
./security/rotate-api-keys.sh --provider=all --dry-run
```

**Important Notes:**
- Most API keys (Razorpay, Stripe, AWS) require manual generation via provider dashboards
- This script creates rotation request files with instructions
- After manual rotation, deploy updated `.env` files to all services
- Always test integrations after rotation

---

### audit-access.sh

Audits secret access patterns, detects anomalies, and generates compliance reports.

**Usage:**
```bash
./security/audit-access.sh [OPTIONS]

Options:
  --report=TYPE       Report type:
                      - full       : Complete audit (default)
                      - summary    : Quick overview
                      - compliance : Compliance report only
                      - anomaly    : Anomaly detection only
  --days=N           Days to look back (default: 30)
  --output=FORMAT    Output format:
                      - text       : Plain text (default)
                      - json       : JSON format
                      - html       : HTML report
```

**Audit Sections:**

1. **Secret Inventory** - Lists all secrets across services
2. **Secret Age** - Checks rotation compliance (90-day policy)
3. **Access Patterns** - Analyzes git history for secret access
4. **Configuration Security** - Checks for hardcoded secrets, weak configs
5. **Anomaly Detection** - Identifies suspicious activity
6. **Risk Assessment** - Calculates overall security risk score

**Risk Score Calculation:**

| Score | Level | Action |
|-------|-------|--------|
| 0-19 | LOW | Normal operations |
| 20-39 | MEDIUM | Review within 7 days |
| 40-69 | HIGH | Address within 24 hours |
| 70+ | CRITICAL | Immediate action required |

**Examples:**
```bash
# Full security audit
./security/audit-access.sh --report=full

# Quick summary
./security/audit-access.sh --report=summary

# Generate compliance report in JSON
./security/audit-access.sh --report=compliance --output=json

# Check last 7 days only
./security/audit-access.sh --days=7
```

---

## Cron Job Setup

### Automated Rotation Schedule

Add these entries to your crontab (`crontab -e`):

```cron
# Secret rotation - Weekly (Sunday 2 AM)
0 2 * * 0 /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/rotate-secrets.sh >> /var/log/secret-rotation.log 2>&1

# JWT rotation - Weekly (Sunday 3 AM)
0 3 * * 0 /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/rotate-jwt.sh >> /var/log/jwt-rotation.log 2>&1

# API key rotation - Monthly (1st of month 4 AM)
0 4 1 * * /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/rotate-api-keys.sh >> /var/log/api-key-rotation.log 2>&1

# Security audit - Daily (5 AM)
0 5 * * * /Users/rejaulkarim/Documents/ReZ\ Full\ App/security/audit-access.sh >> /var/log/secret-audit.log 2>&1
```

### Verify Cron Jobs

```bash
# List current crontab
crontab -l

# View rotation logs
tail -f /var/log/secret-rotation.log
tail -f /var/log/jwt-rotation.log
tail -f /var/log/secret-audit.log
```

---

## Verification Steps

After any rotation, verify services are functioning:

### 1. Backend Verification
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rezbackend/rez-backend-master

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check service health
curl http://localhost:5000/health
```

### 2. Database Connection
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/rez-app" --eval "db.adminCommand('ping')"
```

### 3. JWT Validation
```bash
# Generate test token
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({test:1}, process.env.JWT_SECRET, {expiresIn:'1h'}))"
```

### 4. Full Stack Test
```bash
# Run integration tests
npm test -- --testPathPattern=auth

# Check for errors in logs
grep -i "error\|failed\|unauthorized" /var/log/secret-rotation.log
```

---

## Rollback Procedures

If rotation causes issues, rollback immediately:

### 1. Quick Rollback
```bash
# List recent backups
ls -la security/backups/

# Restore from backup
./security/rotate-secrets.sh  # Auto-restores from latest backup
```

### 2. Manual JWT Rollback
```bash
# List JWT backups
ls -la rezbackend/rez-backend-master/.env.jwt_backup.*

# Restore specific timestamp
TIMESTAMP="20260101_120000"
for env_file in rezbackend/rez-backend-master/.env rezmerchant/rez-merchant-master/.env; do
    if [[ -f "${env_file}.jwt_backup.${TIMESTAMP}" ]]; then
        cp "${env_file}.jwt_backup.${TIMESTAMP}" "$env_file"
        echo "Restored: $env_file"
    fi
done
```

### 3. After Rollback
1. Restart all services: `pm2 restart all`
2. Verify authentication works
3. Check service health endpoints
4. Notify team of rollback

---

## Backup Management

### Backup Location
```
security/backups/
  secrets_backup_20260101_120000/
  secrets_backup_20260108_120000/
  ...
```

### Backup Contents
- All `.env` files
- Configuration files with secrets
- Manifest with rotation details

### Retention Policy
- Keep last 10 rotation backups
- Remove backups older than 90 days
- Archive critical backups to secure storage

### Manual Backup
```bash
# Create manual backup
./security/rotate-secrets.sh --dry-run --component=all

# Or manually copy
cp -r security/backups/secrets_backup_20260101_120000 /secure/storage/
```

---

## Security Best Practices

### Secret Management
1. **Never commit secrets** - Use `.gitignore` for `.env*` files
2. **Use environment variables** - Never hardcode secrets in code
3. **Rotate regularly** - Follow the rotation schedule above
4. **Monitor access** - Run audits daily
5. **Use strong secrets** - Minimum 32 bytes, cryptographically random

### Git History Cleanup
If secrets were accidentally committed:

```bash
# Find files with secrets
git log --all -S "YOUR_SECRET" --oneline

# Use git-filter-repo to rewrite history
pip install git-filter-repo
git filter-repo --path-glob '*.env' --invert-paths

# Force push (coordinate with team)
git push --force --all
git push --force --tags
```

### Production Checklist
- [ ] All scripts are executable
- [ ] Cron jobs are configured
- [ ] Backup retention is set
- [ ] Team knows rotation schedule
- [ ] Rollback procedures are documented
- [ ] Monitoring is configured
- [ ] Tests run after rotation

---

## Troubleshooting

### Script Fails with "Permission Denied"
```bash
chmod +x security/*.sh
```

### Secrets Not Found
```bash
# Check env file locations
find . -name ".env*" -type f 2>/dev/null

# Update script paths if needed
# Edit SCRIPT_DIR and PROJECT_ROOT in scripts
```

### Services Won't Start After Rotation
```bash
# 1. Check env file syntax
cat .env | grep -E "^[^=]+=" | head -20

# 2. Verify secret format
# JWT secrets must be 32+ characters

# 3. Restore from backup
# See Rollback Procedures above

# 4. Check service logs
pm2 logs
```

### Audit Reports Missing Data
```bash
# Ensure git history is accessible
git log --oneline -10

# Check file permissions
ls -la security/
```

---

## File Structure

```
security/
├── rotate-secrets.sh      # Master rotation script
├── rotate-jwt.sh          # JWT rotation
├── rotate-api-keys.sh     # API key rotation
├── audit-access.sh        # Security audit
├── backups/               # Rotation backups
│   └── secrets_backup_*/
├── audit-reports/         # Generated audit reports
│   ├── compliance-report-*.json
│   └── exposed-keys-scan-*.txt
├── jwt-rotation-history.json
└── api-key-inventory-*.json
```

---

## Support

For issues or questions:
1. Check script help: `./security/*.sh --help`
2. Review logs in `/var/log/secret-*.log`
3. Check backup manifest for rotation details
4. Verify environment configuration

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-11 | 1.0 | Initial security rotation scripts |

*This documentation is maintained by the Security team. Update this guide when rotation procedures change.*
