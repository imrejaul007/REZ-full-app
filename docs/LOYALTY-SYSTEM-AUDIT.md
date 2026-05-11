# LOYALTY SYSTEM AUDIT (CORRECTED)
**Date:** May 3, 2026

---

## CORRECT PICTURE

The REZ consumer app already has a **COMPLETE** loyalty system. The loyalty I built for rez-now is **DUPLICATE**.

---

## EXISTING LOYALTY SYSTEM (Consumer App)

### Location: `rez-app-consumer/`

### 1. Loyalty Service (`services/loyaltyApi.ts`)

```typescript
interface LoyaltyPoints {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  nextTier: string;
  pointsToNextTier: number;
  lifetimePoints: number;
  expiringPoints: number;
  expiryDate: string;
}

interface Reward {
  title: string;
  points: number;
  value: number;
  category: 'voucher' | 'discount' | 'cashback' | 'freebie';
}
```

**Tiers:** bronze → silver → gold → platinum → diamond (5 tiers)

---

### 2. User Loyalty (`services/userLoyaltyApi.ts`)

```typescript
interface UserLoyalty {
  streak: {
    current: number;
    target: number;
    history: string[];
  };
  brandLoyalty: {
    brandId: string;
    brandName: string;
    purchaseCount: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    progress: number;
  }[];
  missions: {
    missionId: string;
    title: string;
    progress: number;
    target: number;
    reward: number;
    completedAt: string | null;
  }[];
  coins: {
    available: number;
    expiring: number;
    history: { amount: number; type: 'earned' | 'spent' | 'expired' }[];
  };
  categoryCoins: Record<string, { available: number; expiring: number }>;
}
```

---

### 3. Visit Streak (`services/visitStreakApi.ts`)

```typescript
interface VisitStreakData {
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  nextMilestone: {
    visitsNeeded: number;
    totalRequired: number;
    reward: number;
    name: string;
  } | null;
  recentVisits: {
    visitNumber: string;
    storeId: string;
    storeName: string;
    visitDate: string;
    visitType: string;
  }[];
}
```

---

### 4. Gamification Streaks (`services/streakApi.ts`)

```typescript
interface AllStreaks {
  login: StreakData;    // Daily login streak
  order: StreakData;    // Order streak
  review: StreakData;   // Review streak
  savings: StreakData;   // Savings streak
}

interface StreakData {
  current: number;
  longest: number;
  totalDays: number;
  frozen: boolean;
  hasCheckedInToday: boolean;
  nextMilestone: { day: number; coins: number; name: string };
  claimableMilestones: StreakMilestone[];
  allMilestones: StreakMilestone[];
}

interface StreakMilestone {
  day: number;
  coins: number;
  name: string;
  badge?: string;
  reached: boolean;
  claimed: boolean;
}
```

---

### 5. Store Visit (`services/storeVisitApi.ts`)

```typescript
interface ScheduleVisitRequest {
  storeId: string;
  visitDate: string;
  visitTime: string;
  customerName: string;
  customerPhone: string;
}

interface GetQueueNumberResponse {
  queueNumber: number;
  estimatedWaitTime: string;
  currentQueueSize: number;
  crowdLevel: 'Low' | 'Medium' | 'High';
}
```

---

## COMPLETE FEATURES ALREADY IN CONSUMER APP

| Feature | Service | Status |
|---------|---------|--------|
| Points tracking | loyaltyApi | ✅ Built |
| 5-tier system | loyaltyApi | ✅ Built |
| Visit tracking | visitStreakApi | ✅ Built |
| Current streak | visitStreakApi | ✅ Built |
| Longest streak | visitStreakApi | ✅ Built |
| Milestones | visitStreakApi | ✅ Built |
| Login streak | streakApi | ✅ Built |
| Order streak | streakApi | ✅ Built |
| Review streak | streakApi | ✅ Built |
| Savings streak | streakApi | ✅ Built |
| Brand loyalty | userLoyaltyApi | ✅ Built |
| Missions | userLoyaltyApi | ✅ Built |
| Coins history | userLoyaltyApi | ✅ Built |
| Category coins | userLoyaltyApi | ✅ Built |
| Schedule visit | storeVisitApi | ✅ Built |
| Queue management | storeVisitApi | ✅ Built |

---

## WHAT I BUILT FOR REZ-NOW (DUPLICATE)

### Location: `rez-now/lib/config/`

| What I Built | What's Already in Consumer App |
|--------------|------------------------------|
| 4 tiers (bronze→platinum) | 5 tiers (bronze→diamond) |
| Visit milestones | Visit milestones in visitStreakApi |
| Streak counter | Streak in visitStreakApi |
| Milestone badges | Missions in userLoyaltyApi |
| Tier progress | Tier in userLoyaltyApi |

---

## WHAT'S DIFFERENT

| Aspect | Consumer App | Rez-now (Built) |
|--------|-------------|-----------------|
| **Tiers** | 5 (diamond added) | 4 (bronze→platinum) |
| **Visit tracking** | ✅ Complete | ❌ Need to connect |
| **Streak types** | login, order, review, savings | ❌ Need to connect |
| **Brand loyalty** | ✅ Per-brand tiers | ❌ Need to connect |
| **Missions** | ✅ With rewards | ❌ Need to connect |
| **Coins** | ✅ With history | ❌ Need to connect |
| **Category coins** | ✅ Per category | ❌ Need to connect |

---

## CORRECT APPROACH

### DON'T BUILD NEW - CONNECT TO EXISTING

```
┌─────────────────────────────────────────────────────────────────┐
│                    REZ CONSUMER APP                               │
│            (Single Source of Truth)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  services/loyaltyApi.ts      → Points + Tiers                  │
│  services/userLoyaltyApi.ts  → Streak + Missions + Brand       │
│  services/visitStreakApi.ts  → Visit tracking                  │
│  services/streakApi.ts       → All streak types                 │
│  services/storeVisitApi.ts   → Visit scheduling                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   REZ-NOW (QR)    │
                    │                    │
                    │  Connect to these   │
                    │  existing services  │
                    │                    │
                    │  DO NOT REBUILD     │
                    └─────────────────────┘
```

---

## FILES TO UPDATE IN REZ-NOW

### 1. Replace Local Loyalty with Consumer API

Instead of `rez-now/lib/api/loyalty.ts`, use:

```typescript
// rez-now/lib/api/userProfile.ts
import { loyaltyApi } from '@/services/loyaltyApi';
import { userLoyaltyApi } from '@/services/userLoyaltyApi';
import { visitStreakApi } from '@/services/visitStreakApi';

// Use these instead of local loyalty.ts
export async function getLoyaltyProfile(userId: string) {
  return userLoyaltyApi.getLoyalty();
}

export async function getVisitStreak(userId: string) {
  return visitStreakApi.getVisitStreak();
}

export async function getStreakStatus(type: 'login' | 'order' | 'review' | 'savings') {
  return streakApi.getStreakStatus(type);
}
```

### 2. Update Components

Update `rez-now/components/loyalty/*` to use consumer app services:

```typescript
// YourUsual.tsx - Use visitStreakApi
// MilestoneCard.tsx - Use userLoyaltyApi
// BadgeDisplay.tsx - Use userLoyaltyApi
// StreakCounter.tsx - Use visitStreakApi
// TierCard.tsx - Use loyaltyApi
```

### 3. Create API Client

Create `rez-now/lib/api/consumerServices.ts`:

```typescript
// Connect to REZ Consumer API
// All loyalty data comes from here

export const consumerApi = {
  loyalty: loyaltyApi,
  userLoyalty: userLoyaltyApi,
  visitStreak: visitStreakApi,
  streak: streakApi,
  storeVisit: storeVisitApi,
};
```

---

## INTEGRATION POINTS

### After Payment in Rez-now

```typescript
// After successful payment
import { visitStreakApi } from '@/services/visitStreakApi';
import { streakApi } from '@/services/streakApi';

// Record visit
await visitStreakApi.recordVisit(storeId);

// Update order streak
await streakApi.updateStreak('order');
```

### For "Your Usual" in Rez-now

```typescript
// Use userLoyaltyApi.getLoyalty()
const { data } = await userLoyaltyApi.getLoyalty();
const frequentStores = data?.brandLoyalty
  .filter(b => b.purchaseCount >= 3)
  .sort((a, b) => b.purchaseCount - a.purchaseCount);
```

---

## WHAT TO DELETE

| File | Reason |
|------|--------|
| `rez-now/lib/api/loyalty.ts` | Duplicate - use consumer app |
| `rez-now/lib/config/milestones.ts` | Use consumer app milestones |
| `rez-now/lib/config/tiers.ts` | Use consumer app tiers |
| `rez-now/lib/api/loyaltyApi.ts` | Already exists in consumer |
| `rez-now/components/loyalty/*` | Rewrite to use consumer services |

---

## WHAT TO KEEP

| File | Reason |
|------|--------|
| `rez-now/lib/notifications/loyalty.ts` | Push notifications - OK |
| `rez-now/components/menu/YourUsual.tsx` | OK - just need to update API calls |
| Merchant dashboard `loyalty/page.tsx` | Update to call consumer APIs |

---

## SUMMARY

| Item | Action |
|------|--------|
| **Loyalty system in consumer app** | COMPLETE - Don't touch |
| **Loyalty system in rez-now** | DELETE - Connect to consumer |
| **Visit tracking** | ALREADY EXISTS - Connect |
| **Streaks** | ALREADY EXISTS - Connect |
| **Brand loyalty** | ALREADY EXISTS - Connect |
| **Missions** | ALREADY EXISTS - Connect |
| **Coins** | ALREADY EXISTS - Connect |

---

## NEXT STEPS

1. **Delete** duplicate loyalty code in rez-now
2. **Create** consumer API client in rez-now
3. **Update** components to use consumer services
4. **Test** end-to-end flow
5. **Update** merchant dashboard to use consumer APIs

---

*Document Generated: May 3, 2026*
