/**
 * Standardized error codes across all REZ services and apps.
 */
export declare const ERROR_CODES: {
    readonly AUTH_EXPIRED: "AUTH_EXPIRED";
    readonly AUTH_INVALID: "AUTH_INVALID";
    readonly AUTH_FORBIDDEN: "AUTH_FORBIDDEN";
    readonly AUTH_ACCOUNT_LOCKED: "AUTH_ACCOUNT_LOCKED";
    readonly AUTH_ACCOUNT_SUSPENDED: "AUTH_ACCOUNT_SUSPENDED";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly CONFLICT: "CONFLICT";
    readonly INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly WITHDRAWAL_LIMIT_EXCEEDED: "WITHDRAWAL_LIMIT_EXCEEDED";
    readonly TRANSACTION_FAILED: "TRANSACTION_FAILED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly TIMEOUT: "TIMEOUT";
    readonly MAINTENANCE: "MAINTENANCE";
    readonly CSRF_INVALID: "CSRF_INVALID";
};
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
/** Map error codes to default HTTP status codes */
export declare const ERROR_STATUS_MAP: Record<ErrorCode, number>;
