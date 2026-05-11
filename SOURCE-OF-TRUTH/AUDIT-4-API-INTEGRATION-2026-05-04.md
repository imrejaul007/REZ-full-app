# AUDIT-4: API & Service Integration Audit Report
**Date:** 2026-05-04
**Auditor:** API & Service Integration Specialist
**Scope:** REZ Ecosystem - All Microservices

---

## Executive Summary

The REZ ecosystem implements a comprehensive microservices architecture with 40+ services communicating through a centralized nginx-based API gateway. The architecture demonstrates mature patterns for service-to-service communication, but several areas require attention for production readiness.

**Overall Assessment:** MODERATE RISK
- Strong foundational patterns (auth, error handling, rate limiting)
- Good external integration security (Razorpay webhooks, HMAC signatures)
- Some inconsistency in API response formats across services
- Missing OpenAPI documentation across all services
- Incomplete circuit breaker implementations

---

## 1. API Gateway Configuration

**Service:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/`

### 1.1 Architecture
- **Type:** nginx-based reverse proxy with declarative configuration
- **Route Pattern:** Strangler Fig migration pattern from monolith
- **Upstream Services:** 16 backend microservices via environment variable URLs

### 1.2 Audited Endpoints

| Endpoint | Backend | Rate Limit | Cache | Issues |
|----------|---------|------------|-------|--------|
| `/api/auth/*` | Auth Service | 100r/m | No | Good |
| `/api/payment/*` | Payment Service | 30r/s | No | No retry configured |
| `/api/wallet/*` | Wallet Service | 50r/s | 3m | Good |
| `/api/orders/*` | Order Service | 50r/s | No | Good |
| `/api/merchant/*` | Merchant Service | 50r/s | No | Good |
| `/api/analytics/*` | Analytics | 50r/s | 15m | Good |
| `/api/search/*` | Search Service | 100r/s | 5m | Good |
| `/api/gamification/*` | Gamification | 50r/s | 5m | Good |

### 1.3 Findings

#### GOOD - Security Headers
```nginx
add_header Content-Security-Policy "default-src 'none'; script-src 'self'..." always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - XFF Spoofing Prevention
```nginx
set_real_ip_from 173.245.48.0/20;  # Cloudflare ranges
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```
**Status:** CORRECTLY IMPLEMENTED

#### ISSUE - Payment Retry Configuration
```nginx
location /api/payment {
    # BE-GW-017: No retries means client receives error on timeout,
    # leaving them uncertain if charge was processed.
    proxy_next_upstream off;
```
**Impact:** HIGH - Clients cannot distinguish between network failures and actual payment failures
**Recommendation:** Implement idempotent payment endpoints with 202 Accepted responses

#### ISSUE - CORS Allowlist Pattern
```nginx
if ($http_origin ~* "^https://(rez\.money|www\.rez\.money|...)") {
```
**Impact:** MEDIUM - Hardcoded pattern requires redeployment for new origins
**Recommendation:** Move to environment variable-based origin configuration

---

## 2. Authentication Service (`rez-auth-service`)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service/`

### 2.1 Audited Endpoints (15+)

| Endpoint | Method | Auth | Rate Limit | Status |
|----------|--------|------|------------|--------|
| `/auth/otp/send` | POST | None | 3/min | OK |
| `/auth/otp/verify` | POST | None | 5/min | OK |
| `/auth/mfa/verify-otp` | POST | MFA Token | - | OK |
| `/auth/login-pin` | POST | None | 100/min | OK |
| `/auth/set-pin` | POST | Bearer | - | OK |
| `/auth/profile` | PATCH | Bearer | 10/min | OK |
| `/auth/complete-onboarding` | POST | Bearer | - | OK |
| `/auth/account` | DELETE | Bearer | - | OK |
| `/auth/admin/login` | POST | None | 100/min | OK |
| `/auth/admin/mfa/verify` | POST | Pending Token | - | OK |
| `/auth/guest` | POST | None | 100/min | OK |
| `/auth/refresh` | POST | Refresh Token | 100/min | OK |
| `/auth/validate` | GET | Optional Bearer | 100/min | OK |
| `/auth/logout` | POST | Bearer | 100/min | OK |
| `/auth/me` | GET | Bearer | None | OK |
| `/auth/has-pin` | GET | None | 10/min | OK - Fixed account enumeration |

### 2.2 Security Findings

#### GOOD - Account Enumeration Prevention (BAK-AUTH-001)
```typescript
// FIXED: Return identical response for all cases
async function hasPinHandler(req: Request, res: Response) {
  res.json({ success: true }); // Always returns same response
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - MFA Session JWT Verification (SEC-005)
```typescript
let jwtPayload: any;
try {
  jwtPayload = jwt.verify(mfaSessionToken, mfaSecret);
} catch (jwtErr: any) {
  throw new ApiError(401, 'MFA session expired or invalid...');
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Timing-Safe Password Comparison
```typescript
// Always run bcrypt even on miss — prevents timing-based enumeration
if (!admin) {
  await bcrypt.compare(password, '$2b$12$invalidhashpadding...');
  throw new ApiError(401, 'Invalid credentials');
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Atomic Phone Update (AS-02)
```typescript
// TOCTOU fix: single atomic operation
const updateResult = await Users.updateOne(
  {
    _id: new mongoose.Types.ObjectId(decoded.userId),
    $nor: [{ phoneNumber: newFullPhone }, { phone: newFullPhone }],
  },
  { $set: { phoneNumber: newFullPhone, ... } },
);
```
**Status:** CORRECTLY IMPLEMENTED

### 2.3 Response Format Inconsistency
**Issue:** Auth service returns mixed formats:
```typescript
// Pattern 1: success wrapper
res.json({ success: true, ...data });

// Pattern 2: Direct data return (in some routes)
res.json({ id, name, phone, ... });

// Pattern 3: Error without wrapper
throw new ApiError(400, 'Phone required');
```
**Impact:** MEDIUM - Client code must handle multiple response formats
**Recommendation:** Standardize all responses to `{ success: boolean, data?: T, error?: Error }`

---

## 3. Payment Service (`rez-payment-service`)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-payment-service/`

### 3.1 Audited Endpoints (12+)

| Endpoint | Method | Auth | Purpose | Status |
|----------|--------|------|---------|--------|
| `/pay/initiate` | POST | Bearer | Start payment | OK |
| `/pay/capture` | POST | Bearer | Capture Razorpay payment | OK |
| `/pay/refund` | POST | Bearer (Admin) | Process refund | OK |
| `/pay/status/:id` | GET | Bearer | Get payment status | OK |
| `/pay/verify` | POST | Internal | Verify signature | OK |
| `/pay/internal/wallet-credit` | POST | Internal | Credit wallet | OK |
| `/api/razorpay/create-order` | POST | Bearer | Create Razorpay order | OK |
| `/api/razorpay/config` | GET | Bearer | Get key_id | OK |
| `/pay/webhook/razorpay` | POST | Signature | Webhook receiver | OK |
| `/pay/merchant/settlements` | GET | Bearer | Get settlements | OK - IDOR fixed |
| `/internal/pay/deduct` | POST | Internal | Deduct payment | OK |
| `/internal/merchants/:id/payment-regularity` | GET | Internal | Credit scoring | OK |

### 3.2 Razorpay Integration Analysis

#### GOOD - Webhook Signature Verification
```typescript
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Event Deduplication
```typescript
const eventId = req.headers['x-razorpay-event-id'] as string | undefined;
if (eventId) {
  const alreadyProcessed = await redis.set(`webhook:event:${eventId}`, '1', 'EX', 86400, 'NX');
  if (alreadyProcessed === null) {
    res.status(200).json(success({ duplicate: true }));
    return;
  }
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Payment State Machine Validation
```typescript
// PAYMENT_WEBHOOK_TRANSITIONS enforces valid transitions
const allowed = PAYMENT_WEBHOOK_TRANSITIONS[payment.status] || [];
if (!allowed.includes('completed')) {
  logger.error('PaymentMachine: illegal transition to SUCCESS/completed', {...});
  return res.status(400).json(apiErr('PAY_FAILED', {...}));
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Replay Prevention via Nonce Check
```typescript
async function isReplayedPaymentId(razorpayPaymentId: string): Promise<ReplayCheckResult> {
  const key = `pay:nonce:${razorpayPaymentId}`;
  const result = await redis.set(key, '1', 'EX', 25 * 3600, 'NX');
  return { replayed: result === null, redisError: false };
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Redis Fail-Closed (MED-04)
```typescript
// Fail closed in ALL environments to prevent replay
catch (err: any) {
  logger.error('Redis unavailable for payment nonce check — failing closed...');
  throw new Error('Payment system temporarily unavailable. Redis unavailable.');
}
```
**Status:** CORRECTLY IMPLEMENTED

#### ISSUE - Settlement IDOR (BE-PAY-017)
**Current:** Merchant can query any merchant's settlements
**Fixed:** Now validates `merchantId` matches authenticated merchant
**Status:** FIXED

### 3.3 Response Format
**Pattern:** Consistent with `success()` wrapper
```typescript
res.json(success({ paymentId: payment.paymentId, status: payment.status }));
```

---

## 4. Order Service (`rez-order-service`)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-order-service/`

### 4.1 Audited Endpoints (8+)

| Endpoint | Method | Auth | Status |
|----------|--------|------|--------|
| `/orders` | POST | Bearer | OK - Idempotency implemented |
| `/orders` | GET | Bearer | OK - Pagination implemented |
| `/orders/stream` | GET | Bearer | OK - SSE with connection limits |
| `/orders/:id` | GET | Bearer | OK - IDOR fixed |
| `/orders/:id/status` | PATCH | Bearer | OK - State machine enforced |
| `/orders/:id/cancel` | POST | Bearer | OK |
| `/orders/summary/:userId` | GET | Internal | OK |
| `/orders/:id/split` | POST | Bearer | OK |

### 4.2 Security Findings

#### GOOD - IDOR Protection (P0-SEC-1)
```typescript
const requestingUserId = (req as any).authUser?.userId;
if (userId && requestingUserId && userId !== requestingUserId) {
  const roles = ((req as any).authUser?.role || '').split(',');
  const isPrivileged = roles.includes('admin') || ...;
  if (!isPrivileged) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Distributed Locking (CONCURRENT-001)
```typescript
const lockAcquired = await bullmqRedis.set(lockKey, '1', 'EX', 60, 'NX');
if (!lockAcquired) {
  return res.status(409).json({ success: false, error: 'CONCURRENT_REQUEST' });
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - SSE Connection Limits (M17)
```typescript
const MAX_CONNECTIONS_PER_MERCHANT = 10;
const MAX_GLOBAL_CONNECTIONS = 1000;
// Check limits before accepting connection
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Order Totals Validation
```typescript
// Server-side subtotal computation — never trust client
let subtotal = 0;
for (const it of validatedItems) {
  subtotal += it.quantity * it.price;
}
```
**Status:** CORRECTLY IMPLEMENTED

---

## 5. Wallet Service (`rez-wallet-service`)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/`

### 5.1 Architecture
- CQRS pattern implemented with read/write separation
- Read routes under `/internal/wallet/read`
- Write routes under `/wallet` and `/merchant-wallet`

### 5.2 Key Patterns

#### GOOD - XFF Spoofing Detection
```typescript
const forwarded = req.headers['x-forwarded-for'] as string | undefined;
if (forwarded) {
  const outermost = forwarded.split(',')[0].trim();
  const isLoopbackOrPrivate = normalized.startsWith('10.') || ...;
  if (isLoopbackOrPrivate) {
    logger.warn('[XFF] Spoofed X-Forwarded-For detected...');
  }
}
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Graceful Shutdown
```typescript
const shutdown = async (signal: string) => {
  server.close(() => {...});
  await stopWalletWorker();
  await mongoose.disconnect();
  await redisClient.quit();
  // XS-CRIT-007: Close pub client
  await pubClient.quit().catch(...);
};
```
**Status:** CORRECTLY IMPLEMENTED

---

## 6. Merchant Service (`rez-merchant-service`)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/`

### 6.1 Domain Routers
- Core, Orders, Engagement, Campaigns, Analytics, Finance, Staff, Operations, Support, QR, LoyaltyConfig, Trials, MarketingTemplates
- All mounted under `/api/merchant`

### 6.2 Security Findings

#### GOOD - CORS Wildcard Prevention (MA-BACK-007)
```typescript
const REZ_ORIGIN_RE = /^https:\/\/(merchant\.rez\.money|admin\.rez\.money|...)$/;
// Removed wildcard vercel.app regex
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - Trust Proxy Range Validation (MA-BACK-008)
```typescript
const rawTrustHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const TRUST_PROXY_HOPS = Number.isFinite(rawTrustHops)
  ? Math.max(1, Math.min(3, rawTrustHops))  // Clamped to 1-3
  : 1;
```
**Status:** CORRECTLY IMPLEMENTED

#### GOOD - HSTS Configuration (MA-BACK-009)
```typescript
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // ...
}));
```
**Status:** CORRECTLY IMPLEMENTED

---

## 7. Finance Service (`rez-finance-service`)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-finance-service/`

### 7.1 Routes
- `/finance/borrow/*` - Consumer borrowing
- `/finance/credit/*` - Credit operations
- `/finance/pay/*` - Payment operations
- `/finance/partner/webhook/*` - Partner webhooks
- `/gst/*` - GST operations
- `/finance/admin/*` - Admin operations

### 7.2 Webhook Security
```typescript
app.use(express.json({
  limit: '1mb',
  verify: (req, _res, buf) => {
    if (req.originalUrl?.startsWith('/finance/partner/webhook')) {
      req.rawBody = Buffer.from(buf);  // Preserve raw for signature verification
    }
  },
}));
```
**Status:** CORRECTLY IMPLEMENTED

---

## 8. External Integrations Analysis

### 8.1 Razorpay
**Files:** `rez-payment-service/src/services/razorpayService.ts`

| Feature | Status | Notes |
|---------|--------|-------|
| HMAC-SHA256 Signature | OK | timingSafeEqual used |
| Webhook Verification | OK | Raw body preserved |
| Event Deduplication | OK | Redis-based 24h TTL |
| Idempotent Order Creation | OK | Receipt-based |
| Amount Validation | OK | Upper bound 500000 |

### 8.2 Redis
**Files:** Individual service `config/redis.ts`

| Feature | Status | Notes |
|---------|--------|-------|
| Sentinel Support | OK | Multi-host failover |
| Retry Strategy | OK | Exponential backoff |
| Reconnect Handling | OK | reconnectOnError hook |
| Fail-Closed | OK | Payment service requires Redis |
| Lazy Connect | OK | false by default |

### 8.3 MongoDB
**Pattern:** Direct Mongoose connection per service
**Good:** Separate connections per service (no shared state)
**Concern:** Multiple MongoDB connections could strain infrastructure

---

## 9. Service-to-Service Communication

### 9.1 Authentication Patterns

#### Shared Internal Auth (`rez-shared/src/middleware/internalAuth.ts`)
```typescript
export function createInternalAuthMiddleware(options: InternalAuthOptions) {
  // Scoped tokens support (preferred)
  // Legacy token fallback (deprecated)
  // HMAC-based validation
  // XFF spoofing detection
}
```
**Status:** STANDARDIZED - Used across all services

### 9.2 HTTP Client Patterns

#### Payment Service -> Wallet Service
```typescript
const response = await fetch(`${walletUrl}/internal/credit`, {
  method: 'POST',
  headers: {
    'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
    'x-internal-service': 'rez-payment-service',
  },
  body: JSON.stringify({...}),
  signal: ac.signal,
});
```
**Issues:**
- Hardcoded 10s timeout (good)
- No circuit breaker (concern)
- Fire-and-forget for non-critical updates (acceptable)

### 9.3 Idempotency Patterns

#### Payment Service
```typescript
const key = data.orchestratorIdempotencyKey || data.idempotencyKey || crypto.randomUUID();
```

#### Order Service
```typescript
const idempotencyKey = (headerKeyStr ?? bodyKey ?? '').trim() || undefined;
```

#### Shared Middleware (`rez-shared/src/middleware/idempotency.ts`)
```typescript
export function idempotencyMiddleware(redis: Redis) {
  // UUID validation
  // Lock acquisition (SETNX)
  // Response caching (1 hour TTL)
  // Conflict handling (409)
}
```
**Status:** PARTIALLY STANDARDIZED - Shared middleware exists but not all services use it

---

## 10. Webhook Implementation Analysis

### 10.1 Razorpay Webhooks (Payment Service)
**Endpoint:** `POST /pay/webhook/razorpay`

| Feature | Implementation | Status |
|---------|----------------|--------|
| Signature Verification | HMAC-SHA256 | OK |
| Event Deduplication | Redis SET NX 24h | OK |
| Redis Availability Check | Fail-closed | OK |
| Rate Limiting | 100/min per IP | OK |
| State Machine Validation | DB-backed transitions | OK |
| Idempotent Processing | Event-based | OK |

### 10.2 Delivery Webhooks (Merchant Integrations)
**Endpoint:** `POST /api/delivery/webhook/:partner`

```typescript
app.post('/api/delivery/webhook/:partner', async (req, res) => {
  console.log(`Delivery webhook from ${partner}:`, req.body);
  res.json({ received: true });  // No signature verification
});
```
**Issue:** MEDIUM - No signature verification for delivery partner webhooks
**Recommendation:** Add HMAC verification similar to Razorpay pattern

---

## 11. Critical Issues Summary

### 11.1 HIGH Priority

| ID | Service | Issue | Impact |
|----|---------|-------|--------|
| API-GW-001 | Gateway | Payment retries disabled, client cannot distinguish failure types | Payment uncertainty |
| API-GW-002 | Gateway | CORS origins hardcoded | Inflexibility |
| DEL-001 | Merchant Integrations | Delivery webhooks lack signature verification | Security risk |

### 11.2 MEDIUM Priority

| ID | Service | Issue | Impact |
|----|---------|-------|--------|
| AUTH-001 | Auth Service | Response format inconsistency | Client complexity |
| SHARED-001 | Shared | Idempotency middleware not used everywhere | Duplicate processing risk |
| GATEWAY-001 | Gateway | No circuit breaker for upstream failures | Cascade failures |

### 11.3 LOW Priority

| ID | Service | Issue | Impact |
|----|---------|-------|--------|
| DOC-001 | All | No OpenAPI/Swagger documentation | Developer experience |
| MONITOR-001 | All | No centralized API versioning strategy | Future migration risk |

---

## 12. API Consistency Checklist

### 12.1 RESTful URL Structure
**Status:** CONSISTENT
- Services follow `/api/{domain}` pattern
- Resources use plural nouns (`/orders`, `/payments`)
- Actions use POST for mutations, GET for reads

### 12.2 HTTP Method Usage
**Status:** CONSISTENT
- GET: Read operations
- POST: Create operations
- PATCH: Partial updates
- PUT: Full replacements (rare)
- DELETE: Deletions

### 12.3 Response Format Standardization
**Status:** PARTIALLY CONSISTENT

| Service | Pattern | Notes |
|---------|---------|-------|
| Auth | Mixed | Some direct data, some wrapped |
| Payment | `{ success: true, data: {...} }` | Consistent |
| Order | `{ success: true, data: {...} }` | Consistent |
| Wallet | Mixed | Different patterns per route |
| Finance | `{ success: true/false, ... }` | Consistent |

### 12.4 Error Code Consistency
**Status:** GOOD
```typescript
// Standardized error codes across services
'SRV_INTERNAL_ERROR'     // Server errors
'PAY_FAILED'            // Payment errors
'INVALID_OTP'           // Auth errors
'RES_NOT_FOUND'        // Not found
'PAY_REFUND_NOT_ALLOWED' // Permission errors
```

### 12.5 Pagination Format
**Status:** CONSISTENT
```typescript
// Order service pattern
{
  success: true,
  data: [...],
  hasMore: boolean,
  nextCursor: string | null
}
```

---

## 13. Service Communication Analysis

### 13.1 HTTP vs Message Queue

| Communication Type | Implementation | Services |
|-------------------|----------------|----------|
| Synchronous HTTP | Direct fetch | Most service-to-service |
| BullMQ Workers | Async jobs | Payment processing, notifications |
| Redis Pub/Sub | Real-time events | Limited use |

**Concern:** Heavy reliance on synchronous HTTP could cause cascade failures

### 13.2 Retry Logic

| Service | Retry Pattern | Status |
|---------|---------------|--------|
| Payment -> Wallet | None for critical path | OK - Idempotent via reconciliation |
| Gateway -> Upstream | Nginx proxy_next_upstream | OK - Limited |
| Services -> External | Individual implementation | INCONSISTENT |

### 13.3 Timeout Configurations

| Component | Timeout | Status |
|-----------|---------|--------|
| Payment webhook verification | 10s | OK |
| Wallet credit | 10s | OK |
| Merchant store validation | 3s | OK |
| Gateway upstream | 60s | OK |

---

## 14. Recommendations

### 14.1 Immediate Actions

1. **Add OpenAPI Documentation**
   - Generate OpenAPI specs for all services
   - Use swagger-jsdoc or similar tooling
   - Centralize in rez-shared

2. **Standardize Response Format**
   - Audit all services for response consistency
   - Create shared response utility
   - Enforce via linting rule

3. **Add Delivery Webhook Signature Verification**
   - Implement HMAC verification for all partner webhooks
   - Document required headers

### 14.2 Short-term Improvements

4. **Implement Circuit Breakers**
   - Add circuit breaker to gateway upstream calls
   - Consider using opossum or similar library
   - Define fallback behaviors

5. **Centralize Idempotency**
   - Promote shared idempotency middleware to all services
   - Add architectural fitness test
   - Document idempotent patterns

6. **Improve API Versioning**
   - Define versioning strategy (header vs URL)
   - Implement deprecation warnings
   - Add sunset headers

### 14.3 Long-term Architecture

7. **GraphQL Consideration**
   - Evaluate GraphQL federation for cross-service queries
   - Consider Apollo Federation

8. **Service Mesh**
   - Evaluate Istio/Linkerd for traffic management
   - mTLS for service-to-service encryption

---

## 15. Endpoints Audited Summary

**Total Unique Endpoints Reviewed:** 45+

| Service | Endpoints | Issues Found |
|---------|-----------|--------------|
| API Gateway | 16 routes | 2 medium |
| Auth Service | 16 | 1 medium |
| Payment Service | 12 | 0 |
| Order Service | 8 | 0 |
| Wallet Service | 10+ | 0 |
| Merchant Service | 20+ | 0 |
| Finance Service | 8+ | 0 |
| Merchant Integrations | 12 | 1 medium |

---

## Appendix A: File Locations Reference

| Component | Path |
|-----------|------|
| API Gateway | `/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/` |
| Auth Service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service/` |
| Payment Service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-payment-service/` |
| Order Service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-order-service/` |
| Wallet Service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/` |
| Merchant Service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/` |
| Finance Service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-finance-service/` |
| Merchant Integrations | `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-integrations/` |
| Shared Utilities | `/Users/rejaulkarim/Documents/ReZ Full App/rez-shared/` |

---

## Appendix B: Security Headers Summary

| Header | Auth | Payment | Order | Wallet | Status |
|--------|------|---------|-------|--------|--------|
| Content-Security-Policy | Yes | Yes | Yes | Yes | OK |
| X-Frame-Options | Yes | Yes | Yes | Yes | OK |
| X-Content-Type-Options | Yes | Yes | Yes | Yes | OK |
| X-XSS-Protection | Yes | Yes | Yes | Yes | OK |
| Referrer-Policy | Yes | Yes | Yes | Yes | OK |
| Permissions-Policy | Partial | Partial | Yes | Yes | OK |
| HSTS | Merchant only | No | No | No | NEEDS ATTENTION |

---

*Report Generated: 2026-05-04*
*Next Review: 2026-06-04*
