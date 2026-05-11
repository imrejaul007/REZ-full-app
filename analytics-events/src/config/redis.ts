import IORedis from 'ioredis';
import { logger } from './logger';

// Support both REDIS_URL (ioredis format) and REDIS_HOST/PORT/PASSWORD (standard format)
function getRedisConfig() {
  // Check for REDIS_URL first (ioredis format)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
      };
    } catch {
      throw new Error(`Invalid REDIS_URL: ${redisUrl}`);
    }
  }

  // Fall back to standard REDIS_HOST/PORT/PASSWORD format
  const host = process.env.REDIS_HOST;
  if (!host) {
    throw new Error('REDIS_HOST or REDIS_URL environment variable is required');
  }

  return {
    host,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

const config = getRedisConfig();

export const bullmqRedis: any = new IORedis({
  host: config.host,
  port: config.port,
  password: config.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  retryStrategy: (times: number) => {
    const base = Math.min(Math.pow(2, times) * 200, 15000);
    return Math.floor(base + Math.random() * 1000);
  },
  reconnectOnError: (err: Error) => {
    return err.message.includes('ECONNRESET') || err.message.includes('EPIPE') || err.message.includes('READONLY');
  },
  lazyConnect: false,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

bullmqRedis.on('connect', () => logger.info('[Redis] Connection established', { host: config.host }));
bullmqRedis.on('ready', () => logger.info('[Redis] Connection ready'));
bullmqRedis.on('reconnecting', () => logger.warn('[Redis] Reconnecting...'));
bullmqRedis.on('error', (err: Error) => logger.error('[Redis] Error: ' + err.message));
bullmqRedis.on('end', () => logger.error('[Redis] Connection closed'));
