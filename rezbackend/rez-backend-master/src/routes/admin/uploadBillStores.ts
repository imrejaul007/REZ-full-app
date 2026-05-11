// @ts-nocheck
/**
 * Admin Routes - Upload Bill Stores
 * CRUD for UploadBillStore model
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import UploadBillStore from '../../models/UploadBillStore';
import { sendSuccess, sendError } from '../../utils/response';
import { escapeRegex } from '../../utils/sanitize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/upload-bill-stores
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
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search as string), $options: 'i' };

    const [stores, total] = await Promise.all([
      UploadBillStore.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      UploadBillStore.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      {
        stores,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Upload bill stores fetched',
    );
  }),
);

/**
 * GET /api/admin/upload-bill-stores/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const store = await UploadBillStore.findById(req.params.id).lean();
    if (!store) return sendError(res, 'Upload bill store not found', 404);
    return sendSuccess(res, store, 'Upload bill store fetched');
  }),
);

/**
 * POST /api/admin/upload-bill-stores
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, category } = req.body;
    if (!name || !category) {
      return sendError(res, 'name and category are required', 400);
    }

    const {
      name: ubsName,
      logo: ubsLogo,
      category: ubsCategory,
      coinsPerRupee: ubsCoins,
      maxCoinsPerBill: ubsMaxCoins,
      minBillAmount: ubsMinBill,
      verificationRequired: ubsVR,
      verificationTime: ubsVTime,
      instructions: ubsInstructions,
      acceptedBillTypes: ubsAccepted,
      isActive: ubsIsActive,
      priority: ubsPriority,
    } = req.body;
    const store = await UploadBillStore.create({
      name: ubsName,
      logo: ubsLogo,
      category: ubsCategory,
      coinsPerRupee: ubsCoins,
      maxCoinsPerBill: ubsMaxCoins,
      minBillAmount: ubsMinBill,
      verificationRequired: ubsVR,
      verificationTime: ubsVTime,
      instructions: ubsInstructions,
      acceptedBillTypes: ubsAccepted,
      isActive: ubsIsActive,
      priority: ubsPriority,
    });
    return sendSuccess(res, store, 'Upload bill store created');
  }),
);

/**
 * PUT /api/admin/upload-bill-stores/:id
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const {
      name: ubsUpName,
      logo: ubsUpLogo,
      category: ubsUpCategory,
      coinsPerRupee: ubsUpCoins,
      maxCoinsPerBill: ubsUpMaxCoins,
      minBillAmount: ubsUpMinBill,
      verificationRequired: ubsUpVR,
      verificationTime: ubsUpVTime,
      instructions: ubsUpInstructions,
      acceptedBillTypes: ubsUpAccepted,
      isActive: ubsUpIsActive,
      priority: ubsUpPriority,
    } = req.body;
    const ubsUpFields: Record<string, any> = {};
    if (ubsUpName !== undefined) ubsUpFields.name = ubsUpName;
    if (ubsUpLogo !== undefined) ubsUpFields.logo = ubsUpLogo;
    if (ubsUpCategory !== undefined) ubsUpFields.category = ubsUpCategory;
    if (ubsUpCoins !== undefined) ubsUpFields.coinsPerRupee = ubsUpCoins;
    if (ubsUpMaxCoins !== undefined) ubsUpFields.maxCoinsPerBill = ubsUpMaxCoins;
    if (ubsUpMinBill !== undefined) ubsUpFields.minBillAmount = ubsUpMinBill;
    if (ubsUpVR !== undefined) ubsUpFields.verificationRequired = ubsUpVR;
    if (ubsUpVTime !== undefined) ubsUpFields.verificationTime = ubsUpVTime;
    if (ubsUpInstructions !== undefined) ubsUpFields.instructions = ubsUpInstructions;
    if (ubsUpAccepted !== undefined) ubsUpFields.acceptedBillTypes = ubsUpAccepted;
    if (ubsUpIsActive !== undefined) ubsUpFields.isActive = ubsUpIsActive;
    if (ubsUpPriority !== undefined) ubsUpFields.priority = ubsUpPriority;
    const store = await UploadBillStore.findByIdAndUpdate(
      req.params.id,
      { $set: ubsUpFields },
      { new: true, runValidators: true },
    );
    if (!store) return sendError(res, 'Upload bill store not found', 404);
    return sendSuccess(res, store, 'Upload bill store updated');
  }),
);

/**
 * PATCH /api/admin/upload-bill-stores/:id/toggle
 */
router.patch(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const store = await UploadBillStore.findById(req.params.id);
    if (!store) return sendError(res, 'Upload bill store not found', 404);
    store.isActive = !store.isActive;
    await store.save();
    return sendSuccess(res, store, `Upload bill store ${store.isActive ? 'activated' : 'deactivated'}`);
  }),
);

/**
 * DELETE /api/admin/upload-bill-stores/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) return sendError(res, 'Invalid ID', 400);
    const store = await UploadBillStore.findByIdAndDelete(req.params.id);
    if (!store) return sendError(res, 'Upload bill store not found', 404);
    return sendSuccess(res, null, 'Upload bill store deleted');
  }),
);

export default router;
