import { Router, Request, Response } from 'express';
import { socialCommerceService, ShopLink } from '../services/socialCommerceService';

const router = Router();

/**
 * GET /api/social/links
 * Generate shop links for Instagram/WhatsApp sharing
 */
router.get('/links', async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required'
      });
      return;
    }

    const shopLinks: ShopLink = await socialCommerceService.generateShopLink(storeId);

    res.json({
      success: true,
      data: shopLinks
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate shop links';
    console.error('[Social Routes] Error generating links:', message);

    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * GET /api/social/whatsapp-catalog
 * Generate WhatsApp catalog link with products
 */
router.get('/whatsapp-catalog', async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.query;

    if (!storeId || typeof storeId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'storeId is required'
      });
      return;
    }

    const catalogUrl = await socialCommerceService.createWhatsAppCatalog(storeId);

    // Generate full WhatsApp URL
    const store = await socialCommerceService.generateShopLink(storeId);
    const whatsappUrl = `${store.whatsapp}&text=${catalogUrl}`;

    res.json({
      success: true,
      data: {
        catalogUrl: decodeURIComponent(catalogUrl),
        whatsappUrl
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create WhatsApp catalog';
    console.error('[Social Routes] Error creating catalog:', message);

    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * GET /api/social/product/:productId/share
 * Generate shareable product link
 */
router.get('/product/:productId/share', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { source } = req.query;

    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'productId is required'
      });
      return;
    }

    const productLink = await socialCommerceService.createProductLink(productId);

    // Generate share URLs for different platforms
    const shareLinks = {
      direct: productLink,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out this product: ${productLink}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productLink)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productLink)}&text=${encodeURIComponent('Check out this product!')}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(productLink)}&text=${encodeURIComponent('Check out this product!')}`
    };

    // Track referral if source is provided
    if (source && typeof source === 'string') {
      await socialCommerceService.trackSocialReferral(source, productId, {
        referrer: req.headers.referer,
        userAgent: req.headers['user-agent']
      });
    }

    res.json({
      success: true,
      data: {
        productId,
        productLink,
        shareLinks
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate product link';
    console.error('[Social Routes] Error generating product link:', message);

    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * POST /api/social/track-referral
 * Track social media referral
 */
router.post('/track-referral', async (req: Request, res: Response): Promise<void> => {
  try {
    const { source, productId, metadata } = req.body;

    if (!source || typeof source !== 'string') {
      res.status(400).json({
        success: false,
        error: 'source is required'
      });
      return;
    }

    if (!productId || typeof productId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'productId is required'
      });
      return;
    }

    await socialCommerceService.trackSocialReferral(source, productId, {
      ...metadata,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Referral tracked successfully'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to track referral';
    console.error('[Social Routes] Error tracking referral:', message);

    res.status(500).json({
      success: false,
      error: message
    });
  }
});

export default router;
