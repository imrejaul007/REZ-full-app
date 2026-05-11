/**
 * Partner Webhook Routes
 *
 * Partners (FinBox, banks) call these to push status updates.
 * All routes require a partner-specific HMAC signature.
 *
 * POST /finance/partner/webhook/:partnerId/application  → application status update
 * POST /finance/partner/webhook/:partnerId/disbursal    → disbursal confirmation
 */

import { Router, Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { loanService } from '../services/loanService';
import { logger } from '../config/logger';
import { LoanApplication } from '../models/LoanApplication';
import type { LoanStatus } from '../models/LoanApplication';

const router = Router();
type PartnerWebhookRequest = Request & { rawBody?: Buffer };

function auditLog(req: Request, action: string, meta: Record<string, unknown>) {
  logger.info('[PartnerAudit]', {
    action,
    partnerId: req.params.partnerId,
    correlationId: req.headers['x-correlation-id'],
    ip: req.ip,
    ...meta,
  });
}

function partnerSecretEnvName(partnerId: string): string {
  return `PARTNER_WEBHOOK_SECRET_${partnerId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function verifyPartnerSignature(req: PartnerWebhookRequest): { ok: boolean; reason?: string } {
  const partnerId = req.params.partnerId;
  const secret = process.env[partnerSecretEnvName(partnerId)];
  if (!secret) {
    return { ok: false, reason: `Missing webhook secret for partner ${partnerId}` };
  }

  const provided = req.headers['x-partner-signature'];
  if (typeof provided !== 'string') {
    return { ok: false, reason: 'Missing x-partner-signature' };
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return { ok: false, reason: 'Missing raw request body' };
  }

  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
  const providedNormalized = provided.startsWith('sha256=') ? provided.slice(7) : provided;
  const expectedBuf = Buffer.from(computed, 'hex');
  const providedBuf = Buffer.from(providedNormalized, 'hex');

  if (expectedBuf.length !== providedBuf.length) {
    return { ok: false, reason: 'Invalid partner signature' };
  }

  const valid = timingSafeEqual(expectedBuf, providedBuf);
  return valid ? { ok: true } : { ok: false, reason: 'Invalid partner signature' };
}

router.use((req: PartnerWebhookRequest, res, next) => {
  const verification = verifyPartnerSignature(req);
  if (!verification.ok) {
    const status = verification.reason?.startsWith('Missing webhook secret') ? 503 : 401;
    logger.warn('[Partner] Webhook signature rejected', {
      partnerId: req.params.partnerId,
      reason: verification.reason,
      correlationId: req.headers['x-correlation-id'],
      ip: req.ip,
    });
    res.status(status).json({ success: false, error: verification.reason });
    return;
  }
  next();
});

const StatusWebhookSchema = z.object({
  partnerApplicationId: z.string(),
  status: z.enum(['pending', 'under_review', 'approved', 'disbursed', 'rejected']),
  interestRate: z.number().optional(),
  emi: z.number().optional(),
  rejectionReason: z.string().optional(),
  disbursedAmount: z.number().optional(),
});

// POST /finance/partner/webhook/:partnerId/application
router.post('/:partnerId/application', async (req, res) => {
  const parsed = StatusWebhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  try {
    const { partnerApplicationId, status, ...meta } = parsed.data;
    const application = await LoanApplication.findOne({ partnerApplicationId });
    if (!application) {
      res.status(404).json({ success: false, error: 'Application not found' });
      return;
    }

    await loanService.updateStatus(application.id, status as LoanStatus, meta);
    auditLog(req, 'application.status_update', { partnerApplicationId, applicationId: application.id, status });
    res.json({ success: true });
  } catch (err) {
    logger.error('[Partner] Webhook error', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

// POST /finance/partner/webhook/:partnerId/disbursal
const DisbursalSchema = z.object({
  partnerApplicationId: z.string(),
  disbursedAmount: z.number().positive(),
});

router.post('/:partnerId/disbursal', async (req, res) => {
  const parsed = DisbursalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }
  try {
    const application = await LoanApplication.findOne({ partnerApplicationId: parsed.data.partnerApplicationId });
    if (!application) { res.status(404).json({ success: false, error: 'Not found' }); return; }

    await loanService.updateStatus(application.id, 'disbursed', { disbursedAmount: parsed.data.disbursedAmount });
    auditLog(req, 'application.disbursal', {
      partnerApplicationId: parsed.data.partnerApplicationId,
      applicationId: application.id,
      disbursedAmount: parsed.data.disbursedAmount,
    });
    res.json({ success: true });
  } catch (err) {
    logger.error('[Partner] Disbursal webhook error', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

export default router;
