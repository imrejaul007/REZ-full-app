/**
 * PRICING ENGINE INTEGRATION
 * Connects Merchant Service to Dynamic Pricing Engine
 */

import axios from 'axios';
import { logger } from '../config/logger';

const PRICING_ENGINE_URL = process.env.PRICING_ENGINE_URL || 'http://localhost:4105';

interface PriceCalculation {
  productId: string;
  merchantId: string;
  basePrice: number;
}

interface PriceRecommendation {
  productId: string;
  recommendedPrice: number;
  discount: number;
  reason: string;
}

interface InventoryAlert {
  productId: string;
  productName: string;
  stockLevel: number;
  maxStock: number;
  alertType: 'low_stock' | 'overstock' | 'expiry_soon';
  message: string;
}

interface OfferSuggestion {
  productId: string;
  productName: string;
  suggestedOffer: string;
  discount: number;
  reason: string;
}

/**
 * Calculate dynamic price for a product
 */
export async function calculateDynamicPrice(
  productId: string,
  merchantId: string,
  basePrice: number
): Promise<{
  success: boolean;
  price?: number;
  discount?: number;
  factors?: any;
  error?: string;
}> {
  try {
    const response = await axios.post(`${PRICING_ENGINE_URL}/api/price/calculate`, {
      productId,
      merchantId,
      basePrice,
    }, {
      timeout: 5000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Pricing] Calculate failed:', error.message);
    // Fallback to base price
    return { success: true, price: basePrice };
  }
}

/**
 * Get price recommendations for merchant's products
 */
export async function getPriceRecommendations(
  merchantId: string,
  storeId?: string
): Promise<PriceRecommendation[]> {
  try {
    const response = await axios.get(`${PRICING_ENGINE_URL}/api/price/recommend`, {
      params: { merchantId, storeId },
      timeout: 10000,
    });

    return response.data.recommendations || [];
  } catch (error: any) {
    logger.error('[Pricing] Get recommendations failed:', error.message);
    return [];
  }
}

/**
 * Get inventory alerts for merchant
 */
export async function getInventoryAlerts(
  merchantId: string
): Promise<InventoryAlert[]> {
  try {
    const response = await axios.get(`${PRICING_ENGINE_URL}/api/inventory/alerts`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.alerts || [];
  } catch (error: any) {
    logger.error('[Pricing] Get alerts failed:', error.message);
    return [];
  }
}

/**
 * Get offer suggestions based on inventory and demand
 */
export async function getOfferSuggestions(
  merchantId: string
): Promise<OfferSuggestion[]> {
  try {
    const response = await axios.get(`${PRICING_ENGINE_URL}/api/offers/suggest`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.suggestions || [];
  } catch (error: any) {
    logger.error('[Pricing] Get suggestions failed:', error.message);
    return [];
  }
}

/**
 * Get demand forecast for products
 */
export async function getDemandForecast(
  productIds: string[],
  horizon: number = 24
): Promise<any[]> {
  try {
    const response = await axios.post(`${PRICING_ENGINE_URL}/api/demand/forecast`, {
      productIds,
      horizon,
    }, {
      timeout: 10000,
    });

    return response.data.forecasts || [];
  } catch (error: any) {
    logger.error('[Pricing] Get forecast failed:', error.message);
    return [];
  }
}

/**
 * Send inventory update to pricing engine
 */
export async function sendInventoryUpdate(
  merchantId: string,
  productId: string,
  stockLevel: number,
  expiryDate?: Date
): Promise<void> {
  try {
    await axios.post(`${PRICING_ENGINE_URL}/api/inventory/update`, {
      merchantId,
      productId,
      stockLevel,
      expiryDate,
    }, {
      timeout: 5000,
    });
  } catch (error: any) {
    logger.error('[Pricing] Inventory update failed:', error.message);
  }
}

/**
 * Send sales data to pricing engine for learning
 */
export async function sendSalesData(
  merchantId: string,
  productId: string,
  quantity: number,
  price: number,
  timestamp: Date
): Promise<void> {
  try {
    await axios.post(`${PRICING_ENGINE_URL}/api/sales/record`, {
      merchantId,
      productId,
      quantity,
      price,
      timestamp,
    }, {
      timeout: 5000,
    });
  } catch (error: any) {
    logger.error('[Pricing] Sales data failed:', error.message);
  }
}

/**
 * Get all AI suggestions for merchant dashboard
 */
export async function getMerchantAISuggestions(
  merchantId: string
): Promise<{
  priceRecommendations: PriceRecommendation[];
  inventoryAlerts: InventoryAlert[];
  offerSuggestions: OfferSuggestion[];
}> {
  const [prices, alerts, offers] = await Promise.all([
    getPriceRecommendations(merchantId),
    getInventoryAlerts(merchantId),
    getOfferSuggestions(merchantId),
  ]);

  return {
    priceRecommendations: prices,
    inventoryAlerts: alerts,
    offerSuggestions: offers,
  };
}
