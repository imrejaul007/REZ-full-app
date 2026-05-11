# REZ Platform - MASTER DEPLOYMENT GUIDE

**Version:** 1.1.0
**Date:** 2026-05-06
**Status:** PRODUCTION READY
**Test Pass Rate:** 88.4% (2,190/2,478 tests passing)
**Security Status:** APPROVED for production launch

> **NOTE:** This is the authoritative deployment guide. All other deployment documentation has been archived in `OLD/`.

---

## TABLE OF CONTENTS

1. [Deploy Order Overview](#1-deploy-order-overview)
2. [Phase 1: REZ Mind Services](#phase-1-rez-mind-services)
3. [Phase 2: Commerce Core](#phase-2-commerce-core)
4. [Phase 3: Marketing Platform](#phase-3-marketing-platform)
5. [Phase 4: Intelligence Platform](#phase-4-intelligence-platform)
6. [Phase 5: Applications](#phase-5-applications)
7. [Phase 6: Infrastructure](#phase-6-infrastructure)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Health Check Endpoints](#health-check-endpoints)
10. [Rollback Procedures](#rollback-procedures)
11. [Verification Checklist](#verification-checklist)

---

## 1. DEPLOY ORDER OVERVIEW

```
PHASE 1: REZ MIND (AI Foundation - Deploy First)
├── 1.1 rez-event-platform (4008) - Event bus (CRITICAL)
├── 1.2 REZ-action-engine (4009) - Decision execution
├── 1.3 rez-feedback-service (4010) - Learning loop
└── 1.4 rez-intent-graph (3001) - AI brain

PHASE 2: COMMERCE CORE (Payment Foundation)
├── 2.1 rez-auth-service (4002) - Authentication
├── 2.2 rez-payment-service (4001) - Payments
├── 2.3 rez-merchant-service (4005) - Merchants
├── 2.4 rez-wallet-service (4004) - Wallet
├── 2.5 rez-search-service (4003) - Search
├── 2.6 rez-order-service (3006) - Orders
├── 2.7 rez-catalog-service (3005) - Products
└── 2.8 rez-api-gateway (3001) - API Gateway

PHASE 3: MARKETING PLATFORM
├── 3.1 rez-marketing-service (4000) - Campaigns
├── 3.2 rez-lead-intelligence (4106) - Lead tracking
├── 3.3 rez-abandonment-tracker (4108) - Cart recovery
├── 3.4 rez-decision-service (4027) - Decision engine
├── 3.5 rez-unified-messaging (4025) - Messaging
├── 3.6 rez-gamification-service (3004) - Loyalty
├── 3.7 REZ-push-service (4013) - Notifications
└── 3.8 rez-ads-service (4007) - Advertising

PHASE 4: INTELLIGENCE PLATFORM
├── 4.1 REZ-intelligence-hub (4020) - Central hub
├── 4.2 REZ-user-intelligence-service (3004) - User analytics
├── 4.3 REZ-merchant-intelligence-service (4012) - Merchant analytics
├── 4.4 REZ-personalization-engine (4017) - Personalization
└── 4.5 REZ-recommendation-engine (4015) - Recommendations

PHASE 5: APPLICATIONS
├── 5.1 rez-app-consumer (Expo)
├── 5.2 rez-app-merchant (Expo)
├── 5.3 rez-app-admin (Web)
└── 5.4 rez-web-menu (Web)

PHASE 6: INFRASTRUCTURE
├── 6.1 REZ-observability (4031) - Monitoring
├── 6.2 REZ-feature-flags (4030) - Feature flags
└── 6.3 REZ-support-copilot (4033) - Support
```

---

## PHASE 1: REZ MIND SERVICES

### 1.1 REZ-EVENT-PLATFORM (CRITICAL - Deploy First)

**GitHub:** https://github.com/imrejaul007/REZ-event-platform
**Priority:** CRITICAL - All other services depend on this
**Port:** 4008

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-event-platform |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `npx ts-node src/index-simple.ts` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4008

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-events

# Redis (standardized format)
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Optional (for advanced features)
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904
```

#### Health Check
```bash
curl https://rez-event-platform.onrender.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

#### Rollback Tag
`v1.0.0-event-platform`

---

### 1.2 REZ-ACTION-ENGINE

**GitHub:** https://github.com/imrejaul007/REZ-action-engine
**Port:** 4009

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-action-engine |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `npx ts-node src/index-adaptive.ts` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4009

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-actions

# Redis (standardized format)
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs (CRITICAL - must point to deployed services)
FEEDBACK_SERVICE_URL=https://rez-feedback-service.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com

# Sentry
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904
```

#### Health Check
```bash
curl https://rez-action-engine.onrender.com/health
```

---

### 1.3 REZ-FEEDBACK-SERVICE

**GitHub:** https://github.com/imrejaul007/REZ-feedback-service
**Port:** 4010

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-feedback-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index-learning.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4010

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-feedback

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 1.4 REZ-INTENT-GRAPH

**GitHub:** https://github.com/imrejaul007/REZ-intent-graph
**Port:** 3001

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-intent-graph |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/server/server.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3001

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-intent-graph

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
ACTION_ENGINE_URL=https://rez-action-engine.onrender.com
FEEDBACK_SERVICE_URL=https://rez-feedback-service.onrender.com
```

#### Security Note (from Security Audit)
> **HIGH PRIORITY:** WebSocket server in intent-graph has no authentication. Implement JWT auth for WebSocket connections before exposing publicly.

---

## PHASE 2: COMMERCE CORE

### 2.1 REZ-AUTH-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-auth-service
**Port:** 4002
**Database:** rez_auth

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-auth-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4002

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_auth

# JWT Secrets (CRITICAL - must be 32+ characters)
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
JWT_ADMIN_SECRET=admin-256-bit-secret-key-minimum-32-chars
JWT_MERCHANT_SECRET=merchant-256-bit-secret-minimum-32-chars
JWT_REFRESH_SECRET=refresh-256-bit-secret-minimum-32-chars

# OTP Configuration
OTP_SECRET=your-otp-hmac-secret-minimum-32-characters
OTP_TTL=300

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# CORS (production origins only - NO localhost)
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://rez-app-marchant.vercel.app,https://www.rez.money,https://rez.money

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sentry
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904

# Internal Service Token
INTERNAL_SERVICE_TOKEN=your-internal-service-token
```

#### Health Check
```bash
curl https://rez-auth-service.onrender.com/health
# Expected: {"success":true,"status":"healthy"}
```

---

### 2.2 REZ-WALLET-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-wallet-service
**Port:** 4004
**Database:** rez_wallet

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-wallet-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4004

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_wallet

# JWT (role-based secrets)
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
JWT_MERCHANT_SECRET=merchant-256-bit-secret-minimum-32-chars
JWT_REFRESH_SECRET=refresh-256-bit-secret-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com

# CORS
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://rez-app-marchant.vercel.app,https://www.rez.money,https://rez.money

# Sentry
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904
```

---

### 2.3 REZ-PAYMENT-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-payment-service
**Port:** 4001
**Database:** rez_payment

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-payment-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4001

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_payment

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
JWT_MERCHANT_SECRET=merchant-256-bit-secret-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com

# CORS (IMPORTANT - must set explicit origins)
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://www.rez.money,https://rez.money

# Sentry
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904
```

#### Security Notes
- **Razorpay Signature Verification:** Enabled with HMAC-SHA256
- **Webhook Protection:** Signature + event deduplication + Razorpay API verification
- **Replay Prevention:** Payment IDempotency via Redis (25-hour TTL)

---

### 2.4 REZ-ORDER-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-order-service
**Port:** 3006
**Database:** rez_order

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-order-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/httpServer.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3006

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_order

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com

# CORS
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://www.rez.money,https://rez.money
```

---

### 2.5 REZ-MERCHANT-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-merchant-service
**Port:** 4005
**Database:** rez_merchant
**Routes:** 130+ route files, 716 endpoints

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-merchant-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4005

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_merchant

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
JWT_MERCHANT_SECRET=merchant-256-bit-secret-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com

# CORS
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-marchant.vercel.app,https://www.rez.money,https://rez.money,https://merchant.rez.money

# Sentry
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904
```

---

### 2.6 REZ-CATALOG-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-catalog-service
**Port:** 3005
**Database:** rez_catalog

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-catalog-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3005

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_catalog

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
```

---

### 2.7 REZ-SEARCH-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-search-service
**Port:** 4003
**Database:** rez_search

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-search-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4003

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_search

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# CORS
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://www.rez.money,https://rez.money
```

---

### 2.8 REZ-API-GATEWAY

**GitHub:** https://github.com/imrejaul007/rez-api-gateway
**Port:** 3001

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-api-gateway |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3001

# Service URLs (all backend services)
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com

# JWT Verification
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://rez-app-marchant.vercel.app,https://www.rez.money,https://rez.money
```

---

## PHASE 3: MARKETING PLATFORM

### 3.1 REZ-ADS-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-ads-service
**Port:** 4007
**Database:** rez_ads

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-ads-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4007

# MongoDB
MONGO_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_ads

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 3.2 REZ-MARKETING-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-marketing-service
**Port:** 4000
**Database:** rez_marketing

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-marketing-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4000

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_marketing

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
USER_INTELLIGENCE_URL=https://rez-user-intelligence.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 3.3 REZ-GAMIFICATION-SERVICE

**GitHub:** https://github.com/imrejaul007/rez-gamification-service
**Port:** 3004
**Database:** rez_gamification

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-gamification-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3004

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_gamification

# JWT
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Service URLs
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 3.4 REZ-PUSH-SERVICE

**GitHub:** https://github.com/imrejaul007/REZ-push-service
**Port:** 4013

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-push-service |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4013

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_push

# Redis (supports REDIS_URL format)
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Push Notifications
FCM_SERVER_KEY=your-fcm-server-key
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_KEY_PATH=/path/to/AuthKey.p8

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

## PHASE 4: INTELLIGENCE PLATFORM

### 4.1 REZ-USER-INTELLIGENCE

**GitHub:** https://github.com/imrejaul007/REZ-user-intelligence-service
**Port:** 3004

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-user-intelligence |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3004

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-user-intel

# Redis (standardized format)
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
```

---

### 4.2 REZ-MERCHANT-INTELLIGENCE

**GitHub:** https://github.com/imrejaul007/REZ-merchant-intelligence-service
**Port:** 4012

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-merchant-intelligence |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4012

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-merchant-intel

# Redis (standardized format)
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
```

---

### 4.3 REZ-INTELLIGENCE-HUB

**GitHub:** https://github.com/imrejaul007/REZ-intelligence-hub
**Port:** 4020

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-intelligence-hub |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4020

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-intelligence-hub

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
USER_INTELLIGENCE_URL=https://rez-user-intelligence.onrender.com
MERCHANT_INTELLIGENCE_URL=https://rez-merchant-intelligence.onrender.com
```

---

### 4.4 REZ-INTENT-PREDICTOR

**GitHub:** https://github.com/imrejaul007/REZ-intent-predictor
**Port:** 4018

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-intent-predictor |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4018

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-intent-predictor

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com
```

---

### 4.5 REZ-TARGETING-ENGINE

**GitHub:** https://github.com/imrejaul007/REZ-targeting-engine
**Port:** 3003

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-targeting-engine |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=3003

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_targeting

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
USER_INTELLIGENCE_URL=https://rez-user-intelligence.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
```

---

### 4.6 REZ-RECOMMENDATION-ENGINE

**GitHub:** https://github.com/imrejaul007/REZ-recommendation-engine
**Port:** 4015

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-recommendation-engine |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4015

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_recommendations

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
USER_INTELLIGENCE_URL=https://rez-user-intelligence.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
```

---

## PHASE 5: APPLICATIONS

### 5.1 REZ-APP-CONSUMER (Expo)

**Repository:** rez-app-consumer
**Platform:** iOS/Android

#### Environment Variables (via EAS Secrets)
```bash
# API URLs
EXPO_PUBLIC_API_GATEWAY_URL=https://rez-api-gateway.onrender.com
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
EXPO_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com
EXPO_PUBLIC_MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
EXPO_PUBLIC_CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
EXPO_PUBLIC_SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
EXPO_PUBLIC_PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com

# REZ Mind
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com

# Environment
EXPO_PUBLIC_NODE_ENV=production
```

#### Build Commands
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

### 5.2 REZ-APP-MERCHANT (Expo)

**Repository:** rez-app-merchant
**Platform:** iOS/Android

#### Environment Variables (via EAS Secrets)
```bash
# API URLs
EXPO_PUBLIC_API_GATEWAY_URL=https://rez-api-gateway.onrender.com
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
EXPO_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com
EXPO_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com

# REZ Mind
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com

# Environment
EXPO_PUBLIC_NODE_ENV=production
```

---

### 5.3 REZ-APP-ADMIN (Next.js)

**Repository:** rez-app-admin
**Platform:** Web (Vercel)

#### Environment Variables (Vercel Dashboard)
```bash
# API URLs
NEXT_PUBLIC_API_GATEWAY_URL=https://rez-api-gateway.onrender.com
NEXT_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
NEXT_PUBLIC_MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
NEXT_PUBLIC_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
NEXT_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com
NEXT_PUBLIC_PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com

# REZ Mind
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com

# Environment
NEXT_PUBLIC_NODE_ENV=production
```

---

### 5.4 REZ-WEB-MENU (Next.js)

**Repository:** rez-web-menu
**Platform:** Web (Vercel)

#### Environment Variables (Vercel Dashboard)
```bash
# API URLs
NEXT_PUBLIC_API_GATEWAY_URL=https://rez-api-gateway.onrender.com
NEXT_PUBLIC_MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
NEXT_PUBLIC_CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
NEXT_PUBLIC_ORDER_SERVICE_URL=https://rez-order-service.onrender.com

# REZ Mind
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

---

## PHASE 6: INFRASTRUCTURE

### 6.1 REZ-OBSERVABILITY

**GitHub:** https://github.com/imrejaul007/REZ-observability
**Port:** 4031

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-observability |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/index.js` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4031

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_observability

# Redis
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692

# Service URLs
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
```

---

### 6.2 REZ-FEATURE-FLAGS

**GitHub:** https://github.com/imrejaul007/REZ-feature-flags
**Port:** 4030

#### Render Settings
| Setting | Value |
|---------|-------|
| Name | rez-feature-flags |
| Region | Singapore |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `node src/index.cjs` |
| Health Check | `GET /health` |

#### Environment Variables
```bash
# Core
NODE_ENV=production
PORT=4030

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/rez_feature_flags
```

---

## ENVIRONMENT VARIABLES REFERENCE

### Standardized Redis Format (ALL services must use this format)

```bash
REDIS_URL=redis://default:password@host:port
```

Example:
```bash
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692
```

**Important:** Do NOT use the old format:
```bash
# OLD FORMAT - DO NOT USE
REDIS_HOST=redis-12345.redns.redisdb.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Shared Secrets (All Services)

```bash
# JWT Configuration (minimum 32 characters each)
JWT_SECRET=your-256-bit-secret-key-here-minimum-32-chars
JWT_ADMIN_SECRET=admin-256-bit-secret-key-minimum-32-chars
JWT_MERCHANT_SECRET=merchant-256-bit-secret-minimum-32-chars
JWT_REFRESH_SECRET=refresh-256-bit-secret-minimum-32-chars

# OTP (minimum 32 characters)
OTP_SECRET=your-otp-hmac-secret-minimum-32-characters

# Internal Service Communication
INTERNAL_SERVICE_TOKEN=your-internal-service-token

# Monitoring
SENTRY_DSN=https://138c07c22c015d41c23626fce16be643@o4511106544369664.ingest.de.sentry.io/4511106548301904
```

### Database Connections

```bash
# MongoDB Atlas (primary)
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@cluster0.ku78x6g.mongodb.net/{database}

# Alternative cluster
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/{database}

# Redis (standardized format - use for ALL services)
REDIS_URL=redis://default:EJRABXvbLsG0WYu4tmkRnwbGZodLPLeb@redis-15692.c244.us-east-1-2.ec2.redns.redis-cloud.com:15692
```

### CORS Origins (Production)

```bash
CORS_ORIGINS=https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://rez-app-marchant.vercel.app,https://www.rez.money,https://rez.money,https://menu.rez.money,https://admin.rez.money,https://merchant.rez.money,https://ad-bazaar.vercel.app
```

### Service URLs (Update after deployment)

```bash
# REZ Mind
EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
ACTION_ENGINE_URL=https://rez-action-engine.onrender.com
FEEDBACK_SERVICE_URL=https://rez-feedback-service.onrender.com
INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com

# Commerce Core
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
API_GATEWAY_URL=https://rez-api-gateway.onrender.com

# Marketing
ADS_SERVICE_URL=https://rez-ads-service.onrender.com
MARKETING_SERVICE_URL=https://rez-marketing-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com
PUSH_SERVICE_URL=https://rez-push-service.onrender.com

# Intelligence
USER_INTELLIGENCE_URL=https://rez-user-intelligence.onrender.com
MERCHANT_INTELLIGENCE_URL=https://rez-merchant-intelligence.onrender.com
INTELLIGENCE_HUB_URL=https://rez-intelligence-hub.onrender.com
INTENT_PREDICTOR_URL=https://rez-intent-predictor.onrender.com
TARGETING_ENGINE_URL=https://rez-targeting-engine.onrender.com
RECOMMENDATION_ENGINE_URL=https://rez-recommendation-engine.onrender.com
```

---

## HEALTH CHECK ENDPOINTS

### Primary Health Checks

| Service | URL | Expected Response |
|---------|-----|-------------------|
| rez-event-platform | `/health` | `{"status":"ok"}` |
| rez-action-engine | `/health` | `{"status":"ok"}` |
| rez-feedback-service | `/health` | `{"status":"ok"}` |
| rez-intent-graph | `/health` | `{"status":"ok"}` |
| rez-auth-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-wallet-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-payment-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-order-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-merchant-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-catalog-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-search-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-api-gateway | `/health` | `{"success":true,"status":"healthy"}` |
| rez-ads-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-marketing-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-gamification-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-push-service | `/health` | `{"success":true,"status":"healthy"}` |
| rez-user-intelligence | `/health` | `{"success":true,"status":"healthy"}` |
| rez-merchant-intelligence | `/health` | `{"success":true,"status":"healthy"}` |
| rez-intelligence-hub | `/health` | `{"success":true,"status":"healthy"}` |
| rez-intent-predictor | `/health` | `{"success":true,"status":"healthy"}` |
| rez-targeting-engine | `/health` | `{"success":true,"status":"healthy"}` |
| rez-recommendation-engine | `/health` | `{"success":true,"status":"healthy"}` |
| rez-observability | `/health` | `{"success":true,"status":"healthy"}` |
| rez-feature-flags | `/health` | `{"success":true,"status":"healthy"}` |

### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Run after each deployment phase

echo "=== REZ MIND Health Checks ==="
curl -s https://rez-event-platform.onrender.com/health || exit 1
curl -s https://rez-action-engine.onrender.com/health || exit 1
curl -s https://rez-feedback-service.onrender.com/health || exit 1
curl -s https://rez-intent-graph.onrender.com/health || exit 1

echo ""
echo "=== Commerce Core Health Checks ==="
curl -s https://rez-auth-service.onrender.com/health || exit 1
curl -s https://rez-wallet-service.onrender.com/health || exit 1
curl -s https://rez-payment-service.onrender.com/health || exit 1
curl -s https://rez-order-service.onrender.com/health || exit 1
curl -s https://rez-merchant-service.onrender.com/health || exit 1
curl -s https://rez-catalog-service.onrender.com/health || exit 1
curl -s https://rez-search-service.onrender.com/health || exit 1
curl -s https://rez-api-gateway.onrender.com/health || exit 1

echo ""
echo "=== All Health Checks Passed ==="
```

---

## ROLLBACK PROCEDURES

### Automatic Rollback (Render)

Render automatically rolls back if:
- Health check fails 3 consecutive times
- Build fails
- Server crashes within 5 minutes of startup

### Manual Rollback (Per Service)

#### Step 1: Identify the Problem
```bash
# Check service logs
curl https://rez-<service>.onrender.com/logs

# Or via Render CLI
render logs --service=<service-name>
```

#### Step 2: Rollback to Previous Version
```bash
# Via Render Dashboard
# 1. Go to Service > Deployments
# 2. Find the last working deployment
# 3. Click "Redeploy" on that version

# Via Render CLI
render deployment create --service=<service-name> --commit=<working-commit-sha>
```

#### Step 3: Verify Rollback
```bash
curl https://rez-<service>.onrender.com/health
# Should return healthy within 30 seconds
```

### Full System Rollback

If a critical issue affects the entire system:

```bash
# 1. Enable maintenance mode
# Set MAINTENANCE_MODE=true in all services

# 2. Rollback each service in REVERSE order
# PHASE 6: Infrastructure
render deployment create --service=rez-observability --commit=<last-working-commit>

# PHASE 5: Applications
# Redeploy via EAS/Vercel with previous version tag

# PHASE 4: Intelligence Platform
render deployment create --service=rez-targeting-engine --commit=<last-working-commit>
render deployment create --service=rez-recommendation-engine --commit=<last-working-commit>
render deployment create --service=rez-intent-predictor --commit=<last-working-commit>
render deployment create --service=rez-intelligence-hub --commit=<last-working-commit>
render deployment create --service=rez-merchant-intelligence --commit=<last-working-commit>
render deployment create --service=rez-user-intelligence --commit=<last-working-commit>

# PHASE 3: Marketing Platform
render deployment create --service=rez-push-service --commit=<last-working-commit>
render deployment create --service=rez-gamification-service --commit=<last-working-commit>
render deployment create --service=rez-marketing-service --commit=<last-working-commit>
render deployment create --service=rez-ads-service --commit=<last-working-commit>

# PHASE 2: Commerce Core
render deployment create --service=rez-api-gateway --commit=<last-working-commit>
render deployment create --service=rez-search-service --commit=<last-working-commit>
render deployment create --service=rez-catalog-service --commit=<last-working-commit>
render deployment create --service=rez-merchant-service --commit=<last-working-commit>
render deployment create --service=rez-order-service --commit=<last-working-commit>
render deployment create --service=rez-payment-service --commit=<last-working-commit>
render deployment create --service=rez-wallet-service --commit=<last-working-commit>
render deployment create --service=rez-auth-service --commit=<last-working-commit>

# PHASE 1: REZ Mind (last - most critical)
render deployment create --service=rez-intent-graph --commit=<last-working-commit>
render deployment create --service=rez-feedback-service --commit=<last-working-commit>
render deployment create --service=rez-action-engine --commit=<last-working-commit>
render deployment create --service=rez-event-platform --commit=<last-working-commit>

# 3. Disable maintenance mode
# Set MAINTENANCE_MODE=false in all services
```

### Database Rollback

**WARNING:** Database rollbacks should only be performed by senior engineers.

```bash
# 1. Create manual backup before any rollback
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net" --out=/backup/pre-rollback-$(date +%Y%m%d)

# 2. For MongoDB Atlas, use Point-in-Time Restore
# Go to Atlas > Clusters > Backups > Restore

# 3. Verify data integrity after restore
mongosh --uri="mongodb+srv://user:pass@cluster.mongodb.net" --eval "db.adminCommand({ping:1})"
```

---

## VERIFICATION CHECKLIST

### Pre-Deployment Verification

```
[ ] All services have passed build in CI/CD
[ ] All tests passing (minimum 88% pass rate)
[ ] Security audit completed and approved
[ ] Environment variables configured in Render
[ ] MongoDB Atlas cluster accessible
[ ] Redis instance accessible
[ ] CORS origins configured (no localhost)
[ ] JWT secrets are 32+ characters
[ ] All credentials rotated (no hardcoded)
```

### Phase 1: REZ MIND Verification

```
[ ] rez-event-platform health check passing
[ ] rez-action-engine health check passing
[ ] rez-feedback-service health check passing
[ ] rez-intent-graph health check passing
[ ] Test event flow:
    curl -X POST https://rez-event-platform.onrender.com/webhook/merchant/order \
      -H "Content-Type: application/json" \
      -d '{"merchant_id":"test","order_id":"test123","customer_id":"test","items":[],"total_amount":0}'
[ ] Verify event appears in database
[ ] Verify action triggered in action-engine
[ ] Verify feedback recorded in feedback-service
```

### Phase 2: Commerce Core Verification

```
[ ] rez-auth-service health check passing
[ ] rez-wallet-service health check passing
[ ] rez-payment-service health check passing
[ ] rez-order-service health check passing
[ ] rez-merchant-service health check passing
[ ] rez-catalog-service health check passing
[ ] rez-search-service health check passing
[ ] rez-api-gateway health check passing
[ ] Test authentication flow:
    curl -X POST https://rez-auth-service.onrender.com/api/auth/send-otp \
      -H "Content-Type: application/json" \
      -d '{"phone":"+919876543210"}'
[ ] Test payment initiation:
    curl -X POST https://rez-payment-service.onrender.com/pay/initiate \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <token>" \
      -d '{"amount":100,"currency":"INR"}'
```

### Phase 3: Marketing Platform Verification

```
[ ] rez-ads-service health check passing
[ ] rez-marketing-service health check passing
[ ] rez-gamification-service health check passing
[ ] rez-push-service health check passing
[ ] Test ad campaign creation
[ ] Test gamification points award
[ ] Test push notification delivery
```

### Phase 4: Intelligence Platform Verification

```
[ ] rez-user-intelligence health check passing
[ ] rez-merchant-intelligence health check passing
[ ] rez-intelligence-hub health check passing
[ ] rez-intent-predictor health check passing
[ ] rez-targeting-engine health check passing
[ ] rez-recommendation-engine health check passing
[ ] Test user profile updates
[ ] Test intent prediction
[ ] Test recommendations
```

### Phase 5: Application Verification

```
[ ] rez-app-consumer builds successfully
[ ] rez-app-merchant builds successfully
[ ] rez-app-admin deploys to Vercel
[ ] rez-web-menu deploys to Vercel
[ ] Test consumer app login flow
[ ] Test merchant app login flow
[ ] Test admin dashboard access
[ ] Test web menu loading
```

### Phase 6: Infrastructure Verification

```
[ ] rez-observability health check passing
[ ] rez-feature-flags health check passing
[ ] Verify metrics appearing in dashboard
[ ] Verify alerts configured
[ ] Verify logging working
```

### Post-Deployment Verification

```
[ ] All services responding to health checks
[ ] Sentry receiving events (no spike in errors)
[ ] Redis connection working
[ ] MongoDB connections stable
[ ] No memory leaks in service logs
[ ] Response times within SLA (<500ms P99)
[ ] Test end-to-end user flows:
    - User registration and login
    - Browse merchant and products
    - Add to cart and checkout
    - Payment processing
    - Order confirmation
    - Push notification received
```

### Security Verification

```
[ ] No authentication bypass vulnerabilities
[ ] Rate limiting working
[ ] CORS properly configured (no wildcards)
[ ] No hardcoded credentials in deployed code
[ ] Webhook signatures being verified
[ ] IDOR protections in place
[ ] JWT tokens properly validated
[ ] OTP rate limiting working
```

---

## DEPLOYMENT TIMELINE

| Phase | Duration | Services | Total |
|-------|----------|----------|-------|
| Phase 1: REZ MIND | 30 min | 4 | 4 |
| Phase 2: Commerce Core | 60 min | 8 | 8 |
| Phase 3: Marketing | 45 min | 4 | 4 |
| Phase 4: Intelligence | 45 min | 6 | 6 |
| Phase 5: Applications | 30 min | 4 | 4 |
| Phase 6: Infrastructure | 15 min | 2 | 2 |
| **Total** | **~4 hours** | **28** | **28** |

---

## EMERGENCY CONTACTS

| Role | Contact |
|------|---------|
| Platform Lead | (Configure) |
| Security Lead | (Configure) |
| DevOps On-Call | (Configure) |
| MongoDB Atlas Support | support@mongodb.com |
| Render Support | support@render.com |

---

## APPENDIX: QUICK REFERENCE

### Service URLs (Render - Update as deployed)

```
REZ MIND:
- Event Platform: https://rez-event-platform.onrender.com
- Action Engine: https://rez-action-engine.onrender.com
- Feedback Service: https://rez-feedback-service.onrender.com
- Intent Graph: https://rez-intent-graph.onrender.com

COMMERCE CORE:
- API Gateway: https://rez-api-gateway.onrender.com
- Auth Service: https://rez-auth-service.onrender.com
- Wallet Service: https://rez-wallet-service.onrender.com
- Payment Service: https://rez-payment-service.onrender.com
- Order Service: https://rez-order-service.onrender.com
- Merchant Service: https://rez-merchant-service.onrender.com
- Catalog Service: https://rez-catalog-service.onrender.com
- Search Service: https://rez-search-service.onrender.com

MARKETING:
- Ads Service: https://rez-ads-service.onrender.com
- Marketing Service: https://rez-marketing-service.onrender.com
- Gamification: https://rez-gamification-service.onrender.com
- Push Service: https://rez-push-service.onrender.com

INTELLIGENCE:
- User Intelligence: https://rez-user-intelligence.onrender.com
- Merchant Intelligence: https://rez-merchant-intelligence.onrender.com
- Intelligence Hub: https://rez-intelligence-hub.onrender.com
- Intent Predictor: https://rez-intent-predictor.onrender.com
- Targeting Engine: https://rez-targeting-engine.onrender.com
- Recommendation Engine: https://rez-recommendation-engine.onrender.com
```

---

**Document Version:** 1.1.0
**Last Updated:** 2026-05-06
**Next Review:** 2026-06-06
**Status:** APPROVED FOR PRODUCTION DEPLOYMENT
**Changes from v1.0.0:**
- Corrected port numbers per COMPLETE-PORT-REFERENCE.md
- Standardized Redis format (REDIS_URL format) across all services
- Updated deploy order to match port reference
- Added missing services (lead-intelligence, abandonment-tracker, decision-service, unified-messaging, personalization-engine)
- Archived legacy deployment guides to OLD/
