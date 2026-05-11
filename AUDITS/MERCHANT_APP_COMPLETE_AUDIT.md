# REZ Merchant App - Complete Audit Report

**Date:** May 9, 2026
**Version:** 1.0
**Status:** CRITICAL FIXES APPLIED

---

## Summary

The rez-app-merchant is an Expo Router app with 15+ screens, Redux state management, and multiple services. The audit identified critical issues with the metro bundler configuration causing `import.meta` errors, and several security concerns in utility files.

**Status:** `import.meta` error FIXED. App is running.

---

## Critical Fix Applied

### Metro Config - `import.meta` Error

**Problem:** Metro bundler with `unstable_enablePackageExports: true` caused `import.meta` errors.

**Solution:** Added to `metro.config.js`:
```javascript
config.resolver.unstable_enablePackageExports = false;
```

**Current Config:**
```javascript
config.resolver.platforms = ['ios', 'android', 'web'];
config.resolver.unstable_enablePackageExports = false;
config.resolver.resolverMainFields = ['react-native', 'browser', 'module', 'main'];
```

---

## All Critical Issues Found

### 1. Utils - Insecure ID Generation

**File:** `src/services/offlineService.ts`
**Issue:** Uses `Math.random()` for IDs
**Fix:** Replace with `crypto.randomUUID()`

### 2. Utils - Unauthenticated Image Delete

**File:** `src/services/imageUploadService.ts`
**Issue:** Direct Cloudinary API without auth
**Fix:** Route through backend

### 3. Utils - Token in Query Params

**File:** `src/services/websocketManager.ts`
**Issue:** Auth token in URL query
**Fix:** Use headers instead

### 4. Utils - Missing Production Guard

**File:** `src/utils/logger.ts`
**Issue:** `installProductionConsoleGuard()` never called
**Fix:** Call at app startup

### 5. Components - Missing Types

**File:** `src/components/*.tsx`
**Issue:** `MerchantContext` and `types/api.ts` missing
**Fix:** Create missing files

### 6. Components - 500-line Violations

**Files:** All major components exceed 500 lines
**Fix:** Break into smaller components

---

## Component Issues

| Component | Lines | Issues |
|----------|-------|--------|
| RevenueDashboard | 684 | Exceeds 500-line limit |
| QRCodeManager | 1089 | Exceeds 500-line limit |
| OfferManager | 873 | Exceeds 500-line limit |
| OfferCreator | 720 | Exceeds 500-line limit |
| OrderTracker | 1067 | Exceeds 500-line limit |

---

## Security Issues

| Issue | Severity | Location |
|-------|----------|----------|
| Math.random() for IDs | CRITICAL | offlineService.ts |
| Token in query params | HIGH | websocketManager.ts |
| Unauthenticated image delete | HIGH | imageUploadService.ts |
| No production console guard | MEDIUM | logger.ts |
| console.error usage | LOW | Components |

---

## Fixes Applied

### 1. Metro Config (FIXED)
- Added `unstable_enablePackageExports = false`
- Properly configured resolverMainFields

### 2. App Running (FIXED)
- Port 8081: LISTENING
- Status: Running

---

## Remaining Fixes Needed

### Priority 1: Security

1. **offlineService.ts** - Replace Math.random()
2. **websocketManager.ts** - Move token to headers
3. **imageUploadService.ts** - Add backend auth

### Priority 2: Code Quality

1. Create missing `MerchantContext.tsx`
2. Create missing `types/api.ts`
3. Break large components into smaller ones
4. Add shared components (LoadingSpinner, EmptyState, etc.)

### Priority 3: Missing Files

1. `/src/contexts/MerchantContext.tsx`
2. `/src/types/api.ts`
3. `/src/components/common/` directory

---

## File Structure

```
rez-app-merchant/
├── app/                    # Expo Router screens
│ ├── _layout.tsx
│ ├── (auth)/              # Auth screens
│ ├── (tabs)/              # Tab navigation
│ └── (dashboard)/         # Dashboard screens
├── src/
│ ├── components/          # Reusable components
│ ├── contexts/            # React contexts (missing MerchantContext)
│ ├── hooks/               # Custom hooks
│ ├── services/            # API services
│ ├── store/              # Redux store
│ ├── types/               # TypeScript types (missing api.ts)
│ └── utils/               # Utilities
├── package.json            # Dependencies (version mismatches)
├── metro.config.js         # FIXED
└── babel.config.js         # OK
```

---

## Dependencies Status

**Version Mismatches Found:**
- @expo/config-plugins (9.0.17 vs 9.0.5)
- @expo/metro-runtime (55.0.10 vs 55.0.11)
- react (18.3.1 vs 19.2.0)
- react-native (0.76.9 vs 0.83.6)
- Many more (see npm install warnings)

**Recommendation:** Run `npx expo install --fix` to update versions.

---

## How to Run

```bash
cd "/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant"

# Clear cache
rm -rf .expo node_modules/.cache

# Start
npx expo start

# Or fix deps first
npx expo install --fix
npx expo start
```

---

## Next Steps

1. [DONE] Fix import.meta error in metro.config.js
2. [TODO] Fix Math.random() in offlineService.ts
3. [TODO] Move WebSocket token to headers
4. [TODO] Create missing context/types files
5. [TODO] Break large components
6. [TODO] Run `npx expo install --fix`

---

*Report Generated: May 9, 2026*
*Auditors: 20 Autonomous Agents*
