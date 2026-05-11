import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../config/logger';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI!, { dbName: process.env.DB_NAME || 'test' });
  const db = mongoose.connection.db!;
  const Store = db.collection('stores');
  const Category = db.collection('categories');

  // Get food-dining and its children
  const foodDining = await Category.findOne({ slug: 'food-dining', parentCategory: null });
  logger.info('food-dining _id:', foodDining?._id);

  // Check sample stores to see category field type
  const sampleStore = await Store.findOne({ 'serviceCapabilities.homeDelivery.enabled': true });
  logger.info('\nSample store name:', sampleStore?.name);
  logger.info('Sample store category:', sampleStore?.category, 'type:', typeof sampleStore?.category);

  // Find which category that store belongs to
  if (sampleStore?.category) {
    const storeCat = await Category.findOne({ _id: sampleStore.category });
    logger.info('Store cat:', storeCat?.slug, 'parentCategory:', storeCat?.parentCategory);

    if (storeCat?.parentCategory) {
      const parent = await Category.findOne({ _id: storeCat.parentCategory });
      logger.info('Parent cat:', parent?.slug, 'parentCategory:', parent?.parentCategory);
      if (parent?.parentCategory) {
        const grandparent = await Category.findOne({ _id: parent.parentCategory });
        logger.info('Grandparent cat:', grandparent?.slug);
      }
    }
  }

  // Get food-dining subcategory IDs
  const foodSubs = await Category.find({ parentCategory: foodDining?._id }).toArray();
  logger.info('\nFood-dining direct children:', foodSubs.length);
  logger.info('  slugs:', foodSubs.map((c) => c.slug).join(', '));

  // Also check grandchildren
  const foodSubIds = foodSubs.map((c) => c._id);
  const foodGrandSubs = await Category.find({ parentCategory: { $in: foodSubIds } }).toArray();
  logger.info('Food-dining grandchildren:', foodGrandSubs.length);

  // Count stores in ALL descendants
  const allDescendantIds = [...foodSubIds, ...foodGrandSubs.map((c) => c._id)];
  const storesInDescendants = await Store.countDocuments({ category: { $in: allDescendantIds } });
  logger.info('Stores in all food descendants:', storesInDescendants);

  // Check top category assignments
  logger.info('\n=== TOP STORE CATEGORY ASSIGNMENTS ===');
  const catGroups = await Store.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]).toArray();

  for (const g of catGroups) {
    if (!g._id) {
      logger.info(`  NULL category: ${g.count} stores`);
      continue;
    }
    const cat = await Category.findOne({ _id: g._id });
    if (cat) {
      let parentSlug = 'ROOT';
      if (cat.parentCategory) {
        const parent = await Category.findOne({ _id: cat.parentCategory });
        parentSlug = parent?.slug || 'unknown';
        if (parent?.parentCategory) {
          const gp = await Category.findOne({ _id: parent.parentCategory });
          parentSlug = (gp?.slug || '?') + ' > ' + parentSlug;
        }
      }
      logger.info(`  ${cat.slug} (parent: ${parentSlug}): ${g.count} stores`);
    } else {
      logger.info(`  MISSING CAT ${g._id}: ${g.count} stores`);
    }
  }

  // Check if stores use string category
  const stringCatCount = await Store.countDocuments({ category: { $type: 'string' } });
  logger.info('\nStores with string category type:', stringCatCount);

  await mongoose.disconnect();
  logger.info('\nDone.');
}
check().catch((e) => {
  console.error(e);
  process.exit(1);
});
