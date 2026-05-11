# PROPER REPO STRUCTURE

**Date:** May 11, 2026

---

## RTMN GROUP OWNS (CONTROLLING)
```
RTMN-Group/
├── REE/                     # Rule Execution Engine
│   ├── REE-Dashboard/
│   ├── REE-Admin/
│   └── REE-Monitoring/
├── REZ-Admin/                # REZ Admin (Dashboard)
├── SOT/                      # Source of Truth
└── shared-types/             # Shared types
```

---

## REZ INTELLIGENCE LABS (AI - THE MOAT)
```
REZ-Intelligence/
├── REZ-Mind/                # Central AI brain
├── REZ-support-copilot/
├── rez-intent-graph/
├── rez-ml-engine/
├── rez-personalization-engine/
├── rez-recommendation-engine/
├── rez-user-intelligence/
├── rez-merchant-intelligence/
└── rez-attribution-system/
```

---

## RABTUL TECHNOLOGIES (SHARED INFRA)
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
├── rez-gamification-service/
├── rez-scheduler-service/
├── rez-circuit-breaker/
├── rez-retry-service/
├── rez-dlq-service/
├── rez-idempotency-service/
├── rez-policy-engine/
└── shared-types/
```

---

## REZ MERCHANT (MERCHANT SERVICES)
```
REZ-Merchant/
├── rez-app-merchant/         # Merchant App
├── REZ-dashboard/           # Web Dashboard
├── rez-merchant-service/     # Core service
├── rez-merchant-copilot/     # AI copilot
├── rez-merchant-intelligence/
├── rez-merchant-integrations/
├── rez-merchant-loans/        # Loans/Credit
├── rez-admin-service/
└── REZ-admin-dashboard/
```

---

## REZ MEDIA NETWORK (ADS + LOYALTY)
```
REZ-Media/
├── adBazaar/
├── adsqr/
├── dooh/
├── creators/
├── rez-ads-service/
├── REZ-targeting-engine/
├── REZ-attribution-system/
├── rez-abandonment-tracker/
├── rez-decision-service/
├── REZ-feedback-service/
└── rez-journey-service/
```

---

## STAYOWN HOSPITALITY
```
StayOwn/
├── Hotel-OTA/
├── rez-hotel-service/
├── rez-stayown-service/
├── rez-habixo-service/
├── verify-service/              # Product/QR verification
└── rez-channel-manager/
```

---

## CORPPERKS (ENTERPRISE + SAAS)
```
CorpPerks/
├── CorpPerks/                # Enterprise benefits
├── nextabizz/                 # B2B procurement
├── Resturistan/              # Restaurant OS
├── rez-pos-service/
├── rez-kds-service/
├── rez-kitchen-ai/
├── rez-menu-service/
└── rez-inventory-service/
```

---

## REZ CONSUMER (APPS)
```
REZ-Consumer/
├── rez-app-consumer/           # ReZ App
├── do-app/                   # DO AI App
├── rendez-app/               # Social app
├── rez-now/                  # QR commerce
├── rez-web-menu/
└── rez-driver-app/
```

---

## SUMMARY TABLE

| Company | Owns | Git Repo |
|---------|------|----------|
| RTMN Group | REE, REZ-Admin, SOT | rtmn-group |
| REZ Intelligence | AI/Mind/ML | rez-intelligence |
| RABTUL Tech | Infra | rabtul-technologies |
| REZ Merchant | Merchant services | rez-merchant |
| REZ Media | Ads/Loyalty | rez-media |
| StayOwn | Hotels/Living | stayown |
| CorpPerks | Enterprise/SaaS | corpperks |
| REZ Consumer | Consumer apps | rez-consumer |

---

## GITHUB ORGS

```
imrejaul007/
├── RTMN-Group
├── REZ-Intelligence
├── RABTUL-Technologies
├── REZ-Merchant
├── REZ-Media
├── StayOwn
├── CorpPerks
└── REZ-Consumer
```

---

## FILES/FOLDERS TO MOVE

**From REZ-intelligence-hub to RTMN-Group:**
- REE-Dashboard/
- REE-Admin/
- SOT/
- shared-types/

**From REZ-intelligence-hub to REZ-Merchant:**
- rez-app-merchant/
- rez-merchant-service/
- rez-merchant-copilot/
- REZ-dashboard/
- REZ-admin-dashboard/
- rez-admin-service/
- rez-ads-service/ ❌ wait - ads is REZ Media

---

## READY TO REORGANIZE?

**Tell me:**
1. Which AI services go to REZ Intelligence?
2. Which merchant services go to REZ Merchant?
3. What stays in RABTUL? What goes to RTMN Group?

**Files needing clarification:**
- rez-circuit-breaker → RTMN or RABTUL?
- rez-auth-service → RTMN or RABTUL?
- rez-gamification-service → RABTUL or REZ Media?
- rez-analytics-service → RABTUL or REZ Merchant?