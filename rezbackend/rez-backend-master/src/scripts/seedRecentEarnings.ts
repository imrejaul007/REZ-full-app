// Seed script for "People are earning here" section
// Run: npx ts-node src/scripts/seedRecentEarnings.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

// Sample user names for seeding
const SAMPLE_USERS = [
  { firstName: 'Amit', lastName: 'Kumar' },
  { firstName: 'Priya', lastName: 'Sharma' },
  { firstName: 'Rahul', lastName: 'Verma' },
  { firstName: 'Sneha', lastName: 'Gupta' },
  { firstName: 'Vikram', lastName: 'Singh' },
  { firstName: 'Anjali', lastName: 'Patel' },
  { firstName: 'Arjun', lastName: 'Reddy' },
  { firstName: 'Kavya', lastName: 'Nair' },
];

async function seedRecentEarnings() {
  try {
    logger.info('🔌 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Get all stores
    const stores = await db.collection('stores').find({ isActive: true }).limit(10).toArray();
    logger.info(`📦 Found ${stores.length} stores`);

    if (stores.length === 0) {
      logger.info('❌ No stores found. Please seed stores first.');
      process.exit(1);
    }

    // Get or create sample users
    const usersCollection = db.collection('users');
    const transactionsCollection = db.collection('transactions');

    let createdUsers: any[] = [];

    // First, try to get existing users from the database
    const existingUsers = await usersCollection.find({}).limit(10).toArray();

    if (existingUsers.length > 0) {
      logger.info(`👤 Using ${existingUsers.length} existing users from database`);
      createdUsers = existingUsers;
    } else {
      // Only create users if none exist
      for (const userData of SAMPLE_USERS) {
        try {
          const phoneNumber = `+91${Math.floor(9000000000 + Math.random() * 999999999)}`;
          const result = await usersCollection.insertOne({
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: `${userData.firstName} ${userData.lastName}`,
            email: `${userData.firstName.toLowerCase()}${Date.now()}@example.com`,
            phoneNumber: phoneNumber,
            phone: phoneNumber,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          const user = { _id: result.insertedId, ...userData };
          createdUsers.push(user);
          logger.info(`👤 Created user: ${userData.firstName}`);
        } catch (err: any) {
          // Skip if user creation fails (e.g., duplicate)
          logger.info(`⚠️ Skipped creating user: ${userData.firstName} (${err.message})`);
        }
      }
    }

    // Create sample transactions for each store
    const transactionsToInsert: any[] = [];
    const now = new Date();

    for (const store of stores) {
      // Create 3-5 random transactions per store
      const numTransactions = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < numTransactions; i++) {
        const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const amount = 50 + Math.floor(Math.random() * 450); // ₹50 - ₹500
        const coinsEarned = Math.round(amount * 0.05);

        // Random time in last 7 days
        const hoursAgo = Math.floor(Math.random() * 168); // 0-168 hours (7 days)
        const transactionDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

        // Generate unique transaction ID
        const transactionId = `TXN_SEED_${store._id.toString().slice(-6)}_${randomUser._id.toString().slice(-6)}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        transactionsToInsert.push({
          transactionId: transactionId,
          user: randomUser._id,
          amount: amount,
          type: 'credit',
          category: 'earning',
          description: `Earned at ${store.name}`,
          source: {
            type: 'order', // Valid enum value
            reference: store._id, // Required field - using store as reference
            description: `Purchase at ${store.name}`,
            metadata: {
              storeInfo: {
                id: store._id, // Store as ObjectId, not string
                name: store.name,
              },
              orderValue: amount,
              coinsEarned: coinsEarned,
            },
          },
          balanceBefore: 0,
          balanceAfter: coinsEarned,
          isReversible: false,
          status: {
            current: 'completed',
            history: [
              {
                status: 'completed',
                timestamp: transactionDate,
              },
            ],
          },
          createdAt: transactionDate,
          updatedAt: transactionDate,
        });
      }
    }

    // Insert transactions
    if (transactionsToInsert.length > 0) {
      const result = await transactionsCollection.insertMany(transactionsToInsert);
      logger.info(`💰 Created ${result.insertedCount} transactions`);
    }

    logger.info('✅ Seeding completed successfully!');
    logger.info('\n📊 Summary:');
    logger.info(`   - Users: ${createdUsers.length}`);
    logger.info(`   - Transactions: ${transactionsToInsert.length}`);
    logger.info(`   - Stores: ${stores.length}`);
  } catch (error) {
    logger.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await disconnectDb();
    logger.info('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedRecentEarnings();
