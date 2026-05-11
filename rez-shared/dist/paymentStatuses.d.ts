/**
 * Canonical Payment Statuses — Phase 7 shared contracts
 *
 * Source of truth: rezbackend/src/config/financialStateMachine.ts
 * These values mirror the backend FSM exactly. If the backend FSM changes,
 * update this file in lockstep.
 *
 * Two distinct status domains are tracked:
 *   1. PaymentStatus       — standalone Payment model lifecycle
 *   2. OrderPaymentStatus  — Order.payment.status sub-document lifecycle
 *
 * See also: packages/rez-shared/src/statusCompat.ts for legacy value normalization.
 */
export declare const PAYMENT_STATUSES: readonly ["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed"];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export declare const ORDER_PAYMENT_STATUSES: readonly ["pending", "awaiting_payment", "processing", "authorized", "paid", "partially_refunded", "failed", "refunded"];
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];
export declare const TERMINAL_PAYMENT_STATUSES: readonly ["completed", "cancelled", "expired", "refunded"];
export type TerminalPaymentStatus = (typeof TERMINAL_PAYMENT_STATUSES)[number];
export declare const TERMINAL_ORDER_PAYMENT_STATUSES: readonly ["failed", "refunded"];
export type TerminalOrderPaymentStatus = (typeof TERMINAL_ORDER_PAYMENT_STATUSES)[number];
/**
 * Type guard: check if a string is a valid PaymentStatus.
 */
export declare function isPaymentStatus(value: string): value is PaymentStatus;
/**
 * Type guard: check if a string is a valid OrderPaymentStatus.
 */
export declare function isOrderPaymentStatus(value: string): value is OrderPaymentStatus;
