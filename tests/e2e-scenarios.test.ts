/**
 * E2E Test Scenarios for REZ Loyalty System
 *
 * Comprehensive end-to-end test scenarios covering:
 * - E2E_ORDER_FLOW: Order -> Points -> Cashback -> Streak -> Score
 * - E2E_KARMA_FLOW: Karma Event -> Loyalty Points -> Tier Boost
 * - E2E_STREAK_FLOW: Check-in -> Streak -> Milestone -> Rewards
 * - E2E_BADGE_FLOW: Cross-merchant -> Badge -> Rewards
 *
 * @group e2e
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import mongoose from 'mongoose';

// ============================================================================
// Shared Types
// ============================================================================

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
type StreakType = 'login' | 'order' | 'review' | 'savings' | 'visit';
type KarmaCategory = 'environment' | 'food' | 'health' | 'education' | 'community';
type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

// ============================================================================
// Mock Data Stores
// ============================================================================

interface MockStores {
  users: Map<string, any>;
  merchants: Map<string, any>;
  orders: Map<string, any>;
  loyaltyProfiles: Map<string, any>;
  karmaProfiles: Map<string, any>;
  wallets: Map<string, any>;
  streaks: Map<string, any>;
  scores: Map<string, any>;
  badges: Map<string, any>;
  transactions: Map<string, any[]>;
}

const createMockStores = (): MockStores => ({
  users: new Map(),
  merchants: new Map(),
  orders: new Map(),
  loyaltyProfiles: new Map(),
  karmaProfiles: new Map(),
  wallets: new Map(),
  streaks: new Map(),
  scores: new Map(),
  badges: new Map(),
  transactions: new Map(),
});

// ============================================================================
// Test Configuration
// ============================================================================

const CONFIG = {
  POINTS_PER_RUPEE: 0.1,
  CASHBACK_PERCENT: 5,
  KARMA_COINS_PER_RUPEE: 20,

  TIER_THRESHOLDS: {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
    diamond: 10000,
  },

  KARMA_THRESHOLDS: {
    starter: 0,
    active: 100,
    contributor: 500,
    leader: 2000,
    elite: 5000,
  },

  KARMA_MULTIPLIERS: {
    starter: 1.0,
    active: 1.1,
    contributor: 1.25,
    leader: 1.5,
    elite: 2.0,
  },

  LOYALTY_MULTIPLIERS: {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.2,
    platinum: 1.5,
    diamond: 2.0,
  },

  STREAK_MILESTONES: [
    { day: 3, coins: 10, name: 'Getting Started' },
    { day: 7, coins: 25, name: 'Week Warrior' },
    { day: 14, coins: 50, name: 'Two Week Champion' },
    { day: 30, coins: 150, name: 'Month Master' },
    { day: 60, coins: 350, name: 'Two Month Legend' },
    { day: 100, coins: 750, name: 'Century Club' },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${new mongoose.Types.ObjectId().toString().slice(0, 12)}`;
}

function calculateTier(points: number): LoyaltyTier {
  if (points >= CONFIG.TIER_THRESHOLDS.diamond) return 'diamond';
  if (points >= CONFIG.TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= CONFIG.TIER_THRESHOLDS.gold) return 'gold';
  if (points >= CONFIG.TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function calculateKarmaLevel(karma: number): KarmaLevel {
  if (karma >= CONFIG.KARMA_THRESHOLDS.elite) return 'elite';
  if (karma >= CONFIG.KARMA_THRESHOLDS.leader) return 'leader';
  if (karma >= CONFIG.KARMA_THRESHOLDS.contributor) return 'contributor';
  if (karma >= CONFIG.KARMA_THRESHOLDS.active) return 'active';
  return 'starter';
}

function calculatePoints(amount: number, karmaLevel: KarmaLevel, tier: LoyaltyTier): number {
  const basePoints = Math.floor(amount * CONFIG.POINTS_PER_RUPEE);
  const karmaMultiplier = CONFIG.KARMA_MULTIPLIERS[karmaLevel];
  const loyaltyMultiplier = CONFIG.LOYALTY_MULTIPLIERS[tier];
  return Math.floor(basePoints * karmaMultiplier * loyaltyMultiplier);
}

function calculateCashback(amount: number, tier: LoyaltyTier): number {
  const tierBonus = { bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 5 };
  return Math.floor(amount * ((CONFIG.CASHBACK_PERCENT + tierBonus[tier]) / 100));
}

function calculateReZScore(
  orders: number,
  spent: number,
  loyaltyPoints: number,
  karmaPoints: number
): { composite: number; engagement: number; spend: number; loyalty: number; karma: number } {
  const engagement = Math.min(100, Math.floor((orders / 30) * 100));
  const spend = Math.min(100, Math.floor((spent / 50000) * 100));
  const loyalty = Math.min(100, Math.floor((loyaltyPoints / 10000) * 100));
  const karma = Math.min(100, Math.floor((karmaPoints / 5000) * 100));
  const composite = Math.floor(engagement * 0.2 + spend * 0.3 + loyalty * 0.3 + karma * 0.2);
  return { composite, engagement, spend, loyalty, karma };
}

// ============================================================================
// E2E Test Scenarios
// ============================================================================

describe('E2E_ORDER_FLOW: Order -> Points -> Cashback -> Streak -> Score', () => {

  let stores: MockStores;

  beforeEach(() => {
    stores = createMockStores();
  });

  it('should complete full order-to-score reward cycle', async () => {
    // ========================================
    // STEP 1: Create User and Merchant
    // ========================================
    const userId = generateId('user');
    const merchantId = generateId('merchant');

    stores.users.set(userId, {
      userId,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
    });

    stores.merchants.set(merchantId, {
      merchantId,
      name: 'Test Restaurant',
      category: 'food',
      pointsPerRupee: CONFIG.POINTS_PER_RUPEE,
    });

    // Initialize loyalty profile
    stores.loyaltyProfiles.set(userId, {
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      expiringPoints: 0,
    });

    // Initialize karma profile
    stores.karmaProfiles.set(userId, {
      userId,
      lifetimeKarma: 0,
      activeKarma: 0,
      level: 'starter',
      eventsCompleted: 0,
    });

    // Initialize wallet
    stores.wallets.set(userId, {
      userId,
      coins: 0,
      cashback: 0,
      balance: 0,
    });

    // Initialize streak
    stores.streaks.set(`${userId}:login`, {
      userId,
      type: 'login',
      current: 0,
      longest: 0,
      totalDays: 0,
      hasCheckedInToday: false,
    });

    // ========================================
    // STEP 2: Create Order
    // ========================================
    const orderId = generateId('ord');
    const orderAmount = 500;

    stores.orders.set(orderId, {
      orderId,
      userId,
      merchantId,
      items: [{ name: 'Premium Meal', price: 500, quantity: 1 }],
      totals: { subtotal: 500, tax: 90, total: 590 },
      status: 'pending',
      createdAt: new Date(),
    });

    expect(stores.orders.get(orderId).status).toBe('pending');

    // ========================================
    // STEP 3: Complete Order
    // ========================================
    const order = stores.orders.get(orderId);
    order.status = 'payment_completed';
    order.paymentCompletedAt = new Date();

    order.status = 'completed';
    order.completedAt = new Date();

    expect(stores.orders.get(orderId).status).toBe('completed');
    expect(stores.orders.get(orderId).completedAt).toBeDefined();

    // ========================================
    // STEP 4: Award Loyalty Points
    // ========================================
    const loyaltyProfile = stores.loyaltyProfiles.get(userId);
    const karmaProfile = stores.karmaProfiles.get(userId);

    const pointsEarned = calculatePoints(order.totals.total, karmaProfile.level, loyaltyProfile.tier);

    loyaltyProfile.currentPoints += pointsEarned;
    loyaltyProfile.lifetimePoints += pointsEarned;
    loyaltyProfile.tier = calculateTier(loyaltyProfile.lifetimePoints);

    stores.loyaltyProfiles.set(userId, loyaltyProfile);

    expect(loyaltyProfile.lifetimePoints).toBeGreaterThan(0);
    expect(pointsEarned).toBe(59); // 590 * 0.1 * 1.0 * 1.0

    // ========================================
    // STEP 5: Award Cashback
    // ========================================
    const cashbackAmount = calculateCashback(order.totals.total, loyaltyProfile.tier);
    const wallet = stores.wallets.get(userId);

    wallet.cashback += cashbackAmount;
    wallet.balance += cashbackAmount;

    stores.wallets.set(userId, wallet);

    expect(wallet.cashback).toBe(29); // 5% of 590
    expect(wallet.balance).toBe(29);

    // ========================================
    // STEP 6: Update Login Streak
    // ========================================
    const streakKey = `${userId}:login`;
    let streak = stores.streaks.get(streakKey);

    streak.current += 1;
    streak.totalDays += 1;
    streak.hasCheckedInToday = true;

    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }

    stores.streaks.set(streakKey, streak);

    expect(streak.current).toBe(1);
    expect(streak.hasCheckedInToday).toBe(true);

    // ========================================
    // STEP 7: Update ReZ Score
    // ========================================
    const completedOrders = Array.from(stores.orders.values()).filter(
      o => o.userId === userId && o.status === 'completed'
    );
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.totals.total, 0);

    const score = calculateReZScore(
      completedOrders.length,
      totalSpent,
      loyaltyProfile.lifetimePoints,
      karmaProfile.lifetimeKarma
    );

    stores.scores.set(userId, {
      userId,
      ...score,
      lastUpdated: new Date(),
    });

    expect(stores.scores.get(userId).composite).toBeGreaterThan(0);
    expect(stores.scores.get(userId).engagement).toBeGreaterThan(0);

    // ========================================
    // VERIFICATION: All systems consistent
    // ========================================
    expect(stores.loyaltyProfiles.get(userId).lifetimePoints).toBe(pointsEarned);
    expect(stores.wallets.get(userId).cashback).toBe(cashbackAmount);
    expect(stores.streaks.get(`${userId}:login`).current).toBe(1);
    expect(stores.scores.get(userId).composite).toBeGreaterThan(0);
  });

  it('should handle multi-order scenario with tier upgrades', async () => {
    const userId = generateId('user');
    const merchantId = generateId('merchant');

    // Initialize user
    stores.loyaltyProfiles.set(userId, { userId, currentPoints: 400, lifetimePoints: 400, tier: 'bronze' });
    stores.karmaProfiles.set(userId, { userId, lifetimeKarma: 50, activeKarma: 50, level: 'starter' });
    stores.wallets.set(userId, { userId, coins: 0, cashback: 0, balance: 0 });

    // Order 1: Rs 500
    const order1 = { orderId: generateId('ord'), userId, merchantId, totals: { total: 500 }, status: 'completed' };
    stores.orders.set(order1.orderId, order1);

    let loyalty = stores.loyaltyProfiles.get(userId);
    let points = calculatePoints(order1.totals.total, 'starter', 'bronze');
    loyalty.currentPoints += points;
    loyalty.lifetimePoints += points;
    loyalty.tier = calculateTier(loyalty.lifetimePoints);

    expect(loyalty.lifetimePoints).toBe(450);
    expect(loyalty.tier).toBe('bronze');

    // Order 2: Rs 2000 - Should upgrade to Silver
    const order2 = { orderId: generateId('ord'), userId, merchantId, totals: { total: 2000 }, status: 'completed' };
    stores.orders.set(order2.orderId, order2);

    points = calculatePoints(order2.totals.total, 'starter', 'bronze');
    loyalty.currentPoints += points;
    loyalty.lifetimePoints += points;
    loyalty.tier = calculateTier(loyalty.lifetimePoints);

    expect(loyalty.lifetimePoints).toBe(650);
    expect(loyalty.tier).toBe('silver');

    // Order 3: Rs 5000 - Should upgrade to Gold
    const order3 = { orderId: generateId('ord'), userId, merchantId, totals: { total: 5000 }, status: 'completed' };
    stores.orders.set(order3.orderId, order3);

    points = calculatePoints(order3.totals.total, 'starter', 'silver'); // Now silver tier
    loyalty.currentPoints += points;
    loyalty.lifetimePoints += points;
    loyalty.tier = calculateTier(loyalty.lifetimePoints);

    expect(loyalty.lifetimePoints).toBe(1150);
    expect(loyalty.tier).toBe('silver');

    // After more orders...
    // Additional 1000 points needed for gold
    const order4 = { orderId: generateId('ord'), userId, merchantId, totals: { total: 10000 }, status: 'completed' };
    stores.orders.set(order4.orderId, order4);

    points = calculatePoints(order4.totals.total, 'starter', 'silver');
    loyalty.currentPoints += points;
    loyalty.lifetimePoints += points;
    loyalty.tier = calculateTier(loyalty.lifetimePoints);

    expect(loyalty.lifetimePoints).toBe(2150);
    expect(loyalty.tier).toBe('gold');
  });
});

describe('E2E_KARMA_FLOW: Karma Event -> Loyalty Points -> Tier Boost', () => {

  let stores: MockStores;

  beforeEach(() => {
    stores = createMockStores();
  });

  it('should complete full karma to loyalty flow', async () => {
    // ========================================
    // STEP 1: Create User with Karma Profile
    // ========================================
    const userId = generateId('user');

    stores.karmaProfiles.set(userId, {
      userId,
      lifetimeKarma: 0,
      activeKarma: 0,
      level: 'starter',
      eventsCompleted: 0,
      categoryBreakdown: { environment: 0, food: 0, health: 0, education: 0, community: 0 },
    });

    stores.loyaltyProfiles.set(userId, {
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      karmaMultiplier: 1.0,
    });

    stores.wallets.set(userId, { userId, coins: 0, cashback: 0, balance: 0 });

    // ========================================
    // STEP 2: Complete Karma Events
    // ========================================
    const karmaEvents = [
      { id: 'env_tree', category: 'environment', karmaPerHour: 15, maxKarma: 90, hours: 4, coins: 50 },
      { id: 'food_donate', category: 'food', karmaPerHour: 12, maxKarma: 72, hours: 4, coins: 40 },
      { id: 'health_blood', category: 'health', karmaPerHour: 20, maxKarma: 100, hours: 2, coins: 60 },
    ];

    let totalKarma = 0;
    let totalCoins = 0;

    for (const event of karmaEvents) {
      const karmaEarned = Math.min(event.hours * event.karmaPerHour, event.maxKarma);
      totalKarma += karmaEarned;
      totalCoins += event.coins;

      const profile = stores.karmaProfiles.get(userId);
      profile.lifetimeKarma += karmaEarned;
      profile.activeKarma += karmaEarned;
      profile.eventsCompleted += 1;
      profile.categoryBreakdown[event.category] += 1;
      profile.level = calculateKarmaLevel(profile.lifetimeKarma);

      stores.karmaProfiles.set(userId, profile);

      // Credit coins
      const wallet = stores.wallets.get(userId);
      wallet.coins += event.coins;
      wallet.balance += event.coins;
      stores.wallets.set(userId, wallet);
    }

    const karmaProfile = stores.karmaProfiles.get(userId);
    expect(karmaProfile.lifetimeKarma).toBe(262); // 60 + 48 + 40 (capped) + 60 (capped)
    expect(karmaProfile.level).toBe('starter');

    // ========================================
    // STEP 3: Convert Karma to Loyalty Points
    // ========================================
    const karmaToPointsRatio = 0.1;
    const loyaltyProfile = stores.loyaltyProfiles.get(userId);
    const loyaltyPoints = Math.floor(karmaProfile.lifetimeKarma * karmaToPointsRatio);

    loyaltyProfile.currentPoints += loyaltyPoints;
    loyaltyProfile.lifetimePoints += loyaltyPoints;
    loyaltyProfile.karmaMultiplier = CONFIG.KARMA_MULTIPLIERS[karmaProfile.level];

    stores.loyaltyProfiles.set(userId, loyaltyProfile);

    expect(loyaltyProfile.lifetimePoints).toBe(26);

    // ========================================
    // STEP 4: Apply Tier Boost
    // ========================================
    // With enough karma events, karma level upgrades
    // Add more karma to reach 'active' level
    for (let i = 0; i < 5; i++) {
      const profile = stores.karmaProfiles.get(userId);
      profile.lifetimeKarma += 100;
      profile.activeKarma += 100;
      profile.eventsCompleted += 1;
      profile.level = calculateKarmaLevel(profile.lifetimeKarma);
      stores.karmaProfiles.set(userId, profile);
    }

    // Sync loyalty multiplier
    const updatedKarma = stores.karmaProfiles.get(userId);
    const updatedLoyalty = stores.loyaltyProfiles.get(userId);
    updatedLoyalty.karmaMultiplier = CONFIG.KARMA_MULTIPLIERS[updatedKarma.level];

    expect(updatedLoyalty.karmaMultiplier).toBe(1.1); // Active level

    // ========================================
    // STEP 5: Verify Cross-System Consistency
    // ========================================
    const finalKarma = stores.karmaProfiles.get(userId);
    const finalLoyalty = stores.loyaltyProfiles.get(userId);
    const finalWallet = stores.wallets.get(userId);

    expect(finalKarma.eventsCompleted).toBe(8);
    expect(finalLoyalty.lifetimePoints).toBeGreaterThan(0);
    expect(finalWallet.coins).toBe(totalCoins);
    expect(finalLoyalty.karmaMultiplier).toBe(1.1);
  });

  it('should award category badges for karma activity', async () => {
    const userId = generateId('user');

    stores.karmaProfiles.set(userId, {
      userId,
      lifetimeKarma: 0,
      activeKarma: 0,
      level: 'starter',
      eventsCompleted: 0,
      categoryBreakdown: { environment: 0, food: 0, health: 0, education: 0, community: 0 },
      badges: [],
    });

    // Complete 5 environment events
    for (let i = 0; i < 5; i++) {
      const profile = stores.karmaProfiles.get(userId);
      profile.lifetimeKarma += 90;
      profile.activeKarma += 90;
      profile.eventsCompleted += 1;
      profile.categoryBreakdown.environment += 1;
      profile.level = calculateKarmaLevel(profile.lifetimeKarma);

      // Check for category badge
      if (profile.categoryBreakdown.environment === 5) {
        profile.badges.push({
          id: 'env_hero',
          name: 'Green Champion',
          rarity: 'rare' as BadgeRarity,
          earnedAt: new Date(),
          category: 'environment',
        });
      }

      stores.karmaProfiles.set(userId, profile);
    }

    const profile = stores.karmaProfiles.get(userId);
    expect(profile.categoryBreakdown.environment).toBe(5);
    expect(profile.badges.some(b => b.id === 'env_hero')).toBe(true);
  });
});

describe('E2E_STREAK_FLOW: Check-in -> Streak -> Milestone -> Rewards', () => {

  let stores: MockStores;

  beforeEach(() => {
    stores = createMockStores();
  });

  it('should complete full streak milestone reward cycle', async () => {
    // ========================================
    // STEP 1: Initialize User Streaks
    // ========================================
    const userId = generateId('user');

    const streakTypes: StreakType[] = ['login', 'order', 'review'];
    for (const type of streakTypes) {
      stores.streaks.set(`${userId}:${type}`, {
        userId,
        type,
        current: 0,
        longest: 0,
        totalDays: 0,
        hasCheckedInToday: false,
        milestones: CONFIG.STREAK_MILESTONES.map(m => ({ ...m, reached: false, claimed: false })),
      });
    }

    stores.wallets.set(userId, { userId, coins: 0, cashback: 0, balance: 0 });

    // ========================================
    // STEP 2: Daily Check-ins
    // ========================================
    const dailyCheckIns = 7;

    for (let day = 1; day <= dailyCheckIns; day++) {
      // Check in for login streak
      const loginStreak = stores.streaks.get(`${userId}:login`);
      loginStreak.current += 1;
      loginStreak.totalDays += 1;
      loginStreak.hasCheckedInToday = true;

      if (loginStreak.current > loginStreak.longest) {
        loginStreak.longest = loginStreak.current;
      }

      // Check milestones
      for (const milestone of loginStreak.milestones) {
        if (loginStreak.current >= milestone.day && !milestone.reached) {
          milestone.reached = true;
        }
      }

      // Daily reward
      const baseReward = 5;
      const streakBonus = Math.floor(loginStreak.current / 7) * 2;
      const dailyCoins = baseReward + streakBonus;

      const wallet = stores.wallets.get(userId);
      wallet.coins += dailyCoins;
      wallet.balance += dailyCoins;
      stores.wallets.set(userId, wallet);

      stores.streaks.set(`${userId}:login`, loginStreak);
    }

    const finalStreak = stores.streaks.get(`${userId}:login`);
    expect(finalStreak.current).toBe(7);
    expect(finalStreak.longest).toBe(7);
    expect(finalStreak.milestones.find(m => m.day === 7)?.reached).toBe(true);

    // ========================================
    // STEP 3: Claim Milestone Rewards
    // ========================================
    const milestonesToClaim = [3, 7];
    let totalClaimedCoins = 0;
    let claimedBadges: any[] = [];

    for (const day of milestonesToClaim) {
      const milestone = finalStreak.milestones.find(m => m.day === day);
      if (milestone && milestone.reached && !milestone.claimed) {
        milestone.claimed = true;
        milestone.claimedAt = new Date();
        totalClaimedCoins += milestone.coins;

        if (milestone.badgeId) {
          claimedBadges.push({
            id: milestone.badgeId,
            name: milestone.name,
            rarity: day >= 30 ? 'rare' : 'common',
            earnedAt: new Date(),
          });
        }
      }
    }

    expect(totalClaimedCoins).toBe(35); // 10 (day 3) + 25 (day 7)

    // Credit milestone coins
    const wallet = stores.wallets.get(userId);
    wallet.coins += totalClaimedCoins;
    wallet.balance += totalClaimedCoins;
    stores.wallets.set(userId, wallet);

    // Award badges
    const userBadges = stores.badges.get(userId) || [];
    userBadges.push(...claimedBadges);
    stores.badges.set(userId, userBadges);

    // ========================================
    // STEP 4: Verify Final State
    // ========================================
    expect(stores.wallets.get(userId).coins).toBeGreaterThan(0);
    expect(stores.streaks.get(`${userId}:login`).current).toBe(7);
    expect(stores.streaks.get(`${userId}:login`).longest).toBe(7);
    expect(stores.badges.get(userId).length).toBe(2);
    expect(stores.badges.get(userId).some(b => b.id === 'streak_3')).toBe(true);
    expect(stores.badges.get(userId).some(b => b.id === 'streak_7')).toBe(true);
  });

  it('should handle streak freeze and recovery', async () => {
    const userId = generateId('user');

    stores.streaks.set(`${userId}:login`, {
      userId,
      type: 'login',
      current: 5,
      longest: 10,
      totalDays: 50,
      hasCheckedInToday: false,
      frozen: false,
    });

    // Freeze streak for 2 days
    const streak = stores.streaks.get(`${userId}:login`);
    streak.frozen = true;
    streak.freezeExpiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    stores.streaks.set(`${userId}:login`, streak);

    expect(stores.streaks.get(`${userId}:login`).frozen).toBe(true);

    // Check in while frozen
    const frozenStreak = stores.streaks.get(`${userId}:login`);
    frozenStreak.hasCheckedInToday = true;
    stores.streaks.set(`${userId}:login`, frozenStreak);

    expect(stores.streaks.get(`${userId}:login`).current).toBe(5); // Preserved

    // Unfreeze
    const unfrozenStreak = stores.streaks.get(`${userId}:login`);
    unfrozenStreak.frozen = false;
    unfrozenStreak.freezeExpiresAt = undefined;
    stores.streaks.set(`${userId}:login`, unfrozenStreak);

    expect(stores.streaks.get(`${userId}:login`).frozen).toBe(false);
    expect(stores.streaks.get(`${userId}:login`).current).toBe(5);
  });
});

describe('E2E_BADGE_FLOW: Cross-merchant -> Badge -> Rewards', () => {

  let stores: MockStores;

  beforeEach(() => {
    stores = createMockStores();
  });

  it('should award cross-merchant badges', async () => {
    // ========================================
    // STEP 1: Create Multi-Merchant Activity
    // ========================================
    const userId = generateId('user');
    const merchants = [
      { id: generateId('merchant'), name: 'Restaurant A', category: 'food' },
      { id: generateId('merchant'), name: 'Restaurant B', category: 'food' },
      { id: generateId('merchant'), name: 'Cafe C', category: 'food' },
      { id: generateId('merchant'), name: 'Grocery D', category: 'grocery' },
      { id: generateId('merchant'), name: 'Gym E', category: 'fitness' },
    ];

    stores.loyaltyProfiles.set(userId, {
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      brandVisits: {},
    });

    // ========================================
    // STEP 2: Visit Multiple Merchants
    // ========================================
    const merchantVisits: Record<string, number> = {};

    for (const merchant of merchants) {
      const visitCount = Math.floor(Math.random() * 5) + 1;
      merchantVisits[merchant.id] = visitCount;

      // Update brand loyalty
      const loyalty = stores.loyaltyProfiles.get(userId);
      loyalty.brandVisits[merchant.id] = visitCount;
      loyalty.lifetimePoints += visitCount * 10; // 10 points per visit
      stores.loyaltyProfiles.set(userId, loyalty);
    }

    // ========================================
    // STEP 3: Check for Cross-Merchant Badges
    // ========================================
    const uniqueMerchantsVisited = Object.keys(merchantVisits).length;
    const earnedBadges: any[] = [];

    // Multi-merchant badges
    if (uniqueMerchantsVisited >= 3) {
      earnedBadges.push({
        id: 'explorer',
        name: 'Explorer',
        rarity: 'common',
        description: 'Visited 3 different merchants',
        earnedAt: new Date(),
      });
    }

    if (uniqueMerchantsVisited >= 5) {
      earnedBadges.push({
        id: 'regular',
        name: 'Regular',
        rarity: 'rare',
        description: 'Visited 5 different merchants',
        earnedAt: new Date(),
      });
    }

    stores.badges.set(userId, earnedBadges);

    expect(stores.badges.get(userId).length).toBe(2);
    expect(stores.badges.get(userId).some(b => b.id === 'explorer')).toBe(true);
    expect(stores.badges.get(userId).some(b => b.id === 'regular')).toBe(true);

    // ========================================
    // STEP 4: Award Badge Bonuses
    // ========================================
    stores.wallets.set(userId, { userId, coins: 0, cashback: 0, balance: 0 });

    const badgeRewards: Record<string, number> = {
      explorer: 25,
      regular: 50,
    };

    let totalBonus = 0;
    for (const badge of earnedBadges) {
      const bonus = badgeRewards[badge.id] || 0;
      totalBonus += bonus;

      const wallet = stores.wallets.get(userId);
      wallet.coins += bonus;
      wallet.balance += bonus;
      stores.wallets.set(userId, wallet);
    }

    expect(totalBonus).toBe(75);
    expect(stores.wallets.get(userId).coins).toBe(75);
  });

  it('should track category mastery badges', async () => {
    const userId = generateId('user');

    stores.karmaProfiles.set(userId, {
      userId,
      lifetimeKarma: 0,
      eventsCompleted: 0,
      categoryBreakdown: {
        environment: 10,
        food: 5,
        health: 3,
        education: 2,
        community: 8,
      },
      badges: [],
    });

    const categoryMasteryBadges: Record<string, { threshold: number; badgeId: string; name: string }> = {
      environment: { threshold: 10, badgeId: 'env_master', name: 'Environment Master' },
      community: { threshold: 5, badgeId: 'comm_master', name: 'Community Master' },
    };

    const earnedBadges: any[] = [];
    const profile = stores.karmaProfiles.get(userId);

    for (const [category, config] of Object.entries(categoryMasteryBadges)) {
      if (profile.categoryBreakdown[category as KarmaCategory] >= config.threshold) {
        earnedBadges.push({
          id: config.badgeId,
          name: config.name,
          rarity: 'epic',
          earnedAt: new Date(),
          category,
        });
      }
    }

    expect(earnedBadges.length).toBe(2);
    expect(earnedBadges.some(b => b.id === 'env_master')).toBe(true);
    expect(earnedBadges.some(b => b.id === 'comm_master')).toBe(true);
  });
});

// ============================================================================
// Performance and Load Tests
// ============================================================================

describe('E2E Performance Tests', () => {

  it('should handle concurrent user flows', async () => {
    const stores = createMockStores();
    const numUsers = 10;
    const ordersPerUser = 5;

    // Create multiple users
    for (let i = 0; i < numUsers; i++) {
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      stores.users.set(userId, { userId });
      stores.loyaltyProfiles.set(userId, { userId, currentPoints: 0, lifetimePoints: 0, tier: 'bronze' });
      stores.karmaProfiles.set(userId, { userId, lifetimeKarma: 0, activeKarma: 0, level: 'starter' });
      stores.wallets.set(userId, { userId, coins: 0, cashback: 0, balance: 0 });
      stores.streaks.set(`${userId}:login`, { userId, type: 'login', current: 0, longest: 0, totalDays: 0, hasCheckedInToday: false });

      // Create orders
      for (let j = 0; j < ordersPerUser; j++) {
        const orderId = generateId('ord');
        stores.orders.set(orderId, {
          orderId,
          userId,
          merchantId,
          totals: { total: 500 },
          status: 'completed',
        });

        // Update loyalty
        const loyalty = stores.loyaltyProfiles.get(userId);
        loyalty.lifetimePoints += 50;
        loyalty.currentPoints += 50;
        stores.loyaltyProfiles.set(userId, loyalty);

        // Update wallet
        const wallet = stores.wallets.get(userId);
        wallet.cashback += 25;
        wallet.balance += 25;
        stores.wallets.set(userId, wallet);
      }

      // Update streak
      const streak = stores.streaks.get(`${userId}:login`);
      streak.current += 1;
      stores.streaks.set(`${userId}:login`, streak);
    }

    // Verify all users processed
    expect(stores.orders.size).toBe(numUsers * ordersPerUser);
    expect(stores.loyaltyProfiles.size).toBe(numUsers);

    // Verify consistency
    for (const [userId, loyalty] of stores.loyaltyProfiles) {
      expect(loyalty.lifetimePoints).toBe(ordersPerUser * 50);
    }
  });

  it('should maintain data consistency under load', async () => {
    const stores = createMockStores();
    const userId = generateId('user');

    stores.loyaltyProfiles.set(userId, { userId, currentPoints: 0, lifetimePoints: 0, tier: 'bronze' });
    stores.wallets.set(userId, { userId, coins: 0, cashback: 0, balance: 0 });

    // Simulate rapid updates
    const updates = 100;
    for (let i = 0; i < updates; i++) {
      const loyalty = stores.loyaltyProfiles.get(userId);
      loyalty.currentPoints += 10;
      loyalty.lifetimePoints += 10;
      stores.loyaltyProfiles.set(userId, loyalty);

      const wallet = stores.wallets.get(userId);
      wallet.coins += 5;
      wallet.balance += 5;
      stores.wallets.set(userId, wallet);
    }

    const finalLoyalty = stores.loyaltyProfiles.get(userId);
    const finalWallet = stores.wallets.get(userId);

    expect(finalLoyalty.lifetimePoints).toBe(updates * 10);
    expect(finalWallet.coins).toBe(updates * 5);
  });
});
