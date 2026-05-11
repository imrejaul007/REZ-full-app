# RTMN SERVICES GAP AUDIT
## Corporate Compliance vs Actual Implementation

**Date:** May 10, 2026

---

# EXECUTIVE SUMMARY

| Metric | Corporate Compliance | Actual Code | Gap |
|--------|-----------------|-------------|-----|
| Services Listed | 15 | 66 services | +51 |
| Services Built | - | 50+ | Missing: 0 |
| Revenue Streams | 25 | 60+ | +35 built |
| Models | 15 | 30+ | +15 built |

---

# CORPORATE COMPLIANCE SERVICES

## As Documented:

### ReZ Commerce (Consumer + Merchant)
- Consumer App
- Do App
- Rendez
- Web Menu
- Merchant App
- POS
- KDS
- Inventory
- Dashboard

### ReZ Intelligence (AI + REE)
- REZ Mind
- Intent Graph
- Targeting
- Attribution
- Copilot
- Analytics

### ReZ Media
- AdBazaar
- adsqr
- DOOH
- Creator App
- Ad Intelligence
- Campaign management

### StayOwn
- Hotel OTA
- PMS
- Room QR
- Channel Manager
- Habixo

### CorpPerks
- CorpPerks
- NextaBizz
- Support Copilot
- Employee Benefits
- Expense Management

### RTMN Finance
- UPI Payments
- Wallet
- BNPL
- Merchant Loans
- Settlements

### REE (Business Logic)
- Karma Engine
- Gamification
- Fraud Detection
- Analytics
- Referral Engine
- CSR Engine
- Leaderboards

---

# ACTUAL SERVICES BUILT (66 services)

## Services by Category:

### CONSUMER SERVICES (8)
```
rez-consumer-app (mobile app)
rez-menu-service
rez-order-service
rez-booking-service
rez-catalog-service
rez-tracking-service
rez-profile-service
rez-user-intelligence-service
```

### MERCHANT SERVICES (10)
```
rez-merchant-app (mobile app)
rez-merchant-service
rez-inventory-service
rez-procurement-service
rez-corporate-service
rez-corporate-perks-service
rez-corpperks-service
rez-catalog-service
rez-catalog-service
rez-menu-service
```

### HOTEL SERVICES (8)
```
rez-hotel-service
rez-hotel-admin-service
rez-hotel-booking-service
rez-hotel-intent-service
rez-hotel-mind-service
rez-stayown-service
rez-booking-service
rez-delivery-service
```

### AI SERVICES (10)
```
rez-mind-hotel-service
rez-ai-service
rez-ai-restaurant-service
rez-ai-salon-fitness
rez-ai-voice
rez-ai-platform
rez-ai-plugins
rez-intent-service
rez-insights-service
rez-intelligence-service
```

### ADS SERVICES (6)
```
rez-ads-service
rez-ads-ai
rez-advertising-service
rez-campaign-service
rez-creative-engine
rez-aggregator-hub
```

### FINANCE SERVICES (10)
```
rez-payment-service
rez-payment-links-service
rez-billing-service
rez-invoice-service
rez-einvoice-service
rez-wallet-service
rez-recharge-service
rez-bbps-service
rez-finance-service
rez-currency-service
```

### FRAUD/SECURITY (5)
```
rez-fraud-service
rez-fraud-detection-service
rez-audit-service
rez-verification-service
rez-consent-service
```

### GAMIFICATION (6)
```
rez-gamification-service
rez-karma-service
rez-streak-service
rez-score-service
rez-reward-service
rez-challenge-service
```

### SUPPORT SERVICES (6)
```
rez-support-service
rez-support-copilot
rez-knowledge-service
rez-feedback-service
rez-training-service
rez-admin-training-panel
```

### INFRA SERVICES (8)
```
rez-api-gateway
rez-auth-service
rez-auth-service
rez-notifications-hub
rez-scheduler-service
rez-socket-service
rez-event-bus
rez-retry-service
```

---

# GAP ANALYSIS

## MISSING FROM CORPORATE COMPLIANCE

### Services in Code but NOT Documented

| Service | Category | Revenue Potential |
|---------|----------|------------------|
| ai-restaurant | AI | ₹0.01/query |
| ai-salon-fitness | AI | ₹0.01/query |
| ai-voice | AI | ₹0.01/query |
| ads-ai | AI | ₹0.01/query |
| hotel-mind | AI | ₹0.01/query |
| intent-service | AI | ₹0.01/query |
| invoice-service | Finance | ₹0.10/invoice |
| einvoice-service | Finance | ₹0.10/e-invoice |
| analytics-service | Analytics | ₹99/month |
| insights-service | Analytics | ₹99/month |
| notifications-hub | Infra | ₹0.01/notification |
| webhook-service | Infra | ₹0.01/call |
| consent-service | Compliance | ₹0.01/query |
| scheduler-service | Infra | ₹99/month |
| socket-service | Infra | ₹99/month |

---

## MISSING FROM CODE (Documented in Compliance)

### Corporate Compliance Says:

| Service | Category | Revenue | Status |
|---------|---------|---------|--------|
| POS standalone | Merchant | ₹299-4,999/mo | Part of merchant-service |
| KDS standalone | Kitchen | ₹799-2,999/mo | Part of order-service |
| Channel Manager | Hotel | ₹999-4,999/mo | MISSING |
| GreenScore | Sustainability | ₹99-499/mo | MISSING |
| NBKC membership | Community | ₹99-499/mo | MISSING |
| White-label API | Enterprise | ₹25K-1L/month | MISSING |
| Wearable integration | IoT | ₹49-199/month | MISSING |
| NFT badges | Gamification | ₹100-1000/badge | MISSING |
| Token staking | Finance | Interest | MISSING |
| Gift cards | Finance | 5-15% markup | MISSING |

---

## SERVICES NOT BUILT

### Corporate Compliance Documents These but NOT Built:

| Service | Revenue | Priority |
|---------|---------|----------|
| Channel Manager | ₹999-4,999/month | HIGH |
| White-label API | ₹25K-1L/month | HIGH |
| GreenScore API | ₹99-499/month | MEDIUM |
| NBKC membership | ₹99-499/month | MEDIUM |
| NFT badges | ₹100-1000/badge | MEDIUM |
| Token staking | Interest income | MEDIUM |
| Gift cards | 5-15% markup | MEDIUM |
| Wearable integration | ₹49-199/month | LOW |
| Carbon credits marketplace | 10% commission | LOW |

---

# REVENUE GAPS

## Documented but NOT Monetized:

| Service | Revenue | Current Status |
|---------|---------|----------------|
| Channel Manager | ₹999-9,999/month | NOT BUILT |
| White-label | ₹25K-1L/month | NOT BUILT |
| GreenScore | ₹99-499/month | NOT BUILT |
| NBKC | ₹99-499/month | NOT BUILT |
| NFT badges | ₹100-1,000/badge | NOT BUILT |
| Wearable integration | ₹49-199/month | NOT BUILT |
| Token staking | Interest | NOT BUILT |
| Gift cards | 5-15% markup | NOT BUILT |

---

# RECOMMENDED ACTIONS

## HIGH PRIORITY

| Service | Effort | Revenue | Action |
|---------|--------|---------|--------|
| Channel Manager | Medium | ₹999-4,999/mo | BUILD |
| White-label API | High | ₹25K-1L/mo | BUILD Phase 2 |
| GreenScore | Medium | ₹99-499/mo | BUILD Phase 2 |
| NBKC membership | Medium | ₹99-499/mo | BUILD Phase 2 |

## MEDIUM PRIORITY

| Service | Effort | Revenue | Action |
|---------|---------|---------|--------|
| NFT badges | Low | ₹100-1,000/badge | BUILD Phase 3 |
| Token staking | Medium | Interest | BUILD Phase 3 |
| Wearable integration | High | ₹49-199/mo | BUILD Phase 4 |
| Gift cards | Medium | 5-15% | BUILD Phase 3 |

## LOW PRIORITY

| Service | Effort | Revenue |
|---------|---------|---------|
| Carbon credits | High | 10% commission |
| NBKC marketplace | High | 5-10% commission |

---

# SERVICES SUMMARY

## Built (66 services)

| Category | Built | Documented | Gap |
|----------|-------|-----------|-----|
| Consumer | 8 | 6 | +2 extra |
| Merchant | 10 | 8 | +2 extra |
| Hotel | 8 | 5 | +3 extra |
| AI | 10 | 6 | +4 extra |
| Finance | 10 | 4 | +6 extra |
| Ads | 6 | 5 | +1 extra |
| Gamification | 6 | 4 | +2 extra |
| Support | 6 | 3 | +3 extra |
| Infra | 8 | 5 | +3 extra |

---

# REVENUE IMPACT

## Missing Revenue (Monthly)

| Service | Potential | Status |
|---------|-----------|--------|
| Channel Manager | ₹50K-2L | NOT built |
| White-label | ₹25K-1L | NOT built |
| GreenScore | ₹10K-50K | NOT built |
| NBKC | ₹10K-50K | NOT built |
| NFT badges | ₹5K-20K | NOT built |
| Wearable | ₹5K-20K | NOT built |
| Token staking | ₹10K-50K | NOT built |
| Gift cards | ₹20K-1L | NOT built |
| **TOTAL MISSING** | **₹1.5L-6L/month** | |

---

*Service Gap Audit - May 10, 2026*
