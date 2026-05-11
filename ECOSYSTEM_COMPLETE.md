# REZ ECOSYSTEM - COMPLETE INVENTORY

**Date:** May 10, 2026  
**Version:** 2.0

---

## VERIFIED SERVICES (205+)

### CORE SERVICES (25+)

| Service | Port | Git Path | Purpose |
|---------|------|----------|---------|
| Auth Service | 4002 | `rez-auth-service` | JWT, OTP, OAuth |
| Payment Service | 4001 | `rez-payment-service` | Razorpay, Stripe, UPI |
| Wallet Service | 4004 | `rez-wallet-service` | Coins, BNPL |
| Order Service | 3006 | `rez-order-service` | Order lifecycle |
| Merchant Service | 4005 | `rez-merchant-service` | Business management |
| Profile Service | 3000 | `rez-profile-service` | User profiles |
| Catalog Service | 3005 | `rez-catalog-service` | Products, menus |
| Notification Service | 4011 | `rez-notifications-service` | Push, SMS, Email |
| Delivery Service | - | `rez-delivery-service` | Driver management |
| Search Service | 4003 | `rez-search-service` | Full-text search |
| Ads Service | 4007 | `rez-ads-service` | Ad management |
| API Gateway | 4000 | `api-gateway` | Routing, rate limiting |
| Billing Service | - | `rez-billing-service` | Invoicing |
| BNPL Service | - | `rez-bnpl-service` | Buy now pay later |
| Booking Service | - | `rez-booking-service` | Reservations |
| Channel Manager | - | `rez-channel-manager-service` | Multi-channel sync |
| Analytics Service | - | `rez-analytics-service` | Dashboards |
| Insights Service | - | `rez-insights-service` | Business intelligence |
| Scheduler Service | - | `rez-scheduler-service` | Cron jobs |
| Ab Testing Service | - | `rez-ab-testing-service` | A/B tests |
| Fraud Detection | 4009 | `rez-fraud-detection-service` | ML fraud scoring |
| Consent Service | - | `rez-consent-service` | GDPR compliance |
| Currency Service | - | `rez-currency-service` | Multi-currency |
| Cohort Service | - | `rez-cohort-service` | User cohorts |
| Corporate Service | - | `rez-corporate-service` | B2B features |
| Cross Merchant | - | `rez-cross-merchant-service` | Inter-merchant features |
| Contracts | - | `rez-contracts` | Legal agreements |
| Copilot | - | `rez-copilot` | AI assistant |
| Customer 360 | - | `rez-customer-360` | Unified customer view |
| Decision Service | - | `rez-decision-service` | Business rules |

---

## VERIFY SERVICE (Product Authenticity)

| Component | Path | Purpose |
|-----------|------|---------|
| **Verify Service** | `verify-service/` | Product serial verification |
| Serial Validator | `verify-service/src/lib/serial/validator.ts` | Validate product serials |
| Fraud Engine | `verify-service/src/lib/fraud/engine.ts` | Real-time fraud scoring |
| Ownership Tracker | `verify-service/src/lib/ownership/tracker.ts` | Track product ownership |
| Rewards Issuer | `verify-service/src/lib/rewards/issuer.ts` | Issue verification rewards |
| Karma Integration | `verify-service/src/lib/karma/` | Karma system integration |
| Mind Integration | `verify-service/src/lib/mind/` | AI verification insights |

### Verify QR Flow
```
1. Scan QR → 2. Enter serial → 3. Verify authentic → 4. Issue karma rewards → 5. Record ownership
```

---

## FRAUD DETECTION SERVICE (Credit Scoring)

| Feature | Path | Purpose |
|---------|------|---------|
| **Fraud Detection** | `rez-fraud-detection-service/` | ML-powered fraud checking |
| Risk Levels | 0-29: Low, 30-59: Medium, 60-79: High, 80-100: Critical |
| ML Model | Real-time scoring with rule-based fallback |
| Batch Processing | BullMQ async processing |
| Redis Caching | Fast fraud result caching |

### Fraud Check Types
| Type | Purpose |
|------|---------|
| Order | Order fraud patterns |
| Payment | Payment fraud detection |
| Account | Account takeover prevention |

---

## INDUSTRIES SUPPORTED (6 Verticals)

### 1. RETAIL

| Service | Path | Features |
|---------|------|----------|
| Catalog Service | `rez-catalog-service/` | Product management |
| POS Integration | - | Point of sale |
| Inventory | - | Stock management |
| Pricing | - | Dynamic pricing |

**Subcategories:**
- Clothing & Apparel
- Electronics
- Home & Garden
- Books & Media
- Sports & Outdoors
- Toys & Games
- Health & Beauty
- Grocery & Food

---

### 2. FOOD & BEVERAGE

| Service | Path | Features |
|---------|------|----------|
| ReZ Now | `rez-now/` | QR ordering |
| Web Menu | `rez-web-menu/` | Digital menus |
| Kitchen Display | - | KDS system |
| POS | - | Billing system |
| Delivery | `rez-delivery-service/` | Order fulfillment |
| Analytics | `rez-analytics-service/` | Sales data |

**Subcategories:**
- Restaurant
- Cafe
- Bakery
- Fast Food
- Cloud Kitchen
- Bar & Pub
- Food Truck
- Catering

---

### 3. SERVICES

| Service | Path | Features |
|---------|------|----------|
| Salon Fitness | `rez-ai-salon-fitness/` | Industry AI |
| Booking | `rez-booking-service/` | Appointments |

**Subcategories:**
- Salon & Spa
- Fitness & Gym
- Professional Services
- Home Services
- Education & Training
- Healthcare
- Automotive
- Repair Services

---

### 4. HOSPITALITY

| Service | Path | Features |
|---------|------|----------|
| Hotel OTA | `Hotel-OTA/` | Booking engine |
| Hotel Service | `rez-hotel-service/` | Property management |
| Hotel Admin | `rez-hotel-admin-web/` | Admin panel |
| Stay Own | `rez-habixo-service/` | Home rentals |
| Delivery | `rez-delivery-service/` | Room service |

**Subcategories:**
- Hotel
- Resort
- Guest House
- Homestay
- Vacation Rental
- Service Apartments

---

### 5. ENTERTAINMENT

| Service | Path | Features |
|---------|------|----------|
| Cinema Theater | - | Ticket booking |
| Gaming Zone | - | Arcade management |
| Event Planning | - | Event services |
| Photography | - | Studio management |
| Music & Arts | - | Creative services |

**Subcategories:**
- Cinema & Theater
- Gaming Zone
- Amusement Park
- Event Planning
- Photography
- Music & Arts

---

### 6. ADVERTISING

| Service | Path | Features |
|---------|------|----------|
| AdBazaar | `adBazaar/` | Ad marketplace |
| AdsQR | `adsqr/` | QR campaigns |
| DOOH | `dooh/` | Digital screens |
| Creator App | `creators/` | Influencer platform |
| Ad Campaigns | `rez-ad-campaigns/` | Campaign management |
| Creative Engine | `REZ-creative-engine/` | Ad creatives |

**Ad Types:**
- Outdoor OOH
- Transit
- Property
- Local Business
- Print
- Influencer
- Digital
- Unconventional

---

## BUSINESS TYPES SUPPORTED

| Type | Label | Description |
|------|-------|-------------|
| `sole_proprietor` | Sole Proprietorship | One person business |
| `partnership` | Partnership | Multiple owners |
| `pvt_ltd` | Private Limited | Separate legal entity |
| `llp` | Limited Liability Partnership | Hybrid structure |
| `other` | Other | Miscellaneous |

---

## CONSUMER APPS (5)

| App | Platform | Git Path | Screens |
|-----|----------|----------|---------|
| ReZ App | React Native | `rez-app-consumer/` | 235+ |
| DO App | React Native | `do-app/` | ? |
| Rendez | React Native | `rendez-app/` | Social commerce |
| Karma | React Native | `rez-karma-app/` | NGO/giving |
| Habixo | React Native | - | Home services |

---

## MERCHANT APPS (4+)

| App | Platform | Git Path | Industry |
|-----|----------|----------|---------|
| Merchant App | React Native | `rez-app-merchant/` | All verticals |
| NexaBizz | React Native | `nexabizz/` | B2B marketplace |
| AdBazaar Creator | React Native | `adBazaar-creator/` | Advertising |
| Restaurant Hub | Next.js | `Resturistan App/` | Food & Beverage |

---

## ADMIN DASHBOARDS (5)

| Dashboard | Platform | Git Path |
|-----------|----------|----------|
| REZ Admin | Next.js | `rez-app-admin/` |
| REZ Dashboard | Next.js | `REZ-dashboard/` |
| REE Dashboard | HTML | `REE-Dashboard/` |
| REE Admin | HTML | `REE-Admin/` |
| Hotel Admin | React | `Hotel OTA/apps/admin/` |
| Loyalty Admin | Next.js | `rez-loyalty-admin/` |

---

## AI/ML SERVICES (20+)

| Service | Path | Purpose |
|---------|------|---------|
| REZ Mind | `REZ-support-copilot/` | LLM orchestration |
| Intent Graph | `rez-intent-graph/` | User behavior tracking |
| Intent Predictor | `rez-intent-predictor/` | ML predictions |
| Decision Service | `rez-decision-service/` | Business rules |
| AI Platform | `rez-ai-platform/` | ML pipelines |
| AI Plugins | `rez-ai-plugins/` | AI integrations |
| Consumer Copilot | `rez-consumer-copilot/` | User AI assistant |
| Merchant Copilot | `rez-merchant-copilot/` | Business AI |
| Restaurant AI | `rez-ai-restaurant/` | Restaurant ML |
| Salon Fitness AI | `rez-ai-salon-fitness/` | Wellness ML |
| Voice AI | `rez-ai-voice/` | Voice interfaces |
| Ad AI | `rez-ad-ai/` | Ad optimization |
| ML Engine | `rez-ml-engine/` | ML infrastructure |
| Feature Store | `rez-ml-feature-store/` | Feature engineering |
| Model Registry | `rez-ml-model-registry/` | Version control |
| Training Data | `rez-training-data-service/` | Data pipelines |
| Fraud Detection | `rez-fraud-detection/` | Risk scoring |

---

## FINANCE PRODUCTS

| Product | Service | Status |
|---------|---------|--------|
| Wallet | `rez-wallet-service/` | ✅ Active |
| BNPL | `rez-bnpl-service/` | ✅ Active |
| Credit Score | `rez-fraud-detection-service/` | ✅ Active |
| Micro-credit | - | Planned |
| SME Loans | - | Planned |
| Insurance | - | Planned |
| Investments | - | Planned |
| Remittance | - | Planned |

---

## REWARDS & LOYALTY

| System | Service | Features |
|---------|---------|----------|
| ReZ Coins | `rez-wallet-service/` | Universal ecosystem coins |
| Branded Coins | `rez-gamification-service/` | Merchant-specific loyalty |
| Cashback | - | Merchant-funded rewards |
| Visit Rewards | `rez-gamification-service/` | Tiered loyalty |
| Referral Rewards | - | Viral growth |
| Streak Rewards | - | Engagement |
| Campaign Rewards | - | Promotions |

---

## CAMPAIGN TYPES

| Campaign | Features |
|-----------|----------|
| Sales Campaigns | Discounts, offers |
| Awareness Campaigns | Brand building |
| NGO Campaigns | Social impact |
| Referral Campaigns | Word of mouth |
| Streak Campaigns | Daily engagement |
| Festival Campaigns | Seasonal promotions |
| Influencer Campaigns | Creator partnerships |
| Couple Campaigns | D2C marketing |

---

## QR ECOSYSTEM

| QR Type | Service | Purpose |
|---------|---------|---------|
| Menu QR | `rez-web-menu/` | Digital menus |
| Now QR | `rez-now/` | Instant ordering |
| Room QR | `verify-service/` | Hotel room service |
| Verify QR | `verify-service/` | Product authenticity |
| AdQR | `adsqr/` | Interactive ads |
| Creator QR | `creators/` | Influencer tracking |
| Pay QR | `rez-payment-service/` | Payment links |

---

## LIVE URLS

### Vercel
- rez-now.vercel.app
- rez-admin.vercel.app

### Render
- rez-auth-service.onrender.com
- rez-payment-service.onrender.com
- rez-wallet-service.onrender.com
- rez-order-service.onrender.com
- verify-service.onrender.com

---

## DEPLOYMENT STATUS

| Service | Docker | K8s | Serverless |
|---------|---------|------|------------|
| Core APIs | ✅ | ✅ | ✅ |
| Frontend Apps | ✅ | ✅ | ✅ |
| AI Services | ✅ | ✅ | Partial |
| Verify Service | ✅ | ✅ | ✅ |

---

**Last Updated:** May 10, 2026
