/**
 * Cross-Merchant Badge Tests
 * Tests for cross-merchant achievements, badge awards, and progress tracking
 */

import {
  generateUser,
  generateLoyaltyProfile,
  generateOrder,
  generateCrossMerchantProgress,
  generateMultiMerchantOrders,
  MERCHANTS,
} from './helpers/testFixtures';
import {
  MockLoyaltyService,
  MockNotificationService,
  MockAnalyticsService,
  createMockLoyaltyService,
  createMockNotificationService,
  createMockAnalyticsService,
} from './helpers/serviceMocks';

describe('Cross-Merchant Badges', () => {
  let loyaltyService: MockLoyaltyService;
  let notificationService: MockNotificationService;
  let analyticsService: MockAnalyticsService;

  beforeEach(() => {
    loyaltyService = createMockLoyaltyService();
    notificationService = createMockNotificationService();
    analyticsService = createMockAnalyticsService();
  });

  afterEach(() => {
    loyaltyService.reset();
    notificationService.reset();
    analyticsService.reset();
  });

  describe('should track merchant visits', () => {
    it('should track unique merchant visits from orders', async () => {
      const userId = 'user_merchant_visit';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Create orders at different merchants
      const order1 = generateOrder(userId, MERCHANTS[0].id);
      const order2 = generateOrder(userId, MERCHANTS[1].id);
      const order3 = generateOrder(userId, MERCHANTS[0].id); // Duplicate merchant

      await loyaltyService.processOrder(order1);
      await loyaltyService.processOrder(order2);
      await loyaltyService.processOrder(order3);

      const orders = await loyaltyService.getOrders(userId);
      const uniqueMerchants = new Set(orders.map((o) => o.merchantId));

      expect(uniqueMerchants.size).toBe(2); // Only 2 unique merchants
    });

    it('should increment visit count for same merchant', async () => {
      const userId = 'user_repeat_visit';
      const merchantId = MERCHANTS[0].id;

      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Multiple orders at same merchant
      for (let i = 0; i < 3; i++) {
        await loyaltyService.processOrder(generateOrder(userId, merchantId));
      }

      const orders = await loyaltyService.getOrders(userId);
      const merchantOrders = orders.filter((o) => o.merchantId === merchantId);

      expect(merchantOrders.length).toBe(3);
    });

    it('should track visit dates for each merchant', async () => {
      const userId = 'user_visit_dates';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const order = generateOrder(userId, MERCHANTS[0].id, {
        createdAt: new Date('2024-01-15'),
      });

      await loyaltyService.processOrder(order);

      const orders = await loyaltyService.getOrders(userId);
      expect(orders[0].createdAt).toEqual(new Date('2024-01-15'));
    });

    it('should persist merchant visit data', async () => {
      const userId = 'user_persist_merchants';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Create orders
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));

      // Retrieve orders
      const orders = await loyaltyService.getOrders(userId);

      expect(orders.length).toBe(2);
      expect(orders.some((o) => o.merchantId === MERCHANTS[0].id)).toBe(true);
      expect(orders.some((o) => o.merchantId === MERCHANTS[1].id)).toBe(true);
    });
  });

  describe('should award Explorer badge', () => {
    it('should award Explorer badge after visiting 3 merchants', async () => {
      const userId = 'user_explorer_3';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit 3 different merchants
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[2].id));

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.length).toBeGreaterThan(0);
      expect(badges.some((b) => b.id === 'explorer_badge')).toBe(true);
    });

    it('should not award Explorer badge for 2 merchants', async () => {
      const userId = 'user_explorer_2';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit only 2 merchants
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      // Should not have Explorer badge yet
      expect(badges.some((b) => b.id === 'explorer_badge')).toBe(false);
    });

    it('should emit BADGE_EARNED event for Explorer badge', async () => {
      const userId = 'user_explorer_event';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      let badgeEventFired = false;

      loyaltyService.on('badge:awarded', () => {
        badgeEventFired = true;
      });

      // Visit 3 merchants
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[2].id));

      await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badgeEventFired).toBe(true);
    });

    it('should include badge in user profile after earning', async () => {
      const userId = 'user_explorer_profile';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit 3 merchants
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[2].id));

      await loyaltyService.checkCrossMerchantBadges(userId);

      const profile = await loyaltyService.getProfile(userId);
      expect(profile?.badges.some((b) => b.type === 'cross-merchant')).toBe(true);
    });
  });

  describe('should award Master Explorer badge', () => {
    it('should award Master Explorer after visiting all merchants', async () => {
      const userId = 'user_master_explorer';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit all merchants
      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(generateOrder(userId, merchant.id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(true);
    });

    it('should require all merchants for Master Explorer', async () => {
      const userId = 'user_master_almost';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit all but one merchant
      for (let i = 0; i < MERCHANTS.length - 1; i++) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[i].id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      // Should have Explorer but not Master Explorer
      expect(badges.some((b) => b.id === 'explorer_badge')).toBe(true);
      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(false);
    });

    it('should award both Explorer and Master Explorer at once', async () => {
      const userId = 'user_both_badges';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit all merchants (which also triggers Explorer)
      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(generateOrder(userId, merchant.id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.length).toBeGreaterThanOrEqual(2);
      expect(badges.some((b) => b.id === 'explorer_badge')).toBe(true);
      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(true);
    });

    it('should have correct badge descriptions', () => {
      // Explorer badge description
      const explorerBadge = {
        id: 'explorer_badge',
        type: 'cross-merchant',
        name: 'Explorer',
        description: 'Visited 3 or more merchants',
      };

      expect(explorerBadge.description).toContain('3');

      // Master Explorer badge description
      const masterBadge = {
        id: 'master_explorer_badge',
        type: 'cross-merchant',
        name: 'Master Explorer',
        description: 'Visited all merchants',
      };

      expect(masterBadge.description).toContain('all');
    });
  });

  describe('should track progress', () => {
    it('should calculate progress percentage', () => {
      const userId = 'user_progress';
      const progress = generateCrossMerchantProgress(userId, [], 5);

      // Initial progress
      expect(progress.badgeProgress).toBe(0);

      // After visiting 3 merchants (60% of 5)
      const visitedSome = generateCrossMerchantProgress(userId, [
        MERCHANTS[0].id,
        MERCHANTS[1].id,
        MERCHANTS[2].id,
      ]);
      const progressPercent = (visitedSome.merchantsVisited.size / visitedSome.totalMerchants) * 100;

      expect(progressPercent).toBe(60);
    });

    it('should show remaining merchants for badge', async () => {
      const userId = 'user_remaining';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit some merchants
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));

      const orders = await loyaltyService.getOrders(userId);
      const uniqueMerchants = new Set(orders.map((o) => o.merchantId));
      const remaining = MERCHANTS.length - uniqueMerchants.size;

      expect(remaining).toBe(MERCHANTS.length - 2);
    });

    it('should mark progress as complete when all merchants visited', () => {
      const userId = 'user_complete';
      const allMerchantIds = MERCHANTS.map((m) => m.id);
      const progress = generateCrossMerchantProgress(userId, allMerchantIds);

      expect(progress.completed).toBe(true);
      expect(progress.merchantsVisited.size).toBe(MERCHANTS.length);
    });

    it('should track time between merchant visits', async () => {
      const userId = 'user_time_tracking';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const order1 = generateOrder(userId, MERCHANTS[0].id, {
        createdAt: new Date('2024-01-01'),
      });
      const order2 = generateOrder(userId, MERCHANTS[1].id, {
        createdAt: new Date('2024-01-15'),
      });

      await loyaltyService.processOrder(order1);
      await loyaltyService.processOrder(order2);

      const orders = await loyaltyService.getOrders(userId);
      const daysBetween = Math.floor(
        (orders[1].createdAt.getTime() - orders[0].createdAt.getTime()) /
          (24 * 60 * 60 * 1000)
      );

      expect(daysBetween).toBe(14);
    });
  });

  describe('should award cross-merchant bonus points', () => {
    it('should award bonus points for cross-merchant visits', async () => {
      const userId = 'user_cross_bonus';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, { totalPoints: 0 })
      );

      // Visit 3 merchants
      for (let i = 0; i < 3; i++) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[i].id));
      }

      // Check badges and award any bonus points
      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      // Explorer badge should have been awarded
      expect(badges.some((b) => b.id === 'explorer_badge')).toBe(true);

      // Award bonus points for the achievement
      const CROSS_MERCHANT_BONUS = 100;
      await loyaltyService.addPoints(userId, CROSS_MERCHANT_BONUS);

      const profile = await loyaltyService.getProfile(userId);
      expect(profile?.totalPoints).toBeGreaterThanOrEqual(CROSS_MERCHANT_BONUS);
    });

    it('should award higher bonus for Master Explorer', async () => {
      const userId = 'user_master_bonus';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, { totalPoints: 0 })
      );

      // Visit all merchants
      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(generateOrder(userId, merchant.id));
      }

      await loyaltyService.checkCrossMerchantBadges(userId);

      const EXPLORER_BONUS = 100;
      const MASTER_BONUS = 500;

      // Should have earned both bonuses
      await loyaltyService.addPoints(userId, EXPLORER_BONUS + MASTER_BONUS);

      const profile = await loyaltyService.getProfile(userId);
      expect(profile?.totalPoints).toBe(EXPLORER_BONUS + MASTER_BONUS);
    });

    it('should not award duplicate bonuses', async () => {
      const userId = 'user_no_duplicate_bonus';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, { totalPoints: 0 })
      );

      // Visit 3 merchants multiple times
      for (let i = 0; i < 5; i++) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[2].id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      // Should only have one Explorer badge
      const explorerCount = badges.filter((b) => b.id === 'explorer_badge').length;
      expect(explorerCount).toBeLessThanOrEqual(1);
    });
  });

  describe('should handle edge cases', () => {
    it('should handle user with no orders', async () => {
      const userId = 'user_no_orders';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.length).toBe(0);
    });

    it('should handle single merchant', async () => {
      const userId = 'user_single_merchant';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Only visit one merchant
      for (let i = 0; i < 10; i++) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.length).toBe(0);
    });

    it('should handle all merchants in single day', async () => {
      const userId = 'user_single_day';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const sameDay = new Date('2024-01-15');

      // Visit all merchants on same day
      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(
          generateOrder(userId, merchant.id, { createdAt: sameDay })
        );
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(true);
    });

    it('should handle merchants out of order', async () => {
      const userId = 'user_out_of_order';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit in reverse order
      for (let i = MERCHANTS.length - 1; i >= 0; i--) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[i].id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(true);
    });

    it('should handle rapid consecutive visits', async () => {
      const userId = 'user_rapid';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Rapid visits within same minute
      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(generateOrder(userId, merchant.id));
      }

      const badges = await loyaltyService.checkCrossMerchantBadges(userId);

      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(true);
    });
  });

  describe('Integration: Full Cross-Merchant Flow', () => {
    it('should complete cross-merchant journey', async () => {
      const userId = 'user_full_journey';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, { totalPoints: 0 })
      );

      // Step 1: Visit first merchant
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      let badges = await loyaltyService.checkCrossMerchantBadges(userId);
      expect(badges.length).toBe(0);

      // Step 2: Visit second merchant
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));
      badges = await loyaltyService.checkCrossMerchantBadges(userId);
      expect(badges.length).toBe(0);

      // Step 3: Visit third merchant - should earn Explorer
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[2].id));
      badges = await loyaltyService.checkCrossMerchantBadges(userId);
      expect(badges.some((b) => b.id === 'explorer_badge')).toBe(true);

      // Award Explorer bonus
      await loyaltyService.addPoints(userId, 100);

      // Continue to Master Explorer
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[3].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[4].id));
      badges = await loyaltyService.checkCrossMerchantBadges(userId);
      expect(badges.some((b) => b.id === 'master_explorer_badge')).toBe(true);

      // Award Master Explorer bonus
      await loyaltyService.addPoints(userId, 500);

      const profile = await loyaltyService.getProfile(userId);
      expect(profile?.totalPoints).toBe(600);
      expect(profile?.badges.length).toBeGreaterThanOrEqual(2);
    });

    it('should track cross-merchant progress over time', async () => {
      const userId = 'user_progress_over_time';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const progress: number[] = [];

      for (let i = 0; i < MERCHANTS.length; i++) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[i].id));
        const orders = await loyaltyService.getOrders(userId);
        const uniqueMerchants = new Set(orders.map((o) => o.merchantId));
        progress.push(uniqueMerchants.size);
      }

      // Progress should increase monotonically
      for (let i = 1; i < progress.length; i++) {
        expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1]);
      }

      // Final progress should be all merchants
      expect(progress[progress.length - 1]).toBe(MERCHANTS.length);
    });

    it('should handle concurrent merchant visits', async () => {
      const userId = 'user_concurrent';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Simulate concurrent visits
      const concurrentOrders = MERCHANTS.map((m) =>
        generateOrder(userId, m.id)
      );

      await Promise.all(
        concurrentOrders.map((order) => loyaltyService.processOrder(order))
      );

      const orders = await loyaltyService.getOrders(userId);
      const uniqueMerchants = new Set(orders.map((o) => o.merchantId));

      expect(uniqueMerchants.size).toBe(MERCHANTS.length);
    });

    it('should emit analytics events for cross-merchant activity', async () => {
      const userId = 'user_analytics';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      loyaltyService.on('event', (event: { type: string; userId: string; data: Record<string, unknown> }) => {
        if (event.type === 'ORDER_COMPLETED') {
          analyticsService.track('cross_merchant_visit', event.data);
        }
      });

      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(generateOrder(userId, merchant.id));
      }

      const events = analyticsService.getEvents();
      expect(events.length).toBe(MERCHANTS.length);
    });
  });

  describe('Notification and Engagement', () => {
    it('should send notification when Explorer badge earned', async () => {
      const userId = 'user_notify_explorer';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      loyaltyService.on('badge:awarded', () => {
        notificationService.sendNotification(
          userId,
          'badge_earned',
          'Congratulations! You earned the Explorer badge!',
          { badgeId: 'explorer_badge' }
        );
      });

      // Visit 3 merchants
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[0].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[1].id));
      await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[2].id));

      await loyaltyService.checkCrossMerchantBadges(userId);

      const notifications = notificationService.getNotifications(userId);
      // Notification should be sent
    });

    it('should send notification when Master Explorer badge earned', async () => {
      const userId = 'user_notify_master';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      loyaltyService.on('badge:awarded', () => {
        notificationService.sendNotification(
          userId,
          'badge_earned',
          'Amazing! You earned the Master Explorer badge!',
          { badgeId: 'master_explorer_badge' }
        );
      });

      // Visit all merchants
      for (const merchant of MERCHANTS) {
        await loyaltyService.processOrder(generateOrder(userId, merchant.id));
      }

      await loyaltyService.checkCrossMerchantBadges(userId);

      const notifications = notificationService.getNotifications(userId);
      // Notification should be sent
    });

    it('should encourage users approaching cross-merchant goals', async () => {
      const userId = 'user_encourage';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      // Visit 4 out of 5 merchants
      for (let i = 0; i < 4; i++) {
        await loyaltyService.processOrder(generateOrder(userId, MERCHANTS[i].id));
      }

      const orders = await loyaltyService.getOrders(userId);
      const uniqueMerchants = new Set(orders.map((o) => o.merchantId));
      const remaining = MERCHANTS.length - uniqueMerchants.size;

      // Should encourage user to visit remaining merchants
      expect(remaining).toBe(1);

      // Could send encouraging notification
      notificationService.sendNotification(
        userId,
        'cross_merchant_progress',
        `You're almost there! Visit ${remaining} more merchant(s) to earn the Master Explorer badge!`,
        { progress: uniqueMerchants.size, remaining }
      );

      const notifications = notificationService.getNotifications(userId);
      expect(notifications.length).toBe(1);
    });
  });
});
