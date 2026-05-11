"use strict";
/**
 * Achievement Worker — listens on 'gamification-events' queue for visit_checked_in events.
 *
 * On each check-in it evaluates every achievement the user has not yet earned and awards
 * any whose condition is now satisfied.  Coins are credited via the same wallet/ledger
 * pattern used by the streak worker.  An achievement_unlocked notification is enqueued
 * to the notification-events queue.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACHIEVEMENT_QUEUE = exports.ACHIEVEMENTS = void 0;
exports.startAchievementWorker = startAchievementWorker;
exports.stopAchievementWorker = stopAchievementWorker;
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
const httpServer_1 = require("../httpServer");
const intentCaptureService_1 = require("../services/intentCaptureService");
const logger = (0, logger_1.createServiceLogger)('achievement-worker');
// C11 FIX: CANONICAL achievement definitions — this is the single source of
// truth for visit-count milestones and their coin awards.
//
// The VISIT_MILESTONES array in rezbackend/.../routes/visitStreakRoutes.ts MUST
// mirror the visit-count achievements listed here (first_checkin / fifth_checkin /
// tenth_checkin) so that what users see matches what they actually receive.
//
// When adding or changing visit-count thresholds or coin amounts here, update
// visitStreakRoutes.ts VISIT_MILESTONES simultaneously.
exports.ACHIEVEMENTS = [
    {
        id: 'first_checkin',
        name: 'First Visit',
        description: 'Complete your first store check-in',
        coins: 25,
        condition: 'visit_count >= 1',
        check: (s) => s.visit_count >= 1,
    },
    {
        id: 'fifth_checkin',
        name: 'Regular',
        description: 'Visit stores 5 times',
        coins: 75,
        condition: 'visit_count >= 5',
        check: (s) => s.visit_count >= 5,
    },
    {
        id: 'tenth_checkin',
        name: 'Loyal Customer',
        description: 'Visit stores 10 times',
        coins: 150,
        condition: 'visit_count >= 10',
        check: (s) => s.visit_count >= 10,
    },
    {
        id: 'first_streak',
        name: 'Streak Starter',
        description: 'Achieve a 3-day streak',
        coins: 50,
        condition: 'streak >= 3',
        check: (s) => s.streak >= 3,
    },
    {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Achieve a 7-day streak',
        coins: 150,
        condition: 'streak >= 7',
        check: (s) => s.streak >= 7,
    },
    {
        id: 'coin_century',
        name: 'Century Club',
        description: 'Earn 100 REZ coins',
        coins: 50,
        condition: 'total_coins >= 100',
        check: (s) => s.total_coins >= 100,
    },
    {
        id: 'coin_thousand',
        name: 'High Roller',
        description: 'Earn 1000 REZ coins',
        coins: 200,
        condition: 'total_coins >= 1000',
        check: (s) => s.total_coins >= 1000,
    },
];
// ── Queue reference ────────────────────────────────────────────────────────────
let _notifQueue = null;
function getNotifQueue() {
    if (!_notifQueue) {
        _notifQueue = new bullmq_1.Queue('notification-events', { connection: redis_1.bullmqRedis });
    }
    return _notifQueue;
}
// ── Helpers ───────────────────────────────────────────────────────────────────
async function getUserStats(userId) {
    const UserStreaks = mongoose_1.default.connection.collection('userstreaks');
    const Wallets = mongoose_1.default.connection.collection('wallets');
    const StoreVisits = mongoose_1.default.connection.collection('storevisits');
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error(`[AchievementWorker] Invalid userId: ${userId}`);
    }
    const userOid = new mongoose_1.default.Types.ObjectId(userId);
    // CS-H4 / BL-L3 fix: monolith writes userId as ObjectId; raw string queries return 0.
    // Use userOid consistently across all three collections.
    const [streakDoc, walletDoc, visitCount] = await Promise.all([
        UserStreaks.findOne({ userId: userOid, type: 'store_visit' }),
        Wallets.findOne({ user: userOid }),
        // H23 FIX: Only count COMPLETED visits — pending/cancelled visits must not
        // contribute to achievement milestones (matches visitStreakRoutes.ts behaviour).
        // GAM-CRIT-02 FIX: await countDocuments() explicitly — in Mongoose 8.x it always
        // returns a Promise; without await the resolved number is consumed by Promise.all
        // only after the outer await, but explicit await makes the intent unambiguous.
        await StoreVisits.countDocuments({ userId: userOid, status: 'completed' }),
    ]);
    // BE-GAM-003 FIX: Ensure all fallbacks consistently use ?? 0 and validate streak is a number
    const streak = streakDoc?.currentStreak ?? 0;
    if (typeof streak !== 'number' || isNaN(streak)) {
        logger.warn('[AchievementWorker] Invalid streak value, treating as 0', {
            userId,
            streak,
        });
    }
    return {
        visit_count: visitCount,
        streak: typeof streak === 'number' && !isNaN(streak) ? streak : 0,
        // GAM-MED-01 FIX: Add CoinEntry interface locally so walletDoc?.coins is no longer cast as any[].
        // Use rez coin balance only — balance.available is a combined total across
        // all coin types; achievements based on "coin count" should count REZ coins only.
        total_coins: walletDoc?.coins?.find((c) => c.type === 'rez')?.amount
            ?? walletDoc?.balance?.available
            ?? 0,
    };
}
async function getEarnedAchievementIds(userId) {
    const UserAchievements = mongoose_1.default.connection.collection('userachievements');
    const docs = await UserAchievements.find({ userId }, { projection: { achievementId: 1 } }).toArray();
    return new Set(docs.map((d) => d.achievementId));
}
async function awardAchievementCoins(userId, coins, achievementId, achievementName) {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error(`[AchievementWorker] Invalid userId in awardAchievementCoins: ${userId}`);
    }
    // BL-M2 / CS-C3 fix: call wallet service FIRST, write coinledger dedup entry SECOND.
    // Previous order (ledger first, wallet second) caused permanent orphaned credits when
    // the wallet service was unavailable: dedup key was consumed but wallet never credited,
    // and retries would see upsertedCount === 0 and skip the wallet call entirely.
    //
    // New order:
    //   1. Call wallet service (idempotencyKey is passed; wallet-service does its own dedup)
    //   2. Only on success: write coinledger entry to record the credit for audit/reconcile
    //   3. On failure: throw so BullMQ retries — no dedup key consumed, safe to retry
    const dedupKey = `achievement-${userId}-${achievementId}`;
    const credited = await (0, httpServer_1.creditCoinsViaWalletService)(userId, coins, dedupKey, `Achievement unlocked: ${achievementName}`);
    if (!credited) {
        logger.error('[AchievementWorker] Wallet credit failed — throwing so BullMQ retries the job', {
            userId,
            achievementId,
            coins,
            dedupKey,
        });
        throw new Error(`[AchievementWorker] Wallet credit failed for achievement ${achievementId} — will retry`);
    }
    // Credit confirmed — now write the audit ledger entry (idempotent via $setOnInsert).
    // If this write fails, the wallet was already credited — acceptable; reconcile can
    // detect coinledger gaps and backfill. This direction of failure is safe.
    const CoinLedger = mongoose_1.default.connection.collection('coinledgers');
    await CoinLedger.updateOne({ dedupKey }, {
        $setOnInsert: {
            userId,
            amount: coins,
            type: 'credit',
            source: 'achievement',
            description: `Achievement unlocked: ${achievementName}`,
            dedupKey,
            createdAt: new Date(),
        },
    }, { upsert: true });
}
async function enqueueAchievementNotification(userId, achievement) {
    // Stable eventId — no Date.now() so BullMQ retries of the same job
    // don't create duplicate notification queue entries.
    const eventId = `achievement-unlocked-${userId}-${achievement.id}`;
    await getNotifQueue().add('achievement_unlocked', {
        eventId,
        eventType: 'achievement_unlocked',
        userId,
        channels: ['push', 'in_app'],
        payload: {
            title: `Achievement unlocked: ${achievement.name}`,
            body: `${achievement.description} — +${achievement.coins} REZ coins!`,
            channelId: 'gamification',
            priority: 'high',
            data: {
                achievementId: achievement.id,
                coins: achievement.coins,
            },
        },
        category: 'gamification',
        source: 'achievement-worker',
        createdAt: new Date().toISOString(),
    }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    // RTMN Commerce Memory: track achievement as engagement intent
    (0, intentCaptureService_1.track)({ userId, event: 'achievement_unlocked', intentKey: `gamification_achievement_${achievement.id}`, properties: { achievementId: achievement.id, achievementName: achievement.name, coins: achievement.coins } }).catch(() => { });
}
/**
 * Processes check-in achievements for a user. Evaluates streak and milestone achievements
 * based on the user's visit history and awards coins for newly earned achievements.
 * @param event - The visit check-in event containing userId and timestamp
 */
async function processCheckinAchievements(event) {
    const { userId } = event;
    // Fetch current stats and already-earned achievement IDs concurrently
    const [stats, earnedIds] = await Promise.all([
        getUserStats(userId),
        getEarnedAchievementIds(userId),
    ]);
    logger.debug('[AchievementWorker] Evaluating achievements', { userId, stats });
    const UserAchievements = mongoose_1.default.connection.collection('userachievements');
    for (const achievement of exports.ACHIEVEMENTS) {
        if (earnedIds.has(achievement.id))
            continue;
        if (!achievement.check(stats))
            continue;
        // BL-M2 fix: credit wallet FIRST, write the achievement ledger entry SECOND.
        // Previous order (ledger first, wallet second) caused permanent orphaned achievements:
        // the dedup upsert consumed the idempotency key, so BullMQ retries saw
        // upsertedCount === 0 and skipped the wallet credit entirely — coins permanently lost.
        //
        // New order:
        //   1. Credit wallet (may throw — BullMQ retries; no ledger written yet, safe to retry)
        //   2. Only on wallet success: upsert the UserAchievements record (dedup guard)
        try {
            await awardAchievementCoins(userId, achievement.coins, achievement.id, achievement.name);
        }
        catch (walletErr) {
            logger.error('[AchievementWorker] Wallet credit failed — not marking achievement unlocked, BullMQ will retry', {
                userId,
                achievementId: achievement.id,
                error: walletErr?.message,
            });
            throw walletErr;
        }
        // Wallet credited — now record the achievement as unlocked (idempotent via $setOnInsert)
        const result = await UserAchievements.updateOne({ userId, achievementId: achievement.id }, {
            $setOnInsert: {
                userId,
                achievementId: achievement.id,
                earnedAt: new Date(),
                coinsAwarded: achievement.coins,
            },
        }, { upsert: true });
        if (result.upsertedCount === 0) {
            // Already inserted by a concurrent worker — wallet was credited above; this is fine.
            logger.debug('[AchievementWorker] Achievement already recorded (concurrent insert guard)', {
                userId,
                achievementId: achievement.id,
            });
            continue;
        }
        await enqueueAchievementNotification(userId, achievement);
        logger.info('[AchievementWorker] Achievement awarded', {
            userId,
            achievementId: achievement.id,
            name: achievement.name,
            coins: achievement.coins,
        });
    }
}
// ── Worker lifecycle ──────────────────────────────────────────────────────────
// Separate queue from 'gamification-events' to avoid competing consumers with worker.ts.
// The main worker forwards visit_checked_in events here after its own processing.
exports.ACHIEVEMENT_QUEUE = 'achievement-events';
let _worker = null;
/**
 * Starts the BullMQ achievement worker on the 'achievement-events' queue.
 * Processes visit_checked_in events to evaluate and award streak/milestone achievements.
 * @returns The BullMQ worker instance (singleton)
 */
function startAchievementWorker() {
    if (_worker)
        return _worker;
    _worker = new bullmq_1.Worker(exports.ACHIEVEMENT_QUEUE, async (job) => {
        const event = job.data;
        if (event.type !== 'visit_checked_in')
            return;
        await processCheckinAchievements(event);
    }, {
        connection: redis_1.bullmqRedis,
        concurrency: 5,
        limiter: { max: 100, duration: 1000 },
    });
    _worker.on('failed', async (job, err) => {
        logger.error('[AchievementWorker] Job failed', {
            jobId: job?.id,
            userId: job?.data?.userId,
            error: err.message,
            attempts: job?.attemptsMade,
        });
        // GAM-HIGH-01 FIX: DLQ writes must be awaited so errors propagate.
        // Throwing from an event handler crashes the process, so catch and log instead.
        if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
            try {
                const dlqKey = `dlq:${exports.ACHIEVEMENT_QUEUE}`;
                const entry = JSON.stringify({
                    jobId: job.id,
                    data: job.data,
                    error: err.message,
                    failedAt: new Date().toISOString(),
                    attempts: job.attemptsMade,
                });
                await redis_1.bullmqRedis.lpush(dlqKey, entry);
                await redis_1.bullmqRedis.ltrim(dlqKey, 0, 999);
                logger.info(`[DLQ] Job moved to dead-letter queue`, { queue: exports.ACHIEVEMENT_QUEUE, jobId: job.id });
            }
            catch (dlqErr) {
                logger.error('[DLQ] Failed to write to dead-letter queue', { queue: exports.ACHIEVEMENT_QUEUE, jobId: job?.id, dlqError: dlqErr?.message });
            }
        }
    });
    _worker.on('error', (err) => logger.error('[AchievementWorker] Worker error: ' + err.message));
    logger.info('[AchievementWorker] Started — queue: ' + exports.ACHIEVEMENT_QUEUE);
    return _worker;
}
async function stopAchievementWorker() {
    if (_worker) {
        await _worker.close();
        _worker = null;
    }
    if (_notifQueue) {
        await _notifQueue.close();
        _notifQueue = null;
    }
}
//# sourceMappingURL=achievementWorker.js.map