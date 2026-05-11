/**
 * LEAD INTELLIGENCE INTEGRATION
 * Connects Merchant Service to Lead Intelligence Service
 */

import axios from 'axios';
import { logger } from '../config/logger';

const LEAD_INTELLIGENCE_URL = process.env.LEAD_INTELLIGENCE_URL || 'http://localhost:4106';

interface LeadScore {
  userId: string;
  temperature: 'hot' | 'warm' | 'cold';
  score: number;
  signals: {
    recentSearches: number;
    abandonedCarts: number;
    viewedProducts: number;
    lastActiveHours: number;
    intentStrength: number;
  };
  recommendedChannel: string;
}

/**
 * Get lead score for a user
 */
export async function getLeadScore(userId: string): Promise<LeadScore | null> {
  try {
    const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/${userId}/score`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Lead] Get score failed:', error.message);
    return null;
  }
}

/**
 * Get all hot leads for a merchant
 */
export async function getHotLeads(merchantId: string): Promise<LeadScore[]> {
  try {
    const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/hot`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.leads || [];
  } catch (error: any) {
    logger.error('[Lead] Get hot leads failed:', error.message);
    return [];
  }
}

/**
 * Get all warm leads for a merchant
 */
export async function getWarmLeads(merchantId: string): Promise<LeadScore[]> {
  try {
    const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/warm`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.leads || [];
  } catch (error: any) {
    logger.error('[Lead] Get warm leads failed:', error.message);
    return [];
  }
}

/**
 * Get all cold leads for a merchant
 */
export async function getColdLeads(merchantId: string): Promise<LeadScore[]> {
  try {
    const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/leads/cold`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.leads || [];
  } catch (error: any) {
    logger.error('[Lead] Get cold leads failed:', error.message);
    return [];
  }
}

/**
 * Track abandoned cart for a user
 */
export async function trackAbandonedCart(
  userId: string,
  merchantId: string,
  cartItems: { productId: string; price: number }[],
  totalValue: number
): Promise<void> {
  try {
    await axios.post(`${LEAD_INTELLIGENCE_URL}/api/abandonment/cart`, {
      userId,
      merchantId,
      cartItems,
      totalValue,
    }, {
      timeout: 5000,
    });
  } catch (error: any) {
    logger.error('[Lead] Track cart failed:', error.message);
  }
}

/**
 * Track abandoned search for a user
 */
export async function trackAbandonedSearch(
  userId: string,
  merchantId: string,
  query: string,
  intentDetected: string
): Promise<void> {
  try {
    await axios.post(`${LEAD_INTELLIGENCE_URL}/api/abandonment/search`, {
      userId,
      merchantId,
      query,
      intentDetected,
    }, {
      timeout: 5000,
    });
  } catch (error: any) {
    logger.error('[Lead] Track search failed:', error.message);
  }
}

/**
 * Get personalized offers for a user
 */
export async function getPersonalizedOffers(
  userId: string,
  merchantId: string,
  limit: number = 5
): Promise<any[]> {
  try {
    const response = await axios.get(`${LEAD_INTELLIGENCE_URL}/api/offers/personalized`, {
      params: { userId, merchantId, limit },
      timeout: 10000,
    });

    return response.data.offers || [];
  } catch (error: any) {
    logger.error('[Lead] Get offers failed:', error.message);
    return [];
  }
}

/**
 * Trigger re-engagement for a user
 */
export async function triggerReEngagement(
  userId: string,
  reason: 'abandoned_cart' | 'abandoned_search' | 'inactive' | 'price_drop'
): Promise<void> {
  try {
    await axios.post(`${LEAD_INTELLIGENCE_URL}/api/reengagement/trigger`, {
      userId,
      reason,
    }, {
      timeout: 5000,
    });
  } catch (error: any) {
    logger.error('[Lead] Trigger re-engagement failed:', error.message);
  }
}

/**
 * Get merchant's customer intelligence summary
 */
export async function getCustomerIntelligenceSummary(
  merchantId: string
): Promise<{
  totalCustomers: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  avgLeadScore: number;
}> {
  try {
    const [hot, warm, cold] = await Promise.all([
      getHotLeads(merchantId),
      getWarmLeads(merchantId),
      getColdLeads(merchantId),
    ]);

    const allLeads = [...hot, ...warm, ...cold];
    const avgScore = allLeads.length > 0
      ? allLeads.reduce((sum, l) => sum + l.score, 0) / allLeads.length
      : 0;

    return {
      totalCustomers: allLeads.length,
      hotCount: hot.length,
      warmCount: warm.length,
      coldCount: cold.length,
      avgLeadScore: Math.round(avgScore),
    };
  } catch (error: any) {
    logger.error('[Lead] Get summary failed:', error.message);
    return {
      totalCustomers: 0,
      hotCount: 0,
      warmCount: 0,
      coldCount: 0,
      avgLeadScore: 0,
    };
  }
}
