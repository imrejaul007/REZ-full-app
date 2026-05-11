"use strict";
/**
 * AdOS - Intelligence Layer for Real-World Advertising
 * Types and Interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GUARDRAILS = exports.DEFAULT_SCORING_WEIGHTS = exports.DEFAULT_CATEGORY_AVERAGES = void 0;
// ============================================================================
// CATEGORY DATA
// ============================================================================
/**
 * Default category averages (India market)
 * These should be fetched from DB in production
 */
exports.DEFAULT_CATEGORY_AVERAGES = [
    {
        category: 'restaurant',
        avg_scan_to_visit_rate: 0.35,
        avg_visit_to_purchase_rate: 0.45,
        avg_order_value: 350,
        avg_cost_per_visit: 15,
        sample_size: 0
    },
    {
        category: 'retail',
        avg_scan_to_visit_rate: 0.30,
        avg_visit_to_purchase_rate: 0.40,
        avg_order_value: 800,
        avg_cost_per_visit: 20,
        sample_size: 0
    },
    {
        category: 'gym',
        avg_scan_to_visit_rate: 0.25,
        avg_visit_to_purchase_rate: 0.15,
        avg_order_value: 2000,
        avg_cost_per_visit: 25,
        sample_size: 0
    },
    {
        category: 'auto',
        avg_scan_to_visit_rate: 0.40,
        avg_visit_to_purchase_rate: 0.10,
        avg_order_value: 500,
        avg_cost_per_visit: 8,
        sample_size: 0
    },
    {
        category: 'billboard',
        avg_scan_to_visit_rate: 0.20,
        avg_visit_to_purchase_rate: 0.05,
        avg_order_value: 1000,
        avg_cost_per_visit: 30,
        sample_size: 0
    },
    {
        category: 'influencer',
        avg_scan_to_visit_rate: 0.50,
        avg_visit_to_purchase_rate: 0.08,
        avg_order_value: 600,
        avg_cost_per_visit: 45,
        sample_size: 0
    },
    {
        category: 'event',
        avg_scan_to_visit_rate: 0.60,
        avg_visit_to_purchase_rate: 0.30,
        avg_order_value: 500,
        avg_cost_per_visit: 10,
        sample_size: 0
    },
    {
        category: 'other',
        avg_scan_to_visit_rate: 0.25,
        avg_visit_to_purchase_rate: 0.20,
        avg_order_value: 400,
        avg_cost_per_visit: 20,
        sample_size: 0
    }
];
/**
 * Default scoring weights
 */
exports.DEFAULT_SCORING_WEIGHTS = {
    roas: 0.5,
    confidence: 0.2,
    volume: 0.2,
    category_match: 0.1
};
/**
 * Default guardrail configuration
 */
exports.DEFAULT_GUARDRAILS = {
    min_budget_per_listing: 500,
    min_total_budget: 1000,
    max_budget_per_listing: 100000,
    max_cost_per_visit: 50,
    max_cost_per_purchase: 200,
    min_roas_threshold: 0.5,
    min_confidence_threshold: 0.2,
    min_data_points: 10,
    max_scan_rate_per_hour: 100,
    max_visit_rate_per_scan: 5,
    max_listings_per_campaign: 50,
    max_campaign_duration_days: 90
};
//# sourceMappingURL=types.js.map