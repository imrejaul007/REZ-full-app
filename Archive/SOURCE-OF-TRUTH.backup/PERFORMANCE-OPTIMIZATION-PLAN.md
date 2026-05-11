# Performance Optimization Roadmap
**Date:** 2026-04-30
**Status:** Planned

---

## Overview

This document outlines the performance optimization plan for the REZ ecosystem, focusing on database queries, connection pooling, and pagination.

---

## Database Optimizations

### 1. Cursor Pagination Migration

**Status:** Utilities Ready

**Files:**
- `rez-order-service/src/utils/cursorPagination.ts`
- `rez-order-service/src/utils/cursorPaginationMigrations.ts`

**Endpoints to Migrate:**
| Endpoint | Current | Target |
|----------|---------|--------|
| GET /orders | offset pagination | cursor-based |
| GET /orders/:id | - | - |
| GET /merchants | offset pagination | cursor-based |
| GET /products | offset pagination | cursor-based |

**Migration Steps:**
1. Test cursor pagination utility
2. Create v2 endpoints with cursor pagination
3. Monitor v1 usage
4. Deprecate v1 endpoints
5. Sunset v1 endpoints

### 2. Database Index Audit

**Checklist:**
- [ ] Review slow queries in production
- [ ] Add missing indexes for:
  - orders.userId + createdAt
  - orders.merchantId + status
  - wallet.userId + createdAt
  - payments.userId + status

### 3. Connection Pooling

**Current Settings:**
```typescript
// MongoDB
maxPoolSize: 50
minPoolSize: 5

// Redis
maxRetriesPerRequest: null
```

**Recommendations:**
- Monitor pool utilization
- Adjust based on production metrics
- Add connection timeout alerts

---

## API Optimizations

### 1. Response Compression
```typescript
import compression from 'compression';
app.use(compression());
```

### 2. Response Caching

**Headers to Add:**
```typescript
res.set('Cache-Control', 'private, max-age=60');
res.set('ETag', '"' + hash + '"');
```

### 3. Field Filtering

Add `fields` query param to limit response:
```
GET /orders?fields=id,status,total
```

---

## Implementation Timeline

| Week | Tasks |
|------|-------|
| Week 1 | Cursor pagination migration - orders |
| Week 2 | Cursor pagination migration - merchants |
| Week 3 | Index audit + implementation |
| Week 4 | Response compression + caching |

---

## Verification

```bash
# Check slow queries
db.getProfilingLevel(1)
db.system.profile.find({ms: {$gt: 100}})

# Check connection pool
db.serverStatus().connections
```
