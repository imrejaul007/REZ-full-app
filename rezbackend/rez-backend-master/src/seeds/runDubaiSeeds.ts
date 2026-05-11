/**
 * Dubai Region Seeds Runner
 *
 * This script seeds all the data needed for the Dubai region:
 * - Dubai stores (Carrefour, LuLu, Sharaf DG, etc.)
 * - Dubai products with AED pricing
 *
 * Run with: npx ts-node src/seeds/runDubaiSeeds.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import the seed function
import { seedDubaiStores } from './dubaiStoreSeeds';
import { logger } from '../config/logger';

async function main() {
  logger.info('🚀 Starting Dubai Region Seeds...\n');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-app';

    logger.info('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB\n');

    // Seed Dubai stores and products
    await seedDubaiStores();

    // Print summary
    logger.info('\n📊 Seeding Summary:');

    // Import Store and Product models to count
    const { Store } = await import('../models/Store');
    const { Product } = await import('../models/Product');

    const dubaiStoreCount = await Store.countDocuments({ 'location.city': 'Dubai' });
    const dubaiProductCount = await Product.countDocuments({
      store: { $in: await Store.find({ 'location.city': 'Dubai' }).distinct('_id') },
    });

    logger.info(`- Dubai Stores: ${dubaiStoreCount}`);
    logger.info(`- Dubai Products: ${dubaiProductCount}`);

    logger.info('\n✅ Dubai region seeds completed successfully!');
  } catch (error) {
    logger.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('\n📡 Disconnected from MongoDB');
  }
}

// Run the seeder
main();
