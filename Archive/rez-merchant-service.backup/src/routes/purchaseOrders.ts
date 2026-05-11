// @ts-nocheck
import { Router, Request, Response } from 'express';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// GET /purchase-orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: any = { merchantId: req.merchantId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.supplierId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.supplierId as string)) {
        res.status(400).json({ success: false, message: 'Invalid supplierId' }); return;
      }
      query.supplier = new mongoose.Types.ObjectId(req.query.supplierId as string);
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total] = await Promise.all([
      PurchaseOrder.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PurchaseOrder.countDocuments(query),
    ]);

    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /purchase-orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!po) { res.status(404).json({ success: false, message: 'Purchase order not found' }); return; }
    res.json({ success: true, data: po });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

const PO_ALLOWED_FIELDS = [
  'supplier', 'items', 'notes', 'expectedDeliveryDate',
  'shippingAddress', 'paymentTerms', 'reference',
];

// POST /purchase-orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const poNumber = `PO-${Date.now()}`;
    const safe: Record<string, any> = {};
    for (const f of PO_ALLOWED_FIELDS) { if ((req.body as any)[f] !== undefined) safe[f] = (req.body as any)[f]; }
    const po = await PurchaseOrder.create({ ...safe, merchantId: req.merchantId, poNumber, status: 'draft' });
    res.status(201).json({ success: true, message: 'Purchase order created', data: po });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /purchase-orders/:id — only allowed on draft orders, field-whitelisted
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const existing = await PurchaseOrder.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean() as any;
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (existing.status !== 'draft') {
      res.status(400).json({ success: false, message: 'Only draft purchase orders can be edited' }); return;
    }
    const safeUpdate: Record<string, any> = {};
    for (const f of PO_ALLOWED_FIELDS) { if ((req.body as any)[f] !== undefined) safeUpdate[f] = (req.body as any)[f]; }
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: safeUpdate },
      { new: true },
    );
    res.json({ success: true, message: 'Updated', data: po });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PATCH /purchase-orders/:id/receive
router.patch('/:id/receive', async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { status: 'received', receivedAt: new Date(), receivedItems: req.body.items } },
      { new: true },
    );
    if (!po) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Goods received', data: po });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PATCH /purchase-orders/:id/cancel
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const po = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { status: 'cancelled', cancelledAt: new Date(), cancelReason: req.body.reason } },
      { new: true },
    );
    if (!po) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Cancelled', data: po });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
