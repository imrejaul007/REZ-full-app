interface ErrorEvent {
    timestamp: Date;
    service: string;
    error: Error;
    context: Record<string, any>;
    userId?: string;
    requestId?: string;
}
declare class ErrorTracker {
    private errors;
    private maxErrors;
    track(error: Error, context?: Record<string, any>): void;
    getRecentErrors(count?: number): ErrorEvent[];
    getErrorsByType(type: string): ErrorEvent[];
    getErrorRate(windowMs?: number): number;
    clear(): void;
}
export declare const errorTracker: ErrorTracker;
export {};
