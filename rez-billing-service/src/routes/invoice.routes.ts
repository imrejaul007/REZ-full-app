import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { invoiceService, CreateInvoiceInput } from '../invoice.service';
import { InvoiceStatus, BillingModel } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createInvoiceSchema = Joi.object({
  merchantId: Joi.string().required(),
  billingPeriod: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().required()
  }).required(),
  items: Joi.array().items(
    Joi.object({
      description: Joi.string().required(),
      quantity: Joi.number().integer().positive().required(),
      unitPrice: Joi.number().positive().required(),
      amount: Joi.number().positive().required(),
      billingModel: Joi.string().valid(...Object.values(BillingModel)).required()
    })
  ).min(1).required(),
  taxRate: Joi.number().min(0).max(100).default(0),
  dueInDays: Joi.number().integer().min(1).default(30)
});

const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...Object.values(InvoiceStatus)).optional()
});

const paymentSchema = Joi.object({
  paymentReference: Joi.string().optional()
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
 * POST /api/invoices - Create a new invoice
 */
router.post('/', validate(createInvoiceSchema), async (req: Request, res: Response) => {
  try {
    const input: CreateInvoiceInput = req.body;
    const result = await invoiceService.generateInvoiceFromBilling(input);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invoices/:invoiceId - Get invoice by ID
 */
router.get('/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    logger.error('Error getting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invoices/number/:invoiceNumber - Get invoice by number
 */
router.get('/number/:invoiceNumber', async (req: Request, res: Response) => {
  try {
    const { invoiceNumber } = req.params;
    const invoice = await invoiceService.getInvoiceByNumber(invoiceNumber);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    logger.error('Error getting invoice by number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invoices/merchant/:merchantId - Get invoices for a merchant
 */
router.get('/merchant/:merchantId', validateQuery(invoiceQuerySchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { page, limit, status } = req.query as {
      page?: number;
      limit?: number;
      status?: InvoiceStatus;
    };

    const result = await invoiceService.getMerchantInvoices(merchantId, { page, limit, status });

    res.json(result);
  } catch (error) {
    logger.error('Error getting merchant invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/invoices/:invoiceId/pay - Mark invoice as paid
 */
router.post('/:invoiceId/pay', validate(paymentSchema), async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { paymentReference } = req.body;

    const result = await invoiceService.markAsPaid(invoiceId, paymentReference);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error paying invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/invoices/:invoiceId/cancel - Cancel invoice
 */
router.post('/:invoiceId/cancel', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const { reason } = req.body;

    const result = await invoiceService.cancelInvoice(invoiceId, reason);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error cancelling invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invoices/:invoiceId/pdf - Generate PDF for invoice
 */
router.get('/:invoiceId/pdf', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const pdf = await invoiceService.generatePDF(invoiceId);

    if (!pdf) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.send(pdf);
  } catch (error) {
    logger.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/invoices/merchant/:merchantId/stats - Get invoice statistics
 */
router.get('/merchant/:merchantId/stats', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await invoiceService.getInvoiceStats(merchantId, start, end);

    res.json(stats);
  } catch (error) {
    logger.error('Error getting invoice stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
