/**
 * Circuit Breaker Pattern Implementation
 *
 * Provides graceful degradation when external services are failing.
 * Prevents cascading failures across services.
 *
 * Usage:
 * ```typescript
 * const redisBreaker = new CircuitBreaker(async () => {
 *   return await redis.get(key);
 * }, { timeout: 3000, threshold: 50 });
 *
 * const result = await redisBreaker.call()
 *   .catch(() => fallbackValue);
 * ```
 */
export declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Service failing, reject requests
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    name?: string;
    onOpen?: () => void;
    onHalfOpen?: () => void;
    onClose?: () => void;
}
export declare class CircuitBreaker {
    private fn;
    private state;
    private failureCount;
    private successCount;
    private requestCount;
    private lastFailureTime?;
    private nextAttemptTime?;
    private readonly timeout;
    private readonly errorThresholdPercentage;
    private readonly resetTimeout;
    private readonly name;
    private readonly onOpen?;
    private readonly onHalfOpen?;
    private readonly onClose?;
    constructor(fn: () => Promise<any>, options?: CircuitBreakerOptions);
    /**
     * Call the protected function
     */
    call(): Promise<any>;
    /**
     * Record successful call
     */
    private onSuccess;
    /**
     * Record failed call
     */
    private onFailure;
    /**
     * Transition to new state
     */
    private transitionTo;
    /**
     * Create a timeout promise
     */
    private createTimeout;
    /**
     * Get circuit status
     */
    getStatus(): {
        name: string;
        state: CircuitState;
        failureCount: number;
        successCount: number;
        requestCount: number;
        failurePercentage: number;
    };
    /**
     * Reset the circuit breaker
     */
    reset(): void;
}
/**
 * Circuit breaker for Redis operations
 */
export declare function createRedisCircuitBreaker(fn: () => Promise<any>, name?: string): CircuitBreaker;
/**
 * Circuit breaker for HTTP calls
 */
export declare function createHttpCircuitBreaker(fn: () => Promise<any>, name?: string): CircuitBreaker;
/**
 * Circuit breaker for database operations
 */
export declare function createDatabaseCircuitBreaker(fn: () => Promise<any>, name?: string): CircuitBreaker;
/**
 * Batch circuit breaker status report
 */
export declare function getCircuitBreakerStatus(breakers: Map<string, CircuitBreaker>): any[];
