# REZ MERCHANT - DEEP AUDIT REPORT

**Date:** May 11, 2026
**Auditor:** Claude Code
**Version:** 1.0

---

## EXECUTIVE SUMMARY

Comprehensive audit of REZ Merchant ecosystem reveals:
- ✅ **Core architecture is solid** - 100+ routes, 13 routers
- ✅ **All industry modules built** - Hotel, Salon, Restaurant, Fitness, Healthcare
- ⚠️ **Port configuration mismatch** - Needs fix
- ⚠️ **SOT incomplete** - Restaurant services missing
- ⚠️ **Support copilot** - Intents not integrated

---

## 1. CORE SERVICES AUDIT

### 1.1 rez-merchant-service

**Location:** `/REZ-Merchant/rez-merchant-service/`

| Aspect | Status | Notes |
|--------|--------|-------|
| Routes | ✅ 100+ | All properly registered |
| Routers | ✅ 13 modules | Core, orders, engagement, campaigns, etc. |
| Models | ✅ 50+ | Complete |
| Services | ✅ | Business logic separated |
| Middleware | ✅ | Auth, validation, rate limiting |
| Health Checks | ✅ | `/health`, `/healthz` |

**Port Configuration:**
```typescript
// src/index.ts
const PORT = parseInt(process.env.PORT || '4005', 10);
```

**Routes Registered:**
```
/api/v1/merchant/auth
/api/v1/merchant/stores
/api/v1/merchant/products
/api/v1/merchant/orders
/api/v1/merchant/customers
/api/v1/merchant/loyalty
/api/v1/merchant/campaigns
/api/v1/merchant/analytics
/api/v1/merchant/staff
... (100+ total)
```

---

### 1.2 rez-merchant-copilot

**Location:** `/REZ-Merchant/rez-merchant-copilot/`

| Aspect | Status | Notes |
|--------|--------|-------|
| Health Scorer | ✅ | Generic + Salon + Restaurant |
| Recommendations | ✅ | Generic + Salon + Restaurant |
| Competitor Analyzer | ✅ | |
| Decision Engine | ✅ | |
| Routes | ✅ | copilotRoutes, salonRoutes, restaurantRoutes |

**Endpoints:**
```
GET /api/merchant/:id/profile
GET /api/merchant/:id/insights
GET /api/merchant/:id/recommendations
GET /api/merchant/:id/health-score
GET /api/merchant/:id/decisions
GET /api/merchant/:id/competitors
GET /api/salon/:id/profile
GET /api/salon/:id/health-score
GET /api/salon/:id/recommendations
GET /api/restaurant/:id/profile
GET /api/restaurant/:id/health-score
GET /api/restaurant/:id/recommendations
```

---

### 1.3 REZ-support-copilot (Support Copilot)

**Location:** `/REZ-Intelligence/REZ-support-copilot/`

| Aspect | Status | Notes |
|--------|--------|-------|
| Intent Detection | ✅ | Multiple patterns loaded |
| Training Data | ✅ | 15+ files |
| Restaurant Intents | ⚠️ | File exists but not integrated |
| Salon Intents | ❌ | Not found |

**Training Files Found:**
```
training-data/
├── restaurant-intents.json      ← NOT integrated
├── improved-patterns.json
├── full-training-data.json
├── intent-training.json
└── [10+ more]
```

**ISSUE:** `restaurant-intents.json` exists but not loaded into classifier.

---

## 2. INDUSTRY MODULES AUDIT

### 2.1 Merchant Service Modules

**Location:** `/REZ-Merchant/rez-merchant-service/src/modules/`

| Module | Models | Services | Routes | Status |
|--------|--------|----------|--------|--------|
| Common | ✅ | ✅ | Via routes/ | ✅ |
| Restaurant | 8 files | 4 files | ❌ | ⚠️ Routes missing |
| Salon | 7 files | 5 files | ❌ | ⚠️ Routes missing |
| Healthcare | ✅ | ✅ | ❌ | ⚠️ Routes missing |
| Fitness | ✅ | ✅ | ❌ | ⚠️ Routes missing |
| Events | ✅ | ✅ | ❌ | ⚠️ Routes missing |

**ISSUE:** Modules export services but no API routes. Should be exposed via:
- `/api/v1/merchant/restaurant/*`
- `/api/v1/merchant/salon/*`

---

### 2.2 Industry-OS Services

**Location:** `/REZ-Merchant/industry-os/`

| Service | Status | Notes |
|---------|--------|-------|
| Salon Ecosystem Docs | ✅ | Complete ARCHITECTURE.md |
| Hotel Ecosystem Docs | ✅ | Complete ARCHITECTURE.md |

**Actual Services Located At:**
```
/REZ-Merchant/industry-os/
├── rez-salon-service/         ← Complete
├── rez-salon-pos-service/    ← Complete
├── rez-salon-crm-service/    ← Complete
├── rez-restaurant-service/   ← Complete
└── [10+ more]
```

---

## 3. APP MODULES AUDIT

### 3.1 rez-app-merchant

**Location:** `/REZ-Merchant/rez-app-merchant/`

| Module | Pages | API Files | Status |
|--------|-------|-----------|--------|
| Restaurant | 8 | Connected | ✅ |
| Salon | 6 | Connected | ✅ |
| Hotel | 6 | Connected | ✅ |
| POS | 12 | Connected | ✅ |
| KDS | 3 | Connected | ✅ |
| Appointments | 7 | Connected | ✅ |
| CRM | ✅ | Connected | ✅ |
| Inventory | ✅ | Connected | ✅ |
| Staff | ✅ | Connected | ✅ |
| Marketing | ✅ | Connected | ✅ |
| Loyalty | ✅ | Connected | ✅ |
| Analytics | ✅ | Connected | ✅ |

**API Service Files:** 77 total

---

## 4. CONNECTIONS AUDIT

### 4.1 App → Backend Connection

```
rez-app-merchant (Expo)
    │
    ├── services/api/client.ts
    │       │
    │       └── MERCHANT_SERVICE_BASE_URL
    │               │
    │               └── process.env.EXPO_PUBLIC_MERCHANT_SERVICE_URL
    │                       │
    │                       └── (dev) http://localhost:3007
    │                       └── (prod) EXPO_PUBLIC_MERCHANT_SERVICE_URL
    │
    └── rez-merchant-service (:3007)
            │
            ├── routes/ (100+ endpoints)
            └── modules/ (industry modules)
```

**PORT CONFLICT FOUND:**
```typescript
// rez-merchant-service/src/index.ts
const PORT = parseInt(process.env.PORT || '4005', 10);

// services/api/client.ts (dev mode)
http://localhost:3007  // ← NOT 4005!
```

**Comment in client.ts says:**
> "MERCH-FIX: MERCHANT_SERVICE_BASE_URL was hardcoded to localhost:4005 but rez-merchant-service runs on port 3007 in this dev environment."

**ACTION REQUIRED:** Align ports consistently.

---

### 4.2 Copilot → Services

```
rez-merchant-copilot
    │
    ├── services/merchantHealthScorer.ts
    │       │
    │       ├── MERCHANT_SERVICE_URL (default: localhost:4003)
    │       ├── ORDER_SERVICE_URL (default: localhost:4002)
    │       └── WALLET_SERVICE_URL (default: localhost:4004)
    │
    ├── services/salonHealthScorer.ts
    │       │
    │       └── SALON_SERVICE_URL (default: localhost:4010)
    │
    └── services/restaurantHealthScorer.ts
            │
            └── RESTAURANT_SERVICE_URL (default: localhost:XXXX)
```

**ISSUE:** RESTAURANT_SERVICE_URL has no default port.

---

### 4.3 Support Copilot → Intents

```
REZ-support-copilot
    │
    ├── training-data/restaurant-intents.json  ← EXISTS
    │
    ├── src/index.js
    │       │
    │       └── IntentClassifier
    │               │
    │               └── training-data/intent-training.json  ← LOADED
    │                       │
    │                       └── NOT restaurant-intents.json
    │
    └── Intent handlers
            │
            ├── intents/searchIntent.js  (has restaurant patterns)
            └── intents/orderIntent.js
```

**ISSUE:** restaurant-intents.json exists but not loaded into IntentClassifier.

---

## 5. SOT AUDIT

### 5.1 What's Documented

| Section | Status | Completeness |
|---------|--------|--------------|
| Hotel Ecosystem | ✅ | 95% |
| Salon Ecosystem | ✅ | 90% |
| Restaurant Ecosystem | ⚠️ | 30% (features only, no services) |
| Merchant Copilot | ⚠️ | 50% (mentioned, no endpoints) |
| Support Copilot | ❌ | 0% (not documented) |
| Industry Modules | ⚠️ | 40% (app modules listed, no services) |

### 5.2 Missing from SOT

**Restaurant Ecosystem Services:**
```
❌ rez-restaurant-service        (no port, no description)
❌ rez-restaurant-pos-service    (no port, no description)
❌ rez-restaurant-crm-service   (no port, no description)
❌ Restaurant Health Metrics   (not in Merchant Copilot section)
```

**Merchant Copilot Endpoints:**
```
❌ All /api/merchant/:id/* endpoints
❌ All /api/salon/:id/* endpoints
❌ All /api/restaurant/:id/* endpoints
```

**Support Copilot:**
```
❌ Not documented at all
❌ Intents not listed
❌ Connection to REZ Mind not documented
```

---

## 6. ISSUES SUMMARY

### Critical (Fix Now)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Port mismatch | merchant-service:4005 vs client:3007 | Align to one port |
| 2 | Restaurant intents not integrated | REZ-support-copilot | Load restaurant-intents.json |
| 3 | SOT incomplete | SOURCE-OF-TRUTH.md | Add restaurant services, copilot endpoints |

### High Priority

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 4 | Module routes not exposed | modules/*/routes | Create routes or document why not needed |
| 5 | Restaurant Health Scorer has no default URL | restaurantHealthScorer.ts | Add RESTAURANT_SERVICE_URL default |

### Medium Priority

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 6 | Salon intents not in Support Copilot | training-data/ | Add salon patterns |
| 7 | Healthcare/Fitness modules no routes | modules/ | Document integration plan |

---

## 7. RECOMMENDED ACTIONS

### Immediate (Today)

1. **Fix Port Alignment**
   ```typescript
   // Option A: Change merchant-service to 4005
   // Option B: Update client to use 4005
   ```

2. **Integrate Restaurant Intents**
   ```javascript
   // src/index.js
   const trainingData = require('../training-data/intent-training.json');
   // ADD: require('../training-data/restaurant-intents.json');
   ```

3. **Update SOT**
   - Add Restaurant ecosystem services with ports
   - Add Merchant Copilot endpoints
   - Add Support Copilot section

### This Week

4. **Create Module Routes**
   - Add restaurant routes: `/api/v1/merchant/restaurant/*`
   - Add salon routes: `/api/v1/merchant/salon/*`

5. **Fix Restaurant Health Scorer**
   ```typescript
   const RESTAURANT_SERVICE_URL = process.env.RESTAURANT_SERVICE_URL || 'http://localhost:4010';
   ```

6. **Test End-to-End**
   - Merchant App → Merchant Service
   - Merchant Copilot → Industry Services
   - Support Copilot → All Intents

---

## 8. VERIFICATION CHECKLIST

### Services Running
- [ ] rez-merchant-service (which port?)
- [ ] rez-merchant-copilot (port 4022)
- [ ] REZ-support-copilot (port 4033)
- [ ] Industry services (4010-4020)

### API Connectivity
- [ ] App can reach merchant service
- [ ] Copilot can reach industry services
- [ ] Support copilot loads all intents

### SOT Updated
- [ ] Restaurant services documented
- [ ] All copilot endpoints listed
- [ ] Support copilot documented
- [ ] Port conflicts resolved

---

## 9. APPENDIX: SERVICE PORTS

| Service | Default Port | Config Location |
|---------|--------------|----------------|
| rez-merchant-service | 4005* | .env or Render |
| rez-merchant-copilot | 4022 | .env |
| REZ-support-copilot | 4033 | .env |
| rez-salon-service | 4010 | .env |
| rez-salon-pos-service | 4011 | .env |
| rez-restaurant-service | ??? | .env |
| rez-hotel-service | 4006 | .env |

*Port 4005 is listed in code but client.ts expects 3007 in dev mode.

---

## END OF AUDIT
