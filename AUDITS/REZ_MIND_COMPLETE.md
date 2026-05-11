# ReZ Mind - Complete Technical Audit

**Version:** 1.0
**Date:** May 9, 2026
**Scope:** All AI services, ML models, and integration points

---

## Executive Summary

ReZ Mind is a comprehensive AI platform with:
- **11 Core Services**
- **8 Autonomous Agents**
- **4 ML Models**
- **3 Consumer-Facing Verticals**

### What We Have

| Component | Count | Status |
|-----------|-------|--------|
| Services | 11 | Production |
| Agents | 8 | Production |
| ML Models | 4 | Production |
| API Endpoints | 30+ | Production |
| Vertical Support | 3 | Restaurant, Hotel, Retail |

---

## Part 1: ReZ Mind Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         REZ MIND                                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  Intent Graph │  │Intelligence Hub│  │Personalization│    │
│  │   Port 3007  │  │   Port 4020   │  │   Port 4017   │    │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘    │
│          │                    │                    │              │
│  ┌──────┴────────────────────┴────────────────────┴──────┐      │
│  │                    SHARED DATA LAYER                     │      │
│  │              MongoDB + Redis                          │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │                   8 AUTONOMOUS AGENTS                    │     │
│  │ Demand │ Scarcity │ Personal │ Attribution │ Adaptive │     │
│  │Feedback│ Network │ Revenue │ Swarm │ Support │ Action │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                 │
└────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Intent Graph Services (Port 3007)

### Location: `/rez-intent-graph/src/services/`

| Service | Purpose | Key Methods |
|---------|---------|------------|
| `IntentCaptureService` | Capture user signals | `capture()`, `updateSignal()` |
| `IntentScoringService` | Score intent 0-100 | `calculateScore()`, `getConfidence()` |
| `IntentCacheService` | Redis caching | `get()`, `set()`, `invalidate()` |
| `IntentStreamService` | Real-time events | `publish()`, `subscribe()` |
| `DormantIntentService` | Detect inactive users | `detectAndMarkDormant()`, `triggerRevival()` |
| `CrossAppAggregationService` | Cross-app profiles | `aggregate()`, `getEnrichedContext()` |
| `MerchantKnowledgeService` | Store knowledge base | `indexKnowledge()`, `search()` |
| `VectorSimilarityService` | Semantic search | `index()`, `search()`, `findSimilar()` |
| `NudgeQueueService` | Re-engagement queue | `enqueue()`, `process()`, `send()` |

---

### 2.1 IntentCaptureService

**Purpose:** Capture user intent signals from all touchpoints

**Signal Types:**
```typescript
const SIGNAL_WEIGHTS = {
  search: 0.15,
  view: 0.10,
  wishlist: 0.25,
  cart_add: 0.30,
  hold: 0.35,
  checkout_start: 0.40,
  booking_confirmed: 1.0,
  fulfilled: 1.0,
  abandoned: 0.0,
};
```

**Methods:**
```typescript
// Capture new intent
await intentCaptureService.capture({
  userId: 'user_123',
  appType: 'restaurant',
  eventType: 'cart_add',
  category: 'DINING',
  intentKey: 'biryani',
  intentQuery: 'chicken biryani near me',
  metadata: { merchantId: 'store_456' }
});

// Get active intents
const intents = await intentCaptureService.getActiveIntents(userId);

// Get enriched context
const context = await intentCaptureService.getEnrichedContext(userId);
```

**Output Schema:**
```typescript
interface Intent {
  userId: string;
  appType: 'hotel_ota' | 'restaurant' | 'retail';
  category: 'TRAVEL' | 'DINING' | 'RETAIL' | 'HOTEL_SERVICE' | 'GENERAL';
  intentKey: string;
  confidence: number; // 0-1
  signalCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  metadata: Record<string, any>;
}
```

---

### 2.2 DormantIntentService

**Purpose:** Detect inactive users and trigger re-engagement

**Methods:**
```typescript
// Detect and mark dormant users
await dormantIntentService.detectAndMarkDormant();

// Check if user is dormant
const isDormant = await dormantIntentService.isDormant(userId);

// Get dormant users
const dormant = await dormantIntentService.getDormantUsers({
  category: 'DINING',
  minDays: 30
});

// Trigger revival campaign
await dormantIntentService.triggerRevival(userId, {
  triggerType: 'price_drop',
  merchantId: 'store_123'
});
```

**Revival Triggers:**
```typescript
type TriggerType = 
  | 'price_drop'      // Price reduction on favorite items
  | 'return_user'      // "We miss you" message
  | 'seasonality'      // " monsoon special"
  | 'offer_match'      // Match user's preferred offer
  | 'manual';         // Admin triggered
```

---

### 2.3 NudgeQueueService

**Purpose:** Queue and send re-engagement messages

**Methods:**
```typescript
// Enqueue a nudge
await nudgeQueueService.enqueue({
  userId: 'user_123',
  channel: 'whatsapp',
  template: 'revival_price_drop',
  data: {
    merchantName: 'Pizza Hut',
    discount: '20%',
    expiresIn: '48 hours'
  },
  scheduledAt: new Date() // Optional delay
});

// Process queue
await nudgeQueueService.process();

// Check nudge status
const status = await nudgeQueueService.getStatus(nudgeId);
```

---

### 2.4 CrossAppAggregationService

**Purpose:** Aggregate user signals across all ReZ verticals

**Methods:**
```typescript
// Get unified user profile
const profile = await crossAppService.getUserProfile(userId);

// Get enriched context for personalization
const context = await crossAppService.getEnrichedContext(userId);

// Get cross-app affinities
const affinities = await crossAppService.getAffinities(userId);
```

**Output:**
```typescript
interface UserAffinityProfile {
  userId: string;
  travelAffinity: number;    // 0-1
  diningAffinity: number;      // 0-1
  retailAffinity: number;       // 0-1
  dominantCategory: 'TRAVEL' | 'DINING' | 'RETAIL' | 'MIXED';
  totalIntents: number;
  dormantIntents: number;
  conversions: number;
}
```

---

### 2.5 MerchantKnowledgeService

**Purpose:** Build store knowledge base for AI

**Methods:**
```typescript
// Index store knowledge
await merchantService.indexKnowledge({
  merchantId: 'store_123',
  data: {
    name: 'Pizza Hut',
    cuisine: ['Italian', 'Pizza'],
    priceRange: 'medium',
    rating: 4.2,
    menu: [...],
    hours: {...}
  }
});

// Search knowledge
const results = await merchantService.search({
  query: 'pizza near me',
  location: { lat: 28.61, lng: 77.20 },
  radius: 5, // km
  filters: { cuisine: 'Italian' }
});
```

---

### 2.6 VectorSimilarityService

**Purpose:** Semantic search using embeddings

**Methods:**
```typescript
// Index items
await vectorService.index({
  id: 'item_123',
  text: 'Chicken Biryani - Spicy rice dish with chicken',
  category: 'DINING',
  metadata: { price: 299 }
});

// Semantic search
const results = await vectorService.search({
  query: 'rice with chicken',
  limit: 10
});

// Find similar items
const similar = await vectorService.findSimilar('item_123', { limit: 5 });
```

---

## Part 3: Intelligence Hub (Port 4020)

### Location: `/rez-intelligence-hub/src/services/`

| Service | Purpose | Key Methods |
|---------|---------|------------|
| `userIntelligenceService` | User profiles, churn, LTV | `getProfile()`, `predictChurn()`, `calculateLTV()` |
| `financeIntelligenceService` | Financial predictions | `predictRevenue()`, `analyzeSpend()` |

---

### 3.1 UserIntelligenceService

**Purpose:** Generate user intelligence from intents

**Methods:**
```typescript
// Get enriched user profile
const profile = await userIntelligenceService.getUserProfile(userId);

// Predict churn risk (0-1)
const churn = await userIntelligenceService.predictChurn(userId);

// Calculate lifetime value
const ltv = await userIntelligenceService.calculateLTV(userId);

// Get segments
const segments = await userIntelligenceService.getSegments(userId);

// Predict purchase probability
const prob = await userIntelligenceService.predictPurchaseProbability(userId);
```

**Profile Schema:**
```typescript
interface UserProfile {
  userId: string;
  affinities: Array<{
    category: string;
    score: number;
    topIntents: string[];
  }>;
  segments: string[];  // 'foodie', 'traveler', 'shopper'
  behavior: {
    avgOrderValue: number;
    ordersPerWeek: number;
    preferredTimes: string[];
  };
  predictions: {
    churnRisk: number;        // 0-1
    purchaseProbability: number; // 0-1
    lifetimeValue: number;      // INR
  };
}
```

---

### 3.2 FinanceIntelligenceService

**Purpose:** Financial insights and predictions

**Methods:**
```typescript
// Predict revenue
const revenue = await financeService.predictRevenue(merchantId, {
  days: 30,
  includeTrends: true
});

// Analyze spending patterns
const patterns = await financeService.analyzeSpending(userId);

// Get LTV breakdown
const breakdown = await financeService.getLTVBreakdown(userId);
```

---

## Part 4: Personalization Engine (Port 4017)

### Location: `/rez-personalization-engine/`

| Algorithm | Purpose |
|-----------|---------|
| `CollaborativeFiltering` | "Users like you also ordered..." |
| `ContentBased` | Based on user preferences |
| `ContextualBandits` | A/B testing, exploration |
| `DiversityManager` | Avoid filter bubbles |
| `PriceSensitivity` | Price tier alignment |

---

### 4.1 Recommendation Service

**Methods:**
```typescript
// Get personalized homepage
const home = await personalizationService.personalizeHomepage({
  userId: 'user_123',
  context: {
    time: new Date(),
    location: { lat: 28.61, lng: 77.20 }
  }
});

// Get recommendations
const recs = await personalizationService.getRecommendations({
  userId: 'user_123',
  type: 'restaurant',
  limit: 20
});

// Personalize search
const results = await personalizationService.personalizeSearch({
  userId: 'user_123',
  query: 'biryani',
  filters: { rating: 4.0 }
});
```

**Response Format:**
```typescript
interface Recommendation {
  id: string;
  type: 'restaurant' | 'dish' | 'offer';
  score: number;
  data: {
    name: string;
    image: string;
    rating: number;
    distance: number;
  };
  explanation: string;  // Why this was recommended
}
```

---

### 4.2 Collaborative Filtering

**Algorithm:** Matrix Factorization with SGD

**Parameters:**
```javascript
{
  factors: 20,        // Latent factors
  learningRate: 0.005,
  regularization: 0.02,
  epochs: 100
}
```

**Similarity Metrics:**
- Cosine
- Pearson
- Euclidean

---

### 4.3 Contextual Bandits

**Algorithms:**
```typescript
type BanditAlgorithm = 
  | 'epsilon-greedy'    // 10% exploration
  | 'thompson-sampling'  // Beta distribution
  | 'linucb';           // Linear UCB
```

---

## Part 5: 8 Autonomous Agents

### Location: `/rez-intent-graph/src/agents/`

| Agent | Schedule | Purpose |
|-------|----------|---------|
| `DemandSignalAgent` | 5 min | Aggregate demand per merchant |
| `ScarcityAgent` | 1 min | Urgency alerts |
| `PersonalizationAgent` | Event | User profiling |
| `AttributionAgent` | Event | Multi-touch attribution |
| `AdaptiveScoringAgent` | Hourly | ML retraining |
| `FeedbackLoopAgent` | Event | Closed-loop optimization |
| `NetworkEffectAgent` | Daily | Collaborative filtering |
| `RevenueAttributionAgent` | 15 min | GMV tracking |

---

### 5.1 DemandSignalAgent

**Purpose:** Aggregate demand signals for forecasting

```typescript
// Runs every 5 minutes
await demandSignalAgent.run();

// Outputs demand signals
interface DemandSignal {
  merchantId: string;
  category: string;
  signals: {
    searches: number;
    views: number;
    carts: number;
    orders: number;
  };
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}
```

---

### 5.2 ScarcityAgent

**Purpose:** Generate urgency signals

```typescript
// Runs every 1 minute
await scarcityAgent.run();

// Outputs scarcity alerts
interface ScarcityAlert {
  type: 'low_stock' | 'high_demand' | 'time_limited';
  merchantId: string;
  itemId?: string;
  urgency: 'low' | 'medium' | 'high';
  message: string;
  expiresAt: Date;
}
```

---

### 5.3 Swarm Coordinator

**Purpose:** Orchestrate multi-agent collaboration

```typescript
// Coordinated actions across agents
await swarmCoordinator.coordinate({
  goal: 'maximize_revenue',
  constraints: {
    maxActions: 5,
    timeWindow: '1h'
  },
  agents: ['demand', 'scarcity', 'personalization']
});
```

---

## Part 6: API Endpoints

### Intent Graph (Port 3007)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/intent/capture` | Capture intent signal |
| GET | `/api/intent/active/:userId` | Get active intents |
| GET | `/api/intent/dormant/:userId` | Get dormant intents |
| POST | `/api/intent/revival` | Trigger revival |
| GET | `/api/intent/profile/:userId` | Cross-app profile |
| POST | `/api/intent/nudge/send` | Send nudge |

### Intelligence Hub (Port 4020)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/profile/user/:userId` | User profile |
| GET | `/api/intelligence/user/:userId` | Intelligence |
| GET | `/api/intelligence/stats` | Stats |
| GET | `/api/dashboard/stats` | Dashboard |

### Personalization (Port 4017)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/personalize/homepage` | Home feed |
| GET | `/api/personalize/recommendations` | Recs |
| POST | `/api/personalize/search` | Search |
| POST | `/api/personalize/interaction` | Log interaction |

---

## Part 7: Integration Points

### From Order Service

```typescript
// When order is created
await intentCaptureService.capture({
  userId: order.userId,
  appType: 'restaurant',
  eventType: 'booking_confirmed',
  category: 'DINING',
  intentKey: order.storeId,
  metadata: { orderId: order.id, amount: order.total }
});
```

### From POS

```typescript
// When item is viewed
await intentCaptureService.capture({
  userId: customerId,
  appType: 'restaurant',
  eventType: 'view',
  category: 'DINING',
  intentKey: itemId
});
```

### From Consumer App

```typescript
// When item added to cart
await intentCaptureService.capture({
  userId: user.id,
  appType: 'restaurant',
  eventType: 'cart_add',
  category: 'DINING',
  intentKey: item.id,
  metadata: { quantity: 1, price: item.price }
});
```

---

## Part 8: ML Models Summary

### What We Have

| Model | Type | Status |
|-------|------|--------|
| Recommendation | Collaborative Filtering | Production |
| Churn Prediction | Classification | Production |
| Purchase Probability | Regression | Production |
| LTV Estimation | Regression | Production |

### What We Can Add

| Model | Purpose | Effort |
|-------|---------|--------|
| Demand Forecast | Predict orders | Medium |
| Prep Time | Kitchen timing | Low |
| No-show Prediction | Appointments | Medium |
| Menu Optimization | Profitability | High |
| Dynamic Pricing | Revenue | High |

---

## Part 9: Extensibility Guide

### Adding New Intent Types

1. Add to `SIGNAL_WEIGHTS` in `IntentCaptureService.ts`
2. Add to schema in `models/Intent.ts`
3. Add API endpoint for capture

```typescript
// Example: Add 'video_watched' intent
SIGNAL_WEIGHTS['video_watched'] = 0.20;
```

### Adding New ML Model

1. Create model file in `rez-ml-engine/src/models/`
2. Add training endpoint
3. Register with `AdaptiveScoringAgent`
4. Add prediction endpoint

```javascript
// Example: Add demand forecast model
class DemandForecastModel {
  train(data) { ... }
  predict(input) { ... }
}
```

### Adding New Agent

1. Create agent in `rez-intent-graph/src/agents/`
2. Implement `run()` method
3. Register with Swarm Coordinator
4. Add to cron schedule

---

## Part 10: Performance Metrics

| Metric | Current | Target |
|--------|---------|---------|
| Intent capture latency | 50ms | 20ms |
| Recommendation latency | 100ms | 50ms |
| Model accuracy | 85% | 92% |
| Real-time events | 10K/sec | 100K/sec |

---

## Summary

ReZ Mind provides:
1. **Intent Capture** - Capture all user signals
2. **User Intelligence** - Profiles, churn, LTV
3. **Personalization** - Recommendations
4. **8 Autonomous Agents** - Continuous optimization
5. **Cross-App** - Unified user view

**Ready for extension with:**
- Restaurant AI
- Voice AI
- Vision AI
- Any vertical plugin

---

*Document Version: 1.0*
*Last Updated: May 9, 2026*
