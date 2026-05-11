"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.CacheTTL = void 0;
exports.getRedisClient = getRedisClient;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDelete = cacheDelete;
exports.cacheDeletePattern = cacheDeletePattern;
exports.invalidateRelatedCache = invalidateRelatedCache;
exports.parsePaginationParams = parsePaginationParams;
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.batchFind = batchFind;
exports.memoizeWithTTL = memoizeWithTTL;
exports.createProjection = createProjection;
exports.buildAggregationPipeline = buildAggregationPipeline;
const ioredis_1 = __importDefault(require("ioredis"));
let redisClient = null;
function getRedisClient() {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379';
        redisClient = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100,
            lazyConnect: true,
        });
    }
    return redisClient;
}
const DEFAULT_TTL = 300;
const SHORT_TTL = 60;
const LONG_TTL = 3600;
async function cacheGet(key) {
    try {
        const redis = getRedisClient();
        const value = await redis.get(key);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    }
    catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}
async function cacheSet(key, value, ttl = DEFAULT_TTL) {
    try {
        const redis = getRedisClient();
        await redis.setex(key, ttl, JSON.stringify(value));
    }
    catch (error) {
        console.error('Cache set error:', error);
    }
}
async function cacheDelete(key) {
    try {
        const redis = getRedisClient();
        await redis.del(key);
    }
    catch (error) {
        console.error('Cache delete error:', error);
    }
}
async function cacheDeletePattern(pattern) {
    try {
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
    catch (error) {
        console.error('Cache delete pattern error:', error);
    }
}
async function invalidateRelatedCache(prefix, identifiers) {
    try {
        const redis = getRedisClient();
        const pipeline = redis.pipeline();
        for (const id of identifiers) {
            pipeline.del(`${prefix}:${id}`);
        }
        await pipeline.exec();
    }
    catch (error) {
        console.error('Cache invalidation error:', error);
    }
}
exports.CacheTTL = {
    SHORT: SHORT_TTL,
    DEFAULT: DEFAULT_TTL,
    LONG: LONG_TTL,
    USER_PROFILE: 300,
    MERCHANT_INFO: 600,
    LEAD_SCORE: 180,
    ANALYTICS: 60,
    CONVERSATION: 1800,
};
exports.CacheKeys = {
    userProfile: (userId) => `profile:${userId}`,
    merchantProfile: (merchantId) => `merchant:${merchantId}`,
    leadScore: (userId) => `lead_score:${userId}`,
    conversation: (sessionId) => `conversation:${sessionId}`,
    analytics: (merchantId, type) => `analytics:${merchantId}:${type}`,
    searchResults: (query, filters) => `search:${Buffer.from(`${query}:${filters}`).toString('base64')}`,
};
function parsePaginationParams(query) {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}
function buildPaginatedResponse(data, total, params) {
    const { page = 1, limit = 20 } = params;
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
async function batchFind(ids, findFn, options = {}) {
    const { batchSize = 100 } = options;
    const result = new Map();
    for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const items = await findFn(batch);
        items.forEach((item) => {
            const itemWithId = item;
            if (itemWithId._id || itemWithId.userId || itemWithId.id) {
                result.set(String(itemWithId._id || itemWithId.userId || itemWithId.id), item);
            }
        });
    }
    return result;
}
const memoizeCache = new Map();
function memoizeWithTTL(fn, key, ttl = 1000) {
    const cached = memoizeCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }
    const result = fn();
    memoizeCache.set(key, { value: result, expiresAt: Date.now() + ttl });
    return result;
}
function createProjection(fields) {
    return fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {});
}
function buildAggregationPipeline(matchStage, sortStage, page, limit) {
    return [
        { $match: matchStage },
        { $sort: sortStage },
        { $skip: (page - 1) * limit },
        { $limit: limit },
    ];
}
//# sourceMappingURL=performance.js.map