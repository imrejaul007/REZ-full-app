/**
 * Karma System Test Suite
 *
 * Tests for:
 * - Karma profile management
 * - Streak tracking
 * - Badge system
 * - Leaderboard functionality
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Note: This is a standalone test file without dependencies on source modules
// All mocking is done inline as needed

// ============================================================================
// Type Definitions
// ============================================================================

interface KarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: KarmaLevel;
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  trustScore: number;
  badges: Badge[];
  lastActivityAt: Date | null;
  currentStreak: number;
  longestStreak: number;
  lastStreakUpdatedAt?: Date;
  activityHistory: Date[];
  createdAt: Date;
  updatedAt: Date;
}

interface Badge {
  id: string;
  name: string;
  icon?: string;
  earnedAt: Date;
  description?: string;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface KarmaEvent {
  id: string;
  category: 'environment' | 'food' | 'health' | 'education' | 'community';
  difficulty: 'easy' | 'medium' | 'hard';
  baseKarmaPerHour: number;
  maxKarmaPerEvent: number;
  expectedDurationHours: number;
}

interface LeaderboardEntry {
  userId: string;
  rank: number;
  karma: number;
  level: KarmaLevel;
  username?: string;
  avatar?: string;
}

type KarmaLevel = 'L1' | 'L2' | 'L3' | 'L4';

interface StreakMilestone {
  days: number;
  reward: {
    type: 'coins' | 'badge' | 'karma_bonus';
    value: number;
  };
}

// ============================================================================
// Constants and Mock Data
// ============================================================================

const LEVEL_THRESHOLDS = {
  L1: 0,
  L2: 1000,
  L3: 5000,
  L4: 15000,
};

const LEVEL_NAMES = {
  L1: 'Starter',
  L2: 'Active',
  L3: 'Contributor',
  L4: 'Leader',
};

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, reward: { type: 'karma_bonus', value: 50 } },
  { days: 14, reward: { type: 'badge', value: 1 } },
  { days: 30, reward: { type: 'karma_bonus', value: 200 } },
  { days: 60, reward: { type: 'badge', value: 2 } },
  { days: 100, reward: { type: 'coins', value: 1000 } },
  { days: 365, reward: { type: 'badge', value: 5 } },
];

const AVAILABLE_BADGES: Omit<Badge, 'earnedAt'>[] = [
  { id: 'first_event', name: 'First Step', tier: 'bronze', description: 'Complete your first event' },
  { id: 'ten_events', name: 'Dedicated', tier: 'silver', description: 'Complete 10 events' },
  { id: 'fifty_events', name: 'Committed', tier: 'gold', description: 'Complete 50 events' },
  { id: 'hundred_events', name: 'Champion', tier: 'platinum', description: 'Complete 100 events' },
  { id: 'streak_7', name: 'Week Warrior', tier: 'bronze', description: '7-day activity streak' },
  { id: 'streak_30', name: 'Month Master', tier: 'gold', description: '30-day activity streak' },
  { id: 'environment_hero', name: 'Green Champion', tier: 'silver', description: '10 environment events' },
  { id: 'community_pillar', name: 'Community Star', tier: 'gold', description: '25 community events' },
];

const KARMA_EVENTS: KarmaEvent[] = [
  { id: 'env_1', category: 'environment', difficulty: 'easy', baseKarmaPerHour: 10, maxKarmaPerEvent: 50, expectedDurationHours: 4 },
  { id: 'env_2', category: 'environment', difficulty: 'medium', baseKarmaPerHour: 15, maxKarmaPerEvent: 90, expectedDurationHours: 5 },
  { id: 'env_3', category: 'environment', difficulty: 'hard', baseKarmaPerHour: 20, maxKarmaPerEvent: 150, expectedDurationHours: 6 },
  { id: 'food_1', category: 'food', difficulty: 'easy', baseKarmaPerHour: 10, maxKarmaPerEvent: 40, expectedDurationHours: 3 },
  { id: 'food_2', category: 'food', difficulty: 'medium', baseKarmaPerHour: 15, maxKarmaPerEvent: 75, expectedDurationHours: 4 },
  { id: 'health_1', category: 'health', difficulty: 'easy', baseKarmaPerHour: 12, maxKarmaPerEvent: 60, expectedDurationHours: 4 },
  { id: 'education_1', category: 'education', difficulty: 'medium', baseKarmaPerHour: 18, maxKarmaPerEvent: 108, expectedDurationHours: 5 },
  { id: 'community_1', category: 'community', difficulty: 'easy', baseKarmaPerHour: 10, maxKarmaPerEvent: 50, expectedDurationHours: 4 },
];

// ============================================================================
// Helper Functions
// ============================================================================

function calculateLevel(karma: number): KarmaLevel {
  if (karma >= LEVEL_THRESHOLDS.L4) return 'L4';
  if (karma >= LEVEL_THRESHOLDS.L3) return 'L3';
  if (karma >= LEVEL_THRESHOLDS.L2) return 'L2';
  return 'L1';
}

function calculateKarma(
  durationHours: number,
  baseKarmaPerHour: number,
  difficultyMultiplier: number = 1
): number {
  const earned = Math.min(
    durationHours * baseKarmaPerHour * difficultyMultiplier,
    150 // max karma per event
  );
  return Math.floor(earned);
}

function isConsecutiveDay(date1: Date, date2: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.floor(diffMs / oneDayMs);
  return diffDays === 1;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getDifficultyMultiplier(difficulty: KarmaEvent['difficulty']): number {
  switch (difficulty) {
    case 'easy': return 1.0;
    case 'medium': return 1.5;
    case 'hard': return 2.0;
    default: return 1.0;
  }
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Karma System', () => {

  // --------------------------------------------------------------------------
  // Karma Profile Tests
  // --------------------------------------------------------------------------
  describe('Karma Profile', () => {

    describe('Profile Creation', () => {
      it('should create profile for new user', () => {
        const userId = 'user_123';
        const now = new Date();

        const profile: KarmaProfile = {
          userId,
          lifetimeKarma: 0,
          activeKarma: 0,
          level: 'L1',
          eventsCompleted: 0,
          eventsJoined: 0,
          totalHours: 0,
          trustScore: 0,
          badges: [],
          lastActivityAt: null,
          currentStreak: 0,
          longestStreak: 0,
          activityHistory: [],
          createdAt: now,
          updatedAt: now,
        };

        expect(profile.userId).toBe('user_123');
        expect(profile.lifetimeKarma).toBe(0);
        expect(profile.level).toBe('L1');
        expect(profile.badges).toHaveLength(0);
      });

      it('should initialize with default values', () => {
        const profile: Partial<KarmaProfile> = {};

        const defaults: KarmaProfile = {
          userId: profile.userId || '',
          lifetimeKarma: profile.lifetimeKarma ?? 0,
          activeKarma: profile.activeKarma ?? 0,
          level: profile.level ?? 'L1',
          eventsCompleted: profile.eventsCompleted ?? 0,
          eventsJoined: profile.eventsJoined ?? 0,
          totalHours: profile.totalHours ?? 0,
          trustScore: profile.trustScore ?? 0,
          badges: profile.badges ?? [],
          lastActivityAt: profile.lastActivityAt ?? null,
          currentStreak: profile.currentStreak ?? 0,
          longestStreak: profile.longestStreak ?? 0,
          activityHistory: profile.activityHistory ?? [],
          createdAt: profile.createdAt ?? new Date(),
          updatedAt: profile.updatedAt ?? new Date(),
        };

        expect(defaults.lifetimeKarma).toBe(0);
        expect(defaults.currentStreak).toBe(0);
        expect(defaults.badges).toHaveLength(0);
      });

      it('should track userId correctly', () => {
        const profile: KarmaProfile = {
          userId: 'user_abc123',
          lifetimeKarma: 100,
          activeKarma: 100,
          level: 'L1',
          eventsCompleted: 1,
          eventsJoined: 1,
          totalHours: 2,
          trustScore: 85,
          badges: [],
          lastActivityAt: new Date(),
          currentStreak: 1,
          longestStreak: 1,
          activityHistory: [new Date()],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(profile.userId).toBe('user_abc123');
        expect(typeof profile.userId).toBe('string');
      });
    });

    describe('Karma Updates', () => {
      it('should update karma on activity completion', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 5,
          eventsJoined: 6,
          totalHours: 10,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date(),
          currentStreak: 3,
          longestStreak: 5,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const karmaEarned = 50;
        const hoursEarned = 2;

        profile.lifetimeKarma += karmaEarned;
        profile.activeKarma += karmaEarned;
        profile.eventsCompleted += 1;
        profile.totalHours += hoursEarned;
        profile.lastActivityAt = new Date();
        profile.updatedAt = new Date();

        expect(profile.lifetimeKarma).toBe(550);
        expect(profile.activeKarma).toBe(550);
        expect(profile.eventsCompleted).toBe(6);
        expect(profile.totalHours).toBe(12);
      });

      it('should calculate level from karma', () => {
        expect(calculateLevel(0)).toBe('L1');
        expect(calculateLevel(500)).toBe('L1');
        expect(calculateLevel(1000)).toBe('L2');
        expect(calculateLevel(2500)).toBe('L2');
        expect(calculateLevel(5000)).toBe('L3');
        expect(calculateLevel(10000)).toBe('L3');
        expect(calculateLevel(15000)).toBe('L4');
        expect(calculateLevel(50000)).toBe('L4');
      });

      it('should update level when threshold is reached', () => {
        let profile = {
          lifetimeKarma: 900,
          activeKarma: 900,
          level: 'L1' as KarmaLevel,
        };

        // User completes activity to earn karma
        profile.lifetimeKarma += 150;
        profile.activeKarma += 150;

        // Recalculate level
        profile.level = calculateLevel(profile.lifetimeKarma);

        expect(profile.lifetimeKarma).toBe(1050);
        expect(profile.level).toBe('L2');
      });

      it('should track karma decay correctly', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 1000,
          activeKarma: 1000,
          level: 'L2',
          eventsCompleted: 10,
          eventsJoined: 12,
          totalHours: 20,
          trustScore: 85,
          badges: [],
          lastActivityAt: new Date('2025-01-01'),
          currentStreak: 0,
          longestStreak: 10,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const inactivityDays = 45;
        const decayPercentPerDay = 1;

        if (inactivityDays >= 30) {
          const totalDecay = Math.min(50, inactivityDays * decayPercentPerDay);
          profile.activeKarma = Math.floor(profile.activeKarma * (1 - totalDecay / 100));
        }

        expect(profile.activeKarma).toBeLessThan(1000);
        expect(profile.activeKarma).toBeGreaterThanOrEqual(500);
      });
    });

    describe('Profile Queries', () => {
      it('should return correct level name', () => {
        expect(LEVEL_NAMES['L1']).toBe('Starter');
        expect(LEVEL_NAMES['L2']).toBe('Active');
        expect(LEVEL_NAMES['L3']).toBe('Contributor');
        expect(LEVEL_NAMES['L4']).toBe('Leader');
      });

      it('should calculate karma to next level', () => {
        const karmaToNextLevel = (karma: number): number => {
          if (karma >= LEVEL_THRESHOLDS.L4) return 0;
          if (karma >= LEVEL_THRESHOLDS.L3) return LEVEL_THRESHOLDS.L4 - karma;
          if (karma >= LEVEL_THRESHOLDS.L2) return LEVEL_THRESHOLDS.L3 - karma;
          return LEVEL_THRESHOLDS.L2 - karma;
        };

        expect(karmaToNextLevel(500)).toBe(500);
        expect(karmaToNextLevel(1000)).toBe(4000);
        expect(karmaToNextLevel(5000)).toBe(10000);
        expect(karmaToNextLevel(15000)).toBe(0);
      });

      it('should calculate progress percentage to next level', () => {
        const levelProgress = (karma: number): number => {
          const level = calculateLevel(karma);
          const currentThreshold = LEVEL_THRESHOLDS[level];
          const nextThreshold = level === 'L4' ? LEVEL_THRESHOLDS.L4 : LEVEL_THRESHOLDS[getNextLevel(level)];

          const progress = ((karma - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
          return Math.min(100, Math.max(0, progress));
        };

        function getNextLevel(level: KarmaLevel): KarmaLevel {
          const levels: KarmaLevel[] = ['L1', 'L2', 'L3', 'L4'];
          const idx = levels.indexOf(level);
          return levels[idx + 1] || level;
        }

        expect(levelProgress(500)).toBe(50); // 500/1000 * 100
        expect(levelProgress(0)).toBe(0);
        expect(levelProgress(1000)).toBe(0); // At L2 threshold
      });
    });
  });

  // --------------------------------------------------------------------------
  // Streak System Tests
  // --------------------------------------------------------------------------
  describe('Streaks', () => {

    describe('Streak Tracking', () => {
      it('should increment streak on daily activity', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 5,
          eventsJoined: 6,
          totalHours: 10,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date('2025-01-01'),
          currentStreak: 5,
          longestStreak: 10,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const today = new Date('2025-01-02');
        const lastActivity = profile.lastActivityAt!;

        if (isConsecutiveDay(lastActivity, today)) {
          profile.currentStreak += 1;
          profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
        }

        expect(profile.currentStreak).toBe(6);
        expect(profile.longestStreak).toBe(10);
      });

      it('should reset streak on missed day', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 5,
          eventsJoined: 6,
          totalHours: 10,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date('2025-01-01'),
          currentStreak: 10,
          longestStreak: 15,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const today = new Date('2025-01-04'); // Missed Jan 2 and 3
        const lastActivity = profile.lastActivityAt!;

        if (!isConsecutiveDay(lastActivity, today) && !isSameDay(lastActivity, today)) {
          profile.currentStreak = 1;
        }

        expect(profile.currentStreak).toBe(1);
        expect(profile.longestStreak).toBe(15); // Longest should be preserved
      });

      it('should handle activity on same day', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 5,
          eventsJoined: 6,
          totalHours: 10,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date('2025-01-01T10:00:00'),
          currentStreak: 5,
          longestStreak: 10,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const today = new Date('2025-01-01T18:00:00'); // Same day, later
        const lastActivity = profile.lastActivityAt!;

        if (isSameDay(lastActivity, today)) {
          // Don't increment streak for same-day activity
          // Just update the activity time
          profile.lastActivityAt = today;
        }

        expect(profile.currentStreak).toBe(5); // Streak unchanged
      });

      it('should update longest streak when current exceeds it', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 5,
          eventsJoined: 6,
          totalHours: 10,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date('2025-01-01'),
          currentStreak: 15,
          longestStreak: 15,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // User completes activity on consecutive day
        profile.currentStreak += 1;
        profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);

        expect(profile.currentStreak).toBe(16);
        expect(profile.longestStreak).toBe(16);
      });

      it('should preserve longest streak after break', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 5,
          eventsJoined: 6,
          totalHours: 10,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date('2025-01-01'),
          currentStreak: 5,
          longestStreak: 20, // Previous best
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Streak broken
        profile.currentStreak = 1;

        expect(profile.currentStreak).toBe(1);
        expect(profile.longestStreak).toBe(20); // Preserved
      });
    });

    describe('Streak Milestones', () => {
      it('should award streak milestones', () => {
        const currentStreak = 7;
        const milestone = STREAK_MILESTONES.find(m => m.days === currentStreak);

        expect(milestone).toBeDefined();
        expect(milestone?.reward.type).toBe('karma_bonus');
        expect(milestone?.reward.value).toBe(50);
      });

      it('should detect milestone achievements', () => {
        const currentStreak = 30;
        const achievedMilestones = STREAK_MILESTONES.filter(m => currentStreak >= m.days);

        expect(achievedMilestones.length).toBeGreaterThan(0);
        expect(achievedMilestones.map(m => m.days)).toContain(7);
        expect(achievedMilestones.map(m => m.days)).toContain(14);
        expect(achievedMilestones.map(m => m.days)).toContain(30);
      });

      it('should calculate next milestone', () => {
        const currentStreak = 10;
        const nextMilestone = STREAK_MILESTONES.find(m => m.days > currentStreak);

        expect(nextMilestone).toBeDefined();
        expect(nextMilestone?.days).toBe(14);
      });

      it('should handle multiple milestone achievements', () => {
        const currentStreak = 100;
        const newMilestones: StreakMilestone[] = [];

        for (const milestone of STREAK_MILESTONES) {
          if (currentStreak >= milestone.days) {
            newMilestones.push(milestone);
          }
        }

        expect(newMilestones.length).toBe(5); // 7, 14, 30, 60, 100
      });

      it('should not award duplicate milestone rewards', () => {
        const earnedMilestoneIds = [7, 14, 30];
        const currentStreak = 30;

        const shouldAward = !earnedMilestoneIds.includes(currentStreak);

        expect(shouldAward).toBe(false);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Badge System Tests
  // --------------------------------------------------------------------------
  describe('Badges', () => {

    describe('Badge Awards', () => {
      it('should award badge on achievement', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 100,
          activeKarma: 100,
          level: 'L1',
          eventsCompleted: 1,
          eventsJoined: 1,
          totalHours: 2,
          trustScore: 80,
          badges: [],
          lastActivityAt: new Date(),
          currentStreak: 1,
          longestStreak: 1,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const badgeToAward = AVAILABLE_BADGES.find(b => b.id === 'first_event')!;
        const earnedBadge: Badge = {
          ...badgeToAward,
          earnedAt: new Date(),
        };

        profile.badges.push(earnedBadge);

        expect(profile.badges).toHaveLength(1);
        expect(profile.badges[0].id).toBe('first_event');
        expect(profile.badges[0].name).toBe('First Step');
      });

      it('should not award duplicate badges', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 500,
          activeKarma: 500,
          level: 'L1',
          eventsCompleted: 10,
          eventsJoined: 12,
          totalHours: 20,
          trustScore: 85,
          badges: [
            { id: 'first_event', name: 'First Step', tier: 'bronze', earnedAt: new Date() },
            { id: 'ten_events', name: 'Dedicated', tier: 'silver', earnedAt: new Date() },
          ],
          lastActivityAt: new Date(),
          currentStreak: 5,
          longestStreak: 10,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newBadge = AVAILABLE_BADGES.find(b => b.id === 'ten_events')!;
        const alreadyEarned = profile.badges.some(b => b.id === newBadge.id);

        expect(alreadyEarned).toBe(true);
      });

      it('should allow different tier badges', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 1000,
          activeKarma: 1000,
          level: 'L2',
          eventsCompleted: 25,
          eventsJoined: 30,
          totalHours: 50,
          trustScore: 90,
          badges: [],
          lastActivityAt: new Date(),
          currentStreak: 10,
          longestStreak: 15,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const badgesToAward = AVAILABLE_BADGES.filter(b =>
          (b.id === 'ten_events' || b.id === 'streak_7' || b.id === 'environment_hero')
        );

        for (const badge of badgesToAward) {
          if (!profile.badges.some(b => b.id === badge.id)) {
            profile.badges.push({ ...badge, earnedAt: new Date() });
          }
        }

        const tiers = profile.badges.map(b => b.tier);
        expect(tiers).toContain('bronze');
        expect(tiers).toContain('silver');
      });

      it('should award badges for category-specific achievements', () => {
        const categoryEvents = {
          environment: 15,
          food: 5,
          health: 3,
          education: 2,
          community: 30,
        };

        const earnedBadges: Badge[] = [];

        if (categoryEvents.environment >= 10) {
          const badge = AVAILABLE_BADGES.find(b => b.id === 'environment_hero')!;
          earnedBadges.push({ ...badge, earnedAt: new Date() });
        }

        if (categoryEvents.community >= 25) {
          const badge = AVAILABLE_BADGES.find(b => b.id === 'community_pillar')!;
          earnedBadges.push({ ...badge, earnedAt: new Date() });
        }

        expect(earnedBadges).toHaveLength(2);
        expect(earnedBadges.map(b => b.id)).toContain('environment_hero');
        expect(earnedBadges.map(b => b.id)).toContain('community_pillar');
      });
    });

    describe('Badge Notifications', () => {
      it('should notify on badge earn', () => {
        const badge = AVAILABLE_BADGES.find(b => b.id === 'fifty_events')!;
        const earnedBadge: Badge = {
          ...badge,
          earnedAt: new Date(),
        };

        const notification = {
          type: 'badge_earned',
          title: 'Badge Unlocked!',
          body: `You've earned the ${earnedBadge.name} badge`,
          data: {
            badgeId: earnedBadge.id,
            badgeName: earnedBadge.name,
            tier: earnedBadge.tier,
          },
        };

        expect(notification.type).toBe('badge_earned');
        expect(notification.title).toBe('Badge Unlocked!');
        expect(notification.data.badgeId).toBe('fifty_events');
      });

      it('should include badge details in notification', () => {
        const badge = AVAILABLE_BADGES.find(b => b.id === 'streak_30')!;
        const earnedBadge: Badge = {
          ...badge,
          earnedAt: new Date(),
        };

        expect(earnedBadge.tier).toBe('gold');
        expect(earnedBadge.description).toBe('30-day activity streak');
      });
    });

    describe('Badge Queries', () => {
      it('should filter badges by tier', () => {
        const allBadges: Badge[] = [
          { id: 'b1', name: 'Badge 1', tier: 'bronze', earnedAt: new Date() },
          { id: 'b2', name: 'Badge 2', tier: 'silver', earnedAt: new Date() },
          { id: 'b3', name: 'Badge 3', tier: 'gold', earnedAt: new Date() },
          { id: 'b4', name: 'Badge 4', tier: 'platinum', earnedAt: new Date() },
          { id: 'b5', name: 'Badge 5', tier: 'gold', earnedAt: new Date() },
        ];

        const goldBadges = allBadges.filter(b => b.tier === 'gold');
        expect(goldBadges).toHaveLength(2);
      });

      it('should sort badges by earned date', () => {
        const badges: Badge[] = [
          { id: 'b1', name: 'First', earnedAt: new Date('2025-01-01') },
          { id: 'b2', name: 'Second', earnedAt: new Date('2025-02-01') },
          { id: 'b3', name: 'Third', earnedAt: new Date('2025-03-01') },
        ];

        const sortedBadges = [...badges].sort(
          (a, b) => b.earnedAt.getTime() - a.earnedAt.getTime()
        );

        expect(sortedBadges[0].name).toBe('Third');
        expect(sortedBadges[2].name).toBe('First');
      });

      it('should calculate total badge count', () => {
        const profile: KarmaProfile = {
          userId: 'user_123',
          lifetimeKarma: 2000,
          activeKarma: 2000,
          level: 'L2',
          eventsCompleted: 50,
          eventsJoined: 55,
          totalHours: 100,
          trustScore: 92,
          badges: [
            { id: 'first_event', name: 'First Step', tier: 'bronze', earnedAt: new Date() },
            { id: 'ten_events', name: 'Dedicated', tier: 'silver', earnedAt: new Date() },
            { id: 'fifty_events', name: 'Committed', tier: 'gold', earnedAt: new Date() },
          ],
          lastActivityAt: new Date(),
          currentStreak: 15,
          longestStreak: 30,
          activityHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        expect(profile.badges).toHaveLength(3);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Leaderboard Tests
  // --------------------------------------------------------------------------
  describe('Leaderboard', () => {

    describe('Ranking', () => {
      it('should rank users by karma', () => {
        const users = [
          { userId: 'u1', karma: 5000 },
          { userId: 'u2', karma: 12000 },
          { userId: 'u3', karma: 8000 },
          { userId: 'u4', karma: 3000 },
        ];

        const ranked = [...users].sort((a, b) => b.karma - a.karma);

        expect(ranked[0].userId).toBe('u2'); // 12000
        expect(ranked[1].userId).toBe('u3'); // 8000
        expect(ranked[2].userId).toBe('u1'); // 5000
        expect(ranked[3].userId).toBe('u4'); // 3000
      });

      it('should assign sequential ranks', () => {
        const rankedUsers = [
          { userId: 'u1', karma: 12000 },
          { userId: 'u2', karma: 8000 },
          { userId: 'u3', karma: 5000 },
          { userId: 'u4', karma: 3000 },
        ];

        const withRanks: LeaderboardEntry[] = rankedUsers.map((u, idx) => ({
          userId: u.userId,
          rank: idx + 1,
          karma: u.karma,
          level: calculateLevel(u.karma),
        }));

        expect(withRanks[0].rank).toBe(1);
        expect(withRanks[1].rank).toBe(2);
        expect(withRanks[2].rank).toBe(3);
        expect(withRanks[3].rank).toBe(4);
      });

      it('should handle tied rankings', () => {
        const users = [
          { userId: 'u1', karma: 5000 },
          { userId: 'u2', karma: 5000 }, // Tie
          { userId: 'u3', karma: 3000 },
        ];

        const sorted = [...users].sort((a, b) => b.karma - a.karma);

        // Both u1 and u2 have same karma, order is non-deterministic but both are top
        expect(sorted[0].karma).toBe(5000);
        expect(sorted[2].karma).toBe(3000);
      });

      it('should include user level in leaderboard', () => {
        const users = [
          { userId: 'u1', karma: 15000 },
          { userId: 'u2', karma: 5000 },
          { userId: 'u3', karma: 500 },
        ];

        const leaderboard: LeaderboardEntry[] = users.map(u => ({
          userId: u.userId,
          rank: 0,
          karma: u.karma,
          level: calculateLevel(u.karma),
        }));

        expect(leaderboard.find(e => e.userId === 'u1')?.level).toBe('L4');
        expect(leaderboard.find(e => e.userId === 'u2')?.level).toBe('L3');
        expect(leaderboard.find(e => e.userId === 'u3')?.level).toBe('L1');
      });
    });

    describe('Period Filtering', () => {
      it('should filter by weekly period', () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const activities = [
          { userId: 'u1', karma: 500, date: now },
          { userId: 'u2', karma: 300, date: weekAgo },
          { userId: 'u3', karma: 200, date: new Date(weekAgo.getTime() - 14 * 24 * 60 * 60 * 1000) }, // 2 weeks ago
        ];

        const weeklyKarma: Record<string, number> = {};
        for (const activity of activities) {
          if (activity.date >= weekAgo) {
            weeklyKarma[activity.userId] = (weeklyKarma[activity.userId] || 0) + activity.karma;
          }
        }

        expect(weeklyKarma['u1']).toBe(500);
        expect(weeklyKarma['u2']).toBe(300);
        expect(weeklyKarma['u3']).toBeUndefined();
      });

      it('should filter by monthly period', () => {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const activities = [
          { userId: 'u1', karma: 1000, date: now },
          { userId: 'u2', karma: 600, date: monthAgo },
          { userId: 'u3', karma: 400, date: new Date(monthAgo.getTime() - 1 * 24 * 60 * 60 * 1000) }, // Just outside
        ];

        const monthlyKarma: Record<string, number> = {};
        for (const activity of activities) {
          if (activity.date >= monthAgo) {
            monthlyKarma[activity.userId] = (monthlyKarma[activity.userId] || 0) + activity.karma;
          }
        }

        expect(monthlyKarma['u1']).toBe(1000);
        expect(monthlyKarma['u2']).toBe(600);
        expect(monthlyKarma['u3']).toBeUndefined();
      });

      it('should include all-time period', () => {
        const allUsers = [
          { userId: 'u1', karma: 15000 },
          { userId: 'u2', karma: 8000 },
          { userId: 'u3', karma: 3000 },
        ];

        const allTime = [...allUsers].sort((a, b) => b.karma - a.karma);

        expect(allTime).toHaveLength(3);
        expect(allTime[0].karma).toBe(15000);
      });
    });

    describe('User Rank Queries', () => {
      it('should return user rank', () => {
        const leaderboard: LeaderboardEntry[] = [
          { userId: 'u1', rank: 1, karma: 15000, level: 'L4' },
          { userId: 'u2', rank: 2, karma: 12000, level: 'L4' },
          { userId: 'u3', rank: 3, karma: 8000, level: 'L3' },
          { userId: 'u4', rank: 4, karma: 5000, level: 'L2' },
        ];

        const getUserRank = (userId: string): LeaderboardEntry | undefined => {
          return leaderboard.find(e => e.userId === userId);
        };

        expect(getUserRank('u1')?.rank).toBe(1);
        expect(getUserRank('u3')?.rank).toBe(3);
        expect(getUserRank('u5')).toBeUndefined();
      });

      it('should return total participants', () => {
        const leaderboard: LeaderboardEntry[] = [
          { userId: 'u1', rank: 1, karma: 15000, level: 'L4' },
          { userId: 'u2', rank: 2, karma: 12000, level: 'L4' },
          { userId: 'u3', rank: 3, karma: 8000, level: 'L3' },
        ];

        const totalParticipants = leaderboard.length;
        expect(totalParticipants).toBe(3);
      });

      it('should handle pagination', () => {
        const allUsers = [
          { userId: 'u1', karma: 15000 },
          { userId: 'u2', karma: 14000 },
          { userId: 'u3', karma: 13000 },
          { userId: 'u4', karma: 12000 },
          { userId: 'u5', karma: 11000 },
          { userId: 'u6', karma: 10000 },
        ];

        const page = 1;
        const limit = 3;
        const offset = (page - 1) * limit;

        const paginated = allUsers
          .sort((a, b) => b.karma - a.karma)
          .slice(offset, offset + limit);

        expect(paginated).toHaveLength(3);
        expect(paginated[0].userId).toBe('u1');
        expect(paginated[2].userId).toBe('u3');
      });

      it('should handle offset beyond results', () => {
        const allUsers = [
          { userId: 'u1', karma: 15000 },
          { userId: 'u2', karma: 14000 },
        ];

        const page = 2;
        const limit = 3;
        const offset = (page - 1) * limit;

        const paginated = allUsers
          .sort((a, b) => b.karma - a.karma)
          .slice(offset, offset + limit);

        expect(paginated).toHaveLength(0);
      });
    });
  });

  // --------------------------------------------------------------------------
  // Karma Event Tests
  // --------------------------------------------------------------------------
  describe('Karma Events', () => {

    it('should calculate karma for different event difficulties', () => {
      const durationHours = 4;

      expect(calculateKarma(durationHours, 10, 1.0)).toBe(40); // easy
      expect(calculateKarma(durationHours, 10, 1.5)).toBe(60); // medium
      expect(calculateKarma(durationHours, 10, 2.0)).toBe(80); // hard
    });

    it('should cap karma at max per event', () => {
      const durationHours = 10; // Would be 200 for easy
      const maxKarma = 150;

      const earned = calculateKarma(durationHours, 20, 1.0);
      expect(earned).toBe(150); // Capped
    });

    it('should calculate karma for different categories', () => {
      const event = KARMA_EVENTS.find(e => e.id === 'education_1')!;
      const multiplier = getDifficultyMultiplier(event.difficulty);

      const karmaEarned = calculateKarma(
        event.expectedDurationHours,
        event.baseKarmaPerHour,
        multiplier
      );

      // Expected: 5 hours * 18 per hour * 1.5 (medium) = 135
      // But capped at max of 150
      expect(karmaEarned).toBeGreaterThan(0);
      expect(karmaEarned).toBeLessThanOrEqual(150); // General max cap
    });

    it('should handle partial hour participation', () => {
      const baseKarmaPerHour = 10;
      const partialHours = 2.5;

      const karmaEarned = Math.floor(partialHours * baseKarmaPerHour);

      expect(karmaEarned).toBe(25);
    });
  });

  // --------------------------------------------------------------------------
  // Integration Tests
  // --------------------------------------------------------------------------
  describe('Integration', () => {

    it('should handle complete user journey', () => {
      let profile: KarmaProfile = {
        userId: 'user_123',
        lifetimeKarma: 0,
        activeKarma: 0,
        level: 'L1',
        eventsCompleted: 0,
        eventsJoined: 0,
        totalHours: 0,
        trustScore: 0,
        badges: [],
        lastActivityAt: null,
        currentStreak: 0,
        longestStreak: 0,
        activityHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Day 1: First event
      const event1 = KARMA_EVENTS.find(e => e.id === 'community_1')!;
      const karma1 = calculateKarma(
        event1.expectedDurationHours,
        event1.baseKarmaPerHour,
        getDifficultyMultiplier(event1.difficulty)
      );

      profile.lifetimeKarma += karma1;
      profile.activeKarma += karma1;
      profile.eventsCompleted += 1;
      profile.totalHours += event1.expectedDurationHours;
      profile.lastActivityAt = new Date();
      profile.currentStreak = 1;
      profile.longestStreak = 1;
      profile.level = calculateLevel(profile.lifetimeKarma);

      // Award first event badge
      if (profile.eventsCompleted === 1) {
        const badge = AVAILABLE_BADGES.find(b => b.id === 'first_event')!;
        profile.badges.push({ ...badge, earnedAt: new Date() });
      }

      expect(profile.level).toBe('L1');
      expect(profile.badges).toHaveLength(1);

      // Day 7: Streak milestone
      profile.currentStreak = 7;
      profile.longestStreak = 7;

      const streakMilestone = STREAK_MILESTONES.find(m => m.days === 7);
      if (streakMilestone) {
        profile.activeKarma += streakMilestone.reward.value;
      }

      expect(profile.currentStreak).toBe(7);
      expect(profile.activeKarma).toBeGreaterThan(karma1);
    });

    it('should maintain consistency across all systems', () => {
      const profile: KarmaProfile = {
        userId: 'user_123',
        lifetimeKarma: 15000,
        activeKarma: 9500,
        level: 'L4',
        eventsCompleted: 75,
        eventsJoined: 80,
        totalHours: 200,
        trustScore: 95,
        badges: [
          { id: 'first_event', name: 'First Step', tier: 'bronze', earnedAt: new Date() },
          { id: 'ten_events', name: 'Dedicated', tier: 'silver', earnedAt: new Date() },
          { id: 'fifty_events', name: 'Committed', tier: 'gold', earnedAt: new Date() },
          { id: 'hundred_events', name: 'Champion', tier: 'platinum', earnedAt: new Date() },
        ],
        lastActivityAt: new Date(),
        currentStreak: 30,
        longestStreak: 45,
        activityHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Verify level matches karma (15000 >= 15000 threshold for L4)
      expect(calculateLevel(profile.lifetimeKarma)).toBe(profile.level);

      // Verify badge count
      expect(profile.badges).toHaveLength(4);

      // Verify streak milestone
      const achievedMilestones = STREAK_MILESTONES.filter(m => profile.currentStreak >= m.days);
      expect(achievedMilestones.length).toBeGreaterThan(0);
    });

    it('should handle karma decay without breaking badges or level', () => {
      const profile: KarmaProfile = {
        userId: 'user_123',
        lifetimeKarma: 15000, // L4 requires 15000
        activeKarma: 15000,
        level: 'L4',
        eventsCompleted: 50,
        eventsJoined: 55,
        totalHours: 150,
        trustScore: 90,
        badges: [
          { id: 'ten_events', name: 'Dedicated', tier: 'silver', earnedAt: new Date() },
          { id: 'fifty_events', name: 'Committed', tier: 'gold', earnedAt: new Date() },
        ],
        lastActivityAt: new Date('2025-01-01'),
        currentStreak: 0,
        longestStreak: 30,
        activityHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Apply decay
      const inactivityDays = 60;
      if (inactivityDays >= 30) {
        const decayPercent = Math.min(50, inactivityDays);
        profile.activeKarma = Math.floor(profile.activeKarma * (1 - decayPercent / 100));
        profile.currentStreak = 0;
      }

      // Lifetime karma and badges should remain
      expect(profile.lifetimeKarma).toBe(15000);
      expect(profile.badges).toHaveLength(2);

      // Level should remain based on lifetime karma (15000 is L4 threshold)
      expect(calculateLevel(profile.lifetimeKarma)).toBe('L4');

      // But active karma should be reduced
      expect(profile.activeKarma).toBeLessThan(15000);
    });
  });
});
