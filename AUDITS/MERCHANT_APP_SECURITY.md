# Merchant App Security Audit

**Date:** 2026-05-09
**App:** rez-app-merchant (ReZ Merchant App)
**Platform:** React Native / Expo (iOS, Android, Web)

---

## Executive Summary

The merchant app has a **moderate security posture** with several positive security measures already implemented, but significant gaps remain. Key concerns include the **absence of root/jailbreak detection**, **no screenshot protection**, and **limited device security measures**.

---

## 1. Security Measures Found

### 1.1 Secure Token Storage (EXCELLENT)

| Implementation | File | Description |
|---------------|------|-------------|
| SecureStore integration | `utils/storage.ts` | Auth tokens stored in iOS Keychain / Android Keystore |
| Sensitive key detection | `utils/storage.ts:19-28` | Auto-detects tokens, secrets, passwords |
| No cleartext fallback | `services/storage.ts:55-61` | Refuses to fall back to AsyncStorage for sensitive data |
| Separate logout clearing | `contexts/auth/useAuthSession.ts:173-178` | Clears both AUTH_TOKEN and REFRESH_TOKEN |

**Code Reference:**
```typescript
// services/storage.ts:49-62
private async secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(key, value);
      await AsyncStorage.removeItem(key);
    } catch (err) {
      logger.error(`[Storage] SecureStore.setItemAsync failed for ${key} — refusing AsyncStorage fallback`);
      throw new Error(`Failed to store sensitive key '${key}' in SecureStore`);
    }
  }
}
```

### 1.2 Biometric Authentication (GOOD)

| Implementation | File | Description |
|---------------|------|-------------|
| Biometric hardware check | `utils/biometric.ts:12-21` | Verifies hardware availability |
| Biometric type detection | `utils/biometric.ts:26-42` | Identifies Face ID/Touch ID/Fingerprint |
| Device fallback disabled | `utils/biometric.ts:69` | `disableDeviceFallback: true` - prevents passcode bypass |

**Code Reference:**
```typescript
// utils/biometric.ts:58-70
const result = await LocalAuthentication.authenticateAsync({
  promptMessage: reason,
  cancelLabel: 'Cancel',
  fallbackLabel: 'Use Passcode',
  // HIGH-SEC FIX (MA-SEC-003): Disable device passcode fallback.
  disableDeviceFallback: true,
});
```

### 1.3 API Security (GOOD)

| Implementation | File | Description |
|---------------|------|-------------|
| CSRF protection | `services/api/client.ts:91-92` | `xsrfCookieName: 'csrf-token'`, `xsrfHeaderName: 'x-csrf-token'` |
| Device fingerprint header | `services/api/client.ts:203-215` | Adds `X-Device-Fingerprint` to requests |
| Token refresh mutex | `services/api/client.ts:285-305` | Prevents concurrent refresh race conditions |
| Rate limit handling | `services/api/client.ts:242-275` | Exponential backoff on 429 responses |
| Production URL required | `services/api/client.ts:27-33` | Hard error if MERCHANT_SERVICE_BASE_URL not set in production |

### 1.4 Session Management (GOOD)

| Implementation | File | Description |
|---------------|------|-------------|
| JWT expiry parsing | `contexts/auth/useAuthSession.ts:148-155` | Decodes token expiry from JWT |
| Session timeout | `contexts/auth/useAuthSession.ts:129,193-208` | Configurable via `SESSION_TIMEOUT_MS` (default 1hr) |
| Account suspension check | `contexts/auth/useAuthSession.ts:239-250` | Forces logout if merchant is suspended |
| Complete token cleanup | `services/storage.ts:173-185` | Clears both access and refresh tokens |

### 1.5 Fraud Detection (GOOD)

| Implementation | File | Description |
|---------------|------|-------------|
| Fraud alerts UI | `app/fraud/index.tsx` | Displays anomaly alerts, cashback fraud metrics |
| Fraud service | `services/api/fraud.ts` | API for fetching fraud status and alerts |
| Compliance reporting | `app/audit/compliance.tsx` | GDPR, SOC2, PCI-DSS, ISO 27001 dashboards |

### 1.6 Input Validation (GOOD)

| Implementation | File | Description |
|---------------|------|-------------|
| Payment amount validation | `utils/paymentValidation.ts:108-128` | Range checking, NaN detection |
| Payment status validation | `utils/paymentValidation.ts:95-102` | 11-state whitelist validation |
| Email format validation | `utils/paymentValidation.ts:146-154` | Regex-based email check |
| Pagination bounds | `utils/paymentValidation.ts:160-179` | Max limit cap (default 100) |
| Response structure validation | `utils/paymentValidation.ts:185-195` | Required field checking |

### 1.7 Debug Auth Protection (GOOD)

| Implementation | File | Description |
|---------------|------|-------------|
| No global exposure | `utils/debugAuth.ts:159-164` | Removed `global.debugAuth` to prevent code injection |
| Token content not logged | `utils/debugAuth.ts:42,147` | Only boolean existence checked, never token content |

---

## 2. Issues Found

### 2.1 CRITICAL: No Root/Jailbreak Detection

**Severity:** CRITICAL
**Status:** MISSING

The app has **no mechanism** to detect rooted Android or jailbroken iOS devices. This is a critical gap for a merchant app handling financial transactions.

**Attack Scenarios:**
- Malware on rooted devices can read SecureStore via Keychain dumps
- Frida/Xposed hooks can intercept API calls
- Emulators can be used for fraud automation testing

**Recommended Fix:**
```typescript
// utils/deviceSecurity.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function isDeviceSecure(): Promise<{ secure: boolean; issues: string[] }> {
  const issues: string[] = [];

  // Check for debug mode
  if (__DEV__ || Constants.appOwnership === 'expo') {
    // Skip in development
    return { secure: true, issues: [] };
  }

  if (Platform.OS === 'android') {
    // Check for common root indicators
    const rootPaths = [
      '/system/app/Superuser.apk',
      '/sbin/su',
      '/system/bin/su',
      '/system/xbin/su',
    ];

    for (const path of rootPaths) {
      // Use native module or FileSystem to check
    }

    // Check for test-keys build
    const buildTags = Constants.platform?.android?.versionCode;
  }

  if (Platform.OS === 'ios') {
    // Check for jailbreak indicators
    // Cydia, suspicious files, fork() behavior
  }

  return { secure: issues.length === 0, issues };
}
```

### 2.2 CRITICAL: No Screenshot Protection

**Severity:** CRITICAL
**Status:** MISSING

The app does not prevent screenshots or screen recording. Sensitive merchant data (dashboard, transactions, analytics) can be captured.

**Attack Scenarios:**
- Screen recording of transaction amounts
- Screenshot of customer PII in orders
- Screen sharing malware capturing dashboard

**Recommended Fix:**
```typescript
// For Android (requires native module or expo-dev-client):
// Add to AndroidManifest.xml:
// android:windowSecure="true"

// For iOS (requires native module):
// Use UIScreen.isCaptured API

// utils/screenshotProtection.ts
import { NativeModules, Platform } from 'react-native';

export function enableScreenshotProtection(): void {
  if (Platform.OS === 'android') {
    // Native module needed: FLAG_SECURE
  }
  if (Platform.OS === 'ios') {
    // Native module needed: UIScreen.captured observer
  }
}
```

### 2.3 HIGH: No App Integrity / SafetyNet Check

**Severity:** HIGH
**Status:** MISSING

No verification that the app is running in a legitimate, unmodified environment.

**Missing:**
- No Google Play SafetyNet / Play Integrity API
- No iOS DeviceCheck/App Attest
- No binary integrity checking

### 2.4 HIGH: No Runtime Application Self-Protection (RASP)

**Severity:** HIGH
**Status:** MISSING

No runtime protection against:
- Debugger attachment detection
- Code injection detection
- Memory tampering detection
- SSL pinning (beyond default)

**Note:** The app uses default HTTPS which can be intercepted with user-installed certificates.

### 2.5 MEDIUM: Web Storage Vulnerabilities

**Severity:** MEDIUM
**Status:** PARTIAL

**Issues:**
```typescript
// services/storage.ts:70-71
if (Platform.OS === 'web') {
  return await AsyncStorage.getItem(key); // Maps to localStorage - XSS accessible
}
```

On web, sensitive data (when `COOKIE_AUTH_ENABLED` is false) is stored in localStorage which is accessible to XSS attacks.

**Recommendation:** Ensure `COOKIE_AUTH_ENABLED=true` in production for web, or implement encrypted web storage.

### 2.6 MEDIUM: No Rate Limiting on Sensitive Operations

**Severity:** MEDIUM
**Status:** PARTIAL

**Missing:**
- No client-side rate limiting for login attempts
- No account lockout after failed attempts
- No CAPTCHA/Biometric challenge after N failures

### 2.7 MEDIUM: Device Fingerprint Privacy Concerns

**Severity:** MEDIUM
**Status:** NEEDS REVIEW

```typescript
// services/api/client.ts:203-215
config.headers['X-Device-Fingerprint'] = hash;
```

The fingerprint is stored in AsyncStorage without encryption. If this fingerprint can be used to track users across sessions without clear disclosure, this may conflict with privacy regulations.

### 2.8 LOW: Debug Logging in Production

**Severity:** LOW
**Status:** NEEDS REVIEW

Multiple `logger.debug()` calls in auth flows that may log sensitive operation timing:

```typescript
// contexts/auth/useAuthSession.ts:288
logger.debug('Attempting login for:', email);
```

Consider ensuring debug logs are completely stripped in production builds.

---

## 3. Missing Security Features

### 3.1 Device Security
| Feature | Priority | Description |
|---------|----------|-------------|
| Root/Jailbreak Detection | CRITICAL | Detect compromised devices |
| Screenshot Protection | CRITICAL | Prevent screen capture |
| Screen Recording Detection | CRITICAL | Block screen sharing |
| App Integrity Check | HIGH | Verify app authenticity |
| Debugger Detection | HIGH | Detect attached debuggers |
| SSL/TLS Pinning | HIGH | Prevent MITM attacks |

### 3.2 Session Security
| Feature | Priority | Description |
|---------|----------|-------------|
| Biometric Re-auth | MEDIUM | Require biometric for high-value actions |
| Session Binding | MEDIUM | Bind session to device fingerprint |
| Concurrent Session Limits | MEDIUM | Prevent account sharing abuse |
| Step-up Authentication | MEDIUM | Additional auth for sensitive ops |

### 3.3 Fraud Prevention
| Feature | Priority | Description |
|---------|----------|-------------|
| Device Reputation | HIGH | Score devices based on behavior |
| Behavioral Analysis | MEDIUM | Detect unusual merchant patterns |
| Geo-velocity Checks | MEDIUM | Detect impossible travel |
| Transaction Velocity | MEDIUM | Rate limit transactions |

### 3.4 Data Protection
| Feature | Priority | Description |
|---------|----------|-------------|
| Encrypted Database | LOW | Local data encryption (already done via SecureStore) |
| Secure Clipboard | LOW | Clear sensitive copy operations |
| Secure Input Fields | MEDIUM | Mask sensitive inputs |

### 3.5 Monitoring & Response
| Feature | Priority | Description |
|---------|----------|-------------|
| Real-time Fraud Alerts | MEDIUM | Push notifications for suspicious activity |
| Security Event Logging | LOW | Already implemented (audit logs) |
| Anomaly Notifications | MEDIUM | Alert merchants of unusual patterns |

---

## 4. Security Configuration Analysis

### 4.1 Android Permissions (app.config.js)

```javascript
permissions: [
  "CAMERA",              // OK - needed for barcode scanning
  "INTERNET",            // OK - required
  "ACCESS_NETWORK_STATE", // OK
  "VIBRATE",             // OK
  "ACCESS_FINE_LOCATION", // OK - with disclosure
  "ACCESS_COARSE_LOCATION", // OK - with disclosure
  "POST_NOTIFICATIONS",   // OK - with disclosure
  "RECEIVE_BOOT_COMPLETED", // CONSIDER - could be reduced
  "READ_MEDIA_IMAGES",   // OK
  "READ_MEDIA_VIDEO",    // HIGH - needed?
  "READ_EXTERNAL_STORAGE", // HIGH - consider removing
  "WRITE_EXTERNAL_STORAGE" // HIGH - needed?
]
```

**Recommendation:** Review and minimize Android permissions, especially storage permissions.

### 4.2 iOS Info.plist

```javascript
infoPlist: {
  ITSAppUsesNonExemptEncryption: false,  // GOOD - proper export compliance
  NSCameraUsageDescription: "...",       // OK
  NSPhotoLibraryUsageDescription: "...", // OK
  NSBluetoothAlwaysUsageDescription: "...", // OK
  NSLocationWhenInUseUsageDescription: "...", // OK
  NSUserNotificationsUsageDescription: "..." // OK
}
```

---

## 5. Recommendations (Priority Order)

### Immediate Actions (Do Now)

1. **Implement Root/Jailbreak Detection**
   - Use `expo-dev-client` native modules or third-party library
   - Block app usage on compromised devices

2. **Implement Screenshot Protection**
   - `FLAG_SECURE` on Android
   - `UIScreen.captured` observer on iOS

3. **Add SSL Pinning**
   - Use `expo-ssl-pinning` or similar
   - Pin to production certificate only

### Short-term (This Sprint)

4. **Add Login Rate Limiting**
   - Track failed attempts client-side
   - Show CAPTCHA after 3 failures
   - Lock account after 5 failures

5. **Implement Biometric Step-up**
   - Require biometric for viewing transaction details
   - Require biometric for high-value actions (>$1000)

6. **Review Android Permissions**
   - Remove unnecessary storage permissions
   - Verify all permission disclosures are accurate

### Medium-term (Next Release)

7. **Add App Integrity Checks**
   - Google Play Integrity API
   - iOS App Attest

8. **Implement Device Reputation**
   - Score devices based on behavior
   - Flag high-risk devices

9. **Add Session Binding**
   - Bind JWT to device fingerprint
   - Invalidate sessions on device change

---

## 6. Compliance Notes

| Framework | Status | Notes |
|-----------|--------|-------|
| GDPR | PARTIAL | Missing: right to erasure, consent management |
| PCI-DSS | INCOMPLETE | No card data handling observed (good) |
| SOC 2 | PARTIAL | Audit logging present, controls need verification |
| ISO 27001 | PARTIAL | Compliance dashboard shows partial implementation |

---

## 7. Security Code References

| File | Security Feature |
|------|------------------|
| `utils/storage.ts` | SecureStore integration |
| `services/storage.ts` | Dual-layer storage with secure fallback |
| `utils/biometric.ts` | Biometric auth with fallback disabled |
| `services/api/client.ts` | CSRF, device fingerprint, rate limit handling |
| `contexts/auth/useAuthSession.ts` | Session timeout, JWT expiry |
| `app/fraud/index.tsx` | Fraud detection UI |
| `app/audit/compliance.tsx` | Compliance reporting |
| `utils/paymentValidation.ts` | Input validation |
| `utils/debugAuth.ts` | Debug auth removal |

---

## Appendix A: Security Audit Checklist

| Category | Item | Status |
|----------|------|--------|
| Authentication | Multi-factor auth | NOT IMPLEMENTED |
| Authentication | Biometric auth | IMPLEMENTED |
| Authentication | Session timeout | IMPLEMENTED |
| Authentication | Account lockout | NOT IMPLEMENTED |
| Storage | Encrypted tokens | IMPLEMENTED |
| Storage | Secure keychain | IMPLEMENTED |
| Network | HTTPS only | IMPLEMENTED |
| Network | SSL Pinning | NOT IMPLEMENTED |
| Network | CSRF protection | IMPLEMENTED |
| Device | Root detection | NOT IMPLEMENTED |
| Device | Jailbreak detection | NOT IMPLEMENTED |
| Device | Screenshot protection | NOT IMPLEMENTED |
| Device | Debugger detection | NOT IMPLEMENTED |
| Input | Validation | IMPLEMENTED |
| Output | Encoding | NOT REVIEWED |
| Logging | Security events | IMPLEMENTED |
| Fraud | Detection | IMPLEMENTED |
| Compliance | Audit trail | IMPLEMENTED |

---

**Audit Completed By:** Claude Code Security Audit
**Next Review:** 2026-06-09
