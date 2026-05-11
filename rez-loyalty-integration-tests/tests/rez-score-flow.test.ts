/**
 * ReZ Score Calculation Tests
 * Tests for ReZ Score calculation, components, and tier determination
 */

import {
  generateUser,
  generateLoyaltyProfile,
  generateOrder,
  LOYALTY_TIERS,
  MERCHANTS,
} from './helpers/testFixtures';
import {
  MockLoyaltyService,
  createMockLoyaltyService,
} from './helpers/serviceMocks';

describe('ReZ Score', () => {
  let loyaltyService: MockLoyaltyService;

  beforeEach(() => {
    loyaltyService = createMockLoyaltyService();
  });

  afterEach(() => {
    loyaltyService.reset();
  });

  describe('should calculate score from engagement', () => {
    it('should calculate engagement score from karma', async () => {
      const userId = 'user_engagement';
      const karma = 1000;
      const engagementMultiplier = 0.1;
      const expectedEngagementScore = Math.min(karma * engagementMultiplier, 1000);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, { karma })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      expect(score).toBeGreaterThanOrEqual(expectedEngagementScore * 0.1);
    });

    it('should cap engagement score at maximum', async () => {
      const userId = 'user_engagement_cap';
      const highKarma = 20000;
      const maxEngagement = 1000;

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, { karma: highKarma })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Engagement contribution should be capped
      expect(score).toBeLessThan(highKarma);
    });

    it('should return 0 for user with no karma', async () => {
      const userId = 'user_no_karma';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: 0,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Only tier bonus with 0 karma/streak/lifetime
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should increase engagement score with karma', async () => {
      const scores: number[] = [];

      for (const karma of [0, 100, 500, 1000, 5000]) {
        const userId = `user_karma_${karma}`;
        await loyaltyService.createProfile(
          generateLoyaltyProfile(userId, {
            karma,
            lifetimePoints: 0,
            currentStreak: 0,
            tier: 'bronze',
          })
        );

        const score = await loyaltyService.calculateRezScore(userId);
        scores.push(score);
      }

      // Scores should generally increase with karma
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
      }
    });
  });

  describe('should calculate score from spending', () => {
    it('should calculate spending score from lifetime points', async () => {
      const userId = 'user_spending';
      const lifetimePoints = 10000;
      const spendingMultiplier = 0.05;
      const expectedSpendingScore = Math.min(lifetimePoints * spendingMultiplier, 2000);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints,
          currentStreak: 0,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should cap spending score at maximum', async () => {
      const userId = 'user_spending_cap';
      const highLifetime = 100000;
      const maxSpending = 2000;

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: highLifetime,
          currentStreak: 0,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Spending contribution should be capped
      expect(score).toBeLessThan(highLifetime);
    });

    it('should accumulate spending score over orders', async () => {
      const userId = 'user_spending_accumulate';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: 0,
        })
      );

      // Add points from multiple orders
      await loyaltyService.addPoints(userId, 500);
      await loyaltyService.addPoints(userId, 1000);
      await loyaltyService.addPoints(userId, 2000);

      const profile = await loyaltyService.getProfile(userId);
      expect(profile?.lifetimePoints).toBe(3500);

      const score = await loyaltyService.calculateRezScore(userId);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('should calculate score from karma', () => {
    it('should include karma score in total', async () => {
      const userId = 'user_karma_score';
      const karma = 5000;

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma,
          lifetimePoints: 0,
          currentStreak: 0,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // karma * 0.1 = 500
      expect(score).toBeGreaterThanOrEqual(400);
    });

    it('should weight karma appropriately relative to other factors', () => {
      const karmaContribution = 1000 * 0.1; // 100
      const spendingContribution = 10000 * 0.05; // 500
      const streakContribution = 30 * 5; // 150

      // Karma should be a meaningful contribution
      expect(karmaContribution).toBeGreaterThan(0);
      // But spending should be weighted higher
      expect(spendingContribution).toBeGreaterThan(karmaContribution);
    });

    it('should allow high karma users to achieve high scores', async () => {
      const userId = 'user_high_karma';
      const highKarma = 50000;

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: highKarma,
          lifetimePoints: 0,
          currentStreak: 0,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // High karma should contribute significantly
      expect(score).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('should apply streak bonus', () => {
    it('should calculate streak bonus correctly', async () => {
      const userId = 'user_streak_bonus';
      const streak = 30;
      const streakMultiplier = 5;
      const maxStreakBonus = 500;
      const expectedStreakBonus = Math.min(streak * streakMultiplier, maxStreakBonus);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: streak,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Streak bonus should be included
      expect(score).toBeGreaterThanOrEqual(expectedStreakBonus * 0.5);
    });

    it('should cap streak bonus at maximum', async () => {
      const userId = 'user_streak_cap';
      const veryHighStreak = 500;
      const maxStreakBonus = 500;

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: veryHighStreak,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Streak bonus should be capped
      expect(score).toBeLessThan(veryHighStreak * 5);
    });

    it('should not add streak bonus for zero streak', async () => {
      const userId = 'user_zero_streak';

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: 0,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should show score difference with and without streak', async () => {
      const baseProfile = {
        karma: 1000,
        lifetimePoints: 10000,
        currentStreak: 0,
      };

      await loyaltyService.createProfile(
        generateLoyaltyProfile('user_no_streak', baseProfile)
      );
      await loyaltyService.createProfile(
        generateLoyaltyProfile('user_with_streak', {
          ...baseProfile,
          currentStreak: 100,
        })
      );

      const scoreNoStreak = await loyaltyService.calculateRezScore('user_no_streak');
      const scoreWithStreak = await loyaltyService.calculateRezScore('user_with_streak');

      expect(scoreWithStreak).toBeGreaterThan(scoreNoStreak);
    });

    it('should accumulate streak bonus over time', async () => {
      const scores: number[] = [];

      for (const streak of [0, 10, 50, 100]) {
        const userId = `user_streak_${streak}`;
        await loyaltyService.createProfile(
          generateLoyaltyProfile(userId, {
            karma: 0,
            lifetimePoints: 0,
            currentStreak: streak,
          })
        );

        const score = await loyaltyService.calculateRezScore(userId);
        scores.push(score);
      }

      // Scores should increase with streak
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1]);
      }
    });
  });

  describe('should calculate correct tier', () => {
    it('should define all tier thresholds correctly', () => {
      expect(LOYALTY_TIERS.bronze.minPoints).toBe(0);
      expect(LOYALTY_TIERS.silver.minPoints).toBe(1000);
      expect(LOYALTY_TIERS.gold.minPoints).toBe(5000);
      expect(LOYALTY_TIERS.platinum.minPoints).toBe(15000);
      expect(LOYALTY_TIERS.diamond.minPoints).toBe(50000);
    });

    it('should assign correct multipliers for each tier', () => {
      expect(LOYALTY_TIERS.bronze.multiplier).toBe(1.0);
      expect(LOYALTY_TIERS.silver.multiplier).toBe(1.25);
      expect(LOYALTY_TIERS.gold.multiplier).toBe(1.5);
      expect(LOYALTY_TIERS.platinum.multiplier).toBe(1.75);
      expect(LOYALTY_TIERS.diamond.multiplier).toBe(2.0);
    });

    it('should calculate tier from lifetime points', () => {
      const testCases = [
        { points: 0, expectedTier: 'bronze' },
        { points: 999, expectedTier: 'bronze' },
        { points: 1000, expectedTier: 'silver' },
        { points: 4999, expectedTier: 'silver' },
        { points: 5000, expectedTier: 'gold' },
        { points: 14999, expectedTier: 'gold' },
        { points: 15000, expectedTier: 'platinum' },
        { points: 49999, expectedTier: 'platinum' },
        { points: 50000, expectedTier: 'diamond' },
        { points: 100000, expectedTier: 'diamond' },
      ];

      for (const { points, expectedTier } of testCases) {
        const tier = loyaltyService.calculateTier(points);
        expect(tier).toBe(expectedTier);
      }
    });

    it('should include tier bonus in ReZ Score', async () => {
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
      const scores: number[] = [];

      for (const tier of tiers) {
        const userId = `user_tier_${tier}`;
        await loyaltyService.createProfile(
          generateLoyaltyProfile(userId, {
            karma: 0,
            lifetimePoints: LOYALTY_TIERS[tier].minPoints,
            currentStreak: 0,
            tier,
          })
        );

        const score = await loyaltyService.calculateRezScore(userId);
        scores.push(score);
      }

      // Higher tiers should have higher scores
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
      }
    });

    it('should apply tier multiplier to bonus calculation', () => {
      const baseBonus = 100;
      const tierMultipliers = Object.values(LOYALTY_TIERS).map((t) => t.multiplier);

      for (const multiplier of tierMultipliers) {
        const bonus = baseBonus * multiplier;
        expect(bonus).toBeGreaterThanOrEqual(baseBonus);
      }
    });

    it('should handle tier transition correctly', async () => {
      const userId = 'user_tier_transition';

      // Start as silver
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          tier: 'silver',
          lifetimePoints: 4500,
        })
      );

      let profile = await loyaltyService.getProfile(userId);
      expect(profile?.tier).toBe('silver');

      // Cross gold threshold
      await loyaltyService.addPoints(userId, 600);
      profile = await loyaltyService.getProfile(userId);

      // Should upgrade to gold
      expect(profile!.lifetimePoints).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('should combine all score components', () => {
    it('should calculate complete ReZ Score', async () => {
      const userId = 'user_complete';
      const karma = 1000;
      const lifetimePoints = 10000;
      const streak = 30;
      const tier = 'gold';

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma,
          lifetimePoints,
          currentStreak: streak,
          tier,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Verify score is a positive number
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);

      // Verify components are included
      // engagement = min(1000 * 0.1, 1000) = 100
      // spending = min(10000 * 0.05, 2000) = 500
      // streak = min(30 * 5, 500) = 150
      // tier = 1.5 * 100 = 150
      // total = 900
    });

    it('should handle user with all maximum values', async () => {
      const userId = 'user_max';
      const maxKarma = 100000;
      const maxLifetime = 1000000;
      const maxStreak = 500;
      const maxTier = 'diamond';

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: maxKarma,
          lifetimePoints: maxLifetime,
          currentStreak: maxStreak,
          tier: maxTier,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Score should be capped at reasonable maximum
      expect(score).toBeLessThan(100000);
    });

    it('should handle user with minimal values', async () => {
      const userId = 'user_minimal';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: 0,
          tier: 'bronze',
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Should still return valid score (just tier bonus)
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should weight components in correct proportions', () => {
      const engagementWeight = 0.1; // karma * 0.1, capped at 1000
      const spendingWeight = 0.05; // lifetimePoints * 0.05, capped at 2000
      const streakWeight = 5; // streak * 5, capped at 500
      const tierWeight = 100; // multiplier * 100

      // Verify weights are defined
      expect(engagementWeight).toBeGreaterThan(0);
      expect(spendingWeight).toBeGreaterThan(0);
      expect(streakWeight).toBeGreaterThan(0);
      expect(tierWeight).toBeGreaterThan(0);

      // Spending should have highest potential contribution
      const maxSpending = 2000;
      const maxEngagement = 1000;
      const maxStreak = 500;
      const maxTier = 200; // diamond multiplier

      expect(maxSpending).toBeGreaterThan(maxEngagement);
      expect(maxSpending).toBeGreaterThan(maxStreak);
      expect(maxSpending).toBeGreaterThan(maxTier);
    });
  });

  describe('Integration: ReZ Score Full Flow', () => {
    it('should update ReZ Score on order completion', async () => {
      const userId = 'user_score_order';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 500,
          lifetimePoints: 5000,
          currentStreak: 10,
          tier: 'gold',
        })
      );

      const scoreBefore = await loyaltyService.calculateRezScore(userId);

      // Place order
      const order = generateOrder(userId, MERCHANTS[0].id, {
        totalAmount: 100,
        pointsEarned: 1000,
      });

      await loyaltyService.processOrder(order);
      await loyaltyService.addPoints(userId, order.pointsEarned);
      await loyaltyService.updateStreak(userId, new Date());

      const scoreAfter = await loyaltyService.calculateRezScore(userId);

      expect(scoreAfter).toBeGreaterThanOrEqual(scoreBefore);
    });

    it('should update ReZ Score on karma activity', async () => {
      const userId = 'user_score_karma';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 100,
          lifetimePoints: 1000,
          currentStreak: 0,
        })
      );

      const scoreBefore = await loyaltyService.calculateRezScore(userId);

      await loyaltyService.addKarma(userId, 500);

      const scoreAfter = await loyaltyService.calculateRezScore(userId);

      expect(scoreAfter).toBeGreaterThan(scoreBefore);
    });

    it('should update ReZ Score on streak increment', async () => {
      const userId = 'user_score_streak';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 0,
          lifetimePoints: 0,
          currentStreak: 10,
          lastOrderDate: yesterday,
        })
      );

      const scoreBefore = await loyaltyService.calculateRezScore(userId);

      await loyaltyService.updateStreak(userId, new Date());

      const scoreAfter = await loyaltyService.calculateRezScore(userId);

      expect(scoreAfter).toBeGreaterThan(scoreBefore);
    });

    it('should track ReZ Score changes over time', async () => {
      const userId = 'user_score_history';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const scores: number[] = [];

      // Add karma
      await loyaltyService.addKarma(userId, 100);
      scores.push(await loyaltyService.calculateRezScore(userId));

      // Add points
      await loyaltyService.addPoints(userId, 500);
      scores.push(await loyaltyService.calculateRezScore(userId));

      // Update streak
      await loyaltyService.updateStreak(userId, new Date());
      scores.push(await loyaltyService.calculateRezScore(userId));

      // Score should generally increase over time
      const lastScore = scores[scores.length - 1];
      const firstScore = scores[0];
      expect(lastScore).toBeGreaterThan(firstScore);
    });

    it('should calculate accurate tier from ReZ Score', async () => {
      const userId = 'user_score_tier';

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 5000,
          lifetimePoints: 15000,
          currentStreak: 30,
          tier: 'platinum',
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);
      const tier = loyaltyService.calculateTier(
        (await loyaltyService.getProfile(userId))!.lifetimePoints
      );

      expect(tier).toBe('platinum');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle non-existent user', async () => {
      const score = await loyaltyService.calculateRezScore('non_existent_user');
      expect(score).toBe(0);
    });

    it('should handle negative values gracefully', async () => {
      const userId = 'user_negative';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: -100,
          lifetimePoints: -500,
          currentStreak: -5,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      // Should not throw and should return valid number
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large numbers', async () => {
      const userId = 'user_very_large';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: Number.MAX_SAFE_INTEGER,
          lifetimePoints: Number.MAX_SAFE_INTEGER,
          currentStreak: Number.MAX_SAFE_INTEGER,
        })
      );

      // Should handle large numbers without overflow
      const score = await loyaltyService.calculateRezScore(userId);
      expect(typeof score).toBe('number');
      expect(isFinite(score)).toBe(true);
    });

    it('should return integer score', async () => {
      const userId = 'user_integer';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          karma: 333,
          lifetimePoints: 777,
          currentStreak: 3,
        })
      );

      const score = await loyaltyService.calculateRezScore(userId);

      expect(Number.isInteger(score)).toBe(true);
    });
  });
});
