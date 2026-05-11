# Quick Start Guide

## 5-Minute Setup

### 1. Start Infrastructure
```bash
docker run -d --name rez-redis -p 6379:6379 redis:7-alpine
docker run -d --name rez-mongo -p 27017:27017 mongo:7
```

### 2. Install Services
```bash
for dir in rez-intent-service rez-copilot rez-decision-service rez-ad-platform; do
  cd $dir && npm install && cd ..
done
```

### 3. Start Services
```bash
cd rez-intent-service && npm run dev &
cd rez-copilot && npm run dev &
cd rez-decision-service && npm run dev &
cd rez-ad-platform && npm run dev &
```

### 4. Verify
```bash
./scripts/health-all.sh
```

## Test Your First API Call

```bash
# Capture intent signal
curl -X POST http://localhost:4009/api/signals/capture \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","appType":"restaurant","eventType":"search","category":"DINING","intentKey":"pizza"}'

# Chat with copilot
curl -X POST http://localhost:4026/api/copilot/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"order pizza","userId":"test","userType":"consumer"}'
```

## Enable Features

Edit `.env`:
```bash
USE_NEW_INTENT_SERVICE=true
USE_NEW_COPILOT=true
```

## Next Steps

1. Run tests: `npm test`
2. Check API reference: `docs/API-REFERENCE.md`
3. Read deployment guide: `docs/DEPLOYMENT.md`
