"use strict";
/**
 * Gamification Service HTTP Server
 *
 * Provides REST endpoints for querying achievement and streak data.
 * Runs alongside the BullMQ workers on PORT (default 3004).
 *
 * Routes:
 *   GET /health                 — liveness probe
 *   GET /achievements/:userId   — earned + locked achievements for a user
 *   GET /streak/:userId         — current streak info for a user
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobMetrics = void 0;
exports.validateWalletServiceUrl = validateWalletServiceUrl;
exports.creditCoinsViaWalletService = creditCoinsViaWalletService;
exports.recordJobProcessed = recordJobProcessed;
exports.recordJobFailed = recordJobFailed;
exports.createHttpApp = createHttpApp;
exports.startHttpServer = startHttpServer;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const mongoose_1 = __importDefault(require("mongoose"));
const achievementWorker_1 = require("./workers/achievementWorker");
const logger_1 = require("./config/logger");
const internalAuth_1 = require("./middleware/internalAuth");
const intentCaptureService_1 = require("./services/intentCaptureService");
const auth_1 = require("./middleware/auth");
const leaderboardService_1 = require("./services/leaderboardService");
const tracing_1 = require("./middleware/tracing");
const redis_1 = require("./config/redis");
const crypto_1 = require("crypto");
const rateLimiter_1 = require("./middleware/rateLimiter");
const leaderboardService_2 = require("./services/leaderboardService");
const challengeService_1 = require("./services/challengeService");
const response_1 = require("./utils/response");
// ── Visit milestone configuration (GAM-MED-05 fix) ───────────────────────────────
/** GAM-MED-05 FIX: Milestone config is now at module scope (not inside the route handler).
 * Validation runs once at module-load time, not on every request. Invalid config
 * will cause the service to fail immediately at startup rather than throw on the
 * first visit request. */
const VISIT_MILESTONES = [
    Object.freeze({ visits: 7, coins: 50 }),
    Object.freeze({ visits: 30, coins: 200 }),
    Object.freeze({ visits: 100, coins: 500 }),
];
/** GAM-MED-05 FIX: Validate milestone config at module-load time.
 * Throws synchronously so the service fails fast at startup if the config is invalid. */
(function validateMilestoneConfig() {
    for (let i = 0; i < VISIT_MILESTONES.length; i++) {
        if (VISIT_MILESTONES[i].coins <= 0) {
            throw new Error(`[GAM-MED-05] Invalid milestone coin amount at index ${i}: ${VISIT_MILESTONES[i].coins}`);
        }
        if (i > 0 && VISIT_MILESTONES[i].visits <= VISIT_MILESTONES[i - 1].visits) {
            throw new Error(`[GAM-MED-05] Milestones not in ascending order at index ${i}`);
        }
    }
    logger_1.logger.info('[GAM-MED-05] VISIT_MILESTONES validated at startup', {
        milestones: VISIT_MILESTONES.map((m) => `${m.visits} visits → ${m.coins} coins`).join(', '),
    });
})();
// ── Wallet service credit helper ──────────────────────────────────────────────
//
// All coin credit operations in the gamification service MUST go through this
// function rather than writing directly to the `wallets` MongoDB collection.
// Direct writes from gamification and the wallet service on the same collection
// under concurrent load produce a race condition that corrupts balances.
//
// The wallet service's /internal/credit endpoint performs the $inc atomically
// and creates the CoinTransaction record itself — callers must NOT also insert
// into coinledgers or cointransactions after a successful call here.
// BE-GAM-007 FIX: Validate WALLET_SERVICE_URL at startup, not on each call
let WALLET_SERVICE_URL = null;
function validateWalletServiceUrl() {
    WALLET_SERVICE_URL =
        process.env.WALLET_SERVICE_URL ||
            process.env.REZ_WALLET_SERVICE_URL ||
            null;
    if (!WALLET_SERVICE_URL) {
        throw new Error('WALLET_SERVICE_URL is not set. Gamification service cannot proceed without wallet service integration. ' +
            'Set WALLET_SERVICE_URL or REZ_WALLET_SERVICE_URL environment variable.');
    }
    logger_1.logger.info('[Gamification] Wallet service URL validated at startup', { url: WALLET_SERVICE_URL });
}
// GAM-HIGH-01 FIX: Strict 24-character hex string regex — ObjectId.isValid() is too permissive
// and accepts numeric strings, padded values, and non-24-char hex strings.
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
async function creditCoinsViaWalletService(userId, amount, idempotencyKey, description, coinType = 'rez', source = 'gamification') {
    // GAM-HIGH-03 FIX: Reject non-finite and non-positive amounts before any network call.
    // The wallet service's /internal/credit endpoint is internal but still an untrusted boundary.
    if (!Number.isFinite(amount) || amount <= 0) {
        logger_1.logger.error('[Gamification] Invalid coin amount rejected', { userId, amount, idempotencyKey });
        return false;
    }
    if (!WALLET_SERVICE_URL) {
        logger_1.logger.error('[Gamification] Wallet service URL not initialized', {
            userId,
            amount,
            idempotencyKey,
        });
        return false;
    }
    try {
        const response = await fetch(`${WALLET_SERVICE_URL}/internal/credit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
                'x-internal-service': 'rez-gamification-service',
            },
            body: JSON.stringify({
                userId,
                amount,
                coinType,
                source,
                description,
                idempotencyKey,
            }),
        });
        if (!response.ok) {
            // GAM-P2-001 FIX: Include raw text when JSON parse fails so error is still visible.
            const err = await response.json().catch(async () => {
                const text = await response.text().catch(() => '<unreadable>');
                return { _rawBody: text };
            });
            logger_1.logger.error('[Gamification] Wallet credit failed', {
                userId,
                amount,
                idempotencyKey,
                status: response.status,
                error: err,
            });
            return false;
        }
        return true;
    }
    catch (e) {
        logger_1.logger.error('[Gamification] Wallet service unreachable', {
            userId,
            amount,
            idempotencyKey,
            error: e?.message,
        });
        return false;
    }
}
// ── Achievement helpers ───────────────────────────────────────────────────────
/**
 * GAM-MED-04 FIX: Added pagination with a hard cap (50 achievements per user is
 * sufficient for any practical user journey). Without pagination, .toArray() loads
 * all documents into memory — a user with 1000+ achievements could OOM the service.
 */
async function getEarnedAchievements(userId) {
    const UserAchievements = mongoose_1.default.connection.collection('userachievements');
    const cursor = UserAchievements.find({ userId }, { projection: { achievementId: 1, earnedAt: 1, coinsAwarded: 1 }, limit: 50 });
    return cursor.toArray();
}
/**
 * BE-GAM-010 FIX: Filter for completed visits only — pending/cancelled visits
 * must not count toward achievement progress. Matches achievementWorker.ts logic.
 */
async function getUserVisitCount(userId) {
    const StoreVisits = mongoose_1.default.connection.collection('storevisits');
    return StoreVisits.countDocuments({ userId, status: 'completed' });
}
async function getUserStreakDoc(userId, type = 'store_visit') {
    const UserStreaks = mongoose_1.default.connection.collection('userstreaks');
    return UserStreaks.findOne({ userId, type });
}
async function getUserWallet(userId) {
    // Use 'wallets' — the shared collection written by all services (including achievementWorker).
    // Old: 'userwallets' was a stale separate collection not written by any current code path.
    const Wallets = mongoose_1.default.connection.collection('wallets');
    return Wallets.findOne({ userId });
}
// ── Prometheus metrics counters ───────────────────────────────────────────────
let requestCount = 0;
let errorCount = 0;
// ── Gamification job metrics (incremented by worker.ts) ───────────────────────
exports.jobMetrics = {
    processed: new Map(), // jobName -> total processed
    failed: new Map(), // jobName -> total failed
    durationSumSeconds: new Map(), // jobName -> sum of durations
    durationCount: new Map(), // jobName -> observation count
    activeWorkers: 0,
};
function recordJobProcessed(jobName, durationMs) {
    exports.jobMetrics.processed.set(jobName, (exports.jobMetrics.processed.get(jobName) ?? 0) + 1);
    const secs = durationMs / 1000;
    exports.jobMetrics.durationSumSeconds.set(jobName, (exports.jobMetrics.durationSumSeconds.get(jobName) ?? 0) + secs);
    exports.jobMetrics.durationCount.set(jobName, (exports.jobMetrics.durationCount.get(jobName) ?? 0) + 1);
}
function recordJobFailed(jobName) {
    exports.jobMetrics.failed.set(jobName, (exports.jobMetrics.failed.get(jobName) ?? 0) + 1);
}
// ── Express app ───────────────────────────────────────────────────────────────
function createHttpApp() {
    const app = (0, express_1.default)();
    // Behind Render LB + CF — trust N hops so per-IP rate limiters key on real client IP.
    // See MASTER-PLAN-2026-04-19 P1 (trust proxy fleet-wide).
    app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
    app.use((0, helmet_1.default)());
    // PERFORMANCE: Enable gzip compression for all responses
    app.use((0, compression_1.default)());
    app.use((0, cors_1.default)({
        origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map(s => s.trim()),
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use((0, express_mongo_sanitize_1.default)());
    app.use(tracing_1.tracingMiddleware);
    // Sentry request handler — capture request data for error tracking
    if (process.env.SENTRY_DSN) {
        const Sentry = require('@sentry/node');
        app.use(Sentry.Handlers.requestHandler());
    }
    // Gateway sends /api/gamification/* — strip /api/gamification prefix so routes match /:userId, /streak/:userId etc.
    app.use((req, _res, next) => {
        if (req.url.startsWith('/api/gamification'))
            req.url = req.url.replace(/^\/api\/gamification/, '');
        else if (req.url.startsWith('/api/'))
            req.url = req.url.replace(/^\/api/, '');
        next();
    });
    // Metrics tracking middleware
    app.use((_req, res, next) => {
        requestCount++;
        res.on('finish', () => { if (res.statusCode >= 500)
            errorCount++; });
        next();
    });
    // GET /health
    app.get('/health', async (_req, res) => {
        const checks = { db: 'ok' };
        const errors = [];
        if (mongoose_1.default.connection.readyState !== 1) {
            checks.db = 'error';
            errors.push('MongoDB not connected');
        }
        const status = errors.length > 0 ? 'degraded' : 'ok';
        res.status(errors.length > 0 ? 503 : 200).json({
            status,
            service: 'rez-gamification-service',
            checks,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    });
    // GET /healthz — alias for /health
    app.get('/healthz', (_req, res) => {
        res.status(200).json({ status: 'ok', service: 'rez-gamification-service' });
    });
    // GET /health/live — Kubernetes/Render liveness probe (process is up)
    app.get('/health/live', (_req, res) => {
        res.status(200).json({ status: 'ok', service: 'rez-gamification-service' });
    });
    // GET /health/ready — Kubernetes/Render readiness probe (dependencies connected)
    app.get('/health/ready', async (_req, res) => {
        const dbOk = mongoose_1.default.connection.readyState === 1;
        const status = dbOk ? 200 : 503;
        res.status(status).json({
            status: dbOk ? 'ready' : 'not_ready',
            db: dbOk ? 'connected' : 'disconnected',
        });
    });
    // GET /health/detailed — Comprehensive health check with latency metrics
    app.get('/health/detailed', async (_req, res) => {
        const checks = {};
        let isHealthy = true;
        // Check MongoDB with latency
        const mongoStart = Date.now();
        try {
            if (mongoose_1.default.connection.readyState !== 1)
                throw new Error('not connected');
            await mongoose_1.default.connection.db?.admin().ping();
            checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
        }
        catch (err) {
            checks.database = { status: 'down', error: err.message, latencyMs: Date.now() - mongoStart };
            isHealthy = false;
        }
        // Check Redis with latency
        const redisStart = Date.now();
        try {
            await redis_1.appRedis.ping();
            checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
        }
        catch (err) {
            checks.redis = { status: 'down', error: err.message, latencyMs: Date.now() - redisStart };
        }
        const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
        res.status(overallStatus === 'healthy' ? 200 : 503).json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.SERVICE_VERSION || '1.0.0',
            uptime: process.uptime(),
            checks,
        });
    });
    // ── Internal auth for all routes below (except /health*) ──
    app.use((req, res, next) => {
        if (req.path === '/health' || req.path === '/healthz'
            || req.path === '/health/live' || req.path === '/health/ready') {
            return next();
        }
        (0, internalAuth_1.requireInternalToken)(req, res, next);
    });
    // GET /achievements/:userId
    // Returns:
    //   earned  — list of unlocked achievements with earnedAt date
    //   locked  — list of not-yet-unlocked achievements with progress hint
    app.get('/achievements/:userId', auth_1.requireAuth, async (req, res) => {
        // GAM-SEC-01 FIX: Require JWT auth. Use req.userId from token instead of req.params.userId
        // to prevent IDOR — users can only view their own achievements.
        const authenticatedUserId = req.userId;
        const { userId: requestedUserId } = req.params;
        // Only allow a user to view their own achievements (or an admin could be added)
        if (requestedUserId !== authenticatedUserId) {
            res.status(403).json((0, response_1.err)('SRV_001', 'Access denied'));
            return;
        }
        try {
            // GAM-SEC-01 FIX: Use authenticatedUserId from JWT (set by requireAuth).
            // userId from token is trusted — no need to re-validate format or check existence.
            const userId = authenticatedUserId;
            const [earnedDocs, visitCount, streakDoc, walletDoc] = await Promise.all([
                getEarnedAchievements(userId),
                getUserVisitCount(userId),
                getUserStreakDoc(userId),
                getUserWallet(userId),
            ]);
            const earnedIds = new Set(earnedDocs.map((d) => d.achievementId));
            // GAM-MED-01 FIX: streakDoc is typed as UserStreakDoc, so currentStreak is already typed.
            const currentStreak = streakDoc?.currentStreak ?? 0;
            // CS-H1 fix: neither rezBalance nor balance (object) are valid number fields.
            // Match the pattern used in achievementWorker.ts line 131: find rez coin entry first,
            // fall back to balance.available (already a number field) if no rez coin entry found.
            // GAM-MED-01 FIX: walletDoc?.coins is typed as CoinEntry[] via the WalletDoc interface.
            const rezCoin = walletDoc?.coins?.find((c) => c.type === 'rez');
            const totalCoins = (rezCoin?.amount ?? walletDoc?.balance?.available) ?? 0;
            const earned = earnedDocs.map((d) => {
                const def = achievementWorker_1.ACHIEVEMENTS.find((a) => a.id === d.achievementId);
                return {
                    id: d.achievementId,
                    name: def?.name ?? d.achievementId,
                    description: def?.description ?? '',
                    coins: d.coinsAwarded,
                    earnedAt: d.earnedAt,
                };
            });
            const locked = achievementWorker_1.ACHIEVEMENTS.filter((a) => !earnedIds.has(a.id)).map((a) => {
                // Derive a progress hint from the condition
                let progress = 0;
                let target = 0;
                if (a.condition.startsWith('visit_count')) {
                    target = parseInt(a.condition.split('>= ')[1], 10);
                    progress = Math.min(visitCount, target);
                }
                else if (a.condition.startsWith('streak')) {
                    target = parseInt(a.condition.split('>= ')[1], 10);
                    progress = Math.min(currentStreak, target);
                }
                else if (a.condition.startsWith('total_coins')) {
                    target = parseInt(a.condition.split('>= ')[1], 10);
                    progress = Math.min(totalCoins, target);
                }
                return {
                    id: a.id,
                    name: a.name,
                    description: a.description,
                    coins: a.coins,
                    condition: a.condition,
                    progress,
                    target,
                    percentComplete: target > 0 ? Math.round((progress / target) * 100) : 0,
                };
            });
            res.json({ success: true, data: { earned, locked } });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /achievements error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /streak/:userId
    // Returns current streak info from userstreaks collection.
    // GAM-SEC-01 FIX: Require JWT auth + IDOR check.
    app.get('/streak/:userId', auth_1.requireAuth, async (req, res) => {
        const authenticatedUserId = req.userId;
        const { userId: requestedUserId } = req.params;
        if (requestedUserId !== authenticatedUserId) {
            res.status(403).json((0, response_1.err)('SRV_001', 'Access denied'));
            return;
        }
        try {
            const userId = authenticatedUserId;
            const [streakDoc, savingsDoc] = await Promise.all([
                getUserStreakDoc(userId, 'store_visit'),
                getUserStreakDoc(userId, 'savings'),
            ]);
            const buildStreakShape = (doc) => {
                if (!doc)
                    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null, streakActive: false };
                const lastDate = doc.lastActivityDate ?? null;
                let streakActive = false;
                if (lastDate) {
                    const today = new Date().toISOString().split('T')[0];
                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    streakActive = lastDate === today || lastDate === yesterday;
                }
                return {
                    currentStreak: doc.currentStreak ?? 0,
                    longestStreak: doc.longestStreak ?? 0,
                    lastActivityDate: lastDate,
                    streakActive,
                };
            };
            const storeVisit = buildStreakShape(streakDoc);
            const savings = buildStreakShape(savingsDoc);
            // Return shape compatible with both consumer app expectations:
            // { success, data: { currentStreak } }               — top-level store_visit streak
            // { success, data: { savings: { currentStreak } } }  — savings streak shape
            res.json({
                success: true,
                data: {
                    userId,
                    currentStreak: storeVisit.currentStreak,
                    longestStreak: storeVisit.longestStreak,
                    lastActivityDate: storeVisit.lastActivityDate,
                    streakActive: storeVisit.streakActive,
                    storeVisit,
                    savings,
                },
            });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /streak error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /leaderboard
    // Returns top 10 users by lifetime coins, cached 5 minutes.
    app.get('/leaderboard', rateLimiter_1.leaderboardLimiter, async (_req, res) => {
        try {
            const entries = await (0, leaderboardService_2.fetchLeaderboard)();
            res.json({ success: true, data: entries });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /leaderboard error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /leaderboard/me
    // Returns the requesting user's rank and ±2 surrounding neighbours.
    // GAM-SEC-01 FIX: Use req.userId from JWT (set by requireAuth) instead of req.query.userId
    // to prevent IDOR — users can only view their own leaderboard position.
    app.get('/leaderboard/me', rateLimiter_1.leaderboardLimiter, auth_1.requireAuth, async (req, res) => {
        try {
            const userId = req.userId;
            // CS-M6 fix: cache the full aggregation result in Redis for 60 seconds.
            // The aggregation scans up to 1000 documents on every request — caching avoids
            // a full collection scan per user hit as the cointransactions collection grows.
            const cacheKey = `leaderboard:me:full`;
            let allAggregated = [];
            try {
                const cached = await redis_1.appRedis.get(cacheKey);
                if (cached) {
                    // GAM-MED-01 FIX: JSON.parse returns unknown; validate it is an array before using.
                    // If the cached value is corrupted (not an array), fall through to recompute from DB.
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        allAggregated = parsed;
                    }
                }
            }
            catch (cacheErr) {
                // Redis unavailable or parse error — fall through to recompute from DB below
                logger_1.logger.warn('[HTTP] /leaderboard/me Redis cache error, falling back to DB', { error: cacheErr?.message });
            }
            // GAM-MED-04 FIX: If cache was empty/missing/corrupted, recompute from DB.
            // NOTE: Index recommended on cointransactions: { type: 1, user: 1, amount: 1 }
            // to avoid a full collection scan on every /leaderboard/me request.
            if (allAggregated.length === 0) {
                const CoinTransactions = mongoose_1.default.connection.collection('cointransactions');
                const rawAggregated = await CoinTransactions.aggregate([
                    { $match: { type: 'earned' } },
                    { $group: { _id: '$user', lifetimeCoins: { $sum: '$amount' } } },
                    { $sort: { lifetimeCoins: -1 } },
                    { $limit: 1000 },
                ]).toArray();
                allAggregated = rawAggregated;
                // Cache the result for future requests (best-effort)
                try {
                    await redis_1.appRedis.setex(cacheKey, 60, JSON.stringify(allAggregated));
                }
                catch {
                    // Cache write failure — non-fatal; serve the computed result
                }
            }
            const Users = mongoose_1.default.connection.collection('users');
            const userIndex = allAggregated.findIndex((r) => String(r._id) === userId);
            if (userIndex === -1) {
                // LOW-04 FIX: Return same 404 message regardless of whether user is off-leaderboard or beyond query limit
                res.status(404).json((0, response_1.err)('RES_NOT_FOUND', 'User not found on leaderboard'));
                return;
            }
            const start = Math.max(0, userIndex - 2);
            const end = Math.min(allAggregated.length - 1, userIndex + 2);
            const slice = allAggregated.slice(start, end + 1);
            // Convert raw _id values to ObjectId; fall back to the raw value if conversion fails.
            const userIdCandidates = slice.map((r) => {
                try {
                    return new mongoose_1.default.Types.ObjectId(String(r._id));
                }
                catch {
                    return String(r._id);
                }
            });
            const userDocs = await Users.find({ _id: { $in: userIdCandidates } }, { projection: { _id: 1, firstName: 1, name: 1 } }).toArray();
            const userMap = new Map();
            for (const u of userDocs) {
                const key = String(u._id);
                const displayName = u.firstName || ((u.name || '').split(' ')[0]) || 'Unknown';
                userMap.set(key, displayName);
            }
            const neighbours = slice.map((r, i) => ({
                rank: start + i + 1,
                userId: String(r._id),
                displayName: userMap.get(String(r._id)) || 'Unknown',
                lifetimeCoins: r.lifetimeCoins,
                tier: (0, leaderboardService_1.getTier)(r.lifetimeCoins),
            }));
            const me = neighbours.find((n) => n.userId === userId);
            // RTMN Commerce Memory: track leaderboard rank query as engagement intent
            (0, intentCaptureService_1.track)({ userId, event: 'leaderboard_rank_changed', intentKey: `gamification_leaderboard`, properties: { rank: me?.rank, tier: me?.tier, lifetimeCoins: me?.lifetimeCoins } }).catch((err) => {
                logger_1.logger.warn('[Analytics] Track failed', { error: err?.message });
            });
            res.json({ success: true, data: { me, neighbours } });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /leaderboard/me error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // POST /internal/visit
    // Accepts a store visit event, increments streak, and awards milestone coins.
    // Milestones: 7 visits (50 rez), 30 visits (200 rez), 100 visits (500 rez).
    // Uses idempotency via eventId to prevent double-processing on retries.
    // C-24 FIX: Added explicit requireInternalToken (global middleware also guards this route)
    app.post('/internal/visit', internalAuth_1.requireInternalToken, async (req, res) => {
        try {
            const { userId, merchantId, storeId, timestamp, eventId } = req.body;
            if (!userId || !storeId) {
                res.status(400).json({ success: false, error: 'userId and storeId are required' });
                return;
            }
            if (!OBJECT_ID_REGEX.test(userId)) {
                res.status(400).json({ success: false, error: 'Invalid userId format' });
                return;
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ success: false, error: 'Invalid userId' });
                return;
            }
            // GAM-MED-02 FIX: Validate optional fields. timestamp must be a parseable ISO date.
            if (timestamp !== undefined) {
                const parsed = Date.parse(timestamp);
                if (isNaN(parsed)) {
                    res.status(400).json({ success: false, error: 'Invalid timestamp format — expected ISO 8601 string' });
                    return;
                }
            }
            // eventId is validated as a string; empty strings are treated as missing.
            if (typeof eventId === 'string' && eventId.trim() === '') {
                // Treat empty-string eventId as missing — prevents accidental empty dedup keys.
                req.body.eventId = undefined;
            }
            // Idempotency: skip if this eventId was already processed.
            // The upsert is the authoritative atomic check — the old pre-flight findOne
            // widened the TOCTOU window without adding safety, so it's removed.
            if (eventId) {
                const ProcessedVisits = mongoose_1.default.connection.collection('processedvisitevents');
                const markResult = await ProcessedVisits.updateOne({ eventId }, { $setOnInsert: { eventId, userId, processedAt: new Date() } }, { upsert: true });
                if (markResult.upsertedCount === 0) {
                    // Another request already claimed this eventId
                    res.json({ success: true, data: { duplicate: true, message: 'Event already processed' } });
                    return;
                }
            }
            // BE-GAM-005 FIX: Use distributed lock (Redis SET NX with TTL) to prevent
            // concurrent requests from both incrementing and checking milestones.
            // Lock protects both the increment and milestone detection to ensure atomicity.
            const lockKey = `milestone-lock:${userId}`;
            const lockToken = `${Date.now()}-${(0, crypto_1.randomUUID)()}`;
            const lockAcquired = await redis_1.appRedis.set(lockKey, lockToken, 'EX', 10, 'NX'); // 10s lock
            if (!lockAcquired) {
                // Another request is processing this user's milestone, skip (let the other request handle it)
                res.json({ success: true, data: { message: 'Visit recorded (milestone check in progress)' } });
                return;
            }
            try {
                // Increment total visit count for the user (across all stores)
                const UserVisitCounts = mongoose_1.default.connection.collection('uservisitcounts');
                const visitCountResult = await UserVisitCounts.findOneAndUpdate({ userId }, {
                    $inc: { totalVisits: 1 },
                    $set: { updatedAt: new Date() },
                    $setOnInsert: { userId, createdAt: new Date() },
                }, { upsert: true, returnDocument: 'after' });
                // Guard against null — findOneAndUpdate with upsert should always return the doc,
                // but re-fetch if the driver returns null (e.g. on first upsert in some versions).
                const visitDoc = visitCountResult ?? await UserVisitCounts.findOne({ userId });
                // GAM-MED-01 FIX: Add runtime guard so TypeScript knows totalVisits is a number.
                // findOneAndUpdate with upsert always returns a doc or null; null-coalesce handles the edge case.
                const newVisitCount = typeof visitDoc?.totalVisits === 'number' ? visitDoc.totalVisits : 1;
                // Check if this visit count hits a milestone
                const milestone = VISIT_MILESTONES.find((m) => m.visits === newVisitCount);
                let coinsAwarded = 0;
                if (milestone) {
                    // GAM-MED-06 FIX: Use crypto.randomUUID() instead of Date.now() for the dedup key.
                    // Date.now() created collision windows where concurrent visits generated identical
                    // dedup keys, silently dropping milestone rewards. randomUUID() guarantees uniqueness.
                    const dedupKey = `visit-milestone-${userId}-${milestone.visits}-${(0, crypto_1.randomUUID)()}`;
                    // CS-C3 FIX: Call wallet service FIRST, write ledger entry SECOND.
                    // If wallet credit fails, the error propagates and the caller (BullMQ via
                    // storeVisitStreakWorker.processStoreVisitInternal) retries safely.
                    // Ledger entry is only written after confirmed credit.
                    const credited = await creditCoinsViaWalletService(userId, milestone.coins, dedupKey, `${milestone.visits}-visit milestone bonus`);
                    if (credited) {
                        coinsAwarded = milestone.coins;
                        logger_1.logger.info('[HTTP /internal/visit] Milestone coins awarded', {
                            userId,
                            visits: milestone.visits,
                            coins: milestone.coins,
                        });
                        // Write audit ledger entry only after confirmed credit.
                        const CoinLedger = mongoose_1.default.connection.collection('coinledgers');
                        await CoinLedger.updateOne({ dedupKey }, {
                            $setOnInsert: {
                                userId,
                                amount: milestone.coins,
                                type: 'credit',
                                source: 'visit_milestone',
                                description: `${milestone.visits}-visit milestone bonus`,
                                dedupKey,
                                createdAt: new Date(),
                            },
                        }, { upsert: true });
                        // RTMN Commerce Memory: track visit milestone as engagement intent
                        (0, intentCaptureService_1.track)({ userId, event: 'visit_milestone_reached', intentKey: `gamification_visit_milestone_${milestone.visits}`, properties: { visits: milestone.visits, coins: milestone.coins } }).catch(() => { });
                    }
                    else {
                        // Throw to signal failure — caller should handle retry.
                        throw new Error(`[HTTP /internal/visit] Wallet credit failed for milestone ${milestone.visits}`);
                    }
                }
                // HIGH-10 FIX: Use Promise.allSettled() to decouple milestone and streak operations.
                // If one fails, it doesn't block the other from running, and both results are captured.
                // This prevents desync where milestone succeeds but streak processing fails (or vice versa).
                const { processStoreVisitInternal } = await Promise.resolve().then(() => __importStar(require('./workers/storeVisitStreakWorker')));
                const [streakResult] = await Promise.allSettled([
                    processStoreVisitInternal({
                        eventId: eventId || `http-visit-${userId}-${Date.now()}`,
                        userId,
                        merchantId: merchantId || '',
                        storeId,
                        timestamp,
                    }),
                ]);
                // Log any streak processing failure but don't fail the whole request
                if (streakResult.status === 'rejected') {
                    logger_1.logger.error('[HTTP /internal/visit] Streak processing failed', {
                        userId,
                        reason: streakResult.reason?.message,
                    });
                }
                res.json({
                    success: true,
                    data: {
                        totalVisits: newVisitCount,
                        coinsAwarded,
                        milestoneReached: milestone ? milestone.visits : null,
                    },
                });
            }
            finally {
                // BE-GAM-005 FIX: Always release the distributed lock
                const lockStillHeld = await redis_1.appRedis.get(lockKey);
                if (lockStillHeld === lockToken) {
                    await redis_1.appRedis.del(lockKey);
                }
            }
        }
        catch (err) {
            logger_1.logger.error('[HTTP] POST /internal/visit error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // Allowlist prevents Redis key injection via arbitrary queueName path param.
    const VALID_DLQ_QUEUE_NAMES = new Set([
        'gamification-events',
        'store-visit-events',
        'notification-events',
        'achievement-events',
    ]);
    // GET /internal/dlq/:queueName — inspect dead-letter queue entries (internal network only)
    // C-24 FIX: Added explicit requireInternalToken (global middleware also guards this route)
    app.get('/internal/dlq/:queueName', internalAuth_1.requireInternalToken, async (req, res) => {
        const { queueName } = req.params;
        if (!VALID_DLQ_QUEUE_NAMES.has(queueName)) {
            res.status(400).json({ success: false, error: 'Invalid queue name' });
            return;
        }
        const dlqKey = `dlq:${queueName}`;
        const start = parseInt(String(req.query.start ?? '0'), 10);
        const end = parseInt(String(req.query.end ?? '49'), 10);
        try {
            const entries = await redis_1.appRedis.lrange(dlqKey, start, end);
            const total = await redis_1.appRedis.llen(dlqKey);
            const jobs = entries.map((e) => {
                try {
                    return JSON.parse(e);
                }
                catch {
                    return { raw: e };
                }
            });
            res.json({ success: true, data: { queueName, dlqKey, total, jobs, page: { start, end } } });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /internal/dlq error', err);
            res.status(500).json({ success: false, error: 'Failed to fetch DLQ entries' });
        }
    });
    // GET /metrics — Prometheus exposition format (C-24 FIX: explicit requireInternalToken)
    app.get('/metrics', internalAuth_1.requireInternalToken, (_req, res) => {
        const lines = [];
        lines.push('# HELP process_uptime_seconds Process uptime in seconds', '# TYPE process_uptime_seconds gauge', `process_uptime_seconds ${process.uptime()}`, '# HELP http_requests_total Total HTTP requests', '# TYPE http_requests_total counter', `http_requests_total ${requestCount}`, '# HELP http_errors_total Total HTTP 5xx errors', '# TYPE http_errors_total counter', `http_errors_total ${errorCount}`);
        // gamification_jobs_processed_total{jobName="..."}
        lines.push('# HELP gamification_jobs_processed_total Total gamification jobs processed', '# TYPE gamification_jobs_processed_total counter');
        for (const [jobName, count] of exports.jobMetrics.processed) {
            lines.push(`gamification_jobs_processed_total{jobName="${jobName}"} ${count}`);
        }
        // gamification_jobs_failed_total{jobName="..."}
        lines.push('# HELP gamification_jobs_failed_total Total gamification jobs failed', '# TYPE gamification_jobs_failed_total counter');
        for (const [jobName, count] of exports.jobMetrics.failed) {
            lines.push(`gamification_jobs_failed_total{jobName="${jobName}"} ${count}`);
        }
        // gamification_job_duration_seconds{jobName="..."} — expose as a simple summary (sum + count)
        lines.push('# HELP gamification_job_duration_seconds_sum Sum of gamification job durations in seconds', '# TYPE gamification_job_duration_seconds_sum gauge');
        for (const [jobName, sum] of exports.jobMetrics.durationSumSeconds) {
            lines.push(`gamification_job_duration_seconds_sum{jobName="${jobName}"} ${sum.toFixed(6)}`);
        }
        lines.push('# HELP gamification_job_duration_seconds_count Count of gamification job duration observations', '# TYPE gamification_job_duration_seconds_count gauge');
        for (const [jobName, count] of exports.jobMetrics.durationCount) {
            lines.push(`gamification_job_duration_seconds_count{jobName="${jobName}"} ${count}`);
        }
        // gamification_active_workers
        lines.push('# HELP gamification_active_workers Number of active gamification worker instances', '# TYPE gamification_active_workers gauge', `gamification_active_workers ${exports.jobMetrics.activeWorkers}`);
        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(lines.join('\n') + '\n');
    });
    // Sentry error handler — must be before global error handler
    if (process.env.SENTRY_DSN) {
        const Sentry = require('@sentry/node');
        app.use(Sentry.Handlers.errorHandler());
    }
    // Global error handler
    app.use((err, _req, res, _next) => {
        logger_1.logger.error('[HTTP] Unhandled error', { message: err.message, stack: err.stack });
        res.status(500).json({ code: 'SRV_001', message: 'Internal server error' });
    });
    // GET /karma-leaderboard — proxy to karma service Redis ZSET for active karma rankings
    // Requires internal token; returns top N users by active karma
    app.get('/karma-leaderboard', async (req, res) => {
        try {
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
            const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10));
            // Read from shared Redis (both karma and gamification services use bullmqRedis)
            const { bullmqRedis } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
            const results = await bullmqRedis.zrevrange('karma:rankings:activeKarma', offset, offset + limit - 1, 'WITHSCORES');
            const entries = [];
            for (let i = 0; i < results.length; i += 2) {
                entries.push({
                    rank: offset + Math.floor(i / 2) + 1,
                    userId: results[i],
                    activeKarma: parseInt(results[i + 1], 10),
                });
            }
            const total = await bullmqRedis.zcard('karma:rankings:activeKarma');
            // RTMN Commerce Memory: track karma leaderboard query (public endpoint, no userId)
            (0, intentCaptureService_1.track)({ event: 'karma_leaderboard_queried', intentKey: `gamification_karma_leaderboard`, properties: { limit, offset, resultCount: entries.length }, userId: 'anonymous' }).catch(() => { });
            res.json({
                success: true,
                data: { entries, total, limit, offset, hasMore: offset + limit < total },
            });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /karma-leaderboard error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /karma-leaderboard/my-rank — user's rank in karma leaderboard
    app.get('/karma-leaderboard/my-rank', auth_1.requireAuth, async (req, res) => {
        try {
            const userId = req.userId;
            const { bullmqRedis } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
            const rank = await bullmqRedis.zrevrank('karma:rankings:activeKarma', userId);
            const total = await bullmqRedis.zcard('karma:rankings:activeKarma');
            const score = await bullmqRedis.zscore('karma:rankings:activeKarma', userId);
            if (rank === null) {
                res.json({ success: true, data: { rank: null, total: 0, score: 0, percentile: 0 } });
                return;
            }
            const percentile = total > 0 ? ((total - rank - 1) / total) * 100 : 0;
            // RTMN Commerce Memory: track karma leaderboard rank query as engagement intent
            (0, intentCaptureService_1.track)({ userId, event: 'karma_leaderboard_queried', intentKey: `gamification_karma_leaderboard`, properties: { rank: rank + 1, total, percentile } }).catch(() => { });
            res.json({
                success: true,
                data: {
                    rank: rank + 1,
                    total,
                    score: parseInt(score ?? '0', 10),
                    percentile: Math.round(percentile * 100) / 100,
                },
            });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /karma-leaderboard/my-rank error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // ── Challenge Routes ─────────────────────────────────────────────────────────
    const challengeService = new challengeService_1.ChallengeService();
    // POST /challenges — Create a new challenge (internal only)
    app.post('/challenges', internalAuth_1.requireInternalToken, async (req, res) => {
        try {
            const { name, description, type, startDate, endDate, goals, rewards, maxParticipants } = req.body;
            if (!name) {
                res.status(400).json({ success: false, error: 'name is required' });
                return;
            }
            // Validate goals format
            if (goals && !Array.isArray(goals)) {
                res.status(400).json({ success: false, error: 'goals must be an array' });
                return;
            }
            // Validate rewards format
            if (rewards && !Array.isArray(rewards)) {
                res.status(400).json({ success: false, error: 'rewards must be an array' });
                return;
            }
            const challenge = await challengeService.createChallenge({
                name,
                description,
                type: type || 'event',
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                goals,
                rewards,
                maxParticipants,
            });
            res.status(201).json({ success: true, data: challenge });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] POST /challenges error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /challenges — List challenges
    app.get('/challenges', async (req, res) => {
        try {
            const status = req.query.status;
            const type = req.query.type;
            const limit = parseInt(String(req.query.limit ?? '20'), 10);
            const offset = parseInt(String(req.query.offset ?? '0'), 10);
            const { challenges, total } = await challengeService.listChallenges({
                status,
                type,
                limit,
                offset,
            });
            res.json({
                success: true,
                data: { challenges, total, limit, offset },
            });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /challenges error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /challenges/active — Get active challenges for the current user
    app.get('/challenges/active', auth_1.requireAuth, async (req, res) => {
        try {
            const userId = req.userId;
            const challenges = await challengeService.getUserChallenges(userId);
            res.json({ success: true, data: challenges });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /challenges/active error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // POST /challenges/:id/join — Join a challenge
    app.post('/challenges/:id/join', auth_1.requireAuth, async (req, res) => {
        try {
            const userId = req.userId;
            const { id: challengeId } = req.params;
            if (!challengeId) {
                res.status(400).json({ success: false, error: 'Challenge ID is required' });
                return;
            }
            await challengeService.joinChallenge(userId, challengeId);
            res.json({ success: true, message: 'Successfully joined challenge' });
        }
        catch (err) {
            if (err.message === 'Challenge not found or not active') {
                res.status(404).json({ success: false, error: err.message });
                return;
            }
            if (err.message === 'Challenge has reached maximum participants') {
                res.status(409).json({ success: false, error: err.message });
                return;
            }
            logger_1.logger.error('[HTTP] POST /challenges/:id/join error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /challenges/:id/leaderboard — Get challenge leaderboard
    app.get('/challenges/:id/leaderboard', async (req, res) => {
        try {
            const { id: challengeId } = req.params;
            const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10)));
            if (!challengeId) {
                res.status(400).json({ success: false, error: 'Challenge ID is required' });
                return;
            }
            const leaderboard = await challengeService.getLeaderboard(challengeId, limit);
            res.json({ success: true, data: { challengeId, leaderboard } });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /challenges/:id/leaderboard error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /challenges/:id/leaderboard/me — Get user's rank in challenge leaderboard
    app.get('/challenges/:id/leaderboard/me', auth_1.requireAuth, async (req, res) => {
        try {
            const userId = req.userId;
            const { id: challengeId } = req.params;
            if (!challengeId) {
                res.status(400).json({ success: false, error: 'Challenge ID is required' });
                return;
            }
            const rank = await challengeService.getUserRank(userId, challengeId);
            if (!rank) {
                res.status(404).json({ success: false, error: 'User not participating in this challenge' });
                return;
            }
            res.json({ success: true, data: rank });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /challenges/:id/leaderboard/me error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // GET /challenges/:id — Get single challenge details
    app.get('/challenges/:id', async (req, res) => {
        try {
            const { id: challengeId } = req.params;
            if (!challengeId) {
                res.status(400).json({ success: false, error: 'Challenge ID is required' });
                return;
            }
            const challenge = await challengeService.getChallenge(challengeId);
            if (!challenge) {
                res.status(404).json({ success: false, error: 'Challenge not found' });
                return;
            }
            res.json({ success: true, data: challenge });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] GET /challenges/:id error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // PUT /challenges/:id/activate — Activate a draft challenge (internal only)
    app.put('/challenges/:id/activate', internalAuth_1.requireInternalToken, async (req, res) => {
        try {
            const { id: challengeId } = req.params;
            if (!challengeId) {
                res.status(400).json({ success: false, error: 'Challenge ID is required' });
                return;
            }
            const challenge = await challengeService.activateChallenge(challengeId);
            if (!challenge) {
                res.status(404).json({ success: false, error: 'Challenge not found or already active' });
                return;
            }
            res.json({ success: true, data: challenge });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] PUT /challenges/:id/activate error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    // DELETE /challenges/:id — Cancel a challenge (internal only)
    app.delete('/challenges/:id', internalAuth_1.requireInternalToken, async (req, res) => {
        try {
            const { id: challengeId } = req.params;
            if (!challengeId) {
                res.status(400).json({ success: false, error: 'Challenge ID is required' });
                return;
            }
            await challengeService.cancelChallenge(challengeId);
            res.json({ success: true, message: 'Challenge cancelled' });
        }
        catch (err) {
            logger_1.logger.error('[HTTP] DELETE /challenges/:id error', err);
            res.status(500).json(err('SRV_001', 'Internal server error'));
        }
    });
    return app;
}
function startHttpServer(port) {
    const app = createHttpApp();
    const server = app.listen(port, '0.0.0.0', () => {
        logger_1.logger.info(`[HTTP] Gamification HTTP server listening on port ${port}`);
    });
    return server;
}
//# sourceMappingURL=httpServer.js.map