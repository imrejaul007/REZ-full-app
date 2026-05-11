# REZ Backend Architecture Report

**Version:** 1.0.0
**Date:** 2026-05-04
**Author:** Backend Architecture Lead
**Status:** Initial Audit Complete

---

## Executive Summary

The REZ ecosystem comprises **70+ microservices** with a mix of synchronous HTTP communication, Redis-based async job queues (BullMQ), and event-driven patterns. The architecture follows a **modular monolith with gateway-controlled service routing**, using MongoDB as the primary datastore with a 3-node replica set for high availability.

### Key Findings

| Category | Status | Risk Level |
|----------|--------|------------|
| API Gateway Design | Needs Improvement | Medium |
| Service Communication | Hybrid (Sync + Async) | Medium |
| Database Architecture | Shared MongoDB (anti-pattern) | High |
| Shared Packages | Good centralization | Low |
| Observability | Partial | Medium |
| Security | Core infrastructure solid | Low |

---

## 1. Current Architecture Overview

### 1.1 Service Inventory (70 Services)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL CLIENTS                                    │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│     │ rez-app-    │  │ rez-app-    │  │ REZ-admin   │  │ rez-web-menu    │ │
│     │ consumer    │  │ merchant    │  │ dashboard    │  │ (POS)           │ │
│     └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
└─────────────┼────────────────┼────────────────┼─────────────────┼──────────┘
              │                │                │                 │
              └────────────────┴────────────────┴─────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                   │
│  ┌──────────────────────┐         ┌────────────────────────────────────────┐│
│  │   api-gateway (3000) │         │    rez-api-gateway (3001)             ││
│  │   - Express + nginx  │         │    - Circuit breakers                 ││
│  │   - Basic routing    │         │    - Feature flags                    ││
│  └──────────────────────┘         │    - Service proxying                 ││
│                                   └────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────────────────┐
│  CORE SERVICES  │   │   INTELLIGENCE     │   │     SUPPORT SERVICES        │
├─────────────────┤   │      SERVICES       │   ├─────────────────────────────┤
│ rez-auth        │   │ rez-intent-service  │   │ rez-notification-events     │
│ rez-payment     │   │ rez-intelligence-hub│   │ rez-push-service            │
│ rez-wallet      │   │ rez-profile-service  │   │ rez-search-service          │
│ rez-order       │   │ rez-intent-predictor │   │ rez-scheduler-service       │
│ rez-merchant    │   │ rez-decision-service │   │ rez-socket-service          │
│ rez-finance     │   │ rez-targeting-engine │   │ rez-marketing-service       │
│ rez-catalog     │   │ rez-personalization  │   │ rez-feedback-service        │
│ rez-profile     │   │ rez-recommendation   │   │ rez-gamification-service    │
└─────────────────┘   │ rez-action-engine    │   │ rez-corporate-service      │
                     │ rez-user-intelligence │   │ rez-automation-service     │
                     └─────────────────────┘   │ rez-corpperks-service       │
                                               └─────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  MongoDB RS     │  │  Redis Cluster  │  │   External Services        │ │
│  │  (3-node)       │  │  (BullMQ)       │  │   - Razorpay               │ │
│  │  Port: 27017    │  │  Port: 6379     │  │   - SendGrid/Resend        │ │
│  └─────────────────┘  └─────────────────┘  │   - Makcorps API            │ │
│                                            └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Service Port Map

| Service | Default Port | Purpose |
|---------|--------------|---------|
| api-gateway | 3000 | Legacy API gateway |
| rez-api-gateway | 3001 | New gateway with circuit breakers |
| rez-auth-service | 4002 | Authentication & Identity |
| rez-payment-service | 4001 | Payment processing (Razorpay) |
| rez-wallet-service | 4004 | Digital wallet & balances |
| rez-order-service | 4012 | Order management |
| rez-merchant-service | 4005 | Merchant operations |
| rez-catalog-service | 4003 | Product catalog |
| rez-search-service | 4003 | Search functionality |
| rez-ads-service | 4007 | Advertisement platform |
| rez-intelligence-hub | 4020 | User/Merchant profiles |
| rez-intent-service | 4009 | Intent capture |
| rez-corpperks-service | 4013 | Corporate perks |
| rez-hotel-service | 4015 | Hotel bookings |
| rez-travel-service | 4007 | Travel services |
| rez-feedback-service | - | Feedback collection |
| rez-gamification-service | 3004 | Loyalty & gamification |
| rez-action-engine | 4009 | Automated actions |
| rez-feature-flags | 4030 | Feature toggles |
| rez-knowledge-base-service | 4005 | KB management |
| rez-marketing-service | 4000 | Marketing campaigns |

---

## 2. Service Communication Patterns

### 2.1 Synchronous Communication (HTTP)

**Primary Pattern:** Direct HTTP calls between services

```typescript
// Pattern used across services
const response = await fetch(`${WALLET_SERVICE_URL}/internal/credit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Issues Identified:**
- No standardized HTTP client (raw `fetch` scattered across codebase)
- No retry policies for transient failures
- Timeout configurations inconsistent
- No dead letter queue for failed requests

### 2.2 Asynchronous Communication (BullMQ)

**Pattern:** Redis-backed job queues via `@rez/shared` JobQueue

```typescript
// Standard async job queue
import { JobQueue, JobQueueService } from '@rez/shared/queue';

const emailQueue = new JobQueue('send-email', redis);
await emailQueue.add({ type: 'send-email', to: 'user@example.com' });
```

**Pre-configured Queues:**
| Queue Name | Concurrency | Retention | Use Case |
|------------|-------------|-----------|----------|
| send-email | 2 | 24h | Transactional emails |
| send-sms | 5 | 24h | SMS notifications |
| send-push | 10 | 24h | Push notifications |
| send-webhook | 5 | 24h | External webhooks |
| process-order | 2 | 7d | Order processing |

### 2.3 Event-Driven Architecture

**Event Platform:** `rez-event-platform` (port 4008)
- Central event bus using BullMQ
- Schema validation with Zod
- Event publishing/consumption

**Data Contracts Defined:**
- `InventoryLowEvent`
- `OrderCompletedEvent`
- `InventoryDecision`
- `FeedbackEvent`

---

## 3. API Gateway Analysis

### 3.1 Current Implementation

**Gateway: `rez-api-gateway` (Port 3001)**

```typescript
// Service URLs configured
const SERVICE_URLS = {
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4008',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:4012',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:4003',
  hotel: process.env.HOTEL_SERVICE_URL || 'http://localhost:4004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:4014',
};
```

**Features Implemented:**
- Circuit breaker pattern with configurable thresholds
- Rate limiting middleware
- Security headers (Helmet)
- CORS configuration
- Request logging
- Admin endpoints for circuit management

### 3.2 Issues Found

| Issue | Severity | Description |
|-------|----------|-------------|
| No request validation gateway | Medium | Input validation scattered to services |
| Missing API versioning | Medium | Routes not versioned (`/api/v1/*`) |
| No API documentation gateway | Low | Swagger/OpenAPI not aggregated |
| Rate limit per-IP only | Medium | No per-user or per-service limits |
| No response caching | Low | Cache-Control headers not used |

---

## 4. Shared Infrastructure

### 4.1 @rez/shared Package

**Location:** `/packages/rez-shared`

**Exports:**
```typescript
export * from './types';      // Type definitions
export * from './schemas';    // Zod validation schemas
export * from './middleware'; // Express middleware
export * from './queue';      // BullMQ job queues
export * from './webhook';    // Webhook utilities
```

**Quality:** Well-architected, consistent across services

### 4.2 shared-types Package

**Location:** `/packages/shared-types` (130 subdirectories)

**Coverage:**
- API types
- Enums
- Branded types (OrderId, UserId, etc.)
- FSM state transitions

### 4.3 Shared Packages Inventory

```
packages/
├── rez-shared/           # Core utilities
├── shared-types/         # 130+ type definitions
├── rez-ui/               # Design system
├── rez-agent-memory/     # AI memory
├── rez-ai-types/         # AI type definitions
├── rez-api-sdk/          # API client
├── rez-auth/             # Auth utilities
├── rez-brand-tokens/      # Design tokens
├── rez-chat-ai/          # Chat integration
├── rez-loyalty-client/   # Loyalty system client
├── rez-merchant-sdk/     # Merchant API SDK
├── rez-metrics/          # Metrics utilities
├── rez-qr-sdk/          # QR code generation
├── rez-service-core/     # Service base classes
├── rez-socket-client/    # WebSocket client
└── eslint-plugin-rez/    # Custom ESLint rules
```

---

## 5. Database Architecture

### 5.1 Current Setup

**MongoDB Replica Set:**
```
Primary:   mongodb://mongodb-primary:27017      (Priority: 2)
Secondary: mongodb://mongodb-secondary-1:27017  (Priority: 1)
Secondary: mongodb://mongodb-secondary-2:27019   (Hidden, Priority: 1)
```

**Redis:**
- Single instance with authentication
- Used for: BullMQ queues, rate limiting, session cache

### 5.2 Data Ownership Issues (CRITICAL)

**Anti-pattern Found:** Multiple services share the same MongoDB database

```
Services using shared database patterns:
├── rez-auth-service        → mongodb://.../rez-auth
├── rez-payment-service     → mongodb://.../rez-payments
├── rez-wallet-service      → mongodb://.../rez-wallet
├── rez-order-service       → mongodb://.../rez-orders
├── rez-merchant-service    → mongodb://.../rez-merchants
├── rez-catalog-service     → mongodb://.../rez-catalog
└── rez-finance-service    → mongodb://.../rez-finance
```

**Issues:**
1. **Tight coupling:** Services can query each other's collections
2. **No clear ownership:** Which service owns which collection?
3. **Schema drift:** Each service may evolve schemas independently
4. **Migration complexity:** Cross-service migrations required

### 5.3 Recommended Data Isolation

```
Database Strategy:
├── rez-auth-db      → rez-auth-service (Users, Sessions, Devices)
├── rez-payment-db    → rez-payment-service (Transactions, Refunds)
├── rez-wallet-db     → rez-wallet-service (Balances, Ledger)
├── rez-order-db      → rez-order-service (Orders, LineItems)
├── rez-merchant-db   → rez-merchant-service (Merchants, Locations)
├── rez-catalog-db    → rez-catalog-service (Products, Categories)
└── rez-intent-db    → rez-intent-service (Intents, Signals)
```

---

## 6. Service Dependency Graph

```
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │   (rez-gw)      │
                                    └────────┬────────┘
                                             │
           ┌─────────────────────────────────┼─────────────────────────────────┐
           │                                 │                                 │
           ▼                                 ▼                                 ▼
    ┌─────────────┐                  ┌─────────────┐                  ┌─────────────┐
    │    Auth     │                  │   Wallet    │                  │   Payment   │
    │  Service    │◄─────────────────►│  Service    │◄────────────────►│  Service    │
    └──────┬──────┘                  └──────┬──────┘                  └──────┬──────┘
           │                                  │                                  │
           │         ┌────────────────────────┴────────────────────────┐        │
           │         │                                                 │        │
           ▼         ▼                                                 ▼        │
    ┌─────────────┐  ┌─────────────┐                            ┌─────────────┐
    │   Order     │  │   Finance   │                            │  Merchant   │
    │  Service    │  │  Service    │                            │  Service    │
    └──────┬──────┘  └─────────────┘                            └──────┬──────┘
           │                                                                 │
           └─────────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │   Catalog /     │
                                    │   Search        │
                                    └─────────────────┘

    ════════════════════════════════════════════════════════════════════════════
                              INTELLIGENCE LAYER (READ-MOSTLY)
    ════════════════════════════════════════════════════════════════════════════

           ┌────────────────────────────────────────────────────────────────────┐
           │                     Intelligence Hub                                │
           │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
           │  │   Intent     │  │  Personal-   │  │    Recommendation      │   │
           │  │   Service    │  │  ization     │  │      Engine           │   │
           │  └──────────────┘  └──────────────┘  └────────────────────────┘   │
           │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
           │  │   Decision   │  │  Targeting   │  │    Action Engine      │   │
           │  │   Service    │  │   Engine     │  │                       │   │
           │  └──────────────┘  └──────────────┘  └────────────────────────┘   │
           └────────────────────────────────────────────────────────────────────┘
```

---

## 7. Identified Architectural Issues

### 7.1 Critical Issues

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| C1 | **Shared MongoDB databases** | Data coupling, migration complexity | Split into per-service databases |
| C2 | **No API versioning strategy** | Breaking changes affect all clients | Implement `/api/v1/`, `/api/v2/` routing |
| C3 | **Raw fetch for HTTP calls** | Inconsistent retry/timeout behavior | Standardize on HTTP client with interceptors |
| C4 | **No service mesh** | No mTLS, limited observability | Consider Consul/Envoy service mesh |

### 7.2 High Priority Issues

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| H1 | **Inconsistent health checks** | Deployment orchestration fragile | Standardize `/health` with dependency checks |
| H2 | **No circuit breaker on all services** | Cascade failures possible | Extend circuit breaker to all gateway routes |
| H3 | **Feature flags in multiple places** | Difficult to manage | Consolidate to `rez-feature-flags` service |
| H4 | **No centralized logging format** | Debug difficulty | Enforce structured logging schema |

### 7.3 Medium Priority Issues

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| M1 | **No request/response logging** | Audit trail incomplete | Add correlation IDs to all logs |
| M2 | **Rate limiting per-IP only** | DOS vulnerability | Add user-level rate limits |
| M3 | **No API documentation aggregation** | Developer experience poor | Add unified Swagger UI |
| M4 | **Duplicate enum definitions** | Maintenance burden | Migrate all to `@rez/shared-types` |

---

## 8. Recommendations

### 8.1 Phase 1: Stabilization (0-3 months)

1. **Implement API Versioning**
   ```typescript
   // Gateway routes
   app.use('/api/v1', v1Routes);
   app.use('/api/v2', v2Routes);

   // Deprecation headers
   res.setHeader('API-Deprecation', '2026-12-31');
   res.setHeader('API-Sunset', '2027-03-31');
   ```

2. **Standardize HTTP Client**
   ```typescript
   // packages/rez-shared/src/http/client.ts
   export class RezHttpClient {
     constructor(private baseUrl: string, private options: ClientOptions) {}

     async get<T>(path: string): Promise<T> {
       return this.request<T>({ method: 'GET', path });
     }

     async post<T>(path: string, data: unknown): Promise<T> {
       return this.request<T>({ method: 'POST', path, body: data });
     }
   }
   ```

3. **Add comprehensive health checks**
   ```typescript
   app.get('/health', async (req, res) => {
     const checks = await Promise.allSettled([
       checkMongo(),
       checkRedis(),
       checkService('payment'),
       checkService('wallet')
     ]);

     res.json({
       status: allHealthy ? 'healthy' : 'degraded',
       checks: checks.map(toResult),
       timestamp: new Date().toISOString()
     });
   });
   ```

### 8.2 Phase 2: Structural Improvements (3-6 months)

1. **Database Per Service**
   - Migrate to dedicated MongoDB databases
   - Update connection strings in each service
   - Implement read replicas for analytics

2. **Service Mesh Introduction**
   - Deploy Consul for service discovery
   - Implement mTLS between services
   - Add distributed tracing (OpenTelemetry)

3. **Event Sourcing for Critical Domains**
   - Wallet ledger (immutable transaction log)
   - Order state changes
   - Payment state machine

### 8.3 Phase 3: Advanced Patterns (6-12 months)

1. **CQRS for Analytics**
   - Separate read models for reporting
   - Event replay capabilities
   - Real-time materialized views

2. **GraphQL Federation**
   - Single GraphQL endpoint
   - Per-service schema federation
   - Schema stitching for legacy services

3. **Multi-Region Deployment**
   - Primary region: Mumbai (IN)
   - Secondary region: Singapore (SG)
   - Read replicas for global latency

---

## 9. Migration Plan

### 9.1 Database Migration Strategy

```typescript
// Phase 1: Shadow write (Month 1-2)
// Write to both old and new database
async function createOrder(data: OrderData) {
  const order = await createInOldDb(data);
  await createInNewDb(data); // New service DB
  return order;
}

// Phase 2: Read from new (Month 2-3)
// Read from new, backfill from old for misses
async function getOrder(id: string) {
  return await getFromNewDb(id) || await getFromOldDb(id);
}

// Phase 3: Cutover (Month 3)
// Point all reads/writes to new DB
// Archive old data after 90 days
```

### 9.2 Service Cutover Strategy

```bash
# 1. Deploy parallel service
docker-compose up -d rez-order-service-v2

# 2. Route 10% traffic via feature flag
curl -X POST http://gateway/admin/feature-flags/order-v2 \
  -d '{"enabled": true, "percentage": 10}'

# 3. Monitor error rates
watch curl http://gateway/admin/metrics

# 4. Gradual rollout
10% → 25% → 50% → 75% → 100%

# 5. Decommission old service
docker-compose stop rez-order-service
```

---

## 10. Observability Standards

### 10.1 Structured Logging Format

```typescript
interface LogEntry {
  timestamp: string;           // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;            // Service name
  correlationId: string;      // Request trace ID
  userId?: string;            // User performing action
  action: string;             // What happened
  duration?: number;          // Operation duration (ms)
  status?: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}
```

### 10.2 Required Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `queue_jobs_total` | Counter | Jobs processed |
| `queue_job_duration_seconds` | Histogram | Job processing time |
| `db_connections_active` | Gauge | Active DB connections |
| `circuit_breaker_state` | Gauge | Circuit state (0=closed, 1=open) |

### 10.3 Alert Thresholds

| Alert | Threshold | Severity |
|-------|-----------|----------|
| High Error Rate | >5% errors in 5 min | PagerDuty |
| High Latency | p99 > 2s | Slack |
| Circuit Open | Any circuit open | PagerDuty |
| Queue Depth | >1000 pending jobs | Slack |

---

## 11. Security Posture

### 11.1 Current Implementation

| Control | Status | Implementation |
|---------|--------|----------------|
| TLS Termination | Done | API Gateway (nginx/Express) |
| Rate Limiting | Partial | Per-IP only |
| Input Validation | Partial | Zod schemas in services |
| SQL/NoSQL Injection | Protected | `express-mongo-sanitize` |
| XSS | Protected | Helmet CSP headers |
| CORS | Configured | Per-service allowed origins |

### 11.2 Security Gaps

| Gap | Risk | Remediation |
|-----|------|-------------|
| No mTLS between services | Medium | Service mesh (Consul/Envoy) |
| Secrets in env vars | High | HashiCorp Vault |
| No API key rotation | Medium | Automated rotation |
| No request signing | Medium | HMAC signatures |

---

## 12. Performance Baselines

### 12.1 Latency Targets (p99)

| Endpoint Type | Target | Current Est. |
|---------------|--------|--------------|
| Simple read | <100ms | ~200ms |
| Simple write | <200ms | ~400ms |
| Complex query | <500ms | ~1000ms |
| External API | <2000ms | ~3000ms |

### 12.2 Throughput Targets

| Metric | Target |
|--------|--------|
| Requests/second (gateway) | 1,000 |
| Jobs/second (queue) | 500 |
| DB connections per service | <50 |

---

## 13. Appendices

### A. Service Inventory Full List

```
rez-action-engine/
rez-ad-copilot/
rez-ad-platform/
rez-admin-service/
rez-admin-training-panel/
rez-ads-service/
rez-api-gateway/
rez-app-admin/
rez-app-consumer/
rez-app-merchant/
rez-auth-service/
rez-automation-service/
rez-catalog-service/
rez-consumer-copilot/
rez-contracts/
rez-copilot/
rez-corporate-service/
rez-corpperks-service/
rez-decision-service/
rez-devops-config/
rez-economic-engine/
rez-error-intelligence/
rez-event-platform/
rez-feature-flags/
rez-feedback-service/
rez-finance-service/
rez-first-loop/
rez-gamification-service/
rez-hotel-service/
rez-insights-service/
rez-intelligence-hub/
rez-intent-graph/
rez-intent-predictor/
rez-intent-service/
rez-karma-app/
rez-karma-mobile/
rez-karma-service/
rez-knowledge-base-service/
rez-marketing-service/
rez-media-events/
rez-merchant-copilot/
rez-merchant-integrations/
rez-merchant-intelligence-service/
rez-merchant-service/
rez-notification-events/
rez-now/
rez-observability/
rez-ops-dashboard/
rez-order-service/
rez-payment-service/
rez-personalization-engine/
rez-procurement-service/
rez-profile-service/
rez-push-service/
rez-recommendation-engine/
rez-ride/
rez-scheduler-service/
rez-search-service/
rez-shared/
rez-socket-service/
rez-stayown-service/
rez-targeting-engine/
rez-travel-service/
rez-try/
rez-unified-chat/
rez-user-intelligence-service/
rez-wallet-service/
rez-web-menu/
```

### B. Shared Package Dependencies

```json
{
  "@rez/shared": {
    "exports": ["./", "./types", "./schemas", "./middleware", "./queue", "./webhook"]
  },
  "@rez/shared-types": {
    "exports": ["./", "./enums", "./schemas", "./api", "./branded"]
  }
}
```

### C. Environment Variables Required

```bash
# Core Services
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004
ORDER_SERVICE_URL=http://localhost:4012
MERCHANT_SERVICE_URL=http://localhost:4005

# Databases
MONGODB_URI=mongodb://localhost:27017
REDIS_PASSWORD=changeme

# External APIs
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
SENDGRID_API_KEY=your_sendgrid_key

# Feature Flags
USE_NEW_INTENT_SERVICE=false
USE_NEW_COPILOT=false
```

---

**Report Generated:** 2026-05-04
**Next Review:** 2026-06-04
**Owner:** Backend Architecture Lead
