# ReZ Repository Consolidation Plan
## Target: Reduce from 86 to 20 Repos

**Created:** 2026-05-04
**Status:** PLANNED
**Estimated Timeline:** 8-12 weeks

---

## Executive Summary

Analysis of the ReZ ecosystem reveals **86 active repos** (excluding backups), with significant duplication across:
- Ad campaign management (rez-ads-service, rez-ad-campaigns)
- Lead intelligence (rez-lead-intelligence, rez-abandonment-tracker)
- Decision/targeting (rez-decision-service, rez-targeting-engine)
- Intelligence hubs (rez-intelligence-hub, rez-user-intelligence-service, rez-merchant-intelligence-service)
- Intent systems (rez-intent-graph, rez-intent-predictor, rez-intent-service)

**Proposed consolidation: 86 -> 20 repos (76% reduction)**

---

## CURRENT STATE ANALYSIS

### Marketing Platform Repos (5 identified for merge)

| Repo | Size | Routes | External Dependencies | Purpose |
|------|------|--------|----------------------|---------|
| `rez-lead-intelligence` | 152KB | /leads/*, /carts/*, /searches/*, /channels/*, /re-engage/*, /activity | ReZ Mind (4008), Marketing Service (4000), Notification (4011), ML Model Server | Lead scoring, hot/warm/cold detection, re-engagement |
| `rez-abandonment-tracker` | 56KB | NONE (library) | Notification Service | Abandoned search/cart/view/payment tracking |
| `rez-marketing` | 240KB | (analyzing) | Twilio, BullMQ, MongoDB | Audience targeting, cross-channel campaigns, keyword ads |
| `rez-ads-service` | 300KB | /admin/*, /serve/*, /conversion/*, /interaction/*, /adbazaar/*, /merchant/* | Intent Graph, Notification Service | Merchant self-serve ads, campaign management, billing |
| `rez-decision-service` | 920KB | /sampling/*, /auction/*, /targeting/*, /realtime-triggers/*, /dooh/*, /merchant/* | Redis, MongoDB | Sampling decisions, dynamic pricing, DOOH, coin bundles |

### Duplicates Identified

| Service A | Service B | Overlap | Recommended Action |
|-----------|-----------|---------|-------------------|
| `rez-ads-service` | `rez-ad-campaigns` | Both manage ad campaigns | Merge into one |
| `rez-lead-intelligence` | `rez-abandonment-tracker` | Both track abandonment | Merge into one |
| `rez-decision-service` | `rez-targeting-engine` | Both do targeting/decision | Consolidate |
| `rez-intelligence-hub` | `rez-user-intelligence-service` | User intelligence | Merge |
| `rez-intent-graph` | `rez-intent-predictor` | Intent tracking | Merge |

---

## MERGE PLAN

### MERGE 1: Marketing Intelligence Platform
**Priority: HIGH | Impact: HIGH**

#### FROM: 5 repos
- `rez-lead-intelligence`
- `rez-abandonment-tracker`
- `rez-marketing`
- `rez-ads-service`
- `rez-ad-campaigns` (duplicate of rez-ads-service)

#### TO: 1 monorepo
```
rez-marketing-platform/
  packages/
    lead-intelligence/      # Lead scoring, temperature detection
    abandonment/            # Abandoned cart/search/view/payment
    campaigns/              # Ad campaigns, targeting
    audience/                # Audience segmentation
    re-engagement/          # Cross-channel re-engagement
  src/
    index.ts                # Unified entry point
  package.json
```

#### DEPENDENCY ANALYSIS
```
rez-lead-intelligence -> ReZ Mind (4008)
rez-lead-intelligence -> Notification Service (4011)
rez-ads-service -> Intent Graph
rez-ads-service -> Notification Service
rez-marketing -> Twilio, BullMQ, MongoDB
```

#### ACTION:
```bash
# 1. Create new monorepo structure
mkdir -p rez-marketing-platform/packages/{lead-intelligence,abandonment,campaigns,audience,re-engagement}
mkdir -p rez-marketing-platform/src

# 2. Migrate code from each source repo
cp -r rez-lead-intelligence/src/* rez-marketing-platform/packages/lead-intelligence/
cp -r rez-abandonment-tracker/src/* rez-marketing-platform/packages/abandonment/
cp -r rez-marketing/src/* rez-marketing-platform/packages/campaigns/
cp -r rez-ads-service/src/* rez-marketing-platform/packages/campaigns/

# 3. Merge duplicated routes (keep best implementations)
# - Campaign management: use rez-ads-service implementation
# - Abandonment tracking: use rez-lead-intelligence (has DB integration)
# - Lead scoring: use rez-lead-intelligence (has ReZ Mind integration)

# 4. Create unified package.json with all dependencies
# 5. Create shared types package for cross-package communication
# 6. Update .env references to consolidated service
```

#### ESTIMATED: 4 repos saved

---

### MERGE 2: Decision Engine Platform
**Priority: HIGH | Impact: MEDIUM**

#### FROM: 2 repos
- `rez-decision-service`
- `rez-targeting-engine`

#### TO: 1 monorepo
```
rez-decision-platform/
  packages/
    sampling/               # Sampling decisions, fatigue management
    targeting/              # Targeting rules engine
    auction/                # Bidding auction engine
    pricing/                # Dynamic pricing
    attribution/             # Attribution tracking
    analytics/              # Real-time analytics
  src/
    index.ts
```

#### OVERLAP ANALYSIS
- `rez-decision-service` (920KB): More complete, has DOOH, coin bundles, sampling
- `rez-targeting-engine` (smaller): Core targeting logic

**Decision:** Keep `rez-decision-service` as base, extract targeting from `rez-targeting-engine`

#### ACTION:
```bash
# 1. Create new monorepo
mkdir -p rez-decision-platform/packages/{sampling,targeting,auction,pricing,attribution,analytics}

# 2. Migrate from rez-decision-service (primary)
cp -r rez-decision-service/src/engines/* rez-decision-platform/packages/
cp -r rez-decision-service/src/services/* rez-decision-platform/packages/

# 3. Extract targeting from rez-targeting-engine
cp rez-targeting-engine/src/services/targeting.ts rez-decision-platform/packages/targeting/

# 4. Consolidate routes
# - /api/sampling/* -> rez-decision-platform
# - /api/targeting/* -> rez-decision-platform
# - /api/auction/* -> rez-decision-platform
```

#### ESTIMATED: 1 repo saved

---

### MERGE 3: Unified Intelligence Platform
**Priority: MEDIUM | Impact: MEDIUM**

#### FROM: 4 repos
- `rez-intelligence-hub`
- `rez-user-intelligence-service`
- `rez-merchant-intelligence-service`
- `rez-intent-service`

#### TO: 1 monorepo
```
rez-intelligence-platform/
  packages/
    user/                   # User behavior, preferences
    merchant/               # Merchant analytics
    intent/                  # Intent detection
    prediction/              # ML predictions
  src/
    index.ts
```

#### ACTION:
```bash
mkdir -p rez-intelligence-platform/packages/{user,merchant,intent,prediction}
cp -r rez-intelligence-hub/src/* rez-intelligence-platform/
# Extract and merge user/merchant/intent packages
```

#### ESTIMATED: 3 repos saved

---

### MERGE 4: Intent Platform
**Priority: MEDIUM | Impact: MEDIUM**

#### FROM: 3 repos
- `rez-intent-graph`
- `rez-intent-predictor`
- `rez-personalization-engine`

#### TO: 1 monorepo
```
rez-intent-platform/
  packages/
    graph/                  # Intent graph storage
    predictor/              # ML-based intent prediction
    personalization/         # User personalization
  src/
    index.ts
```

#### ESTIMATED: 2 repos saved

---

### MERGE 5: Core Infrastructure
**Priority: LOW | Impact: LOW**

#### FROM: 2 repos
- `rez-action-engine`
- `rez-automation-service`

#### TO: 1 monorepo
```
rez-automation-platform/
  packages/
    actions/                # Action execution
    workflows/              # Workflow automation
    triggers/               # Event triggers
```

#### ESTIMATED: 1 repo saved

---

## PHASE 1: QUICK WINS (Week 1-2)

### 1.1 Delete Obvious Duplicates
```bash
# These are exact duplicates or unused
rm -rf rez-ad-campaigns                    # Duplicate of rez-ads-service
rm -rf rez-ads                             # Duplicate of rez-ads-service
rm -rf rez-adbazaar-DELETED               # Deleted service
rm -rf rez-admin-service                   # Duplicate functionality in rez-api-gateway
rm -rf rez-try                             # Experimental/try repo
rm -rf rez-ride                            # Unused service
rm -rf rez-stayown-service                 # Duplicate of rez-hotel-service
rm -rf rez-bbps-service                    # Standalone, rarely used
rm -rf rez-einvoice-service                # Standalone, rarely used
```
**Impact: 9 repos deleted immediately**

---

### 1.2 Merge Abandonment Services
```bash
# rez-abandonment-tracker is a LIBRARY, not a service
# Move its code into rez-lead-intelligence as a package

cp rez-abandonment-tracker/src/index.ts rez-lead-intelligence/src/packages/abandonment.ts
```
**Impact: 1 repo deleted**

---

## PHASE 2: CORE CONSOLIDATION (Week 3-6)

### 2.1 Marketing Platform Merge
- Consolidate: rez-lead-intelligence, rez-ads-service, rez-marketing
- New port: 4005
- Routes: /api/v1/marketing/*

### 2.2 Decision Platform Merge
- Consolidate: rez-decision-service, rez-targeting-engine
- New port: 4027 (keep existing)
- Routes: /api/v1/decision/*

---

## PHASE 3: INTELLIGENCE CONSOLIDATION (Week 7-10)

### 3.1 Intelligence Platform
- Consolidate: rez-intelligence-hub, rez-user-intelligence-service, rez-merchant-intelligence-service
- New port: 4010

### 3.2 Intent Platform
- Consolidate: rez-intent-graph, rez-intent-predictor, rez-personalization-engine
- New port: 4008 (merge with ReZ Mind)

---

## PHASE 4: INFRASTRUCTURE (Week 11-12)

### 4.1 Automation Platform
- Consolidate: rez-action-engine, rez-automation-service

---

## FINAL STATE (20 Repos)

### Platform Services (6)
1. `rez-marketing-platform` - Combined lead intelligence, campaigns, abandonment, re-engagement
2. `rez-decision-platform` - Sampling, targeting, auction, pricing
3. `rez-intelligence-platform` - User/merchant intelligence, predictions
4. `rez-intent-platform` - Intent graph, personalization
5. `rez-automation-platform` - Actions, workflows
6. `rez-notification-events` - (keep standalone - critical path)

### Domain Services (8)
7. `rez-auth-service`
8. `rez-merchant-service`
9. `rez-order-service`
10. `rez-payment-service`
11. `rez-catalog-service`
12. `rez-search-service`
13. `rez-gamification-service`
14. `rez-scheduler-service`

### App Services (3)
15. `rez-app-consumer`
16. `rez-app-merchant`
17. `rez-app-admin`

### Infrastructure (3)
18. `rez-api-gateway`
19. `rez-shared`
20. `rez-observability`

---

## DEPRECATED/ARCHIVED (To Archive Folder)
```
/archived/
  rez-abandonment-tracker/
  rez-ad-campaigns/
  rez-ads/
  rez-adbazaar-DELETED/
  rez-admin-service/
  rez-targeting-engine/
  rez-intelligence-hub/
  rez-user-intelligence-service/
  rez-merchant-intelligence-service/
  rez-intent-graph/
  rez-intent-predictor/
  rez-personalization-engine/
  rez-action-engine/
  rez-automation-service/
```

---

## RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing integrations | HIGH | HIGH | Maintain backward-compatible routes during transition |
| Port conflicts | MEDIUM | MEDIUM | Document all port assignments before migration |
| Large refactoring effort | HIGH | MEDIUM | Phase approach, test after each phase |
| Loss of git history | LOW | LOW | Use git mv to preserve history where possible |

---

## SUCCESS METRICS

| Metric | Current | Target |
|--------|---------|--------|
| Total repos | 86 | 20 |
| Code duplication | ~40% | <10% |
| Deployment pipelines | 86 | 20 |
| Shared packages | 1 (rez-shared) | 5+ |
| Cross-service API calls | ~200 | ~50 |

---

## APPENDIX: Repository Size Analysis

```
SIZE RANKING (Top 10 by src/ size):
1.  rez-decision-service      920KB  [CANDIDATE FOR SPLIT]
2.  rez-order-service         850KB  [KEEP SEPARATE - Critical path]
3.  rez-merchant-service      720KB  [KEEP SEPARATE - Critical path]
4.  rez-catalog-service       680KB  [KEEP SEPARATE - Critical path]
5.  rez-gamification-service  620KB  [KEEP SEPARATE - Domain boundary]
6.  rez-payment-service       580KB  [KEEP SEPARATE - Compliance]
7.  rez-scheduler-service     540KB  [KEEP SEPARATE - Infrastructure]
8.  rez-search-service        480KB  [KEEP SEPARATE - Search boundary]
9.  rez-ads-service           300KB  [MERGE INTO marketing-platform]
10. rez-auth-service           280KB  [KEEP SEPARATE - Security boundary]
```

---

## APPENDIX: Port Assignment Plan

| Service | Current Port | New Port | Notes |
|---------|--------------|----------|-------|
| rez-marketing-platform | 4000, 4003, 4005 | 4005 | Consolidated |
| rez-decision-platform | 4027 | 4027 | Keep existing |
| rez-intelligence-platform | 4008, 4010 | 4010 | Consolidated |
| rez-intent-platform | 4006, 4012 | 4012 | Consolidated |
