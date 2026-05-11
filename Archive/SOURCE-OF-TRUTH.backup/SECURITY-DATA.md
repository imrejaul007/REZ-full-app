# Data Security - Source of Truth

## Overview
This document defines the security requirements and implementations for protecting sensitive data across the ReZ ecosystem.

## Encryption Standards

### At-Rest Encryption
- **Algorithm**: AES-256-GCM
- **Key Management**: Environment-based keys with rotation policy
- **Scope**: All PII, payment data, authentication credentials

### In-Transit Encryption
- **Protocol**: TLS 1.3 minimum
- **Certificate**: Valid CA-signed certificates
- **HSTS**: Enabled on all endpoints

## Sensitive Data Classification

| Type | Examples | Protection Level |
|------|----------|------------------|
| PII | Name, email, phone | High - Encrypt + Hash |
| Financial | Credit cards, bank accounts | Critical - Encrypt only |
| Authentication | Passwords, tokens | Critical - Salted hash |
| Health | Medical data | High - Encrypt + Audit |

## Implementation

### DataSecurity Utility
Location: `packages/rez-shared/src/utils/dataSecurity.ts`

**Methods:**
- `encryptSensitive(data, key)` - AES-256-GCM encryption
- `decryptSensitive(encryptedData, key)` - Decryption
- `hashPII(data)` - SHA-256 hashing for lookups
- `maskPII(data, type)` - Display masking (phone/email/card)

### Key Derivation
- PBKDF2 with 100,000 iterations
- Unique salt per encryption operation
- Key stored in environment variable `ENCRYPTION_KEY`

## Database Encryption

### MongoDB
- Field-level encryption for PII
- Client-side encryption using CSFLE
- Audit logging on all access

### Redis
- TLS for connections
- AUTH enabled
- Encrypted data only (no plaintext secrets)

## Backup Security

### Encryption
- GPG symmetric encryption for all backups
- Key management via environment variable `GPG_KEY`
- Separate keys per environment

### Retention
- Encrypted backups retained for 90 days
- Automated cleanup of expired backups

## Compliance Requirements

- [ ] GDPR: Right to erasure, data portability
- [ ] PCI-DSS: Card data protection (if applicable)
- [ ] SOC 2: Access logging, encryption at rest

## Audit Trail

All data access and modifications must be logged with:
- Timestamp
- User/Service ID
- Action type
- Data affected (hashed)

## Scripts

- `scripts/security/encrypt-database.sh` - Database field encryption
- `scripts/security/encrypt-backup.sh` - Backup encryption
