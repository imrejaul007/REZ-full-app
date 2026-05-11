export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;

  constructor(message: string, statusCode: number, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`Service '${service}' is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

export class RateLimitError extends AppError {
  public retryAfter: number;

  constructor(retryAfter: number = 60) {
    super('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(maxSize: string) {
    super(`Payload too large. Maximum size is ${maxSize}`, 413, 'PAYLOAD_TOO_LARGE');
    this.name = 'PayloadTooLargeError';
  }
}

// Error handler middleware helper
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  RateLimitError,
  PayloadTooLargeError,
  isOperationalError,
};
