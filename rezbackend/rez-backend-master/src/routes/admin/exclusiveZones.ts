// @ts-nocheck
/**
 * Admin Routes - Exclusive Zones
 * CRUD for ExclusiveZone model
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import ExclusiveZone from '../../models/ExclusiveZone';
import { sendSuccess, sendError } from '../../utils/response';
import { escapeRegex } from '../../utils/sanitize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/exclusive-zones
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status === 'active') filter.isActive = true;
    else if (req.query.status === 'inactive') filter.isActive = false;
    if (req.query.eligibilityType) filter.eligibilityType = req.query.eligibilityType;
    if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search as string), $options: 'i' };

    const [zones, total] = await Promise.all([
      ExclusiveZone.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ExclusiveZone.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      {
        zones,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Exclusive zones fetched',
    );
  }),
);

/**
 * GET /api/admin/exclusive-zones/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const zone = await ExclusiveZone.findById(req.params.id).lean();
    if (!zone) return sendError(res, 'Exclusive zone not found', 404);
    return sendSuccess(res, zone, 'Exclusive zone fetched');
  }),
);

/**
 * POST /api/admin/exclusive-zones
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, slug, eligibilityType } = req.body;
    if (!name || !slug || !eligibilityType) {
      return sendError(res, 'name, slug, and eligibilityType are required', 400);
    }

    const {
      name: ezName,
      slug: ezSlug,
      icon: ezIcon,
      iconColor: ezIconColor,
      backgroundColor: ezBgColor,
      description: ezDesc,
      shortDescription: ezShortDesc,
      eligibilityType: ezEligType,
      eligibilityDetails: ezEligDetails,
      verificationRequired: ezVR,
      image: ezImage,
      bannerImage: ezBanner,
      isActive: ezIsActive,
      priority: ezPriority,
      cashbackBonusPercent: ezCashback,
    } = req.body;
    const zone = await ExclusiveZone.create({
      name: ezName,
      slug: ezSlug,
      icon: ezIcon,
      iconColor: ezIconColor,
      backgroundColor: ezBgColor,
      description: ezDesc,
      shortDescription: ezShortDesc,
      eligibilityType: ezEligType,
      eligibilityDetails: ezEligDetails,
      verificationRequired: ezVR,
      image: ezImage,
      bannerImage: ezBanner,
      isActive: ezIsActive,
      priority: ezPriority,
      cashbackBonusPercent: ezCashback,
    });
    return sendSuccess(res, zone, 'Exclusive zone created');
  }),
);

/**
 * PUT /api/admin/exclusive-zones/:id
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const {
      name: ezUpName,
      slug: ezUpSlug,
      icon: ezUpIcon,
      iconColor: ezUpIconColor,
      backgroundColor: ezUpBgColor,
      description: ezUpDesc,
      shortDescription: ezUpShortDesc,
      eligibilityType: ezUpEligType,
      eligibilityDetails: ezUpEligDetails,
      verificationRequired: ezUpVR,
      image: ezUpImage,
      bannerImage: ezUpBanner,
      isActive: ezUpIsActive,
      priority: ezUpPriority,
      cashbackBonusPercent: ezUpCashback,
    } = req.body;
    const ezUpFields: Record<string, any> = {};
    if (ezUpName !== undefined) ezUpFields.name = ezUpName;
    if (ezUpSlug !== undefined) ezUpFields.slug = ezUpSlug;
    if (ezUpIcon !== undefined) ezUpFields.icon = ezUpIcon;
    if (ezUpIconColor !== undefined) ezUpFields.iconColor = ezUpIconColor;
    if (ezUpBgColor !== undefined) ezUpFields.backgroundColor = ezUpBgColor;
    if (ezUpDesc !== undefined) ezUpFields.description = ezUpDesc;
    if (ezUpShortDesc !== undefined) ezUpFields.shortDescription = ezUpShortDesc;
    if (ezUpEligType !== undefined) ezUpFields.eligibilityType = ezUpEligType;
    if (ezUpEligDetails !== undefined) ezUpFields.eligibilityDetails = ezUpEligDetails;
    if (ezUpVR !== undefined) ezUpFields.verificationRequired = ezUpVR;
    if (ezUpImage !== undefined) ezUpFields.image = ezUpImage;
    if (ezUpBanner !== undefined) ezUpFields.bannerImage = ezUpBanner;
    if (ezUpIsActive !== undefined) ezUpFields.isActive = ezUpIsActive;
    if (ezUpPriority !== undefined) ezUpFields.priority = ezUpPriority;
    if (ezUpCashback !== undefined) ezUpFields.cashbackBonusPercent = ezUpCashback;
    const zone = await ExclusiveZone.findByIdAndUpdate(
      req.params.id,
      { $set: ezUpFields },
      { new: true, runValidators: true },
    );
    if (!zone) return sendError(res, 'Exclusive zone not found', 404);
    return sendSuccess(res, zone, 'Exclusive zone updated');
  }),
);

/**
 * PATCH /api/admin/exclusive-zones/:id/toggle
 */
router.patch(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const zone = await ExclusiveZone.findById(req.params.id);
    if (!zone) return sendError(res, 'Exclusive zone not found', 404);
    zone.isActive = !zone.isActive;
    await zone.save();
    return sendSuccess(res, zone, `Exclusive zone ${zone.isActive ? 'activated' : 'deactivated'}`);
  }),
);

/**
 * DELETE /api/admin/exclusive-zones/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const zone = await ExclusiveZone.findByIdAndDelete(req.params.id);
    if (!zone) return sendError(res, 'Exclusive zone not found', 404);
    return sendSuccess(res, null, 'Exclusive zone deleted');
  }),
);

export default router;
