# ReZ Ecosystem - Complete Platform Architecture

**Version:** 1.0.0
**Date:** May 4, 2026
**Status:** COMPLETE - All Systems Documented

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Service Registry](#service-registry)
4. [Architecture Diagram](#architecture-diagram)
5. [All Service Details](#all-service-details)
6. [All Connections & URLs](#all-connections--urls)
7. [All Features](#all-features)
8. [Data Flow](#data-flow)
9. [Technology Stack](#technology-stack)
10. [Database Architecture](#database-architecture)
11. [QR Systems](#qr-systems)
12. [Mobile Apps](#mobile-apps)
13. [Web Applications](#web-applications)
14. [AI/ML Infrastructure](#aiml-infrastructure)

---

## Executive Summary

The ReZ Ecosystem is a comprehensive commerce platform with **50+ microservices**, **22 apps**, and **AI-powered intelligence** for Indian commerce. It combines:

- **Commerce Operations**: Auth, Wallet, Payment, Order, Merchant, Catalog
- **AI Intelligence**: Intent Graph, 8 Autonomous Agents, 17 Copilots
- **Growth Engine**: Ads, Marketing, Gamification, Loyalty
- **Vertical Solutions**: Hotel OTA, Restaurants, Retail, Corporate
- **Embedded Finance**: Credit, BNPL, Bill Pay, Loans

---

## System Overview

| Metric | Value |
|--------|-------|
| **Total Services** | 50+ |
| **Active Microservices** | 45+ |
| **Frontend Apps** | 22 |
| **Mobile Apps** | 4 |
| **AI/ML Services** | 17 |
| **API Endpoints** | 1000+ |
| **Event Types** | 82 |
| **QR Systems** | 6 |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    REZ ECOSYSTEM                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           EXTERNAL CLIENTS                                           │  │
│  │   Mobile App │ Web App │ Admin │ Partner APIs │ QR Scans │ IoT Devices              │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                          │                                                │
│                                          ▼                                                │
│  ════════════════════════════════════════════════════════════════════════════════════════  │
│  ║                                   API GATEWAY (Port 3000)                             ║  │
│  ║                  (Authentication, Rate Limiting, Request Routing)                     ║  │
│  ════════════════════════════════════════════════════════════════════════════════════════  │
│                                          │                                                │
│          ┌───────────────────────────────┼───────────────────────────────┐                │
│          │                               │                               │                │
│          ▼                               ▼                               ▼                │
│  ╔═══════════════════════╗    ╔═══════════════════════╗    ╔═══════════════════════╗    │
│  ║    CORE SERVICES      ║    ║   AI SERVICES         ║    ║   GROWTH SERVICES      ║    │
│  ╠═══════════════════════╣    ╠═══════════════════════╣    ╠═══════════════════════╣    │
│  ║  • Auth (4002)        ║    ║  • Intent Graph (3007)║    ║  • Ads (4007)         ║    │
│  ║  • Wallet (4004)      ║    ║  • Intelligence Hub  ║    ║  • Marketing (4000)    ║    │
│  ║  • Payment (4001)     ║    ║    (4020)            ║    ║  • Gamification (3001) ║    │
│  ║  • Order (3006)       ║    ║  • Personalization   ║    ║  • Copilots (4021-22)  ║    │
│  ║  • Merchant (4005)    ║    ║    (4017)           ║    ║  • Feedback (4010)     ║    │
│  ║  • Catalog (4006)     ║    ║  • Targeting (3013)  ║    ║                        ║    │
│  ║  • Search (4003)      ║    ║  • Action Engine     ║    ║                        ║    │
│  ║  • Finance (4006)     ║    ║    (3014)           ║    ║                        ║    │
│  ╚═══════════════════════╝    ╚═══════════════════════╝    ╚═══════════════════════╝    │
│                  │                         │                            │                  │
│                  └─────────────────────────┼────────────────────────────┘                  │
│                                            │                                             │
│                                            ▼                                             │
│  ╔═══════════════════════════════════════════════════════════════════════════════════════╗  │
│  ║                              ML INFRASTRUCTURE                                       ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════════════╣  │
│  ║  • Feature Store (4100)  • Model Registry (4101)  • Training Data (4102)           ║  │
│  ║  • Fraud Detection (4103) • Price Optimization (4104) • Data Quality (4106)       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════════════╝  │
│                                            │                                             │
│                                            ▼                                             │
│  ╔═══════════════════════════════════════════════════════════════════════════════════════╗  │
│  ║                               VERTICAL SOLUTIONS                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════════════╣  │
│  ║  Hotel OTA (3000)  │  Rendez (4000)  │  CorpPerks  │  StayOwn  │  AdBazaar       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Registry

### Core Commerce Services (8)

| # | Service | Port | Database | Purpose | Connections |
|---|---------|------|----------|---------|-------------|
| 1 | **rez-auth-service** | 4002 | MongoDB | OTP, JWT, OAuth, TOTP, Device fingerprinting | All services |
| 2 | **rez-wallet-service** | 4004 | MongoDB | Multi-coin wallet, balances, transfers | Auth, Payment, Karma |
| 3 | **rez-payment-service** | 4001 | MongoDB | Razorpay, UPI, refunds, reconciliation | Wallet, Order |
| 4 | **rez-order-service** | 3006 | MongoDB | Order lifecycle (11 states), tracking | Payment, Merchant |
| 5 | **rez-merchant-service** | 4005 | MongoDB | Store, products, KDS, staff, KYC | Auth, Order, Catalog |
| 6 | **rez-catalog-service** | 4006 | MongoDB | Product catalog, categories, modifiers | Merchant, Search |
| 7 | **rez-search-service** | 4003 | MongoDB | Store/product search, recommendations | All services |
| 8 | **rez-finance-service** | 4006 | MongoDB | Credit score, loans, BNPL, bill pay | Wallet, Auth |

### AI & Intelligence Services (17)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 9 | **rez-intent-graph** | 3007 | Capture purchase intent signals (82 events), confidence scoring |
| 10 | **rez-intelligence-hub** | 4020 | Unified user/merchant intelligence aggregation |
| 11 | **rez-personalization-engine** | 4017 | Product recommendations, user profiling |
| 12 | **rez-targeting-engine** | 3013 | Audience segmentation, ad targeting |
| 13 | **rez-action-engine** | 3014 | Nudge delivery, approval workflows, automation |
| 14 | **rez-consumer-copilot** | 4021 | Chat assistant for shoppers (17 intents) |
| 15 | **rez-merchant-copilot** | 4022 | Business intelligence assistant |
| 16 | **rez-support-copilot** | 4033 | Support agent assistant |
| 17 | **rez-intent-service** | 4009 | Unified signal processing pipeline |
| 18 | **rez-copilot** | 4026 | Unified copilot (all channels) |
| 19 | **rez-decision-service** | 4027 | 9 segments, frequency capping |
| 20 | **rez-user-intelligence-service** | 3004 | User profiles, behavioral scores |
| 21 | **rez-merchant-intelligence-service** | 4012 | Revenue analytics, competitor analysis |
| 22 | **rez-lead-intelligence** | - | Lead scoring and qualification |
| 23 | **rez-economic-engine** | - | Economic modeling, pricing |
| 24 | **rez-recommendation-engine** | - | Collaborative filtering, recommendations |
| 25 | **rez-error-intelligence** | - | Error tracking, resolution suggestions |

### Growth & Marketing Services (10)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 26 | **rez-ads-service** | 4007 | Ad campaigns, attribution, ROI tracking |
| 27 | **rez-ad-campaigns** | 4008 | Campaign management |
| 28 | **rez-ad-ai** | - | AI campaign optimization |
| 29 | **rez-marketing** | 4000 | Multi-channel broadcasts, vouchers |
| 30 | **rez-marketing-service** | - | Marketing automation |
| 31 | **rez-karma-service** | 3009 | Gamification, coins, missions, badges |
| 32 | **rez-feedback-service** | 4010 | Survey, ratings, reviews |
| 33 | **rez-automation-service** | 3016 | Workflow automation, webhooks |
| 34 | **rez-uce** | - | Unified Campaign Engine |
| 35 | **rez-adsos** | - | Ad Operating System |

### Operational Services (8)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 36 | **rez-scheduler-service** | 3012 | Cron jobs, BullMQ queues |
| 37 | **rez-push-service** | - | Push notification delivery |
| 38 | **rez-profile-service** | - | User profiles, preferences |
| 39 | **rez-socket-service** | - | Real-time WebSocket communication |
| 40 | **rez-event-platform** | - | Event streaming, analytics |
| 41 | **rez-media-events** | - | Media processing, CDN |
| 42 | **rez-notification-events** | - | Notification event processing |
| 43 | **rez-feature-flags** | - | Feature toggles, A/B testing |

### Revenue Services (5)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 44 | **rez-bbps-service** | 4110 | Bill payment (BBPS) |
| 45 | **rez-recharge-service** | 4111 | Mobile recharge, DTH |
| 46 | **rez-einvoice-service** | 4112 | GST e-invoicing |
| 47 | **rez-billing-service** | - | Billing, subscriptions |
| 48 | **rez-billing-system** | - | Billing infrastructure |

### Vertical Solutions (7)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 49 | **Hotel OTA API** | 3000 | Hotel booking, inventory |
| 50 | **Hotel OTA Panel** | 3002 | Hotel management dashboard |
| 51 | **rez-hotel-service** | - | Hotel operations |
| 52 | **rez-travel-service** | - | Travel booking |
| 53 | **rez-corporate-service** | 4030 | Corporate accounts |
| 54 | **rez-stayown-service** | 4015 | Long-stay solutions |
| 55 | **rez-procurement-service** | - | B2B procurement |

### ML Infrastructure (6)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 56 | **rez-ml-feature-store** | 4100 | ML feature storage, retrieval |
| 57 | **rez-ml-model-registry** | 4101 | Model versioning, deployment |
| 58 | **rez-training-data-service** | 4102 | Training data preparation |
| 59 | **rez-fraud-detection-service** | 4103 | Fraud detection models |
| 60 | **rez-price-optimization-service** | 4104 | Dynamic pricing |
| 61 | **rez-ab-testing-service** | 4105 | Experiment management |

### Support & Admin Services (5)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 62 | **rez-admin-service** | - | Admin dashboard, management |
| 63 | **rez-knowledge-base-service** | - | KB articles, FAQ |
| 64 | **rez-observability** | - | Logging, metrics |
| 65 | **rez-ops-dashboard** | - | Operations monitoring |
| 66 | **rez-observability-system** | - | System observability |

### External/Partner Services (3)

| # | Service | Port | Purpose |
|---|---------|------|---------|
| 67 | **api-gateway** | 3000 | Main API gateway |
| 68 | **rez-core-platform** | - | Core platform services |
| 69 | **rez-utilities-platform** | - | Utility services |

---

## All Service Details

### 1. rez-auth-service (Port 4002)

**Purpose:** Central authentication and identity management

**Features:**
- Phone/OTP authentication
- JWT token generation and validation
- OAuth providers (Google, Apple)
- TOTP 2FA
- Device fingerprinting
- Session management
- Password reset flows
- Permission management
- Rate limiting

**APIs:** 20+ endpoints

**Dependencies:** MongoDB (rez_auth_dev), Redis

**Connected to:** All services (auth check)

---

### 2. rez-wallet-service (Port 4004)

**Purpose:** Digital wallet and coin management

**Features:**
- Multi-coin wallet (REZ, PROMO, BRANDED, PRIVE, CASHBACK, REFERRAL)
- Balance management
- Fund transfers (P2P, P2M, M2P)
- Transaction history
- Withdrawal processing
- Deposit handling
- Wallet limits and tiers
- Coin marketplace
- Coin bundles

**APIs:** 74 endpoints

**Dependencies:** MongoDB (rez_wallet_dev), Redis

**Connected to:** Auth, Payment, Karma, Order

---

### 3. rez-payment-service (Port 4001)

**Purpose:** Payment gateway and transaction processing

**Features:**
- Razorpay integration
- UPI payments
- Card payments
- Payment initiation and confirmation
- Refund processing
- Payment reconciliation
- Multiple currency support
- Payment webhooks
- Cron reconciliation jobs

**APIs:** 27 endpoints

**Dependencies:** MongoDB (rez_payment_dev), Redis

**Connected to:** Auth, Wallet, Order, Merchant

---

### 4. rez-order-service (Port 3006)

**Purpose:** Order lifecycle management

**Features:**
- Order creation and updates
- Order status tracking (11 states: created, confirmed, preparing, ready, dispatched, delivered, etc.)
- Order history
- Cancellation handling
- Refund initiation
- Shipping management
- Delivery tracking
- Order analytics

**APIs:** 50+ endpoints

**Dependencies:** MongoDB (rez_order_dev), Redis, BullMQ

**Connected to:** Auth, Payment, Merchant, Wallet

---

### 5. rez-merchant-service (Port 4005)

**Purpose:** Merchant operations and management

**Features:**
- Store management
- Product CRUD
- Category management
- KDS (Kitchen Display System)
- Staff management
- Location management
- Working hours
- Menu management
- QR code generation
- KYC verification
- Analytics dashboard
- Inventory alerts

**APIs:** 716 endpoints

**Dependencies:** MongoDB (rez_merchant_dev), Redis

**Connected to:** Auth, Order, Catalog, Search, Payment

---

### 6. rez-catalog-service (Port 4006)

**Purpose:** Product catalog management

**Features:**
- Product CRUD
- Category management
- Product variants
- Pricing management
- Inventory tracking
- Modifier groups
- Tax categories
- Image management
- Bulk operations
- Product search and filtering

**APIs:** 40+ endpoints

**Dependencies:** MongoDB (rez_catalog_dev), Redis

**Connected to:** Merchant, Search, Order

---

### 7. rez-search-service (Port 4003)

**Purpose:** Search and discovery

**Features:**
- Store search
- Product search
- Homepage feed
- Recommendations
- Autocomplete
- Filters (price, category, location)
- Geo-search
- Popular searches
- Search analytics

**APIs:** 36 endpoints

**Dependencies:** MongoDB (rez_search_dev), Redis

**Connected to:** All services (search requests)

---

### 8. rez-finance-service (Port 4006)

**Purpose:** Embedded finance and credit

**Features:**
- REZ Score (0-850)
- Loan application and processing
- BNPL (Buy Now Pay Later)
- Credit marketplace
- Risk engine
- Merchant financing
- GST invoicing
- Transaction limits
- Credit history

**APIs:** 42 endpoints

**Dependencies:** MongoDB (rez_finance_dev), Redis

**Connected to:** Auth, Wallet, Merchant

---

### 9. rez-intent-graph (Port 3007)

**Purpose:** AI-powered intent capture and tracking

**Features:**
- 82 event types (search, view, wishlist, cart_add, checkout, fulfilled, abandoned)
- Confidence scoring (weighted signals)
- Dormant intent detection (>7 days, <30% confidence)
- Revival score calculation
- Multi-app intent tracking
- RTMN Commerce Memory
- 8 Autonomous Agents

**APIs:** 50+ endpoints

**Dependencies:** MongoDB (rez_intent_graph), Redis

**Connected to:** All apps, Action Engine, Personalization

---

### 10. rez-intelligence-hub (Port 4020)

**Purpose:** Unified intelligence aggregation

**Features:**
- User intelligence aggregation
- Merchant intelligence
- Cross-app insights
- Real-time analytics
- Finance insights
- Business intelligence

**APIs:** 20+ endpoints

**Dependencies:** MongoDB (rez_intelligence)

**Connected to:** All AI services, Copilots

---

### 11. rez-personalization-engine (Port 4017)

**Purpose:** Product and content recommendations

**Features:**
- Collaborative filtering
- Content-based recommendations
- User behavior profiling
- A/B testing
- Personalization rules
- Category affinity
- Purchase prediction

**APIs:** 15+ endpoints

**Dependencies:** MongoDB (rez_personalization)

**Connected to:** Intent Graph, Search, Catalog

---

### 12. rez-targeting-engine (Port 3013)

**Purpose:** Audience segmentation and ad targeting

**Features:**
- User segmentation (9 segments)
- Demographic targeting
- Behavioral targeting
- Location targeting
- Frequency capping
- Campaign rules
- Audience preview

**APIs:** 20+ endpoints

**Dependencies:** MongoDB (rez_targeting), Redis

**Connected to:** Ads, Marketing, Intent Graph

---

### 13. rez-action-engine (Port 3014)

**Purpose:** Nudge delivery and action approval

**Features:**
- Nudge creation and delivery
- Approval workflows (SAFE, SEMI_SAFE, RISKY, FORBIDDEN)
- Channel execution (Push, Email, SMS, WhatsApp)
- Timing optimization
- Fatigue prevention
- Human-in-loop approval
- Action logging

**APIs:** 25+ endpoints

**Dependencies:** MongoDB (rez_action_engine), Redis

**Connected to:** Intent Graph, Copilots, Notifications

---

### 14. rez-consumer-copilot (Port 4021)

**Purpose:** AI shopping assistant

**Features:**
- 17 intent categories
- Sentiment analysis
- Product recommendations
- Order tracking
- Support escalation
- Personalized nudges
- Conversation history

**APIs:** 30+ endpoints

**Dependencies:** MongoDB, Redis

**Connected to:** Intent Graph, Merchant, Order

---

### 15. rez-merchant-copilot (Port 4022)

**Purpose:** Business intelligence assistant

**Features:**
- Sales analytics
- Inventory alerts
- Customer insights
- Competitor analysis
- Demand signals
- Revenue forecasting
- Performance optimization

**APIs:** 25+ endpoints

**Dependencies:** MongoDB

**Connected to:** Merchant, Order, Intelligence Hub

---

### 16. rez-karma-service (Port 3009)

**Purpose:** Gamification and rewards

**Features:**
- Karma points
- Tier system (Bronze, Silver, Gold, Platinum)
- Missions and quests
- Badges and achievements
- Leaderboard
- Point multipliers
- Referral rewards
- Challenge system

**APIs:** 71 endpoints

**Dependencies:** MongoDB (rez_karma_dev), Redis

**Connected to:** Auth, Wallet, Order, Merchant

---

### 17. rez-ads-service (Port 4007)

**Purpose:** Advertising platform

**Features:**
- Campaign management
- QR code campaigns
- Attribution tracking
- ROI measurement
- Ad inventory
- Bidding system
- Budget allocation
- Performance analytics

**APIs:** 10+ endpoints

**Dependencies:** MongoDB

**Connected to:** Targeting, Marketing, Wallet

---

### 18. rez-marketing (Port 4000)

**Purpose:** Multi-channel marketing

**Features:**
- WhatsApp broadcasts
- SMS campaigns
- Push notifications
- Email marketing
- Voucher management
- Audience segments
- Campaign scheduling
- A/B testing
- Analytics dashboard

**APIs:** 40+ endpoints

**Dependencies:** MongoDB (rez_marketing_dev), Redis, BullMQ

**Connected to:** Auth, Merchant, Targeting

---

### 19. rez-scheduler-service (Port 3012)

**Purpose:** Job scheduling and queue management

**Features:**
- BullMQ job queues
- Cron job management
- Delayed jobs
- Recurring tasks
- Job retry logic
- Priority queues

**APIs:** 10+ endpoints

**Dependencies:** Redis, MongoDB

**Connected to:** All services (job scheduling)

---

### 20. rez-feedback-service (Port 4010)

**Purpose:** Customer feedback collection

**Features:**
- Survey builder
- Star ratings
- Review management
- NPS scoring
- Sentiment analysis
- Feedback routing
- Response automation

**APIs:** 15+ endpoints

**Dependencies:** MongoDB (rez_feedback)

**Connected to:** Merchant, Order, Intelligence Hub

---

## All Connections & URLs

### Internal Service URLs

```
# Core Services
Auth Service:        http://localhost:4002
Wallet Service:      http://localhost:4004
Payment Service:    http://localhost:4001
Order Service:      http://localhost:3006
Merchant Service:   http://localhost:4005
Catalog Service:    http://localhost:4006
Search Service:     http://localhost:4003
Finance Service:    http://localhost:4006

# AI Services
Intent Graph:       http://localhost:3007
Intelligence Hub:   http://localhost:4020
Personalization:    http://localhost:4017
Targeting Engine:   http://localhost:3013
Action Engine:     http://localhost:3014
Consumer Copilot:   http://localhost:4021
Merchant Copilot:   http://localhost:4022
Support Copilot:    http://localhost:4033
Intent Service:     http://localhost:4009
Copilot:            http://localhost:4026
Decision Service:   http://localhost:4027

# Growth Services
Ads Service:        http://localhost:4007
Marketing:          http://localhost:4000
Karma Service:      http://localhost:3009
Feedback Service:   http://localhost:4010

# Operational Services
Scheduler Service:  http://localhost:3012
Automation Service: http://localhost:3016
Feedback Service:   http://localhost:4010
StayOwn Service:    http://localhost:4015
Corporate Service:  http://localhost:4030

# ML Infrastructure
Feature Store:      http://localhost:4100
Model Registry:     http://localhost:4101
Training Data:     http://localhost:4102
Fraud Detection:    http://localhost:4103
Price Optimization: http://localhost:4104
A/B Testing:       http://localhost:4105

# Revenue Services
BBPS Service:       http://localhost:4110
Recharge Service:   http://localhost:4111
E-Invoice Service:  http://localhost:4112

# Vertical Solutions
Hotel OTA API:      http://localhost:3000
Hotel Panel:        http://localhost:3002
Rendez Backend:     http://localhost:4000

# Frontend Apps
NextaBiZ Web:       http://localhost:3001
Hotel Panel:        http://localhost:3002
ReZ Now:           http://localhost:3003
AdBazaar:          http://localhost:3004

# Databases
MongoDB Primary:   localhost:27017
MongoDB Secondary:  localhost:27018
MongoDB Tertiary:   localhost:27019
Redis:              localhost:6379
PostgreSQL:         localhost:5432
```

### External URLs

```
# Production Domains
api.rez.money       - API Gateway
auth.rez.money      - Auth Service
wallet.rez.money    - Wallet Service
pay.rez.money       - Payment Service
mind.rez.money      - Intent Graph
now.rez.money       - ReZ Now (QR payments)
menu.rez.money      - Web Menu
verify.rez.money    - Product verification
try.rez.money       - ReZ Try

# Third-Party Services
Razorpay            - Payment Gateway
Twilio              - SMS
Resend              - Email
OneSignal           - Push Notifications
Google Maps         - Location
Cloudinary          - Image CDN
Sentry              - Error Tracking
```

---

## All Features

### Core Commerce Features

| Feature | Service | Status |
|---------|---------|--------|
| Phone OTP Login | Auth | Production |
| JWT Authentication | Auth | Production |
| OAuth (Google/Apple) | Auth | Production |
| TOTP 2FA | Auth | Production |
| Multi-coin Wallet | Wallet | Production |
| P2P Transfers | Wallet | Production |
| Razorpay Integration | Payment | Production |
| UPI Payments | Payment | Production |
| Refund Processing | Payment | Production |
| Order Lifecycle (11 states) | Order | Production |
| Store Management | Merchant | Production |
| Product Catalog | Catalog | Production |
| Full-text Search | Search | Production |
| Credit Score (0-850) | Finance | Production |
| BNPL | Finance | Production |
| GST Invoicing | Finance | Production |

### AI/Intelligence Features

| Feature | Service | Status |
|---------|---------|--------|
| Intent Capture (82 events) | Intent Graph | Production |
| Dormant Revival | Intent Graph | Production |
| 8 Autonomous Agents | Intent Graph | Production |
| User Profiling | Personalization | Production |
| Product Recommendations | Personalization | Production |
| Audience Segmentation | Targeting | Production |
| Frequency Capping | Targeting | Production |
| Nudge Delivery | Action Engine | Production |
| Approval Workflows | Action Engine | Production |
| 17 Intent Categories | Consumer Copilot | Production |
| Business Intelligence | Merchant Copilot | Production |
| Cross-app Insights | Intelligence Hub | Production |

### Growth & Marketing Features

| Feature | Service | Status |
|---------|---------|--------|
| Ad Campaigns | Ads | Production |
| QR Attribution | Ads | Production |
| WhatsApp Broadcasts | Marketing | Production |
| SMS Campaigns | Marketing | Production |
| Push Notifications | Marketing | Production |
| Karma Points | Karma | Production |
| Tier System | Karma | Production |
| Missions & Badges | Karma | Production |
| Star Ratings | Feedback | Production |
| NPS Scoring | Feedback | Production |

### Vertical Solution Features

| Feature | Service | Status |
|---------|---------|--------|
| Hotel Booking | Hotel OTA | Production |
| Room Inventory | Hotel OTA | Production |
| Menu QR | Hotel OTA | Production |
| Room Service QR | Hotel OTA | Production |
| Restaurant Ordering | Hotel OTA | Production |
| Corporate Accounts | Corporate | Production |
| Long-stay Bookings | StayOwn | Production |
| B2B Procurement | Procurement | Production |

### QR Systems (6 Types)

| # | System | URL Pattern | Use Case | Status |
|---|--------|------------|----------|--------|
| 1 | **Menu QR** | `menu.rez.money/{slug}` | Restaurant ordering | Production |
| 2 | **Store QR** | `now.rez.money/{slug}` | Merchant discovery/payment | Production |
| 3 | **Room QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel services | Production |
| 4 | **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Marketing attribution | Production |
| 5 | **Verify QR** | `verify.rez.money/s/{serial}` | Product authentication | Planned |
| 6 | **Creator QR** | `creator.rez.money/{creatorId}` | Social commerce | Planned |

### Mobile Apps

| App | Platform | Package | EAS Project | Status |
|-----|----------|---------|-------------|--------|
| **ReZ Consumer** | iOS/Android | money.rez.app | cf84e3b3-... | Needs Setup |
| **ReZ Merchant** | iOS/Android | com.rez.merchant | 77203219-... | Ready |
| **ReZ Karma** | iOS/Android | - | - | Built |
| **ReZ Now** | iOS/Android | - | - | Built |

### Web Applications

| App | Port | Description |
|-----|------|-------------|
| **NextaBiZ** | 3001 | Enterprise web app |
| **Hotel Panel** | 3002 | Hotel management |
| **ReZ Now** | 3003 | QR payments |
| **AdBazaar** | 3004 | Ad marketplace |
| **Rendez** | 4000 | Social platform |
| **CorpPerks** | - | Corporate rewards |

---

## Data Flow

### Order-to-Payment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Order   │────▶│ Payment  │────▶│ Wallet   │────▶│ Merchant │
│  Action  │     │ Service  │     │ Service  │     │ Service  │     │ Notified │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                  │                 │                  │
                      │                  │                 │                  │
                      ▼                  ▼                 ▼                  ▼
               order.created    payment.initiated    wallet.debited    order.completed
```

### AI Insight Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Intent  │────▶│Intelligence│───▶│ Personal │────▶│ Copilot  │
│  Query   │     │  Graph   │     │    Hub    │     │  Engine  │     │    UI    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                                         │
                      ▼                                                         ▼
              Intent captured                                           Insights displayed
```

### Nudge Flow (8 Autonomous Agents)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Event   │────▶│  Intent  │────▶│  Agent   │────▶│  Action  │────▶│ Channel  │
│ Capture  │     │  Graph   │     │  Swarm   │     │  Engine  │     │ Executor │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                           │                                  │
                                           ▼                                  ▼
                                    ┌──────────┐                     ┌──────────┐
                                    │  Learn   │                     │ Feedback │
                                    │  Loop    │                     │   Loop   │
                                    └──────────┘                     └──────────┘
```

### QR Attribution Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   QR     │────▶│  Intent  │────▶│  Karma   │────▶│  Wallet  │────▶│  MERCHANT│
│  Scan    │     │  Graph   │     │  Points  │     │  Coins   │     │ Revenue  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

---

## Technology Stack

### Languages & Frameworks

| Category | Language | Framework |
|----------|----------|-----------|
| Backend Services | TypeScript | Node.js, Express |
| Frontend (Web) | TypeScript | Next.js 16, React 19 |
| Frontend (Mobile) | TypeScript | React Native, Expo 55 |
| ML Pipeline | Python | FastAPI |
| Event Processing | TypeScript | NestJS |
| Data Services | TypeScript | Node.js |
| Analytics | Python | Django |

### Databases

| Database | Purpose | Services Using |
|----------|---------|----------------|
| **MongoDB** | Primary datastore | Auth, Wallet, Order, Payment, Merchant, Catalog, Finance, Karma |
| **PostgreSQL** | Relational data | Hotel OTA, CorpPerks, StayOwn, Rendez |
| **Redis** | Cache, Sessions, Queues | All services |
| **Elasticsearch** | Search, Logs | Logging, Analytics |

### Infrastructure

| Component | Technology |
|-----------|------------|
| Container | Docker, Docker Compose |
| Orchestration | Kubernetes |
| Service Mesh | Istio |
| API Gateway | Kong/Nginx |
| Message Broker | BullMQ |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack, Loki |
| Secrets | Environment Variables |

### External Services

| Service | Purpose |
|---------|---------|
| Razorpay | Payment gateway |
| Twilio | SMS |
| Resend | Email |
| OneSignal | Push notifications |
| Google Maps | Location/Maps |
| Cloudinary | Image CDN |
| Sentry | Error tracking |
| OpenTelemetry | Tracing |

---

## Database Architecture

### MongoDB Collections

```
rez_auth_dev
├── users
├── sessions
├── otp_logs
└── device_fingerprints

rez_wallet_dev
├── wallets
├── transactions
├── coin_balances
└── transfers

rez_payment_dev
├── payments
├── refunds
├── reconciliations
└── payment_methods

rez_order_dev
├── orders
├── order_items
├── shipments
└── order_timeline

rez_merchant_dev
├── merchants
├── locations
├── staff
├── kds_orders
└── kyc_documents

rez_catalog_dev
├── products
├── categories
├── modifiers
└── pricing_rules

rez_karma_dev
├── karma_points
├── missions
├── badges
├── leaderboard
└── user_tiers

rez_intent_graph
├── intents
├── signals
├── dormant_intents
└── agent_states

rez_marketing_dev
├── campaigns
├── broadcasts
├── vouchers
└── audience_segments

rez_feedback_dev
├── reviews
├── surveys
└── nps_responses
```

### PostgreSQL Schemas

```
hotel_ota_dev
├── hotels
├── rooms
├── bookings
├── guests
└── invoices

corpperks_dev
├── companies
├── employees
├── benefits
└── redemptions

rendez_dev
├── profiles
├── connections
├── messages
└── activities
```

---

## The 8 Autonomous Agents

| # | Agent | Schedule | Purpose |
|---|-------|----------|---------|
| 1 | **DemandSignalAgent** | Every 5 min | Aggregate demand per merchant/category |
| 2 | **ScarcityAgent** | Every 1 min | Supply/demand ratios, urgency alerts |
| 3 | **PersonalizationAgent** | Event-driven | User response profiling, A/B testing |
| 4 | **AttributionAgent** | Event-driven | Multi-touch conversion attribution |
| 5 | **AdaptiveScoringAgent** | Hourly | ML retraining of intent scoring |
| 6 | **FeedbackLoopAgent** | Event-driven | Closed-loop optimization, drift detection |
| 7 | **NetworkEffectAgent** | Daily | Collaborative filtering, user similarity |
| 8 | **RevenueAttributionAgent** | Every 15 min | GMV tracking, ROI per agent/nudge |

---

## Shared Packages (20+)

| Package | Purpose |
|---------|---------|
| `@rez/shared-types` | Canonical TypeScript types, Zod schemas, FSM helpers |
| `@rez/ai-types` | AI types for intent, targeting, actions |
| `rez-api-sdk` | TypeScript API SDK |
| `rez-shared` | Shared utilities |
| `rez-auth` | Authentication utilities |
| `rez-chat-ai` | Chat AI |
| `rez-intent-capture-sdk` | Intent SDK |
| `rez-loyalty-client` | Loyalty system |
| `rez-merchant-sdk` | Merchant SDK |
| `rez-qr-sdk` | QR generation |
| `rez-socket-client` | Socket.IO client |
| `rez-brand-tokens` | Design tokens |
| `rez-chat-service` | Chat backend |
| `rez-chat-integration` | Chat integrations |
| `rez-agent-memory` | Agent memory |
| `rez-ui` | Shared UI components |

---

## ML Models

| Model | Algorithm | Location |
|-------|-----------|----------|
| **Fraud Detection** | Logistic Regression | `src/lib/fraud/` |
| **Recommendation** | Matrix Factorization | `ml/models/recommendation-model.js` |
| **Price Optimization** | Demand Elasticity | `ml/models/price-model.js` |
| **Intent Scoring** | Weighted Signals | `rez-intent-graph/` |

---

## Coin Economy (6 Types)

| Type | Expiry | Redeemable |
|------|--------|-------------|
| REZ | Never | Yes |
| PROMO | 90 days | Yes |
| BRANDED | 180 days | Brand only |
| PRIVE | 365 days | Yes |
| CASHBACK | 365 days | Yes |
| REFERRAL | 180 days | Yes |

---

## API Reference

### Total APIs: 1000+

| Service | APIs | Port |
|---------|------|------|
| Merchant | 716 | 4005 |
| Wallet | 74 | 4004 |
| Karma | 71 | 3009 |
| Finance | 42 | 4006 |
| Search | 36 | 4003 |
| Payment | 27 | 4001 |
| Auth | 20+ | 4002 |
| Intent Graph | 50+ | 3007 |
| Marketing | 40+ | 4000 |

---

## Deployment

### Docker Compose

```bash
# Full stack
docker-compose -f docker-compose.yml up -d

# Backend only
docker-compose up -d auth-api merchant-api rendez-backend

# Frontend only
docker-compose up -d nextabizz-web hotel-panel

# With dependencies
docker-compose up -d mongodb-primary redis postgres
```

### Environment Variables

```bash
# Core
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret

# Payment
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx

# Notifications
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
RESEND_API_KEY=xxx

# External Services
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
SENTRY_DSN=xxx
```

---

## Quick Reference

### Start All Services

```bash
./scripts/deploy-all.sh
```

### Health Check

```bash
./scripts/health-all.sh
```

### Key Ports

| Range | Purpose |
|-------|---------|
| 3000-3099 | Frontend apps |
| 4000-4099 | Backend services |
| 4100-4199 | ML infrastructure |
| 27017-27019 | MongoDB |
| 6379 | Redis |
| 5432 | PostgreSQL |

---

**Document Version:** 1.0.0
**Last Updated:** May 4, 2026
**Total Services Documented:** 50+
**Maintained by:** ReZ Engineering Team
