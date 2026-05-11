/**
 * Shared DTO interfaces — Phase 7 shared contracts
 *
 * These interfaces define the over-the-wire shapes that the backend produces
 * and all clients consume. Update here when the backend model shapes change.
 *
 * CANONICAL SCHEMA DECISION (DM-02): This file is the source of truth for
 * API response shapes. The Order model in rez-backend and any other service
 * implementations must map to these DTOs. Use normalizers from statusCompat.ts
 * to handle cross-service schema differences.
 *
 * ID FIELD CONVENTION (TF-12): All entity IDs use `id` (not `_id`) in DTOs
 * to match REST API conventions. Backend MongoDB `_id` is mapped to `id` at
 * the API boundary via normalizeUserId() and similar helpers.
 */
import type { OrderStatus } from './orderStatuses';
import type { OrderPaymentStatus } from './paymentStatuses';
import type { CoinType } from './constants/coins';
export type { OrderStatus } from './orderStatuses';
export type { OrderPaymentStatus, PaymentStatus } from './paymentStatuses';
export interface OrderItemDTO {
    id: string;
    menuItem: string;
    name: string;
    price: number;
    quantity: number;
    customizations?: Array<{
        group: string;
        choice: string;
        price: number;
    }>;
    totalPrice: number;
}
export interface OrderPaymentDTO {
    method: 'cod' | 'wallet' | 'card' | 'upi' | 'netbanking' | 'razorpay' | 'stripe';
    status: OrderPaymentStatus;
    transactionId?: string;
    gatewayOrderId?: string;
    paidAt?: string;
    amount: number;
    walletAmountUsed?: number;
    coinsRedeemed?: number;
}
export interface OrderDTO {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    items: OrderItemDTO[];
    subtotal: number;
    tax: number;
    delivery: number;
    discount: number;
    total: number;
    payment: OrderPaymentDTO;
    merchant: {
        id: string;
        name: string;
        address?: string;
    };
    customer: {
        id: string;
        name: string;
        phone?: string;
    };
    deliveryAddress?: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    estimatedDeliveryTime?: number;
    createdAt: string;
    updatedAt: string;
}
export type DtoWalletCoinType = CoinType;
/** @deprecated Use PaginatedResponse from types/api.ts instead */
export interface PaginatedDtoResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
/** @deprecated Use PaginatedResponse from types/api.ts */
export type PaginatedResponse<T> = PaginatedDtoResponse<T>;
