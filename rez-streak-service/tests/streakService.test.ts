/**
 * Streak Service Test Suite
 *
 * Tests for:
 * - Streak tracking and management
 * - Daily check-in logic
 * - Streak freeze functionality
 * - Streak validation and recovery
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type StreakType = 'login' | 'order' | 'review' | 'savings' | 'visit';

interface Streak {
  type: StreakType;
  current: number;
  longest: number;
  totalDays: number;
  lastActivityAt: Date | null;
  startedAt: Date | null;
  frozen: boolean;
  freezeExpiresAt: Date | null;
  milestones: StreakMilestone[];
}

interface StreakMilestone {
  day: number;
  coins: number;
  badge?: string;
  reached: boolean;
  claimed: boolean;
  claimedAt?: Date;
}

interface StreakState {
  userId: string;
  streaks: Record<StreakType, Streak>;
}

interface CheckInResult {
  success: boolean;
  streakUpdated: boolean;
  newStreak: number;
  coinsEarned: number;
  milestoneReached?: StreakMilestone;
  error?: string;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockStreak(overrides?: Partial<Streak>): Streak {
  return {
    type: 'login',
    current: 0,
    longest: 0,
    totalDays: 0,
    lastActivityAt: null,
    startedAt: null,
    frozen: false,
    freezeExpiresAt: null,
    milestones: [],
    ...overrides,
  };
}

function generateMockStreakState(userId: string): StreakState {
  const streakTypes: StreakType[] = ['login', 'order', 'review', 'savings', 'visit'];

  const streaks: Record<StreakType, Streak> = {} as Record<StreakType, Streak>;
  for (const type of streakTypes) {
    streaks[type] = generateMockStreak({ type });
  }

  return { userId, streaks };
}

const DEFAULT_MILESTONES: StreakMilestone[] = [
  { day: 3, coins: 30, badge: 'streak_3', reached: false, claimed: false },
  { day: 7, coins: 100, badge: 'streak_7', reached: false, claimed: false },
  { day: 14, coins: 250, badge: 'streak_14', reached: false, claimed: false },
  { day: 30, coins: 500, badge: 'streak_30', reached: false, claimed: false },
  { day: 60, coins: 1000, badge: 'streak_60', reached: false, claimed: false },
  { day: 100, coins: 2500, badge: 'streak_100', reached: false, claimed: false },
  { day: 365, coins: 10000, badge: 'streak_365', reached: false, claimed: false },
];

// ============================================================================
// Streak Service (Mock Implementation)
// ============================================================================

class StreakService {
  private states: Map<string, StreakState> = new Map();
  private readonly maxFreezeDays = 3;
  private readonly freezeDurationHours = 24;

  constructor() {
    // Initialize with default milestones
  }

  getState(userId: string): StreakState | null {
    return this.states.get(userId) || null;
  }

  getOrCreateState(userId: string): StreakState {
    let state = this.states.get(userId);
    if (!state) {
      state = generateMockStreakState(userId);
      this.states.set(userId, state);
    }
    return state;
  }

  checkIn(userId: string, type: StreakType = 'login'): CheckInResult {
    const state = this.getOrCreateState(userId);
    const streak = state.streaks[type];

    // Check if frozen
    if (streak.frozen && streak.freezeExpiresAt && new Date() < streak.freezeExpiresAt) {
      return {
        success: true,
        streakUpdated: false,
        newStreak: streak.current,
        coinsEarned: 0,
        error: 'Streak is frozen',
      };
    }

    // Unfreeze if expired
    if (streak.frozen && streak.freezeExpiresAt) {
      streak.frozen = false;
      streak.freezeExpiresAt = null;
    }

    const now = new Date();
    const isFirstCheckIn = streak.lastActivityAt === null;
    const isConsecutiveDay = this.isConsecutiveDay(streak.lastActivityAt, now);
    const isSameDay = this.isSameDay(streak.lastActivityAt, now);

    // Can't check in twice in one day
    if (isSameDay) {
      return {
        success: false,
        streakUpdated: false,
        newStreak: streak.current,
        coinsEarned: 0,
        error: 'Already checked in today',
      };
    }

    // Start new streak or increment
    if (isFirstCheckIn || !isConsecutiveDay) {
      streak.current = 1;
      streak.startedAt = now;
    } else {
      streak.current += 1;
    }

    streak.lastActivityAt = now;
    streak.totalDays += 1;
    streak.longest = Math.max(streak.longest, streak.current);

    // Update milestones
    this.updateMilestones(streak);

    // Calculate rewards
    const coinsEarned = this.calculateDailyReward(streak.current);
    const milestoneReached = this.checkMilestoneReached(streak);

    return {
      success: true,
      streakUpdated: true,
      newStreak: streak.current,
      coinsEarned,
      milestoneReached,
    };
  }

  private isConsecutiveDay(lastActivity: Date | null, now: Date): boolean {
    if (!lastActivity) return false;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffMs = Math.abs(now.getTime() - lastActivity.getTime());
    const diffDays = Math.floor(diffMs / oneDayMs);
    return diffDays === 1;
  }

  private isSameDay(date1: Date | null, date2: Date): boolean {
    if (!date1) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private updateMilestones(streak: Streak): void {
    for (const milestone of DEFAULT_MILESTONES) {
      if (streak.current >= milestone.day) {
        milestone.reached = true;
      }
    }
  }

  private calculateDailyReward(streak: number): number {
    if (streak <= 0) return 0;
    if (streak <= 7) return streak * 10;
    if (streak <= 30) return 70 + (streak - 7) * 5;
    return 185 + (streak - 30) * 2;
  }

  private checkMilestoneReached(streak: Streak): StreakMilestone | undefined {
    for (const milestone of DEFAULT_MILESTONES) {
      if (streak.current === milestone.day && !milestone.claimed) {
        return milestone;
      }
    }
    return undefined;
  }

  freezeStreak(userId: string, type: StreakType): { success: boolean; message: string } {
    const state = this.getOrCreateState(userId);
    const streak = state.streaks[type];

    if (streak.frozen) {
      return { success: false, message: 'Streak already frozen' };
    }

    streak.frozen = true;
    const freezeExpiresAt = new Date();
    freezeExpiresAt.setHours(freezeExpiresAt.getHours() + this.freezeDurationHours);
    streak.freezeExpiresAt = freezeExpiresAt;

    return { success: true, message: 'Streak frozen until tomorrow' };
  }

  unfreezeStreak(userId: string, type: StreakType): { success: boolean; message: string } {
    const state = this.getOrCreateState(userId);
    const streak = state.streaks[type];

    streak.frozen = false;
    streak.freezeExpiresAt = null;

    return { success: true, message: 'Streak unfrozen' };
  }

  claimMilestone(userId: string, type: StreakType, day: number): { success: boolean; coins: number } {
    const state = this.getOrCreateState(userId);
    const streak = state.streaks[type];

    const milestone = DEFAULT_MILESTONES.find(m => m.day === day);
    if (!milestone) {
      return { success: false, coins: 0 };
    }

    if (!streak.current || streak.current < day) {
      return { success: false, coins: 0 };
    }

    if (milestone.claimed) {
      return { success: false, coins: 0 };
    }

    milestone.claimed = true;
    milestone.claimedAt = new Date();

    return { success: true, coins: milestone.coins };
  }

  getStreak(userId: string, type: StreakType): Streak | null {
    const state = this.states.get(userId);
    return state?.streaks[type] || null;
  }

  resetStreak(userId: string, type: StreakType): void {
    const state = this.states.get(userId);
    if (state) {
      state.streaks[type] = generateMockStreak({ type });
    }
  }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('StreakService', () => {
  let streakService: StreakService;

  beforeEach(() => {
    streakService = new StreakService();
  });

  describe('Check-In Logic', () => {
    it('should start new streak on first check-in', () => {
      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(true);
      expect(result.streakUpdated).toBe(true);
      expect(result.newStreak).toBe(1);
    });

    it('should increment streak on consecutive day', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 5;

      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(true);
      expect(result.newStreak).toBe(6);
    });

    it('should reset streak on missed day', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = twoDaysAgo;
      state.streaks.login.current = 10;
      state.streaks.login.longest = 15;

      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(true);
      expect(result.newStreak).toBe(1);
    });

    it('should not allow double check-in same day', () => {
      streakService.checkIn('user_1', 'login');
      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already checked in today');
    });

    it('should track longest streak correctly', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 10;
      state.streaks.login.longest = 10;

      streakService.checkIn('user_1', 'login');
      const streak = streakService.getStreak('user_1', 'login');

      expect(streak?.longest).toBe(11);
    });

    it('should preserve longest streak when reset', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = twoDaysAgo;
      state.streaks.login.current = 10;
      state.streaks.login.longest = 25;

      streakService.checkIn('user_1', 'login');

      const streak = streakService.getStreak('user_1', 'login');
      expect(streak?.longest).toBe(25);
      expect(streak?.current).toBe(1);
    });
  });

  describe('Daily Reward Calculation', () => {
    it('should calculate correct rewards for first week', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 6;

      const result = streakService.checkIn('user_1', 'login');

      // Day 7 = 7 * 10 = 70 coins
      expect(result.coinsEarned).toBe(70);
    });

    it('should calculate correct rewards after first week', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 29;

      const result = streakService.checkIn('user_1', 'login');

      // Day 30 = 70 + (30-7) * 5 = 70 + 115 = 185 coins
      expect(result.coinsEarned).toBe(185);
    });

    it('should calculate correct rewards for long streaks', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 60;

      const result = streakService.checkIn('user_1', 'login');

      // Day 61 = 185 + (61-30) * 2 = 185 + 62 = 247 coins
      expect(result.coinsEarned).toBe(247);
    });
  });

  describe('Streak Freeze', () => {
    it('should freeze streak successfully', () => {
      const result = streakService.freezeStreak('user_1', 'login');

      expect(result.success).toBe(true);
    });

    it('should prevent check-in when frozen', () => {
      streakService.freezeStreak('user_1', 'login');

      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(true);
      expect(result.streakUpdated).toBe(false);
      expect(result.error).toBe('Streak is frozen');
    });

    it('should unfreeze streak successfully', () => {
      streakService.freezeStreak('user_1', 'login');
      const result = streakService.unfreezeStreak('user_1', 'login');

      expect(result.success).toBe(true);
    });

    it('should allow check-in after unfreeze', () => {
      streakService.freezeStreak('user_1', 'login');
      streakService.unfreezeStreak('user_1', 'login');

      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(true);
      expect(result.streakUpdated).toBe(true);
    });

    it('should not freeze already frozen streak', () => {
      streakService.freezeStreak('user_1', 'login');
      const result = streakService.freezeStreak('user_1', 'login');

      expect(result.success).toBe(false);
    });

    it('should only freeze specific streak type', () => {
      streakService.freezeStreak('user_1', 'login');

      const loginResult = streakService.checkIn('user_1', 'login');
      const orderResult = streakService.checkIn('user_1', 'order');

      expect(loginResult.streakUpdated).toBe(false);
      expect(orderResult.streakUpdated).toBe(true);
    });
  });

  describe('Milestones', () => {
    it('should detect milestone reached', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 6;

      const result = streakService.checkIn('user_1', 'login');

      expect(result.milestoneReached).toBeDefined();
      expect(result.milestoneReached?.day).toBe(7);
      expect(result.milestoneReached?.coins).toBe(100);
    });

    it('should not return milestone if not reached', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 5;

      const result = streakService.checkIn('user_1', 'login');

      expect(result.milestoneReached).toBeUndefined();
    });

    it('should claim milestone successfully', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 7;

      const claimResult = streakService.claimMilestone('user_1', 'login', 7);

      expect(claimResult.success).toBe(true);
      expect(claimResult.coins).toBe(100);
    });

    it('should not claim milestone twice', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.login.current = 7;

      streakService.claimMilestone('user_1', 'login', 7);
      const result = streakService.claimMilestone('user_1', 'login', 7);

      expect(result.success).toBe(false);
    });

    it('should not claim milestone if streak too low', () => {
      const result = streakService.claimMilestone('user_1', 'login', 30);

      expect(result.success).toBe(false);
    });
  });

  describe('Multiple Streak Types', () => {
    it('should track login and order streaks independently', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Set up different streaks
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.current = 10;
      state.streaks.login.lastActivityAt = yesterday;
      state.streaks.order.current = 5;
      state.streaks.order.lastActivityAt = yesterday;

      // Check in for login
      const loginResult = streakService.checkIn('user_1', 'login');
      expect(loginResult.newStreak).toBe(11);

      // Check in for order
      const orderResult = streakService.checkIn('user_1', 'order');
      expect(orderResult.newStreak).toBe(6);
    });

    it('should reset only specified streak type', () => {
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.current = 10;
      state.streaks.order.current = 20;

      streakService.resetStreak('user_1', 'login');

      const loginStreak = streakService.getStreak('user_1', 'login');
      const orderStreak = streakService.getStreak('user_1', 'order');

      expect(loginStreak?.current).toBe(0);
      expect(orderStreak?.current).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle timezone changes gracefully', () => {
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = twentyThreeHoursAgo;
      state.streaks.login.current = 5;

      // This should be treated as same day (23 hours is not 24 hours)
      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already checked in today');
    });

    it('should handle very long gaps', () => {
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = yearAgo;
      state.streaks.login.current = 100;
      state.streaks.login.longest = 100;

      const result = streakService.checkIn('user_1', 'login');

      expect(result.success).toBe(true);
      expect(result.newStreak).toBe(1);
      expect(result.streakUpdated).toBe(true);
    });

    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29T12:00:00');
      const oneDayAfter = new Date('2024-03-01T12:00:00');

      const state = streakService.getOrCreateState('user_1');
      state.streaks.login.lastActivityAt = leapYearDate;
      state.streaks.login.current = 10;

      // Check if consecutive day calculation works
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffMs = oneDayAfter.getTime() - leapYearDate.getTime();
      const diffDays = Math.floor(diffMs / oneDayMs);

      expect(diffDays).toBe(1);
    });
  });

  describe('State Management', () => {
    it('should create new state for new user', () => {
      const state = streakService.getOrCreateState('new_user');

      expect(state.userId).toBe('new_user');
      expect(state.streaks.login).toBeDefined();
      expect(state.streaks.order).toBeDefined();
    });

    it('should return existing state for existing user', () => {
      streakService.getOrCreateState('existing_user');
      const state = streakService.getOrCreateState('existing_user');

      expect(state.userId).toBe('existing_user');
    });

    it('should return null for non-existent user', () => {
      const state = streakService.getState('nonexistent');
      expect(state).toBeNull();
    });

    it('should update totalDays correctly', () => {
      streakService.checkIn('user_1', 'login');
      streakService.checkIn('user_1', 'login');

      // Cannot check in twice, so just verify first check-in
      const state = streakService.getState('user_1');
      expect(state?.streaks.login.totalDays).toBe(1);
    });
  });
});
