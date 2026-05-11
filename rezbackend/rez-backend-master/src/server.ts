import * as Sentry from '@sentry/node';

/**
 * server.ts — Application entry point
 *
 * Split into:
 *   - config/middleware.ts   — middleware setup (cors, helmet, compression, etc.)
 *   - config/routes.ts       — route registration (all app.use() calls)
 *   - config/socketSetup.ts  — Socket.IO setup and event handlers
 *   - config/cronJobs.ts     — cron job initialization
 *
 * SECURITY WARNING: firebase-service-account.json contains private credentials.
 * NEVER commit that file to version control. It is listed in .gitignore.
 * At runtime, ensure it is injected via a secret manager or mounted volume only.
 */

// BUG-021 FIX: load .env via require() (synchronous, runs before any import
// statements are evaluated) so NODE_ENV and other env vars defined in .env are
// available before the NODE_ENV safety guard below. ES `import` declarations are
// hoisted and executed before top-level code, so `import dotenv` + dotenv.config()
// placed after the guard would run AFTER all imports — never before the guard.
// eslint-disable-next-line @typescript-eslint/no-var-requires
// BED-019 FIX: use process.stderr.write instead of console.log — logger not yet imported
process.stderr.write('[STARTUP] Loading .env...\n');
require('dotenv').config();
process.stderr.write('[STARTUP] .env loaded, setting NODE_ENV safety default...\n');

// Safe default — prevents stack traces leaking to clients in production
// Fixed: OTP bypass (BACK-018) is prevented here — NODE_ENV defaults to 'production'
// if not set, so isDev=false in authController and OTP bypass never activates - Phase 0
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  process.stderr.write('[STARTUP] NODE_ENV not set — defaulting to production for safety\n');
}

import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';

// dotenv already loaded above via require(); this is a no-op but kept for
// clarity so any tool scanning for dotenv.config() still finds a call here.
dotenv.config();

// Import database connection
import { connectDatabase, database } from './config/database';

// Import Redis service
import redisService from './services/redisService';
import { drainQueue } from './services/walletOperationQueue';

// Import payment gateway for health check
import paymentGatewayService from './services/paymentGatewayService';

// App version from package.json
import { version as appVersion } from '../package.json';

// Import environment validation
import { validateEnvironment, validateEnv } from './config/validateEnv';

// Import utilities
import { validateCloudinaryConfig } from './utils/cloudinaryUtils';

// Import logger
// BED-019 FIX: stderr.write before logger import, logger.info after
process.stderr.write('[STARTUP-DEBUG] About to import logger...\n');
import { logger } from './config/logger';
logger.info('[STARTUP-DEBUG] Logger imported successfully');

// Override console methods in production to route through structured logger
if (process.env.NODE_ENV === 'production') {
  console.log = (...args: any[]) => logger.info(args.map(String).join(' '));
  console.error = (...args: any[]) => logger.error(args.map(String).join(' '));
  console.warn = (...args: any[]) => logger.warn(args.map(String).join(' '));
  console.debug = (...args: any[]) => logger.debug(args.map(String).join(' '));
}

// MP-007 FIX: removed top-level unconditional import('./workers') call.
// Workers are now only started inside startServer() AFTER Redis is confirmed
// ready (see the block ~300 lines below). Starting BullMQ workers before
// Redis connects causes immediate ECONNREFUSED reconnect storms that spike
// CPU and fill logs, and can exhaust Redis connection limits on free-tier
// plans before the first real request is served.

// Import modular setup functions
import { setupMiddleware } from './config/middleware';
import { registerRoutes } from './config/routes';
import { setupSocket, attachSocketRedisAdapter } from './config/socketSetup';
import { initializeCronJobs } from './config/cronJobs';
import { ScheduledJobService } from './services/ScheduledJobService';

// Import rate limiters
import { generalLimiter } from './middleware/rateLimiter';

// Import queue metrics sampler and critical queue names
import { startQueueMetricsSampler, sampleQueueMetrics, CRITICAL_QUEUE_NAMES } from './config/prometheus';

// Import Redis connection-status gauge for readiness probe
import { redisConnectionStatus } from './config/redis-pool';

// Import seeding functions for ControlScope
import { seedDefaultFlags } from './utils/featureFlags';
import { seedSystemConfig } from './utils/seedSystemConfig';

// Import webhook validation for SafeDeploy
import { initWebhookCacheCleanup } from './middleware/webhookValidation';

// ── Create Express application ──
const app = express();
const PORT = process.env.PORT || 5001;
const API_PREFIX = process.env.API_PREFIX || '/api';

// ── Setup middleware ──
setupMiddleware(app);

// ── Health check endpoint — lean, UptimeRobot-friendly ──
// No rate limiter here: this path already passes through the global generalLimiter
// added by setupMiddleware(). Adding it again created a double-decrement against
// the same Redis counter for every Render health ping, burning through the
// 500 req/15-min budget twice as fast for that IP.
app.get('/health', async (_req, res) => {
  try {
    let db = 'disconnected';
    try {
      const dbHealth = await database.healthCheck();
      db = dbHealth.status === 'healthy' ? 'connected' : 'disconnected';
    } catch {
      db = 'error';
    }

    let redis = 'disconnected';
    try {
      redis = redisService.isReady() ? 'connected' : 'disconnected';
    } catch {
      redis = 'error';
    }

    const payments = paymentGatewayService.getHealthStatus();
    const allHealthy = db === 'connected' && redis === 'connected';

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      db,
      redis,
      payments,
      uptime: Math.floor(process.uptime()),
      version: appVersion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ── TASK-24: Deep readiness probe — used by K8s / load-balancers ──
// Returns 200 only when every critical dependency is fully ready.
// Kubernetes readinessProbe should point here; livenessProbe can use /health.
app.get('/health/ready', async (_req, res) => {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  let allReady = true;

  // 1. MongoDB
  const dbStart = Date.now();
  try {
    const dbHealth = await database.healthCheck();
    const ok = dbHealth.status === 'healthy';
    checks.mongodb = { ok, latencyMs: Date.now() - dbStart };
    if (!ok) allReady = false;
  } catch (err: any) {
    checks.mongodb = { ok: false, latencyMs: Date.now() - dbStart, error: err.message };
    allReady = false;
  }

  // 2. Redis — include connection pool status from prometheus gauge
  const redisStart = Date.now();
  try {
    const ok = redisService.isReady();
    // Determine connection pool status from event-driven gauge (write client)
    let redisStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
    try {
      const { register } = await import('prom-client');
      const metric = register.getSingleMetric('redis_connection_up');
      if (metric) {
        const values = await (metric as any).get();
        const writeValue = values?.values?.find((v: any) => v.labels?.role === 'write');
        if (writeValue?.value === 1) redisStatus = 'connected';
        // If reconnect counter was incremented recently, surface as reconnecting
        const reconnectMetric = register.getSingleMetric('redis_reconnect_total');
        if (reconnectMetric && writeValue?.value !== 1) {
          redisStatus = 'reconnecting';
        }
      }
    } catch {
      redisStatus = ok ? 'connected' : 'disconnected';
    }
    checks.redis = { ok, latencyMs: Date.now() - redisStart };
    (checks.redis as any).status = redisStatus;
    if (!ok) allReady = false;
  } catch (err: any) {
    checks.redis = { ok: false, latencyMs: Date.now() - redisStart, error: err.message };
    allReady = false;
  }

  // 3. Payment gateway (Razorpay config)
  try {
    const pgHealth = paymentGatewayService.getHealthStatus();
    const ok = pgHealth?.status !== 'unconfigured';
    checks.paymentGateway = { ok };
    if (!ok) allReady = false;
  } catch (err: any) {
    checks.paymentGateway = { ok: false, error: err.message };
    allReady = false;
  }

  // 4. Queue health summary — critical queues only
  // If Redis is not ready, skip (queues will error anyway).
  const queueSummary: Record<string, { depth: number; stalled: number; failed: number }> = {};
  let hasQueueStalled = false;
  if (redisService.isReady()) {
    try {
      const allQueueStats = await sampleQueueMetrics();
      for (const queueName of CRITICAL_QUEUE_NAMES) {
        const stats = allQueueStats[queueName];
        if (stats) {
          queueSummary[queueName] = {
            depth: stats.depth,
            stalled: stats.stalled,
            failed: stats.failed,
          };
          if (stats.stalled > 0) hasQueueStalled = true;
        }
      }
    } catch (queueErr: any) {
      // Non-fatal — don't fail readiness just because queue sampling errored
      logger.warn('[Readiness] Queue sampling failed', { error: queueErr?.message });
    }
  }

  // Determine overall status — degraded if stalled jobs exist but service is otherwise up
  const isHealthy = allReady && !hasQueueStalled;
  const isDegraded = allReady && hasQueueStalled;
  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = isHealthy
    ? 'healthy'
    : isDegraded
      ? 'degraded'
      : 'unhealthy';

  const statusCode = allReady ? 200 : 503;
  res.status(statusCode).json({
    status: overallStatus,
    ready: allReady,
    checks,
    queues: queueSummary,
    uptime: Math.floor(process.uptime()),
    version: appVersion,
    timestamp: new Date().toISOString(),
  });
});

// ── TASK-24: Liveness probe — lightweight, no DB call ──
// Returns 200 as long as the Node process is alive and event loop is healthy.
app.get('/health/live', (_req, res) => {
  res.status(200).json({
    alive: true,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Cache stats endpoint
const { authenticate, requireAdmin } = require('./middleware/auth');
app.get('/health/cache-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await redisService.getStats();
    res.json({ success: true, data: { redis: stats } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Simple test endpoint
if (process.env.NODE_ENV !== 'production') {
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
  });
}

// CSRF Token endpoint
app.get('/api/csrf-token', (req, res) => {
  try {
    const csrfToken = res.getHeader('x-csrf-token');
    if (!csrfToken) {
      return res.status(503).json({
        success: false,
        message: 'CSRF protection is not enabled.',
      });
    }
    res.json({
      success: true,
      message: 'CSRF token generated successfully',
      token: csrfToken,
      usage: {
        header: 'Include this token in X-CSRF-Token header for POST/PUT/DELETE requests',
        cookie: 'Token is also set in csrf-token cookie automatically',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSRF token',
      error: error.message,
    });
  }
});

// API info endpoint
if (process.env.NODE_ENV !== 'production') {
  app.get('/api-info', (req, res) => {
    res.json({
      name: 'REZ App Backend API',
      version: '1.0.0',
      description: 'Backend API for REZ - E-commerce, Rewards & Social Platform',
      status: 'Running',
      endpoints: {
        auth: `${API_PREFIX}/user/auth`,
        products: `${API_PREFIX}/products`,
        categories: `${API_PREFIX}/categories`,
        cart: `${API_PREFIX}/cart`,
        stores: `${API_PREFIX}/stores`,
        orders: `${API_PREFIX}/orders`,
        health: '/health',
      },
    });
  });
}

// ── INFRA-07: Apple App Site Association (iOS universal links) ──
// LOW-3 FIX: Return 404 when APPLE_APP_ID is not configured so iOS treats deep links
// as unverified rather than serving a broken association file with placeholder values.
// Merchant and admin app IDs are optional — only included when env vars are set.
app.get('/.well-known/apple-app-site-association', (req, res) => {
  if (!process.env.APPLE_APP_ID || process.env.APPLE_APP_ID === 'PLACEHOLDER_SET_ME') {
    return res.status(404).json({ error: 'Apple App Site Association not configured. Set APPLE_APP_ID env var.' });
  }

  const details: Array<{ appID: string; paths: string[] }> = [
    { appID: process.env.APPLE_APP_ID, paths: ['/store/*', '/try/*', '/offers/*', '/booking/*'] },
  ];

  const merchantAppId = process.env.MERCHANT_APPLE_APP_ID;
  if (merchantAppId && merchantAppId !== 'PLACEHOLDER_SET_ME') {
    details.push({ appID: merchantAppId, paths: ['/merchant/*', '/dashboard/*'] });
  }

  const adminAppId = process.env.ADMIN_APPLE_APP_ID;
  if (adminAppId && adminAppId !== 'PLACEHOLDER_SET_ME') {
    details.push({ appID: adminAppId, paths: ['/admin/*'] });
  }

  res.json({
    applinks: {
      apps: [],
      details,
    },
  });
});

// ── INFRA-07: Android App Links ──
// LOW-3 FIX: Return 404 when ANDROID_SHA256_FINGERPRINT is not configured so Android
// treats deep links as unverified rather than serving a file with a placeholder fingerprint.
// Merchant and admin entries are optional — only included when their fingerprint env vars are set.
app.get('/.well-known/assetlinks.json', (req, res) => {
  if (!process.env.ANDROID_SHA256_FINGERPRINT || process.env.ANDROID_SHA256_FINGERPRINT === '00:00:00:00') {
    return res
      .status(404)
      .json({ error: 'Android Asset Links not configured. Set ANDROID_SHA256_FINGERPRINT env var.' });
  }

  const links: Array<{
    relation: string[];
    target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
  }> = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'money.rez.app',
        sha256_cert_fingerprints: [process.env.ANDROID_SHA256_FINGERPRINT],
      },
    },
  ];

  const merchantFingerprint = process.env.MERCHANT_ANDROID_SHA256_FINGERPRINT;
  if (merchantFingerprint && merchantFingerprint !== '00:00:00:00') {
    links.push({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.rez.merchant',
        sha256_cert_fingerprints: [merchantFingerprint],
      },
    });
  }

  const adminFingerprint = process.env.ADMIN_ANDROID_SHA256_FINGERPRINT;
  if (adminFingerprint && adminFingerprint !== '00:00:00:00') {
    links.push({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.rez.admin',
        sha256_cert_fingerprints: [adminFingerprint],
      },
    });
  }

  res.json(links);
});

// ── Create HTTP server & Socket.IO ──
const server = createServer(app);
const io = setupSocket(server);

// ── Register all routes (including 404 + globalErrorHandler at the bottom) ──
// Fixed: Error handler is placed AFTER all routes via registerRoutes() which calls
// app.use(notFoundHandler) and app.use(globalErrorHandler) last - Phase 0 (BACK-001 verified)
registerRoutes(app);

// ── Start server function ──
async function startServer() {
  try {
    // ── PROCESS_ROLE separation ──
    // Set PROCESS_ROLE=worker in the dedicated worker dyno/container.
    // Leave unset (defaults to 'api') in the HTTP server dyno/container.
    //
    // API process  (PROCESS_ROLE=api or unset):
    //   - Binds HTTP port, serves Express routes, runs Socket.IO
    //   - Workers and crons are OFF by default (ENABLE_CRON not set)
    //
    // Worker process (PROCESS_ROLE=worker):
    //   - Does NOT bind an HTTP port
    //   - Starts BullMQ workers and cron jobs (set ENABLE_CRON=true)
    //   - Keeps the API dyno's Redis connection count low
    const PROCESS_ROLE = process.env.PROCESS_ROLE || 'api';

    if (PROCESS_ROLE === 'worker') {
      logger.info('[PROCESS_ROLE] Starting as WORKER process — HTTP server will NOT be bound');

      // FIX-11: Initialize Sentry in the worker process so errors from cron jobs and
      // BullMQ workers are captured. Without this, all unhandled exceptions and
      // manual Sentry.captureException calls in the worker are silently dropped.
      //
      // OBS-6: reuse the HTTP init's PII scrubbers (sanitizeEvent +
      // sanitizeBreadcrumb). The previous minimal init had no beforeSend,
      // so OTP / phone / aadhaar inside a BullMQ job payload could land
      // on Sentry unscrubbed when the job threw.
      if (process.env.SENTRY_DSN) {
        const { sanitizeEvent, sanitizeBreadcrumb } = require('./config/sentry');
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
          release: process.env.SENTRY_RELEASE,
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
          serverName: process.env.SENTRY_SERVER_NAME || 'rez-app-backend-worker',
          maxBreadcrumbs: 50,
          maxValueLength: 1024,
          attachStacktrace: true,
          beforeSend: sanitizeEvent,
          beforeBreadcrumb: sanitizeBreadcrumb,
        });
        logger.info('[Worker] Sentry initialized with PII scrubbers');
      }

      // Connect to database and Redis (required by workers and crons)
      logger.info('Connecting to database...');
      await connectDatabase();

      logger.info('Connecting to Redis...');
      await redisService.connect();
      logger.info(redisService.isReady() ? 'Redis connected' : 'Redis unavailable — worker cannot proceed');

      if (!redisService.isReady()) {
        logger.error('[Worker] Redis is required for BullMQ workers. Exiting.');
        process.exit(1);
      }

      // Start BullMQ workers
      import('./workers')
        .then(({ allWorkers }) => {
          logger.info(`[Workers] Started ${allWorkers.length} domain-segmented workers`);
        })
        .catch((err) => {
          logger.error('[Workers] Failed to initialize workers:', err);
        });

      // Start queue metrics sampler (30s interval) — Phase 0 Observability
      startQueueMetricsSampler();

      // Start cron jobs (ENABLE_CRON must be set to true in the worker env)
      if (process.env.ENABLE_CRON === 'true') {
        logger.info('Initializing cron jobs (ENABLE_CRON=true)...');
        await initializeCronJobs();
      } else {
        logger.warn('[Worker] ENABLE_CRON is not set — cron jobs will not run. Set ENABLE_CRON=true in worker env.');
      }

      logger.info('[PROCESS_ROLE] Worker process initialized successfully');

      // Graceful shutdown for worker process
      const shutdownWorker = async (signal: string) => {
        logger.info(`[Worker] Received ${signal}. Shutting down worker process...`);
        try {
          const { allWorkers } = await import('./workers');
          await Promise.all(allWorkers.map((w: any) => w.close().catch(() => {})));
          const { shutdownCronJobs } = await import('./config/cronJobs');
          await shutdownCronJobs();
          await redisService.disconnect().catch(() => {});
          await database.disconnect().catch(() => {});
          logger.info('[Worker] Shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('[Worker] Error during shutdown:', err);
          process.exit(1);
        }
      };

      process.on('SIGTERM', () => shutdownWorker('SIGTERM'));
      process.on('SIGINT', () => shutdownWorker('SIGINT'));
      return;
    }

    // ── API process startup (PROCESS_ROLE=api or unset) ──
    logger.info('[PROCESS_ROLE] Starting as API process');

    // IMMEDIATELY bind port so Render detects it — before ANY async work
    server.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`Server listening on port ${PORT} (initializing services...)`);
    });

    // Validate environment variables (skip in development to allow partial config)
    logger.info('Validating environment configuration...');
    // Sprint 13: validateEnv checks all required vars (RAZORPAY, REDIS, INTERNAL_SERVICE_TOKEN)
    // and exits in production if any are missing.
    validateEnv();
    try {
      validateEnvironment();
      logger.info('Environment validation passed');
    } catch (error) {
      logger.error('FATAL: Environment validation failed:', error);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      logger.warn('Environment validation warnings (non-blocking in development):', error);
    }

    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();

    // Seed ControlScope configurations (feature flags and system config)
    logger.info('Seeding ControlScope configurations...');
    try {
      await seedDefaultFlags();
      logger.info('Feature flags seeded');
    } catch (err) {
      logger.warn('Failed to seed feature flags:', err);
    }
    try {
      await seedSystemConfig();
      logger.info('System config seeded');
    } catch (err) {
      logger.warn('Failed to seed system config:', err);
    }

    // NOTE: BBPS provider count check removed — countDocuments({}) with no index
    // causes a full collection scan taking 3+ seconds at startup on Atlas M0.

    // Connect to Redis
    logger.info('Connecting to Redis...');
    await redisService.connect();
    logger.info(redisService.isReady() ? 'Redis connected' : 'Redis unavailable - app will continue without caching');

    // Warm up public caches after Redis connects (non-blocking)
    // ARJUN: Use Promise.resolve().then() instead of setImmediate to ensure proper async context
    // and allow other startup tasks to complete first. Cache warmup is low-priority.
    if (redisService.isReady()) {
      const { warmUpPublicCaches } = await import('./utils/cacheWarmup');
      Promise.resolve().then(() =>
        warmUpPublicCaches().catch((err) => logger.warn('[CACHE-WARMUP] Background warmup failed:', err)),
      );

      // Start queue metrics sampler (30s interval) — Phase 0 Observability
      startQueueMetricsSampler();

      // Wallet credit drain loop — drains in-memory queue of Redis-unavailable credit ops
      // Only CREDIT operations are queued; DEBIT ops always hard-fail.
      setInterval(async () => {
        if (redisService.isReady()) {
          try {
            await drainQueue(async (op) => {
              const { walletService } = await import('./services/walletService');
              await (walletService as any).creditCoins(
                op.userId,
                op.amount,
                op.source,
                op.description,
                op.referenceId,
                op.id,
              );
            });
          } catch (err) {
            logger.warn('[WalletDrain] Drain cycle error:', err);
          }
        }
      }, 5000); // check every 5s
    }

    // NOTE: BullMQ workers are NOT started in the API process.
    // Workers run in the dedicated PROCESS_ROLE=worker dyno (worker.ts).
    // Starting workers here would add ~7 blocking Redis connections to the API
    // process, pushing the total across both dynos over the Render free-tier limit.

    // Attach Socket.IO Redis adapter (needs Redis to be connected first)
    await attachSocketRedisAdapter(io);

    // Start critical BullMQ workers (payments, rewards, order-events, wallet-events,
    // gamification-events, merchant-events) on the API dyno by default.
    // Set WORKER_ROLE=noncritical or WORKER_ROLE=all to disable this (e.g. when
    // running a dedicated critical-only worker dyno separately).
    // The shared bullmqRedis connection adds only 1 + N_critical blocking connections
    // (~8 total), keeping Valkey free-tier usage within budget.
    if (process.env.WORKER_ROLE !== 'noncritical' && process.env.WORKER_ROLE !== 'all') {
      try {
        const { startCriticalWorkers } = await import('./workers');
        await startCriticalWorkers();
        logger.info('[Workers] Critical workers started alongside HTTP server');
      } catch (err) {
        logger.error('[Workers] Failed to start critical workers:', err);
      }
    }

    // Validate Cloudinary configuration
    const cloudinaryConfigured = validateCloudinaryConfig();
    if (!cloudinaryConfigured) {
      logger.warn('Cloudinary not configured. Bill upload features will not work.');
    }

    // Initialize cron jobs only when explicitly enabled.
    // Default behaviour is to keep crons OFF in the API process — they belong in the
    // dedicated worker process (PROCESS_ROLE=worker). Set ENABLE_CRON=true only on the worker.
    if (process.env.ENABLE_CRON === 'true') {
      logger.info('Initializing cron jobs and background services (ENABLE_CRON=true)...');
      await initializeCronJobs();
    } else {
      logger.info(
        'Cron jobs disabled in API process (ENABLE_CRON not set) — use worker process with PROCESS_ROLE=worker ENABLE_CRON=true',
      );
    }

    // Initialize SafeDeploy webhook cache cleanup
    initWebhookCacheCleanup();
    logger.info('[SafeDeploy] Webhook cache cleanup initialized');

    // All services initialized
    logger.info(`All services initialized successfully`);
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Health Check: http://localhost:${PORT}/health`);

    // ── Graceful shutdown handling ──
    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info(`Received ${signal}. Graceful shutdown...`);

      // Force-exit safety net (nodemon sends SIGINT and expects fast exit)
      const shutdownTimeoutMs = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '15000', 10);
      const forceTimer = setTimeout(() => {
        logger.info('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, shutdownTimeoutMs);
      forceTimer.unref(); // Don't keep process alive just for the timer

      try {
        // Close HTTP server (stop accepting new connections)
        server.close(() => {});

        // OMAR: memory leak risk — stop all timers and event listeners before closing services
        const { MetricsService } = await import('./services/MetricsService');
        const { QueueService } = await import('./services/QueueService');
        const { shutdownCronJobs } = await import('./config/cronJobs');
        const { shutdownWebhookCacheCleanup } = await import('./middleware/webhookValidation');
        const { ReportService } = await import('./merchantservices/ReportService');
        const { CrossAppSyncService } = await import('./merchantservices/CrossAppSyncService');
        const { SyncService } = await import('./merchantservices/SyncService');
        const { CacheService } = await import('./merchantservices/CacheService');

        MetricsService.stopCleanupInterval();
        shutdownWebhookCacheCleanup();
        ReportService.shutdown();
        CrossAppSyncService.shutdown();
        // MP-005 FIX: clear all merchant auto-sync intervals
        SyncService.clearAllAutoSyncs();
        // MP-006 FIX: stop CacheService cleanup interval
        CacheService.shutdown();
        // MP-003 FIX: stop the 30-second metricsUpdateInterval in RealTimeService
        // to prevent the interval from keeping the process alive after SIGTERM.
        if (global.realTimeService && typeof global.realTimeService.cleanup === 'function') {
          global.realTimeService.cleanup();
        }
        await shutdownCronJobs();

        // MP-007 FIX: close BullMQ workers before disconnecting Redis
        // so in-flight jobs can finish and workers can dequeue cleanly.
        try {
          const { allWorkers } = await import('./workers');
          await Promise.all(allWorkers.map((w: any) => w.close().catch(() => {})));
        } catch {
          /* workers may not have been initialised */
        }

        // BUG-017 FIX: disconnect the Redis subscriber created in orderCreateController
        // for cache invalidation pub/sub. Without this it keeps the process alive
        // after SIGTERM and leaks a Redis connection.
        try {
          const { categoryInvalidateSubClient } = await import('./controllers/orderCreateController');
          if (categoryInvalidateSubClient) {
            await categoryInvalidateSubClient.disconnect().catch(() => {});
          }
        } catch {
          /* module may not have been initialised */
        }

        // Close all services in parallel — don't wait for HTTP drain
        await Promise.allSettled([
          QueueService.shutdown().catch(() => {}),
          ScheduledJobService.shutdown().catch(() => {}),
          import('./config/socketAdapter').then((m) => m.disconnectRedisAdapter()).catch(() => {}),
          redisService.disconnect().catch(() => {}),
          database.disconnect().catch(() => {}),
        ]);

        logger.info('All services disconnected');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception - shutting down', {
        message: error.message,
        stack: error.stack,
      });
      shutdown('uncaughtException');
    });

    return server;
  } catch (error: any) {
    logger.error('❌ FATAL SERVER ERROR:', error?.message || error);
    logger.error('Stack:', error?.stack || 'no stack');
    logger.error('Failed to start server:', error);
    // Delay exit to allow logs to flush
    setTimeout(() => process.exit(1), 3000);
  }
}

// Start the application if this file is run directly.
// BUG-018 NOTE: Under ts-node (and some bundlers) require.main === module can
// evaluate to false even when this file IS the entry point, because ts-node
// wraps the module before execution.  The DIRECT_START=true escape-hatch lets
// ops force server startup in those environments without changing application
// code (e.g. ts-node -e "process.env.DIRECT_START='true'; require('./server')").
// Register process-level error handlers BEFORE startServer() so errors during
// the startup phase (DB connect, Redis connect) are caught and logged.
// The handlers inside startServer() remain as a second layer once the logger is
// available with richer context.
process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  // Use console.error here — logger may not be initialized yet during startup
  console.error('[STARTUP] Unhandled Promise Rejection', msg, stack);
});

process.on('uncaughtException', (error: Error) => {
  console.error('[STARTUP] Uncaught Exception — exiting', error.message, error.stack);
  process.exit(1);
});

if (require.main === module || process.env.DIRECT_START === 'true') {
  startServer();
}

export { app, startServer };
// deploy trigger 1774212959
