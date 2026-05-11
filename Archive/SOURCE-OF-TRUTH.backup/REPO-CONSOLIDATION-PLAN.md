# REZ ECOSYSTEM - REPOSITORY CONSOLIDATION REPORT

**Date:** May 6, 2026
**Version:** 1.0
**Purpose:** Reduce from 72 repos to ~25 core services

---

## EXECUTIVE SUMMARY

### Current State
- **72 repos** in ReZ ecosystem
- **35+ separate deployments**
- **High maintenance cost** (CI/CD, monitoring, hosting)
- **Code duplication** across similar services

### Target State
- **25-30 core services**
- **15 fewer deployments**
- **Lower cost** (~$500-1000/month savings)
- **Single source of truth** per feature

---

## MERGE CATEGORIES

### 🔴 CRITICAL - Merge Now

#### 1. COPILOT CONSOLIDATION (Save: 3 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-copilot` | ✅ ACTIVE | **KEEP** - Unified copilot |
| `REZ-consumer-copilot` | ❌ DELETE | Merge into rez-copilot |
| `REZ-support-copilot` | ❌ DELETE | Merge into rez-copilot |
| `REZ-merchant-copilot` | ❌ DELETE | Merge into rez-copilot |

**Merge Into:** `rez-copilot`
**Action:** Move routes/modules into `rez-copilot/src/routes/`

---

#### 2. AD PLATFORM CONSOLIDATION (Save: 5 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-ad-campaigns` | ✅ ACTIVE | **KEEP** - Primary |
| `adBazaar` | ✅ KEEP | Frontend (keep separate) |
| `adsqr` | ✅ KEEP | QR sampling (keep) |
| `REZ-adbazaar` | ❌ DELETE | Legacy - delete |
| `REZ-ad-copilot` | ❌ DELETE | Merge into rez-ad-campaigns |
| `@rez/ad-ai` | ❌ DELETE | Merge into rez-ad-campaigns |

**Merge Into:** `rez-ad-campaigns`
**Action:** Move Ad AI into `rez-ad-campaigns/src/ai/`

---

#### 3. DOOH CONSOLIDATION (Save: 3 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-dooh-service` | ✅ ACTIVE | **KEEP** - Unified |
| `dooh` | ❌ DELETE | Merge into rez-dooh-service |
| `adsos` | ❌ DELETE | Merge into rez-dooh-service |
| `ados` | ❌ DELETE | Merge into rez-dooh-service |

**Merge Into:** `rez-dooh-service`

---

#### 4. EVENT PLATFORM CONSOLIDATION (Save: 3 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-event-platform` | ✅ ACTIVE | **KEEP** - Primary |
| `analytics-events` | ❌ DELETE | Merge into rez-event-platform |
| `rez-media-events` | ❌ DELETE | Merge into rez-event-platform |
| `rez-notification-events` | ❌ DELETE | Merge into rez-event-platform |

**Merge Into:** `rez-event-platform`
**Action:** Create event types `events/analytics.ts`, `events/media.ts`, `events/notifications.ts`

---

### 🟡 HIGH PRIORITY

#### 5. INTELLIGENCE CONSOLIDATION (Save: 5 repos)

| Repo | Status | Action |
|------|--------|--------|
| `REZ-intelligence-hub` | ✅ ACTIVE | **KEEP** - Central hub |
| `REZ-user-intelligence-service` | ❌ DELETE | Merge into REZ-intelligence-hub |
| `REZ-merchant-intelligence-service` | ❌ DELETE | Merge into REZ-intelligence-hub |
| `REZ-intent-predictor` | ❌ DELETE | Merge into REZ-intelligence-hub |
| `REZ-mind-client` | ❌ DELETE | Merge into REZ-intelligence-hub |

**Merge Into:** `REZ-intelligence-hub`

---

#### 6. PERSONALIZATION CONSOLIDATION (Save: 4 repos)

| Repo | Status | Action |
|------|--------|--------|
| `REZ-intelligence-hub` | ✅ ACTIVE | **KEEP** - Central |
| `REZ-personalization-engine` | ❌ DELETE | Merge into REZ-intelligence-hub |
| `REZ-recommendation-engine` | ❌ DELETE | Merge into REZ-intelligence-hub |
| `REZ-targeting-engine` | ❌ DELETE | Merge into REZ-intelligence-hub |
| `REZ-feature-flags` | ❌ DELETE | Merge into REZ-intelligence-hub |

**Merge Into:** `REZ-intelligence-hub`
**Action:** Create modules `personalization/`, `recommendations/`, `targeting/`, `flags/`

---

#### 7. AGENT CONSOLIDATION (Save: 2 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-agent-os` | ✅ ACTIVE | **KEEP** |
| `rez-agent-memory` | ❌ DELETE | Merge into rez-agent-os |

**Merge Into:** `rez-agent-os/src/memory/`

---

#### 8. MARKETING SERVICES CONSOLIDATION (Save: 3 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-marketing-service` | ✅ ACTIVE | **KEEP** - Primary |
| `rez-lead-intelligence` | ⚠️ MERGE | Keep as module in rez-marketing |
| `rez-abandonment-tracker` | ⚠️ MERGE | Keep as module in rez-marketing |

**Merge Into:** `rez-marketing-service`
**Action:** Create `src/modules/lead-intelligence/`, `src/modules/abandonment-tracker/`

---

#### 9. PRICING + DECISION CONSOLIDATION (Save: 2 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-decision-service` | ✅ ACTIVE | **KEEP** |
| `rez-price-optimization-service` | ⚠️ MERGE | Keep as module |

**Merge Into:** `rez-decision-service`
**Action:** Create `src/modules/pricing/`

---

### 🟢 MEDIUM PRIORITY

#### 10. MESSAGING CONSOLIDATION (Save: 2 repos)

| Repo | Status | Action |
|------|--------|--------|
| `rez-unified-messaging` | ✅ ACTIVE | **KEEP** |
| `rez-unified-chat` | ❌ DELETE | Merge into rez-unified-messaging |

**Merge Into:** `rez-unified-messaging`

---

#### 11. SUPPORT CONSOLIDATION (Save: 3 repos)

| Repo | Status | Action |
|------|--------|--------|
| `REZ-support-copilot` | ✅ ACTIVE | **KEEP** |
| `rez-error-intelligence` | ❌ DELETE | Merge into REZ-support-copilot |
| `rez-knowledge-base-service` | ⚠️ MERGE | Keep as module |

**Merge Into:** `REZ-support-copilot`

---

### 🟡 LOWER PRIORITY

#### 12. USER/PROFILE CONSOLIDATION

| Repo | Status | Action |
|------|--------|--------|
| `rez-profile-service` | ✅ ACTIVE | **KEEP** |
| `rezprofile` | ❌ DELETE | Merge into rez-profile-service |

---

#### 13. KARMA CONSOLIDATION

| Repo | Status | Action |
|------|--------|--------|
| `rez-karma-app` | ✅ ACTIVE | **KEEP** |
| `rez-karma-mobile` | ❌ DELETE | Merge into rez-karma-app |
| `Karma` | ❌ DELETE | Legacy |

---

#### 14. APP CONSOLIDATION (Consider)

| Repo | Status | Action |
|------|--------|--------|
| `rez-app` | ❌ DELETE | Legacy - merge into rez-app-consumer |
| `Rez_v-2` | ❌ DELETE | Legacy - merge into rez-app-consumer |
| `Rendez` | ❌ DELETE | Legacy - merge into rez-app-consumer |

---

## COST SAVINGS SUMMARY

### Current Monthly Cost (Estimated)
| Item | Count | Est. Cost/Month |
|------|-------|-----------------|
| Render Starter (free tier) | ~40 repos | $0 |
| Render Starter (paid) | ~20 repos | $7 × 20 = $140 |
| Render Pro | ~10 repos | $25 × 10 = $250 |
| MongoDB Atlas (cluster) | 3 clusters | $57 × 3 = $171 |
| Redis | ~5 instances | $5 × 5 = $25 |
| **TOTAL** | | **~$586/month** |

### Target Monthly Cost
| Item | Count | Est. Cost/Month |
|------|-------|-----------------|
| Render Pro | ~15 repos | $25 × 15 = $375 |
| MongoDB Atlas (shared) | 1 cluster | $57 |
| Redis | 2 instances | $10 |
| **TOTAL** | | **~$442/month** |

### Estimated Savings
- **~$144/month** ($1,728/year)
- **50% less CI/CD time**
- **75% less maintenance overhead**

---

## MERGE PLAN (In Order)

### Phase 1: CRITICAL (Do This Week)
1. **Copilot** - Merge 3 into 1 → Save 3 repos
2. **DOOH** - Merge 4 into 1 → Save 3 repos
3. **Events** - Merge 4 into 1 → Save 3 repos

**Result:** 72 → 66 repos

### Phase 2: HIGH PRIORITY (Do This Month)
4. **Intelligence** - Merge 5 into 1 → Save 4 repos
5. **Personalization** - Merge 5 into 1 → Save 4 repos
6. **Agent** - Merge 2 into 1 → Save 1 repo
7. **Marketing** - Merge 3 into 1 → Save 2 repos

**Result:** 66 → 55 repos

### Phase 3: MEDIUM PRIORITY (Do Next Month)
8. **Pricing** - Merge 2 into 1 → Save 1 repo
9. **Messaging** - Merge 2 into 1 → Save 1 repo
10. **Support** - Merge 3 into 1 → Save 2 repos

**Result:** 55 → 51 repos

### Phase 4: LOW PRIORITY (Do When Ready)
11. **User/Profile** - Save 1 repo
12. **Karma** - Save 2 repos
13. **Legacy Apps** - Save 4 repos

**Final Result:** **72 → 45 repos** (37% reduction)

---

## REPOS TO DELETE (Legacy/Not Used)

| Repo | Reason |
|------|--------|
| `REZ-adbazaar` | Duplicate of adBazaar |
| `Rez_v-2` | Legacy app |
| `rez-app` | Legacy app |
| `Karma` | Duplicate of rez-karma-app |
| `adsos` | Merged into rez-dooh-service |
| `ados` | Merged into rez-dooh-service |
| `rezprofile` | Duplicate of rez-profile-service |

---

## RECOMMENDED FINAL STRUCTURE (25-30 Core Services)

### Core Platform
| Service | Merged From |
|---------|-------------|
| `rez-event-platform` | analytics-events, media-events, notification-events |
| `REZ-intelligence-hub` | user-intelligence, merchant-intelligence, intent-predictor, personalization, targeting, feature-flags |
| `rez-agent-os` | agent-memory |

### Marketing Platform
| Service | Merged From |
|---------|-------------|
| `rez-marketing-service` | lead-intelligence, abandonment-tracker |
| `rez-ad-campaigns` | ad-copilot, ad-ai |
| `rez-dooh-service` | dooh, adsos, ados |
| `rez-unified-messaging` | unified-chat |

### Commerce
| Service | Merged From |
|---------|-------------|
| `rez-api-gateway` | (keep as is) |
| `rez-merchant-service` | (keep as is) |
| `rez-order-service` | (keep as is) |
| `rez-payment-service` | (keep as is) |
| `rez-catalog-service` | (keep as is) |
| `rez-wallet-service` | (keep as is) |

### Apps
| Service | Merged From |
|---------|-------------|
| `rez-app-consumer` | rez-app, Rez_v-2, Rendez |
| `rez-app-merchant` | (keep as is) |
| `rez-app-admin` | (keep as is) |
| `rez-now` | (keep as is) |
| `rez-copilot` | consumer-copilot, merchant-copilot, support-copilot |

### Utilities
| Service | Merged From |
|---------|-------------|
| `rez-support-copilot` | error-intelligence, knowledge-base |
| `rez-profile-service` | rezprofile |
| `rez-karma-app` | karma-mobile |
| `rez-contracts` | (keep as is) |
| `rez-shared` | (keep as is) |

---

## ACTION ITEMS

### This Week
- [ ] Merge REZ-consumer-copilot → rez-copilot
- [ ] Merge REZ-merchant-copilot → rez-copilot
- [ ] Merge REZ-support-copilot → rez-copilot
- [ ] Delete REZ-adbazaar (duplicate)

### This Month
- [ ] Merge all event repos → rez-event-platform
- [ ] Merge all intelligence repos → REZ-intelligence-hub
- [ ] Merge all personalization repos → REZ-intelligence-hub
- [ ] Merge rez-lead-intelligence + rez-abandonment-tracker → rez-marketing-service

### Next Month
- [ ] Merge rez-price-optimization-service → rez-decision-service
- [ ] Merge rez-unified-chat → rez-unified-messaging
- [ ] Merge rez-agent-memory → rez-agent-os
- [ ] Merge rez-error-intelligence → REZ-support-copilot

---

## TOTAL SAVINGS

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Total Repos | 72 | 45 | **27 (37%)** |
| Monthly Cost | ~$586 | ~$442 | **$144/year** |
| Deployments | ~35 | ~20 | **15 fewer** |
| CI/CD Pipelines | 72 | 45 | **27 fewer** |

---

**End of Report**
