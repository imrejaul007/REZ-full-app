/**
 * Pay Routes — bill payment, recharge (daily engagement engine)
 *
 * GET  /finance/pay/billers            → supported billers
 * POST /finance/pay/bill               → pay a bill
 * POST /finance/pay/recharge           → mobile / FASTag recharge
 * GET  /finance/pay/transactions       → user's pay transactions
 *
 * @openapi
 * @tags Payments
 * @component
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { FinanceTransaction } from '../models/FinanceTransaction';
import { rewardsHookService } from '../services/rewardsHookService';
import { logger } from '../config/logger';
import { track } from '../services/intentCaptureService';
import mongoose from 'mongoose';
import { err, ErrorCodes } from '../utils/response';
import { executeBillPayment, validateBillPaymentRequest } from '../services/billAggregatorService';
type Filter<T> = mongoose.FilterQuery<T>;

const router = Router();
router.use(authenticateUser);

// Static biller catalog (Phase 1 stub — replace with live aggregator in Phase 2)
const BILLERS = [
  { id: 'jio', name: 'Jio', type: 'mobile', logoUrl: '/logos/jio.png' },
  { id: 'airtel', name: 'Airtel', type: 'mobile', logoUrl: '/logos/airtel.png' },
  { id: 'bsnl', name: 'BSNL', type: 'mobile', logoUrl: '/logos/bsnl.png' },
  { id: 'fastag', name: 'FASTag', type: 'fastag', logoUrl: '/logos/fastag.png' },
  { id: 'bescom', name: 'BESCOM (Electricity)', type: 'electricity', logoUrl: '/logos/bescom.png' },
  { id: 'bwssb', name: 'BWSSB (Water)', type: 'water', logoUrl: '/logos/bwssb.png' },
];

/**
 * @route GET /api/finance/pay/billers
 * @summary Get supported billers for bill payment
 * @tags Payments
 * @description Returns list of supported billers (mobile, electricity, water, FASTag)
 * @response {object} 200 - List of supported billers
 */
router.get('/billers', (_req, res) => {
  res.json({ success: true, billers: BILLERS });
});

/**
 * @route POST /api/finance/pay/bill
 * @summary Pay a bill (electricity, water, mobile, FASTag, etc.)
 * @tags Payments
 * @param {object} body.required - Bill payment request
 * @param {string} body.billerId.required - Biller identifier (e.g., 'jio', 'bescom', 'fastag')
 * @param {string} body.accountNumber.required - Consumer account / mobile number / vehicle number
 * @param {number} body.amount.required - Payment amount (INR 10 - 100,000)
 * @response {object} 201 - Bill payment completed successfully
 * @response {object} 202 - Bill payment initiated (pending aggregator confirmation)
 * @response {object} 400 - Invalid request
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 *
 * @description
 * Processes bill payments via configured aggregator (BBPS/Eko/PaySprint/stub).
 * Returns 202 Accepted for pending transactions. Poll /transactions or use
 * webhook notifications to get final status.
 */
const BillPaySchema = z.object({
  billerId: z.string().min(1, 'billerId is required'),
  accountNumber: z.string().min(1, 'accountNumber is required'),
  amount: z.number().positive('amount must be positive').min(10, 'minimum amount is INR 10').max(100000, 'maximum amount is INR 100,000'),
});

router.post('/bill', async (req: AuthenticatedRequest, res) => {
  const parsed = BillPaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  // Additional validation via bill aggregator service
  const validationError = validateBillPaymentRequest({
    userId: req.userId,
    billerId: parsed.data.billerId,
    accountNumber: parsed.data.accountNumber,
    amount: parsed.data.amount,
  });
  if (validationError) {
    res.status(400).json({ success: false, error: validationError });
    return;
  }

  try {
    // Execute bill payment via aggregator service (BBPS/Eko/PaySprint/stub)
    const result = await executeBillPayment({
      userId: req.userId!,
      billerId: parsed.data.billerId,
      accountNumber: parsed.data.accountNumber,
      amount: parsed.data.amount,
    });

    // Create transaction record with appropriate status
    // When aggregator returns 'pending', the transaction will be in pending state
    // until the aggregator webhook updates it to 'completed' or 'failed'
    const transaction = new FinanceTransaction({
      userId: req.userId!,
      type: 'bill_payment',
      status: result.status,
      amount: parsed.data.amount,
      currency: 'INR',
      billerId: parsed.data.billerId,
      accountNumber: parsed.data.accountNumber,
      partnerId: process.env.BILL_AGGREGATOR_TYPE || 'stub',
      partnerTxId: result.aggregatorTxId,
      coinsAwarded: 0,
      metadata: {
        aggregatorTxId: result.aggregatorTxId,
        referenceNumber: result.referenceNumber,
        aggregatorError: result.error,
      },
    });

    await transaction.save();

    // Track intent for analytics
    track({
      userId: req.userId!,
      event: 'bill_payment_initiated',
      intentKey: 'GENERAL:rez-finance',
      properties: {
        billerId: parsed.data.billerId,
        accountNumber: parsed.data.accountNumber,
        amount: parsed.data.amount,
        transactionId: transaction._id.toString(),
        status: result.status,
        aggregatorTxId: result.aggregatorTxId,
      },
    }).catch(() => {});

    logger.info('[Pay] Bill payment initiated', {
      userId: req.userId,
      transactionId: transaction._id.toString(),
      billerId: parsed.data.billerId,
      amount: parsed.data.amount,
      status: result.status,
      aggregatorTxId: result.aggregatorTxId,
    });

    // Return 202 Accepted for pending transactions
    // Client should poll /transactions or we can implement websocket for real-time updates
    res.status(result.status === 'pending' ? 202 : result.status === 'completed' ? 201 : 400).json({
      success: result.success,
      status: result.status,
      transactionId: transaction._id.toString(),
      aggregatorTxId: result.aggregatorTxId,
      referenceNumber: result.referenceNumber,
      message: result.status === 'pending'
        ? 'Bill payment initiated. Check transaction status for updates.'
        : result.error || 'Bill payment processed',
    });
  } catch (error) {
    logger.error('[Pay] POST /bill error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/pay/recharge
 * @summary Mobile or FASTag recharge
 * @tags Payments
 * @param {object} body.required - Recharge request
 * @param {string} body.operator.required - Mobile operator or FASTag provider
 * @param {string} body.accountNumber.required - Mobile number or vehicle number
 * @param {number} body.amount.required - Recharge amount
 * @response {object} 201 - Recharge initiated
 * @response {object} 400 - Invalid request
 * @response {object} 401 - Unauthorized
 * @response {object} 501 - Feature not available (pending aggregator integration)
 * @response {object} 500 - Server error
 */
const RechargeSchema = z.object({
  operator: z.string(),
  accountNumber: z.string().min(5),
  amount: z.number().positive(),
});

router.post('/recharge', async (req: AuthenticatedRequest, res) => {
  const parsed = RechargeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }

  try {
    // BL-C3 / BL-C4 fix: rechargeAggregatorService.executeRecharge() throws when configured
    // and returns { success: false } when unconfigured — no code path completes a real recharge.
    // Return 503 with a clear message instead of a misleading 201 that creates a PENDING
    // transaction but never executes the recharge. Users' mobile balances are not topped up.
    logger.warn('STUB: pay/recharge — returning 501 NOT_IMPLEMENTED until real aggregator integration is complete', {
      userId: req.userId,
      operator: parsed.data.operator,
      amount: parsed.data.amount,
    });
    res.status(501).json({
      success: false,
      error: 'FEATURE_NOT_AVAILABLE',
      message: 'Mobile recharge feature is coming soon. Please use your carrier app or a recharge portal.',
    });
  } catch (error) {
    logger.error('[Pay] POST /recharge error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route GET /api/finance/pay/transactions
 * @summary Get user's payment transactions (bill payments, recharges)
 * @tags Payments
 * @param {string} before.query - Cursor for pagination (ISO timestamp)
 * @param {number} limit.query - Number of results (max 100, default 30)
 * @response {object} 200 - Paginated transactions list with nextCursor
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
// BL-L2 FIX: cursor-based pagination — ?before=<ISO timestamp>&limit=<n> (max 100).
// The previous hardcoded .limit(30) meant users with more than 30 transactions
// could not access their full history.
router.get('/transactions', async (req: AuthenticatedRequest, res) => {
  try {
    const MAX_PAGE_SIZE = 100;
    const rawLimit = parseInt(String(req.query.limit ?? '30'), 10);
    const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 30 : rawLimit, MAX_PAGE_SIZE);

    const filter: Filter<typeof FinanceTransaction> = {
      userId: req.userId!,
      type: { $in: ['bill_payment', 'recharge'] },
    };

    // Cursor: only return documents created before this timestamp
    if (req.query.before) {
      const cursor = new Date(String(req.query.before));
      if (!isNaN(cursor.getTime())) {
        filter.createdAt = { $lt: cursor };
      }
    }

    const txs = await FinanceTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Return the oldest document's createdAt as the next cursor so the client
    // can pass ?before=<nextCursor> to fetch the next page.
    const nextCursor = txs.length === limit ? txs[txs.length - 1].createdAt : null;

    res.json({ success: true, transactions: txs, nextCursor, limit });
  } catch (error) {
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/pay/repay
 * @summary Process loan repayment (EMI)
 * @tags Payments
 * @param {object} body.required - Repayment request
 * @param {string} body.loanId.required - Loan ID
 * @param {number} body.amount.required - Repayment amount
 * @param {number} body.emiNumber.required - EMI number being paid
 * @response {object} 200 - Repayment successful
 * @response {object} 400 - Invalid request
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
const RepaySchema = z.object({
  loanId: z.string(),
  amount: z.number().positive(),
  emiNumber: z.number().int().positive(),
});

router.post('/repay', async (req: AuthenticatedRequest, res) => {
  const parsed = RepaySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }

  try {
    // Simulate repayment processing (actual implementation would integrate with payment gateway)
    const repayment = {
      loanId: parsed.data.loanId,
      amount: parsed.data.amount,
      emiNumber: parsed.data.emiNumber,
      paidAt: new Date().toISOString()
    };

    // Track loan repayment event
    track({
      userId: req.userId!,
      event: 'loan_repaid',
      intentKey: 'GENERAL:rez-finance',
      properties: {
        loanId: repayment.loanId,
        amount: repayment.amount,
        emiNumber: repayment.emiNumber,
        paidAt: repayment.paidAt
      }
    }).catch(() => {});

    res.json({ success: true, repayment });
  } catch (error) {
    logger.error('[Pay] POST /repay error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

/**
 * @route POST /api/finance/pay/overdue-check
 * @summary Check loan overdue status
 * @tags Payments
 * @param {object} body.required - Overdue check request
 * @param {string} body.loanId.required - Loan ID to check
 * @response {object} 200 - Overdue status
 * @response {object} 400 - Invalid request
 * @response {object} 401 - Unauthorized
 * @response {object} 500 - Server error
 */
const OverdueCheckSchema = z.object({
  loanId: z.string(),
});

router.post('/overdue-check', async (req: AuthenticatedRequest, res) => {
  const parsed = OverdueCheckSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }

  try {
    // Simulate overdue check (actual implementation would query loan service)
    const overdue = {
      loanId: parsed.data.loanId,
      daysOverdue: 0,
      amount: 0
    };

    // Track payment overdue event if loan is overdue
    if (overdue.daysOverdue > 0) {
      track({
        userId: req.userId!,
        event: 'payment_overdue',
        intentKey: 'GENERAL:rez-finance',
        properties: {
          loanId: overdue.loanId,
          daysOverdue: overdue.daysOverdue,
          overdueAmount: overdue.amount
        }
      }).catch(() => {});
    }

    res.json({ success: true, overdue });
  } catch (error) {
    logger.error('[Pay] POST /overdue-check error', { error: (error as Error).message });
    res.status(500).json(err('SRV_INTERNAL_ERROR', { details: (error as Error).message }));
  }
});

export default router;
