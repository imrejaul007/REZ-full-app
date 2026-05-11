# Security Hardening Roadmap
**Date:** 2026-04-30
**Status:** Planned

---

## Overview

This document outlines critical security hardening tasks that require manual action.

---

## CRITICAL - Immediate Action Required

### 1. Rotate All Exposed Credentials

**Issue:** Multiple .env files with real credentials were committed to git.

**Action Required:**
```bash
# 1. Rotate MongoDB Atlas password
# Login to MongoDB Atlas → Security → Database Access → Edit user

# 2. Rotate all JWT secrets
openssl rand -hex 64

# 3. Rotate SendGrid API key
# SendGrid dashboard → API Keys → Create new → Delete old

# 4. Rotate Sentry DSNs
# Sentry dashboard → Settings → Projects → Client Keys
```

**Affected Services:**
- rez-payment-service
- rez-order-service
- rez-wallet-service
- rez-notification-events
- docker-compose.rez-mind.yml

### 2. Enable MongoDB Authentication

**Current:** MongoDB allows unauthenticated connections

**Required:**
```yaml
# docker-compose.yml
environment:
  MONGO_INITDB_ROOT_USERNAME: admin
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
```

**Service Connection:**
```javascript
mongodb://admin:${MONGO_ROOT_PASSWORD}@mongo:27017/rez-app?authSource=admin
```

### 3. Enable Redis AUTH

**Current:** Redis has no authentication

**Required:**
```bash
# Add to redis.conf
requirepass ${REDIS_PASSWORD}

# Update all services
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
```

---

## HIGH Priority

### 4. Add mTLS Between Services

**Target:** All internal service-to-service communication

**Implementation:**
1. Set up internal CA
2. Generate certificates per service
3. Configure mutual TLS in HTTP clients
4. Update Kong gateway

### 5. Set Up Vault/PKI

**Recommended:** HashiCorp Vault or AWS Secrets Manager

**Benefits:**
- Centralized secrets management
- Automatic rotation
- Audit logging
- Fine-grained access control

### 6. Add WAF Rules

**Cloudflare/AWS WAF:**

| Rule | Action |
|------|--------|
| SQL Injection | Block |
| XSS | Block |
| Rate limiting | Challenge |
| Known bad IPs | Block |

---

## MEDIUM Priority

### 7. Add DDoS Protection

**Options:**
- Cloudflare Pro/Business
- AWS Shield Advanced
- Custom rate limiting

### 8. Penetration Testing

**Recommended:** Professional security audit

**Scope:**
- API endpoints
- Authentication flows
- Payment processing
- Data storage

### 9. Security Headers

**Current:**
```typescript
res.set('X-Content-Type-Options', 'nosniff');
res.set('X-Frame-Options', 'DENY');
```

**Add:**
```typescript
res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
res.set('Content-Security-Policy', "default-src 'self'");
res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

---

## Implementation Checklist

- [ ] Rotate MongoDB Atlas credentials
- [ ] Rotate JWT secrets
- [ ] Rotate SendGrid API key
- [ ] Rotate all Sentry DSNs
- [ ] Enable MongoDB authentication
- [ ] Enable Redis AUTH
- [ ] Add mTLS certificates
- [ ] Set up Vault
- [ ] Configure WAF rules
- [ ] Add DDoS protection
- [ ] Conduct penetration test

---

## Verification Commands

```bash
# Check for exposed secrets in git history
git log --all -p | grep -E "password|secret|token" | head -20

# Check MongoDB auth
mongosh --eval "db.adminCommand('getLog','startupWarnings')"

# Check Redis auth
redis-cli CONFIG GET requirepass
```
