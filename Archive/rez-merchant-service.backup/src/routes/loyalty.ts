// @ts-nocheck
/**
 * Merchant Loyalty Routes
 *
 * API endpoints for merchants to manage their loyalty programs:
 * - View customer loyalty profiles
 * - Manage loyalty settings
 * - View analytics and reports
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, body, validationResult } from 'express-validator';
import { requireAuth, requireStoreAccess } from '@/middleware/auth';
import { MILESTONES, BADGES } from '@/config/milestones';
import { TIERS } from '@/config/tiers';
import { logger } from '@/lib/logger';

const router = Router();

// ── Validation Helpers ───────────────────────────────────────────────────────────

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

// ── Customer Loyalty Management ──────────────────────────────────────────────────

/**
 * GET /api/loyalty/customers
 * List all customers with loyalty data for the merchant's store
 */
router.get(
  '/customers',
  requireAuth,
  requireStoreAccess,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('tier').optional().isIn(['bronze', 'silver', 'gold', 'platinum']),
    query('search').optional().isString(),
    query('sortBy').optional().isIn(['totalVisits', 'totalSpent', 'lastVisit', 'currentStreak']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const storeId = req.store?.id;
      const {
        page = 1,
        limit = 20,
        tier,
        search,
        sortBy = 'totalVisits',
        sortOrder = 'desc',
      } = req.query;

      // In production, this would query the database
      // Mock response for demonstration
      const mockCustomers = [
        {
          userId: 'user_1',
          name: 'Rahul Sharma',
          phone: '9876543210',
          tier: 'platinum',
          totalVisits: 78,
          totalSpent: 45600,
          currentStreak: 45,
          longestStreak: 60,
          lastVisit: new Date().toISOString(),
          badgesCount: 12,
          points: 5000,
          coins: 15000,
        },
        {
          userId: 'user_2',
          name: 'Priya Patel',
          phone: '9876543211',
          tier: 'gold',
          totalVisits: 35,
          totalSpent: 28900,
          currentStreak: 12,
          longestStreak: 20,
          lastVisit: new Date(Date.now() - 86400000).toISOString(),
          badgesCount: 8,
          points: 2500,
          coins: 8500,
        },
      ];

      logger.info('Fetched loyalty customers', {
        storeId,
        page,
        limit,
        tier,
        count: mockCustomers.length,
      });

      res.json({
        success: true,
        data: {
          customers: mockCustomers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 150,
            hasNext: true,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to fetch loyalty customers', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customers',
      });
    }
  }
);

/**
 * GET /api/loyalty/customers/:userId
 * Get detailed loyalty profile for a specific customer
 */
router.get(
  '/customers/:userId',
  requireAuth,
  requireStoreAccess,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const storeId = req.store?.id;

      // Mock response
      const customerProfile = {
        userId,
        name: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul@example.com',
        tier: 'platinum',
        totalVisits: 78,
        totalSpent: 45600,
        currentStreak: 45,
        longestStreak: 60,
        lastVisit: new Date().toISOString(),
        points: 5000,
        coins: 15000,
        badges: [
          { id: 'legend', name: 'Legend', icon: '🏆', unlockedAt: '2024-02-15T10:00:00Z' },
          { id: 'elite', name: 'Elite', icon: '💎', unlockedAt: '2024-01-20T10:00:00Z' },
        ],
        milestones: MILESTONES.slice(0, 5).map((m) => ({
          ...m,
          current: m.target + 10,
          unlockedAt: '2024-01-15T10:00:00Z',
        })),
        visitHistory: [
          { date: '2024-03-15', storeName: 'Main Store', spent: 850 },
          { date: '2024-03-14', storeName: 'Main Store', spent: 1200 },
        ],
        createdAt: '2023-06-01T00:00:00Z',
      };

      logger.info('Fetched customer loyalty profile', {
        userId,
        storeId,
      });

      res.json({
        success: true,
        data: customerProfile,
      });
    } catch (error) {
      logger.error('Failed to fetch customer loyalty profile', {
        error,
        userId: req.params.userId,
        storeId: req.store?.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch customer profile',
      });
    }
  }
);

/**
 * GET /api/loyalty/stats
 * Get loyalty program statistics for the store
 */
router.get(
  '/stats',
  requireAuth,
  requireStoreAccess,
  async (req: Request, res: Response) => {
    try {
      const storeId = req.store?.id;

      // Mock statistics
      const stats = {
        totalMembers: 1247,
        activeMembers: 892,
        avgVisitsPerMonth: 3.2,
        avgOrderValue: 450,
        loyaltyRevenue: 456780,
        revenuePercentage: 23,
        topTierCounts: {
          platinum: 45,
          gold: 123,
          silver: 412,
          bronze: 667,
        },
        recentUnlocks: [
          {
            customerName: 'Priya Patel',
            milestone: 'Loyal',
            unlockedAt: new Date().toISOString(),
          },
        ],
        atRiskCount: 15,
        newMembersThisMonth: 89,
        redemptionRate: 0.68,
      };

      logger.info('Fetched loyalty stats', { storeId });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to fetch loyalty stats', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
      });
    }
  }
);

/**
 * GET /api/loyalty/analytics
 * Get detailed analytics for the loyalty program
 */
router.get(
  '/analytics',
  requireAuth,
  requireStoreAccess,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('metric').optional().isIn(['visits', 'revenue', 'redemptions', 'tierUpgrades']),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const storeId = req.store?.id;
      const { startDate, endDate, metric } = req.query;

      // Mock analytics data
      const analytics = {
        timeSeries: [
          { date: '2024-03-01', visits: 120, revenue: 54000, redemptions: 45 },
          { date: '2024-03-02', visits: 135, revenue: 60750, redemptions: 52 },
          { date: '2024-03-03', visits: 110, revenue: 49500, redemptions: 38 },
          { date: '2024-03-04', visits: 145, revenue: 65250, redemptions: 58 },
          { date: '2024-03-05', visits: 160, revenue: 72000, redemptions: 65 },
        ],
        summary: {
          totalVisits: 670,
          totalRevenue: 301500,
          totalRedemptions: 258,
          avgOrderValue: 450,
          conversionRate: 0.12,
        },
        cohortRetention: [
          { month: 'Month 1', retention: 0.85 },
          { month: 'Month 2', retention: 0.72 },
          { month: 'Month 3', retention: 0.65 },
          { month: 'Month 6', retention: 0.48 },
          { month: 'Month 12', retention: 0.35 },
        ],
      };

      logger.info('Fetched loyalty analytics', { storeId, metric });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Failed to fetch loyalty analytics', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
      });
    }
  }
);

/**
 * GET /api/loyalty/milestones
 * Get configured milestones for the store
 */
router.get(
  '/milestones',
  requireAuth,
  requireStoreAccess,
  async (req: Request, res: Response) => {
    try {
      const storeId = req.store?.id;

      // Return configured milestones with unlock counts
      const milestonesWithStats = MILESTONES.map((milestone) => ({
        ...milestone,
        unlockCount: Math.floor(Math.random() * 100),
        lastUnlockedAt: new Date().toISOString(),
      }));

      logger.info('Fetched loyalty milestones', { storeId, count: milestonesWithStats.length });

      res.json({
        success: true,
        data: milestonesWithStats,
      });
    } catch (error) {
      logger.error('Failed to fetch milestones', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch milestones',
      });
    }
  }
);

/**
 * PUT /api/loyalty/milestones/:milestoneId
 * Update milestone configuration
 */
router.put(
  '/milestones/:milestoneId',
  requireAuth,
  requireStoreAccess,
  [
    body('target').optional().isInt({ min: 1 }),
    body('reward.coins').optional().isInt({ min: 0 }),
    body('reward.discount').optional().isString(),
    body('enabled').optional().isBoolean(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { milestoneId } = req.params;
      const { target, reward, enabled } = req.body;
      const storeId = req.store?.id;

      // In production, update the database
      logger.info('Updated milestone configuration', {
        milestoneId,
        storeId,
        target,
        reward,
        enabled,
      });

      res.json({
        success: true,
        data: {
          id: milestoneId,
          target,
          reward,
          enabled,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to update milestone', {
        error,
        milestoneId: req.params.milestoneId,
        storeId: req.store?.id,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update milestone',
      });
    }
  }
);

/**
 * GET /api/loyalty/tiers
 * Get tier configuration
 */
router.get(
  '/tiers',
  requireAuth,
  requireStoreAccess,
  async (req: Request, res: Response) => {
    try {
      const storeId = req.store?.id;

      const tiersWithStats = Object.entries(TIERS).map(([key, config]) => ({
        tier: key,
        ...config,
        memberCount: Math.floor(Math.random() * 500),
        avgMonthlySpend: Math.floor(Math.random() * 50000),
      }));

      logger.info('Fetched tier configuration', { storeId });

      res.json({
        success: true,
        data: tiersWithStats,
      });
    } catch (error) {
      logger.error('Failed to fetch tiers', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tiers',
      });
    }
  }
);

/**
 * POST /api/loyalty/send-notification
 * Send a notification to loyalty members
 */
router.post(
  '/send-notification',
  requireAuth,
  requireStoreAccess,
  [
    body('type').isIn(['streak_reminder', 'milestone_approaching', 'tier_upgrade', 'special_offer']),
    body('target').isIn(['all', 'tier', 'segment']),
    body('targetTier').optional().isIn(['bronze', 'silver', 'gold', 'platinum']),
    body('segment').optional().isString(),
    body('message').isString().isLength({ min: 1, max: 500 }),
    body('offerCode').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { type, target, targetTier, segment, message, offerCode } = req.body;
      const storeId = req.store?.id;

      // In production, this would send push notifications via FCM/APNs
      const notificationId = `notif_${Date.now()}`;

      logger.info('Sending loyalty notification', {
        storeId,
        type,
        target,
        targetTier,
        segment,
        notificationId,
      });

      res.json({
        success: true,
        data: {
          notificationId,
          type,
          target,
          message,
          sentAt: new Date().toISOString(),
          estimatedReach: Math.floor(Math.random() * 500) + 100,
        },
      });
    } catch (error) {
      logger.error('Failed to send notification', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
      });
    }
  }
);

/**
 * GET /api/loyalty/redemptions
 * Get redemption history
 */
router.get(
  '/redemptions',
  requireAuth,
  requireStoreAccess,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('rewardType').optional().isIn(['coins', 'discount', 'free_item']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const storeId = req.store?.id;
      const { page = 1, limit = 20, rewardType, startDate, endDate } = req.query;

      // Mock redemption history
      const redemptions = [
        {
          id: 'red_1',
          customerName: 'Rahul Sharma',
          customerPhone: '9876543210',
          rewardType: 'discount',
          rewardValue: '10%',
          coinsSpent: 500,
          redeemedAt: new Date().toISOString(),
        },
        {
          id: 'red_2',
          customerName: 'Priya Patel',
          customerPhone: '9876543211',
          rewardType: 'free_item',
          rewardValue: 'Free Appetizer',
          coinsSpent: 200,
          redeemedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      logger.info('Fetched redemption history', {
        storeId,
        count: redemptions.length,
      });

      res.json({
        success: true,
        data: {
          redemptions,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 150,
            hasNext: true,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to fetch redemptions', { error, storeId: req.store?.id });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch redemptions',
      });
    }
  }
);

export default router;
