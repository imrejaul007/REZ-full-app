/**
 * Service Mocks - Mock external services for REZ Loyalty System tests
 */

import { EventEmitter } from 'events';
import {
  LoyaltyProfile,
  Order,
  Badge,
  KARMA_MILESTONES,
  LOYALTY_TIERS,
  STREAK_MILESTONES,
  STREAK_REWARDS,
  MERCHANTS,
} from './testFixtures';

// ============================================================================
// Types
// ============================================================================

export interface MockLoyaltyServiceConfig {
  profiles?: Map<string, LoyaltyProfile>;
  orders?: Order[];
  badges?: Badge[];
}

export interface LoyaltyEvent {
  type: string;
  userId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================================
// Mock Loyalty Service
// ============================================================================

export class MockLoyaltyService extends EventEmitter {
  private profiles: Map<string, LoyaltyProfile>;
  private orders: Order[];
  private badges: Badge[];
  private events: LoyaltyEvent[] = [];

  constructor(config?: MockLoyaltyServiceConfig) {
    super();
    this.profiles = config?.profiles ?? new Map();
    this.orders = config?.orders ?? [];
    this.badges = config?.badges ?? [];
  }

  // Profile operations
  async getProfile(userId: string): Promise<LoyaltyProfile | null> {
    return this.profiles.get(userId) ?? null;
  }

  async createProfile(profile: LoyaltyProfile): Promise<LoyaltyProfile> {
    this.profiles.set(profile.userId, { ...profile });
    this.emit('profile:created', profile);
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<LoyaltyProfile>): Promise<LoyaltyProfile | null> {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const updated = { ...profile, ...updates };
    this.profiles.set(userId, updated);
    this.emit('profile:updated', { userId, updates });
    return updated;
  }

  async addPoints(userId: string, points: number): Promise<LoyaltyProfile | null> {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const newTotal = profile.totalPoints + points;
    const newAvailable = profile.availablePoints + points;
    const newLifetime = profile.lifetimePoints + points;

    const tier = this.calculateTier(newLifetime);

    const updated = {
      ...profile,
      totalPoints: newTotal,
      availablePoints: newAvailable,
      lifetimePoints: newLifetime,
      tier,
    };

    this.profiles.set(userId, updated);
    this.emit('points:added', { userId, points, newTotal });
    this.emitEvent('POINTS_ADDED', userId, { points, newTotal, tier });

    return updated;
  }

  async deductPoints(userId: string, points: number): Promise<LoyaltyProfile | null> {
    const profile = this.profiles.get(userId);
    if (!profile || profile.availablePoints < points) return null;

    const updated = {
      ...profile,
      availablePoints: profile.availablePoints - points,
    };

    this.profiles.set(userId, updated);
    this.emit('points:deducted', { userId, points });
    return updated;
  }

  // Order operations
  async processOrder(order: Order): Promise<Order> {
    this.orders.push(order);
    this.emit('order:processed', order);
    this.emitEvent('ORDER_COMPLETED', order.userId, { orderId: order.id, amount: order.totalAmount });
    return order;
  }

  async getOrders(userId: string): Promise<Order[]> {
    return this.orders.filter((o) => o.userId === userId);
  }

  // Badge operations
  async awardBadge(userId: string, badge: Badge): Promise<Badge> {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.badges.push(badge);
      this.profiles.set(userId, profile);
    }
    this.badges.push(badge);
    this.emit('badge:awarded', { userId, badge });
    this.emitEvent('BADGE_EARNED', userId, { badgeId: badge.id, badgeType: badge.type });
    return badge;
  }

  async hasBadge(userId: string, badgeId: string): Promise<boolean> {
    const profile = this.profiles.get(userId);
    return profile?.badges.some((b) => b.id === badgeId) ?? false;
  }

  // Streak operations
  async updateStreak(userId: string, orderDate: Date): Promise<LoyaltyProfile | null> {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const lastOrder = profile.lastOrderDate;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 2 * oneDayMs;

    let newStreak = 1;
    let milestoneAwarded: number | null = null;

    if (lastOrder) {
      const daysSinceLastOrder = (orderDate.getTime() - lastOrder.getTime()) / oneDayMs;

      if (daysSinceLastOrder < 1) {
        // Same day, no streak change
        return profile;
      } else if (daysSinceLastOrder < 2) {
        // Next day, increment streak
        newStreak = profile.currentStreak + 1;
      } else {
        // Missed day(s), reset streak
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(profile.longestStreak, newStreak);

    // Check for milestone
    const previousStreak = profile.currentStreak;
    if (newStreak > previousStreak) {
      const newMilestone = STREAK_MILESTONES.find((m) => m > previousStreak && m <= newStreak);
      if (newMilestone && STREAK_REWARDS[newMilestone]) {
        milestoneAwarded = newMilestone;
        // Award milestone bonus points
        const reward = STREAK_REWARDS[newMilestone];
        profile.totalPoints += reward.points;
        profile.availablePoints += reward.points;
        profile.lifetimePoints += reward.points;
        profile.xp += reward.xp;
      }
    }

    const updated = {
      ...profile,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastOrderDate: orderDate,
      streakStartDate: newStreak === 1 ? orderDate : profile.streakStartDate,
    };

    this.profiles.set(userId, updated);
    this.emit('streak:updated', { userId, newStreak, milestoneAwarded });
    this.emitEvent('STREAK_UPDATED', userId, { newStreak, milestoneAwarded });

    return updated;
  }

  // Karma operations
  async addKarma(userId: string, karmaPoints: number): Promise<LoyaltyProfile | null> {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const newKarma = profile.karma + karmaPoints;
    let milestoneAwarded: number | null = null;

    // Check for karma milestone
    const newMilestone = KARMA_MILESTONES.find((m) => m > profile.karma && m <= newKarma);
    if (newMilestone) {
      milestoneAwarded = newMilestone;
      // Convert karma milestone to loyalty points
      const loyaltyPoints = Math.floor(karmaPoints * 0.5);
      profile.totalPoints += loyaltyPoints;
      profile.availablePoints += loyaltyPoints;
      profile.lifetimePoints += loyaltyPoints;
    }

    const updated = {
      ...profile,
      karma: newKarma,
    };

    this.profiles.set(userId, updated);
    this.emit('karma:added', { userId, karmaPoints, newKarma, milestoneAwarded });
    this.emitEvent('KARMA_ADDED', userId, { karmaPoints, newKarma, milestoneAwarded });

    return updated;
  }

  // ReZ Score calculation
  async calculateRezScore(userId: string): Promise<number> {
    const profile = this.profiles.get(userId);
    if (!profile) return 0;

    const engagementScore = Math.min(profile.karma * 0.1, 1000);
    const spendingScore = Math.min(profile.lifetimePoints * 0.05, 2000);
    const streakBonus = Math.min(profile.currentStreak * 5, 500);
    const tierBonus = LOYALTY_TIERS[profile.tier].multiplier * 100;

    return Math.floor(engagementScore + spendingScore + streakBonus + tierBonus);
  }

  // Tier management
  calculateTier(lifetimePoints: number): string {
    if (lifetimePoints >= LOYALTY_TIERS.diamond.minPoints) return 'diamond';
    if (lifetimePoints >= LOYALTY_TIERS.platinum.minPoints) return 'platinum';
    if (lifetimePoints >= LOYALTY_TIERS.gold.minPoints) return 'gold';
    if (lifetimePoints >= LOYALTY_TIERS.silver.minPoints) return 'silver';
    return 'bronze';
  }

  // Cross-merchant tracking
  async checkCrossMerchantBadges(userId: string): Promise<Badge[]> {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const orders = await this.getOrders(userId);
    const uniqueMerchants = new Set(orders.map((o) => o.merchantId));
    const badges: Badge[] = [];

    // Explorer badge for visiting multiple merchants
    if (uniqueMerchants.size >= 3) {
      const explorerBadge: Badge = {
        id: 'explorer_badge',
        type: 'cross-merchant',
        name: 'Explorer',
        description: 'Visited 3 or more merchants',
        earnedAt: new Date(),
      };
      badges.push(explorerBadge);
      await this.awardBadge(userId, explorerBadge);
    }

    // Master Explorer for all merchants
    if (uniqueMerchants.size >= MERCHANTS.length) {
      const masterBadge: Badge = {
        id: 'master_explorer_badge',
        type: 'cross-merchant',
        name: 'Master Explorer',
        description: 'Visited all merchants',
        earnedAt: new Date(),
      };
      badges.push(masterBadge);
      await this.awardBadge(userId, masterBadge);
    }

    return badges;
  }

  // Event tracking
  private emitEvent(type: string, userId: string, data: Record<string, unknown>): void {
    this.events.push({ type, userId, data, timestamp: new Date() });
    this.emit('event', { type, userId, data, timestamp: new Date() });
  }

  getEvents(): LoyaltyEvent[] {
    return [...this.events];
  }

  getEventsByType(type: string): LoyaltyEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  getEventsByUser(userId: string): LoyaltyEvent[] {
    return this.events.filter((e) => e.userId === userId);
  }

  clearEvents(): void {
    this.events = [];
  }

  // Reset
  reset(): void {
    this.profiles.clear();
    this.orders = [];
    this.badges = [];
    this.events = [];
    this.removeAllListeners();
  }
}

// ============================================================================
// Mock External Services
// ============================================================================

export class MockNotificationService extends EventEmitter {
  private notifications: Array<{
    userId: string;
    type: string;
    message: string;
    data: Record<string, unknown>;
    sentAt: Date;
  }> = [];

  async sendNotification(
    userId: string,
    type: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const notification = { userId, type, message, data: data ?? {}, sentAt: new Date() };
    this.notifications.push(notification);
    this.emit('notification:send', notification);
  }

  getNotifications(userId: string): Array<{
    userId: string;
    type: string;
    message: string;
    data: Record<string, unknown>;
    sentAt: Date;
  }> {
    return this.notifications.filter((n) => n.userId === userId);
  }

  reset(): void {
    this.notifications = [];
  }
}

export class MockCacheService extends EventEmitter {
  private cache: Map<string, { value: unknown; expiresAt: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: unknown, ttlMs: number = 60000): Promise<void> {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  reset(): void {
    this.cache.clear();
  }
}

export class MockAnalyticsService extends EventEmitter {
  private events: Array<{
    event: string;
    properties: Record<string, unknown>;
    timestamp: Date;
  }> = [];

  async track(event: string, properties?: Record<string, unknown>): Promise<void> {
    const trackedEvent = { event, properties: properties ?? {}, timestamp: new Date() };
    this.events.push(trackedEvent);
    this.emit('track', trackedEvent);
  }

  getEvents(): Array<{
    event: string;
    properties: Record<string, unknown>;
    timestamp: Date;
  }> {
    return [...this.events];
  }

  getEventsByName(name: string): Array<{
    event: string;
    properties: Record<string, unknown>;
    timestamp: Date;
  }> {
    return this.events.filter((e) => e.event === name);
  }

  reset(): void {
    this.events = [];
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createMockLoyaltyService(config?: MockLoyaltyServiceConfig): MockLoyaltyService {
  return new MockLoyaltyService(config);
}

export function createMockNotificationService(): MockNotificationService {
  return new MockNotificationService();
}

export function createMockCacheService(): MockCacheService {
  return new MockCacheService();
}

export function createMockAnalyticsService(): MockAnalyticsService {
  return new MockAnalyticsService();
}

// ============================================================================
// Mock Service Container
// ============================================================================

export interface MockServices {
  loyalty: MockLoyaltyService;
  notification: MockNotificationService;
  cache: MockCacheService;
  analytics: MockAnalyticsService;
}

export function createMockServiceContainer(): MockServices {
  return {
    loyalty: createMockLoyaltyService(),
    notification: createMockNotificationService(),
    cache: createMockCacheService(),
    analytics: createMockAnalyticsService(),
  };
}
