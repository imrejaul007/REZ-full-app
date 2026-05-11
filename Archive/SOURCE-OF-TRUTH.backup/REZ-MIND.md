# REZ Mind - Complete Documentation

Version: 1.0.0 | Updated: 2026-05-01

---

## What is ReZ Mind?

ReZ Mind is the **AI Brain** of the entire REZ ecosystem. It:
- Knows every user individually (preferences, behavior, intent)
- Knows every merchant individually (demand, patterns, insights)
- Predicts behavior in real-time
- Delivers personalized experiences
- Ensures safety with guardrails

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 REZ MIND                                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  DATA SOURCES                                                                      │
│  ├── Consumer Apps (ReZ App, ReZ Now, Web Menu, rendez, Karma)                       │
│  └── Merchant Apps (Merchant OS, RestoPapa, PMS)                                    │
│                                      ↓                                              │
│  EVENT PLATFORM (Port 4008)                                                        │
│  └── All events flow here with correlation_id                                       │
│                                      ↓                                              │
│  CORE LOOP                                                                         │
│  ├── ACTION ENGINE (Port 4009) → Decisions                                         │
│  └── FEEDBACK SERVICE (Port 4010) → Learning                                      │
│                                      ↓                                              │
│  INTELLIGENCE LAYER                                                                │
│  ├── User Intelligence (Port 3004)                                                  │
│  ├── Merchant Intelligence (Port 4012)                                              │
│  ├── Intent Predictor (Port 4018)                                                  │
│  ├── Intelligence Hub (Port 4020)                                                  │
│  ├── Targeting Engine (Port 3003)                                                   │
│  ├── Recommendation Engine (Port 3001)                                              │
│  ├── Personalization Engine (Port 4017)                                              │
│  └── Push Service (Port 4013)                                                       │
│                                      ↓                                              │
│  COPILOTS                                                                          │
│  ├── Merchant Copilot (Port 4022)                                                    │
│  ├── Consumer Copilot                                                               │
│  └── Ad Copilot (Port 4021)                                                         │
│                                      ↓                                              │
│  DELIVERY                                                                          │
│  ├── AdBazaar → Targeted Ads                                                        │
│  ├── Push → Multi-channel Notifications                                              │
│  └── In-App → Personalized Content                                                  │
│                                                                                      │
│  SAFETY LAYER                                                                      │
│  ├── Feature Flags (Port 4030)                                                      │
│  ├── Observability (Port 4031)                                                      │
│  └── Ops Dashboard (Port 4032)                                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## All Services

### Core Loop
| Service | Port | Purpose |
|---------|------|---------|
| Event Platform | 4008 | Event ingestion with correlation_id |
| Action Engine | 4009 | Context-aware decisions |
| Feedback Service | 4010 | Learning from outcomes |

### Intelligence Layer
| Service | Port | Purpose |
|---------|------|---------|
| User Intelligence | 3004 | User profiles, preferences, segments |
| Merchant Intelligence | 4012 | Merchant profiles, insights, trends |
| Intent Predictor | 4018 | Real-time intent, mood, urgency |
| Intelligence Hub | 4020 | Unified profiles, cross-app |

### Targeting & Delivery
| Service | Port | Purpose |
|---------|------|---------|
| Targeting Engine | 3003 | Campaign targeting, segments |
| Recommendation Engine | 3001 | Product recommendations |
| Personalization Engine | 4017 | Content ranking, A/B |
| Push Service | 4013 | Multi-channel notifications |

### Copilots
| Service | Port | Purpose |
|---------|------|---------|
| Merchant Copilot | 4022 | Business insights, inventory |
| Ad Copilot | 4021 | Ad intelligence, optimization |

### Safety
| Service | Port | Purpose |
|---------|------|---------|
| Feature Flags | 4030 | Feature toggles |
| Observability | 4031 | Logs, traces |
| Ops Dashboard | 4032 | Admin panel |

---

## User Profile (Derived Signals)

```json
{
  "user_id": "user_123",
  "preferences": {
    "cuisines": ["biryani", "pizza"],
    "price_sensitivity": "medium",
    "time_pattern": "evening_user",
    "dietary_restrictions": []
  },
  "intent_signals": {
    "current_intent": "looking_for_dinner",
    "intent_confidence": 0.78,
    "purchase_probability": 0.65
  },
  "behavior": {
    "frequency": "weekly",
    "avg_order_value": 450,
    "engagement_level": "high"
  },
  "segments": ["foodies", "deal_seekers"],
  "lifetime_value": 15000,
  "churn_risk": "low"
}
```

## Merchant Profile (Derived Signals)

```json
{
  "merchant_id": "merchant_456",
  "demand_pattern": "weekend_spike",
  "customer_types": ["budget_minders", "foodies"],
  "pricing_behavior": "discount_sensitive",
  "segments": ["high_volume", "deal_responsive"],
  "health_score": 85,
  "growth_score": 72
}
```

---

## User Segments

| Segment | Criteria |
|---------|----------|
| `high_value` | Top 20% by LTV |
| `vip` | LTV > 50,000 |
| `foodies` | High frequency, variety |
| `deal_seekers` | Always discount responsive |
| `budget_minders` | Low AOV, price sensitive |
| `churned` | 30+ days inactive |
| `at_risk` | 14+ days inactive |
| `window_shoppers` | Browse, no buy |
| `new_users` | First order < 7 days |
| `power_users` | 5+ sessions/week |

---

## Feature Flags (Default - Safe Mode)

| Flag | Default | Description |
|------|---------|-------------|
| learning_enabled | OFF | Machine learning |
| adaptive_enabled | OFF | Adaptive decisions |
| personalization_enabled | ON | Personalized content |
| recommendations_enabled | ON | Product recommendations |
| intent_prediction_enabled | ON | Real-time intent |
| ads_enabled | OFF | Targeted ads |
| push_enabled | ON | Push notifications |
| auto_execute_safe | ON | Auto-execute SAFE |
| rollback_enabled | ON | Auto-rollback |

---

## Safety Thresholds

```javascript
RISKY: confidence < 0.7 OR decisions < 5
SEMI_SAFE: confidence >= 0.7 AND decisions >= 5
SAFE: confidence >= 0.9 AND approval_rate >= 0.8 AND decisions >= 10
```

### Safety Caps
- Max quantity: 50
- Max value: ₹100,000
- Max delta: 50%

---

## Data Contracts

### Event Schema
```typescript
interface BaseEvent {
  event_id: string;
  event_type: string;
  correlation_id: string;  // Links entire flow
  source: string;
  timestamp: string;
}
```

### Decision Schema
```typescript
interface BaseDecision {
  decision_id: string;
  correlation_id: string;
  decision: string;
  confidence: number;      // 0.0 - 1.0
  action_level: string;     // SAFE | SEMI_SAFE | RISKY
  recommendation: string;   // auto_execute | suggest | block
}
```

### Feedback Schema
```typescript
interface BaseFeedback {
  feedback_id: string;
  correlation_id: string;
  outcome: 'approved' | 'rejected' | 'modified' | 'ignored';
  confidence: number;
}
```

---

## Launch Phases

### Phase 1: Internal (NOW)
- Merchant Copilot → ON
- Learning → OFF
- Ads → OFF
- Personalization → BASIC

### Phase 2: Controlled (5-20 merchants)
- Small user set
- Still safe mode
- Monitor closely

### Phase 3: Progressive
- Learning → ON (slowly)
- Personalization → FULL
- Ads → TARGETED

---

## Quick Commands

```bash
# Check feature flags
curl http://localhost:4030/flags

# Disable learning
curl -X POST http://localhost:4030/flags/learning_enabled/disable

# Enable ads
curl -X POST http://localhost:4030/flags/ads_enabled/enable

# View system health
curl http://localhost:4032/health/status
```

---

## GitHub Repositories

All services pushed to: `https://github.com/imrejaul007`

| Service | Repo |
|---------|------|
| Event Platform | REZ-event-platform |
| Action Engine | REZ-action-engine |
| Feedback Service | REZ-feedback-service |
| User Intelligence | REZ-user-intelligence-service |
| Merchant Intelligence | REZ-merchant-intelligence-service |
| Intent Predictor | REZ-intent-predictor |
| Intelligence Hub | REZ-intelligence-hub |
| Ad Copilot | REZ-ad-copilot |
| Merchant Copilot | REZ-merchant-copilot |
| Targeting Engine | REZ-targeting-engine |
| Recommendation Engine | REZ-recommendation-engine |
| Personalization Engine | REZ-personalization-engine |
| Push Service | REZ-push-service |
| Feature Flags | REZ-feature-flags |
| Observability | REZ-observability |
| Ops Dashboard | REZ-ops-dashboard |

---

## MongoDB Atlas

Primary: `mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net`

Databases:
- `rez-events` - Event Platform
- `rez-actions` - Action Engine
- `rez-feedback` - Feedback Service
- `rez-user-intelligence` - User Profiles
- `rez-merchant-intelligence` - Merchant Profiles
- `rez-targeting` - Campaigns
- `rez-recommendations` - Recommendations
- `rez-feature-flags` - Feature Flags
- `rez-observability` - Logs & Traces

---

## Success Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| Modified | 20-40% | Healthy engagement |
| Ignored | <30% | Relevance okay |
| Pattern repeats | Yes | Learning signal |
| No errors | 100% | System stable |

---

## What's NOT Built Yet

- Real merchant connections
- Real user connections
- Production deployment
- Full UI dashboards

---

## Next Steps

1. Start all services locally
2. Build UI dashboards
3. Connect real apps
4. Deploy to production
5. Start with 5-20 merchants

---

Last updated: 2026-05-01
