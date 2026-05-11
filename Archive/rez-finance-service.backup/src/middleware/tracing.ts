import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', requestId);
  next();
}
