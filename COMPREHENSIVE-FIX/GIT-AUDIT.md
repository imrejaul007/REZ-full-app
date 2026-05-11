# GIT REPOSITORY AUDIT - REZ ECOSYSTEM

**Date:** 2026-05-03

---

## ARCHITECTURE

```
/Users/rejaulkarim/Documents/ReZ Full App/  (LOCAL FOLDER ONLY - NOT A REPO)
│
├── .git/  ← REMOVE THIS - points to wrong repo (shared-types)
│
├── packages/shared-types/  ← STANDALONE REPO (correct)
│   └── .git/ → shared-types.git
│
├── rez-auth-service/  ← STANDALONE REPO
│   └── .git/ → rez-auth-service.git
│
├── rez-wallet-service/  ← STANDALONE REPO
│   └── .git/ → rez-wallet-service.git
│
├── rez-order-service/  ← STANDALONE REPO
│   └── .git/ → rez-order-service.git
│
├── (25+ more standalone repos)
```

---

## CURRENT STATE

### Root Folder (PROBLEM)
| Item | Value |
|------|-------|
| Has .git | YES (should NOT have) |
| Remote | `shared-types.git` (WRONG) |
| Purpose | Local organization only |

### Services (CORRECT)
| Service | GitHub Repo | Status |
|---------|-------------|--------|
| rez-auth-service | rez-auth-service.git | 1 commit pending |
| rez-wallet-service | rez-wallet-service.git | Clean |
| rez-order-service | rez-order-service.git | Clean |
| rez-payment-service | rez-payment-service.git | Clean |
| rez-merchant-service | rez-merchant-service.git | 1 untracked file |
| rez-search-service | rez-search-service.git | Clean |
| rez-catalog-service | rez-catalog-service.git | Clean |
| rez-gamification-service | rez-gamification-service.git | Clean |
| rez-marketing-service | rez-marketing-service.git | Clean |
| rez-ads-service | rez-ads-service.git | Clean |
| rez-travel-service | rez-travel-service.git | 1 commit pending |
| rez-intent-graph | rez-intent-graph.git | 4 commits pending |
| rez-corporate-service | rez-corporate-service.git | 3 commits pending |
| Hotel OTA | hotel-ota.git | Untracked changes |
| adBazaar | adBazaar.git | Untracked changes |

### shared-types (CORRECT)
| Item | Value |
|------|-------|
| GitHub Repo | shared-types.git |
| Location | packages/shared-types/ |
| Status | 2 files modified |

---

## REPOSITORIES FOUND (62 total)

### Backend Services (14)
- rez-auth-service
- rez-wallet-service
- rez-order-service
- rez-payment-service
- rez-merchant-service
- rez-search-service
- rez-catalog-service
- rez-gamification-service
- rez-marketing-service
- rez-ads-service
- rez-travel-service
- rez-intent-graph
- rez-corporate-service
- rez-feature-flags

### AI Services (15)
- rez-insights-service
- rez-intelligence-hub
- rez-intent-predictor
- rez-user-intelligence-service
- rez-merchant-intelligence-service
- rez-targeting-engine
- rez-recommendation-engine
- rez-automation-service
- rez-error-intelligence
- REZ-support-copilot
- REZ-merchant-copilot
- rez-consumer-copilot
- rez-ad-copilot
- rez-personalization-engine
- REZ-MIND-CLIENT

### Frontend Apps (10)
- rez-app-consumer
- rez-app-merchant
- rez-app-admin
- rez-now
- rez-karma-app
- rez-karma-mobile
- adBazaar
- adsqr
- nextabizz
- rez-ops-dashboard

### Supporting (23)
- shared-types, rez-shared, packages, etc.

---

## SHARED-TYPES USAGE

### Services importing @rez/shared-types
```
rez-app-merchant/services/api/products.ts
rez-app-merchant/utils/validation/schemas.ts
rez-app-consumer/services/ordersApi.ts
rez-app-consumer/services/paymentService.ts
packages/shared-types/ (self)
```

### Services importing @rez/shared
```
rez-web-menu/rez-shared/src/...
rez-app-merchant/...
rez-app-consumer/...
```

---

## PROBLEMS TO FIX

### Problem 1: Root Folder Has .git (CONFLICT)
```
/ReZ Full App/.git → shared-types.git (WRONG)
```
**Fix:** Remove or rename root .git

### Problem 2: Uncommitted Changes in Services
Multiple services have unpushed commits or untracked files

### Problem 3: shared-types Version
packages/shared-types/ has local modifications

---

## RECOMMENDED ACTIONS

### Step 1: Fix Root Folder
```bash
# Option A: Remove root .git (keep folder as organization only)
cd "/Users/rejaulkarim/Documents/ReZ Full App"
mv .git .git_removed

# Option B: Keep .git but point to a workspace config
git remote set-url origin git@github.com:imrejaul007/rez-workspace.git
```

### Step 2: Push Each Service
```bash
# Run in each service directory
cd rez-auth-service && git push origin main
cd rez-wallet-service && git push origin main
# ... repeat for all
```

### Step 3: Update shared-types
```bash
cd packages/shared-types
git add -A
git commit -m "Update shared-types"
git push origin main
```

---

## QUICK FIX SCRIPT

```bash
#!/bin/bash
cd "/Users/rejaulkarim/Documents/ReZ Full App"

# 1. Remove root .git conflict
mv .git .git_backup

# 2. Push each service (manual or script)
for dir in rez-*/; do
  echo "=== $dir ==="
  cd "$dir"
  if [ -d ".git" ]; then
    git add -A
    git commit -m "Update" 2>/dev/null || echo "Nothing to commit"
    git push origin main 2>/dev/null || echo "Push failed"
  fi
  cd ..
done

# 3. Update shared-types
cd packages/shared-types
git add -A
git commit -m "Update shared-types"
git push origin main
```

---

## STATUS

- [ ] Remove root .git conflict
- [ ] Push rez-auth-service
- [ ] Push rez-wallet-service
- [ ] Push rez-order-service
- [ ] Push rez-payment-service
- [ ] Push rez-merchant-service
- [ ] Push rez-search-service
- [ ] Push rez-catalog-service
- [ ] Push rez-gamification-service
- [ ] Push rez-marketing-service
- [ ] Push rez-ads-service
- [ ] Push rez-travel-service
- [ ] Push rez-intent-graph
- [ ] Push rez-corporate-service
- [ ] Update shared-types
- [ ] Push remaining services

**Total: 62 repositories to manage**
