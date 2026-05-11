import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto-js';
import { Review, ReviewSource } from '../models/Review';
import { SentimentService } from '../services/SentimentService';
import { AlertService } from '../services/AlertService';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

const router = Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Webhook secret keys by source
const WEBHOOK_SECRETS: Record<string, string> = {
  [ReviewSource.GOOGLE]: process.env.GOOGLE_WEBHOOK_SECRET || '',
  [ReviewSource.TRIPADVISOR]: process.env.TRIPADVISOR_WEBHOOK_SECRET || '',
  [ReviewSource.BOOKINGCOM]: process.env.BOOKINGCOM_WEBHOOK_SECRET || ''
};

// Signature verification middleware
function verifyWebhookSignature(source: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-webhook-signature'] as string;
    const secret = WEBHOOK_SECRETS[source];

    if (!secret) {
      logger.warn(`No webhook secret configured for source: ${source}`);
      next();
      return;
    }

    if (!signature) {
      res.status(401).json({ error: 'Missing webhook signature' });
      return;
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto.HmacSHA256(payload, secret).toString();

    if (signature !== expectedSignature) {
      logger.warn(`Invalid webhook signature for source: ${source}`);
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    next();
  };
}

// Deduplication check
async function isDuplicateReview(externalId: string, source: string): Promise<boolean> {
  const key = `webhook:dedup:${source}:${externalId}`;
  const exists = await redis.exists(key);

  if (exists) {
    return true;
  }

  // Set with 24-hour TTL
  await redis.setex(key, 86400, '1');
  return false;
}

// Google Reviews Webhook
router.post(
  '/google',
  verifyWebhookSignature(ReviewSource.GOOGLE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string(),
        reviewer: z.object({
          displayName: z.string()
        }),
        createTime: z.string(),
        updateTime: z.string()
      });

      const data = schema.parse(req.body);

      // Check for duplicate
      if (await isDuplicateReview(data.reviewId, ReviewSource.GOOGLE)) {
        logger.info(`Duplicate Google review ignored: ${data.reviewId}`);
        res.json({ status: 'ignored', reason: 'duplicate' });
        return;
      }

      // Create review record
      const review = new Review({
        reviewId: `GOOGLE-${Date.now()}-${data.reviewId}`,
        externalId: data.reviewId,
        source: ReviewSource.GOOGLE,
        hotelId: req.body.hotelId || 'default', // From configuration
        guestName: data.reviewer.displayName,
        rating: data.rating,
        content: data.comment,
        language: 'en',
        receivedAt: new Date(data.createTime),
        metadata: {
          platformRating: data.rating,
          updateTime: data.updateTime
        },
        status: 'pending'
      });

      await review.save();

      // Queue for sentiment analysis
      const sentimentService = new SentimentService();
      await sentimentService.queueAnalysis(review.reviewId);

      logger.info(`Google review webhook processed: ${review.reviewId}`);

      res.json({ status: 'success', reviewId: review.reviewId });
    } catch (error) {
      next(error);
    }
  }
);

// TripAdvisor Reviews Webhook
router.post(
  '/tripadvisor',
  verifyWebhookSignature(ReviewSource.TRIPADVISOR),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        content: z.string(),
        author: z.object({
          name: z.string(),
          location: z.string().optional()
        }),
        postedDate: z.string(),
        stayDate: z.string().optional(),
        tripType: z.string().optional()
      });

      const data = schema.parse(req.body);

      if (await isDuplicateReview(data.reviewId, ReviewSource.TRIPADVISOR)) {
        logger.info(`Duplicate TripAdvisor review ignored: ${data.reviewId}`);
        res.json({ status: 'ignored', reason: 'duplicate' });
        return;
      }

      const review = new Review({
        reviewId: `TRIP-${Date.now()}-${data.reviewId}`,
        externalId: data.reviewId,
        source: ReviewSource.TRIPADVISOR,
        hotelId: req.body.hotelId || 'default',
        guestName: data.author.name,
        rating: data.rating,
        title: data.title,
        content: data.content,
        language: 'en',
        receivedAt: new Date(data.postedDate),
        metadata: {
          visitDate: data.stayDate ? new Date(data.stayDate) : undefined,
          travelType: data.tripType,
          reviewerLocation: data.author.location
        },
        status: 'pending'
      });

      await review.save();

      const sentimentService = new SentimentService();
      await sentimentService.queueAnalysis(review.reviewId);

      logger.info(`TripAdvisor review webhook processed: ${review.reviewId}`);

      res.json({ status: 'success', reviewId: review.reviewId });
    } catch (error) {
      next(error);
    }
  }
);

// Booking.com Reviews Webhook
router.post(
  '/bookingcom',
  verifyWebhookSignature(ReviewSource.BOOKINGCOM),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        positive: z.string().optional(),
        negative: z.string().optional(),
        guestName: z.string(),
        guestCountry: z.string().optional(),
        reviewDate: z.string(),
        stayDate: z.string().optional(),
        roomType: z.string().optional(),
        travelerType: z.string().optional(),
        language: z.string().optional()
      });

      const data = schema.parse(req.body);

      if (await isDuplicateReview(data.reviewId, ReviewSource.BOOKINGCOM)) {
        logger.info(`Duplicate Booking.com review ignored: ${data.reviewId}`);
        res.json({ status: 'ignored', reason: 'duplicate' });
        return;
      }

      // Construct content from positive/negative
      let content = data.positive || '';
      if (data.negative) {
        content += content ? `\n\nNegative: ${data.negative}` : data.negative;
      }

      const review = new Review({
        reviewId: `BOOK-${Date.now()}-${data.reviewId}`,
        externalId: data.reviewId,
        source: ReviewSource.BOOKINGCOM,
        hotelId: req.body.hotelId || 'default',
        guestName: data.guestName,
        rating: data.rating,
        title: data.title,
        content: content || 'No comment provided',
        language: data.language || 'en',
        receivedAt: new Date(data.reviewDate),
        metadata: {
          visitDate: data.stayDate ? new Date(data.stayDate) : undefined,
          roomType: data.roomType,
          travelType: data.travelerType,
          reviewerCountry: data.guestCountry,
          pros: data.positive,
          cons: data.negative
        },
        status: 'pending'
      });

      await review.save();

      const sentimentService = new SentimentService();
      await sentimentService.queueAnalysis(review.reviewId);

      logger.info(`Booking.com review webhook processed: ${review.reviewId}`);

      res.json({ status: 'success', reviewId: review.reviewId });
    } catch (error) {
      next(error);
    }
  }
);

// Internal reviews webhook
router.post('/internal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Internal webhook should have additional authentication
    const internalToken = req.headers['x-internal-token'] as string;
    const expectedToken = process.env.INTERNAL_SERVICE_TOKENS_JSON
      ? JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON)['reputation-service']
      : '';

    if (internalToken !== expectedToken) {
      res.status(401).json({ error: 'Invalid internal token' });
      return;
    }

    const schema = z.object({
      hotelId: z.string().min(1),
      guestName: z.string().min(1),
      guestEmail: z.string().email().optional(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      content: z.string().min(1),
      stayDate: z.string().optional(),
      roomType: z.string().optional(),
      categories: z.array(z.string()).optional()
    });

    const data = schema.parse(req.body);

    const review = new Review({
      reviewId: `INT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      externalId: `INT-${Date.now()}`,
      source: ReviewSource.INTERNAL,
      hotelId: data.hotelId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      rating: data.rating,
      title: data.title,
      content: data.content,
      language: 'en',
      receivedAt: new Date(),
      metadata: {
        stayDate: data.stayDate ? new Date(data.stayDate) : undefined,
        roomType: data.roomType,
        categories: data.categories
      },
      status: 'pending'
    });

    await review.save();

    const sentimentService = new SentimentService();
    await sentimentService.queueAnalysis(review.reviewId);

    logger.info(`Internal review webhook processed: ${review.reviewId}`);

    res.json({ status: 'success', reviewId: review.reviewId });
  } catch (error) {
    next(error);
  }
});

// Generic webhook endpoint for custom integrations
router.post('/generic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      hotelId: z.string().min(1),
      source: z.string().min(1),
      reviewData: z.object({
        externalId: z.string(),
        guestName: z.string(),
        guestEmail: z.string().optional(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        content: z.string().min(1),
        language: z.string().optional(),
        receivedAt: z.string().optional(),
        metadata: z.record(z.unknown()).optional()
      })
    });

    const data = schema.parse(req.body);

    if (await isDuplicateReview(data.reviewData.externalId, data.source)) {
      res.json({ status: 'ignored', reason: 'duplicate' });
      return;
    }

    const review = new Review({
      reviewId: `${data.source.toUpperCase()}-${Date.now()}-${data.reviewData.externalId}`,
      externalId: data.reviewData.externalId,
      source: data.source as ReviewSource,
      hotelId: data.hotelId,
      guestName: data.reviewData.guestName,
      guestEmail: data.reviewData.guestEmail,
      rating: data.reviewData.rating,
      title: data.reviewData.title,
      content: data.reviewData.content,
      language: data.reviewData.language || 'en',
      receivedAt: data.reviewData.receivedAt ? new Date(data.reviewData.receivedAt) : new Date(),
      metadata: data.reviewData.metadata || {},
      status: 'pending'
    });

    await review.save();

    const sentimentService = new SentimentService();
    await sentimentService.queueAnalysis(review.reviewId);

    logger.info(`Generic webhook processed: ${review.reviewId} from ${data.source}`);

    res.json({ status: 'success', reviewId: review.reviewId });
  } catch (error) {
    next(error);
  }
});

// Webhook health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    await redis.ping();
    res.json({ status: 'healthy', redis: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', redis: 'disconnected' });
  }
});

export { router as webhookRoutes };
