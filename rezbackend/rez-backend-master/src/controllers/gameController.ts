import { Request, Response } from 'express';
import gameService, { RequestMeta } from '../services/gameService';
import { asyncHandler } from '../utils/asyncHandler';
// BUG-060 FIX: Import response helpers to replace raw res.status().json() calls
import { sendSuccess, sendBadRequest, sendError, sendUnauthorized } from '../utils/response';

class GameController {
  /**
   * Sanitize session data before sending to client.
   * Strips sensitive metadata (correctAnswers, actualPrice, coinPositions, etc.)
   */
  private sanitizeSession(session: any) {
    if (!session) return session;
    const obj = session.toObject ? session.toObject() : { ...session };
    delete obj.metadata; // Never expose internal metadata to client
    delete obj.__v;
    return obj;
  }

  /** Extract request metadata for audit/fraud logging */
  private extractRequestMeta(req: Request): RequestMeta {
    return {
      ip: req.ip || (req.headers['x-forwarded-for'] as string) || undefined,
      userAgent: req.headers['user-agent'] || undefined,
      deviceFingerprint: (req.headers['x-device-fingerprint'] as string) || undefined,
    };
  }

  // ======== SPIN WHEEL ========

  // POST /api/games/spin-wheel/create
  createSpinWheel = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { earnedFrom } = req.body;

      const session = await gameService.createSpinWheelSession(userId, earnedFrom);

      return sendSuccess(res, this.sanitizeSession(session), 'Spin wheel session created');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/spin-wheel/play
  playSpinWheel = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId } = req.body;

      const session = await gameService.playSpinWheel(sessionId, userId);
      const sanitized = this.sanitizeSession(session);

      // Include tournament update data if present
      if ((session as any)._tournamentUpdate) {
        sanitized.tournamentUpdate = (session as any)._tournamentUpdate;
      }

      return sendSuccess(res, sanitized, 'Spin complete!');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== SCRATCH CARD ========

  // GET /api/games/scratch-card/eligibility
  getScratchCardEligibility = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      if (!userId) {
        return sendUnauthorized(res, 'User not authenticated');
      }

      const eligibility = await gameService.getScratchCardEligibility(userId);

      return sendSuccess(res, eligibility, 'Eligibility checked');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/scratch-card/create
  createScratchCard = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { earnedFrom } = req.body;
      const requestMeta = this.extractRequestMeta(req);

      const session = await gameService.createScratchCardSession(userId, earnedFrom || 'daily_free', requestMeta);

      return sendSuccess(res, this.sanitizeSession(session), 'Scratch card session created');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/scratch-card/play
  playScratchCard = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId } = req.body;

      const session = await gameService.playScratchCard(sessionId, userId);

      return sendSuccess(res, this.sanitizeSession(session), 'Scratch card revealed!');
    } catch (error: any) {
      // BUG-060 FIX: Use sendError/sendBadRequest instead of dynamic res.status()
      if (error.message?.includes('try again')) {
        return sendError(res, error.message);
      }
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/scratch-card/retry-claim
  retryScratchCardClaim = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId } = req.body;

      if (!userId || !sessionId) {
        return sendBadRequest(res, 'userId and sessionId required');
      }

      const session = await gameService.retryScratchCardClaim(sessionId, userId);

      return sendSuccess(res, this.sanitizeSession(session), 'Prize claimed successfully!');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== QUIZ ========

  // POST /api/games/quiz/create
  createQuiz = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { questions } = req.body;

      const session = await gameService.createQuizSession(userId, questions);

      return sendSuccess(res, this.sanitizeSession(session), 'Quiz session created');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/quiz/submit
  submitQuiz = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId, answers, correctAnswers } = req.body;

      const session = await gameService.submitQuizAnswers(sessionId, answers, correctAnswers, userId);

      const sanitized = this.sanitizeSession(session);

      // Include tournament update data if present
      if ((session as any)._tournamentUpdate) {
        sanitized.tournamentUpdate = (session as any)._tournamentUpdate;
      }

      return sendSuccess(res, sanitized, 'Quiz submitted successfully');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== DAILY TRIVIA ========

  // GET /api/games/daily-trivia
  getDailyTrivia = asyncHandler(async (req: Request, res: Response) => {
    try {
      const trivia = await gameService.getDailyTrivia();

      return sendSuccess(res, trivia);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  });

  // POST /api/games/daily-trivia/answer
  answerDailyTrivia = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { questionId, answer } = req.body;

      const result = await gameService.answerDailyTrivia(userId, questionId, answer);

      return sendSuccess(res, result, result.correct ? 'Correct answer!' : 'Wrong answer');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== GENERAL ========

  // GET /api/games/my-games
  getMyGames = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { gameType, limit } = req.query;

      const sessions = await gameService.getUserGameSessions(
        userId,
        gameType as string | undefined,
        limit ? parseInt(limit as string, 10) : undefined,
      );

      return sendSuccess(
        res,
        sessions.map((s) => this.sanitizeSession(s)),
      );
    } catch (error: any) {
      return sendError(res, error.message);
    }
  });

  // GET /api/games/pending
  getPendingGames = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;

      const games = await gameService.getPendingGames(userId);

      return sendSuccess(
        res,
        games.map((g) => this.sanitizeSession(g)),
      );
    } catch (error: any) {
      return sendError(res, error.message);
    }
  });

  // GET /api/games/statistics
  getGameStatistics = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;

      const stats = await gameService.getGameStats(userId);

      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  });

  // ======== MEMORY MATCH ========

  // POST /api/games/memory-match/start
  startMemoryMatch = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { difficulty = 'easy' } = req.body;

      if (!userId) {
        return sendUnauthorized(res, 'User not authenticated');
      }

      const result = await gameService.startMemoryMatch(userId, difficulty);

      return sendSuccess(res, result, 'Memory Match game started');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/memory-match/complete
  completeMemoryMatch = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId, score, timeSpent, moves } = req.body;

      const result = await gameService.completeMemoryMatch(sessionId, score, timeSpent, moves, userId);

      return sendSuccess(res, result, `You earned ${result.coins} coins!`);
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== COIN HUNT ========

  // POST /api/games/coin-hunt/start
  startCoinHunt = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;

      const result = await gameService.startCoinHunt(userId);

      return sendSuccess(res, result, 'Coin Hunt game started');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/coin-hunt/complete
  completeCoinHunt = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId, coinsCollected, score } = req.body;

      const result = await gameService.completeCoinHunt(sessionId, coinsCollected, score, userId);

      return sendSuccess(res, result, `You collected ${result.coinsEarned} coins!`);
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== GUESS THE PRICE ========

  // POST /api/games/guess-price/start
  startGuessPrice = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;

      const result = await gameService.startGuessPrice(userId);

      return sendSuccess(res, result, 'Guess the Price game started');
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // POST /api/games/guess-price/submit
  submitGuessPrice = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { sessionId, guessedPrice } = req.body;

      const result = await gameService.submitGuessPrice(sessionId, guessedPrice, userId);

      return sendSuccess(res, result, result.message);
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });

  // ======== DAILY LIMITS ========

  // GET /api/games/daily-limits
  getDailyLimits = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;

      const limits = await gameService.getDailyLimits(userId);

      return sendSuccess(res, limits);
    } catch (error: any) {
      return sendError(res, error.message);
    }
  });

  // GET /api/games/available
  // Returns all available games with play status (supports optional auth)
  getAvailableGames = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;

      const games = await gameService.getAvailableGames(userId);

      return sendSuccess(
        res,
        { games, total: games.length, todaysEarnings: games[0]?.todaysEarnings || 0 },
        'Available games fetched',
      );
    } catch (error: any) {
      return sendError(res, error.message);
    }
  });

  // GET /api/games/:gameType/status
  // Returns play status for a specific game type (Phase 4: Frontend Polish)
  getGameStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      // BUG-022 FIX: Use req.userId (set by auth middleware) instead of
      // req.user?.id to prevent IDOR — req.user could theoretically be
      // manipulated if downstream middleware overwrites it, while req.userId
      // is set once by the authenticate middleware and is authoritative.
      // Non-null assertion is safe here because all game routes are behind
      // the authenticate middleware which always sets req.userId.
      const userId = req.userId!;
      const { gameType } = req.params;

      if (!userId) {
        return sendUnauthorized(res, 'User not authenticated');
      }

      const status = await gameService.getGameStatus(userId, gameType);

      return sendSuccess(res, status);
    } catch (error: any) {
      // BUG-060 FIX: Use sendBadRequest helper instead of raw res.status(400)
      return sendBadRequest(res, error.message);
    }
  });
}

export default new GameController();
