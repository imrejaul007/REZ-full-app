/**
 * Standardized error responses for rez-order-service.
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
  const errorObj: { code: string; message: string; details?: unknown } = {
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
    SRV_001: 'Internal server error',
    BIZ_001: 'Resource not found',
    BIZ_003: 'Invalid status transition',
    BIZ_004: 'Not eligible for this operation',
    PAY_001: 'Payment failed',
  };
  return messages[code] || 'An error occurred';
}
