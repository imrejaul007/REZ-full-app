// @ts-nocheck
/**
 * Admin Routes - Flash Sales
 * CRUD for FlashSale model
 */

import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import FlashSale from '../../models/FlashSale';
import { sendSuccess, sendError } from '../../utils/response';
import { escapeRegex } from '../../utils/sanitize';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/flash-sales
 * List all flash sales with pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.enabled === 'true') {
      filter.enabled = true;
    } else if (req.query.enabled === 'false') {
      filter.enabled = false;
    }
    if (req.query.search) {
      filter.title = { $regex: escapeRegex(req.query.search as string), $options: 'i' };
    }

    const [sales, total] = await Promise.all([
      FlashSale.find(filter)
        .populate('stores', 'name logo')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FlashSale.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      {
        sales,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      'Flash sales fetched',
    );
  }),
);

/**
 * GET /api/admin/flash-sales/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid flash sale ID', 400);
    }

    const sale = await FlashSale.findById(req.params.id)
      .populate('stores', 'name logo')
      .populate('products', 'name image price')
      .populate('category', 'name slug')
      .lean();
    if (!sale) return sendError(res, 'Flash sale not found', 404);

    return sendSuccess(res, sale, 'Flash sale fetched');
  }),
);

/**
 * POST /api/admin/flash-sales
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      image,
      discountPercentage,
      startTime,
      endTime,
      maxQuantity,
      products: _products,
    } = req.body;

    if (
      !title ||
      !description ||
      !image ||
      discountPercentage === undefined ||
      !startTime ||
      !endTime ||
      !maxQuantity
    ) {
      return sendError(
        res,
        'title, description, image, discountPercentage, startTime, endTime, maxQuantity are required',
        400,
      );
    }

    const {
      title: fsTitle,
      description: fsDesc,
      image: fsImage,
      banner: fsBanner,
      discountPercentage: fsDPct,
      discountAmount: fsDAmt,
      priority: fsPriority,
      maxQuantity: fsMaxQty,
      limitPerUser: fsLimitPerUser,
      stores: fsStores,
      products: fsProducts,
      category: fsCategory,
      enabled: fsEnabled,
      terms: fsTerms,
    } = req.body;
    const sale = await FlashSale.create({
      title: fsTitle,
      description: fsDesc,
      image: fsImage,
      banner: fsBanner,
      discountPercentage: fsDPct,
      discountAmount: fsDAmt,
      priority: fsPriority,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      maxQuantity: fsMaxQty,
      limitPerUser: fsLimitPerUser,
      stores: fsStores,
      products: fsProducts,
      category: fsCategory,
      enabled: fsEnabled,
      terms: fsTerms,
      createdBy: (req as any).user?._id,
    });

    return sendSuccess(res, sale, 'Flash sale created');
  }),
);

/**
 * PUT /api/admin/flash-sales/:id
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid flash sale ID', 400);
    }

    const {
      title: fsUpTitle,
      description: fsUpDesc,
      image: fsUpImage,
      banner: fsUpBanner,
      discountPercentage: fsUpDPct,
      discountAmount: fsUpDAmt,
      priority: fsUpPriority,
      startTime: fsUpStart,
      endTime: fsUpEnd,
      maxQuantity: fsUpMaxQty,
      limitPerUser: fsUpLimitPerUser,
      stores: fsUpStores,
      products: fsUpProducts,
      category: fsUpCategory,
      enabled: fsUpEnabled,
      terms: fsUpTerms,
    } = req.body;
    const fsUpFields: Record<string, any> = {};
    if (fsUpTitle !== undefined) fsUpFields.title = fsUpTitle;
    if (fsUpDesc !== undefined) fsUpFields.description = fsUpDesc;
    if (fsUpImage !== undefined) fsUpFields.image = fsUpImage;
    if (fsUpBanner !== undefined) fsUpFields.banner = fsUpBanner;
    if (fsUpDPct !== undefined) fsUpFields.discountPercentage = fsUpDPct;
    if (fsUpDAmt !== undefined) fsUpFields.discountAmount = fsUpDAmt;
    if (fsUpPriority !== undefined) fsUpFields.priority = fsUpPriority;
    if (fsUpStart !== undefined) fsUpFields.startTime = new Date(fsUpStart);
    if (fsUpEnd !== undefined) fsUpFields.endTime = new Date(fsUpEnd);
    if (fsUpMaxQty !== undefined) fsUpFields.maxQuantity = fsUpMaxQty;
    if (fsUpLimitPerUser !== undefined) fsUpFields.limitPerUser = fsUpLimitPerUser;
    if (fsUpStores !== undefined) fsUpFields.stores = fsUpStores;
    if (fsUpProducts !== undefined) fsUpFields.products = fsUpProducts;
    if (fsUpCategory !== undefined) fsUpFields.category = fsUpCategory;
    if (fsUpEnabled !== undefined) fsUpFields.enabled = fsUpEnabled;
    if (fsUpTerms !== undefined) fsUpFields.terms = fsUpTerms;
    const sale = await FlashSale.findByIdAndUpdate(
      req.params.id,
      { $set: fsUpFields },
      { new: true, runValidators: true },
    );
    if (!sale) return sendError(res, 'Flash sale not found', 404);

    return sendSuccess(res, sale, 'Flash sale updated');
  }),
);

/**
 * PATCH /api/admin/flash-sales/:id/toggle
 */
router.patch(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid flash sale ID', 400);
    }

    const sale = await FlashSale.findById(req.params.id);
    if (!sale) return sendError(res, 'Flash sale not found', 404);

    sale.enabled = !sale.enabled;
    await sale.save();

    return sendSuccess(res, sale, `Flash sale ${sale.enabled ? 'enabled' : 'disabled'}`);
  }),
);

/**
 * DELETE /api/admin/flash-sales/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid flash sale ID', 400);
    }

    const sale = await FlashSale.findByIdAndDelete(req.params.id);
    if (!sale) return sendError(res, 'Flash sale not found', 404);

    return sendSuccess(res, null, 'Flash sale deleted');
  }),
);

export default router;
