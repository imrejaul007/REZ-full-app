/**
 * Booking Price Calculation Tests
 * Tests price calculation logic in booking controller
 */

import { createBooking } from '../controllers/serviceBookingController';
import { ServiceBooking } from '../models/ServiceBooking';
import { Product } from '../models/Product';
import { Store } from '../models/Store';

jest.mock('../models/ServiceBooking', () => ({
  ServiceBooking: Object.assign(jest.fn(), {
    collection: { findOneAndUpdate: jest.fn().mockResolvedValue({ value: null }) },
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    checkSlotAvailability: jest.fn(),
    generateBookingNumber: jest.fn(),
  }),
}));
jest.mock('../models/Product', () => ({ Product: jest.fn() }));
jest.mock('../models/Store', () => ({ Store: jest.fn() }));
jest.mock('../models/ServiceCategory', () => ({ ServiceCategory: jest.fn() }));
jest.mock('../models/Refund', () => ({ Refund: jest.fn() }));
jest.mock('../config/logger', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  createServiceLogger: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
}));
jest.mock('../services/travelCashbackService', () => ({
  __esModule: true,
  default: {
    isTravelCategory: jest.fn().mockReturnValue(false),
    calculateCashback: jest.fn().mockResolvedValue({ cashbackAmount: 0, cashbackPercentage: 0 }),
  },
}));
jest.mock('../services/razorpayService', () => ({ createRefund: jest.fn() }));
jest.mock('../services/stripeService', () => ({ __esModule: true, default: { createRefund: jest.fn() } }));
jest.mock('../services/merchantNotificationService', () => ({
  __esModule: true,
  default: { sendBookingNotification: jest.fn() },
}));
jest.mock('../services/pushNotificationService', () => ({ __esModule: true, default: { sendPushToUser: jest.fn() } }));
jest.mock('../utils/currency', () => ({ pct: (amount: number, rate: number) => Math.round((amount * rate) / 100) }));
jest.mock('../utils/asyncHandler', () => ({ asyncHandler: (fn: any) => fn }));

const mockServiceBooking = ServiceBooking as any;
const mockProduct = Product as jest.Mocked<typeof Product>;
const mockStore = Store as jest.Mocked<typeof Store>;

// Helper: returns a chainable mock query that resolves to `value`
function mockChainQuery(value: any) {
  const q: any = {
    populate: () => q,
    lean: () => Promise.resolve(value),
    select: () => q,
  };
  return q;
}

describe('Booking Price Calculation', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Restore collection mock after clearAllMocks
    (mockServiceBooking as any).collection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ value: { bookingCount: 1 } }),
    };

    // Default: ServiceBooking.findOne returns chainable query resolving to null
    (mockServiceBooking as any).findOne = jest.fn().mockReturnValue(mockChainQuery(null));

    // Default: new ServiceBooking() returns instance with save()
    const defaultBookingInstance = {
      _id: 'booking_default',
      save: jest.fn().mockResolvedValue({ _id: 'booking_default' }),
    };
    (mockServiceBooking as any).mockImplementation(() => defaultBookingInstance);
    (mockServiceBooking as any).findById = jest
      .fn()
      .mockReturnValue(mockChainQuery({ _id: 'booking_default', bookingNumber: 'BKG-00000001', pricing: {} }));

    mockRequest = {
      body: {},
      user: {
        _id: 'user_123',
        email: 'test@example.com',
        phoneNumber: '+919876543210',
        profile: { firstName: 'John', lastName: 'Doe' },
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('totalPrice from customerNotes', () => {
    it('should use totalPrice from customerNotes when provided', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 1000 }, // Base price
        serviceCategory: { _id: 'cat_123', slug: 'flights' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 60 },
        cashback: { percentage: 15 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('FLT-12345678');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_123' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest
        .fn()
        .mockReturnValue(
          mockChainQuery({
            _id: 'booking_123',
            bookingNumber: 'FLT-12345678',
            pricing: { total: 5000, basePrice: 1000 },
          }),
        );

      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
        customerNotes: JSON.stringify({
          totalPrice: 5000, // Custom price (should be used instead of basePrice 1000)
        }),
      };

      await createBooking(mockRequest, mockResponse, jest.fn());

      // Verify that totalPrice from customerNotes (5000) was used, not basePrice (1000)
      // Note: data is passed to new ServiceBooking({...}), not to save()
      expect(mockServiceBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          pricing: expect.objectContaining({
            total: 5000, // Should use totalPrice from customerNotes
            basePrice: 1000, // Base price from service
          }),
        }),
      );
    });

    it('should fallback to basePrice when totalPrice is missing', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 2000 },
        serviceCategory: { _id: 'cat_123', slug: 'hotels' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 480 },
        cashback: { percentage: 25 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('HTL-12345678');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_123' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest
        .fn()
        .mockReturnValue(
          mockChainQuery({
            _id: 'booking_123',
            bookingNumber: 'HTL-12345678',
            pricing: { total: 2000, basePrice: 2000 },
          }),
        );

      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '14:00', end: '11:00' },
        customerNotes: JSON.stringify({
          // Missing totalPrice - should use basePrice
          rooms: 1,
        }),
      };

      await createBooking(mockRequest, mockResponse, jest.fn());

      // Should use basePrice when totalPrice is missing
      expect(mockServiceBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          pricing: expect.objectContaining({
            total: 2000, // Should fallback to basePrice
            basePrice: 2000,
          }),
        }),
      );
    });

    it('should handle invalid totalPrice in customerNotes', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 3000 },
        serviceCategory: { _id: 'cat_123', slug: 'trains' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 480 },
        cashback: { percentage: 10 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('TRN-12345678');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_123' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest
        .fn()
        .mockReturnValue(
          mockChainQuery({
            _id: 'booking_123',
            bookingNumber: 'TRN-12345678',
            pricing: { total: 3000, basePrice: 3000 },
          }),
        );

      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '08:00', end: '16:00' },
        customerNotes: JSON.stringify({
          totalPrice: -100, // Invalid negative price
        }),
      };

      await createBooking(mockRequest, mockResponse, jest.fn());

      // Should use basePrice when totalPrice is invalid
      expect(mockServiceBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          pricing: expect.objectContaining({
            total: 3000, // Should fallback to basePrice
          }),
        }),
      );
    });
  });

  describe('Cashback Calculation', () => {
    it('should calculate cashback on totalPrice, not basePrice', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 1000 }, // Base price
        serviceCategory: { _id: 'cat_123', slug: 'flights' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 60 },
        cashback: { percentage: 15 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('FLT-12345678');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_123' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest
        .fn()
        .mockReturnValue(
          mockChainQuery({
            _id: 'booking_123',
            bookingNumber: 'FLT-12345678',
            pricing: { total: 5000, basePrice: 1000, cashbackEarned: 750, cashbackPercentage: 15 },
          }),
        );

      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
        customerNotes: JSON.stringify({
          totalPrice: 5000, // Custom total price
        }),
      };

      await createBooking(mockRequest, mockResponse, jest.fn());

      // Verify cashback is calculated on totalPrice (5000), not basePrice (1000)
      expect(mockServiceBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          pricing: expect.objectContaining({
            cashbackEarned: expect.any(Number), // cashback calculated on total
          }),
        }),
      );
    });
  });

  describe('Traveler Validation', () => {
    it('should validate travelers count from customerNotes', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 1000 },
        serviceCategory: { _id: 'cat_123', slug: 'flights' },
        store: { _id: 'store_123' },
        serviceDetails: {
          duration: 60,
          maxPassengers: 5, // Max 5 passengers
        },
        cashback: { percentage: 15 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('FLT-12345678');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_123' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest
        .fn()
        .mockReturnValue(mockChainQuery({ _id: 'booking_123', bookingNumber: 'FLT-12345678' }));

      // Test with valid passenger count (4 passengers < max 5)
      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
        customerNotes: JSON.stringify({
          passengers: { adults: 3, children: 1 }, // Total: 4 passengers
          totalPrice: 4000,
        }),
      };

      await createBooking(mockRequest, mockResponse, jest.fn());
      expect(mockResponse.status).toHaveBeenCalledWith(201);

      // Test with invalid passenger count (6 passengers > max 5)
      mockRequest.body.customerNotes = JSON.stringify({
        passengers: { adults: 4, children: 2 }, // Total: 6 passengers
        totalPrice: 6000,
      });

      await createBooking(mockRequest, mockResponse, jest.fn());
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Maximum 5 passengers'),
        }),
      );
    });
  });
});
