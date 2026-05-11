# Deployment Fixes - 2026-05-04

## Rez-Scheduler-Service

### Fix 1: tsconfig.json - Add Node Types
**File:** `tsconfig.json`
**Issue:** TypeScript couldn't find `process`, `crypto`, `console` definitions
**Fix:** Added `"types": ["node"]` to compilerOptions

### Fix 2: package.json - Ensure Dev Dependencies
**File:** `package.json`
**Issue:** `@types/node` not installed during build
**Fix:** Changed build script to include dev dependencies

---

## Rez-Finance-Service

### Fix 1: loanOutcomeTracker.ts - Duplicate Mongoose Model
**File:** `src/jobs/loanOutcomeTracker.ts`
**Issue:** `OverwriteModelError: Cannot overwrite 'LoanApplication' model once compiled`
**Fix:** Import existing model instead of creating duplicate

### Fix 2: index.ts - Duplicate Redis Connection
**File:** `src/index.ts`
**Issue:** `Redis is already connecting/connected` error
**Fix:** Remove explicit `await redis.connect()` - IORedis auto-connects

### Fix 3: LoanApplication Model - Missing Fields
**File:** `src/models/LoanApplication.ts`
**Issue:** TypeScript errors for `repaidAt`, `overdueDays`, `outcomeTracked`
**Fix:** Added missing fields to interface and schema

### Fix 4: env.ts - getEnvVar Empty String Bug
**File:** `src/config/env.ts`
**Issue:** `getEnvVar('KEY', '')` throws when key not set
**Fix:** Use `!== undefined` check instead of falsy check

---

## Rez-Automation-Service

### Fix 1: tsconfig.json - moduleResolution Deprecation
**File:** `tsconfig.json`
**Issue:** `Option 'moduleResolution=node10' is deprecated`
**Fix:** Use `moduleResolution: "node16"` and `module: "Node16"`

### Fix 2: package.json - Install Dev Dependencies
**File:** `package.json`
**Issue:** `@types/*` packages not installed
**Fix:** `npm install --include=dev && tsc`

### Fix 3: env.ts - MONGODB_URI Support
**File:** `src/config/env.ts`
**Issue:** Expected separate `MONGODB_USER`/`MONGODB_PASSWORD`, but URI has full connection string
**Fix:** Use `MONGODB_URI` directly when provided

### Fix 4: env.ts - REDIS_URL Support
**File:** `src/config/env.ts`
**Issue:** Used separate `REDIS_HOST`/`REDIS_PORT` instead of full URL
**Fix:** Parse `REDIS_URL` to extract host, port, password, db

---

## Rez-Insights-Service

### Fix 1: package.json - Add jsonwebtoken Dependency
**File:** `package.json`
**Issue:** `Cannot find module 'jsonwebtoken'`
**Fix:** Added jsonwebtoken and @types/jsonwebtoken

### Fix 2: redis.ts - Add REDIS_URL Support
**File:** `src/config/redis.ts`
**Issue:** Redis client used `REDIS_HOST` instead of `REDIS_URL`
**Fix:** Check for `REDIS_URL` first and use it directly

---

## Rez-Mercant-Intelligence-Service

### Fix: tsconfig.json - Merge Remote Configuration
**File:** `tsconfig.json`
**Issue:** Merge conflict with strict:false vs decorators
**Fix:** Combined both configurations

---

## Generic Render Deployment Checklist

### tsconfig.json
```json
{
  "compilerOptions": {
    "types": ["node"],
    "lib": ["ES2020"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "moduleResolution": "node16",
    "module": "Node16"
  }
}
```

### package.json Scripts
```json
{
  "scripts": {
    "build": "npm install --include=dev && tsc",
    "start": "node dist/index.js"
  }
}
```

### Common Build Errors & Fixes
| Error | Fix |
|--------|-----|
| Cannot find name 'process' | Add `"types": ["node"]` to tsconfig |
| moduleResolution=node10 deprecated | Use `moduleResolution: "node16"` |
| Cannot find type definition file | Add `--include=dev` to build |
| Missing script: "start" | Add `"start": "node dist/index.js"` |
| Cannot overwrite model once compiled | Import existing model, don't recreate |
| Redis is already connecting/connected | Remove explicit `redis.connect()` |
| MONGODB_URI not used | Use URI directly, don't split into user/pass |
| REDIS_URL not used | Parse URL to extract host/port/password |

---

## Hotel-OTA

### Fix: package-lock.json Missing for npm ci
**Repository:** https://github.com/imrejaul007/hotel-ota
**Issue:** Render build failed with `EUSAGE` error - `npm ci` requires `package-lock.json`
**Error:**
```
npm error code EUSAGE
npm error The `npm ci` command can only install with an existing package-lock.json or
npm-shrinkwrap.json with lockfileVersion >= 1.
```
**Fix:** Generate and commit `package-lock.json`

```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json for reproducible builds"
git push
```

**Commit:** `0c6eaca` - "Add package-lock.json for npm ci"

**Note:** Trigger a new deploy from Render dashboard or push an empty commit:
```bash
git commit --allow-empty -m "Trigger rebuild"
git push
```

---

## Rez-Insights-Service

### Fix: tsconfig.json - moduleResolution Update
**File:** `tsconfig.json`
**Issue:** `Option 'moduleResolution=node10' is deprecated`
**Fix:** Changed `moduleResolution` to `node16`

```json
{
  "compilerOptions": {
    "moduleResolution": "node16"
  }
}
```

---

## Rendez

### Fix 1: render.yaml - Subdirectory Build Commands
**File:** `render.yaml`
**Issue:** Build failing - `npm ci` couldn't find `package-lock.json` (running from repo root instead of subdirectory)
**Fix:** Added explicit `cd` commands

```yaml
buildCommand: cd rendez-backend && npm ci && npx prisma generate && npm run build
startCommand: cd rendez-backend && npx prisma migrate deploy && node dist/index.js
```

### Fix 2: rendez-admin - Missing package-lock.json
**File:** `rendez-admin/package-lock.json`
**Issue:** `npm ci` requires `package-lock.json` but not committed
**Fix:** Run locally and commit

```bash
cd rendez-admin
npm install --package-lock-only
git add package-lock.json
git commit -m "Add package-lock.json for npm ci support"
```

---

## Rez-Finance-Service

### Fix 1: riskEngine.ts - Implicit Any Type
**File:** `src/engines/riskEngine.ts`
**Issue:** `Variable 'anomalies' implicitly has type 'any[]'`
**Fix:** Added explicit type annotation

```typescript
// Before
const anomalies = [];

// After
const anomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> = [];
```

### Fix 2: loanOutcomeTracker.ts - Missing Schema Fields
**File:** `src/jobs/loanOutcomeTracker.ts`
**Issue:** Properties missing on model (`tenure`, `applicationId`, `partnerId`, `outcomeTracked`)
**Fix:** Import from existing model

```typescript
import { LoanApplication } from '../models/LoanApplication';
const LoanApplicationModel = LoanApplication;
```

### Fix 3: loanOutcomeTracker.ts - Null Safety
**File:** `src/jobs/loanOutcomeTracker.ts`
**Issue:** `'loan.disbursedAt' is possibly 'null' or 'undefined'`
**Fix:** Added null checks and nullish coalescing

```typescript
for (const loan of disbursedLoans) {
  if (!loan.disbursedAt) continue;  // Guard clause

  const expectedDays = (loan.tenure ?? 1) * 30;
  outcome = (loan.overdueDays ?? 0) > 30 ? 'fully_defaulted' : 'partially_defaulted';

  // Convert null to undefined
  repaidAt: loan.repaidAt ?? undefined,
  overdueDays: loan.overdueDays ?? undefined,
}
```

---

**Date:** 2026-05-04
**Updated By:** Claude

---

## CorpPerks

### Fix 1: TypeScript Build Setup
**Files Created:**

1. **`src/backend/tsconfig.json`** (NEW)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["./**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

2. **`src/middleware/auth.ts`** (NEW) - JWT auth middleware
3. **`src/config/logger.ts`** (NEW) - JSON logger
4. **`src/backend/services/corpGSTService.ts`** (NEW) - GST service stub
5. **`src/backend/models/CorporateBenefit.ts`** (NEW) - Mongoose model
6. **`src/backend/models/CorporateEmployee.ts`** (NEW) - Mongoose model

### Fix 2: render.yaml - Build Configuration
**File:** `render.yaml`
**Updated build command:**
```yaml
buildCommand: cd src/backend && npm install
startCommand: cd src/backend && npx tsx index.ts
```

### Fix 3: Import Path Corrections
**Files Modified:** All files in `src/backend/*.ts`
**Change:** `../../middleware/auth` → `../middleware/auth`

### Fix 4: Auth Middleware - Add userId
**File:** `src/middleware/auth.ts`
**Added:** `userId?: string` to AuthRequest interface

### Fix 5: Remove Broken Admin Service
**File:** `render.yaml`
**Removed:** `corpperks-admin` service (referenced non-existent `src/admin/`)

---

## rez-merchant-integrations

### Fix 1: package.json - Add @types/cors
```json
"devDependencies": {
  "@types/cors": "^2.8.17",
  "@types/express": "^4.17.21",
  "@types/node-cron": "^3.0.11",
  "typescript": "^5.3.3",
  "ts-node": "^10.9.2"
}
```

### Fix 2: src/index.ts - Fix aggregatorId
```typescript
// Before (broken)
const { aggregatorId } = req.params;

// After (correct)
const aggregatorId = req.params.id;
```

### Fix 3: roiTrackingService.ts - Fix userId Type
```typescript
// Provide fallback for undefined userId
userId: params.userId || 'anonymous'
```

### Fix 4: Global Declaration for Attribution Store
```typescript
declare global {
  var attributionStore: Map<string, any> | undefined;
}
```

### Fix 5: deliveryService.ts - Axios Type
```typescript
import axios, { AxiosInstance } from 'axios';
private dunzoClient: AxiosInstance;
```

### Git Commit
```bash
git commit -m "fix: TypeScript errors - add @types/cors, fix type mismatches, add global declarations"
```

---

### Fix 6: Missing logger.ts and middleware/auth.ts (2026-05-04 5:50 PM)
**Issue:** `SyntaxError: The requested module '../config/logger' does not provide an export named 'logger'`

**Created `src/backend/config/logger.ts`:**
```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

**Created `src/backend/middleware/auth.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

export function requireAuth(req, res, next) { ... }
export function requireAdminAuth(req, res, next) { ... }
export function requireInternalToken(req, res, next) { ... }
```

**Added to `package.json`:**
```json
"winston": "^3.11.0"
```

---

**Date:** 2026-05-04 (Updated)
**Updated By:** Claude
