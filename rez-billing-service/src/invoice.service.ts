import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import Handlebars from 'handlebars';
import Decimal from 'decimal.js';
import { Invoice, BillingRecord, IInvoice, InvoiceItem, InvoiceStatus, BillingModel } from './models';
import { walletService } from './wallet.service';
import { logger } from './config/logger';
import { notificationService } from './notification.service';

export interface CreateInvoiceInput {
  merchantId: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  items: InvoiceItem[];
  taxRate?: number;
  dueInDays?: number;
}

export interface InvoiceResult {
  success: boolean;
  invoice?: IInvoice;
  invoiceNumber?: string;
  error?: string;
}

class InvoiceService {
  private invoiceNumberCounter: number = 0;
  private lastInvoiceDate: string = '';

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    if (dateStr !== this.lastInvoiceDate) {
      this.lastInvoiceDate = dateStr;
      this.invoiceNumberCounter = 0;
    }

    this.invoiceNumberCounter++;
    return `INV-${dateStr}-${String(this.invoiceNumberCounter).padStart(4, '0')}`;
  }

  /**
   * Generate invoice from billing records
   */
  async generateInvoiceFromBilling(input: CreateInvoiceInput): Promise<InvoiceResult> {
    try {
      const invoiceNumber = this.generateInvoiceNumber();
      const taxRate = input.taxRate || 0;
      const dueInDays = input.dueInDays || 30;

      // Calculate subtotal
      let subtotal = new Decimal(0);
      for (const item of input.items) {
        subtotal = subtotal.plus(item.amount);
      }

      // Calculate tax
      const tax = subtotal.times(taxRate / 100);
      const total = subtotal.plus(tax);

      // Set due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);

      const invoice = new Invoice({
        invoiceNumber,
        merchantId: input.merchantId,
        billingPeriod: input.billingPeriod,
        items: input.items,
        subtotal: subtotal.toNumber(),
        tax: tax.toNumber(),
        total: total.toNumber(),
        currency: 'USD',
        status: InvoiceStatus.PENDING,
        dueDate
      });

      await invoice.save();

      logger.info(`Generated invoice ${invoiceNumber} for merchant ${input.merchantId}: ${total.toNumber()} USD`);

      // Send notification
      await notificationService.sendInvoiceGenerated(invoice);

      return {
        success: true,
        invoice,
        invoiceNumber
      };
    } catch (error) {
      logger.error('Error generating invoice:', error);
      return { success: false, error: 'Internal error generating invoice' };
    }
  }

  /**
   * Generate invoices for all merchants with billing activity in a period
   */
  async generateInvoicesForPeriod(startDate: Date, endDate: Date): Promise<number> {
    // Get all merchants with billing activity in this period
    const billingRecords = await BillingRecord.aggregate([
      {
        $match: {
          startDate: { $gte: startDate },
          endDate: { $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$merchantId',
          totalAmount: { $sum: '$totalAmount' },
          eventCount: { $sum: '$eventCount' },
          campaigns: { $addToSet: '$campaignId' }
        }
      }
    ]);

    let generatedCount = 0;

    for (const record of billingRecords) {
      // Get billing records for items
      const billingRecordsForMerchant = await BillingRecord.find({
        merchantId: record._id,
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
        status: 'completed'
      });

      // Group by billing model for line items
      const itemsByModel: Record<BillingModel, { count: number; amount: number }> = {
        [BillingModel.CPC]: { count: 0, amount: 0 },
        [BillingModel.CPA]: { count: 0, amount: 0 },
        [BillingModel.CPM]: { count: 0, amount: 0 }
      };

      for (const br of billingRecordsForMerchant) {
        itemsByModel[br.billingModel].count += br.eventCount;
        itemsByModel[br.billingModel].amount = new Decimal(itemsByModel[br.billingModel].amount)
          .plus(br.totalAmount).toNumber();
      }

      const items: InvoiceItem[] = Object.entries(itemsByModel)
        .filter(([_, data]) => data.count > 0)
        .map(([model, data]) => ({
          description: `${model} Advertising - ${record.campaigns.length} campaign(s)`,
          quantity: data.count,
          unitPrice: new Decimal(data.amount).dividedBy(data.count).toNumber(),
          amount: data.amount,
          billingModel: model as BillingModel
        }));

      const result = await this.generateInvoiceFromBilling({
        merchantId: record._id,
        billingPeriod: { start: startDate, end: endDate },
        items
      });

      if (result.success) {
        generatedCount++;
      }
    }

    logger.info(`Generated ${generatedCount} invoices for period ${startDate.toISOString()} to ${endDate.toISOString()}`);

    return generatedCount;
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceNumber });
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string): Promise<IInvoice | null> {
    return Invoice.findById(invoiceId);
  }

  /**
   * Get invoices for a merchant
   */
  async getMerchantInvoices(
    merchantId: string,
    options: { page?: number; limit?: number; status?: InvoiceStatus }
  ): Promise<{ invoices: IInvoice[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { merchantId };
    if (options.status) query.status = options.status;

    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(query)
    ]);

    return {
      invoices,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, paymentReference?: string): Promise<InvoiceResult> {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === InvoiceStatus.PAID) {
        return { success: false, error: 'Invoice already paid' };
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        return { success: false, error: 'Cannot pay cancelled invoice' };
      }

      // Process payment (deduct from wallet)
      const payment = await walletService.deduct(
        invoice.merchantId,
        invoice.total,
        paymentReference || `PAYMENT:${invoice.invoiceNumber}`,
        `Invoice payment: ${invoice.invoiceNumber}`
      );

      if (!payment.success) {
        return { success: false, error: payment.error };
      }

      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();
      await invoice.save();

      logger.info(`Invoice ${invoice.invoiceNumber} marked as paid`);

      // Send notification
      await notificationService.sendInvoicePaid(invoice);

      return {
        success: true,
        invoice,
        invoiceNumber: invoice.invoiceNumber
      };
    } catch (error) {
      logger.error('Error marking invoice as paid:', error);
      return { success: false, error: 'Internal error processing payment' };
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string, reason?: string): Promise<InvoiceResult> {
    try {
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      if (invoice.status === InvoiceStatus.PAID) {
        return { success: false, error: 'Cannot cancel paid invoice' };
      }

      invoice.status = InvoiceStatus.CANCELLED;
      await invoice.save();

      logger.info(`Invoice ${invoice.invoiceNumber} cancelled: ${reason || 'No reason provided'}`);

      return {
        success: true,
        invoice,
        invoiceNumber: invoice.invoiceNumber
      };
    } catch (error) {
      logger.error('Error cancelling invoice:', error);
      return { success: false, error: 'Internal error cancelling invoice' };
    }
  }

  /**
   * Update overdue invoices
   */
  async updateOverdueInvoices(): Promise<number> {
    const now = new Date();

    const result = await Invoice.updateMany(
      {
        status: InvoiceStatus.PENDING,
        dueDate: { $lt: now }
      },
      {
        $set: { status: InvoiceStatus.OVERDUE }
      }
    );

    if (result.modifiedCount > 0) {
      logger.warn(`Marked ${result.modifiedCount} invoices as overdue`);

      // Send overdue notifications
      const overdueInvoices = await Invoice.find({
        status: InvoiceStatus.OVERDUE,
        dueDate: { $lt: now }
      });

      for (const invoice of overdueInvoices) {
        await notificationService.sendInvoiceOverdue(invoice);
      }
    }

    return result.modifiedCount;
  }

  /**
   * Generate PDF for invoice
   */
  async generatePDF(invoiceId: string): Promise<Buffer | null> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return null;
    }

    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Invoice details
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${invoice.createdAt.toLocaleDateString()}`);
      doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
      doc.text(`Status: ${invoice.status}`);
      doc.moveDown();

      // Bill To
      doc.text('Bill To:');
      doc.text(`Merchant ID: ${invoice.merchantId}`);
      doc.moveDown();

      // Billing period
      doc.text('Billing Period:');
      doc.text(`From: ${invoice.billingPeriod.start.toLocaleDateString()}`);
      doc.text(`To: ${invoice.billingPeriod.end.toLocaleDateString()}`);
      doc.moveDown();

      // Items table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 320;
      const col4 = 400;
      const col5 = 480;

      doc.font('Helvetica-Bold');
      doc.text('Description', col1, tableTop);
      doc.text('Qty', col2, tableTop);
      doc.text('Unit Price', col3, tableTop);
      doc.text('Amount', col4, tableTop);
      doc.text('Model', col5, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
      doc.font('Helvetica');

      let y = tableTop + 25;
      for (const item of invoice.items) {
        doc.text(item.description.substring(0, 30), col1, y);
        doc.text(item.quantity.toString(), col2, y);
        doc.text(`$${item.unitPrice.toFixed(2)}`, col3, y);
        doc.text(`$${item.amount.toFixed(2)}`, col4, y);
        doc.text(item.billingModel, col5, y);
        y += 20;
      }

      // Totals
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      doc.text('Subtotal:', 400, y);
      doc.text(`$${invoice.subtotal.toFixed(2)}`, 480, y);
      y += 15;

      if (invoice.tax > 0) {
        doc.text('Tax:', 400, y);
        doc.text(`$${invoice.tax.toFixed(2)}`, 480, y);
        y += 15;
      }

      doc.font('Helvetica-Bold');
      doc.text('Total:', 400, y);
      doc.text(`$${invoice.total.toFixed(2)}`, 480, y);

      doc.end();
    });
  }

  /**
   * Get invoice statistics
   */
  async getInvoiceStats(merchantId: string, startDate: Date, endDate: Date): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    byStatus: Record<string, number>;
  }> {
    const invoices = await Invoice.find({
      merchantId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalAmount = new Decimal(0);
    let paidAmount = new Decimal(0);
    let pendingAmount = new Decimal(0);
    let overdueAmount = new Decimal(0);
    const byStatus: Record<string, number> = {};

    for (const invoice of invoices) {
      totalAmount = totalAmount.plus(invoice.total);
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;

      switch (invoice.status) {
        case InvoiceStatus.PAID:
          paidAmount = paidAmount.plus(invoice.total);
          break;
        case InvoiceStatus.PENDING:
          pendingAmount = pendingAmount.plus(invoice.total);
          break;
        case InvoiceStatus.OVERDUE:
          overdueAmount = overdueAmount.plus(invoice.total);
          break;
      }
    }

    return {
      totalInvoices: invoices.length,
      totalAmount: totalAmount.toNumber(),
      paidAmount: paidAmount.toNumber(),
      pendingAmount: pendingAmount.toNumber(),
      overdueAmount: overdueAmount.toNumber(),
      byStatus
    };
  }
}

export const invoiceService = new InvoiceService();
