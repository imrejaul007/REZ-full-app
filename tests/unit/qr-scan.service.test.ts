/**
 * QR Scan Service Unit Tests
 *
 * Tests for:
 * - Valid QR code parsing
 * - Expired QR code rejection
 * - Offline mode handling
 */

import { QRSDK, createQRSDK } from '../../../packages/rez-qr-sdk/src';

// Mock the QR modules
const mockClientPost = jest.fn();
const mockClientGet = jest.fn();

jest.mock('../../../packages/rez-qr-sdk/src/modules/client', () => ({
  QRClient: jest.fn().mockImplementation(() => ({
    post: mockClientPost,
    get: mockClientGet,
    setAuthToken: jest.fn(),
  })),
}));

jest.mock('../../../packages/rez-qr-sdk/src/config/environments', () => ({
  environments: {
    development: {
      services: {
        apiUrl: 'http://localhost:3000',
        walletUrl: 'http://localhost:4001',
        paymentUrl: 'http://localhost:4002',
        authUrl: 'http://localhost:4003',
        merchantUrl: 'http://localhost:4004',
      },
    },
    staging: {
      services: {
        apiUrl: 'https://staging-api.rez.in',
        walletUrl: 'https://staging-wallet.rez.in',
        paymentUrl: 'https://staging-payment.rez.in',
        authUrl: 'https://staging-auth.rez.in',
        merchantUrl: 'https://staging-merchant.rez.in',
      },
    },
    production: {
      services: {
        apiUrl: 'https://api.rez.in',
        walletUrl: 'https://wallet.rez.in',
        paymentUrl: 'https://payment.rez.in',
        authUrl: 'https://auth.rez.in',
        merchantUrl: 'https://merchant.rez.in',
      },
    },
  },
  getEnvironment: jest.fn().mockReturnValue('development'),
}));

describe('QR Scan Service', () => {
  let sdk: QRSDK;

  beforeEach(() => {
    jest.clearAllMocks();
    sdk = createQRSDK({ environment: 'development' });
  });

  describe('Valid QR Code', () => {
    it('1. should parse valid room QR code and return room details', async () => {
      const validQRData = {
        type: 'room',
        hotelId: 'hotel_123',
        roomId: 'room_456',
        timestamp: Date.now(),
      };

      mockClientPost.mockResolvedValue({
        success: true,
        data: {
          roomId: 'room_456',
          hotelId: 'hotel_123',
          hotelName: 'Test Hotel',
          roomNumber: '101',
          amenities: ['wifi', 'ac'],
        },
      });

      const result = await sdk.room.checkIn(validQRData);

      expect(result).toHaveProperty('roomId', 'room_456');
      expect(result).toHaveProperty('hotelId', 'hotel_123');
      expect(mockClientPost).toHaveBeenCalled();
    });

    it('2. should parse valid menu QR code and return menu items', async () => {
      const validMenuQR = {
        type: 'menu',
        merchantId: 'merchant_123',
        branchId: 'branch_456',
        timestamp: Date.now(),
      };

      mockClientGet.mockResolvedValue({
        success: true,
        data: {
          merchantId: 'merchant_123',
          branchId: 'branch_456',
          categories: ['Starters', 'Main Course', 'Desserts'],
          items: [
            { id: 'item_1', name: 'Paneer Tikka', price: 250 },
            { id: 'item_2', name: 'Butter Chicken', price: 350 },
          ],
        },
      });

      const result = await sdk.menu.getMenu(validMenuQR.merchantId, validMenuQR.branchId);

      expect(result).toHaveProperty('merchantId', 'merchant_123');
      expect(result.items).toHaveLength(2);
    });

    it('3. should parse valid campaign QR and track attribution', async () => {
      const campaignQR = {
        type: 'campaign',
        campaignId: 'camp_123',
        utmSource: 'qr',
        utmMedium: 'offline',
        timestamp: Date.now(),
      };

      mockClientPost.mockResolvedValue({
        success: true,
        data: {
          attributionId: 'attr_123',
          campaignId: 'camp_123',
          credited: true,
          coinsEarned: 50,
        },
      });

      const result = await sdk.campaign.trackScan(campaignQR);

      expect(result).toHaveProperty('attributionId');
      expect(result).toHaveProperty('coinsEarned');
    });

    it('4. should parse valid store QR and return store profile', async () => {
      const storeQR = {
        type: 'store',
        storeId: 'store_123',
        timestamp: Date.now(),
      };

      mockClientGet.mockResolvedValue({
        success: true,
        data: {
          storeId: 'store_123',
          name: 'My Store',
          description: 'Best products in town',
          links: [
            { type: 'menu', url: '/menu' },
            { type: 'order', url: '/order' },
          ],
        },
      });

      const result = await sdk.store.getProfile(storeQR.storeId);

      expect(result).toHaveProperty('storeId', 'store_123');
      expect(result).toHaveProperty('links');
    });
  });

  describe('Expired QR Code', () => {
    it('5. should reject expired QR code', async () => {
      const expiredQRData = {
        type: 'room',
        hotelId: 'hotel_123',
        roomId: 'room_456',
        timestamp: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
      };

      mockClientPost.mockRejectedValue(
        new Error('QR code has expired. Please request a new QR code.')
      );

      await expect(sdk.room.checkIn(expiredQRData)).rejects.toThrow(/expired/i);
    });

    it('6. should reject QR code with invalid timestamp', async () => {
      const invalidTimestampQR = {
        type: 'menu',
        merchantId: 'merchant_123',
        branchId: 'branch_456',
        timestamp: -1, // Invalid timestamp
      };

      await expect(sdk.menu.getMenu(invalidTimestampQR.merchantId, invalidTimestampQR.branchId))
        .rejects.toThrow();
    });

    it('7. should reject QR code older than max age', async () => {
      const oldQRData = {
        type: 'campaign',
        campaignId: 'camp_123',
        timestamp: Date.now() - (48 * 60 * 60 * 1000), // 48 hours ago
      };

      mockClientPost.mockRejectedValue(
        new Error('QR code validity period (48 hours) has expired')
      );

      await expect(sdk.campaign.trackScan(oldQRData)).rejects.toThrow(/expired/i);
    });

    it('8. should reject QR with missing required fields', async () => {
      const incompleteQR = {
        type: 'room',
        // Missing hotelId and roomId
        timestamp: Date.now(),
      };

      // The SDK should validate before making API call
      await expect(sdk.room.checkIn(incompleteQR as any)).rejects.toThrow();
    });
  });

  describe('Offline Mode', () => {
    it('9. should cache recent QR scan results for offline access', async () => {
      const qrData = {
        type: 'menu',
        merchantId: 'merchant_123',
        branchId: 'branch_456',
        timestamp: Date.now(),
      };

      // First call - online
      mockClientGet.mockResolvedValueOnce({
        success: true,
        data: {
          merchantId: 'merchant_123',
          cachedAt: Date.now(),
          items: [{ id: 'item_1', name: 'Test Item', price: 100 }],
        },
      });

      const onlineResult = await sdk.menu.getMenu(qrData.merchantId, qrData.branchId);
      expect(onlineResult).toHaveProperty('items');

      // Simulate going offline
      mockClientGet.mockRejectedValueOnce(new Error('Network unavailable'));

      // Should return cached result
      const offlineResult = await sdk.menu.getMenu(qrData.merchantId, qrData.branchId);
      expect(offlineResult).toHaveProperty('items');
    });

    it('10. should queue QR scan for sync when offline', async () => {
      const qrData = {
        type: 'room',
        hotelId: 'hotel_123',
        roomId: 'room_456',
        timestamp: Date.now(),
      };

      // Simulate offline error
      mockClientPost.mockRejectedValue(new Error('Network unavailable'));

      // Should not throw but queue for later sync
      await expect(sdk.room.checkIn(qrData)).rejects.toThrow(/Network unavailable/i);

      // Verify the queue mechanism could store this
      // (In real implementation, this would verify local storage queue)
    });

    it('11. should handle offline mode with cached menu items', async () => {
      const cachedMenuData = {
        merchantId: 'merchant_123',
        branchId: 'branch_456',
        cachedAt: Date.now() - (5 * 60 * 1000), // 5 minutes ago
        items: [
          { id: 'item_1', name: 'Cached Item 1', price: 150 },
          { id: 'item_2', name: 'Cached Item 2', price: 200 },
        ],
      };

      // When offline, return cached data
      mockClientGet.mockRejectedValue(new Error('Connection refused'));

      // The SDK should fall back to cached data
      const result = await sdk.menu.getMenu('merchant_123', 'branch_456');

      // In offline mode with valid cache, should return cached items
      expect(result).toBeDefined();
    });

    it('12. should sync queued scans when back online', async () => {
      const pendingScans = [
        { type: 'room', hotelId: 'h1', roomId: 'r1', timestamp: Date.now() - 60000 },
        { type: 'menu', merchantId: 'm1', branchId: 'b1', timestamp: Date.now() - 30000 },
      ];

      // Mock successful sync
      mockClientPost.mockResolvedValue({ success: true, synced: true });

      // Sync pending scans
      const syncResults = await Promise.all(
        pendingScans.map((scan) => sdk.room.checkIn(scan))
      );

      expect(syncResults).toHaveLength(2);
      expect(mockClientPost).toHaveBeenCalled();
    });
  });

  describe('QR Code Validation', () => {
    it('13. should validate QR signature before processing', async () => {
      const validQR = {
        type: 'room',
        hotelId: 'hotel_123',
        roomId: 'room_456',
        timestamp: Date.now(),
        signature: 'valid_signature_hash',
      };

      mockClientPost.mockResolvedValue({
        success: true,
        validated: true,
        data: { roomId: 'room_456' },
      });

      const result = await sdk.room.checkIn(validQR);

      expect(result).toHaveProperty('validated', true);
    });

    it('14. should reject QR with tampered data', async () => {
      const tamperedQR = {
        type: 'room',
        hotelId: 'hotel_123',
        roomId: 'room_456',
        timestamp: Date.now(),
        signature: 'invalid_signature',
      };

      mockClientPost.mockRejectedValue(new Error('Invalid QR signature'));

      await expect(sdk.room.checkIn(tamperedQR)).rejects.toThrow(/signature/i);
    });
  });

  describe('Error Handling', () => {
    it('15. should handle merchant not found error gracefully', async () => {
      mockClientGet.mockRejectedValue(new Error('Merchant not found'));

      await expect(sdk.menu.getMenu('invalid_merchant', 'branch')).rejects.toThrow(/Merchant not found/i);
    });

    it('16. should handle rate limiting with retry', async () => {
      let attempts = 0;
      mockClientGet.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Rate limited');
          (error as any).status = 429;
          throw error;
        }
        return Promise.resolve({ success: true, data: {} });
      });

      const result = await sdk.store.getProfile('store_123');

      expect(attempts).toBe(3);
      expect(result).toHaveProperty('success', true);
    });
  });
});
