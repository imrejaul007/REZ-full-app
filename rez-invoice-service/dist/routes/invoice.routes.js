"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const pdfService_1 = require("../services/pdfService");
const emailService_1 = require("../services/emailService");
// Define Zod schemas at module level
const addressSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    line1: zod_1.z.string().min(1, 'Address line 1 is required'),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().min(1, 'State is required'),
    postalCode: zod_1.z.string().min(1, 'Postal code is required'),
    country: zod_1.z.string().default('India'),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    gstin: zod_1.z.string().optional(),
    pan: zod_1.z.string().optional()
});
const lineItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'Description is required'),
    hsnCode: zod_1.z.string().min(1, 'HSN code is required'),
    quantity: zod_1.z.number().positive('Quantity must be positive'),
    unit: zod_1.z.string().optional().default('pcs'),
    rate: zod_1.z.number().nonnegative('Rate cannot be negative'),
    discount: zod_1.z.number().nonnegative().optional(),
    discountPercent: zod_1.z.number().min(0).max(100).optional()
});
const bankDetailsSchema = zod_1.z.object({
    bankName: zod_1.z.string().optional(),
    branch: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
    ifscCode: zod_1.z.string().optional(),
    accountType: zod_1.z.string().optional(),
    upiId: zod_1.z.string().optional()
});
const createInvoiceSchema = zod_1.z.object({
    type: zod_1.z.enum(['tax_invoice', 'bill_of_supply', 'receipt', 'credit_note', 'debit_note']).optional(),
    customerName: zod_1.z.string().min(1, 'Customer name is required'),
    customerAddress: addressSchema,
    customerGstin: zod_1.z.string().optional(),
    customerPan: zod_1.z.string().optional(),
    items: zod_1.z.array(lineItemSchema).min(1, 'At least one item is required'),
    invoiceDate: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().optional(),
    placeOfSupply: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    bankDetails: bankDetailsSchema.optional(),
    reference: zod_1.z.string().optional(),
    template: zod_1.z.string().optional(),
    color: zod_1.z.string().optional()
});
const updateInvoiceSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1).optional(),
    customerAddress: addressSchema.optional(),
    customerGstin: zod_1.z.string().optional(),
    customerPan: zod_1.z.string().optional(),
    items: zod_1.z.array(lineItemSchema).min(1).optional(),
    invoiceDate: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().optional(),
    placeOfSupply: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    terms: zod_1.z.string().optional(),
    bankDetails: bankDetailsSchema.optional(),
    status: zod_1.z.enum(['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
    reference: zod_1.z.string().optional(),
    template: zod_1.z.string().optional(),
    color: zod_1.z.string().optional()
});
const recordPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Payment amount must be positive'),
    date: zod_1.z.string().min(1, 'Payment date is required'),
    method: zod_1.z.enum(['bank_transfer', 'upi', 'cash', 'check', 'card', 'other']),
    reference: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
const sendEmailSchema = zod_1.z.object({
    to: zod_1.z.union([zod_1.z.string().email(), zod_1.z.array(zod_1.z.string().email())]),
    cc: zod_1.z.array(zod_1.z.string().email()).optional(),
    bcc: zod_1.z.array(zod_1.z.string().email()).optional(),
    subject: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
    attachPdf: zod_1.z.boolean().optional()
});
const filtersSchema = zod_1.z.object({
    status: zod_1.z.enum(['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled']).optional(),
    fromDate: zod_1.z.string().optional(),
    toDate: zod_1.z.string().optional(),
    customerName: zod_1.z.string().optional(),
    minAmount: zod_1.z.coerce.number().optional(),
    maxAmount: zod_1.z.coerce.number().optional(),
    search: zod_1.z.string().optional()
});
const paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    sortBy: zod_1.z.enum(['invoiceDate', 'invoiceNumber', 'totalAmount', 'dueDate', 'createdAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
class InvoiceRoutes {
    router;
    invoiceModel;
    pdfService;
    emailService;
    constructor(invoiceModel) {
        this.router = (0, express_1.Router)();
        this.invoiceModel = invoiceModel;
        this.pdfService = new pdfService_1.PDFService();
        this.emailService = new emailService_1.EmailService();
        this.setupRoutes();
    }
    validationError(res, error) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message
            }))
        });
    }
    setupRoutes() {
        // Create invoice
        this.router.post('/', async (req, res, next) => {
            try {
                const validation = createInvoiceSchema.safeParse(req.body);
                if (!validation.success) {
                    return this.validationError(res, validation.error);
                }
                const invoice = await this.invoiceModel.create(validation.data);
                res.status(201).json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                next(error);
            }
        });
        // List invoices with filters and pagination
        this.router.get('/', async (req, res, next) => {
            try {
                const filtersValidation = filtersSchema.safeParse(req.query);
                const paginationValidation = paginationSchema.safeParse(req.query);
                if (!filtersValidation.success) {
                    return this.validationError(res, filtersValidation.error);
                }
                if (!paginationValidation.success) {
                    return this.validationError(res, paginationValidation.error);
                }
                const result = await this.invoiceModel.list(filtersValidation.data, paginationValidation.data);
                res.json({
                    success: true,
                    data: result.data,
                    pagination: {
                        total: result.total,
                        page: result.page,
                        limit: result.limit,
                        totalPages: result.totalPages
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Get single invoice
        this.router.get('/:id', async (req, res, next) => {
            try {
                const { id } = req.params;
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                res.json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Get invoice by invoice number
        this.router.get('/number/:invoiceNumber', async (req, res, next) => {
            try {
                const { invoiceNumber } = req.params;
                const invoice = await this.invoiceModel.findByInvoiceNumber(invoiceNumber);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                res.json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Update invoice
        this.router.patch('/:id', async (req, res, next) => {
            try {
                const { id } = req.params;
                const validation = updateInvoiceSchema.safeParse(req.body);
                if (!validation.success) {
                    return this.validationError(res, validation.error);
                }
                const invoice = await this.invoiceModel.update(id, validation.data);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                res.json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Delete invoice
        this.router.delete('/:id', async (req, res, next) => {
            try {
                const { id } = req.params;
                const deleted = await this.invoiceModel.delete(id);
                if (!deleted) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                res.json({
                    success: true,
                    message: 'Invoice deleted successfully'
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Update invoice status
        this.router.patch('/:id/status', async (req, res, next) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                if (!status || !['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled'].includes(status)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid status'
                    });
                }
                const invoice = await this.invoiceModel.updateStatus(id, status);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                res.json({
                    success: true,
                    data: invoice
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Record payment
        this.router.post('/:id/payments', async (req, res, next) => {
            try {
                const { id } = req.params;
                const validation = recordPaymentSchema.safeParse(req.body);
                if (!validation.success) {
                    return this.validationError(res, validation.error);
                }
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                const updated = await this.invoiceModel.recordPayment(id, validation.data);
                res.json({
                    success: true,
                    data: updated
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Get payment history
        this.router.get('/:id/payments', async (req, res, next) => {
            try {
                const { id } = req.params;
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                res.json({
                    success: true,
                    data: invoice.payments
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Send invoice via email
        this.router.post('/:id/send', async (req, res, next) => {
            try {
                const { id } = req.params;
                const validation = sendEmailSchema.safeParse(req.body);
                if (!validation.success) {
                    return this.validationError(res, validation.error);
                }
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                const emailOptions = {
                    to: validation.data.to,
                    cc: validation.data.cc,
                    bcc: validation.data.bcc,
                    subject: validation.data.subject,
                    message: validation.data.message,
                    attachPdf: validation.data.attachPdf
                };
                const result = await this.emailService.sendInvoice(invoice, emailOptions);
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        error: result.error
                    });
                }
                // Update invoice status to sent
                if (invoice.status === 'draft') {
                    await this.invoiceModel.updateStatus(id, 'sent');
                }
                res.json({
                    success: true,
                    message: 'Invoice sent successfully',
                    messageId: result.messageId
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Download invoice PDF
        this.router.get('/:id/pdf', async (req, res, next) => {
            try {
                const { id } = req.params;
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
                res.send(pdfBuffer);
            }
            catch (error) {
                next(error);
            }
        });
        // Preview invoice PDF (inline)
        this.router.get('/:id/preview', async (req, res, next) => {
            try {
                const { id } = req.params;
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                // Update status to viewed if not already
                if (invoice.status === 'sent' || invoice.status === 'draft') {
                    await this.invoiceModel.updateStatus(id, 'viewed');
                }
                const pdfBuffer = await this.pdfService.generateInvoicePDF(invoice);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`);
                res.send(pdfBuffer);
            }
            catch (error) {
                next(error);
            }
        });
        // Get invoice statistics
        this.router.get('/stats/summary', async (req, res, next) => {
            try {
                const filtersValidation = filtersSchema.safeParse(req.query);
                const filters = filtersValidation.success ? filtersValidation.data : {};
                const stats = await this.invoiceModel.getStats(filters);
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Get GST summary
        this.router.get('/reports/gst', async (req, res, next) => {
            try {
                const { fromDate, toDate } = req.query;
                if (!fromDate || !toDate) {
                    return res.status(400).json({
                        success: false,
                        error: 'fromDate and toDate are required'
                    });
                }
                const summary = await this.invoiceModel.getGSTSummary(fromDate, toDate);
                res.json({
                    success: true,
                    data: summary,
                    period: {
                        from: fromDate,
                        to: toDate
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Get overdue invoices
        this.router.get('/reports/overdue', async (req, res, next) => {
            try {
                const overdueInvoices = await this.invoiceModel.getOverdueInvoices();
                res.json({
                    success: true,
                    data: overdueInvoices,
                    count: overdueInvoices.length
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Send reminder for specific invoice
        this.router.post('/:id/reminders', async (req, res, next) => {
            try {
                const { id } = req.params;
                const { type, recipientEmail } = req.body;
                if (!type || !['first', 'second', 'final', 'custom'].includes(type)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Valid reminder type is required (first, second, final, custom)'
                    });
                }
                const invoice = await this.invoiceModel.findById(id);
                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        error: 'Invoice not found'
                    });
                }
                const email = recipientEmail || invoice.customerAddress.email;
                if (!email) {
                    return res.status(400).json({
                        success: false,
                        error: 'Customer email address is required'
                    });
                }
                const result = await this.emailService.sendReminder(invoice, type, email);
                if (result.success) {
                    // Record the reminder
                    await this.invoiceModel.addReminder(id, {
                        sentAt: new Date().toISOString(),
                        type,
                        recipientEmail: email
                    });
                }
                res.json({
                    success: result.success,
                    message: result.success ? 'Reminder sent successfully' : 'Failed to send reminder',
                    error: result.error
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Batch send reminders
        this.router.post('/reminders/batch', async (req, res, next) => {
            try {
                const { type, invoiceIds } = req.body;
                if (!type || !['first', 'second', 'final'].includes(type)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Valid reminder type is required'
                    });
                }
                let invoices;
                if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
                    const allInvoices = await this.invoiceModel.list({}, { limit: 1000 });
                    invoices = allInvoices.data.filter(inv => invoiceIds.includes(inv.id));
                }
                else {
                    invoices = await this.invoiceModel.getOverdueInvoices();
                }
                const results = await this.emailService.sendBulkReminders(invoices, type);
                // Record reminders for successful sends
                for (const result of results) {
                    if (result.success) {
                        const invoice = invoices.find(inv => inv.id === result.invoiceId);
                        if (invoice) {
                            await this.invoiceModel.addReminder(result.invoiceId, {
                                sentAt: new Date().toISOString(),
                                type,
                                recipientEmail: invoice.customerAddress.email || ''
                            });
                        }
                    }
                }
                const successCount = results.filter(r => r.success).length;
                const failCount = results.filter(r => !r.success).length;
                res.json({
                    success: true,
                    message: `Sent ${successCount} reminders, ${failCount} failed`,
                    results
                });
            }
            catch (error) {
                next(error);
            }
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.InvoiceRoutes = InvoiceRoutes;
//# sourceMappingURL=invoice.routes.js.map