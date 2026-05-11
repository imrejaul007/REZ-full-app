/**
 * Gamification Worker — standalone BullMQ consumer for gamification-events queue.
 *
 * Phase C extraction. Processes gamification events: achievements, challenges,
 * streaks, leaderboard invalidation, mission progress, analytics.
 */
import { Worker } from 'bullmq';
export declare const QUEUE_NAME = "gamification-events";
export interface ActivityEvent {
    eventId: string;
    type: string;
    userId: string;
    data?: Record<string, any>;
    timestamp?: string;
}
export declare function startGamificationWorker(): Worker;
export declare function stopWorker(): Promise<void>;
//# sourceMappingURL=worker.d.ts.map