/**
 * Check Homepage Data Script
 * Verifies that all homepage sections have proper data seeded
 *
 * Run: npx ts-node src/scripts/checkHomepageData.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectScriptDb, disconnectDb } from './connectDb';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Campaign from '../models/Campaign';
import StoreExperience from '../models/StoreExperience';
import { ServiceCategory } from '../models/ServiceCategory';
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
  info: (msg: string) => console.log(colors.cyan + 'ℹ ' + msg + colors.reset),
  success: (msg: string) => console.log(colors.green + '✓ ' + msg + colors.reset),
  warning: (msg: string) => console.log(colors.yellow + '⚠ ' + msg + colors.reset),
  error: (msg: string) => console.log(colors.red + '✗ ' + msg + colors.reset),
  header: (msg: string) =>
    logger.info('\n' + colors.bright + colors.blue + '━━━ ' + msg + ' ━━━' + colors.reset + '\n'),
};

// Check Campaigns
async function checkCampaigns() {
  log.header('Checking Campaigns (ExcitingDealsSection)');

  try {
    const now = new Date();
    const totalCampaigns = await Campaign.countDocuments({});
    const activeCampaigns = await Campaign.countDocuments({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    const campaigns = await Campaign.find({}).sort({ priority: -1 }).lean();

    logger.info(`\n📊 Campaign Statistics:`);
    logger.info(`   Total Campaigns: ${totalCampaigns}`);
    logger.info(`   Active Campaigns: ${activeCampaigns}`);

    if (campaigns.length === 0) {
      log.warning('No campaigns found in database');
      return false;
    }

    logger.info(`\n📋 Campaign List:`);
    campaigns.forEach((campaign, index) => {
      const isActive = campaign.isActive && campaign.startTime <= now && campaign.endTime >= now;
      const status = isActive ? '✅ Active' : '❌ Inactive';
      const dealsCount = campaign.deals?.length || 0;

      logger.info(`   ${index + 1}. ${campaign.title}`);
      logger.info(`      ID: ${campaign.campaignId}`);
      logger.info(`      Type: ${campaign.type}`);
      logger.info(`      Status: ${status}`);
      logger.info(`      Deals: ${dealsCount}`);
      logger.info(`      Priority: ${campaign.priority}`);
      logger.info('');
    });

    // Expected campaigns
    const expectedCampaigns = [
      'super-cashback-weekend',
      'triple-coin-day',
      'mega-bank-offers',
      'upload-bill-bonanza',
      'flash-coin-drops',
      'new-user-bonanza',
    ];

    const foundCampaigns = campaigns.map((c) => c.campaignId);
    const missingCampaigns = expectedCampaigns.filter((id) => !foundCampaigns.includes(id));

    if (missingCampaigns.length > 0) {
      log.warning(`Missing campaigns: ${missingCampaigns.join(', ')}`);
      return false;
    }

    log.success('All expected campaigns are present');
    return true;
  } catch (error: any) {
    log.error(`Error checking campaigns: ${error.message}`);
    return false;
  }
}

// Check Store Experiences
async function checkStoreExperiences() {
  log.header('Checking Store Experiences (ShopByExperienceSection)');

  try {
    const totalExperiences = await StoreExperience.countDocuments({});
    const activeExperiences = await StoreExperience.countDocuments({ isActive: true });
    const featuredExperiences = await StoreExperience.countDocuments({
      isActive: true,
      isFeatured: true,
    });

    const experiences = await StoreExperience.find({}).sort({ sortOrder: 1 }).lean();

    logger.info(`\n📊 Experience Statistics:`);
    logger.info(`   Total Experiences: ${totalExperiences}`);
    logger.info(`   Active Experiences: ${activeExperiences}`);
    logger.info(`   Featured Experiences: ${featuredExperiences}`);

    if (experiences.length === 0) {
      log.warning('No store experiences found in database');
      return false;
    }

    logger.info(`\n📋 Experience List:`);
    experiences.forEach((exp, index) => {
      const status = exp.isActive ? '✅ Active' : '❌ Inactive';
      const featured = exp.isFeatured ? '⭐ Featured' : '';

      logger.info(`   ${index + 1}. ${exp.title}`);
      logger.info(`      Slug: ${exp.slug}`);
      logger.info(`      Type: ${exp.type}`);
      logger.info(`      Status: ${status} ${featured}`);
      logger.info(`      Icon: ${exp.icon}`);
      logger.info(`      Sort Order: ${exp.sortOrder}`);
      logger.info('');
    });

    // Expected experiences
    const expectedExperiences = [
      'sample-trial',
      '60-min-delivery',
      'luxury',
      'organic',
      'men',
      'women',
      'children',
      'rental',
      'gifting',
    ];

    const foundExperiences = experiences.map((e) => e.slug);
    const missingExperiences = expectedExperiences.filter((slug) => !foundExperiences.includes(slug));

    if (missingExperiences.length > 0) {
      log.warning(`Missing experiences: ${missingExperiences.join(', ')}`);
      return false;
    }

    log.success('All expected experiences are present');
    return true;
  } catch (error: any) {
    log.error(`Error checking store experiences: ${error.message}`);
    return false;
  }
}

// Check Home Services
async function checkHomeServices() {
  log.header('Checking Home Services (HomeServicesSection)');

  try {
    // Check for parent "Home Services" category
    const homeServicesCategory = await ServiceCategory.findOne({ slug: 'home-services' });

    if (!homeServicesCategory) {
      log.warning('Home Services parent category not found');
      return false;
    }

    // Get child categories
    const childCategories = await ServiceCategory.find({
      parentCategory: homeServicesCategory._id,
    }).lean();

    const totalCategories = childCategories.length;

    logger.info(`\n📊 Home Services Statistics:`);
    logger.info(`   Parent Category: ${homeServicesCategory.name}`);
    logger.info(`   Child Categories: ${totalCategories}`);

    if (childCategories.length === 0) {
      log.warning('No home service categories found');
      return false;
    }

    logger.info(`\n📋 Service Categories List:`);
    childCategories.forEach((cat, index) => {
      const status = cat.isActive ? '✅ Active' : '❌ Inactive';
      const serviceCount = cat.serviceCount || 0;

      logger.info(`   ${index + 1}. ${cat.name}`);
      logger.info(`      Slug: ${cat.slug}`);
      logger.info(`      Icon: ${cat.icon}`);
      logger.info(`      Status: ${status}`);
      logger.info(`      Services: ${serviceCount}`);
      logger.info(`      Cashback: ${cat.cashbackPercentage}%`);
      logger.info('');
    });

    // Expected categories
    const expectedCategories = ['repair', 'cleaning', 'painting', 'carpentry', 'plumbing', 'electrical'];

    const foundCategories = childCategories.map((c) => c.slug);
    const missingCategories = expectedCategories.filter((slug) => !foundCategories.includes(slug));

    if (missingCategories.length > 0) {
      log.warning(`Missing categories: ${missingCategories.join(', ')}`);
      return false;
    }

    log.success('All expected home service categories are present');
    return true;
  } catch (error: any) {
    log.error(`Error checking home services: ${error.message}`);
    return false;
  }
}

// Main function
async function main(): Promise<void> {
  try {
    log.header('Homepage Data Checker');
    log.info('Verifying all homepage sections have proper data...\n');

    // Connect to database
    await connectScriptDb();
    log.success('Connected to MongoDB');

    // Check each section
    const campaignsOk = await checkCampaigns();
    const experiencesOk = await checkStoreExperiences();
    const homeServicesOk = await checkHomeServices();

    // Summary
    log.header('Summary');
    logger.info('\nResults:');
    logger.info('┌─────────────────────────────┬──────────┐');
    logger.info('│ Section                     │ Status   │');
    logger.info('├─────────────────────────────┼──────────┤');
    logger.info(`│ Campaigns                   │ ${campaignsOk ? '✅ OK' : '❌ FAIL'}     │`);
    logger.info(`│ Store Experiences           │ ${experiencesOk ? '✅ OK' : '❌ FAIL'}     │`);
    logger.info(`│ Home Services               │ ${homeServicesOk ? '✅ OK' : '❌ FAIL'}     │`);
    logger.info('└─────────────────────────────┴──────────┘');

    const allOk = campaignsOk && experiencesOk && homeServicesOk;

    if (allOk) {
      log.success('\n✅ All homepage sections have proper data!');
      log.success('🎉 Homepage is production ready!');
    } else {
      log.warning('\n⚠️  Some sections are missing data.');
      log.info('💡 Run the seed scripts to populate missing data:');
      log.info('   - npx ts-node src/scripts/seedCampaigns.ts');
      log.info('   - npx ts-node src/seeds/homepageSeeds.ts');
      log.info('   - npx ts-node src/scripts/seedHomeServices.ts');
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log.error('Check failed: ' + errorMessage);
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
