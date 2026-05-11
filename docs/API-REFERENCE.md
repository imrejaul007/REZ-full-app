# ReZ Platform API Reference

**Version:** 2.0.0
**Last Updated:** 2026-05-11
**Base URL:** `https://api.rezplatform.com`

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [Core Services](#core-services)
   - [Order Service](#order-service-rez-order-service)
   - [Payment Service](#payment-service-rez-payment-service)
   - [Wallet Service](#wallet-service-rez-wallet-service)
6. [Analytics Services](#analytics-services)
   - [Analytics v2](#analytics-v2-rez-analytics-v2)
7. [Customer Services](#customer-services)
   - [Customer Platform](#customer-platform-rez-customer-platform)
8. [Delivery Services](#delivery-services)
   - [Delivery Service](#delivery-service-rez-delivery-service)
9. [Staff Services](#staff-services)
   - [Staff Service](#staff-service-rez-staff-service)
10. [Capital Services](#capital-services)
    - [ReZ Capital](#rez-capital-rez-capital-service)
11. [Integration APIs](#integration-apis)
    - [Integration Layer](#integration-layer-rez-integration-layer)
12. [Webhooks](#webhooks)
13. [SDKs & Libraries](#sdks--libraries)

---

## Getting Started

### Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.rezplatform.com` |
| Staging | `https://api-staging.rezplatform.com` |
| Development | `https://api-dev.rezplatform.com` |

### Request Format

All API requests must include the following headers:

```http
Content-Type: application/json
Accept: application/json
X-API-Version: 2.0
X-Request-ID: <uuid>
```

### Response Format

All responses follow a consistent envelope format:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-05-11T12:00:00Z",
    "version": "2.0"
  }
}
```

---

## Authentication

### API Key Authentication

Include your API key in the `Authorization` header:

```http
Authorization: Bearer <your-api-key>
```

### OAuth 2.0

For user-facing applications, use OAuth 2.0 with the following flows:

| Flow | Use Case |
|------|----------|
| Authorization Code | Web applications with server-side callbacks |
| Client Credentials | Server-to-server communication |
| Refresh Token | Obtaining new access tokens |

### Token Endpoints

```http
POST /oauth/token
POST /oauth/authorize
POST /oauth/revoke
```

### Example Token Request

```bash
curl -X POST https://api.rezplatform.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "scope": "orders:read orders:write"
  }'
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "scope": "orders:read orders:write"
}
```

---

## Rate Limiting

Rate limits are applied per API key and vary by endpoint tier.

| Tier | Requests/Minute | Requests/Hour | Burst |
|------|----------------|---------------|-------|
| Free | 60 | 1,000 | 10 |
| Starter | 300 | 10,000 | 50 |
| Professional | 1,000 | 50,000 | 100 |
| Enterprise | 5,000 | Unlimited | 500 |

### Rate Limit Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
X-RateLimit-Retry-After: 60
```

### Handling Rate Limits

When rate limited, the API returns a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server-side error |
| 503 | Service Unavailable | Service temporarily down |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | No valid authentication provided |
| `INVALID_TOKEN` | Token is malformed or expired |
| `PERMISSION_DENIED` | Insufficient permissions for action |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `VALIDATION_ERROR` | Request body validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Unexpected server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## Core Services

### Order Service (rez-order-service)

The Order Service manages the complete order lifecycle including creation, updates, tracking, and fulfillment.

#### Base URL
```
https://api.rezplatform.com/api/v1/orders
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create a new order |
| GET | `/api/v1/orders` | List orders with filtering |
| GET | `/api/v1/orders/:id` | Get order by ID |
| PUT | `/api/v1/orders/:id` | Update order |
| DELETE | `/api/v1/orders/:id` | Cancel order |
| POST | `/api/v1/orders/:id/items` | Add items to order |
| PUT | `/api/v1/orders/:id/items/:itemId` | Update order item |
| DELETE | `/api/v1/orders/:id/items/:itemId` | Remove order item |
| POST | `/api/v1/orders/:id/confirm` | Confirm order |
| POST | `/api/v1/orders/:id/prepare` | Mark order as preparing |
| POST | `/api/v1/orders/:id/complete` | Mark order as completed |
| POST | `/api/v1/orders/:id/refund` | Process refund |
| GET | `/api/v1/orders/:id/history` | Get order history |
| POST | `/api/v1/orders/bulk` | Create multiple orders |

---

##### POST /api/v1/orders

Create a new order.

**Request Body:**

```json
{
  "merchantId": "mer_abc123",
  "customerId": "cust_xyz789",
  "type": "dine-in",
  "items": [
    {
      "productId": "prod_123",
      "name": "Margherita Pizza",
      "quantity": 2,
      "unitPrice": 12.99,
      "modifiers": [
        {
          "id": "mod_001",
          "name": "Extra Cheese",
          "price": 1.50
        }
      ],
      "notes": "No onions"
    }
  ],
  "tableId": "table_456",
  "guestCount": 4,
  "paymentMethod": "card",
  "couponCode": "SAVE10",
  "metadata": {
    "source": "pos",
    "sessionId": "sess_abc123"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "ord_789xyz",
    "orderNumber": "ORD-2026-0511001",
    "merchantId": "mer_abc123",
    "customerId": "cust_xyz789",
    "type": "dine-in",
    "status": "pending",
    "items": [
      {
        "id": "item_001",
        "productId": "prod_123",
        "name": "Margherita Pizza",
        "quantity": 2,
        "unitPrice": 12.99,
        "modifiers": [...],
        "subtotal": 28.98
      }
    ],
    "subtotal": 28.98,
    "tax": 2.61,
    "discount": 3.16,
    "total": 28.43,
    "createdAt": "2026-05-11T12:00:00Z",
    "updatedAt": "2026-05-11T12:00:00Z"
  }
}
```

---

##### GET /api/v1/orders

List orders with filtering and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| merchantId | string | Filter by merchant |
| customerId | string | Filter by customer |
| status | string | Filter by status |
| type | string | Filter by order type |
| fromDate | ISO8601 | Start date filter |
| toDate | ISO8601 | End date filter |
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20, max: 100) |
| sort | string | Sort field (default: -createdAt) |

**Example Request:**

```bash
curl -X GET "https://api.rezplatform.com/api/v1/orders?merchantId=mer_abc123&status=completed&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ord_789xyz",
      "orderNumber": "ORD-2026-0511001",
      "status": "completed",
      "total": 28.43,
      "createdAt": "2026-05-11T12:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

##### GET /api/v1/orders/:id

Get a specific order by ID.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "ord_789xyz",
    "orderNumber": "ORD-2026-0511001",
    "merchantId": "mer_abc123",
    "customerId": "cust_xyz789",
    "type": "dine-in",
    "status": "preparing",
    "items": [...],
    "subtotal": 28.98,
    "tax": 2.61,
    "discount": 3.16,
    "total": 28.43,
    "paymentStatus": "paid",
    "fulfillmentStatus": "preparing",
    "estimatedReadyTime": "2026-05-11T12:25:00Z",
    "history": [
      {
        "status": "pending",
        "timestamp": "2026-05-11T12:00:00Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2026-05-11T12:01:00Z"
      },
      {
        "status": "preparing",
        "timestamp": "2026-05-11T12:05:00Z"
      }
    ],
    "createdAt": "2026-05-11T12:00:00Z",
    "updatedAt": "2026-05-11T12:05:00Z"
  }
}
```

---

##### PUT /api/v1/orders/:id

Update an existing order.

**Request Body:**

```json
{
  "items": [...],
  "notes": "Please deliver to back entrance",
  "priority": "high"
}
```

---

##### DELETE /api/v1/orders/:id

Cancel an order.

**Request Body:**

```json
{
  "reason": "Customer requested cancellation",
  "notifyCustomer": true
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "ord_789xyz",
    "status": "cancelled",
    "cancellationReason": "Customer requested cancellation",
    "cancelledAt": "2026-05-11T12:10:00Z",
    "refundStatus": "processing"
  }
}
```

---

##### POST /api/v1/orders/:id/refund

Process a refund for an order.

**Request Body:**

```json
{
  "amount": 14.21,
  "reason": "Partial refund - item unavailable",
  "items": ["item_001"],
  "initiatedBy": "merchant"
}
```

---

### Payment Service (rez-payment-service)

The Payment Service handles all payment processing, transactions, and settlements.

#### Base URL
```
https://api.rezplatform.com/api/v1/payments
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments` | Process a payment |
| GET | `/api/v1/payments/:id` | Get payment details |
| POST | `/api/v1/payments/:id/refund` | Refund a payment |
| GET | `/api/v1/payments/methods` | List saved payment methods |
| POST | `/api/v1/payments/methods` | Add payment method |
| DELETE | `/api/v1/payments/methods/:id` | Remove payment method |
| GET | `/api/v1/payments/settlements` | Get settlement history |
| POST | `/api/v1/payments/authorize` | Authorize payment (hold) |
| POST | `/api/v1/payments/:id/capture` | Capture authorized payment |

---

##### POST /api/v1/payments

Process a payment.

**Request Body:**

```json
{
  "orderId": "ord_789xyz",
  "merchantId": "mer_abc123",
  "customerId": "cust_xyz789",
  "amount": 28.43,
  "currency": "INR",
  "method": "card",
  "card": {
    "token": "tok_visa_4242"
  },
  "metadata": {
    "ip": "192.168.1.1"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "pay_abc123",
    "orderId": "ord_789xyz",
    "amount": 28.43,
    "currency": "INR",
    "status": "succeeded",
    "method": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2028
    },
    "transactionId": "txn_xyz789",
    "createdAt": "2026-05-11T12:00:00Z"
  }
}
```

---

##### POST /api/v1/payments/:id/refund

Refund a payment.

**Request Body:**

```json
{
  "amount": 14.21,
  "reason": "Customer requested",
  "type": "partial"
}
```

---

### Wallet Service (rez-wallet-service)

The Wallet Service manages customer balances, transactions, and loyalty points.

#### Base URL
```
https://api.rezplatform.com/api/v1/wallet
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/wallet/:customerId` | Get wallet balance |
| POST | `/api/v1/wallet/:customerId/topup` | Add funds to wallet |
| POST | `/api/v1/wallet/:customerId/withdraw` | Withdraw from wallet |
| GET | `/api/v1/wallet/:customerId/transactions` | List transactions |
| GET | `/api/v1/wallet/:customerId/points` | Get loyalty points |
| POST | `/api/v1/wallet/:customerId/points/redeem` | Redeem points |
| POST | `/api/v1/wallet/:customerId/transfer` | Transfer to another wallet |

---

##### GET /api/v1/wallet/:customerId

Get wallet details for a customer.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "customerId": "cust_xyz789",
    "balance": 150.50,
    "currency": "INR",
    "points": 2500,
    "pointsValue": 25.00,
    "tier": "gold",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2026-05-11T12:00:00Z"
  }
}
```

---

##### POST /api/v1/wallet/:customerId/topup

Add funds to wallet.

**Request Body:**

```json
{
  "amount": 100.00,
  "paymentMethod": "card",
  "paymentToken": "tok_visa_4242",
  "bonus": {
    "type": "percentage",
    "value": 10
  }
}
```

---

## Analytics Services

### Analytics v2 (rez-analytics-v2)

The Analytics v2 service provides comprehensive business intelligence, reporting, and insights.

#### Base URL
```
https://api.rezplatform.com/api/v2/analytics
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/analytics/revenue` | Get revenue analytics |
| GET | `/api/v2/analytics/orders` | Get order analytics |
| GET | `/api/v2/analytics/customers` | Get customer analytics |
| GET | `/api/v2/analytics/products` | Get product analytics |
| GET | `/api/v2/analytics/performance` | Get performance metrics |
| GET | `/api/v2/analytics/dashboard` | Get aggregated dashboard data |
| GET | `/api/v2/analytics/trends` | Get trend analysis |
| GET | `/api/v2/analytics/forecasts` | Get predictive forecasts |
| POST | `/api/v2/analytics/reports` | Generate custom report |
| GET | `/api/v2/analytics/reports/:id` | Get report status/results |

---

##### GET /api/v2/analytics/revenue

Get revenue analytics with breakdowns.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| merchantId | string | Filter by merchant |
| fromDate | ISO8601 | Start date |
| toDate | ISO8601 | End date |
| groupBy | string | Group by: day, week, month, year |
| breakdown | string | Breakdown: category, product, payment_method |

**Example Request:**

```bash
curl -X GET "https://api.rezplatform.com/api/v2/analytics/revenue?merchantId=mer_abc123&fromDate=2026-05-01&toDate=2026-05-11&groupBy=day" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 45230.50,
      "totalOrders": 1234,
      "averageOrderValue": 36.65,
      "revenueGrowth": 12.5
    },
    "byPeriod": [
      {
        "date": "2026-05-01",
        "revenue": 5200.00,
        "orders": 145,
        "aov": 35.86
      },
      {
        "date": "2026-05-02",
        "revenue": 4850.00,
        "orders": 132,
        "aov": 36.74
      }
    ],
    "byCategory": [
      {
        "category": "food",
        "revenue": 32000.00,
        "percentage": 70.8
      },
      {
        "category": "beverages",
        "revenue": 13230.50,
        "percentage": 29.2
      }
    ]
  }
}
```

---

##### GET /api/v2/analytics/dashboard

Get aggregated dashboard data for quick overview.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| merchantId | string | Filter by merchant |
| timeframe | string | Timeframe: today, week, month, quarter |
| compare | boolean | Include comparison to previous period |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-05-11T12:00:00Z",
    "current": {
      "revenue": 45230.50,
      "orders": 1234,
      "customers": 856,
      "averageRating": 4.5,
      "completionRate": 94.2
    },
    "previous": {
      "revenue": 40200.00,
      "orders": 1156,
      "customers": 798,
      "averageRating": 4.4,
      "completionRate": 93.8
    },
    "changes": {
      "revenue": 12.5,
      "orders": 6.7,
      "customers": 7.3,
      "averageRating": 2.3,
      "completionRate": 0.4
    },
    "topProducts": [...],
    "recentOrders": [...]
  }
}
```

---

##### POST /api/v2/analytics/reports

Generate a custom analytics report.

**Request Body:**

```json
{
  "name": "Monthly Performance Report",
  "merchantId": "mer_abc123",
  "metrics": [
    "revenue",
    "orders",
    "aov",
    "customer_retention",
    "top_products"
  ],
  "dimensions": [
    "date",
    "category",
    "payment_method"
  ],
  "filters": {
    "fromDate": "2026-04-01",
    "toDate": "2026-04-30",
    "status": "completed"
  },
  "format": "json",
  "notify": true,
  "webhookUrl": "https://your-server.com/webhooks/analytics"
}
```

---

## Customer Services

### Customer Platform (rez-customer-platform)

The Customer Platform manages customer profiles, preferences, addresses, and history.

#### Base URL
```
https://api.rezplatform.com/api/v1/customers
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/customers` | Create customer |
| GET | `/api/v1/customers/:id` | Get customer profile |
| PUT | `/api/v1/customers/:id` | Update customer profile |
| DELETE | `/api/v1/customers/:id` | Delete customer |
| GET | `/api/v1/profiles/:id` | Get customer profile (alternate) |
| PUT | `/api/v1/profiles/:id` | Update profile (alternate) |
| GET | `/api/v1/customers/:id/addresses` | List addresses |
| POST | `/api/v1/customers/:id/addresses` | Add address |
| PUT | `/api/v1/customers/:id/addresses/:addrId` | Update address |
| DELETE | `/api/v1/customers/:id/addresses/:addrId` | Delete address |
| GET | `/api/v1/customers/:id/preferences` | Get preferences |
| PUT | `/api/v1/customers/:id/preferences` | Update preferences |
| GET | `/api/v1/customers/:id/orders` | Get order history |
| GET | `/api/v1/customers/:id/loyalty` | Get loyalty status |
| POST | `/api/v1/customers/:id/kyc` | Submit KYC documents |

---

##### GET /api/v1/profiles/:id

Get customer profile by ID.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "cust_xyz789",
    "email": "customer@example.com",
    "phone": "+91-9876543210",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://cdn.rezplatform.com/avatars/cust_xyz789.jpg",
    "dateOfBirth": "1990-05-15",
    "gender": "male",
    "tier": "gold",
    "verified": true,
    "addresses": [
      {
        "id": "addr_001",
        "label": "Home",
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postalCode": "400001",
        "country": "India",
        "isDefault": true
      }
    ],
    "preferences": {
      "language": "en",
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      },
      "dietaryRestrictions": ["vegetarian"],
      "favoriteCuisines": ["italian", "indian"]
    },
    "stats": {
      "totalOrders": 45,
      "totalSpent": 2340.50,
      "loyaltyPoints": 2500,
      "memberSince": "2025-01-15"
    },
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2026-05-11T12:00:00Z"
  }
}
```

---

##### POST /api/v1/customers

Create a new customer.

**Request Body:**

```json
{
  "email": "newcustomer@example.com",
  "phone": "+91-9876543211",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "securePassword123",
  "dateOfBirth": "1992-08-20",
  "source": "mobile_app"
}
```

---

##### PUT /api/v1/customers/:id/preferences

Update customer preferences.

**Request Body:**

```json
{
  "language": "hi",
  "notifications": {
    "email": true,
    "sms": false,
    "push": true,
    "marketing": false
  },
  "dietaryRestrictions": ["vegan"],
  "favoriteCuisines": ["thai", "japanese"],
  "defaultPaymentMethod": "wallet"
}
```

---

## Delivery Services

### Delivery Service (rez-delivery-service)

The Delivery Service manages delivery orders, rider assignments, tracking, and logistics.

#### Base URL
```
https://api.rezplatform.com/api/v1/delivery
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/delivery/orders` | Create delivery order |
| GET | `/api/v1/delivery/orders` | List delivery orders |
| GET | `/api/v1/delivery/orders/:id` | Get delivery details |
| PUT | `/api/v1/delivery/orders/:id` | Update delivery |
| DELETE | `/api/v1/delivery/orders/:id` | Cancel delivery |
| POST | `/api/v1/delivery/orders/:id/assign` | Assign rider |
| POST | `/api/v1/delivery/orders/:id/pickup` | Mark as picked up |
| POST | `/api/v1/delivery/orders/:id/deliver` | Mark as delivered |
| POST | `/api/v1/delivery/orders/:id/return` | Initiate return |
| GET | `/api/v1/delivery/track/:orderId` | Track delivery live |
| GET | `/api/v1/delivery/riders` | List available riders |
| GET | `/api/v1/delivery/zones` | Get delivery zones |
| POST | `/api/v1/delivery/zones` | Create delivery zone |
| GET | `/api/v1/delivery/pricing` | Get pricing rules |
| POST | `/api/v1/delivery/calculate` | Calculate delivery fee |

---

##### POST /api/v1/delivery/orders

Create a new delivery order.

**Request Body:**

```json
{
  "orderId": "ord_789xyz",
  "merchantId": "mer_abc123",
  "customerId": "cust_xyz789",
  "pickup": {
    "address": "123 Restaurant Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "contact": "+91-9876543200",
    "instructions": "Enter from back gate"
  },
  "dropoff": {
    "address": "456 Customer Lane",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400002",
    "contact": "+91-9876543210",
    "instructions": "Ring doorbell twice"
  },
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "weight": 1.2
    }
  ],
  "scheduledTime": "2026-05-11T13:00:00Z",
  "priority": "standard",
  "requirements": {
    "thermalBag": true,
    "ageVerification": false
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "del_abc123",
    "orderId": "ord_789xyz",
    "status": "pending",
    "estimatedPickup": "2026-05-11T12:15:00Z",
    "estimatedDelivery": "2026-05-11T12:45:00Z",
    "distance": 5.2,
    "fee": 40.00,
    "rider": null,
    "trackingUrl": "https://track.rezplatform.com/del_abc123"
  }
}
```

---

##### GET /api/v1/delivery/track/:orderId

Track a delivery in real-time.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "deliveryId": "del_abc123",
    "status": "in_transit",
    "rider": {
      "id": "rider_001",
      "name": "Rajesh Kumar",
      "phone": "+91-9876543299",
      "photo": "https://cdn.rezplatform.com/riders/rider_001.jpg",
      "rating": 4.8
    },
    "currentLocation": {
      "latitude": 19.0760,
      "longitude": 72.8777,
      "address": "Near Central Mall",
      "updatedAt": "2026-05-11T12:20:00Z"
    },
    "pickup": {
      "address": "123 Restaurant Street",
      "eta": "2 mins",
      "completed": true,
      "completedAt": "2026-05-11T12:10:00Z"
    },
    "dropoff": {
      "address": "456 Customer Lane",
      "eta": "15 mins",
      "completed": false
    },
    "timeline": [
      {
        "status": "order_created",
        "timestamp": "2026-05-11T12:00:00Z"
      },
      {
        "status": "rider_assigned",
        "timestamp": "2026-05-11T12:05:00Z"
      },
      {
        "status": "picked_up",
        "timestamp": "2026-05-11T12:10:00Z"
      },
      {
        "status": "in_transit",
        "timestamp": "2026-05-11T12:15:00Z"
      }
    ]
  }
}
```

---

##### POST /api/v1/delivery/calculate

Calculate delivery fee for an order.

**Request Body:**

```json
{
  "merchantId": "mer_abc123",
  "pickupLocation": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "dropoffLocation": {
    "latitude": 19.0820,
    "longitude": 72.8910
  },
  "distance": 5.2,
  "scheduledTime": "2026-05-11T20:00:00Z",
  "isPeakHour": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "baseFee": 30.00,
    "distanceFee": 20.00,
    "peakHourFee": 10.00,
    "surgeMultiplier": 1.5,
    "totalFee": 60.00,
    "currency": "INR",
    "freeDeliveryThreshold": 500.00,
    "estimatedTime": "25-35 mins"
  }
}
```

---

## Staff Services

### Staff Service (rez-staff-service)

The Staff Service manages employee profiles, roles, schedules, and permissions.

#### Base URL
```
https://api.rezplatform.com/api/v1/staff
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/staff` | List staff members |
| POST | `/api/v1/staff` | Add staff member |
| GET | `/api/v1/staff/:id` | Get staff details |
| PUT | `/api/v1/staff/:id` | Update staff profile |
| DELETE | `/api/v1/staff/:id` | Remove staff member |
| GET | `/api/v1/staff/:id/schedule` | Get staff schedule |
| POST | `/api/v1/staff/:id/schedule` | Set staff schedule |
| GET | `/api/v1/staff/:id/shifts` | Get shift history |
| POST | `/api/v1/staff/:id/shifts` | Clock in/out |
| GET | `/api/v1/staff/:id/permissions` | Get permissions |
| PUT | `/api/v1/staff/:id/permissions` | Update permissions |
| POST | `/api/v1/staff/:id/activate` | Activate staff |
| POST | `/api/v1/staff/:id/deactivate` | Deactivate staff |
| GET | `/api/v1/staff/roles` | List roles |
| POST | `/api/v1/staff/roles` | Create role |
| GET | `/api/v1/staff/roles/:id` | Get role details |

---

##### GET /api/v1/staff

List all staff members with filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| merchantId | string | Filter by merchant |
| role | string | Filter by role |
| status | string | Filter by status (active/inactive) |
| department | string | Filter by department |
| page | integer | Page number |
| limit | integer | Items per page |

**Example Request:**

```bash
curl -X GET "https://api.rezplatform.com/api/v1/staff?merchantId=mer_abc123&role=server&status=active" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "staff_001",
      "employeeId": "EMP-2026-001",
      "firstName": "Priya",
      "lastName": "Sharma",
      "email": "priya.sharma@restaurant.com",
      "phone": "+91-9876543201",
      "role": "server",
      "department": "floor",
      "status": "active",
      "merchantId": "mer_abc123",
      "avatar": "https://cdn.rezplatform.com/staff/staff_001.jpg",
      "joinedAt": "2025-06-01T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

##### POST /api/v1/staff

Add a new staff member.

**Request Body:**

```json
{
  "firstName": "Amit",
  "lastName": "Patel",
  "email": "amit.patel@restaurant.com",
  "phone": "+91-9876543202",
  "role": "chef",
  "department": "kitchen",
  "merchantId": "mer_abc123",
  "permissions": [
    "orders:read",
    "orders:write",
    "inventory:read"
  ],
  "schedule": {
    "type": "full_time",
    "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "startTime": "09:00",
    "endTime": "18:00"
  },
  "wage": {
    "amount": 25000,
    "currency": "INR",
    "frequency": "monthly"
  }
}
```

---

##### POST /api/v1/staff/:id/shifts

Clock in or out.

**Request Body (Clock In):**

```json
{
  "action": "clock_in",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

**Request Body (Clock Out):**

```json
{
  "action": "clock_out",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "notes": "Left early for appointment"
}
```

---

##### GET /api/v1/staff/roles

List all available roles.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "role_001",
      "name": "Server",
      "permissions": [
        "orders:read",
        "orders:write",
        "tables:read",
        "tables:write"
      ],
      "level": 2
    },
    {
      "id": "role_002",
      "name": "Kitchen Manager",
      "permissions": [
        "orders:*",
        "inventory:*",
        "staff:read",
        "reports:read"
      ],
      "level": 5
    },
    {
      "id": "role_003",
      "name": "Admin",
      "permissions": ["*"],
      "level": 10
    }
  ]
}
```

---

## Capital Services

### ReZ Capital (rez-capital-service)

The Capital Service provides merchant financing, credit facilities, and financial management.

#### Base URL
```
https://api.rezplatform.com/api/v1/capital
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/capital/credit/:merchantId` | Get credit profile |
| GET | `/api/v1/capital/offers/:merchantId` | Get available offers |
| POST | `/api/v1/capital/apply` | Apply for financing |
| GET | `/api/v1/capital/applications/:id` | Get application status |
| GET | `/api/v1/capital/loans/:merchantId` | List merchant loans |
| GET | `/api/v1/capital/loans/:id` | Get loan details |
| GET | `/api/v1/capital/repayments/:loanId` | Get repayment schedule |
| POST | `/api/v1/capital/repayments/:loanId` | Make repayment |
| GET | `/api/v1/capital/transactions/:merchantId` | Get transaction history |
| GET | `/api/v1/capital/statements/:merchantId` | Get financial statements |
| GET | `/api/v1/capital/risk/:merchantId` | Get risk assessment |
| POST | `/api/v1/capital/collateral` | Submit collateral |

---

##### GET /api/v1/capital/credit/:merchantId

Get credit profile and eligibility for a merchant.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "merchantId": "mer_abc123",
    "creditScore": 750,
    "creditLimit": {
      "total": 500000,
      "used": 150000,
      "available": 350000
    },
    "tier": "gold",
    "interestRate": 12.5,
    "eligibility": {
      "maxLoanAmount": 500000,
      "minLoanAmount": 50000,
      "tenureOptions": [3, 6, 9, 12],
      "processingFee": 1.5
    },
    "history": {
      "totalLoans": 3,
      "activeLoans": 1,
      "totalBorrowed": 1200000,
      "totalRepaid": 1050000,
      "onTimeRepaymentRate": 98.5
    },
    "documents": {
      "kyc": "verified",
      "bankStatements": "verified",
      "gst": "verified"
    },
    "updatedAt": "2026-05-11T12:00:00Z"
  }
}
```

---

##### GET /api/v1/capital/offers/:merchantId

Get personalized financing offers for a merchant.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "merchantId": "mer_abc123",
    "offers": [
      {
        "id": "offer_001",
        "type": "working_capital",
        "name": "Quick Business Loan",
        "amount": {
          "min": 100000,
          "max": 500000,
          "recommended": 250000
        },
        "tenure": 6,
        "interestRate": 11.5,
        "processingFee": 1.0,
        "features": [
          "Instant approval",
          "No collateral required",
          "Flexible repayment"
        ],
        "eligibility": "pre-approved",
        "validUntil": "2026-06-11T23:59:59Z"
      },
      {
        "id": "offer_002",
        "type": "revenue_based",
        "name": "Revenue Advance",
        "amount": {
          "min": 50000,
          "max": 200000,
          "recommended": 100000
        },
        "repaymentRate": 15,
        "features": [
          "Pay back from daily sales",
          "No interest rates",
          "Revenue share model"
        ],
        "eligibility": "available"
      }
    ]
  }
}
```

---

##### POST /api/v1/capital/apply

Apply for financing.

**Request Body:**

```json
{
  "merchantId": "mer_abc123",
  "offerId": "offer_001",
  "requestedAmount": 250000,
  "tenure": 6,
  "purpose": "inventory_purchase",
  "businessPlan": {
    "description": "Purchase of seasonal inventory for monsoon season",
    "expectedROI": 25,
    "repaymentSource": "increased_sales"
  },
  "bankAccount": {
    "accountNumber": "****5678",
    "ifsc": "HDFC0001234"
  },
  "agreeToTerms": true
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "applicationId": "app_abc123",
    "status": "under_review",
    "requestedAmount": 250000,
    "tenure": 6,
    "estimatedInterestRate": 11.5,
    "estimatedEMI": 45123,
    "expectedApprovalDate": "2026-05-13T12:00:00Z",
    "nextSteps": [
      "Submit additional documents if required",
      "Bank verification in progress",
      "Credit assessment in progress"
    ]
  }
}
```

---

##### GET /api/v1/capital/loans/:merchantId

List all loans for a merchant.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "loans": [
      {
        "id": "loan_001",
        "merchantId": "mer_abc123",
        "type": "working_capital",
        "principal": 250000,
        "disbursedAmount": 246250,
        "processingFee": 3750,
        "interestRate": 11.5,
        "tenure": 6,
        "status": "active",
        "outstanding": 175000,
        "nextEMI": {
          "amount": 45123,
          "dueDate": "2026-06-11T00:00:00Z"
        },
        "disbursedAt": "2026-04-11T10:00:00Z",
        "maturityDate": "2026-10-11T00:00:00Z",
        "progress": 30
      }
    ],
    "summary": {
      "totalLoans": 3,
      "activeLoans": 1,
      "totalOutstanding": 175000,
      "totalOverdue": 0
    }
  }
}
```

---

##### GET /api/v1/capital/repayments/:loanId

Get repayment schedule for a loan.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "loanId": "loan_001",
    "schedule": [
      {
        "installment": 1,
        "dueDate": "2026-05-11T00:00:00Z",
        "principal": 38427,
        "interest": 10696,
        "amount": 45123,
        "status": "paid",
        "paidOn": "2026-05-10T14:30:00Z"
      },
      {
        "installment": 2,
        "dueDate": "2026-06-11T00:00:00Z",
        "principal": 38874,
        "interest": 10249,
        "amount": 45123,
        "status": "upcoming",
        "paidOn": null
      },
      {
        "installment": 3,
        "dueDate": "2026-07-11T00:00:00Z",
        "principal": 39325,
        "interest": 9798,
        "amount": 45123,
        "status": "pending"
      }
    ],
    "summary": {
      "totalAmount": 270738,
      "totalInterest": 20738,
      "paidAmount": 90246,
      "remainingAmount": 180492
    }
  }
}
```

---

## Integration APIs

### Integration Layer (rez-integration-layer)

The Integration Layer provides unified endpoints that aggregate data from multiple services.

#### Base URL
```
https://api.rezplatform.com/api/v1/integrations
```

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/integrations/dashboard` | Aggregated dashboard |
| GET | `/api/v1/integrations/v1/dashboard` | Aggregated dashboard (v1) |
| POST | `/api/v1/integrations/sync` | Sync data from external systems |
| GET | `/api/v1/integrations/status` | Get integration status |
| POST | `/api/v1/integrations/webhooks` | Register webhook |
| DELETE | `/api/v1/integrations/webhooks/:id` | Unregister webhook |
| GET | `/api/v1/integrations/logs` | Get integration logs |
| POST | `/api/v1/integrations/connect/:provider` | Connect external service |
| POST | `/api/v1/integrations/disconnect/:provider` | Disconnect external service |

---

##### GET /api/v1/integrations/v1/dashboard

Get aggregated dashboard data from all services.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| merchantId | string | Filter by merchant |
| timeframe | string | Timeframe: today, week, month |
| compare | boolean | Include comparison data |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-05-11T12:00:00Z",
    "merchant": {
      "id": "mer_abc123",
      "name": "The Great Restaurant",
      "plan": "professional"
    },
    "orders": {
      "total": 1234,
      "completed": 1160,
      "cancelled": 50,
      "pending": 24,
      "revenue": 45230.50,
      "averageValue": 36.65
    },
    "customers": {
      "total": 856,
      "newToday": 12,
      "returningRate": 65.5,
      "loyaltyMembers": 234
    },
    "delivery": {
      "totalDeliveries": 890,
      "onTimeRate": 94.2,
      "averageDeliveryTime": 28
    },
    "staff": {
      "total": 45,
      "active": 42,
      "onShift": 18
    },
    "capital": {
      "creditAvailable": 350000,
      "activeLoans": 1,
      "outstanding": 175000
    },
    "alerts": [
      {
        "type": "warning",
        "message": "Low inventory for Item X",
        "action": "reorder"
      }
    ]
  }
}
```

---

##### GET /api/v1/integrations/dashboard

Get the primary aggregated dashboard (alias for v1).

**Query Parameters:** Same as `/api/v1/integrations/v1/dashboard`

**Response:** Same format as v1 endpoint

---

##### POST /api/v1/integrations/sync

Sync data from external systems.

**Request Body:**

```json
{
  "source": "tally",
  "operation": "full_sync",
  "entities": ["orders", "customers", "inventory"],
  "options": {
    "mergeStrategy": "last_write_wins",
    "dryRun": false
  }
}
```

**Response (202 Accepted):**

```json
{
  "success": true,
  "data": {
    "syncId": "sync_abc123",
    "status": "in_progress",
    "startedAt": "2026-05-11T12:00:00Z",
    "estimatedCompletion": "2026-05-11T12:05:00Z"
  }
}
```

---

##### POST /api/v1/integrations/connect/:provider

Connect an external service.

**Request Body (POS Integration):**

```json
{
  "provider": "square",
  "credentials": {
    "accessToken": "sq0atp-xxxxx",
    "locationId": "loc_abc123"
  },
  "settings": {
    "syncOrders": true,
    "syncInventory": true,
    "syncCustomers": true
  }
}
```

**Request Body (Accounting Integration):**

```json
{
  "provider": "tally",
  "credentials": {
    "license": "TALLYLICENSE123"
  },
  "settings": {
    "syncOrders": true,
    "autoReconcile": true
  }
}
```

---

##### GET /api/v1/integrations/status

Get status of all connected integrations.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "int_001",
        "provider": "square",
        "status": "connected",
        "lastSync": "2026-05-11T11:55:00Z",
        "syncStatus": "healthy",
        "features": ["orders", "inventory", "customers"]
      },
      {
        "id": "int_002",
        "provider": "tally",
        "status": "connected",
        "lastSync": "2026-05-11T11:30:00Z",
        "syncStatus": "warning",
        "pendingSync": 5
      },
      {
        "id": "int_003",
        "provider": "zomato",
        "status": "connected",
        "lastSync": "2026-05-11T11:45:00Z",
        "syncStatus": "healthy"
      }
    ],
    "summary": {
      "total": 3,
      "connected": 3,
      "disconnected": 0,
      "errors": 0
    }
  }
}
```

---

## Webhooks

### Webhook Configuration

ReZ Platform supports webhooks for real-time event notifications.

#### Webhook Events

| Event | Description |
|-------|-------------|
| `order.created` | New order created |
| `order.updated` | Order status changed |
| `order.cancelled` | Order cancelled |
| `order.completed` | Order completed |
| `payment.succeeded` | Payment successful |
| `payment.failed` | Payment failed |
| `payment.refunded` | Payment refunded |
| `delivery.created` | Delivery order created |
| `delivery.status_changed` | Delivery status updated |
| `customer.created` | New customer registered |
| `customer.updated` | Customer profile updated |
| `staff.clock_in` | Staff member clocked in |
| `staff.clock_out` | Staff member clocked out |

#### Registering a Webhook

```bash
curl -X POST https://api.rezplatform.com/api/v1/webhooks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhooks/rez",
    "events": ["order.created", "order.completed", "payment.succeeded"],
    "secret": "your-webhook-secret"
  }'
```

#### Webhook Payload Format

```json
{
  "id": "evt_abc123",
  "type": "order.created",
  "timestamp": "2026-05-11T12:00:00Z",
  "data": {
    "object": "order",
    "id": "ord_789xyz",
    "merchantId": "mer_abc123",
    "status": "pending",
    "total": 28.43
  },
  "signature": "sha256=xxxxx"
}
```

#### Verifying Webhook Signatures

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(expectedSignature)
  );
}
```

---

## SDKs & Libraries

### Official SDKs

| Language | Package | Repository |
|----------|---------|------------|
| Node.js | `@rezplatform/sdk` | github.com/rezplatform/node-sdk |
| Python | `rezplatform` | github.com/rezplatform/python-sdk |
| Go | `github.com/rezplatform/go-sdk` | github.com/rezplatform/go-sdk |
| Java | `com.rezplatform:sdk` | github.com/rezplatform/java-sdk |
| Ruby | `rezplatform` | github.com/rezplatform/ruby-sdk |

### Installation

**Node.js:**
```bash
npm install @rezplatform/sdk
```

**Python:**
```bash
pip install rezplatform
```

### SDK Usage Example

```javascript
const { ReZClient } = require('@rezplatform/sdk');

const client = new ReZClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Create an order
const order = await client.orders.create({
  merchantId: 'mer_abc123',
  items: [
    { productId: 'prod_123', quantity: 2 }
  ]
});

console.log(order.id);
```

```python
from rezplatform import Client

client = Client(api_key='your-api-key')

# Get revenue analytics
revenue = client.analytics.get_revenue(
    merchant_id='mer_abc123',
    from_date='2026-05-01',
    to_date='2026-05-11'
)

print(revenue['total'])
```

---

## Appendix

### Pagination

All list endpoints support pagination:

```bash
GET /api/v1/orders?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Filtering

Common filter patterns:

```bash
# Date range
GET /api/v1/orders?fromDate=2026-05-01&toDate=2026-05-11

# Status
GET /api/v1/orders?status=completed

# Multiple values
GET /api/v1/orders?status=pending,confirmed
```

### Sorting

```bash
# Ascending
GET /api/v1/orders?sort=createdAt

# Descending
GET /api/v1/orders?sort=-createdAt

# Multiple fields
GET /api/v1/orders?sort=-createdAt,total
```

### Idempotency

For POST requests, include an `Idempotency-Key` header to safely retry requests:

```http
Idempotency-Key: idem_abc123_1678900000
```

---

**Document Version:** 2.0.0
**Last Updated:** 2026-05-11
**Next Review:** 2026-06-11

For support, contact api-support@rezplatform.com
