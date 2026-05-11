# OTHER REPOS AUDIT

**Audit Date:** 2026-05-04
**Auditor:** Claude Code
**Purpose:** Consolidation assessment for ReZ ecosystem

---

## 1. rez-automation-service

- **Purpose:** Rule engine for automated triggers and workflow automation. Event-driven architecture listening to business events (orders, payments, wallet, hotel) and executing automated actions.
- **Port:** 3001 (dev) / 3009 (docker)
- **Dependencies:** express, mongoose, ioredis, node-cron, axios, winston, @sentry/node, @rez/shared
- **Internal Connections:** Event Bus (RabbitMQ/Redis pub/sub), connects to order/payment/wallet/hotel services via events
- **External APIs:** Webhooks, SMTP email, external HTTP endpoints
- **Database:** MongoDB (rez-automation), Redis (rez:automation: prefix)
- **Files:** src/index.ts, src/config/, src/models/, src/rules/, src/workers/
- **Git:** git@github.com:imrejaul007/rez-automation-service.git
- **Can Merge With:** rez-scheduler-service (both do background/scheduled work)

## 2. rez-backend

- **Purpose:** Production backend for REZ mobile and web apps. Core commerce platform - users, wallets, cashback, orders, payments, merchants, notifications.
- **Port:** 5000
- **Dependencies:** express v5, mongoose, ioredis, bullmq, razorpay, stripe, @sendgrid/mail, twilio, firebase, socket.io, swagger-jsdoc, zod, winston
- **Internal Connections:** BullMQ worker, Socket.IO, Redis caching, webhooks
- **External APIs:** Razorpay, Stripe, Twilio, SendGrid, Firebase, Cloudinary
- **Database:** MongoDB (rez), Redis (sessions, cache, cashback)
- **Files:** src/server.ts, src/worker.ts, src/controllers/, src/models/, src/routes/, src/services/, src/middleware/, src/jobs/
- **Git:** https://github.com/imrejaul007/rez-backend.git
- **Can Merge With:** rez-scheduler-service (has its own job scheduling - consolidate workers)

## 3. rez-corporate-service

- **Purpose:** Corporate account management - HRIS integration (GreytHR, BambooHR, Zoho), corporate cards (Razorpay), GST e-invoice, travel booking (TBO), expense management.
- **Port:** 4030
- **Dependencies:** express, mongoose, helmet, cors, bcryptjs, jsonwebtoken, pdfkit, xlsx, node-cron, axios, winston, @rez/shared
- **Internal Connections:** NOTIFICATION_SERVICE_URL
- **External APIs:** TBO (Travel Business Online), Razorpay Corporate Cards, GST e-Invoice API, GreytHR API, BambooHR API, Zoho People API
- **Database:** MongoDB (rez-corporate)
- **Files:** src/index.ts, src/integrations/hris/, src/integrations/cards/, src/integrations/gst/, src/integrations/travel/
- **Git:** https://github.com/imrejaul007/rez-corporate-service.git
- **Can Merge With:** rez-travel-service (both handle travel bookings, TBO integration)

## 4. rez-finance-service

- **Purpose:** Financial services - loans, credit scoring, BNPL, financial analytics, coin rewards, partner integrations.
- **Port:** 4005
- **Dependencies:** express, mongoose, ioredis, bullmq, jsonwebtoken, axios, node-cron, winston, zod, @sentry/node, @rez/shared
- **Internal Connections:** WALLET_SERVICE_URL, GAMIFICATION_SERVICE_URL, ORDER_SERVICE_URL, INTENT_CAPTURE_URL
- **External APIs:** FinBox (account aggregator, loan eligibility), Experian (credit bureau - Phase 2)
- **Database:** MongoDB (rez-finance), Redis (cache/queue)
- **Files:** src/index.ts, src/models/, src/engines/, src/jobs/, src/config/
- **Git:** git@github.com:imrejaul007/rez-finance-service.git
- **Can Merge With:** Standalone due to regulatory concerns; could absorb gamification coin rewards

## 5. rez-gamification-service

- **Purpose:** Gamification microservice - coins, streaks, achievements, leaderboards. Worker-based architecture.
- **Port:** 3004
- **Dependencies:** express, mongoose, ioredis, bullmq, jsonwebtoken, winston, zod, @sentry/node, compression
- **Internal Connections:** REZ_WALLET_SERVICE_URL, REZ_MARKETING_SERVICE_URL, REZ_NOTIFICATION_SERVICE_URL, REZ_PUSH_SERVICE_URL, INTENT_CAPTURE_URL
- **External APIs:** None (internal ReZ ecosystem only)
- **Database:** MongoDB, Redis (bullmq)
- **Files:** src/index.ts, src/httpServer.ts, src/worker.ts, src/config/, src/middleware/, src/workers/, src/services/
- **Git:** git@github.com:imrejaul007/rez-gamification-service.git
- **Can Merge With:** rez-finance-service (coin rewards are financial in nature); keep achievements separate if scope grows

## 6. rez-insights-service

- **Purpose:** AI-generated insight storage and delivery - stores insights from ReZ Mind for Copilot UI.
- **Port:** 3008
- **Dependencies:** express, mongoose, ioredis, winston, zod, @sentry/node, @rez/shared
- **Internal Connections:** INTENT_API_URL (ReZ Mind)
- **External APIs:** None
- **Database:** MongoDB (rez-insights legacy), Redis (cache)
- **Files:** src/index.ts, src/config/, src/models/, src/routes/, src/services/, src/middleware/
- **Git:** git@github.com:imrejaul007/rez-insights-service.git
- **Can Merge With:** rez-intent-graph (both deal with AI-generated data)

## 7. rez-scheduler-service

- **Purpose:** Cron job and scheduled task microservice using BullMQ for job orchestration. Centralized job scheduling.
- **Port:** 4009
- **Dependencies:** express, mongoose, ioredis, bullmq (core), axios, jsonwebtoken, winston, zod, @sentry/node, @rez/shared
- **Internal Connections:** PAYMENT_SERVICE_URL, ORDER_SERVICE_URL, FINANCE_SERVICE_URL, NOTIFICATION_SERVICE_URL, AUTH_SERVICE_URL, CATALOG_SERVICE_URL, MERCHANT_SERVICE_URL, Event Bus (Redis Streams)
- **External APIs:** None
- **Database:** MongoDB (rez-scheduler), Redis (bullmq queues)
- **Files:** src/index.ts, src/eventBus.ts, src/health.ts, src/config/, src/models/, src/processors/, src/routes/, src/workers/, src/queues/
- **Git:** https://github.com/imrejaul007/rez-scheduler-service.git
- **Can Merge With:** rez-automation-service, rez-backend (has its own BullMQ setup)

## 8. rez-travel-service

- **Purpose:** Travel booking API - flights, trains, buses, cabs. Consolidates multiple travel booking providers.
- **Port:** 4007
- **Dependencies:** express, mongoose, helmet, cors, joi, uuid, winston, @sentry/node, @rez/shared
- **Internal Connections:** AUTH_SERVICE_URL, WALLET_SERVICE_URL, ORDER_SERVICE_URL
- **External APIs:** TBO API (flight, hotel booking)
- **Database:** MongoDB (rez_travel)
- **Files:** src/index.ts, src/app.ts, src/routes/, src/services/, src/config/, src/models/
- **Git:** https://github.com/imrejaul007/rez-travel-service.git
- **Can Merge With:** rez-corporate-service (corporate has travel booking via TBO)

## 9. rez-student-service

**STATUS: NOT FOUND**
- This service was not found as a standalone repo.
- Student-related code exists in frontend: rez-app-consumer/src/screens/student, rez-app-consumer/src/services/student
- Student features appear to be part of frontend, not a separate backend service.

---

## CONSOLIDATION RECOMMENDATIONS

### High Priority Mergers
| From | To | Rationale |
|------|-----|-----------|
| rez-automation-service | rez-scheduler-service | Both do background/scheduled work. Scheduler has more mature BullMQ setup. |
| rez-backend BullMQ | rez-scheduler-service | Centralize all job scheduling. |

### Medium Priority Mergers
| From | To | Rationale |
|------|-----|-----------|
| rez-travel-service | rez-corporate-service | Both integrate with TBO for travel. Consolidate travel booking. |
| rez-gamification-service coins | rez-finance-service | Coin rewards are financial. Keep achievements separate. |

### Services to Keep Separate
| Service | Reason |
|---------|--------|
| rez-backend | Core commerce platform - too large to merge |
| rez-finance-service | Regulatory concerns - keep isolated |
| rez-insights-service | AI domain - could merge with intent-graph |

---

## SHARED PATTERNS

- **MongoDB** - All services use MongoDB (different databases)
- **Redis** - All services use Redis (caching, queues, sessions)
- **Express** - Most services use Express.js
- **BullMQ** - Finance, Gamification, Scheduler, Backend all use BullMQ
- **JWT Auth** - All services use JWT for authentication
- **Sentry** - Error tracking in most services
- **Winston** - Logging in all services
- **@rez/shared** - Local shared package used by most services

### Common External Integrations
- **TBO API** - Used by rez-travel-service and rez-corporate-service
- **Razorpay** - Used by rez-backend (payments) and rez-corporate-service (cards)

---

## PORT ALLOCATION

| Service | Port | Purpose |
|---------|------|---------|
| rez-automation-service | 3001 | Rule engine |
| rez-backend | 5000 | Main API |
| rez-corporate-service | 4030 | Corporate management |
| rez-finance-service | 4005 | Financial services |
| rez-gamification-service | 3004 | Gamification |
| rez-insights-service | 3008 | AI insights |
| rez-scheduler-service | 4009 | Job scheduling |
| rez-travel-service | 4007 | Travel booking |

---

## MISSING SERVICES (Referenced but not found)

- rez-order-service
- rez-wallet-service
- rez-notification-events
- rez-push-service
- rez-marketing-service
- rez-auth-service
- rez-catalog-service
- rez-merchant-service
- rez-payment-service
