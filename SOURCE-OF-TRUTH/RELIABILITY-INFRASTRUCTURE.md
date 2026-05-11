# REZ Reliability Infrastructure

Comprehensive documentation for the REZ platform's reliability and resilience services.

## Overview

The REZ Reliability Infrastructure consists of 5 core services designed to ensure system resilience, fault tolerance, and operational excellence:

| Service | Purpose | GitHub | Render URL |
|---------|---------|--------|------------|
| **REZ-circuit-breaker** | Fault tolerance via circuit breaker pattern | Local | https://rez-circuit-breaker.onrender.com |
| **REZ-retry-service** | Intelligent retry with exponential backoff | Local | https://rez-retry-service.onrender.com |
| **REZ-dlq-service** | Dead Letter Queue for failed events | [GitHub](https://github.com/imrejaul007/REZ-dlq-service) | https://rez-dlq-service.onrender.com |
| **REZ-idempotency-service** | Ensure safe request retries | Local | Local-only |
| **REZ-audit-logging** | Compliance and audit trail | Local | Local-only |

## Architecture Diagram

```
                                    ┌─────────────────────────────────────────────────────┐
                                    │              REZ Reliability Stack                  │
                                    └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                              Incoming Requests                                          │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                     REZ-idempotency-service                                             │
  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
  │  │  • Deduplicate repeated requests                                                    │  │
  │  │  • Store idempotency keys with response cache                                      │  │
  │  │  • Prevent duplicate operations                                                    │  │
  │  └─────────────────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                       REZ-circuit-breaker                                               │
  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
  │  │  States: CLOSED → OPEN → HALF_OPEN                                                │  │
  │  │  • failureThreshold: 5 (default)                                                  │  │
  │  │  • successThreshold: 2 (default)                                                  │  │
  │  │  • timeout: 60000ms (default)                                                     │  │
  │  └─────────────────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                        REZ-retry-service                                               │
  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
  │  │  Strategies: EXPONENTIAL | LINEAR | FIXED                                        │  │
  │  │  • maxRetries: 3 (default)                                                        │  │
  │  │  • baseDelay: 1000ms                                                              │  │
  │  │  • jitter: true (thundering herd prevention)                                       │  │
  │  └─────────────────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼ (on permanent failure)
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                         REZ-dlq-service                                               │
  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
  │  │  • MongoDB-backed persistent storage                                               │  │
  │  │  • Replay individual or batch events                                              │  │
  │  │  • Automatic retry scheduling                                                      │  │
  │  │  • Exponential backoff: 1m → 5m → 15m → 1h → 24h                                 │  │
  │  └─────────────────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────────┐
  │                       REZ-audit-logging                                                │
  │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
  │  │  • Correlation ID tracking                                                         │  │
  │  │  • Compliance reporting                                                            │  │
  │  │  • Audit trail for all operations                                                  │  │
  │  │  • Route: /audit, /compliance, /reports                                             │  │
  │  └─────────────────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

## 1. REZ-circuit-breaker

**GitHub**: Local repository (`/Users/rejaulkarim/Documents/ReZ Full App/REZ-circuit-breaker`)
**Render URL**: https://rez-circuit-breaker.onrender.com
**Render Config**: `render.yaml`

### Features

- Three-state machine: CLOSED (normal), OPEN (fail-fast), HALF_OPEN (testing recovery)
- Configurable failure and success thresholds
- Built-in timeout handling
- Event system for monitoring
- Express middleware for easy integration
- Health check and dashboard endpoints

### Installation

```bash
cd REZ-circuit-breaker
npm install
npm run build
npm start
```

### Configuration

```typescript
interface CircuitBreakerOptions {
  failureThreshold?: number;      // Failures before opening (default: 5)
  successThreshold?: number;      // Successes to close (default: 2)
  timeout?: number;              // Operation timeout in ms (default: 60000)
  resetTimeout?: number;         // Recovery attempt interval (default: 30000)
  monitoringPeriod?: number;     // Failure tracking period (default: 60000)
}
```

### Usage Examples

#### Express Middleware

```typescript
import { createBreakerMiddleware, withCircuitBreaker } from './breaker.middleware';

// Option 1: Middleware
app.get(
  '/api/external',
  createBreakerMiddleware({
    name: 'external-api',
    options: { failureThreshold: 3, timeout: 5000 }
  }),
  (req, res) => {
    // Your endpoint logic
  }
);

// Option 2: Wrapper function
app.get(
  '/api/users/:id',
  withCircuitBreaker('user-service', { failureThreshold: 5 }),
  async (req, res) => {
    const userId = req.params.id;
    // Your endpoint logic
  }
);
```

#### Standalone Usage

```typescript
import { CircuitBreaker, CircuitState } from './circuit-breaker';

const breaker = new CircuitBreaker('payment-service', {
  failureThreshold: 3,
  timeout: 5000
});

// Execute protected operation
try {
  const result = await breaker.execute(() => processPayment(order));
  res.json(result);
} catch (error) {
  if (error instanceof CircuitBreakerOpenError) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
}

// Listen to events
breaker.on('stateChange', (state, metrics) => {
  console.log(`Circuit ${state}: Failures=${metrics.totalFailures}`);
});
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/breakers` | GET | Circuit breaker health status |
| `/admin/breakers` | GET | Full circuit breaker dashboard |
| `/api/breaker/:name/status` | GET | Get specific breaker status |
| `/api/breaker/:name/reset` | POST | Reset a breaker |
| `/api/breaker/:name/state` | POST | Force state change |

### Response Headers

All protected endpoints include:
- `X-Circuit-Breaker`: Circuit name
- `X-Circuit-State`: Current state (CLOSED/OPEN/HALF_OPEN)
- `X-Circuit-Consecutive-Failures`: Failure count

---

## 2. REZ-retry-service

**GitHub**: Local repository (`/Users/rejaulkarim/Documents/ReZ Full App/REZ-retry-service`)
**Render URL**: https://rez-retry-service.onrender.com
**Render Config**: `render.yaml` (Web + Worker)

### Features

- BullMQ-powered job queue
- Multiple retry strategies: exponential, linear, fixed
- Jitter support to prevent thundering herd
- Express middleware for HTTP retry
- Comprehensive metrics and monitoring
- TypeScript with Zod validation

### Installation

```bash
cd REZ-retry-service
npm install
npm run build
npm start
```

### Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

### Retry Strategies

```typescript
enum RetryStrategy {
  EXPONENTIAL = 'exponential',  // 1s, 2s, 4s, 8s...
  LINEAR = 'linear',              // 1s, 2s, 3s, 4s...
  FIXED = 'fixed',                // Same delay every time
}
```

### Usage Examples

#### Basic Job Retry

```typescript
import { QueueService } from './services/queue.service';
import { RetryService } from './services/retry.service';
import { Redis } from 'ioredis';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const queueService = new QueueService(connection);
const retryService = new RetryService(queueService);

// Schedule a retry
await retryService.scheduleRetry('payment-retry', {
  orderId: '123',
  amount: 99.99
}, {
  maxRetries: 3,
  baseDelay: 1000,
  strategy: RetryStrategy.EXPONENTIAL,
  jitter: true
});
```

#### Express Middleware

```typescript
import { createRetryMiddleware, retryErrorHandler } from './middleware/retry.middleware';

app.use(createRetryMiddleware({
  queueService,
  retryService,
  queueName: 'http-requests',
  defaultOptions: {
    maxRetries: 3,
    baseDelay: 1000,
  },
}));

// Error handler with retry
app.use(retryErrorHandler({
  retryService,
  queueService,
  defaultOptions: { maxRetries: 3 }
}));
```

#### Preset Configurations

```typescript
import { RETRY_PRESETS } from './models/retry-job.model';

// Fast retries (non-critical)
const fastConfig = RETRY_PRESETS.fast;

// Standard retries (general use)
const standardConfig = RETRY_PRESETS.standard;

// Slow retries (critical operations)
const slowConfig = RETRY_PRESETS.slow;
```

### Render Deployment

```yaml
# render.yaml
services:
  - type: web
    name: rez-retry-service
    runtime: docker
    dockerfilePath: Dockerfile
    region: oregon
    scaling:
      min_instances: 1
      max_instances: 3
    healthCheckPath: /health

  - type: worker
    name: rez-retry-worker
    runtime: docker
    dockerfilePath: Dockerfile.worker
    region: oregon
```

---

## 3. REZ-dlq-service

**GitHub**: https://github.com/imrejaul007/REZ-dlq-service
**Render URL**: https://rez-dlq-service.onrender.com
**Render Config**: `render.yaml` (MongoDB required)

### Features

- MongoDB-backed persistent storage
- Replay individual or batch events
- Scheduled retries with exponential backoff
- RESTful admin API
- Event filtering and tagging
- Statistics and monitoring

### Installation

```bash
cd REZ-dlq-service
npm install
cp .env.example .env
# Configure MONGODB_URI in .env
npm run build
npm start
```

### Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/rez_dlq` |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Environment mode | `development` |

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Source Service │────▶│   DLQ Service   │────▶│  Target Queue   │
│  (Producer)     │     │  (Store/Query)  │     │  (Consumer)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    MongoDB      │
                        │  (Persistence)  │
                        └─────────────────┘
```

### API Endpoints

#### Store Events

```http
POST /api/dlq/events
Content-Type: application/json

{
  "eventType": "order.process",
  "payload": { "orderId": "123", "amount": 99.99 },
  "error": {
    "message": "Payment failed",
    "code": "PAYMENT_ERROR"
  },
  "metadata": {
    "source": "payment-service",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "tags": ["payment", "urgent"]
}
```

#### Query Events

```http
GET /api/dlq/events?status=pending&eventType=order.process&limit=50
GET /api/dlq/events/:eventId
```

#### Replay Events

```http
POST /api/dlq/replay/:eventId
POST /api/dlq/replay/batch
Content-Type: application/json

{
  "eventIds": ["id1", "id2", "id3"],
  "targetQueue": "orders.retry"
}
POST /api/dlq/replay/pending?limit=100
```

#### Statistics

```http
GET /api/dlq/stats
```

### Event Statuses

| Status | Description |
|--------|-------------|
| `pending` | Awaiting replay |
| `replaying` | Currently being replayed |
| `replayed` | Successfully replayed |
| `failed` | Replay failed (will retry) |
| `discarded` | Manually discarded |

### Retry Strategy

| Attempt | Delay |
|---------|-------|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 15 minutes |
| 4 | 1 hour |
| 5 | 24 hours |

---

## 4. REZ-idempotency-service

**GitHub**: Local repository (`/Users/rejaulkarim/Documents/ReZ Full App/REZ-idempotency-service`)
**Render URL**: Local-only (no Render deployment)

### Features

- Deduplicate repeated requests
- Store idempotency keys with response cache
- Prevent duplicate operations
- In-memory store (use Redis in production)

### Installation

```bash
cd REZ-idempotency-service
npm install
npm start
```

### Usage

```typescript
// Check if request is duplicate
const response = await fetch('/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idempotencyKey: 'unique-key-123' })
});

if (response.status === 200) {
  // Duplicate - return cached response
  const cached = await response.json();
  return cached.response;
}

// Continue with operation...

// Store result for future deduplication
await fetch('/store', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idempotencyKey: 'unique-key-123',
    response: { orderId: '456', status: 'created' },
    statusCode: 201
  })
});
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/check` | POST | Check if idempotency key exists |
| `/store` | POST | Store idempotency record |
| `/health` | GET | Health check |

---

## 5. REZ-audit-logging

**GitHub**: Local repository (`/Users/rejaulkarim/Documents/ReZ Full App/REZ-audit-logging`)
**Render URL**: Local-only (no Render deployment)

### Features

- Correlation ID tracking
- Compliance reporting
- Audit trail for all operations
- Winston logger integration
- CORS-enabled

### Installation

```bash
cd REZ-audit-logging
npm install
npm run build
npm start
```

### Usage

```typescript
import express from 'express';
import { correlationIdMiddleware } from './middleware/audit.middleware';

const app = express();

app.use(correlationIdMiddleware);

// All requests now have x-correlation-id header
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check |
| `/audit` | Audit log routes |
| `/compliance` | Compliance report routes |
| `/reports` | Report generation routes |

---

## Integration with Existing Services

### Integration Pattern Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Service Integration Flow                             │
└──────────────────────────────────────────────────────────────────────────────┘

   Client Request                                                              │
         │                                                                     │
         ▼                                                                     │
   ┌────────────────┐                                                          │
   │  Idempotency   │ ◄── Check if request was already processed               │
   └────────────────┘                                                          │
         │                                                                     │
         ▼                                                                     │
   ┌────────────────┐                                                          │
   │ Circuit Breaker │ ◄── Is downstream service healthy?                       │
   └────────────────┘                                                          │
         │                                                                     │
         ▼                                                                     │
   ┌────────────────┐                                                          │
   │ Retry Service  │ ◄── Should we retry on failure?                          │
   └────────────────┘                                                          │
         │                                                                     │
         ▼ (permanent failure)                                                 │
   ┌────────────────┐                                                          │
   │ DLQ Service    │ ◄── Store for later replay                               │
   └────────────────┘                                                          │
         │                                                                     │
         ▼                                                                     │
   ┌────────────────┐                                                          │
   │ Audit Logging   │ ◄── Log all operations                                   │
   └────────────────┘                                                          │
```

### Example: Complete Integration

```typescript
// services/resilient-http.ts
import express from 'express';
import { createBreakerMiddleware } from 'REZ-circuit-breaker';
import { createRetryMiddleware, retryErrorHandler } from 'REZ-retry-service';
import { queueForRetry } from 'REZ-retry-service';
import { CircuitBreaker } from 'REZ-circuit-breaker';

const app = express();

// 1. Apply idempotency check
app.use('/api/orders', async (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  if (idempotencyKey) {
    const existing = await checkIdempotency(idempotencyKey);
    if (existing) {
      return res.status(200).json(existing);
    }
  }
  next();
});

// 2. Apply circuit breaker
app.use('/api/external', createBreakerMiddleware({
  name: 'external-api',
  options: { failureThreshold: 3, timeout: 5000 }
}));

// 3. Apply retry middleware
app.use(createRetryMiddleware({
  queueService,
  retryService,
  defaultOptions: {
    maxRetries: 3,
    baseDelay: 1000,
    strategy: RetryStrategy.EXPONENTIAL,
    jitter: true
  }
}));

// 4. Route handlers
app.post('/api/orders', async (req, res) => {
  try {
    const order = await processOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    // Queue to DLQ on permanent failure
    await queueForRetry(req, 'order-retry', req.body);
    throw error;
  }
});

// 5. Error handler with retry
app.use(retryErrorHandler({
  retryService,
  queueService,
  defaultOptions: { maxRetries: 3 }
}));

// 6. Audit logging
app.use((req, res, next) => {
  console.log(`[AUDIT] ${req.method} ${req.path}`, {
    correlationId: req.headers['x-correlation-id'],
    timestamp: new Date().toISOString()
  });
  next();
});
```

### Environment Variables for Integration

```bash
# Circuit Breaker
CB_FAILURE_THRESHOLD=5
CB_SUCCESS_THRESHOLD=2
CB_TIMEOUT=60000

# Retry Service
REDIS_URL=redis://localhost:6379
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1000

# DLQ Service
MONGODB_URI=mongodb://localhost:27017/rez_dlq

# Audit Logging
LOG_LEVEL=info
AUDIT_ENABLED=true
```

---

## Monitoring and Health Checks

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| REZ-circuit-breaker | `/health` | `{ "status": "ok" }` |
| REZ-circuit-breaker | `/health/breakers` | Circuit breaker status |
| REZ-retry-service | `/health` | BullMQ queue stats |
| REZ-dlq-service | `/health` | `{ "status": "healthy" }` |
| REZ-dlq-service | `/ready` | Database readiness |
| REZ-idempotency-service | `/health` | `{ "status": "ok" }` |
| REZ-audit-logging | `/health` | `{ "status": "healthy" }` |

### Metrics to Monitor

1. **Circuit Breaker**
   - State transitions (CLOSED/OPEN/HALF_OPEN)
   - Consecutive failures
   - Success rate

2. **Retry Service**
   - Queue depth (waiting jobs)
   - Active jobs
   - Failed jobs
   - Average retry delay

3. **DLQ Service**
   - Pending events count
   - Replay success rate
   - Oldest pending event age

4. **Idempotency**
   - Cache hit/miss ratio
   - Stored keys count

---

## Deployment

### Render Deployment Checklist

- [ ] Configure environment variables
- [ ] Set up MongoDB for DLQ service
- [ ] Set up Redis for Retry service
- [ ] Configure health check paths
- [ ] Enable auto-deploy from GitHub
- [ ] Set up monitoring alerts

### Local Development

```bash
# Start all services locally
cd REZ-circuit-breaker && npm start &
cd REZ-retry-service && npm start &
cd REZ-dlq-service && npm start &
cd REZ-idempotency-service && npm start &
cd REZ-audit-logging && npm start &
```

### Docker Support

```dockerfile
# Example Dockerfile for circuit-breaker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Circuit breaker opens too quickly | Increase `failureThreshold` |
| Retries not working | Check Redis connection |
| DLQ events not replaying | Check target queue configuration |
| Idempotency not working | Verify idempotency key header |
| Audit logs missing | Check correlation ID middleware |

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug

# Circuit breaker debug
CB_LOG_LEVEL=debug

# Retry service debug
RETRY_LOG_LEVEL=debug
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-07 | 1.0.0 | Initial documentation |
