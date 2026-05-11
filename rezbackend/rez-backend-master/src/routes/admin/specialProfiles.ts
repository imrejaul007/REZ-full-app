// @ts-nocheck
/**
 * Admin Routes - Special Profiles
 * CRUD for SpecialProfile model
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import SpecialProfile from '../../models/SpecialProfile';
import { sendSuccess, sendError } from '../../utils/response';
import { escapeRegex } from '../../utils/sanitize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/special-profiles
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
    if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search as string), $options: 'i' };

    const [profiles, total] = await Promise.all([
      SpecialProfile.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      SpecialProfile.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      {
        profiles,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Special profiles fetched',
    );
  }),
);

/**
 * GET /api/admin/special-profiles/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const profile = await SpecialProfile.findById(req.params.id).lean();
    if (!profile) return sendError(res, 'Special profile not found', 404);
    return sendSuccess(res, profile, 'Special profile fetched');
  }),
);

/**
 * POST /api/admin/special-profiles
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, slug, verificationRequired } = req.body;
    if (!name || !slug || !verificationRequired) {
      return sendError(res, 'name, slug, and verificationRequired are required', 400);
    }

    const {
      name: pName,
      slug: pSlug,
      verificationRequired: pVR,
      description: pDesc,
      benefits: pBenefits,
      isActive: pIsActive,
      priority: pPriority,
      icon: pIcon,
      iconColor: pIconColor,
      backgroundColor: pBgColor,
      verificationDocuments: pVDocs,
      verificationTime: pVTime,
      discountRange: pDiscRange,
      image: pImage,
      bannerImage: pBanner,
    } = req.body;
    const profile = await SpecialProfile.create({
      name: pName,
      slug: pSlug,
      verificationRequired: pVR,
      description: pDesc,
      benefits: pBenefits,
      isActive: pIsActive,
      priority: pPriority,
      icon: pIcon,
      iconColor: pIconColor,
      backgroundColor: pBgColor,
      verificationDocuments: pVDocs,
      verificationTime: pVTime,
      discountRange: pDiscRange,
      image: pImage,
      bannerImage: pBanner,
    });
    return sendSuccess(res, profile, 'Special profile created');
  }),
);

/**
 * PUT /api/admin/special-profiles/:id
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const {
      name: upName,
      slug: upSlug,
      verificationRequired: upVR,
      description: upDesc,
      benefits: upBenefits,
      isActive: upIsActive,
      priority: upPriority,
      icon: upIcon,
      iconColor: upIconColor,
      backgroundColor: upBgColor,
      verificationDocuments: upVDocs,
      verificationTime: upVTime,
      discountRange: upDiscRange,
      image: upImage,
      bannerImage: upBanner,
    } = req.body;
    const upFields: Record<string, any> = {};
    if (upName !== undefined) upFields.name = upName;
    if (upSlug !== undefined) upFields.slug = upSlug;
    if (upVR !== undefined) upFields.verificationRequired = upVR;
    if (upDesc !== undefined) upFields.description = upDesc;
    if (upBenefits !== undefined) upFields.benefits = upBenefits;
    if (upIsActive !== undefined) upFields.isActive = upIsActive;
    if (upPriority !== undefined) upFields.priority = upPriority;
    if (upIcon !== undefined) upFields.icon = upIcon;
    if (upIconColor !== undefined) upFields.iconColor = upIconColor;
    if (upBgColor !== undefined) upFields.backgroundColor = upBgColor;
    if (upVDocs !== undefined) upFields.verificationDocuments = upVDocs;
    if (upVTime !== undefined) upFields.verificationTime = upVTime;
    if (upDiscRange !== undefined) upFields.discountRange = upDiscRange;
    if (upImage !== undefined) upFields.image = upImage;
    if (upBanner !== undefined) upFields.bannerImage = upBanner;
    const profile = await SpecialProfile.findByIdAndUpdate(
      req.params.id,
      { $set: upFields },
      { new: true, runValidators: true },
    );
    if (!profile) return sendError(res, 'Special profile not found', 404);
    return sendSuccess(res, profile, 'Special profile updated');
  }),
);

/**
 * PATCH /api/admin/special-profiles/:id/toggle
 */
router.patch(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const profile = await SpecialProfile.findById(req.params.id);
    if (!profile) return sendError(res, 'Special profile not found', 404);
    profile.isActive = !profile.isActive;
    await profile.save();
    return sendSuccess(res, profile, `Special profile ${profile.isActive ? 'activated' : 'deactivated'}`);
  }),
);

/**
 * DELETE /api/admin/special-profiles/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const profile = await SpecialProfile.findByIdAndDelete(req.params.id);
    if (!profile) return sendError(res, 'Special profile not found', 404);
    return sendSuccess(res, null, 'Special profile deleted');
  }),
);

export default router;
