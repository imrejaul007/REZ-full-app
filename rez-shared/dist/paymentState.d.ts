export declare const PAYMENT_STATES: {
    readonly PENDING: "pending";
    readonly INITIATED: "initiated";
    readonly PROCESSING: "processing";
    readonly AUTHORIZED: "authorized";
    readonly CAPTURED: "captured";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly REFUNDED: "refunded";
    readonly PARTIALLY_REFUNDED: "partially_refunded";
    readonly CANCELLED: "cancelled";
    readonly EXPIRED: "expired";
};
export type PaymentState = typeof PAYMENT_STATES[keyof typeof PAYMENT_STATES];
