// @ts-nocheck
import { Router } from 'express';
import {
  getBankOffers,
  getBankOfferById,
  getExclusiveOffers,
  getExclusiveOfferById,
} from '../controllers/offersController';
// BR-M3 FIX: Wire offersPageController handlers that were previously orphaned
// (no route file imported this controller). All handlers are now registered below
// under the /api/offers prefix (this router is mounted at ${API_PREFIX}/offers in routes.ts).
import {
  getHotspots,
  getHotspotOffers,
  getBOGOOffers,
  getSaleOffers,
  getFreeDeliveryOffers,
  getBankOffers as getBankOffersPage,
  getExclusiveZones,
  getExclusiveZoneOffers,
  getSpecialProfiles,
  getSpecialProfileOffers,
  getFriendsRedeemed,
  getDiscountBuckets,
  getFlashSaleOffers,
  getAggregatedOffersPageData,
} from '../controllers/offersPageController';
import { optionalAuth } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validation';
import { Joi } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cacheMiddleware';
import { CacheTTL } from '../config/redis';

const router = Router();

// Bank Offers Routes
router.get(
  '/bank',
  optionalAuth,
  validateQuery(
    Joi.object({
      category: Joi.string(),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  ),
  cacheMiddleware({ ttl: CacheTTL.OFFER_LIST, keyPrefix: 'offers:bank', condition: () => true }),
  getBankOffers,
);

router.get(
  '/bank/:id',
  optionalAuth,
  validateParams(
    Joi.object({
      id: Joi.string().required(),
    }),
  ),
  cacheMiddleware({ ttl: CacheTTL.OFFER_LIST, keyPrefix: 'offers:bankdetail', condition: () => true }),
  getBankOfferById,
);

// Exclusive Offers Routes
router.get(
  '/exclusive',
  optionalAuth,
  validateQuery(
    Joi.object({
      category: Joi.string(),
      targetAudience: Joi.string().valid('student', 'women', 'senior', 'corporate', 'birthday', 'first', 'all'),
    }),
  ),
  cacheMiddleware({ ttl: CacheTTL.OFFER_LIST, keyPrefix: 'offers:exclusive', condition: () => true }),
  getExclusiveOffers,
);

router.get(
  '/exclusive/:id',
  optionalAuth,
  validateParams(
    Joi.object({
      id: Joi.string().required(),
    }),
  ),
  cacheMiddleware({ ttl: CacheTTL.OFFER_LIST, keyPrefix: 'offers:exclusivedetail', condition: () => true }),
  getExclusiveOfferById,
);

// ── BR-M3: Offers Page Controller routes (previously orphaned) ────────────────

// GET /api/offers/page-data-v2 — aggregated page data (replaces ~21 parallel calls)
router.get('/page-data-v2', optionalAuth, getAggregatedOffersPageData);

// GET /api/offers/hotspots — geo-sorted hotspot areas
router.get('/hotspots', optionalAuth, getHotspots);

// GET /api/offers/hotspots/:slug/offers — offers within a hotspot area
router.get('/hotspots/:slug/offers', optionalAuth, getHotspotOffers);

// GET /api/offers/bogo — Buy One Get One offers
router.get('/bogo', optionalAuth, getBOGOOffers);

// GET /api/offers/sales-clearance — sale and clearance offers
router.get('/sales-clearance', optionalAuth, getSaleOffers);

// GET /api/offers/free-delivery — free delivery offers
router.get('/free-delivery', optionalAuth, getFreeDeliveryOffers);

// GET /api/offers/bank-offers — bank/wallet offers (paginated, from offersPageController)
// Note: /bank (above) serves the offersController version; /bank-offers serves the
// offersPageController version which includes sort and cardType query params.
router.get('/bank-offers', optionalAuth, getBankOffersPage);

// GET /api/offers/exclusive-zones — exclusive zone categories with user eligibility
router.get('/exclusive-zones', optionalAuth, getExclusiveZones);

// GET /api/offers/exclusive-zones/:slug/offers — offers for a specific exclusive zone
router.get('/exclusive-zones/:slug/offers', optionalAuth, getExclusiveZoneOffers);

// GET /api/offers/special-profiles — special profile categories (Defence, Healthcare, etc.)
router.get('/special-profiles', optionalAuth, getSpecialProfiles);

// GET /api/offers/special-profiles/:slug/offers — offers for a specific special profile
router.get('/special-profiles/:slug/offers', optionalAuth, getSpecialProfileOffers);

// GET /api/offers/friends-redeemed — offers redeemed by user's friends
router.get('/friends-redeemed', optionalAuth, getFriendsRedeemed);

// GET /api/offers/discount-buckets — real-time aggregation by discount range
router.get('/discount-buckets', optionalAuth, getDiscountBuckets);

// GET /api/offers/flash-sales — active flash sale offers
router.get('/flash-sales', optionalAuth, getFlashSaleOffers);

export default router;
