# ReZ Ecosystem Services API Documentation

Comprehensive API documentation for all ReZ microservices including delivery, analytics, payment links, journey, automation, GDPR, validation, WebSocket, audit, and currency services.

## Table of Contents

1. [Overview](#overview)
2. [Service Registry](#service-registry)
3. [rez-delivery-service](#rez-delivery-service)
4. [rez-analytics-service](#rez-analytics-service)
5. [rez-payment-links-service](#rez-payment-links-service)
6. [rez-journey-service](#rez-journey-service)
7. [rez-automation-service](#rez-automation-service)
8. [rez-gdpr-service](#rez-gdpr-service)
9. [rez-validation-service](#rez-validation-service)
10. [rez-websocket-hub](#rez-websocket-hub)
11. [rez-audit-service](#rez-audit-service)
12. [rez-currency-service](#rez-currency-service)
13. [Common Patterns](#common-patterns)

---

## Overview

### Base URL

All services run locally during development. Default ports:

| Service | Port | Base URL |
|---------|------|----------|
| rez-delivery-service | 3005 | http://localhost:3005 |
| rez-analytics-service | 3007 | http://localhost:3007 |
| rez-payment-links-service | 3008 | http://localhost:3008 |
| rez-journey-service | 3009 | http://localhost:3009 |
| rez-automation-service | 4014 | http://localhost:4014 |
| rez-gdpr-service | 4021 | http://localhost:4021 |
| rez-validation-service | 4022 | http://localhost:4022 |
| rez-websocket-hub | 4024 | ws://localhost:4024 |
| rez-audit-service | 3025 | http://localhost:3025 |
| rez-currency-service | 4026 | http://localhost:4026 |

### Response Format

All REST endpoints return responses in this format:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Authentication

Services use API keys via headers:

```
X-API-Key: your_api_key
```

WebSocket connections use JWT tokens via query parameter or header.

---

## Service Registry

### Health Check (All Services)

```
GET /health
```

Returns service health status.

---

## rez-delivery-service

### Base URL: `http://localhost:3005`

### Endpoints

#### Create Delivery
```
POST /api/deliveries
```

**Request:**
```json
{
  "orderId": "order_123",
  "customerId": "customer_456",
  "pickup": {
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "123 Main St, Bangalore"
  },
  "dropoff": {
    "latitude": 12.9352,
    "longitude": 77.6245,
    "address": "456 Oak Ave, Bangalore"
  },
  "packageDetails": {
    "dimensions": { "length": 30, "width": 20, "height": 10 },
    "description": "Electronics",
    "weight": 2.5
  },
  "pricing": {
    "basePrice": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "delivery_uuid",
    "orderId": "order_123",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get Delivery
```
GET /api/deliveries/:id
```

#### List Deliveries
```
GET /api/deliveries?status=pending&limit=20
```

#### Assign Driver
```
POST /api/deliveries/:id/assign
```

**Request:**
```json
{
  "driverId": "driver_789"
}
```

#### Update Status
```
POST /api/deliveries/:id/pickup
POST /api/deliveries/:id/dropoff
POST /api/deliveries/:id/fail
```

#### Create Driver
```
POST /api/drivers
```

**Request:**
```json
{
  "userId": "user_001",
  "name": "John Driver",
  "email": "john@driver.com",
  "phone": "+919876543210",
  "vehicle": {
    "type": "motorcycle",
    "licensePlate": "KA-01-AB-1234"
  }
}
```

#### Find Nearby Drivers
```
GET /api/drivers/nearby?latitude=12.9716&longitude=77.5946&radius=5
```

#### Update Driver Location
```
POST /api/drivers/:id/location
```

**Request:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "Current location"
}
```

---

## rez-analytics-service

### Base URL: `http://localhost:3007`

### Endpoints

#### Get Dashboard
```
GET /api/dashboard
GET /api/dashboard/revenue
GET /api/dashboard/orders
GET /api/dashboard/customers
GET /api/dashboard/merchants
```

#### Get KPIs
```
GET /api/kpis
GET /api/kpis/summary
GET /api/kpis/trends
```

#### Get Charts
```
GET /api/charts/revenue-bar
GET /api/charts/order-line
GET /api/charts/order-status-pie
GET /api/charts/revenue-category
GET /api/charts/merchant-performance
GET /api/charts/customer-growth
GET /api/charts/top-products
GET /api/charts/all
```

#### Aggregation
```
GET /api/aggregation/revenue?period=daily&startDate=2024-01-01
GET /api/aggregation/orders?period=weekly
GET /api/aggregation/customers
POST /api/aggregation/refresh
```

#### Export
```
GET /api/reports/export/:format?format=pdf|csv
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO 8601 | Start date |
| endDate | ISO 8601 | End date |
| period | string | hourly/daily/weekly/monthly |
| merchantId | string | Filter by merchant |

---

## rez-payment-links-service

### Base URL: `http://localhost:3008`

### Endpoints

#### Create Payment Link
```
POST /api/payment-links
```

**Request:**
```json
{
  "merchantId": "merchant_123",
  "amount": 500,
  "currency": "INR",
  "purpose": "Order #12345",
  "description": "Payment for order",
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "customerEmail": "john@example.com",
  "expiresIn": 72,
  "webhookUrl": "https://your-app.com/webhook",
  "maxUsageCount": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://pay.rezpay.in/pay/uuid",
    "shortUrl": "https://pay.rezpay.in/l/uuid-short",
    "qrCodeDataUrl": "data:image/png;base64,...",
    "amount": 500,
    "status": "pending",
    "expiresAt": "2024-01-18T10:30:00Z"
  }
}
```

#### Get Payment Link
```
GET /api/payment-links/:id
GET /api/payment-links/:id/status
GET /api/payment-links/:id/qr
```

#### Share Payment Link
```
POST /api/payment-links/:id/share
```

**Request:**
```json
{
  "channels": ["SMS", "WHATSAPP", "EMAIL"],
  "customMessage": "Please complete your payment",
  "recipientEmail": "john@example.com"
}
```

#### Initiate Refund
```
POST /api/refunds
```

**Request:**
```json
{
  "paymentLinkId": "uuid",
  "amount": 500,
  "reason": "Customer requested cancellation"
}
```

#### Webhook (for UPI integration)
```
POST /api/webhooks/payment
```

---

## rez-journey-service

### Base URL: `http://localhost:3009`

### Endpoints

#### Create Journey
```
POST /api/journeys
```

**Request:**
```json
{
  "name": "Welcome Series",
  "description": "Onboarding sequence",
  "trigger": {
    "type": "signup"
  },
  "steps": [
    {
      "name": "Welcome Email",
      "type": "email",
      "config": {
        "templateId": "welcome_email"
      }
    }
  ]
}
```

#### Activate Journey
```
POST /api/journeys/:id/activate
```

#### Enroll Customer
```
POST /api/journeys/:id/entries
```

**Request:**
```json
{
  "customerId": "customer_123",
  "attributes": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Trigger Event
```
POST /api/events
```

**Request:**
```json
{
  "event": "purchase",
  "customerId": "customer_123",
  "data": {
    "orderId": "order_456",
    "amount": 99.99
  }
}
```

---

## rez-automation-service

### Base URL: `http://localhost:4014`

### Endpoints

#### Create Rule
```
POST /api/rules
```

**Request:**
```json
{
  "name": "VIP Customer Discount",
  "trigger": {
    "event": "customer.created",
    "conditions": [
      { "field": "tier", "operator": "eq", "value": "vip" }
    ]
  },
  "action": {
    "type": "send_offer",
    "config": {
      "discount": 25,
      "offerType": "vip_welcome"
    }
  },
  "priority": 10
}
```

#### Trigger Event
```
POST /api/events
```

#### Execute Rule Manually
```
POST /api/rules/:id/execute
```

#### Toggle Rule
```
POST /api/rules/:id/toggle
```

---

## rez-gdpr-service

### Base URL: `http://localhost:4021`

### Endpoints

#### Create Data Request
```
POST /api/requests
```

**Request:**
```json
{
  "userId": "user_123",
  "type": "access",
  "verificationMethod": "email"
}
```

#### Grant Consent
```
POST /api/consents
```

**Request:**
```json
{
  "userId": "user_123",
  "consentType": "marketing",
  "granted": true
}
```

#### Request Data Erasure
```
POST /api/erasure/request
```

**Request:**
```json
{
  "userId": "user_123",
  "verificationMethod": "email"
}
```

#### Export User Data
```
POST /api/export/:userId
GET /api/export/:exportId
```

#### Get Privacy Policy
```
GET /api/privacy-policy/active
```

#### Accept Privacy Policy
```
POST /api/privacy-policy/:id/accept/:userId
```

---

## rez-validation-service

### Base URL: `http://localhost:4022`

### Endpoints

#### Validate Request
```
POST /api/validate
```

**Request:**
```json
{
  "body": {
    "email": { "type": "email", "required": true },
    "password": { "type": "string", "required": true, "minLength": 8 }
  }
}
```

#### Sanitize Input
```
POST /api/sanitize
```

**Request:**
```json
{
  "input": "<script>alert('xss')</script>"
}
```

---

## rez-websocket-hub

### Base URL: `ws://localhost:4024`

### Connection

```
ws://localhost:4024/ws?token=<JWT_TOKEN>
```

### WebSocket Messages

#### Client to Server

| Type | Payload | Description |
|------|---------|-------------|
| subscribe | `{ channel: string }` | Subscribe to channel |
| unsubscribe | `{ channel: string }` | Unsubscribe from channel |
| broadcast | `{ channel: string, payload: any }` | Broadcast to channel |
| private | `{ targetUserId: string, payload: any }` | Private message |
| ping | `{}` | Keep-alive |

#### Server to Client

| Type | Payload | Description |
|------|---------|-------------|
| ack | `{ messageId: string }` | Message acknowledged |
| error | `{ error: string, code: string }` | Error occurred |
| subscribe | `{ channel: string, status: string }` | Subscription confirmed |
| message | `{ channel: string, payload: any }` | Broadcast received |
| private | `{ from: string, payload: any }` | Private message received |
| pong | `{ timestamp: number }` | Ping response |

### REST Endpoints

```
GET /api/ws/health
GET /api/ws/stats
GET /api/ws/channels
GET /api/ws/connections
POST /api/ws/broadcast
POST /api/ws/private
```

---

## rez-audit-service

### Base URL: `http://localhost:3025`

### Endpoints

#### Log Audit Event
```
POST /api/audit
```

**Request:**
```json
{
  "eventType": "data.update",
  "actor": {
    "id": "user_123",
    "type": "user",
    "name": "John Doe"
  },
  "resource": {
    "type": "order",
    "id": "order_456"
  },
  "action": {
    "operation": "update_status",
    "method": "PATCH"
  },
  "status": "success"
}
```

#### Query Events
```
GET /api/audit?startDate=2024-01-01&eventTypes=auth.login,auth.logout
GET /api/audit/user/:userId
GET /api/audit/resource/:type/:id
```

#### Get Summary
```
GET /api/audit/summary
```

#### Compliance Report
```
GET /api/compliance/report?framework=SOC2&startDate=2024-01-01
GET /api/compliance/status
```

---

## rez-currency-service

### Base URL: `http://localhost:4026`

### Endpoints

#### Get Supported Currencies
```
GET /api/currencies
GET /api/currencies/:code
```

#### Get Exchange Rates
```
GET /api/rates
GET /api/rates/:from/:to
GET /api/rates/:from/:to/history?days=30
```

#### Convert Currency
```
POST /api/convert
```

**Request:**
```json
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "roundResult": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalAmount": 100,
    "convertedAmount": 92,
    "rate": 0.92,
    "fromCurrency": "USD",
    "toCurrency": "EUR",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Calculate Fee
```
POST /api/fee
```

**Request:**
```json
{
  "amount": 100,
  "currency": "USD",
  "feeType": "transaction",
  "percentage": 2.5
}
```

#### Format Currency
```
GET /api/format?amount=1234567.89&currency=USD
```

---

## Common Patterns

### Error Handling

All services return consistent error responses:

```json
{
  "success": false,
  "error": "Human readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

### Pagination

List endpoints support pagination:

```
GET /api/resource?limit=20&offset=0
```

Response includes meta:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "count": 100,
    "limit": 20,
    "offset": 0
  }
}
```

### Date Filtering

Most endpoints accept date filters:

```
?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
```

### Rate Limiting

Services implement rate limiting. When exceeded:

```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "retryAfter": 60
}
```

---

## Version

Last Updated: 2024-01-15
API Version: 1.0.0
