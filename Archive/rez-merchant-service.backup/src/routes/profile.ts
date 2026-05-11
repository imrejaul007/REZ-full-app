import { Router, Request, Response } from 'express';
import { Merchant } from '../models/Merchant';
import { Store } from '../models/Store';
import { merchantAuth } from '../middleware/auth';

const router = Router();
router.use(merchantAuth);

// GET /profile/customer-view — how the merchant appears to customers
router.get('/customer-view', async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId)
      .select('businessName ownerName logo description tagline coverImage galleryImages brandColors contact socialMedia businessHours')
      .lean();
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    const stores = await Store.find({ merchantId: req.merchantId, isActive: true })
      .select('name logo location ratings offers category').lean();
    res.json({ success: true, data: { merchant, stores } });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /profile/visibility
router.get('/visibility', async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId).lean();
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({
      success: true,
      data: {
        isPubliclyVisible: (merchant as any).isPubliclyVisible ?? true,
        searchable: (merchant as any).searchable ?? true,
        acceptingOrders: (merchant as any).acceptingOrders ?? true,
        showInDirectory: (merchant as any).showInDirectory ?? true,
        showContact: (merchant as any).showContact ?? true,
        showRatings: (merchant as any).showRatings ?? true,
        showBusinessHours: (merchant as any).showBusinessHours ?? true,
        showPromotions: (merchant as any).showPromotions ?? true,
      },
    });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

const VISIBILITY_ALLOWED_FIELDS = [
  'isPubliclyVisible', 'searchable', 'acceptingOrders',
  'showInDirectory', 'showContact', 'showRatings',
  'showBusinessHours', 'showPromotions',
];

const CUSTOMER_SETTINGS_ALLOWED_FIELDS = [
  'allowReviews', 'showReviewCount', 'allowQA', 'defaultLanguage',
  'currencyDisplay', 'showStockLevel', 'allowWishlist',
  'notifyOnNewOrder', 'notifyOnReview', 'autoAcceptOrders',
];

function pickFields(body: Record<string, any>, allowed: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of allowed) { if (body[f] !== undefined) out[f] = body[f]; }
  return out;
}

// PUT /profile/visibility
router.put('/visibility', async (req: Request, res: Response) => {
  try {
    const update = pickFields(req.body, VISIBILITY_ALLOWED_FIELDS);
    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: update }, { new: true });
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({ success: true, message: 'Visibility updated' });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// PUT /profile/customer-settings
router.put('/customer-settings', async (req: Request, res: Response) => {
  try {
    const update = pickFields(req.body, CUSTOMER_SETTINGS_ALLOWED_FIELDS);
    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: update }, { new: true });
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    res.json({ success: true, message: 'Customer settings updated' });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// POST /profile/sync-to-customer-app
router.post('/sync-to-customer-app', async (req: Request, res: Response) => {
  try {
    // Update store data from merchant profile
    const merchant = await Merchant.findById(req.merchantId).lean();
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    await Store.updateMany(
      { merchantId: req.merchantId },
      { $set: { 'contact': merchant.contact, 'operationalInfo.hours': merchant.businessHours } },
    );
    res.json({ success: true, message: 'Profile synced to customer-facing stores' });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// GET /profile/customer-reviews — reviews left by customers (from store ratings)
router.get('/customer-reviews', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const ratingFilter = req.query.rating ? parseInt(req.query.rating as string) : undefined;

    const stores = await Store.find({ merchantId: req.merchantId })
      .select('ratings name')
      .lean();

    // Aggregate rating breakdown across all stores
    const totalReviews = stores.reduce((sum: number, s: any) => sum + (s.ratings?.count || 0), 0);
    const avgRating = stores.length > 0
      ? stores.reduce((sum: number, s: any) => sum + (s.ratings?.average || 0), 0) / stores.length
      : 0;

    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stores.forEach((s: any) => {
      if (s.ratings?.distribution) {
        [5, 4, 3, 2, 1].forEach((r) => {
          ratingBreakdown[r] = (ratingBreakdown[r] || 0) + (s.ratings.distribution[r] || 0);
        });
      }
    });

    // Reviews are currently sourced from store ratings; return stub reviews with metadata
    res.json({
      success: true,
      data: {
        reviews: [], // Individual review records would come from a dedicated Review model
        summary: {
          totalReviews,
          averageRating: Math.round(avgRating * 10) / 10,
          ratingBreakdown,
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalReviews / limit),
          totalItems: totalReviews,
          itemsPerPage: limit,
          hasNext: page * limit < totalReviews,
          hasPrevious: page > 1,
        },
      },
    });
  } catch (err: any) {
    const requestId = (req as any).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
