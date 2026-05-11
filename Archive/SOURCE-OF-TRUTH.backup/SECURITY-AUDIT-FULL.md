# ReZ Full App - Complete Security Audit Report

**Audit Date:** May 2, 2026
**Auditor:** Security Engineering Review
**Scope:** All Backend Microservices

---

## Executive Summary

This comprehensive security audit examined 13 backend microservices for security vulnerabilities across 10 security domains. The audit found that most services have implemented reasonable security controls, but several critical and high-severity issues were identified, particularly in the `rez-corporate-service` which lacks fundamental security protections.

**Overall Security Posture:**
- **Services with Good Security:** rez-auth-service, rez-payment-service, rez-wallet-service, rez-order-service, rez-merchant-service
- **Services with Moderate Security:** rez-search-service, rez-catalog-service, rez-gamification-service, rez-ads-service
- **Services with Critical Issues:** rez-corporate-service
- **Services Requiring Attention:** rez-marketing-service, rez-travel-service

---

## Critical Issues (Immediate Action Required)

### 1. [CRITICAL] rez-corporate-service - Missing Authentication & Authorization

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts`

**Issue:** All API endpoints are completely unprotected. No authentication, authorization, rate limiting, or input sanitization.

**Vulnerable Endpoints:**
- `POST /api/corporate/cards` - Creates virtual cards without auth
- `POST /api/corporate/cards/:id/block` - Blocks cards without auth
- `GET /api/corporate/cards/company/:companyId` - Exposes all card data
- `GET /api/corporate/cards/transactions/:companyId` - Exposes all transactions
- `POST /api/corporate/gst/invoices` - Creates invoices without auth
- `POST /api/corporate/travel/bookings/hotel` - Creates bookings without auth
- `GET /api/corporate/companies/:id` - Exposes company data

**Proof of Concept:**
```typescript
// Line 67 - No auth middleware
app.post('/api/corporate/cards', async (req, res) => {
  const result = await corporateCardService.createVirtualCard(req.body);
  // Attacker can create arbitrary virtual cards
});

// Line 80 - No auth middleware
app.get('/api/corporate/hris/connections/:companyId', async (req, res) => {
  const connections = await hrisService.getCompanyConnections(req.params.companyId);
  // Attacker can enumerate all HRIS connections
});
```

**Risk:** Complete financial data breach, unauthorized card creation, invoice fraud, travel booking fraud.

**Recommended Fix:**
```typescript
import { requireAuth, requireCorpAdminAuth } from './middleware/auth';

// All sensitive routes require authentication
app.post('/api/corporate/cards', requireAuth, requireCorpAdminAuth, async (req, res) => {
  // Now protected
});
```

---

### 2. [CRITICAL] rez-corporate-service - No Input Validation or SQL/NoSQL Injection Protection

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts`

**Issue:** No `mongoSanitize` middleware or input validation on any endpoint.

**Code:**
```typescript
// Line 29-31 - No sanitization middleware
app.use(cors());  // Wildcard CORS
app.use(express.json());  // No size limit
app.use(express.urlencoded({ extended: true }));  // No size limit

// Line 201-209 - Direct query without sanitization
app.get('/api/corporate/cards/transactions/:companyId', async (req, res) => {
  const { cardId, employeeId, startDate, endDate, page, limit } = req.query;
  // Query parameters used directly without validation
  const result = await corporateCardService.getTransactions({
    cardId: cardId as string,
    employeeId: employeeId as string,
    companyId: req.params.companyId,
    // ... dates passed without validation
  });
});
```

**Risk:** NoSQL injection attacks, oversized payload DoS, malformed data corruption.

**Recommended Fix:**
```typescript
import mongoSanitize from 'express-mongo-sanitize';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(mongoSanitize());
```

---

### 3. [CRITICAL] rez-corporate-service - Hardcoded MongoDB URI Fallback

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts:438`

**Issue:**
```typescript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-corporate';
```

If environment variable is missing, connects to local development database. Could lead to connecting to wrong database in production.

---

### 4. [CRITICAL] rez-corporate-service - Wildcard CORS Configuration

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts:29`

**Issue:**
```typescript
app.use(cors());  // Allows ALL origins
```

Any website can make requests to this service and receive sensitive corporate data.

---

## High Severity Issues

### 5. [HIGH] rez-corporate-service - No Helmet Security Headers

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts`

**Issue:** No `helmet` middleware for security headers.

**Missing Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Recommended Fix:**
```typescript
import helmet from 'helmet';
app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
```

---

### 6. [HIGH] rez-corporate-service - No Rate Limiting

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts`

**Issue:** No rate limiting on any endpoint. Vulnerable to brute force attacks on card operations, GST invoice creation, etc.

**Recommended Fix:**
```typescript
import rateLimit from 'express-rate-limit';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});
app.use(generalLimiter);
```

---

### 7. [HIGH] Multiple Services - JWT Secret from process.env Without Validation

**Affected Services:**
- `rez-auth-service/src/middleware/auth.ts` (line 52)
- `rez-order-service/src/httpServer.ts` (line 308-312)
- `rez-ads-service/src/index.ts` (line 43)

**Issue:** JWT secrets are used directly from `process.env` without validation that they are set or meet minimum length requirements.

**Example (rez-auth-service):**
```typescript
decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as REZJwtPayload;
```

If `JWT_SECRET` is not set, this will throw an error at runtime. However, `!` assertion bypasses TypeScript safety.

**Recommended Fix:**
```typescript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

### 8. [HIGH] Multiple Services - Incomplete ObjectId Validation

**Affected Services:**
- `rez-order-service/src/httpServer.ts`
- `rez-corporate-service/src/index.ts`

**Issue:** `mongoose.isValidObjectId()` only validates format, not whether the ID exists. Attackers can enumerate valid ObjectIds.

**Example:**
```typescript
// Line 1271 - Only checks format
if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({ success: false, message: 'Invalid order id' });
}
```

**Risk:** ObjectId enumeration attacks.

**Note:** This is mitigated by proper authorization checks in most services, but the corporate service lacks authorization entirely.

---

### 9. [HIGH] Rate Limiter Fail-Open Configuration

**Affected Services:** `rez-auth-service/src/middleware/rateLimiter.ts`

**Issue:** Some rate limiters use `failOpen=true` which allows requests through if Redis is unavailable.

**Code:**
```typescript
// Line 88 - failOpen defaults to false (good)
// Line 99 - authLimiter failOpen defaults to false (good)
```

**Status:** This is properly configured in auth-service. However, verify all services use `failOpen=false` for sensitive operations.

---

### 10. [MEDIUM] Service-Specific Rate Limiters Not Standardized

**Issue:** Each service implements its own rate limiter with different configurations. No centralized rate limiting service.

**Recommendations:**
1. Create shared `rez-shared/rate-limiter` package
2. Standardize limits across all services
3. Add Redis-based distributed rate limiting

---

## Medium Severity Issues

### 11. [MEDIUM] CORS Configuration Not Validated at Startup

**Affected Services:**
- `rez-payment-service/src/index.ts:128`
- `rez-search-service/src/index.ts:144`
- `rez-ads-service/src/index.ts:51-53`

**Issue:** CORS origins are parsed at runtime without validation for wildcards.

**Example:**
```typescript
// rez-payment-service line 128
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map((s) => s.trim()) }));
```

If `CORS_ORIGIN=*` is set, the service will accept all origins without warning.

**Recommended Fix (already implemented in auth-service and wallet-service):**
```typescript
// Validate at startup - reject wildcards
for (const origin of allowedOrigins) {
  if (origin === '*' || origin.includes('*')) {
    logger.error(`[FATAL] CORS_ORIGIN contains wildcard`);
    process.exit(1);
  }
}
```

---

### 12. [MEDIUM] No Request Timeout on Corporate Service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/src/index.ts`

**Issue:** No request timeout middleware. Long-running requests can exhaust server resources.

**Recommended Fix:**
```typescript
import timeout from 'connect-timeout';
app.use(timeout('30s'));
app.use(haltOnTimedout);
function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}
```

---

### 13. [MEDIUM] Trust Proxy Configuration

**Affected Services:** All services

**Issue:** `app.set('trust proxy', 1)` trusts X-Forwarded-For without validation in most services.

**Good Examples (with validation):**
- `rez-payment-service/src/index.ts:90-122` - XFF spoofing detection
- `rez-wallet-service/src/index.ts:54-77` - XFF spoofing detection

**Status:** Core services have proper XFF validation. Verify all new services implement this.

---

### 14. [MEDIUM] Error Messages May Leak Internal Information

**Affected Services:** All services

**Issue:** Error handlers may expose stack traces or internal details in some edge cases.

**Example (rez-corporate-service):**
```typescript
app.use((err: any, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack }); // Stack logged
  res.status(500).json({ error: 'Internal server error' }); // Generic error returned
});
```

**Status:** Most services properly hide error details. Corporate service logs stack traces (acceptable if logs are secured).

---

### 15. [LOW] Inconsistent Security Header Implementation

**Issue:** Security headers are implemented inconsistently across services.

**Services with full HSTS implementation:**
- `rez-merchant-service/src/index.ts:161-180`

**Services with partial implementation:**
- `rez-order-service/src/httpServer.ts:118-124` - Manual headers without HSTS

**Recommendation:** Standardize on helmet with consistent configuration.

---

### 16. [LOW] No CSRF Protection on Cookie-Based Endpoints

**Affected Services:** `rez-merchant-service`

**Issue:** CSRF protection middleware exists but may not cover all state-changing endpoints.

**Code:**
```typescript
// Line 195
app.use(csrfProtection);
```

**Recommendation:** Verify CSRF tokens are required on all POST/PUT/DELETE endpoints.

---

## Security Best Practices Verified (Positive Findings)

### Authentication & Authorization

**GOOD:** rez-auth-service implements comprehensive auth:
- TOTP-based MFA (RFC 6238)
- Account lockout after failed attempts
- Rate limiting on auth endpoints
- Token blacklist for logout
- CorpPerks role-based access control
- Internal service token validation with IP allowlisting

**GOOD:** rez-order-service implements IDOR protection:
- Authorization checks on all order endpoints
- Users can only access their own orders
- Merchants can only access their own orders
- State machine prevents invalid status transitions

**GOOD:** rez-wallet-service implements proper auth:
- Internal token validation
- IP allowlisting for internal endpoints
- Proper token blacklisting

---

### Input Validation

**GOOD:** All major services use `express-mongo-sanitize`:
- `rez-auth-service:98`
- `rez-payment-service:141`
- `rez-wallet-service:145`
- `rez-order-service:129`
- `rez-merchant-service:194`

**GOOD:** Input validation on sensitive operations:
- Phone number validation with regex
- ObjectId format validation
- Amount/total validation with server-side recomputation
- Delivery address structure validation

---

### Rate Limiting

**GOOD:** rez-auth-service implements comprehensive rate limiting:
- Per-phone OTP limits
- Per-IP general limits
- Admin login limits
- Profile update limits
- Fail-closed configuration

**GOOD:** rez-merchant-service implements rate limiting:
- General limiter: 300/15min
- Auth limiter: 100/1min

---

### JWT Security

**GOOD:** Proper JWT implementation:
- Algorithm restrictions (`{ algorithms: ['HS256'] }`)
- Token expiration validation
- Refresh token rotation
- Blacklisting on logout
- Separate secrets for different token types (user, admin, merchant)

---

### Security Headers

**GOOD:** Helmet middleware used in most services:
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy
- HSTS with includeSubDomains

---

## Service-by-Service Security Matrix

| Service | Auth | CORS | RateLimit | Helmet | MongoSanitize | JWT | IDOR |
|---------|------|------|-----------|--------|----------------|-----|------|
| rez-auth-service | Excellent | Validated | Comprehensive | Yes | Yes | Yes | N/A |
| rez-payment-service | Good | Configured | Yes | Yes | Yes | Yes | Good |
| rez-wallet-service | Good | Validated | Limited | Yes | Yes | Yes | Good |
| rez-order-service | Good | Configured | Yes | Partial | Yes | Yes | Excellent |
| rez-merchant-service | Good | Validated | Yes | Full | Yes | Yes | Good |
| rez-search-service | Limited | Configured | No | Yes | Yes | Yes | N/A |
| rez-catalog-service | Internal | Configured | No | No | No | No | Internal |
| rez-gamification-service | Internal | Configured | No | No | No | No | Internal |
| rez-ads-service | Good | Configured | No | Yes | Yes | Yes | Good |
| rez-travel-service | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| rez-marketing-service | Not Reviewed | - | - | - | - | - | - |
| rez-corporate-service | **NONE** | Wildcard | **NONE** | **NONE** | **NONE** | **NONE** | **NONE** |
| rez-intent-graph | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

---

## Recommendations Summary

### Immediate (This Week)

1. **rez-corporate-service - Add Authentication**
   - Implement JWT authentication middleware
   - Add authorization checks for all endpoints
   - Restrict card creation to authorized roles only

2. **rez-corporate-service - Add Security Middleware**
   - Add helmet middleware
   - Add mongoSanitize
   - Add rate limiting
   - Configure proper CORS

3. **rez-corporate-service - Remove Hardcoded Fallback**
   - Fail startup if MONGODB_URI is not set

### Short-term (This Sprint)

4. **Standardize Rate Limiting**
   - Create shared rate limiting configuration
   - Ensure all services use fail-closed configuration

5. **Standardize CORS Validation**
   - Add startup validation for wildcards in all services
   - Use pattern from rez-auth-service

6. **Review rez-travel-service and rez-marketing-service**
   - Complete security audit of these services

### Long-term (Next Quarter)

7. **Centralized Security Configuration**
   - Create `rez-shared/security` package
   - Standardize all security middleware

8. **Security Testing**
   - Add security unit tests
   - Implement integration security tests
   - Add security scanning to CI/CD

9. **Penetration Testing**
   - Engage third-party for comprehensive penetration test
   - Focus on payment and authentication flows

---

## Vulnerability Checklist

| Category | Issue | Severity | Status |
|----------|-------|----------|--------|
| SQL/NoSQL Injection | Corporate service lacks mongoSanitize | Critical | Open |
| Broken Auth | Corporate service has no authentication | Critical | Open |
| Hardcoded Secrets | Corporate service MongoDB URI | Critical | Open |
| Missing Input Validation | Corporate service all inputs | Critical | Open |
| CORS Misconfiguration | Corporate service wildcard | Critical | Open |
| Rate Limiting | Corporate service | High | Open |
| IDOR | Corporate service all endpoints | Critical | Open |
| XSS | All services - low risk (API only) | Low | Mitigated |
| Unprotected Endpoints | Corporate service | Critical | Open |
| Weak JWT | All services - use ! assertion | Medium | Open |

---

## Conclusion

The `rez-corporate-service` requires immediate security hardening before any production deployment. All other services have reasonable security controls in place, with the auth-service being the most mature.

**Priority Actions:**
1. Fix rez-corporate-service (Critical)
2. Complete review of untested services (rez-travel-service, rez-marketing-service)
3. Standardize security configurations across services

---

*Report Generated: May 2, 2026*
*Next Audit: June 2026*
