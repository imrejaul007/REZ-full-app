import { Request, Response } from 'express';
import leaderboardService from '../services/leaderboardService';
import { asyncHandler } from '../utils/asyncHandler';

class LeaderboardController {
  // GET /api/leaderboard/spending
  getSpendingLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const VALID_PERIODS = ['day', 'week', 'month', 'all'];
      const periodParam = req.query.period as string;
      const period = (VALID_PERIODS.includes(periodParam) ? periodParam : 'month') as 'day' | 'week' | 'month' | 'all';
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

      const leaderboard = await leaderboardService.getSpendingLeaderboard(period, limit);

      res.json({
        success: true,
        data: leaderboard,
        period,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/leaderboard/reviews
  getReviewLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const VALID_PERIODS = ['day', 'week', 'month', 'all'];
      const periodParam = req.query.period as string;
      const period = (VALID_PERIODS.includes(periodParam) ? periodParam : 'month') as 'day' | 'week' | 'month' | 'all';
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

      const leaderboard = await leaderboardService.getReviewLeaderboard(period, limit);

      res.json({
        success: true,
        data: leaderboard,
        period,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/leaderboard/referrals
  getReferralLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const VALID_PERIODS = ['day', 'week', 'month', 'all'];
      const periodParam = req.query.period as string;
      const period = (VALID_PERIODS.includes(periodParam) ? periodParam : 'month') as 'day' | 'week' | 'month' | 'all';
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

      const leaderboard = await leaderboardService.getReferralLeaderboard(period, limit);

      res.json({
        success: true,
        data: leaderboard,
        period,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/leaderboard/cashback
  getCashbackLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const VALID_PERIODS = ['day', 'week', 'month', 'all'];
      const periodParam = req.query.period as string;
      const period = (VALID_PERIODS.includes(periodParam) ? periodParam : 'month') as 'day' | 'week' | 'month' | 'all';
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

      const leaderboard = await leaderboardService.getCashbackLeaderboard(period, limit);

      res.json({
        success: true,
        data: leaderboard,
        period,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/leaderboard/streak
  getStreakLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const VALID_STREAK_TYPES = ['login', 'order', 'review'];
      const typeParam = req.query.type as string;
      const type = (VALID_STREAK_TYPES.includes(typeParam) ? typeParam : 'login') as 'login' | 'order' | 'review';
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

      const leaderboard = await leaderboardService.getStreakLeaderboard(type, limit);

      res.json({
        success: true,
        data: leaderboard,
        type,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/leaderboard/all
  getAllLeaderboards = asyncHandler(async (req: Request, res: Response) => {
    try {
      const stats = await leaderboardService.getLeaderboardStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/leaderboard/my-rank
  getMyRank = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const period = (req.query.period as 'day' | 'week' | 'month' | 'all') || 'month';

      const ranks = await leaderboardService.getAllUserRanks(userId, period);

      res.json({
        success: true,
        data: ranks,
        period,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
}

export default new LeaderboardController();
