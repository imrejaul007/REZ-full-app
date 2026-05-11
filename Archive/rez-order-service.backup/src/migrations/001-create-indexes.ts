/**
 * Database Index Migration Script
 *
 * Creates performance indexes for optimal query performance.
 * Run once during deployment or manually.
 *
 * Usage:
 *   npx ts-node src/migrations/001-create-indexes.ts
 *
 * IMPORTANT: These indexes should be created in MongoDB directly,
 * not via autoIndex which causes issues in production.
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-order';

interface IndexDefinition {
  collection: string;
  index: Record<string, 1 | -1>;
  name: string;
  options?: Record<string, unknown>;
}

// Performance indexes for order service
const INDEXES: IndexDefinition[] = [
  // Orders collection
  {
    collection: 'orders',
    index: { user: 1, createdAt: -1 },
    name: 'idx_orders_user_createdAt',
  },
  {
    collection: 'orders',
    index: { merchant: 1, createdAt: -1 },
    name: 'idx_orders_merchant_createdAt',
  },
  {
    collection: 'orders',
    index: { merchant: 1, status: 1 },
    name: 'idx_orders_merchant_status',
  },
  {
    collection: 'orders',
    index: { user: 1, status: 1 },
    name: 'idx_orders_user_status',
  },
  {
    collection: 'orders',
    index: { clientIdempotencyKey: 1 },
    name: 'idx_orders_idempotency',
    options: { unique: true },
  },
  {
    collection: 'orders',
    index: { createdAt: -1 },
    name: 'idx_orders_createdAt',
  },
];

async function createIndexes(): Promise<void> {
  console.log('Starting database index creation...');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    for (const idx of INDEXES) {
      const collection = db.collection(idx.collection);
      try {
        await collection.createIndex(idx.index, {
          name: idx.name,
          background: true,
          ...idx.options,
        });
        console.log(`✓ Created index: ${idx.name} on ${idx.collection}`);
      } catch (err: any) {
        if (err.code === 85 || err.code === 86) {
          // Index already exists with different options
          console.log(`⚠ Index ${idx.name} already exists with different options`);
        } else if (err.code === 68) {
          // Index already exists
          console.log(`✓ Index ${idx.name} already exists`);
        } else {
          throw err;
        }
      }
    }

    console.log('\nIndex creation complete!');
    console.log('\nVerifying indexes...');

    for (const idx of INDEXES) {
      const collection = db.collection(idx.collection);
      const indexes = await collection.indexes();
      const found = indexes.find(i => i.name === idx.name);
      if (found) {
        console.log(`✓ Verified: ${idx.name}`);
      } else {
        console.log(`✗ Missing: ${idx.name}`);
      }
    }
  } catch (err) {
    console.error('Error creating indexes:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createIndexes();
