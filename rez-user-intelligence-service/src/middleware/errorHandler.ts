import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError, isOperationalError } from '../utils/errors';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
  timestamp: string;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime?: number;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl}`, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  });

  next();
};

export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId;

  if (isOperationalError(err)) {
    const appError = err as AppError;
    const response: ErrorResponse = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };

    res.status(appError.statusCode).json(response);
    return;
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
};

export const notFoundHandlerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
};

export const asyncHandler = <P = unknown, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown>(
  fn: (req: Request<P, ResBody, ReqBody, ReqQuery>) => Promise<ResBody>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(fn(req)).catch(next);
  };
};

export default {
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorHandlerMiddleware,
  notFoundHandlerMiddleware,
  asyncHandler,
};
