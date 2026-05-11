# REZ ECOSYSTEM - AUDIT ACTION ITEMS
**Date:** May 4, 2026
**Status:** IN PROGRESS
**CEO:** Claude Code

---

## ACTION ITEM TRACKER

### PHASE 1: IMMEDIATE (0-24 hours)

#### ACTION-001: Rotate ALL Production Secrets
- **Severity:** CRITICAL
- **Owner:** Security Auditor
- **Status:** TODO
- **Description:** 12+ .env files with secrets committed to git
- **Steps:**
  1. Generate new JWT secrets: `openssl rand -hex 64`
  2. Generate new MongoDB passwords
  3. Generate new Redis passwords
  4. Request new API keys (SendGrid, Razorpay, etc.)
  5. Update all deployment configurations
  6. Remove secrets from git history
- **Estimated Time:** 4 hours
- **Blocking:** No

#### ACTION-002: Fix CorpPerks Auth Bypass
- **Severity:** CRITICAL
- **Owner:** Finance Auditor
- **Status:** TODO
- **Description:** Auth middleware accepts any "Bearer xxx" as valid
- **File:** CorpPerks/src/routes/corpWalletRoutes.js
- **Fix:** Add proper JWT validation
- **Estimated Time:** 2 hours
- **Blocking:** No

#### ACTION-003: Fix Grafana Default Password
- **Severity:** HIGH
- **Owner:** DevOps Auditor
- **Status:** TODO
- **File:** docker-compose.observability.yml
- **Fix:** Change admin123 to secure password, use environment variable
- **Estimated Time:** 10 minutes
- **Blocking:** No

#### ACTION-004: Remove Demo Data from Production
- **Severity:** HIGH
- **Owner:** Finance Auditor
- **Status:** TODO
- **Description:** CorpPerks has test credentials in production
- **File:** CorpPerks/src/routes/corpWalletRoutes.js
- **Estimated Time:** 1 hour
- **Blocking:** No

---

### PHASE 2: URGENT (24-72 hours)

#### ACTION-005: Migrate CorpPerks to Redis
- **Severity:** CRITICAL
- **Owner:** Finance Auditor
- **Status:** TODO
- **Description:** CorpPerks uses in-memory Map() - data loss on restart
- **File:** CorpPerks/src/routes/corpWalletRoutes.js
- **Fix:** Replace Map() with Redis client
- **Estimated Time:** 8 hours
- **Blocking:** ACTION-002

#### ACTION-006: Fix Duplicate errorResponse Implementations
- **Severity:** HIGH
- **Owner:** Architecture Auditor
- **Status:** TODO
- **Description:** 5 services have inconsistent error response schemas
- **Services:** auth, wallet, payment, merchant, order
- **Fix:** Create unified errorResponse in @rez/shared
- **Estimated Time:** 4 hours
- **Blocking:** No

#### ACTION-007: Fix Broken Package Exports
- **Severity:** HIGH
- **Owner:** Architecture Auditor
- **Status:** TODO
- **File:** packages/rez-service-core/src/index.ts
- **Fix:** Add missing exports (redis, mongodb, logger, health)
- **Estimated Time:** 2 hours
- **Blocking:** No

#### ACTION-008: Add HMAC to Delivery Webhooks
- **Severity:** HIGH
- **Owner:** API Auditor
- **Status:** TODO
- **File:** rez-merchant-integrations/src/services/deliveryService.ts
- **Fix:** Add signature verification for webhooks
- **Estimated Time:** 2 hours
- **Blocking:** No

#### ACTION-009: Fix Hardcoded PostgreSQL Credentials
- **Severity:** HIGH
- **Owner:** DevOps Auditor
- **Status:** TODO
- **File:** docker-compose.yml (PostgreSQL section)
- **Fix:** Use environment variables for passwords
- **Estimated Time:** 30 minutes
- **Blocking:** No

---

### PHASE 3: IMPORTANT (1 week)

#### ACTION-010: Begin TypeScript Strict Mode Migration
- **Severity:** CRITICAL
- **Owner:** Architecture Auditor
- **Status:** TODO
- **Services:** 9 services with strict: false
- **Fix:** Enable strict:true incrementally, fix errors
- **Estimated Time:** 16 hours (ongoing)
- **Blocking:** No

#### ACTION-011: Fix Profile Cache Invalidation
- **Severity:** HIGH
- **Owner:** Performance Auditor
- **Status:** TODO
- **File:** rez-profile-service/src/services/profile.ts
- **Fix:** Add cache invalidation on profile updates
- **Estimated Time:** 3 hours
- **Blocking:** No

#### ACTION-012: Implement Circuit Breaker in Gateway
- **Severity:** HIGH
- **Owner:** API Auditor
- **Status:** TODO
- **File:** rez-api-gateway
- **Fix:** Add circuit breaker pattern for upstream services
- **Estimated Time:** 4 hours
- **Blocking:** No

#### ACTION-013: Fix In-Memory Trending Cache
- **Severity:** HIGH
- **Owner:** Performance Auditor
- **Status:** TODO
- **File:** rez-search-service/src/services/searchService.ts
- **Fix:** Replace with Redis-based cache
- **Estimated Time:** 4 hours
- **Blocking:** No

#### ACTION-014: Implement Actual Deploy Pipeline
- **Severity:** HIGH
- **Owner:** DevOps Auditor
- **Status:** TODO
- **File:** .github/workflows/deploy.yml
- **Fix:** Replace stub with actual deployment commands
- **Estimated Time:** 6 hours
- **Blocking:** No

---

### PHASE 4: STANDARDIZATION (1 month)

#### ACTION-015: Adopt Shared Packages Across Services
- **Severity:** MEDIUM
- **Owner:** Architecture Auditor
- **Status:** TODO
- **Description:** Only 5/27 services use @rez/shared or @rez/shared-types
- **Fix:** Migrate services to use shared packages
- **Estimated Time:** 20 hours
- **Blocking:** ACTION-006, ACTION-007

#### ACTION-016: Unify Color Tokens
- **Severity:** MEDIUM
- **Owner:** UX Auditor
- **Status:** TODO
- **Description:** 3 different color systems in Consumer app
- **Fix:** Consolidate to SharedBrandTokens across all apps
- **Estimated Time:** 8 hours
- **Blocking:** No

#### ACTION-017: Add Resource Limits to Docker
- **Severity:** MEDIUM
- **Owner:** DevOps Auditor
- **Status:** TODO
- **Files:** All Dockerfiles
- **Fix:** Add MEMORY_LIMIT, CPU_LIMIT
- **Estimated Time:** 4 hours
- **Blocking:** No

#### ACTION-018: Standardize Error Responses
- **Severity:** MEDIUM
- **Owner:** Architecture Auditor
- **Status:** TODO
- **Description:** Inconsistent error format across services
- **Fix:** Create unified errorResponse schema
- **Estimated Time:** 4 hours
- **Blocking:** ACTION-006

#### ACTION-019: Add Health Checks to All Services
- **Severity:** MEDIUM
- **Owner:** DevOps Auditor
- **Status:** TODO
- **Files:** Services missing health endpoints
- **Fix:** Add /health endpoint with checks
- **Estimated Time:** 6 hours
- **Blocking:** No

#### ACTION-020: Enable OpenAPI Documentation
- **Severity:** LOW
- **Owner:** API Auditor
- **Status:** TODO
- **Files:** All services
- **Fix:** Add swagger/openapi.yaml to each service
- **Estimated Time:** 12 hours
- **Blocking:** No

---

## COMPLETED ACTIONS

| ID | Action | Completed | By |
|----|--------|-----------|-----|
| AUDIT-1 | Architecture audit | May 4, 2026 | Auditor 1 |
| AUDIT-2 | Security audit | May 4, 2026 | Auditor 2 |
| AUDIT-3 | Performance audit | May 4, 2026 | Auditor 3 |
| AUDIT-4 | API audit | May 4, 2026 | Auditor 4 |
| AUDIT-5 | Database audit | May 4, 2026 | Auditor 5 |
| AUDIT-6 | UX audit | May 4, 2026 | Auditor 6 |
| AUDIT-7 | Finance audit | May 4, 2026 | Auditor 7 |
| AUDIT-8 | DevOps audit | May 4, 2026 | Auditor 8 |
| FIX-001 | CorpPerks Auth Bypass | May 4, 2026 | Security Team |
| FIX-002 | Grafana Default Password | May 4, 2026 | Security Team |
| FIX-003 | Package Exports Fixed | May 4, 2026 | Architecture Team |
| FIX-004 | Unified errorResponse Created | May 4, 2026 | Architecture Team |
| FIX-005 | Profile Cache Invalidation | May 4, 2026 | Performance Team |
| FIX-006 | In-Memory Cache Fixed | May 4, 2026 | Performance Team |
| FIX-007 | PostgreSQL Credentials Fixed | May 4, 2026 | DevOps Team |
| FIX-008 | Health Checks Added | May 4, 2026 | DevOps Team |
| FIX-009 | Resource Limits Added | May 4, 2026 | DevOps Team |

---

## IN PROGRESS

| ID | Action | Started | Status |
|----|--------|---------|--------|
| - | - | - | - |

---

## BLOCKERS

| Action | Blocker | Owner |
|--------|---------|-------|
| ACTION-005 | Requires ACTION-002 | Finance Auditor |
| ACTION-015 | Requires ACTION-006, ACTION-007 | Architecture Auditor |

---

*Last Updated: May 4, 2026*
*Next Update: May 5, 2026*
