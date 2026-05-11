# Marketing Platform Code Review Report

**Date:** May 8, 2026
**Reviewer:** Claude Code
**Files Reviewed:** Multiple files across `rez-marketing-backend/services/`

---

## Summary

The marketing platform consists of multiple services: `ads-service`, `marketing-service`, `lead-intelligence`, `unified-messaging`, and `decision-service`. The code quality is **generally good** with proper error handling, security fixes documented, and TypeScript types used throughout. However, several issues need attention.

**Note:** The files specified in the original request (`whatsappService.ts`, `abTestingService.ts`, etc.) do not exist at the specified paths. The actual files are located at:
- WhatsApp: `rez-marketing-backend/services/unified-messaging/src/services/whatsappService.ts`
- Abandoned Cart: `rez-marketing-backend/services/lead-intelligence/src/services/AbandonedCartAutomationService.ts`
- Birthday: `rez-marketing-backend/services/marketing-service/src/audience/BirthdayScheduler.ts`
- Attribution: `rez-marketing-backend/services/ads-service/src/services/attributionService.ts`

---

## Issues Found

### 1. TypeScript Type Safety

| File | Issue | Severity |
|------|-------|----------|
| `whatsappService.ts` | Uses `// @ts-nocheck` | Medium |
| `attributionService.ts` | Uses `// @ts-nocheck` | Medium |
| `clickFraudService.ts` | Uses `// @ts-nocheck` | Medium |
| `interactionRoutes.ts` | Uses `// @ts-nocheck` | Medium |
| `adbazaar.ts` | Uses `// @ts-nocheck` | Medium |

**Recommendation:** Remove `// @ts-nocheck` and fix type errors. This is critical for catching bugs at compile time.

---

### 2. Hardcoded Values

| Location | Issue | Value |
|----------|-------|-------|
| `attributionService.ts:140` | Hardcoded average order value | `50` |
| `clickFraudService.ts` | Magic numbers for thresholds | 30_000ms, 10 clicks, etc. |
| `BirthdayScheduler.ts:25` | Cron expression hardcoded | `'30 2 * * *'` |

**Recommendation:** Move all magic numbers to config/environment variables.

---

### 3. Security Concerns

#### CRITICAL: Webhook Token Default Value
**File:** `whatsappService.ts:30`
```typescript
webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_TOKEN || 'verify_token',
```
Using a default webhook verification token is a security risk. If env var is not set, anyone can verify the webhook.

#### MEDIUM: Missing Rate Limiting on WhatsApp Routes
**File:** `merchantWhatsApp.ts`
- No rate limiting on `/numbers` or `/webhook` endpoints
- Webhook accepts any incoming payload without validation

#### MEDIUM: Internal API Key Comparison
**File:** `adbazaar.ts:14`
```typescript
if (key !== INTERNAL_KEY) {
```
Direct string comparison. Consider using timing-safe comparison or hashing.

---

### 4. Error Handling

| File | Issue |
|------|-------|
| `whatsappService.ts:210,252` | Swallows errors silently in `sendInteractiveButtons` and `sendList` |
| `attributionService.ts` | Returns `null` on errors instead of throwing or using Result type |
| `BirthdayScheduler.ts` | Uses `any` type for error: `err: any` |

**Recommendation:** Implement consistent error handling with typed errors or Result/Either pattern.

---

### 5. API Validation

| File | Status | Notes |
|------|--------|-------|
| `vouchers.ts` | **Good** | Uses Zod schemas for validation |
| `campaigns.ts` | **Good** | Has input validation middleware |
| `merchantWhatsApp.ts` | **Poor** | No validation on POST endpoints |
| `interactionRoutes.ts` | **Good** | Validates ObjectId and auth |

**Good Example (campaigns.ts):**
```typescript
if (typeof name !== 'string' || name.length > 200) {
  return res.status(400).json({ error: 'Campaign name must be a string under 200 characters' });
}
```

---

### 6. Redis Key Patterns

**File:** `clickFraudService.ts`
- Uses `redis.keys()` which is O(N) and can block Redis (lines 140-141)
- Recommendation: Use `SCAN` instead or maintain a separate index

---

### 7. Code Quality Notes

#### Positive Patterns Found:
1. **Idempotency:** Distributed locks used in `campaigns.ts:274` before launch
2. **Atomic Operations:** MongoDB aggregation pipelines for atomic budget checking
3. **Event Emission:** Non-blocking event emission in interaction routes
4. **Fraud Detection:** Redis-backed fraud detection with proper TTL
5. **Rate Limiting:** Campaign creation rate limited to 20/hour per merchant

#### Issues:
1. **Inconsistent Imports:** Some files use default exports, others use named exports
2. **Mixed Error Styles:** Some return errors, others throw
3. **No Transaction Support:** Cross-collection operations lack transactions
4. **Missing Index Hints:** Large aggregation queries may not use indexes efficiently

---

### 8. Missing Features/Tests

| Component | Missing |
|-----------|---------|
| All services | Unit tests |
| Abandoned Cart | Retry logic for failed notifications |
| WhatsApp | Template approval workflow |
| Attribution | Multi-touch attribution model |
| Birthday Scheduler | Duplicate prevention for same day |
| All services | Health check endpoints |

---

## Recommendations

### High Priority

1. **Remove `// @ts-nocheck`** from all files and fix type errors
2. **Remove default webhook token** - fail if env var not set
3. **Add rate limiting** to WhatsApp webhook endpoint
4. **Replace `redis.keys()`** with `SCAN` in `clickFraudService.ts`

### Medium Priority

1. Move all magic numbers to configuration
2. Implement consistent error handling pattern (Result/Either)
3. Add health check endpoints to all services
4. Add unit tests for critical paths

### Low Priority

1. Standardize on named exports
2. Add request/response DTOs for all routes
3. Implement circuit breakers for external service calls
4. Add OpenAPI documentation

---

## Files with Critical Issues

| File | Critical Issues |
|------|-----------------|
| `whatsappService.ts` | Default webhook token, silent error swallowing, no types |
| `attributionService.ts` | Hardcoded revenue, no types |
| `clickFraudService.ts` | O(N) Redis operations, no types |
| `merchantWhatsApp.ts` | No input validation, no rate limiting |

---

## Security Score: 6/10

- Default credentials found
- Missing rate limiting on public endpoints
- No request size limits
- Internal API key uses string comparison

## Code Quality Score: 7/10

- Good security fixes documented in comments
- Proper error handling in most places
- Type safety needs improvement
- Test coverage unknown

## Maintainability Score: 7/10

- Code is well-organized by domain
- Good separation of concerns
- Some files too large (>500 lines)
- Inconsistent patterns across services

---

*End of Report*
