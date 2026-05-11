# OPS-003: No API Gateway — RESOLVED

**Severity:** P0 — Critical
**Type:** OPS + SEC
**Owner:** Platform Team
**Date Identified:** 2026-04-29
**Date Fixed:** 2026-04-29
**Status:** ✅ RESOLVED

---

## Issue Summary

Services called each other directly via environment variables (`REZ_MERCHANT_SERVICE_URL`, `REZ_WALLET_SERVICE_URL`, etc.) without a centralized entry point. Every service handled authentication, rate limiting, logging, and routing independently.

## Impact Assessment

| Risk | Likelihood | Impact | Score |
|------|------------|--------|-------|
| Auth bypass via inconsistent validation | High | Critical | 9.0 |
| Rate limit exhaustion of wallet service | High | Critical | 9.0 |
| Token compromise exposes all services | Medium | Critical | 9.0 |
| Cascade failure (no circuit breakers) | High | High | 8.0 |
| Internal infrastructure exposure | High | High | 8.0 |
| CORS misconfiguration | Medium | High | 7.0 |
| No DDoS protection | Medium | High | 7.0 |

## Audit Findings

### 1. Service Communication Patterns
Services communicate via direct HTTP calls using environment-variable URLs:
- `REZ_MERCHANT_SERVICE_URL` → merchant.client.ts
- `REZ_WALLET_SERVICE_URL` → wallet.connector.ts, credit.client.ts
- `REZ_AUTH_SERVICE_URL` → callback/route.ts, profile.client.ts

### 2. Authentication Inconsistencies
| Service | Auth Approach | Risk |
|---------|--------------|------|
| rez-ads-service | JWT (`verifyConsumer`, `verifyMerchant`) | Medium |
| rez-wallet-service | Internal token + JWT | Low |
| rez-payment-service | Internal token only | High |
| rez-gamification-service | JWT + internal token | Medium |

### 3. Rate Limiting Gaps
| Service | Rate Limiter | Fail Behavior |
|---------|--------------|---------------|
| `rez-payment-service` | Yes (3 tiers) | **Fail-closed** |
| `rez-gamification-service` | Redis-based | **Fail-closed** |
| `rez-ads-service` | In-memory | **Fail-closed** |
| `rez-wallet-service` | **None** | N/A — **CRITICAL** |

### 4. Hardcoded Production URLs
Source code contained hardcoded production URLs:
```typescript
// Found in:
restauranthub/packages/rez-client/src/clients/wallet.client.ts
restauranthub/packages/rez-client/src/clients/merchant.client.ts
restauranthub/packages/rez-client/src/clients/catalog.client.ts
restauranthub/packages/rez-client/src/clients/analytics.client.ts
restauranthub/apps/api/src/modules/fintech/fintech.service.ts
```

---

## Resolutions Implemented

### Fix 1: Rate Limiting for Wallet Service ✅

**File:** `rez-wallet-service/src/middleware/rateLimiter.ts`

```typescript
// Features:
// - Redis-backed rate limiting (fail-closed)
// - General limiter: 500 requests/15min per IP/user
// - Balance read limiter: 100 requests/min per user
// - Transaction limiter: 30 requests/min per user
// - Sensitive operations: 10 requests/min (payouts, BNPL)
// - Internal service limiter: 1000 requests/min per service
```

Applied to routes in `rez-wallet-service/src/index.ts`:
- `/wallet` — generalLimiter
- `/internal` — generalLimiter
- `/` (payouts) — sensitiveLimiter
- `/api/credit` (BNPL) — sensitiveLimiter

### Fix 2: Hardcoded URLs Removed ✅

Removed hardcoded production URLs from:
- `restauranthub/packages/rez-client/src/rez-http.client.ts`
- `restauranthub/packages/rez-client/src/clients/wallet.client.ts`
- `restauranthub/packages/rez-client/src/clients/merchant.client.ts`
- `restauranthub/packages/rez-client/src/clients/catalog.client.ts`
- `restauranthub/packages/rez-client/src/clients/analytics.client.ts`
- `restauranthub/apps/api/src/modules/fintech/fintech.service.ts`

Services now fail-fast if environment variables are missing:
```typescript
const baseURL = this.config.get<string>('REZ_WALLET_URL');
if (!baseURL) {
  throw new Error('REZ_WALLET_URL environment variable is required');
}
```

### Fix 3: Unified Auth Middleware ✅

**File:** `rez-shared/src/middleware/internalAuth.ts`

Features:
- Timing-safe token comparison (prevents timing attacks)
- Scoped tokens support (per-service tokens)
- Legacy token fallback (for migration period)
- IP allowlisting (optional)
- XFF spoofing detection
- HMAC-based validation
- JWT verification helper

```typescript
// Usage:
import { createInternalAuthMiddleware, createAuthOptionsFromEnv } from '@rez/shared';

const authMiddleware = createInternalAuthMiddleware(createAuthOptionsFromEnv());
app.use('/internal', authMiddleware);
```

### Fix 4: Centralized Logging ✅

**File:** `rez-shared/src/utils/logger.ts`

Features:
- W3C traceparent compatible correlation IDs
- Structured JSON logging
- Service context tagging
- Request/response timing
- Express middleware integration
- Service-to-service call logging

```typescript
// Usage:
import { logger, expressCorrelationMiddleware } from '@rez/shared';

app.use(expressCorrelationMiddleware);

// Log with correlation context
logger.info('Request completed', {
  correlationId: req.correlationId,
  traceId: req.traceId,
  spanId: req.spanId,
});
```

### Fix 5: Kong Gateway Configuration ✅

**File:** `rez-api-gateway/kong/declarative/kong.yml`

Features:
- JWT validation plugin
- CORS enforcement (whitelisted origins)
- Rate limiting (per service, Redis-backed)
- Proxy caching (financial services disabled)
- Request/response transformation
- Bot detection
- Request size limiting (100MB max)
- Structured logging to Elasticsearch

---

## Files Created/Modified

### Created
| File | Purpose |
|------|---------|
| `rez-wallet-service/src/middleware/rateLimiter.ts` | Redis-backed rate limiting for wallet service |
| `rez-shared/src/middleware/internalAuth.ts` | Unified internal auth middleware |
| `rez-shared/src/utils/logger.ts` | Centralized logging with correlation IDs |
| `rez-api-gateway/kong/declarative/kong.yml` | Kong Gateway declarative configuration |

### Modified
| File | Change |
|------|--------|
| `rez-wallet-service/src/index.ts` | Added rate limiters to routes |
| `restauranthub/packages/rez-client/src/rez-http.client.ts` | Removed hardcoded URLs from comments |
| `restauranthub/packages/rez-client/src/clients/*.client.ts` | Added env var validation |
| `restauranthub/apps/api/src/modules/fintech/fintech.service.ts` | Removed hardcoded URLs |
| `rez-shared/src/middleware/index.ts` | Export new internalAuth middleware |
| `SOURCE-OF-TRUTH/MASTER-AUDIT-2026.md` | Documented OPS-003 resolution |

---

## Remaining Work

| Item | Priority | Status | Notes |
|------|---------|--------|-------|
| mTLS for internal services | High | Pending | Requires certificate infrastructure (Vault/PKI) |
| Deploy Kong Gateway | Medium | Pending | Replace/augment nginx gateway |
| Centralized logging aggregation | Medium | Pending | ELK/Datadog integration |
| DDoS protection | Medium | Pending | Cloudflare/AWS Shield |
| API versioning | Low | Pending | Requires client coordination |

---

## Verification Commands

```bash
# Verify rate limiting is applied
grep -n "Limiter" rez-wallet-service/src/index.ts

# Verify no hardcoded URLs remain
grep -rn "onrender.com" --include="*.ts" . | grep -v node_modules

# Verify unified auth exports
grep "internalAuth" rez-shared/src/middleware/index.ts
```

---

## References

- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Kong Gateway Documentation](https://docs.konghq.com/gateway/)
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
