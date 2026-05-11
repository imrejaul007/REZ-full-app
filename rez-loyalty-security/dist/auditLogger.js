"use strict";
/**
 * Audit Logger for REZ Loyalty System
 *
 * Comprehensive audit logging for sensitive operations including:
 * - Coin credits/debits
 * - Tier changes
 * - Admin actions
 * - Failed auth attempts
 * - Rate limit hits
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuditLogger = initializeAuditLogger;
exports.logAuditEvent = logAuditEvent;
exports.logCoinTransaction = logCoinTransaction;
exports.logTierChange = logTierChange;
exports.logAdminAction = logAdminAction;
exports.logAuthFailure = logAuthFailure;
exports.logRateLimitHit = logRateLimitHit;
exports.logDataAccess = logDataAccess;
exports.logDataModification = logDataModification;
exports.flushQueue = flushQueue;
exports.shutdownAuditLogger = shutdownAuditLogger;
exports.onAuditEvent = onAuditEvent;
exports.onAllAuditEvents = onAllAuditEvents;
exports.queryAuditLogs = queryAuditLogs;
const events_1 = require("events");
// Configuration
const DEFAULT_CONFIG = {
    enableConsole: process.env.NODE_ENV !== 'production',
    enableFile: true,
    enableRemote: false,
    remoteUrl: process.env.AUDIT_LOG_URL || '',
    filePath: process.env.AUDIT_LOG_PATH || './logs/audit.log',
    flushInterval: 5000,
    batchSize: 100,
    sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'creditCard'],
};
let config = { ...DEFAULT_CONFIG };
let eventQueue = [];
let flushTimer = null;
// Event emitter for real-time audit notifications
const auditEmitter = new events_1.EventEmitter();
/**
 * Initialize audit logger with configuration
 */
function initializeAuditLogger(customConfig) {
    config = { ...DEFAULT_CONFIG, ...customConfig };
    if (config.enableFile) {
        // Ensure log directory exists
        const fs = require('fs');
        const path = require('path');
        const dir = path.dirname(config.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    // Start flush timer
    if (flushTimer)
        clearInterval(flushTimer);
    flushTimer = setInterval(flushQueue, config.flushInterval);
    console.log('[AuditLogger] Initialized with config:', {
        enableConsole: config.enableConsole,
        enableFile: config.enableFile,
        enableRemote: config.enableRemote,
    });
}
/**
 * Generate unique audit event ID
 */
function generateEventId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `audit_${timestamp}_${random}`;
}
/**
 * Sanitize sensitive data from metadata
 */
function sanitizeData(data) {
    const sanitized = { ...data };
    for (const field of config.sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
        // Also check nested objects
        for (const key of Object.keys(sanitized)) {
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = sanitizeData(sanitized[key]);
            }
        }
    }
    return sanitized;
}
/**
 * Create base audit event
 */
function createBaseEvent(eventType, resourceType, action) {
    return {
        eventType,
        resourceType,
        action,
        result: 'success',
    };
}
/**
 * Log an audit event
 */
function logAuditEvent(event) {
    const fullEvent = {
        ...event,
        id: generateEventId(),
        timestamp: new Date().toISOString(),
        metadata: event.metadata ? sanitizeData(event.metadata) : undefined,
    };
    // Add to queue
    eventQueue.push(fullEvent);
    // Log to console immediately for critical events
    if (config.enableConsole) {
        console.log('[AUDIT]', JSON.stringify(fullEvent));
    }
    // Flush if batch size reached
    if (eventQueue.length >= config.batchSize) {
        flushQueue();
    }
    // Emit event for real-time listeners
    auditEmitter.emit('audit', fullEvent);
    auditEmitter.emit(event.eventType, fullEvent);
    return fullEvent.id;
}
// ============================================================================
// Specialized Audit Logging Functions
// ============================================================================
/**
 * Log coin credit/debit transaction
 */
function logCoinTransaction(userId, amount, type, reason, context) {
    return logAuditEvent({
        ...createBaseEvent(type === 'credit' ? 'COIN_CREDIT' : 'COIN_DEBIT', 'wallet', `coin_${type}`),
        userId,
        adminId: context.adminId,
        serviceId: context.serviceId,
        resourceId: context.transactionId,
        metadata: {
            amount,
            reason,
            type,
        },
        previousValue: context.previousBalance,
        newValue: context.newBalance,
        ipAddress: context.ipAddress,
        correlationId: context.correlationId,
    });
}
/**
 * Log tier change
 */
function logTierChange(userId, previousTier, newTier, reason, context) {
    return logAuditEvent({
        ...createBaseEvent('TIER_CHANGE', 'user', 'change_tier'),
        userId,
        adminId: context.adminId,
        metadata: {
            previousTier,
            newTier,
            reason,
            automatic: context.automatic,
            triggerEvent: context.triggerEvent,
        },
        previousValue: previousTier,
        newValue: newTier,
        ipAddress: context.ipAddress,
        correlationId: context.correlationId,
    });
}
/**
 * Log admin action
 */
function logAdminAction(adminId, action, targetUserId, reason, context) {
    return logAuditEvent({
        ...createBaseEvent('ADMIN_ACTION', 'admin', action),
        adminId,
        userId: targetUserId,
        serviceId: context.serviceId,
        metadata: {
            action,
            reason,
        },
        previousValue: context.previousValue,
        newValue: context.newValue,
        result: context.success !== false ? 'success' : 'failure',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,
        correlationId: context.correlationId,
    });
}
/**
 * Log failed authentication attempt
 */
function logAuthFailure(identifier, failureReason, context) {
    return logAuditEvent({
        ...createBaseEvent('AUTH_FAILURE', 'auth', 'login_failed'),
        userId: identifier,
        serviceId: context.serviceId,
        metadata: {
            failureReason,
            identifierType: identifier.includes('@') ? 'email' : 'userId',
        },
        result: 'failure',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
    });
}
/**
 * Log rate limit hit
 */
function logRateLimitHit(identifier, endpoint, limitType, context) {
    return logAuditEvent({
        ...createBaseEvent('RATE_LIMIT_HIT', 'api', 'rate_limit_exceeded'),
        userId: identifier,
        serviceId: context.serviceId,
        resourceId: endpoint,
        metadata: {
            limitType,
            endpoint,
        },
        result: 'partial',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
    });
}
/**
 * Log data access
 */
function logDataAccess(userId, resourceType, resourceId, action, context) {
    return logAuditEvent({
        ...createBaseEvent('DATA_ACCESS', resourceType, action),
        userId,
        adminId: context.adminId,
        serviceId: context.serviceId,
        resourceId,
        ipAddress: context.ipAddress,
        correlationId: context.correlationId,
    });
}
/**
 * Log data modification
 */
function logDataModification(userId, resourceType, resourceId, action, context) {
    return logAuditEvent({
        ...createBaseEvent('DATA_MODIFICATION', resourceType, action),
        userId,
        adminId: context.adminId,
        serviceId: context.serviceId,
        resourceId,
        previousValue: context.previousValue,
        newValue: context.newValue,
        ipAddress: context.ipAddress,
        correlationId: context.correlationId,
    });
}
// ============================================================================
// Queue Management
// ============================================================================
/**
 * Flush event queue to persistent storage
 */
function flushQueue() {
    if (eventQueue.length === 0)
        return;
    const events = eventQueue.splice(0, eventQueue.length);
    if (config.enableFile) {
        const fs = require('fs');
        const logLine = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
        fs.appendFileSync(config.filePath, logLine);
    }
    if (config.enableRemote && config.remoteUrl) {
        // Send to remote audit service
        fetch(config.remoteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
        }).catch((err) => {
            console.error('[AuditLogger] Failed to send to remote:', err);
            // Re-add events to queue for retry
            eventQueue.unshift(...events);
        });
    }
    console.log(`[AuditLogger] Flushed ${events.length} events`);
}
/**
 * Shutdown audit logger gracefully
 */
function shutdownAuditLogger() {
    return new Promise((resolve) => {
        if (flushTimer) {
            clearInterval(flushTimer);
            flushTimer = null;
        }
        flushQueue();
        console.log('[AuditLogger] Shutdown complete');
        resolve();
    });
}
// ============================================================================
// Event Subscription
// ============================================================================
/**
 * Subscribe to specific audit events
 */
function onAuditEvent(eventType, handler) {
    auditEmitter.on(eventType, handler);
    return () => auditEmitter.off(eventType, handler);
}
/**
 * Subscribe to all audit events
 */
function onAllAuditEvents(handler) {
    auditEmitter.on('audit', handler);
    return () => auditEmitter.off('audit', handler);
}
// ============================================================================
// Query Functions (for audit retrieval)
// ============================================================================
/**
 * Get audit events from file (for querying)
 */
async function queryAuditLogs(filters) {
    if (!config.enableFile) {
        return [];
    }
    const fs = require('fs');
    if (!fs.existsSync(config.filePath)) {
        return [];
    }
    const content = fs.readFileSync(config.filePath, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    const events = [];
    for (const line of lines) {
        try {
            const event = JSON.parse(line);
            if (filters.userId && event.userId !== filters.userId)
                continue;
            if (filters.eventType && event.eventType !== filters.eventType)
                continue;
            if (filters.startDate && event.timestamp < filters.startDate)
                continue;
            if (filters.endDate && event.timestamp > filters.endDate)
                continue;
            events.push(event);
            if (filters.limit && events.length >= filters.limit)
                break;
        }
        catch {
            // Skip malformed lines
        }
    }
    return events;
}
//# sourceMappingURL=auditLogger.js.map