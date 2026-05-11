# CorpPerks + Restaurant Integration

**Version:** 1.0.0
**Last Updated:** 2026-05-11
**Status:** Draft

---

## Current State

### CorpPerks Modules

| Module | Status | Description |
|--------|--------|-------------|
| **Benefits** | Implemented | Meal, Travel, Wellness, Learning, Gift budgets |
| **Employees** | Implemented | HRIS sync, enrollment, role-based access |
| **Hotel Bookings** | Implemented | Makcorps OTA, GST-ready invoices |
| **GST Invoicing** | Implemented | Invoice generation, GSTR-1 reports |
| **Corporate Gifting** | Implemented | NextaBizz procurement, bulk orders |
| **Karma/CSR** | Implemented | Volunteer campaigns, impact tracking |
| **ReZ Coins** | Implemented | Tier system, milestone rewards |
| **Corporate Wallet** | Implemented | Multi-category benefit wallet |
| **RTMN Finance** | Implemented | Cards, BNPL, settlements |
| **Restaurant Dining** | **MISSING** | Corporate meal benefits |

### Restaurant Integration Points

| Integration Point | Description | Priority |
|------------------|-------------|----------|
| Meal Benefits | Corporate meal allowances at restaurants | **P0** |
| Corporate Gifting | Food hampers via NextaBizz | **P1** |
| ReZ Coins | Restaurant loyalty integration | **P1** |
| Team Dining | Corporate group bookings | **P1** |
| Catering | Corporate event catering | **P2** |
| GST Invoicing | Restaurant bill GST | **P0** |

---

## Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          CorpPerks Platform                                   │
│  ┌─────────────────┐    ┌────────────────────────┐    ┌─────────────────┐  │
│  │  Admin Portal    │    │  Employee App (Karma)  │    │  Restaurant     │  │
│  │  /corp/*        │    │  /karma/corp/*        │    │  Partner Portal │  │
│  └────────┬─────────┘    └────────────┬───────────┘    └────────┬────────┘  │
│           │                          │                        │             │
│           └──────────────────────────┼────────────────────────┘             │
│                                      ▼                                        │
│                    ┌────────────────────────────────────┐                   │
│                    │   rez-corpperks-service (4013)    │                   │
│                    │   ┌────────────────────────────┐  │                   │
│                    │   │  Restaurant Module (NEW)   │  │                   │
│                    │   │  • Meal Benefit Service   │  │                   │
│                    │   │  • Corporate Order Svc    │  │                   │
│                    │   │  • Restaurant Controller   │  │                   │
│                    │   └────────────────────────────┘  │                   │
│                    └──────────────┬─────────────────────┘                   │
│                                       │                                       │
└───────────────────────────────────────┼───────────────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│ rez-merchant-service  │  │  rez-order-service    │  │  rez-wallet-service   │
│ (Restaurant Config)   │  │  (Corporate Orders)  │  │  (Meal Benefits)       │
│                       │  │                       │  │                       │
│ • MerchantCorporate   │  │ • CorporateOrder      │  │ • MealBenefit         │
│   Config Model        │  │   Extension           │  │ • DiningCredit        │
│ • Restaurant Partner  │  │ • Team Lunch          │  │ • BenefitAllocation   │
│   Onboarding          │  │ • Catering Orders     │  │                       │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
            │                           │                           │
            │                           │                           │
            └───────────────────────────┼───────────────────────────┘
                                        ▼
                        ┌───────────────────────────────┐
                        │     External Integrations     │
                        │                               │
                        │  • rez-payment-service        │
                        │  • rez-finance-service (GST) │
                        │  • NextaBizz (Gifting)       │
                        └───────────────────────────────┘
```

---

## What's Missing

### 1. Restaurant Module in rez-corpperks-service

**Current State:** No restaurant-specific module exists in CorpPerks.

**Required Components:**
- [ ] `restaurantController.js` - HTTP handlers for restaurant endpoints
- [ ] `restaurantModel.js` - Corporate-restaurant link schema
- [ ] `mealBenefitService.js` - Meal benefit processing
- [ ] `corporateOrderService.js` - Corporate restaurant orders

### 2. Merchant Corporate Configuration

**Current State:** `MerchantCorporateConfig` schema exists in documentation only.

**Required in rez-merchant-service:**
- [ ] Implement `MerchantCorporateConfig` model
- [ ] Add corporate partner endpoints
- [ ] Create onboarding flow for restaurants

### 3. Corporate Order Extensions

**Current State:** `CorporateOrderFields` defined but not implemented.

**Required in rez-order-service:**
- [ ] Extend Order schema with corporate fields
- [ ] Add team lunch booking endpoint
- [ ] Implement catering order flow

### 4. Meal Benefit Wallet Extension

**Current State:** `BenefitAllocation` model defined but not implemented.

**Required in rez-wallet-service:**
- [ ] Add `meal_benefit` coin type
- [ ] Implement `BenefitAllocation` model
- [ ] Create benefit redemption flow

---

## Data Flow: Meal Benefit Redemption

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Employee Opens ReZ App                                            │
│    Selects restaurant with "Accepts CorpPerks" badge                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Employee Scans QR / Browses Menu                                  │
│    System detects corporate meal benefit eligibility                   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Cart Creation with Meal Benefit Applied                           │
│    CorpPerks validates:                                              │
│    • Employee has active meal benefit                                 │
│    • Restaurant is corporate partner                                 │
│    • Order within benefit limit                                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Payment Processing                                               │
│    • Deduct from meal benefit wallet                                 │
│    • Generate GST invoice (HSN: 9963, 18%)                           │
│    • Charge corporate account or employee (configurable)             │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Order Confirmation                                                │
│    • Push notification to employee                                  │
│    • Email receipt to company finance                               │
│    • Update restaurant dashboard                                     │
│    • Record benefit usage for reporting                              │
└─────────────────────────────────┴───────────────────────────────────┘
```

---

## API Contracts

### Restaurant Module Endpoints

```
# Partner Onboarding
POST   /api/corp/restaurants/partner-request     Register as corporate partner
GET    /api/corp/restaurants/:id                 Get restaurant details
PUT    /api/corp/restaurants/:id/config           Update corporate config

# Meal Benefits
GET    /api/corp/restaurants/:id/benefits         Get accepted benefit types
POST   /api/corp/benefits/meal/validate           Validate meal benefit eligibility
POST   /api/corp/benefits/meal/redeem             Redeem meal benefit

# Corporate Orders
POST   /api/corp/dining/orders                   Create corporate dining order
GET    /api/corp/dining/orders                   List corporate orders
GET    /api/corp/dining/orders/:id               Get order details
POST   /api/corp/dining/orders/:id/approve       Approve order (if required)

# Team Dining
POST   /api/corp/dining/team-lunch              Book team lunch
GET    /api/corp/dining/team-lunch/availability  Check availability

# Catering
POST   /api/corp/catering/quote                 Request catering quote
POST   /api/corp/catering/book                   Book catering
```

### Request/Response Examples

#### Validate Meal Benefit

**Request:**
```json
POST /api/corp/benefits/meal/validate
{
  "employeeId": "EMP001",
  "restaurantId": "REST001",
  "orderAmount": 1500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "benefitType": "meal_allowance",
    "availableBalance": 2000,
    "maxDeduction": 1500,
    "merchantPartner": true,
    "gstInclusive": true,
    "gstBreakdown": {
      "taxableAmount": 1271.19,
      "gstRate": 18,
      "gstAmount": 228.81
    }
  }
}
```

#### Create Corporate Dining Order

**Request:**
```json
POST /api/corp/dining/orders
{
  "restaurantId": "REST001",
  "type": "team_lunch",
  "guestCount": 8,
  "scheduledDateTime": "2026-05-15T13:00:00Z",
  "dietaryRequirements": ["2 vegetarian", "1 Jain"],
  "costCenter": "SALES",
  "gstIn": "27AABCU9603R1ZM",
  "invoiceRequired": true,
  "items": [
    { "itemId": "ITEM001", "quantity": 8 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD20260511001",
    "status": "confirmed",
    "totalAmount": 2400,
    "gstAmount": 432,
    "benefitUsed": 2400,
    "invoice": {
      "invoiceNumber": "CP/DIN/2026-05/00001",
      "pdfUrl": "/api/gst/invoice/CP/DIN/2026-05/00001/pdf"
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Create restaurant module structure | CorpPerks Team | Directory + files |
| Implement MerchantCorporateConfig | Merchant Team | MongoDB model |
| Add corporate partner flag to merchant | Merchant Team | API endpoints |
| Create meal benefit validation service | CorpPerks Team | `/api/corp/benefits/meal/validate` |

### Phase 2: Order Flow (Week 2)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Extend Order schema with corporate fields | Order Team | Updated model |
| Implement corporate order creation | Order Team | `/api/corp/dining/orders` |
| Add benefit redemption to order flow | Wallet Team | Benefit deduction |
| Generate GST invoice on order | Finance Team | Invoice generation |

### Phase 3: Team Dining (Week 3)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Team lunch booking endpoint | Order Team | `/api/corp/dining/team-lunch` |
| Approval workflow | CorpPerks Team | Manager approval |
| Calendar/slot availability | Order Team | Availability check |

### Phase 4: Integration Testing (Week 4)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Integration test suite | QA Team | Test cases |
| Performance testing | Platform Team | Load tests |
| GST compliance verification | Finance Team | Compliance check |

---

## Configuration

### Environment Variables

```bash
# CorpPerks Service
CORPPERKS_PORT=4013
CORPPERKS_RESTAURANT_ENABLED=true

# Service URLs
MERCHANT_SERVICE_URL=http://localhost:4001
ORDER_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
FINANCE_SERVICE_URL=http://localhost:4005

# GST Configuration
CORPPERKS_GSTIN=27AABCU9603R1ZM
CORPPERKS_COMPANY_NAME=CorpPerks by RTMN Digital

# Restaurant Settings
MAX_MEAL_BENEFIT_AMOUNT=5000
AUTO_APPROVE_LIMIT=10000
CORPORATE_COMMISSION_RATE=5
```

### Database Indexes

```javascript
// MerchantCorporateConfig indexes
db.merchantCorporateConfigs.createIndex({ "merchantId": 1 }, { unique: true });
db.merchantCorporateConfigs.createIndex({ "isCorporatePartner": 1 });
db.merchantCorporateConfigs.createIndex({ "corporateSettings.acceptsMealBenefits": 1 });

// CorporateOrder indexes
db.orders.createIndex({ "companyId": 1, "createdAt": -1 });
db.orders.createIndex({ "isCorporateOrder": 1, "status": 1 });
db.orders.createIndex({ "costCenter": 1 });

// BenefitAllocation indexes
db.benefitAllocations.createIndex({ "companyId": 1, "employeeId": 1, "benefitType": 1 });
db.benefitAllocations.createIndex({ "periodEnd": 1 }, { expireAfterSeconds: 0 });
```

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| `CP-R001` | RESTAURANT_NOT_PARTNER | Restaurant not enrolled as corporate partner |
| `CP-R002` | MEAL_BENEFIT_EXHAUSTED | No remaining meal benefit balance |
| `CP-R003` | BENEFIT_EXPIRED | Meal benefit has expired |
| `CP-R004` | ORDER_EXCEEDS_LIMIT | Order amount exceeds benefit limit |
| `CP-R005` | APPROVAL_REQUIRED | Order requires manager approval |
| `CP-R006` | SLOT_UNAVAILABLE | Requested time slot not available |
| `CP-R007` | CATERING_MIN_NOT_MET | Minimum order quantity for catering not met |

---

## Monitoring & Metrics

### Key Metrics

```javascript
const restaurantMetrics = {
  // Order metrics
  'corp.restaurant.orders.total': Counter,
  'corp.restaurant.orders.value': Histogram,
  'corp.restaurant.team_lunch.total': Counter,
  'corp.restaurant.catering.total': Counter,

  // Benefit metrics
  'corp.meal_benefit.redemptions': Counter,
  'corp.meal_benefit.amount': Histogram,
  'corp.meal_benefit.utilization': Gauge,

  // Partner metrics
  'corp.restaurant.partners.total': Gauge,
  'corp.restaurant.partners.active': Gauge,
  'corp.restaurant.partner_requests': Counter,
};
```

### Alerts

```
CRITICAL:
- Meal benefit redemption failure rate > 5%
- GST invoice generation failure
- Partner onboarding queue > 100 pending

WARNING:
- Average order processing time > 30s
- Benefit utilization < 50%
```

---

## Security Considerations

1. **Authorization**: Only corporate employees can access meal benefits
2. **Rate Limiting**: 100 requests/minute per employee for dining endpoints
3. **Audit Trail**: All benefit redemptions logged with employee ID, company ID, timestamp
4. **Data Privacy**: Employee benefit data encrypted at rest
5. **API Security**: Bearer token authentication required for all mutations

---

## Dependencies

| Service | Version | Purpose |
|---------|---------|---------|
| rez-merchant-service | Latest | Restaurant partner management |
| rez-order-service | Latest | Order management |
| rez-wallet-service | Latest | Benefit wallet |
| rez-payment-service | Latest | Payment processing |
| rez-finance-service | Latest | GST invoicing |
| MongoDB | 6.0+ | Primary database |
| Redis | 7.0+ | Caching, sessions |

---

## Testing Checklist

- [ ] Validate meal benefit eligibility
- [ ] Redeem meal benefit at partner restaurant
- [ ] Create team lunch booking
- [ ] Verify GST invoice generation
- [ ] Test approval workflow
- [ ] Verify ReZ Coins earning
- [ ] Test catering order flow
- [ ] Verify cost center allocation
- [ ] Test benefit expiry handling
- [ ] Verify corporate reporting data
