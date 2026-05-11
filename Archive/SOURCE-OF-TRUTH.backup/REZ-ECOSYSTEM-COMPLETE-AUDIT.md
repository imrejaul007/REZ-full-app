# REZ ECOSYSTEM - COMPLETE REPOSITORY AUDIT

**Last Updated:** 2026-05-04
**Status:** Comprehensive Review Document

---

## TABLE OF CONTENTS

1. [All Repositories Overview](#1-all-repositories-overview)
2. [Consumer-Facing Apps](#2-consumer-facing-apps)
3. [Merchant Apps](#3-merchant-apps)
4. [Admin Apps](#4-admin-apps)
5. [Backend Services](#5-backend-services)
6. [Business Logic Services](#6-business-logic-services)
7. [AI/Intelligence Services](#7-aiintelligence-services)
8. [QR & Verification Services](#8-qr--verification-services)
9. [Wallet & Finance Services](#9-wallet--finance-services)
10. [Shared Libraries](#10-shared-libraries)
11. [Business Logic Analysis](#11-business-logic-analysis)
12. [What REE Will Replace](#12-what-ree-will-replace)
13. [Integration Gaps](#13-integration-gaps)

---

## 1. ALL REPOSITORIES OVERVIEW

### 1.1 Main Repository

| Property | Value |
|----------|-------|
| **Name** | ReZ Full App |
| **Path** | `/Users/rejaulkarim/Documents/ReZ Full App/` |
| **Type** | Monorepo (multiple packages) |
| **Git** | Yes (SOURCE-OF-TRUTH folder) |
| **Package Manager** | npm/pnpm workspaces |

### 1.2 Repository Matrix

| Category | Repositories | Count |
|----------|-------------|-------|
| Consumer Apps | rez-app-consumer, rez-now | 2 |
| Merchant Apps | rez-app-merchant | 1 |
| Admin Apps | rez-app-admin | 1 |
| Backend Services | rezbackend, rez-auth-service, rez-merchant-service | 3+ |
| QR/Verify | verify-service, adsqr | 2 |
| Wallet/Finance | rez-wallet-service, rez-karma-service | 2 |
| AI/Intelligence | rez-intent-predictor, rez-targeting-engine, rez-action-engine | 3 |
| Shared | rez-shared | 1 |

---

## 2. CONSUMER-FACING APPS

### 2.1 rez-app-consumer

**Path:** `rez-app-consumer/`
**Stack:** Expo SDK 53, React Native 0.79, TypeScript, Expo Router, TanStack Query, Zustand, Victory Native, Socket.io, Razorpay, Sentry

#### Screens & Features

| Feature | File | Description |
|---------|------|-------------|
| Authentication | `sign-in.tsx` | Phone OTP + Email login |
| Home/Discover | `HomePage.tsx` | Personalized feed |
| Earn Tab | `EarnPage.tsx` | Ways to earn coins |
| Finance Tab | `FinancePage.tsx` | Wallet, transactions |
| Play Tab | `PlayPage.tsx` | Games, challenges |
| Store | `Store.tsx` | Store browsing |
| QR Scanner | `scan.tsx` | Unified QR scanning |
| Bill Upload | `bill-upload-enhanced.tsx` | Receipt verification |
| Bill Payment | `bill-payment.tsx` | BBPS payments |
| Mobile Recharge | `recharge.tsx` | Recharge & pay |

#### Coin System Integration

| Coin Type | Usage | File |
|-----------|-------|------|
| REZ | Earned from all QR + loyalty | `WalletContext.tsx` |
| BRANDED | From merchants | `BrandedCoinsScreen.tsx` |
| CASHBACK | From bill upload | `bill-upload-enhanced.tsx` |
| PROMO | From promo codes | `promo-code.tsx` |

#### API Connection
- API: `https://rez-api-gateway.onrender.com/api`
- Coin Value: 1 coin = ₹1

---

### 2.2 rez-now

**Path:** `rez-now/`
**Stack:** Next.js, React, TypeScript

#### Features

| Feature | File | Description |
|---------|------|-------------|
| Store Page | `store/page.tsx` | Merchant public page |
| Menu QR | `menu-qr/` | Restaurant menu |
| Room Hub | `room/` | Hotel services |
| Web Scanner | `scan/page.tsx` | Camera QR scan |
| Loyalty | `lib/loyalty/index.ts` | Visit rewards |
| Wallet | `lib/wallet/` | Coin management |
| Checkout | `pay/checkout/` | Order payment |

#### Loyalty System

```typescript
// From lib/loyalty/index.ts
interface LoyaltyProfile {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  pointsToNextTier: number;
  lifetimePoints: number;
}
```

---

## 3. MERCHANT APPS

### 3.1 rez-app-merchant

**Path:** `rez-app-merchant/`
**Stack:** Expo, React Native, TypeScript

#### Features

| Feature | File | Description |
|---------|------|-------------|
| Dashboard | `app/(tabs)/index.tsx` | Overview |
| Orders | `app/(tabs)/orders.tsx` | Order management |
| Store Setup | `app/store-setup/` | Store configuration |
| POS | `app/pos/` | Point of sale |
| Analytics | `app/(tabs)/analytics.tsx` | Business insights |
| Social Impact | `app/social-impact/[id]/` | Event management |
| Branded Coins | `services/api/brandedCoins.ts` | Coin awards |

#### Branded Coins API

```typescript
// From services/api/brandedCoins.ts
awardCoins(storeId, userId, amount, reason)
// Max: 1000 coins per award
// Rate limit: 100/hour per merchant
```

---

## 4. ADMIN APPS

### 4.1 rez-app-admin

**Path:** `rez-app-admin/`
**Stack:** Expo, React Native, TypeScript

#### Features

| Feature | File | Description |
|---------|------|-------------|
| Dashboard | `app/index.tsx` | Overview stats |
| User Management | `app/users/` | User moderation |
| Merchant Management | `app/merchants/` | Merchant oversight |
| Bill Review | `app/bill-review/` | Bill approval |
| Analytics | `app/analytics/` | Platform analytics |
| Social Impact | `app/social-impact/` | Event oversight |

---

## 5. BACKEND SERVICES

### 5.1 rezbackend (Main Backend)

**Path:** `rezbackend/rez-backend-master/`
**Stack:** Node.js, Express, MongoDB, TypeScript

#### Core Services

| Service | File | Purpose |
|---------|------|---------|
| Coin Service | `services/coinService.ts` | Coin operations |
| Wallet Service | `services/walletService.ts` | Wallet management |
| Karma Integration | `services/karmaIntegration.ts` | Karma signals |
| Mind Integration | `services/mindIntegration.ts` | Event tracking |
| Social Impact | `services/socialImpactService.ts` | Event check-in |

#### Models

| Model | File | Purpose |
|-------|------|---------|
| User | `models/User.ts` | User accounts |
| Wallet | `models/Wallet.ts` | Coin balances |
| CoinTransaction | `models/CoinTransaction.ts` | Transaction history |
| Bill | `models/Bill.ts` | Bill/cashback |
| SocialImpactEnrollment | `models/SocialImpactEnrollment.ts` | Event participation |
| Program | `models/Program.ts` | Events/programs |

#### Routes

| Route | File | Purpose |
|-------|------|---------|
| Auth | `routes/authRoutes.ts` | Login/register |
| Wallet | `routes/wallet.ts` | Wallet operations |
| Coins | `merchantroutes/coins.ts` | Merchant coins |
| Bills | `routes/billRoutes.ts` | Bill upload |
| Social Impact | `routes/programRoutes.ts` | Events |

#### Karma Integration (Current)

```typescript
// From services/karmaIntegration.ts
export async function recordKarmaCheckIn(userId, eventId, mode, qrCode?, gpsCoords?)
export async function recordKarmaCheckOut(userId, eventId, mode, qrCode?, gpsCoords?)
export async function getKarmaProfile(userId)
export async function getKarmaMultiplier(userId)
```

#### Mind Integration (Current)

```typescript
// From services/mindIntegration.ts
export async function sendEventToMind(event: MindEvent)
export async function captureIntent(intent)
export async function sendSocialImpactEventToMind(data)
export async function sendBillUploadEventToMind(data)
export async function sendAdEngagementToMind(data)
```

---

### 5.2 rez-auth-service

**Path:** `rez-auth-service/`
**Stack:** Node.js, Express, MongoDB, TypeScript

#### Features

| Feature | Description |
|---------|-------------|
| OTP Generation | Phone/email OTP |
| JWT Tokens | Access + refresh |
| Device Fingerprint | Device tracking |
| TOTP | 2FA support |
| Session Management | Multi-device |

#### Models

```typescript
// User model
interface User {
  phoneNumber: string;  // Required, unique
  email?: string;
  name?: string;
  role: 'user' | 'merchant' | 'admin';
  referralCode: string;
  referralCount: number;
}

// UserProfile model
interface UserProfile {
  userId: ObjectId;
  verticals: IVerticalStats[];
  totalSpend: number;
  transactionCount: number;
  engagementScore: number;
  favoriteCategories: string[];
}
```

---

### 5.3 rez-merchant-service

**Path:** `rez-merchant-service/`
**Stack:** Node.js, Express, MongoDB, TypeScript

#### Features

| Feature | Description |
|---------|-------------|
| Store Management | CRUD stores |
| Menu Management | Products/categories |
| Order Processing | POS integration |
| Analytics | Sales reports |
| Settlement | Payout processing |

---

## 6. BUSINESS LOGIC SERVICES

### 6.1 rez-karma-service

**Path:** `rez-karma-service/`
**Stack:** Node.js, Express, MongoDB, TypeScript

#### Karma Levels

```typescript
// From src/engines/karmaEngine.ts
const LEVEL_THRESHOLDS = {
  L1: 0,      // Bronze
  L2: 500,    // Silver
  L3: 2000,   // Gold
  L4: 5000    // Platinum
};

const CONVERSION_RATES = {
  L1: 0.25,  // 25%
  L2: 0.50,  // 50%
  L3: 0.75,  // 75%
  L4: 1.00,  // 100%
};
```

#### Karma Score (300-900)

```
Total = Base(300) + Impact(0-250) + RelativeRank(0-180) + Trust(0-100) + Momentum(0-70)
```

#### Models

```typescript
// KarmaProfile model
interface KarmaProfile {
  userId: ObjectId;
  lifetimeKarma: number;
  activeKarma: number;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  eventsCompleted: number;
  trustScore: number;
  badges: IBadge[];
  karmaScore: {
    base: number;
    impact: number;
    relativeRank: number;
    trust: number;
    momentum: number;
    total: number;
  };
}
```

#### Verification Engine

```typescript
// From src/engines/verificationEngine.ts
const SIGNAL_WEIGHTS = {
  qr_in: 0.30,
  qr_out: 0.30,
  gps_match: 0.15,
  ngo_approved: 0.40,
  photo_proof: 0.10,
};

// Approval thresholds
// >= 0.60: verified (auto-approve)
// 0.40-0.59: partial (NGO review)
// < 0.40: rejected
```

#### Weekly Conversion (Batch)

```typescript
// From src/services/batchService.ts
// Weekly batch: karma → REZ coins
// Weekly cap: 300 coins (L4 users)
// Formula: karmaEarned * conversionRate
```

---

### 6.2 rez-wallet-service

**Path:** `rez-wallet-service/`
**Stack:** Node.js, Express, MongoDB, Redis, BullMQ, TypeScript

#### Coin Types Supported

```typescript
enum CoinType {
  REZ = 'rez'         // Never expires
  BRANDED = 'branded'   // 180 days
  CASHBACK = 'cashback'  // 365 days
  PROMO = 'promo'       // 90 days
  PRIVE = 'prive'       // 365 days
  REFERRAL = 'referral'  // 180 days
}
```

#### Wallet Model

```typescript
interface IWallet {
  user: ObjectId;
  balance: {
    total: number;
    available: number;
    pending: number;
    cashback: number;  // CASHBACK stored here (scalar)
  };
  coins: ICoinBalance[];  // REZ, PROMO, PRIVE, REFERRAL
  brandedCoins: IBrandedCoin[];
  categoryBalances: Map<string, number>;
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    transactionCount: number;
  };
}
```

#### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wallet` | Get wallet |
| GET | `/api/wallet/balance` | Get balances |
| GET | `/api/wallet/transactions` | Transaction list |
| POST | `/api/wallet/credit` | Credit coins |
| POST | `/api/wallet/debit` | Debit coins |
| POST | `/api/wallet/convert` | Convert BRANDED→REZ |
| GET | `/api/wallet/expiry-preview` | Preview expiring |

#### Business Limits

```typescript
DAILY_COIN_CAP = 1000
WEEKLY_COIN_CAP = 3000
MIN_REDEMPTION = 10
MAX_REDEMPTION = 5000
COIN_TO_RUPEE_RATE = 1.0  // 1 coin = ₹1
```

---

## 7. AI/INTELLIGENCE SERVICES

### 7.1 rez-intent-predictor

**Path:** `rez-intent-predictor/`
**Purpose:** Real-time user intent prediction

### 7.2 rez-targeting-engine

**Path:** `rez-targeting-engine/`
**Purpose:** Ad/notification targeting based on user behavior

### 7.3 rez-action-engine

**Path:** `rez-action-engine/`
**Purpose:** Decision execution for automated actions

### 7.4 rez-insights-service

**Path:** `rez-insights-service/`
**Purpose:** AI-powered insights storage

---

## 8. QR & VERIFICATION SERVICES

### 8.1 verify-service

**Path:** `verify-service/`
**Stack:** Next.js, TypeScript, Prisma, PostgreSQL

#### Features

| Feature | File | Purpose |
|---------|------|---------|
| Serial Generation | `src/lib/serial/generator.ts` | HMAC-signed serials |
| Serial Validation | `src/lib/serial/validator.ts` | Verify authenticity |
| Brand Dashboard | `src/components/dashboard/` | Brand management |
| Verify API | `src/app/api/verify/route.ts` | Verify endpoint |
| Wallet Integration | `src/lib/wallet.ts` | Coin rewards |
| Karma Integration | `src/lib/karma.ts` | qr_in signals |
| Mind Integration | `src/lib/mind.ts` | Intent capture |

#### Serial Format

```
REZ-{BRAND_PREFIX}-{PRODUCT_CODE}-{RANDOM_12_CHARS}

Example: REZ-ABC-P1-X7K9M2N4P6Q8
```

#### Verify API Response

```typescript
interface VerifyResponse {
  success: boolean;
  valid: boolean;
  isGenuine: boolean;
  serial: string;
  product: { id, name };
  brand: { id, name };
  scanCount: number;
  firstScanAt: string;
  reward: { amount, coinType };
  karma: { earned, total, level, multiplier, tier };
  fraud: { score, decision, reasons };
}
```

---

### 8.2 adsqr

**Path:** `adsqr/`
**Stack:** Next.js, TypeScript, Supabase, PostgreSQL

#### Features

| Feature | File | Purpose |
|---------|------|---------|
| QR Scan | `src/app/api/scan/[slug]/route.ts` | Record scan |
| Fraud Detection | `src/lib/fraud/detection.ts` | Fraud checks |
| Karma Integration | `src/lib/karmaIntegration.ts` | qr_in signals |
| Coin Rewards | `src/lib/rewards/rezCoins.ts` | Coin credits |

#### Fraud Rules

| Rule | Threshold | Action |
|------|-----------|--------|
| Rapid Click | 30s | Flag |
| IP Flooding | 10/hour | Block |
| Bot Pattern | UA match | Flag |

---

## 9. WALLET & FINANCE SERVICES

### 9.1 rez-finance-service (if exists)

Search for finance-related services.

---

## 10. SHARED LIBRARIES

### 10.1 rez-shared

**Path:** `rez-shared/`
**Location:** In main repo or separate

#### Contents

| Type | Description |
|------|-------------|
| TypeScript Interfaces | Canonical types |
| Zod Schemas | Validation |
| FSM Helpers | State machines |
| Branded IDs | Type-safe IDs |
| Constants | Shared values |

#### Coin Types

```typescript
// Canonical coin type enum
enum CoinType {
  PROMO = 'promo'
  BRANDED = 'branded'
  PRIVE = 'prive'
  CASHBACK = 'cashback'
  REFERRAL = 'referral'
  REZ = 'rez'
}
```

---

## 11. BUSINESS LOGIC ANALYSIS

### 11.1 Where Business Logic Lives

| Business Rule | Current Location | Will Move To |
|---------------|----------------|-------------|
| Commission rates | Scattered | REE |
| Cashback % | Bill.ts | REE |
| Reward amounts | Each QR service | REE |
| Karma scoring | karmaEngine.ts | REE |
| Karma conversion | batchService.ts | REE |
| Loyalty tiers | loyalty/index.ts | REE |
| Fraud rules | Each service | REE |
| Rate limits | walletService.ts | REE |

### 11.2 Current Karma Flow

```
QR Scanned
    ↓
Service records karma signal (qr_in)
    ↓
Karma service updates profile
    ↓
Weekly batch: karma → REZ coins
    ↓
Wallet credits coins
```

### 11.3 Current Reward Flow

```
Action completed (scan, purchase, etc.)
    ↓
Service calculates reward amount
    ↓
Service credits coins to wallet
    ↓
Service sends event to Mind
    ↓
Service records karma (if applicable)
```

### 11.4 Current Cashback Flow

```
Bill uploaded
    ↓
OCR extracts data
    ↓
Fraud check
    ↓
Admin approves
    ↓
Bill.save() → post-save hook
    ↓
walletService.credit() → CASHBACK
    ↓
Send to Mind
    ↓
Record karma (NEW)
```

---

## 12. WHAT REE WILL REPLACE

### 12.1 Replacements

| Current | Replacement |
|---------|-------------|
| `verify-service/src/lib/rewards/` | REE `rewardService.ts` |
| `verify-service/src/lib/fraud/` | REE `fraudEngine.ts` |
| `adsqr/src/lib/karmaIntegration.ts` | REE `karmaService.ts` |
| `backend/services/karmaIntegration.ts` | REE `karmaService.ts` |
| `backend/services/mindIntegration.ts` | REE Event Engine |
| `wallet-service/expiryJob.ts` | REE `expiryProcessor.ts` |
| `karma-service/src/engines/karmaEngine.ts` | REE core |
| `karma-service/src/services/batchService.ts` | REE `conversionService.ts` |
| `Bill.ts` cashback logic | REE `cashbackService.ts` |
| `loyalty/index.ts` | REE `loyaltyService.ts` |

### 12.2 REE API (Future)

```typescript
// Query API (for services)
POST /api/query/commission   // Calculate commission
POST /api/query/cashback    // Calculate cashback
POST /api/query/reward      // Calculate reward
POST /api/query/karma      // Calculate karma
POST /api/query/loyalty   // Get loyalty status
POST /api/query/evaluate   // Evaluate all rules

// Event API (for ingestion)
POST /api/events           // Ingest event
GET  /api/events/:id      // Get event
POST /api/events/replay   // Replay event

// Admin API (for CRUD)
POST /api/admin/rules      // Create rule
GET  /api/admin/rules      // List rules
PUT  /api/admin/rules/:id  // Update rule
DELETE /api/admin/rules/:id // Delete rule

// Simulation API
POST /api/simulate/rule   // Simulate rule change
GET  /api/simulate/results/:id // Get results
```

---

## 13. INTEGRATION GAPS

### 13.1 Missing Connections

| From | To | Gap |
|------|-----|-----|
| verify-service | karma-service | Direct karma recording |
| adsqr | karma-service | Direct karma recording |
| social-impact | Mind | Event tracking |
| Bill upload | Mind | Partial |
| All QR services | REE | Not built yet |

### 13.2 Data Silos

| Data | Location | Accessible By |
|------|---------|---------------|
| Karma Profile | karma-service | Limited |
| Wallet Balance | wallet-service | Limited |
| User Profile | auth-service | Limited |
| Transaction History | wallet-service | Partial |
| Intent Data | intent-predictor | Limited |

### 13.3 Recommended Integrations

1. **REE → All Services**: Single source of truth for business rules
2. **Profile Unification**: Link KarmaProfile to User
3. **Real-time Updates**: WebSocket for balance changes
4. **Expiry Notifications**: Alert users before coins expire
5. **Unified Analytics**: Aggregate data across services

---

## APPENDIX: FILE PATHS QUICK REFERENCE

### Consumer App
```
/ReZ Full App/rez-app-consumer/
├── app/scan.tsx
├── app/bill-upload-enhanced.tsx
├── app/bill-payment.tsx
├── app/recharge.tsx
├── contexts/WalletContext.tsx
└── services/api/socialImpact.ts
```

### Merchant App
```
/ReZ Full App/rez-app-merchant/
├── services/api/brandedCoins.ts
├── services/api/socialImpact.ts
└── app/social-impact/[id]/scan.tsx
```

### Backend
```
/ReZ Full App/rezbackend/rez-backend-master/src/
├── services/coinService.ts
├── services/walletService.ts
├── services/karmaIntegration.ts
├── services/mindIntegration.ts
├── services/socialImpactService.ts
├── models/Wallet.ts
├── models/Bill.ts
├── models/SocialImpactEnrollment.ts
└── routes/
```

### Karma Service
```
/ReZ Full App/rez-karma-service/
├── src/engines/karmaEngine.ts
├── src/engines/verificationEngine.ts
├── src/services/batchService.ts
└── src/models/KarmaProfile.ts
```

### Wallet Service
```
/ReZ Full App/rez-wallet-service/
├── src/services/walletService.ts
├── src/models/Wallet.ts
├── src/models/LedgerEntry.ts
└── src/jobs/expiryJob.ts
```

### Verify Service
```
/ReZ Full App/verify-service/
├── src/lib/karma.ts
├── src/lib/mind.ts
├── src/lib/wallet.ts
├── src/lib/serial/
└── src/app/api/verify/route.ts
```

### AdsQR
```
/ReZ Full App/adsqr/
├── src/app/api/scan/[slug]/route.ts
├── src/lib/karmaIntegration.ts
└── src/lib/fraud/detection.ts
```

---

## DOCUMENT INFO

**Version:** 1.0
**Created:** 2026-05-04
**Purpose:** Comprehensive audit for REE planning
