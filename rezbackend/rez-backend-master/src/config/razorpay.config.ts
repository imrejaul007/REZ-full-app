// @ts-nocheck
/**
 * RABTUL Payment Service Configuration
 *
 * This file has been migrated from Razorpay to RABTUL Payment Service.
 * All payment operations now use the centralized RABTUL Payment Service API.
 *
 * Environment variables:
 * PAYMENT_SERVICE_URL - URL of the RABTUL Payment Service (default: https://rez-payment-service.onrender.com)
 * INTERNAL_SERVICE_TOKEN - Token for service-to-service authentication
 */

import { logger } from './logger';

// RABTUL Payment Service configuration
export const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com';
export const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

if (!INTERNAL_SERVICE_TOKEN) {
  logger.warn('[RABTUL Payment] Missing INTERNAL_SERVICE_TOKEN - payment features may fail');
}

/**
 * Creates a payment order via RABTUL Payment Service
 * @param orderData - Order data for payment initiation
 * @returns Payment order response from RABTUL Payment Service
 */
export async function createRazorpayOrder(orderData: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
  merchantId?: string;
  orderId?: string;
}): Promise<any> {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RABTUL Payment Service error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Fetches payment/order status from RABTUL Payment Service
 * @param orderId - The order/payment ID to fetch
 * @returns Payment status from RABTUL Payment Service
 */
export async function fetchRazorpayOrder(orderId: string): Promise<any> {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/status/${orderId}`, {
    method: 'GET',
    headers: {
      'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RABTUL Payment Service error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Fetches payments for an order from RABTUL Payment Service
 * @param orderId - The order ID to fetch payments for
 * @returns Payments list from RABTUL Payment Service
 */
export async function fetchRazorpayOrderPayments(orderId: string): Promise<any> {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/${orderId}/payments`, {
    method: 'GET',
    headers: {
      'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RABTUL Payment Service error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Legacy export for compatibility - returns null since we use RABTUL Payment Service
export const razorpay = null;

export const isLiveMode = (): boolean => process.env.NODE_ENV === 'production';

export const getWebhookSecret = (): string => process.env.RABTUL_WEBHOOK_SECRET || '';

export const razorpayConfig = {
  // RABTUL Payment Service uses internal tokens instead of API keys
  keyId: process.env.INTERNAL_SERVICE_TOKEN ? 'RABTUL_PAYMENT_SERVICE' : '',
  keySecret: process.env.INTERNAL_SERVICE_TOKEN ? 'configured' : '',

  // Currency
  currency: 'INR',

  // Receipt prefix for order tracking
  receiptPrefix: 'order_rcpt_',

  // Payment methods to enable
  enabledPaymentMethods: {
    card: true,
    netbanking: true,
    upi: true,
    wallet: true,
    emi: false,
  },

  // Checkout options
  checkout: {
    name: 'REZ App',
    description: 'Order Payment',
    image:
      process.env.APP_LOGO_URL ||
      `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/rez-logo.png`,
    theme: {
      color: '#8B5CF6',
    },
  },

  // RABTUL Payment Service endpoint
  paymentServiceUrl: PAYMENT_SERVICE_URL,

  // Test mode flag
  isTestMode: process.env.NODE_ENV !== 'production',
};

// Helper to validate RABTUL Payment Service configuration
export function validateRazorpayConfig(): boolean {
  if (!INTERNAL_SERVICE_TOKEN) {
    logger.warn('[RABTUL Payment] INTERNAL_SERVICE_TOKEN not configured. Add INTERNAL_SERVICE_TOKEN to .env');
    return false;
  }

  logger.info('[RABTUL Payment] Configuration validated');
  logger.info(`[RABTUL Payment] Payment Service URL: ${PAYMENT_SERVICE_URL}`);
  logger.info(`[RABTUL Payment] Mode: ${razorpayConfig.isTestMode ? 'TEST' : 'PRODUCTION'}`);

  return true;
}
