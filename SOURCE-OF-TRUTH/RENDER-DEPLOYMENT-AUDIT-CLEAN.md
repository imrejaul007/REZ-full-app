# ReZ Ecosystem — Render Deployment Audit

**Version:** 2.0 (Corrected)
**Date:** May 6, 2026
**Status:** ACTION REQUIRED

---

## SECTION 1: DEPLOYED ON RENDER (20 Services)

These services are currently live on Render:

| Service | Type | Status | Notes |
|---------|------|--------|-------|
| **REZ-ad-copilot** | web_service | ✅ Active | |
| **REZ-support-copilot** | web_service | ✅ Active | |
| **Rendez** | web_service | ✅ Active | Dating app |
| **adBazaar** | web_service | ✅ Active | |
| **corpperks-admin** | web_service | ✅ Active | |
| **corpperks-api** | web_service | ✅ Active | |
| **corpperks-hotel** | web_service | ✅ Active | |
| **hotel-ota-admin** | web_service | ✅ Active | |
| **hotel-ota-api** | web_service | ✅ Active | |
| **hotel-ota-hotel-panel** | web_service | ✅ Active | |
| **hotel-ota-web** | web_service | ✅ Active | |
| **nextabizz** | web_service | ✅ Active | |
| **rez-automation-service** | web_service | ✅ Active | |
| **rez-corporate-service** | web_service | ✅ Active | |
| **rez-finance-service** | web_service | ✅ Active | |
| **rez-insights-service** | web_service | ✅ Active | |
| **rez-karma-app** | web_service | ✅ Active | |
| **rez-merchant-integrations** | web_service | ⚠️ Check | May be deprecated |
| **rez-scheduler-service** | web_service | ✅ Active | |
| **rez-student-service** | web_service | ❌ Remove | **NO LONGER NEEDED** |

---

## SECTION 2: NOT DEPLOYED BUT HAVE render.yaml (30+ Services)

These services have `render.yaml` ready but are **NOT deployed**:

### CORE SERVICES (CRITICAL - SHOULD BE DEPLOYED)

| Service | render.yaml | Priority | Notes |
|---------|------------|----------|-------|
| **rez-api-gateway** | ✅ | P0 | Entry point - NOT DEPLOYED |
| **rez-auth-service** | ✅ | P0 | Auth service - NOT DEPLOYED |
| **rez-wallet-service** | ✅ | P0 | Wallet - NOT DEPLOYED |
| **rez-payment-service** | ✅ | P0 | Payments - NOT DEPLOYED |
| **rez-merchant-service** | ✅ | P0 | Merchant - NOT DEPLOYED |
| **rez-order-service** | ✅ | P0 | Orders - NOT DEPLOYED |
| **rez-search-service** | ✅ | P0 | Search - NOT DEPLOYED |
| **rez-ads-service** | ✅ | P1 | Ads - NOT DEPLOYED |
| **rez-marketing-service** | ✅ | P1 | Marketing - NOT DEPLOYED |
| **rez-gamification-service** | ✅ | P1 | Gamification - NOT DEPLOYED |
| **rez-karma-service** | ✅ | P1 | Karma - NOT DEPLOYED |
| **rez-intent-graph** | ✅ | P1 | AI Intent - NOT DEPLOYED |
| **rez-profile-service** | ✅ | P1 | Profiles - NOT DEPLOYED |

### AI SERVICES (SHOULD BE DEPLOYED)

| Service | render.yaml | Priority | Notes |
|---------|------------|----------|-------|
| **rez-consumer-copilot** | ✅ | P1 | Consumer AI - NOT DEPLOYED |
| **rez-merchant-copilot** | ✅ | P1 | Merchant AI - NOT DEPLOYED |
| **rez-personalization-engine** | ✅ | P1 | Personalization - NOT DEPLOYED |
| **rez-intelligence-hub** | ✅ | P1 | AI Hub - NOT DEPLOYED |
| **rez-targeting-engine** | ✅ | P1 | Targeting - NOT DEPLOYED |
| **rez-action-engine** | ✅ | P2 | Action Engine - NOT DEPLOYED |
| **rez-ad-ai** | ✅ | P2 | Ad AI - NOT DEPLOYED |
| **rez-ad-campaigns** | ✅ | P2 | Ad Campaigns - NOT DEPLOYED |

### NEW ML SERVICES (NOT DEPLOYED)

| Service | render.yaml | Priority | Notes |
|---------|------------|----------|-------|
| **rez-ml-feature-store** | ❌ | P1 | No render.yaml - NEED CREATION |
| **rez-ml-model-registry** | ❌ | P1 | No render.yaml - NEED CREATION |
| **rez-training-data-service** | ❌ | P1 | No render.yaml - NEED CREATION |
| **rez-fraud-detection-service** | ❌ | P1 | No render.yaml - NEED CREATION |
| **rez-ab-testing-service** | ❌ | P2 | No render.yaml - NEED CREATION |

### REVENUE SERVICES (NOT DEPLOYED)

| Service | render.yaml | Priority | Notes |
|---------|------------|----------|-------|
| **rez-bbps-service** | ❌ | P1 | No render.yaml - NEED CREATION |
| **rez-recharge-service** | ❌ | P1 | No render.yaml - NEED CREATION |
| **rez-einvoice-service** | ❌ | P2 | No render.yaml - NEED CREATION |

### EVENT/UTILITY SERVICES (NOT DEPLOYED)

| Service | render.yaml | Priority | Notes |
|---------|------------|----------|-------|
| **rez-media-events** | ✅ | P2 | Not deployed |
| **rez-notification-events** | ✅ | P1 | Not deployed |
| **rez-event-platform** | ✅ | P2 | Not deployed |
| **rez-observability** | ✅ | P2 | Not deployed |
| **rez-catalog-service** | ✅ | P0 | Not deployed |
| **rez-push-service** | ✅ | P1 | Not deployed |

---

## SECTION 3: SERVICES TO REMOVE (Deployed but NOT Needed)

These services are deployed but should be **removed**:

| Service | Reason to Remove | Action |
|---------|-----------------|--------|
| **rez-student-service** | Student features merged into main app | **DELETE FROM RENDER** |
| **rez-merchant-integrations** | Functionality moved to rez-merchant-service | **DELETE FROM RENDER** |
| **rez-adbazaar-DELETED** | Marked as deleted | **DELETE FROM RENDER** |
| **rez-feedback-service** | Replaced by REZ-support-copilot | Consider removal |
| **rez-feature-flags** | May be unused | Check before removal |

---

## SECTION 4: SERVICES WITHOUT render.yaml (Need Configuration)

These services exist locally but have **NO render.yaml**:

### NEED render.yaml CREATED

| Service | Priority | Action |
|---------|----------|--------|
| **rez-ml-feature-store** | P1 | Create render.yaml |
| **rez-ml-model-registry** | P1 | Create render.yaml |
| **rez-training-data-service** | P1 | Create render.yaml |
| **rez-fraud-detection-service** | P1 | Create render.yaml |
| **rez-ab-testing-service** | P2 | Create render.yaml |
| **rez-bbps-service** | P1 | Create render.yaml |
| **rez-recharge-service** | P1 | Create render.yaml |
| **rez-einvoice-service** | P2 | Create render.yaml |
| **rez-catalog-service** | P0 | Create render.yaml |
| **rez-user-intelligence-service** | P1 | Create render.yaml |
| **rez-lead-intelligence** | P2 | Create render.yaml |
| **rez-error-intelligence** | P2 | Create render.yaml |
| **rez-knowledge-base-service** | P2 | Create render.yaml |
| **rez-decision-service** | P2 | Create render.yaml |
| **rez-intent-predictor** | P2 | Create render.yaml |
| **rez-intent-service** | P2 | Create render.yaml |
| **rez-unified-messaging** | P2 | Create render.yaml |
| **rez-dooh-service** | P2 | Create render.yaml |
| **rez-stayown-service** | P2 | Create render.yaml |
| **rez-travel-service** | P2 | Create render.yaml |
| **rez-admin-service** | P2 | Create render.yaml |

---

## SECTION 5: OBSOLETE/ARCHIVE SERVICES

These services exist locally but are **obsolete or deprecated**:

| Service | Status | Action |
|---------|--------|--------|
| **rez-economic-engine** | Deprecated | Archive |
| **rezbackend/rez-backend-master** | Old monolith | Archive |
| **dooh-screen-app** | Not integrated | Archive |
| **rez-ride** | Irrelevant? | Check |
| **adsos** | Irrelevant? | Check |
| **ados** | Irrelevant? | Check |

---

## SECTION 6: COMPLETE PICTURE

```
DEPLOYED ON RENDER (20):
├── ✅ adBazaar
├── ✅ Hotel OTA (4 services)
├── ✅ CorpPerks (3 services)
├── ✅ AI Copilots (2 services)
├── ✅ Automation & Insights (2 services)
├── ✅ Finance & Scheduler (2 services)
└── ⚠️ Others (7 services)

NOT DEPLOYED - HAVE render.yaml (30+):
├── ❌ CORE: auth, wallet, payment, merchant, order, search, gateway (7)
├── ❌ AI: intent-graph, personalization, targeting, action-engine (4)
├── ❌ COPPILOTS: consumer, merchant (2)
└── ❌ OTHER: media-events, notification-events, event-platform, etc (15+)

NOT DEPLOYED - NO render.yaml (20+):
├── ML Services: feature-store, model-registry, fraud-detection (5)
├── Revenue: BBPS, recharge, einvoice (3)
└── Others: catalog, user-intelligence, etc (12)

TO REMOVE FROM RENDER (2):
├── rez-student-service
└── rez-merchant-integrations
```

---

## ACTION ITEMS

### IMMEDIATE: DEPLOY CORE SERVICES

```bash
# These 7 services have render.yaml but NOT deployed:
# 1. rez-api-gateway
# 2. rez-auth-service
# 3. rez-wallet-service
# 4. rez-payment-service
# 5. rez-merchant-service
# 6. rez-order-service
# 7. rez-search-service

# Deploy using Render CLI or Dashboard
```

### IMMEDIATE: REMOVE OBSOLETE SERVICES

```bash
# DELETE from Render Dashboard:
# 1. rez-student-service
# 2. rez-merchant-integrations
```

### SHORT TERM: DEPLOY AI SERVICES

```bash
# Deploy AI services with render.yaml:
# 1. rez-intent-graph
# 2. rez-personalization-engine
# 3. rez-intelligence-hub
# 4. rez-consumer-copilot
# 5. rez-merchant-copilot
# 6. rez-targeting-engine
```

### SHORT TERM: CREATE render.yaml FOR NEW SERVICES

```bash
# Create render.yaml for:
# 1. rez-ml-feature-store
# 2. rez-ml-model-registry
# 3. rez-training-data-service
# 4. rez-fraud-detection-service
# 5. rez-bbps-service
# 6. rez-recharge-service
```

---

## SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| **Currently Deployed** | 20 | Keep (except 2) |
| **Not Deployed (has render.yaml)** | 30+ | Deploy ASAP |
| **Not Deployed (no render.yaml)** | 20+ | Create render.yaml |
| **To Remove from Render** | 2 | Delete |
| **To Archive** | 10+ | Archive locally |

---

**Document Version:** 2.0
**Last Updated:** May 6, 2026
