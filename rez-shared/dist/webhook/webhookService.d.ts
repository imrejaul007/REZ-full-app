/**
 * Webhook Service
 *
 * Manages outgoing webhooks to external systems.
 * Supports signing, retries, delivery tracking.
 *
 * Usage:
 * ```typescript
 * const webhookService = new WebhookService(redis, mongoose, jobQueue);
 * await webhookService.register(merchantId, 'https://example.com/webhooks', 'order.created');
 * await webhookService.trigger('order.created', { orderId: '123' });
 * ```
 */
import type Redis from 'ioredis';
import mongoose, { Document } from 'mongoose';
import { JobQueue } from '../queue/jobQueue';
export declare enum WebhookEventType {
    ORDER_CREATED = "order.created",
    ORDER_CONFIRMED = "order.confirmed",
    ORDER_STATUS_UPDATED = "order.status_updated",
    ORDER_CANCELLED = "order.cancelled",
    ORDER_DELIVERED = "order.delivered",
    PAYMENT_RECEIVED = "payment.received",
    PAYMENT_FAILED = "payment.failed",
    PAYMENT_REFUNDED = "payment.refunded",
    OFFER_CREATED = "offer.created",
    OFFER_UPDATED = "offer.updated",
    OFFER_COMPLETED = "offer.completed",
    KDS_ORDER_READY = "kds.order_ready",
    KDS_ORDER_STARTED = "kds.order_started"
}
/**
 * Webhook subscription model
 */
export interface IWebhook extends Document {
    merchant: mongoose.Types.ObjectId;
    targetUrl: string;
    events: WebhookEventType[];
    secret: string;
    isActive: boolean;
    maxRetries: number;
    retryPolicy: 'exponential' | 'fixed';
    headers?: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Webhook: mongoose.Model<IWebhook, {}, {}, {}, mongoose.Document<unknown, {}, IWebhook, {}, {}> & IWebhook & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
/**
 * Webhook delivery log
 */
export interface IWebhookDelivery extends Document {
    webhook: mongoose.Types.ObjectId;
    event: string;
    payload: any;
    statusCode?: number;
    response?: string;
    error?: string;
    attempt: number;
    nextRetryAt?: Date;
    delivered: boolean;
    createdAt: Date;
}
export declare const WebhookDelivery: mongoose.Model<IWebhookDelivery, {}, {}, {}, mongoose.Document<unknown, {}, IWebhookDelivery, {}, {}> & IWebhookDelivery & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
/**
 * Webhook service
 */
export declare class WebhookService {
    private redis;
    private jobQueue;
    constructor(redis: Redis, jobQueue: JobQueue);
    /**
     * Register webhook for merchant
     */
    register(merchantId: string, targetUrl: string, events: WebhookEventType[], options?: {
        headers?: Record<string, string>;
        maxRetries?: number;
    }): Promise<IWebhook>;
    /**
     * Deregister webhook
     */
    deregister(webhookId: string): Promise<void>;
    /**
     * Trigger webhook event
     */
    trigger(event: WebhookEventType, data: any, merchantId?: string): Promise<void>;
    /**
     * Deliver webhook (called by job processor)
     */
    deliver(webhookId: string, event: string, payload: any, attempt?: number): Promise<boolean>;
    /**
     * Get delivery history
     */
    getDeliveryHistory(webhookId: string, limit?: number): Promise<(mongoose.Document<unknown, {}, IWebhookDelivery, {}, {}> & IWebhookDelivery & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get webhook stats
     */
    getStats(webhookId: string): Promise<{
        total: number;
        delivered: number;
        failed: number;
        pending: number;
        successRate: string | number;
    }>;
    /**
     * Generate HMAC signature
     */
    private sign;
    /**
     * Verify webhook signature using constant-time comparison
     * Prevents timing attacks on signature verification
     */
    verifySignature(payload: string, signature: string, secret: string): boolean;
    /**
     * Generate random secret
     */
    private generateSecret;
    /**
     * Determine if webhook delivery should be retried
     */
    private shouldRetry;
    /**
     * Calculate next retry time
     */
    private getNextRetryTime;
    /**
     * Calculate retry delay in ms
     */
    private getRetryDelay;
}
/**
 * Setup webhook job processor
 */
export declare function setupWebhookProcessor(jobQueue: JobQueue, webhookService: WebhookService): void;
