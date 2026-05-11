# API-GATEWAY-DESIGN.md

**Document Type:** Architecture Design
**Status:** Implementation in Progress
**Owner:** Platform Team
**Last Updated:** 2026-05-01

---

## Table of Contents

1. [Current Routing Approach](#current-routing-approach)
2. [Proposed Centralized Gateway Design](#proposed-centralized-gateway-design)
3. [Rate Limiting Strategy](#rate-limiting-strategy)
4. [Auth Validation at Gateway](#auth-validation-at-gateway)
5. [Request Logging/Tracing](#request-loggingtracing)
6. [Health Check Aggregation](#health-check-aggregation)
7. [Configuration as Code](#configuration-as-code)

---

## Current Routing Approach

### Overview

The current architecture uses a hybrid approach:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT ROUTING ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Internet                                                                    │
│      │                                                                       │
│      ▼                                                                       │
│   ┌─────────┐                                                                │
│   │Render   │  (Load Balancer + Health Checks)                              │
│   │ LB      │                                                                │
│   └────┬────┘                                                                │
│        │                                                                     │
│        ├──────────────────────────────────────────────┐                     │
│        │                                              │                     │
│        ▼                                              ▼                     │
│   ┌─────────────┐                              ┌─────────────┐               │
│   │  ReZ Apps  │                              │  Hotel OTA  │               │
│   │  (Mobile/  │                              │  (Mobile/   │               │
│   │   Web)     │                              │   Web)      │               │
│   └─────┬──────┘                              └──────┬──────┘               │
│         │                                            │                      │
│         ▼                                            ▼                      │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                    Direct Service Calls                          │      │
│   │                                                                    │      │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │      │
│   │  │    Auth      │  │   Wallet     │  │   Payment    │            │      │
│   │  │   Service    │  │   Service    │  │   Service    │            │      │
│   │  │  (Port 4002) │  │  (Port 4004) │  │  (Port 4001) │            │      │
│   │  └──────────────┘  └──────────────┘  └──────────────┘            │      │
│   │                                                                    │      │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │      │
│   │  │   Merchant   │  │   Order     │  │   Finance   │            │      │
│   │  │   Service    │  │   Service   │  │   Service   │            │      │
│   │  │  (Port 4005) │  │  (Port 3006)│  │  (Port 4006)│            │      │
│   │  └──────────────┘  └──────────────┘  └──────────────┘            │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Current Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| No centralized auth | High | Each service validates JWT independently |
| Inconsistent rate limiting | High | Only some services have rate limits |
| No unified logging | Medium | Each service logs differently |
| Hardcoded URLs | High | Services call each other via env vars |
| No circuit breakers | Medium | Cascade failures possible |
| No request transformation | Low | Inconsistent API formats |

### Existing Kong Configuration

Located at `/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/kong/declarative/kong.yml`

Current services routed:
- `/api/auth` → `rez-auth-service:3001`
- `/api/corp` → `rez-wallet-service:4004`
- `/api/gst` → `rez-finance-service:4006`

---

## Proposed Centralized Gateway Design

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CENTRALIZED GATEWAY ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Internet                                                                    │
│      │                                                                       │
│      ▼                                                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Cloudflare CDN                                 │   │
│   │                   (DDoS, SSL Termination)                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Kong API Gateway                                  │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│   │  │ JWT Auth    │  │ Rate Limit │  │   CORS     │  │  Logging   │  │   │
│   │  │ Plugin      │  │  Plugin     │  │  Plugin    │  │   Plugin   │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│   │                                                                      │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│   │  │  Circuit    │  │ Request    │  │ Response   │  │   Bot       │  │   │
│   │  │  Breaker    │  │ Transform  │  │ Transform  │  │  Detection  │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│        ┌───────────────────────────┼───────────────────────────┐           │
│        │                           │                           │           │
│        ▼                           ▼                           ▼           │
│   ┌─────────────┐            ┌─────────────┐            ┌─────────────┐       │
│   │  Auth       │            │  Wallet     │            │  Payment    │       │
│   │  Service    │            │  Service    │            │  Service    │       │
│   │  Cluster    │            │  Cluster   │            │  Cluster    │       │
│   │             │            │             │            │             │       │
│   │ ┌─────────┐ │            │ ┌─────────┐ │            │ ┌─────────┐ │       │
│   │ │Node 1   │ │            │ │Node 1   │ │            │ │Node 1   │ │       │
│   │ │Node 2   │ │            │ │Node 2   │ │            │ │Node 2   │ │       │
│   │ │Node 3   │ │            │ │Node 3   │ │            │ │Node 3   │ │       │
│   │ └─────────┘ │            │ └─────────┘ │            │ └─────────┘ │       │
│   └─────────────┘            └─────────────┘            └─────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Gateway Responsibilities

| Layer | Responsibility | Implementation |
|-------|--------------|----------------|
| **Security** | Auth validation, CORS, Bot detection | Kong JWT Plugin, CORS Plugin |
| **Rate Limiting** | Per-user, per-service limits | Kong rate-limit-advanced |
| **Routing** | Path-based routing to services | Kong declarative config |
| **Observability** | Request logging, metrics | Kong prometheus, logging |
| **Resilience** | Circuit breakers, retries | Kong circuit-breaker |
| **Transformation** | Request/response mapping | Kong request-transformer |

### Kong Configuration Structure

```
/rez-api-gateway/
├── kong/
│   ├── declarative/
│   │   └── kong.yml              # Main declarative config
│   ├── plugins/
│   │   ├── custom-rate-limit/    # Custom rate limiting logic
│   │   └── correlation-id/       # Request correlation
│   └── docker-compose.yml        # Local development
├── src/
│   ├── custom-plugins/           # Custom Kong plugins
│   └── transforms/               # Request/response transforms
├── nginx/
│   └── nginx.conf                # Nginx fallback config
├── Dockerfile
├── render.yaml
└── start.sh
```

---

## Rate Limiting Strategy

### Rate Limit Tiers

```yaml
# kong.yml rate limiting configuration

services:
  # Auth Service - Lower limits (credential operations)
  - name: auth-service
    url: http://rez-auth-service:4002
    routes:
      - name: auth-route
        paths:
          - /api/auth
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 10      # 10 requests/second
            minute: 100     # 100 requests/minute
            hour: 500       # 500 requests/hour
          policy: redis
          redis_host: ${REDIS_HOST}
          redis_port: ${REDIS_PORT}
          fault_tolerant: true
          hide_client_headers: false
          error_code: 429
          error_message: "Rate limit exceeded"

  # Wallet Service - Medium limits (financial operations)
  - name: wallet-service
    url: http://rez-wallet-service:4004
    routes:
      - name: wallet-route
        paths:
          - /api/wallet
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 20
            minute: 200
            hour: 1000
          policy: redis
          redis_host: ${REDIS_HOST}
          redis_port: ${REDIS_PORT}
          fault_tolerant: true
          # Consumer vs internal differentiation via header
          limit_by: header
          header_name: x-consumer-id

  # Payment Service - Strict limits (high-value operations)
  - name: payment-service
    url: http://rez-payment-service:4001
    routes:
      - name: payment-route
        paths:
          - /api/pay
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 5
            minute: 50
            hour: 200
          policy: redis
          fault_tolerant: false  # Fail closed for payments

  # Internal Services - High limits (service-to-service)
  - name: internal-services
    url: http://rez-internal:4000
    routes:
      - name: internal-route
        paths:
          - /internal
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 100
            minute: 1000
            hour: 10000
          policy: redis
          # Limit by service name header
          limit_by: header
          header_name: x-internal-service
```

### Consumer-Based Rate Limiting

```yaml
# Define consumers with different rate limit tiers
consumers:
  - username: premium-user
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            minute: 1000
            hour: 10000
          policy: redis

  - username: standard-user
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            minute: 100
            hour: 1000
          policy: redis

  - username: anonymous
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            minute: 10
            hour: 50
          policy: redis

# OAuth2 plugin for consumer identification
plugins:
  - name: oauth2
    config:
      scopes: ["read", "write"]
      enable_password_grant: false
      enable_authorization_code: true
```

### Rate Limit Response Headers

```
HTTP/1.1 200 OK
X-RateLimit-Limit-Minute: 100
X-RateLimit-Remaining-Minute: 95
X-RateLimit-Reset: 1714588800
Retry-After: 60  # Only on 429 response
```

---

## Auth Validation at Gateway

### JWT Validation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JWT VALIDATION AT GATEWAY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request                                                                    │
│      │                                                                       │
│      ▼                                                                       │
│   ┌─────────────────┐                                                       │
│   │ Extract JWT     │  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...         │
│   │ from header     │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                 │
│            ▼                                                                 │
│   ┌─────────────────┐                                                       │
│   │ Validate JWT    │                                                       │
│   │ signature       │  ┌─────────────────────────────────────────────┐      │
│   │ (RS256/HS256)   │  │ Using public key from JWKS endpoint        │      │
│   └────────┬────────┘  │ or shared secret from env var             │      │
│            │            └─────────────────────────────────────────────┘      │
│            │                                                                 │
│      ┌─────┴─────┐                                                          │
│      │ Valid?    │                                                          │
│      └─────┬─────┘                                                          │
│       Yes  │  No                                                            │
│       │    └──────► 401 Unauthorized                                        │
│       ▼                                                                   │
│   ┌─────────────────┐                                                       │
│   │ Check claims   │  - exp: expiration                                    │
│   │ (claims check) │  - iat: issued at                                     │
│   └────────┬────────┘  - nbf: not before                                  │
│            │         - iss: issuer                                          │
│            │         - aud: audience                                        │
│            ▼                                                                   │
│   ┌─────────────────┐                                                       │
│   │ Check scopes    │  Check required scope for route                      │
│   │ (scope check)   │  e.g., /api/wallet requires "wallet:read"           │
│   └────────┬────────┘                                                       │
│            │                                                                 │
│            ▼                                                                   │
│   ┌─────────────────┐                                                       │
│   │ Inject headers  │  x-consumer-id: user-123                            │
│   │ to upstream     │  x-consumer-scopes: wallet:read,wallet:write        │
│   │                 │  x-request-id: req-abc-123                           │
│   └────────┬────────┘                                                       │
│            │                                                                 │
│            ▼                                                                   │
│   ┌─────────────────┐                                                       │
│   │ Forward to      │                                                       │
│   │ upstream service │                                                       │
│   └─────────────────┘                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kong JWT Plugin Configuration

```yaml
# kong.yml - JWT Validation Plugin

plugins:
  # Global JWT validation
  - name: jwt
    route: null  # Applied to all routes
    config:
      # Claims to extract
      claims_to_verify:
        - exp
        - nbf
      # Maximum expiration (in seconds)
      max_expiration: 3600  # 1 hour
      # Run on all routes except health and auth
      route: null

  # Public routes (no auth required)
  - name: jwt
    route: auth-route
    config:
      enabled: false

# Consumer for API key auth fallback
consumers:
  - username: api-consumer
    plugins:
      - name: key-auth
        config:
          key_names:
            - x-api-key
          key_in_header: true
          hide_credentials: false
```

### Auth Middleware Code (Custom Plugin)

```typescript
// src/custom-plugins/auth-validator/handler.lua
-- Custom auth validator with additional checks

local kong = kong
local ngx = ngx
local type = type
local ipairs = ipairs

local AuthValidatorHandler = {
  VERSION = "1.0.0",
  PRIORITY = 1000,
}

-- Configurable trusted issuers
local TRUSTED_ISSUERS = {
  "https://auth.reznow.in",
  "https://rez-auth-service.onrender.com",
}

-- Configurable required scopes per route
local ROUTE_SCOPES = {
  ["/api/wallet"] = {"wallet:read"},
  ["/api/wallet/*"] = {"wallet:write"},
  ["/api/pay"] = {"payment:write"},
  ["/api/merchant"] = {"merchant:read", "merchant:write"},
  ["/internal"] = {},  -- Internal routes handled separately
}

function AuthValidatorHandler:access(conf)
  local path = kong.request.get_path()

  -- Skip auth for public routes
  if is_public_route(path) then
    return
  end

  -- Get consumer credentials
  local consumer = kong.client.get_consumer()
  if not consumer then
    return kong.response.exit(401, {
      error = "Unauthorized",
      message = "Valid authentication required"
    })
  end

  -- Validate scopes for route
  local required_scopes = ROUTE_SCOPES[path]
  if required_scopes then
    local consumer_scopes = kong.ctx.shared.scopes or {}

    for _, scope in ipairs(required_scopes) do
      if not has_scope(consumer_scopes, scope) then
        return kong.response.exit(403, {
          error = "Forbidden",
          message = "Insufficient scope: " .. scope
        })
      end
    end
  end

  -- Inject validated consumer info to headers
  kong.service.request.set_header("X-Consumer-ID", consumer.id)
  kong.service.request.set_header("X-Consumer-Name", consumer.username)
  kong.service.request.set_header("X-Request-Validated", "true")
end

function has_scope(scopes, required)
  for _, scope in ipairs(scopes) do
    if scope == required then
      return true
    end
  end
  return false
end

function is_public_route(path)
  local public_prefixes = {
    "/health",
    "/metrics",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/docs",
  }

  for _, prefix in ipairs(public_prefixes) do
    if path:find(prefix, 1, true) == 1 then
      return true
    end
  end
  return false
end

return AuthValidatorHandler
```

### Internal Service Auth

```yaml
# Internal service authentication (service-to-service)

routes:
  - name: internal-route
    paths:
      - /internal
    strip_path: false

plugins:
  - name: internal-auth
    config:
      # Accept either:
      # 1. Internal token (x-internal-token header)
      # 2. Scoped tokens (x-internal-service + x-internal-token)
      validate_service: true
      validate_scopes: true

# Consumer for service authentication
consumers:
  - username: rez-wallet-service
    plugins:
      - name: key-auth
        config:
          key_names:
            - x-internal-token
          hide_credentials: true

  - username: rez-payment-service
    plugins:
      - name: key-auth
        config:
          key_names:
            - x-internal-token
          hide_credentials: true
```

---

## Request Logging/Tracing

### Correlation ID Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REQUEST TRACING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Client                                                                    │
│      │                                                                       │
│      │  GET /api/wallet/balance                     [Request ID: Client-123] │
│      │  X-Request-ID: Client-123                                            │
│      │  X-Correlation-ID: corr-abc                                         │
│      ▼                                                                       │
│   ┌─────────┐                                                                │
│   │ Kong    │  1. If X-Request-ID missing → Generate UUID                   │
│   │ Gateway │  2. If X-Correlation-ID missing → Generate UUID              │
│   │         │  3. Add headers to request                                     │
│   └────┬────┘  4. Log request start                                          │
│        │                                                                      │
│        │  GET /api/wallet/balance                                            │
│        │  X-Request-ID: Client-123                                          │
│        │  X-Correlation-ID: corr-abc                                         │
│        │  X-Trace-ID: trace-def-456  ← Generated by Kong                   │
│        │  X-Span-ID: span-ghi-789   ← Generated by Kong                     │
│        ▼                                                                      │
│   ┌─────────────┐                                                           │
│   │ Upstream    │  Log with all correlation IDs                              │
│   │ Service     │  Trace request processing                                  │
│   │             │                                                           │
│   │ ┌─────────┐ │                                                           │
│   │ │ Redis   │ │  Pub/sub events with correlation IDs                     │
│   │ └─────────┘ │                                                           │
│   │             │                                                           │
│   │ ┌─────────┐ │                                                           │
│   │ │ MongoDB │ │  Queries with correlation context                         │
│   │ └─────────┘ │                                                           │
│   └─────┬───────┘                                                           │
│         │                                                                     │
│         ▼                                                                     │
│   ┌─────────┐                                                                │
│   │ Kong    │  Log response with timing                                     │
│   │ Gateway │  Forward correlation IDs in response                          │
│   └────┬────┘                                                                │
│        │                                                                      │
│        │  200 OK                                                             │
│        │  X-Request-ID: Client-123                                          │
│        │  X-Correlation-ID: corr-abc                                        │
│        │  X-Trace-ID: trace-def-456                                        │
│        │  X-Process-Time: 45ms                                              │
│        ▼                                                                      │
│   Client                                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kong Logging Configuration

```yaml
# kong.yml - Logging and Tracing

plugins:
  # Correlation ID generation
  - name: correlation-id
    config:
      header_name: X-Correlation-ID
      generator: uuid
      echo_downstream: true

  # Request logging (structured JSON)
  - name: prometheus
    config:
      # Exposed metrics endpoint: /metrics

  # Access logging
  - name: loggly
    config:
      host: logs-01.loggly.com
      port: 514
      timeout: 5000
      keepalive: 30
      # Custom log format
      custom_fields_by_lua:
        request_id: "ngx.var.request_id"
        correlation_id: "ngx.var.correlation_id"
        consumer: "ngx.var.authenticated_consumer"
        service: "ngx.var.service_name"
        route: "ngx.var.route_name"
        latency: "ngx.var.request_time"
        status: "ngx.var.status"

  # ELK Stack integration
  - name: http-log
    config:
      http_endpoint: http://elasticsearch:9200/logs
      method: POST
      content_type: application/json
      timeout: 10000
      keepalive: 30
```

### Log Format Specification

```json
{
  "timestamp": "2026-05-01T12:00:00.000Z",
  "level": "info",
  "service": "kong-gateway",
  "request": {
    "method": "GET",
    "path": "/api/wallet/balance",
    "headers": {
      "x-request-id": "req-abc-123",
      "x-correlation-id": "corr-def-456",
      "x-forwarded-for": "192.168.1.1",
      "authorization": "[REDACTED]"
    },
    "client_ip": "192.168.1.1",
    "user_agent": "ReZApp/1.0.0"
  },
  "response": {
    "status": 200,
    "latency_ms": 45,
    "size_bytes": 1024
  },
  "consumer": {
    "id": "consumer-123",
    "username": "user@example.com",
    "scopes": ["wallet:read"]
  },
  "service": {
    "name": "wallet-service",
    "url": "http://rez-wallet-service:4004",
    "route": "wallet-route"
  },
  "trace": {
    "trace_id": "trace-ghi-789",
    "span_id": "span-jkl-012"
  },
  "tags": ["api", "wallet", "balance"]
}
```

### Service-Level Logging Integration

```typescript
// Services should use centralized logging with correlation IDs
// See: rez-shared/src/utils/logger.ts

import { logger, expressCorrelationMiddleware } from '@rez/shared';

app.use(expressCorrelationMiddleware);

// Usage in route handlers
app.get('/api/wallet/balance', async (req, res) => {
  logger.info('Fetching wallet balance', {
    userId: req.user.id,
    correlationId: req.correlationId,
    traceId: req.traceId,
    spanId: req.spanId,
  });

  const balance = await walletService.getBalance(req.user.id);

  logger.info('Wallet balance retrieved', {
    userId: req.user.id,
    balance,
    latencyMs: Date.now() - req.startTime,
  });

  res.json({ balance });
});
```

---

## Health Check Aggregation

### Health Check Levels

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HEALTH CHECK HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Cloudflare / Load Balancer                        │   │
│   │                                                                      │   │
│   │   GET /healthz  ───► 200 OK  (Upstream healthy)                     │   │
│   │                    │                                                 │   │
│   │                    └──► 503 Service Unavailable (Upstream unhealthy) │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Kong Gateway                                       │   │
│   │                                                                      │   │
│   │   GET /health/  ───► Returns aggregated health of all upstreams       │   │
│   │   GET /health/live  ───► Is gateway running? (always 200 if running) │   │
│   │   GET /health/ready  ───► Are upstreams reachable?                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│   ┌───────────────┐        ┌───────────────┐        ┌───────────────┐    │
│   │   Auth        │        │   Wallet      │        │   Payment     │    │
│   │   Service     │        │   Service     │        │   Service     │    │
│   │               │        │               │        │               │    │
│   │ /health/live  │        │ /health/live  │        │ /health/live  │    │
│   │ /health/ready │        │ /health/ready │        │ /health/ready │    │
│   └───────────────┘        └───────────────┘        └───────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kong Health Check Plugin

```yaml
# kong.yml - Health Check Configuration

services:
  - name: auth-service
    url: http://rez-auth-service:4002
    routes:
      - name: auth-route
        paths:
          - /api/auth
    healthcheck:
      active:
        type: http
        http_path: /health/ready
        interval: 10  # seconds
        timeout: 5     # seconds
        healthy:
          interval: 5  # seconds
          http_statuses:
            - 200
            - 302
          successes: 2
        unhealthy:
          interval: 5
          http_statuses:
            - 429
            - 500
            - 503
          tcp_fails: 2
          timeouts: 3

  - name: wallet-service
    url: http://rez-wallet-service:4004
    routes:
      - name: wallet-route
        paths:
          - /api/wallet
    healthcheck:
      active:
        type: http
        http_path: /health/ready
        interval: 10
        timeout: 5

  - name: payment-service
    url: http://rez-payment-service:4001
    routes:
      - name: payment-route
        paths:
          - /api/pay
    healthcheck:
      active:
        type: http
        http_path: /health/ready
        interval: 10
        timeout: 5
        healthy:
          successes: 3  # More strict for payments
        unhealthy:
          tcp_fails: 1  # Fail faster for payments
```

### Aggregated Health Endpoint

```typescript
// Kong custom health aggregation endpoint
// src/health-aggregator/handler.lua

local http = require("socket.http")
local json = require("cjson")

local HealthAggregatorHandler = {
  VERSION = "1.0.0",
  PRIORITY = 100,
}

local UPSTREAM_SERVICES = {
  { name = "auth", url = "http://rez-auth-service:4002/health/ready" },
  { name = "wallet", url = "http://rez-wallet-service:4004/health/ready" },
  { name = "payment", url = "http://rez-payment-service:4001/health/ready" },
  { name = "order", url = "http://rez-order-service:3006/health/ready" },
  { name = "merchant", url = "http://rez-merchant-service:4005/health/ready" },
  { name = "finance", url = "http://rez-finance-service:4006/health/ready" },
}

function HealthAggregatorHandler:access(conf)
  local path = kong.request.get_path()

  if path == "/health/ready" then
    local results = {}
    local all_healthy = true

    -- Check each upstream service
    for _, service in ipairs(UPSTREAM_SERVICES) do
      local response, code = http.request(service.url)

      if code == 200 then
        results[service.name] = { status = "healthy", code = code }
      else
        results[service.name] = { status = "unhealthy", code = code }
        all_healthy = false
      end
    end

    -- Response
    local status_code = all_healthy and 200 or 503
    local body = json.encode({
      status = all_healthy and "healthy" or "degraded",
      timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
      services = results,
      gateway_version = kong.version,
    })

    kong.response.exit(status_code, body, {
      ["Content-Type"] = "application/json",
      ["X-Health-Status"] = all_healthy and "ok" or "degraded",
    })
  end
end

return HealthAggregatorHandler
```

### Service Health Response Format

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2026-05-01T12:00:00.000Z",
  "version": "1.2.3",
  "uptime_seconds": 86400,
  "dependencies": {
    "mongodb": {
      "status": "healthy",
      "latency_ms": 5
    },
    "redis": {
      "status": "healthy",
      "latency_ms": 2
    },
    "queues": {
      "status": "healthy",
      "pending_jobs": 42
    }
  },
  "services": {
    "auth": { "status": "healthy" },
    "wallet": { "status": "healthy" },
    "payment": { "status": "healthy" },
    "order": { "status": "degraded" }
  }
}
```

---

## Configuration as Code

### Kong Configuration Structure

```
rez-api-gateway/
├── kong/
│   ├── declarative/
│   │   ├── kong.yml              # Main configuration
│   │   ├── kong.env               # Environment-specific overrides
│   │   └── services/
│   │       ├── auth.yml           # Auth service routes
│   │       ├── wallet.yml         # Wallet service routes
│   │       ├── payment.yml        # Payment service routes
│   │       └── internal.yml       # Internal routes
│   ├── plugins/
│   │   ├── rate-limiting/
│   │   │   ├── handler.lua
│   │   │   └── schema.lua
│   │   └── auth-validator/
│   │       ├── handler.lua
│   │       └── schema.lua
│   └── transforms/
│       ├── request/
│       │   └── add-headers.lua
│       └── response/
│           └── remove-headers.lua
├── config/
│   ├── development.yml
│   ├── staging.yml
│   └── production.yml
├── docker-compose.yml
├── Dockerfile
└── README.md
```

### Main Kong Configuration

```yaml
# kong/declarative/kong.yml

_format_version: "3.0"
_transform: true

# ─── Environment Variables ────────────────────────────────────────────────────
# All sensitive values from environment

_env:
  REDIS_HOST: REDIS_HOST
  REDIS_PORT: REDIS_PORT
  REDIS_PASSWORD: REDIS_PASSWORD
  POSTGRES_HOST: POSTGRES_HOST
  POSTGRES_PORT: POSTGRES_PORT
  POSTGRES_USER: POSTGRES_USER
  POSTGRES_PASSWORD: POSTGRES_PASSWORD
  DATABASE: POSTGRES_DB

# ─── Plugins (Global) ──────────────────────────────────────────────────────────

plugins:
  # Rate limiting (enabled per-route)
  - name: rate-limiting-advanced
    enabled: true

  # JWT authentication
  - name: jwt
    enabled: true

  # CORS
  - name: cors
    enabled: true
    config:
      origins:
        - "https://reznow.in"
        - "https://www.reznow.in"
        - "https://stayown.in"
        - "https://www.stayown.in"
      methods:
        - GET
        - POST
        - PUT
        - PATCH
        - DELETE
      headers:
        - Authorization
        - Content-Type
        - X-Request-ID
        - X-Correlation-ID
      exposed_headers:
        - X-RateLimit-Limit
        - X-RateLimit-Remaining
        - X-RateLimit-Reset
      credentials: true
      max_age: 3600

  # Request ID / Correlation
  - name: correlation-id
    config:
      header_name: X-Correlation-ID
      generator: uuid
      echo_downstream: true

  # Prometheus metrics
  - name: prometheus
    config:
      per_consumer: true

  # Bot detection
  - name: bot-detection
    config:
      allow: []
      deny:
        - curl
        - wget
        - python-requests
        - scrapy

  # Request size limiting
  - name: request-size-limiting
    config:
      allowed_payload_size: 10  # MB
      size_unit: megabytes

# ─── Services ────────────────────────────────────────────────────────────────

services:
  # Auth Service
  - name: auth-service
    url: http://rez-auth-service:4002
    routes:
      - name: auth-route
        paths:
          - /api/auth
        strip_path: false
        preserve_host: false
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 10
            minute: 100
            hour: 500
          policy: redis
          redis_host: ${REDIS_HOST}
          redis_port: ${REDIS_PORT}
          fault_tolerant: true
      - name: jwt
        config:
          enabled: false  # Auth routes don't need JWT validation

  # Wallet Service
  - name: wallet-service
    url: http://rez-wallet-service:4004
    routes:
      - name: wallet-route
        paths:
          - /api/wallet
        strip_path: false
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 20
            minute: 200
            hour: 1000
          policy: redis
          redis_host: ${REDIS_HOST}
          redis_port: ${REDIS_PORT}
          fault_tolerant: true
          limit_by: consumer
      - name: jwt
        config:
          claims_to_verify:
            - exp
            - nbf

  # Payment Service
  - name: payment-service
    url: http://rez-payment-service:4001
    routes:
      - name: payment-route
        paths:
          - /api/pay
        strip_path: false
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 5
            minute: 50
            hour: 200
          policy: redis
          redis_host: ${REDIS_HOST}
          redis_port: ${REDIS_PORT}
          fault_tolerant: false  # Fail closed for payments
      - name: jwt
        config:
          claims_to_verify:
            - exp
            - nbf

  # Internal Services (no JWT, internal token only)
  - name: internal-services
    url: http://rez-wallet-service:4004
    routes:
      - name: internal-route
        paths:
          - /internal
        strip_path: false
    plugins:
      - name: rate-limiting-advanced
        config:
          limits:
            second: 100
            minute: 1000
            hour: 10000
          policy: redis
          redis_host: ${REDIS_HOST}
          redis_port: ${REDIS_PORT}
          fault_tolerant: true
          limit_by: header
          header_name: x-internal-service

# ─── Health Routes ────────────────────────────────────────────────────────────

services:
  - name: health-service
    url: http://127.0.0.1:8000
    routes:
      - name: health-live
        paths:
          - /health/live
        strip_path: false
        plugins:
          - name: jwt
            config:
              enabled: false
          - name: rate-limiting-advanced
            config:
              enabled: false

  - name: health-ready
    url: http://127.0.0.1:8000
    routes:
      - name: health-ready
        paths:
          - /health/ready
        strip_path: false
        plugins:
          - name: jwt
            config:
              enabled: false
          - name: rate-limiting-advanced
            config:
              enabled: false

  - name: metrics
    url: http://127.0.0.1:8001
    routes:
      - name: prometheus-metrics
        paths:
          - /metrics
        strip_path: false
        plugins:
          - name: jwt
            config:
              enabled: false
```

### Environment-Specific Overrides

```yaml
# config/production.yml

services:
  # Override production URLs
  - name: auth-service
    url: https://rez-auth-service.onrender.com
    # Health check for production
    healthcheck:
      active:
        type: https
        http_path: /health/ready

plugins:
  - name: cors
    config:
      origins:
        - "https://reznow.in"
        - "https://www.reznow.in"
        - "https://stayown.in"
        - "https://www.stayown.in"
        - "https://admin.reznow.in"
```

```yaml
# config/staging.yml

services:
  - name: auth-service
    url: https://rez-auth-service-staging.onrender.com

plugins:
  - name: cors
    config:
      origins:
        - "https://staging.reznow.in"
        - "https://staging.stayown.in"
```

### CI/CD Pipeline

```yaml
# .github/workflows/gateway-deploy.yml

name: Deploy API Gateway

on:
  push:
    branches: [main]
    paths:
      - 'rez-api-gateway/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kong
        run: |
          docker pull kong:3.4

      - name: Validate Config
        run: |
          docker run --rm \
            -v ${{ github.workspace }}/rez-api-gateway/kong/declarative:/kong/declarative \
            kong:3.4 kong config parse /kong/declarative/kong.yml

      - name: Run Lint
        run: |
          docker run --rm \
            -v ${{ github.workspace }}/rez-api-gateway:/app \
            kong:3.4 \
            sh -c "luacheck /app/src/**/*.lua"

  deploy-staging:
    needs: validate
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Staging
        run: |
          curl -X POST https://api.render.com/v1/services/${{ secrets.STAGING_GATEWAY_ID }}/deploys \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger":{"type":"api"}}'

      - name: Verify Deployment
        run: |
          ./scripts/wait-for-health.sh https://staging-gateway.reznow.in/health/ready

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Production
        run: |
          curl -X POST https://api.render.com/v1/services/${{ secrets.PROD_GATEWAY_ID }}/deploys \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"trigger":{"type":"api"}}'

      - name: Smoke Tests
        run: |
          ./scripts/smoke-tests.sh https://api.reznow.in
```

### Configuration Validation Script

```bash
#!/bin/bash
# scripts/validate-kong-config.sh

set -e

CONFIG_FILE="${1:-kong/declarative/kong.yml}"

echo "Validating Kong configuration: $CONFIG_FILE"

# Check file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file not found: $CONFIG_FILE"
  exit 1
fi

# Validate YAML syntax
echo "1. Checking YAML syntax..."
python3 -c "import yaml; yaml.safe_load(open('$CONFIG_FILE'))" || {
  echo "Error: Invalid YAML syntax"
  exit 1
}

# Validate with Kong
echo "2. Validating with Kong..."
docker run --rm \
  -v "$(pwd)/$CONFIG_FILE:/kong/kong.yml:ro" \
  kong:3.4 kong config parse /kong/kong.yml || {
  echo "Error: Kong configuration validation failed"
  exit 1
}

# Check for required plugins
echo "3. Checking required plugins..."
REQUIRED_PLUGINS=("jwt" "rate-limiting-advanced" "cors" "correlation-id")
for plugin in "${REQUIRED_PLUGINS[@]}"; do
  if ! grep -q "name: $plugin" "$CONFIG_FILE"; then
    echo "Warning: Required plugin '$plugin' not found in configuration"
  fi
done

# Check service definitions
echo "4. Checking service definitions..."
REQUIRED_SERVICES=("auth-service" "wallet-service" "payment-service")
for service in "${REQUIRED_SERVICES[@]}"; do
  if ! grep -q "name: $service" "$CONFIG_FILE"; then
    echo "Error: Required service '$service' not found in configuration"
    exit 1
  fi
done

echo "✓ All validations passed"
```

---

## Appendix: Reference Implementation

### Existing Gateway Config

- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/`
- **Kong Config:** `kong/declarative/kong.yml`
- **Nginx Fallback:** `nginx.conf`

### Related Documentation

- [OPS-003: No API Gateway Resolution](./OPS-003-NO-API-GATEWAY.md)
- [Services Reference](./SERVICES.md)
- [Security Guidelines](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)
