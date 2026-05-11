# Intent Graph Service Audit Report

**Service:** ReZ Mind (Intent Graph)
**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/`
**Audit Date:** 2026-05-05

---

## Executive Summary

The Intent Graph Service (ReZ Mind) is an AI-powered commerce intelligence platform that combines RTMN Commerce Memory with ReZ Agent OS. It tracks user purchase intent across the ReZ ecosystem, orchestrates revival nudges, and runs 8 autonomous AI agents for real-time decision making.

**Key Numbers:**
- 8 autonomous AI agents
- 17 action types (dangerous operations)
- 4 app types tracked (hotel_ota, restaurant, retail, hotel_guest)
- 3 main categories (TRAVEL, DINING, RETAIL)
- 8 MongoDB collections
- Multiple external service integrations

---

## Core Features

### 1. Intent Capture System

**Feature:** Intent Signal Capture
- **Description:** Captures user intent signals from various app events (search, view, wishlist, cart_add, hold, checkout_start, booking_confirmed, fulfilled, abandoned)
- **Signals Captured:**
  - Event type and weight
  - Timestamp
  - User context (userId, appType, category)
  - Merchant context
  - Custom metadata
- **Targeting:** Confidence scoring based on signal weighting, recency multiplier, and velocity bonus
- **Files:** `src/services/IntentCaptureService.ts`

**Feature:** Intent Confidence Scoring
- **Description:** Calculates confidence scores (0-1) based on multiple factors
- **Signals:** Signal weights (0.15-1.0 by event type), recency, velocity
- **Targeting:** Higher confidence = higher priority for nudges and recommendations
- **Formula:** `confidence = base + (signalWeight * recencyMultiplier) + velocityBonus`

**Feature:** Event Sequence Tracking
- **Description:** Tracks the sequence of events for each intent
- **Signals:** Sequence order, duration between events, event types
- **Targeting:** Identifies conversion path patterns

---

### 2. Dormant Intent Revival Engine

**Feature:** Dormant Intent Detection
- **Description:** Detects intents inactive for 7+ days with confidence < 0.3
- **Signals:** lastSeenAt, confidence score, days dormant
- **Targeting:** Cron job runs daily to identify revival candidates
- **Files:** `src/services/DormantIntentService.ts`, `src/jobs/dormantIntentCron.ts`

**Feature:** Revival Score Calculation
- **Description:** Calculates urgency to revive dormant intents
- **Signals:** Intent strength (40%), days dormant (25%), category affinity (20%), price match (15%)
- **Formula:** `revivalScore = (confidence x 0.4) + (min(days/30, 1) x 0.25) + (affinity/100 x 0.2) + priceMatchBonus`
- **Targeting:** Score >= 0.3 qualifies for nudge queue

**Feature:** Trigger Events
- **Description:** External events that boost revival scores
- **Triggers:** price_drop (+0.25), return_user (+0.15-0.25), seasonality (+0.10-0.25), offer_match (+0.15-0.25), manual (+0.05)
- **Targeting:** Immediate nudge when triggered

**Feature:** Nudge Delivery System
- **Description:** Multi-channel nudge delivery (push, email, SMS, in_app)
- **Signals:** Channel open/click/convert rates, optimal send times
- **Targeting:** Personalized message templates by category and trigger type

---

### 3. Cross-App Aggregation

**Feature:** Unified User Profile
- **Description:** Aggregates user intent data across all ReZ apps
- **Signals:** Intent counts per app type, dormant counts, conversions
- **Targeting:** Cross-sell opportunities based on affinity patterns
- **Files:** `src/services/CrossAppAggregationService.ts`

**Feature:** Affinity Scoring
- **Description:** Calculates affinity scores (0-100) for each category
- **Signals:** Travel affinity, dining affinity, retail affinity
- **Targeting:** Dominant category determines primary recommendations
- **Formula:** `(categoryCount / total) * 100` for each category

**Feature:** Enriched Context
- **Description:** Comprehensive context for agents (active + dormant intents + suggestions)
- **Signals:** Active intents, dormant intents with revival scores, suggested nudges
- **Targeting:** Enables personalized agent actions

---

### 4. Merchant Demand Intelligence

**Feature:** Real-time Demand Signals
- **Description:** Aggregates consumer demand per merchant/category
- **Signals:** Demand count, unmet demand %, trend direction, spike detection
- **Targeting:** Merchants can optimize inventory and pricing
- **Files:** `src/api/merchant.routes.ts`, `src/agents/demand-signal-agent.ts`

**Feature:** Procurement Recommendations
- **Description:** Identifies inventory gaps and expansion opportunities
- **Signals:** Total market demand, gap scores, seasonality patterns
- **Targeting:** expand_inventory, launch_category, optimize_pricing, expand_location

**Feature:** Price Expectations
- **Description:** Data-driven pricing insights
- **Signals:** Average price, high-intent user price expectations, sample size
- **Targeting:** Competitive pricing recommendations

**Feature:** Location Insights
- **Description:** Geographic demand distribution
- **Signals:** City demand counts, demand percentages
- **Targeting:** Expansion planning, targeted campaigns

---

### 5. 8 Autonomous AI Agents

#### Agent 1: DemandSignalAgent
- **Schedule:** Every 5 minutes
- **Purpose:** Real-time demand aggregation across all apps
- **Signals:** Demand count, unmet demand, spike detection (z-score > 2), top cities
- **Targeting:** Updates merchant dashboards, auto-triggers price adjustments
- **Dangerous Actions:** adjust_price (up to 10%), update_merchant_dashboard
- **Files:** `src/agents/demand-signal-agent.ts`

#### Agent 2: ScarcityAgent
- **Schedule:** Every 1 minute
- **Purpose:** Real-time supply/demand ratio monitoring
- **Signals:** Supply count, demand count, scarcity score (0-100), urgency level
- **Targeting:** Urgency nudges when scarcity >= 50
- **Dangerous Actions:** send_urgency_nudge, alert_support
- **Files:** `src/agents/scarcity-agent.ts`

#### Agent 3: PersonalizationAgent
- **Schedule:** Event-driven (also every 1 minute)
- **Purpose:** Learn from user response patterns, optimize send times
- **Signals:** Open rates, click rates, conversion rates by channel, optimal hours
- **Targeting:** Personalized channel selection, A/B variant selection
- **Dangerous Actions:** pause_strategy (low-performing channels), send_nudge
- **Files:** `src/agents/personalization-agent.ts`

#### Agent 4: AttributionAgent
- **Schedule:** Every 1 minute
- **Purpose:** Full-funnel attribution tracking
- **Signals:** Touchpoints (impression, click, convert, organic), channel attribution
- **Models:** first, last, linear, time_decay, position
- **Targeting:** Multi-touch conversion attribution
- **Dangerous Actions:** pause_strategy, reallocate_budget
- **Files:** `src/agents/attribution-agent.ts`

#### Agent 5: AdaptiveScoringAgent
- **Schedule:** Every 1 hour
- **Purpose:** ML-based confidence scoring
- **Signals:** User history, time-of-day, category, price, velocity factors
- **Model:** Gradient descent weight optimization
- **Targeting:** Predicted conversion probability
- **Dangerous Actions:** retrain_model, threshold_adjust
- **Files:** `src/agents/adaptive-scoring-agent.ts`

#### Agent 6: FeedbackLoopAgent
- **Schedule:** Every 1 hour
- **Purpose:** Closed-loop optimization, drift detection
- **Signals:** Brier score (accuracy), conversion rate drift, revival effectiveness
- **Targeting:** Auto-applies high-confidence recommendations
- **Dangerous Actions:** Auto-adjusts agent parameters
- **Files:** `src/agents/feedback-loop-agent.ts`

#### Agent 7: NetworkEffectAgent
- **Schedule:** Every 24 hours
- **Purpose:** Collaborative filtering, user similarity clusters
- **Signals:** User affinity vectors, conversion rates, cohort recommendations
- **Targeting:** Trending signals, cohort-based nudges
- **Dangerous Actions:** send_nudge (cohort campaigns)
- **Files:** `src/agents/network-effect-agent.ts`

#### Agent 8: RevenueAttributionAgent
- **Schedule:** Every 15 minutes
- **Purpose:** P&L impact measurement, ROI tracking
- **Signals:** Nudge GMV, organic GMV, conversion lift, ROI by channel/merchant
- **Targeting:** Pauses underperforming nudges, reallocates budgets
- **Dangerous Actions:** pause_nudge_campaign, reallocate_budget
- **Files:** `src/agents/revenue-attribution-agent.ts`

---

### 6. Action Trigger System

**Feature:** 17 Action Types
- **Low Risk:** send_nudge, send_urgency_nudge, update_merchant_dashboard, alert_support, trigger_revival, threshold_adjust
- **Medium Risk:** adjust_price (max 10%), pause_strategy, pause_nudge_campaign, retrain_model, charge_wallet, refund_wallet
- **High Risk:** reallocate_budget, send_to_pms, send_to_merchant_os
- **Critical Risk:** route_to_task_queue, update_order_status, send_staff_notification

**Feature:** Circuit Breaker Pattern
- **Description:** Prevents cascading failures
- **Settings:** 10 failure threshold, 5-minute reset timeout
- **Files:** `src/agents/action-trigger.ts`

**Feature:** Dangerous Mode Controls
- **Description:** Fine-grained permissions for autonomous operations
- **Settings:** allowWalletOperations, allowPriceAdjustments, allowStrategyPause, allowBudgetReallocation, allowAutoRevival
- **Safety:** maxConsecutiveActions limit (default: 100), emergency stop
- **Files:** `src/agents/swarm-coordinator.ts`

---

### 7. External Service Integrations

**Feature:** Phase 2 Real Service Integration
- **Wallet Service:** Coin debit/credit, balance queries
- **Order Service:** Order creation, status updates
- **Notification Service:** Push notifications
- **Merchant Service:** Merchant operations
- **PMS Service:** Property management (room service, housekeeping)
- **Circuit Breaker:** Per-service failure tracking with fallback

**Feature:** Service URLs
- **Pattern:** All URLs from env vars, localhost fallbacks in dev only
- **Validation:** Production warns but doesn't block if missing
- **Files:** `src/config/services.ts`, `src/integrations/external-services.ts`

---

### 8. Webhook Event Processing

**Hotel OTA Events:**
- `POST /webhooks/hotel/search` - Capture hotel search intent
- `POST /webhooks/hotel/hold` - Capture booking hold
- `POST /webhooks/hotel/confirm` - Capture fulfilled booking

**Restaurant Events:**
- `POST /webhooks/restaurant/view` - Capture restaurant/menu view
- `POST /webhooks/restaurant/add-to-cart` - Capture add to cart
- `POST /webhooks/restaurant/order` - Capture order placed

**Nudge Events:**
- `POST /webhooks/nudge/delivered` - Nudge delivery callback
- `POST /webhooks/nudge/clicked` - Nudge click callback
- `POST /webhooks/nudge/converted` - Nudge conversion callback

**Batch Events:**
- `POST /webhooks/batch/capture` - Batch capture multiple intents

---

### 9. Vector Similarity Service

**Feature:** Intent Embeddings
- **Description:** Generates embeddings for intent similarity search
- **Options:** OpenAI embeddings (text-embedding-3-small) or hash-based fallback
- **Algorithm:** Cosine similarity (threshold 0.3-0.4)
- **Files:** `src/services/VectorSimilarityService.ts`

**Feature:** Collaborative Filtering
- **Description:** Recommendations based on similar users
- **Signals:** User affinity vectors, category preferences
- **Targeting:** Personalized item recommendations

---

### 10. Redis Streams & Caching

**Feature:** Real-time Stream Processing
- **Streams:** intent events, nudge events, analytics
- **Consumer Groups:** intent-graph-processors
- **Recovery:** Pending message claiming after crashes
- **Files:** `src/services/streamService.ts`

**Feature:** Intent Cache Service
- **TTLs:** Active intents (5m), user profiles (1h), dormant intents (10m)
- **Fallback:** In-memory Map when Redis unavailable
- **Files:** `src/services/IntentCacheService.ts`

---

### 11. Shared Memory Hub

**Feature:** Redis-based Inter-Agent Communication
- **Purpose:** Distributed state sharing across agent instances
- **Keys:** Demand signals, scarcity signals, user profiles, attribution records, scored intents, optimizations, collaborative signals, revenue reports, agent health
- **Pub/Sub:** Redis + in-memory fallback
- **Files:** `src/agents/shared-memory.ts`

---

### 12. Monitoring & Health

**Feature:** Health Checks
- **Checks:** Database, Redis, external services, circuit breakers
- **Endpoints:** `/health`, `/api/monitoring/health`
- **Files:** `src/health/index.ts`

**Feature:** Metrics Collection
- **Intent Metrics:** captured, dormant, fulfilled
- **Nudge Metrics:** sent, delivered, clicked, converted, failed
- **Agent Metrics:** duration, success rate
- **Service Metrics:** request totals, latency, errors
- **Files:** `src/monitoring/metrics.ts`

**Feature:** Alert System
- **Severities:** info, warning, critical
- **Default Thresholds:** Conversion rate (<5%), nudge conversion (<2%)
- **Alert Types:** revenue_drop, scarcity_warning, anomaly

---

### 13. WebSocket Server

**Feature:** Real-time Subscriptions
- **Channels:** demand_signals, scarcity_alerts, nudge_events, system_metrics, merchant_dashboard, user_intents
- **Message Types:** subscribed, event, initial_data, connected
- **Files:** `src/websocket/` (Phase 6)

---

### 14. Insights Service

**Feature:** AI-generated Insights
- **Types:** upsell, cross_sell, reactivation, loyalty, personalization, dormant_recovery
- **Confidence Levels:** High (>=0.75), Medium (>=0.5), Low (>=0.3)
- **Output:** Stored in rez-insights-service
- **Files:** `src/services/insightService.ts`

---

## Data Models

### MongoDB Collections

| Collection | Purpose | Key Indexes |
|---|---|---|
| `intents` | User intent records | userId+appType+intentKey (unique), userId+status, status+lastSeenAt |
| `dormantintents` | Dormant purchase tracking | userId+status, status+revivalScore |
| `intentsequences` | Event sequence tracking | intentId, sequenceOrder |
| `crossappintentprofiles` | Cross-app user profiles | userId (unique), affinities |
| `merchantknowledge` | Merchant knowledge base | merchantId, category |
| `nudges` | Nudge delivery records | userId+status, status+createdAt |
| `nudgescheduiles` | User nudge preferences | userId |
| `merchantdemandsignals` | Aggregated demand | merchantId+category |

---

## API Endpoints Summary

### Intent Capture (8 endpoints)
- `POST /api/intent/capture` - Capture intent signal
- `GET /api/intent/active/:userId` - Get active intents
- `GET /api/intent/dormant/:userId` - Get dormant intents
- `GET /api/intent/user/:userId` - Get all user intents
- `GET /api/intent/profile/:userId` - Get cross-app profile
- `GET /api/intent/enriched/:userId` - Get enriched context
- `GET /api/intent/stats` - Aggregate statistics

### Dormant Intent Management (6 endpoints)
- `POST /api/intent/revival` - Trigger revival
- `POST /api/intent/revived/:id` - Mark as revived
- `POST /api/intent/pause/:id` - Pause nudges
- `POST /api/intent/cron/detect-dormant` - Cron detection
- `POST /api/intent/cron/update-scores` - Cron score update

### Nudge Management (3 endpoints)
- `POST /api/intent/nudge/send` - Send nudge
- `GET /api/intent/nudge/history/:userId` - Nudge history
- `POST /api/intent/nudge/process` - Process scheduled nudges

### Merchant Demand (8 endpoints)
- `GET /api/merchant/:id/demand/dashboard` - Demand overview
- `GET /api/merchant/:id/demand/signal` - Real-time signal
- `GET /api/merchant/:id/procurement` - Procurement signals
- `GET /api/merchant/:id/intents/top` - Top intents
- `GET /api/merchant/:id/trends` - Demand trends
- `GET /api/merchant/:id/locations` - City insights
- `GET /api/merchant/:id/pricing` - Price expectations
- `POST /api/merchant/:id/alerts` - Configure alerts

### Similarity & Recommendations (4 endpoints)
- `GET /api/intent/similar` - Find similar intents
- `GET /api/intent/recommendations` - Get recommendations
- `GET /api/intent/similar/global` - Global similar intents
- `GET /api/intent/affinities/:userId` - User affinities

### Autonomous Mode (5 endpoints)
- `POST /api/autonomous/start` - Enable autonomy
- `POST /api/autonomous/stop` - Disable autonomy
- `POST /api/autonomous/action` - Execute dangerous action
- `POST /api/autonomous/emergency-stop` - Emergency stop
- `GET /api/autonomous/status` - Get status

### Agent Tools (6 endpoints)
- `GET /api/agent/tools` - List tools
- `POST /api/agent/tools/execute` - Execute tool
- `GET /api/agent/intents/:userId` - Agent intents
- `GET /api/agent/dormant/:userId` - Agent dormant
- `GET /api/agent/enrich/:userId` - Agent enriched context
- `GET /api/swarm/status` - Swarm status

### Monitoring (5 endpoints)
- `GET /api/monitoring/health` - Detailed health
- `GET /api/monitoring/metrics` - All metrics
- `GET /api/monitoring/metrics/export` - Prometheus export
- `GET /api/monitoring/alerts` - Active alerts
- `GET /api/services/health` - External services

---

## Issues and Bugs Found

### 1. Security: Merchant IDOR Vulnerability
**Location:** `src/api/merchant.routes.ts` (lines 86-124)
**Severity:** Medium
**Issue:** The `authorizeMerchantAccess` middleware has a development fallback that allows any merchant token in non-production environments. This could allow IDOR attacks if `NODE_ENV` is misconfigured.
**Recommendation:** Remove dev fallback in production; require proper JWT validation.

### 2. Security: Legacy Token Fallback
**Location:** `src/api/merchant.routes.ts` (lines 67-79)
**Severity:** Medium
**Issue:** Legacy check accepts any token >= 16 characters without JWT validation in production. Comment says "In production, all merchant tokens should be JWTs" but enforcement is only a warning.
**Recommendation:** Make JWT validation mandatory in production.

### 3. Security: Webhook Secret Bypass
**Location:** `src/api/webhooks.ts` (lines 18-37)
**Severity:** Medium
**Issue:** When `INTENT_WEBHOOK_SECRET` is not configured, it only warns in production but still allows the request.
**Recommendation:** Reject webhooks in production if secret is not configured.

### 4. Potential: Infinite Loop in SharedMemory.keys()
**Location:** `src/agents/shared-memory.ts` (lines 293-317)
**Severity:** Low
**Issue:** Pattern matching with `*` could be slow on large key sets. Redis SCAN would be more efficient than KEYS.
**Recommendation:** Use Redis SCAN with cursor for production scale.

### 5. Potential: Memory Leak in Action History
**Location:** `src/agents/action-trigger.ts` (line 214)
**Severity:** Low
**Issue:** `actionHistory` array grows unbounded. Only `slice(-limit)` is used but array itself is never trimmed.
**Recommendation:** Implement circular buffer or periodic cleanup.

### 6. Potential: Race Condition in Daily Nudge Counts
**Location:** `src/agents/action-trigger.ts` (lines 243-247)
**Severity:** Low
**Issue:** `dailyNudgeCounts` Map is in-memory only. With multiple instances, limits won't be enforced correctly.
**Recommendation:** Move to Redis for distributed enforcement.

### 7. Bug: Intent Query Extractor
**Location:** `src/agents/demand-signal-agent.ts` (lines 138-158)
**Severity:** Low
**Issue:** `getTopCities()` extracts city from metadata, but metadata schema is not enforced. City may be null/undefined causing inconsistent results.
**Recommendation:** Validate metadata schema or provide fallback.

### 8. Potential: OpenAI API Key Exposure
**Location:** `src/services/VectorSimilarityService.ts` (lines 68-99)
**Severity:** Medium
**Issue:** OpenAI API key stored in process.env and used directly. Key could be logged if error handling fails.
**Recommendation:** Use a secrets manager in production.

### 9. Performance: N+1 Query in DormantIntentService
**Location:** `src/services/DormantIntentService.ts` (lines 195-226)
**Severity:** Low
**Issue:** `getDormantIntentsByMerchant()` performs individual queries inside a loop.
**Recommendation:** Use aggregation pipeline instead.

### 10. Configuration: Default Thresholds Hardcoded
**Location:** Multiple agent files
**Severity:** Info
**Issue:** Scoring thresholds (DORMANCY_THRESHOLD_DAYS=7, MIN_CONFIDENCE=0.3, etc.) are hardcoded instead of env-configurable.
**Recommendation:** Move to configuration for easier tuning.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ReZ Mind Intent Graph                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────┐ │
│  │ Hotel OTA App   │    │ Restaurant App  │    │ Retail App │ │
│  └───────┬────────┘    └───────┬────────┘    └──────┬───────┘ │
│          │                     │                     │         │
│          └─────────────────────┼─────────────────────┘         │
│                                │                               │
│                                ▼                               │
│  ┌───────────────────────────────────────────────────────┐   │
│  │              Intent Capture Service                      │   │
│  │  • Signal weighting  • Confidence scoring                │   │
│  │  • Velocity bonus   • Sequence tracking                  │   │
│  └───────────────────────┬───────────────────────────────┘   │
│                          │                                      │
│          ┌───────────────┼───────────────┐                    │
│          ▼               ▼               ▼                    │
│  ┌────────────┐  ┌─────────────┐  ┌────────────────┐          │
│  │  Intent    │  │ DormantIntent│  │CrossAppProfile │          │
│  │  (MongoDB) │  │  (MongoDB)  │  │   (MongoDB)    │          │
│  └────────────┘  └─────────────┘  └────────────────┘          │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │           Swarm Coordinator (Dangerous Mode)             │     │
│  │                                                          │     │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────┐        │     │
│  │  │ Demand    │ │ Scarcity │ │ Personalization│        │     │
│  │  │ Signal    │ │          │ │               │        │     │
│  │  │ (5 min)  │ │ (1 min)  │ │  (1 min)     │        │     │
│  │  └───────────┘ └───────────┘ └───────────────┘        │     │
│  │                                                          │     │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────┐        │     │
│  │  │ Attribu-  │ │ Adaptive │ │ Feedback      │        │     │
│  │  │ tion      │ │ Scoring  │ │ Loop          │        │     │
│  │  │ (1 min)  │ │ (1 hr)  │ │  (1 hr)      │        │     │
│  │  └───────────┘ └───────────┘ └───────────────┘        │     │
│  │                                                          │     │
│  │  ┌───────────┐ ┌───────────┐                          │     │
│  │  │ Network   │ │ Revenue   │                          │     │
│  │  │ Effect   │ │Attrib     │                          │     │
│  │  │ (24 hr)  │ │(15 min)  │                          │     │
│  │  └───────────┘ └───────────┘                          │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Action Trigger System                      │     │
│  │  • Circuit breakers  • Dangerous mode controls         │     │
│  │  • 17 action types  • Emergency stop                  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Shared Memory (Redis)                     │     │
│  │  • Demand signals  • Scarcity signals                │     │
│  │  • User profiles   • Attribution records               │     │
│  │  • Pub/Sub messaging                                 │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

### Production
- `express` - HTTP server
- `mongoose` - MongoDB ODM
- `ioredis` - Redis client
- `jsonwebtoken` - JWT validation
- `zod` - Schema validation
- `winston` - Logging

### Development
- `typescript` - Type safety
- `tsx` - TypeScript execution
- `jest` - Testing
- `@types/*` - Type definitions

---

## Files Reference

| Path | Purpose |
|---|---|
| `src/services/IntentCaptureService.ts` | Core intent capture logic |
| `src/services/DormantIntentService.ts` | Dormant intent detection/revival |
| `src/services/CrossAppAggregationService.ts` | Cross-app user profiles |
| `src/services/IntentScoringService.ts` | ML-based scoring |
| `src/services/VectorSimilarityService.ts` | Similarity search |
| `src/services/IntentCacheService.ts` | Redis caching layer |
| `src/services/streamService.ts` | Redis Streams |
| `src/services/insightService.ts` | AI insights generation |
| `src/agents/demand-signal-agent.ts` | Agent 1 |
| `src/agents/scarcity-agent.ts` | Agent 2 |
| `src/agents/personalization-agent.ts` | Agent 3 |
| `src/agents/attribution-agent.ts` | Agent 4 |
| `src/agents/adaptive-scoring-agent.ts` | Agent 5 |
| `src/agents/feedback-loop-agent.ts` | Agent 6 |
| `src/agents/network-effect-agent.ts` | Agent 7 |
| `src/agents/revenue-attribution-agent.ts` | Agent 8 |
| `src/agents/swarm-coordinator.ts` | Agent orchestration |
| `src/agents/action-trigger.ts` | Autonomous actions |
| `src/agents/shared-memory.ts` | Redis shared state |
| `src/api/intent.routes.ts` | Intent endpoints |
| `src/api/merchant.routes.ts` | Merchant endpoints |
| `src/api/webhooks.ts` | Webhook handlers |
| `src/models/*.ts` | MongoDB schemas |
| `src/config/services.ts` | External service URLs |
| `src/middleware/*.ts` | Auth, rate limiting, circuit breaker |
| `src/health/index.ts` | Health checks |
| `src/monitoring/metrics.ts` | Prometheus metrics |

---

## Summary Statistics

| Metric | Value |
|---|---|
| Total Source Files | ~80 |
| Core Services | 8 |
| AI Agents | 8 |
| API Routes | ~40 |
| MongoDB Collections | 8 |
| External Integrations | 12 |
| Action Types | 17 |
| Webhook Types | 10 |
| Config Env Vars | 15+ |
