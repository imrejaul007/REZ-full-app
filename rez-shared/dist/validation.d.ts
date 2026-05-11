/**
 * Schema Validation Utility for API Responses
 *
 * Provides dark-launch schema validation with logging but no throwing.
 * Used to detect schema drift in production without breaking the app.
 */
import { z } from 'zod';
/**
 * Logger interface for redacting sensitive data
 * Expected to be provided by calling app
 */
interface ValidationLogger {
    warn: (message: string, context?: Record<string, any>) => void;
    error: (message: string, context?: Record<string, any>) => void;
}
/**
 * Set the global logger for validation failures
 * Must be called during app initialization
 */
export declare function setValidationLogger(logger: ValidationLogger): void;
/**
 * Validate API response against a Zod schema
 * Dark launch: logs failures but does NOT throw
 *
 * @param schema Zod schema to validate against
 * @param data Raw response data
 * @param endpoint Endpoint name for logging (e.g., "/user/auth/me")
 * @returns Original data (always), plus success flag for optional logging
 */
export declare function validateResponse<T>(schema: z.ZodTypeAny, data: unknown, endpoint: string): {
    data: T;
    valid: boolean;
    error?: string;
};
/**
 * Batch validate multiple responses
 * Useful for list endpoints
 */
export declare function validateResponseArray<T>(schema: z.ZodTypeAny, dataArray: unknown[], endpoint: string): {
    data: T[];
    validCount: number;
    invalidCount: number;
};
/**
 * Create a wrapper for endpoint functions to inject validation
 * Example:
 *   const validatedFetch = withValidation(schema, '/endpoint')(originalFetch);
 */
export declare function withValidation<T>(schema: z.ZodTypeAny, endpoint: string): (fn: () => Promise<{
    success: boolean;
    data?: T;
}>) => () => Promise<{
    success: boolean;
    data?: T;
}>;
export {};
