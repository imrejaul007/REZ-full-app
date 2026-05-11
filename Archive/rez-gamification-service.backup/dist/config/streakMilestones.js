"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STREAK_MILESTONE_MAP = exports.STREAK_MILESTONES = void 0;
/**
 * Canonical streak milestone definitions.
 * Import this file wherever streak milestone coins need to be awarded.
 * Values must match those in rez-karma-service/src/config/streakMilestones.ts
 */
exports.STREAK_MILESTONES = [
    { days: 3, coins: 50 },
    { days: 7, coins: 200 },
    { days: 30, coins: 500 },
];
exports.STREAK_MILESTONE_MAP = new Map(exports.STREAK_MILESTONES.map(m => [m.days, m.coins]));
//# sourceMappingURL=streakMilestones.js.map