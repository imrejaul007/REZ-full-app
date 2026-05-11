import http from 'http';
import mongoose from 'mongoose';
import { bullmqRedis } from './config/redis';
import { logger } from './config/logger';

let isHealthy = true;

export function setHealthy(healthy: boolean): void {
  isHealthy = healthy;
}

export function startHealthServer(port: number = 3001): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health' || req.url === '/healthz') {
      const checks: Record<string, string> = { db: 'ok', redis: 'ok' };
      const errors: string[] = [];

      if (mongoose.connection.readyState !== 1) {
        checks.db = 'error';
        errors.push('MongoDB not connected');
      }

      try {
        await bullmqRedis.ping();
      } catch {
        checks.redis = 'error';
        errors.push('Redis not reachable');
      }

      const status = errors.length > 0 ? 'degraded' : 'ok';
      const statusCode = errors.length > 0 ? 503 : 200;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status,
        service: 'analytics-events',
        checks,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }));
    } else if (req.url === '/ready') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ready' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    logger.info(`[Health] Server listening on port ${port}`);
  });

  return server;
}
