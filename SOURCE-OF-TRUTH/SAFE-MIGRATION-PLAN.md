# ReZ Ecosystem - Safe Migration Plan
**Date:** May 4, 2026
**Status:** MIGRATION PLAN
**Priority:** ZERO FEATURE LOSS

---

## Principle: UPGRADE NOT DOWNGRADE

1. **NO feature deletion** until migration is complete
2. **Parallel operation** - Old and new systems run simultaneously
3. **Feature flags** - Every new feature behind a flag
4. **Rollback plan** - Instant revert capability
5. **Data sync** - Bidirectional sync between old and new

---

# PHASE 1: AI INTELLIGENCE PIPELINE (Week 1-4)

## Goal: Create unified `rez-intent-service` that preserves ALL features

### Week 1: Document & Map

#### Day 1-2: Feature Mapping
Create mapping document showing:
- [x] Intent Graph → rez-intent-service
- [x] Intelligence Hub → rez-intent-service
- [x] User Intelligence → rez-intent-service
- [x] Merchant Intelligence → rez-intent-service

#### Day 3-4: API Contract Design
Design unified API that supports:
```typescript
// Unified intent-service API
POST /signals/capture
GET /profiles/:userId
GET /intents/active/:userId
GET /intents/dormant/:userId
POST /nudges/schedule
GET /segments/:userId
GET /recommendations/:userId
POST /scores/calculate
```

### Week 2: Build New Service

#### Create `rez-intent-service`
```
Location: rez-intent-service/
Purpose: Unified intelligence platform
Port: 4009
```

#### Features to implement (from audit):

##### A. Intent Graph Features (MUST HAVE)
- [ ] Signal capture (search, view, wishlist, cart, checkout, fulfilled, abandoned)
- [ ] Confidence scoring with recency/velocity
- [ ] Dormancy detection (7-day threshold)
- [ ] Revival scoring (7-14 day sweet spot)
- [ ] Cross-app profile aggregation
- [ ] Vector similarity for recommendations
- [ ] Nudge delivery (push/email/sms/in_app)

##### B. Intelligence Hub Features (MUST HAVE)
- [ ] User profiles (preferences, segments, engagement)
- [ ] Merchant profiles (demand patterns, customer type)
- [ ] Financial intent analysis
- [ ] Credit readiness scoring
- [ ] Risk prediction

##### C. User Intelligence Features (MUST HAVE)
- [ ] Behavioral scoring (engagement, value, churn, upsell)
- [ ] Lifetime value tracking
- [ ] Transaction analytics
- [ ] Search intelligence
- [ ] Push token management
- [ ] Event sync to external services

##### D. Merchant Intelligence Features (MUST HAVE)
- [ ] Health scoring (6 components)
- [ ] Growth metrics
- [ ] Inventory intelligence
- [ ] Trend analysis
- [ ] Competitor analysis
- [ ] Recommendations engine

##### E. 8 AI Agents (MUST HAVE)
| Agent | Purpose | Features to Preserve |
|-------|---------|---------------------|
| Demand Signal Agent | Market intelligence | Calculate demand, detect spikes, baseline tracking |
| Scarcity Agent | Inventory urgency | Scarcity scoring, urgency generation |
| Personalization Agent | Nudge optimization | A/B testing, variant selection |
| Attribution Agent | Revenue tracking | Multi-touch attribution (5 models) |
| Adaptive Scoring Agent | ML predictions | Sigmoid probability, feature weights |
| Feedback Loop Agent | Closed-loop learning | Brier score, drift detection |
| Network Effect Agent | Collaborative filtering | User clustering, cosine similarity |
| Revenue Attribution Agent | P&L measurement | ROI calculation, conversion lift |

##### F. Copilot Features (MUST HAVE)

**Consumer Copilot (merge into unified copilot):**
- [ ] User LTV display
- [ ] Segment classification (foodies, deal_seekers)
- [ ] Purchase probability
- [ ] Churn risk scoring
- [ ] Event tracking

**Merchant Copilot (merge into unified copilot):**
- [ ] Health score (5-factor: 30% revenue, 25% orders, 20% customers, 15% reviews, 10% inventory)
- [ ] Recommendation engine (marketing, pricing, inventory, operations, customer)
- [ ] Competitor analysis (price gap, rating comparison)
- [ ] Decision engine (SAFE/SEMI_SAFE/WARNING/DANGER thresholds)

**Support Copilot (merge into unified copilot):**
- [ ] 17 intent types with regex patterns
- [ ] Entity extraction (food, time, quantity, dietary)
- [ ] Sentiment analysis
- [ ] 17 response templates
- [ ] AI classifier training data

**Admin Copilot (merge into unified copilot):**
- [ ] Event webhook schemas
- [ ] Correlation ID tracking

### Week 3: Data Sync

#### Implement bidirectional sync
```typescript
// Sync from legacy services to new service
interface SyncConfig {
  source: string;
  target: string;
  frequency: 'realtime' | 'hourly' | 'daily';
  direction: 'unidirectional' | 'bidirectional';
}
```

Sync jobs:
1. Intent Graph → rez-intent-service (real-time via Redis)
2. Intelligence Hub → rez-intent-service (hourly batch)
3. User Intelligence → rez-intent-service (hourly batch)
4. Merchant Intelligence → rez-intent-service (hourly batch)

### Week 4: Parallel Run & Validation

#### Run both systems simultaneously
```typescript
// Feature flag
const USE_NEW_INTENT_SERVICE = process.env.USE_NEW_INTENT_SERVICE === 'true';

// Route traffic
if (USE_NEW_INTENT_SERVICE) {
  return newIntentService.capture(event);
} else {
  return legacyIntentGraph.capture(event);
}
```

#### Validation tests
- [ ] All API responses match
- [ ] All ML predictions within 1% variance
- [ ] All data synced correctly
- [ ] All 8 agents running

---

# PHASE 2: COPILOT CONSOLIDATION (Week 5-6)

## Goal: Create unified `rez-copilot` that combines ALL copilots

### Week 5: Build Unified Copilot

#### Create `rez-copilot`
```
Location: rez-copilot/
Purpose: Unified AI chat interface
Port: 4026
```

#### Unified Copilot Features

##### A. User Context (from Consumer Copilot)
- [ ] User profile enrichment
- [ ] LTV display
- [ ] Segment classification
- [ ] Purchase probability
- [ ] Churn risk

##### B. Merchant Context (from Merchant Copilot)
- [ ] Health score display
- [ ] Recommendation engine
- [ ] Competitor analysis
- [ ] Decision engine
- [ ] Action levels (SAFE/SEMI_SAFE/WARNING/DANGER)

##### C. Support Context (from Support Copilot)
- [ ] 17 intent types
- [ ] Entity extraction patterns
- [ ] Sentiment analysis
- [ ] Response templates
- [ ] Escalation routing

##### D. Admin Context (from MIND Client)
- [ ] 8 webhook schemas
- [ ] Correlation ID tracking
- [ ] Event normalization

### Week 6: Route by Persona

```typescript
// Unified copilot with persona routing
interface CopilotRouter {
  route(user: UserContext): CopilotType {
    if (user.type === 'CONSUMER') return consumerCopilot;
    if (user.type === 'MERCHANT') return merchantCopilot;
    if (user.type === 'SUPPORT') return supportCopilot;
    if (user.type === 'ADMIN') return adminCopilot;
  }
}
```

---

# PHASE 3: TARGETING & ACTION CONSOLIDATION (Week 7-8)

## Goal: Create unified `rez-decision-service`

### Week 7: Build Decision Service

#### Create `rez-decision-service`
```
Location: rez-decision-service/
Purpose: Unified targeting and action execution
Port: 4027
```

#### Features to implement:

##### A. Targeting Engine (MUST HAVE)
- [ ] 9 predefined segments (high_value, churned, window_shoppers, deal_seekers, foodies, budget_minders, new_users, reorder_probability_high, recently_purchased)
- [ ] Segment evaluation (AND/OR combinators)
- [ ] A/B test variant assignment (deterministic hash)
- [ ] Frequency capping (daily/weekly/lifetime)
- [ ] Budget pacing (even/accelerated/front_loaded)
- [ ] Cost calculation with channel multipliers

##### B. Action Engine (MUST HAVE)
- [ ] 17 action types (inventory, sales, customer, supplier, finance, dashboard)
- [ ] 4 safety levels (SAFE/SEMI_SAFE/RISKY/FORBIDDEN)
- [ ] Approval queue (PENDING/APPROVED/REJECTED/CANCELLED)
- [ ] Rate limiting by level
- [ ] 6 finance nudge templates

### Week 8: Integration Testing

```typescript
// Decision pipeline
async function evaluateAndAct(userId: string, context: Context) {
  // 1. Get targeting rules
  const segments = await targetingEngine.evaluate(userId);

  // 2. Get action recommendations
  const actions = await actionEngine.suggest(context);

  // 3. Execute SAFE actions automatically
  // 4. Queue SEMI_SAFE/RISKY for approval
}
```

---

# PHASE 4: AD PLATFORM CONSOLIDATION (Week 9-12)

## Goal: Create unified `rez-ad-platform`

### Week 9-10: Build Ad Platform

#### Create `rez-ad-platform`
```
Location: rez-ad-platform/
Purpose: Unified advertising platform
Port: 4028
```

#### Features to implement:

##### A. Campaign Management (from rez-ads-service)
- [ ] Campaign CRUD
- [ ] Atomic budget checking ($expr)
- [ ] Click fraud detection (Redis sorted sets)
- [ ] Re-engagement scheduler
- [ ] AdBazaar webhook integration

##### B. QR Campaigns (from adBazaar + adsqr)
- [ ] 8-category taxonomy (outdoor_ooh, transit, property, local_business, print, influencer, digital, unconventional)
- [ ] 50+ subcategories
- [ ] QR code generation
- [ ] Multi-tier rewards (scan/visit/purchase)
- [ ] Attribution funnel tracking
- [ ] Coin budget management

##### C. Targeting (from rez-targeting-engine)
- [ ] 9 predefined segments
- [ ] Segment evaluation engine
- [ ] A/B testing
- [ ] Frequency capping
- [ ] Budget pacing
- [ ] 5-channel templates (banner/push/in_app/sms/email)

##### D. Attribution (from both systems)
- [ ] Multi-touch attribution (first/last/linear/time_decay/position)
- [ ] 24-hour attribution window
- [ ] ROI calculation
- [ ] Conversion tracking

### Week 11: Data Migration

#### Migrate from legacy systems
1. Export campaigns from rez-ads-service (MongoDB)
2. Export campaigns from adBazaar (Supabase)
3. Export campaigns from adsqr (Supabase)
4. Import into rez-ad-platform (MongoDB)
5. Validate all campaigns
6. Enable dual-write during transition

### Week 12: Cutover

#### Traffic switch
```typescript
const USE_NEW_AD_PLATFORM = process.env.USE_NEW_AD_PLATFORM === 'true';

// Route all ad traffic
if (USE_NEW_AD_PLATFORM) {
  return adPlatform.createCampaign(data);
} else {
  return rezAdsService.createCampaign(data);
}
```

---

# PHASE 5: COMMUNICATION CLEANUP (Week 13-14)

## Goal: Clear responsibility boundaries

### Week 13: Document & Test

#### Document communication patterns
```typescript
// Clear responsibilities
const CommunicationLayer = {
  // Layer 1: Cache & Sessions
  redis: {
    use: ['sessions', 'cache', 'rate-limit', 'pub-sub'],
    dont: ['job processing', 'real-time']
  },

  // Layer 2: Async Jobs
  bullmq: {
    use: ['email', 'sms', 'push', 'webhooks', 'scheduled'],
    dont: ['real-time', 'sessions']
  },

  // Layer 3: Real-time
  socketio: {
    use: ['order-updates', 'chat', 'kds', 'notifications'],
    dont: ['background processing', 'persistent data']
  }
};
```

### Week 14: Enforce via Architecture

Add lint rules to prevent misuse:
```typescript
// No Redis for job processing
// No BullMQ for real-time
// No Socket.IO for async
```

---

# ROLLBACK PLAN

## Instant Rollback Capability

```bash
# Week 4 rollback
export USE_NEW_INTENT_SERVICE=false

# Week 8 rollback
export USE_NEW_DECISION_SERVICE=false

# Week 12 rollback
export USE_NEW_AD_PLATFORM=false
```

## Data Rollback

```bash
# Restore from backup
mongodump --archive=pre-migration.archive
mongorestore --archive=pre-migration.archive
```

---

# VALIDATION CHECKLIST

## Pre-Migration (Every Phase)

- [ ] All features documented
- [ ] All APIs mapped
- [ ] All tests written
- [ ] All data schemas validated
- [ ] Rollback tested

## Post-Migration (Every Phase)

- [ ] Smoke tests pass
- [ ] Integration tests pass
- [ ] Performance benchmarks match
- [ ] No regression in UX
- [ ] Monitoring shows healthy

---

# FEATURE PRESERVATION SUMMARY

## AI/Intelligence (50+ features)
- [x] Intent capture (8 event types)
- [x] ML scoring (sigmoid probability)
- [x] Dormancy detection (7-day threshold)
- [x] Revival scoring (7-14 day sweet spot)
- [x] 8 AI agents (all cron jobs)
- [x] Feedback loop (Brier score)
- [x] Collaborative filtering (cosine similarity)
- [x] User/Merchant profiles
- [x] Health scoring (6 components)
- [x] Churn prediction (5 factors)
- [x] LTV tracking

## Copilots (40+ features)
- [x] 17 intent types
- [x] Entity extraction (food/time/qty/dietary)
- [x] Sentiment analysis
- [x] 17 response templates
- [x] Health score (5-factor)
- [x] Recommendation engine
- [x] Competitor analysis
- [x] Decision engine (4 levels)

## Ads (60+ features)
- [x] Campaign CRUD
- [x] Atomic budget checking
- [x] Click fraud detection
- [x] 9 targeting segments
- [x] A/B testing
- [x] Frequency capping
- [x] Budget pacing
- [x] 8-category taxonomy
- [x] 50+ subcategories
- [x] QR generation
- [x] Multi-tier rewards
- [x] Attribution funnel
- [x] 5-channel templates
- [x] Multi-touch attribution (5 models)

## Communication (15+ features)
- [x] 10 BullMQ queues
- [x] Redis Streams (rez:events)
- [x] Socket.IO namespaces (/kitchen, /staff, /groups, /loyalty)
- [x] Rate limiting
- [x] Event deduplication

---

# METRICS

## Before (Fragmented)
| System | Count |
|--------|-------|
| Intent Services | 4 |
| Copilots | 5 |
| Ad Systems | 3 |
| Communication Patterns | 3 |

## After (Unified)
| System | Count |
|--------|-------|
| Intent Service | 1 (rez-intent-service) |
| Copilot | 1 (rez-copilot) |
| Decision Service | 1 (rez-decision-service) |
| Ad Platform | 1 (rez-ad-platform) |

## Consolidation Ratio: 12 → 4 (75% reduction)

---

*Plan generated: May 4, 2026*
*Estimated duration: 14 weeks*
*Zero feature loss guaranteed*
