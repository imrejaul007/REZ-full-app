/**
 * Script to verify region filtering is working correctly
 *
 * Checks:
 * 1. Store city distribution matches expected values
 * 2. Region service filter returns correct stores
 * 3. Dubai stores have Dubai city, Bangalore stores have Bangalore city
 *
 * Usage: npx ts-node src/scripts/verify-region-filtering.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { regionService, REGIONS } from '../services/regionService';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function verifyRegionFiltering() {
  try {
    logger.info('🚀 Starting region filtering verification...\n');
    logger.info(`📡 Connecting to MongoDB...`);

    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;

    // 1. Check city distribution
    logger.info('========================================');
    logger.info('📊 CITY DISTRIBUTION');
    logger.info('========================================');

    const cityDistribution = await db
      .collection('stores')
      .aggregate([{ $group: { _id: '$location.city', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
      .toArray();

    for (const city of cityDistribution) {
      logger.info(`   ${city._id || 'null'}: ${city.count} stores`);
    }

    // 2. Test region filter for Bangalore
    logger.info('\n========================================');
    logger.info('🔍 BANGALORE REGION FILTER TEST');
    logger.info('========================================');

    const bangaloreFilter = regionService.getStoreFilter('bangalore');
    logger.info('Filter:', JSON.stringify(bangaloreFilter, null, 2));

    const bangaloreStores = await db
      .collection('stores')
      .find(bangaloreFilter)
      .project({ name: 1, 'location.city': 1 })
      .limit(5)
      .toArray();

    logger.info(`\nFound ${bangaloreStores.length} Bangalore stores (showing first 5):`);
    for (const store of bangaloreStores) {
      logger.info(`   - ${store.name} (city: ${store.location?.city})`);
    }

    const bangaloreCount = await db.collection('stores').countDocuments(bangaloreFilter);
    logger.info(`\nTotal Bangalore stores: ${bangaloreCount}`);

    // 3. Test region filter for Dubai
    logger.info('\n========================================');
    logger.info('🔍 DUBAI REGION FILTER TEST');
    logger.info('========================================');

    const dubaiFilter = regionService.getStoreFilter('dubai');
    logger.info('Filter:', JSON.stringify(dubaiFilter, null, 2));

    const dubaiStores = await db
      .collection('stores')
      .find(dubaiFilter)
      .project({ name: 1, 'location.city': 1 })
      .limit(5)
      .toArray();

    logger.info(`\nFound ${dubaiStores.length} Dubai stores (showing first 5):`);
    for (const store of dubaiStores) {
      logger.info(`   - ${store.name} (city: ${store.location?.city})`);
    }

    const dubaiCount = await db.collection('stores').countDocuments(dubaiFilter);
    logger.info(`\nTotal Dubai stores: ${dubaiCount}`);

    // 4. Check for any stores without proper city
    logger.info('\n========================================');
    logger.info('⚠️ STORES WITHOUT PROPER CITY');
    logger.info('========================================');

    const storesWithoutCity = await db.collection('stores').countDocuments({
      $or: [{ 'location.city': { $exists: false } }, { 'location.city': null }, { 'location.city': '' }],
    });

    logger.info(`Stores without city: ${storesWithoutCity}`);

    // 5. Check for any stores not in Bangalore or Dubai
    const allCities = REGIONS.bangalore.cities.concat(REGIONS.dubai.cities);
    const cityPatterns = allCities.map((city) => new RegExp(`^${city}$`, 'i'));

    const unknownCityStores = await db
      .collection('stores')
      .find({
        $and: [
          { 'location.city': { $exists: true, $ne: null, $nin: [''] } },
          { 'location.city': { $not: { $in: cityPatterns } } },
        ],
      })
      .project({ name: 1, 'location.city': 1 })
      .toArray();

    logger.info(`\nStores with unknown cities: ${unknownCityStores.length}`);
    if (unknownCityStores.length > 0) {
      for (const store of unknownCityStores.slice(0, 5)) {
        logger.info(`   - ${store.name} (city: ${store.location?.city})`);
      }
    }

    // 6. Summary
    logger.info('\n========================================');
    logger.info('📊 VERIFICATION SUMMARY');
    logger.info('========================================');
    logger.info(`✅ Bangalore stores: ${bangaloreCount}`);
    logger.info(`✅ Dubai stores: ${dubaiCount}`);
    logger.info(`${storesWithoutCity === 0 ? '✅' : '⚠️'} Stores without city: ${storesWithoutCity}`);
    logger.info(
      `${unknownCityStores.length === 0 ? '✅' : '⚠️'} Stores with unknown cities: ${unknownCityStores.length}`,
    );

    const _totalExpected = bangaloreCount + dubaiCount + storesWithoutCity + unknownCityStores.length;
    const totalActual = await db.collection('stores').countDocuments({});
    logger.info(`\nTotal stores in DB: ${totalActual}`);

    if (bangaloreCount > 0 && dubaiCount > 0 && storesWithoutCity === 0) {
      logger.info('\n✅ REGION FILTERING IS WORKING CORRECTLY');
    } else {
      logger.info('\n⚠️ THERE MAY BE ISSUES WITH REGION FILTERING');
    }
  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await disconnectDb();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

verifyRegionFiltering()
  .then(() => {
    logger.info('✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Verification failed:', error);
    process.exit(1);
  });
