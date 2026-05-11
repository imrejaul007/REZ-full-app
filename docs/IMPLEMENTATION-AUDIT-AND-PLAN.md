# ReZ Ecosystem: Implementation Audit & Plan
**Version:** 1.0
**Date:** May 10, 2026

---

## PART 1: CURRENT STATE AUDIT

### 1.1 Services Inventory

#### ✅ EXISTING & COMPLETE

| Service | Status | Notes |
|---------|--------|-------|
| rez-auth-service | ✅ Complete | JWT, refresh tokens |
| rez-payment-service | ✅ Complete | UPI, cards, wallets |
| rez-order-service | ✅ Complete | Order management |
| rez-catalog-service | ✅ Complete | Menu catalog |
| rez-search-service | ✅ Complete | Restaurant search |
| rez-loyalty-service | ✅ Complete | Coins, cashback, streaks |
| rez-wallet-service | ✅ Complete | User wallet |
| rez-notifications-hub | ✅ Complete | Email, SMS, push |
| rez-analytics-service | ⚠️ Basic | Needs upgrade |
| rez-intent-graph | ✅ Connected | AI Bus |
| rez-kitchen-ai | ✅ Connected | AI Bus |
| rez-personalization-engine | ✅ Connected | AI Bus |

#### ⚠️ EXISTS BUT NEEDS WORK

| Service | Current | Needed |
|---------|---------|--------|
| rez-merchant-service | Basic | Full POS, multi-location |
| rez-inventory-service | Basic | Smart inventory |
| rez-kitchen-display | Basic | Full KDS |
| REZ-dashboard | Basic | Analytics v2 |
| REZ-notifications-hub | Basic | Marketing automation |

#### ❌ MISSING (Strategic Gaps)

| Service | Priority | Investment | Timeline |
|---------|----------|-----------|---------|
| **Delivery Service** | Critical | ₹50-100 Cr | 6-12 months |
| **ReZ Capital (Lending)** | Critical | ₹20 Cr | 3-6 months |
| **Smart Inventory** | High | ₹5 Cr | 3-6 months |
| **Customer Data Platform** | High | ₹3 Cr | 2-4 months |
| **Staff Management** | Medium | ₹2 Cr | 2-3 months |
| **Analytics Dashboard v2** | Critical | ₹2 Cr | 1-2 months |
| **Franchise Portal** | Medium | ₹3 Cr | 3-4 months |
| **Corporate Dining** | Medium | ₹2 Cr | 3-4 months |

---

## PART 2: BUILD VS BUY ANALYSIS

### Services to BUILD (Core Competency)

| Service | Why Build | Competitive Advantage |
|---------|-----------|---------------------|
| Smart Inventory | Core to Restaurant OS | Data insights |
| Customer Data Platform | Unifies all data | AI advantage |
| Analytics Dashboard | Decision making | Operational efficiency |
| Staff Management | Integrates with POS | Unified system |
| Delivery Management | Controls experience | Margin improvement |

### Services to PARTNER/BUY

| Service | Why Partner | Options |
|---------|-------------|---------|
| **Lending/Capital** | Regulatory complexity | PineLabs, Capital Float |
| **Payment Gateway** | Already have | Razorpay, Stripe |
| **Delivery Logistics** | Capital intensive | Swiggy, Dunzo APIs |
| **Accounting** | Standard compliance | Zoho, Tally |
| **Payroll** | Compliance heavy | Razorpay Payroll |

---

## PART 3: DETAILED IMPLEMENTATION PLANS

---

## Module 1: Analytics Dashboard v2

### Current State
- Basic sales reporting
- No real-time metrics
- No predictive insights
- No actionable recommendations

### Target State
```
┌──────────────────────────────────────────────────────────────┐
│                    ANALYTICS DASHBOARD v2                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   TODAY       │  │   WEEK        │  │   MONTH        │ │
│  │   ₹1,45,230   │  │   ₹8,23,450   │  │   ₹35,67,890   │ │
│  │   ↑ 12%       │  │   ↑ 8%        │  │   ↑ 15%        │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              REVENUE TREND                             │ │
│  │     ╭──╮                      ╭──╮                   │ │
│  │    ╭╯  ╰─╮    ╭──╮         ╭╯  ╰─╮              │ │
│  │  ╭─╯      ╰──╮  ╰╮  ╭──╮   ╰──    ╰─╮            │ │
│  │──╯            ╰──╯  ╰──╯          ╰────╯            │ │
│  │  M   T   W   T   F   S   S                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  TOP DISHES         │  │  CUSTOMER INSIGHTS         │  │
│  │  1. Butter Chicken  │  │  New: 45 | Repeat: 120    │  │
│  │  2. Dal Makhani     │  │  At Risk: 23 | VIP: 89    │  │
│  │  3. Biryani         │  │  Churn Score: 12%          │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI INSIGHTS (ReZ Mind)                               │ │
│  │  💡 "Peak hours 7-9 PM. Run lunch offers to         │ │
│  │     balance traffic and reduce wait times."           │ │
│  │  💡 "Chicken Tikka abandoned 23%. Consider            │ │
│  │     adding photos or reducing price."                 │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Implementation Steps

```
PHASE 1: Data Foundation (Weeks 1-4)
├── [ ] Create analytics data warehouse
├── [ ] Integrate all data sources
├── [ ] Build real-time event pipeline
└── [ ] Create unified metrics layer

PHASE 2: Core Dashboards (Weeks 5-8)
├── [ ] Revenue dashboard
├── [ ] Customer analytics
├── [ ] Dish performance
└── [ ] Operational metrics

PHASE 3: Advanced Analytics (Weeks 9-12)
├── [ ] Predictive models (demand, churn)
├── [ ] AI-powered insights
└── [ ] Actionable recommendations

PHASE 4: Customization (Weeks 13-16)
├── [ ] Role-based views
├── [ ] Custom reports
├── [ ] Export/Scheduling
└── [ ] Alerts
```

### Required Files/Services

| Type | Name | Action |
|------|------|--------|
| Service | `rez-analytics-v2/` | CREATE |
| Database | `analytics-warehouse` | CREATE (MongoDB/Postgres) |
| Stream | `event-processor` | CREATE |
| API | `/api/analytics/*` | CREATE |

### Files to Create

```
rez-analytics-v2/
├── src/
│   ├── index.ts                 # Express server
│   ├── config/
│   │   └── database.ts          # Data warehouse connection
│   ├── services/
│   │   ├── revenueService.ts    # Revenue calculations
│   │   ├── customerService.ts   # Customer analytics
│   │   ├── dishService.ts       # Dish performance
│   │   ├── operationalService.ts # Operational metrics
│   │   └── insightService.ts     # AI insights
│   ├── pipelines/
│   │   ├── realtime.ts          # Real-time stream
│   │   └── batch.ts            # Batch processing
│   ├── models/
│   │   ├── metrics.ts          # Metric schemas
│   │   └── insights.ts          # Insight schemas
│   ├── routes/
│   │   ├── dashboard.ts        # Dashboard API
│   │   ├── customer.ts         # Customer analytics
│   │   └── reports.ts          # Report generation
│   └── middleware/
│       └── auth.ts             # Analytics auth
├── tests/
│   └── analytics.test.ts
├── package.json
└── tsconfig.json
```

---

## Module 2: Smart Inventory

### Current State
- Basic stock tracking
- No demand forecasting
- No auto-reorder
- Manual supplier management

### Target State
```
┌──────────────────────────────────────────────────────────────┐
│                    SMART INVENTORY SYSTEM                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  DASHBOARD                                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │ Stock   │ │ Low Stock│ │ Wastage  │ │ Orders │ │  │
│  │  │ 847     │ │   12     │ │   2.3%   │ │   34   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  DEMAND FORECAST     │  │  INGREDIENT TRACKING       │  │
│  │                      │  │                             │  │
│  │  Today: 45 portions │  │  Chicken: 12kg (healthy)   │  │
│  │  Tomorrow: 52        │  │  Butter: 800g (low ⚠️)     │  │
│  │  This Week: 320     │  │  Cream: 3L (healthy)       │  │
│  │  ─────────────────── │  │  Spices: 2kg (healthy)     │  │
│  │  AI: "Rain forecast │  │                             │  │
│  │  may reduce traffic │  │  [Reorder Now]            │  │
│  │  by 15%"           │  │                             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  AUTO-PURCHASE ORDERS                                  │  │
│  │  ─────────────────────────────────────────────────────│  │
│  │  ✓ Butter (800g) → NextaBizz → ₹520 → ETA: Tomorrow │  │
│  │  ✓ Packaging (1000 pcs) → Supplier → ₹2,400 → ETA: 3 days │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Features to Build

| Feature | Description | Priority |
|---------|-------------|----------|
| Real-time Stock | Track all ingredients live | Critical |
| Recipe Mapping | Link dishes to ingredients | Critical |
| Demand Forecasting | AI predicts daily needs | High |
| Auto-Reorder | Triggers purchase orders | High |
| Waste Tracking | Record and analyze waste | Medium |
| Supplier Integration | NextaBizz connection | High |
| Cost Calculator | Menu item costing | Medium |

### Required Files/Services

| Type | Name | Action |
|------|------|--------|
| Service | `rez-inventory-service/` | UPGRADE |
| Database | `inventory` (extend) | MODIFY |
| Integration | NextaBizz | CONNECT |
| AI Model | `demand-forecast` | CREATE |

### Implementation Steps

```
PHASE 1: Foundation (Weeks 1-4)
├── [ ] Create recipe master
├── [ ] Link all dishes to ingredients
├── [ ] Build stock tracking
└── [ ] Add waste logging

PHASE 2: Intelligence (Weeks 5-8)
├── [ ] Integrate with POS for deduction
├── [ ] Build demand forecasting model
├── [ ] Create low-stock alerts
└── [ ] Add auto-reorder triggers

PHASE 3: Automation (Weeks 9-12)
├── [ ] Connect to NextaBizz
├── [ ] Auto-generate POs
├── [ ] Track delivery status
└── [ ] Invoice matching

PHASE 4: Optimization (Weeks 13-16)
├── [ ] AI menu optimization
├── [ ] Price elasticity analysis
├── [ ] Supplier comparison
└── [ ] Waste reduction insights
```

---

## Module 3: Customer Data Platform (CDP)

### Current State
- Siloed customer data
- No unified profile
- Basic segmentation
- Limited personalization

### Target State
```
┌──────────────────────────────────────────────────────────────┐
│                 CUSTOMER DATA PLATFORM                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  CUSTOMER: Rahul S. (ID: USR_12345)                 │  │
│  │  ───────────────────────────────────────────────────│  │
│  │                                                         │  │
│  │  TIER: Gold │ Visits: 24 │ LTV: ₹45,000 │ Churn: 8%│  │
│  │                                                         │  │
│  │  ┌────────────────────────────────────────────────┐│  │
│  │  │ 360° PROFILE                                    ││  │
│  │  │                                                 ││  │
│  │  │  📍 Location: HSR, Bangalore                   ││  │
│  │  │  🍛 Cuisine: North Indian, Chinese              ││  │
│  │  │  💰 Avg Order: ₹450 │ Freq: 4/month         ││  │
│  │  │  📱 Device: iPhone │ App User: Yes          ││  │
│  │  │  🎂 Birthday: Dec 15                          ││  │
│  │  │  🏢 Company: TechCorp (Corporate Account)     ││  │
│  │  └────────────────────────────────────────────────┘│  │
│  │                                                         │  │
│  │  ┌────────────────────────────────────────────────┐│  │
│  │  │  PREDICTIONS (AI)                               ││  │
│  │  │                                                 ││  │
│  │  │  Churn Risk: 8% (LOW)                         ││  │
│  │  │  Next Visit: ~5 days (73% confidence)          ││  │
│  │  │  Preferred Time: 7:30 PM                       ││  │
│  │  │  Likely Order: Butter Chicken + Biryani         ││  │
│  │  └────────────────────────────────────────────────┘│  │
│  │                                                         │  │
│  │  ┌────────────────────────────────────────────────┐│  │
│  │  │  RECOMMENDED ACTIONS                            ││  │
│  │  │                                                 ││  │
│  │  │  🎁 Send birthday offer (in 5 days)            ││  │
│  │  │  📱 Push: "Your favorite is back!" (high CTR) ││  │
│  │  │  📧 Email: New Chinese dishes (medium)         ││  │
│  │  └────────────────────────────────────────────────┘│  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Data Sources to Connect

| Source | Current | Status |
|--------|---------|--------|
| Orders | ✅ | Connected |
| Search Queries | ✅ | Connected |
| App Analytics | ⚠️ | Partial |
| Web Behavior | ❌ | Missing |
| Delivery | ❌ | Missing |
| Feedback/Reviews | ❌ | Missing |
| Social | ❌ | Missing |

### Implementation Steps

```
PHASE 1: Data Unification (Weeks 1-4)
├── [ ] Create unified customer profile schema
├── [ ] Build data ingestion pipeline
├── [ ] Integrate order data
├── [ ] Integrate search data
└── [ ] Create customer 360 view

PHASE 2: Intelligence (Weeks 5-8)
├── [ ] Build segment engine
├── [ ] Train churn prediction model
├── [ ] Create LTV scoring
└── [ ] Build recommendation engine

PHASE 3: Activation (Weeks 9-12)
├── [ ] Connect to marketing
├── [ ] Build personalization API
├── [ ] Create automated campaigns
└── [ ] Add real-time triggers

PHASE 4: Advanced (Weeks 13-16)
├── [ ] Cross-restaurant insights
├── [ ] Social graph analysis
├── [ ] Predictive LTV
└── [ ] Lookalike audiences
```

---

## Module 4: Delivery Service

### Current State
- Aggregator integrations only
- No own delivery
- High commission (25-30%)
- No control over experience

### Target State
```
┌──────────────────────────────────────────────────────────────┐
│                    DELIVERY MANAGEMENT                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ORDER #DEL-12345                                    │  │
│  │  ───────────────────────────────────────────────────│  │
│  │                                                         │  │
│  │  📍 Customer: HSR, Bangalore (3.2 km)                │  │
│  │  🏪 Restaurant: Spice Garden (1.5 km)                │  │
│  │  📦 Items: Butter Chicken, Naan x2                   │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │  LIVE TRACKING                                 │   │  │
│  │  │                                               │   │  │
│  │  │  🏪 ──────────── 📍 ─────────── 🏠          │   │  │
│  │  │  Picked    12 min     Delivered             │   │  │
│  │  │  up        remaining                         │   │  │
│  │  │                                               │   │  │
│  │  │  Rider: Amit ⭐ 4.9 │ 🛵 8 min             │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  FLEET STATUS        │  │  DELIVERY ANALYTICS         │  │
│  │                      │  │                             │  │
│  │  Available: 45       │  │  Today: 234 orders           │  │
│  │  On Delivery: 23     │  │  Avg Time: 28 min           │  │
│  │  Offline: 12        │  │  Success Rate: 98.2%         │  │
│  │  Busy: 8           │  │  Customer Rating: 4.7 ⭐      │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Build vs Partner Strategy

| Component | Strategy | Reason |
|----------|----------|--------|
| Rider App | Partner | Already exist (Porter, Dunzo) |
| Fleet Management | Build | Core competency |
| Route Optimization | Build | AI advantage |
| Tracking | Build | Customer experience |
| Assignment Engine | Build | Efficiency |
| Payment Settlement | Partner | Compliance |

### Implementation Steps

```
PHASE 1: Aggregator Aggregation (Weeks 1-4)
├── [ ] Unified delivery API
├── [ ] Multi-aggregator support
├── [ ] Single tracking UI
└── [ ] Aggregator sync

PHASE 2: Hybrid Model (Weeks 5-12)
├── [ ] Partner with Porter/Dunzo
├── [ ] Build assignment engine
├── [ ] Create routing optimization
├── [ ] Add delivery guarantees
└── [ ] Build rider tracking

PHASE 3: Own Delivery (Weeks 13-24)
├── [ ] Pilot city (Bangalore)
├── [ ] Hire/partner with riders
├── [ ] Build fleet management
├── [ ] Optimize operations
└── [ ] Scale to 3 cities

PHASE 4: Platform (Weeks 25-36)
├── [ ] Open API for restaurants
├── [ ] Dark kitchen integration
├── [ ] Subscription delivery
└── [ ] International expansion
```

---

## Module 5: ReZ Capital (Lending)

### Current State
- No financial services
- No lending
- Missed revenue opportunity

### Target State
```
┌──────────────────────────────────────────────────────────────┐
│                       REZ CAPITAL                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  FOR RESTAURANTS                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  YOUR BUSINESS HEALTH                                   │  │
│  │  ───────────────────────────────────────────────────│  │
│  │                                                         │  │
│  │  Monthly Revenue: ₹4,52,000    Tenure: 6 months      │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━ 80% utilized             │  │
│  │                                                         │  │
│  │  Credit Limit: ₹2,50,000      Available: ₹50,000    │  │
│  │                                                         │  │
│  │  Interest Rate: 1.2%/month                             │  │
│  │  Eligibility: Based on POS data (automated)            │  │
│  │                                                         │  │
│  │  ┌────────────────┐  ┌────────────────┐               │  │
│  │  │   APPLY NOW   │  │  REPAYMENT     │               │  │
│  │  │   No collateral│  │  Auto-deducted │              │  │
│  │  │   Disbursal 24h│  │  from revenue  │               │  │
│  │  └────────────────┘  └────────────────┘               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Build vs Partner Strategy

| Component | Strategy | Reason |
|----------|----------|--------|
| Credit Assessment | Build | POS data advantage |
| Risk Scoring | Build | AI + transaction data |
| Loanorigination | Partner | Regulatory (NBFC) |
| Disbursement | Partner | Banking rails |
| Collections | Partner | Legal compliance |
| Interest calculation | Build | Core product |

### Implementation Steps

```
PHASE 1: Data Foundation (Weeks 1-4)
├── [ ] Build merchant health score
├── [ ] Create credit assessment model
├── [ ] Integrate POS revenue data
├── [ ] Build risk scoring engine
└── [ ] Create underwriting rules

PHASE 2: Partner Integration (Weeks 5-8)
├── [ ] Partner with NBFC (Capital Float/PineLabs)
├── [ ] Build loan application flow
├── [ ] Create automated approval
├── [ ] Add disbursement integration
└── [ ] Build repayment tracking

PHASE 3: Product Launch (Weeks 9-12)
├── [ ] Launch to select restaurants
├── [ ] Monitor defaults
├── [ ] Refine credit model
├── [ ] Scale eligibility
└── [ ] Add credit line increase

PHASE 4: Expansion (Weeks 13-24)
├── [ ] Employee payroll advance
├── [ ] Supplier financing
├── [ ] Equipment leasing
└── [ ] Multi-city rollout
```

---

## Module 6: Staff Management

### Current State
- No staff module
- Manual scheduling
- No performance tracking
- No tip management

### Target State
```
┌──────────────────────────────────────────────────────────────┐
│                    STAFF MANAGEMENT                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TODAY: May 10, 2026                                 │  │
│  │  ───────────────────────────────────────────────────│  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │  STAFF ON DUTY (12)                           │   │  │
│  │  │                                               │   │  │
│  │  │  🧑‍🍳 Kitchen (4)     👨‍🍳 Tandoor (2)    │   │  │
│  │  │  • Rahul (AM)        • Amit (Full)           │   │  │
│  │  │  • Priya (AM)        • Neha (PM)             │   │  │
│  │  │                                               │   │  │
│  │  │  🍽️ Service (4)      💰 Billing (2)         │   │  │
│  │  │  • Vikram (Full)      • Simran (Full)        │   │  │
│  │  │  • Anita (PM)         • Raj (AM)             │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  PERFORMANCE TODAY │  │  SCHEDULE WEEK            │  │
│  │                     │  │                             │  │
│  │  Rahul: 45 orders  │  │  Mon  ✓✓✓✓✓✓✓           │  │
│  │  Amit: 32 orders   │  │  Tue  ✓✓✓✓✓✓✓            │  │
│  │  Priya: 38 orders │  │  Wed  ✓✓✓✓✓✓✓            │  │
│  │                     │  │  ...                      │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Features to Build

| Feature | Priority | Complexity |
|---------|----------|------------|
| Staff Profiles | Critical | Low |
| Shift Scheduling | Critical | Medium |
| Attendance | Critical | Low |
| Performance Tracking | High | Medium |
| Tip Pooling | High | Medium |
| Payroll Integration | High | Medium |
| Staff Communication | Medium | Low |
| Training Tracker | Medium | Low |

### Implementation Steps

```
PHASE 1: Core (Weeks 1-4)
├── [ ] Staff profile management
├── [ ] Attendance tracking
├── [ ] Basic scheduling
└── [ ] Role/permissions

PHASE 2: Operations (Weeks 5-8)
├── [ ] Advanced scheduling
├── [ ] Shift swaps
├── [ ] Performance metrics
└── [ ] Tip management

PHASE 3: Payroll (Weeks 9-12)
├── [ ] Payroll calculation
├── [ ] Attendance integration
├── [ ] Bank transfer (Razorpay Payroll)
└── [ ] Tax compliance

PHASE 4: Intelligence (Weeks 13-16)
├── [ ] AI scheduling
├── [ ] Predictive staffing
├── [ ] Performance insights
└── [ ] Training recommendations
```

---

## PART 4: IMPLEMENTATION TIMELINE

### 6-Month Roadmap

```
MONTH 1: Analytics Foundation
┌─────────────────────────────────────────────────────────────────────┐
│ Week 1-2: Data pipeline, warehouse setup                           │
│ Week 3-4: Core dashboards, revenue metrics                          │
│ Week 5-6: Customer analytics, customer 360                          │
│ Week 7-8: Operational metrics, real-time processing                 │
│ Week 9-12: AI insights, predictive models, alerts                   │
└─────────────────────────────────────────────────────────────────────┘

MONTH 2-3: Smart Inventory + Staff
┌─────────────────────────────────────────────────────────────────────┐
│ Week 1-4: Recipe mapping, stock tracking, waste logging              │
│ Week 5-8: Demand forecasting, auto-reorder, NextaBizz integration   │
│ Week 9-12: Staff profiles, scheduling, attendance, performance       │
└─────────────────────────────────────────────────────────────────────┘

MONTH 3-4: CDP + Marketing
┌─────────────────────────────────────────────────────────────────────┐
│ Week 1-4: Unified profiles, data ingestion, 360 view                │
│ Week 5-8: Segmentation, churn prediction, LTV scoring               │
│ Week 9-12: Personalization API, automated campaigns, triggers        │
└─────────────────────────────────────────────────────────────────────┘

MONTH 4-5: ReZ Capital (Pilot)
┌─────────────────────────────────────────────────────────────────────┐
│ Week 1-4: Merchant health score, credit model, risk engine         │
│ Week 5-8: Partner NBFC, loan application, disbursement             │
│ Week 9-12: Launch to 100 restaurants, monitor defaults               │
└─────────────────────────────────────────────────────────────────────┘

MONTH 5-6: Delivery (Hybrid)
┌─────────────────────────────────────────────────────────────────────┐
│ Week 1-4: Aggregator aggregation, unified tracking                 │
│ Week 5-8: Partner integration, routing optimization                 │
│ Week 9-12: Pilot with 3-5 restaurant, fleet management             │
│ Week 13+: Own delivery pilot city                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PART 5: RESOURCE REQUIREMENTS

### Team Structure

| Role | Q1 | Q2 | Q3 |
|------|----|----|-----|
| Backend Engineers | 4 | 6 | 8 |
| Frontend Engineers | 2 | 4 | 5 |
| Data Engineers | 2 | 3 | 4 |
| ML Engineers | 1 | 2 | 3 |
| Product Managers | 1 | 2 | 2 |
| Designers | 1 | 2 | 2 |
| QA | 2 | 3 | 4 |
| DevOps | 1 | 2 | 2 |

### Infrastructure Costs

| Service | Monthly | Scale |
|---------|---------|-------|
| Compute (EC2/GKE) | ₹2L | Per cluster |
| Database (MongoDB Atlas) | ₹50K | 100GB |
| Analytics (Redshift) | ₹1L | Enterprise |
| AI/ML (SageMaker) | ₹1L | Per model |
| CDN (Cloudflare) | ₹25K | Enterprise |
| Monitoring (Datadog) | ₹50K | Pro |

### Total Monthly Infra: ₹5-10L (scales with usage)

---

## PART 6: SUCCESS METRICS

### Technical KPIs

| Metric | Target | Timeline |
|--------|--------|----------|
| Dashboard Load Time | <2s | Month 3 |
| Analytics Accuracy | >95% | Month 4 |
| Inventory Sync | Real-time | Month 3 |
| CDP Profile Match | >80% | Month 5 |
| Churn Prediction Accuracy | >75% | Month 6 |

### Business KPIs

| Metric | Baseline | Month 6 | Month 12 |
|--------|----------|---------|----------|
| Customer LTV | ₹2,000 | ₹3,500 | ₹5,000 |
| Restaurant Retention | 70% | 82% | 90% |
| Avg Order Value | ₹350 | ₹420 | ₹500 |
| Food Waste % | 5% | 3% | 2% |
| Staff Turnover | 40%/year | 30% | 20% |
| Loan Disbursement | ₹0 | ₹50L | ₹5Cr |

---

## PART 7: RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data quality issues | High | Medium | Phased rollout, validation |
| Partner delays (NBFC) | Medium | High | Multiple NBFC options |
| Regulatory compliance | Medium | High | Legal review, partner expertise |
| Engineering capacity | High | High | Prioritize, hire ahead |
| Adoption resistance | Medium | Medium | Training, UX focus |
| Competition response | Low | Medium | Speed, innovation |

---

## Summary: 6-Month Priority

| Priority | Module | Investment | Revenue Impact |
|----------|--------|-----------|---------------|
| **1** | Analytics Dashboard v2 | ₹2 Cr | Retention +10% |
| **2** | Customer Data Platform | ₹3 Cr | LTV +25% |
| **3** | Smart Inventory | ₹5 Cr | Waste -50% |
| **4** | Staff Management | ₹2 Cr | Turnover -25% |
| **5** | ReZ Capital | ₹20 Cr | ₹5 Cr loan book |
| **6** | Delivery (Hybrid) | ₹10 Cr | Commission -50% |

**Total Investment (6 months): ₹42 Cr**
**Expected ROI: 2-3x within 12 months**

---

*Document Version: 1.0*
*Last Updated: May 10, 2026*
