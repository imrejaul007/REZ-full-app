// @ts-nocheck
import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderCounts,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getOrderTracking,
  rateOrder,
  getOrderStats,
  reorderFullOrder,
  reorderItems,
  validateReorder,
  getFrequentlyOrdered,
  getReorderSuggestions,
  requestRefund,
  getUserRefunds,
  getRefundDetails,
  getOrderFinancialDetails,
} from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, validateParams, validateQuery, orderSchemas, commonSchemas } from '../middleware/validation';
import { generalLimiter, orderCreateLimiter } from '../middleware/rateLimiter';
import { Joi } from '../middleware/validation';
// OG-001 FIX: Apply idempotency middleware to POST /orders so duplicate requests
// fired on reconnect, double-tap, or network retry are safely de-duplicated.
import { idempotencyMiddleware } from '../middleware/idempotency';
import { asyncHandler } from '../utils/asyncHandler';
import { Order } from '../models/Order';
// Week-3 cutover: shadow-validate POST /orders against the canonical
// `@rez/shared` CreateOrderSchema. Mode is gated by
// SHARED_TYPES_VALIDATION_MODE (off | shadow | enforce); default off keeps
// production untouched until we flip the env flag. See MIGRATION.md §5.
import { validateWithSharedTypes } from '../middleware/sharedTypesValidator';
import { CreateOrderSchema, UpdateOrderStatusSchema } from '../@rez/shared-types';

const router = Router();
// globalLimiter applied here covers every route below — the per-route
// "// generalLimiter, // Disabled for development" comments are redundant
// vestiges of an earlier approach and can be safely ignored.
router.use(generalLimiter);

// All order routes require authentication
router.use(authenticate);

// Get user's order statistics
router.get(
  '/stats',

  getOrderStats,
);

// Get reorder suggestions
router.get(
  '/reorder/suggestions',

  getReorderSuggestions,
);

// Get frequently ordered items
router.get(
  '/reorder/frequently-ordered',

  validateQuery(
    Joi.object({
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  ),
  getFrequentlyOrdered,
);

// Get order counts (lightweight, for header display)
router.get(
  '/counts',

  getOrderCounts,
);

// Get user's orders (supports server-side search, filter, sort)
router.get(
  '/',

  validateQuery(
    Joi.object({
      status: Joi.string().valid(
        'all',
        'placed',
        'confirmed',
        'preparing',
        'ready',
        'dispatched',
        'out_for_delivery',
        'delivered',
        'cancelling',
        'cancelled',
        'returned',
        'refunded',
      ),
      statusGroup: Joi.string().valid('active', 'past').optional(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20),
      cursor: Joi.string().optional(),
      search: Joi.string().trim().max(100).allow('').optional(),
      dateFrom: Joi.date().iso().optional(),
      dateTo: Joi.date().iso().optional(),
      // total_asc / total_desc are frontend aliases for amount_low / amount_high.
      // Both forms are accepted to avoid breaking existing clients.
      sort: Joi.string()
        .valid('newest', 'oldest', 'amount_high', 'amount_low', 'total_desc', 'total_asc')
        .default('newest'),
    }),
  ),
  getUserOrders,
);

// Create new order
// OG-001 FIX: idempotencyMiddleware de-duplicates retries that arrive with the
// same Idempotency-Key header (sent by ordersApi.createOrder on the client).
router.post(
  '/',

  orderCreateLimiter, // Sprint 3: 20 orders per user per 10 min
  idempotencyMiddleware(),
  validate(orderSchemas.createOrder),
  // Week-3: shadow-validate against canonical schema. No-op unless
  // SHARED_TYPES_VALIDATION_MODE is set. Runs AFTER joi so we only
  // see drift between the two contracts (the joi pass is authoritative
  // until enforce mode flips on).
  validateWithSharedTypes(CreateOrderSchema, 'POST /api/orders'),
  createOrder,
);

// Internal: cancel orders stuck in payment_pending for >15 minutes.
// Called by the consumer app on launch or by a scheduled cron job to clean up
// orders left in an indeterminate state by a crash / network drop.
router.post(
  '/cleanup-pending',
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id ?? (req as any).user?._id?.toString();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const result = await Order.updateMany(
      {
        user: userId,
        'payment.status': 'payment_pending',
        createdAt: { $lt: fifteenMinutesAgo },
      },
      { $set: { 'payment.status': 'failed', status: 'cancelled' } },
    );

    res.json({ success: true, data: { cancelledCount: result.modifiedCount } });
  }),
);

// IMPORTANT: Static routes must come BEFORE parameterized routes
// Get user's refund history (moved here from below to prevent /:orderId from catching '/refunds')
router.get(
  '/refunds',
  validateQuery(
    Joi.object({
      status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled'),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  ),
  getUserRefunds,
);

// Get refund details (moved here from below)
router.get(
  '/refunds/:refundId',
  validateParams(
    Joi.object({
      refundId: commonSchemas.objectId().required(),
    }),
  ),
  getRefundDetails,
);

// SSE Order Status Stream
// GET /api/orders/live/:orderId — pushes real-time status updates to the client
// via Server-Sent Events.  Polls MongoDB every 3 s and emits an event whenever
// order.status changes.  Closes automatically on terminal statuses
// (delivered / cancelled) or when the client disconnects.
router.get(
  '/live/:orderId',
  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  async (req, res) => {
    const { orderId } = req.params;
    const userId = (req as any).user?.id ?? (req as any).user?._id?.toString();

    // Validate orderId format before querying
    const { Types } = await import('mongoose');
    if (!Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid orderId' });
    }

    // Fetch order and verify ownership
    const { Order } = await import('../models/Order');
    const order = await Order.findById(orderId).lean();
    if (!order || String((order as any).user) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const TERMINAL_STATUSES: ReadonlySet<string> = new Set(['delivered', 'cancelled']);

    // Establish SSE connection
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ status: (order as any).status, updatedAt: (order as any).updatedAt })}\n\n`);

    // If already terminal, close immediately
    if (TERMINAL_STATUSES.has((order as any).status)) {
      res.end();
      return;
    }

    let lastStatus: string = (order as any).status;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function cleanup() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    intervalId = setInterval(async () => {
      try {
        const fresh = await Order.findById(orderId).lean();
        if (!fresh) {
          cleanup();
          res.end();
          return;
        }

        const currentStatus: string = (fresh as any).status;
        if (currentStatus !== lastStatus) {
          lastStatus = currentStatus;
          res.write(`data: ${JSON.stringify({ status: currentStatus, updatedAt: (fresh as any).updatedAt })}\n\n`);
        }

        if (TERMINAL_STATUSES.has(currentStatus)) {
          cleanup();
          res.end();
        }
      } catch (_err) {
        cleanup();
        res.end();
      }
    }, 3000);

    req.on('close', () => {
      cleanup();
    });
  },
);

// Get single order by ID
// SECURITY: IDOR guard enforced in controller — verifies order belongs to authenticated user
router.get(
  '/:orderId',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  getOrderById,
);

// Get order financial details (ledger trail, coin transactions, refunds)
router.get(
  '/:orderId/financial',
  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  getOrderFinancialDetails,
);

// Cancel order
router.patch(
  '/:orderId/cancel',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      reason: Joi.string().trim().max(500),
    }),
  ),
  cancelOrder,
);

// Get order tracking
router.get(
  '/:orderId/tracking',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  getOrderTracking,
);

// Rate and review order
router.post(
  '/:orderId/rate',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      rating: Joi.number().integer().min(1).max(5).required(),
      review: Joi.string().trim().max(1000),
    }),
  ),
  rateOrder,
);

// Validate reorder (check availability and prices)
router.get(
  '/:orderId/reorder/validate',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  validateQuery(
    Joi.object({
      itemIds: Joi.alternatives().try(Joi.array().items(commonSchemas.objectId()), commonSchemas.objectId()),
    }),
  ),
  validateReorder,
);

// Re-order full order
router.post(
  '/:orderId/reorder',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  reorderFullOrder,
);

// Re-order selected items
router.post(
  '/:orderId/reorder/items',

  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      itemIds: Joi.array().items(commonSchemas.objectId()).min(1).required(),
    }),
  ),
  reorderItems,
);

// Refund routes
// Request refund for an order
router.post(
  '/:orderId/refund-request',
  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      reason: Joi.string().trim().min(10).max(500).required(),
      refundItems: Joi.array()
        .items(
          Joi.object({
            itemId: commonSchemas.objectId().required(),
            quantity: Joi.number().integer().min(1).required(),
          }),
        )
        .optional(),
    }),
  ),
  requestRefund,
);

// Note: /refunds and /refunds/:refundId routes are defined above /:orderId to prevent route conflicts

// Admin/Store Owner Routes
// Update order status
router.patch(
  '/:orderId/status',

  requireAdmin,
  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      status: Joi.string()
        .valid(
          'placed',
          'confirmed',
          'preparing',
          'ready',
          'dispatched',
          'out_for_delivery',
          'delivered',
          'cancelling',
          'cancelled',
          'returned',
          'refunded',
        )
        .required(),
      estimatedDeliveryTime: Joi.date().iso(),
      trackingInfo: Joi.object({
        trackingNumber: Joi.string().trim(),
        carrier: Joi.string().trim(),
        estimatedDelivery: Joi.date().iso(),
        location: Joi.string().trim(),
        notes: Joi.string().trim().max(500),
      }),
    }),
  ),
  // Week-3 shadow validation against canonical UpdateOrderStatusSchema.
  // Joi passes estimatedDelivery/location/notes but canonical is .strict() — strip extras.
  validateWithSharedTypes(UpdateOrderStatusSchema, 'PATCH /api/orders/:orderId/status', {
    bodyShaper: (req) => ({
      status: req.body.status,
      reason: req.body.reason,
      metadata: req.body.metadata,
    }),
  }),
  updateOrderStatus,
);

export default router;
