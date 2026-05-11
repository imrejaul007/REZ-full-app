import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { logger } from '../config/logger';
import { BillProvider, BILL_TYPES, BillType } from '../models/BillProvider';
import { BillPayment } from '../models/BillPayment';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendNotFound, sendBadRequest } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import redisService from '../services/redisService';
import { bbpsService } from '../services/bbpsService';
import rewardEngine from '../core/rewardEngine';
import gamificationEventBus from '../events/gamificationEventBus';
import { razorpayService } from '../services/razorpayService';
import streakService from '../services/streakService';
import { assertValidTransition } from '../config/financialStateMachine';
import { pct } from '../utils/currency'; // MED-003: Decimal.js-backed percentage — no float drift

// ─── Bill Type Metadata ────────────────────────────────────────────────────

const BILL_TYPE_META: Record<BillType, { label: string; icon: string; color: string; category: string }> = {
  electricity: { label: 'Electricity', icon: 'flash-outline', color: '#F59E0B', category: 'electricity' },
  water: { label: 'Water', icon: 'water-outline', color: '#3B82F6', category: 'water' },
  gas: { label: 'Gas', icon: 'flame-outline', color: '#EF4444', category: 'gas' },
  internet: { label: 'Internet', icon: 'wifi-outline', color: '#8B5CF6', category: 'broadband' },
  mobile_postpaid: { label: 'Postpaid', icon: 'phone-portrait-outline', color: '#D97706', category: 'telecom' },
  mobile_prepaid: { label: 'Recharge', icon: 'phone-portrait-outline', color: '#10B981', category: 'telecom' },
  broadband: { label: 'Broadband', icon: 'tv-outline', color: '#EC4899', category: 'broadband' },
  dth: { label: 'DTH', icon: 'radio-outline', color: '#06B6D4', category: 'dth' },
  landline: { label: 'Landline', icon: 'call-outline', color: '#6366F1', category: 'telecom' },
  insurance: { label: 'Insurance', icon: 'shield-checkmark-outline', color: '#6B7280', category: 'insurance' },
  fastag: { label: 'FASTag', icon: 'car-outline', color: '#F97316', category: 'fastag' },
  education_fee: { label: 'School Fees', icon: 'school-outline', color: '#8B5CF6', category: 'education' },
};

// ─── GET /api/bill-payments/types ─────────────────────────────────────────

export const getBillTypes = asyncHandler(async (req: Request, res: Response) => {
  const region = ((req.headers['x-rez-region'] as string) || '').toLowerCase();
  const cacheKey = `bill-payments:types:${region || 'all'}`;
  const cached = await redisService.get<any>(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const matchFilter: any = { isActive: true };
  if (region) matchFilter.$or = [{ region }, { region: '' }, { region: { $exists: false } }];

  const counts = await BillProvider.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = {};
  for (const c of counts) countMap[c._id] = c.count;

  const types = BILL_TYPES.map((type) => ({
    id: type,
    ...BILL_TYPE_META[type],
    providerCount: countMap[type] || 0,
  }));

  await redisService.set(cacheKey, types, 300).catch(() => {});
  sendSuccess(res, types);
});

// ─── GET /api/bill-payments/providers ─────────────────────────────────────

export const getProviders = asyncHandler(async (req: Request, res: Response) => {
  const { type, page = '1', limit = '10' } = req.query;
  if (!type || !BILL_TYPES.includes(type as BillType)) throw new AppError('Valid bill type required', 400);

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
  const region = ((req.headers['x-rez-region'] as string) || '').toLowerCase();

  const cacheKey = `bill-payments:providers:${region || 'all'}:${type}:${pageNum}:${limitNum}`;
  const cached = await redisService.get<any>(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const query: any = { type: type as BillType, isActive: true };
  if (region) query.$or = [{ region }, { region: '' }, { region: { $exists: false } }];

  const [providers, total] = await Promise.all([
    BillProvider.find(query)
      .sort({ displayOrder: 1, name: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    BillProvider.countDocuments(query),
  ]);

  const data = {
    providers,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    },
  };

  await redisService.set(cacheKey, data, 300).catch(() => {});
  sendSuccess(res, data);
});

// ─── POST /api/bill-payments/fetch-bill ───────────────────────────────────

export const fetchBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { providerId, customerNumber } = req.body;
  if (!providerId || !customerNumber) throw new AppError('providerId and customerNumber required', 400);

  const provider = await BillProvider.findOne({ _id: providerId, isActive: true }).lean();
  if (!provider) return sendNotFound(res, 'Provider not found');

  // Prepaid — no bill to fetch, user selects plan
  if (provider.type === 'mobile_prepaid') {
    return sendSuccess(
      res,
      {
        provider: {
          _id: provider._id,
          name: provider.name,
          code: provider.code,
          logo: provider.logo,
          type: provider.type,
        },
        customerNumber,
        billType: 'mobile_prepaid',
        requiresPlanSelection: true,
        promoCoins: provider.promoCoinsFixed,
        promoExpiryDays: provider.promoExpiryDays,
      },
      'Select a recharge plan',
    );
  }

  // All other types — call real BBPS API
  const billInfo = await bbpsService.fetchBill(provider.aggregatorCode || provider.code, customerNumber);

  sendSuccess(
    res,
    {
      provider: {
        _id: provider._id,
        name: provider.name,
        code: provider.code,
        logo: provider.logo,
        type: provider.type,
      },
      customerNumber,
      amount: billInfo.billAmount,
      dueDate: billInfo.dueDate,
      billDate: billInfo.billDate,
      consumerName: billInfo.consumerName,
      billNumber: billInfo.billNumber,
      cashbackPercent: provider.cashbackPercent,
      cashbackAmount: Math.floor(pct(billInfo.billAmount, provider.cashbackPercent)), // MED-003
      promoCoins: provider.promoCoinsFixed,
      promoExpiryDays: provider.promoExpiryDays,
      additionalInfo: billInfo.additionalInfo,
    },
    'Bill fetched',
  );
});

// ─── GET /api/bill-payments/plans ─────────────────────────────────────────

export const getPlans = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { providerId, circle = 'KA' } = req.query;
  if (!providerId) throw new AppError('providerId required', 400);

  const provider = await BillProvider.findOne({ _id: providerId, isActive: true }).lean();
  if (!provider) return sendNotFound(res, 'Provider not found');

  const cacheKey = `bbps:plans:${provider.aggregatorCode}:${circle}`;
  const cached = await redisService.get<any>(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const plans = await bbpsService.getPlans(provider.aggregatorCode || provider.code, circle as string);

  const grouped = {
    popular: plans.filter((p) => p.isPopular),
    allPlans: plans,
    promoCoins: provider.promoCoinsFixed,
    expiryDays: provider.promoExpiryDays,
  };

  await redisService.set(cacheKey, grouped, 3600).catch(() => {});
  sendSuccess(res, grouped, 'Plans fetched');
});

// ─── POST /api/bill-payments/pay ──────────────────────────────────────────

export const payBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { providerId, customerNumber, amount, razorpayPaymentId, planId } = req.body;
  if (!providerId || !customerNumber || !amount || !razorpayPaymentId) {
    throw new AppError('providerId, customerNumber, amount, razorpayPaymentId required', 400);
  }
  if (amount <= 0) throw new AppError('Amount must be > 0', 400);

  const provider = await BillProvider.findOne({ _id: providerId, isActive: true }).lean();
  if (!provider) return sendNotFound(res, 'Provider not found');

  // 1. Verify Razorpay payment — fetch details and confirm captured + amount matches
  const paymentDetails = await razorpayService.fetchPaymentDetails(razorpayPaymentId);
  const paidAmount = Number((paymentDetails as any).amount) / 100; // Razorpay returns paise
  const isCapture = (paymentDetails as any).status === 'captured';
  if (!isCapture || Math.abs(paidAmount - amount) > 0.01) {
    throw new AppError('Payment verification failed — invalid status or amount mismatch', 400);
  }

  const transactionRef = `BP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  // MED-003 FIX: Use pct() from currency.ts (Decimal.js) instead of raw float math.
  // Math.round(amount * percent / 100) can drift on fractional percentages — e.g.,
  // amount=199.99, percent=5.5 → float gives 10.999450... → rounds incorrectly.
  const cashbackAmount = Math.floor(pct(amount, provider.cashbackPercent));
  const promoCoins = provider.promoCoinsFixed || 0;
  const promoExpiryDays = provider.promoExpiryDays || 7;
  const maxRedemptionPct = provider.maxRedemptionPercent || 15;

  // IDEMPOTENCY CHECK (atomic): Use findOneAndUpdate with $setOnInsert to prevent race condition.
  // Without this, two concurrent requests with the same razorpayPaymentId could both pass a
  // findOne check and then both call BillPayment.create(), issuing double coins / double billing.
  // $setOnInsert only writes when the document does NOT exist (upsert), making this atomic.
  let payment: any;
  try {
    const upsertResult = await BillPayment.findOneAndUpdate(
      { razorpayPaymentId },
      {
        $setOnInsert: {
          userId: (req as any).user._id,
          provider: provider._id,
          billType: provider.type,
          customerNumber,
          amount,
          cashbackAmount,
          promoCoinsIssued: promoCoins,
          promoExpiryDays,
          maxRedemptionPercent: maxRedemptionPct,
          status: 'processing',
          transactionRef,
          aggregatorName: provider.aggregatorName || 'razorpay',
          razorpayPaymentId,
          walletDebited: false,
          walletDebitedAmount: 0,
        },
      },
      { upsert: true, new: false }, // new:false → returns OLD doc (null if just inserted)
    );
    if (upsertResult !== null) {
      // Document already existed — duplicate submission
      return sendBadRequest(res, 'Payment with this ID already exists. Duplicate submission prevented.');
    }
    payment = await BillPayment.findOne({ razorpayPaymentId }).lean();
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate key error from unique index — concurrent request won the race
      return sendBadRequest(res, 'Payment with this ID already exists. Duplicate submission prevented.');
    }
    throw err;
  }

  try {
    // 3. Call BBPS API
    const bbpsResult = await bbpsService.payBill({
      operatorCode: provider.aggregatorCode || provider.code,
      customerNumber,
      amount,
      razorpayPaymentId,
      internalRef: transactionRef,
      planId,
    });

    const isSuccess = bbpsResult.status === 'SUCCESS';

    // 4. Update payment record
    const newStatus = isSuccess ? 'completed' : 'processing';
    assertValidTransition('payment', payment.status, newStatus);
    await BillPayment.findByIdAndUpdate(payment._id, {
      status: newStatus,
      aggregatorRef: bbpsResult.transactionId,
      webhookVerified: false,
      paidAt: isSuccess ? new Date() : undefined,
    });

    // 5. Issue promo coins (with expiry + redemption cap in metadata)
    if (isSuccess && promoCoins > 0) {
      const paymentId = (payment._id as any).toString();
      await rewardEngine.issue({
        userId: (req as any).user._id.toString(),
        amount: promoCoins,
        rewardType: 'bill_payment',
        coinType: 'promo',
        source: `bill_payment:${paymentId}`,
        description: `${promoCoins} promo coins for ${provider.name} — expires in ${promoExpiryDays} days`,
        operationType: 'loyalty_credit',
        referenceId: paymentId,
        referenceModel: 'BillPayment',
        metadata: {
          billType: provider.type,
          providerName: provider.name,
          promoExpiryDays,
          maxRedemptionPercent: maxRedemptionPct,
        },
      });
    }

    // 6. Fire gamification event (streak + challenge + leaderboard)
    if (isSuccess) {
      gamificationEventBus.emit('bill_payment_confirmed', {
        userId: (req as any).user._id.toString(),
        amount,
        metadata: { billType: provider.type, amount, providerName: provider.name },
        source: { controller: 'billPayment', action: 'payBill' },
      });
    }

    // 6a. Record utility payments streak activity
    if (isSuccess) {
      await streakService.recordActivity((req as any).user._id.toString(), 'utility_payments').catch((err) => {
        logger.warn('[BillPayment] Streak recording failed:', err);
        // Don't throw — streak tracking is non-critical
      });
    }

    // 7. Invalidate caches
    await redisService.delPattern(`bill-payments:history:${(req as any).user._id}:*`).catch(() => {});

    const populated = await BillPayment.findById(payment._id).populate('provider', 'name code logo type').lean();

    sendSuccess(
      res,
      {
        payment: populated,
        promoCoinsEarned: isSuccess ? promoCoins : 0,
        promoExpiryDays: isSuccess ? promoExpiryDays : 0,
        status: bbpsResult.status,
        message: isSuccess
          ? `${provider.name} payment of ₹${amount} successful!${promoCoins > 0 ? ` You earned ${promoCoins} promo coins (valid ${promoExpiryDays} days).` : ''}`
          : "Payment processing. We'll notify you when confirmed.",
      },
      'Payment processed',
      201,
    );
  } catch (err) {
    assertValidTransition('payment', payment.status, 'failed');
    await BillPayment.findByIdAndUpdate(payment._id, { status: 'failed' });
    throw err;
  }
});

// ─── GET /api/bill-payments/history ───────────────────────────────────────

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { page = '1', limit = '10', billType } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

  const cacheKey = `bill-payments:history:${(req as any).user._id}:${billType || 'all'}:${pageNum}:${limitNum}`;
  const cached = await redisService.get<any>(cacheKey);
  if (cached) return sendSuccess(res, cached);

  const query: any = { userId: (req as any).user._id };
  if (billType && BILL_TYPES.includes(billType as BillType)) query.billType = billType;

  const [payments, total] = await Promise.all([
    BillPayment.find(query)
      .populate('provider', 'name code logo type')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    BillPayment.countDocuments(query),
  ]);

  const data = {
    payments,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    },
  };
  await redisService.set(cacheKey, data, 60).catch(() => {});
  sendSuccess(res, data);
});

// ─── POST /api/bill-payments/refund ───────────────────────────────────────

export const requestRefund = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { paymentId, reason } = req.body;

  // HIGH-004 FIX: Replace findOne+check+update (TOCTOU race) with a single atomic
  // findOneAndUpdate. Two concurrent refund requests for the same payment will both
  // attempt this update; only the one that finds refundStatus='none' succeeds.
  // The loser gets null back and receives a 409 without ever touching the BBPS API.
  const payment = await BillPayment.findOneAndUpdate(
    {
      _id: paymentId,
      userId: (req as any).user._id,
      status: 'completed',
      refundStatus: 'none',
      aggregatorRef: { $exists: true, $ne: null },
    },
    {
      $set: {
        refundStatus: 'pending',
        refundReason: reason || 'User requested',
        refundAmount: 0, // placeholder — will be set to actual amount below
      },
    },
    { new: false }, // return OLD doc so we have aggregatorRef + amount before update
  );

  if (!payment) {
    // Check why: does the payment exist at all?
    const exists = await BillPayment.findOne({ _id: paymentId, userId: (req as any).user._id }).lean();
    if (!exists) return sendNotFound(res, 'Payment not found');
    if (exists.status !== 'completed') throw new AppError('Only completed payments can be refunded', 400);
    if (exists.refundStatus !== 'none') throw new AppError('Refund already requested', 400);
    throw new AppError('No aggregator reference for refund', 400);
  }

  // Backfill actual refundAmount now that we own the record
  await BillPayment.findByIdAndUpdate(payment._id, { $set: { refundAmount: payment.amount } });

  const { refundId } = await bbpsService.initiateRefund(payment.aggregatorRef!, payment.amount, reason);
  await BillPayment.findByIdAndUpdate(payment._id, { refundRef: refundId });

  sendSuccess(res, { refundId, status: 'pending' }, 'Refund initiated. Will credit in 5-7 business days.');
});

// ─── POST /api/bill-payments/webhook/bbps ─────────────────────────────────

export const handleBBPSWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookBody = (req as any).rawBody ?? JSON.stringify(req.body);
  const event = req.body;

  const isValid = razorpayService.validateWebhookSignature(webhookBody, signature);
  if (!isValid) {
    logger.error('[BBPS WEBHOOK] Invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event: eventType, payload } = event;

  if (eventType === 'bbps.payment.completed') {
    const { transaction_id, reference_id, status } = payload;
    // Only update if payment is still in a non-terminal state.
    // Guards against duplicate/replayed webhooks overwriting a already-completed payment.
    const updated = await BillPayment.findOneAndUpdate(
      { transactionRef: reference_id, status: { $in: ['pending', 'processing'] } },
      {
        status: status === 'SUCCESS' ? 'completed' : 'failed',
        aggregatorRef: transaction_id,
        webhookVerified: true,
        paidAt: status === 'SUCCESS' ? new Date() : undefined,
      },
    );
    if (!updated) {
      logger.info('[BBPS WEBHOOK] Payment already in terminal state or not found for ref:', reference_id);
    }
  }

  if (eventType === 'bbps.refund.processed') {
    const { reference_id, refund_id } = payload;
    // Only update if refund is still pending — guard against duplicate webhooks
    const updated = await BillPayment.findOneAndUpdate(
      { transactionRef: reference_id, refundStatus: 'pending' },
      { refundStatus: 'processed', refundRef: refund_id, refundedAt: new Date() },
    );
    if (!updated) {
      logger.info('[BBPS WEBHOOK] Refund already processed or not found for ref:', reference_id);
    }
  }

  res.json({ received: true });
});
