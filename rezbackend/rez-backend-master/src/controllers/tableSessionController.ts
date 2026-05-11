import { Request, Response } from 'express';
import * as crypto from 'crypto';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendNotFound, sendBadRequest } from '../utils/response';
import TableSession from '../models/TableSession';
import { Store } from '../models/Store';
import { logger } from '../config/logger';
import { tableBillSnapshotService } from '../services/tableBillSnapshotService';

/**
 * POST /api/table-sessions/open
 * Opens a new table session or joins an existing one.
 */
export const openOrJoinTableSession = asyncHandler(async (req: Request, res: Response) => {
  const { storeId, tableNumber, guestCount = 1 } = req.body;
  const userId = req.user?._id?.toString() || req.userId;

  if (!storeId || !tableNumber) {
    return sendBadRequest(res, 'storeId and tableNumber are required');
  }

  // Check for existing open session on this table
  const existing = await TableSession.findOne({
    storeId,
    tableNumber,
    status: 'open',
  });

  if (existing) {
    return sendSuccess(
      res,
      {
        sessionId: existing._id,
        sessionToken: existing.sessionToken,
        tableNumber: existing.tableNumber,
        status: existing.status,
        ordersCount: existing.orders?.length || 0,
        currentTotal: existing.total || existing.totalAmount,
        isNew: false,
      },
      'Joined existing table session',
    );
  }

  const store = await Store.findById(storeId).select('merchant name').lean();
  if (!store) return sendNotFound(res, 'Store not found');

  const tokenSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const sessionToken = `${tableNumber.replace(/\s+/g, '')}-${tokenSuffix}`;

  const session = await TableSession.create({
    storeId,
    // store.merchantId is the typed field; legacy code selected 'merchant' but IStore uses merchantId
    merchantId: store.merchantId,
    tableNumber,
    guestCount,
    userId,
    sessionToken,
    status: 'open',
  });

  // Seed Redis snapshot for new session
  try {
    await tableBillSnapshotService.updateSnapshot((session._id as any).toString(), {
      sessionId: (session._id as any).toString(),
      tableNumber: session.tableNumber,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    });
  } catch (snapErr) {
    logger.warn('[TableSession] Snapshot seed failed (non-blocking)', snapErr);
  }

  return sendSuccess(
    res,
    {
      sessionId: session._id,
      sessionToken: session.sessionToken,
      tableNumber: session.tableNumber,
      status: session.status,
      ordersCount: 0,
      currentTotal: 0,
      isNew: true,
    },
    'Table session opened',
  );
});

/**
 * GET /api/table-sessions/:sessionToken
 * Get session details with all orders and running total.
 */
export const getTableSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken } = req.params;

  const session = await TableSession.findOne({ sessionToken })
    .populate({
      path: 'orders',
      select: 'status items subtotal total createdAt specialInstructions orderNumber',
    })
    .lean();

  if (!session) return sendNotFound(res, 'Session not found or expired');

  return sendSuccess(res, session);
});

/**
 * POST /api/table-sessions/:sessionToken/add-order
 * Links a placed order to the table session.
 */
export const addOrderToSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken } = req.params;
  const { orderId } = req.body;

  if (!orderId) return sendBadRequest(res, 'orderId is required');

  const session = await TableSession.findOne({ sessionToken, status: 'open' });
  if (!session) return sendNotFound(res, 'Session not found or already closed');

  const { Order } = await import('../models/Order');
  const order = await Order.findById(orderId).select('subtotal total').lean();
  if (!order) return sendNotFound(res, 'Order not found');

  session.orders = session.orders || [];
  session.orders.push(new mongoose.Types.ObjectId(orderId));
  session.subtotal = (session.subtotal || 0) + ((order as any).subtotal || (order as any).total || 0);
  session.total = (session.total || 0) + ((order as any).total || 0);
  await session.save();

  // Update Redis snapshot with new totals (non-blocking)
  try {
    await tableBillSnapshotService.updateSnapshot((session._id as any).toString(), {
      sessionId: (session._id as any).toString(),
      tableNumber: session.tableNumber,
      items: [],
      subtotal: session.subtotal || 0,
      tax: 0,
      total: session.total || 0,
    });
  } catch (snapErr) {
    logger.warn('[TableSession] Snapshot update failed after addOrder (non-blocking)', snapErr);
  }

  return sendSuccess(
    res,
    {
      sessionToken,
      ordersCount: (session.orders || []).length,
      currentTotal: session.total || 0,
    },
    'Order added to table session',
  );
});

/**
 * POST /api/table-sessions/:sessionToken/request-bill
 * Customer requests the bill — session moves to 'bill_requested'.
 */
export const requestBill = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken } = req.params;

  const session = await TableSession.findOne({ sessionToken, status: 'open' })
    .populate('orders', 'subtotal total status')
    .lean();

  if (!session) return sendNotFound(res, 'Active session not found');

  // Recalculate total from non-cancelled orders
  let recalcTotal = 0;
  for (const order of session.orders || []) {
    if ((order as any).status !== 'cancelled') {
      recalcTotal += (order as any).total || 0;
    }
  }

  await TableSession.findByIdAndUpdate(session._id, {
    $set: { status: 'bill_requested', total: recalcTotal },
  });

  // Notify merchant
  try {
    const merchantNotificationService = (await import('../services/merchantNotificationService')).default;
    await merchantNotificationService.notifyBillRequest({
      merchantId: session.merchantId?.toString(),
      tableNumber: String(session.tableNumber),
      total: recalcTotal,
      ordersCount: (session.orders || []).length,
    });
  } catch (err) {
    logger.warn('[TABLE SESSION] Bill request notification failed:', err);
  }

  // Update snapshot to reflect bill_requested status and final total (non-blocking)
  try {
    await tableBillSnapshotService.updateSnapshot(session._id.toString(), {
      sessionId: session._id.toString(),
      tableNumber: session.tableNumber,
      items: [],
      subtotal: recalcTotal,
      tax: 0,
      total: recalcTotal,
    });
  } catch (snapErr) {
    logger.warn('[TableSession] Snapshot update failed after requestBill (non-blocking)', snapErr);
  }

  return sendSuccess(
    res,
    {
      sessionToken,
      tableNumber: session.tableNumber,
      total: recalcTotal,
      ordersCount: (session.orders || []).length,
      status: 'bill_requested',
    },
    'Bill requested — merchant notified',
  );
});

/**
 * POST /api/table-sessions/:sessionToken/pay
 * Customer pays the full session bill.
 */
export const payTableSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken } = req.params;
  const { paymentMethod, paymentId } = req.body;

  const session = await TableSession.findOne({
    sessionToken,
    status: { $in: ['open', 'bill_requested'] },
  });

  if (!session) return sendNotFound(res, 'Session not found or already paid');

  session.status = 'paid';
  session.paymentId = paymentId;
  session.paymentMethod = paymentMethod || 'cash';
  session.paidAt = new Date();
  session.closedAt = new Date();
  await session.save();

  // Mark all session orders as delivered
  const { Order } = await import('../models/Order');
  await Order.updateMany({ _id: { $in: session.orders } }, { $set: { status: 'delivered' } });

  // v3: Non-blocking reward issuance via merchantRewardService (TABLE_PAID flow)
  const sessionUserId = session.userId?.toString();
  const sessionMerchantId = session.merchantId?.toString();
  const sessionStoreId = session.storeId?.toString();
  const sessionTotal = session.totalAmount || session.total || 0;

  if (sessionUserId && sessionMerchantId && sessionStoreId) {
    import('../merchantservices/merchantRewardService')
      .then(({ merchantRewardService }) => {
        merchantRewardService
          .processReward({
            sessionId: `table-session:${session._id}`,
            merchantId: sessionMerchantId,
            storeId: sessionStoreId,
            userId: sessionUserId,
            eventType: 'table_pay',
            amount: sessionTotal,
            paymentMethod: paymentMethod || 'cash',
          })
          .catch((err: any) => logger.warn('[TableSession] Non-blocking reward failed', err));
      })
      .catch((err: any) => logger.warn('[TableSession] merchantRewardService import failed', err));
  }

  // Clean up Redis snapshot — session is closed
  try {
    await tableBillSnapshotService.deleteSnapshot((session._id as any).toString());
  } catch (snapErr) {
    logger.warn('[TableSession] Snapshot delete failed after pay (non-blocking)', snapErr);
  }

  return sendSuccess(
    res,
    {
      sessionToken,
      tableNumber: session.tableNumber,
      total: session.total || session.totalAmount,
      status: 'paid',
      paidAt: session.paidAt,
    },
    'Payment successful — thank you!',
  );
});
