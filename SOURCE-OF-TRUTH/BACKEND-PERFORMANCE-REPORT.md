# Backend Performance Report

**Generated:** 2026-05-05
**Lead:** Backend Performance Specialist
**Status:** Active

---

## Executive Summary

This report analyzes the backend performance characteristics across the ReZ ecosystem (77+ microservices). The system shows good foundational practices with MongoDB replica sets, Redis caching, and proper connection pooling, but has several optimization opportunities to meet the <500ms p99 response time target.

**Overall Assessment: MODERATE RISK**

---

## Performance Targets

| Metric | Target | Critical | Current Status |
|--------|--------|----------|----------------|
| Response Time (p99) | < 500ms | < 1s | Unknown - needs monitoring |
| Throughput | 1000 req/s | 500 req/s | Unknown - needs load testing |
| Error Rate | < 0.1% | < 1% | Unknown - needs monitoring |
| Availability | 99.9% | 99% | Good (replica set configured) |

---

## 1. Connection Pool Analysis

### 1.1 MongoDB Connection Pools

| Service | maxPoolSize | minPoolSize | Status |
|---------|-------------|-------------|--------|
| `rez-ads-service` (database.ts) | 10 | 2 | **Low** |
| `rez-ads-service` (mongodb-auth.ts) | 20 | 5 | OK |
| `rez-profile-service` | 10 | 2 | **Low** |
| `rez-web-menu` | 10 | - | **Low** |
| `rez-targeting-engine` | 10 | 2 | **Low** |
| `rez-gamification-service` | 10 | 5 | **Low** |
| `rez-user-intelligence-service` | 20 | 5 | OK |
| `rez-merchant-service` | 20 | 5 | OK |
| `rez-order-service` | 50 | 5 | **Good** |

**Findings:**

1. **Inconsistent Pool Sizes**: Services vary from 10-50 max connections
2. **Order Service**: Best practice (50 connections) - M14 fix increased from 10
3. **Low Pool Services**: Risk connection exhaustion under load

**Recommendations:**
```typescript
// Recommended settings for high-throughput services
const options = {
  maxPoolSize: 50,        // Match order-service as baseline
  minPoolSize: 10,        // Keep warm connections
  maxIdleTimeMS: 30000,   // 30s idle timeout
  socketTimeoutMS: 45000,  // 45s socket timeout
  serverSelectionTimeoutMS: 5000,
};
```

---

## 2. Caching Strategy Audit

### 2.1 Current Redis Implementation

| Service | Cache Type | TTL Config | Status |
|---------|------------|------------|--------|
| `rez-profile-service` | Redis (redis.js) | Configurable via setEx | Good |
| `rez-ads-service` | IORedis | 24h (frequency cap) | Good |
| `rez-web-menu` | IORedis | Multiple rate limiters | Good |

### 2.2 Found Issues

**Issue 1: Missing Cache on Repeated Queries**

Location: `rez-ads-service/src/routes/adbazaar.ts`
```typescript
campaignId: { $in: await AdCampaign.find({ merchantId }).distinct('_id') }
// PROBLEM: No cache on this repeated query pattern
```

**Issue 2: Cache-Aside Pattern Not Consistently Applied**

Services using `await find()` without cache:
- `rez-action-engine/src/index-adaptive.ts` - LearnedParams queries
- `rez-ads-service/src/services/attributionService.ts` - Campaign lookups
- `rez-profile-service/src/services/profile.ts` - User preferences

**Recommendations:**
```typescript
// Implement cache-aside pattern consistently
async function getCachedCampaign(id: string): Promise<Campaign | null> {
  const cacheKey = `campaign:${id}`;

  // 1. Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // 2. Query DB
  const campaign = await AdCampaign.findById(id).lean();

  // 3. Store in cache (5 min TTL for campaigns)
  if (campaign) {
    await redis.setEx(cacheKey, 300, JSON.stringify(campaign));
  }

  return campaign;
}
```

---

## 3. N+1 Query Analysis

### 3.1 Populate Patterns Found

| Location | Pattern | Risk Level |
|----------|---------|------------|
| `rez-ads-service/src/routes/admin.ts` | Multiple .populate() chained | Medium |
| `rez-ads-service/src/services/attributionService.ts` | .populate('campaignId') | Medium |

### 3.2 Good Practices Found

The ads-service uses `.lean()` extensively, reducing hydration overhead:
```typescript
// GOOD: Using lean() for read-only queries
AdCampaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
```

**Recommendations:**
```typescript
// For high-frequency queries, use aggregation with $lookup instead of populate
const results = await AdCampaign.aggregate([
  { $match: filter },
  { $lookup: { from: 'merchants', localField: 'merchantId', foreignField: '_id', as: 'merchant' } },
  { $unwind: '$merchant' },
  { $limit: limit },
]);
```

---

## 4. Index Coverage Analysis

### 4.1 Good Index Coverage

| Collection | Indexes | Notes |
|------------|---------|-------|
| AdCampaign | 6 indexes | Compound indexes for common queries |
| AdInteraction | 3 indexes | Covers campaignId+type, userId+campaignId |
| Rule | 5 indexes | Covers trigger, priority, tags |
| RefreshToken | TTL index | Auto-expiration |

### 4.2 Missing Indexes Identified

1. **Action Engine Decision Collection**
   ```javascript
   // MISSING: Compound index for merchantId + itemId lookups
   db.decisions.createIndex({ merchantId: 1, itemId: 1, createdAt: -1 })
   ```

2. **User Preferences**
   ```javascript
   // MISSING: Index for user preference lookups
   db.userpreferences.createIndex({ userId: 1 })
   ```

### 4.3 Index Best Practices

The codebase correctly disables `autoIndex` in production:
```typescript
autoIndex: process.env.NODE_ENV !== 'production', // CORRECT
autoCreate: process.env.NODE_ENV !== 'production',
```

Index creation is properly handled via migration scripts:
- `rez-gamification-service/scripts/migrations/002_add_performance_indexes.ts`
- `rez-order-service/src/migrations/001-create-indexes.ts`
- `rez-wallet-service/src/models/*Indexes.ts`

---

## 5. Query Optimization Opportunities

### 5.1 Field Selection (.select)

**Good Patterns Found:**
```typescript
// Selecting only needed fields reduces data transfer
AdCampaign.findById(adId).select('title merchantId ctaText').lean()
```

**Opportunities:**
- Extend `.select()` to all populate paths
- Use projection in aggregation pipelines

### 5.2 Query Patterns to Optimize

**Pattern: Unbounded .find() without limit**
```typescript
// PROBLEM: Could return thousands of records
const decisions = await Decision.find().sort({ createdAt: -1 }).limit(50);
// FIX: Add explicit limit (already has limit:50 here - good!)
```

**Pattern: Repeated lookups in loops**
```typescript
// Found in: rez-action-engine/src/index-adaptive.ts
const learnedParams = await getLearnedParams(merchantId, itemId);
// CALLOUT: This pattern is called in a loop - needs batch optimization
```

---

## 6. Connection Management

### 6.1 MongoDB Connection Features

**Good Practices Implemented:**
- Replica set support with proper read preferences
- Exponential backoff retry strategy (5 retries, 5s base)
- Graceful disconnect handling
- Connection state logging

**Redis Connection Features:**
- Sentinel mode support for high availability
- Authentication support (password/ACL)
- Separate BullMQ connection (different DB)
- Keep-alive enabled (10s)

### 6.2 Health Checks

Found in `rez-action-engine/src/health.ts`:
```typescript
services: {
  mongodb: { latencyMs, status },
  redis: { latencyMs, status },
}
```

**Recommendation:** Add health checks to all services for observability.

---

## 7. Critical Bottlenecks

### Priority 1: Connection Pool Exhaustion

**Services at Risk:** ads-service, profile-service, targeting-engine, gamification-service

**Symptom:** Under load, requests queue waiting for connections, causing timeouts.

**Fix:**
```typescript
// Increase pool sizes in config
maxPoolSize: 50,    // Current: 10
minPoolSize: 10,    // Current: 2
```

### Priority 2: Missing Cache Layer

**Affected Queries:**
- Campaign lookups (adbazaar routes)
- Learned parameters (action engine)
- User preferences (profile service)

**Fix:** Implement cache-aside pattern with 5-minute TTL.

### Priority 3: N+1 in Batch Operations

**Location:** `rez-action-engine/src/index-adaptive.ts`

**Pattern:**
```typescript
// CURRENT: N queries for N items
for (const item of items) {
  params = await getLearnedParams(merchantId, item._id);
}

// FIX: Batch query
const allParams = await LearnedParams.find({
  merchantId,
  itemId: { $in: items.map(i => i._id) }
});
```

---

## 8. Scaling Recommendations

### 8.1 Horizontal Scaling Targets

| Service | Current Replicas | Recommended | Reason |
|---------|------------------|-------------|--------|
| API Gateway | Unknown | 3+ | Request routing |
| Order Service | Unknown | 3+ | Critical path |
| Payment Service | Unknown | 3+ | Transactional |
| Ads Service | Unknown | 2+ | High traffic |

### 8.2 Read Replica Usage

Current services supporting read preference:
```typescript
readPreference: process.env.MONGODB_READ_PREFERENCE || 'primary'
```

**Recommendation:** Route analytics queries to secondary:
```
MONGODB_READ_PREFERENCE=secondaryPreferred
```

### 8.3 CDN/Cache Layers

**Missing:**
- No CDN configuration for static assets
- No response caching at API gateway level

**Recommendation:** Add response caching middleware:
```typescript
// Cache successful GET requests for 60s
app.use(cacheMiddleware({ ttl: 60, statusCodes: [200] }));
```

---

## 9. Performance Monitoring Recommendations

### 9.1 Metrics to Implement

```typescript
// Add to all services
const metrics = {
  // Request metrics
  httpRequestDuration: Histogram('http_request_duration_ms'),
  httpRequestsTotal: Counter('http_requests_total'),

  // DB metrics
  mongoQueryDuration: Histogram('mongo_query_duration_ms'),
  mongoPoolSize: Gauge('mongo_pool_size'),
  mongoPoolCheckedOut: Gauge('mongo_pool_checked_out'),

  // Cache metrics
  cacheHitRate: Gauge('cache_hit_rate'),
  redisLatency: Histogram('redis_latency_ms'),
};
```

### 9.2 Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| p99 Latency | > 300ms | > 500ms |
| Connection Pool Usage | > 70% | > 90% |
| Error Rate | > 0.1% | > 1% |
| Cache Hit Rate | < 80% | < 60% |

---

## 10. Action Items

| Priority | Action | Owner | ETA |
|----------|--------|-------|-----|
| P1 | Increase pool sizes to 50 in ads, profile, targeting, gamification | Backend Team | 1 week |
| P1 | Add caching to campaign lookup queries | Backend Team | 1 week |
| P2 | Implement cache-aside in action engine | Backend Team | 2 weeks |
| P2 | Add compound indexes for decision queries | Backend Team | 1 week |
| P3 | Set up Prometheus metrics in all services | DevOps | 2 weeks |
| P3 | Configure CDN for static assets | DevOps | 2 weeks |

---

## 11. Appendix: Service Inventory

### Services with MongoDB

| Service | Pool Size | Cache | Index Migrations |
|---------|-----------|-------|------------------|
| rez-ads-service | 10/20 | Yes | No |
| rez-profile-service | 10 | Yes | No |
| rez-action-engine | - | Partial | No |
| rez-gamification-service | 20 | Partial | Yes |
| rez-merchant-service | 20 | Partial | No |
| rez-order-service | 50 | Partial | Yes |
| rez-wallet-service | 10 | No | Yes |
| rez-user-intelligence-service | 20 | No | No |
| rez-targeting-engine | 10 | No | No |

### Services with Redis

| Service | Purpose | Sentinel |
|---------|---------|----------|
| rez-ads-service | Rate limiting, caching, frequency caps | Yes |
| rez-profile-service | Profile caching | No |
| rez-web-menu | Rate limiting, caching | Yes |
| rez-action-engine | Queue management | Yes |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-05 | Backend Performance Lead | Initial report |

---

*This report is the source of truth for backend performance. Update after each significant infrastructure change.*
