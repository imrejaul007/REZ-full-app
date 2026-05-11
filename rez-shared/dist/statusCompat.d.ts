/**
 * Legacy status compatibility mapper — Phase 7 shared contracts
 *
 * Copied from rezbackend/src/utils/statusCompat.ts so that clients can
 * normalize legacy status values without a round-trip to the server.
 *
 * Add mappings here as legacy values are discovered in client storage,
 * push notifications, or cached API responses. Never remove a mapping
 * until you are certain no stored data or client can produce the old value.
 *
 * Source of truth: rezbackend/src/utils/statusCompat.ts
 */
/**
 * Normalize a legacy order status string to its canonical Phase 3 equivalent.
 * Returns the input unchanged if it is already canonical.
 *
 * @example
 *   normalizeOrderStatus('in_transit')  // → 'out_for_delivery'
 *   normalizeOrderStatus('confirmed')   // → 'confirmed'
 */
export declare function normalizeOrderStatus(status: string): string;
/**
 * Normalize a legacy payment status string to its canonical Phase 3 equivalent.
 * Returns the input unchanged if it is already canonical.
 *
 * @example
 *   normalizePaymentStatus('success')  // → 'paid'
 *   normalizePaymentStatus('paid')     // → 'paid'
 */
export declare function normalizePaymentStatus(status: string): string;
/**
 * Bridge: convert standalone PaymentStatus to OrderPaymentStatus.
 * Returns null for states that have no OrderPaymentStatus equivalent
 * (expired, refund_initiated, refund_processing, refund_failed).
 *
 * Decision (TF-05): Both FSMs are kept as canonical for their domain.
 * Use this bridge when rendering consumer-facing payment state from
 * the financial Payment model.
 *
 * @example
 *   paymentStatusToOrderPayment('completed')  // → 'paid'
 *   paymentStatusToOrderPayment('expired')   // → null
 */
export declare function paymentStatusToOrderPayment(status: string): string | null;
declare const _default: {
    normalizeOrderStatus: typeof normalizeOrderStatus;
    normalizePaymentStatus: typeof normalizePaymentStatus;
    paymentStatusToOrderPayment: typeof paymentStatusToOrderPayment;
};
export default _default;
