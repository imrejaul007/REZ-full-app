# REZ Infrastructure Final Audit Report

**Date:** April 29, 2026  
**Auditor:** Claude Code DevOps Architect  
**Status:** READY FOR REVIEW

---

## Executive Summary

This audit covers the complete REZ infrastructure including:
- **render.yaml files:** 60+ services
- **docker-compose files:** 8+ orchestrations
- **GitHub workflows:** 15+ CI/CD pipelines
- **Environment configs:** 50+ .env files

**Total Services Deployed:** 60+ microservices across multiple domains

---

## Section 1: All Render.yaml Files

### Core Backend Services (Render.com)

| Service | Port | Runtime | Memory | AutoDeploy | Region |
|---------|------|---------|--------|------------|--------|
| rez-api-gateway | 3000 | Docker | - | - | - |
| rez-auth-service | 4002 | Node | 512MB | - | singapore |
| rez-wallet-service | 4004 | Node | 512MB | false | - |
| rez-payment-service | 4001 | Node | 512MB | false | - |
| rez-order-service | 4005 | Node | 512MB | false | - |
| rez-merchant-service | 4005 | Node | 512MB | false | - |
| rez-search-service | 4003 | Node | - | - | - |
| rez-catalog-service | 3005 | Node | - | - | - |
| rez-finance-service | 4005 | Node | - | - | - |
| rez-gamification-service | 3001 | Node | - | false | singapore |
| rez-profile-service | 10000 | Node | - | - | singapore |

### AI/ML Services

| Service | Port | Instances | Runtime | Region |
|---------|------|----------|---------|--------|
| rez-intent-graph | 3001 (API), 3005 (Agent) | 3+2 | Node | singapore |
| rez-intelligence-hub | 4020 | 1 | Node | singapore |
| rez-personalization-engine | 4017 | 1 | Node | - |
| rez-targeting-engine | 3013 | 1 | Node | - |
| rez-action-engine | 3014 | 1 | Node | - |
| rez-user-intelligence | 3004 | 1 | Node | - |
| rez-merchant-intelligence | 4012 | 1 | Node | - |
| rez-intent-predictor | - | - | Node | - |
| rez-decision-service | 4027 | 1 | Node | - |

### AI Copilots

| Service | Port | Runtime |
|---------|------|---------|
| rez-consumer-copilot | 4021 | Node |
| rez-merchant-copilot | 4022 | Node |
| REZ-support-copilot | 4033 | Node |

### Revenue Services

| Service | Port | Runtime |
|---------|------|---------|
| rez-bbps-service | 4110 | Node |
| rez-recharge-service | 4111 | Node |
| rez-einvoice-service | 4112 | Node |

### ML Services

| Service | Port | Runtime |
|---------|------|---------|
| rez-ml-feature-store | 4100 | Node |
| rez-ml-model-registry | 4101 | Node |
| rez-training-data-service | 4102 | Node |
| rez-fraud-detection-service | 4103 | Node |
| rez-price-optimization-service | 4104 | Node |
| rez-ab-testing-service | 4105 | Node |
| rez-data-quality-monitor | 4106 | Node |
| rez-ml-retraining-pipeline | 4107 | Node |

### Marketing & Ads

| Service | Port | Runtime | Repo |
|---------|------|---------|------|
| rez-marketing-service | 4000 | Node | - |
| rez-ad-campaigns | - | Node | imrejaul007/rez-ads-service |
| rez-ad-platform | 4028 | Node | - |
| rez-ad-ai | - | Node | - |

### Supporting Services

| Service | Port | Runtime | Type |
|---------|------|---------|------|
| rez-scheduler-service | 3012 | Node | web |
| rez-automation-service | 3016 | Node | web |
| rez-corporate-service | 4030 | Node | web |
| rez-feedback-service | 4010 | Node | web |
| rez-stayown-service | 4015 | Node | web |
| rez-push-service | 4013 | Node | web |
| rez-notification-events | 3001 | Node | worker |
| rez-observability | 4031 | Node | web |
| rez-travel-service | 4050 | Node | web_service |
| rez-feature-flags | - | Node | - |
| rez-knowledge-base-service | - | Node | - |
| rez-media-events | - | Node | - |
| rez-event-platform | - | Node | - |
| rez-merchant-integrations | - | Node | - |

### Frontend Applications

| Service | Port | Runtime |
|---------|------|---------|
| nextabizz-web | 3001 | Node |
| hotel-panel | 3002 | Node |
| rez-now | 3003 | Node |
| rez-app-consumer | - | Next.js |
| rez-app-merchant | - | Next.js |
| hotel-ota-api | 3000 | Node |

### CorpPerks Suite

| Service | Port | Plan |
|---------|------|------|
| corpperks-api | 4013 | starter |
| corpperks-hotel | 4011 | starter |
| corpperks-procurement | 4012 | starter |
| corpperks-redis | - | starter |

### Hotel/PMS Services

| Service | Location |
|---------|----------|
| Hotel OTA | ./Hotel OTA/ |
| Resturistan App | ./Resturistan App/restauranthub/ |
| Rendez Backend | ./Rendez/rendez-backend/ |

---

## Section 2: Docker-Compose Files

### Root Level Orchestrations

| File | Services | Purpose |
|------|----------|---------|
| docker-compose.yml | 20+ | Full local development stack |
| docker-compose.full.yml | 30+ | Complete production stack |
| docker-compose.infra.yml | 2 | MongoDB + Redis only |
| docker-compose.dev.yml | - | Development environment |
| docker-compose.unified.yml | 8 | Intent/Copilot/Decision services |
| docker-compose.logging.yml | 3 | Loki + Promtail + Grafana |
| docker-compose.observability.yml | 6 | Full observability stack |
| docker-compose.redis-sentinel.yml | - | Redis Sentinel setup |
| docker-compose.rez-mind.yml | - | REZ MIND services |

### Component-Level

| Location | Files |
|----------|-------|
| ./rez-karma-service/ | docker-compose.yml |
| ./rez-feedback-service/ | docker-compose.yml |
| ./rez-scheduler-service/ | docker-compose.microservices.yml |
| ./rez-unified-messaging/ | docker-compose.yml |
| ./rez-decision-service/ | docker-compose.yml |
| ./rez-user-intelligence-service/ | docker-compose.yml |
| ./rez-merchant-intelligence-service/ | docker-compose.yml |
| ./Hotel OTA/infrastructure/ | docker-compose.yml |
| ./Hotel OTA/hotel-pms/hotel-management-master/ | docker-compose.yml |
| ./rezbackend/rez-backend-master/ | 5 files (elk, monitoring, microservices, prod, standard) |
| ./Resturistan App/restauranthub/ | 8 files (redis, monitoring, database, microservices, prod variants) |
| ./Rendez/ | docker-compose.yml, rendez-backend/docker-compose.yml |
| ./CorpPerks/ | docker-compose.yml |
| ./rez-intent-service/ | docker-compose.yml |
| ./monitoring/ | docker-compose.yml |
| ./packages/shared-types/ | 6 docker-compose files |

### Infrastructure Services

**Primary Stack (docker-compose.yml):**
- mongodb-primary (port 27017)
- mongodb-secondary-1 (port 27018)
- mongodb-secondary-2 (port 27019)
- mongodb-init (replica set setup)
- mongodb-backup
- redis (port 6379)
- postgres (port 5432)
- auth-api (port 4002)
- merchant-api (port 4005)
- rendez-backend (port 4000)
- hotel-ota-api (port 3000)
- rez-intelligence-hub (port 4020)
- rez-intent-graph (port 3007)
- rez-personalization-engine (port 4017)
- rez-targeting-engine (port 3013)
- rez-action-engine (port 3014)
- rez-scheduler-service (port 3012)
- rez-automation-service (port 3016)
- rez-corporate-service (port 4030)
- rez-feedback-service (port 4010)
- rez-stayown-service (port 4015)
- nextabizz-web (port 3001)
- hotel-panel (port 3002)
- rez-now (port 3003)

**Observability Stack:**
- prometheus (port 9090)
- grafana (port 3000/3001)
- loki (port 3100)
- promtail
- jaeger (ports 16686, 14268, 4317, 4318)
- alertmanager (port 9093)

---

## Section 3: CI/CD Workflows

### Root .github/workflows/

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| api-tests.yml | push, pull_request | API integration tests |
| deploy-cloudflare-pages.yml | push | Frontend deployment |
| cost-alerts.yml | schedule | AWS cost monitoring |
| shared-types-ci.yml | push, PR | Shared types validation |
| type-check.yml | push, PR | TypeScript checking |
| deploy.yml | push, workflow_dispatch | Full deployment pipeline |
| ai-types-ci.yml | push, PR | AI types validation |
| ml-pipeline.yml | schedule, push, dispatch | ML training & deployment |
| rollback.yml | workflow_dispatch | Emergency rollback |
| ml-training.yml | schedule | Scheduled ML training |
| auto-commit.yml | schedule | Automated commits |
| docker.yml | push, PR | Docker image builds |
| ci.yml | push, PR | Basic CI (test, lint, security) |

### Service-Specific Workflows

| Service | Workflows |
|---------|-----------|
| rez-order-service | test.yml, auto-merge.yml, auto-rebase.yml, order-service-ci.yml |

### deploy.yml Pipeline Stages

1. **quality-gate** - Type check, lint
2. **build-images** - 16 services (matrix build)
3. **deploy-staging** - kubectl deployment to rez-staging namespace
4. **deploy-production** - kubectl deployment to rez-production namespace
5. **run-migrations** - MongoDB + PostgreSQL migrations
6. **cleanup** - Old image cleanup

### Services Built in deploy.yml
- auth-api
- merchant-api
- rendez-backend
- hotel-ota-api
- rez-intelligence-hub
- rez-intent-graph
- rez-personalization-engine
- rez-targeting-engine
- rez-action-engine
- rez-scheduler-service
- rez-automation-service
- rez-corporate-service
- rez-feedback-service
- nextabizz-web
- hotel-panel
- rez-now

### ml-pipeline.yml Stages
1. validate-data - Schema validation, data drift check
2. train - GPU training with checkpoints
3. evaluate - Threshold validation (0.85)
4. register-model - GCP Model Registry
5. deploy-staging - kubectl to ml-staging
6. deploy-production - kubectl to ml-production
7. cleanup - Old model versions

---

## Section 4: Environment Configurations

### Root Environment Files

| File | Purpose |
|------|---------|
| .env | Production secrets (NOT committed) |
| .env.example | Template with all required vars |
| .env.docker.example | Docker-specific template |
| REZ-MIND-CONFIG.env | REZ MIND service URLs |
| docker-compose.example.env | Docker compose examples |

### Service-Level .env Files (50+)

#### Core Services
- rez-auth-service/.env.example
- rez-merchant-service/.env.example
- rez-payment-service/.env.production.example
- rez-wallet-service/.env, .env.example, .env.production.example
- rez-order-service/.env.example
- rez-search-service/.env, .env.example
- rez-api-gateway/.env.production.example, .env.example

#### AI/ML Services
- rez-intent-graph/.env
- rez-intelligence-hub/.env.example
- rez-targeting-engine/.env.example
- rez-action-engine/.env.example
- rez-user-intelligence-service/.env.example
- rez-merchant-intelligence-service/.env

#### Marketing & Revenue
- rez-marketing/.env.example
- rez-ad-campaigns/.env.example

#### Supporting Services
- rez-scheduler-service/.env, .env.example, .env.phase3.example
- rez-automation-service/.env.example
- rez-feedback-service/.env.example
- rez-gamification-service/.env, .env.example
- rez-corporate-service/.env.example
- rez-stayown-service/.env
- rez-push-service/.env.example
- rez-notification-events/.env
- rez-observability/.env
- rez-profile-service/.env.example
- rez-knowledge-base-service/.env.example
- rez-media-events/.env, .env.example
- rez-travel-service/.env.example
- rez-feature-flags/.env.example
- rez-finance-service/.env
- rez-try/.env.example

#### Frontend Apps
- rez-app-consumer/.env, .env.example, .env.production.example
- rez-app-merchant/.env.example
- rez-now/.env.local, .env.example
- api-gateway/.env.example
- hotel-ota/.env.example
- rez-hotel-service/.env.example
- rez-web-menu/.env.phase3.example

#### Misc
- Hotel OTA/.env.example
- Rendez/.env.example

### Required Environment Variables

**Database:**
```
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
POSTGRES_USER=rez
POSTGRES_PASSWORD=<secret>
POSTGRES_DB=rez_dev
```

**Authentication:**
```
JWT_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
JWT_ADMIN_SECRET=<min 32 chars>
JWT_MERCHANT_SECRET=<min 32 chars>
OTP_HMAC_SECRET=<base64 64>
OTP_TOTP_ENCRYPTION_KEY=<hex 32>
REZ_OAUTH_CLIENT_SECRET=<secret>
INTERNAL_SERVICE_TOKENS_JSON={"service":"token",...}
INTERNAL_SERVICE_HMAC_SECRET=<secret>
```

**Payment:**
```
RAZORPAY_KEY_ID=<razorpay>
RAZORPAY_KEY_SECRET=<razorpay>
RAZORPAY_WEBHOOK_SECRET=<razorpay>
```

**Marketing:**
```
TWILIO_ACCOUNT_SID=<twilio>
TWILIO_AUTH_TOKEN=<twilio>
TWILIO_PHONE_NUMBER=<twilio>
WHATSAPP_TOKEN=<meta>
WHATSAPP_PHONE_ID=<meta>
WHATSAPP_APP_SECRET=<meta>
AWS_ACCESS_KEY_ID=<aws>
AWS_SECRET_ACCESS_KEY=<aws>
AWS_SES_SMTP_USER=<aws>
AWS_SES_SMTP_PASS=<aws>
```

**Cloudinary:**
```
CLOUDINARY_CLOUD_NAME=<cloudinary>
CLOUDINARY_API_KEY=<cloudinary>
CLOUDINARY_API_SECRET=<cloudinary>
```

**Observability:**
```
SENTRY_DSN=<sentry>
OTEL_SERVICE_NAME=<service>
OTEL_EXPORTER_OTLP_ENDPOINT=<otlp>
```

**Service URLs:**
```
AUTH_SERVICE_URL=https://...
WALLET_SERVICE_URL=https://...
MERCHANT_SERVICE_URL=https://...
PAYMENT_SERVICE_URL=https://...
ORDER_SERVICE_URL=https://...
CATALOG_SERVICE_URL=https://...
SEARCH_SERVICE_URL=https://...
MARKETING_SERVICE_URL=https://...
```

---

## Section 5: Issues Found

### CRITICAL Issues

#### 1. Port Conflicts
```
Port 4005: rez-order-service, rez-merchant-service, rez-finance-service
Port 3001: rez-intent-graph (API), rez-gamification-service
```
**Impact:** Service collisions in local development
**Fix:** Assign unique ports per service

#### 2. Disabled Auto-Deploy
```yaml
# rez-payment-service/render.yaml
autoDeploy: false

# rez-order-service/render.yaml
autoDeploy: false
```
**Impact:** Manual deployments required for critical services
**Fix:** Enable autoDeploy or establish release process

#### 3. Inconsistent Service Token Configuration
- Some services use: `INTERNAL_SERVICE_TOKENS_JSON`
- Some services use: `INTERNAL_SERVICE_TOKEN` (legacy)
- Some services use: `INTERNAL_SERVICE_HMAC_SECRET`
- Some services missing any internal token config

**Impact:** Inter-service communication failures
**Fix:** Standardize on `INTERNAL_SERVICE_TOKENS_JSON` format

#### 4. Hardcoded Default Passwords
```yaml
# docker-compose.infra.yml
MONGO_INITDB_ROOT_PASSWORD: changeme
# docker-compose.logging.yml
GF_SECURITY_ADMIN_PASSWORD=admin
```
**Impact:** Security vulnerability if deployed as-is
**Fix:** Use environment variables for all secrets

#### 5. Missing JWT_SECRET in Multiple Services
Services without JWT_SECRET configured:
- rez-marketing-service
- rez-ad-campaigns
- rez-ad-platform
- rez-automation-service
- rez-corporate-service

**Impact:** Authentication failures between services
**Fix:** Add JWT_SECRET to all render.yaml files

### HIGH Priority Issues

#### 6. No Health Check Interval Standardization
```yaml
# Some services use default
healthCheckInterval: 30  # rez-gamification-service
# Others use custom
healthCheckInterval: 10  # rez-intent-graph (3 instances)
```
**Impact:** Inconsistent failure detection
**Fix:** Standardize health check configuration

#### 7. Missing Memory Limits
Services without memoryMB specified:
- rez-auth-service (critical)
- rez-search-service
- rez-catalog-service
- rez-finance-service
- rez-gamification-service
- All marketing/ads services

**Impact:** OOM failures on shared hosting
**Fix:** Add memoryMB: 512 to all Node services

#### 8. Repository URL Inconsistency
```yaml
# rez-marketing/render.yaml
repo: https://github.com/imrejaul007/rez-ads-service  # Wrong repo!

# rez-ad-campaigns/render.yaml
repo: https://github.com/imrejaul007/rez-ads-service
```
**Impact:** Code from wrong repository deployed
**Fix:** Correct repository URLs

#### 9. Unused/Inactive Services
- rez-adbazaar-DELETED/ - Marked for deletion
- rez-now - No recent updates
- rez-try - Appears experimental

**Impact:** Maintenance burden, security surface
**Fix:** Archive or remove deprecated services

### MEDIUM Priority Issues

#### 10. Inconsistent Region Configuration
```yaml
# Singapore
rez-intent-graph: region: singapore
rez-profile-service: region: singapore
rez-gamification-service: region: singapore

# Not specified
rez-auth-service: (default)
rez-payment-service: (default)
```
**Impact:** Latency issues for cross-service calls
**Fix:** Standardize region to singapore

#### 11. Missing CORS_ORIGIN Configuration
Services without CORS_ORIGIN:
- rez-intent-graph
- rez-search-service (only in docker-compose)
- rez-personalization-engine
- rez-targeting-engine

**Impact:** CORS failures in browser clients
**Fix:** Add CORS_ORIGIN environment variable

#### 12. Build Command Variations
```yaml
# Most common
buildCommand: npm install && npm run build

# Variations
npm cache clean --force && npm install...  # rez-wallet-service
npm ci && npm run build  # rez-gamification-service
npm install --include=dev && npm run build  # Multiple services
```
**Impact:** Inconsistent build behavior
**Fix:** Standardize build commands

#### 13. Missing startCommand in Some render.yaml
```yaml
# rez-push-service
startCommand: node src/index.js  # Using src/ instead of dist/
```
**Impact:** Wrong entry point executed
**Fix:** Ensure consistent build/start pattern

### LOW Priority Issues

#### 14. Inconsistent Plan Selection
```yaml
# Free tier (limited)
rez-profile-service: plan: free
rez-gamification-service: plan: free

# Starter tier
rez-travel-service: plan: starter
CorpPerks services: plan: starter

# Not specified (Render default)
Most services
```
**Impact:** Performance limitations on free tier
**Fix:** Upgrade free tier services to starter/pro

#### 15. Docker Compose Network Issues
```yaml
# docker-compose.unified.yml
networks:
  default:
    name: rez-network

# docker-compose.observability.yml  
networks:
  observability:
    name: rez-observability
```
**Impact:** Service discovery failures across compose files
**Fix:** Use consistent network naming

#### 16. Hardcoded Prometheus Configuration
```yaml
# alert_rules.yml, alertmanager.yml
# Contains hardcoded Slack/PagerDuty credentials in some versions
```
**Impact:** Alert fatigue if webhooks misconfigured
**Fix:** Externalize to secrets manager

---

## Section 6: Recommendations

### Immediate Actions (1-2 weeks)

1. **Fix Port Conflicts**
   - Assign unique ports to all services
   - Document port allocations

2. **Enable Auto-Deploy**
   - Enable for rez-payment-service
   - Enable for rez-order-service
   - Or establish manual release process

3. **Standardize Service Tokens**
   - Migrate all services to INTERNAL_SERVICE_TOKENS_JSON
   - Remove legacy INTERNAL_SERVICE_TOKEN

4. **Remove Default Passwords**
   - Replace all "changeme" passwords
   - Use strong generated secrets

### Short-term (1 month)

5. **Memory Limits**
   - Add memoryMB: 512 to all Node services
   - Monitor memory usage patterns

6. **Health Check Standardization**
   - Standardize intervals to 30s
   - Add retries: 3, timeout: 5s

7. **CORS Configuration**
   - Add CORS_ORIGIN to all public-facing services
   - Validate allowed origins

8. **Repository URLs**
   - Correct rez-marketing repo reference
   - Audit all render.yaml for correctness

### Long-term (3 months)

9. **Infrastructure as Code**
   - Migrate all Render configs to Terraform/Pulumi
   - Implement GitOps workflow

10. **Observability Enhancement**
    - Standardize on OpenTelemetry
    - Add distributed tracing to all services
    - Implement SLO monitoring

11. **Service Mesh**
    - Consider Istio/Linkerd for production
    - Implement mTLS between services

12. **Cost Optimization**
    - Review reserved vs on-demand instances
    - Implement auto-scaling policies

---

## Appendix A: Complete Service Port Map

```
Port 80/443     - Nginx reverse proxy
Port 3000       - rez-api-gateway, hotel-ota-api, Grafana
Port 3001       - rez-intent-graph (API), rez-gamification-service
Port 3002       - hotel-panel
Port 3003       - rez-now
Port 3004       - rez-user-intelligence
Port 3005       - rez-intent-graph (Agent), rez-catalog-service
Port 3006       - rez-order-service (alt port)
Port 3007       - rez-intent-graph (docker mapping)
Port 3012       - rez-scheduler-service
Port 3013       - rez-targeting-engine
Port 3014       - rez-action-engine
Port 3016       - rez-automation-service
Port 4000       - rendez-backend, rez-marketing-service
Port 4001       - rez-payment-service
Port 4002       - rez-auth-service
Port 4003       - rez-search-service
Port 4004       - rez-wallet-service
Port 4005       - rez-order-service, rez-merchant-service, rez-finance-service
Port 4007       - rez-ads-service
Port 4010       - rez-feedback-service
Port 4012       - rez-merchant-intelligence
Port 4013       - rez-push-service, corpperks-api
Port 4015       - rez-stayown-service
Port 4017       - rez-personalization-engine
Port 4020       - rez-intelligence-hub
Port 4021       - rez-consumer-copilot
Port 4022       - rez-merchant-copilot
Port 4026       - copilot (unified)
Port 4027       - rez-decision-service
Port 4028       - rez-ad-platform
Port 4030       - rez-corporate-service
Port 4031       - rez-observability
Port 4033       - REZ-support-copilot
Port 4050       - rez-travel-service
Port 4100-4107  - ML services
Port 4110-4112  - Revenue services
Port 9090       - Prometheus
Port 9093       - Alertmanager
Port 10000      - rez-profile-service
```

---

## Appendix B: Render Blueprint Locations

```
/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-payment-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-order-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-search-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-catalog-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-marketing/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-ad-campaigns/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-profile-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-finance-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-gamification-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-push-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-notification-events/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-observability/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-travel-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-corporate-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-feedback-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-stayown-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-scheduler-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-automation-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-intelligence-hub/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-consumer-copilot/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-copilot/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/REZ-support-copilot/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-targeting-engine/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-action-engine/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-decision-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-personalization-engine/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-recommendation-engine/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-feature-flags/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-knowledge-base-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-media-events/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-integrations/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-user-intelligence-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-intelligence-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-insights-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-predictor/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-ad-ai/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/Hotel OTA/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/Rendez/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/Resturistan App/restauranthub/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rezbackend/rez-backend-master/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/Hotel OTA/hotel-pms/hotel-management-master/render.yaml
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-29
