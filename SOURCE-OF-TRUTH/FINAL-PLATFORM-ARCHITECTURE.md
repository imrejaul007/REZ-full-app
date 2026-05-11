# ReZ Platform - Complete Architecture Documentation
**Version:** 1.0
**Date:** May 7, 2026
**Status:** COMPLETE

---

## Executive Summary

| Category | Count |
|----------|-------|
| Platforms | 5 |
| Backend Services | 45+ |
| Mobile Apps | 6 |
| Web Apps | 20+ |
| Shared Packages | 20+ |
| AI/ML Services | 17 |
| MongoDB Databases | 16 |
| PostgreSQL Databases | 4 |

---

# THE 5 PLATFORMS

## Platform 1: ReZ Commerce Platform

**Purpose:** Core transaction and order management for food, retail, and services

### Services in Platform

| Service | Port | Database | Description |
|---------|------|---------|-------------|
| `rez-auth-service` | 4002 | `rez_auth` | Phone/OTP authentication, JWT tokens, sessions |
| `rez-wallet-service` | 4004 | `rez_wallet` | Coins, transactions, settlements, AML compliance |
| `rez-payment-service` | 4001 | `rez_payment` | Razorpay, UPI, refunds, webhooks |
| `rez-order-service` | 3006 | `rez_order` | Order lifecycle, tracking, cancellations |
| `rez-merchant-service` | 4005 | `rez_merchant` | Store management, KDS, staff, settlements |
| `rez-catalog-service` | 3005 | `rez_catalog` | Products, categories, pricing |
| `rez-search-service` | 4003 | `rez_search` | Store/product search, recommendations |

### Deployment URL
- **API Gateway:** `https://api.rez.money`
- **Auth Service:** `https://auth.rez.money`
- **Wallet Service:** `https://wallet.rez.money`
- **Payment Service:** `https://pay.rez.money`

### MongoDB Cluster
- **Cluster Name:** `rez-commerce-cluster`
- **Connection:** `mongodb+srv://rez_admin:<password>@rez-commerce.mongodb.net/rez_commerce`
- **Databases:**
  - `rez_auth` - Authentication data
  - `rez_wallet` - Wallet transactions
  - `rez_payment` - Payment records
  - `rez_order` - Orders and tracking
  - `rez_merchant` - Merchant data
  - `rez_catalog` - Product catalog
  - `rez_search` - Search indexes

---

## Platform 2: ReZ Mind AI Platform

**Purpose:** AI brain powering intent detection, personalization, and autonomous agents

### Services in Platform

| Service | Port | Database | Description |
|---------|------|---------|-------------|
| `rez-intent-graph` | 3007 | `rez_intent_graph` | 82 event types, intent signals, confidence scoring |
| `rez-intelligence-hub` | 4020 | `rez_intelligence` | Analytics aggregation, finance insights |
| `rez-personalization-engine` | 4017 | `rez_personalization` | Product recommendations, user profiles |
| `rez-targeting-engine` | 3013 | `rez_targeting` | Ad targeting, audience segmentation |
| `rez-action-engine` | 3014 | `rez_action_engine` | Nudges, automation, action approval |
| `rez-user-intelligence` | - | `rez_user_intel` | Behavioral scoring, LTV calculation |
| `rez-merchant-intelligence` | - | `rez_merchant_intel` | Revenue analytics, competitor analysis |

### AI Agents (8 Autonomous Agents)

| Agent | Schedule | Purpose |
|-------|----------|---------|
| `DemandSignalAgent` | Every 5 min | Aggregate demand per merchant/category |
| `ScarcityAgent` | Every 1 min | Supply/demand ratios, urgency alerts |
| `PersonalizationAgent` | Event-driven | User response profiling, A/B testing |
| `AttributionAgent` | Event-driven | Multi-touch conversion attribution |
| `AdaptiveScoringAgent` | Hourly | ML retraining of intent scoring |
| `FeedbackLoopAgent` | Event-driven | Closed-loop optimization, drift detection |
| `NetworkEffectAgent` | Daily | Collaborative filtering, user similarity |
| `RevenueAttributionAgent` | Every 15 min | GMV tracking, ROI per agent/nudge |

### Deployment URL
- **ReZ Mind API:** `https://mind.rez.money`
- **Intent Graph:** `https://intent.rez.money`
- **Intelligence Hub:** `https://intelligence.rez.money`

### MongoDB Cluster
- **Cluster Name:** `rez-mind-cluster`
- **Connection:** `mongodb+srv://rez_admin:<password>@rez-mind.mongodb.net/rez_mind`
- **Databases:**
  - `rez_intent_graph` - Intent signals
  - `rez_intelligence` - Analytics
  - `rez_personalization` - User preferences
  - `rez_targeting` - Campaign targeting
  - `rez_action_engine` - Action logs
  - `rez_user_intel` - User intelligence
  - `rez_merchant_intel` - Merchant intelligence

---

## Platform 3: ReZ Marketing & Ads Platform

**Purpose:** Campaign management, advertising, and customer engagement

### Services in Platform

| Service | Port | Database | Description |
|---------|------|---------|-------------|
| `rez-ads-service` | 4007 | `rez_ads` | Campaign management, attribution, ROI tracking |
| `rez-marketing-service` | 4000 | `rez_marketing` | Broadcasts, vouchers, audiences |
| `rez-gamification-service` | 3001 | `rez_gamification` | Coins, rewards, missions, achievements |
| `rez-uce` | - | `rez_uce` | Unified Campaign Engine |
| `rez-decision-service` | - | `rez_decision` | Decision Engine (RDE), 18 engines |
| `rez-ad-campaigns` | - | `rez_ad_campaigns` | Campaign creation and management |
| `rez-ad-ai` | - | `rez_ad_ai` | AI copilot for ads optimization |
| `rez-dooh-service` | - | `rez_dooh` | Digital Out of Home screens |

### RDE Core (Real-time Decision Engine)

| Component | Description |
|-----------|-------------|
| **SUPREME CONTROLLER** | NOTHING happens without RDE approval |
| **TRIGGERS** | Real-time events (search, scan, location, cart, purchase) |
| **AUCTION ENGINE** | Multiple merchants compete, best wins |

### Deployment URL
- **Ads Platform:** `https://ads.rez.money`
- **Marketing:** `https://marketing.rez.money`
- **UCE:** `https://uce.rez.money`
- **AdsQR:** `https://adsqr.rez.money`

### MongoDB Cluster
- **Cluster Name:** `rez-marketing-cluster`
- **Connection:** `mongodb+srv://rez_admin:<password>@rez-marketing.mongodb.net/rez_marketing`
- **Databases:**
  - `rez_ads` - Campaign data
  - `rez_marketing` - Marketing campaigns
  - `rez_gamification` - Rewards and coins
  - `rez_uce` - Campaign engine
  - `rez_decision` - Decision engine
  - `rez_ad_campaigns` - Ad campaigns
  - `rez_dooh` - DOOH screens

---

## Platform 4: ReZ Support & Communication Platform

**Purpose:** Customer support, unified chat, and conversational commerce

### Services in Platform

| Service | Port | Database | Description |
|---------|------|---------|-------------|
| `REZ-support-copilot` | 4033 | `rez_support` | Support agent assistant, 15+ intents |
| `rez-consumer-copilot` | 4021 | `rez_consumer_copilot` | Chat assistant for shoppers |
| `rez-merchant-copilot` | 4022 | `rez_merchant_copilot` | Business intelligence assistant |
| `rez-unified-chat` | - | `rez_chat` | WhatsApp-style universal chat |
| `rez-unified-messaging` | - | `rez_messaging` | Multi-channel messaging |
| `rez-notifications-hub` | - | `rez_notifications` | Push, WhatsApp, email |
| `rez-push-service` | - | `rez_push` | FCM and APNs integration |
| `rez-feedback-service` | 4010 | `rez_feedback` | Customer feedback collection |

### Support Copilot Features

| Feature | Status |
|---------|--------|
| 15+ Intent Types | Active |
| Naive Bayes Classifier | 95.6% accuracy |
| Hinglish Support | Enabled |
| ReZ Mind Integration | Connected |

### Deployment URL
- **Support Copilot:** `https://REZ-support-copilot.onrender.com`
- **Merchant Copilot:** `https://REZ-merchant-copilot.onrender.com`
- **Unified Chat:** `https://chat.rez.money`

### MongoDB Cluster
- **Cluster Name:** `rez-support-cluster`
- **Connection:** `mongodb+srv://rez_admin:<password>@rez-support.mongodb.net/rez_support`
- **Databases:**
  - `rez_support` - Support tickets
  - `rez_consumer_copilot` - Consumer chat
  - `rez_merchant_copilot` - Merchant chat
  - `rez_chat` - Chat messages
  - `rez_messaging` - Messaging logs
  - `rez_notifications` - Notification history
  - `rez_push` - Push tokens
  - `rez_feedback` - Feedback data

---

## Platform 5: ReZ Finance & Operations Platform

**Purpose:** Financial operations, settlements, and backend infrastructure

### Services in Platform

| Service | Port | Database | Description |
|---------|------|---------|-------------|
| `rez-finance-service` | 4006 | `rez_finance` | Ledger, settlements, reporting |
| `rez-billing-service` | - | `rez_billing` | Billing and invoicing |
| `rez-scheduler-service` | 3012 | `rez_scheduler` | Cron jobs, BullMQ queues |
| `rez-automation-service` | 3016 | `rez_automation` | Workflow automation |
| `rez-corporate-service` | 4030 | `rez_corporate` | Corporate accounts |
| `rez-corpperks-service` | - | `rez_corpperks` | Corporate perks program |
| `rez-karma-service` | 3009 | `rez_karma` | Karma loyalty system |

### Finance Features

| Feature | Status |
|---------|--------|
| REZ Score (0-850) | Active |
| Loan Operations | Active |
| BNPL | Active |
| Credit Marketplace | Active |
| Risk Engine | Active |
| Merchant Financing | Active |
| GST Invoicing | Active |

### Deployment URL
- **Finance API:** `https://finance.rez.money`
- **Billing:** `https://billing.rez.money`
- **Karma:** `https://karma.rez.money`

### MongoDB Cluster
- **Cluster Name:** `rez-finance-cluster`
- **Connection:** `mongodb+srv://rez_admin:<password>@rez-finance.mongodb.net/rez_finance`
- **Databases:**
  - `rez_finance` - Financial records
  - `rez_billing` - Billing data
  - `rez_scheduler` - Scheduled jobs
  - `rez_automation` - Automation workflows
  - `rez_corporate` - Corporate accounts
  - `rez_corpperks` - Corporate perks
  - `rez_karma` - Karma loyalty

---

# QR SYSTEMS (6)

| # | System | URL | Purpose |
|---|--------|-----|---------|
| 1 | **ReZ Now** | `now.rez.money/{slug}` | Universal merchant QR - payments, ordering |
| 2 | **ReZ Web Menu** | `menu.rez.money/{slug}` | Restaurant ordering |
| 3 | **Room Service QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel services |
| 4 | **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Campaign tracking |
| 5 | **ReZ Verify** | `verify.rez.money/s/{serial}` | Product authentication |
| 6 | **Creator QR** | `creator.rez.money/{creatorId}` | Social commerce |

---

# SERVICE CONNECTIONS

## Inter-Service Communication

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (api.rez.money)                        │
│                    Standardized Response Format, Rate Limiting              │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PLATFORM 1     │     │  PLATFORM 2     │     │  PLATFORM 3     │
│  Commerce       │     │  ReZ Mind       │     │  Marketing      │
│                 │     │                 │     │                 │
│ Auth ◄──────────┼─────┼──► Intent Graph │     │ Ads ◄───────────┼─────► Decision Engine
│ Wallet ◄────────┼─────┼──► Intelligence │     │ Marketing ◄─────┼─────► Auction
│ Payment ◄──────┼─────┼──► Personalize  │     │ Gamification ◄─┼─────► RDE
│ Order ◄─────────┼─────┼──► Targeting    │     │                │     │
│ Merchant ◄──────┼─────┼──► Action Eng   │     │                │     │
│ Catalog ◄───────┼─────┼──► User Intel   │     │                │     │
│ Search ◄────────┼─────┼──► Merchant Int│     │                │     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  PLATFORM 4     │
                    │  Support        │
                    │                 │
                    │ Support Copilot │
                    │ Consumer Copilot│
                    │ Merchant Copilot│
                    │ Unified Chat    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  PLATFORM 5     │
                    │  Finance        │
                    │                 │
                    │ Finance Service │
                    │ Billing         │
                    │ Scheduler       │
                    │ Karma           │
                    └─────────────────┘
```

## Service URL Mapping

| Service | Internal URL | External URL |
|---------|-------------|--------------|
| Auth Service | http://auth-api:4002 | https://auth.rez.money |
| Wallet Service | http://wallet-api:4004 | https://wallet.rez.money |
| Payment Service | http://payment-api:4001 | https://pay.rez.money |
| Order Service | http://order-api:3006 | https://api.rez.money/orders |
| Merchant Service | http://merchant-api:4005 | https://api.rez.money/merchants |
| Catalog Service | http://catalog-api:3005 | https://api.rez.money/catalog |
| Search Service | http://search-api:4003 | https://api.rez.money/search |
| Intent Graph | http://intent-graph:3007 | https://mind.rez.money |
| Intelligence Hub | http://intelligence-hub:4020 | https://intelligence.rez.money |
| Support Copilot | http://support-copilot:4033 | https://support.rez.money |
| Finance Service | http://finance-api:4006 | https://finance.rez.money |
| Karma Service | http://karma-api:3009 | https://karma.rez.money |
| Ads Service | http://ads-api:4007 | https://ads.rez.money |
| Scheduler Service | http://scheduler-api:3012 | Internal only |
| Automation Service | http://automation-api:3016 | Internal only |

---

# MONGODB CLUSTERS

## Summary of All MongoDB Clusters

| Cluster | Purpose | Databases | Replica Set |
|---------|---------|-----------|-------------|
| `rez-commerce-cluster` | Commerce transactions | 7 | `rs0` |
| `rez-mind-cluster` | AI/ML data | 7 | `rs0` |
| `rez-marketing-cluster` | Marketing & ads | 7 | `rs0` |
| `rez-support-cluster` | Support & chat | 8 | `rs0` |
| `rez-finance-cluster` | Finance operations | 7 | `rs0` |
| **Total** | **All platforms** | **36** | **5 replica sets** |

## Local Development (Docker Compose)

For local development, use the 3-node replica set:

```bash
# Primary:   mongodb://mongodb-primary:27017
# All nodes: mongodb://mongodb-primary:27017,mongodb-secondary-1:27017,mongodb-secondary-2:27017/?replicaSet=rs0
```

## MongoDB Service Database Mapping

| Service | Database | User |
|---------|----------|------|
| rez-auth-service | rez_auth | rez_auth_user |
| rez-wallet-service | rez_wallet | rez_wallet_user |
| rez-payment-service | rez_payment | rez_payment_user |
| rez-order-service | rez_order | rez_order_user |
| rez-merchant-service | rez_merchant | rez_merchant_user |
| rez-catalog-service | rez_catalog | rez_catalog_user |
| rez-search-service | rez_search | rez_search_user |
| rez-gamification-service | rez_gamification | rez_gamification_user |
| rez-ads-service | rez_ads | rez_ads_user |
| rez-marketing-service | rez_marketing | rez_marketing_user |
| rez-scheduler-service | rez_scheduler | rez_scheduler_user |
| rez-finance-service | rez_finance | rez_finance_user |
| rez-karma-service | rez_karma | rez_karma_user |
| rez-corpperks-service | rez_corpperks | rez_corpperks_user |
| rez-hotel-service | rez_hotel | rez_hotel_user |
| rez-procurement-service | rez_procurement | rez_procurement_user |

---

# ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      USERS                                                  │
│   Consumer App │ Merchant App │ Admin Dashboard │ QR Scans │ Web │ Support Agents          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    API GATEWAY                                              │
│                         https://api.rez.money                                              │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐     │
│   │  • Rate Limiting  • Authentication  • Request Routing  • Response Standardization │     │
│   └─────────────────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
    ┌────────────────────────────────────────┼────────────────────────────────────────┐
    │                                        │                                        │
    ▼                                        ▼                                        ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│      PLATFORM 1                 │ │      PLATFORM 2                 │ │      PLATFORM 3                 │
│      Commerce                    │ │      ReZ Mind                   │ │      Marketing & Ads           │
├─────────────────────────────────┤ ├─────────────────────────────────┤ ├─────────────────────────────────┤
│                                 │ │                                 │ │                                 │
│  ┌─────────┐ ┌─────────┐      │ │  ┌─────────┐ ┌─────────┐      │ │  ┌─────────┐ ┌─────────┐      │
│  │  Auth   │ │ Wallet  │      │ │  │ Intent  │ │Intelligence│    │ │  │   Ads   │ │Marketing│      │
│  │  4002   │ │  4004   │      │ │  │  Graph  │ │   Hub   │      │ │  │  4007   │ │  4000   │      │
│  └────┬────┘ └────┬────┘      │ │  │  3007   │ │  4020   │      │ │  └────┬────┘ └────┬────┘      │
│       │           │           │ │  └────┬────┘ └────┬────┘      │ │       │           │           │
│  ┌────┴────┐ ┌────┴────┐      │ │  ┌────┴────┐ ┌────┴────┐      │ │  ┌────┴────┐ ┌────┴────┐      │
│  │ Payment │ │  Order  │      │ │  │Personal │ │Targeting│      │ │  │Gamify   │ │   UCE   │      │
│  │  4001   │ │  3006   │      │ │  │ Engine  │ │ Engine  │      │ │  │  3001   │ │         │      │
│  └────┬────┘ └────┬────┘      │ │  │  4017   │ │  3013   │      │ │  └────┬────┘ └────┬────┘      │
│       │           │           │ │  └────┬────┘ └────┬────┘      │ │       │           │           │
│  ┌────┴────┐ ┌────┴────┐      │ │  ┌────┴────┐ ┌────┴────┐      │ │  ┌────┴────┐ ┌────┴────┐      │
│  │Merchant │ │ Catalog │      │ │  │  Action │ │  User   │      │ │  │ Decision│ │  DOOH   │      │
│  │  4005   │ │  3005   │      │ │  │ Engine  │ │ Intel   │      │ │  │ Service │ │         │      │
│  └────┬────┘ └────┬────┘      │ │  │  3014   │ │         │      │ │  └─────────┘ └─────────┘      │
│       │           │           │ │  └─────────┘ └─────────┘      │ │                                 │
│  ┌────┴────┐ ┌────┴────┐      │ │                                 │ │         RDE CORE              │
│  │  Search │ │         │      │ │         AI AGENTS               │ │  ┌─────────────────────────┐  │
│  │  4003   │ │         │      │ │  ┌─────────────────────────┐  │ │  │ • Scoring Engine       │  │
│  └─────────┘ └─────────┘      │ │  │ DemandSignal │ Scarcity │  │ │  │ • Ranking Engine       │  │
│                                │ │  │ Personalize  │Attrib    │  │ │  │ • Trigger Engine       │  │
│                                │ │  │ NetworkEffect│Revenue   │  │ │  │ • Fatigue Engine       │  │
│                                │ │  │ AdaptiveScoring│Feedback │  │ │  │ • Budget Allocator     │  │
│                                │ │  └─────────────────────────┘  │ │  │ • Timing Engine        │  │
│                                │ │                                 │ │  └─────────────────────────┘  │
└────────────────────────────────┘ └─────────────────────────────────┘ └─────────────────────────────────┘
                │                         │                         │
                └─────────────────────────┼─────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PLATFORM 4                                                │
│                              Support & Communication                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Support Copilot │  │Consumer Copilot │  │Merchant Copilot │  │ Unified Chat    │        │
│  │     4033        │  │     4021        │  │     4022        │  │                 │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                    │                    │                    │                  │
│           └────────────────────┴────────────────────┴────────────────────┘                  │
│                                         │                                                  │
│                          ┌──────────────┴──────────────┐                                  │
│                          │    Notifications Hub        │                                  │
│                          │  Push │ WhatsApp │ Email    │                                  │
│                          └─────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    PLATFORM 5                                                │
│                              Finance & Operations                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Finance │  │ Billing │  │Scheduler│  │Automation│  │ Corporate│ │  Karma  │        │
│  │  4006   │  │         │  │  3012   │  │  3016   │  │  4030   │  │  3009   │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│                                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  REZ Score (0-850) │ BNPL │ Credit Marketplace │ Risk Engine │ GST Invoicing       │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
═══════════════════════════════════════════════╡ DATA LAYER ╞═══════════════════════════════════════════════════════
                                              │
    ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
    │                                           │                                           │
    ▼                                           ▼                                           ▼
┌─────────────────────┐           ┌─────────────────────┐           ┌─────────────────────┐
│  MONGODB CLUSTERS   │           │     REDIS           │           │   POSTGRESQL        │
│                     │           │                     │           │                     │
│ rez-commerce-cluster│           │  • Session Cache   │           │  • Rendez Backend   │
│ rez-mind-cluster    │           │  • BullMQ Queues   │           │  • Hotel OTA        │
│ rez-marketing-cluster│          │  • Rate Limiting   │           │  • CorpPerks        │
│ rez-support-cluster │           │  • Pub/Sub         │           │  • StayOwn          │
│ rez-finance-cluster│           │  • Real-time Data  │           │                     │
└─────────────────────┘           └─────────────────────┘           └─────────────────────┘
```

---

# MOBILE APPS

## Consumer-Facing Apps

| App | Package | Bundle ID | Framework |
|-----|---------|-----------|-----------|
| **ReZ Consumer** | `money.rez.app` | `money.rez.app` | Expo SDK 53 |
| **Do App** | `com.do.app` | `com.do.app` | Expo SDK 52 |
| **ReZ Admin** | `rez-admin` | `com.rez.admin` | Expo SDK 53 |
| **ReZ Merchant** | `merchant-app` | `com.rez.merchant` | Expo SDK 55 |
| **Karma Mobile** | `rez-karma-mobile` | `com.rez.karma` | Expo SDK 52 |
| **Hotel OTA** | `@hotel-ota/mobile` | `com.hotelota.app` | Expo SDK 49 |

## App Stores

| App | Store | Status |
|-----|-------|--------|
| ReZ Consumer | Google Play | Pending |
| ReZ Consumer | Apple App Store | Pending |
| Do App | Google Play | Pending |
| Do App | Apple App Store | Pending |
| ReZ Merchant | Google Play | Ready |
| ReZ Merchant | Apple App Store | Ready |

---

# DEPLOYMENT CONFIGURATION

## Render.com Services

| Service | Blueprint | Region |
|---------|-----------|--------|
| Auth Service | `render.yaml` | Singapore |
| Wallet Service | `render.yaml` | Singapore |
| Payment Service | `render.yaml` | Singapore |
| Order Service | `render.yaml` | Singapore |
| Merchant Service | `render.yaml` | Singapore |
| Support Copilot | `render.yaml` | Singapore |
| Merchant Copilot | `render.yaml` | Singapore |
| Event Platform | `render.yaml` | Singapore |

## Docker Compose (Local Development)

```bash
# Start all services
docker compose up -d

# Start specific platform
docker compose up -d auth-api merchant-api rendez-backend
```

## Environment Variables Required

```bash
# MongoDB
MONGODB_URI=mongodb+srv://rez_admin:<password>@<cluster>.mongodb.net/rez_dev

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets
JWT_SECRET=<generate-32-chars>
JWT_REFRESH_SECRET=<generate-32-chars>

# Service URLs
AUTH_SERVICE_URL=https://auth.rez.money
WALLET_SERVICE_URL=https://wallet.rez.money
INTENT_SERVICE_URL=https://mind.rez.money

# External APIs
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
```

---

# SHARED PACKAGES

| Package | Purpose |
|---------|---------|
| `@rez/shared-types` | Canonical types, Zod schemas, FSM helpers |
| `@rez/ai-types` | AI types - intents, targeting, actions |
| `rez-api-sdk` | TypeScript API SDK |
| `rez-auth` | Authentication utilities |
| `rez-chat-ai` | Chat AI |
| `rez-intent-capture-sdk` | Intent SDK |
| `rez-loyalty-client` | Loyalty system |
| `rez-merchant-sdk` | Merchant SDK |
| `rez-qr-sdk` | QR generation |
| `rez-socket-client` | Socket.IO |

---

# EXTERNAL INTEGRATIONS

| Service | Provider | Purpose |
|---------|----------|---------|
| Payments | Razorpay | Payment gateway |
| SMS | MSG91/Sinch | OTP and notifications |
| WhatsApp | WhatsApp Business API | Conversational commerce |
| Push Notifications | Firebase (FCM) | Mobile push |
| Email | SendGrid | Transactional email |
| Storage | AWS S3 | Media storage |
| AI | OpenAI/Anthropic | Chat and intelligence |

---

*Document Version: 1.0*
*Last Updated: May 7, 2026*
*Status: COMPLETE*
