/**
 * Internal Routes — called by other REZ services and integration partners
 *
 * POST /internal/finance/contextual-offer   → get contextual credit offer (called by order/booking service)
 * POST /internal/finance/score/refresh      → force score refresh (called by analytics/wallet service)
 * POST /internal/finance/bnpl/settle        → settle BNPL after order payment
 * POST /internal/finance/emi/paid           → mark EMI paid (called by payment service)
 */

import { Router, Request } from 'express';
import { z } from 'zod';
import { requireInternalToken } from '../middleware/auth';
import { getContextualCreditOffer } from '../services/creditIntelligenceService';
import { creditScoreService } from '../services/creditScoreService';
import { bnplService } from '../services/bnplService';
import { loanService } from '../services/loanService';
import { logger } from '../config/logger';

const router = Router();
router.use(requireInternalToken);

function auditLog(req: Request, action: string, meta: Record<string, unknown>) {
  logger.info('[InternalAudit]', {
    action,
    path: req.path,
    method: req.method,
    correlationId: req.headers['x-correlation-id'],
    requestId: req.headers['x-request-id'],
    callerIp: req.ip,
    ...meta,
  });
}

// POST /internal/finance/contextual-offer
// Called by: order-service, hotel-ota, resturistan during checkout
const ContextualOfferSchema = z.object({
  userId: z.string(),
  screen: z.string(),
  orderId: z.string().optional(),
  amount: z.number().optional(),
});

router.post('/contextual-offer', async (req, res) => {
  const parsed = ContextualOfferSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }

  try {
    const offer = await getContextualCreditOffer(parsed.data.userId, {
      screen: parsed.data.screen,
      orderId: parsed.data.orderId,
      amount: parsed.data.amount,
    });
    res.json({ success: true, offer });
  } catch (err) {
    logger.error('[Internal] contextual-offer error', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// POST /internal/finance/score/refresh  [mutating]
router.post('/score/refresh', async (req, res) => {
  const userId = typeof req.body?.userId === 'string' ? req.body.userId : undefined;
  if (!userId) { res.status(400).json({ success: false, error: 'userId required' }); return; }
  try {
    auditLog(req, 'score.refresh', { userId });
    const profile = await creditScoreService.refreshScore(userId);
    res.json({ success: true, rezScore: profile.rezScore });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Score refresh failed' });
  }
});

// POST /internal/finance/bnpl/settle  [high-risk mutation — credits wallet]
const BnplSettleSchema = z.object({ txId: z.string() });

router.post('/bnpl/settle', async (req, res) => {
  const parsed = BnplSettleSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }
  try {
    auditLog(req, 'bnpl.settle', { txId: parsed.data.txId });
    const tx = await bnplService.settleBnplOrder(parsed.data.txId);
    res.json({ success: true, transaction: tx });
  } catch (err) {
    logger.error('[Internal] bnpl/settle error', { error: (err as Error).message });
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// GET /internal/finance/merchants/:merchantId/revenue
// Returns merchant revenue stats for health score calculation
router.get('/merchants/:merchantId/revenue', requireInternalToken, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;

    if (!merchantId || merchantId.length !== 24) {
      res.status(400).json({ success: false, error: 'Invalid merchantId' });
      return;
    }

    // Use provided dates or default to last 30 days
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Previous period for growth calculation
    const periodLength = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(start.getTime() - periodLength);

    // Import mongoose dynamically to avoid circular deps
    const mongoose = (await import('mongoose')).default;

    // Query the transactions collection for merchant payments
    const transactions = mongoose.connection.collection('transactions');

    // Aggregate current period
    const currentPipeline = [
      {
        $match: {
          merchantId: merchantId,
          type: { $in: ['payment', 'settlement', 'credit'] },
          status: 'completed',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgTransactionValue: { $avg: '$amount' },
        },
      },
    ];

    // Aggregate previous period
    const prevPipeline = [
      {
        $match: {
          merchantId: merchantId,
          type: { $in: ['payment', 'settlement', 'credit'] },
          status: 'completed',
          createdAt: { $gte: prevStart, $lte: prevEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ];

    const [currentResult, prevResult] = await Promise.all([
      transactions.aggregate(currentPipeline).toArray(),
      transactions.aggregate(prevPipeline).toArray(),
    ]);

    const currentRevenue = currentResult[0]?.totalRevenue || 0;
    const prevRevenue = prevResult[0]?.totalRevenue || 0;

    const growthRate = prevRevenue > 0
      ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 10000) / 100
      : currentRevenue > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        merchantId,
        period: { start: start.toISOString(), end: end.toISOString() },
        currentPeriod: {
          revenue: currentRevenue,
          transactionCount: currentResult[0]?.transactionCount || 0,
          avgTransactionValue: currentResult[0]?.avgTransactionValue || 0,
        },
        previousPeriod: {
          revenue: prevRevenue,
        },
        growthRate,
        dailyRevenue: periodLength <= 24 * 60 * 60 * 1000 ? currentRevenue : currentRevenue / 30,
      },
    });
  } catch (err) {
    logger.error('[Internal] Failed to fetch merchant revenue', {
      merchantId: req.params.merchantId,
      error: (err as Error).message,
    });
    res.status(500).json({ success: false, error: 'Failed to fetch revenue data' });
  }
});

// POST /internal/finance/emi/paid  [high-risk mutation — awards coins]
const EmiPaidSchema = z.object({ applicationId: z.string() });

router.post('/emi/paid', async (req, res) => {
  const parsed = EmiPaidSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.issues[0].message }); return; }
  try {
    auditLog(req, 'emi.paid', { applicationId: parsed.data.applicationId });
    await loanService.markFirstEmiPaid(parsed.data.applicationId);
    res.json({ success: true });
  } catch (err) {
    logger.error('[Internal] emi/paid error', { error: (err as Error).message });
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

export default router;
