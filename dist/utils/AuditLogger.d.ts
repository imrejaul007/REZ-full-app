export declare enum AUDIT_ACTIONS {
    COINS_CREDITED = "COINS_CREDITED",
    COINS_DEBITED = "COINS_DEBITED",
    WALLET_CREATED = "WALLET_CREATED",
    WALLET_UPDATED = "WALLET_UPDATED",
    WALLET_FROZEN = "WALLET_FROZEN",
    WALLET_UNFROZEN = "WALLET_UNFROZEN",
    WITHDRAWAL_REQUESTED = "WITHDRAWAL_REQUESTED",
    WITHDRAWAL_COMPLETED = "WITHDRAWAL_COMPLETED",
    WITHDRAWAL_FAILED = "WITHDRAWAL_FAILED",
    PAYOUT_INITIATED = "PAYOUT_INITIATED",
    PAYOUT_COMPLETED = "PAYOUT_COMPLETED",
    PAYMENT_INITIATED = "PAYMENT_INITIATED",
    PAYMENT_COMPLETED = "PAYMENT_COMPLETED",
    PAYMENT_FAILED = "PAYMENT_FAILED",
    PAYMENT_REFUNDED = "PAYMENT_REFUNDED",
    ORDER_CREATED = "ORDER_CREATED",
    ORDER_COMPLETED = "ORDER_COMPLETED",
    ORDER_CANCELLED = "ORDER_CANCELLED",
    ORDER_REFUNDED = "ORDER_REFUNDED",
    REFUND_INITIATED = "REFUND_INITIATED",
    REFUND_COMPLETED = "REFUND_COMPLETED",
    REFUND_FAILED = "REFUND_FAILED",
    USER_REGISTERED = "USER_REGISTERED",
    USER_UPDATED = "USER_UPDATED",
    USER_DELETED = "USER_DELETED",
    MERCHANT_REGISTERED = "MERCHANT_REGISTERED",
    MERCHANT_APPROVED = "MERCHANT_APPROVED",
    MERCHANT_REJECTED = "MERCHANT_REJECTED",
    KYC_SUBMITTED = "KYC_SUBMITTED",
    KYC_APPROVED = "KYC_APPROVED",
    KYC_REJECTED = "KYC_REJECTED",
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    PASSWORD_CHANGED = "PASSWORD_CHANGED",
    PASSWORD_RESET = "PASSWORD_RESET",
    SETTINGS_UPDATED = "SETTINGS_UPDATED",
    PROFILE_UPDATED = "PROFILE_UPDATED"
}
export interface AuditLogEntry {
    timestamp: Date;
    userId?: string;
    merchantId?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
    errorMessage?: string;
}
export declare class AuditLogger {
    private _collection;
    private serviceName;
    constructor(collection: unknown, serviceName?: string);
    log(entry: Omit<AuditLogEntry, 'timestamp'> & {
        timestamp?: Date;
    }): Promise<unknown>;
    logSuccess(action: string, metadata?: Record<string, unknown>): Promise<unknown>;
    logFailure(action: string, errorMessage: string, metadata?: Record<string, unknown>): Promise<unknown>;
    getLogsByUser(userId: string, limit?: number): Promise<AuditLogEntry[]>;
    getLogsByAction(action: string, limit?: number): Promise<AuditLogEntry[]>;
}
//# sourceMappingURL=AuditLogger.d.ts.map