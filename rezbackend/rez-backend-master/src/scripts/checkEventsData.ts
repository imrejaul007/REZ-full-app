/**
 * Check Events Data for Region/Currency
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../config/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkEvents() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const db = mongoose.connection.db;

  logger.info('=== Event Count ===');
  const total = await db!.collection('events').countDocuments();
  logger.info(`Total events: ${total}`);

  logger.info('\n=== Events by City ===');
  const cityDist = await db!
    .collection('events')
    .aggregate([{ $group: { _id: '$location.city', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  cityDist.forEach((c) => console.log(`  ${c._id || 'null'}: ${c.count}`));

  logger.info('\n=== Events by Currency ===');
  const currDist = await db!
    .collection('events')
    .aggregate([{ $group: { _id: '$price.currency', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  currDist.forEach((c) => console.log(`  ${c._id || 'null'}: ${c.count}`));

  logger.info('\n=== Events by Category ===');
  const catDist = await db!
    .collection('events')
    .aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  catDist.forEach((c) => console.log(`  ${c._id || 'null'}: ${c.count}`));

  logger.info('\n=== Sample Events ===');
  const samples = await db!
    .collection('events')
    .find({})
    .limit(5)
    .project({
      title: 1,
      'location.city': 1,
      'price.currency': 1,
      'price.amount': 1,
      category: 1,
    })
    .toArray();
  samples.forEach((e) =>
    console.log(
      `  ${e.title} | ${e.location?.city || 'no city'} | ${e.price?.currency || '?'}${e.price?.amount} | ${e.category}`,
    ),
  );

  await mongoose.disconnect();
  logger.info('\nDone.');
}

checkEvents().catch((err) => { console.error(err); process.exit(1); }); // D19: fail loud so CI catches broken seeds
