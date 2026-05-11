# Quick Start Guide

Get up and running with the REZ Loyalty System in 5 minutes.

---

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB (local or Atlas)
- Redis (local or cloud)

---

## Setup

### 1. Clone and Install

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-secure-token

# Optional (defaults to localhost)
PORT=3001
AGENT_PORT=3005
```

### 3. Start Dependencies

```bash
# Start MongoDB
mongod --dbpath /data/db

# Start Redis
redis-server
```

---

## Run Services

### Start All Services

```bash
npm run dev
```

### Start Individual Services

```bash
# Intent Graph (API + Agents)
cd rez-intent-graph
npm run dev

# Decision Service
cd rez-decision-service
npm run dev

# Loyalty Service
cd rez-loyalty-service
npm run dev
```

### Health Check

```bash
curl http://localhost:4009/health
```

---

## First API Call

### Capture User Intent

```bash
curl -X POST http://localhost:4009/api/intent/capture \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token" \
  -d '{
    "userId": "user_demo_001",
    "appType": "restaurant",
    "eventType": "view",
    "category": "pizza",
    "intentKey": "margherita_pizza"
  }'
```

**Response:**
```json
{
  "success": true,
  "intentId": "intent_demo_001",
  "confidence": 0.4,
  "status": "active"
}
```

### Check Loyalty Balance

```bash
curl http://localhost:4016/api/loyalty/user_demo_001/balance \
  -H "X-Internal-Token: your-secure-token"
```

---

## Next Steps

### 1. Create an Order

```bash
curl -X POST http://localhost:4006/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token" \
  -d '{
    "userId": "user_demo_001",
    "merchantId": "merchant_demo_001",
    "items": [
      { "productId": "prod_pizza_001", "quantity": 1 }
    ],
    "fulfillmentType": "delivery"
  }'
```

This triggers the loyalty cascade:
- Points credited
- Cashback calculated
- Karma awarded
- Streak updated

### 2. Check Profile

```bash
curl http://localhost:4015/api/profile/user_demo_001 \
  -H "X-Internal-Token: your-secure-token"
```

### 3. View Transactions

```bash
# Loyalty points
curl http://localhost:4016/api/loyalty/user_demo_001/transactions \
  -H "X-Internal-Token: your-secure-token"

# Cashback
curl http://localhost:4017/api/cashback/user_demo_001/transactions \
  -H "X-Internal-Token: your-secure-token"
```

---

## Common Tasks

### Add Points to User

```bash
curl -X POST http://localhost:4016/api/loyalty/user_demo_001/credit \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token" \
  -d '{
    "points": 100,
    "source": "promotion",
    "reason": "Welcome bonus"
  }'
```

### Redeem Points

```bash
curl -X POST http://localhost:4016/api/loyalty/user_demo_001/redeem \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token" \
  -d '{
    "points": 500,
    "orderId": "ord_demo_001"
  }'
```

### Trigger Dormant Intent Revival

```bash
curl -X POST http://localhost:4009/api/intent/revive \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-secure-token" \
  -d '{
    "dormantIntentId": "intent_dormant_001",
    "triggerType": "price_drop"
  }'
```

---

## Testing

### Run Smoke Tests

```bash
cd rez-intent-graph
npm run test:smoke
```

### Run Agent Tests

```bash
cd rez-intent-graph
npm run test:agents
```

### Test WebSocket

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:4009/ws', {
  headers: { Authorization: 'Bearer <jwt>' }
});

ws.on('open', () => {
  // Subscribe to user updates
  ws.send(JSON.stringify({
    action: 'subscribe',
    channel: 'intent:user:user_demo_001'
  }));
});

ws.on('message', (event) => {
  console.log('Received:', event.data);
});
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  REZ Loyalty System                          │
├─────────────────────────────────────────────────────────────┤
│  Intent Service     →  Track user intent signals            │
│  Decision Service   →  REE rules engine                    │
│  Loyalty Service    →  Points, tiers, milestones           │
│  Cashback Service   →  Cashback calculations                │
│  Gamification       →  Karma, achievements                 │
│  Streak Service     →  Daily engagement streaks            │
│  Profile Aggregator →  Unified user profiles               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  MongoDB  │  Redis  │  Event Bus                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Intent Graph | 4009 | Intent tracking + Agents |
| Agent Server | 3005 | Autonomous agents |
| Order Service | 4006 | Order processing |
| Loyalty Service | 4016 | Points & tiers |
| Cashback Service | 4017 | Cashback |
| Gamification | 4010 | Karma & achievements |
| Streak Service | 4018 | Daily streaks |
| Profile Aggregator | 4015 | User profiles |
| Decision Service | 4027 | Targeting decisions |

---

## Environment Variables Reference

```bash
# Database
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SERVICE_TOKEN=your-secure-token

# Service URLs
LOYALTY_SERVICE_URL=http://localhost:4016
CASHBACK_SERVICE_URL=http://localhost:4017
GAMIFICATION_SERVICE_URL=http://localhost:4010

# Optional
PORT=4009
AGENT_PORT=3005
LOG_LEVEL=info
```

---

## Troubleshooting

### MongoDB Connection Error

```
Error: MongoDB connection failed
```

**Fix:**
```bash
# Ensure MongoDB is running
mongod --dbpath /data/db

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017
```

### Redis Connection Error

```
Error: Redis connection failed
```

**Fix:**
```bash
# Ensure Redis is running
redis-server

# Check connection string
REDIS_URL=redis://localhost:6379
```

### Auth Token Error

```
Error: Invalid internal token
```

**Fix:**
```bash
# Use the same token in all services
INTERNAL_SERVICE_TOKEN=your-secure-token

# Include in requests
curl -H "X-Internal-Token: your-secure-token" ...
```

---

## Next Steps

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture details
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Service connections
- [EVENTS.md](EVENTS.md) - Event catalog
- [DECISIONS.md](DECISIONS.md) - REE decision rules
- [API_REFERENCE.md](API_REFERENCE.md) - API documentation

---

## Support

- **Issues**: Report bugs via GitHub Issues
- **Documentation**: [docs/](docs/)
- **Examples**: Check `rez-intent-graph/src/examples/`

---

*Last Updated: 2026-05-08*
