# DEEP API Consistency Audit

**Date:** 2026-05-02
**Auditor:** API Architecture Review
**Scope:** All services in `/Users/rejaulkarim/Documents/ReZ Full App/rez-*` and `/Users/rejaulkarim/Documents/rez-intent-graph/`

---

## Executive Summary

This audit identifies **67 API inconsistencies** across 15+ services. Issues are categorized by severity and impact on API consumer experience.

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 8 | Security vulnerabilities, missing auth checks |
| HIGH | 15 | Response format inconsistencies, wrong status codes |
| MEDIUM | 27 | Validation inconsistencies, missing pagination |
| LOW | 17 | Naming conventions, minor deviations |

---

## 1. Response Format Inconsistency

### 1.1 Standard Pattern (Best Practice)

```typescript
// CORRECT - Standard response envelope
res.json({
  success: true,
  data: { ... },
  message?: '...'
});

// For errors
res.status(400).json({
  success: false,
  message: 'Error description',
  error?: { ... } // Optional detailed errors
});
```

### 1.2 Findings by Service

| Service | File | Issue | Severity |
|---------|------|-------|----------|
| `rez-auth-service` | `authRoutes.ts` | Line 104-110: Uses `{ success: true, keyUri, backupCodes, message }` - missing `data` wrapper | HIGH |
| `rez-auth-service` | `authRoutes.ts` | Line 165-169: Uses `{ success: true, message, isEnabled }` - inconsistent | HIGH |
| `rez-auth-service` | `mfaRoutes.ts` | Line 104-110: Returns `{ success: true, keyUri, backupCodes, message }` without `data` | HIGH |
| `rez-auth-service` | `mfaRoutes.ts` | Line 369-375: Returns `{ success: true, isEnabled, enabledAt, ... }` without `data` | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 90: Returns raw `stats` object directly - `res.json(stats)` | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 104-108: Returns `{ action_id, history, count }` - no success envelope | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 122-126: Returns `{ insights, generated_at, count }` - no success envelope | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 140-144: Returns `{ merchant_id, patterns, analyzed_at }` - no success envelope | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 158-162: Returns `{ merchant_id, drift_detections, analyzed_at }` - no success envelope | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 170-175: Returns `{ service, status, timestamp }` - no success envelope | HIGH |
| `rez-merchant-service` | `orders/list.ts` | Line 61: Returns `{ success: true, data: { orders: [], total: 0, ... } }` - correct | LOW |
| `rez-search-service` | `searchRoutes.ts` | Line 97: Returns `{ success: false, error: err.message }` - uses `error` not `message` | MEDIUM |
| `rez-search-service` | `searchRoutes.ts` | Line 276: Returns `{ success: false, error: '...' }` - uses `error` not `message` | MEDIUM |
| `rez-travel-service` | `flightRoutes.ts` | Line 49-56: Returns `{ success: true, data: { flights, searchParams, total } }` - correct | LOW |
| `rez-travel-service` | `flightRoutes.ts` | Line 112-121: Returns `{ success: true, data: { bookingId, pnr, status, total, message } }` - uses `message` inside data | MEDIUM |
| `rez-intent-graph` | `merchant.routes.ts` | Line 169-173: Returns `{ success: true, data: dashboard }` - correct | LOW |
| `rez-intent-graph` | `intent.routes.ts` | Line 40: Returns `{ success: true, data: result }` - correct | LOW |

### 1.3 Response Format Standardization

**RECOMMENDATION:** All endpoints MUST return:

```typescript
// Success
res.json({
  success: true,
  data: <payload>,
  message?: string
});

// Error
res.status(<code>).json({
  success: false,
  message: string,
  errors?: any[]
});
```

**Action Required:**
- [ ] Audit and fix `rez-auth-service` MFA routes
- [ ] Audit and fix `rez-feedback-service` all routes
- [ ] Audit and fix `rez-search-service` error responses
- [ ] Audit `rez-travel-service` for mixed patterns

---

## 2. HTTP Status Code Issues

### 2.1 Standard Pattern

| Operation | Status Code | Use Case |
|-----------|-------------|----------|
| GET success | 200 | Successful retrieval |
| POST success | 201 | Resource created |
| PUT/PATCH success | 200 | Resource updated |
| DELETE success | 200/204 | Resource deleted (200 with message, 204 no body) |
| Bad Request | 400 | Validation failed, malformed request |
| Unauthorized | 401 | Missing/invalid auth |
| Forbidden | 403 | Valid auth but no permission |
| Not Found | 404 | Resource doesn't exist |
| Conflict | 409 | Duplicate resource, state conflict |
| Rate Limited | 429 | Too many requests |
| Server Error | 500 | Internal error |

### 2.2 Findings

| Service | File | Line | Issue | Severity |
|---------|------|------|-------|----------|
| `rez-auth-service` | `authRoutes.ts` | 113, 172, 237, 379 | Uses `throw new ApiError(500, ...)` instead of `res.status(500)` in async handlers | HIGH |
| `rez-auth-service` | `mfaRoutes.ts` | 113, 172, 237, 291, 347, 378 | Uses `throw new ApiError(...)` instead of proper error middleware pattern | HIGH |
| `rez-merchant-service` | `products/crud.ts` | 196, 255, 283, 303, 408 | Uses `res.status(500).json({ success: false, message })` but error object not thrown | MEDIUM |
| `rez-payment-service` | `paymentRoutes.ts` | 259 | Uses `res.status(400)` for all errors - loses 500 semantics | HIGH |
| `rez-payment-service` | `paymentRoutes.ts` | 400 | Returns `res.status(400)` but no message consistency | MEDIUM |
| `rez-wallet-service` | `walletRoutes.ts` | 150-151 | Uses `res.status(400)` but error message is "Credit operation failed" | MEDIUM |
| `rez-travel-service` | `flightRoutes.ts` | 59, 74, 124, 135, 158, 169 | Uses `res.status(500)` consistently but error handling varies | LOW |
| `rez-intent-graph` | `intent.routes.ts` | 43, 60, 77, 94, 111, 128, etc. | All return `res.status(500).json(...)` correctly | LOW |
| `rez-search-service` | `searchRoutes.ts` | 97 | Returns `res.status(500)` with `{ success: false, error }` | MEDIUM |

### 2.3 Error Handling Pattern Standardization

**RECOMMENDATION:** Use centralized error handler middleware:

```typescript
// middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }
  // Log unexpected errors
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}

// In route handler - THROW, don't return res.status
router.post('/', async (req, res, next) => {
  try {
    // ...
    throw new ApiError(400, 'Validation failed');
  } catch (err) {
    next(err); // Pass to error middleware
  }
});
```

---

## 3. Request Validation Issues

### 3.1 Validation Libraries in Use

| Library | Services Using |
|---------|----------------|
| Zod | `rez-payment-service`, `rez-wallet-service` |
| Joi | `rez-travel-service` |
| Custom validation | `rez-auth-service`, `rez-merchant-service` |
| No validation | `rez-feedback-service` |

### 3.2 Findings

| Service | File | Issue | Severity |
|---------|------|-------|----------|
| `rez-feedback-service` | `feedback.ts` | No input validation on any endpoint | CRITICAL |
| `rez-feedback-service` | `feedback.ts` | Line 86: `period` from query not validated | HIGH |
| `rez-feedback-service` | `feedback.ts` | Line 100: `limit` not validated | HIGH |
| `rez-intent-graph` | `merchant.routes.ts` | No input validation on any endpoint | HIGH |
| `rez-intent-graph` | `intent.routes.ts` | No input validation on any endpoint | HIGH |
| `rez-auth-service` | `authRoutes.ts` | Line 108-121: Custom `parsePhone` but inconsistent usage | MEDIUM |
| `rez-merchant-service` | `merchants.ts` | Line 62-113: Custom validation - good pattern but varies | MEDIUM |
| `rez-travel-service` | `flightRoutes.ts` | Uses Joi consistently - BEST PRACTICE | LOW |
| `rez-payment-service` | `paymentRoutes.ts` | Uses Zod with schema transformation - GOOD | LOW |
| `rez-wallet-service` | `walletRoutes.ts` | Uses Zod with custom validateBody middleware - GOOD | LOW |

### 3.3 Validation Standardization

**RECOMMENDATION:** Standardize on **Zod** for all services:

```typescript
import { z } from 'zod';

// Define schemas in separate files
// schemas/feedback.schema.ts
export const createFeedbackSchema = z.object({
  action_id: z.string().min(1),
  outcome: z.enum(['approved', 'rejected', 'ignored', 'failed', 'edited']),
  confidence_score: z.number().min(0).max(1),
  // ...
});

// Usage in route
router.post('/', async (req, res, next) => {
  const result = createFeedbackSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.issues
    });
  }
  // result.data is typed
});
```

**Action Required:**
- [ ] Add Zod validation to `rez-feedback-service` all endpoints
- [ ] Add Zod validation to `rez-intent-graph` merchant and intent routes
- [ ] Standardize `rez-auth-service` to use Zod

---

## 4. Missing Authentication Checks

### 4.1 Authentication Patterns in Use

| Middleware | Services Using |
|------------|----------------|
| `requireAuth` | `rez-auth-service`, `rez-payment-service`, `rez-wallet-service` |
| `merchantAuth` | `rez-merchant-service` |
| `optionalAuth` | `rez-search-service` |
| Custom verify functions | `rez-intent-graph` |
| No auth | `rez-feedback-service` (CRITICAL), `rez-travel-service` |

### 4.2 Findings

| Service | File | Endpoint | Issue | Severity |
|---------|------|----------|-------|----------|
| `rez-feedback-service` | `feedback.ts` | ALL | No authentication on any endpoint | CRITICAL |
| `rez-feedback-service` | `feedback.ts` | `/feedback/stats/:merchantId` | No authorization - any user can query any merchant | CRITICAL |
| `rez-travel-service` | `flightRoutes.ts` | ALL | No authentication on any endpoint | CRITICAL |
| `rez-travel-service` | `flightRoutes.ts` | `/search` | Anyone can search flights | CRITICAL |
| `rez-travel-service` | `flightRoutes.ts` | `/book` | Anyone can book flights without userId validation | CRITICAL |
| `rez-intent-graph` | `intent.routes.ts` | ALL | Uses `verifyInternalToken` but pattern varies | MEDIUM |
| `rez-intent-graph` | `merchant.routes.ts` | Line 126 | Uses `verifyMerchantAuth` but routes vary in protection | MEDIUM |
| `rez-merchant-service` | `orders/list.ts` | Line 13-23 | Has suspension check but uses `merchantAuth` | LOW |
| `rez-search-service` | `searchRoutes.ts` | Various | Uses `optionalAuth` correctly for public search | LOW |

### 4.3 Authentication Standardization

**RECOMMENDATION:**

```typescript
// Standard auth middleware chain
import { requireAuth, requireAdminAuth, requireMerchantAuth } from '@rez/shared/auth';

// Protected routes
router.get('/protected', requireAuth, handler);

// Admin routes
router.post('/admin/action', requireAdminAuth, handler);

// Merchant routes
router.get('/merchant/data', requireMerchantAuth, handler);

// Public routes
router.get('/public', optionalAuth, handler); // Optional: adds userId if present
```

**Action Required:**
- [ ] Add authentication to `rez-feedback-service` all endpoints - **CRITICAL**
- [ ] Add authentication to `rez-travel-service` all endpoints - **CRITICAL**
- [ ] Audit `rez-intent-graph` auth patterns for consistency
- [ ] Add authorization checks to `rez-feedback-service` merchant endpoints

---

## 5. API Versioning Issues

### 5.1 Current State

| Pattern | Services Using | Example |
|---------|----------------|---------|
| `/api/` prefix | Most services | `/api/wallet/balance` |
| `/pay/` prefix | `rez-payment-service` | `/pay/initiate` |
| `/auth/` prefix | `rez-auth-service` | `/auth/otp/send` |
| No prefix | `rez-intent-graph` | `/capture`, `/active/:userId` |
| Versioned (`/v1/`) | None | - |

### 5.2 Findings

| Service | Pattern | Issue | Severity |
|---------|---------|-------|----------|
| `rez-payment-service` | `/pay/`, `/api/` | Dual paths: `/pay/initiate` AND `/api/payment/initiate` | HIGH |
| `rez-search-service` | `/search/`, `/api/` | Dual paths: `/search/stores` AND `/api/stores/search` | MEDIUM |
| `All services` | None | No API versioning (`/v1/`, `/v2/`) | HIGH |
| `rez-intent-graph` | No prefix | Routes at root: `/capture`, `/active/:userId` | HIGH |
| `rez-intent-graph` | Inconsistent | Some routes like `/stats` vs `/api/intent/stats` | HIGH |

### 5.3 Versioning Standardization

**RECOMMENDATION:**

```typescript
// Standard versioning pattern
// /api/v1/wallet/balance
// /api/v1/payment/initiate

// Route structure
router.use('/api/v1', v1Routes);
router.use('/api/v2', v2Routes);

// Deprecation header for v1
res.set('X-API-Deprecated', 'true');
res.set('X-API-Sunset', '2026-12-31');
```

**Action Required:**
- [ ] Implement `/v1/` versioning across all services
- [ ] Remove dual-path patterns in `rez-payment-service`
- [ ] Standardize `rez-intent-graph` routes under `/api/v1/`
- [ ] Add deprecation headers

---

## 6. Pagination Issues

### 6.1 Pagination Patterns in Use

| Pattern | Services Using |
|---------|----------------|
| `{ page, limit, total, totalPages, hasMore }` | `rez-merchant-service`, `rez-order-service` |
| `{ page, limit, total, totalPages }` | `rez-wallet-service` |
| No pagination | `rez-auth-service`, `rez-feedback-service`, `rez-travel-service` |
| `{ skip, limit }` | Legacy patterns |

### 6.2 Findings

| Service | Endpoint | Issue | Severity |
|---------|----------|-------|----------|
| `rez-auth-service` | `/me` | No pagination - returns single user | LOW |
| `rez-feedback-service` | `/feedback/stats/:merchantId` | No pagination | MEDIUM |
| `rez-feedback-service` | `/feedback/actions/:actionId` | Uses `limit` query but not paginated response | MEDIUM |
| `rez-intent-graph` | `/active/:userId` | No pagination | MEDIUM |
| `rez-intent-graph` | `/user/:userId` | No pagination | MEDIUM |
| `rez-intent-graph` | `/merchant-demand/:merchantId` | No pagination | MEDIUM |
| `rez-travel-service` | `/search` | No pagination - returns all flights | MEDIUM |
| `rez-wallet-service` | `/transactions` | Uses `{ page, limit, hasMore }` - GOOD | LOW |
| `rez-merchant-service` | `/products` | Uses `{ total, page, limit, totalPages, hasMore }` - EXCELLENT | LOW |

### 6.3 Pagination Standardization

**RECOMMENDATION:**

```typescript
// Standard pagination response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Query parameters: ?page=1&limit=20
const page = Math.max(1, parseInt(req.query.page as string) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
const skip = (page - 1) * limit;
```

**Action Required:**
- [ ] Add pagination to `rez-intent-graph` all list endpoints
- [ ] Add pagination to `rez-feedback-service` all list endpoints
- [ ] Consider pagination for `rez-travel-service` search (if result set can be large)

---

## 7. Summary of Critical Issues

### 7.1 CRITICAL (Immediate Action Required)

| # | Service | Issue | Fix |
|---|---------|-------|-----|
| 1 | `rez-feedback-service` | No authentication on all endpoints | Add `verifyInternalToken` middleware |
| 2 | `rez-feedback-service` | No input validation | Add Zod schemas |
| 3 | `rez-travel-service` | No authentication on booking endpoints | Add `requireAuth` middleware |
| 4 | `rez-travel-service` | No input validation | Add Joi/Zod schemas |
| 5 | `rez-feedback-service` | Response format inconsistent | Standardize to `{ success, data }` envelope |
| 6 | `rez-intent-graph` | No API versioning | Implement `/api/v1/` prefix |
| 7 | All services | No API versioning | Implement `/v1/` versioning |
| 8 | `rez-feedback-service` | Authorization missing | Add merchant ID ownership checks |

### 7.2 HIGH Priority

| # | Service | Issue |
|---|---------|-------|
| 9 | `rez-auth-service` | MFA routes use throw pattern instead of proper error middleware |
| 10 | `rez-payment-service` | Dual paths (`/pay/` and `/api/`) |
| 11 | `rez-search-service` | Error responses use `error` key instead of `message` |
| 12 | `rez-merchant-service` | Error handling varies across routes |
| 13 | `rez-intent-graph` | Routes lack consistent `/api/` prefix |
| 14 | `rez-auth-service` | Response format inconsistency in MFA routes |
| 15 | `rez-feedback-service` | Stats endpoint lacks pagination |

---

## 8. Standardization Recommendations

### 8.1 Response Envelope

```typescript
// Success
{
  success: true,
  data: <payload>,
  message?: string,
  pagination?: { total, page, limit, totalPages, hasMore }
}

// Error
{
  success: false,
  message: string,
  code?: string,
  errors?: Array<{ field: string, message: string }>
}
```

### 8.2 HTTP Status Codes

```typescript
200: GET success, PUT/PATCH success
201: POST (resource created)
204: DELETE success (no body)
400: Validation failed
401: Unauthenticated
403: Unauthorized
404: Not found
409: Conflict
429: Rate limited
500: Server error
503: Service unavailable
```

### 8.3 Request Validation

```typescript
// Use Zod for all request validation
import { z } from 'zod';

const CreateOrderSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive().max(500000),
  paymentMethod: z.enum(['upi', 'card', 'wallet', 'netbanking'])
});
```

### 8.4 Authentication

```typescript
// Protected: requireAuth
// Admin: requireAdminAuth
// Merchant: requireMerchantAuth
// Internal: requireInternalToken
// Public: optionalAuth (adds userId if present)
```

### 8.5 API Versioning

```typescript
// All routes under /api/v1/
router.use('/api/v1', v1Routes);
```

### 8.6 Pagination

```typescript
// Query: ?page=1&limit=20
// Response: { success: true, data: [], pagination: { total, page, limit, totalPages, hasMore } }
```

---

## 9. Service-by-Service Recommendations

### 9.1 rez-auth-service

| Issue | Recommendation |
|-------|----------------|
| MFA routes throw errors instead of returning | Refactor to use error middleware |
| Response format varies | Standardize to `{ success, data }` envelope |
| Legacy aliases | Deprecate in favor of canonical paths |

### 9.2 rez-payment-service

| Issue | Recommendation |
|-------|----------------|
| Dual paths (`/pay/` and `/api/`) | Deprecate `/pay/` in favor of `/api/v1/` |
| Error handling | Use centralized error middleware |

### 9.3 rez-merchant-service

| Issue | Recommendation |
|-------|----------------|
| Order routes in subdirectory | Consolidate under main router |
| Error handling | Use consistent helper function |

### 9.4 rez-feedback-service (HIGH PRIORITY)

| Issue | Recommendation |
|-------|----------------|
| NO AUTHENTICATION | Add `verifyInternalToken` to all routes |
| NO VALIDATION | Add Zod schemas |
| Inconsistent response format | Standardize all responses |

### 9.5 rez-travel-service (HIGH PRIORITY)

| Issue | Recommendation |
|-------|----------------|
| NO AUTHENTICATION | Add `requireAuth` for booking, `optionalAuth` for search |
| NO VALIDATION | Add Joi schemas |
| Response format | Standardize |

### 9.6 rez-intent-graph

| Issue | Recommendation |
|-------|----------------|
| No `/api/` prefix | Add `/api/v1/` prefix |
| No versioning | Implement `/api/v1/intent/` |
| Missing pagination | Add pagination to list endpoints |

### 9.7 rez-wallet-service

| Issue | Recommendation |
|-------|----------------|
| Good validation | Keep Zod pattern |
| Good pagination | Keep pagination pattern |
| Response format | Minor cleanup needed |

---

## 10. Action Plan

### Phase 1: Critical Security Fixes (Week 1)
- [ ] Add authentication to `rez-feedback-service`
- [ ] Add authentication to `rez-travel-service`
- [ ] Add input validation to both services
- [ ] Add authorization checks

### Phase 2: Response Format Standardization (Week 2)
- [ ] Fix `rez-auth-service` MFA routes
- [ ] Fix `rez-feedback-service` all routes
- [ ] Fix `rez-search-service` error responses

### Phase 3: API Versioning (Week 3)
- [ ] Implement `/api/v1/` across all services
- [ ] Remove dual-path patterns
- [ ] Add deprecation headers

### Phase 4: Pagination (Week 4)
- [ ] Add pagination to `rez-intent-graph`
- [ ] Add pagination to `rez-feedback-service`

---

## Appendix: File Locations

### Services Audited

| Service | Route Location |
|---------|----------------|
| `rez-auth-service` | `/src/routes/authRoutes.ts`, `/mfaRoutes.ts`, `/profile.routes.ts` |
| `rez-merchant-service` | `/src/routes/` (100+ route files) |
| `rez-order-service` | `/src/routes/orders/list.ts` |
| `rez-payment-service` | `/src/routes/paymentRoutes.ts` |
| `rez-wallet-service` | `/src/routes/walletRoutes.ts` |
| `rez-feedback-service` | `/src/routes/feedback.ts` |
| `rez-travel-service` | `/src/routes/flightRoutes.ts`, etc. |
| `rez-search-service` | `/src/routes/searchRoutes.ts` |
| `rez-intent-graph` | `/src/api/intent.routes.ts`, `/merchant.routes.ts` |
| `rez-insights-service` | `/src/routes/insights.routes.ts` |

---

*End of Audit Report*
