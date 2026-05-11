// @ts-nocheck
// Referral Routes
// Routes for referral program endpoints

import express from 'express';
import {
  getReferralData,
  getReferralHistory,
  getReferralStatistics,
  generateReferralLink,
  shareReferralLink,
  claimReferralRewards,
  getReferralLeaderboard,
  getReferralCode,
  getReferralStats,
  getMyReferralCode,
  applyReferralCode,
} from '../controllers/referralController';
import { applyCode, checkUpgrade } from '../controllers/referralTierController';
import { authenticate } from '../middleware/auth';
import { referralLimiter, referralShareLimiter } from '../middleware/rateLimiter';
import { referralApplyLimiter } from '../middleware/financialRateLimiter';
import { validate, Joi } from '../middleware/validation';

const router = express.Router();

// All referral routes require authentication
router.use(authenticate);

// ✅ Apply rate limiting to all referral routes to prevent abuse
router.use(referralLimiter);

/**
 * @route   GET /api/referral/data
 * @desc    Get referral data
 * @access  Private
 */
router.get('/data', getReferralData);

/**
 * @route   GET /api/referral/history
 * @desc    Get referral history
 * @access  Private
 */
router.get('/history', getReferralHistory);

/**
 * @route   GET /api/referral/statistics
 * @desc    Get referral statistics
 * @access  Private
 */
router.get('/statistics', getReferralStatistics);

/**
 * @route   POST /api/referral/generate-link
 * @desc    Generate referral link
 * @access  Private
 */
router.post('/generate-link', generateReferralLink);

/**
 * @route   POST /api/referral/share
 * @desc    Share referral link
 * @access  Private
 * @note    Additional strict rate limiting to prevent spam
 */
router.post('/share', referralShareLimiter, shareReferralLink);

/**
 * @route   POST /api/referral/claim-rewards
 * @desc    Claim referral rewards
 * @access  Private
 */
router.post('/claim-rewards', claimReferralRewards);

/**
 * @route   GET /api/referral/leaderboard
 * @desc    Get referral leaderboard
 * @access  Private
 */
router.get('/leaderboard', getReferralLeaderboard);

/**
 * @route   GET /api/referral/code
 * @desc    Get user's referral code
 * @access  Private
 */
router.get('/code', getReferralCode);

/**
 * @route   GET /api/referral/stats
 * @desc    Get user's referral statistics
 * @access  Private
 */
router.get('/stats', getReferralStats);

/**
 * @route   POST /api/referral/apply-code
 * @desc    Apply referral code during registration
 * @access  Private
 */
router.post(
  '/apply-code',
  referralApplyLimiter,
  validate(
    Joi.object({
      code: Joi.string().trim().uppercase().min(4).max(20).required(),
      metadata: Joi.object().optional(),
    }),
  ),
  applyCode,
);

/**
 * @route   GET /api/referral/check-upgrade
 * @desc    Check if user qualifies for tier upgrade
 * @access  Private
 */
router.get('/check-upgrade', checkUpgrade);

/**
 * @route   GET /api/referral/my-code
 * @desc    Get user's own referral code (auto-generated if missing), referral count, and coins earned
 * @access  Private
 */
router.get('/my-code', getMyReferralCode);

/**
 * @route   POST /api/referral/apply
 * @desc    Apply a referral code — awards 100 coins to referee, 50 coins to referrer
 * @body    { referralCode: string }
 * @access  Private
 */
router.post(
  '/apply',
  referralApplyLimiter,
  validate(
    Joi.object({
      referralCode: Joi.string().trim().uppercase().min(4).max(20).required(),
    }),
  ),
  applyReferralCode,
);

export default router;
