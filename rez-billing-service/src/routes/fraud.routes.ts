import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { fraudService, CreateAlertInput } from '../fraud.service';
import { FraudAlertSeverity, FraudAlertStatus } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createAlertSchema = Joi.object({
  merchantId: Joi.string().required(),
  type: Joi.string().required(),
  severity: Joi.string().valid(...Object.values(FraudAlertSeverity)).required(),
  description: Joi.string().required(),
  evidence: Joi.object().required(),
  affectedTransactions: Joi.array().items(Joi.string()).default([])
});

const alertsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  severity: Joi.string().valid(...Object.values(FraudAlertSeverity)).optional(),
  status: Joi.string().valid(...Object.values(FraudAlertStatus)).optional()
});

const updateAlertSchema = Joi.object({
  status: Joi.string().valid(...Object.values(FraudAlertStatus)).required(),
  resolution: Joi.string().when('status', {
    is: Joi.string().valid(FraudAlertStatus.RESOLVED, FraudAlertStatus.FALSE_POSITIVE),
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Validation middleware
const validate = (schema: Joi.Schema) => (req: Request, res: Response, next: NextFunction) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateQuery = (schema: Joi.Schema) => (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

// Routes

/**
 * GET /api/fraud/alerts - Get all critical open alerts (dashboard)
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await fraudService.getCriticalOpenAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting critical alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/fraud/alerts/:alertId - Get alert by ID
 */
router.get('/alerts/:alertId', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const alert = await fraudService.getAlert(alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    logger.error('Error getting alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/fraud/merchants/:merchantId/alerts - Get alerts for a merchant
 */
router.get('/merchants/:merchantId/alerts', validateQuery(alertsQuerySchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { page, limit, severity, status } = req.query as {
      page?: number;
      limit?: number;
      severity?: FraudAlertSeverity;
      status?: FraudAlertStatus;
    };

    const result = await fraudService.getMerchantAlerts(merchantId, {
      page,
      limit,
      severity,
      status
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting merchant alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/fraud/alerts - Create a fraud alert (manual)
 */
router.post('/alerts', validate(createAlertSchema), async (req: Request, res: Response) => {
  try {
    const input: CreateAlertInput = req.body;
    const alert = await fraudService.createAlert(input);
    res.status(201).json(alert);
  } catch (error) {
    logger.error('Error creating fraud alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/fraud/alerts/:alertId - Update alert status
 */
router.patch('/alerts/:alertId', validate(updateAlertSchema), async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { status, resolution } = req.body;

    const alert = await fraudService.updateAlertStatus(alertId, status, resolution);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/fraud/alerts/:alertId/resolve - Resolve an alert
 */
router.post('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution is required' });
    }

    const alert = await fraudService.resolveAlert(alertId, resolution);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/fraud/alerts/:alertId/false-positive - Mark as false positive
 */
router.post('/alerts/:alertId/false-positive', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const alert = await fraudService.markAsFalsePositive(alertId, reason);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    logger.error('Error marking as false positive:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/fraud/merchants/:merchantId/stats - Get fraud statistics
 */
router.get('/merchants/:merchantId/stats', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await fraudService.getFraudStats(merchantId, start, end);

    res.json(stats);
  } catch (error) {
    logger.error('Error getting fraud stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
