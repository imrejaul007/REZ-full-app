import { Request, Response } from 'express';
import { Wallet } from '../models/Wallet';
import { sendSuccess, sendError, sendNotFound, sendBadRequest } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';
import redisService from '../services/redisService';
import { sanitizeErrorMessage } from '../utils/walletValidation';
import { logger } from '../config/logger';
import { ledgerService } from '../services/ledgerService';
import { runFinancialTxn } from '../utils/financialTransactionWrapper';
import { invalidateWalletCache } from '../services/walletCacheService';

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Returns comprehensive wallet balance with breakdown, branded coins, promo coins, limits, and status.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WalletBalance'
 *       401:
 *         description: Not authenticated
 *       429:
 *         description: Rate limit exceeded
 */
function computeExpiryInfo(expiryDate?: Date | string | null): {
  expiryDate?: string;
  expiresInDays?: number;
  expiresInHours?: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
} {
  if (!expiryDate) return { isExpiringSoon: false, isExpired: false };
  const now = Date.now();
  const expiry = new Date(expiryDate).getTime();
  const msRemaining = expiry - now;
  const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);
  const hoursRemaining = msRemaining / (1000 * 60 * 60);
  return {
    expiryDate: new Date(expiryDate).toISOString(),
    expiresInDays: Math.max(0, Math.floor(daysRemaining)),
    expiresInHours: Math.max(0, Math.round(hoursRemaining)),
    isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
    isExpired: msRemaining <= 0,
  };
}

export const getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  // Get or create wallet (no .lean() — Mongoose document needed for virtuals)
  // PERF: .select() restricts MongoDB projection to only the fields consumed in this
  // response, reducing both wire-transfer size and Mongoose hydration cost.
  // savingsInsights is excluded — it is always recomputed from CoinTransaction below.
  let wallet = await Wallet.findOne({ user: userId }).select(
    'balance coins brandedCoins categoryBalances currency statistics limits settings isActive isFrozen frozenReason updatedAt',
  );

  if (!wallet) {
    wallet = await (Wallet as any).createForUser(new mongoose.Types.ObjectId(userId));
  }

  if (!wallet) {
    return sendError(res, 'Failed to create wallet', 500);
  }

  // AUTO-SYNC: Ensure wallet balance matches CoinTransaction (source of truth)
  // Uses aggregation (sum earned - spent) instead of running balance to avoid
  // data corruption from stale/wrong balance fields on individual transactions.
  // Distributed lock prevents concurrent syncs from causing drift.
  //
  // Run sync lock acquisition and savings-insights cache check in parallel —
  // both are independent at this point (wallet object already loaded above).
  const syncLockKey = `lock:wallet:sync:${userId}`;
  const savingsInsightsCacheKey = `wallet:savings_insights:${userId}`;
  const [syncLockToken, cachedSavingsInsights] = await Promise.all([
    redisService.acquireLock(syncLockKey, 10),
    redisService.get<{ totalSaved: number; thisMonth: number; avgPerVisit: number }>(savingsInsightsCacheKey),
  ]);

  if (syncLockToken) {
    try {
      const { CoinTransaction } = require('../models/CoinTransaction');
      const userObjId = new mongoose.Types.ObjectId(userId);

      // Cache the computed balance for 2 minutes to avoid heavy aggregation on every request
      const balanceCacheKey = `wallet:computed_balance:${userId}`;
      let actualRezBalance: number | null = null;
      const cachedBalance = await redisService.get<number>(balanceCacheKey);

      if (cachedBalance !== null && cachedBalance !== undefined) {
        actualRezBalance = cachedBalance;
      } else {
        // Aggregate: sum all earned/bonus/refunded minus spent/expired, excluding branded awards
        const result = await CoinTransaction.aggregate([
          { $match: { user: userObjId } },
          {
            $group: {
              _id: null,
              earned: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $in: ['$type', ['earned', 'refunded', 'bonus']] },
                        { $ne: ['$source', 'merchant_award'] },
                      ],
                    },
                    '$amount',
                    0,
                  ],
                },
              },
              spent: {
                $sum: {
                  $cond: [{ $in: ['$type', ['spent', 'expired']] }, '$amount', 0],
                },
              },
            },
          },
        ]);
        actualRezBalance = Math.max(0, (result[0]?.earned || 0) - (result[0]?.spent || 0));
        await redisService.set(balanceCacheKey, actualRezBalance, 120);
      }

      const currentBalance = wallet.balance?.available || 0;
      const delta = actualRezBalance - currentBalance;
      if (Math.abs(delta) > 0.01) {
        // BUG-011: Use arrayFilters instead of positional $ operator so the
        // update succeeds even when the coins array does not yet contain a
        // 'rez' entry (positional $ requires the filter field to match an
        // existing element, so it silently no-ops on empty/mismatched arrays).
        //
        // SOURCE-OF-TRUTH NOTE: Both rezbackend and rez-wallet-service write to
        // the same MongoDB `wallets` collection. All coin entries use type='rez'.
        await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $set: {
              'balance.available': actualRezBalance,
              'balance.total': actualRezBalance + (wallet.balance?.pending || 0) + (wallet.balance?.cashback || 0),
              'coins.$[elem].amount': actualRezBalance,
              'coins.$[elem].lastUsed': new Date(),
            },
          },
          { arrayFilters: [{ 'elem.type': 'rez' }] },
        );

        // Re-fetch wallet so the response below uses corrected values
        const correctedWallet = await Wallet.findOne({ user: userId }).select(
          'balance coins brandedCoins categoryBalances currency statistics limits settings isActive isFrozen frozenReason updatedAt',
        );
        if (correctedWallet) {
          wallet = correctedWallet;
        }

        // Fire-and-forget corrective ledger entry
        const userAccountId = new mongoose.Types.ObjectId(userId);
        const platformAccountId = ledgerService.getPlatformAccountId('platform_float');
        if (delta > 0) {
          ledgerService
            .recordEntry({
              debitAccount: { type: 'platform_float', id: platformAccountId },
              creditAccount: { type: 'user_wallet', id: userAccountId },
              amount: delta,
              operationType: 'correction',
              referenceId: `auto-sync:${userId}:${Date.now()}`,
              referenceModel: 'WalletAutoSync',
              metadata: { description: `Auto-sync correction in getBalance` },
            })
            .catch((err) => logger.error('Auto-sync ledger entry failed', err));
        } else {
          ledgerService
            .recordEntry({
              debitAccount: { type: 'user_wallet', id: userAccountId },
              creditAccount: { type: 'platform_float', id: platformAccountId },
              amount: Math.abs(delta),
              operationType: 'correction',
              referenceId: `auto-sync:${userId}:${Date.now()}`,
              referenceModel: 'WalletAutoSync',
              metadata: { description: `Auto-sync correction in getBalance` },
            })
            .catch((err) => logger.error('Auto-sync ledger entry failed', err));
        }
      }
    } catch (syncError) {
      logger.error('⚠️ [WALLET] Auto-sync failed:', syncError);
      // Continue with existing wallet data if sync fails
    } finally {
      await redisService.releaseLock(syncLockKey, syncLockToken);
    }
  }

  // Compute savings insights from CoinTransaction (source of truth).
  // Use cached value (5 min TTL) when available — this aggregation is expensive
  // and the result changes slowly, so slight staleness is acceptable.
  let savingsInsights = cachedSavingsInsights || { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 };
  if (!cachedSavingsInsights) {
    try {
      const { CoinTransaction } = require('../models/CoinTransaction');
      const userObjId = new mongoose.Types.ObjectId(userId);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [insightsResult] = await CoinTransaction.aggregate([
        { $match: { user: userObjId, type: 'earned' } },
        {
          $facet: {
            allTime: [{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
            thisMonth: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ],
          },
        },
      ]);

      const allTime = insightsResult?.allTime?.[0];
      const thisMonthData = insightsResult?.thisMonth?.[0];
      savingsInsights = {
        totalSaved: Math.round(allTime?.total || 0),
        thisMonth: Math.round(thisMonthData?.total || 0),
        avgPerVisit: allTime?.count ? Math.round((allTime.total || 0) / allTime.count) : 0,
      };
      // Cache for 5 minutes (fire-and-forget)
      redisService.set(savingsInsightsCacheKey, savingsInsights, 300).catch(() => {});
    } catch (insightsError) {
      logger.error('⚠️ [WALLET] Insights computation failed:', insightsError);
    }
  }

  // Get ReZ and Promo coins from coins array
  const rezCoin = wallet.coins?.find((c: any) => c.type === 'rez');
  const promoCoin = wallet.coins?.find((c: any) => c.type === 'promo');

  // Calculate promo coin expiry countdown
  let promoExpiryCountdown = '';
  const expiryDateValue = promoCoin?.promoDetails?.expiryDate || promoCoin?.expiryDate;
  if (expiryDateValue) {
    const expiryDate = new Date(expiryDateValue);
    const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      promoExpiryCountdown = daysLeft === 1 ? '1 day left' : `${daysLeft} days left`;
    } else {
      promoExpiryCountdown = 'Expired';
    }
  }

  sendSuccess(
    res,
    {
      // Total value
      totalValue: wallet.balance.total,
      // Breakdown row
      breakdown: {
        rezCoins: {
          amount: rezCoin?.amount || 0,
          color: '#00C06A',
          expiryDate: rezCoin?.expiryDate,
        },
        cashbackBalance: wallet.balance.cashback || 0,
        pendingRewards: wallet.balance.pending || 0,
      },
      // Branded Coins (merchant-specific)
      brandedCoins: (wallet.brandedCoins || []).map((bc: any) => ({
        merchantId: bc.merchantId,
        merchantName: bc.merchantName,
        merchantLogo: bc.merchantLogo,
        merchantColor: bc.merchantColor || '#6366F1',
        amount: bc.amount,
      })),
      brandedCoinsTotal: (wallet.brandedCoins || []).reduce((sum: number, bc: any) => sum + (bc.amount || 0), 0),
      // Per-MainCategory coin balances
      categoryBalances: (() => {
        const result: Record<string, { available: number; earned: number; spent: number }> = {};
        if (wallet.categoryBalances) {
          Object.entries((wallet.categoryBalances as any) || {}).forEach(([key, val]: [string, any]) => {
            result[key] = {
              available: val?.available || 0,
              earned: val?.earned || 0,
              spent: val?.spent || 0,
            };
          });
        }
        return result;
      })(),
      // Promo Coins (limited-time)
      promoCoins: {
        amount: promoCoin?.amount || 0,
        color: '#FFC857',
        expiryCountdown: promoExpiryCountdown,
        maxRedemptionPercentage: promoCoin?.promoDetails?.maxRedemptionPercentage || 20,
      },
      // Coin usage order (for transparency)
      // H29 fix: 'prive' was missing from coinUsageOrder — Privé coins must be spent before REZ coins
      coinUsageOrder: ['promo', 'branded', 'prive', 'rez'],
      // Savings insights (computed from CoinTransaction)
      savingsInsights,
      // Coin expiry summary — warns users before coins expire
      expiringSoon: (() => {
        const allCoins = wallet.coins || [];
        const expiring = allCoins.filter((c: any) => {
          const info = computeExpiryInfo(c.expiryDate);
          return info.isExpiringSoon && !info.isExpired;
        });
        return {
          count: expiring.length,
          totalAmount: expiring.reduce((sum: number, c: any) => sum + (c.amount || 0), 0),
          earliestExpiry:
            expiring.length > 0
              ? expiring.reduce((min: any, c: any) => (new Date(c.expiryDate) < new Date(min.expiryDate) ? c : min))
                  .expiryDate
              : null,
        };
      })(),
      // Legacy format for compatibility
      balance: wallet.balance,
      coins: (wallet.coins || []).map((c: any) => ({
        ...(c.toObject ? c.toObject() : c),
        expiryInfo: computeExpiryInfo(c.expiryDate),
      })),
      currency: wallet.currency,
      statistics: wallet.statistics,
      limits: {
        maxBalance: wallet.limits.maxBalance,
        dailySpendLimit: wallet.limits.dailySpendLimit,
        dailySpentToday: wallet.limits.dailySpent,
        remainingToday: wallet.limits.dailySpendLimit - wallet.limits.dailySpent,
      },
      settings: wallet.settings,
      status: {
        isActive: wallet.isActive,
        isFrozen: wallet.isFrozen,
        frozenReason: wallet.frozenReason,
      },
      lastUpdated: wallet.updatedAt,
    },
    'Wallet balance retrieved successfully',
  );
});

/**
 * @swagger
 * /api/wallet/settings:
 *   put:
 *     summary: Update wallet settings
 *     description: Update user's wallet preferences such as auto-topup and low balance alerts.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoTopup:
 *                 type: boolean
 *                 description: Enable auto topup
 *               autoTopupThreshold:
 *                 type: number
 *                 description: Balance threshold to trigger auto topup
 *               autoTopupAmount:
 *                 type: number
 *                 description: Amount to auto topup
 *               lowBalanceAlert:
 *                 type: boolean
 *                 description: Enable low balance alerts
 *               lowBalanceThreshold:
 *                 type: number
 *                 description: Threshold for low balance alert
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
export const updateWalletSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { autoTopup, autoTopupThreshold, autoTopupAmount, lowBalanceAlert, lowBalanceThreshold } = req.body;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const lockKey = `lock:wallet:settings:${userId}`;
  const lockToken = await redisService.acquireLock(lockKey, 5);
  if (!lockToken) {
    return sendError(res, 'Settings update already in progress — please retry', 429);
  }

  try {
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return sendNotFound(res, 'Wallet not found');
    }

    // Update settings — validate numeric fields to reject NaN, Infinity, and out-of-range values
    if (autoTopup !== undefined) wallet.settings.autoTopup = autoTopup;
    if (autoTopupThreshold !== undefined) {
      if (!Number.isFinite(autoTopupThreshold) || autoTopupThreshold < 0 || autoTopupThreshold > 100_000)
        return sendBadRequest(res, 'autoTopupThreshold must be between 0 and 100000');
      wallet.settings.autoTopupThreshold = autoTopupThreshold;
    }
    if (autoTopupAmount !== undefined) {
      if (!Number.isFinite(autoTopupAmount) || autoTopupAmount <= 0 || autoTopupAmount > 100_000)
        return sendBadRequest(res, 'autoTopupAmount must be between 1 and 100000');
      wallet.settings.autoTopupAmount = autoTopupAmount;
    }
    if (lowBalanceAlert !== undefined) wallet.settings.lowBalanceAlert = lowBalanceAlert;
    if (lowBalanceThreshold !== undefined) {
      if (!Number.isFinite(lowBalanceThreshold) || lowBalanceThreshold < 0 || lowBalanceThreshold > 100_000)
        return sendBadRequest(res, 'lowBalanceThreshold must be between 0 and 100000');
      wallet.settings.lowBalanceThreshold = lowBalanceThreshold;
    }

    await wallet.save();

    // DP-006 FIX: Invalidate the wallet balance cache after settings update.
    // Without this, getCachedWalletBalance() returns stale settings data for up
    // to 5 minutes, making the frontend show the old auto-topup thresholds.
    await invalidateWalletCache(userId).catch((err) =>
      logger.warn('[walletBalanceController] Cache invalidation failed after settings update', {
        error: err.message,
        userId,
      }),
    );

    sendSuccess(
      res,
      {
        settings: wallet.settings,
      },
      'Wallet settings updated successfully',
    );
  } finally {
    if (lockToken) await redisService.releaseLock(lockKey, lockToken);
  }
});

/**
 * @swagger
 * /api/wallet/sync-balance:
 *   post:
 *     summary: Sync wallet balance
 *     description: Recalculates wallet balance from CoinTransaction records to fix any discrepancies. Rate limited to 1 request per hour.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 *       429:
 *         description: Rate limit exceeded (1 per hour)
 */
export const syncWalletBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const lockKey = `lock:wallet:sync:${userId}`;
  const lockToken = await redisService.acquireLock(lockKey, 15);

  try {
    // Import CoinTransaction to get the true balance
    const { CoinTransaction } = require('../models/CoinTransaction');
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Use aggregation (sum earned - spent) for accurate balance, excluding branded awards
    const result = await CoinTransaction.aggregate([
      { $match: { user: userObjId } },
      {
        $group: {
          _id: null,
          earned: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$type', ['earned', 'refunded', 'bonus']] }, { $ne: ['$source', 'merchant_award'] }] },
                '$amount',
                0,
              ],
            },
          },
          spent: {
            $sum: {
              $cond: [{ $in: ['$type', ['spent', 'expired']] }, '$amount', 0],
            },
          },
        },
      },
    ]);
    const actualRezBalance = Math.max(0, (result[0]?.earned || 0) - (result[0]?.spent || 0));

    // Update computed balance cache
    await redisService.set(`wallet:computed_balance:${userId}`, actualRezBalance, 120);

    logger.info(
      '📊 [WALLET SYNC] Aggregated balance — earned:',
      result[0]?.earned || 0,
      'spent:',
      result[0]?.spent || 0,
      'actual ReZ:',
      actualRezBalance,
    );

    // Get or create wallet
    let wallet = await Wallet.findOne({ user: userId }).lean();

    if (!wallet) {
      wallet = await (Wallet as any).createForUser(new mongoose.Types.ObjectId(userId));
    }

    if (!wallet) {
      return sendError(res, 'Failed to create wallet', 500);
    }

    const oldBalance = wallet?.balance?.available ?? 0;
    const delta = actualRezBalance - oldBalance;

    if (Math.abs(delta) > 0.01) {
      await runFinancialTxn(async ({ session, recordLedger }) => {
        await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $set: {
              'balance.available': actualRezBalance,
              'balance.total': actualRezBalance + (wallet!.balance.pending || 0) + (wallet!.balance.cashback || 0),
            },
          },
          { session },
        );

        // Also update ReZ coin amount in coins array
        await Wallet.findOneAndUpdate(
          { user: userId, 'coins.type': 'rez' },
          {
            $set: {
              'coins.$.amount': actualRezBalance,
              'coins.$.lastUsed': new Date(),
            },
          },
          { session },
        );

        const userAccountId = new mongoose.Types.ObjectId(userId);
        const platformAccountId = ledgerService.getPlatformAccountId('platform_float');

        if (delta > 0) {
          await recordLedger({
            debitAccount: { type: 'platform_float', id: platformAccountId },
            creditAccount: { type: 'user_wallet', id: userAccountId },
            amount: delta,
            operationType: 'correction',
            referenceId: `sync:${userId}:${Date.now()}`,
            referenceModel: 'WalletSync',
            metadata: { description: `Sync correction: ${oldBalance} -> ${actualRezBalance}` },
          });
        } else {
          await recordLedger({
            debitAccount: { type: 'user_wallet', id: userAccountId },
            creditAccount: { type: 'platform_float', id: platformAccountId },
            amount: Math.abs(delta),
            operationType: 'correction',
            referenceId: `sync:${userId}:${Date.now()}`,
            referenceModel: 'WalletSync',
            metadata: { description: `Sync correction: ${oldBalance} -> ${actualRezBalance}` },
          });
        }
      });
    }

    logger.info(`✅ [WALLET SYNC] Balance synced: ${oldBalance} → ${actualRezBalance}`);

    // Re-fetch wallet for accurate response
    const updatedSyncWallet = await Wallet.findOne({ user: userId }).lean();

    sendSuccess(
      res,
      {
        previousBalance: oldBalance,
        newBalance: actualRezBalance,
        wallet: {
          balance: updatedSyncWallet?.balance || wallet.balance,
          coins: updatedSyncWallet?.coins || wallet.coins,
          currency: updatedSyncWallet?.currency || wallet.currency,
        },
        synced: true,
      },
      'Wallet balance synced successfully',
    );
  } catch (error: any) {
    logger.error('[WALLET SYNC] Error:', error);
    sendError(res, sanitizeErrorMessage(error, 'Failed to sync wallet balance'), 500);
  } finally {
    if (lockToken) await redisService.releaseLock(lockKey, lockToken);
  }
});

/**
 * @swagger
 * /api/wallet/expiring-coins:
 *   get:
 *     summary: Get expiring coins
 *     description: Returns coins grouped by expiry time period (e.g., expiring this week, this month).
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiring coins retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
export const getExpiringCoins = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return sendError(res, 'User not authenticated', 401);

  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfMonth = new Date(now);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  const endOfNextMonth = new Date(now);
  endOfNextMonth.setMonth(endOfNextMonth.getMonth() + 2);

  const { CoinTransaction } = require('../models/CoinTransaction');

  // Query earned coins that have expiry dates and haven't been spent/expired yet
  const expiringCoins = await CoinTransaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'earned',
        expiresAt: { $exists: true, $gt: now },
        coinStatus: { $nin: ['consumed', 'reversed'] },
      },
    },
    {
      $addFields: {
        period: {
          $cond: [
            { $lte: ['$expiresAt', endOfWeek] },
            'this_week',
            {
              $cond: [{ $lte: ['$expiresAt', endOfMonth] }, 'this_month', 'next_month'],
            },
          ],
        },
        daysLeft: {
          $ceil: {
            $divide: [
              { $subtract: ['$expiresAt', now] },
              86400000, // ms per day
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: '$period',
        totalAmount: { $sum: '$amount' },
        coins: {
          $push: {
            id: '$_id',
            amount: '$amount',
            source: '$source',
            description: '$description',
            expiresAt: '$expiresAt',
            daysLeft: '$daysLeft',
            category: '$category',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Also check promo coins from wallet
  const wallet = await Wallet.findOne({ user: userId }).lean();
  const promoCoin = wallet?.coins.find((c: any) => c.type === 'promo' && c.amount > 0);
  let promoExpiry = null;
  if (promoCoin?.promoDetails?.expiryDate || promoCoin?.expiryDate) {
    const expDate = new Date(promoCoin.promoDetails?.expiryDate || promoCoin.expiryDate!);
    if (expDate > now) {
      const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / 86400000);
      promoExpiry = {
        type: 'promo',
        amount: promoCoin.amount,
        expiresAt: expDate,
        daysLeft,
        period: daysLeft <= 7 ? 'this_week' : daysLeft <= 30 ? 'this_month' : 'next_month',
      };
    }
  }

  const result: Record<string, any> = {
    this_week: { totalAmount: 0, coins: [], count: 0 },
    this_month: { totalAmount: 0, coins: [], count: 0 },
    next_month: { totalAmount: 0, coins: [], count: 0 },
  };

  for (const group of expiringCoins) {
    if (result[group._id]) {
      result[group._id] = {
        totalAmount: group.totalAmount,
        coins: group.coins.slice(0, 20), // Limit to 20 per group
        count: group.count,
      };
    }
  }

  // Add promo coin to appropriate group
  if (promoExpiry) {
    result[promoExpiry.period].coins.unshift(promoExpiry);
    result[promoExpiry.period].totalAmount += promoExpiry.amount;
    result[promoExpiry.period].count += 1;
  }

  sendSuccess(
    res,
    {
      expiringCoins: result,
      totalExpiring: Object.values(result).reduce((sum: number, g: any) => sum + g.totalAmount, 0),
    },
    'Expiring coins retrieved',
  );
});

/**
 * @swagger
 * /api/wallet/recharge/preview:
 *   get:
 *     summary: Preview recharge cashback
 *     description: Returns a preview of the cashback amount for a given recharge amount.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Recharge amount to preview cashback for
 *     responses:
 *       200:
 *         description: Cashback preview retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Not authenticated
 */
export const previewRechargeCashback = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.query;
  const rechargeAmount = Number(amount);

  if (!Number.isFinite(rechargeAmount) || rechargeAmount <= 0) {
    return sendBadRequest(res, 'Valid recharge amount required');
  }

  const { WalletConfig } = require('../models/WalletConfig');
  const config = await WalletConfig.getOrCreate();

  if (!config.rechargeConfig.isEnabled) {
    return sendSuccess(res, {
      rechargeAmount,
      discountPercentage: 0,
      discountAmount: 0,
      payableAmount: rechargeAmount,
      cashback: 0,
      cashbackPercentage: 0,
      message: 'Recharge discount currently disabled',
    });
  }

  if (rechargeAmount < config.rechargeConfig.minRecharge) {
    return sendBadRequest(res, `Minimum recharge amount is ${config.rechargeConfig.minRecharge} NC`);
  }

  // Find applicable tier (highest tier that rechargeAmount qualifies for)
  const sortedTiers = [...config.rechargeConfig.tiers].sort((a: any, b: any) => b.minAmount - a.minAmount);
  const applicableTier = sortedTiers.find((t: any) => rechargeAmount >= t.minAmount);

  if (!applicableTier) {
    return sendSuccess(res, {
      rechargeAmount,
      discountPercentage: 0,
      discountAmount: 0,
      payableAmount: rechargeAmount,
      cashback: 0,
      cashbackPercentage: 0,
      message: 'Amount below minimum tier',
    });
  }

  const percentage = applicableTier.cashbackPercentage;
  const rawDiscount = Math.floor((rechargeAmount * percentage) / 100);
  const discountAmount = Math.min(rawDiscount, config.rechargeConfig.maxCashback);
  const payableAmount = rechargeAmount - discountAmount;

  sendSuccess(
    res,
    {
      rechargeAmount,
      discountPercentage: percentage,
      discountAmount,
      payableAmount,
      // Keep legacy fields for backward compatibility
      cashbackPercentage: percentage,
      cashback: discountAmount,
      maxCashback: config.rechargeConfig.maxCashback,
      cappedAt: rawDiscount > config.rechargeConfig.maxCashback ? config.rechargeConfig.maxCashback : null,
    },
    'Recharge preview calculated',
  );
});

/**
 * @swagger
 * /api/wallet/scheduled-drops:
 *   get:
 *     summary: Get scheduled coin drops
 *     description: Returns upcoming coin drops for the user, including CoinDrops, SurpriseCoinDrops, and daily login rewards.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled drops retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
export const getScheduledDrops = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return sendError(res, 'User not authenticated', 401);

  const CoinDrop = require('../models/CoinDrop').default;
  const { SurpriseCoinDrop } = require('../models/SurpriseCoinDrop');
  const { CoinTransaction } = require('../models/CoinTransaction');

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // 1. Active CoinDrops (boosted cashback at stores)
  const coinDrops = await CoinDrop.find({
    isActive: true,
    endTime: { $gte: now },
  })
    .sort({ priority: -1, multiplier: -1 })
    .limit(20)
    .lean();

  // 2. Unclaimed SurpriseCoinDrops for this user
  const surpriseDrops = await SurpriseCoinDrop.find({
    userId: new mongoose.Types.ObjectId(userId),
    status: 'available',
    expiresAt: { $gte: now },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // 3. Check daily login eligibility
  const dailyLoginToday = await CoinTransaction.findOne({
    user: new mongoose.Types.ObjectId(userId),
    source: 'daily_login',
    createdAt: { $gte: todayStart },
  }).lean();

  const drops = [];

  // Map CoinDrops
  for (const cd of coinDrops) {
    drops.push({
      id: String(cd._id),
      title: `${cd.storeName} Boost`,
      amount: cd.boostedCashback || Math.round(cd.normalCashback * cd.multiplier),
      type: 'cashback' as const,
      scheduledDate: cd.endTime,
      description: `${cd.multiplier}x cashback at ${cd.storeName}`,
      icon: 'flash-outline',
      source: 'coin_drop',
      claimable: false,
      storeLogo: cd.storeLogo,
    });
  }

  // Map SurpriseCoinDrops
  for (const sd of surpriseDrops) {
    drops.push({
      id: String(sd._id),
      title: sd.message || 'Surprise Coins!',
      amount: sd.coins,
      type: 'special' as const,
      scheduledDate: sd.expiresAt,
      description: sd.reason === 'daily_login' ? 'Daily reward' : `Surprise ${sd.reason} reward`,
      icon: 'gift-outline',
      source: 'surprise_drop',
      claimable: true,
    });
  }

  // Daily login entry
  drops.push({
    id: 'daily_login',
    title: 'Daily Login Bonus',
    amount: 5,
    type: 'daily' as const,
    scheduledDate: dailyLoginToday ? todayStart : now,
    description: dailyLoginToday ? 'Already claimed today' : 'Log in to claim',
    icon: 'calendar-outline',
    source: 'daily_login',
    claimable: !dailyLoginToday,
  });

  const totalUpcoming = drops.reduce((sum, d) => sum + (d.claimable ? d.amount : 0), 0);

  sendSuccess(res, { drops, totalUpcoming }, 'Scheduled drops retrieved');
});

/**
 * @swagger
 * /api/wallet/coin-rules:
 *   get:
 *     summary: Get coin usage and earning rules
 *     description: Returns dynamic, admin-configurable rules for coin usage and earning.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coin rules retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated
 */
export const getCoinRules = asyncHandler(async (req: Request, res: Response) => {
  const { WalletConfig } = require('../models/WalletConfig');
  const config = await WalletConfig.getOrCreate();
  // Include coinConversion so client apps can use the admin-configured rate
  // (instead of a hardcoded constant) for display and validation purposes.
  const rezToInr: number = config?.coinConversion?.rezToInr ?? parseInt(process.env.REZ_COIN_TO_RUPEE_RATE || '1', 10);
  sendSuccess(
    res,
    {
      coinRules: config.coinRules || {},
      coinExpiryConfig: config.coinExpiryConfig || {
        rez: { expiryDays: 0, maxUsagePct: 100 },
        prive: { expiryDays: 365, maxUsagePct: 100 },
        promo: { expiryDays: 90, maxUsagePct: 20 },
        branded: { expiryDays: 180, maxUsagePct: 100 },
      },
      coinConversion: { rezToInr },
    },
    'Coin rules retrieved',
  );
});

// Get smart redemption suggestions for user
export const getRedemptionSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return sendSuccess(res, { suggestions: [] });

  const wallet = await Wallet.findOne({ user: userId }).lean();
  if (!wallet) return sendSuccess(res, { suggestions: [] });

  const suggestions: any[] = [];
  const coins = (wallet as any).coins || [];

  // Promo coins expiring soon
  const promoCoin = coins.find((c: any) => c.type === 'promo');
  if (promoCoin?.amount > 0 && promoCoin.expiryDate) {
    const daysLeft = Math.ceil((new Date(promoCoin.expiryDate).getTime() - Date.now()) / 86400000);
    if (daysLeft <= 7 && daysLeft > 0) {
      suggestions.push({
        type: 'expiry_warning',
        urgency: daysLeft <= 2 ? 'high' : 'medium',
        title: `${promoCoin.amount} Promo coins expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
        action: 'Use them on your next payment',
        coinType: 'promo',
        amount: promoCoin.amount,
        daysLeft,
      });
    }
  }

  // Branded coins unused (>50 coins at a store)
  const brandedCoins = (wallet as any).brandedCoins || [];
  for (const bc of brandedCoins.slice(0, 2)) {
    if (bc.amount >= 50) {
      suggestions.push({
        type: 'use_branded',
        urgency: 'low',
        title: `${bc.amount} coins waiting at a store`,
        action: 'Visit to use your branded coins',
        coinType: 'branded',
        merchantId: bc.merchantId?.toString(),
        amount: bc.amount,
      });
    }
  }

  return sendSuccess(res, { suggestions });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /wallet/welcome-coins
// ─────────────────────────────────────────────────────────────────────────────

/**
 * grantWelcomeCoins
 *
 * Called once from the onboarding verification-success screen.
 * Idempotent: if the user already received welcome coins, returns
 * { alreadyClaimed: true } without crediting again.
 *
 * Credits WELCOME_COINS (50) to the user's main ReZ coin balance and
 * records a CoinTransaction of type 'welcome_bonus'.
 */
const WELCOME_COIN_AMOUNT = 50;

export const grantWelcomeCoins = asyncHandler(async (req: Request, res: Response) => {
  // Match the pattern used by every other handler in this file
  const userId = (req as any).userId;
  if (!userId) return sendError(res, 'User not authenticated', 401);

  const { CoinTransaction } = require('../models/CoinTransaction');

  // Idempotency check — one welcome bonus per user ever
  const existing = await CoinTransaction.findOne({
    user: new mongoose.Types.ObjectId(userId),
    type: 'bonus',
    'metadata.idempotencyKey': `welcome_bonus:${userId}`,
  }).lean();

  if (existing) {
    return sendSuccess(res, { coinsGranted: 0, alreadyClaimed: true });
  }

  // Get or create wallet
  let wallet = await Wallet.findOne({ user: new mongoose.Types.ObjectId(userId) });
  if (!wallet) {
    wallet = await (Wallet as any).createForUser(new mongoose.Types.ObjectId(userId));
  }
  if (!wallet) return sendError(res, 'Wallet not found', 500);

  await runFinancialTxn(async ({ session }) => {
    // Re-read wallet INSIDE the transaction (with session) to get the definitive
    // coin state, preventing a TOCTOU race where a concurrent wallet creation
    // adds the rez coin entry between our outer read and the transaction start,
    // which would cause $push to create a duplicate 'rez' entry in the coins array.
    const freshWallet = await Wallet.findOne({ user: new mongoose.Types.ObjectId(userId) }, null, { session });
    const freshRezEntry: any = (freshWallet as any)?.coins?.find((c: any) => c.type === 'rez');
    const currentBalance = freshRezEntry ? freshRezEntry.amount : 0;
    const newBalance = currentBalance + WELCOME_COIN_AMOUNT;

    // Update rez coin entry in the coins array atomically
    if (freshRezEntry) {
      await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId), 'coins.type': 'rez' },
        { $inc: { 'coins.$.amount': WELCOME_COIN_AMOUNT }, $set: { 'coins.$.lastUsed': new Date() } },
        { session },
      );
    } else {
      await Wallet.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        { $push: { coins: { type: 'rez', amount: WELCOME_COIN_AMOUNT, lastUsed: new Date() } } },
        { session },
      );
    }

    // Record the transaction ledger entry
    await CoinTransaction.create(
      [
        {
          user: new mongoose.Types.ObjectId(userId),
          type: 'bonus',
          amount: WELCOME_COIN_AMOUNT,
          balance: newBalance,
          description: 'Welcome coins — thanks for joining ReZ!',
          source: 'admin',
          metadata: { idempotencyKey: `welcome_bonus:${userId}` },
        },
      ],
      { session },
    );
  });

  // Bust cache so the next balance fetch reflects the new coins
  await invalidateWalletCache(userId.toString()).catch(() => {});

  logger.info('[WalletController] Welcome coins granted', { userId, amount: WELCOME_COIN_AMOUNT });

  return sendSuccess(res, { coinsGranted: WELCOME_COIN_AMOUNT, alreadyClaimed: false });
});

// ── REZ Cash Identity ──────────────────────────────────────────────────────────

const MILESTONES = [
  { id: 'first_save', label: 'First Save', threshold: 100, icon: 'star', color: '#F59E0B' },
  { id: 'smart_saver', label: 'Smart Saver', threshold: 500, icon: 'trending-up', color: '#10B981' },
  { id: 'power_saver', label: 'Power Saver', threshold: 1000, icon: 'flash', color: '#7C3AED' },
  { id: 'champion', label: 'Savings Champion', threshold: 2500, icon: 'trophy', color: '#F59E0B' },
  { id: 'elite', label: 'REZ Elite', threshold: 5000, icon: 'diamond', color: '#6366F1' },
  { id: 'unicorn', label: 'REZ Unicorn', threshold: 10000, icon: 'sparkles', color: '#EC4899' },
];

const EQUIVALENTS = [
  { label: 'Netflix months', unit: 149, icon: 'tv-outline', singular: 'month of Netflix' },
  { label: 'Starbucks coffees', unit: 350, icon: 'cafe-outline', singular: 'Starbucks coffee' },
  { label: 'Movie tickets', unit: 300, icon: 'film-outline', singular: 'movie ticket' },
  { label: 'Cab rides', unit: 200, icon: 'car-outline', singular: 'cab ride' },
  { label: 'Swiggy deliveries', unit: 100, icon: 'bicycle-outline', singular: 'food delivery' },
];

/**
 * @route   GET /api/wallet/rez-cash
 * @desc    Rich savings identity for REZ Cash screen
 *          Computes lifetime/monthly/yearly savings, trend, milestones, equivalents, top categories
 * @access  Private
 */
export const getRezCashIdentity = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return sendError(res, 'User not authenticated', 401);

  const { CoinTransaction } = require('../models/CoinTransaction');
  const { UserCashback } = require('../models/UserCashback');
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Start of current month and year
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // 6-month window for trend
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [lifetimeAgg, monthAgg, yearAgg, trendAgg, categoryAgg, pendingCashback] = await Promise.all([
    // Lifetime total earned (type: earned|bonus only — refunded excluded as it's order reversal, not savings)
    CoinTransaction.aggregate([
      { $match: { user: userObjId, type: { $in: ['earned', 'bonus'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // This month earned
    CoinTransaction.aggregate([
      { $match: { user: userObjId, type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // This year earned
    CoinTransaction.aggregate([
      { $match: { user: userObjId, type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: yearStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    // Monthly trend — last 6 months (group by year+month)
    CoinTransaction.aggregate([
      { $match: { user: userObjId, type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

    // Top 3 categories by earned coins (exclude null category)
    CoinTransaction.aggregate([
      { $match: { user: userObjId, type: 'earned', category: { $ne: null } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
    ]),

    // Pending cashback not yet credited
    UserCashback.aggregate([
      { $match: { user: userObjId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalSaved = Math.round(lifetimeAgg[0]?.total || 0);
  const thisMonth = Math.round(monthAgg[0]?.total || 0);
  const thisYear = Math.round(yearAgg[0]?.total || 0);
  const pendingAmt = Math.round(pendingCashback[0]?.total || 0);

  // Build 6-month trend with labels (fill gaps with 0)
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendMap = new Map<string, number>();
  for (const t of trendAgg) {
    trendMap.set(`${t._id.year}-${t._id.month}`, t.total);
  }
  const monthlyTrend: Array<{ label: string; amount: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthlyTrend.push({ label: MONTH_NAMES[d.getMonth()], amount: Math.round(trendMap.get(key) || 0) });
  }

  // Savings streak: consecutive months (back from current) with any savings
  let streak = 0;
  for (let i = monthlyTrend.length - 1; i >= 0; i--) {
    if (monthlyTrend[i].amount > 0) streak++;
    else break;
  }

  // Milestones unlocked / next
  const unlocked = MILESTONES.filter((m) => totalSaved >= m.threshold);
  const next = MILESTONES.find((m) => totalSaved < m.threshold) || null;

  // Real-world equivalents (top 2 meaningful ones)
  const equivalents = EQUIVALENTS.map((e) => ({ ...e, count: Math.floor(totalSaved / e.unit) }))
    .filter((e) => e.count > 0)
    .slice(0, 3);

  // Top categories
  const topCategories = categoryAgg.map((c: any) => ({ category: c._id, total: Math.round(c.total) }));

  return sendSuccess(
    res,
    {
      totalSaved,
      thisMonth,
      thisYear,
      pendingCashback: pendingAmt,
      streak,
      milestones: {
        unlocked,
        next: next ? { ...next, remaining: Math.round(next.threshold - totalSaved) } : null,
      },
      equivalents,
      monthlyTrend,
      topCategories,
    },
    'REZ Cash identity',
  );
});
