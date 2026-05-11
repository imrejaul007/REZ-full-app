import axios from 'axios';
import * as cheerio from 'cheerio';
import { ReviewSource } from '../models/Review';
import { logger } from '../utils/logger';

interface BookingComReview {
  reviewId: string;
  reviewerName: string;
  reviewerCountry: string;
  rating: number;
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  date: string;
  stayDate: string;
  roomType?: string;
  travelerType?: string;
  language: string;
}

interface BookingComSourceConfig {
  propertyId?: string;
  apiKey?: string;
  affiliateId?: string;
}

export class BookingComSource {
  private sourceName = ReviewSource.BOOKINGCOM;
  private apiBaseUrl = 'https://api.booking.com';

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
        return this.fetchViaAPI(config, since);
      } else if (config?.propertyId) {
        return this.fetchViaScraping(config.propertyId, since);
      }

      logger.warn(`Booking.com source not configured for hotel ${hotelId}`);
      return [];
    } catch (error) {
      logger.error('Failed to fetch Booking.com reviews:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        hotelId
      });
      throw error;
    }
  }

  private async fetchViaAPI(
    config: BookingComSourceConfig,
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
      // Booking.com Partner API access required
      const response = await axios.get(`${this.apiBaseUrl}/v2/reviews`, {
        params: {
          property_id: config.propertyId,
          affiliate_id: config.affiliateId,
          page_size: 50,
          sort_by: 'date_desc'
        },
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const allReviews = response.data.reviews || [];
      const filteredReviews = since
        ? allReviews.filter((r: BookingComReview) => new Date(r.date) > since!)
        : allReviews;

      return filteredReviews.map(review => this.mapReview(review));
    } catch (error) {
      logger.error('Booking.com API error:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async fetchViaScraping(
    propertyId: string,
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
      // Note: Scraping Booking.com may violate their Terms of Service
      // Use official API for production
      const url = `https://www.booking.com/reviews/hotel/${propertyId}.html`;
      const response = await axios.get(url, {
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

      // Booking.com review structure parsing
      $('.review_list_item').each((_i, el) => {
        const reviewId = $(el).attr('data-reviewid') || '';
        const rating = parseFloat($(el).find('.review_score_value').text().trim()) / 2; // Convert to 5-star
        const title = $(el).find('.review_item_header_title').text().trim();
        const content = $(el).find('.review_item_review').text().trim();
        const reviewerName = $(el).find('.reviewer_name').text().trim();
        const country = $(el).find('.reviewer_country').text().trim();
        const dateStr = $(el).find('.review_item_date').text().trim();
        const stayDateStr = $(el).find('.review_stay_date').text().trim();

        const receivedAt = this.parseBookingDate(dateStr);
        if (since && receivedAt <= since) return;

        reviews.push({
          externalId: reviewId,
          guestName: reviewerName || 'Booking.com Guest',
          rating: isNaN(rating) ? 3 : rating,
          title: title || undefined,
          content: content || '',
          language: this.detectLanguage(content),
          receivedAt,
          metadata: {
            reviewerCountry: country,
            stayDate: stayDateStr || undefined,
            roomType: $(el).find('.review_room_type').text().trim() || undefined,
            travelerType: $(el).find('.review旅行者Type').text().trim() || undefined
          }
        });
      });

      logger.info(`Scraped ${reviews.length} Booking.com reviews`);
      return reviews;
    } catch (error) {
      logger.error('Booking.com scraping failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private mapReview(review: BookingComReview): {
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
      guestName: review.reviewerName || 'Guest',
      rating: review.rating / 2 || 3, // Convert 10-point to 5-star
      title: review.title || undefined,
      content: this.constructContent(review),
      language: review.language || this.detectLanguage(review.comment),
      receivedAt: new Date(review.date),
      metadata: {
        reviewerCountry: review.reviewerCountry,
        stayDate: review.stayDate,
        roomType: review.roomType,
        travelerType: review.travelerType,
        pros: review.pros,
        cons: review.cons
      }
    };
  }

  private constructContent(review: BookingComReview): string {
    let content = review.comment;

    if (review.pros) {
      content += `\n\nPros: ${review.pros}`;
    }
    if (review.cons) {
      content += `\n\nCons: ${review.cons}`;
    }

    return content;
  }

  private parseBookingDate(dateStr: string): Date {
    // Booking.com date format: "Reviewed: January 15, 2024"
    const match = dateStr.match(/(\w+)\s+(\d+),\s*(\d+)/);
    if (match) {
      const months: Record<string, number> = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
      };
      const month = months[match[1]];
      if (month !== undefined) {
        return new Date(parseInt(match[3]), month, parseInt(match[2]));
      }
    }

    return new Date();
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

  private async getConfig(hotelId: string): Promise<BookingComSourceConfig | null> {
    // In production, fetch from database
    const apiKey = process.env.BOOKINGCOM_API_KEY;
    const propertyId = process.env[`BOOKINGCOM_PROPERTY_${hotelId}`];
    const affiliateId = process.env.BOOKINGCOM_AFFILIATE_ID;

    if (apiKey && propertyId) {
      return { apiKey, propertyId, affiliateId };
    }
    if (propertyId) {
      return { propertyId, affiliateId };
    }

    return null;
  }

  async postResponse(reviewId: string, response: string, hotelId: string): Promise<boolean> {
    // Note: Booking.com response requires partner access
    logger.info(`Would post response to Booking.com review ${reviewId}`);
    return true;
  }

  getSourceName(): ReviewSource {
    return this.sourceName;
  }
}
