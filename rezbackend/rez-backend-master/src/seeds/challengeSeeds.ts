/**
 * Challenge Seeds - Update/Regenerate Challenge Dates
 * Run with: npx ts-node src/seeds/challengeSeeds.ts
 *
 * This script updates all existing challenges with fresh start/end dates
 * and can also create new challenges from templates.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Challenge from '../models/Challenge';
import CHALLENGE_TEMPLATES from '../config/challengeTemplates';
import { logger } from '../config/logger';

dotenv.config();

// Get date helpers
const getDateRange = (type: string): { startDate: Date; endDate: Date } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today

  const startDate = new Date(now);
  const endDate = new Date(now);

  switch (type) {
    case 'daily':
      // Daily: starts today, ends tomorrow at 11:59 PM
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      // Weekly: starts today, ends in 7 days
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      // Monthly: starts today, ends in 30 days
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'special':
      // Special: starts today, ends in 14 days
      endDate.setDate(endDate.getDate() + 14);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      endDate.setDate(endDate.getDate() + 7);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

async function updateExistingChallenges() {
  logger.info('\n📅 Updating existing challenge dates...');

  const challenges = await Challenge.find({});
  let updatedCount = 0;

  for (const challenge of challenges) {
    const { startDate, endDate } = getDateRange(challenge.type);

    challenge.startDate = startDate;
    challenge.endDate = endDate;
    challenge.active = true;

    await challenge.save();
    updatedCount++;
    logger.info(`   ✅ Updated: ${challenge.title} (${challenge.type}) -> ends ${endDate.toDateString()}`);
  }

  logger.info(`   📊 Total updated: ${updatedCount} challenges\n`);
  return updatedCount;
}

async function createChallengesFromTemplates() {
  logger.info('\n🎯 Creating challenges from templates...');

  const now = new Date();
  let createdCount = 0;

  // Group templates by type
  const dailyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'daily');
  const weeklyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'weekly');
  const monthlyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'monthly');
  const specialTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'special');

  // Create 5 daily challenges
  logger.info('   📆 Creating daily challenges...');
  for (let i = 0; i < Math.min(5, dailyTemplates.length); i++) {
    const template = dailyTemplates[i];
    const { startDate, endDate } = getDateRange('daily');

    const existing = await Challenge.findOne({ title: template.title, type: 'daily' });
    if (!existing) {
      await Challenge.create({
        ...template,
        startDate,
        endDate,
        active: true,
        featured: i === 0,
        participantCount: 0,
        completionCount: 0,
      });
      createdCount++;
      logger.info(`      ✅ Created: ${template.title}`);
    }
  }

  // Create 3 weekly challenges
  logger.info('   📅 Creating weekly challenges...');
  for (let i = 0; i < Math.min(3, weeklyTemplates.length); i++) {
    const template = weeklyTemplates[i];
    const { startDate, endDate } = getDateRange('weekly');

    const existing = await Challenge.findOne({ title: template.title, type: 'weekly' });
    if (!existing) {
      await Challenge.create({
        ...template,
        startDate,
        endDate,
        active: true,
        featured: i === 0,
        participantCount: 0,
        completionCount: 0,
      });
      createdCount++;
      logger.info(`      ✅ Created: ${template.title}`);
    }
  }

  // Create 2 monthly challenges
  logger.info('   📆 Creating monthly challenges...');
  for (let i = 0; i < Math.min(2, monthlyTemplates.length); i++) {
    const template = monthlyTemplates[i];
    const { startDate, endDate } = getDateRange('monthly');

    const existing = await Challenge.findOne({ title: template.title, type: 'monthly' });
    if (!existing) {
      await Challenge.create({
        ...template,
        startDate,
        endDate,
        active: true,
        featured: i === 0,
        participantCount: 0,
        completionCount: 0,
      });
      createdCount++;
      logger.info(`      ✅ Created: ${template.title}`);
    }
  }

  // Create 2 special challenges
  logger.info('   🌟 Creating special challenges...');
  for (let i = 0; i < Math.min(2, specialTemplates.length); i++) {
    const template = specialTemplates[i];
    const { startDate, endDate } = getDateRange('special');

    const existing = await Challenge.findOne({ title: template.title, type: 'special' });
    if (!existing) {
      await Challenge.create({
        ...template,
        startDate,
        endDate,
        active: true,
        featured: i === 0,
        participantCount: 0,
        completionCount: 0,
      });
      createdCount++;
      logger.info(`      ✅ Created: ${template.title}`);
    }
  }

  logger.info(`   📊 Total created: ${createdCount} new challenges\n`);
  return createdCount;
}

async function runChallengeSeeds() {
  logger.info('🚀 Starting Challenge Seeds...\n');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      logger.error('MONGODB_URI environment variable is required');
      process.exit(1);
    }

    logger.info('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB\n');

    // Check current state
    const totalChallenges = await Challenge.countDocuments();
    const now = new Date();
    const activeChallenges = await Challenge.countDocuments({
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    logger.info('📊 Current State:');
    logger.info(`   Total challenges: ${totalChallenges}`);
    logger.info(`   Active challenges: ${activeChallenges}`);

    // Update existing challenges with fresh dates
    const updatedCount = await updateExistingChallenges();

    // Create new challenges from templates if needed
    const createdCount = await createChallengesFromTemplates();

    // Verify final state
    const finalTotal = await Challenge.countDocuments();
    const finalActive = await Challenge.countDocuments({
      active: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    logger.info('━'.repeat(50));
    logger.info('📊 FINAL STATE');
    logger.info('━'.repeat(50));
    logger.info(`   Total challenges: ${finalTotal}`);
    logger.info(`   Active challenges: ${finalActive}`);
    logger.info(`   Updated: ${updatedCount}`);
    logger.info(`   Created: ${createdCount}`);
    logger.info('━'.repeat(50));

    logger.info('\n🎉 Challenge seeds completed successfully!');
  } catch (error) {
    logger.error('❌ Error running challenge seeds:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('\n📡 Disconnected from MongoDB');
  }
}

// Run seeds if executed directly
if (require.main === module) {
  runChallengeSeeds()
    .then(() => {
      logger.info('\n✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { runChallengeSeeds, updateExistingChallenges, createChallengesFromTemplates };
