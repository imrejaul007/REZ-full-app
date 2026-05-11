# REZ Loyalty Ecosystem - Stability Guide

**Version:** 1.0
**Date:** May 9, 2026

---

## Overview

This document covers stability patterns, circuit breakers, and operational procedures for the REZ Loyalty Ecosystem.

---

## Circuit Breaker Configuration

### Service Dependencies

```
┌─────────────┐
│ Profile     │ ← Profile Aggregator
│ Aggregator  │
└──────┬──────┘
       │ depends on:
       ├→ MongoDB
       ├→ Redis
       └→ Other Services (via HTTP)

┌─────────────┐
│ Streak     │ ← Streak Service
│ Service    │
└──────┬──────┘
       │ depends on:
       ├→ MongoDB
       └→ Redis

┌─────────────┐
│ Score      │ ← ReZ Score Service
│ Service    │
└──────┬──────┘
       │ depends on:
       ├→ MongoDB
       └→ Redis
```

### Circuit Breaker Settings

```typescript
const CIRCUIT_BREAKER_CONFIG = {
  // MongoDB connection
  mongodb: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
  },

  // Redis connection
  redis: {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    enableReadyCheck: true,
    lazyConnect: true,
  },

  // HTTP timeouts
  http: {
    connectTimeout: 5000,
    timeout: 10000,
    retries: 3,
    backoff: 'exponential',
  },

  // Circuit breaker thresholds
  circuitBreaker: {
    failureThreshold: 5,      // Open after 5 failures
    successThreshold: 2,       // Close after 2 successes
    timeout: 60000,           // Try again after 60s
  },
};
```

---

## Health Check Endpoints

### Per-Service Health

```bash
# Profile Aggregator
curl http://localhost:4025/health
# Response: { "status": "healthy", "service": "profile-aggregator" }

# Streak Service
curl http://localhost:4026/health
# Response: { "status": "healthy" }

# ReZ Score Service
curl http://localhost:4028/health
# Response: { "status": "healthy" }

# Cross-Merchant Service
curl http://localhost:4027/health
# Response: { "status": "healthy" }

# Karma-Loyalty Bridge
curl http://localhost:4029/health
# Response: { "status": "healthy" }
```

### Readiness Probe

```bash
curl http://localhost:4025/ready
# Response: { "ready": true, "database": "connected" }
```

---

## Operational Procedures

### Restart Sequence

When restarting services, follow this order:

```
1. Stop in REVERSE dependency order:
   - Notifications (no dependencies)
   - Event Bus
   - Monitoring
   - Score Service
   - Cross-Merchant
   - Streak Service
   - Profile Aggregator
   - Karma-Loyalty Bridge
   - DLQ Service

2. Start in dependency order:
   - Infrastructure (MongoDB, Redis)
   - DLQ Service
   - Profile Aggregator
   - Karma-Loyalty Bridge
   - Streak Service
   - Cross-Merchant
   - Score Service
   - Event Bus
   - Notifications
   - Monitoring
```

### Database Maintenance

```bash
# Check MongoDB connection
mongosh --host localhost:27017 --eval "db.adminCommand('ping')"

# Check Redis connection
redis-cli ping
# Should return: PONG

# Check replica set status
mongosh --eval "rs.status()"

# View MongoDB logs
docker logs rez-mongodb --tail 100
```

### Cache Invalidation

```bash
# Flush all caches (emergency only)
redis-cli FLUSHDB

# Flush profile cache
redis-cli KEYS "profile:*" | xargs redis-cli DEL

# Check cache hit rate
redis-cli INFO stats | grep keyspace
```

---

## Alerting Rules

### Critical Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Service Down | Health check fails | PagerDuty |
| DLQ Spike | >10 events in 5min | PagerDuty |
| High Error Rate | >5% errors | PagerDuty |
| Connection Pool | >80% utilized | Slack |

### Warning Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Slow Response | >500ms p99 | Slack |
| Cache Miss | >50% miss rate | Slack |
| Queue Backlog | >100 pending | Slack |

---

## Runbook: Service Down

### Profile Aggregator Down

1. Check if MongoDB/Redis are running
2. Check logs: `docker logs rez-profile-aggregator`
3. Restart service: `docker-compose restart profile-aggregator`
4. If still down, redeploy

### Streak Service Down

1. Check if dependent services are up
2. Check Redis connection
3. Restart: `docker-compose restart streak-service`
4. Verify streak data integrity

### Score Service Down

1. Score updates will queue in event bus
2. Restart: `docker-compose restart score-service`
3. Manually recalculate affected scores if needed

---

## Runbook: Data Inconsistency

### Symptoms
- User sees different scores across apps
- Points don't match expected values

### Resolution

1. Check Profile Aggregator logs
2. Verify event sequence in DLQ
3. Replay events for affected user:
   ```bash
   # Replay all events for user
   curl -X POST http://localhost:4031/api/replay \
     -d '{"userId": "user123", "from": "2026-05-01"}'
   ```
4. Force recalculate:
   ```bash
   curl -X POST http://localhost:4025/api/v1/profile/{userId}/recalculate
   ```

---

## Performance Benchmarks

| Metric | Target | Critical |
|--------|--------|----------|
| Response Time (p50) | <50ms | <100ms |
| Response Time (p95) | <100ms | <500ms |
| Response Time (p99) | <200ms | <1000ms |
| Throughput | >500 req/s | >100 req/s |
| Error Rate | <0.1% | <1% |
| Availability | 99.9% | 99% |

---

## Disaster Recovery

### Backup Schedule

- MongoDB: Daily at 2 AM IST
- Redis: AOF persistence enabled
- Config: In Git

### Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| Service crash | 5 min | 0 |
| Database corruption | 30 min | 1 hour |
| Region outage | 2 hours | 4 hours |

### Recovery Procedure

1. Identify affected services
2. Stop incoming traffic (nginx config)
3. Restore from latest backup
4. Replay events from event store
5. Verify data integrity
6. Restore traffic gradually

---

## Testing Checklist

Before each deployment:

- [ ] All health checks pass
- [ ] DLQ is empty or minimal
- [ ] Error rate < 1%
- [ ] Response times within SLA
- [ ] Integration tests pass
- [ ] Load tests pass

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 9, 2026 | Initial |
