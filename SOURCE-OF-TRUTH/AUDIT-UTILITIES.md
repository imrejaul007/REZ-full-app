# Utilities Services Audit

**Audit Date:** 2026-05-05
**Audited Services:** rez-automation-service, rez-scheduler-service, rez-insights-service

---

## 1. rez-automation-service

### Service Information
| Property | Value |
|----------|-------|
| **Name** | rez-automation-service |
| **Version** | 1.0.0 |
| **Port** | 3001 |
| **Node** | >=18.0.0 |
| **Description** | Automation rule engine service for ReZ platform |

### Features

1. **Rule Engine**
   - Event-driven rule processing
   - Condition evaluation (eq, ne, gt, gte, lt, lte, in, nin, contains, exists)
   - Nested AND/OR condition logic
   - Priority-based rule execution

2. **Trigger Service**
   - Redis pub/sub event subscription
   - 21 predefined event types across 6 categories:
     - Order events (created, completed, cancelled, refunded)
     - Payment events (success, failed, pending)
     - Customer events (created, updated, inactive, churned)
     - Inventory events (low, updated, out_of_stock)
     - Reservation events (created, confirmed, cancelled, no_show)
     - Occupancy events (high, low, normal)
   - Local event fallback when Redis unavailable

3. **Rule Worker**
   - Background job processing
   - Scheduled task execution (cron-based)
   - Rule cache refresh (1-minute interval)
   - Queue processor with configurable interval

4. **Action Executor**
   - 7 action types: send_offer, create_po, update_price, notify, webhook, email, sms
   - Webhook support with configurable timeout
   - Message template interpolation

5. **Pre-seeded Rules**
   - Customer rules (6 rules): churn prevention, welcome, VIP alerts, birthday
   - Inventory rules (6 rules): low stock alerts, out-of-stock, expiry warnings
   - Pricing rules (6 rules): dynamic pricing, happy hour, weekend premium
   - Loyalty rules (8 rules): post-order followup, rewards, referral

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Sources                            │
│  (Orders, Payments, Customers, Inventory, Reservations)    │
└─────────────────────┬───────────────────────────────────────┘
                      │ publish
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  TriggerService                            │
│  - Redis pub/sub subscription                             │
│  - Event history (max 1000 per type)                     │
│  - Local fallback events                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ process
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   RuleEngine                               │
│  - Find matching rules by event type                      │
│  - Evaluate trigger conditions                            │
│  - Sort by priority                                       │
│  - Execute with concurrency limit                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ execute
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                ActionExecutor                              │
│  - send_offer, create_po, update_price                   │
│  - notify, webhook, email, sms                            │
└─────────────────────────────────────────────────────────────┘
```

### Architecture

| Component | Technology |
|-----------|------------|
| HTTP Server | Express.js |
| Database | MongoDB (Mongoose) |
| Cache/Events | Redis (IORedis) |
| Scheduler | node-cron |
| Error Tracking | Sentry |
| Logging | Winston |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Service health check |
| GET | /api/rules | List all rules with filtering |
| GET | /api/rules/stats | Get rule execution statistics |
| GET | /api/rules/:id | Get single rule |
| POST | /api/rules | Create new rule |
| PUT | /api/rules/:id | Update rule |
| DELETE | /api/rules/:id | Delete rule |
| POST | /api/rules/:id/execute | Manual trigger |
| POST | /api/rules/:id/toggle | Enable/disable |
| POST | /api/events | Trigger event |
| GET | /api/events | List supported events |
| GET | /api/events/history | Event history |
| GET | /api/logs | Execution logs |
| GET | /api/logs/stats | Log statistics |

### Issues

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| AUTO-01 | Medium | CORS allows `origin: '*'` (all origins) | Open |
| AUTO-02 | Low | Event history stored in-memory only (lost on restart) | Open |
| AUTO-03 | Low | Action handlers are simulated (no real integrations) | Open |
| AUTO-04 | Low | No rate limiting on API endpoints | Open |
| AUTO-05 | Medium | No authentication on API routes | Open |

---

## 2. rez-scheduler-service

### Service Information
| Property | Value |
|----------|-------|
| **Name** | rez-scheduler-service |
| **Port** | 3012 |
| **Health Port** | 3112 |
| **Node** | >=20.0.0 |
| **Description** | Centralized job scheduling service using BullMQ |

### Features

1. **Job Scheduling**
   - 19 predefined cron jobs across 5 categories:
     - **Settlement & Finance (3):** settlement-reconciliation, payout-processing, invoice-generation
     - **User & Engagement (6):** credit-score-refresh, profile-refresh, bnpl-overdue-processing, loyalty-points-expiry, campaign-expiry, abandoned-cart-reminder
     - **Cleanup & Maintenance (4):** expired-otp-cleanup, session-cleanup, temp-file-cleanup, audit-log-archival
     - **Merchant (3):** merchant-analytics-rollup, subscription-renewal-check, mandate-status-sync
     - **Notifications (3):** coin-expiry-alerts, digest-email, push-notification-batch

2. **BullMQ Integration**
   - Per-job queues with exponential backoff
   - Worker concurrency control
   - Job timeout enforcement (30s lock duration)
   - Stalled job detection and recovery

3. **Dead Letter Queue (DLQ)**
   - Per-job DLQ implementation (SCH-03)
   - Full failure context preserved for diagnosis
   - DLQ depth monitoring via admin routes

4. **Distributed Locking**
   - Redis-based distributed locks (5-minute TTL)
   - Prevents duplicate job execution across pods
   - Cryptographically secure lock values (crypto.randomBytes)

5. **Job Logging & Monitoring**
   - MongoDB-based job execution logs (90-day TTL)
   - ScheduleConfig for runtime job configuration
   - Health endpoints with queue depth reporting

6. **Security**
   - JWT authentication for admin routes
   - HMAC-based internal service token verification
   - Internal service auth header: `x-internal-token`

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Startup                                  │
│  - Validate env vars (MONGODB_URI, REDIS_URL, JWT_SECRET) │
│  - Connect to MongoDB and Redis                            │
│  - Register all BullMQ queues                              │
│  - Register all workers                                    │
│  - Schedule all cron jobs from DB config                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CronTrigger (BullMQ Scheduler)                │
│  - Jobs scheduled via upsertJobScheduler                   │
│  - Runtime overrides from ScheduleConfig collection         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    WorkerPool                              │
│  - One worker per job type                                │
│  - Distributed lock acquisition                            │
│  - Job logging to MongoDB                                  │
│  - Retry with exponential backoff                          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ Success                       │ Failure (exhausted retries)
              ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Complete Job Log Entry      │  │ MoveToDLQ                   │
│ Update ScheduleConfig      │  │ Sentry Alert                │
└─────────────────────────────┘  └─────────────────────────────┘
```

### Architecture

| Component | Technology |
|-----------|------------|
| HTTP Server | Express.js |
| Job Queue | BullMQ |
| Database | MongoDB (Mongoose) |
| Cache/Locks | Redis (IORedis) |
| Error Tracking | Sentry |
| Logging | Winston |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/scheduler/jobs | JWT/Token | List all jobs with status |
| GET | /api/scheduler/jobs/:name/logs | JWT/Token | Job execution logs |
| POST | /api/scheduler/jobs/:name/trigger | JWT/Token | Manual trigger |
| PUT | /api/scheduler/jobs/:name/config | JWT/Token | Update job config |
| GET | /api/scheduler/health | JWT/Token | Detailed health check |
| GET | /health/live | None | Liveness probe |
| GET | /health/ready | None | Readiness probe |
| GET | /health/detailed | None | Detailed status |
| GET | /health/dlq | None | DLQ statistics |

### Issues

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| SCH-01 | Low | DLQ monitor hardcoded queue list | Open |
| SCH-02 | Medium | No job timeout enforcement (config mismatch) | Fixed |
| SCH-03 | Medium | DLQ not implemented (newly added) | Fixed |
| SCH-04 | Medium | Lock acquisition not creating audit trail | Fixed |

---

## 3. rez-insights-service

### Service Information
| Property | Value |
|----------|-------|
| **Name** | rez-insights-service |
| **Version** | 1.0.0 |
| **Port** | 3011 |
| **Node** | >=18.0.0 |
| **Description** | AI-powered insights storage and management |

### Features

1. **Insight Management**
   - CRUD operations for insights
   - User-scoped and merchant-scoped insights
   - Insight types: churn_risk, upsell, cross_sell, reorder, campaign, general
   - Priority levels: high, medium, low
   - Status tracking: new, viewed, actioned, dismissed

2. **Data Validation**
   - Zod schema validation for all inputs
   - Type enums enforced at model and service layers
   - Confidence score validation (0-1 range)

3. **Caching**
   - Redis-based caching for read operations
   - Cache invalidation on create/update/delete
   - Per-user and per-merchant cache patterns

4. **Rate Limiting**
   - IP-based rate limiting (60 requests/minute)
   - User-based rate limiting (100 requests/15 minutes default)
   - Strict and bulk rate limiter presets

5. **Authentication**
   - JWT token verification
   - Role-based access control (user, merchant, admin, system)
   - Ownership verification middleware

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                  Request Flow                              │
│  - Rate Limiter (Redis-based)                             │
│  - Authentication (JWT verification)                      │
│  - Zod Validation                                         │
│  - Service Layer                                          │
│  - MongoDB Operation                                      │
│  - Cache Invalidation (if write)                          │
│  - Response                                               │
└─────────────────────────────────────────────────────────────┘
```

### Architecture

| Component | Technology |
|-----------|------------|
| HTTP Server | Express.js |
| Database | MongoDB (Mongoose) |
| Cache | Redis (IORedis) |
| Validation | Zod |
| Auth | JWT (jsonwebtoken) |
| Error Tracking | Sentry |
| Logging | Console (custom logger) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Service health check |
| GET | /ready | Readiness probe |
| GET | /metrics | Service metrics |
| POST | /api/insights | Create new insight |
| GET | /api/insights/:id | Get insight by ID |
| GET | /api/insights/user/:userId | Get user insights |
| GET | /api/insights/user/:userId/count | Count user insights |
| GET | /api/insights/merchant/:merchantId | Get merchant insights |
| PATCH | /api/insights/:id | Update insight status |
| DELETE | /api/insights/:id | Delete insight |

### Insight Document Schema

```typescript
interface Insight {
  userId: string;           // Required
  merchantId?: string;      // Optional
  type: InsightType;        // churn_risk | upsell | cross_sell | reorder | campaign | general
  priority: InsightPriority; // high | medium | low
  title: string;            // Max 200 chars
  description: string;       // Max 2000 chars
  recommendation: string;    // Max 2000 chars
  actionData: Record<string, unknown>;
  confidence: number;       // 0-1 range
  expiresAt: Date;          // TTL index (auto-delete)
  status: InsightStatus;    // new | viewed | actioned | dismissed
  metadata: Record<string, unknown>;
}
```

### Issues

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| INS-01 | Low | Using console.log instead of structured logger | Open |
| INS-02 | Low | No cache TTL configured for Redis operations | Open |
| INS-03 | Medium | No input sanitization for userId/merchantId | Open |
| INS-04 | Low | Missing request ID for tracing | Open |

---

## Summary Comparison

| Aspect | Automation Service | Scheduler Service | Insights Service |
|--------|-------------------|-------------------|------------------|
| **Primary Role** | Event-driven rules | Job scheduling | Data storage |
| **Database** | MongoDB | MongoDB | MongoDB |
| **Cache/Queue** | Redis | Redis + BullMQ | Redis |
| **Auth** | None | JWT/Token | JWT |
| **Validation** | Custom | Zod | Zod |
| **Error Tracking** | Sentry | Sentry | Sentry |
| **Jobs/Workers** | node-cron | BullMQ | N/A |
| **Pre-seeded Data** | Yes (26 rules) | Yes (19 jobs) | No |
| **API Complexity** | Medium | Medium | Low |
| **Production Readiness** | Partial | Good | Partial |

---

## Recommendations

### High Priority
1. Add authentication to rez-automation-service endpoints
2. Fix CORS configuration (restrict origins)
3. Add rate limiting to all services

### Medium Priority
1. Implement structured logging in rez-insights-service
2. Add request tracing with correlation IDs
3. Document inter-service communication patterns

### Low Priority
1. Move event history to persistent storage
2. Add health check for each service dependency
3. Implement circuit breakers for downstream service calls
