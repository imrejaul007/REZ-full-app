# Database Authentication Enablement Guide

**Last Updated:** 2026-05-01
**Priority:** CRITICAL
**Status:** Ready for Implementation

---

## Overview

This guide covers enabling MongoDB and Redis authentication across all ReZ microservices. Both security features are currently disabled and must be enabled before production deployment.

---

## Quick Start

### MongoDB AUTH

1. **Create MongoDB Atlas User** (or local user)
2. **Update MONGODB_URI** with credentials
3. **Set environment variables:**
   ```bash
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_secure_password
   MONGODB_AUTH_SOURCE=admin
   ```
4. **Deploy to staging**
5. **Test all services**
6. **Deploy to production**

### Redis AUTH

1. **Enable Redis AUTH** on your Redis instance
2. **Set environment variable:**
   ```bash
   REDIS_PASSWORD=your_secure_password
   ```
3. **For ACL users:**
   ```bash
   REDIS_USERNAME=your_username
   REDIS_PASSWORD=your_password
   ```
4. **Deploy and test**

---

## MongoDB Authentication

### Step 1: Create MongoDB Users

#### MongoDB Atlas

1. Go to **Security > Database Access**
2. Click **Add New Database User**
3. Select **Password Authentication**
4. Create a user with appropriate roles:

```javascript
// Application User (readWrite on specific databases)
username: rez_app
password: <generate-secure-password>
roles:
  - { role: "readWrite", db: "rez" }
  - { role: "readWrite", db: "rez_auth" }
  - { role: "readWrite", db: "rez_orders" }
  - { role: "readWrite", db: "rez_payments" }
  - { role: "readWrite", db: "rez_wallet" }
```

5. **Note the password** - you'll need it for the next step

#### Local MongoDB

```javascript
// In mongosh:
use admin
db.createUser({
  user: "rez_app",
  pwd: "<secure-password>",
  roles: [
    { role: "readWrite", db: "rez" },
    { role: "readWrite", db: "rez_auth" }
  ]
})
```

---

### Step 2: Update MONGODB_URI

#### Format for MongoDB Atlas

**Old (no auth):**
```
mongodb+srv://cluster.mongodb.net/rez
```

**New (with auth):**
```
mongodb+srv://username:password@cluster.mongodb.net/rez?authSource=admin
```

#### Environment Variables

Add to each service's `.env` or deployment config:

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rez?authSource=admin

# Separate credentials (alternative method)
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_AUTH_SOURCE=admin
```

---

### Step 3: Update Service Code

Each service's `src/config/mongodb.ts` has been updated to support authentication. Copy the new configuration:

**File:** `src/config/mongodb-auth.ts`

This file provides:
- `buildMongoUri()` - Builds URI with credentials from env vars
- `connectMongoDB()` - Connects with auth support
- `disconnectMongoDB()` - Graceful disconnect
- `isMongoConnected()` - Connection status check

**Usage in service index.ts:**
```typescript
import { connectMongoDB, disconnectMongoDB } from './config/mongodb-auth';

// In your startup:
await connectMongoDB();

// In graceful shutdown:
await disconnectMongoDB();
```

---

### Step 4: Verify Connection

```bash
# Test with mongosh
mongosh "mongodb+srv://username:password@cluster.mongodb.net/rez" --authenticationDatabase admin

# Or with username/password flags
mongosh --username rez_app --password --authenticationDatabase admin \
  "mongodb+srv://cluster.mongodb.net/rez"
```

---

## Redis Authentication

### Step 1: Enable Redis AUTH

#### Redis Cloud (Redis Enterprise)

1. Go to your Redis Cloud database
2. Navigate to **Security > Access Control**
3. Enable **Transport Layer Security (TLS)**
4. Create an **ACL** or use **Default User** with password

#### Local Redis

```bash
# Add to redis.conf:
requirepass your_secure_password

# Or via CLI:
redis-cli CONFIG SET requirepass "your_secure_password"
```

#### Redis Sentinel

```bash
# In sentinel.conf for each sentinel:
requirepass "your_secure_password"
masterauth "your_secure_password"
```

---

### Step 2: Configure Services

Add to each service's `.env`:

```bash
# Redis Authentication
REDIS_PASSWORD=your_secure_password

# Optional: Redis ACL username (Redis 6+)
REDIS_USERNAME=your_username

# Redis Sentinel (if using sentinel mode)
REDIS_SENTINEL_HOSTS=s1:26379,s2:26379,s3:26379
REDIS_SENTINEL_NAME=mymaster
```

---

### Step 3: Update Service Code

**File:** `src/config/redis-auth.ts`

This file provides:
- `createRedisClient()` - Standard Redis client with auth
- `createBullMqRedisClient()` - BullMQ-compatible client
- `maskRedisUrl()` - Hide credentials in logs

**Usage in service:**
```typescript
import { createRedisClient, createBullMqRedisClient } from './config/redis-auth';

const redis = createRedisClient();
const bullMqRedis = createBullMqRedisClient();
```

---

### Step 4: Verify Connection

```bash
# Test Redis connection with password
redis-cli -h your-redis-host -p 6379 -a your_password PING

# Should return: PONG
```

---

## Service-Specific Configuration

### rez-auth-service (Port 4002)

```bash
# .env
MONGODB_URI=mongodb+srv://rez_app:PASSWORD@cluster.mongodb.net/rez_auth?authSource=admin
MONGODB_USERNAME=rez_app
MONGODB_PASSWORD=<generated>
REDIS_PASSWORD=<generated>
```

### rez-wallet-service (Port 4004)

```bash
# .env
MONGODB_URI=mongodb+srv://rez_app:PASSWORD@cluster.mongodb.net/rez_wallet?authSource=admin
REDIS_PASSWORD=<generated>
```

### rez-payment-service (Port 4001)

```bash
# .env
MONGODB_URI=mongodb+srv://rez_app:PASSWORD@cluster.mongodb.net/rez_payment?authSource=admin
REDIS_PASSWORD=<generated>
```

### All Other Services

Follow the same pattern - update `MONGODB_URI` and set `REDIS_PASSWORD`.

---

## Staged Rollout Checklist

### Phase 1: Staging Environment
- [ ] Create staging MongoDB user
- [ ] Enable Redis AUTH on staging
- [ ] Update staging environment variables
- [ ] Deploy all services to staging
- [ ] Run integration tests
- [ ] Verify all health checks pass
- [ ] Check logs for connection errors

### Phase 2: Production Preparation
- [ ] Create production MongoDB user
- [ ] Enable Redis AUTH on production
- [ ] Update production environment variables
- [ ] Create backup of production database
- [ ] Document rollback procedure

### Phase 3: Production Deployment
- [ ] Deploy to production (rolling restart)
- [ ] Monitor error rates
- [ ] Verify all services connected
- [ ] Run smoke tests
- [ ] Check monitoring dashboards

### Phase 4: Post-Deployment
- [ ] Disable unauthenticated access (MongoDB Atlas IP whitelist)
- [ ] Verify no unauthenticated connection attempts
- [ ] Update documentation
- [ ] Schedule credential rotation (90 days)

---

## Troubleshooting

### MongoDB Connection Issues

**Error:** `Authentication failed`
```
Solution: Verify username/password are correct. Check authSource matches.
```

**Error:** `SCRAM authentication failed`
```
Solution: Use SCRAM-SHA-256. Enable in MongoDB Atlas Security > Advanced.
```

**Error:** `Connection timed out`
```
Solution: Check IP whitelist in MongoDB Atlas Network Access.
```

### Redis Connection Issues

**Error:** `NOAUTH Authentication required`
```
Solution: Set REDIS_PASSWORD environment variable.
```

**Error:** `WRONGPASS invalid username-password pair`
```
Solution: For Redis ACL, set both REDIS_USERNAME and REDIS_PASSWORD.
```

---

## Rollback Procedure

### If Issues Occur After Deployment:

1. **Revert environment variables** to unauthenticated URIs
2. **Restart affected services**
3. **Verify connections restored**
4. **Debug authentication configuration**

### Emergency MongoDB Rollback:

```bash
# Restore unauthenticated URI (TEMPORARY)
MONGODB_URI=mongodb+srv://cluster.mongodb.net/rez
```

### Emergency Redis Rollback:

```bash
# Disable password temporarily
REDIS_PASSWORD=
```

**WARNING:** Rollback is temporary. Re-enable authentication after fixing issues.

---

## Security Best Practices

1. **Never commit credentials** to git
2. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault, etc.)
3. **Rotate credentials** every 90 days
4. **Enable TLS** for all connections
5. **Use minimum password length** (16+ characters)
6. **Monitor failed authentication** attempts
7. **Enable audit logging** in MongoDB Atlas

---

## Files Reference

| File | Purpose | Location |
|------|---------|----------|
| mongodb-auth.ts | MongoDB auth helper | src/config/ |
| redis-auth.ts | Redis auth helper | src/config/ |
| MONGODB-AUTH-GUIDE.md | MongoDB setup | SOURCE-OF-TRUTH/ |
| REDIS-AUTH-GUIDE.md | Redis setup | SOURCE-OF-TRUTH/ |

---

## Support

For issues or questions:
1. Check logs for specific error messages
2. Verify environment variables are set correctly
3. Test connections with CLI tools (mongosh, redis-cli)
4. Review MongoDB Atlas/Redis Cloud console for errors

---

**Document Owner:** ReZ Platform Team
**Review Date:** Before each deployment
