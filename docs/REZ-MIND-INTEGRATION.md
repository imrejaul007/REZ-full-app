# REZ MIND - COMPLETE INTEGRATION GUIDE
**Date:** May 3, 2026

---

## WHAT IS REZ MIND?

ReZ Mind is the **AI brain** of the ReZ ecosystem. It captures, analyzes, and acts on user intent signals across all apps and services.

```
┌─────────────────────────────────────────────────────────────┐
│                      REZ MIND                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           INTENT CAPTURE LAYER                     │   │
│  │                                                     │   │
│  │  Signals: search, view, cart, checkout, etc.    │   │
│  │  Confidence = weight × recency × velocity        │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           8 AUTONOMOUS AI AGENTS                   │   │
│  │                                                     │   │
│  │  1. DemandSignal    5. AdaptiveScoring           │   │
│  │  2. Scarcity        6. FeedbackLoop              │   │
│  │  3. Personalization  7. NetworkEffect            │   │
│  │  4. Attribution      8. RevenueAttrib            │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           OUTPUT LAYER                             │   │
│  │                                                     │   │
│  │  • Recommendations                                 │   │
│  │  • Predictions                                     │   │
│  │  • Personalization                                 │   │
│  │  • Automation                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## THE 5 REZ MIND SERVICES

| Service | Purpose | Port |
|---------|---------|------|
| **Intent Graph** | Capture + store intent signals | 3007 |
| **Intelligence Hub** | AI analysis + agents | 4020 |
| **Personalization Engine** | User-specific recommendations | 4017 |
| **Targeting Engine** | Ad targeting + segmentation | 3013 |
| **Action Engine** | Automation + nudges | 3014 |

---

## SIGNAL FLOW

### Signal Weights
```typescript
const SIGNAL_WEIGHTS = {
  'search': 0.15,           // User searches for something
  'view': 0.10,            // User views product/merchant
  'wishlist': 0.25,        // User adds to wishlist
  'cart_add': 0.30,        // User adds to cart
  'hold': 0.35,            // User holds/reserves
  'checkout_start': 0.40,   // User starts checkout
  'booking_confirmed': 1.0, // Order completed
  'fulfilled': 1.0,        // Order delivered
  'abandoned': -0.20,      // User abandoned
};
```

### Confidence Calculation
```typescript
confidence = BASE_CONFIDENCE 
           + (SIGNAL_WEIGHT × recency_score) 
           + (velocity_bonus)

// Example:
// User searched "pizza" 1 hour ago (recency = 0.9)
// confidence = 0.3 + (0.15 × 0.9) = 0.435
```

---

## HOW SERVICES INTEGRATE WITH REZ MIND

### 1. Finance Service → ReZ Mind

```typescript
// In rez-finance-service/src/services/creditScoreService.ts

import { track } from './intentCaptureService';

// When user checks credit score
track({
  userId,
  event: 'credit_score_checked',
  intentKey: 'GENERAL:rez-finance',
  properties: { 
    score: rezScore,
    coinsAwarded 
  }
});

// When user applies for loan
track({
  userId,
  event: 'loan_application_submitted',
  intentKey: 'GENERAL:rez-finance',
  properties: { 
    amount,
    partnerId 
  }
});

// When BNPL eligibility checked
track({
  userId,
  event: 'bnpl_eligibility_checked',
  intentKey: 'GENERAL:rez-finance',
  properties: { 
    eligible,
    limit 
  }
});
```

### 2. Order Service → ReZ Mind

```typescript
// In rez-order-service/src/httpServer.ts

import { track as intentTrack } from './services/intentCaptureService';

// Order events
intentTrack({ userId, event: 'order_placed', intentKey: 'REZ-ORDER' });
intentTrack({ userId, event: 'order_completed', intentKey: 'REZ-ORDER' });
intentTrack({ userId, event: 'order_cancelled', intentKey: 'REZ-ORDER' });

// Cart events
intentTrack({ userId, event: 'cart_add', intentKey: category });
intentTrack({ userId, event: 'cart_remove', intentKey: category });
intentTrack({ userId, event: 'cart_abandoned', intentKey: category });
```

### 3. Merchant Service → ReZ Mind

```typescript
// Merchant browsing
track({ userId, event: 'merchant_view', intentKey: merchantId });
track({ userId, event: 'merchant_follow', intentKey: merchantId });

// Product interactions
track({ userId, event: 'product_view', intentKey: productId });
track({ userId, event: 'product_review', intentKey: productId });
```

### 4. ReZ Now → ReZ Mind

```typescript
// QR scan
track({ userId, event: 'qr_scanned', intentKey: 'REZ-NOW' });

// Payment
track({ userId, event: 'payment_completed', intentKey: 'REZ-NOW' });
track({ userId, event: 'coins_earned', intentKey: 'REZ-NOW' });
```

---

## INTEGRATION METHODS

### Method 1: SDK Import

```typescript
// Install SDK
import { IntentCapture } from '@rez/intent-capture-sdk';

// Initialize
const intent = new IntentCapture({
  apiUrl: process.env.INTENT_CAPTURE_URL,
  apiKey: process.env.INTENT_API_KEY
});

// Track event
await intent.track({
  userId: 'user_123',
  event: 'checkout_start',
  properties: { amount: 500, items: 3 }
});
```

### Method 2: Direct API Call

```typescript
// In any service
const INTENT_CAPTURE_URL = process.env.INTENT_CAPTURE_URL || 'http://localhost:3007';

async function track(data: any) {
  await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN
    },
    body: JSON.stringify(data)
  });
}

// Usage
track({
  userId: 'user_123',
  event: 'search',
  intentKey: 'pizza',
  properties: { location: 'bangalore' }
});
```

### Method 3: Event Bus

```typescript
// Publish to event bus
import { emitEvent } from './eventBus';

emitEvent('order.completed', {
  userId: 'user_123',
  orderId: 'order_456',
  amount: 500,
  items: ['pizza', 'coke']
});

// ReZ Mind subscribes and captures
subscribe('order.completed', (data) => {
  track({
    userId: data.userId,
    event: 'order_completed',
    intentKey: 'REZ-ORDER'
  });
});
```

---

## THE 8 AI AGENTS

### 1. DemandSignalAgent (5 min)
```typescript
// Aggregates demand per merchant/category
interface DemandSignal {
  merchantId: string;
  category: string;
  demandScore: number;
  velocity: number;  // Growing/shrinking
  topIntents: string[];
}
```

### 2. ScarcityAgent (1 min)
```typescript
// Detects supply/demand imbalances
interface ScarcitySignal {
  merchantId: string;
  demand: number;
  supply: number;
  ratio: number;
  urgency: 'low' | 'medium' | 'high';
}
```

### 3. PersonalizationAgent (1 min)
```typescript
// User response profiling
interface UserProfile {
  userId: string;
  preferredCategories: string[];
  priceSensitivity: number;
  visitFrequency: string;
  avgOrderValue: number;
  favoriteMerchants: string[];
}
```

### 4. AttributionAgent (30 min)
```typescript
// Multi-touch conversion tracking
interface Attribution {
  userId: string;
  orderId: string;
  touchpoints: Array<{
    event: string;
    timestamp: Date;
    weight: number;
  }>;
  attributedTo: string;  // Which touchpoint got credit
}
```

### 5. AdaptiveScoringAgent (1 hour)
```typescript
// ML model retraining
interface ModelUpdate {
  metric: string;
  previousScore: number;
  newScore: number;
  confidence: number;
  dataPoints: number;
}
```

### 6. FeedbackLoopAgent (1 hour)
```typescript
// Closed-loop optimization
interface FeedbackLoop {
  trigger: string;
  action: string;
  result: string;
  improvement: number;
}
```

### 7. NetworkEffectAgent (24 hours)
```typescript
// Collaborative filtering
interface SimilarUsers {
  userId: string;
  similarUsers: string[];
  similarityScore: number;
}
```

### 8. RevenueAttribAgent (15 min)
```typescript
// GMV tracking
interface RevenueAttrib {
  agentId: string;
  campaignId: string;
  gmv: number;
  conversions: number;
  roi: number;
}
```

---

## DORMANCY DETECTION

### Detection Logic
```typescript
const DORMANCY_THRESHOLD_DAYS = 7;

if (daysSinceLastSignal > DORMANCY_THRESHOLD_DAYS) {
  // Mark user as DORMANT
  user.status = 'DORMANT';
  
  // Store last intent with revival score
  user.dormantIntent = {
    intent: lastIntent,
    revivalScore: confidence,
    optimalTiming: predictBestTime(user)
  };
}
```

### Revival Strategies
```typescript
interface DormantUser {
  userId: string;
  lastIntent: string;
  revivalScore: number;  // 0-1
  optimalTiming: string;  // "Weekend afternoon"
  nudgeChannels: ('push' | 'whatsapp' | 'sms')[];
  nudgeTemplates: string[];
}
```

---

## PERSONALIZATION FLOW

### User Segment Calculation
```typescript
interface UserSegment {
  userId: string;
  segment: 'new' | 'active' | 'engaged' | 'dormant' | 'churned';
  
  // Behavior signals
  signals: {
    frequency: number;        // visits/week
    recency: number;          // days since last
    monetary: number;          // avg order value
    velocity: number;         // trend
  };
  
  // Preferences
  preferences: {
    categories: string[];
    priceRange: [min, max];
    locations: string[];
  };
}
```

### Recommendation Engine
```typescript
interface Recommendation {
  userId: string;
  type: 'merchant' | 'product' | 'offer' | 'content';
  items: Array<{
    id: string;
    score: number;
    reason: string;  // "Based on your pizza searches"
  }>;
  generatedAt: Date;
  expiresAt: Date;
}
```

---

## DATA FLOW DIAGRAM

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ ReZ Now    │     │ ReZ Menu   │     │ Room QR    │
│   QR Scan  │     │  Order     │     │  Service   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │    INTENT CAPTURE SDK     │
              │                         │
              │  track(userId, event,   │
              │         properties)      │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │    INTENT GRAPH         │
              │    (Port 3007)         │
              │                         │
              │  • Capture signals     │
              │  • Calculate confidence│
              │  • Store in MongoDB    │
              └───────────┬─────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Intelligence │  │Personalize │  │ Targeting  │
│    Hub      │  │  Engine    │  │   Engine   │
│  (Port 4020)│  │ (Port 4017)│  │ (Port 3013)│
└─────────────┘  └─────────────┘  └─────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │      REZ FINANCE        │
              │                         │
              │  • Credit scoring      │
              │  • Risk assessment     │
              │  • BNPL eligibility    │
              └───────────────────────┘
```

---

## API ENDPOINTS

### Intent Capture
```
POST /api/intent/capture
Body: { userId, event, intentKey, properties }

GET /api/intent/user/:userId
GET /api/intent/search?query=pizza
GET /api/intent/dormant
```

### Personalization
```
GET /api/personalize/:userId/recommendations
GET /api/personalize/:userId/feed
POST /api/personalize/:userId/feedback
```

### Intelligence
```
GET /api/intelligence/demand/:category
GET /api/intelligence/scarcity/:merchantId
GET /api/intelligence/trends
```

---

## ENVIRONMENT VARIABLES

```bash
# Intent Graph
INTENT_CAPTURE_URL=http://localhost:3007
INTENT_API_KEY=xxx

# Intelligence Hub
INTELLIGENCE_HUB_URL=http://localhost:4020
ANTHROPIC_API_KEY=xxx

# Personalization
PERSONALIZATION_URL=http://localhost:4017

# Targeting
TARGETING_URL=http://localhost:3013

# Action Engine
ACTION_ENGINE_URL=http://localhost:3014
```

---

## IMPLEMENTATION CHECKLIST

### For Each Service, Add:

- [ ] Import intent capture SDK
- [ ] Initialize with API URL
- [ ] Track key user events
- [ ] Test in staging
- [ ] Monitor in production

### Events to Track:

| Service | Events |
|---------|--------|
| Order | placed, completed, cancelled, refunded |
| Payment | initiated, completed, failed |
| Cart | add, remove, abandoned |
| Search | query, result_click |
| Auth | login, signup, logout |
| Wallet | topup, withdraw, transfer |
| Loyalty | points_earned, redeemed |
| Finance | score_checked, loan_applied, bnpl_used |

---

## MONITORING

### Metrics to Track

| Metric | Target |
|--------|--------|
| Intent capture rate | >95% |
| API latency | <100ms p99 |
| Signal accuracy | >80% |
| Dormancy detection | <7 days |
| Recommendation CTR | >10% |

### Dashboards

- Intent volume by event type
- Confidence score distribution
- Dormancy recovery rate
- Recommendation performance
- Agent accuracy metrics

---

## SUMMARY

ReZ Mind integrates with the ecosystem through:

1. **SDK** - Simple import and track()
2. **Direct API** - Fetch to intent capture endpoint
3. **Event Bus** - Publish/subscribe pattern

The flow is:
```
User Action → SDK/API → Intent Graph → AI Agents → Insights → Action
```

---

*ReZ Mind Integration Guide - May 3, 2026*
