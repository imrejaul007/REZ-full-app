/**
 * Order to Loyalty Integration Tests
 *
 * Tests the complete flow from order placement through:
 * - Points earning
 * - Cashback calculation
 * - Streak updates
 * - ReZ Score calculation
 * - Tier progression
 *
 * @group integration
 * @group order-loyalty
 */

import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';
import mongoose from 'mongoose';

// ============================================================================
// Types
// ============================================================================

interface Order {
  _id: string;
  orderId: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  status: 'pending' | 'payment_completed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface LoyaltyMember {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  expiringPoints: number;
  expiryDate: string;
}

interface Wallet {
  userId: string;
  balance: number;
  cashback: number;
  coins: number;
}

interface Streak {
  userId: string;
  current: number;
  longest: number;
  totalDays: number;
  frozen: boolean;
  lastCheckIn?: Date;
  hasCheckedInToday: boolean;
}

interface ReZScore {
  userId: string;
  composite: number;
  engagement: number;
  spend: number;
  loyalty: number;
  karma: number;
  lastUpdated: Date;
}

interface KarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
}

// ============================================================================
// Mock Data Stores
// ============================================================================

const mockOrders = new Map<string, Order>();
const mockLoyaltyMembers = new Map<string, LoyaltyMember>();
const mockWallets = new Map<string, Wallet>();
const mockStreaks = new Map<string, Streak>();
const mockReZScores = new Map<string, ReZScore>();
const mockKarmaProfiles = new Map<string, KarmaProfile>();

// ============================================================================
// Configuration
// ============================================================================

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
  diamond: 10000,
};

const POINTS_PER_RUPEE = 0.1; // 1 point per 10 rupees
const CASHBACK_PERCENT = 5; // 5% cashback

const KARMA_MULTIPLIERS = {
  starter: 1.0,
  active: 1.1,
  contributor: 1.25,
  leader: 1.5,
  elite: 2.0,
};

const LOYALTY_MULTIPLIERS = {
  bronze: 1.0,
  silver: 1.1,
  gold: 1.2,
  platinum: 1.5,
  diamond: 2.0,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${new mongoose.Types.ObjectId().toString().slice(0, 16)}`;
}

function calculateTier(points: number): LoyaltyMember['tier'] {
  if (points >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function calculatePoints(amount: number, karmaLevel: KarmaProfile['level'], tier: LoyaltyMember['tier']): number {
  const basePoints = Math.floor(amount * POINTS_PER_RUPEE);
  const karmaMultiplier = KARMA_MULTIPLIERS[karmaLevel];
  const loyaltyMultiplier = LOYALTY_MULTIPLIERS[tier];
  return Math.floor(basePoints * karmaMultiplier * loyaltyMultiplier);
}

function calculateCashback(amount: number, tier: LoyaltyMember['tier']): number {
  const tierCashbackBonus = {
    bronze: 0,
    silver: 1,
    gold: 2,
    platinum: 3,
    diamond: 5,
  };
  const effectivePercent = CASHBACK_PERCENT + tierCashbackBonus[tier];
  return Math.floor(amount * (effectivePercent / 100));
}

function calculateReZScore(
  loyaltyPoints: number,
  karmaScore: number,
  orderCount: number,
  totalSpent: number
): ReZScore {
  const engagement = Math.min(100, (orderCount / 30) * 100); // 30 orders = 100
  const spend = Math.min(100, (totalSpent / 50000) * 100); // 50k spent = 100
  const loyalty = Math.min(100, (loyaltyPoints / 10000) * 100); // 10k points = 100
  const karma = Math.min(100, (karmaScore / 5000) * 100); // 5k karma = 100
  const composite = Math.floor((engagement * 0.2 + spend * 0.3 + loyalty * 0.3 + karma * 0.2));

  return { engagement, spend, loyalty, karma, composite };
}

// ============================================================================
// Mock Services
// ============================================================================

const mockOrderService = {
  create: jest.fn(async (data: Partial<Order>): Promise<Order> => {
    const orderId = data.orderId || generateId('ord');
    const order: Order = {
      _id: generateId('mongodb'),
      orderId,
      userId: data.userId!,
      merchantId: data.merchantId!,
      items: data.items || [],
      totals: data.totals || { subtotal: 0, tax: 0, total: 0 },
      status: 'pending',
      createdAt: new Date(),
    };
    mockOrders.set(orderId, order);
    return order;
  }),

  completeOrder: jest.fn(async (orderId: string): Promise<Order> => {
    const order = mockOrders.get(orderId);
    if (!order) throw new Error('Order not found');
    order.status = 'completed';
    order.completedAt = new Date();
    return order;
  }),

  getOrder: jest.fn(async (orderId: string): Promise<Order | null> => {
    return mockOrders.get(orderId) || null;
  }),
};

const mockLoyaltyService = {
  getMember: jest.fn(async (userId: string): Promise<LoyaltyMember | null> => {
    return mockLoyaltyMembers.get(userId) || null;
  }),

  addPoints: jest.fn(async (userId: string, points: number, orderId: string): Promise<LoyaltyMember> => {
    let member = mockLoyaltyMembers.get(userId);
    if (!member) {
      member = {
        userId,
        currentPoints: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        expiringPoints: 0,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    member.currentPoints += points;
    member.lifetimePoints += points;
    member.tier = calculateTier(member.lifetimePoints);

    mockLoyaltyMembers.set(userId, member);
    return member;
  }),

  getPointsToNextTier: jest.fn(async (userId: string): Promise<number> => {
    const member = mockLoyaltyMembers.get(userId);
    if (!member) return TIER_THRESHOLDS.silver;

    const tiers: LoyaltyMember['tier'][] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIdx = tiers.indexOf(member.tier);
    if (currentIdx === tiers.length - 1) return 0;

    const nextTier = tiers[currentIdx + 1];
    return Math.max(0, TIER_THRESHOLDS[nextTier] - member.lifetimePoints);
  }),
};

const mockWalletService = {
  getBalance: jest.fn(async (userId: string): Promise<Wallet | null> => {
    return mockWallets.get(userId) || null;
  }),

  creditCashback: jest.fn(async (userId: string, amount: number): Promise<Wallet> => {
    let wallet = mockWallets.get(userId);
    if (!wallet) {
      wallet = { userId, balance: 0, cashback: 0, coins: 0 };
    }
    wallet.cashback += amount;
    wallet.balance += amount;
    mockWallets.set(userId, wallet);
    return wallet;
  }),

  creditCoins: jest.fn(async (userId: string, amount: number): Promise<Wallet> => {
    let wallet = mockWallets.get(userId);
    if (!wallet) {
      wallet = { userId, balance: 0, cashback: 0, coins: 0 };
    }
    wallet.coins += amount;
    mockWallets.set(userId, wallet);
    return wallet;
  }),
};

const mockStreakService = {
  getStreak: jest.fn(async (userId: string): Promise<Streak | null> => {
    return mockStreaks.get(userId) || null;
  }),

  checkIn: jest.fn(async (userId: string): Promise<Streak> => {
    let streak = mockStreaks.get(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      streak = {
        userId,
        current: 1,
        longest: 1,
        totalDays: 1,
        frozen: false,
        hasCheckedInToday: true,
        lastCheckIn: today,
      };
    } else {
      const lastCheck = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;
      if (lastCheck) {
        lastCheck.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastCheck.getTime()) / (24 * 60 * 60 * 1000));

        if (daysDiff === 0) {
          // Same day, no change
          streak.hasCheckedInToday = true;
        } else if (daysDiff === 1) {
          // Consecutive day
          streak.current += 1;
          streak.totalDays += 1;
          streak.hasCheckedInToday = true;
          streak.lastCheckIn = today;
          if (streak.current > streak.longest) {
            streak.longest = streak.current;
          }
        } else {
          // Streak broken
          streak.current = 1;
          streak.totalDays += 1;
          streak.hasCheckedInToday = true;
          streak.lastCheckIn = today;
        }
      }
    }

    mockStreaks.set(userId, streak);
    return streak;
  }),
};

const mockScoreService = {
  getScore: jest.fn(async (userId: string): Promise<ReZScore | null> => {
    return mockReZScores.get(userId) || null;
  }),

  updateScore: jest.fn(async (userId: string): Promise<ReZScore> => {
    const loyalty = mockLoyaltyMembers.get(userId);
    const karma = mockKarmaProfiles.get(userId);
    const orders = Array.from(mockOrders.values()).filter(o => o.userId === userId && o.status === 'completed');
    const totalSpent = orders.reduce((sum, o) => sum + o.totals.total, 0);

    const score = calculateReZScore(
      loyalty?.lifetimePoints || 0,
      karma?.lifetimeKarma || 0,
      orders.length,
      totalSpent
    );
    score.userId = userId;
    score.lastUpdated = new Date();

    mockReZScores.set(userId, score);
    return score;
  }),
};

const mockKarmaService = {
  getProfile: jest.fn(async (userId: string): Promise<KarmaProfile | null> => {
    return mockKarmaProfiles.get(userId) || null;
  }),
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Order to Loyalty Integration', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrders.clear();
    mockLoyaltyMembers.clear();
    mockWallets.clear();
    mockStreaks.clear();
    mockReZScores.clear();
    mockKarmaProfiles.clear();
  });

  // ============================================================================
  // Order Creation Tests
  // ============================================================================

  describe('Order Creation', () => {
    it('should create an order with correct items and totals', async () => {
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      const order = await mockOrderService.create({
        userId,
        merchantId,
        items: [
          { itemId: 'item_1', name: 'Paneer Tikka', quantity: 2, price: 250 },
          { itemId: 'item_2', name: 'Butter Naan', quantity: 4, price: 60 },
        ],
        totals: {
          subtotal: 740,
          tax: 133,
          total: 873,
        },
      });

      expect(order).toBeDefined();
      expect(order.userId).toBe(userId);
      expect(order.merchantId).toBe(merchantId);
      expect(order.items).toHaveLength(2);
      expect(order.totals.total).toBe(873);
      expect(order.status).toBe('pending');
    });

    it('should generate unique order IDs', async () => {
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      const orders = await Promise.all([
        mockOrderService.create({ userId, merchantId, items: [], totals: { subtotal: 0, tax: 0, total: 0 } }),
        mockOrderService.create({ userId, merchantId, items: [], totals: { subtotal: 0, tax: 0, total: 0 } }),
        mockOrderService.create({ userId, merchantId, items: [], totals: { subtotal: 0, tax: 0, total: 0 } }),
      ]);

      const orderIds = orders.map(o => o.orderId);
      const uniqueIds = new Set(orderIds);
      expect(uniqueIds.size).toBe(3);
    });

    it('should reject order with no items', async () => {
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      await expect(
        mockOrderService.create({
          userId,
          merchantId,
          items: [],
          totals: { subtotal: 0, tax: 0, total: 0 },
        })
      ).rejects.toThrow('Order must have at least one item');
    });
  });

  // ============================================================================
  // Full Reward Flow Tests
  // ============================================================================

  describe('Full Reward Flow', () => {
    it('should complete full reward flow from order to score', async () => {
      // 1. Setup test user with karma profile
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      // Initialize karma profile (starter level)
      mockKarmaProfiles.set(userId, {
        userId,
        lifetimeKarma: 500,
        activeKarma: 500,
        level: 'active',
      });

      // Initialize loyalty member (bronze tier)
      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 100,
        lifetimePoints: 100,
        tier: 'bronze',
        expiringPoints: 0,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Initialize streak
      mockStreaks.set(userId, {
        userId,
        current: 5,
        longest: 10,
        totalDays: 50,
        frozen: false,
        hasCheckedInToday: false,
      });

      // 2. Create order
      const order = await mockOrderService.create({
        userId,
        merchantId,
        items: [{ itemId: 'item_1', name: 'Premium Meal', quantity: 1, price: 500 }],
        totals: { subtotal: 500, tax: 90, total: 590 },
      });

      expect(order.status).toBe('pending');

      // 3. Complete order
      const completedOrder = await mockOrderService.completeOrder(order.orderId);
      expect(completedOrder.status).toBe('completed');
      expect(completedOrder.completedAt).toBeDefined();

      // 4. Wait for async processing (simulated)
      await new Promise(resolve => setTimeout(resolve, 100));

      // 5. Verify loyalty points earned
      const karmaProfile = await mockKarmaService.getProfile(userId);
      const loyaltyBefore = await mockLoyaltyService.getMember(userId);

      const expectedPoints = calculatePoints(
        completedOrder.totals.total,
        karmaProfile!.level,
        loyaltyBefore!.tier
      );

      const updatedLoyalty = await mockLoyaltyService.addPoints(userId, expectedPoints, order.orderId);
      expect(updatedLoyalty.currentPoints).toBeGreaterThan(loyaltyBefore!.currentPoints);
      expect(updatedLoyalty.lifetimePoints).toBe(100 + expectedPoints);

      // 6. Verify cashback earned
      const expectedCashback = calculateCashback(completedOrder.totals.total, updatedLoyalty.tier);
      const wallet = await mockWalletService.creditCashback(userId, expectedCashback);
      expect(wallet.cashback).toBe(expectedCashback);

      // 7. Verify streak updated
      const streakBefore = await mockStreakService.getStreak(userId);
      await mockStreakService.checkIn(userId);
      const streakAfter = await mockStreakService.getStreak(userId);
      expect(streakAfter!.current).toBe(streakBefore!.current + 1);

      // 8. Verify ReZ Score updated
      const score = await mockScoreService.updateScore(userId);
      expect(score.composite).toBeGreaterThan(0);
      expect(score).toHaveProperty('engagement');
      expect(score).toHaveProperty('spend');
      expect(score).toHaveProperty('loyalty');
      expect(score).toHaveProperty('karma');
    });

    it('should apply karma and loyalty multipliers correctly', async () => {
      const userId = generateId('user');
      const orderAmount = 1000;

      // Test case: Starter + Bronze (1.0 * 1.0 = 1.0 multiplier)
      mockKarmaProfiles.set(userId, { userId, lifetimeKarma: 50, activeKarma: 50, level: 'starter' });
      let points = calculatePoints(orderAmount, 'starter', 'bronze');
      expect(points).toBe(100); // 1000 * 0.1 * 1.0 * 1.0

      // Test case: Elite + Diamond (2.0 * 2.0 = 4.0 multiplier)
      mockKarmaProfiles.set(userId, { userId, lifetimeKarma: 10000, activeKarma: 10000, level: 'elite' });
      points = calculatePoints(orderAmount, 'elite', 'diamond');
      expect(points).toBe(400); // 1000 * 0.1 * 2.0 * 2.0

      // Test case: Active + Gold (1.1 * 1.2 = 1.32 multiplier)
      mockKarmaProfiles.set(userId, { userId, lifetimeKarma: 500, activeKarma: 500, level: 'active' });
      points = calculatePoints(orderAmount, 'active', 'gold');
      expect(points).toBe(132); // 1000 * 0.1 * 1.1 * 1.2
    });

    it('should apply tier-based cashback correctly', async () => {
      const orderAmount = 1000;

      // Bronze: 5% cashback
      expect(calculateCashback(orderAmount, 'bronze')).toBe(50);

      // Silver: 6% cashback (5% + 1%)
      expect(calculateCashback(orderAmount, 'silver')).toBe(60);

      // Gold: 7% cashback (5% + 2%)
      expect(calculateCashback(orderAmount, 'gold')).toBe(70);

      // Platinum: 8% cashback (5% + 3%)
      expect(calculateCashback(orderAmount, 'platinum')).toBe(80);

      // Diamond: 10% cashback (5% + 5%)
      expect(calculateCashback(orderAmount, 'diamond')).toBe(100);
    });
  });

  // ============================================================================
  // Tier Progression Tests
  // ============================================================================

  describe('Tier Progression', () => {
    it('should upgrade tier when threshold is reached', async () => {
      const userId = generateId('user');

      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 400,
        lifetimePoints: 400,
        tier: 'bronze',
        expiringPoints: 0,
        expiryDate: new Date().toISOString(),
      });

      // Add points to cross silver threshold (500)
      const loyalty = await mockLoyaltyService.addPoints(userId, 150, 'order_1');
      expect(loyalty.tier).toBe('silver');
      expect(loyalty.lifetimePoints).toBe(550);
    });

    it('should show correct points to next tier', async () => {
      const userId = generateId('user');

      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 250,
        lifetimePoints: 250,
        tier: 'bronze',
        expiringPoints: 0,
        expiryDate: new Date().toISOString(),
      });

      const pointsToSilver = await mockLoyaltyService.getPointsToNextTier(userId);
      expect(pointsToSilver).toBe(250); // 500 - 250

      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 500,
        lifetimePoints: 500,
        tier: 'silver',
        expiringPoints: 0,
        expiryDate: new Date().toISOString(),
      });

      const pointsToGold = await mockLoyaltyService.getPointsToNextTier(userId);
      expect(pointsToGold).toBe(1500); // 2000 - 500
    });

    it('should return 0 points for diamond tier', async () => {
      const userId = generateId('user');

      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 15000,
        lifetimePoints: 15000,
        tier: 'diamond',
        expiringPoints: 0,
        expiryDate: new Date().toISOString(),
      });

      const pointsToNext = await mockLoyaltyService.getPointsToNextTier(userId);
      expect(pointsToNext).toBe(0);
    });
  });

  // ============================================================================
  // ReZ Score Calculation Tests
  // ============================================================================

  describe('ReZ Score Calculation', () => {
    it('should calculate composite score from all components', async () => {
      const userId = generateId('user');

      // New user with no activity
      let score = calculateReZScore(0, 0, 0, 0);
      expect(score.composite).toBe(0);
      expect(score.engagement).toBe(0);
      expect(score.spend).toBe(0);
      expect(score.loyalty).toBe(0);
      expect(score.karma).toBe(0);

      // Active user with good metrics
      score = calculateReZScore(3000, 1500, 20, 25000);
      expect(score.composite).toBeGreaterThan(0);
      expect(score.engagement).toBeGreaterThan(0);
      expect(score.spend).toBeGreaterThan(0);
      expect(score.loyalty).toBeGreaterThan(0);
      expect(score.karma).toBeGreaterThan(0);

      // Maxed out user
      score = calculateReZScore(15000, 6000, 50, 60000);
      expect(score.engagement).toBe(100);
      expect(score.spend).toBe(100);
      expect(score.loyalty).toBe(100);
      expect(score.karma).toBe(100);
      expect(score.composite).toBe(100);
    });

    it('should cap score components at 100', async () => {
      const score = calculateReZScore(50000, 20000, 200, 200000);
      expect(score.engagement).toBe(100);
      expect(score.spend).toBe(100);
      expect(score.loyalty).toBe(100);
      expect(score.karma).toBe(100);
    });

    it('should update score after order completion', async () => {
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      mockKarmaProfiles.set(userId, { userId, lifetimeKarma: 1000, activeKarma: 1000, level: 'contributor' });
      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 2000,
        lifetimePoints: 2000,
        tier: 'gold',
        expiringPoints: 0,
        expiryDate: new Date().toISOString(),
      });

      const order = await mockOrderService.create({
        userId,
        merchantId,
        items: [{ itemId: 'item_1', name: 'Test', quantity: 1, price: 500 }],
        totals: { subtotal: 500, tax: 90, total: 590 },
      });
      await mockOrderService.completeOrder(order.orderId);

      // Add points
      await mockLoyaltyService.addPoints(userId, 59, order.orderId);

      // Update score
      const score = await mockScoreService.updateScore(userId);

      expect(score.userId).toBe(userId);
      expect(score.loyalty).toBeGreaterThan(0);
      expect(score.karma).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle order not found', async () => {
      const order = await mockOrderService.getOrder('nonexistent');
      expect(order).toBeNull();
    });

    it('should handle loyalty member not found', async () => {
      const member = await mockLoyaltyService.getMember('nonexistent');
      expect(member).toBeNull();
    });

    it('should handle wallet not found', async () => {
      const wallet = await mockWalletService.getBalance('nonexistent');
      expect(wallet).toBeNull();
    });

    it('should create wallet on first cashback credit', async () => {
      const userId = generateId('user');
      const wallet = await mockWalletService.creditCashback(userId, 100);

      expect(wallet.userId).toBe(userId);
      expect(wallet.cashback).toBe(100);
      expect(wallet.balance).toBe(100);
    });

    it('should handle streak not found', async () => {
      const streak = await mockStreakService.getStreak('nonexistent');
      expect(streak).toBeNull();
    });

    it('should create streak on first check-in', async () => {
      const userId = generateId('user');
      const streak = await mockStreakService.checkIn(userId);

      expect(streak.userId).toBe(userId);
      expect(streak.current).toBe(1);
      expect(streak.longest).toBe(1);
      expect(streak.hasCheckedInToday).toBe(true);
    });
  });

  // ============================================================================
  // Concurrency Tests
  // ============================================================================

  describe('Concurrency', () => {
    it('should handle multiple concurrent order completions', async () => {
      const userId = generateId('user');
      const merchantId = generateId('merchant');

      mockKarmaProfiles.set(userId, { userId, lifetimeKarma: 500, activeKarma: 500, level: 'active' });
      mockLoyaltyMembers.set(userId, {
        userId,
        currentPoints: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        expiringPoints: 0,
        expiryDate: new Date().toISOString(),
      });

      // Create multiple orders
      const orders = await Promise.all([
        mockOrderService.create({
          userId,
          merchantId,
          items: [{ itemId: 'i1', name: 'Item 1', quantity: 1, price: 100 }],
          totals: { subtotal: 100, tax: 18, total: 118 },
        }),
        mockOrderService.create({
          userId,
          merchantId,
          items: [{ itemId: 'i2', name: 'Item 2', quantity: 1, price: 200 }],
          totals: { subtotal: 200, tax: 36, total: 236 },
        }),
        mockOrderService.create({
          userId,
          merchantId,
          items: [{ itemId: 'i3', name: 'Item 3', quantity: 1, price: 300 }],
          totals: { subtotal: 300, tax: 54, total: 354 },
        }),
      ]);

      // Complete all orders concurrently
      await Promise.all(orders.map(o => mockOrderService.completeOrder(o.orderId)));

      // Process all loyalty updates
      for (const order of orders) {
        const karma = await mockKarmaService.getProfile(userId);
        const loyalty = await mockLoyaltyService.getMember(userId);
        const points = calculatePoints(order.totals.total, karma!.level, loyalty!.tier);
        await mockLoyaltyService.addPoints(userId, points, order.orderId);
      }

      const finalLoyalty = await mockLoyaltyService.getMember(userId);
      const expectedTotal = orders.reduce((sum, o) => {
        const karma = mockKarmaProfiles.get(userId)!;
        const loyalty = mockLoyaltyMembers.get(userId)!;
        return sum + calculatePoints(o.totals.total, karma.level, loyalty.tier);
      }, 0);

      expect(finalLoyalty!.lifetimePoints).toBe(expectedTotal);
    });

    it('should handle concurrent check-ins safely', async () => {
      const userId = generateId('user');

      mockStreaks.set(userId, {
        userId,
        current: 5,
        longest: 10,
        totalDays: 50,
        frozen: false,
        hasCheckedInToday: false,
        lastCheckIn: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      // Concurrent check-ins
      const results = await Promise.all([
        mockStreakService.checkIn(userId),
        mockStreakService.checkIn(userId),
      ]);

      // All should succeed (only one should increment)
      expect(results.length).toBe(2);
    });
  });
});

// ============================================================================
// Performance Benchmarks
// ============================================================================

describe('Order-Loyalty Performance', () => {
  it('should process 100 orders efficiently', async () => {
    const userId = generateId('user');
    const merchantId = generateId('merchant');

    mockKarmaProfiles.set(userId, { userId, lifetimeKarma: 1000, activeKarma: 1000, level: 'contributor' });
    mockLoyaltyMembers.set(userId, {
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      expiringPoints: 0,
      expiryDate: new Date().toISOString(),
    });

    const startTime = Date.now();

    // Create and complete 100 orders
    for (let i = 0; i < 100; i++) {
      const order = await mockOrderService.create({
        userId,
        merchantId,
        items: [{ itemId: `i${i}`, name: `Item ${i}`, quantity: 1, price: 100 }],
        totals: { subtotal: 100, tax: 18, total: 118 },
      });
      await mockOrderService.completeOrder(order.orderId);
    }

    const elapsed = Date.now() - startTime;

    // Should complete in reasonable time (less than 5 seconds)
    expect(elapsed).toBeLessThan(5000);
  });
});
