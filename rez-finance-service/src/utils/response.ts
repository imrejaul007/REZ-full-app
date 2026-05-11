// Standardized API response utilities
// Temporary local copy until shared package is updated

export const ErrorCodes = {
  SRV_INTERNAL_ERROR: { code: 'SRV_001', message: 'Internal server error' },
  RES_NOT_FOUND: { code: 'RES_001', message: 'Resource not found' },
  // Add more as needed
} as const;

export function err(code: string, details?: unknown) {
  const error: { code: string; message: string; details?: unknown } = {
    code,
    message: ErrorCodes[code as keyof typeof ErrorCodes]?.message || 'An error occurred',
  };
  if (details) {
    error.details = details;
  }
  return { success: false, error };
}
