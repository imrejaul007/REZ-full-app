import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function checkData() {
  logger.info('Connecting to MongoDB...');
  await connectScriptDb();
  logger.info('Connected!');

  const db = mongoose.connection.db!;

  // Check categories with 'street' in slug
  const categories = await db
    .collection('categories')
    .find({ slug: { $regex: 'street', $options: 'i' } })
    .toArray();
  logger.info('\n=== Categories with "street" in slug ===');
  logger.info('Count:', categories.length);
  categories.forEach((c) => console.log('  -', c.slug, '|', c.name, '|', c._id));

  // Check stores with subcategorySlug = street-food
  const streetFoodStores = await db.collection('stores').find({ subcategorySlug: 'street-food' }).toArray();
  logger.info('\n=== Stores with subcategorySlug="street-food" ===');
  logger.info('Count:', streetFoodStores.length);
  streetFoodStores.forEach((s) => console.log('  -', s.name, '|', s._id));

  // Check all unique subcategorySlug values in stores
  const allStores = await db.collection('stores').find({}).project({ subcategorySlug: 1, name: 1 }).toArray();
  const uniqueSlugs = [...new Set(allStores.map((s) => s.subcategorySlug).filter(Boolean))];
  logger.info('\n=== All unique subcategorySlug values in stores ===');
  logger.info('Count:', uniqueSlugs.length);
  logger.info(uniqueSlugs);

  // Check food-dining related stores
  const foodStores = await db
    .collection('stores')
    .find({
      subcategorySlug: {
        $in: [
          'cafes',
          'qsr-fast-food',
          'family-restaurants',
          'fine-dining',
          'ice-cream-dessert',
          'bakery-confectionery',
          'cloud-kitchens',
          'street-food',
        ],
      },
    })
    .project({ name: 1, subcategorySlug: 1 })
    .toArray();
  logger.info('\n=== Food & Dining stores ===');
  logger.info('Count:', foodStores.length);
  foodStores.forEach((s) => console.log('  -', s.subcategorySlug, '|', s.name));

  // Check products count per store
  const productsByStore = await db
    .collection('products')
    .aggregate([{ $group: { _id: '$store', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }])
    .toArray();
  logger.info('\n=== Top 10 stores by product count ===');
  for (const p of productsByStore) {
    const store = await db.collection('stores').findOne({ _id: p._id });
    logger.info('  -', store?.name || 'Unknown', '|', store?.subcategorySlug || 'no-slug', '| products:', p.count);
  }

  await disconnectDb();
  logger.info('\nDone!');
}

checkData().catch((err) => { console.error(err); process.exit(1); }); // D19: fail loud so CI catches broken seeds
