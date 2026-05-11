/**
 * AdOS - Intelligence Layer for Real-World Advertising
 * Types and Interfaces
 */
/**
 * Pricing configuration for listings/campaigns
 */
export interface PricingConfig {
    type: 'owner' | 'platform' | 'hybrid';
    base_price?: number;
    commission_rate?: number;
    coin_budget?: number;
    cost_per_scan?: number;
    cost_per_visit?: number;
    revenue_split?: {
        vendor: number;
        platform: number;
    };
}
/**
 * Raw metrics from attribution system
 */
export interface ListingMetrics {
    scans: number;
    visits: number;
    purchases: number;
    revenue: number;
    scan_to_visit_rate: number;
    visit_to_purchase_rate: number;
    avg_order_value: number;
    last_updated: Date;
    data_points: number;
}
/**
 * Category averages for fallback estimation
 */
export interface CategoryAverages {
    category: string;
    avg_scan_to_visit_rate: number;
    avg_visit_to_purchase_rate: number;
    avg_order_value: number;
    avg_cost_per_visit: number;
    sample_size: number;
}
/**
 * Listing or Campaign base type
 */
export interface Listing {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    location?: {
        city: string;
        area: string;
        lat?: number;
        lng?: number;
    };
    pricing: PricingConfig;
    volume_potential: number;
    category_match: number;
    vendor_id: string;
    status: 'active' | 'paused' | 'ended';
    created_at: Date;
    updated_at: Date;
}
/**
 * ROI calculation result with confidence
 */
export interface ROIResult {
    roas: number;
    cpp: number;
    cpv: number;
    confidence: number;
    data_points: number;
    used_fallback: boolean;
    fallback_source?: string;
    estimate: {
        roas: {
            min: number;
            max: number;
        };
        visits: {
            min: number;
            max: number;
        };
        purchases: {
            min: number;
            max: number;
        };
    };
    breakdown: {
        scans: number;
        expected_visits: number;
        expected_purchases: number;
        expected_revenue: number;
        total_cost: number;
    };
}
/**
 * Scoring weights configuration
 */
export interface ScoringWeights {
    roas: number;
    confidence: number;
    volume: number;
    category_match: number;
}
/**
 * Scored listing with all metadata
 */
export interface ScoredListing {
    listing: Listing;
    metrics: ListingMetrics | null;
    roi: ROIResult;
    score: number;
    rank: number;
    weights: ScoringWeights;
}
/**
 * Budget allocation for a single listing
 */
export interface BudgetAllocation {
    listing_id: string;
    listing_name: string;
    allocated_budget: number;
    percentage_of_total: number;
    expected_visits: number;
    expected_purchases: number;
    expected_roas: number;
    confidence: number;
    warnings: AllocationWarning[];
}
/**
 * Allocation warning type
 */
export interface AllocationWarning {
    type: 'low_confidence' | 'low_roi' | 'high_cpv' | 'budget_low' | 'new_listing';
    message: string;
    severity: 'info' | 'warning' | 'critical';
}
/**
 * Complete allocation recommendation
 */
export interface AllocationRecommendation {
    total_budget: number;
    listings: ScoredListing[];
    allocations: BudgetAllocation[];
    totals: {
        allocated: number;
        expected_visits: number;
        expected_purchases: number;
        expected_roas: number;
        weighted_confidence: number;
    };
    unallocated: number;
    unallocated_percentage: number;
}
/**
 * Guardrail configuration
 */
export interface GuardrailConfig {
    min_budget_per_listing: number;
    min_total_budget: number;
    max_budget_per_listing: number;
    max_cost_per_visit: number;
    max_cost_per_purchase: number;
    min_roas_threshold: number;
    min_confidence_threshold: number;
    min_data_points: number;
    max_scan_rate_per_hour: number;
    max_visit_rate_per_scan: number;
    max_listings_per_campaign: number;
    max_campaign_duration_days: number;
}
/**
 * Guardrail enforcement result
 */
export interface GuardrailResult {
    passed: boolean;
    modifications: GuardrailModification[];
    excluded_listings: ExcludedListing[];
    warnings: string[];
}
export interface GuardrailModification {
    listing_id: string;
    field: string;
    original_value: any;
    new_value: any;
    reason: string;
}
export interface ExcludedListing {
    listing_id: string;
    reason: string;
    severity: 'warning' | 'critical';
}
/**
 * Campaign optimization request
 */
export interface OptimizationRequest {
    listings?: Listing[];
    budget: number;
    duration_days?: number;
    category_filter?: string[];
    location_filter?: {
        city?: string;
        area?: string;
        radius_km?: number;
    };
    guardrails?: Partial<GuardrailConfig>;
    weights?: Partial<ScoringWeights>;
    include_low_confidence?: boolean;
    max_listings?: number;
}
/**
 * Campaign optimization result
 */
export interface OptimizationResult {
    success: boolean;
    error?: string;
    recommendation: AllocationRecommendation;
    guardrails: GuardrailResult;
    generated_at: Date;
    processing_time_ms: number;
    data_freshness: {
        oldest_metric: Date;
        newest_metric: Date;
    };
}
/**
 * Performance prediction for a single listing
 */
export interface PerformancePrediction {
    listing_id: string;
    scenario: {
        budget: number;
        duration_days: number;
    };
    predicted: {
        scans: number;
        visits: number;
        purchases: number;
        revenue: number;
        roas: number;
    };
    confidence: number;
    risks: {
        type: 'low_volume' | 'low_conversion' | 'high_cost' | 'new_listing';
        description: string;
    }[];
}
/**
 * Default category averages (India market)
 * These should be fetched from DB in production
 */
export declare const DEFAULT_CATEGORY_AVERAGES: CategoryAverages[];
/**
 * Default scoring weights
 */
export declare const DEFAULT_SCORING_WEIGHTS: ScoringWeights;
/**
 * Default guardrail configuration
 */
export declare const DEFAULT_GUARDRAILS: GuardrailConfig;
//# sourceMappingURL=types.d.ts.map