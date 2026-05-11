import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import Campaign from '../models/Campaign';
import DealRedemption from '../models/DealRedemption';
import ProgramMembership from '../models/ProgramMembership';
import { sendSuccess, sendNotFound, sendBadRequest, sendError } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { isValidRegion, RegionId } from '../services/regionService';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService';
import { razorpayConfig } from '../config/razorpay.config';
import { privilegeResolutionService } from '../services/entitlement/privilegeResolutionService';

/**
 * Get all active campaigns
 * GET /api/campaigns/active
 */
export const getActiveCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const { type, limit = 10 } = req.query;

  // Get region from header
  const regionHeader = req.headers['x-rez-region'] as string;
  const region: RegionId | undefined =
    regionHeader && isValidRegion(regionHeader) ? (regionHeader as RegionId) : undefined;

  try {
    const now = new Date();
    const query: any = {
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    };

    if (type) {
      query.type = type;
    }

    // Filter by region: show campaigns for specific region OR 'all' regions
    if (region) {
      query.$or = [
        { region: region },
        { region: 'all' },
        { region: { $exists: false } }, // Legacy campaigns without region field
      ];
    }

    logger.info(`🔍 [CAMPAIGNS] Fetching active campaigns for region: ${region || 'all'}...`);

    let campaigns = await Campaign.find(query).sort({ priority: -1 }).limit(Number(limit)).lean();

    // Filter out program-exclusive campaigns for non-members
    const exclusiveCampaigns = campaigns.filter((c: any) => c.exclusiveToProgramSlug);
    if (exclusiveCampaigns.length > 0 && req.user) {
      const userMemberships = await ProgramMembership.find({
        user: req.user._id,
        status: 'active',
      })
        .select('programSlug')
        .limit(50)
        .lean();
      const activeSlugs = new Set(userMemberships.map((m) => m.programSlug));
      campaigns = campaigns.filter((c: any) => !c.exclusiveToProgramSlug || activeSlugs.has(c.exclusiveToProgramSlug));
    } else if (exclusiveCampaigns.length > 0 && !req.user) {
      campaigns = campaigns.filter((c: any) => !c.exclusiveToProgramSlug);
    }

    // Annotate campaigns with userEligible flag for authenticated users
    if (req.user) {
      const PROGRAM_TO_ZONE: Record<string, string[]> = {
        student_zone: ['student'],
        corporate_perks: ['corporate'],
        rez_prive: ['prive'], // rez_prive is a DB slug — do not rename
      };

      try {
        const priv = await privilegeResolutionService.resolve(String(req.user!.id));
        const userZones = new Set(priv.activeZones || []);

        campaigns = campaigns.map((c: any) => {
          let userEligible = true;
          if (c.exclusiveToProgramSlug) {
            const matchZones = PROGRAM_TO_ZONE[c.exclusiveToProgramSlug] || [];
            userEligible = matchZones.some((z: string) => userZones.has(z));
          }
          return { ...c, userEligible };
        });
      } catch (err) {
        logger.warn('[CAMPAIGNS] Failed to resolve privileges for eligibility annotation', err);
      }
    }

    logger.info(`✅ [CAMPAIGNS] Found ${campaigns.length} active campaigns`);

    sendSuccess(
      res,
      {
        campaigns,
        total: campaigns.length,
      },
      'Active campaigns retrieved successfully',
    );
  } catch (error) {
    logger.error('❌ [CAMPAIGNS] Error fetching campaigns:', error);
    throw new AppError('Failed to fetch campaigns', 500);
  }
});

/**
 * Get campaigns by type
 * GET /api/campaigns/type/:type
 */
export const getCampaignsByType = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const { limit = 10 } = req.query;

  // Get region from header
  const regionHeader = req.headers['x-rez-region'] as string;
  const region: RegionId | undefined =
    regionHeader && isValidRegion(regionHeader) ? (regionHeader as RegionId) : undefined;

  try {
    const now = new Date();
    const query: any = {
      type,
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    };

    // Filter by region: show campaigns for specific region OR 'all' regions
    if (region) {
      query.$or = [
        { region: region },
        { region: 'all' },
        { region: { $exists: false } }, // Legacy campaigns without region field
      ];
    }

    let campaigns = await Campaign.find(query).sort({ priority: -1 }).limit(Number(limit)).lean();

    // Filter out program-exclusive campaigns for non-members
    const exclusiveCampaigns = campaigns.filter((c: any) => c.exclusiveToProgramSlug);
    if (exclusiveCampaigns.length > 0 && req.user) {
      const userMemberships = await ProgramMembership.find({
        user: req.user._id,
        status: 'active',
      })
        .select('programSlug')
        .limit(50)
        .lean();
      const activeSlugs = new Set(userMemberships.map((m) => m.programSlug));
      campaigns = campaigns.filter((c: any) => !c.exclusiveToProgramSlug || activeSlugs.has(c.exclusiveToProgramSlug));
    } else if (exclusiveCampaigns.length > 0 && !req.user) {
      campaigns = campaigns.filter((c: any) => !c.exclusiveToProgramSlug);
    }

    sendSuccess(
      res,
      {
        campaigns,
        total: campaigns.length,
      },
      `Campaigns of type '${type}' retrieved successfully`,
    );
  } catch (error) {
    logger.error('❌ [CAMPAIGNS] Error fetching campaigns by type:', error);
    throw new AppError('Failed to fetch campaigns', 500);
  }
});

/**
 * Get single campaign by ID or slug
 * GET /api/campaigns/:campaignId
 */
export const getCampaignById = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId } = req.params;

  try {
    const query = campaignId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: campaignId }
      : { campaignId: campaignId.toLowerCase() };

    const campaign = await Campaign.findOne(query).lean();

    if (!campaign) {
      return sendNotFound(res, 'Campaign not found');
    }

    // Transform storeId ObjectIds to strings in deals
    const transformedCampaign: any = {
      ...campaign,
      deals: campaign.deals.map((deal: any) => ({
        ...deal,
        storeId: deal.storeId ? (deal.storeId.toString ? deal.storeId.toString() : String(deal.storeId)) : undefined,
      })),
    };

    sendSuccess(res, transformedCampaign, 'Campaign retrieved successfully');
  } catch (error) {
    logger.error('❌ [CAMPAIGNS] Error fetching campaign:', error);
    throw new AppError('Failed to fetch campaign', 500);
  }
});

/**
 * Get all campaigns for homepage
 * GET /api/campaigns
 */
export const getAllCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, active = 'true' } = req.query;

  // Get region from header
  const regionHeader = req.headers['x-rez-region'] as string;
  const region: RegionId | undefined =
    regionHeader && isValidRegion(regionHeader) ? (regionHeader as RegionId) : undefined;

  try {
    const query: any = {};

    if (active === 'true') {
      const now = new Date();
      query.isActive = true;
      query.startTime = { $lte: now };
      query.endTime = { $gte: now };
    }

    // Filter by region: show campaigns for specific region OR 'all' regions
    if (region) {
      query.$or = [
        { region: region },
        { region: 'all' },
        { region: { $exists: false } }, // Legacy campaigns without region field
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Campaign.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    sendSuccess(
      res,
      {
        campaigns,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1,
        },
      },
      'Campaigns retrieved successfully',
    );
  } catch (error) {
    logger.error('❌ [CAMPAIGNS] Error fetching campaigns:', error);
    throw new AppError('Failed to fetch campaigns', 500);
  }
});

/**
 * Get campaigns for exciting deals section (grouped by type)
 * GET /api/campaigns/exciting-deals
 */
export const getExcitingDeals = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 6 } = req.query;

  // Get region from header
  const regionHeader = req.headers['x-rez-region'] as string;
  const region: RegionId | undefined =
    regionHeader && isValidRegion(regionHeader) ? (regionHeader as RegionId) : undefined;

  try {
    const now = new Date();

    const query: any = {
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    };

    // Filter by region: show campaigns for specific region OR 'all' regions
    if (region) {
      query.$or = [
        { region: region },
        { region: 'all' },
        { region: { $exists: false } }, // Legacy campaigns without region field
      ];
    }

    logger.info(`🔍 [EXCITING DEALS] Fetching deals for region: ${region || 'all'}...`);

    const campaigns = await Campaign.find(query).sort({ priority: -1 }).limit(Number(limit)).lean();

    // Transform to match frontend ExcitingDealsSection format
    const dealCategories = campaigns.map((campaign) => {
      // Calculate remaining time for flash drops
      const deals = campaign.deals.map((deal: any) => {
        // Convert storeId ObjectId to string if it exists
        const transformedDeal: any = {
          ...deal,
          storeId: deal.storeId ? (deal.storeId.toString ? deal.storeId.toString() : String(deal.storeId)) : undefined,
        };

        if (campaign.type === 'drop' || campaign.type === 'flash') {
          const now = new Date();
          const endTime = campaign.endTime;
          const timeLeft = endTime.getTime() - now.getTime();

          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
              transformedDeal.endsIn = `${hours}h`;
            } else if (minutes > 0) {
              transformedDeal.endsIn = `${minutes}m`;
            } else {
              transformedDeal.endsIn = 'Ending soon';
            }
          } else {
            transformedDeal.endsIn = 'Ended';
          }
        }
        return transformedDeal;
      });

      return {
        id: campaign.campaignId,
        title: campaign.title,
        subtitle: campaign.subtitle,
        badge: campaign.badge,
        gradientColors: campaign.gradientColors,
        badgeBg: campaign.badgeBg,
        badgeColor: campaign.badgeColor,
        deals,
      };
    });

    // Server-side dedup: remove duplicate campaigns by title (case-insensitive)
    const seen = new Set<string>();
    const uniqueDealCategories = dealCategories.filter((cat) => {
      const key = cat.title?.toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    sendSuccess(
      res,
      {
        dealCategories: uniqueDealCategories,
        total: uniqueDealCategories.length,
      },
      'Exciting deals retrieved successfully',
    );
  } catch (error) {
    logger.error('❌ [CAMPAIGNS] Error fetching exciting deals:', error);
    throw new AppError('Failed to fetch exciting deals', 500);
  }
});

/**
 * Track deal interaction (view, redeem, like, share)
 * POST /api/campaigns/deals/track
 */
export const trackDealInteraction = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId, dealIndex, action } = req.body;
  const userId = req.user?.id;

  try {
    // Validate inputs
    if (!campaignId || dealIndex === undefined || !action) {
      return sendBadRequest(res, 'campaignId, dealIndex, and action are required');
    }

    // Find campaign
    const query = campaignId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: campaignId }
      : { campaignId: campaignId.toLowerCase() };

    const campaign = await Campaign.findOne(query).lean();

    if (!campaign) {
      return sendNotFound(res, 'Campaign not found');
    }

    // Validate deal index
    if (dealIndex < 0 || dealIndex >= campaign.deals.length) {
      return sendBadRequest(res, 'Invalid deal index');
    }

    // Log the interaction (in production, you might want to store this in a separate collection)
    logger.info(
      `📊 [DEAL TRACK] ${action} - Campaign: ${campaign.title}, Deal: ${campaign.deals[dealIndex].store}, User: ${userId || 'anonymous'}`,
    );

    // In the future, you can store this in a DealInteraction collection:
    // await DealInteraction.create({
    //   user: userId,
    //   campaign: campaign._id,
    //   dealIndex,
    //   action,
    //   timestamp: new Date(),
    // });

    sendSuccess(
      res,
      {
        success: true,
        message: 'Deal interaction tracked',
      },
      'Interaction tracked successfully',
    );
  } catch (error) {
    logger.error('❌ [CAMPAIGNS] Error tracking deal interaction:', error);
    throw new AppError('Failed to track deal interaction', 500);
  }
});

/**
 * Redeem a deal (free) or initiate purchase (paid)
 * POST /api/campaigns/:campaignId/deals/:dealIndex/redeem
 */
export const redeemDeal = asyncHandler(async (req: Request, res: Response) => {
  const { campaignId, dealIndex } = req.params;
  const { successUrl, cancelUrl } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const index = parseInt(dealIndex, 10);
    if (isNaN(index) || index < 0) {
      return sendBadRequest(res, 'Invalid deal index');
    }

    // Find campaign by _id or campaignId slug
    const query = campaignId.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: campaignId }
      : { campaignId: campaignId.toLowerCase() };

    const campaign = await Campaign.findOne(query).lean();

    if (!campaign) {
      return sendNotFound(res, 'Campaign not found');
    }

    // Check campaign is active
    const now = new Date();
    if (!campaign.isActive || campaign.startTime > now || campaign.endTime < now) {
      return sendBadRequest(res, 'Campaign is not currently active');
    }

    // H26 fix: Re-check program membership eligibility at redemption time.
    // The frontend-only userEligible annotation is insufficient — users can bypass it via direct API calls.
    if ((campaign as any).exclusiveToProgramSlug) {
      const ProgramMembership = mongoose.models.ProgramMembership;
      if (ProgramMembership) {
        const membership = await ProgramMembership.findOne({
          user: new mongoose.Types.ObjectId(userId),
          programSlug: (campaign as any).exclusiveToProgramSlug,
          status: 'active',
        }).lean();
        if (!membership) {
          return res.status(403).json({ success: false, message: 'You are not eligible for this campaign' });
        }
      }
    }

    // H27 fix: Validate minOrderValue at redemption time.
    // The orderAmount must be provided in the request body for paid deals with a min order requirement.
    const { orderAmount } = req.body || {};
    if ((campaign as any).minOrderValue && orderAmount !== undefined) {
      if (Number(orderAmount) < (campaign as any).minOrderValue) {
        return sendBadRequest(res, `Minimum order of ₹${(campaign as any).minOrderValue} required`);
      }
    }

    // Check deal exists
    if (index >= campaign.deals.length) {
      return sendNotFound(res, 'Deal not found');
    }

    const deal = campaign.deals[index];

    // MA-M1: Enforce campaign-level maxBenefit cap atomically before creating
    // any redemption record. The $expr filter + $inc are evaluated in a single
    // MongoDB operation, so concurrent requests cannot both pass the cap check.
    // dealCoinValue is the coin amount this deal awards; fall back to 1 so the
    // counter always advances (prevents cap bypass via 0-coin deals).
    const dealCoinValue = Number(deal.coins) || 1;
    if (campaign.maxBenefit && campaign.maxBenefit > 0) {
      const capUpdated = await Campaign.findOneAndUpdate(
        { _id: campaign._id, $expr: { $lt: ['$totalBenefitIssued', '$maxBenefit'] } },
        { $inc: { totalBenefitIssued: dealCoinValue } },
        { new: true },
      );
      if (!capUpdated) {
        return res.status(400).json({ error: 'Campaign benefit limit reached', code: 'CAMPAIGN_LIMIT_REACHED' });
      }
    }

    // Check if user already has an active/used redemption for this deal
    const existingRedemption = await DealRedemption.findOne({
      user: new mongoose.Types.ObjectId(userId),
      campaign: campaign._id,
      dealIndex: index,
      status: { $in: ['active', 'used'] },
    }).lean();

    if (existingRedemption) {
      return sendBadRequest(res, 'You have already redeemed this deal');
    }

    // Check if deal is paid
    const isPaidDeal = (deal.price || 0) > 0;

    // Check purchase/redemption limit for all deals (free and paid)
    if (deal.purchaseLimit && deal.purchaseLimit > 0) {
      if ((deal.purchaseCount || 0) >= deal.purchaseLimit) {
        return sendBadRequest(
          res,
          isPaidDeal ? 'This deal has reached its purchase limit' : 'This deal has reached its redemption limit',
        );
      }
    }

    // Generate redemption code
    const redemptionCode = generateRedemptionCode();

    // Create deal redemption record
    const redemption = new DealRedemption({
      user: new mongoose.Types.ObjectId(userId),
      campaign: campaign._id,
      campaignId: campaign.campaignId,
      dealIndex: index,
      dealSnapshot: {
        store: deal.store,
        storeId: deal.storeId,
        image: deal.image,
        cashback: deal.cashback,
        coins: deal.coins,
        bonus: deal.bonus,
        drop: deal.drop,
        discount: deal.discount,
        price: deal.price,
        currency: deal.currency || 'INR',
      },
      campaignSnapshot: {
        title: campaign.title,
        subtitle: campaign.subtitle,
        type: campaign.type,
        badge: campaign.badge,
        gradientColors: campaign.gradientColors,
        endTime: campaign.endTime,
        minOrderValue: campaign.minOrderValue,
        maxBenefit: campaign.maxBenefit,
        terms: campaign.terms,
      },
      status: isPaidDeal ? 'pending' : 'active', // Pending for paid until payment confirmed
      redeemedAt: new Date(),
      expiresAt: campaign.endTime,
      redemptionCode,
      isPaid: isPaidDeal,
      purchaseAmount: isPaidDeal ? deal.price : undefined,
      purchaseCurrency: isPaidDeal ? deal.currency || 'INR' : undefined,
    });

    await redemption.save();

    // If free deal, increment count and return success
    if (!isPaidDeal) {
      // Atomically increment redemption count, guarded by purchaseLimit to prevent
      // concurrent requests from overshooting the cap.
      await Campaign.updateOne(
        {
          _id: campaign._id,
          $or: [
            { [`deals.${index}.purchaseLimit`]: { $exists: false } },
            { [`deals.${index}.purchaseLimit`]: 0 },
            {
              $expr: {
                $lt: [{ $ifNull: [`$deals.${index}.purchaseCount`, 0] }, `$deals.${index}.purchaseLimit`],
              },
            },
          ],
        },
        { $inc: { [`deals.${index}.purchaseCount`]: 1 } },
      );

      logger.info(
        `✅ [DEAL REDEEM] Free deal redeemed - Campaign: ${campaign.campaignId}, Deal: ${index}, User: ${userId}`,
      );

      return sendSuccess(
        res,
        {
          type: 'free',
          redemption: {
            id: redemption._id,
            code: redemptionCode,
            status: redemption.status,
            expiresAt: redemption.expiresAt,
            dealSnapshot: redemption.dealSnapshot,
            campaignSnapshot: {
              title: redemption.campaignSnapshot.title,
              subtitle: redemption.campaignSnapshot.subtitle,
            },
          },
        },
        'Deal redeemed successfully',
      );
    }

    // For paid deals, create Razorpay order
    const receipt = `deal_${(redemption._id as any).toString().slice(-12)}`;
    const razorpayOrder = await createRazorpayOrder(deal.price!, receipt, {
      campaignId: campaign._id.toString(),
      campaignSlug: campaign.campaignId,
      dealIndex: index,
      userId,
      redemptionId: (redemption._id as any).toString(),
      type: 'deal_purchase',
    });

    // Update redemption with Razorpay order ID
    redemption.stripeSessionId = razorpayOrder.id; // reuse field for Razorpay order ID
    await redemption.save();

    logger.info(
      `💳 [DEAL PURCHASE] Razorpay order created - Campaign: ${campaign.campaignId}, Deal: ${index}, User: ${userId}, Order: ${razorpayOrder.id}`,
    );

    return sendSuccess(
      res,
      {
        type: 'paid',
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: razorpayConfig.keyId,
        redemptionId: redemption._id,
        amount: deal.price,
        currency: deal.currency || 'INR',
      },
      'Payment order created',
    );
  } catch (error: any) {
    logger.error('❌ [DEAL REDEEM] Error:', error);

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return sendBadRequest(res, 'You have already redeemed this deal');
    }

    throw new AppError('Failed to redeem deal', 500);
  }
});

/**
 * Verify deal purchase payment (Razorpay)
 * POST /api/campaigns/deals/verify-payment
 */
export const verifyDealPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, redemptionId } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return sendBadRequest(res, 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required');
  }

  try {
    // Verify Razorpay payment signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      logger.warn(`⚠️ [DEAL VERIFY] Invalid Razorpay signature - Order: ${razorpayOrderId}`);
      return sendBadRequest(res, 'Payment verification failed: invalid signature');
    }

    // Find redemption by razorpayOrderId (stored in stripeSessionId field) and user
    const query: any = {
      user: new mongoose.Types.ObjectId(userId),
      stripeSessionId: razorpayOrderId, // field reused for Razorpay order ID
    };
    if (redemptionId) {
      query._id = new mongoose.Types.ObjectId(redemptionId);
    }

    const redemption = await DealRedemption.findOne(query);

    if (!redemption) {
      logger.error(`❌ [DEAL VERIFY] Redemption not found for order: ${razorpayOrderId}`);
      return sendNotFound(res, 'Redemption not found');
    }

    // Idempotency — already processed
    if (redemption.status === 'active' || redemption.status === 'used') {
      logger.info(`ℹ️ [DEAL VERIFY] Redemption already processed: ${redemption._id}`);
      return sendSuccess(
        res,
        {
          redemption: {
            id: redemption._id,
            code: redemption.redemptionCode,
            status: redemption.status,
            expiresAt: redemption.expiresAt,
            dealSnapshot: redemption.dealSnapshot,
            campaignSnapshot: {
              title: redemption.campaignSnapshot.title,
              subtitle: redemption.campaignSnapshot.subtitle,
            },
          },
        },
        'Payment already verified',
      );
    }

    // Atomically activate redemption (prevents duplicate processing)
    const updated = await DealRedemption.findOneAndUpdate(
      { _id: redemption._id, status: 'pending' },
      {
        $set: {
          status: 'active',
          purchasedAt: new Date(),
          stripePaymentIntentId: razorpayPaymentId, // reuse field for Razorpay payment ID
          purchasePaymentMethod: 'razorpay',
        },
      },
      { new: true },
    );

    if (!updated) {
      // Concurrent request already activated it
      const existing = await DealRedemption.findById(redemption._id).lean();
      return sendSuccess(
        res,
        { redemption: { id: existing?._id, code: existing?.redemptionCode, status: existing?.status } },
        'Payment already verified',
      );
    }

    // Atomically increment deal purchase count, guarded by the purchaseLimit.
    // Using $expr so we only increment when purchaseCount < purchaseLimit.
    // This prevents concurrent verifications from overshooting the cap.
    const dealIdx = redemption.dealIndex;
    const countUpdateResult = await Campaign.updateOne(
      {
        _id: redemption.campaign,
        $or: [
          // No purchase limit configured — always allow
          { [`deals.${dealIdx}.purchaseLimit`]: { $exists: false } },
          { [`deals.${dealIdx}.purchaseLimit`]: 0 },
          // Purchase limit set — only allow if not yet reached
          {
            $expr: {
              $lt: [{ $ifNull: [`$deals.${dealIdx}.purchaseCount`, 0] }, `$deals.${dealIdx}.purchaseLimit`],
            },
          },
        ],
      },
      { $inc: { [`deals.${dealIdx}.purchaseCount`]: 1 } },
    );

    if (countUpdateResult.modifiedCount === 0) {
      // The deal hit its purchase limit between initiation and payment completion.
      // The redemption is already activated above, so log for manual review/refund.
      logger.warn(
        `⚠️ [DEAL VERIFY] Purchase limit exceeded post-payment — manual refund may be needed. ` +
          `Redemption: ${redemption._id}, Campaign: ${redemption.campaign}, Deal: ${dealIdx}`,
      );
    }

    logger.info(
      `✅ [DEAL VERIFY] Payment verified - Redemption: ${redemption._id}, Code: ${redemption.redemptionCode}`,
    );

    return sendSuccess(
      res,
      {
        redemption: {
          id: updated._id,
          code: updated.redemptionCode,
          status: updated.status,
          expiresAt: updated.expiresAt,
          dealSnapshot: updated.dealSnapshot,
          campaignSnapshot: {
            title: updated.campaignSnapshot.title,
            subtitle: updated.campaignSnapshot.subtitle,
          },
          purchaseAmount: updated.purchaseAmount,
          purchaseCurrency: updated.purchaseCurrency,
        },
      },
      'Payment verified successfully',
    );
  } catch (error: any) {
    logger.error('❌ [DEAL VERIFY] Error:', error);
    throw new AppError('Failed to verify payment', 500);
  }
});

/**
 * Get user's redeemed deals
 * GET /api/campaigns/my-redemptions
 */
export const getUserRedemptions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { status, limit = 20, page = 1 } = req.query;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const query: any = { user: new mongoose.Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [redemptions, total] = await Promise.all([
      DealRedemption.find(query).sort({ redeemedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      DealRedemption.countDocuments(query),
    ]);

    // Transform for frontend
    const transformedRedemptions = redemptions.map((r) => ({
      id: r._id,
      code: r.redemptionCode,
      redemptionCode: r.redemptionCode, // Keep for backward compatibility
      campaignId: r.campaignId, // For navigation to deal detail
      dealIndex: r.dealIndex, // For navigation to deal detail
      status: r.status,
      redeemedAt: r.redeemedAt,
      expiresAt: r.expiresAt,
      usedAt: r.usedAt,
      isPaid: r.isPaid,
      purchaseAmount: r.purchaseAmount,
      purchaseCurrency: r.purchaseCurrency,
      dealSnapshot: r.dealSnapshot,
      campaignSnapshot: {
        title: r.campaignSnapshot.title,
        subtitle: r.campaignSnapshot.subtitle,
        type: r.campaignSnapshot.type,
        badge: r.campaignSnapshot.badge,
        gradientColors: r.campaignSnapshot.gradientColors, // For UI styling
        endTime: r.campaignSnapshot.endTime,
        terms: r.campaignSnapshot.terms,
      },
      benefitApplied: r.benefitApplied,
    }));

    sendSuccess(
      res,
      {
        redemptions: transformedRedemptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      'Redemptions retrieved successfully',
    );
  } catch (error) {
    logger.error('❌ [REDEMPTIONS] Error fetching user redemptions:', error);
    throw new AppError('Failed to fetch redemptions', 500);
  }
});

/**
 * Get redemption by code
 * GET /api/campaigns/redemptions/:code
 */
export const getRedemptionByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const redemption = await DealRedemption.findOne({
      redemptionCode: code.toUpperCase(),
      user: new mongoose.Types.ObjectId(userId),
    }).lean();

    if (!redemption) {
      return sendNotFound(res, 'Redemption not found');
    }

    sendSuccess(
      res,
      {
        id: redemption._id,
        code: redemption.redemptionCode,
        status: redemption.status,
        redeemedAt: redemption.redeemedAt,
        expiresAt: redemption.expiresAt,
        usedAt: redemption.usedAt,
        isPaid: redemption.isPaid,
        purchaseAmount: redemption.purchaseAmount,
        purchaseCurrency: redemption.purchaseCurrency,
        dealSnapshot: redemption.dealSnapshot,
        campaignSnapshot: redemption.campaignSnapshot,
        benefitApplied: redemption.benefitApplied,
      },
      'Redemption retrieved successfully',
    );
  } catch (error) {
    logger.error('❌ [REDEMPTIONS] Error fetching redemption:', error);
    throw new AppError('Failed to fetch redemption', 500);
  }
});

/**
 * Mark redemption as used (after order completion)
 * POST /api/campaigns/redemptions/:code/use
 */
export const useRedemption = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const { orderId, benefitApplied } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const redemption = await DealRedemption.findOne({
      redemptionCode: code.toUpperCase(),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!redemption) {
      return sendNotFound(res, 'Redemption not found');
    }

    // Can only mark active redemptions as used
    if (redemption.status !== 'active') {
      return sendBadRequest(res, `Cannot mark redemption as used. Current status: ${redemption.status}`);
    }

    // Check if redemption has expired
    if (redemption.expiresAt && new Date() > redemption.expiresAt) {
      redemption.status = 'expired';
      await redemption.save();
      return sendBadRequest(res, 'This redemption has expired');
    }

    // Mark as used
    redemption.status = 'used';
    redemption.usedAt = new Date();
    if (orderId) {
      redemption.orderId = orderId;
    }
    if (benefitApplied !== undefined) {
      redemption.benefitApplied = benefitApplied;
    }
    await redemption.save();

    logger.info(`✅ [REDEMPTION USED] Code: ${code}, Order: ${orderId || 'N/A'}, User: ${userId}`);

    sendSuccess(
      res,
      {
        id: redemption._id,
        redemptionCode: redemption.redemptionCode,
        status: redemption.status,
        usedAt: redemption.usedAt,
        orderId: redemption.orderId,
        benefitApplied: redemption.benefitApplied,
      },
      'Redemption marked as used',
    );
  } catch (error) {
    logger.error('❌ [REDEMPTIONS] Error marking redemption as used:', error);
    throw new AppError('Failed to mark redemption as used', 500);
  }
});

/**
 * Cancel a pending redemption (unpaid)
 * DELETE /api/campaigns/redemptions/:id
 */
export const cancelRedemption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const redemption = await DealRedemption.findOne({
      _id: id,
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!redemption) {
      return sendNotFound(res, 'Redemption not found');
    }

    // Only allow cancelling pending (unpaid) or active (unused) free redemptions
    if (redemption.status === 'used') {
      return sendBadRequest(res, 'Cannot cancel a used redemption');
    }

    if (redemption.status === 'active' && redemption.isPaid) {
      return sendBadRequest(res, 'Cannot cancel a paid redemption. Please request a refund.');
    }

    redemption.status = 'cancelled';
    await redemption.save();

    logger.info(`✅ [REDEMPTION CANCEL] Redemption cancelled - ID: ${id}, User: ${userId}`);

    sendSuccess(res, { message: 'Redemption cancelled' }, 'Redemption cancelled successfully');
  } catch (error) {
    logger.error('❌ [REDEMPTIONS] Error cancelling redemption:', error);
    throw new AppError('Failed to cancel redemption', 500);
  }
});

/**
 * Generate unique redemption code (RZ-XXXXXXXX format)
 */
function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding ambiguous chars (0, O, I, 1, L)
  let code = 'RZ-';
  for (let i = 0; i < 8; i++) {
    code += chars[parseInt(crypto.randomUUID().replace('-', '')[i % 32] || '0', 16) % chars.length];
  }
  return code;
}
