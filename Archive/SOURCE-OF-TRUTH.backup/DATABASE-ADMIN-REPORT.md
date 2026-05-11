# Database Administration Report - REZ Ecosystem

**Audit Date:** May 4, 2026
**Report Version:** 1.0
**Prepared By:** Database Administration Lead

---

## Executive Summary

This report provides a comprehensive audit of the REZ ecosystem's database infrastructure, covering MongoDB databases, PostgreSQL instances, and Redis caching layers. The ecosystem comprises 75+ microservices with diverse data storage requirements.

### Key Findings

| Category | Status | Risk Level |
|----------|--------|------------|
| MongoDB Services | 15+ configured | Medium |
| PostgreSQL Databases | 6+ configured | Low |
| Redis Integration | Partially implemented | Medium |
| Backup Infrastructure | Complete | Low |
| Index Management | Inconsistent | High |
| Connection Pooling | Varied | Medium |

---

## 1. Database Inventory

### 1.1 MongoDB Databases

| Service | Database | Connection Pool | Auto-Index | TTL Support |
|---------|----------|-----------------|------------|-------------|
| `rez-wallet-service` | MONGODB_URI | maxPoolSize: 10, minPoolSize: 2 | Disabled (prod) | Yes |
| `rez-payment-service` | MONGODB_URI | maxPoolSize: 20, minPoolSize: 5 | Disabled (prod) | Yes |
| `rez-merchant-service` | MONGODB_URI | maxPoolSize: 20, minPoolSize: 5 | Disabled (prod) | Yes |
| `rez-order-service` | MONGODB_URI | Implicit via Mongoose | Disabled (prod) | Yes |
| `rez-auth-service` | MONGODB_URI | Implicit via Mongoose | Disabled (prod) | Yes |
| `rez-profile-service` | MONGODB_URI | maxPoolSize: 10 | Disabled (prod) | Yes |
| `rez-ads-service` | MONGODB_URI | maxPoolSize: 10, minPoolSize: 2 | Disabled (prod) | Yes |
| `rez-targeting-engine` | MONGODB_URI | maxPoolSize: 10, minPoolSize: 2 | Disabled (prod) | Yes |
| `rez-gamification-service` | MONGODB_URI | maxPoolSize: 10 | Disabled (prod) | Yes |
| `rez-media-events` | MONGODB_URI | maxPoolSize: 10 | Disabled (prod) | Yes |
| `rez-user-intelligence-service` | MONGODB_URI | maxPoolSize: 10, minPoolSize: 2 | Disabled (prod) | Yes |
| `rez-travel-service` | MONGODB_URI | Implicit via Mongoose | Disabled (prod) | Yes |
| `rez-search-service` | MONGODB_URI | Implicit via Mongoose | Disabled (prod) | Yes |
| `rez-karma-service` | MONGODB_URI | Implicit via Mongoose | Disabled (prod) | Yes |
| `rez-intent-graph` | MONGODB_URI | Implicit via Mongoose | Disabled (prod) | Yes |

#### MongoDB Connection Configuration

**Production URI Pattern:**
```
mongodb+srv://work_db_user:***@cluster0.ku78x6g.mongodb.net/rez-app?retryWrites=true&w=majority
```

**Replica Set Configuration:**
```
mongodb://rez_admin:password@localhost:27017,localhost:27018,localhost:27019/rez_dev?replicaSet=rs0&authSource=admin
```

### 1.2 PostgreSQL Databases

| Database | Provider | Connection Limit | Schema Count | Prisma |
|----------|----------|-----------------|--------------|--------|
| Hotel OTA (dpg-d7ackuma2pns73debo70-a) | Render PostgreSQL | 20 (default) | N/A | No |
| RestaurantHub | PostgreSQL | 20 | 70+ models | Yes |
| Rendez | PostgreSQL | Default | Multiple models | Yes |
| Rez-Web-Menu | PostgreSQL | Default | Store/Category/Menu models | Yes |
| Rez-Try | PostgreSQL | Default | Trial/Booking models | Yes |
| Verify-Service | PostgreSQL | Default | Brand/Product models | Yes |
| AdsQR | PostgreSQL | Default | Campaign/QR models | Yes |

#### RestaurantHub Schema Analysis

The RestaurantHub database contains **70+ models** including:
- User management (User, Profile, Session)
- Restaurant operations (Restaurant, Branch, Employee)
- E-commerce (Product, Order, Cart, Payment)
- Financial (Invoice, Payment, Refund, Account, JournalEntry)
- Community (ForumPost, Comment, Like, Share)
- Inventory (StockMovement, InventoryBatch)
- GDPR compliance (UserConsent, DataExportRequest)

### 1.3 Redis Configuration

| Service | Redis URL | Auth | Sentinel | Purpose |
|---------|-----------|------|----------|---------|
| `rez-ads-service` | rediss://default:***@flexible-ewe-84459.upstash.io:6379 | TLS | No | Click deduplication, rate limiting |
| RestaurantHub | Configured in .env | Password | Optional | Session, cache, rate limiting |

**Upstash Redis Usage:**
- Used by `rez-ads-service` for production
- Supports TLS connections (`rediss://`)
- Upstash provides serverless Redis with automatic scaling

---

## 2. Index Analysis

### 2.1 MongoDB Indexes by Service

#### rez-ads-service (Campaigns & Interactions)

```typescript
// AdCampaign indexes
AdCampaignSchema.index({ startDate: 1, endDate: 1 });
AdCampaignSchema.index({ merchantId: 1, status: 1 });
AdCampaignSchema.index({ status: 1, placement: 1, startDate: 1, endDate: 1 });
AdCampaignSchema.index({ merchantId: 1, status: 1, startDate: 1, endDate: 1 });
AdCampaignSchema.index({ status: 1, bidType: 1, dailyBudget: -1 });
AdCampaignSchema.index({ deletedAt: 1 });

// AdInteraction indexes
AdInteractionSchema.index({ campaignId: 1, type: 1, createdAt: -1 });
AdInteractionSchema.index({ userId: 1, campaignId: 1, createdAt: -1 });
AdInteractionSchema.index({ orderId: 1, campaignId: 1 });
```

#### rez-wallet-service (Financial Transactions)

```typescript
// merchantpayouts collection
db.collection('merchantpayouts').createIndex({ merchantId: 1, requestedAt: -1 });
db.collection('merchantpayouts').createIndex({ status: 1, requestedAt: 1 });

// Savings indexes (via savingsIndexes.ts)
db.collection('savingsentries').createIndexes([...]);
db.collection('savingsgoals').createIndexes([...]);
db.collection('aml_alerts').createIndexes([...]);
```

#### rez-profile-service (User Data)

```typescript
UserProfileSchema.index({ email: 1 }, { sparse: true });
UserProfileSchema.index({ phone: 1 }, { sparse: true });
UserProfileSchema.index({ deletedAt: 1 });
AddressSchema.index({ userId: 1, addressId: 1 }, { unique: true });
PaymentMethodSchema.index({ userId: 1, methodId: 1 }, { unique: true });
```

#### rez-targeting-engine (Campaign Triggers)

```typescript
CampaignTriggerSchema.index({ campaign_id: 1, status: 1 });
CampaignTriggerSchema.index({ campaign_id: 1, created_at: -1 });
CampaignTriggerSchema.index({ user_id: 1, created_at: -1 });
CampaignTriggerSchema.index({ variant_id: 1, status: 1 });
// TTL index for 90-day expiration
CampaignTriggerSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

FrequencyCapSchema.index({ user_id: 1, channel: 1, campaign_id: 1 }, { unique: true });
FrequencyCapSchema.index({ last_impression_at: 1 });
```

#### rez-user-intelligence-service (User Analytics)

```typescript
UserProfileSchema.index({ 'lifetimeValue.totalRevenue': -1 });
UserProfileSchema.index({ 'behavioralScores.engagementScore': -1 });
UserProfileSchema.index({ 'behavioralScores.valueSegment': 1 });
UserProfileSchema.index({ 'metadata.segments': 1 });
UserProfileSchema.index({ 'metadata.tags': 1 });
// TTL index for 90-day event history
UserProfileSchema.index({ 'eventHistory.timestamp': 1 }, { expireAfterSeconds: 7776000 });
```

### 2.2 PostgreSQL Indexes

#### RestaurantHub Prisma Schema Indexes

Key composite indexes in the RestaurantHub database:

```prisma
// User model
@@index([email])
@@index([phone])
@@index([role, isActive])
@@index([email, isActive])
@@index([resetTokenHash])
@@index([refreshToken])

// Order model
@@index([restaurantId])
@@index([orderNumber])
@@index([status])
@@index([createdAt])
@@index([idempotencyKey])

// Product model
@@index([status, stock])
@@index([categoryId, status])
@@index([price, status])
@@index([rating, status])

// Session model
@@unique([userId, badgeType])
```

### 2.3 Index Recommendations

| Priority | Service | Collection | Recommendation |
|----------|---------|------------|----------------|
| High | rez-order-service | orders | Add index on `{status, createdAt}` for status filtering |
| High | rez-payment-service | transactions | Add index on `{merchantId, createdAt}` for reporting |
| Medium | rez-profile-service | users | Consider index on `{updatedAt}` for sync jobs |
| Medium | All services | All | Audit sparse indexes for NULL handling |
| Low | rez-targeting-engine | triggers | Monitor TTL index cleanup performance |

---

## 3. Backup Infrastructure

### 3.1 MongoDB Backup System

**Location:** `/scripts/mongodb-backup.sh`

| Feature | Status | Notes |
|---------|--------|-------|
| Full database backup | Implemented | Uses `mongodump` |
| Selective backup | Implemented | Supports specific databases |
| Compression | Implemented | tar.gz compression |
| S3 integration | Implemented | AWS CLI required |
| GPG encryption | Optional | Requires GPG recipient |
| Retention policy | Configurable | Default 30 days |
| Verification | Implemented | `mongodb-backup-verify.sh` |

**Backup Cron Schedule:**
```bash
# Daily backup at 2 AM
0 2 * * * root /scripts/mongodb-backup.sh >> /var/log/mongodb-backup.log 2>&1

# Every 6 hours for high-frequency data
0 */6 * * * root /scripts/mongodb-backup.sh >> /var/log/mongodb-backup.log 2>&1

# Weekly full backup - Sunday at 3 AM
0 3 * * 0 root MONGODB_URI=${MONGODB_URI} RETENTION_DAYS=90 /scripts/mongodb-backup.sh

# Verify backups - daily at 6 AM
0 6 * * * root /scripts/mongodb-backup-verify.sh >> /var/log/mongodb-backup-verify.log 2>&1
```

**Environment Variables:**
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MONGODB_URI | Yes | - | MongoDB connection URI |
| BACKUP_DIR | No | `/backups/mongodb` | Local backup directory |
| RETENTION_DAYS | No | 30 | Days to keep backups |
| S3_BUCKET | No | - | S3 bucket for cloud storage |
| ENCRYPT_BACKUP | No | false | Enable GPG encryption |

### 3.2 PostgreSQL Backup System (RestaurantHub)

**Location:** `/Resturistan App/restauranthub/scripts/backup-daemon.sh`

| Feature | Status | Notes |
|---------|--------|-------|
| Daily backup | Implemented | Scheduled at 2 AM |
| Weekly backup | Implemented | Sunday execution |
| Monthly backup | Implemented | 1st of month |
| S3 sync | Implemented | Via `s3-sync.sh` |
| Restoration test | Implemented | Weekly |
| Health monitoring | Implemented | Hourly checks |
| Alerting | Implemented | Webhook + email |

**Health Check Parameters:**
- Database connectivity (`pg_isready`)
- Backup directory accessibility
- Disk usage (warn >80%, critical >90%)
- Recent backup existence

### 3.3 Backup Verification

Both backup systems include verification:

```bash
# MongoDB verification checks:
- Archive integrity (tar -tzf)
- BSON file validity
- Optional test restore to TEST_MONGO_URI
- Backup age and freshness
- Database and collection counts
```

---

## 4. Connection Pool Analysis

### 4.1 MongoDB Connection Pool Settings

| Service | maxPoolSize | minPoolSize | Notes |
|---------|-------------|-------------|-------|
| rez-wallet-service | 10 | 2 | Good |
| rez-payment-service | 20 | 5 | Good |
| rez-merchant-service | 20 | 5 | Good |
| rez-ads-service | 10-20 | 2-5 | Varied |
| rez-profile-service | 10 | (default) | Moderate |
| rez-targeting-engine | 10 | 2 | Good |
| rez-gamification-service | 10 | (default) | Moderate |
| rez-media-events | 10 | (default) | Moderate |
| rez-user-intelligence-service | 10 | 2 | Good |

### 4.2 PostgreSQL Connection Pooling

**RestaurantHub PrismaService:**
```typescript
// Connection pool monitoring implemented
// Statement timeouts set:
// - statement_timeout = '30s'
// - idle_in_transaction_session_timeout = '5min'
// - lock_timeout = '10s'

// Metrics tracked:
// - totalConnections
// - activeConnections
// - idleConnections
// - waitingConnections
// - queryCount
// - slowQueries (>1000ms)
```

### 4.3 Connection Pool Recommendations

| Priority | Issue | Recommendation |
|----------|-------|----------------|
| High | Inconsistent pool sizes | Standardize to maxPoolSize: 20, minPoolSize: 5 |
| High | No pool monitoring | Add metrics export for all services |
| Medium | Missing retry logic | Implement exponential backoff |
| Medium | No connection draining | Add graceful shutdown for connections |

---

## 5. Security Review

### 5.1 Authentication

| Database | Auth Method | Status |
|----------|-------------|--------|
| MongoDB | Username/Password | Configured with authSource |
| PostgreSQL | Username/Password | Configured in DATABASE_URL |
| Redis | Password/TLS | Upstash uses TLS |

### 5.2 Secrets Management

**Observed Patterns:**
- `MONGODB_URI` with embedded credentials (partial exposure in logs)
- `REDIS_URL` with password in URL
- JWT secrets generated via `openssl rand -base64 64`

**Security Observations:**

| Finding | Severity | Status |
|---------|----------|--------|
| MongoDB credentials in URI | Medium | Masked in logs (maskUri function) |
| Redis URL with password | Medium | TLS for Upstash |
| No secret rotation policy | High | Not observed |
| Hardcoded credentials in .env.example | Low | Templates show placeholder values |

### 5.3 Security Recommendations

| Priority | Recommendation |
|----------|----------------|
| High | Implement secret rotation policy (90-day minimum) |
| High | Use environment-specific secret management (Vault/Parameter Store) |
| Medium | Add connection string sanitization in error logs |
| Medium | Implement audit logging for database access |
| Low | Consider mTLS for MongoDB in production |

---

## 6. Performance Recommendations

### 6.1 Query Optimization

| Service | Issue | Recommendation |
|---------|-------|----------------|
| All | No slow query logging | Enable `log_min_duration_statement` |
| All | Missing composite indexes | Add for common filter combinations |
| rez-order-service | High read volume | Consider read replicas |
| All | No query timeouts | Implement statement_timeout |

### 6.2 Caching Strategy

**Current Redis Usage:**
- `rez-ads-service`: Click deduplication, rate limiting
- RestaurantHub: Session storage, caching (configured but usage patterns unclear)

**Recommended Caching Layers:**

| Data Type | Cache TTL | Invalidation Strategy |
|-----------|-----------|---------------------|
| User profiles | 5 minutes | On profile update |
| Product catalog | 15 minutes | On inventory change |
| Session tokens | Until expiry | On logout |
| API responses | 1-5 minutes | TTL-based |
| Rate limit counters | 1 minute | TTL-based |

### 6.3 Connection Management

```typescript
// Recommended MongoDB configuration
const mongooseOptions = {
  maxPoolSize: 20,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  journal: true,
  autoIndex: process.env.NODE_ENV !== 'production',
  autoCreate: process.env.NODE_ENV !== 'production',
};
```

---

## 7. Monitoring & Observability

### 7.1 Current Monitoring

**Grafana Dashboards Found:**
- `/grafana/unified-dashboard.json` - PostgreSQL metrics
- `/grafana/unified-services-dashboard.json` - Service metrics
- `/Resturistan App/restauranthub/monitoring/grafana/dashboards/database-performance.json`

### 7.2 Recommended Metrics

| Metric | Type | Alert Threshold |
|--------|------|----------------|
| connection_pool_utilization | Gauge | > 80% |
| slow_query_count | Counter | > 10/minute |
| connection_errors | Counter | > 5/minute |
| backup_last_success_timestamp | Gauge | > 24 hours |
| backup_verify_status | Gauge | 0 = fail, 1 = pass |
| replication_lag_seconds | Gauge | > 10 seconds |

### 7.3 Alerts Configuration

```yaml
# Recommended alert rules
alerts:
  - name: backup_failure
    condition: backup_last_success_timestamp > 24h
    severity: critical

  - name: high_connection_usage
    condition: connection_pool_utilization > 80%
    severity: warning

  - name: slow_query_spike
    condition: slow_query_count > 100
    severity: warning
```

---

## 8. Disaster Recovery

### 8.1 RTO/RPO Targets

| Database Tier | RTO | RPO | Current Capability |
|---------------|-----|-----|-------------------|
| Core services (wallet, payment) | 15 minutes | 1 hour | Backup + restore |
| Business services (merchant, order) | 1 hour | 4 hours | Backup + restore |
| Analytics (intelligence, targeting) | 4 hours | 24 hours | Backup + restore |

### 8.2 Recovery Procedures

**MongoDB Restore:**
```bash
# Full restore
./mongodb-restore.sh backup_20240101.tar.gz

# Selective database restore
./mongodb-restore.sh backup_20240101.tar.gz --db rez_wallet

# From S3
./mongodb-restore.sh s3://bucket/backup_20240101.tar.gz

# Dry run (validation only)
./mongodb-restore.sh backup_20240101.tar.gz --dry-run
```

**PostgreSQL Restore:**
```bash
# Point-in-time recovery (requires WAL archiving)
pg_restore -h host -U user -d database backup.dump
```

### 8.3 DR Recommendations

| Priority | Recommendation |
|----------|----------------|
| High | Test restoration quarterly |
| High | Document manual failover procedures |
| Medium | Implement cross-region backup replication |
| Medium | Add database health to runbooks |
| Low | Consider MongoDB Atlas for managed backups |

---

## 9. Action Items

### Immediate (This Week)

- [ ] Audit all MongoDB connection strings for hardcoded credentials
- [ ] Verify backup script execution on all environments
- [ ] Check disk space on backup volumes
- [ ] Review connection pool utilization metrics

### Short-term (This Month)

- [ ] Standardize MongoDB connection pool settings across services
- [ ] Implement slow query logging in production
- [ ] Add backup verification to monitoring alerts
- [ ] Document database access procedures

### Long-term (This Quarter)

- [ ] Implement secret rotation policy
- [ ] Add read replicas for high-traffic services
- [ ] Evaluate managed database services (Atlas, Upstash)
- [ ] Conduct disaster recovery drill

---

## Appendix A: Service Database Mapping

| Service | Primary DB | Secondary DB | Notes |
|---------|-----------|--------------|-------|
| rez-wallet-service | MongoDB | - | Financial transactions |
| rez-payment-service | MongoDB | - | Payment processing |
| rez-merchant-service | MongoDB | - | Merchant data |
| rez-order-service | MongoDB | - | Order management |
| rez-auth-service | MongoDB | - | User authentication |
| rez-profile-service | MongoDB | - | User profiles |
| rez-ads-service | MongoDB | PostgreSQL | Campaign data |
| rez-targeting-engine | MongoDB | - | Campaign triggers |
| rez-gamification-service | MongoDB | - | Gamification data |
| rez-travel-service | MongoDB | - | Travel bookings |
| rez-search-service | MongoDB | - | Search index |
| rez-karma-service | MongoDB | - | Karma points |
| rez-user-intelligence-service | MongoDB | - | User analytics |
| RestaurantHub | PostgreSQL | - | Full e-commerce |
| Hotel OTA | PostgreSQL | - | Hospitality |
| Rendez | PostgreSQL | - | Dating/social |
| Rez-Web-Menu | PostgreSQL | - | Menu management |

---

## Appendix B: Configuration Reference

### MongoDB Environment Variables

```bash
MONGODB_URI=mongodb://user:pass@host:27017/database
MONGODB_USERNAME=user
MONGODB_PASSWORD=password
MONGODB_AUTH_SOURCE=admin
MONGODB_READ_PREFERENCE=primary  # primary, secondary, primaryPreferred
```

### PostgreSQL Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=database
DATABASE_CONNECTION_LIMIT=20
```

### Redis Environment Variables

```bash
REDIS_URL=redis://:password@host:6379
REDIS_PASSWORD=password
REDIS_USERNAME=user  # For ACL
REDIS_SENTINEL_HOSTS=s1:26379,s2:26379
REDIS_SENTINEL_NAME=mymaster
```

---

*Report Generated: May 4, 2026*
*Next Audit: August 4, 2026*
