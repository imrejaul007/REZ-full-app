# REZ MERCHANT - COMPREHENSIVE AUDIT

**Date:** May 11, 2026
**Version:** 1.0

---

## DIRECTORY STRUCTURE

```
REZ-Merchant/
├── rez-merchant-service/          # Main backend service (169+ routes)
│   ├── src/
│   │   ├── routes/               # 100+ route files
│   │   ├── routers/              # 13 router modules
│   │   ├── modules/             # Industry modules
│   │   │   ├── restaurant/      # Restaurant OS
│   │   │   ├── salon/           # Salon OS
│   │   │   ├── healthcare/      # Healthcare OS
│   │   │   ├── fitness/         # Fitness OS
│   │   │   └── common/          # Shared
│   │   └── services/
│   └── package.json
│
├── rez-merchant-copilot/         # AI Copilot (merchant insights)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── copilotRoutes.ts
│   │   │   ├── salonRoutes.ts
│   │   │   ├── restaurantRoutes.ts
│   │   │   └── orderWebhooks.ts
│   │   └── services/
│   │       ├── merchantHealthScorer.ts
│   │       ├── salonHealthScorer.ts
│   │       ├── restaurantHealthScorer.ts
│   │       ├── recommendationEngine.ts
│   │       ├── salonRecommendationEngine.ts
│   │       ├── restaurantRecommendationEngine.ts
│   │       ├── competitorAnalyzer.ts
│   │       └── decisionEngine.ts
│   └── server.ts
│
├── industry-os/                  # Industry-specific services
│   ├── hotel-ecosystem/
│   ├── salon-ecosystem/
│   ├── restauranthub/
│   └── [service-name]-admin-web/
│   └── [service-name]-pos-service/
│
├── REZ-dashboard/              # Dashboard
├── rez-barcode-scanner-ui/       # QR Scanner
└── rez-merchant-integrations/    # Third-party integrations
```

---

## MERCHANT SERVICE - ROUTES OVERVIEW

### Core Routers

| Router | Routes | Purpose |
|--------|--------|---------|
| `core` | 30+ | Auth, stores, products, dashboard |
| `orders` | 15+ | Order management |
| `engagement` | 10+ | Campaigns, offers |
| `campaigns` | 20+ | Marketing campaigns |
| `analytics` | 15+ | Reports, metrics |
| `finance` | 20+ | Payments, payouts |
| `staff` | 15+ | HR, shifts |
| `operations` | 10+ | Integrations, delivery |
| `support` | 10+ | Tickets, disputes |

### Key Routes

```
/api/auth/*                 # Authentication
/api/stores/*               # Store management
/api/products/*             # Product catalog
/api/dashboard/*            # Dashboard data
/api/orders/*               # Order management
/api/customers/*            # Customer CRM
/api/loyalty/*              # Loyalty program
/api/campaigns/*            # Marketing
/api/analytics/*            # Reports
/api/staff/*                # Staff management
/api/gst/*                 # Tax filing
/api/payments/*             # Payment processing
```

---

## MERCHANT COPILOT - AI ENDPOINTS

### Health Score Endpoints

| Endpoint | Purpose | Industry |
|----------|---------|----------|
| `GET /api/merchant/:id/profile` | Merchant profile + health | All |
| `GET /api/merchant/:id/insights` | AI insights | All |
| `GET /api/merchant/:id/recommendations` | Recommendations | All |
| `GET /api/merchant/:id/health-score` | Health breakdown | All |
| `GET /api/merchant/:id/decisions` | Operational decisions | All |
| `GET /api/merchant/:id/competitors` | Competitor analysis | All |

### Salon Endpoints (NEW)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/salon/:id/profile` | Salon profile + health |
| `GET /api/salon/:id/health-score` | Salon health breakdown |
| `GET /api/salon/:id/metrics` | Salon metrics |
| `GET /api/salon/:id/recommendations` | Salon recommendations |
| `GET /api/salon/:id/campaigns` | Marketing campaigns |
| `GET /api/salon/:id/staff-performance` | Staff analytics |
| `GET /api/salon/:id/insights` | AI-generated insights |

### Restaurant Endpoints (NEW)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/restaurant/:id/profile` | Restaurant profile + health |
| `GET /api/restaurant/:id/health-score` | Restaurant health |
| `GET /api/restaurant/:id/metrics` | Restaurant metrics |
| `GET /api/restaurant/:id/recommendations` | Restaurant recommendations |
| `GET /api/restaurant/:id/insights` | AI-generated insights |

---

## MERCHANT SERVICE - MODULES

### Restaurant Module

**Location:** `src/modules/restaurant/`

| Sub-module | Files | Purpose |
|------------|-------|---------|
| AI | `demandForecast.ts`, `smartInventory.ts` | Forecasting |
| Operations | `reservations.ts`, `dynamicPricing.ts`, `recipeCosting.ts`, `voiceOrder.ts` | Core ops |
| Analytics | `dashboard.ts` | Reports |

### Salon Module

**Location:** `src/modules/salon/`

| Sub-module | Files | Purpose |
|------------|-------|---------|
| Models | `service.ts`, `appointment.ts`, `treatmentRoom.ts`, `staffCommission.ts`, `clientHistory.ts`, `salonProduct.ts`, `cancellationPolicy.ts` | Data models |
| Services | `salonService.ts`, `commissionService.ts`, `clientHistoryService.ts`, `inventoryService.ts`, `cancellationService.ts` | Business logic |

### Healthcare Module

**Location:** `src/modules/healthcare/`

| Sub-module | Files | Purpose |
|------------|-------|---------|
| Models | Appointment, Prescription, Patient |
| Services | Consultation, Telemedicine |

### Fitness Module

**Location:** `src/modules/fitness/`

| Sub-module | Files | Purpose |
|------------|-------|---------|
| Models | Class, Trainer, Membership |
| Services | Scheduling, Attendance |

---

## SUPPORT COPILOT - INTENTS

**Location:** `REZ-Intelligence/REZ-support-copilot/`

### Intent Detection

| Intent | Patterns | Purpose |
|--------|----------|---------|
| `RESTAURANT_SEARCH` | restaurant, food, cuisine, dinner | Find restaurants |
| `MENU_SEARCH` | dish, item, menu, order | Find menu items |
| `LOCATION_SEARCH` | near, nearby, around | Location-based |
| `DIETARY_SEARCH` | vegetarian, vegan, halal | Dietary filters |
| `PRICE_SEARCH` | cheap, budget, under | Price filters |
| `BOOK_TABLE` | book table, reserve, reservation | Table booking |
| `ORDER_FOOD` | order, order food, place order | Food ordering |
| `CANCEL` | cancel, don't want, stop | Cancellation |

### Training Data

| File | Purpose |
|------|---------|
| `restaurant-intents.json` | Restaurant-specific patterns |
| `improved-patterns.json` | Core patterns |
| `hindi-chat-patterns.json` | Hindi/Hinglish support |

---

## CONNECTIONS & INTEGRATIONS

### Internal Services

| Service | URL | Purpose |
|---------|-----|---------|
| `rez-merchant-service` | :4003 | Core API |
| `rez-merchant-copilot` | :4022 | AI Insights |
| `REZ-support-copilot` | :4033 | Chat/Support |
| `rez-auth-service` | :4001 | Authentication |
| `rez-wallet-service` | :4004 | Payments |
| `rez-notification-service` | :4005 | Notifications |
| `REZ Mind` | :4006 | Intent Graph |

### External Integrations

| Service | Integration |
|---------|-------------|
| Swiggy | Order sync |
| Zomato | Order sync |
| Razorpay | Payments |
| AWS S3 | File storage |
| SendGrid | Email |
| Twilio | SMS |

---

## APP MODULES (rez-app-merchant)

### Industry Modules

| Module | Pages | Features |
|--------|-------|----------|
| **Restaurant** | 8 | Dashboard, Menu, Orders, Tables, Kitchen, Reservations |
| **Salon** | 6 | Dashboard, Schedule, Services, Customers, Earnings |
| **Hotel** | 6 | Channel Mgr, Housekeeping, Reviews, Overview |
| **Dine-in** | 4 | Waiter mode, Table mgmt, New order |
| **POS** | 12 | Billing, Payment, Commission, Loyalty, Queue |
| **KDS** | 3 | Kitchen display, Orders, Settings |
| **Appointments** | 7 | Calendar, Booking, Waitlist, Blocked time |

### Supporting Modules

| Module | Features |
|--------|----------|
| CRM | Customer profiles, History |
| Inventory | Stock tracking |
| Staff | Scheduling, Payroll |
| Marketing | Campaigns, Automations |
| Loyalty | Points, Tiers, Rewards |
| Analytics | Reports, KPIs |

---

## ISSUES FOUND

### 1. Module Routes Not Connected

**Issue:** Salon module has models and services but no API routes in `src/modules/salon/routes/`

**Status:** Routes should be exposed via merchant-service routes

### 2. Duplicate Structures

**Issue:** Some services exist in both:
- `/REZ-Merchant/industry-os/[service]`
- `/rez-[service]-service`

**Action Needed:** Consolidate or clarify which is canonical

### 3. Support Copilot Integration

**Issue:** Restaurant intents exist in `training-data/restaurant-intents.json` but not integrated into main copilot

**Action Needed:** Load restaurant-intents.json in main intent classifier

---

## RECOMMENDATIONS

### Priority 1: Fix Module Routes

1. Create salon routes: `/api/salon/*`
2. Create restaurant routes: `/api/restaurant/*`
3. Connect to merchant-copilot

### Priority 2: Consolidate Services

1. Identify canonical service location
2. Remove duplicates or create bridge
3. Update SOT

### Priority 3: Support Copilot Integration

1. Load `restaurant-intents.json` in main classifier
2. Add handlers for BOOK_TABLE, ORDER_FOOD
3. Test end-to-end flow

---

## SOT UPDATE NEEDED

Current SOT shows:
- ❌ Restaurant ecosystem services scattered
- ❌ Salon routes not listed
- ❌ Merchant copilot endpoints not documented
- ❌ Support copilot intents not documented

**Action:** Update SOT with:
1. Complete merchant-service routes
2. All merchant copilot endpoints
3. All industry modules
4. Support copilot intents

---

## NEXT STEPS

1. [ ] Fix salon/restaurant module routes
2. [ ] Consolidate duplicate services
3. [ ] Integrate restaurant-intents.json
4. [ ] Update SOT with complete merchant architecture
5. [ ] Test end-to-end flows
