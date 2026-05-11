/**
 * Payment entity types — based on canonical Payment.ts
 * Includes IPayment with full 11-state FSM and all payment methods
 */
import { PaymentStatus, PaymentMethod, PaymentGateway } from '../enums/index';
export interface IPaymentUserDetails {
    name?: string;
    email?: string;
    phone?: string;
}
export interface IPaymentGatewayResponse {
    gateway: string;
    transactionId?: string;
    paymentUrl?: string;
    qrCode?: string;
    upiId?: string;
    expiryTime?: Date;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface IPayment {
    _id?: string;
    paymentId: string;
    orderId: string;
    user: string;
    amount: number;
    currency: string;
    /** How the customer pays: UPI, card, wallet, netbanking */
    paymentMethod: PaymentMethod;
    /** Which gateway processes the payment: razorpay, stripe, paypal */
    gateway?: PaymentGateway;
    purpose: 'wallet_topup' | 'order_payment' | 'event_booking' | 'financial_service' | 'other';
    status: PaymentStatus;
    userDetails: IPaymentUserDetails;
    metadata: Record<string, any>;
    gatewayResponse?: IPaymentGatewayResponse;
    failureReason?: string;
    walletCredited?: boolean;
    walletCreditedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    expiresAt?: Date;
    refundedAmount?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PAYMENT_STATE_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]>;
