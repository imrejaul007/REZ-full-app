# Authentication Security Audit - ReZ Merchant App

**Date:** 2026-05-09
**Scope:** auth.ts, middleware.ts, auth store, token handling, OAuth2 flows
**Severity Classification:** Critical | High | Medium | Low | Info

---

## 1. Auth Flow Overview

### 1.1 Authentication Methods

| Method | Endpoint/File | Status |
|--------|--------------|--------|
| OAuth2 (REZ Auth Service) | `/api/auth/callback/route.ts` | Active |
| Phone + OTP | `/lib/api/auth.ts` | Active |
| Phone + PIN | `/lib/api/auth.ts` | Active |
| JWT Bearer Token | All protected API routes | Active |

### 1.2 Token Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Login (OAuth2 / OTP / PIN)                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  REZ Auth Service validates credentials                 │    │
│  │  - OAuth: /oauth/token exchange                         │    │
│  │  - OTP: /api/user/auth/verify-otp                       │    │
│  │  - PIN: /api/user/auth/login-pin                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SET TOKENS (2-LAYER STORAGE)                          │    │
│  │                                                         │    │
│  │  Layer 1: httpOnly Cookies                             │    │
│  │  - rez_access_token (7 days)                           │    │
│  │  - rez_refresh_token (30 days)                         │    │
│  │  - HttpOnly: YES | Secure: production | SameSite: Lax │    │
│  │                                                         │    │
│  │  Layer 2: Encrypted localStorage (AES-GCM-256)        │    │
│  │  - rez_access_token_enc                                │    │
│  │  - rez_refresh_token_enc                                │    │
│  │  - Key derived via PBKDF2 (100k iterations)          │    │
│  │  - Derivation: UA + NEXT_PUBLIC_TOKEN_DERIV_SECRET    │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PROTECTED ROUTES (middleware.ts)                       │    │
│  │                                                         │    │
│  │  Protected: /profile, /orders, /wallet, /checkout,     │    │
│  │             /merchant                                    │    │
│  │                                                         │    │
│  │  Token Validation:                                      │    │
│  │  1. Check cookie or Authorization header               │    │
│  │  2. Validate JWT format (3 parts)                      │    │
│  │  3. Verify HS256 algorithm                             │    │
│  │  4. Check expiry (exp claim)                           │    │
│  │  5. Verify signature (JWT_SECRET)                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Protected Path Configuration

**File:** `rez-now/middleware.ts` (line 17)

```typescript
const PROTECTED_PATHS = ['/profile', '/orders', '/wallet', '/checkout', '/merchant'];
```

**Risk:** `/merchant` paths are protected but the auth flow does NOT verify store ownership. A valid token grants access to any merchant panel.

---

## 2. Token Storage Analysis

### 2.1 Primary Storage: httpOnly Cookies

**Files:** `/api/auth/callback/route.ts`, `/api/auth/set-cookies/route.ts`

| Cookie | Max Age | HttpOnly | Secure | SameSite |
|--------|---------|----------|--------|----------|
| `rez_access_token` | 7 days (604800s) | YES | Production only | Lax |
| `rez_refresh_token` | 30 days (2592000s) | YES | Production only | Lax |

**Strengths:**
- Tokens invisible to JavaScript (XSS-resistant)
- Server-side auth source of truth
- Production enforces Secure flag (HTTPS only)

**Weaknesses:**
- `SameSite=Lax` allows cross-site subrequests (e.g., `<img>` tags on evil site could load protected image)
- No `__Host-` prefix (should be used for additional cookie protection)

### 2.2 Secondary Storage: Encrypted localStorage

**File:** `rez-now/lib/api/client.ts` (lines 35-115)

| Aspect | Implementation |
|--------|---------------|
| Encryption | AES-GCM-256 |
| Key Derivation | PBKDF2 (100,000 iterations, SHA-256) |
| Key Material | `navigator.userAgent + NEXT_PUBLIC_TOKEN_DERIV_SECRET` |
| Salt | Static: `rez-v1-token-enc-salt` |
| Key Caching | In-memory Map (cleared on logout) |

**Strengths:**
- Strong encryption (AES-GCM-256)
- High PBKDF2 iteration count
- Defense-in-depth layer

**Weaknesses:**
- **CRITICAL:** PBKDF2 key derived from `navigator.userAgent` is browser-readable
- Any XSS can access `navigator.userAgent` and derive the same key
- This is acknowledged in comments (lines 51-56) as "acceptable for defense-in-depth"
- Static salt means all sessions use same derivation context
- Fallback to plaintext if crypto.subtle unavailable (fails silently in production)

### 2.3 Token Format

JWT Structure (HS256):

| Part | Purpose |
|------|---------|
| Header | `{"alg":"HS256","typ":"JWT"}` |
| Payload | `{userId?, sub?, exp?, ...}` |
| Signature | HMAC-SHA256(header.payload, JWT_SECRET) |

---

## 3. Issues and Vulnerabilities

### 3.1 CRITICAL Issues

#### NW-CRIT-003: Merchant Route Authorization Gap

**File:** `rez-now/middleware.ts` (line 17), `rez-ads-service/src/routes/merchant.ts`

**Description:** The middleware protects `/merchant/*` paths by verifying a valid JWT exists, but does NOT verify the user owns the store they're accessing. Any authenticated user can access any merchant's dashboard.

**Impact:** Privilege escalation - regular users can access merchant admin panels.

**Evidence:**
```typescript
// middleware.ts - only checks JWT validity
if (!token || !isValidJwtFormat(token)) {
  return NextResponse.redirect(loginUrl);
}
// No store ownership check here

// merchant.ts - ownership checked in route handlers
const merchantId = req.merchantId;
if (!merchantId) {
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}
// But merchantId comes from token payload, not route params
```

**Recommendation:** Middleware should extract storeSlug from route, verify user has access to that specific store.

---

### 3.2 HIGH Issues

#### NW-HIGH-004: Refresh Queue Promise Rejection

**File:** `rez-now/lib/api/client.ts` (lines 376-386)

**Description:** When token refresh fails, queued requests are rejected with a sentinel string `'__refresh-failed__'`, not a proper Error. This causes silent failures instead of clear error handling.

**Code:**
```typescript
refreshQueue.forEach((cb) => {
  (originalRequest as { _skipRetry?: boolean })._skipRetry = true;
  cb('__refresh-failed__'); // String, not Error
});
```

**Impact:** API callers cannot distinguish between network errors and auth failures.

**Recommendation:** Use proper Error objects and update type signatures.

---

#### NW-HIGH-012: Middleware Signature Validation Gap

**File:** `rez-now/middleware.ts` (lines 29-55)

**Description:** The `isValidJwtFormat()` function validates JWT structure but does NOT cryptographically verify the signature. It only checks:
- Token has 3 parts
- Header contains HS256
- Payload has userId/sub
- Token is not expired
- Signature is valid base64url

**Attack Scenario:** If an attacker obtains a token with a valid format but wrong signature, the middleware accepts it as long as it doesn't expire.

**Evidence:**
```typescript
function isValidJwtFormat(token: string): boolean {
  // Only checks structure, NOT signature
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  // ... format checks ...
  return true; // Missing: actual HMAC verification
}
```

**Contrast with:** `/api/auth/set-cookies/route.ts` (lines 32-70) DOES verify signature properly using `verifyJwtSignature()`.

**Recommendation:** Middleware should call `verifyJwtSignature()` from a shared utility.

---

### 3.3 MEDIUM Issues

#### NW-MED-028: Refresh Endpoint Inconsistency

**File:** `rez-now/lib/api/auth.ts` (line 62)

**Description:** Token refresh uses `/api/auth/token/refresh` (Next.js proxy) but authClient interceptor uses `/auth/token/refresh` (line 357). Path mismatch.

**Evidence:**
```typescript
// auth.ts line 62
const { data } = await publicClient.post('/api/auth/token/refresh', ...);

// client.ts line 357
const { data } = await publicClient.post('/auth/token/refresh', ...);
```

**Impact:** Potential 404 errors during token refresh.

---

#### NW-MED-029: OAuth State Parameter Weakness

**File:** `rez-now/components/auth/LoginModal.tsx` (line 22)

**Description:** OAuth state includes timestamp but doesn't include a cryptographically random nonce for replay protection.

```typescript
const state = btoa(JSON.stringify({ redirectTo, ts: Date.now() }));
```

**Impact:** State can be guessed/predicted if attacker knows approximate request time.

**Recommendation:** Add `crypto.randomUUID()` to state.

---

#### NW-MED-030: SameSite=Lax Cookie Policy

**File:** Multiple cookie-setting locations

**Description:** Cookies use `SameSite=Lax` instead of `SameSite=Strict`. This allows cookies to be sent with top-level navigation GET requests from external sites.

**Impact:** CSRF-like attacks possible (though mitigated by JWT not being automatically sent in all contexts).

---

### 3.4 LOW Issues

#### NW-LOW-001: Debug Console Error in Production

**File:** `rez-now/lib/api/client.ts` (lines 214-216)

```typescript
if (process.env.NODE_ENV === 'production') {
  console.error('[SECURITY] Token encryption failed...');
}
```

**Issue:** Production logging should use structured logging, not console.error.

---

#### NW-LOW-002: Zustand Persist Partial State

**File:** `rez-now/lib/store/authStore.ts` (lines 40-43)

```typescript
partialize: (state) => ({
  user: state.user,
}),
```

**Issue:** Only `user` is persisted, not `isLoggedIn`. This is intentional (comment explains), but could cause confusion during debugging.

---

## 4. Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOKEN LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LOGIN (OAuth2/OTP/PIN)                                         │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────┐                   │
│  │ POST /api/auth/set-cookies                │                   │
│  │ - Verify JWT signature                    │                   │
│  │ - Set httpOnly cookies                    │                   │
│  │ - Encrypt + store in localStorage         │                   │
│  └──────────────────────────────────────────┘                   │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────┐                   │
│  │ HTTP Requests                            │                   │
│  │ - Send: Cookie + Authorization header    │                   │
│  │ - Middleware: Validate JWT format        │                   │
│  │ - Backend: Verify JWT signature          │                   │
│  └──────────────────────────────────────────┘                   │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────┐                   │
│  │ Token Expiry (401 Response)              │                   │
│  │ - Refresh queue: Block requests          │                   │
│  │ - POST /auth/token/refresh               │                   │
│  │ - Backend sets new httpOnly cookies      │                   │
│  │ - Replay queued requests                 │                   │
│  └──────────────────────────────────────────┘                   │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────┐                   │
│  │ Refresh Token Expired                    │                   │
│  │ - Dispatch 'rez:session-expired' event   │                   │
│  │ - Clear tokens from storage              │                   │
│  │ - Open login modal                       │                   │
│  └──────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Environment Variables

| Variable | Required | Purpose | Risk |
|----------|----------|---------|------|
| `JWT_SECRET` | YES | Sign/verify all JWTs | Key compromise = full auth bypass |
| `NEXT_PUBLIC_TOKEN_DERIV_SECRET` | YES (prod) | Derive localStorage encryption key | Weak value = token theft |
| `REZ_OAUTH_CLIENT_SECRET` | YES | OAuth2 client authentication | Key compromise = fake auth flows |
| `REZ_AUTH_SERVICE_URL` | YES | Auth service endpoint | Wrong URL = auth bypass |
| `INTERNAL_SERVICE_KEY` | For internal APIs | Service-to-service auth | Weak value = service impersonation |

---

## 6. Summary Matrix

| Issue ID | Severity | Component | Type | Remediation Effort |
|----------|----------|-----------|------|-------------------|
| NW-CRIT-003 | CRITICAL | Merchant Routes | AuthZ Gap | Medium |
| NW-HIGH-004 | HIGH | Token Refresh | Error Handling | Low |
| NW-HIGH-012 | HIGH | Middleware | Signature Bypass | Medium |
| NW-MED-028 | MEDIUM | API Routes | Inconsistency | Low |
| NW-MED-029 | MEDIUM | OAuth Flow | State Replay | Low |
| NW-MED-030 | MEDIUM | Cookies | CSRF Risk | Low |
| NW-LOW-001 | LOW | Logging | Console Use | Trivial |
| NW-LOW-002 | LOW | Auth Store | State Mgmt | Trivial |

---

## 7. Recommendations

### Immediate Actions

1. **NW-CRIT-003 Fix:** Add store ownership verification in middleware or route handlers
2. **NW-HIGH-012 Fix:** Import and call `verifyJwtSignature()` in middleware validation

### Short-term

3. Standardize refresh endpoint paths
4. Add cryptographically random nonce to OAuth state
5. Consider `SameSite=Strict` for sensitive cookies

### Long-term

6. Migrate localStorage tokens to service worker storage
7. Implement proper CSRF tokens for state-changing operations
8. Add audit logging for auth events
9. Implement token rotation on refresh

---

## 8. File Inventory

| File | Purpose | Auth Relevance |
|------|---------|----------------|
| `rez-now/middleware.ts` | Route protection | PRIMARY |
| `rez-now/lib/store/authStore.ts` | Client state | HIGH |
| `rez-now/lib/api/client.ts` | HTTP + tokens | CRITICAL |
| `rez-now/lib/api/auth.ts` | OTP/PIN flows | HIGH |
| `rez-now/app/api/auth/callback/route.ts` | OAuth2 handler | HIGH |
| `rez-now/app/api/auth/set-cookies/route.ts` | Cookie setting | CRITICAL |
| `rez-now/components/auth/LoginModal.tsx` | Login UI | MEDIUM |
| `rez-now/app/providers.tsx` | Auth event handling | MEDIUM |
| `rez-ads-service/src/middleware/auth.ts` | Backend auth | CRITICAL |
| `rez-ads-service/src/routes/merchant.ts` | Merchant endpoints | HIGH |
| `rez-ads-service/src/routes/admin.ts` | Admin endpoints | HIGH |

---

*Audit generated by Claude Code*
