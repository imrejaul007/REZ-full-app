// @ts-nocheck
import { Router, Request, Response } from 'express';
import { GiftCard } from '../models/GiftCard';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const query: any = { merchantId: req.merchantId };
    if (req.query.storeId) query.storeId = req.query.storeId;
    if (req.query.status) query.status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const [items, total] = await Promise.all([
      GiftCard.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      GiftCard.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await GiftCard.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, initialBalance, expiresAt, recipientEmail, recipientName, message } = req.body;
    if (!initialBalance || typeof initialBalance !== 'number' || initialBalance <= 0) {
      res.status(400).json({ success: false, message: 'initialBalance must be a positive number' });
      return;
    }
    // Explicit whitelist — prevents injecting status:'redeemed' or arbitrary balance
    const item = await GiftCard.create({
      merchantId: req.merchantId,
      code: code || undefined, // model can auto-generate if absent
      initialBalance,
      balance: initialBalance,
      status: 'active',
      expiresAt: expiresAt || undefined,
      recipientEmail: recipientEmail || undefined,
      recipientName: recipientName || undefined,
      message: message || undefined,
    });
    res.status(201).json({ success: true, data: item });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const GIFT_CARD_ALLOWED_FIELDS = ['expiresAt', 'recipientEmail', 'recipientName', 'message', 'status'];
    const safeUpdate: Record<string, any> = {};
    for (const f of GIFT_CARD_ALLOWED_FIELDS) { if ((req.body as any)[f] !== undefined) safeUpdate[f] = (req.body as any)[f]; }
    const item = await GiftCard.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: safeUpdate }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await GiftCard.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
