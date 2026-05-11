"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderService_1 = require("../services/orderService");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Helper function to create API response
function createResponse(success, data, error) {
    return {
        success,
        data,
        error,
        timestamp: new Date().toISOString()
    };
}
// Error handling middleware
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// ==================== ORDER ROUTES ====================
/**
 * @route POST /api/pos/orders
 * @desc Create a new order
 */
router.post('/orders', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.createOrder(request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'CREATE_ORDER_FAILED', message: result.error || 'Failed to create order' }));
        return;
    }
    logger_1.logger.info(`Order created: ${result.order?.orderNumber}`);
    res.status(201).json(createResponse(true, result.order));
}));
/**
 * @route GET /api/pos/orders
 * @desc Get all active orders or orders by status
 */
router.get('/orders', asyncHandler(async (req, res) => {
    const status = req.query.status;
    let orders;
    if (status) {
        orders = await orderService_1.orderService.getOrdersByStatus(status);
    }
    else {
        orders = await orderService_1.orderService.getActiveOrders();
    }
    res.json(createResponse(true, orders));
}));
/**
 * @route GET /api/pos/orders/daily
 * @desc Get orders for a specific date
 */
router.get('/orders/daily', asyncHandler(async (req, res) => {
    const dateParam = req.query.date;
    const date = dateParam ? new Date(dateParam) : new Date();
    const orders = await orderService_1.orderService.getDailyOrders(date);
    res.json(createResponse(true, orders));
}));
/**
 * @route GET /api/pos/orders/:id
 * @desc Get order by ID
 */
router.get('/orders/:id', asyncHandler(async (req, res) => {
    const order = await orderService_1.orderService.getOrder(req.params.id);
    if (!order) {
        res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: 'Order not found' }));
        return;
    }
    res.json(createResponse(true, order));
}));
/**
 * @route GET /api/pos/orders/number/:orderNumber
 * @desc Get order by order number
 */
router.get('/orders/number/:orderNumber', asyncHandler(async (req, res) => {
    const order = await orderService_1.orderService.getOrderByNumber(req.params.orderNumber);
    if (!order) {
        res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: 'Order not found' }));
        return;
    }
    res.json(createResponse(true, order));
}));
/**
 * @route PUT /api/pos/orders/:id/status
 * @desc Update order status
 */
router.put('/orders/:id/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await orderService_1.orderService.updateOrderStatus(req.params.id, status);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'UPDATE_STATUS_FAILED', message: result.error || 'Failed to update status' }));
        return;
    }
    logger_1.logger.info(`Order ${result.order?.orderNumber} status updated to ${status}`);
    res.json(createResponse(true, result.order));
}));
/**
 * @route POST /api/pos/orders/:id/confirm
 * @desc Confirm an order
 */
router.post('/orders/:id/confirm', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.confirmOrder(req.params.id);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'CONFIRM_FAILED', message: result.error || 'Failed to confirm order' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
/**
 * @route POST /api/pos/orders/:id/start-preparing
 * @desc Start preparing an order
 */
router.post('/orders/:id/start-preparing', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.startPreparing(req.params.id);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'PREPARE_FAILED', message: result.error || 'Failed to start preparing' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
/**
 * @route POST /api/pos/orders/:id/ready
 * @desc Mark order as ready
 */
router.post('/orders/:id/ready', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.markReady(req.params.id);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'READY_FAILED', message: result.error || 'Failed to mark as ready' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
/**
 * @route POST /api/pos/orders/:id/served
 * @desc Mark order as served
 */
router.post('/orders/:id/served', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.markServed(req.params.id);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'SERVED_FAILED', message: result.error || 'Failed to mark as served' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
// ==================== ORDER ITEM ROUTES ====================
/**
 * @route POST /api/pos/orders/:id/items
 * @desc Add item to order
 */
router.post('/orders/:id/items', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.addItem(req.params.id, request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'ADD_ITEM_FAILED', message: result.error || 'Failed to add item' }));
        return;
    }
    logger_1.logger.info(`Item added to order ${result.order?.orderNumber}`);
    res.json(createResponse(true, result.order));
}));
/**
 * @route PUT /api/pos/orders/:id/items/:itemId
 * @desc Update item quantity
 */
router.put('/orders/:id/items/:itemId', asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const result = await orderService_1.orderService.updateItemQuantity(req.params.id, req.params.itemId, quantity);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'UPDATE_ITEM_FAILED', message: result.error || 'Failed to update item' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
/**
 * @route DELETE /api/pos/orders/:id/items/:itemId
 * @desc Remove item from order
 */
router.delete('/orders/:id/items/:itemId', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.removeItem(req.params.id, req.params.itemId);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'REMOVE_ITEM_FAILED', message: result.error || 'Failed to remove item' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
// ==================== DISCOUNT ROUTES ====================
/**
 * @route POST /api/pos/orders/:id/discount
 * @desc Apply discount to order
 */
router.post('/orders/:id/discount', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.applyDiscount(req.params.id, request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'APPLY_DISCOUNT_FAILED', message: result.error || 'Failed to apply discount' }));
        return;
    }
    logger_1.logger.info(`Discount applied to order ${result.order?.orderNumber}`);
    res.json(createResponse(true, result.order));
}));
/**
 * @route DELETE /api/pos/orders/:id/discount
 * @desc Remove discount from order
 */
router.delete('/orders/:id/discount', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.removeDiscount(req.params.id);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'REMOVE_DISCOUNT_FAILED', message: result.error || 'Failed to remove discount' }));
        return;
    }
    res.json(createResponse(true, result.order));
}));
// ==================== BILLING ROUTES ====================
/**
 * @route GET /api/pos/orders/:id/bill
 * @desc Get bill calculation for order
 */
router.get('/orders/:id/bill', asyncHandler(async (req, res) => {
    const tip = parseFloat(req.query.tip) || 0;
    const result = await orderService_1.orderService.getBillCalculation(req.params.id, tip);
    if (!result.success) {
        res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: result.error || 'Order not found' }));
        return;
    }
    res.json(createResponse(true, result.bill));
}));
/**
 * @route GET /api/pos/orders/:id/tips
 * @desc Get tip suggestions
 */
router.get('/orders/:id/tips', asyncHandler(async (req, res) => {
    const result = await orderService_1.orderService.getTipSuggestions(req.params.id);
    if (!result.success) {
        res.status(404).json(createResponse(false, undefined, { code: 'ORDER_NOT_FOUND', message: result.error || 'Order not found' }));
        return;
    }
    res.json(createResponse(true, result.suggestions));
}));
/**
 * @route POST /api/pos/orders/:id/split
 * @desc Split bill
 */
router.post('/orders/:id/split', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.splitBill(req.params.id, request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'SPLIT_FAILED', message: result.error || 'Failed to split bill' }));
        return;
    }
    res.json(createResponse(true, {
        splits: result.splits,
        perPersonAmount: result.perPersonAmount
    }));
}));
// ==================== PAYMENT ROUTES ====================
/**
 * @route POST /api/pos/orders/:id/payment
 * @desc Process payment for order
 */
router.post('/orders/:id/payment', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.processPayment(req.params.id, request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'PAYMENT_FAILED', message: result.error || 'Failed to process payment' }));
        return;
    }
    logger_1.logger.info(`Payment processed for order: ${result.order?.orderNumber}, Amount: $${result.payment?.amount}`);
    res.json(createResponse(true, {
        payment: result.payment,
        change: result.change,
        order: result.order
    }));
}));
/**
 * @route POST /api/pos/orders/:id/refund
 * @desc Refund payment
 */
router.post('/orders/:id/refund', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.refundPayment(req.params.id, request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'REFUND_FAILED', message: result.error || 'Failed to process refund' }));
        return;
    }
    logger_1.logger.info(`Refund processed for order: ${result.order?.orderNumber}, Amount: $${result.refundAmount}`);
    res.json(createResponse(true, {
        refundAmount: result.refundAmount,
        remainingBalance: result.remainingBalance,
        order: result.order
    }));
}));
// ==================== RECEIPT ROUTES ====================
/**
 * @route POST /api/pos/orders/:id/receipt
 * @desc Print receipt
 */
router.post('/orders/:id/receipt', asyncHandler(async (req, res) => {
    const { tip, splitId } = req.body;
    const result = await orderService_1.orderService.printReceipt(req.params.id, tip || 0, splitId);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'RECEIPT_FAILED', message: result.error || 'Failed to generate receipt' }));
        return;
    }
    logger_1.logger.info(`Receipt generated for order: ${result.receipt?.orderId}`);
    res.json(createResponse(true, result.receipt));
}));
// ==================== VOID ROUTES ====================
/**
 * @route POST /api/pos/orders/:id/void
 * @desc Void an order
 */
router.post('/orders/:id/void', asyncHandler(async (req, res) => {
    const request = req.body;
    const result = await orderService_1.orderService.voidOrder(req.params.id, request);
    if (!result.success) {
        res.status(400).json(createResponse(false, undefined, { code: 'VOID_FAILED', message: result.error || 'Failed to void order' }));
        return;
    }
    logger_1.logger.warn(`Order voided: ${result.order?.orderNumber}, Reason: ${request.reason}`);
    res.json(createResponse(true, result.order));
}));
// ==================== MENU ROUTES ====================
/**
 * @route GET /api/pos/menu
 * @desc Get all menu items
 */
router.get('/menu', asyncHandler(async (req, res) => {
    const items = await orderService_1.orderService.getMenuItems();
    res.json(createResponse(true, items));
}));
/**
 * @route GET /api/pos/menu/:id
 * @desc Get menu item by ID
 */
router.get('/menu/:id', asyncHandler(async (req, res) => {
    const item = await orderService_1.orderService.getMenuItem(req.params.id);
    if (!item) {
        res.status(404).json(createResponse(false, undefined, { code: 'ITEM_NOT_FOUND', message: 'Menu item not found' }));
        return;
    }
    res.json(createResponse(true, item));
}));
// ==================== STATISTICS ROUTES ====================
/**
 * @route GET /api/pos/stats
 * @desc Get order statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await orderService_1.orderService.getStatistics();
    res.json(createResponse(true, stats));
}));
/**
 * @route GET /api/pos/revenue
 * @desc Get revenue summary for a date range
 */
router.get('/revenue', asyncHandler(async (req, res) => {
    const startDateParam = req.query.startDate;
    const endDateParam = req.query.endDate;
    if (!startDateParam || !endDateParam) {
        res.status(400).json(createResponse(false, undefined, { code: 'INVALID_DATES', message: 'Start date and end date are required' }));
        return;
    }
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);
    const summary = await orderService_1.orderService.getRevenueSummary(startDate, endDate);
    res.json(createResponse(true, summary));
}));
// ==================== HEALTH CHECK ====================
/**
 * @route GET /api/pos/health
 * @desc Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json(createResponse(true, { status: 'healthy', service: 'rez-pos-service', timestamp: new Date().toISOString() }));
});
exports.default = router;
//# sourceMappingURL=pos.routes.js.map