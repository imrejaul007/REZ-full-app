import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { logger, sanitizeLog, createServiceLogger } from '../config/logger';
import { AppError } from '../utils/AppError';

// Extend Express Request type with custom properties
declare global {
  namespace Express {
    interface Request {
      deviceRisk?: string;
      deviceHash?: string;
      correlationId?: string;
      userId?: string;
    }
  }
}

// Re-export AppError from its canonical location for backward compatibility
export { AppError } from '../utils/AppError';

const errorLogger = createServiceLogger('ErrorHandler');

// Standard error response shape
interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  requestId?: string;
  stack?: string;
}

// Format field names for user-friendly display
const formatFieldName = (field: string) =>
  field
    .split('.')
    .pop()
    ?.replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ') || field;

// D3: PII-safe Mongoose handlers.
//   Mongoose default error messages can contain the rejected VALUE and the
//   schema PATH — e.g. "Cast to ObjectId failed for value \"user@example.com\"
//   at path \"user\"". That leaks both user input and schema internals to
//   anyone who hits an API with bad data. Clients now get static messages;
//   server logs keep the full detail for debugging.

// Map Mongoose validator kinds to stable, non-leaky client messages.
// NEVER interpolate err.message, err.value, or the path into client output.
const kindToClientMessage = (kind?: string): string => {
  switch (kind) {
    case 'required':
      return 'This field is required';
    case 'enum':
      return 'Value is not allowed';
    case 'min':
    case 'max':
    case 'minlength':
    case 'maxlength':
      return 'Value out of allowed range';
    case 'regexp':
    case 'match':
      return 'Value format is invalid';
    case 'ObjectId':
    case 'Number':
    case 'Date':
    case 'Boolean':
      return 'Value has invalid type';
    default:
      return 'Value is invalid';
  }
};

// Handle Mongoose validation errors
const handleMongooseValidationError = (error: any): AppError => {
  // Full detail server-side only.
  const fullFieldErrors = Object.values(error.errors).map((err: any) => ({
    path: err.path,
    kind: err.kind,
    message: err.message,
    value: err.value, // may contain PII — logs only
  }));
  errorLogger.warn('Validation error', {
    errorCount: fullFieldErrors.length,
    fields: fullFieldErrors.map((e: any) => ({ path: e.path, kind: e.kind })),
  });

  // Client-safe view: formatted field name + static message (no values, no
  // raw mongoose strings). Preserves enough info to tell the user which form
  // field is wrong without exposing schema paths verbatim.
  const safeFieldErrors = fullFieldErrors.map((e) => ({
    field: formatFieldName(e.path),
    message: kindToClientMessage(e.kind),
  }));

  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    safeFieldErrors,
  );
};

// Handle Mongoose duplicate key errors (E11000)
const handleDuplicateKeyError = (error: any): AppError => {
  const rawField = error.keyValue ? Object.keys(error.keyValue)[0] : 'unknown';
  // Log full detail (including the offending value) server-side.
  errorLogger.warn('Duplicate key error', {
    field: rawField,
    keyValue: error.keyValue,
  });
  // Client-safe: do NOT echo the field name (helps enumeration attacks on
  // e.g. email/phone-signup endpoints). A static 409 is enough to let the
  // caller know the resource already exists.
  return new AppError('Resource already exists', 409, 'DUPLICATE_KEY');
};

// Handle Mongoose cast errors (invalid ObjectId, etc.)
const handleCastError = (error: any): AppError => {
  // Log raw schema path + rejected value server-side.
  errorLogger.warn('Cast error', { path: error.path, value: error.value, kind: error.kind });
  // Client-safe: generic — never echo schema path or raw value.
  return new AppError('Invalid identifier', 400, 'INVALID_ID');
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  errorLogger.warn('Invalid JWT token');
  return new AppError('Invalid token. Please log in again', 401, 'JWT_INVALID');
};

const handleJWTExpiredError = (): AppError => {
  errorLogger.warn('JWT token expired');
  return new AppError('Token expired. Please log in again', 401, 'JWT_EXPIRED');
};

// Handle Twilio errors
const handleTwilioError = (error: any): AppError => {
  errorLogger.error('Twilio service error', error, {
    errorCode: error.code,
    status: error.status,
  });
  return new AppError('SMS service unavailable. Please try again later', 503, 'TWILIO_ERROR');
};

// Handle SendGrid errors
const handleSendGridError = (error: any): AppError => {
  errorLogger.error('SendGrid service error', error, {
    errorCode: error.code,
  });
  return new AppError('Email service unavailable. Please try again later', 503, 'SENDGRID_ERROR');
};

// Handle Stripe errors
const handleStripeError = (error: any): AppError => {
  errorLogger.error('Stripe error', error, {
    errorCode: error.code,
    errorType: error.type,
  });

  const statusMap: Record<string, number> = {
    card_error: 400,
    rate_limit_error: 429,
    authentication_error: 401,
    api_connection_error: 503,
    invalid_request_error: 400,
  };

  return new AppError(error.message || 'Payment processing error', statusMap[error.type] || 500, 'STRIPE_ERROR');
};

// Handle Razorpay errors
const handleRazorpayError = (error: any): AppError => {
  errorLogger.error('Razorpay service error', error, {
    errorCode: error.code,
    description: error.description,
  });
  return new AppError('Payment service error. Please try again', 503, 'RAZORPAY_ERROR');
};

// Handle database errors
const handleDatabaseError = (error: any): AppError => {
  errorLogger.error('Database error', error, {
    name: error.name,
    code: error.code,
  });
  return new AppError('Database operation failed. Please try again', 503, 'DATABASE_ERROR');
};

// Handle timeout errors
const handleTimeoutError = (error: any): AppError => {
  errorLogger.warn('Request timeout', { message: error.message });
  return new AppError('Request timeout. Please try again', 408, 'TIMEOUT_ERROR');
};

/**
 * Classify an unknown error into an AppError.
 * Never leaks internal details (stack traces, schema info, file paths) to the client.
 */
const classifyError = (error: any): AppError => {
  // Already an AppError — pass through
  if (error instanceof AppError) return error;

  // Mongoose validation error
  if (error.name === 'ValidationError' && error.errors) return handleMongooseValidationError(error);

  // MongoDB duplicate key (E11000)
  if (error.code === 11000) return handleDuplicateKeyError(error);

  // Mongoose CastError (invalid ObjectId)
  if (error.name === 'CastError') return handleCastError(error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') return handleJWTError();
  if (error.name === 'TokenExpiredError') return handleJWTExpiredError();

  // External service errors
  if (error.constructor.name === 'TwilioRestException' || error.code?.includes('Twilio'))
    return handleTwilioError(error);
  if (error.message?.includes('SendGrid')) return handleSendGridError(error);
  if (error.type?.includes('Stripe') || error.type === 'card_error') return handleStripeError(error);
  // D3: Tightened — previous check matched ANY error with a statusCode
  // (including generic fetch errors and custom AppErrors), misclassifying
  // them as Razorpay failures. Require at least `error.error.description`
  // or `error.error.code` which are Razorpay-specific fields.
  const isRazorpayError = !!(error.error?.description || error.error?.code);
  if (isRazorpayError) return handleRazorpayError(error);

  // MongoDB driver errors (includes MongoNetworkError)
  if (error.name === 'MongoError' || error.name === 'MongoServerError' || error.name === 'MongoNetworkError')
    return handleDatabaseError(error);

  // Network errors → 503
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
    errorLogger.warn('Network error', { code: error.code, message: error.message });
    return new AppError('Service temporarily unavailable', 503, 'NETWORK_ERROR');
  }

  // Timeout
  if (error.code === 'ETIMEDOUT' || error.message === 'timeout') return handleTimeoutError(error);

  // Payload too large (express body-parser / multer)
  if (
    error.type === 'entity.too.large' ||
    error.name === 'PayloadTooLargeError' ||
    (error instanceof Error && error.message?.toLowerCase().includes('request entity too large'))
  ) {
    errorLogger.warn('Payload too large', { message: error.message });
    return new AppError('Request too large', 413, 'PAYLOAD_TOO_LARGE');
  }

  // Unknown — generic 500, never expose raw message
  return new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
};

// Global error handling middleware — must be registered AFTER all routes
// SANA: security hardening — All errors are sanitized in production. Stack traces, internal
//       error messages, and implementation details are NEVER exposed to clients in production.
//       Logging captures full context server-side for debugging while client sees safe messages.
export const globalErrorHandler = (error: any, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.correlationId;
  const userId = req.userId;

  // SANA: security hardening — Log the raw error with full context (server-side only).
  //       This is safe because logs are server-side. Sanitize query and body before logging
  //       to prevent logging credentials or sensitive payment data.
  errorLogger.error(
    `${req.method} ${req.path} - Error occurred`,
    error,
    {
      method: req.method,
      path: req.path,
      query: sanitizeLog(req.query),
      body: sanitizeLog(req.body),
      userId,
      requestId,
      errorName: error.name,
      errorMessage: error.message,
    },
    requestId,
  );

  const appError = classifyError(error);

  // Log severity-appropriate message
  if (appError.statusCode >= 500) {
    errorLogger.error(
      `Server error ${appError.statusCode}`,
      null,
      {
        requestId,
        code: appError.code,
        message: appError.message,
      },
      requestId,
    );
  } else {
    errorLogger.warn(
      `Client error ${appError.statusCode}`,
      {
        requestId,
        code: appError.code,
        message: appError.message,
      },
      requestId,
    );
  }

  // Build response — SANA: never include stack, file paths, or raw error details in production
  const response: ErrorResponse = {
    success: false,
    code: appError.code,
    message: appError.isOperational ? appError.message : 'Something went wrong',
    ...(appError.errors && { errors: appError.errors }),
    ...(requestId && { requestId }),
  };

  // SANA: security hardening — Stack traces and raw error messages ONLY in development.
  //       Production responses contain minimal information to prevent information leakage attacks.
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    // In dev, always show the real message
    response.message = appError.message || error.message;
  } else if (process.env.NODE_ENV === 'production') {
    // SANA: In production, ensure no sensitive data leaks in error response
    // Strip any error details that might expose internals
    if (!appError.isOperational) {
      response.message = 'Something went wrong';
    }
  }

  return res.status(appError.statusCode).json(response);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  errorLogger.warn(
    'Route not found',
    {
      method: req.method,
      path: req.originalUrl,
    },
    req.correlationId,
  );
  next(error);
};

// Error boundary for critical operations
export const withErrorLogging = (operationName: string, operation: () => Promise<any>, correlationId?: string) => {
  const opLogger = createServiceLogger(operationName);

  return async () => {
    try {
      opLogger.info(`Starting: ${operationName}`, {}, correlationId);
      const result = await operation();
      opLogger.info(`Completed: ${operationName}`, {}, correlationId);
      return result;
    } catch (error) {
      opLogger.error(`Failed: ${operationName}`, error, {}, correlationId);
      throw error;
    }
  };
};
