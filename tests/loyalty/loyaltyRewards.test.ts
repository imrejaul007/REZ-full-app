/**
 * Integration Tests - Loyalty Rewards System
 *
 * Tests for:
 * - Points earning and redemption
 * - Tier management and upgrades
 * - Reward calculations across tiers
 * - Multi-service reward distribution
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
type RewardType = 'cashback' | 'coins' | 'points' | 'discount';
type TransactionType = 'earn' | 'redeem' | 'expire' | 'bonus' | 'refund';

interface LoyaltyTierConfig {
  name: LoyaltyTier;
  minPoints: number;
  multiplier: number;
  cashbackPercent: number;
  perks: string[];
}

interface RewardPolicy {
  pointsPerRupee: number;
  coinsPerRupee: number;
  minRedemption: number;
  expiryDays: number;
  tierMultipliers: Record<LoyaltyTier, number>;
}

interface LoyaltyAccount {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  expiringPoints: number;
  tier: LoyaltyTier;
  createdAt: Date;
  lastActivityAt: Date;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  expiresAt?: Date;
  createdAt: Date;
}

interface Redemption {
  id: string;
  userId: string;
  type: RewardType;
  amount: number;
  pointsCost: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface Milestone {
  id: string;
  name: string;
  target: number;
  progress: number;
  reward: { type: RewardType; amount: number };
  unlocked: boolean;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockAccount(overrides?: Partial<LoyaltyAccount>): LoyaltyAccount {
  return {
    userId: 'user_123',
    currentPoints: 0,
    lifetimePoints: 0,
    expiringPoints: 0,
    tier: 'bronze',
    createdAt: new Date(),
    lastActivityAt: new Date(),
    transactions: [],
    ...overrides,
  };
}

function generateMockTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    id: `txn_${Math.random().toString(36).substring(7)}`,
    type: 'earn',
    amount: 100,
    balance: 100,
    description: 'Test transaction',
    createdAt: new Date(),
    ...overrides,
  };
}

// ============================================================================
// Configuration
// ============================================================================

const TIER_CONFIGS: LoyaltyTierConfig[] = [
  { name: 'bronze', minPoints: 0, multiplier: 1.0, cashbackPercent: 1, perks: ['Basic rewards'] },
  { name: 'silver', minPoints: 500, multiplier: 1.1, cashbackPercent: 2, perks: ['Basic rewards', 'Birthday bonus'] },
  { name: 'gold', minPoints: 2000, multiplier: 1.25, cashbackPercent: 3, perks: ['Basic rewards', 'Birthday bonus', 'Priority support'] },
  { name: 'platinum', minPoints: 5000, multiplier: 1.5, cashbackPercent: 5, perks: ['Basic rewards', 'Birthday bonus', 'Priority support', 'Free delivery'] },
  { name: 'diamond', minPoints: 10000, multiplier: 2.0, cashbackPercent: 8, perks: ['Basic rewards', 'Birthday bonus', 'Priority support', 'Free delivery', 'VIP events', 'Personal concierge'] },
];

const DEFAULT_REWARD_POLICY: RewardPolicy = {
  pointsPerRupee: 0.1, // 0.1 points per rupee
  coinsPerRupee: 0.01, // 0.01 coins per rupee
  minRedemption: 100,
  expiryDays: 365,
  tierMultipliers: {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.25,
    platinum: 1.5,
    diamond: 2.0,
  },
};

// ============================================================================
// Loyalty Rewards Service (Mock)
// ============================================================================

class LoyaltyRewardsService {
  private account: LoyaltyAccount;
  private policy: RewardPolicy;
  private milestones: Milestone[];

  constructor(account: LoyaltyAccount, policy: RewardPolicy = DEFAULT_REWARD_POLICY) {
    this.account = account;
    this.policy = policy;
    this.milestones = this.initializeMilestones();
  }

  private initializeMilestones(): Milestone[] {
    return [
      { id: 'first_order', name: 'First Order', target: 1, progress: 0, reward: { type: 'coins', amount: 100 }, unlocked: false },
      { id: 'five_orders', name: 'Regular Customer', target: 5, progress: 0, reward: { type: 'coins', amount: 500 }, unlocked: false },
      { id: 'ten_orders', name: 'Loyal Customer', target: 10, progress: 0, reward: { type: 'cashback', amount: 10 }, unlocked: false },
      { id: 'twenty_five_orders', name: 'Super Fan', target: 25, progress: 0, reward: { type: 'coins', amount: 2000 }, unlocked: false },
      { id: 'fifty_orders', name: 'Legend', target: 50, progress: 0, reward: { type: 'discount', amount: 25 }, unlocked: false },
    ];
  }

  async getAccount(): Promise<LoyaltyAccount> {
    return { ...this.account };
  }

  async earnPoints(amount: number, description: string): Promise<Transaction> {
    const multiplier = this.policy.tierMultipliers[this.account.tier];
    const earnedPoints = Math.floor(amount * this.policy.pointsPerRupee * multiplier);
    const earnedCoins = Math.floor(amount * this.policy.coinsPerRupee * multiplier);

    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'earn',
      amount: earnedPoints,
      balance: this.account.currentPoints + earnedPoints,
      description,
      expiresAt: new Date(Date.now() + this.policy.expiryDays * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    this.account.currentPoints += earnedPoints;
    this.account.lifetimePoints += earnedPoints;
    this.account.expiringPoints += earnedPoints;
    this.account.lastActivityAt = new Date();
    this.account.transactions.push(transaction);

    this.checkTierUpgrade();
    this.checkMilestones();

    return transaction;
  }

  async redeemPoints(points: number, type: RewardType): Promise<Redemption> {
    if (points < this.policy.minRedemption) {
      throw new Error(`Minimum redemption is ${this.policy.minRedemption} points`);
    }

    if (points > this.account.currentPoints) {
      throw new Error('Insufficient points');
    }

    const redemption: Redemption = {
      id: `red_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId: this.account.userId,
      type,
      amount: points, // Would convert to actual reward value
      pointsCost: points,
      status: 'completed',
      createdAt: new Date(),
    };

    this.account.currentPoints -= points;
    this.account.lastActivityAt = new Date();

    const transaction: Transaction = {
      id: redemption.id,
      type: 'redeem',
      amount: -points,
      balance: this.account.currentPoints,
      description: `Redeemed for ${type}`,
      createdAt: new Date(),
    };

    this.account.transactions.push(transaction);

    return redemption;
  }

  async calculateCashback(orderAmount: number): Promise<number> {
    const tierConfig = TIER_CONFIGS.find(t => t.name === this.account.tier);
    const cashbackPercent = tierConfig?.cashbackPercent || 1;
    return Math.floor(orderAmount * cashbackPercent / 100);
  }

  private checkTierUpgrade(): void {
    const currentTierIndex = TIER_CONFIGS.findIndex(t => t.name === this.account.tier);

    for (let i = TIER_CONFIGS.length - 1; i > currentTierIndex; i--) {
      if (this.account.lifetimePoints >= TIER_CONFIGS[i].minPoints) {
        if (this.account.tier !== TIER_CONFIGS[i].name) {
          this.account.tier = TIER_CONFIGS[i].name;
        }
        break;
      }
    }
  }

  private checkMilestones(): void {
    const orderCount = this.account.transactions.filter(t => t.type === 'earn').length;

    for (const milestone of this.milestones) {
      if (!milestone.unlocked && orderCount >= milestone.target) {
        milestone.progress = milestone.target;
        milestone.unlocked = true;
      } else if (!milestone.unlocked) {
        milestone.progress = orderCount;
      }
    }
  }

  async getMilestones(): Promise<Milestone[]> {
    return [...this.milestones];
  }

  async getNextMilestone(): Promise<Milestone | null> {
    return this.milestones.find(m => !m.unlocked) || null;
  }

  async getTierConfig(): Promise<LoyaltyTierConfig | undefined> {
    return TIER_CONFIGS.find(t => t.name === this.account.tier);
  }

  async getPointsToNextTier(): Promise<number> {
    const currentTierIndex = TIER_CONFIGS.findIndex(t => t.name === this.account.tier);

    if (currentTierIndex === TIER_CONFIGS.length - 1) {
      return 0; // Already at max tier
    }

    const nextTierConfig = TIER_CONFIGS[currentTierIndex + 1];
    return Math.max(0, nextTierConfig.minPoints - this.account.lifetimePoints);
  }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Loyalty Rewards', () => {

  describe('Points Earning', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(() => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
    });

    it('should earn base points for order', async () => {
      const transaction = await service.earnPoints(1000, 'Order payment');

      expect(transaction.amount).toBe(100); // 1000 * 0.1
      expect(transaction.type).toBe('earn');
    });

    it('should apply tier multiplier for silver', async () => {
      account.tier = 'silver';
      const transaction = await service.earnPoints(1000, 'Order payment');

      expect(transaction.amount).toBe(110); // 1000 * 0.1 * 1.1
    });

    it('should apply tier multiplier for gold', async () => {
      account.tier = 'gold';
      const transaction = await service.earnPoints(1000, 'Order payment');

      expect(transaction.amount).toBe(125); // 1000 * 0.1 * 1.25
    });

    it('should apply tier multiplier for platinum', async () => {
      account.tier = 'platinum';
      const transaction = await service.earnPoints(1000, 'Order payment');

      expect(transaction.amount).toBe(150); // 1000 * 0.1 * 1.5
    });

    it('should apply tier multiplier for diamond', async () => {
      account.tier = 'diamond';
      const transaction = await service.earnPoints(1000, 'Order payment');

      expect(transaction.amount).toBe(200); // 1000 * 0.1 * 2.0
    });

    it('should update account balance', async () => {
      await service.earnPoints(1000, 'Order payment');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.currentPoints).toBe(100);
      expect(updatedAccount.lifetimePoints).toBe(100);
    });

    it('should accumulate points from multiple orders', async () => {
      await service.earnPoints(500, 'Order 1');
      await service.earnPoints(500, 'Order 2');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.currentPoints).toBe(100);
      expect(updatedAccount.lifetimePoints).toBe(100);
    });

    it('should set expiry date on points', async () => {
      const transaction = await service.earnPoints(1000, 'Order payment');

      expect(transaction.expiresAt).toBeDefined();
      expect(transaction.expiresAt?.getTime()).toBeGreaterThan(Date.now());
    });

    it('should record transaction', async () => {
      await service.earnPoints(1000, 'Order payment');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.transactions.length).toBe(1);
      expect(updatedAccount.transactions[0].type).toBe('earn');
    });
  });

  describe('Points Redemption', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(async () => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
      await service.earnPoints(5000, 'Initial deposit');
    });

    it('should redeem points successfully', async () => {
      const redemption = await service.redeemPoints(100, 'coins');

      expect(redemption.status).toBe('completed');
      expect(redemption.pointsCost).toBe(100);
    });

    it('should deduct points from balance', async () => {
      await service.redeemPoints(100, 'coins');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.currentPoints).toBe(400); // 500 - 100
    });

    it('should throw error for insufficient points', async () => {
      await expect(service.redeemPoints(1000, 'coins')).rejects.toThrow('Insufficient points');
    });

    it('should throw error below minimum redemption', async () => {
      await expect(service.redeemPoints(50, 'coins')).rejects.toThrow(`Minimum redemption is ${DEFAULT_REWARD_POLICY.minRedemption} points`);
    });

    it('should record redemption transaction', async () => {
      await service.redeemPoints(100, 'coins');

      const updatedAccount = await service.getAccount();
      const redemptionTx = updatedAccount.transactions.find(t => t.type === 'redeem');
      expect(redemptionTx).toBeDefined();
      expect(redemptionTx?.amount).toBe(-100);
    });
  });

  describe('Tier Management', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(() => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
    });

    it('should start at bronze tier', async () => {
      const tierConfig = await service.getTierConfig();

      expect(tierConfig?.name).toBe('bronze');
    });

    it('should upgrade to silver tier', async () => {
      await service.earnPoints(50000, 'Large order'); // 5000 points

      const tierConfig = await service.getTierConfig();
      expect(tierConfig?.name).toBe('silver');
    });

    it('should upgrade to gold tier', async () => {
      await service.earnPoints(200000, 'Large order'); // 20000 points

      const tierConfig = await service.getTierConfig();
      expect(tierConfig?.name).toBe('gold');
    });

    it('should upgrade to platinum tier', async () => {
      await service.earnPoints(500000, 'Large order'); // 50000 points

      const tierConfig = await service.getTierConfig();
      expect(tierConfig?.name).toBe('platinum');
    });

    it('should upgrade to diamond tier', async () => {
      await service.earnPoints(1000000, 'Large order'); // 100000 points

      const tierConfig = await service.getTierConfig();
      expect(tierConfig?.name).toBe('diamond');
    });

    it('should calculate points to next tier', async () => {
      await service.earnPoints(2500, 'Order'); // 250 points

      const pointsToNext = await service.getPointsToNextTier();
      expect(pointsToNext).toBe(250); // 500 - 250
    });

    it('should return 0 for max tier', async () => {
      account.tier = 'diamond';
      account.lifetimePoints = 15000;

      const pointsToNext = await service.getPointsToNextTier();
      expect(pointsToNext).toBe(0);
    });

    it('should include tier perks', async () => {
      account.tier = 'gold';
      const tierConfig = await service.getTierConfig();

      expect(tierConfig?.perks).toContain('Birthday bonus');
      expect(tierConfig?.perks).toContain('Priority support');
    });
  });

  describe('Cashback Calculation', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(() => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
    });

    it('should calculate bronze cashback', async () => {
      const cashback = await service.calculateCashback(1000);
      expect(cashback).toBe(10); // 1%
    });

    it('should calculate silver cashback', async () => {
      account.tier = 'silver';
      const cashback = await service.calculateCashback(1000);
      expect(cashback).toBe(20); // 2%
    });

    it('should calculate gold cashback', async () => {
      account.tier = 'gold';
      const cashback = await service.calculateCashback(1000);
      expect(cashback).toBe(30); // 3%
    });

    it('should calculate platinum cashback', async () => {
      account.tier = 'platinum';
      const cashback = await service.calculateCashback(1000);
      expect(cashback).toBe(50); // 5%
    });

    it('should calculate diamond cashback', async () => {
      account.tier = 'diamond';
      const cashback = await service.calculateCashback(1000);
      expect(cashback).toBe(80); // 8%
    });

    it('should handle decimal amounts', async () => {
      account.tier = 'bronze';
      const cashback = await service.calculateCashback(999.99);
      expect(cashback).toBe(9); // floor(1% of 999.99)
    });
  });

  describe('Milestones', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(() => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
    });

    it('should track milestone progress', async () => {
      await service.earnPoints(5000, 'Order 1');
      await service.earnPoints(5000, 'Order 2');

      const milestones = await service.getMilestones();
      const firstOrder = milestones.find(m => m.id === 'first_order');

      expect(firstOrder?.unlocked).toBe(true);
    });

    it('should unlock milestone rewards', async () => {
      // First order
      await service.earnPoints(5000, 'First order');

      const milestones = await service.getMilestones();
      const firstOrder = milestones.find(m => m.id === 'first_order');

      expect(firstOrder?.unlocked).toBe(true);
      expect(firstOrder?.reward.type).toBe('coins');
      expect(firstOrder?.reward.amount).toBe(100);
    });

    it('should get next milestone', async () => {
      await service.earnPoints(5000, 'First order');

      const nextMilestone = await service.getNextMilestone();

      expect(nextMilestone?.id).toBe('five_orders');
    });

    it('should return null when all milestones complete', async () => {
      // Complete all milestones
      for (let i = 0; i < 50; i++) {
        await service.earnPoints(5000, `Order ${i + 1}`);
      }

      const nextMilestone = await service.getNextMilestone();
      expect(nextMilestone).toBeNull();
    });

    it('should update progress for incomplete milestones', async () => {
      await service.earnPoints(5000, 'First order');

      const milestones = await service.getMilestones();
      const fiveOrders = milestones.find(m => m.id === 'five_orders');

      expect(fiveOrders?.progress).toBe(1);
      expect(fiveOrders?.unlocked).toBe(false);
    });
  });

  describe('Account State', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(() => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
    });

    it('should track last activity', async () => {
      const beforeActivity = new Date();
      await service.earnPoints(1000, 'Order');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.lastActivityAt.getTime()).toBeGreaterThanOrEqual(beforeActivity.getTime());
    });

    it('should accumulate expiring points', async () => {
      await service.earnPoints(1000, 'Order');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.expiringPoints).toBe(100);
    });

    it('should track transaction history', async () => {
      await service.earnPoints(500, 'Order 1');
      await service.earnPoints(500, 'Order 2');
      await service.redeemPoints(100, 'coins');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.transactions.length).toBe(3);
    });

    it('should maintain consistent balance', async () => {
      await service.earnPoints(1000, 'Order 1');
      await service.earnPoints(500, 'Order 2');
      await service.redeemPoints(50, 'coins');

      const updatedAccount = await service.getAccount();
      expect(updatedAccount.currentPoints).toBe(100); // 100 + 50 - 50

      const lastTx = updatedAccount.transactions[updatedAccount.transactions.length - 1];
      expect(lastTx.balance).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    let service: LoyaltyRewardsService;
    let account: LoyaltyAccount;

    beforeEach(() => {
      account = generateMockAccount();
      service = new LoyaltyRewardsService(account);
    });

    it('should handle zero amount', async () => {
      const transaction = await service.earnPoints(0, 'Empty order');
      expect(transaction.amount).toBe(0);
    });

    it('should handle very small amounts', async () => {
      const transaction = await service.earnPoints(1, 'Minimal order');
      expect(transaction.amount).toBe(0); // 1 * 0.1 = 0.1 -> floor -> 0
    });

    it('should handle very large amounts', async () => {
      const transaction = await service.earnPoints(100000000, 'Huge order');
      expect(transaction.amount).toBeGreaterThan(0);
    });

    it('should handle exact tier threshold', async () => {
      // Exact 500 points for silver
      await service.earnPoints(5000, 'Order');

      const tierConfig = await service.getTierConfig();
      expect(tierConfig?.name).toBe('silver');
    });

    it('should handle multiple redemptions', async () => {
      await service.earnPoints(10000, 'Initial');

      await service.redeemPoints(200, 'coins');
      await service.redeemPoints(300, 'coins');

      const account = await service.getAccount();
      expect(account.currentPoints).toBe(500); // 1000 - 200 - 300
    });
  });
});
