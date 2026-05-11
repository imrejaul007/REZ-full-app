/**
 * Order Controller — barrel re-export file.
 *
 * The actual handler implementations live in focused sub-controllers:
 *   - orderCreateController.ts   — order creation, validation, placement
 *   - orderQueryController.ts    — get order(s), search, filter, list, stats, financial
 *   - orderUpdateController.ts   — status updates, rating
 *   - orderCancelController.ts   — cancellation, refund flows
 *   - orderTrackingController.ts — tracking / delivery status
 *   - orderReorderController.ts  — reorder, frequently ordered, suggestions
 *
 * This file re-exports everything so that existing route imports
 *   `from '../controllers/orderController'`
 * continue to work without modification.
 */

// ─── Order Creation ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [User Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveryAddress
 *               - paymentMethod
 *             properties:
 *               deliveryAddress:
 *                 $ref: '#/components/schemas/Address'
 *               paymentMethod:
 *                 type: string
 *               coinsUsed:
 *                 type: number
 *               couponCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or empty cart
 *       401:
 *         description: Not authenticated
 */
export { createOrder } from './orderCreateController';

// Shared helpers also exported for use in other controllers (e.g. orderUpdateController)
export {
  VALID_CATEGORY_SLUGS,
  getCategoryRootMap,
  getStoreCategorySlug,
} from './orderCreateController';

// ─── Order Queries ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: List user orders
 *     tags: [User Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: statusGroup
 *         schema:
 *           type: string
 *           enum: [active, past]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated list of user orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */
export {
  getUserOrders,
  getOrderCounts,
  // eslint-disable-next-line max-len
  /** @swagger
   * /api/orders/{orderId}:
   *   get:
   *     summary: Get single order by ID
   *     tags: [User Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: orderId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Order not found
   */
  getOrderById,
  getOrderStats,
  getOrderFinancialDetails,
} from './orderQueryController';

// ─── Order Status Updates & Rating ──────────────────────────────────────────
export {
  updateOrderStatus,
  rateOrder,
} from './orderUpdateController';

// ─── Order Cancellation & Refunds ───────────────────────────────────────────

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel order
 *     description: Cancels an order and restores stock and refunds coins/payment. Only orders in placed, confirmed, or preparing status can be cancelled.
 *     tags: [User Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Order cannot be cancelled (invalid status)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
export {
  cancelOrder,
  requestRefund,
  getUserRefunds,
  getRefundDetails,
} from './orderCancelController';

// ─── Order Tracking ─────────────────────────────────────────────────────────
export { getOrderTracking } from './orderTrackingController';

// ─── Reorder ────────────────────────────────────────────────────────────────
export {
  reorderFullOrder,
  reorderItems,
  validateReorder,
  getFrequentlyOrdered,
  getReorderSuggestions,
} from './orderReorderController';
