import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendBadRequest, sendNotFound } from '../utils/response';
import Referral, { ReferralStatus } from '../models/Referral';
import { ReferralFraudDetection } from '../services/referralFraudDetection';
import { ReferralAnalyticsService } from '../services/referralAnalyticsService';

const fraudDetection = new ReferralFraudDetection();
const analyticsService = new ReferralAnalyticsService();

/**
 * GET /api/admin/referrals
 * List all referrals with filters
 */
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'tier', 'status', 'referralCode'];

export const getReferrals = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status, tier, fraudOnly, search, sortOrder = 'desc' } = req.query;

  // Whitelist sortBy to prevent NoSQL injection via sort key
  const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy as string) ? (req.query.sortBy as string) : 'createdAt';

  const pageNum = parseInt(page as string, 10);
  const limitNum = Math.min(parseInt(limit as string, 10), 100);
  const skip = (pageNum - 1) * limitNum;

  // Escape regex special characters to prevent ReDoS
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build filter
  const filter: any = {};
  if (status) filter.status = status;
  if (tier) filter.tier = tier;
  if (fraudOnly === 'true') filter['metadata.fraudFlag'] = true;
  // Apply search filter on referral code (with ReDoS-safe escaped regex)
  if (search) {
    const searchStr = escapeRegex(String(search).substring(0, 100));
    filter.referralCode = { $regex: searchStr, $options: 'i' };
  }

  const [referrals, total] = await Promise.all([
    Referral.find(filter)
      .populate('referrer', 'phoneNumber profile.firstName referral.referralCode')
      .populate('referee', 'phoneNumber profile.firstName')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Referral.countDocuments(filter),
  ]);

  sendSuccess(res, {
    referrals,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * GET /api/admin/referrals/analytics
 * Referral analytics dashboard
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const metrics = await analyticsService.getMetrics(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined,
  );

  sendSuccess(res, metrics);
});

/**
 * GET /api/admin/referrals/fraud
 * Get fraud statistics and flagged referrals
 */
export const getFraudDashboard = asyncHandler(async (req: Request, res: Response) => {
  const fraudStats = await fraudDetection.getFraudStats();

  // Get referrals flagged for review
  const flaggedReferrals = await Referral.find({
    $or: [{ 'metadata.fraudFlag': true }, { 'metadata.riskScore': { $gte: 60 } }],
  })
    .populate('referrer', 'phoneNumber profile.firstName')
    .populate('referee', 'phoneNumber profile.firstName')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  sendSuccess(res, {
    stats: fraudStats,
    flaggedReferrals,
  });
});

/**
 * POST /api/admin/referrals/:id/approve
 * Approve a flagged referral
 */
export const approveReferral = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const referral = await Referral.findById(id);
  if (!referral) return sendNotFound(res, 'Referral not found');

  // Clear fraud flags (metadata is Mixed/flexible on the Mongoose schema)
  referral.metadata = {
    ...((referral.metadata as any) || {}),
    fraudFlag: false,
    fraudReason: undefined,
    adminApproved: true,
    approvedBy: (req as any).user?.userId,
    approvedAt: new Date(),
  };

  await referral.save();

  sendSuccess(res, { referral }, 'Referral approved');
});

/**
 * POST /api/admin/referrals/:id/reject
 * Reject/block a referral
 */
export const rejectReferral = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) return sendBadRequest(res, 'Rejection reason is required');

  const referral = await Referral.findById(id).lean();
  if (!referral) return sendNotFound(res, 'Referral not found');

  await fraudDetection.markAsFraud(id, reason);

  sendSuccess(res, { referral }, 'Referral rejected');
});

/**
 * POST /api/admin/referrals/scan-fraud
 * Run fraud scan on pending referrals
 */
export const runFraudScan = asyncHandler(async (req: Request, res: Response) => {
  const results = await fraudDetection.scanExistingReferrals();
  sendSuccess(res, results, 'Fraud scan completed');
});

/**
 * GET /api/admin/referrals/leaderboard
 * Get referral leaderboard
 */
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const leaderboard = await analyticsService.getLeaderboard(limit);
  sendSuccess(res, { leaderboard });
});

/**
 * GET /api/admin/referrals/stats-summary
 * Quick summary stats for dashboard widget
 */
export const getStatsSummary = asyncHandler(async (req: Request, res: Response) => {
  const [total, pending, active, completed, expired, fraud] = await Promise.all([
    Referral.countDocuments(),
    Referral.countDocuments({ status: ReferralStatus.PENDING }),
    Referral.countDocuments({ status: ReferralStatus.ACTIVE }),
    Referral.countDocuments({ status: ReferralStatus.COMPLETED }),
    Referral.countDocuments({ status: ReferralStatus.EXPIRED }),
    Referral.countDocuments({ 'metadata.fraudFlag': true }),
  ]);

  sendSuccess(res, {
    total,
    pending,
    active,
    completed,
    expired,
    fraud,
    conversionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
  });
});
