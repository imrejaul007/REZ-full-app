# MASTER PLATFORM ARCHITECTURE

**Date:** May 6, 2026
**Version:** 1.0
**Total Deployments:** 54

---

## YOUR REQUIREMENTS

| Platform | Deployments | Strategy |
|----------|-------------|----------|
| REZ Core | 1 | Combine all into 1 |
| REZ Marketing | 2 | adBazaar frontend + 1 backend |
| REZ AI/Intelligence | 1 | Combine all into 1 |
| REZ Commerce | Keep | Keep separate |
| REZ Apps | Keep | Keep separate |
| REZ Utilities | 1 | Combine all into 1 |
| REZ Karma | 1 | Keep |
| Hotel/StayOwn | 3 | User OTA, PMS, Service |
| CorpPerks | 2 | Frontend + Backend |
| Rendez | 1 | Standalone |
| Do | 1 | Standalone |
| Restaurant | 1 | Standalone |
| QR Services | Individual | Keep |
| REZ Try | 1 | Inside app + Web |
| REZ Admin | 1 | Standalone |
| REZ Merchant | 1 | Standalone |

---

## CURRENT: 54 ACTIVE SERVICES

### REZ CORE (8 services)
| Service | Port | Status |
|---------|------|---------|
| rez-event-platform | 4008 | ACTIVE |
| rez-action-engine | 4009 | ACTIVE |
| rez-feedback-service | 4010 | ACTIVE |
| rez-first-loop | - | ACTIVE |
| rez-intent-graph | 3001 | ACTIVE |
| REZ-intelligence-hub | 4020 | ACTIVE |
| REZ-user-intelligence | 3004 | ACTIVE |
| REZ-merchant-intelligence | 4012 | ACTIVE |

### REZ COMMERCE (10 services)
| Service | Port | Status |
|---------|------|---------|
| rez-api-gateway | 3001 | ACTIVE |
| rez-auth-service | 4002 | ACTIVE |
| rez-merchant-service | 4005 | ACTIVE |
| rez-order-service | 3006 | ACTIVE |
| rez-payment-service | 4001 | ACTIVE |
| rez-wallet-service | 4004 | ACTIVE |
| rez-catalog-service | 3005 | ACTIVE |
| rez-search-service | 4003 | ACTIVE |
| rez-gamification-service | 3004 | ACTIVE |
| rez-finance-service | 4007 | ACTIVE |

### REZ MARKETING (8 services)
| Service | Port | Status |
|---------|------|---------|
| rez-marketing-service | 4000 | ACTIVE |
| rez-ads-service | 4007 | ACTIVE |
| adBazaar | - | ACTIVE |
| REZ-ad-copilot | - | SUSPENDED |
| REZ-adbazaar | - | SUSPENDED |
| analytics-events | - | ACTIVE |
| rez-media-events | - | ACTIVE |
| rez-notification-events | - | ACTIVE |

### REZ AI/INTELLIGENCE (11 services)
| Service | Port | Status |
|---------|------|---------|
| REZ-support-copilot | 4033 | ACTIVE |
| REZ-push-service | 4013 | ACTIVE |
| REZ-observability | 4031 | ACTIVE |
| REZ-personalization-engine | 4017 | ACTIVE |
| REZ-recommendation-engine | 4015 | ACTIVE |
| REZ-targeting-engine | 3003 | ACTIVE |
| REZ-feature-flags | 4030 | SUSPENDED |
| REZ-intent-predictor | - | SUSPENDED |
| rez-intent-agent | - | ACTIVE |
| rez-automation-service | 4014 | ACTIVE |
| rez-scheduler-service | 4009 | ACTIVE |

### REZ APPS (9 services)
| Service | Platform | Status |
|---------|----------|---------|
| rez-app-consumer | Mobile | ACTIVE |
| rez-app-marchant | Mobile | ACTIVE |
| rez-app-admin | Mobile | ACTIVE |
| rez-now | Web | ACTIVE |
| rez-unified-chat | Package | ACTIVE |
| rez-web-menu | Web | ACTIVE |
| rez-admin-training-panel | Web | ACTIVE |
| rez-backend | Backend | ACTIVE |
| rez-worker | Worker | ACTIVE |

### HOTEL/STAYOWN (7 services)
| Service | Status |
|---------|---------|
| hotel-ota-api | ACTIVE |
| hotel-ota-web | ACTIVE |
| hotel-ota-admin | ACTIVE |
| hotel-ota-hotel-panel | ACTIVE |
| hotel-ota | ACTIVE |
| ReZ-Hotel-pms | ACTIVE |
| ReZ-Hotel-pms-1 | ACTIVE |

### CORPPERKS (3 services)
| Service | Status |
|---------|---------|
| corpperks-api | ACTIVE |
| corpperks-admin | ACTIVE |
| corpperks-hotel | ACTIVE |

### RESTAURANT (2 services)
| Service | Status |
|---------|---------|
| restaurantapp | ACTIVE |
| Rendez | ACTIVE |

### OTHER (5 services)
| Service | Status |
|---------|---------|
| nextabizz | SUSPENDED |
| rez-karma-service | ACTIVE |
| rez-profile-service | ACTIVE |
| rez-knowledge-base-service | ACTIVE |
| REZ-error-intelligence | ACTIVE |

---

## YOUR TARGET ARCHITECTURE: 22 DEPLOYMENTS

### 1. REZ CORE (8 → 1 deployment)
**Service:** `rez-core-platform`
**Ports:** 4008, 4009, 4010, 3001, 4020, 3004, 4012

Contains:
- rez-event-platform
- rez-action-engine
- rez-feedback-service
- rez-first-loop
- rez-intent-graph
- REZ-intelligence-hub
- REZ-user-intelligence
- REZ-merchant-intelligence

---

### 2. REZ MARKETING BACKEND (5 → 1 deployment)
**Service:** `rez-marketing-backend`
**Port:** 4000

Contains:
- rez-marketing-service
- rez-ads-service
- rez-lead-intelligence
- rez-abandonment-tracker
- rez-decision-service
- rez-unified-messaging

---

### 3. REZ AI/INTELLIGENCE (6 → 1 deployment)
**Service:** `rez-ai-platform`
**Port:** 4017

Contains:
- REZ-support-copilot
- REZ-push-service
- REZ-observability
- REZ-personalization-engine
- REZ-recommendation-engine
- REZ-targeting-engine

---

### 4. REZ UTILITIES (4 → 1 deployment)
**Service:** `rez-utilities-platform`
**Port:** 4014

Contains:
- rez-automation-service
- rez-scheduler-service
- rez-insights-service
- rez-worker

---

### 5. REZ COMMERCE (10 deployments - KEEP SEPARATE)

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

### 6. REZ APPS (5 deployments)

| App | Platform |
|-----|----------|
| rez-app-consumer | Mobile (Expo) |
| rez-app-merchant | Mobile (Expo) |
| rez-app-admin | Mobile (Expo) |
| rez-now | Web (Next.js) |
| rez-admin-training-panel | Web (Next.js) |

---

### 7. STAYOWN/HOTEL (3 deployments)

| Service | Purpose |
|---------|---------|
| stayown-user | User OTA app (Next.js) |
| hotel-pms | Property Management (Next.js) |
| hotel-service | Backend API |

---

### 8. CORPPERKS (1 repo, 2 deployments)

| Deployment | Purpose |
|------------|---------|
| corpperks-frontend | Admin/HR portal (Next.js) |
| corpperks-backend | API service |

---

### 9. STANDALONE SERVICES (7)

| Service | Type |
|---------|------|
| Rendez | Social dating app |
| Do | AI app |
| restaurant-papa | Restaurant platform |
| rez-karma-service | Karma backend |
| rez-profile-service | Profile backend |
| rez-knowledge-base | Knowledge base |
| REZ-error-intelligence | Error tracking |

---

### 10. ADBAZAAR (2 deployments)

| Deployment | Purpose |
|------------|---------|
| adBazaar | Frontend (Next.js) |
| rez-ads-backend | Backend API |

---

## SUMMARY

| Category | Current | Target |
|----------|---------|--------|
| REZ Core | 8 | 1 |
| REZ Marketing | 5 | 2 |
| REZ AI | 6 | 1 |
| REZ Utilities | 4 | 1 |
| REZ Commerce | 10 | 10 |
| REZ Apps | 5 | 5 |
| Hotel | 7 | 3 |
| CorpPerks | 3 | 2 |
| Standalone | 6 | 7 |
| adBazaar | 2 | 2 |
| **TOTAL** | **54** | **22** |

---

## TO SUSPEND (32 services)

### REZ Core duplicates
- All 8 merged into 1

### REZ Marketing duplicates
- analytics-events → merge
- rez-media-events → merge
- rez-notification-events → merge

### REZ AI duplicates
- All 6 merged into 1

### REZ Utilities duplicates
- All 4 merged into 1

### Hotel duplicates
- hotel-ota, hotel-ota-api, hotel-ota-web, hotel-ota-admin, hotel-ota-hotel-panel → merge into 3

### CorpPerks duplicates
- corpperks-api, corpperks-admin, corpperks-hotel → merge into 2

### Legacy
- REZ-ad-copilot (suspended)
- REZ-adbazaar (suspended)
- REZ-consumer-copilot (suspended)
- REZ-feature-flags (suspended)
- REZ-intent-predictor (suspended)
- REZ-merchant-copilot (suspended)
- nextabizz (suspended)
- rez-karma-app (suspended)
- rez-web-menu (suspended)
- REZ-ops-dashboard
- REZ-mind-client

---

## COST SAVINGS

| Before | After |
|--------|--------|
| 54 deployments | 22 deployments |
| 54 × $7/mo | 22 × $7/mo |
| ~$378/mo | ~$154/mo |
| **Savings: $224/mo** | |

---

## MONOREPO STRUCTURE

```
rez-core-platform/
├── services/
│   ├── event-platform/ (4008)
│   ├── action-engine/ (4009)
│   ├── feedback-service/ (4010)
│   ├── first-loop/
│   ├── intent-graph/ (3001)
│   ├── intelligence-hub/ (4020)
│   ├── user-intelligence/ (3004)
│   └── merchant-intelligence/ (4012)
└── render.yaml

rez-marketing-backend/
├── services/
│   ├── marketing-service/ (4000)
│   ├── ads-service/
│   ├── lead-intelligence/
│   ├── abandonment-tracker/
│   ├── decision-service/
│   └── unified-messaging/
└── render.yaml

rez-ai-platform/
├── services/
│   ├── support-copilot/ (4033)
│   ├── push-service/ (4013)
│   ├── observability/ (4031)
│   ├── personalization/ (4017)
│   ├── recommendation/ (4015)
│   └── targeting/ (3003)
└── render.yaml

rez-utilities-platform/
├── services/
│   ├── automation/ (4014)
│   ├── scheduler/
│   ├── insights/
│   └── worker/
└── render.yaml
```

---

## NEXT STEPS

1. Create `rez-core-platform` repo
2. Create `rez-marketing-backend` repo
3. Create `rez-ai-platform` repo
4. Create `rez-utilities-platform` repo
5. Deploy consolidated services
6. Suspend duplicates
7. Update DNS/URLs

---

**END OF MASTER ARCHITECTURE**
