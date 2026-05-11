/**
 * Migration: Add status, visibility, and priority fields to existing challenges.
 *
 * Run: npx ts-node src/scripts/migrateChallengeStatus.ts
 *
 * Logic:
 * - active: true + valid dates -> status: 'active'
 * - active: true + endDate past -> status: 'expired'
 * - active: false -> status: 'disabled'
 * - All get: visibility: 'both', priority: 0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';
dotenv.config();

async function migrate() {
  logger.info('🔄 Connecting to database...');
  await connectScriptDb();
  logger.info('✅ Connected');

  const Challenge = mongoose.connection.collection('challenges');
  const now = new Date();

  // 1. Active + valid dates -> status: 'active'
  const activeResult = await Challenge.updateMany(
    {
      active: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: { $exists: false },
    },
    {
      $set: {
        status: 'active',
        visibility: 'both',
        priority: 0,
        statusHistory: [
          {
            status: 'active',
            changedAt: now,
            reason: 'Migration: set from active boolean',
          },
        ],
      },
    },
  );
  logger.info(`✅ ${activeResult.modifiedCount} challenges set to status: 'active'`);

  // 2. Active but endDate past -> status: 'expired'
  const expiredResult = await Challenge.updateMany(
    {
      active: true,
      endDate: { $lt: now },
      status: { $exists: false },
    },
    {
      $set: {
        status: 'expired',
        visibility: 'both',
        priority: 0,
        statusHistory: [
          {
            status: 'expired',
            changedAt: now,
            reason: 'Migration: endDate already passed',
          },
        ],
      },
    },
  );
  logger.info(`✅ ${expiredResult.modifiedCount} challenges set to status: 'expired'`);

  // 3. Inactive -> status: 'disabled'
  const disabledResult = await Challenge.updateMany(
    {
      active: false,
      status: { $exists: false },
    },
    {
      $set: {
        status: 'disabled',
        visibility: 'both',
        priority: 0,
        statusHistory: [
          {
            status: 'disabled',
            changedAt: now,
            reason: 'Migration: was inactive',
          },
        ],
      },
    },
  );
  logger.info(`✅ ${disabledResult.modifiedCount} challenges set to status: 'disabled'`);

  // 4. Catch-all: any remaining without status
  const remainingResult = await Challenge.updateMany(
    { status: { $exists: false } },
    {
      $set: {
        status: 'active',
        visibility: 'both',
        priority: 0,
      },
    },
  );
  logger.info(`✅ ${remainingResult.modifiedCount} remaining challenges set to status: 'active'`);

  // 5. Set visibility and priority on any that have status but missing other fields
  const patchResult = await Challenge.updateMany(
    { visibility: { $exists: false } },
    { $set: { visibility: 'both', priority: 0 } },
  );
  logger.info(`✅ ${patchResult.modifiedCount} challenges patched with visibility/priority`);

  const total = await Challenge.countDocuments();
  logger.info(`\n📊 Total challenges: ${total}`);

  const statusCounts = await Challenge.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray();
  logger.info('Status breakdown:', statusCounts);

  await disconnectDb();
  logger.info('\n✅ Migration complete');
}

migrate().catch((err) => {
  logger.error('❌ Migration failed:', err);
  process.exit(1);
});
