/**
 * DOOH INTEGRATION
 * Connects Merchant Service to DOOH Service
 */

import axios from 'axios';
import { logger } from '../config/logger';

const DOOH_SERVICE_URL = process.env.DOOH_SERVICE_URL || 'http://localhost:4107';

/**
 * Get merchant's DOOH screens
 */
export async function getMerchantScreens(
  merchantId: string
): Promise<any[]> {
  try {
    const response = await axios.get(`${DOOH_SERVICE_URL}/api/screens`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.screens || [];
  } catch (error: any) {
    logger.error('[DOOH] Get screens failed:', error.message);
    return [];
  }
}

/**
 * Register merchant's screen
 */
export async function registerScreen(
  merchantId: string,
  screenData: {
    type: '1:1' | 'mass';
    location: {
      address: string;
      lat: number;
      lng: number;
      areaId: string;
    };
    specs: {
      width: number;
      height: number;
      orientation: 'landscape' | 'portrait';
    };
  }
): Promise<{
  success: boolean;
  screenId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${DOOH_SERVICE_URL}/api/screens/register`, {
      merchantId,
      ...screenData,
    }, {
      timeout: 10000,
    });

    return { success: true, screenId: response.data.screenId };
  } catch (error: any) {
    logger.error('[DOOH] Register screen failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create DOOH campaign
 */
export async function createCampaign(
  merchantId: string,
  campaignData: {
    name: string;
    objective: 'awareness' | 'consideration' | 'conversion';
    budget: number;
    startDate: Date;
    endDate: Date;
    targeting: {
      areas?: string[];
      demographics?: string[];
      screenTypes?: ('1:1' | 'mass')[];
    };
    creative: {
      imageUrl: string;
      headline: string;
      cta?: string;
    };
  }
): Promise<{
  success: boolean;
  campaignId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${DOOH_SERVICE_URL}/api/ads/campaigns`, {
      merchantId,
      ...campaignData,
    }, {
      timeout: 10000,
    });

    return { success: true, campaignId: response.data.campaignId };
  } catch (error: any) {
    logger.error('[DOOH] Create campaign failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get DOOH campaign analytics
 */
export async function getCampaignAnalytics(
  campaignId: string
): Promise<{
  impressions: number;
  uniqueViews: number;
  interactions: number;
  conversions: number;
  spend: number;
  cpm: number;
  ctr: number;
}> {
  try {
    const response = await axios.get(`${DOOH_SERVICE_URL}/api/analytics/screens/${campaignId}`, {
      timeout: 10000,
    });

    return response.data.analytics || {
      impressions: 0,
      uniqueViews: 0,
      interactions: 0,
      conversions: 0,
      spend: 0,
      cpm: 0,
      ctr: 0,
    };
  } catch (error: any) {
    logger.error('[DOOH] Get analytics failed:', error.message);
    return {
      impressions: 0,
      uniqueViews: 0,
      interactions: 0,
      conversions: 0,
      spend: 0,
      cpm: 0,
      ctr: 0,
    };
  }
}

/**
 * Generate AdQR for campaign
 */
export async function generateAdQR(
  campaignId: string,
  options?: {
    discount?: number;
    coins?: number;
    productId?: string;
  }
): Promise<{
  success: boolean;
  qrUrl?: string;
  qrCode?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${DOOH_SERVICE_URL}/api/analytics/qr/generate`, {
      campaignId,
      ...options,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[DOOH] Generate QR failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get screen health status
 */
export async function getScreenHealth(
  screenId: string
): Promise<{
  status: 'active' | 'inactive' | 'maintenance';
  lastPing: Date;
  uptime: number;
  error?: string;
}> {
  try {
    const response = await axios.get(`${DOOH_SERVICE_URL}/api/screens/${screenId}/health`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[DOOH] Get health failed:', error.message);
    return {
      status: 'inactive',
      lastPing: new Date(),
      uptime: 0,
      error: error.message,
    };
  }
}

/**
 * Get area context for targeting
 */
export async function getAreaContext(
  areaId: string
): Promise<{
  areaId: string;
  demographics: {
    avgAge: number;
    incomeLevel: string;
    dominantCategories: string[];
  };
  topIntents: string[];
  activeUsers: number;
} | null> {
  try {
    const response = await axios.get(`${DOOH_SERVICE_URL}/api/area/${areaId}/context`, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[DOOH] Get area context failed:', error.message);
    return null;
  }
}
