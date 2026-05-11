// Connection modes (set via environment variables):
//   Single node: REDIS_URL=redis://host:6379
//   Sentinel:    REDIS_SENTINEL_HOSTS=s1:26379,s2:26379,s3:26379
//                REDIS_SENTINEL_NAME=mymaster  (optional, default: mymaster)
//                REDIS_PASSWORD=...            (optional)
//
// When REDIS_SENTINEL_HOSTS is set, Sentinel mode is used and REDIS_URL is
// ignored. When it is not set, REDIS_URL is used (single-node fallback).

import IORedis from 'ioredis';
import { logger } from './logger';

let redisShutdownInitiated = false;

export function markRedisShutdownInitiated(): void {
  redisShutdownInitiated = true;
}

function createRedisClient(): IORedis {
  const sentinelRaw = process.env.REDIS_SENTINEL_HOSTS;
  const retryStrategy = (times: number) => {
    const base = Math.min(times * 200, 5000);
    return Math.floor(base);
  };
  const reconnectOnError = (err: Error) =>
    err.message.includes('ECONNRESET') ||
    err.message.includes('EPIPE') ||
    err.message.includes('READONLY');

  if (sentinelRaw) {
    const sentinels = sentinelRaw.split(',').map((h) => {
      const [host, port] = h.trim().split(':');
      return { host: host || 'localhost', port: parseInt(port || '26379', 10) };
    });
    return new IORedis({
      sentinels,
      name: process.env.REDIS_SENTINEL_NAME || 'mymaster',
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 10000,
      retryStrategy,
      reconnectOnError,
    });
  }

  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 10000,
    password: process.env.REDIS_PASSWORD,
    retryStrategy,
    reconnectOnError,
  });
}

export const redis = createRedisClient();

redis.on('connect', () => logger.info('[Redis] Connected'));
redis.on('ready', () => logger.info('[Redis] Ready'));
redis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
redis.on('end', () => logger.error('[Redis] Connection closed'));
redis.on('error', (err) => {
  if (redisShutdownInitiated) {
    logger.info('[Redis] Connection closing during shutdown');
    return;
  }
  logger.error('[Redis] Error', { error: err.message });
});
