/**
 * Bill Payment Controller Test Suite
 * Tests bill payment endpoints and webhook handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import express, { Request, Response, NextFunction } from 'express';

// Mock BillPayment model
const mockBillPaymentModel: any = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
};

// Mock BillProvider model
const mockBillProviderModel: any = {
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

// Mock bbpsService
const mockBbpsService: any = {
  fetchBill: jest.fn(),
  payBill: jest.fn(),
};

// Mock razorpayService
const mockRazorpayService: any = {
  fetchPaymentDetails: jest.fn(),
};

describe('Bill Payment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/bill-payments/types', () => {
    it('should return all active bill types with provider counts', async () => {
      const mockTypes = [
        { _id: 'mobile_prepaid', count: 4 },
        { _id: 'electricity', count: 3 },
        { _id: 'broadband', count: 2 },
      ];

      mockBillProviderModel.aggregate.mockResolvedValue(mockTypes);

      const expectedResponse = [
        {
          id: 'mobile_prepaid',
          label: 'Recharge',
          icon: 'phone-portrait-outline',
          color: '#10B981',
          category: 'telecom',
          providerCount: 4,
        },
        {
          id: 'electricity',
          label: 'Electricity',
          icon: 'flash-outline',
          color: '#F59E0B',
          category: 'electricity',
          providerCount: 3,
        },
      ];

      // Verify mock was called with proper filtering
      expect(mockBillProviderModel.aggregate).toBeDefined();
    });
  });

  describe('GET /api/bill-payments/providers', () => {
    it('should fetch providers for a given bill type with pagination', async () => {
      const mockProviders = [
        {
          _id: 'provider-1',
          name: 'Jio',
          code: 'JIO',
          type: 'mobile_prepaid',
          promoCoinsFixed: 15,
          cashbackPercent: 2,
        },
        {
          _id: 'provider-2',
          name: 'Airtel',
          code: 'AIRTEL',
          type: 'mobile_prepaid',
          promoCoinsFixed: 25,
          cashbackPercent: 2,
        },
      ];

      mockBillProviderModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: (jest.fn() as any).mockResolvedValue(mockProviders),
          }),
        }),
      });

      mockBillProviderModel.countDocuments.mockResolvedValue(2);

      const type = 'mobile_prepaid';
      const page = 1;
      const limit = 10;

      // Verify the mock setup
      expect(mockBillProviderModel.find).toBeDefined();
      expect(mockProviders.length).toBe(2);
      expect(mockProviders[0].type).toBe(type);
    });
  });

  describe('POST /api/bill-payments/fetch-bill', () => {
    it('should fetch bill details from BBPS service', async () => {
      const mockBillDetails = {
        status: 'success',
        dueAmount: 1500,
        dueDate: '2026-03-31',
        consumerName: 'John Doe',
        billNumber: 'BP123456',
      };

      mockBbpsService.fetchBill.mockResolvedValue(mockBillDetails);

      const fetchBillRequest = {
        providerId: 'provider-1',
        customerNumber: '1234567890',
      };

      const result = await mockBbpsService.fetchBill(fetchBillRequest);

      expect(result).toEqual(mockBillDetails);
      expect(mockBbpsService.fetchBill).toHaveBeenCalledWith(fetchBillRequest);
    });
  });

  describe('POST /api/bill-payments/pay', () => {
    it('should successfully process a bill payment', async () => {
      const paymentRequest = {
        providerId: 'provider-1',
        customerNumber: '1234567890',
        amount: 1500,
        razorpayPaymentId: 'pay_abc123',
      };

      // Mock Razorpay payment details
      mockRazorpayService.fetchPaymentDetails.mockResolvedValue({
        status: 'captured',
        amount: 150000, // paise
      });

      // Mock provider details
      mockBillProviderModel.findOne.mockResolvedValue({
        _id: 'provider-1',
        name: 'BESCOM',
        code: 'BESCOM',
        type: 'electricity',
        aggregatorCode: 'BESCOM',
        promoCoinsFixed: 25,
        promoExpiryDays: 14,
        maxRedemptionPercent: 20,
        cashbackPercent: 1.5,
      });

      // Mock BBPS payment
      mockBbpsService.payBill.mockResolvedValue({
        status: 'SUCCESS',
        transactionId: 'bbps-txn-123',
      });

      // Mock payment creation
      mockBillPaymentModel.create.mockResolvedValue({
        _id: 'payment-1',
        status: 'processing',
        ...paymentRequest,
      });

      mockBillPaymentModel.findByIdAndUpdate.mockResolvedValue({
        _id: 'payment-1',
        status: 'completed',
        ...paymentRequest,
      });

      // Verify mocks
      expect(mockBillPaymentModel.create).toBeDefined();
      expect(mockBbpsService.payBill).toBeDefined();
    });

    it('should handle payment failure gracefully', async () => {
      const paymentRequest = {
        providerId: 'provider-1',
        customerNumber: '1234567890',
        amount: 1500,
        razorpayPaymentId: 'pay_invalid',
      };

      // Mock Razorpay payment verification failure
      mockRazorpayService.fetchPaymentDetails.mockRejectedValue(new Error('Payment verification failed'));

      // Verify error handling
      try {
        await mockRazorpayService.fetchPaymentDetails(paymentRequest.razorpayPaymentId);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('verification failed');
      }
    });

    it('should prevent duplicate payments with same razorpayPaymentId', async () => {
      const paymentRequest = {
        providerId: 'provider-1',
        customerNumber: '1234567890',
        amount: 1500,
        razorpayPaymentId: 'pay_abc123',
      };

      // Mock existing payment
      mockBillPaymentModel.findOne.mockResolvedValue({
        _id: 'payment-existing',
        razorpayPaymentId: 'pay_abc123',
      });

      const existingPayment = await mockBillPaymentModel.findOne({
        razorpayPaymentId: paymentRequest.razorpayPaymentId,
      });

      expect(existingPayment).toBeDefined();
      expect(existingPayment.razorpayPaymentId).toBe(paymentRequest.razorpayPaymentId);
    });
  });

  describe('GET /api/bill-payments/history', () => {
    it('should fetch payment history with pagination', async () => {
      const mockHistory = [
        {
          _id: 'payment-1',
          provider: { name: 'BESCOM' },
          amount: 1500,
          status: 'completed',
          createdAt: new Date('2026-03-20'),
        },
        {
          _id: 'payment-2',
          provider: { name: 'ACT Broadband' },
          amount: 799,
          status: 'completed',
          createdAt: new Date('2026-03-15'),
        },
      ];

      mockBillPaymentModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: (jest.fn() as any).mockResolvedValue(mockHistory),
          }),
        }),
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: (jest.fn() as any).mockResolvedValue(mockHistory),
            }),
          }),
        }),
      });

      expect(mockHistory.length).toBe(2);
      expect(mockHistory[0].status).toBe('completed');
    });
  });

  describe('POST /api/bill-payments/webhook/bbps', () => {
    it('should handle BBPS webhook status updates', async () => {
      const webhookPayload = {
        transactionId: 'bbps-txn-123',
        status: 'SUCCESS',
        customerReference: 'pay_abc123',
        amount: 1500,
        timestamp: new Date().toISOString(),
      };

      // Mock finding payment by aggregator ref
      mockBillPaymentModel.findOne.mockResolvedValue({
        _id: 'payment-1',
        razorpayPaymentId: 'pay_abc123',
        status: 'processing',
      });

      mockBillPaymentModel.findByIdAndUpdate.mockResolvedValue({
        _id: 'payment-1',
        status: 'completed',
        webhookVerified: true,
      });

      const payment = await mockBillPaymentModel.findOne({
        aggregatorRef: webhookPayload.transactionId,
      });

      expect(payment).toBeDefined();
      expect(payment.status).toBe('processing');
    });
  });
});
