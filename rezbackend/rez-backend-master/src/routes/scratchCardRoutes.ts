// @ts-nocheck
// ScratchCard Routes
// Routes for scratch card functionality

import { Router } from 'express';
import {
  createScratchCard,
  getUserScratchCards,
  scratchCard,
  claimPrize,
  checkEligibility,
} from '../controllers/scratchCardController';
import { authenticate } from '../middleware/auth';
import { requireGamificationFeature } from '../middleware/gamificationFeatureGate';
import { createRateLimiter } from '../middleware/rateLimiter';
import { validateParams, commonSchemas } from '../middleware/validation';
import { Joi } from '../middleware/validation';

const router = Router();

// Rate limiters — prevent farming by spamming create / claim
// 3 scratch-card creations per user per day
const scratchCreateLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  prefix: 'scratch-create',
  message: 'Scratch card creation limit reached for today. Try again tomorrow.',
});

// 10 scratch / claim actions per user per 15 minutes
const scratchActionLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: 'scratch-action',
  message: 'Too many scratch card actions. Please wait before trying again.',
});

// Param schema for :id
const cardIdSchema = Joi.object({ id: commonSchemas.objectId().required() });

// All routes require authentication
router.use(authenticate);

// PHASE 3 — disabled until core is stable
router.use(requireGamificationFeature('miniGames', { cards: [] }));

/**
 * @route   GET /api/scratch-cards/eligibility
 * @desc    Check if user is eligible for scratch card
 * @access  Private
 */
router.get('/eligibility', checkEligibility);

/**
 * @route   GET /api/scratch-cards
 * @desc    Get user's scratch cards
 * @access  Private
 */
router.get('/', getUserScratchCards);

/**
 * @route   POST /api/scratch-cards
 * @desc    Create a new scratch card for user
 * @access  Private
 */
router.post('/', scratchCreateLimiter, createScratchCard);

/**
 * @route   POST /api/scratch-cards/:id/scratch
 * @desc    Scratch a card to reveal prize
 * @access  Private
 */
router.post('/:id/scratch', scratchActionLimiter, validateParams(cardIdSchema), scratchCard);

/**
 * @route   POST /api/scratch-cards/:id/claim
 * @desc    Claim prize from scratch card
 * @access  Private
 */
router.post('/:id/claim', scratchActionLimiter, validateParams(cardIdSchema), claimPrize);

export default router;
