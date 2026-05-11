/**
 * Approval Workflow Shared Types and Constants
 * Exported for use in payment-service and other backend services
 */
export type ApprovalType = 'refund' | 'payout' | 'settlement_adjustment' | 'payroll' | 'merchant_payout' | 'bulk_operation';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type ApprovalDecision = 'approved' | 'rejected';
export interface ApprovalUser {
    userId: string;
    name: string;
    role: string;
}
export interface ApprovalRecord {
    userId: string;
    name: string;
    role: string;
    decision: ApprovalDecision;
    comment?: string;
    timestamp: Date;
}
export interface ApprovalRequestDTO {
    _id: string;
    type: ApprovalType;
    entityId: string;
    entityType: string;
    amount: number;
    currency: string;
    reason: string;
    requestedBy: ApprovalUser;
    approvals: ApprovalRecord[];
    requiredApprovals: number;
    status: ApprovalStatus;
    expiresAt: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export { APPROVAL_THRESHOLDS, APPROVAL_EXPIRY_MS, REQUIRED_APPROVALS, APPROVER_ROLES, APPROVAL_STATUS, APPROVAL_DECISION, } from './constants';
