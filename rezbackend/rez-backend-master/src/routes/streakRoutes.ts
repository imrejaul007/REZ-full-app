// @ts-nocheck
import { Router } from 'express';
import streakController from '../controllers/streakController';
import { authenticate } from '../middleware/auth';
import { requireGamificationFeature } from '../middleware/gamificationFeatureGate';
import { createRateLimiter } from '../middleware/rateLimiter';
import { validate, Joi } from '../middleware/validation';

const router = Router();

// Rate limiter — streak claims are reward-granting; cap at 20 per user per day
const streakClaimLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  prefix: 'streak-claim',
  message: 'Too many streak actions today. Please try again tomorrow.',
});

// Validation schemas for POST bodies
const streakTypeSchema = validate(
  Joi.object({
    type: Joi.string().trim().min(1).max(50).required(),
  }),
);

const milestoneDaySchema = validate(
  Joi.object({
    type: Joi.string().trim().min(1).max(50).required(),
    day: Joi.number().integer().min(1).required(),
  }),
);

const freezeSchema = validate(
  Joi.object({
    type: Joi.string().trim().min(1).max(50).required(),
    days: Joi.number().integer().min(1).max(7).required(),
  }),
);

// All routes require authentication
router.use(authenticate);

// PHASE 2 — disabled until core is stable
router.use(requireGamificationFeature('streaks', { streak: null }));

// Streak routes
router.get('/status', streakController.getUserStreaks.bind(streakController));
router.get('/all', streakController.getUserStreaks.bind(streakController));
router.post('/claim', streakClaimLimiter, streakTypeSchema, streakController.updateStreak.bind(streakController));
router.post(
  '/claim-milestone',
  streakClaimLimiter,
  milestoneDaySchema,
  streakController.claimMilestone.bind(streakController),
);
router.get('/milestones', streakController.getStreakStatistics.bind(streakController));
router.post('/freeze', streakClaimLimiter, freezeSchema, streakController.freezeStreak.bind(streakController));
router.get('/stats', streakController.getStreakStatistics.bind(streakController));

export default router;
