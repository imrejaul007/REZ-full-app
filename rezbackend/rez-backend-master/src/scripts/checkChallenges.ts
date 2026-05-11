import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'test';

async function checkChallenges() {
  try {
    logger.info('🔍 Checking challenges in database...');
    logger.info('📊 Database:', DB_NAME);
    logger.info('🔗 URI:', MONGODB_URI.substring(0, 50) + '...');

    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      logger.error('❌ Database connection failed');
      process.exit(1);
    }

    // List all collections
    const collections = await db.listCollections().toArray();
    logger.info('📂 Collections in database:', collections.map((c) => c.name).join(', '));
    logger.info('');

    // Check challenges collection
    const challenges = await db.collection('challenges').find({}).toArray();
    logger.info(`🎯 Total challenges in database: ${challenges.length}`);

    if (challenges.length > 0) {
      logger.info('\n📋 Challenges found:\n');
      challenges.forEach((c: any, i: number) => {
        logger.info(`  ${i + 1}. ${c.title}`);
        logger.info(`     Type: ${c.type}`);
        logger.info(`     Active: ${c.active}`);
        logger.info(`     Difficulty: ${c.difficulty}`);
        logger.info(`     Rewards: ${c.rewards?.coins || 0} coins`);
        logger.info(`     Start: ${c.startDate}`);
        logger.info(`     End: ${c.endDate}`);
        logger.info('');
      });
    } else {
      logger.info('⚠️  No challenges found in database!');
    }

    // Check active challenges
    const activeChallenges = await db.collection('challenges').find({ active: true }).toArray();
    logger.info(`✅ Active challenges: ${activeChallenges.length}`);

    await mongoose.disconnect();
    logger.info('\n✅ Done!');
  } catch (error) {
    logger.error('❌ Error:', error);
  }
  process.exit(0);
}

checkChallenges();
