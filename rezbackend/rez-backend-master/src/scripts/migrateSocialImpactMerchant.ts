/**
 * Migration: Link existing social impact events to a merchant.
 *
 * Run: npx ts-node src/scripts/migrateSocialImpactMerchant.ts
 */

import { connectDatabase } from '../config/database';
import Program from '../models/Program';
import { Merchant } from '../models/Merchant';
import { logger } from '../config/logger';

async function migrateSocialImpactMerchant() {
  try {
    logger.info('Starting Social Impact merchant migration...');
    await connectDatabase();

    // Find the first active merchant
    const testMerchant = await Merchant.findOne({ isActive: true }).sort({ createdAt: 1 });

    if (!testMerchant) {
      logger.error('No active merchant found. Please create a merchant account first.');
      process.exit(1);
    }

    logger.info(`Using merchant: ${testMerchant.businessName} (${testMerchant._id})`);

    // Update all social_impact events that have no merchant assigned
    const result = await Program.updateMany(
      {
        type: 'social_impact',
        $or: [{ merchant: { $exists: false } }, { merchant: null }],
      },
      {
        $set: { merchant: testMerchant._id },
      },
    );

    logger.info(`Updated ${result.modifiedCount} social impact events → merchant ${testMerchant._id}`);

    // Verify
    const total = await Program.countDocuments({ type: 'social_impact' });
    const linked = await Program.countDocuments({ type: 'social_impact', merchant: testMerchant._id });
    logger.info(`\nVerification: ${linked}/${total} events linked to merchant`);

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSocialImpactMerchant();
