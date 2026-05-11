/**
 * Loop Reliability Score Calculator
 *
 * Calculates the reliability score for the first loop based on
 * success metrics across all components.
 */
interface LoopMetrics {
    eventsReceived: number;
    eventsProcessed: number;
    eventsFailed: number;
    duplicatesSuppressed: number;
    actionsTriggered: number;
    actionsCompleted: number;
    actionsFailed: number;
    actionsPending: number;
    feedbackCaptured: number;
    feedbackIgnored: number;
    feedbackFailed: number;
    learningUpdates: number;
}
interface ReliabilityScore {
    overall: number;
    components: {
        eventDelivery: number;
        idempotency: number;
        actionSuccess: number;
        feedbackCapture: number;
        learningLoop: number;
    };
    status: 'excellent' | 'good' | 'warning' | 'critical';
    recommendations: string[];
}
/**
 * Calculate component scores
 */
declare function calculateComponentScores(metrics: LoopMetrics): ReliabilityScore['components'];
/**
 * Calculate weighted overall reliability score
 */
declare function calculateReliabilityScore(metrics: LoopMetrics): ReliabilityScore;
/**
 * Check if loop is production-ready
 */
declare function isProductionReady(score: ReliabilityScore): {
    ready: boolean;
    blockers: string[];
};
/**
 * Format score for display
 */
declare function formatScore(score: ReliabilityScore): string;
export { calculateReliabilityScore, calculateComponentScores, isProductionReady, formatScore, type LoopMetrics, type ReliabilityScore, };
//# sourceMappingURL=reliability-score.d.ts.map