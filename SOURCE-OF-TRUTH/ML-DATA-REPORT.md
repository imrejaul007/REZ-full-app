# ML/AI Data Infrastructure Report

**Generated:** 2026-05-04
**Lead:** ML/AI Data Lead
**Status:** Audit Complete

---

## Executive Summary

The REZ ecosystem has a **well-structured but incomplete ML infrastructure**. Core components for intent prediction, dormancy detection, and user profiling are implemented, but significant gaps exist in formal ML training pipelines, feature monitoring, and model versioning.

### Key Findings

| Component | Status | Coverage |
|-----------|--------|----------|
| Intent Data Schema | **Production** | 95% |
| Feature Engineering | **Production** | 70% |
| Training Data Collection | **Partial** | 40% |
| Model Monitoring | **Basic** | 50% |
| Drift Detection | **Implemented** | 60% |
| ML Model Registry | **Missing** | 0% |

---

## 1. ML Data Architecture

### 1.1 Primary Data Stores

```
MongoDB Collections (rez-intent-graph)
├── Intent              - Core intent tracking with signals
├── DormantIntent       - Dormant purchase intent management
├── CrossAppIntentProfile - Cross-app user profiling
├── VibeProfile         - User behavioral classification
├── MicroMoment         - Session micro-moment detection
├── MerchantDemandSignal - Merchant demand aggregation
└── Nudge               - Nudge delivery tracking

MongoDB Collections (rez-intent-predictor)
├── UserIntentProfile   - Session-based intent scoring
└── SessionEvent        - Real-time session events
```

### 1.2 ML Services Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent Swarm                               │
├─────────────────────────────────────────────────────────────────┤
│  [AdaptiveScoringAgent]    - ML confidence scoring (sigmoid)    │
│  [FeedbackLoopAgent]       - Closed-loop optimization           │
│  [PersonalizationAgent]    - User preference learning           │
│  [ScarcityAgent]          - Supply/demand detection            │
│  [DemandSignalAgent]      - Demand aggregation                  │
│  [DormantIntentService]   - Dormancy/revival logic             │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌──────────┴──────────┐
                    │   MongoDB           │
                    │   Intent Graph      │
                    └──────────┬──────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  rez-intent-predictor (port 4018) - Real-time scoring          │
│  rez-ads-service (port 3000)      - Ad targeting & attribution  │
│  rez-ai-worker                   - AI worker (Claude)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Feature Inventory

### 2.1 Core Intent Features

| Feature Name | Type | Source | Computed | Cached |
|--------------|------|--------|----------|--------|
| `userId` | String | Intent Capture | No | No |
| `category` | Enum | Intent Capture | No | No |
| `appType` | Enum | Intent Capture | No | No |
| `intentKey` | String | Intent Capture | No | No |
| `confidence` | Float [0-1] | IntentScoringService | **Yes** | No |
| `status` | Enum | DormantIntentService | **Yes** | No |
| `signalCount` | Integer | Intent Model | Yes | No |
| `avgVelocity` | Float | IntentScoringService | **Yes** | No |
| `daysActive` | Integer | Derived | Yes | No |
| `firstSeenAt` | DateTime | Intent Capture | No | No |
| `lastSeenAt` | DateTime | Intent Capture | No | No |

### 2.2 Scoring Features (AdaptiveScoringAgent)

```typescript
interface ScoringFeatures {
  userHistoryScore: number;    // Weight: 0.25
  timeOfDayScore: number;      // Weight: 0.10
  categoryScore: number;       // Weight: 0.15
  priceScore: number;          // Weight: 0.20
  velocityScore: number;       // Weight: 0.30
}
```

**Feature Computation:**
- `userHistoryScore`: 30-day conversion rate analysis
- `timeOfDayScore`: Peak hours (6-9 AM, 6-9 PM) = 0.9
- `categoryScore`: 7-day category conversion rate
- `priceScore`: Price sensitivity curve (peak $50-200)
- `velocityScore`: Signals per hour analysis

### 2.3 User Intent Profile Features (rez-intent-predictor)

```typescript
interface IntentSignals {
  search_queries: string[];
  browse_history: Array<{ url, product_id, category, timestamp, duration }>;
  cart_behavior: { items_added, items_removed, cart_value, last_cart_update };
  time_on_page: Map<string, number>;
  scroll_depth: Map<string, number>;
  device_type: 'mobile' | 'tablet' | 'desktop';
  session_context: { referrer, utm_source, utm_medium, utm_campaign };
  repeated_views: Map<string, number>;
  price_sensitivity: { discount_clicks, price_filter_usage, compare_count };
}
```

### 2.4 Cross-App Profile Features

| Feature | Description | Range |
|---------|-------------|-------|
| `travelAffinity` | Travel category affinity | 0-100 |
| `diningAffinity` | Dining category affinity | 0-100 |
| `retailAffinity` | Retail category affinity | 0-100 |
| `travelIntentCount` | Active travel intents | Integer |
| `diningIntentCount` | Active dining intents | Integer |
| `retailIntentCount` | Active retail intents | Integer |
| `dormantTravelCount` | Dormant travel intents | Integer |
| `totalConversions` | Total fulfilled intents | Integer |

### 2.5 Vibe Profile Features (Spontaa-inspired)

```typescript
interface IVibeProfile {
  primaryVibe: 'spontaneous' | 'planned' | 'quality' | 'budget' | 'social' | 'solitary' | 'luxury' | 'adventurous';
  secondaryVibe: string;
  intensity: number;           // 0-1
  travelSpontaneity: number;   // 0-1
  diningSpontaneity: number;    // 0-1
  spendingProfile: 'budget' | 'moderate' | 'premium' | 'luxury';
  socialScore: number;          // 0-1
  derivedFromSignals: string[];
}
```

### 2.6 Intent Category Weights

| Event Type | Weight | Description |
|------------|--------|-------------|
| `fulfilled` | 1.0 | Conversion |
| `checkout_start` | 0.40 | High intent |
| `hold` | 0.35 | Reservation intent |
| `cart_add` | 0.30 | Purchase intent |
| `wishlist` | 0.25 | Save intent |
| `search` | 0.15 | Discovery intent |
| `view` | 0.10 | Browse intent |
| `abandoned` | -0.20 | Negative signal |

---

## 3. Training Data Status

### 3.1 Current Training Data Sources

| Source | Type | Volume | Labeled | Current Use |
|--------|------|--------|---------|-------------|
| Intent signals | Implicit | Growing | Partial | Model training |
| Transaction patterns | Explicit | Limited | Yes | Pattern matching |
| Purchase intent signals | Implicit | Growing | Partial | Intent scoring |
| Sales training data | Heuristic | Static | Yes | Template generation |

### 3.2 Training Data Gaps

**CRITICAL GAPS IDENTIFIED:**

1. **No formal labeled training set**
   - Current labels derived from `status === 'FULFILLED'`
   - No human-annotated training samples
   - Cold-start problem for new categories

2. **Training data in external systems**
   - `do-app/do-backend/src/services/trainingData.ts` - Contains static training patterns
   - `REZ-support-copilot/training-data/` - Customer support training data (unreachable)
   - No unified training data pipeline

3. **Missing data augmentation**
   - No synthetic data generation
   - No minority class oversampling
   - No adversarial example generation

### 3.3 Training Data Patterns (Static)

```typescript
// From do-app/trainingData.ts
const PURCHASE_INTENT_SIGNALS = {
  high: ['i want to book', 'can i reserve', 'is it available', ...],
  medium: ['looking for', 'thinking about', 'considering', ...],
  low: ['browsing', 'just checking', 'maybe someday', ...]
};

const CUSTOMER_STAGES = {
  new: { description: 'First 3 transactions', triggers: ['welcome_offer', ...] },
  exploring: { description: '4-10 transactions', ... },
  regular: { description: '11-30 transactions', ... },
  loyal: { description: '31+ transactions', ... },
  advocate: { description: 'Referral active', ... }
};
```

### 3.4 Train/Test Split

| Split | Method | Ratio | Current Status |
|-------|--------|-------|---------------|
| Temporal | Time-based | 80/20 | Implemented in aggregation queries |
| Stratified | By category | Preserved | Partial |
| Holdout | Last N days | 7 days | Implemented in FeedbackLoopAgent |

---

## 4. Model Inventory

### 4.1 Production Models

| Model | Type | Input Features | Output | Status |
|-------|------|--------------|--------|--------|
| Intent Confidence | Logistic Regression | signals, time, category | probability [0-1] | Production |
| Revival Score | Weighted Sum | dormancy, timing, nudges | score [0-1] | Production |
| Vibe Classification | Rule-based | signal velocity, confidence | vibe category | Production |
| Micro-moment Detection | Rule-based | eventType, signals | moment type | Production |

### 4.2 Model Weights (AdaptiveScoringAgent)

```typescript
const currentWeights = {
  userHistory: 0.25,
  timeOfDay: 0.10,
  category: 0.15,
  price: 0.20,
  velocity: 0.30,
  bias: -0.5,
  version: '1.0.0'
};
```

**Scoring Formula:**
```javascript
rawScore = sum(feature * weight) + bias
predictedConversionProb = 1 / (1 + exp(-rawScore))
```

### 4.3 Missing Models

| Model | Priority | Gap |
|-------|----------|-----|
| Price optimization | High | No model exists |
| Fraud detection | High | No model exists |
| Product recommendations | Medium | Rule-based only |
| A/B test prediction | Medium | No model exists |
| User lifetime value | Low | Simple formula |

---

## 5. Feature Engineering Assessment

### 5.1 Current Practices

**POSITIVE:**
- Feature extraction via aggregation pipelines
- Batch processing with Promise.allSettled
- N+1 query elimination in DormantIntentService
- Feature versioning in model weights

**ISSUES:**
- No feature store
- No feature registry
- Features not cached between requests
- No feature selection/importance analysis

### 5.2 Feature Computation Latency

| Feature | Computation | Latency | Acceptable |
|---------|-------------|---------|------------|
| User history score | 30-day aggregation | ~100ms | Yes |
| Category score | 7-day aggregation | ~50ms | Yes |
| Velocity score | In-memory | ~10ms | Yes |
| Revival score | Bulk aggregation | ~200ms | No |

### 5.3 Feature Storage Recommendations

```typescript
// Recommended feature cache structure
interface CachedFeatures {
  userId: string;
  features: {
    travelAffinity: { value: number; computedAt: Date; ttl: number };
    diningAffinity: { value: number; computedAt: Date; ttl: number };
    userHistoryScore: { value: number; computedAt: Date; ttl: number };
  };
  lastUpdated: Date;
}
```

---

## 6. Monitoring & Drift Detection

### 6.1 Current Monitoring (FeedbackLoopAgent)

```typescript
const DRIFT_THRESHOLDS = {
  conversionRate: 0.15,   // 15% change triggers alert
  revivalScore: 0.20,    // 20% change
  scarcityScore: 0.25,    // 25% change
  demandSignal: 0.30,    // 30% change
};
```

### 6.2 Monitored Metrics

| Metric | Method | Threshold | Alert |
|--------|--------|-----------|-------|
| Scoring accuracy | Brier score | <0.6 | Yes |
| Revival effectiveness | Conversion rate | <5% | Yes |
| Model drift | Rate comparison | 15% change | Yes |
| Scaricty alert accuracy | TP/(TP+FP) | <60% | Yes |

### 6.3 Missing Monitoring

- **No feature drift monitoring**
- **No data quality monitoring**
- **No prediction confidence calibration**
- **No real-time model performance dashboard**

---

## 7. Implementation Plan

### Phase 1: Foundation (Weeks 1-4)

| Task | Effort | Priority | Deliverable |
|------|--------|----------|-------------|
| Create feature store schema | Medium | High | MongoDB feature_cache collection |
| Implement feature TTL | Low | High | Auto-expiry on cached features |
| Add feature versioning | Low | Medium | Version field on all features |
| Document feature lineage | Medium | Medium | Feature catalog document |

### Phase 2: Training Data (Weeks 5-8)

| Task | Effort | Priority | Deliverable |
|------|--------|----------|-------------|
| Create labeled training set | High | Critical | 10K labeled samples |
| Implement train/test pipeline | Medium | High | Automated splits |
| Add data augmentation | High | Medium | Synthetic data generator |
| Create training data API | Medium | Medium | /api/training-data endpoints |

### Phase 3: Model Management (Weeks 9-12)

| Task | Effort | Priority | Deliverable |
|------|--------|----------|-------------|
| Implement ML model registry | High | Critical | Model versioning system |
| Add A/B test framework | Medium | High | Multi-model serving |
| Create drift detection dashboard | Medium | Medium | Real-time monitoring UI |
| Implement model rollback | Low | High | One-click rollback |

### Phase 4: Advanced ML (Weeks 13-16)

| Task | Effort | Priority | Deliverable |
|------|--------|----------|-------------|
| Price optimization model | High | High | Revenue uplift model |
| Product recommendations | High | High | Collaborative filtering |
| Fraud detection | Medium | Critical | Anomaly detection |
| LTV prediction | Medium | Medium | Customer lifetime value |

---

## 8. Recommendations

### 8.1 Immediate Actions (This Sprint)

1. **Create feature cache layer**
   - Add `feature_cache` MongoDB collection
   - Implement TTL-based expiry
   - Add cache warming on startup

2. **Label training data**
   - Export 10K recent intents
   - Manual labeling for 3 categories
   - Store in `training_labels` collection

3. **Add feature monitoring**
   - Track feature distribution over time
   - Alert on significant shifts
   - Log feature statistics hourly

### 8.2 Short-term (Next Month)

1. **Implement model registry**
   - Version all model weights
   - Store model metadata
   - Enable model comparison

2. **Create training pipeline**
   - Automated data extraction
   - Train/val/test splits
   - Model evaluation metrics

3. **Add drift detection**
   - Population Stability Index
   - Feature drift monitoring
   - Automated re-training triggers

### 8.3 Medium-term (Next Quarter)

1. **Feature store implementation**
   - Centralized feature computation
   - Feature sharing across models
   - Feature monitoring dashboard

2. **Advanced models**
   - Deep learning for sequence modeling
   - Graph neural networks for intent
   - Reinforcement learning for nudges

3. **ML platform**
   - Model serving infrastructure
   - A/B testing framework
   - Model performance tracking

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Feature drift degrades model | High | Medium | Monitor distributions weekly |
| Training data bias | Medium | High | Stratified sampling |
| Model staleness | High | High | Auto-retrain triggers |
| Cold-start for new users | High | Medium | Rule-based fallback |
| Cross-category generalization | Medium | Medium | Transfer learning |

---

## 10. File References

### Core ML Infrastructure
- `/packages/rez-intent-graph/src/services/IntentScoringService.ts` - Scoring logic
- `/packages/rez-intent-graph/src/services/DormantIntentService.ts` - Dormancy detection
- `/packages/rez-intent-graph/src/services/VibeScoringService.ts` - Vibe profiling
- `/packages/rez-intent-graph/src/agents/adaptive-scoring-agent.ts` - ML model agent
- `/packages/rez-intent-graph/src/agents/feedback-loop-agent.ts` - Drift detection

### Data Models
- `/packages/rez-intent-graph/src/models/Intent.ts`
- `/packages/rez-intent-graph/src/models/CrossAppIntentProfile.ts`
- `/packages/rez-intent-graph/src/models/VibeProfile.ts`
- `/packages/rez-intent-graph/src/models/DormantIntent.ts`

### Intent Predictor
- `/rez-intent-predictor/src/services/IntentScoringService.js`
- `/rez-intent-predictor/src/models/UserIntentProfile.js`

### Training Data
- `/do-app/do-backend/src/services/trainingData.ts`

### Ad Service
- `/rez-ads-service/src/services/attributionService.ts`
- `/rez-ads-service/src/models/AdCampaign.ts`

---

**END OF REPORT**
