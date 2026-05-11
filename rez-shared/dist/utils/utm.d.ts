/**
 * UTM Parameter Tracking Utility
 *
 * Captures and stores UTM parameters from URLs for attribution tracking.
 * UTM parameters capture marketing campaign source, medium, and campaign name.
 */
export interface UTMParams {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
}
export interface UTMSessionData extends UTMParams {
    storedAt: string;
    landingPage: string;
}
/**
 * Extract UTM parameters from current URL search params
 * Works in browser environment (window.location)
 */
export declare function getUTMParams(): UTMParams;
/**
 * Check if current URL has any UTM parameters
 */
export declare function hasUTMParams(): boolean;
/**
 * Store UTM parameters in sessionStorage for later use
 * Call this on landing page to capture attribution data
 */
export declare function storeUTMParams(): UTMSessionData | null;
/**
 * Retrieve stored UTM parameters from sessionStorage
 * Returns null if no UTM data was stored or session expired
 */
export declare function getStoredUTMParams(): UTMSessionData | null;
/**
 * Clear stored UTM parameters
 */
export declare function clearStoredUTMParams(): void;
/**
 * Get UTM params for API request/analytics
 * Returns stored params if available, otherwise extracts from current URL
 */
export declare function getUTMForTracking(): UTMParams;
/**
 * Parse UTM parameters from a full URL string (for server-side processing)
 */
export declare function parseUTMFromUrl(url: string): UTMParams;
/**
 * Build a URL with UTM parameters appended
 * Useful for generating shareable referral links
 */
export declare function buildUTMUrl(baseUrl: string, utm: Partial<UTMParams>): string;
