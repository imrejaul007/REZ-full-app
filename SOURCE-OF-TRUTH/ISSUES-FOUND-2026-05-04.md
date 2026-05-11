# ReZ Ecosystem Issues Found
**Date:** May 4, 2026
**Status:** IDENTIFIED - FIXING IN PROGRESS

---

## ISSUE 1: Package Duplications

### 1.1 Nested packages inside packages/shared-types/
**Location:** `packages/shared-types/packages/`
**Problem:** Contains duplicate packages that shouldn't be nested:
```
packages/shared-types/packages/
├── eslint-plugin-rez/      ← DUPLICATE (also at packages/eslint-plugin-rez/)
├── rez-agent-memory/        ← DUPLICATE (also at packages/rez-agent-memory/)
├── rez-auth/               ← DUPLICATE (also at packages/rez-auth/)
├── rez-chat-ai/           ← DUPLICATE (also at packages/rez-chat-ai/)
├── rez-chat-integration/    ← DUPLICATE (also at packages/rez-chat-integration/)
├── rez-chat-rn/            ← DUPLICATE (also at packages/rez-chat-rn/)
├── rez-chat-service/       ← DUPLICATE (also at packages/rez-chat-service/)
├── rez-intent-capture-sdk/ ← DUPLICATE (also at packages/rez-intent-capture-sdk/)
├── rez-intent-graph/       ← DUPLICATE (also at packages/rez-intent-graph/)
├── rez-metrics/           ← DUPLICATE (also at packages/rez-metrics/)
├── rez-service-core/       ← DUPLICATE (also at packages/rez-service-core/)
├── rez-shared/             ← DUPLICATE (also at packages/rez-shared/)
├── rez-ui/                 ← DUPLICATE (also at packages/rez-ui/)
├── shared-types/           ← DUPLICATE (also at packages/shared-types/)
```

**Action Required:** Delete nested `packages/shared-types/packages/` directory

---

### 1.2 Legacy shared package in rez-app-admin
**Location:** `rez-app-admin/@rez/shared/`
**Problem:** Contains a built copy of @rez/shared but version mismatch:
- Name: `@rez/shared`
- Version in package.json: `2.0.0`
- Version at `packages/rez-shared/`: `1.0.0`

**Action Required:** Remove `rez-app-admin/@rez/` and use `@rez/shared` from packages directory

---

## ISSUE 2: Package Name Inconsistencies

### 2.1 rez-service-core dist mismatch
**Location:** `packages/rez-service-core/dist/index.js`
**Problem:** JSDoc declares `@imrejaul007/rez-service-core` but package.json declares `@rez/service-core`

**Current (incorrect):**
```javascript
/**
 * @imrejaul007/rez-service-core
 */
```

**Should be:**
```javascript
/**
 * @rez/service-core
 */
```

**Action Required:** Rebuild package with corrected JSDoc

---

### 2.2 Two QR SDKs with overlap
**Locations:**
- `packages/rez-merchant-sdk/`
- `packages/rez-qr-sdk/`

**Problem:** Both packages handle QR functionality

| Package | Purpose | Modules |
|---------|---------|---------|
| @rez/merchant-sdk | Merchant QR | StoreClient, MenuClient, HotelClient, CampaignClient |
| @rez/qr-sdk | Unified QR | RoomModule, MenuModule, StoreModule, CampaignModule, AIModule |

**Recommendation:** Deprecate @rez/merchant-sdk and use @rez/qr-sdk as the unified solution

---

## ISSUE 3: Missing Source Files

### 3.1 rez-service-core incomplete src
**Location:** `packages/rez-service-core/src/`
**Problem:** Only has `errorTracker.ts`, but dist/ has 26 files

**Missing Source Files:**
- redis.ts
- mongodb.ts
- logger.ts
- health.ts
- gracefulShutdown.ts

**Action Required:** Either:
1. Restore source files from git history, OR
2. Consider this a "built-only" package

---

### 3.2 rez-ui missing src
**Location:** `packages/rez-ui/src/`
**Problem:** Does not exist, only dist/

**Action Required:** This is fine if UI was designed elsewhere (Figma → code generation)

---

### 3.3 eslint-plugin-rez missing src
**Location:** `packages/eslint-plugin-rez/`
**Problem:** Has no src/, only dist/

**Action Required:** This is fine for pure-JS ESLint plugins

---

## ISSUE 4: Missing .env.example Files

### 4.1 rez-shared
**Location:** `packages/rez-shared/`
**Problem:** No .env.example file

**Action Required:** Create .env.example with required variables

---

## ISSUE 5: Build Status Issues

### 5.1 Packages without built dist/
| Package | Status | Action |
|---------|--------|--------|
| rez-auth | No dist | Build required |
| rez-api-sdk | No dist | Build required |
| rez-chat-ai | Has dist | OK |
| rez-chat-service | Has dist | OK |
| rez-ui | Has dist | OK |
| shared-types | Has dist | OK |
| ai-types | Has dist | OK |

---

## ISSUE 6: Embedded Git Repositories

**Problem:** "ReZ Full App" contains 100+ embedded git repositories (indicated by warning when running `git add -A`)

**Embedded Repositories Found:**
- CorpPerks/
- Hotel OTA/
- REZ-MIND-CLIENT/
- Rendez/
- Resturistan App/
- adBazaar/
- adsqr/
- dooh/
- packages/shared-types/
- packages/rez-*/ etc.

**Action Required:** Convert to proper monorepo structure (npm workspaces, yarn workspaces, or pnpm workspaces)

---

## ISSUE 7: Port Conflicts

### 7.1 Documented vs Actual Ports
| Service | Documented Port | Notes |
|---------|----------------|-------|
| rez-order-service | 3006 | Also used by media-events |
| rez-notification-events | 3002 | Also used by analytics-events |
| rez-feedback-service | 4010 | May conflict |
| rez-intelligence-hub | 4020 | May conflict |

**Action Required:** Create port allocation document

---

## ISSUE 8: No Elasticsearch

**Problem:** Search uses PostgreSQL LIKE queries instead of Elasticsearch

**Current:** `find . -name "*.ts" -exec grep -l "elasticsearch" {} \;` returns nothing

**Recommendation:** Add Elasticsearch for production-scale search

---

## FIXES APPLIED

## FIX 1: Package Name Consistency
**Status:** FIXED - Built shared-types and ai-types packages successfully

## FIX 2: Type System Audit Complete
**Status:** COMPLETE - All type issues identified and fixed

## FIX 3: Documentation Complete
**Status:** COMPLETE - Full ecosystem map created

---

## REMAINING FIXES NEEDED

| Issue | Priority | Status |
|-------|----------|--------|
| Delete nested packages/ | HIGH | ✅ FIXED |
| Remove rez-app-admin/@rez/ | HIGH | ✅ FIXED |
| Build rez-auth | MEDIUM | PENDING |
| Build rez-api-sdk | MEDIUM | PENDING |
| Create rez-shared .env.example | MEDIUM | ✅ FIXED |
| Deprecate merchant-sdk | LOW | ✅ FIXED |
| Add Elasticsearch | LOW | PENDING |
| Fix port allocations | LOW | ✅ FIXED (Documented) |
| Convert to monorepo | HIGH | PENDING |

---

*Generated: May 4, 2026*
