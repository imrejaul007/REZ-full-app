import axios from 'axios';
import * as cheerio from 'cheerio';
import { ReviewSource } from '../models/Review';
import { logger } from '../utils/logger';

interface TripAdvisorReview {
  reviewId: string;
  rating: number;
  title: string;
  text: string;
  author: {
    name: string;
    location?: string;
    contributions?: number;
  };
  date: string;
  tripType?: string;
  roomType?: string;
  viaMobile: boolean;
}

interface TripAdvisorSourceConfig {
  hotelUrl?: string;
  apiKey?: string;
}

export class TripAdvisorSource {
  private sourceName = ReviewSource.TRIPADVISOR;
  private apiBaseUrl = 'https://api.tripadvisor.com/api';

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

      if (config?.apiKey) {
        return this.fetchViaAPI(config.apiKey, since);
      } else if (config?.hotelUrl) {
        return this.fetchViaScraping(config.hotelUrl, since);
      }

      logger.warn(`TripAdvisor source not configured for hotel ${hotelId}`);
      return [];
    } catch (error) {
      logger.error('Failed to fetch TripAdvisor reviews:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hotelId
      });
      throw error;
    }
  }

  private async fetchViaAPI(apiKey: string, since?: Date): Promise<TripAdvisorReview[]> {
    try {
      // Note: TripAdvisor API requires partner access
      // This is a placeholder for the actual API integration
      const response = await axios.get(`${this.apiBaseUrl}/hotels/reviews`, {
        params: {
          key: apiKey,
          language: 'en',
          limit: 50
        },
        timeout: 30000
      });

      const reviews = response.data.data || [];
      return since
        ? reviews.filter((r: TripAdvisorReview) => new Date(r.date) > since!)
        : reviews;
    } catch {
      logger.warn('TripAdvisor API not available, falling back to scraping');
      return [];
    }
  }

  private async fetchViaScraping(hotelUrl: string, since?: Date): Promise<Array<{
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
      const response = await axios.get(hotelUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReputationService/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      const reviews: Array<{
        externalId: string;
        guestName: string;
        guestEmail?: string;
        rating: number;
        title?: string;
        content: string;
        language: string;
        receivedAt: Date;
        metadata: Record<string, unknown>;
      }> = [];

      // TripAdvisor review structure parsing (simplified)
      $('.review-container').each((_i, el) => {
        const reviewId = $(el).attr('data-reviewid') || '';
        const rating = parseInt($(el).find('.ui_bubble_rating').attr('class')?.match(/bubble_(\d+)/)?.[1] || '0', 10) / 10;
        const title = $(el).find('.titleText').text().trim();
        const content = $(el).find('.fullText, .partialText').text().trim();
        const authorName = $(el).find('.info_text div:first').text().trim();
        const dateStr = $(el).find('.ratingDate').attr('title') || '';
        const receivedAt = this.parseTripAdvisorDate(dateStr);

        if (since && receivedAt <= since) return;

        reviews.push({
          externalId: reviewId,
          guestName: authorName || 'TripAdvisor Guest',
          rating: rating || 3,
          title: title || undefined,
          content: content || '',
          language: this.detectLanguage(content),
          receivedAt,
          metadata: {
            tripType: $(el).find('.tripType').text().trim() || undefined,
            roomType: $(el).find('.roomType').text().trim() || undefined,
            viaMobile: $(el).find('.viaMobile').length > 0
          }
        });
      });

      logger.info(`Scraped ${reviews.length} TripAdvisor reviews`);
      return reviews;
    } catch (error) {
      logger.error('TripAdvisor scraping failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private parseTripAdvisorDate(dateStr: string): Date {
    // TripAdvisor date formats: "Reviewed yesterday", "Reviewed December 1, 2023", etc.
    const now = new Date();

    if (dateStr.includes('today')) {
      return now;
    }
    if (dateStr.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    // Try to parse month name format
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = months.findIndex(m => dateStr.includes(m));

    if (monthIndex !== -1) {
      const match = dateStr.match(/(\w+)\s+(\d+),\s*(\d+)/);
      if (match) {
        return new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
      }
    }

    return now;
  }

  private detectLanguage(content: string): string {
    // Simplified language detection
    if (/[؀-ۿ]/.test(content)) return 'ar';
    if (/[一-鿿]/.test(content)) return 'zh';
    if (/[぀-ゟ゠-ヿ]/.test(content)) return 'ja';
    if (/[Ѐ-ӿ]/.test(content)) return 'ru';
    if (/[äöüß]/i.test(content)) return 'de';
    if (/[àâçéèêëîïôûùüÿœæ]/i.test(content)) return 'fr';
    if (/[áéíóúüñ¿¡]/i.test(content)) return 'es';
    return 'en';
  }

  private async getConfig(hotelId: string): Promise<TripAdvisorSourceConfig | null> {
    // In production, fetch from database
    const apiKey = process.env.TRIPADVISOR_API_KEY;
    const hotelUrl = process.env[`TRIPADVISOR_URL_${hotelId}`];

    if (apiKey) {
      return { apiKey };
    }
    if (hotelUrl) {
      return { hotelUrl };
    }

    return null;
  }

  async postResponse(reviewId: string, response: string, hotelId: string): Promise<boolean> {
    // Note: TripAdvisor response requires Business Account access
    // This would integrate with their management API
    logger.info(`Would post response to TripAdvisor review ${reviewId}`);
    return true;
  }

  getSourceName(): ReviewSource {
    return this.sourceName;
  }
}
