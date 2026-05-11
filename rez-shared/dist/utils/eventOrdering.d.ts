/**
 * Event Ordering & Causal Consistency Utilities
 *
 * BE-EVT-032: Implements event versioning and causal ordering guarantees
 * across multiple queues (notification, media, analytics).
 *
 * Uses event versioning + causality tracking to maintain ordering invariants
 * for state machines (e.g., order lifecycle: created → paid → shipped → delivered).
 */
import type Redis from 'ioredis';
/**
 * Event versioning for causal consistency
 * Each event in a causal chain has a version number and parent version reference
 */
export interface VersionedEvent {
    eventId: string;
    version: number;
    parentVersion?: number;
    entityId: string;
    entityType: string;
    causality?: {
        entityId: string;
        requiredVersion: number;
    };
    [key: string]: any;
}
/**
 * Track causal dependencies for events
 * Prevents out-of-order processing of dependent events
 */
export declare class CausalityTracker {
    private redis;
    private readonly namespace;
    constructor(redis: Redis);
    /**
     * Get the current version of an entity
     */
    getEntityVersion(entityType: string, entityId: string): Promise<number>;
    /**
     * Increment entity version and return the new version
     */
    incrementEntityVersion(entityType: string, entityId: string): Promise<number>;
    /**
     * Check if an event is ready to be processed based on causal dependencies
     */
    canProcessEvent(event: VersionedEvent): Promise<boolean>;
    /**
     * Record that an event version was processed
     */
    recordEventProcessed(event: VersionedEvent): Promise<void>;
    /**
     * Check if an event version has already been processed (for idempotency)
     */
    isEventProcessed(event: VersionedEvent): Promise<boolean>;
    /**
     * Clear causality tracking for an entity (cleanup after saga completion)
     */
    clearEntityTracking(entityType: string, entityId: string): Promise<void>;
}
/**
 * Event ordering strategy for saga patterns
 *
 * Saga pattern: Long-running transaction across multiple services
 * Each step must wait for the previous step to complete
 *
 * Example order processing saga:
 * 1. order.created (v1)
 * 2. payment.processed (v1, requires order v1)
 * 3. inventory.reserved (v1, requires payment v1)
 * 4. order.shipped (v1, requires inventory v1)
 * 5. customer.notified (v1, requires order v1)
 */
export declare class SagaOrchestrator {
    private causality;
    constructor(redis: Redis);
    /**
     * Define a saga step with its causal dependencies
     */
    defineStep(stepName: string, entityType: string, entityId: string, requiredPreviousSteps?: Array<{
        stepName: string;
        entityType: string;
        entityId: string;
    }>): Promise<VersionedEvent>;
    /**
     * Check if a step can be executed
     */
    canExecuteStep(event: VersionedEvent): Promise<boolean>;
    /**
     * Mark a step as completed
     */
    markStepCompleted(event: VersionedEvent): Promise<void>;
    /**
     * Rollback a saga (for compensation transactions)
     */
    rollbackSaga(entityType: string, entityId: string): Promise<void>;
}
/**
 * Event stream consistency checker
 * Validates that events conform to ordering guarantees
 */
export declare class EventStreamValidator {
    /**
     * Validate event ordering within a single entity's event stream
     */
    static validateEntityEventOrder(events: VersionedEvent[]): boolean;
    /**
     * Validate causal ordering across multiple event streams
     */
    static validateCausalOrdering(events: VersionedEvent[]): boolean;
}
