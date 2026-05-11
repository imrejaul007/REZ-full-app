/**
 * Fix and Seed Challenges Script
 * Cleans up invalid challenges and seeds proper ones
 */

import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

// Challenge Schema (inline to avoid import issues)
const ChallengeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'special'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    requirements: {
      action: {
        type: String,
        enum: [
          'visit_stores',
          'upload_bills',
          'refer_friends',
          'spend_amount',
          'order_count',
          'review_count',
          'login_streak',
          'share_deals',
          'explore_categories',
          'add_favorites',
        ],
        required: true,
      },
      target: {
        type: Number,
        required: true,
        min: 1,
      },
      stores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }],
      categories: [String],
      minAmount: Number,
    },
    rewards: {
      coins: {
        type: Number,
        required: true,
        min: 0,
      },
      badges: [String],
      exclusiveDeals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
      multiplier: {
        type: Number,
        min: 1.1,
        max: 5,
      },
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    maxParticipants: Number,
  },
  { timestamps: true },
);

const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema);

// Challenge data to seed
const challengesData = [
  // DAILY CHALLENGES
  {
    type: 'daily',
    title: 'Daily Explorer',
    description: 'Visit 3 different stores today',
    icon: '🗺️',
    requirements: { action: 'visit_stores', target: 3 },
    rewards: { coins: 50 },
    difficulty: 'easy',
  },
  {
    type: 'daily',
    title: 'Quick Order',
    description: 'Place 1 order today',
    icon: '⚡',
    requirements: { action: 'order_count', target: 1 },
    rewards: { coins: 100 },
    difficulty: 'easy',
  },
  {
    type: 'daily',
    title: 'Share the Love',
    description: 'Share 2 deals with friends',
    icon: '💝',
    requirements: { action: 'share_deals', target: 2 },
    rewards: { coins: 75 },
    difficulty: 'easy',
  },
  {
    type: 'daily',
    title: 'Review Writer',
    description: 'Write 1 review today',
    icon: '✍️',
    requirements: { action: 'review_count', target: 1 },
    rewards: { coins: 80 },
    difficulty: 'easy',
  },
  {
    type: 'daily',
    title: 'Bill Upload Master',
    description: 'Upload 3 bills today',
    icon: '📝',
    requirements: { action: 'upload_bills', target: 3 },
    rewards: { coins: 120 },
    difficulty: 'medium',
  },
  // FITNESS-SPECIFIC DAILY CHALLENGES
  {
    type: 'daily',
    title: 'Gym Check-In',
    description: 'Visit a partner gym today',
    icon: '🏋️',
    requirements: { action: 'visit_stores', target: 1, categories: ['gym', 'fitness'] },
    rewards: { coins: 100 },
    difficulty: 'easy',
  },

  // WEEKLY CHALLENGES
  {
    type: 'weekly',
    title: 'Weekly Shopping Spree',
    description: 'Place 5 orders this week',
    icon: '🛒',
    requirements: { action: 'order_count', target: 5 },
    rewards: { coins: 500, multiplier: 1.15 },
    difficulty: 'medium',
  },
  {
    type: 'weekly',
    title: 'Store Hopper',
    description: 'Order from 7 different stores this week',
    icon: '🏪',
    requirements: { action: 'visit_stores', target: 7 },
    rewards: { coins: 600 },
    difficulty: 'medium',
  },
  {
    type: 'weekly',
    title: 'Review Marathon',
    description: 'Write 10 reviews this week',
    icon: '⭐',
    requirements: { action: 'review_count', target: 10 },
    rewards: { coins: 700 },
    difficulty: 'hard',
  },
  // FITNESS-SPECIFIC WEEKLY CHALLENGES
  {
    type: 'weekly',
    title: 'Gym Warrior',
    description: 'Visit partner gyms 3 times this week',
    icon: '💪',
    requirements: { action: 'visit_stores', target: 3, categories: ['gym', 'fitness'] },
    rewards: { coins: 500 },
    difficulty: 'medium',
  },
  {
    type: 'weekly',
    title: 'Fitness Explorer',
    description: 'Try 2 different fitness studios this week',
    icon: '🧘',
    requirements: { action: 'visit_stores', target: 2, categories: ['yoga', 'studio', 'fitness'] },
    rewards: { coins: 400 },
    difficulty: 'medium',
  },

  // MONTHLY CHALLENGES
  {
    type: 'monthly',
    title: 'Monthly Marathon',
    description: 'Place 20 orders this month',
    icon: '🏃',
    requirements: { action: 'order_count', target: 20 },
    rewards: { coins: 2000, multiplier: 1.3 },
    difficulty: 'hard',
  },
  {
    type: 'monthly',
    title: 'Ultimate Explorer',
    description: 'Order from 15 different stores this month',
    icon: '🌍',
    requirements: { action: 'visit_stores', target: 15 },
    rewards: { coins: 1500 },
    difficulty: 'medium',
  },
  // FITNESS-SPECIFIC MONTHLY CHALLENGES
  {
    type: 'monthly',
    title: '30-Day Fitness Challenge',
    description: 'Visit fitness stores 15 times this month',
    icon: '🏆',
    requirements: { action: 'visit_stores', target: 15, categories: ['gym', 'yoga', 'fitness'] },
    rewards: { coins: 2000, multiplier: 1.5 },
    difficulty: 'hard',
  },

  // SPECIAL CHALLENGES
  {
    type: 'special',
    title: 'Weekend Warrior',
    description: 'Place 3 orders this weekend',
    icon: '🎉',
    requirements: { action: 'order_count', target: 3 },
    rewards: { coins: 400, multiplier: 1.2 },
    difficulty: 'medium',
  },
  {
    type: 'special',
    title: 'New Year Fitness',
    description: 'Start your fitness journey - visit 5 gyms/studios',
    icon: '🎊',
    requirements: { action: 'visit_stores', target: 5, categories: ['gym', 'yoga', 'fitness'] },
    rewards: { coins: 1000 },
    difficulty: 'medium',
  },
];

const getDateRange = (type: string): { startDate: Date; endDate: Date } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (type) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'special':
      endDate.setDate(endDate.getDate() + 14);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

async function fixAndSeedChallenges() {
  logger.info('🚀 Starting Challenge Fix & Seed Script...\n');

  try {
    logger.info('📡 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    // Step 1: Check current state
    const beforeCount = await Challenge.countDocuments();
    logger.info(`📊 Current challenges in DB: ${beforeCount}`);

    // Step 2: Delete all invalid/old challenges
    logger.info('\n🗑️  Deleting all existing challenges...');
    await Challenge.deleteMany({});
    logger.info('✅ Cleared all challenges');

    // Step 3: Seed fresh challenges
    logger.info('\n🌱 Seeding new challenges...');
    let createdCount = 0;

    for (const challengeData of challengesData) {
      const { startDate, endDate } = getDateRange(challengeData.type);

      const challenge = await Challenge.create({
        ...challengeData,
        startDate,
        endDate,
        active: true,
        featured: createdCount < 3, // First 3 are featured
        participantCount: 0,
        completionCount: 0,
      });

      createdCount++;
      logger.info(`   ✅ Created: ${challenge.title} (${challenge.type})`);
    }

    // Step 4: Verify final state
    const afterCount = await Challenge.countDocuments();
    const activeCount = await Challenge.countDocuments({
      active: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    logger.info('\n' + '═'.repeat(50));
    logger.info('📊 FINAL STATE');
    logger.info('═'.repeat(50));
    logger.info(`   Total challenges: ${afterCount}`);
    logger.info(`   Active challenges: ${activeCount}`);
    logger.info(`   Created: ${createdCount}`);

    // Show breakdown by type
    const dailyCount = await Challenge.countDocuments({ type: 'daily', active: true });
    const weeklyCount = await Challenge.countDocuments({ type: 'weekly', active: true });
    const monthlyCount = await Challenge.countDocuments({ type: 'monthly', active: true });
    const specialCount = await Challenge.countDocuments({ type: 'special', active: true });

    logger.info('\n   By Type:');
    logger.info(`   - Daily: ${dailyCount}`);
    logger.info(`   - Weekly: ${weeklyCount}`);
    logger.info(`   - Monthly: ${monthlyCount}`);
    logger.info(`   - Special: ${specialCount}`);
    logger.info('═'.repeat(50));

    logger.info('\n🎉 Challenge seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Error:', error);
    throw error;
  } finally {
    await disconnectDb();
    logger.info('\n📡 Disconnected from MongoDB');
  }
}

// Run the script
fixAndSeedChallenges()
  .then(() => {
    logger.info('\n✅ Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
