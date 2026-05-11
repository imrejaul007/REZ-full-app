# REZ ECOSYSTEM - FINAL MASTER CONSOLIDATION REPORT

**Generated:** 2026-05-06
**Status:** COMPLETE
**Scope:** All Services, Features, Connections, Databases, External APIs

---

## TABLE OF CONTENTS

1. [ALL Services (Complete List)](#1-all-services-complete-list)
2. [ALL Features (What Each Service Does)](#2-all-features-what-each-service-does)
3. [ALL Connections (What Connects to What)](#3-all-connections-what-connects-to-what)
4. [ALL Databases](#4-all-databases)
5. [ALL External APIs](#5-all-external-apis)
6. [Recommended Consolidation](#6-recommended-consolidation)
7. [What CANNOT Be Merged (Reasons)](#7-what-cannot-be-merged-reasons)
8. [Migration Plan](#8-migration-plan)
9. [Rollback Plan](#9-rollback-plan)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. ALL SERVICES (COMPLETE LIST)

### 1.1 Consumer-Facing Mobile Apps

| # | Service Name | Technology | Port | Purpose |
|---|-------------|------------|------|---------|
| 1 | `rez-app-consumer` | Expo SDK 53, React Native 0.79 | N/A | End-user app: discover, order, pay, earn coins |
| 2 | `rez-app-merchant` | Expo SDK 55, React Native 0.76 | N/A | Merchant app: POS, orders, analytics |
| 3 | `rez-app-admin` | Expo SDK 53, React Native 0.79 | N/A | Admin app: moderation, support, operations |

### 1.2 Web Applications

| # | Service Name | Technology | Port | Purpose |
|---|-------------|------------|------|---------|
| 4 | `rez-now` | Next.js 16, React 19, Tailwind | N/A | Merchant QR payment + public store pages |
| 5 | `REZ-admin-dashboard` | Static HTML | N/A | Static admin dashboard (placeholder) |

### 1.3 Core Backend Services

| # | Service Name | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---|-------------|------|-----------|---------|-------|--------|---------|
| 6 | `rez-auth-service` | 4002 | Yes | Yes | Yes | Yes | Auth, OTP, JWT, MFA, OAuth2 |
| 7 | `rez-wallet-service` | 4004 | Yes | Yes | Yes | Yes | Wallet, balance, transfers, BNPL |
| 8 | `rez-order-service` | 3006 | Yes | Yes | Yes | Yes | Order processing, lifecycle |
| 9 | `rez-payment-service` | 4001 | Yes | Yes | Yes | Yes | Razorpay, refunds, webhooks |
| 10 | `rez-merchant-service` | 4005 | Yes | Yes | Yes | No | Merchant management, analytics |
| 11 | `rez-catalog-service` | 3005 | Yes | Yes | Yes | Yes | Product catalog, menu |
| 12 | `rez-search-service` | 4003 | Yes | Yes | Yes | No | Search, recommendations |
| 13 | `rez-api-gateway` | N/A | Mixed | No | No | No | Routing, rate limiting, auth validation |

### 1.4 Growth Services

| # | Service Name | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---|-------------|------|-----------|---------|-------|--------|---------|
| 14 | `rez-gamification-service` | 3001 | Yes | Yes | Yes | Yes | Achievements, streaks, missions |
| 15 | `rez-ads-service` | 4007 | Yes | Yes | Yes | No | Ad campaign management |
| 16 | `rez-marketing-service` | 4000 | Yes | Yes | Yes | Yes | Multi-channel campaigns, WhatsApp, SMS |
| 17 | `rez-karma-service` | 3009 | Yes | Yes | Yes | Yes | Impact economy, civic corps, karma score |

### 1.5 Business Services

| # | Service Name | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---|-------------|------|-----------|---------|-------|--------|---------|
| 18 | `rez-finance-service` | 4006 | Yes | Yes | Yes | Yes | Credit, loans, BNPL, bill pay |
| 19 | `rez-corpperks-service` | 4013 | No | Yes | Yes | No | Enterprise benefits management |
| 20 | `rez-hotel-service` | 4015 | No | Yes | No | No | Hotel OTA (Makcorps integration) |
| 21 | `rez-procurement-service` | 4012 | No | Yes | No | No | Procurement (NextaBizz integration) |

### 1.6 AI/Intelligence Services

| # | Service Name | Port | Purpose |
|---|-------------|------|---------|
| 22 | `rez-intent-graph` | 3001 | Intent tracking, 8 autonomous AI agents |
| 23 | `rez-insights-service` | 3003 | AI-powered insights storage |
| 24 | `rez-automation-service` | 3004 | Rule engine for automation |
| 25 | `rez-user-intelligence` | 4008 | User analytics and profiling |
| 26 | `rez-intent-predictor` | - | Real-time intent prediction |
| 27 | `rez-targeting-engine` | - | Ad/notification targeting |
| 28 | `rez-action-engine` | - | Decision execution for automated actions |

### 1.7 Infrastructure Services

| # | Service Name | Port | Purpose |
|---|-------------|------|---------|
| 29 | `rez-scheduler-service` | 3012 | Centralized job scheduling |
| 30 | `rez-feedback-service` | 4010 | User feedback collection |
| 31 | `rez-knowledge-base-service` | 4011 | Knowledge base articles |
| 32 | `rez-notification-events` | 4016 | Push notifications |
| 33 | `rez-media-events` | 4017 | Media event processing |
| 34 | `rez-push-service` | 4018 | Push notification delivery |
| 35 | `rez-ops-dashboard` | 4020 | Feature flags, system health |
| 36 | `rez-ad-platform` | 4028 | Unified ad platform |

### 1.8 AI Copilots

| # | Service Name | Port | Purpose |
|---|-------------|------|---------|
| 37 | `REZ-support-copilot` | 4024 | Customer support AI |
| 38 | `REZ-merchant-copilot` | 4025 | Merchant AI assistant |
| 39 | `rez-ad-copilot` | 4026 | AI-powered ad assistant |

### 1.9 Vertical/External Apps

| # | Service Name | Technology | Database | Purpose |
|---|-------------|------------|----------|---------|
| 40 | `Hotel OTA` (7 apps) | Next.js, React Native | PostgreSQL | Hotel booking ecosystem |
| 41 | `Rendez` | Expo, Node.js | PostgreSQL | Social/dating platform |
| 42 | `adBazaar` | Next.js | Supabase | Ad marketplace |
| 43 | `adsqr` | Next.js | Supabase | QR-based campaigns |
| 44 | `NextaBiZ` | Next.js, Turborepo | Supabase | B2B procurement |
| 45 | `CorpPerks` | Node.js | MongoDB | Corporate benefits |
| 46 | `verify-service` | Next.js | Prisma | QR verification, coins |

### 1.10 Shared Libraries/Packages

| # | Package Name | Purpose | Published |
|---|-------------|---------|-----------|
| 47 | `rez-shared` | Core utilities, types, schemas | Yes |
| 48 | `@rez/shared-types` | TypeScript interfaces, Zod schemas | Yes |
| 49 | `@rez/service-core` | Microservice infrastructure | No |
| 50 | `@rez/ui` | UI components | No |
| 51 | `@rez/metrics` | Prometheus middleware | No (empty) |
| 52 | `@rez/agent-memory` | Agent memory (Supabase, Redis) | No |
| 53 | `@rez/intent-capture-sdk` | Intent Capture SDK | No |
| 54 | `@rez/chat` | Real-time chat | No |
| 55 | `@rez/chat-ai` | AI chat (Anthropic) | No |
| 56 | `rez-contracts` | API contracts | No (broken) |

### 1.11 Legacy/Monolith Services

| # | Service Name | Status |
|---|-------------|--------|
| 57 | `rezbackend/rez-backend-master` | Legacy monolith (350+ models) |
| 58 | `rez-adbazaar` | Legacy MongoDB service |
| 59 | `adsos` | Research (DOOH screen network) |
| 60 | `adBazaar-creator` | Planned (influencer campaigns) |

---

## 2. ALL FEATURES (WHAT EACH SERVICE DOES)

### 2.1 Consumer App Features (617 screens)

| Category | Features |
|----------|----------|
| **Authentication** | Phone OTP, Email/Password, Guest Mode, PIN, Biometric, Session Management |
| **Wallet & Coins** | Balance, Transactions, Recharge, REZ Cash, Savings Goals, Gold, Bill Payment, Bill Upload |
| **Discovery** | Search, Categories, Map, Near-U, Explore Feed, Brand Stores |
| **Ordering** | Cart, Checkout, Payment (Razorpay), Order Tracking, Booking |
| **Loyalty** | Loyalty Program, Punch Cards, Branded Coins, Coupons, Vouchers, Cashback |
| **Earn Coins** | Scan & Earn, Social Sharing, Referral, Store Visit, Bill Upload, Scratch Card, Spin |
| **Games** | Missions, Weekly Challenge, Achievements, Leaderboard, Arcade Games |
| **Travel** | Flights, Hotels, Trains, Bus, Cab, Packages |
| **Home Services** | Plumber, Electrician, Salon, Spa |
| **Social** | Friends, Events, Challenges, Creator Dashboard, UGC |
| **Content** | Reviews, Articles, Social Feed, Social Impact |

### 2.2 Merchant App Features (280 routes)

| Category | Features |
|----------|----------|
| **Dashboard** | Analytics, Overview Stats, Key Metrics |
| **Orders** | Order Management, Real-time Tracking |
| **POS** | Point of Sale, Billing, Invoicing |
| **Catalog** | Product Management, Categories, Modifiers |
| **CRM** | Customer List, Loyalty Management |
| **Team** | Staff Management, RBAC, Shifts |
| **Analytics** | Sales Reports, Customer Insights |
| **KDS** | Kitchen Display System |
| **Khata** | Credit Book |
| **Finance** | Settlements, GST, Invoices |
| **Social Impact** | Events, Volunteer Management |

### 2.3 Service Feature Matrix

| Service | Key Features |
|---------|-------------|
| **rez-auth-service** | JWT tokens, OTP generation/verification, MFA (TOTP), OAuth2, Session management, Device fingerprint, Token blacklist |
| **rez-wallet-service** | Balance management, Credit/debit, BRANDED/PROMO/PRIVE/CASHBACK/REFERRAL coins, BNPL, Expiry processing, Reconciliation |
| **rez-order-service** | Order lifecycle, State machine, SSE updates, Cursor pagination, Idempotency, Profile integration |
| **rez-payment-service** | Razorpay integration, Payment initiation, Capture, Refund, Webhooks, DLQ processing, State machine |
| **rez-merchant-service** | Store management, Menu, Analytics, Payroll, Payouts, Karma integration, OTP auth, QR generation |
| **rez-catalog-service** | Products, Categories, Store catalog, Cache invalidation, BullMQ workers |
| **rez-search-service** | Store search, Product search, Recommendations, AI-powered relevance |
| **rez-gamification-service** | Achievements, Streaks, Missions, Leaderboards, Points, Badges |
| **rez-ads-service** | Campaign CRUD, Placements, Click tracking, Impression tracking, Attribution, Budget management |
| **rez-marketing-service** | WhatsApp campaigns, SMS/Email, Push notifications, Vouchers, Audience management, BullMQ scheduling |
| **rez-karma-service** | Karma score (300-900), Level thresholds (L1-L4), Conversion to coins, Verification engine, Weekly batch |
| **rez-finance-service** | BNPL loans, Credit limits, Bill payment, Expense tracking |
| **rez-intent-graph** | Intent capture, Dormant intents, Cross-app profiles, 8 AI agents (DemandSignal, Scarcity, Personalization, etc.) |
| **rez-corpperks-service** | Benefits management, HRIS sync, Hotel bookings, GST invoicing |
| **rez-ops-dashboard** | Feature flags, Health monitoring, Quick actions |
| **REZ-support-copilot** | Customer support AI, Order queries, Search integration |
| **REZ-merchant-copilot** | Merchant AI assistant, Dashboard insights, Order webhooks |
| **Hotel OTA** | Room booking, Hotel management, Corporate accounts, PMS integration |

---

## 3. ALL CONNECTIONS (WHAT CONNECTS TO WHAT)

### 3.1 Consumer App Connection Map

```
rez-app-consumer
    │
    ├─► rez-api-gateway (https://rez-api-gateway.onrender.com/api)
    │       │
    │       ├─► rez-auth-service (4002)
    │       │       └─► MongoDB, Redis, JWT verification
    │       │
    │       ├─► rez-wallet-service (4004)
    │       │       └─► MongoDB, Redis, Ledger
    │       │
    │       ├─► rez-payment-service (4001)
    │       │       └─► MongoDB, Redis, Razorpay
    │       │
    │       ├─► rez-order-service (3006)
    │       │       ├─► MongoDB, Redis, BullMQ
    │       │       └─► rez-intent-graph
    │       │
    │       ├─► rez-catalog-service (3005)
    │       │       └─► MongoDB, Redis, BullMQ
    │       │
    │       ├─► rez-search-service (4003)
    │       │       └─► MongoDB, Redis
    │       │
    │       ├─► rez-gamification-service (3001)
    │       │       └─► MongoDB, Redis, BullMQ
    │       │
    │       └─► rez-marketing-service (4000)
    │               └─► MongoDB, Redis, WhatsApp/SMS/Email
    │
    └─► Socket.IO (real-time)
            └─► rez-backend-8dfu.onrender.com
```

### 3.2 Merchant App Connection Map

```
rez-app-merchant
    │
    ├─► rez-api-gateway
    │       └─► rez-merchant-service (4005)
    │               ├─► MongoDB, Redis
    │               ├─► rez-wallet-service (branded coins)
    │               └─► rez-order-service
    │
    ├─► rez-merchant-service (direct)
    │
    └─► Socket.IO
            └─► rez-backend-8dfu.onrender.com
```

### 3.3 Admin App Connection Map

```
rez-app-admin
    │
    ├─► rez-api-gateway
    │       ├─► rez-auth-service
    │       ├─► rez-merchant-service
    │       ├─► rez-wallet-service
    │       └─► rez-order-service
    │
    ├─► analytics-events
    │
    └─► Socket.IO
            └─► rez-backend-8dfu.onrender.com
```

### 3.4 Hotel OTA Connection Map

```
Hotel OTA Frontend Apps
    │
    ├─► Hotel OTA API
    │       ├─► PostgreSQL (Prisma)
    │       ├─► Redis
    │       ├─► BullMQ
    │       ├─► Socket.IO
    │       │
    │       ├─► REZ Auth Service (SSO)
    │       ├─► REZ Wallet Service (coin balance)
    │       └─► REZ Finance Service
    │
    └─► PMS Integration
            └─► Makcorps API
```

### 3.5 Intent Graph Connection Map

```
rez-intent-graph (3001)
    │
    ├─► MongoDB (intents, dormant, profiles)
    ├─► Redis (cache, rate limiting)
    │
    ├─► External Services:
    │       ├─► rez-wallet-service
    │       ├─► rez-order-service
    │       ├─► rez-merchant-service
    │       ├─► Hotel PMS
    │
    └─► 8 AI Agents (autonomous):
            ├─► DemandSignalAgent (5 min)
            ├─► ScarcityAgent (1 min)
            ├─► PersonalizationAgent (1 min)
            ├─► AttributionAgent (30 min)
            ├─► AdaptiveScoringAgent (1 hr)
            ├─► FeedbackLoopAgent (1 hr)
            ├─► NetworkEffectAgent (24 hr)
            └─► RevenueAttributionAgent (15 min)
```

### 3.6 Service-to-Service Authentication

| Consumer | Provider | Auth Method |
|----------|----------|-------------|
| All services | rez-auth-service | JWT verification |
| rez-order-service | rez-merchant-service | HMAC-SHA256 |
| rez-order-service | rez-wallet-service | HMAC-SHA256 |
| rez-payment-service | rez-wallet-service | HMAC-SHA256 |
| rez-catalog-service | rez-order-service | Internal token |
| rez-intent-graph | All services | Internal token |

### 3.7 Event Bus (50 Event Types)

```
Event Categories:
├─ User events (signup, login, profile_update)
├─ Order events (placed, confirmed, fulfilled, cancelled)
├─ Payment events (initiated, completed, failed, refunded)
├─ Wallet events (credited, debited, expired)
├─ Inventory events (stock_update, low_stock)
├─ Hotel events (booking_created, checked_in, checked_out)
├─ AI/Insights events (intent_captured, nudge_sent)
├─ Automation events (rule_triggered, action_executed)
├─ Notification events (sent, delivered, failed)
└─ System events (service_up, service_down)
```

---

## 4. ALL DATABASES

### 4.1 MongoDB Databases

| # | Database Name | Services Using | Collections | Purpose |
|---|--------------|---------------|-------------|---------|
| 1 | `rez_auth` | rez-auth-service | users, profiles, refresh_tokens, mfa_secrets | Authentication |
| 2 | `rez_wallet` | rez-wallet-service | wallets, ledger_entries, transactions | Financial |
| 3 | `rez_orders` | rez-order-service, rez-backend | orders, order_items, timelines | Order lifecycle |
| 4 | `rez_payments` | rez-payment-service | payments, refunds, webhooks | Payment processing |
| 5 | `rez_merchant` | rez-merchant-service | merchants, stores, products, team, analytics | Merchant ops |
| 6 | `rez_catalog` | rez-catalog-service | products, categories, menus | Product catalog |
| 7 | `rez_intents` | rez-intent-graph | intents, dormant_intents, profiles, signals | AI intelligence |
| 8 | `rez_gamification` | rez-gamification-service | achievements, streaks, missions, leaderboards | Gamification |
| 9 | `rez_ads` | rez-ads-service | campaigns, placements, interactions | Advertising |
| 10 | `rez_marketing` | rez-marketing-service | campaigns, vouchers, audiences | Marketing |
| 11 | `rez_karma` | rez-karma-service | profiles, events, badges, verifications | Karma system |
| 12 | `rez_finance` | rez-finance-service | transactions, credit_limits, bnpl | Finance/BNPL |
| 13 | `rez_corpperks` | rez-corpperks-service | benefits, employees, enrollments | Corporate benefits |
| 14 | `rez_corporate` | rez-corporate-service | cards, gst_invoices, travel_bookings | Corporate ops |
| 15 | `rez_insights` | rez-insights-service | insights, aggregations | Analytics |
| 16 | `rez_feedback` | rez-feedback-service | feedback, patterns | User feedback |
| 17 | `rez_knowledge` | rez-knowledge-base-service | articles, categories | KB |
| 18 | `rez_automation` | rez-automation-service | rules, triggers, executions | Automation |
| 19 | `rez_scheduler` | rez-scheduler-service | jobs, schedules | Job scheduling |
| 20 | `rez_backend` | rez-backend | 350+ collections (legacy) | Legacy monolith |

### 4.2 PostgreSQL Databases

| # | Database | Services Using | Purpose |
|---|----------|---------------|---------|
| 1 | `hotel_ota` | Hotel OTA API (Prisma) | Hotel bookings, users, companies |
| 2 | `hotel_pms` | Hotel PMS | Property management |
| 3 | `rendez` | Rendez backend (Prisma) | Social platform |
| 4 | `adbazaar` | adBazaar (Supabase) | Ad marketplace |
| 5 | `adsqr` | adsqr (Supabase) | QR campaigns |

### 4.3 Redis Databases

| # | Database | Services | Purpose |
|---|----------|----------|---------|
| 1 | Cache | All services | Response caching |
| 2 | Rate limiting | All services | Distributed rate limiting |
| 3 | Sessions | rez-auth-service | Token blacklist, sessions |
| 4 | BullMQ | Multiple | Job queues |
| 5 | Socket.IO | rez-backend, Hotel OTA | Real-time, pub/sub |

### 4.4 Database Connection Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │    MONGODB      │    │   POSTGRESQL    │                    │
│  │   (20+ DBs)     │    │   (5+ DBs)      │                    │
│  │                 │    │                 │                    │
│  │ - rez_auth      │    │ - hotel_ota     │                    │
│  │ - rez_wallet    │    │ - rendez        │                    │
│  │ - rez_orders    │    │ - adbazaar      │                    │
│  │ - rez_payments  │    │ - adsqr         │                    │
│  │ - rez_merchant  │    │ - hotel_pms     │                    │
│  │ - rez_catalog   │    │                 │                    │
│  │ - rez_intents   │    └─────────────────┘                    │
│  │ - rez_* (etc)   │                                              │
│  └────────┬────────┘                                              │
│           │                                                        │
│           ▼                                                        │
│  ┌─────────────────┐                                              │
│  │     REDIS       │                                              │
│  │   (5+ DBs)     │                                              │
│  │                 │                                              │
│  │ - Cache         │                                              │
│  │ - Rate Limit    │                                              │
│  │ - Sessions      │                                              │
│  │ - BullMQ       │                                              │
│  │ - Socket.IO    │                                              │
│  └─────────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. ALL EXTERNAL APIs

### 5.1 Payment APIs

| Provider | Usage | Service |
|----------|-------|---------|
| **Razorpay** | Payment gateway | rez-payment-service, rez-now |
| **Stripe** | Payments | NextaBiZ |
| **Razorpay (Wallet)** | Coin recharge | rez-wallet-service |

### 5.2 Communication APIs

| Provider | Usage | Service |
|----------|-------|---------|
| **WhatsApp Business API** | Marketing campaigns | rez-marketing-service |
| **Twilio** | SMS OTP | rez-auth-service |
| **MSG91** | SMS fallback | rez-auth-service |
| **Firebase Cloud Messaging** | Push notifications | rez-marketing-service |
| **AWS SES** | Email | rez-marketing-service |

### 5.3 Authentication APIs

| Provider | Usage | Service |
|----------|-------|---------|
| **OAuth2 Partners** | SSO | rez-auth-service |

### 5.4 Travel APIs

| Provider | Usage | Service |
|----------|-------|---------|
| **Makcorps OTA** | Hotel bookings | rez-hotel-service, Hotel OTA |

### 5.5 Cloud Services

| Provider | Usage | Service |
|----------|-------|---------|
| **MongoDB Atlas** | Database hosting | All MongoDB services |
| **Render.com** | Service hosting | All services |
| **Vercel** | Web app hosting | rez-now, adBazaar, adsqr |
| **Supabase** | Database + Auth | adBazaar, adsqr, NextaBiZ |
| **Cloudflare** | CDN, WAF | API Gateway |
| **Sentry** | Error tracking | All services |
| **OpenAI** | AI responses | REZ-support-copilot |
| **Anthropic** | AI chat | @rez/chat-ai |

### 5.6 External API Summary Table

| Category | APIs | Status |
|----------|------|--------|
| Payments | Razorpay, Stripe | Production |
| Communication | WhatsApp, Twilio, MSG91, Firebase, SES | Production |
| Travel | Makcorps OTA | Production |
| Cloud | MongoDB Atlas, Render, Vercel, Supabase, Cloudflare | Production |
| AI | OpenAI, Anthropic | Production |

---

## 6. RECOMMENDED CONSOLIDATION

### 6.1 Services That CAN Be Merged Safely

#### HIGH PRIORITY (Recommended)

| Current Services | Proposed Merge | Rationale | Risk Level |
|-----------------|----------------|-----------|------------|
| `adsqr` + `adBazaar` | Merge into `rez-ad-platform` | Duplicate QR campaign features, same Supabase backend | Low |
| `rez-ad-platform` + `rez-ads-service` | Create unified `rez-ads-v2` | Both handle ad campaigns; consolidate into one | Medium |
| `REZ-support-copilot` + `REZ-merchant-copilot` | Merge into `REZ-copilot` | Similar AI architecture, shared intent handling | Low |
| `rez-knowledge-base-service` + `rez-feedback-service` | Merge into `rez-support-service` | Both support customer interactions | Low |

#### MEDIUM PRIORITY

| Current Services | Proposed Merge | Rationale | Risk Level |
|-----------------|----------------|-----------|------------|
| `rez-notification-events` + `rez-push-service` | Merge into `rez-notifications` | Duplicate notification delivery | Medium |
| `rez-media-events` + `rez-insights-service` | Merge into `rez-analytics` | Both process/store analytics events | Medium |
| `@rez/metrics` + `rez-ops-dashboard` | Merge into `rez-monitoring` | Metrics collection and display | Low |

#### LOW PRIORITY

| Current Services | Proposed Merge | Rationale | Risk Level |
|-----------------|----------------|-----------|------------|
| Multiple `*Events` services | Consolidate into `rez-event-bus` | Centralized event processing | Medium |
| `rez-targeting-engine` + `rez-action-engine` | Merge into `rez-intent-graph` | Both serve AI/intent pipeline | Low |

### 6.2 Consolidation Roadmap

```
Phase 1 (Month 1-2):
├─ Merge adsqr + adBazaar → rez-ad-platform
├─ Merge REZ-support-copilot + REZ-merchant-copilot → REZ-copilot
└─ Merge rez-knowledge-base + rez-feedback → rez-support-service

Phase 2 (Month 3-4):
├─ Merge rez-notification-events + rez-push-service → rez-notifications
├─ Merge rez-ad-platform + rez-ads-service → rez-ads-v2
└─ Create unified event bus (rez-event-bus)

Phase 3 (Month 5-6):
├─ Migrate legacy `rezbackend` functionality to microservices
├─ Consolidate duplicate models across services
└─ Standardize shared packages (@rez/shared, @rez/shared-types)
```

### 6.3 Database Consolidation Opportunities

| Current | Proposed | Rationale |
|---------|----------|-----------|
| Multiple auth collections | Single `users` collection with discriminator | Reduce duplication |
| `rez_intents` + `rez_insights` | Single analytics database | Unified AI pipeline |
| `hotel_ota` + `hotel_pms` | Single hotel database | Consolidate hotel stack |

---

## 7. WHAT CANNOT BE MERGED (REASONS)

### 7.1 Services That Must Remain Separate

| Service | Reason For Separation | Isolation Requirement |
|---------|----------------------|---------------------|
| **rez-auth-service** | Security boundary, JWT verification, OTP handling | Cannot share auth with other services |
| **rez-wallet-service** | Financial regulations, double-entry ledger | Must maintain transaction integrity |
| **rez-payment-service** | PCI compliance, Razorpay integration | Payment isolation required |
| **rez-order-service** | Order lifecycle state machine | Core business logic isolation |
| **rez-intent-graph** | 8 autonomous AI agents, self-governing | Cannot merge with non-AI services |
| **Hotel OTA** | Separate business entity, different DB | Different regulatory requirements |
| **Rendez** | Different product vertical, separate team | Social/dating is separate business |
| **CorpPerks** | Enterprise B2B, separate billing | Corporate compliance requirements |

### 7.2 Technical Barriers to Consolidation

| Barrier | Description | Impact |
|---------|-------------|--------|
| **Database Coupling** | `rez-backend` (350+ models) tightly coupled | Cannot extract without major refactor |
| **Different Tech Stacks** | Some services use JS, others TypeScript | Type safety concerns |
| **Real-time Dependencies** | Socket.IO shared state across services | Merging would break real-time |
| **Rate Limiting** | Each service has different limits | Standardization required first |
| **Authentication Vectors** | Different auth patterns (JWT, HMAC, API keys) | Must unify first |

### 7.3 Business Barriers to Consolidation

| Barrier | Description | Impact |
|---------|-------------|--------|
| **Team Ownership** | Different teams own different services | Organizational change required |
| **SLA Differences** | Wallet/Payment have 99.99%, others 99.9% | Different reliability targets |
| **Geographic Distribution** | Some services deployed regionally | Latency concerns |
| **Compliance Requirements** | Finance services have stricter compliance | Cannot mix with non-compliant |

### 7.4 Services With CRITICAL Issues (Must Fix Before Any Consolidation)

| Service | Critical Issue | Status |
|---------|----------------|--------|
| **rez-corporate-service** | Missing authentication, CORS wildcard, hardcoded secrets | OPEN |
| **CorpPerks** | Missing auth middleware file | OPEN |
| **rez-ops-dashboard** | No authentication on feature flag toggle | OPEN |
| **REZ-admin-dashboard** | Only static HTML, no implementation | NOT IMPLEMENTED |

---

## 8. MIGRATION PLAN

### 8.1 Pre-Migration Checklist

- [ ] All 84 security issues from MASTER-AUDIT-2026.md resolved
- [ ] Critical issues in rez-corporate-service fixed
- [ ] CorpPerks auth middleware created
- [ ] rez-ops-dashboard authentication added
- [ ] All services have health checks
- [ ] All services have graceful shutdown
- [ ] Database backups verified
- [ ] Rollback procedures documented
- [ ] Load testing completed
- [ ] Staging environment mirrors production

### 8.2 Phase 1: Infrastructure Preparation (Week 1-2)

```
1. Set up monitoring/observability
   ├─ Prometheus metrics on all services
   ├─ Grafana dashboards
   ├─ Structured logging (ELK/Loki)
   └─ Alerting rules

2. Prepare new consolidated service environments
   ├─ Create new Docker images
   ├─ Set up Kubernetes/Render deployments
   └─ Configure environment variables

3. Database migration preparation
   ├─ Create migration scripts
   ├─ Test migration on staging
   └─ Prepare rollback scripts
```

### 8.3 Phase 2: Feature Flag Based Migration (Week 3-4)

```
1. Deploy consolidated service in shadow mode
   ├─ New service receives traffic but doesn't process
   └─ Compare outputs between old and new

2. Enable feature flag for small percentage (5%)
   ├─ Monitor error rates
   ├─ Monitor latency
   └─ Compare business metrics

3. Gradual traffic shift
   ├─ 5% → 10% → 25% → 50% → 100%
   └─ Monitor at each step

4. Rollback trigger points
   ├─ Error rate > 1%
   ├─ Latency increase > 20%
   └─ Business metrics degraded
```

### 8.4 Phase 3: Data Migration (Week 5-6)

```
1. Backfill historical data
   ├─ Migrate in batches
   ├─ Verify data integrity
   └─ Update references

2. Switch read operations
   ├─ New service becomes primary
   └─ Old service in read-only mode

3. Switch write operations
   ├─ Atomic cutover
   └─ Verify all writes succeeded

4. Decommission old service
   ├─ Wait for pending requests
   ├─ Stop old service
   └─ Remove from load balancer
```

### 8.5 Phase 4: Post-Migration (Week 7-8)

```
1. Verify all functionality
   ├─ Run integration tests
   ├─ Run E2E tests
   ├─ Manual QA
   └─ User acceptance testing

2. Performance verification
   ├─ Load testing
   ├─ Latency benchmarks
   └─ Resource utilization

3. Documentation updates
   ├─ Update API docs
   ├─ Update architecture diagrams
   ├─ Update runbooks
   └─ Update onboarding docs

4. Monitoring setup
   ├─ Verify all metrics
   ├─ Verify all alerts
   └─ Set up dashboards
```

### 8.6 Migration Timeline Summary

| Phase | Duration | Activities |
|-------|----------|------------|
| Phase 1 | Week 1-2 | Infrastructure preparation |
| Phase 2 | Week 3-4 | Shadow mode + gradual rollout |
| Phase 3 | Week 5-6 | Data migration |
| Phase 4 | Week 7-8 | Verification + documentation |

---

## 9. ROLLBACK PLAN

### 9.1 Rollback Triggers

| Severity | Condition | Action |
|----------|-----------|--------|
| **P0 - Critical** | Service unavailable | Immediate rollback |
| **P0 - Critical** | Data loss/corruption | Immediate rollback |
| **P1 - High** | Error rate > 5% | Rollback within 1 hour |
| **P1 - High** | Latency > 500ms | Rollback within 2 hours |
| **P2 - Medium** | Error rate > 1% | Rollback within 4 hours |
| **P2 - Medium** | Feature not working | Fix or rollback within 24h |

### 9.2 Rollback Procedure

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLLBACK PROCEDURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Communication (0-5 minutes)                           │
│  ├─ Page on-call team                                          │
│  ├─ Post incident in #incidents Slack                          │
│  └─ Notify stakeholders                                         │
│                                                                  │
│  STEP 2: Traffic Revert (5-15 minutes)                         │
│  ├─ Set feature flag to 0% on new service                      │
│  ├─ Route 100% traffic to old service                          │
│  └─ Verify traffic is flowing correctly                        │
│                                                                  │
│  STEP 3: Data Consistency (15-30 minutes)                     │
│  ├─ Verify no data loss during switch                         │
│  ├─ If data written to new service:                           │
│  │   └─ Replay events to old service                          │
│  └─ Verify data integrity                                      │
│                                                                  │
│  STEP 4: Verification (30-60 minutes)                          │
│  ├─ Run smoke tests                                            │
│  ├─ Verify key business flows                                  │
│  └─ Monitor error rates                                        │
│                                                                  │
│  STEP 5: Post-Incident (After resolution)                     │
│  ├─ Document root cause                                        │
│  ├─ Update rollback procedure if needed                        │
│  └─ Schedule post-mortem                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 Rollback Time Estimates

| Action | Time Required | Notes |
|--------|---------------|-------|
| Traffic switch (feature flag) | < 1 minute | Near instant |
| Service switch (load balancer) | < 5 minutes | DNS/routing change |
| Data rollback | 15-60 minutes | Depends on data size |
| Full system restore | 1-4 hours | Last resort |

### 9.4 Rollback Dependencies

| System | Rollback Dependency | Precautions |
|--------|-------------------|-------------|
| Database | Must preserve old schema | Keep migration scripts reversible |
| Auth | JWT validity across versions | Maintain backward compatibility |
| Real-time | Socket.IO connections | Graceful disconnect required |
| External APIs | Webhook delivery | May need to replay webhooks |

---

## 10. VERIFICATION CHECKLIST

### 10.1 Pre-Deployment Verification

#### Security Checklist

- [ ] All 84 issues from MASTER-AUDIT-2026.md resolved
- [ ] rez-corporate-service authentication implemented
- [ ] CorpPerks auth middleware created and tested
- [ ] rez-ops-dashboard authentication added
- [ ] No hardcoded secrets in any service
- [ ] No localhost fallbacks in production code
- [ ] Rate limiting on all sensitive endpoints
- [ ] RBAC enforcement verified on all routes
- [ ] No `any` type in production code (reduce usage)
- [ ] MongoDB AUTH enabled
- [ ] Redis AUTH enabled
- [ ] CORS configured with explicit origins (no wildcards)
- [ ] Security headers (HSTS, CSP, etc.) on all services
- [ ] JWT secrets meet minimum length requirements
- [ ] OTP stored securely (hashed, not plaintext)

#### Performance Checklist

- [ ] Database indexes created and verified
- [ ] Connection pooling configured correctly
- [ ] Compression enabled on all HTTP services
- [ ] Caching implemented for hot paths
- [ ] No N+1 queries
- [ ] Cursor-based pagination implemented
- [ ] Query timeouts configured (maxTimeMS)
- [ ] Redis pipeline used for batch operations
- [ ] No memory leaks (SSE connections, metrics maps)
- [ ] Load testing completed and passed

#### Error Handling Checklist

- [ ] Global error handlers on all services
- [ ] Graceful shutdown handlers (SIGTERM/SIGINT)
- [ ] No silent error swallowing (.catch(() => {}))
- [ ] Structured logging implemented
- [ ] Correlation IDs propagated
- [ ] Health check endpoints working
- [ ] Readiness probes configured
- [ ] Liveness probes configured

#### Code Quality Checklist

- [ ] TypeScript strict mode enabled
- [ ] No @ts-nocheck in production code
- [ ] ESLint/Prettier configured
- [ ] No console.log in production
- [ ] JSDoc comments on key functions
- [ ] .nvmrc files present
- [ ] No TODO/FIXME blocking production
- [ ] Dependencies audited (npm audit)
- [ ] Tests passing (unit + integration)

### 10.2 Deployment Verification

#### Smoke Tests

```bash
# Auth service
curl -X POST https://rez-auth-service.onrender.com/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+919876543210"}'
# Expected: 200 OK

# Health check
curl https://rez-auth-service.onrender.com/health
# Expected: {"status":"healthy"}

# Wallet balance (authenticated)
curl https://rez-wallet-service.onrender.com/api/wallet/balance \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK with balance object
```

#### Integration Test Checklist

- [ ] User registration and login flow
- [ ] Wallet credit and debit
- [ ] Order creation and fulfillment
- [ ] Payment initiation and completion
- [ ] Intent capture and retrieval
- [ ] Notification delivery
- [ ] Real-time updates (Socket.IO)
- [ ] Webhook delivery
- [ ] DLQ processing

### 10.3 Post-Deployment Verification

#### Monitoring Verification

- [ ] Prometheus metrics visible
- [ ] Grafana dashboards populated
- [ ] Error rates visible
- [ ] Latency percentiles (p50, p95, p99)
- [ ] Database connection pool utilization
- [ ] Redis connection count
- [ ] BullMQ job success/failure rates
- [ ] Health check endpoint responding

#### Business Metrics Verification

- [ ] Successful transactions count
- [ ] Failed transaction rate < 0.1%
- [ ] Order completion rate
- [ ] Payment success rate
- [ ] User login success rate
- [ ] API response times within SLA
- [ ] Revenue metrics unchanged
- [ ] User-reported issues < threshold

### 10.4 Final Sign-Off Checklist

| Category | Item | Status | Sign-off |
|----------|------|--------|----------|
| **Security** | All critical issues resolved | [ ] | Security Lead |
| **Security** | Penetration test passed | [ ] | Security Lead |
| **Performance** | Load test passed | [ ] | DevOps Lead |
| **Performance** | Latency within SLA | [ ] | DevOps Lead |
| **Reliability** | 99.9% uptime achieved | [ ] | SRE Lead |
| **Data** | Data integrity verified | [ ] | Data Lead |
| **Compliance** | Audit requirements met | [ ] | Compliance Lead |
| **Documentation** | Runbooks updated | [ ] | Tech Lead |
| **Documentation** | API docs updated | [ ] | Tech Lead |
| **Training** | Team trained on new system | [ ] | Engineering Manager |

---

## APPENDIX A: AUDIT FILES REFERENCE

| File | Date | Scope |
|------|------|-------|
| MASTER-AUDIT-2026.md | 2026-04-30 | 84 issues across 14 services |
| COMPLETE-AUDIT-2026.md | 2026-04-30 | Security audit, 156 issues |
| DATABASE-AUDIT-FULL.md | 2026-05-02 | Database schema audit |
| API-AUDIT-FULL.md | 2026-05-02 | API contract audit |
| SECURITY-AUDIT-FULL.md | 2026-05-02 | Security review |
| PERFORMANCE-AUDIT-FULL.md | 2026-05-02 | Performance issues |
| COMPREHENSIVE-AUDIT-2026-05-01-FULL.md | 2026-05-01 | Full ecosystem |
| REZ-ECOSYSTEM-COMPLETE-AUDIT.md | 2026-05-04 | Repository audit |
| DEEP-CTO-AUDIT.md | 2026-05-03 | Build + technical review |
| CONNECTION-AUDIT.md | 2026-05-02 | Integration audit |
| ADMIN-AUDIT-2026-05-04.md | 2026-05-04 | RBAC audit |
| MARKETING-SERVICES-AUDIT.md | 2026-05-05 | Marketing consolidation |
| DEEP-DATABASE-AUDIT.md | 2026-05-02 | Database architecture |
| AI_AUDIT/01-CEO-AUDIT.md | 2026-05-05 | Strategic audit |
| ALL-FEATURES.md | 2026-04-20 | Feature inventory |

---

## APPENDIX B: PORT ALLOCATION

| Service | Port | Status |
|---------|------|--------|
| rez-auth-service | 4002 | Production |
| rez-payment-service | 4001 | Production |
| rez-merchant-service | 4005 | Production |
| rez-wallet-service | 4004 | Production |
| rez-search-service | 4003 | Production |
| rez-ads-service | 4007 | Production |
| rez-marketing-service | 4000 | Production |
| rez-finance-service | 4006 | Production |
| rez-corpperks-service | 4013 | Production |
| rez-karma-service | 3009 | Production |
| rez-order-service | 3006 | Production |
| rez-catalog-service | 3005 | Production |
| rez-gamification-service | 3001 | Production |
| rez-intent-graph | 3001 | Production |
| rez-scheduler-service | 3012 | Production |
| rez-insights-service | 3003 | Production |
| rez-user-intelligence | 4008 | Production |
| rez-feedback-service | 4010 | Production |
| rez-knowledge-base-service | 4011 | Production |
| REZ-support-copilot | 4024 | New |
| REZ-merchant-copilot | 4025 | New |
| rez-ad-copilot | 4026 | New |
| rez-ad-platform | 4028 | New |
| rez-notification-events | 4016 | Production |
| rez-media-events | 4017 | Production |
| rez-push-service | 4018 | Production |
| rez-hotel-service | 4015 | Production |
| rez-procurement-service | 4012 | Production |
| rez-ops-dashboard | 4020 | Production |
| rez-corporate-service | 4022 | Production |

---

## APPENDIX C: SERVICE DEPENDENCY GRAPH

```
rez-app-consumer
└─► rez-api-gateway
    ├─► rez-auth-service
    │   ├─► MongoDB (rez_auth)
    │   └─► Redis (sessions, rate limit)
    │
    ├─► rez-wallet-service
    │   ├─► MongoDB (rez_wallet)
    │   └─► Redis (cache, BullMQ)
    │
    ├─► rez-payment-service
    │   ├─► MongoDB (rez_payments)
    │   ├─► Redis (BullMQ)
    │   └─► Razorpay API
    │
    ├─► rez-order-service
    │   ├─► MongoDB (rez_orders)
    │   ├─► Redis (BullMQ)
    │   └─► rez-intent-graph
    │
    ├─► rez-catalog-service
    │   ├─► MongoDB (rez_catalog)
    │   └─► Redis (BullMQ)
    │
    ├─► rez-search-service
    │   ├─► MongoDB
    │   └─► Redis
    │
    ├─► rez-gamification-service
    │   ├─► MongoDB (rez_gamification)
    │   └─► Redis (BullMQ)
    │
    └─► rez-marketing-service
        ├─► MongoDB (rez_marketing)
        ├─► Redis (BullMQ)
        ├─► WhatsApp API
        ├─► Twilio API
        └─► Firebase API

rez-intent-graph
├─► MongoDB (rez_intents)
├─► Redis (cache, rate limit)
└─► rez-wallet-service, rez-order-service, rez-merchant-service

Hotel OTA
└─► Hotel OTA API
    ├─► PostgreSQL (hotel_ota)
    ├─► Redis (BullMQ, Socket.IO)
    ├─► REZ Auth Service (SSO)
    └─► REZ Wallet Service
```

---

**Document Version:** 1.0
**Generated:** 2026-05-06
**Status:** FINAL
**Approved By:** CTO

---
