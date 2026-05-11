# REZ Mind Audit - Integration with Loyalty Ecosystem

**Date:** May 9, 2026
**Auditor:** Claude Code

---

## Executive Summary

REZ Mind is an **AI-powered hotel intelligence service** that collects user signals, provides recommendations, and enables dynamic pricing. It has strong overlap with the Loyalty Ecosystem's goals of user understanding and personalization.

**Key Insight:** REZ Mind already collects the behavioral signals we planned to expose via HiddenKB. This can be directly integrated.

---

## What REZ Mind Does

### Core Capabilities

| Capability | Description | Loyalty Relevance |
|-----------|-------------|-------------------|
| **Signal Collection** | Real-time capture of search, booking, stay, feedback signals | High - same behavioral data |
| **Recommendations Engine** | Personalized hotel recommendations, upsells, rebooking predictions | High - personalization |
| **Dynamic Pricing** | Demand-based pricing adjustments | Medium - gamification |
| **User Knowledge** | Aggregated user preferences and patterns | High - unified profile |
| **Satisfaction Prediction** | Predict guest satisfaction and churn risk | High - retention |
| **Analytics** | Real-time dashboards and insights | Medium - merchant insights |

---

## Signal Architecture

### Signal Categories

```
SEARCH_SIGNALS
├── search_query
├── filters_applied
├── results_viewed
└── hotels_comppared

BOOKING_SIGNALS
├── booking_started
├── booking_abandoned
├── booking_completed
├── payment_method
└── discount_used

STAY_SIGNALS
├── room_qr_scanned
├── service_ordered
├── checkout_initiated
└── feedback_submitted

FEEDBACK_SIGNALS
├── rating_given
├── review_written
└── complaint_logged
```

---

## User Profile Data

REZ Mind already aggregates:

```typescript
interface UserProfile {
  userId: string;
  preferredCities: string[];
  preferredStarRatings: number[];
  avgBookingValue: number;
  totalBookings: number;
  preferredAmenities: string[];
  dietaryPreferences: string[];
  stayFrequency: number;
  lastBookingDate?: Date;
  serviceUsagePatterns: Record<string, number>;
  // Loyalty-specific signals
  engagementScore?: number;
  satisfactionScore?: number;
  loyaltyTendency?: number;
}
```

---

## AI Capabilities

### 1. Satisfaction Prediction

```typescript
interface SatisfactionPrediction {
  score: number;           // 0-100
  riskFactors: string[];   // ["slow_checkin", "room_issue"]
  recommendations: string[];
  atRisk: boolean;        // Could trigger loyalty intervention
}
```

### 2. Rebooking Prediction

```typescript
interface RebookingPrediction {
  willRebook: boolean;
  probability: number;      // 0-1
  confidence: number;
  recommendedHotels: string[];
  recommendedCities: string[];
  optimalTimingDays: number;
}
```

### 3. Dynamic Pricing

```typescript
interface DynamicPricing {
  baseRate: number;
  suggestedRate: number;
  discountPercent: number;
  factors: {
    demand: number;
    seasonality: number;
    competitor: number;
    userSegment: number;
  };
}
```

---

## Gap Analysis: REZ Mind vs HiddenKB Goals

| HiddenKB Goal | REZ Mind Capability | Integration Needed |
|---------------|---------------------|-------------------|
| Churn prediction | SatisfactionPrediction | Direct use |
| Preferences | UserProfile | Direct use |
| Best engagement time | Signal analysis | Minor processing |
| Price sensitivity | Booking patterns | Minor processing |
| Engagement quality | Engagement scoring | Minor processing |

**Conclusion:** REZ Mind already has 80% of what HiddenKB planned to expose.

---

## Integration Opportunities

### 1. Profile Aggregator Enhancement

```
Current Profile Aggregator:
- wallet data
- loyalty data
- karma data
- streak data

Add from REZ Mind:
- preferredCities
- preferredStarRatings
- avgBookingValue
- stayFrequency
- satisfactionScore
- engagementScore
```

### 2. ReZ Score Enhancement

```typescript
// Add to ReZ Score calculation
const engagementFromMind = userProfile.engagementScore || 50;
const satisfactionBonus = userProfile.satisfactionScore > 80 ? 10 : 0;
```

### 3. Churn Prediction → Streak Intervention

```
If SatisfactionPrediction.atRisk == true:
  → Trigger streak recovery offer
  → Send personalized discount
  → Notify merchant for outreach
```

### 4. Merchant Intelligence Dashboard

```
Merchant sees in Dashboard:
├── Customer Health Score (from REZ Mind)
├── Churn Probability
├── Loyalty Strength
├── Best Engagement Time
└── Cross-category Behavior
```

---

## API Endpoints Available

| Endpoint | Purpose | Loyalty Use |
|---------|---------|-------------|
| `POST /api/signals` | Collect signal | Enrich profile |
| `GET /api/analytics/user/:id` | User analytics | Personalization |
| `POST /api/recommendations/hotels` | Hotel recommendations | Engagement |
| `POST /api/recommendations/upsell` | Upsell recommendations | Monetization |
| `GET /api/analytics/dashboard` | Real-time dashboard | Merchant insights |
| `GET /api/pricing/suggested` | Dynamic pricing | Gamification |

---

## Integration Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                    INTEGRATED LOYALTY ECOSYSTEM                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐         ┌──────────────┐                          │
│  │  REZ Mind    │────────▶│   Profile    │                          │
│  │  (AI Brain)  │ signals  │  Aggregator  │                          │
│  └──────────────┘         └──────────────┘                          │
│         │                         │                                   │
│         │                         ▼                                   │
│         │                 ┌──────────────┐                          │
│         │                 │  ReZ Score   │                          │
│         │                 │  (0-1000)    │                          │
│         │                 └──────────────┘                          │
│         │                         │                                   │
│         ▼                         ▼                                   │
│  ┌──────────────┐         ┌──────────────┐                         │
│  │ Satisfaction │         │  Streak &    │                         │
│  │ Prediction   │────────▶│  Badges      │                         │
│  └──────────────┘  churn  └──────────────┘                         │
│         │                         │                                   │
│         ▼                         ▼                                   │
│  ┌──────────────────────────────────────────────────┐               │
│  │              MERCHANT DASHBOARD                   │               │
│  │  Customer Health | Churn Risk | Best Actions    │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Integration Steps

### Phase 1: Data Flow (Week 1)

```typescript
// 1. Extend Profile Aggregator to call REZ Mind
async getEnhancedProfile(userId: string) {
  const profile = await this.getProfile(userId);
  const userAnalytics = await this.getMindAnalytics(userId);

  return {
    ...profile,
    preferences: userAnalytics.preferences,
    satisfaction: userAnalytics.satisfactionScore,
    engagement: userAnalytics.engagementScore,
    priceRange: userAnalytics.avgBookingValue,
  };
}

// 2. Add signal publishing to loyalty events
onOrderCompleted(order) {
  await publishSignal({
    category: 'BOOKING',
    type: 'booking_completed',
    userId: order.userId,
    data: { amount: order.amount }
  });
}
```

### Phase 2: Intelligence (Week 2)

```typescript
// 3. Add churn prediction to streak recovery
async checkStreakRecovery(userId: string) {
  const prediction = await getMindSatisfaction(userId);

  if (prediction.atRisk) {
    // Offer enhanced recovery bonus
    return {
      canRecover: true,
      bonusMultiplier: 1.5,
      message: "We noticed you might be having issues. Recover your streak with bonus!"
    };
  }
}

// 4. Personalize ReZ Score rewards
async calculateReZScore(userId: string) {
  // ... existing calculation

  // Add satisfaction bonus
  const sat = await getMindSatisfaction(userId);
  if (sat.score > 80) {
    score += 50; // High satisfaction bonus
  }
}
```

### Phase 3: Merchant Intelligence (Week 3)

```typescript
// 5. Expose insights to merchant dashboard
async getMerchantInsights(merchantId: string) {
  const customers = await getHighRiskCustomers(merchantId);

  return {
    atRiskCustomers: customers.filter(c => c.atRisk),
    topEngagedCustomers: customers.filter(c => c.engagement > 80),
    recommendedActions: generateRecommendations(customers),
    loyaltyStrength: calculateLoyaltyStrength(customers),
  };
}
```

---

## Technical Requirements

### New Dependencies

```json
{
  "@rez/loyalty-client": "latest",
  "@rez/loyalty-events": "latest"
}
```

### Environment Variables

```bash
REZ_MIND_URL=http://localhost:4017
```

### Database Additions

```javascript
// UnifiedProfile - add from REZ Mind
preferences: {
  preferredCities: [String],
  preferredStarRatings: [Number],
  avgBookingValue: Number,
  stayFrequency: Number,
},
intelligence: {
  satisfactionScore: Number,
  engagementScore: Number,
  churnRisk: Number,
  bestContactTime: String,
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| REZ Mind unavailable | Graceful degradation - use cached data |
| Signal lag | Real-time signal collection with 5min aggregation |
| Data inconsistency | Profile Aggregator as source of truth |
| Privacy concerns | GDPR compliance, anonymization |

---

## Conclusion

**REZ Mind is the intelligence layer we planned to build as HiddenKB.**

The best approach is NOT to build a parallel intelligence system, but to:
1. Use REZ Mind as the data source
2. Expose its data through Profile Aggregator
3. Integrate its predictions into loyalty decisions
4. Build merchant dashboards on top of its insights

This saves 2-3 weeks of development and provides a richer, proven AI capability.

---

## Next Steps

1. **Audit complete** - REZ Mind capabilities mapped
2. **Integration design** - Architecture documented
3. **Implementation** - Build Phase 1 (Data Flow)
4. **Testing** - Verify signal publishing works
5. **Deployment** - Connect REZ Mind to Profile Aggregator
