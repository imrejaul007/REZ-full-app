# REZ MIND - DEPLOYMENT GUIDE

**Date:** May 8, 2026
**Status:** READY TO DEPLOY

---

## CURRENT STATUS

| Service | Status | Action Needed |
|---------|--------|---------------|
| Intent Graph | SUSPENDED | Redeploy |
| Intelligence Hub | SUSPENDED | Redeploy |
| Personalization | 404 | Deploy |
| Recommendation | 404 | Deploy |
| Targeting | 404 | Deploy |
| Action Engine | SUSPENDED | Redeploy |

---

## DEPLOYMENT STEPS

### Step 1: Deploy Intelligence Hub (Most Important)

**Repository:** `rez-intelligence-hub`
**Port:** 4020
**URL:** https://rez-intelligence-hub.onrender.com

**Render Settings:**
```
Build Command: npm run build
Start Command: npm start
Environment: Node
Port: 4020
```

**Environment Variables:**
```
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez_intelligence
```

**Deploy:**
```bash
cd rez-intelligence-hub
npm install
npm run build
# Then deploy to Render via dashboard or CLI
```

---

### Step 2: Deploy Action Engine

**Repository:** `rez-action-engine`
**Port:** 3014
**URL:** https://rez-action-engine.onrender.com

**Render Settings:**
```
Build Command: npm run build
Start Command: npm start
Environment: Node
Port: 3014
```

**Environment Variables:**
```
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez_action_engine
REDIS_HOST=redis
REDIS_PORT=6379
```

---

### Step 3: Deploy Backend (with REZ Mind)

**Repository:** `rez-backend-master`
**Port:** 3000
**URL:** https://rez-backend.onrender.com

**Render Settings:**
```
Build Command: npm run build
Start Command: npm start
Environment: Node
Port:** 3000
```

**Environment Variables:**
```
INTELLIGENCE_HUB_URL=https://rez-intelligence-hub.onrender.com
INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com
```

---

## VERIFY DEPLOYMENT

After deploying, verify each service:

```bash
# Intelligence Hub
curl https://rez-intelligence-hub.onrender.com/health
curl https://rez-intelligence-hub.onrender.com/api/dashboard/stats

# Action Engine
curl https://rez-action-engine.onrender.com/health

# Backend
curl https://rez-backend.onrender.com/api/stores/feed?userId=test
```

---

## DEPLOYMENT COMMANDS

### Via Render Dashboard

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure settings (see above)
5. Click "Create Web Service"

### Via Render CLI

```bash
# Install Render CLI
npm install -g @render/ref

# Login
render login

# Deploy Intelligence Hub
cd rez-intelligence-hub
render deploy --service-id=<service-id>

# Deploy Action Engine
cd rez-action-engine
render deploy --service-id=<service-id>
```

---

## TEST AFTER DEPLOYMENT

### 1. Test Intelligence Hub

```bash
# Health check
curl https://rez-intelligence-hub.onrender.com/health

# Should return:
# {"status":"healthy","service":"rez-intelligence-hub",...}
```

### 2. Test Dashboard

```bash
# Stats
curl https://rez-intelligence-hub.onrender.com/api/dashboard/stats

# Segments
curl https://rez-intelligence-hub.onrender.com/api/dashboard/segments

# Health
curl https://rez-intelligence-hub.onrender.com/api/dashboard/health
```

### 3. Test User Profile

```bash
# Replace USER_ID with actual user ID
curl https://rez-intelligence-hub.onrender.com/api/intelligence/user/USER_ID/profile
```

### 4. Test Store Feed (Backend)

```bash
# Test with a user
curl "https://rez-backend.onrender.com/api/stores/feed?userId=test&lat=26.85&lng=80.95"

# Check logs for "REZ Mind" entries
```

---

## ML TRAINING

After deploying, run ML training:

```bash
cd rez-ml-engine

# Generate training data
npx tsx scripts/generateTrainingData.ts

# Train models
npx tsx scripts/trainModels.ts
```

Models will be saved to `rez-ml-engine/models/`

---

## DORMANCY DETECTION CRON

Set up daily cron job:

```bash
# Add to crontab
crontab -e

# Add line:
0 6 * * * cd /path/to/rez-intelligence-hub && npx tsx src/jobs/dormancyDetection.ts >> /var/log/dormancy.log 2>&1
```

---

## QUICK START (All Services)

```bash
# 1. Clone/Update repositories
git clone https://github.com/imrejaul007/REZ-intelligence-platform rez-intent-graph
git clone https://github.com/imrejaul007/rez-intelligence-hub
git clone https://github.com/imrejaul007/rez-action-engine

# 2. Deploy Intelligence Hub
cd rez-intelligence-hub
npm install && npm run build
# Deploy to Render

# 3. Deploy Action Engine
cd rez-action-engine
npm install && npm run build
# Deploy to Render

# 4. Verify
./test-rez-mind.sh
```

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| 503 Service Suspended | Redeploy from Render dashboard |
| 404 Not Found | Service not deployed - deploy it |
| MongoDB Connection Failed | Check MONGODB_URI environment variable |
| Redis Connection Failed | Check REDIS_* environment variables |
| No Data | Run generateTrainingData.ts first |

---

## CHECKLIST

- [ ] Deploy Intelligence Hub (4020)
- [ ] Deploy Action Engine (3014)
- [ ] Update Backend with REZ Mind
- [ ] Verify /health endpoints
- [ ] Test /api/dashboard/stats
- [ ] Test /api/intelligence/user/:id/profile
- [ ] Run ML training
- [ ] Set up dormancy cron job
- [ ] Test store feed personalization

---

*Ready to Deploy - May 8, 2026*
