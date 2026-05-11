/**
 * Standardized API error handling for all REZ services.
 *
 * Standard Response Format:
 * - Success: { "success": true, "data": {...} }
 * - Error: { "success": false, "error": { "code": "AUTH_001", "message": "...", "details": {...} } }
 *
 * Error Code Prefixes:
 * - AUTH_: Authentication errors
 * - VAL_: Validation errors
 * - BIZ_: Business logic errors
 * - FIN_: Financial errors
 * - PAY_: Payment errors
 * - SRV_: Server errors
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export declare class AppError extends Error {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
    constructor(code: string, message: string, statusCode?: number, details?: unknown);
    toJSON(): ErrorResponse['error'];
}
/**
 * Standard error response helper for Express responses.
 */
export declare function errorResponse(res: import('express').Response, error: AppError | Error): import('express').Response;
/**
 * Create a standardized success response.
 */
export declare function successResponse<T>(res: import('express').Response, data: T, statusCode?: number): import('express').Response;
export declare const ERROR_CODES: {
    readonly AUTH_TOKEN_MISSING: "AUTH_001";
    readonly AUTH_TOKEN_INVALID: "AUTH_002";
    readonly AUTH_TOKEN_EXPIRED: "AUTH_003";
    readonly AUTH_ACCOUNT_LOCKED: "AUTH_004";
    readonly AUTH_ACCOUNT_SUSPENDED: "AUTH_005";
    readonly AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_006";
    readonly AUTH_SERVICE_UNAVAILABLE: "AUTH_007";
    readonly VAL_INVALID_INPUT: "VAL_001";
    readonly VAL_MISSING_FIELD: "VAL_002";
    readonly VAL_VALIDATION_FAILED: "VAL_003";
    readonly BIZ_NOT_FOUND: "BIZ_001";
    readonly BIZ_ALREADY_EXISTS: "BIZ_002";
    readonly BIZ_CONFLICT: "BIZ_003";
    readonly BIZ_FORBIDDEN: "BIZ_004";
    readonly FIN_INSUFFICIENT_BALANCE: "FIN_001";
    readonly FIN_TRANSACTION_FAILED: "FIN_002";
    readonly FIN_WITHDRAWAL_LIMIT_EXCEEDED: "FIN_003";
    readonly PAY_FAILED: "PAY_001";
    readonly PAY_SIGNATURE_INVALID: "PAY_002";
    readonly PAY_AMOUNT_MISMATCH: "PAY_003";
    readonly PAY_WALLET_TOPUP_LIMIT: "PAY_004";
    readonly PAY_BNPL_NOT_ELIGIBLE: "PAY_005";
    readonly PAY_REFUND_FAILED: "PAY_006";
    readonly SRV_INTERNAL_ERROR: "SRV_001";
    readonly SRV_TIMEOUT: "SRV_002";
    readonly SRV_SERVICE_UNAVAILABLE: "SRV_003";
    readonly SRV_MAINTENANCE: "SRV_004";
    readonly SRV_RATE_LIMITED: "SRV_005";
    readonly RLT_TOO_MANY_REQUESTS: "RLT_001";
    readonly RLT_IP_NOT_ALLOWED: "RLT_002";
};
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
/** Map error codes to default HTTP status codes */
export declare const ERROR_STATUS_MAP: Record<string, number>;
export declare const errors: {
    authTokenMissing: (details?: unknown) => AppError;
    authTokenInvalid: (details?: unknown) => AppError;
    authTokenExpired: (details?: unknown) => AppError;
    authAccountLocked: (details?: unknown) => AppError;
    authAccountSuspended: (details?: unknown) => AppError;
    authInsufficientPermissions: (details?: unknown) => AppError;
    authServiceUnavailable: (details?: unknown) => AppError;
    invalidInput: (message: string, details?: unknown) => AppError;
    missingField: (field: string, details?: unknown) => AppError;
    validationFailed: (message: string, details?: unknown) => AppError;
    notFound: (resource: string, details?: unknown) => AppError;
    alreadyExists: (resource: string, details?: unknown) => AppError;
    conflict: (message: string, details?: unknown) => AppError;
    forbidden: (message: string, details?: unknown) => AppError;
    insufficientBalance: (details?: unknown) => AppError;
    transactionFailed: (message: string, details?: unknown) => AppError;
    withdrawalLimitExceeded: (details?: unknown) => AppError;
    paymentFailed: (message: string, details?: unknown) => AppError;
    paymentSignatureInvalid: (details?: unknown) => AppError;
    paymentAmountMismatch: (expected: number, actual: number) => AppError;
    walletTopupLimit: (max: number) => AppError;
    bnplNotEligible: (reason?: string, details?: unknown) => AppError;
    refundFailed: (message: string, details?: unknown) => AppError;
    internalError: (details?: unknown) => AppError;
    timeout: (details?: unknown) => AppError;
    serviceUnavailable: (service?: string, details?: unknown) => AppError;
    maintenance: (details?: unknown) => AppError;
    rateLimited: (retryAfter?: number) => AppError;
    tooManyRequests: (message?: string) => AppError;
    ipNotAllowed: (details?: unknown) => AppError;
};
declare const _default: {
    AppError: typeof AppError;
    errorResponse: typeof errorResponse;
    successResponse: typeof successResponse;
    ERROR_CODES: {
        readonly AUTH_TOKEN_MISSING: "AUTH_001";
        readonly AUTH_TOKEN_INVALID: "AUTH_002";
        readonly AUTH_TOKEN_EXPIRED: "AUTH_003";
        readonly AUTH_ACCOUNT_LOCKED: "AUTH_004";
        readonly AUTH_ACCOUNT_SUSPENDED: "AUTH_005";
        readonly AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_006";
        readonly AUTH_SERVICE_UNAVAILABLE: "AUTH_007";
        readonly VAL_INVALID_INPUT: "VAL_001";
        readonly VAL_MISSING_FIELD: "VAL_002";
        readonly VAL_VALIDATION_FAILED: "VAL_003";
        readonly BIZ_NOT_FOUND: "BIZ_001";
        readonly BIZ_ALREADY_EXISTS: "BIZ_002";
        readonly BIZ_CONFLICT: "BIZ_003";
        readonly BIZ_FORBIDDEN: "BIZ_004";
        readonly FIN_INSUFFICIENT_BALANCE: "FIN_001";
        readonly FIN_TRANSACTION_FAILED: "FIN_002";
        readonly FIN_WITHDRAWAL_LIMIT_EXCEEDED: "FIN_003";
        readonly PAY_FAILED: "PAY_001";
        readonly PAY_SIGNATURE_INVALID: "PAY_002";
        readonly PAY_AMOUNT_MISMATCH: "PAY_003";
        readonly PAY_WALLET_TOPUP_LIMIT: "PAY_004";
        readonly PAY_BNPL_NOT_ELIGIBLE: "PAY_005";
        readonly PAY_REFUND_FAILED: "PAY_006";
        readonly SRV_INTERNAL_ERROR: "SRV_001";
        readonly SRV_TIMEOUT: "SRV_002";
        readonly SRV_SERVICE_UNAVAILABLE: "SRV_003";
        readonly SRV_MAINTENANCE: "SRV_004";
        readonly SRV_RATE_LIMITED: "SRV_005";
        readonly RLT_TOO_MANY_REQUESTS: "RLT_001";
        readonly RLT_IP_NOT_ALLOWED: "RLT_002";
    };
    ERROR_STATUS_MAP: Record<string, number>;
    errors: {
        authTokenMissing: (details?: unknown) => AppError;
        authTokenInvalid: (details?: unknown) => AppError;
        authTokenExpired: (details?: unknown) => AppError;
        authAccountLocked: (details?: unknown) => AppError;
        authAccountSuspended: (details?: unknown) => AppError;
        authInsufficientPermissions: (details?: unknown) => AppError;
        authServiceUnavailable: (details?: unknown) => AppError;
        invalidInput: (message: string, details?: unknown) => AppError;
        missingField: (field: string, details?: unknown) => AppError;
        validationFailed: (message: string, details?: unknown) => AppError;
        notFound: (resource: string, details?: unknown) => AppError;
        alreadyExists: (resource: string, details?: unknown) => AppError;
        conflict: (message: string, details?: unknown) => AppError;
        forbidden: (message: string, details?: unknown) => AppError;
        insufficientBalance: (details?: unknown) => AppError;
        transactionFailed: (message: string, details?: unknown) => AppError;
        withdrawalLimitExceeded: (details?: unknown) => AppError;
        paymentFailed: (message: string, details?: unknown) => AppError;
        paymentSignatureInvalid: (details?: unknown) => AppError;
        paymentAmountMismatch: (expected: number, actual: number) => AppError;
        walletTopupLimit: (max: number) => AppError;
        bnplNotEligible: (reason?: string, details?: unknown) => AppError;
        refundFailed: (message: string, details?: unknown) => AppError;
        internalError: (details?: unknown) => AppError;
        timeout: (details?: unknown) => AppError;
        serviceUnavailable: (service?: string, details?: unknown) => AppError;
        maintenance: (details?: unknown) => AppError;
        rateLimited: (retryAfter?: number) => AppError;
        tooManyRequests: (message?: string) => AppError;
        ipNotAllowed: (details?: unknown) => AppError;
    };
};
export default _default;
