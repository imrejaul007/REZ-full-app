# REE - Complete Specification

**Last Updated:** 2026-05-04
**Status:** Complete Architecture

---

## Overview

**REE (ReZ Economic Engine)** is the **single source of truth** for:

1. **Business Rules** - Commission, cashback, rewards, karma
2. **Feature Flags** - What's enabled for who
3. **Coin Economics** - All 5 coin systems
4. **Fraud Detection** - Abuse prevention
5. **Subscription Control** - Merchant/user tier features

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REE (Central Brain)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Business Rules │  │ Feature Flags  │  │  Coin Economics │ │
│  │                 │  │                 │  │                  │ │
│  │  • Commission   │  │  • User tiers  │  │  • REZ coins   │ │
│  │  • Cashback     │  │  • Merchant    │  │  • Branded     │ │
│  │  • Rewards     │  │    tiers       │  │  • Promo       │ │
│  │  • Karma       │  │  • Features   │  │  • Prive       │ │
│  │  • Loyalty     │  │  • Entitlements│  │  • Karma       │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                     │                    │                   │
│           └─────────────────────┼────────────────────┘                   │
│                               │                                        │
│           ┌──────────────────┼──────────────────────┐                │
│           │                  ▼                      │                │
│           │  ┌─────────────────────────────────┐  │                │
│           │  │         RULE ENGINE              │  │                │
│           │  │                                 │  │                │
│           │  │  • Evaluate conditions          │  │                │
│           │  │  • Execute actions              │  │                │
│           │  │  • Resolve conflicts            │  │                │
│           │  │  • Track attribution           │  │                │
│           │  └─────────────────────────────────┘  │                │
│           │                                       │                  │
│           └───────────────────┬───────────────────┘                  │
│                               │                                      │
│  ┌───────────────────────────┼─────────────────────────────────────┐ │
│  │                           ▼                                     │ │
│  │  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │ Fraud Engine │  │ Event Engine │  │ Simulation  │              │ │
│  │  │              │  │             │  │   Engine   │              │ │
│  │  │ • Velocity   │  │  • Ingest   │  │ • What-if  │              │ │
│  │  │ • Patterns   │  │  • Process  │  │ • Impact   │              │ │
│  │  │ • Anomaly    │  │  • Store   │  │ • ROI      │              │ │
│  │  └──────────────┘  └─────────────┘  └────────────┘              │ │
│  │                                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Business Rules

### 1.1 Rule Types

| Type | Purpose | Examples |
|------|---------|----------|
| **commission** | Platform/merchant split | 15% commission, 5% platform |
| **cashback** | User earnings | 5% cashback on transaction |
| **reward** | Incentives | First purchase bonus, referral bonus |
| **karma** | Impact scoring | +10 karma for volunteering |
| **loyalty** | Tier benefits | Gold gets 10% extra |
| **fraud_check** | Risk rules | Block >10 scans/hour |

### 1.2 Rule Structure

```typescript
interface BusinessRule {
  _id: string;
  ruleType: RuleType;

  // Category
  category: string;           // 'user', 'merchant', 'transaction'
  subCategory?: string;       // 'commission', 'cashback'

  // Conditions (when rule applies)
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';

  // Actions (what happens)
  actions: RuleAction[];

  // Priority & Conflict
  priority: number;
  conflictStrategy: 'FIRST' | 'HIGHEST' | 'CUMULATIVE';

  // Versioning
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
}
```

### 1.3 Example Rules

**Merchant Commission Rule:**
```json
{
  "ruleType": "commission",
  "category": "merchant",
  "subCategory": "restaurant",
  "conditions": [
    { "field": "merchant.category", "operator": "eq", "value": "restaurant" }
  ],
  "conditionLogic": "AND",
  "actions": [
    {
      "actionType": "set_commission",
      "params": {
        "platformPercent": 5,
        "merchantPercent": 95
      }
    }
  ],
  "priority": 10,
  "isActive": true
}
```

**User Cashback Rule:**
```json
{
  "ruleType": "cashback",
  "category": "user",
  "subCategory": "transaction",
  "conditions": [
    { "field": "transaction.amount", "operator": "gte", "value": 100 },
    { "field": "user.tier", "operator": "in", "value": ["gold", "platinum"] }
  ],
  "conditionLogic": "AND",
  "actions": [
    {
      "actionType": "credit_coin",
      "params": {
        "coinType": "rez",
        "formula": "transaction.amount * 0.07"
      }
    }
  ],
  "priority": 20,
  "isActive": true
}
```

---

## 2. Feature Flags

### 2.1 Feature Control Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FEATURE CONTROL MATRIX                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER TIERS                      │ Starter │ Active │ Gold │ Platinum │
│  ───────────────────────────────┼────────┼────────┼──────┼────────── │
│  REZ Coins                      │   ✓    │   ✓   │  ✓   │    ✓     │
│  Cashback                       │   ✓    │   ✓   │  ✓   │    ✓     │
│  Social Sharing Rewards          │   ✓    │   ✓   │  ✓   │    ✓     │
│  Branded Coins                  │   ✓    │   ✓   │  ✓   │    ✓     │
│  Promo Coins                   │   ✓    │   ✓   │  ✓   │    ✓     │
│  Prive Coins                   │   ✗    │   ✗   │  ✗   │    ✓     │
│  Priority Support               │   ✗    │   ✓   │  ✓   │    ✓     │
│  Early Access Features          │   ✗    │   ✗   │  ✓   │    ✓     │
│  Exclusive Events               │   ✗    │   ✗   │  ✗   │    ✓     │
│  VIP Karma Events               │   ✗    │   ✗   │  ✗   │    ✓     │
│                                                                          │
│  MERCHANT TIERS                 │  Free  │Growth │ Pro  │ Enterprise │
│  ─────────────────────────────┼────────┼───────┼──────┼─────────── │
│  Basic POS                      │   ✓    │  ✓   │  ✓   │     ✓     │
│  QR Code Generation             │  100   │ 1000 │  ∞   │     ∞     │
│  Analytics Dashboard           │   ✗    │  ✓   │  ✓   │     ✓     │
│  Custom Branding               │   ✗    │  ✗   │  ✓   │     ✓     │
│  API Access                    │   ✗    │  ✗   │  ✓   │     ✓     │
│  Multi-Location               │   ✗    │  ✗   │  ✗   │     ✓     │
│  White Label                   │   ✗    │  ✗   │  ✗   │     ✓     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Feature Flag Types

```typescript
// User features
interface UserFeatureFlags {
  // Coin features
  canEarnRez: boolean;
  canEarnBranded: boolean;
  canEarnPromo: boolean;
  canEarnPrive: boolean;
  canConvertKarma: boolean;

  // Access features
  hasPrioritySupport: boolean;
  hasEarlyAccess: boolean;
  hasExclusiveEvents: boolean;

  // Limits
  maxSocialSharesPerDay: number;
  maxCashbackPercent: number;
}

// Merchant features
interface MerchantFeatureFlags {
  // Basic
  maxQRCodes: number;
  maxTransactionsPerMonth: number;
  hasAnalytics: boolean;

  // Advanced
  hasCustomBranding: boolean;
  hasAPI: boolean;
  hasMultiLocation: boolean;
  hasWhiteLabel: boolean;

  // Coins
  canCreateBrandedCoins: boolean;
  canRunPromoCampaigns: boolean;
  canRunKarmaCampaigns: boolean;
  commissionRate: number;
}
```

### 2.3 Feature Evaluation

```typescript
// Check if user has feature
async function hasFeature(
  userId: string,
  feature: string
): Promise<{ has: boolean; reason?: string }> {
  // Get user tier
  const user = await getUser(userId);
  const tier = user.subscriptionTier || 'starter';

  // Get feature flags from REE
  const flags = await ree.getFeatureFlags({
    type: 'user',
    tier
  });

  // Check specific feature
  const has = flags[feature];

  if (!has) {
    return {
      has: false,
      reason: `Feature ${feature} requires ${flags.requiredTier} tier`
    };
  }

  return { has: true };
}
```

---

## 3. Coin Economics (REE Controls)

### 3.1 5 Coin Types

| Coin | Purpose | Funded By | Usage | Expiry |
|------|---------|-----------|-------|--------|
| **REZ** | Platform currency | Merchant commission | Everywhere | Never |
| **BRANDED** | Merchant loyalty | Merchant | Same merchant | 180d |
| **PROMO** | Discounts | Admin/Marketing | Transaction | 90d |
| **PRIVE** | Premium rewards | Merchant | Universal | 365d |
| **KARMA** | Impact economy | Campaign | → REZ only | Never |

### 3.2 REZ Coin Split

```
Merchant Order: ₹100
         │
         ▼
    Commission = 15%
         │
         ├──────────────────────────────────┐
         │                                  │
         ▼                                  ▼
   Platform = 5%                     User = 10%
   (₹5)                              (₹10)
                                          │
                                 ┌────────┴────────┐
                                 ▼                      ▼
                          Cashback = 5%           Social = 5%
                          (₹5 REZ)              (₹5 REZ)
```

### 3.3 Coin Configs

```typescript
interface CoinConfig {
  coinType: CoinType;
  earningRules: EarningRule[];
  usageRules: UsageRule[];
  expiryDays: number;
  adminApproval: boolean;
}

// All coin configs controlled by REE
const COIN_CONFIGS: Record<CoinType, CoinConfig> = {
  REZ: {
    earningRules: [
      { source: 'transaction', percent: 5 },
      { source: 'social_share', percent: 5 }
    ],
    usageRules: [
      { type: 'universal' },
      { type: 'excluded', categories: ['finance', 'recharge'] }
    ],
    expiryDays: 0,
    adminApproval: false
  },
  BRANDED: {
    earningRules: [
      { source: 'review', amounts: { 5: 20 } },
      { source: 'campaign', formula: 'campaign.defined' }
    ],
    usageRules: [
      { type: 'same_merchant_only' }
    ],
    expiryDays: 180,
    adminApproval: true
  },
  PROMO: {
    earningRules: [
      { source: 'campaign', formula: 'campaign.defined' }
    ],
    usageRules: [
      { type: 'discount_only' },
      { type: 'max_discount', value: 100 }
    ],
    expiryDays: 90,
    adminApproval: true
  },
  PRIVE: {
    earningRules: [
      { source: 'milestone', amounts: 'merchant.defined' }
    ],
    usageRules: [
      { type: 'universal' },
      { type: 'finance_allowed' },
      { type: 'min_use', value: 10 }
    ],
    expiryDays: 365,
    adminApproval: true
  },
  KARMA: {
    earningRules: [
      { source: 'event', points: 'campaign.defined' },
      { source: 'volunteer', pointsPerHour: 15 }
    ],
    usageRules: [
      { type: 'conversion_only' },
      { type: 'conversion_rate', karmaPerRez: 20 }
    ],
    expiryDays: 0,
    adminApproval: false
  }
};
```

---

## 4. Subscription Tiers

### 4.1 User Tiers

| Tier | Earn Rate | Features | Social Sharing |
|------|-----------|----------|----------------|
| **Starter** | 5% + 5% | Basic | Limited |
| **Active** | 5% + 5% | + Priority support | +5 shares/day |
| **Gold** | 6% + 6% | + Early access | +10 shares/day |
| **Platinum** | 7% + 7% | + VIP events | Unlimited |

### 4.2 Merchant Tiers

| Tier | Price | Commission | QR Codes | Features |
|------|-------|------------|----------|----------|
| **Free** | ₹0 | 15% | 100/month | Basic POS |
| **Growth** | ₹299/mo | 12% | 1000/month | Analytics |
| **Pro** | ₹799/mo | 10% | Unlimited | API, Custom |
| **Enterprise** | ₹1999/mo | 8% | Unlimited | White label |

### 4.3 Subscription Config

```typescript
interface SubscriptionConfig {
  type: 'user' | 'merchant';

  tiers: Tier[];
  features: Feature[];
  pricing: PricingRule[];
}

const USER_SUBSCRIPTION: SubscriptionConfig = {
  type: 'user',
  tiers: [
    {
      name: 'starter',
      minSpend: 0,
      benefits: {
        cashbackPercent: 5,
        socialSharePercent: 5,
        maxSharesPerDay: 3,
        features: ['rez', 'branded', 'promo', 'cashback']
      }
    },
    {
      name: 'active',
      minSpend: 5000,
      benefits: {
        cashbackPercent: 5,
        socialSharePercent: 5,
        maxSharesPerDay: 5,
        features: ['rez', 'branded', 'promo', 'cashback', 'priority_support']
      }
    },
    {
      name: 'gold',
      minSpend: 25000,
      benefits: {
        cashbackPercent: 6,
        socialSharePercent: 6,
        maxSharesPerDay: 10,
        features: ['*', '-prive']
      }
    },
    {
      name: 'platinum',
      minSpend: 100000,
      benefits: {
        cashbackPercent: 7,
        socialSharePercent: 7,
        maxSharesPerDay: -1, // unlimited
        features: ['*'] // all features
      }
    }
  ]
};
```

---

## 5. REE API Endpoints

### 5.1 Admin Routes (REE Controls)

```
# Business Rules
POST   /api/admin/rules              # Create rule
GET    /api/admin/rules              # List rules
PUT    /api/admin/rules/:id          # Update rule
DELETE /api/admin/rules/:id          # Delete rule

# Feature Flags
POST   /api/admin/features/user       # Set user feature flags
POST   /api/admin/features/merchant  # Set merchant feature flags
GET    /api/admin/features/tier/:name # Get tier features

# Coin Configs
POST   /api/admin/coins/config       # Update coin config
GET    /api/admin/coins/:type       # Get coin config

# Subscriptions
POST   /api/admin/subs/user          # Update user tier
POST   /api/admin/subs/merchant     # Update merchant tier
GET    /api/admin/subs/:type/:id    # Get subscription
```

### 5.2 Query Routes (Services Call)

```
# Feature Check
POST   /api/query/features/user       # Check user features
POST   /api/query/features/merchant # Check merchant features

# Coin Calculations
POST   /api/query/cashback          # Calculate cashback
POST   /api/query/commission        # Calculate commission
POST   /api/query/karma            # Calculate karma
POST   /api/query/coin-discount    # Calculate promo discount

# Rule Evaluation
POST   /api/query/evaluate        # Evaluate all rules
```

### 5.3 Example Queries

**Check User Features:**
```json
POST /api/query/features/user
{
  "userId": "user_123",
  "features": ["hasPrive", "maxSocialShares"]
}

Response:
{
  "success": true,
  "data": {
    "hasPrive": false,
    "maxSocialShares": 5,
    "currentTier": "active",
    "requiredTier": "platinum"
  }
}
```

**Calculate Cashback:**
```json
POST /api/query/cashback
{
  "userId": "user_123",
  "amount": 500
}

Response:
{
  "success": true,
  "data": {
    "amount": 500,
    "cashbackPercent": 5,
    "cashbackAmount": 25,
    "coinType": "rez",
    "tier": "active"
  }
}
```

**Check Feature Access:**
```json
POST /api/query/features/merchant
{
  "merchantId": "merchant_456",
  "features": ["canCreateBrandedCoins", "commissionRate"]
}

Response:
{
  "success": true,
  "data": {
    "canCreateBrandedCoins": true,
    "commissionRate": 12,
    "tier": "growth"
  }
}
```

---

## 6. Integration with Profile Service

### 6.1 Profile Service ↔ REE

```
┌─────────────────┐         ┌─────────────────┐
│   Profile       │         │      REE        │
│   Service       │         │   (Central)     │
├─────────────────┤         ├─────────────────┤
│                 │         │                 │
│  User Profile   │◄──────►│  Feature Flags  │
│  (static data) │         │                 │
│                 │         │  Coin Configs   │
│  Preferences    │◄──────►│                 │
│  (cached)       │         │  Business Rules  │
│                 │         │                 │
│  Addresses      │         │  Subscription   │
│  Payment        │         │  Tiers         │
│                 │         │                 │
│                 │◄──────►│  Karma Scores  │
│                 │         │  (read-only)   │
└─────────────────┘         └─────────────────┘
```

### 6.2 Data Flow

```
User Action (scan QR)
         │
         ▼
┌─────────────────────────────────────┐
│          Profile Service              │
│                                     │
│  1. Get user tier (cached)          │
│  2. Get user ID                    │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│              REE                      │
│                                     │
│  1. Check feature flags             │
│     - canEarnRez? ✓                 │
│     - maxSocialShares? 5            │
│                                     │
│  2. Calculate cashback              │
│     - Based on tier: 5%            │
│     - Based on rules: +merchant%   │
│                                     │
│  3. Check fraud rules              │
│     - velocity check               │
│     - abuse prevention            │
│                                     │
│  4. Return:                       │
│     - cashbackAmount: 25           │
│     - coinType: rez                │
│     - karmaEarned: 5              │
└─────────────────────────────────────┘
```

---

## 7. Admin Dashboard (REE Controls)

### 7.1 What Admin Can Control

| Category | Settings |
|----------|----------|
| **User Tiers** | Create tiers, set benefits, pricing |
| **Merchant Tiers** | Create tiers, set commission, features |
| **Coin Economics** | Percentages, caps, expiry |
| **Feature Flags** | Enable/disable features per tier |
| **Business Rules** | Create, edit, version rules |
| **Karma** | Conversion rates, caps, earning triggers |
| **Fraud Rules** | Thresholds, actions, patterns |

### 7.2 Example Admin Actions

**Update User Tier Benefits:**
```json
POST /api/admin/features/user
{
  "tier": "gold",
  "benefits": {
    "cashbackPercent": 6,
    "socialSharePercent": 6,
    "maxSharesPerDay": 15,
    "features": ["*", "-prive"]
  }
}
```

**Update Coin Config:**
```json
POST /api/admin/coins/config
{
  "coinType": "rez",
  "earningRules": [
    { "source": "transaction", "percent": 6 },
    { "source": "social_share", "percent": 6 }
  ]
}
```

**Create New Business Rule:**
```json
POST /api/admin/rules
{
  "ruleType": "cashback",
  "category": "user",
  "conditions": [
    { "field": "user.tier", "operator": "eq", "value": "platinum" }
  ],
  "actions": [
    {
      "actionType": "credit_coin",
      "params": { "coinType": "rez", "formula": "amount * 0.07" }
    }
  ],
  "priority": 15,
  "effectiveFrom": "2026-06-01"
}
```

---

## 8. Summary

### REE Controls Everything

| Aspect | Controlled By REE | Notes |
|--------|-------------------|-------|
| Commission rates | Yes | Merchant tier + category |
| Cashback percentages | Yes | User tier + rules |
| Social sharing rewards | Yes | Limits + abuse prevention |
| Coin configs | Yes | All 5 coin types |
| Feature flags | Yes | Per tier |
| Karma settings | Yes | Rates, caps, triggers |
| Fraud rules | Yes | Velocity, patterns |
| Subscription tiers | Yes | User + merchant |
| User tier benefits | Yes | Full control |
| Merchant tier benefits | Yes | Full control |

### Profile Service Integration

| Profile Owns | REE Owns |
|--------------|----------|
| Name, avatar | User tier (read) |
| Preferences | Feature flags (query) |
| Addresses | Cashback rules (query) |
| Payment methods | Karma scores (read) |
| Cached tier info | Coin configs (query) |

---

## DOCUMENT INFO

**Version:** 1.0
**Last Updated:** 2026-05-04
