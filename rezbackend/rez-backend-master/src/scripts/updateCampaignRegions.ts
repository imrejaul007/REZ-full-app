/**
 * Update Script for Campaign Regions
 * Updates existing campaigns without region field to 'bangalore'
 *
 * Run: npx ts-node src/scripts/updateCampaignRegions.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectScriptDb, disconnectDb } from './connectDb';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Campaign from '../models/Campaign';
import { logger } from '../config/logger';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg: string) => console.log(`${colors.cyan}i ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

// Connect to database

// Update campaigns without region field
async function updateCampaignRegions(): Promise<void> {
  log.header('Updating Campaign Regions');

  try {
    // Find campaigns without region field
    const campaignsWithoutRegion = await Campaign.countDocuments({
      region: { $exists: false },
    });

    log.info(`Found ${campaignsWithoutRegion} campaigns without region field`);

    if (campaignsWithoutRegion > 0) {
      // Update all campaigns without region to 'bangalore' (India default)
      const result = await Campaign.updateMany({ region: { $exists: false } }, { $set: { region: 'bangalore' } });

      log.success(`Updated ${result.modifiedCount} campaigns to region: bangalore`);
    } else {
      log.info('All campaigns already have region field');
    }

    // Show final distribution
    const distribution = await Campaign.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    log.header('Campaign Region Distribution');
    logger.info('┌────────────────────────────┬───────┐');
    logger.info('│ Region                     │ Count │');
    logger.info('├────────────────────────────┼───────┤');
    for (const item of distribution) {
      const region = (item._id || 'null').padEnd(26);
      const count = String(item.count).padStart(5);
      logger.info(`│ ${region} │ ${count} │`);
    }
    logger.info('└────────────────────────────┴───────┘');
  } catch (error: any) {
    log.error(`Error updating campaigns: ${error.message}`);
    throw error;
  }
}

// Main function
async function main(): Promise<void> {
  try {
    log.header('Campaign Region Updater');

    // Connect to database
    await connectScriptDb();

    // Update campaigns
    await updateCampaignRegions();

    log.success('\nUpdate complete!');
    log.info('Next step: Run "npx ts-node src/scripts/seedCampaigns.ts --clear" to seed region-specific campaigns');
  } catch (error: any) {
    log.error(`Update failed: ${error.message}`);
    logger.error(error);
    process.exit(1);
  } finally {
    await disconnectDb();
    log.success('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default main;
