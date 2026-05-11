/**
 * Event Platform Consumer Worker
 *
 * Listens to events from rez-event-platform via shared BullMQ Redis queues.
 * Processes order.completed, payment.success, inventory.low, and ad/growth events
 * for unified analytics aggregation.
 *
 * This worker acts as a consumer of the central event platform,
 * enabling analytics-events to participate in the unified event bus.
 */

import { Queue, Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { createServiceLogger } from '../config/logger';
import { bullmqRedis } from '../config/redis';
import { EventPlatformConfig } from '../config/eventPlatform';

const logger = createServiceLogger('event-platform-consumer');

// Queue names (must match rez-event-platform)
const QUEUE_ORDER = 'events-order-completed';
const QUEUE_PAYMENT = 'events-payment-success';
const QUEUE_INVENTORY = 'events-inventory-low';
const QUEUE_AD_IMPRESSION = 'events-ad-impression';
const QUEUE_AD_CLICK = 'events-ad-click';
const QUEUE_CONVERSION = 'events-conversion';
const QUEUE_CAMPAIGN = 'events-campaign-created';
const QUEUE_VOUCHER = 'events-voucher-issued';
const QUEUE_NOTIFICATION_SENT = 'events-notification-sent';
const QUEUE_NOTIFICATION_OPENED = 'events-notification-opened';

let _workers: Worker[] = [];

interface EventPlatformEvent {
  id: string;
  type: string;
  timestamp: string;
  correlationId?: string;
  source: string;
  payload: any;
}

/**
 * Store event in appevents collection (standard analytics)
 */
async function storeAppEvent(name: string, event: EventPlatformEvent, properties: any): Promise<void> {
  const AppEvents = mongoose.connection.collection('appevents');
  await AppEvents.insertOne({
    name,
    properties,
    userId: properties.userId || properties.customerId || properties.merchantId,
    sessionId: event.correlationId,
    platform: 'event-platform',
    timestamp: new Date(event.timestamp),
    receivedAt: new Date(),
    eventPlatformEventId: event.id,
    source: event.source,
  });
}

/**
 * Store event in growth_events collection (marketing analytics)
 */
async function storeGrowthEvent(event: EventPlatformEvent): Promise<void> {
  const GrowthEvents = mongoose.connection.collection('growth_events');

  // Map event types to growth event types
  const eventTypeMap: Record<string, string> = {
    'ad.impression': 'ad_impression',
    'ad.click': 'ad_click',
    'conversion': 'conversion',
    'campaign.created': 'campaign_created',
    'voucher.issued': 'voucher_issued',
    'notification.sent': 'notification_sent',
    'notification.opened': 'notification_opened',
  };

  const growthEventType = eventTypeMap[event.type] || event.type;
  const payload = event.payload;

  await GrowthEvents.insertOne({
    eventId: event.id,
    eventType: growthEventType,
    sourceService: 'event-platform',
    userId: payload.userId ? new mongoose.Types.ObjectId(payload.userId) : undefined,
    merchantId: new mongoose.Types.ObjectId(payload.merchantId),
    metadata: payload,
    value: payload.value || payload.discountValue || 0,
    timestamp: new Date(event.timestamp),
    sessionId: event.correlationId,
    processedAt: new Date(),
  });
}

// ─── Order/Payment Events ────────────────────────────────────────────────────────

async function handleOrderCompleted(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing order.completed', {
    eventId: event.id,
    orderId: payload.orderId,
    total: payload.total,
  });

  await storeAppEvent('order.completed', event, {
    orderId: payload.orderId,
    customerId: payload.customerId,
    items: payload.items,
    total: payload.total,
    paymentMethod: payload.paymentMethod,
    source: 'event-platform',
    merchantId: payload.merchantId,
  });
}

async function handlePaymentSuccess(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing payment.success', {
    eventId: event.id,
    paymentId: payload.paymentId,
    amount: payload.amount,
  });

  await storeAppEvent('payment.success', event, {
    paymentId: payload.paymentId,
    orderId: payload.orderId,
    amount: payload.amount,
    gateway: payload.gateway,
    status: payload.status,
    source: 'event-platform',
  });
}

async function handleInventoryLow(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing inventory.low', {
    eventId: event.id,
    productId: payload.productId,
    currentQuantity: payload.currentQuantity,
  });

  await storeAppEvent('inventory.low', event, {
    productId: payload.productId,
    productName: payload.productName,
    currentQuantity: payload.currentQuantity,
    threshold: payload.threshold,
    severity: payload.severity,
    source: 'event-platform',
  });
}

// ─── Ad/Growth Events ──────────────────────────────────────────────────────────

async function handleAdImpression(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing ad.impression', {
    eventId: event.id,
    adId: payload.adId,
    campaignId: payload.campaignId,
  });

  await storeAppEvent('ad.impression', event, {
    adId: payload.adId,
    campaignId: payload.campaignId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    placement: payload.placement,
    deviceType: payload.deviceType,
    platform: payload.platform,
    source: 'event-platform',
  });

  await storeGrowthEvent(event);
}

async function handleAdClick(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing ad.click', {
    eventId: event.id,
    adId: payload.adId,
    campaignId: payload.campaignId,
  });

  await storeAppEvent('ad.click', event, {
    adId: payload.adId,
    campaignId: payload.campaignId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    placement: payload.placement,
    deviceType: payload.deviceType,
    platform: payload.platform,
    ctaClicked: payload.ctaClicked,
    source: 'event-platform',
  });

  await storeGrowthEvent(event);
}

async function handleConversion(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing conversion', {
    eventId: event.id,
    campaignId: payload.campaignId,
    value: payload.value,
  });

  await storeAppEvent('conversion', event, {
    conversionId: payload.conversionId,
    campaignId: payload.campaignId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    orderId: payload.orderId,
    value: payload.value,
    channel: payload.channel,
    eventSource: payload.source,
  });

  await storeGrowthEvent(event);
}

async function handleCampaignCreated(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing campaign.created', {
    eventId: event.id,
    campaignId: payload.campaignId,
    campaignName: payload.campaignName,
  });

  await storeAppEvent('campaign.created', event, {
    campaignId: payload.campaignId,
    campaignName: payload.campaignName,
    merchantId: payload.merchantId,
    channel: payload.channel,
    budget: payload.budget,
    startDate: payload.startDate,
    endDate: payload.endDate,
    source: 'event-platform',
  });

  await storeGrowthEvent(event);
}

async function handleVoucherIssued(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing voucher.issued', {
    eventId: event.id,
    voucherId: payload.voucherId,
    campaignId: payload.campaignId,
  });

  await storeAppEvent('voucher.issued', event, {
    voucherId: payload.voucherId,
    campaignId: payload.campaignId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    voucherCode: payload.voucherCode,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    source: 'event-platform',
  });

  await storeGrowthEvent(event);
}

async function handleNotificationSent(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing notification.sent', {
    eventId: event.id,
    notificationId: payload.notificationId,
    channel: payload.channel,
  });

  await storeAppEvent('notification.sent', event, {
    notificationId: payload.notificationId,
    campaignId: payload.campaignId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    channel: payload.channel,
    templateId: payload.templateId,
    title: payload.title,
    source: 'event-platform',
  });

  await storeGrowthEvent(event);
}

async function handleNotificationOpened(event: EventPlatformEvent): Promise<void> {
  const { payload } = event;
  logger.info('[EventPlatform] Processing notification.opened', {
    eventId: event.id,
    notificationId: payload.notificationId,
    channel: payload.channel,
  });

  await storeAppEvent('notification.opened', event, {
    notificationId: payload.notificationId,
    campaignId: payload.campaignId,
    merchantId: payload.merchantId,
    userId: payload.userId,
    channel: payload.channel,
    source: 'event-platform',
  });

  await storeGrowthEvent(event);
}

/**
 * Unified event handler - dispatches to specific handlers
 */
async function handleEvent(job: Job): Promise<void> {
  const { event } = job.data as { event: EventPlatformEvent; publishedAt: string };

  if (!event) {
    logger.warn('[EventPlatform] Job missing event data', { jobId: job.id });
    return;
  }

  switch (event.type) {
    // Commerce events
    case 'order.completed':
      await handleOrderCompleted(event);
      break;
    case 'payment.success':
      await handlePaymentSuccess(event);
      break;
    case 'inventory.low':
      await handleInventoryLow(event);
      break;
    // Ad/Growth events
    case 'ad.impression':
      await handleAdImpression(event);
      break;
    case 'ad.click':
      await handleAdClick(event);
      break;
    case 'conversion':
      await handleConversion(event);
      break;
    case 'campaign.created':
      await handleCampaignCreated(event);
      break;
    case 'voucher.issued':
      await handleVoucherIssued(event);
      break;
    case 'notification.sent':
      await handleNotificationSent(event);
      break;
    case 'notification.opened':
      await handleNotificationOpened(event);
      break;
    default:
      logger.info('[EventPlatform] Unhandled event type', { type: event.type, eventId: event.id });
  }
}

/**
 * Create a worker for a specific queue
 */
function createQueueWorker(queueName: string): Worker {
  return new Worker(
    queueName,
    async (job: Job) => {
      try {
        await handleEvent(job);
      } catch (error: any) {
        logger.error('[EventPlatform] Event processing failed', {
          jobId: job.id,
          queue: queueName,
          error: error.message,
        });
        throw error;
      }
    },
    {
      connection: bullmqRedis,
      concurrency: EventPlatformConfig.concurrency,
      lockDuration: 30000,
      lockRenewTime: 5000,
      stalledInterval: 30000,
      maxStalledCount: 2,
    },
  );
}

/**
 * Start the event platform consumer workers
 */
export async function startEventPlatformConsumer(): Promise<void> {
  if (!EventPlatformConfig.enabled) {
    logger.info('[EventPlatform] Consumer disabled via config');
    return;
  }

  logger.info('[EventPlatform] Starting consumer workers...');

  const queues = [
    QUEUE_ORDER,
    QUEUE_PAYMENT,
    QUEUE_INVENTORY,
    QUEUE_AD_IMPRESSION,
    QUEUE_AD_CLICK,
    QUEUE_CONVERSION,
    QUEUE_CAMPAIGN,
    QUEUE_VOUCHER,
    QUEUE_NOTIFICATION_SENT,
    QUEUE_NOTIFICATION_OPENED,
  ];

  for (const queueName of queues) {
    const worker = createQueueWorker(queueName);

    worker.on('completed', (job) => {
      logger.debug('[EventPlatform] Job completed', { jobId: job.id, queue: queueName });
    });

    worker.on('failed', (job, err) => {
      logger.error('[EventPlatform] Job failed', {
        jobId: job?.id,
        queue: queueName,
        error: err.message,
      });
    });

    worker.on('error', (err) => {
      logger.error('[EventPlatform] Worker error', { queue: queueName, error: err.message });
    });

    worker.on('stalled', (jobId: string) => {
      logger.warn('[EventPlatform] Job stalled', { jobId, queue: queueName });
    });

    _workers.push(worker);
  }

  logger.info(`[EventPlatform] ${_workers.length} consumer workers started`);
}

/**
 * Stop all event platform consumer workers
 */
export async function stopEventPlatformConsumer(): Promise<void> {
  for (const worker of _workers) {
    await worker.close();
  }
  _workers = [];
  logger.info('[EventPlatform] Consumer workers stopped');
}
