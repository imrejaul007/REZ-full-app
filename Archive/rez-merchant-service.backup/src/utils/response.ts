/**
 * Standardized error responses for rez-merchant-service.
 */

import type { Response } from 'express';

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorResponse(
  res: Response,
  statusCode: number | ApiError | { message: string; code?: string },
  message?: string,
  code?: string,
  details?: unknown
): void {
  let httpStatus: number;
  let errMessage: string;
  let errCode: string | undefined;
  let errDetails: unknown;

  if (statusCode instanceof ApiError) {
    httpStatus = statusCode.statusCode;
    errMessage = statusCode.message;
    errCode = statusCode.code;
    errDetails = statusCode.details;
  } else if (typeof statusCode === 'object') {
    httpStatus = 400;
    errMessage = statusCode.message;
    errCode = statusCode.code;
    errDetails = details;
  } else {
    httpStatus = statusCode;
    errMessage = message || 'An error occurred';
    errCode = code;
    errDetails = details;
  }

  res.status(httpStatus).json({ success: false, error: errMessage, code: errCode, details: errDetails });
}

export function successResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

// Error factory
export const errors = {
  internalError: () => ({ message: 'Internal server error', code: 'SRV_001' }),
  unauthorized: () => ({ message: 'Unauthorized', code: 'AUTH_004' }),
  notFound: () => ({ message: 'Not found', code: 'RES_001' }),
  badRequest: (msg?: string) => ({ message: msg || 'Bad request', code: 'VAL_001' }),
  serviceUnavailable: (msg?: string) => ({ message: msg || 'Service unavailable', code: 'SRV_003' }),
};

export function success(data: unknown) {
  return { success: true, data };
}

export function err(code: string, details?: unknown) {
  return { success: false, error: { code, message: getErrorMessage(code), details } };
}

function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    BIZ_001: 'Resource not found',
    BIZ_002: 'Resource already exists',
    BIZ_003: 'Conflict',
    BIZ_004: 'Access denied',
    SRV_001: 'Internal server error',
    RES_001: 'Resource not found',
  };
  return messages[code] || 'An error occurred';
}
