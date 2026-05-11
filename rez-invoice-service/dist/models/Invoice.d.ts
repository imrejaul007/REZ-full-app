import { Invoice, InvoiceStatus, ReminderRecord, CreateInvoiceInput, UpdateInvoiceInput, RecordPaymentInput, InvoiceFilters, PaginationParams, PaginatedResult, InvoiceStats, GSTSummary } from '../types';
import { Database } from '../db/database';
export declare class InvoiceModel {
    private db;
    constructor(db: Database);
    private numberToWords;
    private calculateTaxes;
    private generateInvoiceNumber;
    private processLineItems;
    create(input: CreateInvoiceInput): Promise<Invoice>;
    private parseAddress;
    private calculateDueDate;
    findById(id: string): Promise<Invoice | null>;
    findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null>;
    update(id: string, input: UpdateInvoiceInput): Promise<Invoice | null>;
    delete(id: string): Promise<boolean>;
    list(filters?: InvoiceFilters, pagination?: PaginationParams): Promise<PaginatedResult<Invoice>>;
    updateStatus(id: string, status: InvoiceStatus): Promise<Invoice | null>;
    recordPayment(id: string, payment: RecordPaymentInput): Promise<Invoice | null>;
    addReminder(id: string, reminder: Omit<ReminderRecord, 'id'>): Promise<Invoice | null>;
    getStats(filters?: InvoiceFilters): Promise<InvoiceStats>;
    getGSTSummary(fromDate: string, toDate: string): Promise<GSTSummary>;
    getOverdueInvoices(): Promise<Invoice[]>;
}
//# sourceMappingURL=Invoice.d.ts.map