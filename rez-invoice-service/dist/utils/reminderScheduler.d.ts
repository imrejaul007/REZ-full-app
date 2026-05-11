import { InvoiceModel } from '../models/Invoice';
export declare class ReminderScheduler {
    private cronJob;
    private invoiceModel;
    private emailService;
    private logger;
    constructor(invoiceModel: InvoiceModel);
    start(): void;
    stop(): void;
    runReminders(): Promise<void>;
    triggerNow(): Promise<void>;
}
//# sourceMappingURL=reminderScheduler.d.ts.map