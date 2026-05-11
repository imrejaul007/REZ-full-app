// @ts-nocheck
import { Router, Request, Response } from 'express';
import {
  getCashbackSummary,
  getCashbackHistory,
  getPendingCashback,
  getExpiringSoon,
  redeemCashback,
  getCashbackCampaigns,
  forecastCashback,
  getCashbackStatistics,
} from '../controllers/cashbackController';
import {
  getDoubleCashbackCampaigns,
  getCoinDrops,
  getUploadBillStores,
  getSuperCashbackStores,
} from '../controllers/offersPageController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validateQuery, validate } from '../middleware/validation';
import { Joi } from '../middleware/validation';
import { createRateLimiter, cashbackLimiter } from '../middleware/rateLimiter';
import { UserCashback } from '../models/UserCashback';
import mongoose from 'mongoose';

const router = Router();

// Rate limiter for cashback redemption — 10 per user per hour
const cashbackRedeemLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  prefix: 'cashback-redeem',
  message: 'Too many cashback redemption attempts. Please try again later.',
});

// Get cashback summary
router.get('/summary', authenticate, getCashbackSummary);

// Get cashback history
router.get(
  '/history',
  authenticate,
  validateQuery(
    Joi.object({
      status: Joi.string().valid('pending', 'credited', 'expired', 'cancelled'),
      source: Joi.string().valid('order', 'referral', 'promotion', 'special_offer', 'bonus', 'signup'),
      dateFrom: Joi.date().iso(),
      dateTo: Joi.date().iso(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  ),
  getCashbackHistory,
);

// Get pending cashback (ready for redemption)
router.get('/pending', authenticate, getPendingCashback);

// Get expiring soon cashback
router.get(
  '/expiring-soon',
  authenticate,
  validateQuery(
    Joi.object({
      days: Joi.number().integer().min(1).max(30).default(7),
    }),
  ),
  getExpiringSoon,
);

// Redeem pending cashback
router.post('/redeem', authenticate, cashbackRedeemLimiter, redeemCashback);

// Get active cashback campaigns
router.get('/campaigns', optionalAuth, getCashbackCampaigns);

// Forecast cashback for cart
router.post(
  '/forecast',
  optionalAuth,
  cashbackLimiter, // Sprint 3: 30 per user/IP per minute
  validate(
    Joi.object({
      cartData: Joi.object({
        items: Joi.array()
          .items(
            Joi.object({
              product: Joi.object().required(),
              quantity: Joi.number().integer().min(1).required(),
              price: Joi.number().min(0).required(),
            }),
          )
          .min(1)
          .required(),
        subtotal: Joi.number().min(0).required(),
      }).required(),
    }),
  ),
  forecastCashback,
);

// Get cashback statistics
router.get(
  '/statistics',
  authenticate,
  validateQuery(
    Joi.object({
      period: Joi.string().valid('day', 'week', 'month', 'year').default('month'),
    }),
  ),
  getCashbackStatistics,
);

// Get pending cashback timeline sorted by creditableAt ascending
router.get('/pending-timeline', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || (req as any).user?._id || (req as any).user?.id;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const items = await UserCashback.find(
      { user: new mongoose.Types.ObjectId(userId), status: 'pending' },
      { _id: 1, amount: 1, creditableAt: 1, source: 1, description: 1 },
    )
      .sort({ creditableAt: 1 })
      .lean();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// =====================
// NEW OFFERS PAGE ROUTES
// =====================

// Get double cashback campaigns
router.get(
  '/double-campaigns',
  optionalAuth,
  validateQuery(
    Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  ),
  getDoubleCashbackCampaigns,
);

// Get coin drops (boosted cashback events)
router.get(
  '/coin-drops',
  optionalAuth,
  validateQuery(
    Joi.object({
      category: Joi.string(),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  ),
  getCoinDrops,
);

// Get upload bill stores
router.get(
  '/upload-bill-stores',
  optionalAuth,
  validateQuery(
    Joi.object({
      category: Joi.string(),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  ),
  getUploadBillStores,
);

// Get super cashback stores (stores with 10%+ cashback)
router.get(
  '/super-cashback-stores',
  optionalAuth,
  validateQuery(
    Joi.object({
      minCashback: Joi.number().integer().min(1).max(100).default(10),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  ),
  getSuperCashbackStores,
);

export default router;
