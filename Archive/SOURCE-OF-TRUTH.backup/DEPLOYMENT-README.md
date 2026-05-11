# REZ Mind - Complete Deployment Guide

**Version:** 1.0.0
**Date:** 2026-05-02
**Status:** READY TO DEPLOY
**Assigned to:** Development Team

---

## OVERVIEW

All REZ Mind services are built and code is pushed to GitHub. This guide covers everything needed to deploy and connect the system.

---

## PART 1: SERVICES TO DEPLOY

### Core REZ Mind Services

| Service | Repo | Port | Purpose |
|---------|------|------|---------|
| Event Platform | REZ-event-platform | 4008 | Event ingestion hub |
| Action Engine | REZ-action-engine | 4009 | Decision engine |
| Feedback Service | REZ-feedback-service | 4010 | Learning loop |
| User Intelligence | REZ-user-intelligence-service | 3004 | User profiles |
| Merchant Intelligence | REZ-merchant-intelligence-service | 4012 | Merchant profiles |
| Intent Predictor | REZ-intent-predictor | 4018 | Intent prediction |
| Intelligence Hub | REZ-intelligence-hub | 4020 | Unified profiles |
| Targeting Engine | REZ-targeting-engine | 3003 | Campaign targeting |
| Recommendation Engine | REZ-recommendation-engine | 3001 | Product recommendations |
| Personalization Engine | REZ-personalization-engine | 4017 | Content ranking |
| Push Service | REZ-push-service | 4013 | Notifications |
| Merchant Copilot | REZ-merchant-copilot | 4022 | Merchant dashboard |
| Consumer Copilot | REZ-consumer-copilot | 4021 | Consumer dashboard |
| AdBazaar | REZ-adbazaar | 4025 | Intent-based ads |
| Feature Flags | REZ-feature-flags | 4030 | Feature toggles |
| Observability | REZ-observability | 4031 | Logs & traces |

### Already Integrated Apps (Code Ready)

| App | Repo | Status | Events |
|-----|------|--------|--------|
| rez-order-service | rez-order-service | ✅ Code Ready | Orders |
| rez-search-service | rez-search-service | ✅ Code Ready | Searches |
| rez-app-consumer | rez-app-consumer | ✅ Code Ready | Orders, searches, views |
| rez-app-merchant | rez-app-marchant | ✅ Code Ready | Orders, inventory, payments |
| rez-now | rez-now | ✅ Code Ready | Orders, scans, searches |

### Apps Still Need Integration

| App | Repo | Status | Priority |
|-----|------|--------|----------|
| rez-payment-service | rez-payment-service | 🔄 Code Needed | Medium |
| rez-web-menu | rez-web-menu | 🔄 Code Needed | Medium |
| rendez | Rendez | 🔄 Code Needed | Low |
| rez-restopapa | rez-restopapa | 🔄 Code Needed | Low |
| rez-pms-app | rez-pms-app | 🔄 Code Needed | Low |

---

## PART 2: DEPLOYMENT STEPS

### Step 1: Deploy Event Platform (CRITICAL - Deploy First)

The Event Platform is the hub. Deploy this first.

```bash
# Clone
git clone https://github.com/imrejaul007/REZ-event-platform.git
cd REZ-event-platform

# Install
npm install

# Deploy to Render
# 1. Go to https://dashboard.render.com
# 2. New > Web Service
# 3. Connect GitHub repo
# 4. Settings:
#    - Name: rez-event-platform
#    - Region: Singapore
#    - Branch: main
#    - Build Command: npm install
#    - Start Command: npx ts-node src/index-simple.ts

# Environment Variables:
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-events
ACTION_ENGINE_URL=https://rez-action-engine.onrender.com
```

### Step 2: Deploy Action Engine

```bash
git clone https://github.com/imrejaul007/REZ-action-engine.git
cd REZ-action-engine

# Deploy to Render with:
#    - Name: rez-action-engine
#    - Start Command: npx ts-node src/index-adaptive.ts

# Environment Variables:
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-actions
FEEDBACK_SERVICE_URL=https://rez-feedback-service.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

### Step 3: Deploy Feedback Service

```bash
git clone https://github.com/imrejaul007/REZ-feedback-service.git
cd REZ-feedback-service

# Deploy to Render with:
#    - Name: rez-feedback-service
#    - Build Command: npm install && npm run build
#    - Start Command: node dist/index-learning.js

# Environment Variables:
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-feedback
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

### Step 4: Deploy Intelligence Services

```bash
# User Intelligence
git clone https://github.com/imrejaul007/REZ-user-intelligence-service.git
cd REZ-user-intelligence-service
# Deploy: Name: rez-user-intelligence, Port: 3004

# Merchant Intelligence
git clone https://github.com/imrejaul007/REZ-merchant-intelligence-service.git
cd REZ-merchant-intelligence-service
# Deploy: Name: rez-merchant-intelligence, Port: 4012

# Intent Predictor
git clone https://github.com/imrejaul007/REZ-intent-predictor.git
cd REZ-intent-predictor
# Deploy: Name: rez-intent-predictor, Port: 4018

# Intelligence Hub
git clone https://github.com/imrejaul007/REZ-intelligence-hub.git
cd REZ-intelligence-hub
# Deploy: Name: rez-intelligence-hub, Port: 4020
```

### Step 5: Deploy Targeting & Recommendations

```bash
# Targeting Engine
git clone https://github.com/imrejaul007/REZ-targeting-engine.git
cd REZ-targeting-engine
# Deploy: Name: rez-targeting-engine, Port: 3003

# Recommendation Engine
git clone https://github.com/imrejaul007/REZ-recommendation-engine.git
cd REZ-recommendation-engine
# Deploy: Name: rez-recommendation-engine, Port: 3001

# Personalization Engine
git clone https://github.com/imrejaul007/REZ-personalization-engine.git
cd REZ-personalization-engine
# Deploy: Name: rez-personalization-engine, Port: 4017

# Push Service
git clone https://github.com/imrejaul007/REZ-push-service.git
cd REZ-push-service
# Deploy: Name: rez-push-service, Port: 4013
```

### Step 6: Deploy Copilots & Dashboard

```bash
# Merchant Copilot
git clone https://github.com/imrejaul007/REZ-merchant-copilot.git
cd REZ-merchant-copilot
# Deploy: Name: rez-merchant-copilot, Port: 4022
# Dashboard URL: https://rez-merchant-copilot.onrender.com/dashboard

# Consumer Copilot
git clone https://github.com/imrejaul007/REZ-consumer-copilot.git
cd REZ-consumer-copilot
# Deploy: Name: rez-consumer-copilot, Port: 4021
# Dashboard URL: https://rez-consumer-copilot.onrender.com/dashboard

# AdBazaar
git clone https://github.com/imrejaul007/REZ-adbazaar.git
cd REZ-adbazaar
# Deploy: Name: rez-adbazaar, Port: 4025
# Dashboard URL: https://rez-adbazaar.onrender.com/dashboard
```

### Step 7: Deploy Safety Services

```bash
# Feature Flags
git clone https://github.com/imrejaul007/REZ-feature-flags.git
cd REZ-feature-flags
# Deploy: Name: rez-feature-flags, Port: 4030

# Observability
git clone https://github.com/imrejaul007/REZ-observability.git
cd REZ-observability
# Deploy: Name: rez-observability, Port: 4031
```

---

## PART 3: UPDATE APP ENV VARS

After Event Platform is deployed, update each app's environment variables:

### rez-order-service

```bash
# Add to .env
REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### rez-search-service

```bash
# Add to .env
REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### rez-app-consumer (Expo)

```bash
# Add to app.json or via EAS secrets
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### rez-app-merchant (Expo)

```bash
# Add to app.json or via EAS secrets
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### rez-now (Next.js)

```bash
# Add to .env.local
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

---

## PART 4: INTEGRATE REMAINING APPS

### rez-payment-service

Add to `src/routes/payment.ts`:

```typescript
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

// On payment success:
await fetch(`${REZ_MIND_URL}/webhook/merchant/payment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchant_id: payment.merchantId,
    transaction_id: payment.transactionId,
    amount: payment.amount,
    source: 'rez-payment-service'
  })
});
```

### rez-web-menu

Add to appropriate service files:

```typescript
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

await fetch(`${REZ_MIND_URL}/webhook/consumer/order`, {
  method: 'POST',
  body: JSON.stringify({ user_id, order_id, items, total_amount, source: 'rez-web-menu' })
});
```

---

## PART 5: VERIFICATION

### Test Event Flow

```bash
# 1. Check Event Platform is running
curl https://rez-event-platform.onrender.com/health

# 2. Send test order event
curl -X POST https://rez-event-platform.onrender.com/webhook/merchant/order \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "test_merchant",
    "order_id": "test_order_123",
    "customer_id": "test_customer",
    "items": [{"item_id": "biryani", "quantity": 2, "price": 250}],
    "total_amount": 500,
    "source": "test"
  }'

# 3. Check user intelligence
curl https://rez-user-intelligence.onrender.com/user/test_customer/profile

# 4. Check targeting
curl -X POST https://rez-targeting-engine.onrender.com/target \
  -d '{"user_id":"test_customer"}'
```

---

## PART 6: MONITORING

### Health Checks

| Service | URL |
|---------|-----|
| Event Platform | https://rez-event-platform.onrender.com/health |
| Action Engine | https://rez-action-engine.onrender.com/health |
| Feedback Service | https://rez-feedback-service.onrender.com/health |
| User Intelligence | https://rez-user-intelligence.onrender.com/health |
| Merchant Intelligence | https://rez-merchant-intelligence.onrender.com/health |

### Dashboards

| Dashboard | URL |
|-----------|-----|
| Merchant Copilot | https://rez-merchant-copilot.onrender.com/dashboard |
| Consumer Copilot | https://rez-consumer-copilot.onrender.com/dashboard |
| AdBazaar | https://rez-adbazaar.onrender.com/dashboard |

### Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| learning_enabled | OFF | ML learning |
| adaptive_enabled | OFF | Adaptive decisions |
| personalization_enabled | ON | Personalization |
| recommendations_enabled | ON | Product recommendations |
| ads_enabled | OFF | Targeted ads |

---

## PART 7: QUICK START CHECKLIST

```
DEPLOYMENT CHECKLIST:
=====================

[ ] 1. Deploy Event Platform (CRITICAL)
[ ] 2. Deploy Action Engine
[ ] 3. Deploy Feedback Service
[ ] 4. Deploy User Intelligence
[ ] 5. Deploy Merchant Intelligence
[ ] 6. Deploy Intent Predictor
[ ] 7. Deploy Intelligence Hub
[ ] 8. Deploy Targeting Engine
[ ] 9. Deploy Recommendation Engine
[ ] 10. Deploy Personalization Engine
[ ] 11. Deploy Push Service
[ ] 12. Deploy Merchant Copilot
[ ] 13. Deploy Consumer Copilot
[ ] 14. Deploy AdBazaar
[ ] 15. Deploy Feature Flags
[ ] 16. Deploy Observability

UPDATE ENV VARS:
================
[ ] 17. Update rez-order-service REZ_MIND_URL
[ ] 18. Update rez-search-service REZ_MIND_URL
[ ] 19. Update rez-app-consumer EXPO_PUBLIC_REZ_MIND_URL
[ ] 20. Update rez-app-merchant EXPO_PUBLIC_REZ_MIND_URL
[ ] 21. Update rez-now NEXT_PUBLIC_REZ_MIND_URL

TEST:
=====
[ ] 22. Verify Event Platform health
[ ] 23. Send test event
[ ] 24. Check User Intelligence updated
[ ] 25. Verify dashboards accessible
```

---

## TROUBLESHOOTING

### Event Platform Not Receiving Events

1. Check Event Platform logs
2. Verify MONGODB_URI is correct
3. Check network/firewall rules

### Events Not Processing

1. Check Action Engine is running
2. Verify FEEDBACK_SERVICE_URL is set
3. Check MongoDB connection

### Intelligence Not Updating

1. Verify Event Platform received event
2. Check Action Engine processed event
3. Review Feedback Service logs

### Feature Flags Not Working

1. Deploy Feature Flags service first
2. Verify Redis connection
3. Check flag name matches exactly

---

## CONTACT

For questions or issues:
- Check SOURCE-OF-TRUTH/REZ-MIND.md for architecture
- Check SOURCE-OF-TRUTH/REZ-MIND-DATABASE.md for schema
- Check SOURCE-OF-TRUTH/REZ-MIND-AUDIT-PLAN.md for integration details

---

Last updated: 2026-05-02
