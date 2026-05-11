import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('[FATAL] MONGODB_URI environment variable is required');
  }
  await mongoose.connect(uri, {
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    w: 'majority',
    journal: true,
    autoIndex: process.env.NODE_ENV !== 'production',
  });
  mongoose.set('strictQuery', true);
  logger.info('[MongoDB] Connected to rez-finance database');
}

export async function disconnectMongoDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('[MongoDB] Disconnected');
}
