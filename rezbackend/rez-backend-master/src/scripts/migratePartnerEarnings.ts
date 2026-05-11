/**
 * Migration script: Backfill partner earnings metadata on CoinTransactions
 *
 * This script tags existing CoinTransactions with metadata.partnerEarning = true
 * and metadata.partnerEarningType based on description patterns and existing metadata.
 *
 * Categories:
 * - 'milestone': Partner milestone rewards and level-up bonuses
 * - 'task': Partner task rewards
 * - 'cashback': Partner jackpot cashback and transaction bonuses
 *
 * Run: npx ts-node src/scripts/migratePartnerEarnings.ts
 * Or:  MONGODB_URI=... DB_NAME=... npx ts-node src/scripts/migratePartnerEarnings.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function migrate() {
  logger.info('🔄 Starting Partner Earnings metadata backfill...');
  logger.info('   Connecting to MongoDB...');

  await connectScriptDb();
  const db = mongoose.connection.db!;
  const collection = db.collection('cointransactions');

  let totalUpdated = 0;

  // 1. Tag level-up bonuses (description pattern: "Partner level up bonus")
  logger.info('\n📦 Step 1: Tagging level-up bonuses as milestone...');
  const levelUpResult = await collection.updateMany(
    {
      description: { $regex: /^Partner level up bonus/i },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'milestone',
      },
    },
  );
  logger.info(`   Updated ${levelUpResult.modifiedCount} level-up bonus transactions`);
  totalUpdated += levelUpResult.modifiedCount;

  // 2. Tag milestone rewards (description pattern: "Partner milestone reward")
  logger.info('\n📦 Step 2: Tagging milestone rewards...');
  const milestoneResult = await collection.updateMany(
    {
      description: { $regex: /^Partner milestone reward/i },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'milestone',
      },
    },
  );
  logger.info(`   Updated ${milestoneResult.modifiedCount} milestone reward transactions`);
  totalUpdated += milestoneResult.modifiedCount;

  // 3. Tag transactions with milestoneId metadata (catch any missed)
  logger.info('\n📦 Step 3: Tagging by milestoneId metadata...');
  const milestoneIdResult = await collection.updateMany(
    {
      'metadata.milestoneId': { $exists: true },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'milestone',
      },
    },
  );
  logger.info(`   Updated ${milestoneIdResult.modifiedCount} transactions with milestoneId`);
  totalUpdated += milestoneIdResult.modifiedCount;

  // 4. Tag task rewards (description pattern: "Partner task reward")
  logger.info('\n📦 Step 4: Tagging task rewards...');
  const taskResult = await collection.updateMany(
    {
      description: { $regex: /^Partner task reward/i },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'task',
      },
    },
  );
  logger.info(`   Updated ${taskResult.modifiedCount} task reward transactions`);
  totalUpdated += taskResult.modifiedCount;

  // 5. Tag transactions with taskId metadata
  logger.info('\n📦 Step 5: Tagging by taskId metadata...');
  const taskIdResult = await collection.updateMany(
    {
      'metadata.taskId': { $exists: true },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'task',
      },
    },
  );
  logger.info(`   Updated ${taskIdResult.modifiedCount} transactions with taskId`);
  totalUpdated += taskIdResult.modifiedCount;

  // 6. Tag jackpot rewards (description pattern: "Partner jackpot")
  logger.info('\n📦 Step 6: Tagging jackpot rewards as cashback...');
  const jackpotResult = await collection.updateMany(
    {
      description: { $regex: /^Partner jackpot/i },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'cashback',
      },
    },
  );
  logger.info(`   Updated ${jackpotResult.modifiedCount} jackpot reward transactions`);
  totalUpdated += jackpotResult.modifiedCount;

  // 7. Tag transactions with jackpotId metadata
  logger.info('\n📦 Step 7: Tagging by jackpotId metadata...');
  const jackpotIdResult = await collection.updateMany(
    {
      'metadata.jackpotId': { $exists: true },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'cashback',
      },
    },
  );
  logger.info(`   Updated ${jackpotIdResult.modifiedCount} transactions with jackpotId`);
  totalUpdated += jackpotIdResult.modifiedCount;

  // 8. Tag partner transaction bonuses (description pattern: "Partner transaction bonus")
  logger.info('\n📦 Step 8: Tagging partner transaction bonuses...');
  const txBonusResult = await collection.updateMany(
    {
      description: { $regex: /^Partner transaction bonus/i },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'cashback',
      },
    },
  );
  logger.info(`   Updated ${txBonusResult.modifiedCount} transaction bonus records`);
  totalUpdated += txBonusResult.modifiedCount;

  // 9. Tag any remaining transactions with partnerLevel metadata that weren't caught above
  logger.info('\n📦 Step 9: Tagging remaining partnerLevel-tagged transactions...');
  const partnerLevelResult = await collection.updateMany(
    {
      'metadata.partnerLevel': { $exists: true },
      'metadata.partnerEarning': { $ne: true },
    },
    {
      $set: {
        'metadata.partnerEarning': true,
        'metadata.partnerEarningType': 'cashback', // default to cashback for unclassified
      },
    },
  );
  logger.info(`   Updated ${partnerLevelResult.modifiedCount} remaining partner transactions`);
  totalUpdated += partnerLevelResult.modifiedCount;

  // Summary
  logger.info('\n========================================');
  logger.info(`✅ Migration complete! Total updated: ${totalUpdated}`);

  // Verify: count all partner-tagged transactions
  const totalTagged = await collection.countDocuments({ 'metadata.partnerEarning': true });
  logger.info(`   Total partner-tagged CoinTransactions: ${totalTagged}`);

  // Breakdown by type
  const byType = await collection
    .aggregate([
      { $match: { 'metadata.partnerEarning': true } },
      { $group: { _id: '$metadata.partnerEarningType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  logger.info('   Breakdown by type:');
  byType.forEach((t) => {
    logger.info(`     ${t._id}: ${t.count} transactions, total: ${t.total}`);
  });

  await disconnectDb();
  logger.info('\n🔌 Disconnected from MongoDB');
}

migrate().catch((err) => {
  logger.error('❌ Migration failed:', err);
  process.exit(1);
});
