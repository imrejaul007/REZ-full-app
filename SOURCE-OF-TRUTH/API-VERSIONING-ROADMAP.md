# API Versioning Roadmap
**Status:** Q3 2026 Target
**Breaking Change:** Yes

---

## Problem

Current APIs have no version prefix. Breaking changes require client coordination.

**Current:**
```
GET /orders
POST /payments
```

**Target (v2.0):**
```
GET /v1/orders → /v2/orders (deprecation warning)
GET /v2/orders
```

---

## Implementation Plan

### Phase 1: Add Version Prefix (Backward Compatible)

1. **Duplicate routes with `/v1/` prefix:**
```typescript
// Current (keep for backward compat)
app.get('/orders', getOrders);

// New (identical behavior, new path)
app.get('/v1/orders', getOrders);
```

2. **Update client libraries:**
```typescript
// Before
client.getOrders();

// After
client.v1.getOrders();
client.v2.getOrders(); // when available
```

### Phase 2: Add Deprecation Headers

For `/v1/` routes:
```typescript
res.setHeader('Deprecation', 'true');
res.setHeader('Sunset', 'Thu, 31 Dec 2026 23:59:59 GMT');
res.setHeader('Link', '</v2/orders>; rel="successor-version"');
```

### Phase 3: Monitor Usage

Track v1 vs v2 usage:
```typescript
metrics.increment('api.versions.orders.v1', { count: 1 });
metrics.increment('api.versions.orders.v2', { count: 1 });
```

### Phase 4: Sunset v1

After 6 months with <5% v1 traffic:
```typescript
app.get('/v1/orders', (req, res) => {
  res.status(410).json({ error: 'Gone', message: 'Use /v2/orders' });
});
```

---

## Affected Endpoints

| Service | Current Path | v2 Path |
|---------|-------------|---------|
| order | `/orders` | `/v2/orders` |
| payment | `/payments` | `/v2/payments` |
| wallet | `/wallet` | `/v2/wallet` |
| merchant | `/merchants` | `/v2/merchants` |
| auth | `/auth/*` | `/v2/auth/*` |

---

## Client Migration Guide

### Consumer App
```typescript
// Before
import { ordersApi } from '@rez/api';
const orders = await ordersApi.list();

// After
import { ordersApi } from '@rez/api';
const orders = await ordersApi.v2.list(); // or
const orders = await ordersApi.list(); // auto-redirects to v2
```

### Admin App
```typescript
// Before
axios.get('/api/orders')

// After
axios.get('/api/v2/orders')
```

---

## Timeline

| Milestone | Target |
|-----------|--------|
| Phase 1 complete | 2026-07-01 |
| Phase 2 complete | 2026-08-01 |
| Phase 3 monitoring | 2026-08-01 |
| v1 sunset warning | 2026-12-01 |
| v1 sunset | 2027-01-01 |

---

## Checklist

- [ ] Create `/v2/` route handlers (mirror v1)
- [ ] Add deprecation headers to v1 routes
- [ ] Update API documentation
- [ ] Update client SDKs
- [ ] Add version metrics
- [ ] Create migration guide for clients
- [ ] Notify partners 90 days before sunset
- [ ] Deploy v2
- [ ] Monitor v1 usage
- [ ] Sunset v1
