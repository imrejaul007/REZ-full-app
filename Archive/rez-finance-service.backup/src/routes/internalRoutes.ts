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
