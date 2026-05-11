# AI POC Proposals - Top 3 Opportunities

**Date:** 2026-05-04
**Status:** PROPOSED
**Priority:** P0/P1

---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                    REZ AI PROOF OF CONCEPTS                                   ║
║                                                                               ║
║         Detailed Technical Proposals for Top 3 AI Innovations                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## POC #1: AI Shopping Assistant with Agentic Commerce

**Priority:** P0 (CRITICAL)
**Timeline:** 8 weeks
**Team:** NLP Lead + Product Lead + ML Infra

---

### Problem Statement

REZ's current chat interface handles basic queries but cannot execute complex shopping tasks. Customers must manually search, compare, and purchase - resulting in low conversion (2%) and high abandonment.

### Solution Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI SHOPPING ASSISTANT                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Input          AI Processing           Action                      │
│  ─────────          ────────────           ──────                      │
│                                                                             │
│  "I need 10          Intent + Entities      Restaurant Search           │
│   pizzas for                                                   │
│   tonight"                   ↓                                    │
│                              ↓                                    │
│                       Constraint Mapping                            │
│                       budget, quantity,                           │
│                       time, preferences                           │
│                              ↓                                    │
│                              ↓                                    │
│                       RAG Query to                               │
│                       Merchant DB                                │
│                              ↓                                    │
│                              ↓                                    │
│                       Ranked Results      →  Top 3 with rationale  │
│                              ↓                                    │
│                              ↓                                    │
│                       User Selection                              │
│                              ↓                                    │
│                              ↓                                    │
│                       Tool Execution       →  Create Order          │
│                                               Book Table             │
│                                               Reserve Items         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Architecture

```typescript
// Core Components
interface ShoppingAssistant {
  // 1. Input Processing
  inputProcessor: {
    model: 'claude-3-haiku';  // Fast for simple queries
    fallback: 'claude-3-sonnet';  // Complex multi-constraint
    capabilities: [
      'intent_detection',
      'entity_extraction',
      'constraint_parsing',
      'clarification_requests'
    ];
  };

  // 2. RAG System
  rag: {
    vectorDb: 'weaviate';
    embedder: 'text-embedding-3-small';
    chunkStrategy: 'semantic_splitting';
    retrievalTopK: 10;
    reranker: 'cross-encoder';
    freshness: 'real-time_sync';
  };

  // 3. Tool System
  tools: {
    search_restaurants: {
      input: { cuisine, location, budget, time, dietary };
      output: Restaurant[];
    };
    get_menu: {
      input: { restaurantId };
      output: Menu;
    };
    create_order: {
      input: { items, restaurantId, userId };
      output: Order;
    };
    book_table: {
      input: { restaurantId, partySize, dateTime };
      output: Reservation;
    };
    calculate_total: {
      input: { items, restaurantId, coupon? };
      output: { subtotal, tax, delivery, total };
    };
  };

  // 4. Orchestration
  orchestrator: {
    framework: 'LangGraph';  // or custom FSM
    maxSteps: 15;
    fallbackToHuman: true;
    confirmationThreshold: 0.7;  // Confirm below this
  };
}
```

---

### API Design

```typescript
// POST /api/ai-shopping/chat
interface ChatRequest {
  message: string;
  userId: string;
  sessionId: string;
  context?: {
    location?: GeoLocation;
    dietaryRestrictions?: string[];
    budgetRange?: { min: number; max: number };
  };
}

interface ChatResponse {
  sessionId: string;
  message: string;  // AI response
  suggestions?: ActionSuggestion[];
  cartPreview?: Cart;
  requiresConfirmation?: boolean;
  confidence: number;
}

interface ActionSuggestion {
  type: 'order' | 'book' | 'browse' | 'compare';
  title: string;
  description: string;
  entities: {
    restaurantId?: string;
    items?: OrderItem[];
    partySize?: number;
    dateTime?: string;
  };
  estimatedTotal?: number;
  confidence: number;
}
```

---

### Data Requirements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA PIPELINE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MERCHANT DATA (Already exists)                                             │
│  ├── Restaurant profiles                                                   │
│  ├── Menus (items, prices, categories)                                     │
│  ├── Hours, location, contact                                              │
│  └── Reviews and ratings                                                   │
│                                                                             │
│  NEW DATA FOR RAG                                                          │
│  ├── Menu item embeddings (weekly refresh)                                 │
│  ├── Restaurant description embeddings                                     │
│  ├── Review summaries                                                      │
│  └── Structured attributes (cuisine, ambiance, price tier)                  │
│                                                                             │
│  USER DATA (Already exists)                                                │
│  ├── Order history                                                         │
│  ├── Preferences (dietary, favorite cuisines)                              │
│  └── Location history                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Evaluation Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Task Completion Rate | >80% | % conversations with successful order |
| Conversion Rate | >6% | Orders / sessions |
| Average Order Value | >$30 | Mean order value |
| Response Latency | <2s | P50 response time |
| User Satisfaction | >4.0/5 | Post-session survey |
| Escalation Rate | <20% | Sessions requiring human |

### Milestones

```
Week 1-2: RAG pipeline + basic chat
Week 3-4: Tool integration + order flow
Week 5-6: Advanced reasoning + multi-turn
Week 7:   A/B testing setup
Week 8:   Production deployment
```

---

## POC #2: Predictive Inventory & Logistics

**Priority:** P1 (HIGH)
**Timeline:** 12 weeks
**Team:** ML Lead + Data Lead + Product Lead

---

### Problem Statement

Merchants lose 10-30% revenue to stockouts and waste 15% of perishable inventory due to poor demand forecasting. Manual reorder decisions are slow and inaccurate.

### Solution Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PREDICTIVE INVENTORY SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DEMAND SIGNAL                      SUPPLY RESPONSE                        │
│  ────────────                       ──────────────                        │
│                                                                             │
│  Historical Sales              ┌───→  Forecast Engine                       │
│  Weather Data                      │                                       │
│  Local Events                   │    ┌─────────────────┐                   │
│  Seasonal Patterns             │    │ Demand Forecast │                   │
│  Competitor Activity           │    │ 7-day horizon   │                   │
│  Marketing Campaigns          │    └────────┬────────┘                   │
│                                  │             │                            │
│                                  │             ↓                            │
│                                  │    ┌─────────────────┐                   │
│                                  │    │ Reorder Advisor │                   │
│                                  └───→│ Auto-reorder?   │                   │
│                                       │ Stockout risk   │                   │
│                                       └────────┬────────┘                   │
│                                                │                            │
│                                                ↓                            │
│                                       ┌─────────────────┐                   │
│                                       │ Merchant Alert  │                   │
│                                       │ Dashboard        │                   │
│                                       └─────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Architecture

```typescript
// Core Components
interface PredictiveInventory {
  // 1. Data Ingestion
  ingestion: {
    sources: [
      'order_events',      // Daily sales by item
      'weather_api',       // Temperature, precipitation
      'event_calendar',    // Local events, holidays
      'inventory_logs',    // Current stock levels
      'supplier_catalogs'  // Lead times, MOQs
    ];
    cadence: 'hourly';
    storage: 'time-series_db';  // TimescaleDB or InfluxDB
  };

  // 2. Feature Engineering
  features: {
    lag_features: [
      'sales_last_7d',
      'sales_last_14d',
      'sales_last_30d',
      'sales_same_day_last_week',
      'sales_same_day_last_month'
    ];
    rolling_features: [
      'rolling_mean_7d',
      'rolling_std_7d',
      'rolling_trend'
    ];
    external_features: [
      'temperature',
      'precipitation',
      'is_weekend',
      'is_holiday',
      'local_event_count'
    ];
  };

  // 3. Forecasting Models
  forecasting: {
    primary: {
      model: 'Temporal Fusion Transformer';
      horizon: '7 days';
      update_frequency: 'daily';
      retraining: 'weekly';
    };
    fallback: {
      model: 'Prophet';
      use_case: 'Quick forecasts, interpretability';
    };
    safety: {
      model: 'Simple moving average';
      use_case: 'When ML unavailable';
    };
  };

  // 4. Recommendations
  recommendations: {
    reorder_quantity: {
      method: 'safety_stock + forecasted_demand';
      inputs: ['lead_time', 'service_level', 'shelf_life'];
    };
    stockout_alert: {
      threshold: 'P(stockout) > 0.3';
      action: 'Push notification';
    };
    waste_prevention: {
      method: 'Expiration tracking';
      action: 'Discount suggestion';
    };
  };

  // 5. Auto-Reorder (Optional)
  autoReorder: {
    enabled: boolean;  // Merchant opt-in
    max_value: number;  // Per reorder limit
    approval_required_above: number;
  };
}
```

---

### API Design

```typescript
// GET /api/inventory/forecast/:merchantId
interface ForecastRequest {
  merchantId: string;
  itemIds?: string[];  // Optional filter
  horizonDays?: number;  // Default 7
}

interface ForecastResponse {
  merchantId: string;
  generatedAt: string;
  forecasts: {
    itemId: string;
    itemName: string;
    predictions: {
      date: string;
      predictedDemand: number;
      confidenceInterval: { low: number; high: number };
      stockoutRisk: 'low' | 'medium' | 'high';
    }[];
    recommendation: {
      action: 'reorder' | 'hold' | 'discount';
      quantity: number;
      urgency: 'low' | 'medium' | 'high';
      reason: string;
    };
  }[];
}

// GET /api/inventory/alerts/:merchantId
interface InventoryAlerts {
  merchantId: string;
  alerts: {
    type: 'stockout_risk' | 'low_stock' | 'waste_risk' | 'surge_demand';
    itemId: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    suggestedAction: string;
  }[];
}
```

---

### Data Requirements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA REQUIREMENTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REQUIRED (We have)                                                        │
│  ├── Order data (2+ years recommended)                                     │
│  ├── Menu items with categories                                            │
│  └── Merchant inventory levels                                             │
│                                                                             │
│  NEW DATA SOURCES                                                          │
│  ├── Weather API (OpenWeatherMap)                                          │
│  ├── Event Calendar API (Ticketmaster, Eventbrite)                        │
│  ├── Supplier lead times and pricing                                      │
│  └── Expiration dates for perishables                                      │
│                                                                             │
│  FEATURE STORE                                                             │
│  ├── Daily aggregated features                                            │
│  ├── 2-year lookback window                                               │
│  └── Real-time inventory updates                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Evaluation Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Stockout Rate | 15% | 3% | Days with stockout / total days |
| Inventory Waste | 15% | 5% | Wasted value / total inventory |
| Forecast Accuracy | N/A | MAPE <20% | Mean absolute % error |
| Merchant Adoption | 0% | 50% | Active users / eligible merchants |
| Revenue Impact | $0 | +$X | Attributable to reduced stockouts |

### Milestones

```
Week 1-3:   Data pipeline + feature engineering
Week 4-6:   Model development + training
Week 7-8:   Dashboard + merchant alerts
Week 9-10:  Integration + testing
Week 11:    Pilot with 5 merchants
Week 12:    Production deployment
```

---

## POC #3: Autonomous Merchant Operations

**Priority:** P1 (HIGH)
**Timeline:** 10 weeks
**Team:** NLP Lead + ML Infra + Product Lead

---

### Problem Statement

Merchant onboarding takes 14+ days due to manual review. Routine operations (menu updates, pricing changes) require human intervention. This slows growth and increases operational costs.

### Solution Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS MERCHANT AGENT                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MERCHANT CONVERSATION                                                     │
│  ───────────────────                                                       │
│                                                                             │
│  Agent: "Welcome! I'm your REZ assistant.                                │
│          Let's set up your store together.                                 │
│          First, what type of business do you have?"                         │
│                                                                             │
│  Merchant: "I own a pizza restaurant"                                      │
│                                                                             │
│  Agent: "Great! Pizza restaurants get great results on REZ.               │
│          Let me ask a few questions to customize your setup."              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  COLLECTING INFO:                                                    │   │
│  │                                                                      │   │
│  │  [✓] Business type: Restaurant - Pizza                            │   │
│  │  [✓] Name: "Tony's Pizza"                                          │   │
│  │  [✓] Location: 123 Main St, Downtown                               │   │
│  │  [✓] Hours: 11am-10pm daily                                        │   │
│  │  [ ] Menu: Upload or describe                                       │   │
│  │  [ ] Pricing: Select tier                                          │   │
│  │  [ ] Documents: License, permit                                     │   │
│  │  [ ] Payment: Bank account setup                                   │   │
│  │  [ ] Confirmation: Preview & approve                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  DOCUMENT PROCESSING                                                       │
│  ───────────────────                                                       │
│                                                                             │
│  Merchant: [Uploads business license]                                      │
│                                                                             │
│  Agent: "I can read that! Let me verify..."                               │
│         ✓ License valid until 2027                                        │
│         ✓ Matches business name                                           │
│         ✓ Accepted!                                                      │
│                                                                             │
│  FINAL STEP                                                                │
│  ──────────                                                               │
│                                                                             │
│  Agent: "Your store is ready! Here's the preview:                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────┐                 │
│  │         🍕 TONY'S PIZZA                              │                 │
│  │         123 Main St, Downtown                       │                 │
│  │         Open 11am-10pm                              │                 │
│  │         Starting at $12.99                          │                 │
│  │         [2 items uploaded]                          │                 │
│  └─────────────────────────────────────────────────────┘                 │
│                                                                             │
│  Looks good? Say 'Go Live' to launch!"                                    │
│                                                                             │
│  Merchant: "Go Live!"                                                      │
│                                                                             │
│  Agent: "🎉 Your store is LIVE! You can now receive orders.             │
│          Check your dashboard for analytics.                               │
│          Need help? Just ask!"                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Architecture

```typescript
// Core Components
interface MerchantAutonomousAgent {
  // 1. Conversation Manager
  conversation: {
    model: 'claude-3-sonnet';
    systemPrompt: 'Merchant onboarding specialist';
    contextWindow: '200k tokens';
    capabilities: [
      'question_flow',
      'clarification',
      'error_recovery',
      'satisfaction_check'
    ];
  };

  // 2. Document Processing
  documentProcessing: {
    ocr: 'Claude Vision';
    verification: {
      business_license: ['name_match', 'expiry_check', 'format_verify'];
      permit: ['validity_check', 'category_match'];
      id: ['face_match', 'expiry_check'];
    };
    extraction: {
      fields: ['business_name', 'owner', 'address', 'license_number'];
    };
  };

  // 3. Data Collection Flow
  onboardingFlow: {
    steps: [
      { id: 'business_type', required: true, type: 'choice' },
      { id: 'name', required: true, type: 'text', validation: 'unique' },
      { id: 'address', required: true, type: 'location' },
      { id: 'hours', required: true, type: 'schedule' },
      { id: 'menu', required: true, type: 'upload_or_manual' },
      { id: 'pricing', required: true, type: 'tier_select' },
      { id: 'documents', required: true, type: 'upload[]' },
      { id: 'payment', required: true, type: 'bank_setup' },
      { id: 'preview', required: true, type: 'confirm' }
    ];
  };

  // 4. Store Configuration
  storeConfig: {
    autoGenerate: [
      'store_description',
      'category_tags',
      'search_keywords',
      'estimated_delivery_time'
    ];
    humanReview: [
      'high_value_merchants',
      'complex_categories',
      'compliance_flags'
    ];
  };

  // 5. Compliance Checking
  compliance: {
    checks: [
      'business_license_valid',
      'category_allowed',
      'location_permitted',
      'age_restricted_check'
    ];
    flagForReview: 'any_check_fails';
    autoApproveThreshold: 100;  // % confidence
  };
}
```

---

### API Design

```typescript
// POST /api/merchant/autonomous/onboard/start
interface OnboardingStartRequest {
  merchantName?: string;  // Optional pre-fill
  channel: 'chat' | 'whatsapp' | 'in_app';
}

interface OnboardingStartResponse {
  sessionId: string;
  firstMessage: string;
  progress: {
    currentStep: number;
    totalSteps: number;
    completedFields: string[];
  };
}

// POST /api/merchant/autonomous/onboard/message
interface OnboardingMessageRequest {
  sessionId: string;
  message: string | {
    type: 'text' | 'document' | 'location' | 'image';
    content: string;
    metadata?: Record<string, any>;
  };
}

interface OnboardingMessageResponse {
  sessionId: string;
  message: string;
  progress: {
    completedFields: string[];
    pendingFields: string[];
    currentField: string;
  };
  extractedData: Record<string, any>;
  needsDocument?: {
    field: string;
    acceptedTypes: string[];
  };
  status: 'in_progress' | 'pending_review' | 'ready_for_preview' | 'live';
}

// POST /api/merchant/autonomous/onboard/preview
interface OnboardingPreviewRequest {
  sessionId: string;
}

interface OnboardingPreviewResponse {
  sessionId: string;
  preview: {
    storeName: string;
    description: string;
    category: string;
    address: string;
    hours: string;
    sampleItems: MenuItem[];
    estimatedLaunchDate: string;
  };
  issues: {
    severity: 'warning' | 'error';
    message: string;
    field: string;
  }[];
  launchEnabled: boolean;
}
```

---

### Evaluation Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Onboarding Time | 14 days | 4 hours | Signup to live |
| Onboarding Cost | $50 | $5 | Human hours |
| First-response Time | 4 hours | Instant | AI response |
| Completion Rate | 60% | 85% | Start to live |
| Escalation Rate | 30% | 10% | Require human |
| Merchant Satisfaction | 3.5/5 | 4.5/5 | Survey |

### Milestones

```
Week 1-2:   Conversation flow + document processing
Week 3-4:   Store configuration automation
Week 5-6:   Compliance checking + human handoff
Week 7-8:   Dashboard for humans + monitoring
Week 9:     Pilot with 10 merchants
Week 10:    Production + full rollout
```

---

## Resource Requirements

### Team Allocation

| POC | ML Engineers | Data Engineers | Product | Timeline |
|-----|--------------|----------------|---------|----------|
| #1 AI Shopping | 2 | 1 | 1 | 8 weeks |
| #2 Inventory | 2 | 2 | 1 | 12 weeks |
| #3 Merchant | 1 | 1 | 1 | 10 weeks |

### Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRA NEEDS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AI SHOPPING ASSISTANT                                                     │
│  ├── Claude API: ~$500/month (POC)                                        │
│  ├── Weaviate: ~$100/month (managed)                                      │
│  └── Compute: 2 vCPU, 4GB RAM                                              │
│                                                                             │
│  PREDICTIVE INVENTORY                                                      │
│  ├── Training Compute: GPU instance (2 weeks)                              │
│  ├── Inference: 4 vCPU, 8GB RAM                                            │
│  ├── TimescaleDB: ~$200/month                                             │
│  └── External APIs: Weather + Events (~$50/month)                          │
│                                                                             │
│  MERCHANT AUTONOMY                                                         │
│  ├── Claude API: ~$300/month                                              │
│  └── Compute: 2 vCPU, 4GB RAM                                              │
│                                                                             │
│  ESTIMATED TOTAL: ~$1,200/month + $2,000 one-time training                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude API costs exceed budget | Medium | Medium | Implement caching, rate limiting |
| RAG quality insufficient | Medium | High | Human review of low-confidence responses |
| Merchants don't trust AI | Medium | High | Human fallback always available |
| Forecast accuracy poor | Medium | Medium | Conservative recommendations, human approval |
| Compliance issues | Low | High | Legal review of automation rules |

---

## Success Criteria

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GO/NO-GO CRITERIA                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  POC #1: AI Shopping Assistant                                             │
│  ├── Task completion rate > 70%                                           │
│  ├── Conversion rate > 4%                                                 │
│  ├── P95 latency < 3 seconds                                              │
│  └── Zero critical hallucinations                                          │
│                                                                             │
│  POC #2: Predictive Inventory                                              │
│  ├── Forecast MAPE < 25%                                                  │
│  ├── Stockout reduction > 50%                                             │
│  ├── Merchant adoption > 30%                                              │
│  └── Zero automated orders causing loss                                   │
│                                                                             │
│  POC #3: Merchant Autonomy                                                  │
│  ├── Onboarding time < 1 day                                             │
│  ├── Completion rate > 80%                                                 │
│  ├── Escalation rate < 15%                                                │
│  └── Merchant NPS > 40                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **This Week**: Get approval for POC scope and budget
2. **Week 1**: Team allocation and sprint planning
3. **Week 2**: Data audit and infrastructure setup
4. **Ongoing**: Weekly progress reviews

---

**Owner:** Research Lead (Agent-8)
**Escalation:** AI Team Lead (Agent-1)
**Budget Request:** $15,000 (infrastructure + APIs)

---
