# ReZ Ecosystem - Comprehensive Technical Audit
**Date:** 2026-05-01
**Status:** AUDIT COMPLETE
**Scope:** Full ecosystem depth audit - All apps, services, packages, AI layer, infrastructure

---

## EXECUTIVE SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Consumer Mobile Apps | 3 | Audited |
| Web Apps | 1 | Audited |
| Hotel Stack | 7 apps | Audited |
| Vertical Apps | 4 | Audited |
| Karma Apps | 2 | Audited |
| Backend Services | 17 | Audited |
| Shared Packages | 14 | Audited |
| AI Layer | 1 | Audited |
| Infrastructure | Full | Audited |

---

## SECTION 1: CONSUMER MOBILE APPS

### 1.1 rez-app-consumer

| Field | Value |
|-------|-------|
| **Tech Stack** | Expo SDK 53.0.27, React Native 0.79.6, React 19.0.0 |
| **Navigation** | expo-router 5.1.11 |
| **State Management** | Zustand (35 stores) + React Contexts (30) + React Query |
| **HTTP Client** | Native fetch with custom ApiClient |
| **Real-time** | Socket.IO client 4.8.1 |
| **Bundle ID** | `money.rez.app` |
| **Repo** | imrejaul007/rez-app-consumer |
| **Screens** | 200+ |
| **API Services** | 227 |

**Features:**
- E-commerce (browsing, search, wishlist, cart, checkout)
- Wallet (ReZ Cash, coins, transactions, payment methods)
- Bookings (flights, hotels, trains, events, appointments)
- In-store (QR scan & pay, dine-in, table booking)
- Bill Payments (BBPS/utility payments, recharge)
- Gamification (points, achievements, badges, missions, leaderboards)
- Social (creator dashboard, UGC, reviews, referrals)
- Finance (savings goals, insurance, subscriptions)
- Loyalty (offers, deals, cashback, vouchers)
- Karma (score tracking, communities)

**API Connections:**
| Service | URL |
|---------|-----|
| Gateway | https://rez-api-gateway.onrender.com/api |
| Auth | https://rez-auth-service.onrender.com |
| Wallet | https://rez-wallet-service-36vo.onrender.com |
| Payment | https://rez-payment-service.onrender.com |
| Search | https://rez-search-service.onrender.com |
| Catalog | https://rez-catalog-service-1.onrender.com |
| Analytics | https://analytics-events-37yy.onrender.com |
| Gamification | https://rez-gamification-service-3b5d.onrender.com |
| Intent | https://rez-intent-graph.onrender.com |
| Backend | https://rez-backend-8dfu.onrender.com |

**Shared Packages:**
- `@rez/chat` (file reference)
- `@rez/shared-types` (file reference)

**Issues:** Merge conflict in package.json referencing @rez/shared

---

### 1.2 rez-app-merchant

| Field | Value |
|-------|-------|
| **Tech Stack** | Expo SDK 55.0.18, React Native 0.76.9, React 18.3.1 |
| **Navigation** | expo-router 4.0.0 |
| **State Management** | React Query + React Contexts (8 each) |
| **HTTP Client** | Axios with custom ApiClient |
| **Real-time** | Socket.IO client 4.7.0 |
| **Bundle ID** | `com.rez.merchant` |
| **Repo** | imrejaul007/rez-app-marchant (TYPO) |
| **Screens** | 78 |

**Features:**
- Dashboard with analytics
- POS (Point of Sale)
- Products catalog management
- Orders management
- Bookings (tables, appointments)
- CRM (customers, loyalty)
- Team management (RBAC)
- Analytics & Reports
- KDS (Kitchen Display System)
- Khata (credit book)
- Discounts & Campaigns
- Settlements
- Documents (GST, invoices)
- Onboarding wizard
- Copilot (AI insights)
- Bluetooth printer support

**API Connections:**
| Service | URL |
|---------|-----|
| Gateway | https://rez-api-gateway.onrender.com/api |
| Merchant Service | https://rez-merchant-service-n3q2.onrender.com (direct) |
| Socket | https://rez-backend-8dfu.onrender.com |

**Shared Packages:**
- `@rez/shared` (file reference - BROKEN: unresolved merge conflict)
- `@rez/shared-types` (file reference)

**Issues:**
- UNRESOLVED MERGE CONFLICT in package.json (lines 46-50)
- Older Expo SDK (55 vs 53)
- Missing google-services.json warning

---

### 1.3 rez-app-admin

| Field | Value |
|-------|-------|
| **Tech Stack** | Expo SDK 53.0.26, React Native 0.79.5, React 19.0.0 |
| **Navigation** | expo-router 5.1.4 |
| **State Management** | React Query + React Contexts |
| **HTTP Client** | Native fetch with custom ApiClient |
| **Real-time** | Socket.IO client 4.8.1 |
| **Bundle ID** | `com.rez.admin` |
| **Repo** | imrejaul007/rez-app-admin |
| **Screens** | 159 |

**Features:**
- Dashboard with key metrics
- Merchants management & verification
- Users management & permissions
- Coin Rewards administration
- Analytics
- Campaigns management
- Audit logs
- Settings
- Hotel OTA integration
- Social Impact (events)

**API Connections:**
| Service | URL |
|---------|-----|
| Gateway | https://rez-api-gateway.onrender.com/api |
| Admin API | /admin/* endpoints |
| Auth | https://rez-auth-service.onrender.com |
| Merchant | https://rez-merchant-service-n3q2.onrender.com |
| Wallet | https://rez-wallet-service-36vo.onrender.com |
| Analytics | https://analytics-events-37yy.onrender.com |
| Socket | https://rez-backend-8dfu.onrender.com |
| Rendez | https://rendez-backend.onrender.com |

**Issues:** None critical

---

## SECTION 2: WEB APPS

### 2.1 rez-now

| Field | Value |
|-------|-------|
| **Tech Stack** | Next.js 16.2.3, React 19.2.4, Tailwind CSS 4 |
| **State Management** | Zustand 5.0.12 |
| **i18n** | next-intl 4.11.0 |
| **Error Tracking** | Sentry 10.48.0 |
| **Testing** | Jest 30.3.0, Playwright 1.49.1 |
| **Deployment** | Vercel |
| **Repo** | imrejaul007/rez-now |

**Features:**
- QR code scanning for store access (/scan page)
- Store menu browsing with categories
- Cart management with customizations
- Order placement and tracking
- Real-time order status via Socket.IO
- Payment via Razorpay (UPI, cards, wallets)
- Coupon/loyalty system
- Wallet with REZ coins
- Order history
- User profile
- AI Chat widget integration
- Hotel QR Room Hub (Stayeon)
- Merchant dashboard (protected routes)
- PWA support with service worker

**API Connections:**
| Service | URL |
|---------|-----|
| Gateway | https://rez-api-gateway.onrender.com/api |
| Auth | https://rez-auth-service.onrender.com |
| Wallet | https://rez-wallet-service.onrender.com |
| Payment | https://rez-payment-service.onrender.com |
| Merchant | https://rez-merchant-service.onrender.com |
| Intent | https://rez-intent-graph.onrender.com |

**Authentication:**
- Phone + OTP (SMS/WhatsApp)
- Phone + PIN
- OAuth2 ("Continue with REZ")
- Token encryption with AES-GCM-256

**Issues:** Conflicts exist in `usePaymentConfirmation.ts`

---

## SECTION 3: HOTEL STACK (StayOwn)

### 3.1 Structure - 7 Apps

| # | App | Purpose | Tech Stack |
|---|-----|---------|-----------|
| 1 | **OTA Web** | Guest booking website | Next.js 16, React 18, TailwindCSS, Recharts |
| 2 | **Hotel Panel** | Hotel staff dashboard | Next.js 16, TailwindCSS, qrcode.react |
| 3 | **Admin Panel** | Platform admin | Next.js 16, TailwindCSS, Recharts |
| 4 | **Corporate Panel** | Corporate accounts | Next.js 16, TailwindCSS |
| 5 | **Mobile** | Guest mobile app | React Native 0.76, Expo 49, Zustand |
| 6 | **API** | Backend API | Node.js, Express 4, Prisma 5, Redis, Socket.io, BullMQ, Razorpay |
| 7 | **Hotel PMS** | Property Management | Node.js, MongoDB, Stripe, React 18, Vite, MUI 7 |

**Repo:** git@github.com:imrejaul007/hotel-ota.git

### 3.2 Internal Connections

```
Frontend Apps → Hotel OTA API → PostgreSQL + Redis
                              ↓
                         BullMQ (Jobs)
                         Socket.io (Real-time)
```

### 3.3 External ReZ Connections

| Service | Integration | Purpose |
|---------|-------------|---------|
| REZ Auth Service | REST API | SSO token verification |
| REZ Wallet Service | REST API | Coin balance sync |
| REZ Finance Service | REST API | Financial transactions |

### 3.4 Room QR Feature

**Location:** `Hotel OTA/apps/api/src/routes/room-qr.routes.ts`

**Flow:**
1. Guest scans QR code with mobile app
2. App sends QR payload to `/v1/room-qr/validate`
3. API verifies HMAC signature + expiration
4. Returns room context (roomId, guest name, check-in/out dates)
5. Captures guest services intent for RTMN Commerce Memory

**Socket.IO Namespaces:**
- `/hotel` - Hotel real-time events
- `/ai/hotel`, `/ai/room-qr` - AI chat

### 3.5 Deployment

| Service | Render Name | URL |
|---------|-------------|-----|
| API | hotel-ota-api | https://hotel-ota-api.onrender.com |
| OTA Web | hotel-ota-web | https://hotel-ota-web.onrender.com |
| Hotel Panel | hotel-ota-hotel-panel | https://hotel-ota-hotel-panel.onrender.com |
| Admin Panel | hotel-ota-admin | https://hotel-ota-admin.onrender.com |

### 3.6 Known Bugs (18 remaining)

**HIGH Priority:**
- BUG-4: Rounding losses in commission calculations
- BUG-5: Cumulative coin burn can exceed booking value
- BUG-8: Unsafe integer parsing

**MEDIUM Priority:**
- BUG-2: Missing admin RBAC implementation
- BUG-3: Single API key for all partners
- BUG-9: Query string date parameters unvalidated
- BUG-10: Check-in/out race with cancellation
- BUG-11: Double-release inventory on hold expiry
- BUG-12: Coin earn runs outside transaction
- BUG-13: Coin burn refund failure handling
- BUG-14: Refund not tracked in database
- BUG-15: Settlement reversal fails silently
- BUG-17: Incomplete input sanitization (XSS)
- BUG-19: Coin expiry not enforced on burn
- BUG-20: Mining eligibility not snapshotted
- BUG-23: Razorpay webhook confirmation race
- BUG-24: PMS notification fire-and-forget
- BUG-25: Missing startup validation of secrets

---

## SECTION 4: VERTICAL APPS

### 4.1 Rendez (Social)

| Field | Value |
|-------|-------|
| **Tech Stack** | Expo SDK 50, React Native, Node.js/Express, Prisma (PostgreSQL) |
| **Real-time** | Socket.io with Redis adapter |
| **Repo** | imrejaul007/Rendez |
| **Database** | PostgreSQL via Prisma |

**Features:**
- Discovery feed (location/gender/age matching)
- Like/Swipe system with mutual matches
- Real-time messaging (state machine)
- Gift system (COIN and MERCHANT_VOUCHER)
- Meetup/Date planning with QR check-in
- Plans (social invites)
- Request inbox
- Experience credits (Silver/Gold/Platinum tiers)
- Safety (report, block, shadowScore)
- Referral system
- KYC/Verification
- Merchant sponsorship

**ReZ Integration:**
- REZ wallet (balance queries, gift transactions)
- REZ catalog (merchant vouchers)
- REZ merchant (restaurant/meetup venues)
- REZ spending → Experience credits

**Deployment:** Render (backend), Expo (mobile), Render (admin)

---

### 4.2 AdBazaar

| Field | Value |
|-------|-------|
| **Tech Stack** | Next.js 16.2, TypeScript, Supabase (PostgreSQL), Upstash Redis |
| **Auth** | Supabase Auth + OAuth2 (REZ partner) |
| **Payments** | Razorpay |
| **Repo** | imrejaul007/adBazaar |
| **Deployment** | Vercel |

**Features:**
- Vendor portal (88+ ad space formats)
- Marketplace (browse/filter)
- QR code system (attribution)
- Coin rewards
- Commission system (10-20%)
- Budget alerts
- Bulk upload (CSV)
- Document verification (KYC)
- 2FA (TOTP for admin)
- Dead letter queue (failed jobs)
- Campaign management
- Review system

**ReZ Integration:**
- OAuth2 Partner (client_id: adbazaar)
- Wallet Service (balance checks)
- Payment Service (canonical routing)
- Intent Capture (AI recommendations)

---

### 4.3 NextaBiZ (B2B Procurement)

| Field | Value |
|-------|-------|
| **Tech Stack** | Next.js 15, Turborepo + pnpm, Supabase, NextAuth.js |
| **Payments** | Stripe |
| **Repo** | imrejaul007/nextabizz |
| **Deployment** | Vercel |

**Features:**
- Inventory signals (low stock alerts)
- Purchase orders
- RFQ system
- Catalog browsing
- Supplier portal
- Reorder engine
- Scoring engine
- Credit line (BNPL)
- Payment settlement
- Analytics

**Monorepo Structure:**
```
apps/web (B2B dashboard)
apps/supplier-portal
packages/shared-types
packages/webhook-sdk
packages/rez-auth-client
services/reorder-engine
services/scoring-engine
services/payment-settlement
```

**ReZ Integration:**
- OAuth2 Partner (SSO)
- Merchant Service (lookup)
- Intent Graph (AI recommendations)

---

### 4.4 CorpPerks

| Field | Value |
|-------|-------|
| **Tech Stack** | Node.js/Express, MongoDB, Redis, JWT |
| **SDK** | @rez/corpperks-sdk |
| **Repo** | imrejaul007/CorpPerks |
| **Deployment** | Render, Docker |

**Services:**
| Service | Port | Purpose |
|---------|------|---------|
| rez-corpperks-service | 4013 | Gateway API |
| rez-hotel-service | 4011 | Makcorps integration |
| rez-procurement-service | 4012 | NextaBizz integration |

**Features:**
- Benefits management (Meal, Travel, Wellness, Learning, Gift)
- Employee enrollment (HRIS sync)
- Hotel bookings (Makcorps OTA)
- GST invoicing
- Corporate gifting
- Karma/CSR campaigns
- ReZ Coins (tiers)
- Analytics dashboard
- Health monitoring

**ReZ Integration:**
- Wallet Service
- Finance Service (BNPL, expenses)
- Karma Service (CSR/volunteer)

---

## SECTION 5: KARMA APPS

### 5.1 rez-karma-app (Web)

| Field | Value |
|-------|-------|
| **Tech Stack** | Next.js |
| **Repo** | imrejaul007/rez-karma-app |

### 5.2 rez-karma-mobile (Mobile)

| Field | Value |
|-------|-------|
| **Tech Stack** | React Native |
| **Repo** | imrejaul007/rez-karma-mobile |

**Purpose:** Social impact and karma score tracking across the ReZ ecosystem.

---

## SECTION 6: BACKEND SERVICES (17 Microservices)

### 6.1 Core Services

| Service | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---------|------|-----------|---------|-------|--------|---------|
| rez-auth-service | 4002 | Yes | Yes | Yes | Yes | Auth, OTP, JWT, MFA, OAuth2 |
| rez-wallet-service | 4004 | Yes | Yes | Yes | Yes | Wallet, balance, transfers, BNPL |
| rez-order-service | 3006 | Yes | Yes | Yes | Yes | Order processing, lifecycle |
| rez-payment-service | 4001 | Yes | Yes | Yes | Yes | Razorpay, refunds, webhooks |
| rez-merchant-service | 4005 | Yes | Yes | Yes | No | Merchant management, analytics |
| rez-catalog-service | 3005 | Yes | Yes | Yes | Yes | Product catalog, menu |
| rez-search-service | 4003 | Yes | Yes | Yes | No | Search, recommendations |

### 6.2 Growth Services

| Service | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---------|------|-----------|---------|-------|--------|---------|
| rez-gamification-service | 3001 | Yes | Yes | Yes | Yes | Achievements, streaks |
| rez-ads-service | 4007 | Yes | Yes | Yes | No | Merchant ads, campaigns |
| rez-marketing-service | 4000 | Yes | Yes | Yes | Yes | Campaigns, WhatsApp, vouchers |
| rez-karma-service | 3009 | Yes | Yes | Yes | Yes | Impact economy, civic corps |

### 6.3 Business Services

| Service | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---------|------|-----------|---------|-------|--------|---------|
| rez-finance-service | 4006 | Yes | Yes | Yes | Yes | Credit, loans, BNPL, bill pay |
| rez-corpperks-service | 4013 | No | Yes | Yes | No | Enterprise benefits |
| rez-hotel-service | 4015 | No | Yes | No | No | Hotel OTA (Makcorps) |
| rez-procurement-service | 4012 | No | Yes | No | No | Procurement (NextaBizz) |

### 6.4 Infrastructure Services

| Service | Port | TypeScript | MongoDB | Redis | BullMQ | Purpose |
|---------|------|-----------|---------|-------|--------|---------|
| rez-scheduler-service | 3012 | Yes | Yes | Yes | Yes | Centralized job scheduling |

### 6.5 API Gateway

| Field | Value |
|-------|-------|
| **Tech Stack** | Nginx + Express |
| **Functions** | Routing, rate limiting, auth validation, CORS |

**Rate Limiting Zones:**
| Zone | Limit | Purpose |
|------|-------|---------|
| api_limit | 50r/s | Global API |
| auth_limit | 100r/m | Auth endpoints |
| merchant_limit | 100r/s | Per-merchant |
| pos_limit | 30r/s | POS/billing |

### 6.6 Service-to-Service Authentication

**New Pattern (Scoped):**
```json
INTERNAL_SERVICE_TOKENS_JSON = {"service-name": "token"}
Headers: x-internal-token, x-internal-service
```

**Legacy Pattern (Shared):**
```
INTERNAL_SERVICE_TOKEN (single token for all)
```

### 6.7 Event Bus

**50 Event Types** documented in EVENT_INVENTORY_MICROSERVICES.md:
- User events
- Order events
- Payment events
- Wallet events
- Inventory events
- Hotel events
- AI/Insights events
- Automation events
- Notification events
- System events

---

## SECTION 7: SHARED PACKAGES

### 7.1 Package Inventory

| Package | Version | Purpose | Published | Status |
|---------|---------|---------|-----------|--------|
| rez-shared (root) | 2.0.0 | Core utilities, types, schemas | Yes | Active |
| packages/rez-shared | 1.0.0 | Basic utilities | Yes | **DUPLICATE** |
| @rez/shared-types | 2.0.0 | TypeScript interfaces, zod schemas | Yes | Active |
| @rez/service-core | 1.0.1 | Microservice infrastructure | No | Incomplete |
| @rez/ui | 1.0.0 | UI components (5 only) | No | Minimal |
| @rez/metrics | 1.0.0 | Prometheus middleware | No | **Empty** |
| @rez/agent-memory | 1.0.0 | Agent memory (Supabase, Redis) | No | Active |
| @rez/intent-capture-sdk | 1.0.0 | Intent Capture SDK | No | Active |
| @rez/intent-graph | 0.1.0 | AI platform | No | Active |
| @rez/chat | 1.0.0 | Real-time chat | No | Active |
| @rez/chat-ai | 1.0.0 | AI chat (Anthropic) | No | Active |
| @rez/chat-integration | 1.0.0 | Chat integration | No | Active |
| @rez/chat-rn | 1.0.0 | React Native chat | No | Active |
| @rez/eslint-plugin | 1.0.0 | ESLint rules | No | **Empty** |
| rez-contracts | 1.0.1 | API contracts | No | **Broken** |
| rez-devops-config | - | CI/CD (GitHub Actions) | GitHub | Active |
| rez-error-intelligence | - | Error tracking docs | GitHub | Active |

### 7.2 Critical Issues

1. **UNRESOLVED MERGE CONFLICT** in `rez-app-merchant/package.json`
2. **DUPLICATE PACKAGES** - Two `@rez/shared` with different content
3. **MISSING SRC** in `rez-contracts/`
4. **EMPTY PACKAGES** - @rez/metrics, @rez/eslint-plugin have no implementations
5. **TYPE DUPLICATION** - User, Order, Payment types exist in multiple packages

### 7.3 Dependency Flow

```
Services using @rez/shared (file refs):
  → rez-auth-service
  → rez-order-service
  → rez-payment-service
  → rez-catalog-service
  → rez-app-merchant (BROKEN)
  → rez-app-admin
  → rez-now
  → analytics-events
```

---

## SECTION 8: REZ MIND (AI Intelligence Layer)

### 8.1 Components

| Component | Type | AI Agents | ML | Storage |
|-----------|------|----------|-----|---------| 
| rez-intent-graph | Intent Tracking | 8 | Custom | MongoDB + Redis |
| rez-insights-service | Insights Storage | 0 | None | MongoDB + Redis |
| rez-automation-service | Rule Engine | 0 | None | MongoDB |
| RTMN Commerce Memory | Memory Layer | 8 | Custom | Part of Intent Graph |

### 8.2 8 Autonomous AI Agents

| Agent | Interval | Priority | Dangerous Actions |
|-------|----------|----------|-------------------|
| DemandSignalAgent | 5 min | High | adjust_price, update_merchant_dashboard |
| ScarcityAgent | 1 min | High | send_urgency_nudge, alert_support |
| PersonalizationAgent | 1 min | High | send_nudge, pause_strategy |
| AttributionAgent | 30 min | Medium | - |
| AdaptiveScoringAgent | 1 hour | High | retrain_model, threshold_adjust |
| FeedbackLoopAgent | 1 hour | High | pause_strategy, reallocate_budget |
| NetworkEffectAgent | 24 hours | Medium | trigger_revival, send_nudge |
| RevenueAttributionAgent | 15 min | Critical | alert_support, pause_nudge_campaign |

### 8.3 Intent Signal Weights

| Signal | Weight |
|--------|--------|
| search | 0.15 |
| view | 0.10 |
| wishlist | 0.25 |
| cart_add | 0.30 |
| hold | 0.35 |
| checkout_start | 0.40 |
| fulfilled | 1.00 |
| abandoned | -0.20 |

### 8.4 Confidence Scoring

```
new_confidence = base + (signal_weight * recency_multiplier) + velocity_bonus

recency_multiplier = exp(-days_since_last / 30)
velocity_bonus = 0.2 if <1min, 0.1 if <5min, 0.05 if <1hr, 0 otherwise
```

### 8.5 RTMN Commerce Memory

**Cross-App Categories:**
- TRAVEL (hotel_ota, hotel_guest)
- DINING (restaurant)
- RETAIL (retail)
- HOTEL_SERVICE
- GENERAL

**Data Flow:**
```
User Event → IntentCaptureService → Intent Model (MongoDB)
     ↓
DormantIntentService (7-day threshold)
     ↓
CrossAppAggregationService
     ↓
Enriched Context (for agents)
     ↓
8 AI Agents (autonomous decisions)
     ↓
ActionTrigger (circuit breakers)
     ↓
External Services (wallet, orders, PMS)
```

### 8.6 Security Features

| Feature | Description |
|---------|-------------|
| REZ_DANGEROUS_MODE | Enables skip-permission actions |
| Circuit Breakers | 10 failures opens circuit |
| Emergency Stop | Max 100 consecutive actions triggers auto-stop |
| Rate Limiting | Standard, strict, capture, nudge limiters |
| Auth Middleware | Internal token, API key, cron secret, JWT |

---

## SECTION 9: INFRASTRUCTURE & DEPLOYMENT

### 9.1 Docker Stack

| File | Purpose |
|------|---------|
| docker-compose.yml | Main dev stack (MongoDB replica set, Redis, PostgreSQL) |
| docker-compose.observability.yml | Prometheus, Grafana, Loki, Jaeger, Alertmanager |
| docker-compose.redis-sentinel.yml | Redis Sentinel HA (1 primary + 2 replicas + 3 sentinels) |
| docker-compose.logging.yml | Loki/Promtail/Grafana |
| docker-compose.dev.yml | Simplified dev (MongoDB + Redis) |
| docker-compose.rez-mind.yml | Intent graph service |

**CRITICAL BUG:** MongoDB connection mismatch in docker-compose.yml
- Services reference `mongodb://mongodb:27017`
- Container is named `rez-mongodb-primary`

### 9.2 Monitoring Stack

| Component | Port | Version |
|-----------|------|---------|
| Prometheus | 9090 | v2.47.0 |
| Grafana | 3000/3001 | 10.1.0/11.0.0 |
| Loki | 3100 | 2.8.0/3.0.0 |
| Promtail | 9080 | 2.8.0/3.0.0 |
| Jaeger | 16686 | 1.47 |
| Alertmanager | 9093 | v0.26.0 |

### 9.3 Prometheus Alert Rules

**REZ Services:**
- ServiceDown (critical)
- HighErrorRate (warning)
- HighLatency (warning)
- DatabaseConnectionErrors (critical)
- RedisConnectionErrors (warning)

**Infrastructure:**
- HighMemoryUsage (warning)
- HighCPUUsage (warning)
- DiskSpaceLow (warning)

**Auth:**
- OTPFailureSpike (warning)
- TokenValidationFailures (warning)

### 9.4 SSL/TLS

- **Terminated at:** Cloudflare/Render
- **Cloudflare WAF:** `/cloudflare/waf-workers/api-gateway/`
- **Nginx Real-IP:** Configured for Cloudflare IPs
- **Security Headers:** CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

### 9.5 Deployment Scripts

**deploy-rtmn.sh:** Deploys 10 services via git pull/push to trigger Render

**npm-scripts.sh:** Publishes shared packages to npm:
- shared-types
- rez-shared
- rez-intent-capture-sdk
- rez-agent-memory

---

## SECTION 10: API CONNECTIVITY MAP

### 10.1 Consumer App Connections

```
rez-app-consumer
    ↓
┌─────────────────────────────────────────────────────────────┐
│                  rez-api-gateway                           │
│              https://rez-api-gateway.onrender.com/api        │
└─────────────────────────────────────────────────────────────┘
    ↓                    ↓                    ↓                    ↓
Auth Service        Wallet Service       Payment Service      Search Service
(4002)              (4004)               (4001)              (4003)
    ↓                    ↓                    ↓
Catalog Service     Order Service        Gamification
(3005)              (3006)               (3001)
                          ↓
                  Intent Graph
                  (rez-intent-graph)
```

### 10.2 Merchant App Connections

```
rez-app-merchant
    ↓
Gateway + Direct Merchant Service
    ↓
Socket.IO (rez-backend-8dfu.onrender.com)
    ↓
Analytics Events
```

### 10.3 Hotel OTA Connections

```
Hotel OTA Frontend Apps
    ↓
Hotel OTA API
    ↓              ↓              ↓
REZ Auth      REZ Wallet      REZ Finance
(SOAP)        (REST)          (REST)
    ↓
Prisma (PostgreSQL) + Redis
    ↓
BullMQ + Socket.IO
```

---

## SECTION 11: ISSUES & RECOMMENDATIONS

### Critical Issues

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| 1 | Merge conflict in rez-app-merchant/package.json | Package | Not buildable |
| 2 | MongoDB connection mismatch in docker-compose | Infrastructure | Dev env broken |
| 3 | MongoDB AUTH not enabled | Security | Unauthorized access |
| 4 | Redis AUTH not enabled | Security | Unauthorized access |
| 5 | Duplicate @rez/shared packages | Package | Confusing versioning |
| 6 | rez-contracts has no src/ | Package | Broken build |
| 7 | Hardcoded dev secrets in docker-compose | Security | Credential exposure |

### High Priority

| # | Issue | Category | Impact |
|---|-------|----------|--------|
| 8 | Hotel OTA 18 bugs remaining | Bug | Financial/safety issues |
| 9 | Search service needs Typesense | Architecture | Performance |
| 10 | Empty packages (@rez/metrics, @rez/eslint-plugin) | Package | Dead code |
| 11 | Type duplication across packages | Maintenance | Inconsistency |
| 12 | TypeScript inconsistency (some services use JS) | Maintenance | Technical debt |

### Recommendations

1. **Package Consolidation**
   - Resolve merge conflict in rez-app-merchant
   - Consolidate duplicate @rez/shared packages
   - Create src/ in rez-contracts or remove

2. **Security Hardening**
   - Enable MongoDB AUTH
   - Enable Redis AUTH
   - Rotate all credentials
   - Implement HashiCorp Vault

3. **Bug Fixes**
   - Fix Hotel OTA 18 remaining bugs
   - Implement Admin RBAC
   - Fix race conditions

4. **Architecture**
   - Migrate search to Typesense/Meilisearch
   - Standardize TypeScript across all services
   - Add comprehensive tests

---

## APPENDIX A: ENVIRONMENT VARIABLES

### Required for All Services

```bash
# MongoDB
MONGODB_URI=mongodb://...
MONGODB_READ_PREFERENCE=primary

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ADMIN_SECRET=...
JWT_MERCHANT_SECRET=...

# Internal Auth
INTERNAL_SERVICE_TOKEN=...
INTERNAL_SERVICE_TOKENS_JSON={"service":"token"}

# Sentry
SENTRY_DSN=...
```

### Service-Specific

| Service | Additional Vars |
|---------|-----------------|
| rez-payment-service | RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET |
| rez-auth-service | OTP_HMAC_SECRET |
| rez-merchant-service | ENCRYPTION_KEY |
| Hotel OTA | PMS_API_URL, PMS_WEBHOOK_SECRET |

---

## APPENDIX B: PORTS REFERENCE

| Service | HTTP Port | Metrics Port |
|---------|-----------|--------------|
| rez-auth-service | 4002 | 4102 |
| rez-wallet-service | 4004 | - |
| rez-order-service | 3006 | - |
| rez-payment-service | 4001 | - |
| rez-merchant-service | 4005 | - |
| rez-catalog-service | 3005 | - |
| rez-search-service | 4003 | - |
| rez-gamification-service | 3001 | 3004 (worker) |
| rez-ads-service | 4007 | - |
| rez-marketing-service | 4000 | - |
| rez-scheduler-service | 3012 | - |
| rez-finance-service | 4006 | - |
| rez-karma-service | 3009 | - |
| rez-corpperks-service | 4013 | - |
| rez-hotel-service | 4015 | - |
| rez-procurement-service | 4012 | - |
| rez-intent-graph | 3001 | 3005 (agent server) |

---

**Document Version:** 1.0
**Last Updated:** 2026-05-01
**Next Audit:** 2026-06-01
