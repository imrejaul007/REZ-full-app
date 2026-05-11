/**
 * analytics-events — Standalone BullMQ Worker Service + HTTP API
 *
 * Phase C extraction from REZ monolith (Strangler Fig pattern).
 * Exposes:
 *   - BullMQ worker for analytics-events queue
 *   - Nightly merchant analytics aggregation scheduler
 *   - HTTP Express API on PORT (default 3002) for merchant analytics queries
 *   - Health/readiness server on HEALTH_PORT (default 3102)
 */

import 'dotenv/config';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

process.env.SERVICE_NAME = 'analytics-events';

import { logger } from './config/logger';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { bullmqRedis } from './config/redis';
import { startHealthServer } from './health';
import { startAnalyticsWorker, stopWorker } from './worker';
import { startMerchantAggregationScheduler, stopMerchantAggregationScheduler } from './workers/merchantAggregationWorker';
import { startEventPlatformConsumer, stopEventPlatformConsumer } from './workers/eventPlatformConsumer';
import { createMerchantAnalyticsRouter } from './routes/merchantAnalyticsRoutes';
import { createBenchmarksRouter } from './routes/benchmarks';
import { createUnifiedAnalyticsRouter } from './routes/unifiedAnalyticsRoutes';
import { createEventFlowRouter } from './routes/eventFlowRoutes';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { requireInternalToken } from './middleware/internalAuth';

/**
 * Recursively sanitize object keys to strip '$' prefix and '.' characters
 * Prevents MongoDB operator injection at all nesting levels
 */
function sanitizeObjectKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null || obj instanceof Date) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectKeys(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip '$' prefix and '.' characters from keys
    const cleanKey = key.replace(/^[\$]+|[\$\.]/g, '');
    sanitized[cleanKey] = sanitizeObjectKeys(value);
  }
  return sanitized;
}

function validateEnv(): void {
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    logger.warn('[analytics-events] WARNING: Neither INTERNAL_SERVICE_TOKENS_JSON nor INTERNAL_SERVICE_TOKEN is set — protected routes (/api/analytics, /benchmarks) will return 401');
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('[analytics-events] Starting...');

  await connectMongoDB();
  startAnalyticsWorker();
  await startMerchantAggregationScheduler();
  await startEventPlatformConsumer(); // Consume events from rez-event-platform

  // HTTP API (merchant analytics queries)
  const app = express();
  app.set('trust proxy', 1); // P1: Trust nginx/Render LB X-Forwarded-For so req.ip reflects real client IP
  app.use(helmet());
  app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map(s => s.trim()),
    credentials: true,
  }));
  app.use(express.json({ limit: '64kb' }));
  app.use(mongoSanitize());

  // ── Prometheus metrics counters ─────────────────────────────────────────────
  let requestCount = 0;
  let errorCount = 0;

  // Metrics tracking middleware
  app.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    requestCount++;
    res.on('finish', () => { if (res.statusCode >= 500) errorCount++; });
    next();
  });

  // Metrics endpoint — protected by internal token to prevent info disclosure
  app.get('/metrics', requireInternalToken, (_req: express.Request, res: express.Response) => {
    res.set('Content-Type', 'text/plain');
    res.send(
      `# HELP process_uptime_seconds Process uptime in seconds\n` +
      `# TYPE process_uptime_seconds gauge\n` +
      `process_uptime_seconds ${process.uptime()}\n` +
      `# HELP http_requests_total Total HTTP requests\n` +
      `# TYPE http_requests_total counter\n` +
      `http_requests_total ${requestCount}\n` +
      `# HELP http_errors_total Total HTTP 5xx errors\n` +
      `# TYPE http_errors_total counter\n` +
      `http_errors_total ${errorCount}\n`
    );
  });

  // ── Web event ingestion (from rez-web-menu) ─────────────────────────────────
  // MUST be registered BEFORE the generic /api/analytics router below.

  const WEB_EVENT_RATE_LIMIT = 100;
  const WEB_EVENT_RATE_WINDOW_SECS = 60; // 1 minute sliding window
  const WEB_EVENT_MAX_BATCH = 1000;

  app.post('/api/analytics/web-events', async (req: express.Request, res: express.Response) => {
    // B8 FIX: Redis-backed rate limiting using INCR + EXPIRE pattern.
    // Replaces the in-memory Map which doesn't work in distributed deployments.
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:web-event:${ip}`;
    try {
      const count = await bullmqRedis.incr(key);
      if (count === 1) {
        // First request in this window — set TTL
        await bullmqRedis.expire(key, WEB_EVENT_RATE_WINDOW_SECS);
      }
      if (count > WEB_EVENT_RATE_LIMIT) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
      }
    } catch (err: any) {
      // Redis unavailable — fail open to avoid blocking all analytics
      logger.warn('[web-events] Redis rate limit check failed — allowing request', { error: err.message });
    }

    // Batch size validation
    const { events } = req.body || {};
    if (Array.isArray(events) && events.length > WEB_EVENT_MAX_BATCH) {
      return res.status(400).json({ success: false, error: `Batch too large. Maximum ${WEB_EVENT_MAX_BATCH} events.` });
    }

    // Fire-and-forget: store event asynchronously, always return 200 immediately
    res.status(200).json({ success: true });
    const { event, properties } = req.body || {};
    if (event && typeof event === 'string') {
      // Recursively sanitize all keys to prevent MongoDB operator injection
      const safeProperties = sanitizeObjectKeys(properties);
      mongoose.connection.collection('webevents').insertOne({
        event,
        properties: safeProperties,
        receivedAt: new Date(),
      }).catch(() => {}); // non-critical — ignore write errors
    }
  });

  // ── Batch event ingestion (from consumer app / analyticsService.ts) ──────────
  // MUST be registered BEFORE the generic /api/analytics router below.
  //
  // Launch-polish ANL-5:
  //  - Client MUST send consentGranted=true at either the top level or in
  //    every event's properties (for hetrogeneous batches). We reject the
  //    whole batch with 403 if consent is absent. This keeps the privacy
  //    policy gate enforceable at the ingest boundary instead of trusting
  //    each client to self-gate.
  //  - Also reject oversized batches (> 500 events / 256KB) to stop
  //    pathological clients from flooding Mongo.
  const MAX_BATCH_EVENTS = 500;
  const MAX_BATCH_BYTES = 256 * 1024;

  app.post('/api/analytics/batch', (req: express.Request, res: express.Response) => {
    const { events, consentGranted } = req.body || {};

    // Consent gate — either top-level OR per-event (but never missing).
    const batchConsent =
      consentGranted === true ||
      (Array.isArray(events) && events.every((e: any) => e?.consentGranted === true || e?.properties?.consentGranted === true));
    if (!batchConsent) {
      return res
        .status(403)
        .json({ success: false, error: 'Analytics consent required; send consentGranted: true' });
    }

    // Size caps — reject up front so we don't do a Mongo insert for garbage.
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(200).json({ success: true, accepted: 0 });
    }
    if (events.length > MAX_BATCH_EVENTS) {
      return res.status(413).json({ success: false, error: `Batch exceeds ${MAX_BATCH_EVENTS} events` });
    }
    const approxBytes = JSON.stringify(events).length;
    if (approxBytes > MAX_BATCH_BYTES) {
      return res.status(413).json({ success: false, error: `Batch exceeds ${MAX_BATCH_BYTES} bytes` });
    }

    res.status(200).json({ success: true, accepted: events.length });

    const docs = (events as any[]).map((e) => {
      // Recursively sanitize all keys to prevent MongoDB operator injection
      const safeProps = sanitizeObjectKeys(e.properties);
      return {
        name: typeof e.name === 'string' ? e.name : String(e.name ?? ''),
        properties: safeProps,
        userId: e.userId,
        sessionId: e.sessionId,
        platform: e.platform || 'mobile',
        timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
        receivedAt: new Date(),
      };
    });
    mongoose.connection.collection('appevents').insertMany(docs).catch((err: any) => {
      logger.error('[batch] insertMany failed — events dropped', { count: docs.length, error: err.message });
    });
  });

  app.use('/api/analytics', requireInternalToken, createMerchantAnalyticsRouter());
  app.use('/api/analytics', requireInternalToken, createUnifiedAnalyticsRouter());
  app.use('/api/monitoring', requireInternalToken, createEventFlowRouter());
  app.use('/benchmarks', requireInternalToken, createBenchmarksRouter());

  app.use(Sentry.Handlers.errorHandler());

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message });
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  const apiPort    = parseInt(process.env.PORT || '3002', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '3102', 10);

  const apiServer    = app.listen(apiPort, () => logger.info(`[analytics-events] HTTP API on :${apiPort}`));
  const healthServer = startHealthServer(healthPort);

  const shutdown = async (signal: string) => {
    logger.info(`[${signal}] Graceful shutdown initiated`);
    try {
      await stopWorker();
      await stopMerchantAggregationScheduler();
      await stopEventPlatformConsumer();
      apiServer.close();
      healthServer.close();
      await bullmqRedis.quit();
      await disconnectMongoDB();
      logger.info('[analytics-events] Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[analytics-events] Shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('[analytics-events] Ready');
}

process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

main().catch((err) => {
  logger.error('[FATAL] Failed to start:', err);
  process.exit(1);
});
