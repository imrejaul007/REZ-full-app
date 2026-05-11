import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('close', () => {
  console.warn('Redis connection closed');
});

// Redis key prefixes
export const REDIS_KEYS = {
  STREAK_LOCK: (userId: string) => `streak:lock:${userId}`,
  USER_VISIT: (userId: string) => `streak:visit:${userId}`,
  STREAK_CACHE: (userId: string) => `streak:cache:${userId}`,
} as const;

// Cache TTL in seconds
export const CACHE_TTL = {
  STREAK_DATA: 60,      // 1 minute
  VISIT_CHECK: 300,     // 5 minutes
} as const;

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  console.log('Disconnected from Redis');
}
