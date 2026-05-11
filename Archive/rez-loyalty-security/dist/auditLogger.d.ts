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
export type AuditEventType = 'COIN_CREDIT' | 'COIN_DEBIT' | 'TIER_CHANGE' | 'ADMIN_ACTION' | 'AUTH_FAILURE' | 'RATE_LIMIT_HIT' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'CONFIG_CHANGE' | 'USER_BAN' | 'USER_UNBAN' | 'SCORE_ADJUSTMENT';
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
/**
 * Initialize audit logger with configuration
 */
export declare function initializeAuditLogger(customConfig?: AuditLogConfig): void;
/**
 * Log an audit event
 */
export declare function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): string;
/**
 * Log coin credit/debit transaction
 */
export declare function logCoinTransaction(userId: string, amount: number, type: 'credit' | 'debit', reason: string, context: {
    adminId?: string;
    serviceId?: string;
    transactionId?: string;
    previousBalance?: number;
    newBalance?: number;
    ipAddress?: string;
    correlationId?: string;
}): string;
/**
 * Log tier change
 */
export declare function logTierChange(userId: string, previousTier: string, newTier: string, reason: string, context: {
    adminId?: string;
    automatic?: boolean;
    triggerEvent?: string;
    ipAddress?: string;
    correlationId?: string;
}): string;
/**
 * Log admin action
 */
export declare function logAdminAction(adminId: string, action: string, targetUserId: string, reason: string, context: {
    serviceId?: string;
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    success?: boolean;
}): string;
/**
 * Log failed authentication attempt
 */
export declare function logAuthFailure(identifier: string, failureReason: string, context: {
    ipAddress?: string;
    userAgent?: string;
    serviceId?: string;
    correlationId?: string;
}): string;
/**
 * Log rate limit hit
 */
export declare function logRateLimitHit(identifier: string, endpoint: string, limitType: string, context: {
    ipAddress?: string;
    userAgent?: string;
    serviceId?: string;
    correlationId?: string;
}): string;
/**
 * Log data access
 */
export declare function logDataAccess(userId: string, resourceType: string, resourceId: string, action: string, context: {
    adminId?: string;
    serviceId?: string;
    ipAddress?: string;
    correlationId?: string;
}): string;
/**
 * Log data modification
 */
export declare function logDataModification(userId: string, resourceType: string, resourceId: string, action: string, context: {
    adminId?: string;
    serviceId?: string;
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress?: string;
    correlationId?: string;
}): string;
/**
 * Flush event queue to persistent storage
 */
export declare function flushQueue(): void;
/**
 * Shutdown audit logger gracefully
 */
export declare function shutdownAuditLogger(): Promise<void>;
/**
 * Subscribe to specific audit events
 */
export declare function onAuditEvent(eventType: AuditEventType, handler: (event: AuditEvent) => void): () => void;
/**
 * Subscribe to all audit events
 */
export declare function onAllAuditEvents(handler: (event: AuditEvent) => void): () => void;
/**
 * Get audit events from file (for querying)
 */
export declare function queryAuditLogs(filters: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<AuditEvent[]>;
//# sourceMappingURL=auditLogger.d.ts.map