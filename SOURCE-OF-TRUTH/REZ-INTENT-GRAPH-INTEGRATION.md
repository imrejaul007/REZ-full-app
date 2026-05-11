# ReZ Intent Graph — Integration Guide

Updated: 2026-04-27

## Live URLs

| Service | URL |
|---------|-----|
| **Intent API** | https://rez-intent-graph.onrender.com |
| **Intent Agent** | https://rez-intent-agent.onrender.com |
| **npm Package** | https://www.npmjs.com/package/rez-intent-graph |

## Authentication

Add `INTERNAL_SERVICE_TOKEN=g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o=` to any service that calls the intent graph.

## Env Vars to Add to Each Service

```bash
# Add to any service that needs to call the intent graph:
INTENT_API_URL=https://rez-intent-graph.onrender.com
INTENT_AGENT_URL=https://rez-intent-agent.onrender.com
INTERNAL_SERVICE_TOKEN=g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o=
```

## How to Call from Other Services

### 1. Capture Intent (from any service)

```bash
curl -X POST https://rez-intent-graph.onrender.com/api/intent/capture \
  -H "Content-Type: application/json" \
  -H "x-internal-token: g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o=" \
  -d '{
    "userId": "user_123",
    "appType": "restaurant",
    "eventType": "search",
    "category": "DINING",
    "intentKey": "biryani_near_me",
    "intentQuery": "biryani restaurant",
    "metadata": { "location": "mumbai" }
  }'
```

### 2. Get Active Intents for a User

```bash
curl https://rez-intent-graph.onrender.com/api/intent/user/user_123/active \
  -H "x-internal-token: g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o="
```

### 3. Get Dormant Intents for Revival

```bash
curl https://rez-intent-graph.onrender.com/api/intent/user/user_123/dormant \
  -H "x-internal-token: g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o="
```

### 4. Send Nudge (revival notification)

```bash
curl -X POST https://rez-intent-graph.onrender.com/api/intent/nudge/send \
  -H "Content-Type: application/json" \
  -H "x-internal-token: g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o=" \
  -d '{
    "userId": "user_123",
    "merchantId": "merchant_456",
    "nudgeType": "dormant_intent_revival",
    "channel": "push",
    "message": "Your biryani order from last week is still on us!"
  }'
```

### 5. Health Check

```bash
curl https://rez-intent-graph.onrender.com/health
```

## Services That Should Integrate

| Service | Integration Type |
|---------|-----------------|
| **rez-order-service** | Capture: order_created, order_completed, order_cancelled |
| **rez-wallet-service** | Capture: wallet_recharged, payment_sent |
| **rez-merchant-service** | Capture: merchant_viewed, menu_viewed |
| **Hotel OTA** | Capture: hotel_search, hotel_view, booking_hold, booking_confirmed |
| **rez-now** | Capture: cart_add, checkout_started, order_placed |
| **rez-chat-ai** | Read: getEnrichedContext for personalized chat |

## Redis Pub/Sub (existing)

The `rez-order-service` and `rez-wallet-service` already have Redis Pub/Sub consumers listening on `intent-graph:*` channels. These are independent of the HTTP API — events are published to Redis and the intent-graph listens for them. No changes needed for the Pub/Sub integration.

## Package Install (for Node.js services)

```bash
npm install rez-intent-graph
```

```typescript
import { intentCaptureService, dormantIntentService, crossAppAggregationService } from 'rez-intent-graph';

// Capture an intent
await intentCaptureService.capture({
  userId: 'user_123',
  appType: 'restaurant',
  eventType: 'cart_add',
  category: 'DINING',
  intentKey: 'margherita_pizza',
  confidence: 0.6,
});

// Get enriched context for AI personalization
const context = await crossAppAggregationService.getEnrichedContext('user_123');
```

## Cron Job Setup (for dormant intent detection)

Trigger daily at 6 AM using Render Cron Job or external scheduler:

```
POST https://rez-intent-graph.onrender.com/api/intent/dormant/detect
Header: x-cron-secret: 6neTfu9UW+UwJoA5NbbUpikSKdFm8GMqRZCFjRtIT3c=
```

## Source of Truth

All external service URLs are centralized in `src/config/services.ts` within the intent-graph repo.
