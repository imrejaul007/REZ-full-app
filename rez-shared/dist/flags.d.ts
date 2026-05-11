/**
 * Feature Flags Module
 *
 * Runtime feature flags for gradual rollouts and dark launches.
 * All flags default to false for safety (opt-in behavior).
 */
/**
 * Feature flag definitions
 * Each flag has a description and default value (always false for dark launches)
 */
declare const FEATURE_FLAGS: {
    /**
     * Dark launch: Schema validation for API responses using apiContracts.ts
     * When enabled, responses are validated against canonical schemas but
     * failures are logged (not thrown) to detect schema drift in production.
     */
    readonly SCHEMA_VALIDATION_ENABLED: {
        readonly description: "Dark-launch schema validation for API responses";
        readonly default: false;
    };
};
export type FeatureFlag = keyof typeof FEATURE_FLAGS;
/**
 * Get feature flag status
 * Override via environment variable: REZ_FEATURE_FLAGS=SCHEMA_VALIDATION_ENABLED:true,OTHER_FLAG:false
 * Or pass explicit overrides map
 */
export declare function isFeatureEnabled(flag: FeatureFlag, overrides?: Record<FeatureFlag, boolean>): boolean;
/**
 * Set feature flag at runtime (e.g., for testing or admin overrides)
 * In production, prefer environment variables
 */
export declare function setFeatureFlag(flag: FeatureFlag, enabled: boolean): void;
/**
 * Get all feature flags status for debugging
 */
export declare function getAllFeatureFlags(): Record<FeatureFlag, {
    enabled: boolean;
    description: string;
}>;
export {};
