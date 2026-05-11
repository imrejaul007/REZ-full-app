/**
 * Seed Store Metadata
 * Updates existing stores with is60MinDelivery, hasStorePickup, and location coordinates
 */

import dotenv from 'dotenv';
import path from 'path';
import { Store } from '../models/Store';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Sample coordinates for major Indian cities
const cityCoordinates: Record<string, [number, number]> = {
  mumbai: [72.8777, 19.076],
  delhi: [77.209, 28.6139],
  bangalore: [77.5946, 12.9716],
  hyderabad: [78.4867, 17.385],
  chennai: [80.2707, 13.0827],
  kolkata: [88.3639, 22.5726],
  pune: [73.8567, 18.5204],
  ahmedabad: [72.5714, 23.0225],
};

function getRandomCoordinates(city?: string): [number, number] {
  if (city && cityCoordinates[city.toLowerCase()]) {
    const [lng, lat] = cityCoordinates[city.toLowerCase()];
    // Add small random offset (within ~5km)
    return [lng + (Math.random() - 0.5) * 0.05, lat + (Math.random() - 0.5) * 0.05];
  }
  // Default to Mumbai if city not found
  return [72.8777 + (Math.random() - 0.5) * 0.1, 19.076 + (Math.random() - 0.5) * 0.1];
}

async function seedStoreMetadata(): Promise<number> {
  await connectScriptDb();

  logger.info('Updating Store Metadata...');

  const stores = await Store.find({});
  let updated = 0;

  for (const store of stores) {
    const updates: any = {};

    // Set is60MinDelivery (60% chance)
    if (store.is60MinDelivery === undefined) {
      updates.is60MinDelivery = Math.random() > 0.4;
    }

    // Set hasStorePickup (70% chance)
    if (store.hasStorePickup === undefined) {
      updates.hasStorePickup = Math.random() > 0.3;
    }

    // Set location coordinates if missing
    if (!store.location?.coordinates || store.location.coordinates.length < 2) {
      const coords = getRandomCoordinates(store.location.city);
      updates['location.coordinates'] = coords;
    }

    if (Object.keys(updates).length > 0) {
      await Store.findByIdAndUpdate(store._id, { $set: updates });
      updated++;
    }
  }

  logger.info(`Updated ${updated} stores with metadata`);
  await disconnectDb();
  return updated;
}

seedStoreMetadata().catch((err) => { console.error(err); process.exit(1); }); // D19: fail loud so CI catches broken seeds
