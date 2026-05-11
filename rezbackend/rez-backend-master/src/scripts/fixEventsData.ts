/**
 * Fix Events Data Script
 * Fixes:
 * 1. rating field (convert object to number)
 * 2. availableSlots (add id to each slot)
 *
 * Run with: npx ts-node src/scripts/fixEventsData.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../config/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function fixEventsData() {
  logger.info('🔧 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || '');
  const db = mongoose.connection.db;

  logger.info('\n📊 Checking current state...');

  // Check for events with rating as object
  const eventsWithObjectRating = await db!.collection('events').countDocuments({
    'rating.average': { $exists: true },
  });
  logger.info(`  Events with object rating: ${eventsWithObjectRating}`);

  // Check for events with slots missing id
  const eventsWithSlots = await db!
    .collection('events')
    .find({
      availableSlots: { $exists: true, $ne: [] },
    })
    .toArray();
  const eventsWithBadSlots = eventsWithSlots.filter((e) => e.availableSlots?.some((slot: any) => !slot.id));
  logger.info(`  Events with slots missing id: ${eventsWithBadSlots.length}`);

  // Fix 1: Convert rating object to number
  if (eventsWithObjectRating > 0) {
    logger.info('\n🔄 Fixing rating field...');
    const ratingFix = await db!.collection('events').updateMany({ 'rating.average': { $exists: true } }, [
      {
        $set: {
          reviewCount: { $ifNull: ['$rating.count', 0] },
          rating: { $ifNull: ['$rating.average', 0] },
        },
      },
    ]);
    logger.info(`  ✅ Fixed ${ratingFix.modifiedCount} events`);
  }

  // Fix 2: Add id to availableSlots
  if (eventsWithBadSlots.length > 0) {
    logger.info('\n🔄 Fixing availableSlots...');
    let fixed = 0;

    for (const event of eventsWithBadSlots) {
      const fixedSlots = event.availableSlots.map((slot: any, index: number) => ({
        ...slot,
        id: slot.id || `slot_${index + 1}`,
      }));

      await db!.collection('events').updateOne({ _id: event._id }, { $set: { availableSlots: fixedSlots } });
      fixed++;
    }
    logger.info(`  ✅ Fixed ${fixed} events`);
  }

  // Verify the fix
  logger.info('\n📊 Verifying fix...');

  // Test specific event
  const testEvent = await db!.collection('events').findOne({
    _id: new mongoose.Types.ObjectId('69726359fae600727ce9a464'),
  });

  if (testEvent) {
    logger.info(`\n  Sample Event: ${testEvent.title}`);
    logger.info(`    rating: ${testEvent.rating} (type: ${typeof testEvent.rating})`);
    logger.info(`    reviewCount: ${testEvent.reviewCount}`);
    logger.info(`    availableSlots: ${testEvent.availableSlots?.length || 0} slots`);
    if (testEvent.availableSlots?.[0]) {
      logger.info(`    first slot id: ${testEvent.availableSlots[0].id}`);
    }
  }

  // Final count
  const remainingBad = await db!.collection('events').countDocuments({
    'rating.average': { $exists: true },
  });
  logger.info(`\n  Remaining events with object rating: ${remainingBad}`);

  await mongoose.disconnect();
  logger.info('\n✅ Done!');
}

fixEventsData().catch((err) => { console.error(err); process.exit(1); }); // D19: fail loud so CI catches broken seeds
