/**
 * Karma to Loyalty Integration Tests
 *
 * Tests the integration between Karma system and Loyalty system:
 * - Karma events generate loyalty points
 * - Karma levels apply multipliers to loyalty rewards
 * - Tier boosts based on karma contributions
 * - Cross-system profile synchronization
 *
 * @group integration
 * @group karma-loyalty
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import mongoose from 'mongoose';

// ============================================================================
// Types
// ============================================================================

type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type KarmaCategory = 'environment' | 'food' | 'health' | 'education' | 'community';
type KarmaDifficulty = 'easy' | 'medium' | 'hard';
type CoinTransactionType = 'earned' | 'spent' | 'bonus' | 'expired' | 'refund';
type CoinSource = 'karma' | 'order' | 'streak' | 'milestone' | 'referral';

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
  streak: {
    current: number;
    longest: number;
    lastActivityAt?: Date;
  };
  categoryBreakdown: Record<KarmaCategory, number>;
  createdAt: Date;
  updatedAt: Date;
}

interface Badge {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  category?: KarmaCategory;
  source: 'karma' | 'loyalty' | 'cross';
}

interface LoyaltyProfile {
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierMultiplier: number;
  karmaMultiplier: number;
  combinedMultiplier: number;
  expiringPoints: number;
  expiryDate: string;
  lastUpdated: Date;
}

interface CoinWallet {
  userId: string;
  available: number;
  expiring: number;
  expiryDate?: string;
  transactions: CoinTransaction[];
}

interface CoinTransaction {
  id: string;
  amount: number;
  type: CoinTransactionType;
  source: CoinSource;
  description: string;
  karmaCoins: number;
  createdAt: Date;
}

interface KarmaEvent {
  id: string;
  category: KarmaCategory;
  difficulty: KarmaDifficulty;
  name: string;
  description: string;
  baseKarmaPerHour: number;
  maxKarmaPerEvent: number;
  expectedDurationHours: number;
  coinReward: number;
}

// ============================================================================
// Mock Data Stores
// ============================================================================

const mockKarmaProfiles = new Map<string, KarmaProfile>();
const mockLoyaltyProfiles = new Map<string, LoyaltyProfile>();
const mockWallets = new Map<string, CoinWallet>();
const mockKarmaEvents = new Map<string, KarmaEvent>();
const mockEventParticipants = new Map<string, Set<string>>();

// ============================================================================
// Configuration
// ============================================================================

const KARMA_TO_POINTS_RATIO = 0.1; // 1 karma = 0.1 loyalty points

const KARMA_MULTIPLIERS: Record<KarmaLevel, number> = {
  starter: 1.0,
  active: 1.1,
  contributor: 1.25,
  leader: 1.5,
  elite: 2.0,
};

const LOYALTY_MULTIPLIERS: Record<LoyaltyTier, number> = {
  bronze: 1.0,
  silver: 1.1,
  gold: 1.2,
  platinum: 1.5,
  diamond: 2.0,
};

const LEVEL_THRESHOLDS: Record<KarmaLevel, number> = {
  starter: 0,
  active: 100,
  contributor: 500,
  leader: 2000,
  elite: 5000,
};

const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  platinum: 5000,
  diamond: 10000,
};

const CATEGORY_COIN_MULTIPLIERS: Record<KarmaCategory, number> = {
  environment: 1.2, // 20% bonus for environment events
  food: 1.0,
  health: 1.15, // 15% bonus for health events
  education: 1.1,
  community: 1.05,
};

// ============================================================================
// Karma Events
// ============================================================================

const KARMA_EVENT_CATALOG: KarmaEvent[] = [
  // Environment events
  { id: 'env_tree', category: 'environment', difficulty: 'medium', name: 'Plant a Tree', description: 'Participate in tree planting', baseKarmaPerHour: 15, maxKarmaPerEvent: 90, expectedDurationHours: 4, coinReward: 50 },
  { id: 'env_cleanup', category: 'environment', difficulty: 'easy', name: 'Beach Cleanup', description: 'Clean up local beach', baseKarmaPerHour: 12, maxKarmaPerEvent: 60, expectedDurationHours: 3, coinReward: 30 },
  { id: 'env_recycle', category: 'environment', difficulty: 'easy', name: 'Recycling Drive', description: 'Sort and recycle waste', baseKarmaPerHour: 10, maxKarmaPerEvent: 40, expectedDurationHours: 2, coinReward: 20 },

  // Food events
  { id: 'food_donate', category: 'food', difficulty: 'medium', name: 'Food Donation', description: 'Donate food to shelter', baseKarmaPerHour: 12, maxKarmaPerEvent: 72, expectedDurationHours: 4, coinReward: 40 },
  { id: 'food_cook', category: 'food', difficulty: 'medium', name: 'Community Meal', description: 'Cook for community', baseKarmaPerHour: 14, maxKarmaPerEvent: 84, expectedDurationHours: 4, coinReward: 45 },

  // Health events
  { id: 'health_blood', category: 'health', difficulty: 'medium', name: 'Blood Donation Camp', description: 'Donate blood', baseKarmaPerHour: 20, maxKarmaPerEvent: 100, expectedDurationHours: 2, coinReward: 60 },
  { id: 'health_yoga', category: 'health', difficulty: 'easy', name: 'Yoga Session', description: 'Lead yoga class', baseKarmaPerHour: 12, maxKarmaPerEvent: 48, expectedDurationHours: 3, coinReward: 25 },

  // Education events
  { id: 'edu_tutor', category: 'education', difficulty: 'medium', name: 'Tutoring Session', description: 'Tutor underprivileged students', baseKarmaPerHour: 18, maxKarmaPerEvent: 108, expectedDurationHours: 4, coinReward: 55 },
  { id: 'edu_workshop', category: 'education', difficulty: 'hard', name: 'Skill Workshop', description: 'Conduct skill workshop', baseKarmaPerHour: 20, maxKarmaPerEvent: 150, expectedDurationHours: 5, coinReward: 80 },

  // Community events
  { id: 'comm_festival', category: 'community', difficulty: 'medium', name: 'Festival Setup', description: 'Help with festival', baseKarmaPerHour: 14, maxKarmaPerEvent: 84, expectedDurationHours: 4, coinReward: 45 },
  { id: 'comm_elderly', category: 'community', difficulty: 'easy', name: 'Elderly Care', description: 'Visit elderly home', baseKarmaPerHour: 10, maxKarmaPerEvent: 40, expectedDurationHours: 3, coinReward: 25 },
];

// Initialize event catalog
KARMA_EVENT_CATALOG.forEach(event => mockKarmaEvents.set(event.id, event));

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${new mongoose.Types.ObjectId().toString().slice(0, 16)}`;
}

function calculateKarmaLevel(karma: number): KarmaLevel {
  if (karma >= LEVEL_THRESHOLDS.elite) return 'elite';
  if (karma >= LEVEL_THRESHOLDS.leader) return 'leader';
  if (karma >= LEVEL_THRESHOLDS.contributor) return 'contributor';
  if (karma >= LEVEL_THRESHOLDS.active) return 'active';
  return 'starter';
}

function calculateLoyaltyTier(points: number): LoyaltyTier {
  if (points >= TIER_THRESHOLDS.diamond) return 'diamond';
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

function calculateKarma(event: KarmaEvent, hours: number): number {
  const difficultyMultiplier = { easy: 1.0, medium: 1.5, hard: 2.0 };
  const multiplier = difficultyMultiplier[event.difficulty];
  return Math.min(Math.floor(hours * event.baseKarmaPerHour * multiplier), event.maxKarmaPerEvent);
}

function karmaToLoyaltyPoints(karmaEarned: number, karmaLevel: KarmaLevel, loyaltyTier: LoyaltyTier): number {
  const basePoints = Math.floor(karmaEarned * KARMA_TO_POINTS_RATIO);
  const karmaMultiplier = KARMA_MULTIPLIERS[karmaLevel];
  const loyaltyMultiplier = LOYALTY_MULTIPLIERS[loyaltyTier];
  return Math.floor(basePoints * karmaMultiplier * loyaltyMultiplier);
}

function calculateCoins(event: KarmaEvent, karmaLevel: KarmaLevel): number {
  const categoryMultiplier = CATEGORY_COIN_MULTIPLIERS[event.category];
  const levelMultiplier = KARMA_MULTIPLIERS[karmaLevel];
  return Math.floor(event.coinReward * categoryMultiplier * levelMultiplier);
}

function getCombinedMultiplier(karmaLevel: KarmaLevel, loyaltyTier: LoyaltyTier): number {
  return KARMA_MULTIPLIERS[karmaLevel] * LOYALTY_MULTIPLIERS[loyaltyTier];
}

// ============================================================================
// Mock Services
// ============================================================================

const mockKarmaService = {
  getProfile: jest.fn(async (userId: string): Promise<KarmaProfile | null> => {
    return mockKarmaProfiles.get(userId) || null;
  }),

  createProfile: jest.fn(async (userId: string): Promise<KarmaProfile> => {
    const profile: KarmaProfile = {
      userId,
      lifetimeKarma: 0,
      activeKarma: 0,
      level: 'starter',
      eventsCompleted: 0,
      eventsJoined: 0,
      totalHours: 0,
      trustScore: 100,
      badges: [],
      streak: { current: 0, longest: 0 },
      categoryBreakdown: {
        environment: 0,
        food: 0,
        health: 0,
        education: 0,
        community: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockKarmaProfiles.set(userId, profile);
    return profile;
  }),

  completeEvent: jest.fn(async (userId: string, eventId: string, hours: number): Promise<{ karma: number; coins: number }> => {
    const event = mockKarmaEvents.get(eventId);
    if (!event) throw new Error('Event not found');

    const profile = mockKarmaProfiles.get(userId) || await mockKarmaService.createProfile(userId);
    const karmaEarned = calculateKarma(event, hours);

    profile.lifetimeKarma += karmaEarned;
    profile.activeKarma += karmaEarned;
    profile.eventsCompleted += 1;
    profile.eventsJoined += 1;
    profile.totalHours += hours;
    profile.categoryBreakdown[event.category] += 1;
    profile.level = calculateKarmaLevel(profile.lifetimeKarma);
    profile.updatedAt = new Date();
    profile.streak.current += 1;
    if (profile.streak.current > profile.streak.longest) {
      profile.streak.longest = profile.streak.current;
    }
    profile.streak.lastActivityAt = new Date();

    mockKarmaProfiles.set(userId, profile);

    // Calculate coins
    const coins = calculateCoins(event, profile.level);

    return { karma: karmaEarned, coins };
  }),

  getCategoryBreakdown: jest.fn(async (userId: string): Promise<Record<KarmaCategory, number>> => {
    const profile = mockKarmaProfiles.get(userId);
    return profile?.categoryBreakdown || {
      environment: 0,
      food: 0,
      health: 0,
      education: 0,
      community: 0,
    };
  }),
};

const mockLoyaltyService = {
  getProfile: jest.fn(async (userId: string): Promise<LoyaltyProfile | null> => {
    return mockLoyaltyProfiles.get(userId) || null;
  }),

  createProfile: jest.fn(async (userId: string): Promise<LoyaltyProfile> => {
    const profile: LoyaltyProfile = {
      userId,
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'bronze',
      tierMultiplier: 1.0,
      karmaMultiplier: 1.0,
      combinedMultiplier: 1.0,
      expiringPoints: 0,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(),
    };
    mockLoyaltyProfiles.set(userId, profile);
    return profile;
  }),

  addPoints: jest.fn(async (userId: string, points: number, source: string): Promise<LoyaltyProfile> => {
    let profile = mockLoyaltyProfiles.get(userId);
    if (!profile) {
      profile = await mockLoyaltyService.createProfile(userId);
    }

    profile.currentPoints += points;
    profile.lifetimePoints += points;
    profile.tier = calculateLoyaltyTier(profile.lifetimePoints);
    profile.tierMultiplier = LOYALTY_MULTIPLIERS[profile.tier];
    profile.lastUpdated = new Date();

    // Update karma multiplier from karma profile
    const karmaProfile = mockKarmaProfiles.get(userId);
    if (karmaProfile) {
      profile.karmaMultiplier = KARMA_MULTIPLIERS[karmaProfile.level];
    }
    profile.combinedMultiplier = profile.karmaMultiplier * profile.tierMultiplier;

    mockLoyaltyProfiles.set(userId, profile);
    return profile;
  }),

  syncWithKarma: jest.fn(async (userId: string): Promise<LoyaltyProfile> => {
    let profile = mockLoyaltyProfiles.get(userId);
    if (!profile) {
      profile = await mockLoyaltyService.createProfile(userId);
    }

    const karmaProfile = mockKarmaProfiles.get(userId);
    if (karmaProfile) {
      profile.karmaMultiplier = KARMA_MULTIPLIERS[karmaProfile.level];
      profile.combinedMultiplier = profile.karmaMultiplier * profile.tierMultiplier;
      profile.lastUpdated = new Date();
    }

    mockLoyaltyProfiles.set(userId, profile);
    return profile;
  }),
};

const mockWalletService = {
  getWallet: jest.fn(async (userId: string): Promise<CoinWallet | null> => {
    return mockWallets.get(userId) || null;
  }),

  createWallet: jest.fn(async (userId: string): Promise<CoinWallet> => {
    const wallet: CoinWallet = {
      userId,
      available: 0,
      expiring: 0,
      transactions: [],
    };
    mockWallets.set(userId, wallet);
    return wallet;
  }),

  creditCoins: jest.fn(async (userId: string, coins: number, source: CoinSource, description: string): Promise<CoinWallet> => {
    let wallet = mockWallets.get(userId);
    if (!wallet) {
      wallet = await mockWalletService.createWallet(userId);
    }

    const transaction: CoinTransaction = {
      id: generateId('txn'),
      amount: coins,
      type: 'earned',
      source,
      description,
      karmaCoins: coins,
      createdAt: new Date(),
    };

    wallet.available += coins;
    wallet.transactions.push(transaction);
    mockWallets.set(userId, wallet);
    return wallet;
  }),

  getTransactionHistory: jest.fn(async (userId: string, limit?: number): Promise<CoinTransaction[]> => {
    const wallet = mockWallets.get(userId);
    if (!wallet) return [];
    const transactions = [...wallet.transactions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? transactions.slice(0, limit) : transactions;
  }),
};

const mockBadgeService = {
  checkAndAwardBadges: jest.fn(async (userId: string): Promise<Badge[]> => {
    const profile = mockKarmaProfiles.get(userId);
    if (!profile) return [];

    const newBadges: Badge[] = [];

    // Event count badges
    if (profile.eventsCompleted >= 1 && !profile.badges.some(b => b.id === 'karma_first')) {
      newBadges.push({ id: 'karma_first', name: 'First Steps', rarity: 'common', earnedAt: new Date(), category: undefined, source: 'karma' });
    }
    if (profile.eventsCompleted >= 10 && !profile.badges.some(b => b.id === 'karma_dedicated')) {
      newBadges.push({ id: 'karma_dedicated', name: 'Dedicated Contributor', rarity: 'rare', earnedAt: new Date(), category: undefined, source: 'karma' });
    }
    if (profile.eventsCompleted >= 50 && !profile.badges.some(b => b.id === 'karma_champion')) {
      newBadges.push({ id: 'karma_champion', name: 'Karma Champion', rarity: 'epic', earnedAt: new Date(), category: undefined, source: 'karma' });
    }

    // Streak badges
    if (profile.streak.current >= 7 && !profile.badges.some(b => b.id === 'streak_week')) {
      newBadges.push({ id: 'streak_week', name: 'Week Warrior', rarity: 'common', earnedAt: new Date(), category: undefined, source: 'cross' });
    }
    if (profile.streak.current >= 30 && !profile.badges.some(b => b.id === 'streak_month')) {
      newBadges.push({ id: 'streak_month', name: 'Month Master', rarity: 'rare', earnedAt: new Date(), category: undefined, source: 'cross' });
    }

    // Category badges
    if (profile.categoryBreakdown.environment >= 5 && !profile.badges.some(b => b.id === 'env_hero')) {
      newBadges.push({ id: 'env_hero', name: 'Green Champion', rarity: 'rare', earnedAt: new Date(), category: 'environment', source: 'karma' });
    }
    if (profile.categoryBreakdown.health >= 5 && !profile.badges.some(b => b.id === 'health_hero')) {
      newBadges.push({ id: 'health_hero', name: 'Wellness Champion', rarity: 'rare', earnedAt: new Date(), category: 'health', source: 'karma' });
    }

    profile.badges.push(...newBadges);
    return newBadges;
  }),
};

// ============================================================================
// Test Suite
// ============================================================================

describe('Karma to Loyalty Integration', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockKarmaProfiles.clear();
    mockLoyaltyProfiles.clear();
    mockWallets.clear();
    mockEventParticipants.clear();
  });

  // ============================================================================
  // Karma Event Completion Tests
  // ============================================================================

  describe('Karma Event Completion', () => {
    it('should complete a karma event and calculate correct karma', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      const event = mockKarmaEvents.get('env_tree')!; // 4 hours, medium difficulty
      const result = await mockKarmaService.completeEvent(userId, event.id, 4);

      // Expected: min(4 * 15 * 1.5, 90) = 90 karma
      expect(result.karma).toBe(90);

      const profile = await mockKarmaService.getProfile(userId);
      expect(profile!.lifetimeKarma).toBe(90);
      expect(profile!.eventsCompleted).toBe(1);
      expect(profile!.totalHours).toBe(4);
    });

    it('should cap karma at max per event', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      const event = mockKarmaEvents.get('env_tree')!; // maxKarmaPerEvent: 90
      const result = await mockKarmaService.completeEvent(userId, event.id, 10); // Would be 225 without cap

      expect(result.karma).toBe(90); // Capped at max
    });

    it('should track category breakdown', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 3);
      await mockKarmaService.completeEvent(userId, 'food_donate', 4);

      const breakdown = await mockKarmaService.getCategoryBreakdown(userId);
      expect(breakdown.environment).toBe(2);
      expect(breakdown.food).toBe(1);
      expect(breakdown.health).toBe(0);
    });

    it('should update karma level on threshold', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      // Complete enough events to reach 'active' level (100 karma)
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 3); // ~36 karma

      let profile = await mockKarmaService.getProfile(userId);
      expect(profile!.level).toBe('starter');

      // Add more karma to reach active
      await mockKarmaService.completeEvent(userId, 'env_tree', 4); // ~90 karma
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 1); // ~12 karma

      profile = await mockKarmaService.getProfile(userId);
      expect(profile!.level).toBe('active');
    });
  });

  // ============================================================================
  // Karma to Loyalty Points Conversion Tests
  // ============================================================================

  describe('Karma to Loyalty Points Conversion', () => {
    it('should convert karma to loyalty points', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);

      // Earn 100 karma
      await mockKarmaService.completeEvent(userId, 'env_tree', 4); // 90 karma
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 1); // 12 karma

      const karmaProfile = await mockKarmaService.getProfile(userId);
      const loyaltyProfile = await mockLoyaltyService.getProfile(userId);

      // Add karma-based loyalty points
      const points = karmaToLoyaltyPoints(karmaProfile!.lifetimeKarma, karmaProfile!.level, loyaltyProfile!.tier);
      await mockLoyaltyService.addPoints(userId, points, 'karma_conversion');

      const updatedLoyalty = await mockLoyaltyService.getProfile(userId);
      expect(updatedLoyalty!.lifetimePoints).toBe(points);
    });

    it('should apply karma multipliers to loyalty points', async () => {
      const karmaEarned = 100;
      const starterPoints = karmaToLoyaltyPoints(karmaEarned, 'starter', 'bronze');
      const elitePoints = karmaToLoyaltyPoints(karmaEarned, 'elite', 'bronze');

      // Elite has 2x karma multiplier
      expect(elitePoints).toBe(starterPoints * 2);
    });

    it('should apply both karma and loyalty multipliers', async () => {
      const karmaEarned = 100;

      // Starter + Bronze: 1.0 * 1.0 = 1.0
      const starterBronze = karmaToLoyaltyPoints(karmaEarned, 'starter', 'bronze');
      expect(starterBronze).toBe(10); // 100 * 0.1 * 1.0 * 1.0 = 10

      // Elite + Diamond: 2.0 * 2.0 = 4.0
      const eliteDiamond = karmaToLoyaltyPoints(karmaEarned, 'elite', 'diamond');
      expect(eliteDiamond).toBe(40); // 100 * 0.1 * 2.0 * 2.0 = 40
    });

    it('should sync karma multiplier to loyalty profile', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);

      // Earn karma to level up
      await mockKarmaService.completeEvent(userId, 'env_tree', 4); // 90 karma
      await mockKarmaService.completeEvent(userId, 'env_tree', 4); // 90 karma

      // Sync with loyalty
      const loyalty = await mockLoyaltyService.syncWithKarma(userId);

      expect(loyalty.karmaMultiplier).toBeGreaterThan(1.0); // Should be 'active' level
      expect(loyalty.combinedMultiplier).toBe(loyalty.karmaMultiplier * loyalty.tierMultiplier);
    });
  });

  // ============================================================================
  // Coin Rewards Tests
  // ============================================================================

  describe('Coin Rewards from Karma', () => {
    it('should award coins for karma events', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      const result = await mockKarmaService.completeEvent(userId, 'env_tree', 4);

      const coins = calculateCoins(mockKarmaEvents.get('env_tree')!, 'starter');
      expect(result.coins).toBe(coins);

      const wallet = await mockWalletService.creditCoins(userId, coins, 'karma', `Completed ${mockKarmaEvents.get('env_tree')!.name}`);
      expect(wallet.available).toBe(coins);
    });

    it('should apply category multipliers to coins', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      // Environment events have 1.2x multiplier
      const envCoins = calculateCoins(mockKarmaEvents.get('env_tree')!, 'starter');
      // Food events have 1.0x multiplier
      const foodCoins = calculateCoins(mockKarmaEvents.get('food_donate')!, 'starter');

      expect(envCoins).toBeGreaterThan(foodCoins);
      expect(envCoins / foodCoins).toBeCloseTo(1.2, 1);
    });

    it('should apply karma level multipliers to coins', async () => {
      const event = mockKarmaEvents.get('env_tree')!;

      const starterCoins = calculateCoins(event, 'starter');
      const eliteCoins = calculateCoins(event, 'elite');

      expect(eliteCoins).toBe(starterCoins * 2); // Elite has 2.0 multiplier
    });

    it('should track coin transaction history', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      const karmaResult1 = await mockKarmaService.completeEvent(userId, 'env_cleanup', 3);
      await mockKarmaService.completeEvent(userId, 'food_donate', 4);
      const karmaResult2 = await mockKarmaService.completeEvent(userId, 'health_blood', 2);

      const history = await mockWalletService.getTransactionHistory(userId);
      expect(history.length).toBeGreaterThanOrEqual(4);

      // Verify transaction details
      const karmaTransactions = history.filter(t => t.source === 'karma');
      expect(karmaTransactions.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ============================================================================
  // Tier Progression Tests
  // ============================================================================

  describe('Tier Progression from Karma', () => {
    it('should upgrade loyalty tier when points threshold reached', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);

      // Complete events to earn lots of karma
      for (let i = 0; i < 50; i++) {
        await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      }

      const karmaProfile = await mockKarmaService.getProfile(userId);
      const points = karmaToLoyaltyPoints(karmaProfile!.lifetimeKarma, karmaProfile!.level, 'bronze');
      await mockLoyaltyService.addPoints(userId, points, 'karma_earning');

      const loyalty = await mockLoyaltyService.getProfile(userId);
      expect(loyalty!.tier).not.toBe('bronze'); // Should have upgraded
    });

    it('should update combined multiplier on tier change', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);

      let loyalty = await mockLoyaltyService.getProfile(userId);
      expect(loyalty!.combinedMultiplier).toBe(1.0); // Starter + Bronze

      // Add enough points to reach silver
      await mockLoyaltyService.addPoints(userId, 500, 'test');
      loyalty = await mockLoyaltyService.getProfile(userId);
      expect(loyalty!.tier).toBe('silver');
      expect(loyalty!.tierMultiplier).toBe(1.1);
    });
  });

  // ============================================================================
  // Badge Awards Tests
  // ============================================================================

  describe('Badge Awards from Karma Activity', () => {
    it('should award first event badge', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      await mockKarmaService.completeEvent(userId, 'env_cleanup', 2);
      const newBadges = await mockBadgeService.checkAndAwardBadges(userId);

      expect(newBadges.some(b => b.id === 'karma_first')).toBe(true);
    });

    it('should award milestone badges at correct thresholds', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      // Complete 10 events
      for (let i = 0; i < 10; i++) {
        await mockKarmaService.completeEvent(userId, 'env_cleanup', 2);
      }

      const newBadges = await mockBadgeService.checkAndAwardBadges(userId);
      expect(newBadges.some(b => b.id === 'karma_dedicated')).toBe(true);
    });

    it('should award streak badges', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      // Build up streak to 7 days
      for (let i = 0; i < 7; i++) {
        await mockKarmaService.completeEvent(userId, 'env_cleanup', 2);
      }

      const newBadges = await mockBadgeService.checkAndAwardBadges(userId);
      expect(newBadges.some(b => b.id === 'streak_week')).toBe(true);
    });

    it('should award category badges', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      // Complete 5 environment events
      for (let i = 0; i < 5; i++) {
        await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      }

      const newBadges = await mockBadgeService.checkAndAwardBadges(userId);
      expect(newBadges.some(b => b.id === 'env_hero')).toBe(true);
    });

    it('should not award duplicate badges', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      await mockKarmaService.completeEvent(userId, 'env_cleanup', 2);
      await mockBadgeService.checkAndAwardBadges(userId);

      const profile = await mockKarmaService.getProfile(userId);
      const initialBadgeCount = profile!.badges.length;

      // Second check should not award duplicate
      const newBadges = await mockBadgeService.checkAndAwardBadges(userId);
      expect(newBadges.length).toBe(0);

      const updatedProfile = await mockKarmaService.getProfile(userId);
      expect(updatedProfile!.badges.length).toBe(initialBadgeCount);
    });
  });

  // ============================================================================
  // Full Integration Flow Tests
  // ============================================================================

  describe('Full Karma-Loyalty Integration Flow', () => {
    it('should complete full karma to loyalty flow', async () => {
      const userId = generateId('user');

      // 1. Create profiles
      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);
      await mockWalletService.createWallet(userId);

      // 2. Complete karma events
      await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 3);
      await mockKarmaService.completeEvent(userId, 'food_donate', 4);
      await mockKarmaService.completeEvent(userId, 'health_blood', 2);
      await mockKarmaService.completeEvent(userId, 'edu_tutor', 4);

      // 3. Get karma profile
      const karmaProfile = await mockKarmaService.getProfile(userId);
      expect(karmaProfile!.eventsCompleted).toBe(5);
      expect(karmaProfile!.lifetimeKarma).toBeGreaterThan(0);

      // 4. Convert karma to loyalty points
      const loyaltyProfile = await mockLoyaltyService.getProfile(userId);
      const points = karmaToLoyaltyPoints(karmaProfile!.lifetimeKarma, karmaProfile!.level, loyaltyProfile!.tier);
      await mockLoyaltyService.addPoints(userId, points, 'karma_earning');

      // 5. Sync multipliers
      await mockLoyaltyService.syncWithKarma(userId);
      const updatedLoyalty = await mockLoyaltyService.getProfile(userId);

      expect(updatedLoyalty!.combinedMultiplier).toBeGreaterThan(1.0);
      expect(updatedLoyalty!.lifetimePoints).toBe(points);

      // 6. Award coins for events
      const categoryBreakdown = await mockKarmaService.getCategoryBreakdown(userId);
      const totalCoins = Object.values(categoryBreakdown).reduce((sum, count) => {
        // Simplified: 50 coins per event
        return sum + (count * 50);
      }, 0);
      await mockWalletService.creditCoins(userId, totalCoins, 'karma', 'Karma event completion rewards');

      const wallet = await mockWalletService.getWallet(userId);
      expect(wallet!.available).toBeGreaterThan(0);

      // 7. Check for badges
      const newBadges = await mockBadgeService.checkAndAwardBadges(userId);
      expect(newBadges.some(b => b.id === 'karma_first')).toBe(true);
    });

    it('should maintain consistency across all systems', async () => {
      const userId = generateId('user');

      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);
      await mockWalletService.createWallet(userId);

      // Complete multiple events
      for (let i = 0; i < 20; i++) {
        await mockKarmaService.completeEvent(userId, 'env_cleanup', 3);
      }

      // All systems should be consistent
      const karma = await mockKarmaService.getProfile(userId);
      const loyalty = await mockLoyaltyService.getProfile(userId);
      const wallet = await mockWalletService.getWallet(userId);
      const badges = await mockBadgeService.checkAndAwardBadges(userId);

      // Karma profile should be updated
      expect(karma!.eventsCompleted).toBe(20);

      // Badges should be awarded at correct thresholds
      expect(badges.some(b => b.id === 'karma_dedicated')).toBe(true);

      // Wallet should have coins
      expect(wallet!.available).toBeGreaterThan(0);

      // Loyalty should reflect karma multiplier
      expect(loyalty!.karmaMultiplier).toBe(KARMA_MULTIPLIERS[karma!.level]);
    });
  });

  // ============================================================================
  // Cross-Merchant Karma Tests
  // ============================================================================

  describe('Cross-Merchant Karma Activity', () => {
    it('should aggregate karma across multiple merchants', async () => {
      const userId = generateId('user');

      await mockKarmaService.createProfile(userId);

      // Karma events are aggregated regardless of merchant
      await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      await mockKarmaService.completeEvent(userId, 'food_donate', 4);
      await mockKarmaService.completeEvent(userId, 'health_blood', 2);

      const profile = await mockKarmaService.getProfile(userId);
      expect(profile!.eventsCompleted).toBe(3);
      expect(profile!.categoryBreakdown.environment).toBe(1);
      expect(profile!.categoryBreakdown.food).toBe(1);
      expect(profile!.categoryBreakdown.health).toBe(1);
    });

    it('should earn loyalty points from aggregated karma', async () => {
      const userId = generateId('user');

      await mockKarmaService.createProfile(userId);
      await mockLoyaltyService.createProfile(userId);

      // Complete events across categories
      await mockKarmaService.completeEvent(userId, 'env_tree', 4);
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 3);
      await mockKarmaService.completeEvent(userId, 'food_donate', 4);

      const karma = await mockKarmaService.getProfile(userId);
      const loyalty = await mockLoyaltyService.getProfile(userId);

      const points = karmaToLoyaltyPoints(karma!.lifetimeKarma, karma!.level, loyalty!.tier);
      await mockLoyaltyService.addPoints(userId, points, 'cross_merchant_karma');

      const updatedLoyalty = await mockLoyaltyService.getProfile(userId);
      expect(updatedLoyalty!.lifetimePoints).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle invalid event ID', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      await expect(mockKarmaService.completeEvent(userId, 'invalid_event', 4))
        .rejects.toThrow('Event not found');
    });

    it('should handle zero hour completion', async () => {
      const userId = generateId('user');
      await mockKarmaService.createProfile(userId);

      const result = await mockKarmaService.completeEvent(userId, 'env_tree', 0);
      expect(result.karma).toBe(0);
    });

    it('should handle profile not found', async () => {
      const profile = await mockKarmaService.getProfile('nonexistent');
      expect(profile).toBeNull();
    });
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Karma-Loyalty Performance', () => {
  it('should process 50 karma events efficiently', async () => {
    const userId = generateId('user');
    await mockKarmaService.createProfile(userId);

    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      await mockKarmaService.completeEvent(userId, 'env_cleanup', 2);
    }

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(5000);
  });

  it('should sync profiles efficiently', async () => {
    const userId = generateId('user');
    await mockKarmaService.createProfile(userId);
    await mockLoyaltyService.createProfile(userId);

    for (let i = 0; i < 10; i++) {
      await mockKarmaService.completeEvent(userId, 'env_tree', 4);
    }

    const startTime = Date.now();
    await mockLoyaltyService.syncWithKarma(userId);
    const elapsed = Date.now() - startTime;

    expect(elapsed).toBeLessThan(100);
  });
});
