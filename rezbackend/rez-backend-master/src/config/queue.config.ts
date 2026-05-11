// @ts-nocheck
import { Queue } from 'bullmq';
import { logger } from './logger';

/**
 * Export Queue Configuration
 *
 * DISABLED BY DEFAULT - Redis connection issues
 * To enable: Set ENABLE_EXPORT_QUEUE=true in .env and ensure Redis is running
 */

let exportQueue: Queue | null = null;
let isRedisAvailable = false;

// Check if export queue should be enabled
const enableExportQueue = process.env.ENABLE_EXPORT_QUEUE === 'true';

if (enableExportQueue) {
  logger.info('🔄 Initializing export queue...');

  try {
    // Redis connection options
    const redisConfig = process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      // Returning null from retryStrategy permanently closes the ioredis connection.
      // Use exponential backoff instead so the queue recovers after transient blips.
      retryStrategy: (times: number) => Math.min(Math.pow(2, times) * 200, 15000),
    };

    exportQueue = new Queue('analytics-export', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 }, // Keep last 100 completed jobs (prevents Redis bloat)
        removeOnFail: { count: 500 }, // Keep last 500 failed jobs for debugging
      },
      settings: {
        maxStalledCount: 3, // Mark as failed after 3 stalls
        stalledInterval: 30000, // Check for stalled jobs every 30s
        maxRetriesPerRequest: 1, // Prevent connection thrashing
        enableReadyCheck: false, // Skip ready check for faster connect
      },
    } as any);

    // Event handlers
    exportQueue.on('error', () => {
      isRedisAvailable = false;
      logger.warn('⚠️ Redis connection failed - Export queue disabled');
      if (exportQueue) {
        exportQueue.close().catch(() => {});
        exportQueue = null;
      }
    });

    (exportQueue as any).on('ready', () => {
      isRedisAvailable = true;
      logger.info('✅ Export queue connected to Redis');
    });

    // Test connection
    Promise.resolve(exportQueue)
      .then(async (q) => {
        await (q as any).waitUntilReady?.();
        return q;
      })
      .then(() => {
        isRedisAvailable = true;
        logger.info('✅ Redis connection successful - Export queue enabled');
      })
      .catch(() => {
        isRedisAvailable = false;
        logger.warn('⚠️ Redis not available - Export queue disabled');
        if (exportQueue) {
          exportQueue.close().catch(() => {});
          exportQueue = null;
        }
      });
  } catch (error: any) {
    logger.warn('⚠️ Failed to initialize export queue:', error.message);
    exportQueue = null;
    isRedisAvailable = false;
  }
} else {
  logger.info('ℹ️ Export queue disabled (set ENABLE_EXPORT_QUEUE=true to enable)');
}

export { exportQueue, isRedisAvailable };
export default exportQueue;
