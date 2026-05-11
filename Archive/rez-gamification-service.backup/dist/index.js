"use strict";
/**
 * rez-gamification-service — Standalone BullMQ Worker Service
 *
 * Phase C extraction from REZ monolith (Strangler Fig pattern).
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
process.env.SERVICE_NAME = 'rez-gamification-service';
const logger_1 = require("./config/logger");
const mongodb_1 = require("./config/mongodb");
const redis_1 = require("./config/redis");
const worker_1 = require("./worker");
const storeVisitStreakWorker_1 = require("./workers/storeVisitStreakWorker");
const achievementWorker_1 = require("./workers/achievementWorker");
const httpServer_1 = require("./httpServer");
const gameConfigSubscription_1 = require("./gameConfigSubscription");
const notificationService_1 = require("./services/notificationService");
const marketingService_1 = require("./services/marketingService");
function validateEnv() {
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
async function main() {
    validateEnv();
    logger_1.logger.info('[rez-gamification-service] Starting...');
    // BE-GAM-007 FIX: Validate wallet service URL at startup before any operations
    (0, httpServer_1.validateWalletServiceUrl)();
    await (0, mongodb_1.connectMongoDB)();
    const worker = (0, worker_1.startGamificationWorker)();
    (0, storeVisitStreakWorker_1.startStoreVisitStreakWorker)();
    (0, achievementWorker_1.startAchievementWorker)();
    await (0, gameConfigSubscription_1.startGameConfigSubscription)();
    // Express HTTP server — handles /health + achievement/streak REST endpoints
    // Binds to $PORT (Render's assigned port) so the public URL works correctly.
    const httpPort = parseInt(process.env.PORT || '3004', 10);
    const httpServer = (0, httpServer_1.startHttpServer)(httpPort);
    const shutdown = async (signal) => {
        logger_1.logger.info(`[${signal}] Graceful shutdown initiated`);
        try {
            await (0, worker_1.stopWorker)();
            await (0, storeVisitStreakWorker_1.stopStoreVisitStreakWorker)();
            await (0, achievementWorker_1.stopAchievementWorker)();
            await (0, gameConfigSubscription_1.stopGameConfigSubscription)();
            await (0, notificationService_1.closeNotificationService)();
            await (0, marketingService_1.closeMarketingService)();
            httpServer.close();
            await redis_1.bullmqRedis.quit();
            await (0, mongodb_1.disconnectMongoDB)();
            logger_1.logger.info('[rez-gamification-service] Shutdown complete');
            process.exit(0);
        }
        catch (err) {
            logger_1.logger.error('[rez-gamification-service] Shutdown error: ' + (err instanceof Error ? err.message : String(err)));
            process.exit(1);
        }
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    logger_1.logger.info('[rez-gamification-service] Ready');
}
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('[FATAL] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
    logger_1.logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
});
main().catch((err) => {
    logger_1.logger.error('[FATAL] Failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map