import { logger } from '../config/logger';
// Referral Controller
// Handles referral program API endpoints

import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { sendSuccess, sendError, sendBadRequest, sendNotFound } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import referralService from '../services/referralService';
import redisService from '../services/redisService';
import { walletService } from '../services/walletService';
import { publishNotificationEvent } from '../events/notificationQueue';

/**
 * @desc    Get referral data
 * @route   GET /api/referral/data
 * @access  Private
 */
export const getReferralData = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    // Get user's referral information
    const user = await User.findById(userId).select('referral').lean();
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Get referral statistics
    const stats = await referralService.getReferralStats(new Types.ObjectId(userId));

    const referralData = {
      title: 'Refer and Earn',
      subtitle: 'Invite your friends and get free jewellery',
      inviteButtonText: 'Invite',
      inviteLink: `${process.env.FRONTEND_URL || 'https://app.rez.com'}/invite/${user.referral?.referralCode || ''}`,
      referralCode: user.referral?.referralCode || '',
      earnedRewards: user.referral?.referralEarnings || 0,
      totalReferrals: user.referral?.totalReferrals || 0,
      pendingRewards: stats.pendingEarnings || 0,
      completedReferrals: stats.completedReferrals || 0,
      isActive: true,
      rewardPerReferral: 100, // 100 RC per successful referral
      maxReferrals: 50, // Maximum referrals per user
    };

    sendSuccess(res, referralData, 'Referral data retrieved successfully');
  } catch (err) {
    logger.error('[REFERRAL] Failed to get referral data', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to get referral data', 500);
  }
});

/**
 * @desc    Get referral history
 * @route   GET /api/referral/history
 * @access  Private
 */
export const getReferralHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { page = 1, limit = 20 } = req.query;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const skip = (Number(page) - 1) * Number(limit);

    // `referral.referredBy` stores the referral CODE string (e.g. "JOHN123"),
    // NOT the referrer's userId. Look up the current user's code first, then
    // query referees by that code.
    const currentUser = await User.findById(userId).select('referral.referralCode').lean();
    const myReferralCode = currentUser?.referral?.referralCode;

    // If the user has no referral code yet nobody could have used it
    if (!myReferralCode) {
      return sendSuccess(
        res,
        {
          referrals: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
        'Referral history retrieved successfully',
      );
    }

    // Get referred users
    const referredUsers = await User.find({ 'referral.referredBy': myReferralCode })
      .select('profile.name createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments({ 'referral.referredBy': myReferralCode });

    const referrals = referredUsers.map((user) => ({
      id: (user._id as any).toString(),
      referredUser: {
        id: (user._id as any).toString(),
        name: (user.profile as any)?.firstName
          ? `${(user.profile as any).firstName} ${(user.profile as any).lastName || ''}`.trim()
          : 'Anonymous',
        email: (user as any).email ? (user as any).email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : undefined,
        joinedAt: user.createdAt,
      },
      status: 'completed', // For now, all referrals are considered completed
      rewardAmount: 100, // 100 RC per referral
      rewardStatus: 'credited',
      createdAt: user.createdAt,
      completedAt: user.createdAt,
    }));

    sendSuccess(
      res,
      {
        referrals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1,
        },
      },
      'Referral history retrieved successfully',
    );
  } catch (err) {
    logger.error('[REFERRAL] Failed to get referral history', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to get referral history', 500);
  }
});

/**
 * @desc    Get referral statistics
 * @route   GET /api/referral/statistics
 * @access  Private
 */
export const getReferralStatistics = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const stats = await referralService.getReferralStats(new Types.ObjectId(userId));

    const statistics = {
      totalReferrals: stats.totalReferrals || 0,
      completedReferrals: stats.completedReferrals || 0,
      pendingReferrals: stats.pendingReferrals || 0,
      totalEarned: stats.totalEarnings || 0,
      pendingEarnings: stats.pendingEarnings || 0,
      averageRewardPerReferral: stats.totalReferrals > 0 ? stats.totalEarnings / stats.totalReferrals : 0,
      conversionRate: stats.totalReferrals > 0 ? (stats.completedReferrals / stats.totalReferrals) * 100 : 0,
    };

    sendSuccess(res, statistics, 'Referral statistics retrieved successfully');
  } catch (err) {
    logger.error('[REFERRAL] Failed to get referral statistics', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to get referral statistics', 500);
  }
});

/**
 * @desc    Generate referral link
 * @route   POST /api/referral/generate-link
 * @access  Private
 */
export const generateReferralLink = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const user = await User.findById(userId).select('referral referralCode');
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Initialize referral object if missing
    if (!user.referral) {
      user.referral = {
        referralCode: '',
        referredUsers: [],
        totalReferrals: 0,
        referralEarnings: 0,
      };
    }

    // Generate referral code if not exists (will be auto-generated on save via pre-save hook)
    if (!user.referral.referralCode && !user.referralCode) {
      await user.save(); // This triggers the pre-save hook that generates referral.referralCode
      // NOTE: `user.populate('referral')` was here previously but `referral` is an
      // embedded subdocument, not a ref — populate() is a no-op on it.  After save()
      // the pre-save hook has already set user.referral.referralCode on the in-memory
      // document, so we can read it directly without an extra DB round-trip.
    }

    // Use either nested or top-level referral code
    const referralCode = user.referral?.referralCode || user.referralCode || '';

    if (!referralCode) {
      throw new AppError('Failed to generate referral code', 500);
    }

    const referralLink = `${process.env.FRONTEND_URL || 'https://app.rez.com'}/invite/${referralCode}`;

    sendSuccess(
      res,
      {
        referralLink,
        referralCode,
      },
      'Referral link generated successfully',
    );
  } catch (err) {
    logger.error('[REFERRAL] Failed to generate referral link', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to generate referral link', 500);
  }
});

/**
 * @desc    Share referral link
 * @route   POST /api/referral/share
 * @access  Private
 */
export const shareReferralLink = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { platform } = req.body;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  // ✅ Input validation: platform must be a valid string
  if (!platform || typeof platform !== 'string') {
    return sendBadRequest(res, 'Platform is required and must be a string');
  }

  // ✅ Input validation: platform must be one of allowed values
  const allowedPlatforms = ['whatsapp', 'telegram', 'email', 'sms', 'facebook', 'twitter', 'copy'];
  if (!allowedPlatforms.includes(platform.toLowerCase())) {
    return sendBadRequest(res, `Invalid platform. Must be one of: ${allowedPlatforms.join(', ')}`);
  }

  try {
    const user = await User.findById(userId).lean();
    if (!user || !user.referral?.referralCode) {
      return sendNotFound(res, 'User or referral code not found');
    }

    const _referralLink = `${process.env.FRONTEND_URL || 'https://app.rez.com'}/invite/${user.referral.referralCode}`;

    // In a real application, you would integrate with the respective platform APIs
    // For now, we'll just return success
    // Note: Logging without PII - only platform type and userId (sanitized)
    logger.info(`📱 [REFERRAL] User shared link via ${platform} - UserID: ${userId.toString().slice(-4)}`);

    sendSuccess(res, { success: true }, 'Referral link shared successfully');
  } catch (err) {
    logger.error('[REFERRAL] Failed to share referral link', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to share referral link', 500);
  }
});

/**
 * @desc    Claim referral rewards
 * @route   POST /api/referral/claim-rewards
 * @access  Private
 */
export const claimReferralRewards = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Atomically zero out referralEarnings and return the OLD value within the transaction
    const userBeforeClaim = await User.findOneAndUpdate(
      {
        _id: userId,
        'referral.referralEarnings': { $gt: 0 },
      },
      {
        $set: { 'referral.referralEarnings': 0 },
      },
      { new: false, session }, // Return the document BEFORE the update (contains the original earnings)
    );

    if (!userBeforeClaim) {
      await session.abortTransaction();
      session.endSession();
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        return sendNotFound(res, 'User not found');
      }
      return sendBadRequest(res, 'No pending rewards to claim');
    }

    const claimedAmount = userBeforeClaim.referral?.referralEarnings || 0;

    // Credit the Wallet model (the app's source of truth for coin balance).
    // The old code incremented user.wallet.balance (an embedded field on the User
    // document) which is NOT what the rest of the app reads — it uses the separate
    // Wallet collection.  Fix: atomic $inc on Wallet, capturing before/after balances
    // for the Transaction record.
    const walletBefore = await Wallet.findOne({ user: userId }).session(session).lean();
    const balanceBefore = walletBefore?.balance?.available ?? 0;

    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: userId },
      {
        $inc: {
          'balance.available': claimedAmount,
          'balance.total': claimedAmount,
          'statistics.totalEarned': claimedAmount,
        },
        $set: { lastTransactionAt: new Date() },
      },
      { new: true, session },
    );

    const balanceAfter = updatedWallet?.balance?.available ?? balanceBefore + claimedAmount;

    // Create transaction record within the same transaction
    const transaction = new Transaction({
      user: new Types.ObjectId(userId),
      type: 'credit',
      category: 'bonus',
      amount: claimedAmount,
      currency: 'RC',
      description: 'Referral rewards claimed',
      source: {
        type: 'referral',
        reference: userId,
        description: 'Referral program rewards',
      },
      balanceBefore,
      balanceAfter,
      status: {
        current: 'completed',
        history: [
          {
            status: 'completed',
            timestamp: new Date(),
          },
        ],
      },
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    sendSuccess(
      res,
      {
        success: true,
        totalClaimed: claimedAmount,
        transactionId: (transaction._id as any).toString(),
      },
      'Referral rewards claimed successfully',
    );
  } catch (err) {
    logger.error('[REFERRAL] Failed to claim referral rewards — transaction aborted', {
      error: err instanceof Error ? err.message : err,
    });
    await session.abortTransaction();
    session.endSession();
    throw new AppError('Failed to claim referral rewards', 500);
  }
});

/**
 * @desc    Get referral leaderboard
 * @route   GET /api/referral/leaderboard
 * @access  Private
 */
export const getReferralLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { period = 'month' } = req.query;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  if (!['week', 'month', 'year'].includes(period as string)) {
    return sendBadRequest(res, 'Invalid period. Must be one of: week, month, year');
  }

  try {
    // Cache leaderboard for 5 minutes (heavy aggregation, shared data)
    const cacheKey = `referral:leaderboard:${period}`;
    const cached = await redisService.get<any>(cacheKey);
    if (cached) {
      // Add user-specific rank from cached data
      const userEntry = cached.fullRanking?.find((u: any) => u.userId === userId);
      return sendSuccess(
        res,
        {
          leaderboard: cached.leaderboard,
          userRank: userEntry
            ? {
                rank: cached.fullRanking.indexOf(userEntry) + 1,
                totalReferrals: userEntry.totalReferrals || 0,
                totalEarned: userEntry.totalEarned || 0,
              }
            : null,
        },
        'Referral leaderboard retrieved successfully',
      );
    }

    // Get top referrers
    const topReferrers = await User.aggregate([
      {
        $match: {
          'referral.totalReferrals': { $gt: 0 },
        },
      },
      {
        $project: {
          name: {
            $concat: [{ $ifNull: ['$profile.firstName', ''] }, ' ', { $ifNull: ['$profile.lastName', ''] }],
          },
          totalReferrals: '$referral.totalReferrals',
          totalEarned: '$referral.referralEarnings',
          _id: 1,
        },
      },
      {
        $sort: { totalReferrals: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const leaderboard = topReferrers.map((user, index) => ({
      rank: index + 1,
      userId: (user._id as any).toString(),
      userName: user.name?.trim() || 'Anonymous',
      totalReferrals: user.totalReferrals,
      totalEarned: user.totalEarned,
    }));

    // Get current user's rank
    const userRank = await User.aggregate([
      {
        $match: {
          'referral.totalReferrals': { $gt: 0 },
        },
      },
      {
        $project: {
          totalReferrals: '$referral.totalReferrals',
          totalEarned: '$referral.referralEarnings',
          _id: 1,
        },
      },
      {
        $sort: { totalReferrals: -1 },
      },
    ]);

    const currentUserRank = userRank.findIndex((user) => (user._id as any).toString() === userId) + 1;
    const currentUser = userRank.find((user) => (user._id as any).toString() === userId);

    // Cache leaderboard + full ranking for user rank lookup
    const fullRanking = userRank.map((u) => ({
      userId: (u._id as any).toString(),
      totalReferrals: u.totalReferrals,
      totalEarned: u.totalEarned,
    }));
    redisService
      .set(cacheKey, { leaderboard, fullRanking }, 300)
      .catch((err) => logger.warn('[Referral] Cache set for leaderboard failed', { error: err.message })); // 5 min cache

    sendSuccess(
      res,
      {
        leaderboard,
        userRank:
          currentUserRank > 0
            ? {
                rank: currentUserRank,
                totalReferrals: currentUser?.totalReferrals || 0,
                totalEarned: currentUser?.totalEarned || 0,
              }
            : null,
      },
      'Referral leaderboard retrieved successfully',
    );
  } catch (err) {
    logger.error('[REFERRAL] Failed to get referral leaderboard', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to get referral leaderboard', 500);
  }
});

/**
 * @desc    Get referral code (frontend expects /code endpoint)
 * @route   GET /api/referral/code
 * @access  Private
 */
export const getReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const user = await User.findById(userId).select('referral referralCode');
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Initialize referral object if missing
    if (!user.referral) {
      user.referral = {
        referralCode: '',
        referredUsers: [],
        totalReferrals: 0,
        referralEarnings: 0,
      };
    }

    // Generate referral code if not exists (will be auto-generated on save via pre-save hook)
    if (!user.referral.referralCode && !user.referralCode) {
      await user.save(); // This triggers the pre-save hook that generates referral.referralCode
      // `referral` is an embedded subdoc, not a ref — populate() would be a no-op.
      // The pre-save hook sets user.referral.referralCode in-memory; read it directly.
    }

    // Use either nested or top-level referral code
    const referralCode = user.referral?.referralCode || user.referralCode || '';

    if (!referralCode) {
      throw new AppError('Failed to generate referral code', 500);
    }

    const referralLink = `${process.env.FRONTEND_URL || 'https://app.rez.com'}/invite/${referralCode}`;

    sendSuccess(
      res,
      {
        referralCode,
        referralLink,
        shareMessage: `Join Rez using my referral code ${referralCode} and get exclusive rewards!`,
      },
      'Referral code retrieved successfully',
    );
  } catch (err) {
    logger.error('[REFERRAL] Failed to get referral code', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to get referral code', 500);
  }
});

/**
 * @desc    Get referral stats (frontend expects /stats endpoint)
 * @route   GET /api/referral/stats
 * @access  Private
 */
export const getReferralStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const user = await User.findById(userId).select('referral wallet').lean();
    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    // Get referral statistics
    const stats = await referralService.getReferralStats(new Types.ObjectId(userId));

    // Count referred users — referredBy stores the CODE, not the userId
    const myCode = user.referral?.referralCode;
    const referredUsersCount = myCode ? await User.countDocuments({ 'referral.referredBy': myCode }) : 0;

    const referralStats = {
      totalReferrals: user.referral?.totalReferrals || referredUsersCount || 0,
      successfulReferrals: stats.completedReferrals || referredUsersCount || 0,
      pendingReferrals: stats.pendingReferrals || 0,
      totalEarned: user.referral?.referralEarnings || 0,
      availableBalance: user.wallet?.balance || 0,
      rewardPerReferral: 100,
      referralCode: user.referral?.referralCode || '',
      conversionRate:
        stats.totalReferrals > 0 ? ((stats.completedReferrals / stats.totalReferrals) * 100).toFixed(2) : '0.00',
      lifetimeEarnings: (user.referral?.totalReferrals || 0) * 100,
    };

    sendSuccess(res, referralStats, 'Referral stats retrieved successfully');
  } catch (err) {
    logger.error('[REFERRAL] Failed to get referral stats', { error: err instanceof Error ? err.message : err });
    throw new AppError('Failed to get referral stats', 500);
  }
});

// ─── Sprint 4: GET /api/referral/my-code ──────────────────────────────────────

/**
 * @desc    Get user's own referral code (generate if missing), plus referral count and coins earned
 * @route   GET /api/referral/my-code
 * @access  Private
 */
export const getMyReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  const user = await User.findById(userId).select('referral referralCode');
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  // Generate code if missing (pre-save hook creates it)
  if (!user.referral?.referralCode && !user.referralCode) {
    await user.save();
  }

  const code = user.referral?.referralCode || user.referralCode || '';
  if (!code) {
    throw new AppError('Failed to generate referral code', 500);
  }

  const referralCount = await User.countDocuments({ 'referral.referredBy': code });
  const coinsEarned = user.referral?.referralEarnings || 0;

  return sendSuccess(
    res,
    {
      referralCode: code,
      referralCount,
      coinsEarned,
    },
    'Referral code retrieved successfully',
  );
});

// ─── Sprint 4: POST /api/referral/apply ───────────────────────────────────────

/**
 * @desc    Apply a referral code — awards 100 coins to referee, 50 to referrer
 * @route   POST /api/referral/apply
 * @body    { referralCode: string }
 * @access  Private
 */
export const applyReferralCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) {
    return sendError(res, 'Authentication required', 401);
  }

  const { referralCode } = req.body;
  if (!referralCode || typeof referralCode !== 'string') {
    return sendBadRequest(res, 'referralCode is required');
  }

  const code = referralCode.trim().toUpperCase();

  // Prevent self-referral
  const currentUser = await User.findById(userId).select('referral referralCode').lean();
  if (!currentUser) {
    return sendNotFound(res, 'User not found');
  }

  const myCode = currentUser.referral?.referralCode || currentUser.referralCode || '';
  if (myCode && myCode === code) {
    return sendBadRequest(res, 'You cannot apply your own referral code');
  }

  // Prevent applying more than once
  if (currentUser.referral?.referredBy) {
    return sendBadRequest(res, 'You have already applied a referral code');
  }

  // Find the referrer
  const referrer = await User.findOne({
    $or: [{ 'referral.referralCode': code }, { referralCode: code }],
  }).lean();

  if (!referrer) {
    return sendBadRequest(res, 'Invalid referral code');
  }

  const referrerId = referrer._id.toString();

  // Record referredBy on current user
  await User.findByIdAndUpdate(userId, {
    $set: { 'referral.referredBy': code },
    $inc: { 'referral.totalReferrals': 0 }, // no-op to satisfy any pre-save hooks
  });

  // Increment referrer's count + earnings
  await User.findByIdAndUpdate(referrerId, {
    $push: { 'referral.referredUsers': userId },
    $inc: { 'referral.totalReferrals': 1, 'referral.referralEarnings': 50 },
  });

  // Award 100 coins to referee (current user)
  const refId = `referral:apply:referee:${userId}:${code}`;
  await walletService.credit({
    userId,
    amount: 100,
    source: 'referral',
    description: `Welcome bonus — referred by ${code}`,
    operationType: 'loyalty_credit' as any,
    referenceId: refId,
    referenceModel: 'Referral',
    metadata: { referralCode: code, referrerId },
  });

  // Award 50 coins to referrer
  const referrerRefId = `referral:apply:referrer:${referrerId}:${userId}`;
  await walletService.credit({
    userId: referrerId,
    amount: 50,
    source: 'referral',
    description: `Referral reward — ${userId} joined using your code`,
    operationType: 'loyalty_credit' as any,
    referenceId: referrerRefId,
    referenceModel: 'Referral',
    metadata: { referralCode: code, refereeId: userId },
  });

  // Fire-and-forget BullMQ notifications to both users
  const now = new Date().toISOString();

  publishNotificationEvent({
    eventId: `referral-apply-referee:${userId}:${code}`,
    eventType: 'coin_earned',
    userId,
    channels: ['push', 'in_app'],
    payload: {
      title: 'Coins Earned!',
      body: 'You earned 100 coins for joining with a referral code.',
      data: { screen: 'wallet', coins: 100 },
    },
    category: 'transactional',
    createdAt: now,
  }).catch(() => {});

  publishNotificationEvent({
    eventId: `referral-apply-referrer:${referrerId}:${userId}`,
    eventType: 'coin_earned',
    userId: referrerId,
    channels: ['push', 'in_app'],
    payload: {
      title: 'Referral Reward!',
      body: 'Someone joined using your referral code. You earned 50 coins!',
      data: { screen: 'wallet', coins: 50 },
    },
    category: 'transactional',
    createdAt: now,
  }).catch(() => {});

  const referrerName =
    (referrer as any).profile?.firstName || (referrer as any).fullName || (referrer as any).username || 'Your friend';

  return sendSuccess(
    res,
    {
      success: true,
      coinsEarned: 100,
      referrerName,
    },
    'Referral code applied successfully',
  );
});
