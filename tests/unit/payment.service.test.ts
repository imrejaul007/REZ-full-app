/**
 * Payment Service Unit Tests
 *
 * Tests for:
 * - Process valid payment
 * - Handle card declined
 * - Prevent double-charge
 */

import mongoose from 'mongoose';

// Mock the Payment model
const mockPaymentModel = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  create: jest.fn(),
};

const mockPaymentAuditLog = {
  create: jest.fn(),
};

const mockRazorpay = {
  createOrder: jest.fn(),
  verifySignature: jest.fn(),
};

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  eval: jest.fn(),
};

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        insertMany: jest.fn(),
      }),
    },
  };
});

jest.mock('../../rez-payment-service/src/models/Payment', () => ({
  Payment: mockPaymentModel,
}));

jest.mock('../../rez-payment-service/src/models/TransactionAuditLog', () => ({
  PaymentAuditLog: mockPaymentAuditLog,
}));

jest.mock('../../rez-payment-service/src/services/razorpayService', () => mockRazorpay);

jest.mock('../../rez-payment-service/src/config/redis', () => ({
  redis: mockRedis,
  redisHost: 'localhost',
  redisPort: 6379,
}));

jest.mock('../../rez-payment-service/src/config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Import after mocking
import {
  initiatePayment,
  capturePayment,
  getPaymentStatus,
  type InitiateInput,
} from '../../rez-payment-service/src/services/paymentService';

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.eval.mockResolvedValue(1);
  });

  describe('initiatePayment', () => {
    const validInput: InitiateInput = {
      userId: new mongoose.Types.ObjectId().toString(),
      orderId: new mongoose.Types.ObjectId().toString(),
      amount: 1000,
      currency: 'INR',
      paymentMethod: 'card',
      purpose: 'order',
      userDetails: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210',
      },
    };

    it('1. should initiate a valid payment successfully', async () => {
      // Setup mocks
      mockPaymentModel.findOne.mockResolvedValue(null);
      mockRazorpay.createOrder.mockResolvedValue({
        id: 'order_test123',
        amount: 1000,
        currency: 'INR',
      });
      mockPaymentModel.create.mockResolvedValue({
        paymentId: 'pay_test123',
        ...validInput,
        status: 'pending',
      });
      mockPaymentAuditLog.create.mockResolvedValue({});

      const result = await initiatePayment(validInput);

      expect(result).toHaveProperty('paymentId');
      expect(result).toHaveProperty('gatewayOrderId', 'order_test123');
      expect(result).toHaveProperty('amount', 1000);
      expect(result).toHaveProperty('currency', 'INR');
      expect(mockRazorpay.createOrder).toHaveBeenCalledWith(
        1000,
        expect.any(String),
        expect.objectContaining({ userId: validInput.userId, purpose: 'order_payment' })
      );
    });

    it('2. should return existing payment for duplicate idempotency key', async () => {
      const existingPayment = {
        paymentId: 'pay_existing123',
        metadata: { razorpayOrderId: 'order_existing' },
        amount: 1000,
        currency: 'INR',
      };
      mockPaymentModel.findOne.mockResolvedValue(existingPayment);

      const inputWithIdempotency: InitiateInput = {
        ...validInput,
        orchestratorIdempotencyKey: 'idem-key-123',
      };

      const result = await initiatePayment(inputWithIdempotency);

      expect(result.paymentId).toBe('pay_existing123');
      expect(mockRazorpay.createOrder).not.toHaveBeenCalled();
    });

    it('3. should reject payment with amount exceeding wallet topup limit', async () => {
      const invalidInput: InitiateInput = {
        ...validInput,
        purpose: 'wallet_topup',
        amount: 150000, // Exceeds MAX_WALLET_TOPUP of 100000
      };

      await expect(initiatePayment(invalidInput)).rejects.toThrow(/cannot exceed/);
    });

    it('4. should handle card declined scenario - gateway returns failure', async () => {
      mockPaymentModel.findOne.mockResolvedValue(null);
      mockRazorpay.createOrder.mockRejectedValue(new Error('Razorpay: Payment method not enabled'));

      const input: InitiateInput = {
        ...validInput,
        paymentMethod: 'card',
      };

      await expect(initiatePayment(input)).rejects.toThrow('Payment method not enabled');
    });

    it('5. should reject concurrent payment initiation for same order', async () => {
      // First call acquires lock, second call fails
      mockRedis.set.mockResolvedValueOnce(null); // Lock unavailable

      await expect(initiatePayment(validInput)).rejects.toThrow(/already in progress/);
    });
  });

  describe('capturePayment', () => {
    it('6. should capture payment successfully with valid signature', async () => {
      const paymentId = 'pay_test123';
      const razorpayPaymentId = 'razorpay_pay_123';
      const razorpayOrderId = 'order_test123';
      const signature = 'valid_signature';

      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        paymentId,
        user: new mongoose.Types.ObjectId(),
        amount: 1000,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      };

      mockRazorpay.verifySignature.mockReturnValue(true);
      mockPaymentModel.findOne.mockResolvedValue(mockPayment);
      mockPaymentModel.findOneAndUpdate.mockResolvedValue(mockPayment);
      mockPaymentAuditLog.create.mockResolvedValue({});

      const result = await capturePayment(
        paymentId,
        razorpayPaymentId,
        razorpayOrderId,
        signature
      );

      expect(result.status).toBe('completed');
      expect(mockRazorpay.verifySignature).toHaveBeenCalledWith(
        razorpayOrderId,
        razorpayPaymentId,
        signature
      );
    });

    it('7. should prevent double-charge by checking walletCredited flag', async () => {
      const paymentId = 'pay_test123';
      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        paymentId,
        user: new mongoose.Types.ObjectId(),
        amount: 1000,
        status: 'pending',
        walletCredited: true, // Already credited
        save: jest.fn(),
      };

      mockRazorpay.verifySignature.mockReturnValue(true);
      mockPaymentModel.findOne.mockResolvedValue(mockPayment);
      mockPaymentModel.findOneAndUpdate.mockResolvedValue(null); // No update because walletCredited is true
      mockPaymentAuditLog.create.mockResolvedValue({});

      const result = await capturePayment(
        paymentId,
        'razorpay_pay_123',
        'order_test123',
        'valid_signature'
      );

      // Payment should still complete but not trigger another wallet credit
      expect(result.status).toBe('completed');
    });

    it('8. should reject capture with invalid signature', async () => {
      mockRazorpay.verifySignature.mockReturnValue(false);

      await expect(
        capturePayment('pay_test', 'rzp_pay', 'order_123', 'invalid_sig')
      ).rejects.toThrow('Invalid payment signature');
    });

    it('9. should reject capture for non-existent payment', async () => {
      mockRazorpay.verifySignature.mockReturnValue(true);
      mockPaymentModel.findOne.mockResolvedValue(null);

      await expect(
        capturePayment('pay_nonexistent', 'rzp_pay', 'order_123', 'sig')
      ).rejects.toThrow('Payment not found');
    });

    it('10. should reject unauthorized capture attempt (IDOR protection)', async () => {
      const paymentOwner = new mongoose.Types.ObjectId();
      const attackerUserId = new mongoose.Types.ObjectId().toString();

      const mockPayment = {
        _id: new mongoose.Types.ObjectId(),
        paymentId: 'pay_test123',
        user: paymentOwner,
        amount: 1000,
        status: 'pending',
      };

      mockRazorpay.verifySignature.mockReturnValue(true);
      mockPaymentModel.findOne.mockResolvedValue(mockPayment);

      await expect(
        capturePayment(
          'pay_test123',
          'rzp_pay',
          'order_123',
          'sig',
          attackerUserId // Attacker trying to capture someone else's payment
        )
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getPaymentStatus', () => {
    it('11. should return payment status for valid payment ID', async () => {
      const mockPayment = {
        paymentId: 'pay_test123',
        status: 'completed',
        amount: 1000,
      };
      mockPaymentModel.findOne.mockResolvedValue(mockPayment);

      const result = await getPaymentStatus('pay_test123');

      expect(result).toEqual(mockPayment);
      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({ paymentId: 'pay_test123' });
    });

    it('12. should return null for non-existent payment', async () => {
      mockPaymentModel.findOne.mockResolvedValue(null);

      const result = await getPaymentStatus('pay_nonexistent');

      expect(result).toBeNull();
    });

    it('13. should scope payment lookup by owner user ID', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      mockPaymentModel.findOne.mockResolvedValue(null);

      await getPaymentStatus('pay_test123', userId);

      expect(mockPaymentModel.findOne).toHaveBeenCalledWith({
        paymentId: 'pay_test123',
        user: expect.any(mongoose.Types.ObjectId),
      });
    });
  });
});
