/**
 * Credit Routes — score, report, tips
 *
 * GET  /finance/credit/score          → get ReZ Score + eligibility
 * POST /finance/credit/score/check    → trigger score check + earn coins
 * POST /finance/credit/score/refresh  → force refresh score
 *
 * @openapi
 * @tags Credit
 * @component
 */

import { Router } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { creditScoreService } from '../services/creditScoreService';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { track } from '../services/intentCaptureService';
import { err, ErrorCodes } from '../utils/response';

// BE-FIN-022: Rate limiter for credit score queries (max 1 per 10 seconds per user)
// CRIT-06 FIX: Use Lua script for atomic INCR + EXPIRE to prevent key living forever
// if process crashes between INCR and EXPIRE.
async function checkCreditScoreRateLimit(userId: string): Promise<boolean> {
  const key = `rate_limit:credit_score:${userId}`;
  const ttl = 10;

  const script = `
    local key = KEYS[1]
    local ttl = tonumber(ARGV[1])
    local current = redis.call('incr', key)
    if current == 1 then
      redis.call('expire', key, ttl)
    end
    return current
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const current = await (redis as any).eval(script, 1, key, ttl) as number;
  return current === 1; // only allow first request in 10s window
}

const router = Router();
router.use(authenticateUser);

/**
 * @route GET /api/finance/credit/score
 * @summary Get user's ReZ credit score and eligibility
 * @tags Credit
 * @response {object} 200 - Credit score response with score, grade, eligibility
 * @response {object} 401 - Unauthorized
 * @response {object} 429 - Rate limit exceeded (max 1 per 10 seconds)
 * @response {object} 500 - Server error
 */
router.get('/score', async (req: AuthenticatedRequest, res) => {
  // BE-FIN-022: Apply rate limiting
  const allowed = await checkCreditScoreRateLimit(req.userId!);
  if (!allowed) {
    logger.warn('[Credit] Credit score rate limit exceeded', { userId: req.userId });
    res.status(429).json({ success: false, error: 'Too many requests. Please wait 10 seconds.' });
    return;
  }

  try {
    const data = await creditScoreService.getUserScore(req.userId!);
    res.json({ success: true, ...data });
  } catch (error) {
    logger.error('[Credit] GET /score error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/credit/score/check
 * @summary Trigger credit score check and earn coins (once per day)
 * @tags Credit
 * @description Checks user's credit score and rewards coins if not already claimed today
 * @response {object} 200 - Score check result with coins awarded
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
router.post('/score/check', async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const result = await creditScoreService.checkScoreAndReward(req.userId);
    res.json({ success: true, rezScore: result.score, coinsAwarded: result.coinsAwarded });
  } catch (error) {
    logger.error('[Credit] POST /score/check error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/credit/score/refresh
 * @summary Force refresh credit score from bureau
 * @tags Credit
 * @description Fetches latest score from credit bureau and returns updated eligibility and tips
 * @response {object} 200 - Refreshed score with eligibility and tips
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
router.post('/score/refresh', async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    // Get previous score before refresh
    const currentData = await creditScoreService.getUserScore(req.userId);
    const previousScore = currentData.rezScore;

    const profile = await creditScoreService.refreshScore(req.userId);

    // Track credit score refresh event
    track({
      userId: req.userId,
      event: 'credit_score_refreshed',
      intentKey: 'GENERAL:rez-finance',
      properties: {
        previousScore,
        newScore: profile.rezScore,
        factors: profile.factors || []
      }
    }).catch(() => {});

    res.json({ success: true, rezScore: profile.rezScore, eligibility: profile.eligibility, tips: profile.tips });
  } catch (error) {
    logger.error('[Credit] POST /score/refresh error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

export default router;
