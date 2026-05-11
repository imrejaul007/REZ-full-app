/**
 * Service Booking Controller Tests
 * Tests backend booking logic for all travel services
 */

import { Request, Response } from 'express';
import { createBooking } from '../controllers/serviceBookingController';
import { ServiceBooking } from '../models/ServiceBooking';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { ServiceCategory } from '../models/ServiceCategory';

// Mock models
jest.mock('../models/ServiceBooking', () => ({
  ServiceBooking: Object.assign(jest.fn(), {
    collection: { findOneAndUpdate: jest.fn() },
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

// Helper: returns a chainable mock query
function mockChainQuery(value: any) {
  const q: any = {
    populate: () => q,
    lean: () => Promise.resolve(value),
    select: () => q,
  };
  return q;
}

describe('Service Booking Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Restore collection mock after clearAllMocks
    (mockServiceBooking as any).collection = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ value: { bookingCount: 1 } }),
    };
    // Default: findOne returns chainable query
    (mockServiceBooking as any).findOne = jest.fn().mockReturnValue(mockChainQuery(null));
    // Default: new ServiceBooking() returns instance with save()
    const defaultBookingInstance = {
      _id: 'booking_default',
      save: jest.fn().mockResolvedValue({ _id: 'booking_default' }),
    };
    (mockServiceBooking as any).mockImplementation(() => defaultBookingInstance);
    (mockServiceBooking as any).findById = jest
      .fn()
      .mockReturnValue(mockChainQuery({ _id: 'booking_default', bookingNumber: 'BKG-00000001' }));

    mockRequest = {
      body: {},
      user: {
        _id: 'user_123',
        email: 'test@example.com',
        phoneNumber: '+919876543210',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      } as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Flight Booking', () => {
    it('should create flight booking with FLT- prefix', async () => {
      const mockService = {
        _id: 'flight_123',
        name: 'Delhi to Mumbai Flight',
        productType: 'service',
        isActive: true,
        pricing: { selling: 5000 },
        serviceCategory: { _id: 'cat_flights', slug: 'flights' },
        store: { _id: 'store_123', merchantId: 'merchant_123' },
        serviceDetails: { duration: 120 },
        cashback: { percentage: 15 },
      };

      const mockStoreData = {
        _id: 'store_123',
        name: 'Airline Store',
        merchantId: 'merchant_123',
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue(mockStoreData);
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('FLT-12345678');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_123' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_123',
          bookingNumber: 'FLT-12345678',
        }),
      );

      mockRequest.body = {
        serviceId: 'flight_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '09:00', end: '11:00' },
        serviceType: 'online',
        customerNotes: JSON.stringify({
          tripType: 'one-way',
          passengers: { adults: 2, children: 0, infants: 0 },
          flightClass: 'economy',
          totalPrice: 10000,
        }),
        paymentMethod: 'online',
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bookingNumber: expect.stringMatching(/^FLT-/),
          }),
        }),
      );
    });

    it('should extract totalPrice from customerNotes', async () => {
      const mockService = {
        _id: 'flight_123',
        pricing: { selling: 5000 },
        serviceCategory: { _id: 'cat_flights', slug: 'flights' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 120 },
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
            pricing: { total: 15000, basePrice: 5000 },
          }),
        );

      mockRequest.body = {
        serviceId: 'flight_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '09:00', end: '11:00' },
        customerNotes: JSON.stringify({
          totalPrice: 15000, // Custom calculated price
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      // Verify that totalPrice from customerNotes was used
      expect(mockServiceBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          pricing: expect.objectContaining({
            total: 15000, // Should use totalPrice from customerNotes, not basePrice
          }),
        }),
      );
    });
  });

  describe('Hotel Booking', () => {
    it('should create hotel booking with HTL- prefix', async () => {
      const mockService = {
        _id: 'hotel_123',
        pricing: { selling: 3000 },
        serviceCategory: { _id: 'cat_hotels', slug: 'hotels' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 480 },
        cashback: { percentage: 25 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('HTL-87654321');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_456' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_456',
          bookingNumber: 'HTL-87654321',
        }),
      );

      mockRequest.body = {
        serviceId: 'hotel_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '14:00', end: '11:00' },
        customerNotes: JSON.stringify({
          checkOutDate: '2024-12-28',
          rooms: 1,
          totalPrice: 9000,
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bookingNumber: expect.stringMatching(/^HTL-/),
          }),
        }),
      );
    });
  });

  describe('Train Booking', () => {
    it('should create train booking with TRN- prefix', async () => {
      const mockService = {
        _id: 'train_123',
        pricing: { selling: 500 },
        serviceCategory: { _id: 'cat_trains', slug: 'trains' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 480 },
        cashback: { percentage: 10 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('TRN-11223344');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_789' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_789',
          bookingNumber: 'TRN-11223344',
        }),
      );

      mockRequest.body = {
        serviceId: 'train_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '08:00', end: '16:00' },
        customerNotes: JSON.stringify({
          passengers: { adults: 2, children: 1 },
          totalPrice: 1250,
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bookingNumber: expect.stringMatching(/^TRN-/),
          }),
        }),
      );
    });
  });

  describe('Bus Booking', () => {
    it('should create bus booking with BUS- prefix', async () => {
      const mockService = {
        _id: 'bus_123',
        pricing: { selling: 800 },
        serviceCategory: { _id: 'cat_bus', slug: 'bus' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 480 },
        cashback: { percentage: 15 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('BUS-55667788');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_bus' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_bus',
          bookingNumber: 'BUS-55667788',
        }),
      );

      mockRequest.body = {
        serviceId: 'bus_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '18:00' },
        customerNotes: JSON.stringify({
          passengers: { adults: 1 },
          totalPrice: 800,
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bookingNumber: expect.stringMatching(/^BUS-/),
          }),
        }),
      );
    });
  });

  describe('Cab Booking', () => {
    it('should create cab booking with CAB- prefix', async () => {
      const mockService = {
        _id: 'cab_123',
        pricing: { selling: 1000 },
        serviceCategory: { _id: 'cat_cab', slug: 'cab' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 60 },
        cashback: { percentage: 20 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('CAB-99887766');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_cab' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_cab',
          bookingNumber: 'CAB-99887766',
        }),
      );

      mockRequest.body = {
        serviceId: 'cab_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
        customerNotes: JSON.stringify({
          pickupLocation: 'Airport',
          dropoffLocation: 'City',
          totalPrice: 1500,
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bookingNumber: expect.stringMatching(/^CAB-/),
          }),
        }),
      );
    });
  });

  describe('Package Booking', () => {
    it('should create package booking with PKG- prefix', async () => {
      const mockService = {
        _id: 'pkg_123',
        pricing: { selling: 10000 },
        serviceCategory: { _id: 'cat_packages', slug: 'packages' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 480 },
        cashback: { percentage: 22 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      mockServiceBooking.checkSlotAvailability = jest.fn().mockResolvedValue(true);
      mockServiceBooking.countDocuments = jest.fn().mockResolvedValue(0);
      mockServiceBooking.findOne = jest.fn().mockReturnValue(mockChainQuery(null));
      mockServiceBooking.generateBookingNumber = jest.fn().mockResolvedValue('PKG-44332211');

      const mockBookingInstance = {
        save: jest.fn().mockResolvedValue({ _id: 'booking_pkg' }),
      };
      (mockServiceBooking as any).mockImplementation(() => mockBookingInstance);
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_pkg',
          bookingNumber: 'PKG-44332211',
        }),
      );

      mockRequest.body = {
        serviceId: 'pkg_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '18:00' },
        customerNotes: JSON.stringify({
          travelers: { adults: 2, children: 1 },
          totalPrice: 25000,
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bookingNumber: expect.stringMatching(/^PKG-/),
          }),
        }),
      );
    });
  });

  describe('Validation Tests', () => {
    it('should reject booking without serviceId', async () => {
      mockRequest.body = {
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        }),
      );
    });

    it('should reject booking without bookingDate', async () => {
      mockRequest.body = {
        serviceId: 'service_123',
        timeSlot: { start: '10:00', end: '11:00' },
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject booking without timeSlot', async () => {
      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject booking for non-existent service', async () => {
      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(null));

      mockRequest.body = {
        serviceId: 'invalid_service',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Service not found',
        }),
      );
    });

    it('should reject booking for unavailable slot', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 1000 },
        serviceCategory: { _id: 'cat_123', slug: 'flights' },
        store: { _id: 'store_123' },
        serviceDetails: { duration: 60, maxBookingsPerSlot: 1 },
      };

      mockProduct.findOne = jest.fn().mockReturnValue(mockChainQuery(mockService));
      mockStore.findById = jest.fn().mockResolvedValue({ _id: 'store_123', merchantId: 'merchant_123' });
      // Controller uses atomic collection.findOneAndUpdate for slot reservation
      // bookingCount: 2 > maxBookingsPerSlot: 1 → slot full
      (mockServiceBooking as any).collection = {
        findOneAndUpdate: jest.fn().mockResolvedValue({ value: { bookingCount: 2 } }),
      };

      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Maximum'),
        }),
      );
    });
  });

  describe('Contact Info Extraction', () => {
    it('should use contact info from customerNotes when provided', async () => {
      const mockService = {
        _id: 'service_123',
        pricing: { selling: 1000 },
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
      (mockServiceBooking as any).findById = jest.fn().mockReturnValue(
        mockChainQuery({
          _id: 'booking_123',
          bookingNumber: 'FLT-12345678',
        }),
      );

      mockRequest.body = {
        serviceId: 'service_123',
        bookingDate: '2024-12-25',
        timeSlot: { start: '10:00', end: '11:00' },
        customerNotes: JSON.stringify({
          contactInfo: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+919999999999',
          },
          totalPrice: 2000,
        }),
      };

      await createBooking(mockRequest as Request, mockResponse as Response, jest.fn());

      // Verify that contact info from customerNotes was used (data passed to constructor)
      expect(mockServiceBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Jane Smith',
          customerPhone: '+919999999999',
          customerEmail: 'jane@example.com',
        }),
      );
    });
  });
});
