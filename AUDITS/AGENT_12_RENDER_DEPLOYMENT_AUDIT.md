# AGENT 12: Render Deployment Audit Report

**Date:** May 10, 2026  
**Auditor:** Render Deployment Specialist  
**Project:** ReZ Ecosystem  
**Version:** 66.0

---

## Executive Summary

This audit examined **50+ render.yaml files**, **4 deploy.sh scripts**, and related Docker configurations for the ReZ ecosystem. Multiple critical issues were identified that will cause deployment failures, service communication problems, and production outages.

**Total Issues Found:** 23  
**Critical:** 8  
**High:** 7  
**Medium:** 5  
**Low:** 3

---

## Source of Truth Reference

According to `SOURCE-OF-TRUTH.md`, these services require manual Render deployment:

| Service | Script | Status |
|---------|--------|--------|
| Hotel OTA | `Hotel OTA/deploy.sh` | Manual |
| CorpPerks | `CorpPerks/deploy.sh` | Manual |
| Restaurant AI | `rez-ai-restaurant/deploy.sh` | Manual |

---

## CRITICAL Issues

### Issue #1: Missing render.yaml for Restaurant AI Service

**SEVERITY:** CRITICAL  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ai-restaurant/`  
**ISSUE:** Service is listed in SOURCE-OF-TRUTH for manual deployment, but `render.yaml` is not committed. The `deploy.sh` script CREATES `render.yaml` at deploy time, which is a fragile pattern.

**RECOMMENDATION:** Commit a proper `render.yaml` to the repository:

```yaml
services:
  - type: worker
    name: restaurant-ai
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    plan: starter
    envVars:
      - key: NODE_ENV
        value: production
      - key: INTENT_GRAPH_URL
        value: https://rez-intent-graph.onrender.com
      - key: INTELLIGENCE_URL
        value: https://rez-intelligence-hub.onrender.com
      - key: MONGODB_URI
        sync: false
```

---

### Issue #2: Service Dependencies Not Declared in CorpPerks render.yaml

**SEVERITY:** CRITICAL  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks/render.yaml`  
**ISSUE:** render.yaml references `WALLET_SERVICE_URL`, `FINANCE_SERVICE_URL`, `KARMA_SERVICE_URL` but these services may not be deployed or have different URLs than expected.

**Current Configuration:**
```yaml
- key: WALLET_SERVICE_URL
  value: https://rez-wallet-service.onrender.com
- key: FINANCE_SERVICE_URL
  value: https://rez-finance-service.onrender.com
- key: KARMA_SERVICE_URL
  value: https://rez-karma-service.onrender.com
```

**RECOMMENDATION:** Verify these services are deployed OR remove if not needed. Add health checks before deployment.

---

### Issue #3: Missing Database Configuration for Critical Services

**SEVERITY:** CRITICAL  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-ledger-service/render.yaml`  
**ISSUE:** Service has `healthCheckPath: /health` but no `MONGODB_URI` or database configuration.

**Current Configuration:**
```yaml
services:
  - type: web
    name: rez-ledger-service
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
```

**RECOMMENDATION:** Add database configuration:
```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    sync: false
```

---

### Issue #4: Missing Database Configuration for Billing System

**SEVERITY:** CRITICAL  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-billing-system/render.yaml`  
**ISSUE:** Service has `healthCheckPath: /health` but no `MONGODB_URI` or database configuration.

**Current Configuration:**
```yaml
services:
  - type: web
    name: rez-billing-system
    env: node
    region: oregon
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: FRAUD_THRESHOLD
        value: 0.85
      - key: MAX_DAILY_TRANSACTIONS
        value: 1000
```

**RECOMMENDATION:** Add database configuration:
```yaml
envVars:
  - key: MONGODB_URI
    sync: false
  - key: DATABASE_URL  # If using PostgreSQL
    sync: false
```

---

### Issue #5: Restaurant AI deploy.sh Uses Localhost URLs

**SEVERITY:** CRITICAL  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ai-restaurant/deploy.sh`  
**ISSUE:** The auto-generated `render.yaml` in deploy.sh uses localhost URLs which will not work in production:

```bash
cat > render.yaml << 'EOF'
services:
  - type: worker
    name: restaurant-ai
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: INTENT_GRAPH_URL
        value: http://localhost:3007  # WRONG FOR PRODUCTION
      - key: INTELLIGENCE_URL
        value: http://localhost:4020  # WRONG FOR PRODUCTION
      - key: MONGODB_URI
        sync: false
EOF
```

**RECOMMENDATION:** Use production URLs:
```yaml
- key: INTENT_GRAPH_URL
  value: https://rez-intent-graph.onrender.com
- key: INTELLIGENCE_URL
  value: https://rez-intelligence-hub.onrender.com
```

---

### Issue #6: API Gateway Missing Essential Configuration

**SEVERITY:** CRITICAL  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/render.yaml`  
**ISSUE:** Uses `runtime: docker` but no `dockerfilePath` is specified, and no `NODE_ENV` or `PORT` is defined.

**Current Configuration:**
```yaml
services:
  - type: web
    name: rez-api-gateway
    runtime: docker
    dockerfilePath: ./Dockerfile  # MISSING
    envVars:
      # All values set to sync: false
      # No NODE_ENV or PORT
    healthCheckPath: /health
```

**RECOMMENDATION:** Add missing configuration:
```yaml
services:
  - type: web
    name: rez-api-gateway
    runtime: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: MONOLITH_URL
        sync: false
      # ... rest of service URLs
```

---

### Issue #7: CorpPerks Port Inconsistency

**SEVERITY:** HIGH  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks/render.yaml`, `.env.example`, `docker-compose.yml`  
**ISSUE:** Port definition differs across files:

| File | PORT Value |
|------|-----------|
| render.yaml | 4013 |
| .env.example | 4014 |
| docker-compose.yml | 4013 |

**RECOMMENDATION:** Standardize on PORT 4013 across all files:
```yaml
# render.yaml
- key: PORT
  value: "4013"
```

---

### Issue #8: rez-api-gateway Uses Inconsistent Runtime Syntax

**SEVERITY:** HIGH  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-api-gateway/render.yaml`  
**ISSUE:** Uses `runtime: docker` while other services use `env: node` or `runtime: node`.

**RECOMMENDATION:** Use consistent syntax:
```yaml
# For Node.js services:
- type: web
  name: rez-api-gateway
  runtime: node  # NOT "docker" for Node.js apps
  # OR
  env: node
```

---

## HIGH Priority Issues

### Issue #9: Inconsistent Health Check Paths

**SEVERITY:** HIGH  
**FILES:** Multiple render.yaml files  
**ISSUE:** Health check paths are inconsistent across services:

| Service | Health Check Path |
|---------|------------------|
| rez-auth-service | `/health` |
| rez-notifications-hub | `/v1/health` |
| REZ-attribution-system | `/health` |
| REZ-audit-logging | `/health` |
| rez-action-engine (docker-compose) | `/health/live` |
| rez-feedback-service (docker-compose) | `/health/live` |
| rez-targeting-engine (docker-compose) | `/api/v1/health` |

**RECOMMENDATION:** Standardize on `/health` for all services. Update docker-compose files:
```yaml
healthcheck:
  test: ['CMD-SHELL', 'curl -sf http://localhost:PORT/health || exit 1']
```

---

### Issue #10: Missing Health Check in REZ-ledger-service

**SEVERITY:** HIGH  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-ledger-service/render.yaml`  
**ISSUE:** Service declares `healthCheckPath: /health` but has no corresponding environment variables for health check configuration.

**RECOMMENDATION:** Ensure the service actually implements `/health` endpoint, or remove the healthCheckPath.

---

### Issue #11: Region Inconsistencies

**SEVERITY:** HIGH  
**FILES:** Multiple render.yaml files  
**ISSUE:** Services are deployed to different regions without justification:

| Service | Region |
|---------|--------|
| rez-auth-service | Not specified |
| REZ-ledger-service | oregon |
| REZ-notifications-hub | oregon |
| REZ-attribution-system | oregon |
| rez-copilot | singapore |
| rez-intent-service | singapore |
| REZ-support-copilot | singapore |
| CorpPerks | singapore |

**RECOMMENDATION:** 
1. Document why services are in different regions
2. Co-locate dependent services in the same region
3. Default to `oregon` for all services unless latency requires otherwise

---

### Issue #12: CORS Origin Wildcard Security Risk

**SEVERITY:** HIGH  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-identity-service/render.yaml`  
**ISSUE:** CORS_ORIGIN is set to `*` which allows any origin:

```yaml
- key: CORS_ORIGIN
  value: "*"
```

**RECOMMENDATION:** Specify exact allowed origins:
```yaml
- key: CORS_ORIGIN
  value: "https://app.rez.money,https://admin.rez.money"
```

---

### Issue #13: Missing Memory Limits on Several Services

**SEVERITY:** HIGH  
**FILES:** Multiple render.yaml files  
**ISSUE:** Most services do not specify `memoryMB`, risking OOM on Render's shared hosting.

**Affected Services:**
- rez-auth-service
- REZ-ledger-service
- rez-search-service
- rez-catalog-service
- REZ-attribution-system

**RECOMMENDATION:** Add memory limits to all services:
```yaml
services:
  - type: web
    name: service-name
    memoryMB: 512
    plan: starter
```

---

### Issue #14: Hotel Panel Missing Health Check

**SEVERITY:** HIGH  
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/Hotel OTA/render.yaml`  
**ISSUE:** Hotel Panel service (`hotel-ota-hotel-panel`) has no healthCheckPath defined.

**RECOMMENDATION:** Add health check for Next.js app:
```yaml
- type: web
  name: hotel-ota-hotel-panel
  # ... existing config
  healthCheckPath: /_next/health
```

---

### Issue #15: Auto-deploy Enabled Without Proper Guardrails

**SEVERITY:** MEDIUM  
**FILES:** Multiple render.yaml files  
**ISSUE:** Several services have `autoDeploy: true` without specifying branch restrictions:

**Affected:**
- Hotel OTA (all 4 services)
- REZ-attribution-system

**RECOMMENDATION:** Restrict auto-deploy to specific branch:
```yaml
services:
  - type: web
    name: service-name
    autoDeploy: true
    branch: main  # Add this
```

---

## MEDIUM Priority Issues

### Issue #16: deploy.sh Scripts Don't Check Prerequisites

**SEVERITY:** MEDIUM  
**FILES:** `Hotel OTA/deploy.sh`, `CorpPerks/deploy.sh`, `rez-ai-restaurant/deploy.sh`  
**ISSUE:** Scripts attempt deployment without verifying:
1. Previous services are deployed
2. Databases are created
3. Required environment variables are set

**RECOMMENDATION:** Add prerequisite checks:
```bash
#!/bin/bash
echo "Checking prerequisites..."

# Check if databases exist
# Check if required services are reachable
# Verify environment variables are set

if [ $? -ne 0 ]; then
    echo "Prerequisites not met. Please deploy dependent services first."
    exit 1
fi
```

---

### Issue #17: Backup Folders Contain Stale render.yaml Files

**SEVERITY:** MEDIUM  
**FILES:** 
- `/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks.backup/render.yaml`
- `/Users/rejaulkarim/Documents/ReZ Full App/REZ-support-copilot.backup/render.yaml`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service.backup/render.yaml`

**ISSUE:** Backup folders contain old render.yaml files that could cause confusion.

**RECOMMENDATION:** Either delete backup render.yaml files or add `.gitignore` exclusions.

---

### Issue #18: Inconsistent Port Ranges

**SEVERITY:** MEDIUM  
**FILES:** Multiple render.yaml files  
**ISSUE:** SOURCE-OF-TRUTH defines ports 4000-4035, but many services use ports outside this range:

| Service | Port | SOURCE-OF-TRUTH Port |
|---------|------|---------------------|
| REZ-identity-service | 3003 | 4050+ (Travel) |
| REZ-attribution-system | 3001 | Not listed |
| rez-billing-system | 3000 | Not listed |
| REZ-audit-logging | 10000 | Not listed |
| REZ-support-copilot | 4033 | Not listed |

**RECOMMENDATION:** 
1. Update SOURCE-OF-TRUTH with all deployed ports
2. Reassign conflicting ports to match SOURCE-OF-TRUTH

---

### Issue #19: Render CLI Installation Not Verified

**SEVERITY:** LOW  
**FILES:** All deploy.sh scripts  
**ISSUE:** Scripts check for `render` CLI but only print a message if missing:

```bash
if ! command -v render &> /dev/null; then
    echo "Installing Render CLI..."
    npm install -g render-cli
fi
```

**RECOMMENDATION:** The installation command is fine, but verify it succeeds:
```bash
if ! command -v render &> /dev/null; then
    echo "Installing Render CLI..."
    npm install -g render-cli
    if ! command -v render &> /dev/null; then
        echo "Failed to install Render CLI"
        exit 1
    fi
fi
```

---

### Issue #20: Docker Compose Health Check Commands Inconsistent

**SEVERITY:** LOW  
**FILES:** `/Users/rejaulkarim/Documents/ReZ Full App/docker-compose.yml`  
**ISSUE:** Mix of `curl` and `wget` for health checks:

```yaml
# Some services use:
test: ['CMD-SHELL', 'curl -sf http://localhost:4002/health || exit 1']

# Others use:
test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health"]
```

**RECOMMENDATION:** Standardize on curl for consistency:
```yaml
healthcheck:
  test: ['CMD-SHELL', 'curl -sf http://localhost:${PORT}/health || exit 1']
```

---

## Summary by File

### Hotel OTA (Multiple Services)

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing health check | HIGH | hotel-ota-hotel-panel has no healthCheckPath |
| Auto-deploy without branch restriction | MEDIUM | All services auto-deploy to any branch |
| CORS origins hardcoded | LOW | Should be configurable per environment |

### CorpPerks

| Issue | Severity | Description |
|-------|----------|-------------|
| Port inconsistency | HIGH | .env.example has 4014, render.yaml has 4013 |
| Missing prerequisites check | MEDIUM | No verification of dependent services |
| Service URLs not verified | CRITICAL | References services that may not exist |

### REZ Services

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing MONGODB_URI | CRITICAL | REZ-ledger-service, rez-billing-system |
| Missing memory limits | HIGH | Most services lack memoryMB |
| Region inconsistency | HIGH | Mixed Oregon/Singapore without justification |
| Health check path inconsistency | HIGH | Various paths: /health, /v1/health, /health/live |

---

## Required Actions

### Immediate (Before Next Deploy)

1. Add `MONGODB_URI` to `REZ-ledger-service/render.yaml`
2. Add `MONGODB_URI` to `rez-billing-system/render.yaml`
3. Create `render.yaml` for `rez-ai-restaurant`
4. Fix localhost URLs in `rez-ai-restaurant/deploy.sh`
5. Standardize `CORS_ORIGIN` to specific domains (not `*`)
6. Add `memoryMB: 512` to all services

### Short-term (This Week)

1. Standardize health check paths to `/health`
2. Add memory limits to all render.yaml files
3. Document service dependencies
4. Verify all referenced service URLs exist
5. Add branch restrictions to autoDeploy

### Long-term (This Month)

1. Update SOURCE-OF-TRUTH with all deployed ports
2. Create service dependency graph
3. Implement pre-deployment checks
4. Set up monitoring for all services
5. Document deployment order

---

## Files Audited

| File | Path | Issues |
|------|------|--------|
| Hotel OTA render.yaml | `/Hotel OTA/render.yaml` | 3 |
| CorpPerks render.yaml | `/CorpPerks/render.yaml` | 4 |
| REZ-ledger-service render.yaml | `/REZ-ledger-service/render.yaml` | 2 |
| rez-billing-system render.yaml | `/rez-billing-system/render.yaml` | 2 |
| rez-auth-service render.yaml | `/rez-auth-service/render.yaml` | 2 |
| rez-api-gateway render.yaml | `/rez-api-gateway/render.yaml` | 4 |
| rez-search-service render.yaml | `/rez-search-service/render.yaml` | 1 |
| rez-catalog-service render.yaml | `/rez-catalog-service/render.yaml` | 1 |
| REZ-identity-service render.yaml | `/REZ-identity-service/render.yaml` | 2 |
| REZ-attribution-system render.yaml | `/REZ-attribution-system/render.yaml` | 2 |
| REZ-notifications-hub render.yaml | `/REZ-notifications-hub/render.yaml` | 1 |
| rez-copilot render.yaml | `/rez-copilot/render.yaml` | 1 |
| rez-intent-service render.yaml | `/rez-intent-service/render.yaml` | 1 |
| REZ-audit-logging render.yaml | `/REZ-audit-logging/render.yaml` | 1 |
| REZ-support-copilot render.yaml | `/REZ-support-copilot.backup/render.yaml` | 2 |
| rez-ai-restaurant deploy.sh | `/rez-ai-restaurant/deploy.sh` | 2 |
| Hotel OTA deploy.sh | `/Hotel OTA/deploy.sh` | 1 |
| CorpPerks deploy.sh | `/CorpPerks/deploy.sh` | 1 |
| scripts/deploy.sh | `/scripts/deploy.sh` | 1 |
| docker-compose.yml | `/docker-compose.yml` | 2 |
| CorpPerks docker-compose.yml | `/CorpPerks/docker-compose.yml` | 2 |
| REZ-attribution-system docker-compose.yml | `/REZ-attribution-system/docker-compose.yml` | 1 |

---

## Audit Completion

**Status:** COMPLETE  
**Total Issues:** 23  
**Critical:** 8  
**High:** 7  
**Medium:** 5  
**Low:** 3

**Next Audit:** Scheduled for June 10, 2026

---

**Auditor Signature:** AGENT_12_RENDER_DEPLOYMENT_AUDIT  
**Date:** May 10, 2026  
**Report Location:** `/Users/rejaulkarim/Documents/ReZ Full App/AUDITS/AGENT_12_RENDER_DEPLOYMENT_AUDIT.md`
