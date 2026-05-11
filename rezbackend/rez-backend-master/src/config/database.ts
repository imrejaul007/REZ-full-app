// @ts-nocheck
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from './logger';

// Ensure dotenv is loaded
dotenv.config();
// MongoDB connection configuration
export interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

// Default database configuration - SCALEPILOT OPTIMIZED
//
// POOL SIZING GUIDE:
//   Render free tier (512 MB RAM, 1 shared CPU):
//     MONGO_MAX_POOL_SIZE=10  — avoids OOM; free tier handles ~20-30 req/s
//   Render Starter ($7/mo, 1 CPU):
//     MONGO_MAX_POOL_SIZE=25  — current default; handles ~80-100 req/s
//   Production / Atlas M10+ (multi-pod):
//     MONGO_MAX_POOL_SIZE=50  — per pod; at 4 pods = 200 connections (within Atlas M10 500-conn limit)
//   Atlas M30+ high throughput:
//     MONGO_MAX_POOL_SIZE=100 — per pod; keep pod count × pool ≤ 80% of Atlas connection limit
//
// FORMULA: pods × MONGO_MAX_POOL_SIZE < (Atlas tier connection limit × 0.8)
// Set via env var so no code change is needed between tiers.
const defaultConfig: DatabaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-app',
  options: {
    // Connection pool settings for production scale
    // Default 25 is safe for a single Render Starter pod.
    // For Render free tier set MONGO_MAX_POOL_SIZE=10.
    // For production multi-pod deployments set MONGO_MAX_POOL_SIZE=50-100 (see guide above).
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '25', 10),
    minPoolSize: 5, // Keep 5 connections warm
    maxIdleTimeMS: 30000, // Close idle connections after 30s
    serverSelectionTimeoutMS: 5000, // Fail fast if no server
    socketTimeoutMS: 45000, // Close socket after 45s inactivity
    connectTimeoutMS: 10000, // Give up connecting after 10 seconds
    heartbeatFrequencyMS: 10000, // Check connection every 10s

    // Write concern for data safety
    w: 'majority', // Wait for majority of replica set
    wtimeoutMS: 5000, // Fail write after 5s
    journal: true, // Write to journal for durability

    // Read preference for scalability
    // ISSUE-61 FIX: primaryPreferred required — secondaryPreferred breaks ALL
    // MongoDB multi-document transactions on Atlas replica sets because Atlas
    // pins transactions to the primary and rejects reads routed to a secondary
    // mid-transaction with a "read preference in a transaction must be primary" error.
    readPreference: 'primaryPreferred' as any, // Reads go to primary; fall back to secondary only when primary is unreachable
    readPreferenceTags: [{}] as any, // Allow any replica

    // Connection options
    retryWrites: true, // Retry write operations
    retryReads: true, // Retry read operations
    family: 4, // Use IPv4, skip trying IPv6
    compressors: ['snappy', 'zlib'], // Compress data over wire

    // IDX-1: Disable autoIndex in production.
    //   Default is autoIndex: true, which means every pod on boot calls
    //   ensureIndex() against every model's schema. Consequences on scale:
    //     - pod startup stalls while rebuilding indexes on large collections
    //     - collection-level write locks during index builds
    //     - N pods × M models = redundant work
    //   In dev/staging we keep autoIndex on for convenience; in prod, index
    //   creation is handled once via the scripts/ensureIndexes migration.
    autoIndex: process.env.NODE_ENV !== 'production',
    autoCreate: process.env.NODE_ENV !== 'production',

    // Deprecated options removed in mongoose 7+
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false,
    // useCreateIndex: true,
  },
};

// Database connection class
export class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  // Singleton pattern
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Connect to MongoDB
  public async connect(config: DatabaseConfig = defaultConfig): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      // Add database name to options if specified in environment
      const dbName = process.env.DB_NAME || 'rez-app';
      const connectOptions = { ...config.options, dbName };

      // Connect to MongoDB
      await mongoose.connect(config.uri, connectOptions);
      this.isConnected = true;

      logger.info(`✅ MongoDB connected successfully to database: ${dbName}`);

      // Set up connection event listeners
      this.setupEventListeners();

      // Set up slow query monitoring
      this.setupQueryMonitoring();
    } catch (error) {
      logger.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  // Disconnect from MongoDB
  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.info('Database not connected');
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('📤 MongoDB disconnected');
    } catch (error) {
      logger.error('❌ MongoDB disconnection error:', error);
    }
  }

  // Check connection status
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  // Get connection statistics
  public getConnectionStats() {
    const connection = mongoose.connection;
    return {
      readyState: this.getReadyStateText(connection.readyState),
      host: connection.host,
      port: connection.port,
      name: connection.name,
      collections: Object.keys(connection.collections).length,
      models: Object.keys(mongoose.models).length,
    };
  }

  // Setup event listeners for connection monitoring
  private setupEventListeners(): void {
    const connection = mongoose.connection;

    connection.on('connected', () => {
      logger.info('🔗 Mongoose connected to MongoDB');
    });

    connection.on('error', (error) => {
      logger.error('❌ Mongoose connection error:', error);
    });

    connection.on('disconnected', () => {
      logger.info('📤 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    connection.on('reconnected', () => {
      logger.info('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Note: SIGINT/SIGTERM handlers are in server.ts (single source of truth for graceful shutdown)
    // Database disconnection is handled by server.ts shutdown sequence.
  }

  // Convert readyState number to text
  private getReadyStateText(state: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
    };
    return states[state as keyof typeof states] || 'unknown';
  }

  // Monitor slow queries and log warnings
  private setupQueryMonitoring(): void {
    const SLOW_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '100', 10);
    const originalExec = mongoose.Query.prototype.exec;

    (mongoose.Query.prototype as any).exec = async function (this: any) {
      const start = Date.now();
      const collection = this.model?.collection?.name || 'unknown';
      const op = this.op || 'unknown';

      try {
        const result = await originalExec.call(this);
        const duration = Date.now() - start;

        if (duration > SLOW_MS) {
          const filter = JSON.stringify(this.getFilter?.() || {}).substring(0, 200);
          logger.warn('[SLOW QUERY]', { collection, op, duration_ms: duration, filter });
        }
        return result;
      } catch (error) {
        logger.error('[QUERY ERROR]', { collection, op, error: (error as Error).message });
        throw error;
      }
    } as any;

    logger.info(`Query monitoring enabled (threshold: ${SLOW_MS}ms)`);
  }

  // Create database indexes (for production optimization)
  public async createIndexes(): Promise<void> {
    try {
      logger.info('🔍 Creating database indexes...');

      // This would typically be done automatically by Mongoose,
      // but we can force index creation here for production deployments
      const collections = (await mongoose.connection.db?.collections()) || [];

      for (const collection of collections) {
        try {
          await collection.createIndexes([]);
          logger.info(`✅ Indexes created for ${collection.collectionName}`);
        } catch (indexError) {
          logger.warn(`⚠️ Index creation warning for ${collection.collectionName}:`, indexError);
        }
      }

      logger.info('✅ Database indexes creation completed');
    } catch (error) {
      logger.error('❌ Error creating database indexes:', error);
    }
  }

  // Database health check
  public async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const connection = mongoose.connection;

      if (connection.readyState !== 1) {
        return {
          status: 'unhealthy',
          details: {
            readyState: this.getReadyStateText(connection.readyState),
            error: 'Not connected to database',
          },
        };
      }

      // Test database operation
      const testResult = await connection.db?.admin().ping();

      return {
        status: 'healthy',
        details: {
          readyState: this.getReadyStateText(connection.readyState),
          host: connection.host,
          port: connection.port,
          database: connection.name,
          collections: Object.keys(connection.collections).length,
          models: Object.keys(mongoose.models).length,
          ping: testResult,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          readyState: mongoose.connection.readyState,
        },
      };
    }
  }

  // Clear all collections (for testing/development)
  public async clearDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear database in production environment');
    }

    try {
      const collections = (await mongoose.connection.db?.collections()) || [];

      for (const collection of collections) {
        await collection.deleteMany({});
        logger.info(`🗑️ Cleared collection: ${collection.collectionName}`);
      }

      logger.info('✅ Database cleared successfully');
    } catch (error) {
      logger.error('❌ Error clearing database:', error);
      throw error;
    }
  }

  // Seed database with initial data (for development/testing)
  public async seedDatabase(): Promise<void> {
    try {
      logger.info('🌱 Seeding database with initial data...');

      // Import models (this ensures they're registered)
      await import('../models');

      // Here you would add your seed data logic
      // This is just a placeholder for now

      logger.info('✅ Database seeded successfully');
    } catch (error) {
      logger.error('❌ Error seeding database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export connection function for convenience
export const connectDatabase = async (config?: DatabaseConfig) => {
  await database.connect(config);
  // Fire-and-forget: create compound indexes on hot query paths after connecting
  import('../jobs/ensureIndexes')
    .then(({ ensureIndexes }) => ensureIndexes())
    .catch((err) => logger.error('[ensureIndexes] startup error:', err));
};

// Export disconnect function for convenience
export const disconnectDatabase = async () => {
  return database.disconnect();
};
