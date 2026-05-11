# REZ Mind - Deployment Dashboard

**Version:** 1.0.0
**Date:** 2026-05-02
**Status:** READY TO DEPLOY

---

## DEPLOY ALL SERVICES IN ORDER

### TIER 1 - CRITICAL (Deploy First)

| # | Service | GitHub | render.yaml | Port | Start Command |
|---|---------|--------|-------------|------|--------------|
| 1 | **Event Platform** | [Link](https://github.com/imrejaul007/REZ-event-platform) | ✅ | 4008 | `npx ts-node src/index-simple.ts` |
| 2 | **Action Engine** | [Link](https://github.com/imrejaul007/REZ-action-engine) | ✅ | 4009 | `npx ts-node src/index-adaptive.ts` |
| 3 | **Feedback Service** | [Link](https://github.com/imrejaul007/REZ-feedback-service) | ✅ | 4010 | `npm run start` |

### TIER 2 - INTELLIGENCE

| # | Service | GitHub | render.yaml | Port | Start Command |
|---|---------|--------|-------------|------|--------------|
| 4 | **User Intelligence** | [Link](https://github.com/imrejaul007/REZ-user-intelligence-service) | ✅ | 3004 | `node dist/index.js` |
| 5 | **Merchant Intelligence** | [Link](https://github.com/imrejaul007/REZ-merchant-intelligence-service) | ✅ | 4012 | `node dist/index.js` |
| 6 | **Intent Predictor** | [Link](https://github.com/imrejaul007/REZ-intent-predictor) | ✅ | 4018 | `node src/index.js` |
| 7 | **Intelligence Hub** | [Link](https://github.com/imrejaul007/REZ-intelligence-hub) | ✅ | 4020 | `node dist/index.js` |

### TIER 3 - DELIVERY

| # | Service | GitHub | render.yaml | Port | Start Command |
|---|---------|--------|-------------|------|--------------|
| 8 | **Targeting Engine** | [Link](https://github.com/imrejaul007/REZ-targeting-engine) | ✅ | 3003 | `node dist/index.js` |
| 9 | **Recommendation Engine** | [Link](https://github.com/imrejaul007/REZ-recommendation-engine) | ✅ | 3001 | `node src/index.js` |
| 10 | **Personalization Engine** | [Link](https://github.com/imrejaul007/REZ-personalization-engine) | ✅ | 4017 | `node src/server.js` |
| 11 | **Push Service** | [Link](https://github.com/imrejaul007/REZ-push-service) | ✅ | 4013 | `node src/index.js` |

### TIER 4 - DASHBOARDS

| # | Service | GitHub | render.yaml | Port | Start Command |
|---|---------|--------|-------------|------|--------------|
| 12 | **Merchant Copilot** | [Link](https://github.com/imrejaul007/REZ-merchant-copilot) | ✅ | 4022 | `npm start` |
| 13 | **Consumer Copilot** | [Link](https://github.com/imrejaul007/REZ-consumer-copilot) | ✅ | 4021 | `npm start` |
| 14 | **AdBazaar** | [Link](https://github.com/imrejaul007/REZ-adbazaar) | ✅ | 4025 | `node src/index.js` |
| 15 | **Feature Flags** | [Link](https://github.com/imrejaul007/REZ-feature-flags) | ✅ | 4030 | `node src/index.cjs` |
| 16 | **Observability** | [Link](https://github.com/imrejaul007/REZ-observability) | ✅ | 4031 | `node dist/index.js` |

---

## DEPLOY STEPS

### Step 1: Deploy Event Platform (CRITICAL)

1. Go to: https://dashboard.render.com
2. Click: **New** → **Web Service**
3. Connect GitHub: https://github.com/imrejaul007/REZ-event-platform
4. Settings:
   - Name: `rez-event-platform`
   - Region: Singapore
   - Build: `npm install`
   - Start: `npx ts-node src/index-simple.ts`
5. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-events
   NODE_ENV=production
   PORT=4008
   ```
6. Click **Create Web Service**

### Step 2: Deploy Action Engine

1. Connect GitHub: https://github.com/imrejaul007/REZ-action-engine
2. Name: `rez-action-engine`
3. Start: `npx ts-node src/index-adaptive.ts`
4. Env vars:
   ```
   MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-actions
   FEEDBACK_SERVICE_URL=https://rez-feedback-service.onrender.com
   EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
   ```

### Step 3: Deploy Feedback Service

1. Connect GitHub: https://github.com/imrejaul007/REZ-feedback-service
2. Name: `rez-feedback-service`
3. Build: `npm install && npm run build`
4. Start: `node dist/index-learning.js`
5. Env vars:
   ```
   MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-feedback
   EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
   ```

### Step 4-16: Deploy Remaining Services

For each remaining service:
1. Connect GitHub repo
2. Use the settings from the table above
3. Add `MONGODB_URI` env var
4. Add service-specific env vars as needed

---

## AFTER DEPLOYMENT

### Update App Environment Variables

After Event Platform is live, update each app:

```bash
# Backend services
REZ_MIND_URL=https://rez-event-platform.onrender.com

# Frontend (Expo)
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com

# Frontend (Next.js)
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### Test Health Checks

```bash
curl https://rez-event-platform.onrender.com/health
curl https://rez-action-engine.onrender.com/health
curl https://rez-feedback-service.onrender.com/health
```

### Test Event Flow

```bash
# Send test order event
curl -X POST https://rez-event-platform.onrender.com/webhook/merchant/order \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "test_merchant",
    "order_id": "test_order_123",
    "customer_id": "test_customer",
    "items": [{"item_id": "biryani", "quantity": 2, "price": 250}],
    "total_amount": 500
  }'
```

---

## DEPLOYMENT CHECKLIST

```
[ ] Deploy Event Platform (CRITICAL)
[ ] Deploy Action Engine
[ ] Deploy Feedback Service
[ ] Deploy User Intelligence
[ ] Deploy Merchant Intelligence
[ ] Deploy Intent Predictor
[ ] Deploy Intelligence Hub
[ ] Deploy Targeting Engine
[ ] Deploy Recommendation Engine
[ ] Deploy Personalization Engine
[ ] Deploy Push Service
[ ] Deploy Merchant Copilot
[ ] Deploy Consumer Copilot
[ ] Deploy AdBazaar
[ ] Deploy Feature Flags
[ ] Deploy Observability

[ ] Update REZ_MIND_URL in all apps
[ ] Test health checks
[ ] Test event flow
```

---

## DASHBOARD URLS (After Deploy)

| Service | URL |
|---------|-----|
| Merchant Copilot | https://rez-merchant-copilot.onrender.com |
| Consumer Copilot | https://rez-consumer-copilot.onrender.com |
| AdBazaar | https://rez-adbazaar.onrender.com |

---

Last updated: 2026-05-02
