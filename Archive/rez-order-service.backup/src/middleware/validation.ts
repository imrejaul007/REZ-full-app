/**
 * Zod validation middleware for Express routes.
 * Validates request bodies and query parameters against schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse, errors } from '../utils/response';

/**
 * Validates req.body against the provided Zod schema.
 * Returns 400 with error details if validation fails.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return errorResponse(res, errors.validationFailed('Validation failed', result.error.flatten()));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against the provided Zod schema.
 * Returns 400 with error details if validation fails.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return errorResponse(res, errors.validationFailed('Query validation failed', result.error.flatten()));
    }
    req.query = result.data as any;
    next();
  };
}
