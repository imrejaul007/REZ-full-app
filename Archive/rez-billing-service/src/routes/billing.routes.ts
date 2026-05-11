import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { billingService, BillingEventInput } from '../billing.service';
import { BillingModel, BillingStatus } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Standardized API Response Envelope
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    pagination?: { page: number; limit: number; total: number };
  };
}

const createResponse = <T>(data?: T, error?: { code: string; message: string; details?: unknown }): ApiResponse<T> => ({
  success: !error,
  ...(data !== undefined && { data }),
  ...(error && { error }),
  meta: { timestamp: new Date().toISOString() }
});

// Validation schemas - Migrated from Joi to Zod
const billingEventSchema = z.object({
  campaignId: z.string().min(1),
  merchantId: z.string().min(1),
  billingModel: z.enum(Object.values(BillingModel) as [string, ...string[]]),
  amount: z.number().positive().max(1000000000), // Added upper bound
  currency: z.string().default('USD'),
  eventType: z.string().min(1),
  clickId: z.string().optional(),
  impressionId: z.string().optional(),
  conversionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

const batchEventSchema = z.object({
  events: z.array(billingEventSchema).min(1).max(1000)
});

const summaryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const recordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  campaignId: z.string().optional(),
  billingModel: z.enum(Object.values(BillingModel) as [string, ...string[]]).optional(),
  status: z.string().optional()
});

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

const refundSchema = z.object({
  reason: z.string().optional()
});

// Validation middleware
const validate = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(createResponse(undefined, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: result.error.errors
    }));
  }
  req.body = result.data;
  next();
};

const validateQuery = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json(createResponse(undefined, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid query parameters',
      details: result.error.errors
    }));
  }
  req.query = result.data;
  next();
};

// Routes

/**
 * POST /api/v1/billing/events - Process a single billing event
 */
router.post('/events', validate(billingEventSchema), async (req: Request, res: Response) => {
  try {
    const event: BillingEventInput = req.body;
    const result = await billingService.processEvent(event);

    if (!result.success) {
      return res.status(400).json(createResponse(undefined, {
        code: 'BILLING_EVENT_FAILED',
        message: result.error || 'Failed to process billing event'
      }));
    }

    res.status(201).json(createResponse(result));
  } catch (error) {
    logger.error('Error processing billing event:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

/**
 * POST /api/v1/billing/events/batch - Process multiple billing events
 */
router.post('/events/batch', validate(batchEventSchema), async (req: Request, res: Response) => {
  try {
    const { events } = req.body;
    const results = await billingService.processBatch(events);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(201).json(createResponse({
      total: results.length,
      successful,
      failed,
      results
    }));
  } catch (error) {
    logger.error('Error processing batch billing events:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

/**
 * GET /api/v1/billing/campaigns/:campaignId/summary - Get billing summary for a campaign
 */
router.get('/campaigns/:campaignId/summary', validateQuery(summaryQuerySchema), async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { merchantId } = req.query;
    const { startDate, endDate } = req.query as { startDate?: Date; endDate?: Date };

    if (!merchantId || typeof merchantId !== 'string') {
      return res.status(400).json(createResponse(undefined, {
        code: 'MISSING_PARAMETER',
        message: 'merchantId query parameter is required'
      }));
    }

    const summary = await billingService.getCampaignBillingSummary(
      campaignId,
      merchantId,
      startDate,
      endDate
    );

    if (!summary) {
      return res.status(404).json(createResponse(undefined, {
        code: 'RESOURCE_NOT_FOUND',
        message: 'No billing records found'
      }));
    }

    res.json(createResponse(summary));
  } catch (error) {
    logger.error('Error getting campaign billing summary:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

/**
 * GET /api/v1/billing/merchants/:merchantId/records - Get billing records for a merchant
 */
router.get('/merchants/:merchantId/records', validateQuery(recordsQuerySchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { page, limit, campaignId, billingModel, status } = req.query as {
      page?: number;
      limit?: number;
      campaignId?: string;
      billingModel?: BillingModel;
      status?: BillingStatus;
    };

    const result = await billingService.getMerchantBillingRecords(merchantId, {
      page,
      limit,
      campaignId,
      billingModel,
      status
    });

    res.json(createResponse(result.data, result.error ? {
      code: 'QUERY_FAILED',
      message: result.error
    } : undefined));
  } catch (error) {
    logger.error('Error getting merchant billing records:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

/**
 * POST /api/v1/billing/events/:eventId/refund - Refund a billing event
 */
router.post('/events/:billingRecordId/refund/:eventId', validate(refundSchema), async (req: Request, res: Response) => {
  try {
    const { billingRecordId, eventId } = req.params;
    const { merchantId } = req.body;
    const { reason } = req.body;

    if (!merchantId) {
      return res.status(400).json(createResponse(undefined, {
        code: 'MISSING_PARAMETER',
        message: 'merchantId is required'
      }));
    }

    const result = await billingService.refundBillingEvent(
      merchantId,
      billingRecordId,
      eventId,
      reason
    );

    if (!result.success) {
      return res.status(400).json(createResponse(undefined, {
        code: 'REFUND_FAILED',
        message: result.error || 'Failed to process refund'
      }));
    }

    res.status(201).json(createResponse(result));
  } catch (error) {
    logger.error('Error refunding billing event:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

/**
 * POST /api/v1/billing/merchants/:merchantId/finalize - Finalize billing for a period
 */
router.post('/merchants/:merchantId/finalize', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { endDate } = req.body;

    if (!endDate) {
      return res.status(400).json(createResponse(undefined, {
        code: 'MISSING_PARAMETER',
        message: 'endDate is required'
      }));
    }

    const count = await billingService.finalizeBillingPeriod(merchantId, new Date(endDate));

    res.status(201).json(createResponse({ finalized: count }));
  } catch (error) {
    logger.error('Error finalizing billing period:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

/**
 * GET /api/v1/billing/merchants/:merchantId/analytics - Get billing analytics
 */
router.get('/merchants/:merchantId/analytics', validateQuery(analyticsQuerySchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query as { startDate: Date; endDate: Date };

    const analytics = await billingService.getBillingAnalytics(merchantId, startDate, endDate);

    res.json(createResponse(analytics));
  } catch (error) {
    logger.error('Error getting billing analytics:', error);
    res.status(500).json(createResponse(undefined, {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }));
  }
});

export default router;
