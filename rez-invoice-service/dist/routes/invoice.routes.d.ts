import { Router } from 'express';
import { InvoiceModel } from '../models/Invoice';
export declare class InvoiceRoutes {
    private router;
    private invoiceModel;
    private pdfService;
    private emailService;
    constructor(invoiceModel: InvoiceModel);
    private validationError;
    private setupRoutes;
    getRouter(): Router;
}
//# sourceMappingURL=invoice.routes.d.ts.map