# ReZ Ecosystem - Architecture & Repository Structure

**Updated:** 2026-05-01

---

## THE CONFUSION CLARIFIED

### Current Reality

Your services exist in **TWO places**:

| Location | Purpose | Deployed? |
|----------|---------|------------|
| **Individual GitHub repos** | Source of truth for deployment | YES |
| **Monorepo (shared-types)** | Development workspace | NO (just copies) |

---

## REPOSITORY STRUCTURE

### GitHub Organizations

```
github.com/imrejaul007/
├── shared-types              ← Monorepo (dev workspace)
├── rez-auth-service          ← Individual service repo
├── rez-wallet-service        ← Individual service repo
├── rez-order-service         ← Individual service repo
├── rez-payment-service       ← Individual service repo
├── rez-merchant-service      ← Individual service repo
├── rez-catalog-service       ← Individual service repo
├── rez-search-service        ← Individual service repo
├── rez-gamification-service
├── rez-marketing-service
├── rez-scheduler-service
├── rez-finance-service
├── rez-karma-service
├── rez-corpperks-service
├── rez-hotel-service
├── rez-ads-service
├── rez-procurement-service
├── rez-insights-service      ← NEW ✓ (2026-05-01)
├── rez-automation-service    ← NEW ✓ (2026-05-01)
├── rez-intent-graph          ← ReZ Mind repo
└── SOURCE-OF-TRUTH           ← Documentation repo
```

---

## HOW IT WORKS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. You develop in Monorepo (shared-types)                          │
│     └─→ /Users/rejaulkarim/Documents/ReZ Full App/                  │
│                                                                      │
│  2. Services are COPIES of individual repos                         │
│     Each has its own .git pointing to individual repo               │
│     Example: rez-wallet-service/.git → rez-wallet-service.git       │
│                                                                      │
│  3. Deploy from Individual repos (NOT monorepo)                     │
│     └─→ Render deploys from github.com/imrejaul007/rez-wallet-*    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CURRENT WORKFLOW

### For Existing Services:

```bash
# 1. Develop in monorepo
cd "ReZ Full App/rez-wallet-service"
git add . && git commit && git push origin main
# This pushes to github.com/imrejaul007/rez-wallet-service

# 2. Render auto-deploys from individual repo
# (connected to rez-wallet-service on GitHub)
```

### For NEW Services (like insights, automation):

```bash
# 1. Develop in monorepo
cd "ReZ Full App/rez-insights-service"
# ... develop code ...

# 2. Create individual repo on GitHub
gh repo create rez-insights-service --public

# 3. Push to individual repo
cd rez-insights-service
git remote set-url origin git@github.com:imrejaul007/rez-insights-service.git
git push -u origin main

# 4. Connect to Render
# Render → New → Web Service → Connect rez-insights-service repo
```

---

## SERVICE → REPO MAPPING

| Service Folder | GitHub Repo | Render Service |
|----------------|-------------|----------------|
| rez-auth-service | github.com/.../rez-auth-service | rez-auth-service.onrender.com |
| rez-wallet-service | github.com/.../rez-wallet-service | rez-wallet-service.onrender.com |
| rez-order-service | github.com/.../rez-order-service | rez-order-service.onrender.com |
| rez-payment-service | github.com/.../rez-payment-service | - |
| rez-merchant-service | github.com/.../rez-merchant-service | - |
| rez-catalog-service | github.com/.../rez-catalog-service | - |
| rez-search-service | github.com/.../rez-search-service | - |
| rez-gamification-service | github.com/.../rez-gamification-service | - |
| rez-marketing-service | github.com/.../rez-marketing-service | - |
| rez-scheduler-service | github.com/.../rez-scheduler-service | - |
| rez-finance-service | github.com/.../rez-finance-service | - |
| rez-karma-service | github.com/.../rez-karma-service | - |
| rez-corpperks-service | github.com/.../rez-corpperks-service | - |
| rez-hotel-service | github.com/.../rez-hotel-service | - |
| rez-ads-service | github.com/.../rez-ads-service | - |
| rez-procurement-service | github.com/.../rez-procurement-service | - |
| rez-insights-service | github.com/.../rez-insights-service | **NEEDS SETUP** |
| rez-automation-service | github.com/.../rez-automation-service | **NEEDS SETUP** |

---

## MONOREPO vs INDIVIDUAL REPOS

### Monorepo (shared-types)
- **Purpose:** Development workspace, seeing all code together
- **Deploys:** NO
- **Contains:** Copies of all services + packages
- **Use:** Understanding ecosystem, cross-service changes, documentation

### Individual Service Repos
- **Purpose:** Source of truth, deployment
- **Deploys:** YES (via Render)
- **Contains:** One service only
- **Use:** Actual development, CI/CD, production

---

## PROBLEM: MONOREPO OUT OF SYNC

Since you develop in monorepo but deploy from individual repos, they can get out of sync!

### Solution Options:

| Option | Pros | Cons |
|--------|------|------|
| **1. Keep in sync manually** | Simple | Error-prone |
| **2. Extract from monorepo** | Clean | Migration work |
| **3. Move all to monorepo** | Single source | Need to reconfigure Render |

### Recommended: Option 2 - Extract to Monorepo

If you want monorepo to be THE source:

1. Move all service code into monorepo
2. Set up Render to deploy from monorepo subfolders
3. Stop using individual repos for services

---

## WHAT'S RECOMMENDED?

### Current State (Individual Repos)
- **Pros:** Independent deployment, clear ownership
- **Cons:** Hard to see ecosystem, sync issues

### If you want SIMPLER:
**Move everything to monorepo** and deploy from there

### If you want INDIVIDUAL:
**Keep current setup** - monorepo is just dev workspace

---

## NEW SERVICES (2026-05-01)

### rez-insights-service
- **Repo:** https://github.com/imrejaul007/rez-insights-service
- **Status:** Pushed ✓
- **CI/CD:** GitHub Actions ✓
- **Render:** Ready to connect

**Next Steps:**
1. Go to Render → New → Connect GitHub repo
2. Add environment variables:
   - `MONGODB_URI`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `INTERNAL_SERVICE_TOKEN`
   - `INTENT_API_URL=https://rez-intent-graph.onrender.com`
3. Deploy

### rez-automation-service
- **Repo:** https://github.com/imrejaul007/rez-automation-service
- **Status:** Pushed ✓
- **CI/CD:** GitHub Actions ✓
- **Render:** Ready to connect

**Next Steps:**
1. Go to Render → New → Connect GitHub repo
2. Add environment variables:
   - `MONGODB_URI`
   - `REDIS_URL`
   - `INTERNAL_SERVICE_TOKEN`
   - `EVENT_BUS_URL`
3. Deploy

---

## ALL SERVICES STATUS

| Service | GitHub Repo | Render Status |
|---------|-------------|---------------|
| rez-auth-service | ✓ | Deployed |
| rez-wallet-service | ✓ | Deployed |
| rez-order-service | ✓ | Deployed |
| rez-payment-service | ✓ | Deployed |
| rez-merchant-service | ✓ | Deployed |
| rez-catalog-service | ✓ | Deployed |
| rez-search-service | ✓ | Deployed |
| rez-gamification-service | ✓ | Deployed |
| rez-marketing-service | ✓ | Deployed |
| rez-scheduler-service | ✓ | Deployed |
| rez-finance-service | ✓ | Deployed |
| rez-karma-service | ✓ | Deployed |
| rez-corpperks-service | ✓ | Deployed |
| rez-hotel-service | ✓ | Deployed |
| rez-ads-service | ✓ | Deployed |
| rez-procurement-service | ✓ | Deployed |
| rez-insights-service | ✓ NEW | **NEEDS RENDER** |
| rez-automation-service | ✓ NEW | **NEEDS RENDER** |
| rez-intent-graph | ✓ | Deployed |

---

**Confusion resolved?**
