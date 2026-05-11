# REZ Mind - Complete Architecture

**Version:** 1.0.0
**Last Updated:** 2026-05-02
**Repository:** `/Users/rejaulkarim/Documents/rez-intent-graph`

---

## Table of Contents

1. [What is REZ Mind?](#what-is-rez-mind)
2. [Core Components](#core-components)
3. [How It All Connects](#how-it-all-connects)
4. [Services Breakdown](#services-breakdown)
5. [Data Flow](#data-flow)
6. [API Reference](#api-reference)
7. [Integrations](#integrations)
8. [Features](#features)
9. [Roadmap](#roadmap)

---

## What is REZ Mind?

**REZ Mind** is the AI-powered commerce intelligence platform of the REZ ecosystem. It combines:

- **RTMN Commerce Memory** - Cross-app user intent tracking and memory
- **ReZ Agent OS** - 8 autonomous AI agents for intelligent commerce assistance

REZ Mind tracks user purchase intent across all REZ apps (hotel, restaurant, retail), detects dormant intents, orchestrates revival nudges, and runs 8 autonomous agents for business intelligence.

### Vision

Create a unified intelligence layer that:
- Captures user intent signals from every app interaction
- Maintains cross-app user profiles with affinities
- Predicts dormant intent revival opportunities
- Provides actionable intelligence to merchants
- Enables autonomous AI agents to assist users and merchants

---

## Core Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REZ Mind                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Consumer-Facing Services                           │  │
│  │                                                                       │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                     │  │
│  │  │  REZ-MIND-CLIENT   │  │ REZ Consumer       │                     │  │
│  │  │  (Event SDK)       │  │ Copilot            │                     │  │
│  │  │  - merchant events │  │ (User Intelligence)│                     │  │
│  │  │  - consumer events │  │                    │                     │  │
│  │  └─────────────────────┘  └─────────────────────┘                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Intelligence Hub                                   │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────┐    │  │
│  │  │              REZ Intent Graph Service                       │    │  │
│  │  │                                                             │    │  │
│  │  │  Intent Capture → Dormant Detection → Revival Engine        │    │  │
│  │  │  Cross-App Profiles → Agent Swarm → Action Triggers        │    │  │
│  │  │                                                             │    │  │
│  │  │  ┌─────────────────────────────────────────────────────┐   │    │  │
│  │  │  │           8 Autonomous Agents                      │   │    │  │
│  │  │  │  DemandSignal │ Scarcity │ Personalization │ Attr │   │    │  │
│  │  │  │  AdaptiveScoring │ FeedbackLoop │ NetworkEffect │ Rev│   │    │  │
│  │  │  └─────────────────────────────────────────────────────┘   │    │  │
│  │  └─────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Merchant-Facing Services                          │  │
│  │                                                                       │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────┐ │  │
│  │  │ REZ Merchant       │  │ REZ Merchant        │  │ REZ Ad      │ │  │
│  │  │ Copilot            │  │ Intelligence        │  │ Copilot     │ │  │
│  │  │ (Recommendations)  │  │ Service            │  │             │ │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────┘ │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │  REZ Support Copilot                                         │  │  │
│  │  │  (Unified customer support with intent detection)            │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## How It All Connects

### Event Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│ Consumer │     │ REZ-MIND-    │     │  Intent Graph    │     │  Cross-App    │
│ App      │────▶│ CLIENT       │────▶│  Service        │────▶│  Profiles     │
│          │     │ (Event SDK)  │     │                 │     │               │
└──────────┘     └──────────────┘     └──────────────────┘     └────────────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │   Agent Swarm        │
                                         │   (8 Autonomous)     │
                                         └──────────────────────┘
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                 ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
                 │  Nudge Delivery  │     │  Merchant       │     │  User           │
                 │  (Revival)       │     │  Dashboard      │     │  Recommendations │
                 └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Service Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REZ Ecosystem                                      │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  ReZ    │ │  Hotel  │ │ Hotel   │ │ Nexta   │ │Resturan-│           │
│  │  Now    │ │   OTA   │ │   PMS   │ │  BiZ    │ │   tian  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │           │                     │
│       └───────────┴───────────┴───────────┴───────────┘                     │
│                              │                                              │
│                    82 Events Captured                                       │
│                    (search, view, book, order, etc.)                       │
└──────────────────────────────┼──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ Mind - Intent Graph                               │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │   MongoDB    │  │    Redis     │  │   OpenAI     │                    │
│  │  (Storage)   │  │   (Cache)    │  │ (Embeddings) │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 Processing Layer                                       │   │
│  │  Dormant Intent Cron │ Agent Swarm │ Nudge Delivery Queue           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Services Breakdown

### 1. REZ-MIND-CLIENT

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-MIND-CLIENT/`

**Purpose:** Lightweight event SDK for consumer and merchant apps to send events to REZ Mind.

#### What It Does
- Provides a simple API for apps to send behavioral events
- Supports both merchant and consumer app events
- Fire-and-forget pattern for non-blocking event capture
- Automatic retry with timeout handling

#### How It Works

```typescript
// Merchant App Integration
import { rezMind } from './services/ReZMindClient';

// Send order completed event
await rezMind.merchant.sendOrderCompleted({
  merchant_id: 'merchant_123',
  order_id: 'order_456',
  customer_id: 'customer_789',
  items: [{ item_id: 'biryani', quantity: 2, price: 250 }],
  total_amount: 580,
  payment_method: 'upi'
});

// Consumer App Integration
await rezMind.consumer.sendOrder({
  user_id: 'user_123',
  order_id: 'order_456',
  merchant_id: 'merchant_789',
  items: [{ item_id: 'biryani', quantity: 1, price: 250 }],
  total_amount: 250
});
```

#### API Endpoints (Webhook Targets)

| Event Type | Endpoint | Data |
|------------|----------|------|
| `inventory_low` | `/webhook/merchant/inventory` | `merchant_id`, `item_id`, `current_stock`, `threshold` |
| `order_completed` | `/webhook/merchant/order` | `merchant_id`, `order_id`, `customer_id`, `items`, `total_amount` |
| `payment_success` | `/webhook/merchant/payment` | `merchant_id`, `transaction_id`, `amount` |
| `customer_event` | `/webhook/merchant/customer` | `merchant_id`, `customer_id`, `event_type` |
| `order_placed` | `/webhook/consumer/order` | `user_id`, `order_id`, `merchant_id`, `items` |
| `search` | `/webhook/consumer/search` | `user_id`, `query`, `results_count` |
| `item_view` | `/webhook/consumer/view` | `user_id`, `item_id`, `duration_seconds` |
| `booking` | `/webhook/consumer/booking` | `user_id`, `booking_id`, `service_type` |

#### Environment Variables
```bash
EXPO_PUBLIC_EVENT_PLATFORM_URL=http://localhost:4008  # Development
EXPO_PUBLIC_EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com  # Production
```

#### Data Models

**Merchant Events:**
```typescript
interface InventoryLowEvent {
  merchant_id: string;
  item_id: string;
  item_name?: string;
  current_stock: number;
  threshold: number;
  avg_daily_sales?: number;
  recent_orders?: number;
}

interface OrderCompletedEvent {
  merchant_id: string;
  order_id: string;
  customer_id: string;
  items: Array<{ item_id: string; quantity: number; price: number }>;
  total_amount: number;
  payment_method: string;
}
```

**Consumer Events:**
```typescript
interface OrderEvent {
  user_id: string;
  order_id: string;
  merchant_id: string;
  items: Array<{ item_id: string; quantity: number; price: number }>;
  total_amount: number;
}

interface SearchEvent {
  user_id: string;
  query: string;
  results_count?: number;
  clicked_item?: string;
}

interface ViewEvent {
  user_id: string;
  item_id: string;
  item_name?: string;
  merchant_id?: string;
  duration_seconds?: number;
}
```

---

### 2. REZ-support-copilot

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-support-copilot/`

**Purpose:** AI-powered customer support dashboard with unified ticket management, sentiment analysis, and user history tracking.

#### What It Does
- Real-time ticket management
- AI-powered suggestions based on user history
- Sentiment analysis for support tickets
- User history tracking
- Order webhook integration
- Unified customer support capabilities

#### How It Works
- Receives webhooks from order service for ticket creation
- Analyzes user history for context-aware support
- Provides AI suggestions to support agents
- Tracks sentiment across conversations

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/dashboard` | GET | Agent dashboard overview |
| `/user/:userId/history` | GET | User support history |
| `/ticket/:ticketId/suggestions` | GET | AI suggestions for ticket |
| `/webhook/ticket` | POST | Create/update ticket |
| `/webhook/order/created` | POST | Order created webhook |
| `/webhook/order/issue` | POST | Order issue webhook |
| `/webhook/order/refund` | POST | Refund request webhook |
| `/ticket/:ticketId` | PATCH | Update ticket status |
| `/analytics` | GET | Support analytics |

#### Webhook Configuration

**Setup in rez-order-service:**
```env
ORDER_SERVICE_WEBHOOK_URL=https://REZ-support-copilot.onrender.com/webhooks
ORDER_SERVICE_WEBHOOK_SECRET=your-secure-webhook-secret
```

**Webhook Events:**
| Event | Endpoint | Trigger |
|-------|----------|---------|
| `order.created` | `/webhooks/order/created` | New order placed |
| `order.status_changed` | `/webhooks/order/status` | Order status updated |
| `order.issue_reported` | `/webhooks/order/issue` | Customer reported issue |
| `order.refund_requested` | `/webhooks/order/refund` | Refund requested |

#### Features
- **Sentiment Analysis**: Analyzes ticket content for sentiment
- **User Context**: Enriches tickets with user history from REZ Mind
- **Intent Detection**: Identifies user intent from support conversations
- **Ticket Routing**: Automatic priority and category assignment

---

### 3. REZ-merchant-copilot

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-merchant-copilot/`

**Purpose:** AI-powered business intelligence for merchants providing health scores, recommendations, competitor analysis, and operational decisions.

#### What It Does
- Calculates comprehensive merchant health scores
- Generates actionable recommendations
- Analyzes competitors and market positioning
- Provides operational decision support
- Integrates with live data from other services

#### How It Works
- Fetches data from multiple services (orders, catalog, merchant)
- Calculates health scores using weighted metrics
- Generates recommendations based on patterns
- Provides decision engine for inventory/pricing decisions

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/merchant/:id/profile` | GET | Merchant profile with metrics |
| `/api/merchant/:id/insights` | GET | AI-generated insights |
| `/api/merchant/:id/recommendations` | GET | Actionable recommendations |
| `/api/merchant/:id/health-score` | GET | Comprehensive health score |
| `/api/merchant/:id/decisions` | GET | Operational decisions |
| `/api/merchant/:id/competitors` | GET | Competitor analysis |
| `/api/merchant/:id/trends` | GET | Market trends |
| `/api/merchant/:id/feedback` | POST | Submit decision feedback |
| `/health` | GET | Service health check |

#### Health Score System

**Score Components:**
| Component | Weight | Description |
|-----------|--------|-------------|
| Revenue Health | 30% | Revenue vs. target |
| Order Health | 25% | Order volume trends |
| Customer Health | 20% | Retention rate |
| Review Health | 15% | Ratings and feedback |
| Inventory Health | 10% | Stockout rate |

**Risk Levels:**
- `low`: Overall score >= 80
- `medium`: Overall score >= 60
- `high`: Overall score >= 40
- `critical`: Overall score < 40

#### Services

**1. Health Scorer (`merchantHealthScorer.ts`)**
```typescript
interface MerchantMetrics {
  orders: { thisWeek: number; lastWeek: number; thisMonth: number; lastMonth: number; };
  revenue: { thisWeek: number; lastWeek: number; target: number; };
  customers: { total: number; returning: number; new: number; };
  reviews: { avgRating: number; totalReviews: number; };
  inventory: { stockoutRate: number; lowStockItems: number; };
}

interface HealthScore {
  overall: number;  // 0-100
  breakdown: { orderHealth: number; revenueHealth: number; customerHealth: number; reviewHealth: number; inventoryHealth: number; };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: Array<{ type: string; message: string; priority: string; }>;
}
```

**2. Recommendation Engine (`recommendationEngine.ts`)**
```typescript
interface Recommendation {
  id: string;
  type: 'inventory' | 'pricing' | 'marketing' | 'operations' | 'customer';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{ type: string; title: string; url?: string; }>;
  expectedImpact: string;
  confidence: number;
}
```

**3. Competitor Analyzer (`competitorAnalyzer.ts`)**
```typescript
interface CompetitorAnalysis {
  competitors: Array<{
    id: string;
    name: string;
    rating: number;
    priceLevel: 'low' | 'medium' | 'high';
    distanceKm: number;
    similarity: number;
  }>;
  priceGap: number;
  ratingGap: number;
  marketShare: number;
  insights: Array<{ type: string; message: string; }>;
}
```

**4. Decision Engine (`decisionEngine.ts`)**
```typescript
interface Decision {
  decisionId: string;
  itemId: string;
  itemName: string;
  suggestion: string;
  actionLevel: 'SAFE' | 'SEMI_SAFE' | 'WARNING' | 'DANGER';
  confidence: number;
  reasoning: string;
  timestamp: Date;
}
```

#### Integrations
- **Order Service**: Order analytics, sales velocity, forecasts
- **Catalog Service**: Product data, pricing opportunities, inventory
- **Merchant Service**: Merchant profiles, reviews, ratings
- **Event Platform**: Logging insights and recommendations

---

### 4. REZ Intent Graph

**Location:** `/Users/rejaulkarim/Documents/rez-intent-graph/`

**Purpose:** Core intelligence engine that captures, processes, and activates user intent across the entire REZ ecosystem.

#### What It Does
- Captures intent signals from all apps (82 event types)
- Maintains cross-app user profiles with affinities
- Detects dormant intents and orchestrates revival nudges
- Runs 8 autonomous agents for business intelligence
- Provides real-time demand signals to merchants

#### How It Works

**Intent Capture Flow:**
```
1. Event arrives via webhook or API
2. Intent key normalization
3. Confidence score calculation
4. Signal aggregation
5. Storage in MongoDB
6. Real-time updates via WebSocket
```

**Dormant Intent Detection:**
```
1. Daily cron job runs
2. Identifies intents inactive for 7+ days
3. Calculates dormancy score
4. Generates revival score
5. Queues for nudge delivery
6. Sends via optimal channel
7. Tracks conversion
```

#### Core Types

```typescript
type IntentStatus = 'ACTIVE' | 'DORMANT' | 'FULFILLED' | 'EXPIRED';
type AppType = 'hotel_ota' | 'restaurant' | 'retail' | 'hotel_guest';
type Category = 'TRAVEL' | 'DINING' | 'RETAIL' | 'HOTEL_SERVICE' | 'GENERAL';
type EventType = 'search' | 'view' | 'wishlist' | 'cart_add' | 'hold' | 'checkout_start' | 'fulfilled' | 'abandoned';

interface Intent {
  id: string;
  userId: string;
  merchantId?: string;
  appType: AppType;
  category: Category;
  intentKey: string;
  intentQuery?: string;
  metadata?: Record<string, unknown>;
  confidence: number;
  status: IntentStatus;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

interface IntentSignal {
  id: string;
  intentId: string;
  eventType: EventType;
  weight: number;
  data?: Record<string, unknown>;
  capturedAt: Date;
}
```

#### Signal Weights

| Event Type | Weight | Confidence Impact |
|------------|--------|------------------|
| `search` | 0.15 | Low intent |
| `view` | 0.10 | Low intent |
| `wishlist` | 0.25 | Medium intent |
| `cart_add` | 0.30 | Medium-high intent |
| `hold` | 0.35 | High intent |
| `checkout_start` | 0.40 | High intent |
| `fulfilled` | 1.00 | Fulfilled |
| `abandoned` | -0.20 | Negative signal |

#### Confidence Calculation

```javascript
new_confidence = existing_confidence + (event_weight × recency_multiplier) + velocity_bonus

where:
  recency_multiplier = e^(-days_since_last_signal / 30)
  velocity_bonus = 0.2 if <1min, 0.1 if <5min, 0.05 if <1hr, else 0
```

---

### 5. REZ User Intelligence Service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-user-intelligence-service/`

**Purpose:** Comprehensive user profile management with behavioral scoring, lifetime value metrics, and personalized recommendations.

#### What It Does
- Maintains comprehensive user profiles
- Tracks behavioral patterns and preferences
- Calculates engagement scores and lifetime value
- Generates personalized recommendations
- Supports push notification token management

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/user/event` | POST | Capture user behavior events |
| `/user/:id/profile` | GET | Full 360 user profile view |
| `/user/:id/preferences` | GET | User preferences |
| `/user/:id/recommendations` | GET | Personalized recommendations |
| `/user/:id/push-tokens` | GET | Push notification tokens |
| `/user/:id/lifetime-value` | GET | Lifetime value metrics |
| `/user/:id/feedback` | POST | Submit feedback |
| `/users/search` | GET | Search users by criteria |
| `/users/segments` | GET | User segment statistics |

#### Behavioral Scoring

```typescript
interface UserScoring {
  engagement_score: number;      // 0-100: Overall user engagement level
  value_segment: 'HIGH' | 'MEDIUM' | 'LOW';
  churn_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  upsell_opportunity: boolean;
  preferred_channels: ('PUSH' | 'EMAIL' | 'SMS')[];
}
```

#### Event Types

**Transaction Events:**
- `order_placed`, `order_completed`, `order_cancelled`, `order_refunded`

**Search Events:**
- `search_query`, `search_result_clicked`, `search_filter_applied`

**Feedback Events:**
- `rating_given`, `review_written`, `complaint_filed`

**Intent Signals:**
- `item_viewed`, `item_added_to_cart`, `cart_abandoned`, `item_added_to_wishlist`

**Engagement Events:**
- `app_opened`, `session_started`, `session_ended`, `feature_used`

---

### 6. REZ Merchant Intelligence Service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-intelligence-service/`

**Purpose:** Business intelligence for merchants including revenue analytics, competitive analysis, health scoring, and recommendations.

#### What It Does
- Revenue analytics and tracking
- Order intelligence and patterns
- Customer insights and retention
- Inventory analysis and alerts
- Competitive positioning
- Health and growth scoring

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/merchant/profile` | POST | Create/update merchant profile |
| `/api/v1/merchant/:id/profile` | GET | Get merchant profile |
| `/api/v1/merchant/:id/sync` | POST | Sync from external services |
| `/api/v1/merchant/:id/insights` | GET | Comprehensive merchant insights |
| `/api/v1/merchant/:id/recommendations` | GET | Personalized recommendations |
| `/api/v1/merchant/:id/competitors` | GET | Competitor analysis |
| `/api/v1/merchant/:id/health-score` | GET | Health, growth, engagement scores |
| `/api/v1/merchant/:id/event` | POST | Capture merchant behavior events |
| `/api/v1/merchant/:id/trends` | GET | Trend analysis |

#### Scoring System

**Health Score (0-100):**
- Revenue performance (25%)
- Order fulfillment (20%)
- Customer base (15%)
- Inventory health (15%)
- Customer feedback (15%)
- Activity level (10%)

**Growth Score (0-100):**
- Revenue growth
- Order growth
- Customer growth
- Market expansion

**Engagement Score (0-100):**
- Customer engagement
- Repeat purchase rate
- Response rate
- Update frequency

---

### 7. REZ Intelligence Hub

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intelligence-hub/`

**Purpose:** Unified user/merchant profiles derived from events with finance intelligence capabilities.

#### What It Does
- Derives signals from user/merchant events
- Maintains unified profiles
- Provides finance intelligence
- Identifies credit-ready users
- Predicts default risk

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/profile/user` | POST | Create/update user profile from event |
| `/profile/user/:userId` | GET | Get user profile |
| `/api/finance/profile/:userId` | GET | Financial intent analysis |
| `/api/finance/ready-users` | GET | Identify credit-ready users |
| `/api/finance/risk/:userId` | GET | Predict default risk |

#### Profile Schema

```typescript
interface UserProfile {
  userId: string;
  derived_signals: {
    preferences: {
      cuisines: string[];
      price_range: string;
      time_pattern: string;
      dietary: string[];
    };
    intent_signals: {
      current_intent: string;
      intent_confidence: number;
      purchase_probability: number;
    };
    behavior: {
      frequency: string;
      avg_order_value: number;
      engagement_level: string;
    };
  };
  segments: string[];
}
```

---

### 8. REZ Ad Copilot

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ad-copilot/`

**Purpose:** AI-powered advertising intelligence for optimized ad campaigns and budget allocation.

#### What It Does
- Campaign optimization
- Budget allocation intelligence
- Ad performance analytics
- Audience targeting insights
- Creative recommendations

---

### 9. REZ Error Intelligence

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-error-intelligence/`

**Purpose:** Central error knowledge base for the entire REZ ecosystem.

#### What It Does
- Tracks errors across 20+ repositories
- Creates unified view of all errors
- Documents root causes and fixes
- Implements prevention systems
- Generates weekly analytics

#### Error Format
```
[SERVICE][TYPE] Short description
ERR-{TYPE}-{NNN}
```

Examples:
- `[WALLET][BUILD] Missing mongoose dependency`
- `[GATEWAY][DEPLOY] Missing API_KEY environment variable`

---

## Data Flow

### Event Capture Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Event Capture Flow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. App Event                                                               │
│     └─▶ REZ-MIND-CLIENT (SDK)                                               │
│            │                                                                 │
│            ▼                                                                 │
│  2. HTTP POST to Event Platform                                             │
│     └─▶ Webhook processing                                                  │
│            │                                                                 │
│            ▼                                                                 │
│  3. Intent Graph Service                                                    │
│     └─▶ IntentCaptureService.capture()                                      │
│            │                                                                 │
│            ├──▶ Signal weight calculation                                    │
│            ├──▶ Confidence update                                            │
│            ├──▶ MongoDB storage                                              │
│            └──▶ Redis cache invalidation                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dormant Intent Revival Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Dormant Intent Revival Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Intent Activity                                                             │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────┐     No activity     ┌─────────────┐                           │
│  │  ACTIVE │ ──────────────────▶ │   DORMANT   │                           │
│  └─────────┘     7+ days         └──────┬──────┘                           │
│                                          │                                   │
│                                          ▼                                   │
│                                 ┌─────────────────┐                          │
│                                 │ Calculate       │                          │
│                                 │ Revival Score   │                          │
│                                 └────────┬────────┘                          │
│                                          │                                   │
│                                          ▼                                   │
│                                 ┌─────────────────┐                          │
│                                 │ Score >= 0.3?   │──No──▶ Wait             │
│                                 └────────┬────────┘                          │
│                                          │Yes                                 │
│                                          ▼                                   │
│                                 ┌─────────────────┐                          │
│                                 │ Queue Nudge     │                          │
│                                 │ Job             │                          │
│                                 └────────┬────────┘                          │
│                                          │                                   │
│                                          ▼                                   │
│                                 ┌─────────────────┐                          │
│                                 │ Deliver via     │                          │
│                                 │ Push/Email/SMS  │                          │
│                                 └────────┬────────┘                          │
│                                          │                                   │
│       ┌──────────────────────────────────┴────────────────────────────┐      │
│       │                                                             │      │
│       ▼                                                             ▼      │
│  ┌─────────┐                                                  ┌─────────┐ │
│  │CONVERTED│                                                  │DECLINED │ │
│  └─────────┘                                                  └─────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Swarm Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Agent Swarm Architecture                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Shared Memory (Redis)                              │   │
│  │  demand:merchant:* │ scarcity:merchant:* │ profiles:userId:*         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐        │
│  │  Demand     │          │  Scarcity   │          │  Perso-     │        │
│  │  Signal     │          │  Agent      │          │  nalization │        │
│  │  Agent      │          │             │          │  Agent      │        │
│  └──────┬──────┘          └──────┬──────┘          └──────┬──────┘        │
│         │                         │                         │                │
│         └─────────────────────────┼─────────────────────────┘                │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Swarm Coordinator                                  │   │
│  │  - Lifecycle management    - Health monitoring    - Message routing    │   │
│  │  - Dangerous mode control - Emergency stop       - Agent orchestration │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Intent Graph Core API

#### Intent Capture
```bash
POST /api/intent/capture
Headers: x-internal-token: <token>
Body: {
  userId: string;
  appType: 'hotel_ota' | 'restaurant' | 'retail' | 'hotel_guest';
  eventType: 'search' | 'view' | 'wishlist' | 'cart_add' | 'hold' | 'checkout_start' | 'fulfilled';
  category: 'TRAVEL' | 'DINING' | 'RETAIL' | 'HOTEL_SERVICE' | 'GENERAL';
  intentKey: string;
  intentQuery?: string;
  metadata?: Record<string, any>;
}
```

#### Intent Retrieval
```bash
GET  /api/intent/active/:userId      # Get active intents
GET  /api/intent/dormant/:userId     # Get dormant intents
GET  /api/intent/user/:userId        # Get all user intents
GET  /api/intent/profile/:userId     # Get cross-app profile
GET  /api/intent/enriched/:userId     # Get enriched context
```

#### Dormant Intent Management
```bash
POST /api/intent/revival              # Trigger revival
POST /api/intent/revived/:id         # Mark as revived
POST /api/intent/pause/:id           # Pause nudges
GET  /api/intent/scheduled-revivals   # Get due nudges
```

#### Nudge Management
```bash
POST /api/intent/nudge/send          # Send a nudge
GET  /api/intent/nudge/history/:userId  # Nudge history
GET  /api/intent/stats               # Intent statistics
```

### Commerce Memory API

```bash
GET /api/commerce-memory/context/:userId   # Full context
GET /api/commerce-memory/enriched/:userId  # Enriched for AI
POST /api/commerce-memory/revival/trigger # Trigger revival
POST /api/commerce-memory/offer/send      # Send offer
```

### Merchant Demand API

```bash
GET /api/merchant/:id/demand/dashboard    # Complete dashboard
GET /api/merchant/:id/demand/signal      # Real-time signal
GET /api/merchant/:id/procurement        # Procurement signals
GET /api/merchant/:id/intents/top        # Top intents
GET /api/merchant/:id/trends             # Demand trends
GET /api/merchant/:id/locations          # City insights
GET /api/merchant/:id/pricing            # Price expectations
POST /api/merchant/:id/alerts           # Configure alerts
```

### Autonomous Mode (Agent Server)

```bash
POST /api/autonomous/start              # Enable full autonomy
POST /api/autonomous/stop             # Disable autonomy
POST /api/autonomous/action           # Execute dangerous action
POST /api/autonomous/emergency-stop   # Emergency stop
GET  /api/autonomous/status          # Get status
```

### WebSocket Subscriptions

```javascript
// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'intent:user:{userId}',           // User intent updates
  channel: 'intent:merchant:{merchantId}',   // Merchant demand updates
  channel: 'intent:global',                   // Global statistics
  channel: 'agent:events',                   // Agent lifecycle events
  channel: 'nudge:user:{userId}',             // Nudge delivery events
  channel: 'commerce:memory:{userId}'          // Commerce memory updates
}));
```

---

## Integrations

### Service URLs (Source of Truth)

| Service | Environment Variable | Default |
|---------|---------------------|---------|
| Wallet | `WALLET_SERVICE_URL` | `http://localhost:4004` |
| Monolith | `MONOLITH_URL` | `http://localhost:4000` |
| Order | `ORDER_SERVICE_URL` | `http://localhost:4006` |
| Payment | `PAYMENT_SERVICE_URL` | `http://localhost:4002` |
| Merchant | `MERCHANT_SERVICE_URL` | `http://localhost:4003` |
| Notification | `NOTIFICATION_SERVICE_URL` | `http://localhost:4005` |
| Auth | `AUTH_SERVICE_URL` | `http://localhost:4001` |
| Catalog | `CATALOG_SERVICE_URL` | `http://localhost:4007` |
| Search | `SEARCH_SERVICE_URL` | `http://localhost:4008` |
| Marketing | `MARKETING_SERVICE_URL` | `http://localhost:4009` |
| Gamification | `GAMIFICATION_SERVICE_URL` | `http://localhost:4010` |
| Ads | `ADS_SERVICE_URL` | `http://localhost:4011` |
| PMS | `PMS_SERVICE_URL` | `http://localhost:4012` |
| Analytics | `ANALYTICS_SERVICE_URL` | `http://localhost:4013` |
| Insights | `INSIGHTS_SERVICE_URL` | `http://localhost:4014` |

### Webhook Integration

**REZ Support Copilot Webhooks:**
```env
ORDER_SERVICE_WEBHOOK_URL=https://REZ-support-copilot.onrender.com/webhooks
ORDER_SERVICE_WEBHOOK_SECRET=your-secure-webhook-secret
```

**REZ Mind Webhooks:**
```bash
POST /webhooks/hotel/search             # Hotel search event
POST /webhooks/hotel/hold              # Booking hold event
POST /webhooks/hotel/confirm           # Booking confirmed
POST /webhooks/restaurant/view         # Restaurant view
POST /webhooks/restaurant/add-to-cart  # Add to cart
POST /webhooks/restaurant/order        # Order placed
POST /webhooks/nudge/delivered        # Nudge delivery callback
POST /webhooks/nudge/clicked          # Nudge click callback
POST /webhooks/nudge/converted        # Nudge conversion callback
```

---

## Features

### Intent Capture (82 Event Types)

| Category | Events |
|----------|--------|
| Search | `search_query`, `search_result_clicked`, `search_filter_applied` |
| View | `item_viewed`, `restaurant_viewed`, `hotel_viewed`, `page_viewed` |
| Interest | `wishlist_add`, `favorites_add`, `save_for_later` |
| Cart | `cart_add`, `cart_remove`, `cart_update`, `cart_abandoned` |
| Checkout | `checkout_start`, `checkout_complete`, `payment_initiated` |
| Booking | `hold_created`, `hold_expired`, `booking_confirmed`, `booking_cancelled` |
| Order | `order_placed`, `order_accepted`, `order_preparing`, `order_ready`, `order_delivered`, `order_completed`, `order_cancelled` |
| Review | `rating_given`, `review_written`, `review_helpful` |

### 8 Autonomous Agents

| Agent | Schedule | Purpose |
|-------|----------|---------|
| **DemandSignalAgent** | Every 5 min | Aggregate demand per merchant/category |
| **ScarcityAgent** | Every 1 min | Supply/demand ratios, urgency alerts |
| **PersonalizationAgent** | Event-driven | User response profiling, A/B testing |
| **AttributionAgent** | Event-driven | Multi-touch conversion attribution |
| **AdaptiveScoringAgent** | Hourly | ML retraining of intent scoring |
| **FeedbackLoopAgent** | Event-driven | Closed-loop optimization, drift detection |
| **NetworkEffectAgent** | Daily | Collaborative filtering, user similarity |
| **RevenueAttributionAgent** | Every 15 min | GMV tracking, ROI per agent/nudge |

### Revival Trigger Types

| Trigger | Bonus | Use Case |
|---------|-------|----------|
| `price_drop` | +0.25 | Item price decreased |
| `return_user` | +0.15-0.25 | User returns after absence |
| `seasonality` | +0.10-0.25 | Weekend/holiday alignment |
| `offer_match` | +0.15-0.25 | Discount/cashback available |
| `manual` | +0.05 | Agent-initiated |

### Nudge Channels

- Push Notification (via notification service)
- Email
- SMS
- In-App Message

---

## Database Schema

### MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `intents` | User intent records |
| `dormantintents` | Dormant purchase tracking |
| `intentsequences` | Event sequence tracking |
| `crossappintentprofiles` | Cross-app user profiles |
| `merchantknowledge` | Merchant knowledge base |
| `nudges` | Nudge delivery records |
| `nudgescheduiles` | User nudge preferences |
| `merchantdemandsignals` | Aggregated demand |

### Indexes (Auto-created)

```javascript
// Intents
{ userId: 1, status: 1 }
{ merchantId: 1, category: 1 }
{ intentKey: 1, appType: 1 }
{ lastSeenAt: 1 }
{ status: 1, lastSeenAt: 1 }

// DormantIntents
{ userId: 1, status: 1 }
{ revivalScore: -1 }
{ status: 1, idealRevivalAt: 1 }

// Nudges
{ userId: 1, createdAt: -1 }
{ dormantIntentId: 1 }
{ status: 1 }
```

---

## Roadmap

### Phase 1-3: Core Intelligence (Completed)
- [x] Intent capture and storage
- [x] Cross-app profile aggregation
- [x] Dormant intent detection
- [x] Revival engine

### Phase 4: Agent OS (Completed)
- [x] 8 autonomous agents
- [x] Swarm coordinator
- [x] Shared memory
- [x] Dangerous mode controls

### Phase 5: Merchant Demand Signals (Completed)
- [x] Demand dashboard
- [x] Procurement signals
- [x] Trend analysis
- [x] Location insights

### Phase 6: Real-time WebSocket (Completed)
- [x] WebSocket server
- [x] Live subscriptions
- [x] Prometheus metrics
- [x] Health checking

### Phase 7: Production Hardening (In Progress)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Log aggregation
- [ ] SLA monitoring
- [ ] Auto-scaling configuration

### Phase 8: Advanced Intelligence (Planned)
- [ ] ML-based demand forecasting
- [ ] Predictive personalization
- [ ] Automated procurement workflows
- [ ] Cross-border intelligence

---

## Deployment

### Docker Compose

```bash
docker-compose -f docker-compose.rez-mind.yml up -d
```

### Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-app
PORT=3005
NODE_ENV=production
INTERNAL_SERVICE_TOKEN=your-secret-token
REDIS_URL=redis://localhost:6379
```

### Health Check

```bash
curl http://localhost:3005/health
```

### Service Health

```bash
curl http://localhost:3005/api/services/health
```

---

## Monitoring

### Prometheus Metrics

```
# Intent metrics
intent_graph_intents_captured_total
intent_graph_intents_dormant_total
intent_graph_intents_fulfilled_total

# Nudge metrics
intent_graph_nudges_sent_total
intent_graph_nudges_converted_total

# Latency metrics
intent_graph_capture_latency_ms_avg
intent_graph_query_latency_ms_p99

# System metrics
intent_graph_process_memory_bytes
intent_graph_process_uptime_seconds
intent_graph_cache_entries
```

### Alert Thresholds

| Alert | Condition |
|-------|-----------|
| IntentGraphDown | Service health check fails |
| IntentCaptureLatencyHigh | p99 > 1000ms for 5 minutes |
| NudgeConversionLow | Conversion rate < 2% |
| AgentFailureRateHigh | Failure rate > 10% |

---

## Appendix: Quick Reference

### Service Ports

| Service | Port |
|---------|------|
| REZ Intent Graph | 3005 |
| REZ Support Copilot | 4033 |
| REZ Merchant Copilot | 4022 |
| REZ Intelligence Hub | 4020 |
| REZ User Intelligence | 3004 |
| REZ Merchant Intelligence | 4012 |

### Event Platform

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:4008` |
| Production | `https://rez-event-platform.onrender.com` |

### Authentication Headers

```bash
# Internal service-to-service
X-Internal-Token: <INTERNAL_SERVICE_TOKEN>

# Merchant authentication
X-Merchant-Token: <merchant_jwt_token>

# Cron job authentication
X-Cron-Secret: <INTENT_CRON_SECRET>

# Webhook signature
X-Webhook-Signature: <webhook_secret>
```

---

# Appendix: ML Infrastructure & Auto-Learning

## Learning Architecture

### Feedback Loop
```
┌─────────────────────────────────────────────────────────────────┐
│ LEARNING CYCLE                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                │
│  │ ACT         │ 1. Model makes prediction                     │
│  │             │ "85% chance user will buy"                    │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ OBSERVE    │ 2. User behavior observed                       │
│  │             │ User actually bought = YES                   │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ FEEDBACK   │ 3. Feedback collected                          │
│  │             │ Prediction: 85%, Actual: 100%, Error: 15%     │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ LEARN      │ 4. Model updates weights                       │
│  │             │ • Increase weight for successful signals        │
│  └──────┬──────┘                                                │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │ BETTER     │ 5. Next prediction is better                   │
│  │ PREDICT    │ "88% chance..."                                │
│  └─────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What Gets Learned

| Learning Target | How It's Learned |
|----------------|------------------|
| **Signal Weights** | High-intent actions get higher weights when they predict conversions |
| **Dormancy Thresholds** | Adjusted based on conversion rates per category |
| **Optimal Nudge Timing** | When users convert vs ignore tells best send time |
| **Price Sensitivity** | Users who convert on discounts vs those who don't |
| **Seasonality** | Patterns in when intents become active |
| **Velocity Bonuses** | Time between signals affects confidence |

---

## Auto-Retraining Pipeline

### Training Schedules

| Model | Schedule | Quality Gate | Auto-Promote |
|-------|----------|--------------|--------------|
| **Fraud Detection** | Weekly (Sunday 2 AM) | 70% accuracy | Yes |
| **Recommendation** | Bi-weekly | 60% accuracy | Yes |
| **Price Optimization** | Monthly | 65% accuracy | No (manual) |
| **Intent Scoring** | Weekly | 75% accuracy | Yes |

### Retraining Triggers

| Trigger | Description |
|---------|-------------|
| **Scheduled** | Time-based interval exceeded |
| **Performance** | Accuracy dropped below threshold |
| **Drift** | Data distribution changed significantly |
| **Manual** | API call to trigger retraining |

### Quality Gates

```
Accuracy >= 70% AND
Precision >= 65% AND
Recall >= 60% AND
F1 Score >= 65%
```

### Auto-Promotion Flow

```
Training Complete
       │
       ▼
┌─────────────────┐
│ Quality Gates   │──No──▶ Human Review Required
│ All Passed?     │
└────────┬────────┘
         │Yes
         ▼
┌─────────────────┐
│ Auto-Promote    │
│ Enabled?        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   Yes        No
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│ Auto    │ │ Human  │
│ Deploy │ │ Approve │
└─────────┘ └─────────┘
```

---

## Drift Detection

### Population Stability Index (PSI)

| PSI Range | Status | Action |
|-----------|--------|--------|
| < 0.1 | **STABLE** | No action needed |
| 0.1 - 0.25 | **MODERATE** | Watch closely |
| > 0.25 | **SIGNIFICANT** | Trigger retraining |

### What Gets Monitored

| Metric | Description |
|--------|-------------|
| **Feature Drift** | Feature value distributions changing |
| **Prediction Drift** | Model outputting different predictions |
| **Conversion Drift** | Users converting at different rates |
| **Latency Drift** | System response time degradation |
| **Volume Drift** | Sudden changes in event volume |

### Drift Detection Algorithm

```
PSI = Σ (Actual% - Expected%) × ln(Actual% / Expected%)
```

### Alert Types

| Alert | Severity | Action |
|-------|----------|--------|
| `DRIFT_DETECTED` | Warning | Investigate feature |
| `HIGH_NULL_RATE` | Critical | Fix data pipeline |
| `MODEL_ACCURACY_DROPPED` | Critical | Trigger retraining |
| `PREDICTION_BIAS` | Warning | Audit model |
| `DATA_FRESHNESS` | Warning | Check data source |

---

## Feature Store

### Purpose
Centralized feature computation and caching for ML models.

### Features

| Feature | TTL | Description |
|---------|-----|-------------|
| User features | 1800s | Affinities, scores, segments |
| Product features | 3600s | Popularity, ratings, conversion |
| Merchant features | 1800s | Health scores, demand signals |
| Transaction features | Real-time | Velocity, fraud signals |

### Supported Features

**User Features:**
- `purchase_frequency`
- `active_intent_count`
- `avg_session_duration`
- `credit_score`
- `travel_affinity`
- `dining_affinity`
- `retail_affinity`
- `days_since_last_activity`
- `conversion_probability`

**Product Features:**
- `popularity_score`
- `avg_rating`
- `conversion_rate`
- `stock_level`

**Merchant Features:**
- `merchant_rating`
- `total_orders`
- `avg_order_value`
- `fulfillment_rate`

---

## Model Registry

### Version Tracking

| Field | Description |
|-------|-------------|
| `version` | Semantic version (1.0.0) |
| `status` | staging/production/archived |
| `metrics` | Accuracy, precision, recall, F1 |
| `deployedAt` | Deployment timestamp |
| `createdBy` | Training job identifier |

### Model Lifecycle

```
staging → production → archived
   │          │           │
   │          │           └── Old versions
   │          │
   │          └── Active in production
   │
   └── Newest, under testing
```

---

## Training Data Generation

### Data Types

| Type | Count | Source |
|------|-------|---------|
| **Fraud samples** | 10,000+ | Transaction patterns |
| **Intent samples** | 50,000+ | User behavior events |
| **Recommendation** | 20,000+ | User-item interactions |

### Labeling

| Source | Priority | Use Case |
|--------|----------|----------|
| **Human** | P0 | High-value predictions |
| **System** | P1 | Standard predictions |
| **Heuristic** | P2 | Fallback labels |

---

**Document Version:** 2.0.0
**Last Updated:** 2026-05-06
**Maintained By:** REZ AI Engineering Team
