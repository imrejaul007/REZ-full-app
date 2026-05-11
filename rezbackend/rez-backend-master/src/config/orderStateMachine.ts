// @ts-nocheck
/**
 * Order State Machine Configuration
 *
 * Centralized status transitions, validation, and progress calculation
 * for the order lifecycle. Used by admin routes, orderController, and webhookController.
 *
 * See also: packages/rez-shared/src/orderStatuses.ts — canonical status list mirrored
 * for client-side use. If you change ORDER_STATUSES or STATUS_ORDER here, update
 * the shared package in lockstep.
 */

import { logger } from './logger';

// Ordered statuses for linear progress calculation
export const STATUS_ORDER = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'delivered',
] as const;

// All valid order statuses (including terminal branches)
// CRITICAL-013 FIX: Added failed_delivery, return_requested, return_rejected
// to align with the canonical shared package (packages/rez-shared/src/orderStatuses.ts).
// Previously missing these 3 statuses, causing invalid-state transitions and
// incomplete status coverage in the backend FSM.
export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'failed_delivery',
  'delivered',
  'cancelled',
  'cancelling',
  'return_requested',
  'return_rejected',
  'returned',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type LinearOrderStatus = (typeof STATUS_ORDER)[number];

// Terminal statuses — orders that have fully settled with no further forward progress.
// NOTE: 'delivered' is intentionally excluded here because it still permits
// transitions to 'returned' and 'refunded' (see STATUS_TRANSITIONS).
// CRITICAL-013 FIX: Added return_rejected as terminal (cannot progress further after rejection).
export const TERMINAL_STATUSES: OrderStatus[] = ['cancelled', 'returned', 'refunded', 'return_rejected'];

// Active statuses (order is in progress)
// CRITICAL-013 FIX: Added failed_delivery, return_requested, return_rejected as active states
// that represent meaningful post-delivery activity.
export const ACTIVE_STATUSES: OrderStatus[] = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'dispatched',
  'out_for_delivery',
  'cancelling',
  'failed_delivery',
  'return_requested',
];

// Past statuses (order is complete in some way)
// CRITICAL-013 FIX: Added failed_delivery and return_rejected as past states.
export const PAST_STATUSES: OrderStatus[] = [
  'delivered',
  'cancelled',
  'returned',
  'refunded',
  'failed_delivery',
  'return_rejected',
];

/**
 * Valid status transitions map.
 * Key = current status, Value = array of allowed next statuses.
 *
 * Phase 3 canonical transitions (aligned with mission spec):
 *   placed        → confirmed, cancelled, cancelling
 *   confirmed     → preparing, cancelled, cancelling
 *   preparing     → ready, cancelled, cancelling
 *   ready         → dispatched, cancelled, cancelling
 *   dispatched    → out_for_delivery, delivered, cancelled
 *   out_for_delivery → delivered, cancelled
 *   delivered     → returned, refunded
 *   cancelling    → cancelled, placed, confirmed, preparing, ready  (rollback + commit)
 *   cancelled     → refunded
 *   returned      → refunded
 *   refunded      → (terminal)
 */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled', 'cancelling'],
  confirmed: ['preparing', 'cancelled', 'cancelling'],
  preparing: ['ready', 'cancelled', 'cancelling'],
  ready: ['dispatched', 'cancelled', 'cancelling'],
  dispatched: ['out_for_delivery', 'delivered', 'failed_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'failed_delivery', 'cancelled'],
  // CRITICAL-013 FIX: failed_delivery added — delivery attempt failed, can retry or cancel
  failed_delivery: ['dispatched', 'cancelled'],
  delivered: ['returned', 'refunded'],
  // cancelling: intermediate state while cancel transaction runs;
  // can roll back to the pre-cancel status on failure, or commit to cancelled on success.
  cancelling: ['cancelled', 'placed', 'confirmed', 'preparing', 'ready'],
  cancelled: ['refunded'],
  // CRITICAL-013 FIX: return_requested and return_rejected added for return flow
  return_requested: ['return_rejected', 'returned'],
  return_rejected: ['return_requested', 'returned'], // Can appeal or proceed
  returned: ['refunded'],
  refunded: [],
};

/**
 * Merchant-allowed transitions (subset of STATUS_TRANSITIONS).
 * Merchants can only move orders forward through preparation/dispatch.
 */
export const MERCHANT_TRANSITIONS: Record<string, string[]> = {
  confirmed: ['preparing'],
  preparing: ['ready'],
  ready: ['dispatched'],
  dispatched: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

/**
 * SLA thresholds per status (in minutes).
 * Orders exceeding these thresholds are considered "stuck".
 */
export const SLA_THRESHOLDS: Record<string, number> = {
  placed: 60, // 1 hour to confirm
  confirmed: 30, // 30 min to start preparing
  preparing: 120, // 2 hours to finish preparing
  ready: 30, // 30 min to dispatch
  dispatched: 180, // 3 hours to deliver
  out_for_delivery: 120, // 2 hours to deliver after out_for_delivery
};

/**
 * Check if a transition from one status to another is valid.
 */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Check if a merchant-initiated transition is valid.
 */
export function isValidMerchantTransition(from: string, to: string): boolean {
  const allowed = MERCHANT_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

// ─── Phase 3 Transition Guard Helpers ────────────────────────────────────────

/**
 * Validate an order status transition without throwing.
 * Returns true if allowed, false (and logs a warning) if not.
 */
export function validateOrderTransition(from: string, to: string): boolean {
  const valid = isValidTransition(from, to);
  if (!valid) {
    const allowed = STATUS_TRANSITIONS[from];
    if (allowed === undefined) {
      logger.warn(
        `[OrderStateMachine] validateOrderTransition: unknown source status "${from}". ` +
          `Cannot transition to "${to}".`,
      );
    } else {
      logger.warn(
        `[OrderStateMachine] validateOrderTransition: invalid transition "${from}" → "${to}". ` +
          `Allowed from "${from}": [${allowed.join(', ') || 'none — terminal state'}]`,
      );
    }
  }
  return valid;
}

/**
 * Assert that an order status transition is valid, throwing AppError if not.
 * Import AppError lazily to avoid circular dependencies.
 */
export function assertOrderTransition(from: string, to: string): void {
  if (!validateOrderTransition(from, to)) {
    const allowed = STATUS_TRANSITIONS[from];
    const { AppError } = require('../utils/AppError') as {
      AppError: new (msg: string, code: number, key: string) => Error;
    };
    throw new AppError(
      `[OrderStateMachine] Invalid order status transition: "${from}" → "${to}". ` +
        `Allowed from "${from}": [${(allowed ?? []).join(', ') || 'none — terminal state'}]`,
      400,
      'INVALID_ORDER_TRANSITION',
    );
  }
}

/**
 * Get the list of valid next statuses from the current status.
 */
export function getNextStatuses(current: string): string[] {
  return STATUS_TRANSITIONS[current] || [];
}

/**
 * Get the index of a status in the linear order (0-based).
 * Returns -1 for terminal branches (cancelled/returned/refunded).
 */
export function getStatusIndex(status: string): number {
  return STATUS_ORDER.indexOf(status as LinearOrderStatus);
}

/**
 * Calculate order progress as a percentage (0-100).
 * Uses the status index in the linear order.
 * Terminal statuses: delivered=100, cancelled/refunded=0, returned=100.
 * CRITICAL-013/016 FIX: Aligned with shared package (packages/rez-shared/src/orderStatuses.ts).
 * Post-delivery states (failed_delivery, return_requested, return_rejected) all return 100
 * since the item was already successfully delivered — the delivery failure or return flow
 * is administrative resolution, not incomplete delivery progress.
 * 'returned' also returns 100 (item was delivered, then returned — resolution is complete).
 */
export function getOrderProgress(status: string): number {
  if (status === 'delivered') return 100;
  // CRITICAL-013 FIX: post-delivery states = 100% (item was delivered)
  if (status === 'failed_delivery' || status === 'return_requested' || status === 'return_rejected') return 100;
  if (status === 'cancelled' || status === 'refunded') return 0;
  // CRITICAL-016 FIX: returned = 100% (aligned with shared package).
  // The order was fulfilled (delivered) and then the return was resolved — both
  // the delivery and return are complete, so 100% is the correct representation.
  if (status === 'returned') return 100;

  const index = getStatusIndex(status);
  if (index < 0) return 0;

  // Progress is the ratio of the current index to the last linear index
  const maxIndex = STATUS_ORDER.length - 1; // 6 (delivered)
  return Math.round((index / maxIndex) * 100);
}

/**
 * Map order status to delivery status.
 * CRITICAL-013 FIX: Added failed_delivery, return_requested, return_rejected mappings.
 */
export const DELIVERY_STATUS_MAP: Record<string, string> = {
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  dispatched: 'dispatched',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'failed',
  failed_delivery: 'failed',
  return_requested: 'returned',
  return_rejected: 'returned',
  returned: 'returned',
};
