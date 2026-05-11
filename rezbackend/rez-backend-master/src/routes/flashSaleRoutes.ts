// @ts-nocheck
import express from 'express';
import Joi from 'joi';
import flashSaleController from '../controllers/flashSaleController';
import { authenticate as authMiddleware, requireSeniorAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/merchantvalidation';
import { flashSalePurchaseInitiateLimiter, flashSalePurchaseVerifyLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Validation schemas for flash sale purchase routes
const purchaseInitiateSchema = Joi.object({
  flashSaleId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(10).required(),
  paymentMethod: Joi.string().valid('wallet', 'upi', 'card', 'razorpay').required(),
});

const purchaseVerifySchema = Joi.object({
  purchaseId: Joi.string().hex().length(24).required(),
  paymentId: Joi.string().required(),
  orderId: Joi.string().optional(),
  signature: Joi.string().optional(),
});

const purchaseFailSchema = Joi.object({
  purchaseId: Joi.string().hex().length(24).required(),
  reason: Joi.string().max(500).optional(),
});

const validatePurchaseSchema = Joi.object({
  flashSaleId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).max(10).required(),
});

const promoCodeSchema = Joi.object({
  code: Joi.string().trim().min(1).max(50).required(),
  cartTotal: Joi.number().min(0).optional(),
});

// Public routes (no auth required)

/**
 * @route   GET /api/flash-sales/active
 * @desc    Get all active flash sales
 * @access  Public
 */
router.get('/active', flashSaleController.getActiveFlashSales);

/**
 * @route   GET /api/flash-sales/upcoming
 * @desc    Get upcoming flash sales
 * @access  Public
 */
router.get('/upcoming', flashSaleController.getUpcomingFlashSales);

/**
 * @route   GET /api/flash-sales/expiring-soon
 * @desc    Get flash sales expiring soon (within specified minutes)
 * @query   minutes - Number of minutes (default: 5)
 * @access  Public
 */
router.get('/expiring-soon', flashSaleController.getExpiringSoonFlashSales);

/**
 * @route   GET /api/flash-sales/:id
 * @desc    Get flash sale by ID
 * @access  Public
 */
router.get('/:id', flashSaleController.getFlashSaleById);

/**
 * @route   GET /api/flash-sales/product/:productId
 * @desc    Get flash sales for a specific product
 * @access  Public
 */
router.get('/product/:productId', flashSaleController.getFlashSalesByProduct);

/**
 * @route   GET /api/flash-sales/category/:categoryId
 * @desc    Get flash sales for a specific category
 * @access  Public
 */
router.get('/category/:categoryId', flashSaleController.getFlashSalesByCategory);

/**
 * @route   POST /api/flash-sales/:id/track-click
 * @desc    Track click on flash sale
 * @access  Public
 */
router.post('/:id/track-click', flashSaleController.trackClick);

// Protected routes (require authentication)

/**
 * @route   POST /api/flash-sales/validate-purchase
 * @desc    Validate flash sale purchase
 * @access  Private
 */
router.post(
  '/validate-purchase',
  authMiddleware,
  validateRequest(validatePurchaseSchema),
  flashSaleController.validateFlashSalePurchase,
);

/**
 * @route   POST /api/flash-sales/best-offer
 * @desc    Find best offer for cart (auto-apply)
 * @access  Private
 */
router.post('/best-offer', authMiddleware, flashSaleController.findBestOffer);

/**
 * @route   POST /api/flash-sales/apply-offer
 * @desc    Apply specific offer to cart
 * @access  Private
 */
router.post('/apply-offer', authMiddleware, flashSaleController.applyOffer);

/**
 * @route   POST /api/flash-sales/validate-promo
 * @desc    Validate promo code
 * @access  Private
 */
router.post('/validate-promo', authMiddleware, validateRequest(promoCodeSchema), flashSaleController.validatePromoCode);

// ============================================
// FLASH SALE PURCHASE ROUTES
// ============================================

/**
 * @route   POST /api/flash-sales/purchase/initiate
 * @desc    Initiate flash sale purchase - creates Stripe checkout session
 * @access  Private
 */
router.post(
  '/purchase/initiate',
  authMiddleware,
  flashSalePurchaseInitiateLimiter,
  validateRequest(purchaseInitiateSchema),
  flashSaleController.initiateFlashSalePurchase,
);

/**
 * @route   POST /api/flash-sales/purchase/verify
 * @desc    Verify flash sale payment - completes the purchase
 * @access  Private
 */
router.post(
  '/purchase/verify',
  authMiddleware,
  flashSalePurchaseVerifyLimiter,
  validateRequest(purchaseVerifySchema),
  flashSaleController.verifyFlashSalePayment,
);

/**
 * @route   POST /api/flash-sales/purchase/fail
 * @desc    Mark flash sale purchase as failed
 * @access  Private
 */
router.post(
  '/purchase/fail',
  authMiddleware,
  validateRequest(purchaseFailSchema),
  flashSaleController.failFlashSalePurchase,
);

/**
 * @route   GET /api/flash-sales/purchases
 * @desc    Get user's flash sale purchases
 * @access  Private
 */
router.get('/purchases', authMiddleware, flashSaleController.getUserFlashSalePurchases);

/**
 * @route   GET /api/flash-sales/purchases/:purchaseId
 * @desc    Get flash sale purchase by ID
 * @access  Private
 */
router.get('/purchases/:purchaseId', authMiddleware, flashSaleController.getFlashSalePurchaseById);

// Admin routes — require senior admin (admin or super_admin role).
// SECURITY FIX: These routes previously used only authMiddleware (any authenticated
// user), meaning any consumer-app user could create, update, or delete flash sales.
// requireSeniorAdmin enforces role >= 'admin' signed with JWT_ADMIN_SECRET.

/**
 * @route   POST /api/flash-sales
 * @desc    Create new flash sale
 * @access  Admin only
 */
router.post('/', authMiddleware, requireSeniorAdmin, flashSaleController.createFlashSale);

/**
 * @route   PUT /api/flash-sales/:id
 * @desc    Update flash sale
 * @access  Admin only
 */
router.put('/:id', authMiddleware, requireSeniorAdmin, flashSaleController.updateFlashSale);

/**
 * @route   DELETE /api/flash-sales/:id
 * @desc    Delete flash sale
 * @access  Admin only
 */
router.delete('/:id', authMiddleware, requireSeniorAdmin, flashSaleController.deleteFlashSale);

/**
 * @route   GET /api/flash-sales/:id/stats
 * @desc    Get flash sale statistics
 * @access  Admin only
 */
router.get('/:id/stats', authMiddleware, requireSeniorAdmin, flashSaleController.getFlashSaleStats);

export default router;
