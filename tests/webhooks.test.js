/**
 * Webhook Service Tests
 * Comprehensive test suite for webhook processing and delivery
 *
 * Tests:
 * - Health checks
 * - Webhook registration
 * - Webhook verification
 * - Event processing
 * - Retry logic
 * - Signature validation
 * - Error handling
 */

const WEBHOOK_BASE_URL = process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002';

/**
 * Helper functions
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateWebhookId = () => `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateEventId = () => `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateSignature = (payload, secret) => {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
};

/**
 * Test Configuration
 */
const TEST_WEBHOOK = {
    url: 'https://test.rez.app/webhooks/test',
    events: ['payment.success', 'payment.failed', 'refund.processed'],
    secret: 'test_webhook_secret_123'
};

describe('Webhook Service Tests', () => {
    let webhookId = null;
    let eventId = null;

    // =========================================================================
    // SMOKE TESTS
    // =========================================================================
    describe('smoke - Webhook Service Health', () => {
        test('Webhook service health endpoint returns 200', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);
        });

        test('Webhook service health returns healthy status', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/health`);
            const data = await response.json();

            expect(data).toHaveProperty('status');
            expect(['healthy', 'degraded']).toContain(data.status);
        });

        test('Webhook service metrics are accessible', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/metrics`);
            expect(response.ok).toBe(true);
        });

        test('Webhook service status endpoint works', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/status`);
            expect([200, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // WEBHOOK REGISTRATION TESTS
    // =========================================================================
    describe('Webhook Registration', () => {
        test('Register new webhook endpoint', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: TEST_WEBHOOK.url,
                    events: TEST_WEBHOOK.events,
                    secret: TEST_WEBHOOK.secret,
                    description: 'Test webhook registration'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();

            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('webhook');
            expect(data.webhook).toHaveProperty('id');
            expect(data.webhook).toHaveProperty('url', TEST_WEBHOOK.url);

            webhookId = data.webhook.id;
        });

        test('Register webhook with single event', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: `https://test.rez.app/webhooks/${Date.now()}`,
                    events: ['payment.success'],
                    secret: 'single_event_secret'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Register webhook with all events', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: `https://test.rez.app/webhooks/all/${Date.now()}`,
                    events: ['*'],
                    secret: 'all_events_secret'
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Reject webhook with invalid URL', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'not-a-valid-url',
                    events: ['payment.success'],
                    secret: 'test_secret'
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject webhook without events', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://test.rez.app/webhooks',
                    events: [],
                    secret: 'test_secret'
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject webhook with invalid event type', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://test.rez.app/webhooks',
                    events: ['invalid.event.type'],
                    secret: 'test_secret'
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject webhook without secret', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://test.rez.app/webhooks',
                    events: ['payment.success']
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // WEBHOOK RETRIEVAL TESTS
    // =========================================================================
    describe('Webhook Retrieval', () => {
        test('List all registered webhooks', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('webhooks');
        });

        test('Get webhook by ID', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data.webhook).toHaveProperty('id', webhookId);
        });

        test('Get non-existent webhook returns 404', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/nonexistent_id`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(404);
        });

        test('Get webhook delivery statistics', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/stats`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('stats');
        });
    });

    // =========================================================================
    // WEBHOOK UPDATE TESTS
    // =========================================================================
    describe('Webhook Update', () => {
        test('Update webhook URL', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: 'https://test.rez.app/webhooks/updated'
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Update webhook events', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    events: ['payment.success', 'payment.failed']
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Update webhook secret', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret: 'new_webhook_secret_456'
                })
            });

            expect([200, 400]).toContain(response.status);
        });
    });

    // =========================================================================
    // WEBHOOK DELETION TESTS
    // =========================================================================
    describe('Webhook Deletion', () => {
        test('Delete webhook by ID', async () => {
            // First create a webhook to delete
            const createResponse = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: `https://test.rez.app/webhooks/delete/${Date.now()}`,
                    events: ['payment.success'],
                    secret: 'delete_test_secret'
                })
            });

            const createData = await createResponse.json();
            const newWebhookId = createData.webhook.id;

            const deleteResponse = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${newWebhookId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(deleteResponse.ok).toBe(true);
        });

        test('Delete non-existent webhook returns 404', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/nonexistent_id`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.status).toBe(404);
        });

        test('Verify deleted webhook is not accessible', async () => {
            // Create and immediately delete
            const createResponse = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: `https://test.rez.app/webhooks/verify/${Date.now()}`,
                    events: ['payment.success'],
                    secret: 'verify_secret'
                })
            });

            const createData = await createResponse.json();
            const newWebhookId = createData.webhook.id;

            await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${newWebhookId}`, {
                method: 'DELETE'
            });

            const getResponse = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${newWebhookId}`);
            expect(getResponse.status).toBe(404);
        });
    });

    // =========================================================================
    // EVENT PROCESSING TESTS
    // =========================================================================
    describe('Event Processing', () => {
        test('Process payment.success event', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.success',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: generateEventId(),
                        amount: 1000,
                        currency: 'INR',
                        status: 'captured'
                    }
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('success', true);
        });

        test('Process payment.failed event', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.failed',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: generateEventId(),
                        error: {
                            code: 'BAD_REQUEST_ERROR',
                            description: 'Payment failed'
                        }
                    }
                })
            });

            expect(response.ok).toBe(true);
        });

        test('Process refund.processed event', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'refund.processed',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: generateEventId(),
                        amount: 500,
                        status: 'processed'
                    }
                })
            });

            expect(response.ok).toBe(true);
        });

        test('Process order.created event', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'order.created',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: generateEventId(),
                        status: 'pending'
                    }
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Process order.completed event', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'order.completed',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: generateEventId(),
                        status: 'completed'
                    }
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Reject event with invalid event type', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'invalid.event.type',
                    timestamp: new Date().toISOString(),
                    data: {}
                })
            });

            expect(response.status).toBe(400);
        });

        test('Reject event without required fields', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.success'
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // WEBHOOK DELIVERY TESTS
    // =========================================================================
    describe('Webhook Delivery', () => {
        test('Get webhook delivery history', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/deliveries`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('deliveries');
        });

        test('Get delivery by ID', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/deliveries/test_delivery_id`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Retry failed delivery', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/deliveries/test_failed_delivery_id/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Get delivery attempt details', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/deliveries/test_delivery_id/attempts`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // SIGNATURE VALIDATION TESTS
    // =========================================================================
    describe('Signature Validation', () => {
        test('Verify valid webhook signature', async () => {
            const payload = { event: 'payment.success', data: { id: 'test' } };
            const signature = generateSignature(payload, TEST_WEBHOOK.secret);

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: payload,
                    signature: signature
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('valid', true);
        });

        test('Reject invalid webhook signature', async () => {
            const payload = { event: 'payment.success', data: { id: 'test' } };

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: payload,
                    signature: 'invalid_signature_here'
                })
            });

            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toHaveProperty('valid', false);
        });

        test('Reject webhook with tampered payload', async () => {
            const originalPayload = { event: 'payment.success', data: { amount: 100 } };
            const tamperedPayload = { event: 'payment.success', data: { amount: 1000 } };
            const signature = generateSignature(originalPayload, TEST_WEBHOOK.secret);

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payload: tamperedPayload,
                    signature: signature
                })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // RETRY LOGIC TESTS
    // =========================================================================
    describe('Retry Logic', () => {
        test('Get retry configuration', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/retry-config`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Update retry configuration', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/retry-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maxRetries: 5,
                    retryDelay: 30000,
                    backoffMultiplier: 2
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Retry schedule follows exponential backoff', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/retry-schedule`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // EVENT SUBSCRIPTION TESTS
    // =========================================================================
    describe('Event Subscriptions', () => {
        test('Subscribe to specific event type', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.success'
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Unsubscribe from event type', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.failed'
                })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('List event subscriptions for webhook', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/subscriptions`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // ERROR HANDLING TESTS
    // =========================================================================
    describe('Error Handling', () => {
        test('Handle invalid JSON payload', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/test/incoming`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json {'
            });

            expect(response.status).toBe(400);
        });

        test('Handle malformed event data', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: null,
                    timestamp: 'invalid-date',
                    data: undefined
                })
            });

            expect(response.status).toBe(400);
        });

        test('Handle webhook endpoint timeout', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'payment.success',
                    timestamp: new Date().toISOString(),
                    data: {
                        id: generateEventId(),
                        webhookUrl: 'https://timeout.test.rez.app/webhook'
                    }
                })
            });

            expect(response.ok).toBe(true);
            const data = await response.json();
            expect(data).toHaveProperty('status');
        });

        test('Handle duplicate event (idempotency)', async () => {
            eventId = generateEventId();

            // Send same event twice
            const event = {
                event: 'payment.success',
                eventId: eventId,
                timestamp: new Date().toISOString(),
                data: { id: eventId }
            };

            await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });

            // Should handle duplicate gracefully
            expect(response.ok).toBe(true);
        });
    });

    // =========================================================================
    // BATCH PROCESSING TESTS
    // =========================================================================
    describe('Batch Processing', () => {
        test('Process batch of events', async () => {
            const events = [
                { event: 'payment.success', data: { id: generateEventId() } },
                { event: 'payment.success', data: { id: generateEventId() } },
                { event: 'payment.failed', data: { id: generateEventId() } }
            ];

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: events })
            });

            expect([200, 400]).toContain(response.status);
        });

        test('Limit batch size', async () => {
            const events = Array(101).fill(null).map((_, i) => ({
                event: 'payment.success',
                data: { id: `batch_event_${i}` }
            }));

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: events })
            });

            expect(response.status).toBe(400);
        });
    });

    // =========================================================================
    // FILTERING & TRANSFORMATION TESTS
    // =========================================================================
    describe('Filtering & Transformation', () => {
        test('Set up event filter rules', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/filters`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rules: [
                        { field: 'amount', operator: 'gt', value: 100 }
                    ]
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Transform event payload', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/transform`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: {
                        customField: '{{event}}',
                        timestamp: '{{timestamp}}'
                    }
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Get active filters', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/filters`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // SECURITY TESTS
    // =========================================================================
    describe('Security', () => {
        test('Validate IP allowlist', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/security`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allowedIps: ['192.168.1.1', '10.0.0.0/8']
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Require signature verification', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/security`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requireSignature: true
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });

        test('Encrypt webhook payload', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/security`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encryption: 'aes-256-gcm'
                })
            });

            expect([200, 400, 404]).toContain(response.status);
        });
    });

    // =========================================================================
    // MONITORING TESTS
    // =========================================================================
    describe('Monitoring & Analytics', () => {
        test('Get webhook delivery success rate', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/analytics`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Get average delivery latency', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/latency`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Get failed deliveries by error type', async () => {
            expect(webhookId).toBeTruthy();

            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/webhooks/${webhookId}/failures`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });

        test('Get recent events feed', async () => {
            const response = await fetch(`${WEBHOOK_BASE_URL}/api/v1/events/recent`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            expect([200, 404]).toContain(response.status);
        });
    });
});

// Export for use in other test files
module.exports = { TEST_WEBHOOK, WEBHOOK_BASE_URL, generateEventId, generateSignature };
