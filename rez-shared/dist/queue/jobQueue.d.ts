/**
 * Job Queue Service
 *
 * Async job processing with Bull (Redis-based).
 * Supports retries, concurrency, scheduling.
 *
 * Usage:
 * ```typescript
 * const emailQueue = new JobQueue('send-email', redis);
 * await emailQueue.add({ to: 'user@example.com', subject: '...' });
 * emailQueue.process(async (job) => { ... });
 * ```
 */
import type { Job } from 'bullmq';
import type Redis from 'ioredis';
export interface JobQueueOptions {
    concurrency?: number;
    maxRetries?: number;
    retryBackoff?: 'exponential' | 'fixed';
    defaultDelay?: number;
    /**
     * Retention policy for completed jobs.
     * - 'short': 1 hour (default for non-critical jobs)
     * - 'medium': 24 hours (for audit trails)
     * - 'long': 7 days (for critical operations, allows replay)
     * - 'permanent': Never remove (for compliance/archival)
     */
    retentionPolicy?: 'short' | 'medium' | 'long' | 'permanent';
}
export interface AsyncJobData {
    type?: string;
    [key: string]: any;
}
/**
 * Generic job queue wrapper
 */
export declare class JobQueue<T extends AsyncJobData = AsyncJobData> {
    private options;
    private queue;
    private worker?;
    private queueEvents?;
    private readonly redisConnection;
    constructor(name: string, redis: Redis, options?: JobQueueOptions);
    /**
     * Get retention age in seconds based on policy
     */
    private getRetentionAge;
    /**
     * Add job to queue
     */
    add(data: T, options?: {
        priority?: number;
        delay?: number;
    }): Promise<Job<any, any, string>>;
    /**
     * Add job with unique key (deduplication)
     */
    addUnique(uniqueKey: string, data: T, options?: {
        priority?: number;
    }): Promise<Job<any, any, string>>;
    /**
     * Add job to be processed at specific time
     * Note: If scheduledTime is in the past, the job will be executed immediately
     */
    schedule(data: T, scheduledTime: Date, options?: {
        priority?: number;
    }): Promise<Job<any, any, string>>;
    /**
     * Set up job processor
     */
    process(handler: (job: Job<any, any, string>) => Promise<any>, concurrency?: number): void;
    /**
     * Get queue status
     */
    getStatus(): Promise<{
        queueSize: number;
    }>;
    /**
     * Pause queue
     */
    pause(): Promise<void>;
    /**
     * Resume queue
     */
    resume(): Promise<void>;
    /**
     * Clean completed jobs
     */
    clean(olderThan?: number): Promise<void>;
    /**
     * Drain queue (remove all jobs)
     */
    drain(): Promise<void>;
    /**
     * Close queue
     */
    close(): Promise<void>;
}
/**
 * Pre-configured job queues for common operations
 */
export declare class JobQueueService {
    private emailQueue;
    private smsQueue;
    private pushQueue;
    private webhookQueue;
    private orderQueue;
    constructor(redis: Redis);
    /**
     * Queue email to be sent
     * @param dedupTTL - Optional TTL in seconds for email deduplication key. If set, identical
     *   emails sent within this window will be deduplicated. Defaults to 24 hours (86400s).
     *   Set to 0 to disable deduplication entirely.
     */
    sendEmail(to: string, subject: string, body: string, options?: {
        dedupTTL?: number;
    } & any): Promise<void>;
    /**
     * Queue SMS to be sent
     */
    sendSms(phone: string, message: string, options?: any): Promise<void>;
    /**
     * Queue push notification
     */
    sendPush(userId: string, title: string, body: string, options?: any): Promise<void>;
    /**
     * Queue webhook call
     * Uses idempotent jobId (url + event) to prevent duplicate deliveries when the same
     * webhook is triggered multiple times in quick succession.
     */
    sendWebhook(url: string, event: string, payload: any, options?: any): Promise<void>;
    /**
     * Queue order processing
     */
    processOrder(orderId: string, data: any): Promise<void>;
    /**
     * Setup all processors
     */
    setupProcessors(handlers: {
        email?: (job: Job) => Promise<any>;
        sms?: (job: Job) => Promise<any>;
        push?: (job: Job) => Promise<any>;
        webhook?: (job: Job) => Promise<any>;
        order?: (job: Job) => Promise<any>;
    }): void;
    /**
     * Get all queue statuses
     */
    getAllStatus(): Promise<{
        email: {
            queueSize: number;
        };
        sms: {
            queueSize: number;
        };
        push: {
            queueSize: number;
        };
        webhook: {
            queueSize: number;
        };
        order: {
            queueSize: number;
        };
    }>;
    /**
     * Close all queues
     */
    closeAll(): Promise<void>;
}
