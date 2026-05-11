import { Request, Response, NextFunction } from 'express';
import { validate, eventSchema, feedbackSchema, pushTokenSchema } from '../utils/validators';
import { ValidationError } from '../utils/errors';

export const validateEvent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { value, error } = validate(eventSchema, req.body);

  if (error) {
    throw new ValidationError(error);
  }

  req.body = value;
  next();
};

export const validateFeedback = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { value, error } = validate(feedbackSchema, req.body);

  if (error) {
    throw new ValidationError(error);
  }

  req.body = value;
  next();
};

export const validatePushToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { value, error } = validate(pushTokenSchema, req.body);

  if (error) {
    throw new ValidationError(error);
  }

  req.body = value;
  next();
};

export const validateUserId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userId } = req.params;

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError('Valid user ID is required');
  }

  // Sanitize userId
  req.params.userId = userId.trim();

  next();
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  if (page < 1) {
    throw new ValidationError('Page must be at least 1');
  }

  if (limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};

export const validateRecommendationParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const limit = parseInt(req.query.limit as string) || 10;

  if (limit < 1 || limit > 50) {
    throw new ValidationError('Limit must be between 1 and 50');
  }

  req.query.limit = limit.toString();

  next();
};

export default {
  validateEvent,
  validateFeedback,
  validatePushToken,
  validateUserId,
  validatePagination,
  validateRecommendationParams,
};
