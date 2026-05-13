# REZ INTEGRATION SPECIFICATIONS

**Version:** 1.0
**Date:** May 12, 2026
**Status:** Complete

---

# TABLE OF CONTENTS

1. [Integration Overview](#1-integration-overview)
2. [Service-to-Service Integrations](#2-service-to-service-integrations)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [API Contracts](#4-api-contracts)
5. [Error Handling](#5-error-handling)
6. [Authentication](#6-authentication)

---

# 1. INTEGRATION OVERVIEW

## Integration Philosophy

All services communicate through:
1. **Synchronous HTTP** - For real-time requests
2. **Event Bus (Redis + Kafka)** - For async events
3. **Shared Database** - For persistence (MongoDB)

## Communication Patterns

| Pattern | Use Case | Technology |
|---------|----------|------------|
| Request-Response | Expert needs data | HTTP POST |
| Pub-Sub | Notifications | Redis Pub/Sub |
| Event Streaming | Analytics | Kafka |
| Shared State | User profiles | MongoDB |

---

# 2. SERVICE-TO-SERVICE INTEGRATIONS

## 2.1 Orchestrator Integrations

### Orchestrator → Core Brain

```typescript
// File: rez-orchestrator-v2/src/services/messageProcessor.ts

const CORE_BRAIN_URL = process.env.CORE_BRAIN_URL || 'http://localhost:4072';

async enrichContext(request: OrchestrationRequest): Promise<EnrichedContext> {
  // Parallel calls for speed
  const [userContext, sessionContext, personalization] = await Promise.all([
    this.fetchUserContext(request.userId),
    this.fetchSessionContext(request.sessionId),
    this.fetchPersonalization(request.userId)
  ]);

  return {
    ...request,
    user: userContext,
    session: sessionContext,
    personalization
  };
}

private async fetchUserContext(userId: string): Promise<UserContext> {
  const response = await fetch(`${CORE_BRAIN_URL}/api/memory/${userId}`, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN }
  });
  return response.json();
}
```

### Orchestrator → Context Engine

```typescript
// Get routing decision
const contextDecision = await fetch(`${CONTEXT_ENGINE_URL}/api/routing/decide`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_TOKEN },
  body: JSON.stringify({
    sessionId: request.sessionId,
    merchantId: request.merchantId,
    entryPoint: request.channel
  })
});
```

### Orchestrator → Expert Agents

```typescript
// File: rez-orchestrator-v2/src/services/agentSwitcher.ts

async routeToExpert(
  request: OrchestrationRequest,
  expertType: string
): Promise<ExpertResponse> {
  const expertUrl = await this.agentRegistry.getExpertUrl(expertType);

  const response = await axios.post(`${expertUrl}/api/chat`, {
    message: request.message,
    userId: request.userId,
    merchantId: request.merchantId,
    sessionId: request.sessionId,
    context: request.context
  }, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    timeout: 5000
  });

  return response.data;
}
```

---

## 2.2 Expert Integrations

### Expert → Payment Service

```typescript
// File: Expert → Payment Integration

async processPayment(orderId: string, amount: number, method: string) {
  const response = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      orderId,
      amount,
      method,
      userId: this.userId,
      callbackUrl: `${ORCHESTRATOR_URL}/callback/payment`
    })
  });

  return response.json();
}
```

### Expert → Wallet Service

```typescript
// File: Expert → Wallet Integration

async deductCoins(userId: string, amount: number, reason: string) {
  const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/deduct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      userId,
      amount,
      type: 'REZ_COINS',
      reason,
      merchantId: this.merchantId
    })
  });

  return response.json();
}

async checkBalance(userId: string) {
  const response = await fetch(`${WALLET_SERVICE_URL}/api/wallet/${userId}/balance`, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN }
  });

  return response.json();
}
```

### Expert → Order Service

```typescript
// File: Expert → Order Integration

async createOrder(items: OrderItem[], paymentMethod: string) {
  const response = await fetch(`${ORDER_SERVICE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      userId: this.userId,
      merchantId: this.merchantId,
      items,
      paymentMethod,
      sessionId: this.sessionId
    })
  });

  return response.json();
}

async getOrderStatus(orderId: string) {
  const response = await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}`, {
    headers: { 'X-Internal-Token': INTERNAL_TOKEN }
  });

  return response.json();
}
```

### Expert → Booking Service

```typescript
// File: Expert → Booking Integration

async createBooking(bookingData: BookingData) {
  const response = await fetch(`${BOOKING_SERVICE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      userId: this.userId,
      merchantId: this.merchantId,
      ...bookingData
    })
  });

  return response.json();
}
```

### Expert → Notification Service

```typescript
// File: Expert → Notification Integration

async sendNotification(
  userId: string,
  template: string,
  data: Record<string, any>,
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' = 'WHATSAPP'
) {
  const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': INTERNAL_TOKEN
    },
    body: JSON.stringify({
      userId,
      channel,
      template,
      data,
      priority: 'HIGH'
    })
  });

  return response.json();
}
```

---

## 2.3 Commerce Integrations

### Payment → Wallet

```typescript
// File: Payment Service → Wallet

// On successful payment, credit cashback
async creditCashback(userId: string, amount: number, transactionId: string) {
  await fetch(`${WALLET_SERVICE_URL}/api/wallet/credit`, {
    method: 'POST',
    headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    body: JSON.stringify({
      userId,
      amount,
      type: 'CASHBACK',
      reference: transactionId
    })
  });
}
```

### Payment → Order

```typescript
// File: Payment Service → Order

// Update order status on payment success
async updateOrderStatus(orderId: string, status: string, transactionId: string) {
  await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    body: JSON.stringify({
      status,
      paymentTransactionId: transactionId
    })
  });
}
```

### Order → Inventory

```typescript
// File: Order Service → Catalog

// Check and reserve inventory
async reserveInventory(orderId: string, items: OrderItem[]) {
  for (const item of items) {
    await fetch(`${CATALOG_SERVICE_URL}/api/inventory/reserve`, {
      method: 'POST',
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
      body: JSON.stringify({
        productId: item.productId,
        quantity: item.quantity,
        orderId
      })
    });
  }
}
```

---

## 2.4 Notification Integrations

### Event Bus → Notification

```typescript
// File: Event Bus Subscriber → Notification Service

// Subscribe to events and trigger notifications
eventBus.subscribe('ORDER_CREATED', async (event) => {
  await notificationService.send({
    userId: event.payload.userId,
    template: 'order_confirmation',
    data: {
      orderId: event.payload.orderId,
      total: event.payload.total
    },
    channel: 'WHATSAPP'
  });
});

eventBus.subscribe('PAYMENT_SUCCESS', async (event) => {
  await notificationService.send({
    userId: event.payload.userId,
    template: 'payment_success',
    data: event.payload,
    channel: 'WHATSAPP'
  });
});
```

---

# 3. DATA FLOW DIAGRAMS

## 3.1 Order Creation Flow

```
User: "Order biryani"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CULINARY EXPERT                                                           │
│ Intent: ORDER_FOOD                                                       │
│                                                                         │
│ Create order payload:                                                   │
│ {                                                                       │
│   items: [{productId: "biryani_001", quantity: 1, price: 299}],      │
│   paymentMethod: "UPI"                                                  │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ POST /api/orders
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORDER SERVICE                                                             │
│ Create order record:                                                    │
│ {                                                                       │
│   orderId: "order_123",                                                │
│   status: "CREATED",                                                    │
│   total: 299                                                            │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ Publish: ORDER_CREATED
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT BUS                                                                │
│                                                                         │
│ Publish to channels:                                                    │
│ - analytics-service: ORDER_CREATED                                      │
│ - notification-service: ORDER_CREATED                                   │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ User selects payment method
         ▼
User: "Pay with UPI"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CULINARY EXPERT                                                           │
│ Call payment service:                                                    │
│ POST /api/payments/initiate                                             │
│ {                                                                       │
│   orderId: "order_123",                                                │
│   amount: 299,                                                         │
│   method: "UPI"                                                         │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ POST /api/payments/initiate
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAYMENT SERVICE                                                          │
│ Create Razorpay order:                                                  │
│ {                                                                       │
│   transactionId: "txn_abc",                                            │
│   status: "PENDING",                                                   │
│   paymentUrl: "https://rzp.io/..."                                    │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ User completes payment on Razorpay
         │
         ▼
Webhook: PAYMENT_SUCCESS
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAYMENT SERVICE                                                          │
│ 1. Update transaction status: SUCCESS                                   │
│ 2. Credit cashback to wallet                                          │
│ 3. Publish: PAYMENT_COMPLETED                                           │
│ 4. Call: PATCH /api/orders/order_123/status → PAID                   │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORDER SERVICE                                                           │
│ Update status: PAID → PREPARING → DELIVERED                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
User receives confirmation
```

---

## 3.2 Multi-Agent Collaboration Flow

```
User: "Book me a table and suggest what to eat"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR                                                             │
│                                                                         │
│ 1. Parse intent: BOOKING + FOOD_RECOMMENDATION                        │
│ 2. Priority: BOOKING (functional) + FOOD (domain)                     │
│ 3. Route: Culinary Expert (primary) + Support (collaborate)             │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ POST /api/chat
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CULINARY EXPERT                                                          │
│                                                                         │
│ 1. Load user preferences from Core Brain                               │
│ 2. Load restaurant menu from catalog                                   │
│ 3. Generate recommendations                                           │
│ 4. Prepare response with booking form                                  │
│                                                                         │
│ Response:                                                              │
│ "Based on your preferences, I recommend..."                             │
│ [Interactive booking card]                                              │
│ [Food recommendations carousel]                                         │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER CONFIRMS BOOKING                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         │ POST /api/bookings
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ BOOKING SERVICE                                                          │
│ Create reservation:                                                     │
│ {                                                                       │
│   bookingId: "book_456",                                                │
│   date: "2026-05-15",                                                  │
│   time: "19:00",                                                       │
│   guests: 2                                                            │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
User receives booking confirmation
```

---

# 4. API CONTRACTS

## 4.1 Internal Service API Contract

### Request Format

```typescript
interface InternalRequest<T = any> {
  // Required
  headers: {
    'Content-Type': 'application/json';
    'X-Internal-Token': string;  // Service authentication
    'X-Request-Id': string;       // Trace ID
  };

  // Optional
  timeout?: number;  // Default: 5000ms
}
```

### Response Format

```typescript
interface InternalResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    duration: number;
  };
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Downstream service error |
| TIMEOUT | 504 | Request timeout |

---

## 4.2 Event Contract

### Event Schema

```typescript
interface REZEvent {
  eventId: string;          // UUID
  eventType: string;          // e.g., ORDER_CREATED
  timestamp: string;          // ISO 8601
  version: string;           // Schema version

  source: {
    service: string;         // Service name
    instanceId: string;      // Instance ID
  };

  context: {
    userId?: string;
    merchantId?: string;
    sessionId?: string;
    traceId: string;         // Distributed tracing
  };

  payload: Record<string, any>;
}
```

### Event Types

| Category | Events |
|----------|--------|
| **User** | USER_SIGNED_UP, USER_LOGGED_IN, USER_PROFILE_UPDATED |
| **Order** | ORDER_CREATED, ORDER_PAID, ORDER_PREPARING, ORDER_DELIVERED, ORDER_COMPLETED, ORDER_CANCELLED |
| **Payment** | PAYMENT_INITIATED, PAYMENT_SUCCESS, PAYMENT_FAILED, REFUND_INITIATED, REFUND_COMPLETED |
| **Session** | SESSION_STARTED, SESSION_ENDED, AGENT_SWITCHED |
| **Commerce** | CART_CREATED, CART_UPDATED, BOOKING_CREATED, BOOKING_CONFIRMED |

---

# 5. ERROR HANDLING

## 5.1 Retry Policy

```typescript
// Exponential backoff for transient failures
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,    // 1 second
  maxDelay: 10000,        // 10 seconds
  backoffMultiplier: 2
};

async function withRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error)) {
        throw error;  // Don't retry non-retryable errors
      }

      const delay = Math.min(
        retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
        retryConfig.maxDelay
      );

      console.warn(`${context}: Retry ${attempt}/${retryConfig.maxRetries} in ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

// Retryable errors: 5xx, network errors, timeouts
// Non-retryable: 4xx, validation errors
```

## 5.2 Circuit Breaker

```typescript
// File: Circuit breaker implementation

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,      // Open after 5 failures
    private timeout = 60000     // Try again after 60s
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

## 5.3 Dead Letter Queue

```typescript
// Failed events go to DLQ for manual review

async function handleFailedEvent(event: REZEvent, error: Error) {
  await dlqService.publish({
    event,
    error: {
      message: error.message,
      stack: error.stack
    },
    failedAt: new Date(),
    retryCount: event._retryCount || 0
  });

  // Alert monitoring
  await monitoringService.alert({
    type: 'EVENT_PROCESSING_FAILED',
    eventType: event.eventType,
    error: error.message
  });
}
```

---

# 6. AUTHENTICATION

## 6.1 Internal Service Token

All service-to-service calls use `X-Internal-Token` header:

```typescript
// Token format: JSON Web Token (JWT)
const tokenPayload = {
  iss: 'rez-system',
  service: 'orchestrator',
  iat: Date.now(),
  exp: Date.now() + 3600000  // 1 hour
};

// Token is generated by Auth Service and distributed to all services
```

## 6.2 Token Validation

```typescript
// File: Middleware/auth.ts

async function validateInternalToken(token: string): Promise<ServiceIdentity> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate service is allowed
    if (!ALLOWED_SERVICES.includes(decoded.service)) {
      throw new Error('Service not authorized');
    }

    return decoded as ServiceIdentity;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}

// Middleware usage
app.use('/api', async (req, res, next) => {
  const token = req.headers['x-internal-token'];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    req.serviceIdentity = await validateInternalToken(token as string);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
```

## 6.3 Service Registry Authentication

```typescript
// Register service with token
await fetch(`${REGISTRY_URL}/api/registry/register`, {
  method: 'POST',
  headers: { 'X-Internal-Token': ADMIN_TOKEN },
  body: JSON.stringify({
    name: 'culinary-expert',
    url: 'http://localhost:3001',
    type: 'domain',
    capabilities: ['FOOD', 'MENU', 'ORDER'],
    token: generateServiceToken('culinary-expert')
  })
});
```

---

# APPENDIX: INTEGRATION CHECKLIST

## New Service Integration

When adding a new service, ensure:

- [ ] Service registered in Agent Registry
- [ ] Health check endpoint implemented
- [ ] Internal auth token configured
- [ ] Error handling with retry logic
- [ ] Circuit breaker for external calls
- [ ] Events published to Event Bus
- [ ] Metrics exported
- [ ] Logs structured
- [ ] API documented
- [ ] Integration tests written

---

**Document Version:** 1.0
**Last Updated:** May 12, 2026
