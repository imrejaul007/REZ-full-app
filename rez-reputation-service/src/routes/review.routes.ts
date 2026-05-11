import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review, ReviewStatus, ReviewSource } from '../models/Review';
import { SentimentAnalysis } from '../models/SentimentAnalysis';
import { SentimentService } from '../services/SentimentService';
import { ResponseService } from '../services/ResponseService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

const reviewQuerySchema = paginationSchema.extend({
  hotelId: z.string().min(1),
  source: z.enum(Object.values(ReviewSource) as [string]).optional(),
  status: z.enum(Object.values(ReviewStatus) as [string]).optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional()
});

const createReviewSchema = z.object({
  hotelId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(1),
  language: z.string().default('en'),
  source: z.enum(Object.values(ReviewSource) as [string]).default('internal'),
  metadata: z.object({
    stayDate: z.string().optional(),
    roomType: z.string().optional(),
    travelType: z.string().optional()
  }).optional()
});

// Get reviews with filtering and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = reviewQuerySchema.parse(req.query);
    const { page, limit, hotelId, source, status, sentiment, rating, startDate, endDate, search } = query;

    // Build query
    const filter: Record<string, unknown> = { hotelId };

    if (source) filter.source = source;
    if (status) filter.status = status;
    if (sentiment) filter.sentiment = sentiment;
    if (rating) filter.rating = rating;

    if (startDate || endDate) {
      filter.receivedAt = {};
      if (startDate) (filter.receivedAt as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.receivedAt as Record<string, Date>).$lte = endDate;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter)
    ]);

    res.json({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single review by ID
router.get('/:reviewId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ reviewId }).lean();
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Get sentiment analysis if available
    const analysis = await SentimentAnalysis.findOne({ reviewId }).lean();

    res.json({
      review,
      analysis
    });
  } catch (error) {
    next(error);
  }
});

// Create a new review (internal submissions)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createReviewSchema.parse(req.body);

    const review = new Review({
      ...data,
      reviewId: `REV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      receivedAt: new Date(),
      metadata: {
        ...data.metadata,
        stayDate: data.metadata?.stayDate ? new Date(data.metadata.stayDate) : undefined
      }
    });

    await review.save();

    // Queue for sentiment analysis
    const sentimentService = new SentimentService();
    await sentimentService.queueAnalysis(review.reviewId);

    logger.info(`Review created: ${review.reviewId}`);

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

// Update review status
router.patch('/:reviewId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const { status } = z.object({
      status: z.enum(Object.values(ReviewStatus) as [string])
    }).parse(req.body);

    const review = await Review.findOneAndUpdate(
      { reviewId },
      { status },
      { new: true }
    );

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    logger.info(`Review ${reviewId} status updated to ${status}`);

    res.json(review);
  } catch (error) {
    next(error);
  }
});

// Re-analyze review sentiment
router.post('/:reviewId/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({ reviewId });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const sentimentService = new SentimentService();
    const analysis = await sentimentService.analyzeReview(reviewId);

    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

// Generate response for review
router.post('/:reviewId/respond', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reviewId } = req.params;
    const { autoApprove } = z.object({
      autoApprove: z.boolean().default(false)
    }).parse(req.body);

    const review = await Review.findOne({ reviewId });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const responseService = new ResponseService();
    const response = await responseService.generateResponse(reviewId);

    if (autoApprove) {
      // In production, this would auto-post if configured
      await responseService.approveResponse(response.responseId, 'system');
    }

    res.json({ response });
  } catch (error) {
    next(error);
  }
});

// Get review statistics
router.get('/stats/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.query);

    const [reviews, analysis] = await Promise.all([
      Review.find({ hotelId }),
      SentimentAnalysis.find({
        reviewId: { $in: (await Review.find({ hotelId })).map(r => r.reviewId) }
      })
    ]);

    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const sentimentCounts = {
      positive: reviews.filter(r => r.sentiment === 'positive').length,
      negative: reviews.filter(r => r.sentiment === 'negative').length,
      neutral: reviews.filter(r => r.sentiment === 'neutral').length
    };

    const sourceCounts: Record<string, number> = {};
    for (const review of reviews) {
      sourceCounts[review.source] = (sourceCounts[review.source] || 0) + 1;
    }

    const statusCounts: Record<string, number> = {};
    for (const review of reviews) {
      statusCounts[review.status] = (statusCounts[review.status] || 0) + 1;
    }

    // Calculate aspect scores
    const aspectScores: Record<string, { positive: number; negative: number; total: number }> = {};
    for (const a of analysis) {
      for (const aspect of a.aspects) {
        if (!aspectScores[aspect.aspect]) {
          aspectScores[aspect.aspect] = { positive: 0, negative: 0, total: 0 };
        }
        aspectScores[aspect.aspect].total++;
        if (aspect.sentiment === 'positive') aspectScores[aspect.aspect].positive++;
        if (aspect.sentiment === 'negative') aspectScores[aspect.aspect].negative++;
      }
    }

    res.json({
      totalReviews,
      avgRating: Math.round(avgRating * 100) / 100,
      sentimentCounts,
      sourceCounts,
      statusCounts,
      aspectScores
    });
  } catch (error) {
    next(error);
  }
});

// Search reviews
router.get('/search/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId, query: searchQuery, filters } = z.object({
      hotelId: z.string().min(1),
      query: z.string().min(2),
      filters: z.object({
        source: z.string().optional(),
        sentiment: z.string().optional(),
        minRating: z.number().optional(),
        maxRating: z.number().optional()
      }).optional()
    }).parse(req.query);

    const filter: Record<string, unknown> = {
      hotelId,
      $text: { $search: searchQuery }
    };

    if (filters) {
      if (filters.source) filter.source = filters.source;
      if (filters.sentiment) filter.sentiment = filters.sentiment;
      if (filters.minRating || filters.maxRating) {
        filter.rating = {};
        if (filters.minRating) (filter.rating as Record<string, number>).$gte = filters.minRating;
        if (filters.maxRating) (filter.rating as Record<string, number>).$lte = filters.maxRating;
      }
    }

    const reviews = await Review.find(filter, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(50)
      .lean();

    res.json({ data: reviews });
  } catch (error) {
    next(error);
  }
});

// Export responses pending approval
router.get('/responses/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.query);

    const responseService = new ResponseService();
    const pendingResponses = await responseService.getPendingResponses(hotelId);

    res.json({ data: pendingResponses });
  } catch (error) {
    next(error);
  }
});

export { router as reviewRoutes };
