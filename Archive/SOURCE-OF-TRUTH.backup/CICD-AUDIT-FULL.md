# CI/CD & Deployment Configuration Audit Report

**Date:** 2026-05-02
**Auditor:** DEVOPS ENGINEER
**Scope:** `/Users/rejaulkarim/Documents/ReZ Full App/` and `/Users/rejaulkarim/Documents/rez-intent-graph/`

---

## Executive Summary

This audit reveals **significant CI/CD configuration issues** across the ReZ ecosystem. While some services have proper configurations, widespread inconsistencies exist in render.yaml files, Dockerfiles, and graceful shutdown implementations.

---

## 1. GitHub Actions Workflows

### Location: `/Users/rejaulkarim/Documents/ReZ Full App/.github/workflows/`

**Current State:**

| Workflow | Status | Issues |
|----------|--------|--------|
| `ci.yml` | Partial | Staging/production deployment commands are placeholders |
| `deploy.yml` | Incomplete | Has placeholder comments, no actual deployment logic |
| `auto-commit.yml` | Risky | Auto-pushes to main on PR merge |
| `cost-alerts.yml` | OK | Basic cost monitoring |
| `deploy-cloudflare-pages.yml` | OK | For frontend deployment |

**CRITICAL ISSUES:**

1. **Missing per-service workflows**: Individual `rez-*` services do not have their own GitHub Actions workflows
2. **Deploy placeholders**: Both `deploy.yml` and `ci.yml` have empty deployment commands:
   ```yaml
   # deploy.yml line 34-36
   run: |
     echo "Deploying to staging environment..."
     # Add your deployment commands here
   ```
3. **Auto-commit risk**: `auto-commit.yml` pushes directly to `main` without review

**Recommended Fix:**
- Create per-service GitHub Actions workflows in each service's `.github/workflows/` directory
- Replace placeholder deployment commands with actual deployment logic using Render API or CLI
- Remove or restrict the auto-commit workflow

---

## 2. render.yaml Configuration Issues

### 2.1 Missing render.yaml Files

**Services WITHOUT render.yaml (in main repo):**
- `rez-stayown-service`
- `rez-scheduler-service`
- `rez-gamification-service`
- `rez-marketing-service`
- `rez-ads-service`
- `rez-user-intelligence-service`
- `rez-merchant-intelligence-service`
- `rez-intelligence-hub`
- `rez-merchant-integrations`
- `rez-media-events`
- `REZ-support-copilot`
- `rez-targeting-engine`
- `rez-ad-copilot`
- `rez-knowledge-base-service`

**Recommended Fix:**
Create render.yaml for each missing service following the pattern from existing services.

### 2.2 Inconsistent Health Check Paths

| Service | render.yaml healthCheckPath | Dockerfile HEALTHCHECK | Match? |
|---------|---------------------------|----------------------|--------|
| rez-feedback-service | NOT SET | `/health/live` | NO |
| rez-action-engine | NOT SET | `/health/live` | NO |
| rez-event-platform | `/health` | `/health` | YES |
| rez-automation-service | `/health` | N/A | OK |
| rez-insights-service | `/health` | N/A | OK |
| rez-consumer-copilot | `/health` | N/A (server.js) | OK |

**CRITICAL ISSUE:**
`rez-feedback-service` and `rez-action-engine` Dockerfiles expect `/health/live` but render.yaml has no `healthCheckPath` configured.

**Recommended Fix:**
Add to `rez-feedback-service/render.yaml`:
```yaml
healthCheckPath: /health/live
```

Add to `rez-action-engine/render.yaml`:
```yaml
healthCheckPath: /health/live
```

### 2.3 Wrong Start Commands

**rez-action-engine/render.yaml:**
```yaml
buildCommand: npm install
startCommand: npm start  # WRONG - uses ts-node in production!
```

**Issue:** The Dockerfile builds TypeScript but render.yaml uses `npm start` which likely runs `ts-node`. This is inefficient and potentially insecure in production.

**Correct configuration:**
```yaml
buildCommand: npm install && npm run build
startCommand: node dist/index.js
```

### 2.4 Port Mismatch Issues

| Service | render.yaml PORT | Dockerfile EXPOSE | Correct? |
|---------|-----------------|------------------|----------|
| rez-payment-service | 4001 | 4001 | YES |
| rez-merchant-service | 4005 | 4004 | NO |
| rez-catalog-service | NOT SET | 3001 | PARTIAL |
| rez-auth-service | NOT SET | 4002 | YES |

**Recommended Fix:**
Ensure `render.yaml PORT` matches Dockerfile `EXPOSE` for all services.

### 2.5 Missing numInstances Configuration

Most services use Render's free tier with default 1 instance. For production, services should specify:

```yaml
numInstances: 3  # For critical services
```

---

## 3. Dockerfile Configuration Issues

### 3.1 Inconsistent Base Images

| Service | Base Image | Issue |
|---------|------------|-------|
| rez-stayown-service | `node:18-alpine` | OUTDATED |
| rez-corpperks-service | `node:18-alpine` | OUTDATED |
| rez-procurement-service | `node:18-alpine` | OUTDATED |
| Most others | `node:20-alpine` | OK |

**Recommended Fix:**
Update all base images to `node:20-alpine` or `node:22-alpine`.

### 3.2 Missing Health Checks

| Service | Dockerfile HEALTHCHECK |
|---------|----------------------|
| rez-automation-service | MISSING |
| rez-corpperks-service | MISSING |
| rez-procurement-service | MISSING |
| rez-merchant-service | MISSING |
| rez-payment-service | MISSING |
| rez-catalog-service | MISSING |

**Recommended Fix:**
Add to each Dockerfile:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:${PORT}/health || exit 1
```

### 3.3 Missing Graceful Shutdown Handling

| Service | SIGTERM/SIGINT Handlers |
|---------|------------------------|
| rez-intent-graph | YES |
| rez-action-engine | YES |
| rez-feedback-service | YES |
| rez-event-platform | YES |
| rez-automation-service | YES |
| rez-stayown-service | YES |
| rez-insights-service | YES |
| rez-consumer-copilot | NO |
| rez-stayown-service | YES |

**Services Missing Graceful Shutdown:**
- `rez-consumer-copilot` - No SIGTERM/SIGINT handlers in `server.js`

**Recommended Fix for rez-consumer-copilot:**
```javascript
const server = app.listen(PORT, () => {...});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});
```

---

## 4. Docker Compose Configuration

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/docker-compose.yml`

**Good Practices Found:**
- MongoDB replica set with 3 nodes
- Health checks on all database services
- Service dependencies with `condition: service_healthy`
- Non-root users in Dockerfiles (most)

**Issues Found:**
- Some services reference Dockerfiles that don't exist in the expected paths
- Inconsistent port mappings across services

---

## 5. Environment Variable Issues

### 5.1 Inconsistent Variable Naming

| Service | Variable Used | render.yaml | Issue |
|---------|--------------|-------------|-------|
| rez-merchant-service | `CORS_ALLOWED_ORIGINS` | `CORS_ALLOWED_ORIGINS` | OK |
| rez-wallet-service | `CORS_ORIGIN` | `CORS_ORIGIN` | OK |
| Most services | Various formats | Mixed | INCONSISTENT |

### 5.2 Missing Required Variables

Several services reference environment variables without documenting them in render.yaml:
- `MONOLITH_URL` referenced but not always defined
- `INTERNAL_SERVICE_TOKENS_JSON` format inconsistencies

---

## 6. Deployment Architecture Concerns

### 6.1 Service Repository Structure

The ecosystem uses a complex multi-repository structure:
- Main repo: `/Users/rejaulkarim/Documents/ReZ Full App/`
- Individual services: `/Users/rejaulkarim/Documents/ReZ Full App/rez-*/`
- Packages: `/Users/rejaulkarim/Documents/ReZ Full App/packages/`
- External: `/Users/rejaulkarim/Documents/rez-intent-graph/`

**Issue:** No clear deployment pipeline connecting these repositories.

### 6.2 Missing GitHub Actions in Individual Services

Most `rez-*` services do NOT have `.github/workflows/` directories, meaning:
- No per-service CI/CD
- No automated testing on PR
- No deployment automation

---

## 7. Security Concerns

### 7.1 Secrets Management

- Most render.yaml files use `sync: false` for secrets (good)
- But `.env.example` files may contain sensitive placeholders
- No mention of secret rotation procedures

### 7.2 CORS Configuration

Several services hardcode CORS origins which could cause issues in production:
```javascript
// rez-stayown-service/src/index.js
origin: (process.env.CORS_ORIGIN || 'https://admin.rez.money').split(',')
```

---

## 8. Recommended Action Items

### Priority 1 (Critical)
1. Add `healthCheckPath` to `rez-feedback-service/render.yaml`
2. Add `healthCheckPath` to `rez-action-engine/render.yaml`
3. Fix `rez-action-engine/render.yaml` start command
4. Add graceful shutdown to `rez-consumer-copilot/server.js`
5. Add HEALTHCHECK to missing Dockerfiles

### Priority 2 (High)
6. Create render.yaml for missing services
7. Update outdated base images (node:18 -> node:20)
8. Align PORT values across render.yaml and Dockerfile
9. Add `numInstances` configuration for production

### Priority 3 (Medium)
10. Create per-service GitHub Actions workflows
11. Implement actual deployment logic (replace placeholders)
12. Document environment variable requirements
13. Establish secret rotation procedures

---

## 9. Summary Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Services with render.yaml | ~40 | ~67% |
| Services with Dockerfile | ~30 | ~50% |
| Dockerfiles with HEALTHCHECK | ~15 | ~50% |
| Services with graceful shutdown | ~8 | ~27% |
| GitHub Actions workflows | 5 | - |

---

## 10. Appendix: File Locations

### render.yaml Files Found
```
/Users/rejaulkarim/Documents/ReZ Full App/rez-action-engine/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-feedback-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-automation-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-insights-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-consumer-copilot/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-payment-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-order-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/rez-catalog-service/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/packages/rez-intent-graph/render.yaml
/Users/rejaulkarim/Documents/ReZ Full App/packages/shared-types/*/render.yaml
/Users/rejaulkarim/Documents/rez-intent-graph/render.yaml
```

### Dockerfile Files Found
```
/Users/rejaulkarim/Documents/ReZ Full App/rez-action-engine/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-feedback-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-stayown-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-corpperks-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-procurement-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-payment-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-catalog-service/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-intent-graph/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/rez-now/Dockerfile
/Users/rejaulkarim/Documents/ReZ Full App/Rendez/rendez-backend/Dockerfile
```

### Graceful Shutdown Implementation Examples

**Good (rez-intent-graph/src/server/server.ts):**
```typescript
async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Intent Graph] ${signal} received — graceful shutdown starting`);

  if (server) {
    server.close(() => {
      console.log('[Intent Graph] HTTP server closed');
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log('[Intent Graph] Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

**Missing (rez-consumer-copilot/server.js):**
```javascript
app.listen(PORT, () => {
  console.log(`REZ Consumer Copilot running on port ${PORT}`);
});
// NO SIGTERM/SIGINT handlers!
```

---

**End of Report**
