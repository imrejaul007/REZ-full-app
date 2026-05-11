import type { Request, Response, NextFunction } from 'express';
/**
 * API Versioning Middleware
 *
 * Validates the API version from the 'api-version' header.
 * Returns 400 if the requested version does not match the required version.
 *
 * Usage:
 *   import { apiVersion } from '@rez/shared';
 *   app.use('/api/v1', apiVersion('v1'));
 */
export declare function apiVersion(required: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Default API version for services that don't explicitly set a required version.
 * Allows requests with 'api-version' header set to 'v1' or without the header.
 */
export declare function defaultApiVersion(): (req: Request, res: Response, next: NextFunction) => void;
