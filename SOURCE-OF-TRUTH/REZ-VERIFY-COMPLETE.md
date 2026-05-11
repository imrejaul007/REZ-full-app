# REZ VERIFY - COMPLETE SOURCE OF TRUTH

**Last Updated:** 2026-05-04
**Status:** All code committed to git

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [QR Systems Ecosystem](#2-qr-systems-ecosystem)
3. [ReZ Verify Product Authentication](#3-rez-verify-product-authentication)
4. [Social Impact Check-in System](#4-social-impact-check-in-system)
5. [Bill Upload & Verification](#5-bill-upload--verification)
6. [Trial QR System](#6-trial-qr-system)
7. [Fraud Detection Services](#7-fraud-detection-services)
8. [EXECUTION-PLAN.md - What's Planned](#8-execution-planmd---whats-planned)
9. [File Reference](#9-file-reference)
10. [New Integrations (2026-05-04)](#10-new-integrations-2026-05-04)
11. [Gaps & Missing Pieces](#11-gaps--missing-pieces)

---

## 1. OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ VERIFY ECOSYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CONSUMER FACING                                     │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐   │   │
│  │  │ ReZ Now   │  │  Menu QR  │  │  Room QR  │  │  Bill Upload  │   │   │
│  │  │  (Scan)   │  │(Restaurant)│  │  (Hotel)  │  │  (Cashback)   │   │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────┘   │   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │           REZ VERIFY (Product Authentication)                 │   │   │
│  │  │         Scan product QR → Verify authenticity → Earn coins   │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    MERCHANT/BRAND FACING                              │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐   │   │
│  │  │  Social   │  │  Merchant │  │   Brand   │  │   Admin       │   │   │
│  │  │  Impact   │  │   App     │  │ Dashboard │  │   App         │   │   │
│  │  │  Check-in │  │ (Scanner) │  │ (Verify)  │  │ (Oversight)  │   │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    BACKEND SERVICES                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │   │
│  │  │   verify-   │  │   social-   │  │    bill     │  │  fraud   │ │   │
│  │  │   service   │  │   impact    │  │  verifica-  │  │  detec-  │ │   │
│  │  │             │  │   service   │  │   tion      │  │   tion   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. QR SYSTEMS ECOSYSTEM

### 2.1 Complete QR Systems (8 Types)

| QR Type | Purpose | Format | Status |
|---------|---------|--------|--------|
| **Profile QR** | Business cards (ReZ Now) | `rez://profile/{id}` | ✅ Production |
| **Menu QR** | Restaurant ordering | `rez://menu/{id}?table={n}` | ✅ Production |
| **Room QR** | Hotel services | `rez://room/{id}?token={jwt}` | ✅ Production |
| **Ads QR** | Campaign tracking | `rez://ad/{id}?source=qr` | ✅ Production |
| **Social Impact QR** | Event check-in | `SI-{eventId}-{userId}-{hash}` | ✅ Production |
| **Bill Upload QR** | Receipt verification | N/A (image upload) | ✅ Production |
| **Trial QR** | Trial booking JWT | JWT token | ✅ Production |
| **Product Verify QR** | Product authenticity | `REZ-{brand}-{product}-{serial}` | ✅ Production |

### 2.2 Integration Matrix

| QR System | Wallet | Auth | Mind | Karma | Whats Connected |
|-----------|--------|------|------|-------|------------------|
| **ReZ Verify** | ✅ | ✅ | ✅ NEW | ✅ NEW | All services |
| **Social Impact** | ✅ | ✅ | ❌ | ✅ NEW | Most services |
| **Bill Upload** | ✅ | ✅ | ❌ | ❌ | Partial |
| **Menu/Profile QR** | ✅ | ✅ | ✅ | ❌ | Most services |
| **Ads QR** | ✅ | ✅ | ✅ | ❌ | Most services |
| **Room QR** | ✅ | ✅ | ❌ | ❌ | Partial |

---

## 3. REZ VERIFY PRODUCT AUTHENTICATION

### 3.1 What It Is

**ReZ Verify** enables consumers to verify product authenticity by scanning QR codes on physical products. Each product has a unique serial number with cryptographic signature.

### 3.2 Components

#### Backend Service
**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/verify-service/`

| File | Purpose |
|------|---------|
| `src/lib/serial/generator.ts` | Serial generation with HMAC-SHA256 signatures |
| `src/lib/serial/validator.ts` | Serial validation with signature verification |
| `src/lib/auth.ts` | JWT-based authentication |
| `src/lib/wallet.ts` | Wallet service integration (credit/debit/balance) |
| `src/lib/karma.ts` | **NEW** - Karma service integration (qr_in signals) |
| `src/lib/mind.ts` | **NEW** - ReZ Mind integration (intent capture) |
| `src/components/dashboard/Products.tsx` | Brand product management dashboard |
| `src/components/verify/VerifyResult.tsx` | Verification result UI |
| `src/app/page.tsx` | Consumer scan/verify screen |
| `src/app/api/verify/route.ts` | **UPDATED** - Verify API with all integrations |
| `__tests__/serial.test.ts` | Unit tests |

### 3.3 Serial Format
```
REZ-{BRAND_PREFIX}-{PRODUCT_CODE}-{RANDOM_12_CHARS}

Example: REZ-ABC-P1-X7K9M2N4P6Q8
```

### 3.4 Status

| Component | Status |
|-----------|--------|
| Serial Generation | ✅ Built |
| Serial Validation | ✅ Built |
| Brand Dashboard | ✅ Built |
| Consumer Verify UI | ✅ Built |
| Wallet Integration | ✅ Built |
| **Karma Integration** | ✅ **NEW** |
| **Mind Integration** | ✅ **NEW** |
| Consumer App Intent | ✅ **NEW** |

---

## 4. SOCIAL IMPACT CHECK-IN SYSTEM

### 4.1 What It Is

Event attendance verification system using QR codes. Used for social impact events (charity runs, NGO events, etc.) where users earn karma points and branded coins.

### 4.2 Architecture

#### Backend
**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rezbackend/rez-backend-master/src/`

| File | Purpose |
|------|---------|
| `services/socialImpactService.ts` | Core check-in/out logic |
| `services/karmaIntegration.ts` | **NEW** - Karma service integration |
| `routes/merchant/socialImpact.ts` | Merchant API routes |
| `routes/programRoutes.ts` | Admin/user routes |
| `controllers/merchant/socialImpactController.ts` | Request handlers |
| `middleware/trialQR.ts` | JWT trial QR middleware |

### 4.3 Features

| Feature | Status |
|---------|--------|
| QR Generation | ✅ Built |
| QR Scanning (Mobile) | ✅ Built |
| QR Scanning (Web) | ✅ Built |
| Check-in Verification | ✅ Built |
| OTP Fallback | ✅ Built |
| Geo Verification | ✅ Built |
| **Karma qr_in/qr_out** | ✅ **NEW** |
| **Coin Rewards** | ✅ Built |
| **Branded Coins** | ✅ Built |

---

## 5. BILL UPLOAD & VERIFICATION

### 5.1 Components

**Consumer App:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/`

| File | Purpose |
|------|---------|
| `app/bill-upload-enhanced.tsx` | Upload UI |
| `services/billVerificationService.ts` | Verification workflow |
| `types/billVerification.types.ts` | Type definitions |

### 5.2 Features

| Feature | Status |
|---------|--------|
| Camera Upload | ✅ Built |
| OCR Processing | ✅ Built |
| Merchant Matching | ✅ Built |
| Fraud Detection | ✅ Built |
| Cashback Calculation | ✅ Built |

---

## 6. TRIAL QR SYSTEM

**File:** `/Users/rejaulkarim/Documents/ReZ Full App/rezbackend/rez-backend-master/src/middleware/trialQR.ts`

| Function | Purpose |
|----------|---------|
| `signQRToken(payload)` | Signs JWT tokens for trial bookings |
| `verifyQRToken(token)` | Verifies JWT tokens |
| `validateTrialQR` | Express middleware |

---

## 7. FRAUD DETECTION SERVICES

### 7.1 Components

| Service | Location | Checks |
|---------|----------|--------|
| **Karma Verification** | `rez-karma-service/src/engines/verificationEngine.ts` | QR, GPS, NGO approval |
| **Ads Click Fraud** | `rez-ads-service/src/services/clickFraudService.ts` | Rapid click, IP flooding, bot patterns |
| **Bill Fraud** | `rezbackend/.../fraudDetectionService.ts` | Duplicate bills, velocity |
| **Product Verify Fraud** | `verify-service/src/lib/fraud/engine.ts` | Velocity, geo, device |

### 7.2 Signal Weights (Karma)

| Signal | Weight | Description |
|-------|--------|-------------|
| `qr_in` | 0.30 | Check-in QR scanned |
| `qr_out` | 0.30 | Check-out QR scanned |
| `gps_match` | 0.15 | GPS matches venue |
| `ngo_approved` | 0.40 | NGO human approval |
| `photo_proof` | 0.10 | Photo verification |

---

## 8. EXECUTION-PLAN.MD - WHAT'S PLANNED

**File:** `/Users/rejaulkarim/Documents/ReZ Full App/EXECUTION-PLAN.md`

### Planned Features (Not Built)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Branded Coins Dashboard** | Custom coin management per brand | P1 |
| **Campaign Management** | Reward campaigns for products | P1 |
| **Advanced Analytics** | ROI, scan maps, timeline | P2 |
| **Supply Chain Tracking** | Product journey visualization | P2 |
| **Admin Fraud Queue UI** | Manual review interface | P2 |

---

## 9. FILE REFERENCE

### 9.1 verify-service (Product Auth)

```
verify-service/
├── src/
│   ├── lib/
│   │   ├── serial/
│   │   │   ├── generator.ts      ← Serial + HMAC generation
│   │   │   └── validator.ts      ← Serial validation
│   │   ├── auth.ts              ← JWT auth
│   │   ├── wallet.ts            ← Wallet integration
│   │   ├── karma.ts             ← **NEW** Karma integration
│   │   ├── mind.ts              ← **NEW** Mind integration
│   │   └── fraud/
│   │       └── engine.ts        ← Fraud detection
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── Products.tsx     ← Brand dashboard
│   │   └── verify/
│   │       └── VerifyResult.tsx  ← Result UI
│   └── app/
│       ├── page.tsx             ← Consumer scan page
│       └── api/
│           └── verify/
│               └── route.ts      ← **UPDATED** Verify API
├── .env.example                 ← **UPDATED** with new env vars
└── __tests__/
    └── serial.test.ts           ← Unit tests
```

### 9.2 Backend Karma Integration

```
rezbackend/rez-backend-master/src/services/
├── karmaIntegration.ts          ← **NEW** Karma service client
└── socialImpactService.ts      ← Social impact (uses karma)
```

### 9.3 Consumer App QR Updates

```
rez-app-consumer/
├── utils/qr/
│   ├── qrPayload.ts             ← **UPDATED** +product-verify intent
│   └── qrIntentRouter.ts       ← **UPDATED** +product-verify route
```

---

## 10. NEW INTEGRATIONS (2026-05-04)

### 10.1 verify-service → Karma

**File:** `verify-service/src/lib/karma.ts`

| Function | Purpose |
|----------|---------|
| `recordProductVerification()` | Records qr_in signal for product scans |
| `getKarmaProfile()` | Fetch user karma level/multiplier |
| `getKarmaMultiplier()` | Get reward multiplier based on karma tier |

**Usage in verify API:**
```typescript
// Get multiplier for bonus rewards
const { multiplier, tier } = await getKarmaMultiplier(userId)

// Record to karma (qr_in signal)
const karmaResult = await recordProductVerification(userId, brandId, productId, serialId, location)
```

### 10.2 verify-service → ReZ Mind

**File:** `verify-service/src/lib/mind.ts`

| Function | Purpose |
|----------|---------|
| `sendVerificationToMind()` | Send verification events to event platform |
| `captureVerificationIntent()` | Record intent to intent graph |
| `sendFraudSignalToMind()` | Report fraud attempts for pattern learning |
| `getVerificationHistory()` | Fetch user's verification history |

**Usage in verify API:**
```typescript
// Fire-and-forget Mind integrations
sendVerificationToMind({ userId, brandId, productId, ... })
captureVerificationIntent(userId, brandId, productId, serialId)
sendFraudSignalToMind(userId, brandId, 'verification_blocked', details)
```

### 10.3 Backend → Karma

**File:** `rezbackend/.../services/karmaIntegration.ts`

| Function | Purpose |
|----------|---------|
| `recordKarmaCheckIn()` | Record qr_in to karma service |
| `recordKarmaCheckOut()` | Record qr_out to karma service |
| `getKarmaProfile()` | Fetch user karma profile |
| `getKarmaMultiplier()` | Get tier-based multiplier |
| `approveKarmaVerification()` | NGO approval for partial verifications |

### 10.4 Consumer App → Product Verify

**Files:** `rez-app-consumer/utils/qr/qrPayload.ts`, `qrIntentRouter.ts`

Added `product-verify` intent type and route:
```typescript
// Payload
{ intent: 'product-verify', brandId, brandSlug, productId, serialNumber }

// Routes to
/verify/[brandSlug]/[productId]
```

### 10.5 Environment Variables

**verify-service/.env.example** - Added:
```
KARMA_API_URL="http://localhost:4001"
REZ_MIND_URL="http://localhost:4008"
INTENT_CAPTURE_URL="https://rez-intent-graph.onrender.com"
```

**Backend** - Added:
```
KARMA_API_URL="http://localhost:4001"
```

---

## 11. GAPS & MISSING PIECES

### 11.1 Remaining Gaps

| Gap | Status | Notes |
|-----|--------|-------|
| **Karma in Room QR** | ❌ Not connected | Future enhancement |
| **Karma in Trial QR** | ❌ Not connected | Not applicable for trial |

### 11.2 Consumer App Routes

✅ Created: `rez-app-consumer/app/verify/[brandSlug]/[productId]/page.tsx`

### 11.3 Planned EXECUTION-PLAN.md Features

| Feature | Status | Missing |
|---------|--------|---------|
| Branded Coins Dashboard | ⏳ Planned | UI development |
| Campaign System | ⏳ Planned | Full CRUD + analytics |
| Supply Chain Tracking | ⏳ Planned | Journey visualization |
| Admin Fraud Queue | ⏳ Planned | Review interface |

---

## GIT STATUS

All changes committed to git on 2026-05-04 (session 2).

---

## QUICK REFERENCE

### QR Systems by Integration (Updated 2026-05-04)

| QR Type | Wallet | Auth | Mind | Karma |
|---------|--------|------|------|-------|
| **ReZ Verify** | ✅ | ✅ | ✅ | ✅ |
| **Social Impact** | ✅ | ✅ | ✅ | ✅ |
| **Bill Upload** | ✅ | ✅ | ✅ | ✅ |
| **Ads QR** | ✅ | ✅ | ✅ | ✅ |
| **Menu/Profile QR** | ✅ | ✅ | ✅ | ✅ |
| **Room QR** | ✅ | ✅ | ✅ | ❌ |
| **Trial QR** | ❌ | ✅ | ❌ | ❌ |

### New Files Created

| File | Purpose |
|------|---------|
| `verify-service/src/lib/karma.ts` | Karma qr_in signal integration |
| `verify-service/src/lib/mind.ts` | Mind intent capture |
| `verify-service/__tests__/karma.test.ts` | Karma unit tests |
| `verify-service/__tests__/mind.test.ts` | Mind unit tests |
| `rezbackend/.../services/karmaIntegration.ts` | Backend karma client |
| `rezbackend/.../services/mindIntegration.ts` | Backend Mind integration |
| `rezbackend/.../src/__tests__/karmaIntegration.test.ts` | Backend karma tests |
| `rezbackend/.../src/__tests__/mindIntegration.test.ts` | Backend mind tests |
| `adsqr/src/lib/karmaIntegration.ts` | Ads QR karma integration |
| `rez-now/lib/api/room-qr-service.ts` | Room QR Mind integration |
| `rez-now/lib/loyalty/index.ts` | Menu/Profile QR Karma integration |
| `rez-app-consumer/app/verify/[brandSlug]/[productId]/page.tsx` | Consumer verify page |

### Files Updated

| File | Changes |
|------|---------|
| `verify-service/src/app/api/verify/route.ts` | Added Karma + Mind calls |
| `verify-service/.env.example` | Added KARMA_API_URL, REZ_MIND_URL |
| `rez-app-consumer/utils/qr/qrPayload.ts` | Added product-verify intent |
| `rez-app-consumer/utils/qr/qrIntentRouter.ts` | Added product-verify route |
| `rezbackend/.../services/socialImpactService.ts` | Added Mind integration |
| `rezbackend/.../models/Bill.ts` | Added Mind + Karma integration |
| `adsqr/src/app/api/scan/[slug]/route.ts` | Added Karma integration |

---

**Last Updated:** 2026-05-04
**Next Review:** 2026-05-11
