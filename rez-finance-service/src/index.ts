import 'dotenv/config';
import * as Sentry from '@sentry/node';

process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'rez-finance-service';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    serverName: process.env.SERVICE_NAME,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
}

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import type { IncomingMessage } from 'http';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { markRedisShutdownInitiated, redis } from './config/redis';
import { startHealthServer } from './health';
import { tracingMiddleware } from './middleware/tracing';
import { startOfferRefreshJob } from './jobs/offerRefresh';
import { startBNPLSyncJob } from './bnplSync';
import { trackLoanOutcomes } from './jobs/loanOutcomeTracker';
import borrowRoutes from './routes/borrowRoutes';
import creditRoutes from './routes/creditRoutes';
import payRoutes from './routes/payRoutes';
import partnerRoutes from './routes/partnerRoutes';
import internalRoutes from './routes/internalRoutes';
import dlqAdmin from './routes/dlqAdmin';
import corpGSTRoutes from './routes/corpGSTRoutes'; // CorpGST routes
import adminBnplRoutes from './routes/adminBnplRoutes';
import riskRoutes from './routes/riskRoutes';
import { logger } from './config/logger';

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET', 'INTERNAL_SERVICE_TOKENS_JSON'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!process.env.WALLET_SERVICE_URL)
    logger.warn('[STARTUP] WALLET_SERVICE_URL not set — coins will not be awarded');
  if (!process.env.FINBOX_API_KEY)
    logger.warn('[STARTUP] FINBOX_API_KEY not set — partner offers disabled (stub mode)');
  if (!process.env.PARTNER_WEBHOOK_SECRET_FINBOX)
    logger.warn('[STARTUP] PARTNER_WEBHOOK_SECRET_FINBOX not set — FinBox webhooks will be rejected');
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('Starting rez-finance-service...');

  await connectMongoDB();
  // Redis client auto-connects by default, no need to call connect()

  const app = express();
  // Behind Render LB + CF — trust N hops so per-IP rate limiters key on real client IP.
  // See MASTER-PLAN-2026-04-19 P1 (trust proxy fleet-wide).
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());
  app.use(helmet());
  app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map((s) => s.trim()),
  }));
  app.use(express.json({
    limit: '1mb',
    verify: (req: IncomingMessage & { originalUrl?: string; rawBody?: Buffer }, _res, buf) => {
      if (req.originalUrl?.startsWith('/finance/partner/webhook')) {
        req.rawBody = Buffer.from(buf);
      }
    },
  }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use(tracingMiddleware);

  // Gateway sends /api/finance/* — strip /api prefix so routes match /finance/*
  app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    if (req.url.startsWith('/api/')) req.url = req.url.replace(/^\/api/, '');
    next();
  });

  const getReadiness = async () => {
    const mongoReady = mongoose.connection.readyState === 1;
    let redisReady = false;
    try {
      const pong = await redis.ping();
      redisReady = pong === 'PONG';
    } catch {
      redisReady = false;
    }
    return { mongoReady, redisReady };
  };

  // Main-port health endpoints (Render / external probes)
  app.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'rez-finance-service' });
  });

  app.get('/health/ready', async (_req, res) => {
    const { mongoReady, redisReady } = await getReadiness();
    const ready = mongoReady && redisReady;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      service: 'rez-finance-service',
      db: mongoReady ? 'connected' : 'disconnected',
      redis: redisReady ? 'connected' : 'disconnected',
    });
  });

  app.get('/health', async (_req, res) => {
    const { mongoReady, redisReady } = await getReadiness();
    const ok = mongoReady && redisReady;
    res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'degraded',
      service: 'rez-finance-service',
      db: mongoReady ? 'connected' : 'disconnected',
      redis: redisReady ? 'connected' : 'disconnected',
    });
  });

  // Consumer-facing routes (JWT auth)
  app.use('/finance/borrow', borrowRoutes);
  app.use('/finance/credit', creditRoutes);
  app.use('/finance/pay', payRoutes);

  // Partner webhook routes (internal token auth)
  app.use('/finance/partner/webhook', partnerRoutes);

  // Internal service-to-service routes (internal token auth)
  app.use('/internal/finance', internalRoutes);

  // Finance DLQ admin routes (internal token auth)
  // BAK-CROSS-005 fix: visibility into coin-reward queue failures
  app.use('/finance/admin/dlq', dlqAdmin);

  // Admin BNPL routes (internal token auth)
  // Phase 3: Configurable interest rates
  app.use('/finance/admin/bnpl', adminBnplRoutes);

  // CorpPerks GST routes
  app.use('/gst', corpGSTRoutes);

  // Risk Engine, Marketplace, Merchant Financing, Ecosystem Credit routes
  app.use('/finance', riskRoutes);

  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.errorHandler());

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  // BR-L2 FIX: Changed default from 4005 to 4006. rez-merchant-service also defaults
  // to 4005, causing EADDRINUSE when both services are run locally without an explicit
  // PORT env var. 4006 is free across all services in docker-compose.microservices.yml.
  const port = parseInt(process.env.PORT || '4006', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '4105', 10);

  const server = app.listen(port, () => logger.info(`HTTP server on :${port}`));
  const healthServer = startHealthServer(healthPort);

  startOfferRefreshJob();
  startBNPLSyncJob();

  // Track loan outcomes daily and report to ReZ Mind
  setInterval(trackLoanOutcomes, 24 * 60 * 60 * 1000);

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[SHUTDOWN] ${signal} — graceful shutdown starting`);
    server.close(() => logger.info('[SHUTDOWN] HTTP server closed'));
    healthServer.close();
    try {
      markRedisShutdownInitiated();
      await redis.quit().catch(() => {});
      await disconnectMongoDB();
      logger.info('[SHUTDOWN] Complete');
      process.exit(0);
    } catch (err) {
      logger.error('[SHUTDOWN] Error', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
  });
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  logger.info('rez-finance-service ready');
}

main().catch((err) => {
  logger.error('[FATAL]', err);
  process.exit(1);
});
