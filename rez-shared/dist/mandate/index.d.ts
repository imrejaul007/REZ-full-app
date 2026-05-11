/**
 * Shared types for NPCI/NACH/UPI AutoPay mandate system
 */
export type MandateType = 'nach' | 'upi_autopay' | 'emandate';
export type MandateStatus = 'created' | 'authorized' | 'active' | 'paused' | 'cancelled' | 'expired' | 'failed';
export type MandateFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'as_presented';
export type MandateAuthType = 'netbanking' | 'debitcard' | 'upi' | 'physical';
export type RecurringPaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type SubscriptionStatus = 'created' | 'authenticated' | 'active' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired';
/** DTO for mandate creation response */
export interface MandateDTO {
    id: string;
    userId: string;
    type: MandateType;
    status: MandateStatus;
    maxAmount: number;
    frequency: MandateFrequency;
    nextChargeDate: string | null;
    createdAt: string;
}
/** DTO for recurring payment response */
export interface RecurringPaymentDTO {
    id: string;
    mandateId: string;
    amount: number;
    currency: string;
    status: RecurringPaymentStatus;
    createdAt: string;
}
export { MANDATE_CONSTANTS } from './constants';
