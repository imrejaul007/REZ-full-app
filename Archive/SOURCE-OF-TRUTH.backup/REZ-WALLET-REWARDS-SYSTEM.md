# REZ WALLET & REWARDS SYSTEM - COMPLETE AUDIT

**Last Updated:** 2026-05-04
**Status:** Complete Audit

---

## TABLE OF CONTENTS

1. [Wallet Architecture](#1-wallet-architecture)
2. [Transaction System](#2-transaction-system)
3. [User Profile System](#3-user-profile-system)
4. [Karma Profile System](#4-karma-profile-system)
5. [Rewards & Scoring System](#5-rewards--scoring-system)
6. [Business Rules & Limits](#6-business-rules--limits)
7. [Integration Points](#7-integration-points)
8. [Gaps & Recommendations](#8-gaps--recommendations)

---

## 1. WALLET ARCHITECTURE

### 1.1 Service Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ WALLET SERVICE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       HTTP API (Express)                              │   │
│  │   Middleware: Auth │ Rate Limiting │ Tracing │ Logging │ CORS        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌────────────────────────────────┼────────────────────────────────────┐   │
│  │                                ▼                                        │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────────┐ │   │
│  │  │   WalletService │  │MerchantWallet  │  │     BullMQ Worker      │ │   │
│  │  │     (66KB)     │  │   Service      │  │   (Event Processing)   │ │   │
│  │  │                │  │    (23KB)      │  │                        │ │   │
│  │  │ • creditCoins  │  │ • creditOrder  │  │ • Notifications        │ │   │
│  │  │ • debitCoins   │  │ • withdrawal   │  │ • Analytics            │ │   │
│  │  │ • getBalance   │  │ • settlement   │  │ • Cache invalidation   │ │   │
│  │  │ • convert      │  │ • refund       │  │ • Merchant settlement  │ │   │
│  │  └─────────────────┘  └─────────────────┘  └────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌────────────────────────────────┼────────────────────────────────────┐   │
│  │                          DATA LAYER                                      │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌─────────────────────────┐    │   │
│  │  │   MongoDB    │  │    Redis    │  │     Redis Pub/Sub       │    │   │
│  │  │              │  │             │  │                         │    │   │
│  │  │ • Wallet     │  │ • Cache     │  │ • coin-credit events   │    │   │
│  │  │ • Ledger     │  │ • Rate      │  │ • intent-graph        │    │   │
│  │  │ • CoinTx     │  │   Limits    │  │ • wallet-events       │    │   │
│  │  └──────────────┘  └─────────────┘  └─────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express 4.x with TypeScript |
| Database | MongoDB via Mongoose 8.x |
| Cache/Queue | Redis via IORedis + BullMQ |
| Validation | Zod 3.x |
| Logging | Winston 3.x + Sentry |
| Async | BullMQ worker |

### 1.3 API Endpoints

#### Consumer Wallet (`/wallet/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/wallet` | JWT | Get wallet summary |
| GET | `/api/wallet/balance` | JWT | Get all coin balances |
| GET | `/api/wallet/transactions` | JWT | List transactions |
| POST | `/api/wallet/credit` | Service | Credit coins |
| POST | `/api/wallet/debit` | Service | Debit coins |
| POST | `/api/wallet/convert` | JWT | Convert BRANDED→REZ |
| GET | `/api/wallet/expiry-preview` | JWT | Preview expiring coins |

#### Merchant Wallet (`/merchant-wallet/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/merchant-wallet` | Merchant | Get merchant wallet |
| POST | `/api/merchant-wallet/topup` | Merchant | Top up wallet |
| POST | `/api/merchant-wallet/withdraw` | Merchant | Withdraw to bank |
| POST | `/api/merchant-wallet/settle` | Service | Auto-settlement |

#### Internal Routes (`/internal/*`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/internal/wallet/credit` | Service Key | Internal credit |
| POST | `/internal/wallet/debit` | Service Key | Internal debit |
| GET | `/internal/wallet/:userId` | Service Key | Get user wallet |

### 1.4 Wallet Model

```typescript
interface IWallet {
  user: Types.ObjectId;
  
  balance: {
    total: number;        // All coins combined
    available: number;     // Spendable
    pending: number;      // Pending transactions
    cashback: number;     // Cashback scalar (non-expiring)
  };
  
  coins: ICoinBalance[];   // Main coin array
  /*
  ICoinBalance {
    coinType: CoinType;   // 'rez' | 'promo' | 'prive' | 'cashback' | 'referral'
    amount: number;
    earnedDate: Date;
    expiryDate?: Date;
  }
  */
  
  brandedCoins: IBrandedCoin[];
  /*
  IBrandedCoin {
    merchantId: Types.ObjectId;
    merchantName: string;
    merchantLogo?: string;
    merchantColor?: string;
    amount: number;
    earnedDate: Date;
    expiresAt?: Date;     // 6 months
    isActive: boolean;
  }
  */
  
  categoryBalances: Map<string, number>;  // Per-category spending
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

---

## 2. TRANSACTION SYSTEM

### 2.1 Transaction Models

| Model | Purpose | Immutability |
|-------|---------|--------------|
| **TransactionLedger** | Financial transactions (INR/COIN) | Immutable |
| **LedgerEntry** | Double-entry bookkeeping | Immutable |
| **CoinTransaction** | Coin-specific operations | Mutable |
| **TransactionAuditLog** | Before/after snapshots | Immutable |
| **MerchantLiability** | Merchant reward tracking | Mutable |
| **TrialCoinWallet** | Trial coin separate | Mutable |

### 2.2 Transaction Types

| Type | Source | Direction |
|------|--------|-----------|
| **earned** | QR scans, bill upload | CREDIT |
| **spent** | Order redemption | DEBIT |
| **expired** | Auto-expiry job | DEBIT |
| **refunded** | Order cancellation | CREDIT |
| **bonus** | Admin/marketing | CREDIT |
| **branded_award** | Merchant award | CREDIT |

### 2.3 Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TRANSACTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Request ──► Idempotency Check ──► Validation ──► Balance Check        │
│                                    │                  │                │
│                                    ▼                  ▼                │
│                              Rate Limit      Sufficient Balance?       │
│                                    │                  │                │
│                                    ▼                  ▼ NO              │
│                              Business Rules    ──► REJECT              │
│                                    │                                     │
│                                    ▼ YES                                 │
│  ┌────────────────────────────────┼────────────────────────────────┐  │
│  │                                ▼                                 │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │  │
│  │  │  MongoDB     │    │ Redis Pub/Sub│    │ BullMQ Worker│   │  │
│  │  │              │    │              │    │              │   │  │
│  │  │ • Wallet     │    │ • Events     │    │ • Notify     │   │  │
│  │  │ • Ledger     │    │ • Invalidate │    │ • Analytics  │   │  │
│  │  │ • Audit Log  │    │   Cache      │    │ • Settle     │   │  │
│  │  └──────────────┘    └──────────────┘    └──────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    ▼                                     │
│                              Response                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Double-Entry Bookkeeping

```typescript
interface ILedgerEntry {
  pairId: string;           // Links debit/credit pair
  accountType: AccountType; // user_wallet | platform_fees | platform_float |
                             // merchant_wallet | expired_pool
  accountId: string;
  direction: 'debit' | 'credit';
  amount: number;
  coinType: CoinType;
  operationType: string;
  referenceId?: string;
  referenceModel?: string;
  reversalReferenceId?: string;
  yearMonth: string;        // Partition key
  createdAt: Date;
}
```

### 2.5 Refund Handling

```typescript
// Refund flow for order cancellation
async refundOrder(orderId: string) {
  // 1. Find original transaction
  // 2. Check refund window (7 days)
  // 3. Credit same coin type used originally
  // 4. Create reversal ledger entries
  // 5. Update statistics
  // 6. Send notification
}
```

---

## 3. USER PROFILE SYSTEM

### 3.1 User Model

**Location:** `rez-auth-service/src/models/User.ts`

```typescript
interface IUser {
  _id: ObjectId;
  phoneNumber: string;      // Required, unique
  email?: string;
  name?: string;
  profileImage?: string;
  role: 'user' | 'merchant' | 'admin';
  isActive: boolean;
  isSuspended: boolean;
  referralCode: string;
  referralCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 UserProfile Model

**Location:** `rez-auth-service/src/models/UserProfile.ts`

```typescript
interface IUserProfile {
  userId: ObjectId;
  phone: string;
  
  // Vertical-specific stats (hotel, restaurant, fashion, etc.)
  verticals: IVerticalStats[];
  
  // Aggregated stats
  totalSpend: number;
  transactionCount: number;
  totalLifetimeSpend: number;
  averageOrderValue: number;
  
  // Engagement
  firstActivity: Date;
  lastActivity: Date;
  daysActive: number;
  lifetimeValue: number;
  engagementScore: number;
  appOpenFrequency: number;
  
  // Preferences
  favoriteCategories: string[];
  favoriteMerchants: string[];
  preferredPaymentMethod: string;
  notificationsEnabled: boolean;
}
```

---

## 4. KARMA PROFILE SYSTEM

### 4.1 Karma Profile Model

**Location:** `rez-karma-service/src/models/KarmaProfile.ts`

```typescript
interface IKarmaProfile {
  userId: ObjectId;
  
  // Karma metrics
  lifetimeKarma: number;      // Total karma ever earned
  activeKarma: number;        // Karma subject to decay
  level: 'L1' | 'L2' | 'L3' | 'L4';
  
  // Activity tracking
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  
  // Trust & reputation
  trustScore: number;         // 0-100
  
  // Achievements
  badges: IBadge[];
  
  // History
  levelHistory: ILevelHistoryEntry[];
  conversionHistory: IConversionHistoryEntry[];
  
  // Weekly tracking
  thisWeekKarmaEarned: number;
  weekOfLastKarmaEarned: Date;
  
  // Composite score
  karmaScore: {
    base: number;           // 300
    impact: number;          // 0-250
    relativeRank: number;    // 0-180
    trust: number;          // 0-100
    momentum: number;        // 0-70
    total: number;          // 300-900
  };
  
  // Recent activity
  recentActivity: IRecentActivity[];
  
  lastActivityAt: Date;
}
```

### 4.2 Karma Levels

| Level | Name | Active Karma | Badge | Color |
|-------|------|-------------|-------|-------|
| **L1** | Bronze | 0-499 | Bronze | #CD7F32 |
| **L2** | Silver | 500-1,999 | Silver | #C0C0C0 |
| **L3** | Gold | 2,000-4,999 | Gold | #FFD700 |
| **L4** | Platinum | 5,000+ | Platinum | #E5E4E2 |

### 4.3 UserImpactStats Model

**Location:** `rezbackend/.../models/UserImpactStats.ts`

```typescript
interface IUserImpactStats {
  user: ObjectId;
  
  // Event stats
  totalEventsRegistered: number;
  totalEventsCompleted: number;
  totalEventsAttended: number;
  
  // Impact categories
  livesImpacted: number;
  treesPlanted: number;
  hoursContributed: number;
  mealsServed: number;
  
  // Coin earnings
  totalRezCoinsEarned: number;
  totalBrandCoinsEarned: number;
  
  // Streaks
  currentStreak: number;
  longestStreak: number;
}
```

---

## 5. REWARDS & SCORING SYSTEM

### 5.1 Reward Types

| Reward Type | Source | Karma Range | Coin Conversion |
|------------|--------|------------|-----------------|
| **Event Completion** | Social Impact | Variable | 25-100% |
| **Micro-Actions** | Daily tasks | 3-50 karma | 25-100% |
| **Badge Bonuses** | Achievements | 5-200 karma | 25-100% |
| **Mission Rewards** | Missions | 5-30 karma | 25-100% |
| **Streak Rewards** | 7/30-day | 10-50 karma | 25-100% |
| **Visit Milestones** | Loyalty | Fixed | N/A |

### 5.2 Visit Milestone Rewards

| Visits | REZ Coins |
|--------|-----------|
| 7 | 50 |
| 30 | 200 |
| 100 | 500 |

### 5.3 Karma Score Calculation (300-900 scale)

```
Total Score = Base(300) + Impact(0-250) + RelativeRank(0-180) + Trust(0-100) + Momentum(0-70)
```

| Component | Range | Description |
|-----------|-------|-------------|
| Base | 300 | Fixed minimum |
| Impact | 0-250 | Based on lifetime karma |
| RelativeRank | 0-180 | Percentile ranking |
| Trust | 0-100 | Verified activities |
| Momentum | 0-70 | Recent activity trend |

### 5.4 Scoring Algorithms

#### Loyalty Score
```typescript
loyaltyScore = (totalTransactions * 0.3) + 
               (uniqueMerchants * 0.2) + 
               (recencyScore * 0.3) + 
               (engagementScore * 0.2)
```

#### Trust Score
```typescript
trustScore = (verifiedEvents / totalEvents * 0.4) + 
             (noShowRate * 0.3) + 
             (consistency * 0.3)
```

### 5.5 Badge System

**Badge Types:**
| Category | Badges |
|---------|--------|
| **Social Impact** | First Event, 10 Events, 50 Events, Tree Planter, Volunteer |
| **Loyalty** | First Visit, Regular, Power User, Elite |
| **Exploration** | First Store, 10 Stores, Foodie, Shopper |
| **Engagement** | Early Bird, Night Owl, Weekend Warrior |

---

## 6. BUSINESS RULES & LIMITS

### 6.1 Coin Earning Rules

| QR Type | Base Reward | Karma Multiplier | Coin Type |
|---------|-----------|-----------------|-----------|
| **ReZ Verify** | 50 REZ | 1.0-2.0x | REZ |
| **Social Impact** | 30-100 REZ | 1.0-2.0x | REZ + BRANDED |
| **Ads QR** | 5-50 REZ | Via conversion | REZ |
| **Bill Upload** | 5-25% | No | CASHBACK |
| **Menu/Profile** | 1-10% | 1.0-2.0x | REZ |
| **Branded Award** | Merchant-defined | No | BRANDED |
| **Promo Code** | Code-defined | No | PROMO |
| **Referral** | 100 REFERRAL | No | REFERRAL |

### 6.2 Redemption Limits

| Limit Type | Value | Config Location |
|-----------|-------|----------------|
| **Daily Coin Cap** | 1,000 coins | `DAILY_COIN_CAP` |
| **Weekly Coin Cap** | 3,000 coins | `WEEKLY_COIN_CAP` |
| **Per-Transaction Min** | 10 coins | `MIN_REDEMPTION` |
| **Per-Transaction Max** | 5,000 coins | `MAX_REDEMPTION` |
| **Merchant Daily Limit** | 50,000 coins | Per merchant |

### 6.3 Rate Limiting

| Operation | Limit | Window |
|-----------|-------|--------|
| **Coin Credit** | 100/hour | User |
| **Coin Debit** | 50/hour | User |
| **Conversion** | 10/day | User |
| **Brands Award** | 100/hour | Merchant |

### 6.4 Budget Controls

| Budget Type | Check | Action on Insufficient |
|-------------|-------|----------------------|
| **Campaign Budget** | Before credit | Reject |
| **Sponsor Budget** | Before credit | Partial/reject |
| **Merchant Float** | Before debit | Reject |

### 6.5 Fraud Prevention

| Check | Trigger | Action |
|-------|---------|--------|
| **Duplicate** | Same serial+user+campaign | Reject |
| **Velocity** | >10/hour | Flag |
| **Impossible Travel** | >500km in 1hr | Flag |
| **Negative Balance** | Any | Reject |

---

## 7. INTEGRATION POINTS

### 7.1 Service Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WALLET SERVICE DEPENDENCIES                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
│  │  Auth Svc   │      │  Karma Svc  │      │  MongoDB    │            │
│  │             │      │             │      │             │            │
│  │ • JWT verify│      │ • Get level │      │ • Wallet    │            │
│  │ • User ID   │      │ • Get mult  │      │ • Ledger   │            │
│  └──────┬──────┘      └──────┬──────┘      └─────────────┘            │
│         │                    │                                        │
│         ▼                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                    WALLET SERVICE                             │       │
│  └─────────────────────────────────────────────────────────────┘       │
│         │                    │                    │                       │
│         ▼                    ▼                    ▼                       │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐            │
│  │   Redis     │      │   BullMQ    │      │    Mind     │            │
│  │             │      │             │      │             │            │
│  │ • Cache    │      │ • Workers   │      │ • Events   │            │
│  │ • Rate    │      │ • Queue     │      │ • Intent   │            │
│  └─────────────┘      └─────────────┘      └─────────────┘            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Internal API Keys

| Service | Key | Permissions |
|---------|-----|-------------|
| **verify-service** | `INTERNAL_SERVICE_KEY` | Credit coins |
| **adsqr** | `INTERNAL_SERVICE_KEY` | Credit coins |
| **rezbackend** | `INTERNAL_SERVICE_KEY` | All operations |
| **social-impact** | `INTERNAL_SERVICE_KEY` | Credit coins |

### 7.3 Event Publishing

```typescript
// Redis Pub/Sub events
interface WalletEvent {
  type: 'coin_credited' | 'coin_debited' | 'coin_expired';
  userId: string;
  coinType: string;
  amount: number;
  balance: number;
  timestamp: Date;
}
```

---

## 8. GAPS & RECOMMENDATIONS

### 8.1 Identified Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **No real-time balance WebSocket** | Users don't see updates | Medium |
| **Limited mobile app wallet UI** | Poor UX | High |
| **No coin gift/transfer** | Missing social feature | Medium |
| **Expiry notifications missing** | Users lose coins | High |
| **No fiat-to-coin gateway** | Can't buy coins | High |
| **Karma profile not linked in User** | Disconnected data | Medium |
| **Batch job failures not retried** | Lost conversions | Medium |

### 8.2 Recommendations

1. **Add WebSocket** for real-time balance updates
2. **Build wallet UI** in consumer app
3. **Add gift/transfer** feature
4. **Implement expiry notifications** (7 days, 3 days, 1 day before)
5. **Add fiat gateway** integration (Razorpay, Stripe)
6. **Link KarmaProfile** to User model
7. **Add retry logic** to batch jobs

### 8.3 Missing Test Coverage

| Component | Coverage | Priority |
|-----------|----------|----------|
| Wallet credit/debit | Partial | High |
| Branded conversion | Missing | Medium |
| Expiry handling | Missing | Medium |
| Rate limiting | Missing | Medium |
| Idempotency | Missing | High |

---

## FILE REFERENCE

### Wallet Service
```
rez-wallet-service/
├── src/
│   ├── models/
│   │   ├── Wallet.ts           ← Main wallet model
│   │   ├── LedgerEntry.ts      ← Double-entry ledger
│   │   └── CoinTransaction.ts   ← Coin transactions
│   ├── services/
│   │   ├── walletService.ts    ← Core operations
│   │   └── merchantWallet.ts   ← Merchant operations
│   ├── routes/
│   │   ├── wallet.ts           ← Consumer routes
│   │   ├── merchant-wallet.ts  ← Merchant routes
│   │   └── internal.ts         ← Internal routes
│   └── jobs/
│       └── expiryJob.ts        ← Expiry processing
```

### Karma Service
```
rez-karma-service/
├── src/
│   ├── models/
│   │   └── KarmaProfile.ts     ← Karma profile model
│   ├── engines/
│   │   ├── karmaEngine.ts     ← Level/conversion
│   │   ├── karmaScoreEngine.ts ← 300-900 score
│   │   └── verificationEngine.ts ← QR verification
│   └── services/
│       └── batchService.ts     ← Weekly conversion
```

### Backend
```
rezbackend/rez-backend-master/src/
├── models/
│   ├── UserImpactStats.ts      ← Impact tracking
│   ├── CoinTransaction.ts       ← Backend coin tx
│   └── Bill.ts                 ← Cashback credit
├── services/
│   ├── coinService.ts          ← awardCoins
│   ├── walletService.ts        ← Wallet operations
│   └── karmaIntegration.ts     ← Karma recording
└── routes/
    ├── wallet.ts               ← Wallet routes
    └── coins.ts               ← Merchant coins
```

---

**Document Version:** 1.0
**Last Updated:** 2026-05-04
**Next Review:** 2026-05-11
