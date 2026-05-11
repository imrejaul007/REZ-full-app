/**
 * Integration Tests for ReZ Ecosystem Services
 *
 * These tests verify the integration between services and their APIs.
 * Run with: npm test -- tests/services-integration.test.ts
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost';
const DELIVERY_PORT = process.env.DELIVERY_PORT || '3005';
const ANALYTICS_PORT = process.env.ANALYTICS_PORT || '3007';
const PAYMENT_PORT = process.env.PAYMENT_PORT || '3008';
const JOURNEY_PORT = process.env.JOURNEY_PORT || '3009';
const GDPR_PORT = process.env.GDPR_PORT || '4021';
const VALIDATION_PORT = process.env.VALIDATION_PORT || '4022';
const AUDIT_PORT = process.env.AUDIT_PORT || '3025';
const CURRENCY_PORT = process.env.CURRENCY_PORT || '4026';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('ReZ Services Integration Tests', () => {
  describe('Health Checks', () => {
    test('rez-delivery-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${DELIVERY_PORT}/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('rez-analytics-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${ANALYTICS_PORT}/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('rez-payment-links-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${PAYMENT_PORT}/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('rez-journey-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${JOURNEY_PORT}/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('rez-gdpr-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${GDPR_PORT}/api/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('rez-validation-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${VALIDATION_PORT}/health`);
      expect(response.ok).toBe(true);
    });

    test('rez-audit-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${AUDIT_PORT}/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('rez-currency-service health check', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/health`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });
  });

  describe('Delivery Service API', () => {
    let createdDeliveryId: string;
    let createdDriverId: string;

    test('create a delivery', async () => {
      const response = await fetch(`${BASE_URL}:${DELIVERY_PORT}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `order_${Date.now()}`,
          customerId: 'customer_123',
          pickup: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: '123 Main St, Bangalore'
          },
          dropoff: {
            latitude: 12.9352,
            longitude: 77.6245,
            address: '456 Oak Ave, Bangalore'
          },
          packageDetails: {
            dimensions: { length: 30, width: 20, height: 10 },
            description: 'Test package'
          },
          pricing: {
            basePrice: 50
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      createdDeliveryId = data.data.id;
    });

    test('get delivery by ID', async () => {
      const response = await fetch(`${BASE_URL}:${DELIVERY_PORT}/api/deliveries/${createdDeliveryId}`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('pending');
    });

    test('list deliveries', async () => {
      const response = await fetch(`${BASE_URL}:${DELIVERY_PORT}/api/deliveries?limit=10`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('create a driver', async () => {
      const response = await fetch(`${BASE_URL}:${DELIVERY_PORT}/api/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `user_${Date.now()}`,
          name: 'Test Driver',
          email: 'driver@test.com',
          phone: '+919876543210',
          vehicle: {
            type: 'motorcycle',
            licensePlate: 'KA-01-AB-1234'
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      createdDriverId = data.data.id;
    });

    test('find nearby drivers', async () => {
      const response = await fetch(
        `${BASE_URL}:${DELIVERY_PORT}/api/drivers/nearby?latitude=12.9716&longitude=77.5946&radius=10`
      );
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Analytics Service API', () => {
    test('get dashboard summary', async () => {
      const response = await fetch(`${BASE_URL}:${ANALYTICS_PORT}/api/dashboard`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('get KPIs', async () => {
      const response = await fetch(`${BASE_URL}:${ANALYTICS_PORT}/api/kpis`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('get charts', async () => {
      const response = await fetch(`${BASE_URL}:${ANALYTICS_PORT}/api/charts/all`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('revenueBar');
      expect(data.data).toHaveProperty('orderLine');
    });

    test('get aggregation', async () => {
      const response = await fetch(
        `${BASE_URL}:${ANALYTICS_PORT}/api/aggregation/revenue?period=daily`
      );
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Payment Links Service API', () => {
    let createdPaymentLinkId: string;

    test('create payment link', async () => {
      const response = await fetch(`${BASE_URL}:${PAYMENT_PORT}/api/payment-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: 'merchant_123',
          amount: 500,
          purpose: 'Test Payment',
          customerName: 'Test Customer',
          customerPhone: '+919876543210',
          customerEmail: 'test@example.com'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
      expect(data.data.shortUrl).toBeDefined();
      expect(data.data.qrCodeDataUrl).toBeDefined();
      createdPaymentLinkId = data.data.id;
    });

    test('get payment link', async () => {
      const response = await fetch(`${BASE_URL}:${PAYMENT_PORT}/api/payment-links/${createdPaymentLinkId}`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.amount).toBe(500);
    });

    test('get payment status', async () => {
      const response = await fetch(`${BASE_URL}:${PAYMENT_PORT}/api/payment-links/${createdPaymentLinkId}/status`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('pending');
    });

    test('list payment links', async () => {
      const response = await fetch(`${BASE_URL}:${PAYMENT_PORT}/api/payment-links`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Journey Service API', () => {
    let createdJourneyId: string;

    test('create journey', async () => {
      const response = await fetch(`${BASE_URL}:${JOURNEY_PORT}/api/journeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Test Journey ${Date.now()}`,
          description: 'Test journey description',
          trigger: {
            type: 'signup'
          },
          steps: [
            {
              name: 'Welcome Step',
              type: 'entry',
              config: {}
            }
          ]
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      createdJourneyId = data.data.id;
    });

    test('get journey', async () => {
      const response = await fetch(`${BASE_URL}:${JOURNEY_PORT}/api/journeys/${createdJourneyId}`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('draft');
    });

    test('activate journey', async () => {
      const response = await fetch(`${BASE_URL}:${JOURNEY_PORT}/api/journeys/${createdJourneyId}/activate`, {
        method: 'POST'
      });
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('trigger event', async () => {
      const response = await fetch(`${BASE_URL}:${JOURNEY_PORT}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'signup',
          customerId: 'customer_123',
          data: {}
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GDPR Service API', () => {
    test('create data request', async () => {
      const response = await fetch(`${BASE_URL}:${GDPR_PORT}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_123',
          type: 'access'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('get statistics', async () => {
      const response = await fetch(`${BASE_URL}:${GDPR_PORT}/api/stats`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('get active privacy policy', async () => {
      const response = await fetch(`${BASE_URL}:${GDPR_PORT}/api/privacy-policy/active`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Validation Service API', () => {
    test('validate valid email', async () => {
      const response = await fetch(`${BASE_URL}:${VALIDATION_PORT}/api/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            email: { type: 'email', required: true }
          },
          data: {
            email: 'test@example.com'
          }
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('detect XSS attack', async () => {
      const response = await fetch(`${BASE_URL}:${VALIDATION_PORT}/api/sanitize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: '<script>alert("xss")</script>'
        })
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Audit Service API', () => {
    test('log audit event', async () => {
      const response = await fetch(`${BASE_URL}:${AUDIT_PORT}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'data.create',
          actor: {
            id: 'user_123',
            type: 'user',
            name: 'Test User'
          },
          resource: {
            type: 'order',
            id: 'order_456'
          },
          action: {
            operation: 'create',
            method: 'POST'
          },
          status: 'success'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });

    test('query audit events', async () => {
      const response = await fetch(`${BASE_URL}:${AUDIT_PORT}/api/audit?limit=10`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('get audit summary', async () => {
      const response = await fetch(`${BASE_URL}:${AUDIT_PORT}/api/audit/summary`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('get compliance status', async () => {
      const response = await fetch(`${BASE_URL}:${AUDIT_PORT}/api/compliance/status`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Currency Service API', () => {
    test('get supported currencies', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/currencies`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('get currency details', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/currencies/USD`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.code).toBe('USD');
    });

    test('get exchange rates', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/rates`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.baseCurrency).toBe('USD');
    });

    test('get specific exchange rate', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/rates/USD/EUR`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.fromCurrency).toBe('USD');
      expect(data.data.toCurrency).toBe('EUR');
    });

    test('convert currency', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          from: 'USD',
          to: 'EUR'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.originalAmount).toBe(100);
      expect(data.data.convertedAmount).toBeGreaterThan(0);
      expect(data.data.rate).toBeGreaterThan(0);
    });

    test('calculate fee', async () => {
      const response = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          currency: 'USD',
          feeType: 'transaction',
          percentage: 2.5
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.feeAmount).toBe(2.5);
      expect(data.data.totalAmount).toBe(102.5);
    });

    test('format currency', async () => {
      const response = await fetch(
        `${BASE_URL}:${CURRENCY_PORT}/api/format?amount=1234567.89&currency=USD`
      );
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.formatted).toContain('$');
    });
  });

  describe('Cross-Service Integration', () => {
    test('delivery service uses currency service for pricing', async () => {
      const deliveryResponse = await fetch(`${BASE_URL}:${DELIVERY_PORT}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: `order_${Date.now()}`,
          customerId: 'customer_123',
          pickup: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: '123 Main St'
          },
          dropoff: {
            latitude: 12.9352,
            longitude: 77.6245,
            address: '456 Oak Ave'
          },
          packageDetails: {
            dimensions: { length: 30, width: 20, height: 10 },
            description: 'Test'
          },
          pricing: {
            basePrice: 50
          }
        })
      });

      expect(deliveryResponse.ok).toBe(true);

      const currencyResponse = await fetch(`${BASE_URL}:${CURRENCY_PORT}/api/rates/USD/INR`);
      expect(currencyResponse.ok).toBe(true);
    });

    test('payment links service audit trail', async () => {
      await fetch(`${BASE_URL}:${AUDIT_PORT}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'payment.link_created',
          actor: { id: 'system', type: 'service' },
          resource: { type: 'payment_link', id: 'test_link' },
          action: { operation: 'create', method: 'POST' },
          status: 'success'
        })
      });

      const auditResponse = await fetch(`${BASE_URL}:${AUDIT_PORT}/api/audit?eventTypes=payment.link_created`);
      expect(auditResponse.ok).toBe(true);
    });
  });
});

describe('Service Configuration', () => {
  test('all services have correct ports in environment', () => {
    const services = [
      { name: 'delivery', port: DELIVERY_PORT },
      { name: 'analytics', port: ANALYTICS_PORT },
      { name: 'payment-links', port: PAYMENT_PORT },
      { name: 'journey', port: JOURNEY_PORT },
      { name: 'gdpr', port: GDPR_PORT },
      { name: 'validation', port: VALIDATION_PORT },
      { name: 'audit', port: AUDIT_PORT },
      { name: 'currency', port: CURRENCY_PORT }
    ];

    services.forEach(service => {
      expect(service.port).toBeDefined();
      expect(parseInt(service.port)).toBeGreaterThan(0);
    });
  });
});
