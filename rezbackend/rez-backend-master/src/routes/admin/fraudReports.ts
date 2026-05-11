// @ts-nocheck
// Admin Fraud Report Routes
// CRUD and management for fraud reports

import { Router, Request, Response } from 'express';
import mongoose, { Schema, Types } from 'mongoose';
import { requireAuth, requireAdmin, requireSeniorAdmin } from '../../middleware/auth';
import { Wallet } from '../../models/Wallet';
import { User } from '../../models/User';
import { Order } from '../../models/Order';
import { AdminAuditLog } from '../../models/AdminAuditLog';
import { publishNotificationEvent } from '../../events/notificationQueue';
import { sendSuccess, sendError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

// ---------------------------------------------------------------------------
// Inline FraudReport model (avoids dependency on a separate model file)
// ---------------------------------------------------------------------------
const fraudReportSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: [
        'unauthorized_transaction',
        'account_takeover',
        'phishing',
        'fake_merchant',
        'counterfeit_product',
        'other',
      ],
      required: true,
    },
    description: { type: String, required: true },
    evidence: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['new', 'investigating', 'resolved', 'dismissed'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    internalNotes: [
      {
        note: { type: String },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    resolution: { type: String },
    actions: [
      {
        type: {
          type: String,
          enum: ['freeze_wallet', 'suspend_user', 'hold_orders'],
          required: true,
        },
        reason: { type: String },
        actedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actedAt: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
      },
    ],
  },
  { timestamps: true },
);

const FraudReport = mongoose.models.FraudReport || mongoose.model('FraudReport', fraudReportSchema);

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = Router();

// All routes require authenticated admin
router.use(requireAuth);
router.use(requireAdmin);

type FraudActionType = 'freeze_wallet' | 'suspend_user' | 'hold_orders';

function isValidReportId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

async function getFraudReportWithUser(id: string) {
  return FraudReport.findById(id).populate('user', 'fullName phoneNumber email role isActive').lean();
}

function getReportUserId(report: any): string {
  if (report?.user && typeof report.user === 'object' && report.user._id) {
    return String(report.user._id);
  }
  return String(report?.user);
}

async function appendFraudAction(
  reportId: string,
  adminId: string,
  actionType: FraudActionType,
  reason?: string,
  metadata?: Record<string, unknown>,
) {
  return FraudReport.findByIdAndUpdate(
    reportId,
    {
      $set: {
        status: 'investigating',
      },
      $push: {
        actions: {
          type: actionType,
          reason,
          actedBy: new Types.ObjectId(adminId),
          actedAt: new Date(),
          metadata,
        },
      },
    },
    { new: true, runValidators: true },
  )
    .populate('user', 'fullName phoneNumber email')
    .populate('assignedTo', 'fullName')
    .populate('internalNotes.addedBy', 'fullName')
    .populate('actions.actedBy', 'fullName email')
    .lean();
}

function createAdminAuditLog(
  req: Request,
  action: string,
  targetId: string,
  requestBody: Record<string, unknown>,
  changes?: {
    beforeValues?: Record<string, unknown>;
    afterValues?: Record<string, unknown>;
    changedFields?: string[];
  },
) {
  setImmediate(() => {
    AdminAuditLog.create({
      adminId: new Types.ObjectId(String((req as any).userId)),
      action,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      targetId,
      targetType: 'fraud-report',
      ip: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
      requestBody,
      responseSuccess: true,
      responseStatus: 200,
      timestamp: new Date(),
      ...(changes ? { changes } : {}),
    }).catch(() => {
      /* non-fatal */
    });
  });
}

/**
 * GET / — list fraud reports with pagination and filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status, priority, category, dateFrom, dateTo } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    if (dateFrom || dateTo) {
      query.createdAt = {} as any;
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) query.createdAt.$lte = new Date(dateTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      FraudReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'fullName phoneNumber')
        .populate('assignedTo', 'fullName')
        .lean(),
      FraudReport.countDocuments(query),
    ]);

    sendSuccess(res, {
      reports,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  }),
);

/**
 * GET /:id — fraud report detail with populated user info
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    const report = await FraudReport.findById(id)
      .populate('user', 'fullName phoneNumber email')
      .populate('assignedTo', 'fullName')
      .populate('internalNotes.addedBy', 'fullName')
      .populate('actions.actedBy', 'fullName email')
      .lean();

    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }

    sendSuccess(res, { report });
  }),
);

/**
 * PATCH /:id/status — update report status
 */
router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    const validStatuses = ['new', 'investigating', 'resolved', 'dismissed'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const report = await FraudReport.findByIdAndUpdate(id, { $set: { status } }, { new: true, runValidators: true })
      .populate('user', 'fullName phoneNumber')
      .populate('assignedTo', 'fullName')
      .lean();

    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }

    sendSuccess(res, { report });
  }),
);

/**
 * PATCH /:id/priority — set report priority
 */
router.patch(
  '/:id/priority',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { priority } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!priority || !validPriorities.includes(priority)) {
      return sendError(res, `Invalid priority. Must be one of: ${validPriorities.join(', ')}`, 400);
    }

    const report = await FraudReport.findByIdAndUpdate(id, { $set: { priority } }, { new: true, runValidators: true })
      .populate('user', 'fullName phoneNumber')
      .populate('assignedTo', 'fullName')
      .lean();

    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }

    sendSuccess(res, { report });
  }),
);

/**
 * POST /:id/notes — add an internal note
 */
router.post(
  '/:id/notes',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = (req as any).userId;

    if (!Types.ObjectId.isValid(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    if (!note || (typeof note === 'string' && note.trim().length === 0)) {
      return sendError(res, 'Note is required', 400);
    }

    const report = await FraudReport.findByIdAndUpdate(
      id,
      {
        $push: {
          internalNotes: {
            note: note.trim(),
            addedBy: new Types.ObjectId(adminId),
            addedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    )
      .populate('user', 'fullName phoneNumber')
      .populate('assignedTo', 'fullName')
      .populate('internalNotes.addedBy', 'fullName')
      .lean();

    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }

    sendSuccess(res, { report });
  }),
);

/**
 * POST /:id/freeze-wallet - freeze the reported user's wallet
 */
router.post(
  '/:id/freeze-wallet',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = String((req as any).userId);

    if (!isValidReportId(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    const report = await getFraudReportWithUser(id);
    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }
    const userId = getReportUserId(report);

    const walletBefore = await Wallet.findOne({ user: userId }).select('isFrozen frozenReason frozenAt').lean();
    if (!walletBefore) {
      return sendError(res, 'Wallet not found for the reported user', 404);
    }

    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          isFrozen: true,
          frozenReason: 'Fraud investigation',
          frozenAt: new Date(),
        },
      },
      { new: true },
    ).lean();

    if (!wallet) {
      return sendError(res, 'Failed to freeze wallet', 500);
    }

    const updatedReport = await appendFraudAction(id, adminId, 'freeze_wallet', 'Fraud investigation', {
      walletId: String(wallet._id),
      userId,
    });

    publishNotificationEvent({
      eventId: `fraud-report-freeze-wallet:${id}:${Date.now()}`,
      eventType: 'notification.wallet',
      userId,
      channels: ['push', 'in_app'],
      payload: {
        title: 'Wallet Frozen',
        body: 'Your wallet has been frozen while a fraud report is under investigation.',
      },
      category: 'security',
      source: 'admin',
      createdAt: new Date().toISOString(),
    });

    createAdminAuditLog(
      req,
      'FRAUD_REPORT_FREEZE_WALLET',
      id,
      { reportId: id, userId },
      {
        beforeValues: {
          isFrozen: walletBefore.isFrozen,
          frozenReason: walletBefore.frozenReason,
          frozenAt: walletBefore.frozenAt,
        },
        afterValues: {
          isFrozen: wallet.isFrozen,
          frozenReason: wallet.frozenReason,
          frozenAt: wallet.frozenAt,
        },
        changedFields: ['isFrozen', 'frozenReason', 'frozenAt'],
      },
    );

    sendSuccess(
      res,
      { report: updatedReport, wallet: { isFrozen: wallet.isFrozen, frozenAt: wallet.frozenAt } },
      'Wallet frozen for fraud investigation',
    );
  }),
);

/**
 * POST /:id/suspend-user - suspend the reported user
 */
router.post(
  '/:id/suspend-user',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = String((req as any).userId);

    if (!isValidReportId(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return sendError(res, 'Suspension reason is required', 400);
    }

    const report = await getFraudReportWithUser(id);
    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }
    const userId = getReportUserId(report);

    const userBefore = await User.findById(userId).select('isActive role suspendedAt suspendReason').lean();
    if (!userBefore) {
      return sendError(res, 'Reported user not found', 404);
    }

    if (userBefore.role === 'admin' || userBefore.role === 'super_admin') {
      return sendError(res, 'Cannot suspend admin users from fraud reports', 403);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isActive: false,
          suspendedAt: new Date(),
          suspendReason: reason.trim(),
        },
      },
      { new: true },
    ).lean();

    if (!user) {
      return sendError(res, 'Failed to suspend user', 500);
    }

    const updatedReport = await appendFraudAction(id, adminId, 'suspend_user', reason.trim(), { userId });

    publishNotificationEvent({
      eventId: `fraud-report-suspend-user:${id}:${Date.now()}`,
      eventType: 'notification.account',
      userId,
      channels: ['push', 'in_app'],
      payload: {
        title: 'Account Suspended',
        body: `Your account has been suspended during a fraud investigation. Reason: ${reason.trim()}`,
      },
      category: 'security',
      source: 'admin',
      createdAt: new Date().toISOString(),
    });

    createAdminAuditLog(
      req,
      'FRAUD_REPORT_SUSPEND_USER',
      id,
      { reportId: id, userId, reason: reason.trim() },
      {
        beforeValues: {
          isActive: userBefore.isActive,
          suspendedAt: (userBefore as any).suspendedAt,
          suspendReason: (userBefore as any).suspendReason,
        },
        afterValues: {
          isActive: user.isActive,
          suspendedAt: (user as any).suspendedAt,
          suspendReason: (user as any).suspendReason,
        },
        changedFields: ['isActive', 'suspendedAt', 'suspendReason'],
      },
    );

    sendSuccess(
      res,
      {
        report: updatedReport,
        user: {
          isActive: user.isActive,
          suspendedAt: (user as any).suspendedAt,
          suspendReason: (user as any).suspendReason,
        },
      },
      'Reported user suspended',
    );
  }),
);

/**
 * POST /:id/hold-orders - place a dispute hold on active orders for the reported user
 */
router.post(
  '/:id/hold-orders',
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = String((req as any).userId);

    if (!isValidReportId(id)) {
      return sendError(res, 'Invalid report ID', 400);
    }

    const report = await getFraudReportWithUser(id);
    if (!report) {
      return sendError(res, 'Fraud report not found', 404);
    }
    const userId = getReportUserId(report);

    const ordersBefore = await Order.find({
      user: userId,
      status: { $in: ['placed', 'confirmed', 'preparing'] },
    })
      .select('_id orderNumber status disputeHold')
      .lean();

    const updateResult = await Order.updateMany(
      {
        user: userId,
        status: { $in: ['placed', 'confirmed', 'preparing'] },
      },
      {
        $set: {
          disputeHold: true,
        },
      },
    );

    const heldCount = updateResult.modifiedCount ?? (updateResult as any).nModified ?? 0;
    const matchedCount = updateResult.matchedCount ?? (updateResult as any).n ?? 0;

    const updatedReport = await appendFraudAction(id, adminId, 'hold_orders', 'Active orders placed on fraud hold', {
      userId,
      matchedCount,
      heldCount,
      orderIds: ordersBefore.map((order) => String(order._id)),
    });

    createAdminAuditLog(
      req,
      'FRAUD_REPORT_HOLD_ORDERS',
      id,
      { reportId: id, userId },
      {
        beforeValues: {
          orders: ordersBefore.map((order) => ({
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            disputeHold: order.disputeHold,
          })),
        },
        afterValues: { matchedCount, heldCount },
        changedFields: ['disputeHold'],
      },
    );

    sendSuccess(
      res,
      {
        report: updatedReport,
        orders: {
          matchedCount,
          heldCount,
        },
      },
      matchedCount > 0 ? 'Active orders placed on hold' : 'No active orders found to place on hold',
    );
  }),
);

export default router;
