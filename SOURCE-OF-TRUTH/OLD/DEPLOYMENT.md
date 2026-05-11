# ReZ Ecosystem - Deployment Documentation

**Last Updated:** 2026-05-01
**Purpose:** Consolidated deployment guide for all services and apps

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Mobile Apps](#mobile-apps)
3. [Backend Services](#backend-services)
4. [Web Apps](#web-apps)
5. [Hotel Stack](#hotel-stack)
6. [Docker Development](#docker-development)
7. [Monitoring Stack](#monitoring-stack)

---

## Quick Reference

### Deploy All Services

```bash
# Deploy 10 services via git push
./deploy-rtmn.sh
```

### Publish Packages

```bash
# Publish all shared packages to npm
./npm-scripts.sh build

# Publish specific package
./npm-scripts.sh shared-types
./npm-scripts.sh rez-shared
./npm-scripts.sh rez-intent-capture-sdk
./npm-scripts.sh rez-agent-memory
```

---

## Mobile Apps

### EAS Build Commands

#### rez-app-consumer

```bash
cd rez-app-consumer

# Configure
eas build:configure --platform ios
eas build:configure --platform android

# Development builds
eas build --platform ios --profile development
eas build --platform android --profile development

# Preview builds
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production builds
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

#### rez-app-merchant

```bash
cd rez-app-merchant

eas build --platform ios --profile production
eas build --platform android --profile production
```

#### rez-app-admin

```bash
cd rez-app-admin

eas build --platform ios --profile production
eas build --platform android --profile production
```

### EAS Project IDs

| App | EAS Project ID |
|-----|----------------|
| rez-app-consumer | cf84e3b3-4a96-4c9b-a438-465c29fbf720 |
| rez-app-merchant | 77203219-4cd5-4ca3-9210-1cc89b7456fc |
| rez-app-admin | 71e8a58b-aaec-472a-aba6-4afd001576fb |

---

## Backend Services

### Render Deployment

Each service is deployed to Render with:
- Auto-deploy on push to main branch
- Health check at `/health`
- Prometheus metrics at `/metrics`

#### Service URLs

| Service | URL |
|---------|-----|
| rez-auth-service | https://rez-auth-service.onrender.com |
| rez-wallet-service | https://rez-wallet-service-36vo.onrender.com |
| rez-order-service | https://rez-order-service.onrender.com |
| rez-payment-service | https://rez-payment-service.onrender.com |
| rez-merchant-service | https://rez-merchant-service-n3q2.onrender.com |
| rez-catalog-service | https://rez-catalog-service-1.onrender.com |
| rez-search-service | https://rez-search-service.onrender.com |
| rez-gamification-service | https://rez-gamification-service-3b5d.onrender.com |
| rez-ads-service | https://rez-ads-service.onrender.com |
| rez-marketing-service | https://rez-marketing-service.onrender.com |
| rez-backend | https://rez-backend-8dfu.onrender.com |
| analytics-events | https://analytics-events-37yy.onrender.com |

#### Deploy Hooks

```bash
# Format for docker-compose.example.env
RENDER_AUTH_SERVICE_DEPLOY_HOOK=https://api.render.com/deploy/srv-xxx?key=xxx
```

### Service Ports

| Service | HTTP Port | Metrics Port |
|---------|-----------|--------------|
| rez-auth-service | 4002 | 4102 |
| rez-wallet-service | 4004 | - |
| rez-order-service | 3006 | - |
| rez-payment-service | 4001 | - |
| rez-merchant-service | 4005 | - |
| rez-catalog-service | 3005 | - |
| rez-search-service | 4003 | - |
| rez-gamification-service | 3001 | 3004 (worker) |
| rez-ads-service | 4007 | - |
| rez-marketing-service | 4000 | - |
| rez-scheduler-service | 3012 | - |
| rez-finance-service | 4006 | - |
| rez-karma-service | 3009 | - |
| rez-corpperks-service | 4013 | - |
| rez-hotel-service | 4015 | - |
| rez-procurement-service | 4012 | - |

---

## Web Apps

### rez-now

| Attribute | Value |
|-----------|-------|
| **Platform** | Vercel |
| **Framework** | Next.js 16 |
| **Output** | Standalone |
| **PWA** | Yes (service worker) |

**Vercel Configuration:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Deploy:**
```bash
cd rez-now
vercel --prod
```

### rez-web-menu

| Attribute | Value |
|-----------|-------|
| **Platform** | Vercel |
| **Framework** | Next.js |

**Note:** `rez-web-menu` directory contains backend services, not a frontend app.

---

## Hotel Stack

### Render Deployment

| Service | Render Name | URL |
|---------|-------------|-----|
| API | hotel-ota-api | https://hotel-ota-api.onrender.com |
| OTA Web | hotel-ota-web | https://hotel-ota-web.onrender.com |
| Hotel Panel | hotel-ota-hotel-panel | https://hotel-ota-hotel-panel.onrender.com |
| Admin Panel | hotel-ota-admin | https://hotel-ota-admin.onrender.com |

### Build Configuration

```yaml
# render.yaml
buildCommand: npm ci && npm run build
healthCheckPath: /health
```

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=...
REFRESH_TOKEN_SECRET=...
ADMIN_JWT_SECRET=...

# Payment
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# ReZ Integration
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
INTERNAL_SERVICE_TOKEN=...

# Frontend URLs
FRONTEND_URL=https://hotel-ota-web.onrender.com
HOTEL_PANEL_URL=https://hotel-ota-hotel-panel.onrender.com
ADMIN_PANEL_URL=https://hotel-ota-admin.onrender.com
```

---

## Docker Development

### Main Stack

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

### Observability Stack

```bash
# Start Prometheus, Grafana, Loki, Jaeger
docker-compose -f docker-compose.observability.yml up -d

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin123)
# Loki: http://localhost:3100
# Jaeger: http://localhost:16686
```

### Redis Sentinel (HA)

```bash
# Start Redis with Sentinel
docker-compose -f docker-compose.redis-sentinel.yml up -d

# Sentinel ports: 26379, 26380, 26381
```

### ReZ Mind

```bash
# Start intent graph
docker-compose -f docker-compose.rez-mind.yml up -d
```

### Docker Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main dev stack |
| `docker-compose.observability.yml` | Monitoring stack |
| `docker-compose.redis-sentinel.yml` | Redis HA |
| `docker-compose.logging.yml` | Loki/Promtail |
| `docker-compose.dev.yml` | Simplified dev |
| `docker-compose.rez-mind.yml` | Intent graph |

---

## Monitoring Stack

### Prometheus

**Port:** 9090
**Config:** `/prometheus.yml`

**Scrape Targets:**
```yaml
scrape_configs:
  - job_name: 'rez-auth-service'
    static_configs:
      - targets: ['rez-auth-service:4102']
  - job_name: 'rez-merchant-service'
    static_configs:
      - targets: ['rez-merchant-service:4005']
```

### Grafana

**Port:** 3000 (or 3001)
**Default Login:** admin / admin123
**Dashboards:** `/grafana/provisioning/dashboards/json/rez-services.json`

**Datasources:**
- Prometheus: http://prometheus:9090
- Loki: http://loki:3100
- Jaeger: http://jaeger:16686

### Loki

**Port:** 3100
**Config:** `/loki-config.yml`

### Alertmanager

**Port:** 9093
**Config:** `/alertmanager.yml`

**Routing:**
- Critical → PagerDuty
- Warning → Slack

---

## CI/CD

### GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR/push | Tests, linting |
| `deploy.yml` | Push to main | Deploy to staging/production |
| `deploy-cloudflare-pages.yml` | Push | Cloudflare Pages |
| `cost-alerts.yml` | Schedule | AWS cost monitoring |

### Architecture Fitness Tests

```bash
# Run all tests
bash scripts/arch-fitness/run-all.sh

# Install pre-commit hooks
bash scripts/arch-fitness/install-hooks.sh
```

---

## Health Checks

### All Services

| Endpoint | Purpose |
|----------|---------|
| `GET /health/live` | Liveness probe |
| `GET /health/ready` | Readiness probe |
| `GET /health/detailed` | Full health status |
| `GET /metrics` | Prometheus metrics |

### Render Health Check

```yaml
# render.yaml
healthCheckPath: /health
```

---

## Backup & Recovery

### MongoDB Backup

```bash
# Create backup
mongodump --uri="mongodb://user:pass@host:27017/db" --out=/backups/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://user:pass@host:27017/db" /backups/20260501
```

### PostgreSQL Backup (Hotel OTA)

```bash
# Create backup
pg_dump -h host -U user dbname > backup.sql

# Restore
psql -h host -U user dbname < backup.sql
```

---

## Troubleshooting

### Service Down

1. Check Render dashboard for deployment status
2. Check health endpoint: `curl https://<service>.onrender.com/health`
3. Check logs in Render
4. Verify environment variables
5. Redeploy if needed

### Docker Issues

```bash
# Clean up
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection

```bash
# Test MongoDB
mongosh --uri="mongodb://user:pass@host:27017/db"

# Test Redis
redis-cli -u redis://:pass@host:6379 PING
```

---

**Next:** [README.md](README.md) - Quick navigation
