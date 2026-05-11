/**
 * Script to fix store city data for region filtering
 *
 * Problem: All Indian stores have location.city = "Mumbai" instead of "Bangalore"
 * This breaks region filtering because Bangalore region looks for cities like
 * "Bangalore", "Bengaluru", etc.
 *
 * Solution: Update all Mumbai stores to Bangalore
 *
 * Usage: npx ts-node src/scripts/fix-store-cities.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function fixStoreCities() {
  try {
    logger.info('🚀 Starting store city fix script...');
    logger.info(`📡 Connecting to MongoDB...`);

    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    // First, show current city distribution
    logger.info('📊 Current city distribution:');
    const beforeDistribution = await db
      .collection('stores')
      .aggregate([{ $group: { _id: '$location.city', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    for (const city of beforeDistribution) {
      logger.info(`   ${city._id || 'null'}: ${city.count} stores`);
    }

    // Count Mumbai stores that will be updated
    const mumbaiCount = await db.collection('stores').countDocuments({
      'location.city': 'Mumbai',
    });

    logger.info(`\n🔄 Found ${mumbaiCount} stores with city "Mumbai" to update to "Bangalore"`);

    if (mumbaiCount === 0) {
      logger.info('✅ No Mumbai stores found - nothing to update');
    } else {
      // Update Mumbai stores to Bangalore
      const result = await db.collection('stores').updateMany(
        { 'location.city': 'Mumbai' },
        {
          $set: {
            'location.city': 'Bangalore',
            'location.state': 'Karnataka',
            'location.country': 'India',
            updatedAt: new Date(),
          },
        },
      );

      logger.info(`✅ Updated ${result.modifiedCount} stores from Mumbai to Bangalore`);
    }

    // Show final city distribution
    logger.info('\n📊 Final city distribution:');
    const afterDistribution = await db
      .collection('stores')
      .aggregate([{ $group: { _id: '$location.city', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    for (const city of afterDistribution) {
      logger.info(`   ${city._id || 'null'}: ${city.count} stores`);
    }

    // Verify that Bangalore and Dubai are the main cities
    const bangaloreCount = await db.collection('stores').countDocuments({
      'location.city': { $regex: /^bangalore$/i },
    });
    const dubaiCount = await db.collection('stores').countDocuments({
      'location.city': { $regex: /^dubai$/i },
    });

    logger.info('\n========================================');
    logger.info('📊 FIX SUMMARY');
    logger.info('========================================');
    logger.info(`Bangalore stores: ${bangaloreCount}`);
    logger.info(`Dubai stores: ${dubaiCount}`);
    logger.info(`Total stores: ${bangaloreCount + dubaiCount}`);
  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await disconnectDb();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

fixStoreCities()
  .then(() => {
    logger.info('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
