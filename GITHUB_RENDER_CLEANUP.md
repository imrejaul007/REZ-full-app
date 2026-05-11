# RTMN GROUP REPO STRUCTURE - HEAD OF EVERYTHING

**Date:** May 11, 2026

---

# RTMN GROUP (HEAD OF EVERYTHING)

## Controls All Other Companies

```
RTMN GROUP
├── REE (Rule Execution Engine)
├── REZ-Admin (Central Admin)
├── SOT (Source of Truth)
├── shared-types
└── REZ-Mind (Central AI)
```

**All other companies reference RTMN Group for controls, policies, and standards.**

---

## 9 COMPANY REPOS (ALL POWERED BY RTMN GROUP)

### 1. RTMN GROUP (HEAD/CONTROLS)

```
RTMN-Group/
├── REE-Dashboard/
├── REE-Admin/
├── REE-Monitoring/
├── REZ-Admin/
├── SOT/
└── shared-types/
```

**RTMN Group owns:** REE rules, Admin panels, Documentation, Type definitions

---

### 2. RABTUL TECHNOLOGIES (SHARED INFRA - Uses RTMN Group)

```
RABTUL-Technologies/
├── rez-api-gateway/
├── rez-auth-service/
├── rez-payment-service/
├── rez-wallet-service/
├── rez-profile-service/
├── rez-search-service/
├── rez-notifications-service/
├── rez-order-service/
├── rez-catalog-service/
├── rez-booking-service/
├── rez-delivery-service/
├── rez-analytics-service/
├── rez-insights-service/
├── rez-scheduler-service/
├── rez-circuit-breaker/
├── rez-retry-service/
├── rez-dlq-service/
├── rez-idempotency-service/
├── rez-policy-engine/
├── rez-ledger-service/
├── rez-audit-logging/
├── rez-observability/
└── shared-types/  # References RTMN Group shared-types
```

---

### 3. REZ INTELLIGENCE (AI - Uses RTMN Group)

```
REZ-Intelligence/
├── REZ-Mind/
├── REZ-support-copilot/
├── rez-intent-graph/
├── rez-ml-engine/
├── rez-personalization/
├── rez-recommendation-engine/
├── rez-user-intelligence/
├── rez-consumer-copilot/
├── rez-merchant-copilot/
├── rez-attribution-system/
└── rez-targeting-engine/
```

**AI powers ALL companies, follows RTMN Group policies.**

---

### 4. REZ MEDIA NETWORK (Ads - Uses RTMN Group + RABTUL + REZ Intelligence)

```
REZ-Media/
├── adBazaar/
├── adsqr/
├── dooh/
├── creators/
├── rez-ads-service/
├── REZ-feedback-service/
├── REZ-campaign-service/
├── REZ-retention-service/
├── REZ-offer-service/
└── REZ-gamification-service/
```

---

### 5. REZ MERCHANT (Merchant Services - Uses RTMN Group + RABTUL + REZ Intelligence)

```
REZ-Merchant/
├── rez-app-merchant/
├── rez-dashboard/
├── rez-merchant-service/
├── rez-admin-dashboard/
├── rez-admin-service/
├── rez-merchant-copilot/
├── rez-merchant-intelligence/
├── rez-integrations/
├── rez-loans-service/
└── rez-barcode-scanner/
```

---

### 6. REZ CONSUMER (Apps - Uses RTMN Group + RABTUL + REZ Intelligence)

```
REZ-Consumer/
├── rez-app-consumer/
├── do-app/
├── rendez-app/
├── rez-now/
├── rez-web-menu/
├── rez-driver-app/
├── dooh-screen-app/
└── dooh-mobile/
```

---

### 7. STAYOWN HOSPITALITY (Uses RTMN Group + RABTUL + REZ Intelligence)

```
StayOwn-Hospitality/
├── Hotel-OTA/
├── rez-hotel-service/
├── rez-stayown-service/
├── rez-habixo-service/
├── verify-service/
└── rez-channel-manager/
```

---

### 8. CORPPERKS (Enterprise - Uses RTMN Group + RABTUL + REZ Intelligence)

```
CorpPerks/
├── CorpPerks/
├── nextabizz/
├── Resturistan/
├── rez-pos-service/
├── rez-kds-service/
├── rez-menu-service/
├── rez-kitchen-ai/
└── rez-inventory-service/
```

---

### 9. RTMN FINANCE (Finance - Uses RTMN Group + RABTUL)

```
RTMN-Finance/
├── rez-payment-links/
├── rez-capital-service/
├── rez-bnpl-service/
├── rez-fraud-detection/
├── rez-insurance-service/
├── rez-billing-service/
└── rez-investment-service/
```

---

## ARCHIVE (DELETE FROM ACTIVE - MOVE HERE FIRST)

### FOLDERS TO ARCHIVE (No longer needed)

```
Archive/
├── REZ-support-copilot.backup/  # Duplicated
├── SOURCE-OF-TRUTH.backup/  # SOT already exists
├── adBazaar.backup/
├── Hotel-OTA.backup/
├── nextabizz.backup/
├── *.backup/  # All backup folders
├── DELETED/  # Any service marked DELETED
└── archive/  # Old archives
```

---

## REPOS TO DELETE ON GITHUB

### GitHub Repos to DELETE:

| Repo | Reason |
|------|--------|
| rez-intelligence-hub | Confusing name, structure changed |
| rez-commerce-platform | Duplicated |
| rez-core-platform | Duplicated |
| rez-marketing-platform | Fragmented |
| rez-ai-platform | Fragmented |
| rez-observability-system | Already in RABTUL |
| REZ-ad-copilot | Already in REZ Intelligence |
| rez-intelligence-platform | Fragmented |

---

## RENDER SERVICES TO DELETE

### Unused/Fragmented Render Services:

| Service | URL | Action |
|---------|-----|--------|
| REZ-recommendation-engine | recommendation.onrender.com | DELETE if not used |
| REZ-personalization-engine | personalization.onrender.com | DELETE if not used |
| REZ-action-engine | action.onrender.com | DELETE if not used |
| REZ-feature-flags | feature-flags.onrender.com | DELETE if consolidated |
| REZ-event-platform | event-platform.onrender.com | CHECK usage |
| analytics-events | analytics-events.onrender.com | CHECK usage |

### RENDER SERVICES TO KEEP (Verified Active):

| Service | URL | Company |
|---------|-----|---------|
| rez-auth-service | rez-auth-service.onrender.com | RABTUL |
| rez-payment-service | rez-payment-service.onrender.com | RABTUL |
| rez-wallet-service | rez-wallet-service.onrender.com | RABTUL |
| REZ-support-copilot | REZ-support-copilot.onrender.com | REZ Intelligence |
| rez-intent-graph | rez-intent-graph.onrender.com | REZ Intelligence |
| Hotel-OTA | hotel-ota.onrender.com | StayOwn |
| adBazaar | adbazaar.onrender.com | REZ Media |

---

## GIT WORKFLOW (All commits go to respective repos)

### How it works:

```
1. Developer works in RTMN-Group/REE-Dashboard/
2. git add . && git commit -m "fix: REE update"
3. git push origin main
   → PUSHES TO: RTMN-Group repo (not REZ-intelligence-hub!)
4. Each company folder has its own .git pointing to its repo
```

### Git Remotes (Each folder has own remote):

```
RTMN-Group/.git → RTMN-Group.git
RABTUL-Technologies/.git → RABTUL-Technologies.git
REZ-Intelligence/.git → REZ-Intelligence.git
REZ-Media/.git → REZ-Media.git
REZ-Merchant/.git → REZ-Merchant.git
REZ-Consumer/.git → REZ-Consumer.git
StayOwn-Hospitality/.git → StayOwn-Hospitality.git
CorpPerks/.git → CorpPerks.git
RTMN-Finance/.git → RTMN-Finance.git
```

---

## ACTION ITEMS

### 1. DELETE from GitHub (User Action):
- [ ] Delete REZ-intelligence-hub (rename if needed)
- [ ] Delete fragmented repos
- [ ] Consolidate duplicate services

### 2. DELETE from Render (User Action):
- [ ] Delete unused render services
- [ ] Keep only active services
- [ ] Update environment variables

### 3. ARCHIVE Local (Claude Code action):
- [ ] Move backups to Archive folder
- [ ] Move DELETED services to Archive
- [ ] Update .gitignore

### 4. SETUP new structure (User Action):
- [ ] Create 9 new repos on GitHub
- [ ] Create new folder structure
- [ ] Move services to correct folders
- [ ] Push each company to its repo

---

## SUMMARY

| Category | Action |
|----------|--------|
| GitHub Repos to DELETE | 5+ |
| Render Services to DELETE | 5+ |
| Backup Folders | Archive all .backup |
| New Repos to CREATE | 9 |
| New Folder Structure | 9 companies |

---

## READY TO START?

**Say "YES" and I'll:**
1. Create Archive folder
2. Move all .backup folders to Archive
3. Document exact steps for reorganizing