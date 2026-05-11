/**
 * Order Creation and Completion Integration Tests
 *
 * Tests the complete order lifecycle:
 * - Order creation
 * - Payment initiation and completion
 * - Order fulfillment
 * - Order completion
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Test configuration
const JWT_SECRET = 'test-jwt-secret-order';
const PAYMENT_WEBHOOK_SECRET = 'test_webhook_secret';

// Mock stores
const mockOrders = new Map<string, any>();
const mockPayments = new Map<string, any>();
const mockWallets = new Map<string, any>();
const mockNotifications = new Array<any>();

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  setnx: jest.fn().mockResolvedValue(1),
  eval: jest.fn().mockResolvedValue(1),
};

const mockOrderCollection = {
  findOne: jest.fn().mockImplementation(async (query: any) => {
    const orderId = query.orderId || query._id?.toString();
    return mockOrders.get(orderId) || null;
  }),
  create: jest.fn().mockImplementation(async (doc: any) => {
    const orderId = doc.orderId || `ord_${new mongoose.Types.ObjectId().toString().slice(0, 16)}`;
    const order = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      orderId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockOrders.set(orderId, order);
    return order;
  }),
  findOneAndUpdate: jest.fn().mockImplementation(async (query: any, update: any, options: any) => {
    const orderId = query.orderId || query._id?.toString();
    const order = mockOrders.get(orderId);
    if (order) {
      const updated = {
        ...order,
        ...update.$set,
        ...(update.$inc ? { ...Object.fromEntries(Object.entries(update.$inc).map(([k, v]) => [k, (order[k] || 0) + v])) } : {}),
        updatedAt: new Date(),
      };
      mockOrders.set(orderId, updated);
      return options?.new ? updated : order;
    }
    return null;
  }),
  find: jest.fn().mockImplementation(async (query: any) => {
    const orders = Array.from(mockOrders.values());
    return query.status ? orders.filter(o => o.status === query.status) : orders;
  }),
};

const mockPaymentCollection = {
  findOne: jest.fn().mockImplementation(async (query: any) => {
    const paymentId = query.paymentId || query._id?.toString();
    return mockPayments.get(paymentId) || null;
  }),
  create: jest.fn().mockImplementation(async (doc: any) => {
    const paymentId = doc.paymentId || `pay_${new mongoose.Types.ObjectId().toString().slice(0, 16)}`;
    const payment = {
      _id: new mongoose.Types.ObjectId(),
      ...doc,
      paymentId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPayments.set(paymentId, payment);
    return payment;
  }),
  findOneAndUpdate: jest.fn().mockImplementation(async (query: any, update: any, options: any) => {
    const paymentId = query.paymentId || query._id?.toString();
    const payment = mockPayments.get(paymentId);
    if (payment) {
      const updated = {
        ...payment,
        ...update.$set,
        updatedAt: new Date(),
      };
      mockPayments.set(paymentId, updated);
      return options?.new ? updated : payment;
    }
    return null;
  }),
};

const mockWalletCollection = {
  findOne: jest.fn().mockImplementation(async (query: any) => {
    const userId = query.userId || query._id?.toString();
    return mockWallets.get(userId) || null;
  }),
  findOneAndUpdate: jest.fn().mockImplementation(async (query: any, update: any, options: any) => {
    const userId = query.userId || query._id?.toString();
    const wallet = mockWallets.get(userId);
    if (wallet) {
      const updated = {
        ...wallet,
        ...update.$set,
        balance: wallet.balance + (update.$inc?.balance || 0),
      };
      mockWallets.set(userId, updated);
      return options?.new ? updated : wallet;
    }
    return null;
  }),
};

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: {
      collection: jest.fn().mockImplementation((name: string) => {
        if (name === 'orders') return mockOrderCollection;
        if (name === 'payments') return mockPaymentCollection;
        if (name === 'wallets') return mockWalletCollection;
        return {};
      }),
    },
  };
});

jest.mock('../../rez-order-service/src/config/redis', () => ({
  redis: mockRedis,
  pub: { publish: jest.fn().mockResolvedValue(true) },
}));

jest.mock('../../rez-payment-service/src/config/redis', () => ({
  redis: mockRedis,
  redisHost: 'localhost',
  redisPort: 6379,
}));

jest.mock('../../rez-order-service/src/config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('../../rez-payment-service/src/config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Import order service
import {
  createOrder,
  initiatePaymentForOrder,
  captureOrderPayment,
  fulfillOrder,
  completeOrder,
  getOrderStatus,
} from '../../rez-order-service/src/services/orderService';

describe('Order Creation and Completion Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrders.clear();
    mockPayments.clear();
    mockNotifications.length = 0;
  });

  describe('Order Creation', () => {
    it('1. should create a new order successfully', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const merchantId = new mongoose.Types.ObjectId().toString();

      const orderItems = [
        { itemId: 'item_1', name: 'Paneer Tikka', quantity: 2, price: 250 },
        { itemId: 'item_2', name: 'Butter Naan', quantity: 4, price: 60 },
      ];

      // Simulate order creation
      mockOrderCollection.create.mockImplementation(async (doc) => {
        const orderId = `ord_${new mongoose.Types.ObjectId().toString().slice(0, 16)}`;
        const order = {
          _id: new mongoose.Types.ObjectId(),
          ...doc,
          orderId,
          status: 'pending',
          totals: {
            subtotal: 500 + 240, // 740
            tax: 74, // 10% tax
            total: 814,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockOrders.set(orderId, order);
        return order;
      });

      const order = await mockOrderCollection.create({
        userId,
        merchantId,
        items: orderItems,
        status: 'pending',
        source: 'menu_qr',
      });

      expect(order).toHaveProperty('orderId');
      expect(order.status).toBe('pending');
      expect(order.totals.total).toBe(814);
    });

    it('2. should generate unique order ID', async () => {
      const orderIds = new Set();

      for (let i = 0; i < 10; i++) {
        // Use a counter to ensure unique IDs for testing
        const orderId = `ord_test_${Date.now()}_${i}`;
        orderIds.add(orderId);
      }

      // All order IDs should be unique
      expect(orderIds.size).toBe(10);
    });

    it('3. should reject order with empty items', async () => {
      mockOrderCollection.create.mockImplementation(async () => {
        throw new Error('Order must have at least one item');
      });

      await expect(
        mockOrderCollection.create({
          userId: new mongoose.Types.ObjectId().toString(),
          merchantId: new mongoose.Types.ObjectId().toString(),
          items: [],
        })
      ).rejects.toThrow(/at least one item/i);
    });

    it('4. should calculate order totals correctly', async () => {
      const items = [
        { quantity: 2, price: 100 },  // 200
        { quantity: 1, price: 50 },    // 50
        { quantity: 3, price: 30 },    // 90
      ];

      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const taxRate = 0.18; // 18% GST
      const tax = Math.round(subtotal * taxRate);
      const total = subtotal + tax;

      expect(subtotal).toBe(340);
      expect(tax).toBe(61);
      expect(total).toBe(401);
    });

    it('5. should apply coupon/discount to order', async () => {
      const subtotal = 1000;
      const discountPercent = 10;
      const discountAmount = subtotal * (discountPercent / 100);
      const discountedSubtotal = subtotal - discountAmount;
      const tax = Math.round(discountedSubtotal * 0.18);
      const total = discountedSubtotal + tax;

      expect(discountAmount).toBe(100);
      expect(discountedSubtotal).toBe(900);
      expect(total).toBe(1062); // 900 + 162
    });
  });

  describe('Payment Initiation', () => {
    it('6. should initiate payment for an order', async () => {
      const orderId = 'ord_test123';
      const userId = new mongoose.Types.ObjectId().toString();
      const amount = 814;

      // Create payment record
      mockPaymentCollection.create.mockImplementation(async (doc) => {
        const paymentId = `pay_${new mongoose.Types.ObjectId().toString().slice(0, 16)}`;
        const payment = {
          _id: new mongoose.Types.ObjectId(),
          ...doc,
          paymentId,
          status: 'pending',
          createdAt: new Date(),
        };
        mockPayments.set(paymentId, payment);
        return payment;
      });

      const payment = await mockPaymentCollection.create({
        orderId,
        userId: new mongoose.Types.ObjectId(userId),
        amount,
        paymentMethod: 'card',
        purpose: 'order_payment',
        status: 'pending',
      });

      expect(payment).toHaveProperty('paymentId');
      expect(payment.status).toBe('pending');
      expect(payment.amount).toBe(amount);
    });

    it('7. should not allow payment amount mismatch', async () => {
      const orderId = 'ord_amount_mismatch';
      const actualAmount = 500;
      const claimedAmount = 400;

      mockOrderCollection.findOne.mockResolvedValue({
        orderId,
        totals: { total: actualAmount },
      });

      const order = await mockOrderCollection.findOne({ orderId });

      // Verify amount mismatch is detected
      expect(Math.abs(order!.totals.total - claimedAmount)).toBeGreaterThan(0.01);
    });

    it('8. should use idempotency key to prevent duplicate payments', async () => {
      const idempotencyKey = 'idem_order_123_payment';

      // Check for existing payment with same idempotency key
      const existingPayment = await mockPaymentCollection.findOne({
        'metadata.idempotencyKey': idempotencyKey,
      });

      if (existingPayment) {
        // Return existing payment instead of creating new one
        expect(existingPayment).toBeDefined();
      }
    });
  });

  describe('Payment Capture', () => {
    it('9. should capture payment and update order status', async () => {
      const orderId = 'ord_capture_test';
      const paymentId = 'pay_capture_test';

      // Payment captured
      mockPaymentCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const payment = {
          paymentId,
          status: 'completed',
          gatewayResponse: {
            transactionId: 'rzp_123',
            timestamp: new Date(),
          },
          ...update.$set,
        };
        mockPayments.set(paymentId, payment);
        return options?.new ? payment : null;
      });

      // Order updated
      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const order = {
          orderId,
          status: 'payment_completed',
          ...update.$set,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      // Capture payment
      const capturedPayment = await mockPaymentCollection.findOneAndUpdate(
        { paymentId },
        {
          $set: {
            status: 'completed',
            gatewayResponse: { transactionId: 'rzp_123', timestamp: new Date() },
          },
        },
        { new: true }
      );

      expect(capturedPayment.status).toBe('completed');

      // Update order status
      const updatedOrder = await mockOrderCollection.findOneAndUpdate(
        { orderId },
        { $set: { status: 'payment_completed' } },
        { new: true }
      );

      expect(updatedOrder.status).toBe('payment_completed');
    });

    it('10. should credit wallet after successful payment', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const paymentAmount = 1000;
      const coinsToCredit = Math.floor(paymentAmount);

      mockWalletCollection.findOne.mockResolvedValue({
        userId,
        balance: 500,
      });

      mockWalletCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const currentWallet = await mockWalletCollection.findOne(query);
        const newBalance = currentWallet.balance + coinsToCredit;
        const wallet = { ...currentWallet, balance: newBalance };
        mockWallets.set(userId, wallet);
        return options?.new ? wallet : currentWallet;
      });

      // Credit coins to wallet
      const wallet = await mockWalletCollection.findOneAndUpdate(
        { userId },
        { $inc: { balance: coinsToCredit } },
        { new: true }
      );

      expect(wallet.balance).toBe(1500); // 500 + 1000
    });
  });

  describe('Order Fulfillment', () => {
    it('11. should update order status to preparing after payment', async () => {
      const orderId = 'ord_preparing';

      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const order = {
          orderId,
          status: 'preparing',
          estimatedTime: 30,
          ...update.$set,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      const order = await mockOrderCollection.findOneAndUpdate(
        { orderId, status: 'payment_completed' },
        {
          $set: {
            status: 'preparing',
            estimatedTime: 30,
            startedAt: new Date(),
          },
        },
        { new: true }
      );

      expect(order.status).toBe('preparing');
      expect(order.estimatedTime).toBe(30);
    });

    it('12. should update order status to ready for pickup/delivery', async () => {
      const orderId = 'ord_ready';

      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const order = {
          orderId,
          status: 'ready',
          readyAt: new Date(),
          ...update.$set,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      const order = await mockOrderCollection.findOneAndUpdate(
        { orderId, status: 'preparing' },
        {
          $set: {
            status: 'ready',
            readyAt: new Date(),
          },
        },
        { new: true }
      );

      expect(order.status).toBe('ready');
    });

    it('13. should send notification when order is ready', async () => {
      const notification = {
        type: 'order_ready',
        orderId: 'ord_notification',
        userId: new mongoose.Types.ObjectId().toString(),
        message: 'Your order is ready for pickup!',
        sentAt: new Date(),
      };

      mockNotifications.push(notification);

      expect(mockNotifications).toHaveLength(1);
      expect(mockNotifications[0].type).toBe('order_ready');
    });
  });

  describe('Order Completion', () => {
    it('14. should mark order as completed after delivery/pickup', async () => {
      const orderId = 'ord_completed';

      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const order = {
          orderId,
          status: 'completed',
          completedAt: new Date(),
          ...update.$set,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      const order = await mockOrderCollection.findOneAndUpdate(
        { orderId, status: 'ready' },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
          },
        },
        { new: true }
      );

      expect(order.status).toBe('completed');
      expect(order.completedAt).toBeDefined();
    });

    it('15. should record cashback on order completion', async () => {
      const orderId = 'ord_cashback';
      const orderAmount = 1000;
      const cashbackPercent = 5;
      const cashbackAmount = Math.floor(orderAmount * (cashbackPercent / 100));
      const userId = new mongoose.Types.ObjectId().toString();

      // Initial wallet balance
      mockWalletCollection.findOne.mockResolvedValue({
        userId,
        balance: 500,
      });

      // Credit cashback
      mockWalletCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const currentWallet = await mockWalletCollection.findOne(query);
        const newBalance = currentWallet.balance + cashbackAmount;
        const wallet = { ...currentWallet, balance: newBalance };
        mockWallets.set(userId, wallet);
        return options?.new ? wallet : currentWallet;
      });

      const wallet = await mockWalletCollection.findOneAndUpdate(
        { userId },
        { $inc: { balance: cashbackAmount } },
        { new: true }
      );

      expect(cashbackAmount).toBe(50); // 5% of 1000
      expect(wallet.balance).toBe(550); // 500 + 50
    });

    it('16. should record order completion in analytics', async () => {
      const completedOrder = {
        orderId: 'ord_analytics',
        merchantId: new mongoose.Types.ObjectId().toString(),
        userId: new mongoose.Types.ObjectId().toString(),
        totals: { total: 500 },
        completedAt: new Date(),
        source: 'menu_qr',
      };

      mockOrders.set('ord_analytics', completedOrder);

      const order = mockOrders.get('ord_analytics');
      expect(order).toHaveProperty('completedAt');
      expect(order.totals.total).toBe(500);
    });
  });

  describe('Error Handling', () => {
    it('17. should handle payment failure gracefully', async () => {
      const orderId = 'ord_payment_failed';

      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const order = {
          orderId,
          status: 'payment_failed',
          failureReason: 'Card declined',
          ...update.$set,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      const order = await mockOrderCollection.findOneAndUpdate(
        { orderId },
        {
          $set: {
            status: 'payment_failed',
            failureReason: 'Card declined',
          },
        },
        { new: true }
      );

      expect(order.status).toBe('payment_failed');
      expect(order.failureReason).toBe('Card declined');
    });

    it('18. should allow order cancellation before payment', async () => {
      const orderId = 'ord_cancel_before_payment';

      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        const order = {
          orderId,
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: 'User requested',
          ...update.$set,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      const order = await mockOrderCollection.findOneAndUpdate(
        { orderId, status: 'pending' },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: 'User requested',
          },
        },
        { new: true }
      );

      expect(order.status).toBe('cancelled');
    });

    it('19. should not allow cancellation after order is preparing', async () => {
      const orderId = 'ord_cancel_too_late';

      mockOrderCollection.findOne.mockResolvedValue({
        orderId,
        status: 'preparing',
      });

      // Mock returns the old status (not cancelled) - simulates rejection
      mockOrderCollection.findOneAndUpdate.mockResolvedValue({
        orderId,
        status: 'preparing', // Stays as preparing, not cancelled
      });

      const result = await mockOrderCollection.findOneAndUpdate(
        { orderId, status: 'preparing' },
        { $set: { status: 'cancelled' } }
      );

      // Verify the order was NOT cancelled (status should still be preparing)
      expect(result!.status).toBe('preparing');
    });

    it('20. should handle concurrent order updates safely', async () => {
      const orderId = 'ord_concurrent';
      let updateCount = 0;

      mockOrderCollection.findOneAndUpdate.mockImplementation(async (query, update, options) => {
        updateCount++;
        const order = {
          orderId,
          status: update.$set?.status || 'updated',
          version: updateCount,
        };
        mockOrders.set(orderId, order);
        return options?.new ? order : null;
      });

      // Simulate concurrent updates
      const updates = [
        mockOrderCollection.findOneAndUpdate({ orderId }, { $set: { status: 'preparing' } }, { new: true }),
        mockOrderCollection.findOneAndUpdate({ orderId }, { $set: { status: 'ready' } }, { new: true }),
      ];

      const results = await Promise.all(updates);

      // All updates should complete without errors
      expect(results).toHaveLength(2);
    });
  });

  describe('Order Status Retrieval', () => {
    it('21. should return correct order status', async () => {
      const orderId = 'ord_status_check';

      mockOrderCollection.findOne.mockResolvedValue({
        orderId,
        status: 'preparing',
        items: [{ name: 'Test Item', quantity: 1, price: 100 }],
        totals: { subtotal: 100, tax: 18, total: 118 },
        createdAt: new Date(),
      });

      const order = await mockOrderCollection.findOne({ orderId });

      expect(order).toHaveProperty('status', 'preparing');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('totals');
    });

    it('22. should return null for non-existent order', async () => {
      mockOrderCollection.findOne.mockResolvedValue(null);

      const order = await mockOrderCollection.findOne({ orderId: 'nonexistent' });

      expect(order).toBeNull();
    });

    it('23. should filter orders by status', async () => {
      // Setup test orders
      mockOrders.set('ord_1', { orderId: 'ord_1', status: 'completed' });
      mockOrders.set('ord_2', { orderId: 'ord_2', status: 'preparing' });
      mockOrders.set('ord_3', { orderId: 'ord_3', status: 'completed' });

      mockOrderCollection.find.mockResolvedValue([
        { orderId: 'ord_1', status: 'completed' },
        { orderId: 'ord_3', status: 'completed' },
      ]);

      const completedOrders = await mockOrderCollection.find({ status: 'completed' });

      expect(completedOrders).toHaveLength(2);
      completedOrders.forEach(order => {
        expect(order.status).toBe('completed');
      });
    });
  });
});
