# REZ Platform — Complete Ecosystem

**Last updated:** 2026-04-26
**Purpose:** How all User Apps and Merchant Apps work together

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REZ ECOSYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CORE INFRASTRUCTURE                            │ │
│  │                                                                          │ │
│  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │ │
│  │   │   API Gateway    │───▶│  Microservices   │───▶│    MongoDB       │ │ │
│  │   │  (rez-gateway)  │    │   (14 services)  │    │   + Redis        │ │ │
│  │   └──────────────────┘    └──────────────────┘    └──────────────────┘ │ │
│  │                                                                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           USER SIDE                                     │ │
│  │                                                                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │ │
│  │  │  REZ App   │  │  REZ Now   │  │  Web Menu  │  │    Rendez      │ │ │
│  │  │ (Consumer) │  │ (Payments) │  │  (Menu QR) │  │   (Social)     │ │ │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └───────┬────────┘ │ │
│  │        │                │                │                 │          │ │
│  │        └────────────────┴────────────────┴─────────────────┘          │ │
│  │                                    │                                     │ │
│  │                           REZ Core Services                              │ │
│  │                                    │                                     │ │
│  └────────────────────────────────────┼─────────────────────────────────────┘ │
│                                       │                                      │
│  ┌────────────────────────────────────┼─────────────────────────────────────┐ │
│  │                          MERCHANT SIDE                                   │ │
│  │                                    │                                     │ │
│  │        ┌───────────────────────────┴───────────────────────────┐      │ │
│  │        │                                                        │      │ │
│  │  ┌─────┴──────┐  ┌────────────┐  ┌────────────┐  ┌─────────┴─────┐  │ │
│  │  │REZ Merchant│  │  AdBazaar  │  │  NextaBiZ  │  │  RestoPapa   │  │ │
│  │  │   (POS)    │  │   (Ads)    │  │ (B2B SaaS) │  │ (Restaurant) │  │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │ │
│  │                                                                          │ │
│  │  ┌────────────────────────────┐  ┌─────────────────────────────────┐   │ │
│  │  │      Hotel PMS             │  │       Karma                     │   │ │
│  │  │  (Property Mgmt + OTA)    │  │  (Social Impact + Rewards)     │   │ │
│  │  └────────────────────────────┘  └─────────────────────────────────┘   │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## USER APPS (Customer-Facing)

### 1. REZ App (Consumer App) — `rez-app-consumer`

**Stack:** Expo SDK 53, React Native 0.79, TypeScript
**Bundle ID:** `money.rez.app`
**Repo:** `imrejaul007/rez-app-consumer`

#### Purpose
Primary consumer-facing app for:
- Discovery (browse stores, products, offers)
- Ordering (food, grocery, home services)
- Payments (wallet, UPI, Razorpay)
- Loyalty (earn/redeem coins, tier benefits)
- Gamification (games, challenges, scratch cards)

#### Key Features
| Category | Features |
|----------|----------|
| Auth | Phone OTP, Email/Password, Biometrics, PIN |
| Wallet | REZ Coins, Transactions, Recharge, REZ Cash |
| Discovery | Home feed, Categories, Search, Map, Near-U |
| Ordering | Cart, Checkout, Order Tracking, Bookings |
| Payments | UPI QR, Razorpay, Wallet Balance, COD |
| Loyalty | Coins, Tiers (Bronze→Platinum), Punch Cards |
| Earn | QR Scan, Social, Referrals, Games, Bill Upload |
| Travel | Flights, Hotels, Trains, Buses, Cabs |
| Home Services | Plumber, Electrician, Cleaning, Salon |
| Social | Friends, Reviews, Events, Creator Content |
| Financial | Gold Savings, Insurance, Subscriptions |

#### Connects To
- **REZ Backend** → Auth, Orders, Wallet, Catalog
- **REZ Now** → Store discovery and QR payments
- **REZ Web Menu** → Menu browsing via QR scan
- **Rendez** → Social features (future SSO)

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `rez-auth-service` | Phone OTP, user identity |
| `rez-wallet-service` | REZ Coins, transactions |
| `rez-backend` | Orders, catalog, store management |
| `rez-merchant-service` | Merchant data, product catalog |
| `rez-payment-service` | UPI/Razorpay payment processing |
| `rez-catalog-service` | Product catalog, search |
| `rez-gamification-service` | Coins, missions, challenges |
| `analytics-events` | Event tracking |

---

### 2. REZ Now — `rez-now`

**Stack:** Next.js 14+, TypeScript, Tailwind CSS
**URL:** `https://rez-now.vercel.app`
**Repo:** `imrejaul007/rez-now`

#### Purpose
Merchant-branded public store page with QR code for:
- In-store ordering
- Digital payments
- Loyalty display

#### Key Features
| Feature | Description |
|---------|-------------|
| Public Store Page | Branded landing with logo, hours, menu |
| QR Code Payment | Scan → Pay via UPI/Razorpay → Earn coins |
| Menu Display | Categories, products, prices, images |
| Order Placement | Browse → Add to cart → Checkout → Pay |
| Real-Time Updates | Socket.io for order status |
| Loyalty Widget | Show stamps, coins, tier benefits |
| Reviews | Browse and submit store reviews |
| Location-Based | Find nearby stores |
| Multi-Store | Single link for franchises |
| WhatsApp Share | Share menu via WhatsApp |

#### Connects To
- **REZ Backend** → Store data, orders, payments
- **REZ App** → Coin crediting, wallet updates

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `rez-backend` | Store data, orders, payments |
| `rez-merchant-service` | Store configuration, KDS |
| `rez-wallet-service` | Coin crediting |
| `rez-auth-service` | User authentication |

---

### 3. REZ Web Menu — `rez-web-menu`

**Stack:** Next.js, React, Socket.io
**URL:** `https://menu.rez.money`
**Repo:** `imrejaul007/rez-web-menu`

#### Purpose
Mobile-optimized QR menu for in-store use:
- Browse menu without app install
- Place orders directly
- Pay via generated UPI QR

#### Key Features
| Feature | Description |
|---------|-------------|
| QR Code Menu | Accessed via store QR code |
| Category Browse | Products organized by category |
| Product Detail | Full info with images, modifiers |
| Cart Management | Add/remove, quantity adjustment |
| Checkout Flow | Name, phone → OTP → Payment |
| UPI QR Payment | Generate QR for payment |
| Order Confirmation | Success screen with order ID |
| Merchant Dashboard | Real-time order management |
| KDS View | Kitchen display for orders |

#### Connects To
- **REZ Backend** → Store catalog, orders
- **REZ Merchant App** → KDS and order notifications

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `rez-backend` | Store catalog, orders, payments |
| `rez-merchant-service` | Order routing, KDS |
| `rez-auth-service` | User OTP verification |

---

### 4. Rendez — `Rendez`

**Stack:** React Native, Node.js, Prisma
**URL:** TBD (Vercel + Render)
**Repo:** `imrejaul007/Rendez`

#### Purpose
Social discovery and engagement layer:
- Event discovery and RSVP
- Social impact activities
- Community challenges
- Creator content hub

#### Key Features
| Feature | Description |
|---------|-------------|
| Events | Local events, experiences, bookings |
| Social Impact | CSR, volunteering, donations |
| Challenges | Community challenges with rewards |
| Near-U | Hyperlocal social discovery |
| Creator Hub | UGC campaigns, Prive |
| Notifications | Activity updates, friend actions |

#### Connects To
- **REZ Auth Service** → SSO via REZ partner API
- **REZ Wallet** → Hold/release coins for social impact
- **REZ Gamification** → Challenge rewards, badges

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `rez-auth-service` | OAuth2 Partner SSO (`/oauth/*` endpoint) |
| `rez-wallet-service` | Hold/release funds for social impact |
| `rez-merchant-service` | Merchant discovery |
| `rendez-backend` | Social features, events, profiles |

---

### 5. Karma — `rez-karma-service`

**Stack:** Node.js, Express, MongoDB
**Repo:** `imrejaul007/Karma`

#### Purpose
Social impact and karma score system:
- Track user reputation and trust
- Social good activities
- Environmental impact tracking
- Community contribution rewards

#### Key Features
| Feature | Description |
|---------|-------------|
| Karma Score | Reputation algorithm (1-1000) |
| Social Impact | Volunteer hours, donations tracked |
| Green Score | Environmental impact metrics |
| Badges | Impact badges earned over time |
| Leaderboards | Top contributors by category |
| Rewards | Coin bonuses for positive karma |

#### Connects To
- **REZ Auth Service** → User identity
- **REZ Wallet** → Reward coin distribution
- **REZ Gamification** → Achievement system

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `rez-auth-service` | User identity |
| `rez-wallet-service` | Reward coin distribution |
| `rez-merchant-service` | Merchant reviews and ratings |
| `rez-gamification-service` | Achievement badges, challenges |

---

### CorpPerks — Enterprise Benefits Platform

**Stack:** React Native (Admin), Node.js (Services)
**GitHub:** `imrejaul007/CorpPerks`

#### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    CorpPerks Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────┐    │
│  │ Admin Dashboard  │    │ Employee App (ReZ)       │    │
│  │ (CorpPerks Admin)│    │ /karma/corp/*            │    │
│  └────────┬─────────┘    └────────────┬─────────────┘    │
│           │                            │                   │
│           └──────────┬─────────────────┘                   │
│                      ▼                                     │
│         ┌──────────────────────────┐                     │
│         │ rez-corpperks-service    │ ← Port 4013         │
│         │ (CorpPerks Gateway API)   │                     │
│         └──────────┬───────────────┘                     │
│                    │                                      │
│    ┌───────────────┼───────────────┐                     │
│    │               │               │                     │
│    ▼               ▼               ▼                     │
│ ┌──────────┐ ┌───────────┐ ┌────────────┐               │
│ │ GST      │ │ Rewards   │ │ Campaigns  │               │
│ │ Invoices │ │ & Tiers   │ │ Management │               │
│ └──────────┘ └───────────┘ └────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Integration Layer                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │Hotel Service│  │Procurement   │  │ Wallet     │  │  │
│  │  │(Makcorps)  │  │Service       │  │ Service    │  │  │
│  │  │Port: 4011  │  │(NextaBizz)  │  │Port: 4004 │  │  │
│  │  └─────────────┘  │Port: 4012   │  └────────────┘  │  │
│  │                   └──────────────┘                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Services
| Service | Port | Description |
|---------|------|-------------|
| rez-corpperks-service | 4013 | Gateway API |
| rez-hotel-service | 4011 | Makcorps proxy |
| rez-procurement-service | 4012 | NextaBizz proxy |

#### API Routes
| Route | Description |
|-------|-------------|
| `/api/corp` | Benefits, Employees |
| `/api/gst` | GST Invoices |
| `/api/rewards` | ReZ Coins, Catalog |
| `/api/campaigns` | Gift, Karma, Reward |
| `/api/hris` | GreytHR, BambooHR, Zoho |
| `/api/integrations` | Health, Webhooks |
| `/api/finance` | Wallet, Cards, BNPL |
| `/api/analytics` | Dashboard, Reports |

#### MongoDB Models (11)
Company, Employee, Benefit, BenefitUsage, Booking, Invoice, Order, Campaign, Wallet, Card, RewardTransaction

#### Deploy
```bash
# Docker
docker-compose up -d

# Render Blueprint
# https://dashboard.render.com/blueprints
```

#### Modules
| Module | Description |
|--------|-------------|
| Benefits | Meal, Travel, Wellness, Learning, Gift |
| Employees | HRIS sync, enrollment |
| Hotel Bookings | Makcorps OTA, GST invoices |
| GST | Invoice generation, GSTR-1 |
| Gifting | NextaBizz procurement |
| Karma | Volunteer campaigns |
| Rewards | ReZ Coins, tiers |
| Analytics | Dashboard, reports |
| Finance | Wallet, Cards, BNPL |
| HRIS | GreytHR, BambooHR, Zoho |

---

### 6. Stay Owen (Hotel OTA) — `Hotel OTA`

**Stack:** Node.js, Prisma, PostgreSQL
**URL:** TBD
**Repo:** `imrejaul007/hotel-ota`

#### Purpose
Hotel property management + OTA (Online Travel Agency):
- Hotel listing and booking
- Property management system
- Guest engagement

#### Key Features
| Feature | Description |
|---------|-------------|
| Hotel Listings | Property pages with photos, amenities |
| Room Booking | Availability, pricing, reservations |
| Property Management | Housekeeping, front desk, billing |
| Guest App | Digital key, requests, checkout |
| Channel Manager | Sync across OTAs |

#### Connects To
- **REZ Auth Service** → SSO for hotel guests
- **REZ Wallet** → Booking payments, loyalty coins
- **REZ Backend** → Future integration for hotel discovery

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `Hotel OTA API` (apps/api) | Hotel listings, bookings, PMS |
| `rez-auth-service` | OAuth2 Partner SSO for guest login |
| `rez-wallet-service` | Booking payments, coin rewards |

---

## MERCHANT APPS (Business-Facing)

### 1. REZ Merchant App — `rez-app-marchant` (PRIMARY - FOR ALL MERCHANTS)

**Stack:** Expo SDK 53, React Native
**Bundle ID:** `com.rez.admin`
**Repo:** `imrejaul007/rez-app-marchant`

#### Purpose
**MAIN POS AND ORDER MANAGEMENT APP FOR ALL MERCHANTS** including:
- Restaurants (dine-in, takeaway, delivery)
- Retail stores
- Salons and spas
- Hotels
- Any business using REZ platform

Features:
- Point of Sale (POS) with KDS (Kitchen Display System)
- **Receives ALL orders** from: REZ App, REZ Now, REZ Web Menu
- Inventory management with reorder signals
- Staff management and commission tracking
- Real-time order tracking via Socket.io
- Settlement and payout management

#### Key Features
| Category | Features |
|----------|----------|
| **KDS (Kitchen Display)** | Real-time order queue, status updates, audio alerts |
| POS | Product catalog, barcode scan, modifiers, split bill |
| **Order Management** | Order queue, KDS, real-time tracking (ALL sources) |
| Inventory | Stock tracking, low-stock alerts, reorder signals |
| Analytics | Revenue, orders, customers, trends |
| Staff | Roles, permissions, commission tracking |
| Payments | Cash, UPI QR, Razorpay, wallet |
| Settlement | Auto-settlement, payout tracking |
| Loyalty | Punch cards, customer history, offers |
| Multi-Store | Franchise management, centralized menu |

#### Order Flow (Already Integrated)
```
REZ App (Consumer) ─────┐
                         │
REZ Now (Web Menu) ─────┼──▶ REZ Merchant App (KDS) ────▶ Merchant receives orders
                         │         │
REZ Web Menu (QR) ─────┘         │
                                   │ Socket.io real-time
                                   ▼
                            Status updates ────▶ Customer sees ETA
```

#### Connects To
- **REZ Backend** → Orders, payments, wallet settlement
- **REZ App** → Customer orders, loyalty
- **REZ Now** → Store page updates, web orders
- **REZ Web Menu** → QR-based orders

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `rez-merchant-service` | Orders, KDS, product catalog, inventory |
| `rez-wallet-service` | Settlement, payouts, balance |
| `rez-auth-service` | Merchant login, OTP |
| `rez-backend` | Store data, customer orders |

---

### 2. AdBazaar — `adBazaar`

**Stack:** Next.js 14, Supabase, Razorpay, Tailwind CSS
**URL:** TBD (Vercel)
**Repo:** `imrejaul007/adBazaar`

#### Purpose
Advertising marketplace connecting brands with merchants:
- Brand ad campaigns
- CPA/CPM pricing
- Vendor fulfillment
- Payout management

#### Key Features
| Feature | Description |
|---------|-------------|
| Campaign Creation | Brands create ads with budget/targeting |
| CPA Campaigns | Pay per acquisition/conversion |
| CPM Campaigns | Pay per 1000 impressions |
| Placements | Home banner, explore, store listing, search |
| Analytics | Views, clicks, CTR, conversions, ROI |
| Vendor Management | Merchants fulfill impressions/clicks |
| Payouts | Weekly settlement to merchant wallet |
| Ad Proof | Creative approval workflow |

#### Connects To
- **REZ Backend** → Merchant wallet for payouts
- **REZ Merchant App** → Vendor fulfillment notifications
- **REZ App** → Ad impressions, attribution

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `AdBazaar DB` (Supabase) | Campaign data, brand accounts, analytics |
| `rez-merchant-service` | Merchant payout settlement webhook |
| `rez-auth-service` | OAuth2 Partner SSO (`/oauth/*` endpoint) |

---

### 3. NextaBiZ — `nextabizz`

**Stack:** Next.js 15, TypeScript, Turborepo, Supabase
**URL:** TBD (Vercel)
**Repo:** `imrejaul007/nextabizz`

#### Purpose
B2B SaaS platform for business management:
- Inventory management
- RFQ (Request for Quote)
- Procurement workflows
- Supply chain signals

#### Key Features
| Feature | Description |
|---------|-------------|
| Inventory | Stock levels, reorder signals, forecasting |
| RFQ | Create, track, compare quotes |
| Signals | Low stock alerts, demand forecasting |
| Purchase Orders | Create, track, receive inventory |
| Suppliers | Vendor management, performance tracking |
| Analytics | Spend, inventory turnover, trends |
| Webhooks | Third-party integrations |

#### Connects To
- **REZ Backend** → User auth (if using REZ accounts)
- **External APIs** → Supplier systems, ERPs

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `nextabizz-api` (Supabase) | B2B inventory, RFQ, procurement |
| `rez-merchant-service` | Reorder signal webhook (`/internal/nextabizz/reorder-signal`) |

---

### 4. RestoPapa (Restaurian) — `restaurantapp` ⚠️ STANDALONE - NOT INTEGRATED

**Stack:** Node.js, Monorepo (NestJS + Next.js)
**Status:** Standalone SaaS - NOT connected to REZ ecosystem
**Repo:** `imrejaul007/restaurantapp`

#### Purpose
**STANDALONE restaurant management SaaS** - NOT integrated with REZ ecosystem:
- Separate database (Prisma + PostgreSQL)
- Own user authentication system
- Own order management
- NOT connected to REZ Wallet, coins, or loyalty

#### Key Features
| Feature | Description |
|---------|-------------|
| Menu Builder | Categories, items, modifiers, pricing |
| Reservations | Table booking, waitlist management |
| KDS | Kitchen display, prep time tracking |
| Delivery | Integration with delivery partners |
| Analytics | Table turnover, popular items, peak hours |
| Multi-Outlet | Franchise management |
| Hiring/Verification | Staff management |
| Marketplace | Vendor products |
| Job Portal | Recruitment features |
| Community Forum | Social features |
| Messaging | Internal chat |

#### NOT Connected To
- ❌ REZ Backend
- ❌ REZ Wallet (no coin system)
- ❌ REZ Merchant App
- ❌ REZ App (consumers)
- ❌ REZ Now / Web Menu
- ❌ Any REZ microservices

#### Use Case
Restaurants who want a **complete standalone restaurant management system** separate from the REZ ecosystem. They can use RestoPapa OR REZ Merchant, but not both for order management.

---

### 5. Hotel PMS (Part of Hotel OTA)

**Stack:** Node.js, Prisma, PostgreSQL
**Repo:** `imrejaul007/hotel-ota`

#### Purpose
Property Management System for hotels:
- Front desk operations
- Housekeeping management
- Billing and Folios
- Channel manager

#### Key Features
| Feature | Description |
|---------|-------------|
| Front Desk | Check-in/out, reservations, room status |
| Housekeeping | Task assignment, room status, maintenance |
| Billing | Folios, charges, payments, invoicing |
| Channel Manager | Sync with Booking.com, Expedia, etc. |
| Reports | Occupancy, ADR, RevPAR, guest history |

#### Connects To
- **Stay Owen (OTA)** → Booking synchronization
- **REZ Wallet** → Future: guest wallet for hotel services

#### Service Dependencies
| Service | Purpose |
|---------|---------|
| `Hotel OTA API` (apps/api) | Booking data, PMS operations |
| `rez-auth-service` | Staff authentication |
| `rez-wallet-service` | Future: guest wallet for services |

---

## ECOSYSTEM DATA FLOWS

### Flow 1: Customer Scans QR → Orders → Pays → Earns Coins

```
┌──────────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────────┐
│   REZ App    │────▶│ REZ Now   │────▶│   Web     │────▶│   REZ Backend    │
│ (Consumer)   │     │ (Store)   │     │   Menu    │     │   (Monolith)     │
└──────────────┘     └───────────┘     └───────────┘     └────────┬─────────┘
      │                                                           │
      │ QR Scan = +coins                                         │
      │                                                           │
      ▼                                                           ▼
┌──────────────┐                                          ┌──────────────────┐
│  REZ Wallet  │◀─────────────────────────────────────────│  Order Created   │
│  Service     │          Credit coins after payment       │  (status: paid)  │
└──────────────┘                                          └──────────────────┘
```

**Steps:**
1. Consumer scans QR code in restaurant
2. REZ App opens REZ Now store page
3. Consumer browses menu on Web Menu
4. Places order → enters phone for OTP
5. Payment via UPI QR generated
6. Merchant receives order via REZ Merchant App (KDS)
7. Payment captured → order status = "preparing"
8. REZ Wallet credits coins to consumer
9. Settlement auto-calculated for merchant payout

---

### Flow 2: Merchant Creates Ad Campaign → Vendors Fulfill → Get Paid

```
┌──────────────┐     ┌───────────┐     ┌───────────────┐     ┌──────────────┐
│    Brand     │────▶│  AdBazaar │────▶│    Vendors    │────▶│REZ Merchant │
│   (Client)   │     │  (Admin)  │     │ (Merchants)  │     │    App      │
└──────────────┘     └─────┬─────┘     └───────────────┘     └──────────────┘
                           │                                        │
                           │ Campaign Live                          │
                           ▼                                        │
                    ┌──────────────┐                               │
                    │  REZ App     │◀──────────────────────────────┘
                    │ (Impressions│        Fulfillment updates
                    │  + Clicks)  │
                    └──────────────┘
                           │
                           │ Daily spend tracked
                           ▼
                    ┌──────────────┐
                    │ REZ Backend  │──────▶ Settlement → Merchant Wallet
                    │ (Payout)    │
                    └──────────────┘
```

**Steps:**
1. Brand creates campaign on AdBazaar (CPM/CPA)
2. Campaign approved by REZ admin
3. Vendors book campaign slots
4. REZ App serves impressions to users
5. Vendors fulfill impressions/clicks
6. System tracks daily spend
7. Campaign ends → Settlement calculated
8. Payout to vendor wallet via REZ Wallet Service

---

### Flow 3: B2B Procurement via NextaBiZ

```
┌──────────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐
│   Merchant   │────▶│ NextaBiZ  │────▶│  Supplier │────▶│   External   │
│   (Buyer)    │     │  (SaaS)   │     │  (RFQ)   │     │     ERP      │
└──────────────┘     └─────┬─────┘     └───────────┘     └──────────────┘
                           │
                           │ Inventory Updated
                           ▼
                    ┌──────────────┐
                    │  Low Stock    │──────▶ REZ Merchant App
                    │   Signals     │        (Reorder alerts)
                    └──────────────┘
```

**Steps:**
1. Merchant manages inventory in NextaBiZ
2. Stock falls below threshold → Signal generated
3. Merchant creates RFQ for replenishment
4. Suppliers submit quotes
5. Merchant compares and creates PO
6. Inventory updated on receipt
7. Low-stock signal clears

---

### Flow 4: Hotel Booking via Stay Owen

```
┌──────────────┐     ┌───────────┐     ┌───────────┐     ┌──────────────┐
│   Guest      │────▶│ Stay Owen │────▶│  Hotel    │────▶│   Hotel PMS  │
│   (OTA)      │     │   (OTA)   │     │  (Booking)│     │   (Backend)  │
└──────────────┘     └─────┬─────┘     └───────────┘     └──────────────┘
                           │
                           │ Payment captured
                           ▼
                    ┌──────────────┐
                    │ REZ Wallet   │──────▶ Loyalty coins for booking
                    │   Service    │
                    └──────────────┘
```

**Steps:**
1. Guest browses hotels on Stay Owen
2. Selects dates, room type
3. Enters REZ credentials (SSO)
4. Pays via REZ Wallet or Razorpay
5. Booking confirmed → Pushed to Hotel PMS
6. Guest receives confirmation
7. Coins credited to hotel's wallet
8. Check-in at hotel → Digital key via app

---

## CROSS-APP INTEGRATIONS

### Authentication Matrix

| App | REZ Auth | Supabase Auth | Standalone |
|-----|----------|---------------|------------|
| REZ App | ✅ Primary | ❌ | ❌ |
| REZ Merchant | ✅ Primary | ❌ | ❌ |
| REZ Now | ✅ Via backend | ❌ | ❌ |
| REZ Web Menu | ✅ Via backend | ❌ | ❌ |
| Rendez | ✅ Partner SSO | ❌ | ❌ |
| Stay Owen | ✅ SSO | ❌ | ❌ |
| AdBazaar | ❌ | ✅ Primary | ❌ |
| NextaBiZ | ❌ | ❌ | ✅ Standalone + Webhook |
| RestoPapa | ❌ | ❌ | ✅ Standalone |
| Hotel PMS | ❌ | ❌ | ✅ Standalone |

### Wallet Integration Matrix

| App | REZ Wallet | Supabase DB | Standalone |
|-----|-----------|-------------|------------|
| REZ App | ✅ Full | ❌ | ❌ |
| REZ Merchant | ✅ Settlement only | ❌ | ❌ |
| REZ Now | ✅ Coins earned | ❌ | ❌ |
| REZ Web Menu | ✅ Via backend | ❌ | ❌ |
| Rendez | ✅ Hold/Release | ❌ | ❌ |
| Stay Owen | ✅ Bookings | ❌ | ❌ |
| AdBazaar | ✅ Payouts | ❌ | ❌ |
| NextaBiZ | ❌ | ❌ | ✅ Standalone + Webhook |
| RestoPapa | ❌ | ❌ | ✅ Standalone |
| Hotel PMS | ❌ | ❌ | ✅ Standalone |

### Data Sharing

| From → To | Shared Data | Method |
|-----------|------------|--------|
| REZ App → REZ Now | Store data | API calls |
| REZ Now → Web Menu | Menu data | API calls |
| Web Menu → REZ Merchant | Orders | Socket.io |
| AdBazaar → REZ Merchant | Campaign, payouts | API calls |
| Stay Owen → Hotel PMS | Bookings | Webhook |
| NextaBiZ → REZ Merchant | Inventory signals | ✅ Webhook (`/internal/nextabizz/reorder-signal`) |

---

## MERCHANT VALUE CHAIN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MERCHANT JOURNEY ON REZ                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DISCOVERY                                                               │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Find REZ at trade show / referral / online                   │     │
│     │  • Browse rez.money/merchant                                     │     │
│     │  • Understand coin-based loyalty system                          │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  2. ONBOARDING                                                              │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Download REZ Merchant App                                     │     │
│     │  • Register with phone, business details                         │     │
│     │  • Submit KYC: PAN, GST, Bank Account                           │     │
│     │  • Upload documents                                              │     │
│     │  • Admin approves → Account active                               │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  3. SETUP                                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Configure store: hours, delivery zones, minimums              │     │
│     │  • Upload menu: categories, products, prices, images             │     │
│     │  • Set up REZ Now page: logo, banner, offers                    │     │
│     │  • Print QR codes for tables / counter                           │     │
│     │  • Configure POS: products, modifiers, tax                        │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  4. GO LIVE                                                                 │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Start receiving QR scans                                      │     │
│     │  • Customers order via Web Menu                                   │     │
│     │  • KDS shows orders → Prepare → Serve                            │     │
│     │  • Pay via UPI / Cash / Razorpay                                 │     │
│     │  • Coins credited to customer wallets                             │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  5. GROW                                                                    │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Run offers: first-order discount, happy hour                   │     │
│     │  • AdBazaar campaigns: reach more customers                       │     │
│     │  • Loyalty: punch cards, tier rewards                            │     │
│     │  • Analytics: peak hours, popular items, customer retention      │     │
│     │  • Multi-outlet: manage franchise from one dashboard              │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  6. SETTLE                                                                  │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Daily/weekly auto-settlement                                   │     │
│     │  • Net = Orders - Refunds - REZ Fee (2-5%)                       │     │
│     │  • Bank transfer within 1-3 business days                        │     │
│     │  • Wallet balance visible in merchant app                         │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## USER VALUE CHAIN

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY ON REZ                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DISCOVER                                                                │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Download REZ App                                              │     │
│     │  • Browse home feed: nearby stores, categories                   │     │
│     │  • Search: food, beauty, grocery, travel                         │     │
│     │  • Scan QR at physical store                                     │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  2. ENGAGE                                                                  │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Earn coins: QR scan (5 coins), social share (10 coins)        │     │
│     │  • Play games: scratch card, spin to win                         │     │
│     │  • Complete missions: daily tasks, challenges                     │     │
│     │  • Write reviews: earn coins for feedback                        │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  3. TRANSACT                                                                 │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Order food / book appointment / pay bill                      │     │
│     │  • Use REZ Coins to discount payment                              │     │
│     │  • Pay via UPI / Card / Wallet balance                           │     │
│     │  • Track order in real-time                                       │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  4. LOYALTY                                                                  │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Earn stamps: punch card for free item after 10 visits         │     │
│     │  • Tier benefits: Bronze → Silver → Gold → Platinum              │     │
│     │  • Birthday rewards: bonus coins on birthday                     │     │
│     │  • Referral bonuses: invite friends, earn when they order        │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  5. EXPLORE                                                                  │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Travel: book flights, hotels, trains, buses                   │     │
│     │  • Home services: book plumber, electrician, cleaner             │     │
│     │  • Social: RSVP events, join challenges, creator content         │     │
│     │  • Financial: gold savings, insurance, subscriptions              │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                    ▼                                        │
│  6. EARN MORE                                                                │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │  • Upload bills: earn cashback on utility payments               │     │
│     │  • Stay Owen: earn coins on hotel bookings                       │     │
│     │  • Karma: earn coins for social impact activities                │     │
│     │  • Prive: earn coins for creator content                         │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## REVENUE MODEL SUMMARY

| Revenue Stream | Source | Amount |
|---------------|--------|--------|
| **Platform Commission** | Per transaction | 2-5% of GMV |
| **Coin Spread** | Buy/sell spread | ~1% |
| **AdBazaar CPM** | Impressions | ₹10-50/1000 |
| **AdBazaar CPA** | Conversions | ₹5-100/conversion |
| **Premium Listings** | Featured stores | ₹500-5000/month |
| **Travel Booking** | Commission | 5-15% of booking |
| **SaaS Subscriptions** | NextaBiZ | ₹999-9999/month |
| **Hotel PMS** | Monthly subscription | ₹5000-50000/month |
| **REZ Merchant Pro** | Premium features | ₹199-999/month |

---

## PLATFORM METRICS

| Metric | Target | Current |
|--------|--------|---------|
| **GMV** | ₹10Cr/month | TBD |
| **Active Merchants** | 1000+ | TBD |
| **Active Consumers** | 50000+ | TBD |
| **Monthly Orders** | 50000+ | TBD |
| **Coin Circulation** | ₹1Cr | TBD |
| **App Downloads** | 100K+ | TBD |
| **DAU/MAU** | 30%+ | TBD |

---

## APP-TO-SERVICE DEPENDENCY MATRIX

### Legend
- ✅ **Full integration** — actively used
- 🔗 **Webhook/API** — receives/provides data
- 🔐 **OAuth2** — authenticated via partner SSO
- ❌ **Not connected**

### Consumer Apps

| App | rez-auth | rez-wallet | rez-backend | rez-merchant | rez-payment | rez-catalog | rez-gamification | Rendez API | Hotel OTA API | AdBazaar DB |
|-----|----------|-----------|-------------|-------------|-------------|-------------|-----------------|------------|---------------|-------------|
| **REZ App** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **REZ Now** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **REZ Web Menu** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Rendez** | 🔐 | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Karma** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Room QR (Hotel)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### Merchant Apps

| App | rez-auth | rez-wallet | rez-backend | rez-merchant | rez-payment | rendez-backend | Hotel OTA API | AdBazaar DB | nextabizz-api |
|-----|----------|-----------|-------------|-------------|-------------|---------------|---------------|-------------|---------------|
| **REZ Merchant** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AdBazaar** | 🔐 | 🔗 | ❌ | 🔗 | ❌ | ❌ | ❌ | ✅ | ❌ |
| **NextaBiZ** | ❌ | ❌ | ❌ | 🔗 | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Hotel PMS** | ✅ | 🔗 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **RestoPapa** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Service Definitions

| Service | Repo | Database | Purpose |
|---------|------|----------|---------|
| `rez-auth-service` | `imrejaul007/rez-auth-service` | MongoDB + Redis | Phone OTP, OAuth2 Partner SSO |
| `rez-wallet-service` | `imrejaul007/rez-wallet-service` | MongoDB + Redis | REZ Coins, transactions, settlements |
| `rez-backend` | `imrejaul007/rez-backend` | MongoDB | Orders, stores, catalog, customer data |
| `rez-merchant-service` | `imrejaul007/rez-merchant-service` | MongoDB + Redis | KDS, product catalog, inventory, **PRIMARY ORDER RECEIVER** |
| `rez-payment-service` | `imrejaul007/rez-payment-service` | MongoDB | UPI/Razorpay payment processing |
| `rez-catalog-service` | `imrejaul007/rez-catalog-service` | MongoDB | Product catalog, search, recommendations |
| `rez-gamification-service` | `imrejaul007/rez-gamification-service` | MongoDB | Coins, missions, challenges, badges |
| `rendez-backend` | `imrejaul007/Rendez` | PostgreSQL (Prisma) | Social features, events, profiles |
| `Hotel OTA API` | `imrejaul007/hotel-ota/apps/api` | PostgreSQL (Prisma) | Hotel listings, bookings, PMS |
| `AdBazaar DB` | `imrejaul007/adBazaar` | Supabase (PostgreSQL) | Ad campaigns, brands, vendors |
| `nextabizz-api` | `imrejaul007/nextabizz` | Supabase (PostgreSQL) | B2B inventory, RFQ, procurement |
| `analytics-events` | `imrejaul007/analytics-service` | MongoDB | Event tracking |

### Order Flow — PRIMARY PATH

```
CONSUMER APPS → rez-merchant-service (RECEIVES ALL ORDERS) → REZ Merchant App (KDS)

Sources of orders into rez-merchant-service:
  1. REZ App        →  rez-backend         →  rez-merchant-service
  2. REZ Now        →  rez-backend         →  rez-merchant-service
  3. REZ Web Menu   →  rez-backend         →  rez-merchant-service
  4. Room QR (Hotel) →  Hotel OTA API      →  rez-merchant-service

ALL orders land in rez-merchant-service → Merchant sees via REZ Merchant App (KDS)
```

---

## LAST UPDATED
- 2026-04-26: Initial ecosystem documentation
- 2026-04-26: Added service dependency matrix with OAuth2 and webhook connections
