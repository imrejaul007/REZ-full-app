# ReZ AI/ML Services Audit Report

**Generated:** May 10, 2026  
**Total AI/ML Services Found:** 14

---

## Executive Summary

This audit covers all AI/ML related services in the ReZ ecosystem, including intent prediction, intelligence services, machine learning infrastructure, and analytics platforms.

| Service | Status | Port | Primary Function |
|---------|--------|------|------------------|
| rez-intent-predictor | Built | 4018 | Real-time user intent scoring |
| rez-intelligence-hub | Built | 4020 | Unified user/merchant profiles + Voice AI |
| rez-lead-intelligence | Built | 4014 | Hot/Warm/Cold lead detection |
| rez-user-intelligence-service | Built | 3016 | User behavior tracking & recommendations |
| rez-insights-service | Built | 3011 | AI-powered insights management |
| rez-merchant-intelligence-service | Built | 3015 | Merchant analytics & recommendations |
| rez-ml-model-registry | Built | 3001 | ML model versioning & management |
| rez-ml-engine | Partial | - | ML model training pipeline |
| rez-ml-feature-store | Built | 3005 | Feature serving for ML |
| rez-intent-service | Built | 4009 | Intent signal capture & agents |
| rez-intent-graph | Built | 3001 | Cross-app intent tracking & AI agents |
| rez-training-data-service | Empty | - | Training data management (stub) |
| rez-error-intelligence | Built | - | Error tracking & prevention |

---

## Detailed Service Analysis

### 1. rez-intent-predictor

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-predictor`

**Purpose:** Real-time user intent prediction for push notification triggers

**Port:** 4018

**Status:** Built - JavaScript (not TypeScript)

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/intent/score` | POST | Real-time intent scoring |
| `/intent/user/:id/profile` | GET | User intent profile |
| `/intent/optimize` | POST | Optimize intent detection |
| `/intent/event` | POST | Record real-time event |
| `/intent/session/:id` | GET | Session analysis |
| `/intent/batch-score` | POST | Batch scoring |

**Database Models:**
- `UserIntentProfile` - Stores intent patterns, mood indicators, urgency signals
- `SessionEvent` - Individual session events with intent indicators

**Dependencies:**
- express: ^4.18.2
- mongoose: ^8.0.0
- cors: ^2.8.5
- dotenv: ^16.3.1
- uuid: ^9.0.0

**Intent Categories:**
- ready_to_buy
- just_browsing
- research_mode
- deal_hunting
- loyalty_checking
- cart_abandonment_risk
- reactivation_needed
- high_value_opportunity

**Push Triggers:** Configured for high-priority intents with cooldown periods

**TODO Items:** None found

---

### 2. rez-intelligence-hub

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intelligence-hub`

**Purpose:** Unified user and merchant intelligence hub with Voice AI integration

**Port:** 4020

**Status:** Built - TypeScript

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/profile/user` | POST | Create user profile from event |
| `/profile/user/:userId` | GET | Get user profile |
| `/profiles` | GET | List all profiles (paginated) |
| `/api/finance/*` | * | Finance intelligence routes |
| `/api/intelligence/*` | * | User intelligence routes |
| `/api/dashboard/*` | * | Dashboard monitoring |
| `/webhook/voice` | * | Voice AI webhooks (Twilio) |
| `/api/voice/process` | POST | Process voice input |
| `/api/voice/text` | POST | Text-to-voice endpoint |
| `/api/agents/status` | GET | Agent status |

**Database Models:**
- `UserProfile` - Derived signals (preferences, intent signals, behavior)
- `MerchantProfile` - Demand patterns, customer types, pricing behavior

**Dependencies:**
- @rez/shared
- express: ^4.18.2
- mongoose: ^8.23.1
- zod: ^3.23.8
- axios: ^1.16.0
- helmet: ^7.1.0

**Features:**
- Voice AI with STT/TTS
- Autonomous agents (order, booking, support, NLU)
- Swarm orchestrator
- Finance intelligence
- Performance indexes for analytics queries

**TODO Items:** None found

---

### 3. rez-lead-intelligence

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-lead-intelligence`

**Purpose:** Hot/Warm/Cold lead detection and re-engagement automation

**Port:** 4014

**Status:** Built - TypeScript with full testing setup

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/leads/:userId/score` | GET | Get lead score |
| `/api/v1/leads/hot` | GET | Get hot leads |
| `/api/v1/leads/warm` | GET | Get warm leads |
| `/api/v1/leads/cold` | GET | Get cold leads |
| `/api/v1/carts` | POST | Track abandoned cart |
| `/api/v1/searches/abandoned` | GET | Abandoned searches |
| `/api/v1/channels/recommend` | GET | Channel recommendation |
| `/api/v1/re-engagement` | POST | Trigger re-engagement |

**Database Models:**
- LeadScore - Lead scoring model
- Multiple route models (index.ts contains comprehensive models)

**Dependencies:**
- @rez/shared
- @sentry/node: ^7.100.0
- mongoose: ^8.23.1
- ioredis: ^5.10.1
- swagger-jsdoc & swagger-ui-express
- node-cron (scheduled jobs)

**Cron Jobs:**
- Process hot leads: Every hour
- Sync to marketing: Every hour
- Process abandoned carts: Every 4 hours

**Revenue Streams:** Marketing channel optimization (WhatsApp, Push, Email)

**TODO Items:**
- JWT validation in middleware (TODO: Validate JWT and attach user to request)
- Service token validation (TODO: Validate service token against configured tokens)

---

### 4. rez-user-intelligence-service

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-user-intelligence-service`

**Purpose:** Comprehensive user intelligence - behavior tracking, preferences, recommendations

**Port:** 3016

**Status:** Built - TypeScript with RabbitMQ integration

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user/event` | POST | Capture user behavior event |
| `/users/batch/events` | POST | Batch event capture |
| `/user/:id/profile` | GET | Full 360 user profile |
| `/user/:id/preferences` | GET | User preferences |
| `/user/:id/recommendations` | GET | Personalized recommendations |
| `/user/:id/push-tokens` | GET | Push notification tokens |
| `/user/:id/push-token` | POST | Add/update push token |
| `/user/:id/lifetime-value` | GET | LTV information |
| `/user/:id/feedback` | POST | Submit feedback |
| `/user/:id` | DELETE | Delete profile (GDPR) |

**Database Models:**
- `UserIntelligence` - Base user intelligence data
- `UserProfile` - Comprehensive user profiles (28KB model file)

**Dependencies:**
- @rez/shared
- @sentry/node
- amqplib (RabbitMQ)
- mongoose: ^8.23.1
- ioredis: ^5.3.2
- winston (logging)

**Features:**
- Support integration routes
- Event capture with validation
- Push token management
- User segment tracking
- Lifetime value calculation

**TODO Items:** None found

---

### 5. rez-insights-service

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-insights-service`

**Purpose:** AI-powered insights storage and management

**Port:** 3011

**Status:** Built - TypeScript

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/insights` | POST | Create new insight |
| `/api/insights/:id` | GET | Get insight by ID |
| `/api/insights/user/:userId` | GET | User insights |
| `/api/insights/merchant/:merchantId` | GET | Merchant insights |
| `/api/insights/user/:userId/count` | GET | User insight count |
| `/api/insights/:id` | PATCH | Update insight status |
| `/api/insights/:id` | DELETE | Dismiss insight |

**Dependencies:**
- @rez/shared
- @sentry/node
- mongoose: ^8.17.2
- ioredis: ^5.3.0
- winston: ^3.19.0
- zod: ^3.23.6
- jsonwebtoken: ^9.0.2

**Features:**
- MongoDB + Redis
- Sentry error tracking
- JWT authentication support

**TODO Items:** None found

---

### 6. rez-merchant-intelligence-service

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-intelligence-service`

**Purpose:** Merchant analytics, insights, and recommendations

**Port:** 3015

**Status:** Built - TypeScript with full testing

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/merchant/profile` | POST | Create/update merchant profile |
| `/merchant/:id/profile` | GET | Get merchant profile |
| `/merchant/:id/sync` | POST | Sync external data |
| `/merchant/:id/insights` | GET | Comprehensive insights |
| `/merchant/:id/recommendations` | GET | Personalized recommendations |
| `/merchant/:id/competitors` | GET | Competitor analysis |
| `/merchant/:id/health-score` | GET | Merchant health score |
| `/merchant/:id/event` | POST | Capture behavior event |
| `/merchant/:id/trends` | GET | Trends analysis |

**Database Models:**
- `MerchantProfile` - 16KB comprehensive profile model
- `MerchantEvent` - Event tracking
- `MerchantScore` - Scoring model

**Dependencies:**
- @rez/shared
- @sentry/node
- mongoose: ^8.23.1
- ioredis: ^5.10.1
- amqplib (RabbitMQ)
- swagger-jsdoc

**TODO Items:** None found

---

### 7. rez-ml-model-registry

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ml-model-registry`

**Purpose:** ML model versioning, lifecycle management, and registry

**Port:** 3001

**Status:** Built - TypeScript

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/models` | POST | Register new model |
| `/api/v1/models` | GET | Search models |
| `/api/v1/models/stats` | GET | Registry statistics |
| `/api/v1/models/:namespace/:name` | GET | Get model |
| `/api/v1/models/:namespace/:name` | PATCH | Update model metadata |
| `/api/v1/models/:namespace/:name` | DELETE | Delete model |
| `/api/v1/models/:namespace/:name/archive` | POST | Archive model |
| `/api/v1/models/:namespace/:name/restore` | POST | Restore model |
| `/api/v1/models/:namespace/:name/lineage` | GET | Model lineage |
| `/api/v1/models/:namespace/:name/compare` | POST | Compare versions |
| `/api/v1/models/:namespace/:name/versions` | POST | Register version |
| `/api/v1/models/:namespace/:name/versions` | GET | List versions |
| `/api/v1/models/:namespace/:name/versions/:version` | GET/PATCH/DELETE | Version operations |
| `/api/v1/models/:namespace/:name/versions/:version/transition` | POST | Stage transition |
| `/api/v1/models/:namespace/:name/versions/:version/download` | GET | Download URL |
| `/api/v1/models/:namespace/:name/versions/:version/validate` | POST | Record validation |

**Version Stages:** pending, validated, staged, production, archived

**Model Stages:** development, staging, production, archived

**Dependencies:**
- express: ^4.18.2
- mongoose: ^8.0.0
- joi: ^17.11.0
- uuid: ^9.0.0

**TODO Items:** None found

---

### 8. rez-ml-engine

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ml-engine`

**Purpose:** ML model training pipeline

**Status:** Partial - JavaScript training scripts only

**Training Models:**
- Fraud Detection Model
- Recommendation Model
- Price Optimization Model

**Features:**
- Mock training data generation
- Epoch-based training
- Model testing/predictions
- Training results logging

**Dependencies:** Standalone scripts (no package.json)

**TODO Items:** No package.json - needs build infrastructure

---

### 9. rez-ml-feature-store

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ml-feature-store`

**Purpose:** Feature serving for ML models - serves user, merchant, transaction, and behavioral features

**Port:** 3005

**Status:** Built - TypeScript (Node 20+)

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/ready` | GET | Readiness check |
| `/api/features/*` | * | Feature CRUD operations |
| `/api/serve` | POST | Batch feature serving |
| `/api/stream` | POST | Streaming features (SSE) |

**Features:**
- Batch feature fetching
- Streaming endpoint (Server-Sent Events)
- Entity-based feature grouping
- MongoDB storage

**Dependencies:**
- mongoose: ^9.6.1
- express: ^4.18.3
- helmet: ^7.1.0
- cors, compression, morgan

**TODO Items:** None found

---

### 10. rez-intent-service

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-service`

**Purpose:** Signal-based intent capture with autonomous AI agents

**Port:** 4009

**Status:** Built - TypeScript

**API Routes:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signals/capture` | POST | Capture signal |
| `/api/signals/active/:userId` | GET | Active intents |
| `/api/signals/user/:userId` | GET | All user intents |
| `/api/signals/app/:userId/:appType` | GET | Intents by app |
| `/api/signals/similar/:userId` | GET | Similar intents |
| `/api/intents/*` | * | Intent routes |
| `/api/dormant/*` | * | Dormant intent routes |
| `/api/profiles/*` | * | Profile routes |
| `/api/nudges/*` | * | Nudge routes |
| `/api/agents/*` | * | Agent routes |

**Event Types:** search, view, wishlist, cart_add, hold, checkout_start, fulfilled, abandoned

**App Types:** hotel_ota, restaurant, retail, hotel_guest

**Dependencies:**
- bullmq: ^5.1.0 (job queue)
- ioredis: ^5.3.2
- mongoose: ^8.23.1
- zod: ^3.22.0
- winston

**Features:**
- AI agent orchestration
- Signal capture service
- Redis caching (BullMQ)

**TODO Items:** None found

---

### 11. rez-intent-graph

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph`

**Purpose:** Cross-app intent tracking, commerce memory, and autonomous AI agents (ReZ Mind)

**Port:** 3001 (API), 3005 (Agent)

**Status:** Built - TypeScript (Most advanced service)

**API Routes (API Server - Port 3001):**

*Intent Routes:*
| Endpoint | Description |
|----------|-------------|
| `/api/intent/capture` | Capture intent signal |
| `/api/intent/active/:userId` | Get active intents |
| `/api/intent/dormant/:userId` | Get dormant intents |
| `/api/intent/revive` | Trigger revival |
| `/api/intent/user/:userId` | All user intents |
| `/api/intent/stats` | Aggregate stats |

*Commerce Memory:*
| Endpoint | Description |
|----------|-------------|
| `/api/commerce-memory/user/:userId` | Full enriched context |
| `/api/commerce-memory/affinity/:userId` | Affinity profile |
| `/api/commerce-memory/sync/:userId` | Sync cross-app |
| `/api/commerce-memory/dashboard` | Summary stats |

*Merchant Demand:*
| Endpoint | Description |
|----------|-------------|
| `/api/merchant/:id/demand/dashboard` | Demand overview |
| `/api/merchant/:id/demand/signal` | Real-time signal |
| `/api/merchant/:id/procurement` | Procurement signals |
| `/api/merchant/:id/intents/top` | Top intents |
| `/api/merchant/:id/trends` | Demand trends |

*Webhooks:*
| Endpoint | Description |
|----------|-------------|
| `/webhooks/hotel/search` | Hotel search events |
| `/webhooks/hotel/hold` | Booking hold |
| `/webhooks/hotel/confirm` | Booking confirmed |
| `/webhooks/restaurant/view` | Restaurant views |
| `/webhooks/restaurant/add-to-cart` | Cart additions |
| `/webhooks/restaurant/order` | Orders placed |
| `/webhooks/nudge/*` | Nudge callbacks |
| `/webhooks/batch/capture` | Batch capture |

*Autonomous Mode (Agent Server - Port 3005):*
| Endpoint | Description |
|----------|-------------|
| `/api/autonomous/start` | Enable autonomy |
| `/api/autonomous/stop` | Disable autonomy |
| `/api/autonomous/action` | Execute action |
| `/api/autonomous/emergency-stop` | Emergency stop |
| `/api/autonomous/status` | Get status |

**8 Autonomous AI Agents:**
| Agent | Schedule | Purpose |
|-------|----------|---------|
| DemandSignalAgent | Every 5 min | Aggregate demand |
| ScarcityAgent | Every 1 min | Supply/demand ratios |
| PersonalizationAgent | Event-driven | User profiling |
| AttributionAgent | Event-driven | Multi-touch attribution |
| AdaptiveScoringAgent | Hourly | ML retraining |
| FeedbackLoopAgent | Event-driven | Drift detection |
| NetworkEffectAgent | Daily | Collaborative filtering |
| RevenueAttributionAgent | Every 15 min | GMV tracking |

**Database Models:**
- `Intent` - User intent records
- `DormantIntent` - Dormant purchase tracking
- `IntentSequence` - Event sequences
- `CrossAppIntentProfile` - Cross-app profiles
- `MerchantKnowledge` - Merchant knowledge base
- `Nudge` - Nudge delivery records
- `NudgeSchedule` - User preferences
- `MerchantDemandSignal` - Demand aggregation

**Services:**
- IntentCaptureService
- DormantIntentService
- CrossAppAggregationService
- MerchantKnowledgeService
- VectorSimilarityService
- IntentScoringService
- IntentCacheService
- InsightService
- StreamService

**WebSocket Channels:**
- intent:user:{userId}
- intent:merchant:{merchantId}
- intent:global
- agent:events
- nudge:user:{userId}
- commerce:memory:{userId}

**Dependencies:** Comprehensive TypeScript setup

**TODO Items:** None found

---

### 12. rez-training-data-service

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-training-data-service`

**Purpose:** Training data management

**Status:** Empty - Stub only (src directory is empty)

**Dependencies:**
- express: ^4.18.2
- mongoose: ^8.0.0
- ioredis: ^5.3.2
- winston: ^3.11.0
- zod: ^3.22.4

**TODO Items:** Needs implementation

---

### 13. rez-error-intelligence

**Path:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-error-intelligence`

**Purpose:** Central error knowledge base for entire ReZ ecosystem

**Status:** Built - Documentation & workflow system

**Error Format:** `[SERVICE][TYPE] Short description`

**Error Types:** BUILD, DEPLOY, RUNTIME, CI, SECURITY

**Error ID Format:** `ERR-{TYPE}-{NNN}`

**Workflow:**
1. Error occurs in any repo
2. Issue auto-created (GitHub Actions) or manual
3. Engineer investigates with root cause/fix/prevention
4. Fix PR created with `Fixes rez-error-intelligence#<number>`
5. Issue closed with resolution label
6. Documented in errors/ERRORS.json

**Prevention System:** CI rules, tests, validation, arch constraints, runbooks

**TODO Items:** None - documentation-based system

---

## JSON Structure

```json
{
  "audit_date": "2026-05-10",
  "total_services": 14,
  "services": [
    {
      "name": "rez-intent-predictor",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-predictor",
      "port": 4018,
      "status": "built",
      "language": "JavaScript",
      "purpose": "Real-time user intent prediction",
      "api_routes": [
        "POST /intent/score",
        "GET /intent/user/:id/profile",
        "POST /intent/optimize",
        "POST /intent/event",
        "GET /intent/session/:id",
        "POST /intent/batch-score"
      ],
      "database_models": ["UserIntentProfile", "SessionEvent"],
      "revenue_streams": ["Push notification optimization"],
      "dependencies": ["express", "mongoose", "cors", "dotenv", "uuid"],
      "intent_categories": ["ready_to_buy", "just_browsing", "research_mode", "deal_hunting", "loyalty_checking", "cart_abandonment_risk", "reactivation_needed", "high_value_opportunity"],
      "todo_items": []
    },
    {
      "name": "rez-intelligence-hub",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-intelligence-hub",
      "port": 4020,
      "status": "built",
      "language": "TypeScript",
      "purpose": "Unified user/merchant profiles + Voice AI",
      "api_routes": [
        "POST /profile/user",
        "GET /profile/user/:userId",
        "GET /profiles",
        "POST /api/voice/process",
        "POST /api/voice/text",
        "GET /api/agents/status"
      ],
      "database_models": ["UserProfile", "MerchantProfile"],
      "revenue_streams": ["Finance intelligence", "Voice AI services"],
      "dependencies": ["@rez/shared", "mongoose", "zod", "axios", "helmet"],
      "features": ["Voice AI (STT/TTS)", "Autonomous agents", "Swarm orchestrator"],
      "todo_items": []
    },
    {
      "name": "rez-lead-intelligence",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-lead-intelligence",
      "port": 4014,
      "status": "built",
      "language": "TypeScript",
      "purpose": "Hot/Warm/Cold lead detection",
      "api_routes": [
        "GET /api/v1/leads/:userId/score",
        "GET /api/v1/leads/hot",
        "GET /api/v1/leads/warm",
        "GET /api/v1/leads/cold",
        "POST /api/v1/carts",
        "GET /api/v1/channels/recommend"
      ],
      "database_models": ["LeadScore", "Multiple route models"],
      "revenue_streams": ["Marketing channel optimization", "WhatsApp/Push/Email campaigns"],
      "dependencies": ["@rez/shared", "@sentry/node", "mongoose", "ioredis", "swagger-jsdoc"],
      "cron_jobs": ["Hot leads: hourly", "Marketing sync: hourly", "Abandoned carts: every 4h"],
      "todo_items": ["JWT validation", "Service token validation"]
    },
    {
      "name": "rez-user-intelligence-service",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-user-intelligence-service",
      "port": 3016,
      "status": "built",
      "language": "TypeScript",
      "purpose": "User behavior tracking & recommendations",
      "api_routes": [
        "POST /user/event",
        "GET /user/:id/profile",
        "GET /user/:id/preferences",
        "GET /user/:id/recommendations",
        "GET /user/:id/push-tokens",
        "GET /user/:id/lifetime-value"
      ],
      "database_models": ["UserIntelligence", "UserProfile"],
      "revenue_streams": ["Personalization", "Push notifications"],
      "dependencies": ["@rez/shared", "@sentry/node", "mongoose", "amqplib", "ioredis"],
      "features": ["RabbitMQ integration", "Support integration"],
      "todo_items": []
    },
    {
      "name": "rez-insights-service",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-insights-service",
      "port": 3011,
      "status": "built",
      "language": "TypeScript",
      "purpose": "AI-powered insights management",
      "api_routes": [
        "POST /api/insights",
        "GET /api/insights/:id",
        "GET /api/insights/user/:userId",
        "GET /api/insights/merchant/:merchantId",
        "PATCH /api/insights/:id"
      ],
      "database_models": ["Insight"],
      "revenue_streams": ["Insight monetization"],
      "dependencies": ["@rez/shared", "@sentry/node", "mongoose", "ioredis", "winston"],
      "todo_items": []
    },
    {
      "name": "rez-merchant-intelligence-service",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-intelligence-service",
      "port": 3015,
      "status": "built",
      "language": "TypeScript",
      "purpose": "Merchant analytics & recommendations",
      "api_routes": [
        "POST /merchant/profile",
        "GET /merchant/:id/profile",
        "GET /merchant/:id/insights",
        "GET /merchant/:id/recommendations",
        "GET /merchant/:id/competitors",
        "GET /merchant/:id/health-score"
      ],
      "database_models": ["MerchantProfile", "MerchantEvent", "MerchantScore"],
      "revenue_streams": ["Merchant subscriptions", "Analytics as a service"],
      "dependencies": ["@rez/shared", "@sentry/node", "mongoose", "ioredis", "amqplib"],
      "todo_items": []
    },
    {
      "name": "rez-ml-model-registry",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-ml-model-registry",
      "port": 3001,
      "status": "built",
      "language": "TypeScript",
      "purpose": "ML model versioning & management",
      "api_routes": [
        "POST /api/v1/models",
        "GET /api/v1/models",
        "GET /api/v1/models/stats",
        "POST /api/v1/models/:namespace/:name/versions",
        "GET /api/v1/models/:namespace/:name/versions",
        "POST /api/v1/models/:namespace/:name/versions/:version/transition"
      ],
      "database_models": ["MLModel", "ModelVersion"],
      "revenue_streams": ["ML infrastructure services"],
      "dependencies": ["mongoose", "joi", "uuid"],
      "model_stages": ["development", "staging", "production", "archived"],
      "version_stages": ["pending", "validated", "staged", "production", "archived"],
      "todo_items": []
    },
    {
      "name": "rez-ml-engine",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-ml-engine",
      "port": null,
      "status": "partial",
      "language": "JavaScript",
      "purpose": "ML model training pipeline",
      "training_models": ["FraudModel", "RecommendationModel", "PriceModel"],
      "revenue_streams": ["Fraud prevention", "Price optimization"],
      "dependencies": [],
      "todo_items": ["Needs build infrastructure"]
    },
    {
      "name": "rez-ml-feature-store",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-ml-feature-store",
      "port": 3005,
      "status": "built",
      "language": "TypeScript",
      "purpose": "Feature serving for ML",
      "api_routes": [
        "GET /health",
        "GET /ready",
        "POST /api/serve",
        "POST /api/stream",
        "GET /api/features/*"
      ],
      "database_models": ["Feature"],
      "revenue_streams": ["ML infrastructure"],
      "dependencies": ["mongoose", "express", "helmet"],
      "features": ["Batch serving", "Streaming (SSE)"],
      "todo_items": []
    },
    {
      "name": "rez-intent-service",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-service",
      "port": 4009,
      "status": "built",
      "language": "TypeScript",
      "purpose": "Intent signal capture & AI agents",
      "api_routes": [
        "POST /api/signals/capture",
        "GET /api/signals/active/:userId",
        "GET /api/signals/user/:userId",
        "GET /api/signals/similar/:userId",
        "GET /api/intents/*",
        "GET /api/nudges/*"
      ],
      "database_models": ["Signal", "Intent", "Nudge"],
      "revenue_streams": ["Intent-driven marketing"],
      "dependencies": ["mongoose", "bullmq", "ioredis", "zod"],
      "features": ["BullMQ job queue", "Signal-based capture"],
      "todo_items": []
    },
    {
      "name": "rez-intent-graph",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph",
      "port": "3001 (API), 3005 (Agent)",
      "status": "built",
      "language": "TypeScript",
      "purpose": "Cross-app intent tracking & AI agents (ReZ Mind)",
      "api_routes": [
        "POST /api/intent/capture",
        "GET /api/intent/active/:userId",
        "GET /api/intent/dormant/:userId",
        "GET /api/commerce-memory/user/:userId",
        "POST /api/autonomous/start",
        "POST /webhooks/*"
      ],
      "database_models": ["Intent", "DormantIntent", "IntentSequence", "CrossAppIntentProfile", "MerchantKnowledge", "Nudge", "MerchantDemandSignal"],
      "revenue_streams": ["Cross-app monetization", "Autonomous services"],
      "dependencies": ["Comprehensive TypeScript setup"],
      "features": ["8 Autonomous AI Agents", "WebSocket support", "Commerce Memory", "Vector Search"],
      "ai_agents": [
        "DemandSignalAgent (5min)",
        "ScarcityAgent (1min)",
        "PersonalizationAgent (event)",
        "AttributionAgent (event)",
        "AdaptiveScoringAgent (hourly)",
        "FeedbackLoopAgent (event)",
        "NetworkEffectAgent (daily)",
        "RevenueAttributionAgent (15min)"
      ],
      "todo_items": []
    },
    {
      "name": "rez-training-data-service",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-training-data-service",
      "port": null,
      "status": "stub",
      "language": "TypeScript",
      "purpose": "Training data management",
      "api_routes": [],
      "database_models": [],
      "revenue_streams": [],
      "dependencies": ["express", "mongoose", "ioredis", "winston", "zod"],
      "todo_items": ["Needs full implementation"]
    },
    {
      "name": "rez-error-intelligence",
      "path": "/Users/rejaulkarim/Documents/ReZ Full App/rez-error-intelligence",
      "port": null,
      "status": "built",
      "language": null,
      "purpose": "Central error tracking & prevention",
      "features": ["GitHub Issues workflow", "Prevention system", "Analytics"],
      "error_format": "[SERVICE][TYPE] Short description",
      "error_types": ["BUILD", "DEPLOY", "RUNTIME", "CI", "SECURITY"],
      "todo_items": []
    }
  ],
  "summary": {
    "built_services": 11,
    "partial_services": 1,
    "stub_services": 1,
    "total_ports_used": [3001, 3005, 3011, 3015, 3016, 4009, 4014, 4018, 4020],
    "common_dependencies": ["mongoose", "express", "@rez/shared", "ioredis", "winston", "zod"],
    "common_databases": ["MongoDB", "Redis"],
    "ai_ml_frameworks": ["BullMQ", "TensorFlow-like training", "Vector search"]
  }
}
```

---

## Port Allocation Summary

| Port | Service | Purpose |
|------|---------|---------|
| 3001 | rez-intent-graph, rez-ml-model-registry | Intent graph API, ML registry |
| 3005 | rez-intent-graph (Agent), rez-ml-feature-store | Agent swarm, Feature serving |
| 3011 | rez-insights-service | AI insights |
| 3015 | rez-merchant-intelligence-service | Merchant analytics |
| 3016 | rez-user-intelligence-service | User intelligence |
| 4009 | rez-intent-service | Signal capture |
| 4014 | rez-lead-intelligence | Lead scoring |
| 4018 | rez-intent-predictor | Intent prediction |
| 4020 | rez-intelligence-hub | Unified intelligence + Voice AI |

---

## Recommendations

1. **Consolidation Opportunities:**
   - rez-intent-predictor and rez-intent-service overlap in intent functionality
   - rez-user-intelligence-service and rez-intelligence-hub share user profile features

2. **Missing Infrastructure:**
   - rez-training-data-service needs implementation
   - rez-ml-engine needs proper build system

3. **Port Conflicts:**
   - Port 3001 used by both rez-intent-graph and rez-ml-model-registry
   - Port 3005 used by both rez-intent-graph (Agent) and rez-ml-feature-store

4. **TODO Items to Address:**
   - Lead intelligence: JWT and service token validation
   - Training data service: Full implementation needed

5. **Security Concerns:**
   - MongoDB connection strings hardcoded in some services
   - Need consistent authentication/authorization across services
