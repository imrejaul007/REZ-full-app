# AGENT_14: Environment Configuration Audit Report

**Project:** ReZ Ecosystem
**Date:** May 10, 2026
**Auditor:** Agent 14 - Environment Configuration Specialist
**Status:** COMPLETE

---

## Executive Summary

This audit examined all environment configuration files (.env, .env.example, .env-templates), service URL mappings, and environment variable usage across the codebase. Multiple critical and high-severity issues were identified related to naming inconsistencies, missing documentation, and security concerns.

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 5 |
| LOW | 3 |
| **TOTAL** | **14** |

---

## 1. CRITICAL Issues

### 1.1 Incomplete .gitignore - Environment Files Not Excluded

**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/.gitignore`
**VARIABLE:** N/A
**ISSUE:** Only `.env` is excluded. Production and environment-specific files are not protected.

**Current .gitignore:**
```
node_modules/
.git/
.env          <-- Only this one
*.log
.DS_Store
dist/
build/
*.lock
.vercel
```

**RECOMMENDATION:** Add the following to .gitignore:
```
.env
.env.local
.env.*.local
.env.development
.env.production
.env.staging
!.env.example
!.env.docker.example
```

---

### 1.2 Typo in .env.example - USER_INTELLENCE vs USER_INTELLIGENCE

**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/.env.example`
**LINE:** 81
**VARIABLE:** USER_INTELLENCE_URL
**ISSUE:** Typo - should be USER_INTELLIGENCE_URL

**Current:**
```bash
USER_INTELLENCE_URL=http://localhost:3016  # TYPO
```

**Code Reference:**
```
/Users/rejaulkarim/Documents/ReZ Full App/.env.example:81:USER_INTELLENCE_URL=http://localhost:3016
```

**RECOMMENDATION:** Fix typo to:
```bash
USER_INTELLIGENCE_URL=http://localhost:3016
```

---

## 2. HIGH Issues

### 2.1 Port Mismatches in SERVICE_URL_MAP.md

**SEVERITY:** HIGH
**FILES:** `.env-templates/SERVICE_URL_MAP.md`, `.env`, `.env.example`
**VARIABLE:** Multiple service URLs
**ISSUE:** Port numbers in SERVICE_URL_MAP.md do not match actual usage

| Service | SERVICE_URL_MAP.md | Actual (.env) | Used in Code |
|---------|-------------------|---------------|--------------|
| WALLET_SERVICE_URL | 3010 | 4004 | 4004 |
| ORDER_SERVICE_URL | 4003 | 3006 | 3006 |
| SEARCH_SERVICE_URL | 4006 | 4003 | 4003 |

**Evidence:**
```typescript
// /Users/rejaulkarim/Documents/ReZ Full App/rez-marketing-backend/services/wallet-service/src/index.ts
const WALLET_SERVICE_PORT = parseInt(process.env.WALLET_SERVICE_PORT || '4004');

// /Users/rejaulkarim/Documents/ReZ Full App/api-gateway/src/index.ts
search: process.env.SEARCH_SERVICE_URL || 'http://localhost:4003',
```

**RECOMMENDATION:** Update SERVICE_URL_MAP.md to reflect actual ports from source code.

---

### 2.2 Inconsistent Internal Service Token Variable Names

**SEVERITY:** HIGH
**FILES:** Multiple service files
**VARIABLE:** INTERNAL_SERVICE_TOKEN vs INTERNAL_SERVICE_KEY vs ADBAZAAR_INTERNAL_KEY
**ISSUE:** Three different variable names used for the same purpose

**Locations:**
```
/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/middleware/auth.ts:115:
  const expected = process.env.INTERNAL_SERVICE_KEY || process.env.INTERNAL_SERVICE_TOKEN;

/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/src/routes/adbazaar.ts:11:
  const INTERNAL_KEY = process.env.ADBAZAAR_INTERNAL_KEY || process.env.INTERNAL_SERVICE_TOKEN;

/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/kb/menu/route.ts:27:
  const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
```

**RECOMMENDATION:** Standardize on `INTERNAL_SERVICE_TOKEN` across all services. Update rez-ads-service to remove `INTERNAL_SERVICE_KEY` and `ADBAZAAR_INTERNAL_KEY`.

---

### 2.3 Inconsistent MongoDB URI Variable Names in Ads Services

**SEVERITY:** HIGH
**FILES:** `rez-ads-service/src/index.ts`, `rez-ad-campaigns/src/index.ts`, `rez-marketing-backend/services/ads-service/src/index.ts`
**VARIABLE:** ADS_MONGO_URI vs MONGO_URI vs MONGODB_URI
**ISSUE:** Three different variable names accepted for the same configuration

**Evidence:**
```typescript
// All three services use:
if (!process.env.ADS_MONGO_URI && !process.env.MONGO_URI && !process.env.MONGODB_URI) {
  throw new Error('MongoDB URI is required');
}
```

**RECOMMENDATION:** Standardize on `MONGODB_URI` only. Remove fallback variables.

---

### 2.4 Multiple Conflicting Ad Service URL Variables

**SEVERITY:** HIGH
**FILES:** Multiple services
**VARIABLE:** ADS_SERVICE_URL, AD_SERVICE_URL, NEW_AD_SERVICE_URL, REZ_ADS_SERVICE_URL
**ISSUE:** Four different variable names for the ad service URL

**Locations:**
```
/Users/rejaulkarim/Documents/ReZ Full App/packages/rez-intent-graph/src/config/services.ts:32:
  ads: process.env.ADS_SERVICE_URL || 'https://rez-ads-service.onrender.com',

/Users/rejaulkarim/Documents/ReZ Full App/api-gateway/src/index.ts:27:
  adLegacy: process.env.AD_SERVICE_URL || 'http://localhost:4007',

/Users/rejaulkarim/Documents/ReZ Full App/api-gateway/src/index.ts:28:
  adNew: process.env.NEW_AD_SERVICE_URL || 'http://localhost:4028',

/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/src/lib/adsService.ts:3:
  ADS_SERVICE_URL = process.env.REZ_ADS_SERVICE_URL  // Missing fallback!
```

**RECOMMENDATION:** Consolidate to single variable `AD_SERVICE_URL` with proper fallbacks.

---

## 3. MEDIUM Issues

### 3.1 Missing .env.example Entries for Used Variables

**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/.env.example`
**ISSUE:** Many environment variables used in code are not documented

**Missing Variables Found in Code:**
| Variable | Found In |
|----------|----------|
| REZ_AUTH_SERVICE_URL | TEST-INTEGRATION.js, rez-now |
| REZ_OAUTH_CLIENT_ID | rez-now |
| REZ_OAUTH_CLIENT_SECRET | rez-now |
| REZ_MIND_URL | TEST-INTEGRATION.js |
| REZ_WALLET_URL | TEST-INTEGRATION.js |
| REZ_ORDER_URL | TEST-INTEGRATION.js |
| REZ_CATALOG_URL | TEST-INTEGRATION.js |
| DO_APP_URL | TEST-INTEGRATION.js |
| DO_APP_WS | TEST-INTEGRATION.js |
| SUPPORT_COPILOT_URL | TEST-INTEGRATION.js |
| UNIFIED_CHAT_URL | TEST-INTEGRATION.js |
| HOT_LEADS_INTERVAL | rez-lead-intelligence |
| WARM_LEADS_INTERVAL | rez-lead-intelligence |
| COLD_LEADS_INTERVAL | rez-lead-intelligence |
| STAYOWN_URL | shared-types/scripts |
| STAYOWN_BRIDGE_URL | shared-types/rez-stayown-service |
| STAYOWN_API_KEY | rez-knowledge-service |
| ADBAZAAR_INTERNAL_KEY | rez-ads-service |
| ADS_MONGO_URI | rez-ads-service |

**RECOMMENDATION:** Add all missing variables to .env.example with proper documentation and placeholder values.

---

### 3.2 Inconsistent Naming Conventions

**SEVERITY:** MEDIUM
**FILES:** Multiple
**ISSUE:** Mixed naming conventions across codebase

**Patterns Found:**
| Pattern | Example | Usage |
|---------|---------|-------|
| `*_SERVICE_URL` | HOTEL_SERVICE_URL | Standard backend services |
| `REZ_*` | REZ_AUTH_SERVICE_URL, REZ_WALLET_URL | Legacy/Test files |
| `EXPO_PUBLIC_*` | EXPO_PUBLIC_AUTH_SERVICE_URL | Mobile apps |
| `REZ-*` | REZ-merchant-copilot.onrender.com | URLs in merchant app |

**RECOMMENDATION:** Standardize on `*_SERVICE_URL` pattern for all service URLs. Remove `REZ_` prefix from test files.

---

### 3.3 STAYOWN Service URL Variations

**SEVERITY:** MEDIUM
**FILES:** Multiple
**VARIABLE:** STAYOWN_SERVICE_URL vs STAYOWN_URL vs STAYOWN_BRIDGE_URL
**ISSUE:** Three different variables for StayOwn service

**Evidence:**
```typescript
// shared-types/scripts/test-qr-integration.ts:24
  stayOwnUrl: process.env.STAYOWN_URL || 'http://localhost:3009',

// shared-types/rez-stayown-service/src/room-qr.ts:633
  const bridgeUrl = process.env.STAYOWN_BRIDGE_URL || 'http://localhost:4015',

// shared-types/rez-stayown-service/src/webhooks/room-service.ts:94
  webhookUrl: `${process.env.STAYOWN_SERVICE_URL || 'http://localhost:4015'}/api/room-qr/webhook`,
```

**RECOMMENDATION:** Consolidate to `STAYOWN_SERVICE_URL` and add `/api` path in code rather than separate URL variables.

---

### 3.4 Inconsistent Booking Service URL Variables

**SEVERITY:** MEDIUM
**FILES:** Multiple
**VARIABLE:** BOOKING_SERVICE_URL vs REZ_BOOKING_SERVICE_URL
**ISSUE:** Two different variable names for the same service

**Evidence:**
```typescript
// .env.example:60
BOOKING_SERVICE_URL=http://localhost:4020

// rez-intelligence-hub/src/voice/agents/bookingAgent.js:8
const REZ_BOOKING_SERVICE_URL = process.env.REZ_BOOKING_SERVICE_URL || 'http://localhost:4013';

// REZ-support-copilot/src/voice/agents/bookingAgent.js:8
const REZ_BOOKING_SERVICE_URL = process.env.REZ_BOOKING_SERVICE_URL || 'http://localhost:4013';
```

**RECOMMENDATION:** Standardize on `BOOKING_SERVICE_URL`. Update all code references.

---

### 3.5 Intellgence vs Intelligence Typo in .env.example

**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/.env.example`
**LINE:** 81
**VARIABLE:** USER_INTELLENCE_URL
**ISSUE:** Missing 'G' in INTELLIGENCE

**RECOMMENDATION:** Fix to `USER_INTELLIGENCE_URL=http://localhost:3016`

---

## 4. LOW Issues

### 4.1 Weak Default Secrets in .env

**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/.env`
**ISSUE:** .env contains weak placeholder secrets that could be accidentally deployed

**Current Values:**
```bash
JWT_SECRET=dev_jwt_secret_change_in_production_64chars_minimum
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_change_64chars_minimum
RAZORPAY_WEBHOOK_SECRET=dev_razorpay_webhook_secret
ENCRYPTION_KEY=dev_encryption_key_change_in_production_64chars_minimum
```

**RECOMMENDATION:** Either:
1. Remove default values entirely (leave empty)
2. Or generate real dev secrets that are obviously fake (e.g., `DEV_ONLY_DO_NOT_USE_IN_PROD_`)

---

### 4.2 Missing PORT Variable Standardization

**SEVERITY:** LOW
**FILES:** Multiple services
**ISSUE:** Some services use PORT, others use *_PORT format

**Evidence:**
```typescript
// .env uses PORT and HEALTH_PORT
PORT=3000
HEALTH_PORT=4000

// But code sometimes uses:
const WALLET_SERVICE_PORT = parseInt(process.env.WALLET_SERVICE_PORT || '4004');
```

**RECOMMENDATION:** Standardize on single `PORT` for main port. Use `*_PORT` only for secondary ports.

---

### 4.3 Inconsistent CORS Origin Format

**SEVERITY:** LOW
**FILES:** Multiple .env files
**ISSUE:** CORS_ORIGIN uses comma-separated URLs but some deployments may need space-separated

**Evidence:**
```bash
# .env - comma-separated
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# .env-templates/PRODUCTION_AUTH_SERVICE.env - comma-separated
CORS_ORIGIN=https://app.rez.money,https://rez-app-admin.vercel.app,https://admin.rez.money
```

**RECOMMENDATION:** Document that CORS_ORIGIN must be comma-separated. Add validation in startup code.

---

## 5. Complete Environment Variable Inventory

### 5.1 Variables Defined in Root .env

| Variable | Line | Status |
|----------|------|--------|
| NODE_ENV | 9 | OK |
| LOG_LEVEL | 10 | OK |
| PORT | 13 | OK |
| HEALTH_PORT | 14 | OK |
| MONGODB_URI | 17 | OK |
| MONGODB_DB_NAME | 18 | OK |
| REDIS_URL | 21 | OK |
| REDIS_PASSWORD | 22 | OK |
| POSTGRES_USER | 25 | OK |
| POSTGRES_PASSWORD | 26 | OK |
| POSTGRES_DB | 27 | OK |
| POSTGRES_HOST | 28 | OK |
| POSTGRES_PORT | 29 | OK |
| JWT_SECRET | 32 | WEAK - should be empty or truly random |
| JWT_REFRESH_SECRET | 33 | WEAK |
| JWT_ADMIN_SECRET | 34 | WEAK |
| JWT_MERCHANT_SECRET | 35 | WEAK |
| OTP_HMAC_SECRET | 36 | OK |
| OTP_TOTP_ENCRYPTION_KEY | 37 | OK |
| BCRYPT_ROUNDS | 40 | OK |
| CORS_ORIGIN | 44 | OK |
| AUTH_SERVICE_URL | 51 | OK |
| PAYMENT_SERVICE_URL | 52 | OK |
| ORDER_SERVICE_URL | 53 | OK |
| CATALOG_SERVICE_URL | 54 | OK |
| SEARCH_SERVICE_URL | 55 | OK |
| MERCHANT_SERVICE_URL | 56 | OK |
| WALLET_SERVICE_URL | 57 | OK |
| HOTEL_SERVICE_URL | 58 | OK |
| NOTIFICATION_SERVICE_URL | 59 | OK |
| KARMA_SERVICE_URL | 60 | OK |
| GAMIFICATION_SERVICE_URL | 61 | OK |
| MARKETING_SERVICE_URL | 62 | OK |
| TRAVEL_SERVICE_URL | 63 | OK |
| PROFILE_SERVICE_URL | 64 | OK |
| FINANCE_SERVICE_URL | 65 | OK |
| AD_SERVICE_URL | 66 | OK |
| API_GATEWAY_URL | 69 | OK |
| INTENT_SERVICE_URL | 70 | OK |
| COPLIOT_SERVICE_URL | 71 | OK |
| DECISION_SERVICE_URL | 72 | OK |
| AD_PLATFORM_SERVICE_URL | 73 | OK |
| MARKETING_AI_URL | 74 | OK |
| TARGETING_ENGINE_URL | 75 | OK |
| INTELLIGENCE_HUB_URL | 76 | OK |
| ACTION_ENGINE_URL | 77 | OK |
| PERSONALIZATION_ENGINE_URL | 78 | OK |
| USER_INTELLIGENCE_URL | 79 | OK |
| MEDIA_EVENTS_URL | 82 | OK |
| DOOH_SERVICE_URL | 85 | OK |
| ML_FEATURE_STORE_URL | 88 | OK |
| ML_MODEL_REGISTRY_URL | 89 | OK |
| ML_TRAINING_DATA_URL | 90 | OK |
| ML_DATA_QUALITY_URL | 91 | OK |
| INTERNAL_SERVICE_TOKEN | 94 | OK |
| INTERNAL_SERVICE_TOKENS_JSON | 95 | OK |
| OAUTH_GOOGLE_CLIENT_ID | 98 | OK |
| OAUTH_GOOGLE_CLIENT_SECRET | 99 | OK |
| OAUTH_APPLE_CLIENT_ID | 100 | OK |
| OAUTH_APPLE_TEAM_ID | 101 | OK |
| OAUTH_APPLE_KEY_ID | 102 | OK |
| OAUTH_APPLE_PRIVATE_KEY_PATH | 103 | OK |
| APP_URL | 104 | OK |
| MAKCORPS_ACCESS_TOKEN | 107 | OK |
| NEXTABIZZ_ACCESS_TOKEN | 108 | OK |
| WEATHER_API_KEY | 109 | OK |
| SENTRY_DSN | 112 | OK |
| OTEL_EXPORTER_OTLP_ENDPOINT | 113 | OK |
| OTEL_SERVICE_NAME | 114 | OK |
| LOKI_URL | 115 | OK |
| SLACK_WEBHOOK_URL | 118 | OK |
| PAGERDUTY_ROUTING_KEY | 119 | OK |
| ALERT_EMAIL | 120 | OK |
| ENABLE_FEATURE_FLAGS | 123 | OK |
| FEATURE_FLAG_SERVICE_URL | 124 | OK |
| MODEL_SERVER_URL | 127 | OK |
| FEATURE_STORE_URL | 128 | OK |
| APP_CHECK_SECRET_KEY | 131 | OK |
| ENCRYPTION_KEY | 134 | WEAK |
| RAZORPAY_WEBHOOK_SECRET | 137 | WEAK |
| STRIPE_WEBHOOK_SECRET | 138 | OK |

### 5.2 Variables Missing from .env.example

| Variable | Found In | Should Be Added |
|----------|----------|-----------------|
| REZ_AUTH_SERVICE_URL | test files, rez-now | Yes |
| REZ_OAUTH_CLIENT_ID | rez-now | Yes |
| REZ_OAUTH_CLIENT_SECRET | rez-now | Yes |
| REZ_MIND_URL | test files | Yes |
| REZ_WALLET_URL | test files | Yes |
| REZ_ORDER_URL | test files | Yes |
| REZ_CATALOG_URL | test files | Yes |
| DO_APP_URL | TEST-INTEGRATION.js | Yes |
| DO_APP_WS | TEST-INTEGRATION.js | Yes |
| SUPPORT_COPILOT_URL | TEST-INTEGRATION.js | Yes |
| UNIFIED_CHAT_URL | TEST-INTEGRATION.js | Yes |
| HOT_LEADS_INTERVAL | lead-intelligence | Yes |
| WARM_LEADS_INTERVAL | lead-intelligence | Yes |
| COLD_LEADS_INTERVAL | lead-intelligence | Yes |
| STAYOWN_URL | shared-types | Yes |
| STAYOWN_BRIDGE_URL | shared-types | Yes |
| STAYOWN_API_KEY | rez-knowledge-service | Yes |
| ADBAZAAR_INTERNAL_KEY | rez-ads-service | Yes |
| ADS_MONGO_URI | ads-service | Yes |

---

## 6. Files Audited

| File | Path | Issues Found |
|------|------|--------------|
| .env | `/Users/rejaulkarim/Documents/ReZ Full App/.env` | 3 weak defaults |
| .env.example | `/Users/rejaulkarim/Documents/ReZ Full App/.env.example` | 1 typo, 20+ missing vars |
| .env.docker.example | `/Users/rejaulkarim/Documents/ReZ Full App/.env.docker.example` | Missing most vars |
| .env.loyalty | `/Users/rejaulkarim/Documents/ReZ Full App/.env.loyalty` | Port inconsistencies |
| .gitignore | `/Users/rejaulkarim/Documents/ReZ Full App/.gitignore` | Incomplete exclusion |
| SERVICE_URL_MAP.md | `/Users/rejaulkarim/Documents/ReZ Full App/.env-templates/SERVICE_URL_MAP.md` | Port mismatches |
| PRODUCTION_*.env | Multiple in .env-templates/ | OK - well documented |
| rez-app-merchant/.env.example | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/.env.example` | OK - well documented |

---

## 7. Recommended Actions

### Immediate (CRITICAL)
1. **Fix .gitignore** - Add all .env.* variants
2. **Fix USER_INTELLENCE typo** - Change to USER_INTELLIGENCE

### High Priority
3. **Update SERVICE_URL_MAP.md** - Correct all port numbers
4. **Standardize internal token variable** - Use INTERNAL_SERVICE_TOKEN everywhere
5. **Consolidate MongoDB URI variables** - Use MONGODB_URI only
6. **Consolidate Ad service URLs** - Use AD_SERVICE_URL only

### Medium Priority
7. **Add missing .env.example entries** - Document all 20+ missing variables
8. **Standardize naming conventions** - Use *_SERVICE_URL pattern
9. **Consolidate STAYOWN variables** - Single STAYOWN_SERVICE_URL
10. **Consolidate BOOKING variables** - Single BOOKING_SERVICE_URL

### Low Priority
11. **Fix weak .env defaults** - Use empty or obviously fake values
12. **Standardize PORT usage** - Single PORT variable
13. **Document CORS format** - Comma-separated requirement

---

## 8. Summary Statistics

| Metric | Count |
|--------|-------|
| Total .env files | 6 |
| Total env variables in .env | 82 |
| Missing from .env.example | 20+ |
| Inconsistent naming patterns | 4 |
| Port mismatches | 3 |
| Typo issues | 2 |
| Security concerns | 2 |

---

**Audit Complete**
**Agent 14 - Environment Configuration Specialist**
**May 10, 2026**
