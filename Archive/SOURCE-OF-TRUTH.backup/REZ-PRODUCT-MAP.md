# ReZ Ecosystem — Complete Product Map

**Version:** 1.0
**Date:** May 2026
**Purpose:** CEO Strategic Overview of All Products, Services, and Integrations

---

## Executive Summary

**ReZ is building India's AI-powered commerce operating system.**

We solve **three interconnected problems**:
1. **SMB Problem:** High customer acquisition cost, no loyalty, aggregators take 20-30%
2. **Consumer Problem:** No rewards for spending, no discovery, no real value
3. **Brand Problem:** Can't reach purchase-intent customers affordably with attribution

**Our Solution:** A full-stack commerce ecosystem where:
- Consumers earn **coins** on every transaction
- Merchants **own their customers** and advertise affordably
- Brands get **closed-loop attribution** from impression to purchase

---

## The Three Problems We Solve

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THE THREE PROBLEMS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐   │
│  │      SMBs         │   │    CONSUMERS      │   │     BRANDS        │   │
│  │                   │   │                   │   │                   │   │
│  │ • Pay ₹500-2,000 │   │ • No rewards for │   │ • Can't reach    │   │
│  │   per customer   │   │   spending       │   │   purchase-intent │   │
│  │ • 60% never     │   │ • Generic 5% off │   │   customers      │   │
│  │   return        │   │ • No discovery   │   │ • Meta/Google    │   │
│  │ • Aggregators   │   │ • Apps have 80%  │   │   costs ₹5,000+ │   │
│  │   take 20-30%   │   │   churn in 30d  │   │ • No attribution │   │
│  │ • Own no data   │   │ • Cashback too   │   │ • Low ROI        │   │
│  │                   │   │   small to matter│   │                   │   │
│  └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘   │
│            │                       │                       │             │
│            └───────────────────────┼───────────────────────┘             │
│                                    │                                     │
│                          ┌─────────▼─────────┐                          │
│                          │                   │                          │
│                          │   THE REZ SOLUTION │                          │
│                          │                   │                          │
│                          │ • Coins worth ₹1  │                          │
│                          │ • Own customers   │                          │
│                          │ • 2% fee (vs 30%) │                          │
│                          │ • Discover + Earn │                          │
│                          │ • Reach intent    │                          │
│                          │   customers       │                          │
│                          │                   │                          │
│                          └───────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Complete Product Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ ECOSYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                      CONSUMER LAYER                              │      │
│    │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐│      │
│    │  │ Consumer   │  │   Do App   │  │  Rendez    │  │  Corp    ││      │
│    │  │    App     │  │            │  │  (Dating)  │  │  Perks   ││      │
│    │  │            │  │            │  │            │  │          ││      │
│    │  │ • QR Scan │  │ • Voice AI │  │ • Swipe    │  │ • B2B    ││      │
│    │  │ • Wallet   │  │ • Camera   │  │   Match    │  │   deals  ││      │
│    │  │ • Orders   │  │ • Location │  │ • Chat     │  │ • Emp     ││      │
│    │  │ • Discover │  │ • Tasks    │  │ • Meetups  │  │   benefits││      │
│    │  │ • Pay      │  │            │  │            │  │          ││      │
│    │  │ • Karma    │  │            │  │            │  │          ││      │
│    │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬────┘│      │
│    └─────────┼───────────────┼───────────────┼───────────────┼──────┘      │
│              │               │               │               │               │
│              └───────────────┴───────────────┴───────────────┘               │
│                                    │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                    COIN & WALLET LAYER                          ││  │
│    │  │                                                                 ││  │
│    │  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ││  │
│    │  │   │   REZ   │ │ BRANDED │ │CASHBACK │ │  PROMO  │ │  PRIVE  │ ││  │
│    │  │   │  Coins  │ │  Coins  │ │  Coins  │ │  Coins  │ │  Coins  │ ││  │
│    │  │   │(Never   │ │(180 days│ │(365 days│ │ (90 days│ │(365 days│ ││  │
│    │  │   │ expire) │ │ expiry) │ │ expiry) │ │ expiry) │ │ expiry) │ ││  │
│    │  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ ││  │
│    │  │                                                                 ││  │
│    │  │   ┌─────────────────────────────────────────────────────────┐ ││  │
│    │  │   │              KARMA TIER SYSTEM                         │ ││  │
│    │  │   │  Bronze (1x) → Silver (1.25x) → Gold (1.5x) → Platinum (2x) │ ││  │
│    │  │   └─────────────────────────────────────────────────────────┘ ││  │
│    │  │                                                                 ││  │
│    │  └─────────────────────────────────────────────────────────────────┘│  │
│    │                                │                                     │  │
│    └────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                    AI LAYER (ReZ Mind)                          ││  │
│    │  │                                                                 ││  │
│    │  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          ││  │
│    │  │   │    INTENT    │ │   PERSONALIZE │ │  AUTONOMOUS  │          ││  │
│    │  │   │    GRAPH     │ │    ENGINE     │ │    AGENTS    │          ││  │
│    │  │   │              │ │              │ │              │          ││  │
│    │  │   │ • Predicts  │ │ • 100+ user  │ │ • 8 agents  │          ││  │
│    │  │   │   purchase  │ │   attributes │ │ • 85% intent │          ││  │
│    │  │   │ • Detects   │ │ • Real-time  │ │   accuracy  │          ││  │
│    │  │   │   churn     │ │   content    │ │ • 60% support│          ││  │
│    │  │   │ • Scores    │ │ • Dynamic    │ │   auto      │          ││  │
│    │  │   │   LTV       │ │   pricing    │ │ • Dormant   │          ││  │
│    │  │   │             │ │              │ │   revival   │          ││  │
│    │  │   └──────────────┘ └──────────────┘ └──────────────┘          ││  │
│    │  └─────────────────────────────────────────────────────────────────┘│  │
│    │                                │                                     │  │
│    └────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                     SERVICE LAYER (25+ Services)                 ││  │
│    │  │                                                                 ││  │
│    │  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     ││  │
│    │  │   │  Payment  │ │   Order   │ │  Merchant │ │   Auth    │     ││  │
│    │  │   │  Service  │ │  Service  │ │  Service  │ │  Service  │     ││  │
│    │  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘     ││  │
│    │  │                                                                 ││  │
│    │  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     ││  │
│    │  │   │  Wallet   │ │   Ads     │ │  Finance  │ │    Chat   │     ││  │
│    │  │   │  Service  │ │  Service  │ │  Service  │ │  Service  │     ││  │
│    │  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘     ││  │
│    │  │                                                                 ││  │
│    │  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     ││  │
│    │  │   │    Karma  │ │  Targeting │ │   Action  │ │  Search   │     ││  │
│    │  │   │  Service  │ │   Engine  │ │   Engine  │ │  Service  │     ││  │
│    │  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘     ││  │
│    │  │                                                                 ││  │
│    │  └─────────────────────────────────────────────────────────────────┘│  │
│    │                                │                                     │  │
│    └────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                     MERCHANT LAYER                             ││  │
│    │  │                                                                 ││  │
│    │  │   ┌────────────┐  ┌────────────┐  ┌────────────┐              ││  │
│    │  │   │  Merchant  │  │  ReZ Now   │  │  Hotel    │              ││  │
│    │  │   │    App     │  │   (Web)    │  │   OTA     │              ││  │
│    │  │   │            │  │            │  │            │              ││  │
│    │  │   │ • POS/KDS  │  │ • QR Menu  │  │ • Direct  │              ││  │
│    │  │   │ • Analytics│  │ • Ordering │  │   booking │              ││  │
│    │  │   │ • CRM      │  │ • Payment  │  │ • PMS     │              ││  │
│    │  │   │ • Marketing│  │ • Coins    │  │ • Channel │              ││  │
│    │  │   │ • AdBazaar │  │ • Loyalty  │  │   manager │              ││  │
│    │  │   │ • Staff    │  │            │  │ • Loyalty │              ││  │
│    │  │   │ • Inventory│  │            │  │ • Coins   │              ││  │
│    │  │   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘              ││  │
│    │  └─────────┼───────────────┼───────────────┼──────────────────────┘  │
│    │            │               │               │                          │
│    └────────────┴───────────────┴───────────────┴──────────────────────────┘  │
│                                     │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                      BRAND/ADVERTISER LAYER                      ││  │
│    │  │                                                                 ││  │
│    │  │   ┌────────────┐  ┌────────────┐  ┌────────────┐              ││  │
│    │  │   │  AdBazaar │  │   adsqr    │  │  Verify    │              ││  │
│    │  │   │            │  │            │  │            │              ││  │
│    │  │   │ • Campaign │  │ • QR-based │  │ • Product  │              ││  │
│    │  │   │   marketplace│ │   ads      │  │   auth     │              ││  │
│    │  │   │ • Audience │  │ • Try &    │  │ • Warranty │              ││  │
│    │  │   │   targeting│  │   redeem   │  │ • Scan     │              ││  │
│    │  │   │ • Analytics│  │ • Branded  │  │   rewards  │              ││  │
│    │  │   │ • Attribution│ │   coins    │  │            │              ││  │
│    │  │   └────────────┘  └────────────┘  └────────────┘              ││  │
│    │  │                                                                 ││  │
│    │  └─────────────────────────────────────────────────────────────────┘│  │
│    │                                │                                     │  │
│    └────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                       ADMIN LAYER                                ││  │
│    │  │                                                                 ││  │
│    │  │   ┌─────────────────────────────────────────────────────────┐   ││  │
│    │  │   │                    Admin App                              │   ││  │
│    │  │   │                                                          │   ││  │
│    │  │   │   • User Management    • Coin Economy Management          │   ││  │
│    │  │   │   • Merchant Approval • Fraud Detection                  │   ││  │
│    │  │   │   • Content Moderation• System Monitoring                │   ││  │
│    │  │   │   • Analytics Dashboard• RBAC & Permissions              │   ││  │
│    │  │   └─────────────────────────────────────────────────────────┘   ││  │
│    │  │                                                                 ││  │
│    │  └─────────────────────────────────────────────────────────────────┘│  │
│    │                                │                                     │  │
│    └────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                         │
│    ┌────────────────────────────────┼────────────────────────────────────┐  │
│    │                                ▼                                     │  │
│    │  ┌─────────────────────────────────────────────────────────────────┐│  │
│    │  │                      FINANCE LAYER                               ││  │
│    │  │                                                                 ││  │
│    │  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     ││  │
│    │  │   │   BNPL    │ │  Credit   │ │    GST    │ │   Bill    │     ││  │
│    │  │   │           │ │   Score   │ │ Invoicing │ │  Payment  │     ││  │
│    │  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘     ││  │
│    │  │                                                                 ││  │
│    │  └─────────────────────────────────────────────────────────────────┘│  │
│    │                                │                                     │  │
│    └────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                         │
│                                    ▼                                          │
│                        ┌───────────────────────┐                            │
│                        │    EXTERNAL APIS      │                            │
│                        │                       │                            │
│                        │  • Razorpay (Pay)    │                            │
│                        │  • UPI / NPCI        │                            │
│                        │  • Twilio (SMS)      │                            │
│                        │  • SendGrid (Email)  │                            │
│                        │  • Firebase (Push)   │                            │
│                        │  • Claude (AI)       │                            │
│                        │  • WhatsApp API      │                            │
│                        │  • Google Maps       │                            │
│                        │  • BBPS (Bill Pay)   │                            │
│                        └───────────────────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Products in Detail

### 1. Consumer App (rez-app-consumer)

**Problem Solved:** Consumer has no rewards for spending, no discovery, generic discounts don't create habits.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSUMER APP FEATURES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUTHENTICATION                                                 │
│  ├── Phone OTP login                                            │
│  ├── Social login (Google, Apple)                              │
│  ├── Biometric authentication                                   │
│  └── Session management with JWT                               │
│                                                                 │
│  QR SCANNER                                                    │
│  ├── Scan any ReZ QR code                                      │
│  ├── Earn coins instantly                                       │
│  ├── Deep link handling (menu, store, ad, verify)             │
│  └── Offline QR caching                                        │
│                                                                 │
│  WALLET & COINS                                                │
│  ├── 6 coin types (REZ, Branded, Cashback, Promo, Prive, Ref) │
│  ├── Transaction history                                        │
│  ├── Coin expiration notifications                              │
│  └── Karma tier display (Bronze → Platinum)                    │
│                                                                 │
│  ORDERS                                                        │
│  ├── Create order with cart                                    │
│  ├── Real-time tracking with map                               │
│  ├── Order history & reorder                                    │
│  ├── Bill splitting                                            │
│  └── Schedule future orders                                    │
│                                                                 │
│  DISCOVERY                                                     │
│  ├── Nearby stores with map                                     │
│  ├── AI-powered recommendations                                 │
│  ├── Search with filters                                       │
│  └── Trending stores                                           │
│                                                                 │
│  PAYMENTS                                                      │
│  ├── UPI, Card, Wallet, Netbanking                             │
│  ├── BNPL (Buy Now Pay Later)                                  │
│  ├── Credit score display (300-900)                            │
│  └── Razorpay integration                                       │
│                                                                 │
│  BOOKING                                                       │
│  ├── Hotel booking (ReZ Hotel OTA)                             │
│  ├── Travel (flights, trains, cabs)                           │
│  ├── Mobile recharge & bill payment                            │
│  └── Parking reservations                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Merchant App (rez-app-merchant)

**Problem Solved:** SMB pays high acquisition costs, has no loyalty, doesn't own customer data.

```
┌─────────────────────────────────────────────────────────────────┐
│                   MERCHANT APP FEATURES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DASHBOARD                                                      │
│  ├── Today's revenue & orders                                   │
│  ├── Customer metrics                                           │
│  ├── Peak hours heatmap                                         │
│  └── Rating overview                                            │
│                                                                 │
│  ORDER MANAGEMENT (KDS)                                        │
│  ├── Live order feed with audio alerts                         │
│  ├── Accept/reject orders                                       │
│  ├── Preparation timers                                         │
│  ├── Kitchen display integration                                │
│  └── Split order tickets                                        │
│                                                                 │
│  MENU MANAGEMENT                                               │
│  ├── Product CRUD                                              │
│  ├── Category management                                        │
│  ├── Variants & modifiers                                       │
│  ├── Image upload                                              │
│  ├── Availability toggle                                        │
│  └── GST configuration                                          │
│                                                                 │
│  CUSTOMER MANAGEMENT (CRM)                                     │
│  ├── Customer list with filters                               │
│  ├── Order history per customer                                │
│  ├── LTV scoring                                               │
│  ├── Loyalty program setup                                     │
│  └── Push notifications to customers                           │
│                                                                 │
│  ANALYTICS                                                     │
│  ├── Sales reports (daily/weekly/monthly)                     │
│  ├── Category-wise revenue                                     │
│  ├── Peak hour analysis                                        │
│  ├── Customer demographics                                     │
│  └── Marketing ROI                                             │
│                                                                 │
│  MARKETING TOOLS                                               │
│  ├── Create offers (%, flat, BOGO)                            │
│  ├── Push notification campaigns                               │
│  ├── Loyalty program setup                                     │
│  ├── Gift card creation                                        │
│  └── AdBazaar integration                                      │
│                                                                 │
│  FINANCIAL                                                     │
│  ├── Earnings summary                                           │
│  ├── Settlement reports                                        │
│  ├── Invoice generation                                        │
│  └── Khata (credit ledger)                                    │
│                                                                 │
│  INTEGRATION                                                   │
│  ├── Swiggy/Zomato sync                                       │
│  ├── Delivery partner setup (Dunzo, Shadowfax)                │
│  ├── Printer configuration                                     │
│  └── WhatsApp Business                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. AdBazaar (adBazaar)

**Problem Solved:** Brands can't reach purchase-intent customers affordably with closed-loop attribution.

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADBAZAAR FEATURES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CAMPAIGN MANAGEMENT                                            │
│  ├── Create campaigns (awareness, traffic, engagement)         │
│  ├── Set budget & schedule                                      │
│  ├── Define target audience                                     │
│  ├── A/B testing for ad variants                               │
│  └── Multi-merchant campaigns                                   │
│                                                                 │
│  QR GENERATION                                                 │
│  ├── Single QR code generation                                  │
│  ├── Bulk QR import (CSV)                                      │
│  ├── QR customization (color, logo)                            │
│  └── Download in multiple formats                              │
│                                                                 │
│  ATTRIBUTION TRACKING                                          │
│  ├── Scan tracking (unique/total)                               │
│  ├── Visit tracking                                            │
│  ├── Purchase tracking (revenue attribution)                   │
│  ├── Attribution window (1-30 days)                            │
│  └── UTM parameter handling                                    │
│                                                                 │
│  REWARDS SYSTEM                                                │
│  ├── Coin reward configuration per scan/visit/purchase         │
│  ├── Reward caps (daily, per user, per campaign)               │
│  ├── Reward expiry rules                                       │
│  └── Manual reward distribution                                │
│                                                                 │
│  ANALYTICS                                                     │
│  ├── Campaign performance metrics                               │
│  ├── Real-time scan counter                                    │
│  ├── Geographic distribution                                   │
│  ├── Conversion funnel                                         │
│  └── ROI calculation                                           │
│                                                                 │
│  PRICING                                                       │
│  ├── CPM: ₹30-50/1000 impressions                             │
│  ├── CPA: ₹5-15 per QR scan                                   │
│  ├── Fixed daily: ₹100-1,000/day                              │
│  └── vs Meta/Google: ₹500+/CPM                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Hotel OTA (stayown.rez.money)

**Problem Solved:** Hotels pay 15-25% commission to OTAs, don't have loyalty across verticals.

```
┌─────────────────────────────────────────────────────────────────┐
│                      HOTEL OTA FEATURES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HOTEL PANEL (Admin)                                           │
│  ├── Property management                                        │
│  ├── Room inventory (types, rates)                             │
│  ├── Booking calendar view                                      │
│  ├── Channel manager (OTA sync)                               │
│  ├── Rate plan management                                      │
│  ├── Housekeeping management                                    │
│  └── Financial reports                                         │
│                                                                 │
│  GUEST BOOKING (Web)                                           │
│  ├── Hotel search with filters                                 │
│  ├── Date & room selection                                     │
│  ├── Payment processing                                        │
│  ├── Booking confirmation                                      │
│  └── Itinerary management                                       │
│                                                                 │
│  LOYALTY                                                       │
│  ├── Earn REZ coins on booking                                │
│  ├── Redeem coins at hotels                                   │
│  ├── Cross-vertical redemption (restaurant → hotel)           │
│  └── Karma tier multipliers                                    │
│                                                                 │
│  COMMISSION                                                     │
│  ├── 10% standard (vs 15-25% MMT/Goibibo)                   │
│  ├── 7.5% for volume partners                                 │
│  └── 12% first 3 months (new partners)                        │
│                                                                 │
│  PMS INTEGRATION                                               │
│  ├── White-label PMS available                                │
│  ├── Channel manager for all OTAs                             │
│  └── Works with existing systems                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Finance OS (rez-finance-service)

**Problem Solved:** Merchants and consumers have limited access to financial services, no credit history.

```
┌─────────────────────────────────────────────────────────────────┐
│                      FINANCE OS FEATURES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BNPL (BUY NOW PAY LATER)                                      │
│  ├── Credit limit based on transaction history                  │
│  ├── EMI support                                               │
│  ├── Coins as collateral                                       │
│  └── Credit score reporting                                    │
│                                                                 │
│  CREDIT SCORE                                                  │
│  ├── 0-850 range                                               │
│  ├── Based on REZ transaction history                         │
│  ├── Updated in real-time                                       │
│  └── No traditional bureau dependency                          │
│                                                                 │
│  GST INVOICING                                                 │
│  ├── Automated invoice generation                              │
│  ├── E-invoice portal integration                              │
│  ├── GST-compliant format                                       │
│  └── Tax report generation                                      │
│                                                                 │
│  WORKING CAPITAL                                               │
│  ├── Loans for verified merchants                              │
│  ├── Interest rate: 12-18% APR                                │
│  ├── Based on transaction volume                              │
│  └── Settlement priority for borrowers                         │
│                                                                 │
│  BILL PAYMENT                                                  │
│  ├── Mobile recharge                                            │
│  ├── DTH recharge                                               │
│  ├── Electricity bills                                         │
│  └── BBPS integration                                          │
│                                                                 │
│  WALLET                                                        │
│  ├── Multi-coin support                                        │
│  ├── Instant settlement                                         │
│  ├── P2P transfers                                             │
│  └── Withdrawal to bank                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6. ReZ Mind AI

**Problem Solved:** Manual operations don't scale, no personalization, high support costs.

```
┌─────────────────────────────────────────────────────────────────┐
│                      REZ MIND AI PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  8 AUTONOMOUS AGENTS                                           │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  ACQUISITION   │  │     DORMANT     │  │    UPSELL       │  │
│  │     AGENT      │  │    REVIVAL      │  │     AGENT       │  │
│  │                │  │                 │  │                 │  │
│  │ • Automated    │  │ • Re-engage     │  │ • Personalized  │  │
│  │   merchant     │  │   inactive      │  │   product      │  │
│  │   onboarding   │  │   users        │  │   recommendations│ │
│  │ • 40% target   │  │ • 25% revival  │  │ • 8% revenue   │  │
│  │   conversion   │  │   rate         │  │   uplift       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   RETENTION     │  │    FEEDBACK     │  │    SUPPORT     │  │
│  │     AGENT       │  │     AGENT       │  │     AGENT      │  │
│  │                 │  │                 │  │                 │  │
│  │ • Churn         │  │ • Sentiment    │  │ • 24/7 ticket  │  │
│  │   prevention    │  │   analysis      │  │   resolution   │  │
│  │ • 90% accuracy │  │ • 95% accuracy │  │ • 60% auto     │  │
│  │                 │  │                 │  │   resolution   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │    MERCHANT     │  │      AD        │                      │
│  │  INTELLIGENCE  │  │  OPTIMIZATION  │                      │
│  │     AGENT      │  │     AGENT      │                      │
│  │                │  │                 │                      │
│  │ • Demand       │  │ • Campaign ROI │                      │
│  │   forecasting  │  │   maximization  │                      │
│  │ • 85% accuracy│  │ • 35% CTR     │                      │
│  │ • Inventory    │  │   improvement  │                      │
│  │   optimization │  │ • Budget       │                      │
│  │                │  │   optimization │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│  INTENT GRAPH                                                  │
│  ├── Real-time user intent detection (85%+ accuracy)           │
│  ├── Purchase probability prediction                           │
│  ├── LTV scoring                                               │
│  ├── Churn risk detection                                      │
│  └── Next best action recommendations                          │
│                                                                 │
│  PERSONALIZATION ENGINE                                        │
│  ├── 100+ user behavior attributes                             │
│  ├── Real-time content personalization                         │
│  ├── Dynamic pricing based on user value                       │
│  └── Context-aware recommendations                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7. ReZ Now (Web Ordering)

**Problem Solved:** Merchants need web ordering without app downloads, customers need to order without installing apps.

```
┌─────────────────────────────────────────────────────────────────┐
│                      REZ NOW (WEB)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FOR MERCHANTS                                                  │
│  ├── QR code generation                                         │
│  ├── Web menu builder                                          │
│  ├── Order management dashboard                                │
│  ├── Payment tracking                                          │
│  └── Coin loyalty setup                                        │
│                                                                 │
│  FOR CUSTOMERS                                                  │
│  ├── Scan QR → Open menu (no app needed)                       │
│  ├── Browse menu & products                                    │
│  ├── Add to cart                                               │
│  ├── Pay via UPI                                               │
│  ├── Earn coins automatically                                   │
│  └── Order history                                             │
│                                                                 │
│  INTEGRATIONS                                                  │
│  ├── ReZ Wallet                                                │
│  ├── Intent Graph                                              │
│  ├── Karma System                                              │
│  ├── Razorpay payments                                         │
│  └── WhatsApp sharing                                          │
│                                                                 │
│  USE CASES                                                     │
│  ├── Restaurant table ordering                                 │
│  ├── Salon appointment booking                                 │
│  ├── Retail in-store shopping                                  │
│  └── Hotel room service                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8. Verify (Product Authentication)

**Problem Solved:** Brands can't track product authenticity, consumers can't verify products.

```
┌─────────────────────────────────────────────────────────────────┐
│                      REZ VERIFY                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FOR BRANDS                                                     │
│  ├── Product registration                                       │
│  ├── Serial number generation                                   │
│  ├── QR code per product                                       │
│  ├── Scan analytics                                            │
│  └── Anti-counterfeiting protection                            │
│                                                                 │
│  FOR CONSUMERS                                                 │
│  ├── Scan QR to verify authenticity                            │
│  ├── View warranty information                                 │
│  ├── See brand story                                           │
│  └── Earn REZ coins on verification                            │
│                                                                 │
│  ANALYTICS                                                     │
│  ├── Scan geography                                            │
│  ├── Scan timestamps                                           │
│  ├── Product performance                                       │
│  └── Region breakdown                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9. Do App (AI Task Assistant)

**Problem Solved:** Users need voice-powered task completion, location-based discovery.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DO APP                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VOICE AI                                                       │
│  ├── Voice input (expo-speech)                                 │
│  ├── Natural language understanding                             │
│  ├── Multi-turn conversation                                    │
│  └── Task completion                                            │
│                                                                 │
│  CAMERA                                                         │
│  ├── Visual search                                              │
│  ├── Product scanning                                           │
│  └── Receipt scanning                                          │
│                                                                 │
│  LOCATION                                                       │
│  ├── Nearby discovery                                           │
│  ├── Directions                                                │
│  └── Check-in rewards                                          │
│                                                                 │
│  AI COPILOT                                                     │
│  ├── 10+ specialized AI agents                                 │
│  ├── 15+ intent types                                          │
│  ├── 82+ event types                                           │
│  ├── Support automation (95.6% accuracy)                       │
│  └── Merchant intelligence                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10. Rendez (Dating)

**Problem Solved:** Dating apps have no real-world connection, meetups happen at random places.

```
┌─────────────────────────────────────────────────────────────────┐
│                        RENDEZ                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CORE FEATURES                                                 │
│  ├── Swipe matching                                             │
│  ├── Profile with photos                                        │
│  ├── Chat after match                                          │
│  └── Video calls                                               │
│                                                                 │
│  REAL-WORLD INTEGRATION                                         │
│  ├── QR check-in at venues                                     │
│  ├── Meetup bonus coins                                        │
│  ├── Venue recommendations                                     │
│  └── Social impact events                                       │
│                                                                 │
│  SAFETY                                                        │
│  ├── Verified profiles                                          │
│  ├── Response rate display                                     │
│  ├── Block & report                                            │
│  └── Emergency contacts                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW & INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           USER TRANSACTION FLOW                            │
│                                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐      │
│  │ Consumer │      │    QR    │      │  Order   │      │ Payment  │      │
│  │   App    │────▶│  Scan   │────▶│ Service  │────▶│ Service  │      │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘      │
│       │                 │                 │                 │              │
│       │                 │                 │                 │              │
│       │          ┌──────▼──────┐    ┌─────▼─────┐    ┌─────▼─────┐      │
│       │          │   Intent    │    │   Wallet  │    │  Razorpay │      │
│       │          │   Graph     │    │  Service  │    │   (UPI)   │      │
│       │          └──────┬──────┘    └─────┬─────┘    └──────────┘      │
│       │                 │                 │                              │
│       │          ┌──────▼──────┐    ┌─────▼─────┐                       │
│       │          │    Karma    │    │   Coin    │                       │
│       └─────────▶│   Service   │───▶│  Credited│                       │
│                  └─────────────┘    └──────────┘                       │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                         AI INTEGRATION                            │     │
│  │                                                                   │     │
│  │  Intent Graph ──▶ Personalization Engine ──▶ Recommendations     │     │
│  │        │                  │                      │               │     │
│  │        ▼                  ▼                      ▼               │     │
│  │  Churn Detection    Dynamic Pricing        Next Best Action       │     │
│  │                                                                   │     │
│  │  Autonomous Agents:                                              │     │
│  │  Acquisition ──▶ Dormant Revival ──▶ Upsell ──▶ Retention       │     │
│  │                                                                   │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                    ADVERTISING INTEGRATION                         │     │
│  │                                                                   │     │
│  │  AdBazaar Campaign ──▶ Targeting Engine ──▶ User Gets Ad          │     │
│  │         │                    │                    │               │     │
│  │         ▼                    ▼                    ▼               │     │
│  │  Campaign Analytics  Audience Segments   QR Scan + Coins          │     │
│  │                                                                   │     │
│  │  Attribution: Scan ──▶ Visit ──▶ Purchase ──▶ ROI Report         │     │
│  │                                                                   │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                      HOTEL INTEGRATION                             │     │
│  │                                                                   │     │
│  │  Hotel OTA ──▶ Channel Manager ──▶ PMS ──▶ Booking Confirmed     │     │
│  │       │                │              │              │              │     │
│  │       ▼                ▼              ▼              ▼              │     │
│  │  REZ Coins      Inventory Sync    Housekeeping   Guest Notified    │     │
│  │  Earned         (all OTAs)       Status         (Push/WhatsApp)   │     │
│  │                                                                   │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE DEPENDENCY GRAPH                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌──────────────┐                              │
│                              │   API        │                              │
│                              │   Gateway    │                              │
│                              │   (Port 3K) │                              │
│                              └──────┬───────┘                              │
│                                     │                                       │
│           ┌─────────────────────────┼─────────────────────────┐             │
│           │                         │                         │             │
│           ▼                         ▼                         ▼             │
│   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐  │
│   │    Auth      │         │    Wallet     │         │   Payment     │  │
│   │   Service    │         │   Service     │         │   Service     │  │
│   │  (Port 4K2)  │         │  (Port 4K4)  │         │  (Port 4K1)  │  │
│   └───────────────┘         └───────┬───────┘         └───────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│                           ┌─────────────────┐                              │
│                           │    Order       │                              │
│                           │   Service      │                              │
│                           │  (Port 3006)  │                              │
│                           └────────┬────────┘                              │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐             │
│           │                        │                        │             │
│           ▼                        ▼                        ▼             │
│   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐  │
│   │   Merchant    │         │    Karma      │         │    Ads        │  │
│   │   Service     │         │   Service     │         │   Service     │  │
│   │  (Port 4K5)  │         │  (Port 3K9)  │         │  (Port 4K7)  │  │
│   └───────────────┘         └───────────────┘         └───────────────┘  │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                      AI LAYER                                      │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │   Intent     │  │ Personalize  │  │   Action     │           │   │
│   │   │   Graph      │◀─▶│   Engine     │◀─▶│   Engine     │           │   │
│   │   │ (Port 3007) │  │ (Port 4017) │  │ (Port 3014) │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │  Targeting   │  │  Gamification│  │  Intelligence│           │   │
│   │   │   Engine     │  │   Service    │  │     Hub      │           │   │
│   │   │ (Port 3013) │  │  (Port 3001) │  │ (Port 4020) │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                   SUPPORTING SERVICES                              │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │ Notification │  │  Scheduler  │  │   Search    │           │   │
│   │   │   Events    │  │   Service   │  │   Service   │           │   │
│   │   │  (Port 3K5) │  │  (Port 3K2) │  │  (Port 4K3) │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │   Finance    │  │   Marketing  │  │    Chat     │           │   │
│   │   │   Service    │  │   Service    │  │   Service   │           │   │
│   │   │  (Port 4K6) │  │  (Port 4K0) │  │             │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                       EXTERNAL DEPENDENCIES                        │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │  MongoDB    │  │    Redis    │  │  BullMQ     │           │   │
│   │   │  (Primary)  │  │   (Cache)   │  │   (Queue)   │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │  Razorpay    │  │    Twilio   │  │  SendGrid   │           │   │
│   │   │  (Payments) │  │   (SMS)     │  │  (Email)    │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│   │   │  Firebase   │  │   Claude    │  │  WhatsApp   │           │   │
│   │   │  (Push)     │  │   (AI)      │  │    API      │           │   │
│   │   └──────────────┘  └──────────────┘  └──────────────┘           │   │
│   │                                                                   │   │
│   └───────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

---

## The 6 QR Systems

ReZ has **6 distinct QR systems**, each with different purposes and revenue attribution:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE 6 QR ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DISTRIBUTION LAYER (Discovery + Marketing)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   STORE QR   │  │   ADS QR     │  │  CREATOR QR  │                   │
│  │              │  │              │  │              │                   │
│  │ now.rez.money│  │adsqr.rez.money│  │creator.rez.money│                │
│  │              │  │              │  │              │                   │
│  │ • Discovery  │  │ • Marketing  │  │ • Social    │                   │
│  │ • Reviews    │  │ • Attribution│  │ • Commerce  │                   │
│  │ • Directions │  │ • Campaigns  │  │ • Influencer│                   │
│  │ • Offers     │  │ • Rewards    │  │ • Viral     │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                    │                                        │
│                                    ▼                                        │
│  TRANSACTION LAYER (Ordering + Services)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   MENU QR    │  │   ROOM QR    │  │  VERIFY QR   │                   │
│  │              │  │              │  │              │                   │
│  │menu.rez.money│  │room.rez.money│  │verify.rez.money│                 │
│  │              │  │              │  │              │                   │
│  │ • Ordering   │  │ • Hotel svc  │  │ • Auth      │                   │
│  │ • Payment    │  │ • Housekeep  │  │ • Anti-fake │                   │
│  │ • Split bill │  │ • Room service│  │ • Karma pts │                   │
│  │ • Tip        │  │ • Checkout    │  │ • Rewards   │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### QR Type Comparison

| QR Type | URL | Purpose | Revenue Weight | Integration |
|---------|-----|---------|---------------|------------|
| **Menu QR** | `menu.rez.money/{slug}` | Restaurant ordering | 0.85-1.00 | catalog, order, payment, wallet |
| **Store QR** | `now.rez.money/{slug}` | Merchant discovery | 0.20-0.60 | now, catalog, wallet |
| **Room QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel services | 0.40-0.80 | stayown, payment, notifications |
| **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Marketing attribution | 0.25-0.85 | adsqr, adBazaar, wallet |
| **Verify QR** | `verify.rez.money/s/{serial}` | Product authentication | 0.15-0.40 | karma, wallet, auth |
| **Creator QR** | `creator.rez.money/{creatorId}` | Social commerce | 0.20-0.70 | now, wallet, catalog |

---

## 11. Nextabizz (B2B Procurement)

**Problem Solved:** SMBs struggle with inventory management, supplier procurement, and restocking decisions.

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXTABIZZ FEATURES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  B2B PROCUREMENT SAAS                                          │
│  ├── Inventory management with stock levels                     │
│  ├── RFQ (Request for Quote) system                            │
│  ├── Supply chain signals (low stock alerts)                  │
│  ├── Purchase order management                                 │
│  ├── Supplier/vendor performance tracking                      │
│  └── Webhook integration for auto-reorder                      │
│                                                                 │
│  INTEGRATION                                                    │
│  ├── rez-procurement-service (Port 4012)                      │
│  ├── nextabizz-api.vercel.app                                 │
│  ├── Webhook → rez-merchant-service for reorder signals        │
│  └── Part of ReZ merchant workflow                             │
│                                                                 │
│  STATUS                                                         │
│  ├── Beta (v0.1)                                               │
│  ├── Supplier portal: incomplete                                │
│  └── Full integration with ReZ ecosystem planned               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. ReZ Try (Trial Discovery)

**Problem Solved:** Consumers want to try products/services before buying, merchants want to acquire new customers at low cost.

```
┌─────────────────────────────────────────────────────────────────┐
│                       REZ TRY FEATURES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TRIAL DISCOVERY PLATFORM                                       │
│  ├── Discovery Feed - Browse available trials                  │
│  ├── Trial Booking - Book free trials at merchants             │
│  ├── QR Redemption - Scan QR to claim trial                   │
│  └── try.rez.money                                              │
│                                                                 │
│  COIN SYSTEM                                                    │
│  ├── REZ TRY Coins - Redeemable at any merchant on REZ TRY    │
│  ├── Brand Coins - Custom branded coins for merchants           │
│  └── REZ Coins - General platform coins                        │
│                                                                 │
│  13 FEATURES                                                   │
│  1. Discovery Feed    5. Coin Purchase      9.  Leaderboard  │
│  2. Trial Booking     6. Explorer Score    10. Surprise Trials │
│  3. QR Redemption    7. Missions          11. Bundles        │
│  4. Coin Wallet       8. Badges           12. Campaigns       │
│                                       13. Reviews          │
│                                                                 │
│  INTEGRATION                                                    │
│  ├── rez-try service (Prisma/PostgreSQL)                     │
│  ├── DNS: CNAME to rez-try.render.com                         │
│  └── Coins integrate with rez-wallet-service                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. StayOwn (Hotel OTA)

**Problem Solved:** Hotels pay 15-25% commission to OTAs, have no loyalty across verticals, can't manage property efficiently.

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAYOWN FEATURES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INDIA'S FIRST HOTEL-OWNED OTA                                │
│  └── stayown.rez.money                                         │
│                                                                 │
│  HOTEL PANEL (Admin)                                           │
│  ├── Property management                                        │
│  ├── Room inventory (types, rates)                             │
│  ├── Booking calendar view                                      │
│  ├── Channel manager (sync with Booking.com, Expedia)          │
│  ├── Rate plan management                                      │
│  ├── Housekeeping management                                    │
│  ├── Staff scheduling                                          │
│  └── Financial reports                                         │
│                                                                 │
│  GUEST BOOKING (Web)                                           │
│  ├── Hotel search with filters                                 │
│  ├── Date & room selection                                     │
│  ├── Payment processing                                        │
│  ├── Booking confirmation                                      │
│  └── Itinerary management                                       │
│                                                                 │
│  IN-ROOM EXPERIENCE (Room QR)                                 │
│  ├── Scan QR for services                                     │
│  ├── Housekeeping requests                                     │
│  ├── Room service orders                                       │
│  ├── Minibar orders                                            │
│  ├── Checkout & express checkout                               │
│  └── Digital key via QR                                        │
│                                                                 │
│  LOYALTY                                                       │
│  ├── Earn REZ coins on booking                                │
│  ├── Redeem at hotels & restaurants                            │
│  ├── Cross-vertical redemption                                 │
│  └── Karma tier multipliers                                    │
│                                                                 │
│  COMMISSION                                                     │
│  ├── 10% standard (vs 15-25% MMT/Goibibo)                   │
│  ├── 7.5% for volume partners                                  │
│  └── 12% first 3 months (new partners)                         │
│                                                                 │
│  CORPORATE PANEL                                               │
│  ├── Company profile setup                                     │
│  ├── Employee directory sync (HRIS)                            │
│  ├── Travel policy configuration                                │
│  ├── Booking approvals                                         │
│  └── Expense reporting                                          │
│                                                                 │
│  MOBILE APP (Guest/Staff)                                      │
│  ├── Hotel search and booking                                  │
│  ├── Check-in/out                                              │
│  ├── Digital room key                                           │
│  ├── Housekeeping request                                       │
│  └── Checkout                                                   │
│                                                                 │
│  TECHNICAL                                                     │
│  ├── rez-stayown-service (Port 4015)                          │
│  ├── Node.js + Prisma + PostgreSQL                             │
│  ├── SSO via REZ Auth                                          │
│  └── hotel-ota-api.onrender.com                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. RestoPapa (Standalone Restaurant SaaS)

**Problem Solved:** Restaurant management needs (separate from ReZ ecosystem, standalone product).

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESTOPAPA FEATURES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RESTAURANT MANAGEMENT SAAS                                      │
│  ├── Menu builder with categories, items, modifiers             │
│  ├── Table reservations and waitlist                           │
│  ├── Kitchen Display System (KDS)                              │
│  ├── Delivery partner integration                               │
│  ├── Analytics (table turnover, peak hours)                    │
│  ├── Multi-outlet/franchise management                        │
│  ├── Staff hiring and verification                             │
│  └── Marketplace for vendor products                          │
│                                                                 │
│  NOT INTEGRATED WITH REZ                                       │
│  ├── Separate repo: imrejaul007/restaurantapp                  │
│  ├── NestJS + Next.js monorepo                                │
│  ├── NOT connected to ReZ backend                             │
│  ├── NOT connected to ReZ wallet                              │
│  └── NOT connected to ReZ merchant app                        │
│                                                                 │
│  DECISION NEEDED                                               │
│  ├── Option A: Integrate via SSO bridge                        │
│  ├── Option B: Keep as separate product                       │
│  └── Option C: Deprecate from ReZ context                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: What We Solve

| Problem | Solution | Product |
|---------|----------|---------|
| SMBs pay 20-30% to aggregators | 2% fee, own customer data | Merchant App |
| No loyalty for consumers | Coin system worth ₹1 each | Consumer App |
| Can't discover new places | AI-powered recommendations | Intent Graph |
| Merchants can't advertise | AdBazaar with ₹100/day budgets | AdBazaar |
| No attribution for ads | QR → Scan → Purchase tracking | adsqr |
| Hotels pay 15-25% commission | 10% via direct booking | StayOwn |
| No credit history | Transaction-based scoring | Finance OS |
| Support costs too high | 60% automation via AI | ReZ Mind |
| Products can't be verified | QR-based authentication | Verify QR |
| Apps have 80% churn | Web-first, no downloads | ReZ Now |
| No affordable local ads | ₹30-50 CPM vs ₹500+ | AdBazaar |
| Inactive users never return | Dormant Revival Agent | ReZ Mind |
| Can't try before buying | Free trial system | ReZ Try |
| Inventory management hard | B2B procurement SaaS | Nextabizz |
| Complex supply chain | RFQ & reorder signals | Nextabizz |
| Need restaurant SaaS | Standalone restaurant mgmt | RestoPapa |

---

## Complete Product Inventory

| # | Product | Type | Status | Integration |
|---|---------|------|--------|-------------|
| 1 | **Consumer App** | Mobile | ✅ Live | Full |
| 2 | **Merchant App** | Mobile | ✅ Live | Full |
| 3 | **Admin App** | Mobile | ✅ Live | Full |
| 4 | **AdBazaar** | Web | ✅ Live | Full |
| 5 | **adsqr** | Web | ✅ Live | Full |
| 6 | **StayOwn** | Web + Mobile | ✅ Live | Full (SSO + Wallet) |
| 7 | **ReZ Try** | Web | ✅ Live | Partial (Coins) |
| 8 | **Nextabizz** | Web | ⚠️ Beta | Partial (Webhook) |
| 9 | **RestoPapa** | Web | ⚠️ Standalone | ❌ Not integrated |
| 10 | **ReZ Now** | Web | ✅ Live | Full |
| 11 | **Verify** | Web | ⚠️ Research | Partial |
| 12 | **Do App** | Mobile | ✅ Live | Full |
| 13 | **Rendez** | Mobile | ✅ Live | Full |
| 14 | **Corp Perks** | B2B | ✅ Live | Full |

---

## Network Effects

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THE FLYWHEEL                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          MORE MERCHANTS                                     │
│                               │                                             │
│              ┌────────────────┼────────────────┐                           │
│              │                │                │                            │
│              ▼                ▼                ▼                            │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│     │  More QR      │ │ More coin   │ │ More ad     │                    │
│     │  codes       │ │ earning     │ │ inventory   │                    │
│     │  placed      │ │ opps        │ │ available   │                    │
│     └──────────────┘ └──────────────┘ └──────────────┘                    │
│              │                │                │                            │
│              └────────────────┼────────────────┘                            │
│                               ▼                                             │
│                      MORE CONSUMERS                                         │
│                               │                                             │
│              ┌────────────────┼────────────────┐                           │
│              │                │                │                            │
│              ▼                ▼                ▼                            │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│     │  More app    │ │ More coins  │ │ More ad     │                    │
│     │  downloads   │ │ to spend    │ │ views       │                    │
│     └──────────────┘ └──────────────┘ └──────────────┘                    │
│              │                │                │                            │
│              └────────────────┼────────────────┘                            │
│                               ▼                                             │
│                    MORE TRANSACTIONS                                        │
│                               │                                             │
│              ┌────────────────┼────────────────┐                           │
│              │                │                │                            │
│              ▼                ▼                ▼                            │
│     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                    │
│     │ More revenue │ │ More data   │ │ More brand  │                    │
│     │ for ReZ      │ │ for AI      │ │ interest    │                    │
│     └──────────────┘ └──────────────┘ └──────────────┘                    │
│              │                │                │                            │
│              └────────────────┼────────────────┘                            │
│                               ▼                                             │
│                       MORE MERCHANTS                                        │
│                               ▲                                             │
│                               │                                             │
│                              LOOP                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** May 2026
**Next Review:** Monthly
