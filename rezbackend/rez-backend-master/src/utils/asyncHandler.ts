import { Request, Response, NextFunction, RequestHandler } from 'express';

// Async handler to catch errors in async route handlers
export const asyncHandler = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Return the promise so that direct `await handler(req, res, next)` in tests works.
    return Promise.resolve(fn(req, res, next) as any).catch(next) as Promise<void>;
  };
};

// Alternative async handler with explicit typing
export const catchAsync = <T extends RequestHandler>(fn: T): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next) as any).catch((error: Error) => next(error)) as Promise<void>;
  };
};
