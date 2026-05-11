/**
 * Test Fixtures - Reusable test data generators for REZ Loyalty System
 */

// ============================================================================
// Types
// ============================================================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type BadgeType = 'streak' | 'spending' | 'karma' | 'cross-merchant' | 'special';
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface LoyaltyProfile {
  userId: string;
  tier: LoyaltyTier;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  karma: number;
  currentStreak: number;
  longestStreak: number;
  lastOrderDate: Date | null;
  streakStartDate: Date | null;
  badges: Badge[];
  rezScore: number;
  xp: number;
  level: number;
}

export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  earnedAt: Date;
  merchantId?: string;
}

export interface Order {
  id: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  totalAmount: number;
  cashbackAmount: number;
  pointsEarned: number;
  xpEarned: number;
  status: OrderStatus;
  createdAt: Date;
  completedAt: Date | null;
}

export interface KarmaActivity {
  id: string;
  userId: string;
  type: 'review' | 'referral' | 'social_share' | 'feedback' | 'community';
  points: number;
  multiplier: number;
  description: string;
  createdAt: Date;
}

export interface CrossMerchantProgress {
  userId: string;
  merchantsVisited: Set<string>;
  totalMerchants: number;
  badgeProgress: number;
  completed: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const LOYALTY_TIERS: Record<LoyaltyTier, { minPoints: number; multiplier: number }> = {
  bronze: { minPoints: 0, multiplier: 1.0 },
  silver: { minPoints: 1000, multiplier: 1.25 },
  gold: { minPoints: 5000, multiplier: 1.5 },
  platinum: { minPoints: 15000, multiplier: 1.75 },
  diamond: { minPoints: 50000, multiplier: 2.0 },
};

export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];
export const STREAK_REWARDS: Record<number, { points: number; xp: number; badge?: string }> = {
  7: { points: 100, xp: 50 },
  14: { points: 250, xp: 100 },
  30: { points: 500, xp: 250, badge: 'streak_30_days' },
  60: { points: 1000, xp: 500, badge: 'streak_60_days' },
  90: { points: 2000, xp: 1000, badge: 'streak_90_days' },
  180: { points: 5000, xp: 2500, badge: 'streak_180_days' },
  365: { points: 15000, xp: 7500, badge: 'streak_365_days' },
};

export const POINTS_CONFIG = {
  basePointsPerDollar: 10,
  karmaMultiplier: 0.5,
  streakBonusPercent: 5,
  crossMerchantBonus: 100,
};

export const KARMA_MILESTONES = [100, 500, 1000, 5000, 10000, 50000];
export const KARMA_BADGES: Record<number, { badge: string; loyaltyPoints: number }> = {
  100: { badge: 'karma_newbie', loyaltyPoints: 50 },
  500: { badge: 'karma_contributor', loyaltyPoints: 200 },
  1000: { badge: 'karma_expert', loyaltyPoints: 500 },
  5000: { badge: 'karma_master', loyaltyPoints: 2000 },
  10000: { badge: 'karma_legend', loyaltyPoints: 5000 },
  50000: { badge: 'karma_god', loyaltyPoints: 15000 },
};

export const MERCHANTS = [
  { id: 'merchant_1', name: 'Cafe Delight' },
  { id: 'merchant_2', name: 'Tech Store' },
  { id: 'merchant_3', name: 'Fashion Hub' },
  { id: 'merchant_4', name: 'Food Court' },
  { id: 'merchant_5', name: 'Sports Center' },
];

// ============================================================================
// Fixture Generators
// ============================================================================

let userIdCounter = 1;
let orderIdCounter = 1;
let badgeIdCounter = 1;
let karmaIdCounter = 1;

export function resetCounters(): void {
  userIdCounter = 1;
  orderIdCounter = 1;
  badgeIdCounter = 1;
  karmaIdCounter = 1;
}

export function generateUser(overrides?: Partial<User>): User {
  const id = `user_${userIdCounter++}`;
  const now = new Date();
  return {
    id,
    email: `testuser${id}@example.com`,
    name: `Test User ${id}`,
    createdAt: new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    lastActiveAt: now,
    ...overrides,
  };
}

export function generateLoyaltyProfile(
  userId: string,
  overrides?: Partial<LoyaltyProfile>
): LoyaltyProfile {
  const tier = overrides?.tier ?? 'bronze';
  const totalPoints = overrides?.totalPoints ?? LOYALTY_TIERS[tier].minPoints;
  return {
    userId,
    tier,
    totalPoints,
    availablePoints: totalPoints,
    lifetimePoints: totalPoints,
    karma: overrides?.karma ?? 0,
    currentStreak: overrides?.currentStreak ?? 0,
    longestStreak: overrides?.longestStreak ?? 0,
    lastOrderDate: overrides?.lastOrderDate ?? null,
    streakStartDate: overrides?.streakStartDate ?? null,
    badges: overrides?.badges ?? [],
    rezScore: overrides?.rezScore ?? 0,
    xp: overrides?.xp ?? 0,
    level: overrides?.level ?? 1,
  };
}

export function generateOrder(
  userId: string,
  merchantId: string,
  overrides?: Partial<Order>
): Order {
  const id = `order_${orderIdCounter++}`;
  const now = new Date();
  const totalAmount = overrides?.totalAmount ?? Math.floor(Math.random() * 200) + 10;
  return {
    id,
    userId,
    merchantId,
    merchantName: MERCHANTS.find((m) => m.id === merchantId)?.name ?? 'Unknown Merchant',
    totalAmount,
    cashbackAmount: overrides?.cashbackAmount ?? Math.round(totalAmount * 0.05 * 100) / 100,
    pointsEarned: overrides?.pointsEarned ?? Math.floor(totalAmount * POINTS_CONFIG.basePointsPerDollar),
    xpEarned: overrides?.xpEarned ?? Math.floor(totalAmount),
    status: overrides?.status ?? 'completed',
    createdAt: overrides?.createdAt ?? now,
    completedAt: overrides?.completedAt ?? now,
    ...overrides,
  };
}

export function generateBadge(type: BadgeType, overrides?: Partial<Badge>): Badge {
  const id = `badge_${badgeIdCounter++}`;
  const badgeNames: Record<BadgeType, string> = {
    streak: 'Streak Champion',
    spending: 'Big Spender',
    karma: 'Karma Collector',
    'cross-merchant': 'Explorer',
    special: 'Special Achievement',
  };
  return {
    id,
    type,
    name: badgeNames[type],
    description: `Earned for ${type} achievement`,
    earnedAt: new Date(),
    ...overrides,
  };
}

export function generateKarmaActivity(
  userId: string,
  type: KarmaActivity['type'],
  overrides?: Partial<KarmaActivity>
): KarmaActivity {
  const id = `karma_${karmaIdCounter++}`;
  const basePoints: Record<KarmaActivity['type'], number> = {
    review: 50,
    referral: 200,
    social_share: 25,
    feedback: 30,
    community: 100,
  };
  return {
    id,
    userId,
    type,
    points: overrides?.points ?? basePoints[type],
    multiplier: overrides?.multiplier ?? 1.0,
    description: `${type} activity`,
    createdAt: new Date(),
    ...overrides,
  };
}

export function generateCrossMerchantProgress(
  userId: string,
  merchantsVisited?: string[],
  overrides?: Partial<CrossMerchantProgress>
): CrossMerchantProgress {
  return {
    userId,
    merchantsVisited: new Set(merchantsVisited ?? []),
    totalMerchants: MERCHANTS.length,
    badgeProgress: 0,
    completed: false,
    ...overrides,
  };
}

// ============================================================================
// Composite Fixtures
// ============================================================================

export interface CompleteUserProfile {
  user: User;
  loyaltyProfile: LoyaltyProfile;
  orders: Order[];
  karmaActivities: KarmaActivity[];
  badges: Badge[];
}

export function generateCompleteUserProfile(overrides?: Partial<CompleteUserProfile>): CompleteUserProfile {
  const user = generateUser();
  const loyaltyProfile = generateLoyaltyProfile(user.id);
  return {
    user,
    loyaltyProfile,
    orders: [],
    karmaActivities: [],
    badges: [],
    ...overrides,
  };
}

export function generateUserWithTier(
  userId: string,
  tier: LoyaltyTier,
  overrides?: Partial<LoyaltyProfile>
): LoyaltyProfile {
  const minPoints = LOYALTY_TIERS[tier].minPoints;
  return generateLoyaltyProfile(userId, {
    tier,
    totalPoints: minPoints,
    availablePoints: minPoints,
    lifetimePoints: minPoints,
    ...overrides,
  });
}

export function generateUserWithStreak(
  userId: string,
  streakDays: number,
  daysAgo: number = 0
): LoyaltyProfile {
  const now = new Date();
  const streakStartDate = new Date(now.getTime() - (streakDays - 1 + daysAgo) * 24 * 60 * 60 * 1000);
  const lastOrderDate = daysAgo === 0
    ? now
    : new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  return generateLoyaltyProfile(userId, {
    currentStreak: streakDays,
    longestStreak: Math.max(streakDays, streakDays),
    streakStartDate,
    lastOrderDate,
  });
}

export function generateUserWithKarma(
  userId: string,
  karmaPoints: number
): LoyaltyProfile {
  return generateLoyaltyProfile(userId, { karma: karmaPoints });
}

export function generateMultiMerchantOrders(
  userId: string,
  merchantIds: string[]
): Order[] {
  return merchantIds.map((merchantId) => generateOrder(userId, merchantId));
}

// ============================================================================
// Scenario Fixtures
// ============================================================================

export function generateScenario_NormalOrder(): CompleteUserProfile {
  const user = generateUser();
  const loyaltyProfile = generateLoyaltyProfile(user.id);
  const order = generateOrder(user.id, MERCHANTS[0].id, {
    totalAmount: 50,
    status: 'completed',
  });
  return {
    user,
    loyaltyProfile,
    orders: [order],
    karmaActivities: [],
    badges: [],
  };
}

export function generateScenario_HighValueOrder(): CompleteUserProfile {
  const user = generateUser();
  const loyaltyProfile = generateLoyaltyProfile(user.id, { tier: 'silver' });
  const order = generateOrder(user.id, MERCHANTS[0].id, {
    totalAmount: 500,
    status: 'completed',
  });
  return {
    user,
    loyaltyProfile,
    orders: [order],
    karmaActivities: [],
    badges: [],
  };
}

export function generateScenario_StreakMilestone(): CompleteUserProfile {
  const user = generateUser();
  const loyaltyProfile = generateUserWithStreak(user.id, 6); // 1 day before milestone
  const order = generateOrder(user.id, MERCHANTS[0].id, {
    totalAmount: 30,
    status: 'completed',
  });
  return {
    user,
    loyaltyProfile,
    orders: [order],
    karmaActivities: [],
    badges: [],
  };
}

export function generateScenario_KarmaMilestone(): CompleteUserProfile {
  const user = generateUser();
  const loyaltyProfile = generateUserWithKarma(user.id, 99); // 1 point before milestone
  const karmaActivity = generateKarmaActivity(user.id, 'review', { points: 10 });
  return {
    user,
    loyaltyProfile,
    orders: [],
    karmaActivities: [karmaActivity],
    badges: [],
  };
}

export function generateScenario_CrossMerchantAlmostComplete(): CompleteUserProfile {
  const user = generateUser();
  const loyaltyProfile = generateLoyaltyProfile(user.id);
  // Visit all but one merchant
  const visitedMerchants = MERCHANTS.slice(0, MERCHANTS.length - 1).map((m) => m.id);
  const progress = generateCrossMerchantProgress(user.id, visitedMerchants);

  return {
    user,
    loyaltyProfile,
    orders: visitedMerchants.map((mid) => generateOrder(user.id, mid)),
    karmaActivities: [],
    badges: [],
  };
}

export function generateScenario_TierUpgrade(): CompleteUserProfile {
  const user = generateUser();
  // Just below gold tier threshold
  const loyaltyProfile = generateLoyaltyProfile(user.id, {
    tier: 'silver',
    totalPoints: 4999,
    availablePoints: 4999,
    lifetimePoints: 4999,
  });
  const order = generateOrder(user.id, MERCHANTS[0].id, {
    totalAmount: 50,
    status: 'completed',
  });
  return {
    user,
    loyaltyProfile,
    orders: [order],
    karmaActivities: [],
    badges: [],
  };
}

export function generateScenario_MissedStreak(): CompleteUserProfile {
  const user = generateUser();
  // Last order was 2 days ago, streak should reset
  const loyaltyProfile = generateUserWithStreak(user.id, 10, 2);
  return {
    user,
    loyaltyProfile,
    orders: [],
    karmaActivities: [],
    badges: [],
  };
}
