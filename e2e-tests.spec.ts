import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.E2E_API_URL || 'http://localhost:3001';

test.describe('ReZ Ecosystem E2E Tests', () => {

  test.beforeAll(async ({ request }) => {
    // Verify services are running
    const healthResponse = await request.get(`${API_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
  });

  // ==========================================
  // FLOW 1: QR Scan → REZ Support Copilot → Transaction
  // ==========================================
  test.describe('Flow 1: QR Scan to Transaction', () => {

    test('Step 1: Scan QR Code', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/qr/scan/test-qr`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.qrType).toBeDefined();
    });

    test('Step 2: REZ Support Copilot Chat', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/copilot/chat`, {
        data: {
          message: 'Show me restaurants near me',
          userId: 'test-user',
          sessionId: 'test-session'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.response).toBeDefined();
    });

    test('Step 3: Get User Profile', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/profile/test-user`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.userId).toBe('test-user');
    });

    test('Step 4: Check Wallet Balance', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/wallet/test-user/balance`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.balance).toBeDefined();
    });

    test('Step 5: Create Order', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/orders`, {
        data: {
          userId: 'test-user',
          items: [{ productId: 'test-product', quantity: 1, price: 100 }],
          total: 100,
          qrType: 'restaurant'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.orderId).toBeDefined();
    });

    test('Step 6: Payment via Wallet', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/wallet/pay`, {
        data: {
          userId: 'test-user',
          orderId: 'test-order',
          amount: 100
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.transactionId).toBeDefined();
    });

    test('Step 7: Karma Points Awarded', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/karma/test-user/points`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.points).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // FLOW 2: DO App Agentic Chat
  // ==========================================
  test.describe('Flow 2: DO App Agentic Chat', () => {

    test('Step 1: Start Chat Session', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/agent/start`, {
        data: {
          userId: 'test-user',
          mode: 'voice',
          context: {}
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('Step 2: Send Voice Message', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/agent/message`, {
        data: {
          sessionId: 'test-session',
          message: 'Book a table for 2 tonight',
          type: 'voice'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('Step 3: Get Restaurant Options', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/restaurants/search`, {
        params: {
          location: 'bangalore',
          partySize: 2,
          time: 'tonight'
        }
      });
      expect(response.ok()).toBeTruthy();
    });

    test('Step 4: Create Booking', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/bookings`, {
        data: {
          userId: 'test-user',
          restaurantId: 'test-restaurant',
          partySize: 2,
          dateTime: new Date().toISOString()
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  // ==========================================
  // FLOW 3: Merchant POS Sale
  // ==========================================
  test.describe('Flow 3: Merchant POS Sale', () => {

    test('Step 1: Merchant Login', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/auth/merchant/login`, {
        data: {
          email: 'merchant@test.com',
          password: 'test-password'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
    });

    test('Step 2: Open POS Session', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/pos/session`, {
        data: {
          merchantId: 'test-merchant',
          mode: 'restaurant'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('Step 3: Add Items to Order', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/pos/items`, {
        data: {
          sessionId: 'test-session',
          items: [
            { productId: 'item-1', quantity: 2, price: 150 },
            { productId: 'item-2', quantity: 1, price: 200 }
          ]
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.total).toBe(500);
    });

    test('Step 4: Customer Payment', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/pos/pay`, {
        data: {
          sessionId: 'test-session',
          customerId: 'test-customer',
          paymentMethod: 'wallet'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('Step 5: Generate Invoice', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/pos/session/test-session/invoice`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.invoiceUrl).toBeDefined();
    });
  });

  // ==========================================
  // FLOW 4: Admin Dashboard (REE)
  // ==========================================
  test.describe('Flow 4: Admin Dashboard (REE)', () => {

    test('Step 1: Admin Login', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/auth/admin/login`, {
        data: {
          email: 'admin@rez.app',
          password: 'admin-password'
        }
      });
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('Step 2: Get Dashboard Stats', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/admin/dashboard/stats`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.revenue).toBeDefined();
      expect(data.data.users).toBeDefined();
      expect(data.data.orders).toBeDefined();
    });

    test('Step 3: Get REE Recommendations', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/ree/recommendations`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('Step 4: Execute REE Action', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/ree/execute`, {
        data: {
          action: 'optimize_pricing',
          params: { productId: 'test-product' }
        }
      });
      expect(response.ok()).toBeTruthy();
    });
  });

  // ==========================================
  // SMOKE TESTS: All Services Health
  // ==========================================
  test.describe('Smoke Tests: Service Health', () => {

    const services = [
      { name: 'API Gateway', url: `${API_URL}/health` },
      { name: 'Auth Service', url: `${API_URL}/api/v1/auth/health` },
      { name: 'Payment Service', url: `${API_URL}/api/v1/payment/health` },
      { name: 'Wallet Service', url: `${API_URL}/api/v1/wallet/health` },
      { name: 'Profile Service', url: `${API_URL}/api/v1/profile/health` },
      { name: 'Order Service', url: `${API_URL}/api/v1/orders/health` },
      { name: 'REZ Mind', url: `${API_URL}/api/v1/mind/health` },
      { name: 'Support Copilot', url: `${API_URL}/api/v1/copilot/health` },
      { name: 'REE', url: `${API_URL}/api/v1/ree/health` },
      { name: 'Intent Graph', url: `${API_URL}/api/v1/intent/health` }
    ];

    for (const service of services) {
      test(`${service.name} is healthy`, async ({ request }) => {
        const response = await request.get(service.url);
        expect(response.ok()).toBeTruthy();
      });
    }
  });

});
