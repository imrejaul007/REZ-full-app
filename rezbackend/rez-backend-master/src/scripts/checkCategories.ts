/**
 * Check Categories Script
 * Connects to MongoDB and reports which categories exist vs what the frontend expects.
 * Run: npx ts-node src/scripts/checkCategories.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'test';

// All slugs the frontend expects (from categoryConfig.ts)
const EXPECTED_MAIN_CATEGORIES = [
  'food-dining',
  'grocery-essentials',
  'beauty-wellness',
  'healthcare',
  'fashion',
  'fitness-sports',
  'education-learning',
  'home-services',
  'travel-experiences',
  'entertainment',
  'financial-lifestyle',
  'electronics',
];

const EXPECTED_SUBCATEGORIES: Record<string, string[]> = {
  'food-dining': [
    'cafes',
    'qsr-fast-food',
    'family-restaurants',
    'fine-dining',
    'ice-cream-dessert',
    'bakery-confectionery',
    'cloud-kitchens',
    'street-food',
  ],
  'grocery-essentials': [
    'supermarkets',
    'kirana-stores',
    'fresh-vegetables',
    'meat-fish',
    'dairy',
    'packaged-goods',
    'water-cans',
  ],
  'beauty-wellness': [
    'salons',
    'spa-massage',
    'beauty-services',
    'cosmetology',
    'dermatology',
    'skincare-cosmetics',
    'nail-studios',
    'grooming-men',
  ],
  healthcare: ['pharmacy', 'clinics', 'diagnostics', 'dental', 'physiotherapy', 'home-nursing', 'vision-eyewear'],
  fashion: ['footwear', 'bags-accessories', 'mobile-accessories', 'watches', 'jewelry', 'local-brands'],
  'fitness-sports': ['gyms', 'crossfit', 'yoga', 'zumba', 'martial-arts', 'sports-academies', 'sportswear'],
  'education-learning': [
    'coaching-centers',
    'skill-development',
    'music-dance-classes',
    'art-craft',
    'vocational',
    'language-training',
  ],
  'home-services': [
    'ac-repair',
    'plumbing',
    'electrical',
    'cleaning',
    'pest-control',
    'house-shifting',
    'laundry-dry-cleaning',
    'home-tutors',
  ],
  'travel-experiences': [
    'hotels',
    'intercity-travel',
    'taxis',
    'bike-rentals',
    'weekend-getaways',
    'tours',
    'activities',
  ],
  entertainment: [
    'movies',
    'live-events',
    'festivals',
    'workshops',
    'amusement-parks',
    'gaming-cafes',
    'vr-ar-experiences',
  ],
  'financial-lifestyle': [
    'bill-payments',
    'mobile-recharge',
    'broadband',
    'cable-ott',
    'insurance',
    'gold-savings',
    'donations',
  ],
  electronics: [
    'mobile-phones',
    'laptops',
    'televisions',
    'cameras',
    'audio-headphones',
    'gaming',
    'accessories',
    'smartwatches',
  ],
};

async function checkCategories() {
  try {
    logger.info('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    logger.info('✅ Connected\n');

    const db = mongoose.connection.db!;
    const col = db.collection('categories');

    // 1. Total count
    const total = await col.countDocuments({});
    const mainCount = await col.countDocuments({ parentCategory: null });
    const subCount = await col.countDocuments({ parentCategory: { $ne: null } });

    logger.info('========================================');
    logger.info('📊 CURRENT DATABASE STATE');
    logger.info('========================================');
    logger.info(`Total categories in DB: ${total}`);
    logger.info(`  Main categories: ${mainCount}`);
    logger.info(`  Subcategories: ${subCount}`);
    logger.info('========================================\n');

    // 2. List all main categories in DB
    const mainCats = await col.find({ parentCategory: null }).sort({ sortOrder: 1 }).toArray();
    logger.info('📦 MAIN CATEGORIES IN DB:');
    if (mainCats.length === 0) {
      logger.info('  (none found)');
    }
    for (const cat of mainCats) {
      logger.info(`  ✅ ${cat.name} (slug: ${cat.slug}, active: ${cat.isActive})`);
    }
    logger.info('');

    // 3. Check which expected main categories are missing
    const existingMainSlugs = new Set(mainCats.map((c) => c.slug));
    const missingMain = EXPECTED_MAIN_CATEGORIES.filter((s) => !existingMainSlugs.has(s));
    const extraMain = mainCats.filter((c) => !EXPECTED_MAIN_CATEGORIES.includes(c.slug));

    logger.info('========================================');
    logger.info('🔍 MAIN CATEGORY COMPARISON');
    logger.info('========================================');
    logger.info(`Expected: ${EXPECTED_MAIN_CATEGORIES.length}`);
    logger.info(`Found in DB: ${mainCats.length}`);
    if (missingMain.length > 0) {
      logger.info(`\n❌ MISSING from DB (${missingMain.length}):`);
      for (const slug of missingMain) {
        logger.info(`  - ${slug}`);
      }
    } else {
      logger.info('\n✅ All expected main categories exist!');
    }
    if (extraMain.length > 0) {
      logger.info(`\n⚠️ EXTRA in DB (not in frontend config): ${extraMain.length}`);
      for (const cat of extraMain) {
        logger.info(`  - ${cat.slug} (${cat.name})`);
      }
    }
    logger.info('');

    // 4. Check subcategories
    const allExpectedSubSlugs: string[] = [];
    for (const subs of Object.values(EXPECTED_SUBCATEGORIES)) {
      allExpectedSubSlugs.push(...subs);
    }

    const allSubCats = await col.find({ parentCategory: { $ne: null } }).toArray();
    const existingSubSlugs = new Set(allSubCats.map((c) => c.slug));
    const missingSubs = allExpectedSubSlugs.filter((s) => !existingSubSlugs.has(s));

    logger.info('========================================');
    logger.info('🔍 SUBCATEGORY COMPARISON');
    logger.info('========================================');
    logger.info(`Expected: ${allExpectedSubSlugs.length}`);
    logger.info(`Found in DB: ${allSubCats.length}`);
    if (missingSubs.length > 0) {
      logger.info(`\n❌ MISSING from DB (${missingSubs.length}):`);
      for (const slug of missingSubs) {
        // Find which parent this belongs to
        const parent = Object.entries(EXPECTED_SUBCATEGORIES).find(([, subs]) => subs.includes(slug));
        logger.info(`  - ${slug} (parent: ${parent?.[0] || 'unknown'})`);
      }
    } else {
      logger.info('\n✅ All expected subcategories exist!');
    }
    logger.info('');

    // 5. Per-parent breakdown of missing subcategories
    if (missingSubs.length > 0) {
      logger.info('========================================');
      logger.info('📋 MISSING BY PARENT CATEGORY');
      logger.info('========================================');
      for (const [parentSlug, expectedSubs] of Object.entries(EXPECTED_SUBCATEGORIES)) {
        const missing = expectedSubs.filter((s) => !existingSubSlugs.has(s));
        if (missing.length > 0) {
          logger.info(`\n  ${parentSlug} (${missing.length} missing):`);
          for (const s of missing) {
            logger.info(`    - ${s}`);
          }
        }
      }
      logger.info('');
    }

    // 6. Summary
    logger.info('========================================');
    logger.info('📊 SUMMARY');
    logger.info('========================================');
    const totalMissing = missingMain.length + missingSubs.length;
    if (totalMissing === 0) {
      logger.info('✅ All categories are in sync! No seeding needed.');
    } else {
      logger.info(`❌ ${totalMissing} categories need to be seeded:`);
      logger.info(`   - ${missingMain.length} main categories`);
      logger.info(`   - ${missingSubs.length} subcategories`);
      logger.info('\nRun: npx ts-node src/scripts/seedCompleteCategories.ts');
    }
    logger.info('========================================\n');
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('🔌 Disconnected from MongoDB');
  }
}

checkCategories();
