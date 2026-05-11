# REZ Platform — Architecture

## System Overview

REZ is a microservices architecture on top of MongoDB + Redis. Services are deployed independently on Render and communicate via HTTP with internal auth tokens.

```
┌─────────────────────────────────────────────┐
│                   Clients                    │
│  Consumer App │ Merchant App │ Admin App     │
└──────────────┬──────────────┬───────────────┘
               │              │
               ▼              ▼
        ┌──────────────────────────────────┐
        │       rez-api-gateway            │
        │  (routes: /api/auth, /api/wallet, │
        │   /api/orders, /api/payments...) │
        └────┬───────┬──────┬───────┬──────┘
             │       │      │       │
      ┌──────┘  ┌────┘  ┌────┐ ┌────┐
      ▼         ▼        ▼      ▼
┌─────────┐ ┌────────┐ ┌──────┐ ┌──────┐
│  Auth   │ │ Wallet │ │Order │ │Payment│
│ Service │ │Service │ │      │ │Service│
└────┬────┘ └───┬────┘ └──┬───┘ └───┬───┘
     │          │         │         │
     └──────────┴────┬────┴─────────┘
                     │
              ┌──────┴──────┐
              │             │
              ▼             ▼
        ┌──────────┐ ┌──────────┐
        │ MongoDB  │ │  Redis   │
        └──────────┘ └──────────┘
```

## Monolith → Microservice Mapping

| Monolith Feature | Extracted To | Repo |
|-----------------|-------------|------|
| `notificationService.ts`, `emailService.ts` | Notification Service | `rez-notification-events` |
| `uploadService.ts`, `imageService.ts` | Media Service | `rez-media-events` |
| `analyticsService.ts` | Analytics Service | `analytics-events` |
| `gamificationService.ts` | Gamification Service | `rez-gamification-service` |
| `routes/merchant/*`, `services/merchant*` | Merchant Service | `rez-merchant-service` |
| product/category/search routes | Catalog Service | `rez-catalog-service` |
| `orderRoutes.ts`, `services/order*` | Order Service | `rez-order-service` |
| `walletService.ts`, `coinService.ts` | Wallet Service | `rez-wallet-service` |
| Payment routes + Razorpay | Payment Service | `rez-payment-service` |
| Auth middleware + OTP flows | Auth Service | `rez-auth-service` |
| Elasticsearch/Typesense search | Search Service | `rez-search-service` |
| Marketing broadcasts | Marketing Service | `rez-marketing-service` |

## Data Flow: QR Scan → Coin Earning

```
1. Consumer scans QR code (menu.rez.money/qr/:storeId)
         ↓
2. Gateway /api/qr-checkin/scan → rez-backend
         ↓
3. Backend credits wallet via rez-wallet-service
         ↓
4. Wallet: create transaction, update balance
         ↓
5. Backend credits coins via rez-gamification-service
         ↓
6. Gamification: update points, check daily cap
         ↓
7. Response back to consumer app
```

## Data Flow: Order → Payment

```
1. Consumer creates order → /api/orders/create
         ↓
2. Order service: create order record (status: 'placed')
         ↓
3. Payment initiate → /api/payments/initiate
         ↓
4. Payment service: create Razorpay order, return order_id
         ↓
5. Consumer completes payment on Razorpay
         ↓
6. Payment verify → /api/payments/verify
         ↓
7. Payment service: verify signature, update payment status
         ↓
8. Wallet: credit coins earned (QR scan + cashback)
         ↓
9. Gamification: award points
         ↓
10. Order service: update order status → 'confirmed'
```

## Service Communication

- **Frontend → Backend**: REST via `EXPO_PUBLIC_API_BASE_URL` → gateway
- **Backend → Microservices**: HTTP via `*_SERVICE_URL` env vars
- **Auth**: `X-Internal-Token` header on all service-to-service calls
- **Tracing**: `X-Correlation-ID` propagated across all hops
- **Queue**: BullMQ workers (Redis) for async: notifications, media, gamification, wallet-credit (Gen 22 fix)

## Database

- **MongoDB** (shared cluster): All services share the same MongoDB cluster but use different collections
- Collection naming: `orders`, `payments`, `wallets`, `stores`, `products`, `users`, etc.
- Each service only accesses its own collections

## Shared Packages

| Package | Repo | Purpose |
|---------|------|---------|
| `rez-shared` | `imrejaul007/rez-shared` | Shared utilities, types, enums |
| `@karim4987498/shared` | npm private | Legacy shared (order-service) |

## Auth Flows

### Consumer (OTP)
```
Phone → OTP request → Backend sends via SendGrid/Twilio
     → OTP verify → JWT access (15m) + refresh (7d)
```

### Merchant (password + JWT)
```
Email/password → login → JWT (7d)
```

### Internal (service-to-service)
```
X-Internal-Token header → verified against INTERNAL_SERVICE_TOKEN
```

## Error Handling

- All services use Winston logger → Sentry
- All services have `/health` and `/health/ready` endpoints
- Render auto-rollback on health check failure
- Prometheus metrics at `/metrics` (internal auth required)

## Scale Recommendations

See [SCALE-RECOMMENDATIONS.md](./SCALE-RECOMMENDATIONS.md) for full assessment:

| Pattern | Status | Notes |
|---------|--------|-------|
| Unified Observability | ⚠️ Partial | Prometheus/Grafana exist, Sentry in 8/14 services |
| Event Sourcing | ❌ Not Impl | BullMQ is event-driven but not true event sourcing |
| GraphQL Federation | ❌ Not Impl | REST-only, no Apollo Federation |
| CQRS | ❌ Not Impl | Single read/write model for all services |

### Quick Wins
- Add Sentry to remaining services (2-3h each)
- Configure Prometheus targets for all services
- Build Grafana dashboards for service health
