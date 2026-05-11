// @ts-nocheck
import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { Order } from '../../models/Order';
import { User } from '../../models/User';
import { Merchant } from '../../models/Merchant';
import { MerchantWallet } from '../../models/MerchantWallet';
import { CoinTransaction } from '../../models/CoinTransaction';
import { WebOrder } from '../../models/WebOrder';
import { asyncHandler } from '../../utils/asyncHandler';
import redisService from '../../services/redisService';

const router = Router();
const DASHBOARD_STATS_CACHE_KEY = 'admin:dashboard:stats';
const DASHBOARD_RECENT_ACTIVITY_CACHE_PREFIX = 'admin:dashboard:recent-activity';
const DASHBOARD_WEB_MENU_CACHE_KEY = 'admin:dashboard:web-menu-analytics';

async function getCachedAdminPayload<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  try {
    const cached = await redisService.get<T>(key);
    if (cached) return cached;
  } catch {
    // Fail open: admin dashboards should still render if Redis is unavailable.
  }

  const data = await loader();

  try {
    await redisService.set(key, data, ttlSeconds);
  } catch {
    // Fail open: a cache miss should never block analytics responses.
  }

  return data;
}

// All routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get platform-wide dashboard statistics
 * @access  Admin
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await getCachedAdminPayload(DASHBOARD_STATS_CACHE_KEY, 300, async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get counts in parallel
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        newUsersThisMonth,
        totalMerchants,
        activeMerchants,
        pendingMerchants,
        suspendedMerchants,
        newMerchantsThisMonth,
        totalOrders,
        todayOrders,
        thisWeekOrders,
        thisMonthOrders,
        pendingOrders,
        totalCoinTransactions,
        todayCoinTransactions,
        thisMonthCoinTransactions,
        pendingCoinRewards,
        platformStats,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
        Merchant.countDocuments({}),
        Merchant.countDocuments({ isActive: true }),
        Merchant.countDocuments({ verificationStatus: 'pending' }),
        Merchant.countDocuments({ isActive: false }),
        Merchant.countDocuments({ createdAt: { $gte: thisMonthStart } }),
        Order.countDocuments(),
        Order.countDocuments({ createdAt: { $gte: today } }),
        Order.countDocuments({ createdAt: { $gte: thisWeekStart } }),
        Order.countDocuments({ createdAt: { $gte: thisMonthStart } }),
        Order.countDocuments({ status: 'placed' }),
        CoinTransaction.countDocuments({}),
        CoinTransaction.countDocuments({ createdAt: { $gte: today } }),
        CoinTransaction.countDocuments({ createdAt: { $gte: thisMonthStart } }),
        (async () => {
          try {
            const PendingCoinReward =
              require('../../models/PendingCoinReward').default ||
              require('../../models/PendingCoinReward').PendingCoinReward;
            return await PendingCoinReward.countDocuments({ status: 'pending' });
          } catch {
            return 0;
          }
        })(),
        MerchantWallet.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$statistics.totalSales' },
              totalPlatformFees: { $sum: '$statistics.totalPlatformFees' },
              totalNetSales: { $sum: '$statistics.netSales' },
              totalOrders: { $sum: '$statistics.totalOrders' },
            },
          },
        ]).allowDiskUse(true),
      ]);

      const [coinStats, revenueStats, todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
        CoinTransaction.aggregate([
          { $match: { type: { $in: ['earned', 'bonus', 'branded_award'] } } },
          { $group: { _id: null, totalAwarded: { $sum: '$amount' } } },
        ]).allowDiskUse(true),
        Order.aggregate([
          { $match: { 'payment.status': 'paid' } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totals.total' },
              totalPlatformFees: { $sum: { $ifNull: ['$totals.platformFee', 0] } },
            },
          },
        ]).allowDiskUse(true),
        Order.aggregate([
          { $match: { 'payment.status': 'paid', createdAt: { $gte: today } } },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$totals.total' },
              platformFees: { $sum: { $ifNull: ['$totals.platformFee', 0] } },
            },
          },
        ]).allowDiskUse(true),
        Order.aggregate([
          { $match: { 'payment.status': 'paid', createdAt: { $gte: thisWeekStart } } },
          { $group: { _id: null, revenue: { $sum: '$totals.total' } } },
        ]).allowDiskUse(true),
        Order.aggregate([
          { $match: { 'payment.status': 'paid', createdAt: { $gte: thisMonthStart } } },
          { $group: { _id: null, revenue: { $sum: '$totals.total' } } },
        ]).allowDiskUse(true),
      ]);

      return {
        merchants: {
          total: totalMerchants,
          active: activeMerchants,
          pending: pendingMerchants,
          suspended: suspendedMerchants,
          newThisMonth: newMerchantsThisMonth,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
          newThisMonth: newUsersThisMonth,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          thisWeek: thisWeekOrders,
          thisMonth: thisMonthOrders,
          pendingCount: pendingOrders,
        },
        revenue: {
          today: todayRevenue[0]?.revenue || 0,
          thisWeek: weekRevenue[0]?.revenue || 0,
          thisMonth: monthRevenue[0]?.revenue || 0,
          totalPlatformFees: revenueStats[0]?.totalPlatformFees || platformStats[0]?.totalPlatformFees || 0,
          todayPlatformFees: todayRevenue[0]?.platformFees || 0,
        },
        coins: {
          totalAwarded: coinStats[0]?.totalAwarded || totalCoinTransactions,
          pendingApproval: pendingCoinRewards,
          awardedToday: todayCoinTransactions,
          awardedThisMonth: thisMonthCoinTransactions,
        },
        merchantWallets: platformStats[0] || {
          totalSales: 0,
          totalPlatformFees: 0,
          totalNetSales: 0,
          totalOrders: 0,
        },
      };
    });

    res.json({
      success: true,
      data: stats,
    });
  }),
);

/**
 * @route   GET /api/admin/dashboard/recent-activity
 * @desc    Get recent platform activity
 * @access  Admin
 */
router.get(
  '/recent-activity',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const cacheKey = `${DASHBOARD_RECENT_ACTIVITY_CACHE_PREFIX}:${limit}`;
    const data = await getCachedAdminPayload(cacheKey, 60, async () => {
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('orderNumber status totals.total payment.status createdAt user')
        .populate('user', 'profile.firstName profile.lastName phoneNumber');

      const recentCoins = await CoinTransaction.find({ source: 'purchase_reward' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('amount source description createdAt user')
        .populate('user', 'profile.firstName profile.lastName phoneNumber');

      return {
        recentOrders,
        recentCoinAwards: recentCoins,
      };
    });

    res.json({
      success: true,
      data,
    });
  }),
);

/**
 * @route   GET /api/admin/dashboard/web-menu-analytics
 * @desc    Web menu (QR ordering) analytics — totals, top stores, recent orders
 * @access  Admin
 */
router.get(
  '/web-menu-analytics',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getCachedAdminPayload(DASHBOARD_WEB_MENU_CACHE_KEY, 180, async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [totalCount, todayCount, monthCount, revenueStats, todayRevenueStats, topStores, recentOrders] =
        await Promise.all([
          WebOrder.countDocuments({}),
          WebOrder.countDocuments({ createdAt: { $gte: today } }),
          WebOrder.countDocuments({ createdAt: { $gte: thisMonthStart } }),

          WebOrder.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$total' }, count: { $sum: 1 } } },
          ]).allowDiskUse(true),

          WebOrder.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: today } } },
            { $group: { _id: null, revenue: { $sum: '$total' } } },
          ]).allowDiskUse(true),

          WebOrder.aggregate([
            { $match: { paymentStatus: { $in: ['paid'] } } },
            {
              $group: {
                _id: '$storeId',
                storeName: { $first: '$storeName' },
                count: { $sum: 1 },
                revenue: { $sum: '$total' },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { _id: 0, storeId: '$_id', storeName: 1, count: 1, revenue: 1 } },
          ]).allowDiskUse(true),

          WebOrder.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .select(
              'orderNumber storeName storeId customerPhone customerName total status paymentStatus createdAt tableNumber',
            )
            .lean(),
        ]);

      const totalRevenue = revenueStats[0]?.totalRevenue || 0;
      const paidCount = revenueStats[0]?.count || 0;
      const avgOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0;

      return {
        totalCount,
        todayCount,
        monthCount,
        totalRevenue,
        todayRevenue: todayRevenueStats[0]?.revenue || 0,
        avgOrderValue,
        topStores,
        recentOrders,
      };
    });

    res.json({
      success: true,
      data,
    });
  }),
);

export default router;
