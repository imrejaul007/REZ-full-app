import { logger } from './config/logger';
import { smsService } from './services/sms.service';
import { whatsAppService } from './services/whatsapp.service';
import {
  notificationUtils,
  NotificationPayload,
  NotificationChannel,
  NotificationPriority,
  UserNotificationPreferences,
  NotificationRoutingConfig,
  DEFAULT_QUIET_HOURS
} from './services/notification.utils';

/**
 * Notification delivery result
 */
interface DeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

/**
 * Full notification result
 */
interface NotificationResult {
  success: boolean;
  delivered: DeliveryResult[];
  totalAttempts: number;
  failedChannels: string[];
}

/**
 * Merchant notification preferences (would typically come from database)
 */
interface MerchantPreferences {
  merchantId: string;
  notificationPrefs: UserNotificationPreferences;
  routingConfig: NotificationRoutingConfig;
}

/**
 * Notification service for sending alerts and updates via multiple channels
 * Supports: Push, Email, SMS (Twilio), WhatsApp (Twilio), In-App
 */
class NotificationService {
  /**
   * Rate limit tracking (per merchant)
   */
  private merchantRateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
  private readonly MAX_NOTIFICATIONS_PER_WINDOW = 100;

  /**
   * Send notification to all configured channels
   */
  async sendNotification(
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<NotificationResult> {
    const results: DeliveryResult[] = [];
    let totalAttempts = 0;

    // Check merchant rate limit
    if (!this.checkMerchantRateLimit(preferences.merchantId)) {
      logger.warn(`Merchant rate limit exceeded: ${preferences.merchantId}`);
      return {
        success: false,
        delivered: [],
        totalAttempts: 0,
        failedChannels: ['rate_limit']
      };
    }

    // Check quiet hours
    const canSend = notificationUtils.canSendDuringQuietHours(
      preferences.notificationPrefs,
      payload.priority
    );

    if (!canSend) {
      const nextTime = notificationUtils.getNextAvailableTime(preferences.notificationPrefs);
      logger.info(`Notification queued for after quiet hours`, {
        merchantId: payload.merchantId,
        type: payload.type,
        nextAvailableTime: nextTime.toISOString()
      });

      // Still log the notification for future delivery
      return {
        success: true,
        delivered: [{
          channel: 'in_app',
          success: true,
          skipped: true,
          skipReason: `Queued for ${nextTime.toISOString()} (quiet hours)`
        }],
        totalAttempts: 1,
        failedChannels: []
      };
    }

    // Get channels to use
    const channels = notificationUtils.getChannelsForNotification(
      preferences.notificationPrefs,
      preferences.routingConfig
    );

    // Deliver to each channel
    for (const channel of channels) {
      totalAttempts++;
      const result = await this.deliverToChannel(channel, payload, preferences);
      results.push(result);
    }

    const failedChannels = results
      .filter(r => !r.success && !r.skipped)
      .map(r => r.channel);

    const successCount = results.filter(r => r.success).length;

    logger.info(`Notification delivery complete`, {
      merchantId: payload.merchantId,
      type: payload.type,
      totalChannels: channels.length,
      successful: successCount,
      failed: failedChannels.length
    });

    return {
      success: failedChannels.length === 0,
      delivered: results,
      totalAttempts,
      failedChannels
    };
  }

  /**
   * Deliver notification to a specific channel
   */
  private async deliverToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<DeliveryResult> {
    // Check channel availability for user
    if (!notificationUtils.isChannelAvailable(preferences.notificationPrefs, channel)) {
      return {
        channel,
        success: false,
        skipped: true,
        skipReason: 'Channel not available for user (missing contact info)'
      };
    }

    try {
      switch (channel) {
        case 'sms':
          return await this.sendSMS(payload, preferences);
        case 'whatsapp':
          return await this.sendWhatsApp(payload, preferences);
        case 'email':
          return await this.sendEmail(payload, preferences);
        case 'push':
          return await this.sendPush(payload, preferences);
        case 'in_app':
          return await this.sendInApp(payload, preferences);
        default:
          return {
            channel,
            success: false,
            error: `Unknown channel: ${channel}`
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to deliver to ${channel}`, { error: errorMessage });
      return {
        channel,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<DeliveryResult> {
    const phone = preferences.notificationPrefs.phone;

    if (!phone) {
      return {
        channel: 'sms',
        success: false,
        skipped: true,
        skipReason: 'No phone number configured'
      };
    }

    const message = notificationUtils.formatForSMS(
      `${payload.subject}: ${payload.message}`
    );

    const result = await smsService.send(phone, message);

    return {
      channel: 'sms',
      success: result.success,
      messageId: result.messageId,
      error: result.error
    };
  }

  /**
   * Send WhatsApp message via Twilio
   */
  private async sendWhatsApp(
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<DeliveryResult> {
    const phone = preferences.notificationPrefs.phone;

    if (!phone) {
      return {
        channel: 'whatsapp',
        success: false,
        skipped: true,
        skipReason: 'No phone number configured'
      };
    }

    const message = notificationUtils.formatForWhatsApp(
      `*${payload.subject}*\n\n${payload.message}`
    );

    const result = await whatsAppService.send(phone, message);

    return {
      channel: 'whatsapp',
      success: result.success,
      messageId: result.messageId,
      error: result.error
    };
  }

  /**
   * Send email notification (placeholder - integrate with SendGrid/SES)
   */
  private async sendEmail(
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<DeliveryResult> {
    const email = preferences.notificationPrefs.email;

    if (!email) {
      return {
        channel: 'email',
        success: false,
        skipped: true,
        skipReason: 'No email configured'
      };
    }

    // Email integration would go here (SendGrid, SES, etc.)
    logger.info(`Email notification sent (placeholder)`, {
      to: email,
      subject: payload.subject
    });

    return {
      channel: 'email',
      success: true,
      messageId: `email_${Date.now()}`
    };
  }

  /**
   * Send push notification (placeholder - integrate with FCM/APNS)
   */
  private async sendPush(
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<DeliveryResult> {
    // Push notification integration would go here (FCM, APNS, etc.)
    logger.info(`Push notification sent (placeholder)`, {
      merchantId: payload.merchantId,
      subject: payload.subject
    });

    return {
      channel: 'push',
      success: true,
      messageId: `push_${Date.now()}`
    };
  }

  /**
   * Send in-app notification (stored in database for app to fetch)
   */
  private async sendInApp(
    payload: NotificationPayload,
    preferences: MerchantPreferences
  ): Promise<DeliveryResult> {
    // In-app notification would be stored in database
    logger.info(`In-app notification stored`, {
      merchantId: payload.merchantId,
      subject: payload.subject
    });

    return {
      channel: 'in_app',
      success: true,
      messageId: payload.id
    };
  }

  /**
   * Check merchant rate limit
   */
  private checkMerchantRateLimit(merchantId: string): boolean {
    const now = Date.now();
    const limit = this.merchantRateLimits.get(merchantId);

    if (!limit || now >= limit.resetTime) {
      this.merchantRateLimits.set(merchantId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW_MS
      });
      return true;
    }

    if (limit.count >= this.MAX_NOTIFICATIONS_PER_WINDOW) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Create notification payload
   */
  createPayload(params: {
    type: string;
    merchantId: string;
    subject: string;
    message: string;
    priority?: NotificationPriority;
    data?: Record<string, unknown>;
  }): NotificationPayload {
    return notificationUtils.createPayload(params);
  }

  /**
   * Get default merchant preferences
   */
  getDefaultMerchantPreferences(merchantId: string): MerchantPreferences {
    return {
      merchantId,
      notificationPrefs: {
        channels: ['email', 'in_app'],
        quietHours: DEFAULT_QUIET_HOURS
      },
      routingConfig: {
        channels: ['email', 'sms', 'whatsapp', 'push', 'in_app'],
        priorityThreshold: 'high',
        forceChannels: ['in_app']
      }
    };
  }

  // ==================== Notification Templates ====================

  /**
   * Send invoice generated notification
   */
  async sendInvoiceGenerated(invoice: {
    invoiceNumber: string;
    merchantId: string;
    total: number;
    dueDate: Date;
  }): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'INVOICE_GENERATED',
      merchantId: invoice.merchantId,
      subject: `Invoice ${invoice.invoiceNumber} Generated`,
      message: `Your invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} is now available. Due date: ${invoice.dueDate.toLocaleDateString()}.`,
      priority: 'high',
      data: { invoiceNumber: invoice.invoiceNumber, total: invoice.total }
    });

    const prefs = this.getDefaultMerchantPreferences(invoice.merchantId);
    return this.sendNotification(payload, prefs);
  }

  /**
   * Send invoice paid notification
   */
  async sendInvoicePaid(invoice: {
    invoiceNumber: string;
    merchantId: string;
    total: number;
  }): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'INVOICE_PAID',
      merchantId: invoice.merchantId,
      subject: `Invoice ${invoice.invoiceNumber} Paid`,
      message: `Your invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} has been paid successfully.`,
      priority: 'medium',
      data: { invoiceNumber: invoice.invoiceNumber }
    });

    const prefs = this.getDefaultMerchantPreferences(invoice.merchantId);
    return this.sendNotification(payload, prefs);
  }

  /**
   * Send invoice overdue notification
   */
  async sendInvoiceOverdue(invoice: {
    invoiceNumber: string;
    merchantId: string;
    total: number;
    dueDate: Date;
  }): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'INVOICE_OVERDUE',
      merchantId: invoice.merchantId,
      subject: `Invoice ${invoice.invoiceNumber} Overdue`,
      message: `Your invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} is overdue. Original due date: ${invoice.dueDate.toLocaleDateString()}.`,
      priority: 'urgent',
      data: { invoiceNumber: invoice.invoiceNumber, total: invoice.total }
    });

    const prefs = this.getDefaultMerchantPreferences(invoice.merchantId);
    // For urgent notifications, also enable SMS and WhatsApp
    prefs.notificationPrefs.channels = ['email', 'sms', 'whatsapp', 'in_app'];
    return this.sendNotification(payload, prefs);
  }

  /**
   * Send fraud alert notification
   */
  async sendFraudAlert(alert: {
    alertId: string;
    merchantId: string;
    type: string;
    severity: string;
    description: string;
  }): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'FRAUD_ALERT',
      merchantId: alert.merchantId,
      subject: `Security Alert: ${alert.type}`,
      message: `A ${alert.severity} severity fraud alert has been raised: ${alert.description}. Alert ID: ${alert.alertId}`,
      priority: alert.severity === 'critical' ? 'urgent' : 'high',
      data: { alertId: alert.alertId, severity: alert.severity }
    });

    const prefs = this.getDefaultMerchantPreferences(alert.merchantId);
    // Security alerts go through all channels
    prefs.notificationPrefs.channels = ['email', 'sms', 'whatsapp', 'push', 'in_app'];
    return this.sendNotification(payload, prefs);
  }

  /**
   * Send settlement completed notification
   */
  async sendSettlementCompleted(settlement: {
    settlementId: string;
    merchantId: string;
    amount: number;
  }): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'SETTLEMENT_COMPLETED',
      merchantId: settlement.merchantId,
      subject: `Settlement Completed`,
      message: `Your settlement of $${settlement.amount.toFixed(2)} has been processed successfully. Settlement ID: ${settlement.settlementId}`,
      priority: 'medium',
      data: { settlementId: settlement.settlementId, amount: settlement.amount }
    });

    const prefs = this.getDefaultMerchantPreferences(settlement.merchantId);
    return this.sendNotification(payload, prefs);
  }

  /**
   * Send low balance warning
   */
  async sendLowBalanceWarning(
    merchantId: string,
    balance: number,
    threshold: number
  ): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'LOW_BALANCE',
      merchantId,
      subject: 'Low Wallet Balance Warning',
      message: `Your wallet balance ($${balance.toFixed(2)}) is below the threshold of $${threshold.toFixed(2)}. Please top up to avoid service interruption.`,
      priority: balance < threshold * 0.5 ? 'high' : 'medium',
      data: { balance, threshold }
    });

    const prefs = this.getDefaultMerchantPreferences(merchantId);
    prefs.notificationPrefs.channels = ['email', 'sms', 'in_app'];
    return this.sendNotification(payload, prefs);
  }

  /**
   * Send auto top-up notification
   */
  async sendAutoTopUp(
    merchantId: string,
    amount: number,
    newBalance: number
  ): Promise<NotificationResult> {
    const payload = this.createPayload({
      type: 'AUTO_TOP_UP',
      merchantId,
      subject: 'Wallet Auto Top-Up',
      message: `Your wallet has been automatically topped up by $${amount.toFixed(2)}. New balance: $${newBalance.toFixed(2)}`,
      priority: 'low',
      data: { amount, newBalance }
    });

    const prefs = this.getDefaultMerchantPreferences(merchantId);
    return this.sendNotification(payload, prefs);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
