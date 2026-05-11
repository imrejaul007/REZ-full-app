import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('[FATAL] MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  await mongoose.connect(uri, {
    // IDX-1: Disable autoIndex in production (same pattern as monolith).
    // autoIndex=true would make every pod re-run ensureIndex() on boot,
    // stalling startup and racing on large collections. Index creation
    // is handled via one-off migration scripts in production.
    autoIndex: process.env.NODE_ENV !== 'production',
    autoCreate: process.env.NODE_ENV !== 'production',
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    socketTimeoutMS: 45000,
  });
  logger.debug('[MongoDB] Connected');
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
}
