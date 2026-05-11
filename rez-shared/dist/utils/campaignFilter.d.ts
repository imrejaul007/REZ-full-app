/**
 * Campaign Filter Translation Utility
 *
 * FL-13 fix: Consumer code sends `campaignType` (camelCase) with values like
 * 'LUCKY_DRAW' (SCREAMING_CASE) but the backend expects `type` (snake_case) with
 * values like 'lucky_draw' (lowercase).
 *
 * This utility provides bidirectional translation between consumer filter format
 * and the backend query format so that filtering always works regardless of which
 * layer sends the request.
 *
 * Consumer API call (before fix — BROKEN):
 *   GET /api/campaigns/active?campaignType=LUCKY_DRAW
 *
 * Consumer API call (after fix — WORKS):
 *   GET /api/campaigns/active?type=lucky_draw
 *   // OR use campaignFilterToBackend() to transform the full params object:
 *   const params = campaignFilterToBackend({ campaignType: 'LUCKY_DRAW' });
 *   // params = { type: 'lucky_draw' }
 */
export declare const CAMPAIGN_TYPE_VALUES: readonly ["cashback_boost", "bank_offer", "bill_upload_bonus", "category_multiplier", "first_transaction_bonus", "festival_offer", "new-user", "flash_sale", "lucky_draw", "referral_bonus", "tier_upgrade"];
export type CampaignTypeCanonical = (typeof CAMPAIGN_TYPE_VALUES)[number];
export declare const CAMPAIGN_TYPE_LABELS: Record<CampaignTypeCanonical | string, string>;
interface CampaignFilterInput {
    campaignType?: string;
    type?: string;
    status?: string;
    isActive?: boolean;
    limit?: number;
    page?: number;
    region?: string;
}
/**
 * Translate a consumer-side campaign filter object to the format expected by
 * the backend /api/campaigns/active endpoint.
 *
 * Handles:
 *   - Key renaming: campaignType → type
 *   - Case normalization: 'LUCKY_DRAW' → 'lucky_draw'
 *   - Only passes recognized keys to the backend
 *
 * @param input - Consumer filter params (may contain campaignType, camelCase values)
 * @returns Backend-compatible query params
 */
export declare function campaignFilterToBackend(input: CampaignFilterInput): Record<string, string | number | boolean>;
/**
 * Translate a backend campaign response item to consumer-friendly format.
 * Normalizes enum values to canonical snake_case.
 *
 * @param campaign - Raw campaign object from backend
 * @returns Consumer-normalized campaign object
 */
export declare function campaignFromBackend<T extends Record<string, unknown>>(campaign: T): T;
/**
 * Build a backend query URLSearchParams from consumer filter input.
 *
 * @example
 *   const params = buildCampaignQuery({ campaignType: 'LUCKY_DRAW', limit: 10 });
 *   // params.toString() === 'type=lucky_draw&limit=10'
 */
export declare function buildCampaignQuery(input: CampaignFilterInput): URLSearchParams;
/**
 * Validate that a campaign type value is in the canonical set.
 * Returns the canonical value or null if invalid.
 */
export declare function validateCampaignType(raw: string | undefined): CampaignTypeCanonical | null;
export {};
