"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGameConfigSubscription = startGameConfigSubscription;
exports.stopGameConfigSubscription = stopGameConfigSubscription;
const logger_1 = require("./config/logger");
const redis_1 = require("./config/redis");
const GAME_CONFIG_UPDATE_CHANNEL = 'game-config:updated';
let subscriber = null;
async function startGameConfigSubscription() {
    if (subscriber)
        return;
    const nextSubscriber = redis_1.bullmqRedis.duplicate();
    subscriber = nextSubscriber;
    nextSubscriber.on('error', (err) => {
        logger_1.logger.error('[GameConfigSubscription] Redis subscriber error: ' + err.message);
    });
    await nextSubscriber.subscribe(GAME_CONFIG_UPDATE_CHANNEL);
    nextSubscriber.on('message', (_channel, message) => {
        try {
            const payload = JSON.parse(message);
            logger_1.logger.info('[GameConfigSubscription] Received config update', {
                action: payload.action || 'unknown',
                gameType: payload.gameType || 'all',
                configId: payload.configId,
                scope: payload.scope || 'single',
            });
        }
        catch (error) {
            logger_1.logger.warn('[GameConfigSubscription] Ignoring malformed game config event', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
    logger_1.logger.info('[GameConfigSubscription] Listening for game config updates');
}
async function stopGameConfigSubscription() {
    if (!subscriber)
        return;
    try {
        await subscriber.unsubscribe(GAME_CONFIG_UPDATE_CHANNEL);
        await subscriber.quit();
    }
    finally {
        subscriber = null;
    }
}
//# sourceMappingURL=gameConfigSubscription.js.map