# REZ-ADS-SERVICE Build Fix Report
**Date:** 2026-05-06
**Status:** FIXED
**Commit:** `eae5722`

## Problem Summary
The `rez-ads-service` failed to build on Render (and locally) due to TypeScript compilation errors.

---

## Additional Fix: rez-corporate-service
**Commit:** `58644b1` ✅ FIXED

Same issues as rez-ads-service plus additional JWT type assertion fix:

| Issue | File | Fix Applied |
|-------|------|-------------|
| Missing `@rez/shared` module | `logger.ts` | Self-contained winston logger |
| JWT_SECRET type `undefined` | `auth.ts:20,37` | Added `!` non-null assertion |
| Missing type declarations | `package.json` | Moved `@types/*` to dependencies |

---

## Problem Summary (rez-ads-service)
The `rez-ads-service` failed to build on Render (and locally) due to TypeScript compilation errors.

## Error Messages
```
src/brandDashboard/analytics.ts(878,5): error TS2741: Property 'timestamp' is missing in type '{ impressions: number; clicks: number; conversions: number; spend: number; }' but required in type 'RealTimeMetrics'.

src/brandDashboard/campaignCreator.ts(585,7): error TS2322: Type 'ValidationWarning[]' is not assignable to type 'string[]'.

src/config/logger.ts(10,45): error TS2307: Cannot find module '@rez/shared' or its corresponding type declarations.

src/middleware/auth.ts(1,49): error TS7016: Could not find a declaration file for module 'express'.
src/middleware/auth.ts(2,17): error TS7016: Could not find a declaration file for module 'jsonwebtoken'.
```

## Root Causes & Fixes

### 1. analytics.ts - Missing timestamp field
**File:** `rez-ads-service/src/brandDashboard/analytics.ts` (line 878)

**Cause:** The `getMockRealTimeMetrics()` method was returning an object missing the required `timestamp` field from the `RealTimeMetrics` interface.

**Fix:** Added `timestamp: new Date()` to the return object.

```typescript
private getMockRealTimeMetrics(): RealTimeMetrics {
  return {
    impressions: Math.round(1000 + Math.random() * 500),
    clicks: Math.round(20 + Math.random() * 15),
    conversions: Math.round(1 + Math.random() * 3),
    spend: Math.round((10 + Math.random() * 5) * 100) / 100,
    timestamp: new Date(),  // ADDED
  };
}
```

---

### 2. campaignCreator.ts - Type mismatch
**File:** `rez-ads-service/src/brandDashboard/campaignCreator.ts` (line 585)

**Cause:** The `ValidationResult` interface has `warnings: ValidationWarning[]`, but the code was assigning it to a `warnings: string[]` field without mapping.

**Fix:** Changed `warnings: validation.warnings` to `warnings: validation.warnings.map((w) => w.message)`

```typescript
// BEFORE
warnings: validation.warnings,

// AFTER
warnings: validation.warnings.map((w) => w.message),
```

---

### 3. logger.ts - Missing @rez/shared module
**File:** `rez-ads-service/src/config/logger.ts`

**Cause:** The logger was trying to import from `@rez/shared` which:
- Does not exist locally (empty directory)
- Won't work on Render (local file references don't work)

**Fix:** Rewrote logger.ts to be self-contained with winston:

```typescript
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const NODE_ENV = process.env.NODE_ENV || 'development';

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
  }),
];

if (NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

export const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  defaultMeta: { service: 'rez-ads-service' },
  transports,
});

export function createServiceLogger(serviceName: string): winston.Logger {
  return logger.child({ component: serviceName });
}
```

---

### 4. package.json - Broken dependency & missing type declarations
**File:** `rez-ads-service/package.json`

**Cause 1:** `"@rez/shared": "file:../rez-shared"` - local file reference that doesn't work on Render
**Fix 1:** Removed the dependency entirely

**Cause 2:** `@types/express`, `@types/jsonwebtoken`, `@types/node` were in `devDependencies`, but on Render's cloud build these weren't being installed properly during `npm install && npm run build`
**Fix 2:** Moved these type declarations to `dependencies`

```json
{
  "dependencies": {
    "@sentry/node": "^8.0.0",
    "@types/express": "^4.17.25",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^25.6.0",
    ...
  }
}
```

---

## Files Changed
| File | Change |
|------|--------|
| `package.json` | Removed `@rez/shared`, moved type declarations to dependencies |
| `src/brandDashboard/analytics.ts` | Added `timestamp: new Date()` |
| `src/brandDashboard/campaignCreator.ts` | Mapped warnings to string array |
| `src/config/logger.ts` | Complete rewrite - self-contained winston logger |

## Verification
- TypeScript check passes locally: `npm run lint` ✓
- Commit pushed to GitHub: `eae5722`

## Pull Instructions for Other Developers
```bash
cd rez-ads-service
git pull origin main
npm install
npm run build  # Should pass
```

## Notes
- The `rez-shared` package referenced by multiple services does not exist - it's an empty directory
- This is a recurring issue across services that depend on it
- Consider creating a proper `@rez/shared` package or removing all references

## Services with Same Issue (check & fix)
- [x] rez-ads-service - Fixed
- [x] rez-corporate-service - Fixed
- [x] rez-notification-events - Fixed
- [ ] rez-auth-service - Needs check
- [ ] rez-merchant-service - Needs check
- [ ] rez-payment-service - Needs check
- [ ] Other services with `@rez/shared` dependency
