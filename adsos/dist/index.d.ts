/**
 * AdOS - Advertising Operating System
 * Intelligence layer for real-world advertising
 */
import { Listing, ListingMetrics, GuardrailConfig, ScoringWeights, OptimizationRequest, OptimizationResult, PerformancePrediction } from './types';
export type { Screen, DOOHCampaign, ScreenType, ScreenStatus, Creative, Playlist, DeliveryRequest, DeliveryResponse, RevenueModel } from './dooh/types';
/**
 * AdOS Orchestrator - Production Ready
 *
 * Main entry point for all AdOS operations.
 * Orchestrates: Guardrails → ROI → Scoring → Allocation
 */
export declare class AdOS {
    private roiEngine;
    private scoringEngine;
    private allocationEngine;
    private guardrailsEngine;
    constructor(scoringWeights?: Partial<ScoringWeights>, guardrails?: Partial<GuardrailConfig>);
    /**
     * Optimize campaign - Main entry point
     */
    optimize(request: OptimizationRequest): OptimizationResult;
    /**
     * Predict performance for a single listing
     */
    predictPerformance(listing: Listing, metrics: ListingMetrics | null, budget: number, durationDays: number): PerformancePrediction;
    /**
     * Identify risk factors for a listing
     */
    private identifyRisks;
    /**
     * Get campaign summary
     */
    getSummary(result: OptimizationResult): {
        total_listings: number;
        total_budget: number;
        expected_visits: number;
        expected_purchases: number;
        expected_roas: number;
        confidence: number;
        risk_level: 'low' | 'medium' | 'high';
        warnings_count: number;
    };
    /**
     * Generate human-readable recommendations
     */
    generateRecommendations(result: OptimizationResult): string[];
}
/**
 * Create AdOS instance
 */
export declare function createAdOS(scoringWeights?: Partial<ScoringWeights>, guardrails?: Partial<GuardrailConfig>): AdOS;
/**
 * Quick optimize
 */
export declare function optimizeCampaign(request: OptimizationRequest): OptimizationResult;
//# sourceMappingURL=index.d.ts.map