import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { gstService, GST_RATES, STATE_CODES } from '../services/gst.service';
import { Logger } from '../services/logger.service';

const router = Router();
const logger = new Logger('GstRoutes');

// Validation schemas
const gstCalculationSchema = Joi.object({
  taxableAmount: Joi.number().positive().required(),
  rate: Joi.number().min(0).max(28).required(),
  sellerStateCode: Joi.string().length(2).required(),
  buyerStateCode: Joi.string().length(2).required(),
  cessRate: Joi.number().min(0).optional(),
  cessAdvol: Joi.number().min(0).optional()
});

const invoiceValueSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      hsnCode: Joi.string().required(),
      taxableAmount: Joi.number().positive().required(),
      rate: Joi.number().min(0).max(28).required(),
      cessRate: Joi.number().min(0).optional(),
      cessAdvol: Joi.number().min(0).optional()
    })
  ).min(1).required(),
  sellerStateCode: Joi.string().length(2).required(),
  buyerStateCode: Joi.string().length(2).required()
});

const gstinValidationSchema = Joi.object({
  gstin: Joi.string().length(15).required()
});

/**
 * @route POST /api/gst/calculate
 * @desc Calculate GST for a single item
 */
router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = gstCalculationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
      return;
    }

    const { taxableAmount, rate, sellerStateCode, buyerStateCode, cessRate, cessAdvol } = value;

    const result = gstService.calculateGst(
      { taxableAmount, rate, cessRate, cessAdvol },
      sellerStateCode,
      buyerStateCode
    );

    logger.info(`GST calculated: ${taxableAmount} at ${rate}%`);

    res.json({
      success: true,
      data: {
        input: { taxableAmount, rate, cessRate, cessAdvol },
        result: {
          cgst: result.cgst,
          sgst: result.sgst,
          igst: result.igst,
          cess: result.cess,
          cessAdvol: result.cessAdvol,
          totalTax: result.totalTax,
          isInterState: result.isInterState
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to calculate GST', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/gst/invoice-value
 * @desc Calculate complete invoice value breakdown
 */
router.post('/invoice-value', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = invoiceValueSchema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
      return;
    }

    const { items, sellerStateCode, buyerStateCode } = value;

    const result = gstService.calculateInvoiceValue(
      items,
      sellerStateCode,
      buyerStateCode
    );

    logger.info(`Invoice value calculated: ${result.totalInvoiceValue}`);

    res.json({
      success: true,
      data: {
        items,
        sellerStateCode,
        buyerStateCode,
        breakdown: {
          totalTaxableValue: result.totalTaxableValue,
          totalCgst: result.totalCgst,
          totalSgst: result.totalSgst,
          totalIgst: result.totalIgst,
          totalCess: result.totalCess,
          totalCessAdvol: result.totalCessAdvol,
          totalTax: result.totalTax,
          totalInvoiceValue: result.totalInvoiceValue,
          totalInvoiceValueInWords: result.totalInvoiceValueInWords
        }
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to calculate invoice value', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/gst/validate-gstin
 * @desc Validate GSTIN format
 */
router.post('/validate-gstin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = gstinValidationSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
      return;
    }

    const { gstin } = value;
    const validation = gstService.validateGstin(gstin);

    res.json({
      success: true,
      data: {
        gstin,
        valid: validation.valid,
        error: validation.error,
        pan: validation.valid ? gstService.extractPan(gstin) : null,
        stateCode: validation.valid ? gstService.getStateCode(gstin) : null,
        stateName: validation.valid ? gstService.getStateName(gstService.getStateCode(gstin)) : null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to validate GSTIN', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/gst/is-interstate
 * @desc Check if transaction is inter-state
 */
router.get('/is-interstate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerStateCode, buyerStateCode } = req.query;

    if (!sellerStateCode || !buyerStateCode) {
      res.status(400).json({
        success: false,
        error: 'sellerStateCode and buyerStateCode are required'
      });
      return;
    }

    const isInterState = gstService.isInterState(
      sellerStateCode as string,
      buyerStateCode as string
    );

    res.json({
      success: true,
      data: {
        sellerStateCode,
        buyerStateCode,
        isInterState,
        taxType: isInterState ? 'IGST' : 'CGST + SGST'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to check inter-state', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/gst/states
 * @desc Get all Indian state codes
 */
router.get('/states', async (_req: Request, res: Response): Promise<void> => {
  try {
    const states = Object.entries(STATE_CODES).map(([code, name]) => ({
      code,
      name
    }));

    res.json({
      success: true,
      data: states
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get states', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route GET /api/gst/rates
 * @desc Get all GST rates
 */
router.get('/rates', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rates = Object.entries(GST_RATES).map(([name, rate]) => ({
      name,
      rate,
      description: getRateDescription(rate)
    }));

    res.json({
      success: true,
      data: rates
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get GST rates', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/gst/hsn-summary
 * @desc Calculate HSN summary from items
 */
router.post('/hsn-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      items: Joi.array().items(
        Joi.object({
          hsnCode: Joi.string().required(),
          taxableAmount: Joi.number().positive().required(),
          rate: Joi.number().min(0).max(28).required(),
          cessRate: Joi.number().min(0).optional(),
          cessAdvol: Joi.number().min(0).optional()
        })
      ).min(1).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
      return;
    }

    const summary = gstService.calculateHsnSummary(value.items);

    logger.info(`HSN summary calculated for ${value.items.length} items`);

    res.json({
      success: true,
      data: {
        summary,
        totalItems: value.items.length
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to calculate HSN summary', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * @route POST /api/gst/number-to-words
 * @desc Convert number to words (Indian format)
 */
router.post('/number-to-words', async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      number: Joi.number().positive().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => ({ field: d.path.join('.'), message: d.message }))
      });
      return;
    }

    const words = gstService.numberToWords(value.number);

    res.json({
      success: true,
      data: {
        number: value.number,
        words
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to convert number to words', error);
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * Helper function to get rate description
 */
function getRateDescription(rate: number): string {
  switch (rate) {
    case 0:
      return 'Exempt / Zero rated';
    case 0.25:
      return 'Extra Small (0.25%)';
    case 3:
      return 'Pre-packed/Low value items';
    case 5:
      return 'Common goods and services';
    case 12:
      return 'Medium rate items';
    case 18:
      return 'Standard rate (most items)';
    case 28:
      return 'Luxury / Sin goods';
    default:
      return 'Custom rate';
  }
}

export default router;
