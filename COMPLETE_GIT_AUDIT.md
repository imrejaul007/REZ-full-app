# COMPLETE GIT REPOSITORY AUDIT

**Date:** May 11, 2026  
**Auditor:** Claude Code

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| Total GitHub Repos | 92 |
| Services with .git folder | 45 |
| Parent .git (REZ-intelligence-hub) | 1 |
| Folders without .git | 200+ |

---

## GIT STRUCTURE

### PARENT FOLDER
```
ReZ Full App/
├── .git/ → REZ-intelligence-hub.git
└── [Services with own .git folders]
```

### CURRENT PROBLEM
- Parent folder has .git → pushes to REZ-intelligence-hub
- Each service has .git → pushes to their own repo
- **CONFLICT:** When I commit, commits go to parent .git
- Services should push to their own repos, not parent

---

## GITHUB REPOS (92 Total)

### Main/Architecture
| Repo | Purpose |
|------|---------|
| REZ-intelligence-hub | Main platform |
| SOURCE-OF-TRUTH | SOT documentation |
| REZ-identity-system | Identity management |
| REZ-commerce-platform | Commerce logic |
| REZ-intelligence-platform | AI platform |
| REZ-ops-dashboard | Operations |

### Services (Backend)
| Repo | Port |
|------|------|
| rez-auth-service | 4002 |
| rez-payment-service | 4001 |
| rez-wallet-service | 4004 |
| rez-order-service | 3006 |
| rez-catalog-service | 3005 |
| rez-search-service | 4003 |
| rez-gamification-service | - |
| rez-insights-service | - |
| rez-scheduler-service | - |
| rez-billing-service | - |
| rez-automation-service | - |
| rez-marketing-service | - |
| rez-ads-service | 4007 |
| rez-abandonment-tracker | 4108 |
| rez-lead-intelligence | 4106 |
| rez-decision-service | 4027 |
| rez-recommendation-engine | 4015 |
| rez-personalization-engine | 4017 |
| rez-targeting-engine | 3013 |
| rez-intent-graph | 3007 |
| rez-user-intelligence-service | - |
| rez-merchant-intelligence-service | - |

### Frontend Apps
| Repo | Platform |
|------|----------|
| rez-app-consumer | React Native |
| rez-app-merchant | React Native |
| rez-app-admin | Next.js |
| do | DO App |
| Rendez | Social |
| rez-now | QR ordering |
| rez-web-menu | Digital menu |
| rez-karma-app | Karma |
| rez-admin-training-panel | Training |

### Hospitality
| Repo | Purpose |
|------|---------|
| hotel-ota | Hotel booking |
| ReZ-Hotel-pms | PMS |
| rez-stayown-service | Room service |
| rez-habixo-service | Vacation rentals |

### Advertising
| Repo | Purpose |
|------|---------|
| adBazaar | Ad marketplace |
| adsqr | QR ads |
| dooh-screen-app | DOOH screens |
| REZ-ad-copilot | Ad AI |

### Infrastructure
| Repo | Purpose |
|------|---------|
| REZ-circuit-breaker | Resilience |
| REZ-retry-service | Retry logic |
| REZ-dlq-service | Dead letter queue |
| REZ-idempotency-service | Idempotency |
| REZ-policy-engine | Policies |
| REZ-audit-logging | Audit logs |
| REZ-observability | Monitoring |
| REZ-load-tests | Testing |

### Analytics
| Repo | Purpose |
|------|---------|
| rez-user-intelligence-service | User analytics |
| rez-merchant-intelligence-service | Merchant analytics |
| REZ-targeting-engine | Ad targeting |
| analytics-events | Event tracking |

### Other Services
| Repo | Purpose |
|------|---------|
| rez-profile-service | User profiles |
| rez-notification-events | Notifications |
| rez-payment-links-service | Payment links |
| rez-instant-delivery-service | Quick delivery |
| rez-knowledge-base-service | Knowledge |
| rez-price-optimization-service | Pricing |
| rez-unified-messaging | Messaging |
| rez-student-service | Education |
| rez-travel-service | Travel |

### Shared/Packages
| Repo | Purpose |
|------|---------|
| shared-types | Type definitions |
| rez-shared | Shared utilities |

---

## FOLDER STRUCTURE AUDIT

### Services WITH .git (45)
These push to their own GitHub repos:

```
CorpPerks/
Hotel-OTA/
REE-Dashboard/
REZ-attribution-system/
REZ-circuit-breaker/
REZ-creative-engine/
REZ-dlq-service/
REZ-idempotency-service/
REZ-identity-service/
REZ-ledger-service/
REZ-load-tests/
REZ-notifications-hub/
REZ-policy-engine/
REZ-retry-service/
REZ-support-copilot/
SOURCE-OF-TRUTH/
adBazaar/
dooh-screen-app/
nextabizz/
rez-ads-service/
rez-ai-platform/
rez-api-gateway/
rez-auth-service/
rez-automation-service/
rez-billing-service/
rez-billing-system/
rez-catalog-service/
rez-core-platform/
rez-experimentation-engine/
rez-finance-service/
rez-gamification-service/
rez-habixo-service/
rez-identity-graph/
rez-insights-service/
rez-intent-graph/
rez-marketing-backend/
rez-merchant-service/
rez-order-service/
rez-payment-service/
rez-recommendation-engine/
rez-scheduler-service/
rez-search-service/
rez-utilities-platform/
rez-wallet-service/
```

### Services WITHOUT .git
These are CLONED but don't have .git folders:
- rez-kitchen-ai/
- rez-consumer-copilot/
- rez-merchant-copilot/
- rez-karma-service/
- rez-customer-360/
- rez-delivery-service/
- And 100+ more

---

## PUSH STATUS (Today)

### Successfully Pushed (25+)
- Hotel-OTA
- SOURCE-OF-TRUTH
- adBazaar
- nextabizz
- And most service repos

### Failed Pushes (20)
| Service | Error |
|---------|-------|
| REZ-identity-service | Permission denied (SSH) |
| REZ-support-copilot | 403 Forbidden |
| REZ-notifications-hub | Repo not found |
| Various services | Need git pull first |

---

## ISSUES FOUND

### 1. PARENT .GIT CONFLICT
- `.git/` folder in parent points to REZ-intelligence-hub
- Services have their own .git folders
- Commits go to parent by default

### 2. MISSING .GIT FOLDERS
- 100+ services are CLONED but don't have .git
- These are from separate repos but cloned into this folder

### 3. NAMING INCONSISTENCY
- Some use `REZ-` prefix
- Some use `rez-` prefix
- Causes confusion

### 4. BACKUP FOLDERS
- 20+ `*.backup/` folders
- Need cleanup

---

## RECOMMENDATIONS

### Option 1: TRUE MONOREPO
**Keep everything in REZ-intelligence-hub**
- Remove all service .git folders
- All 182 services in one repo
- Simple, atomic commits

### Option 2: KEEP SEPARATE REPOS
**Each service in own repo**
- Remove parent .git
- Services push to own repos
- More complex, better isolation

### Option 3: HYBRID (Recommended)
**Group related services**
- REZ-core-platform: auth, payment, wallet, order
- REZ-merchant-platform: merchant, catalog, analytics
- REZ-ai-platform: intent-graph, ML, insights
- Keep shared packages together

---

## IMMEDIATE ACTIONS

### 1. DELETE BACKUP FOLDERS
```bash
rm -rf *.backup
```

### 2. FIX PERMISSION ISSUES
- Check SSH keys for failed pushes
- Or convert SSH to HTTPS

### 3. CHOOSE STRUCTURE
- Decide: monorepo vs separate repos

### 4. CLEAN UP NAMING
- Standardize to `rez-` or `REZ-`

---

## DECISION NEEDED

**What structure do you want?**

1. **One monorepo** - Everything in REZ-intelligence-hub
2. **Service groups** - Group related services
3. **All separate** - Each service owns repo

