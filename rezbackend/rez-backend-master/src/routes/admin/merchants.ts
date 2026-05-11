// @ts-nocheck
import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin, requireSeniorAdmin } from '../../middleware/auth';
import { Merchant } from '../../models/Merchant';
import { MerchantWallet } from '../../models/MerchantWallet';
import { isSocketInitialized, getIO } from '../../config/socket';
import { escapeRegex } from '../../utils/sanitize';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateQuery } from '../../middleware/validation';
import { adminMerchantSearchSchema } from '../../validators/financialValidators';
import redisService from '../../services/redisService';
import { AdminAuditLog } from '../../models/AdminAuditLog';
import { MerchantFeatureFlag } from '../../models/MerchantFeatureFlag';
import { Order } from '../../models/Order';
import { Store } from '../../models/Store';
import { Product } from '../../models/Product';
import { logger } from '../../config/logger';
import { EmailService } from '../../services/EmailService';
import { cancelOrderCore } from '../../services/cancelOrderService';
import { CacheInvalidator } from '../../utils/cacheHelper';
import { publishNotificationEvent } from '../../events/notificationQueue';

const router = Router();

// All routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/merchants
 * @desc    Get all merchants with pagination, filters, and search
 * @access  Admin
 */
router.get(
  '/',
  validateQuery(adminMerchantSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    // Status filter (pending/approved/suspended maps to verificationStatus)
    if (req.query.status) {
      if (req.query.status === 'suspended') {
        // Suspended = verified merchant with isActive false
        filter.verificationStatus = 'verified';
        filter.isActive = false;
      } else {
        const statusMap: Record<string, string> = {
          pending: 'pending',
          approved: 'verified',
        };
        const mappedStatus = statusMap[req.query.status as string] || req.query.status;
        filter.verificationStatus = mappedStatus;
      }
    }

    // isActive filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) {
        filter.createdAt.$gte = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filter.createdAt.$lte = new Date(req.query.dateTo as string);
      }
    }

    // Search by business name, owner name, or email
    if (req.query.search) {
      const searchRegex = { $regex: escapeRegex(req.query.search as string), $options: 'i' };
      filter.$or = [
        { businessName: searchRegex },
        { ownerName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // City filter
    if (req.query.city) {
      filter['businessAddress.city'] = { $regex: escapeRegex(req.query.city as string), $options: 'i' };
    }

    // State filter
    if (req.query.state) {
      filter['businessAddress.state'] = { $regex: escapeRegex(req.query.state as string), $options: 'i' };
    }

    const [merchants, totalArr] = await Promise.all([
      Merchant.aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'stores',
            let: { merchantId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [{ $eq: ['$merchantId', '$$merchantId'] }, { $eq: ['$merchant', '$$merchantId'] }],
                  },
                },
              },
            ],
            as: 'stores',
          },
        },
        {
          $addFields: {
            phoneNumber: '$phone',
            status: {
              $switch: {
                branches: [
                  {
                    case: { $and: [{ $eq: ['$verificationStatus', 'verified'] }, { $eq: ['$isActive', false] }] },
                    then: 'suspended',
                  },
                  { case: { $eq: ['$verificationStatus', 'verified'] }, then: 'approved' },
                  { case: { $eq: ['$verificationStatus', 'rejected'] }, then: 'rejected' },
                ],
                default: 'pending',
              },
            },
            stores: {
              $map: {
                input: '$stores',
                as: 'store',
                in: {
                  _id: '$$store._id',
                  name: '$$store.name',
                  status: { $cond: ['$$store.isActive', 'active', 'inactive'] },
                  isProgramMerchant: { $ifNull: ['$$store.isProgramMerchant', false] },
                  baseCashbackPercent: { $ifNull: ['$$store.rewardRules.baseCashbackPercent', 0] },
                  estimatedPrepMinutes: { $ifNull: ['$$store.estimatedPrepMinutes', 0] },
                },
              },
            },
          },
        },
        {
          $project: {
            businessName: 1,
            ownerName: 1,
            email: 1,
            phone: 1,
            phoneNumber: 1,
            businessAddress: 1,
            verificationStatus: 1,
            status: 1,
            isActive: 1,
            logo: 1,
            createdAt: 1,
            'onboarding.status': 1,
            stores: 1,
          },
        },
      ]),
      Merchant.aggregate([{ $match: filter }, { $count: 'total' }]),
    ]);

    const total = totalArr[0]?.total || 0;

    res.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
    });
  }),
);

/**
 * @route   GET /api/admin/merchants/stats
 * @desc    Get merchant statistics
 * @access  Admin
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Merchant.aggregate([
      {
        $facet: {
          // Verification status breakdown
          byVerificationStatus: [{ $group: { _id: '$verificationStatus', count: { $sum: 1 } } }],
          // Active status breakdown
          byActiveStatus: [{ $group: { _id: '$isActive', count: { $sum: 1 } } }],
          // Today's registrations
          today: [{ $match: { createdAt: { $gte: today } } }, { $count: 'count' }],
          // Overall stats
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
              },
            },
          ],
          // By onboarding status
          byOnboardingStatus: [{ $group: { _id: '$onboarding.status', count: { $sum: 1 } } }],
        },
      },
    ]);

    // Transform results
    const result = {
      byVerificationStatus: stats[0].byVerificationStatus.reduce((acc: any, item: any) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {}),
      byActiveStatus: {
        active: 0,
        inactive: 0,
      },
      byOnboardingStatus: stats[0].byOnboardingStatus.reduce((acc: any, item: any) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {}),
      today: stats[0].today[0]?.count || 0,
      total: stats[0].overall[0]?.total || 0,
    };

    // Map active status
    stats[0].byActiveStatus.forEach((item: any) => {
      if (item._id === true) {
        result.byActiveStatus.active = item.count;
      } else {
        result.byActiveStatus.inactive = item.count;
      }
    });

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * @route   POST /api/admin/merchants
 * @desc    Create a new merchant account (admin-initiated, pre-approved)
 * @access  Senior Admin
 */
router.post(
  '/',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, businessName, businessType, storeAddress } = req.body;

    if (!name || !email || !phone || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'name, email, phone, businessName are required',
      });
    }

    // Check for duplicate email or phone
    const existing = await Merchant.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Merchant with this email or phone already exists',
      });
    }

    // Generate a temporary password the admin can share with the merchant
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const merchant = await Merchant.create({
      ownerName: name,
      email,
      phone,
      businessName,
      businessType: businessType || 'retail',
      password: hashedPassword,
      // Admin-created merchants are pre-approved; no onboarding required
      verificationStatus: 'verified',
      isActive: true,
      emailVerified: true,
      businessAddress: {
        street: storeAddress?.street || 'N/A',
        city: storeAddress?.city || 'N/A',
        state: storeAddress?.state || 'N/A',
        zipCode: storeAddress?.zipCode || '000000',
        country: storeAddress?.country || 'India',
      },
      onboarding: {
        status: 'completed',
        currentStep: 5,
        completedSteps: [1, 2, 3, 4, 5],
        stepData: {},
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // AUDIT: log admin merchant creation
    setImmediate(() => {
      AdminAuditLog.create({
        adminId: (req as any).userId,
        action: 'MERCHANT_CREATED_BY_ADMIN',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String(merchant._id),
        targetType: 'merchant',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: { name, email, phone, businessName, businessType },
        responseSuccess: true,
        responseStatus: 201,
        timestamp: new Date(),
      }).catch(() => {
        /* non-fatal */
      });
    });

    // Notify merchant of their new account via notification service
    publishNotificationEvent({
      eventId: `merchant-created:${merchant._id}:${Date.now()}`,
      eventType: 'notification.merchant',
      userId: String(merchant._id),
      channels: ['email'],
      payload: {
        title: 'Your REZ Merchant Account is Ready',
        body: `Your merchant account has been created by the REZ team. Log in with your email and the temporary password provided by your account manager.`,
        data: { merchantId: String(merchant._id), email: merchant.email },
        emailSubject: 'Your REZ Merchant Account is Ready',
        emailHtml: `
          <h2>Welcome to REZ, ${merchant.ownerName}!</h2>
          <p>Your merchant account for <strong>${merchant.businessName}</strong> has been created and is active.</p>
          <p>Please log in using your email address. Your account manager has your temporary password.</p>
          <p>Change your password immediately after your first login.</p>
          <br/>
          <p>— The REZ Team</p>
        `,
      },
      category: 'merchant_account',
      source: 'admin',
      createdAt: new Date().toISOString(),
    }).catch((notifyErr: any) => {
      logger.warn(`[MERCHANT CREATE] Failed to enqueue welcome notification for ${merchant._id}:`, notifyErr?.message);
    });

    // Return tempPassword once so the admin can share it with the merchant.
    // It is not stored in plain text — only the hash persists.
    return res.status(201).json({
      success: true,
      message: 'Merchant created. Share the temporary password with the merchant.',
      data: {
        merchant,
        tempPassword,
      },
    });
  }),
);

/**
 * @route   GET /api/admin/merchants/:id
 * @desc    Get single merchant details
 * @access  Admin
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const merchant = await Merchant.findById(req.params.id).select(
      '-password -resetPasswordToken -resetPasswordExpiry -emailVerificationToken -emailVerificationExpiry',
    );

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    res.json({
      success: true,
      data: merchant,
    });
  }),
);

/**
 * @route   POST /api/admin/merchants/:id/approve
 * @desc    Approve a merchant
 * @access  Admin
 */
router.post(
  '/:id/approve',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    if (merchant.verificationStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Merchant is already approved',
      });
    }

    // Update merchant status
    merchant.verificationStatus = 'verified';
    merchant.isActive = true;

    // Update onboarding status if applicable
    if (merchant.onboarding) {
      merchant.onboarding.status = 'completed';
      merchant.onboarding.completedAt = new Date();
      if (merchant.onboarding.stepData?.verification) {
        merchant.onboarding.stepData.verification.verificationStatus = 'verified';
        merchant.onboarding.stepData.verification.verifiedAt = new Date();
        merchant.onboarding.stepData.verification.verifiedBy = req.userId;
      }
    }

    await merchant.save();

    // BL-H4: Ensure a MerchantWallet exists for this newly approved merchant.
    // Done as a fire-and-forget inside setImmediate so it does not block the approval response.
    const merchantId = merchant._id;
    setImmediate(async () => {
      try {
        const existingWallet = await MerchantWallet.findOne({ merchant: merchantId });
        if (!existingWallet) {
          await MerchantWallet.create({
            merchant: merchantId,
            balance: { available: 0, pending: 0, held: 0 },
            currency: 'INR',
          });
          logger.info(`[MERCHANT APPROVE] Created MerchantWallet for merchant ${merchantId}`);
        }
      } catch (walletErr: any) {
        logger.warn(`[MERCHANT APPROVE] Failed to create MerchantWallet for ${merchantId}: ${walletErr.message}`);
      }
    });

    // AUDIT: log merchant approval with who/when/what
    setImmediate(() => {
      AdminAuditLog.create({
        adminId: (req as any).userId,
        action: 'MERCHANT_APPROVED',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String(merchant._id),
        targetType: 'merchant',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: { merchantId: req.params.id },
        responseSuccess: true,
        responseStatus: 200,
        timestamp: new Date(),
      }).catch(() => {
        /* non-fatal */
      });
    });

    // Emit real-time notification to the specific merchant's dashboard room
    if (isSocketInitialized()) {
      const merchantRoom = `merchant-${req.params.id}`;
      const merchantLivePayload = {
        merchantId: String(merchant._id),
        status: 'active' as const,
        timestamp: new Date().toISOString(),
      };
      getIO().to(merchantRoom).emit('merchant_approved', {
        merchantId: merchant._id,
        message: 'Your merchant account has been approved!',
      });
      // Unified event for generic merchant status listeners
      getIO()
        .to(merchantRoom)
        .emit('merchant-status-changed', {
          status: 'active',
          merchantId: String(merchant._id),
          message: 'Your merchant account has been approved!',
          changedAt: new Date().toISOString(),
        });
      // Admin live feed — admin panel subscribes to this event to update merchant list in real-time
      getIO().to('admin-room').emit('merchant:live', merchantLivePayload);
      getIO().to('admin-room').emit('merchant:approved', merchantLivePayload);
    }

    // Notify merchant via push/email/in-app
    publishNotificationEvent({
      eventId: `merchant-approved:${merchant._id}:${Date.now()}`,
      eventType: 'notification.merchant',
      userId: String(merchant._id),
      channels: ['email', 'push', 'in_app'],
      payload: {
        title: 'Account Approved!',
        body: `Your merchant account "${merchant.businessName}" has been approved. You can now start accepting orders!`,
        data: {
          merchantId: String(merchant._id),
          email: merchant.email,
        },
        emailSubject: 'Your merchant account has been approved!',
        emailHtml: `
          <h2>Congratulations!</h2>
          <p>Hello ${merchant.ownerName || merchant.businessName},</p>
          <p>Your merchant account <strong>${merchant.businessName}</strong> has been approved.</p>
          <p>You can now start adding products, setting up your store, and accepting orders.</p>
          <br/>
          <p>— The REZ Team</p>
        `,
      },
      category: 'merchant_account',
      source: 'admin',
      createdAt: new Date().toISOString(),
    }).catch((notifyErr: any) => {
      logger.warn(
        `[MERCHANT APPROVE] Failed to enqueue merchant approval notification for ${merchant._id}:`,
        notifyErr?.message,
      );
    });

    res.json({
      success: true,
      message: 'Merchant approved successfully',
      data: merchant,
    });
  }),
);

/**
 * @route   POST /api/admin/merchants/:id/reject
 * @desc    Reject a merchant (with reason)
 * @access  Admin
 */
router.post(
  '/:id/reject',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    if (merchant.verificationStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Merchant is already rejected',
      });
    }

    // Update merchant status
    merchant.verificationStatus = 'rejected';
    merchant.isActive = false;

    // Update onboarding status if applicable
    if (merchant.onboarding) {
      merchant.onboarding.status = 'rejected';
      merchant.onboarding.rejectionReason = reason;
      if (merchant.onboarding.stepData?.verification) {
        merchant.onboarding.stepData.verification.verificationStatus = 'rejected';
      }
    }

    await merchant.save();

    // CS-C2: Immediately invalidate the merchant's active sessions in rez-merchant-service.
    // Fire-and-forget — non-fatal if merchant-service is unreachable, but always logged.
    const merchantServiceUrl = process.env.MERCHANT_SERVICE_URL;
    if (merchantServiceUrl) {
      fetch(`${merchantServiceUrl}/internal/merchants/${merchant._id}/invalidate-session`, {
        method: 'POST',
        headers: { 'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '', 'x-internal-service': 'rezbackend' },
      }).catch((err: any) =>
        logger.error('[MERCHANT REJECT] Failed to invalidate merchant session in rez-merchant-service', {
          merchantId: String(merchant._id),
          err: err.message,
        }),
      );
    }

    // AUDIT: log merchant rejection with who/when/what/reason
    setImmediate(() => {
      AdminAuditLog.create({
        adminId: (req as any).userId,
        action: 'MERCHANT_REJECTED',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String(merchant._id),
        targetType: 'merchant',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: { merchantId: req.params.id, reason },
        responseSuccess: true,
        responseStatus: 200,
        timestamp: new Date(),
      }).catch(() => {
        /* non-fatal */
      });
    });

    // Emit real-time notification to the specific merchant's dashboard room
    if (isSocketInitialized()) {
      const merchantRoom = `merchant-${req.params.id}`;
      getIO()
        .to(merchantRoom)
        .emit('merchant_rejected', {
          merchantId: merchant._id,
          reason,
          message: `Your merchant application was rejected: ${reason || 'No reason provided'}`,
        });
      // Unified event for generic merchant status listeners
      getIO()
        .to(merchantRoom)
        .emit('merchant-status-changed', {
          status: 'inactive',
          merchantId: String(merchant._id),
          reason,
          message: `Your merchant application was rejected: ${reason || 'No reason provided'}`,
          changedAt: new Date().toISOString(),
        });
    }

    // Notify merchant via push/email/in-app
    publishNotificationEvent({
      eventId: `merchant-rejected:${merchant._id}:${Date.now()}`,
      eventType: 'notification.merchant',
      userId: String(merchant._id),
      channels: ['email', 'push', 'in_app'],
      payload: {
        title: 'Application Update',
        body: `Your merchant application was not approved. Reason: ${reason || 'No reason provided'}. Please contact support for details.`,
        data: {
          merchantId: String(merchant._id),
          email: merchant.email,
        },
        emailSubject: 'Update on your merchant application',
        emailHtml: `
          <h2>Application Update</h2>
          <p>Hello ${merchant.ownerName || merchant.businessName},</p>
          <p>Unfortunately, your merchant application for <strong>${merchant.businessName}</strong> was not approved.</p>
          <p>Reason: ${reason}</p>
          <p>Please contact our support team if you have questions or would like to reapply.</p>
          <br/>
          <p>— The REZ Team</p>
        `,
      },
      category: 'merchant_account',
      source: 'admin',
      createdAt: new Date().toISOString(),
    }).catch((notifyErr: any) => {
      logger.warn(
        `[MERCHANT REJECT] Failed to enqueue merchant rejection notification for ${merchant._id}:`,
        notifyErr?.message,
      );
    });

    res.json({
      success: true,
      message: 'Merchant rejected',
      data: merchant,
    });
  }),
);

/**
 * @route   POST /api/admin/merchants/:id/suspend
 * @desc    Suspend a merchant (with reason)
 * @access  Admin
 */
router.post(
  '/:id/suspend',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    if (!merchant.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Merchant is already suspended/inactive',
      });
    }

    // Suspend the merchant by setting isActive to false
    // Keep verificationStatus as is (they might be verified but suspended)
    merchant.isActive = false;

    // Store suspension reason in onboarding rejectionReason or a custom field
    if (merchant.onboarding) {
      merchant.onboarding.rejectionReason = `Suspended: ${reason}`;
    }

    await merchant.save();

    // CS-C2: Immediately invalidate the merchant's active sessions in rez-merchant-service.
    // Fire-and-forget — non-fatal if merchant-service is unreachable, but always logged.
    const _merchantServiceUrl = process.env.MERCHANT_SERVICE_URL;
    if (_merchantServiceUrl) {
      fetch(`${_merchantServiceUrl}/internal/merchants/${merchant._id}/invalidate-session`, {
        method: 'POST',
        headers: { 'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '', 'x-internal-service': 'rezbackend' },
      }).catch((err: any) =>
        logger.error('[MERCHANT SUSPEND] Failed to invalidate merchant session in rez-merchant-service', {
          merchantId: String(merchant._id),
          err: err.message,
        }),
      );
    }

    // CRITICAL-4: Fire the merchant-suspend-notify endpoint so the merchant app receives
    // merchant_suspended via the internal payments socket path (global.io). This is belt-and-
    // suspenders alongside the direct getIO() emit above — having two emission paths reduces the
    // chance the event is silently lost if one socket instance is in a bad state.
    const _backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;
    const _merchantIdStr = String(merchant._id);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch(`${_backendUrl}/api/internal/payments/merchant-suspend-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantId: _merchantIdStr,
        reason,
        secret: process.env.INTERNAL_WEBHOOK_SECRET || '',
      }),
      signal: controller.signal,
    })
      .catch((err: any) => {
        if (err.name === 'AbortError') {
          logger.warn('[MERCHANT SUSPEND] merchant-suspend-notify timed out after 5s', {
            merchantId: _merchantIdStr,
          });
        } else {
          logger.error('[MERCHANT SUSPEND] Failed to POST to merchant-suspend-notify', {
            merchantId: _merchantIdStr,
            err: err.message,
          });
        }
      })
      .finally(() => clearTimeout(timeout));

    const merchantStores = await Store.find({ merchant: merchant._id }).select('_id').lean();
    const merchantStoreIds = merchantStores.map((s) => s._id);

    let deactivatedProductCount = 0;
    if (merchantStoreIds.length > 0) {
      const productUpdateResult = await Product.updateMany(
        { store: { $in: merchantStoreIds } },
        {
          $set: {
            isActive: false,
            deactivatedReason: 'merchant_suspended',
          },
        },
      );
      deactivatedProductCount = productUpdateResult.modifiedCount ?? (productUpdateResult as any).nModified ?? 0;

      for (const storeId of merchantStoreIds) {
        CacheInvalidator.invalidateStore(String(storeId)).catch((err) => {
          logger.warn(`[MERCHANT SUSPEND] Failed to invalidate cache for store ${storeId}:`, err);
        });
      }

      CacheInvalidator.invalidateProductLists().catch((err) => {
        logger.warn('[MERCHANT SUSPEND] Failed to invalidate product list caches:', err);
      });
    }

    // Notify merchant via socket (room name must match RealTimeService: merchant-${id})
    if (isSocketInitialized()) {
      const merchantRoom = `merchant-${req.params.id}`;
      const merchantLivePayload = {
        merchantId: String(merchant._id),
        status: 'suspended' as const,
        timestamp: new Date().toISOString(),
      };
      getIO().to(merchantRoom).emit('merchant_suspended', {
        reason,
        suspendedAt: new Date(),
      });
      // Unified event for generic merchant status listeners
      getIO()
        .to(merchantRoom)
        .emit('merchant-status-changed', {
          status: 'suspended',
          merchantId: String(merchant._id),
          reason,
          message: `Your merchant account has been suspended. Reason: ${reason}`,
          changedAt: new Date().toISOString(),
        });
      // Admin live feed — admin panel subscribes to these events to update merchant list in real-time
      getIO().to('admin-room').emit('merchant:live', merchantLivePayload);
      getIO().to('admin-room').emit('merchant:suspended', merchantLivePayload);
    }

    publishNotificationEvent({
      eventId: `merchant-suspended:${merchant._id}:${Date.now()}`,
      eventType: 'notification.merchant',
      userId: String(merchant._id),
      channels: ['email', 'push', 'in_app'],
      payload: {
        title: 'Account Suspended',
        body: `Your merchant account has been suspended. Reason: ${reason}. Contact support for details.`,
        data: {
          merchantId: String(merchant._id),
          email: merchant.email,
        },
        emailSubject: 'Your merchant account has been suspended',
        emailHtml: `
          <h2>Account Suspended</h2>
          <p>Hello ${merchant.ownerName || merchant.businessName},</p>
          <p>Your merchant account <strong>${merchant.businessName}</strong> has been suspended.</p>
          <p>Reason: ${reason}</p>
          <p>Please contact support for details.</p>
        `,
      },
      category: 'merchant_account',
      source: 'admin',
      createdAt: new Date().toISOString(),
    }).catch((notifyErr: any) => {
      logger.warn(
        `[MERCHANT SUSPEND] Failed to enqueue merchant suspension notification for ${merchant._id}:`,
        notifyErr?.message,
      );
    });

    // Cancel all pending orders for this merchant's stores with proper refunds
    let cancelledOrderCount = 0;
    const cancellationResults: Array<{
      orderId: string;
      orderNumber?: string;
      success: boolean;
      refundIssued?: boolean;
      error?: string;
    }> = [];
    try {
      if (merchantStoreIds.length > 0) {
        const pendingOrders = await Order.find({
          store: { $in: merchantStoreIds },
          status: { $in: ['placed', 'confirmed', 'preparing', 'ready'] },
        }).select('_id');

        for (const order of pendingOrders) {
          try {
            const result = await cancelOrderCore({
              orderId: (order._id as any).toString(),
              reason: 'Merchant suspended by admin',
              cancelledBy: 'admin',
              actorUserId: undefined, // falls back to order.user inside cancelOrderCore
            });
            cancelledOrderCount++;
            cancellationResults.push({
              orderId: result.orderId,
              orderNumber: result.orderNumber,
              success: true,
              refundIssued: result.refundIssued,
            });
          } catch (err: any) {
            logger.error(`[MERCHANT SUSPEND] Failed to cancel order ${(order._id as any).toString()}:`, err);
            cancellationResults.push({
              orderId: (order._id as any).toString(),
              success: false,
              error: err.message,
            });
          }
        }

        logger.info(
          `[MERCHANT SUSPEND] Cancelled ${cancelledOrderCount}/${pendingOrders.length} pending orders for merchant ${req.params.id}`,
        );
      }
    } catch (orderErr) {
      logger.error('[MERCHANT SUSPEND] Failed to cancel pending orders:', orderErr);
      // Non-fatal: suspension still succeeds even if order cancellation fails
    }

    // AUDIT: log merchant suspension with who/when/what/reason
    setImmediate(() => {
      AdminAuditLog.create({
        adminId: (req as any).userId,
        action: 'MERCHANT_SUSPENDED',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String(merchant._id),
        targetType: 'merchant',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: { merchantId: req.params.id, reason },
        responseSuccess: true,
        responseStatus: 200,
        timestamp: new Date(),
      }).catch(() => {
        /* non-fatal */
      });
    });

    const failedCancellations = cancellationResults.filter((r) => !r.success);
    res.json({
      success: true,
      message: `Merchant suspended. ${deactivatedProductCount} product(s) deactivated. ${cancelledOrderCount} pending order(s) cancelled with refunds.${failedCancellations.length > 0 ? ` ${failedCancellations.length} order(s) failed to cancel.` : ''}`,
      data: merchant,
      cancellationResults,
      deactivatedProductCount,
    });
  }),
);

/**
 * @route   POST /api/admin/merchants/:id/reactivate
 * @desc    Reactivate a suspended merchant
 * @access  Admin
 */
router.post(
  '/:id/reactivate',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found',
      });
    }

    if (merchant.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Merchant is already active',
      });
    }

    // Reactivate the merchant
    merchant.isActive = true;

    // Clear suspension reason if it was a suspension
    if (merchant.onboarding?.rejectionReason?.startsWith('Suspended:')) {
      merchant.onboarding.rejectionReason = undefined;
    }

    await merchant.save();

    const merchantStores = await Store.find({ merchant: merchant._id }).select('_id').lean();
    const merchantStoreIds = merchantStores.map((s) => s._id);

    let reactivatedProductCount = 0;
    if (merchantStoreIds.length > 0) {
      const productUpdateResult = await Product.updateMany(
        {
          store: { $in: merchantStoreIds },
          deactivatedReason: 'merchant_suspended',
        },
        {
          $set: {
            isActive: true,
          },
          $unset: {
            deactivatedReason: 1,
          },
        },
      );
      reactivatedProductCount = productUpdateResult.modifiedCount ?? (productUpdateResult as any).nModified ?? 0;

      for (const storeId of merchantStoreIds) {
        CacheInvalidator.invalidateStore(String(storeId)).catch((err) => {
          logger.warn(`[MERCHANT REACTIVATE] Failed to invalidate cache for store ${storeId}:`, err);
        });
      }

      CacheInvalidator.invalidateProductLists().catch((err) => {
        logger.warn('[MERCHANT REACTIVATE] Failed to invalidate product list caches:', err);
      });
    }

    // Notify merchant via socket about reactivation (room name must match RealTimeService: merchant-${id})
    if (isSocketInitialized()) {
      const merchantRoom = `merchant-${req.params.id}`;
      const merchantLivePayload = {
        merchantId: String(merchant._id),
        status: 'active' as const,
        timestamp: new Date().toISOString(),
      };
      getIO().to(merchantRoom).emit('merchant_reactivated', {
        reactivatedAt: new Date(),
      });
      // Unified event for generic merchant status listeners
      getIO()
        .to(merchantRoom)
        .emit('merchant-status-changed', {
          status: 'active',
          merchantId: String(merchant._id),
          message: 'Your merchant account has been reactivated!',
          changedAt: new Date().toISOString(),
        });
      // Admin live feed — admin panel subscribes to these events to update merchant list in real-time
      getIO().to('admin-room').emit('merchant:live', merchantLivePayload);
      getIO().to('admin-room').emit('merchant:reactivated', merchantLivePayload);
    }

    // P1-13: Send email notification to merchant about reactivation
    // Follows the same pattern as the approval handler above
    if (merchant.email) {
      setImmediate(() => {
        EmailService.send({
          to: merchant.email,
          subject: 'Your merchant account has been reactivated!',
          html: `
            <h2>Good news, ${merchant.ownerName || merchant.businessName}!</h2>
            <p>Your merchant account <strong>${merchant.businessName}</strong> has been reactivated.</p>
            <p>You can now resume accepting orders and managing your store.</p>
            <p>If you have any questions, please contact our support team.</p>
            <br/>
            <p>— The REZ Team</p>
          `,
          text: `Hi ${merchant.ownerName || merchant.businessName}, your merchant account ${merchant.businessName} has been reactivated. You can now resume accepting orders and managing your store.`,
        }).catch((emailErr: any) => {
          logger.warn(
            `[MERCHANT REACTIVATE] Failed to send reactivation email to ${merchant.email}:`,
            emailErr?.message,
          );
        });
      });
    }

    // AUDIT: log merchant reactivation with who/when/what
    setImmediate(() => {
      AdminAuditLog.create({
        adminId: (req as any).userId,
        action: 'MERCHANT_REACTIVATED',
        method: req.method,
        path: req.originalUrl.split('?')[0],
        targetId: String(merchant._id),
        targetType: 'merchant',
        ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
        requestBody: { merchantId: req.params.id },
        responseSuccess: true,
        responseStatus: 200,
        timestamp: new Date(),
      }).catch(() => {
        /* non-fatal */
      });
    });

    res.json({
      success: true,
      message: `Merchant reactivated successfully. ${reactivatedProductCount} product(s) restored.`,
      data: merchant,
      reactivatedProductCount,
    });
  }),
);

/**
 * @route   GET /api/admin/merchants/:id/live-status
 * @desc    Get real-time connection status for a merchant (POS, KDS, etc.)
 * @access  Admin
 */
router.get(
  '/:id/live-status',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const merchantId = req.params.id;

      // Check Redis for active socket presence
      let posConnected: string | null = null;
      let kdsConnected: string | null = null;
      let lastActivity: string | null = null;

      try {
        posConnected = await redisService.get<string>(`merchant:${merchantId}:pos:connected`);
        kdsConnected = await redisService.get<string>(`merchant:${merchantId}:kds:connected`);
        lastActivity = await redisService.get<string>(`merchant:${merchantId}:lastActivity`);
      } catch {
        // Non-fatal — continue with null values
      }

      // Count active orders (pending/in_progress) from DB
      try {
        const Order = require('../../models/Order').Order || require('../../models/Order').default;
        const activeOrderCount = await Order.countDocuments({
          merchantId,
          status: { $in: ['pending', 'confirmed', 'preparing', 'in_progress'] },
        }).catch(() => 0);

        res.json({
          success: true,
          data: {
            merchantId,
            posConnected: posConnected === '1',
            kdsConnected: kdsConnected === '1',
            lastActivity: lastActivity ? new Date(parseInt(lastActivity, 10)) : null,
            activeOrderCount,
            isLive: posConnected === '1' || kdsConnected === '1',
          },
        });
      } catch {
        res.json({
          success: true,
          data: {
            merchantId,
            posConnected: posConnected === '1',
            kdsConnected: kdsConnected === '1',
            lastActivity: lastActivity ? new Date(parseInt(lastActivity, 10)) : null,
            activeOrderCount: 0,
            isLive: posConnected === '1' || kdsConnected === '1',
          },
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }),
);

// ─── Per-Merchant Feature Flag Overrides ────────────────────────────────────

/**
 * @route   GET /api/admin/merchants/:id/feature-flags
 * @desc    Get all feature flag overrides for a specific merchant
 * @access  Admin
 */
router.get(
  '/:id/feature-flags',
  asyncHandler(async (req: Request, res: Response) => {
    const merchant = await Merchant.findById(req.params.id).select('_id businessName');
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const overrides = await MerchantFeatureFlag.find({ merchantId: req.params.id }).sort({ flagKey: 1 }).lean();

    return res.json({
      success: true,
      data: {
        merchantId: req.params.id,
        merchantName: (merchant as any).businessName,
        overrides,
      },
    });
  }),
);

/**
 * @route   POST /api/admin/merchants/:id/feature-flags
 * @desc    Create or update a feature flag override for a specific merchant
 * @access  Senior Admin
 */
router.post(
  '/:id/feature-flags',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { flagKey, enabled, overrideReason, expiresAt } = req.body;

    if (!flagKey || typeof enabled !== 'boolean' || !overrideReason) {
      return res.status(400).json({
        success: false,
        message: 'flagKey, enabled (boolean), and overrideReason are required',
      });
    }

    const merchant = await Merchant.findById(req.params.id).select('_id');
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    const setBy = (req as any).user?.email || (req as any).user?._id?.toString() || 'admin';

    const override = await MerchantFeatureFlag.findOneAndUpdate(
      { merchantId: req.params.id, flagKey },
      {
        merchantId: req.params.id,
        flagKey,
        enabled,
        overrideReason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        setBy,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await AdminAuditLog.create({
      adminId: (req as any).user?._id,
      action: 'merchant_flag_override',
      targetType: 'Merchant',
      targetId: req.params.id,
      requestBody: { flagKey, enabled, overrideReason },
    }).catch(() => {});

    return res.status(201).json({ success: true, data: { override } });
  }),
);

/**
 * @route   DELETE /api/admin/merchants/:id/feature-flags/:flagKey
 * @desc    Remove a feature flag override (merchant reverts to global flag)
 * @access  Senior Admin
 */
router.delete(
  '/:id/feature-flags/:flagKey',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await MerchantFeatureFlag.findOneAndDelete({
      merchantId: req.params.id,
      flagKey: req.params.flagKey,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Override not found' });
    }

    await AdminAuditLog.create({
      adminId: (req as any).user?._id,
      action: 'merchant_flag_override_removed',
      targetType: 'Merchant',
      targetId: req.params.id,
      requestBody: { flagKey: req.params.flagKey },
    }).catch(() => {});

    return res.json({ success: true, message: 'Flag override removed — merchant now uses global default' });
  }),
);

/**
 * @route   PATCH /api/admin/merchants/:merchantId/profile
 * @desc    CS-H8 — Admin update of merchant profile fields
 * @access  Admin
 */
router.patch(
  '/:merchantId/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const allowedFields = [
      'businessName',
      'businessType',
      'businessAddress',
      'phone',
      'email',
      'description',
      'verificationStatus',
    ];
    const update: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const merchant = await Merchant.findByIdAndUpdate(merchantId, { $set: update }, { new: true, runValidators: true });
    if (!merchant) return res.status(404).json({ success: false, message: 'Merchant not found' });

    await AdminAuditLog.create({
      adminId: (req as any).user?._id,
      action: 'merchant_profile_updated',
      targetType: 'Merchant',
      targetId: merchantId,
      requestBody: update,
    }).catch(() => {});

    res.json({ success: true, data: merchant });
  }),
);

export default router;
