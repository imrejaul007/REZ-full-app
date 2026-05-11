/**
 * Achievement Worker — listens on 'gamification-events' queue for visit_checked_in events.
 *
 * On each check-in it evaluates every achievement the user has not yet earned and awards
 * any whose condition is now satisfied.  Coins are credited via the same wallet/ledger
 * pattern used by the streak worker.  An achievement_unlocked notification is enqueued
 * to the notification-events queue.
 */
import { Worker } from 'bullmq';
export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    coins: number;
    /** Human-readable condition string stored for reference / display. */
    condition: string;
    /** Programmatic check function given user stats. */
    check: (stats: UserStats) => boolean;
}
interface UserStats {
    visit_count: number;
    streak: number;
    total_coins: number;
}
export declare const ACHIEVEMENTS: AchievementDef[];
export declare const ACHIEVEMENT_QUEUE = "achievement-events";
/**
 * Starts the BullMQ achievement worker on the 'achievement-events' queue.
 * Processes visit_checked_in events to evaluate and award streak/milestone achievements.
 * @returns The BullMQ worker instance (singleton)
 */
export declare function startAchievementWorker(): Worker;
export declare function stopAchievementWorker(): Promise<void>;
export {};
//# sourceMappingURL=achievementWorker.d.ts.map