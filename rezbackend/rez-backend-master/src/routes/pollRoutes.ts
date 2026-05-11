// @ts-nocheck
import { Router } from 'express';
import { optionalAuth, authenticate as authenticateToken, requireAuth, requireAdmin } from '../middleware/auth';
import {
  getActivePolls,
  getDailyPoll,
  getPollDetail,
  votePoll,
  getMyVotes,
  createPoll,
  updatePoll,
  archivePoll,
} from '../controllers/pollController';

const router = Router();

/**
 * Poll Routes
 *
 * Public/user endpoints for voting on polls and earning coins.
 * Admin endpoints for poll CRUD and scheduling.
 */

// Public endpoints (optionalAuth to check vote status)
router.get('/active', optionalAuth, getActivePolls);
router.get('/daily', optionalAuth, getDailyPoll);
router.get('/my-votes', authenticateToken, getMyVotes);
router.get('/:id', optionalAuth, getPollDetail);

// User vote
router.post('/:id/vote', authenticateToken, votePoll);

// BR-C2 fix: Admin endpoints moved to adminPollRoutes.ts (mounted at /api/admin/polls).
// These handlers remain importable but are no longer registered on the consumer router.

export default router;
