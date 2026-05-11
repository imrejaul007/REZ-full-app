// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Supplier } from '../models/Supplier';
import { Product } from '../models/Product';
import { merchantAuth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();
router.use(merchantAuth);

// GET /suppliers
router.get('/', async (req: Request, res: Response) => {
  try {
    const query: any = { merchantId: req.merchantId, isDeleted: { $ne: true } };
    if (req.query.search) {
      const s = (req.query.search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ name: { $regex: s, $options: 'i' } }, { email: { $regex: s, $options: 'i' } }];
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const [items, total] = await Promise.all([
      Supplier.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Supplier.countDocuments(query),
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

// GET /suppliers/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Supplier.findOne({ _id: req.params.id, merchantId: req.merchantId, isDeleted: { $ne: true } }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Supplier not found' }); return; }
    res.json({ success: true, data: item });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /suppliers
router.post('/', async (req: Request, res: Response) => {
  try {
    // SEC-004 FIX: Allowlist fields to prevent mass assignment
    const SUPPLIER_ALLOWED = ['name', 'email', 'phone', 'address', 'category', 'notes'];
    const safe: Record<string, any> = {};
    for (const f of SUPPLIER_ALLOWED) {
      if ((req.body as any)[f] !== undefined) safe[f] = (req.body as any)[f];
    }
    const supplier = await Supplier.create({ ...safe, merchantId: req.merchantId });
    res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /suppliers/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const SUPPLIER_ALLOWED = ['name', 'email', 'phone', 'address', 'category', 'notes'];
    const safeUpdate: Record<string, any> = {};
    for (const f of SUPPLIER_ALLOWED) {
      if ((req.body as any)[f] !== undefined) safeUpdate[f] = (req.body as any)[f];
    }
    const item = await Supplier.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId, isDeleted: { $ne: true } },
      { $set: safeUpdate },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Updated', data: item });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// DELETE /suppliers/:id (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await Supplier.findOneAndUpdate(
      { _id: req.params.id, merchantId: req.merchantId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true },
    );
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /suppliers/:id/products
router.get('/:id/products', async (req: Request, res: Response) => {
  try {
    // SEC-006 FIX: Verify supplier belongs to this merchant before returning products
    const supplier = await Supplier.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id as string),
      merchantId: req.merchantId,
    }).lean();
    if (!supplier) {
      res.status(404).json({ success: false, message: 'Supplier not found or access denied' });
      return;
    }
    const products = await Product.find({ supplier: new mongoose.Types.ObjectId(req.params.id as string), merchant: req.merchantId, isDeleted: { $ne: true } }).lean();
    res.json({ success: true, data: products });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
