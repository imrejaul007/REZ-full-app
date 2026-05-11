# REZ Mind - Production Database Schema

Version: 1.0.0 | Updated: 2026-05-01

---

## Core Philosophy

```
Raw Events → Process → Derive Signals → Store Intelligence

❌ NOT: Store everything
✅ YES: Store structured, usable intelligence
```

---

## 5-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. IDENTITY LAYER (Users, Merchants)                               │
├─────────────────────────────────────────────────────────────────────┤
│ 2. EVENT LAYER (Raw events, SHORT-TERM, TTL 7-30 days)             │
├─────────────────────────────────────────────────────────────────────┤
│ 3. INTELLIGENCE LAYER (CORE 🔥 - Derived signals, PERMANENT)      │
├─────────────────────────────────────────────────────────────────────┤
│ 4. DECISION LAYER (Suggestions, Recommendations)                  │
├─────────────────────────────────────────────────────────────────────┤
│ 5. FEEDBACK LAYER (Outcomes, Learning signals)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. IDENTITY LAYER

### users
```javascript
{
  id: "uuid",
  phone: "+91-XXXXXXXXXX",
  email: "string",
  created_at: "timestamp",
  status: "active | blocked",
  consent: {
    personalization: true,
    ads: true,
    marketing: false
  }
}
```

### merchants
```javascript
{
  id: "uuid",
  name: "string",
  category: "restaurant | salon | hotel | retail",
  location: {
    lat: 0,
    lng: 0,
    city: "string"
  },
  created_at: "timestamp",
  status: "active | blocked"
}
```

---

## 2. EVENT LAYER (SHORT-TERM, TTL: 7-30 days)

### events
```javascript
{
  id: "uuid",
  type: "user.search | user.purchase | user.booking | inventory.low",
  user_id: "uuid",
  merchant_id: "uuid",
  payload: {
    // Event-specific data (minimal)
  },
  timestamp: "timestamp",
  correlation_id: "string"
}
// TTL: 30 days
// Auto-delete after processing
```

---

## 3. INTELLIGENCE LAYER (CORE 🔥)

### user_intelligence
```javascript
{
  user_id: "uuid",
  
  // DERIVED PREFERENCES (not raw data)
  preferences: {
    food: ["biryani", "pizza"],
    categories: ["spa", "fitness"],
    price_range: "medium",
    dietary: []
  },
  
  // BEHAVIOR PATTERNS
  behavior: {
    avg_spend: 450,
    frequency: "weekly",
    time_pattern: "evening",
    preferred_channel: "app"
  },
  
  // CURRENT INTENT
  intent: {
    current: "looking_for_dinner",
    confidence: 0.78,
    last_updated: "timestamp"
  },
  
  // SEGMENTS (categorical)
  segments: ["foodies", "deal_seekers"],
  
  // SCORES (normalized 0-1)
  scores: {
    ltv: 12000,
    churn_risk: 0.2,        // 0-1, higher = more risk
    engagement: 0.85,
    purchase_probability: 0.65
  },
  
  // LOCATION CONTEXT
  location_context: {
    current_city: "Mumbai",
    home_area: "BTM"
  },
  
  last_updated: "timestamp"
}
```

### merchant_intelligence
```javascript
{
  merchant_id: "uuid",
  
  // DEMAND PATTERNS
  demand_pattern: {
    peak_days: ["Friday", "Saturday"],
    peak_hours: ["7PM-10PM"],
    trend: "increasing | stable | decreasing"
  },
  
  // CUSTOMER INSIGHTS
  customer_segments: ["deal_seekers", "families"],
  avg_customer_spend: 350,
  
  // BUSINESS BEHAVIOR
  behavior: {
    pricing_type: "discount_sensitive",
    order_pattern: "bulk_weekend",
    restock_frequency: "weekly"
  },
  
  // SCORES
  scores: {
    health: 0.82,
    growth: 0.65,
    engagement: 0.70
  },
  
  // RECOMMENDATIONS (active)
  active_recommendations: [
    {
      type: "inventory",
      item: "chicken",
      action: "reorder",
      priority: "high"
    }
  ],
  
  last_updated: "timestamp"
}
```

### context_intelligence
```javascript
{
  location_id: "area_code",
  
  // DEMAND TRENDS (derived, not raw events)
  demand_trends: {
    biryani: "+20%",
    spa: "+10%"
  },
  
  // TIME PATTERNS
  time_pattern: "evening_peak",
  
  // LOCAL EVENTS
  events: ["weekend", "festival"],
  
  last_updated: "timestamp"
}
```

---

## 4. DECISION LAYER

### decisions
```javascript
{
  id: "uuid",
  type: "recommendation | reorder | ad_targeting",
  
  // WHO
  user_id: "uuid",
  merchant_id: "uuid",
  
  // INPUT CONTEXT
  input: {
    intent: "dinner",
    context: "evening",
    location: "BTM"
  },
  
  // OUTPUT
  output: {
    suggestion: "order 10 units",
    items: ["biryani"],
    ads: ["spa_offer"]
  },
  
  // METADATA
  confidence: 0.82,
  safety_level: "SAFE | SEMI_SAFE | RISKY",
  
  created_at: "timestamp"
}
```

---

## 5. FEEDBACK LAYER

### feedback
```javascript
{
  id: "uuid",
  decision_id: "uuid",
  
  // WHO
  user_id: "uuid",
  merchant_id: "uuid",
  
  // OUTCOME
  action: "accepted | modified | rejected | ignored",
  
  // MODIFICATION (if changed)
  modification: {
    from: 10,
    to: 12,
    delta_percent: 20
  },
  
  // REASON (categorical, not raw text)
  reason: {
    category: "high_demand | low_trust | constraint | preference",
    detail: "Weekend rush"
  },
  
  created_at: "timestamp"
}
```

---

## System Flow

```
USER ACTION
    ↓
EVENT (short-term, 30 days)
    ↓
PROCESSING (derived signals)
    ↓
INTELLIGENCE (permanent, compact)
    ↓
DECISION (suggestion/recommendation)
    ↓
FEEDBACK (outcome)
    ↓
INTELLIGENCE UPDATE (improved)
```

---

## Critical Rules

### 1. Intelligence ≠ Events
```
Events = temporary (30 days)
Intelligence = permanent (until updated)
```

### 2. No duplication
```
ONLY Intelligence Layer is source of truth
Other layers READ from it
```

### 3. Keep compact
```
❌ Store 1000 signals
✅ Store 10 powerful signals
```

### 4. Privacy-safe
```
❌ Raw search queries
❌ Individual transactions
❌ Personal details
✅ Derived patterns
✅ Categorical segments
✅ Normalized scores
```

---

## What Each Layer Enables

### User Side
- Better search (intent-based)
- Better recommendations (preference-based)
- Personalized UI

### Merchant Side
- Smart inventory (demand patterns)
- Better pricing (customer insights)
- Targeted offers

### AdBazaar
- Intent-based ads (not surveillance)
- Higher ROI
- Better conversion

---

## Cross-App Intelligence (Superpower)

```
Rejaul books hotel in Bangalore
    ↓
ReZ Mind detects: TRAVEL CONTEXT
    ↓
Shows:
- Restaurants in Bangalore
- Salons nearby
- Travel-specific offers
```

---

## Privacy by Design

```javascript
// Only store signals, not raw data
user_intelligence: {
  // ✅ Good
  preferences: ["biryani", "pizza"],
  time_pattern: "evening",
  segments: ["foodies"]
  
  // ❌ Bad
  last_10_searches: ["biryani near me", "best biryani"],
  exact_locations_visited: [...]
}
```

---

## Implementation Checklist

- [ ] Create user_intelligence collection
- [ ] Create merchant_intelligence collection
- [ ] Create context_intelligence collection
- [ ] Implement event processing pipeline
- [ ] Add TTL to events collection
- [ ] Create decision collection
- [ ] Create feedback collection
- [ ] Implement intelligence update logic
- [ ] Add privacy checks

---

Last updated: 2026-05-01
