/**
 * Streak Service - Streak Recovery Test Suite
 *
 * Tests for:
 * - Streak recovery options
 * - Recovery eligibility
 * - Recovery mechanics (freezes, retries, grace periods)
 * - Recovery validation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type StreakType = 'login' | 'order' | 'review' | 'savings' | 'visit';
type RecoveryType = 'freeze' | 'grace_period' | 'retry' | 'streak_bridge';

interface StreakData {
  current: number;
  longest: number;
  lastActivityAt: Date | null;
  frozen: boolean;
  freezeExpiresAt: Date | null;
  brokenAt: Date | null;
}

interface RecoveryOption {
  type: RecoveryType;
  name: string;
  description: string;
  cost?: number;
  eligibility: {
    daysMissed: number;
    maxDays: number;
    requiresPurchase?: boolean;
  };
  effect: {
    restoreStreak: number;
    preserveMilestones: boolean;
    tempMultiplier?: number;
  };
}

interface RecoveryRequest {
  userId: string;
  streakType: StreakType;
  requestedAt: Date;
  recoveryType: RecoveryType;
  result: {
    success: boolean;
    newStreak: number;
    coinsRefunded: number;
    error?: string;
  };
}

interface StreakBreakInfo {
  brokenAt: Date;
  lastStreak: number;
  missedDays: number;
  missedMilestones: number[];
  recoveryAvailable: RecoveryOption[];
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockStreakData(overrides?: Partial<StreakData>): StreakData {
  return {
    current: 10,
    longest: 25,
    lastActivityAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    frozen: false,
    freezeExpiresAt: null,
    brokenAt: null,
    ...overrides,
  };
}

const RECOVERY_OPTIONS: RecoveryOption[] = [
  {
    type: 'freeze',
    name: 'Streak Freeze',
    description: 'Use a streak freeze to protect your streak for 1 day',
    eligibility: {
      daysMissed: 1,
      maxDays: 1,
    },
    effect: {
      restoreStreak: 0,
      preserveMilestones: true,
    },
  },
  {
    type: 'grace_period',
    name: 'Grace Period',
    description: 'Automatically applied 1-day grace period for occasional misses',
    eligibility: {
      daysMissed: 1,
      maxDays: 1,
    },
    effect: {
      restoreStreak: 1,
      preserveMilestones: true,
    },
  },
  {
    type: 'retry',
    name: 'Streak Retry',
    description: 'Pay coins to retry a broken streak',
    cost: 500,
    eligibility: {
      daysMissed: 3,
      maxDays: 7,
      requiresPurchase: true,
    },
    effect: {
      restoreStreak: 0,
      preserveMilestones: false,
      tempMultiplier: 1.5,
    },
  },
  {
    type: 'streak_bridge',
    name: 'Streak Bridge',
    description: 'Connect your streak across a gap',
    cost: 1000,
    eligibility: {
      daysMissed: 3,
      maxDays: 14,
      requiresPurchase: true,
    },
    effect: {
      restoreStreak: 0,
      preserveMilestones: true,
    },
  },
];

const MILESTONE_DAYS = [3, 7, 14, 30, 60, 100, 365];

// ============================================================================
// Recovery Logic (to be tested)
// ============================================================================

const GRACE_PERIOD_DAYS = 1;
const MAX_FREEZE_DAYS = 3;
const MAX_RETRY_DAYS = 7;
const MAX_BRIDGE_DAYS = 14;

function calculateMissedDays(lastActivity: Date | null): number {
  if (!lastActivity) return 0;

  const now = new Date();
  const diffMs = now.getTime() - lastActivity.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  return Math.max(0, diffDays);
}

function isStreakBroken(lastActivity: Date | null, graceEnabled: boolean = true): boolean {
  const missedDays = calculateMissedDays(lastActivity);
  const graceDays = graceEnabled ? GRACE_PERIOD_DAYS : 0;
  return missedDays > graceDays;
}

function getRecoveryOptions(missedDays: number, userCoins: number): RecoveryOption[] {
  const available: RecoveryOption[] = [];

  for (const option of RECOVERY_OPTIONS) {
    if (missedDays > option.eligibility.maxDays) continue;
    if (missedDays < option.eligibility.daysMissed) continue;
    if (option.cost && userCoins < option.cost) continue;

    available.push(option);
  }

  return available;
}

function getMissedMilestones(lastActivity: Date | null, currentStreak: number): number[] {
  if (!lastActivity) return [];

  const missedDays = calculateMissedDays(lastActivity);
  const breakDay = currentStreak + missedDays;

  return MILESTONE_DAYS.filter(day => day >= currentStreak + 1 && day <= breakDay);
}

function getStreakBreakInfo(streak: StreakData): StreakBreakInfo {
  const missedDays = calculateMissedDays(streak.lastActivityAt);
  const missedMilestones = getMissedMilestones(streak.lastActivityAt, streak.current);
  const recoveryOptions = getRecoveryOptions(missedDays, 10000); // Assuming user has coins

  return {
    brokenAt: streak.brokenAt || (streak.lastActivityAt
      ? new Date(streak.lastActivityAt.getTime() + (missedDays + 1) * 24 * 60 * 60 * 1000)
      : new Date()),
    lastStreak: streak.current,
    missedDays,
    missedMilestones,
    recoveryAvailable: recoveryOptions,
  };
}

function applyRecovery(
  streak: StreakData,
  recovery: RecoveryOption,
  userCoins: number
): RecoveryRequest['result'] {
  if (recovery.cost && userCoins < recovery.cost) {
    return {
      success: false,
      newStreak: streak.current,
      coinsRefunded: 0,
      error: 'Insufficient coins',
    };
  }

  const cost = recovery.cost || 0;
  let newStreak = streak.current;
  let preservedMilestones = streak.current;

  if (recovery.type === 'grace_period') {
    newStreak = streak.current + 1;
  } else if (recovery.type === 'streak_bridge') {
    preservedMilestones = streak.current;
    newStreak = streak.current + 1;
  } else if (recovery.type === 'freeze') {
    streak.frozen = true;
    const freezeExpiresAt = new Date();
    freezeExpiresAt.setDate(freezeExpiresAt.getDate() + 1);
    streak.freezeExpiresAt = freezeExpiresAt;
  }

  return {
    success: true,
    newStreak,
    coinsRefunded: -cost,
  };
}

function canUseFreeze(
  existingFreezeCount: number,
  isAlreadyFrozen: boolean,
  missedDays: number
): { allowed: boolean; reason?: string } {
  if (isAlreadyFrozen) {
    return { allowed: false, reason: 'Streak is already frozen' };
  }

  if (existingFreezeCount >= MAX_FREEZE_DAYS) {
    return { allowed: false, reason: 'Maximum freezes used this period' };
  }

  if (missedDays > 1) {
    return { allowed: false, reason: 'Too many days missed' };
  }

  return { allowed: true };
}

function calculateRecoveryCost(missedDays: number, streakType: StreakType): number {
  const baseCost = 100;
  const perDayCost = 50;
  const typeMultipliers: Record<StreakType, number> = {
    login: 1.0,
    order: 1.5,
    review: 1.2,
    savings: 1.3,
    visit: 1.4,
  };

  const multiplier = typeMultipliers[streakType] || 1.0;
  return Math.floor((baseCost + missedDays * perDayCost) * multiplier);
}

function getRecoveryEligibility(
  userId: string,
  streakType: StreakType,
  lastActivity: Date | null
): { eligible: boolean; reason?: string; options: RecoveryOption[] } {
  if (!lastActivity) {
    return { eligible: false, reason: 'No streak to recover', options: [] };
  }

  const missedDays = calculateMissedDays(lastActivity);

  if (missedDays === 0) {
    return { eligible: false, reason: 'Streak not broken', options: [] };
  }

  if (missedDays > MAX_BRIDGE_DAYS) {
    return { eligible: false, reason: 'Too many days missed for recovery', options: [] };
  }

  const options = getRecoveryOptions(missedDays, 10000);

  return {
    eligible: options.length > 0,
    options,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Streak Recovery', () => {

  describe('Missed Days Calculation', () => {
    it('should calculate 0 missed days for recent activity', () => {
      const now = new Date();
      const missedDays = calculateMissedDays(now);

      expect(missedDays).toBe(0);
    });

    it('should calculate 1 missed day for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const missedDays = calculateMissedDays(yesterday);

      expect(missedDays).toBe(1);
    });

    it('should calculate correct days for week ago', () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const missedDays = calculateMissedDays(weekAgo);

      expect(missedDays).toBe(7);
    });

    it('should return 0 for null lastActivity', () => {
      const missedDays = calculateMissedDays(null);
      expect(missedDays).toBe(0);
    });

    it('should handle very old dates', () => {
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const missedDays = calculateMissedDays(yearAgo);

      expect(missedDays).toBeGreaterThan(300);
    });
  });

  describe('Streak Break Detection', () => {
    it('should detect broken streak without grace period', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isStreakBroken(yesterday, false)).toBe(true);
    });

    it('should allow grace period for 1 day miss', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isStreakBroken(yesterday, true)).toBe(false);
    });

    it('should break after grace period', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(isStreakBroken(twoDaysAgo, true)).toBe(true);
    });

    it('should not break active streak', () => {
      const now = new Date();
      expect(isStreakBroken(now, true)).toBe(false);
    });
  });

  describe('Recovery Options', () => {
    it('should offer freeze for 1 day miss', () => {
      const options = getRecoveryOptions(1, 1000);
      const hasFreeze = options.some(o => o.type === 'freeze');

      expect(hasFreeze).toBe(true);
    });

    it('should offer grace period for 1 day miss', () => {
      const options = getRecoveryOptions(1, 1000);
      const hasGrace = options.some(o => o.type === 'grace_period');

      expect(hasGrace).toBe(true);
    });

    it('should offer retry for 3-7 days miss', () => {
      const options = getRecoveryOptions(5, 1000);
      const hasRetry = options.some(o => o.type === 'retry');

      expect(hasRetry).toBe(true);
    });

    it('should offer streak bridge for 3-14 days miss', () => {
      const options = getRecoveryOptions(10, 1000);
      const hasBridge = options.some(o => o.type === 'streak_bridge');

      expect(hasBridge).toBe(true);
    });

    it('should not offer recovery for too many missed days', () => {
      const options = getRecoveryOptions(20, 1000);
      expect(options.length).toBe(0);
    });

    it('should not offer paid options without enough coins', () => {
      const options = getRecoveryOptions(5, 100);
      const hasRetry = options.some(o => o.type === 'retry');

      expect(hasRetry).toBe(false);
    });
  });

  describe('Missed Milestones', () => {
    it('should identify missed milestones correctly', () => {
      const lastActivity = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const missed = getMissedMilestones(lastActivity, 5);

      // From 6 to 15 (5 + 10) should include 7, 14
      expect(missed).toContain(7);
      expect(missed).toContain(14);
      expect(missed).not.toContain(3);
      expect(missed).not.toContain(30);
    });

    it('should return empty array for no miss', () => {
      const now = new Date();
      const missed = getMissedMilestones(now, 10);

      expect(missed.length).toBe(0);
    });

    it('should return empty array for null activity', () => {
      const missed = getMissedMilestones(null, 10);
      expect(missed.length).toBe(0);
    });

    it('should handle milestone at exact break point', () => {
      const lastActivity = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const missed = getMissedMilestones(lastActivity, 7);

      // 7 was the last streak, so 7 is not missed, 14 is
      expect(missed).not.toContain(7);
      expect(missed).toContain(14);
    });
  });

  describe('Streak Break Info', () => {
    it('should generate correct break info', () => {
      const streak = generateMockStreakData({
        current: 10,
        lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        brokenAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      });

      const info = getStreakBreakInfo(streak);

      expect(info.missedDays).toBe(5);
      expect(info.lastStreak).toBe(10);
      expect(info.missedMilestones).toContain(14);
      expect(info.recoveryAvailable.length).toBeGreaterThan(0);
    });

    it('should calculate correct break date', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const streak = generateMockStreakData({
        current: 10,
        lastActivityAt: fiveDaysAgo,
      });

      const info = getStreakBreakInfo(streak);

      expect(info.brokenAt).toBeDefined();
    });
  });

  describe('Recovery Application', () => {
    it('should apply grace period recovery successfully', () => {
      const streak = generateMockStreakData({ current: 10 });
      const graceOption = RECOVERY_OPTIONS.find(o => o.type === 'grace_period')!;

      const result = applyRecovery(streak, graceOption, 1000);

      expect(result.success).toBe(true);
      expect(result.newStreak).toBe(11);
    });

    it('should deduct cost for paid recovery', () => {
      const streak = generateMockStreakData({ current: 5 });
      const retryOption = RECOVERY_OPTIONS.find(o => o.type === 'retry')!;

      const result = applyRecovery(streak, retryOption, 1000);

      expect(result.success).toBe(true);
      expect(result.coinsRefunded).toBe(-500);
    });

    it('should fail recovery without enough coins', () => {
      const streak = generateMockStreakData({ current: 5 });
      const retryOption = RECOVERY_OPTIONS.find(o => o.type === 'retry')!;

      const result = applyRecovery(streak, retryOption, 100);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient coins');
    });

    it('should apply freeze correctly', () => {
      const streak = generateMockStreakData({ current: 10, frozen: false });
      const freezeOption = RECOVERY_OPTIONS.find(o => o.type === 'freeze')!;

      const result = applyRecovery(streak, freezeOption, 1000);

      expect(result.success).toBe(true);
      expect(streak.frozen).toBe(true);
    });
  });

  describe('Freeze Eligibility', () => {
    it('should allow freeze for first time', () => {
      const result = canUseFreeze(0, false, 1);

      expect(result.allowed).toBe(true);
    });

    it('should not allow if already frozen', () => {
      const result = canUseFreeze(0, true, 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Streak is already frozen');
    });

    it('should not allow after max freezes', () => {
      const result = canUseFreeze(MAX_FREEZE_DAYS, false, 1);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Maximum freezes used this period');
    });

    it('should not allow for too many missed days', () => {
      const result = canUseFreeze(0, false, 2);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Too many days missed');
    });
  });

  describe('Recovery Cost Calculation', () => {
    it('should calculate higher cost for longer gaps', () => {
      const cost1 = calculateRecoveryCost(3, 'login');
      const cost5 = calculateRecoveryCost(5, 'login');

      expect(cost5).toBeGreaterThan(cost1);
    });

    it('should apply type multipliers correctly', () => {
      const loginCost = calculateRecoveryCost(5, 'login');
      const orderCost = calculateRecoveryCost(5, 'order');

      expect(orderCost).toBeGreaterThan(loginCost);
    });

    it('should return base cost for 1 day miss', () => {
      const cost = calculateRecoveryCost(1, 'login');

      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('Recovery Eligibility', () => {
    it('should be eligible for recovery with recent break', () => {
      const lastActivity = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const eligibility = getRecoveryEligibility('user_1', 'login', lastActivity);

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.options.length).toBeGreaterThan(0);
    });

    it('should not be eligible for active streak', () => {
      const lastActivity = new Date();
      const eligibility = getRecoveryEligibility('user_1', 'login', lastActivity);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('Streak not broken');
    });

    it('should not be eligible for null activity', () => {
      const eligibility = getRecoveryEligibility('user_1', 'login', null);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('No streak to recover');
    });

    it('should not be eligible for too many missed days', () => {
      const lastActivity = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const eligibility = getRecoveryEligibility('user_1', 'login', lastActivity);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toBe('Too many days missed for recovery');
    });
  });

  describe('Edge Cases', () => {
    it('should handle exact grace period boundary', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(isStreakBroken(twoDaysAgo, true)).toBe(true);
    });

    it('should handle leap year dates', () => {
      const feb28 = new Date('2024-02-28T12:00:00');
      const march1 = new Date('2024-03-01T12:00:00');

      // Feb 28 to March 1 is 2 days
      const missedDays = calculateMissedDays(feb28);
      expect(missedDays).toBe(1);
    });

    it('should handle timezone boundaries', () => {
      const almostYesterday = new Date(Date.now() - 23 * 60 * 60 * 1000);
      const missedDays = calculateMissedDays(almostYesterday);

      // 23 hours is still within 1 day
      expect(missedDays).toBe(0);
    });
  });
});
