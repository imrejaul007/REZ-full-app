"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL);
const DEFAULT_TTL = 300;
async;
cache(key, string, fn, () => Promise, ttl = DEFAULT_TTL);
Promise < T > {
    const: cached = await redis.get(key),
    if(cached) { }, return: JSON.parse(cached),
    const: result = await fn(),
    await, redis, : .setex(key, ttl, JSON.stringify(result)),
    return: result
};
async;
invalidate(pattern, string);
Promise < void  > {
    const: keys = await redis.keys(pattern),
    if(keys) { }, : .length, await, redis, : .del(...keys)
};
const cachedMenu = await cache(`menu:${merchantId}`, () => db.products.find({ merchantId }).toArray(), 60);
//# sourceMappingURL=cache.js.map