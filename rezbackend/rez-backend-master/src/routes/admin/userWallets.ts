// @ts-nocheck
import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { Wallet } from '../../models/Wallet';
import mongoose, { ClientSession, Types } from 'mongoose';
import { User } from '../../models/User';
import { TransactionAuditLog, logTransaction } from '../../models/TransactionAuditLog';
import { escapeRegex } from '../../utils/sanitize';
import adminActionService from '../../services/adminActionService';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateQuery, validate } from '../../middleware/validation';
import {
  adminUserWalletSearchSchema,
  adminWalletAdjustSchema,
  adminWalletFreezeSchema,
  adminReverseCashbackSchema,
} from '../../validators/financialValidators';
import { adminActionRateLimit } from '../../middleware/rateLimiter';
import { publishNotificationEvent } from '../../events/notificationQueue';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/user-wallets
 * @desc    Search user wallets
 * @access  Admin
 */
router.get(
  '/',
  validateQuery(adminUserWalletSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    let userQuery: any = {};
    if (search) {
      const escapedSearch = escapeRegex(search as string);
      userQuery = {
        $or: [
          { phoneNumber: { $regex: escapedSearch, $options: 'i' } },
          { fullName: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } },
        ],
      };
    }

    const users = await User.find(userQuery)
      .select('phoneNumber fullName email profile.avatar')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const userIds = users.map((u) => u._id);
    const wallets = await Wallet.find({ user: { $in: userIds } }).lean();
    const walletMap = new Map(wallets.map((w) => [w.user.toString(), w]));

    const results = users.map((u) => ({
      user: u,
      wallet: walletMap.get(u._id.toString()) || null,
    }));

    const total = await User.countDocuments(userQuery);

    res.json({
      success: true,
      data: {
        users: results,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      },
    });
  }),
);

/**
 * @route   POST /api/admin/user-wallets/:userId/freeze
 * @desc    Freeze a user's wallet
 * @access  Admin
 */
router.post(
  '/:userId/freeze',
  adminActionRateLimit,
  validate(adminWalletFreezeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required to freeze a wallet' });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { user: req.params.userId },
      { isFrozen: true, frozenReason: reason.trim(), frozenAt: new Date() },
      { new: true },
    );

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    logTransaction({
      userId: new mongoose.Types.ObjectId(req.params.userId),
      walletId: wallet._id as mongoose.Types.ObjectId,
      walletType: 'user',
      operation: 'adjustment',
      amount: 0,
      balanceBefore: { total: wallet.balance.total, available: wallet.balance.available, pending: 0, cashback: 0 },
      balanceAfter: { total: wallet.balance.total, available: wallet.balance.available, pending: 0, cashback: 0 },
      reference: { type: 'other', description: `Wallet FROZEN by admin: ${reason.trim()}` },
      metadata: { source: 'admin', adminUserId: String((req as any).userId) },
    });

    publishNotificationEvent({
      eventId: `admin-wallet-freeze:${req.params.userId}:${Date.now()}`,
      eventType: 'notification.wallet',
      userId: req.params.userId,
      channels: ['push', 'in_app'],
      payload: {
        title: 'Wallet Frozen',
        body: 'Your wallet has been temporarily frozen. Please contact support for details.',
      },
      category: 'general',
      source: 'admin',
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Wallet frozen', data: { isFrozen: true } });
  }),
);

/**
 * @route   POST /api/admin/user-wallets/:userId/unfreeze
 * @desc    Unfreeze a user's wallet
 * @access  Admin
 */
router.post(
  '/:userId/unfreeze',
  adminActionRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.params.userId },
      { isFrozen: false, frozenReason: null, frozenAt: null },
      { new: true },
    );

    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    logTransaction({
      userId: new mongoose.Types.ObjectId(req.params.userId),
      walletId: wallet._id as mongoose.Types.ObjectId,
      walletType: 'user',
      operation: 'adjustment',
      amount: 0,
      balanceBefore: { total: wallet.balance.total, available: wallet.balance.available, pending: 0, cashback: 0 },
      balanceAfter: { total: wallet.balance.total, available: wallet.balance.available, pending: 0, cashback: 0 },
      reference: { type: 'other', description: 'Wallet UNFROZEN by admin' },
      metadata: { source: 'admin', adminUserId: String((req as any).userId) },
    });

    publishNotificationEvent({
      eventId: `admin-wallet-unfreeze:${req.params.userId}:${Date.now()}`,
      eventType: 'notification.wallet',
      userId: req.params.userId,
      channels: ['push', 'in_app'],
      payload: {
        title: 'Wallet Unfrozen',
        body: 'Your wallet has been unfrozen and is now active.',
      },
      category: 'general',
      source: 'admin',
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Wallet unfrozen', data: { isFrozen: false } });
  }),
);

/**
 * @route   POST /api/admin/user-wallets/:userId/adjust
 * @desc    Manual credit/debit adjustment with audit reason
 * @access  Admin (super_admin recommended)
 */
router.post(
  '/:userId/adjust',
  adminActionRateLimit,
  validate(adminWalletAdjustSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { amount, type, reason } = req.body;
    if (!amount || !type || !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Amount, type (credit/debit), and reason are required' });
    }
    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be "credit" or "debit"' });
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ success: false, message: 'Amount must be between 0 and 100,000 NC' });
    }

    // Threshold check — high-value operations require maker-checker approval
    const threshold = await adminActionService.getApprovalThreshold();
    if (adminActionService.requiresApproval(parsedAmount, threshold)) {
      const action = await adminActionService.createAction(
        String((req as any).userId),
        'manual_adjustment',
        { userId: req.params.userId, amount: parsedAmount, type, reason: reason.trim() },
        reason.trim(),
        threshold,
      );
      return res.status(202).json({
        success: true,
        message: `Amount exceeds threshold (${threshold} NC). Pending approval from another admin.`,
        data: { actionId: action._id, status: 'pending_approval' },
      });
    }

    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    const balanceBefore = {
      total: wallet.balance.total,
      available: wallet.balance.available,
      pending: 0,
      cashback: 0,
    };

    // Deterministic idempotency seed — same admin+user+amount+reason always
    // produces the same key, making retries safe and preventing phantom duplicates
    // caused by Date.now() producing different values across retry attempts.
    const adminId = String((req as any).userId);
    const idempotencySeed = `admin-adjust:${adminId}:${req.params.userId}:${parsedAmount}:${reason.trim()}`;

    // FIN-007 FIX: Wallet mutation + audit log written atomically in one MongoDB
    // session.  Previously, walletService ran its internal writes and then
    // logTransaction() was called afterwards as a separate unguarded step.
    // A crash between the two left balance changed but no immutable audit record —
    // creating an untraceable financial event that could mask embezzlement.
    //
    // The session is passed into walletService.credit/debit (which already accepts
    // an optional `session` param) so that the balance update, CoinTransaction,
    // LedgerEntry, and TransactionAuditLog all commit or roll back together.
    const { walletService } = await import('../../services/walletService');
    const session = await mongoose.startSession();
    let updated: any = null;

    try {
      await session.withTransaction(async () => {
        const mutationParams = {
          userId: req.params.userId,
          amount: parsedAmount,
          source: 'admin',
          description: `Admin adjustment: ${reason.trim()}`,
          operationType: 'admin_adjustment' as const,
          referenceId: idempotencySeed,
          referenceModel: 'AdminAction',
          metadata: { adminUserId: adminId, reason: reason.trim(), idempotencyKey: idempotencySeed },
          session,
        };

        if (type === 'credit') {
          await walletService.credit(mutationParams);
        } else {
          await walletService.debit(mutationParams);
        }

        // Read post-mutation balance within the same session for the audit snapshot
        updated = await Wallet.findOne({ user: req.params.userId }).session(session).lean();

        // Audit log committed atomically with the balance change — guaranteed 1-to-1
        await logTransaction({
          userId: new mongoose.Types.ObjectId(req.params.userId),
          walletId: wallet._id as mongoose.Types.ObjectId,
          walletType: 'user',
          operation: type === 'credit' ? 'credit' : 'debit',
          amount: parsedAmount,
          balanceBefore,
          balanceAfter: {
            total: updated?.balance.total || 0,
            available: updated?.balance.available || 0,
            pending: 0,
            cashback: 0,
          },
          reference: { type: 'adjustment', description: `Admin adjustment: ${reason.trim()}` },
          metadata: { source: 'admin', adminUserId: adminId },
          session,
        } as any);
      });
    } catch (walletErr: any) {
      return res.status(400).json({ success: false, message: walletErr.message || 'Wallet operation failed' });
    } finally {
      session.endSession();
    }

    publishNotificationEvent({
      eventId: `admin-wallet-adjust:${req.params.userId}:${Date.now()}`,
      eventType: 'notification.wallet',
      userId: req.params.userId,
      channels: ['push', 'in_app'],
      payload: {
        title: type === 'credit' ? 'Wallet Credited' : 'Wallet Debited',
        body: `Your wallet has been ${type === 'credit' ? 'credited with' : 'debited by'} ${parsedAmount} coins. Reason: ${reason.trim()}`,
      },
      category: 'general',
      source: 'admin',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `${type === 'credit' ? 'Credited' : 'Debited'} ${parsedAmount} NC`,
      data: { balance: updated?.balance },
    });
  }),
);

/**
 * @route   POST /api/admin/user-wallets/:userId/reverse-cashback
 * @desc    Reverse/clawback cashback from a user's wallet
 * @access  Admin (super_admin recommended)
 */
router.post(
  '/:userId/reverse-cashback',
  adminActionRateLimit,
  validate(adminReverseCashbackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { amount, originalTransactionId, reason } = req.body;
    if (!amount || !reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Amount and reason are required' });
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ success: false, message: 'Amount must be between 0 and 100,000 NC' });
    }

    // Threshold check — high-value reversals require maker-checker approval
    const threshold = await adminActionService.getApprovalThreshold();
    if (adminActionService.requiresApproval(parsedAmount, threshold)) {
      const action = await adminActionService.createAction(
        String((req as any).userId),
        'cashback_reversal',
        {
          userId: req.params.userId,
          amount: parsedAmount,
          originalTransactionId: originalTransactionId || undefined,
          reason: reason.trim(),
        },
        reason.trim(),
        threshold,
      );
      return res.status(202).json({
        success: true,
        message: `Amount exceeds threshold (${threshold} NC). Pending approval from another admin.`,
        data: { actionId: action._id, status: 'pending_approval' },
      });
    }

    const wallet = await Wallet.findOne({ user: req.params.userId });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    const balanceBefore = {
      total: wallet.balance.total,
      available: wallet.balance.available,
      pending: 0,
      cashback: 0,
    };

    const adminUserId = String((req as any).userId);
    let reversalTransactionId: string | undefined;

    // ROUTE-SEC-003 FIX: Wrap debit + audit log in a single MongoDB transaction.
    // Previously logTransaction() was fire-and-forget (not awaited), so if it failed
    // the debit committed without an audit trail. Now both operations are atomic.
    const session = await mongoose.startSession();
    let updated: {
      _id: Types.ObjectId;
      balance: { total: number; available: number; pending: number; cashback: number };
    } | null;

    try {
      session.startTransaction();

      if (originalTransactionId) {
        const { rewardEngine } = await import('../../core/rewardEngine');
        try {
          const result = await rewardEngine.reverseReward(originalTransactionId, reason.trim(), {
            partialAmount: parsedAmount,
            session,
          });
          reversalTransactionId = result?.reversalTransactionId?.toString();
        } catch (rewardErr: any) {
          await session.abortTransaction();
          const msg = rewardErr.message || 'Reversal failed';
          const status = msg.includes('not found') ? 404 : msg.includes('already') ? 409 : 400;
          return res.status(status).json({ success: false, message: msg });
        }
      } else {
        const { walletService } = await import('../../services/walletService');
        try {
          await walletService.debit({
            userId: req.params.userId,
            amount: parsedAmount,
            source: 'admin',
            description: `Cashback reversal by admin: ${reason.trim()}`,
            operationType: 'cashback_reversal',
            referenceId: `cashback-reversal:${req.params.userId}:${Date.now()}`,
            referenceModel: 'AdminAction',
            metadata: {
              adminUserId,
              reason: reason.trim(),
              // IDEMPOTENCY FIX: crypto.randomUUID() replaces Date.now() for collision-safe idempotency.
              idempotencyKey: `cashback-rev:${req.params.userId}:${randomUUID()}`,
            },
            session,
          });
        } catch (walletErr: any) {
          await session.abortTransaction();
          return res
            .status(400)
            .json({ success: false, message: walletErr.message || 'Insufficient balance for reversal' });
        }
      }

      updated = (await Wallet.findOne({ user: req.params.userId }).session(session).lean()) as typeof updated;

      // ROUTE-SEC-003 FIX: Now awaited inside the transaction — rollback if it fails
      await logTransaction(
        {
          userId: new mongoose.Types.ObjectId(req.params.userId),
          walletId: wallet._id as mongoose.Types.ObjectId,
          walletType: 'user',
          operation: 'debit',
          amount: parsedAmount,
          balanceBefore,
          balanceAfter: {
            total: updated?.balance.total || 0,
            available: updated?.balance.available || 0,
            pending: 0,
            cashback: 0,
          },
          reference: { type: 'adjustment', description: `Cashback reversal by admin: ${reason.trim()}` },
          metadata: { source: 'admin', adminUserId },
        },
        session,
      );

      await session.commitTransaction();
    } catch (txErr: any) {
      await session.abortTransaction();
      return res.status(500).json({ success: false, message: txErr.message || 'Transaction failed' });
    } finally {
      session.endSession();
    }

    // Notification is fire-and-forget — non-critical, should not fail the response
    publishNotificationEvent({
      eventId: `admin-cashback-reversal:${req.params.userId}:${Date.now()}`,
      eventType: 'notification.wallet',
      userId: req.params.userId,
      channels: ['push', 'in_app'],
      payload: {
        title: 'Cashback Reversed',
        body: `A cashback of ${parsedAmount} coins has been reversed from your wallet. Reason: ${reason.trim()}`,
      },
      category: 'general',
      source: 'admin',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Reversed ${parsedAmount} NC cashback`,
      data: { amount: parsedAmount, newBalance: updated?.balance, reversalTransactionId },
    });
  }),
);

/**
 * @route   GET /api/admin/user-wallets/:userId/audit-trail
 * @desc    Get audit trail for a user's wallet
 * @access  Admin
 */
router.get(
  '/:userId/audit-trail',
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [logs, total] = await Promise.all([
      TransactionAuditLog.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      TransactionAuditLog.countDocuments({ userId: req.params.userId }),
    ]);

    res.json({
      success: true,
      data: {
        auditLogs: logs,
        pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
      },
    });
  }),
);

export default router;
