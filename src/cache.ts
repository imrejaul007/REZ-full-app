// Redis Cache Service

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const DEFAULT_TTL = 300; // 5 minutes

// Cache helper
export async cache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}

// Cache invalidation
export async invalidate(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}

// Usage
const cachedMenu = await cache(
  `menu:${merchantId}`,
  () => db.products.find({ merchantId }).toArray(),
  60 // 1 minute
);
