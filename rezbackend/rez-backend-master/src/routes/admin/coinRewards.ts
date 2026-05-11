// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import SocialMediaPost from '../../models/SocialMediaPost';
import { awardCoins } from '../../services/coinService';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

// All routes require admin authentication
router.use(requireAuth);
router.use(requireAdmin);

/**
 * Map a SocialMediaPost document to the admin frontend's expected format
 */
function mapPostToReward(post: any) {
  return {
    _id: post._id,
    user: post.user,
    amount: post.cashbackAmount || 0,
    percentage: post.cashbackPercentage || 0,
    source: 'social_media_post',
    referenceType: 'post',
    referenceId: post.postUrl || '',
    postUrl: post.postUrl || '',
    platform: post.platform || '',
    posterTitle: post.metadata?.orderNumber || 'Promotional Poster',
    posterId: post.metadata?.postId || '',
    status: post.status,
    submittedAt: post.submittedAt,
    reviewedAt: post.reviewedAt,
    creditedAt: post.creditedAt,
    reviewedBy: post.reviewedBy,
    rejectionReason: post.rejectionReason,
    approvalNotes: post.approvalNotes,
    metadata: post.metadata,
  };
}

/**
 * @route   GET /api/admin/coin-rewards
 * @desc    Get social media post submissions for review
 * @access  Admin
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Status filter (default to pending)
    filter.status = req.query.status || 'pending';

    // Source filter (platform)
    if (req.query.source) {
      filter.platform = req.query.source;
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      filter.submittedAt = {};
      if (req.query.dateFrom) {
        filter.submittedAt.$gte = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filter.submittedAt.$lte = new Date(req.query.dateTo as string);
      }
    }

    const [posts, total] = await Promise.all([
      SocialMediaPost.find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'profile.firstName profile.lastName phoneNumber email')
        .populate('reviewedBy', 'profile.firstName profile.lastName'),
      SocialMediaPost.countDocuments(filter),
    ]);

    const rewards = posts.map(mapPostToReward);

    res.json({
      success: true,
      data: {
        rewards,
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
 * @route   GET /api/admin/coin-rewards/stats
 * @desc    Get submission statistics
 * @access  Admin
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await SocialMediaPost.aggregate([
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$cashbackAmount' } } }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const byStatus = stats[0].byStatus.reduce((acc: any, item: any) => {
      acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
      return acc;
    }, {});

    const result = {
      total: stats[0].total[0]?.count || 0,
      pending: byStatus.pending?.count || 0,
      approved: byStatus.approved?.count || 0,
      rejected: byStatus.rejected?.count || 0,
      credited: byStatus.credited?.count || 0,
      totalCoinsAwarded: byStatus.credited?.totalAmount || 0,
      totalCoinsPending: byStatus.pending?.totalAmount || 0,
    };

    res.json({
      success: true,
      data: result,
    });
  }),
);

/**
 * @route   GET /api/admin/coin-rewards/:id
 * @desc    Get single submission details
 * @access  Admin
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const post = await SocialMediaPost.findById(req.params.id)
      .populate('user', 'profile phoneNumber email')
      .populate('reviewedBy', 'profile.firstName profile.lastName');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: mapPostToReward(post),
    });
  }),
);

/**
 * @route   POST /api/admin/coin-rewards/:id/approve
 * @desc    Approve a pending submission and credit coins to user
 * @access  Admin
 */
router.post(
  '/:id/approve',
  asyncHandler(async (req: Request, res: Response) => {
    const adminId = new Types.ObjectId(req.userId);
    const { notes } = req.body;

    // Atomic claim: only transitions from 'pending' → 'credited' in a single DB op,
    // preventing double-credit when two concurrent requests race on the same post.
    const post = await SocialMediaPost.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      {
        $set: {
          status: 'credited',
          reviewedAt: new Date(),
          creditedAt: new Date(),
          reviewedBy: adminId,
          ...(notes ? { approvalNotes: notes } : {}),
        },
      },
      { new: true },
    );

    if (!post) {
      // Either the document does not exist or it was already processed by another request.
      const existing = await SocialMediaPost.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }
      return res.status(409).json({
        success: false,
        message: `Post already processed or not found (current status: ${existing.status})`,
      });
    }

    // Credit coins to user via coinService — safe because we atomically own the transition above.
    const userId = post.user.toString();
    const coinsToAward = post.cashbackAmount || 0;

    if (coinsToAward > 0) {
      await awardCoins(
        userId,
        coinsToAward,
        'social_share_reward',
        `Social media share bonus (${post.platform}) - poster: ${post.metadata?.orderNumber || 'Promotional'}`,
        {
          postId: (post._id as any).toString(),
          platform: post.platform,
          postUrl: post.postUrl,
          referenceId: `social_share_reward:${(post._id as any).toString()}`,
        },
      );
    }

    res.json({
      success: true,
      message: `Approved and credited ${coinsToAward} coins to user`,
      data: mapPostToReward(post),
    });
  }),
);

/**
 * @route   POST /api/admin/coin-rewards/:id/reject
 * @desc    Reject a pending submission
 * @access  Admin
 */
router.post(
  '/:id/reject',
  asyncHandler(async (req: Request, res: Response) => {
    const post = await SocialMediaPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    if (post.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject submission with status: ${post.status}`,
      });
    }

    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const adminId = new Types.ObjectId(req.userId);
    post.status = 'rejected';
    post.reviewedAt = new Date();
    post.reviewedBy = adminId;
    post.rejectionReason = reason;
    await post.save();

    res.json({
      success: true,
      message: 'Submission rejected',
      data: mapPostToReward(post),
    });
  }),
);

/**
 * @route   POST /api/admin/coin-rewards/bulk-approve
 * @desc    Bulk approve multiple pending submissions
 * @access  Admin
 */
router.post(
  '/bulk-approve',
  asyncHandler(async (req: Request, res: Response) => {
    const { rewardIds, notes } = req.body;

    // Guard: must be a non-empty array capped at 500 to prevent N+1 self-DoS.
    if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward IDs array is required',
      });
    }
    if (rewardIds.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'rewardIds must be an array of max 500 items',
      });
    }

    const adminId = new Types.ObjectId(req.userId);
    const objectIds = rewardIds.map((id: string) => new Types.ObjectId(id));
    const now = new Date();

    // Atomic bulk status claim: only posts still at 'pending' are transitioned.
    // Any post already processed by a concurrent request is simply skipped.
    await SocialMediaPost.updateMany(
      { _id: { $in: objectIds }, status: 'pending' },
      {
        $set: {
          status: 'credited',
          reviewedAt: now,
          creditedAt: now,
          reviewedBy: adminId,
          ...(notes ? { approvalNotes: notes } : {}),
        },
      },
    );

    // Fetch only the posts we atomically claimed so we never double-award coins.
    const claimedPosts = await SocialMediaPost.find({
      _id: { $in: objectIds },
      status: 'credited',
      reviewedBy: adminId,
      reviewedAt: now,
    });

    const results = { approved: 0, failed: 0, errors: [] as string[] };

    for (const post of claimedPosts) {
      try {
        const coinsToAward = post.cashbackAmount || 0;
        if (coinsToAward > 0) {
          await awardCoins(
            post.user.toString(),
            coinsToAward,
            'social_share_reward',
            `Social media share bonus (${post.platform})`,
            {
              postId: (post._id as any).toString(),
              platform: post.platform,
              postUrl: post.postUrl,
              referenceId: `social_share_reward:${(post._id as any).toString()}`,
            },
          );
        }
        results.approved++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${(post._id as any).toString()}: ${err.message}`);
      }
    }

    // Any IDs that were not claimed were already processed or not found.
    const skipped = rewardIds.length - claimedPosts.length;
    if (skipped > 0) {
      results.failed += skipped;
    }

    res.json({
      success: true,
      message: `Approved ${results.approved} submissions, ${results.failed} failed`,
      data: { processed: results.approved, ...results },
    });
  }),
);

/**
 * @route   POST /api/admin/coin-rewards/bulk-reject
 * @desc    Bulk reject multiple pending submissions
 * @access  Admin
 */
router.post(
  '/bulk-reject',
  asyncHandler(async (req: Request, res: Response) => {
    const { rewardIds, reason } = req.body;

    if (!rewardIds || !Array.isArray(rewardIds) || rewardIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward IDs array is required',
      });
    }

    if (rewardIds.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'rewardIds must be an array of max 500 items',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const adminId = new Types.ObjectId(req.userId);
    const results = { rejected: 0, failed: 0, errors: [] as string[] };

    for (const rewardId of rewardIds) {
      try {
        const post = await SocialMediaPost.findById(rewardId);
        if (post && post.status === 'pending') {
          post.status = 'rejected';
          post.reviewedAt = new Date();
          post.reviewedBy = adminId;
          post.rejectionReason = reason;
          await post.save();
          results.rejected++;
        } else {
          results.failed++;
          results.errors.push(`${rewardId}: Not found or not pending`);
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${rewardId}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Rejected ${results.rejected} submissions, ${results.failed} failed`,
      data: { processed: results.rejected, ...results },
    });
  }),
);

export default router;
