/**
 * CORS Configuration for REZ Loyalty System
 *
 * Configures Cross-Origin Resource Sharing with appropriate security settings.
 */
export interface CORSConfig {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    preflightContinue: boolean;
}
/**
 * Get CORS configuration
 */
export declare function getCORSConfig(): CORSConfig;
/**
 * Create CORS middleware options
 */
export declare function createCORSOptions(): {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    preflightContinue: boolean;
};
/**
 * Validate origin for WebSocket connections
 */
export declare function validateWebSocketOrigin(origin: string | null): boolean;
/**
 * Get allowed origin for response header
 */
export declare function getAllowedOrigin(requestOrigin: string | undefined): string;
/**
 * Production CORS configuration (stricter)
 */
export declare function getProductionCORSConfig(): CORSConfig;
/**
 * Development CORS configuration (permissive)
 */
export declare function getDevelopmentCORSConfig(): CORSConfig;
/**
 * Get environment-specific CORS config
 */
export declare function getEnvironmentCORSConfig(): CORSConfig;
//# sourceMappingURL=corsConfig.d.ts.map