import { Request, Response, NextFunction } from 'express';
import { StationType, OrderStatus, PriorityLevel } from '../config';

// Internal service authentication middleware
export const internalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKENS_JSON;

  // Skip auth in development if no token configured
  if (!expectedToken) {
    next();
    return;
  }

  if (!serviceToken) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'X-Internal-Token header is missing'
    });
    return;
  }

  try {
    const tokens = JSON.parse(expectedToken) as Record<string, string>;
    const isValid = Object.values(tokens).includes(serviceToken);

    if (!isValid) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid service token'
      });
      return;
    }

    next();
  } catch {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate token'
    });
  }
};

// Request logging middleware
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const { method, path } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${path} ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Validation middleware factory
export const validateQuery = (schema: {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array';
    required?: boolean;
    enum?: readonly string[];
  }
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [field, config] of Object.entries(schema)) {
      const value = req.query[field];

      if (value === undefined) {
        if (config.required) {
          errors.push(`Query parameter '${field}' is required`);
        }
        continue;
      }

      if (config.enum && !config.enum.includes(value as string)) {
        errors.push(
          `Query parameter '${field}' must be one of: ${config.enum.join(', ')}`
        );
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
      return;
    }

    next();
  };
};

// Station validation middleware
export const validateStation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const station = req.params.station || req.query.station || req.body.station;

  if (station && !Object.values(StationType).includes(station as StationType)) {
    res.status(400).json({
      error: 'Invalid station',
      validStations: Object.values(StationType),
      received: station
    });
    return;
  }

  next();
};

// Priority validation middleware
export const validatePriority = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const priority = req.body.priority || req.query.priority;

  if (priority !== undefined) {
    const numPriority = Number(priority);
    if (
      isNaN(numPriority) ||
      numPriority < PriorityLevel.LOW ||
      numPriority > PriorityLevel.RUSH
    ) {
      res.status(400).json({
        error: 'Invalid priority',
        validRange: {
          min: PriorityLevel.LOW,
          max: PriorityLevel.RUSH
        },
        labels: {
          [PriorityLevel.LOW]: 'LOW',
          [PriorityLevel.NORMAL]: 'NORMAL',
          [PriorityLevel.HIGH]: 'HIGH',
          [PriorityLevel.URGENT]: 'URGENT',
          [PriorityLevel.RUSH]: 'RUSH'
        }
      });
      return;
    }
  }

  next();
};

// CORS middleware for KDS displays
export const kdsCorsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Token');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

// Error handler middleware
export const errorHandlerMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    path: req.path,
    timestamp: new Date().toISOString()
  });
};
