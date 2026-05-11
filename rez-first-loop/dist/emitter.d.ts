/**
 * Event Emitter Module
 *
 * Provides event emission utilities for the Inventory → Reorder closed loop.
 * This module should be integrated into rez-merchant-service to emit
 * inventory.low events when stock levels fall below thresholds.
 *
 * Usage in rez-merchant-service:
 *
 *   import { InventoryEventEmitter, createEmitter } from './emitter';
 *
 *   const emitter = createEmitter({
 *     eventPlatformUrl: process.env.EVENT_PLATFORM_URL,
 *     serviceToken: process.env.EVENT_PLATFORM_SERVICE_TOKEN,
 *   });
 *
 *   // When inventory drops below threshold
 *   await emitter.emitInventoryLow({
 *     productId: 'prod_123',
 *     sku: 'SKU-12345',
 *     currentStock: 5,
 *     reorderPoint: 20,
 *     tenantId: 'tenant_456',
 *   });
 */
export interface InventoryLowPayload {
    productId: string;
    sku: string;
    currentStock: number;
    reorderPoint: number;
    preferredSupplierId?: string;
    suggestedQuantity?: number;
    tenantId: string;
}
export interface InventoryLowEvent {
    eventId: string;
    eventType: 'inventory.low';
    timestamp: string;
    source: 'rez-merchant-service';
    tenantId: string;
    payload: InventoryLowPayload;
}
export interface EmitterConfig {
    eventPlatformUrl: string;
    serviceToken: string;
    retryAttempts?: number;
    retryDelayMs?: number;
    timeoutMs?: number;
}
export interface EmitterResult {
    success: boolean;
    eventId: string;
    eventType: string;
    timestamp: string;
    error?: string;
}
export interface EmitOptions {
    correlationId?: string;
    metadata?: Record<string, unknown>;
}
export declare class InventoryEventEmitter {
    private readonly config;
    private readonly metrics;
    constructor(config: EmitterConfig);
    /**
     * Emit an inventory.low event to the Event Platform
     */
    emitInventoryLow(payload: InventoryLowPayload, options?: EmitOptions): Promise<EmitterResult>;
    /**
     * Emit a generic event to the Event Platform
     */
    emitEvent<T extends {
        eventType: string;
        payload: unknown;
    }>(event: {
        eventId: string;
        eventType: string;
        timestamp: string;
        source: string;
        tenantId: string;
        payload: T['payload'];
    }, options?: EmitOptions): Promise<EmitterResult>;
    /**
     * Get emitter metrics
     */
    getMetrics(): Readonly<EmitterMetrics>;
    private sendEvent;
    private delay;
}
interface EmitterMetrics {
    eventsEmitted: number;
    eventsSucceeded: number;
    eventsFailed: number;
    totalLatencyMs: number;
}
export declare function createEmitter(config: EmitterConfig): InventoryEventEmitter;
/**
 * Creates a middleware-compatible inventory monitor that can be integrated
 * into the existing rez-merchant-service inventory management flow.
 */
export declare function createInventoryMonitor(emitter: InventoryEventEmitter, options?: {
    checkThreshold?: (currentStock: number, reorderPoint: number) => boolean;
    onLowInventory?: (event: InventoryLowEvent) => Promise<void>;
}): {
    /**
     * Check inventory and emit event if below threshold
     */
    checkAndEmit(productId: string, sku: string, currentStock: number, reorderPoint: number, tenantId: string, preferredSupplierId?: string): Promise<EmitterResult | null>;
    /**
     * Emit a low inventory event directly
     */
    emitLowInventory: (payload: InventoryLowPayload) => Promise<EmitterResult>;
};
export interface BatchEmitter {
    addToBatch(payload: InventoryLowPayload): void;
    emitBatch(): Promise<EmitterResult[]>;
    clearBatch(): void;
    getBatchSize(): number;
}
export declare function createBatchEmitter(emitter: InventoryEventEmitter, maxBatchSize?: number): BatchEmitter;
declare const _default: {
    InventoryEventEmitter: typeof InventoryEventEmitter;
    createEmitter: typeof createEmitter;
    createInventoryMonitor: typeof createInventoryMonitor;
    createBatchEmitter: typeof createBatchEmitter;
};
export default _default;
//# sourceMappingURL=emitter.d.ts.map