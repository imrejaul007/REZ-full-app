# REZ COIN SYSTEM - COMPLETE AUDIT DOCUMENTATION

**Last Updated:** 2026-05-04
**Status:** Complete Audit

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Coin Types](#2-coin-types)
3. [Wallet Architecture](#3-wallet-architecture)
4. [Coin Flows by Source](#4-coin-flows-by-source)
5. [Karma-Koin System](#5-karma-koin-system)
6. [Cashback System](#6-cashback-system)
7. [Branded Coin System](#7-branded-coin-system)
8. [Promo/Private/Referral Coins](#8-promoprivate-referral-coins)
9. [Coin Usage & Redemption](#9-coin-usage--redemption)
10. [Expiry Rules](#10-expiry-rules)
11. [Karma Effect Matrix](#11-karma-effect-matrix)
12. [Integration Gaps](#12-integration-gaps)
13. [File Reference](#13-file-reference)

---

## 1. OVERVIEW

### Coin System Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REZ COIN ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      EARN COINS                                        │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   Social    │  │  Bill      │  │   Ads QR    │  │  ReZ Now    │ │   │
│  │  │   Impact    │  │  Upload    │  │  Scanning   │  │  Ordering   │ │   │
│  │  │  Events     │  │  Cashback  │  │             │  │  Loyalty    │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │   │
│  │         │                │                │                │         │   │
│  │         ▼                ▼                ▼                ▼         │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │                    WALLET SERVICE                            │ │   │
│  │  │         All coin balances + Transaction history              │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  │                              │                                       │   │
│  │         ┌────────────────────┼────────────────────┐               │   │
│  │         ▼                    ▼                    ▼               │   │
│  │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐     │   │
│  │  │   REDEEM    │      │   CONVERT   │      │   EXPIRE    │     │   │
│  │  │  Products   │      │  Branded→REZ│      │  Unused     │     │   │
│  │  │  Vouchers   │      │  Promo→REZ  │      │  Coins      │     │   │
│  │  └─────────────┘      └─────────────┘      └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COIN TYPES

### 2.1 All 6 Coin Types

| Coin Type | Display Name | Karma Affected | Expiry | Primary Use |
|-----------|-------------|----------------|--------|-------------|
| **REZ** | REZ Coins | Yes (both) | Never | Primary currency |
| **BRANDED** | Branded Coins | No | 180 days | Merchant loyalty |
| **CASHBACK** | Cashback | No | 365 days | Bill/purchase cashback |
| **PROMO** | Promo Coins | No | 90 days | Promotional bonuses |
| **PRIVE** | Prive Coins | No | 365 days | Premium tier |
| **REFERRAL** | Referral Bonus | No | 180 days | Referrals |

### 2.2 Coin Type Definitions

**Canonical Source:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-web-menu/rez-shared/src/constants/coins.ts`

```typescript
export enum CoinType {
  PROMO = 'promo'      // Promotional coins
  BRANDED = 'branded'  // Merchant-specific
  PRIVE = 'prive'      // Premium tier
  CASHBACK = 'cashback' // Cashback rewards
  REFERRAL = 'referral' // Referral bonuses
  REZ = 'rez'          // Primary coins
}
```

### 2.3 Karma Effect on Coins

| Coin Type | Karma Multiplier? | Karma Conversion? | Karma Direct Award? |
|-----------|------------------|-------------------|-------------------|
| **REZ** | Yes (2x at Platinum) | Yes (25-100%) | Yes (via conversion) |
| **BRANDED** | No | No | No |
| **CASHBACK** | No | No | No |
| **PROMO** | No | No | No |
| **PRIVE** | No | No | No |
| **REFERRAL** | No | No | No |

---

## 3. WALLET ARCHITECTURE

### 3.1 Wallet Model

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/src/models/Wallet.ts`

```typescript
interface IWallet {
  user: Types.ObjectId;
  
  balance: {
    total: number;        // Total balance
    available: number;    // Spendable balance
    pending: number;      // Pending transactions
    cashback: number;     // Cashback scalar (non-expiring)
  };
  
  coins: ICoinBalance[];  // Main coin array
  /*
  ICoinBalance {
    coinType: CoinType;
    amount: number;
    earnedDate: Date;
    expiryDate?: Date;
  }
  */
  
  brandedCoins: Array<{
    merchantId: Types.ObjectId;
    merchantName: string;
    merchantLogo?: string;
    merchantColor?: string;
    amount: number;
    earnedDate: Date;
    expiresAt?: Date;     // 6 months
    isActive: boolean;
  }>;
  
  currency: 'REZ_COIN' | 'RC' | 'NC' | 'INR';
  
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    transactionCount: number;
    totalRefunds: number;
    totalTopups: number;
    totalWithdrawals: number;
  };
}
```

### 3.2 Wallet Service API

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/src/services/walletService.ts`

| Method | Coin Types | Purpose |
|--------|-----------|---------|
| `credit()` | All types | Add coins to wallet |
| `debit()` | All types | Remove coins from wallet |
| `getBalance()` | All types | Get balance by coin type |
| `addBrandedCoins()` | BRANDED | Add merchant-specific coins |
| `convertBrandedToRez()` | BRANDED → REZ | Convert branded to REZ |
| `checkExpiry()` | All types | Check and handle expired coins |

### 3.3 Transaction Model

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/src/models/LedgerEntry.ts`

```typescript
interface ILedgerEntry {
  userId: Types.ObjectId;
  type: 'CREDIT' | 'DEBIT';
  coinType: CoinType;
  amount: number;
  source: string;           // e.g., 'social_impact', 'bill_upload', 'karma_conversion'
  description: string;
  referenceId?: string;     // Reference to source (event, bill, etc.)
  referenceModel?: string;   // e.g., 'Bill', 'Program'
  balanceAfter: number;
  expiresAt?: Date;
}
```

---

## 4. COIN FLOWS BY SOURCE

### 4.1 ReZ Verify (Product Authentication)

**Files:**
- `verify-service/src/lib/wallet.ts`
- `verify-service/src/lib/rewards/issuer.ts`

**Flow:**
```
User scans product QR
  ↓
verify-service validates serial
  ↓
runFraudCheck() - fraud detection
  ↓
getKarmaMultiplier() - get user's karma tier
  ↓
issueReward() with karma multiplier
  ↓
creditCoins() to wallet
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **REZ** | Base × karma multiplier | Yes (2x at Platinum) |
| **BRANDED** | If brand offers | No |

**Example:**
```
Base reward: 50 REZ
User tier: Platinum (2.0x)
Result: 50 × 2.0 = 100 REZ coins
```

---

### 4.2 Social Impact Events

**Files:**
- `rezbackend/.../services/socialImpactService.ts`
- `rezbackend/.../services/coinService.ts`

**Flow:**
```
User completes event
  ↓
socialImpactService.completeParticipation()
  ↓
awardCoins() - REZ coins via coinService
  ↓
Award BRANDED coins if sponsor exists
  ↓
updateUserImpactStats()
```

**Coins Credited:**
| Coin Type | Source | Karma Affected |
|-----------|--------|----------------|
| **REZ** | Platform reward | Yes (base coins) |
| **BRANDED** | Sponsor budget | No |

**Example:**
```
Event rewards: 100 REZ + 50 Branded (Sponsor)
Platform adds: REZ coins from platform budget
Sponsor adds: BRANDED from sponsor wallet
```

---

### 4.3 Bill Upload / Cashback

**Files:**
- `rezbackend/.../models/Bill.ts` (post-save hook)
- `rez-app-consumer/services/billVerificationService.ts`

**Flow:**
```
User uploads bill
  ↓
OCR extracts data
  ↓
Fraud check
  ↓
Admin approves
  ↓
Bill.save() triggers post-save hook
  ↓
walletService.credit() - CASHBACK coins
  ↓
sendMindEvent() - Mind integration
  ↓
recordKarmaCheckIn() - Karma signal
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **CASHBACK** | bill_amount × cashback_percentage | No |

**Example:**
```
Bill amount: ₹500
Merchant cashback: 5%
Result: 500 × 5% = 25 CASHBACK coins
```

**Note:** CASHBACK coins go to `balance.cashback` (scalar), NOT to `coins` array.

---

### 4.4 Ads QR Scanning

**Files:**
- `adsqr/src/app/api/scan/[slug]/route.ts`
- `adsqr/src/lib/rewards/rezCoins.ts`

**Flow:**
```
User scans ad QR
  ↓
Fraud check
  ↓
Insert coin transaction
  ↓
increment_coins_used (campaign budget)
  ↓
awardScanKarma() - karma points
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **REZ** | campaign.scan_reward | Yes (via karma conversion later) |

---

### 4.5 Menu/Profile QR (Loyalty)

**Files:**
- `rez-now/lib/loyalty/index.ts`
- `rez-now/lib/api/order.ts`

**Flow:**
```
User scans Menu QR
  ↓
Places order
  ↓
recordVisit() after successful order
  ↓
Coins credited based on reward rules
  ↓
recordKarmaForVisit() - karma points
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **REZ** | baseCashbackPercent × order_amount | Yes (via karma conversion) |
| **BRANDED** | If merchant offers | No |

---

### 4.6 Merchant-Branded Coins

**Files:**
- `rez-app-merchant/services/api/brandedCoins.ts`
- `rezbackend/.../merchantroutes/coins.ts`

**Flow:**
```
Merchant awards branded coins
  ↓
Check merchant wallet balance
  ↓
Deduct from merchant wallet
  ↓
Add to user brandedCoins[]
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **BRANDED** | Merchant-defined | No |

**Constraints:**
- Max 1000 coins per award
- 100 awards per hour per merchant

---

### 4.7 Promo Code Redemption

**Files:**
- `rezbackend/.../controllers/promoCodeController.ts`

**Flow:**
```
User enters promo code
  ↓
Validate code (exists, not expired, not used)
  ↓
Mark as used
  ↓
creditCoins() - PROMO coins
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **PROMO** | Promo code defined | No |

---

### 4.8 Mobile Recharge / BBPS Bill Payment

**Files:**
- `rez-app-consumer/app/recharge.tsx`
- `rez-app-consumer/app/bill-payment.tsx`

**Flow:**
```
User makes recharge/payment
  ↓
Transaction succeeds
  ↓
Credit promo coins based on config
```

**Coins Credited:**
| Coin Type | Amount | Karma Affected |
|-----------|--------|----------------|
| **PROMO** | order × earning_rate | No |

**Config:**
- Base earning: 5% of order value
- Minimum order: ₹200
- Maximum: 500 coins per order

---

## 5. KARMA-KOIN SYSTEM

### 5.1 Karma Levels

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-service/src/engines/karmaEngine.ts`

| Level | Name | Active Karma Range | Badge |
|-------|------|-------------------|-------|
| **L1** | Bronze | 0 - 499 | Bronze |
| **L2** | Silver | 500 - 1,999 | Silver |
| **L3** | Gold | 2,000 - 4,999 | Gold |
| **L4** | Platinum | 5,000+ | Platinum |

### 5.2 Karma to Koin (REZ) Conversion

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-service/src/services/batchService.ts`

| Level | Conversion Rate | 100 Karma = X Coins | Weekly Cap Reached At |
|-------|-----------------|---------------------|---------------------|
| **L1** | 25% | 25 coins | 1,200 karma |
| **L2** | 50% | 50 coins | 600 karma |
| **L3** | 75% | 75 coins | 400 karma |
| **L4** | 100% | 100 coins | 300 karma |

**Weekly Cap:** 300 coins (L4 users max out at 300 karma/week)

### 5.3 Karma Multiplier (QR Flow)

**Location:** `verify-service/src/lib/karma.ts`, `rez-now/lib/loyalty/index.ts`

This is DIFFERENT from karma conversion. It affects BASE reward:

| Tier | Multiplier | Base 50 = Result |
|------|------------|------------------|
| **Bronze** | 1.0x | 50 coins |
| **Silver** | 1.25x | 62.5 coins |
| **Gold** | 1.5x | 75 coins |
| **Platinum** | 2.0x | 100 coins |

### 5.4 Two Types of Karma Effect

| Type | When | What | Coin Affected |
|------|------|------|---------------|
| **Multiplier** | Real-time (QR scan) | Boosts base reward | REZ only |
| **Conversion** | Weekly batch job | Converts karma → REZ | REZ only |

### 5.5 Karma Signals by QR Type

| QR System | Signal | Weight | Points |
|-----------|--------|--------|--------|
| **ReZ Verify** | qr_in | 0.30 | 5 pts |
| **Social Impact** | qr_in + qr_out | 0.60 | 30-60 pts |
| **Ads QR** | ad_qr_scan | N/A | 5-50 pts |
| **Bill Upload** | qr_in | 0.30 | 5 pts |
| **Menu/Profile** | qr_in | 0.30 | 5 pts |

---

## 6. CASHBACK SYSTEM

### 6.1 Cashback Coin Storage

**Note:** CASHBACK coins are stored DIFFERENTLY from other coins.

```typescript
// In Wallet model:
balance: {
  total: number;        // All coins combined
  available: number;     // Spendable
  pending: number;       // Pending
  cashback: number;      // ← CASHBACK stored here as scalar
};

coins: ICoinBalance[];   // REZ, PROMO, PRIVE, REFERRAL (with expiry)
```

### 6.2 Cashback Calculation

**Formula:**
```typescript
cashbackCoins = floor(billAmount × (cashbackPercentage / 100))
```

**Example:**
```
Bill: ₹500
Merchant cashback: 5%
Result: floor(500 × 0.05) = 25 CASHBACK coins
```

### 6.3 Cashback Sources

| Source | Trigger | Coin Type |
|--------|---------|-----------|
| **Bill Upload** | Admin approves bill | CASHBACK |
| **Store Purchase** | Order completed | CASHBACK |
| **Loyalty Reward** | Cashback on orders | CASHBACK |

### 6.4 Cashback vs REZ Coins

| Aspect | CASHBACK | REZ |
|--------|----------|-----|
| **Earned From** | Bill uploads, purchases | All QR flows |
| **Karma Affected** | No | Yes |
| **Expiry** | 365 days | Never |
| **Storage** | `balance.cashback` scalar | `coins[]` array |
| **Redemption** | Any merchant | Any merchant |
| **Conversion** | No | Yes (karma) |

---

## 7. BRANDED COIN SYSTEM

### 7.1 Branded Coin Structure

```typescript
// In Wallet model:
brandedCoins: Array<{
  merchantId: Types.ObjectId;
  merchantName: string;      // Display name
  merchantLogo?: string;     // Brand logo
  merchantColor?: string;    // Brand color
  amount: number;
  earnedDate: Date;
  expiresAt?: Date;          // 6 months from earn
  isActive: boolean;
}>;
```

### 7.2 Branded Coin Sources

| Source | Trigger | Merchant Control? |
|--------|---------|-------------------|
| **Social Impact Events** | Event completed with sponsor | Sponsor sets budget |
| **Merchant Loyalty** | Order at participating merchant | Merchant settings |
| **Merchant Award** | Direct award via merchant app | Merchant decides |

### 7.3 Branded → REZ Conversion

**Location:** `rez-wallet-service/src/services/walletService.ts`

```typescript
async convertBrandedToRez(merchantId: string, amount: number) {
  // Convert branded coins to REZ at configured rate
  // Rate: 1 BRANDED = X REZ (merchant-defined, default 1:1)
}
```

**Example:**
```
User has: 100 ABC Brand coins (merchant rate: 0.8)
Conversion: 100 × 0.8 = 80 REZ coins
```

### 7.4 Branded Coin Expiry

- **Default:** 6 months (180 days) from earn date
- **Check:** Automatic via `checkExpiry()` job
- **Action:** Deduct expired coins from wallet

---

## 8. PROMO/PRIVE/REFERRAL COINS

### 8.1 PROMO Coins

| Aspect | Details |
|--------|---------|
| **Earned From** | Promo codes, bill payments, recharges, campaigns |
| **Expiry** | 90 days |
| **Karma Affected** | No |
| **Redemption** | Any merchant |
| **Conversion** | No |

**Config:** `/Users/rejaulkarim/Documents/ReZ Full App/rezbackend/.../config/promoCoins.config.ts`
- Base earning: 5% of order value
- Minimum: ₹200
- Maximum: 500 per transaction

### 8.2 PRIVE Coins

| Aspect | Details |
|--------|---------|
| **Earned From** | Premium tier programs, VIP campaigns |
| **Expiry** | 365 days |
| **Karma Affected** | No |
| **Redemption** | Partner merchants only |
| **Conversion** | No |

### 8.3 REFERRAL Coins

| Aspect | Details |
|--------|---------|
| **Earned From** | Successful referrals |
| **Expiry** | 180 days |
| **Karma Affected** | No |
| **Redemption** | Any merchant |
| **Conversion** | No |

**Typical Amount:** Flat bonus (e.g., 100 REFERRAL coins per successful referral)

---

## 9. COIN USAGE & REDEMPTION

### 9.1 Where Coins Can Be Used

| Coin Type | Store Orders | Recharge | Withdrawal | Transfer |
|-----------|-------------|-----------|------------|----------|
| **REZ** | Yes | Yes | Yes | Yes |
| **BRANDED** | Issuing merchant only | No | No | No |
| **CASHBACK** | Yes | Yes | No | No |
| **PROMO** | Yes | Yes | No | No |
| **PRIVE** | Partner merchants | No | No | No |
| **REFERRAL** | Yes | Yes | No | No |

### 9.2 Redemption Flow

```
User selects items
  ↓
Checkout
  ↓
Show coin balance (by type)
  ↓
User selects coin type to use
  ↓
walletService.debit()
  ↓
Create order
```

---

## 10. EXPIRY RULES

### 10.1 Expiry by Coin Type

| Coin Type | Default Expiry | Config Location |
|-----------|---------------|-----------------|
| **REZ** | Never | N/A |
| **BRANDED** | 180 days | `expiresAt` field |
| **CASHBACK** | 365 days | Environment variable |
| **PROMO** | 90 days | `promoCoins.config.ts` |
| **PRIVE** | 365 days | Environment variable |
| **REFERRAL** | 180 days | Environment variable |

### 10.2 Expiry Check Job

**Location:** `rez-wallet-service/src/jobs/expiryJob.ts`

```typescript
// Runs daily
async checkExpiry() {
  // Find coins with expiresAt < now
  // Deduct expired coins
  // Log to transaction history
}
```

---

## 11. KARMA EFFECT MATRIX

### 11.1 Complete Karma → Coin Mapping

| QR Source | Coins Earned | Karma Effect | Coin Type | Conversion |
|-----------|-------------|--------------|-----------|------------|
| **ReZ Verify** | 5-50 base | Multiplier (2x) | REZ | Later (batch) |
| **Social Impact** | 30-100 base | Multiplier | REZ | Later (batch) |
| **Ads QR** | 5-50 base | Direct karma | REZ | Later (batch) |
| **Bill Upload** | Varies (5-25%) | No | CASHBACK | N/A |
| **Menu/Profile** | 1-10% base | Multiplier | REZ | Later (batch) |
| **Branded Coins** | Merchant-defined | No | BRANDED | Manual |
| **Promo Codes** | Code-defined | No | PROMO | N/A |
| **Referral** | Flat bonus | No | REFERRAL | N/A |

### 11.2 Real-Time vs Batch

| Type | Timing | Mechanism | Coin Type |
|------|--------|-----------|-----------|
| **Multiplier** | Real-time | Base × tier multiplier | REZ |
| **Karma Points** | Real-time | Signal recorded | Karma score |
| **Conversion** | Weekly batch | karma × conversion rate | REZ |

### 11.3 Example Flows

**Flow 1: ReZ Verify (Platinum user)**
```
1. User scans product QR
2. Base reward: 50 REZ
3. Get karma multiplier: 2.0x (Platinum)
4. Apply multiplier: 50 × 2.0 = 100 REZ (immediate)
5. Record karma signal: +5 karma points
6. Weekly: 5 karma × 100% = 5 REZ (batch)
Total: 105 REZ coins
```

**Flow 2: Bill Upload**
```
1. User uploads ₹500 bill
2. Admin approves
3. Cashback: 5% = 25 CASHBACK
4. Record karma signal: +5 karma points
5. NO karma multiplier (not REZ)
6. Weekly: 5 karma × 100% = 5 REZ (batch)
Total: 25 CASHBACK + 5 REZ (later)
```

---

## 12. INTEGRATION GAPS

### 12.1 Missing Karma Integration

| Coin Type | Karma Multiplier | Karma Conversion | Status |
|-----------|-----------------|-----------------|--------|
| **REZ** | Yes | Yes | ✅ Implemented |
| **BRANDED** | No | No | ⏳ Could add |
| **CASHBACK** | No | No | ⏳ Future |
| **PROMO** | No | No | ❌ Not planned |
| **PRIVE** | No | No | ❌ Not planned |
| **REFERRAL** | No | No | ❌ Not planned |

### 12.2 Missing Mind Integration

| Coin Type | Mind Event | Intent Capture | Status |
|-----------|-----------|----------------|--------|
| **REZ** | Yes | Yes | ✅ Implemented |
| **BRANDED** | Partial | Partial | ⚠️ In progress |
| **CASHBACK** | Yes | Yes | ✅ Implemented |
| **PROMO** | No | No | ❌ Not planned |
| **PRIVE** | No | No | ❌ Not planned |
| **REFERRAL** | No | No | ❌ Not planned |

### 12.3 Gaps Identified

1. **Karma → BRANDED coins** - No karma multiplier for branded coins
2. **Mind → Promo/Private coins** - No intent tracking for these coins
3. **Expiry notification** - Users not notified before coin expiry
4. **Conversion UI** - No UI for converting BRANDED → REZ
5. **Coin balance display** - Consumer app may not show all coin types

---

## 13. FILE REFERENCE

### 13.1 Wallet Service

```
rez-wallet-service/
├── src/
│   ├── models/
│   │   ├── Wallet.ts           ← Wallet model with all coin types
│   │   └── LedgerEntry.ts      ← Transaction history
│   ├── services/
│   │   └── walletService.ts    ← credit/debit/convert operations
│   └── jobs/
│       └── expiryJob.ts        ← Coin expiry handling
```

### 13.2 Karma Service

```
rez-karma-service/
├── src/
│   ├── engines/
│   │   ├── karmaEngine.ts      ← Levels, conversion rates
│   │   └── verificationEngine.ts ← QR verification
│   ├── services/
│   │   └── batchService.ts      ← Weekly karma→coins conversion
│   └── routes/
│       └── karmaRoutes.ts       ← API endpoints
```

### 13.3 Backend Coin Operations

```
rezbackend/rez-backend-master/src/
├── services/
│   ├── coinService.ts          ← awardCoins, deductCoins
│   ├── karmaIntegration.ts     ← Karma recording
│   └── mindIntegration.ts       ← Mind events
├── models/
│   └── Bill.ts                 ← Cashback credit
├── merchantroutes/
│   └── coins.ts                ← Merchant branded coins
└── controllers/
    └── promoCodeController.ts  ← Promo coin redemption
```

### 13.4 Frontend

```
rez-app-consumer/
├── contexts/
│   └── WalletContext.tsx       ← Wallet state
├── services/
│   └── billVerificationService.ts ← Bill → cashback
└── app/
    └── bill-upload-enhanced.tsx ← Upload UI

rez-now/lib/
├── loyalty/
│   └── index.ts               ← Loyalty → REZ coins + karma
└── rewards/
    └── rezCoins.ts            ← Ads QR rewards
```

---

## SUMMARY

### Coin System Quick Reference

| Coin | Earn | Expiry | Karma | Redeem |
|------|------|--------|-------|--------|
| **REZ** | All QR + conversion | Never | Both | Anywhere |
| **BRANDED** | Social Impact + Merchant | 180d | No | Merchant only |
| **CASHBACK** | Bill Upload | 365d | No | Anywhere |
| **PROMO** | Promo codes, recharge | 90d | No | Anywhere |
| **PRIVE** | VIP programs | 365d | No | Partners |
| **REFERRAL** | Referrals | 180d | No | Anywhere |

### Karma Quick Reference

| Level | Multiplier | Conversion | Weekly Cap |
|-------|------------|------------|-----------|
| Bronze (L1) | 1.0x | 25% | 125 coins |
| Silver (L2) | 1.25x | 50% | 250 coins |
| Gold (L3) | 1.5x | 75% | 300 coins |
| Platinum (L4) | 2.0x | 100% | 300 coins |

---

**Document Version:** 1.0
**Last Updated:** 2026-05-04
**Next Review:** 2026-05-11
