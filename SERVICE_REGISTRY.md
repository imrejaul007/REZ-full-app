# REZ Ecosystem - Service Registry
**Version:** 1.0
**Date:** May 7, 2026
**Status:** ACTIVE - All ports resolved

---

## SERVICE PORT MAP

### Port Assignments (Canonical - Source of Truth)

| Port | Service | Directory | Build Status | Docker |
|------|---------|----------|-------------|--------|
| **3000** | API Gateway | rez-api-gateway | ✓ | ✓ |
| **3001** | Billing Service | rez-billing-service | ✓ | - |
| **3002** | Socket Service | rez-socket-service | ✓ | - |
| **3003** | Targeting Engine | rez-targeting-engine | ✓ | ✓ |
| **3004** | Gamification Service | rez-gamification-service | ✓ | - |
| **3005** | Catalog Service | rez-catalog-service | ✓ | pending |
| **3006** | Order Service | rez-order-service | ✓ | pending |
| **4000** | Marketing / Rendez | rez-marketing | ✓ | ✓ |
| **4001** | Payment Service | rez-payment-service | ✓ | pending |
| **4002** | Auth Service | rez-auth-service | ✓ | ✓ |
| **4003** | Search Service | rez-search-service | ✓ | pending |
| **4004** | Wallet Service | rez-wallet-service | ✓ | pending |
| **4005** | Merchant Service | rez-merchant-service | ✓ | ✓ |
| **4006** | Finance Service | rez-finance-service | ✓ | - |
| **4007** | Ads Service | rez-ads-service | ✓ | - |
| **4008** | Ad Campaigns | rez-ad-campaigns | ✓ | - |
| **4009** | Intent Service | rez-intent-service | ✓ | - |
| **4010** | Feedback Service | rez-feedback-service | ✓ | ✓ |
| **4011** | Notification Events | rez-notification-events | ✓ | - |
| **4012** | - | (reserved) | - | - |
| **4013** | Push Service | rez-push-service | ✓ | - |
| **4014** | - | (reserved) | - | - |
| **4015** | Hotel Service | rez-hotel-service | ✓ | - |
| **4016** | Profile Service | rez-profile-service | ✓ | - |
| **4017** | Recommendation Engine | rez-recommendation-engine | ✓ | - |
| **4018** | DOOH Service | rez-dooh-service | ✓ | - |
| **4019** | - | (reserved) | - | - |
| **4020** | Intelligence Hub | rez-intelligence-hub | ✓ | ✓ |
| **4021** | AD AI | rez-ad-ai | ✓ | - |
| **4022** | - | (reserved) | - | - |
| **4025** | Knowledge Base Service | rez-knowledge-base-service | ✓ | - |
| **4026** | Copilot | rez-copilot | ✓ | - |
| **4027** | Decision Service | rez-decision-service | ✓ | - |
| **4028** | - | (reserved) | - | - |
| **4030** | Corporate Service | rez-corporate-service | ✓ | - |
| **4031** | Observability | rez-observability | ✓ | - |
| **4032** | Ops Dashboard | rez-ops-dashboard | ✓ | - |
| **4040** | Merchant Integrations | rez-merchant-integrations | ✓ | - |
| **4110** | BBPS Service | rez-bbps-service | ✓ | - |
| **4111** | Recharge Service | rez-recharge-service | ✓ | - |

### Port Conflicts (RESOLVED)

| Port | Service A | Service B | Resolution |
|------|-----------|-----------|------------|
| 3006 | Order Service | Media Events | Media Events → 3015 |
| 4007 | Ads Service | Ad Campaigns | Ad Campaigns → 4008 |
| 3004 | Gamification | User Intelligence | User Intelligence → 3016 |
| 4004 | Wallet | DOOH | DOOH → 4018 |

---

## DEPENDENCY STANDARDIZATION

### Required Package Versions (All Services)

| Package | Required Version | Breaking Change |
|---------|-----------------|----------------|
| zod | `^3.23.x` | v4 is NOT compatible |
| @sentry/node | `^7.120.x` | v8 is NOT compatible |
| helmet | `^7.1.x` | v8 is NOT compatible |
| mongoose | `^8.x` | - |
| express | `^4.18.x` | - |

---

## ENVIRONMENT VARIABLES

### Required for All Services

```bash
NODE_ENV=development
PORT=<service_port>
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
JWT_SECRET=<64_char_secret>
```

### Service-Specific

| Service | Additional Variables |
|---------|-------------------|
| auth | JWT_REFRESH_SECRET, JWT_ADMIN_SECRET, OTP_HMAC_SECRET |
| payment | STRIPE_SECRET, RAZORPAY_KEY |
| wallet | ENCRYPTION_KEY |
| order | MERCHANT_SERVICE_URL, CATALOG_SERVICE_URL |

---

## SERVICE DEPENDENCIES

```
                    ┌─────────────┐
                    │  MongoDB   │
                    │  Redis     │
                    └──────┬──────┘
                           │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
        │   Auth    │ │ Payment  │ │  Wallet  │
        │   4002    │ │   4001   │ │   4004   │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
                    ┌───────▼───────┐
                    │   Merchant    │
                    │     4005      │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼─────┐ ┌────▼─────┐ ┌────▼─────┐
        │   Order    │ │ Catalog  │ │  Search  │
        │   3006     │ │   3005   │ │   4003   │
        └─────────────┘ └──────────┘ └──────────┘
```

---

## BUILD COMMANDS

```bash
# All services
npm run build --workspaces

# Individual services
cd rez-auth-service && npm run build
cd rez-payment-service && npm run build
cd rez-merchant-service && npm run build

# Build verification
./scripts/audit-all.sh
```

---

## HEALTH ENDPOINTS

All services must implement `/health` endpoint:

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: process.env.SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

---

## DOCKER INTEGRATION

Services in `docker-compose.yml`:
- auth-api (rez-auth-service)
- merchant-api (rez-merchant-service)
- rez-intelligence-hub
- rez-intent-graph
- rez-targeting-engine
- rez-action-engine
- rez-scheduler-service
- rez-automation-service
- rez-corporate-service
- rez-feedback-service
- rez-stayown-service
- rendez-backend
- hotel-ota-api

**Pending Addition:**
- rez-payment-service
- rez-wallet-service
- rez-order-service
- rez-catalog-service
- rez-api-gateway
- rez-search-service
