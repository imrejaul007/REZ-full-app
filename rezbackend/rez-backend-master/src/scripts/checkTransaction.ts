// Quick script to check transaction structure
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.DB_NAME || 'test';

async function check() {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  const db = mongoose.connection.db;

  if (!db) {
    logger.info('No DB connection');
    process.exit(1);
  }

  // Get a sample transaction to see the structure
  const transaction = await db.collection('transactions').findOne({
    'source.metadata.storeInfo': { $exists: true },
  });

  logger.info('Sample transaction source.metadata:');
  logger.info(JSON.stringify(transaction?.source?.metadata, null, 2));
  logger.info('\nStore ID in transaction:', transaction?.source?.metadata?.storeInfo?.id);
  logger.info('Type of storeId:', typeof transaction?.source?.metadata?.storeInfo?.id);

  // Try the exact query that the controller uses
  const storeId = '6937bc52bbdcc28f8cc26e63';
  logger.info('\n--- Testing controller query ---');
  logger.info('Looking for storeId:', storeId);

  const results = await db
    .collection('transactions')
    .find({
      'source.metadata.storeInfo.id': storeId,
      'status.current': 'completed',
      category: { $in: ['spending', 'paybill', 'cashback', 'earning'] },
    })
    .limit(5)
    .toArray();

  logger.info('Results found:', results.length);

  if (results.length === 0) {
    // Try without the category filter
    const results2 = await db
      .collection('transactions')
      .find({
        'source.metadata.storeInfo.id': storeId,
      })
      .limit(5)
      .toArray();
    logger.info('\nWithout category filter:', results2.length);

    // Try without any filter except storeInfo.id
    const results3 = await db
      .collection('transactions')
      .find({
        'source.metadata.storeInfo.id': storeId,
      })
      .limit(5)
      .toArray();
    logger.info('Just storeInfo.id:', results3.length);

    // Check all transactions with storeInfo
    const allWithStore = await db
      .collection('transactions')
      .find({
        'source.metadata.storeInfo': { $exists: true },
      })
      .limit(10)
      .toArray();
    logger.info('\nAll transactions with storeInfo:', allWithStore.length);
    allWithStore.forEach((t: any, i: number) => {
      logger.info(
        `  ${i + 1}. Store ID: ${t.source?.metadata?.storeInfo?.id}, category: ${t.category}, status: ${t.status?.current}`,
      );
    });
  }

  await mongoose.disconnect();
  process.exit(0);
}

check().catch((err) => { console.error(err); process.exit(1); }); // D19: fail loud so CI catches broken seeds
