import { SyncService } from './SyncService';
import { logger } from '../config/logger';

export interface CrossAppUpdate {
  type: 'order_status' | 'product_update' | 'cashback_update' | 'merchant_update';
  merchantId: string;
  customerId?: string;
  orderId?: string;
  productId?: string;
  data: any;
  timestamp: Date;
  source: 'merchant_app' | 'customer_app';
}

export interface OrderStatusUpdate {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  statusMessage?: string;
  estimatedDelivery?: Date;
  tracking?: {
    trackingNumber: string;
    carrier: string;
    trackingUrl?: string;
  };
  timeline: Array<{
    status: string;
    timestamp: Date;
    message: string;
    location?: string;
  }>;
}

export interface ProductAvailabilityUpdate {
  productId: string;
  inStock: boolean;
  quantity?: number;
  priceChanged?: boolean;
  newPrice?: number;
  backInStockDate?: Date;
}

export interface CashbackStatusUpdate {
  requestId: string;
  orderId: string;
  customerId: string;
  oldStatus: string;
  newStatus: string;
  approvedAmount?: number;
  rejectionReason?: string;
  timeline: Array<{
    status: string;
    timestamp: Date;
    message: string;
    amount?: number;
  }>;
}

export class CrossAppSyncService {
  private static customerAppWebhooks: Map<string, string> = new Map();
  private static updateQueue: CrossAppUpdate[] = [];
  // Hard cap on the in-memory queue. If the consumer falls behind this limit,
  // the oldest entry is evicted (head-drop) so the array never grows without bound.
  private static readonly MAX_QUEUE_SIZE = 500;
  private static isProcessing = false;
  private static syncProcessInterval: NodeJS.Timeout | null = null;

  // Initialize cross-app sync
  static initialize() {
    // Clear any existing interval to prevent duplicates
    if (this.syncProcessInterval) {
      clearInterval(this.syncProcessInterval);
    }

    // Process update queue every 5 seconds
    this.syncProcessInterval = setInterval(() => {
      this.processUpdateQueue();
    }, 5000);

    logger.info('🔄 Cross-app sync service initialized');
  }

  // Shutdown cross-app sync service
  static shutdown() {
    if (this.syncProcessInterval) {
      clearInterval(this.syncProcessInterval);
      this.syncProcessInterval = null;
      logger.info('🔄 Cross-app sync service shut down');
    }
  }

  // Register customer app webhook URL for a merchant
  static registerCustomerAppWebhook(merchantId: string, webhookUrl: string) {
    this.customerAppWebhooks.set(merchantId, webhookUrl);
    logger.info(`🔗 Registered customer app webhook for merchant ${merchantId}`);
  }

  // Send order status update to customer app
  static async sendOrderStatusUpdate(
    merchantId: string,
    orderId: string,
    customerId: string,
    update: OrderStatusUpdate,
  ) {
    const crossAppUpdate: CrossAppUpdate = {
      type: 'order_status',
      merchantId,
      customerId,
      orderId,
      data: update,
      timestamp: new Date(),
      source: 'merchant_app',
    };

    // Add to queue for processing (bounded — see enqueueUpdate)
    this.enqueueUpdate(crossAppUpdate);

    // Also emit real-time event to merchant app
    if ((global as any).realTimeService) {
      (global as any).realTimeService.emitOrderEvent(merchantId, {
        type: 'order_updated',
        merchantId,
        data: { orderId, customerId, statusUpdate: update },
        timestamp: new Date(),
      });
    }

    logger.info(`📦 Queued order status update for order ${orderId}`);
  }

  // Send product availability update to customer app
  static async sendProductUpdate(merchantId: string, productId: string, update: ProductAvailabilityUpdate) {
    const crossAppUpdate: CrossAppUpdate = {
      type: 'product_update',
      merchantId,
      productId,
      data: update,
      timestamp: new Date(),
      source: 'merchant_app',
    };

    this.enqueueUpdate(crossAppUpdate);

    // Emit real-time event to merchant app
    if ((global as any).realTimeService) {
      (global as any).realTimeService.emitProductEvent(merchantId, {
        type: 'product_updated',
        merchantId,
        data: { productId, availabilityUpdate: update },
        timestamp: new Date(),
      });
    }

    logger.info(`📦 Queued product update for product ${productId}`);
  }

  // Send cashback status update to customer app
  static async sendCashbackUpdate(merchantId: string, customerId: string, update: CashbackStatusUpdate) {
    const crossAppUpdate: CrossAppUpdate = {
      type: 'cashback_update',
      merchantId,
      customerId,
      data: update,
      timestamp: new Date(),
      source: 'merchant_app',
    };

    this.enqueueUpdate(crossAppUpdate);

    // Emit real-time event to merchant app
    if ((global as any).realTimeService) {
      (global as any).realTimeService.emitCashbackEvent(merchantId, {
        type: 'cashback_updated',
        merchantId,
        data: { customerId, cashbackUpdate: update },
        timestamp: new Date(),
      });
    }

    logger.info(`💰 Queued cashback update for request ${update.requestId}`);
  }

  // Bounded enqueue: drop the oldest entry (head) when the cap is reached so
  // the array never grows without bound regardless of consumer throughput.
  private static enqueueUpdate(update: CrossAppUpdate) {
    if (this.updateQueue.length >= this.MAX_QUEUE_SIZE) {
      const dropped = this.updateQueue.shift();
      logger.warn(
        `[CrossAppSync] updateQueue at cap (${this.MAX_QUEUE_SIZE}); ` +
          `dropped oldest entry type=${dropped?.type} merchant=${dropped?.merchantId}`,
      );
    }
    this.updateQueue.push(update);
  }

  // Process the update queue
  private static async processUpdateQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process updates in batches
      const batch = this.updateQueue.splice(0, 10);

      for (const update of batch) {
        await this.processUpdate(update);
      }

      if (batch.length > 0) {
        logger.info(`✅ Processed ${batch.length} cross-app updates`);
      }
    } catch (error) {
      logger.error('Error processing update queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual update
  private static async processUpdate(update: CrossAppUpdate) {
    try {
      const webhookUrl = this.customerAppWebhooks.get(update.merchantId);

      if (webhookUrl) {
        // Send to customer app webhook
        await this.sendToCustomerApp(webhookUrl, update);
      } else {
        // Log that no webhook is configured
        logger.info(`⚠️ No customer app webhook configured for merchant ${update.merchantId}`);
      }

      // Always trigger sync to ensure consistency
      await this.triggerSyncForUpdate(update);
    } catch (error) {
      logger.error(`Error processing update ${update.type}:`, error);

      // Re-queue failed updates (with retry limit) via bounded enqueue so
      // cascading failures cannot cause the queue to grow without bound.
      if (!update.data._retryCount || update.data._retryCount < 3) {
        update.data._retryCount = (update.data._retryCount || 0) + 1;
        this.enqueueUpdate(update);
      }
    }
  }

  // Send update to customer app via webhook (real HTTP delivery)
  private static async sendToCustomerApp(webhookUrl: string, update: CrossAppUpdate) {
    const payload = {
      event: update.type,
      merchantId: update.merchantId,
      customerId: update.customerId,
      orderId: update.orderId,
      productId: update.productId,
      data: update.data,
      timestamp: update.timestamp,
      source: update.source,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Source': 'merchant-app',
      'X-Merchant-ID': update.merchantId,
      'X-REZ-Event': update.type,
    };

    // OBS-2: propagate correlation-id so downstream webhook receivers can tie
    // their logs back to the originating request chain. The retry loop that
    // wraps this call could otherwise amplify untraced failures.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getCurrentCorrelationId } = require('../utils/correlationContext');
      const cid = getCurrentCorrelationId?.();
      if (cid) headers['X-Correlation-ID'] = cid;
    } catch {
      /* correlationContext helper not available in this build — skip */
    }

    const secret = process.env.WEBHOOK_SECRET;
    if (secret) {
      const crypto = require('crypto');
      headers['X-REZ-Signature'] =
        'sha256=' + crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    }

    const axios = require('axios');
    const response = await axios.post(webhookUrl, payload, {
      headers,
      timeout: 5000,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Webhook delivery failed with HTTP ${response.status}`);
    }

    logger.info(`Webhook delivered: ${update.type} for merchant ${update.merchantId} → ${webhookUrl}`);
  }

  // Trigger appropriate sync based on update type
  private static async triggerSyncForUpdate(update: CrossAppUpdate) {
    try {
      let syncTypes: ('products' | 'orders' | 'cashback' | 'merchant')[] = [];

      switch (update.type) {
        case 'order_status':
          syncTypes = ['orders'];
          break;
        case 'product_update':
          syncTypes = ['products'];
          break;
        case 'cashback_update':
          syncTypes = ['cashback'];
          break;
        case 'merchant_update':
          syncTypes = ['merchant'];
          break;
      }

      if (syncTypes.length > 0) {
        await SyncService.syncToCustomerApp({
          merchantId: update.merchantId,
          syncTypes,
          batchSize: 50,
        });
      }
    } catch (error) {
      logger.error('Error triggering sync for update:', error);
    }
  }

  // Handle incoming updates from customer app
  static async handleCustomerAppUpdate(update: CrossAppUpdate) {
    logger.info(`📱 Received update from customer app: ${update.type}`);

    // Process based on update type
    switch (update.type) {
      case 'order_status':
        await this.handleCustomerOrderUpdate(update);
        break;
      case 'cashback_update':
        await this.handleCustomerCashbackUpdate(update);
        break;
      default:
        logger.info(`Unknown update type from customer app: ${update.type}`);
    }

    // Emit real-time event to merchant app
    if ((global as any).realTimeService) {
      (global as any).realTimeService.emitOrderEvent(update.merchantId, {
        type: update.type === 'order_status' ? 'order_updated' : 'cashback_updated',
        merchantId: update.merchantId,
        data: update.data,
        timestamp: new Date(),
      });
    }
  }

  // Handle order updates from customer app (e.g., customer initiated returns)
  private static async handleCustomerOrderUpdate(update: CrossAppUpdate) {
    const { orderId, data: _data } = update;

    // Update order in merchant database
    // This would integrate with your OrderModel
    logger.info(`🔄 Processing customer order update for order ${orderId}`);

    // Example: Handle return requests, delivery confirmations, etc.
    // await OrderModel.updateStatus(orderId, data.newStatus, data.statusMessage);
  }

  // Handle cashback updates from customer app
  private static async handleCustomerCashbackUpdate(update: CrossAppUpdate) {
    const { data } = update;

    logger.info(`💰 Processing customer cashback update for request ${data.requestId}`);

    // This might be notifications about cashback usage, disputes, etc.
  }

  // Get sync status across apps
  static getCrossAppSyncStatus(merchantId: string) {
    const hasWebhook = this.customerAppWebhooks.has(merchantId);
    const queueSize = this.updateQueue.filter((u) => u.merchantId === merchantId).length;

    return {
      merchantId,
      hasCustomerAppWebhook: hasWebhook,
      webhookUrl: hasWebhook ? this.customerAppWebhooks.get(merchantId) : null,
      pendingUpdates: queueSize,
      isProcessing: this.isProcessing,
      lastSync: SyncService.getSyncStatus(merchantId).lastSync,
    };
  }

  // Get cross-app statistics
  static getCrossAppStatistics() {
    const totalUpdates = this.updateQueue.length;
    const updatesByType = this.updateQueue.reduce(
      (acc, update) => {
        acc[update.type] = (acc[update.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalPendingUpdates: totalUpdates,
      updatesByType,
      registeredWebhooks: this.customerAppWebhooks.size,
      isProcessing: this.isProcessing,
    };
  }

  // Cleanup method
  static cleanup() {
    this.updateQueue.length = 0;
    this.customerAppWebhooks.clear();
    logger.info('🧹 Cross-app sync service cleaned up');
  }

  // Method needed by merchant-profile route
  static async sendMerchantUpdate(merchantId: string, updateData: any): Promise<void> {
    try {
      // Broadcast to real-time service if available
      if ((global as any).realTimeService) {
        (global as any).realTimeService.sendMerchantUpdate(merchantId, {
          type: 'merchant_update',
          merchantId,
          data: updateData,
          timestamp: new Date(),
        });
      }

      // Log for debugging
      logger.info('Merchant update sent:', { merchantId, updateData });
    } catch (error) {
      logger.error('Failed to send merchant update:', error);
    }
  }
}

// Helper functions for common update scenarios

// Order status progression helper
export const createOrderStatusTimeline = (
  currentStatus: string,
  newStatus: string,
  message?: string,
  location?: string,
) => {
  const timestamp = new Date();

  const statusMessages = {
    pending: 'Order received and being processed',
    confirmed: 'Order confirmed by merchant',
    preparing: 'Order is being prepared',
    ready: 'Order is ready for pickup/delivery',
    shipped: 'Order has been shipped',
    out_for_delivery: 'Order is out for delivery',
    delivered: 'Order has been delivered',
    cancelled: 'Order has been cancelled',
    returned: 'Order has been returned',
  };

  return {
    status: newStatus,
    timestamp,
    message: message || statusMessages[newStatus as keyof typeof statusMessages] || 'Status updated',
    location,
  };
};

// Product availability helper
export const createProductAvailabilityUpdate = (
  productId: string,
  currentStock: number,
  newStock: number,
  price?: number,
  oldPrice?: number,
): ProductAvailabilityUpdate => {
  return {
    productId,
    inStock: newStock > 0,
    quantity: newStock,
    priceChanged: price !== undefined && oldPrice !== undefined && price !== oldPrice,
    newPrice: price,
    backInStockDate: newStock <= 0 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined, // 7 days estimate
  };
};

// Cashback status helper
export const createCashbackStatusUpdate = (
  requestId: string,
  orderId: string,
  customerId: string,
  oldStatus: string,
  newStatus: string,
  approvedAmount?: number,
  rejectionReason?: string,
): CashbackStatusUpdate => {
  const timeline = {
    status: newStatus,
    timestamp: new Date(),
    message: getCashbackStatusMessage(newStatus, rejectionReason),
    amount: approvedAmount,
  };

  return {
    requestId,
    orderId,
    customerId,
    oldStatus,
    newStatus,
    approvedAmount,
    rejectionReason,
    timeline: [timeline],
  };
};

function getCashbackStatusMessage(status: string, rejectionReason?: string): string {
  const messages = {
    pending: 'Cashback request submitted for review',
    under_review: 'Cashback request is being reviewed',
    approved: 'Cashback request has been approved',
    rejected: rejectionReason || 'Cashback request has been rejected',
    paid: 'Cashback has been paid to your account',
    disputed: 'Cashback request is under dispute',
  };

  return messages[status as keyof typeof messages] || 'Cashback status updated';
}
