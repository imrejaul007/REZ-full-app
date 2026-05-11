# Redis/Cache Audit Report - AGENT 19
**Date:** May 10, 2026
**Auditor:** Redis/Cache Specialist
**Scope:** All Redis usages, caching strategies, session management
**Version:** 2.0 (Updated)

---

## Executive Summary

| Category | Count | Critical Issues |
|----------|-------|-----------------|
| Services Using Redis | 20+ | 5 |
| Cache Implementations | 12+ | 2 |
| Rate Limiters | 6+ | 1 |
| Pub/Sub Implementations | 4+ | 0 |
| Session Services | 3+ | 0 |

---

## Critical Issues (Requires Immediate Fix)

### 1. O(N) KEYS Command in Click Fraud Detection
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/services/clickFraudService.ts`
**LINES:** 140-141
**ISSUE:** Using `redis.keys()` to count campaign click stats is O(N) and blocks Redis. On large keyspaces, this causes production incidents.

```typescript
// CURRENT (BLOCKING - O(N)):
const userKeys = await redis.keys(`ads:fraud:user:${campaignId}:*`);
const ipKeys = await redis.keys(`ads:fraud:ip:${campaignId}:*`);
```

**RECOMMENDATION:** Use SCAN instead or maintain counters:
```typescript
// FIX 1: Use SCAN (non-blocking):
let cursor = '0';
const userKeys: string[] = [];
do {
  const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `ads:fraud:user:${campaignId}:*`, 'COUNT', 100);
  cursor = nextCursor;
  userKeys.push(...keys);
} while (cursor !== '0');

// FIX 2: Maintain aggregated counters in Redis:
const stats = await redis.hgetall(`ads:fraud:stats:${campaignId}`);
```

---

### 2. Insufficient Redis Memory Configuration
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/redis-cluster/redis.conf`
**ISSUE:** `maxmemory 200mb` is dangerously low for production. With 169+ services caching data, this will cause frequent OOM evictions and cache thrashing.

**Current:**
```
maxmemory 200mb
maxmemory-policy allkeys-lru
```

**RECOMMENDATION:** Increase to minimum 1GB for production:
```
maxmemory 4gb
maxmemory-policy allkeys-lru
```

---

### 3. In-Memory Fallback Risk in Billing Service
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/services/billingService.ts`
**LINES:** 149-155
**ISSUE:** When Redis fails in `getDailySpent()`, it returns 0, which could cause campaigns to overspend beyond their daily budget.

```typescript
// CURRENT (RISK):
private async getDailySpent(campaignId: string): Promise<number> {
  try {
    const redis = getRedis();
    const spent = await redis.get(key);
    return parseFloat(spent || '0');
  } catch (redisErr) {
    logger.warn('[BillingService] Redis getDailySpent failed, returning 0:', ...);
    return 0;  // DANGER: Campaign could overspend!
  }
}
```

**RECOMMENDATION:** Fail closed for budget-critical operations:
```typescript
// FIX:
private async getDailySpent(campaignId: string): Promise<number> {
  try {
    const redis = getRedis();
    const spent = await redis.get(key);
    return parseFloat(spent || '0');
  } catch (redisErr) {
    logger.error('[BillingService] Redis getDailySpent failed:', ...);
    // Fail closed - do not allow charging if we can't track
    throw new Error('Daily budget tracking unavailable');
  }
}
```

---

### 4. Cache Race Condition in Shared Memory
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/agents/shared-memory.ts`
**LINE:** 225
**ISSUE:** The in-memory fallback `memoryStore.set()` is not atomic with Redis operations, leading to potential data inconsistency during Redis failover.

```typescript
// CURRENT (RACE CONDITION):
async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const redis = getRedisClient();
  if (redis && isRedisConnected) {
    await redis.set(key, JSON.stringify({ value, expiresAt }), 'EX', ...);
    return;  // If Redis succeeds but this returns early...
  }
  // ...fallback could execute if Redis call fails after success
  memoryStore.set(key, { value, expiresAt: ... });
}
```

**RECOMMENDATION:** Use a flag to track Redis success:
```typescript
// FIX:
async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const redis = getRedisClient();
  if (redis && isRedisConnected) {
    try {
      await redis.set(key, JSON.stringify({ value, expiresAt }), 'EX', ...);
      return;  // Only return on confirmed success
    } catch (err) {
      logger.warn('[Redis] Set failed, using in-memory fallback:', err);
    }
  }
  memoryStore.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
}
```

---

### 5. Multiple Redis Connections in Intent Graph
**SEVERITY:** HIGH
**FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/config/redis.ts` (3 connections)
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-core-platform/services/intent-graph/src/config/redis.ts` (3 connections)

**ISSUE:** Creating 3 separate IORedis clients (redis, publisher, subscriber) at module load time can cause connection pool exhaustion under high load.

```typescript
// CURRENT (3 connections on module load):
export const redis = new IORedis(REDIS_URL, {...});
export const publisher = new IORedis(REDIS_URL, {...});  // Connection 2
export const subscriber = new IORedis(REDIS_URL, {...});  // Connection 3
```

**RECOMMENDATION:** Use lazy initialization or connection pooling:
```typescript
// FIX: Lazy initialization
let _redis: IORedis | null = null;
export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(REDIS_URL, {...});
  }
  return _redis;
}
```

---

## High Priority Issues

### 6. O(N) KEYS Command in Cache Middleware
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/middleware/cache.ts`
**LINE:** 94
**ISSUE:** Using `redis.keys()` for cache invalidation.

```typescript
// CURRENT (BLOCKING):
const keys = await redis.keys(`cache:${pattern}*`);
if (keys.length > 0) {
  await redis.del(...keys);
}
```

**RECOMMENDATION:** Use SCAN:
```typescript
// FIX:
let cursor = '0';
do {
  const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `cache:${pattern}*`, 'COUNT', 100);
  cursor = nextCursor;
  if (keys.length > 0) {
    await redis.del(...keys);
    log.info('[Cache] Invalidated cache keys', { count: keys.length, pattern });
  }
} while (cursor !== '0');
```

---

### 7. Missing TTL Validation in Intent Cache Service
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/services/IntentCacheService.ts`
**ISSUE:** TTL values are defined but not consistently applied. Some operations may cache indefinitely if Redis fails.

```typescript
// CURRENT (Potentially indefinite caching):
async getActiveIntents(userId: string): Promise<CachedIntent[] | null> {
  if (this.useRedis) {
    const cached = await sharedMemory.get<CachedIntent[]>(key);
    return cached || null;
  }
  return null;  // Falls through to DB
}
```

**RECOMMENDATION:** Ensure all cache operations include TTL.

---

### 8. No Connection Health Check at Startup
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/server/server.ts`
**ISSUE:** Server starts without verifying Redis connectivity. Shared memory silently falls back to in-memory.

```typescript
// CURRENT (No Redis verification):
async function startServer() {
  await connectDB();  // Only DB is verified
  // Redis connection not verified - sharedMemory silently falls back
}
```

**RECOMMENDATION:** Add Redis health check:
```typescript
// FIX:
const redisHealthy = await checkRedisHealth();
if (!redisHealthy) {
  log.warn('[Server] Redis unavailable - using in-memory fallback');
}
// Continue startup
```

---

### 9. Inconsistent Redis URL Validation
**SEVERITY:** MEDIUM
**FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/config/redis.ts` - Throws error if REDIS_URL missing
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-profile-service/src/config/redis.ts` - Throws error if REDIS_URL missing
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/config/redis.ts` - Falls back to localhost
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/agents/shared-memory.ts` - Falls back to localhost

**RECOMMENDATION:** Standardize - all services should fail at startup if REDIS_URL is missing in production:
```typescript
// In shared-memory.ts:
const REDIS_URL = process.env.REDIS_URL || process.env.INTENT_GRAPH_REDIS_URL;
if (!REDIS_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REDIS_URL environment variable is required in production');
}
```

---

## Medium Priority Issues

### 10. In-Memory Fallback Memory Leak Risk
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/agents/shared-memory.ts`
**LINE:** 192
**ISSUE:** The `memoryStore` Map has no eviction policy and grows indefinitely in fallback mode.

```typescript
// CURRENT (NO EVICTION):
const memoryStore = new Map<string, { value: unknown; expiresAt: number | null }>();
```

**RECOMMENDATION:** Add periodic cleanup:
```typescript
// FIX:
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt && now > entry.expiresAt) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute
```

---

### 11. Rate Limiter Missing Redis Store Validation
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/middleware/rateLimit.ts`
**ISSUE:** Rate limiters use in-memory store when Redis is unavailable, causing inconsistent rate limiting across instances.

```typescript
// CURRENT:
export const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  // No store specified - uses in-memory
});
```

**RECOMMENDATION:** Use Redis store with fallback:
```typescript
// FIX: Use Redis store when available
import RedisStore from 'rate-limit-redis';

const createRateLimiter = (redis: IORedis) => rateLimit({
  store: new RedisStore({ sendCommand: (...args) => (redis as any).call(...args) }),
  windowMs: 60 * 1000,
  max: 100,
});
```

---

### 12. Pub/Sub Client Not Closed on Shutdown
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/config/redis.ts`
**ISSUE:** Publisher and subscriber connections are not explicitly closed during graceful shutdown.

```typescript
// CURRENT:
process.on('SIGTERM', () => shutdown('SIGTERM'));
// shutdown() only closes the HTTP server, not Redis connections
```

**RECOMMENDATION:** Close all Redis connections:
```typescript
// FIX:
async function shutdown(signal: string) {
  await redis.quit();
  await publisher.quit();
  await subscriber.quit();
  // ... rest of shutdown
}
```

---

### 13. Console.log Usage in Shared Memory
**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/agents/shared-memory.ts`
**LINES:** 63-67
**ISSUE:** Uses `console.log/warn/error` instead of the project's structured logger.

```typescript
// CURRENT:
const logger = {
  info: (msg: string, meta?: unknown) => console.log(`[SharedMemory] ${msg}`, meta || ''),
  warn: (msg: string, meta?: unknown) => console.warn(`[SharedMemory] ${msg}`, meta || ''),
  error: (msg: string, meta?: unknown) => console.error(`[SharedMemory] ${msg}`, meta || ''),
};
```

**RECOMMENDATION:** Use the shared logger utility.

---

### 14. Missing Connection Timeouts
**SEVERITY:** LOW
**FILES:** Most Redis configurations
**ISSUE:** No explicit `connectTimeout` or `commandTimeout` in IORedis configurations.

**RECOMMENDATION:** Add explicit timeouts:
```typescript
new IORedis(REDIS_URL, {
  connectTimeout: 10000,
  commandTimeout: 5000,
  maxRetriesPerRequest: 3,
  // ... existing config
});
```

---

## Cache Invalidation Issues

### 15. Incomplete Cache Invalidation on Write Operations
**SEVERITY:** MEDIUM
**FILES:** Multiple services
**ISSUE:** Cache invalidation is not consistently applied after mutations. Related caches (list views, aggregations) are not invalidated.

**RECOMMENDATION:** Implement cache invalidation patterns:
1. On user profile update: invalidate user cache + related caches
2. On intent update: invalidate intent cache + category caches + user caches
3. Use pattern-based invalidation with SCAN (not KEYS)

---

## Session Management Notes

### 16. Client-Side Session Tracking (No Issues)
**FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/services/sessionTrackingService.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/services/sessionTimeout.ts`

**STATUS:** These services use local storage and in-memory timers. Appropriate for client-side session tracking.

---

## Positive Findings

1. **Click Fraud Detection** - Uses Redis sorted sets correctly for time-bucketed click tracking
2. **Rate Limiting** - Comprehensive rate limiters with multiple tiers (standard, strict, auth, capture)
3. **Redis Auth** - Most services properly implement Redis authentication
4. **Circuit Breaker** - Well-implemented fail-fast pattern in intent-graph
5. **BullMQ Integration** - Separate Redis clients for job queues in most services
6. **Graceful Shutdown** - Proper connection cleanup in ads-service
7. **TTL Configuration** - Consistent use of TTLs in most cache implementations
8. **Error Handling** - Redis errors are caught and logged appropriately

---

## Summary of Recommendations

| Priority | Count | Action Required |
|----------|-------|-----------------|
| CRITICAL | 2 | Fix immediately |
| HIGH | 3 | Fix within 1 week |
| MEDIUM | 6 | Fix within 1 month |
| LOW | 3 | Fix at convenience |

---

## Files Requiring Immediate Attention

1. `/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/services/clickFraudService.ts` - Replace KEYS with SCAN
2. `/Users/rejaulkarim/Documents/ReZ Full App/redis-cluster/redis.conf` - Increase memory to 4GB
3. `/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/services/billingService.ts` - Fail closed on Redis errors
4. `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/agents/shared-memory.ts` - Add memory leak prevention

---

**Audit Complete**
**Next Steps:** Address CRITICAL issues first, then HIGH priority items.
