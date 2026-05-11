/**
 * Approval Thresholds by Operation Type
 * Operations above these amounts (in paise) require two-person approval
 */
export declare const APPROVAL_THRESHOLDS: Record<string, number>;
/**
 * Default approval expiry time (milliseconds)
 * Requests expire after 48 hours if not fully approved
 */
export declare const APPROVAL_EXPIRY_MS: number;
/**
 * Required number of approvals for an operation
 */
export declare const REQUIRED_APPROVALS = 2;
/**
 * Roles that can approve (by default all admin roles)
 */
export declare const APPROVER_ROLES: string[];
/**
 * Approval request status values
 */
export declare const APPROVAL_STATUS: {
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
    readonly EXPIRED: "expired";
    readonly CANCELLED: "cancelled";
};
/**
 * Approval decision values
 */
export declare const APPROVAL_DECISION: {
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
};
