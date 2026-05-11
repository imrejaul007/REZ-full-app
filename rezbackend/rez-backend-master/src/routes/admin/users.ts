// @ts-nocheck
import { logger } from '../../config/logger';
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireAdmin, requireSeniorAdmin } from '../../middleware/auth';
import { User } from '../../models/User';
import { Wallet } from '../../models/Wallet';
import { CoinTransaction } from '../../models/CoinTransaction';
import { escapeRegex } from '../../utils/sanitize';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateQuery } from '../../middleware/validation';
import { adminUserSearchSchema } from '../../validators/financialValidators';
import redisService from '../../services/redisService';
import { adminActionRateLimit } from '../../middleware/rateLimiter';
import { TransactionAuditLog } from '../../models/TransactionAuditLog';

const router = Router();

// All routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination, filters, and search
 * @access  Admin
 */
router.get(
  '/',
  validateQuery(adminUserSearchSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    // Role filter
    if (req.query.role) {
      filter.role = req.query.role;
    }

    // Active status filter (support both isActive and status params)
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.status) {
      if (req.query.status === 'active') filter.isActive = true;
      else if (req.query.status === 'suspended') filter.isActive = false;
    }

    // Search by name, email, or phone
    if (req.query.search) {
      const searchRegex = { $regex: escapeRegex(req.query.search as string), $options: 'i' };
      filter.$or = [
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
        { fullName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
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

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // SANA: Response sanitization — exclude sensitive fields from list endpoint
        // wallet.balance, phone numbers, and auth tokens are NOT returned in bulk list to prevent data leakage
        .select(
          '_id email profile.firstName profile.lastName profile.avatar role isActive referral.referralCode createdAt auth.isVerified',
        ),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
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
 * @route   GET /api/admin/users/:id
 * @desc    Get single user details
 * @access  Admin
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id).select(
      '-auth.refreshToken -auth.otpCode -auth.otpExpiry -auth.lockUntil -password',
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  }),
);

/**
 * @route   GET /api/admin/users/:id/wallet
 * @desc    Get user's wallet details
 * @access  Admin
 */
router.get(
  '/:id/wallet',
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    // Verify user exists
    const user = await User.findById(req.params.id).select('_id phoneNumber email profile.firstName profile.lastName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get wallet details
    const wallet = await Wallet.findOne({ user: req.params.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for this user',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          phoneNumber: user.phoneNumber,
          email: user.email,
          name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'N/A',
        },
        wallet,
      },
    });
  }),
);

/**
 * @route   POST /api/admin/users/:id/suspend
 * @desc    Suspend a user account
 * @access  Admin
 */
router.post(
  '/:id/suspend',
  adminActionRateLimit,
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { reason } = req.body;

    // Require a meaningful suspension reason for compliance
    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required (minimum 10 characters)',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent suspending admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin users',
      });
    }

    // Check if already suspended
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already suspended',
      });
    }

    // Suspend the user
    user.isActive = false;
    await user.save();

    // Invalidate auth cache for this user to force re-authentication
    await redisService.del(`auth:user:${req.params.id}`);

    // Kill all active JWTs — any token issued before this timestamp will be rejected
    // by the isTokenIssuedBeforeLogoutAll check in the auth middleware (allLogout: prefix).
    // TTL of 30 days covers the maximum possible token lifetime (JWT_REFRESH_EXPIRES_IN default).
    await redisService.set(`allLogout:${req.params.id}`, Date.now(), 30 * 24 * 60 * 60);

    // Also freeze the user's wallet if exists
    const wallet = await Wallet.findOne({ user: req.params.id });
    if (wallet) {
      await wallet.freeze(reason || 'Account suspended by admin');
    }

    logger.info(
      `[ADMIN USERS] User ${user._id} suspended by admin ${req.userId}. Reason: ${reason || 'No reason provided'}`,
    );

    // Audit log: account state change (financial impact — wallet frozen alongside)
    TransactionAuditLog.create({
      userId: user._id,
      walletId: wallet?._id,
      walletType: 'user',
      operation: 'adjustment',
      amount: 0,
      currency: 'NC',
      balanceBefore: { total: 0, available: 0, pending: 0, cashback: 0 },
      balanceAfter: { total: 0, available: 0, pending: 0, cashback: 0 },
      reference: { type: 'other', description: `Account SUSPENDED by admin. Reason: ${reason}` },
      metadata: { source: 'admin', adminUserId: String(req.userId || (req as any).userId), ip: req.ip },
      status: 'success',
    }).catch((err: Error) => logger.error('[ADMIN USERS] Failed to write suspend audit log:', err.message));

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: {
        userId: user._id,
        isActive: user.isActive,
        suspendedAt: new Date(),
        reason: reason || 'No reason provided',
      },
    });
  }),
);

/**
 * @route   POST /api/admin/users/:id/unsuspend
 * @desc    Unsuspend a user account
 * @access  Admin
 */
router.post(
  '/:id/unsuspend',
  adminActionRateLimit,
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already active
    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is already active',
      });
    }

    // Unsuspend the user
    user.isActive = true;
    await user.save();

    // Also unfreeze the user's wallet if exists
    const wallet = await Wallet.findOne({ user: req.params.id });
    if (wallet && wallet.isFrozen) {
      await wallet.unfreeze();
    }

    logger.info(`[ADMIN USERS] User ${user._id} unsuspended by admin ${req.userId}`);

    // Audit log: account state restored
    TransactionAuditLog.create({
      userId: user._id,
      walletType: 'user',
      operation: 'adjustment',
      amount: 0,
      currency: 'NC',
      balanceBefore: { total: 0, available: 0, pending: 0, cashback: 0 },
      balanceAfter: { total: 0, available: 0, pending: 0, cashback: 0 },
      reference: { type: 'other', description: 'Account UNSUSPENDED by admin' },
      metadata: { source: 'admin', adminUserId: String(req.userId || (req as any).userId), ip: req.ip },
      status: 'success',
    }).catch((err: Error) => logger.error('[ADMIN USERS] Failed to write unsuspend audit log:', err.message));

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      data: {
        userId: user._id,
        isActive: user.isActive,
        unsuspendedAt: new Date(),
      },
    });
  }),
);

/**
 * @route   PUT /api/admin/users/:id/flag
 * @desc    Flag a user (disables auto-verify)
 * @access  Senior Admin (operator or above)
 */
router.put(
  '/:id/flag',
  adminActionRateLimit,
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const { reason } = req.body;
    const adminId = String((req as any).userId || (req as any).user?._id);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isFlagged: true,
          flagReason: reason || 'Flagged by admin',
          flaggedBy: adminId,
          flaggedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Audit log: account flag change
    TransactionAuditLog.create({
      userId: user._id,
      walletType: 'user',
      operation: 'adjustment',
      amount: 0,
      currency: 'NC',
      balanceBefore: { total: 0, available: 0, pending: 0, cashback: 0 },
      balanceAfter: { total: 0, available: 0, pending: 0, cashback: 0 },
      reference: { type: 'other', description: `Account FLAGGED by admin. Reason: ${reason || 'Flagged by admin'}` },
      metadata: { source: 'admin', adminUserId: adminId, ip: req.ip },
      status: 'success',
    }).catch((err: Error) => logger.error('[ADMIN USERS] Failed to write flag audit log:', err.message));

    res.json({
      success: true,
      message: 'User flagged. Auto-verify disabled.',
      data: { userId: user._id, isFlagged: true },
    });
  }),
);

/**
 * @route   PUT /api/admin/users/:id/unflag
 * @desc    Remove flag from a user
 * @access  Senior Admin (operator or above)
 */
router.put(
  '/:id/unflag',
  adminActionRateLimit,
  requireSeniorAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const adminId = String((req as any).userId || (req as any).user?._id);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isFlagged: false },
        $unset: { flagReason: 1, flaggedBy: 1, flaggedAt: 1 },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Audit log: account flag removed
    TransactionAuditLog.create({
      userId: user._id,
      walletType: 'user',
      operation: 'adjustment',
      amount: 0,
      currency: 'NC',
      balanceBefore: { total: 0, available: 0, pending: 0, cashback: 0 },
      balanceAfter: { total: 0, available: 0, pending: 0, cashback: 0 },
      reference: { type: 'other', description: 'Account UNFLAGGED by admin' },
      metadata: { source: 'admin', adminUserId: adminId, ip: req.ip },
      status: 'success',
    }).catch((err: Error) => logger.error('[ADMIN USERS] Failed to write unflag audit log:', err.message));

    res.json({
      success: true,
      message: 'User unflagged.',
      data: { userId: user._id, isFlagged: false },
    });
  }),
);

/**
 * @route   GET /api/admin/users/:id/transactions
 * @desc    Get recent coin transactions for a user (admin view)
 * @access  Admin
 */
router.get(
  '/:id/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const skip = (page - 1) * limit;

    const userId = new mongoose.Types.ObjectId(req.params.id);

    const [transactions, total] = await Promise.all([
      CoinTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id type amount description source createdAt')
        .lean(),
      CoinTransaction.countDocuments({ user: userId }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }),
);

export default router;
