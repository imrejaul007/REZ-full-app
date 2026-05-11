import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export interface IdempotencyOptions {
  ttl?: number; // seconds
  keyPrefix?: string;
}

export function idempotencyMiddleware(options: IdempotencyOptions = {}) {
  const { ttl = 86400, keyPrefix = 'fin:idempotency:' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next();
    }

    const key = `${keyPrefix}${idempotencyKey}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      // Store original json
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        redis.setex(key, ttl, JSON.stringify(body));
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Idempotency error:', error);
      next();
    }
  };
}

export async function checkIdempotency(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(`fin:idempotency:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export async function setIdempotency(key: string, value: any, ttl = 86400): Promise<void> {
  await redis.setex(`fin:idempotency:${key}`, ttl, JSON.stringify(value));
}
