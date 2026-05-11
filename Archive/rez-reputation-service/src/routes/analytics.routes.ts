import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review, ReviewSource, SentimentLabel } from '../models/Review';
import { SentimentAnalysis } from '../models/SentimentAnalysis';
import { SentimentService } from '../services/SentimentService';
import { AlertService } from '../services/AlertService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const analyticsQuerySchema = z.object({
  hotelId: z.string().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  days: z.coerce.number().min(1).max(365).default(30),
  sources: z.string().transform(s => s.split(',')).optional()
});

// Get dashboard overview
router.get('/dashboard/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.params);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all reviews for the hotel
    const reviews = await Review.find({
      hotelId,
      receivedAt: { $gte: thirtyDaysAgo }
    });

    // Calculate metrics
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Sentiment breakdown
    const sentimentCounts = {
      positive: reviews.filter(r => r.sentiment === SentimentLabel.POSITIVE).length,
      negative: reviews.filter(r => r.sentiment === SentimentLabel.NEGATIVE).length,
      neutral: reviews.filter(r => r.sentiment === SentimentLabel.NEUTRAL).length,
      unprocessed: reviews.filter(r => !r.sentiment).length
    };

    // Source breakdown
    const sourceBreakdown: Record<string, { count: number; avgRating: number }> = {};
    for (const source of Object.values(ReviewSource)) {
      const sourceReviews = reviews.filter(r => r.source === source);
      if (sourceReviews.length > 0) {
        sourceBreakdown[source] = {
          count: sourceReviews.length,
          avgRating: sourceReviews.reduce((sum, r) => sum + r.rating, 0) / sourceReviews.length
        };
      }
    }

    // Rating distribution
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };

    // Recent trend (last 7 days vs previous 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentReviews = reviews.filter(r => r.receivedAt >= sevenDaysAgo);
    const previousReviews = reviews.filter(r => r.receivedAt >= fourteenDaysAgo && r.receivedAt < sevenDaysAgo);

    const recentAvgRating = recentReviews.length > 0
      ? recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
      : 0;

    const previousAvgRating = previousReviews.length > 0
      ? previousReviews.reduce((sum, r) => sum + r.rating, 0) / previousReviews.length
      : 0;

    const ratingTrend = recentAvgRating - previousAvgRating;

    // Response metrics
    const respondedReviews = reviews.filter(r => r.status === 'responded');
    const pendingResponses = reviews.filter(r =>
      r.status === 'processed' &&
      r.sentiment !== SentimentLabel.NEGATIVE
    );

    // Get alert stats
    const alertService = new AlertService(
      new (require('ioredis').Redis)(process.env.REDIS_URL || 'redis://localhost:6379')
    );
    const alertStats = await alertService.getAlertStats(hotelId);

    res.json({
      overview: {
        totalReviews,
        avgRating: Math.round(avgRating * 100) / 100,
        ratingTrend: Math.round(ratingTrend * 100) / 100
      },
      sentimentBreakdown: sentimentCounts,
      sourceBreakdown,
      ratingDistribution,
      responseMetrics: {
        totalResponded: respondedReviews.length,
        pendingResponses: pendingResponses.length,
        responseRate: totalReviews > 0
          ? Math.round((respondedReviews.length / totalReviews) * 100)
          : 0
      },
      alerts: {
        open: alertStats.open,
        acknowledged: alertStats.acknowledged,
        critical: alertStats.bySeverity.critical
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get sentiment trends over time
router.get('/trends/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.params);

    const { days } = z.object({
      days: z.coerce.number().min(1).max(365).default(30)
    }).parse(req.query);

    const sentimentService = new SentimentService();
    const trends = await sentimentService.getSentimentTrends(hotelId, days);

    res.json(trends);
  } catch (error) {
    next(error);
  }
});

// Get aspect analysis
router.get('/aspects/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.params);

    const { days } = z.object({
      days: z.coerce.number().min(1).max(365).default(30)
    }).parse(req.query);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const reviews = await Review.find({
      hotelId,
      receivedAt: { $gte: since }
    });

    const analyses = await SentimentAnalysis.find({
      reviewId: { $in: reviews.map(r => r.reviewId) }
    });

    // Aggregate aspect scores
    const aspectStats: Record<string, {
      mentions: number;
      positive: number;
      negative: number;
      neutral: number;
      score: number;
    }> = {};

    for (const analysis of analyses) {
      for (const aspect of analysis.aspects) {
        if (!aspectStats[aspect.aspect]) {
          aspectStats[aspect.aspect] = {
            mentions: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            score: 0
          };
        }

        aspectStats[aspect.aspect].mentions++;
        aspectStats[aspect.aspect][aspect.sentiment]++;

        // Calculate running score
        const scoreMap = { positive: 1, neutral: 0, negative: -1 };
        const current = aspectStats[aspect.aspect];
        current.score = (current.score * (current.mentions - 1) + scoreMap[aspect.sentiment]) / current.mentions;
      }
    }

    // Calculate overall scores and rankings
    const aspectRankings = Object.entries(aspectStats)
      .map(([aspect, stats]) => ({
        aspect,
        mentions: stats.mentions,
        positivePercent: Math.round((stats.positive / stats.mentions) * 100),
        negativePercent: Math.round((stats.negative / stats.mentions) * 100),
        score: Math.round(stats.score * 100) / 100,
        status: stats.score > 0.3 ? 'good' : stats.score < -0.3 ? 'needs_improvement' : 'neutral'
      }))
      .sort((a, b) => b.mentions - a.mentions);

    res.json({
      aspectRankings,
      totalReviewsAnalyzed: analyses.length
    });
  } catch (error) {
    next(error);
  }
});

// Compare with competitors
router.get('/compare/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.params);

    const { competitorIds, days } = z.object({
      competitorIds: z.string().transform(s => s.split(',')),
      days: z.coerce.number().min(1).max(365).default(30)
    }).parse(req.query);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get own hotel stats
    const ownReviews = await Review.find({
      hotelId,
      receivedAt: { $gte: since }
    });

    const ownAvgRating = ownReviews.length > 0
      ? ownReviews.reduce((sum, r) => sum + r.rating, 0) / ownReviews.length
      : 0;

    const ownSentiment = {
      positive: ownReviews.filter(r => r.sentiment === SentimentLabel.POSITIVE).length,
      negative: ownReviews.filter(r => r.sentiment === SentimentLabel.NEGATIVE).length,
      neutral: ownReviews.filter(r => r.sentiment === SentimentLabel.NEUTRAL).length
    };

    // Get competitor stats
    const competitorStats = await Promise.all(
      competitorIds.map(async (compId: string) => {
        const compReviews = await Review.find({
          hotelId: compId,
          receivedAt: { $gte: since }
        });

        const avgRating = compReviews.length > 0
          ? compReviews.reduce((sum, r) => sum + r.rating, 0) / compReviews.length
          : 0;

        const sentiment = {
          positive: compReviews.filter(r => r.sentiment === SentimentLabel.POSITIVE).length,
          negative: compReviews.filter(r => r.sentiment === SentimentLabel.NEGATIVE).length,
          neutral: compReviews.filter(r => r.sentiment === SentimentLabel.NEUTRAL).length
        };

        return {
          hotelId: compId,
          reviewCount: compReviews.length,
          avgRating: Math.round(avgRating * 100) / 100,
          ratingDiff: Math.round((avgRating - ownAvgRating) * 100) / 100,
          sentiment
        };
      })
    );

    const industryAvg = competitorStats.length > 0
      ? competitorStats.reduce((sum, c) => sum + c.avgRating, 0) / competitorStats.length
      : ownAvgRating;

    res.json({
      yourHotel: {
        hotelId,
        reviewCount: ownReviews.length,
        avgRating: Math.round(ownAvgRating * 100) / 100,
        sentiment: ownSentiment
      },
      competitors: competitorStats,
      benchmark: {
        industryAvgRating: Math.round(industryAvg * 100) / 100,
        yourVsIndustry: Math.round((ownAvgRating - industryAvg) * 100) / 100,
        period: `${days} days`
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get review velocity (reviews per day/week)
router.get('/velocity/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.params);

    const { days } = z.object({
      days: z.coerce.number().min(1).max(90).default(30)
    }).parse(req.query);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const reviews = await Review.find({
      hotelId,
      receivedAt: { $gte: since }
    }).sort({ receivedAt: 1 });

    // Group by day
    const dailyVolume: Record<string, number> = {};
    for (const review of reviews) {
      const date = review.receivedAt.toISOString().split('T')[0];
      dailyVolume[date] = (dailyVolume[date] || 0) + 1;
    }

    // Calculate statistics
    const volumes = Object.values(dailyVolume);
    const avgPerDay = volumes.length > 0
      ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length
      : 0;

    const maxPerDay = volumes.length > 0 ? Math.max(...volumes) : 0;
    const minPerDay = volumes.length > 0 ? Math.min(...volumes) : 0;

    // Calculate trend
    const halfPoint = Math.floor(volumes.length / 2);
    const firstHalf = volumes.slice(0, halfPoint);
    const secondHalf = volumes.slice(halfPoint);

    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length
      : 0;

    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length
      : 0;

    const trend = secondHalfAvg - firstHalfAvg;

    // Daily volume time series
    const timeSeries = Object.entries(dailyVolume)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      summary: {
        totalReviews: reviews.length,
        avgPerDay: Math.round(avgPerDay * 100) / 100,
        maxPerDay,
        minPerDay,
        trend: Math.round(trend * 100) / 100
      },
      timeSeries,
      projection: {
        weeklyEstimate: Math.round(avgPerDay * 7),
        monthlyEstimate: Math.round(avgPerDay * 30)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Export analytics report
router.get('/export/:hotelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hotelId } = z.object({
      hotelId: z.string().min(1)
    }).parse(req.params);

    const { format, days, startDate, endDate } = z.object({
      format: z.enum(['json', 'csv']).default('json'),
      days: z.coerce.number().min(1).max(365).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional()
    }).parse(req.query);

    // Build date filter
    let dateFilter: Record<string, Date> = {};
    if (startDate && endDate) {
      dateFilter = { $gte: startDate, $lte: endDate };
    } else if (days) {
      dateFilter = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    const query: Record<string, unknown> = { hotelId };
    if (Object.keys(dateFilter).length > 0) {
      query.receivedAt = dateFilter;
    }

    const reviews = await Review.find(query).lean();

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'reviewId', 'externalId', 'source', 'guestName', 'rating',
        'sentiment', 'status', 'content', 'receivedAt'
      ];

      const rows = reviews.map(r => [
        r.reviewId,
        r.externalId,
        r.source,
        r.guestName,
        r.rating,
        r.sentiment || '',
        r.status,
        `"${(r.content || '').replace(/"/g, '""')}"`,
        r.receivedAt.toISOString()
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="reviews_${hotelId}_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        hotelId,
        exportedAt: new Date().toISOString(),
        totalReviews: reviews.length,
        reviews
      });
    }
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes };
