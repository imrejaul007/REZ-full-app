"use strict";
/**
 * Store Visit Streak Worker — listens on 'store-visit-events' queue.
 * Applies correct day-diff streak logic and awards milestone coins.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORE_VISIT_QUEUE = void 0;
exports.processStoreVisitInternal = processStoreVisitInternal;
exports.startStoreVisitStreakWorker = startStoreVisitStreakWorker;
exports.stopStoreVisitStreakWorker = stopStoreVisitStreakWorker;
const bullmq_1 = require("bullmq");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
const httpServer_1 = require("../httpServer");
const streakMilestones_js_1 = require("../config/streakMilestones.js");
const intentCaptureService_1 = require("../services/intentCaptureService");
const logger = (0, logger_1.createServiceLogger)('store-visit-streak-worker');
function getMilestone(streak) {
    return streakMilestones_js_1.STREAK_MILESTONES.find((m) => m.days === streak) ?? null;
}
// IST timezone helpers (UTC+5:30)
// Copied from rezbackend/rez-backend-master/src/services/streakService.ts to ensure
// day boundaries are evaluated in IST, not UTC. Without this, users active between
// 00:00–05:30 IST (still "yesterday" in UTC) incorrectly lose their streak.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function getISTDateString(date) {
    const istTime = new Date(date.getTime() + IST_OFFSET_MS);
    return istTime.toISOString().split('T')[0]; // YYYY-MM-DD in IST
}
function isNextISTDay(earlier, later) {
    const earlyStr = getISTDateString(earlier);
    const laterStr = getISTDateString(later);
    const earlyDate = new Date(earlyStr);
    const laterDate = new Date(laterStr);
    const diffDays = Math.round((laterDate.getTime() - earlyDate.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays === 1;
}
function isSameISTDay(a, b) {
    return getISTDateString(a) === getISTDateString(b);
}
let _notifQueue = null;
function getNotifQueue() {
    if (!_notifQueue) {
        _notifQueue = new bullmq_1.Queue('notification-events', { connection: redis_1.bullmqRedis });
    }
    return _notifQueue;
}
async function enqueueCoinEarnedNotification(userId, coins, source) {
    const eventId = `coin-earned-${userId}-${source}`;
    await getNotifQueue().add('coin_earned', {
        eventId,
        eventType: 'coin_earned',
        userId,
        channels: ['push', 'in_app'],
        payload: {
            title: 'REZ Coins earned!',
            body: `+${coins} REZ coins landed in your wallet!`,
            channelId: 'rewards',
            priority: 'default',
            data: { coins, source },
        },
        category: 'behavioral',
        source: 'store-visit-streak-worker',
        createdAt: new Date().toISOString(),
    }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    // RTMN Commerce Memory: track coins earned as engagement intent
    (0, intentCaptureService_1.track)({ userId, event: 'coins_earned', intentKey: `gamification_coins_${source}`, properties: { coins, source } }).catch(() => { });
}
async function enqueueStreakMilestoneNotification(userId, streak, bonusCoins) {
    const eventId = `streak-milestone-${userId}-${streak}`;
    await getNotifQueue().add('streak_milestone', {
        eventId,
        eventType: 'streak_milestone',
        userId,
        channels: ['push', 'in_app'],
        payload: {
            title: `🔥 ${streak}-day streak!`,
            body: `You're on a ${streak}-day store visit streak! You earned ${bonusCoins} bonus REZ coins.`,
            channelId: 'gamification',
            priority: 'high',
            data: { streak, bonusCoins },
        },
        category: 'gamification',
        source: 'store-visit-streak-worker',
        createdAt: new Date().toISOString(),
    }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    // RTMN Commerce Memory: track streak milestone as engagement intent
    (0, intentCaptureService_1.track)({ userId, event: 'streak_milestone', intentKey: `gamification_streak_${streak}`, properties: { streak, bonusCoins } }).catch(() => { });
}
// CS-C3 FIX: Call wallet service FIRST, write ledger entry SECOND.
// Old pattern (removed): write ledger ($setOnInsert) → check upsertedCount → call wallet.
// Problem: if wallet service is down, ledger dedup key is consumed, BullMQ retry is skipped.
// New pattern: wallet FIRST → throw on failure (BullMQ retries safely) → ledger write on success.
async function awardBonusCoins(userId, coins, reason, dedupKey) {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        throw new Error(`[StreakWorker] Invalid userId in awardBonusCoins: ${userId}`);
    }
    // Step 1: Credit wallet via the wallet service. The wallet service handles its own
    // idempotency via dedupKey — if it's already credited, the wallet service returns true
    // idempotently without double-crediting.
    const credited = await (0, httpServer_1.creditCoinsViaWalletService)(userId, coins, dedupKey, reason);
    if (!credited) {
        // Throw so BullMQ retries. Safe to retry because no ledger dedup key was consumed yet.
        throw new Error(`[StreakWorker] Wallet credit failed for ${dedupKey} — will retry`);
    }
    // Step 2: Credit confirmed. Write the audit ledger entry (idempotent via $setOnInsert).
    // This records the achievement for audit/reconcile but is not the authoritative credit.
    const CoinLedger = mongoose_1.default.connection.collection('coinledgers');
    await CoinLedger.updateOne({ dedupKey }, {
        $setOnInsert: {
            userId,
            amount: coins,
            type: 'credit',
            source: 'streak_milestone',
            description: reason,
            dedupKey,
            createdAt: new Date(),
        },
    }, { upsert: true });
}
/**
 * processStoreVisitInternal — exported so httpServer POST /internal/visit
 * can call the same streak logic without going through BullMQ.
 */
async function processStoreVisitInternal(event) {
    return processStoreVisit(event);
}
/**
 * Processes a store visit event to update the user's daily and overall streaks.
 * Uses IST timezone for day boundary comparisons. Awards bonus coins at milestone streaks.
 * @param event - The store visit event with userId, storeId, and optional timestamp
 */
async function processStoreVisit(event) {
    // Use IST date string for day boundary comparisons so users active between
    // 00:00–05:30 IST (still "yesterday" in UTC) are not incorrectly penalised.
    const eventTs = event.timestamp ? new Date(event.timestamp) : new Date();
    const eventDate = getISTDateString(eventTs);
    const UserStreaks = mongoose_1.default.connection.collection('userstreaks');
    let newStreak;
    let action;
    // streakStartDate tracks when the current streak cycle began.
    // It is included in the milestone dedupKey so users can re-earn milestone
    // bonuses after losing and regaining a streak.
    let streakStartDate;
    // Atomic upsert — eliminates TOCTOU race where two concurrent workers
    // both read null and both call insertOne, creating duplicate streak docs.
    // returnDocument:'before' returns null if the doc was just inserted (new user).
    const preExisting = await UserStreaks.findOneAndUpdate({ userId: event.userId, type: 'store_visit' }, {
        $setOnInsert: {
            userId: event.userId,
            type: 'store_visit',
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: eventDate,
            streakStartDate: eventDate,
            lastStoreId: event.storeId,
            lastMerchantId: event.merchantId,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    }, { upsert: true, returnDocument: 'before' });
    if (!preExisting) {
        newStreak = 1;
        action = 'incremented';
        streakStartDate = eventDate;
    }
    else {
        const lastDate = preExisting.lastActivityDate;
        // Convert the stored IST date string back to a Date for IST-aware comparison.
        // Stored dates are already YYYY-MM-DD in IST, so parse as noon UTC to avoid
        // any single-day off-by-one from timezone shifts during Date construction.
        const lastDateAsDate = new Date(`${lastDate}T12:00:00Z`);
        if (isSameISTDay(lastDateAsDate, eventTs)) {
            // Already visited today (IST) — no change
            action = 'unchanged';
            newStreak = preExisting.currentStreak ?? 1;
            streakStartDate = preExisting.streakStartDate || lastDate;
        }
        else if (isNextISTDay(lastDateAsDate, eventTs)) {
            // Consecutive IST day — increment streak
            newStreak = (preExisting.currentStreak ?? 0) + 1;
            action = 'incremented';
            streakStartDate = preExisting.streakStartDate || lastDate;
            const longest = Math.max(newStreak, preExisting.longestStreak ?? 1);
            await UserStreaks.updateOne({ _id: preExisting._id }, {
                $set: {
                    currentStreak: newStreak,
                    longestStreak: longest,
                    lastActivityDate: eventDate,
                    lastStoreId: event.storeId,
                    lastMerchantId: event.merchantId,
                    updatedAt: new Date(),
                },
            });
        }
        else {
            // Gap > 1 IST day — reset streak. New cycle starts today.
            newStreak = 1;
            action = 'reset';
            streakStartDate = eventDate;
            await UserStreaks.updateOne({ _id: preExisting._id }, {
                $set: {
                    currentStreak: 1,
                    lastActivityDate: eventDate,
                    streakStartDate: eventDate,
                    lastStoreId: event.storeId,
                    lastMerchantId: event.merchantId,
                    updatedAt: new Date(),
                },
            });
        }
    }
    logger.info('[StreakWorker] Streak updated', { userId: event.userId, action, newStreak, eventDate });
    if (action === 'incremented') {
        const milestone = getMilestone(newStreak);
        if (milestone) {
            // dedupKey includes streakStartDate so the same milestone can be re-earned
            // in a new streak cycle after the previous one was broken and restarted.
            await awardBonusCoins(event.userId, milestone.coins, `${milestone.days}-day store visit streak bonus`, `streak-milestone-${event.userId}-${milestone.days}-${streakStartDate}`);
            await enqueueStreakMilestoneNotification(event.userId, newStreak, milestone.coins);
            await enqueueCoinEarnedNotification(event.userId, milestone.coins, 'streak_milestone');
            logger.info('[StreakWorker] Milestone reached', {
                userId: event.userId,
                streak: newStreak,
                coins: milestone.coins,
            });
        }
    }
}
exports.STORE_VISIT_QUEUE = 'store-visit-events';
let _worker = null;
/**
 * Starts the BullMQ store visit streak worker on the 'store-visit-events' queue.
 * Handles daily streak tracking, streak resets, and bonus coin awards at milestones.
 * @returns The BullMQ worker instance (singleton)
 */
function startStoreVisitStreakWorker() {
    if (_worker)
        return _worker;
    _worker = new bullmq_1.Worker(exports.STORE_VISIT_QUEUE, async (job) => {
        await processStoreVisit(job.data);
    }, {
        connection: redis_1.bullmqRedis,
        concurrency: 5,
        limiter: { max: 100, duration: 1000 },
    });
    _worker.on('failed', async (job, err) => {
        logger.error('[StreakWorker] Job failed', {
            jobId: job?.id,
            userId: job?.data?.userId,
            error: err.message,
            attempts: job?.attemptsMade,
        });
        // GAM-HIGH-01 FIX: DLQ writes must be awaited so errors propagate.
        // Throwing from an event handler crashes the process, so catch and log instead.
        if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
            try {
                const dlqKey = `dlq:${exports.STORE_VISIT_QUEUE}`;
                const entry = JSON.stringify({
                    jobId: job.id,
                    data: job.data,
                    error: err.message,
                    failedAt: new Date().toISOString(),
                    attempts: job.attemptsMade,
                });
                await redis_1.bullmqRedis.lpush(dlqKey, entry);
                await redis_1.bullmqRedis.ltrim(dlqKey, 0, 999);
                logger.info(`[DLQ] Job moved to dead-letter queue`, { queue: exports.STORE_VISIT_QUEUE, jobId: job.id });
            }
            catch (dlqErr) {
                logger.error('[DLQ] Failed to write to dead-letter queue', { queue: exports.STORE_VISIT_QUEUE, jobId: job?.id, dlqError: dlqErr?.message });
            }
        }
    });
    _worker.on('error', (err) => logger.error('[StreakWorker] Worker error: ' + err.message));
    logger.info('[StreakWorker] Started — queue: ' + exports.STORE_VISIT_QUEUE);
    return _worker;
}
async function stopStoreVisitStreakWorker() {
    if (_worker) {
        await _worker.close();
        _worker = null;
    }
    if (_notifQueue) {
        await _notifQueue.close();
        _notifQueue = null;
    }
}
//# sourceMappingURL=storeVisitStreakWorker.js.map