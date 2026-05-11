# LOYALTY SYSTEM - SOURCE OF TRUTH
**Date:** May 3, 2026  
**Version:** 2.0

---

## OVERVIEW

There are **THREE separate systems** that need to be unified:

```
┌─────────────────────────────────────────────────────────────────┐
│              REZ LOYALTY SYSTEM                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  REZ KARMA     │    │  REZ LOYALTY   │    │  REZ WALLET    │ │
│  │  (Social)      │    │  (Merchant)    │    │  (Coins)      │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. REZ KARMA (Social/Community) - SEPARATE

**Purpose:** Social impact, civic engagement, community building

### Models
- `KarmaProfile` - User karma tracking
- `KarmaEvent` - Community events
- `KarmaMission` - Civic missions
- `CivicMission` - Social causes

### Tiers (5)
```
starter → active → contributor → leader → elite
```

### Features
- Karma score calculation
- Karma decay (gamification)
- Civic missions
- CSR/Corporate partnerships
- Community events
- Leaderboard
- Impact Report PDF
- Impact Resume PDF

### Services
- `rez-karma-service/` - Main karma service

### APPS
- `rez-app-consumer/app/karma/` - Karma tab

---

## 2. REZ LOYALTY (Merchant) - UNIFIED

**Purpose:** Merchant loyalty, visit tracking, spending rewards

### Unified Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REZ LOYALTY (UNIFIED)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CONSUMER LAYER (User-facing)                                      │
│  ├── rez-app-consumer/services/loyaltyApi.ts                       │
│  ├── rez-app-consumer/services/userLoyaltyApi.ts                   │
│  ├── rez-app-consumer/services/visitStreakApi.ts                   │
│  └── rez-app-consumer/services/streakApi.ts                         │
│                                                                     │
│  ──────────────────────────────────────────────────────────────── │
│                                                                     │
│  MERCHANT LAYER (Store-facing)                                     │
│  ├── rez-merchant-service/routes/loyalty.ts                        │
│  ├── rez-merchant-service/routes/loyaltyConfig.ts                  │
│  ├── rez-merchant-service/routes/loyaltyTiers.ts                  │
│  ├── rez-merchant-service/routes/coins.ts                          │
│  └── rez-merchant-service/routes/storeVisits.ts                     │
│                                                                     │
│  ──────────────────────────────────────────────────────────────── │
│                                                                     │
│  ADMIN LAYER (Platform-facing)                                    │
│  ├── rez-app-admin/app/(dashboard)/loyalty.tsx                    │
│  ├── rez-app-admin/app/(dashboard)/loyalty-milestones.tsx         │
│  ├── rez-app-admin/app/(dashboard)/coin-governor.tsx              │
│  └── rez-app-admin/app/(dashboard)/coin-gifts.tsx                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. REZ WALLET (Coins) - SHARED

**Purpose:** Single currency used by both Karma and Loyalty

### Features
- Earn coins from Karma actions
- Earn coins from Loyalty actions
- Spend coins on rewards
- Coin balance
- Transaction history

---

# UNIFIED LOYALTY FEATURES

## Tiers (5 Levels)

| Tier | Visits | Points Multiplier | Perks |
|------|--------|------------------|-------|
| Bronze | 0 | 1x | Basic rewards |
| Silver | 10 | 1.25x | +1% cashback |
| Gold | 25 | 1.5x | +2% cashback |
| Platinum | 50 | 2x | +3% cashback + priority |
| Diamond | 100 | 2.5x | +5% cashback + VIP perks |

---

## Streak Types

| Type | Description | Milestone |
|------|-------------|-----------|
| **Login** | Daily app login | Every 7 days |
| **Order** | Orders placed | Every 5 orders |
| **Review** | Reviews written | Every 3 reviews |
| **Savings** | Money saved | Every ₹500 saved |
| **Visit** | Store visits | Every 5 visits |

---

## Streak Milestones

```typescript
const STREAK_MILESTONES = [
  { days: 3, coins: 10, badge: 'streak_3' },
  { days: 7, coins: 25, badge: 'streak_7' },
  { days: 14, coins: 50, badge: 'streak_14' },
  { days: 30, coins: 100, badge: 'streak_30' },
  { days: 60, coins: 200, badge: 'streak_60' },
  { days: 90, coins: 300, badge: 'streak_90' },
  { days: 180, coins: 500, badge: 'streak_180' },
  { days: 365, coins: 1000, badge: 'streak_365' },
];
```

---

## Visit Milestones

```typescript
const VISIT_MILESTONES = [
  { visits: 1, coins: 10, badge: 'first_visit' },
  { visits: 5, coins: 25, badge: 'regular' },
  { visits: 10, coins: 50, badge: 'loyal' },
  { visits: 25, coins: 100, badge: 'vip' },
  { visits: 50, coins: 250, badge: 'elite' },
  { visits: 100, coins: 500, badge: 'champion' },
];
```

---

## Order Milestones

```typescript
const ORDER_MILESTONES = [
  { orders: 1, coins: 15, badge: 'first_order' },
  { orders: 5, coins: 40, badge: 'foodie' },
  { orders: 10, coins: 80, badge: 'regular' },
  { orders: 25, coins: 200, badge: 'food_lover' },
  { orders: 50, coins: 400, badge: 'gourmet' },
  { orders: 100, coins: 800, badge: 'connoisseur' },
];
```

---

## Badges

| Badge | Category | Rarity | Earned From |
|-------|----------|--------|-------------|
| first_visit | visit | common | First store visit |
| first_order | order | common | First order |
| first_review | review | common | First review |
| streak_7 | streak | common | 7-day streak |
| streak_30 | streak | rare | 30-day streak |
| streak_365 | streak | legendary | 365-day streak |
| regular | visit | common | 5 visits |
| loyal | visit | rare | 10 visits |
| vip | visit | epic | 25 visits |
| foodie | order | common | 5 orders |
| food_lover | order | rare | 25 orders |
| guru | order | epic | 50 orders |
| early_bird | login | common | Login before 7am |
| night_owl | login | common | Login after 10pm |
| weekend_warrior | login | rare | Login both Sat & Sun |

---

# UNIFIED DATA MODELS

## User Loyalty Profile

```typescript
interface UserLoyaltyProfile {
  userId: string;
  
  // Streaks
  loginStreak: {
    current: number;
    longest: number;
    lastLogin: Date;
    milestones: Milestone[];
  };
  orderStreak: {
    current: number;
    longest: number;
    lastOrder: Date;
    milestones: Milestone[];
  };
  reviewStreak: {
    current: number;
    longest: number;
    lastReview: Date;
    milestones: Milestone[];
  };
  savingsStreak: {
    current: number;
    longest: number;
    lastSaving: Date;
    milestones: Milestone[];
  };
  
  // Visits
  totalVisits: number;
  currentVisitStreak: number;
  longestVisitStreak: number;
  visitMilestones: Milestone[];
  
  // Orders
  totalOrders: number;
  totalSpent: number;
  orderMilestones: Milestone[];
  
  // Tiers
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  tierProgress: number;
  nextTier: string;
  pointsToNextTier: number;
  
  // Badges
  badges: EarnedBadge[];
  
  // Brand-specific loyalty
  brandLoyalty: BrandLoyalty[];
  
  // Coins
  coins: number;
  lifetimeCoins: number;
  coinsHistory: CoinTransaction[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

interface Milestone {
  id: string;
  reached: boolean;
  reachedAt?: Date;
  claimed: boolean;
  claimedAt?: Date;
}

interface EarnedBadge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
}

interface BrandLoyalty {
  brandId: string;
  brandName: string;
  visits: number;
  spent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: EarnedBadge[];
}

interface CoinTransaction {
  id: string;
  amount: number;
  type: 'earned' | 'spent' | 'expired' | 'bonus';
  source: 'login' | 'order' | 'review' | 'streak' | 'milestone' | 'redemption' | 'refund';
  description: string;
  createdAt: Date;
}
```

---

## Store Loyalty Config

```typescript
interface MerchantLoyaltyConfig {
  merchantId: string;
  storeId?: string;
  
  // Points
  pointsPerRupee: number;  // e.g., 0.1 = 1 point per ₹10
  pointsToRupee: number;     // e.g., 10 = 10 points = ₹1
  
  // Coins
  coinsPerRupee: number;   // e.g., 0.05 = 1 coin per ₹20
  coinRedemptionRate: number;
  
  // Tiers
  tierConfig: {
    bronze: { minPoints: 0, multiplier: 1 };
    silver: { minPoints: 100, multiplier: 1.25 };
    gold: { minPoints: 500, multiplier: 1.5 };
    platinum: { minPoints: 2000, multiplier: 2 };
    diamond: { minPoints: 5000, multiplier: 2.5 };
  };
  
  // Streaks
  streakConfig: {
    loginBonus: number;     // coins per day
    orderBonus: number;    // coins per order streak
    reviewBonus: number;    // coins per review streak
  };
  
  // Milestones
  milestones: {
    visits: MilestoneConfig[];
    orders: MilestoneConfig[];
    spending: MilestoneConfig[];
  };
  
  // Badges
  badges: BadgeConfig[];
  
  // Settings
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}
```

---

# UNIFIED API ENDPOINTS

## Consumer APIs (`rez-app-consumer`)

| Method | Endpoint | Description |
|-------|----------|-------------|
| GET | `/loyalty` | Get user loyalty profile |
| GET | `/loyalty/visits` | Get visit history |
| POST | `/loyalty/visits` | Record a visit |
| GET | `/loyalty/orders` | Get order history |
| POST | `/loyalty/orders` | Record an order |
| GET | `/loyalty/streaks` | Get all streaks |
| GET | `/loyalty/streaks/:type` | Get specific streak |
| POST | `/loyalty/streaks/:type/checkin` | Check in for streak |
| GET | `/loyalty/coins` | Get coin balance |
| GET | `/loyalty/coins/history` | Get coin history |
| GET | `/loyalty/badges` | Get earned badges |
| GET | `/loyalty/tier` | Get current tier info |
| GET | `/loyalty/milestones` | Get all milestones |
| POST | `/loyalty/milestones/:id/claim` | Claim milestone reward |
| GET | `/loyalty/brands` | Get brand loyalty |

## Merchant APIs (`rez-merchant-service`)

| Method | Endpoint | Description |
|-------|----------|-------------|
| GET | `/api/loyalty/customers` | List loyalty customers |
| GET | `/api/loyalty/customers/:id` | Customer loyalty details |
| GET | `/api/loyalty/stats` | Loyalty program stats |
| PUT | `/api/loyalty/config` | Update loyalty config |
| GET | `/api/loyalty/config` | Get loyalty config |
| POST | `/api/loyalty/tiers` | Create tier |
| GET | `/api/loyalty/tiers` | List tiers |
| PUT | `/api/loyalty/tiers/:id` | Update tier |
| GET | `/api/loyalty/milestones` | List milestones |
| POST | `/api/loyalty/milestones` | Create milestone |
| GET | `/api/loyalty/badges` | List badges |
| POST | `/api/loyalty/badges` | Create badge |
| GET | `/api/loyalty/coins/transactions` | Coin transactions |
| POST | `/api/loyalty/coins/award` | Award coins |
| POST | `/api/loyalty/coins/deduct` | Deduct coins |
| GET | `/api/store-visits` | List store visits |
| POST | `/api/store-visits` | Record a visit |

## Admin APIs (`rez-app-admin`)

| Method | Endpoint | Description |
|-------|----------|-------------|
| GET | `/api/admin/loyalty/overview` | Platform loyalty overview |
| GET | `/api/admin/loyalty/tiers` | Manage platform tiers |
| POST | `/api/admin/loyalty/milestones` | Create platform milestone |
| GET | `/api/admin/loyalty/milestones` | List all milestones |
| PUT | `/api/admin/loyalty/milestones/:id` | Update milestone |
| POST | `/api/admin/loyalty/badges` | Create badge |
| GET | `/api/admin/loyalty/badges` | List all badges |
| GET | `/api/admin/coin-governor` | Coin economy settings |
| PUT | `/api/admin/coin-governor` | Update coin settings |
| POST | `/api/admin/coin-gifts` | Gift coins to users |
| GET | `/api/admin/coin-gifts` | Gift history |

---

# FILES TO UPDATE/UNIFY

## Consumer App

| File | Status | Action |
|------|--------|--------|
| `services/loyaltyApi.ts` | ✅ Complete | Keep |
| `services/userLoyaltyApi.ts` | ✅ Complete | Keep |
| `services/visitStreakApi.ts` | ✅ Complete | Keep |
| `services/streakApi.ts` | ✅ Complete | Keep |
| `services/storeVisitApi.ts` | ✅ Complete | Keep |

## Merchant Service

| File | Status | Action |
|------|--------|--------|
| `routes/loyalty.ts` | ✅ Complete | Keep |
| `routes/loyaltyConfig.ts` | ✅ Complete | Keep |
| `routes/loyaltyTiers.ts` | ✅ Complete | Keep |
| `routes/coins.ts` | ✅ Complete | Keep |
| `routes/storeVisits.ts` | ✅ Complete | Keep |

## Admin App

| File | Status | Action |
|------|--------|--------|
| `app/(dashboard)/loyalty.tsx` | ✅ Complete | Keep |
| `app/(dashboard)/loyalty-milestones.tsx` | ✅ Complete | Keep |
| `app/(dashboard)/coin-governor.tsx` | ✅ Complete | Keep |
| `app/(dashboard)/coin-gifts.tsx` | ✅ Complete | Keep |

## Rez Now (QR)

| File | Status | Action |
|------|--------|--------|
| `lib/config/milestones.ts` | ⚠️ DUPLICATE | DELETE |
| `lib/config/tiers.ts` | ⚠️ DUPLICATE | DELETE |
| `lib/api/loyalty.ts` | ⚠️ DUPLICATE | REPLACE |
| `components/loyalty/*` | ⚠️ DUPLICATE | REWRITE |

## Rez Karma (Separate)

| File | Status | Action |
|------|--------|--------|
| `rez-karma-service/*` | ✅ COMPLETE | Keep SEPARATE |
| `rez-app-consumer/app/karma/*` | ✅ COMPLETE | Keep SEPARATE |

---

# INTEGRATION POINTS

## After Payment (Rez-now → Loyalty)

```typescript
// After successful payment in rez-now
import { loyaltyService } from '@rez/loyalty-client';

async function onPaymentComplete(payment: Payment) {
  // Record order
  await loyaltyService.recordOrder({
    userId: payment.userId,
    storeId: payment.storeId,
    orderId: payment.orderId,
    amount: payment.amount,
  });

  // Update streak
  await loyaltyService.updateStreak({
    userId: payment.userId,
    type: 'order',
  });

  // Award coins
  await loyaltyService.awardCoins({
    userId: payment.userId,
    storeId: payment.storeId,
    amount: payment.amount,
    source: 'order',
  });

  // Check milestones
  await loyaltyService.checkMilestones({
    userId: payment.userId,
  });

  // Update tier if needed
  await loyaltyService.updateTier({
    userId: payment.userId,
  });
}
```

## After Visit (Rez-now → Loyalty)

```typescript
async function onVisitComplete(visit: Visit) {
  // Record visit
  await loyaltyService.recordVisit({
    userId: visit.userId,
    storeId: visit.storeId,
    visitId: visit.visitId,
  });

  // Update streak
  await loyaltyService.updateStreak({
    userId: visit.userId,
    type: 'visit',
  });

  // Check milestones
  await loyaltyService.checkMilestones({
    userId: visit.userId,
  });
}
```

---

# WHAT TO DELETE IN REZ-NOW

```bash
# Delete duplicate config files
rm rez-now/lib/config/milestones.ts
rm rez-now/lib/config/tiers.ts

# Delete duplicate loyalty service
rm rez-now/lib/api/loyalty.ts

# Delete duplicate components (rewrite to use consumer services)
rm -rf rez-now/components/loyalty/
```

---

# UNIFIED LOYALTY CLIENT

Create `packages/rez-loyalty-client/`:

```typescript
// packages/rez-loyalty-client/src/index.ts
export class LoyaltyClient {
  constructor(config: LoyaltyConfig);
  
  // Streaks
  async getStreaks(userId: string): Promise<Streaks>;
  async checkIn(userId: string, type: StreakType): Promise<StreakUpdate>;
  
  // Visits
  async recordVisit(userId: string, storeId: string): Promise<Visit>;
  async getVisitHistory(userId: string): Promise<Visit[]>;
  
  // Orders
  async recordOrder(userId: string, order: OrderData): Promise<Order>;
  
  // Tiers
  async getTier(userId: string): Promise<TierInfo>;
  async updateTier(userId: string): Promise<TierUpdate>;
  
  // Milestones
  async getMilestones(userId: string): Promise<Milestone[]>;
  async claimMilestone(userId: string, milestoneId: string): Promise<Claim>;
  
  // Badges
  async getBadges(userId: string): Promise<Badge[]>;
  
  // Coins
  async getBalance(userId: string): Promise<number>;
  async getHistory(userId: string): Promise<CoinTransaction[]>;
  async awardCoins(data: AwardCoinsData): Promise<CoinUpdate>;
  async deductCoins(data: DeductCoinsData): Promise<CoinUpdate>;
  
  // Merchants
  async getConfig(storeId: string): Promise<MerchantConfig>;
  async updateConfig(storeId: string, config: MerchantConfig): Promise<void>;
}
```

---

# SUMMARY

| System | Purpose | Status |
|--------|---------|--------|
| REZ KARMA | Social/community | ✅ SEPARATE |
| REZ LOYALTY | Merchant/visits | ✅ UNIFIED |
| REZ WALLET | Coins (shared) | ✅ UNIFIED |

---

*Document Generated: May 3, 2026*
