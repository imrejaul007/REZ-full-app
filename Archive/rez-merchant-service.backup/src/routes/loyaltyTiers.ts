// @ts-nocheck
import { Router, Request, Response } from 'express';
import { LoyaltyTier } from '../models/LoyaltyTier';
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
      LoyaltyTier.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      LoyaltyTier.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await LoyaltyTier.findOne({ _id: req.params.id, merchantId: req.merchantId }).lean();
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const LOYALTY_TIER_ALLOWED = ['name', 'description', 'minPoints', 'maxPoints', 'benefits', 'discountPercent', 'isActive', 'storeId', 'color', 'icon', 'multiplier', 'metadata'];
    const safe: Record<string, any> = {};
    for (const f of LOYALTY_TIER_ALLOWED) { if ((req.body as any)[f] !== undefined) safe[f] = (req.body as any)[f]; }
    const item = await LoyaltyTier.create({ ...safe, merchantId: req.merchantId });
    res.status(201).json({ success: true, data: item });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const LOYALTY_TIER_ALLOWED = ['name', 'description', 'minPoints', 'maxPoints', 'benefits', 'discountPercent', 'isActive', 'storeId', 'color', 'icon', 'multiplier', 'metadata'];
    const update: Record<string, any> = {};
    for (const f of LOYALTY_TIER_ALLOWED) { if ((req.body as any)[f] !== undefined) update[f] = (req.body as any)[f]; }
    const item = await LoyaltyTier.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: update }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: item });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await LoyaltyTier.findOneAndDelete({ _id: req.params.id, merchantId: req.merchantId });
    if (!item) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, message: 'Deleted' });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

// GET /loyalty-tiers/members
// NOTE: Customer loyalty membership data is owned by rez-backend (User model).
// This endpoint returns tiers with a stub memberCount (0) until the User model
// is migrated into merchant-service or an internal API is available.
router.get('/members', async (req: Request, res: Response) => {
  try {
    const { storeId, tierId } = req.query;
    const query: any = { merchantId: req.merchantId };
    if (storeId) query.storeId = storeId;
    const tiers = tierId
      ? await LoyaltyTier.find({ _id: tierId, merchantId: req.merchantId }).lean()
      : await LoyaltyTier.find(query).lean();
    res.json({ success: true, data: tiers.map((t: any) => ({ ...t, memberCount: 0 })) });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
