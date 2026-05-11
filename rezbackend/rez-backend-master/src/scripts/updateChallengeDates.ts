import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Challenge from '../models/Challenge';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'test';

/**
 * Update all challenge dates to be currently active
 */
async function updateChallengeDates() {
  try {
    logger.info('🔄 Updating challenge dates...');
    logger.info('📊 Database:', DB_NAME);

    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    logger.info('✅ Connected to MongoDB\n');

    const _now = new Date();
    const challenges = await Challenge.find({});

    logger.info(`📋 Found ${challenges.length} challenges\n`);

    let updated = 0;

    for (const challenge of challenges) {
      let startDate = new Date();
      let endDate = new Date();

      // Set dates based on challenge type
      switch (challenge.type) {
        case 'daily':
          // Start today at midnight, end tomorrow at midnight
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(startDate.getDate() + 1);
          endDate.setHours(0, 0, 0, 0);
          break;

        case 'weekly':
          // Start this Monday at midnight, end next Monday
          const dayOfWeek = startDate.getDay();
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          startDate.setDate(startDate.getDate() + daysToMonday);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          break;

        case 'monthly':
          // Start on 1st of this month, end on 1st of next month
          startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
          endDate.setHours(0, 0, 0, 0);
          break;

        case 'special':
          // Start today, end in 7 days
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 7);
          endDate.setHours(23, 59, 59, 999);
          break;

        default:
          // Default: start today, end in 1 day
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
          endDate.setHours(23, 59, 59, 999);
      }

      // Update the challenge
      challenge.startDate = startDate;
      challenge.endDate = endDate;
      challenge.active = true;

      await challenge.save();

      logger.info(`✅ Updated: ${challenge.title}`);
      logger.info(`   Type: ${challenge.type}`);
      logger.info(`   Start: ${startDate.toLocaleString()}`);
      logger.info(`   End: ${endDate.toLocaleString()}`);
      logger.info('');

      updated++;
    }

    logger.info(`\n✅ Successfully updated ${updated} challenges!`);
    logger.info('\n📊 Summary:');

    const daily = challenges.filter((c) => c.type === 'daily').length;
    const weekly = challenges.filter((c) => c.type === 'weekly').length;
    const monthly = challenges.filter((c) => c.type === 'monthly').length;
    const special = challenges.filter((c) => c.type === 'special').length;

    logger.info(`   • Daily: ${daily}`);
    logger.info(`   • Weekly: ${weekly}`);
    logger.info(`   • Monthly: ${monthly}`);
    logger.info(`   • Special: ${special}`);
    logger.info(`   • Total: ${challenges.length}`);

    await mongoose.disconnect();
    logger.info('\n✅ Done!');
  } catch (error) {
    logger.error('❌ Error:', error);
  }
  process.exit(0);
}

updateChallengeDates();
