import { Router, Request, Response } from 'express';
import { invoiceService } from '../services';
import { ApiResponse, Invoice } from '../models';

const router = Router();

// Helper to build API response
const apiResponse = <T>(success: boolean, data?: T, error?: ApiResponse['error']): ApiResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

// POST /api/invoices - Create a new invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customerId, items, taxRate, dueDate, currency, metadata } = req.body;

    if (!customerId || !items || !dueDate) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'customerId, items, and dueDate are required',
      }));
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'INVALID_ITEMS',
        message: 'items must be a non-empty array',
      }));
    }

    const invoice = await invoiceService.createInvoice({
      customerId,
      items,
      taxRate,
      dueDate: new Date(dueDate),
      currency,
      metadata,
    });

    res.status(201).json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'INVOICE_CREATION_FAILED',
      message,
    }));
  }
});

// GET /api/invoices/:id - Get invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);

    if (!invoice) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'INVOICE_NOT_FOUND',
        message: `Invoice not found: ${req.params.id}`,
      }));
    }

    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_INVOICE_FAILED',
      message,
    }));
  }
});

// GET /api/invoices/number/:invoiceNumber - Get invoice by invoice number
router.get('/number/:invoiceNumber', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoiceByNumber(req.params.invoiceNumber);

    if (!invoice) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'INVOICE_NOT_FOUND',
        message: `Invoice not found: ${req.params.invoiceNumber}`,
      }));
    }

    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_INVOICE_FAILED',
      message,
    }));
  }
});

// GET /api/invoices/customer/:customerId - Get invoices by customer
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', status } = req.query;

    const invoices = await invoiceService.getInvoicesByCustomer(
      req.params.customerId,
      {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        status: status as Invoice['status'],
      }
    );

    res.json(apiResponse(true, invoices));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_INVOICES_FAILED',
      message,
    }));
  }
});

// GET /api/invoices/overdue - Get all overdue invoices
router.get('/status/overdue', async (req: Request, res: Response) => {
  try {
    const invoices = await invoiceService.getOverdueInvoices();
    res.json(apiResponse(true, invoices));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_OVERDUE_FAILED',
      message,
    }));
  }
});

// POST /api/invoices/:id/issue - Issue an invoice
router.post('/:id/issue', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.issueInvoice(req.params.id);
    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'ISSUE_INVOICE_FAILED',
      message,
    }));
  }
});

// PUT /api/invoices/:id - Update an invoice
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { items, taxRate, dueDate, metadata } = req.body;

    const invoice = await invoiceService.updateInvoice(req.params.id, {
      items,
      taxRate,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata,
    });

    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'UPDATE_INVOICE_FAILED',
      message,
    }));
  }
});

// POST /api/invoices/:id/pay - Mark invoice as paid
router.post('/:id/pay', async (req: Request, res: Response) => {
  try {
    const { paidAt } = req.body;

    const invoice = await invoiceService.markAsPaid(
      req.params.id,
      paidAt ? new Date(paidAt) : undefined
    );

    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'PAY_INVOICE_FAILED',
      message,
    }));
  }
});

// POST /api/invoices/:id/cancel - Cancel an invoice
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const invoice = await invoiceService.cancelInvoice(req.params.id, reason);
    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'CANCEL_INVOICE_FAILED',
      message,
    }));
  }
});

// POST /api/invoices/:id/items - Add item to invoice
router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const { description, quantity, unitPrice, currency } = req.body;

    if (!description || quantity === undefined || unitPrice === undefined) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'description, quantity, and unitPrice are required',
      }));
    }

    const invoice = await invoiceService.addItem(req.params.id, {
      description,
      quantity,
      unitPrice,
      currency,
    });

    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'ADD_ITEM_FAILED',
      message,
    }));
  }
});

// DELETE /api/invoices/:id/items/:itemId - Remove item from invoice
router.delete('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.removeItem(req.params.id, req.params.itemId);
    res.json(apiResponse(true, invoice));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'REMOVE_ITEM_FAILED',
      message,
    }));
  }
});

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await invoiceService.getStatistics();
    res.json(apiResponse(true, stats));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_STATS_FAILED',
      message,
    }));
  }
});

export default router;
