import { Request, Response, NextFunction } from 'express';
/**
 * Middleware factory: validates that a named route param is a valid MongoDB ObjectId.
 * Rejects with 400 if the param is missing or not a valid ObjectId.
 *
 * @example
 * // Apply to a router
 * router.get('/:id', validateObjectIdParam('id'), myHandler);
 * router.get('/:merchantId/reviews', validateObjectIdParam('merchantId'), myHandler);
 *
 * @param paramName - The name of the req.params key to validate
 */
export declare function validateObjectIdParam(paramName: string): (req: Request, _res: Response, next: NextFunction) => void;
