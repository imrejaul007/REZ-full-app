# ReZ Ecosystem - Services Documentation

**Last Updated:** 2026-05-01
**Purpose:** Complete reference for all 17 microservices

---

## Table of Contents

1. [Core Services](#core-services)
2. [Growth Services](#growth-services)
3. [Business Services](#business-services)
4. [Infrastructure Services](#infrastructure-services)
5. [Event Workers](#event-workers)
6. [Service Communication](#service-communication)
7. [Environment Variables](#environment-variables)

---

## Core Services

### 1. rez-auth-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4002 (HTTP), 4102 (Metrics) |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-auth-service |
| **Deploy** | https://rez-auth-service.onrender.com |

**Purpose:** Authentication, OTP, JWT issuance, device fingerprinting, MFA, OAuth2

**API Endpoints:**
| Route | Methods | Description |
|-------|---------|-------------|
| `/auth/*` | POST, GET | Authentication (login, register, refresh) |
| `/api/profile/*` | GET, PUT | User profile management |
| `/internal/*` | * | Internal service routes |
| `/oauth/*` | GET, POST | OAuth partner integration |
| `/health` | GET | Health check |
| `/metrics` | GET | Prometheus metrics |

**Database Collections:**
- `users` - User accounts
- `sessions` - Active sessions
- `devices` - Device registrations
- `oauth_providers` - OAuth configurations
- `refresh_tokens` - JWT refresh tokens

**Key Environment Variables:**
```bash
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=<required>
JWT_REFRESH_SECRET=<required>
JWT_ADMIN_SECRET=<required>
JWT_MERCHANT_SECRET=<required>
OTP_HMAC_SECRET=<required>
SENTRY_DSN=<optional>
```

---

### 2. rez-wallet-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4004 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-wallet-service |
| **Deploy** | https://rez-wallet-service-36vo.onrender.com |

**Purpose:** Digital wallet, balance management, transfers, BNPL, CorpPerks

**API Endpoints:**
| Route | Methods | Description |
|-------|---------|-------------|
| `/wallet/*` | GET, POST | Consumer wallet operations |
| `/merchant-wallet/*` | GET, POST | Merchant wallet operations |
| `/api/corp/*` | GET, POST | CorpPerks routes |
| `/api/credit/*` | GET, POST | Consumer credit (BNPL) |
| `/internal/*` | * | Internal operations |
| `/admin/dlq/*` | GET, POST | DLQ administration |

**Database Collections:**
- `wallets` - Consumer wallets
- `transactions` - All transactions
- `merchant_wallets` - Merchant wallets
- `credit_accounts` - BNPL accounts

**Key Features:**
- CQRS pattern with read model (`WalletReadService`)
- Distributed locking for balance operations
- XFF spoofing protection

---

### 3. rez-order-service

| Attribute | Value |
|-----------|-------|
| **Port** | 3006 (HTTP), 3008 (Worker) |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-order-service |
| **Deploy** | https://rez-order-service.onrender.com |

**Purpose:** Order processing, lifecycle management, fulfillment

**Architecture:**
- **HTTP Server** - Handles REST endpoints
- **BullMQ Worker** - Processes order jobs asynchronously

**Database Collections:**
- `orders` - Order records
- `order_items` - Line items
- `shipping_records` - Shipping information

---

### 4. rez-payment-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4001 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-payment-service |
| **Deploy** | https://rez-payment-service.onrender.com |

**Purpose:** Payment gateway, refunds, reconciliation, webhooks

**API Endpoints:**
| Route | Methods | Description |
|-------|---------|-------------|
| `/pay/*` | POST, GET | Payment operations |
| `/api/payment/*` | * | Compatibility routes |
| `/admin/dlq/*` | GET, POST | DLQ administration |

**Key Features:**
- Razorpay integration with webhook verification
- Lost coins recovery worker
- Monolith sync worker
- Reconciliation jobs (scheduled)
- BNPL support via NBFC partner

**Key Environment Variables:**
```bash
RAZORPAY_KEY_ID=<required>
RAZORPAY_KEY_SECRET=<required>
RAZORPAY_WEBHOOK_SECRET=<required>
WALLET_SERVICE_URL=<required>
```

---

### 5. rez-merchant-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4005 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | No |
| **Git** | imrejaul007/rez-merchant-service |
| **Deploy** | https://rez-merchant-service-n3q2.onrender.com |

**Purpose:** Merchant management, orders, engagement, campaigns, analytics

**API Endpoints (14 routers):**
| Router | Description |
|--------|-------------|
| `/api/merchant/auth` | Merchant authentication |
| `/api/merchant/core` | Core operations |
| `/api/merchant/orders` | Order management |
| `/api/merchant/engagement` | Customer engagement |
| `/api/merchant/campaigns` | Campaign management |
| `/api/merchant/analytics` | Analytics |
| `/api/merchant/finance` | Financial operations |
| `/api/merchant/staff` | Staff management |
| `/api/merchant/operations` | Operations |
| `/api/merchant/support` | Support tickets |
| `/api/merchant/karma/*` | Karma integration |
| `/api/merchant/pricing` | Dynamic pricing |
| `/api/merchant/export` | Tally export |
| `/internal/*` | Internal routes |

**Security Features:**
- Rate limiting (Redis-backed)
- CSRF protection
- XFF spoofing protection
- HSTS headers via helmet
- Bank details encryption with `ENCRYPTION_KEY`

---

### 6. rez-catalog-service

| Attribute | Value |
|-----------|-------|
| **Port** | 3005 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-catalog-service |
| **Deploy** | https://rez-catalog-service-1.onrender.com |

**Purpose:** Product catalog, menu management

**Architecture:**
- BullMQ worker for catalog operations
- HTTP server for health + read endpoints

---

### 7. rez-search-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4003 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | No |
| **Git** | imrejaul007/rez-search-service |

**Purpose:** Store/product search, recommendations, homepage, history

**API Endpoints:**
| Route | Description |
|-------|-------------|
| `/search/*` | Product and store search |
| `/homepage/*` | Homepage content |
| `/recommendations/*` | Recommendation engine |
| `/history/*` | Search history |

**Key Features:**
- Event-driven cache invalidation via Redis pub/sub
- SCAN-based key eviction for large keyspaces
- MongoDB text indexes for search

**⚠️ Architecture Debt:** Should migrate to Typesense/Meilisearch for production scale

---

## Growth Services

### 8. rez-gamification-service

| Attribute | Value |
|-----------|-------|
| **Port** | 3001 (HTTP), 3004 (Worker) |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-gamification-service |
| **Deploy** | https://rez-gamification-service-3b5d.onrender.com |

**Purpose:** Gamification, achievements, streaks, store visits

**Workers:**
- Gamification worker
- Store visit streak worker
- Achievement worker
- Game config subscription

---

### 9. rez-ads-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4007 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | No |
| **Git** | imrejaul007/rez-ads-service |

**Purpose:** Merchant self-serve ads, admin review, ad serving

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/merchant/ads/*` | Merchant ad management |
| `/admin/ads/*` | Admin operations |
| `/ads/*` | Consumer ad serving |

**Key Features:**
- Click deduplication via Redis
- Prometheus metrics

---

### 10. rez-marketing-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4000 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-marketing-service |

**Purpose:** Audience targeting, campaigns, WhatsApp, keyword ads

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/campaigns/*` | Campaign management |
| `/broadcasts/*` | Broadcast messages |
| `/audience/*` | Audience segmentation |
| `/analytics/*` | Campaign analytics |
| `/keywords/*` | Keyword management |
| `/webhooks/*` | WhatsApp/webhook endpoints |
| `/adbazaar/*` | Ad bazaar integration |
| `/vouchers/*` | Voucher management |

**Workers:**
- Campaign worker
- Interest sync worker
- Interest retry worker
- Birthday scheduler

---

### 11. rez-karma-service

| Attribute | Value |
|-----------|-------|
| **Port** | 3009 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-karma-service |

**Purpose:** Impact economy, karma points, civic corps

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/api/karma/*` | Core karma operations |
| `/api/karma/score/*` | Score management |
| `/api/karma/verify/*` | Verification |
| `/api/karma/batch/*` | Batch operations |
| `/api/karma/civic-corps/*` | Civic corps |
| `/api-docs/*` | Swagger documentation |

**Workers:**
- Coin event subscriber (Redis pub/sub)
- Score rank worker
- Decay worker
- Batch scheduler

---

## Business Services

### 12. rez-finance-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4006 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-finance-service |

**Purpose:** Embedded credit, loans, BNPL, credit score, bill pay

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/finance/borrow/*` | Borrowing operations |
| `/finance/credit/*` | Credit management |
| `/finance/pay/*` | Payment operations |
| `/finance/partner/webhook/*` | Partner webhooks (FinBox) |
| `/gst/*` | CorpPerks GST routes |
| `/internal/finance/*` | Internal routes |

**Key Integrations:**
- FinBox API (partner offers)
- Wallet service integration
- BNPL sync jobs

---

### 13. rez-corpperks-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4013 |
| **TypeScript** | No (JavaScript) |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | No |
| **Git** | Built-in |

**Purpose:** Enterprise benefits platform, employee perks, GST invoices

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/api/corp/*` | Benefits, employees |
| `/api/gst/*` | GST invoices |
| `/api/rewards/*` | ReZ Coins |
| `/api/campaigns/*` | Campaigns |
| `/api/hris/*` | HRIS integration |
| `/api/finance/*` | RTMN Finance (Wallet, Cards, BNPL) |

---

### 14. rez-hotel-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4015 |
| **TypeScript** | No (JavaScript) |
| **Database** | MongoDB |
| **Redis** | No |
| **BullMQ** | No |
| **Git** | Built-in |

**Purpose:** Hotel OTA, Makcorps integration

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/api/hotels/*` | Makcorps hotel routes |

---

### 15. rez-procurement-service

| Attribute | Value |
|-----------|-------|
| **Port** | 4012 |
| **TypeScript** | No (JavaScript) |
| **Database** | MongoDB |
| **Redis** | No |
| **BullMQ** | No |
| **Git** | Built-in |

**Purpose:** Procurement, NextaBizz integration

**API Endpoints:**
| Router | Description |
|--------|-------------|
| `/api/nextabizz/*` | NextaBizz routes |

---

## Infrastructure Services

### 16. rez-scheduler-service

| Attribute | Value |
|-----------|-------|
| **Port** | 3012 |
| **TypeScript** | Yes |
| **Database** | MongoDB |
| **Redis** | Yes |
| **BullMQ** | Yes |
| **Git** | imrejaul007/rez-scheduler-service |

**Purpose:** Centralized job scheduling, cron management

**Features:**
- Cron jobs loaded from DB configuration
- All BullMQ workers registered centrally
- DLQ management for all queues

---

## Event Workers

### 17. analytics-events

| Attribute | Value |
|-----------|-------|
| **Port** | 3006 |
| **Git** | imrejaul007/analytics-events |

**Purpose:** Event tracking, analytics

---

### 18. rez-notification-events

| Attribute | Value |
|-----------|-------|
| **Port** | 3005 |
| **Git** | imrejaul007/rez-notification-events |

**Purpose:** Push notifications, email notifications

---

### 19. rez-media-events

| Attribute | Value |
|-----------|-------|
| **Port** | 3008 |
| **Git** | imrejaul007/rez-media-events |

**Purpose:** Media processing, image optimization

---

## Service Communication

### Service-to-Service Authentication

**New Pattern (Scoped - Recommended):**
```bash
# Environment variable format
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}

# Headers
x-internal-token: <token>
x-internal-service: <caller-service-name>
```

**Legacy Pattern (Backward Compatible):**
```bash
# Single shared token
INTERNAL_SERVICE_TOKEN=<shared-token>

# Header
x-internal-token: <token>
```

### Internal Service URLs

| Service | URL Environment Variable |
|---------|-------------------------|
| Auth Service | `REZ_AUTH_SERVICE_URL` |
| Wallet Service | `REZ_WALLET_SERVICE_URL` |
| Payment Service | `REZ_PAYMENT_SERVICE_URL` |
| Order Service | `REZ_ORDER_SERVICE_URL` |
| Merchant Service | `REZ_MERCHANT_SERVICE_URL` |
| Catalog Service | `REZ_CATALOG_SERVICE_URL` |
| Search Service | `REZ_SEARCH_SERVICE_URL` |
| Gamification Service | `REZ_GAMIFICATION_SERVICE_URL` |
| Marketing Service | `MARKETING_SERVICE_URL` |
| Finance Service | `FINANCE_SERVICE_URL` |

---

## Environment Variables

### Required for All Services

```bash
# MongoDB
MONGODB_URI=mongodb://user:password@host:27017/database
MONGODB_READ_PREFERENCE=primary|secondaryPreferred

# Redis
REDIS_URL=redis://:password@host:6379

# JWT
JWT_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>

# Internal Auth
INTERNAL_SERVICE_TOKEN=<shared-token>
INTERNAL_SERVICE_TOKENS_JSON={"service":"token"}

# Sentry (optional)
SENTRY_DSN=https://key@sentry.io/project
```

### Service-Specific

| Service | Additional Required Variables |
|---------|------------------------------|
| rez-auth-service | `OTP_HMAC_SECRET`, `JWT_ADMIN_SECRET`, `JWT_MERCHANT_SECRET` |
| rez-payment-service | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| rez-merchant-service | `ENCRYPTION_KEY` |
| rez-order-service | `WALLET_SERVICE_URL`, `PAYMENT_SERVICE_URL` |

---

## Health Check Endpoints

| Check Type | Path | Purpose |
|------------|------|---------|
| Liveness | `/health/live` or `/healthz` | Is the service running? |
| Readiness | `/health/ready` | Is the service ready to accept traffic? |
| Detailed | `/health/detailed` | Full health with dependencies |
| Metrics | `/metrics` | Prometheus metrics |

---

## Deployment Reference

| Service | Render Service | URL |
|---------|---------------|-----|
| rez-auth-service | rez-auth-service | https://rez-auth-service.onrender.com |
| rez-wallet-service | rez-wallet-service | https://rez-wallet-service-36vo.onrender.com |
| rez-order-service | rez-order-service | https://rez-order-service.onrender.com |
| rez-payment-service | rez-payment-service | https://rez-payment-service.onrender.com |
| rez-merchant-service | rez-merchant-service | https://rez-merchant-service-n3q2.onrender.com |
| rez-catalog-service | rez-catalog-service | https://rez-catalog-service-1.onrender.com |
| rez-search-service | rez-search-service | https://rez-search-service.onrender.com |
| rez-gamification-service | rez-gamification-service | https://rez-gamification-service-3b5d.onrender.com |
| rez-ads-service | rez-ads-service | https://rez-ads-service.onrender.com |
| rez-marketing-service | rez-marketing-service | https://rez-marketing-service.onrender.com |

---

**Next:** [APPS.md](APPS.md) - Application documentation
