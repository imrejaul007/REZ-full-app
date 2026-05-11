# REZ ECOSYSTEM - MASTER CONSOLIDATION PLAN

**Date:** May 6, 2026
**Version:** 1.0
**Audited By:** 10 Autonomous Agents
**Total Repos Audited:** 72

---

## EXECUTIVE SUMMARY

### Current State
- **72 repos** in ReZ ecosystem
- **High maintenance cost** (CI/CD, hosting, monitoring)
- **Code duplication** across similar services
- **Inconsistent port allocation**
- **Some empty/duplicate repos**

### Target State
- **35-40 core services** (50% reduction)
- **Lower cost** (~$200-400/month savings)
- **Single source of truth** per feature
- **Consistent architecture**

### Estimated Savings
- **37 repos can be eliminated** (merges + deletions)
- **~$200-400/month** hosting savings
- **60% less CI/CD time**
- **Single deployment pipeline** per consolidated service

---

## MERGE CATEGORIES

### 🔴 CRITICAL - DO FIRST

#### 1. COPILOT CONSOLIDATION (Save: 3 repos)

| Current | Status | Action |
|---------|--------|--------|
| `rez-copilot` | ✅ ACTIVE | **KEEP** |
| `REZ-consumer-copilot` | ❌ STATIC | **DELETE** |
| `REZ-support-copilot` | ❌ COMPLEX | **MERGE INTO rez-copilot** |
| `REZ-merchant-copilot` | ❌ COMPLEX | **MERGE INTO rez-copilot** |

**Action:** Move intent handlers from support/merchant into `rez-copilot/src/intents/`

---

#### 2. AD PLATFORM CONSOLIDATION (Save: 4 repos)

| Current | Status | Action |
|---------|--------|--------|
| `adBazaar` | ✅ ACTIVE | **KEEP** (frontend) |
| `adsqr` | ❌ EMPTY | **DELETE** |
| `adbazaar-creator` | ❌ EMPTY | **DELETE** |
| `ados` | ❌ DUPLICATE | **DELETE** |
| `adsos` | ❌ DUPLICATE | **MERGE INTO rez-dooh-service** |
| `rez-uce` | ⚠️ PROTOTYPE | **MERGE INTO adBazaar** |

**Action:** Delete empty repos, merge AdOS logic into `rez-dooh-service`

---

#### 3. EVENT PLATFORM CONSOLIDATION (Save: 3 repos)

| Current | Status | Action |
|---------|--------|--------|
| `rez-event-platform` | ✅ ACTIVE | **KEEP** |
| `analytics-events` | ❌ DUPLICATE | **MERGE INTO rez-event-platform** |
| `rez-media-events` | ❌ DUPLICATE | **MERGE INTO rez-event-platform** |
| `rez-notification-events` | ❌ DUPLICATE | **MERGE INTO rez-event-platform** |

**Action:** Move event handlers into `rez-event-platform/src/events/`

---

### 🟡 HIGH PRIORITY - DO THIS MONTH

#### 4. INTELLIGENCE CONSOLIDATION (Save: 4 repos)

| Current | Status | Action |
|---------|--------|--------|
| `REZ-intelligence-hub` | ✅ ACTIVE | **KEEP** |
| `REZ-user-intelligence-service` | ❌ OVERLAP | **MERGE INTO REZ-intelligence-hub** |
| `REZ-merchant-intelligence-service` | ❌ OVERLAP | **MERGE INTO REZ-intelligence-hub** |
| `REZ-intent-predictor` | ❌ OVERLAP | **MERGE INTO REZ-intelligence-hub** |
| `REZ-mind-client` | ❌ LIBRARY | **MERGE INTO rez-event-platform** |

**Action:** Create `src/intelligence/user/` and `src/intelligence/merchant/` in REZ-intelligence-hub

---

#### 5. PERSONALIZATION CONSOLIDATION (Save: 4 repos)

| Current | Status | Action |
|---------|--------|--------|
| `REZ-intelligence-hub` | ✅ ACTIVE | **KEEP** |
| `REZ-personalization-engine` | ❌ OVERLAP | **MERGE INTO REZ-intelligence-hub** |
| `REZ-recommendation-engine` | ❌ OVERLAP | **MERGE INTO REZ-intelligence-hub** |
| `REZ-targeting-engine` | ❌ OVERLAP | **MERGE INTO REZ-intelligence-hub** |
| `REZ-feature-flags` | ❌ UTILITY | **MERGE INTO rez-shared package** |

**Action:** Create `src/personalization/` module in REZ-intelligence-hub

---

#### 6. AGENT CONSOLIDATION (Save: 2 repos)

| Current | Status | Action |
|---------|--------|--------|
| `rez-intent-graph` | ✅ ACTIVE | **KEEP** |
| `rez-feedback-service` | ⚠️ OVERLAP | **MERGE INTO rez-intent-graph** |
| `REZ-first-loop` | ⚠️ ORCHESTRATION | **KEEP AS STANDALONE** |

**Action:** Merge FeedbackLoopAgent into `rez-intent-graph/src/agents/`

---

#### 7. MESSAGING CONSOLIDATION (Save: 2 repos)

| Current | Status | Action |
|---------|--------|--------|
| `REZ-push-service` | ✅ ACTIVE | **KEEP** |
| `rez-unified-messaging` | ✅ ACTIVE | **MERGE PUSH INTO REZ-push-service** |

**Action:** Merge WhatsApp/SMS/Email into `REZ-push-service/src/channels/`

---

### 🟢 MEDIUM PRIORITY

#### 8. MARKETING MODULES CONSOLIDATION (Save: 2 repos)

| Current | Status | Action |
|---------|--------|--------|
| `rez-marketing-service` | ✅ ACTIVE | **KEEP** |
| `rez-lead-intelligence` | ⚠️ MODULE | **MERGE INTO rez-marketing-service** |
| `rez-abandonment-tracker` | ⚠️ MODULE | **MERGE INTO rez-marketing-service** |

**Action:** Create `src/modules/lead-intelligence/` and `src/modules/abandonment/`

---

#### 9. ADVERTISING CONSOLIDATION (Save: 2 repos)

| Current | Status | Action |
|---------|--------|--------|
| `rez-ads-service` | ✅ ACTIVE | **KEEP** |
| `rez-decision-service` | ⚠️ OVERLAP | **MERGE INTO rez-ads-service** |

**Action:** Move RDE/sampling logic into `rez-ads-service/src/rde/`

---

#### 10. DOOH CONSOLIDATION (Save: 1 repo)

| Current | Status | Action |
|---------|--------|--------|
| `rez-dooh-service` | ✅ ACTIVE | **KEEP** |
| `dooh` | ❌ LIBRARY | **MERGE INTO rez-dooh-service** |

**Action:** Move screen network logic into `rez-dooh-service/src/screens/`

---

#### 11. SCHEDULER CONSOLIDATION (Save: 1 repo)

| Current | Status | Action |
|---------|--------|--------|
| `rez-scheduler-service` | ✅ ACTIVE | **KEEP** |
| `rez-automation-service` | ⚠️ OVERLAP | **MERGE INTO rez-scheduler-service** |

**Action:** Move automation rules into `rez-scheduler-service/src/rules/`

---

#### 12. TRAVEL/CORPORATE CONSOLIDATION (Save: 1 repo)

| Current | Status | Action |
|---------|--------|--------|
| `rez-travel-service` | ✅ ACTIVE | **KEEP** |
| `rez-corporate-service` | ⚠️ OVERLAP | **MERGE INTO rez-travel-service** |

**Action:** Move corporate features into `rez-travel-service/src/corporate/`

---

### 🟡 LOWER PRIORITY

#### 13. USER/PROFILE CONSOLIDATION

| Current | Status | Action |
|---------|--------|--------|
| `rez-profile-service` | ✅ ACTIVE | **KEEP** |
| `rez-knowledge-base-service` | ⚠️ OVERLAP | **MERGE INTO rez-profile-service** |

---

#### 14. KARMA CONSOLIDATION

| Current | Status | Action |
|---------|--------|--------|
| `rez-karma-mobile` | ✅ ACTIVE | **KEEP** (mobile-first) |
| `rez-karma-app` | ❌ DUPLICATE | **DELETE** (web version) |

---

#### 15. OBSERVABILITY CONSOLIDATION

| Current | Status | Action |
|---------|--------|--------|
| `REZ-observability` | ✅ ACTIVE | **KEEP** |
| `rez-error-intelligence` | ⚠️ TOOLS | **MERGE INTO REZ-observability** |

---

#### 16. UTILITIES CONSOLIDATION

| Current | Status | Action |
|---------|--------|--------|
| `rez-contracts` | ⚠️ OVERLAP | **MERGE INTO rez-shared** |
| `rez-devops-config` | ✅ ACTIVE | **KEEP AS-IS** |

---

### ❌ DELETE THESE (Legacies)

| Repo | Reason |
|------|--------|
| `Rez_v-2` | Legacy app - superseded |
| `rez-app` (legacy) | Basic template - superseded |
| `rezprive` | Legacy - premium tier now in consumer app |
| `Karma` | Duplicate of rez-karma-service |
| `adsqr` | Empty repo |
| `adbazaar-creator` | Empty repo |
| `ados` | Duplicate of adsos |
| `REZ-adbazaar` | Legacy duplicate |

---

## FINAL STRUCTURE (Target: 35-40 Services)

### Core Platform (5)
| Service | Merged From |
|---------|-------------|
| `rez-event-platform` | analytics-events, media-events, notification-events, REZ-mind-client |
| `REZ-intelligence-hub` | user-intelligence, merchant-intelligence, personalization, recommendations, targeting, intent-predictor |
| `rez-intent-graph` | feedback-service |
| `rez-first-loop` | (standalone orchestrator) |
| `rez-automation-service` | (standalone) |

### Marketing Platform (5)
| Service | Merged From |
|---------|-------------|
| `rez-ads-service` | decision-service, dooh, adsos |
| `rez-marketing-service` | lead-intelligence, abandonment-tracker |
| `REZ-push-service` | unified-messaging |
| `adBazaar` | (frontend only) |

### Commerce (10)
| Service | Merged From |
|---------|-------------|
| `rez-api-gateway` | (keep) |
| `rez-auth-service` | (keep) |
| `rez-merchant-service` | (keep) |
| `rez-catalog-service` | (keep) |
| `rez-order-service` | (keep) |
| `rez-payment-service` | (keep) |
| `rez-wallet-service` | (keep) |
| `rez-search-service` | (keep) |
| `rez-gamification-service` | (keep) |
| `rez-profile-service` | knowledge-base |

### AI & Copilots (2)
| Service | Merged From |
|---------|-------------|
| `rez-copilot` | consumer-copilot, merchant-copilot, support-copilot |
| `REZ-support-copilot` | (standalone) |

### Utilities (10)
| Service | Merged From |
|---------|-------------|
| `rez-shared` | contracts, feature-flags |
| `rez-corporate-service` | travel-service |
| `REZ-observability` | error-intelligence |
| `rez-karma-mobile` | (standalone) |
| `rez-karma-service` | (standalone) |
| `rez-scheduler-service` | (standalone) |
| `rez-devops-config` | (standalone) |
| `rez-insights-service` | (standalone) |
| `rez-finance-service` | (standalone) |
| `rez-admin-training-panel` | (standalone) |

### Apps (6)
| Service | Merged From |
|---------|-------------|
| `rez-app-consumer` | (keep) |
| `rez-app-merchant` | (keep) |
| `rez-app-admin` | (keep) |
| `rez-now` | (keep) |
| `rez-unified-chat` | (keep as package) |
| `Rendez` | (standalone - social) |

---

## REPOS TO DELETE (15)

| Repo | Reason |
|------|--------|
| `Rez_v-2` | Legacy |
| `rez-app` (legacy) | Superseded |
| `rezprive` | Legacy |
| `Karma` | Duplicate |
| `adsqr` | Empty |
| `adbazaar-creator` | Empty |
| `ados` | Duplicate of adsos |
| `REZ-adbazaar` | Legacy |
| `rez-consumer-copilot` | Absorbed |
| `REZ-feature-flags` | Merge into shared |
| `REZ-mind-client` | Merge into event platform |
| `analytics-events` | Merge into event platform |
| `rez-media-events` | Merge into event platform |
| `rez-notification-events` | Merge into event platform |
| `REZ-intent-predictor` | Merge into intelligence hub |
| `rez-karma-app` | Duplicate of mobile |

---

## PORT STANDARDIZATION

| Service | Current Port | Standardized Port |
|---------|--------------|------------------|
| rez-event-platform | 4008 | 4008 |
| rez-action-engine | 4009 | 4009 |
| rez-feedback-service | 4010 | 4010 |
| rez-intent-graph | 3001 | 4011 |
| REZ-intelligence-hub | 4020 | 4020 |
| rez-ads-service | 4002 | 4022 |
| rez-marketing | 4000 | 4023 |
| REZ-push-service | 4013 | 4024 |
| rez-copilot | 4026 | 4025 |
| adBazaar | 4025 | 4026 |
| rez-dooh-service | 3000 | 4027 |

---

## COST ANALYSIS

### Before
| Resource | Count | Est. Cost |
|-----------|-------|-----------|
| Services | 72 | $500-800/mo |
| Databases | 30+ | $150/mo |
| CI/CD | 72 pipelines | $0 (GitHub) |
| **Total** | | **$650-950/mo** |

### After (Target)
| Resource | Count | Est. Cost |
|-----------|-------|-----------|
| Services | 38 | $250-400/mo |
| Databases | 15 | $75/mo |
| CI/CD | 38 pipelines | $0 (GitHub) |
| **Total** | | **$325-475/mo** |

### Savings
- **$325-475/month** ($3,900-5,700/year)
- **50% fewer services to monitor**
- **60% less deployment complexity**

---

## EXECUTION PHASES

### Phase 1: CRITICAL (This Week)
1. Delete empty/legacy repos (6 repos)
2. Merge copilot services → rez-copilot
3. Merge AdOS into rez-dooh-service
4. Merge events into rez-event-platform

### Phase 2: HIGH PRIORITY (This Month)
5. Merge intelligence services → REZ-intelligence-hub
6. Merge personalization → REZ-intelligence-hub
7. Merge messaging → REZ-push-service
8. Merge lead intelligence → rez-marketing

### Phase 3: MEDIUM PRIORITY (Next Month)
9. Merge decision service → rez-ads-service
10. Merge automation → scheduler
11. Merge travel/corporate
12. Merge observability

### Phase 4: CLEANUP (When Ready)
13. Delete duplicate apps
14. Update all connections
15. Update SOURCE-OF-TRUTH

---

## VALIDATION CHECKLIST

Before each merge, verify:
- [ ] All endpoints documented
- [ ] All connections updated
- [ ] Tests passing
- [ ] No breaking changes
- [ ] Migration documented
- [ ] Rollback plan ready

---

## NEXT STEPS

1. **Review this plan** - Approve/reject merges
2. **Create backup branches** - Before each merge
3. **Execute Phase 1** - Critical merges
4. **Test thoroughly** - Before production
5. **Update SOURCE-OF-TRUTH** - After each phase

---

**End of Master Consolidation Plan**
