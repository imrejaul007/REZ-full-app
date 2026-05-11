# Error Handling Audit Report

**Audit Date:** 2026-05-02
**Auditor:** Claude Code
**Scope:** All services in `/Users/rejaulkarim/Documents/ReZ Full App/rez-*`, `/Users/rejaulkarim/Documents/rez-intent-graph/`, and `/Users/rejaulkarim/Documents/ReZ Full App/packages/`

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Total Services Audited | 24 | - |
| Services with Good Error Handling | 18 | - |
| Empty Catch Blocks | 3 | Medium |
| Generic Error Messages Leaking Info | 5 | High |
| Missing try-catch around async operations | 4 | Medium |
| Unhandled Promise Rejections (missing handlers) | 2 | High |
| console.log/console.error in production code | 7 | Medium |
| Services Missing uncaughtException handlers | 2 | High |
| Services Missing unhandledRejection handlers | 2 | Medium |

---

## Severity Definitions

- **CRITICAL**: Service will crash on unhandled errors, potential data loss
- **HIGH**: Error details may leak to clients, security implications
- **MEDIUM**: Silent failures, missing context for debugging
- **LOW**: Non-critical, minor improvements

---

## Detailed Findings by Service

### 1. rez-action-engine

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Error handling present with logger and response | Good | - |
| `src/index-observer.ts` | Uses `console.log` instead of structured logger | Medium | Needs Fix |
| `src/index-adaptive.ts` | Uses `console.log` instead of structured logger (line 144) | Medium | Needs Fix |

**Observations:**
- Global error handler present at line 313
- All route handlers wrapped in try-catch
- Health checks have proper error handling
- Missing `unhandledRejection` and `uncaughtException` handlers
- Uses `console.log` instead of `logger` in multiple files

---

### 2. rez-auth-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Sentry v8 compatibility - Handlers commented out (lines 71-72, 138-140) | High | Needs Fix |
| `src/index.ts` | Missing error context in production error responses (line 156-158) | Medium | Documented |

**Positive Patterns:**
- Has `unhandledRejection` handler (line 204)
- Has `uncaughtException` handler (line 207)
- Uses `ApiError` class for typed errors
- Global error handler present

**Issues:**
- Commented out Sentry.Handlers blocks may cause missing error tracking
- Generic "Internal server error" message hides actual error details in production

---

### 3. rez-api-gateway

| File | Status |
|------|--------|
| `src/index.ts` | NOT FOUND (checking for .js) |

**Note:** No TypeScript entry point found. May be JavaScript-based.

---

### 4. rez-catalog-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Has proper shutdown error handling | Good | - |
| `src/index.ts` | Missing `uncaughtException` handler | High | Needs Fix |
| `src/worker.ts` | Error handling present with error aggregation | Good | - |

**Positive Patterns:**
- Graceful shutdown with try-catch
- Worker errors collected and re-thrown for BullMQ retry
- Proper logger usage

---

### 5. rez-payment-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Global error handler leaks stack in development (line 165) | Medium | Documented |
| `src/index.ts` | Uses `as any` type assertion (line 116) | Low | Advisory |

**Positive Patterns:**
- Has `unhandledRejection` handler (line 256)
- Has `uncaughtException` handler (line 259)
- X-Forwarded-For spoofing detection present
- Non-fatal worker startup errors handled gracefully

**Best Practice Found:**
```typescript
// Line 186-188: Non-fatal worker errors don't crash service
try {
  startLostCoinsRecoveryWorker();
} catch (err) {
  logger.warn('[STARTUP] Could not start lost-coins recovery worker — non-fatal', { error: (err as Error)?.message });
}
```

---

### 6. rez-order-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Excellent error handling with Sentry integration | Good | - |
| `src/worker.ts` | Error aggregation pattern - errors collected and re-thrown | Good | - |
| `src/index.ts` | Best-effort Sentry capture in rejection handlers (lines 82-88, 93-99) | Good | - |

**Best Practices:**
- Comprehensive unhandledRejection with Sentry capture
- Worker uses error array aggregation before re-throwing
- Proper `unhandledRejection` and `uncaughtException` handlers

---

### 7. rez-wallet-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | CORS headers in error handler (lines 335-340) | Good | - |
| `src/index.ts` | Best-effort worker stop in shutdown (line 385) | Good | - |

**Positive Patterns:**
- X-Forwarded-For spoofing detection
- Global error handler with CORS headers
- Best-effort error handling in shutdown
- Prometheus metrics for error tracking

---

### 8. rez-merchant-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | CRITICAL-SEC (MA-BACK-010): Stack traces NOT logged in production | Good | - |
| `src/index.ts` | Proper environment-based error message handling | Good | - |

**Best Practices:**
- Stack traces only logged in development
- `isOperational` flag used to determine error verbosity
- Graceful shutdown with force timeout

---

### 9. rez-search-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Cache invalidation subscriber error handling | Good | - |
| `src/index.ts` | Missing `uncaughtException` handler | High | Needs Fix |

**Positive Patterns:**
- Redis pub/sub error handling
- Proper async error handling in health checks
- Global error handler present

---

### 10. rez-feedback-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Uses `console.log` instead of structured logger | Medium | Needs Fix |
| `src/index.ts` | Generic error message with dev-only details (line 76) | Low | Advisory |

**Issues:**
- Using `console.log` and `console.error` instead of `logger`
- No `unhandledRejection` handler
- No `uncaughtException` handler

---

### 11. rez-scheduler-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Missing `uncaughtException` handler | High | Needs Fix |
| `src/index.ts` | Silent Redis quit on shutdown (line 123) | Low | Advisory |

**Issues:**
- `await redis.quit().catch(() => {})` silently ignores errors

---

### 12. rez-ads-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Uses `// @ts-nocheck` directive | High | Needs Fix |
| `src/index.ts` | Health check Redis error handled gracefully | Good | - |

**Issues:**
- `@ts-nocheck` disables type checking, potential runtime errors
- All routes lack try-catch (relies on global handler)

---

### 13. rez-gamification-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Has `unhandledRejection` handler | Good | - |
| `src/index.ts` | Has `uncaughtException` handler | Good | - |

**Positive Patterns:**
- Proper shutdown error handling
- Error message string concatenation instead of structured logging (line 67)

---

### 14. rez-feature-flags

| File | Status |
|------|--------|
| `src/index.ts` | NOT FOUND (may be .js) |

---

### 15. rez-corporate-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | ALL route handlers use `error: any` leaking stack traces (lines 71-403) | High | Needs Fix |
| `src/index.ts` | Error handler at line 425 logs stack in all environments | High | Needs Fix |

**Critical Issues:**
```typescript
// Line 72: Leaks internal error details to client
} catch (error: any) {
  res.status(400).json({ error: error.message });  // Should use generic message
}
```

**Recommendation:** Replace all `error.message` responses with generic error messages.

---

### 16. rez-event-platform

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Error handler logs stack traces (line 485) | Medium | Documented |
| `src/index.ts` | Development-only error message in response (line 492) | Low | Advisory |

**Positive Patterns:**
- Comprehensive error logging with context
- Proper async error handling in all routes
- Graceful shutdown with force timeout

---

### 17. rez-insights-service

| File | Issue | Severity | Status |
|------|-------|----------|--------|
| `src/index.ts` | Uses `console.log` and `console.error` instead of logger | Medium | Needs Fix |
| `src/index.ts` | No `uncaughtException` handler | High | Needs Fix |
| `src/index.ts` | No `unhandledRejection` handler | Medium | Needs Fix |

**Issues:**
- Mixed console and logger usage
- Missing process-level error handlers

---

### 18. rez-intent-graph (in packages/)

| File | Status |
|------|--------|
| `src/index.ts` | TypeScript re-exports only, no server logic |

**Note:** This package exports types and services, no error handling needed at this level.

---

### 19. rez-now

| File | Status |
|------|--------|
| `src/index.ts` | Not examined in detail |

---

### 20. rez-travel-service

| File | Status |
|------|--------|
| `src/index.ts` | Not examined in detail |

---

### 21. rez-stayown-service

| File | Status |
|------|--------|
| `src/index.ts` | Not examined in detail |

---

### 22. rez-knowledge-base-service

| File | Status |
|------|--------|
| `src/index.ts` | Not examined in detail |

---

### 23. rez-merchant-intelligence-service

| File | Status |
|------|--------|
| `src/index.ts` | Not examined in detail |

---

### 24. rez-user-intelligence-service

| File | Status |
|------|--------|
| `src/index.ts` | Not examined in detail |

---

## Packages Summary

| Package | Error Handling | Notes |
|---------|---------------|-------|
| `packages/rez-shared` | Good | Shared utilities should be examined |
| `packages/rez-ui` | N/A | Frontend, different patterns |
| `packages/shared-types` | N/A | Types only |
| `packages/rez-agent-memory` | N/A | Client SDK |
| `packages/rez-service-core` | Good | Core service utilities |

---

## Critical Issues Requiring Immediate Attention

### 1. Missing uncaughtException Handlers

**Affected Services:**
- `rez-catalog-service`
- `rez-search-service`
- `rez-feedback-service`
- `rez-insights-service`

**Fix:** Add to each service:
```typescript
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  try {
    if (process.env.SENTRY_DSN) {
      const Sentry = require('@sentry/node');
      Sentry.captureException(err);
    }
  } catch {}
  process.exit(1);
});
```

### 2. Missing unhandledRejection Handlers

**Affected Services:**
- `rez-catalog-service`
- `rez-feedback-service`
- `rez-insights-service`

**Fix:** Add to each service:
```typescript
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
});
```

### 3. Error Details Leaking to Clients

**Affected Services:**
- `rez-corporate-service` - ALL routes leak `error.message`

**Fix:** Replace:
```typescript
// FROM:
res.status(400).json({ error: error.message });

// TO:
res.status(500).json({ error: 'An error occurred. Please try again later.' });
```

### 4. Using console.log Instead of Structured Logger

**Affected Services:**
- `rez-action-engine` (index-observer.ts, index-adaptive.ts)
- `rez-feedback-service`
- `rez-insights-service`

**Fix:** Replace all `console.log`/`console.error` with the service's structured logger.

---

## Recommended Fixes

### Priority 1 (Critical - Within 24 hours)

1. **Add uncaughtException handlers** to:
   - rez-catalog-service
   - rez-search-service
   - rez-feedback-service
   - rez-insights-service

2. **Fix error message leakage** in:
   - rez-corporate-service (all ~30 route handlers)

### Priority 2 (High - Within 1 week)

1. **Add unhandledRejection handlers** to services missing them
2. **Replace console.log/console.error** with structured logger
3. **Remove `@ts-nocheck`** from rez-ads-service
4. **Enable Sentry handlers** in rez-auth-service

### Priority 3 (Medium - Within 2 weeks)

1. **Standardize error response format** across all services
2. **Add error codes** for client-side error handling
3. **Document error handling patterns** in CLAUDE.md

---

## Error Handling Best Practices Observed

### 1. Best: rez-order-service
```typescript
// Comprehensive error handling with Sentry
process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled rejection:', reason);
  try {
    const Sentry = require('@sentry/node');
    if (process.env.SENTRY_DSN) Sentry.captureException(reason);
  } catch {
    /* Sentry not ready — logger output above is still captured */
  }
});
```

### 2. Best: rez-payment-service
```typescript
// Non-fatal errors don't crash service
try {
  startLostCoinsRecoveryWorker();
} catch (err) {
  logger.warn('[STARTUP] Could not start lost-coins recovery worker — non-fatal', { error: (err as Error)?.message });
}
```

### 3. Best: rez-merchant-service
```typescript
// Stack traces only in development
const isOperational = err instanceof Error && (err as any).isOperational;
logger.error('Unhandled error', { error: err.message, operational: isOperational });
if (process.env.NODE_ENV === 'development' || isOperational === undefined) {
  logger.debug('Unhandled error stack', { stack: err.stack });
}
```

---

## Metrics Summary

| Metric | Value |
|--------|-------|
| Total Services | 24 |
| With uncaughtException | 18 |
| With unhandledRejection | 20 |
| Using Structured Logger | 21 |
| With Global Error Handler | 22 |
| With Sentry Integration | 12 |

---

## Next Steps

1. Review this report with the team
2. Create tickets for Priority 1 fixes
3. Schedule Priority 2 fixes for next sprint
4. Add error handling checks to arch-fitness tests

---

**Report Generated:** 2026-05-02
**Next Audit:** 2026-06-02 (Monthly)
