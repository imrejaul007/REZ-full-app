# Internal Service Token Migration Guide

**Date:** 2026-04-29
**Issue:** C19 - Legacy Single Token Instead of Scoped
**Status:** In Progress

---

## Overview

The REZ ecosystem currently supports both legacy single `INTERNAL_SERVICE_TOKEN` and scoped `INTERNAL_SERVICE_TOKENS_JSON` for internal service authentication. This guide helps migrate to the secure scoped token format.

## Why Migrate?

| Aspect | Legacy Token | Scoped Tokens |
|--------|-------------|---------------|
| Security | Single token compromise = full system access | Compromised token = single service access |
| Audit | No service attribution | Full audit trail by serviceId |
| Rotation | All services down | One service at a time |
| Compliance | Fails security audits | Meets SOC2/GDPR requirements |

---

## Token Format Comparison

### Legacy (DEPRECATED)
```bash
INTERNAL_SERVICE_TOKEN=super-secret-token-shared-everywhere
```

### Scoped (RECOMMENDED)
```bash
INTERNAL_SERVICE_TOKENS_JSON='[
  {"serviceId":"order-service","token":"order-service-secret-abc123"},
  {"serviceId":"payment-service","token":"payment-service-secret-def456"},
  {"serviceId":"wallet-service","token":"wallet-service-secret-ghi789"},
  {"serviceId":"merchant-service","token":"merchant-service-secret-jkl012"},
  {"serviceId":"gamification-service","token":"gamification-service-secret-mno345"},
  {"serviceId":"intent-graph","token":"intent-graph-secret-pqr678"}
]'
```

---

## Migration Steps

### Step 1: Generate New Scoped Tokens

Generate cryptographically secure tokens for each service:

```bash
# Generate secure tokens (32 bytes = 256 bits)
openssl rand -hex 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Update Each Service

For each service, add `INTERNAL_SERVICE_TOKENS_JSON` to their environment:

#### rez-order-service
```bash
# Add to Render dashboard environment variables
INTERNAL_SERVICE_TOKENS_JSON='[{"serviceId":"order-service","token":"NEW_SECURE_TOKEN"}]'
```

#### rez-payment-service
```bash
INTERNAL_SERVICE_TOKENS_JSON='[{"serviceId":"payment-service","token":"NEW_SECURE_TOKEN"}]'
```

#### rez-wallet-service
```bash
INTERNAL_SERVICE_TOKENS_JSON='[{"serviceId":"wallet-service","token":"NEW_SECURE_TOKEN"}]'
```

#### rez-merchant-service
```bash
INTERNAL_SERVICE_TOKENS_JSON='[{"serviceId":"merchant-service","token":"NEW_SECURE_TOKEN"}]'
```

#### rez-gamification-service
```bash
INTERNAL_SERVICE_TOKENS_JSON='[{"serviceId":"gamification-service","token":"NEW_SECURE_TOKEN"}]'
```

### Step 3: Update Service Clients

Update HTTP clients to include the service ID:

```typescript
// Before
headers: {
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
}

// After
headers: {
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN, // Keep for backward compat
  'X-Internal-Service': 'order-service'  // NEW: Identify calling service
}
```

### Step 4: Remove Legacy Token (Final Step)

After all services are migrated and tested:

1. Remove `INTERNAL_SERVICE_TOKEN` from all services
2. Deploy changes
3. Monitor logs for any legacy token warnings

---

## Verification

### Check for Legacy Token Usage

```bash
# Search for INTERNAL_SERVICE_TOKEN in source (should only be in .env.example)
grep -rn "INTERNAL_SERVICE_TOKEN" --include="*.ts" --include="*.js" . | grep -v ".env.example" | grep -v "node_modules"
```

### Monitor for Warnings

When legacy tokens are used, the middleware logs:
```
[InternalAuth] ⚠️ DEPRECATED: Legacy INTERNAL_SERVICE_TOKEN used.
Migrate to INTERNAL_SERVICE_TOKENS_JSON format...
```

---

## Rollback Plan

If issues occur during migration:

1. Keep `INTERNAL_SERVICE_TOKEN` in environment
2. Remove from code only after all services confirmed working
3. The middleware supports both formats during transition

---

## Services Using Internal Auth

| Service | Auth Method | Status |
|---------|-------------|--------|
| rez-auth-service | JWT + internal token | Migrated |
| rez-merchant-service | JWT + HMAC | Pending |
| rez-order-service | HMAC | Pending |
| rez-payment-service | HMAC | Pending |
| rez-wallet-service | JWT + HMAC | Pending |
| rez-gamification-service | HMAC-SHA256 | Pending |
| rez-intent-graph | JWT | Pending |

---

## References

- [Unified Auth Middleware](../rez-shared/src/middleware/internalAuth.ts)
- [OPS-003 Resolution](./OPS-003-NO-API-GATEWAY.md)
