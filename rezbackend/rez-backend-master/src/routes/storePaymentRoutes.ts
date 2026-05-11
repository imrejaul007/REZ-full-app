// @ts-nocheck
import express from 'express';
import { EmailService } from '../services/EmailService';
import {
  getStorePaymentOffers,
  initiateStorePayment,
  confirmStorePayment,
  cancelStorePayment,
  getStorePaymentHistory,
  getStorePaymentById,
  updatePaymentSettings,
  getPaymentSettings,
  // New premium payment endpoints
  getCoinsForStore,
  getEnhancedPaymentMethods,
  autoOptimizeCoins,
  getStoreMembership,
  // Merchant stats
  getStorePaymentStats,
} from '../controllers/storePaymentController';
import {
  generateStoreQR,
  regenerateQR,
  getStoreQRDetails,
  toggleQRStatus,
  lookupStoreByQR,
  lookupStoreBySlug,
  setupTableQRCodes,
  getTableQRCodes,
} from '../controllers/qrController';
import { getInvoice, listInvoices } from '../controllers/gstInvoiceController';
import PDFDocument from 'pdfkit';
import { StorePayment } from '../models/StorePayment';
import { PosBill } from '../models/PosBill';
import {
  createBill,
  createQuickBill,
  getBillStatus,
  markBillPaid,
  listBills,
  cancelBill,
  refundBill,
} from '../controllers/posBillingController';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authMiddleware as merchantAuth } from '../middleware/merchantauth';
import { createRateLimiter } from '../middleware/rateLimiter';
import { qrCooldown, validateDistance, merchantScanAnomaly } from '../middleware/qrAbuseProtection';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = express.Router();

// Rate limiter for payment initiation (10 per minute per user)
const paymentInitLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many payment attempts. Please try again later.',
});

// Rate limiter for public QR code lookup (30 per minute per IP) — LOW-4
const qrLookupLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many QR lookups, please slow down',
});

/**
 * Store Payment Routes
 * Base path: /api/store-payment
 *
 * This module handles:
 * - QR code generation for stores (merchant)
 * - QR code lookup by customers
 * - Store payment processing
 * - Payment settings management
 */

// ==================== QR CODE ROUTES (MERCHANT) ====================

// Generate QR code for a store (merchant only)
router.post('/generate-qr/:storeId', merchantAuth, generateStoreQR);

// Regenerate QR code (invalidates old one) (merchant only)
router.post('/regenerate-qr/:storeId', merchantAuth, regenerateQR);

// Get store QR code details (merchant only)
router.get('/qr/:storeId', merchantAuth, getStoreQRDetails);

// Toggle QR code active status (merchant only)
router.patch('/qr/:storeId/toggle', merchantAuth, toggleQRStatus);

// ==================== PER-TABLE QR CODE ROUTES (MERCHANT) ====================

// Setup tables and generate per-table QR codes
router.post('/table-qr/:storeId/setup', merchantAuth, setupTableQRCodes);

// Get all tables and their QR codes
router.get('/table-qr/:storeId', merchantAuth, getTableQRCodes);

// ==================== QR CODE ROUTES (CUSTOMER) ====================

// Lookup store by QR code (customer - authenticated, with QR cooldown)
router.post('/lookup', authenticate, qrCooldown(), lookupStoreByQR);

// Lookup store by QR code (public - for initial scan)
router.get('/lookup/:qrCode', qrLookupLimiter, lookupStoreByQR);

// Lookup store by slug (for universal link / web menu scan — public)
router.get('/lookup-by-slug/:storeSlug', qrLookupLimiter, lookupStoreBySlug);

// ==================== PAYMENT SETTINGS ROUTES (MERCHANT) ====================

// Get payment settings for a store
router.get('/settings/:storeId', merchantAuth, getPaymentSettings);

// Update payment settings for a store
router.put('/settings/:storeId', merchantAuth, updatePaymentSettings);

// ==================== PREMIUM PAYMENT ROUTES (CUSTOMER) ====================

// Get all available coins for user at a specific store
router.get('/coins/:storeId', authenticate, getCoinsForStore);

// Get enhanced payment methods with bank-specific offers
router.get('/payment-methods/:storeId', authenticate, getEnhancedPaymentMethods);

// Auto-optimize coin allocation for maximum savings
router.post('/auto-optimize', authenticate, autoOptimizeCoins);

// Get user's membership tier for a store
router.get('/membership/:storeId', authenticate, getStoreMembership);

// ==================== OFFERS ROUTES (CUSTOMER) ====================

// Get offers for store payment
router.get('/offers/:storeId', authenticate, getStorePaymentOffers);

// ==================== PAYMENT ROUTES (CUSTOMER) ====================

// Initiate store payment (rate limited + QR abuse protection)
router.post(
  '/initiate',
  authenticate,
  paymentInitLimiter,
  idempotencyMiddleware(),
  qrCooldown(),
  validateDistance(5),
  merchantScanAnomaly(),
  initiateStorePayment,
);

// Confirm store payment
router.post('/confirm', authenticate, idempotencyMiddleware(), confirmStorePayment);

// Cancel store payment
router.post('/cancel', authenticate, idempotencyMiddleware(), cancelStorePayment);

// Get payment history for a user
router.get('/history', authenticate, getStorePaymentHistory);

// Get payment history for a specific store (merchant)
router.get('/history/:storeId', merchantAuth, getStorePaymentHistory);

// BUG FIX (P2-C3 — consumer POS visibility): Previously consumers who
// paid a POS bill had ZERO visibility into that transaction. The
// StorePayment history route only returns online payments, and PosBill
// lives in its own collection. This endpoint returns every POS bill
// whose `coinsCreditedUserId` matches the authenticated consumer — i.e.
// every POS purchase they were credited coins for.
router.get(
  '/history/pos',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Auth required' });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {
      coinsCreditedUserId: userId,
      status: { $in: ['paid', 'refunded', 'partial_refund'] },
    };

    const [bills, total] = await Promise.all([
      PosBill.find(filter)
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id billNumber storeId totalAmount paymentMethod status paidAt createdAt coinsEarned items')
        .populate('storeId', 'name logo location')
        .lean(),
      PosBill.countDocuments(filter),
    ]);

    // Shape each bill into the same transaction DTO the consumer wallet
    // already uses for online StorePayments, so the FE can render both
    // sources through the same component.
    const transactions = bills.map((b: any) => {
      const storeRef = b.storeId && typeof b.storeId === 'object' ? b.storeId : null;
      return {
        id: b._id,
        paymentId: b.billNumber || String(b._id),
        storeId: storeRef?._id || b.storeId,
        storeName: storeRef?.name || '',
        storeLogo: storeRef?.logo || undefined,
        amount: b.totalAmount || 0,
        coinsEarned: b.coinsEarned || 0,
        paymentMethod: b.paymentMethod || 'cash',
        status: b.status === 'paid' ? 'completed' : b.status,
        createdAt: b.createdAt,
        completedAt: b.paidAt || b.createdAt,
        source: 'pos' as const,
        items: Array.isArray(b.items)
          ? b.items.map((i: any) => ({ name: i.name, qty: i.quantity, price: i.price }))
          : [],
      };
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: skip + transactions.length < total,
          hasPrev: page > 1,
        },
      },
    });
  }),
);

// Get payment statistics for a store (merchant)
router.get('/stats/:storeId', merchantAuth, getStorePaymentStats);

// Get single payment details by paymentId
router.get('/details/:paymentId', authenticate, getStorePaymentById);

// ==================== GST INVOICE ROUTES ====================

// Get GST invoice for a payment
router.get('/:id/invoice', authenticate, getInvoice);

// List GST invoices (paginated)
router.get('/invoices', merchantAuth, listInvoices);

// ==================== POS BILLING ROUTES (MERCHANT) ====================

// Create a new POS bill (with optional line items)
router.post('/create-bill', merchantAuth, createBill);

// Create a quick bill (amount-only)
router.post('/quick-bill', merchantAuth, createQuickBill);

// List bills for a store — requires ?storeId query param
router.get('/bills', merchantAuth, listBills);

// Get status/details of a specific bill
router.get('/status/:billId', merchantAuth, getBillStatus);

// Mark a pending bill as paid
router.post('/mark-paid/:billId', merchantAuth, markBillPaid);

// Cancel a pending bill
router.post('/cancel/:billId', merchantAuth, cancelBill);

// Refund a paid bill (full or partial)
router.post('/refund/:billId', merchantAuth, refundBill);

// ==================== INVOICE ACTION STUBS ====================

// Generate PDF invoice for a payment
router.get('/:id/invoice/pdf', authenticate, async (req, res) => {
  try {
    const sp = await StorePayment.findById(req.params.id)
      .populate('userId', 'name phone')
      .populate('storeId', 'name address phone city state')
      .populate('merchantId', 'name gstNumber address phone')
      .lean();

    if (!sp) return res.status(404).json({ success: false, message: 'Payment not found' });

    // MED-5: ownership check — only the payment's owner may download the PDF
    const requestingUserId = (req as any).user?.id || (req as any).user?._id;
    const paymentOwner = (sp.userId as any)?._id ?? sp.userId;
    if (!requestingUserId || paymentOwner?.toString() !== requestingUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (sp.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Invoice only available for completed payments' });

    const merchant = (sp.merchantId as any) || {};
    const customer = (sp.userId as any) || {};
    const store = (sp.storeId as any) || {};
    const gst = sp.gstDetails || {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: 0,
      gstRate: 0,
      gstNumber: '',
      isGstBill: false,
    };
    const invoiceNo = sp.invoiceNumber || sp.billNumber || `INV-${sp._id?.toString().slice(-6).toUpperCase()}`;
    const invoiceDate = sp.invoiceDate ? new Date(sp.invoiceDate) : new Date();
    const subtotal = (sp.billAmount || 0) - (gst.totalGst || 0);
    const total = sp.totalAmount || sp.billAmount || 0;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoiceNo}.pdf"`);
    doc.pipe(res);

    // ── Header ───────────────────────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').text('REZ Platform', { align: 'center' });
    doc.moveDown(1);

    // ── Merchant / Invoice meta side-by-side ─────────────────────────────────
    const leftX = 40;
    const rightX = 320;
    const startY = doc.y;

    doc.font('Helvetica-Bold').fontSize(11).text('Seller', leftX, startY);
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(merchant.name || 'Merchant', leftX, doc.y + 2)
      .text(merchant.address || store.address || '', leftX)
      .text(`GSTIN: ${merchant.gstNumber || gst.gstNumber || 'N/A'}`, leftX)
      .text(`Phone: ${merchant.phone || store.phone || 'N/A'}`, leftX);

    const metaY = startY;
    doc.font('Helvetica-Bold').fontSize(11).text('Invoice Details', rightX, metaY);
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(`Invoice No: ${invoiceNo}`, rightX, doc.y + 2)
      .text(`Date: ${invoiceDate.toLocaleDateString('en-IN')}`, rightX)
      .text(`Bill No: ${sp.billNumber || '—'}`, rightX)
      .text(`Payment: ${sp.paymentMethod || '—'}`, rightX);

    doc.moveDown(2);

    // ── Customer ─────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(10).text('Billed To:');
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(customer.name || 'Customer')
      .text(`Phone: ${customer.phone || '—'}`);
    doc.moveDown(1);

    // ── Items table (stub — items are not stored per-line in StorePayment) ───
    const tableTop = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.rect(40, tableTop, 515, 18).fill('#f0f4ff').stroke();
    doc.fill('#111').text('Description', 45, tableTop + 4);
    doc.text('Amount (₹)', 460, tableTop + 4, { width: 90, align: 'right' });
    doc.moveDown(0.2);

    const rowY = tableTop + 22;
    doc
      .font('Helvetica')
      .fontSize(9)
      .text('Store Purchase', 45, rowY)
      .text(subtotal.toFixed(2), 460, rowY, { width: 90, align: 'right' });
    doc
      .moveTo(40, rowY + 14)
      .lineTo(555, rowY + 14)
      .stroke();
    doc.moveDown(2);

    // ── Tax summary ───────────────────────────────────────────────────────────
    const taxX = 380;
    let taxY = doc.y;
    const row = (label: string, value: string) => {
      doc.font('Helvetica').text(label, taxX, taxY).text(value, 480, taxY, { width: 75, align: 'right' });
      taxY += 14;
    };

    row('Subtotal:', `₹${subtotal.toFixed(2)}`);
    if (gst.isGstBill) {
      if (gst.igst > 0) {
        row(`IGST (${gst.gstRate}%):`, `₹${gst.igst.toFixed(2)}`);
      } else {
        row(`CGST (${(gst.gstRate / 2).toFixed(1)}%):`, `₹${gst.cgst.toFixed(2)}`);
        row(`SGST (${(gst.gstRate / 2).toFixed(1)}%):`, `₹${gst.sgst.toFixed(2)}`);
      }
    }
    doc.moveTo(taxX, taxY).lineTo(555, taxY).stroke();
    taxY += 4;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Total:', taxX, taxY)
      .text(`₹${total.toFixed(2)}`, 480, taxY, { width: 75, align: 'right' });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.moveDown(3);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#6b7280')
      .text('This is a computer-generated invoice. No signature required.', { align: 'center' })
      .text('Thank you for your business!', { align: 'center' });

    doc.end();
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
});

// Send invoice via email
router.post('/:id/invoice/send-email', authenticate, async (req, res) => {
  try {
    const sp = await StorePayment.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('storeId', 'name address phone city state')
      .populate('merchantId', 'name gstNumber address phone')
      .lean();

    if (!sp) return res.status(404).json({ success: false, message: 'Payment not found' });

    // MED-6: ownership check — only the payment's owner may request the email
    const requestingUserId = (req as any).user?.id || (req as any).user?._id;
    const paymentOwner = (sp.userId as any)?._id ?? sp.userId;
    if (!requestingUserId || paymentOwner?.toString() !== requestingUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (sp.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Invoice only available for completed payments' });

    const customer = (sp.userId as any) || {};
    const store = (sp.storeId as any) || {};
    const merchant = (sp.merchantId as any) || {};
    const toEmail: string = req.body.email || customer.email;

    // MED-6: prevent sending invoice to an arbitrary email address
    const authUser = (req as any).user;
    if (req.body.email && authUser?.email && req.body.email !== authUser.email) {
      return res.status(403).json({ success: false, message: 'Cannot send invoice to a different email address' });
    }

    if (!toEmail) {
      return res.status(400).json({ success: false, message: 'No email address available for this customer' });
    }

    const invoiceNo = sp.invoiceNumber || sp.billNumber || `INV-${sp._id?.toString().slice(-6).toUpperCase()}`;
    const invoiceDate = sp.invoiceDate
      ? new Date(sp.invoiceDate).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN');
    const total = sp.totalAmount || sp.billAmount || 0;

    await EmailService.send({
      to: toEmail,
      subject: `Invoice ${invoiceNo} from ${store.name || merchant.name || 'REZ'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#111;margin-bottom:4px;">Tax Invoice</h2>
          <p style="color:#6b7280;margin-top:0;">Invoice No: <strong>${invoiceNo}</strong> &nbsp;|&nbsp; Date: ${invoiceDate}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
          <p><strong>Store:</strong> ${store.name || merchant.name || '—'}</p>
          <p><strong>Customer:</strong> ${customer.name || '—'}</p>
          <p><strong>Payment Method:</strong> ${sp.paymentMethod || '—'}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
          <p style="font-size:18px;font-weight:bold;">Total: ₹${total.toFixed(2)}</p>
          <p style="color:#6b7280;font-size:12px;margin-top:24px;">
            Download the full PDF invoice from the REZ app.<br>
            This is a computer-generated email. No signature required.
          </p>
        </div>
      `,
    });

    return res.json({ success: true, message: `Invoice sent to ${toEmail}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Send invoice via WhatsApp
router.post('/:id/invoice/send-whatsapp', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'WhatsApp invoice sending is not yet implemented',
  });
});

// ─── GET /api/store-payment/status/:paymentId ─────────────────────────────────
// Public status check for UPI polling after intent launch.
// Returns status without requiring auth — the paymentId is the secret.
router.get('/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  const payment = await StorePayment.findOne({ paymentId })
    .select('paymentId status transactionId completedAt failedAt cancelledAt createdAt')
    .lean();

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  return res.json({
    success: true,
    data: {
      paymentId: payment.paymentId,
      status: payment.status,
      transactionId: payment.transactionId || null,
      completedAt: payment.completedAt?.toISOString() || null,
      failedAt: (payment as any).failedAt?.toISOString() || null,
      cancelledAt: (payment as any).cancelledAt?.toISOString() || null,
      createdAt: payment.createdAt.toISOString(),
    },
  });
});

export default router;
