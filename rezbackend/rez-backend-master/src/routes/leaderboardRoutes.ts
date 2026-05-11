// @ts-nocheck
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import leaderboardController from '../controllers/leaderboardController';
import { authenticate } from '../middleware/auth';
import { requireGamificationFeature } from '../middleware/gamificationFeatureGate';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError } from '../utils/response';
import { User } from '../models/User';
import Campus from '../models/Campus';
import redisService from '../services/redisService';
import { logger } from '../config/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// CAMPUS & COMPANY LEADERBOARDS (identity layer)
// These are NOT behind gamification feature gate
// ============================================

function anonymizeName(firstName?: string, lastName?: string): string {
  const first = firstName || 'User';
  const lastInitial = lastName ? ` ${lastName.charAt(0)}.` : '';
  return `${first}${lastInitial}`;
}

/**
 * @route   GET /api/leaderboard/campus
 * @desc    Campus savings leaderboard for a given institution
 */
router.get(
  '/campus',
  asyncHandler(async (req: Request, res: Response) => {
    const { institutionName } = req.query;
    const userId = (req as any).user._id.toString();

    if (!institutionName) {
      return sendError(res, 'institutionName query param is required', 400);
    }

    const cacheKey = `campus-lb:${(institutionName as string).toLowerCase().replace(/\s+/g, '-')}`;

    const cached = await redisService.get<string>(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached as string);
        const userEntry = data.leaderboard.find((e: any) => e.userId === userId);
        return sendSuccess(res, { ...data, currentUserRank: userEntry?.rank || null });
      } catch (parseError) {
        logger.error('Failed to parse cached leaderboard:', parseError);
        // Continue with fresh calculation if cache is malformed
      }
    }

    const escapedName = (institutionName as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const students = await User.find({
      'verifications.student.verified': true,
      'verifications.student.instituteName': { $regex: escapedName, $options: 'i' },
      isActive: true,
    })
      .limit(1000) // cap: leaderboard only needs enough users to build rankings
      .select('_id profile.firstName profile.lastName')
      .lean();

    if (students.length === 0) {
      return sendSuccess(res, {
        institutionName,
        leaderboard: [],
        totalSaved: 0,
        studentCount: 0,
        currentUserRank: null,
      });
    }

    const studentIds = students.map((s) => s._id);
    const { CoinTransaction } = await import('../models/CoinTransaction');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const earnings = await CoinTransaction.aggregate([
      { $match: { user: { $in: studentIds }, type: 'earned', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', totalEarned: { $sum: '$amount' } } },
      { $sort: { totalEarned: -1 } },
      { $limit: 50 },
    ]);

    const COIN_TO_RUPEE = 1; // 1 coin = ₹1 (from checkoutConfig.coins.rezCoin.conversionRate)
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
    const leaderboard = earnings.map((e, idx) => {
      const student = studentMap.get(e._id.toString());
      return {
        rank: idx + 1,
        userId: e._id.toString(),
        name: anonymizeName((student as any)?.profile?.firstName, (student as any)?.profile?.lastName),
        totalEarned: e.totalEarned,
        totalSavedRupees: Math.floor(e.totalEarned * COIN_TO_RUPEE),
      };
    });

    const totalCoinsEarned = leaderboard.reduce((sum, e) => sum + e.totalEarned, 0);
    const totalSaved = Math.floor(totalCoinsEarned * COIN_TO_RUPEE);
    const result = { institutionName, leaderboard, totalSaved, totalCoinsEarned, studentCount: students.length };
    await redisService.set(cacheKey, JSON.stringify(result), 300);

    const userEntry = leaderboard.find((e) => e.userId === userId);
    sendSuccess(res, { ...result, currentUserRank: userEntry?.rank || null });
  }),
);

/**
 * @route   GET /api/leaderboard/company
 * @desc    Company savings leaderboard
 */
router.get(
  '/company',
  asyncHandler(async (req: Request, res: Response) => {
    const { companyName } = req.query;
    const userId = (req as any).user._id.toString();

    if (!companyName) {
      return sendError(res, 'companyName query param is required', 400);
    }

    const cacheKey = `company-lb:${(companyName as string).toLowerCase().replace(/\s+/g, '-')}`;

    const cached = await redisService.get<string>(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached as string);
        const userEntry = data.leaderboard.find((e: any) => e.userId === userId);
        return sendSuccess(res, { ...data, currentUserRank: userEntry?.rank || null });
      } catch (parseError) {
        logger.error('Failed to parse cached company leaderboard:', parseError);
        // Continue with fresh calculation if cache is malformed
      }
    }

    const escapedName = (companyName as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const employees = await User.find({
      'verifications.corporate.verified': true,
      'verifications.corporate.companyName': { $regex: escapedName, $options: 'i' },
      isActive: true,
    })
      .limit(1000)
      .select('_id profile.firstName profile.lastName')
      .lean();

    if (employees.length === 0) {
      return sendSuccess(res, {
        companyName,
        leaderboard: [],
        totalSaved: 0,
        employeeCount: 0,
        currentUserRank: null,
      });
    }

    const employeeIds = employees.map((e) => e._id);
    const { CoinTransaction } = await import('../models/CoinTransaction');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const earnings = await CoinTransaction.aggregate([
      { $match: { user: { $in: employeeIds }, type: 'earned', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', totalEarned: { $sum: '$amount' } } },
      { $sort: { totalEarned: -1 } },
      { $limit: 50 },
    ]);

    const employeeMap = new Map(employees.map((e) => [e._id.toString(), e]));
    const COIN_TO_RUPEE = 1; // 1 coin = ₹1 (from checkoutConfig.coins.rezCoin.conversionRate)
    const leaderboard = earnings.map((e, idx) => {
      const employee = employeeMap.get(e._id.toString());
      return {
        rank: idx + 1,
        userId: e._id.toString(),
        name: anonymizeName((employee as any)?.profile?.firstName, (employee as any)?.profile?.lastName),
        totalEarned: e.totalEarned,
        totalSavedRupees: Math.floor(e.totalEarned * COIN_TO_RUPEE),
      };
    });

    const totalCoinsEarned = leaderboard.reduce((sum, e) => sum + e.totalEarned, 0);
    const totalSaved = Math.floor(totalCoinsEarned * COIN_TO_RUPEE);
    const result = { companyName, leaderboard, totalSaved, totalCoinsEarned, employeeCount: employees.length };
    await redisService.set(cacheKey, JSON.stringify(result), 300);

    const userEntry = leaderboard.find((e) => e.userId === userId);
    sendSuccess(res, { ...result, currentUserRank: userEntry?.rank || null });
  }),
);

// ============================================
// CAMPUS LEADERBOARD BY campus_id (identity layer — NOT feature-gated)
// GET /api/leaderboard/campus-leaderboard?campus_id={id}&limit=20
// ============================================

router.get(
  '/campus-leaderboard',
  asyncHandler(async (req: Request, res: Response) => {
    const { campus_id, limit: limitStr } = req.query;
    const userId = (req as any).user._id.toString();

    if (!campus_id) {
      return sendError(res, 'campus_id query param is required', 400);
    }

    if (!mongoose.isValidObjectId(campus_id as string)) {
      return sendError(res, 'campus_id must be a valid ObjectId', 400);
    }

    const limitNum = Math.min(Math.max(parseInt(limitStr as string, 10) || 20, 1), 100);

    const cacheKey = `campus-lb-id:${campus_id}:limit:${limitNum}`;

    // ── cache hit ──────────────────────────────────────────────────────────────
    const cached = await redisService.get<string>(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached as string);
        const userEntry = data.leaderboard.find((e: any) => e.userId === userId);
        return sendSuccess(res, { ...data, currentUserRank: userEntry?.rank || null });
      } catch (parseError) {
        logger.error('[CampusLeaderboard] Failed to parse cached data:', parseError);
        // Fall through to fresh calculation
      }
    }

    // ── resolve Campus ─────────────────────────────────────────────────────────
    const campus = await Campus.findById(campus_id).lean();
    if (!campus) {
      return sendError(res, 'Campus not found', 404);
    }

    // ── resolve students verified at this institution ──────────────────────────
    const escapedName = campus.institution.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const students = await User.find({
      'verifications.student.verified': true,
      'verifications.student.instituteName': { $regex: escapedName, $options: 'i' },
      isActive: true,
    })
      .limit(1000)
      .select('_id profile.firstName profile.lastName')
      .lean();

    if (students.length === 0) {
      return sendSuccess(res, {
        campusId: campus_id,
        campusName: campus.name,
        institution: campus.institution,
        leaderboard: [],
        studentCount: 0,
        currentUserRank: null,
      });
    }

    const studentIds = students.map((s) => s._id);
    const { CoinTransaction } = await import('../models/CoinTransaction');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const earnings = await CoinTransaction.aggregate([
      { $match: { user: { $in: studentIds }, type: 'earned', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', totalEarned: { $sum: '$amount' } } },
      { $sort: { totalEarned: -1 } },
      { $limit: limitNum },
    ]);

    const COIN_TO_RUPEE = 1;
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
    const leaderboard = earnings.map((e, idx) => {
      const student = studentMap.get(e._id.toString());
      return {
        rank: idx + 1,
        userId: e._id.toString(),
        name: anonymizeName((student as any)?.profile?.firstName, (student as any)?.profile?.lastName),
        score: e.totalEarned,
        totalSavedRupees: Math.floor(e.totalEarned * COIN_TO_RUPEE),
      };
    });

    const result = {
      campusId: campus_id,
      campusName: campus.name,
      institution: campus.institution,
      leaderboard,
      studentCount: students.length,
    };

    await redisService.set(cacheKey, JSON.stringify(result), 300);

    const userEntry = leaderboard.find((e) => e.userId === userId);
    sendSuccess(res, { ...result, currentUserRank: userEntry?.rank || null });
  }),
);

// ============================================
// GAMIFICATION LEADERBOARDS (feature-gated)
// ============================================
router.use(requireGamificationFeature('leaderboard', { entries: [] }));

router.get('/spending', leaderboardController.getSpendingLeaderboard.bind(leaderboardController));
router.get('/reviews', leaderboardController.getReviewLeaderboard.bind(leaderboardController));
router.get('/referrals', leaderboardController.getReferralLeaderboard.bind(leaderboardController));
router.get('/cashback', leaderboardController.getCashbackLeaderboard.bind(leaderboardController));
router.get('/streak', leaderboardController.getStreakLeaderboard.bind(leaderboardController));
router.get('/all', leaderboardController.getAllLeaderboards.bind(leaderboardController));
router.get('/my-rank', leaderboardController.getMyRank.bind(leaderboardController));

export default router;
