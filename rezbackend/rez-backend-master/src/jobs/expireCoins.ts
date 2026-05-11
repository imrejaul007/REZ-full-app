import * as cron from 'node-cron';
import mongoose from 'mongoose';
import { CoinTransaction, ICoinTransaction } from '../models/CoinTransaction';
import { Wallet } from '../models/Wallet';
import { User } from '../models/User';
import PushNotificationService from '../services/pushNotificationService';
import redisService from '../services/redisService';
import { logger } from '../config/logger';
import { getCachedWalletConfig, invalidateWalletCache } from '../services/walletCacheService';
import { CURRENCY_RULES } from '../config/currencyRules';
import { ledgerService } from '../services/ledgerService';
import { coinExpiryBurnCounter } from '../config/prometheus';

/**
 * Coin Expiry Job
 *
 * This background job runs daily at 1:00 AM to manage coin expiration.
 *
 * What it does:
 * 1. Finds all coin transactions with expiresAt date in the past
 * 2. Creates expiry transactions to deduct expired coins
 * 3. Updates user coin balances
 * 4. Sends notifications to affected users
 * 5. Logs expiry statistics for monitoring
 *
 * This ensures coins don't accumulate indefinitely and encourages users
 * to use their earned coins within a reasonable timeframe.
 */

let expiryJob: ReturnType<typeof cron.schedule> | null = null;
let isRunning = false;

// Configuration
const CRON_SCHEDULE = '0 1 * * *'; // Daily at 1:00 AM
const NOTIFICATION_BATCH_SIZE = 50; // Send notifications in batches to avoid overwhelming the system

interface ExpiryStats {
  usersAffected: number;
  totalCoinsExpired: number;
  transactionsCreated: number;
  notificationsSent: number;
  notificationsFailed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
}

interface UserExpiryData {
  userId: string;
  expiredAmount: number;
  newBalance: number;
  expiredTransactions: Array<{
    id: string;
    source: string;
    amount: number;
    earnedDate: Date;
  }>;
}

/**
 * CARLOS retention fix: Send 7-day advance expiry warning.
 *
 * Why 7 days: users need planning time to visit a store. At 48 h they panic
 * and may ignore it; at 7 days they can actually act (schedule a store visit,
 * plan a purchase). This is the "urgency without anxiety" window.
 *
 * Dedup key: `lifecycle:coin-expiry-7d:<userId>` (TTL = 7 days).
 * The notification is sent only once per expiry batch per user.
 */
async function sendSevenDayExpiryWarning(): Promise<{ notified: number; failed: number }> {
  const stats = { notified: 0, failed: 0 };

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Coins expiring in the 6-7 day window (to avoid overlap with 48h warning)
    // MP-D001 FIX: added .limit() so this early-warning scan never loads more
    // than 5 000 documents into the heap at once.  Re-schedule backfills the
    // remainder on the next cron tick.  Without a limit, a spike in expiring
    // coins (e.g. a bulk promotional award) would materialise the full result
    // into one large array and trigger a stop-the-world GC pause.
    const soonExpiringTransactions = await CoinTransaction.find({
      type: { $in: ['earned', 'branded_award'] },
      expiresAt: { $gt: sixDaysFromNow, $lte: sevenDaysFromNow },
      $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
      'metadata.sevenDayExpiryWarningNotified': { $ne: true },
    })
      .sort({ user: 1, expiresAt: 1 })
      .limit(5000);

    if (soonExpiringTransactions.length === 0) {
      logger.info('[COIN EXPIRY] No coins in the 6-7 day expiry window');
      return stats;
    }

    // Group by user
    const userExpiryMap = new Map<string, { totalAmount: number; earliestExpiry: Date; txIds: string[] }>();
    for (const tx of soonExpiringTransactions) {
      const userId = tx.user.toString();
      if (!userExpiryMap.has(userId)) {
        userExpiryMap.set(userId, { totalAmount: 0, earliestExpiry: tx.expiresAt!, txIds: [] });
      }
      const data = userExpiryMap.get(userId)!;
      data.totalAmount += tx.amount;
      data.txIds.push(String(tx._id));
      if (tx.expiresAt! < data.earliestExpiry) data.earliestExpiry = tx.expiresAt!;
    }

    logger.info(`[COIN EXPIRY] Sending 7-day advance warning to ${userExpiryMap.size} users`);

    const userIds = Array.from(userExpiryMap.keys());
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id phoneNumber profile.firstName')
      .lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    for (const [userId, data] of userExpiryMap.entries()) {
      try {
        const user = userMap.get(userId);
        if (!user?.phoneNumber) continue;

        // Dedup via Redis — skip if already notified for this expiry window
        const dedupKey = `lifecycle:coin-expiry-7d:${userId}`;
        try {
          const alreadyNotified = await redisService.get(dedupKey);
          if (alreadyNotified) continue;
        } catch {
          // Redis unavailable — proceed, worst case user gets a duplicate
        }

        const expiryDateStr = data.earliestExpiry.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const firstName = (user as any).profile?.firstName || '';
        const greeting = firstName ? `${firstName}, ` : '';

        await PushNotificationService.sendPushToUser(userId, {
          title: `${greeting}your ${data.totalAmount} coins expire in 7 days`,
          body: `Use them at a partner store before ${expiryDateStr} — tap to find stores near you.`,
          data: {
            screen: 'wallet',
            highlight: 'coins-7d-warning',
            action: 'spend-coins',
          },
        });

        stats.notified++;

        // Mark as warned in Redis (7 day TTL) and on the transaction records
        try {
          await redisService.set(dedupKey, '1', 7 * 24 * 60 * 60);
        } catch {
          /* continue even if Redis write fails */
        }

        await CoinTransaction.updateMany(
          { _id: { $in: data.txIds } },
          { $set: { 'metadata.sevenDayExpiryWarningNotified': true } },
        );
      } catch (err) {
        stats.failed++;
        logger.error(`[COIN EXPIRY] Failed 7-day warning for user ${userId}:`, err as Error);
      }
    }
  } catch (error) {
    logger.error('[COIN EXPIRY] Error in 7-day expiry warning:', error);
  }

  return stats;
}

/**
 * Send pre-expiry notifications for coins expiring within 48 hours.
 * Runs before the actual expiry processing to give users a chance to use their coins.
 */
async function sendPreExpiryNotifications(): Promise<{ notified: number; failed: number }> {
  const stats = { notified: 0, failed: 0 };

  try {
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find earned/branded transactions expiring within 48 hours that haven't been notified
    // BUG-012: Added .limit(50000) to prevent unbounded memory load for large
    // datasets; the cursor-based expiry loop already handles streaming but
    // this pre-expiry notification query loads results into memory.
    const soonExpiringTransactions = await CoinTransaction.find({
      type: { $in: ['earned', 'branded_award'] },
      expiresAt: { $gt: now, $lte: fortyEightHoursFromNow },
      $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
      'metadata.expiryWarningNotified': { $ne: true },
    })
      .sort({ user: 1, expiresAt: 1 })
      .limit(50000);

    if (soonExpiringTransactions.length === 0) {
      logger.info('✨ [COIN EXPIRY] No coins expiring within 48h');
      return stats;
    }

    // Group by user
    const userExpiryMap = new Map<string, { totalAmount: number; earliestExpiry: Date; txIds: string[] }>();

    for (const tx of soonExpiringTransactions) {
      const userId = tx.user.toString();
      if (!userExpiryMap.has(userId)) {
        userExpiryMap.set(userId, { totalAmount: 0, earliestExpiry: tx.expiresAt!, txIds: [] });
      }
      const data = userExpiryMap.get(userId)!;
      data.totalAmount += tx.amount;
      data.txIds.push(String(tx._id));
      if (tx.expiresAt! < data.earliestExpiry) {
        data.earliestExpiry = tx.expiresAt!;
      }
    }

    logger.info(`⏰ [COIN EXPIRY] Sending pre-expiry notifications to ${userExpiryMap.size} users`);

    // Batch fetch all users to avoid N+1 queries
    const expiryUserIds = Array.from(userExpiryMap.keys());
    const expiryUsers = await User.find({ _id: { $in: expiryUserIds } })
      .select('_id phoneNumber')
      .lean();
    const expiryUserMap = new Map(expiryUsers.map((u) => [String(u._id), u]));

    for (const [userId, data] of userExpiryMap.entries()) {
      try {
        const user = expiryUserMap.get(userId);
        if (!user?.phoneNumber) continue;

        const expiryDateStr = data.earliestExpiry.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

        await PushNotificationService.sendCoinsExpiringSoon(user.phoneNumber, data.totalAmount, expiryDateStr);

        stats.notified++;

        // Mark these transactions as warned so we don't notify again
        await CoinTransaction.updateMany(
          { _id: { $in: data.txIds } },
          { $set: { 'metadata.expiryWarningNotified': true } },
        );
      } catch (notifErr) {
        stats.failed++;
        if (process.env.NODE_ENV === 'development') {
          logger.info(`[COIN EXPIRY] Failed to send pre-expiry notification for user ${userId}:`, notifErr);
        }
      }
    }
  } catch (error) {
    logger.error('❌ [COIN EXPIRY] Error in pre-expiry notifications:', error);
  }

  return stats;
}

/**
 * Send urgency push notifications at 24h and 6h before expiry
 * Includes nearby stores to encourage immediate spending
 */
async function sendUrgencyPushNotifications(): Promise<{ notified: number; failed: number }> {
  const stats = { notified: 0, failed: 0 };

  try {
    const now = new Date();

    // 24-hour warning
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyFourHourTransactions = await CoinTransaction.find({
      type: { $in: ['earned', 'branded_award'] },
      expiresAt: { $gt: now, $lte: twentyFourHoursFromNow },
      twentyFourHourWarningSent: { $ne: true },
      $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
    }).sort({ user: 1, expiresAt: 1 });

    if (twentyFourHourTransactions.length > 0) {
      const userTxMap = new Map<string, { amount: number; txIds: string[] }>();
      for (const tx of twentyFourHourTransactions) {
        const userId = tx.user.toString();
        if (!userTxMap.has(userId)) userTxMap.set(userId, { amount: 0, txIds: [] });
        const data = userTxMap.get(userId)!;
        data.amount += tx.amount;
        data.txIds.push(String(tx._id));
      }

      const users = await User.find({ _id: { $in: Array.from(userTxMap.keys()) } })
        .select('_id phoneNumber profile.location')
        .lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));

      for (const [userId, data] of userTxMap.entries()) {
        try {
          const user = userMap.get(userId);
          if (!user?.phoneNumber) continue;

          // Get nearby stores
          const Store = mongoose.model('Store');
          let nearbyStores = [];
          if ((user as any).profile?.location?.coordinates) {
            const [lng, lat] = (user as any).profile.location.coordinates;
            nearbyStores = await Store.find({
              isActive: true,
              'location.coordinates': {
                $near: {
                  $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                  },
                  $maxDistance: 5000, // 5km
                },
              },
            })
              .limit(3)
              .select('name')
              .lean();
          } else {
            nearbyStores = await Store.find({ isActive: true }).limit(3).select('name').lean();
          }

          const storeNames = nearbyStores.map((s: any) => s.name).join(', ');

          await PushNotificationService.sendPushToUser(userId, {
            title: `⚡ Your ${data.amount} coins expire in 24 hours!`,
            body: storeNames
              ? `${storeNames} accept them — use them today!`
              : 'Use them at nearby stores before they expire',
            data: {
              screen: 'wallet',
              highlight: 'coins-24h-warning',
              action: 'spend-coins',
            },
          });

          stats.notified++;

          // Mark as warned
          await CoinTransaction.updateMany({ _id: { $in: data.txIds } }, { $set: { twentyFourHourWarningSent: true } });
        } catch (err) {
          stats.failed++;
          if (process.env.NODE_ENV === 'development') {
            logger.info(`[COIN EXPIRY] Failed 24h notification for user ${userId}:`, err);
          }
        }
      }
    }

    // 6-hour warning
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const sixHourTransactions = await CoinTransaction.find({
      type: { $in: ['earned', 'branded_award'] },
      expiresAt: { $gt: now, $lte: sixHoursFromNow },
      sixHourWarningSent: { $ne: true },
      $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
    }).sort({ user: 1, expiresAt: 1 });

    if (sixHourTransactions.length > 0) {
      const userTxMap = new Map<string, { amount: number; hoursLeft: number; txIds: string[] }>();
      for (const tx of sixHourTransactions) {
        const userId = tx.user.toString();
        if (!userTxMap.has(userId)) {
          const hoursLeft = Math.ceil((tx.expiresAt!.getTime() - now.getTime()) / (60 * 60 * 1000));
          userTxMap.set(userId, { amount: 0, hoursLeft, txIds: [] });
        }
        const data = userTxMap.get(userId)!;
        data.amount += tx.amount;
        data.txIds.push(String(tx._id));
      }

      const users = await User.find({ _id: { $in: Array.from(userTxMap.keys()) } })
        .select('_id phoneNumber profile.location')
        .lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));

      for (const [userId, data] of userTxMap.entries()) {
        try {
          const user = userMap.get(userId);
          if (!user?.phoneNumber) continue;

          // Get nearby stores
          const Store = mongoose.model('Store');
          let nearbyStores = [];
          if ((user as any).profile?.location?.coordinates) {
            const [lng, lat] = (user as any).profile.location.coordinates;
            nearbyStores = await Store.find({
              isActive: true,
              'location.coordinates': {
                $near: {
                  $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                  },
                  $maxDistance: 5000, // 5km
                },
              },
            })
              .limit(3)
              .select('name')
              .lean();
          } else {
            nearbyStores = await Store.find({ isActive: true }).limit(3).select('name').lean();
          }

          const storeNames = nearbyStores.map((s: any) => s.name).join(', ');

          await PushNotificationService.sendPushToUser(userId, {
            title: `🚨 ${data.amount} coins expire in ${data.hoursLeft}h!`,
            body: storeNames
              ? `${storeNames} nearby accept them — spend now!`
              : 'Spend them immediately at nearby stores!',
            data: {
              screen: 'wallet',
              highlight: 'coins-6h-warning',
              action: 'urgent-spend',
              urgency: 'high',
            },
          });

          stats.notified++;

          // Mark as warned
          await CoinTransaction.updateMany({ _id: { $in: data.txIds } }, { $set: { sixHourWarningSent: true } });
        } catch (err) {
          stats.failed++;
          if (process.env.NODE_ENV === 'development') {
            logger.info(`[COIN EXPIRY] Failed 6h notification for user ${userId}:`, err);
          }
        }
      }
    }

    if (twentyFourHourTransactions.length > 0 || sixHourTransactions.length > 0) {
      logger.info(
        `⏰ [COIN EXPIRY] Urgency push notifications sent: ${stats.notified} notified, ${stats.failed} failed`,
      );
    }
  } catch (error) {
    logger.error('❌ [COIN EXPIRY] Error in urgency push notifications:', error);
  }

  return stats;
}

/**
 * Find and process expired coins for all users
 */
async function processExpiredCoins(): Promise<ExpiryStats> {
  const stats: ExpiryStats = {
    usersAffected: 0,
    totalCoinsExpired: 0,
    transactionsCreated: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
    errors: [],
  };
  const affectedUserIds = new Set<string>();

  try {
    const now = new Date();

    // Backfill: Find branded coin transactions without expiresAt and set it based on config
    try {
      let brandedExpiryDays: number;
      try {
        const config = await getCachedWalletConfig();
        brandedExpiryDays = config?.coinExpiryConfig?.branded?.expiryDays ?? CURRENCY_RULES.branded.expiryDays;
      } catch {
        brandedExpiryDays = CURRENCY_RULES.branded.expiryDays;
      }

      if (brandedExpiryDays > 0) {
        const cutoffDate = new Date(now);
        cutoffDate.setDate(cutoffDate.getDate() - brandedExpiryDays);

        // Find branded_award transactions created before cutoff that have no expiresAt
        const backfillResult = await CoinTransaction.updateMany(
          {
            type: 'branded_award',
            expiresAt: { $exists: false },
            createdAt: { $lte: cutoffDate },
            $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
          },
          [
            {
              $set: {
                expiresAt: {
                  $add: ['$createdAt', brandedExpiryDays * 24 * 60 * 60 * 1000],
                },
              },
            },
          ],
        );
        if (backfillResult.modifiedCount > 0) {
          logger.info(
            `[COIN EXPIRY] Backfilled expiresAt on ${backfillResult.modifiedCount} branded coin transactions`,
          );
        }

        // Also backfill newer branded coins that don't have expiresAt yet (not expired but need the field)
        await CoinTransaction.updateMany(
          {
            type: 'branded_award',
            expiresAt: { $exists: false },
            createdAt: { $gt: cutoffDate },
            $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
          },
          [
            {
              $set: {
                expiresAt: {
                  $add: ['$createdAt', brandedExpiryDays * 24 * 60 * 60 * 1000],
                },
              },
            },
          ],
        );
      }
    } catch (backfillErr) {
      logger.error('[COIN EXPIRY] Branded coin backfill error:', backfillErr);
    }

    // MP-D001 FIX: Previously this query loaded the entire expired-transactions
    // collection into the Node.js heap in one shot.  On a production database with
    // millions of coin transactions the full result set can easily exceed several
    // hundred MB, causing a stop-the-world GC pause and, in the worst case, an
    // OOM crash.  We now use a Mongoose cursor so documents are streamed one-by-one
    // and the heap footprint stays proportional to a single document, not the full
    // collection.  The populate() call is replaced with explicit per-batch user
    // lookups (already done later in the job) because populate() on a cursor is
    // not supported in Mongoose.
    const expiredCursor = CoinTransaction.find({
      type: { $in: ['earned', 'branded_award'] },
      expiresAt: { $lte: now, $ne: null },
      // Only process transactions that haven't been marked as expired yet
      $or: [{ metadata: { $exists: false } }, { 'metadata.isExpired': { $ne: true } }],
    })
      .select('_id user amount source expiresAt type metadata')
      .sort({ user: 1, expiresAt: 1 })
      .cursor();

    const expiredTransactions: any[] = [];
    for await (const doc of expiredCursor) {
      expiredTransactions.push(doc);
    }

    logger.info(`💰 [COIN EXPIRY] Found ${expiredTransactions.length} expired coin transactions`);

    if (expiredTransactions.length === 0) {
      return stats;
    }

    // Separate branded_award from earned/bonus transactions — branded coins don't affect ReZ balance
    const brandedTransactions = expiredTransactions.filter((t) => (t as any).type === 'branded_award');
    const rezTransactions = expiredTransactions.filter((t) => (t as any).type !== 'branded_award');

    // --- Process branded coin expirations (wallet.brandedCoins only, no ReZ balance impact) ---
    if (brandedTransactions.length > 0) {
      const brandedByUser = new Map<string, Array<{ id: string; amount: number; merchantId?: string }>>();
      for (const tx of brandedTransactions) {
        const userId = tx.user.toString();
        if (!brandedByUser.has(userId)) brandedByUser.set(userId, []);
        brandedByUser.get(userId)!.push({
          id: String(tx._id),
          amount: tx.amount,
          merchantId: (tx as any).metadata?.storeId?.toString() || (tx as any).metadata?.merchantId?.toString(),
        });
      }

      for (const [userId, txs] of brandedByUser.entries()) {
        try {
          // Atomically deduct branded coin amounts per merchant using $inc.
          // This replaces the read-modify-save pattern which was susceptible to a
          // lost-update race: two concurrent job instances would each load the wallet,
          // mutate in memory, and then the last save would silently overwrite the first,
          // causing only one deduction instead of two (or a complete miss if the same
          // merchantId was updated twice).
          for (const tx of txs) {
            if (tx.merchantId) {
              await (Wallet as any).findOneAndUpdate(
                {
                  user: new mongoose.Types.ObjectId(userId),
                  'brandedCoins.merchantId': tx.merchantId,
                },
                {
                  $inc: { 'brandedCoins.$.amount': -tx.amount },
                },
              );
            }
          }

          // Mark as expired (no CoinTransaction 'expired' record for branded — it would corrupt ReZ balance).
          // Status guard ensures idempotency: a second run will be a no-op for records already marked.
          await CoinTransaction.updateMany(
            {
              _id: { $in: txs.map((t) => t.id) },
              'metadata.isExpired': { $ne: true },
            },
            { $set: { 'metadata.isExpired': true, 'metadata.expiredAt': now } },
          );

          const totalBranded = txs.reduce((s, t) => s + t.amount, 0);
          affectedUserIds.add(userId);
          stats.totalCoinsExpired += totalBranded;
          // --- GAP FIX #4: Prometheus burn counter for branded coin expiry ---
          coinExpiryBurnCounter.inc({ coin_type: 'branded' }, totalBranded);
          logger.info('coin_expiry_burn', {
            event: 'coin_expiry_burn',
            coin_type: 'branded',
            userId,
            amount: totalBranded,
            txCount: txs.length,
            timestamp: new Date().toISOString(),
          });
          logger.info(`   ✓ User ${userId}: ${totalBranded} branded coins expired`);
        } catch (err: any) {
          logger.error(`   ✗ Failed to expire branded coins for user ${userId}: ` + err.message);
          stats.errors.push({ userId, error: err.message || 'Branded expiry error' });
        }
      }
    }

    // --- Process ReZ/promo coin expirations (affects ReZ balance via CoinTransaction) ---

    // Group by user. Track the promo sub-balance separately so we can also decrement
    // wallet.coins[type=promo].amount. Without this, getCoinUsageOrder() continues to
    // surface expired promo coins in the redemption pipeline.
    // Promo coin transactions are distinguishable from ReZ by having a top-level expiresAt
    // (ReZ coins have expiryDays=0 and therefore never receive an expiresAt).
    interface UserExpiryDataWithPromo extends UserExpiryData {
      promoExpiredAmount: number;
    }
    const userExpiryMap = new Map<string, UserExpiryDataWithPromo>();

    for (const transaction of rezTransactions) {
      const typedTransaction = transaction as ICoinTransaction;
      const userId = typedTransaction.user.toString();

      if (!userExpiryMap.has(userId)) {
        userExpiryMap.set(userId, {
          userId,
          expiredAmount: 0,
          newBalance: 0,
          expiredTransactions: [],
          promoExpiredAmount: 0,
        });
      }

      const userData = userExpiryMap.get(userId)!;
      userData.expiredAmount += typedTransaction.amount;
      userData.expiredTransactions.push({
        id: String(typedTransaction._id),
        source: typedTransaction.source,
        amount: typedTransaction.amount,
        earnedDate: typedTransaction.createdAt,
      });

      // Promo coins always carry a top-level expiresAt; pure ReZ coins do not.
      if (typedTransaction.expiresAt) {
        userData.promoExpiredAmount += typedTransaction.amount;
      }
    }

    logger.info(
      `👥 [COIN EXPIRY] Processing expiry for ${userExpiryMap.size} users (ReZ/promo) + ${brandedTransactions.length} branded txns`,
    );

    // BULL-002 FIX: Batch processing to prevent event-loop starvation.
    // Sequential loop with 100K+ users caused event-loop blocking and worker stalls.
    const USER_BATCH_SIZE = 100;
    const BATCH_DELAY_MS = 500;

    // Process each user's expired ReZ/promo coins
    const rezUserEntries = Array.from(userExpiryMap.entries());
    for (let i = 0; i < rezUserEntries.length; i += USER_BATCH_SIZE) {
      const batch = rezUserEntries.slice(i, i + USER_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async ([userId, expiryData]) => {
          try {
            // Create expiry transaction (this will deduct from ReZ balance)
            const expiryTransaction = await CoinTransaction.createTransaction(
              userId,
              'expired',
              expiryData.expiredAmount,
              'expiry',
              `${expiryData.expiredAmount} coins expired from ${expiryData.expiredTransactions.length} transaction(s)`,
              {
                expiredTransactionIds: expiryData.expiredTransactions.map((t) => t.id),
                expiredSources: [...new Set(expiryData.expiredTransactions.map((t) => t.source))],
                expiryDate: now,
              },
            );

            // Deduct expired amount from Wallet balance atomically.
            // BUG FIX (promo coin expiry): Also decrement wallet.coins[type=promo].amount for any
            // promo sub-balance so the redemption pipeline stops counting them as spendable.
            const walletIncFields: Record<string, number> = {
              'balance.available': -expiryData.expiredAmount,
              'balance.total': -expiryData.expiredAmount,
            };
            if (expiryData.promoExpiredAmount > 0) {
              walletIncFields['coins.$[promoSlot].amount'] = -expiryData.promoExpiredAmount;
            }
            // NOTE: coinExpiry.ts (the newer job) uses the same $gte guard pattern.
            // Both jobs coexist: coinExpiry.ts handles standard + branded coin expiry,
            // expireCoins.ts handles the legacy per-user aggregated expiry path.
            await Wallet.findOneAndUpdate(
              { user: new mongoose.Types.ObjectId(userId), 'balance.available': { $gte: expiryData.expiredAmount } },
              { $inc: walletIncFields },
              expiryData.promoExpiredAmount > 0 ? { arrayFilters: [{ 'promoSlot.type': 'promo' }] } : {},
            );
            invalidateWalletCache(userId).catch((err) =>
              logger.error('[ExpireCoins] Wallet cache invalidation failed after coin expiry', {
                error: err.message,
                userId,
              }),
            );

            // Mark original transactions as expired
            await CoinTransaction.updateMany(
              {
                _id: { $in: expiryData.expiredTransactions.map((t) => t.id) },
              },
              {
                $set: {
                  'metadata.isExpired': true,
                  'metadata.expiredAt': now,
                  'metadata.expiryTransactionId': expiryTransaction._id,
                },
              },
            );

            // Create ledger entry for coin expiry (fire-and-forget)
            const userAccountId = new mongoose.Types.ObjectId(userId);
            const expiredPoolId = ledgerService.getPlatformAccountId('expired_pool');
            ledgerService
              .recordEntry({
                debitAccount: { type: 'user_wallet', id: userAccountId },
                creditAccount: { type: 'expired_pool', id: expiredPoolId },
                amount: expiryData.expiredAmount,
                coinType: 'rez',
                operationType: 'coin_expiry',
                referenceId: String(expiryTransaction._id),
                referenceModel: 'CoinTransaction',
                metadata: { description: `${expiryData.expiredAmount} coins expired` },
              })
              .catch((err: any) => logger.error('[COIN EXPIRY] Ledger entry failed:', err));

            expiryData.newBalance = expiryTransaction.balance;

            affectedUserIds.add(userId);
            stats.totalCoinsExpired += expiryData.expiredAmount;
            stats.transactionsCreated++;

            // --- GAP FIX #4: Prometheus burn counter + structured log for rez/promo expiry ---
            coinExpiryBurnCounter.inc({ coin_type: 'rez' }, expiryData.expiredAmount);
            logger.info('coin_expiry_burn', {
              event: 'coin_expiry_burn',
              coin_type: 'rez',
              userId,
              amount: expiryData.expiredAmount,
              newBalance: expiryData.newBalance,
              txCount: expiryData.expiredTransactions.length,
              sources: [...new Set(expiryData.expiredTransactions.map((t) => t.source))],
              expiryTransactionId: expiryTransaction._id?.toString() || null,
              timestamp: new Date().toISOString(),
            });

            logger.info(
              `   ✓ User ${userId}: ${expiryData.expiredAmount} coins expired, new balance: ${expiryData.newBalance}`,
            );
          } catch (error: any) {
            logger.error(`   ✗ Failed to process expiry for user ${userId}: ` + error.message);
            stats.errors.push({
              userId,
              error: error.message || 'Unknown error',
            });
          }
        }),
      );

      // Aggregate results sequentially (no awaits inside)
      for (let r = 0; r < results.length; r++) {
        const result = results[r];
        const [, expiryData] = batch[r];
        if (result.status === 'fulfilled') {
          if (expiryData.newBalance !== undefined) {
            affectedUserIds.add(expiryData.userId);
            stats.totalCoinsExpired += expiryData.expiredAmount;
            stats.transactionsCreated++;
          }
        } else {
          logger.error(`   ✗ Failed to process expiry for user ${expiryData.userId}: ` + result.reason?.message);
          stats.errors.push({ userId: expiryData.userId, error: result.reason?.message || 'Unknown error' });
        }
      }

      // Brief pause between batches to allow other queued operations
      if (i + USER_BATCH_SIZE < rezUserEntries.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Build combined notification list: ReZ/promo expirations + branded expirations
    const allExpiryData: UserExpiryData[] = Array.from(userExpiryMap.values());

    // Add branded coin users to notification list
    if (brandedTransactions.length > 0) {
      const brandedByUserForNotif = new Map<string, number>();
      for (const tx of brandedTransactions) {
        const uid = tx.user.toString();
        brandedByUserForNotif.set(uid, (brandedByUserForNotif.get(uid) || 0) + tx.amount);
      }
      for (const [uid, amt] of brandedByUserForNotif.entries()) {
        // Only add if not already in the ReZ list (avoid duplicate notifications)
        if (!userExpiryMap.has(uid)) {
          allExpiryData.push({
            userId: uid,
            expiredAmount: amt,
            newBalance: 0, // branded coins have separate balance
            expiredTransactions: [],
          });
        } else {
          // Merge branded amount into existing entry for combined notification
          const existing = allExpiryData.find((e) => e.userId === uid);
          if (existing) existing.expiredAmount += amt;
        }
      }
    }

    // Send notifications in batches
    for (let i = 0; i < allExpiryData.length; i += NOTIFICATION_BATCH_SIZE) {
      const batch = allExpiryData.slice(i, i + NOTIFICATION_BATCH_SIZE);
      await sendExpiryNotifications(batch, stats);

      // Small delay between batches
      if (i + NOTIFICATION_BATCH_SIZE < allExpiryData.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Set final unique user count
    stats.usersAffected = affectedUserIds.size;
  } catch (error: any) {
    logger.error('❌ [COIN EXPIRY] Error processing expired coins:', error);
    stats.errors.push({
      userId: 'SYSTEM',
      error: error.message || 'Unknown error',
    });
  }

  return stats;
}

/**
 * Send expiry notifications to users
 */
async function sendExpiryNotifications(userExpiryData: UserExpiryData[], stats: ExpiryStats): Promise<void> {
  const notificationService = PushNotificationService;

  // Batch fetch all users to avoid N+1 queries
  const notifUserIds = userExpiryData.map((d) => d.userId);
  const notifUsers = await User.find({ _id: { $in: notifUserIds } })
    .select('_id phoneNumber profile.firstName email')
    .lean();
  const notifUserMap = new Map(notifUsers.map((u) => [String(u._id), u]));

  for (const userData of userExpiryData) {
    try {
      // Get user details for notification (batch-fetched)
      const user = notifUserMap.get(String(userData.userId));

      if (!user) {
        logger.warn(`⚠️ [COIN EXPIRY] User ${userData.userId} not found for notification`);
        continue;
      }

      const firstName = user.profile?.firstName || 'Valued Customer';

      // Prepare notification message
      const title = 'Coins Expired';
      const message = `Hi ${firstName}, ${userData.expiredAmount} coins have expired from your account. Your new balance is ${userData.newBalance} coins. Earn and use coins before they expire!`;

      // Try to send notification
      try {
        await notificationService.sendOrderUpdate('COIN_EXPIRY', user.phoneNumber, title, message);
        stats.notificationsSent++;
        logger.info(`   📧 Notification sent to user ${userData.userId}`);
      } catch (notifError: any) {
        logger.error(`   ✗ Failed to send notification to ${userData.userId}: ` + notifError.message);
        stats.notificationsFailed++;
      }
    } catch (error: any) {
      logger.error(`❌ [COIN EXPIRY] Error sending notification to ${userData.userId}: ` + error.message);
      stats.notificationsFailed++;
    }
  }
}

/**
 * Initialize and start the expiry job
 */
export function startCoinExpiryJob(): void {
  if (expiryJob) {
    logger.info('⚠️ [COIN EXPIRY] Job already running');
    return;
  }

  logger.info(`💰 [COIN EXPIRY] Starting coin expiry job (runs daily at 1:00 AM)`);

  expiryJob = cron.schedule(CRON_SCHEDULE, async () => {
    // Prevent concurrent executions (local flag)
    if (isRunning) {
      logger.info('⏭️ [COIN EXPIRY] Previous expiry job still running, skipping this execution');
      return;
    }

    // Distributed lock: prevents multiple server instances from running simultaneously
    let lockToken: string | null = null;
    try {
      lockToken = await redisService.acquireLock('job:coin-expiry', 3600); // 1 hour TTL (daily job processes all users + notifications)
    } catch {
      // Redis unavailable — fall through to local-only guard
    }
    if (!lockToken) {
      logger.info('⏭️ [COIN EXPIRY] Another instance holds the lock, skipping');
      return;
    }

    isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('💰 [COIN EXPIRY] Running coin expiry job...');

      // CARLOS retention fix: Phase 0 — 7-day advance warning (planning window)
      const sevenDayStats = await sendSevenDayExpiryWarning();
      if (sevenDayStats.notified > 0) {
        logger.info(
          `📅 [COIN EXPIRY] 7-day warning: ${sevenDayStats.notified} notified, ${sevenDayStats.failed} failed`,
        );
      }

      // Phase 1: Send pre-expiry notifications (48h warning)
      const preExpiryStats = await sendPreExpiryNotifications();
      if (preExpiryStats.notified > 0) {
        logger.info(
          `⏰ [COIN EXPIRY] Pre-expiry: ${preExpiryStats.notified} notified, ${preExpiryStats.failed} failed`,
        );
      }

      // Phase 1b: Send urgency push notifications (24h and 6h warnings)
      const urgencyStats = await sendUrgencyPushNotifications();
      if (urgencyStats.notified > 0) {
        logger.info(
          `🚨 [COIN EXPIRY] Urgency pushes: ${urgencyStats.notified} notified, ${urgencyStats.failed} failed`,
        );
      }

      // Phase 2: Process actual expired coins
      const stats = await processExpiredCoins();

      const duration = Date.now() - startTime;

      logger.info('✅ [COIN EXPIRY] Expiry job completed:', {
        duration: `${duration}ms`,
        usersAffected: stats.usersAffected,
        totalCoinsExpired: stats.totalCoinsExpired,
        transactionsCreated: stats.transactionsCreated,
        notificationsSent: stats.notificationsSent,
        notificationsFailed: stats.notificationsFailed,
        errorCount: stats.errors.length,
        timestamp: new Date().toISOString(),
      });

      if (stats.errors.length > 0) {
        logger.error('❌ [COIN EXPIRY] Errors during expiry:');
        stats.errors.slice(0, 10).forEach((error, index) => {
          logger.error(`   ${index + 1}. User: ${error.userId}, Error: ${error.error}`);
        });
        if (stats.errors.length > 10) {
          logger.error(`   ... and ${stats.errors.length - 10} more errors`);
        }
      }

      // Summary message
      if (stats.usersAffected > 0) {
        logger.info(
          `📈 [COIN EXPIRY] ${stats.totalCoinsExpired} coins expired from ${stats.usersAffected} users, ${stats.notificationsSent} notifications sent`,
        );
      } else {
        logger.info('✨ [COIN EXPIRY] No coins expired today');
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('❌ [COIN EXPIRY] Expiry job failed:', {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      isRunning = false;
      // Release distributed lock
      if (lockToken) {
        try {
          await redisService.releaseLock('job:coin-expiry', lockToken);
        } catch {
          /* lock auto-expires */
        }
      }
    }
  });

  logger.info('✅ [COIN EXPIRY] Coin expiry job started successfully');
}

/**
 * Stop the expiry job
 */
export function stopCoinExpiryJob(): void {
  if (expiryJob) {
    expiryJob.stop();
    expiryJob = null;
    logger.info('🛑 [COIN EXPIRY] Coin expiry job stopped');
  } else {
    logger.info('⚠️ [COIN EXPIRY] No job running to stop');
  }
}

/**
 * Get expiry job status
 */
export function getCoinExpiryJobStatus(): {
  running: boolean;
  executing: boolean;
  schedule: string;
  config: {
    notificationBatchSize: number;
  };
} {
  return {
    running: expiryJob !== null,
    executing: isRunning,
    schedule: CRON_SCHEDULE,
    config: {
      notificationBatchSize: NOTIFICATION_BATCH_SIZE,
    },
  };
}

/**
 * Manually trigger coin expiry (for testing or maintenance)
 */
export async function triggerManualCoinExpiry(): Promise<ExpiryStats> {
  if (isRunning) {
    logger.info('⚠️ [COIN EXPIRY] Expiry already running, please wait');
    throw new Error('Expiry already in progress');
  }

  logger.info('💰 [COIN EXPIRY] Manual expiry triggered');

  isRunning = true;
  const startTime = Date.now();

  try {
    const stats = await processExpiredCoins();
    const duration = Date.now() - startTime;

    logger.info('✅ [COIN EXPIRY] Manual expiry completed:', {
      duration: `${duration}ms`,
      usersAffected: stats.usersAffected,
      totalCoinsExpired: stats.totalCoinsExpired,
      notificationsSent: stats.notificationsSent,
    });

    return stats;
  } catch (error) {
    logger.error('❌ [COIN EXPIRY] Manual expiry failed:', error);
    throw error;
  } finally {
    isRunning = false;
  }
}

/**
 * Preview upcoming expirations (without processing)
 */
export async function previewUpcomingExpirations(daysAhead: number = 7): Promise<{
  totalCoins: number;
  usersAffected: number;
  expirationsByDate: Array<{
    date: Date;
    coins: number;
    users: number;
  }>;
}> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const upcomingExpirations = await CoinTransaction.aggregate([
    {
      $match: {
        type: { $in: ['earned', 'branded_award'] },
        expiresAt: {
          $gt: now,
          $lte: futureDate,
        },
        $or: [{ 'metadata.isExpired': { $ne: true } }, { metadata: { $exists: false } }],
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$expiresAt' } },
          user: '$user',
        },
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        totalCoins: { $sum: '$totalAmount' },
        uniqueUsers: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const totalStats = upcomingExpirations.reduce(
    (acc, item) => ({
      totalCoins: acc.totalCoins + item.totalCoins,
      usersAffected: acc.usersAffected + item.uniqueUsers,
    }),
    { totalCoins: 0, usersAffected: 0 },
  );

  return {
    totalCoins: totalStats.totalCoins,
    usersAffected: totalStats.usersAffected,
    expirationsByDate: upcomingExpirations.map((item) => ({
      date: new Date(item._id),
      coins: item.totalCoins,
      users: item.uniqueUsers,
    })),
  };
}

/**
 * Initialize the job (called from server startup)
 */
export function initializeCoinExpiryJob(): void {
  startCoinExpiryJob();
}

/**
 * BUG-012 FIX: Expose the raw cron task reference so cronJobs.ts can push it
 * into activeCronJobs and stop it cleanly during SIGTERM/SIGINT shutdown.
 * Call this AFTER initializeCoinExpiryJob() to get the live task handle.
 */
export function getCoinExpiryJobTask(): ReturnType<typeof cron.schedule> | null {
  return expiryJob;
}

export default {
  start: startCoinExpiryJob,
  stop: stopCoinExpiryJob,
  getStatus: getCoinExpiryJobStatus,
  triggerManual: triggerManualCoinExpiry,
  previewUpcoming: previewUpcomingExpirations,
  initialize: initializeCoinExpiryJob,
};
