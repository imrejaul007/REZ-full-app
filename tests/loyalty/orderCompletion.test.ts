/**
 * Integration Tests - Order Completion Flow
 *
 * Tests for:
 * - Complete order completion flow
 * - Multi-service integration (loyalty, wallet, streak, score)
 * - Event-driven updates
 * - Data consistency across services
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

interface Order {
  orderId: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  totalAmount: number;
  cashbackEarned: number;
  pointsEarned: number;
  status: OrderStatus;
  createdAt: Date;
  completedAt?: Date;
}

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  tier: LoyaltyTier;
  karmaLevel: KarmaLevel;
  createdAt: Date;
}

interface WalletState {
  userId: string;
  cashback: number;
  coins: number;
  lockedCoins: number;
}

interface LoyaltyState {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  pointsToNextTier: number;
}

interface StreakState {
  userId: string;
  loginStreak: number;
  orderStreak: number;
  lastOrderAt: Date | null;
}

interface ScoreState {
  userId: string;
  totalScore: number;
  monthlyScore: number;
  weeklyScore: number;
}

interface SystemState {
  user: UserProfile;
  wallet: WalletState;
  loyalty: LoyaltyState;
  streak: StreakState;
  score: ScoreState;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockOrder(overrides?: Partial<Order>): Order {
  return {
    orderId: `order_${Math.random().toString(36).substring(7)}`,
    userId: 'user_123',
    merchantId: 'merchant_001',
    items: [
      { itemId: 'item_1', name: 'Product 1', quantity: 2, price: 250 },
      { itemId: 'item_2', name: 'Product 2', quantity: 1, price: 500 },
    ],
    totalAmount: 1000,
    cashbackEarned: 0,
    pointsEarned: 0,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

function generateMockSystemState(): SystemState {
  return {
    user: {
      userId: 'user_123',
      name: 'Test User',
      email: 'test@example.com',
      tier: 'bronze',
      karmaLevel: 'starter',
      createdAt: new Date('2024-01-01'),
    },
    wallet: {
      userId: 'user_123',
      cashback: 0,
      coins: 0,
      lockedCoins: 0,
    },
    loyalty: {
      userId: 'user_123',
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      pointsToNextTier: 500,
    },
    streak: {
      userId: 'user_123',
      loginStreak: 0,
      orderStreak: 0,
      lastOrderAt: null,
    },
    score: {
      userId: 'user_123',
      totalScore: 0,
      monthlyScore: 0,
      weeklyScore: 0,
    },
  };
}

// ============================================================================
// Service Mocks
// ============================================================================

class MockLoyaltyService {
  private state: LoyaltyState;

  constructor(initialState: LoyaltyState) {
    this.state = { ...initialState };
  }

  async getState(): Promise<LoyaltyState> {
    return { ...this.state };
  }

  async addPoints(amount: number): Promise<LoyaltyState> {
    this.state.currentPoints += amount;
    this.state.lifetimePoints += amount;
    this.updateTier();
    return { ...this.state };
  }

  async checkTierUpgrade(): Promise<{ upgraded: boolean; newTier?: LoyaltyTier }> {
    const oldTier = this.state.tier;
    this.updateTier();
    if (this.state.tier !== oldTier) {
      return { upgraded: true, newTier: this.state.tier };
    }
    return { upgraded: false };
  }

  private updateTier(): void {
    if (this.state.lifetimePoints >= 5000) {
      this.state.tier = 'platinum';
      this.state.pointsToNextTier = 0;
    } else if (this.state.lifetimePoints >= 2000) {
      this.state.tier = 'gold';
      this.state.pointsToNextTier = 5000 - this.state.lifetimePoints;
    } else if (this.state.lifetimePoints >= 500) {
      this.state.tier = 'silver';
      this.state.pointsToNextTier = 2000 - this.state.lifetimePoints;
    } else {
      this.state.tier = 'bronze';
      this.state.pointsToNextTier = 500 - this.state.lifetimePoints;
    }
  }
}

class MockWalletService {
  private state: WalletState;

  constructor(initialState: WalletState) {
    this.state = { ...initialState };
  }

  async getBalance(): Promise<WalletState> {
    return { ...this.state };
  }

  async creditCashback(amount: number): Promise<WalletState> {
    this.state.cashback += amount;
    return { ...this.state };
  }

  async creditCoins(amount: number): Promise<WalletState> {
    this.state.coins += amount;
    return { ...this.state };
  }
}

class MockStreakService {
  private state: StreakState;

  constructor(initialState: StreakState) {
    this.state = { ...initialState };
  }

  async getStreak(): Promise<StreakState> {
    return { ...this.state };
  }

  async recordOrder(): Promise<StreakState> {
    const now = new Date();

    if (this.state.lastOrderAt) {
      const daysSinceLastOrder = Math.floor(
        (now.getTime() - this.state.lastOrderAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysSinceLastOrder <= 1) {
        this.state.orderStreak += 1;
      } else {
        this.state.orderStreak = 1;
      }
    } else {
      this.state.orderStreak = 1;
    }

    this.state.lastOrderAt = now;
    return { ...this.state };
  }
}

class MockScoreService {
  private state: ScoreState;

  constructor(initialState: ScoreState) {
    this.state = { ...initialState };
  }

  async getScore(): Promise<ScoreState> {
    return { ...this.state };
  }

  async addScore(amount: number): Promise<ScoreState> {
    this.state.totalScore += amount;
    this.state.monthlyScore += amount;
    this.state.weeklyScore += amount;
    return { ...this.state };
  }
}

// ============================================================================
// Order Service (Integration)
// ============================================================================

class OrderService {
  private loyaltyService: MockLoyaltyService;
  private walletService: MockWalletService;
  private streakService: MockStreakService;
  private scoreService: MockScoreService;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(services: {
    loyalty: MockLoyaltyService;
    wallet: MockWalletService;
    streak: MockStreakService;
    score: MockScoreService;
  }) {
    this.loyaltyService = services.loyalty;
    this.walletService = services.wallet;
    this.streakService = services.streak;
    this.scoreService = services.score;
  }

  async completeOrder(order: Order): Promise<Order> {
    // Calculate rewards based on amount
    const cashbackPercent = this.getCashbackPercent();
    const pointsPerRupee = this.getPointsPerRupee();

    order.cashbackEarned = Math.floor(order.totalAmount * cashbackPercent / 100);
    order.pointsEarned = Math.floor(order.totalAmount * pointsPerRupee);

    // Update all services
    await Promise.all([
      this.loyaltyService.addPoints(order.pointsEarned),
      this.walletService.creditCashback(order.cashbackEarned),
      this.walletService.creditCoins(order.pointsEarned),
      this.streakService.recordOrder(),
      this.scoreService.addScore(order.pointsEarned),
    ]);

    // Check for tier upgrade
    const upgrade = await this.loyaltyService.checkTierUpgrade();
    if (upgrade.upgraded && upgrade.newTier) {
      this.emit('tier_upgraded', {
        userId: order.userId,
        newTier: upgrade.newTier,
      });
    }

    // Update order status
    order.status = 'completed';
    order.completedAt = new Date();

    // Emit completion event
    this.emit('order_completed', {
      orderId: order.orderId,
      userId: order.userId,
      cashbackEarned: order.cashbackEarned,
      pointsEarned: order.pointsEarned,
    });

    return order;
  }

  private getCashbackPercent(): number {
    // Would get from user tier in real implementation
    return 2; // 2% base cashback
  }

  private getPointsPerRupee(): number {
    // 1 point per 10 rupees
    return 0.1;
  }

  on(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Order Completion Flow', () => {
  let systemState: SystemState;
  let loyaltyService: MockLoyaltyService;
  let walletService: MockWalletService;
  let streakService: MockStreakService;
  let scoreService: MockScoreService;
  let orderService: OrderService;

  beforeEach(() => {
    systemState = generateMockSystemState();
    loyaltyService = new MockLoyaltyService({ ...systemState.loyalty });
    walletService = new MockWalletService({ ...systemState.wallet });
    streakService = new MockStreakService({ ...systemState.streak });
    scoreService = new MockScoreService({ ...systemState.score });

    orderService = new OrderService({
      loyalty: loyaltyService,
      wallet: walletService,
      streak: streakService,
      score: scoreService,
    });
  });

  describe('Order Completion', () => {
    it('should complete order successfully', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      const completedOrder = await orderService.completeOrder(order);

      expect(completedOrder.status).toBe('completed');
      expect(completedOrder.completedAt).toBeDefined();
    });

    it('should calculate cashback correctly', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      const completedOrder = await orderService.completeOrder(order);

      expect(completedOrder.cashbackEarned).toBe(20); // 2% of 1000
    });

    it('should calculate points correctly', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      const completedOrder = await orderService.completeOrder(order);

      expect(completedOrder.pointsEarned).toBe(100); // 1000 * 0.1
    });
  });

  describe('Loyalty Points Update', () => {
    it('should add points to loyalty account', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const loyalty = await loyaltyService.getState();
      expect(loyalty.currentPoints).toBe(100);
      expect(loyalty.lifetimePoints).toBe(100);
    });

    it('should accumulate points from multiple orders', async () => {
      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));
      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));

      const loyalty = await loyaltyService.getState();
      expect(loyalty.lifetimePoints).toBe(100);
    });

    it('should update points to next tier', async () => {
      const order = generateMockOrder({ totalAmount: 10000 }); // 1000 points

      await orderService.completeOrder(order);

      const loyalty = await loyaltyService.getState();
      expect(loyalty.tier).toBe('silver');
      expect(loyalty.pointsToNextTier).toBe(1000); // 2000 - 1000
    });
  });

  describe('Wallet Updates', () => {
    it('should credit cashback to wallet', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const wallet = await walletService.getBalance();
      expect(wallet.cashback).toBe(20);
    });

    it('should credit coins to wallet', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const wallet = await walletService.getBalance();
      expect(wallet.coins).toBe(100);
    });

    it('should accumulate wallet balance', async () => {
      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));
      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));

      const wallet = await walletService.getBalance();
      expect(wallet.cashback).toBe(20); // 2% of 1000
      expect(wallet.coins).toBe(100);
    });
  });

  describe('Streak Updates', () => {
    it('should increment order streak', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const streak = await streakService.getStreak();
      expect(streak.orderStreak).toBe(1);
    });

    it('should continue streak for consecutive days', async () => {
      // First order
      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));

      // Simulate next day order (would use actual date comparison in real service)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      streakService = new MockStreakService({
        userId: 'user_123',
        loginStreak: 0,
        orderStreak: 1,
        lastOrderAt: yesterday,
      });

      orderService = new OrderService({
        loyalty: loyaltyService,
        wallet: walletService,
        streak: streakService,
        score: scoreService,
      });

      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));

      const streak = await streakService.getStreak();
      expect(streak.orderStreak).toBe(2);
    });

    it('should reset streak after gap', async () => {
      // First order
      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));

      // Simulate old last order (more than 1 day ago)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      streakService = new MockStreakService({
        userId: 'user_123',
        loginStreak: 0,
        orderStreak: 5,
        lastOrderAt: weekAgo,
      });

      orderService = new OrderService({
        loyalty: loyaltyService,
        wallet: walletService,
        streak: streakService,
        score: scoreService,
      });

      await orderService.completeOrder(generateMockOrder({ totalAmount: 500 }));

      const streak = await streakService.getStreak();
      expect(streak.orderStreak).toBe(1); // Reset
    });
  });

  describe('Score Updates', () => {
    it('should add to total score', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const score = await scoreService.getScore();
      expect(score.totalScore).toBe(100);
    });

    it('should add to monthly score', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const score = await scoreService.getScore();
      expect(score.monthlyScore).toBe(100);
    });

    it('should add to weekly score', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const score = await scoreService.getScore();
      expect(score.weeklyScore).toBe(100);
    });
  });

  describe('Tier Upgrades', () => {
    it('should emit tier upgrade event when threshold reached', async () => {
      let upgradeEvent: unknown = null;
      orderService.on('tier_upgraded', (data: unknown) => {
        upgradeEvent = data;
      });

      // Order large enough to trigger silver tier
      const order = generateMockOrder({ totalAmount: 50000 }); // 5000 points -> silver

      await orderService.completeOrder(order);

      expect(upgradeEvent).not.toBeNull();
    });

    it('should not emit upgrade when below threshold', async () => {
      let upgradeEvent: unknown = null;
      orderService.on('tier_upgraded', (data: unknown) => {
        upgradeEvent = data;
      });

      const order = generateMockOrder({ totalAmount: 1000 }); // 100 points

      await orderService.completeOrder(order);

      expect(upgradeEvent).toBeNull();
    });
  });

  describe('Event Emission', () => {
    it('should emit order_completed event', async () => {
      let orderEvent: unknown = null;
      orderService.on('order_completed', (data: unknown) => {
        orderEvent = data;
      });

      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      expect(orderEvent).not.toBeNull();
      expect((orderEvent as { orderId: string }).orderId).toBe(order.orderId);
    });

    it('should include reward amounts in event', async () => {
      let orderEvent: unknown = null;
      orderService.on('order_completed', (data: unknown) => {
        orderEvent = data;
      });

      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const event = orderEvent as { cashbackEarned: number; pointsEarned: number };
      expect(event.cashbackEarned).toBe(20);
      expect(event.pointsEarned).toBe(100);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency across all services', async () => {
      const order = generateMockOrder({ totalAmount: 1000 });

      await orderService.completeOrder(order);

      const [loyalty, wallet, streak, score] = await Promise.all([
        loyaltyService.getState(),
        walletService.getBalance(),
        streakService.getStreak(),
        scoreService.getScore(),
      ]);

      // All should be updated
      expect(loyalty.lifetimePoints).toBe(100);
      expect(wallet.cashback).toBe(20);
      expect(wallet.coins).toBe(100);
      expect(score.totalScore).toBe(100);
    });

    it('should handle concurrent order completions', async () => {
      const orders = [
        generateMockOrder({ totalAmount: 500 }),
        generateMockOrder({ totalAmount: 500 }),
        generateMockOrder({ totalAmount: 500 }),
      ];

      await Promise.all(orders.map(order => orderService.completeOrder(order)));

      const loyalty = await loyaltyService.getState();
      expect(loyalty.lifetimePoints).toBe(150); // 3 * 50 points
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount order', async () => {
      const order = generateMockOrder({ totalAmount: 0 });

      const completedOrder = await orderService.completeOrder(order);

      expect(completedOrder.cashbackEarned).toBe(0);
      expect(completedOrder.pointsEarned).toBe(0);
    });

    it('should handle very large order', async () => {
      const order = generateMockOrder({ totalAmount: 1000000 }); // 10 lakh

      const completedOrder = await orderService.completeOrder(order);

      expect(completedOrder.cashbackEarned).toBe(20000); // 2%
      expect(completedOrder.pointsEarned).toBe(100000); // 0.1 per rupee
    });

    it('should handle order with decimal amount', async () => {
      const order = generateMockOrder({ totalAmount: 999.99 });

      const completedOrder = await orderService.completeOrder(order);

      expect(completedOrder.cashbackEarned).toBe(19); // floor(2% of 999.99)
      expect(completedOrder.pointsEarned).toBe(99); // floor(0.1 * 999.99)
    });
  });
});
