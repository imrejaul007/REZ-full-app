/**
 * Enable Mall for Existing Stores Script
 *
 * Updates existing stores to enable the mall flag (deliveryCategories.mall = true)
 * so they appear in ReZ Mall - the in-app delivery marketplace.
 *
 * ReZ Mall = In-app delivery marketplace where users:
 * - Browse registered stores
 * - Order products through the app
 * - Earn ReZ Coins as rewards
 *
 * Run: npx ts-node src/scripts/enableMallForStores.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectScriptDb, disconnectDb } from './connectDb';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import Store model
import { Store } from '../models/Store';
import { logger } from '../config/logger';

async function enableMallForStores() {
  try {
    // Connect to MongoDB
    logger.info('🔄 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB');

    // Get top 10 active stores (sorted by rating)
    const MAX_STORES = 10;
    const stores = await Store.find({ isActive: true })
      .sort({ 'ratings.average': -1, 'ratings.count': -1 })
      .limit(MAX_STORES);

    logger.info(`📦 Found ${stores.length} stores to enable for mall`);

    if (stores.length === 0) {
      logger.info('⚠️ No stores found. Please run seedStores.ts first.');
      return;
    }

    // Enable mall for selected stores and set up reward rules
    logger.info('🏪 Enabling mall for top 10 stores...');

    let updatedCount = 0;
    let featuredCount = 0;
    let premiumCount = 0;

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];

      // First 3 stores are featured + premium
      // Next 3 stores are featured
      // Remaining are standard mall stores
      const isPremium = i < 3;
      const isFeatured = i < 6;

      // Calculate coin reward percentage based on store tier
      let baseCashbackPercent = 5; // Default 5%
      if (isPremium) {
        baseCashbackPercent = 10;
      } else if (isFeatured) {
        baseCashbackPercent = 7;
      }

      // Update store
      await Store.findByIdAndUpdate(store._id, {
        $set: {
          'deliveryCategories.mall': true,
          'deliveryCategories.premium': isPremium,
          isFeatured: isFeatured,
          'rewardRules.baseCashbackPercent': baseCashbackPercent,
          'rewardRules.extraRewardThreshold': 500,
          'rewardRules.extraRewardCoins': 50,
          'rewardRules.reviewBonusCoins': 10,
          'rewardRules.minimumAmountForReward': 100,
        },
      });

      logger.info(
        `  ✅ ${store.name} - ${isPremium ? 'Premium' : isFeatured ? 'Featured' : 'Standard'} (${baseCashbackPercent}% coins)`,
      );

      updatedCount++;
      if (isFeatured) featuredCount++;
      if (isPremium) premiumCount++;
    }

    // Summary
    logger.info('\n========================================');
    logger.info('🎉 Mall enabled for stores!');
    logger.info('========================================');
    logger.info(`✅ Total stores updated: ${updatedCount}`);
    logger.info(`⭐ Featured stores: ${featuredCount}`);
    logger.info(`💎 Premium stores: ${premiumCount}`);
    logger.info('========================================');
    logger.info('\n📱 ReZ Mall will now show these stores.');
    logger.info('   Users can browse, order, and earn ReZ Coins!');
    logger.info('========================================\n');
  } catch (error) {
    logger.error('❌ Error enabling mall for stores:', error);
    throw error;
  } finally {
    await disconnectDb();
    logger.info('🔌 Disconnected from MongoDB');
  }
}

// Run the script
enableMallForStores()
  .then(() => {
    logger.info('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
