/**
 * worker.ts — Background Worker Entry Point
 *
 * Runs all cron jobs and background services in a separate process
 * from the API server. This prevents heavy scheduled jobs from
 * competing with user API requests for MongoDB connection pool slots.
 *
 * Usage:
 *   npm run start:worker        (production, from dist/)
 *   npx ts-node src/worker.ts   (development)
 *
 * Deploy as a separate service (e.g., Render "Background Worker")
 * alongside the API server. Set DISABLE_CRON_IN_API=true on the
 * API server to prevent duplicate job execution.
 *
 * Worker role split (Phase 5 — Worker Isolation):
 *   WORKER_ROLE=all          — all workers, single-process dev mode (default)
 *   WORKER_ROLE=critical     — payments, rewards, merchant-events only
 *   WORKER_ROLE=noncritical  — analytics, notifications, broadcast, email only
 *
 * On Render / Railway:
 *   - Deploy one dyno with WORKER_ROLE=critical  (high priority, fast restart)
 *   - Deploy one dyno with WORKER_ROLE=noncritical (can scale independently)
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, database } from './config/database';
import redisService from './services/redisService';
import { initializeCronJobs, shutdownCronJobs } from './config/cronJobs';
import { ScheduledJobService } from './services/ScheduledJobService';
import { logger } from './config/logger';
import { QueueService } from './services/QueueService';
import { startAllWorkers, startCriticalWorkers, startNoncriticalWorkers } from './workers';

async function startWorker() {
  // ── Determine worker role ──────────────────────────────────────────────────
  // worker.ts is ALWAYS the dedicated background worker entry point — it is
  // never imported by server.ts. Defaulting to 'noncritical' is therefore
  // safe: the background dyno runs analytics/notification/broadcast workers,
  // while the API dyno (server.ts) handles critical workers via its own
  // WORKER_ROLE=critical env var. Setting WORKER_ROLE=all overrides this
  // locally if you need all workers in a single process.
  const workerRole = (process.env.WORKER_ROLE || 'noncritical') as 'all' | 'critical' | 'noncritical';

  logger.info('[WORKER] Starting background worker process...', { workerRole });

  // Connect to database (same pool config as server.ts)
  logger.info('[WORKER] Connecting to database...');
  await connectDatabase();

  // Connect to Redis (required for distributed locks + Bull queues)
  logger.info('[WORKER] Connecting to Redis...');
  await redisService.connect();
  if (!redisService.isReady()) {
    logger.warn('[WORKER] Redis unavailable — distributed locks and Bull queues will not function');
  }

  // Cron jobs and ScheduledJobService only run in 'all' or 'critical' mode.
  // In noncritical mode we intentionally skip them to keep the process lean
  // and avoid double-scheduling when both dynos run simultaneously.
  if (workerRole !== 'noncritical') {
    logger.info('[WORKER] Initializing cron jobs and background services...');
    await initializeCronJobs();
  } else {
    logger.info('[WORKER] Skipping cron jobs (WORKER_ROLE=noncritical)');
  }

  // Initialize Bull queue processors (email, SMS, push, analytics, etc.)
  logger.info('[WORKER] Initializing queue service...');
  await QueueService.initialize();
  logger.info('[WORKER] Queue service initialized');

  // ── Start the appropriate worker group ────────────────────────────────────
  if (workerRole === 'critical') {
    logger.info('[WORKER] Starting CRITICAL workers only (payments, rewards, merchant-events)');
    await startCriticalWorkers();
  } else if (workerRole === 'noncritical') {
    logger.info('[WORKER] Starting NONCRITICAL workers only (analytics, notifications, broadcast, email)');
    await startNoncriticalWorkers();
  } else {
    logger.info('[WORKER] Starting ALL workers (single-process dev mode)');
    await startAllWorkers();
  }

  logger.info('[WORKER] Worker process started', { workerRole });

  // ── Graceful shutdown handling ──
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[WORKER] Received ${signal}. Graceful shutdown...`);

    // Force-exit safety net — prevents the worker from hanging indefinitely
    // if a cron job or queue processor refuses to stop.
    const forceTimer = setTimeout(
      () => {
        logger.error('[WORKER] Graceful shutdown timed out — forcing exit');
        process.exit(1);
      },
      parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '15000', 10),
    );
    forceTimer.unref();

    try {
      // Stop cron jobs first so no new jobs are enqueued during shutdown
      try {
        await shutdownCronJobs();
        logger.info('[WORKER] Cron jobs shut down');
      } catch {
        /* May not be initialized */
      }

      try {
        await ScheduledJobService.shutdown();
        logger.info('[WORKER] Scheduled job service shut down');
      } catch {
        /* May not be initialized */
      }

      try {
        await QueueService.shutdown();
        logger.info('[WORKER] Queue service shut down');
      } catch {
        /* May not be initialized */
      }

      try {
        await redisService.disconnect();
        logger.info('[WORKER] Redis disconnected');
      } catch {
        /* Redis may not be connected */
      }

      await database.disconnect();
      logger.info('[WORKER] Database disconnected');
      logger.info('[WORKER] Worker shut down cleanly');
      clearTimeout(forceTimer);
      process.exit(0);
    } catch (error) {
      logger.error('[WORKER] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[WORKER] Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('[WORKER] Uncaught Exception - shutting down', {
      message: error.message,
      stack: error.stack,
    });
    shutdown('uncaughtException');
  });
}

startWorker().catch((error) => {
  logger.error('[WORKER] Failed to start worker:', error);
  process.exit(1);
});
