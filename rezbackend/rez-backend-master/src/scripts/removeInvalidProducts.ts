/**
 * Script to remove invalid products from the database
 * Products that weren't properly updated or have mismatched data
 *
 * Run: npx ts-node src/scripts/removeInvalidProducts.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

// SubSubCategories that indicate products weren't properly updated
const INVALID_SUB_SUB_CATEGORIES = [
  'Mutton/Lamb',
  'Seafood',
  'Poultry',
  'Processed Meats',
  'Seasonal Produce',
  'Exotic Vegetables',
  'Organic Vegetables',
];

// Old product names that weren't updated
const OLD_PRODUCT_NAMES = [
  'Eggs 30pc',
  'Chicken 1kg',
  'Pomfret',
  'Prawns',
  'Mutton 1kg',
  'Fish Curry Cut',
  'Chicken Breast',
  'Goat Meat',
  'Lamb Chops',
  'Salmon Fillet',
  'Tuna Steak',
  'Shrimp',
  'Lobster',
  'Crab',
  'Tomatoes 1kg',
  'Potatoes 1kg',
  'Onions 1kg',
  'Carrots 500g',
  'Spinach Bunch',
  'Cabbage',
  'Cauliflower',
  'Broccoli',
  'Capsicum',
  'Cucumber',
];

async function removeInvalidProducts() {
  try {
    logger.info('🚀 Starting invalid product removal...');
    logger.info(`📡 Connecting to MongoDB...`);

    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    // Count total products before
    const totalBefore = await db.collection('products').countDocuments({});
    logger.info(`📦 Total products before cleanup: ${totalBefore}\n`);

    // Find products with invalid subSubCategories
    logger.info('========================================');
    logger.info('FINDING INVALID PRODUCTS');
    logger.info('========================================\n');

    const invalidBySubSubCat = await db
      .collection('products')
      .find({
        subSubCategory: { $in: INVALID_SUB_SUB_CATEGORIES },
      })
      .toArray();

    logger.info(`Found ${invalidBySubSubCat.length} products with invalid subSubCategories:`);
    for (const p of invalidBySubSubCat.slice(0, 20)) {
      logger.info(`   - ${(p as any).name} | subSubCategory: ${(p as any).subSubCategory}`);
    }
    if (invalidBySubSubCat.length > 20) {
      logger.info(`   ... and ${invalidBySubSubCat.length - 20} more`);
    }

    // Find products with old names
    const invalidByName = await db
      .collection('products')
      .find({
        name: { $in: OLD_PRODUCT_NAMES },
      })
      .toArray();

    logger.info(`\nFound ${invalidByName.length} products with old/invalid names:`);
    for (const p of invalidByName.slice(0, 20)) {
      logger.info(`   - ${(p as any).name}`);
    }

    // Find products without proper pricing
    const invalidByPrice = await db
      .collection('products')
      .find({
        $or: [{ 'pricing.selling': { $exists: false } }, { 'pricing.selling': null }, { 'pricing.selling': 0 }],
      })
      .toArray();

    logger.info(`\nFound ${invalidByPrice.length} products without proper pricing`);

    // Collect all IDs to delete
    const allInvalidIds = new Set<string>();

    invalidBySubSubCat.forEach((p) => allInvalidIds.add((p as any)._id.toString()));
    invalidByName.forEach((p) => allInvalidIds.add((p as any)._id.toString()));
    invalidByPrice.forEach((p) => allInvalidIds.add((p as any)._id.toString()));

    const idsToDelete = Array.from(allInvalidIds).map((id) => new mongoose.Types.ObjectId(id));

    logger.info(`\n========================================`);
    logger.info(`DELETING ${idsToDelete.length} INVALID PRODUCTS`);
    logger.info(`========================================\n`);

    if (idsToDelete.length > 0) {
      const result = await db.collection('products').deleteMany({
        _id: { $in: idsToDelete },
      });
      logger.info(`✅ Deleted ${result.deletedCount} products`);
    } else {
      logger.info('No invalid products to delete');
    }

    // Count total products after
    const totalAfter = await db.collection('products').countDocuments({});
    logger.info(`\n📦 Total products after cleanup: ${totalAfter}`);
    logger.info(`📉 Products removed: ${totalBefore - totalAfter}`);

    // Show sample of remaining products
    logger.info('\n========================================');
    logger.info('SAMPLE OF REMAINING PRODUCTS');
    logger.info('========================================\n');

    const sampleProducts = await db.collection('products').find({}).limit(10).toArray();
    for (const p of sampleProducts) {
      const prod = p as any;
      logger.info(`   ${prod.name}`);
      logger.info(`      SubSubCategory: ${prod.subSubCategory}`);
      logger.info(`      Price: ₹${prod.pricing?.selling}`);
      logger.info('');
    }
  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await disconnectDb();
    logger.info('🔌 Disconnected from MongoDB');
  }
}

removeInvalidProducts()
  .then(() => {
    logger.info('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
