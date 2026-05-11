// Migration Script: Add merchant-store linking fields to Discount model
// This script updates existing discounts with default values for new fields:
// - scope: 'global'
// - createdByType: 'user'
// - merchantId: undefined (optional)
// - storeId: undefined (optional)

import dotenv from 'dotenv';
import Discount from '../models/Discount';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config();

async function migrateDiscounts() {
  try {
    logger.info('🔄 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB');

    // Find all discounts that don't have scope or createdByType set
    const discountsToUpdate = await Discount.find({
      $or: [{ scope: { $exists: false } }, { createdByType: { $exists: false } }],
    });

    logger.info(`📊 Found ${discountsToUpdate.length} discounts to migrate`);

    if (discountsToUpdate.length === 0) {
      logger.info('✅ No discounts need migration. All discounts are up to date.');
      await disconnectDb();
      return;
    }

    // Update all discounts with default values
    const updateResult = await Discount.updateMany(
      {
        $or: [{ scope: { $exists: false } }, { createdByType: { $exists: false } }],
      },
      {
        $set: {
          scope: 'global',
          createdByType: 'user',
        },
      },
    );

    logger.info(`✅ Migration completed successfully!`);
    logger.info(`   - Updated ${updateResult.modifiedCount} discounts`);
    logger.info(`   - All discounts now have scope: 'global' and createdByType: 'user'`);

    // Verify migration
    const remaining = await Discount.countDocuments({
      $or: [{ scope: { $exists: false } }, { createdByType: { $exists: false } }],
    });

    if (remaining === 0) {
      logger.info('✅ Verification passed: All discounts have been migrated');
    } else {
      logger.warn(`⚠️  Warning: ${remaining} discounts still need migration`);
    }

    await disconnectDb();
    logger.info('✅ Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    await disconnectDb();
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateDiscounts()
    .then(() => {
      logger.info('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateDiscounts;
