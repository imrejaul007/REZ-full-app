import axios from 'axios';
import { ReviewSource } from '../models/Review';
import { logger } from '../utils/logger';

interface GoogleReviewResponse {
  reviews: Array<{
    reviewId: string;
    reviewer: {
      displayName: string;
      profilePhotoUrl?: string;
    };
    starRating: number;
    comment: string;
    createTime: string;
    updateTime: string;
    reviewReply?: {
      comment: string;
      updateTime: string;
    };
  }>;
  averageRating: number;
  totalReviewCount: number;
}

interface GoogleSourceConfig {
  apiKey?: string;
  placeId?: string;
}

export class GoogleSource {
  private sourceName = ReviewSource.GOOGLE;
  private apiBaseUrl = 'https://maps.googleapis.com/maps/api';

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
      const config = await this.getConfig(hotelId);
      if (!config?.apiKey || !config?.placeId) {
        logger.warn(`Google source not configured for hotel ${hotelId}`);
        return [];
      }

      const response = await axios.get<GoogleReviewResponse>(
        `${this.apiBaseUrl}/place/reviews/json`,
        {
          params: {
            place_id: config.placeId,
            key: config.apiKey,
            reviews_sort: 'most_relevant'
          },
          timeout: 30000
        }
      );

      const reviews = response.data.reviews || [];
      const filteredReviews = since
        ? reviews.filter(r => new Date(r.createTime) > since)
        : reviews;

      return filteredReviews.map(review => this.mapReview(review));
    } catch (error) {
      logger.error('Failed to fetch Google reviews:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hotelId
      });
      throw error;
    }
  }

  private mapReview(review: GoogleReviewResponse['reviews'][0]): {
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
    const ratingMap: Record<string, number> = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5
    };

    return {
      externalId: review.reviewId,
      guestName: review.reviewer.displayName,
      rating: ratingMap[review.starRating] || 3,
      title: this.extractTitle(review.comment),
      content: review.comment,
      language: this.detectLanguage(review.comment),
      receivedAt: new Date(review.createTime),
      metadata: {
        platformRating: ratingMap[review.starRating] || 3,
        updateTime: review.updateTime,
        hasReply: !!review.reviewReply,
        profilePhotoUrl: review.reviewer.profilePhotoUrl
      }
    };
  }

  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
  }

  private detectLanguage(content: string): string {
    // Simple language detection based on character ranges
    // In production, use a proper language detection library
    const hasArabic = /[؀-ۿ]/.test(content);
    const hasChinese = /[一-鿿]/.test(content);
    const hasJapanese = /[぀-ゟ゠-ヿ]/.test(content);
    const hasRussian = /[Ѐ-ӿ]/.test(content);
    const hasGerman = /[äöüß]/i.test(content);
    const hasFrench = /[àâçéèêëîïôûùüÿœæ]/i.test(content);
    const hasSpanish = /[áéíóúüñ¿¡]/i.test(content);

    if (hasArabic) return 'ar';
    if (hasChinese) return 'zh';
    if (hasJapanese) return 'ja';
    if (hasRussian) return 'ru';
    if (hasGerman) return 'de';
    if (hasFrench) return 'fr';
    if (hasSpanish) return 'es';

    return 'en';
  }

  private async getConfig(hotelId: string): Promise<GoogleSourceConfig | null> {
    // In production, fetch from database
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = process.env[`GOOGLE_PLACE_ID_${hotelId}`];

    if (apiKey && placeId) {
      return { apiKey, placeId };
    }

    return null;
  }

  async postResponse(reviewId: string, response: string, hotelId: string): Promise<boolean> {
    try {
      const config = await this.getConfig(hotelId);
      if (!config?.apiKey || !config?.placeId) {
        throw new Error('Google source not configured');
      }

      // Note: Google Places API has limitations on posting responses
      // This would typically use the Business API
      await axios.post(
        `${this.apiBaseUrl}/place/details/json`,
        {
          place_id: config.placeId,
          review_id: reviewId,
          response
        },
        {
          params: { key: config.apiKey }
        }
      );

      logger.info(`Response posted to Google review ${reviewId}`);
      return true;
    } catch (error) {
      logger.error('Failed to post Google response:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reviewId
      });
      return false;
    }
  }

  getSourceName(): ReviewSource {
    return this.sourceName;
  }
}
