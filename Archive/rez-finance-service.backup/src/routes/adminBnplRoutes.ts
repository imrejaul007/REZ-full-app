/**
 * Admin BNPL Routes — interest rate configuration
 *
 * GET  /finance/admin/bnpl/config      → get current interest config
 * PUT  /finance/admin/bnpl/config      → update interest config
 * POST /finance/admin/bnpl/calculate   → calculate interest/late fee
 */

import { Router, Request } from 'express';
import { z } from 'zod';
import { requireInternalToken } from '../middleware/auth';
import { bnplService } from '../services/bnplService';
import { logger } from '../config/logger';

const router = Router();
router.use(requireInternalToken);

function auditLog(req: Request, action: string, meta: Record<string, unknown>) {
  logger.info('[AdminBnplAudit]', {
    action,
    path: req.path,
    method: req.method,
    correlationId: req.headers['x-correlation-id'],
    requestId: req.headers['x-request-id'],
    callerIp: req.ip,
    ...meta,
  });
}

// GET /finance/admin/bnpl/config — get current interest configuration
router.get('/config', async (_req, res) => {
  try {
    const config = bnplService.getInterestConfig();
    res.json({ success: true, config });
  } catch (err) {
    logger.error('[AdminBnpl] GET /config error', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to get config' });
  }
});

// PUT /finance/admin/bnpl/config — update interest configuration
const UpdateConfigSchema = z.object({
  rates: z.record(z.string(), z.number().min(0).max(100)).optional(),
  defaultMonthlyRate: z.number().min(0).max(100).optional(),
  maxTenureDays: z.number().int().positive().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  lateFeePercentage: z.number().min(0).max(100).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
});

router.put('/config', async (req, res) => {
  const parsed = UpdateConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  try {
    auditLog(req, 'bnpl.config.update', { changes: parsed.data });

    // Convert rate keys to numbers if provided
    const updates: Record<string, unknown> = { ...parsed.data };
    if (updates.rates) {
      const numericRates: Record<number, number> = {};
      for (const [key, value] of Object.entries(updates.rates as Record<string, number>)) {
        numericRates[parseInt(key, 10)] = value;
      }
      updates.rates = numericRates;
    }

    bnplService.updateInterestConfig(updates);
    const config = bnplService.getInterestConfig();

    logger.info('[AdminBnpl] Interest config updated by admin', {
      adminIp: req.ip,
      changes: parsed.data,
      newConfig: config,
    });

    res.json({ success: true, config });
  } catch (err) {
    logger.error('[AdminBnpl] PUT /config error', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update config' });
  }
});

// POST /finance/admin/bnpl/calculate — calculate interest or late fee
const CalculateSchema = z.object({
  type: z.enum(['interest', 'lateFee']),
  amount: z.number().positive(),
  tenureDays: z.number().int().positive().optional(),
  daysLate: z.number().int().min(0).optional(),
});

router.post('/calculate', async (req, res) => {
  const parsed = CalculateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    return;
  }

  try {
    const { type, amount } = parsed.data;

    if (type === 'interest') {
      const tenureDays = parsed.data.tenureDays;
      if (!tenureDays) {
        res.status(400).json({ success: false, error: 'tenureDays required for interest calculation' });
        return;
      }
      const interest = bnplService.calculateInterest(amount, tenureDays);
      const config = bnplService.getInterestConfig();
      res.json({
        success: true,
        calculation: {
          type: 'interest',
          principal: amount,
          tenureDays,
          monthlyRate: config.rates[tenureDays] ?? config.defaultMonthlyRate,
          interestAmount: interest,
          totalAmount: amount + interest,
        },
      });
    } else {
      const daysLate = parsed.data.daysLate;
      if (daysLate === undefined || daysLate === null) {
        res.status(400).json({ success: false, error: 'daysLate required for late fee calculation' });
        return;
      }
      const lateFee = bnplService.calculateLateFee(amount, daysLate);
      const config = bnplService.getInterestConfig();
      res.json({
        success: true,
        calculation: {
          type: 'lateFee',
          outstanding: amount,
          daysLate,
          gracePeriodDays: config.gracePeriodDays,
          lateFeePercentage: config.lateFeePercentage,
          lateFeeAmount: lateFee,
          totalAmount: amount + lateFee,
        },
      });
    }
  } catch (err) {
    logger.error('[AdminBnpl] POST /calculate error', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Calculation failed' });
  }
});

export default router;
