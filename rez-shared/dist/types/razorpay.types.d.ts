export interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';
    order_id: string;
    invoice_id?: string;
    international?: boolean;
    method?: string;
    amount_refunded?: number;
    refunds?: RazorpayRefund[];
    created_at: number;
}
export interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    status: 'created' | 'paid' | 'partial_paid' | 'expired';
    attempts: number;
    receipt?: string;
    created_at: number;
}
export interface RazorpayRefund {
    id: string;
    entity: string;
    amount: number;
    status: 'pending' | 'processed' | 'failed';
    payment_id: string;
    created_at: number;
}
export interface RazorpayWebhookPayload {
    event: string;
    payload: {
        payment?: {
            entity: RazorpayPayment;
        };
        order?: {
            entity: RazorpayOrder;
        };
        refund?: {
            entity: RazorpayRefund;
        };
    };
}
