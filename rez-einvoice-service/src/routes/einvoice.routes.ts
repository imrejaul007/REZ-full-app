import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import {
  einvoiceService,
  CreateEinvoiceInput,
  CancelEinvoiceInput,
  ModifyEinvoiceInput,
  EwaybillInput
} from '../services/einvoice.service';
import { InvoiceStatus, SupplyType } from '../models/invoice.model';
import { Logger } from '../services/logger.service';

const router = Router();
const logger = new Logger('EinvoiceRoutes');

// Validation schemas
const addressSchema = Joi.object({
  gstin: Joi.string().length(15).required(),
  legalName: Joi.string().optional(),
  tradeName: Joi.string().optional(),
  address1: Joi.string().required(),
  address2: Joi.string().optional(),
  location: Joi.string().required(),
  pincode: Joi.string().length(6).required(),
  stateCode: Joi.string().length(2).required(),
  countryCode: Joi.string().length(2).default('IN')
});

const itemSchema = Joi.object({
  hsnCode: Joi.string().required(),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().optional(),
  unitPrice: Joi.number().positive().required(),
  grossAmount: Joi.number().positive().required(),
  taxableAmount: Joi.number().positive().required(),
  igstRate: Joi.number().min(0).max(28).required(),
  cgstRate: Joi.number().min(0).max(28).optional(),
  sgstRate: Joi.number().min(0).max(28).optional(),
  cessRate: Joi.number().min(0).optional(),
  cessAdvol: Joi.number().min(0).optional()
});

const createEinvoiceSchema = Joi.object({
  invoiceNumber: Joi.string().required(),
  invoiceDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  invoiceType: Joi.string().valid('INV', 'CRN', 'DBN').default('INV'),
  supplyType: Joi.string().valid(...Object.values(SupplyType)).required(),
  seller: addressSchema.required(),
  buyer: addressSchema.required(),
  shipping: addressSchema.optional(),
  dispatchFrom: addressSchema.optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
  documentRef: Joi.object({
    documentType: Joi.string().required(),
    documentNumber: Joi.string().required(),
    documentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
  }).required()
});

const cancelSchema = Joi.object({
  irn: Joi.string().required(),
  cancellationReason: Joi.string().required(),
  cancellationRemark: Joi.string().optional()
});

const modifySchema = Joi.object({
  originalIrn: Joi.string().required(),
  modifiedReason: Joi.string().required(),
  modifiedDescription: Joi.string().optional(),
  items: Joi.array().items(itemSchema).min(1).optional(),
  invoiceDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  invoiceType: Joi.string().valid('INV', 'CRN', 'DBN').optional()
});

const ewaybillSchema = Joi.object({
  irn: Joi.string().required(),
  distance: Joi.number().positive().required(),
  transportMode: Joi.string().valid('road', 'rail', 'air', 'ship').optional(),
  transportId: Joi.string().optional(),
  vehicleNumber: Joi.string().optional(),
  transporterId: Joi.string().optional(),
  transporterName: Joi.string().optional(),
  documentType: Joi.string().optional(),
  documentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Helper function for validation
const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
      return;
    }
    req.body = value;
    next();
  };
};

/**
 * @route POST /api/einvoice
 * @desc Create a new e-invoice
 */
router.post('/', validate(createEinvoiceSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const input: CreateEinvoiceInput = req.body;

    const einvoice = await einvoiceService.createEinvoice(input);

    logger.info(`E-invoice created: ${einvoice.irn}`);

    res.status(201).json({
      success: true,
      data: {
        irn: einvoice.irn,
        invoiceNumber: einvoice.invoiceNumber,
        invoiceDate: einvoice.invoiceDate,
        status: einvoice.status,
        ackNumber: einvoice.ackNumber,
        ackDate: einvoice.ackDate,
        totalInvoiceValue: einvoice.totalInvoiceValue,
        qrCodeBase64: einvoice.qrCodeBase64,
        einvoiceJson: einvoiceService.generateEinvoiceJson(einvoice)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create e-invoice', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/einvoice/:irn
 * @desc Get e-invoice by IRN
 */
router.get('/:irn', async (req: Request, res: Response): Promise<void> => {
  try {
    const { irn } = req.params;

    const einvoice = await einvoiceService.getEinvoiceByIrn(irn);

    if (!einvoice) {
      res.status(404).json({
        success: false,
        error: 'E-invoice not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...einvoice.toObject(),
        einvoiceJson: einvoiceService.generateEinvoiceJson(einvoice)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to get e-invoice: ${req.params.irn}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/einvoice/number/:gstin/:invoiceNumber
 * @desc Get e-invoice by seller GSTIN and invoice number
 */
router.get('/number/:gstin/:invoiceNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gstin, invoiceNumber } = req.params;

    const einvoice = await einvoiceService.getEinvoiceByNumber(gstin, invoiceNumber);

    if (!einvoice) {
      res.status(404).json({
        success: false,
        error: 'E-invoice not found'
      });
      return;
    }

    res.json({
      success: true,
      data: einvoice
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to get e-invoice by number`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/einvoice/submit/:irn
 * @desc Submit e-invoice to GST portal
 */
router.post('/submit/:irn', async (req: Request, res: Response): Promise<void> => {
  try {
    const { irn } = req.params;

    const result = await einvoiceService.submitEinvoice(irn);

    logger.info(`E-invoice submitted: ${irn}`);

    res.json({
      success: true,
      data: {
        irn,
        ...result
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to submit e-invoice: ${req.params.irn}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/einvoice/accept/:irn
 * @desc Accept e-invoice
 */
router.post('/accept/:irn', async (req: Request, res: Response): Promise<void> => {
  try {
    const { irn } = req.params;

    const einvoice = await einvoiceService.acceptEinvoice(irn);

    logger.info(`E-invoice accepted: ${irn}`);

    res.json({
      success: true,
      data: {
        irn: einvoice.irn,
        status: einvoice.status,
        message: 'E-invoice accepted successfully'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to accept e-invoice: ${req.params.irn}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/einvoice/reject/:irn
 * @desc Reject e-invoice
 */
router.post('/reject/:irn', async (req: Request, res: Response): Promise<void> => {
  try {
    const { irn } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
      return;
    }

    const einvoice = await einvoiceService.rejectEinvoice(irn, reason);

    logger.info(`E-invoice rejected: ${irn}`);

    res.json({
      success: true,
      data: {
        irn: einvoice.irn,
        status: einvoice.status,
        reason: einvoice.cancellationRemark,
        message: 'E-invoice rejected'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to reject e-invoice: ${req.params.irn}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/einvoice/cancel
 * @desc Cancel an e-invoice
 */
router.post('/cancel', validate(cancelSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const input: CancelEinvoiceInput = req.body;

    const result = await einvoiceService.cancelEinvoice(input);

    logger.info(`E-invoice cancelled: ${input.irn}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to cancel e-invoice`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/einvoice/modify
 * @desc Modify an e-invoice
 */
router.post('/modify', validate(modifySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const input: ModifyEinvoiceInput = req.body;

    const newEinvoice = await einvoiceService.modifyEinvoice(input);

    logger.info(`E-invoice modified: ${input.originalIrn} -> ${newEinvoice.irn}`);

    res.json({
      success: true,
      data: {
        originalIrn: input.originalIrn,
        newIrn: newEinvoice.irn,
        status: newEinvoice.status,
        einvoiceJson: einvoiceService.generateEinvoiceJson(newEinvoice)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to modify e-invoice`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/einvoice/ewaybill
 * @desc Generate e-waybill for an e-invoice
 */
router.post('/ewaybill', validate(ewaybillSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const input: EwaybillInput = req.body;

    const result = await einvoiceService.generateEwaybill(input.irn, input);

    logger.info(`E-waybill generated: ${result.ewaybillNumber}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to generate e-waybill`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route DELETE /api/einvoice/ewaybill/:irn
 * @desc Cancel e-waybill
 */
router.delete('/ewaybill/:irn', async (req: Request, res: Response): Promise<void> => {
  try {
    const { irn } = req.params;
    const { reason } = req.body;

    await einvoiceService.cancelEwaybill(irn, reason || 'User requested cancellation');

    logger.info(`E-waybill cancelled for IRN: ${irn}`);

    res.json({
      success: true,
      data: {
        irn,
        message: 'E-waybill cancelled successfully'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to cancel e-waybill: ${req.params.irn}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/einvoice/seller/:gstin
 * @desc Get all e-invoices by seller GSTIN
 */
router.get('/seller/:gstin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gstin } = req.params;
    const { status, startDate, endDate, limit, offset } = req.query;

    const result = await einvoiceService.getEinvoicesBySeller(gstin, {
      status: status as InvoiceStatus,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: {
        invoices: result.invoices,
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to get e-invoices by seller: ${req.params.gstin}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/einvoice/buyer/:gstin
 * @desc Get all e-invoices by buyer GSTIN
 */
router.get('/buyer/:gstin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gstin } = req.params;
    const { status, limit, offset } = req.query;

    const result = await einvoiceService.getEinvoicesByBuyer(gstin, {
      status: status as InvoiceStatus,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: {
        invoices: result.invoices,
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to get e-invoices by buyer: ${req.params.gstin}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/einvoice/ewaybill/:ewaybillNumber
 * @desc Get e-invoice by e-waybill number
 */
router.get('/ewaybill/:ewaybillNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ewaybillNumber } = req.params;

    const einvoice = await einvoiceService.getEinvoiceByEwaybill(ewaybillNumber);

    if (!einvoice) {
      res.status(404).json({
        success: false,
        error: 'E-invoice not found for this e-waybill'
      });
      return;
    }

    res.json({
      success: true,
      data: einvoice
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to get e-invoice by e-waybill: ${req.params.ewaybillNumber}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/einvoice/verify/:irn
 * @desc Verify IRN checksum
 */
router.get('/verify/:irn', async (req: Request, res: Response): Promise<void> => {
  try {
    const { irn } = req.params;

    const isValid = einvoiceService.verifyIrnChecksum(irn);

    res.json({
      success: true,
      data: {
        irn,
        isValid,
        message: isValid ? 'IRN checksum is valid' : 'IRN checksum is invalid'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Failed to verify IRN: ${req.params.irn}`, error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

export default router;
