import { Request, Response } from 'express';
import tournamentService from '../services/tournamentService';
import { asyncHandler } from '../utils/asyncHandler';

class TournamentController {
  // GET /api/tournaments
  getTournaments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { status, type, limit = 20, offset = 0 } = req.query;

      const VALID_STATUSES = ['upcoming', 'active', 'completed'] as const;
      const VALID_TYPES = ['daily', 'weekly', 'monthly', 'special'] as const;

      const safeStatus = VALID_STATUSES.includes(status as any)
        ? (status as 'upcoming' | 'active' | 'completed')
        : undefined;
      const safeType = VALID_TYPES.includes(type as any)
        ? (type as 'daily' | 'weekly' | 'monthly' | 'special')
        : undefined;

      const result = await tournamentService.getTournaments(
        safeStatus,
        safeType,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10),
      );

      res.json({
        success: true,
        data: result.tournaments,
        pagination: {
          total: result.total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/tournaments/featured
  getFeaturedTournaments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { limit = 5 } = req.query;

      const tournaments = await tournamentService.getFeaturedTournaments(parseInt(limit as string, 10));

      res.json({
        success: true,
        data: tournaments,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/tournaments/:id
  getTournamentById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const tournament = await tournamentService.getTournamentById(id);

      res.json({
        success: true,
        data: tournament,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  });

  // POST /api/tournaments/:id/join
  joinTournament = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const tournament = await tournamentService.joinTournament(id, userId);

      res.json({
        success: true,
        data: {
          tournamentId: tournament._id,
          name: tournament.name,
          participantsCount: tournament.participants.length,
        },
        message: 'Successfully joined the tournament!',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // POST /api/tournaments/:id/leave
  leaveTournament = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      await tournamentService.leaveTournament(id, userId);

      res.json({
        success: true,
        message: 'Left the tournament',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/tournaments/:id/leaderboard
  getTournamentLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { limit = 100 } = req.query;

      const leaderboard = await tournamentService.getTournamentLeaderboard(id, parseInt(limit as string, 10));

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/tournaments/:id/my-rank
  getMyRankInTournament = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const rank = await tournamentService.getUserRankInTournament(id, userId);

      if (!rank) {
        return res.status(404).json({
          success: false,
          message: 'Not a participant in this tournament',
        });
      }

      res.json({
        success: true,
        data: rank,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/tournaments/my-tournaments
  getMyTournaments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = (req.userId ?? (req as any).user?.id ?? '') as string;

      const tournaments = await tournamentService.getUserTournaments(userId);

      res.json({
        success: true,
        data: tournaments,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // GET /api/tournaments/live
  // Returns live and upcoming tournaments (supports optional auth)
  getLiveTournaments = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const { limit = 5 } = req.query;

      const tournaments = await tournamentService.getLiveTournaments(userId, parseInt(limit as string, 10));

      res.json({
        success: true,
        data: {
          tournaments,
          total: tournaments.length,
        },
        message: 'Live tournaments fetched',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });
}

export default new TournamentController();
