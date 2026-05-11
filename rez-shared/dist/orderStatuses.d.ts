/**
 * Canonical Order Statuses — Phase 7 shared contracts
 *
 * Source of truth: rezbackend/src/config/orderStateMachine.ts
 * These values mirror the backend FSM exactly. If the backend FSM changes,
 * update this file in lockstep.
 *
 * See also: packages/rez-shared/src/statusCompat.ts for legacy value normalization.
 */
export declare const STATUS_ORDER: readonly ["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered"];
export declare const ORDER_STATUSES: readonly ["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "failed_delivery", "delivered", "cancelling", "cancelled", "return_requested", "return_rejected", "returned", "refunded"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type LinearOrderStatus = (typeof STATUS_ORDER)[number];
export declare const TERMINAL_ORDER_STATUSES: readonly ["cancelled", "returned", "refunded", "return_rejected"];
export type TerminalOrderStatus = (typeof TERMINAL_ORDER_STATUSES)[number];
export declare const ACTIVE_ORDER_STATUSES: readonly ["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "failed_delivery", "cancelling", "return_requested"];
export type ActiveOrderStatus = (typeof ACTIVE_ORDER_STATUSES)[number];
export declare const PAST_ORDER_STATUSES: readonly ["delivered", "failed_delivery", "return_rejected"];
export type PastOrderStatus = (typeof PAST_ORDER_STATUSES)[number];
/**
 * Type guard: check if a string is a valid OrderStatus.
 */
export declare function isOrderStatus(value: string): value is OrderStatus;
/**
 * Calculate order progress as a percentage (0–100).
 * Mirrors backend getOrderProgress() — keep in sync.
 */
export declare function getOrderProgress(status: string): number;
