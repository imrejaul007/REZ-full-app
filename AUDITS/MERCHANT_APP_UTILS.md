# Merchant App Utilities Audit Report

**Date:** 2026-05-08
**Auditor:** Senior Architect
**Scope:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/src/utils/` and utility-related services

---

## 1. UTILITIES FOUND

| File | Location | Type | Size |
|------|----------|------|------|
| `logger.ts` | `/src/utils/` | Logging Utility | 142 lines |
| `api.ts` | `/src/config/` | Configuration | 25 lines |
| `errors.ts` | `/src/services/` | Error Handling | 381 lines |
| `offlineService.ts` | `/src/services/` | Offline/Cache | 539 lines |
| `websocketManager.ts` | `/src/services/` | Real-time Comms | 649 lines |
| `imageUploadService.ts` | `/src/services/` | Media Upload | 360 lines |

---

## 2. ISSUES IDENTIFIED

### CRITICAL

#### 2.1 `offlineService.ts` - Insecure ID Generation
**Location:** Line 53-55
```typescript
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
```
**Issue:** `Math.random()` is cryptographically insecure. Collision possible under high load.
**Fix:** Replace with `crypto.randomUUID()` or `uuid` package (already in dependencies).

#### 2.2 `offlineService.ts` - Missing Error Boundary
**Location:** Lines 348-403 `performDefaultSync()`
**Issue:** Dynamic imports can fail silently. No validation of payload types before calling service methods.
**Risk:** TypeScript casts (`as Parameters<...>`) bypass compile-time safety at runtime.

#### 2.3 `imageUploadService.ts` - Unauthenticated Delete
**Location:** Lines 237-276 `deleteImage()`
**Issue:** Direct Cloudinary API call with unsigned upload. Comment acknowledges security concern but no mitigation.
**Risk:** Anyone with public ID can delete images.
**Fix:** Route delete through backend with server-side authentication.

#### 2.4 `websocketManager.ts` - Token in Query Param
**Location:** Lines 181-188
```typescript
query: {
  merchantId: this.merchantId,
},
// ...
if (token) {
  options.auth = { token };
}
```
**Issue:** Token may be transmitted via query params depending on server implementation. Query params appear in server logs.
**Risk:** Token leakage in logs.
**Fix:** Ensure server uses `auth.token` header only.

### HIGH

#### 2.5 `errors.ts` - Untyped `sleep` Function
**Location:** Lines 362-364
```typescript
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```
**Issue:** Internal function not exported. Cannot be reused by other utilities.
**Note:** `withRetry` already has retry logic. Consider consolidating.

#### 2.6 `offlineService.ts` - No Deduplication
**Location:** Lines 184-211 `queueOfflineAction()`
**Issue:** Same action queued multiple times will execute multiple times on sync.
**Risk:** Duplicate orders/inventory updates.
**Fix:** Add action fingerprinting or idempotency key.

#### 2.7 `websocketManager.ts` - Memory Leak Potential
**Location:** Lines 589-607
**Issue:** `ConnectionCallback` and `ErrorCallback` stored in Sets, but no cleanup if manager is disposed.
**Risk:** Orphaned callbacks if component unmounts without unsubscribing.
**Fix:** Return unsubscribe functions properly or add `dispose()` method.

#### 2.8 `imageUploadService.ts` - Simulated Progress
**Location:** Lines 167-168, 179, 201
```typescript
onProgress?.(50);
// ...
onProgress?.(90);
// ...
onProgress?.(0);
```
**Issue:** Progress values are arbitrary and fake. Not reflecting actual upload state.
**Risk:** Misleading UX feedback.
**Fix:** Use XMLHttpRequest for real progress events or remove fake values.

### MEDIUM

#### 2.9 `logger.ts` - Missing `installProductionConsoleGuard` Call
**Location:** Lines 17-100
**Issue:** Function exists but is never called in the codebase. Production may still log sensitive data.
**Fix:** Export and call during app initialization.

#### 2.10 `logger.ts` - Incomplete Sensitive Pattern List
**Location:** Lines 33-48
```typescript
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  // ...
];
```
**Issue:** Missing common patterns: `ssn`, `aadhaar`, `pan`, `phone`, `email`, `address`.
**Fix:** Expand patterns based on data handled by the app.

#### 2.11 `api.ts` - Duplicate URL Definitions
**Location:** Lines 3-5 and 10-14
```typescript
export const API_BASE_URL = /* ... */;
export function getApiUrl(): string { /* same URL */ }
```
**Issue:** URL defined twice. `getApiUrl()` could drift from `API_BASE_URL`.
**Fix:** `getApiUrl()` should return `API_BASE_URL` after sanitization.

#### 2.12 `errors.ts` - Missing `error.name` Check
**Location:** Lines 117-123
```typescript
retryCondition: (error: AppError) => {
  return (
    error.name === 'NetworkError' ||
    error.name === 'TimeoutError' ||
    // ...
  );
},
```
**Issue:** Uses `error.name` string comparison instead of `instanceof`. Vulnerable to minification issues.
**Fix:** Use `error instanceof NetworkError`.

#### 2.13 `offlineService.ts` - Sync Function Type Safety
**Location:** Lines 263-265
```typescript
export const syncOfflineActions = async (
  syncFunction?: (action: OfflineAction) => Promise<boolean>
): Promise<SyncResult>
```
**Issue:** Custom sync function bypasses type checking. Bad sync function can corrupt queue.
**Fix:** Add return type validation or use discriminated unions.

### LOW

#### 2.14 `logger.ts` - Type Export Unnecessary
**Location:** Line 141
```typescript
export type Logger = typeof logger;
```
**Issue:** Re-exports internal type. Users can just use `typeof logger` directly.
**Fix:** Remove or document intended use.

#### 2.15 `websocketManager.ts` - Magic Numbers
**Location:** Lines 23-26
```typescript
const DEFAULT_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 10000;
```
**Issue:** Timeouts in milliseconds without units in name.
**Fix:** Rename to `DEFAULT_RECONNECT_DELAY_MS` or document units.

#### 2.16 `imageUploadService.ts` - Hardcoded Format Mapping
**Location:** Line 160
```typescript
formData.append('file', `data:image/${format === 'jpg' ? 'jpeg' : format};base64,${base64}`);
```
**Issue:** Only handles `jpg`, `webp`, `png`. Other formats fail silently.
**Fix:** Add default case or throw for unsupported formats.

---

## 3. TYPE SAFETY ASSESSMENT

| Area | Rating | Notes |
|------|--------|-------|
| **Logger** | GOOD | Properly typed, uses shared package |
| **API Config** | MEDIUM | Duplicated URL logic |
| **Error Handling** | MEDIUM | `instanceof` checks needed instead of string comparison |
| **Offline Service** | LOW | Heavy `as` casts, unsafe ID generation |
| **WebSocket Manager** | MEDIUM | Good interface types, minor callback leak risk |
| **Image Upload** | MEDIUM | Missing format validation, fake progress |

---

## 4. RECOMMENDATIONS

### Immediate (Critical Fixes)

1. **Replace `Math.random()` with `uuid`**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   const generateId = (): string => uuidv4();
   ```

2. **Call `installProductionConsoleGuard()`**
   Export from logger and invoke at app startup.

3. **Route Cloudinary deletes through backend**
   ```typescript
   // imageUploadService.ts
   export async function deleteImage(publicId: string): Promise<DeleteResult> {
     const response = await fetch('/api/images/delete', {
       method: 'POST',
       body: JSON.stringify({ publicId }),
     });
     // ...
   }
   ```

### Short-term (High Priority)

4. **Add action deduplication** in offline queue
5. **Fix `instanceof` checks** in retry condition
6. **Remove fake progress** or implement real XHR progress

### Long-term (Code Quality)

7. Consolidate error utilities into single module
8. Add comprehensive unit tests for edge cases
9. Document callback lifecycle for WebSocketManager

---

## 5. FILES SUMMARY

| File | Lines | Complexity | Maintainability |
|------|-------|------------|-----------------|
| `logger.ts` | 142 | Low | Good |
| `api.ts` | 25 | Low | Needs cleanup |
| `errors.ts` | 381 | Medium | Good structure |
| `offlineService.ts` | 539 | Medium-High | Needs refactor |
| `websocketManager.ts` | 649 | Medium | Good structure |
| `imageUploadService.ts` | 360 | Low-Medium | Acceptable |

---

## 6. DEPENDENCY AUDIT

**Direct dependencies used:**
- `@react-native-async-storage/async-storage` (offlineService)
- `@react-native-community/netinfo` (offlineService)
- `socket.io-client` (websocketManager)
- `expo-image-picker` (imageUploadService)
- `expo-file-system` (imageUploadService)
- `expo-image-manipulator` (imageUploadService)
- `react-native-toast-message` (errors)

**All dependencies are production-essential. No unused imports detected.**

---

*End of Report*
