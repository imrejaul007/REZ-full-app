# CORPORATE REPO STRUCTURE

**Date:** May 11, 2026  
**Version:** 1.0

---

## 6 COMPANIES + RESPONSIBILITIES

### Company 1: REZ Commerce Technologies
**Purpose:** Consumer + Merchant commerce

| Product | Git Repo |
|---------|----------|
| Consumer App | rez-app-consumer |
| Merchant App | rez-app-merchant |
| DO App | do-app |
| Rendez | rendez-app |
| ReZ Now | rez-now |
| Web Menu | rez-web-menu |

---

### Company 2: REZ Intelligence Labs (THE MOAT)
**Purpose:** AI/ML that powers ALL companies

| Product | Git Repo |
|---------|----------|
| REZ Mind | rez-intelligence-hub |
| Intent Graph | rez-intent-graph |
| ML Engine | rez-ml-engine |
| Personalization | rez-personalization-engine |
| Recommendation | rez-recommendation-engine |
| Copilot (Consumer) | rez-consumer-copilot |
| Copilot (Merchant) | rez-merchant-copilot |
| Copilot (Support) | REZ-support-copilot |
| User Intelligence | rez-user-intelligence |
| Attribution | REZ-attribution-system |

---

### Company 3: RABTUL Technologies
**Purpose:** "Internal AWS + Stripe" - Shared infrastructure for ALL companies

| Product | Git Repo |
|---------|----------|
| API Gateway | rez-api-gateway |
| Auth Service | rez-auth-service |
| Payment Service | rez-payment-service |
| Wallet Service | rez-wallet-service |
| Profile Service | rez-profile-service |
| Search Service | rez-search-service |
| Notifications | rez-notifications-service |
| Order Service | rez-order-service |
| Catalog Service | rez-catalog-service |
| Booking Service | rez-booking-service |
| Delivery Service | rez-delivery-service |
| Gamification | rez-gamification-service |
| Analytics | rez-analytics-service |
| Insights | rez-insights-service |
| Scheduler | rez-scheduler-service |
| Circuit Breaker | REZ-circuit-breaker |
| Retry Service | REZ-retry-service |
| DLQ Service | REZ-dlq-service |
| Idempotency | REZ-idempotency-service |

---

### Company 4: REZ Media Network
**Purpose:** Advertising + Loyalty

| Product | Git Repo |
|---------|----------|
| AdBazaar | adBazaar |
| AdSQR | adsqr |
| DOOH | dooh |
| Creator App | creators |
| Ads Service | rez-ads-service |
| Targeting Engine | REZ-targeting-engine |
| Abandonment Tracker | rez-abandonment-tracker |
| Lead Intelligence | rez-lead-intelligence |
| Decision Service | rez-decision-service |
| REE Dashboard | REE-dashboard |
| REE Admin | REE-admin |

---

### Company 5: StayOwn Hospitality
**Purpose:** Hotels + Smart Living

| Product | Git Repo |
|---------|----------|
| Hotel OTA | Hotel-OTA |
| Hotel Service | rez-hotel-service |
| StayOwn Service | rez-stayown-service |
| Habixo Service | rez-habixo-service |
| Channel Manager | rez-channel-manager-service |
| Room QR | verify-service |
| Verify QR | verify-service |

---

### Company 6: CorpPerks
**Purpose:** Enterprise + Restaurant SaaS

| Product | Git Repo |
|---------|----------|
| CorpPerks | CorpPerks |
| NextaBizz | nextabizz |
| Resturistan | Resturistan App |
| POS | rez-pos-service |
| KDS | rez-kds-service |
| Kitchen AI | rez-kitchen-ai |
| Menu Service | rez-menu-service |

---

## PROPOSED REPO STRUCTURE

### 1. REZ-Commerce
```
REZ-Commerce/
├── rez-app-consumer
├── rez-app-merchant
├── do-app
├── rendez-app
├── rez-now
└── rez-web-menu
```

### 2. REZ-Intelligence
```
REZ-Intelligence/
├── rez-intelligence-hub
├── rez-intent-graph
├── rez-ml-engine
├── rez-personalization-engine
├── rez-recommendation-engine
├── rez-consumer-copilot
├── rez-merchant-copilot
├── REZ-support-copilot
├── rez-user-intelligence
└── REZ-attribution-system
```

### 3. Rabtul-Platform
```
Rabtul-Platform/
├── rez-api-gateway
├── rez-auth-service
├── rez-payment-service
├── rez-wallet-service
├── rez-profile-service
├── rez-search-service
├── rez-notifications-service
├── rez-order-service
├── rez-catalog-service
├── rez-booking-service
├── rez-delivery-service
├── rez-gamification-service
├── rez-analytics-service
├── rez-insights-service
├── rez-scheduler-service
├── REZ-circuit-breaker
├── REZ-retry-service
├── REZ-dlq-service
└── REZ-idempotency-service
```

### 4. REZ-Media
```
REZ-Media/
├── adBazaar
├── adsqr
├── dooh
├── creators
├── rez-ads-service
├── REZ-targeting-engine
├── rez-abandonment-tracker
├── rez-lead-intelligence
├── rez-decision-service
├── REE-dashboard
└── REE-admin
```

### 5. StayOwn-Hospitality
```
StayOwn-Hospitality/
├── Hotel-OTA
├── rez-hotel-service
├── rez-stayown-service
├── rez-habixo-service
├── rez-channel-manager-service
└── verify-service
```

### 6. CorpPerks-Platform
```
CorpPerks-Platform/
├── CorpPerks
├── nextabizz
├── Resturistan
├── rez-pos-service
├── rez-kds-service
├── rez-kitchen-ai
└── rez-menu-service
```

---

## GITHUB ORG STRUCTURE

```
imrejaul007/
├── REZ-Commerce
├── REZ-Intelligence
├── Rabtul-Platform
├── REZ-Media
├── StayOwn-Hospitality
├── CorpPerks-Platform
├── SOURCE-OF-TRUTH (docs)
└── [shared packages]
```

---

## SHARED PACKAGES

| Package | Used By |
|---------|---------|
| shared-types | All companies |
| rez-ai-bus | REZ-Intelligence, Rabtul |
| rez-client | REZ-Commerce, CorpPerks |

---

## MIGRATION STEPS

### 1. Create new org repos on GitHub
```bash
gh repo create REZ-Commerce --org imrejaul007
gh repo create REZ-Intelligence --org imrejaul007
gh repo create Rabtul-Platform --org imrejaul007
# etc.
```

### 2. Migrate services
```bash
# For each service:
cd rez-auth-service
git remote set-url origin https://github.com/imrejaul007/Rabtul-Platform.git
git push origin main --force
```

### 3. Update local folders
```bash
mkdir -p REZ-Commerce
mkdir -p REZ-Intelligence
mkdir -p Rabtul-Platform
# Move folders
```

---

## STARTING WITH COMPANY 3 (Rabtul-Platform)

Services that ALL other companies use:
- Auth
- Payment
- Wallet
- Profile
- Search
- Notifications
- Order
- Catalog
- Gamification
- Analytics
- Infrastructure (circuit breaker, retry, dlq)

**Shall I start migrating Rabtul-Platform first?**