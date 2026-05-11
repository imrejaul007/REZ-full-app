/**
 * Migration script: Social Impact Module — Production-Ready Fields
 *
 * This script:
 * 1. Adds totalBudgetFunded + currentBalance to existing Sponsors
 * 2. Adds verificationConfig + sponsorBudget to existing social impact Programs
 * 3. Migrates any CoinTransactions with source='achievement' + metadata.eventId to 'social_impact_reward'
 * 4. Creates initial SponsorAllocation fund entries for sponsors with budgets
 *
 * Run: npx ts-node src/scripts/migrateSocialImpactTransactions.ts
 * Or: MONGODB_URI=... DB_NAME=... npx ts-node src/scripts/migrateSocialImpactTransactions.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function migrate() {
  logger.info('🔄 Starting Social Impact migration...');
  logger.info('   Connecting to MongoDB...');

  await connectScriptDb();
  const db = mongoose.connection.db!;

  // 1. Add budget fields to Sponsors
  logger.info('\n📦 Step 1: Adding budget fields to Sponsors...');
  const sponsorResult = await db.collection('sponsors').updateMany(
    { totalBudgetFunded: { $exists: false } },
    {
      $set: {
        totalBudgetFunded: 0,
        currentBalance: 0,
      },
    },
  );
  logger.info(`   Updated ${sponsorResult.modifiedCount} sponsors`);

  // 2. Add verificationConfig + sponsorBudget to social impact Programs
  logger.info('\n📦 Step 2: Adding verificationConfig + sponsorBudget to Programs...');
  const programResult = await db.collection('programs').updateMany(
    { type: 'social_impact', verificationConfig: { $exists: false } },
    {
      $set: {
        verificationConfig: {
          methods: ['manual'],
          geoFenceRadiusMeters: 500,
          requireCheckInBeforeComplete: true,
        },
        sponsorBudget: {
          allocated: 0,
          disbursed: 0,
        },
      },
    },
  );
  logger.info(`   Updated ${programResult.modifiedCount} programs`);

  // 3. Migrate CoinTransactions with source='achievement' + metadata.eventId
  logger.info('\n📦 Step 3: Migrating achievement+eventId CoinTransactions...');
  const txResult = await db.collection('cointransactions').updateMany(
    {
      source: 'achievement',
      'metadata.eventId': { $exists: true },
    },
    {
      $set: { source: 'social_impact_reward' },
    },
  );
  logger.info(`   Migrated ${txResult.modifiedCount} transactions`);

  // 4. Add rewardIdempotencyKey field to enrollments (set null for existing)
  logger.info('\n📦 Step 4: Adding rewardIdempotencyKey to enrollments...');
  const enrollmentResult = await db.collection('socialimpactenrollments').updateMany(
    { rewardIdempotencyKey: { $exists: false } },
    {
      $set: {
        rewardIdempotencyKey: null,
        verification: null,
      },
    },
  );
  logger.info(`   Updated ${enrollmentResult.modifiedCount} enrollments`);

  // 5. Summary
  logger.info('\n✅ Migration completed successfully!');
  logger.info('   Summary:');
  logger.info(`   - Sponsors updated: ${sponsorResult.modifiedCount}`);
  logger.info(`   - Programs updated: ${programResult.modifiedCount}`);
  logger.info(`   - CoinTransactions migrated: ${txResult.modifiedCount}`);
  logger.info(`   - Enrollments updated: ${enrollmentResult.modifiedCount}`);

  await disconnectDb();
  process.exit(0);
}

migrate().catch((error) => {
  logger.error('❌ Migration failed:', error);
  process.exit(1);
});
