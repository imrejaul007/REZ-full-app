/**
 * Standardized error responses for rez-payment-service.
 * Re-exports from rez-shared for consistency across all services.
 */
export { errors, errorResponse, successResponse, AppError, ERROR_CODES, ERROR_STATUS_MAP } from '@rez/shared/utils/errors';
export { ERROR_CODES as ErrorCodes } from '@rez/shared/utils/errors';

// Standardized success response
export function success(data: unknown) {
  return { success: true, data };
}

// Standardized error response - maintains backward compatibility
export function err(code: string, details?: unknown) {
  const errorObj: Record<string, unknown> = {
    code,
    message: getErrorMessage(code),
  };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return { success: false, error: errorObj };
}

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    PAY_001: 'Payment failed',
    PAY_002: 'Refund not allowed',
    PAY_003: 'Payment gateway error',
    SRV_001: 'Internal server error',
    BIZ_001: 'Resource not found',
  };
  return messages[code] || 'An error occurred';
}
