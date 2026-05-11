# FINAL COMPANY STRUCTURE - MAY 11, 2026

## 8 COMPANIES

---

## 1. RTNM-GROUP (HEAD CONTROLS + ADMIN)
```
RTNM-Group/
├── REE-Admin/
├── REE-Dashboard/
├── REE-Monitoring/
├── REZ-admin-dashboard/
├── REZ-ops-dashboard/
├── rez-admin-service/
├── rez-admin-training-panel/
├── rez-loyalty-admin/
├── REZ-identity-service/
├── rez-api-docs/
├── rez-app-admin/
├── rez-payment-links-service/
├── REZ-capital-service/
├── REZ-bnpl-service/
├── SOT/
└── shared-types/
```
**Owns:** REE, Admin panels, SOT, Identity, Finance tools

---

## 2. RABTUL-TECHNOLOGIES (SHARED INFRASTRUCTURE)
```
RABTUL-Technologies/
├── api-gateway/
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
├── rez-scheduler-service/
├── rez-circuit-breaker/
├── rez-retry-service/
├── rez-dlq-service/
├── rez-idempotency-service/
├── rez-policy-engine/
├── rez-ledger-service/
├── rez-audit-logging/
├── rez-observability-system/
├── REZ-notifications-hub/
├── rez-audit-service/
└── rez-contracts/
```
**Powers ALL companies with: Auth, Payment, Gateway, Analytics**

---

## 3. REZ-INTELLIGENCE (AI - THE MOAT)
```
REZ-Intelligence/
├── REZ-MIND-CLIENT/
├── REZ-support-copilot/
├── rez-consumer-copilot/
├── rez-intelligence-hub/
├── rez-intent-graph/
├── rez-intent-predictor/
├── REZ-error-intelligence/
├── REZ-ab-testing-service/
├── REZ-experimentation-engine/
├── REZ-personalization-engine/
├── REZ-recommendation-engine/
├── REZ-targeting-engine/
├── REZ-attribution-system/
├── REZ-action-engine/
├── REZ-creative-engine/
├── REZ-event-platform/
├── REZ-feature-flags/
├── REZ-insights-service/
├── REZ-reconciliation-service/
├── rez-ai-platform/
├── rez-ai-plugins/
├── rez-ai-voice/
├── rez-aggregator-hub/
├── rez-customer-360/
├── rez-cohort-service/
├── rez-ml-engine/
├── rez-ml-feature-store/
├── rez-ml-model-registry/
├── ML-MODELS/
└── REZ-copilot/
```
**Owns:** AI/ML, Personalization, Attribution, Copilots

---

## 4. REZ-MEDIA (ADS + LOYALTY)
```
REZ-Media/
├── adBazaar/
├── adsqr/
├── dooh/
├── creators/
├── adBazaar-creator/
├── REZ-ads-service/
├── REZ-gamification-service/
├── REZ-feedback-service/
├── REZ-lead-intelligence/
├── REZ-decision-service/
├── REZ-journey-service/
├── REZ-retention-service/
├── REZ-achievement-service/
├── REZ-streak-service/
├── REZ-coupon-service/
├── REZ-offer-service/
├── REZ-referral-service/
├── REZ-segmentation-service/
├── rez-ads/
├── rez-ad-campaigns/
├── rez-dooh-service/
├── REZ-media-events/
├── REZ-marketing-service/
├── REZ-marketing-backend/
├── REZ-ad-ai/
├── REZ-economic-engine/
├── REZ-automation-service/
├── REZ-marketing/
├── REZ-abandonment-tracker/
└── REZ-pricing-service/
```
**Owns:** AdBazaar, Gamification, Marketing, Leads

---

## 5. REZ-MERCHANT (MERCHANT + INDUSTRY OS)
```
REZ-Merchant/
├── REZ-dashboard/
├── rez-app-merchant/
├── rez-merchant-service/
├── rez-merchant-copilot/
├── rez-merchant-intelligence-service/
├── rez-merchant-integrations/
├── rez-barcode-scanner-ui/
├── rez-cross-merchant-service/
└── industry-os/
    ├── restaurant/
    │   ├── restauranthub/ (RestoPapa - 94 screens)
    │   ├── rez-restaurant-service/
    │   ├── rez-restaurant-admin-web/
    │   ├── rez-restaurant-pos-service/
    │   ├── rez-restaurant-analytics-service/
    │   ├── rez-restaurant-crm-service/
    │   ├── rez-restaurant-loyalty-service/
    │   ├── rez-restaurant-inventory-service/
    │   ├── rez-restaurant-reviews-service/
    │   ├── rez-mind-restaurant-service/
    │   ├── rez-ai-restaurant/
    │   └── rez-restaurant-qr-service/
    ├── hotel/
    │   ├── rez-hotel-service/
    │   ├── rez-hotel-admin-web/
    │   ├── rez-hotel-pos-service/
    │   └── rez-mind-hotel-service/
    ├── salon/
    │   ├── rez-salon-service/
    │   ├── rez-salon-admin-web/
    │   ├── rez-salon-pos-service/
    │   ├── rez-salon-crm-service/
    │   ├── rez-salon-membership-service/
    │   ├── rez-salon-inventory-service/
    │   ├── rez-salon-qr-service/
    │   ├── rez-salon-whatsapp-service/
    │   └── rez-mind-salon-service/
    └── fitness/
        ├── rez-fitness-pos-service/
        ├── rez-ai-salon-fitness/
        └── rez-fitness-membership-service/
```
**Owns:** Merchant dashboard, ALL Industry verticals (Restaurant, Hotel, Salon, Fitness)

---

## 6. REZ-CONSUMER (CONSUMER APPS)
```
REZ-Consumer/
├── rez-app-consumer/
├── do-app/
├── rendez-app/
├── rez-now/
├── rez-web-menu/
├── rez-driver-app/
├── dooh-screen-app/
├── dooh-mobile/
├── rez-karma-app/
├── rez-karma-mobile/
└── REZ-customer-platform/
```
**Owns:** Consumer apps, Driver app, Karma/Giving

---

## 7. STAYOWN-HOSPITALITY (HOTELS + LIVING)
```
StayOwn-Hospitality/
├── Hotel-OTA/
├── Hotel OTA/
├── rez-stayown-service/
├── verify-service/
├── rez-habixo-service/
└── rez-channel-manager-service/
```
**Owns:** Hotel OTA, Habixo, Room QR, Verify

---

## 8. CORPPERKS (ENTERPRISE + SAAS)
```
CorpPerks/
├── CorpPerks/ (Employee benefits platform)
├── nextabizz/ (B2B procurement)
├── CorpPerks-landing/
├── rez-corporate-service/
├── rez-corpperks-service/
└── sdk/
```
**Owns:** Employee benefits, B2B procurement

---

## GITHUB REPOS

| Company | GitHub |
|---------|--------|
| RTNM-Group | imrejaul007/RTNM-Group |
| RABTUL-Technologies | imrejaul007/RABTUL-Technologies |
| REZ-Intelligence | imrejaul007/REZ-Intelligence |
| REZ-Media | imrejaul007/REZ-Media |
| REZ-Merchant | imrejaul007/REZ-Merchant |
| REZ-Consumer | imrejaul007/REZ-Consumer |
| StayOwn-Hospitality | imrejaul007/StayOwn-Hospitality |
| CorpPerks | imrejaul007/CorpPerks |

---

## DEPENDENCY FLOW

```
RTNM GROUP (Controls)
    │
    ├── RABTUL (Infra: Auth, Payment, Gateway)
    │
    ├── REZ Intelligence (AI: Mind, Intent, ML)
    │
    ├── REZ Media (Ads, Marketing, Loyalty)
    │
    └── REZ Merchant (Merchant, Industry OS)
            │
            ├── Restaurant (RestoPapa)
            ├── Hotel
            ├── Salon
            └── Fitness
```
