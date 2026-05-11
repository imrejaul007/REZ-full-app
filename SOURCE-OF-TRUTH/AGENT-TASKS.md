# PHASE 0 EXECUTION - 8 AGENT TASKS

## AGENT 1: CRITICAL FIXES

### Task 1.1: Fix Git Conflict Markers
**Files to fix:**
```
/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service/package.json
/Users/rejaulkarim/Documents/ReZ Full App/rez-order-service/package.json
/Users/rejaulkarim/Documents/ReZ Full App/rez-gamification-service/package.json
```

**Action:** Remove git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

### Task 1.2: Fix Package Name
**File:** `rez-scheduler-service/package.json`
**Change:** `"name": "rez-workspace"` → `"name": "rez-scheduler-service"`

### Task 1.3: Rename Folder
**From:** `rez-app-marchant/`
**To:** `rez-app-merchant/`

### Task 1.4: Update Imports
After renaming, update all imports across the codebase that reference "rez-app-marchant"

---

## AGENT 2: SECURITY HARDENING

### Task 2.1: Enable MongoDB AUTH
**Files to check:**
- All `.env.example` files
- All service `src/database.ts` or `src/mongodb.ts`

**Changes:**
1. Add `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` to env
2. Update connection strings: `mongodb://user:pass@host:port/db`
3. Verify all services use authenticated connections

### Task 2.2: Enable Redis AUTH
**Files to check:**
- All `.env.example` files
- All service Redis configs

**Changes:**
1. Add `REDIS_PASSWORD` to env
2. Update Redis URLs: `redis://:password@host:port`
3. Verify all services use authenticated Redis

### Task 2.3: Security Audit
**Check each service for:**
- Missing `helmet` middleware
- Missing `express-rate-limit`
- Missing CORS configuration
- Exposed secrets in responses

---

## AGENT 3: PACKAGE AUDIT & FIX

### Task 3.1: Fix Package Names
| Current | Target | Location |
|---------|--------|----------|
| `@imrejaul007/rez-service-core` | `@rez/service-core` | package.json |
| Directory `rez-chat-service` | Keep or rename | - |

### Task 3.2: Remove Nested Duplicates
**Delete folders:**
```
packages/shared-types/packages/rez-chat-ai/
packages/shared-types/packages/rez-chat-service/
packages/shared-types/packages/rez-chat-integration/
packages/shared-types/packages/rez-intent-graph/
```

### Task 3.3: Check for Missing Source
**If source missing for:**
- `packages/rez-service-core/`
- `packages/rez-ui/`

**Action:** Check if source can be restored from git history or needs to be recreated

---

## AGENT 4: CODE QUALITY

### Task 4.1: Error Handling
**For each service, check:**
- All route handlers have try/catch
- All async functions have error handlers
- Error middleware is configured
- Errors are logged with context

**Fix locations:**
- `src/routes/*.ts`
- `src/services/*.ts`
- `src/middleware/*.ts`

### Task 4.2: Type Safety
**For each service:**
1. Check `tsconfig.json` has `"strict": true`
2. Replace `any` types with proper types
3. Add missing type annotations

### Task 4.3: Add Missing Sentry
**Services missing Sentry:**
- `rez-karma-service`
- `rez-corpperks-service`
- `rez-hotel-service`
- `rez-procurement-service`

---

## AGENT 5: OBSERVABILITY

### Task 5.1: Health Endpoints
**Add to each service:**
```typescript
app.get('/health', async (req, res) => {
  const mongoOk = await checkMongo();
  const redisOk = await checkRedis();
  res.json({ status: mongoOk && redisOk ? 'ok' : 'degraded', mongo: mongoOk, redis: redisOk });
});
```

### Task 5.2: Prometheus Metrics
**Check services:**
- `rez-wallet-service` - needs metrics
- `rez-order-service` - needs metrics
- `rez-payment-service` - needs metrics

**Add if missing:**
```typescript
import { metricsMiddleware } from '@rez/metrics';
app.use(metricsMiddleware);
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(getMetrics());
});
```

### Task 5.3: Structured Logging
**Replace all console.log/error with:**
```typescript
import { createLogger } from '@rez/shared';

const logger = createLogger({ service: 'service-name' });
logger.info('Request received', { method: req.method, path: req.path });
```

---

## AGENT 6: DOCUMENTATION

### Task 6.1: README for Each Service
**Create README.md for services missing it:**
```
rez-api-gateway/
rez-auth-service/
rez-wallet-service/
rez-order-service/
rez-payment-service/
rez-merchant-service/
rez-catalog-service/
rez-search-service/
rez-gamification-service/
rez-ads-service/
rez-marketing-service/
rez-scheduler-service/
rez-finance-service/
rez-karma-service/
rez-corpperks-service/
rez-hotel-service/
rez-procurement-service/
```

**README Template:**
```markdown
# Service Name

## Purpose
[What this service does]

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| ... | ... | ... |

## API Endpoints
| Method | Path | Description |
|--------|-------|-------------|
| ... | ... | ... |

## Local Development
```bash
npm install
npm run dev
```

## Deployment
[How to deploy]
```

### Task 6.2: Update SOURCE-OF-TRUTH
- Update SERVICES.md with current status
- Update REPOS.md with correct paths
- Update LOCAL-PORTS.md with ports

---

## AGENT 7: TESTING

### Task 7.1: Set Up Jest
**For services missing tests:**
```bash
npm install --save-dev jest @types/jest ts-jest
npx ts-jest config:init
```

### Task 7.2: Write Unit Tests
**For each core service, test:**
- Route handlers
- Service logic
- Error cases

### Task 7.3: Set Up CI/CD
**Create `.github/workflows/test.yml`:**
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npm test
```

---

## AGENT 8: DEPENDENCY AUDIT

### Task 8.1: Move @types to devDependencies
**Check each service package.json:**
```diff
{
  "dependencies": {
-   "@types/express": "^4.17.21",
-   "@types/node": "^22.0.0"
  },
+ "devDependencies": {
+   "@types/express": "^4.17.21",
+   "@types/node": "^22.0.0"
  }
}
```

### Task 8.2: Remove Duplicate Dependencies
**Use `npm dedupe` in each service**

### Task 8.3: Audit Version Mismatches
**Common issues:**
- Different zod versions
- Different mongoose versions
- Different express versions

**Action:** Align to common versions across ecosystem

### Task 8.4: Remove Unused Dependencies
**Use `npm prune` or manual audit**

---

## EXECUTION INSTRUCTIONS

Each agent should:
1. Read the task description
2. Execute changes in their assigned area
3. Commit changes with descriptive message
4. Report back with:
   - Files changed
   - Issues found
   - Issues resolved
   - Blockers (if any)

---

## AGENT START COMMAND

All 8 agents will run in parallel, each handling their assigned tasks autonomously.

**No permission requests. Execute and commit.**
