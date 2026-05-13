# ReZ Commerce Platform - Deployment Guide

**Document Version:** 1.0.0
**Date:** May 12, 2026
**Last Updated:** Claude Code Audit

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Environment Configuration](#environment-configuration)
4. [Service Deployment](#service-deployment)
5. [Database Migrations](#database-migrations)
6. [Monitoring Setup](#monitoring-setup)
7. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| Docker | 24+ | Containerization |
| Docker Compose | 2.20+ | Local orchestration |
| Git | 2.40+ | Version control |
| kubectl | 1.28+ | Kubernetes CLI |
| MongoDB Shell | 6.0+ | Database CLI |

### Accounts & Access

- [ ] GitHub repository access
- [ ] Docker Hub / Artifact Registry
- [ ] Cloud provider console
- [ ] Monitoring dashboards
- [ ] Secret manager access

---

## Local Development

### Quick Start (Docker Compose)

```bash
# Clone repository
git clone https://github.com/rez-commerce/rez-platform.git
cd rez-platform

# Copy environment template
cp .env.example .env.local

# Start core infrastructure
docker compose -f docker-compose.core.yml up -d

# Start all services
docker compose -f docker-compose.master.yml up -d

# Verify services are running
docker compose ps
```

### Service Startup Order

```
1. Infrastructure
   ├── MongoDB (primary database)
   ├── Redis (cache, sessions, queues)
   └── Nginx (reverse proxy)

2. Core Services (in order)
   ├── rez-auth-service (4001)        # All services depend on this
   ├── rez-payment-service (3001)
   ├── rez-wallet-service (4002)
   ├── rez-order-service (4003)
   └── rez-catalog-service (4004)

3. Supporting Services
   ├── rez-search-service (4005)
   ├── rez-delivery-service (4006)
   ├── rez-notifications-hub (4007)
   └── rez-menu-service (4008)

4. AI Services
   ├── rez-intent-graph (4009)
   └── REZ-autonomous-agents
```

### Manual Service Start (Without Docker)

```bash
# Install dependencies
npm install

# Build shared packages first
npm run build --workspace=@rez/shared
npm run build --workspace=@rez/ui

# Start individual service
cd RABTUL-Technologies/rez-auth-service
npm run dev
```

### Service URLs (Local)

| Service | URL |
|---------|-----|
| Auth Service | http://localhost:4001 |
| Payment Service | http://localhost:3001 |
| Wallet Service | http://localhost:4002 |
| Order Service | http://localhost:4003 |
| API Gateway | http://localhost:8080 |
| WebSocket | ws://localhost:4009/ws |

---

## Environment Configuration

### Environment Matrix

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| `NODE_ENV` | development | staging | production |
| `LOG_LEVEL` | debug | info | warn |
| `MONGODB_URI` | localhost | staging-mongo | prod-mongo |
| `REDIS_URL` | localhost | staging-redis | prod-redis |

### Required Variables Per Service

#### All Services

```bash
# Core (required)
NODE_ENV=development|staging|production
PORT=4001

# Database
MONGODB_URI=mongodb://localhost:27017/rez_dev
REDIS_URL=redis://localhost:6379

# Security (MUST be unique per environment)
JWT_SECRET=<min-64-char-random-string>
JWT_REFRESH_SECRET=<min-64-char-random-string>
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"unique-token"}

# Service Discovery
SERVICE_NAME=rez-auth-service
SERVICE_URL=http://localhost:4001
```

#### Auth Service

```bash
BCRYPT_ROUNDS=12  # Must be 12+ in production
OTP_HMAC_SECRET=<32-char-random>
OTP_TOTP_ENCRYPTION_KEY=<32-char-random>

# External services
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
SENDGRID_API_KEY=<key>
```

#### Payment Service

```bash
RAZORPAY_KEY_ID=<key_id>
RAZORPAY_KEY_SECRET=<key_secret>
RAZORPAY_WEBHOOK_SECRET=<webhook_secret>

WALLET_SERVICE_URL=http://localhost:4002
```

#### Intent Graph (AI)

```bash
OPENAI_API_KEY=<key>
LANGCHAIN_API_KEY=<key>  # Optional
JWT_SECRET_FOR_WS=<secret>  # For WebSocket JWT validation
```

### Secret Generation

```bash
# Generate secure secrets
openssl rand -base64 64

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Service Deployment

### Deployment Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                     GitHub Actions CI/CD                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to branch                                                   │
│       │                                                           │
│       ▼                                                           │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     │
│  │  Lint  │────▶│  Build  │────▶│  Test   │────▶│ Security│     │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘     │
│                                                          │       │
│                                                          ▼       │
│                                                   ┌─────────┐   │
│  Merge to main                                     │ Deploy  │   │
│       │                                            └─────────┘   │
│       ▼                                                  │       │
│  ┌─────────┐     ┌─────────┐                              │       │
│  │  Build  │────▶│  Push   │──────────────────────────────┘       │
│  │ Images  │     │ Registry│                                      │
│  └─────────┘     └─────────┘                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Kubernetes Deployment

#### Create Namespace

```bash
kubectl create namespace rez-production
kubectl config set-context --current --namespace=rez-production
```

#### Apply Base Config

```bash
# Apply secrets
kubectl apply -f k8s/secrets/

# Apply config maps
kubectl apply -f k8s/configmaps/

# Apply services (headless for internal)
kubectl apply -f k8s/services/
```

#### Deploy Service

```bash
# Build and push image
docker build -t gcr.io/rez-platform/rez-auth-service:v1.2.3 .
docker push gcr.io/rez-platform/rez-auth-service:v1.2.3

# Update deployment
kubectl set image deployment/rez-auth-service \
  rez-auth-service=gcr.io/rez-platform/rez-auth-service:v1.2.3

# Watch rollout
kubectl rollout status deployment/rez-auth-service
```

#### Helm Deployment (Recommended)

```bash
# Add helm repo
helm repo add rez https://charts.rez-platform.com

# Install with values
helm upgrade --install auth-service rez/auth-service \
  --namespace rez-production \
  --values values.prod.yaml

# Rollback if needed
helm rollback auth-service
```

### Render Deployment

For services deployed to Render:

```yaml
# render.yaml
services:
  - type: web
    name: rez-auth-service
    env: node
    region: singapore
    plan: pro
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

### Health Checks

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /health` | Basic liveness | `{ "status": "ok" }` |
| `GET /health/ready` | Readiness | `{ "status": "ready", "mongo": true, "redis": true }` |
| `GET /health/deps` | Dependencies | `{ "mongo": "connected", "redis": "connected" }` |

---

## Database Migrations

### Migration Strategy

1. **Zero-downtime migrations** using:
   - Backward-compatible schema changes
   - Two-phase deployments
   - Feature flags

2. **Migration execution order:**
   ```
   1. Add new fields (nullable, with defaults)
   2. Deploy new code (reads new + old)
   3. Backfill existing data
   4. Make field required
   5. Remove old code
   ```

### Running Migrations

```bash
# For services with migrate-mongo
cd RABTUL-Technologies/rez-auth-service
npm run migrate:up

# For services with Prisma
npx prisma migrate deploy

# For raw MongoDB migrations
mongosh < migrations/001_add_indexes.js
```

### Index Creation

```javascript
// migrations/001_add_indexes.js
db.payments.createIndex(
  { "userId": 1, "createdAt": -1 },
  { name: "idx_user_created", background: true }
);

db.payments.createIndex(
  { "status": 1, "createdAt": -1 },
  { name: "idx_status_created", background: true }
);
```

### Rollback Migration

```bash
# With migrate-mongo
npm run migrate:down

# With Prisma
npx prisma migrate resolve --rolled-back "20231201_add_indexes"
```

---

## Monitoring Setup

### Prometheus Metrics

All services expose metrics at `/metrics`:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `db_operation_duration_seconds` | Histogram | Database latency |
| `queue_jobs_total` | Counter | BullMQ jobs |
| `payment_transactions_total` | Counter | Payment attempts |

### Alert Rules

```yaml
# prometheus/alert-rules.yml
groups:
  - name: rez-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: ServiceDown
        expr: up{job=~"rez-.*"} == 0
        for: 1m
        labels:
          severity: critical
```

### Grafana Dashboards

Import from `grafana/dashboards/`:
- ReZ Platform Overview
- Payment Service Health
- AI/ML Service Metrics
- Infrastructure Status

### Log Aggregation

```bash
# View logs for specific service
kubectl logs -l app=rez-auth-service -f

# Search logs
kubectl logs -l app=rez-payment-service | grep -i error

# Export logs
kubectl logs -l app=rez-auth-service --since=1h > auth_logs.txt
```

---

## Rollback Procedures

### Kubernetes Rollback

```bash
# Check revision history
kubectl rollout history deployment/rez-auth-service

# Rollback to previous version
kubectl rollout undo deployment/rez-auth-service

# Rollback to specific version
kubectl rollout undo deployment/rez-auth-service --to-revision=3
```

### Database Rollback

```bash
# Only if absolutely necessary
mongosh < migrations/rollback_001.js

# Verify data integrity
npm run verify:data
```

### Feature Flag Rollback

```bash
# Disable feature via environment
kubectl set env deployment/rez-auth-service \
  FEATURE_NEW_CHECKOUT=false

# Or via feature flag service
curl -X POST https://flags.rez-app.com/disable \
  -d '{"flag": "new_checkout_flow"}'
```

### Emergency Contacts

| Role | Contact | Available |
|------|---------|-----------|
| Platform Lead | platform@rez-app.com | 24/7 |
| On-call Engineer | PagerDuty | 24/7 |
| DevOps Lead | devops@rez-app.com | Business hours |

---

## Appendix: Service Ports Reference

| Service | Port | Protocol |
|---------|------|----------|
| rez-auth-service | 4001 | HTTP |
| rez-payment-service | 3001 | HTTP |
| rez-wallet-service | 4002 | HTTP |
| rez-order-service | 4003 | HTTP |
| rez-catalog-service | 4004 | HTTP |
| rez-search-service | 4005 | HTTP |
| rez-delivery-service | 4006 | HTTP |
| rez-notifications-hub | 4007 | HTTP |
| rez-menu-service | 4008 | HTTP |
| rez-intent-graph | 4009 | HTTP/WS |

---

**Document End**

*For support, contact the Platform Team at platform@rez-app.com*
