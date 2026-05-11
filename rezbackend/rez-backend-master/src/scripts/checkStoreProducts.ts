/**
 * Script to check all stores and their products
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function checkStoreProducts() {
  try {
    await connectScriptDb();
    const db = mongoose.connection.db!;

    const stores = await db.collection('stores').find({}).toArray();
    logger.info('Total stores:', stores.length);

    const bySubcategory: Record<string, Array<{ name: string; products: number }>> = {};

    for (const store of stores) {
      const subcat = store.subcategorySlug || 'NO_SUBCATEGORY';
      if (!bySubcategory[subcat]) {
        bySubcategory[subcat] = [];
      }
      const productCount = await db.collection('products').countDocuments({ store: store._id });
      bySubcategory[subcat].push({ name: store.name, products: productCount });
    }

    logger.info('\n=== STORES BY SUBCATEGORY ===\n');
    for (const subcat of Object.keys(bySubcategory).sort()) {
      const storeList = bySubcategory[subcat];
      const totalProducts = storeList.reduce((sum, s) => sum + s.products, 0);
      logger.info(`${subcat}: ${storeList.length} stores, ${totalProducts} products`);
      storeList.forEach((s) => console.log(`  - ${s.name}: ${s.products} products`));
      logger.info('');
    }

    const totalProducts = await db.collection('products').countDocuments({});
    logger.info('Total products:', totalProducts);

    // Find stores with 0 products
    logger.info('\n=== STORES WITH 0 PRODUCTS ===');
    for (const subcat of Object.keys(bySubcategory)) {
      const empty = bySubcategory[subcat].filter((s) => s.products === 0);
      if (empty.length > 0) {
        logger.info(`${subcat}:`);
        empty.forEach((s) => console.log(`  - ${s.name}`));
      }
    }

    await disconnectDb();
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkStoreProducts().then(() => process.exit(0));
