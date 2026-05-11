# Backend Security Audit Report

**Date:** 2026-05-04
**Auditor:** Backend Security Lead
**Scope:** rez-auth-service, rez-wallet-service, rez-payment-service, rez-merchant-service, rez-finance-service, rez-api-gateway
**Status:** COMPLIANT WITH RECOMMENDATIONS

---

## Executive Summary

The backend services demonstrate a strong security posture with comprehensive authentication, authorization, rate limiting, and token management implementations. Multiple security fixes have been applied addressing OWASP Top 10 concerns. The following report details findings and remediation status.

---

## 1. Authentication Status

### 1.1 JWT Implementation

| Service | Status | Details |
|---------|--------|---------|
| rez-auth-service | **SECURE** | Role-scoped secrets (JWT_SECRET, JWT_ADMIN_SECRET, JWT_MERCHANT_SECRET), algorithm constraint `['HS256']`, token rotation, blacklisting |
| rez-wallet-service | **SECURE** | HS256 algorithm, Redis blacklist check, role validation, fail-closed on Redis unavailability |
| rez-payment-service | **SECURE** | HS256 algorithm constraint, multiple secret support, Redis blacklist |
| rez-merchant-service | **SECURE** | Merchant-specific JWT verification, SHA256 token hash for blacklist, merchant status cache |
| rez-finance-service | **SECURE** | Redis blacklist check, role extraction, multiple secret support |
| rez-api-gateway | **SECURE** | Dedicated auth middleware with separate requireUser/requireMerchant/requireAdmin functions |

### 1.2 Token Expiration

| Token Type | Default TTL | Configurable | Max Recommended |
|------------|-------------|--------------|-----------------|
| Access Token (user) | 15m | JWT_EXPIRES_IN | 15m |
| Access Token (admin) | 15m | JWT_ADMIN_EXPIRES_IN | 15m |
| Access Token (merchant) | 24h | - | 24h |
| Refresh Token | 24h | JWT_REFRESH_TTL_HOURS | 48h max |

### 1.3 Token Security Features

- **Blacklisting:** Redis-based with MongoDB lastLogoutAt fallback
- **Rotation:** Full refresh token rotation prevents replay attacks
- **Concurrent Refresh Detection:** 409 Conflict returned on concurrent rotation attempts
- **JWT Algorithm Confusion Attack Prevention:** All services use `{ algorithms: ['HS256'] }` constraint

### 1.4 OTP Security

| Feature | Implementation | Status |
|---------|---------------|--------|
| OTP Length | 6 digits | SECURE |
| OTP TTL | 5 minutes | SECURE |
| OTP Hashing | HMAC-SHA256 with OTP_HMAC_SECRET | SECURE |
| Atomic Verification | Lua script (GET + compare + DEL) | SECURE |
| Rate Limiting | 3/min per phone, 5/15min per IP | SECURE |
| Lockout | 5 failed attempts = 30 min lockout | SECURE |
| Common PIN Prevention | Blocked list of common PINs | SECURE |

---

## 2. Authorization Status

### 2.1 RBAC Implementation

| Role | Access Level | Token Secret |
|------|-------------|--------------|
| consumer/user | User endpoints only | JWT_SECRET |
| merchant | Merchant endpoints only | JWT_MERCHANT_SECRET |
| admin/super_admin/operator | Admin endpoints | JWT_ADMIN_SECRET |

### 2.2 Authorization Checks

- **Wallet Service:** Rejects non-user tokens on user wallet endpoints (line 44-51)
- **Payment Service:** Validates role-appropriate tokens
- **Merchant Service:** Requires JWT_MERCHANT_SECRET, checks merchant status, verification level
- **API Gateway:** Dedicated requireUser/requireMerchant/requireAdmin middlewares

### 2.3 Ownership Checks

- **Blacklist Token:** Requires authenticated userId passed explicitly (prevents DoS via token forgery)
- **Profile Updates:** Authenticated userId from validated JWT
- **Merchant Operations:** merchantId extracted from verified JWT, not request body

---

## 3. Security Headers Review

### 3.1 API Gateway (rez-api-gateway)

```typescript
// helmet() with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com"],
    },
  },
}));

// Custom security headers
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [from helmet CSP]
```

### 3.2 CORS Configuration

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id', 'X-User-Id', 'X-Request-Id'],
}));
```

**Status:** CORS properly configured with environment-based origin whitelist.

---

## 4. Rate Limiting

### 4.1 Auth Service Rate Limiters

| Endpoint | Limit | Window | Key | Fail Mode |
|----------|-------|--------|-----|-----------|
| OTP Send (IP) | 10 | 15 min | IP | closed |
| OTP Send (Phone) | 3 | 1 min | phone | closed |
| OTP Verify (Phone) | 5 | 1 min | phone | closed |
| Auth General (IP) | 100 | 1 min | IP | closed |
| Has PIN (IP) | 60 | 1 min | IP | closed |
| Admin Login (IP) | 3 | 5 min | IP | closed |
| Merchant Auth (IP) | 10 | 1 min | IP | closed |
| Profile Update (User) | 10 | 1 min | userId | closed |
| OAuth Token (IP) | 30 | 1 min | IP | closed |

### 4.2 Wallet Service Rate Limiters

- 20 requests/min per IP (general)
- 5 requests/min per IP (strict endpoints)
- UserId-based limiting where authenticated

### 4.3 API Gateway Rate Limiter

```typescript
rateLimitMiddleware({
  windowMs: 60000,  // 1 minute
  max: 100,         // 100 requests per window
})
```

### 4.4 Rate Limiter Implementation

- **Redis-backed** for distributed deployments
- **Lua scripts** for atomic operations
- **Pipeline** for single round-trip performance
- **Fail-closed** in production when Redis unavailable

---

## 5. OWASP Top 10 Checklist

### 5.1 A01:2021 - Broken Access Control

| Check | Status | Evidence |
|-------|--------|----------|
| Access control enforcement | **PASS** | Role-based middleware on all services |
| Data access scoped to user | **PASS** | Ownership checks in token validation |
| IDOR prevention | **PASS** | userId from validated JWT, not request |
| CORS configuration | **PASS** | Origin whitelist configured |

### 5.2 A02:2021 - Cryptographic Failures

| Check | Status | Evidence |
|-------|--------|----------|
| Sensitive data encryption | **PASS** | TOTP secrets encrypted with AES |
| Password hashing | **PASS** | bcrypt with cost factor 12 |
| JWT signing | **PASS** | HS256 with separate secrets per role |
| OTP hashing | **PASS** | HMAC-SHA256 with secret |
| Token hashing | **PASS** | SHA256 for blacklist keys |
| Timing-safe comparison | **PASS** | crypto.timingSafeEqual used |

### 5.3 A03:2021 - Injection

| Check | Status | Evidence |
|-------|--------|----------|
| SQL/NoSQL injection | **PASS** | Mongoose ODM, parameterized queries |
| Query parameterization | **PASS** | $set, $nor, $or operators |
| Input validation | **PASS** | Zod schemas, parsePhone validation |

### 5.4 A04:2021 - Insecure Design

| Check | Status | Evidence |
|-------|--------|----------|
| Rate limiting | **PASS** | Comprehensive per-endpoint limiters |
| Account lockout | **PASS** | 5 failed attempts = 30 min lockout |
| Concurrent session detection | **PASS** | 409 on concurrent refresh |
| Circuit breakers | **PASS** | Gateway-level protection |

### 5.5 A05:2021 - Security Misconfiguration

| Check | Status | Evidence |
|-------|--------|----------|
| Security headers | **PASS** | Helmet + custom headers |
| CORS | **PASS** | Environment-based origins |
| Default credentials | **N/A** | No default credentials in codebase |
| Error handling | **PASS** | No stack traces in production |
| Unnecessary features | **PASS** | Minimal feature set |

### 5.6 A06:2021 - Vulnerable Components

| Check | Status | Evidence |
|-------|--------|----------|
| Dependencies | **REVIEW** | Run `npm audit` regularly |
| Known CVEs | **REVIEW** | Check Snyk/Dependabot |

### 5.7 A07:2021 - Authentication Failures

| Check | Status | Evidence |
|-------|--------|----------|
| JWT implementation | **PASS** | HS256, algorithm constraint, rotation |
| Session management | **PASS** | Redis blacklist, MongoDB fallback |
| MFA support | **PASS** | TOTP with RFC 6238 |
| Credential exposure | **PASS** | No credentials in responses |
| Account enumeration prevention | **PASS** | has-pin returns identical response |

### 5.8 A08:2021 - Software and Data Integrity Failures

| Check | Status | Evidence |
|-------|--------|----------|
| Dependency integrity | **REVIEW** | Lockfiles committed |
| Build process | **REVIEW** | CI/CD pipeline |

### 5.9 A09:2021 - Security Logging and Monitoring

| Check | Status | Evidence |
|-------|--------|----------|
| Logging | **PASS** | Structured logging with correlation IDs |
| Failed auth logging | **PASS** | Token verification failures logged |
| Monitoring | **PARTIAL** | Prometheus metrics available |

### 5.10 A10:2021 - Server-Side Request Forgery (SSRF)

| Check | Status | Evidence |
|-------|--------|----------|
| External service calls | **PASS** | Internal tokens for service-to-service |
| URL validation | **PASS** | Fetch targets are env-configured |

---

## 6. Vulnerability Report

### 6.1 Fixed Vulnerabilities (Security Fixes Applied)

| ID | Category | Service | Fix Applied | Status |
|----|----------|---------|-------------|--------|
| AUTH-JWT-001 | JWT | auth | Role-scoped secrets, algorithm constraint | FIXED |
| AUTH-RATE-001 | Rate Limit | auth | Fail-closed on Redis unavailability | FIXED |
| AUTH-RATE-002 | Rate Limit | auth | UserId from JWT for profile rate limiting | FIXED |
| AUTH-TTL-001 | Token TTL | auth | Refresh token reduced to 24h max | FIXED |
| BAK-AUTH-001 | Enum | auth | Has-pin returns identical response | FIXED |
| BAK-AUTH-002 | Enum | auth | Token validate hides userId from public | FIXED |
| BAK-AUTH-005 | DoS | auth | Lockout on queue failure | FIXED |
| CD-XS-18 | IP Allow | auth | IP allowlist for internal endpoints | FIXED |
| SEC-005 | MFA | auth | Signed JWT for MFA session tokens | FIXED |
| PAY-HMAC-001 | Auth | payment | Fail closed on missing token | FIXED |
| PAY-011 | Auth | payment | Fail closed on Redis unavailable | FIXED |
| BE-GW-004 | Auth | gateway | Header validation before slice | FIXED |
| BE-GW-005 | Auth | gateway | Empty token validation | FIXED |
| BE-GW-007 | Auth | gateway | Error logging on verification failure | FIXED |
| BE-GW-008 | Auth | gateway | JWT payload structure validation | FIXED |
| CS-C2 | Suspension | merchant | Immediate suspension marker check | FIXED |

### 6.2 Outstanding Recommendations

| Priority | Recommendation | Affected Services |
|----------|---------------|-------------------|
| LOW | Run `npm audit` and review/fix vulnerabilities | All services |
| LOW | Implement Dependabot/Snyk for automated CVE scanning | All services |
| MEDIUM | Add comprehensive audit logging to financial operations | rez-wallet, rez-payment, rez-finance |
| MEDIUM | Implement request signing for internal service calls | All services |
| LOW | Consider HSTS preload list submission | API Gateway |

---

## 7. Remediation Plan

### 7.1 Completed Remediations

- [x] Role-scoped JWT secrets (admin/user/merchant separation)
- [x] Algorithm confusion attack prevention (HS256 constraint)
- [x] Token rotation with replay prevention
- [x] Redis blacklist with MongoDB fallback
- [x] Rate limiting on all auth endpoints
- [x] Fail-closed on Redis unavailability
- [x] MFA support (TOTP)
- [x] Common PIN prevention
- [x] Account lockout after failed attempts
- [x] Security headers (helmet + CSP)
- [x] CORS configuration
- [x] IP allowlist for internal endpoints
- [x] Security headers in API Gateway

### 7.2 Future Security Enhancements

| Timeline | Enhancement | Description |
|----------|-------------|-------------|
| Q2 2026 | MFA Enforcement | Require MFA for admin accounts |
| Q2 2026 | Password Policy | Enforce password complexity for admin |
| Q3 2026 | Secrets Rotation | Automated JWT secret rotation |
| Q3 2026 | Audit Dashboard | Real-time security monitoring |

---

## 8. Security Test Coverage

### 8.1 Test Files Found

- `/rez-auth-service/src/__tests__/otpSecurity.test.ts`
- `/rez-auth-service/src/__tests__/securityFixes.test.ts`
- `/rez-auth-service/src/__tests__/tokenSecurity.test.ts`
- `/rez-wallet-service/src/__tests__/gracefulShutdown.test.ts`

### 8.2 Recommended Test Additions

- [ ] Token rotation concurrent access tests
- [ ] Rate limiting bypass attempts
- [ ] JWT algorithm confusion attack tests
- [ ] SQL/NoSQL injection tests
- [ ] XSS payload validation tests
- [ ] Authentication bypass scenarios

---

## 9. Conclusion

The backend services demonstrate a mature security posture with:

1. **Strong Authentication:** Role-scoped JWT secrets, algorithm constraints, token rotation
2. **Robust Authorization:** RBAC with dedicated middlewares per service
3. **Comprehensive Rate Limiting:** Per-endpoint limits with Redis backend
4. **Secure Token Management:** Blacklisting, rotation, replay prevention
5. **Security Headers:** Helmet, CSP, CORS properly configured
6. **Fail-Closed Design:** Redis unavailability results in request rejection in production

**Overall Security Rating:** SECURE with monitoring recommended for dependencies.

---

## Appendix A: File References

| Service | Key Security Files |
|---------|-------------------|
| rez-auth-service | `src/services/tokenService.ts`, `src/middleware/auth.ts`, `src/middleware/rateLimiter.ts`, `src/middleware/internalAuth.ts`, `src/services/otpService.ts` |
| rez-wallet-service | `src/middleware/auth.ts`, `src/middleware/internalAuth.ts` |
| rez-payment-service | `src/middleware/auth.ts`, `src/middleware/internalAuth.ts` |
| rez-merchant-service | `src/middleware/auth.ts` |
| rez-finance-service | `src/middleware/auth.ts` |
| rez-api-gateway | `src/index.ts`, `src/shared/authMiddleware.ts` |

---

**Report Generated:** 2026-05-04
**Next Review:** 2026-06-04
**Security Lead:** Backend Security Lead
