# REZ Ecosystem Secret Rotation Guide

**Document Version:** 1.0
**Last Updated:** 2026-04-29
**Classification:** SECURITY - CONFIDENTIAL

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Exposed Secrets - IMMEDIATE ACTION REQUIRED](#critical-exposed-secrets---immediate-action-required)
3. [Secret Inventory by Service](#secret-inventory-by-service)
4. [Rotation Procedures](#rotation-procedures)
5. [Secret Generation Commands](#secret-generation-commands)
6. [Rotation Checklist](#rotation-checklist)
7. [Post-Rotation Verification](#post-rotation-verification)

---

## Executive Summary

This document catalogs all secrets found in the REZ ecosystem `.env` files and provides step-by-step rotation procedures. **Several production secrets have been exposed** and require immediate rotation.

### Priority Levels

| Priority | Description | Rotation Timeline |
|----------|-------------|-------------------|
| **CRITICAL** | Exposed in `.env` files, active in production | Immediate (0-24 hours) |
| **HIGH** | Sensitive API keys, database credentials | Within 7 days |
| **MEDIUM** | Service tokens, internal keys | Within 30 days |
| **LOW** | Non-sensitive configuration | Review quarterly |

---

## Critical Exposed Secrets - IMMEDIATE ACTION REQUIRED

### 1. JWT Secrets (CRITICAL)

| Service | Secret Name | Exposure Status | Location |
|---------|-------------|-----------------|----------|
| rez-wallet-service | `JWT_SECRET` | **EXPOSED** | `/rez-wallet-service/.env` |
| rez-wallet-service | `JWT_MERCHANT_SECRET` | **EXPOSED** | `/rez-wallet-service/.env` |
| rez-wallet-service | `JWT_ADMIN_SECRET` | **EXPOSED** | `/rez-wallet-service/.env` |
| rez-payment-service | `JWT_SECRET` | **EXPOSED** | `/rez-payment-service/.env` |
| rez-payment-service | `JWT_MERCHANT_SECRET` | **EXPOSED** | `/rez-payment-service/.env` |

**Current Values (DO NOT USE - COMPROMISED):**
```
JWT_SECRET=0e4fad97728117c816f6f954aa55e6dbd774208b50831f09471e769e2fcda835c93eedcb8ca4e4cf13f5ee52c96dbe2e1fc9ce8eb2a8fc07eb125dd5997b5bc5
JWT_MERCHANT_SECRET=f9c6f4e77a7a477d34f00bc972d2d5da171770ca3ed8647343557286f7a9cad2e56aadef2c5b73bd52e32c7c306dbfac9d8116141981207da866d1881b75de86
JWT_ADMIN_SECRET=f8ef0ec22ad56b5d854eeabe6c8359b70703fbfdc5d64c5876da632cb394a7688c54f84014206bbc0d4a6ea7e23c01b8de9f3a07a0c5169752fc16f6e58be816
```

### 2. Internal Service Token (CRITICAL)

| Service | Secret Name | Exposure Status |
|---------|-------------|-----------------|
| All Services | `INTERNAL_SERVICE_TOKEN` | **EXPOSED** |

**Current Value (COMPROMISED):**
```
INTERNAL_SERVICE_TOKEN=7ed15a3e7b222f8c432153c18bc7ae52154011e4e881a7e4774fac9da021e921
```

### 3. Database Credentials (CRITICAL)

| Database | Credential | Exposure Status | Location |
|----------|------------|-----------------|----------|
| MongoDB (Cluster0) | `work_db_user:RmptskyDLFNSJGCA` | **EXPOSED** | Multiple `.env` files |
| MongoDB (Intent Graph) | `work_db_user:ZAFYAYH1zK0C74Ap` | **EXPOSED** | `rez-intent-predictor/.env`, `rez-recommendation-engine/.env` |
| Redis | `red-d760rlshg0os73bd8mp0` | **EXPOSED** | Multiple `.env` files |

### 4. Payment Gateway (HIGH)

| Provider | Secret Name | Status | Notes |
|----------|-------------|--------|-------|
| Razorpay | `RAZORPAY_KEY_SECRET` | Test key exposed | `rzp_test_KNyY9qdKdFPU2n` |
| Cloudinary | `CLOUDINARY_API_SECRET` | **EXPOSED** | `zghcWvnP0Zjz_5zDP1YQnr8-hew` |

### 5. Supabase (HIGH)

| Key Type | Variable | Status |
|----------|----------|--------|
| Anon Key (Public) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **EXPOSED** |
| Service Role Key (SUPERUSER) | `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL** |

### 6. SendGrid (HIGH)

| Secret | Status | Location |
|--------|--------|----------|
| `SENDGRID_API_KEY` | **EXPOSED** | `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` |

---

## Secret Inventory by Service

### Core Payment Services

#### rez-payment-service
**Location:** `/rez-payment-service/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - credentials exposed | N/A - Create new MongoDB user |
| `REDIS_URL` | Cache URL | YES - password in URL | N/A - Reset Redis password |
| `JWT_SECRET` | Symmetric Key | **CRITICAL** | `openssl rand -base64 64` |
| `JWT_MERCHANT_SECRET` | Symmetric Key | **CRITICAL** | `openssl rand -base64 64` |
| `INTERNAL_SERVICE_TOKEN` | API Key | **CRITICAL** | `openssl rand -hex 32` |
| `RAZORPAY_KEY_ID` | API Key | Review | Get from Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | API Secret | **HIGH** | Get from Razorpay Dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook Secret | YES | Get from Razorpay Dashboard |
| `INTERNAL_WEBHOOK_SECRET` | Webhook Secret | Recommended | `openssl rand -base64 64` |
| `SENTRY_DSN` | Monitoring | Review | Get from Sentry Dashboard |

#### rez-wallet-service
**Location:** `/rez-wallet-service/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - credentials exposed | N/A - Create new MongoDB user |
| `REDIS_URL` | Cache URL | YES - password in URL | N/A - Reset Redis password |
| `JWT_SECRET` | Symmetric Key | **CRITICAL** | `openssl rand -base64 64` |
| `JWT_MERCHANT_SECRET` | Symmetric Key | **CRITICAL** | `openssl rand -base64 64` |
| `JWT_ADMIN_SECRET` | Symmetric Key | **CRITICAL** | `openssl rand -base64 64` |
| `INTERNAL_SERVICE_TOKEN` | API Key | **CRITICAL** | `openssl rand -hex 32` |
| `SENTRY_DSN` | Monitoring | Review | Get from Sentry Dashboard |

### Notification Services

#### rez-notification-events
**Location:** `/rez-notification-events/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - credentials exposed | N/A - Create new MongoDB user |
| `REDIS_URL` | Cache URL | YES - password in URL | N/A - Reset Redis password |
| `SENDGRID_API_KEY` | API Key | **HIGH** | Regenerate in SendGrid |
| `SENTRY_DSN` | Monitoring | Review | Get from Sentry Dashboard |

#### rez-media-events
**Location:** `/rez-media-events/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - credentials exposed | N/A - Create new MongoDB user |
| `REDIS_URL` | Cache URL | YES - password in URL | N/A - Reset Redis password |
| `CLOUDINARY_API_KEY` | API Key | **HIGH** | Get from Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | API Secret | **HIGH** | Regenerate in Cloudinary |
| `SENTRY_DSN` | Monitoring | Review | Get from Sentry Dashboard |

### Gamification & Rewards

#### rez-gamification-service
**Location:** `/rez-gamification-service/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - credentials exposed | N/A - Create new MongoDB user |
| `REDIS_URL` | Cache URL | YES - password in URL | N/A - Reset Redis password |
| `SENTRY_DSN` | Monitoring | Review | Get from Sentry Dashboard |

### Intent & Recommendation Services

#### rez-intent-predictor
**Location:** `/rez-intent-predictor/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - different cluster | N/A - Create new MongoDB user |

#### rez-recommendation-engine
**Location:** `/rez-recommendation-engine/.env`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGODB_URI` | Database URL | YES - different cluster | N/A - Create new MongoDB user |

### Consumer Applications

#### adsqr
**Location:** `/adsqr/.env.local`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL | No | N/A |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Key | **HIGH** | Regenerate in Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Key | **CRITICAL** | Regenerate in Supabase |
| `DATABASE_URL` | Database URL | Review | N/A |

#### rez-now
**Location:** `/rez-now/.env.local`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `REZ_OAUTH_CLIENT_SECRET` | OAuth Secret | **HIGH** | `openssl rand -base64 64` |
| `WHATSAPP_ACCESS_TOKEN` | API Token | **HIGH** | Regenerate in Meta Developer Portal |
| `ANTHROPIC_API_KEY` | API Key | **HIGH** | Regenerate in Anthropic Console |
| `FCM_SERVER_KEY` | Push Notification | Review | Regenerate in Firebase Console |
| `VAPID_PRIVATE_KEY` | Push Notification | Review | Regenerate via web-push library |

#### rez-app-consumer
**Location:** `/rez-app-consumer/.env.example`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `EXPO_PUBLIC_OTA_CLIENT_SECRET` | OTA Secret | Review | Get from OTA provider |

### Ad Services

#### rez-ads-service
**Location:** `/rez-ads-service/.env.example`

| Secret | Type | Rotation Required | Generate Command |
|--------|------|------------------|-----------------|
| `MONGO_INITDB_ROOT_PASSWORD` | Database Password | **HIGH** | `openssl rand -base64 24` |
| `REDIS_PASSWORD` | Cache Password | **HIGH** | `openssl rand -hex 32` |
| `JWT_SECRET` | Symmetric Key | **HIGH** | `openssl rand -base64 64` |
| `INTERNAL_SERVICE_KEY` | API Key | **HIGH** | `openssl rand -hex 32` |
| `INTERNAL_SERVICE_TOKEN` | API Key | **HIGH** | `openssl rand -hex 32` |
| `ADBAZAAR_INTERNAL_KEY` | API Key | **HIGH** | `openssl rand -hex 32` |

---

## Rotation Procedures

### 1. JWT Secret Rotation (ALL SERVICES)

#### Prerequisites
- Access to deployment platform (Render/Vercel)
- Access to service source code
- Database access to invalidate existing tokens

#### Steps

```bash
# Step 1: Generate new JWT secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_JWT_MERCHANT_SECRET=$(openssl rand -base64 64)
NEW_JWT_ADMIN_SECRET=$(openssl rand -base64 64)

# Step 2: Update service .env files
# Replace in:
# - /rez-wallet-service/.env
# - /rez-payment-service/.env

# Step 3: Redeploy affected services
# Services requiring restart:
# - rez-auth-service
# - rez-wallet-service
# - rez-payment-service
# - rez-merchant-service
# - rez-admin-app

# Step 4: Force logout all users (optional - consult UX team)
# This invalidates all existing JWTs
```

#### Post-Rotation
1. Monitor error logs for authentication failures
2. Verify new tokens are being issued
3. Check Sentry for authentication-related errors

---

### 2. Internal Service Token Rotation

#### Steps

```bash
# Step 1: Generate new token
NEW_INTERNAL_TOKEN=$(openssl rand -hex 32)

# Step 2: Update ALL services that use INTERNAL_SERVICE_TOKEN:
# - rez-payment-service
# - rez-wallet-service
# - rez-notification-events
# - rez-gamification-service
# - rez-media-events
# - rez-ads-service
# - rez-intent-predictor
# - rez-recommendation-engine

# Step 3: Redeploy all services in parallel
# IMPORTANT: Must update all at once to maintain inter-service communication
```

#### Services Matrix for Internal Token

| Service | Uses INTERNAL_SERVICE_TOKEN | Also Provides Token |
|---------|---------------------------|-------------------|
| rez-payment-service | Yes | Yes |
| rez-wallet-service | Yes | Yes |
| rez-notification-events | Yes | No |
| rez-gamification-service | Yes | No |
| rez-media-events | Yes | No |
| rez-ads-service | Yes | Yes |
| rez-intent-predictor | No | No |
| rez-recommendation-engine | No | No |

---

### 3. MongoDB Credentials Rotation

#### Atlas MongoDB (Cluster0)

```bash
# Step 1: Go to MongoDB Atlas > Security > Database Access
# Step 2: Create new user: rez_production_user
# Step 3: Generate strong password (use Atlas password generator)

# Step 4: Update connection string in all .env files
# OLD: mongodb+srv://work_db_user:RmptskyDLFNSJGCA@...
# NEW: mongodb+srv://rez_production_user:<NEW_PASSWORD>@...

# Step 5: Verify application works with new credentials

# Step 6: Delete old work_db_user from Atlas
```

#### Atlas MongoDB (Intent Graph)

```bash
# Step 1: Go to MongoDB Atlas > Security > Database Access
# Step 2: Create new user for intent-graph database

# Step 3: Update in:
# - /rez-intent-predictor/.env
# - /rez-recommendation-engine/.env
```

---

### 4. Redis Password Rotation

```bash
# Step 1: Log in to Redis Cloud console
# Step 2: Navigate to your database > Security
# Step 3: Generate new password

# Step 4: Update REDIS_URL in all services:
# - rez-payment-service
# - rez-wallet-service
# - rez-notification-events
# - rez-gamification-service
# - rez-media-events

# NEW format: redis://:NEW_PASSWORD@red-xxxxx-xxxxx:6379
```

---

### 5. Razorpay Keys Rotation

```bash
# Step 1: Log in to Razorpay Dashboard
# Step 2: Go to Settings > API Keys
# Step 3: Generate test and live keys

# Step 4: Update in:
# - /rez-payment-service/.env
# - /rez-app-consumer/.env.example (NEXT_PUBLIC_RAZORPAY_KEY_ID)

# Step 5: Update webhook endpoint with new webhook secret
```

---

### 6. Supabase Keys Rotation

```bash
# Step 1: Log in to Supabase Dashboard
# Step 2: Go to Project > API Settings
# Step 3: Regenerate both:
#   - anon/public key
#   - service_role key (keep this secret!)

# Step 4: Update in /adsqr/.env.local:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<new_anon_key>
# SUPABASE_SERVICE_ROLE_KEY=<new_service_key>

# IMPORTANT: Service role key has admin access to all tables
```

---

### 7. SendGrid API Key Rotation

```bash
# Step 1: Log in to SendGrid Dashboard
# Step 2: Go to Settings > API Keys
# Step 3: Create new API Key with Mail Send permissions

# Step 4: Update in /rez-notification-events/.env
# SENDGRID_API_KEY=SG.xxxxx.new_key_here

# Step 5: Verify email sending works
# Step 6: Delete old API key from SendGrid
```

---

### 8. Cloudinary Keys Rotation

```bash
# Step 1: Log in to Cloudinary Dashboard
# Step 2: Go to Settings > API Keys
# Step 3: Regenerate API Secret (keep Cloud Name and API Key the same)

# Step 4: Update in /rez-media-events/.env
# CLOUDINARY_API_SECRET=<new_secret>

# Step 5: Verify media uploads work
```

---

## Secret Generation Commands

### Secure Random String Generators

```bash
# 32-byte base64 (256-bit key - recommended for JWT)
openssl rand -base64 32

# 64-byte base64 (512-bit key - extra security)
openssl rand -base64 64

# 32-byte hex (128-bit key - for tokens)
openssl rand -hex 32

# 24-byte base64 (192-bit key - for database passwords)
openssl rand -base64 24

# 16-byte hex (64-bit key - for simple tokens)
openssl rand -hex 16
```

### Password Generation Examples

```bash
# Generate secure password for MongoDB
MONGODB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
echo "MongoDB Password: $MONGODB_PASS"

# Generate secure password for Redis
REDIS_PASS=$(openssl rand -hex 32)
echo "Redis Password: $REDIS_PASS"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT Secret: $JWT_SECRET"

# Generate internal service token
SERVICE_TOKEN=$(openssl rand -hex 32)
echo "Service Token: $SERVICE_TOKEN"
```

---

## Rotation Checklist

### Pre-Rotation (All Services)

- [ ] **Backup current .env files** - Copy to secure backup location
- [ ] **Notify team** - Slack/Email about planned maintenance window
- [ ] **Schedule deploy** - Plan deployment during low-traffic period
- [ ] **Prepare rollback** - Know how to revert if issues occur
- [ ] **Test in staging** - Verify rotation works in non-production first

### Critical Secrets (24-48 hours)

- [ ] **JWT_SECRET** - Rotate in rez-wallet-service
- [ ] **JWT_MERCHANT_SECRET** - Rotate in rez-wallet-service
- [ ] **JWT_ADMIN_SECRET** - Rotate in rez-wallet-service
- [ ] **JWT_SECRET** - Rotate in rez-payment-service
- [ ] **JWT_MERCHANT_SECRET** - Rotate in rez-payment-service
- [ ] **INTERNAL_SERVICE_TOKEN** - Rotate across ALL services
- [ ] **SUPABASE_SERVICE_ROLE_KEY** - Rotate in adsqr

### High Priority (7 days)

- [ ] **MongoDB credentials** - Rotate for Cluster0
- [ ] **MongoDB credentials** - Rotate for Intent Graph cluster
- [ ] **Redis password** - Regenerate in Redis Cloud
- [ ] **RAZORPAY_KEY_SECRET** - Regenerate in Razorpay
- [ ] **SENDGRID_API_KEY** - Regenerate in SendGrid
- [ ] **CLOUDINARY_API_SECRET** - Regenerate in Cloudinary
- [ ] **REZ_OAUTH_CLIENT_SECRET** - Rotate in rez-now
- [ ] **WHATSAPP_ACCESS_TOKEN** - Regenerate in Meta

### Medium Priority (30 days)

- [ ] **MONGO_INITDB_ROOT_PASSWORD** - Rotate in rez-ads-service
- [ ] **REDIS_PASSWORD** - Rotate in rez-ads-service
- [ ] **JWT_SECRET** - Rotate in rez-ads-service
- [ ] **INTERNAL_SERVICE_KEY** - Rotate in rez-ads-service
- [ ] **ANTHROPIC_API_KEY** - Rotate in rez-now

### Post-Rotation Verification

- [ ] **Service health checks** - All services responding
- [ ] **Authentication tests** - Login/logout working
- [ ] **Payment tests** - Payment flow completing
- [ ] **Email tests** - Notifications sending
- [ ] **Media upload tests** - Cloudinary uploads working
- [ ] **Error rate check** - No spike in Sentry errors
- [ ] **Performance check** - No latency increase

---

## Environment Variables Reference by Service

### Core Services Template

| Variable | Description | Example Value | Sensitive |
|----------|-------------|--------------|-----------|
| `NODE_ENV` | Environment | `production` | No |
| `PORT` | Service port | `4001` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `MONGODB_URI` | Database connection | `mongodb+srv://user:pass@host/db` | **YES** |
| `REDIS_URL` | Cache connection | `redis://:pass@host:6379` | **YES** |
| `JWT_SECRET` | JWT signing key | `openssl rand -base64 64` | **YES** |
| `JWT_MERCHANT_SECRET` | Merchant JWT key | `openssl rand -base64 64` | **YES** |
| `JWT_ADMIN_SECRET` | Admin JWT key | `openssl rand -base64 64` | **YES** |
| `INTERNAL_SERVICE_TOKEN` | Service auth | `openssl rand -hex 32` | **YES** |
| `SENTRY_DSN` | Error tracking | `https://...@sentry.io/...` | **YES** |
| `SENTRY_ENVIRONMENT` | Sentry env | `production` | No |
| `SENTRY_TRACES_SAMPLE_RATE` | Sampling rate | `0.1` | No |

### Payment Services Template

| Variable | Description | Example Value | Sensitive |
|----------|-------------|--------------|-----------|
| `RAZORPAY_KEY_ID` | Payment gateway ID | `rzp_test_...` | Medium |
| `RAZORPAY_KEY_SECRET` | Payment gateway secret | `...` | **YES** |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification | `...` | **YES** |
| `CORS_ORIGIN` | Allowed origins | `https://app.rez.money` | No |

### Notification Services Template

| Variable | Description | Example Value | Sensitive |
|----------|-------------|--------------|-----------|
| `SENDGRID_API_KEY` | Email API key | `SG.xxxxxx` | **YES** |
| `SENDGRID_FROM_EMAIL` | Sender email | `noreply@rez.money` | No |
| `CLOUDINARY_CLOUD_NAME` | Media service | `dgqqkrsha` | No |
| `CLOUDINARY_API_KEY` | Media API key | `134482793194638` | Medium |
| `CLOUDINARY_API_SECRET` | Media API secret | `...` | **YES** |

### Supabase Template

| Variable | Description | Example Value | Sensitive |
|----------|-------------|--------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database URL | `https://xxx.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | `eyJ...` | Medium |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key | `eyJ...` | **YES** |

---

## Appendix: Secret Storage Recommendations

### Recommended Secret Storage Solutions

1. **Render Environment Variables** (Current)
   - Pros: Integrated with deployment
   - Cons: Manual management, no rotation automation

2. **HashiCorp Vault** (Recommended for Scale)
   - Pros: Automatic rotation, audit logs, access control
   - Cons: Additional infrastructure

3. **AWS Secrets Manager / GCP Secret Manager**
   - Pros: Native cloud integration, automatic rotation
   - Cons: Cloud lock-in

4. **Doppler / 1Password Secrets Automation**
   - Pros: Developer-friendly, integrates with CI/CD
   - Cons: Subscription cost

### Future Improvements

1. Implement secret rotation automation
2. Add secret expiration alerts
3. Deploy secret scanning in CI/CD pipeline
4. Move to centralized secret management (Vault/Doppler)
5. Implement JWT refresh token rotation

---

**Document Owner:** Security Team
**Review Schedule:** Quarterly or after any security incident
**Distribution:** Internal only - Do not share externally
