# WAVE 11: Comprehensive Security Audit & Fixes
**Date:** 2026-04-30
**Status:** COMPLETE

---

## Audit Summary

### Services Audited
- rez-merchant-service
- rez-order-service
- rez-payment-service
- rez-wallet-service

### Issues Found (Pre-Fix)

| Service | Critical | High | Medium | Low | Total |
|---------|----------|------|--------|-----|-------|
| merchant | 0 | 12 | 42 | 29 | 83 |
| order | 0 | 6 | 15 | 29 | 50 |
| payment | 0 | 3 | 9 | 15 | 27 |
| wallet | 0 | 2 | 12 | 16 | 30 |
| **TOTAL** | **0** | **23** | **78** | **89** | **190** |

---

## Critical/High Issues Fixed

### 1. Hardcoded Fallback URLs REMOVED

| Service | File | Issue |
|---------|------|-------|
| payment | `services/profileIntegration.ts` | `AUTH_SERVICE_URL` had localhost fallback |
| order | `services/intentCaptureService.ts` | `INTENT_CAPTURE_URL` had onrender.com fallback |
| order | `config/redis.ts` | `REDIS_URL` had localhost fallback |
| order | `config/mongodb.ts` | `MONGODB_URI` had localhost fallback |
| merchant | `routes/oauth.ts` | `REDIRECT_URI` had localhost fallback |

**Fix:** All fallbacks removed - services now fail at startup if env vars are missing.

### 2. Silent Error Swallowing FIXED

| Service | File | Lines | Issue |
|---------|------|-------|-------|
| order | `httpServer.ts` | 753, 937, 1094-1097, 1282-1309, 1376 | Multiple `intentTrack` and Redis `.catch(() => {})` |
| order | `services/intentCaptureService.ts` | 28-48 | Track function swallowed all errors |

**Fix:** Added proper error logging to all fire-and-forget operations.

### 3. Pagination Limits ADDED

| Service | File | Issue |
|---------|------|-------|
| merchant | `routes/bizdocs.ts` | No pagination on GET /bizdocs |

**Fix:** Added pagination with `Math.min(100, limit)` cap.

### 4. OAuth Security HARDENED

| Service | File | Issue |
|---------|------|-------|
| merchant | `routes/oauth.ts` | Missing required env vars validated at startup |

**Fix:** Added startup validation for `REZ_AUTH_SERVICE_URL`, `PARTNER_REZ_MERCHANT_CLIENT_ID`, `PARTNER_REZ_MERCHANT_REDIRECT_URI`.

---

## Files Modified

### rez-payment-service
```
src/services/profileIntegration.ts
```

### rez-order-service
```
src/httpServer.ts
src/services/intentCaptureService.ts
src/config/redis.ts
src/config/mongodb.ts
```

### rez-merchant-service
```
src/routes/oauth.ts
src/routes/bizdocs.ts
src/middleware/auth.ts (Wave 10)
src/routes/payroll.ts (Wave 10)
```

---

## Security Improvements

### Fail-Fast Startup
```typescript
// Before
const AUTH_SERVICE_URL = process.env.REZ_AUTH_SERVICE_URL || 'http://localhost:4002';

// After
const AUTH_SERVICE_URL = process.env.REZ_AUTH_SERVICE_URL;
if (!AUTH_SERVICE_URL) {
  throw new Error('REZ_AUTH_SERVICE_URL environment variable is required');
}
```

### Error Logging
```typescript
// Before
intentTrack(params).catch(() => {});

// After
intentTrack(params).catch((err) => {
  logger.warn('[Intent] Track failed', {
    event: params.event,
    error: err instanceof Error ? err.message : String(err),
  });
});
```

---

## Remaining Recommendations

### High Priority
1. Add rate limiting middleware to order-service
2. Add ObjectId validation to wallet-service routes
3. Audit and reduce `as any` casts

### Medium Priority
1. Use existing Zod schemas in order-service routes
2. Add correlation/request IDs to all logs
3. Optimize N+1 queries in wallet reconciliation

### Low Priority
1. Add JSDoc to exported functions
2. Remove magic numbers
3. Standardize error response format

---

## Verification Commands

```bash
# Verify no localhost fallbacks remain
grep -rn "localhost:[0-9]" --include="*.ts" src/ | grep -v "process.env\|//\|/\*"

# Verify error logging on intentTrack
grep -rn "intentTrack" --include="*.ts" src/ | grep -c ".catch"

# Verify no silent catches
grep -rn ".catch(() => {})" --include="*.ts" src/
```

---

## Commit Reference

All fixes committed as part of Wave 11 security audit.
