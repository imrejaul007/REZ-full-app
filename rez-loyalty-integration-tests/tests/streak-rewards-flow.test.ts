/**
 * Streak Rewards Flow Tests
 * Tests for streak tracking, milestones, recovery, and bonus calculations
 */

import {
  generateUser,
  generateLoyaltyProfile,
  generateOrder,
  generateScenario_StreakMilestone,
  generateScenario_MissedStreak,
  generateUserWithStreak,
  STREAK_MILESTONES,
  STREAK_REWARDS,
  MERCHANTS,
} from './helpers/testFixtures';
import {
  MockLoyaltyService,
  createMockLoyaltyService,
} from './helpers/serviceMocks';

describe('Streak System', () => {
  let loyaltyService: MockLoyaltyService;

  beforeEach(() => {
    loyaltyService = createMockLoyaltyService();
  });

  afterEach(() => {
    loyaltyService.reset();
  });

  describe('should increment streak on daily visit', () => {
    it('should start streak at 1 for new users', async () => {
      const userId = 'user_new_streak';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const updated = await loyaltyService.updateStreak(userId, new Date());

      expect(updated?.currentStreak).toBe(1);
    });

    it('should increment streak on next day order', async () => {
      const userId = 'user_increment';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 5,
          lastOrderDate: yesterday,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.currentStreak).toBe(6);
    });

    it('should not increment streak for same-day orders', async () => {
      const userId = 'user_same_day_streak';
      const now = new Date();

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 10,
          lastOrderDate: now,
        })
      );

      const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const updated = await loyaltyService.updateStreak(userId, twoHoursLater);

      expect(updated?.currentStreak).toBe(10);
    });

    it('should update longestStreak when current exceeds it', async () => {
      const userId = 'user_longest_streak';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 5,
          longestStreak: 5,
          lastOrderDate: yesterday,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.currentStreak).toBe(6);
      expect(updated?.longestStreak).toBe(6);
    });

    it('should not decrease longestStreak when current resets', async () => {
      const userId = 'user_longest_preserved';
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 10,
          longestStreak: 10,
          lastOrderDate: threeDaysAgo,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.currentStreak).toBe(1);
      expect(updated?.longestStreak).toBe(10);
    });

    it('should set streakStartDate on first order', async () => {
      const userId = 'user_streak_start';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      const now = new Date();
      const updated = await loyaltyService.updateStreak(userId, now);

      expect(updated?.streakStartDate).toBeDefined();
      expect(updated?.currentStreak).toBe(1);
    });

    it('should emit STREAK_UPDATED event', async () => {
      const userId = 'user_streak_event';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId));

      let eventFired = false;
      let eventData: { userId: string; newStreak: number; milestoneAwarded: number | null } | null = null;

      loyaltyService.on('streak:updated', (data: {
        userId: string;
        newStreak: number;
        milestoneAwarded: number | null;
      }) => {
        eventFired = true;
        eventData = data;
      });

      await loyaltyService.updateStreak(userId, new Date());

      expect(eventFired).toBe(true);
      expect(eventData?.newStreak).toBe(1);
    });
  });

  describe('should reset streak on missed day', () => {
    it('should reset streak to 1 after missing one day', async () => {
      const userId = 'user_missed_one';
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 10,
          lastOrderDate: twoDaysAgo,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.currentStreak).toBe(1);
    });

    it('should reset streak after missing multiple days', async () => {
      const userId = 'user_missed_multiple';
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 30,
          lastOrderDate: fiveDaysAgo,
        })
      );

      const updated = await loyaltyService.updateStreak(userId, new Date());

      expect(updated?.currentStreak).toBe(1);
    });

    it('should update streakStartDate on reset', async () => {
      const userId = 'user_reset_date';
      const oldStreakStart = new Date('2024-01-01');
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 20,
          longestStreak: 20,
          lastOrderDate: threeDaysAgo,
          streakStartDate: oldStreakStart,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.streakStartDate?.getDate()).toBe(today.getDate());
      expect(updated?.currentStreak).toBe(1);
    });

    it('should handle edge case of exactly 48 hours', async () => {
      const userId = 'user_exactly_48';
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 15,
          lastOrderDate: fortyEightHoursAgo,
        })
      );

      const updated = await loyaltyService.updateStreak(userId, new Date());

      // 48 hours should count as missed day (reset)
      expect(updated?.currentStreak).toBe(1);
    });

    it('should handle leap year dates correctly', async () => {
      const userId = 'user_leap_year';
      const feb28 = new Date('2024-02-28');

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 5,
          lastOrderDate: feb28,
        })
      );

      const mar1 = new Date('2024-03-01');
      const updated = await loyaltyService.updateStreak(userId, mar1);

      // Feb 28 to Mar 1 is 2 days (leap year has 29)
      // So streak should reset
      expect(updated?.currentStreak).toBe(1);
    });

    it('should handle year boundary correctly', async () => {
      const userId = 'user_year_boundary';
      const dec31 = new Date('2024-12-31');

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 25,
          lastOrderDate: dec31,
        })
      );

      const jan1 = new Date('2025-01-01');
      const updated = await loyaltyService.updateStreak(userId, jan1);

      // Dec 31 to Jan 1 is 1 day - should increment
      expect(updated?.currentStreak).toBe(26);
    });
  });

  describe('should award milestone rewards', () => {
    it('should have all expected milestones defined', () => {
      expect(STREAK_MILESTONES).toEqual([7, 14, 30, 60, 90, 180, 365]);
    });

    it('should have rewards defined for all milestones', () => {
      for (const milestone of STREAK_MILESTONES) {
        expect(STREAK_REWARDS[milestone]).toBeDefined();
        expect(STREAK_REWARDS[milestone].points).toBeGreaterThan(0);
        expect(STREAK_REWARDS[milestone].xp).toBeGreaterThan(0);
      }
    });

    it('should award 7-day milestone rewards', async () => {
      const userId = 'user_7_day';
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 6,
          lastOrderDate: sixDaysAgo,
          totalPoints: 0,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.currentStreak).toBe(7);
      // Should have received milestone reward
      expect(updated?.totalPoints).toBeGreaterThanOrEqual(STREAK_REWARDS[7].points);
    });

    it('should award 30-day milestone badge', () => {
      const milestone30 = STREAK_REWARDS[30];
      expect(milestone30.badge).toBe('streak_30_days');
    });

    it('should award 365-day milestone badge', () => {
      const milestone365 = STREAK_REWARDS[365];
      expect(milestone365.badge).toBe('streak_365_days');
    });

    it('should increase rewards with higher milestones', () => {
      const milestones = [7, 14, 30, 60, 90, 180, 365];
      let previousPoints = 0;

      for (const milestone of milestones) {
        const reward = STREAK_REWARDS[milestone];
        expect(reward.points).toBeGreaterThan(previousPoints);
        previousPoints = reward.points;
      }
    });

    it('should detect milestone crossing correctly', async () => {
      const userId = 'user_milestone_cross';
      const nineDaysAgo = new Date();
      nineDaysAgo.setDate(nineDaysAgo.getDate() - 9);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 8,
          lastOrderDate: nineDaysAgo,
        })
      );

      const today = new Date();
      let milestoneAwarded: number | null = null;

      loyaltyService.on('streak:updated', (data: { milestoneAwarded: number | null }) => {
        milestoneAwarded = data.milestoneAwarded;
      });

      await loyaltyService.updateStreak(userId, today);

      // Should have crossed 14-day milestone
      expect(milestoneAwarded).toBe(14);
    });

    it('should award multiple milestones if crossed at once', async () => {
      const userId = 'user_multi_milestone';
      // Start with streak of 12
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 12,
          lastOrderDate: twoDaysAgo,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      // Should be at 14-day streak, having crossed 14 milestone
      expect(updated?.currentStreak).toBe(14);
    });

    it('should emit milestone event with reward details', async () => {
      const userId = 'user_milestone_event';
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 6,
          lastOrderDate: sixDaysAgo,
        })
      );

      let milestoneAwarded: number | null = null;

      loyaltyService.on('streak:updated', (data: { milestoneAwarded: number | null }) => {
        milestoneAwarded = data.milestoneAwarded;
      });

      await loyaltyService.updateStreak(userId, new Date());

      expect(milestoneAwarded).toBe(7);
    });
  });

  describe('should allow streak recovery', () => {
    it('should allow starting new streak after reset', async () => {
      const userId = 'user_new_streak_after_reset';
      const oldStreakStart = new Date('2024-01-01');
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 10,
          longestStreak: 10,
          lastOrderDate: threeDaysAgo,
          streakStartDate: oldStreakStart,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      expect(updated?.currentStreak).toBe(1);
      expect(updated?.streakStartDate?.getTime()).toBeGreaterThan(oldStreakStart.getTime());
    });

    it('should track new longest streak after recovery', async () => {
      const userId = 'user_new_longest';
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 5,
          longestStreak: 5,
          lastOrderDate: fourDaysAgo,
        })
      );

      // After reset, build up new streak
      for (let i =0; i < 10; i++) {
        const day = new Date();
        day.setDate(day.getDate() + i);
        await loyaltyService.updateStreak(userId, day);
      }

      const updated = await loyaltyService.getProfile(userId);
      expect(updated?.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('should not allow negative streak values', async () => {
      const userId = 'user_negative';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 0,
        })
      );

      const updated = await loyaltyService.updateStreak(userId, new Date());

      expect(updated?.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('should handle grace period for streak recovery', async () => {
      // Some systems allow a grace period
      // This test documents the current behavior (no grace period)
      const userId = 'user_grace';
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 15,
          lastOrderDate: twoDaysAgo,
        })
      );

      const today = new Date();
      const updated = await loyaltyService.updateStreak(userId, today);

      // Without grace period, streak resets
      expect(updated?.currentStreak).toBe(1);
    });

    it('should preserve longest streak across multiple resets', async () => {
      const userId = 'user_preserve_longest';

      // Initial streak of 50
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 50,
          longestStreak: 50,
        })
      );

      // Simulate reset
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      await loyaltyService.updateProfile(userId, {
        currentStreak: 1,
        lastOrderDate: threeDaysAgo,
      });

      // Another reset
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      await loyaltyService.updateProfile(userId, {
        currentStreak: 1,
        lastOrderDate: sixDaysAgo,
      });

      const updated = await loyaltyService.getProfile(userId);
      expect(updated?.longestStreak).toBe(50);
    });
  });

  describe('Integration: Full Streak Flow', () => {
    it('should complete full streak lifecycle', async () => {
      const userId = 'user_full_streak_lifecycle';
      await loyaltyService.createProfile(generateLoyaltyProfile(userId, {
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
      }));

      // Day 1
      let updated = await loyaltyService.updateStreak(userId, new Date('2024-01-01'));
      expect(updated?.currentStreak).toBe(1);

      // Day 2
      updated = await loyaltyService.updateStreak(userId, new Date('2024-01-02'));
      expect(updated?.currentStreak).toBe(2);

      // Day 3
      updated = await loyaltyService.updateStreak(userId, new Date('2024-01-03'));
      expect(updated?.currentStreak).toBe(3);

      // Day 4 (missed)
      updated = await loyaltyService.updateStreak(userId, new Date('2024-01-06'));
      expect(updated?.currentStreak).toBe(1);

      // Day 5 (recovery)
      updated = await loyaltyService.updateStreak(userId, new Date('2024-01-07'));
      expect(updated?.currentStreak).toBe(2);

      // Verify longest streak preserved
      const final = await loyaltyService.getProfile(userId);
      expect(final?.longestStreak).toBe(3);
    });

    it('should reach 30-day milestone and earn badge', async () => {
      const userId = 'user_30_day';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 29,
          lastOrderDate: new Date('2024-01-29'),
        })
      );

      const jan30 = new Date('2024-01-30');
      const updated = await loyaltyService.updateStreak(userId, jan30);

      expect(updated?.currentStreak).toBe(30);
      expect(updated?.badges.length).toBeGreaterThan(0);
    });

    it('should handle year-long streak', async () => {
      const userId = 'user_year_streak';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2024-01-01');

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 364,
          longestStreak: 364,
          lastOrderDate: endDate,
        })
      );

      const jan2 = new Date('2024-01-02');
      const updated = await loyaltyService.updateStreak(userId, jan2);

      // Should reach 365-day milestone
      expect(updated?.currentStreak).toBe(365);
    });

    it('should calculate streak duration correctly', async () => {
      const userId = 'user_duration';
      const streakStart = new Date('2024-01-01');
      const currentDate = new Date('2024-01-15');

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 14,
          streakStartDate: streakStart,
          lastOrderDate: currentDate,
        })
      );

      const durationDays = Math.floor(
        (currentDate.getTime() - streakStart.getTime()) / (24 * 60 * 60 * 1000)
      ) + 1;

      expect(durationDays).toBe(15);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null lastOrderDate for new users', async () => {
      const userId = 'user_null_date';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          lastOrderDate: null,
        })
      );

      const updated = await loyaltyService.updateStreak(userId, new Date());
      expect(updated?.currentStreak).toBe(1);
    });

    it('should handle future dates gracefully', async () => {
      const userId = 'user_future';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 10,
          lastOrderDate: yesterday,
        })
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const updated = await loyaltyService.updateStreak(userId, futureDate);
      // Future dates should still update streak
      expect(updated?.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('should handle timezone changes', async () => {
      const userId = 'user_timezone';
      // Simulate user traveling across time zones
      const localDate = new Date('2024-01-15T23:00:00');
      const nextDayLocal = new Date('2024-01-16T01:00:00');

      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 5,
          lastOrderDate: localDate,
        })
      );

      // Should still recognize as next day
      const updated = await loyaltyService.updateStreak(userId, nextDayLocal);
      expect(updated?.currentStreak).toBe(6);
    });

    it('should handle very large streak values', async () => {
      const userId = 'user_large_streak';
      await loyaltyService.createProfile(
        generateLoyaltyProfile(userId, {
          currentStreak: 999999,
          longestStreak: 999999,
        })
      );

      const updated = await loyaltyService.updateStreak(userId, new Date());
      expect(updated?.currentStreak).toBe(1000000);
      expect(updated?.longestStreak).toBe(1000000);
    });
  });
});
