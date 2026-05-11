import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { WebOrder, IWebOrder } from '../models/WebOrder';
import { logger } from '../config/logger';
import pushNotificationService from '../services/pushNotificationService';
import whatsappOrderingService from '../services/whatsappOrderingService';
import cashbackService from '../services/cashbackService';

// ─── Shared helpers ────────────────────────────────────────────────────────────

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
}

function sendErrorResponse(res: Response, statusCode: number, message: string, code: string): Response {
  return res.status(statusCode).json({ success: false, message, code } as ErrorResponse);
}

// ─── Valid order-status FSM (mirrors the route-level definition) ───────────────
// Keep this in sync with the constant in webOrderingRoutes.ts until the routes
// file is fully migrated.  Both reference the same logical state machine.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ['confirmed', 'cancelled'],
  paid: ['confirmed', 'preparing', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ─── Handler: GET /api/web-ordering/admin/orders ─────────────────────────────
// List all web orders across all stores. Admin-only. No Redis cache (fresh data).
// Query params:
//   limit      (default 50, max 100)
//   page       (default 1)
//   status     (optional, comma-separated: pending_payment,paid,confirmed,…)
//   from       (optional, ISO date string — inclusive lower bound on createdAt)
//   to         (optional, ISO date string — inclusive upper bound on createdAt)
//   storeSlug  (optional, filter to a single store)
export async function getAdminOrders(req: Request, res: Response): Promise<Response | void> {
  const limitRaw = parseInt((req.query.limit as string) || '50', 10);
  const limit = Math.min(isNaN(limitRaw) ? 50 : Math.max(1, limitRaw), 100);

  const pageRaw = parseInt((req.query.page as string) || '1', 10);
  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  const filter: Record<string, unknown> = {};

  // Status filter — comma-separated list
  if (req.query.status) {
    const statuses = (req.query.status as string)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length > 0) {
      filter.status = { $in: statuses };
    }
  }

  // Date range filter
  if (req.query.from || req.query.to) {
    const dateFilter: Record<string, Date> = {};
    if (req.query.from) {
      const fromDate = new Date(req.query.from as string);
      if (!isNaN(fromDate.getTime())) dateFilter.$gte = fromDate;
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to as string);
      if (!isNaN(toDate.getTime())) dateFilter.$lte = toDate;
    }
    if (Object.keys(dateFilter).length > 0) {
      filter.createdAt = dateFilter;
    }
  }

  // Store slug filter
  if (req.query.storeSlug) {
    filter.storeSlug = (req.query.storeSlug as string).trim().toLowerCase();
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    WebOrder.find(filter)
      .select(
        'orderNumber storeSlug storeName customerName customerPhone tableNumber items total paymentStatus status createdAt',
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WebOrder.countDocuments(filter),
  ]);

  const data = orders.map((o) => ({
    orderNumber: o.orderNumber,
    storeSlug: o.storeSlug,
    storeName: o.storeName,
    customerName: o.customerName ?? null,
    customerPhone: o.customerPhone,
    tableNumber: o.tableNumber ?? null,
    itemCount: Array.isArray(o.items) ? o.items.length : 0,
    total: o.total,
    paymentStatus: o.paymentStatus,
    status: o.status,
    createdAt: o.createdAt,
  }));

  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// ─── Handler: GET /api/web-ordering/admin/orders/:orderNumber ─────────────────
// Return the full order document for admin detail view.
export async function getAdminOrderDetail(req: Request, res: Response): Promise<Response | void> {
  const { orderNumber } = req.params;

  if (!orderNumber || typeof orderNumber !== 'string') {
    return res.status(400).json({ success: false, message: 'orderNumber is required', code: 'MISSING_ORDER_NUMBER' });
  }

  const order = await WebOrder.findOne({ orderNumber: orderNumber.trim() }).lean();

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
  }

  return res.json({ success: true, data: order });
}

// ─── Handler: POST /api/web-ordering/order/:orderNumber/update-status ─────────
// Allows kitchen/staff to push a status update. Validates the transition and
// emits a socket event so connected web clients get instant updates.
//
// Valid transitions:
//   confirmed → preparing → ready → completed (served)
//   Any state  → cancelled
export async function updateOrderStatus(req: Request, res: Response): Promise<Response | void> {
  const { orderNumber } = req.params;
  const { status } = req.body as { status: string };

  if (!orderNumber) return sendErrorResponse(res, 400, 'orderNumber is required', 'MISSING_FIELDS');
  if (!status || typeof status !== 'string') {
    return sendErrorResponse(res, 400, 'status is required', 'MISSING_FIELDS');
  }

  const order = await WebOrder.findOne({ orderNumber });
  if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    return sendErrorResponse(res, 422, `Cannot transition from "${order.status}" to "${status}"`, 'INVALID_TRANSITION');
  }

  order.status = status as IWebOrder['status'];
  await order.save();

  // Fire-and-forget push notification to customer on status change
  if ((order as any).userId) {
    const REZ_NOW_STATUS_MESSAGES: Record<string, string> = {
      confirmed: 'Order confirmed!',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready!',
      completed: 'Order completed. Enjoy!',
      cancelled: 'Order cancelled',
    };
    const statusTitle = REZ_NOW_STATUS_MESSAGES[status] ?? `Order ${status}`;
    pushNotificationService
      .sendPushToUser((order as any).userId.toString(), {
        title: statusTitle,
        body: `Your order from ${(order as any).storeName || 'the store'} is ${status}`,
        data: {
          type: 'order_status',
          orderNumber,
          status,
          url: `https://now.rez.money/${(order as any).storeSlug}/order/${orderNumber}`,
        },
        channelId: 'orders',
        sound: 'default',
        priority: 'high',
      })
      .catch((err: Error) =>
        logger.warn('[Push] Failed to send order status push:', { orderNumber, status, error: err.message }),
      );
  }

  // Award cashback coins when web order is completed — mirrors mobile app order cashback
  if (status === 'completed' && (order as any).userId) {
    setImmediate(async () => {
      try {
        const webOrderForCashback = order.toObject() as any;
        const orderAmount: number = webOrderForCashback.total ?? webOrderForCashback.subtotal ?? 0;
        const categories: string[] = (webOrderForCashback.items || []).map((i: any) => i.category || 'food');
        const userId = new mongoose.Types.ObjectId(String(webOrderForCashback.userId));
        const storeId = webOrderForCashback.storeId
          ? new mongoose.Types.ObjectId(String(webOrderForCashback.storeId))
          : undefined;

        const cashbackResult = await cashbackService.calculateOrderCashback(orderAmount, categories, userId, storeId);

        if (cashbackResult.amount > 0) {
          await cashbackService.createCashback({
            userId,
            orderId: webOrderForCashback._id,
            amount: cashbackResult.amount,
            cashbackRate: cashbackResult.rate,
            source: 'order',
            description: cashbackResult.description,
            metadata: {
              orderAmount,
              productCategories: categories,
              storeId,
              storeName: webOrderForCashback.storeName,
            },
            holdHours: 0, // Web order already completed — credit immediately
          } as any);
          logger.info('[WEB_ORDER] Cashback processed', { orderNumber, userId, amount: cashbackResult.amount });
        }
      } catch (cashbackErr) {
        logger.warn('[WEB_ORDER] Cashback processing failed (non-fatal):', {
          orderNumber,
          error: cashbackErr instanceof Error ? cashbackErr.message : String(cashbackErr),
        });
      }
    });
  }

  // Emit socket event so the web menu client gets an instant update
  // Also notify the merchant room for real-time dashboard updates
  setImmediate(async () => {
    try {
      const io = req.app.get('io');
      if (io) {
        // Broadcast to all listeners on this order (web client polls by orderNumber room)
        io.emit('web-order:status-update', {
          orderNumber,
          status,
          storeId: order.storeId?.toString(),
          updatedAt: new Date().toISOString(),
        });
        // Also notify merchant room
        if (order.storeId) {
          const statusStore = await Store.findById(order.storeId).select('merchantId').lean();
          const merchantRoomId = (statusStore as any)?.merchantId;
          if (merchantRoomId) {
            io.to(`merchant-${merchantRoomId}`).emit('web-order:status-update', {
              orderNumber,
              status,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (socketErr) {
      // Non-critical — socket may not be available in all environments
      logger.warn(
        '[ORDER STATUS] Socket emit failed (non-critical):',
        socketErr instanceof Error ? socketErr.message : String(socketErr),
      );
    }
  });

  logger.info(`[ORDER STATUS] ${orderNumber} → ${status}`);

  // WhatsApp notification to customer when order is ready for pickup
  if (status === 'ready' && (order as any).customerPhone) {
    setImmediate(async () => {
      try {
        const msg =
          `✅ *Your order is ready!*\n\n` +
          `Order #${orderNumber} is ready for pickup at ${(order as any).storeName || 'the store'}.\n` +
          `Please collect it from the counter.`;
        await whatsappOrderingService.sendMessage((order as any).customerPhone, msg);
        logger.info(`[ORDER STATUS] WhatsApp 'ready' notification sent for ${orderNumber}`);
      } catch (err) {
        logger.warn(`[ORDER STATUS] WhatsApp notification failed for ${orderNumber}:`, err);
      }
    });
  }

  return res.json({
    success: true,
    message: `Order status updated to "${status}"`,
    data: { orderNumber, status, updatedAt: order.updatedAt },
  });
}
