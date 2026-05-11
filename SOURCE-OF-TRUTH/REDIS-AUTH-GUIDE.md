# Redis Authentication Guide

**Date:** 2026-05-01
**Version:** 2.0
**Status:** Authoritative

---

## Overview

This guide covers enabling Redis AUTH across the entire ReZ ecosystem. All 14+ microservices use Redis for sessions, rate limiting, queues (BullMQ), caching, and pub/sub.

### Services Using Redis

| Service | Redis Usage | Priority |
|---------|-------------|----------|
| rez-auth-service | Sessions, rate limiting | Critical |
| rez-wallet-service | BullMQ queues, cache, pub/sub | Critical |
| rez-order-service | BullMQ queues, cache | Critical |
| rez-payment-service | BullMQ queues, rate limiting | Critical |
| rez-merchant-service | Rate limiting, cache | High |
| rez-catalog-service | Product caching | Medium |
| rez-search-service | Search cache, pub/sub | High |
| rez-gamification-service | BullMQ queues | Medium |
| rez-marketing-service | BullMQ queues | Medium |
| rez-scheduler-service | BullMQ queues | High |
| rez-finance-service | BullMQ queues | High |
| rez-karma-service | BullMQ queues, pub/sub | High |
| rez-corpperks-service | Cache | Low |
| rez-intent-graph | Cache, pub/sub | Medium |
| Rendez backend | Sessions, queues | High |
| Hotel OTA API | Sessions, cache | Medium |

---

## Quick Start (Development)

### 1. Generate Passwords

```bash
# Generate strong Redis password
openssl rand -hex 32
# Example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456

# Generate sentinel password
openssl rand -hex 16
# Example: a1b2c3d4e5f67890
```

### 2. Copy to .env

Create `/Users/rejaulkarim/Documents/ReZ Full App/.env` from `docker-compose.example.env`:

```env
# Redis Configuration
REDIS_PASSWORD=your_64_char_hex_password_here
REDIS_SENTINEL_PASSWORD=your_32_char_hex_password_here

# Single node (development)
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# Sentinel mode (production-like local dev)
REDIS_SENTINEL_HOSTS=localhost:26379,localhost:26380,localhost:26381
REDIS_SENTINEL_NAME=mymaster
```

### 3. Start Services

```bash
# Using sentinel (recommended for HA testing)
docker compose -f docker-compose.redis-sentinel.yml up -d

# Using single node
docker compose up -d redis
```

---

## Password Management Strategy

### Password Types

| Password | Purpose | Strength | Rotation |
|----------|---------|----------|----------|
| `REDIS_PASSWORD` | Redis master/replica AUTH | 64 hex chars | 90 days |
| `REDIS_SENTINEL_PASSWORD` | Sentinel AUTH | 32 hex chars | 90 days |
| Service-specific | Per-service isolation (optional) | 32+ chars | Per service |

### Per-Service Passwords (Optional High Security)

For production, consider unique passwords per service:

```env
# Core password for all services (default)
REDIS_PASSWORD=shared_password_here

# Optional: Per-service passwords (uncomment for isolation)
# REDIS_AUTH_PASSWORD=a1b2c3d4...
# REDIS_WALLET_PASSWORD=d5e6f7g8...
# REDIS_ORDER_PASSWORD=h9i0j1k2...
```

### Environment Variable Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `REDIS_URL` | Single node connection string | Yes |
| `REDIS_PASSWORD` | Redis AUTH password | Yes |
| `REDIS_SENTINEL_HOSTS` | Sentinel hosts (comma-separated) | For HA |
| `REDIS_SENTINEL_NAME` | Sentinel master name (default: mymaster) | No |
| `REDIS_SENTINEL_PASSWORD` | Sentinel AUTH password | Yes (with sentinel) |
| `REDIS_TLS` | Enable TLS (true/false) | No |

---

## Docker Compose Configuration

### Single Node Redis (docker-compose.yml)

Update the Redis service:

```yaml
redis:
  image: redis:7-alpine
  container_name: rez-redis
  restart: unless-stopped
  ports:
    - '6379:6379'
  volumes:
    - redis_data:/data
  command: >
    redis-server
    --requirepass ${REDIS_PASSWORD}
    --appendonly yes
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD}
  healthcheck:
    test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - rez-network
```

### Sentinel HA Setup (docker-compose.redis-sentinel.yml)

#### Redis Primary

```yaml
redis-primary:
  image: redis:7-alpine
  container_name: redis-primary
  restart: unless-stopped
  ports:
    - '6379:6379'
  volumes:
    - redis_primary_data:/data
  command: >
    redis-server
    --requirepass ${REDIS_PASSWORD}
    --masterauth ${REDIS_PASSWORD}
    --replica-read-only yes
    --appendonly yes
  healthcheck:
    test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - redis-network
```

#### Redis Replicas

```yaml
redis-replica-1:
  image: redis:7-alpine
  container_name: redis-replica-1
  restart: unless-stopped
  ports:
    - '6380:6379'
  volumes:
    - redis_replica1_data:/data
  command: >
    redis-server
    --requirepass ${REDIS_PASSWORD}
    --masterauth ${REDIS_PASSWORD}
    --replica-read-only yes
    --appendonly yes
  depends_on:
    redis-primary:
      condition: service_healthy
  healthcheck:
    test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - redis-network
```

#### Sentinel Containers

```yaml
redis-sentinel-1:
  image: redis:7-alpine
  container_name: redis-sentinel-1
  restart: unless-stopped
  ports:
    - '26379:26379'
  volumes:
    - ./sentinel.conf:/usr/local/etc/redis/sentinel.conf:ro
  command: redis-sentinel /usr/local/etc/redis/sentinel.conf
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD}
    - SENTINEL_PASSWORD=${REDIS_SENTINEL_PASSWORD}
  depends_on:
    redis-primary:
      condition: service_healthy
  networks:
    - redis-network
```

---

## Sentinel Configuration Files

### sentinel.conf (Primary)

```conf
# Redis Sentinel Configuration
# ReZ Ecosystem - High Availability Setup

# Network
bind 0.0.0.0
port 26379
dir /tmp

# Monitor the primary Redis
sentinel monitor mymaster redis-primary 6379 2

# Authentication - use environment variables
# Sentinel requires its own AUTH
sentinel requirepass ${SENTINEL_PASSWORD}

# Primary Redis AUTH credentials
sentinel auth-pass mymaster ${REDIS_PASSWORD}

# Failover settings
sentinel down-after-milliseconds mymaster 3000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 18000

# Client configuration
sentinel deny-scripts-reconfig yes

# Auto-discovery of replicas
sentinel known-replica mymaster redis-replica-1 6379
sentinel known-replica mymaster redis-replica-2 6379

# Auto-discovery of other sentinels
sentinel known-sentinel mymaster redis-sentinel-2 26379
sentinel known-sentinel mymaster redis-sentinel-3 26381
```

### sentinel2.conf

```conf
# Redis Sentinel Configuration - Secondary 1
bind 0.0.0.0
port 26379
dir /tmp

sentinel monitor mymaster redis-primary 6379 2
sentinel requirepass ${SENTINEL_PASSWORD}
sentinel auth-pass mymaster ${REDIS_PASSWORD}
sentinel down-after-milliseconds mymaster 3000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 18000
sentinel deny-scripts-reconfig yes

sentinel known-replica mymaster redis-replica-1 6379
sentinel known-replica mymaster redis-replica-2 6379
sentinel known-sentinel mymaster redis-sentinel-1 26379
sentinel known-sentinel mymaster redis-sentinel-3 26381
```

### sentinel3.conf

```conf
# Redis Sentinel Configuration - Secondary 2
bind 0.0.0.0
port 26379
dir /tmp

sentinel monitor mymaster redis-primary 6379 2
sentinel requirepass ${SENTINEL_PASSWORD}
sentinel auth-pass mymaster ${REDIS_PASSWORD}
sentinel down-after-milliseconds mymaster 3000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 18000
sentinel deny-scripts-reconfig yes

sentinel known-replica mymaster redis-replica-1 6379
sentinel known-replica mymaster redis-replica-2 6379
sentinel known-sentinel mymaster redis-sentinel-1 26379
sentinel known-sentinel mymaster redis-sentinel-2 26379
```

---

## Service Connection Strings

### Single Node Mode

```env
# Format: redis://:PASSWORD@HOST:PORT
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

### Sentinel Mode (Recommended for Production)

```env
# Format: redis://:PASSWORD@SENTINEL_HOST:SENTINEL_PORT?service=MASTER_NAME
# Example with multiple sentinels:
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:26379,localhost:26380,localhost:26381

# Sentinel-specific configuration
REDIS_SENTINEL_HOSTS=localhost:26379,localhost:26380,localhost:26381
REDIS_SENTINEL_NAME=mymaster
REDIS_PASSWORD=${REDIS_PASSWORD}
```

### Service-Specific Examples

#### rez-auth-service
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=your_password_here
```

#### rez-wallet-service
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=your_password_here
# BullMQ uses this for job queues
```

#### rez-order-service
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=your_password_here
```

#### rez-payment-service
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
REDIS_PASSWORD=your_password_here
```

#### Rendez Backend
```env
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

---

## Service Code Integration

### IORedis Connection Pattern

All services use the shared Redis client pattern with IORedis:

```typescript
// src/config/redis.ts (standard pattern)
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const redisPassword = process.env.REDIS_PASSWORD;
const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS;

// Parse URL for single-node mode
function parseUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    throw new Error(`Invalid REDIS_URL: ${url}`);
  }
}

// Sentinel mode
if (sentinelHosts) {
  const sentinels = sentinelHosts.split(',').map(h => {
    const [host, port] = h.trim().split(':');
    return { host, port: parseInt(port || '26379', 10) };
  });

  return new IORedis({
    sentinels,
    name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
    password: redisPassword,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy: (times: number) => {
      const base = Math.min(times * 200, 5000);
      return base + Math.floor(Math.random() * 500);
    },
  });
}

// Single-node mode
const u = parseUrl(redisUrl as string);
export const redis = new IORedis({
  host: u.hostname,
  port: parseInt(u.port || '6379', 10),
  password: redisPassword || u.password || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});
```

---

## Verification & Testing

### Test Redis Connection

```bash
# Single node
redis-cli -h localhost -p 6379 -a YOUR_PASSWORD PING
# Expected: PONG

# With TLS
redis-cli -h your-redis-host -p 6379 -a YOUR_PASSWORD --tls PING
# Expected: PONG
```

### Test Sentinel Connection

```bash
# Connect to sentinel
redis-cli -h localhost -p 26379

# Authenticate
AUTH YOUR_SENTINEL_PASSWORD

# Check master status
SENTINEL get-master-addr-by-name mymaster
# Expected: ["redis-primary-ip", "6379"]

# Check master AUTH
SENTINEL master mymaster
# Look for "auth-pass" in output
```

### Test Service Connectivity

```bash
# Check if service can connect to Redis
docker exec -it rez-auth-service sh -c 'nc -zv redis 6379'

# Check Redis logs
docker logs redis-primary | grep -i auth
```

---

## Production Checklist

### Security Checklist

- [ ] All Redis instances have AUTH enabled
- [ ] Sentinel instances have AUTH enabled
- [ ] Passwords are 32+ characters, cryptographically random
- [ ] Passwords stored in secrets manager (AWS Secrets Manager, HashiCorp Vault)
- [ ] Connection strings use TLS in production
- [ ] Redis bound to internal network only
- [ ] No Redis instances exposed to public internet
- [ ] Audit logging enabled for Redis

### HA Checklist

- [ ] 1 primary + 2 replicas configured
- [ ] 3 sentinel instances deployed
- [ ] Quorum (2) set correctly
- [ ] Failover tested
- [ ] Replica read-only mode enabled
- [ ] Connection pooling configured in services

### Monitoring Checklist

- [ ] Redis metrics exported (Prometheus)
- [ ] Sentinel metrics exported
- [ ] Alerts configured for:
  - Connection failures
  - AUTH failures
  - Memory usage > 80%
  - Slow queries > 100ms
- [ ] Dashboard created in Grafana

---

## Troubleshooting

### AUTH Failure

```
Error: ERR AUTH <password> called without any password configured
```

**Cause:** Redis has no password set but service is trying to authenticate.

**Fix:**
1. Enable AUTH in Redis: `redis-server --requirepass YOUR_PASSWORD`
2. Or disable AUTH in service by not setting `REDIS_PASSWORD`

### Sentinel AUTH Failure

```
Error: WRONGPASS invalid username-password pair
```

**Cause:** Sentinel password incorrect.

**Fix:**
1. Verify `SENTINEL_PASSWORD` matches `sentinel requirepass` in sentinel.conf
2. Restart sentinel after config change: `docker compose restart redis-sentinel-1`

### Master Auth Required

```
Error: MISCONF Redis is configured to save RDB snapshots
```

**Cause:** Replica cannot authenticate to master.

**Fix:**
1. Verify `masterauth` is set to same as `requirepass` in replica config
2. Check replica logs: `docker logs redis-replica-1`

### Connection Timeout

```
Error: Connection timeout
```

**Cause:** Network connectivity or firewall issue.

**Fix:**
1. Check Redis is running: `docker ps | grep redis`
2. Check ports exposed: `netstat -tlnp | grep 6379`
3. Test connectivity: `telnet redis-host 6379`

---

## Rollback Procedure

If AUTH causes issues, rollback safely:

### 1. Disable AUTH (Temporary)

```bash
# Stop Redis
docker compose stop redis-primary

# Edit redis.conf - comment out requirepass
# requirepass YOUR_PASSWORD

# Restart Redis
docker compose start redis-primary
```

### 2. Update Services

```env
# Remove password from connection string
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=
```

### 3. Verify

```bash
redis-cli PING
# Expected: PONG
```

### 4. Re-enable AUTH

1. Set new passwords
2. Update all services
3. Restart all services
4. Verify connectivity

---

## Password Rotation

### Scheduled Rotation (90 days)

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -hex 32)

# 2. Update .env with new password
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$NEW_PASSWORD/" .env

# 3. Rolling restart of Redis (maintain HA)
# Primary first
docker compose exec redis-primary redis-cli -a OLD_PASSWORD CONFIG SET requirepass $NEW_PASSWORD
docker compose exec redis-primary redis-cli -a NEW_PASSWORD CONFIG REWRITE

# Replicas
docker compose exec redis-replica-1 redis-cli -a OLD_PASSWORD CONFIG SET masterauth $NEW_PASSWORD
docker compose exec redis-replica-1 redis-cli -a NEW_PASSWORD CONFIG REWRITE

# 4. Restart services
docker compose restart

# 5. Verify
redis-cli -a $NEW_PASSWORD PING
```

---

## Reference: Render/Railway Deployment

### render.yaml

```yaml
services:
  - type: web
    name: rez-auth-service
    envVars:
      - key: REDIS_URL
        value: rediss://default:${REDIS_PASSWORD}@your-redis-host:12345
      - key: REDIS_PASSWORD
        sync: false
      - key: REDIS_SENTINEL_HOSTS
        value: redis-12345:26379,redis-12346:26379,redis-12347:26379
      - key: REDIS_SENTINEL_NAME
        value: mymaster
```

### Railway

```toml
[environment]
REDIS_URL = "rediss://:${REDIS_PASSWORD}@your-redis-host:12345"
REDIS_PASSWORD = "${REDIS_PASSWORD}"
REDIS_SENTINEL_HOSTS = "redis-12345:26379,redis-12346:26379,redis-12347:26379"
```

---

## Appendix: Redis Cloud (Redis Enterprise)

For Redis Cloud:

```env
# Redis Cloud connection (TLS required)
REDIS_URL=rediss://default:${REDIS_PASSWORD}@redis-12345.cloud.redislabs.com:12345

# Or using sentinel (Redis Cloud Pro)
REDIS_SENTINEL_HOSTS=redis-12345:26379,redis-12346:26379
REDIS_SENTINEL_NAME=mymaster
REDIS_PASSWORD=${REDIS_PASSWORD}
```

Connection code already handles TLS via `rediss://` prefix:

```typescript
export const redis = new IORedis(redisUrl, {
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
});
```
