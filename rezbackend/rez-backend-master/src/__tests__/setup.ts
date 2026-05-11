import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Set env vars before any module imports so jwt/redis/etc use them
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-sufficiently-long-test-jwt-secret-32chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'a-sufficiently-long-test-refresh-secret-32chars!!';
process.env.JWT_MERCHANT_SECRET =
  process.env.JWT_MERCHANT_SECRET || 'a-sufficiently-long-test-merchant-secret-32chars!!';
process.env.JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'a-sufficiently-long-test-admin-secret-32chars!!';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-internal-token';
// 32-byte hex key required by encryption.ts for PII protection
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
// Razorpay test credentials (mocked in tests, but needed to pass config validation at module load)
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_key_id';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_key_secret';

let mongoServer: MongoMemoryServer | MongoMemoryReplSet | undefined;

// Setup before all tests.
// By default uses MongoMemoryServer (fast, ~1s startup).
// Set TEST_USE_REPLICA_SET=true to use MongoMemoryReplSet (enables transactions,
// but slower — ~10-30s startup for primary election).
beforeAll(async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      const useReplSet = process.env.TEST_USE_REPLICA_SET === 'true';

      if (useReplSet) {
        const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        mongoServer = replSet;
        const mongoUri = replSet.getUri();
        await mongoose.connect(mongoUri);

        // Pre-warm core collections so their indexes exist before any test uses
        // MongoDB transactions (catalog changes during a tx cause "unable to write" errors)
        const db = mongoose.connection.db;
        if (db) {
          const coreCols = [
            'orders',
            'products',
            'users',
            'wallets',
            'merchants',
            'cointransactions',
            'coinledgers',
            'coinexchangerates',
            'transactionauditlogs',
          ];
          await Promise.all(
            coreCols.map((col) =>
              db.createCollection(col).catch(() => {
                /* already exists */
              }),
            ),
          );
        }
        console.log('✅ Test database connected (replica set — transactions enabled)');
      } else {
        const server = await MongoMemoryServer.create({ instance: { startupTimeout: 60000 } });
        mongoServer = server;
        const mongoUri = server.getUri();
        await mongoose.connect(mongoUri);
        console.log('✅ Test database connected');
      }
    } else {
      console.log('ℹ️  Test database already connected, reusing connection');
    }
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
}, 120000);

// Cleanup after each test
afterEach(async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
}, 120000);

// Cleanup after all tests
afterAll(async () => {
  try {
    if (mongoServer) {
      await Promise.race([
        (async () => {
          await mongoose.disconnect();
          await mongoServer!.stop();
          console.log('✅ Test database disconnected');
        })(),
        new Promise<void>((resolve) => setTimeout(resolve, 15000)),
      ]);
    }
  } catch (error) {
    console.error('❌ Test database disconnection failed:', error);
  }
}, 20000);

// Global test timeout
jest.setTimeout(60000);
