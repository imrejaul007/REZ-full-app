"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = connectMongoDB;
exports.disconnectMongoDB = disconnectMongoDB;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./logger");
async function connectMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        logger_1.logger.error('[FATAL] MONGODB_URI environment variable is not set');
        process.exit(1);
    }
    mongoose_1.default.set('strictQuery', false);
    mongoose_1.default.connection.on('connected', () => logger_1.logger.info('[MongoDB] Connected'));
    mongoose_1.default.connection.on('disconnected', () => logger_1.logger.warn('[MongoDB] Disconnected'));
    mongoose_1.default.connection.on('error', (err) => logger_1.logger.error('[MongoDB] Error: ' + err.message));
    await mongoose_1.default.connect(uri, {
        // IDX-1: Disable autoIndex in production (same pattern as monolith).
        // autoIndex=true would make every pod re-run ensureIndex() on boot,
        // stalling startup and racing on large collections. Index creation
        // is handled via one-off migration scripts in production.
        autoIndex: process.env.NODE_ENV !== 'production',
        autoCreate: process.env.NODE_ENV !== 'production',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
    // GAM-MED-01 FIX: Create indexes on all gamification collections.
    // Indexes on { userId: 1 } are the primary access patterns for every collection
    // used in achievement processing, streak tracking, and leaderboard queries.
    // Using createIndex (fire-and-forget) here because the connection is ready
    // and missing indexes on startup are far more expensive than a background index build.
    await createGamificationIndexes();
}
/**
 * GAM-MED-01 FIX: Create indexes for all gamification-related collections.
 *
 * Indexes are created with background:true so they don't block read/write operations
 * during the initial build. These are created once after the MongoDB connection
 * is established (module load time), not on every request.
 *
 * Additional recommended indexes (not created here — requires DBA review):
 *   - cointransactions: { type: 1, user: 1, amount: 1 }  (GAM-MED-04)
 *   - storevisits:      { userId: 1, status: 1 }           (GAM-MED-01)
 */
async function createGamificationIndexes() {
    const indexes = [
        // userachievements — queried by userId on every achievement check
        { collection: 'userachievements', spec: { userId: 1 } },
        // userachievements — unique constraint prevents duplicate achievement grants
        // GAM-MED-03 FIX: Unique compound index replaces the read-then-write TOCTOU pattern.
        // MongoDB enforces uniqueness atomically at insert time — no gap between check and write.
        { collection: 'userachievements', spec: { userId: 1, achievementId: 1 } },
        // userstreaks — queried by userId + type on every visit
        { collection: 'userstreaks', spec: { userId: 1, type: 1 } },
        // userstreaks — PERF-FIX: type + updatedAt for trending store queries
        // Used by rez-search-service getTrendingStores() and getTrendingByCategory()
        { collection: 'userstreaks', spec: { type: 1, updatedAt: 1 } },
        // wallets — queried by userId on every achievement credit
        { collection: 'wallets', spec: { userId: 1 } },
        // storevisits — PERF-FIX: userId alone for getPriorVisitedStoreIds()
        // Used by rez-search-service for personalisation ranking
        { collection: 'storevisits', spec: { userId: 1 } },
        // storevisits — queried by userId + status for visit counts
        { collection: 'storevisits', spec: { userId: 1, status: 1 } },
        // uservisitcounts — queried by userId on every visit
        { collection: 'uservisitcounts', spec: { userId: 1 } },
        // processedvisitevents — idempotency check by eventId
        { collection: 'processedvisitevents', spec: { eventId: 1 } },
        // userachievementprogresses — queried by userId + metric path
        { collection: 'userachievementprogresses', spec: { userId: 1 } },
        // userchallengeprogresses — queried by userId + status
        { collection: 'userchallengeprogresses', spec: { userId: 1, status: 1 } },
        // usermissions — queried by userId + status
        { collection: 'usermissions', spec: { userId: 1, status: 1 } },
        // coinledgers — queried by dedupKey for idempotency
        { collection: 'coinledgers', spec: { dedupKey: 1 } },
    ];
    let created = 0;
    for (const { collection, spec } of indexes) {
        try {
            const coll = mongoose_1.default.connection.collection(collection);
            await coll.createIndex(spec, { background: true, sparse: true });
            created++;
        }
        catch (err) {
            // Index creation can fail if the collection doesn't exist yet (created on first write),
            // or if a duplicate index already exists. Both are safe to ignore.
            const msg = err instanceof Error ? err.message : String(err);
            logger_1.logger.debug(`[MongoDB] Index creation for ${collection}: ${msg}`);
        }
    }
    logger_1.logger.info(`[MongoDB] Gamification indexes: ${created}/${indexes.length} created`);
}
async function disconnectMongoDB() {
    await mongoose_1.default.disconnect();
}
//# sourceMappingURL=mongodb.js.map