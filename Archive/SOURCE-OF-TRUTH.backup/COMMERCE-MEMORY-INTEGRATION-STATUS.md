# RTMN Commerce Memory - Integration Status & Roadmap

## Current State (2026-04-27)

### What's Built ✓

| Component | Status | Location |
|-----------|--------|----------|
| @rez/intent-graph package | ✓ Complete | [rez-intent-graph repo](https://github.com/imrejaul007/rez-intent-graph) |
| 8 Agent Swarm | ✓ Complete | `src/agents/` |
| Shared Memory Hub | ✓ Complete | `src/agents/shared-memory.ts` |
| Swarm Coordinator | ✓ Complete | `src/agents/swarm-coordinator.ts` |
| Agent Server | ✓ Complete | `src/server/agent-server.ts` |
| MongoDB Models | ✓ Complete | `src/models/` |
| rez-agent-os Integration | ✓ Complete | `agent-core/src/memory/intentGraph.ts` |

---

## Current App Integration Status

### ✓ INTEGRATED (Partial)

| App | Integration | Files |
|-----|-------------|-------|
| **Hotel OTA** | Basic intent capture | `Hotel OTA/apps/api/src/services/intent-capture.service.ts` |
| **rez-now** | Event tracking | `src/integrations/rezNowIntegration.ts` |
| **Agent OS** | Context + Tools | `agent-core/src/memory/intentGraph.ts`, `tools/intentTools.ts` |

### ⚠️ PARTIALLY INTEGRATED

| App | Status | What's Missing |
|-----|--------|----------------|
| **rez-app-consumer** | Webhooks only | Direct SDK integration |
| **rez-app-merchant** | Not integrated | Intent visibility for merchants |

### ❌ NOT INTEGRATED

| App | Priority | Integration Needed |
|-----|----------|-------------------|
| **rez-order-service** | HIGH | Order events → intent fulfillment |
| **rez-payment-service** | HIGH | Payment events → conversion tracking |
| **rez-search-service** | HIGH | Search events → demand signals |
| **rez-notification-events** | HIGH | Nudge delivery events |
| **rez-catalog-service** | MEDIUM | Product/menu data for recommendations |
| **rez-merchant-service** | MEDIUM | Merchant demand dashboard |
| **rez-marketing-service** | MEDIUM | Campaign attribution |
| **rez-gamification-service** | LOW | Gamification × intent rewards |

---

## What's Left to Build

### Phase 1: Core Integrations (1-2 weeks)

#### 1.1 Full Hotel OTA Integration
```
TODO:
- [ ] Add merchantId to all intent captures
- [ ] Webhook: POST /api/webhooks/hotel/booking_cancel
- [ ] Webhook: POST /api/webhooks/hotel/price_change
- [ ] Cron: Daily dormancy check job
- [ ] Test: Full intent lifecycle (search → hold → fulfill)
```

#### 1.2 rez-now Full Integration
```
TODO:
- [ ] Add intent-capture.ts to rez-now lib
- [ ] Integrate at: store_viewed, add_to_cart, checkout_started, order_placed
- [ ] Capture merchantId for all restaurant events
- [ ] Test: Cart abandonment → dormant intent → nudge
```

#### 1.3 Agent Server Deployment
```
TODO:
- [ ] Add to docker-compose.yml
- [ ] Environment variables setup
- [ ] Health check endpoint
- [ ] Redis connection (for production)
- [ ] Monitoring (Prometheus metrics)
```

---

### Phase 2: Microservice Integrations (2-3 weeks)

#### 2.1 rez-order-service Integration
```typescript
// On every order event:
await intentCaptureService.capture({
  userId: order.userId,
  appType: 'restaurant', // or hotel_ota based on order
  eventType: 'fulfilled',
  category: order.category,
  intentKey: `order_${order.merchantId}`,
  metadata: { orderId: order.id, merchantId: order.merchantId }
});
```

#### 2.2 rez-notification-events Integration
```typescript
// Track nudge lifecycle:
await recordTouchpoint(userId, nudgeId, {
  type: 'impression',
  channel: 'push',
  timestamp: new Date()
});

// On click:
await recordTouchpoint(userId, nudgeId, {
  type: 'click',
  channel: 'push',
  timestamp: new Date()
});
```

#### 2.3 rez-search-service Integration
```typescript
// Capture all searches as demand signals:
await intentCaptureService.capture({
  userId: search.userId,
  appType: search.appType,
  eventType: 'search',
  category: search.category,
  intentKey: `search_${search.query}`,
  intentQuery: search.query,
  metadata: { query: search.query, results: search.resultCount }
});
```

---

### Phase 3: Merchant Dashboard (2 weeks)

#### 3.1 Merchant Demand Dashboard
```
Pages:
- /merchant/dashboard/demand
- /merchant/dashboard/scarcity-alerts
- /merchant/dashboard/customer-insights

APIs:
- GET /api/merchant/:id/demand-signals
- GET /api/merchant/:id/scarcity-report
- GET /api/merchant/:id/customer-segments
```

#### 3.2 Revenue Attribution Dashboard
```
Pages:
- /merchant/dashboard/revenue-attribution
- /merchant/dashboard/roi-by-channel
- /merchant/dashboard/top-performing-nudges

APIs:
- GET /api/merchant/:id/revenue-report
- GET /api/merchant/:id/roi-by-channel
- GET /api/merchant/:id/conversion-lift
```

---

### Phase 4: Consumer App (2 weeks)

#### 4.1 Consumer App Integration
```typescript
// On user actions in React Native:
import { intentCaptureService } from '@rez/intent-graph';

// Hotel search
intentCaptureService.capture({ ... });

// Restaurant view
intentCaptureService.capture({ ... });

// Get personalized nudges
const dormantIntents = await dormantIntentService.getUserDormantIntents(userId);

// Show "You left these earlier" section
```

#### 4.2 "Continue Shopping" Feature
```typescript
// Show dormant intents on app open:
const dormantIntents = await dormantIntentService.getUserDormantIntents(userId);

if (dormantIntents.length > 0) {
  showBanner({
    title: "Continue where you left off",
    items: dormantIntents.map(di => ({
      title: formatIntent(di.intentKey),
      image: getMerchantImage(di.merchantId),
      action: () => navigateToMerchant(di.merchantId)
    }))
  });
}
```

---

## How Commerce Memory Helps Each App

### 🏨 Hotel OTA

**Current Problem**: Users search for hotels but don't book. We lose 70%+ of interested users.

**How Commerce Memory Helps**:
```
User searches "Goa beach resort"
    ↓
Intent captured: { key: "goa_beach_resort", confidence: 0.45 }
    ↓
User doesn't book → Intent goes dormant after 7 days
    ↓
[Commerce Memory Agent] detects:
  - Demand spike for Goa hotels
  - Limited availability (scarcity agent)
  - User historically responds to push at 9am (personalization)
    ↓
Nudge sent: "Beach resorts in Goa are filling up! Last room at ₹3,499"
    ↓
User clicks → Books → Intent fulfilled ✓
```

**Metrics to Improve**:
- Hotel booking conversion: +15-25%
- Revenue per user: +30%
- Re-engagement rate: +40%

---

### 🍔 rez-now (Restaurant)

**Current Problem**: Cart abandonment, repeat customers not rewarded.

**How Commerce Memory Helps**:
```
User adds items to cart but doesn't checkout
    ↓
Intent: { key: "restaurant_biryani", confidence: 0.65 }
    ↓
After 24 hours → Dormant
    ↓
[Network Effect Agent] finds:
  - Similar users also ordered biryani at this restaurant
  - It's a popular dish (trending)
    ↓
Personalized nudge: "Your butter chicken is ready! ₹299 only"
    ↓
User orders → Conversion ✓
```

**Metrics to Improve**:
- Cart completion rate: +20%
- Repeat order rate: +35%
- Average order value: +15%

---

### 📱 rez-app-consumer

**Current Problem**: No personalization, generic recommendations.

**How Commerce Memory Helps**:
```
[User opens app]
    ↓
Commerce Memory queries user profile:
  - Preferred: Travel > Dining
  - Best time: 9am, 7pm
  - Converts on: Push > Email
    ↓
[Adaptive Scoring Agent] ranks dormant intents
    ↓
Home screen shows:
┌─────────────────────────────────┐
│ Continue your search:            │
│ 🏨 Goa Beach Resort - ₹3,499   │
│ 🍛 Butter Chicken - ₹299        │
└─────────────────────────────────┘

[vs generic "Recommended for you"]
```

**Metrics to Improve**:
- App engagement: +45%
- Session length: +30%
- Purchase frequency: +25%

---

### 🏪 rez-merchant-service (Merchant Dashboard)

**Current Problem**: No demand visibility, reactive inventory.

**How Commerce Memory Helps**:
```
[Merchant Dashboard]

┌─────────────────────────────────────────────┐
│ 📊 Demand Intelligence                      │
├─────────────────────────────────────────────┤
│ 🔥 Rising Demand                            │
│    Hotels in Mumbai +45% this week          │
│    Weekend bookings up 80%                  │
│                                             │
│ ⚠️ Scarcity Alert                           │
│    Goa Beach Resort: Only 5 rooms left      │
│    → Consider raising prices or adding inventory
│                                             │
│ 👥 Customer Insights                        │
│    Your top customers: Frequent travelers    │
│    Average booking: ₹4,200                  │
│    Peak demand: Fri-Sun                    │
└─────────────────────────────────────────────┘
```

**Metrics to Improve**:
- Inventory efficiency: +30%
- Dynamic pricing adoption: +50%
- Merchant satisfaction: +40%

---

### 📣 rez-marketing-service

**Current Problem**: No attribution, wasteful spend.

**How Commerce Memory Helps**:
```
[Marketing Campaign: "Summer Sale"]

Traditional Attribution:
  Campaign sent to 100,000 users
  5,000 users purchased
  Attribution: 100% to campaign

Commerce Memory Attribution:
  ┌──────────────────────────────────────────┐
  │ User Journey (Multi-touch):              │
  │                                          │
  │ Day 1: Push nudge → Ignored             │
  │ Day 3: Email offer → Viewed             │
  │ Day 5: SMS flash deal → Clicked         │
  │ Day 5: Organic search → Purchased        │
  │                                          │
  │ Attribution (Time Decay):               │
  │   SMS: 50% (recent touch)               │
  │   Email: 30%                            │
  │   Push: 15%                             │
  │   Organic: 5%                            │
  └──────────────────────────────────────────┘
```

**Metrics to Improve**:
- Marketing ROI: +60%
- Waste reduction: -40%
- Campaign optimization: Real-time

---

### 💳 rez-payment-service

**Current Problem**: Payment failures kill conversions.

**How Commerce Memory Helps**:
```
[User tries to pay ₹5,000]
    ↓
Payment fails (card declined)
    ↓
Intent stays ACTIVE (not dormant)
    ↓
[Personalization Agent]:
  - User prefers UPI over cards
  - User converts better with discount
    ↓
Immediate retry with:
  - UPI option highlighted
  - "Use ₹200 wallet balance" option
  - "10% off with UPI" incentive
    ↓
Payment succeeds → Conversion ✓
```

---

### 🎯 rez-gamification-service

**Current Problem**: Rewards not tied to purchase intent.

**How Commerce Memory Helps**:
```
[User has dormant intent: " Goa trip "]

Commerce Memory × Gamification:
┌─────────────────────────────────────┐
│ 🏆 Karma Challenge                  │
│                                     │
│ Book any Goa hotel this week        │
│ → Earn 2x Karma points             │
│ → Unlock "Beach Explorer" badge     │
│                                     │
│ [Current progress: 0/1]             │
└─────────────────────────────────────┘

Outcome:
- User converts (goal achieved)
- Engagement with travel category
- Brand loyalty through gamification
```

---

## Summary: What's Left

| Priority | Task | Time | Status |
|----------|------|------|--------|
| P0 | Deploy Agent Server | 1 day | ❌ |
| P0 | Full Hotel OTA integration | 3 days | ⚠️ |
| P0 | Full rez-now integration | 3 days | ⚠️ |
| P1 | rez-order-service integration | 2 days | ❌ |
| P1 | rez-notification-events integration | 2 days | ❌ |
| P1 | rez-search-service integration | 2 days | ❌ |
| P2 | Merchant dashboard | 1 week | ❌ |
| P2 | Consumer app integration | 1 week | ❌ |
| P3 | Full microservice mesh | 2 weeks | ❌ |

**Estimated Total**: 3-4 weeks for full integration

---

## Quick Wins (This Week)

1. **Deploy Agent Server** - Already built, just needs Docker
2. **Add webhooks to Hotel OTA** - 2 hours
3. **Connect notification-events** - 4 hours
4. **Test demand signals on staging** - 1 day

---

*Last Updated: 2026-04-27*
