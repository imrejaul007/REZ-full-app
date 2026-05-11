"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRedis = exports.bullmqRedis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
// SECURITY FIX: Fail at startup if REDIS_URL is not set
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
}
function parsedUrl() {
    try {
        return new URL(redisUrl);
    }
    catch {
        throw new Error(`Invalid REDIS_URL: ${redisUrl}`);
    }
}
const u = parsedUrl();
exports.bullmqRedis = new ioredis_1.default({
    host: u.hostname,
    port: parseInt(u.port || '6379', 10),
    password: u.password || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    keepAlive: 10000,
    retryStrategy: (times) => {
        const base = Math.min(Math.pow(2, times) * 200, 15000);
        return Math.floor(base);
    },
    reconnectOnError: (err) => {
        return err.message.includes('ECONNRESET') || err.message.includes('EPIPE') || err.message.includes('READONLY');
    },
    lazyConnect: false,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});
exports.bullmqRedis.on('connect', () => logger_1.logger.info('[Redis] Connection established'));
exports.bullmqRedis.on('ready', () => logger_1.logger.info('[Redis] Connection ready'));
exports.bullmqRedis.on('reconnecting', () => logger_1.logger.warn('[Redis] Reconnecting...'));
exports.bullmqRedis.on('error', (err) => logger_1.logger.error('[Redis] Error: ' + err.message));
exports.bullmqRedis.on('end', () => logger_1.logger.error('[Redis] Connection closed'));
// GAM-LOW-01 FIX: Separate IORedis instance for application-level Redis operations.
// BullMQ uses bullmqRedis internally; app code (caching, distributed locks, DLQ
// inspection) uses appRedis. This prevents command interleaving and ensures BullMQ's
// internal state stays clean.
exports.appRedis = new ioredis_1.default({
    host: u.hostname,
    port: parseInt(u.port || '6379', 10),
    password: u.password || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        const base = Math.min(Math.pow(2, times) * 200, 5000);
        return Math.floor(base);
    },
    lazyConnect: false,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});
exports.appRedis.on('connect', () => logger_1.logger.info('[Redis/APP] Application connection established'));
exports.appRedis.on('ready', () => logger_1.logger.info('[Redis/APP] Application connection ready'));
exports.appRedis.on('reconnecting', () => logger_1.logger.warn('[Redis/APP] Application reconnecting...'));
exports.appRedis.on('error', (err) => logger_1.logger.error('[Redis/APP] Error: ' + err.message));
exports.appRedis.on('end', () => logger_1.logger.warn('[Redis/APP] Application connection closed'));
//# sourceMappingURL=redis.js.map