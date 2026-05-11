# Marketing Platform Deployment Guide

## Overview

This guide covers the deployment of all services in the ReZ Marketing Platform monorepo.

**Repository:** `/Users/rejaulkarim/Documents/ReZ Full App/packages/marketing-platform/`

---

## Deployment Order

Services must be deployed in this specific order due to dependencies:

| Order | Service | Port | Deploy First | Deploy After |
|-------|---------|------|--------------|--------------|
| 1 | rez-lead-intelligence | 4106 | Lead data provider | None |
| 2 | rez-abandonment-tracker | 4108 | Depends on lead intelligence | Lead Intelligence |
| 3 | rez-marketing-service | 4000 | Core marketing service | Lead Intelligence, Abandonment Tracker |
| 4 | rez-decision-service | 4027 | Real-time decisions | Marketing Service |
| 5 | rez-unified-messaging | 4025 | Messaging delivery | Decision Service, Marketing Service |

---

## Service Details

### 1. rez-lead-intelligence

**Purpose:** Lead detection and scoring service - identifies hot/warm/cold leads

**Port:** 4106

**Directory:** `services/rez-lead-intelligence/`

**Dependencies:**
- MongoDB Atlas
- Redis

**Required Environment Variables:**
```bash
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
INTERNAL_SERVICE_TOKENS_JSON='["token1","token2"]'
SENTRY_DSN=https://...@sentry.io/...
```

**Optional Environment Variables:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
HOT_LEAD_THRESHOLD=80
WARM_LEAD_THRESHOLD=50
COLD_LEAD_THRESHOLD=20
HOT_LEADS_CRON=0 * * * *
MARKETING_SYNC_CRON=5 * * * *
ABANDONED_CARTS_CRON=0 */4 * * *
```

**Health Check:** `GET /api/v1/health`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
node dist/index.js
```

**Render Configuration:** `services/rez-lead-intelligence/render.yaml`

---

### 2. rez-abandonment-tracker

**Purpose:** Tracks and recovers abandoned carts and sessions

**Port:** 4108

**Directory:** `services/rez-abandonment-tracker/`

**Dependencies:**
- MongoDB Atlas
- Redis
- rez-lead-intelligence (for lead scoring)
- rez-mind-service (for session tracking)

**Required Environment Variables:**
```bash
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
LEAD_INTELLIGENCE_URL=https://rez-lead-intelligence.onrender.com
REZMIND_URL=https://rez-mind-service.onrender.com
MARKETING_URL=https://rez-marketing-service.onrender.com
```

**Health Check:** `GET /health`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Render Configuration:** `services/rez-abandonment-tracker/render.yaml`

---

### 3. rez-marketing-service

**Purpose:** Marketing automation and campaign management service

**Port:** 4000

**Directory:** `services/rez-marketing-service/`

**Dependencies:**
- MongoDB Atlas
- Redis

**Required Environment Variables:**
```bash
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
INTERNAL_SERVICE_TOKENS_JSON='["token1","token2"]'
MARKETING_SERVICE_URL=https://rez-marketing-service.onrender.com
```

**Optional Environment Variables:**
```bash
# CORS
CORS_ORIGIN=https://rez-app.com,https://admin.rez-app.com

# Razorpay
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Twilio SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# WhatsApp
WHATSAPP_TOKEN=EAA...
WHATSAPP_PHONE_ID=...
WHATSAPP_APP_SECRET=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...

# AWS SES
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_SMTP_USER=...
AWS_SES_SMTP_PASS=...
SES_REGION=us-east-1
EMAIL_FROM=noreply@rez-app.com

# FCM
FCM_SERVER_KEY=...

# AdBazaar
ADBAZAAR_INTERNAL_KEY=...

# Sentry
SENTRY_DSN=https://...@sentry.io/...
```

**Health Check:** `GET /health`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
node dist/index.js
```

**Render Configuration:** `services/rez-marketing-service/render.yaml`

---

### 4. rez-decision-service

**Purpose:** Real-time decision engine for targeting and personalization (Phase 3-5)

**Port:** 4027

**Directory:** `services/rez-decision-service/`

**Dependencies:**
- Redis (managed by Render)

**Required Environment Variables:**
```bash
REDIS_URL=redis://localhost:6379  # Overridden by Render managed Redis
NODE_ENV=production
PORT=4027

# Engine Flags
SAMPLING_ENGINE_ENABLED=true
ATTRIBUTION_ENGINE_ENABLED=true
DYNAMIC_PRICING_ENABLED=true
AUTO_CAMPAIGN_ENABLED=true
SMART_COIN_ALLOCATION_ENABLED=true
AUTO_COIN_DISTRIBUTION_ENABLED=true
MERCHANT_COIN_ANALYTICS_ENABLED=true
DOOH_ANALYTICS_ENABLED=true
```

**Performance Tuning:**
```bash
REDIS_MAX_CONNECTIONS=50
REQUEST_TIMEOUT_MS=30000
```

**Rate Limiting:**
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

**Circuit Breaker:**
```bash
CIRCUIT_BREAKER_ENABLED=true
CIRCUIT_BREAKER_TIMEOUT_MS=5000
```

**Auto-scaling:**
```yaml
autoScaling:
  minInstances: 2
  maxInstances: 10
  targetCPUPercent: 70
  targetMemoryPercent: 80
```

**Health Check:** `GET /health`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
node dist/index.js
```

**Cron Jobs:**
```bash
# Cleanup expired coins - Every 6 hours
0 */6 * * *: node dist/jobs/cleanupExpiredCoins.js

# Aggregate analytics - Every hour
0 */1 * * *: node dist/jobs/aggregateAnalytics.js

# Campaign budget check - Every 15 minutes
*/15 * * * *: node dist/jobs/checkCampaignBudgets.js
```

**Render Configuration:** `services/rez-decision-service/render.yaml`

---

### 5. rez-unified-messaging

**Purpose:** Multi-channel messaging service - WhatsApp, SMS, Push, Email

**Port:** 4025

**Directory:** `services/rez-unified-messaging/`

**Dependencies:**
- MongoDB Atlas
- Redis

**Required Environment Variables:**
```bash
# Configure in Render dashboard
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# WhatsApp
WHATSAPP_TOKEN=EAA...
WHATSAPP_PHONE_ID=...
WHATSAPP_APP_SECRET=...

# AWS SES (Email)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SES_REGION=us-east-1
EMAIL_FROM=noreply@rez-app.com

# FCM (Push)
FCM_SERVER_KEY=...
```

**Health Check:** `GET /health`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
node dist/index.js
```

**Render Configuration:** No `render.yaml` exists. Create from template below.

---

## Service Dependency Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Marketing Platform                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐      ┌─────────────────────┐          │
│  │ Lead            │      │ Abandonment         │          │
│  │ Intelligence   │──────│ Tracker             │          │
│  │ (port 4106)    │      │ (port 4108)         │          │
│  └────────┬────────┘      └──────────┬──────────┘          │
│           │                          │                      │
│           └──────────┬───────────────┘                      │
│                      │                                      │
│                      ▼                                      │
│           ┌─────────────────────┐                          │
│           │ Decision             │                          │
│           │ Service              │                          │
│           │ (port 4027)          │                          │
│           └──────────┬──────────┘                          │
│                      │                                      │
│           ┌──────────┴──────────┐                          │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌─────────────────┐  ┌─────────────────────┐               │
│  │ Marketing       │  │ Unified             │               │
│  │ Service         │  │ Messaging           │               │
│  │ (port 4000)     │  │ (port 4025)         │               │
│  └─────────────────┘  └─────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Steps

### Step 1: Deploy rez-lead-intelligence (1st)

1. Navigate to the service directory:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/packages/marketing-platform/services/rez-lead-intelligence
   ```

2. Set environment variables in Render dashboard or via CLI:
   ```bash
   render blueprint create --vars='{"MONGODB_URI":"...","REDIS_URL":"...","INTERNAL_SERVICE_TOKENS_JSON":"[...]"}'
   ```

3. Verify deployment:
   ```bash
   curl https://rez-lead-intelligence.onrender.com/api/v1/health
   ```

---

### Step 2: Deploy rez-abandonment-tracker (2nd)

1. Navigate to the service directory:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/packages/marketing-platform/services/rez-abandonment-tracker
   ```

2. Set environment variables including LEAD_INTELLIGENCE_URL:
   ```bash
   render blueprint create --vars='{"MONGODB_URI":"...","REDIS_URL":"...","LEAD_INTELLIGENCE_URL":"https://rez-lead-intelligence.onrender.com"}'
   ```

3. Verify deployment:
   ```bash
   curl https://rez-abandonment-tracker.onrender.com/health
   ```

---

### Step 3: Deploy rez-marketing-service (3rd)

1. Navigate to the service directory:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/packages/marketing-platform/services/rez-marketing-service
   ```

2. Set environment variables:
   ```bash
   render blueprint create --vars='{"MONGODB_URI":"...","REDIS_URL":"...","MARKETING_SERVICE_URL":"https://rez-marketing-service.onrender.com"}'
   ```

3. Verify deployment:
   ```bash
   curl https://rez-marketing-service.onrender.com/health
   ```

---

### Step 4: Deploy rez-decision-service (4th)

1. Navigate to the service directory:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/packages/marketing-platform/services/rez-decision-service
   ```

2. Create Redis instance first:
   ```bash
   render redis create --name=rez-redis --region=oregon --plan=starter
   ```

3. Set environment variables:
   ```bash
   render blueprint create --vars='{"LOG_LEVEL":"info","CORS_ORIGINS":"https://rez-app.com,https://admin.rez-app.com"}'
   ```

4. Verify deployment:
   ```bash
   curl https://rez-decision-service.onrender.com/health
   ```

---

### Step 5: Deploy rez-unified-messaging (5th)

1. Navigate to the service directory:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/packages/marketing-platform/services/rez-unified-messaging
   ```

2. Create render.yaml if not exists, then deploy:
   ```bash
   render blueprint create
   ```

3. Verify deployment:
   ```bash
   curl https://rez-unified-messaging.onrender.com/health
   ```

---

## Verification Checklist

After deploying all services, verify:

- [ ] rez-lead-intelligence responds to `/api/v1/health`
- [ ] rez-abandonment-tracker responds to `/health`
- [ ] rez-marketing-service responds to `/health`
- [ ] rez-decision-service responds to `/health`
- [ ] rez-unified-messaging responds to `/health`
- [ ] Internal service URLs are correctly configured
- [ ] Redis connections are established
- [ ] MongoDB connections are established
- [ ] All scheduled cron jobs are running (if applicable)

---

## Rollback Procedure

If a deployment fails:

1. **Identify the failing service** - Check logs in Render dashboard
2. **Rollback to previous deployment:**
   ```bash
   render deploys list --service=<service-name>
   render deploys rollback <deploy-id> --service=<service-name>
   ```
3. **Verify dependent services** are still functioning
4. **Fix and redeploy** the failing service

---

## render.yaml Issues Found

### Monorepo-level render.yaml

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/packages/marketing-platform/render.yaml`

**Issues:**
- Port mismatch with individual service render.yaml files
- References separate GitHub repos instead of monorepo structure
- Individual service configs are more accurate

**Recommendation:** Use individual service `render.yaml` files instead of the monorepo-level file.

### rez-lead-intelligence

**File:** `services/rez-lead-intelligence/render.yaml`

**Issue:** Port set to `4010` but should be `4106` per deployment specification.

### rez-unified-messaging

**File:** No `render.yaml` exists

**Issue:** Missing render.yaml configuration file. Must be created before deployment.

---

## Quick Deploy Commands

```bash
# 1. Lead Intelligence
cd services/rez-lead-intelligence && npm run build

# 2. Abandonment Tracker
cd services/rez-abandonment-tracker && npm run build

# 3. Marketing Service
cd services/rez-marketing-service && npm run build

# 4. Decision Service
cd services/rez-decision-service && npm run build

# 5. Unified Messaging
cd services/rez-unified-messaging && npm run build
```

---

## Last Updated

2026-05-04
