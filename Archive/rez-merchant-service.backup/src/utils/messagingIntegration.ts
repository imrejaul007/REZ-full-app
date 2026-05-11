/**
 * UNIFIED MESSAGING INTEGRATION
 * Connects Merchant Service to WhatsApp/SMS/Push Services
 */

import axios from 'axios';
import { logger } from '../config/logger';

const UNIFIED_MESSAGING_URL = process.env.UNIFIED_MESSAGING_URL || 'http://localhost:4025';

/**
 * Send WhatsApp message to a customer
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string,
  merchantId: string,
  options?: {
    imageUrl?: string;
    template?: string;
    buttons?: { id: string; text: string }[];
  }
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/whatsapp`, {
      to,
      body,
      merchantId,
      ...options,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Messaging] WhatsApp failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS to a customer
 */
export async function sendSMS(
  to: string,
  message: string,
  merchantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/sms`, {
      to,
      message,
      merchantId,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Messaging] SMS failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Push notification to a customer
 */
export async function sendPushNotification(
  deviceToken: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  merchantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/push`, {
      token: deviceToken,
      notification,
      merchantId,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Messaging] Push failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email to a customer
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  merchantId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/send/email`, {
      to,
      subject,
      html,
      merchantId,
    }, {
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Messaging] Email failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send channel-routed message (AI-powered)
 */
export async function sendChannelRoutedMessage(
  userId: string,
  phone: string,
  email: string,
  deviceToken: string,
  temperature: 'hot' | 'warm' | 'cold',
  urgency: 'critical' | 'high' | 'medium' | 'low',
  payload: {
    type: 'marketing' | 'transactional' | 'support' | 'reminder' | 'offer';
    title?: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
  },
  merchantId: string
): Promise<any[]> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/route`, {
      userId,
      phone,
      email,
      deviceToken,
      temperature,
      urgency,
      payload,
      merchantId,
    }, {
      timeout: 15000,
    });

    return response.data.results || [];
  } catch (error: any) {
    logger.error('[Messaging] Route failed:', error.message);
    return [];
  }
}

/**
 * Get merchant's WhatsApp number
 */
export async function getMerchantWhatsAppNumber(
  merchantId: string
): Promise<{
  phoneNumber: string;
  wabaId: string;
  status: string;
} | null> {
  try {
    const response = await axios.get(`${UNIFIED_MESSAGING_URL}/api/merchant/whatsapp/numbers`, {
      params: { merchantId },
      timeout: 5000,
    });

    const numbers = response.data.data || [];
    return numbers.find((n: any) => n.merchantId === merchantId) || null;
  } catch (error: any) {
    logger.error('[Messaging] Get WhatsApp number failed:', error.message);
    return null;
  }
}

/**
 * Register merchant for WhatsApp Business
 */
export async function registerMerchantWhatsApp(
  merchantId: string,
  businessName: string,
  phoneNumber: string
): Promise<{
  success: boolean;
  whatsappId?: string;
  error?: string;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/merchant/whatsapp/numbers`, {
      merchantId,
      businessName,
      phoneNumber,
      config: {
        businessName,
        autoReply: true,
        aiAssistant: true,
        aiPersona: 'helpful_assistant',
      },
    }, {
      timeout: 10000,
    });

    return { success: true, whatsappId: response.data.data?.id };
  } catch (error: any) {
    logger.error('[Messaging] Register WhatsApp failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get messaging analytics for merchant
 */
export async function getMessagingAnalytics(
  merchantId: string
): Promise<{
  whatsapp: { sent: number; delivered: number; read: number };
  sms: { sent: number; delivered: number };
  email: { sent: number; opened: number };
  push: { sent: number; clicked: number };
}> {
  try {
    const response = await axios.get(`${UNIFIED_MESSAGING_URL}/api/messaging/analytics`, {
      params: { merchantId },
      timeout: 10000,
    });

    return response.data.data || {
      whatsapp: { sent: 0, delivered: 0, read: 0 },
      sms: { sent: 0, delivered: 0 },
      email: { sent: 0, opened: 0 },
      push: { sent: 0, clicked: 0 },
    };
  } catch (error: any) {
    logger.error('[Messaging] Get analytics failed:', error.message);
    return {
      whatsapp: { sent: 0, delivered: 0, read: 0 },
      sms: { sent: 0, delivered: 0 },
      email: { sent: 0, opened: 0 },
      push: { sent: 0, clicked: 0 },
    };
  }
}

/**
 * Send bulk message to customer segment
 */
export async function sendBulkMessage(
  segment: 'hot' | 'warm' | 'cold' | 'all',
  payload: {
    type: string;
    title?: string;
    body: string;
    imageUrl?: string;
  },
  merchantId: string,
  customerIds: string[]
): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  try {
    const response = await axios.post(`${UNIFIED_MESSAGING_URL}/api/broadcast/segment`, {
      segment,
      payload,
      merchantId,
      customerIds,
    }, {
      timeout: 60000,
    });

    return response.data;
  } catch (error: any) {
    logger.error('[Messaging] Bulk send failed:', error.message);
    return { total: customerIds.length, sent: 0, failed: customerIds.length };
  }
}
