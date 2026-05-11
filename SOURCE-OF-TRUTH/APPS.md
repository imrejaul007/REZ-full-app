# ReZ Ecosystem - Applications Documentation

**Last Updated:** 2026-05-04
**Purpose:** Complete reference for all mobile apps, web apps, and platform apps

---

## Table of Contents

1. [Consumer Mobile Apps](#consumer-mobile-apps)
2. [Merchant Apps](#merchant-apps)
3. [Web Apps](#web-apps)
4. [Hotel Stack (StayOwn)](#hotel-stack-stayown)
5. [Vertical Apps](#vertical-apps)
6. [Karma Apps](#karma-apps)

---

## Consumer Mobile Apps

### 1. Do App (AI Commerce OS)

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Expo SDK 52, React Native 0.76, TypeScript |
| **Navigation** | expo-router |
| **State Management** | Zustand + MMKV |
| **Bundle ID (iOS)** | `com.do.app` |
| **Bundle ID (Android)** | `com.do.app` |
| **Repo** | imrejaul007/do |
| **Purpose** | AI-powered chat commerce |

**Features:**
| Category | Features |
|----------|----------|
| **Chat** | AI conversation with unified intent detection |
| **Commerce** | Book restaurants, hotels, spas, events |
| **Wallet** | Coins, karma tier, transactions |
| **Profile** | Preferences, payment methods |
| **Support** | Complaints, refunds, tracking |

**AI Intelligence:**
| Feature | Source |
|---------|--------|
| **Intents (25+)** | ReZ Mind |
| **Training Data** | ReZ Mind |
| **Knowledge Base** | ReZ Mind |
| **User Profiles** | Unified Profile Service |
| **Wallet/Karma** | ReZ Wallet |
| **Subscription Tier** | REE Service |

**Services:**
| Service | URL |
|---------|-----|
| Auth | `rez-auth-service.onrender.com` |
| Wallet | `rez-wallet-service-36vo.onrender.com` |
| Profile | `rezprofile.onrender.com` |
| REE | `rez-economic-engine.onrender.com` | |

**Docs:** [DO-APP.md](SOURCE-OF-TRUTH/DO-APP.md)

---

### 2. rez-app-consumer

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Expo SDK 53.0.27, React Native 0.79.6, React 19.0.0 |
| **Navigation** | expo-router 5.1.11 |
| **State Management** | Zustand (35 stores) + React Contexts (30) + React Query |
| **HTTP Client** | Native fetch with custom ApiClient |
| **Real-time** | Socket.IO client 4.8.1 |
| **Bundle ID (iOS)** | `money.rez.app` |
| **Bundle ID (Android)** | `money.rez.app` |
| **Repo** | imrejaul007/rez-app-consumer |
| **EAS Project ID** | cf84e3b3-4a96-4c9b-a438-465c29fbf720 |
| **Screens** | 200+ |
| **API Services** | 227 |

**Features:**
| Category | Features |
|----------|----------|
| **E-commerce** | Product browsing, search, wishlist, cart, checkout |
| **Wallet** | ReZ Cash, coins, transactions, payment methods |
| **Bookings** | Flights, hotels, trains, events, appointments |
| **In-store** | QR scan & pay, dine-in, table booking |
| **Bill Payments** | BBPS/utility payments, recharge |
| **Gamification** | Points, achievements, badges, missions, leaderboards |
| **Social** | Creator dashboard, UGC, reviews, referrals |
| **Finance** | Savings goals, insurance, subscriptions |
| **Loyalty** | Offers, deals, cashback, vouchers |
| **Karma** | Score tracking, communities |

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

**Environment Variables:**
```bash
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
EXPO_PUBLIC_GATEWAY_URL=https://rez-api-gateway.onrender.com
EXPO_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_EAS_PROJECT_ID=cf84e3b3-4a96-4c9b-a438-465c29fbf720
```

**Deep Links:**
- `rezapp://`
- `https://rezapp.in`
- `https://menu.rez.money`
- `https://now.rez.money`

---

### 2. rez-app-merchant

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Expo SDK 55.0.18, React Native 0.76.9, React 18.3.1 |
| **Navigation** | expo-router 4.0.0 |
| **State Management** | React Query + React Contexts (8 each) |
| **HTTP Client** | Axios with custom ApiClient |
| **Real-time** | Socket.IO client 4.7.0 |
| **Bundle ID (iOS)** | `com.rez.merchant` |
| **Bundle ID (Android)** | `com.rez.merchant` |
| **Repo** | imrejaul007/rez-app-marchant (typo in repo name) |
| **EAS Project ID** | 77203219-4cd5-4ca3-9210-1cc89b7456fc |
| **Screens** | 78 |

**Features:**
| Category | Features |
|----------|----------|
| **Dashboard** | Analytics, overview, quick actions |
| **POS** | Point of sale, order management |
| **Products** | Catalog management, variants, pricing |
| **Orders** | Order list, details, tracking |
| **Bookings** | Table reservations, appointments |
| **Customers** | CRM, loyalty tracking |
| **Team** | Staff management, shifts, roles (RBAC) |
| **Analytics** | Reports, revenue, trends |
| **KDS** | Kitchen display system |
| **Khata** | Credit book management |
| **Discounts** | Builder, rules, campaigns |
| **Settlements** | Payout tracking |
| **Copilot** | AI-powered insights |
| **Printer** | Bluetooth receipt printing |

**API Connections:**
| Service | URL |
|---------|-----|
| Gateway | https://rez-api-gateway.onrender.com/api |
| Merchant Service | https://rez-merchant-service-n3q2.onrender.com (direct) |
| Socket | https://rez-backend-8dfu.onrender.com |

**Environment Variables:**
```bash
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_SOCKET_URL=https://rez-backend-8dfu.onrender.com
EXPO_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
```

**Deep Links:**
- `rezmerchant://`
- `merchant.rez.money`

---

### 3. rez-app-admin

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Expo SDK 53.0.26, React Native 0.79.5, React 19.0.0 |
| **Navigation** | expo-router 5.1.4 |
| **State Management** | React Query + React Contexts |
| **HTTP Client** | Native fetch with custom ApiClient |
| **Real-time** | Socket.IO client 4.8.1 |
| **Bundle ID (iOS)** | `com.rez.admin` |
| **Bundle ID (Android)** | `com.rez.admin` |
| **Repo** | imrejaul007/rez-app-admin |
| **EAS Project ID** | 71e8a58b-aaec-472a-aba6-4afd001576fb |
| **Screens** | 159 |

**Features:**
| Category | Features |
|----------|----------|
| **Dashboard** | Admin overview with key metrics |
| **Merchants** | Store management, verification |
| **Users** | User accounts, permissions |
| **Coin Rewards** | Coin system administration |
| **Analytics** | System-wide analytics |
| **Campaigns** | Marketing campaign management |
| **Audit** | System audit logs |
| **Settings** | App configuration |
| **Hotel OTA** | Hotel integration management |
| **Social Impact** | Event management |

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

**Deep Links:**
- `rez-admin://`
- `admin.rez.money`

---

## Merchant Apps

### Web Dashboard

**See:** [rez-now](#rez-now) - Contains merchant dashboard at `/merchant/*`

---

## Web Apps

### 4. rez-now

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Next.js 16.2.3, React 19.2.4, Tailwind CSS 4, Zustand 5.0.12 |
| **i18n** | next-intl 4.11.0 |
| **Error Tracking** | Sentry 10.48.0 |
| **Testing** | Jest 30.3.0, Playwright 1.49.1 |
| **Deployment** | Vercel |
| **Repo** | imrejaul007/rez-now |

**Features:**
| Category | Features |
|----------|----------|
| **QR Scanner** | Store access via QR code |
| **Menu** | Categories, products, customizations |
| **Cart** | Add, remove, modify items |
| **Orders** | Placement, tracking, history |
| **Payment** | Razorpay (UPI, cards, wallets) |
| **Wallet** | REZ coins, transactions |
| **Loyalty** | Coupons, stamps, rewards |
| **AI Chat** | Widget integration |
| **Hotel** | QR Room Hub (Stayeon) |
| **PWA** | Service worker, manifest |

**Routes:**
| Route | Purpose |
|-------|---------|
| `/` | Homepage with search, featured stores |
| `/scan` | QR scanner with ZXing |
| `/[storeSlug]` | Store menu page |
| `/orders` | Order history |
| `/profile` | User profile |
| `/wallet` | REZ coins, transactions |
| `/merchant/*` | Merchant dashboard (protected) |
| `/p/[orderNumber]` | Order confirmation |

**Authentication:**
- Phone + OTP (SMS/WhatsApp)
- Phone + PIN
- OAuth2 ("Continue with REZ")
- Token encryption with AES-GCM-256

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://rez-api-gateway.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://rez-api-gateway.onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
NEXT_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
REZ_OAUTH_CLIENT_ID=rez-now
```

---

## Hotel Stack (StayOwn)

### About

**Brand:** StayOwn - India's First Hotel-Owned OTA
**Git:** imrejaul007/hotel-ota
**Docs:** [Hotel OTA README](../Hotel%20OTA/README.md)

### 7 Hotel Apps

| # | App | Purpose | Tech Stack |
|---|-----|---------|-----------|
| 1 | **OTA Web** | Guest booking website | Next.js 16, React 18, TailwindCSS, Recharts |
| 2 | **Hotel Panel** | Hotel staff dashboard | Next.js 16, TailwindCSS, qrcode.react |
| 3 | **Admin Panel** | Platform admin | Next.js 16, TailwindCSS, Recharts |
| 4 | **Corporate Panel** | Corporate accounts | Next.js 16, TailwindCSS |
| 5 | **Mobile** | Guest mobile app | React Native 0.76, Expo 49, Zustand |
| 6 | **API** | Backend API | Node.js, Express 4, Prisma 5, Redis, Socket.io, BullMQ, Razorpay |
| 7 | **Hotel PMS** | Property Management | Node.js, MongoDB, React 18, Vite, MUI 7 |

**Deployment:**
| Service | Render Name | URL |
|---------|-------------|-----|
| API | hotel-ota-api | https://hotel-ota-api.onrender.com |
| OTA Web | hotel-ota-web | https://hotel-ota-web.onrender.com |
| Hotel Panel | hotel-ota-hotel-panel | https://hotel-ota-hotel-panel.onrender.com |
| Admin Panel | hotel-ota-admin | https://hotel-ota-admin.onrender.com |

**ReZ Integration:**
- **Auth:** SSO via REZ Auth Service
- **Wallet:** Coin balance sync via REZ Wallet Service
- **Finance:** Transactions via REZ Finance Service

**Room QR Feature:**
- Location: `Hotel OTA/apps/api/src/routes/room-qr.routes.ts`
- Purpose: Guest services when scanning room QR code
- Intent: `guest_services_scan`

---

## Vertical Apps

### 5. Rendez (Social)

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Expo SDK 50, React Native, Node.js/Express, Prisma (PostgreSQL) |
| **Real-time** | Socket.io with Redis adapter |
| **Repo** | imrejaul007/Rendez |
| **Deployment** | Render + Vercel |

**Features:**
- Discovery feed (location/gender/age matching)
- Like/Swipe system with mutual matches
- Real-time messaging
- Gift system (COIN and MERCHANT_VOUCHER)
- Meetup/Date planning with QR check-in
- Plans (social invites)
- Experience credits (Silver/Gold/Platinum tiers)
- Safety (report, block, shadowScore)
- Referral system
- KYC/Verification

**ReZ Integration:**
- REZ wallet (balance queries, gift transactions)
- REZ catalog (merchant vouchers)
- REZ merchant (venues)
- REZ spending → Experience credits

---

### 6. AdBazaar

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Next.js 16.2, TypeScript, Supabase, Upstash Redis |
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
- Campaign management

**ReZ Integration:**
- OAuth2 Partner (client_id: adbazaar)
- Wallet Service (balance checks)
- Payment Service (canonical routing)
- Intent Capture (AI recommendations)

---

### 7. NextaBiZ (B2B Procurement)

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Next.js 15, Turborepo + pnpm, Supabase, NextAuth.js |
| **Payments** | Stripe |
| **Repo** | imrejaul007/nextabizz |
| **Deployment** | Vercel |

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

**Features:**
- Inventory signals (low stock alerts)
- Purchase orders
- RFQ system
- Catalog browsing
- Supplier portal
- Reorder engine
- Scoring engine
- Credit line (BNPL)

**ReZ Integration:**
- OAuth2 Partner (SSO)
- Merchant Service (lookup)
- Intent Graph (AI recommendations)

---

### 8. CorpPerks

| Attribute | Value |
|-----------|-------|
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

**ReZ Integration:**
- Wallet Service
- Finance Service (BNPL, expenses)
- Karma Service (CSR/volunteer)

---

## Karma Apps

### 9. rez-karma-app (Web)

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | Next.js |
| **Repo** | imrejaul007/rez-karma-app |

### 10. rez-karma-mobile (Mobile)

| Attribute | Value |
|-----------|-------|
| **Tech Stack** | React Native |
| **Repo** | imrejaul007/rez-karma-mobile |

**Purpose:** Social impact and karma score tracking across the ReZ ecosystem.

---

## App Comparison

| App | Type | Expo | Screens | State | Auth |
|-----|------|------|---------|-------|------|
| rez-app-consumer | Consumer | Yes | 200+ | Zustand + Query | JWT |
| rez-app-merchant | Merchant | Yes | 78 | React Query | JWT |
| rez-app-admin | Admin | Yes | 159 | React Query | JWT |
| rez-now | Web | No (Next.js) | 10+ | Zustand | JWT + OAuth |
| Rendez | Social | Yes | 30+ | Zustand + Query | JWT |
| AdBazaar | Web | No (Next.js) | 20+ | Zustand | Supabase + OAuth |
| NextaBiZ | Web | No (Next.js) | 15+ | React Query | NextAuth + OAuth |
| rez-karma-app | Web | No (Next.js) | 10+ | - | JWT |
| rez-karma-mobile | Mobile | Yes | 15+ | - | JWT |

---

**Next:** [PACKAGES.md](PACKAGES.md) - Package documentation
