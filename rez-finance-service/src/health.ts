import http from 'http';
import mongoose from 'mongoose';
import { redis } from './config/redis';
import { logger } from './config/logger';

export function startHealthServer(port: number): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/health/live') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'rez-finance-service' }));
      return;
    }

    if (req.url === '/health/ready') {
      const dbState = mongoose.connection.readyState;
      let redisOk = false;
      try {
        const pong = await redis.ping();
        redisOk = pong === 'PONG';
      } catch { /* */ }

      const ready = dbState === 1 && redisOk;
      const status = ready ? 200 : 503;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: ready ? 'ready' : 'not_ready',
        db: dbState === 1 ? 'connected' : 'disconnected',
        redis: redisOk ? 'connected' : 'disconnected',
      }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => logger.info(`[Health] Health server on :${port}`));
  return server;
}
