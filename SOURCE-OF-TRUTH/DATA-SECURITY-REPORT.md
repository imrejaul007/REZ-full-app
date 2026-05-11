# REZ Ecosystem Data Security Report

**Date:** May 5, 2026
**Classification:** Internal - Confidential
**Auditor:** Data Security Lead
**Scope:** Full REZ Ecosystem (50+ microservices)

---

## Executive Summary

The REZ ecosystem handles substantial PII across multiple services including user profiles, payment processing, merchant onboarding, and KYC verification. This audit identified **GOOD practices** in password hashing, field-level encryption for sensitive data, and GDPR-aware type definitions. However, **critical gaps** exist in encryption coverage, database-level encryption, data export capabilities, and consent management implementation.

**Overall Risk Rating:** MEDIUM-HIGH

---

## 1. PII Inventory

### 1.1 Phone Numbers

| Service | Storage | Encryption | Risk Level |
|---------|---------|------------|------------|
| `rez-profile-service` | MongoDB (UserProfileSchema) | NO | HIGH |
| `rez-merchant-service` | MongoDB (IMerchant) | NO | HIGH |
| `Hotel OTA` | PostgreSQL (User.phone) | NO | HIGH |
| `rez-web-menu` | PostgreSQL (User.phone) | NO | HIGH |
| `rez-try` | PostgreSQL (User.phone) | NO | HIGH |
| `verify-service` | PostgreSQL | NO | MEDIUM |

**Finding:** Phone numbers are stored in plaintext across all services. While phone is used for authentication (OTP), there is no encryption at rest.

### 1.2 Email Addresses

| Service | Storage | Encryption | Risk Level |
|---------|---------|------------|------------|
| `rez-profile-service` | MongoDB | NO | MEDIUM |
| `rez-merchant-service` | MongoDB (IMerchant.email) | NO | MEDIUM |
| `Hotel OTA` | PostgreSQL | NO | MEDIUM |
| `rez-payment-service` | MongoDB (Payment.userDetails) | NO | MEDIUM |

**Finding:** Email addresses stored in plaintext. No field-level encryption.

### 1.3 Location Data

| Service | Data Type | Storage | Encryption | Risk Level |
|---------|-----------|---------|------------|------------|
| `rez-profile-service` | Delivery addresses | MongoDB (AddressSchema) | NO | HIGH |
| `rez-merchant-service` | Business coordinates | MongoDB | NO | MEDIUM |
| `Hotel OTA` | Hotel coordinates | PostgreSQL | NO | MEDIUM |
| `verify-service` | Scan location | PostgreSQL (Scan.location) | NO | HIGH |

**Finding:** Location data (including GPS coordinates) stored without encryption. Address data includes full name, phone, and address lines.

### 1.4 Payment Information

| Service | Data Type | Storage | Encryption | Risk Level |
|---------|-----------|---------|------------|------------|
| `rez-payment-service` | Payment records | MongoDB | NO* | MEDIUM |
| `rez-wallet-service` | Wallet balances | MongoDB | NO | LOW |
| `Hotel OTA` | Hotel bank accounts | PostgreSQL | NO | CRITICAL |
| `rez-merchant-service` | Merchant bank details | MongoDB | YES (AES-256-GCM) | LOW |

**Note:** Hotel OTA stores bank account numbers and IFSC codes in plaintext (CRITICAL). Merchant service uses `encryptBankAccount()` and `encryptTaxId()` from `utils/encryption.ts`.

### 1.5 KYC/Documents

| Service | Document Types | Storage | Encryption | Risk Level |
|---------|---------------|---------|------------|------------|
| `Hotel OTA` | Business license, ID proof | PostgreSQL (BizDoc) | NO | HIGH |
| `verify-service` | Serial scans, fingerprints | PostgreSQL | NO | HIGH |

**Finding:** KYC documents stored without encryption. Device fingerprints and location data collected without encryption.

---

## 2. Encryption Status

### 2.1 Password Hashing

| Service | Algorithm | Salt Rounds | Status |
|---------|-----------|-------------|--------|
| `rez-auth-service` | bcrypt | 12 | GOOD |
| `verify-service` | bcryptjs | 12 | GOOD |
| `Resturistan App` | argon2 | - | GOOD |

**Finding:** Passwords are properly hashed using industry-standard algorithms. Salt rounds are appropriate.

### 2.2 Field-Level Encryption

**Location:** `/rez-merchant-service/src/utils/encryption.ts`

| Feature | Implementation | Status |
|---------|---------------|--------|
| Algorithm | AES-256-GCM | GOOD |
| Key Derivation | PBKDF2-SHA256 (100k rounds) | GOOD |
| Authenticated Encryption | Yes (GCM mode) | GOOD |
| Bank Account Encryption | `encryptBankAccount()` | GOOD |
| Tax ID Encryption | `encryptTaxId()` | GOOD |
| Masking Utility | `maskSensitiveData()` | GOOD |

**Finding:** Merchant service has excellent field-level encryption for bank accounts and tax IDs. However, this is NOT applied to phone, email, or addresses.

### 2.3 Token Encryption

| Service | Implementation | Status |
|---------|----------------|--------|
| `rez-now` | AES encryption for localStorage tokens | GOOD |
| JWT Signing | HS256 with separate secrets per service | GOOD |

**Finding:** JWT tokens are properly signed. Client-side token storage in rez-now uses AES encryption.

### 2.4 HTTPS Enforcement

| Component | Status | Notes |
|-----------|--------|-------|
| External APIs | PARTIAL | HTTPS URLs configured for external services |
| Internal Communication | NOT VERIFIED | mTLS not implemented |
| API Gateway | PARTIAL | CSP headers configured |

**Finding:** External HTTPS is used, but internal service-to-service communication lacks mutual TLS.

---

## 3. Data Retention Assessment

### 3.1 Soft Delete Implementation

| Service | Model | Soft Delete Field | Status |
|---------|-------|-------------------|--------|
| `rez-profile-service` | UserProfile | `deletedAt` | IMPLEMENTED |
| `rez-ads-service` | AdCampaign | `deletedAt` | IMPLEMENTED |
| `Hotel OTA` | Multiple | `deletedAt` | IMPLEMENTED |
| `Resturistan App` | Multiple | `deletedAt` | IMPLEMENTED |

**Finding:** Soft delete pattern is consistently implemented across services.

### 3.2 TTL/Cleanup Mechanisms

| Service | Mechanism | TTL | Status |
|---------|-----------|-----|--------|
| `rez-ads-service` | Redis TTL | 24h (frequency caps) | GOOD |
| `rez-payment-service` | TTL index | On pending payments | GOOD |
| `adsqr` | Redis TTL | 1h (fraud detection) | GOOD |

**Finding:** Redis-based TTL used for transient data. MongoDB TTL indexes on payment status.

### 3.3 Missing Retention Policies

| Gap | Impact | Priority |
|-----|--------|----------|
| No documented retention periods for PII | HIGH | CRITICAL |
| No automatic user data deletion scheduler | HIGH | CRITICAL |
| Audit logs retention undefined | MEDIUM | HIGH |
| Analytics data retention undefined | MEDIUM | HIGH |

---

## 4. GDPR Compliance Assessment

### 4.1 Consent Management

**Type Definitions Found:** `rez-app-consumer/types/privacy.types.ts`

```typescript
// GDPR-compliant consent types exist:
- DataCategory enum (IDENTITY, CONTACT, TECHNICAL, ACTIVITY, FINANCIAL)
- LegalBasis enum (CONSENT, CONTRACT, LEGAL_OBLIGATION, etc.)
- DataSubjectRight enum (ACCESS, RECTIFICATION, ERASURE, PORTABILITY)
- PrivacyConsent interface
- DataRetentionPolicy interface
```

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Consent capture | Types defined, not enforced | PARTIAL |
| Consent withdrawal | Not implemented | MISSING |
| Marketing consent | UserIntelligenceService.consent | PARTIAL |
| Ad targeting consent | `intelligence.consent?.ads` check | PARTIAL |

**Finding:** GDPR type definitions are well-designed but consent is not enforced at the data layer.

### 4.2 Data Subject Rights

| Right | Endpoint | Status |
|-------|----------|--------|
| Access | GET `/user/:id/profile` | IMPLEMENTED |
| Erasure | DELETE `/user/:id` | PARTIAL* |
| Portability | Analytics export | PARTIAL** |

*Delete endpoint only removes from UserIntelligence service, not all services.
**Export exists for audit logs, not full user data.

**Finding:** Basic GDPR endpoints exist but data deletion is NOT comprehensive across all services.

### 4.3 Processing Records (Article 30)

**Location:** `rez-app-consumer/types/privacy.types.ts`

```typescript
interface DataProcessingActivity {
  activityId: string;
  purpose: string;
  dataCategories: DataCategory[];
  legalBasis: LegalBasis;
  recipients?: string[];
  internationalTransfers: boolean;
  safeguards?: string;
  retentionPeriod: string;
  securityMeasures: string[];
}
```

**Finding:** Type definitions exist but no actual record-keeping implementation found.

### 4.4 Data Breach Notification

**Type Defined:** `DataBreachNotification` interface exists with full GDPR Article 33-34 structure.

**Finding:** Types defined but breach notification workflow not implemented.

---

## 5. Audit Logging

### 5.1 Implementation Status

| Service | Audit Logging | Framework |
|---------|--------------|-----------|
| `rez-app-merchant` | YES | Comprehensive (types/audit.ts) |
| `rez-merchant-service` | YES | AuditLog model |
| `rez-payment-service` | YES | TransactionAuditLog |

**Features Found:**
- GDPR compliance tracking
- SOC2/ISO27001/PCI frameworks
- Data exported events
- Security events
- Critical activity tracking

**Finding:** Audit logging infrastructure exists and is well-structured.

---

## 6. Security Architecture Findings

### 6.1 From Previous Audit (SECURITY_AUDIT.md)

**CRITICAL Issues (Unfixed):**
1. WebSocket server has no authentication
2. Merchant routes missing authorization (IDOR vulnerability)

**HIGH Issues:**
3. Redis fail-open in wallet service auth (dev mode)
4. Webhook secret allows bypass in development
5. Input validation gaps in intent routes

**MEDIUM Issues:**
6. Rate limiting key uses spoofable header
7. No CORS configuration
8. Missing security headers (Helmet.js not configured)
9. Incomplete SQL/NoSQL injection protection

### 6.2 New Findings

| Issue | Severity | Location |
|-------|----------|----------|
| PII stored without encryption | HIGH | All profile services |
| Bank accounts in plaintext | CRITICAL | Hotel OTA schema |
| No comprehensive data deletion | HIGH | Cross-service |
| No data export for users | HIGH | User services |
| Consent not enforced | MEDIUM | Data layer |
| No DB encryption at rest | HIGH | PostgreSQL/MongoDB |

---

## 7. Risk Matrix

| Risk | Likelihood | Impact | Risk Level |
|------|------------|--------|------------|
| PII breach from DB leak | MEDIUM | HIGH | HIGH |
| Bank account data exposure | LOW | CRITICAL | HIGH |
| GDPR violation fines | MEDIUM | HIGH | HIGH |
| Unauthorized data access | MEDIUM | MEDIUM | MEDIUM |
| Token theft | LOW | HIGH | MEDIUM |

---

## 8. Recommendations

### 8.1 Immediate Actions (Week 1)

1. **Encrypt Hotel OTA bank data**
   - Bank account numbers stored in plaintext
   - Add field-level encryption using merchant-service pattern
   - Generate ENCRYPTION_KEY and deploy

2. **Fix IDOR vulnerability**
   - Merchant routes verify ownership
   - Extract merchantId from JWT, not URL

3. **Add WebSocket authentication**
   - JWT validation on connection
   - Per-connection rate limiting

### 8.2 Short-term Actions (Weeks 2-4)

4. **Encrypt sensitive PII fields**
   - Apply field encryption to phone, email in profile services
   - Use existing AES-256-GCM encryption utilities

5. **Implement comprehensive user deletion**
   - DELETE endpoint cascades to all services
   - Add deletion scheduler for orphaned data
   - Implement "right to be forgotten" workflow

6. **Add data export functionality**
   - User can download all their data
   - Include profile, orders, payments, preferences

7. **Enforce consent at data layer**
   - Check consent before processing
   - Log consent changes
   - Add consent to analytics events

### 8.3 Medium-term Actions (Months 2-3)

8. **Database encryption at rest**
   - Enable MongoDB encryption
   - Enable PostgreSQL encryption (AWS RDS or similar)
   - Rotate encryption keys quarterly

9. **Add security headers**
   - Configure Helmet.js
   - HSTS header
   - CSP headers

10. **Implement mutual TLS**
    - Service-to-service encryption
    - Certificate rotation

11. **Data retention policies**
    - Document retention periods
    - Implement automatic cleanup
    - Add data minimization

### 8.4 Long-term Actions (Quarter 2+)

12. **GDPR Article 30 records**
    - Implement DataProcessingActivity record-keeping
    - Automate processing descriptions

13. **Breach notification workflow**
    - Implement DataBreachNotification flow
    - Add automated alerting
    - Document notification procedures

14. **Penetration testing**
    - Engage external security firm
    - Annual pen-test cycle
    - Bug bounty program

---

## 9. Implementation Plan

### Phase 1: Critical Fixes (Week 1)
```
1.1 Hotel OTA Bank Encryption
    - File: Hotel OTA/packages/database/prisma/schema.prisma
    - Add encryptedBankAccount field
    - Migration script

1.2 WebSocket Auth
    - File: rez-intent-graph/src/websocket/server.ts
    - JWT validation middleware

1.3 IDOR Fix
    - File: rez-intent-graph/src/api/merchant.routes.ts
    - Ownership validation
```

### Phase 2: PII Encryption (Weeks 2-3)
```
2.1 Profile Service Encryption
    - Add ENCRYPTION_KEY env var
    - Encrypt phone, email, addresses
    - Files: rez-profile-service/src/models/index.ts

2.2 Merchant Service Extension
    - Encrypt contact fields
    - File: rez-merchant-service/src/models/Merchant.ts
```

### Phase 3: GDPR Compliance (Weeks 4-6)
```
3.1 User Data Export
    - POST /user/:id/export
    - Aggregate data from all services
    - Generate downloadable JSON

3.2 Comprehensive Deletion
    - DELETE /user/:id cascade
    - Notify all services
    - Deletion confirmation

3.3 Consent Enforcement
    - Middleware for consent check
    - Consent-aware analytics
```

---

## 10. Files Requiring Changes

| Priority | File | Change Required |
|----------|------|----------------|
| CRITICAL | `Hotel OTA/packages/database/prisma/schema.prisma` | Add encrypted bank fields |
| CRITICAL | `rez-intent-graph/src/websocket/server.ts` | Add JWT auth |
| CRITICAL | `rez-intent-graph/src/api/merchant.routes.ts` | Add ownership check |
| HIGH | `rez-profile-service/src/models/index.ts` | Add field encryption |
| HIGH | `rez-user-intelligence-service/src/controllers/UserIntelligenceController.ts` | Cascade delete |
| HIGH | Multiple services | Add consent checks |
| MEDIUM | `rez-api-gateway/src/index.ts` | Add Helmet.js |
| MEDIUM | `docker-compose.yml` | Add MongoDB encryption config |

---

## 11. Verification Checklist

- [ ] Hotel OTA bank data encrypted
- [ ] WebSocket authentication implemented
- [ ] Merchant IDOR vulnerability fixed
- [ ] PII fields encrypted in profile services
- [ ] User data export endpoint functional
- [ ] Comprehensive user deletion working
- [ ] Consent enforced at data layer
- [ ] Security headers configured
- [ ] Database encryption enabled
- [ ] Retention policies documented
- [ ] Audit logging comprehensive
- [ ] Penetration tested

---

## Appendix A: Service Inventory

### PII-Handling Services

| Service | PII Types | Encryption | Notes |
|---------|-----------|------------|-------|
| rez-profile-service | phone, email, addresses | NO | Core user data |
| rez-merchant-service | bank, phone, email, business docs | PARTIAL | Bank encrypted |
| rez-payment-service | userDetails (name, email, phone) | NO | Transaction data |
| rez-wallet-service | Wallet balances | NO | No PII |
| rez-user-intelligence-service | behavioral data, consent | PARTIAL | Consent tracked |
| rez-auth-service | passwords, tokens | HASHED | Auth only |
| Hotel OTA | phone, email, bank, KYC | PARTIAL | Bank NOT encrypted |
| verify-service | scan data, fingerprints | NO | Device data |
| rez-ad-copilot | intent targeting | PARTIAL | Consent check |

### Non-PII Services
- rez-recommendation-engine
- rez-scheduler-service
- rez-feature-flags
- rez-observability

---

## Appendix B: Environment Variables Required

```bash
# Encryption
ENCRYPTION_KEY=                    # 64-char hex for AES-256
JWT_SECRET=                       # JWT signing
JWT_REFRESH_SECRET=               # Refresh token signing
JWT_ADMIN_SECRET=                  # Admin JWT

# Security
ALLOWED_ORIGINS=                  # CORS origins
RATE_LIMIT_WINDOW_MS=             # Rate limit config
ALLOW_AUTH_FAIL_OPEN=             # Auth fail mode

# Database
MONGODB_ENCRYPTION_KEY=           # MongoDB at-rest encryption
POSTGRES_SSL_MODE=                # Force SSL
```

---

## Appendix C: Related Documents

- `/SOURCE-OF-TRUTH/SECURITY_AUDIT.md` - Technical security audit (May 2, 2026)
- `/SOURCE-OF-TRUTH/PRIVACY-POLICY.md` - Privacy policy (if exists)
- `/SOURCE-OF-TRUTH/DATA-RETENTION.md` - Retention policies (to be created)

---

**Report Status:** Draft for Review
**Next Review:** May 12, 2026
**Distribution:** Security Team, Engineering Leads, DPO
