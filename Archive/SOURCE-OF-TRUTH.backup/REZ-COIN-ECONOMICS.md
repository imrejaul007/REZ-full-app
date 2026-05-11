# REZ Coin Economics - Complete Specification

**Last Updated:** 2026-05-04
**Status:** Final Design

---

## Executive Summary

ReZ has **5 parallel coin economies**:

| Coin | Purpose | Funded By | Used Where |
|------|---------|-----------|-----------|
| **REZ** | Platform currency | Merchant commission | Everywhere (except some) |
| **BRANDED** | Merchant loyalty | Merchant | Same merchant only |
| **PROMO** | Discounts | Admin/Marketing | Transaction discount |
| **PRIVE** | Premium rewards | Merchant | Universal (even finance) |
| **KARMA** | Impact economy | Campaign | Karma app → REZ conversion |

---

## 1. REZ Coins

### 1.1 How Users Earn REZ

```
Merchant Transaction (e.g., ₹100 order)
         │
         ▼
    Commission = 15% (₹15)
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
   Platform keeps = 5%                    User earns = 10%
   (₹5)                                  (₹10 REZ coins)
                                               │
                                 ┌──────────────┴──────────────┐
                                 ▼                              ▼
                          Default = 5%                  Social Sharing = 5%
                          (₹5 REZ)                    (₹5 REZ)
```

### 1.2 REZ Earning Sources

| Source | Percentage | Notes |
|--------|-----------|--------|
| **Transaction Cashback** | 5% | Default, admin configurable |
| **Social Sharing** | 5% | Only with verified engagement |
| **Referral Bonus** | Fixed amount | Per successful referral |

### 1.3 REZ Rules

| Rule | Value | Notes |
|------|-------|-------|
| **Usage Cap** | No cap | Default behavior |
| **Finance/Recharge** | Limited | Can restrict |
| **Expiry** | Never | REZ doesn't expire |
| **Admin Control** | Full | Via admin dashboard |
| **AI Control** | ReZ Mind | Dynamic adjustment |

### 1.4 Social Sharing Protection

**Problem:** Without protection, users will create fake accounts and spam share.

**Solution:**

```typescript
interface SocialSharingReward {
  // Must have minimum engagement
  minViews: 10;           // Minimum 10 views
  minClicks: 2;           // Minimum 2 clicks
  minShares: 1;            // Must be actual share

  // Rate limiting
  maxRewardsPerDay: 3;    // Max 3 rewards/day
  cooldownMinutes: 60;     // 1 hour between shares

  // Verification
  verifiedShareOnly: true; // Must be real share
  platformCheck: ['twitter', 'facebook', 'instagram', 'whatsapp'];
}

interface AbusePrevention {
  // Device fingerprinting
  deviceLimit: 2;          // Max 2 accounts per device

  // IP limiting
  ipMaxAccounts: 3;        // Max 3 accounts per IP

  // Velocity check
  maxSharesPerHour: 5;     // Flag if exceeded
  maxSharesPerDay: 20;      // Block if exceeded
}
```

---

## 2. BRANDED Coins

### 2.1 How Users Earn Branded Coins

| Source | Example | Branded Coins Earned |
|--------|---------|-------------------|
| **Review after transaction** | 5-star review | 10-50 coins |
| **Campaign participation** | Flash sale | Campaign-defined |
| **Loyalty milestone** | 10th visit | 100 coins |
| **Special events** | Brand anniversary | Event-defined |

### 2.2 Branded Coin Flow

```
Merchant creates campaign
         │
         ▼
    ReZ Admin approves
         │
         ▼
   Budget allocated
   (e.g., 10,000 coins)
         │
         ▼
    Campaign active
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
   User purchases                        User leaves review
         │                                         │
         ▼                                         ▼
   Earn branded coins                   Earn branded coins
   (auto-credit)                      (after approval)
```

### 2.3 Branded Coin Rules

| Rule | Value | Notes |
|------|-------|-------|
| **Usage** | Same merchant only | Cannot transfer |
| **Expiry** | 180 days | Default, configurable |
| **Cap** | No cap | Earn as much as campaign allows |
| **Conversion** | No | Cannot convert to REZ |
| **Admin Approval** | Required | Before campaign goes live |

### 2.4 Branded Coin Config

```typescript
interface BrandedCoinConfig {
  // Campaign settings
  campaignName: string;
  merchantId: string;

  // Earning rules
  earnTriggers: {
    transaction: {
      enabled: boolean;
      percent: number;        // % of transaction
      maxCoins: number;      // Max per transaction
    };
    review: {
      enabled: boolean;
      amounts: {
        1: number;          // 1-star = X coins
        2: number;
        3: number;
        4: number;
        5: number;          // 5-star = most coins
      };
      minChars: number;      // Minimum review length
    };
    referral: {
      enabled: boolean;
      perReferral: number;   // Coins per successful referral
    };
  };

  // Budget
  totalBudget: number;       // Total coins in campaign
  dailyCap: number;         // Max coins per day
  perUserCap: number;       // Max coins per user

  // Approval
  requiresApproval: boolean;
  autoApproveReviews: boolean; // Skip admin for reviews

  // Expiry
  expiryDays: number;        // Default: 180
}
```

---

## 3. PROMO Coins

### 3.1 How Promo Coins Work

Promo coins are **discount currency** - they reduce transaction amount.

```
Order Total: ₹500
         │
         ▼
   Promo coins used: 100 coins
   (Rate: 1 coin = ₹0.50)
         │
         ▼
   Discount: ₹50
         │
         ▼
   Final payment: ₹450
```

### 3.2 Promo Coin Rules

| Rule | Value | Notes |
|------|-------|-------|
| **Purpose** | Discount only | Cannot cash out |
| **Expiry** | 90 days | Default |
| **Max Redemption** | Campaign-defined | e.g., ₹100 max discount |
| **Per Transaction** | Campaign-defined | e.g., 20% max discount |
| **Who Decides** | Admin + Marketing | Campaign creator |
| **Finance** | Cannot use | Not for bill pay/recharge |

### 3.3 Promo Coin Config

```typescript
interface PromoCoinConfig {
  // Campaign
  name: string;
  createdBy: 'admin' | 'marketing';
  approvedBy: string;           // Admin ID

  // Discount rules
  discount: {
    type: 'percent' | 'fixed';
    value: number;               // e.g., 10% or ₹50
    maxDiscount: number;        // Cap: e.g., ₹100
    minOrderValue: number;     // Min order: e.g., ₹200
  };

  // Redemption
  maxPerTransaction: number;    // Max coins per transaction
  maxTotalRedemption: number;  // Max coins user can use
  maxRedemptionsPerUser: number; // Times user can use

  // Validity
  startDate: Date;
  endDate: Date;
  expiryDays: number;           // After earning

  // Applicability
  applicableTo: {
    allOrders: boolean;
    categories?: string[];      // Or specific categories
    merchants?: string[];       // Or specific merchants
    users?: string[];          // Or specific users (VIP)
  };

  // Stack
  stackableWithOffers: boolean; // Can combine with other offers
}
```

---

## 4. PRIVE Coins

### 4.1 How Prive Coins Work

Prive = Premium + Universal. These are **elite rewards** with universal utility.

```
Merchant creates Prive campaign
         │
         ▼
    ReZ Admin approves
         │
         ▼
   User earns Prive coins
         │
         ▼
   Can use EVERYWHERE
   (including finance & recharge)
```

### 4.2 Prive Coin Rules

| Rule | Value | Notes |
|------|-------|-------|
| **Usage** | Universal | Even in finance, bill pay |
| **Minimum Use** | Required | Must use min amount per transaction |
| **Expiry** | 365 days | Longer than others |
| **Cap** | Merchant-defined | e.g., max ₹500 per transaction |
| **Approval** | Admin required | Premium tier |

### 4.3 Prive Coin Config

```typescript
interface PriveCoinConfig {
  // Campaign
  name: string;
  merchantId: string;

  // Earnings
  earnTriggers: {
    milestonePurchase: {
      amount: number;         // e.g., ₹5000 spent
      coins: number;          // e.g., 100 Prive coins
    };
    vipTier: {
      enabled: boolean;
      tiers: string[];       // Which tiers qualify
    };
  };

  // Redemption rules
  redemption: {
    universal: true;           // Can use everywhere
    minUsePerTransaction: number;  // Must use at least this much
    maxUsePerTransaction: number; // Max per transaction
    maxUsePerDay: number;     // Daily cap
  };

  // Finance compatibility
  financeEnabled: true;      // CAN be used in finance
  rechargeEnabled: true;      // CAN be used in recharge

  // Expiry
  expiryDays: number;         // Default: 365
}
```

---

## 5. KARMA Coins

### 5.1 How Karma Economy Works

```
Campaign Organizer (Merchant/Brand)
         │
         ▼
    Allocates Karma Budget
    (e.g., 100,000 karma coins)
         │
         ▼
    Campaign active
         │
         ▼
    Users earn karma based on:
    - Participation
    - Karma Score
    - Engagement quality
         │
         ▼
    ┌────────────────────────┐
    │  CONVERSION RATE       │
    │  20 Karma = 1 REZ Coin │
    └────────────────────────┘
         │
         ▼
    User converts Karma → REZ
         │
         ▼
    REZ credited to wallet
```

### 5.2 Karma Coin Rules

| Rule | Value | Notes |
|------|-------|-------|
| **App** | Karma app only | Cannot earn elsewhere |
| **Conversion** | 20 Karma = 1 REZ | Admin configurable |
| **Daily Conversion Cap** | 100 REZ | Max conversion per day |
| **Weekly Conversion Cap** | 500 REZ | Max conversion per week |
| **Budget Control** | Campaign-defined | Limited allocation |
| **Dynamic Rate** | Based on supply | ReZ Mind adjusts |

### 5.3 Karma Conversion Controls

**Problem:** Unchecked conversion creates platform liability.

**Solution:**

```typescript
interface KarmaConversionConfig {
  // Base rate
  baseRate: 20;              // 20 karma = 1 REZ

  // Dynamic adjustments (ReZ Mind)
  dynamicRate: {
    enabled: true;
    minRate: 10;              // Best rate: 10 karma = 1 REZ
    maxRate: 50;              // Worst rate: 50 karma = 1 REZ
    adjustmentBasedOn: 'supply' | 'demand' | 'merit';
  };

  // Caps
  caps: {
    dailyREZCap: 100;          // Max 100 REZ/day
    weeklyREZCap: 500;        // Max 500 REZ/week
    lifetimeCap: 10000;       // Max 10,000 REZ total
  };

  // Approval thresholds
  approvalRequired: {
    enabled: true;
    minKarma: 100;           // Need 100 karma to convert
    minScore: 500;           // Need 500 karma score
    dailyLimit: 50;          // Auto-approve up to 50 REZ
  };

  // Conversion fee (optional)
  platformFee: {
    enabled: false;
    percent: 0;              // 0% fee by default
  };
}
```

### 5.4 Karma Earning Triggers

```typescript
interface KarmaEarnConfig {
  triggers: {
    eventParticipation: {
      basePoints: 10;        // Per event
      completionBonus: 5;    // If completed
      qualityBonus: {
        verified: 10;         // Verified attendance
        reviewed: 5;          // Left review
        shared: 3;           // Shared on social
      };
    };

    dailyCheckin: {
      points: 2;             // Per day
      streakBonus: {
        7: 10,               // 7-day streak = +10
        30: 50,              // 30-day streak = +50
      };
    };

    socialEngagement: {
      karmaShare: 5;         // Share karma action
      karmaSupport: 2;        // Support someone's karma
      karmaHost: 20;         // Host a karma event
    };

    impactActions: {
      volunteering: 15,        // Per hour
      donationMatch: 10,       // Per ₹100 donated
      sustainability: 5,     // Green actions
    };
  };

  // Budget allocation
  budget: {
    totalCampaign: number;      // Total karma for campaign
    dailyDistribution: number; // Max per day
    perUserCap: number;       // Max per user
  };
}
```

---

## 6. Economic Attribution

**Critical for scaling - every coin flow must be tracked.**

```typescript
interface EconomicFlow {
  _id: string;

  // What
  coinType: 'rez' | 'branded' | 'promo' | 'prive' | 'karma';
  amount: number;

  // Who funded
  fundedBy: {
    type: 'merchant' | 'platform' | 'brand' | 'admin';
    id: string;
    name: string;
  };

  // Who bears liability
  liabilityOn: {
    type: 'merchant' | 'platform';
    id: string;
  };

  // Risk metrics
  risk: {
    conversionRisk: number;     // 0-1, chance of conversion to platform cost
    redemptionRisk: number;    // 0-1, chance of redemption
    abuseRisk: number;        // 0-1, chance of abuse
  };

  // Flow details
  flow: {
    source: string;           // 'transaction', 'review', 'campaign'
    sourceId: string;        // Transaction ID, campaign ID, etc.
    userId: string;
    merchantId: string;
  };

  // Timestamps
  earnedAt: Date;
  expiresAt?: Date;
  redeemedAt?: Date;
  convertedAt?: Date;

  // Status
  status: 'active' | 'expired' | 'redeemed' | 'converted';
}
```

### 6.1 Liability Tracking

```typescript
interface LiabilityReport {
  period: { start: Date; end: Date };

  // By coin type
  byCoinType: {
    [coinType: string]: {
      totalIssued: number;
      totalRedeemed: number;
      totalExpired: number;
      pendingLiability: number;  // Issued but not redeemed
    };
  };

  // By merchant (for branded coins)
  byMerchant: {
    [merchantId: string]: {
      funded: number;
      liability: number;
      redeemedByUsers: number;
    };
  };

  // Platform exposure
  platformExposure: {
    rezConversionLiability: number;  // If all karma converts
    promoDiscountGiven: number;
    maxPriveUsage: number;
  };
}
```

---

## 7. Admin Controls

### 7.1 Global Settings (Platform)

```typescript
interface AdminCoinSettings {
  // REZ Coins
  rez: {
    transactionPercent: number;     // Default: 5%
    socialSharePercent: number;    // Default: 5%
    maxTransactionPercent: number; // Cap: e.g., 20%
    financeEnabled: boolean;       // Can use in finance
    rechargeEnabled: boolean;      // Can use in recharge
  };

  // Karma
  karma: {
    conversionRate: number;         // Default: 20 karma = 1 REZ
    dailyREZCap: number;          // Default: 100
    weeklyREZCap: number;         // Default: 500
    minScoreToConvert: number;    // Default: 500
  };

  // Platform limits
  limits: {
    maxCoinValue: number;         // Max ₹ value per coin
    minRedemptionValue: number;    // Min ₹ to redeem
    dailyGlobalCap: number;      // Platform daily cap
  };
}
```

### 7.2 Merchant-Specific Settings

```typescript
interface MerchantCoinSettings {
  merchantId: string;

  // REZ coins from this merchant
  rez: {
    transactionPercent: number;      // Can be 0-20%
    socialShareEnabled: boolean;
    socialSharePercent: number;
  };

  // Branded coins
  branded: {
    enabled: boolean;
    campaigns: BrandedCoinConfig[];
  };

  // Prive coins
  prive: {
    enabled: boolean;
    config: PriveCoinConfig;
  };

  // Karma campaign
  karma: {
    enabled: boolean;
    budget: number;
    conversionRate: number;         // Can adjust base rate
  };

  // Commission
  commission: {
    platformPercent: number;         // Platform share
    cashbackPercent: number;        // User cashback
    socialPercent: number;         // Social reward
  };
}
```

---

## 8. Quick Reference Matrix

| Aspect | REZ | BRANDED | PROMO | PRIVE | KARMA |
|--------|-----|---------|-------|-------|-------|
| **Earned from** | Transaction | Review/Campaign | Campaign | Milestone | Karma App |
| **Funded by** | Merchant commission | Merchant | Admin/Marketing | Merchant | Campaign |
| **Used where** | Anywhere | Same merchant | Transaction | Anywhere | → REZ only |
| **Expiry** | Never | 180 days | 90 days | 365 days | No expiry |
| **Cap** | No (except fin.) | No cap | Max discount | Min use req. | Conversion cap |
| **Finance OK** | No | No | No | **Yes** | No |
| **Admin approval** | Global only | Campaign | Campaign | Required | Campaign |
| **ReZ Mind** | Yes | Suggest | Suggest | Suggest | Yes |

---

## 9. Example Flows

### Flow 1: Restaurant Order

```
User orders ₹500 at Restaurant ABC
         │
         ▼
    Merchant commission: 15% = ₹75
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
   Platform: ₹25 (5%)                     User: ₹50 REZ (10%)
                                               │
                                 ┌──────────────┴──────────────┐
                                 ▼                              ▼
                          Cashback: ₹25                 Social: ₹25
                          (REZ coins)                   (REZ coins)
```

### Flow 2: Review with Branded Coins

```
User completes ₹200 order
         │
         ▼
    Leaves 5-star review
         │
         ▼
    Restaurant ABC campaign: 5-star = 20 branded coins
         │
         ▼
    User earns: 20 ABC Branded Coins
         │
         ▼
    Can only use at Restaurant ABC
    (No expiry: campaign-defined)
```

### Flow 3: Karma Event

```
Merchant runs Karma campaign
Budget: 10,000 karma coins
Campaign: Beach Cleanup

User participates
         │
         ▼
    Earns 50 karma coins
         │
         ▼
    Karma Score: 650 (Active tier)
         │
         ▼
    Conversion rate: 20 karma = 1 REZ
         │
         ▼
    User converts 100 karma → 5 REZ coins
         │
         ▼
    REZ credited to wallet
    (Can use anywhere)
```

### Flow 4: Promo Discount

```
User has 500 PROMO coins
Campaign: 10% off, max ₹100

Order: ₹500
         │
         ▼
    Max discount: ₹100 (500 × ₹0.20)
         │
         ▼
    Final: ₹400 (₹100 saved)
         │
         ▼
    PROMO coins consumed: 500
```

---

## DOCUMENT INFO

**Version:** 1.0
**Last Updated:** 2026-05-04
**Status:** Final Design
