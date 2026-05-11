# REZ ECOSYSTEM - GIT REPOSITORY ARCHITECTURE

**Last Updated:** 2026-05-03
**Status:** DOCUMENTED - Before Any Changes

---

## OVERVIEW

The "ReZ Full App" is a **local folder** containing **62 standalone GitHub repositories**. Each service, app, and package is its own independent repository.

**IMPORTANT:** There is NO root repository. The local folder is just for organization.

---

## DIRECTORY STRUCTURE

```
/Users/rejaulkarim/Documents/ReZ Full App/  ← LOCAL FOLDER ONLY
│
├── .git/  ← ⚠️ CONFLICT - points to shared-types.git (should NOT exist)
│
├── packages/  ← Local organization
│   └── shared-types/  ← STANDALONE REPO
│
├── rez-auth-service/  ← STANDALONE REPO
├── rez-wallet-service/  ← STANDALONE REPO
├── rez-order-service/  ← STANDALONE REPO
├── rez-payment-service/  ← STANDALONE REPO
├── rez-merchant-service/  ← STANDALONE REPO
├── rez-search-service/  ← STANDALONE REPO
├── rez-catalog-service/  ← STANDALONE REPO
├── rez-gamification-service/  ← STANDALONE REPO
├── rez-marketing-service/  ← STANDALONE REPO
├── rez-ads-service/  ← STANDALONE REPO
├── rez-travel-service/  ← STANDALONE REPO
├── rez-intent-graph/  ← STANDALONE REPO
├── rez-corporate-service/  ← STANDALONE REPO
├── rez-feature-flags/  ← STANDALONE REPO
├── rez-insights-service/  ← STANDALONE REPO
├── rez-intelligence-hub/  ← STANDALONE REPO
├── rez-intent-predictor/  ← STANDALONE REPO
├── rez-user-intelligence-service/  ← STANDALONE REPO
├── rez-merchant-intelligence-service/  ← STANDALONE REPO
├── rez-targeting-engine/  ← STANDALONE REPO
├── rez-recommendation-engine/  ← STANDALONE REPO
├── rez-automation-service/  ← STANDALONE REPO
├── rez-error-intelligence/  ← STANDALONE REPO
├── REZ-support-copilot/  ← STANDALONE REPO
├── REZ-merchant-copilot/  ← STANDALONE REPO
├── rez-consumer-copilot/  ← STANDALONE REPO
├── rez-ad-copilot/  ← STANDALONE REPO
├── rez-personalization-engine/  ← STANDALONE REPO
├── REZ-MIND-CLIENT/  ← STANDALONE REPO
├── rez-app-consumer/  ← STANDALONE REPO
├── rez-app-merchant/  ← STANDALONE REPO
├── rez-app-admin/  ← STANDALONE REPO
├── rez-now/  ← STANDALONE REPO
├── rez-karma-app/  ← STANDALONE REPO
├── rez-karma-mobile/  ← STANDALONE REPO
├── rez-karma-service/  ← STANDALONE REPO
├── Hotel OTA/  ← STANDALONE REPO
├── adBazaar/  ← STANDALONE REPO
├── adsqr/  ← STANDALONE REPO
├── nextabizz/  ← STANDALONE REPO
├── rez-ops-dashboard/  ← STANDALONE REPO
├── CorpPerks/  ← STANDALONE REPO
├── SOURCE-OF-TRUTH/  ← STANDALONE REPO
└── ... more repos
```

---

## GIT REMOTE MAPPING

### Root Folder ⚠️ CONFLICT
| Item | Value |
|------|-------|
| Directory | `/ReZ Full App/` |
| Has .git | YES (should NOT) |
| Remote | `git@github.com:imrejaul007/shared-types.git` |
| Issue | Points to wrong repo |

### Core Backend Services

| Service | Local Path | GitHub Repo | Remote URL |
|---------|------------|-------------|------------|
| rez-auth-service | rez-auth-service/ | rez-auth-service.git | git@github.com:imrejaul007/rez-auth-service.git |
| rez-wallet-service | rez-wallet-service/ | rez-wallet-service.git | git@github.com:imrejaul007/rez-wallet-service.git |
| rez-order-service | rez-order-service/ | rez-order-service.git | git@github.com:imrejaul007/rez-order-service.git |
| rez-payment-service | rez-payment-service/ | rez-payment-service.git | git@github.com:imrejaul007/rez-payment-service.git |
| rez-merchant-service | rez-merchant-service/ | rez-merchant-service.git | git@github.com:imrejaul007/rez-merchant-service.git |
| rez-search-service | rez-search-service/ | rez-search-service.git | git@github.com:imrejaul007/rez-search-service.git |
| rez-catalog-service | rez-catalog-service/ | rez-catalog-service.git | git@github.com:imrejaul007/rez-catalog-service.git |
| rez-gamification-service | rez-gamification-service/ | rez-gamification-service.git | git@github.com:imrejaul007/rez-gamification-service.git |
| rez-marketing-service | rez-marketing-service/ | rez-marketing-service.git | git@github.com:imrejaul007/rez-marketing-service.git |
| rez-ads-service | rez-ads-service/ | rez-ads-service.git | git@github.com:imrejaul007/rez-ads-service.git |
| rez-travel-service | rez-travel-service/ | rez-travel-service.git | git@github.com:imrejaul007/rez-travel-service.git |
| rez-intent-graph | rez-intent-graph/ | rez-intent-graph.git | git@github.com:imrejaul007/rez-intent-graph.git |
| rez-corporate-service | rez-corporate-service/ | rez-corporate-service.git | git@github.com:imrejaul007/rez-corporate-service.git |
| rez-feature-flags | rez-feature-flags/ | rez-feature-flags.git | git@github.com:imrejaul007/rez-feature-flags.git |

### AI Services

| Service | GitHub Repo | Remote URL |
|---------|-------------|------------|
| rez-insights-service | REZ-insights-service.git | git@github.com:imrejaul007/REZ-insights-service.git |
| rez-intelligence-hub | rez-intelligence-hub.git | git@github.com:imrejaul007/rez-intelligence-hub.git |
| rez-intent-predictor | rez-intent-predictor.git | git@github.com:imrejaul007/rez-intent-predictor.git |
| rez-user-intelligence-service | rez-user-intelligence-service.git | git@github.com:imrejaul007/rez-user-intelligence-service.git |
| rez-merchant-intelligence-service | rez-merchant-intelligence-service.git | git@github.com:imrejaul007/rez-merchant-intelligence-service.git |
| rez-targeting-engine | rez-targeting-engine.git | git@github.com:imrejaul007/rez-targeting-engine.git |
| rez-recommendation-engine | REZ-recommendation-engine.git | git@github.com:imrejaul007/REZ-recommendation-engine.git |
| rez-automation-service | rez-automation-service.git | git@github.com:imrejaul007/rez-automation-service.git |
| rez-error-intelligence | rez-error-intelligence.git | (token URL - needs cleanup) |
| REZ-support-copilot | REZ-support-copilot.git | git@github.com:imrejaul007/REZ-support-copilot.git |
| REZ-merchant-copilot | REZ-merchant-copilot.git | git@github.com:imrejaul007/REZ-merchant-copilot.git |
| rez-consumer-copilot | REZ-consumer-copilot.git | git@github.com:imrejaul007/REZ-consumer-copilot.git |
| rez-ad-copilot | REZ-ad-copilot.git | git@github.com:imrejaul007/REZ-ad-copilot.git |
| rez-personalization-engine | REZ-personalization-engine.git | git@github.com:imrejaul007/REZ-personalization-engine.git |
| REZ-MIND-CLIENT | REZ-mind-client.git | git@github.com:imrejaul007/REZ-mind-client.git |

### Frontend Apps

| App | GitHub Repo | Remote URL |
|-----|-------------|------------|
| rez-app-consumer | rez-app-consumer.git | git@github.com:imrejaul007/rez-app-consumer.git |
| rez-app-merchant | rez-app-marchant.git | git@github.com:imrejaul007/rez-app-marchant.git |
| rez-app-admin | rez-app-admin.git | git@github.com:imrejaul007/rez-app-admin.git |
| rez-now | rez-now.git | git@github.com:imrejaul007/rez-now.git |
| rez-karma-app | rez-karma-app.git | git@github.com:imrejaul007/rez-karma-app.git |
| rez-karma-mobile | rez-karma-mobile.git | git@github.com:imrejaul007/rez-karma-mobile.git |
| Hotel OTA | hotel-ota.git | git@github.com:imrejaul007/hotel-ota.git |
| adBazaar | adBazaar.git | git@github.com:imrejaul007/adBazaar.git |
| adsqr | adsqr.git | git@github.com:imrejaul007/adsqr.git |
| nextabizz | nextabizz.git | git@github.com:imrejaul007/nextabizz.git |
| rez-ops-dashboard | rez-ops-dashboard.git | git@github.com:imrejaul007/rez-ops-dashboard.git |
| CorpPerks | CorpPerks.git | git@github.com:imrejaul007/CorpPerks.git |

### Supporting Services

| Service | GitHub Repo | Remote URL |
|---------|-------------|------------|
| shared-types | shared-types.git | git@github.com:imrejaul007/shared-types.git |
| rez-shared | rez-shared.git | git@github.com:imrejaul007/rez-shared.git |
| rez-api-gateway | rez-api-gateway.git | git@github.com:imrejaul007/rez-api-gateway.git |
| rez-push-service | REZ-push-service.git | git@github.com:imrejaul007/REZ-push-service.git |
| rez-scheduler-service | rez-scheduler-service.git | git@github.com:imrejaul007/rez-scheduler-service.git |
| rez-notification-events | rez-notification-events.git | git@github.com:imrejaul007/rez-notification-events.git |
| rez-media-events | rez-media-events.git | git@github.com:imrejaul007/rez-media-events.git |
| rez-contract | rez-contracts.git | git@github.com:imrejaul007/rez-contracts.git |
| SOURCE-OF-TRUTH | SOURCE-OF-TRUTH.git | git@github.com:imrejaul007/SOURCE-OF-TRUTH.git |

---

## SHARED-TYPES DEPENDENCY TREE

### What is shared-types?
- **Location:** `packages/shared-types/`
- **Package:** `@rez/shared-types`
- **Purpose:** Canonical TypeScript interfaces, Zod schemas, FSM helpers, branded IDs
- **Version:** 2.0.0
- **GitHub:** shared-types.git

### Services Importing @rez/shared-types
```
packages/shared-types/  ← Exports all types
├── src/index.ts
├── src/intent-qr.ts
└── src/guards/
    └── ... type guards

Consumer Apps:
├── rez-app-merchant/
│   ├── services/api/products.ts (isProductResponse)
│   └── utils/validation/schemas.ts (multiple schemas)
├── rez-app-consumer/
│   ├── services/ordersApi.ts (isOrderResponse, isArrayOf)
│   └── services/paymentService.ts (isPaymentResponse)
```

### Services Importing @rez/shared
```
rez-web-menu/rez-shared/  ← Shared utilities
├── src/dtos.ts
├── src/types/
│   ├── user.types.ts
│   ├── order.types.ts
│   ├── wallet.types.ts
│   ├── merchant.types.ts
│   ├── campaign.types.ts
│   └── booking.types.ts
└── src/index.ts

Also used by:
├── rez-app-merchant/
├── rez-app-consumer/
└── rez-app-admin/
```

---

## CURRENT GIT STATUS (Before Changes)

### Root Folder
| Item | Status |
|------|--------|
| Has .git | YES (⚠️ CONFLICT) |
| Remote | shared-types.git (WRONG) |
| Ahead of origin | 6 commits |

### Core Services Status
| Service | Modified | Commits Ahead | Issue |
|---------|----------|---------------|-------|
| rez-auth-service | No | 0 | Clean |
| rez-wallet-service | No | 0 | Clean |
| rez-order-service | No | 0 | Clean |
| rez-payment-service | No | 0 | Clean |
| rez-merchant-service | Yes | 0 | 1 untracked file |
| rez-search-service | No | 0 | Clean |
| rez-catalog-service | No | 0 | Clean |
| rez-gamification-service | No | 0 | Clean |
| rez-marketing-service | No | 0 | Clean |
| rez-ads-service | No | 0 | Clean |
| rez-travel-service | Yes | 1 | 1 commit |
| rez-intent-graph | Yes | 4 | 4 commits |
| rez-corporate-service | Yes | 3 | 3 commits |

### shared-types Status
| Item | Status |
|------|--------|
| Modified | Yes |
| Files changed | 2 |
| Files untracked | 1 |

---

## KNOWN ISSUES

### Issue 1: Root .git Conflict
The root folder has a .git directory pointing to shared-types.git. This is a conflict because:
- Root folder is NOT a repo
- packages/shared-types IS the actual shared-types repo
- Commits at root level go to shared-types (wrong repo)

### Issue 2: Inconsistent Naming
Some repos use different naming conventions:
- `REZ-support-copilot` vs `rez-support-copilot`
- `REZ-MIND-CLIENT` vs `REZ-mind-client`
- `rez-app-marchant` (typo) vs `rez-app-merchant`

---

## RECOMMENDED ACTIONS

### Action 1: Remove Root .git
```bash
cd "/Users/rejaulkarim/Documents/ReZ Full App"
mv .git .git_backup  # Backup first
# OR
rm -rf .git
```

### Action 2: Push Each Service
Each service needs to be pushed to its own GitHub repo.

### Action 3: Update shared-types
```bash
cd packages/shared-types
git add -A
git commit -m "Update shared-types"
git push origin main
```

### Action 4: Fix Token in Remote
Remove the GitHub token from the remote URL.

---

## NOTES

- All 62+ repos are standalone GitHub repositories
- Each service manages its own git independently
- shared-types is the canonical source for types
- No root/monorepo exists

---

**Status:** DOCUMENTED - 2026-05-03
**Next Step:** User decision on how to proceed
