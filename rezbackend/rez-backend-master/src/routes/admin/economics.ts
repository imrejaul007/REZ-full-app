// @ts-nocheck
import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../../middleware/auth';
import { CoinTransaction } from '../../models/CoinTransaction';
import { MerchantLiability } from '../../models/MerchantLiability';
import { MerchantWallet } from '../../models/MerchantWallet';
import { Order } from '../../models/Order';
import { Wallet } from '../../models/Wallet';
import { WalletConfig } from '../../models/WalletConfig';
import redisService from '../../services/redisService';
import { logger } from '../../config/logger';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

const CACHE_KEY = 'admin:economics:overview';
const CACHE_TTL = 60; // 60 seconds

/**
 * @route   GET /api/admin/economics/overview
 * @desc    Economic Control Center — all 6 sections in one call
 * @access  Admin
 */
router.get(
  '/overview',
  asyncHandler(async (_req: Request, res: Response) => {
    // Check Redis cache
    const cached = await redisService.get<any>(CACHE_KEY);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // BAK-GATEWAY-022 FIX: Make fraud threshold configurable via env var (default 5000)
    const FRAUD_THRESHOLD = parseInt(process.env.FRAUD_THRESHOLD_COINS || '5000', 10);

    // ── All aggregations in parallel ──────────────────────────
    const [
      cashbackTodayAgg,
      cashbackYesterdayAgg,
      liabilityAgg,
      fraudUsersAgg,
      fraudHourlyAgg,
      issuanceTodayAgg,
      issuanceYesterdayAgg,
      topSourcesAgg,
      pendingReversals,
      completedReversalsAgg,
      oldestPending,
      settlementSummaryAgg,
      topMerchantsAgg,
    ] = await Promise.all([
      // 1. Cashback today
      CoinTransaction.aggregate([
        { $match: { source: 'purchase_reward', type: 'earned', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // 2. Cashback yesterday
      CoinTransaction.aggregate([
        { $match: { source: 'purchase_reward', type: 'earned', createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // 3. Merchant liability by status
      MerchantLiability.aggregate([
        {
          $group: {
            _id: '$status',
            totalPending: { $sum: '$pendingAmount' },
            totalSettled: { $sum: '$settledAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 4. Fraud — top users earning > threshold in 24h
      CoinTransaction.aggregate([
        { $match: { type: 'earned', createdAt: { $gte: twentyFourHoursAgo } } },
        { $group: { _id: '$user', totalEarned: { $sum: '$amount' }, transactionCount: { $sum: 1 } } },
        { $match: { totalEarned: { $gt: FRAUD_THRESHOLD } } },
        { $sort: { totalEarned: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo',
            pipeline: [{ $project: { 'profile.firstName': 1, 'profile.lastName': 1 } }],
          },
        },
        {
          $project: {
            userId: '$_id',
            userName: {
              $concat: [
                { $ifNull: [{ $arrayElemAt: ['$userInfo.profile.firstName', 0] }, ''] },
                ' ',
                { $ifNull: [{ $arrayElemAt: ['$userInfo.profile.lastName', 0] }, ''] },
              ],
            },
            totalEarned: 1,
            transactionCount: 1,
            _id: 0,
          },
        },
      ]),

      // 5. Fraud — hourly alert counts (last 24h)
      CoinTransaction.aggregate([
        { $match: { type: 'earned', createdAt: { $gte: twentyFourHoursAgo } } },
        {
          $group: {
            _id: { user: '$user', hour: { $hour: '$createdAt' } },
            total: { $sum: '$amount' },
          },
        },
        { $match: { total: { $gt: FRAUD_THRESHOLD } } },
        { $group: { _id: '$_id.hour', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { hour: '$_id', count: 1, _id: 0 } },
      ]),

      // 6. Coin issuance today
      CoinTransaction.aggregate([
        { $match: { type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // 7. Coin issuance yesterday
      CoinTransaction.aggregate([
        { $match: { type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // 8. Top sources today
      CoinTransaction.aggregate([
        { $match: { type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: today } } },
        { $group: { _id: '$source', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
        { $limit: 5 },
        { $project: { source: '$_id', amount: 1, count: 1, _id: 0 } },
      ]),

      // 9. Pending reversals count
      Order.countDocuments({ status: 'cancelled', 'cancellation.refundStatus': 'pending' }),

      // 10. Completed reversals today
      CoinTransaction.aggregate([
        { $match: { type: 'refunded', createdAt: { $gte: today } } },
        { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),

      // 11. Oldest pending reversal
      Order.findOne({ status: 'cancelled', 'cancellation.refundStatus': 'pending' })
        .sort({ 'cancellation.cancelledAt': 1, createdAt: 1 })
        .select('cancellation.cancelledAt createdAt')
        .lean(),

      // 12. Settlement summary
      MerchantWallet.aggregate([
        { $match: { isActive: true, 'balance.pending': { $gt: 0 } } },
        { $group: { _id: null, totalPending: { $sum: '$balance.pending' }, merchantCount: { $sum: 1 } } },
      ]),

      // 13. Top merchants by pending settlement
      MerchantWallet.aggregate([
        { $match: { isActive: true, 'balance.pending': { $gt: 0 } } },
        { $sort: { 'balance.pending': -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'stores',
            localField: 'store',
            foreignField: '_id',
            as: 'storeInfo',
            pipeline: [{ $project: { name: 1 } }],
          },
        },
        {
          $project: {
            merchantId: '$merchant',
            storeName: { $ifNull: [{ $arrayElemAt: ['$storeInfo.name', 0] }, 'Unknown'] },
            pendingAmount: '$balance.pending',
            settlementCycle: 1,
            _id: 0,
          },
        },
      ]),
    ]);

    // ── Build liability map ──────────────────────────────────
    const liabilityMap: Record<string, { totalPending: number; totalSettled: number; count: number }> = {};
    for (const row of liabilityAgg) {
      liabilityMap[row._id] = row;
    }

    // ── Compute issuance metrics ─────────────────────────────
    const todayTotal = issuanceTodayAgg[0]?.total || 0;
    const yesterdayTotal = issuanceYesterdayAgg[0]?.total || 0;
    const hoursElapsed = Math.max(1, (now.getTime() - today.getTime()) / 3600000);
    const changePercent =
      yesterdayTotal > 0
        ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
        : todayTotal > 0
          ? 100
          : 0;

    // ── Compute oldest pending age ───────────────────────────
    let oldestPendingAge: number | null = null;
    if (oldestPending) {
      const cancelDate = (oldestPending as any).cancellation?.cancelledAt || (oldestPending as any).createdAt;
      if (cancelDate) {
        oldestPendingAge = Math.round((now.getTime() - new Date(cancelDate).getTime()) / 3600000);
      }
    }

    // ── Assemble response ────────────────────────────────────
    const result = {
      cashbackToday: {
        totalAmount: cashbackTodayAgg[0]?.total || 0,
        transactionCount: cashbackTodayAgg[0]?.count || 0,
        yesterdayAmount: cashbackYesterdayAgg[0]?.total || 0,
      },
      merchantLiability: {
        totalPending:
          (liabilityMap['active']?.totalPending || 0) + (liabilityMap['pending_settlement']?.totalPending || 0),
        totalSettled: liabilityMap['settled']?.totalSettled || 0,
        activeCount: liabilityMap['active']?.count || 0,
        pendingSettlementCount: liabilityMap['pending_settlement']?.count || 0,
        disputedCount: liabilityMap['disputed']?.count || 0,
      },
      fraudAlerts: {
        alertCount: fraudUsersAgg.length,
        threshold: FRAUD_THRESHOLD,
        window: '24h',
        topFlaggedUsers: fraudUsersAgg,
        hourlyAlertCounts: fraudHourlyAgg,
      },
      coinIssuance: {
        todayTotal,
        yesterdayTotal,
        changePercent,
        hourlyRate: Math.round(todayTotal / hoursElapsed),
        topSources: topSourcesAgg,
      },
      rewardReversals: {
        pendingReversals,
        completedReversalsToday: completedReversalsAgg[0]?.count || 0,
        completedReversalAmount: completedReversalsAgg[0]?.amount || 0,
        oldestPendingAge,
      },
      settlementDue: {
        totalDueMerchants: settlementSummaryAgg[0]?.merchantCount || 0,
        totalPendingAmount: settlementSummaryAgg[0]?.totalPending || 0,
        topMerchants: topMerchantsAgg,
      },
      lastUpdated: now.toISOString(),
    };

    // Cache result
    await redisService
      .set(CACHE_KEY, result, CACHE_TTL)
      .catch((err) => logger.warn('[Economics] Cache set for economics dashboard failed', { error: err.message }));

    res.json({ success: true, data: result });
  }),
);

/**
 * @route   GET /api/admin/economics/cashback-status
 * @desc    Read current platform-wide cashback status
 * @access  Admin
 */
router.get(
  '/cashback-status',
  asyncHandler(async (_req: Request, res: Response) => {
    const flagKey = 'platform:cashback_enabled';
    const redisValue = await redisService.get<boolean | string | number | null>(flagKey);

    if (typeof redisValue === 'boolean') {
      return sendSuccess(res, { enabled: redisValue, source: 'redis' });
    }

    if (typeof redisValue === 'string') {
      const normalized = redisValue.trim().toLowerCase();
      if (normalized === 'true' || normalized === 'false') {
        return sendSuccess(res, { enabled: normalized === 'true', source: 'redis' });
      }
    }

    if (typeof redisValue === 'number') {
      return sendSuccess(res, { enabled: redisValue !== 0, source: 'redis' });
    }

    const config = await WalletConfig.findOne().select('platformSettings.cashbackEnabled').lean();
    const persistedValue = config?.platformSettings?.cashbackEnabled;

    if (typeof persistedValue === 'boolean') {
      return sendSuccess(res, { enabled: persistedValue, source: 'wallet_config' });
    }

    return sendSuccess(res, { enabled: true, source: 'default' });
  }),
);

/**
 * @route   POST /api/admin/economics/cashback-toggle
 * @desc    Emergency toggle for platform-wide cashback (superadmin only)
 * @access  Super Admin
 */
router.post(
  '/cashback-toggle',
  requireSuperAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: 'enabled (boolean) is required' });
    }

    // Use Redis feature flag for instant effect
    const flagKey = 'platform:cashback_enabled';
    await redisService.set(flagKey, enabled, 0); // no expiry

    // Also persist in WalletConfig for durability
    const config = await WalletConfig.findOne();
    if (config) {
      if (!config.get('platformSettings')) {
        config.set('platformSettings', {});
      }
      config.set('platformSettings.cashbackEnabled', enabled);
      config.markModified('platformSettings');
      await config.save();
    }

    logger.info(`🚨 [Emergency] Cashback ${enabled ? 'RESUMED' : 'PAUSED'} by admin ${req.userId}`);

    res.json({
      success: true,
      message: `Cashback ${enabled ? 'resumed' : 'paused'} platform-wide`,
      data: { cashbackEnabled: enabled },
    });
  }),
);

/**
 * @route   GET /api/admin/economics/float-forecast
 * @desc    Platform float/burn forecast — total outstanding liability, projected burn, required float
 */
router.get(
  '/float-forecast',
  asyncHandler(async (_req: Request, res: Response) => {
    const cacheKey = 'admin:economics:float-forecast';
    const cached = await redisService.get<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalLiability, dailyBurnLast30d, weeklyBurnTrend, totalIssuedToday, activeMerchants] = await Promise.all([
      // 1. Total outstanding liability (all pending + active)
      MerchantLiability.aggregate([
        { $match: { status: { $in: ['active', 'pending_settlement'] } } },
        {
          $group: {
            _id: null,
            totalPending: { $sum: '$pendingAmount' },
            totalIssued: { $sum: '$rewardIssued' },
            totalSettled: { $sum: '$settledAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Average daily coin burn (last 30 days)
      CoinTransaction.aggregate([
        { $match: { type: 'earned', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, daily: { $sum: '$amount' } } },
        { $group: { _id: null, avgDaily: { $avg: '$daily' }, totalDays: { $sum: 1 }, totalCoins: { $sum: '$daily' } } },
      ]),

      // 3. Last 7 days burn per day (trend line)
      CoinTransaction.aggregate([
        { $match: { type: 'earned', createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 4. Total issued today
      CoinTransaction.aggregate([
        { $match: { type: 'earned', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // 5. Active merchant count
      MerchantLiability.distinct('merchant', { status: { $in: ['active', 'pending_settlement'] } }),
    ]);

    const liability = totalLiability[0] || { totalPending: 0, totalIssued: 0, totalSettled: 0, count: 0 };
    const burn = dailyBurnLast30d[0] || { avgDaily: 0, totalDays: 0, totalCoins: 0 };
    const todayIssued = totalIssuedToday[0] || { total: 0, count: 0 };

    const forecast = {
      // Current state
      outstandingLiability: liability.totalPending,
      totalIssuedAllTime: liability.totalIssued,
      totalSettledAllTime: liability.totalSettled,
      activeMerchantCount: activeMerchants.length,
      openLiabilityRecords: liability.count,

      // Burn metrics
      avgDailyBurn: Math.round(burn.avgDaily || 0),
      todayBurn: todayIssued.total,
      todayTransactions: todayIssued.count,

      // Projections
      projectedMonthlyBurn: Math.round((burn.avgDaily || 0) * 30),
      projectedQuarterlyBurn: Math.round((burn.avgDaily || 0) * 90),
      requiredFloatCapital: Math.round(liability.totalPending + (burn.avgDaily || 0) * 30), // Outstanding + 1 month runway

      // Trend (last 7 days)
      dailyBurnTrend: weeklyBurnTrend.map((d) => ({
        date: String(d._id ?? ''),
        coinsIssued: Number(d.total ?? 0),
        transactions: Number(d.count ?? 0),
      })),

      // Health indicator
      burnRateChange:
        weeklyBurnTrend.length >= 2
          ? Math.round(
              ((Number(weeklyBurnTrend[weeklyBurnTrend.length - 1]?.total ?? 0) -
                Number(weeklyBurnTrend[0]?.total ?? 0)) /
                Math.max(Number(weeklyBurnTrend[0]?.total ?? 1), 1)) *
                100,
            )
          : 0,

      generatedAt: now.toISOString(),
    };

    await redisService.set(cacheKey, forecast, 300); // 5 min cache

    return res.json({ success: true, data: forecast });
  }),
);

/**
 * @route   GET /api/admin/economics/coin-liability-breakdown
 * @desc    DEV: economics control — Aggregate wallet balances by coin type
 *          Shows total outstanding redeemable coins, issuance trends, and estimated liability
 * @access  Admin
 */
router.get(
  '/coin-liability-breakdown',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const Wallet = require('../../models/Wallet').Wallet || require('../../models/Wallet').default;
      const CoinTransactionModel = CoinTransaction;

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // DEV: economics control — Parallel queries for comprehensive liability snapshot
      const [breakdown, issuanceToday, issuanceYesterday] = await Promise.all([
        Wallet.aggregate([
          {
            $group: {
              _id: null,
              rezCoins: { $sum: '$rezCoins' },
              promoCoins: { $sum: '$promoCoins' },
              priveCoins: { $sum: '$priveCoins' },
              brandedCoins: { $sum: '$brandedCoins' },
              trialCoins: { $sum: { $ifNull: ['$trialCoins', 0] } },
              totalUsers: { $sum: 1 },
            },
          },
        ]),
        // DEV: economics control — Track coins issued today (P&L: daily burn metric)
        CoinTransactionModel.aggregate([
          { $match: { type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: today } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        // DEV: economics control — Track coins issued yesterday for trend
        CoinTransactionModel.aggregate([
          { $match: { type: { $in: ['earned', 'bonus'] }, createdAt: { $gte: yesterday, $lt: today } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

      const data = breakdown[0] || {
        rezCoins: 0,
        promoCoins: 0,
        priveCoins: 0,
        brandedCoins: 0,
        trialCoins: 0,
        totalUsers: 0,
      };

      const todayIssuance = issuanceToday[0] || { total: 0, count: 0 };
      const yesterdayIssuance = issuanceYesterday[0] || { total: 0, count: 0 };

      // BAK-GATEWAY-017 FIX: Make COIN_VALUE_INR configurable via env var.
      // The hardcoded 0.10 meant the entire liability estimate was wrong if the
      // actual rate diverged from 10 paise per coin.
      const COIN_VALUE_INR = parseFloat(process.env.COIN_VALUE_INR || '0.10');

      const totalCoins = data.rezCoins + data.promoCoins + data.priveCoins + data.brandedCoins + data.trialCoins;
      const liabilityINR = {
        rez: Math.round(data.rezCoins * COIN_VALUE_INR),
        promo: Math.round(data.promoCoins * COIN_VALUE_INR),
        prive: Math.round(data.priveCoins * COIN_VALUE_INR),
        branded: Math.round(data.brandedCoins * COIN_VALUE_INR),
        trial: Math.round(data.trialCoins * COIN_VALUE_INR),
        total: Math.round(totalCoins * COIN_VALUE_INR),
      };

      // DEV: economics control — Calculate issuance trend (P&L: warn on spike)
      const issuanceTrend =
        yesterdayIssuance.total > 0
          ? Math.round(((todayIssuance.total - yesterdayIssuance.total) / yesterdayIssuance.total) * 100)
          : todayIssuance.total > 0
            ? 100
            : 0;

      return sendSuccess(
        res,
        {
          coins: data,
          liabilityINR,
          totalUsers: data.totalUsers,
          // DEV: economics control — Issuance metrics (P&L: daily burn tracking)
          issuance: {
            today: {
              totalCoins: todayIssuance.total,
              transactionCount: todayIssuance.count,
              averagePerTransaction:
                todayIssuance.count > 0 ? Math.round(todayIssuance.total / todayIssuance.count) : 0,
            },
            yesterday: {
              totalCoins: yesterdayIssuance.total,
              transactionCount: yesterdayIssuance.count,
              averagePerTransaction:
                yesterdayIssuance.count > 0 ? Math.round(yesterdayIssuance.total / yesterdayIssuance.count) : 0,
            },
            trendPercent: issuanceTrend,
            trendAlert:
              issuanceTrend > 50
                ? 'SPIKE - issuance up more than 50%'
                : issuanceTrend < -50
                  ? 'DROP - issuance down more than 50%'
                  : 'NORMAL',
          },
          // DEV: economics control — Liability snapshot (P&L: total outstanding commitment)
          liabilitySnapshot: {
            totalOutstandingCoins: totalCoins,
            estimatedLiabilityINR: Math.round(totalCoins * COIN_VALUE_INR),
            liabilityPerActiveUser: Math.round((totalCoins / Math.max(data.totalUsers, 1)) * 100) / 100,
            coinValueRate: COIN_VALUE_INR,
          },
          generatedAt: now.toISOString(),
        },
        'Coin liability breakdown with issuance trends retrieved',
      );
    } catch (err: any) {
      logger.error('[ECONOMICS] Coin liability breakdown failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }),
);

/**
 * @route   GET /api/admin/economics/revenue-by-vertical
 * @desc    Revenue breakdown by vertical (store category) with growth comparison
 * @access  Admin
 */
router.get(
  '/revenue-by-vertical',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { period = '7d' } = req.query;
      const days = period === '30d' ? 30 : period === '24h' ? 1 : 7;
      const since = new Date(Date.now() - days * 24 * 3600000);
      const prevSince = new Date(since.getTime() - days * 24 * 3600000);

      let StorePayment: any;
      try {
        StorePayment =
          require('../../models/StorePayment').StorePayment || require('../../models/StorePayment').default;
      } catch {
        StorePayment = null;
      }

      if (!StorePayment) {
        return sendSuccess(
          res,
          { breakdown: [], prevBreakdown: [], period, since },
          'No StorePayment model available',
          200,
        );
      }

      // Shared pipeline stages: lookup Store → Category to resolve vertical name
      const lookupStages = [
        { $lookup: { from: 'stores', localField: 'storeId', foreignField: '_id', as: '_store' } },
        { $unwind: { path: '$_store', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: '_store.category', foreignField: '_id', as: '_cat' } },
        { $unwind: { path: '$_cat', preserveNullAndEmptyArrays: true } },
      ];

      const [breakdown, prevBreakdown] = await Promise.all([
        // Current period
        StorePayment.aggregate([
          { $match: { createdAt: { $gte: since }, status: 'completed' } },
          ...lookupStages,
          {
            $group: {
              _id: { $ifNull: ['$_cat.name', 'Uncategorized'] },
              revenue: { $sum: '$billAmount' },
              transactions: { $sum: 1 },
              avgTransaction: { $avg: '$billAmount' },
              storeIds: { $addToSet: '$storeId' },
              userIds: { $addToSet: '$userId' },
            },
          },
          {
            $project: {
              _id: 1,
              revenue: { $round: ['$revenue', 2] },
              transactions: 1,
              avgTransaction: { $round: ['$avgTransaction', 2] },
              storeCount: { $size: '$storeIds' },
              uniqueCustomers: { $size: '$userIds' },
            },
          },
          { $sort: { revenue: -1 } },
        ]),
        // Previous period (for growth comparison)
        StorePayment.aggregate([
          { $match: { createdAt: { $gte: prevSince, $lt: since }, status: 'completed' } },
          ...lookupStages,
          {
            $group: {
              _id: { $ifNull: ['$_cat.name', 'Uncategorized'] },
              revenue: { $sum: '$billAmount' },
              transactions: { $sum: 1 },
            },
          },
        ]),
      ]);

      // Merge growth data into breakdown
      const prevMap = new Map<string, any>(prevBreakdown.map((p: any) => [p._id, p]));
      const enriched = breakdown.map((item: any) => {
        const prev: any = prevMap.get(item._id);
        const prevRevenue = prev?.revenue || 0;
        const growth =
          prevRevenue > 0
            ? Math.round(((item.revenue - prevRevenue) / prevRevenue) * 10000) / 100
            : item.revenue > 0
              ? 100
              : 0;
        return { ...item, prevRevenue, growth };
      });

      return sendSuccess(
        res,
        {
          breakdown: enriched,
          period,
          since,
        },
        'Revenue by vertical retrieved',
      );
    } catch (err: any) {
      logger.error('[ECONOMICS] Revenue by vertical failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }),
);

/**
 * @route   GET /api/admin/economics/payment-failures
 * @desc    Payment failure breakdown for last 24 hours
 * @access  Admin
 */
router.get(
  '/payment-failures',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const since = new Date(Date.now() - 24 * 3600000);

      const Payment = require('../../models/Payment').Payment || require('../../models/Payment').default;

      const [total, failed, byReason] = await Promise.all([
        Payment.countDocuments({ createdAt: { $gte: since } }),
        Payment.countDocuments({ createdAt: { $gte: since }, status: 'failed' }),
        Payment.aggregate([
          { $match: { createdAt: { $gte: since }, status: 'failed' } },
          { $group: { _id: '$failureReason', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]).catch(() => []),
      ]);

      const successRate = total > 0 ? Math.round(((total - failed) / total) * 100) : 100;

      return sendSuccess(
        res,
        {
          total,
          failed,
          successRate,
          byReason,
          period: '24h',
        },
        'Payment failure data retrieved',
      );
    } catch (err: any) {
      logger.error('[ECONOMICS] Payment failures failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }),
);

/**
 * @route   GET /api/admin/economics/coin-burn-rate
 * @desc    Reward burn rate visibility — total coins ISSUED vs REDEEMED (spent) vs EXPIRED
 *          for a rolling period (default: last 30 days, configurable via ?days=N).
 *          Also returns outstanding liability (coins currently held by users).
 *
 * Response shape:
 *   {
 *     period: { days: 30, from: ISO, to: ISO },
 *     issued:   { total, count },      // type: earned | bonus | branded_award
 *     redeemed: { total, count },      // type: spent
 *     expired:  { total, count },      // type: expired
 *     netOutstanding: number,          // issued - redeemed - expired  (should match wallet sums)
 *     burnRatio: number,               // redeemed / issued  (healthy target: > 0.25)
 *     expiryRatio: number,             // expired / issued   (high = UX problem; low = liability problem)
 *     dailyTrend: [{ date, issued, redeemed, expired }]  // last N days
 *   }
 * @access  Admin
 *
 * TODO — KNOWN GAP (Issue #1 — Reward Burn Rate Visibility):
 *   This endpoint reports issued/redeemed/expired in aggregate but does NOT yet
 *   reconcile against live wallet balances.  A full reconciliation would:
 *     1. Sum all wallet.rezCoins + wallet.promoCoins + ... across users  (see /coin-liability-breakdown)
 *     2. Compare against  (lifetime issued) - (lifetime redeemed) - (lifetime expired)
 *   Any discrepancy > 1% should trigger an alert.
 *   Implement: GET /api/admin/economics/coin-reconciliation  (sprint backlog)
 */
router.get(
  '/coin-burn-rate',
  asyncHandler(async (req: Request, res: Response) => {
    const days = Math.min(Math.max(parseInt((req.query.days as string) || '30', 10), 1), 365);
    const cacheKey = `admin:economics:coin-burn-rate:${days}`;

    const cached = await redisService.get<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const now = new Date();
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const ISSUE_TYPES = ['earned', 'bonus', 'branded_award'] as const;
    const REDEEM_TYPES = ['spent'] as const;
    const EXPIRE_TYPES = ['expired'] as const;

    const [issuedAgg, redeemedAgg, expiredAgg, dailyTrendAgg] = await Promise.all([
      // Total issued in period
      CoinTransaction.aggregate([
        { $match: { type: { $in: [...ISSUE_TYPES] }, createdAt: { $gte: from } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Total redeemed (spent) in period
      CoinTransaction.aggregate([
        { $match: { type: { $in: [...REDEEM_TYPES] }, createdAt: { $gte: from } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Total expired in period
      CoinTransaction.aggregate([
        { $match: { type: { $in: [...EXPIRE_TYPES] }, createdAt: { $gte: from } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Daily breakdown for trend chart
      CoinTransaction.aggregate([
        {
          $match: {
            type: { $in: [...ISSUE_TYPES, ...REDEEM_TYPES, ...EXPIRE_TYPES] },
            createdAt: { $gte: from },
          },
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
    ]);

    const issued = { total: issuedAgg[0]?.total || 0, count: issuedAgg[0]?.count || 0 };
    const redeemed = { total: redeemedAgg[0]?.total || 0, count: redeemedAgg[0]?.count || 0 };
    const expired = { total: expiredAgg[0]?.total || 0, count: expiredAgg[0]?.count || 0 };

    const netOutstanding = issued.total - redeemed.total - expired.total;
    const burnRatio = issued.total > 0 ? Math.round((redeemed.total / issued.total) * 10000) / 10000 : 0;
    const expiryRatio = issued.total > 0 ? Math.round((expired.total / issued.total) * 10000) / 10000 : 0;

    // Roll up daily trend into { date, issued, redeemed, expired } rows
    const dailyMap: Record<string, { date: string; issued: number; redeemed: number; expired: number }> = {};
    for (const row of dailyTrendAgg) {
      const date = String(row._id.date ?? '');
      const type = String(row._id.type ?? '');
      if (!dailyMap[date]) {
        dailyMap[date] = { date, issued: 0, redeemed: 0, expired: 0 };
      }
      if (ISSUE_TYPES.includes(type as (typeof ISSUE_TYPES)[number])) dailyMap[date].issued += row.total;
      if (REDEEM_TYPES.includes(type as (typeof REDEEM_TYPES)[number])) dailyMap[date].redeemed += row.total;
      if (EXPIRE_TYPES.includes(type as (typeof EXPIRE_TYPES)[number])) dailyMap[date].expired += row.total;
    }
    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const result = {
      period: { days, from: from.toISOString(), to: now.toISOString() },
      issued,
      redeemed,
      expired,
      netOutstanding,
      burnRatio,
      expiryRatio,
      dailyTrend,
      generatedAt: now.toISOString(),
    };

    await redisService.set(cacheKey, result, 120).catch(() => {
      /* non-fatal */
    });

    return res.json({ success: true, data: result });
  }),
);

/**
 * @route   GET /api/admin/economics/coin-reconciliation
 * @desc    Reconcile lifetime issued/spent/expired coins against live wallet balances
 * @access  Admin
 */
router.get(
  '/coin-reconciliation',
  asyncHandler(async (_req: Request, res: Response) => {
    const cacheKey = 'admin:economics:coin-reconciliation';
    const cached = await redisService.get<any>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const ISSUE_TYPES = ['earned', 'bonus', 'branded_award'] as const;
    const REDEEM_TYPES = ['spent'] as const;
    const EXPIRE_TYPES = ['expired'] as const;

    const [issuedAgg, redeemedAgg, expiredAgg, walletAgg] = await Promise.all([
      CoinTransaction.aggregate([
        { $match: { type: { $in: [...ISSUE_TYPES] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      CoinTransaction.aggregate([
        { $match: { type: { $in: [...REDEEM_TYPES] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      CoinTransaction.aggregate([
        { $match: { type: { $in: [...EXPIRE_TYPES] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Wallet.aggregate([
        {
          $project: {
            rezCoins: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$coins',
                    as: 'coin',
                    cond: {
                      $and: [{ $eq: ['$$coin.type', 'rez'] }, { $ne: ['$$coin.isActive', false] }],
                    },
                  },
                },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] },
              },
            },
            priveCoins: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$coins',
                    as: 'coin',
                    cond: {
                      $and: [{ $eq: ['$$coin.type', 'prive'] }, { $ne: ['$$coin.isActive', false] }],
                    },
                  },
                },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] },
              },
            },
            promoCoins: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$coins',
                    as: 'coin',
                    cond: {
                      $and: [{ $in: ['$$coin.type', ['promo', 'promotion']] }, { $ne: ['$$coin.isActive', false] }],
                    },
                  },
                },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] },
              },
            },
            brandedCoins: {
              $reduce: {
                input: {
                  $filter: {
                    input: '$brandedCoins',
                    as: 'coin',
                    cond: {
                      $and: [{ $ne: ['$$coin.isActive', false] }, { $gt: [{ $ifNull: ['$$coin.amount', 0] }, 0] }],
                    },
                  },
                },
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            rezCoins: { $sum: '$rezCoins' },
            priveCoins: { $sum: '$priveCoins' },
            promoCoins: { $sum: '$promoCoins' },
            brandedCoins: { $sum: '$brandedCoins' },
            walletCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const issued = { total: issuedAgg[0]?.total || 0, count: issuedAgg[0]?.count || 0 };
    const redeemed = { total: redeemedAgg[0]?.total || 0, count: redeemedAgg[0]?.count || 0 };
    const expired = { total: expiredAgg[0]?.total || 0, count: expiredAgg[0]?.count || 0 };
    const walletBalances = walletAgg[0] || {
      rezCoins: 0,
      priveCoins: 0,
      promoCoins: 0,
      brandedCoins: 0,
      walletCount: 0,
    };

    const currentWalletLiability =
      walletBalances.rezCoins + walletBalances.priveCoins + walletBalances.promoCoins + walletBalances.brandedCoins;
    const expectedLiability = issued.total - redeemed.total - expired.total;
    const discrepancy = currentWalletLiability - expectedLiability;
    const discrepancyPercent =
      Math.round((Math.abs(discrepancy) / Math.max(Math.abs(expectedLiability), currentWalletLiability, 1)) * 10000) /
      100;

    const result = {
      transactions: {
        issued,
        redeemed,
        expired,
        expectedLiability,
      },
      liveWallets: {
        rezCoins: walletBalances.rezCoins,
        priveCoins: walletBalances.priveCoins,
        promoCoins: walletBalances.promoCoins,
        brandedCoins: walletBalances.brandedCoins,
        total: currentWalletLiability,
        walletCount: walletBalances.walletCount,
      },
      reconciliation: {
        discrepancy,
        discrepancyPercent,
        withinThreshold: discrepancyPercent <= 1,
        thresholdPercent: 1,
        status: discrepancyPercent <= 1 ? 'ok' : 'alert',
      },
      generatedAt: new Date().toISOString(),
    };

    await redisService.set(cacheKey, result, 300).catch(() => {
      /* non-fatal */
    });

    return res.json({ success: true, data: result });
  }),
);

/**
 * @route   PATCH /api/admin/economics/merchant-reward-config/:merchantId
 * @desc    DEV: economics control — Validate and update merchant cashback config
 *          Ensures merchant's cashback % does not exceed (merchantMarginPercent - 5%)
 *          This protects merchant profitability (P&L: margin floor enforcement)
 * @access  Super Admin
 */
router.patch(
  '/merchant-reward-config/:merchantId',
  requireSuperAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { cashbackPercent, merchantMarginPercent, reason } = req.body;
      const { merchantId } = req.params;

      // Validate inputs
      if (typeof cashbackPercent !== 'number' || typeof merchantMarginPercent !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'cashbackPercent and merchantMarginPercent (numbers) are required',
        });
      }

      // DEV: economics control — Merchant margin floor validation
      // Cashback cannot exceed (margin - 5%) to protect merchant profitability
      const marginFloor = merchantMarginPercent - 5;

      if (cashbackPercent > marginFloor) {
        return res.status(400).json({
          success: false,
          message: 'Exceeds safe maximum: cashback percentage cannot exceed merchant margin - 5%',
          requested: cashbackPercent,
          merchantMargin: merchantMarginPercent,
          allowedMaximum: marginFloor,
          reason: `Merchant margin is ${merchantMarginPercent}%, so max cashback is ${marginFloor}% to preserve ${5}% profit margin`,
        });
      }

      // Log the change for audit trail
      logger.info('[EconGuard] Merchant Margin Floor Validation', {
        merchantId,
        cashbackPercent,
        merchantMarginPercent,
        marginFloor,
        status: 'APPROVED',
        validatedBy: (req as any).user?.id || 'system',
        reason: reason || 'none',
      });

      return res.json({
        success: true,
        message: 'Merchant reward config is within safe margins',
        data: {
          merchantId,
          approvedCashbackPercent: cashbackPercent,
          merchantMarginPercent,
          marginFloor,
          profitMarginPreserved: 5,
          validatedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      logger.error('[ECONOMICS] Merchant reward config validation failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }),
);

/**
 * @route   GET /api/admin/economics/reward-audit-summary
 * @desc    DEV: economics control — Summary of all reward config audit trails
 *          P&L: accountability and traceability for every config change
 * @access  Admin
 */
router.get(
  '/reward-audit-summary',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const RewardConfig = require('../../models/RewardConfig').default;

      // Fetch all configs with their change histories
      const allConfigs = await RewardConfig.find(
        {},
        {
          key: 1,
          description: 1,
          category: 1,
          value: 1,
          changeHistory: 1,
          updatedBy: 1,
          updatedAt: 1,
        },
      ).lean();

      // Aggregate metrics
      let totalConfigsMonitored = allConfigs.length;
      let totalChangesRecorded = 0;
      const changesByAdmin: Record<string, number> = {};
      const changesByCategory: Record<string, number> = {};
      const recentChanges = [];

      for (const config of allConfigs) {
        if (config.changeHistory && config.changeHistory.length > 0) {
          totalChangesRecorded += config.changeHistory.length;

          // Track changes by admin
          for (const change of config.changeHistory) {
            const admin = change.changedBy || 'unknown';
            changesByAdmin[admin] = (changesByAdmin[admin] || 0) + 1;

            // Collect recent changes
            recentChanges.push({
              configKey: config.key,
              oldValue: change.oldValue,
              newValue: change.newValue,
              changedBy: change.changedBy,
              changedAt: change.changedAt,
              reason: change.reason,
            });
          }
        }

        // Track changes by category
        changesByCategory[config.category] =
          (changesByCategory[config.category] || 0) + (config.changeHistory?.length || 0);
      }

      // Sort recent changes by timestamp (newest first)
      recentChanges.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());

      return sendSuccess(
        res,
        {
          summary: {
            totalConfigsMonitored,
            totalChangesRecorded,
            avgChangesPerConfig:
              totalConfigsMonitored > 0 ? (totalChangesRecorded / totalConfigsMonitored).toFixed(2) : 0,
          },
          changesByAdmin,
          changesByCategory,
          recentChanges: recentChanges.slice(0, 20), // Last 20 changes
        },
        'Reward config audit summary retrieved',
      );
    } catch (err: any) {
      logger.error('[ECONOMICS] Reward audit summary failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }),
);

export default router;
