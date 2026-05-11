/**
 * Event Platform Integration Configuration
 *
 * Configures how analytics-events connects to rez-event-platform
 * for consuming events via shared BullMQ Redis queues.
 */

export interface EventPlatformConfigType {
  enabled: boolean;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency: number;
  queuePrefix: string;
}

export const EventPlatformConfig: EventPlatformConfigType = {
  // Enable/disable event platform integration
  enabled: process.env.EVENT_PLATFORM_ENABLED !== 'false',

  // Redis connection (must match event-platform's Redis)
  redis: {
    host: process.env.EVENT_PLATFORM_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.EVENT_PLATFORM_REDIS_PORT || process.env.REDIS_PORT || '6379', 10),
    password: process.env.EVENT_PLATFORM_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
  },

  // Worker concurrency
  concurrency: parseInt(process.env.EVENT_PLATFORM_CONCURRENCY || '5', 10),

  // Queue name prefix (must match event-platform)
  queuePrefix: process.env.EVENT_PLATFORM_QUEUE_PREFIX || 'events',
};
