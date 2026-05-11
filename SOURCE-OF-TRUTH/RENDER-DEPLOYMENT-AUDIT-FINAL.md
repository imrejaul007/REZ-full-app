# ReZ Ecosystem — FINAL Render Deployment Audit

**Version:** 3.0 (FINAL)
**Date:** May 6, 2026
**Status:** COMPLETE AUDIT

---

## SECTION 1: WHAT IS DEPLOYED (70+ Services)

### Current Deployments on Render

| Service | Type | Notes |
|---------|------|-------|
| **Core Backend** |||
| rez-api-gateway | ✅ Deployed | |
| rez-auth-service | ✅ Deployed | |
| rez-wallet-service | ✅ Deployed | |
| rez-payment-service | ✅ Deployed | |
| rez-merchant-service | ✅ Deployed | |
| rez-order-service | ✅ Deployed | |
| rez-search-service | ✅ Deployed | |
| **AI Services** |||
| REZ-intent-graph | ✅ Deployed | |
| REZ-intelligence-hub | ✅ Deployed | |
| REZ-personalization-engine | ✅ Deployed | |
| REZ-targeting-engine | ✅ Deployed | |
| REZ-consumer-copilot | ✅ Deployed | |
| REZ-merchant-copilot | ✅ Deployed | |
| REZ-support-copilot | ✅ Deployed | |
| REZ-ad-copilot | ✅ Deployed | |
| **Hotel OTA** |||
| hotel-ota | ✅ Deployed | |
| hotel-ota-api | ✅ Deployed | |
| hotel-ota-web | ✅ Deployed | |
| hotel-ota-admin | ✅ Deployed | |
| hotel-ota-hotel-panel | ✅ Deployed | |
| ReZ-Hotel-pms | ✅ Deployed | |
| **Apps** |||
| adBazaar | ✅ Deployed | |
| Rendez | ✅ Deployed | |
| nextabizz | ✅ Deployed | |
| rez-app-consumer | ✅ Deployed | |
| rez-karma-app | ✅ Deployed | |
| **CorpPerks** |||
| corpperks-api | ✅ Deployed | |
| corpperks-admin | ✅ Deployed | |
| corpperks-hotel | ✅ Deployed | |
| **Support Services** |||
| rez-automation-service | ✅ Deployed | |
| rez-finance-service | ✅ Deployed | |
| rez-scheduler-service | ✅ Deployed | |
| rez-insights-service | ✅ Deployed | |
| **Legacy/Multiple Versions** |||
| rez-backend | ✅ Deployed (old) | To remove |
| rez-backend-1 | ✅ Deployed (old) | To remove |
| rez-catalog-service | ✅ Deployed | |
| rez-catalog-service-1 | ✅ Deployed | To remove (duplicate) |
| rez-catalog-service2 | ✅ Deployed | To remove (duplicate) |
| rez-action-engine | ✅ Deployed | |
| rez-action-engine-1 | ✅ Deployed | To remove (duplicate) |
| rez-app-consumer-1 | ✅ Deployed | To remove (duplicate) |
| analytics-events | ✅ Deployed | Check if needed |

---

## SECTION 2: NOT DEPLOYED (Have render.yaml) - 11 Services

These services have `render.yaml` but are **NOT deployed**:

| Service | Priority | Notes |
|---------|----------|-------|
| **CorpPerks** | P0 | CorpPerks has no deployment yet |
| **rez-profile-service** | P1 | User profiles service |
| **rez-marketing** | P1 | Has "marketing" not "rez-marketing-service" |
| **rez-knowledge-base-service** | P2 | Knowledge base |
| **rez-stayown-service** | P2 | Duplicate of hotel-ota? |
| **rez-travel-service** | P2 | Travel booking |
| **rez-unified-messaging** | P2 | Messaging service |
| **rez-decision-service** | P2 | Decision engine |
| **rez-ad-ai** | P2 | Ad AI |
| **rez-ad-campaigns** | P2 | Ad campaigns |
| **rez-adbazaar-DELETED** | - | Already deleted, no action |

---

## SECTION 3: NO render.yaml - NEED CREATION

These services exist locally but have **NO render.yaml**:

### ML Services (5)
| Service | Priority |
|---------|----------|
| rez-ml-feature-store | P1 |
| rez-ml-model-registry | P1 |
| rez-training-data-service | P1 |
| rez-fraud-detection-service | P1 |
| rez-ab-testing-service | P2 |

### Revenue Services (3)
| Service | Priority |
|---------|----------|
| rez-bbps-service | P1 |
| rez-recharge-service | P1 |
| rez-einvoice-service | P1 |

### Other Services (10+)
| Service | Priority |
|---------|----------|
| rez-catalog-service | Already deployed |
| rez-profile-service | Has render.yaml |
| rez-user-intelligence-service | Already deployed (REZ-user-intelligence-service) |

---

## SECTION 4: TO REMOVE FROM RENDER (DUPLICATES/OBSOLETE)

These services are deployed but should be **removed**:

| Service | Reason |
|---------|--------|
| **rez-backend** | Old monolith, replaced by microservices |
| **rez-backend-1** | Duplicate of above |
| **rez-catalog-service-1** | Duplicate of rez-catalog-service |
| **rez-catalog-service2** | Duplicate of rez-catalog-service |
| **rez-action-engine-1** | Duplicate of rez-action-engine |
| **rez-app-consumer-1** | Duplicate of rez-app-consumer |
| **ReZ-Hotel-pms-1** | Duplicate of ReZ-Hotel-pms |
| **rez-first-loop** | Unknown purpose, check if needed |
| **rez-intent-agent** | Duplicate of rez-intent-graph? |
| **rez-worker** | Check if needed |
| **restaurantapp** | RestoPapa standalone |
| **analytics-events** | May be replaced by other services |

---

## SECTION 5: ARCHIVE LOCALLY (NOT DEPLOYED)

These services exist locally but are **obsolete**:

| Service | Status |
|---------|--------|
| rez-economic-engine | Deprecated |
| rezbackend/rez-backend-master | Old monolith |
| dooh-screen-app | Not integrated |
| rez-adbazaar-DELETED | Marked deleted |
| docs/archive/ | Old docs |
| rez-student-service | Deprecated features |

---

## SUMMARY

### Deployed on Render: ~70+ services

### Need to Deploy: 11 services (have render.yaml)
```
CorpPerks, rez-profile-service, rez-marketing, rez-knowledge-base-service,
rez-stayown-service, rez-travel-service, rez-unified-messaging,
rez-decision-service, rez-ad-ai, rez-ad-campaigns, rez-adbazaar-DELETED
```

### Need render.yaml Created: 8 services
```
rez-ml-feature-store, rez-ml-model-registry, rez-training-data-service,
rez-fraud-detection-service, rez-ab-testing-service, rez-bbps-service,
rez-recharge-service, rez-einvoice-service
```

### Need to Remove from Render: 11+ services
```
rez-backend, rez-backend-1, rez-catalog-service-1, rez-catalog-service2,
rez-action-engine-1, rez-app-consumer-1, ReZ-Hotel-pms-1,
rez-first-loop, rez-intent-agent, rez-worker, restaurantapp
```

---

## ACTION ITEMS

### 1. REMOVE DUPLICATES (Do First)
```bash
# Delete from Render Dashboard:
- rez-backend
- rez-backend-1
- rez-catalog-service-1
- rez-catalog-service2
- rez-action-engine-1
- rez-app-consumer-1
- ReZ-Hotel-pms-1
```

### 2. DEPLOY MISSING SERVICES (Have render.yaml)
```bash
# Deploy these 10 services:
- CorpPerks
- rez-profile-service
- rez-marketing (check naming)
- rez-knowledge-base-service
- rez-stayown-service
- rez-travel-service
- rez-unified-messaging
- rez-decision-service
- rez-ad-ai
- rez-ad-campaigns
```

### 3. CREATE render.yaml FOR NEW SERVICES
```bash
# Create render.yaml for:
- rez-ml-feature-store
- rez-ml-model-registry
- rez-training-data-service
- rez-fraud-detection-service
- rez-bbps-service
- rez-recharge-service
- rez-einvoice-service
```

### 4. CHECK BEFORE REMOVING
```bash
# Verify these are safe to remove:
- rez-first-loop - what does it do?
- rez-intent-agent - duplicate of rez-intent-graph?
- rez-worker - job queue worker?
- analytics-events - still needed?
- restaurantapp - standalone RestoPapa?
```

---

**Document Version:** 3.0 (FINAL)
**Last Updated:** May 6, 2026
**Audit Method:** Render API + Local Repo Analysis
