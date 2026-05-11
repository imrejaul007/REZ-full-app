# REZ Loyalty System - Security Checklist

## Overview

This document outlines the security measures implemented across all REZ Loyalty System services and provides a checklist for verifying security compliance.

---

## Security Checklist

### Rate Limiting

| Endpoint Type | Limit | Window | Service | Status |
|--------------|-------|--------|---------|--------|
| Profile queries | 100/min | 15 min | Profile Aggregator | [x] Implemented |
| Profile updates | 30/min | 15 min | Profile Aggregator | [x] Implemented |
| Profile creation | 20/min | 15 min | Profile Aggregator | [x] Implemented |
| Score queries | 200/min | 15 min | All Services | [x] Implemented |
| Decision calls | 500/min | 15 min | Decision Service | [x] Implemented |
| Targeting requests | 200/min | 15 min | Decision Service | [x] Implemented |
| Sampling operations | 100/min | 15 min | Decision Service | [x] Implemented |
| Coin operations | 50/min | 15 min | Loyalty Engine | [x] Implemented |
| Tier changes | 20/min | 15 min | Tier Service | [x] Implemented |
| Admin operations | 10/min | 15 min | All Services | [x] Implemented |
| Audit log queries | 100/min | 15 min | Audit Log Service | [x] Implemented |
| Audit log exports | 10/min | 15 min | Audit Log Service | [x] Implemented |
| Bulk operations | 5/min | 15 min | All Services | [x] Implemented |
| Authentication | 5/min | 15 min | All Services | [x] Implemented |

### Input Validation

| Validation Type | Schema | Coverage | Status |
|-----------------|--------|----------|--------|
| MongoDB ObjectId | Zod regex | All user IDs | [x] Implemented |
| Profile queries | `profileQuerySchema` | Profile reads | [x] Implemented |
| Profile updates | `profileUpdateSchema` | Profile writes | [x] Implemented |
| Coin operations | `coinOperationSchema` | Credits/Debits | [x] Implemented |
| Tier changes | `tierChangeSchema` | Tier updates | [x] Implemented |
| Decision requests | `decisionRequestSchema` | Decision calls | [x] Implemented |
| Attribution events | `attributionTrackSchema` | Event tracking | [x] Implemented |
| Admin bulk ops | `adminBulkOperationSchema` | Bulk operations | [x] Implemented |

### JWT Authentication

| Token Type | Environment Variable | Use Case | Status |
|------------|---------------------|----------|--------|
| User token | `JWT_SECRET` | End-user authentication | [x] Implemented |
| Merchant token | `JWT_MERCHANT_SECRET` | Merchant authentication | [x] Implemented |
| Admin token | `JWT_ADMIN_SECRET` | Admin operations | [x] Implemented |
| Service token | `SERVICE_SECRET` | Service-to-service | [x] Implemented |

### Service-to-Service Authentication

| Authentication | Service | Scope | Status |
|---------------|---------|-------|--------|
| Service token validation | All internal services | Internal APIs | [x] Implemented |
| Scope validation | All internal services | Restricted endpoints | [x] Implemented |
| Permission checking | Admin endpoints | Admin operations | [x] Implemented |

### CORS Configuration

| Setting | Value | Status |
|---------|-------|--------|
| Allowed origins | Configurable via `ALLOWED_ORIGINS` | [x] Implemented |
| Credentials | Enabled | [x] Implemented |
| Allowed methods | GET, POST, PUT, PATCH, DELETE, OPTIONS | [x] Implemented |
| Allowed headers | Content-Type, Authorization, X-User-Id, X-Request-Id | [x] Implemented |
| Exposed headers | X-RateLimit-*, X-Request-Id | [x] Implemented |

### Helmet Security Headers

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | Strict directives | [x] Implemented |
| X-Content-Type-Options | nosniff | [x] Implemented |
| X-Frame-Options | DENY | [x] Implemented |
| X-XSS-Protection | 1; mode=block | [x] Implemented |
| Strict-Transport-Security | max-age=31536000 | [x] Implemented |
| Referrer-Policy | strict-origin-when-cross-origin | [x] Implemented |
| Permissions-Policy | Restricted features | [x] Implemented |

### Request Size Limits

| Endpoint Type | Limit | Status |
|---------------|-------|--------|
| JSON body (default) | 100kb | [x] Implemented |
| JSON body (bulk ops) | 1mb | [x] Implemented |
| URL encoded | 100kb | [x] Implemented |
| Raw body | 1mb | [x] Implemented |

### SQL/NoSQL Injection Prevention

| Protection | Implementation | Status |
|------------|---------------|--------|
| NoSQL injection guard | MongoDB operator detection | [x] Implemented |
| Input sanitization | String sanitization | [x] Implemented |
| Zod schema validation | All inputs validated | [x] Implemented |

### XSS Prevention

| Protection | Implementation | Status |
|------------|---------------|--------|
| Input sanitization | HTML entity encoding | [x] Implemented |
| Content-Security-Policy | Strict CSP headers | [x] Implemented |
| XSS-Protection header | mode=block | [x] Implemented |

### Audit Logging

| Event Type | Logged | Status |
|------------|--------|--------|
| Coin credits | Amount, reason, user, admin | [x] Implemented |
| Coin debits | Amount, reason, user, admin | [x] Implemented |
| Tier changes | Previous tier, new tier, reason | [x] Implemented |
| Tier upgrades | Tier change details | [x] Implemented |
| Tier downgrades | Tier change details | [x] Implemented |
| Admin actions | Action, target, admin ID | [x] Implemented |
| Bulk operations | Operation details, count | [x] Implemented |
| Auth success | User ID, IP, timestamp | [x] Implemented |
| Auth failures | Reason, IP, timestamp | [x] Implemented |
| Permission denied | User, action, required permission | [x] Implemented |
| Rate limit exceeded | User, endpoint | [x] Implemented |

---

## Service-Specific Security

### Profile Aggregator Service

- [x] Rate limiting: 100/min queries, 30/min updates
- [x] JWT user authentication
- [x] Service-to-service authentication
- [x] Zod input validation
- [x] NoSQL injection prevention
- [x] Audit logging for profile changes

### Loyalty Engine Service

- [x] Rate limiting: 50/min for coin operations
- [x] Service-to-service authentication for internal calls
- [x] Admin override for special operations
- [x] Amount validation (min/max limits)
- [x] Full audit trail for credits/debits
- [x] Bulk operation protection

### Tier Service

- [x] Rate limiting: 20/min for tier changes
- [x] Admin-only tier modifications
- [x] Tier transition validation
- [x] Points-to-tier calculation
- [x] Tier hierarchy enforcement
- [x] Bulk tier operations (admin only)

### Audit Log Service

- [x] Rate limiting: 100/min queries, 10/min exports
- [x] Admin-only access
- [x] Date range validation (max 90 days)
- [x] Export limit validation
- [x] Read-only access (immutable logs)

### Decision Service

- [x] Rate limiting: 500/min decisions, 200/min targeting
- [x] Service-to-service authentication
- [x] Optional user authentication
- [x] Campaign ID validation
- [x] Max offers limit enforcement
- [x] Context validation

---

## Environment Variables

### Required for Production

```bash
# JWT Secrets (minimum 32 characters)
JWT_SECRET=your-secret-key-min-32-chars
JWT_MERCHANT_SECRET=your-merchant-secret-min-32-chars
JWT_ADMIN_SECRET=your-admin-secret-min-32-chars
SERVICE_SECRET=your-service-secret-min-32-chars

# CORS Configuration
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# Redis (for distributed rate limiting)
REDIS_URL=redis://localhost:6379

# Service Name
SERVICE_NAME=your-service-name
NODE_ENV=production
```

---

## Security Headers Reference

All services should include these headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; [restrictions]
```

---

## Implementation Guide

### Adding Security to a New Service

1. **Install the security package:**
   ```bash
   npm install @rez/security
   ```

2. **Initialize the security module:**
   ```typescript
   import { initAuditLogger, DefaultAuditLogger } from '@rez/security';

   initAuditLogger(new DefaultAuditLogger('your-service'));
   ```

3. **Apply security middleware:**
   ```typescript
   import { applySecurityMiddleware } from './security';

   // In your main.ts
   applySecurityMiddleware(app);
   ```

4. **Protect routes:**
   ```typescript
   import { requireUser, validateBody, mySchema } from '@rez/security';

   app.post('/api/coins/credit',
     requireUser,
     validateBody(mySchema),
     handleCredit
   );
   ```

---

## Verification Checklist

Before deploying to production, verify:

- [ ] All environment variables are set
- [ ] Rate limiting is configured appropriately
- [ ] JWT secrets are strong (min 32 chars)
- [ ] CORS origins are restricted to known domains
- [ ] Audit logging is enabled
- [ ] Input validation schemas cover all endpoints
- [ ] Security headers are present on all responses
- [ ] NoSQL injection guard is active
- [ ] Request size limits are enforced
- [ ] Admin endpoints require proper authentication

---

## Security Monitoring

### Key Metrics to Monitor

1. **Rate Limit Hits**
   - Track 429 responses
   - Identify potential abuse patterns

2. **Authentication Failures**
   - Monitor auth failure logs
   - Alert on unusual spikes

3. **Validation Errors**
   - Track 400 responses
   - Identify potential attack attempts

4. **Circuit Breaker States**
   - Monitor service health
   - Track fallback activations

---

## Incident Response

If a security incident is detected:

1. **Immediate Actions**
   - Enable stricter rate limiting
   - Rotate affected JWT secrets
   - Block suspicious IP addresses

2. **Investigation**
   - Review audit logs
   - Identify affected users
   - Determine root cause

3. **Remediation**
   - Apply security patches
   - Update firewall rules
   - Reset compromised credentials

4. **Post-Incident**
   - Document lessons learned
   - Update security checklist
   - Implement additional protections
