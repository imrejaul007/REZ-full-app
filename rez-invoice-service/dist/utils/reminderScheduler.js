"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderScheduler = void 0;
const cron = __importStar(require("node-cron"));
const emailService_1 = require("../services/emailService");
const logger_1 = require("../utils/logger");
class ReminderScheduler {
    cronJob = null;
    invoiceModel;
    emailService;
    logger;
    constructor(invoiceModel) {
        this.invoiceModel = invoiceModel;
        this.emailService = new emailService_1.EmailService();
        this.logger = new logger_1.Logger();
    }
    start() {
        if (this.cronJob) {
            this.logger.warn('Reminder scheduler is already running');
            return;
        }
        // Default: Run every day at 9 AM
        const schedule = process.env.REMINDER_SCHEDULE || '0 9 * * *';
        if (!cron.validate(schedule)) {
            this.logger.error('Invalid cron schedule', { schedule });
            return;
        }
        this.cronJob = cron.schedule(schedule, async () => {
            await this.runReminders();
        });
        this.logger.info('Reminder scheduler started', { schedule });
    }
    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            this.logger.info('Reminder scheduler stopped');
        }
    }
    async runReminders() {
        this.logger.info('Starting reminder job');
        try {
            const overdueInvoices = await this.invoiceModel.getOverdueInvoices();
            this.logger.info(`Found ${overdueInvoices.length} overdue invoices`);
            const firstReminderDays = parseInt(process.env.FIRST_REMINDER_DAYS || '7');
            const secondReminderDays = parseInt(process.env.SECOND_REMINDER_DAYS || '14');
            const finalReminderDays = parseInt(process.env.FINAL_REMINDER_DAYS || '21');
            const today = new Date();
            for (const invoice of overdueInvoices) {
                if (!invoice.customerAddress.email) {
                    this.logger.warn('No customer email for invoice', { invoiceId: invoice.id });
                    continue;
                }
                const dueDate = new Date(invoice.dueDate);
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                // Check last reminder sent
                const lastReminder = invoice.reminders[invoice.reminders.length - 1];
                const daysSinceLastReminder = lastReminder
                    ? Math.floor((today.getTime() - new Date(lastReminder.sentAt).getTime()) / (1000 * 60 * 60 * 24))
                    : Infinity;
                let reminderType = null;
                if (daysOverdue >= finalReminderDays) {
                    reminderType = 'final';
                }
                else if (daysOverdue >= secondReminderDays && daysSinceLastReminder >= (secondReminderDays - firstReminderDays)) {
                    reminderType = 'second';
                }
                else if (daysOverdue >= firstReminderDays && daysSinceLastReminder >= firstReminderDays) {
                    reminderType = 'first';
                }
                if (reminderType) {
                    try {
                        const result = await this.emailService.sendReminder(invoice, reminderType, invoice.customerAddress.email);
                        if (result.success) {
                            await this.invoiceModel.addReminder(invoice.id, {
                                sentAt: today.toISOString(),
                                type: reminderType,
                                recipientEmail: invoice.customerAddress.email
                            });
                            this.logger.info(`Sent ${reminderType} reminder`, {
                                invoiceId: invoice.id,
                                invoiceNumber: invoice.invoiceNumber,
                                recipient: invoice.customerAddress.email
                            });
                        }
                        else {
                            this.logger.error(`Failed to send reminder`, {
                                invoiceId: invoice.id,
                                error: result.error
                            });
                        }
                    }
                    catch (error) {
                        this.logger.error(`Error sending reminder`, {
                            invoiceId: invoice.id,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }
            }
            this.logger.info('Reminder job completed');
        }
        catch (error) {
            this.logger.error('Reminder job failed', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Manual trigger for testing
    async triggerNow() {
        await this.runReminders();
    }
}
exports.ReminderScheduler = ReminderScheduler;
//# sourceMappingURL=reminderScheduler.js.map