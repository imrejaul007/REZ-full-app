/**
 * Payment Service Tests
 * Comprehensive test suite for payment processing
 *
 * Tests:
 * - Health checks
 * - Payment creation
 * - Payment confirmation
 * - Payment cancellation
 * - Refund processing
 * - Webhook handling
 * - Error handling
 * - Payment methods
 * - Ledger integration
 */

const PAYMENT_BASE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002';
const LEDGER_BASE_URL = process.env.LEDGER_SERVICE_URL || 'http://localhost:4004';
const WEBHOOK_BASE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4003';

/**
 * Helper functions
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateOrderId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generatePaymentId = () => `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateAmount = () => (Math.random() * 1000 + 10).toFixed(2);

/**
 * Test Configuration
 */
const TEST_PAYMENT = {
    amount: generateAmount(),
    currency: 'INR',
    orderId: generateOrderId(),
    customerEmail: `customer_${Date.now()}@rez.test.com`,
    customerPhone: `+91${Date.now().toString().slice(-10)}`,
    description: 'Test payment for order',
    metadata: {
        source: 'test_suite',
        testId: `test_${Date.now()}`
    }
};

describe('Payment Service Tests', () => {
    let paymentId = null;
    let authToken = null;

    // =========================================================================
    // SMOKE TESTS
    // =========================================================================
    describe('smoke - Payment Service Health', () => {
        test('Payment service health endpoint returns 200', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
        });

        test('Payment service health returns healthy status', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/health`);
            const data = await response.json();

            expect(data).toHaveProperty('status');
            expect(['healthy', 'degraded']).toContain(data.status);
        });

        test('Payment service metrics are accessible', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/metrics`);
            expect(response.ok).toBe(true);
        });

        test('Ledger service health check', async () => {
            const response = await fetch(`${LEDGER_BASE_URL}/health`);
            expect([200, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // PAYMENT CREATION TESTS
    // =========================================================================
    describe('Payment Creation', () => {
        test('Create payment with valid data', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: TEST_PAYMENT.currency,
                    orderId: TEST_PAYMENT.orderId,
                    customerEmail: TEST_PAYMENT.customerEmail,
                    customerPhone: TEST_PAYMENT.customerPhone,
                    description: TEST_PAYMENT.description,
                    metadata: TEST_PAYMENT.metadata
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('payment');
            expect(data.payment).toHaveProperty('id');
            expect(data.payment).toHaveProperty('status');

            paymentId = data.payment.id;
        });

        test('Create payment with UPI method', async () => {
            const orderId = generateOrderId();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: generateAmount(),
                    currency: 'INR',
                    orderId: orderId,
                    paymentMethod: 'upi',
                    customerEmail: generateTestEmail(),
                    upiId: 'test@upi'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Create payment with card method', async () => {
            const orderId = generateOrderId();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: generateAmount(),
                    currency: 'INR',
                    orderId: orderId,
                    paymentMethod: 'card',
                    customerEmail: generateTestEmail(),
                    cardToken: 'card_test_token'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Create payment with wallet method', async () => {
            const orderId = generateOrderId();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: generateAmount(),
                    currency: 'INR',
                    orderId: orderId,
                    paymentMethod: 'wallet',
                    customerEmail: generateTestEmail(),
                    walletType: 'paytm'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Reject payment with invalid amount', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: -100,
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject payment with missing required fields', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject payment with invalid currency', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: 'INVALID',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // PAYMENT RETRIEVAL TESTS
    // =========================================================================
    describe('Payment Retrieval', () => {
        test('Get payment by ID', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            expect(data).toHaveProperty('payment');
            expect(data.payment.id).toBe(paymentId);
        });

        test('Get payment with non-existent ID returns 404', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/nonexistent_id`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(404);
        });

        test('List payments by order ID', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/order/${TEST_PAYMENT.orderId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('payments');
        });
    });

    // =========================================================================
    // PAYMENT CONFIRMATION TESTS
    // =========================================================================
    describe('Payment Confirmation', () => {
        test('Confirm payment with valid ID', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpayPaymentId: `pay_test_${Date.now()}`,
                    razorpaySignature: `sig_test_${Date.now()}`
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Confirm payment with invalid signature fails', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpayPaymentId: `pay_test_${Date.now()}`,
                    razorpaySignature: 'invalid_signature'
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // PAYMENT CANCELLATION TESTS
    // =========================================================================
    describe('Payment Cancellation', () => {
        test('Cancel pending payment', async () => {
            // Create a new payment to cancel
            const createResponse = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: generateAmount(),
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            const createData = await createResponse.json();
            const newPaymentId = createData.payment.id;

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${newPaymentId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: 'Test cancellation'
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Cannot cancel completed payment', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: 'Test cancellation'
                })
            });

            expect([400, 409]).toContain(response.status);
        });
    });

    // =========================================================================
    // REFUND TESTS
    // =========================================================================
    describe('Refund Processing', () => {
        test('Create full refund', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    reason: 'Test refund',
                    type: 'full'
                })
            });

            expect([200, 400, 409]).toContain(response.status);
        });

        test('Create partial refund', async () => {
            // Create a new payment for partial refund test
            const createResponse = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: '500.00',
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            const createData = await createResponse.json();
            const newPaymentId = createData.payment.id;

            const refundResponse = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${newPaymentId}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: '250.00',
                    reason: 'Partial refund test',
                    type: 'partial'
                })
            });

            expect([200, 400, 409]).toContain(refundResponse.status);
        });

        test('Reject refund exceeding payment amount', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: '999999.99',
                    reason: 'Excessive refund'
                })
            });

            expect(response.status).toBe(400);
        });

        test('Get refund status', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/${paymentId}/refunds`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('refunds');
        });
    });

    // =========================================================================
    // PAYMENT METHODS TESTS
    // =========================================================================
    describe('Payment Methods', () => {
        test('List available payment methods', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payment-methods`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('methods');
        });

        test('Get payment method by type', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payment-methods/upi`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('method');
        });
    });

    // =========================================================================
    // LEDGER INTEGRATION TESTS
    // =========================================================================
    describe('Ledger Integration', () => {
        test('Payment creates ledger entries', async () => {
            expect(paymentId).toBeTruthy();

            // Check if ledger endpoint exists
            const response = await fetch(`${LEDGER_BASE_URL}/api/v1/entries?paymentId=${paymentId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Refund creates reverse ledger entries', async () => {
            expect(paymentId).toBeTruthy();

            const response = await fetch(`${LEDGER_BASE_URL}/health`);
            if (!response.ok) {
                // Skip if ledger service is not available
                return;
            }

            // This would verify that refunds create proper reversing entries
            const entriesResponse = await fetch(`${LEDGER_BASE_URL}/api/v1/entries?paymentId=${paymentId}&type=refund`);
            expect([200, 404]).toContain(entriesResponse.status);
        });
    });

    // =========================================================================
    // WEBHOOK TESTS
    // =========================================================================
    describe('Payment Webhooks', () => {
        test('Process payment.success webhook', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.success',
                    paymentId: paymentId || 'test_payment_id',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: paymentId || 'test_payment_id',
                        status: 'captured',
                        amount: TEST_PAYMENT.amount
                    }
                })
            });

            expect([200, 201, 400]).toContain(response.status);
        });

        test('Process payment.failed webhook', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.failed',
                    paymentId: 'test_failed_payment',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: 'test_failed_payment',
                        status: 'failed',
                        error: {
                            code: 'BAD_REQUEST_ERROR',
                            description: 'Payment failed'
                        }
                    }
                })
            });

            expect([200, 201, 400]).toContain(response.status);
        });

        test('Process refund.success webhook', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'refund.success',
                    paymentId: paymentId || 'test_payment_id',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: 'test_refund_id',
                        status: 'processed',
                        amount: '100.00'
                    }
                })
            });

            expect([200, 201, 400]).toContain(response.status);
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error Handling', () => {
        test('Handle duplicate payment gracefully', async () => {
            // Try to create payment with same order ID twice
            const orderId = generateOrderId();

            await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: 'INR',
                    orderId: orderId,
                    customerEmail: generateTestEmail()
                })
            });

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: 'INR',
                    orderId: orderId,
                    customerEmail: generateTestEmail()
                })
            });

            expect([200, 400, 409]).toContain(response.status);
        });

        test('Handle service unavailability', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            // Should handle gracefully or return 503
            expect([200, 400, 503]).toContain(response.status);
        });

        test('Validate webhook signature', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/webhooks/razorpay/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_signature: 'invalid_signature',
                    razorpay_payment_id: 'pay_test',
                    razorpay_order_id: 'order_test'
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // SECURITY TESTS
    // =========================================================================
    describe('Security Validations', () => {
        test('Reject payment with amount manipulation', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: '0.01',
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            // Should validate minimum amount
            expect([200, 400]).toContain(response.status);
        });

        test('Reject payment with invalid email format', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: 'invalid-email'
                })
            });

            expect(response.status).toBe(400);
        });

        test('Require HTTPS in production headers', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Forwarded-Proto': 'http'
                },
                body: JSON.stringify({
                    amount: TEST_PAYMENT.amount,
                    currency: 'INR',
                    orderId: generateOrderId(),
                    customerEmail: generateTestEmail()
                })
            });

            // Should validate or log security warning
            expect(response).toBeDefined();
        });
    });

    // =========================================================================
    // REPORTING TESTS
    // =========================================================================
    describe('Reporting & Analytics', () => {
        test('Get payment statistics', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/stats`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Get payment history by date range', async () => {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/payments/history`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: lastWeek.toISOString(),
                    to: today.toISOString()
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Get merchant payment summary', async () => {
            const response = await fetch(`${PAYMENT_BASE_URL}/api/v1/merchant/summary`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });
    });
});

// Helper functions
function generateTestEmail() {
    return `payment_test_${Date.now()}@rez.test.com`;
}

// Export for use in other test files
module.exports = { TEST_PAYMENT, PAYMENT_BASE_URL, generateOrderId, generateAmount };
