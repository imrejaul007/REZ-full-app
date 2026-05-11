// @ts-nocheck
import { Router, Request, Response } from 'express';
import { BizDoc } from '../models/BizDoc';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

const BIZDOC_ALLOWED_FIELDS = [
  'title', 'type', 'fileUrl', 'fileName', 'description',
  'category', 'tags', 'expiryDate', 'status', 'notes', 'metadata',
];

function pickBizDocFields(body: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  for (const field of BIZDOC_ALLOWED_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }
  return filtered;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const docs = await BizDoc.find({ merchantId: req.merchantId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: docs });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const doc = await BizDoc.create({ ...pickBizDocFields(req.body), merchantId: req.merchantId });
    res.status(201).json({ success: true, data: doc });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = pickBizDocFields(req.body);
    allowedFields.updatedAt = new Date();
    const doc = await BizDoc.findOneAndUpdate({ _id: req.params.id, merchantId: req.merchantId }, { $set: allowedFields }, { new: true });
    if (!doc) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: doc });
  } catch (e: any) { const message = process.env.NODE_ENV === "production" ? "An error occurred" : e.message; res.status(500).json({ success: false, message }); }
});

export default router;
