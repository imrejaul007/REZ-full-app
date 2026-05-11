# RTMN GROUP - IP STRUCTURE & DATA GOVERNANCE
## Intellectual Property & Data Architecture

**Date:** May 10, 2026

---

# PART 1: IP HOLDING STRUCTURE

## IP Classification

| IP Type | Owned By | Licensed To | Notes |
|---------|---------|------------|-------|
| **TRADEMARKS** | | | |
| RTMN Digital mark | RTMN Digital | All companies | Royalty-free internal |
| ReZ marks | RTMN Digital | All companies | Royalty-free internal |
| Sub-brand marks | RTMN Digital | Subsidiaries | Via license |
| **AI MODELS** | | | |
| REZ Mind | REZ Intelligence | All companies | Internal license |
| Intent Graph | REZ Intelligence | All companies | Internal license |
| ML Models | REZ Intelligence | - | Proprietary |
| **INFRA FRAMEWORKS** | | | |
| API Framework | Rabtul | All companies | Internal license |
| Auth Framework | Rabtul | All companies | Internal license |
| Payment orchestration | RTMN Finance | All companies | Internal license |
| **PRODUCT CODEBASES** | | | |
| Consumer App | REZ Commerce | - | Owned by REZ Commerce |
| Merchant App | REZ Commerce | - | Owned by REZ Commerce |
| Hotel OTA | StayOwn | - | Owned by StayOwn |
| POS System | ReZ POS | - | Owned by ReZ POS |
| AdBazaar | REZ Media | - | Owned by REZ Media |
| CorpPerks | CorpPerks | - | Owned by CorpPerks |
| **SHARED SDKs** | | | |
| REZ SDK | Rabtul | All companies | Internal license |
| REE SDK | REZ Intelligence | All companies | Internal license |
| Wallet SDK | RTMN Finance | All companies | Internal license |
| **DATA SCHEMAS** | | | |
| User schema | REZ Intelligence | All companies | Via REE |
| Merchant schema | REZ Commerce | - | Owned by REZ Commerce |
| Transaction schema | RTMN Finance | All companies | Via RTMN Finance |
| **COIN ECONOMICS** | | | |
| Coin minting rules | REZ Intelligence | All companies | Via REE |
| Karma algorithm | REZ Intelligence | All companies | Via REE |
| Reward calculation | REZ Intelligence | All companies | Via REE |

---

# IP LICENSE AGREEMENTS

## Internal Licenses (Royalty-Free)

```
RTMN DIGITAL (Licensor)
 │
 ├── Owns all trademarks
 └── Licenses to subsidiaries (royalty-free)
 │
 ▼
RABTUL (Licensor)
 │
 ├── Owns infra frameworks
 └── Licenses to all companies (cost-sharing)
 │
 ▼
REZ INTELLIGENCE (Licensor)
 │
 ├── Owns AI models
 └── Licenses to all companies (via REE)
 │
 ▼
RTMN FINANCE (Licensor)
 │
 ├── Owns payment tech
 └── Licenses to all companies (via RTMN Finance)
```

---

# DATA GOVERNANCE ARCHITECTURE

## Data Classification

| Data Type | Owner | Access | Anonymization |
|-----------|-------|--------|---------------|
| **USER DATA** | | | |
| Personal info | REZ Intelligence | All companies | Required |
| Transaction history | RTMN Finance | Via API | Required |
| Location data | REZ Intelligence | REZ Commerce | Required |
| Preferences | REZ Intelligence | Own products | Required |
| **MERCHANT DATA** | | | |
| Business info | REZ Commerce | Via API | Not required |
| Financial data | RTMN Finance | Own company | Encrypted |
| Performance | REZ Intelligence | Aggregated | Required |
| **CORPORATE DATA** | | | |
| Employee data | CorpPerks | Own company | Required |
| Spending patterns | CorpPerks | Aggregated | Required |
| HR data | CorpPerks | Own company | Required |
| **AI DATA** | | | |
| Training data | REZ Intelligence | REZ Intelligence | Owned |
| Model outputs | REZ Intelligence | Via API | Aggregated |
| Behavioral signals | REZ Intelligence | Via API | Anonymized |

---

# DATA SHARING RULES

## Cross-Company Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ DATA SHARING FRAMEWORK                                      │
├─────────────────────────────────────────────────────────┤
│                                                             │
│ RULE 1: Need-to-know basis                               │
│   └── Company gets data only for legitimate use            │
│                                                             │
│ RULE 2: Consent-based                                   │
│   └── User must consent for cross-company use             │
│                                                             │
│ RULE 3: Anonymization required                          │
│   └── Aggregate data only for analytics                   │
│                                                             │
│ RULE 4: Audit trail                                     │
│   └── All data access logged                             │
│                                                             │
│ RULE 5: Right to erasure                               │
│   └── User can request data deletion                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Access Matrix

| Data | REZ Commerce | REZ Intelligence | REZ Media | StayOwn | CorpPerks | RTMN Finance |
|------|--------------|-----------------|-----------|---------|-----------|-------------|
| User personal | Via API | Full | Aggregated | Via API | Via API | Via API |
| User transactions | Via API | Aggregated | Aggregated | Via API | Via API | Full |
| User location | Via API | Aggregated | No | Via API | No | No |
| Merchant financials | Own | Aggregated | No | No | No | Own |
| Corporate employees | No | No | No | No | Own | No |

---

# CONSENT ARCHITECTURE

## User Consent Layers

| Layer | Consent | Data Use |
|-------|---------|---------|
| **Core** | Required | Basic app functionality |
| **Analytics** | Optional | Product improvement |
| **Marketing** | Optional | Personalized ads |
| **Third-party** | Optional | Partner services |
| **AI Training** | Optional | Model improvement |

## Consent Flow

```
USER SIGNS UP
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ CONSENT MODULE                                          │
│                                                         │
│ [ ] Core functionality (required)                       │
│     - Order, pay, track                               │
│                                                         │
│ [ ] Analytics (optional)                               │
│     - App usage, preferences                           │
│                                                         │
│ [ ] Marketing (optional)                               │
│     - Personalized recommendations                      │
│                                                         │
│ [ ] AI improvements (optional)                         │
│     - Model training                                   │
└─────────────────────────────────────────────────────────┘
    │
    ▼
CONSENT STORED IN USER PROFILE
    │
    ▼
DATA ACCESS ENFORCED AT API LAYER
```

---

# AI TRAINING RULES

## Model Training Permissions

| Data Type | Can Train On | Conditions |
|-----------|--------------|-----------|
| User behavior | Aggregated only | Anonymized |
| Transaction patterns | Company-specific | Own data only |
| Merchant performance | Company-specific | Own data only |
| Corp employee data | NO | Never |
| Financial data | NO | Never |

## AI Data Access

```
AI MODEL TRAINING
 │
 ├── Uses ONLY anonymized data
 ├── Requires explicit consent
 ├── Excludes personal identifiers
 ├── Aggregates before training
 └── Logs all training data access
```

---

# MERCHANT DATA OWNERSHIP

## Data Ownership Rules

| Data Type | Owner | Can Others Access |
|-----------|-------|------------------|
| Own transactions | Merchant | Via API (own data) |
| Own customers | Merchant | No |
| Own financials | Merchant | Own company only |
| Aggregated industry | REZ Intelligence | All companies |
| Performance benchmarks | REZ Intelligence | Via API |

## Data Portability

```
MERCHANT DATA RIGHTS
 │
 ├── Download all data (export)
 ├── Delete on exit
 ├── Transfer to competitor (post contract)
 └── RTMN retains anonymized aggregates
```

---

# REGULATORY COMPLIANCE

## India Regulations

| Regulation | Requirement | Owner |
|------------|-------------|-------|
| DPDP Act | Consent, data minimization | RTMN Digital |
| IT Act | Security, privacy | Rabtul |
| GDPR (if EU users) | Right to erasure | REZ Intelligence |
| SOC 2 | Security controls | Rabtul |

## Compliance Checklist

- [ ] User consent management
- [ ] Data minimization
- [ ] Right to erasure
- [ ] Data portability
- [ ] Security controls
- [ ] Audit logging
- [ ] Breach notification
- [ ] Data localization (if required)

---

*IP & Data Governance - May 10, 2026*
