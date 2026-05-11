# REZ PLATFORM - TARGET ARCHITECTURE

**Date:** May 6, 2026
**Version:** 1.0
**Total Deployments:** 22 (from 54 active)

---

## YOUR REQUIREMENTS

| Platform | Deployments | Strategy |
|----------|-------------|----------|
| REZ Core | 1 | Combine all 8 into 1 |
| REZ Marketing | 2 | adBazaar frontend + 1 backend |
| REZ AI/Intelligence | 1 | Combine all 6 into 1 |
| REZ Commerce | 10 | Keep separate |
| REZ Apps | 4 | Keep separate |
| REZ Utilities | 1 | Combine 4 into 1 |
| REZ Karma | 1 | Keep |
| Hotel/StayOwn | 3 | User OTA, PMS, Backend |
| CorpPerks | 2 | Frontend + Backend |
| Rendez | 1 | Standalone |
| Do | 1 | Standalone |
| Restaurant | 1 | Standalone |
| QR Services | 6 | Individual |
| REZ Try | 1 | Inside App + Web |
| REZ Admin | 1 | Standalone |
| REZ Merchant | 1 | Standalone |
| adBazaar | 2 | Frontend + Backend |

---

## TARGET: 22 DEPLOYMENTS

### 1. REZ CORE (8 → 1 deployment)

**Service:** `rez-core-platform`

**Contains:**
- rez-event-platform (event bus)
- rez-action-engine (decisions)
- rez-feedback-service (learning)
- rez-first-loop (orchestration)
- rez-intent-graph (AI brain)
- REZ-intelligence-hub (user profiles)
- REZ-user-intelligence-service (user intel)
- REZ-merchant-intelligence-service (merchant intel)

**Ports:**
- Event Platform: 4008
- Action Engine: 4009
- Feedback: 4010
- Intent Graph: 3001

---

### 2. REZ MARKETING BACKEND (5 → 1 deployment)

**Service:** `rez-marketing-backend`

**Contains:**
- rez-marketing-service
- rez-lead-intelligence
- rez-abandonment-tracker
- rez-decision-service
- rez-unified-messaging

**Port:** 4000

---

### 3. REZ AI/INTELLIGENCE (6 → 1 deployment)

**Service:** `rez-ai-platform`

**Contains:**
- REZ-personalization-engine
- REZ-recommendation-engine
- REZ-targeting-engine
- REZ-push-service
- REZ-support-copilot
- REZ-observability

**Port:** 4017

---

### 4. REZ COMMERCE (10 deployments)

**Keep separate - core business logic:**

| Service | Port |
|---------|------|
| rez-api-gateway | 3001 |
| rez-auth-service | 4002 |
| rez-merchant-service | 4005 |
| rez-order-service | 3006 |
| rez-payment-service | 4001 |
| rez-wallet-service | 4004 |
| rez-catalog-service | 3005 |
| rez-search-service | 4003 |
| rez-gamification-service | 3004 |
| rez-finance-service | 4007 |

---

### 5. REZ APPS (4 deployments)

**Keep separate:**

| App | Platform |
|-----|----------|
| rez-app-consumer | Mobile (Expo) |
| rez-app-merchant | Mobile (Expo) |
| rez-app-admin | Mobile (Expo) |
| rez-now | Web (Next.js) |

---

### 6. REZ UTILITIES (4 → 1 deployment)

**Service:** `rez-utilities-platform`

**Contains:**
- rez-automation-service
- rez-scheduler-service
- rez-insights-service
- rez-worker

**Port:** 4014

---

### 7. REZ KARMA (1 deployment)

**Service:** `rez-karma-service`

**Port:** 3009

---

### 8. HOTEL/STAYOWN (3 deployments)

| Service | Purpose | Port |
|---------|---------|------|
| stayown-user | User OTA app | 3000 |
| hotel-pms | Property Management | 3001 |
| hotel-backend | Service backend | 3002 |

---

### 9. CORPPERKS (1 repo, 2 deployments)

**Repo:** `CorpPerks`

| Deployment | Purpose |
|------------|---------|
| corpperks-frontend | Admin/HR portal |
| corpperks-backend | API service |

---

### 10-22. STANDALONE SERVICES

| Service | Type |
|---------|------|
| Rendez | Social dating app |
| Do | Standalone AI app |
| restaurant-papa | Restaurant platform |
| REZ Try | Inside app + Web |
| REZ Admin | Admin dashboard |
| REZ Merchant | Merchant portal |
| adBazaar | Ad marketplace (frontend + backend) |

---

### QR SERVICES (6 deployments)

Individual services for QR functionality:
1. rez-qr-generator
2. rez-qr-scanner
3. rez-qr-analytics
4. rez-qr-auth
5. rez-qr-payment
6. rez-qr-campaigns

---

## DEPLOYMENT SUMMARY

| # | Service | Type | Ports |
|---|---------|------|-------|
| 1 | rez-core-platform | Backend | 4008, 4009, 4010, 3001 |
| 2 | rez-marketing-backend | Backend | 4000 |
| 3 | rez-ai-platform | Backend | 4017 |
| 4 | rez-api-gateway | Backend | 3001 |
| 5 | rez-auth-service | Backend | 4002 |
| 6 | rez-merchant-service | Backend | 4005 |
| 7 | rez-order-service | Backend | 3006 |
| 8 | rez-payment-service | Backend | 4001 |
| 9 | rez-wallet-service | Backend | 4004 |
| 10 | rez-catalog-service | Backend | 3005 |
| 11 | rez-search-service | Backend | 4003 |
| 12 | rez-gamification-service | Backend | 3004 |
| 13 | rez-finance-service | Backend | 4007 |
| 14 | rez-app-consumer | Mobile | Expo EAS |
| 15 | rez-app-merchant | Mobile | Expo EAS |
| 16 | rez-app-admin | Mobile | Expo EAS |
| 17 | rez-now | Web | Vercel |
| 18 | rez-utilities-platform | Backend | 4014 |
| 19 | rez-karma-service | Backend | 3009 |
| 20 | stayown-user | Web | Vercel |
| 21 | hotel-pms | Web | Vercel |
| 22 | hotel-backend | Backend | 3002 |

---

## TO SUSPEND (32 services)

### Duplicate Cores
- REZ-intelligence-hub
- REZ-user-intelligence-service
- REZ-merchant-intelligence-service
- rez-event-platform (merged into core)
- rez-action-engine (merged into core)
- rez-feedback-service (merged into core)
- rez-first-loop (merged into core)
- rez-intent-graph (merged into core)

### Duplicate Marketing
- REZ-ad-copilot
- REZ-adbazaar
- analytics-events
- rez-media-events
- rez-notification-events
- REZ-intent-predictor

### Duplicate AI
- REZ-personalization-engine (merged)
- REZ-recommendation-engine (merged)
- REZ-targeting-engine (merged)
- REZ-push-service (merged)
- REZ-support-copilot (merged)
- REZ-observability (merged)

### Duplicate Utilities
- rez-automation-service (merged)
- rez-scheduler-service (merged)
- rez-insights-service (merged)
- rez-worker (merged)

### Duplicate Apps
- rez-app-consumer-1
- rez-backend-1
- rez-catalog-service-1

### Duplicate Hotel
- ReZ-Hotel-pms-1

### Not Needed
- REZ-feature-flags
- REZ-consumer-copilot
- REZ-merchant-copilot
- REZ-ops-dashboard
- rez-intent-agent
- rez-merchant-integrations
- REZ-error-intelligence

---

## IMPLEMENTATION PLAN

### Phase 1: Create Core Platform (Week 1)
1. Create `rez-core-platform` repo
2. Copy all 8 core services into `services/`
3. Update port allocations
4. Deploy as single service

### Phase 2: Create Marketing Backend (Week 1)
1. Create `rez-marketing-backend` repo
2. Copy all 5 marketing services
3. Deploy

### Phase 3: Create AI Platform (Week 2)
1. Create `rez-ai-platform` repo
2. Copy all 6 AI services
3. Deploy

### Phase 4: Create Utilities Platform (Week 2)
1. Create `rez-utilities-platform` repo
2. Copy all 4 utilities
3. Deploy

### Phase 5: Suspend Duplicates (Week 3)
1. Suspend all 32 duplicate services
2. Verify new platforms are working
3. Update DNS/URLs

---

## COST SAVINGS

| Before | After |
|--------|-------|
| 54 deployments | 22 deployments |
| 54 × $7/mo | 22 × $7/mo |
| ~$378/mo | ~$154/mo |
| **Savings: $224/mo** | |

---

## MONOREPO STRUCTURE

```
REZ-CORE/
├── services/
│   ├── event-platform/ (4008)
│   ├── action-engine/ (4009)
│   ├── feedback-service/ (4010)
│   ├── intent-graph/ (3001)
│   ├── intelligence-hub/ (4020)
│   ├── user-intelligence/ (3004)
│   └── merchant-intelligence/ (4012)
└── render.yaml
```

---

**END OF ARCHITECTURE**
