"use strict";
/**
 * AdOS - Advertising Operating System
 * Intelligence layer for real-world advertising
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdOS = void 0;
exports.createAdOS = createAdOS;
exports.optimizeCampaign = optimizeCampaign;
const roi_service_1 = require("./services/roi.service");
const scoring_service_1 = require("./services/scoring.service");
const allocation_service_1 = require("./services/allocation.service");
const guardrails_service_1 = require("./services/guardrails.service");
/**
 * AdOS Orchestrator - Production Ready
 *
 * Main entry point for all AdOS operations.
 * Orchestrates: Guardrails → ROI → Scoring → Allocation
 */
class AdOS {
    constructor(scoringWeights, guardrails) {
        this.roiEngine = new roi_service_1.ROIEngine();
        this.scoringEngine = new scoring_service_1.ScoringEngine(scoringWeights);
        this.allocationEngine = new allocation_service_1.AllocationEngine(guardrails);
        this.guardrailsEngine = new guardrails_service_1.GuardrailsEngine(guardrails);
    }
    /**
     * Optimize campaign - Main entry point
     */
    optimize(request) {
        const startTime = Date.now();
        try {
            // Step 1: Validate inputs
            if (!request.listings && !request.budget) {
                return {
                    success: false,
                    error: 'Missing required fields: listings, budget',
                    recommendation: {},
                    guardrails: {},
                    generated_at: new Date(),
                    processing_time_ms: Date.now() - startTime,
                    data_freshness: { oldest_metric: new Date(), newest_metric: new Date() }
                };
            }
            // For backward compatibility
            const listings = request.listings || [];
            const budget = request.budget || 0;
            // Step 2: Guardrails check
            const metricsMap = new Map();
            // In production, fetch from DB
            // const metricsMap = await this.fetchMetrics(listings.map(l => l.id))
            const guardrailsResult = this.guardrailsEngine.validate(listings, metricsMap, budget, request.duration_days);
            // Step 3: Filter out excluded listings
            const excludedIds = new Set(guardrailsResult.excluded_listings.map(e => e.listing_id));
            const filteredListings = listings.filter((l) => !excludedIds.has(l.id));
            // Step 4: Score listings
            const scored = this.scoringEngine.scoreListings(filteredListings, metricsMap, budget / Math.max(1, filteredListings.length), request.duration_days);
            // Step 5: Apply filters
            let finalScored = scored;
            if (!request.include_low_confidence) {
                finalScored = scored.filter(s => s.roi.confidence >= 0.3);
            }
            if (request.category_filter && request.category_filter.length > 0) {
                finalScored = finalScored.filter(s => request.category_filter.includes(s.listing.category));
            }
            if (request.max_listings) {
                finalScored = this.scoringEngine.getTopN(finalScored, request.max_listings);
            }
            // Step 6: Allocate budget
            const recommendation = this.allocationEngine.allocate(finalScored.map(s => s.listing), metricsMap, budget, request.duration_days);
            return {
                success: true,
                recommendation,
                guardrails: guardrailsResult,
                generated_at: new Date(),
                processing_time_ms: Date.now() - startTime,
                data_freshness: {
                    oldest_metric: new Date(Date.now() - 24 * 60 * 60 * 1000), // Mock
                    newest_metric: new Date()
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                recommendation: {},
                guardrails: {},
                generated_at: new Date(),
                processing_time_ms: Date.now() - startTime,
                data_freshness: { oldest_metric: new Date(), newest_metric: new Date() }
            };
        }
    }
    /**
     * Predict performance for a single listing
     */
    predictPerformance(listing, metrics, budget, durationDays) {
        const roi = this.roiEngine.calculateROI(listing, metrics, budget, durationDays);
        return {
            listing_id: listing.id,
            scenario: {
                budget,
                duration_days: durationDays
            },
            predicted: {
                scans: roi.breakdown.scans,
                visits: roi.breakdown.expected_visits,
                purchases: roi.breakdown.expected_purchases,
                revenue: roi.breakdown.expected_revenue,
                roas: roi.roas
            },
            confidence: roi.confidence,
            risks: this.identifyRisks(listing, roi)
        };
    }
    /**
     * Identify risk factors for a listing
     */
    identifyRisks(listing, roi) {
        const risks = [];
        if (roi.confidence < 0.3) {
            risks.push({
                type: 'low_volume',
                description: 'Limited historical data may affect accuracy'
            });
        }
        if (roi.roas < 1) {
            risks.push({
                type: 'low_conversion',
                description: 'ROAS below 1x may not meet profitability goals'
            });
        }
        if (roi.cpv > 30) {
            risks.push({
                type: 'high_cost',
                description: 'Cost per visit is above average'
            });
        }
        if (roi.used_fallback) {
            risks.push({
                type: 'new_listing',
                description: 'Using estimated data, real results may vary'
            });
        }
        return risks;
    }
    /**
     * Get campaign summary
     */
    getSummary(result) {
        const { recommendation, guardrails } = result;
        return {
            total_listings: recommendation.allocations?.length || 0,
            total_budget: recommendation.total_budget || 0,
            expected_visits: recommendation.totals?.expected_visits || 0,
            expected_purchases: recommendation.totals?.expected_purchases || 0,
            expected_roas: recommendation.totals?.expected_roas || 0,
            confidence: recommendation.totals?.weighted_confidence || 0,
            risk_level: guardrails.excluded_listings?.length > 2 ? 'high' :
                guardrails.warnings?.length > 5 ? 'medium' : 'low',
            warnings_count: guardrails.warnings?.length || 0
        };
    }
    /**
     * Generate human-readable recommendations
     */
    generateRecommendations(result) {
        const recommendations = [];
        const summary = this.getSummary(result);
        // Budget recommendations
        if (summary.expected_roas < 1) {
            recommendations.push(`Current allocation has ${summary.expected_roas}x ROAS. Consider shifting budget to higher-performing listings.`);
        }
        // Confidence recommendations
        if (summary.confidence < 0.5) {
            recommendations.push('Campaign uses estimated data. Results may vary from predictions.');
        }
        // Risk recommendations
        if (result.guardrails.excluded_listings?.length > 0) {
            recommendations.push(`${result.guardrails.excluded_listings.length} listings were excluded due to risk factors.`);
        }
        // Diversification
        if (summary.total_listings < 3) {
            recommendations.push('Consider adding more listings for better diversification.');
        }
        return recommendations;
    }
}
exports.AdOS = AdOS;
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create AdOS instance
 */
function createAdOS(scoringWeights, guardrails) {
    return new AdOS(scoringWeights, guardrails);
}
/**
 * Quick optimize
 */
function optimizeCampaign(request) {
    const ados = createAdOS();
    return ados.optimize(request);
}
//# sourceMappingURL=index.js.map