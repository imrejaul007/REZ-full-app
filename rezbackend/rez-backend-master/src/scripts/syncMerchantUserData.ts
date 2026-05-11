#!/usr/bin/env ts-node

/**
 * Merchant-User Data Sync Script
 *
 * This script syncs data between merchant-side and user-side:
 * 1. Creates stores for all merchants that don't have stores yet
 * 2. Creates user-side products for all merchant products
 *
 * Usage:
 * - npm run sync:all - Full sync of merchants and products
 * - npm run sync:merchants - Sync merchants to stores only
 * - npm run sync:products - Sync merchant products to user products only
 * - npm run sync:status - Show sync status
 */

import { MerchantUserSyncService } from '../services/MerchantUserSyncService';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

async function showSyncStatus() {
  const status = await MerchantUserSyncService.getSyncStatus();
  if (!status) {
    logger.error('❌ Failed to get sync status');
    return;
  }

  logger.info('\n📊 SYNC STATUS REPORT');
  logger.info('=====================');
  logger.info(`👥 Merchants: ${status.merchants.total}`);
  logger.info(`   ├─ With stores: ${status.merchants.withStores}`);
  logger.info(`   └─ Without stores: ${status.merchants.withoutStores}`);
  logger.info(`\n🏪 Stores: ${status.stores.total}`);
  logger.info(`   └─ Synced from merchants: ${status.stores.syncedFromMerchants}`);
  logger.info(`\n📦 Products:`);
  logger.info(`   ├─ Merchant-side: ${status.products.merchantSide}`);
  logger.info(`   ├─ User-side: ${status.products.userSide}`);
  logger.info(`   ├─ Synced: ${status.products.synced}`);
  logger.info(`   └─ Needs sync: ${status.products.needsSync}`);
  logger.info(`\n💚 Sync Health:`);
  logger.info(`   ├─ Merchant-Store sync: ${status.syncHealth.merchantStoreSync}%`);
  logger.info(`   └─ Product sync: ${status.syncHealth.productSync}%`);
  logger.info('=====================\n');
}

async function main() {
  const command = process.argv[2] || 'status';

  await connectScriptDb();

  try {
    switch (command) {
      case 'all':
      case 'full':
        logger.info('🚀 Starting full sync...');
        await MerchantUserSyncService.forceFullSync();
        await showSyncStatus();
        break;

      case 'merchants':
      case 'stores':
        logger.info('🏪 Syncing merchants to stores...');
        await MerchantUserSyncService.syncAllMerchantsToStores();
        await showSyncStatus();
        break;

      case 'products':
        logger.info('📦 Syncing merchant products to user products...');
        await MerchantUserSyncService.syncAllMerchantProductsToUserProducts();
        await showSyncStatus();
        break;

      case 'status':
      default:
        await showSyncStatus();
        break;
    }
  } catch (error) {
    logger.error('❌ Sync failed:', error);
    process.exit(1);
  }

  await disconnectDb();
  logger.info('✅ Disconnected from MongoDB');
  process.exit(0);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Promise Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

export { main as syncMerchantUserData };
