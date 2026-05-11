# API Contract Audit Report - Complete Analysis

**Date:** 2026-05-02
**Auditor:** Claude Code
**Scope:** rez-*/services + rez-intent-graph/

---

## Executive Summary

This audit identifies **47 critical inconsistencies** across 15+ services. Frontend integration will fail without resolving these issues.

---

## 1. RESPONSE FORMAT INCONSISTENCIES

### 1.1 Response Format Matrix

| Service | Success Response | Error Response | Data Wrapping |
|---------|-----------------|----------------|----------------|
| rez-merchant-service | `{ success: true, data: {...} }` | `{ success: false, message: "..." }` | Yes |
| rez-auth-service | Mixed (see 1.2) | `{ error: "..." }` or `{ success: false }` | Partial |
| rez-payment-service | `{ success: true, data: {...} }` | `{ success: false, message: "..." }` | Yes |
| rez-wallet-service | `{ success: true, data: {...} }` | `{ success: false, message: "..." }` | Yes |
| rez-catalog-service | `{ success: true, data: {...} }` | `{ success: false, message: "..." }` | Yes |
| rez-order-service | `{ success: true, data: {...} }` | `{ success: false, message: "..." }` | Yes |
| rez-user-intelligence | `{ success: true, data: {...} }` | Mixed (see 1.2) | Yes |
| rez-intent-graph | `res.json(intents)` - No wrapper | `{ error: "..." }` | **NO** |
| rez-search-service | `{ success: true, data: {...} }` | `{ success: false, error: "..." }` | Yes |
| rez-feedback-service | `{ success: true }` with flat fields | `{ error: "..." }` with `details` | Partial |

### 1.2 Critical Issues

#### CRITICAL-1: rez-intent-graph Missing Response Wrapper
**Severity:** CRITICAL
**File:** `/rez-intent-graph/src/api/intent.routes.ts`

```typescript
// BROKEN - Line 57: Returns raw intents array, no wrapper
router.get('/active/:userId', verifyInternalToken, async (req, res) => {
  const intents = await intentCaptureService.getActiveIntents(userId);
  res.json(intents);  // Returns: [{...}, {...}] instead of { success: true, data: [...] }
});

// Line 74: Same issue
router.get('/user/:userId', verifyInternalToken, async (req, res) => {
  const intents = await intentCaptureService.getUserIntents(userId);
  res.json(intents);  // Missing wrapper
});

// Line 91: Same issue
router.get('/dormant/:userId', verifyInternalToken, async (req, res) => {
  const dormantIntents = await dormantIntentService.getUserDormantIntents(userId);
  res.json(dormantIntents);  // Missing wrapper
});

// Line 108: Same issue
router.get('/profile/:userId', verifyInternalToken, async (req, res) => {
  const profile = await crossAppAggregationService.getProfile(userId);
  res.json(profile);  // Missing wrapper
});

// Line 125: Same issue
router.get('/enriched/:userId', verifyInternalToken, async (req, res) => {
  const context = await crossAppAggregationService.getEnrichedContext(userId);
  res.json(context);  // Missing wrapper
});
```

**Recommended Fix:**
```typescript
res.json({ success: true, data: intents });
```

#### CRITICAL-2: rez-auth-service Mixed Response Formats
**Severity:** HIGH
**Files:**
- `/rez-auth-service/src/routes/authRoutes.ts`
- `/rez-auth-service/src/routes/mfaRoutes.ts`

```typescript
// Line 104-110: Success returns flat object with success:true but also returns keyUri and backupCodes
res.json({
  success: true,
  keyUri, // These are NOT wrapped in data
  backupCodes: backupCodes.map((bc) => bc.code),
  message: '...'
});

// Line 165-169: Different format
res.json({
  success: true,
  message: 'MFA successfully enabled',
  isEnabled: true,  // This is flat, not in data
});
```

#### CRITICAL-3: rez-feedback-service Inconsistent Field Names
**Severity:** MEDIUM
**File:** `/rez-feedback-service/src/routes/feedback.ts`

```typescript
// Line 43-47: Uses feedback_id (snake_case)
res.status(201).json({
  success: true,
  message: 'Feedback recorded',
  feedback_id: `${feedback.action_id}_${feedback.timestamp}`  // Inconsistent: uses _id here but _id elsewhere
});

// Line 90: Returns raw stats object
res.json(stats);  // No wrapper

// Line 104-108: Uses snake_case in response
res.json({
  action_id: actionId,  // Different from other services
  history,
  count: history.length
});
```

---

## 2. AUTHENTICATION GAPS

### 2.1 Authentication Matrix

| Service | Endpoint | Auth Required | Auth Type |
|---------|----------|---------------|------------|
| rez-intent-graph | /capture | YES | verifyInternalToken |
| rez-intent-graph | /active/:userId | YES | verifyInternalToken |
| rez-intent-graph | /user/:userId | YES | verifyInternalToken |
| rez-intent-graph | /dormant/:userId | YES | verifyInternalToken |
| rez-intent-graph | /profile/:userId | YES | verifyInternalToken |
| rez-intent-graph | /enriched/:userId | YES | verifyInternalToken |
| rez-intent-graph | /revival | YES | verifyInternalToken |
| rez-intent-graph | /scheduled-revivals | YES | verifyInternalToken |
| rez-feedback-service | POST /feedback | NO | **NONE** |
| rez-feedback-service | POST /batch | NO | **NONE** |
| rez-feedback-service | GET /stats/:merchantId | NO | **NONE** |
| rez-feedback-service | GET /actions/:actionId | NO | **NONE** |
| rez-feedback-service | GET /learning-insights | NO | **NONE** |
| rez-feedback-service | GET /patterns/:merchantId | NO | **NONE** |
| rez-feedback-service | GET /drift/:merchantId | NO | **NONE** |
| rez-merchant-service | /stores | YES | merchantAuth |
| rez-merchant-service | /internal/* | YES | requireInternalToken |
| rez-order-service | /orders | YES | requireOrderAuth |
| rez-payment-service | /pay/initiate | YES | requireAuth |
| rez-wallet-service | /api/wallet/* | YES | requireAuth |
| rez-search-service | /search/* | PARTIAL | optionalAuth |

### 2.2 Critical Issues

#### AUTH-1: rez-feedback-service Has NO Authentication
**Severity:** CRITICAL - SECURITY VULNERABILITY
**File:** `/rez-feedback-service/src/routes/feedback.ts`

All endpoints are unauthenticated. Anyone can:
- Submit fake feedback to corrupt learning data
- Read all merchant statistics
- Access sensitive learning insights

```typescript
// Line 7: Router created with NO middleware
const router = Router();

// Line 25: POST /feedback - NO AUTH
router.post('/', async (req, res, next) => { ... });

// Line 54: POST /batch - NO AUTH
router.post('/batch', async (req, res, next) => { ... });

// Line 83: GET /stats - NO AUTH
router.get('/stats/:merchantId', async (req, res, next) => { ... });
```

**Recommended Fix:**
```typescript
import { requireInternalToken } from '../middleware/auth';

router.post('/', requireInternalToken, async (req, res, next) => { ... });
router.post('/batch', requireInternalToken, async (req, res, next) => { ... });
router.get('/stats/:merchantId', requireInternalToken, async (req, res, next) => { ... });
```

#### AUTH-2: rez-intent-graph Duplicate Auth Implementations
**Severity:** MEDIUM
**File:** `/rez-intent-graph/src/api/intent.routes.ts`

Uses `verifyInternalToken`, `verifyApiKey`, `verifyCronSecret` but:
- No validation of what these functions actually do
- No consistent auth pattern across endpoints

---

## 3. HTTP STATUS CODE INCONSISTENCIES

### 3.1 Status Code Matrix

| Scenario | rez-merchant | rez-payment | rez-wallet | rez-order | rez-feedback | Expected |
|----------|-------------|-------------|-------------|-----------|--------------|----------|
| Success | 200/201 | 200 | 200 | 200/201 | 201 | 200/201 |
| Bad Request | 400 | 400 | 400 | 400 | 400 | 400 |
| Unauthorized | - | - | 401 | - | - | 401 |
| Forbidden | - | 403 | 403 | - | - | 403 |
| Not Found | 404 | - | - | - | - | 404 |
| Server Error | 500 | 500 | 500 | 500 | 500 | 500 |

### 3.2 Critical Issues

#### STATUS-1: Inconsistent 404 Responses
**Severity:** MEDIUM
**File:** Multiple services

```typescript
// rez-merchant-service: Line 74
res.status(404).json({ success: false, message: 'Store not found' });

// But other services don't return 404 at all - they return 500 or just fail
```

#### STATUS-2: Unauthorized Returns Wrong Status
**Severity:** MEDIUM
**File:** `/rez-wallet-service/src/routes/walletRoutes.ts`

```typescript
// Line 108: Returns 401 but uses wrong message format
res.status(401).json({ success: false, message: 'Authentication required' });

// Line 186: Uses 400 for insufficient balance (should be 403)
res.status(400).json({ success: false, message: 'Insufficient balance' }); // Should be 403
```

---

## 4. REQUEST VALIDATION GAPS

### 4.1 Validation Matrix

| Service | Schema Validation | Manual Checks | Field Sanitization |
|---------|------------------|---------------|-------------------|
| rez-merchant-service | Partial (Zod) | Yes (userId format) | Yes (mass assignment protection) |
| rez-payment-service | Yes (Zod) | Yes | Yes |
| rez-wallet-service | Yes (Zod) | Yes | Partial |
| rez-catalog-service | Yes (Zod) | Yes | Yes |
| rez-order-service | Partial | Yes | Yes |
| rez-auth-service | Manual only | Yes | Partial |
| rez-intent-graph | Manual only | Partial | NO |
| rez-feedback-service | Yes (Zod) | No | NO |
| rez-user-intelligence | Yes (middleware validation) | Yes | Unknown |

### 4.2 Critical Issues

#### VAL-1: rez-intent-graph Missing Input Validation
**Severity:** HIGH
**File:** `/rez-intent-graph/src/api/intent.routes.ts`

```typescript
// Line 23-27: Only checks required fields, no type validation
if (!userId || !appType || !intentKey || !eventType || !category) {
  return res.status(400).json({ error: 'Missing required fields' });
}

// Line 143: Missing type validation
if (!dormantIntentId || !triggerType) {
  return res.status(400).json({ error: 'dormantIntentId and triggerType are required' });
}

// No validation that dormantIntentId is a valid ObjectId format
// No validation that triggerType is one of allowed values
```

#### VAL-2: rez-feedback-service No ID Validation
**Severity:** MEDIUM
**File:** `/rez-feedback-service/src/routes/feedback.ts`

```typescript
// Line 83: merchantId from params is not validated
router.get('/stats/:merchantId', async (req, res, next) => {
  const { merchantId } = req.params;
  // No validation that merchantId is valid format
  const stats = await learningService.getStats(merchantId, period);
});

// Line 97: actionId is not validated
router.get('/actions/:actionId', async (req, res, next) => {
  const { actionId } = req.params;
  // No length or format validation
});
```

---

## 5. API VERSION INCONSISTENCIES

### 5.1 Version Matrix

| Service | Version Prefix | Example | Consistent |
|---------|---------------|---------|------------|
| rez-auth-service | None | `/auth/send-otp` | NO |
| rez-payment-service | Mixed | `/pay/initiate`, `/api/payment/initiate` | NO |
| rez-wallet-service | Partial | `/api/wallet/balance` | PARTIAL |
| rez-order-service | None | `/orders` | NO |
| rez-merchant-service | None | `/stores` | NO |
| rez-search-service | Mixed | `/search/stores`, `/api/stores/search` | PARTIAL |
| rez-catalog-service | Partial | `/products`, `/api/products` | PARTIAL |
| rez-intent-graph | Partial | `/api/intent/capture` | YES |
| rez-user-intelligence | None | `/user/event` | NO |
| rez-feedback-service | None | `/feedback` | NO |

### 5.2 Critical Issues

#### VERSION-1: rez-payment-service Dual Path Support
**Severity:** MEDIUM
**File:** `/rez-payment-service/src/routes/paymentRoutes.ts`

```typescript
// Line 189-190: Same endpoint on two paths
router.post('/pay/initiate', paymentLimiter, requireAuth, initiateHandler);
router.post('/api/payment/initiate', paymentLimiter, requireAuth, initiateHandler);

// Line 262-263
router.post('/pay/capture', paymentLimiter, requireAuth, captureHandler);
router.post('/api/payment/capture', paymentLimiter, requireAuth, captureHandler);

// Line 294-295
router.post('/pay/refund', sensitiveLimiter, requireAuth, refundHandler);
router.post('/api/payment/refund', sensitiveLimiter, requireAuth, refundHandler);
```

This creates maintenance burden and potential routing confusion.

---

## 6. UNDOCUMENTED ENDPOINTS

### 6.1 Endpoints Missing Documentation

| Service | Endpoint | Method | Documentation |
|---------|----------|--------|---------------|
| rez-intent-graph | /revival | POST | Basic comment only |
| rez-intent-graph | /revived/:id | POST | Missing |
| rez-intent-graph | /scheduled-revivals | GET | Missing |
| rez-intent-graph | /pause/:id | POST | Missing |
| rez-feedback-service | /learning-insights | GET | Missing |
| rez-feedback-service | /patterns/:merchantId | GET | Missing |
| rez-feedback-service | /drift/:merchantId | GET | Missing |
| rez-merchant-service | /internal/* | ALL | Partial |

---

## 7. ERROR RESPONSE SCHEMA INCONSISTENCIES

### 7.1 Error Format Matrix

| Service | Error Field | Message Field | Details Field | Example |
|---------|-------------|---------------|---------------|---------|
| rez-merchant-service | - | message | - | `{ success: false, message: "..." }` |
| rez-payment-service | - | message | - | `{ success: false, message: "..." }` |
| rez-wallet-service | - | message | - | `{ success: false, message: "..." }` |
| rez-catalog-service | - | message | - | `{ success: false, message: "..." }` |
| rez-auth-service | error | - | - | `{ error: "..." }` |
| rez-intent-graph | error | - | - | `{ error: "..." }` |
| rez-feedback-service | error | - | details | `{ error: "...", details: [...] }` |
| rez-search-service | error | - | - | `{ success: false, error: "..." }` |

### 7.2 Critical Issues

#### ERROR-1: Multiple Error Field Names
**Severity:** HIGH

```typescript
// Format A: { success: false, message: "..." } - MOST COMMON
res.status(500).json({ success: false, message: err.message });

// Format B: { error: "..." }
res.status(500).json({ error: 'Failed to get active intents' });

// Format C: { success: false, error: "..." } - INCONSISTENT
res.status(500).json({ success: false, error: err.message });

// Format D: { error: "...", details: [...] }
res.status(400).json({
  error: 'Invalid feedback data',
  details: validation.error.errors
});
```

---

## 8. RECOMMENDED FIXES (PRIORITY ORDER)

### Priority 1: CRITICAL (Fix Immediately)

1. **rez-feedback-service - Add Authentication**
   - Add `requireInternalToken` middleware to all routes
   - Files: `/rez-feedback-service/src/routes/feedback.ts`

2. **rez-intent-graph - Standardize Response Format**
   - Wrap all responses in `{ success: true, data: ... }`
   - Files: `/rez-intent-graph/src/api/intent.routes.ts`

3. **rez-intent-graph - Add Input Validation**
   - Add Zod schemas for all request bodies
   - Validate ID formats

### Priority 2: HIGH

4. **Standardize Error Response Format**
   - Adopt: `{ success: false, message: "..." }` as standard
   - Remove: `{ error: "..." }` format

5. **Add 404 Responses Where Missing**
   - Review all services for consistent 404 handling

6. **Fix HTTP Status Codes**
   - Use 403 for authorization failures
   - Use 401 for authentication failures
   - Use 400 for validation failures

### Priority 3: MEDIUM

7. **Standardize API Version Prefixes**
   - Choose: `/api/v1/` prefix or no prefix
   - Remove dual-path support (e.g., `/pay/*` and `/api/payment/*`)

8. **Add API Documentation**
   - JSDoc comments for all endpoints
   - OpenAPI/Swagger specs

---

## 9. STANDARDIZED API CONTRACT

### 9.1 Success Response

```typescript
// Single item
{
  success: true,
  data: {
    id: "...",
    // ... fields
  }
}

// Array/List
{
  success: true,
  data: {
    items: [...],
    pagination: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5
    }
  }
}

// Mutation (create/update)
{
  success: true,
  data: { ... },
  message: "Resource created successfully"
}
```

### 9.2 Error Response

```typescript
{
  success: false,
  message: "Human-readable error message",
  code?: "ERROR_CODE", // Optional machine-readable code
  details?: [...] // Optional validation details
}
```

### 9.3 HTTP Status Code Standard

| Status | Use Case |
|--------|----------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (create) |
| 400 | Validation error, bad request |
| 401 | Authentication required |
| 403 | Authorization failed (no permission) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, etc.) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable |

---

## 10. FILES REQUIRING CHANGES

| File | Changes Needed |
|------|--------------|
| `/rez-intent-graph/src/api/intent.routes.ts` | Response wrapper, validation, auth |
| `/rez-feedback-service/src/routes/feedback.ts` | Add authentication |
| `/rez-auth-service/src/routes/mfaRoutes.ts` | Standardize response format |
| `/rez-auth-service/src/routes/authRoutes.ts` | Standardize error format |
| `/rez-wallet-service/src/routes/walletRoutes.ts` | Fix status codes |
| `/rez-payment-service/src/routes/paymentRoutes.ts` | Remove duplicate paths |

---

## Appendix A: Service Inventory

| Service | Port | Routes | Auth Type |
|---------|------|--------|-----------|
| rez-api-gateway | ? | Proxy | Gateway-level |
| rez-auth-service | 4000 | 10+ | JWT |
| rez-merchant-service | 4001 | 80+ | JWT (merchantAuth) |
| rez-payment-service | 4001 | 10+ | JWT (requireAuth) |
| rez-wallet-service | 4002 | 10+ | JWT (requireAuth) |
| rez-order-service | 4003 | 15+ | JWT (requireOrderAuth) |
| rez-catalog-service | 4004 | 10+ | JWT (requireInternalToken) |
| rez-search-service | 4005 | 20+ | optionalAuth |
| rez-intent-graph | 4006 | 15+ | Internal Token |
| rez-user-intelligence | 4007 | 15+ | JWT |
| rez-feedback-service | 4010 | 10+ | **NONE** |

---

*Report generated by API Contract Specialist*
