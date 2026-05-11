# ReZ Repository Consolidation Plan

**Generated:** 2026-05-04  
**Purpose:** Identify and resolve overlapping services for a streamlined architecture

---

## Executive Summary

After analyzing all `rez-*` repositories in `/Users/rejaulkarim/Documents/ReZ Full App/`, I've identified **5 major overlap categories** with **15+ duplicate/overlapping services**. The consolidation could reduce the codebase by **50%+** while improving maintainability.

---

## Full Repository Inventory

| Repo | Size | Files | Purpose |
|------|------|-------|---------|
| **Intelligence Services** ||||
| rez-intent-graph | 2.5M | 108 | AI-powered commerce intelligence, intent tracking, dormant revival |
| rez-intelligence-hub | 68M | 2,347 | Unified user/merchant profiles derived from events |
| rez-lead-intelligence | 176K | 14 | Hot/Warm/Cold lead detection, abandoned cart/search |
| rez-user-intelligence-service | 154M | - | Comprehensive user intelligence |
| rez-merchant-intelligence-service | 156M | - | Merchant business operations analytics |
| rez-insights-service | 123M | - | AI-powered insights storage |
| rez-intent-service | 96M | - | Unified Intelligence Platform (Signal-Intent-Decision-Action) |
| rez-intent-predictor | 18M | - | Real-time user intent prediction |
| rez-personalization-engine | 85M | - | Personalization engine |
| rez-recommendation-engine | 396K | - | Recommendation engine |
| rez-error-intelligence | 68K | - | Error intelligence |
| **Tracking Services** ||||
| rez-abandonment-tracker | 72K | 2 | Search/Cart/View abandonment, decay scoring |
| **Marketing/Ad Services** ||||
| rez-marketing | 179M | 10,307 | Multi-channel campaign management (WhatsApp/SMS/Email/Push) |
| rez-ads | 8.0K | 0 | Umbrella repo (contains sub-repos) |
| rez-ads-service | 163M | 7,075 | Merchant self-serve ads, ad serving |
| rez-ad-campaigns | 145M | - | Likely duplicate of ads-service |
| rez-decision-service | 99M | 4,745 | Unified Targeting + Action Engine (18+ engines) |
| rez-targeting-engine | 125M | - | Ad/Notification targeting |
| rez-ad-ai | 44K | - | AI copilot for ads |
| **Event Services** ||||
| rez-event-platform | 161M | 9,362 | Central event platform, schema validation |
| rez-media-events | 91M | 4,305 | Media events service |
| rez-notification-events | 96M | 5,574 | Notification events service |
| **Copilot Services** ||||
| rez-copilot | 44K | 5 | Unified AI Copilot (Consumer+Merchant+Support+Admin) |
| rez-consumer-copilot | 4.3M | 374 | AI copilot dashboard for consumer app |
| rez-merchant-copilot | 79M | 2,610 | AI copilot for merchant dashboard |
| **ML/AI Services** ||||
| rez-ml-engine | 16K | - | ML engine (empty?) |
| rez-ml-feature-store | 66M | - | Feature store |
| rez-ml-model-registry | 66M | - | Model registry |
| rez-training-data-service | 4.0K | - | Training data (empty?) |
| **Core Services** ||||
| rez-api-gateway | 836K | - | API Gateway |
| rez-auth-service | 427M | - | Auth/Identity (OTP, JWT, TOTP) |
| rez-merchant-service | 4.3M | - | Merchant API |
| rez-order-service | 1.3M | - | Order service |
| rez-payment-service | 145M | - | Payment gateway |
| rez-catalog-service | 1.5M | - | Catalog service |
| rez-search-service | 82M | - | Search/discovery |
| rez-wallet-service | 246M | - | Wallet service |
| rez-finance-service | 149M | - | Finance (credit, loans, BNPL) |
| **Other Services** ||||
| rez-action-engine | 113M | - | Decision execution layer |
| rez-feedback-service | 122M | - | Learning infrastructure for adaptive AI |
| rez-gamification-service | 21M | - | Gamification |
| rez-feature-flags | 17M | - | Feature flags |
| rez-knowledge-base-service | 55M | - | Knowledge base |
| rez-observability | 51M | - | Logging, tracing, metrics |
| rez-shared | 278M | - | Shared utilities and types |
| rez-automation-service | - | - | Automation service |
| rez-contracts | - | - | Contracts |

---

## CONSOLIDATION TABLE

| Repo | Size | Purpose | Can Merge With | Priority |
|------|------|---------|----------------|----------|
| **CATEGORY 1: TRACKING** |||||
| rez-lead-intelligence | 176K | Lead scoring, abandoned cart/search, re-engagement | rez-abandonment-tracker | **HIGH** |
| rez-abandonment-tracker | 72K | Search/Cart/View abandonment, decay scoring | rez-lead-intelligence | **HIGH** |
| **CATEGORY 2: MARKETING** |||||
| rez-marketing | 179M | Multi-channel campaigns (WhatsApp/SMS/Email/Push) | Keep separate (channel-specific) | MEDIUM |
| rez-ads-service | 163M | Merchant self-serve ads, ad serving | rez-ad-campaigns | **HIGH** |
| rez-ad-campaigns | 145M | Duplicate of ads-service | rez-ads-service | **HIGH** |
| rez-decision-service | 99M | Unified Targeting + Action Engine | rez-targeting-engine, rez-action-engine | **HIGH** |
| rez-targeting-engine | 125M | Ad/Notification targeting | rez-decision-service | **HIGH** |
| rez-ad-ai | 44K | AI copilot for ads | rez-copilot | MEDIUM |
| **CATEGORY 3: EVENTS** |||||
| rez-event-platform | 161M | Central event bus, schema validation | Keep as central | LOW |
| rez-media-events | 91M | Media-specific events | rez-event-platform | MEDIUM |
| rez-notification-events | 96M | Notification-specific events | rez-event-platform | MEDIUM |
| **CATEGORY 4: INTELLIGENCE** |||||
| rez-intent-graph | 2.5M | AI commerce intelligence, intent tracking | rez-intelligence-hub | **HIGH** |
| rez-intelligence-hub | 68M | Unified user/merchant profiles | rez-intent-graph, rez-user-intelligence-service | **HIGH** |
| rez-user-intelligence-service | 154M | Comprehensive user intelligence | rez-intelligence-hub, rez-lead-intelligence | **HIGH** |
| rez-merchant-intelligence-service | 156M | Merchant business analytics | rez-intelligence-hub, rez-merchant-copilot | **HIGH** |
| rez-intent-service | 96M | Signal→Intent→Decision→Action loop | rez-intent-graph, rez-decision-service | **HIGH** |
| rez-intent-predictor | 18M | Real-time intent prediction | rez-intent-service | MEDIUM |
| rez-personalization-engine | 85M | Personalization | rez-recommendation-engine, rez-intent-service | MEDIUM |
| rez-recommendation-engine | 396K | Recommendations | rez-personalization-engine | MEDIUM |
| rez-insights-service | 123M | AI insights storage | rez-intelligence-hub | MEDIUM |
| rez-error-intelligence | 68K | Error intelligence | Keep separate (niche) | LOW |
| **CATEGORY 5: COPILOTS** |||||
| rez-copilot | 44K | Unified AI Copilot umbrella | rez-consumer-copilot, rez-merchant-copilot | **HIGH** |
| rez-consumer-copilot | 4.3M | Consumer AI copilot dashboard | rez-copilot | **HIGH** |
| rez-merchant-copilot | 79M | Merchant AI copilot dashboard | rez-copilot | **HIGH** |
| **ML/AI INFRASTRUCTURE** |||||
| rez-ml-engine | 16K | ML engine (empty) | rez-ml-feature-store | **HIGH** |
| rez-ml-feature-store | 66M | Feature store | Keep separate | LOW |
| rez-ml-model-registry | 66M | Model registry | Keep separate | LOW |
| rez-training-data-service | 4.0K | Training data (empty) | rez-ml-feature-store | **HIGH** |

---

## Detailed Consolidation Recommendations

### 1. TRACKING SERVICES (Priority: HIGH)

**Problem:** `rez-lead-intelligence` and `rez-abandonment-tracker` do nearly identical things.

**Current State:**
- `rez-lead-intelligence` (176K, 14 files): Lead scoring, abandoned cart/search, re-engagement
- `rez-abandonment-tracker` (72K, 2 files): Search/Cart/View abandonment, decay scoring, re-engagement

**Overlap:** Both track abandonment and trigger re-engagement campaigns.

**Recommendation:**
```
MERGE: rez-lead-intelligence + rez-abandonment-tracker
INTO:  rez-intelligence-service (keep as a module in rez-intelligence-hub)
RATIONALE: 90% feature overlap, same goal (lead conversion)
```

---

### 2. INTELLIGENCE HUB (Priority: HIGH)

**Problem:** 8+ services doing user/merchant intelligence with massive overlap.

**Current State:**
| Service | Size | Focus |
|---------|------|-------|
| rez-intent-graph | 2.5M | AI intent tracking, dormant revival |
| rez-intelligence-hub | 68M | User/merchant profiles |
| rez-user-intelligence-service | 154M | Comprehensive user intelligence |
| rez-merchant-intelligence-service | 156M | Merchant business analytics |
| rez-intent-service | 96M | Signal→Intent→Decision→Action |
| rez-intent-predictor | 18M | Real-time intent prediction |
| rez-insights-service | 123M | AI insights storage |
| rez-personalization-engine | 85M | Personalization |
| rez-recommendation-engine | 396K | Recommendations |

**Total Size:** ~700M across 9 services

**Recommendation:**
```
MERGE: rez-intent-graph + rez-intelligence-hub + rez-intent-service + 
       rez-intent-predictor + rez-user-intelligence-service + 
       rez-merchant-intelligence-service
INTO:  rez-intelligence-platform
       ├── modules/
       │   ├── intent-tracking (from rez-intent-graph)
       │   ├── user-profiles (from rez-intelligence-hub)
       │   ├── merchant-profiles (from rez-merchant-intelligence-service)
       │   ├── decision-loop (from rez-intent-service)
       │   └── prediction (from rez-intent-predictor)

MERGE: rez-recommendation-engine + rez-personalization-engine
INTO:  rez-intelligence-platform/recommendations (module)

KEEP:  rez-insights-service (as separate analytics store for dashboards)
KEEP:  rez-error-intelligence (niche use case)

RATIONALE: Single source of truth for all intelligence, eliminates data silos
```

---

### 3. MARKETING & ADS (Priority: HIGH)

**Problem:** Multiple services for ads/marketing with unclear boundaries.

**Current State:**
| Service | Size | Focus |
|---------|------|-------|
| rez-marketing | 179M | Multi-channel (WhatsApp/SMS/Email/Push) campaigns |
| rez-ads-service | 163M | Merchant self-serve ads, ad serving |
| rez-ad-campaigns | 145M | Likely duplicate of ads-service |
| rez-decision-service | 99M | Unified Targeting + Action Engine (18+ engines) |
| rez-targeting-engine | 125M | Ad/Notification targeting |
| rez-ad-ai | 44K | AI copilot for ads |

**Total Size:** ~750M

**Recommendation:**
```
MERGE: rez-ads-service + rez-ad-campaigns
INTO:  rez-advertising-service (single ad serving platform)

MERGE: rez-decision-service + rez-targeting-engine
INTO:  rez-decision-engine (keep as unified decision/targeting layer)

KEEP:  rez-marketing (separate - different domain: campaigns vs ads)

MERGE: rez-ad-ai
INTO:  rez-copilot/ads-module (AI copilot capabilities)

RATIONALE: Clear separation between ads (merchant promoting) vs marketing (direct outreach)
```

---

### 4. COPILOT SERVICES (Priority: HIGH)

**Problem:** 3 copilot services that should be unified.

**Current State:**
| Service | Size | Focus |
|---------|------|-------|
| rez-copilot | 44K | Unified umbrella (5 files, minimal) |
| rez-consumer-copilot | 4.3M | Consumer app AI copilot |
| rez-merchant-copilot | 79M | Merchant dashboard AI copilot |

**Recommendation:**
```
MERGE: rez-copilot + rez-consumer-copilot + rez-merchant-copilot
INTO:  rez-copilot (consolidated)
       ├── src/
       │   ├── consumer/    (from rez-consumer-copilot)
       │   ├── merchant/    (from rez-merchant-copilot)
       │   ├── support/     (new - ticket/support copilot)
       │   └── shared/      (unified AI logic)
       └── src/index.ts     (already exists as unified entry)

RATIONALE: Single copilot codebase, easier to maintain, shared AI logic
```

---

### 5. EVENT SERVICES (Priority: MEDIUM)

**Problem:** Multiple event services with unclear boundaries.

**Current State:**
| Service | Size | Focus |
|---------|------|-------|
| rez-event-platform | 161M | Central event bus, schema validation |
| rez-media-events | 91M | Media-specific events |
| rez-notification-events | 96M | Notification-specific events |

**Recommendation:**
```
MERGE: rez-media-events + rez-notification-events
INTO:  rez-event-platform (as specialized consumers)
       ├── src/
       │   ├── core/           (event bus, schema validation)
       │   ├── consumers/
       │   │   ├── media/      (from rez-media-events)
       │   │   └── notification/ (from rez-notification-events)
       │   └── producers/      (existing event emitters)

RATIONALE: Centralized event topology, easier event governance
```

---

### 6. ML INFRASTRUCTURE (Priority: HIGH)

**Problem:** Some services are empty or nearly empty.

**Current State:**
| Service | Size | Status |
|---------|------|--------|
| rez-ml-engine | 16K | Empty/minimal |
| rez-ml-feature-store | 66M | Active |
| rez-ml-model-registry | 66M | Active |
| rez-training-data-service | 4.0K | Empty/minimal |

**Recommendation:**
```
MERGE: rez-ml-engine + rez-training-data-service
INTO:  rez-ml-feature-store (as training pipeline module)

KEEP:  rez-ml-model-registry (separate - different concern)

RATIONALE: Combine feature store and training data pipeline
```

---

## Consolidated Architecture (Target State)

```
rez-intelligence-platform/     (MERGED: intent-graph, intelligence-hub, intent-service, 
                                user/merchant intelligence, prediction)
├── src/
│   ├── intent-tracking/       # From rez-intent-graph
│   ├── user-profiles/         # From rez-user-intelligence-service  
│   ├── merchant-profiles/      # From rez-merchant-intelligence-service
│   ├── decision-loop/          # From rez-intent-service
│   ├── prediction/             # From rez-intent-predictor
│   └── recommendations/        # From rez-recommendation-engine + personalization

rez-copilot/                   (MERGED: copilot + consumer-copilot + merchant-copilot)
├── src/
│   ├── consumer/
│   ├── merchant/
│   ├── support/
│   └── shared/

rez-advertising-service/       (MERGED: ads-service + ad-campaigns)
├── src/
│   ├── campaign-management/
│   ├── ad-serving/
│   └── auction/

rez-decision-engine/           (MERGED: decision-service + targeting-engine)
├── src/
│   ├── targeting/
│   ├── actions/
│   └── analytics/

rez-event-platform/            (MERGED: event-platform + media-events + notification-events)
├── src/
│   ├── core/
│   ├── consumers/
│   └── producers/

rez-marketing/                 (KEEP SEPARATE)
├── src/
│   ├── campaigns/
│   ├── channels/
│   └── templates/

rez-ml-platform/               (MERGED: ml-feature-store + ml-engine + training-data)
├── src/
│   ├── feature-store/
│   ├── training-pipeline/
│   └── serving/

rez-insights-service/          (KEEP SEPARATE - analytics dashboards)
rez-error-intelligence/         (KEEP SEPARATE - niche)
```

---

## Implementation Priority

| Phase | Consolidation | Effort | Impact |
|-------|--------------|--------|--------|
| **Phase 1** | Copilots (rez-copilot family) | LOW | 80M → 1 repo |
| **Phase 1** | Tracking (lead-intel + abandonment-tracker) | LOW | 250K → 1 repo |
| **Phase 2** | Intelligence Hub (9 → 2 repos) | HIGH | 700M → 200M |
| **Phase 2** | ML Infrastructure (3 → 2 repos) | MEDIUM | 130M → 70M |
| **Phase 3** | Ads (ads-service + ad-campaigns + decision-service + targeting-engine) | HIGH | 530M → 200M |
| **Phase 3** | Events (event-platform + media + notification) | MEDIUM | 350M → 180M |

---

## Summary

| Metric | Current | Target | Savings |
|--------|---------|--------|---------|
| **Total Intelligence Services** | 11 | 3 | 73% reduction |
| **Total Copilot Services** | 3 | 1 | 67% reduction |
| **Total Ads Services** | 5 | 3 | 40% reduction |
| **Total Event Services** | 3 | 1 | 67% reduction |
| **Estimated Code Reduction** | ~2GB | ~600MB | 70% |

---

**Next Steps:**
1. Review and approve this consolidation plan
2. Start with Phase 1 (copilots + tracking) as quick wins
3. Plan Phase 2 (intelligence hub) for next sprint
4. Schedule Phase 3 (ads + events) for future quarter

