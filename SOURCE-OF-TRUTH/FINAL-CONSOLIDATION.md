# REZ PLATFORM - FINAL CONSOLIDATION PLAN

**Date:** May 6, 2026
**Version:** 1.0

---

## YOUR REQUIREMENTS

| Keep As-Is | Reason |
|------------|--------|
| **Commerce (10 repos)** | Core business logic |
| **All Apps & Web** | Consumer/Merchant/Admin apps |

---

## CONSOLIDATION SCOPE

Only merge/cleanup:
1. **Marketing Services** (overlapping)
2. **AI/Intelligence Services** (overlapping)
3. **Legacy/Empty Repos** (not used)
4. **Duplicate Services** (same functionality)

---

## KEEP AS-IS (Do Not Touch)

### Commerce (10 repos)
```
rez-api-gateway
rez-auth-service
rez-merchant-service
rez-order-service
rez-payment-service
rez-catalog-service
rez-wallet-service
rez-search-service
rez-gamification-service
rez-finance-service
```

### Apps (8 repos)
```
rez-app-consumer
rez-app-marchant
rez-app-admin
rez-now
rez-karma-mobile
rez-unified-chat
rez-web-menu
rez-admin-training-panel
```

---

## WHAT TO CONSOLIDATE

### Marketing Services (5 → 1 monorepo)

| Current | Action |
|---------|--------|
| rez-lead-intelligence | MERGE |
| rez-abandonment-tracker | MERGE |
| rez-marketing-service | MERGE |
| rez-ads-service | MERGE |
| rez-decision-service | MERGE |

**Target:** `rez-marketing-platform` monorepo

---

### AI/Intelligence Services (9 → 3 monorepos)

| Current | Action |
|---------|--------|
| REZ-intelligence-hub | KEEP |
| REZ-user-intelligence-service | MERGE INTO hub |
| REZ-merchant-intelligence-service | MERGE INTO hub |
| REZ-personalization-engine | MERGE INTO hub |
| REZ-recommendation-engine | MERGE INTO hub |
| REZ-targeting-engine | MERGE INTO hub |
| REZ-observability | KEEP SEPARATE |
| REZ-error-intelligence | MERGE INTO observability |

**Target:** 
- `REZ-intelligence-hub` (absorb user/merchant/personalization)
- `REZ-observability` (absorb error-intelligence)

---

### Marketing Monorepo

```
packages/
└── marketing-platform/
    ├── services/
    │   ├── rez-lead-intelligence/
    │   ├── rez-abandonment-tracker/
    │   ├── rez-marketing-service/
    │   ├── rez-ads-service/
    │   └── rez-decision-service/
    └── render.yaml (deploy all or each)
```

---

### Intelligence Monorepo

```
packages/
└── intelligence-platform/
    ├── services/
    │   ├── REZ-intelligence-hub/
    │   ├── REZ-user-intelligence-service/
    │   ├── REZ-merchant-intelligence-service/
    │   ├── REZ-personalization-engine/
    │   └── REZ-recommendation-engine/
    └── render.yaml
```

---

## DELETE (Not Used)

| Repo | Reason |
|------|--------|
| REZ-ad-copilot | Not found |
| REZ-mind-client | Library, not used |
| REZ-feature-flags | Single file, not used |
| REZ-consumer-copilot | Static HTML only |
| adsos | Duplicate DOOH code |
| adsqr | Empty |
| REZ-adbazaar | Legacy duplicate |
| Rez_v-2 | Legacy |
| rezprive | Legacy |

---

## FINAL STRUCTURE

### After Consolidation

| Category | Repos | Status |
|----------|-------|--------|
| **Commerce** | 10 | As-is |
| **Apps** | 8 | As-is |
| **Marketing** | 1 monorepo | Merged from 5 |
| **Intelligence** | 1 monorepo | Merged from 6 |
| **Observability** | 1 | Keep separate |
| **Legacy** | 9 | Delete |

---

## SUMMARY

| Before | After |
|--------|-------|
| 68 repos | 55 repos |
| Marketing: 5 separate | Marketing: 1 monorepo |
| Intelligence: 6 separate | Intelligence: 1 monorepo |
| Legacy: 9 | Deleted |
| Commerce: 10 | Unchanged |
| Apps: 8 | Unchanged |

---

## SAVINGS

| Item | Savings |
|------|---------|
| Deploy targets | 4 fewer |
| CI/CD pipelines | 4 fewer |
| Monthly cost | ~$50-100 |
| Maintenance | 50% less |

---

## EXECUTION

### Week 1: Marketing Monorepo
```bash
# Create marketing-platform with all 5 services
```

### Week 2: Intelligence Monorepo
```bash
# Create intelligence-platform with 6 services
```

### Week 3: Delete Legacy
```bash
# Archive 9 unused repos
```

---

**Total Reduction: 13 repos (19%)**
