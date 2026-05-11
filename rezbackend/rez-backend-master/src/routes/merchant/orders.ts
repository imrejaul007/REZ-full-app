// @ts-nocheck
import { Router } from 'express';
import {
  getMerchantOrders,
  getMerchantOrderById,
  getMerchantOrderAnalytics,
  bulkOrderAction,
  refundOrder,
  updateMerchantOrderStatus,
} from '../../controllers/merchant/orderController';
import { authMiddleware as authenticateMerchant } from '../../middleware/merchantauth';
import { validate, validateParams, validateQuery, commonSchemas } from '../../middleware/validation';
import { Joi } from '../../middleware/validation';

const router = Router();

// All merchant order routes require authentication
router.use(authenticateMerchant);

// Enhanced GET /api/merchant/orders - List merchant orders with advanced filters
router.get(
  '/',
  validateQuery(
    Joi.object({
      // Status filter
      status: Joi.string().valid(
        'placed',
        'confirmed',
        'preparing',
        'ready',
        'dispatched',
        'delivered',
        'cancelled',
        'returned',
        'refunded',
      ),
      // Payment status filter
      paymentStatus: Joi.string().valid('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'),
      // Date range filter
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      // Search filter (orderNumber, customer name, email)
      search: Joi.string().trim().max(100),
      // Booking source filter (e.g., 'rendez' for Rendez-sourced bookings)
      source: Joi.string().valid('app', 'web', 'social', 'referral', 'rendez'),
      // Store filter (for multi-store merchants)
      storeId: commonSchemas.objectId(),
      // Sorting
      // priority: sorts by the Order.priority field ('urgent' > 'high' > 'normal' > 'low').
      // This is a stored enum field on Order — merchants can set it via the KDS or order management UI.
      // See Order model schema (priority: { enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }).
      sortBy: Joi.string()
        .valid('created', 'updated', 'total', 'priority', 'createdAt', 'status', 'orderNumber')
        .default('createdAt'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      // Pagination
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  ),
  getMerchantOrders,
);

// GET /api/merchant/orders/analytics - Get order analytics
router.get(
  '/analytics',
  validateQuery(
    Joi.object({
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')),
      storeId: commonSchemas.objectId(),
      interval: Joi.string().valid('day', 'week', 'month').default('day'),
    }),
  ),
  getMerchantOrderAnalytics,
);

// GET /api/merchant/orders/:id - Get single order by ID
router.get(
  '/:id',
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  getMerchantOrderById,
);

// PUT /api/merchant/orders/:id/status - Update single order status
router.put(
  '/:id/status',
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      status: Joi.string()
        .valid('confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled')
        .required(),
      notes: Joi.string().trim().max(500).optional(),
      notifyCustomer: Joi.boolean().default(true),
    }),
  ),
  updateMerchantOrderStatus,
);

// POST /api/merchant/orders/sample-data - Create sample orders for testing
router.post('/sample-data', async (req, res) => {
  try {
    const MerchantOrder = require('../../models/MerchantOrder').default;
    const storeId = req.body.storeId || (req as any).merchantId;
    const orders = await MerchantOrder.createSampleOrders(storeId);
    res.json({ success: true, data: orders, message: 'Sample orders created' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/merchant/orders/bulk-action - Bulk order operations
router.post(
  '/bulk-action',
  validate(
    Joi.object({
      action: Joi.string().valid('confirm', 'prepare', 'ready', 'deliver', 'cancel', 'mark-shipped').required(),
      orderIds: Joi.array().items(commonSchemas.objectId()).min(1).max(50).required(),
      reason: Joi.string().trim().max(500).when('action', {
        is: 'cancel',
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      trackingInfo: Joi.object({
        trackingId: Joi.string().trim(),
        deliveryPartner: Joi.string().trim(),
        estimatedTime: Joi.date().iso(),
      }).when('action', {
        is: 'mark-shipped',
        then: Joi.optional(),
        otherwise: Joi.forbidden(),
      }),
    }),
  ),
  bulkOrderAction,
);

// POST /api/merchant/orders/:id/refund - Process order refund
router.post(
  '/:id/refund',
  validateParams(
    Joi.object({
      id: commonSchemas.objectId().required(),
    }),
  ),
  validate(
    Joi.object({
      amount: Joi.number().min(0).required(),
      reason: Joi.string().trim().min(10).max(500).required(),
      refundItems: Joi.array()
        .items(
          Joi.object({
            itemId: commonSchemas.objectId().required(),
            quantity: Joi.number().integer().min(1).required(),
          }),
        )
        .optional(),
      notifyCustomer: Joi.boolean().default(true),
    }),
  ),
  refundOrder,
);

// PUT /api/merchant/orders/:orderId/items/:itemId/status - Update item status (Kitchen Display System)
router.put(
  '/:orderId/items/:itemId/status',
  validateParams(
    Joi.object({
      orderId: commonSchemas.objectId().required(),
      itemId: Joi.string().trim().required(),
    }),
  ),
  validate(
    Joi.object({
      status: Joi.string().valid('pending', 'preparing', 'ready').required(),
      notes: Joi.string().trim().max(500).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { orderId, itemId } = req.params;
      const { status, notes } = req.body;

      // Import Order model
      const { Order } = require('../../models/Order');
      const { logger } = require('../../config/logger');
      const { getIO } = require('../../config/socket');

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Verify merchant owns this order
      if (order.store.toString() !== (req as any).merchantId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }

      // Find the item in the order
      const item = order.items.find((i: any) => i._id.toString() === itemId);
      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found in order' });
      }

      // Update the item status (store in a kitchen-specific field if not on the item itself)
      // For now, we'll assume a kitchenItemStatus field or create one
      if (!order.kitchenItemStatus) {
        order.kitchenItemStatus = {};
      }
      order.kitchenItemStatus[itemId] = {
        status,
        updatedAt: new Date(),
        updatedBy: (req as any).merchantId,
      };

      // Save the order
      await order.save();

      // Emit Socket.IO event to notify kitchen displays
      try {
        const io = getIO();
        io.of('/kds').to(`kds:${order.store}`).emit('order:item_status_updated', {
          orderId,
          itemId,
          status,
          timestamp: new Date().toISOString(),
        });

        logger.info('[KDS] Item status updated via API', {
          orderId,
          itemId,
          status,
          merchantId: (req as any).merchantId,
        });
      } catch (socketError) {
        logger.warn('[KDS] Failed to emit Socket.IO event:', socketError);
        // Don't fail the API response if Socket.IO emit fails
      }

      res.json({
        success: true,
        message: 'Item status updated',
        data: {
          orderId,
          itemId,
          status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      const { logger } = require('../../config/logger');
      logger.error('[KDS] Error updating item status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update item status',
      });
    }
  },
);

export default router;
