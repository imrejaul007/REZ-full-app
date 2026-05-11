/**
 * Script to check existing stores in the database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function checkStores() {
  try {
    logger.info('📡 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    // Get all stores
    const stores = await db.collection('stores').find({}).toArray();
    logger.info(`📦 Total stores: ${stores.length}\n`);

    // Show store details
    logger.info('========================================');
    logger.info('EXISTING STORES');
    logger.info('========================================\n');

    for (const s of stores) {
      const store = s as any;
      logger.info(`Name: ${store.name}`);
      logger.info(`  Slug: ${store.slug}`);
      logger.info(`  Category: ${store.category}`);
      logger.info(`  Merchant: ${store.merchantId}`);
      logger.info(`  isActive: ${store.isActive}`);
      logger.info('');
    }

    // Get unique merchant IDs
    const merchantIds = [...new Set(stores.map((s) => (s as any).merchantId?.toString()).filter(Boolean))];
    logger.info(`\n📊 Unique Merchant IDs: ${merchantIds.length}`);
    merchantIds.forEach((id) => console.log(`   - ${id}`));

    // Get main categories
    const mainCategories = await db
      .collection('categories')
      .find({ parentCategory: { $exists: false } })
      .toArray();
    logger.info(`\n📂 Main Categories (${mainCategories.length}):`);
    for (const c of mainCategories) {
      const cat = c as any;
      logger.info(`   - ${cat.name} | slug: ${cat.slug} | _id: ${cat._id}`);
    }

    // Get subcategories
    const subCategories = await db
      .collection('categories')
      .find({ parentCategory: { $exists: true } })
      .toArray();
    logger.info(`\n📂 Sub Categories: ${subCategories.length}`);

    // Get products count per store
    logger.info('\n📦 Products per store:');
    for (const s of stores.slice(0, 20)) {
      const store = s as any;
      const productCount = await db.collection('products').countDocuments({ store: store._id });
      logger.info(`   ${store.name}: ${productCount} products`);
    }
  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await disconnectDb();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

checkStores()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
