/**
 * Quick script to update store logos to working URLs
 */
import dotenv from 'dotenv';
import { Store } from '../models/Store';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

const logoUpdates: Record<string, string> = {
  bigbasket: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100',
  blinkit: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100',
  zepto: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100',
  'dmart-ready': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=100',
  'reliance-fresh': 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=100',
  jiomart: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100',
  'more-supermarket': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100',
};

async function updateLogos() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('Connected.\n');

    for (const [slug, logo] of Object.entries(logoUpdates)) {
      const result = await Store.updateOne({ slug }, { $set: { logo } });
      if (result.modifiedCount > 0) {
        logger.info(`Updated logo for: ${slug}`);
      }
    }

    logger.info('\nDone!');
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await disconnectDb();
  }
}

updateLogos();
