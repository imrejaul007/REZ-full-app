# ReZ Ecosystem - Connectivity & Architecture Diagrams

**Last Updated:** 2026-05-01
**Purpose:** Visual documentation of system architecture and connections

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Consumer App Connectivity](#consumer-app-connectivity)
3. [Merchant App Connectivity](#merchant-app-connectivity)
4. [Hotel OTA Connectivity](#hotel-ota-connectivity)
5. [Service Communication](#service-communication)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [ReZ Mind Architecture](#rez-mind-architecture)

---

## System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              REZ ECOSYSTEM ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENTS                                            │ │
│  │                                                                          │ │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │   │   Mobile    │  │     Web     │  │   Admin     │  │   Partner   │  │ │
│  │   │    Apps     │  │    Apps     │  │   Portal    │  │    APIs     │  │ │
│  │   │             │  │             │  │             │  │             │  │ │
│  │   │ • Consumer  │  │ • REZ Now   │  │ • Admin App │  │ • Rendez    │  │ │
│  │   │ • Merchant  │  │ • AdBazaar  │  │             │  │ • AdBazaar  │  │ │
│  │   │ • Admin     │  │ • NextaBiZ  │  │             │  │ • NextaBiZ  │  │ │
│  │   │ • Hotel OTA │  │             │  │             │  │             │  │ │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │ │
│  │          │                 │                 │                 │          │ │
│  └──────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘ │
│             │                 │                 │                 │              │
│             └─────────────────┴────────┬────────┴─────────────────┘              │
│                                      │                                        │
│  ════════════════════════════════════╪═══════════════════════════════════════════│
│  ║                                    │                                          ║
│  ║                                    ▼                                          ║
│  ║                        ┌───────────────────────┐                             ║
│  ║                        │    API Gateway        │                             ║
│  ║                        │   (Nginx + Kong)      │                             ║
│  ║                        │   :443 / :5002        │                             ║
│  ║                        └───────────┬───────────┘                             ║
│  ║                                    │                                         ║
│  ║  ══════════════════════════════════╪═══════════════════════════════════════║
│  ║  ║                               │                                          ║
│  ║  ║        CORE SERVICES          │     GROWTH SERVICES                     ║
│  ║  ║  ═════════════════════════════╪═══════════════════════════════════════║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │   Auth Service    │◄─────┼──────│ Gamification Svc   │          ║
│  ║  ║   │      :4002        │      │      │      :3001         │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │   Wallet Service   │◄─────┼──────│   Ads Service      │          ║
│  ║  ║   │      :4004        │      │      │      :4007        │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │   Order Service    │◄─────┼──────│ Marketing Service  │          ║
│  ║  ║   │      :3006        │      │      │      :4000        │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │  Payment Service   │◄─────┼──────│   Karma Service    │          ║
│  ║  ║   │      :4001        │      │      │      :3009        │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │  Merchant Service  │◄─────┼──────│  Finance Service   │          ║
│  ║  ║   │      :4005        │      │      │      :4006        │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │  Catalog Service   │◄─────┼──────│ Scheduler Service  │          ║
│  ║  ║   │      :3005        │      │      │      :3012        │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐      │      ┌────────────────────┐          ║
│  ║  ║   │  Search Service    │      │      │  CorpPerks Svc    │          ║
│  ║  ║   │      :4003        │      │      │      :4013        │          ║
│  ║  ║   └────────────────────┘      │      └────────────────────┘          ║
│  ║  ║                               │                                          ║
│  ║  ════════════════════════════════╪═══════════════════════════════════════║
│  ║                                    │                                         ║
│  ║  ══════════════════════════════════╪═══════════════════════════════════║
│  ║  ║                               │                                          ║
│  ║  ║   AI LAYER (ReZ Mind)        │                                          ║
│  ║  ║   ════════════════════════════╪═══════════════════════════════════║
│  ║  ║                               │                                          ║
│  ║  ║   ┌────────────────────┐     │      ┌────────────────────┐         ║
│  ║  ║   │  Intent Graph      │◄─────┴──────│ Insights Service  │         ║
│  ║  ║   │      :3001        │            │                  │         ║
│  ║  ║   └────────────────────┘            └────────────────────┘         ║
│  ║  ║            │                                                    ║
│  ║  ║            ▼                                                    ║
│  ║  ║   ┌────────────────────┐                                      ║
│  ║  ║   │ Automation Service │                                      ║
│  ║  ║   │                  │                                      ║
│  ║  ║   │  8 AI Agents     │                                      ║
│  ║  ║   │  (Autonomous)     │                                      ║
│  ║  ║   └────────────────────┘                                      ║
│  ║  ║                                                                  ║
│  ║  ═══════════════════════════════════════════════════════════════════║
│  ║                                                                      ║
│  ║  ┌──────────────────────────────────────────────────────────────┐ ║
│  ║  │                    DATA LAYER                                 │ ║
│  ║  │  ════════════════════════════════════════════════════════════ │ ║
│  ║  │                                                              │ ║
│  ║  │     ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │ ║
│  ║  │     │  MongoDB   │  │   Redis    │  │   PostgreSQL      │  │ ║
│  ║  │     │            │  │            │  │                   │  │ ║
│  ║  │     │ • Auth DB  │  │ • Cache    │  │ • Rendez          │  │ ║
│  ║  │     │ • Wallet   │  │ • Sessions │  │ • Hotel OTA       │  │ ║
│  ║  │     │ • Orders   │  │ • Queues   │  │ • NextaBiZ        │  │ ║
│  ║  │     │ • Catalog  │  │ • Pub/Sub  │  │                   │  │ ║
│  ║  │     │ • etc.     │  │            │  │                   │  │ ║
│  ║  │     └────────────┘  └────────────┘  └────────────────────┘  │ ║
│  ║  │                                                              │ ║
│  ║  └──────────────────────────────────────────────────────────────┘ ║
│  ║                                                                      ║
│  ╚══════════════════════════════════════════════════════════════════════════╝
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Consumer App Connectivity

### rez-app-consumer → Services

```
┌─────────────────────────────────────────────────────────────────┐
│                      rez-app-consumer                               │
│                     (Expo SDK 53 / RN 0.79)                       │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    rez-api-gateway                                 │
│            https://rez-api-gateway.onrender.com/api               │
└────────────────────────────┬──────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │ Wallet Svc   │    │ Payment Svc  │
│   :4002     │    │   :4004      │    │   :4001      │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                      MongoDB                                   │
│                  (Users, Wallets, Orders)                     │
└──────────────────────────────────────────────────────────────┘

                             │
                             │ Async Events
                             ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Gamification │    │ Analytics    │    │  Intent      │
│   :3001     │    │   :3006     │    │  Graph :3001 │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Connection Details

| Service | URL | Purpose |
|---------|-----|---------|
| Gateway | `https://rez-api-gateway.onrender.com/api` | Main API |
| Auth | `https://rez-auth-service.onrender.com` | Login, OTP |
| Wallet | `https://rez-wallet-service-36vo.onrender.com` | Balance, coins |
| Payment | `https://rez-payment-service.onrender.com` | Razorpay |
| Search | `https://rez-search-service.onrender.com` | Products |
| Catalog | `https://rez-catalog-service-1.onrender.com` | Menu |
| Intent | `https://rez-intent-graph.onrender.com` | AI tracking |
| Socket | `https://rez-backend-8dfu.onrender.com` | Real-time |

---

## Merchant App Connectivity

### rez-app-merchant → Services

```
┌─────────────────────────────────────────────────────────────────┐
│                    rez-app-merchant                               │
│                     (Expo SDK 55 / RN 0.76)                       │
└────────────────────────────┬──────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Gateway    │    │  Merchant    │    │    Socket    │
│              │    │   Service    │    │              │
│              │───►│   :4005     │    │              │
│              │    │              │    │              │
│              │    │              │    │              │
│              │    └──────────────┘    └──────┬───────┘
│              │                               │
└──────────────┘                               │
                                              │ WebSocket
                                              ▼
                                    ┌──────────────┐
                                    │   Backend    │
                                    │  (Socket.IO)│
                                    │ :8dfu       │
                                    └──────────────┘
```

---

## Hotel OTA Connectivity

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Hotel OTA Frontend Apps                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │   OTA Web    │  │ Hotel Panel  │  │  Admin      │        │
│   │  (Guests)    │  │   (Staff)    │  │  (Platform) │        │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│          │                 │                  │                 │
│          └─────────────────┼──────────────────┘                 │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Hotel OTA API (Express.js)                     │
│                  https://hotel-ota-api.onrender.com               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Routes: auth, hotel, booking, wallet, admin, corporate,      │
│           room-service, room-chat, room-qr, pms, mining         │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │   BullMQ    │  │  Socket.io   │  │   Prisma    │        │
│   │   (Jobs)    │  │ (Real-time) │  │  (Postgres) │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ReZ Services Integration                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│   │   REZ Auth   │  │   REZ Wallet │  │ REZ Finance │        │
│   │   (SSO)      │  │   (Coins)    │  │             │        │
│   └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Room QR Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Guest       │         │  Mobile App  │         │ Hotel OTA   │
│  Scans QR    │────────►│              │────────►│  Room QR API │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────┬───────┘
                                                           │
                         ┌─────────────────────┐            │
                         │  HMAC Signature      │            │
                         │  + Expiration Check │            │
                         └─────────────────────┘            │
                                                           │
                                                           ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Hotel     │         │   Room QR    │         │    RTMN     │
│     PMS      │◄────────│  Validation  │────────►│   Intent    │
│              │         │   Response   │         │   Graph     │
└──────────────┘         └──────────────┘         └──────────────┘
```

---

## Service Communication

### Service-to-Service Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Service A                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Internal Service Token Validation                          │   │
│  │ Header: x-internal-token + x-internal-service           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            │ HTTP Request                       │
│                            │ + Headers                         │
│                            ▼                                     │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service B                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Extract x-internal-token header                      │   │
│  │ 2. Validate against INTERNAL_SERVICE_TOKENS_JSON          │   │
│  │ 3. Check x-internal-service matches                       │   │
│  │ 4. Allow/deny request                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Event Publishing (BullMQ + Redis)

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Order Svc    │         │    Redis    │         │  Gamification│
│              │         │              │         │   Service   │
│ Create Order│────────►│  Publish    │────────►│ Subscribe   │
│              │         │  Event      │         │             │
└──────────────┘         └──────────────┘         └──────────────┘

Event: order.created
{
  "event": "order.created",
  "orderId": "ord_123",
  "userId": "usr_456",
  "total": 500,
  "coinsEarned": 50
}
```

---

## Data Flow Diagrams

### QR Scan → Coin Earning Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Consumer scans QR code (menu.rez.money/qr/:storeId)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Gateway /api/qr-checkin/scan → rez-backend                  │
│    or → rez-merchant-service                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend credits wallet via rez-wallet-service               │
│    POST /wallet/credit                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Wallet Service:                                              │
│    - Create transaction record                                   │
│    - Update balance                                             │
│    - Distributed lock on user wallet                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Backend credits coins via rez-gamification-service          │
│    POST /gamification/earn                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Gamification Service:                                        │
│    - Award points                                              │
│    - Check daily cap                                            │
│    - Update achievement progress                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Response back to consumer app                                │
│    { success: true, coinsEarned: 10, newBalance: 150 }        │
└─────────────────────────────────────────────────────────────────┘
```

### Order → Payment Flow

```
┌──────────────┐
│   Consumer   │
│  Creates     │
│   Order      │
└──────┬───────┘
       │
       │ POST /orders/create
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Order Service                                                    │
│ - Create order (status: 'placed')                               │
│ - Save to MongoDB                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /payments/initiate
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Payment Service                                                   │
│ - Create Razorpay order                                         │
│ - Return order_id                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │                                           │
       ▼                                           ▼
┌──────────────┐                         ┌──────────────┐
│  Consumer    │                         │   Razorpay   │
│  Completes   │                         │  Gateway     │
│  Payment     │                         │              │
└──────────────┘                         └──────┬───────┘
                                                  │
       ┌─────────────────────┐                   │
       │  Webhook           │◄────────────────────┘
       │  (payment.success) │
       └──────┬─────────────┘
              │
              │ POST /payments/verify
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Payment Service (Verify)                                         │
│ - Verify signature                                              │
│ - Update payment status                                         │
│ - Publish payment.completed event                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Events
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Downstream Services                                              │
│                                                                  │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│ │   Wallet    │  │Gamification│  │   Order    │  │    Intent  ││
│ │  Credit     │  │   Award    │  │  Update    │  │   Graph    ││
│ │  Coins      │  │   Points   │  │  Status    │  │   Track    ││
│ └────────────┘  └────────────┘  └────────────┘  └────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## ReZ Mind Architecture

### Intent Capture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Events                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│   │ Search  │  │  View   │  │ Wishlist│  │  Cart   │        │
│   │         │  │         │  │         │  │  Add    │        │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│        │             │             │             │               │
│        └─────────────┴─────────────┴─────────────┘               │
│                             │                                   │
│                             ▼                                   │
│                   ┌───────────────────┐                        │
│                   │  Intent Capture   │                        │
│                   │       API         │                        │
│                   │  POST /intent/    │                        │
│                   │       capture      │                        │
│                   └─────────┬─────────┘                        │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Intent Graph                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │                     Signal Processing                      │ │
│   │                                                              │ │
│   │  Confidence = base + (weight × recency) + velocity       │ │
│   │                                                              │ │
│   │  Weights:                                                   │ │
│   │  • search: 0.15    • cart_add: 0.30                      │ │
│   │  • view: 0.10      • checkout_start: 0.40                │ │
│   │  • wishlist: 0.25  • fulfilled: 1.00                      │ │
│   │  • hold: 0.35      • abandoned: -0.20                      │ │
│   │                                                              │ │
│   └─────────────────────────────────────────────────────────┘ │
│                             │                                   │
│                             ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │                  Dormancy Detection                       │ │
│   │                                                              │ │
│   │  If no signal for 7 days → Mark as DORMANT               │ │
│   │                                                              │ │
│   │  Dormant Intent:                                           │ │
│   │  {                                                          │ │
│   │    userId: "usr_123",                                      │ │
│   │    intent: "laptop",                                       │ │
│   │    lastSeen: "2026-04-20",                                │ │
│   │    revivalScore: 0.75,                                    │ │
│   │    optimalTiming: "Weekend afternoon"                       │ │
│   │  }                                                          │ │
│   │                                                              │ │
│   └─────────────────────────────────────────────────────────┘ │
│                             │                                   │
│                             ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │             Cross-App Profile Aggregation                 │ │
│   │                                                              │ │
│   │  User Profile:                                             │ │
│   │  {                                                          │ │
│   │    travelAffinity: 0.8,                                    │ │
│   │    diningAffinity: 0.6,                                   │ │
│   │    retailAffinity: 0.4,                                    │ │
│   │    totalConversions: 15,                                   │ │
│   │    dormantIntents: 3                                       │ │
│   │  }                                                          │ │
│   │                                                              │ │
│   └─────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 8 Autonomous AI Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent Swarm                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  Interval: 5 min                        │
│  │ DemandSignalAgent │  ────────────────────────                │
│  │                    │  Aggregates demand per                   │
│  │ Priority: HIGH    │  merchant/category                       │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 1 min                       │
│  │   ScarcityAgent    │  ────────────────────────                │
│  │                    │  Detects supply/demand                  │
│  │ Priority: HIGH     │  imbalances, urgency alerts              │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 1 min                       │
│  │PersonalizationAgent│  ────────────────────────                │
│  │                    │  User response profiling,                 │
│  │ Priority: HIGH     │  A/B testing                            │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 30 min                       │
│  │ AttributionAgent   │  ────────────────────────                │
│  │                    │  Multi-touch conversion                   │
│  │ Priority: MEDIUM   │  attribution                             │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 1 hour                      │
│  │AdaptiveScoringAgent│  ────────────────────────                │
│  │                    │  ML model retraining,                    │
│  │ Priority: HIGH     │  threshold adjustment                    │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 1 hour                      │
│  │ FeedbackLoopAgent  │  ────────────────────────                │
│  │                    │  Closed-loop optimization,               │
│  │ Priority: HIGH     │  drift detection                        │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 24 hours                     │
│  │NetworkEffectAgent │  ─────────────────────────                │
│  │                    │  Collaborative filtering,              │
│  │ Priority: MEDIUM   │  user similarity                         │
│  └─────────┬──────────┘                                         │
│            │                                                    │
│  ┌─────────┴──────────┐  Interval: 15 min                       │
│  │RevenueAttribAgent  │  ─────────────────────────                │
│  │                    │  GMV tracking, ROI per                  │
│  │ Priority: CRITICAL │  agent/nudge campaign                    │
│  └──────────────────┘                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Connections

### MongoDB (Primary)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Replica Set                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Primary    │  │  Secondary   │  │   Secondary  │        │
│  │   :27017     │  │   :27017     │  │   :27017     │        │
│  │  (Write)     │  │  (Read)      │  │  (Backup)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                   │
│  Databases:                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ rez_auth_dev    │ Users, Sessions, Devices, OAuth        │  │
│  │ rez_wallet_dev  │ Wallets, Transactions                  │  │
│  │ rez_order_dev   │ Orders, OrderItems                     │  │
│  │ rez_payment_dev │ Payments, Refunds                     │  │
│  │ rez_catalog_dev │ Products, Categories                   │  │
│  │ rez_merchant_dev│ Merchants, Staff, Stores               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Redis

```
┌─────────────────────────────────────────────────────────────────┐
│                    Redis Architecture                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        Cache Layer                         │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │Sessions │  │Products │  │  User    │  │ Merchant│   │  │
│  │  │         │  │ Cache   │  │ Profiles │  │  Cache  │   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Queue Layer                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │BullMQ   │  │BullMQ   │  │BullMQ   │  │BullMQ   │   │  │
│  │  │wallet   │  │order    │  │payment  │  │notif    │   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Pub/Sub Layer                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ intent.events    │   cache.invalidate    │           │ │  │
│  │  │ analytics.events │   search.updates      │           │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

| Component | Count | Description |
|-----------|-------|-------------|
| Mobile Apps | 3 | Consumer, Merchant, Admin |
| Web Apps | 1+ | REZ Now, AdBazaar, NextaBiZ |
| Core Services | 7 | Auth, Wallet, Order, Payment, Merchant, Catalog, Search |
| Growth Services | 4 | Gamification, Ads, Marketing, Karma |
| Business Services | 5 | Finance, CorpPerks, Hotel, Procurement, Scheduler |
| Event Workers | 3 | Analytics, Notification, Media |
| AI Components | 3 | Intent Graph, Insights, Automation |
| AI Agents | 8 | Autonomous decision makers |
| Databases | 3 | MongoDB, Redis, PostgreSQL |

---

**End of Connectivity Documentation**
