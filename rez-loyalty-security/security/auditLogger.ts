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

import { EventEmitter } from 'events';

// Types
export type AuditEventType =
  | 'COIN_CREDIT'
  | 'COIN_DEBIT'
  | 'TIER_CHANGE'
  | 'ADMIN_ACTION'
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_HIT'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'
  | 'CONFIG_CHANGE'
  | 'USER_BAN'
  | 'USER_UNBAN'
  | 'SCORE_ADJUSTMENT';

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  adminId?: string;
  serviceId?: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  result: 'success' | 'failure' | 'partial';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

export interface AuditLogConfig {
  enableConsole?: boolean;
  enableFile?: boolean;
  enableRemote?: boolean;
  remoteUrl?: string;
  filePath?: string;
  flushInterval?: number;
  batchSize?: number;
  sensitiveFields?: string[];
}

// Configuration
const DEFAULT_CONFIG: Required<AuditLogConfig> = {
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  enableRemote: false,
  remoteUrl: process.env.AUDIT_LOG_URL || '',
  filePath: process.env.AUDIT_LOG_PATH || './logs/audit.log',
  flushInterval: 5000,
  batchSize: 100,
  sensitiveFields: ['password', 'token', 'secret', 'apiKey', 'creditCard'],
};

let config: Required<AuditLogConfig> = { ...DEFAULT_CONFIG };
let eventQueue: AuditEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

// Event emitter for real-time audit notifications
const auditEmitter = new EventEmitter();

/**
 * Initialize audit logger with configuration
 */
export function initializeAuditLogger(customConfig?: AuditLogConfig): void {
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
  if (flushTimer) clearInterval(flushTimer);
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
function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `audit_${timestamp}_${random}`;
}

/**
 * Sanitize sensitive data from metadata
 */
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  for (const field of config.sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
    // Also check nested objects
    for (const key of Object.keys(sanitized)) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key] as Record<string, unknown>);
      }
    }
  }

  return sanitized;
}

/**
 * Create base audit event
 */
function createBaseEvent(
  eventType: AuditEventType,
  resourceType: string,
  action: string
): Omit<AuditEvent, 'id' | 'timestamp'> {
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
export function logAuditEvent(
  event: Omit<AuditEvent, 'id' | 'timestamp'>
): string {
  const fullEvent: AuditEvent = {
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
export function logCoinTransaction(
  userId: string,
  amount: number,
  type: 'credit' | 'debit',
  reason: string,
  context: {
    adminId?: string;
    serviceId?: string;
    transactionId?: string;
    previousBalance?: number;
    newBalance?: number;
    ipAddress?: string;
    correlationId?: string;
  }
): string {
  return logAuditEvent({
    ...createBaseEvent(
      type === 'credit' ? 'COIN_CREDIT' : 'COIN_DEBIT',
      'wallet',
      `coin_${type}`
    ),
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
export function logTierChange(
  userId: string,
  previousTier: string,
  newTier: string,
  reason: string,
  context: {
    adminId?: string;
    automatic?: boolean;
    triggerEvent?: string;
    ipAddress?: string;
    correlationId?: string;
  }
): string {
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
export function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string,
  reason: string,
  context: {
    serviceId?: string;
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    success?: boolean;
  }
): string {
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
export function logAuthFailure(
  identifier: string,
  failureReason: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    serviceId?: string;
    correlationId?: string;
  }
): string {
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
export function logRateLimitHit(
  identifier: string,
  endpoint: string,
  limitType: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    serviceId?: string;
    correlationId?: string;
  }
): string {
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
export function logDataAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  context: {
    adminId?: string;
    serviceId?: string;
    ipAddress?: string;
    correlationId?: string;
  }
): string {
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
export function logDataModification(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  context: {
    adminId?: string;
    serviceId?: string;
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    correlationId?: string;
  }
): string {
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
export function flushQueue(): void {
  if (eventQueue.length === 0) return;

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
export function shutdownAuditLogger(): Promise<void> {
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
export function onAuditEvent(
  eventType: AuditEventType,
  handler: (event: AuditEvent) => void
): () => void {
  auditEmitter.on(eventType, handler);
  return () => auditEmitter.off(eventType, handler);
}

/**
 * Subscribe to all audit events
 */
export function onAllAuditEvents(handler: (event: AuditEvent) => void): () => void {
  auditEmitter.on('audit', handler);
  return () => auditEmitter.off('audit', handler);
}

// ============================================================================
// Query Functions (for audit retrieval)
// ============================================================================

/**
 * Get audit events from file (for querying)
 */
export async function queryAuditLogs(
  filters: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<AuditEvent[]> {
  if (!config.enableFile) {
    return [];
  }

  const fs = require('fs');
  if (!fs.existsSync(config.filePath)) {
    return [];
  }

  const content = fs.readFileSync(config.filePath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const events: AuditEvent[] = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as AuditEvent;

      if (filters.userId && event.userId !== filters.userId) continue;
      if (filters.eventType && event.eventType !== filters.eventType) continue;
      if (filters.startDate && event.timestamp < filters.startDate) continue;
      if (filters.endDate && event.timestamp > filters.endDate) continue;

      events.push(event);

      if (filters.limit && events.length >= filters.limit) break;
    } catch {
      // Skip malformed lines
    }
  }

  return events;
}
