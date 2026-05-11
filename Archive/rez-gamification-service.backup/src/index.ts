/**
 * rez-gamification-service — Standalone BullMQ Worker Service
 *
 * Phase C extraction from REZ monolith (Strangler Fig pattern).
 */

import 'dotenv/config';

process.env.SERVICE_NAME = 'rez-gamification-service';

import { logger } from './config/logger';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { bullmqRedis } from './config/redis';
import { startGamificationWorker, stopWorker } from './worker';
import { startStoreVisitStreakWorker, stopStoreVisitStreakWorker } from './workers/storeVisitStreakWorker';
import { startAchievementWorker, stopAchievementWorker } from './workers/achievementWorker';
import { startHttpServer, validateWalletServiceUrl } from './httpServer';
import { startGameConfigSubscription, stopGameConfigSubscription } from './gameConfigSubscription';
import { closeNotificationService } from './services/notificationService';
import { closeMarketingService } from './services/marketingService';

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL'];
  const missing = required.filter((key) => !process.env[key]);
  // Accept either the scoped map or the legacy shared token
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('[rez-gamification-service] Starting...');

  // BE-GAM-007 FIX: Validate wallet service URL at startup before any operations
  validateWalletServiceUrl();

  await connectMongoDB();
  const worker = startGamificationWorker();
  startStoreVisitStreakWorker();
  startAchievementWorker();
  await startGameConfigSubscription();

  // Express HTTP server — handles /health + achievement/streak REST endpoints
  // Binds to $PORT (Render's assigned port) so the public URL works correctly.
  const httpPort = parseInt(process.env.PORT || '3004', 10);
  const httpServer = startHttpServer(httpPort);

  const shutdown = async (signal: string) => {
    logger.info(`[${signal}] Graceful shutdown initiated`);
    try {
      await stopWorker();
      await stopStoreVisitStreakWorker();
      await stopAchievementWorker();
      await stopGameConfigSubscription();
      await closeNotificationService();
      await closeMarketingService();
      httpServer.close();
      await bullmqRedis.quit();
      await disconnectMongoDB();
      logger.info('[rez-gamification-service] Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[rez-gamification-service] Shutdown error: ' + (err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('[rez-gamification-service] Ready');
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
