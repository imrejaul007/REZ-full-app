# ReZ Restaurant Technology Market Research - India 2024-2025

**Document Version:** 1.0
**Date:** May 8, 2026
**Market Focus:** India
**Research Period:** 2024-2025

---

## Executive Summary

The Indian restaurant technology market is experiencing rapid transformation, driven by:
- **Ghost kitchens** growing at 15.6% CAGR (projected to reach Rs 9,500 crore by 2025)
- **Cloud POS** market expanding to USD 30.81 billion by 2032
- **QR ordering** becoming a baseline expectation in urban India
- **Aggregator commissions** of 20-30% creating pressure for direct channel adoption

ReZ is well-positioned to capitalize on these trends with its existing multi-channel ordering, payment processing, and merchant intelligence capabilities. Key opportunities exist in ghost kitchen management, aggregator diversification, and franchise operations.

---

## 1. Ghost Kitchens

### Market Overview

| Metric | Value |
|--------|-------|
| India Market (2023) | USD 552 Million |
| India Market (2025) | USD 740.2 Million (projected) |
| India Market (2030) | USD 1,523 Million (projected) |
| CAGR (India) | 15.6% through 2030 |
| Global CAGR | 12.6% through 2030 |

### Key Drivers

1. **Lower operational costs** - No front-of-house, reduced real estate expenses
2. **Multi-brand operations** - Single kitchen serving multiple virtual brands
3. **Rising delivery demand** - Swiggy/Zomato infrastructure enabling growth
4. **Urban lifestyle shifts** - Convenience-focused consumers
5. **Post-pandemic acceleration** - Permanent shift to online food ordering

### Challenges

- **High aggregator dependency** - 20-30% commission eat into margins
- **Brand differentiation** - Hard to build identity without dine-in presence
- **Quality control** - Managing multiple brands from one kitchen
- **Platform risk** -algorithmic ranking changes can devastate orders

### ReZ Opportunity

**Assessment:** HIGH OPPORTUNITY

ReZ's existing infrastructure can address ghost kitchen needs through:

| Feature | ReZ Capability | Gap Analysis |
|---------|---------------|---------------|
| Multi-brand menu management | `rez-catalog-service` | Supports multiple menus |
| Centralized ordering | `rez-order-service` | Unified order processing |
| Kitchen display integration | `rez-staff-web` | Tablet-based KDS exists |
| Real-time analytics | `rez-insights-service` | Performance tracking |
| Cost optimization | Not explicit | **Gap: Profitability dashboards** |

**Recommended Action:**
- Build ghost kitchen dashboard showing per-brand P&L
- Add virtual brand management to catalog
- Create kitchen efficiency metrics (orders/hour, avg prep time)

---

## 2. Cloud POS

### Market Overview

| Metric | Value |
|--------|-------|
| India POS Market (2032) | USD 30.81 billion (projected) |
| Global Cloud POS (2034) | USD 30.04 billion at 18.52% CAGR |

### Cloud POS Adoption Drivers in India

1. **Lower upfront costs** - Subscription vs. one-time license
2. **Real-time multi-location visibility** - Centralized monitoring
3. **Automatic updates** - Always current with regulatory compliance
4. **GST integration** - Native compliance built-in
5. **Remote troubleshooting** - Reduced support costs

### Key Features Valued in India

| Feature | Priority | Notes |
|---------|----------|-------|
| Android-based interface | Critical | Tablet/mobile-first |
| Offline mode | Critical | Internet variability in Metro cities |
| UPI/payment integration | Critical | Dominant payment method |
| GST-compliant invoicing | High | Regulatory requirement |
| Multi-language support | Medium | Regional language needs |
| Kitchen display sync | High | Operational efficiency |

### ReZ Opportunity

**Assessment:** MODERATE OPPORTUNITY (Existing Strength)

ReZ already has POS capabilities via `rez-staff-web` and `rez-app-merchant`. Key areas for enhancement:

| Enhancement | Priority | Complexity |
|-------------|----------|------------|
| Offline-first mode | Critical | High |
| Hardware integration (printers, cash drawers) | Medium | Medium |
| Split-bill functionality | High | Medium |
| Table-side payment | High | Medium |
| Multi-terminal sync | High | Low |

**Recommended Action:**
- Add offline mode with local storage and sync
- Partner with POS hardware vendors (Azhpo, Posiflex, Ingenico)
- Build table management module

---

## 3. QR Ordering

### Market Overview

QR code ordering has moved from **trend to baseline expectation** in urban India:
- **2020-2022:** Pandemic-driven adoption
- **2023-2024:** Standard feature in QSR and casual dining
- **2025+:** Competitive necessity, no longer a differentiator

### Customer Benefits

| Benefit | Impact |
|---------|--------|
| No app download | Lower friction, broader adoption |
| Instant menu updates | Price changes, daily specials |
| Contactless dining | Post-pandemic hygiene awareness |
| Direct payment | UPI integration at table |
| Faster service | No waiting for waiter |

### Restaurant Benefits

| Benefit | Quantified Impact |
|---------|------------------|
| Reduced waiter dependency | 20-30% labor cost reduction |
| Higher order accuracy | Digital vs. verbal communication |
| Upsell opportunities | Digital recommendations |
| Table turnover | +15-25% improvement |
| Menu printing costs | Eliminated |

### ReZ Opportunity

**Assessment:** STRONG EXISTING CAPABILITY

ReZ has `rez-web-menu` for web-based ordering. Enhancement opportunities:

| Feature | Status | Action |
|---------|--------|--------|
| QR code generation | Needs verification | Verify implementation |
| Payment integration | Via `rez-payment-service` | Confirm UPI support |
| Multi-language menu | Not explicit | Add regional languages |
| Personalized recommendations | Via `rez-recommendation-engine` | Integrate with menu |
| Dynamic pricing | Not explicit | Add time-based pricing |

**Recommended Action:**
- Conduct QR ordering feature audit in `rez-web-menu`
- Add multi-language support (Hindi, Tamil, Telugu, Bengali)
- Integrate AI recommendations from `rez-recommendation-engine`

---

## 4. Delivery Integrations

### Aggregator Landscape

| Platform | Market Share | Commission | Platform Fee |
|----------|-------------|------------|--------------|
| Swiggy | ~50% | 20-30% | Rs 17.58/order |
| Zomato | ~40% | 20-30% | Rs 14-19/order |
| Foodpanda | ~5% | 15-25% | Varies |
| Magicpin | ~3% | 10-20% | Varies |
| Direct Delivery | ~2% | 0% | Own logistics |

### Commission Economics

**Example: Rs 300 order**
- Commission (25%): Rs 75
- GST on commission (18%): Rs 13.50
- Platform fee: Rs 17.58
- **Total to platform:** Rs 106.08 (35.4%)
- **Restaurant receives:** Rs 193.92

### Restaurant Pain Points

1. **High commissions** - 25-35% effective rate
2. **Algorithmic visibility** - Ranking changes without notice
3. **Data ownership** - Customer data stays with platform
4. **Order surge volatility** - Cannot predict demand
5. **Integration complexity** - Multiple portals, reconciliation nightmares

### ReZ Opportunity

**Assessment:** HIGH OPPORTUNITY

| Feature | ReZ Capability | Opportunity |
|---------|---------------|--------------|
| Multi-aggregator sync | Not explicit | Build unified aggregator dashboard |
| Commission tracking | `rez-reconciliation-service` | Enhanced analytics |
| Order consolidation | `rez-order-service` | Centralize orders from all sources |
| Customer data ownership | `rez-profile-service` | Build first-party data |
| Direct ordering channel | `rez-web-menu` | Reduce aggregator dependency |

**Recommended Action:**
- Build **Aggregator Integration Hub** connecting to Swiggy/Zomato APIs
- Create commission comparison dashboard
- Develop **Direct Order First** strategy with incentives
- Implement customer data capture at delivery

---

## 5. Contactless Dining

### Post-Pandemic Standardization

Contactless dining expectations have normalized:
- **QR menu viewing:** Expected in 80%+ urban restaurants
- **Mobile payment:** Preferred over cash/card
- **Digital receipts:** Accepted by 60%+ customers
- **Self-service kiosks:** Growing in QSR segment

### Technology Stack Requirements

| Component | Technology | Notes |
|-----------|------------|-------|
| Menu display | Progressive Web App (PWA) | No app download |
| Ordering | Web-based with HTTPS | Secure transaction |
| Payment | UPI, wallets, cards | Multiple options |
| Kitchen communication | API-driven KDS | Real-time sync |
| Feedback | Digital surveys | Post-meal capture |

### ReZ Opportunity

**Assessment:** STRONG EXISTING CAPABILITY

ReZ's architecture supports contactless dining through:
- `rez-web-menu` for digital menus
- `rez-payment-service` for UPI/wallet integration
- `rez-staff-web` for kitchen display
- `rez-notifications-hub` for order updates

**Enhancement Recommendations:**
1. Add NFC tap-to-pay for table payments
2. Build digital feedback collection
3. Implement contactless check-split functionality
4. Add digital loyalty card to wallet

---

## 6. Franchise Models

### India Franchise Landscape

| Segment | Examples | Franchise Structure |
|---------|----------|--------------------|
| QSR | McDonald's, KFC, Domino's | Standardized operations |
| Casual Dining | Barbeque Nation, Haldiram's | Regional adaptation |
| Quick Service | Cafe Coffee Day, Chaayos | Brand + product mix |
| Cloud Kitchen | Rebel Foods, Fisash | Virtual brand licensing |

### Franchise Management Challenges

| Challenge | Impact | Solution Needed |
|-----------|--------|-----------------|
| Menu consistency | Brand reputation | Centralized catalog management |
| Pricing variation | Customer confusion | Location-based pricing rules |
| Quality standards | Operational risk | Audit and compliance tracking |
| Supply chain | Cost optimization | Multi-location procurement |
| Royalty tracking | Financial reconciliation | Automated royalty calculation |

### ReZ Opportunity

**Assessment:** MODERATE OPPORTUNITY

ReZ's multi-location capabilities via `rez-merchant-service` provide foundation. Required enhancements:

| Feature | Complexity | Priority |
|---------|------------|----------|
| Franchisee onboarding workflow | Medium | High |
| Royalty calculation engine | High | High |
| Menu localization by outlet | Low | Medium |
| Compliance checklist tracking | Medium | Medium |
| Franchise performance ranking | Low | Medium |

**Recommended Action:**
- Build franchise management module in merchant dashboard
- Add standardized vs. localized menu rules
- Create franchisee performance comparison

---

## 7. Multi-Location Support

### Market Context

Global Restaurant Inventory Management Software market: **USD 2,184.6 million (2024)**

### India-Specific Challenges

| Challenge | Description | ReZ Response |
|-----------|-------------|--------------|
| Fragmented suppliers | Local vendors per location | Supplier aggregation |
| GST complexity | Per-state tax variations | `rez-einvoice-service` |
| Staff turnover | High attrition, training gaps | Not addressed |
| Visibility | Real-time ops across locations | `rez-insights-service` |
| Menu standardization | Core menu + local variations | `rez-catalog-service` |

### Multi-Location Feature Requirements

| Feature | Priority | ReZ Status |
|---------|----------|------------|
| Centralized menu management | Critical | Available |
| Real-time inventory levels | Critical | Gap - needs verification |
| Location-specific pricing | High | Needs implementation |
| Aggregated analytics | High | `rez-insights-service` |
| Supplier performance comparison | Medium | Not explicit |
| Waste tracking per location | Medium | Not explicit |

### ReZ Opportunity

**Assessment:** MODERATE OPPORTUNITY (Foundation Exists)

**Critical Gap Analysis:**
- Real-time inventory across locations: **Unverified**
- Centralized purchasing/procurement: **Not explicit**
- Location profitability comparison: **Needs enhancement**

**Recommended Action:**
- Build multi-location dashboard in `rez-merchant-service`
- Add consolidated P&L by location
- Create supplier comparison reports

---

## 8. Aggregator Integrations (Swiggy, Zomato)

### Technical Integration Landscape

| Platform | API Status | Integration Complexity |
|----------|-----------|----------------------|
| Swiggy | Partner API available | Medium |
| Zomato | Partner API available | Medium |
| Foodpanda | Limited public API | High |
| Magicpin | Partner API | Medium |

### Available Integration Options

| Provider | Type | Use Case |
|----------|------|----------|
| Delivery Hero POS API | Official | POS order processing |
| FoodEnginePOS | Third-party | Multi-aggregator sync |
| Apify Swiggy Scraper | Scraping | Market research only |
| Custom integration | Build | Full control |

### Order Flow Integration

```
Aggregator Order → API → ReZ Order Service → Kitchen Display
                         ↓
                   Payment Processing
                         ↓
                   Customer Notification
                         ↓
                   Reconciliation Service
```

### ReZ Opportunity

**Assessment:** HIGH PRIORITY OPPORTUNITY

| Component | ReZ Capability | Implementation |
|-----------|---------------|----------------|
| Order ingestion | `rez-order-service` | Extend for aggregator format |
| Menu sync | `rez-catalog-service` | Bidirectional sync |
| Payment settlement | `rez-payment-service` | Already robust |
| Reconciliation | `rez-reconciliation-service` | Enhance with aggregator data |
| Customer notification | `rez-notifications-hub` | Already available |

**Recommended Action:**
1. **Phase 1:** Build Swiggy order ingestion (3-4 weeks)
2. **Phase 2:** Add Zomato integration (2-3 weeks)
3. **Phase 3:** Create unified aggregator dashboard (2 weeks)
4. **Phase 4:** Bidirectional menu sync (3 weeks)

---

## Strategic Recommendations for ReZ

### Priority Matrix

| Initiative | Impact | Effort | Priority |
|------------|--------|--------|----------|
| Aggregator Integration Hub | High | Medium | **P1** |
| Ghost Kitchen Dashboard | High | Medium | **P1** |
| Multi-location Analytics | High | Low | **P1** |
| Offline POS Mode | High | High | **P2** |
| Franchise Management | Medium | Medium | **P2** |
| QR Enhancement (multi-language) | Medium | Low | **P2** |
| Direct Order Channel Push | High | Medium | **P2** |
| NFC Tap-to-Pay | Medium | High | **P3** |

### 2024-2025 Roadmap

#### Q3 2024 (Immediate)
1. Build aggregator integration hub (Swiggy + Zomato)
2. Enhance multi-location dashboard
3. Add multi-language menu support

#### Q4 2024 (Short-term)
1. Launch ghost kitchen module
2. Add offline POS capability
3. Build franchise management features

#### 2025 (Medium-term)
1. NFC payment integration
2. Advanced AI recommendations for ordering
3. Predictive demand forecasting

---

## Competitive Landscape

### ReZ vs. Competitors

| Feature | ReZ | Category Leaders |
|---------|-----|-----------------|
| Multi-channel ordering | Strong | Similar to Petpooja, Torqus |
| Aggregator sync | Gap | Restaurant365, Packlane lead |
| Ghost kitchen mgmt | Gap | Rebel Foods proprietary |
| AI/ML capabilities | **Strong** | ReZ advantage |
| Price point | TBD | Lower than enterprise |

### ReZ Differentiation

1. **ReZ Mind AI** - Unique intelligence layer competitors lack
2. **Unified commerce** - Restaurant + Hotel + Retail convergence
3. **Developer ecosystem** - Microservices architecture for customization

---

## Conclusion

The Indian restaurant technology market presents significant opportunities for ReZ:

**Strengths to Leverage:**
- Existing multi-channel ordering infrastructure
- Strong payment processing capabilities
- AI/ML capabilities as differentiator
- Microservices architecture for flexibility

**Critical Gaps to Address:**
1. **Aggregator integration** - High demand, direct revenue impact
2. **Ghost kitchen module** - Fast-growing segment
3. **Multi-location analytics** - Essential for scale customers
4. **Offline POS mode** - India Metro requirement

**Market Timing:** Favorable - Market growing 15%+ CAGR, aggregators increasing commissions, restaurants seeking alternatives.

---

## Sources

- [GlobeNewswire - India Ghost Kitchen Market](https://www.globenewswire.com/news-release/2024/02/27/2835791/0/en/India-Dark-Kitchens-Ghost-Kitchens-Cloud-Kitchens-Market-Size-Share-Growth-Analysis-2030-With-CAGR-of-15-6.html)
- [Coherent Market Insights - India Cloud Kitchen](https://www.coherentmarketinsights.com)
- [Zenodo Research Paper - Ghost Kitchens in Urban India](https://zenodo.org/records/15679599/files/RISE%20OF%20GHOST%20KITCHENS%20IN%20URBAN%20INDIA..pdf)
- [Cognitive Market Research - Restaurant Inventory Management](https://www.cognitive market research.com)
- [SundayApp - QR Code Ordering Trends](https://sundayapp.com)
- [Supy.io - Multi-Location Inventory Management](https://supy.io/blog/multi-location-restaurant-inventory-management)
- [FoodEnginePOS - Aggregator Integration](https://foodenginepos.com/food-delivery-software.php)
- Reddit r/FoodEntrepreneurIndia - Commission Rates
- LinkedIn Market Analysis - Restaurant Technology India

---

**Document prepared for:** ReZ Product Strategy Team
**Next review:** Quarterly (August 2026)
