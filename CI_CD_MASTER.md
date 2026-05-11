# ReZ Ecosystem CI/CD Master Documentation

**Version:** 1.0.0
**Last Updated:** 2026-05-11
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Service Inventory](#service-inventory)
4. [Deployment Pipeline](#deployment-pipeline)
5. [Render Configuration](#render-configuration)
6. [CI/CD Workflow](#cicd-workflow)
7. [Environment Management](#environment-management)
8. [Monitoring & Observability](#monitoring--observability)
9. [Troubleshooting](#troubleshooting)
10. [Security](#security)
11. [Rollback Procedures](#rollback-procedures)

---

## Overview

This document describes the CI/CD pipeline and deployment infrastructure for the ReZ ecosystem, a comprehensive restaurant technology platform with 100+ microservices.

### Key Objectives

- **Automated Deployments**: Zero-touch deployment from commit to production
- **Environment Parity**: Consistent configuration across staging and production
- **Scalability**: Auto-scaling based on traffic patterns
- **Observability**: Full visibility into deployment status and health
- **Security**: Secrets management and secure configurations

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GitHub Repository                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ REZ-Media   │  │  REZ-Intel  │  │ REZ-Merchant│  │ REZ-Consumer│       │
│  │   (20+ svcs)│  │  (25+ svcs) │  │  (15+ svcs) │  │  (10+ svcs) │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
└─────────┼────────────────┼────────────────┼────────────────┼──────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub Actions CI                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Build     │  │    Test     │  │   Lint      │  │   Security  │       │
│  │ Validation  │  │   Suites    │  │   Check     │  │   Scan      │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
└─────────┼────────────────┼────────────────┼────────────────┼──────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Render Cloud                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         STAGING ENVIRONMENT                         │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │    │
│  │  │ API GW  │ │  Auth   │ │Analytics│ │  ML     │ │ Notif.  │      │    │
│  │  │ (Free)  │ │(Starter)│ │(Starter)│ │(Starter)│ │ (Free)  │      │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │    │
│  │  │ Payment │ │ Inventory│ │ Loyalty │ │  POS    │ │ Kitchen │      │    │
│  │  │(Starter)│ │ (Free)   │ │(Starter)│ │(Starter)│ │(Starter)│      │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                                      │ Manual Promotion                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        PRODUCTION ENVIRONMENT                       │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │    │
│  │  │ API GW  │ │  Auth   │ │Analytics│ │  ML     │ │ Notif.  │      │    │
│  │  │(Starter)│ │(Starter)│ │(Starter)│ │(Starter)│ │(Starter)│      │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │    │
│  │  │ Payment │ │ Inventory│ │ Loyalty │ │  POS    │ │ Kitchen │      │    │
│  │  │(Starter)│ │(Starter)│ │(Starter)│ │(Starter)│ │(Starter)│      │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Inventory

### Core Services (Essential)

| Service | Type | Region | Plan | Priority |
|---------|------|--------|------|----------|
| rez-api-gateway | Web (Docker) | Oregon | Starter | Critical |
| rez-auth-service | Web (Node) | Oregon | Starter | Critical |
| rez-core-platform | Web (Node) | Oregon | Starter | Critical |
| rez-identity-graph | Web (Node) | Oregon | Starter | High |

### Media Services

| Service | Type | Region | Plan |
|---------|------|--------|------|
| rez-automation-service | Web (Node) | Oregon | Free |
| REZ-marketing-service | Web (Node) | Oregon | Starter |
| REZ-ads-service | Web (Node) | Oregon | Starter |
| REZ-gamification-service | Web (Node) | Oregon | Free |
| REZ-communications-platform | Web (Node) | Oregon | Starter |

### Intelligence Services

| Service | Type | Region | Plan |
|---------|------|--------|------|
| REZ-ledger-service | Web (Node) | Oregon | Free |
| REZ-cdp-service | Web (Node) | Oregon | Starter |
| REZ-personalization-engine | Web (Node) | Oregon | Starter |
| REZ-recommendation-engine | Web (Node) | Oregon | Starter |
| REZ-action-engine | Web (Node) | Oregon | Starter |
| REZ-insights-service | Web (Node) | Oregon | Starter |
| rez-intent-graph | Web (Node) | Oregon | Starter |

### Merchant Services

| Service | Type | Region | Plan |
|---------|------|--------|------|
| rez-merchant-service | Web (Node) | Oregon | Starter |
| rez-app-merchant | Web (Node) | Oregon | Free |
| rez-merchant-copilot | Web (Node) | Oregon | Starter |
| rez-merchant-integrations | Web (Node) | Oregon | Free |

### Consumer Services

| Service | Type | Region | Plan |
|---------|------|--------|------|
| rez-app-consumer | Web (Node) | Oregon | Free |
| rez-web-menu | Web (Node) | Oregon | Free |
| Rendez | Web (Node) | Oregon | Free |

### Payment & Finance

| Service | Type | Region | Plan |
|---------|------|--------|------|
| rez-payment-service | Web (Node) | Oregon | Starter |
| rez-billing-service | Web (Node) | Oregon | Starter |
| rez-finance-service | Web (Node) | Oregon | Starter |
| rez-recharge-service | Web (Node) | Oregon | Free |

### Utility Services

| Service | Type | Region | Plan |
|---------|------|--------|------|
| rez-notification-events | Web (Node) | Oregon | Free |
| rez-score-service | Web (Node) | Oregon | Free |
| rez-procurement-service | Web (Node) | Oregon | Free |
| rez-copilot | Web (Node) | Oregon | Starter |
| rez-observability | Web (Node) | Oregon | Starter |

---

## Deployment Pipeline

### Pipeline Stages

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CI PIPELINE                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Stage 1: PR Validation (On Pull Request)                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ✓ Lint (ESLint/Prettier)        →  ~30 seconds                        │  │
│  │  ✓ Type Check (TypeScript)       →  ~60 seconds                        │  │
│  │  ✓ Unit Tests                    →  ~120 seconds                       │  │
│  │  ✓ Security Scan (Snyk/npm audit)→  ~30 seconds                        │  │
│  │  ✓ Build Validation              →  ~120 seconds                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  Stage 2: Merge Validation (On Merge to Main)                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ✓ All PR Validation Steps                                            │  │
│  │  ✓ Integration Tests               →  ~300 seconds                     │  │
│  │  ✓ Docker Build (if applicable)    →  ~180 seconds                     │  │
│  │  ✓ Push to Container Registry                                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  Stage 3: Staging Deployment (Automatic)                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ✓ Deploy to Staging Render                                           │  │
│  │  ✓ Health Check Verification     →  ~60 seconds                      │  │
│  │  ✓ Smoke Tests                   →  ~120 seconds                       │  │
│  │  ✓ Notify on Slack (success/failure)                                  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  Stage 4: Production Deployment (Manual Approval)                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  ✓ Deploy to Production Render                                         │  │
│  │  ✓ Rolling Update (zero-downtime)                                     │  │
│  │  ✓ Health Check Verification                                          │  │
│  │  ✓ Notify on Slack + Email                                            │  │
│  │  ✓ Create Deployment Record                                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}

jobs:
  validate:
    name: Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test -- --coverage

      - name: Build
        run: npm run build

  deploy-staging:
    name: Deploy Staging
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/v1/services/${{ vars.RENDER_STAGING_SERVICE_ID }}/deploys \
            -H "Authorization: Bearer ${{ env.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": false}'

      - name: Wait for deployment
        run: sleep 30

      - name: Health check
        run: |
          curl -f https://${{ vars.RENDER_STAGING_SERVICE }}.onrender.com/health \
            || exit 1

  deploy-production:
    name: Deploy Production
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/v1/services/${{ vars.RENDER_PROD_SERVICE_ID }}/deploys \
            -H "Authorization: Bearer ${{ env.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": false}'

      - name: Wait for deployment
        run: sleep 60

      - name: Health check
        run: |
          curl -f https://${{ vars.RENDER_PROD_SERVICE }}.onrender.com/health \
            || exit 1

      - name: Notify Slack
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            --data '{"text":"Deployment ' ${{ github.sha }} ': ' ${{ job.status }} '"}'
```

---

## Render Configuration

### Service Configuration Standards

All ReZ services follow these Render configuration standards:

#### Node.js Service Template

```yaml
# render.yaml
services:
  - type: web
    name: SERVICE_NAME
    env: node
    region: oregon
    plan: starter

    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /health

    scaling:
      minInstances: 1
      maxInstances: 3
      targetMemoryPercent: 70
      targetCPUPercent: 80

    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: LOG_LEVEL
        value: info
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true

    headers:
      - path: /*
        name: Security Headers
        value: |
          X-Content-Type-Options: nosniff
          X-Frame-Options: DENY
          X-XSS-Protection: 1; mode=block
          Referrer-Policy: strict-origin-when-cross-origin
```

#### Docker Service Template

```yaml
services:
  - type: web
    name: SERVICE_NAME
    runtime: docker
    dockerfilePath: ./Dockerfile
    region: oregon
    plan: starter

    healthCheckPath: /health
    port: 8080

    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8080
      - key: DATABASE_URL
        sync: false
```

### Database Configuration

```yaml
databases:
  - name: SERVICE_NAME-db
    plan: starter
    databaseName: service_name_db
    ipAllowList: []

redis:
  - name: SERVICE_NAME-redis
    plan: starter
    ipAllowList: []
```

### Environment Groups

Create these environment groups in Render Dashboard for shared configuration:

| Group Name | Variables | Services |
|------------|-----------|----------|
| `REZ_CORE_CONFIG` | CORE_API_URL, CORE_AUTH_TOKEN | All services |
| `REZ_DATABASE_CONFIG` | DB_POOL_SIZE, DB_TIMEOUT | All services |
| `REZ_REDIS_CONFIG` | REDIS_MAX_RETRIES, REDIS_RETRY_DELAY | All services |
| `REZ_EXTERNAL_SERVICES` | PAYMENT_GW_URL, SMS_URL, EMAIL_URL | Payment, Notification |
| `REZ_MONITORING` | SENTRY_DSN, DATADOG_KEY, LOGDNA_KEY | All services |

---

## CI/CD Workflow

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] Security scan passed
- [ ] Docker image built successfully
- [ ] Staging deployment verified
- [ ] Smoke tests passing on staging

### Deployment Commands

#### Deploy Single Service

```bash
# Set API key
export RENDER_API_KEY="your-api-key"

# Deploy specific service
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": true}' \
  "https://api.render.com/v1/services/SERVICE_ID/deploys"
```

#### Deploy All Services (using render-all.sh)

```bash
# Make script executable
chmod +x render-all.sh

# Deploy all services
./render-all.sh

# Deploy specific group
./render-all.sh --group intelligence

# Dry run
./render-all.sh --dry-run

# Check status
./render-all.sh --status
```

### Zero-Downtime Deployment

Render automatically performs zero-downtime deployments:

1. **Blue-Green Strategy**: New instance starts before old is removed
2. **Health Checks**: Must pass before traffic switches
3. **Graceful Shutdown**: 30-second timeout for in-flight requests

---

## Environment Management

### Environment Variables

| Environment | Variables | Source |
|-------------|-----------|--------|
| Development | Local `.env` file | Developer machine |
| Staging | Render Environment Groups | Auto-deployed |
| Production | Render Environment Groups | Manual promotion |

### Configuration Hierarchy

```
1. Service-specific env vars (highest priority)
2. Environment Groups
3. render.yaml defaults
4. Application defaults (lowest priority)
```

### Secrets Management

**DO:**
- Store secrets in Render Environment Groups
- Use `generateValue: true` for new secrets
- Rotate secrets quarterly
- Use different values per environment

**DON'T:**
- Commit secrets to Git
- Use same secrets across environments
- Share secrets in Slack/email
- Hardcode secrets in code

---

## Monitoring & Observability

### Health Check Endpoint

All services must implement `/health`:

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check dependencies
    await checkDatabase();
    await checkRedis();
    await checkExternalServices();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Response Time | > 500ms (p95) | Scale up, investigate |
| Error Rate | > 1% | Alert on-call |
| Memory Usage | > 80% | Scale up |
| CPU Usage | > 80% | Scale up |
| Health Check Failures | > 3 in 5 min | Alert + auto-restart |

### Logging

```javascript
// Use structured logging
logger.info('Request processed', {
  method: req.method,
  path: req.path,
  duration: Date.now() - startTime,
  statusCode: res.statusCode,
  requestId: req.id
});
```

---

## Troubleshooting

### Common Issues

#### Deployment Failed

1. Check build logs in Render Dashboard
2. Verify environment variables are set
3. Check for TypeScript/build errors locally
4. Ensure Dockerfile is valid (if applicable)

#### Health Check Failing

1. Verify `/health` endpoint returns 200
2. Check service can connect to dependencies
3. Increase health check timeout
4. Review application logs

#### Service Not Starting

1. Check `startCommand` is correct
2. Verify PORT environment variable
3. Check for missing dependencies
4. Review build output

### Debug Commands

```bash
# Check service status
curl https://service.onrender.com/health

# View recent logs (via Render CLI)
render logs --service=service-name --tail=100

# Restart service
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/SERVICE_ID/deploys"
```

---

## Security

### Security Headers

All web services must include security headers:

```yaml
headers:
  - path: /*
    name: Security Headers
    value: |
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      X-XSS-Protection: 1; mode=block
      Referrer-Policy: strict-origin-when-cross-origin
      Content-Security-Policy: default-src 'self'
```

### API Key Management

1. **Generate**: Render Dashboard > API Keys
2. **Store**: GitHub Secrets
3. **Rotate**: Every 90 days
4. **Revoke**: Immediately if compromised

### IP Allowlisting

For database connections:

```yaml
databases:
  - name: SERVICE_NAME-db
    ipAllowList:
      - 0.0.0.0/0  # Allow all (default)
      # Or specific IPs:
      # - 10.0.0.0/8
```

---

## Rollback Procedures

### Automatic Rollback

Render automatically rolls back if:
- Health check fails 3 consecutive times
- Service crashes during deployment

### Manual Rollback

```bash
# Via Render Dashboard:
# 1. Go to Service > Deployments
# 2. Find last working deployment
# 3. Click "Rollback"

# Via API:
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deploymentId": "PREVIOUS_DEPLOYMENT_ID"}' \
  "https://api.render.com/v1/services/SERVICE_ID/rollbacks"
```

### Database Rollback

**IMPORTANT**: Database changes are not automatically rolled back.

1. Restore from backup (if available)
2. Run manual migrations to revert
3. Test thoroughly before proceeding

---

## Service Catalog

See [SERVICE_REGISTRY.md](./SERVICE_REGISTRY.md) for complete service inventory with deployment status.

---

## Quick Reference

### Useful Commands

```bash
# Deploy all services
./render-all.sh

# Deploy specific group
./render-all.sh --group intelligence

# Dry run
./render-all.sh --dry-run

# Check status
./render-all.sh --status

# Deploy with custom parallel count
./render-all.sh --parallel 3

# Wait for deployments
./render-all.sh --wait
```

### Environment Variables

```bash
RENDER_API_KEY=your-api-key
RENDER_YAML_ROOT=/path/to/project
```

### Render CLI (Optional)

```bash
# Install
npm install -g @render/cli

# Login
render login

# List services
render services list

# View logs
render logs --service=service-name

# Trigger deploy
render deploy --service=service-name
```

---

## Support

- **Documentation**: See Render Dashboard for service-specific docs
- **Issues**: Open ticket in project repository
- **Urgent**: Contact DevOps team via Slack #devops-support

---

*Document Version: 1.0.0*
*Last Updated: 2026-05-11*
