# DEPLOY MISSING SERVICES

**Date:** 2026-05-02

---

## SERVICES TO DEPLOY

| Service | render.yaml | Status |
|---------|-------------|--------|
| REZ-merchant-copilot | ✅ | Ready |
| rez-search-service | ✅ | Ready |
| REZ-action-engine | ✅ | Ready |

---

## QUICK DEPLOY (Run each in separate terminal)

### 1. Deploy REZ-merchant-copilot

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-merchant-copilot
render deploy --service=REZ-merchant-copilot --yes
```

### 2. Deploy rez-search-service

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-search-service
render deploy --service=rez-search-service --yes
```

### 3. Deploy REZ-action-engine

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-action-engine
render deploy --service=REZ-action-engine --yes
```

---

## OR MANUAL DEPLOY

### 1. Go to Render Dashboard
```
https://dashboard.render.com
```

### 2. New → Web Service

### 3. Connect GitHub repo:
- REZ-merchant-copilot
- rez-search-service
- REZ-action-engine

### 4. Settings:
```
Branch: main
Root Directory: (leave blank)
Build Command: (from render.yaml)
Start Command: (from render.yaml)
```

---

## ENVIRONMENT VARIABLES TO ADD

### REZ-merchant-copilot
```env
MONGODB_URI=mongodb+srv://xxx
PORT=4022
NODE_ENV=production
```

### rez-search-service
```env
MONGODB_URI=mongodb+srv://xxx
PORT=4003
NODE_ENV=production
```

### REZ-action-engine
```env
MONGODB_URI=mongodb+srv://xxx
PORT=4009
NODE_ENV=production
EVENT_PLATFORM_URL=https://REZ-event-platform.onrender.com
```

---

## AFTER DEPLOYMENT

### 1. Update URLs in other services:

```env
# In REZ-support-copilot
REZ_MERCHANT_COPILOT_URL=https://REZ-merchant-copilot.onrender.com
REZ_SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
REZ_ACTION_ENGINE_URL=https://REZ-action-engine.onrender.com
```

### 2. Test endpoints:

```bash
curl https://REZ-merchant-copilot.onrender.com/health
curl https://rez-search-service.onrender.com/health
curl https://REZ-action-engine.onrender.com/health
```

---

## VERIFY DEPLOYMENT

After each deploy, check:
```bash
curl https://<service-url>.onrender.com/health
```

Expected response:
```json
{"status":"ok","service":"name"}
```

---

## SERVICE URLS AFTER DEPLOYMENT

```
REZ-support-copilot:        https://REZ-support-copilot.onrender.com
REZ-merchant-copilot:      https://REZ-merchant-copilot.onrender.com
REZ-event-platform:        https://REZ-event-platform.onrender.com
REZ-user-intelligence:      https://REZ-user-intelligence.onrender.com
REZ-knowledge-base:         https://rez-knowledge-base.onrender.com
rez-search-service:        https://rez-search-service.onrender.com
REZ-action-engine:         https://REZ-action-engine.onrender.com
```

---

## NEXT STEPS

After all deployed:
1. Add OPENAI_API_KEY to REZ-support-copilot
2. Test chat endpoint
3. Test order flow
4. Connect consumer app
