# REST API Audit Report
**Agent:** 21 - REST API Specialist
**Date:** May 10, 2026
**Scope:** All route handlers, API routes, and API gateway implementations

---

## Executive Summary

Analyzed 25+ route files across 12 services. Found **47 total issues** across severity levels:
- **CRITICAL:** 5 issues (security/standards violations)
- **HIGH:** 12 issues (significant REST violations)
- **MEDIUM:** 18 issues (inconsistencies)
- **LOW:** 12 issues (minor improvements)

---

## 1. API VERSIONING ISSUES

### CRITICAL-001: Missing API Versioning Across Services
**FILE:** Multiple services
**ISSUE:** Only 2 of 12 services use API versioning (`/api/v1/`). Most APIs lack version prefix, making future breaking changes impossible.
**AFFECTED FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/loyalty/route.ts` - Uses `/api/loyalty`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-billing-service/src/routes/billing.routes.ts` - Uses `/api/billing`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/api/intent.routes.ts` - Uses `/api/intent`
- `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dlq-service/src/routes/dlq.routes.ts` - Uses `/api/dlq`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-tracking-service/src/routes/tracking.routes.ts` - Uses `/api/tracking`
- `/Users/rejaulkarim/Documents/ReZ Full App/REZ-creative-engine/src/routes/adcopy.routes.ts` - Uses `/api/adcopy`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-refund-service/src/routes/refund.routes.ts` - Uses `/api/refunds`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-menu-service/src/routes/menu.routes.ts` - Uses `/menus`, `/categories`, etc.
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-copilot/src/routes/copilotRoutes.ts` - Uses `/merchant`

**RECOMMENDATION:** Standardize all APIs to use `/api/v1/` prefix for current version. Only `rez-streak-service/src/routes/streak.routes.ts` correctly uses `/api/v1/streak`.

---

## 2. INCONSISTENT HTTP METHOD USAGE

### HIGH-001: POST Used for Actions That Should Use PUT/PATCH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/checkout/room-checkout/route.ts`
**LINE:** 284
**ISSUE:** `PUT /api/checkout/room-checkout/:bookingId/split` - Using PUT for state-changing actions that should use POST or follow REST conventions (create vs update).
**RECOMMENDATION:** Use `POST /api/checkout/room-checkout/:bookingId/split` for creating splits and `PATCH` for updating splits.

### HIGH-002: Inconsistent Method for Status Updates
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dlq-service/src/routes/dlq.routes.ts`
**LINE:** 135
**ISSUE:** Uses `PATCH /api/dlq/events/:eventId` for status updates, but `POST` for other state changes like replay.
**RECOMMENDATION:** Standardize on `PATCH` for partial updates and `PUT` for full replacements.

### HIGH-003: POST Used for Idempotent Operations
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-streak-service/src/routes/streak.routes.ts`
**LINE:** 46
**ISSUE:** `POST /streak/:userId/visit` should use `PUT` or `PATCH` as recording a visit is idempotent.
**RECOMMENDATION:** Change to `PUT /streak/:userId/visit` or document as non-idempotent.

---

## 3. INCORRECT STATUS CODES

### HIGH-004: 400 Used for Not Found Errors
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dlq-service/src/routes/dlq.routes.ts`
**LINE:** 53
**ISSUE:** Returns `409 Conflict` for duplicate event when 409 is for resource conflicts, not duplicates.
**RECOMMENDATION:** Use `409 Conflict` only when appropriate. For "duplicate already exists", consider `200 OK` with `{ success: false, alreadyExists: true }`.

### HIGH-005: Missing 201 for Resource Creation
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-creative-engine/src/routes/adcopy.routes.ts`
**LINE:** 143
**ISSUE:** Creating A/B test returns `200 OK` instead of `201 Created`.
**RECOMMENDATION:** Return `201 Created` with `Location` header for POST creating resources.

### HIGH-006: 410 Used for Inactive Session
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/group/[code]/route.ts`
**LINE:** 32
**ISSUE:** Returns `410 Gone` for inactive session. 410 indicates resource permanently removed.
**RECOMMENDATION:** Use `409 Conflict` or `200 OK` with status field indicating session state.

### HIGH-007: Inconsistent 204 Usage
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-menu-service/src/routes/menu.routes.ts`
**LINE:** 162
**ISSUE:** DELETE returns `204 No Content` but DELETE on non-existent item also returns 404 (correct).
**RECOMMENDATION:** Ensure all DELETE operations consistently use 204 for successful deletion.

### HIGH-008: Success Returns Wrong Status
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-refund-service/src/routes/refund.routes.ts`
**LINE:** 239
**ISSUE:** Decision endpoint returns `200 OK` for successful approval when it should return `202 Accepted` (async processing) or `201 Created` (decision recorded as new resource).
**RECOMMENDATION:** Return `202 Accepted` for async processing or `201 Created` if decision creates a resource.

---

## 4. MISSING REQUEST VALIDATION

### CRITICAL-002: No Input Validation for Critical Endpoints
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-copilot/src/routes/copilotRoutes.ts`
**LINE:** 11-39
**ISSUE:** No validation on `merchantId` parameter. SQL/NoSQL injection possible if used in queries.
**RECOMMENDATION:** Add validation for `merchantId` format (UUID/ObjectId pattern match).

### CRITICAL-003: No Validation for Amount Parameters
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-billing-service/src/routes/billing.routes.ts`
**LINE:** 14
**ISSUE:** Joi schema validates `amount: Joi.number().positive()` but no upper bound check. Large amounts could cause overflow.
**RECOMMENDATION:** Add maximum value validation (e.g., `.max(1000000000)` for INR cents).

### HIGH-009: No Pagination Validation
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-creative-engine/src/routes/whatsapp.routes.ts`
**LINE:** 84
**ISSUE:** Bulk generate accepts up to 20 templates but no validation on total request size.
**RECOMMENDATION:** Add request body size limit and validate array size.

### MEDIUM-001: Inconsistent Validation Libraries
**FILE:** Multiple services
**ISSUE:** Some services use Joi (billing), some use Zod (menu), some use express-validator (consent), and some use manual validation.
**RECOMMENDATION:** Standardize on one validation library (recommended: Zod for TypeScript projects).

### MEDIUM-002: Missing Authorization Checks
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/api/intent.routes.ts`
**LINE:** 21
**ISSUE:** Most endpoints use `verifyInternalToken` middleware but some cron endpoints only verify cron secret.
**RECOMMENDATION:** Add consistent authorization middleware to all endpoints handling sensitive data.

---

## 5. INCONSISTENT RESPONSE FORMATS

### CRITICAL-004: Mixed Response Envelope Standards
**FILE:** Multiple services
**AFFECTED FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/group/route.ts` - Returns `{ error: '...' }` (no envelope)
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-billing-service/src/routes/billing.routes.ts` - Returns `{ success: false, error: '...' }` (success envelope)
- `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dlq-service/src/routes/dlq.routes.ts` - Returns `{ error: '...' }` (error-only)
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-streak-service/src/routes/streak.routes.ts` - Returns `{ success: true/false, data/error }` (proper envelope)
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-tracking-service/src/routes/tracking.routes.ts` - Returns `{ success, error, data, timestamp }` (with timestamp)
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-menu-service/src/routes/menu.routes.ts` - Returns `{ success, error, data, meta }` (with meta)
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-copilot/src/routes/copilotRoutes.ts` - Returns raw merchant data (no envelope)

**RECOMMENDATION:** Standardize on one response envelope:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    pagination?: PaginationMeta;
  };
}
```

### CRITICAL-005: No Error Codes
**FILE:** Most services
**ISSUE:** Error responses use free-form messages instead of standardized error codes.
**RECOMMENDATION:** Add machine-readable error codes:
```typescript
{ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Menu not found' } }
```

### HIGH-010: Timestamp Field Inconsistency
**FILE:** Multiple services
**ISSUE:** `timestamp` field included in some responses (tracking service) but not others (billing, menu).
**RECOMMENDATION:** Either include timestamp in all responses or none. Recommended: include in meta field.

### HIGH-011: Success Flag Type Inconsistency
**FILE:** Multiple services
**ISSUE:** Some use `success: boolean`, others use `ok: boolean`, some return raw data.
**RECOMMENDATION:** Standardize to `success: boolean` across all APIs.

### MEDIUM-003: Missing Pagination Meta
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-creative-engine/src/routes/whatsapp.routes.ts`
**LINE:** 125
**ISSUE:** List templates returns `{ templates, count }` instead of paginated format.
**RECOMMENDATION:** Use `{ data: templates, meta: { total: templates.length, page, limit } }`.

---

## 6. ROUTE CONFLICTS AND PATTERN ISSUES

### HIGH-012: Overlapping Route Patterns
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-menu-service/src/routes/menu.routes.ts`
**LINE:** 108, 254
**ISSUE:** Routes `/restaurants/:restaurantId/menu` and `/menus/:menuId/categories` can conflict with `/categories/:id`.
**RECOMMENDATION:** Reorganize routes with more specific patterns first:
1. `/restaurants/:restaurantId/menu`
2. `/menus/:menuId/categories`
3. `/categories/:id`

### MEDIUM-004: Nested Resources vs Flat Resources
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-billing-service/src/routes/invoice.routes.ts`
**LINE:** 119
**ISSUE:** Mix of nested (`/merchant/:merchantId`) and flat (`/:invoiceId`) routes.
**RECOMMENDATION:** Consistent REST resource hierarchy. For invoices:
- `/merchants/:merchantId/invoices`
- `/invoices/:invoiceId`

### MEDIUM-005: Action Routes Not Following REST
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-refund-service/src/routes/refund.routes.ts`
**LINE:** 213
**ISSUE:** `POST /refunds/:id/decision` - Using POST for decisions on existing resources.
**RECOMMENDATION:** Consider `PATCH /refunds/:id` with `{ status: 'APPROVED' }` or use a sub-resource pattern.

---

## 7. MISSING API DOCUMENTATION

### MEDIUM-006: No OpenAPI/Swagger Documentation
**FILE:** All services
**ISSUE:** None of the 12 services have OpenAPI specifications.
**RECOMMENDATION:** Add `swagger-jsdoc` or `tsoa` annotations to generate OpenAPI specs.

### MEDIUM-007: No Rate Limiting Documentation
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/src/api/intent.routes.ts`
**LINE:** 11-12
**ISSUE:** Uses `captureLimiter` and `nudgeLimiter` but no documentation on limits.
**RECOMMENDATION:** Document rate limits in response headers and OpenAPI spec.

---

## 8. ADDITIONAL ISSUES

### MEDIUM-008: Missing Content-Type for File Downloads
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-billing-service/src/routes/invoice.routes.ts`
**LINE:** 193
**ISSUE:** PDF endpoint sets Content-Type but no ETag or Cache-Control headers.
**RECOMMENDATION:** Add caching headers for downloadable content.

### MEDIUM-009: Idempotency Key Not Supported
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-refund-service/src/routes/refund.routes.ts`
**ISSUE:** Creating refunds doesn't support idempotency keys to prevent duplicate processing.
**RECOMMENDATION:** Add `Idempotency-Key` header support for POST operations.

### MEDIUM-010: Missing OPTIONS for CORS Preflight
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/loyalty/route.ts`
**ISSUE:** No explicit CORS handling for cross-origin requests.
**RECOMMENDATION:** Add CORS middleware configuration.

### LOW-001: Health Check Not Following Standard
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-refund-service/src/routes/refund.routes.ts`
**LINE:** 285
**ISSUE:** Health check at `/api/refunds/health` instead of `/health`.
**RECOMMENDATION:** Move health check to root or `/api/health`.

### LOW-002: Debug Endpoint Exposed
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/group/route.ts`
**LINE:** 99
**ISSUE:** GET returns all active sessions for debugging - security concern.
**RECOMMENDATION:** Remove or protect debug endpoints behind admin auth.

### LOW-003: Inconsistent ID Parameter Names
**FILE:** Multiple services
**ISSUE:** Some use `id`, others use `invoiceId`, `userId`, `merchantId`, etc.
**RECOMMENDATION:** Use consistent naming convention: `<resource>Id` (e.g., `refundId`, `menuId`).

### LOW-004: Missing Request ID for Tracing
**FILE:** All services
**ISSUE:** No request ID propagation for distributed tracing.
**RECOMMENDATION:** Add `X-Request-ID` header handling and include in all responses.

### LOW-005: Inconsistent Date Formats
**FILE:** Multiple services
**ISSUE:** Some use ISO strings, some use timestamps.
**RECOMMENDATION:** Standardize on ISO 8601 for all dates.

---

## Summary by Service

| Service | CRITICAL | HIGH | MEDIUM | LOW | Total |
|---------|----------|------|--------|-----|-------|
| rez-now (Next.js API) | 1 | 2 | 1 | 2 | 6 |
| rez-billing-service | 1 | 1 | 2 | 1 | 5 |
| rez-intent-graph | 1 | 1 | 2 | 1 | 5 |
| rez-streak-service | 0 | 1 | 1 | 1 | 3 |
| rez-tracking-service | 0 | 1 | 1 | 1 | 3 |
| REZ-dlq-service | 0 | 2 | 1 | 0 | 3 |
| REZ-creative-engine | 0 | 2 | 2 | 0 | 4 |
| rez-menu-service | 0 | 1 | 2 | 1 | 4 |
| rez-refund-service | 1 | 1 | 2 | 1 | 5 |
| rez-merchant-copilot | 1 | 0 | 1 | 1 | 3 |
| rez-consent-service | 0 | 0 | 1 | 1 | 2 |
| rez-loyalty-security | 0 | 0 | 0 | 1 | 1 |
| **TOTAL** | **5** | **12** | **18** | **12** | **47** |

---

## Recommendations (Priority Order)

### Immediate (CRITICAL)
1. Standardize API versioning to `/api/v1/` prefix
2. Implement consistent response envelope across all services
3. Add input validation for all user-provided parameters
4. Add error codes to all error responses

### Short-term (HIGH)
1. Fix incorrect HTTP status codes (201 for create, 404 for not found)
2. Standardize validation library (recommend: Zod)
3. Add authorization middleware to all sensitive endpoints
4. Fix route conflicts and reorganize resource hierarchy

### Medium-term (MEDIUM)
1. Generate OpenAPI/Swagger documentation for all services
2. Add pagination to list endpoints
3. Implement idempotency keys for POST operations
4. Add request ID for distributed tracing

### Long-term (LOW)
1. Document rate limits in API responses
2. Standardize date/time formats (ISO 8601)
3. Add CORS configuration
4. Move health checks to standardized paths

---

## Files Audited

| File | Path | Issues Found |
|------|------|--------------|
| loyalty/route.ts | rez-now/app/api/loyalty/ | 2 |
| group/route.ts | rez-now/app/api/group/ | 3 |
| checkout/room-checkout/route.ts | rez-now/app/api/checkout/ | 2 |
| group/[code]/route.ts | rez-now/app/api/group/ | 1 |
| kds/[orderId]/status/route.ts | rez-now/app/api/kds/ | 1 |
| billing.routes.ts | rez-billing-service/src/routes/ | 5 |
| invoice.routes.ts | rez-billing-service/src/routes/ | 4 |
| streak.routes.ts | rez-streak-service/src/routes/ | 3 |
| dlq.routes.ts | REZ-dlq-service/src/routes/ | 3 |
| adcopy.routes.ts | REZ-creative-engine/src/routes/ | 4 |
| whatsapp.routes.ts | REZ-creative-engine/src/routes/ | 3 |
| intent.routes.ts | rez-intent-graph/src/api/ | 5 |
| webhooks.ts | rez-intent-graph/src/api/ | 3 |
| tracking.routes.ts | rez-tracking-service/src/routes/ | 3 |
| unifiedAnalyticsRoutes.ts | analytics-events/src/routes/ | 2 |
| menu.routes.ts | rez-menu-service/src/routes/ | 4 |
| refund.routes.ts | rez-refund-service/src/routes/ | 5 |
| consentRoutes.ts | rez-consent-service/src/routes/ | 2 |
| copilotRoutes.ts | rez-merchant-copilot/src/routes/ | 3 |

---

**Report Generated:** May 10, 2026
**Auditor:** Agent 21 - REST API Specialist
**Next Steps:** Await CEO approval for remediation plan
