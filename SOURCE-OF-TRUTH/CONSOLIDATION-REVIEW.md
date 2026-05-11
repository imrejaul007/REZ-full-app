# REPO CONSOLIDATION - DETAILED REVIEW & IMPROVEMENTS

**Date:** May 6, 2026
**Version:** 2.0

---

## ISSUES WITH CURRENT PLAN

### 1. TOO AGGRESSIVE MERGES

**Problem:** We're trying to merge services that have DIFFERENT deployment patterns, databases, and scaling needs.

**Example:**
```
REZ-intelligence-hub ←── REZ-user-intelligence-service
                    ←── REZ-merchant-intelligence-service
                    ←── REZ-personalization-engine
                    ←── REZ-recommendation-engine
                    ←── REZ-targeting-engine
                    ←── REZ-feature-flags
                    ←── REZ-intent-predictor
```

**Why this is BAD:**
- User intelligence → User DB
- Merchant intelligence → Merchant DB
- Recommendations → Different scaling needs
- Feature flags → Should be in shared, not a service

**BETTER APPROACH:** Keep separate databases, consolidate CODE not SERVICES

---

### 2. IGNORING MONOREPO OPPORTUNITIES

**Current:** 72 separate repos
**Better:** Some should be in monorepos

**Group 1: Microservices with shared patterns**
```
packages/
├── rez-auth-service/
├── rez-wallet-service/
├── rez-order-service/
└── rez-payment-service/
```
**Why:** Same tech stack, share `@rez/shared`, similar deployment

**Group 2: AI Services**
```
packages/
├── rez-intent-graph/
├── rez-copilot/
└── REZ-support-copilot/
```
**Why:** All AI, share ReZ Mind client

**Group 3: Commerce Services**
```
packages/
├── rez-catalog-service/
├── rez-search-service/
├── rez-merchant-service/
└── rez-gamification-service/
```

---

### 3. MISSING: KEEP vs MERGE vs DELETE analysis

**BETTER FRAMEWORK:**

| Category | Criteria | Action |
|----------|----------|--------|
| **KEEP STANDALONE** | Different DB, different scaling, different team | Don't merge |
| **MERGE CODE** | Same tech, share logic, different services | Create shared packages |
| **MONOREPO** | Same deployment, shared deps | Group in workspace |
| **DELETE** | Empty, legacy, duplicate | Delete |

---

### 4. IGNORING BUSINESS DOMAIN BOUNDARIES

**Current:** Grouping by technical similarity
**Better:** Group by business domain

**Business Domains:**

| Domain | Services |
|--------|----------|
| **Commerce** | catalog, search, merchant, orders, payments, wallet |
| **Marketing** | ads, marketing, lead-intelligence, abandonment, pricing, dooh |
| **Intelligence** | intent-graph, event-platform, action-engine, feedback |
| **Support** | copilot, push, notifications |
| **Operations** | scheduler, automation, insights |

---

### 5. NOT CONSIDERING: EXTERNAL DEPENDENCIES

Some services connect to DIFFERENT external APIs:

```
REZ-push-service ──── Firebase, APNs, Twilio, SendGrid
REZ-event-platform ─── BullMQ, Redis
REZ-payment-service ── Razorpay
REZ-corporate ─────── TBO API
```

**Merging these creates COUPLING to multiple external APIs**

---

## IMPROVED CONSOLIDATION STRATEGY

### PHASE 1: DELETE (Do This Week - No Risk)

**Empty/Legacy/Duplicate Repos (15)**

| Repo | Reason | Risk |
|------|--------|------|
| `adsqr` | Empty | NONE |
| `adbazaar-creator` | Empty | NONE |
| `ados` | Duplicate of adsos | NONE |
| `Rez_v-2` | Legacy | NONE |
| `rez-app` (legacy) | Basic template | NONE |
| `rezprive` | Legacy | NONE |
| `Karma` | Duplicate of rez-karma-service | NONE |
| `REZ-adbazaar` | Legacy duplicate | NONE |
| `REZ-consumer-copilot` | Static HTML only | NONE |
| `analytics-events` | Empty stub | NONE |
| `REZ-mind-client` | Just a library | NONE |
| `REZ-feature-flags` | Can be npm package | NONE |
| `REZ-ad-copilot` | Not found | NONE |
| `REZ-intent-predictor` | Overlaps with intent-graph | LOW |
| `rez-contracts` | Can merge into rez-shared | LOW |

**Impact:** 15 fewer repos, ~$0 savings (all free tier)

---

### PHASE 2: MONOREPO GROUPING (Do This Month - Low Risk)

**Group into Workspaces**

#### Group A: Marketing Platform
```
packages/
├── rez-marketing-service/
├── rez-lead-intelligence/
├── rez-abandonment-tracker/
├── rez-decision-service/
└── rez-unified-messaging/
```
**Shared:** ReZ Mind client, Redis, MongoDB

**Benefit:** Single deploy or separate deploys, shared code

#### Group B: Commerce
```
packages/
├── rez-catalog-service/
├── rez-search-service/
└── rez-gamification-service/
```
**Shared:** @rez/shared, similar patterns

#### Group C: Agent Platform
```
packages/
├── rez-intent-graph/
├── rez-copilot/
├── REZ-support-copilot/
└── REZ-merchant-copilot/
```
**Shared:** ReZ Mind, intent detection, AI

---

### PHASE 3: STRATEGIC MERGES (Do When Needed)

**Only merge if there's REAL code duplication**

| If... | Then... |
|-------|---------|
| Two services have 70%+ identical code | MERGE |
| One service is a subset of another | ABSORB |
| Services share the same database | MERGE |
| Services have different DBs/purposes | KEEP SEPARATE |

**CONSIDER MERGING:**

| From | To | Reason |
|------|-----|--------|
| `REZ-user-intelligence-service` | `REZ-merchant-intelligence-service` | Both use same patterns |
| `REZ-personalization-engine` | `REZ-recommendation-engine` | 80% similar algorithms |
| `adsos` | `rez-dooh-service` | DOOH is subset of AdOS |

**DO NOT MERGE:**

| Keep Separate | Reason |
|--------------|--------|
| `rez-payment-service` | Different DB, Razorpay API |
| `REZ-push-service` | Multiple external APIs (FCM, APNs, Twilio, SendGrid) |
| `rez-event-platform` | Critical event bus - keep isolated |
| `rez-intent-graph` | AI brain - keep isolated |
| `rez-api-gateway` | Security boundary |

---

### PHASE 4: CREATE SHARED PACKAGES (Extract, Don't Merge)

**Extract common code into packages:**

| Package | Contains | Used By |
|---------|----------|---------|
| `@rez/intelligence-client` | User/Merchant intelligence patterns | All services |
| `@rez/ad-decision` | Ad scoring algorithms | marketing, ads |
| `@rez/copilot-intents` | Intent handlers | All copilots |
| `@rez/feature-flags` | Flag management | All services |
| `@rez/contracts` | Zod schemas | All services |

---

## REVISED TARGET STRUCTURE

### KEEP STANDALONE (22 Services)

| Service | Reason |
|---------|--------|
| `rez-event-platform` | Critical event bus |
| `rez-action-engine` | Decision execution |
| `rez-feedback-service` | Learning loop |
| `rez-intent-graph` | AI brain |
| `rez-first-loop` | Orchestration |
| `rez-api-gateway` | Security boundary |
| `rez-auth-service` | Auth isolated |
| `rez-merchant-service` | Core commerce |
| `rez-catalog-service` | Core commerce |
| `rez-order-service` | Core commerce |
| `rez-payment-service` | Financial |
| `rez-wallet-service` | Financial |
| `rez-search-service` | Core commerce |
| `REZ-push-service` | Multiple external APIs |
| `rez-copilot` | AI gateway |
| `REZ-support-copilot` | Support |
| `adBazaar` | Frontend |
| `rez-dooh-service` | DOOH |
| `REZ-observability` | Monitoring |
| `rez-scheduler-service` | Background jobs |
| `REZ-intelligence-hub` | User profiles |
| `REZ-merchant-intelligence-service` | Merchant profiles |

### MONOREPO GROUPS (6 Groups)

| Group | Services | Deploy |
|-------|----------|--------|
| **Marketing** | marketing + lead + abandonment + decision + messaging | 1-6 services |
| **Commerce** | catalog + search + gamification | 1-3 services |
| **Travel** | travel + corporate | 1-2 services |
| **Intelligence** | user-intel + personalization + recommendation + targeting | 1-4 services |
| **Ads** | ads-service + dooh + adsos | 1-3 services |
| **Utilities** | karma + profile + knowledge-base | 1-3 services |

### SHARED PACKAGES (5 Packages)

| Package | Extracted From |
|---------|---------------|
| `@rez/contracts` | All services |
| `@rez/feature-flags` | feature-flags service |
| `@rez/shared` | (already exists) |
| `@rez/intelligence-client` | intelligence services |
| `@rez/copilot-intents` | copilot services |

### DELETE (15 Repos)

| Repo | Reason |
|------|--------|
| `adsqr` | Empty |
| `adbazaar-creator` | Empty |
| `ados` | Duplicate |
| `Rez_v-2` | Legacy |
| `rez-app` | Legacy |
| `rezprive` | Legacy |
| `Karma` | Duplicate |
| `REZ-adbazaar` | Duplicate |
| `REZ-consumer-copilot` | Static HTML |
| `analytics-events` | Empty |
| `REZ-mind-client` | Library |
| `REZ-feature-flags` | Extract to package |
| `REZ-ad-copilot` | Not found |
| `REZ-intent-predictor` | Duplicates intent-graph |
| `rez-contracts` | Extract to package |

---

## REVISED COUNT

| Category | Count |
|----------|-------|
| Standalone Services | 22 |
| Monorepo Groups (counts as 1 each) | 6 |
| Shared Packages | 5 |
| **Total** | **38 items** |
| Deleted Repos | 15 |
| **Net Reduction** | **34 repos (47%)** |

---

## RISK ASSESSMENT

| Phase | Risk | Mitigation |
|-------|------|-------------|
| Phase 1: Delete | NONE | Only empty/legacy |
| Phase 2: Monorepo | LOW | No code changes, just grouping |
| Phase 3: Extract packages | LOW | Doesn't affect services |
| Phase 4: Strategic merges | MEDIUM | Requires testing |

---

## RECOMMENDED EXECUTION ORDER

### Week 1: DELETE (No Risk)
```bash
# Just delete these 15 repos from GitHub
gh repo delete <owner>/<repo> --yes
```

### Week 2-3: MONOREPO (Low Risk)
```bash
# Create workspaces for related services
# No code changes, just organize
```

### Week 4: EXTRACT PACKAGES (Low Risk)
```bash
# Move shared code to packages/
# Update imports in dependent services
```

### Month 2-3: STRATEGIC MERGES (Medium Risk)
```bash
# Only merge where there's REAL code duplication
# Requires full testing
```

---

## BETTER METRICS

| Metric | Before | After (Revised) |
|--------|--------|-----------------|
| Total Repos | 72 | **38** |
| Unique Deployments | 72 | **28-38** |
| Monthly Cost | ~$800 | **~$400-500** |
| Risk Level | N/A | **LOW (Phase 1-3)** |

---

## FINAL RECOMMENDATIONS

### DO:
1. **Delete empty/legacy repos first** - Zero risk, immediate cleanup
2. **Create monorepo workspaces** - Organization, no code changes
3. **Extract shared packages** - Reduce duplication, not coupling
4. **Only merge truly duplicate services** - When there's 70%+ overlap
5. **Keep business domain boundaries** - Payments stay separate from events

### DON'T:
1. **Don't merge services with different databases** - Creates coupling
2. **Don't merge services with different external APIs** - Complex dependencies
3. **Don't force everything into one service** - Microservices exist for a reason
4. **Don't merge just because they sound similar** - User intel ≠ Merchant intel
5. **Don't rush strategic merges** - Test thoroughly

---

## REVISED SAVINGS

| Action | Repos Saved | Monthly Savings |
|--------|-------------|----------------|
| Delete empty/legacy | 15 | $0 |
| Monorepo groups | 0 (reorganized) | $0-50 |
| Extract packages | 0 (packages) | $0 |
| Strategic merges | 5-10 | $50-100 |
| **TOTAL** | **20-25** | **$50-150/month** |

---

**KEY INSIGHT:** The biggest savings is not in merging services, but in:
1. Deleting unused repos (free)
2. Reducing deployment targets (monorepos)
3. Extracting shared code (reduces maintenance)

**Merging services with different DBs/purposes creates MORE problems than it solves.**
