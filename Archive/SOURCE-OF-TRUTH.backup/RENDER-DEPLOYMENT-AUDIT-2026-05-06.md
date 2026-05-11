# ReZ Ecosystem — Complete Deployment Audit

**Version:** 1.0
**Date:** May 6, 2026
**Status:** ACTION REQUIRED
**Audited by:** 10 Autonomous Agents

---

## EXECUTIVE SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| **Deployed on Render** | 21 services | Need to verify/update |
| **Local repos not deployed** | 15+ services | Need deployment |
| **New services (not deployed)** | 8 ML services | High priority |
| **Orphaned services** | 3 deprecated | Recommend removal |
| **Duplicate services** | 2 found | Need consolidation |

---

## SECTION 1: DEPLOYED ON RENDER (21 Services)

### Current Render Services

| Service | ID | Last Updated | Status | Priority |
|---------|-----|-------------|--------|----------|
| REZ-support-copilot | srv-d7s2h9f7f7vs73dbk840 | May 4 | ⚠️ Check | P1 |
| REZ-ad-copilot | srv-d7s381rrjlhs73830ed0 | May 4 | ⚠️ Check | P1 |
| rez-scheduler-service | srv-d7s2l07lk1mc73dfh1tg | May 5 | ✅ Active | P0 |
| rez-finance-service | srv-d7s2ittckfvc73addad0 | May 5 | ✅ Active | P0 |
| rez-automation-service | srv-d7s2ho5ckfvc73adck1g | May 4 | ⚠️ Check | P2 |
| rez-insights-service | srv-d7s2i9lckfvc73adcusg | May 4 | ⚠️ Check | P2 |
| nextabizz | srv-d7s2ognavr4c73a63170 | May 4 | ✅ Active | P1 |
| adBazaar | srv-d7s2vqv7f7vs73dbtp8g | May 4 | ⚠️ Check | P1 |
| corpperks-api | srv-d7s2vqv7f7vs73dbtp8g | May 4 | ⚠️ Check | P2 |
| corpperks-hotel | srv-d7s2vqv7f7vs73dbtp9g | May 4 | ⚠️ Check | P2 |
| corpperks-admin | srv-d7s2vqv7f7vs73dbtp90 | May 4 | ⚠️ Check | P2 |
| rez-corporate-service | srv-d7s36dvavr4c73fkdpm0 | May 4 | ⚠️ Check | P2 |
| rez-student-service | srv-d7s34opkh4rs73f4aiag | May 4 | ⚠️ Check | P2 |
| rez-merchant-integrations | srv-d7s37jog4nts73d2j98g | May 4 | ⚠️ Check | P1 |
| hotel-ota-api | srv-d7s3h6n7f7vs73dc9fig | May 4 | ✅ Active | P0 |
| hotel-ota-web | srv-d7s3h6n7f7vs73dc9fi0 | May 4 | ✅ Active | P1 |
| hotel-ota-hotel-panel | srv-d7s3h6n7f7vs73dc9fh0 | May 4 | ✅ Active | P1 |
| hotel-ota-admin | srv-d7s3h6n7f7vs73dc9fhg | May 4 | ✅ Active | P1 |
| Rendez | srv-d7s2napkh4rs73f44io0 | May 4 | ✅ Active | P2 |
| rez-karma-app | srv-d7s2mp9kh4rs73f44alg | May 4 | ✅ Active | P2 |

---

## SECTION 2: LOCAL REPOS NOT DEPLOYED

### Core Services (Need Deployment)

| Service | Local Path | Priority | Blocker |
|---------|-----------|----------|---------|
| **rez-api-gateway** | ./rez-api-gateway | P0 | None |
| **rez-auth-service** | ./rez-auth-service | P0 | None |
| **rez-wallet-service** | ./rez-wallet-service | P0 | None |
| **rez-payment-service** | ./rez-payment-service | P0 | None |
| **rez-order-service** | ./rez-order-service | P0 | None |
| **rez-merchant-service** | ./rez-merchant-service | P0 | None |
| **rez-intent-graph** | ./rez-intent-graph | P1 | None |
| **rez-ads-service** | ./rez-ads-service | P1 | None |
| **rez-marketing-service** | ./rez-marketing-service | P1 | None |
| **rez-gamification-service** | ./rez-gamification-service | P1 | None |
| **rez-karma-service** | ./rez-karma-service | P1 | None |
| **rez-scheduler-service** | (already deployed) | - | - |
| **rez-search-service** | ./rez-search-service | P1 | None |

### New ML Services (NOT DEPLOYED - HIGH PRIORITY)

| Service | Local Path | Priority | Status |
|---------|-----------|----------|--------|
| **rez-ml-feature-store** | ./services/ml-feature-store | P1 | New |
| **rez-ml-model-registry** | ./services/ml-model-registry | P1 | New |
| **rez-training-data-service** | ./services/training-data-service | P1 | New |
| **rez-fraud-detection-service** | ./services/fraud-detection-service | P1 | New |
| **rez-price-optimization-service** | ./services/price-optimization-service | P2 | New |
| **rez-ab-testing-service** | ./services/ab-testing-service | P2 | New |
| **rez-churn-prediction-service** | ./services/churn-prediction-service | P2 | New |
| **rez-ltv-prediction-service** | ./services/ltv-prediction-service | P2 | New |

### Revenue Services (Need Deployment)

| Service | Local Path | Priority | Status |
|---------|-----------|----------|--------|
| **rez-bbps-service** | ./services/bbps-service | P1 | New |
| **rez-recharge-service** | ./services/recharge-service | P1 | New |
| **rez-einvoice-service** | ./services/einvoice-service | P1 | New |

---

## SECTION 3: SERVICES TO UNDEPLOY (Orphaned/Deprecated)

### Recommend Removal from Render

| Service | Reason | Action |
|---------|--------|--------|
| **rez-student-service** | Student features merged into main app | Remove |
| **rez-merchant-integrations** | Functionality moved to rez-merchant-service | Remove |
| **dooh-screen-app** | Not integrated with ecosystem | Archive |

### Archive/Merge

| Service | Status | Action |
|---------|--------|--------|
| **rezbackend/rez-backend-master** | Old monolith | Archive (replaced by microservices) |
| **docs/archive/*** | Old documentation | Archive |

---

## SECTION 4: DEPLOYED BUT OUTDATED

### Services Needing Redeploy

| Service | Last Render Update | Local Commit | Action |
|---------|------------------|--------------|--------|
| adBazaar | May 4 | New commits | Redeploy |
| nextabizz | May 4 | New commits | Redeploy |
| hotel-ota-* | May 4 | New commits | Redeploy |
| CorpPerks | May 4 | New commits | Redeploy |

---

## SECTION 5: DEPENDENCY ORDER FOR DEPLOYMENT

### PHASE 1: Foundation (Deploy First)

```
1. rez-auth-service (4002)          ← Auth MUST be first
2. rez-wallet-service (4004)        ← Depends on auth
3. rez-payment-service (4001)       ← Depends on auth + wallet
4. rez-merchant-service (4005)      ← Standalone, high priority
5. rez-order-service (3006)         ← Depends on auth + payment
6. rez-api-gateway (3000)           ← Entry point, deploy LAST in phase
```

### PHASE 2: Intelligence (Deploy Second)

```
7. rez-intent-graph (3007)
8. rez-user-intelligence (3004)
9. rez-merchant-intelligence (4012)
10. rez-personalization-engine (4017)
11. rez-targeting-engine (3013)
12. rez-action-engine (3014)
13. rez-intelligence-hub (4020)
```

### PHASE 3: AI/Copilots (Deploy Third)

```
14. rez-consumer-copilot (4021)
15. rez-merchant-copilot (4022)
16. rez-support-copilot (4033)        ← Already deployed, update
17. REZ-ad-copilot                   ← Already deployed, update
```

### PHASE 4: ML Services (Deploy Fourth)

```
18. rez-ml-feature-store (4100)
19. rez-ml-model-registry (4101)
20. rez-training-data-service (4102)
21. rez-fraud-detection-service (4103)
22. rez-data-quality-monitor (4106)
23. rez-ml-retraining-pipeline (4107)
24. rez-price-optimization-service (4104)
25. rez-ab-testing-service (4105)
```

### PHASE 5: Revenue Services (Deploy Last)

```
26. rez-bbps-service (4110)
27. rez-recharge-service (4111)
28. rez-einvoice-service (4112)
```

---

## SECTION 6: CRITICAL ENV VARS MISSING

### Must Have for Production

| Variable | Source | Status |
|----------|--------|--------|
| `JWT_SECRET` | Generate (32+ chars) | ⚠️ Using dev value |
| `JWT_REFRESH_SECRET` | Generate | ⚠️ Using dev value |
| `ENCRYPTION_KEY` | Generate | ⚠️ Using dev value |
| `MONGO_ROOT_PASSWORD` | Generate | ⚠️ MISSING |
| `MONGO_SERVICE_PASSWORD` | Generate | ⚠️ MISSING |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard | ⚠️ MISSING |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard | ⚠️ MISSING |
| `OPENAI_API_KEY` | OpenAI | ⚠️ MISSING |
| `SUPABASE_URL` | Supabase | ⚠️ MISSING |
| `SENTRY_DSN` | Sentry.io | ⚠️ MISSING |

### External APIs Needed

| Service | API Needed | Priority |
|---------|-----------|----------|
| Google OAuth | OAuth credentials | P1 |
| Apple OAuth | OAuth credentials | P1 |
| Razorpay | Production keys | P0 |
| OpenAI | API key | P0 |
| Supabase | Production URL + keys | P1 |

---

## SECTION 7: ACTION ITEMS

### IMMEDIATE (This Week)

#### 1. Deploy Core Services to Render

```bash
# Auth-first order
render-cli service create --name=rez-auth-service --type=web-service
render-cli service create --name=rez-wallet-service --type=web-service
render-cli service create --name=rez-payment-service --type=web-service
render-cli service create --name=rez-merchant-service --type=web-service
render-cli service create --name=rez-order-service --type=web-service
render-cli service create --name=rez-api-gateway --type=web-service
```

#### 2. Update Render Environment Variables

```bash
# For each service, update in Render dashboard:
# 1. Generate new JWT secrets
openssl rand -base64 32

# 2. Set production MongoDB credentials
# 3. Set Razorpay production keys
# 4. Set OpenAI API key
```

#### 3. Remove Deprecated Services

```bash
# Remove from Render dashboard:
# - rez-student-service
# - rez-merchant-integrations
# - dooh-screen-app (if deployed)
```

### SHORT TERM (Next Sprint)

#### 4. Deploy ML Services

```bash
# Deploy in order:
render-cli service create --name=rez-ml-feature-store --type=web-service
render-cli service create --name=rez-ml-model-registry --type=web-service
render-cli service create --name=rez-training-data-service --type=web-service
render-cli service create --name=rez-fraud-detection-service --type=web-service
```

#### 5. Deploy Revenue Services

```bash
render-cli service create --name=rez-bbps-service --type=web-service
render-cli service create --name=rez-recharge-service --type=web-service
render-cli service create --name=rez-einvoice-service --type=web-service
```

---

## SECTION 8: DUPLICATE SERVICES FOUND

### 1. rez-economic-engine
- **Status:** Standalone repo, not integrated
- **Recommendation:** Archive or integrate with rez-finance-service

### 2. rezbackend (Old Monolith)
- **Status:** Replaced by microservices
- **Recommendation:** Archive

---

## SECTION 9: PORT REGISTRY

### All Service Ports

| Port | Service | Phase |
|------|---------|-------|
| 3000 | rez-api-gateway | 1 |
| 3001 | rez-gamification-service | 2 |
| 3004 | rez-user-intelligence | 2 |
| 3005 | rez-notification-events | 1 |
| 3006 | rez-order-service | 1 |
| 3007 | rez-intent-graph | 2 |
| 3008 | rez-media-events | 2 |
| 3009 | rez-karma-service | 2 |
| 3012 | rez-scheduler-service | Already deployed |
| 3013 | rez-targeting-engine | 2 |
| 3014 | rez-action-engine | 2 |
| 4001 | rez-payment-service | 1 |
| 4002 | rez-auth-service | 1 |
| 4003 | rez-search-service | 2 |
| 4004 | rez-wallet-service | 1 |
| 4005 | rez-merchant-service | 1 |
| 4006 | rez-finance-service | Already deployed |
| 4007 | rez-ads-service | 2 |
| 4008 | rez-marketing-service | 2 |
| 4012 | rez-procurement-service | 3 |
| 4013 | rez-corpperks-service | Already deployed |
| 4015 | rez-hotel-service | Already deployed |
| 4017 | rez-personalization-engine | 2 |
| 4020 | rez-intelligence-hub | 2 |
| 4021 | rez-consumer-copilot | 3 |
| 4022 | rez-merchant-copilot | 3 |
| 4033 | rez-support-copilot | Already deployed |

### ML Services Ports

| Port | Service |
|------|---------|
| 4100 | rez-ml-feature-store |
| 4101 | rez-ml-model-registry |
| 4102 | rez-training-data-service |
| 4103 | rez-fraud-detection-service |
| 4104 | rez-price-optimization-service |
| 4105 | rez-ab-testing-service |
| 4106 | rez-data-quality-monitor |
| 4107 | rez-ml-retraining-pipeline |

### Revenue Services Ports

| Port | Service |
|------|---------|
| 4110 | rez-bbps-service |
| 4111 | rez-recharge-service |
| 4112 | rez-einvoice-service |

---

## SECTION 10: FILES UPDATED TO GIT

### Committed This Session

#### SOURCE-OF-TRUTH
- `1f80eac` - Complete update (81 files)

#### Main Repo
- `9ee05d8` - API cleanup + ML infrastructure
- `fd2a840` - New services + apps
- `706d535` - Core backend services
- `7f06c5f` - E-invoice service
- `53e1990` - Deployment pipeline
- `b298575` - New standalone apps

#### Service Repos Committed
| Repo | Commit | Description |
|------|---------|-------------|
| rez-intent-graph | `b22f29f` | Fraud prevention |
| rez-payment-service | `47d959f` | Ledger model |
| rez-order-service | `3ba2aa99` | Middleware |
| rez-targeting-engine | `a54f60f` | DB config |
| rez-web-menu | `270a754` | Prisma update |
| rez-search-service | `d184e76` | Dockerfile |
| rez-wallet-service | `2dbe220b` | Logger |
| rez-merchant-service | `b7cf2b0d` | Dockerfile |
| adBazaar | `a78912e8` | Dashboard |
| rez-ad-ai | `c7c607f` | Packages |
| rez-ad-campaigns | `e7b2537` | Brand dashboard |
| rez-marketing | `348f4c8` | AI commerce |
| rez-app-consumer | `e94efef87` | Dockerfile |
| Hotel OTA | `8f105d47` | WebSocket |
| nextabizz | `32a964c` | Supplier portal |
| shared-types | `c6f643b` | Type updates |
| rez-shared | `d880941` | Utilities |
| rez-now | `232a62ba` | Order socket |

---

## SUMMARY CHECKLIST

### Pre-Deployment
- [ ] Generate production JWT secrets
- [ ] Set up MongoDB Atlas with credentials
- [ ] Get Razorpay production keys
- [ ] Get OpenAI API key
- [ ] Configure Sentry DSN

### Deploy Core (Phase 1)
- [ ] Deploy rez-auth-service
- [ ] Deploy rez-wallet-service
- [ ] Deploy rez-payment-service
- [ ] Deploy rez-merchant-service
- [ ] Deploy rez-order-service
- [ ] Deploy rez-api-gateway

### Deploy Intelligence (Phase 2)
- [ ] Deploy rez-intent-graph
- [ ] Deploy AI services

### Deploy ML (Phase 4)
- [ ] Deploy ML services

### Remove Deprecated
- [ ] Remove rez-student-service
- [ ] Remove rez-merchant-integrations
- [ ] Archive rezbackend

---

**Document Version:** 1.0
**Last Updated:** May 6, 2026
**Next Review:** Weekly until deployment complete
**Status:** ACTION REQUIRED
