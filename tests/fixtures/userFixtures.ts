/**
 * User Test Fixtures
 *
 * Provides test data generators for user profiles:
 * - User profiles with varying karma levels
 * - User profiles with varying loyalty tiers
 * - User profiles with different engagement levels
 *
 * Usage:
 *   import { createTestUser, createBronzeUser, createEliteUser } from './userFixtures';
 */

import mongoose from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export interface TestUser {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  karmaProfile: TestKarmaProfile;
  loyaltyProfile: TestLoyaltyProfile;
  wallet: TestWallet;
  streaks: TestStreaks;
}

export interface TestKarmaProfile {
  lifetimeKarma: number;
  activeKarma: number;
  level: 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  trustScore: number;
  categoryBreakdown: Record<string, number>;
  streakDays: number;
}

export interface TestLoyaltyProfile {
  currentPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  expiringPoints: number;
  expiryDate: string;
}

export interface TestWallet {
  coins: number;
  cashback: number;
  balance: number;
  expiringCoins: number;
  expiringDate?: string;
}

export interface TestStreaks {
  login: TestStreak;
  order: TestStreak;
  review: TestStreak;
  savings: TestStreak;
  visit: TestStreak;
}

export interface TestStreak {
  current: number;
  longest: number;
  totalDays: number;
  hasCheckedInToday: boolean;
  frozen: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

export const KARMA_THRESHOLDS = {
  starter: 0,
  active: 100,
  contributor: 500,
  leader: 2000,
  elite: 5000,
};

export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
  diamond: 10000,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${new mongoose.Types.ObjectId().toString().slice(0, 12)}`;
}

function generatePhone(): string {
  const prefixes = ['9876', '9875', '9874', '9123'];
  return `+91${prefixes[Math.floor(Math.random() * prefixes.length)]}${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'test.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name.toLowerCase().replace(/\s/g, '.')}${Math.floor(Math.random() * 1000)}@${domain}`;
}

function getKarmaLevel(karma: number): TestKarmaProfile['level'] {
  if (karma >= KARMA_THRESHOLDS.elite) return 'elite';
  if (karma >= KARMA_THRESHOLDS.leader) return 'leader';
  if (karma >= KARMA_THRESHOLDS.contributor) return 'contributor';
  if (karma >= KARMA_THRESHOLDS.active) return 'active';
  return 'starter';
}

function getLoyaltyTier(points: number): TestLoyaltyProfile['tier'] {
  if (points >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// ============================================================================
// User Fixtures
// ============================================================================

export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  const userId = generateId('user');
  const name = `Test User ${userId.slice(-4)}`;

  return {
    userId,
    name,
    email: generateEmail(name),
    phone: generatePhone(),
    createdAt: new Date(),
    karmaProfile: {
      lifetimeKarma: 0,
      activeKarma: 0,
      level: 'starter',
      eventsCompleted: 0,
      eventsJoined: 0,
      totalHours: 0,
      trustScore: 100,
      categoryBreakdown: {
        environment: 0,
        food: 0,
        health: 0,
        education: 0,
        community: 0,
      },
      streakDays: 0,
    },
    loyaltyProfile: {
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      expiringPoints: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: {
      coins: 0,
      cashback: 0,
      balance: 0,
      expiringCoins: 0,
    },
    streaks: {
      login: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      order: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      review: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      savings: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      visit: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
    },
    ...overrides,
  };
}

export function createBronzeUser(): TestUser {
  return createTestUser({
    karmaProfile: {
      lifetimeKarma: 50,
      activeKarma: 50,
      level: 'starter',
      eventsCompleted: 2,
      eventsJoined: 2,
      totalHours: 4,
      trustScore: 95,
      categoryBreakdown: { environment: 1, food: 1, health: 0, education: 0, community: 0 },
      streakDays: 3,
    },
    loyaltyProfile: {
      currentPoints: 200,
      lifetimePoints: 200,
      tier: 'bronze',
      expiringPoints: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: 100, cashback: 50, balance: 150, expiringCoins: 0 },
    streaks: {
      login: { current: 5, longest: 10, totalDays: 20, hasCheckedInToday: true, frozen: false },
      order: { current: 3, longest: 7, totalDays: 15, hasCheckedInToday: false, frozen: false },
      review: { current: 1, longest: 3, totalDays: 5, hasCheckedInToday: false, frozen: false },
      savings: { current: 0, longest: 2, totalDays: 8, hasCheckedInToday: false, frozen: false },
      visit: { current: 2, longest: 5, totalDays: 10, hasCheckedInToday: false, frozen: false },
    },
  });
}

export function createSilverUser(): TestUser {
  return createTestUser({
    karmaProfile: {
      lifetimeKarma: 300,
      activeKarma: 300,
      level: 'active',
      eventsCompleted: 10,
      eventsJoined: 12,
      totalHours: 25,
      trustScore: 90,
      categoryBreakdown: { environment: 3, food: 3, health: 2, education: 1, community: 1 },
      streakDays: 14,
    },
    loyaltyProfile: {
      currentPoints: 800,
      lifetimePoints: 800,
      tier: 'silver',
      expiringPoints: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: 500, cashback: 200, balance: 700, expiringCoins: 0 },
    streaks: {
      login: { current: 14, longest: 21, totalDays: 50, hasCheckedInToday: true, frozen: false },
      order: { current: 10, longest: 15, totalDays: 40, hasCheckedInToday: false, frozen: false },
      review: { current: 7, longest: 10, totalDays: 25, hasCheckedInToday: false, frozen: false },
      savings: { current: 5, longest: 8, totalDays: 20, hasCheckedInToday: false, frozen: false },
      visit: { current: 12, longest: 18, totalDays: 45, hasCheckedInToday: false, frozen: false },
    },
  });
}

export function createGoldUser(): TestUser {
  return createTestUser({
    karmaProfile: {
      lifetimeKarma: 1500,
      activeKarma: 1500,
      level: 'contributor',
      eventsCompleted: 35,
      eventsJoined: 40,
      totalHours: 100,
      trustScore: 85,
      categoryBreakdown: { environment: 10, food: 8, health: 7, education: 5, community: 5 },
      streakDays: 30,
    },
    loyaltyProfile: {
      currentPoints: 3000,
      lifetimePoints: 3000,
      tier: 'gold',
      expiringPoints: 500,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: 1500, cashback: 800, balance: 2300, expiringCoins: 200, expiringDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    streaks: {
      login: { current: 30, longest: 45, totalDays: 120, hasCheckedInToday: true, frozen: false },
      order: { current: 25, longest: 35, totalDays: 100, hasCheckedInToday: true, frozen: false },
      review: { current: 20, longest: 28, totalDays: 80, hasCheckedInToday: false, frozen: false },
      savings: { current: 15, longest: 20, totalDays: 60, hasCheckedInToday: false, frozen: false },
      visit: { current: 28, longest: 40, totalDays: 110, hasCheckedInToday: false, frozen: false },
    },
  });
}

export function createPlatinumUser(): TestUser {
  return createTestUser({
    karmaProfile: {
      lifetimeKarma: 4500,
      activeKarma: 4500,
      level: 'leader',
      eventsCompleted: 75,
      eventsJoined: 85,
      totalHours: 250,
      trustScore: 80,
      categoryBreakdown: { environment: 20, food: 18, health: 15, education: 12, community: 10 },
      streakDays: 60,
    },
    loyaltyProfile: {
      currentPoints: 7000,
      lifetimePoints: 7000,
      tier: 'platinum',
      expiringPoints: 1000,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: 5000, cashback: 2500, balance: 7500, expiringCoins: 500, expiringDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() },
    streaks: {
      login: { current: 60, longest: 90, totalDays: 250, hasCheckedInToday: true, frozen: false },
      order: { current: 55, longest: 70, totalDays: 200, hasCheckedInToday: true, frozen: false },
      review: { current: 45, longest: 60, totalDays: 180, hasCheckedInToday: false, frozen: false },
      savings: { current: 35, longest: 50, totalDays: 150, hasCheckedInToday: false, frozen: false },
      visit: { current: 50, longest: 75, totalDays: 220, hasCheckedInToday: false, frozen: false },
    },
  });
}

export function createEliteUser(): TestUser {
  return createTestUser({
    karmaProfile: {
      lifetimeKarma: 8000,
      activeKarma: 8000,
      level: 'elite',
      eventsCompleted: 150,
      eventsJoined: 175,
      totalHours: 500,
      trustScore: 95,
      categoryBreakdown: { environment: 40, food: 35, health: 30, education: 25, community: 20 },
      streakDays: 100,
    },
    loyaltyProfile: {
      currentPoints: 15000,
      lifetimePoints: 15000,
      tier: 'diamond',
      expiringPoints: 2000,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: 15000, cashback: 8000, balance: 23000, expiringCoins: 1000, expiringDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() },
    streaks: {
      login: { current: 100, longest: 150, totalDays: 500, hasCheckedInToday: true, frozen: false },
      order: { current: 95, longest: 120, totalDays: 450, hasCheckedInToday: true, frozen: false },
      review: { current: 80, longest: 100, totalDays: 350, hasCheckedInToday: true, frozen: false },
      savings: { current: 70, longest: 90, totalDays: 300, hasCheckedInToday: true, frozen: false },
      visit: { current: 90, longest: 110, totalDays: 400, hasCheckedInToday: true, frozen: false },
    },
  });
}

// ============================================================================
// Batch Generators
// ============================================================================

export function createUsers(count: number, tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'): TestUser[] {
  const users: TestUser[] = [];

  for (let i = 0; i < count; i++) {
    let user: TestUser;

    if (tier) {
      switch (tier) {
        case 'bronze':
          user = createBronzeUser();
          break;
        case 'silver':
          user = createSilverUser();
          break;
        case 'gold':
          user = createGoldUser();
          break;
        case 'platinum':
          user = createPlatinumUser();
          break;
        case 'diamond':
          user = createEliteUser();
          break;
      }
    } else {
      // Random tier distribution
      const rand = Math.random();
      if (rand < 0.5) {
        user = createBronzeUser();
      } else if (rand < 0.75) {
        user = createSilverUser();
      } else if (rand < 0.9) {
        user = createGoldUser();
      } else if (rand < 0.98) {
        user = createPlatinumUser();
      } else {
        user = createEliteUser();
      }
    }

    users.push(user);
  }

  return users;
}

export function createUserWithSpecificActivity(
  orders: number,
  karmaEvents: number,
  streakDays: number
): TestUser {
  const user = createTestUser();

  // Calculate karma based on events
  const karmaPerEvent = 50; // Average
  const karma = karmaEvents * karmaPerEvent;

  // Calculate points based on orders
  const avgOrderAmount = 500;
  const pointsPerRupee = 0.1;
  const points = orders * avgOrderAmount * pointsPerRupee;

  return {
    ...user,
    karmaProfile: {
      ...user.karmaProfile,
      lifetimeKarma: karma,
      activeKarma: karma,
      level: getKarmaLevel(karma),
      eventsCompleted: karmaEvents,
      eventsJoined: karmaEvents,
      totalHours: karmaEvents * 3,
      streakDays,
    },
    loyaltyProfile: {
      ...user.loyaltyProfile,
      currentPoints: Math.floor(points),
      lifetimePoints: Math.floor(points),
      tier: getLoyaltyTier(points),
    },
    streaks: {
      login: { current: streakDays, longest: Math.max(streakDays, 30), totalDays: streakDays * 2, hasCheckedInToday: true, frozen: false },
      order: { current: Math.floor(streakDays * 0.8), longest: streakDays, totalDays: streakDays * 1.5, hasCheckedInToday: false, frozen: false },
      review: { current: Math.floor(streakDays * 0.5), longest: Math.floor(streakDays * 0.7), totalDays: streakDays, hasCheckedInToday: false, frozen: false },
      savings: { current: Math.floor(streakDays * 0.3), longest: Math.floor(streakDays * 0.5), totalDays: Math.floor(streakDays * 0.8), hasCheckedInToday: false, frozen: false },
      visit: { current: Math.floor(streakDays * 0.9), longest: streakDays, totalDays: streakDays * 1.2, hasCheckedInToday: false, frozen: false },
    },
  };
}

// ============================================================================
// Edge Case Fixtures
// ============================================================================

export function createNewUser(): TestUser {
  return createTestUser({
    karmaProfile: {
      lifetimeKarma: 0,
      activeKarma: 0,
      level: 'starter',
      eventsCompleted: 0,
      eventsJoined: 0,
      totalHours: 0,
      trustScore: 100,
      categoryBreakdown: { environment: 0, food: 0, health: 0, education: 0, community: 0 },
      streakDays: 0,
    },
    loyaltyProfile: {
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      expiringPoints: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: 0, cashback: 0, balance: 0, expiringCoins: 0 },
    streaks: {
      login: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      order: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      review: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      savings: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
      visit: { current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false, frozen: false },
    },
  });
}

export function createMaxedOutUser(): TestUser {
  return createEliteUser();
}

export function createUserAtTierBoundary(tier: TestLoyaltyProfile['tier']): TestUser {
  const boundaries: Record<TestLoyaltyProfile['tier'], number> = {
    bronze: 499,
    silver: 1999,
    gold: 4999,
    platinum: 9999,
    diamond: 15000,
  };

  const points = boundaries[tier];
  const karma = Math.floor(points * 0.5);

  return createTestUser({
    karmaProfile: {
      lifetimeKarma: karma,
      activeKarma: karma,
      level: getKarmaLevel(karma),
      eventsCompleted: Math.floor(karma / 50),
      eventsJoined: Math.floor(karma / 50),
      totalHours: Math.floor(karma / 20),
      trustScore: 85,
      categoryBreakdown: { environment: 5, food: 5, health: 4, education: 3, community: 3 },
      streakDays: 20,
    },
    loyaltyProfile: {
      currentPoints: points,
      lifetimePoints: points,
      tier: tier,
      expiringPoints: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    wallet: { coins: points, cashback: Math.floor(points * 0.1), balance: Math.floor(points * 1.1), expiringCoins: 0 },
    streaks: {
      login: { current: 20, longest: 30, totalDays: 100, hasCheckedInToday: true, frozen: false },
      order: { current: 15, longest: 25, totalDays: 80, hasCheckedInToday: false, frozen: false },
      review: { current: 10, longest: 18, totalDays: 60, hasCheckedInToday: false, frozen: false },
      savings: { current: 8, longest: 15, totalDays: 50, hasCheckedInToday: false, frozen: false },
      visit: { current: 18, longest: 28, totalDays: 90, hasCheckedInToday: false, frozen: false },
    },
  });
}
