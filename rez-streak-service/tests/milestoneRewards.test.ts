/**
 * Streak Service - Milestone Rewards Test Suite
 *
 * Tests for:
 * - Milestone definition and configuration
 * - Milestone progress tracking
 * - Milestone reward calculation
 * - Milestone claim logic
 * - Milestone notifications
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type StreakType = 'login' | 'order' | 'review' | 'savings' | 'visit';
type MilestoneStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'claimed';

interface MilestoneDefinition {
  id: string;
  type: StreakType;
  day: number;
  coins: number;
  badge?: string;
  cashbackPercent?: number;
  multiplierBonus?: number;
  description: string;
}

interface UserMilestoneProgress {
  milestoneId: string;
  streakType: StreakType;
  currentDay: number;
  status: MilestoneStatus;
  reachedAt?: Date;
  claimedAt?: Date;
  rewardAmount: number;
}

interface MilestoneReward {
  coins: number;
  badge?: string;
  cashback?: { percent: number; amount: number };
  multiplier?: { bonus: number; expiresAt?: Date };
}

interface MilestoneNotification {
  milestoneId: string;
  title: string;
  message: string;
  reward: MilestoneReward;
  actionRequired: boolean;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  // Login Streak Milestones
  { id: 'login_3', type: 'login', day: 3, coins: 30, badge: 'streak_3', description: '3-day login streak' },
  { id: 'login_7', type: 'login', day: 7, coins: 100, badge: 'streak_7', description: '7-day login streak' },
  { id: 'login_14', type: 'login', day: 14, coins: 250, badge: 'streak_14', description: '14-day login streak' },
  { id: 'login_30', type: 'login', day: 30, coins: 500, badge: 'streak_30', description: '30-day login streak' },
  { id: 'login_60', type: 'login', day: 60, coins: 1000, badge: 'streak_60', description: '60-day login streak' },
  { id: 'login_100', type: 'login', day: 100, coins: 2500, badge: 'streak_100', description: '100-day login streak' },
  { id: 'login_365', type: 'login', day: 365, coins: 10000, badge: 'streak_365', description: '365-day login streak' },

  // Order Streak Milestones
  { id: 'order_5', type: 'order', day: 5, coins: 50, badge: 'order_5', description: '5 order streak' },
  { id: 'order_10', type: 'order', day: 10, coins: 150, badge: 'order_10', description: '10 order streak' },
  { id: 'order_25', type: 'order', day: 25, coins: 400, badge: 'order_25', description: '25 order streak' },
  { id: 'order_50', type: 'order', day: 50, coins: 1000, badge: 'order_50', description: '50 order streak' },

  // Review Streak Milestones
  { id: 'review_3', type: 'review', day: 3, coins: 25, badge: 'review_3', description: '3 review streak' },
  { id: 'review_10', type: 'review', day: 10, coins: 100, badge: 'review_10', description: '10 review streak' },
  { id: 'review_25', type: 'review', day: 25, coins: 300, badge: 'review_25', description: '25 review streak' },

  // Savings Streak Milestones
  { id: 'savings_7', type: 'savings', day: 7, coins: 70, cashbackPercent: 1, description: '7-day savings streak' },
  { id: 'savings_30', type: 'savings', day: 30, coins: 400, cashbackPercent: 2, description: '30-day savings streak' },
  { id: 'savings_100', type: 'savings', day: 100, coins: 2000, cashbackPercent: 5, description: '100-day savings streak' },

  // Visit Streak Milestones
  { id: 'visit_5', type: 'visit', day: 5, coins: 75, badge: 'visit_5', description: '5 visit streak' },
  { id: 'visit_20', type: 'visit', day: 20, coins: 400, badge: 'visit_20', description: '20 visit streak' },
  { id: 'visit_50', type: 'visit', day: 50, coins: 1500, badge: 'visit_50', description: '50 visit streak' },
];

function generateMockProgress(
  milestoneId: string,
  currentDay: number,
  status: MilestoneStatus
): UserMilestoneProgress {
  const definition = MILESTONE_DEFINITIONS.find(m => m.id === milestoneId);
  return {
    milestoneId,
    streakType: definition?.type || 'login',
    currentDay,
    status,
    rewardAmount: definition?.coins || 0,
  };
}

// ============================================================================
// Milestone Reward Engine (to be tested)
// ============================================================================

function getMilestonesForType(type: StreakType): MilestoneDefinition[] {
  return MILESTONE_DEFINITIONS.filter(m => m.type === type).sort((a, b) => a.day - b.day);
}

function getMilestoneById(id: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find(m => m.id === id);
}

function calculateMilestoneStatus(currentDay: number, targetDay: number, claimed: boolean): MilestoneStatus {
  if (claimed) return 'claimed';
  if (currentDay >= targetDay) return 'completed';
  if (currentDay >= targetDay * 0.5) return 'in_progress';
  return 'locked';
}

function calculateProgressPercent(currentDay: number, targetDay: number): number {
  if (targetDay === 0) return 0;
  return Math.min(100, Math.round((currentDay / targetDay) * 100));
}

function getRewardAmount(milestone: MilestoneDefinition): MilestoneReward {
  const reward: MilestoneReward = { coins: milestone.coins };

  if (milestone.badge) {
    reward.badge = milestone.badge;
  }

  if (milestone.cashbackPercent) {
    reward.cashback = {
      percent: milestone.cashbackPercent,
      amount: 0, // Calculated based on transaction amount
    };
  }

  return reward;
}

function getDaysUntilNextMilestone(currentDay: number, type: StreakType): number | null {
  const milestones = getMilestonesForType(type);
  const nextMilestone = milestones.find(m => m.day > currentDay);
  return nextMilestone ? nextMilestone.day - currentDay : null;
}

function getNextMilestone(currentDay: number, type: StreakType): MilestoneDefinition | null {
  const milestones = getMilestonesForType(type);
  return milestones.find(m => m.day > currentDay) || null;
}

function getTotalMilestones(type: StreakType): number {
  return getMilestonesForType(type).length;
}

function getCompletedMilestones(currentDay: number, type: StreakType): MilestoneDefinition[] {
  return getMilestonesForType(type).filter(m => m.day <= currentDay);
}

function getClaimableMilestones(
  currentDay: number,
  type: StreakType,
  claimedIds: Set<string>
): MilestoneDefinition[] {
  return getMilestonesForType(type).filter(
    m => m.day <= currentDay && !claimedIds.has(m.id)
  );
}

function calculateCumulativeReward(
  currentDay: number,
  type: StreakType,
  claimedIds: Set<string>
): number {
  const claimable = getClaimableMilestones(currentDay, type, claimedIds);
  return claimable.reduce((sum, m) => sum + m.coins, 0);
}

function generateMilestoneNotification(
  milestone: MilestoneDefinition,
  reward: MilestoneReward
): MilestoneNotification {
  return {
    milestoneId: milestone.id,
    title: `Milestone Achieved: ${milestone.description}`,
    message: `Congratulations! You've reached a ${milestone.day}-day streak. Claim your ${reward.coins} coins reward!`,
    reward,
    actionRequired: true,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Milestone Rewards', () => {

  describe('Milestone Definitions', () => {
    it('should have correct milestones for login type', () => {
      const loginMilestones = getMilestonesForType('login');

      expect(loginMilestones.length).toBe(7);
      expect(loginMilestones[0].day).toBe(3);
      expect(loginMilestones[loginMilestones.length - 1].day).toBe(365);
    });

    it('should have correct milestones for order type', () => {
      const orderMilestones = getMilestonesForType('order');

      expect(orderMilestones.length).toBe(4);
      expect(orderMilestones.map(m => m.day)).toEqual([5, 10, 25, 50]);
    });

    it('should have correct milestones for review type', () => {
      const reviewMilestones = getMilestonesForType('review');

      expect(reviewMilestones.length).toBe(3);
      expect(reviewMilestones.map(m => m.day)).toEqual([3, 10, 25]);
    });

    it('should have correct milestones for savings type', () => {
      const savingsMilestones = getMilestonesForType('savings');

      expect(savingsMilestones.length).toBe(3);
      expect(savingsMilestones[0].cashbackPercent).toBeDefined();
    });

    it('should have correct milestones for visit type', () => {
      const visitMilestones = getMilestonesForType('visit');

      expect(visitMilestones.length).toBe(3);
      expect(visitMilestones.every(m => m.badge !== undefined)).toBe(true);
    });

    it('should get milestone by id correctly', () => {
      const milestone = getMilestoneById('login_7');

      expect(milestone).toBeDefined();
      expect(milestone?.day).toBe(7);
      expect(milestone?.coins).toBe(100);
      expect(milestone?.badge).toBe('streak_7');
    });

    it('should return undefined for invalid milestone id', () => {
      const milestone = getMilestoneById('invalid_milestone');
      expect(milestone).toBeUndefined();
    });
  });

  describe('Milestone Status Calculation', () => {
    it('should return locked status for day below threshold', () => {
      expect(calculateMilestoneStatus(1, 7, false)).toBe('locked');
      expect(calculateMilestoneStatus(5, 30, false)).toBe('locked');
    });

    it('should return in_progress status when 50% reached', () => {
      expect(calculateMilestoneStatus(4, 7, false)).toBe('in_progress');
      expect(calculateMilestoneStatus(15, 30, false)).toBe('in_progress');
    });

    it('should return completed status when target reached', () => {
      expect(calculateMilestoneStatus(7, 7, false)).toBe('completed');
      expect(calculateMilestoneStatus(10, 7, false)).toBe('completed');
      expect(calculateMilestoneStatus(100, 30, false)).toBe('completed');
    });

    it('should return claimed status when already claimed', () => {
      expect(calculateMilestoneStatus(7, 7, true)).toBe('claimed');
      expect(calculateMilestoneStatus(100, 30, true)).toBe('claimed');
    });

    it('should maintain claimed status over completed', () => {
      expect(calculateMilestoneStatus(100, 30, true)).toBe('claimed');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate correct progress percentage', () => {
      expect(calculateProgressPercent(0, 7)).toBe(0);
      expect(calculateProgressPercent(3, 7)).toBe(43);
      expect(calculateProgressPercent(7, 7)).toBe(100);
      expect(calculateProgressPercent(14, 7)).toBe(100);
    });

    it('should cap progress at 100%', () => {
      expect(calculateProgressPercent(50, 7)).toBe(100);
      expect(calculateProgressPercent(100, 7)).toBe(100);
    });

    it('should handle zero target gracefully', () => {
      expect(calculateProgressPercent(5, 0)).toBe(0);
    });

    it('should handle exact milestone values', () => {
      expect(calculateProgressPercent(7, 7)).toBe(100);
      expect(calculateProgressPercent(30, 30)).toBe(100);
    });
  });

  describe('Reward Calculation', () => {
    it('should return correct reward for login milestone', () => {
      const milestone = getMilestoneById('login_7')!;
      const reward = getRewardAmount(milestone);

      expect(reward.coins).toBe(100);
      expect(reward.badge).toBe('streak_7');
    });

    it('should return correct reward for order milestone', () => {
      const milestone = getMilestoneById('order_10')!;
      const reward = getRewardAmount(milestone);

      expect(reward.coins).toBe(150);
      expect(reward.badge).toBe('order_10');
    });

    it('should include cashback for savings milestone', () => {
      const milestone = getMilestoneById('savings_30')!;
      const reward = getRewardAmount(milestone);

      expect(reward.coins).toBe(400);
      expect(reward.cashback).toBeDefined();
      expect(reward.cashback?.percent).toBe(2);
    });

    it('should handle milestones without badge', () => {
      const milestone = getMilestoneById('savings_7')!;
      const reward = getRewardAmount(milestone);

      expect(reward.coins).toBe(70);
      expect(reward.badge).toBeUndefined();
    });
  });

  describe('Next Milestone', () => {
    it('should return next milestone for day 0', () => {
      const next = getNextMilestone(0, 'login');

      expect(next).toBeDefined();
      expect(next?.day).toBe(3);
    });

    it('should return next milestone for mid-streak', () => {
      const next = getNextMilestone(5, 'login');

      expect(next).toBeDefined();
      expect(next?.day).toBe(7);
    });

    it('should return next milestone for day before milestone', () => {
      const next = getNextMilestone(6, 'login');

      expect(next).toBeDefined();
      expect(next?.day).toBe(7);
    });

    it('should return null when all milestones completed', () => {
      const next = getNextMilestone(400, 'login');

      expect(next).toBeNull();
    });

    it('should return correct days until next milestone', () => {
      expect(getDaysUntilNextMilestone(0, 'login')).toBe(3);
      expect(getDaysUntilNextMilestone(3, 'login')).toBe(4);
      expect(getDaysUntilNextMilestone(7, 'login')).toBe(7);
      expect(getDaysUntilNextMilestone(400, 'login')).toBeNull();
    });
  });

  describe('Completed Milestones', () => {
    it('should return correct completed milestones for day 0', () => {
      const completed = getCompletedMilestones(0, 'login');
      expect(completed.length).toBe(0);
    });

    it('should return correct completed milestones for day 7', () => {
      const completed = getCompletedMilestones(7, 'login');

      expect(completed.length).toBe(2);
      expect(completed.map(m => m.day)).toEqual([3, 7]);
    });

    it('should return correct completed milestones for day 100', () => {
      const completed = getCompletedMilestones(100, 'login');

      expect(completed.length).toBe(6);
      expect(completed.map(m => m.day)).toEqual([3, 7, 14, 30, 60, 100]);
    });

    it('should include all milestones for day beyond max', () => {
      const completed = getCompletedMilestones(400, 'login');

      expect(completed.length).toBe(7);
    });
  });

  describe('Claimable Milestones', () => {
    it('should return claimable milestones with empty claimed set', () => {
      const claimed = new Set<string>();
      const claimable = getClaimableMilestones(7, 'login', claimed);

      expect(claimable.length).toBe(2);
      expect(claimable.map(m => m.day)).toEqual([3, 7]);
    });

    it('should exclude already claimed milestones', () => {
      const claimed = new Set<string>(['login_3']);
      const claimable = getClaimableMilestones(10, 'login', claimed);

      expect(claimable.length).toBe(2);
      expect(claimable.map(m => m.day)).toEqual([7, 14]);
    });

    it('should return empty array when all claimed', () => {
      const claimed = new Set<string>(['login_3', 'login_7', 'login_14', 'login_30', 'login_60', 'login_100', 'login_365']);
      const claimable = getClaimableMilestones(400, 'login', claimed);

      expect(claimable.length).toBe(0);
    });

    it('should handle partial claims correctly', () => {
      const claimed = new Set<string>(['login_3']);
      const claimable = getClaimableMilestones(14, 'login', claimed);

      expect(claimable.length).toBe(2);
      expect(claimable.map(m => m.id)).toEqual(['login_7', 'login_14']);
    });
  });

  describe('Cumulative Reward', () => {
    it('should calculate cumulative reward for day 0', () => {
      const claimed = new Set<string>();
      const cumulative = calculateCumulativeReward(0, 'login', claimed);

      expect(cumulative).toBe(0);
    });

    it('should calculate cumulative reward for day 7', () => {
      const claimed = new Set<string>();
      const cumulative = calculateCumulativeReward(7, 'login', claimed);

      // 30 (3-day) + 100 (7-day) = 130
      expect(cumulative).toBe(130);
    });

    it('should exclude claimed milestones from cumulative', () => {
      const claimed = new Set<string>(['login_3']);
      const cumulative = calculateCumulativeReward(7, 'login', claimed);

      // Only 100 (7-day) = 100
      expect(cumulative).toBe(100);
    });

    it('should calculate cumulative for full streak', () => {
      const claimed = new Set<string>();
      const cumulative = calculateCumulativeReward(365, 'login', claimed);

      // Sum of all milestone coins
      const milestones = getMilestonesForType('login');
      const expectedTotal = milestones.reduce((sum, m) => sum + m.coins, 0);

      expect(cumulative).toBe(expectedTotal);
    });

    it('should calculate cumulative for different streak types', () => {
      const claimed = new Set<string>();
      const loginCumulative = calculateCumulativeReward(10, 'login', claimed);
      const orderCumulative = calculateCumulativeReward(10, 'order', claimed);

      // Login: 3-day (30) + 7-day (100) = 130
      expect(loginCumulative).toBe(130);

      // Order: 5-day (50) + 10-day (150) = 200
      expect(orderCumulative).toBe(200);
    });
  });

  describe('Milestone Notifications', () => {
    it('should generate correct notification for milestone', () => {
      const milestone = getMilestoneById('login_7')!;
      const reward = getRewardAmount(milestone);
      const notification = generateMilestoneNotification(milestone, reward);

      expect(notification.milestoneId).toBe('login_7');
      expect(notification.title).toContain('7-day login streak');
      expect(notification.reward.coins).toBe(100);
      expect(notification.actionRequired).toBe(true);
    });

    it('should include badge in notification', () => {
      const milestone = getMilestoneById('login_30')!;
      const reward = getRewardAmount(milestone);
      const notification = generateMilestoneNotification(milestone, reward);

      expect(notification.reward.badge).toBe('streak_30');
    });

    it('should include cashback info in notification for savings', () => {
      const milestone = getMilestoneById('savings_30')!;
      const reward = getRewardAmount(milestone);
      const notification = generateMilestoneNotification(milestone, reward);

      expect(notification.reward.cashback?.percent).toBe(2);
    });
  });

  describe('Total Milestones', () => {
    it('should return correct total for each type', () => {
      expect(getTotalMilestones('login')).toBe(7);
      expect(getTotalMilestones('order')).toBe(4);
      expect(getTotalMilestones('review')).toBe(3);
      expect(getTotalMilestones('savings')).toBe(3);
      expect(getTotalMilestones('visit')).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large day values', () => {
      const completed = getCompletedMilestones(1000, 'login');
      expect(completed.length).toBe(7);
    });

    it('should handle negative day values', () => {
      const status = calculateMilestoneStatus(-5, 7, false);
      expect(status).toBe('locked');
    });

    it('should handle zero day values', () => {
      const status = calculateMilestoneStatus(0, 0, false);
      expect(status).toBe('claimed'); // Zero equals target
    });

    it('should handle missing cashback in notification', () => {
      const milestone = getMilestoneById('login_7')!;
      const reward = getRewardAmount(milestone);
      const notification = generateMilestoneNotification(milestone, reward);

      expect(notification.reward.cashback).toBeUndefined();
    });
  });

  describe('Reward Scaling', () => {
    it('should scale rewards appropriately with milestone difficulty', () => {
      const loginMilestones = getMilestonesForType('login');

      // Earlier milestones should be smaller
      expect(loginMilestones[0].coins).toBeLessThan(loginMilestones[2].coins);
      expect(loginMilestones[2].coins).toBeLessThan(loginMilestones[5].coins);
    });

    it('should maintain consistent scaling factor', () => {
      const loginMilestones = getMilestonesForType('login');

      // Ratio between consecutive milestones
      const ratio1 = loginMilestones[1].coins / loginMilestones[0].coins;
      const ratio2 = loginMilestones[2].coins / loginMilestones[1].coins;

      expect(ratio1).toBeGreaterThan(1);
      expect(ratio2).toBeGreaterThan(1);
    });
  });
});
