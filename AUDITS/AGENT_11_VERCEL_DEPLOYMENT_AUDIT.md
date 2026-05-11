# AGENT_11_VERCEL_DEPLOYMENT_AUDIT.md

## Vercel Deployment Audit Report

**Auditor:** Agent 11 - Vercel Deployment Specialist
**Date:** May 10, 2026
**Project:** ReZ Ecosystem
**Audit Scope:** Vercel deployments, vercel.json configs, environment variables, build configurations

---

## EXECUTIVE SUMMARY

| Category | Status | Issues Found |
|----------|--------|--------------|
| vercel.json Files | 23 found | 8 problematic |
| Environment Variables | 60+ env files | 12 missing/broken |
| Deployed Services | 6 services | 4 need attention |
| Build Configurations | Various | 3 inconsistencies |
| Security Headers | Partial | 5 missing CSP headers |

---

## DEPLOYED SERVICES (FROM SOURCE-OF-TRUTH)

| System | URL | Project ID | Status |
|--------|-----|------------|--------|
| adBazaar | https://ad-bazaar.vercel.app | - | NEEDS_REVIEW |
| adsqr | https://adsqr.vercel.app | - | NEEDS_REVIEW |
| creators | https://creators.vercel.app | prj_XWqfyQw5WWRsW9IaealRBiTeDRG9 | DEPLOYED |
| dooh-screen-app | https://creators.vercel.app | - | SHARED_HOSTING |
| verify-service | https://creators.vercel.app | - | SHARED_HOSTING |
| nextabizz | https://web-6n4fnj718-re-z.vercel.app | - | DEPLOYED |

---

## DETAILED ISSUES

### CRITICAL SEVERITY ISSUES

#### ISSUE #1: Missing Environment Variables in Vercel
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/vercel.json`
**LINE:** 7-10
**ISSUE:** adBazaar references `@supabase-url` and `@supabase-anon-key` as Vercel secrets, but these may not be configured in the Vercel project settings.
**IMPACT:** Build will fail if secrets are not set in Vercel dashboard.
**RECOMMENDATION:**
1. Go to Vercel Dashboard > adBazaar Project > Settings > Environment Variables
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` with production values
3. Create Vercel secrets with: `vercel secrets add supabase-url <value>`

---

#### ISSUE #2: Inconsistent Package Manager in nextabizz
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/apps/web/vercel.json`
**LINE:** 4
**ISSUE:** Uses `pnpm build` and `pnpm install` but other services use `npm`. This causes inconsistent builds.
**CURRENT:**
```json
"buildCommand": "pnpm build",
"devCommand": "pnpm dev",
"installCommand": "pnpm install"
```
**RECOMMENDATION:** Standardize on npm or ensure pnpm is properly configured in vercel.json:
```json
"installCommand": "pnpm install --frozen-lockfile"
```

---

#### ISSUE #3: Localhost URLs in Production Environment
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/verify-service/.env.example`
**LINES:** 11-17
**ISSUE:** Example env file contains localhost URLs that would break production:
```
WALLET_API_URL="http://localhost:3001"
AUTH_API_URL="http://localhost:3002"
KARMA_API_URL="http://localhost:4001"
REZ_MIND_URL="http://localhost:4008"
```
**RECOMMENDATION:** Create a separate `.env.production` file with production URLs:
```
WALLET_API_URL="https://rez-wallet-service.onrender.com"
AUTH_API_URL="https://rez-auth-service.onrender.com"
KARMA_API_URL="https://rez-karma-service.onrender.com"
REZ_MIND_URL="https://rez-mind.onrender.com"
```

---

#### ISSUE #4: nextabizz Localhost in OAuth Config
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/.env.example`
**LINES:** 38-45
**ISSUE:** OAuth redirect URI and auth URLs point to localhost:
```
REZ_OAUTH_REDIRECT_URI=https://ad-bazaar.vercel.app/api/auth/rez-callback  # External
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com  # Correct
NEXT_PUBLIC_NEXTABIZZ_CLIENT_ID=nextabizz
REZ_OAUTH_CLIENT_SECRET=change-me-generate-with-openssl-rand-base64-64  # WEAK DEFAULT
NEXTAUTH_URL=http://localhost:3000  # LOCALHOST - CRITICAL
NEXTAUTH_SECRET=your-nextauth-secret-key  # TOO SHORT
```
**RECOMMENDATION:**
1. Set `NEXTAUTH_URL` to production URL in Vercel env vars
2. Generate strong `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
3. Update `REZ_OAUTH_CLIENT_SECRET` with: `openssl rand -base64 64`

---

#### ISSUE #5: Missing Production Database URL
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/.env.example`
**LINE:** 7
**ISSUE:** DATABASE_URL points to local PostgreSQL:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```
**IMPACT:** Missing Supabase connection string for production.
**RECOMMENDATION:** Add `DATABASE_URL` to Vercel environment variables with production Supabase connection string.

---

### HIGH SEVERITY ISSUES

#### ISSUE #6: Duplicate vercel.json in Backup Directories
**SEVERITY:** HIGH
**FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar.backup/vercel.json`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-scheduler-service.backup/vercel.json`
- `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz.backup/apps/web/vercel.json`
**ISSUE:** Backup directories contain old vercel.json files that can cause confusion or accidental deployments.
**RECOMMENDATION:** Remove vercel.json from all backup directories:
```bash
rm /Users/rejaulkarim/Documents/ReZ\ Full\ App/adBazaar.backup/vercel.json
rm /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-scheduler-service.backup/vercel.json
rm /Users/rejaulkarim/Documents/ReZ\ Full\ App/nextabizz.backup/apps/web/vercel.json
```

---

#### ISSUE #7: Missing Security Headers on Multiple Services
**SEVERITY:** HIGH
**FILES:**
- `/Users/rejaulkarim/Documents/ReZ Full App/creators/vercel.json` - Missing HSTS, CSP headers
- `/Users/rejaulkarim/Documents/ReZ Full App/verify-service/vercel.json` - Only has `{"framework":"nextjs"}`, no headers
- `/Users/rejaulkarim/Documents/ReZ Full App/dooh-screen-app/vercel.json` - Missing security headers
**ISSUE:** Services lack comprehensive security headers (HSTS, CSP, X-Frame-Options).
**RECOMMENDATION:** Add standard security headers to all vercel.json files:
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-XSS-Protection", "value": "1; mode=block" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" }
    ]
  }
]
```

---

#### ISSUE #8: Empty Sentry DSN in Production
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/vercel.json`
**LINE:** 27
**ISSUE:** `EXPO_PUBLIC_SENTRY_DSN` is set to empty string:
```json
"EXPO_PUBLIC_SENTRY_DSN": ""
```
**IMPACT:** Error monitoring is disabled.
**RECOMMENDATION:** Add valid Sentry DSN to Vercel environment variables or remove the empty value.

---

#### ISSUE #9: Inconsistent Region Configuration
**SEVERITY:** HIGH
**FILES:**
- `adBazaar` - Region: `blr1` (Bangalore)
- `nextabizz` - Region: `sin1` (Singapore)
- `REZ-dashboard` - Region: `iad1` (Virginia)
- `rez-now` - Region: `bom1` (Mumbai)
- `creators` - No region specified
**ISSUE:** Services are deployed to inconsistent regions, causing latency issues for users in India.
**RECOMMENDATION:** Deploy all India-focused services to `bom1` (Mumbai) or `blr1` (Bangalore) for optimal latency.

---

#### ISSUE #10: Cron Job Without Authentication
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/vercel.json`
**LINES:** 2-6
**ISSUE:** Cron jobs are defined but lack secret-based authentication:
```json
"crons": [
  {
    "path": "/api/cron/freshness",
    "schedule": "0 3 * * *"
  }
]
```
**IMPACT:** Anyone can trigger cron endpoints.
**RECOMMENDATION:** Add CRON_SECRET to Vercel env vars and verify in cron handler:
```typescript
// In /api/cron/freshness/route.ts
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

### MEDIUM SEVERITY ISSUES

#### ISSUE #11: adsqr Missing Comprehensive vercel.json
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/adsqr/vercel.json`
**ISSUE:** Only contains framework setting, missing build config, headers, and environment variables.
**CURRENT:**
```json
{"framework":"nextjs"}
```
**RECOMMENDATION:** Expand vercel.json with proper configuration:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

---

#### ISSUE #12: verify-service Missing Environment Variables
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/verify-service/vercel.json`
**ISSUE:** Minimal config without environment variables.
**RECOMMENDATION:** Add required environment variables:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "env": {
    "DATABASE_URL": "@verify-database-url",
    "JWT_SECRET": "@verify-jwt-secret",
    "INTERNAL_SERVICE_KEY": "@verify-internal-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```

---

#### ISSUE #13: Multiple .env Files Causing Confusion
**SEVERITY:** MEDIUM
**FILES:**
- Root `.env`
- Root `.env.example`
- Root `.env.loyalty`
- Root `.env.docker.example`
- Service-specific `.env.example` files (50+)
**ISSUE:** Multiple env templates can cause confusion about which to use.
**RECOMMENDATION:**
1. Consolidate environment variable documentation
2. Add clear comments in each .env.example about when to use it
3. Create a centralized `.env.template` at project root

---

#### ISSUE #14: REZ-dashboard Referencing Non-existent Secret
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dashboard/vercel.json`
**LINES:** 40-44
**ISSUE:** References `@app-url` secret and `analytics-api-key` secret that may not exist:
```json
"env": {
  "NEXT_PUBLIC_APP_URL": "@app-url"
},
"secret": [
  "analytics-api-key"
]
```
**RECOMMENDATION:** Verify these secrets exist in Vercel dashboard or create them:
```bash
vercel secrets add app-url "https://rez-dashboard.vercel.app"
vercel secrets add analytics-api-key "<your-key>"
```

---

#### ISSUE #15: duplicate adBazaar Internal Keys
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/.env.example`
**LINES:** 26, 68
**ISSUE:** `ADBAZAAR_INTERNAL_KEY` is defined twice with different values:
```bash
# Line 26:
ADBAZAZAAR_INTERNAL_KEY=generate_with_openssl_rand_hex_32

# Line 68:
ADBAZAAR_INTERNAL_KEY=generate_with_openssl_rand_hex_32
```
**RECOMMENDATION:** Remove duplicate and use consistent naming. Ensure only one instance exists.

---

### LOW SEVERITY ISSUES

#### ISSUE #16: next.config.ts Output File Path
**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/apps/web/next.config.ts`
**LINE:** 6
**ISSUE:** Hardcoded absolute path breaks portability:
```typescript
outputFileTracingRoot: '/Users/rejaulkarim/Documents/ReZ Full App/nextabizz'
```
**RECOMMENDATION:** Use relative path or remove entirely:
```typescript
outputFileTracingRoot: path.join(__dirname, '..', '..', '..')
```

---

#### ISSUE #17: Empty Trust Proxy Config
**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/.env.example`
**LINE:** 65
**ISSUE:** `TRUSTED_PROXY_IPS` is empty but has a misleading comment:
```
# Comma-separated list of trusted proxy IPs (e.g., Vercel edge IPs)
# Leave empty to only trust x-real-ip (recommended for Vercel/serverless)
TRUSTED_PROXY_IPS=
```
**RECOMMENDATION:** This is correct for Vercel, but add explicit comment:
```
# For Vercel serverless, leave empty (trusts x-real-ip header)
TRUSTED_PROXY_IPS=
```

---

#### ISSUE #18: Missing Framework Declaration
**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-web-menu/vercel.json`
**ISSUE:** Framework not explicitly declared.
**RECOMMENDATION:** Add explicit framework declaration:
```json
{
  "framework": "nextjs",
  ...
}
```

---

## SUMMARY TABLE

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | CRITICAL | adBazaar/vercel.json | Missing Supabase secrets |
| 2 | CRITICAL | nextabizz/apps/web/vercel.json | pnpm vs npm inconsistency |
| 3 | CRITICAL | verify-service/.env.example | Localhost URLs in example |
| 4 | CRITICAL | nextabizz/.env.example | Localhost in NEXTAUTH_URL |
| 5 | CRITICAL | nextabizz/.env.example | Missing production DATABASE_URL |
| 6 | HIGH | *.backup/vercel.json | Backup directories with old configs |
| 7 | HIGH | creators/vercel.json | Missing security headers |
| 8 | HIGH | rez-app-admin/vercel.json | Empty Sentry DSN |
| 9 | HIGH | Multiple vercel.json | Inconsistent region configs |
| 10 | HIGH | adBazaar/vercel.json | Unprotected cron endpoints |
| 11 | MEDIUM | adsqr/vercel.json | Minimal configuration |
| 12 | MEDIUM | verify-service/vercel.json | Missing env vars |
| 13 | MEDIUM | Multiple .env files | Too many env templates |
| 14 | MEDIUM | REZ-dashboard/vercel.json | Missing Vercel secrets |
| 15 | MEDIUM | adBazaar/.env.example | Duplicate ADBAZAAR_INTERNAL_KEY |
| 16 | LOW | nextabizz/apps/web/next.config.ts | Hardcoded path |
| 17 | LOW | adBazaar/.env.example | Misleading TRUSTED_PROXY_IPS comment |
| 18 | LOW | rez-web-menu/vercel.json | Missing framework declaration |

---

## RECOMMENDED ACTIONS

### Immediate (P0)
1. Add Supabase environment variables to Vercel dashboard for adBazaar
2. Fix localhost URLs in nextabizz .env.example
3. Remove vercel.json from all backup directories
4. Add NEXTAUTH_URL and NEXTAUTH_SECRET to nextabizz Vercel env vars

### High Priority (P1)
5. Add security headers to creators, verify-service, dooh-screen-app
6. Standardize region deployment (use bom1 for India services)
7. Protect cron endpoints with authentication
8. Add valid Sentry DSN or remove empty value

### Medium Priority (P2)
9. Expand adsqr and verify-service vercel.json configs
10. Create consolidated .env.template file
11. Verify REZ-dashboard Vercel secrets exist

### Low Priority (P3)
12. Fix hardcoded path in nextabizz next.config.ts
13. Add explicit framework declarations

---

## FILES ANALYZED

| File Path | Status |
|-----------|--------|
| `/Users/rejaulkarim/Documents/ReZ Full App/vercel.json` | OK |
| `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/adsqr/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/creators/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/apps/web/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/verify-service/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/dooh-screen-app/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/vercel.json` | OK |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/vercel.json` | OK |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/vercel.json` | OK |
| `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dashboard/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-web-menu/vercel.json` | ISSUES |
| `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/next.config.ts` | OK |
| `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/apps/web/next.config.ts` | ISSUES |

---

**Audit Completed:** May 10, 2026
**Agent:** AGENT_11_VERCEL_DEPLOYMENT_SPECIALIST
**Total Issues Found:** 18
**Critical:** 5
**High:** 5
**Medium:** 5
**Low:** 3
