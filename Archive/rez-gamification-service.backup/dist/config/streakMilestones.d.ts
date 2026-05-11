/**
 * Canonical streak milestone definitions.
 * Import this file wherever streak milestone coins need to be awarded.
 * Values must match those in rez-karma-service/src/config/streakMilestones.ts
 */
export declare const STREAK_MILESTONES: readonly [{
    readonly days: 3;
    readonly coins: 50;
}, {
    readonly days: 7;
    readonly coins: 200;
}, {
    readonly days: 30;
    readonly coins: 500;
}];
export declare const STREAK_MILESTONE_MAP: ReadonlyMap<number, number>;
//# sourceMappingURL=streakMilestones.d.ts.map