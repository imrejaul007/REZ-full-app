/**
 * Script to check Dubai products in the database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function checkDubaiProducts() {
  try {
    logger.info('🚀 Checking Dubai products...\n');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    // 1. Find Dubai stores
    logger.info('========================================');
    logger.info('📊 DUBAI STORES');
    logger.info('========================================');

    const dubaiStores = await db
      .collection('stores')
      .find({
        'location.city': { $regex: /^dubai$/i },
      })
      .project({ _id: 1, name: 1, 'location.city': 1 })
      .toArray();

    logger.info(`Found ${dubaiStores.length} Dubai stores:`);
    for (const store of dubaiStores) {
      logger.info(`   - ${store.name} (ID: ${store._id})`);
    }

    const dubaiStoreIds = dubaiStores.map((s) => s._id);

    // 2. Find products linked to Dubai stores
    logger.info('\n========================================');
    logger.info('📊 PRODUCTS LINKED TO DUBAI STORES');
    logger.info('========================================');

    const dubaiProducts = await db
      .collection('products')
      .find({
        store: { $in: dubaiStoreIds },
      })
      .project({ _id: 1, name: 1, title: 1, store: 1 })
      .toArray();

    logger.info(`Found ${dubaiProducts.length} products in Dubai stores:`);
    for (const product of dubaiProducts.slice(0, 10)) {
      const store = dubaiStores.find((s) => s._id.equals(product.store));
      logger.info(`   - ${product.name || product.title} (Store: ${store?.name || 'Unknown'})`);
    }
    if (dubaiProducts.length > 10) {
      logger.info(`   ... and ${dubaiProducts.length - 10} more`);
    }

    // 3. Find Bangalore stores
    logger.info('\n========================================');
    logger.info('📊 BANGALORE STORES');
    logger.info('========================================');

    const bangaloreStores = await db
      .collection('stores')
      .find({
        'location.city': { $regex: /^bangalore$/i },
      })
      .project({ _id: 1, name: 1 })
      .toArray();

    logger.info(`Found ${bangaloreStores.length} Bangalore stores`);

    const bangaloreStoreIds = bangaloreStores.map((s) => s._id);

    // 4. Find products linked to Bangalore stores
    const bangaloreProducts = await db.collection('products').countDocuments({
      store: { $in: bangaloreStoreIds },
    });

    logger.info(`Found ${bangaloreProducts} products in Bangalore stores`);

    // 5. Check products without store assignment
    logger.info('\n========================================');
    logger.info('📊 PRODUCTS WITHOUT STORE ASSIGNMENT');
    logger.info('========================================');

    const productsWithoutStore = await db.collection('products').countDocuments({
      $or: [{ store: { $exists: false } }, { store: null }],
    });

    logger.info(`Products without store: ${productsWithoutStore}`);

    // 6. Summary
    logger.info('\n========================================');
    logger.info('📊 SUMMARY');
    logger.info('========================================');
    logger.info(`Dubai stores: ${dubaiStores.length}`);
    logger.info(`Dubai products: ${dubaiProducts.length}`);
    logger.info(`Bangalore stores: ${bangaloreStores.length}`);
    logger.info(`Bangalore products: ${bangaloreProducts}`);
    logger.info(`Products without store: ${productsWithoutStore}`);

    if (dubaiProducts.length === 0) {
      logger.info('\n⚠️ WARNING: No products are linked to Dubai stores!');
      logger.info('This is why Dubai region shows no products.');
      logger.info('Products need to be created/assigned to Dubai stores.');
    }
  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await disconnectDb();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

checkDubaiProducts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
