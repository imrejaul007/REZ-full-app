# REZ Platform — Complete Deployment Guide

**Version:** 2.0.0
**Date:** 2026-05-02

---

## 🚀 QUICK START

### Deploy in 3 Steps

```
1. Deploy Event Platform (CRITICAL)
2. Deploy Action Engine + Feedback Service
3. Deploy remaining 13 services
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

```
[ ] Render account at https://dashboard.render.com
[ ] GitHub access to all repos
[ ] MongoDB Atlas cluster ready
[ ] Redis instance ready
[ ] Domain configured (optional)
```

---

## PHASE 1: DEPLOY REZ MIND (Priority)

### 1.1 Event Platform (CRITICAL - Deploy First)

**GitHub:** https://github.com/imrejaul007/REZ-event-platform

**Render Settings:**
```
Name: rez-event-platform
Region: Singapore
Build: npm install
Start: npx ts-node src/index-simple.ts
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=4008
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-events
REDIS_HOST=redis-12345.redns.redisdb.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

**Test:**
```bash
curl https://rez-event-platform.onrender.com/health
```

---

### 1.2 Action Engine

**GitHub:** https://github.com/imrejaul007/REZ-action-engine

**Render Settings:**
```
Name: rez-action-engine
Region: Singapore
Build: npm install
Start: npx ts-node src/index-adaptive.ts
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=4009
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-actions
REDIS_HOST=redis-12345.redns.redisdb.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
FEEDBACK_SERVICE_URL=https://rez-feedback-service.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 1.3 Feedback Service

**GitHub:** https://github.com/imrejaul007/REZ-feedback-service

**Render Settings:**
```
Name: rez-feedback-service
Region: Singapore
Build: npm install && npm run build
Start: node dist/index-learning.js
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=4010
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-feedback
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

## PHASE 2: DEPLOY INTELLIGENCE SERVICES

### 2.1 User Intelligence Service

**GitHub:** https://github.com/imrejaul007/REZ-user-intelligence-service

**Render Settings:**
```
Name: rez-user-intelligence
Region: Singapore
Build: npm install && npm run build
Start: node dist/index.js
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=3004
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-user-intel
REDIS_HOST=redis-12345.redns.redisdb.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 2.2 Merchant Intelligence Service

**GitHub:** https://github.com/imrejaul007/REZ-merchant-intelligence-service

**Render Settings:**
```
Name: rez-merchant-intelligence
Region: Singapore
Build: npm install && npm run build
Start: node dist/index.js
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=4012
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-merchant-intel
REDIS_HOST=redis-12345.redns.redisdb.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 2.3 Intent Predictor

**GitHub:** https://github.com/imrejaul007/REZ-intent-predictor

**Render Settings:**
```
Name: rez-intent-predictor
Region: Singapore
Build: npm install
Start: node src/index.js
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=4018
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-intent-predictor
```

---

### 2.4 Intelligence Hub

**GitHub:** https://github.com/imrejaul007/REZ-intelligence-hub

**Render Settings:**
```
Name: rez-intelligence-hub
Region: Singapore
Build: npm install && npm run build
Start: node dist/index.js
Health Check: /health
```

**Environment Variables:**
```bash
NODE_ENV=production
PORT=4020
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-intelligence-hub
```

---

## PHASE 3: DEPLOY DELIVERY SERVICES

### 3.1 Targeting Engine
**GitHub:** https://github.com/imrejaul007/REZ-targeting-engine
**Port:** 3003 | **Start:** `node dist/index.js`

### 3.2 Recommendation Engine
**GitHub:** https://github.com/imrejaul007/REZ-recommendation-engine
**Port:** 3001 | **Start:** `node src/index.js`

### 3.3 Personalization Engine
**GitHub:** https://github.com/imrejaul007/REZ-personalization-engine
**Port:** 4017 | **Start:** `node src/server.js`

### 3.4 Push Service
**GitHub:** https://github.com/imrejaul007/REZ-push-service
**Port:** 4013 | **Start:** `node src/index.js`

---

## PHASE 4: DEPLOY DASHBOARD SERVICES

### 4.1 Merchant Copilot
**GitHub:** https://github.com/imrejaul007/REZ-merchant-copilot
**Port:** 4022 | **Start:** `npm start`

### 4.2 Consumer Copilot
**GitHub:** https://github.com/imrejaul007/REZ-consumer-copilot
**Port:** 4021 | **Start:** `npm start`

### 4.3 AdBazaar
**GitHub:** https://github.com/imrejaul007/REZ-adbazaar
**Port:** 4025 | **Start:** `node src/index.js`

### 4.4 Feature Flags
**GitHub:** https://github.com/imrejaul007/REZ-feature-flags
**Port:** 4030 | **Start:** `node src/index.cjs`

### 4.5 Observability
**GitHub:** https://github.com/imrejaul007/REZ-observability
**Port:** 4031 | **Start:** `node dist/index.js`

---

## PHASE 5: UPDATE APP ENV VARS

After Event Platform is deployed, update each app:

### Backend Services
```bash
REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### Frontend (Expo - rez-app-consumer)
```bash
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### Frontend (Next.js - rez-now)
```bash
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

---

## PHASE 6: TESTING

### Health Checks
```bash
curl https://rez-event-platform.onrender.com/health
curl https://rez-action-engine.onrender.com/health
curl https://rez-feedback-service.onrender.com/health
```

### Send Test Event
```bash
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

## 📊 SERVICE URLs (After Deploy)

| Service | URL | Port |
|---------|-----|------|
| Event Platform | https://rez-event-platform.onrender.com | 4008 |
| Action Engine | https://rez-action-engine.onrender.com | 4009 |
| Feedback Service | https://rez-feedback-service.onrender.com | 4010 |
| User Intelligence | https://rez-user-intelligence.onrender.com | 3004 |
| Merchant Intelligence | https://rez-merchant-intelligence.onrender.com | 4012 |
| Intent Predictor | https://rez-intent-predictor.onrender.com | 4018 |
| Intelligence Hub | https://rez-intelligence-hub.onrender.com | 4020 |
| Targeting Engine | https://rez-targeting-engine.onrender.com | 3003 |
| Recommendation Engine | https://rez-recommendation-engine.onrender.com | 3001 |
| Personalization Engine | https://rez-personalization-engine.onrender.com | 4017 |
| Push Service | https://rez-push-service.onrender.com | 4013 |
| Merchant Copilot | https://rez-merchant-copilot.onrender.com | 4022 |
| Consumer Copilot | https://rez-consumer-copilot.onrender.com | 4021 |
| AdBazaar | https://rez-adbazaar.onrender.com | 4025 |
| Feature Flags | https://rez-feature-flags.onrender.com | 4030 |
| Observability | https://rez-observability.onrender.com | 4031 |

---

## 🔧 TROUBLESHOOTING

### Service won't start
1. Check logs in Render dashboard
2. Verify MONGODB_URI is correct
3. Check if port is available

### Health check failing
1. Check if service is listening on correct port
2. Verify /health endpoint exists
3. Check environment variables

### Event not processing
1. Check Event Platform is running
2. Verify webhook URL is correct
3. Check logs for validation errors

---

## 📞 SUPPORT

1. Check Render logs
2. Verify environment variables
3. Test locally first
4. Check SOURCE-OF-TRUTH/REPOS.md for repo links

---

## ✅ DEPLOYMENT CHECKLIST

```
[ ] Event Platform deployed
[ ] Action Engine deployed
[ ] Feedback Service deployed
[ ] User Intelligence deployed
[ ] Merchant Intelligence deployed
[ ] Intent Predictor deployed
[ ] Intelligence Hub deployed
[ ] Targeting Engine deployed
[ ] Recommendation Engine deployed
[ ] Personalization Engine deployed
[ ] Push Service deployed
[ ] Merchant Copilot deployed
[ ] Consumer Copilot deployed
[ ] AdBazaar deployed
[ ] Feature Flags deployed
[ ] Observability deployed
[ ] REZ_MIND_URL updated in apps
[ ] Health checks passing
[ ] Test event successful
```

---

**Last Updated:** 2026-05-02
