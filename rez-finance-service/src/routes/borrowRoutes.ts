/**
 * Borrow Routes — loans, credit cards, BNPL
 *
 * GET  /finance/borrow/offers           → active pre-approved offers
 * POST /finance/borrow/apply            → apply for loan / card
 * GET  /finance/borrow/applications     → user's applications
 * GET  /finance/borrow/applications/:id → single application
 * POST /finance/borrow/bnpl/check       → check BNPL eligibility (contextual checkout)
 * POST /finance/borrow/bnpl/create      → create BNPL order
 *
 * @openapi
 * @tags Borrow
 * @component
 */

import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { partnerService } from '../services/partnerService';
import { loanService } from '../services/loanService';
import { bnplService } from '../services/bnplService';
import { logger } from '../config/logger';
import { redis } from '../config/redis';
import { track } from '../services/intentCaptureService';
import { err, ErrorCodes } from '../utils/response';

// BE-FIN-011: Rate limiter for BNPL order creation (max 5 per hour per user)
// CRIT-06 FIX: Use atomic incr with TTL to prevent permanent blocking if expire() fails
async function checkBnplRateLimit(userId: string): Promise<boolean> {
  const key = `rate_limit:bnpl:${userId}`;
  const ttl = 60 * 60; // 1 hour in seconds
  const maxAttempts = 5;

  // Use Lua script for atomic incr + TTL in single operation
  // Ensures the key always expires, preventing permanent rate limit lock
  const script = `
    local key = KEYS[1]
    local ttl = tonumber(ARGV[1])
    local current = redis.call('incr', key)
    if current == 1 then
      redis.call('expire', key, ttl)
    end
    return current
  `;

  // Call Redis EVAL using the ioredis command method (type-safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const current = await (redis as any).eval(script, 1, key, ttl) as number;
  return current <= maxAttempts;
}

const router = Router();
router.use(authenticateUser);

/**
 * @route GET /api/finance/borrow/offers
 * @summary Get active pre-approved loan/credit offers
 * @tags Borrow
 * @response {object} 200 - Active offers response
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
router.get('/offers', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    // Refresh in background if needed (fire and forget with logging)
    partnerService.refreshOffersForUser(userId).catch((err: Error) => {
      logger.warn('[Borrow] background offer refresh failed', { error: err.message });
    });
    const offers = await partnerService.getActiveOffers(userId);
    res.json({ success: true, offers });
  } catch (error) {
    logger.error('[Borrow] GET /offers error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/borrow/apply
 * @summary Apply for a loan or credit card
 * @tags Borrow
 * @param {object} body.required - Application details
 * @param {string} body.partnerOfferId.required - Partner offer ID
 * @param {number} body.amount.required - Loan amount (max 10,000,000)
 * @param {number} body.tenure.required - Loan tenure in months
 * @param {object} body.context - Application context (screen, orderId, bookingId)
 * @response {object} 201 - Application created
 * @response {object} 400 - Invalid request or eligibility error
 * @response {object} 401 - Unauthorized
 * @response {object} 403 - Account inactive or frozen
 * @response {object} 500 - Server error
 */
const ApplySchema = z.object({
  partnerOfferId: z.string(),
  amount: z.number().positive().max(10000000),
  tenure: z.number().int().positive(),
  context: z.object({
    screen: z.string(),
    orderId: z.string().optional(),
    bookingId: z.string().optional(),
  }).optional(),
});

router.post('/apply', async (req: AuthenticatedRequest, res) => {
  const parsed = ApplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  try {
    // BE-FIN-025: Validate basic eligibility upfront before submission
    const { CreditProfile } = await import('../models/CreditProfile');
    const profile = await CreditProfile.findOne({ userId: req.userId });
    if (!profile) {
      res.status(400).json({ success: false, error: 'No credit profile found. Please complete KYC first.' });
      return;
    }
    if (!profile.isActive) {
      res.status(403).json({ success: false, error: 'Your account is inactive. Contact support.' });
      return;
    }
    if (profile.isFrozen) {
      res.status(403).json({ success: false, error: 'Your account is frozen due to compliance. Contact support.' });
      return;
    }

    const result = await loanService.applyForLoan({ userId: req.userId!, ...parsed.data });
    res.status(201).json({ success: true, application: result.application, redirectUrl: result.redirectUrl });
  } catch (err) {
    const message = (err as Error).message;
    logger.error('[Borrow] POST /apply error', { error: message });
    // FIX: Return 400 only for known client errors, 500 for unexpected failures
    const isClientError = ['Offer not found', 'Offer does not belong', 'Offer has expired',
      'No credit profile found', 'inactive', 'frozen'].some(s => message.includes(s));
    res.status(isClientError ? 400 : 500).json({ success: false, error: message });
  }
});

/**
 * @route GET /api/finance/borrow/applications
 * @summary Get user's loan/credit applications
 * @tags Borrow
 * @response {object} 200 - Applications list
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
router.get('/applications', async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const applications = await loanService.getUserApplications(req.userId);
    res.json({ success: true, applications });
  } catch (error) {
    logger.error('[Borrow] GET /applications error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route GET /api/finance/borrow/applications/:id
 * @summary Get single application by ID
 * @tags Borrow
 * @param {string} id.path.required - Application ID
 * @response {object} 200 - Application details
 * @response {object} 401 - Unauthorized
 * @response {object} 404 - Application not found
 * @response {object} 500 - Server error
 */
router.get('/applications/:id', async (req: AuthenticatedRequest, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, error: 'Not found' });
    return;
  }
  try {
    const application = await loanService.getApplication(req.params.id, req.userId!);
    if (!application) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, application });
  } catch (error) {
    logger.error('[Borrow] GET /applications/:id error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/borrow/bnpl/check
 * @summary Check BNPL eligibility for checkout
 * @tags Borrow
 * @param {object} body.required - BNPL check request
 * @param {number} body.amount.required - Order amount
 * @param {string} body.orderId.required - Order ID
 * @response {object} 200 - Eligibility check result
 * @response {object} 400 - Invalid request
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
const BnplCheckSchema = z.object({ amount: z.number().positive(), orderId: z.string() });

router.post('/bnpl/check', async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const parsed = BnplCheckSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }
  try {
    const result = await bnplService.checkEligibility(req.userId, parsed.data.amount);
    track({ userId: req.userId, event: 'bnpl_eligibility_checked', intentKey: 'GENERAL:rez-finance', properties: { amount: parsed.data.amount, eligible: result.eligible } }).catch(() => {});
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('[Borrow] POST /bnpl/check error', { error: (error as Error).message, userId: req.userId });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/borrow/bnpl/create
 * @summary Create a Buy Now Pay Later order
 * @tags Borrow
 * @param {object} body.required - BNPL order request
 * @param {number} body.amount.required - Order amount (max 500,000)
 * @param {string} body.orderId.required - Order ID
 * @param {string} body.merchantId - Merchant ID
 * @param {string} body.partnerId - Partner ID
 * @response {object} 201 - BNPL order created
 * @response {object} 400 - Client error (not eligible, exceeds limit)
 * @response {object} 401 - Unauthorized
 * @response {object} 429 - Rate limit exceeded (max 5 per hour)
 * @response {object} 500 - Server error
 */
const BnplCreateSchema = z.object({
  // ROUTE-SEC-011 FIX: Add upper bound to prevent arbitrarily large loans.
  // Cap at 500,000 INR — aligns with Razorpay order amount limit and BNPL schema.
  amount: z.number().positive().max(500000),
  orderId: z.string(),
  merchantId: z.string().optional(),
  partnerId: z.string().optional(),
});

router.post('/bnpl/create', async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const parsed = BnplCreateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }

  // BE-FIN-011: Check rate limit before processing
  const allowed = await checkBnplRateLimit(req.userId);
  if (!allowed) {
    logger.warn('[Borrow] BNPL rate limit exceeded', { userId: req.userId });
    res.status(429).json({ success: false, error: 'Too many BNPL orders. Maximum 5 per hour.' });
    return;
  }

  try {
    const tx = await bnplService.createBnplOrder({ userId: req.userId, ...parsed.data });
    if (!tx) {
      res.status(500).json({ success: false, error: 'Failed to create BNPL order' });
      return;
    }
    track({ userId: req.userId, event: 'bnpl_order_created', intentKey: 'GENERAL:rez-finance', properties: { orderId: tx.id, amount: parsed.data.amount } }).catch(() => {});
    res.status(201).json({ success: true, transaction: tx });
  } catch (err) {
    const message = (err as Error).message;
    logger.error('[Borrow] POST /bnpl/create error', { error: message });
    // FIX: Return 400 only for known client errors, 500 for unexpected failures
    const isClientError = ['Invalid user ID', 'Invalid amount', 'Invalid order ID',
      'Not eligible', 'exceeds your Pay Later', 'Insufficient repayment', 'Credit profile not found'].some(s => message.includes(s));
    res.status(isClientError ? 400 : 500).json({ success: false, error: message });
  }
});

export default router;
