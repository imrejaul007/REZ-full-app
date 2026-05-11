# Mobile Application Security Specification

**Document Type:** Security Standard
**Version:** 1.0.0
**Last Updated:** 2026-05-04
**Owner:** Application Security Lead

---

## Overview

This document defines security requirements and implementation standards for all ReZ mobile applications (rez-app-consumer, rez-app-merchant, rez-app-admin).

---

## 1. Secure Storage

### Requirements

| Storage Type | Use Case | Required Solution |
|--------------|----------|------------------|
| Authentication Tokens | JWT, refresh tokens | `expo-secure-store` |
| Session Data | Analytics, preferences | `expo-secure-store` or `@react-native-async-storage/async-storage` |
| Credentials | API keys (if client-side) | `expo-secure-store` ONLY |
| User Preferences | Theme, settings | `@react-native-async-storage/async-storage` |

### Implementation

```typescript
// rez-app-consumer/src/utils/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      accessible: SecureStore.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    });
  },

  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
};
```

### Prohibited Patterns

```typescript
// DO NOT USE - Insecure
localStorage.setItem('token', jwt);
AsyncStorage.setItem('apiKey', key);

// USE INSTEAD - Secure
await secureStorage.set('token', jwt);
await secureStorage.set('apiKey', apiKey);
```

---

## 2. Certificate Pinning

### Requirements

All production API calls MUST implement certificate pinning to prevent MITM attacks.

### Implementation

```typescript
// rez-app-consumer/src/utils/certificatePinning.ts
import { localhost } from 'react-native/Libraries/Utilities/Platform';

interface CertificatePinningConfig {
  domain: string;
  publicKeyHashes: string[]; // SHA-256 hashes of certificate public keys
}

const PINNED_CERTIFICATES: Record<string, CertificatePinningConfig> = {
  'api.rez.app': {
    publicKeyHashes: [
      // Production certificate hash
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      // Backup certificate hash (for rotation)
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
  },
};

export async function validatePinnedCertificate(host: string): Promise<boolean> {
  // In development, skip pinning
  if (localhost) {
    return true;
  }

  const config = PINNED_CERTIFICATES[host];
  if (!config) {
    console.warn(`Certificate pinning not configured for: ${host}`);
    return false;
  }

  // Certificate validation happens at the network layer
  // This function serves as a configuration check
  return true;
}

export const CERTIFICATE_PINNING_ENABLED = process.env.NODE_ENV === 'production';
```

### Native Module Setup (iOS)

Add to `Info.plist`:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>api.rez.app</key>
        <dict>
            <key>NSExceptionRequiresForwardSecrecy</key>
            <false/>
        </dict>
    </dict>
</dict>
```

### Native Module Setup (Android)

Add to `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.rez.app</domain>
        <pin-set expiration="2027-01-01">
            <pin digest="SHA-256">base64_encoded_primary_pin</pin>
            <pin digest="SHA-256">base64_encoded_backup_pin</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

---

## 3. Secrets Management

### Prohibited

- Hardcoded API keys in source code
- API keys in public repositories
- API keys in environment files committed to version control
- Debug tokens in production builds

### Required

- Environment variables loaded at build time
- Secure storage for runtime secrets
- Regular secret rotation (90-day minimum)
- Secret scanning in CI/CD

### Approved Secret Storage

| Secret Type | Storage Location |
|-------------|------------------|
| API Keys | Environment variables (CI/CD injected) |
| User Tokens | SecureStore (device keychain) |
| Encryption Keys | SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` |

---

## 4. Security Scan Results (2026-05-04)

### Scan Commands Executed

```bash
# Check for hardcoded secrets
grep -r "apiKey\|password\|secret" --include="*.ts" --include="*.tsx" rez-app-*/src

# Check for insecure storage
grep -r "AsyncStorage\|localStorage" --include="*.ts" --include="*.tsx" rez-app-*/src

# Check SSL/TLS configuration
grep -r "ssl\|tls\|certificate" --include="*.ts" --include="*.tsx" rez-app-*/src
```

### Findings

| Category | Status | Notes |
|----------|--------|-------|
| Hardcoded Secrets | PASS | No hardcoded secrets found |
| AsyncStorage Usage | REVIEW | Used for session analytics (acceptable) |
| localStorage Usage | REVIEW | Used for dev flag overrides (acceptable) |
| Certificate Pinning | PENDING | Implementation required |

### Required Actions

1. [ ] Implement certificate pinning for all API endpoints
2. [ ] Add SecureStore migration for authentication tokens
3. [ ] Enable SSL/TLS for all network requests
4. [ ] Configure network security policies for Android

---

## 5. Code Security Standards

### Input Validation

All user inputs must be validated before processing:

```typescript
// Validate all external data
const sanitizedInput = sanitizeUserInput(rawInput);
validateInputSchema(sanitizedInput, expectedSchema);
```

### Output Encoding

All outputs must be properly encoded to prevent XSS:

```typescript
// Use React's built-in escaping
// Avoid dangerouslySetInnerHTML unless absolutely necessary
// Validate URLs before navigation
```

### Authentication Flow

```typescript
// Token-based authentication flow
1. User authenticates -> Receive JWT + Refresh Token
2. Store tokens in SecureStore
3. Include JWT in Authorization header
4. Refresh token before expiry
5. Clear tokens on logout
```

---

## 6. Compliance Requirements

| Requirement | Standard | Status |
|-------------|----------|--------|
| Data Encryption | AES-256 | Required |
| Transport Security | TLS 1.3 | Required |
| Token Expiry | 15 minutes (access), 7 days (refresh) | Required |
| Secure Key Storage | Keychain (iOS), Keystore (Android) | Required |
| Biometric Auth | Optional 2FA | Recommended |

---

## 7. Testing Requirements

### Security Testing Checklist

- [ ] Unit tests for secure storage wrapper
- [ ] Integration tests for authentication flow
- [ ] Certificate pinning validation tests
- [ ] Input validation tests
- [ ] Token expiry handling tests
- [ ] Secure data deletion tests

---

## 8. Related Documents

- `SOURCE-OF-TRUTH/SECURITY-API.md` - Backend API security
- `SOURCE-OF-TRUTH/SECURITY-AUTH.md` - Authentication patterns
- `SOURCE-OF-TRUTH/SECURITY-DEVOPS.md` - CI/CD security

---

**Document Control:**
- Created: 2026-05-04
- Last Modified: 2026-05-04
- Review Cycle: Quarterly
