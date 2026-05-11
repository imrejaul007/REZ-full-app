/**
 * Store Visit Streak Worker — listens on 'store-visit-events' queue.
 * Applies correct day-diff streak logic and awards milestone coins.
 */
import { Worker } from 'bullmq';
export interface StoreVisitEvent {
    eventId: string;
    userId: string;
    merchantId: string;
    storeId: string;
    timestamp?: string;
}
/**
 * processStoreVisitInternal — exported so httpServer POST /internal/visit
 * can call the same streak logic without going through BullMQ.
 */
export declare function processStoreVisitInternal(event: StoreVisitEvent): Promise<void>;
export declare const STORE_VISIT_QUEUE = "store-visit-events";
/**
 * Starts the BullMQ store visit streak worker on the 'store-visit-events' queue.
 * Handles daily streak tracking, streak resets, and bonus coin awards at milestones.
 * @returns The BullMQ worker instance (singleton)
 */
export declare function startStoreVisitStreakWorker(): Worker;
export declare function stopStoreVisitStreakWorker(): Promise<void>;
//# sourceMappingURL=storeVisitStreakWorker.d.ts.map