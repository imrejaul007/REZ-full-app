# ReZ Ecosystem - Live Deployment Plan
**Created:** 2026-05-01
**Priority:** Make system production-ready

---

## Phase 1: Critical Fixes (Do First)

### 1.1 Replace file:../ Dependencies

**Problem:** All services use `file:../packages/shared-types` which won't work in production.

**Solution:** Use npm workspace or publish to private npm.

```json
// Root package.json for monorepo
{
  "name": "rez-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*"
  ]
}
```

**Action Required:**
1. Create monorepo package.json at root
2. Move services into `services/` directory OR use npm workspaces with --workspaces
3. Run `npm install` to link packages
4. Publish shared packages to npm (for separate repo deployment)

---

### 1.2 Fix Circular Dependencies

**Problem:** `chat-ai` ↔ `intent-graph` create circular import risk.

**Solution:** Dependency injection + event-based communication.

**Changes Made:**
- [ ] intent-graph no longer imports chat-ai directly
- [ ] Use event emitter for cross-module communication
- [ ] Shared types in shared-types package

---

### 1.3 Unified Auth Package

**Solution:** Create `@rez/auth` package with common utilities.

**Package Location:** `packages/rez-auth/`

**Exports:**
```typescript
// Token verification
verifyToken(token: string, secret: string): Promise<TokenPayload>
verifyApiKey(key: string): Promise<ApiKeyPayload>

// Token parsing
parseBearerToken(header: string): string | null
extractUserId(request: Request): string | null

// Session validation
validateSession(sessionId: string): Promise<boolean>
refreshSession(sessionId: string): Promise<Session>

// Types
interface TokenPayload { userId: string; role: string; iat: number; exp: number }
interface ApiKeyPayload { keyId: string; merchantId: string; permissions: string[] }
```

---

## Phase 2: Data Synchronization (Critical for Business)

### 2.1 Wallet Sync Strategy

**Current State:**
- ReZ Wallet Service manages ReZ coins
- Hotel OTA has separate coin wallet (OTA, REZ, Hotel Brand)
- No synchronization between them

**Recommended Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                    UNIFIED WALLET                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│   User Wallet (single source of truth)               │
│   ├── ReZ Coins (platform)                           │
│   ├── Hotel OTA Coins ───────┐                       │
│   ├── Brand Coins ───────────┼── Derived balances    │
│   └── Loyalty Points ────────┘                       │
│                                                      │
│   Hotel OTA reads from unified wallet                 │
│   Earn/Burn synced via events                        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Sync Events:**
```typescript
// When user earns coins in Hotel OTA
{
  type: 'COIN_EARNED',
  source: 'hotel-ota',
  userId: '...',
  amount: 100,
  coinType: 'hotel-brand',
  timestamp: '...'
}

// When user wants to spend ReZ coins at hotel
{
  type: 'COIN_CONVERSION',
  userId: '...',
  fromType: 'rez',
  toType: 'hotel-brand',
  amount: 100,
  rate: 1.0
}
```

---

### 2.2 User Identity Unification

**Current State:** Users have separate accounts in:
- ReZ Auth Service
- Hotel OTA
- adBazaar (Supabase)
- nextabizz (Supabase)

**Solution:** Federated identity with shared user ID

```
┌─────────────────────────────────────────┐
│         IDENTITY PROVIDER                │
├─────────────────────────────────────────┤
│                                          │
│  Primary ID (phone/email)                │
│       │                                  │
│       ├── ReZ User ID ──────────────┐   │
│       ├── Hotel OTA ID ───────────┐ │   │
│       ├── adBazaar ID ──────────┐ │ │   │
│       └── nextabizz ID ────────┐ │ │ │   │
│                                │ │ │ │   │
│       Linked via phone/email   │ │ │ │   │
│                                ▼ ▼ ▼ ▼   │
│                         Unified Profile   │
│                                          │
└─────────────────────────────────────────┘
```

**Implementation:**
1. Extend ReZ Auth Service to be Identity Provider
2. Hotel OTA uses OAuth2/OIDC to authenticate
3. Supabase apps use custom auth with ReZ as provider
4. Shared user ID across all systems

---

## Phase 3: Infrastructure (Required for Scale)

### 3.1 API Gateway

**Current:** Direct service calls, no central routing

**Proposed Gateway:** `rez-api-gateway/`

```typescript
// Gateway responsibilities
const GATEWAY_ROUTES = {
  // Auth
  '/api/auth/*': 'rez-auth-service:4002',
  '/api/users/*': 'rez-auth-service:4002',

  // Wallet & Payments
  '/api/wallet/*': 'rez-wallet-service:4004',
  '/api/payments/*': 'rez-payment-service:4001',

  // Orders & Catalog
  '/api/orders/*': 'rez-order-service:3006',
  '/api/products/*': 'rez-catalog-service:3005',
  '/api/menu/*': 'rez-catalog-service:3005',

  // Hotel
  '/api/hotels/*': 'rez-hotel-service:4015',

  // Analytics
  '/api/analytics/*': 'rez-insights-service',
};
```

**Gateway Features:**
- Request routing
- Rate limiting (per-user, per-endpoint)
- Auth token validation
- Request logging
- Circuit breaker
- Response caching

---

### 3.2 Health Check Aggregation

**All services need:**

```typescript
// GET /health
{
  "status": "ok",
  "service": "rez-wallet-service",
  "version": "1.0.0",
  "timestamp": "2026-05-01T12:00:00Z"
}

// GET /health/ready
{
  "status": "ready",
  "checks": {
    "mongodb": "connected",
    "redis": "connected",
    "queues": "active"
  }
}
```

**Services with health endpoints:** [List updated as added]

---

### 3.3 Distributed Tracing

**Implementation:** OpenTelemetry

```typescript
// Each request gets a trace ID
const traceId = headers['x-trace-id'] || generateTraceId();

// Log format
{
  traceId: "abc123",
  spanId: "def456",
  service: "rez-wallet-service",
  endpoint: "POST /wallet/debit",
  userId: "user_123",
  duration: 45,
  status: 200
}
```

---

## Phase 4: Monitoring & Observability

### 4.1 Metrics Collection

**Per-service Prometheus metrics:**

```yaml
# Service metrics endpoint: GET /metrics
# HELP rez_http_requests_total Total HTTP requests
# TYPE rez_http_requests_total counter
rez_http_requests_total{method="POST",endpoint="/wallet/debit",status="200"} 1523

# HELP rez_wallet_balance Current wallet balances
# TYPE rez_wallet_balance gauge
rez_wallet_balance{userId="user_123"} 5000

# HELP rez_queue_depth BullMQ queue depth
# TYPE rez_queue_depth gauge
rez_queue_depth{queue="wallet-events"} 12
```

---

### 4.2 Alerting Rules

```yaml
# Critical alerts
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "{{ $labels.job }} is down"

- alert: HighErrorRate
  expr: rate(http_errors_total[5m]) > 0.05
  for: 5m
  labels:
    severity: high

- alert: QueueBacklog
  expr: queue_depth > 1000
  for: 10m
  labels:
    severity: medium
```

---

## Phase 5: Security Hardening

### 5.1 Authentication

| Service | Current | Recommended |
|---------|---------|-------------|
| Mobile apps | JWT in SecureStore | Short-lived JWT + refresh token |
| Web apps | Various | OAuth2 / PKCE |
| Service-to-service | API keys | mTLS + JWT |

### 5.2 Rate Limiting

```typescript
const rateLimits = {
  // Auth endpoints (prevent brute force)
  '/auth/login': { window: '1m', max: 5 },
  '/auth/otp': { window: '1m', max: 3 },

  // Write operations
  '/orders': { window: '1m', max: 10 },
  '/payments': { window: '1m', max: 5 },

  // Read operations
  '/products': { window: '1m', max: 100 },
  '/search': { window: '1m', max: 30 },
};
```

---

## Implementation Timeline

### Week 1: Critical Fixes
- [ ] Replace file:../ with npm workspaces
- [ ] Fix circular dependencies
- [ ] Add health checks to all services
- [ ] Deploy API gateway

### Week 2: Data Sync
- [ ] Design unified wallet schema
- [ ] Implement wallet sync events
- [ ] Link Hotel OTA to main auth
- [ ] Test cross-system transactions

### Week 3: Monitoring
- [ ] Set up Prometheus
- [ ] Configure alerts
- [ ] Add distributed tracing
- [ ] Create dashboards

### Week 4: Security
- [ ] Rotate all secrets
- [ ] Enable mTLS between services
- [ ] Penetration testing
- [ ] Load testing

---

## Success Criteria

System is LIVE when:
1. All 18 services respond to health checks
2. User can sign up once and use across all apps
3. Wallet balance is unified
4. Orders track across Hotel OTA and main platform
5. P99 latency < 500ms for all endpoints
6. Zero critical alerts firing
7. All tests passing

---

*Last updated: 2026-05-01*
