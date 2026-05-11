/**
 * Karma Test Fixtures
 *
 * Provides test data generators for karma events:
 * - Karma events by category
 * - Karma events by difficulty
 * - Karma profiles at different levels
 *
 * Usage:
 *   import { createKarmaEvent, createEnvironmentEvent, createTestKarmaProfile } from './karmaFixtures';
 */

import mongoose from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export type KarmaCategory = 'environment' | 'food' | 'health' | 'education' | 'community';
export type KarmaDifficulty = 'easy' | 'medium' | 'hard';
export type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';

export interface TestKarmaEvent {
  id: string;
  name: string;
  description: string;
  category: KarmaCategory;
  difficulty: KarmaDifficulty;
  baseKarmaPerHour: number;
  maxKarmaPerEvent: number;
  expectedDurationHours: number;
  coinReward: number;
  participants?: number;
}

export interface TestKarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: KarmaLevel;
  eventsCompleted: number;
  eventsJoined: number;
  totalHours: number;
  trustScore: number;
  categoryBreakdown: Record<KarmaCategory, number>;
  badges: TestBadge[];
  streak: TestKarmaStreak;
}

export interface TestBadge {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  category?: KarmaCategory;
  source: 'karma' | 'loyalty' | 'cross';
}

export interface TestKarmaStreak {
  current: number;
  longest: number;
  lastActivityAt?: Date;
}

// ============================================================================
// Karma Events Catalog
// ============================================================================

export const KARMA_EVENTS: Record<string, TestKarmaEvent> = {
  // Environment Events
  env_tree_planting: {
    id: 'env_tree_planting',
    name: 'Tree Planting Drive',
    description: 'Participate in planting trees in your community',
    category: 'environment',
    difficulty: 'medium',
    baseKarmaPerHour: 15,
    maxKarmaPerEvent: 90,
    expectedDurationHours: 4,
    coinReward: 50,
  },
  env_beach_cleanup: {
    id: 'env_beach_cleanup',
    name: 'Beach Cleanup',
    description: 'Help clean up local beaches',
    category: 'environment',
    difficulty: 'easy',
    baseKarmaPerHour: 12,
    maxKarmaPerEvent: 60,
    expectedDurationHours: 3,
    coinReward: 30,
  },
  env_recycling: {
    id: 'env_recycling',
    name: 'Recycling Drive',
    description: 'Sort and recycle waste materials',
    category: 'environment',
    difficulty: 'easy',
    baseKarmaPerHour: 10,
    maxKarmaPerEvent: 40,
    expectedDurationHours: 2,
    coinReward: 20,
  },
  env_awareness: {
    id: 'env_awareness',
    name: 'Environment Awareness Campaign',
    description: 'Spread awareness about environmental conservation',
    category: 'environment',
    difficulty: 'medium',
    baseKarmaPerHour: 18,
    maxKarmaPerEvent: 108,
    expectedDurationHours: 4,
    coinReward: 55,
  },
  env_forest_watch: {
    id: 'env_forest_watch',
    name: 'Forest Watch',
    description: 'Monitor and protect forest areas',
    category: 'environment',
    difficulty: 'hard',
    baseKarmaPerHour: 20,
    maxKarmaPerEvent: 150,
    expectedDurationHours: 5,
    coinReward: 80,
  },

  // Food Events
  food_donation: {
    id: 'food_donation',
    name: 'Food Donation Camp',
    description: 'Donate food to shelters and orphanages',
    category: 'food',
    difficulty: 'medium',
    baseKarmaPerHour: 12,
    maxKarmaPerEvent: 72,
    expectedDurationHours: 4,
    coinReward: 40,
  },
  food_cooking: {
    id: 'food_cooking',
    name: 'Community Cooking',
    description: 'Cook meals for the underprivileged',
    category: 'food',
    difficulty: 'medium',
    baseKarmaPerHour: 14,
    maxKarmaPerEvent: 84,
    expectedDurationHours: 4,
    coinReward: 45,
  },
  food_awareness: {
    id: 'food_awareness',
    name: 'Nutrition Awareness',
    description: 'Educate communities about nutrition',
    category: 'food',
    difficulty: 'easy',
    baseKarmaPerHour: 10,
    maxKarmaPerEvent: 50,
    expectedDurationHours: 3,
    coinReward: 25,
  },

  // Health Events
  health_blood_donation: {
    id: 'health_blood_donation',
    name: 'Blood Donation Camp',
    description: 'Donate blood at a blood donation camp',
    category: 'health',
    difficulty: 'medium',
    baseKarmaPerHour: 20,
    maxKarmaPerEvent: 100,
    expectedDurationHours: 2,
    coinReward: 60,
  },
  health_yoga: {
    id: 'health_yoga',
    name: 'Yoga Session',
    description: 'Lead or participate in yoga sessions',
    category: 'health',
    difficulty: 'easy',
    baseKarmaPerHour: 12,
    maxKarmaPerEvent: 48,
    expectedDurationHours: 3,
    coinReward: 25,
  },
  health_awareness: {
    id: 'health_awareness',
    name: 'Health Awareness Camp',
    description: 'Conduct health awareness programs',
    category: 'health',
    difficulty: 'medium',
    baseKarmaPerHour: 15,
    maxKarmaPerEvent: 90,
    expectedDurationHours: 4,
    coinReward: 50,
  },
  health_marathon: {
    id: 'health_marathon',
    name: 'Charity Marathon',
    description: 'Participate in charity runs',
    category: 'health',
    difficulty: 'hard',
    baseKarmaPerHour: 18,
    maxKarmaPerEvent: 120,
    expectedDurationHours: 4,
    coinReward: 70,
  },

  // Education Events
  edu_tutoring: {
    id: 'edu_tutoring',
    name: 'Tutoring Session',
    description: 'Tutor underprivileged students',
    category: 'education',
    difficulty: 'medium',
    baseKarmaPerHour: 18,
    maxKarmaPerEvent: 108,
    expectedDurationHours: 4,
    coinReward: 55,
  },
  edu_workshop: {
    id: 'edu_workshop',
    name: 'Skill Workshop',
    description: 'Conduct skill development workshops',
    category: 'education',
    difficulty: 'hard',
    baseKarmaPerHour: 20,
    maxKarmaPerEvent: 150,
    expectedDurationHours: 5,
    coinReward: 80,
  },
  edu_book_donation: {
    id: 'edu_book_donation',
    name: 'Book Donation',
    description: 'Donate books to libraries',
    category: 'education',
    difficulty: 'easy',
    baseKarmaPerHour: 10,
    maxKarmaPerEvent: 40,
    expectedDurationHours: 2,
    coinReward: 20,
  },
  edu_awareness: {
    id: 'edu_awareness',
    name: 'Education Awareness',
    description: 'Spread awareness about education importance',
    category: 'education',
    difficulty: 'easy',
    baseKarmaPerHour: 12,
    maxKarmaPerEvent: 60,
    expectedDurationHours: 3,
    coinReward: 30,
  },

  // Community Events
  comm_elderly_care: {
    id: 'comm_elderly_care',
    name: 'Elderly Care Visit',
    description: 'Visit and spend time with elderly',
    category: 'community',
    difficulty: 'easy',
    baseKarmaPerHour: 10,
    maxKarmaPerEvent: 40,
    expectedDurationHours: 3,
    coinReward: 25,
  },
  comm_festival: {
    id: 'comm_festival',
    name: 'Festival Setup',
    description: 'Help with community festival setup',
    category: 'community',
    difficulty: 'medium',
    baseKarmaPerHour: 14,
    maxKarmaPerEvent: 84,
    expectedDurationHours: 4,
    coinReward: 45,
  },
  comm_charity: {
    id: 'comm_charity',
    name: 'Charity Drive',
    description: 'Organize charity drives',
    category: 'community',
    difficulty: 'medium',
    baseKarmaPerHour: 15,
    maxKarmaPerEvent: 90,
    expectedDurationHours: 4,
    coinReward: 50,
  },
  comm_volunteer: {
    id: 'comm_volunteer',
    name: 'Community Volunteering',
    description: 'General community volunteering',
    category: 'community',
    difficulty: 'easy',
    baseKarmaPerHour: 12,
    maxKarmaPerEvent: 60,
    expectedDurationHours: 3,
    coinReward: 30,
  },
};

// ============================================================================
// Badges
// ============================================================================

export const BADGES = {
  // Event Count Badges
  first_event: { id: 'first_event', name: 'First Steps', rarity: 'common' as const },
  ten_events: { id: 'ten_events', name: 'Dedicated Contributor', rarity: 'rare' as const },
  fifty_events: { id: 'fifty_events', name: 'Committed Champion', rarity: 'epic' as const },
  hundred_events: { id: 'hundred_events', name: 'Karma Legend', rarity: 'legendary' as const },

  // Streak Badges
  streak_7: { id: 'streak_7', name: 'Week Warrior', rarity: 'common' as const },
  streak_30: { id: 'streak_30', name: 'Month Master', rarity: 'rare' as const },
  streak_100: { id: 'streak_100', name: 'Century Champion', rarity: 'epic' as const },

  // Category Badges
  env_hero: { id: 'env_hero', name: 'Green Champion', rarity: 'rare' as const, category: 'environment' as KarmaCategory },
  env_master: { id: 'env_master', name: 'Environment Master', rarity: 'epic' as const, category: 'environment' as KarmaCategory },
  health_hero: { id: 'health_hero', name: 'Wellness Champion', rarity: 'rare' as const, category: 'health' as KarmaCategory },
  edu_hero: { id: 'edu_hero', name: 'Education Champion', rarity: 'rare' as const, category: 'education' as KarmaCategory },
  comm_hero: { id: 'comm_hero', name: 'Community Star', rarity: 'rare' as const, category: 'community' as KarmaCategory },

  // Level Badges
  level_up_active: { id: 'level_up_active', name: 'Active Achiever', rarity: 'common' as const },
  level_up_contributor: { id: 'level_up_contributor', name: 'Top Contributor', rarity: 'rare' as const },
  level_up_leader: { id: 'level_up_leader', name: 'Community Leader', rarity: 'epic' as const },
  level_up_elite: { id: 'level_up_elite', name: 'Elite Changemaker', rarity: 'legendary' as const },
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${new mongoose.Types.ObjectId().toString().slice(0, 12)}`;
}

function getKarmaLevel(karma: number): KarmaLevel {
  if (karma >= 5000) return 'elite';
  if (karma >= 2000) return 'leader';
  if (karma >= 500) return 'contributor';
  if (karma >= 100) return 'active';
  return 'starter';
}

function calculateKarma(event: TestKarmaEvent, hours: number): number {
  const difficultyMultiplier = { easy: 1.0, medium: 1.5, hard: 2.0 };
  const multiplier = difficultyMultiplier[event.difficulty];
  return Math.min(Math.floor(hours * event.baseKarmaPerHour * multiplier), event.maxKarmaPerEvent);
}

// ============================================================================
// Event Fixtures
// ============================================================================

export function createKarmaEvent(overrides?: Partial<TestKarmaEvent>): TestKarmaEvent {
  return {
    id: generateId('event'),
    name: 'Test Karma Event',
    description: 'A test karma event for testing purposes',
    category: 'community',
    difficulty: 'easy',
    baseKarmaPerHour: 10,
    maxKarmaPerEvent: 50,
    expectedDurationHours: 3,
    coinReward: 25,
    ...overrides,
  };
}

export function createEnvironmentEvent(overrides?: Partial<TestKarmaEvent>): TestKarmaEvent {
  return createKarmaEvent({
    category: 'environment',
    name: 'Environment Event',
    ...overrides,
  });
}

export function createFoodEvent(overrides?: Partial<TestKarmaEvent>): TestKarmaEvent {
  return createKarmaEvent({
    category: 'food',
    name: 'Food Event',
    ...overrides,
  });
}

export function createHealthEvent(overrides?: Partial<TestKarmaEvent>): TestKarmaEvent {
  return createKarmaEvent({
    category: 'health',
    name: 'Health Event',
    ...overrides,
  });
}

export function createEducationEvent(overrides?: Partial<TestKarmaEvent>): TestKarmaEvent {
  return createKarmaEvent({
    category: 'education',
    name: 'Education Event',
    ...overrides,
  });
}

export function createCommunityEvent(overrides?: Partial<TestKarmaEvent>): TestKarmaEvent {
  return createKarmaEvent({
    category: 'community',
    name: 'Community Event',
    ...overrides,
  });
}

// ============================================================================
// Event Catalog Fixtures
// ============================================================================

export function getEventByCategory(category: KarmaCategory): TestKarmaEvent[] {
  return Object.values(KARMA_EVENTS).filter(event => event.category === category);
}

export function getEventByDifficulty(difficulty: KarmaDifficulty): TestKarmaEvent[] {
  return Object.values(KARMA_EVENTS).filter(event => event.difficulty === difficulty);
}

export function getRandomEvent(): TestKarmaEvent {
  const events = Object.values(KARMA_EVENTS);
  return events[Math.floor(Math.random() * events.length)];
}

export function getRandomEventsByCategory(category: KarmaCategory, count: number): TestKarmaEvent[] {
  const categoryEvents = getEventByCategory(category);
  const selected: TestKarmaEvent[] = [];

  for (let i = 0; i < count && categoryEvents.length > 0; i++) {
    const index = Math.floor(Math.random() * categoryEvents.length);
    selected.push(categoryEvents.splice(index, 1)[0]);
  }

  return selected;
}

// ============================================================================
// Profile Fixtures
// ============================================================================

export function createTestKarmaProfile(overrides?: Partial<TestKarmaProfile>): TestKarmaProfile {
  const userId = generateId('user');

  return {
    userId,
    lifetimeKarma: 0,
    activeKarma: 0,
    level: 'starter',
    eventsCompleted: 0,
    eventsJoined: 0,
    totalHours: 0,
    trustScore: 100,
    categoryBreakdown: {
      environment: 0,
      food: 0,
      health: 0,
      education: 0,
      community: 0,
    },
    badges: [],
    streak: {
      current: 0,
      longest: 0,
    },
    ...overrides,
  };
}

export function createStarterProfile(): TestKarmaProfile {
  return createTestKarmaProfile({
    lifetimeKarma: 50,
    activeKarma: 50,
    level: 'starter',
    eventsCompleted: 3,
    eventsJoined: 4,
    totalHours: 8,
    trustScore: 95,
    categoryBreakdown: {
      environment: 1,
      food: 1,
      health: 0,
      education: 0,
      community: 1,
    },
  });
}

export function createActiveProfile(): TestKarmaProfile {
  return createTestKarmaProfile({
    lifetimeKarma: 300,
    activeKarma: 300,
    level: 'active',
    eventsCompleted: 15,
    eventsJoined: 18,
    totalHours: 45,
    trustScore: 90,
    categoryBreakdown: {
      environment: 4,
      food: 4,
      health: 3,
      education: 2,
      community: 2,
    },
    badges: [BADGES.first_event, BADGES.streak_7],
  });
}

export function createContributorProfile(): TestKarmaProfile {
  return createTestKarmaProfile({
    lifetimeKarma: 1200,
    activeKarma: 1200,
    level: 'contributor',
    eventsCompleted: 40,
    eventsJoined: 48,
    totalHours: 140,
    trustScore: 85,
    categoryBreakdown: {
      environment: 10,
      food: 10,
      health: 8,
      education: 7,
      community: 5,
    },
    badges: [BADGES.first_event, BADGES.ten_events, BADGES.streak_7, BADGES.streak_30],
    streak: {
      current: 30,
      longest: 45,
      lastActivityAt: new Date(),
    },
  });
}

export function createLeaderProfile(): TestKarmaProfile {
  return createTestKarmaProfile({
    lifetimeKarma: 3500,
    activeKarma: 3500,
    level: 'leader',
    eventsCompleted: 80,
    eventsJoined: 95,
    totalHours: 300,
    trustScore: 80,
    categoryBreakdown: {
      environment: 20,
      food: 20,
      health: 15,
      education: 15,
      community: 10,
    },
    badges: [
      BADGES.first_event,
      BADGES.ten_events,
      BADGES.fifty_events,
      BADGES.streak_7,
      BADGES.streak_30,
      BADGES.streak_100,
      BADGES.env_hero,
      BADGES.health_hero,
    ],
    streak: {
      current: 60,
      longest: 100,
      lastActivityAt: new Date(),
    },
  });
}

export function createEliteProfile(): TestKarmaProfile {
  return createTestKarmaProfile({
    lifetimeKarma: 7000,
    activeKarma: 7000,
    level: 'elite',
    eventsCompleted: 180,
    eventsJoined: 200,
    totalHours: 650,
    trustScore: 95,
    categoryBreakdown: {
      environment: 45,
      food: 40,
      health: 35,
      education: 35,
      community: 25,
    },
    badges: [
      BADGES.first_event,
      BADGES.ten_events,
      BADGES.fifty_events,
      BADGES.hundred_events,
      BADGES.streak_7,
      BADGES.streak_30,
      BADGES.streak_100,
      BADGES.env_hero,
      BADGES.env_master,
      BADGES.health_hero,
      BADGES.edu_hero,
      BADGES.comm_hero,
      BADGES.level_up_elite,
    ],
    streak: {
      current: 120,
      longest: 200,
      lastActivityAt: new Date(),
    },
  });
}

// ============================================================================
// Event Participation Fixtures
// ============================================================================

export function simulateEventParticipation(event: TestKarmaEvent, hours?: number): {
  karmaEarned: number;
  coinsEarned: number;
  actualHours: number;
} {
  const actualHours = hours || event.expectedDurationHours;
  const karmaEarned = calculateKarma(event, actualHours);
  const coinsEarned = event.coinReward;

  return {
    karmaEarned,
    coinsEarned,
    actualHours,
  };
}

export function createEventCompletion(
  userId: string,
  event: TestKarmaEvent,
  hours?: number
): {
  eventId: string;
  userId: string;
  event: TestKarmaEvent;
  karmaEarned: number;
  coinsEarned: number;
  completedAt: Date;
} {
  const result = simulateEventParticipation(event, hours);

  return {
    eventId: generateId('completion'),
    userId,
    event,
    karmaEarned: result.karmaEarned,
    coinsEarned: result.coinsEarned,
    completedAt: new Date(),
  };
}

// ============================================================================
// Batch Generators
// ============================================================================

export function createKarmaProfiles(count: number, level?: KarmaLevel): TestKarmaProfile[] {
  const profiles: TestKarmaProfile[] = [];

  const generators = {
    starter: createStarterProfile,
    active: createActiveProfile,
    contributor: createContributorProfile,
    leader: createLeaderProfile,
    elite: createEliteProfile,
  };

  for (let i = 0; i < count; i++) {
    let profile: TestKarmaProfile;

    if (level) {
      profile = generators[level]();
    } else {
      const levels: KarmaLevel[] = ['starter', 'active', 'contributor', 'leader', 'elite'];
      const rand = Math.random();
      if (rand < 0.4) profile = createStarterProfile();
      else if (rand < 0.65) profile = createActiveProfile();
      else if (rand < 0.85) profile = createContributorProfile();
      else if (rand < 0.95) profile = createLeaderProfile();
      else profile = createEliteProfile();
    }

    profile.userId = generateId('user');
    profiles.push(profile);
  }

  return profiles;
}

export function createEventHistory(
  userId: string,
  category: KarmaCategory,
  count: number
): ReturnType<typeof createEventCompletion>[] {
  const events = getRandomEventsByCategory(category, count);
  return events.map(event => createEventCompletion(userId, event));
}

// ============================================================================
// Edge Case Fixtures
// ============================================================================

export function createNewKarmaUser(): TestKarmaProfile {
  return createTestKarmaProfile();
}

export function createMaxedKarmaUser(): TestKarmaProfile {
  return createEliteProfile();
}

export function createEventCompletionNearCap(event: TestKarmaEvent): {
  karmaEarned: number;
  hours: number;
} {
  // Use hours that would result in karma very close to but not exceeding max
  const difficultyMultiplier = { easy: 1.0, medium: 1.5, hard: 2.0 };
  const multiplier = difficultyMultiplier[event.difficulty];

  // Calculate hours needed to get just under max
  const hours = (event.maxKarmaPerEvent - 1) / (event.baseKarmaPerHour * multiplier);

  return {
    hours: Math.floor(hours * 10) / 10, // Round to 1 decimal
    karmaEarned: event.maxKarmaPerEvent - 1,
  };
}
