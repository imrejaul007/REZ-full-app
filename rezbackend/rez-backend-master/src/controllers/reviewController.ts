import { logger } from '../config/logger';
import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Store } from '../models/Store';
import { Order } from '../models/Order';
import { StorePayment } from '../models/StorePayment';
import { sendSuccess, sendCreated } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import activityService from '../services/activityService';
import redisService from '../services/redisService';
import mongoose from 'mongoose';

const REVIEW_CACHE_TTL = 5 * 60; // 5 minutes
import gamificationEventBus from '../events/gamificationEventBus';
import { reputationService } from '../services/reputationService';
import coinService from '../services/coinService';
import challengeService from '../services/challengeService';
import merchantNotificationService from '../services/merchantNotificationService';
import { Types } from 'mongoose';

// Get reviews for a store
export const getStoreReviews = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const {
    page = 1,
    limit = 20,
    rating,
    sortBy = 'newest',
    sort = 'newest', // Support both sortBy and sort for compatibility
  } = req.query;

  // Use sort if provided, otherwise use sortBy
  const sortParam = (sort || sortBy) as string;

  try {
    const userId = (req as any).userId || req.user?.id;

    // RACHEL: attack surface — input validation: validate storeId and query parameters
    if (typeof storeId !== 'string' || !storeId || storeId.length > 100) {
      return sendSuccess(res, { reviews: [], summary: {}, pagination: {} });
    }

    const pageNum = Math.max(1, Math.min(Number(page) || 1, 1000));
    const limitNum = Math.max(1, Math.min(Number(limit) || 20, 100));

    // Cache for anonymous users (most common case — store page visitors)
    const cacheKey = !userId && !rating ? `review:store:${storeId}:${sortParam}:${pageNum}:${limitNum}` : null;

    if (cacheKey) {
      const cached = await redisService.get<any>(cacheKey);
      if (cached) {
        return sendSuccess(res, cached, 'Reviews retrieved successfully');
      }
    }

    // Base query: show approved reviews to all users
    // Also show user's own pending reviews if they're the reviewer
    const query: any = {
      store: storeId,
      isActive: true,
      $or: [
        { moderationStatus: 'approved' }, // Show approved reviews to everyone
        ...(userId
          ? [
              {
                moderationStatus: 'pending',
                user: userId, // Show user's own pending reviews
              },
            ]
          : []),
      ],
    };

    // Filter by rating if provided
    if (rating !== undefined && rating !== '') {
      const ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return sendSuccess(res, { reviews: [], summary: {}, pagination: {} }, 'Invalid rating filter — must be 1–5');
      }
      query.rating = ratingNum;
    }

    // Sorting options
    let sortOptions: any = {};
    switch (sortParam) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'rating_high':
      case 'highest':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'rating_low':
      case 'lowest':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOptions = { helpful: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total, ratingStats] = await Promise.all([
      Review.find(query)
        .populate('user', 'profile.firstName profile.lastName profile.avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query),
      Review.getStoreRatingStats(storeId),
    ]);

    // If user has pending reviews, add them to the count for their view
    let adjustedStats = { ...ratingStats };
    if (userId) {
      const userPendingCount = await Review.countDocuments({
        store: storeId,
        user: userId,
        isActive: true,
        moderationStatus: 'pending',
      });

      if (userPendingCount > 0) {
        // Add pending reviews to total count for user's view
        adjustedStats.count = ratingStats.count + userPendingCount;
      }
    }

    // Transform reviews to match frontend format
    const transformedReviews = reviews.map((review: any) => {
      // Combine firstName and lastName to create full name
      // Fall back to userName field if user profile is not populated
      const firstName = review.user?.profile?.firstName || '';
      const lastName = review.user?.profile?.lastName || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || review.userName || 'Anonymous';

      return {
        id: review._id.toString(),
        _id: review._id.toString(),
        user: {
          id: review.user?._id?.toString() || review.user?.id || '',
          _id: review.user?._id?.toString() || review.user?.id || '',
          name: fullName,
          avatar: review.user?.profile?.avatar || review.user?.avatar,
        },
        moderationStatus: review.moderationStatus || 'approved', // Include moderation status
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || review.text || '',
        helpful: review.helpful || 0,
        createdAt: review.createdAt,
        verified: review.verified || false,
        images: review.images || [],
        metadata: review.metadata
          ? {
              cashbackEarned: review.metadata.cashbackEarned,
              orderNumber: review.metadata.orderNumber,
              purchaseDate: review.metadata.purchaseDate,
            }
          : undefined,
        merchantResponse: review.merchantResponse
          ? {
              message: review.merchantResponse.message,
              respondedAt: review.merchantResponse.respondedAt,
              respondedBy: review.merchantResponse.respondedBy?.toString() || '',
            }
          : undefined,
      };
    });

    // Transform rating stats to match frontend format
    // Note: averageRating and ratingBreakdown only include approved reviews
    // totalReviews includes user's own pending reviews for their view
    const summary = {
      averageRating: ratingStats.average || 0, // Only approved reviews
      totalReviews: adjustedStats.count || 0, // Includes user's pending reviews
      ratingBreakdown: {
        5: ratingStats.distribution?.[5] || 0, // Only approved reviews
        4: ratingStats.distribution?.[4] || 0,
        3: ratingStats.distribution?.[3] || 0,
        2: ratingStats.distribution?.[2] || 0,
        1: ratingStats.distribution?.[1] || 0,
      },
    };

    const result = {
      reviews: transformedReviews,
      summary,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total,
        limit: limitNum,
        hasNext: skip + reviews.length < total,
        hasPrevious: pageNum > 1,
      },
    };

    // Cache anonymous results for 5 minutes
    if (cacheKey) {
      redisService
        .set(cacheKey, result, REVIEW_CACHE_TTL)
        .catch((err) => logger.warn('[Review] Cache set for store reviews failed', { error: err.message }));
    }

    sendSuccess(res, result);
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Get store reviews error:', error);
    throw new AppError('Unable to retrieve reviews at this time', 500);
  }
});

// Get reviews for a product/service
export const getProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { page = 1, limit = 20, rating, sort = 'newest' } = req.query;

  try {
    // RACHEL: attack surface — input validation: validate productId and rating parameters
    if (typeof productId !== 'string' || !productId || productId.length > 100) {
      return sendSuccess(res, { reviews: [], summary: {}, pagination: {} });
    }

    if (rating && (typeof rating !== 'string' || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      return res.status(400).json({ success: false, error: 'Invalid rating filter' });
    }

    const pageNum = Math.max(1, Math.min(Number(page) || 1, 1000));
    const limitNum = Math.max(1, Math.min(Number(limit) || 20, 100));

    const query: any = {
      product: productId,
      isActive: true,
      moderationStatus: 'approved',
    };

    if (rating) {
      query.rating = Number(rating);
    }

    let sortOptions: any = {};
    switch (sort) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'highest':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOptions = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOptions = { helpful: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (pageNum - 1) * limitNum;

    // Run find, count, and aggregate stats in parallel — was 3 sequential round-trips
    // RACHEL: attack surface — NoSQL injection prevention: validate productId before aggregation
    const validProductId = mongoose.isValidObjectId(productId) ? productId : null;
    if (!validProductId) {
      return sendSuccess(res, { reviews: [], summary: {}, pagination: {} });
    }

    const [reviews, total, statsAgg] = await Promise.all([
      Review.find(query)
        .populate('user', 'profile.firstName profile.lastName profile.avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query),
      // Rating stats for this product
      Review.aggregate([
        { $match: { product: new Types.ObjectId(validProductId), isActive: true, moderationStatus: 'approved' } },
        {
          $group: {
            _id: null,
            average: { $avg: '$rating' },
            count: { $sum: 1 },
            r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = statsAgg[0] || { average: 0, count: 0, r5: 0, r4: 0, r3: 0, r2: 0, r1: 0 };

    const transformedReviews = reviews.map((review: any) => {
      const firstName = review.user?.profile?.firstName || '';
      const lastName = review.user?.profile?.lastName || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Anonymous';

      return {
        id: review._id.toString(),
        _id: review._id.toString(),
        user: {
          id: review.user?._id?.toString() || '',
          _id: review.user?._id?.toString() || '',
          name: fullName,
          avatar: review.user?.profile?.avatar,
        },
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || '',
        helpful: review.helpful || 0,
        createdAt: review.createdAt,
        verified: review.verified || false,
        images: review.images || [],
      };
    });

    sendSuccess(res, {
      reviews: transformedReviews,
      summary: {
        averageRating: Math.round((stats.average || 0) * 10) / 10,
        totalReviews: stats.count || 0,
        ratingBreakdown: { 5: stats.r5, 4: stats.r4, 3: stats.r3, 2: stats.r2, 1: stats.r1 },
      },
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
        hasNext: skip + reviews.length < total,
        hasPrevious: pageNum > 1,
      },
    });
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Get product reviews error:', error);
    throw new AppError('Unable to retrieve product reviews at this time', 500);
  }
});

// Create a new review
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { rating, title, comment, images } = req.body;
  const userId = (req as any).userId || req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  // Validate rating
  const ratingNum = Number(rating);
  if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
    throw new AppError('Rating must be an integer between 1 and 5', 400);
  }
  if (comment && typeof comment === 'string' && comment.trim().length > 2000) {
    throw new AppError('Review comment must not exceed 2000 characters', 400);
  }
  if (title && typeof title === 'string' && title.trim().length > 200) {
    throw new AppError('Review title must not exceed 200 characters', 400);
  }

  try {
    // RACHEL: attack surface — sequential ID validation: validate ObjectId format
    if (!mongoose.isValidObjectId(storeId)) {
      throw new AppError('Invalid store ID format', 400);
    }

    // Check if store exists
    const store = await Store.findById(storeId).lean();
    if (!store) {
      throw new AppError('Store not found', 404);
    }

    // Verify the user has a qualifying order or store payment at this store
    // - Delivery orders: must be 'delivered'
    // - In-store orders (dine_in, pickup, drive_thru): 'ready' or 'delivered' (user is at the store)
    // - Store payments (QR pay-in-store): must be 'completed'
    const [hasDeliveredOrder, hasInStoreOrder, hasStorePayment] = await Promise.all([
      Order.exists({
        user: userId,
        store: storeId,
        status: { $in: ['delivered', 'completed'] },
      }),
      Order.exists({
        user: userId,
        store: storeId,
        fulfillmentType: { $in: ['dine_in', 'pickup', 'drive_thru'] },
        status: { $in: ['ready', 'delivered', 'completed'] },
      }),
      StorePayment.exists({
        userId: userId,
        storeId: storeId,
        status: 'completed',
      }),
    ]);
    if (!hasDeliveredOrder && !hasInStoreOrder && !hasStorePayment) {
      throw new AppError('You can only review stores where you have a completed order or payment', 400);
    }

    // Check if user has already reviewed this store
    const existingReview = await Review.findOne({
      store: storeId,
      user: userId,
      isActive: true,
    }).lean();

    if (existingReview) {
      throw new AppError('You have already reviewed this store', 400);
    }

    // Create new review with pending status
    // Unique compound index { user, store } prevents duplicate reviews atomically
    let review;
    try {
      review = await Review.create({
        store: storeId,
        user: userId,
        rating,
        title,
        comment,
        images: images || [],
        verified: false, // Not verified until approved
        moderationStatus: 'pending', // Requires merchant approval
      });
    } catch (err: any) {
      if (err.code === 11000) {
        throw new AppError('You have already reviewed this store', 400);
      }
      throw err;
    }

    // Don't update store rating statistics yet - wait for approval
    // Store ratings will be updated when merchant approves the review

    // Populate user info for response
    await review.populate('user', 'profile.name profile.avatar');

    // Create activity for review submission
    await activityService.review.onReviewSubmitted(
      new Types.ObjectId(userId),
      new Types.ObjectId(review._id as any),
      store.name,
    );

    // Recalculate Privé reputation on review submission (fire-and-forget)
    reputationService
      .onReviewSubmitted(userId)
      .catch((err) => logger.warn('[REVIEW] Reputation recalculation failed:', err));

    // Emit gamification event for review submission
    gamificationEventBus.emit('review_submitted', {
      userId,
      entityId: String(review._id),
      entityType: 'review',
      source: { controller: 'reviewController', action: 'createReview' },
    });

    // Notify merchant about new review (fire-and-forget)
    try {
      const user = (await (await import('../models/User')).User.findById(userId).select('name profile').lean()) as any;
      const userName = user?.name || user?.profile?.firstName || 'A customer';

      await merchantNotificationService
        .notify({
          merchantId: store.merchantId?.toString() || '',
          type: 'new_review',
          priority: rating <= 2 ? 'urgent' : 'normal',
          title: rating <= 2 ? '⚠️ Low rating received' : 'New Review Received',
          message: `${userName} gave ${rating}⭐: "${(comment || '').slice(0, 60)}..."`,
          data: { storeId: store._id?.toString(), reviewId: review._id?.toString() },
        })
        .catch((err: any) => logger.error('[REVIEW] Failed to send merchant notification: ' + err.message));
    } catch (notifErr: any) {
      logger.error('[REVIEW] Notification error: ' + notifErr.message);
    }

    // Coin award moved to moderateReview (merchant approval)

    // Invalidate review caches for this store
    redisService
      .delPattern(`review:store:${req.body.store || req.body.storeId}:*`)
      .catch((err) => logger.warn('[Review] Cache invalidation for store reviews failed', { error: err.message }));
    redisService
      .delPattern('review:featured:*')
      .catch((err) => logger.warn('[Review] Cache invalidation for featured reviews failed', { error: err.message }));

    sendCreated(
      res,
      {
        review,
      },
      'Review submitted successfully. It will be visible after merchant approval.',
    );
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Create review error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Unable to create review at this time', 500);
  }
});

/**
 * Moderate a review (Approve/Reject)
 * Awards coins if approved
 */
export const moderateReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { status, reason } = req.body;
  const userId = (req as any).userId || req.user?.id; // Merchant/Admin ID

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  if (!['approved', 'rejected'].includes(status)) {
    throw new AppError('Invalid status. Must be "approved" or "rejected"', 400);
  }

  try {
    const review = await Review.findById(reviewId)
      .populate('user', 'profile.name profile.avatar')
      .populate('store', 'name rewardRules');

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Update moderation status
    review.moderationStatus = status;
    review.moderatedBy = new Types.ObjectId(userId);
    review.moderatedAt = new Date();
    if (reason) review.moderationReason = reason;

    await review.save();

    // If approved, update store ratings and award coins
    if (status === 'approved') {
      // 1. Update store rating statistics
      const ratingStats = await Review.getStoreRatingStats(review.store._id.toString());
      await Store.findByIdAndUpdate(review.store._id, {
        'ratings.average': ratingStats.average,
        'ratings.count': ratingStats.count,
        'ratings.distribution': ratingStats.distribution,
      });

      // 2. Award review bonus coins
      try {
        const store = review.store as any;
        const reviewBonusCoins = store.rewardRules?.reviewBonusCoins || 20;

        if (reviewBonusCoins > 0 && review.user) {
          await coinService.awardCoins(
            (review.user as any)._id,
            reviewBonusCoins,
            'review',
            `Review bonus for ${store.name}`,
            {
              storeId: store._id,
              storeName: store.name,
              reviewId: review._id,
              idempotencyKey: `review-reward:${(review.user as any)._id}:${review._id}`,
              referenceId: `review-reward:${(review.user as any)._id}:${review._id}`,
            },
          );
          logger.info(
            `💰 [MODERATION] Awarded ${reviewBonusCoins} coins to user ${(review.user as any)._id} for approved review`,
          );

          // Audit log for review reward issuance
          logger.info(
            JSON.stringify({
              event: 'REVIEW_REWARD_ISSUED',
              userId: String((review.user as any)._id),
              reviewId: String(review._id),
              storeId: String(store._id),
              amount: reviewBonusCoins,
              moderatorId: userId,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch (coinError) {
        logger.error('❌ [MODERATION] Error awarding review coins:', coinError);
        // Don't fail the moderation if coin award fails
      }

      // 3. Update challenge progress for review (non-blocking)
      if (review.user) {
        challengeService
          .updateProgress(String((review.user as any)._id), 'review_count', 1, {
            reviewId: String(review._id),
            storeId: String(review.store._id),
          })
          .catch((err) => logger.error('[REVIEW] Challenge progress update failed:', err));
      }
    }

    sendSuccess(
      res,
      {
        review,
      },
      `Review ${status} successfully`,
    );
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Moderate review error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Unable to moderate review at this time', 500);
  }
});

// Update a review
export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { rating, title, comment, images } = req.body;
  const userId = (req as any).userId || req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
      isActive: true,
    });

    if (!review) {
      throw new AppError('Review not found or you are not authorized to update it', 404);
    }

    // Store previous moderation status
    const wasApproved = review.moderationStatus === 'approved';

    // Update review
    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    // If review was approved and is being updated, reset to pending for re-approval
    if (wasApproved) {
      review.moderationStatus = 'pending';
      review.moderatedBy = undefined;
      review.moderatedAt = undefined;
      review.moderationReason = undefined;
    }

    await review.save();

    // Update store rating statistics if review was previously approved (to recalculate without this review)
    // or if it's still approved after update
    if (wasApproved || review.moderationStatus === 'approved') {
      const ratingStats = await Review.getStoreRatingStats(review.store.toString());
      await Store.findByIdAndUpdate(review.store, {
        'ratings.average': ratingStats.average,
        'ratings.count': ratingStats.count,
        'ratings.distribution': ratingStats.distribution,
      });
    }

    // Populate user info for response
    await review.populate('user', 'profile.name profile.avatar');

    sendSuccess(
      res,
      {
        review,
      },
      'Review updated successfully',
    );
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Update review error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Unable to update review at this time', 500);
  }
});

// Delete a review
export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const userId = (req as any).userId || req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const review = await Review.findOne({
      _id: reviewId,
      user: userId,
      isActive: true,
    });

    if (!review) {
      throw new AppError('Review not found or you are not authorized to delete it', 404);
    }

    // Soft delete the review
    review.isActive = false;
    await review.save();

    // Update store rating statistics
    const ratingStats = await Review.getStoreRatingStats(review.store.toString());
    await Store.findByIdAndUpdate(review.store, {
      'ratings.average': ratingStats.average,
      'ratings.count': ratingStats.count,
      'ratings.distribution': ratingStats.distribution,
    });

    sendSuccess(res, null, 'Review deleted successfully');
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Delete review error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Unable to delete review at this time', 500);
  }
});

// Mark review as helpful
export const markReviewHelpful = asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const userId = (req as any).userId || req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, isActive: true },
      { $inc: { helpful: 1 } },
      { new: true },
    );
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    sendSuccess(
      res,
      {
        helpful: review.helpful,
      },
      'Review marked as helpful',
    );
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Mark review helpful error:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Unable to update review feedback at this time', 500);
  }
});

// Get user's reviews
export const getUserReviews = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.user?.id;
  const { page = 1, limit = 20 } = req.query;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({
      user: userId,
      isActive: true,
    })
      .select('+moderationStatus +moderationReason +moderatedAt')
      .populate('store', 'name logo location.address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments({
      user: userId,
      isActive: true,
    });

    sendSuccess(res, {
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalReviews: total,
        hasNextPage: skip + reviews.length < total,
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Get user reviews error:', error);
    throw new AppError('Unable to retrieve your reviews at this time', 500);
  }
});

// Check if user can review store
export const canUserReviewStore = asyncHandler(async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const userId = (req as any).userId || req.user?.id;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const hasReviewed = await Review.hasUserReviewed(storeId, userId);

    sendSuccess(res, {
      canReview: !hasReviewed,
      hasReviewed,
    });
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Check user review eligibility error:', error);
    throw new AppError('Unable to check review eligibility at this time', 500);
  }
});

// Get featured reviews (public endpoint for UGC sections)
export const getFeaturedReviews = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, category } = req.query;

  try {
    const cacheKey = `review:featured:${category || 'all'}:${page}:${limit}`;
    const cached = await redisService.get<any>(cacheKey);
    if (cached) {
      return sendSuccess(res, cached, 'Featured reviews retrieved successfully');
    }

    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { isActive: true, status: 'approved' };

    // Prefer featured reviews, fall back to approved with images
    const featuredCount = await Review.countDocuments({ ...query, isFeaturedOnExplore: true });
    if (featuredCount > 0) {
      query.isFeaturedOnExplore = true;
    } else {
      query.images = { $exists: true, $ne: [] };
    }

    // Resolve category once upfront (was called twice — once before and once after the main query)
    let resolvedCat: any = null;
    if (category) {
      const { Category } = require('../models/Category');
      resolvedCat = await Category.findOne({ slug: category, isActive: true }).lean();
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'profile.firstName profile.lastName profile.avatar isVerified')
        .populate('store', 'name logo slug category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments(query),
    ]);

    // Filter by category on populated data if needed (reuse already-fetched resolvedCat)
    let filteredReviews = reviews;
    if (category && resolvedCat) {
      filteredReviews = reviews.filter((r: any) => r.store?.category?.toString() === resolvedCat._id.toString());
    }

    const result = {
      reviews: filteredReviews,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit),
      },
    };

    redisService
      .set(cacheKey, result, REVIEW_CACHE_TTL)
      .catch((err) => logger.warn('[Review] Cache set for featured reviews failed', { error: err.message }));

    sendSuccess(res, result, 'Featured reviews retrieved successfully');
  } catch (error) {
    // RACHEL: attack surface — verbose error responses: hide implementation details
    logger.error('Get featured reviews error:', error);
    throw new AppError('Unable to retrieve featured reviews at this time', 500);
  }
});
