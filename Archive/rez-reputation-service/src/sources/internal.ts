import { ReviewSource } from '../models/Review';
import { logger } from '../utils/logger';

interface InternalReview {
  reviewId: string;
  guestName: string;
  guestEmail?: string;
  rating: number;
  title?: string;
  content: string;
  language?: string;
  stayDate?: Date;
  roomType?: string;
  categories?: string[];
  metadata?: Record<string, unknown>;
}

interface InternalSourceConfig {
  hotelId: string;
}

/**
 * Internal Source Adapter
 *
 * Handles reviews submitted through the hotel's own systems:
 * - In-app feedback
 * - Post-stay surveys
 * - Email feedback
 * - Front desk interactions
 */
export class InternalSource {
  private sourceName = ReviewSource.INTERNAL;

  async fetchReviews(
    hotelId: string,
    since?: Date
  ): Promise<Array<{
    externalId: string;
    guestName: string;
    guestEmail?: string;
    rating: number;
    title?: string;
    content: string;
    language: string;
    receivedAt: Date;
    metadata: Record<string, unknown>;
  }>> {
    try {
      // Internal reviews are typically fetched from the hotel's own database
      // or through an internal API
      const reviews = await this.fetchInternalReviews(hotelId, since);

      logger.info(`Fetched ${reviews.length} internal reviews for hotel ${hotelId}`);

      return reviews.map(review => this.mapReview(review));
    } catch (error) {
      logger.error('Failed to fetch internal reviews:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hotelId
      });
      throw error;
    }
  }

  private async fetchInternalReviews(
    hotelId: string,
    since?: Date
  ): Promise<InternalReview[]> {
    // In production, this would call the hotel's internal systems
    // such as the Order Service, Survey Service, or a feedback database

    const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:4001';

    try {
      // Example: Fetch reviews from a feedback collection
      // In practice, this would be an actual API call or database query
      const response = await fetch(`${orderServiceUrl}/api/feedback/hotel/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.getInternalToken()
        }
      });

      if (!response.ok) {
        logger.warn(`Failed to fetch internal reviews: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const allReviews: InternalReview[] = data.reviews || [];

      // Filter by date if provided
      if (since) {
        return allReviews.filter(r => new Date(r.metadata?.createdAt || new Date()) > since);
      }

      return allReviews;
    } catch (error) {
      // Internal service may not be available
      logger.warn('Could not connect to internal services for reviews');
      return [];
    }
  }

  private mapReview(review: InternalReview): {
    externalId: string;
    guestName: string;
    guestEmail?: string;
    rating: number;
    title?: string;
    content: string;
    language: string;
    receivedAt: Date;
    metadata: Record<string, unknown>;
  } {
    return {
      externalId: review.reviewId,
      guestName: review.guestName,
      guestEmail: review.guestEmail,
      rating: review.rating,
      title: review.title,
      content: review.content,
      language: review.language || 'en',
      receivedAt: new Date(review.metadata?.createdAt as string || Date.now()),
      metadata: {
        stayDate: review.stayDate,
        roomType: review.roomType,
        categories: review.categories,
        ...review.metadata
      }
    };
  }

  private getInternalToken(): string {
    // Get internal service token from environment
    const tokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';
    const tokens = JSON.parse(tokensJson);
    return tokens['reputation-service'] || '';
  }

  /**
   * Submit a review from internal systems
   * This is called when a guest submits feedback through the hotel's own channels
   */
  async submitReview(hotelId: string, review: Omit<InternalReview, 'reviewId'>): Promise<string> {
    const reviewId = `INT-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // In production, this would save to the internal database
    logger.info(`Internal review submitted for hotel ${hotelId}`, {
      reviewId,
      guestName: review.guestName,
      rating: review.rating
    });

    return reviewId;
  }

  /**
   * Link a review to an order/booking
   */
  async linkReviewToOrder(reviewId: string, orderId: string): Promise<boolean> {
    try {
      // In production, this would update the review record
      // to link it with the order/booking
      logger.info(`Linked internal review ${reviewId} to order ${orderId}`);
      return true;
    } catch (error) {
      logger.error('Failed to link review to order:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reviewId,
        orderId
      });
      return false;
    }
  }

  /**
   * Get survey responses for review enrichment
   */
  async getSurveyData(reviewId: string): Promise<Record<string, unknown> | null> {
    try {
      const surveyServiceUrl = process.env.SURVEY_SERVICE_URL || 'http://localhost:4003';

      const response = await fetch(`${surveyServiceUrl}/api/surveys/review/${reviewId}`, {
        headers: {
          'X-Internal-Token': this.getInternalToken()
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.survey;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate NPS score from reviews
   */
  async calculateNPS(hotelId: string, since?: Date): Promise<{
    nps: number;
    promoters: number;
    passives: number;
    detractors: number;
    responseCount: number;
  }> {
    const reviews = await this.fetchInternalReviews(hotelId, since);

    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    for (const review of reviews) {
      if (review.rating >= 9) {
        promoters++;
      } else if (review.rating >= 7) {
        passives++;
      } else {
        detractors++;
      }
    }

    const total = reviews.length;
    const nps = total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;

    return {
      nps,
      promoters,
      passives,
      detractors,
      responseCount: total
    };
  }

  getSourceName(): ReviewSource {
    return this.sourceName;
  }
}
