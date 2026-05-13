# ReZ Commerce Platform - System of Truth (SOT)

**Document Version:** 1.0.0
**Date:** May 12, 2026
**Last Updated:** Claude Code Audit

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Architecture Layers](#architecture-layers)
3. [Service Registry](#service-registry)
4. [Data Architecture](#data-architecture)
5. [Security Architecture](#security-architecture)
6. [Integration Patterns](#integration-patterns)
7. [Infrastructure](#infrastructure)
8. [AI/ML Pipeline](#aiml-pipeline)

---

## Platform Overview

### Mission

The ReZ platform enables AI-powered commerce across multiple verticals:
- Restaurants & Food Delivery
- Hotels & Hospitality
- Retail & E-commerce
- Services (Salon, Fitness)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  Consumer App │  Merchant    │   adBazaar   │    Hotel OTA     │
│  (Expo/RN)   │  Dashboard   │  (Next.js)   │    (Next.js)     │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬─────────┘
       │              │              │               │
       ▼              ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│                   (Kong / Express)                               │
└─────────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Auth Service │    │ Payment Svc    │    │  Order Svc    │
│  (JWT, MFA)   │    │ (Razorpay)     │    │  (Lifecycle)   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐       │
│  │ MongoDB │  │  Redis  │  │ Postgres│  │   S3/GCS    │       │
│  │(Primary)│  │(Cache)  │  │(Search) │  │  (Media)    │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI LAYER (ReZ Mind)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Intent Graph│  │Autonomous   │  │Recommendation│            │
│  │             │  │  Agents     │  │   Engine    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 1: Client Applications

| App | Directory | Framework | Purpose |
|-----|-----------|-----------|---------|
| `rez-app-consumer` | `REZ-Consumer/` | Expo SDK 53 | Consumer mobile app |
| `REZ-dashboard` | `REZ-Merchant/` | Next.js 14 | Merchant analytics |
| `adBazaar` | `REZ-Media/` | Next.js 14 | Ad marketplace |
| `Hotel OTA` | `StayOwn-Hospitality/` | Next.js 14 | Hotel booking |
| `rez-now` | `REZ-Consumer/` | Next.js 14 | Room QR services |
| `rez-web-menu` | `REZ-Consumer/` | React | Restaurant menus |

### Layer 2: API Gateway

All external traffic routes through the API Gateway which handles:
- Authentication (JWT validation)
- Rate limiting
- Request logging
- Load balancing

**Location:** `RABTUL-Technologies/api-gateway/`

### Layer 3: Core Services

#### Authentication & Security

| Service | Port | Description |
|---------|------|-------------|
| `rez-auth-service` | 4001 | JWT tokens, MFA, password reset |
| `rez-identity-graph` | 4010 | Cross-app identity resolution |

#### Commerce

| Service | Port | Description |
|---------|------|-------------|
| `rez-payment-service` | 3001 | Razorpay integration, webhooks |
| `rez-wallet-service` | 4002 | Multi-coin wallet, payouts |
| `rez-order-service` | 4003 | Order lifecycle, status tracking |
| `rez-catalog-service` | 4004 | Products, categories, inventory |
| `rez-search-service` | 4005 | Full-text search (Typesense) |
| `rez-delivery-service` | 4006 | Swiggy/Zomato/ONDC sync |

#### Operations

| Service | Port | Description |
|---------|------|-------------|
| `rez-menu-service` | 4008 | Restaurant menu management |
| `rez-notifications-hub` | 4007 | Push, Email, SMS |
| `rez-kds-service` | 4011 | Kitchen Display System |
| `rez-pos-service` | 4012 | Point of Sale |

#### Loyalty & Engagement

| Service | Port | Description |
|---------|------|-------------|
| `rez-karma-service` | 4013 | Gamification, points |
| `rez-loyalty-service` | 4014 | Rewards program |

### Layer 4: AI/ML Services (ReZ Mind)

**Directory:** `REZ-Intelligence/`

| Service | Description |
|---------|-------------|
| `rez-intent-graph` | User intent tracking & scoring |
| `REZ-autonomous-agents` | 8 autonomous commerce agents |
| `REZ-recommendation-engine` | Personalized recommendations |
| `REZ-personalization-engine` | User preference learning |
| `REZ-demand-forecast` | 7-day demand prediction |
| `REZ-price-predictor` | Dynamic pricing (TODO) |
| `REZ-churn-prediction` | Customer churn analysis |
| `REZ-targeting-engine` | Ad targeting & segmentation |
| `REZ-support-copilot` | AI customer support |
| `REZ-flywheel-mvp` | QR-based reorder system |

---

## Service Registry

### Internal Service Communication

Services communicate via:
1. **HTTP/REST** - Synchronous requests
2. **BullMQ + Redis** - Async job processing
3. **WebSocket** - Real-time updates
4. **Event Bus** - Pub/sub messaging

### Service URLs (Development)

| Service | Internal URL |
|---------|--------------|
| Auth Service | `http://rez-auth-service:4001` |
| Payment Service | `http://rez-payment-service:3001` |
| Wallet Service | `http://rez-wallet-service:4002` |
| Order Service | `http://rez-order-service:4003` |
| Intent Graph | `http://rez-intent-graph:4009` |

### Service-to-Service Authentication

All internal service calls require:
```
X-Internal-Token: <service-specific-token>
```

Tokens are stored in `INTERNAL_SERVICE_TOKENS_JSON` as a JSON map:
```json
{
  "payment-service": "token-for-payment",
  "order-service": "token-for-orders"
}
```

---

## Data Architecture

### Primary Database: MongoDB

**Usage:** Transactional data, flexible schemas

**Collections:**

| Collection | Service | Purpose |
|------------|---------|---------|
| `payments` | Payment Service | Payment records |
| `orders` | Order Service | Order lifecycle |
| `wallets` | Wallet Service | User balances |
| `users` | Auth Service | User accounts |
| `merchants` | Catalog Service | Merchant profiles |
| `products` | Catalog Service | Product catalog |
| `intents` | Intent Graph | User intent signals |

### Cache: Redis

**Usage:** Sessions, caching, rate limiting, job queues

**Keys Pattern:**
- `session:*` - User sessions
- `ratelimit:*` - Rate limit counters
- `pay:nonce:*` - Payment idempotency
- `webhook:event:*` - Webhook deduplication
- `job:*` - BullMQ job data

### Search: PostgreSQL + Typesense

**Usage:** Full-text search, analytics

### Object Storage: S3/GCS

**Usage:** Images, documents, exports

### Data Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Write  │────▶│ MongoDB │────▶│  Redis  │
└─────────┘     └─────────┘     │  Cache  │
                               └─────────┘
                                     │
                                     ▼
                               ┌─────────┐
                               │  Read   │
                               │  Cache  │
                               └─────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│  Auth   │────▶│  JWT    │────▶│ Resource│
│  Login  │     │ Service │     │  Token  │     │  API    │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                              (HS256 signed)
```

### Webhook Security

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│Razorpay │────▶│ Payment │────▶│  HMAC   │────▶│ Process │
│Webhook  │     │ Service │     │ Verify  │     │ Payment │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                        │
                        ▼
                  ┌─────────┐
                  │  Redis  │
                  │ Dedup   │
                  └─────────┘
```

### Security Controls

| Control | Implementation |
|---------|---------------|
| Input Validation | Zod schemas at all endpoints |
| SQL/NoSQL Injection | `express-mongo-sanitize` middleware |
| Rate Limiting | Redis-based per-IP, per-user limits |
| CORS | Explicit allowlist (wildcard blocked) |
| Secrets | Environment variables, fail-fast on weak secrets |
| Audit Logging | All financial operations logged |
| Fail-Closed | Redis unavailable = request rejected |

---

## Integration Patterns

### Payment Integration (Razorpay)

**Flow:**
1. Client requests payment → Server creates order
2. Client completes payment on Razorpay
3. Razorpay sends webhook → Server validates & processes
4. Server updates payment status → Notifies client

**Key Files:**
- `rez-payment-service/src/services/paymentService.ts`
- `rez-payment-service/src/services/webhookService.ts`
- `rez-payment-service/src/routes/paymentRoutes.ts`

### Delivery Aggregation

**Supported Platforms:**
- Swiggy
- Zomato
- ONDC

**Sync Strategy:**
- Webhooks for real-time updates
- Periodic polling for status sync
- Bidirectional status updates

### Event-Driven Architecture

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Event   │────▶│  Event  │────▶│  Event  │────▶│ Action  │
│ Source  │     │  Bus    │     │ Handlers│     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

**Event Types:**
- `user.intent.created`
- `order.created`
- `order.status_changed`
- `payment.success`
- `inventory.low`

---

## Infrastructure

### Deployment Platforms

| Environment | Platform | Services |
|-------------|----------|----------|
| Production | Kubernetes | All services |
| Staging | Render | Backend services |
| Preview | Vercel | Frontend apps |
| Local | Docker Compose | Full stack |

### Docker Services

**Core Stack:**
```yaml
# docker-compose.core.yml
services:
  mongodb:
  redis:
  nginx:
  # Service containers...
```

**Full Stack:**
```yaml
# docker-compose.master.yml
# Includes all services, ML jobs, monitoring
```

### Monitoring Stack

| Tool | Purpose |
|------|---------|
| Prometheus | Metrics collection |
| Grafana | Visualization |
| Sentry | Error tracking |
| ELK Stack | Log aggregation |

### CI/CD Pipeline

```
GitHub Actions
     │
     ▼
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Build  │────▶│  Test   │────▶│ Deploy  │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     ▼               ▼               ▼
 TypeScript      Unit Tests      Render/RKS
     │               │               │
     ▼               ▼               ▼
  Lint         Integration      Kubernetes
```

---

## AI/ML Pipeline

### Intent Tracking Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────▶│ Capture │────▶│  Score  │────▶│ Store   │
│  Action │     │ Service │     │ Intent  │     │ Intent  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                │
                                                ▼
                        ┌─────────┐     ┌─────────┐
                        │ Dormant │────▶│  Nudge  │
                        │ Revival │     │ Engine  │
                        └─────────┘     └─────────┘
```

### Autonomous Agents

| Agent | Trigger | Action |
|-------|---------|--------|
| DemandSignalAgent | */5 min | Update demand signals |
| ScarcityAgent | */1 min | Check inventory levels |
| PersonalizationAgent | Event | Update user preferences |
| AttributionAgent | Event | Track conversion sources |
| AdaptiveScoringAgent | Hourly | Refresh ML scores |
| FeedbackLoopAgent | Event | Detect model drift |
| NetworkEffectAgent | Daily | Update user clusters |
| RevenueAttributionAgent | */15 min | Calculate GMV attribution |

### ML Services Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ML PLATFORM                                  │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   Training  │  Inference  │  Feature    │    Model Registry   │
│   Pipeline  │   Server    │   Store     │                     │
├─────────────┴─────────────┴─────────────┴─────────────────────┤
│                     Model Types                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Demand   │  │ Fraud    │  │Recommend-│  │  Churn       │   │
│  │ Forecast │  │ Detection│  │  ation   │  │  Prediction  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Service Port Map

| Service | Port | Protocol |
|---------|------|----------|
| `rez-auth-service` | 4001 | HTTP |
| `rez-payment-service` | 3001 | HTTP |
| `rez-wallet-service` | 4002 | HTTP |
| `rez-order-service` | 4003 | HTTP |
| `rez-catalog-service` | 4004 | HTTP |
| `rez-search-service` | 4005 | HTTP |
| `rez-delivery-service` | 4006 | HTTP |
| `rez-notifications-hub` | 4007 | HTTP |
| `rez-menu-service` | 4008 | HTTP |
| `rez-intent-graph` | 4009 | HTTP/WS |
| `rez-identity-graph` | 4010 | HTTP |
| `rez-kds-service` | 4011 | HTTP |
| `rez-pos-service` | 4012 | HTTP |
| `rez-karma-service` | 4013 | HTTP |
| `rez-loyalty-service` | 4014 | HTTP |

---

## Appendix: Environment Variables

### Required for All Services

```bash
# Core
NODE_ENV=development|production
PORT=4000

# Database
MONGODB_URI=mongodb://localhost:27017/rez
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=<min-64-char-secret>
JWT_REFRESH_SECRET=<min-64-char-secret>
INTERNAL_SERVICE_TOKENS_JSON={"service":"token"}

# Service Discovery
SERVICE_NAME=rez-auth-service
```

### Service-Specific

```bash
# Payment Service
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
WALLET_SERVICE_URL=http://localhost:4002

# Auth Service
BCRYPT_ROUNDS=12
OTP_HMAC_SECRET=xxx
OTP_TOTP_ENCRYPTION_KEY=xxx
```

---

**Document End**

*This document is the System of Truth for the ReZ platform architecture.*
*All architectural decisions must be reflected here first.*
