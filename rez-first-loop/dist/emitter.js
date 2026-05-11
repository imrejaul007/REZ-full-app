"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryEventEmitter = void 0;
exports.createEmitter = createEmitter;
exports.createInventoryMonitor = createInventoryMonitor;
exports.createBatchEmitter = createBatchEmitter;
const uuid_1 = require("uuid");
// ============================================================================
// Event Emitter Class
// ============================================================================
class InventoryEventEmitter {
    config;
    metrics;
    constructor(config) {
        this.config = {
            retryAttempts: 3,
            retryDelayMs: 1000,
            timeoutMs: 10000,
            ...config,
        };
        this.metrics = {
            eventsEmitted: 0,
            eventsSucceeded: 0,
            eventsFailed: 0,
            totalLatencyMs: 0,
        };
    }
    /**
     * Emit an inventory.low event to the Event Platform
     */
    async emitInventoryLow(payload, options = {}) {
        const event = {
            eventId: `evt_${(0, uuid_1.v4)()}`,
            eventType: 'inventory.low',
            timestamp: new Date().toISOString(),
            source: 'rez-merchant-service',
            tenantId: payload.tenantId,
            payload: {
                productId: payload.productId,
                sku: payload.sku,
                currentStock: payload.currentStock,
                reorderPoint: payload.reorderPoint,
                preferredSupplierId: payload.preferredSupplierId,
                suggestedQuantity: payload.suggestedQuantity,
            },
        };
        return this.emitEvent(event, options);
    }
    /**
     * Emit a generic event to the Event Platform
     */
    async emitEvent(event, options = {}) {
        const startTime = Date.now();
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const result = await this.sendEvent(event, options);
                this.metrics.eventsEmitted++;
                this.metrics.eventsSucceeded++;
                this.metrics.totalLatencyMs += Date.now() - startTime;
                return {
                    success: true,
                    eventId: event.eventId,
                    eventType: event.eventType,
                    timestamp: event.timestamp,
                };
            }
            catch (error) {
                if (attempt === this.config.retryAttempts) {
                    this.metrics.eventsEmitted++;
                    this.metrics.eventsFailed++;
                    return {
                        success: false,
                        eventId: event.eventId,
                        eventType: event.eventType,
                        timestamp: event.timestamp,
                        error: error instanceof Error ? error.message : String(error),
                    };
                }
                // Exponential backoff
                await this.delay(this.config.retryDelayMs * Math.pow(2, attempt - 1));
            }
        }
        // Should never reach here
        return {
            success: false,
            eventId: event.eventId,
            eventType: event.eventType,
            timestamp: event.timestamp,
            error: 'Max retry attempts exceeded',
        };
    }
    /**
     * Get emitter metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    async sendEvent(event, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
        try {
            const response = await fetch(`${this.config.eventPlatformUrl}/api/v1/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.serviceToken}`,
                    'X-Correlation-ID': options.correlationId || event.eventId,
                    'X-Loop-Id': `loop_${(0, uuid_1.v4)()}`,
                    ...(options.metadata && { 'X-Event-Metadata': JSON.stringify(options.metadata) }),
                },
                body: JSON.stringify(event),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Event Platform returned ${response.status}: ${await response.text()}`);
            }
            return response;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.InventoryEventEmitter = InventoryEventEmitter;
// ============================================================================
// Factory Function
// ============================================================================
function createEmitter(config) {
    if (!config.eventPlatformUrl) {
        throw new Error('EVENT_PLATFORM_URL is required');
    }
    if (!config.serviceToken) {
        throw new Error('EVENT_PLATFORM_SERVICE_TOKEN is required');
    }
    return new InventoryEventEmitter(config);
}
// ============================================================================
// Integration Helper for rez-merchant-service
// ============================================================================
/**
 * Creates a middleware-compatible inventory monitor that can be integrated
 * into the existing rez-merchant-service inventory management flow.
 */
function createInventoryMonitor(emitter, options = {}) {
    const { checkThreshold = (current, reorder) => current <= reorder, onLowInventory, } = options;
    return {
        /**
         * Check inventory and emit event if below threshold
         */
        async checkAndEmit(productId, sku, currentStock, reorderPoint, tenantId, preferredSupplierId) {
            if (!checkThreshold(currentStock, reorderPoint)) {
                return null;
            }
            const result = await emitter.emitInventoryLow({
                productId,
                sku,
                currentStock,
                reorderPoint,
                preferredSupplierId,
                tenantId,
            });
            if (result.success && onLowInventory) {
                const event = {
                    eventId: result.eventId,
                    eventType: 'inventory.low',
                    timestamp: result.timestamp,
                    source: 'rez-merchant-service',
                    tenantId,
                    payload: {
                        productId,
                        sku,
                        currentStock,
                        reorderPoint,
                        preferredSupplierId,
                    },
                };
                await onLowInventory(event);
            }
            return result;
        },
        /**
         * Emit a low inventory event directly
         */
        emitLowInventory: (payload) => {
            return emitter.emitInventoryLow(payload);
        },
    };
}
function createBatchEmitter(emitter, maxBatchSize = 100) {
    let batch = [];
    return {
        addToBatch(payload) {
            if (batch.length >= maxBatchSize) {
                throw new Error(`Batch size limit reached: ${maxBatchSize}`);
            }
            batch.push(payload);
        },
        async emitBatch() {
            const results = await Promise.all(batch.map((payload) => emitter.emitInventoryLow(payload)));
            batch = [];
            return results;
        },
        clearBatch() {
            batch = [];
        },
        getBatchSize() {
            return batch.length;
        },
    };
}
// ============================================================================
// Default Export
// ============================================================================
exports.default = {
    InventoryEventEmitter,
    createEmitter,
    createInventoryMonitor,
    createBatchEmitter,
};
//# sourceMappingURL=emitter.js.map