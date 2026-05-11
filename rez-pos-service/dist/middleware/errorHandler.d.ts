import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    details?: unknown;
}
export declare function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response): void;
export declare function createAppError(message: string, statusCode: number, code?: string, details?: unknown): AppError;
//# sourceMappingURL=errorHandler.d.ts.map