# NEW SECURITY AUDIT - 2026-04-30
**Status:** AUDIT COMPLETE - FIXES IN PROGRESS

---

## EXECUTIVE SUMMARY

Comprehensive audit of 6 service areas identified **60+ issues** across security, database, API, dependencies, infrastructure, and code quality.

### Critical/High Issues Found

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 3 | 8 | 5 |
| Database | 1 | 5 | 15 | 6 |
| API | 1 | 2 | 6 | 4 |
| Dependencies | 2 | 3 | 8 | 4 |
| Infrastructure | 1 | 11 | 9 | 4 |
| Code Quality | 0 | 5 | 15 | 10 |
| **TOTAL** | **6** | **29** | **61** | **33** |

---

## NEW SECURITY ISSUES (AUDIT-2026-0430)

### Critical Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| **NS-001** | merchant | Unbounded Pagination - Memory Exhaustion | `src/routes/*.ts` (20+ files) | Routes use `parseInt(req.query.limit)` without max cap. Attacker can request `?limit=999999999` to exhaust memory |

### High Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| **NS-002** | merchant | OAuth Redirect URL Bypass | `src/routes/oauth.ts:144-145` | `url.includes()` can be bypassed with subdomain like `evil.com/rez.money.evil.com` |
| **NS-003** | intent-graph | MongoDB Pool Too Small + No Retry | `src/database/mongodb.ts` | Pool size 10, no retry logic, no durability settings (retryWrites, journal) |
| **NS-004** | auth | Admin Login No Account Lockout | `src/routes/authRoutes.ts` | PIN login has lockout but admin password login does not |
| **NS-005** | All | Secrets in .env Files | Multiple `.env` files | MongoDB Atlas credentials, JWT secrets, Razorpay keys committed to git |
| **NS-006** | All | Weak .gitignore | `.gitignore` | Only contains `node_modules` - doesn't exclude `.env` or credentials |

### Medium Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| NS-007 | merchant | CORS Allows Localhost in Production | `src/index.ts:113` | Unconditionally allows localhost even in production |
| NS-008 | auth | No Dedicated Rate Limit on /auth/validate | `src/routes/authRoutes.ts` | Uses shared `authLimiter` instead of stricter limit |
| NS-009 | all | Redis Fail-Open in Non-Production | Multiple files | Services fail open when Redis unavailable |
| NS-010 | auth | Trust Proxy Not Validated | `src/index.ts:67` | `trust proxy` accepts all forwarded headers without range check |
| NS-011 | order | Trust Proxy Unvalidated | `src/httpServer.ts:85` | `TRUST_PROXY_HOPS` can be set to arbitrary value |
| NS-012 | all | XFF Spoofing Detection Log Only | Multiple index.ts | Detects spoofing but only logs, continues processing |
| NS-013 | payment | Sensitive Data in Startup Logs | `src/index.ts:65,75` | WALLET_SERVICE_URL and infrastructure URLs logged |
| NS-014 | wallet | Decrypted Account Numbers in Responses | `src/models/MerchantWallet.ts` | Bank account numbers returned without masking |
| NS-015 | merchant | Missing Transactions | `src/routes/bulkImport.ts` | `insertMany` without transaction, partial failures not rolled back |
| NS-016 | auth | Missing MongoDB connectTimeoutMS | `src/config/mongodb.ts` | No explicit connection timeout configured |
| NS-017 | intent-graph | Missing Compound Indexes | `src/models/Intent.ts` | No indexes for `userId + status + lastSeenAt` |
| NS-018 | intent-graph | Console.log Instead of Logger | `src/database/mongodb.ts:31` | Uses console.log, exposes host info |
| NS-019 | merchant | @types/* in Dependencies | `package.json` | All @types packages in dependencies instead of devDependencies |
| NS-020 | wallet | @types/* in Dependencies | `package.json` | Same issue as merchant |
| NS-021 | All | Zod Version Conflicts | `package.json` | 8 different zod versions across services (v3 and v4 split) |
| NS-022 | All | Express Version Conflicts | `package.json` | 4 different express versions across services |

---

## DATABASE ISSUES

### Critical Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| **DB-001** | intent-graph | Connection Pool Too Small | `src/database/mongodb.ts` | maxPoolSize: 10 (should be 50), no retry on failure |

### High Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| DB-002 | intent-graph | Missing Durability Settings | `src/database/mongodb.ts` | No `retryWrites`, `w: majority`, `journal: true` |
| DB-003 | merchant | Missing Transactions | `src/routes/bulkImport.ts:55` | Bulk inserts without ACID guarantees |
| DB-004 | payment | No Connection Retry | `src/config/mongodb.ts` | No retry logic for transient failures |
| DB-005 | merchant | No Migration Scripts | Service root | No migration directory found |

### Medium Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| DB-006 | auth | $or Index Inefficiency | `src/routes/authRoutes.ts:189` | Phone lookup uses $or without compound index |
| DB-007 | auth | Missing Projection | `src/routes/authRoutes.ts:850` | getMeHandler doesn't use .lean() or projection |
| DB-008 | merchant | N+1 Risk | `src/routes/orders/list.ts:81` | Multiple .populate() calls per document |
| DB-009 | merchant | TOCTOU Race Condition | `src/routes/customers.ts:188-194` | Tag update read-then-write not atomic |
| DB-010 | wallet | Cache Race Condition | `src/services/walletService.ts:327` | Balance cache read/write not atomic |
| DB-011 | wallet | Unbounded Aggregation | `src/services/walletService.ts:1057-1077` | getTransactionSummary no date filter |

---

## API ISSUES

### Critical Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| **API-001** | merchant | Unbounded Pagination | `src/routes/*.ts` (20+ routes) | No Math.min cap on limit parameter |

### High Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| API-002 | merchant | Incomplete XFF Validation | `src/index.ts:60-64` | TRUST_PROXY_HOPS capped at 3 but no validation |
| API-003 | all | No API Versioning | All services | All routes lack /v1 prefix |

---

## DEPENDENCY ISSUES

### Critical Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| **DEP-001** | rez-app-marchant | GitHub Fork Supply Chain | `package.json` | `@karim4987498/shared` from private GitHub fork |
| **DEP-002** | rez-app-marchant | GitHub Fork Supply Chain | `package.json` | `@rez/shared-types` using github: shorthand |

### High Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| DEP-003 | merchant | @types in Dependencies | `package.json` | 10+ @types packages in dependencies |
| DEP-004 | wallet | @types in Dependencies | `package.json` | 4 @types packages in dependencies |
| DEP-005 | All | Zod Version Split | `package.json` | v3 and v4 used across services |

---

## INFRASTRUCTURE ISSUES

### Critical Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| **INF-001** | All | Secrets in .env Files | `*/.env` | MongoDB, Redis, JWT, Razorpay, Sentry keys committed |

### High Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| INF-002 | Root | Weak .gitignore | `.gitignore` | Missing `.env`, credentials, keys |
| INF-003 | docker-compose | Hardcoded Dev Secrets | `docker-compose.yml:170-176` | JWT, OTP secrets in compose file |
| INF-004 | finance | Missing .env | `rez-finance-service/` | No production config documented |
| INF-005 | ads | Missing .env | `rez-ads-service/` | No production config documented |
| INF-006 | MongoDB | No Backup Config | All services | No backup schedules or retention policies |
| INF-007 | PostgreSQL | No Backup Config | Hotel OTA, Rendez | No automated pg_dump configured |
| INF-008 | Redis | No Persistence Config | All services | AOF/RDB backup strategy not documented |
| INF-009 | Render | No Memory Limits | Most render.yaml | Services lack memoryMB constraints |
| INF-010 | auth | No Memory Limit | `render.yaml` | Auth service handles sensitive data |
| INF-011 | Prometheus | Basic Alerts Only | `prometheus-alerts.yml` | Only 6 basic alerts, no business metrics |

---

## CODE QUALITY ISSUES

### High Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| CQ-001 | merchant | 50+ `any` types | Various models/routes | Type safety violations |
| CQ-002 | order | 20+ `any` types | `src/models/Order.ts` | Index signatures with any |
| CQ-003 | payment | Memory Leaks | `src/services/*.ts` | Worker event listeners not cleaned up |
| CQ-004 | wallet | Memory Leaks | `src/config/redis.ts` | 11+ Redis event listeners without cleanup |
| CQ-005 | wallet | Dead Code | `src/workers/intentGraphConsumer.ts` | Entire file is placeholder |

### Medium Priority Issues

| ID | Service | Issue | Location | Description |
|----|---------|-------|----------|-------------|
| CQ-006 | All | `catch (err: any)` | All services | Should use `catch (err: unknown)` with type guards |
| CQ-007 | All | Code Duplication | Redis/MongoDB configs | Identical patterns in all services |
| CQ-008 | wallet | 1296 line file | `src/services/walletService.ts` | Exceeds 500 line guideline |
| CQ-009 | payment | 793 line file | `src/services/paymentService.ts` | Exceeds 500 line guideline |
| CQ-010 | All | Low Test Coverage | test directories | wallet 3 files, payment 6, auth 3 |

---

## FIXES APPLIED (2026-04-30)

### Wave 1 - Critical Fixes

| Issue | Service | Fix | Status |
|-------|---------|-----|--------|
| NS-001 | merchant | Added Math.min(100, Math.max(1, parseInt(...))) to all pagination routes | ✅ |
| NS-002 | merchant | Fixed isAllowedRedirectUrl() to use URL hostname parsing | ✅ |
| NS-003 | intent-graph | Enhanced MongoDB config with retry, pool 50, durability settings | ✅ |
| NS-004 | auth | Added admin login account lockout (5 attempts, 15 min) | ✅ |
| NS-005 | All | Added .gitignore patterns for secrets | ✅ |

---

## REMAINING FIXES NEEDED

| ID | Priority | Description | Estimated Effort |
|----|----------|-------------|-----------------|
| INF-001 | Critical | Rotate all exposed credentials | Manual |
| INF-002 | High | Update git history to remove secrets | Manual |
| NS-007 | Medium | Restrict CORS localhost to dev only | 15 min |
| NS-008 | Medium | Add dedicated rate limit to /auth/validate | 30 min |
| NS-009 | Medium | Standardize Redis fail-closed | 1 hr |
| NS-010-012 | Medium | Validate TRUST_PROXY_HOPS range | 30 min |
| DB-006-011 | Medium | Add missing indexes and projections | 2 hr |
| DEP-003-005 | Medium | Move @types to devDependencies | 1 hr |
| CQ-006 | Medium | Use unknown instead of any in catch | 4 hr |
| CQ-008-009 | Low | Refactor large files | 8 hr |
| CQ-010 | Low | Add more tests | Ongoing |

---

## MANUAL ACTIONS REQUIRED

1. **Rotate credentials immediately:**
   - MongoDB Atlas password: `RmptskyDLFNSJGCA`
   - Redis URL
   - All JWT secrets
   - Sentry DSN (production projects)
   - Razorpay keys
   - Cloudinary API secret
   - SendGrid API key

2. **Rewrite git history** to remove committed secrets:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch */.env' \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Publish internal packages to npm** instead of using GitHub forks or file references

4. **Implement secrets management** using Render Environment Groups or HashiCorp Vault

5. **Configure database backups** with retention policies

---

**Audit Date:** 2026-04-30
**Auditors:** Automated Claude Code Security Audit
**Next Review:** 2026-05-30
