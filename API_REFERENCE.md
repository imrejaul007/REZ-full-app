# ReZ API Reference

Complete API documentation for the ReZ platform ecosystem.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Gateway](#api-gateway)
- [Auth Service](#auth-service)
- [Payment Service](#payment-service)
- [Order Service](#order-service)
- [Wallet Service](#wallet-service)
- [Catalog Service](#catalog-service)
- [Hotel Service](#hotel-service)
- [Finance Service](#finance-service)
- [Notifications Service](#notifications-service)
- [Admin Analytics](#admin-analytics)
- [Admin Audit Logs](#admin-audit-logs)
- [Hotel OTA Integration](#hotel-ota-integration)
- [NextaBizz Procurement](#nextabizz-procurement)
- [CorpPerks Integrations](#corpperks-integrations)
- [Error Codes](#error-codes)

---

## Overview

**Base URL**: `https://api.rez.money`

**Gateway URL**: `http://localhost:3001` (development)

### Architecture

The ReZ platform uses a microservices architecture with the following components:

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 3001 | Central entry point, routing, rate limiting |
| Auth Service | 4002 | Authentication, user management, MFA |
| Payment Service | 4008 | Payment processing, refunds |
| Order Service | 4012 | Order management |
| Wallet Service | 4014 | Digital wallet, transactions |
| Catalog Service | 4003 | Product catalog |
| Hotel Service | 4004 | Hotel bookings |
| Finance Service | 4006 | Corporate finance, BNPL |
| Notification Service | 4011 | Push, SMS, Email notifications |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token (JWT) |
| `Content-Type` | Yes (POST/PUT) | `application/json` |
| `X-Company-Id` | For corporate APIs | Company identifier |
| `X-User-Id` | Some endpoints | User identifier |
| `X-Request-Id` | Optional | Request tracing ID |

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Authentication

### Authentication Methods

The platform supports multiple authentication methods:

| Method | Endpoint | Description |
|--------|----------|-------------|
| Phone + OTP | `/api/v1/auth/otp/send` | SMS/WhatsApp OTP login |
| PIN | `/api/v1/auth/login-pin` | 4-6 digit PIN for returning users |
| JWT Bearer | `Authorization: Bearer <token>` | API authentication |
| Guest | `/api/v1/auth/guest` | Web-menu guest sessions |

### Send OTP

```http
POST /api/v1/auth/otp/send
```

**Request Body:**

```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "channel": "sms",
  "force": false
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `phone` | string | Yes | Phone number (5-15 digits) |
| `countryCode` | string | No | Default: `+91` |
| `channel` | string | No | `sms` or `whatsapp` |
| `force` | boolean | No | Force OTP even if PIN exists |

**Response:**

```json
{
  "success": true,
  "messageId": "msg_abc123",
  "isNewUser": true,
  "hasPIN": false
}
```

**Rate Limit**: 3 requests per minute per phone, 5 per 15 minutes per IP.

---

### Verify OTP

```http
POST /api/v1/auth/otp/verify
```

**Request Body:**

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "countryCode": "+91"
}
```

**Response (Success):**

```json
{
  "success": true,
  "isNewUser": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  },
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "isOnboarded": false
  },
  "deviceRisk": "new"
}
```

**Response (MFA Required):**

```json
{
  "success": true,
  "mfaRequired": true,
  "mfaSessionToken": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Please enter your authenticator code to complete login.",
  "backupCodesAvailable": 10
}
```

---

### PIN Login

```http
POST /api/v1/auth/login-pin
```

**Request Body:**

```json
{
  "phone": "9876543210",
  "pin": "1234",
  "countryCode": "+91"
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "deviceRisk": "trusted"
}
```

**Security**: 5 failed attempts triggers 15-minute lockout.

---

### Refresh Token

```http
POST /api/v1/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

---

### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "role": "user",
    "isVerified": true,
    "isOnboarded": true,
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://..."
    }
  }
}
```

---

### Set PIN

```http
POST /api/v1/auth/set-pin
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "pin": "1234"
}
```

**Note**: Common PINs (0000, 1234, etc.) are rejected.

---

### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Guest Authentication

```http
POST /api/v1/auth/guest
```

**Request Body:**

```json
{
  "tableId": "table_123",
  "storeId": "store_abc456"
}
```

**Response:**

```json
{
  "success": true,
  "guestToken": "eyJhbGciOiJIUzI1NiIs...",
  "guestId": "guest_abc123def456",
  "tableId": "table_123",
  "storeId": "store_abc456"
}
```

---

## MFA (Multi-Factor Authentication)

### Setup MFA

```http
POST /api/v1/auth/mfa/setup
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "keyUri": "otpauth://totp/REZ:user@example.com?secret=ABCDEFGHIJKLMNOP&issuer=REZ&algorithm=SHA1&digits=6&period=30",
  "backupCodes": [
    "ABCD-1234",
    "EFGH-5678"
  ],
  "message": "Scan QR code with authenticator app, then verify setup with a 6-digit code"
}
```

---

### Verify MFA Setup

```http
POST /api/v1/auth/mfa/verify-setup
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "code": "123456"
}
```

---

### Verify MFA (Login)

```http
POST /api/v1/auth/mfa/verify
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "code": "123456"
}
```

---

### Verify Backup Code

```http
POST /api/v1/auth/mfa/backup-verify
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "code": "ABCD-1234"
}
```

---

### Disable MFA

```http
DELETE /api/v1/auth/mfa/disable
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
  "code": "123456"
}
```

---

### Get MFA Status

```http
GET /api/v1/auth/mfa/status
Authorization: Bearer <accessToken>
```

**Response:**

```json
{
  "success": true,
  "isEnabled": true,
  "enabledAt": "2024-01-15T10:30:00Z",
  "lastVerifiedAt": "2024-01-20T14:22:00Z",
  "unUsedBackupCodesCount": 8
}
```

---

## API Gateway

The API Gateway provides proxy endpoints with circuit breaker protection.

**Base URL**: `http://localhost:3001`

---

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

### Circuit Breaker Status

```http
GET /admin/circuits
```

**Response:**

```json
{
  "circuits": [
    {
      "name": "payment-service",
      "state": "closed",
      "failures": 0,
      "lastFailure": null
    }
  ]
}
```

---

### Reset Circuit

```http
POST /admin/circuits/:serviceName/reset
Authorization: Bearer <adminToken>
```

**Response:**

```json
{
  "success": true,
  "message": "Circuit for payment-service has been reset"
}
```

---

## Payment Service

### Create Payment

```http
POST /api/payments
```

**Request Body:**

```json
{
  "amount": 5000,
  "currency": "INR",
  "paymentMethod": "upi",
  "metadata": {
    "orderId": "order_abc123"
  }
}
```

**Response:**

```json
{
  "success": true,
  "paymentId": "pay_xyz789",
  "status": "pending",
  "amount": 5000,
  "currency": "INR"
}
```

---

## Order Service

### Create Order

```http
POST /api/orders
```

**Request Body:**

```json
{
  "items": [
    {
      "productId": "prod_abc123",
      "quantity": 2,
      "price": 500
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Response:**

```json
{
  "success": true,
  "orderId": "order_xyz789",
  "orderNumber": "RZ100001",
  "status": "pending",
  "total": 1000,
  "itemCount": 2,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Get Orders

```http
GET /api/orders
```

**Headers:**

- `X-Company-Id`: Company identifier
- `X-User-Id`: User identifier

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "order_xyz789",
      "orderNumber": "RZ100001",
      "status": "confirmed",
      "total": 1000,
      "itemCount": 2,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Wallet Service

### Get Balance

```http
GET /api/wallet/balance
Authorization: Bearer <token>
```

**Headers:**

- `X-Company-Id`: Company identifier
- `Authorization`: Bearer token

**Response:**

```json
{
  "success": true,
  "data": {
    "walletId": "WAL123",
    "balance": 500000,
    "availableBalance": 450000,
    "pendingBalance": 50000,
    "status": "active"
  }
}
```

---

## Catalog Service

### Search Products

```http
GET /api/catalog/products
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |
| `search` | string | Search term |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "productId": "prod_abc123",
      "name": "Premium Gift Box",
      "description": "Luxury gift box...",
      "price": 1200,
      "category": "food"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Hotel Service

### Search Hotels

```http
GET /api/hotels/search
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `location` | string | Yes | City or location |
| `checkIn` | string | Yes | Check-in date (YYYY-MM-DD) |
| `checkOut` | string | Yes | Check-out date (YYYY-MM-DD) |
| `guests` | number | No | Number of guests (default: 1) |
| `rooms` | number | No | Number of rooms (default: 1) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "propertyId": "P001",
      "name": "The Grand Mumbai",
      "starRating": 5,
      "userRating": 4.5,
      "rooms": [
        {
          "roomId": "R001",
          "roomType": "Deluxe",
          "corporateRate": 4500,
          "available": true
        }
      ]
    }
  ]
}
```

---

### Get Hotel Details

```http
GET /api/hotels/:propertyId
Authorization: Bearer <token>
```

---

### Check Room Availability

```http
GET /api/hotels/:propertyId/availability
Authorization: Bearer <token>
```

**Query Parameters:**

- `checkIn`: Check-in date
- `checkOut`: Check-out date

---

### Create Booking

```http
POST /api/hotels/bookings
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "propertyId": "P001",
  "roomId": "R001",
  "checkIn": "2024-02-01",
  "checkOut": "2024-02-03",
  "guests": 2,
  "guestDetails": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+919876543210"
    }
  ],
  "specialRequests": "Late check-in",
  "corporateCode": "CORP123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bookingId": "HB123456789",
    "confirmationNumber": "MCB202401001",
    "status": "confirmed",
    "property": {
      "propertyId": "P001",
      "name": "The Grand Mumbai"
    },
    "room": {
      "roomId": "R001",
      "name": "Deluxe",
      "bedType": "King"
    },
    "pricing": {
      "roomRate": 4500,
      "numberOfRooms": 1,
      "nights": 2,
      "subtotal": 9000,
      "gstAmount": 1080,
      "totalAmount": 10080,
      "currency": "INR"
    }
  }
}
```

---

### Get Bookings

```http
GET /api/hotels/bookings
Authorization: Bearer <token>
```

**Query Parameters:**

- `status`: Filter by status (pending, confirmed, cancelled, completed)
- `startDate`: Start date filter
- `endDate`: End date filter
- `page`: Page number
- `limit`: Items per page

---

### Cancel Booking

```http
POST /api/hotels/bookings/:bookingId/cancel
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "reason": "Schedule change"
}
```

---

### Calculate Price

```http
POST /api/hotels/pricing/calculate
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "propertyId": "P001",
  "roomId": "R001",
  "checkIn": "2024-02-01",
  "checkOut": "2024-02-03",
  "corporateCode": "CORP123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "baseRate": 5500,
    "corporateRate": 4500,
    "nights": 2,
    "subtotal": 9000,
    "corporateDiscount": 18,
    "taxableAmount": 8035.71,
    "cgstAmount": 482.14,
    "sgstAmount": 482.14,
    "totalTax": 964.28,
    "totalAmount": 9964.28,
    "itcEligible": true
  }
}
```

---

## Finance Service

### Get Corporate Wallet

```http
GET /api/finance/wallet
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "walletId": "WAL123",
    "balance": 500000,
    "availableBalance": 450000,
    "pendingBalance": 50000,
    "status": "active"
  }
}
```

---

### Add Funds

```http
POST /api/finance/wallet/deposit
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "amount": 100000,
  "paymentMethod": "upi"
}
```

**Payment Methods**: `upi`, `netbanking`, `neft`, `rtgs`

---

### Get Transactions

```http
GET /api/finance/wallet/transactions
Authorization: Bearer <token>
```

**Query Parameters:**

- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `type`: credit or debit
- `page`: Page number
- `limit`: Items per page

---

### Get Expense Cards

```http
GET /api/finance/cards
Authorization: Bearer <adminToken>
```

**Query Parameters:**

- `employeeId`: Filter by employee
- `status`: Filter by status (active, blocked, expired)

---

### Issue Expense Card

```http
POST /api/finance/cards
Authorization: Bearer <adminToken>
```

**Request Body:**

```json
{
  "employeeId": "EMP001",
  "employeeName": "Priya Sharma",
  "employeeEmail": "priya@company.com",
  "cardType": "virtual",
  "limits": {
    "dailyLimit": 25000,
    "monthlyLimit": 100000
  }
}
```

**Card Types**: `virtual`, `physical`

---

### Update Card Status

```http
POST /api/finance/cards/:cardId/status
Authorization: Bearer <adminToken>
```

**Request Body:**

```json
{
  "status": "blocked"
}
```

---

### Get BNPL Plans

```http
GET /api/finance/bnpl/plans
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "planId": "BNPL001",
      "name": "30 Days",
      "tenure": 30,
      "interestRate": 0,
      "processingFee": 1.5
    },
    {
      "planId": "BNPL002",
      "name": "60 Days",
      "tenure": 60,
      "interestRate": 1.5,
      "processingFee": 2
    }
  ]
}
```

---

### Get Finance Dashboard

```http
GET /api/finance/dashboard
Authorization: Bearer <adminToken>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 500000,
      "pendingBalance": 50000,
      "todaySpend": 25000,
      "monthSpend": 125000
    },
    "cards": {
      "totalCards": 12,
      "activeCards": 10,
      "totalSpent": 350000,
      "monthSpent": 125000
    },
    "bnpl": {
      "activePlans": 2,
      "totalOutstanding": 85000,
      "overdueAmount": 0
    },
    "expenses": {
      "pendingClaims": 5,
      "pendingAmount": 45000,
      "approvedThisMonth": 18
    }
  }
}
```

---

## Notifications Service

### Send Notification

```http
POST /api/notifications
```

**Request Body:**

```json
{
  "type": "email",
  "recipient": "user@example.com",
  "template": "order_confirmation",
  "data": {
    "orderId": "order_abc123",
    "customerName": "John",
    "orderTotal": 1500
  }
}
```

**Notification Types**: `email`, `sms`, `push`, `whatsapp`

---

## Admin Analytics

**Base Path**: `/admin/analytics`

**Authentication**: Requires admin authorization

---

### Get Orders (Paginated)

```http
GET /admin/analytics/orders
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |
| `startDate` | ISO 8601 | Filter start date |
| `endDate` | ISO 8601 | Filter end date |
| `status` | string | Filter by status |
| `merchantId` | string | Filter by merchant |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ORD123",
      "orderNumber": "RZ100001",
      "status": "delivered",
      "total": 1500,
      "itemCount": 3,
      "merchantId": "MCH001",
      "userId": "USR001",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Get Merchants (Paginated)

```http
GET /admin/analytics/merchants
```

**Query Parameters:**

- `page`, `limit`: Pagination
- `status`: active, pending, suspended, rejected
- `category`: Filter by category

---

### Get Users (Paginated)

```http
GET /admin/analytics/users
```

**Query Parameters:**

- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range
- `status`: active, inactive, suspended

---

### Get Transactions (Paginated)

```http
GET /admin/analytics/transactions
```

**Query Parameters:**

- `page`, `limit`: Pagination
- `startDate`, `endDate`: Date range
- `status`: pending, completed, failed, refunded
- `merchantId`: Filter by merchant

---

### Export Data

```http
POST /admin/analytics/export
Authorization: Bearer <adminToken>
```

**Request Body:**

```json
{
  "type": "orders",
  "filters": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "status": "delivered"
  }
}
```

**Export Types**: `orders`, `merchants`, `users`, `transactions`

**Response:**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "/exports/orders_1705312200000.csv",
    "expiresAt": "2024-01-16T10:30:00Z"
  }
}
```

---

## Admin Audit Logs

**Base Path**: `/admin/audit-log`

**Authentication**: Requires admin authorization

---

### Get Audit Logs

```http
GET /admin/audit-log
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |
| `adminId` | string | Filter by admin |
| `action` | string | Filter by action type |
| `resourceType` | string | Filter by resource type |
| `resourceId` | string | Filter by resource ID |
| `startDate` | ISO 8601 | Filter start date |
| `endDate` | ISO 8601 | Filter end date |
| `status` | string | success or failure |

**Action Types**: `CREATE`, `READ`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `SUSPEND`, `ACTIVATE`, `LOGIN`, `LOGOUT`, `EXPORT`, `BULK_OPERATION`, `SETTINGS_CHANGE`

**Resource Types**: `USER`, `MERCHANT`, `ORDER`, `PRODUCT`, `CATEGORY`, `CAMPAIGN`, `ADMIN_USER`, `SYSTEM_CONFIG`, `REFUND`, `CASHBACK`, `REPORT`

---

### Get Audit Log Entry

```http
GET /admin/audit-log/:id
```

---

### Get Audit Statistics

```http
GET /admin/audit-log/stats
```

**Query Parameters:**

- `startDate`, `endDate`: Date range

**Response:**

```json
{
  "success": true,
  "data": {
    "totalActions": 1500,
    "successCount": 1480,
    "failureCount": 20,
    "byAction": {
      "CREATE": 500,
      "UPDATE": 700,
      "DELETE": 300
    },
    "byResourceType": {
      "USER": 600,
      "ORDER": 900
    },
    "byAdmin": {
      "admin_001": { "actions": 800, "failures": 5 }
    },
    "recentActivity": {
      "last24h": 150,
      "last7d": 850
    }
  }
}
```

---

### Export Audit Logs

```http
POST /admin/export/audit-log
Authorization: Bearer <adminToken>
```

**Request Body:**

```json
{
  "format": "csv",
  "filters": {
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "action": "DELETE"
  }
}
```

---

### Create Manual Audit Entry

```http
POST /admin/audit-log
Authorization: Bearer <adminToken>
```

**Request Body:**

```json
{
  "action": "UPDATE",
  "resourceType": "USER",
  "resourceId": "user_abc123",
  "previousValue": { "role": "user" },
  "newValue": { "role": "admin" },
  "metadata": {
    "reason": "Promotion"
  }
}
```

---

## Hotel OTA Integration

**Base Path**: `/api/integrations/makcorps`

### Connect Integration (OAuth)

```http
GET /api/integrations/:provider/connect
Authorization: Bearer <adminToken>
```

**Providers**: `makcorps`, `nextabizz`, `greythr`, `zoho_people`, `workday`

---

### Integration Webhooks

**Makcorps Webhook**:

```http
POST /api/integrations/makcorps/webhook
```

**Events**: `booking.created`, `booking.updated`, `booking.cancelled`, `payment.received`

---

## NextaBizz Procurement

**Base Path**: `/api/nextabizz`

### Search Products

```http
GET /api/nextabizz/products
Authorization: Bearer <token>
```

**Query Parameters:**

- `q`: Search query
- `category`: Filter by category
- `minPrice`, `maxPrice`: Price range
- `inStock`: true/false
- `page`, `limit`: Pagination

---

### Get Product Details

```http
GET /api/nextabizz/products/:productId
Authorization: Bearer <token>
```

---

### Get Recommended Products

```http
GET /api/nextabizz/products/recommended
Authorization: Bearer <token>
```

**Query Parameters:**

- `occasion`: festival, milestone, thank_you, client, general
- `budgetMin`, `budgetMax`: Budget range
- `quantity`: Number of recommendations

---

### Calculate Bulk Pricing

```http
POST /api/nextabizz/products/bulk-pricing
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "productIds": ["PRD001", "PRD002"],
  "quantities": [50, 25]
}
```

---

### Create Bulk Order

```http
POST /api/nextabizz/orders
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "items": [
    { "productId": "PRD001", "quantity": 50 }
  ],
  "deliveryAddress": {
    "name": "Company Name",
    "phone": "+919876543210",
    "line1": "123 Business Park",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "deliveryType": "bulk",
  "branding": {
    "includeLogo": true,
    "customMessage": "Thank you for being awesome!"
  },
  "poNumber": "PO-2024-001"
}
```

**Delivery Types**: `bulk`, `individual`

---

### Get Orders

```http
GET /api/nextabizz/orders
Authorization: Bearer <token>
```

---

### Cancel Order

```http
POST /api/nextabizz/orders/:orderId/cancel
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "reason": "Changed requirements"
}
```

---

### Request Quote

```http
POST /api/nextabizz/quotes
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "productIds": ["PRD001", "PRD002"],
  "quantities": [100, 50],
  "customizations": ["Custom color", "Logo placement"],
  "notes": "Need by end of month"
}
```

---

### Get Vendors

```http
GET /api/nextabizz/vendors
Authorization: Bearer <token>
```

**Query Parameters:**

- `category`: Filter by category
- `verified`: true/false

---

## CorpPerks Integrations

### Makcorps Integration

**Webhook Events**: `booking.created`, `booking.updated`, `booking.cancelled`, `payment.received`

---

### NextaBizz Integration

**Webhook Events**: `order.created`, `order.shipped`, `order.delivered`, `order.failed`, `inventory.low`

---

### HRIS Integration

**Webhook Events**: `employee.added`, `employee.updated`, `employee.deactivated`, `department.updated`

**Sources**: `greythr`, `zoho_people`, `bamboo_hr`, `workday`, `custom`

---

### RTMN Finance Webhook

**Webhook Events**: `wallet.deposit`, `wallet.withdrawal`, `wallet.transfer`, `card.transaction`, `card.blocked`, `bnpl.payment_due`, `bnpl.payment_received`, `bnpl.defaulted`, `expense.approved`, `expense.paid`

---

## Error Codes

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async processing) |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Circuit breaker open |

---

### Application Error Codes

| Code | Description |
|------|-------------|
| `INVALID_OTP` | OTP is invalid or expired |
| `INVALID_PIN` | PIN is incorrect |
| `INVALID_TOKEN` | JWT token is invalid or expired |
| `MFA_REQUIRED` | MFA verification required |
| `MFA_SESSION_EXPIRED` | MFA session has expired |
| `ACCOUNT_LOCKED` | Account temporarily locked |
| `USER_NOT_FOUND` | User does not exist |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `VALIDATION_ERROR` | Input validation failed |
| `CIRCUIT_OPEN` | Service temporarily unavailable |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `CONCURRENT_REFRESH` | Concurrent token refresh detected |
| `EMAIL_ALREADY_EXISTS` | Email is already registered |
| `PHONE_ALREADY_EXISTS` | Phone number is already registered |

---

### Circuit Breaker Errors

When a downstream service is unavailable:

```json
{
  "success": false,
  "error": "Payment service temporarily unavailable",
  "circuitState": {
    "name": "payment-service",
    "state": "open",
    "failureCount": 5
  },
  "retryAfterMs": 30000
}
```

**Headers**: `Retry-After: 30`

---

### Rate Limit Errors

```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfterMs": 60000
}
```

**Headers**: `Retry-After: 60`, `X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: 0`

---

## Rate Limits

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/api/v1/auth/otp/send` | 3 | 1 minute |
| `/api/v1/auth/otp/send` | 5 | 15 minutes |
| `/api/v1/auth/otp/verify` | 5 | 1 minute |
| `/api/v1/auth/login-pin` | 5 | 15 minutes |
| `/api/v1/auth/set-pin` | 5 | 1 minute |
| `/admin/*` | 100 | 15 minutes |
| General API | 100 | 1 minute |

---

## Pagination

All list endpoints support pagination with these query parameters:

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | 1 | - |
| `limit` | 20-50 | 100 |

**Pagination Response:**

```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Idempotency

For critical operations, include an `X-Idempotency-Key` header:

```http
POST /api/orders
X-Idempotency-Key: idem_abc123xyz
```

Duplicate requests with the same key within 24 hours return the cached response.

---

## Webhook Security

Webhooks are signed using HMAC-SHA256. Verify signatures:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## Versioning

API versioning is handled via URL path:

- Current version: `/api/v1/`
- Gateway routes: `/api/`

Breaking changes will result in a new version (e.g., `/api/v2/`).

---

## Support

- **Documentation**: https://docs.rez.money
- **Status Page**: https://status.rez.money
- **Support Email**: api-support@rez.money

---

## Merchant Service API

**Base URL**: `https://api.rez.money/api/merchant`  
**Service**: `rez-merchant-service` (Port 4005)

### Authentication

All merchant endpoints require JWT Bearer authentication:
```http
Authorization: Bearer <token>
```

---

### GDPR Compliance Endpoints

#### Get Merchant Profile

```http
GET /api/merchant/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchantId": "string",
    "businessName": "string",
    "email": "string",
    "phone": "string",
    "storeCount": "number",
    "createdAt": "ISO8601"
  }
}
```

#### Update Merchant Profile

```http
PUT /api/merchant/profile
```

**Request Body:**
```json
{
  "businessName": "string",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "pincode": "string"
  }
}
```

#### Delete Account (GDPR Article 17)

```http
DELETE /api/merchant/account
```

**Request Body:**
```json
{
  "confirmation": "DELETE_MY_ACCOUNT",
  "reason": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion scheduled. All data will be purged within 30 days."
}
```

#### Get Deletion Status

```http
GET /api/merchant/deletion-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending|processing|completed",
    "scheduledAt": "ISO8601",
    "purgeDate": "ISO8601"
  }
}
```

#### Cancel Deletion

```http
POST /api/merchant/cancel-deletion
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion cancelled. Your account is active."
}
```

#### Export Data (GDPR Article 20)

```http
GET /api/merchant/export-data
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| format | string | `json` or `csv` (default: `json`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "string",
    "expiresAt": "ISO8601"
  }
}
```

#### Get Consent Status

```http
GET /api/merchant/consent
```

**Response:**
```json
{
  "success": true,
  "data": {
    "marketing": {
      "status": "granted|denied",
      "grantedAt": "ISO8601"
    },
    "analytics": {
      "status": "granted|denied",
      "grantedAt": "ISO8601"
    },
    "thirdParty": {
      "status": "granted|denied",
      "grantedAt": "ISO8601"
    }
  }
}
```

#### Update Consent

```http
POST /api/merchant/consent
```

**Request Body:**
```json
{
  "category": "marketing|analytics|thirdParty",
  "status": "granted|denied"
}
```

#### Get Data Region

```http
GET /api/merchant/data-region
```

**Response:**
```json
{
  "success": true,
  "data": {
    "region": "IN|US|EU",
    "storageLocation": "India|US-West|Frankfurt"
  }
}
```

#### Update Data Region

```http
PUT /api/merchant/data-region
```

**Request Body:**
```json
{
  "region": "IN|US|EU"
}
```

---

### Loyalty Program Endpoints

#### List Loyalty Customers

```http
GET /api/loyalty/customers
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| tier | string | - | bronze/silver/gold/platinum |
| search | string | - | Search by name or phone |
| sortBy | string | totalVisits | totalVisits/totalSpent/lastVisit/currentStreak |
| sortOrder | string | desc | asc/desc |

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "userId": "string",
        "name": "string",
        "phone": "string",
        "tier": "bronze|silver|gold|platinum",
        "totalVisits": "number",
        "totalSpent": "number",
        "currentStreak": "number",
        "longestStreak": "number",
        "lastVisit": "ISO8601|null",
        "badgesCount": "number",
        "points": "number",
        "coins": "number"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "hasNext": "boolean"
    }
  }
}
```

#### Get Customer Loyalty Profile

```http
GET /api/loyalty/customers/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "tier": "bronze|silver|gold|platinum",
    "totalVisits": "number",
    "totalSpent": "number",
    "currentStreak": "number",
    "longestStreak": "number",
    "lastVisit": "ISO8601",
    "points": "number",
    "coins": "number",
    "badges": [
      {
        "id": "string",
        "name": "string",
        "icon": "string",
        "unlockedAt": "ISO8601"
      }
    ],
    "milestones": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "target": "number",
        "current": "number",
        "unlockedAt": "ISO8601|null"
      }
    ],
    "visitHistory": [
      {
        "date": "string",
        "storeName": "string",
        "spent": "number"
      }
    ],
    "createdAt": "ISO8601"
  }
}
```

#### Get Loyalty Stats

```http
GET /api/loyalty/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMembers": "number",
    "activeMembers": "number",
    "avgVisitsPerMonth": "number",
    "avgOrderValue": "number",
    "loyaltyRevenue": "number",
    "revenuePercentage": "number",
    "topTierCounts": {
      "platinum": "number",
      "gold": "number",
      "silver": "number",
      "bronze": "number"
    },
    "recentUnlocks": [
      {
        "customerName": "string",
        "milestone": "string",
        "unlockedAt": "ISO8601"
      }
    ],
    "atRiskCount": "number",
    "newMembersThisMonth": "number",
    "redemptionRate": "number"
  }
}
```

#### Get Loyalty Tiers

```http
GET /api/loyalty/tiers
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "bronze|silver|gold|platinum",
      "minPoints": "number",
      "maxPoints": "number",
      "benefits": ["string"],
      "conversionRate": "number"
    }
  ]
}
```

---

### Wallet Endpoints

#### Get Merchant Wallet

```http
GET /api/wallet
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "number",
    "pendingBalance": "number",
    "currency": "INR",
    "bankLinked": "boolean"
  }
}
```

#### Get Wallet Transactions

```http
GET /api/wallet/transactions
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| type | string | - | credit/debit |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "string",
        "type": "credit|debit",
        "amount": "number",
        "description": "string",
        "orderId": "string|null",
        "createdAt": "ISO8601"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "hasNext": "boolean"
    }
  }
}
```

#### Withdraw Funds

```http
POST /api/wallet/withdraw
```

**Request Body:**
```json
{
  "amount": "number (min: 100, max: 9999999)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "amount": "number",
    "status": "pending",
    "estimatedArrival": "ISO8601"
  }
}
```

**Error Codes:**
| Code | Message |
|------|---------|
| WITHDRAWAL_INSUFFICIENT_BALANCE | Not enough wallet balance |
| WITHDRAWAL_ALREADY_PENDING | Withdrawal already in progress |
| WITHDRAWAL_LIMIT_EXCEEDED | Amount exceeds maximum (₹99,99,999) |

#### Update Bank Details

```http
PUT /api/wallet/bank-details
```

**Request Body:**
```json
{
  "accountNumber": "string",
  "ifsc": "string",
  "accountHolderName": "string"
}
```

---

### QR Integration Endpoints

#### Get Store QR (Public)

```http
GET /api/qr/public/store/:slug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "string",
    "storeName": "string",
    "logo": "string",
    "theme": "string",
    "menuUrl": "string",
    "orderUrl": "string"
  }
}
```

#### Get Menu QR (Public)

```http
GET /api/qr/public/menu/:storeId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrUrl": "string",
    "storeName": "string",
    "categories": ["string"]
  }
}
```

#### Track QR Scan

```http
POST /api/qr/public/analytics/track
```

**Request Body:**
```json
{
  "qrId": "string",
  "scanSource": "string",
  "deviceType": "android|ios|web",
  "location": {
    "latitude": "number",
    "longitude": "number"
  }
}
```

#### Get Merchant QR Analytics

```http
GET /api/qr/merchant/stores/:storeId/analytics
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| startDate | ISO8601 | 30 days ago | Filter start |
| endDate | ISO8601 | now | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalScans": "number",
    "uniqueUsers": "number",
    "conversions": "number",
    "conversionRate": "number",
    "topQrCodes": [
      {
        "qrId": "string",
        "type": "string",
        "scans": "number",
        "conversions": "number"
      }
    ],
    "dailyTrend": [
      {
        "date": "string",
        "scans": "number",
        "conversions": "number"
      }
    ]
  }
}
```

---

### Product Management Endpoints

#### List Products

```http
GET /api/products
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| category | string | Category ID |
| search | string | Search by name |
| status | string | active/inactive |

#### Create Product

```http
POST /api/products
```

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "price": "number",
  "images": ["string"],
  "variants": [
    {
      "name": "string",
      "price": "number",
      "sku": "string"
    }
  ],
  "inventory": {
    "trackQuantity": "boolean",
    "quantity": "number",
    "lowStockThreshold": "number"
  }
}
```

#### Update Product

```http
PUT /api/products/:id
```

**Request Body:** Same as Create (all fields optional)

#### Delete Product

```http
DELETE /api/products/:id
```

#### Search Products

```http
GET /api/products/search
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| q | string | Search query |
| category | string | Category filter |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |

---

### Order Management Endpoints

#### List Orders

```http
GET /api/orders
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| status | string | Order status filter |
| dateFrom | ISO8601 | Start date |
| dateTo | ISO8601 | End date |
| customerId | string | Filter by customer |

#### Get Order Details

```http
GET /api/orders/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "string",
    "customer": {
      "id": "string",
      "name": "string",
      "phone": "string"
    },
    "items": [
      {
        "productId": "string",
        "name": "string",
        "quantity": "number",
        "unitPrice": "number",
        "subtotal": "number"
      }
    ],
    "subtotal": "number",
    "tax": "number",
    "discount": "number",
    "total": "number",
    "status": "pending|confirmed|preparing|ready|dispatched|delivered|cancelled",
    "paymentMethod": "cash|card|upi|wallet",
    "paymentStatus": "pending|paid|refunded",
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

#### Update Order Status

```http
PATCH /api/orders/:id/status
```

**Request Body:**
```json
{
  "status": "confirmed|preparing|ready|dispatched|delivered|cancelled",
  "reason": "string (required for cancellation)"
}
```

#### Process Refund

```http
POST /api/orders/:id/refund
```

**Request Body:**
```json
{
  "amount": "number",
  "reason": "string"
}
```

---

### Customer Management Endpoints

#### Get Customer Profile

```http
GET /api/customers/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "totalOrders": "number",
    "totalSpent": "number",
    "lastVisit": "ISO8601",
    "tags": ["string"],
    "notes": "string"
  }
}
```

#### Update Customer Notes

```http
PATCH /api/customers/:userId
```

**Request Body:**
```json
{
  "notes": "string",
  "tags": ["string"]
}
```

#### Add Customer Tag

```http
POST /api/customers/:userId/tags
```

**Request Body:**
```json
{
  "tag": "string"
}
```

#### Remove Customer Tag

```http
DELETE /api/customers/:userId/tags/:tag
```

---

### Analytics Endpoints

#### Get Analytics Overview

```http
GET /api/analytics/overview
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| startDate | ISO8601 | 30 days ago | Start date |
| endDate | ISO8601 | now | End date |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": "number",
    "totalRevenue": "number",
    "avgOrderValue": "number",
    "totalCustomers": "number",
    "newCustomers": "number",
    "returningCustomers": "number",
    "topProducts": [
      {
        "productId": "string",
        "name": "string",
        "quantity": "number",
        "revenue": "number"
      }
    ]
  }
}
```

#### Get Sales Analytics

```http
GET /api/analytics/sales
```

#### Get Customer Analytics

```http
GET /api/analytics/customers
```

#### Get Product Analytics

```http
GET /api/analytics/products
```

#### Get Real-time Metrics

```http
GET /api/analytics/realtime
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeOrders": "number",
    "pendingOrders": "number",
    "todayRevenue": "number",
    "todayOrders": "number",
    "onlineCustomers": "number"
  }
}
```

---

### Notification Endpoints

#### Get Notifications

```http
GET /api/notifications
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| unreadOnly | boolean | false | Filter unread |

#### Mark Notification Read

```http
PATCH /api/notifications/:id/read
```

#### Register Push Token

```http
POST /api/notifications/register-token
```

**Request Body:**
```json
{
  "token": "string",
  "platform": "android|ios|web"
}
```

#### Update Notification Preferences

```http
PUT /api/notifications/preferences
```

**Request Body:**
```json
{
  "orderUpdates": "boolean",
  "marketing": "boolean",
  "alerts": "boolean"
}
```

---

## Loyalty/Karma Service

**Base Path**: `/api/loyalty`  
**Service**: `rez-loyalty-service`  
**Authentication**: JWT Bearer token required

### Karma Levels

#### Get User Karma Profile

```http
GET /api/loyalty/karma/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_abc123",
    "karmaLevel": 5,
    "karmaTitle": "Rising Star",
    "currentKarma": 2450,
    "totalKarma": 3200,
    "levelProgress": 78,
    "nextLevel": {
      "level": 6,
      "title": "Superstar",
      "requiredKarma": 3200
    },
    "lifetimeKarma": 12500,
    "rank": 142,
    "percentile": 95.2
  }
}
```

---

#### Get Karma Leaderboard

```http
GET /api/loyalty/karma/leaderboard
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | string | weekly | daily/weekly/monthly/all-time |
| limit | number | 50 | Top N users |
| offset | number | 0 | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user_xyz789",
        "name": "Priya S.",
        "karmaLevel": 12,
        "karmaTitle": "Legend",
        "karmaEarned": 5200,
        "avatar": "https://..."
      }
    ],
    "currentUser": {
      "rank": 142,
      "karmaEarned": 450
    },
    "totalParticipants": 15420
  }
}
```

---

#### Get Karma History

```http
GET /api/loyalty/karma/:userId/history
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| actionType | string | - | earn/redeem/adjust |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "karmahist_001",
        "action": "earn",
        "type": "streak_bonus",
        "karmaAmount": 150,
        "description": "7-day streak bonus",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "hasNext": true
    }
  }
}
```

---

#### Earn Karma Points

```http
POST /api/loyalty/karma/earn
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "action": "order_complete|review|share|referral|social_share|checkin",
  "metadata": {
    "orderId": "order_abc123",
    "amount": 500,
    "rating": 5
  }
}
```

**Action Types:**
| Action | Karma Earned | Conditions |
|--------|-------------|------------|
| order_complete | 1 per Rs.10 spent | Min order Rs.100 |
| review | 50 | Only verified purchases |
| share | 25 | Once per item |
| referral_signup | 200 | Per referred user |
| referral_purchase | 500 | When referral makes first order |
| social_share | 30 | Once per platform per day |
| checkin | 10 | Once per day per store |

**Response:**
```json
{
  "success": true,
  "data": {
    "karmaEarned": 150,
    "newKarmaBalance": 2600,
    "levelProgress": 81.25,
    "badgesUnlocked": []
  }
}
```

---

### Badges System

#### Get All Badges

```http
GET /api/loyalty/badges
```

**Response:**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "badge_001",
        "name": "Early Bird",
        "description": "Place first order before 7 AM",
        "icon": "badge-early-bird.png",
        "category": "ordering",
        "rarity": "common",
        "criteria": {
          "type": "early_order",
          "condition": "before",
          "time": "07:00"
        }
      },
      {
        "id": "badge_002",
        "name": "Super Fan",
        "description": "Order from the same store 30 times",
        "icon": "badge-superfan.png",
        "category": "loyalty",
        "rarity": "rare",
        "criteria": {
          "type": "store_loyalty",
          "count": 30
        }
      }
    ],
    "totalCount": 45
  }
}
```

---

#### Get User Badges

```http
GET /api/loyalty/badges/user/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "earned": [
      {
        "badgeId": "badge_001",
        "name": "Early Bird",
        "icon": "badge-early-bird.png",
        "rarity": "common",
        "unlockedAt": "2024-01-10T06:45:00Z",
        "displayOrder": 1
      }
    ],
    "progress": [
      {
        "badgeId": "badge_002",
        "name": "Super Fan",
        "currentProgress": 25,
        "targetProgress": 30,
        "percentComplete": 83
      }
    ],
    "totalEarned": 12,
    "totalAvailable": 45
  }
}
```

---

#### Unlock Badge

```http
POST /api/loyalty/badges/unlock
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "badgeId": "badge_001",
  "userId": "user_abc123"
}
```

---

### Missions System

#### Get Available Missions

```http
GET /api/loyalty/missions
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | active | active/completed/expired |
| category | string | - | daily/weekly/special |

**Response:**
```json
{
  "success": true,
  "data": {
    "missions": [
      {
        "missionId": "mission_001",
        "title": "Order 3 times this week",
        "description": "Place 3 orders and earn double karma",
        "category": "weekly",
        "type": "order_count",
        "target": 3,
        "currentProgress": 1,
        "rewards": {
          "karma": 500,
          "bonus": "2x_karma"
        },
        "expiresAt": "2024-01-21T23:59:59Z",
        "status": "active"
      },
      {
        "missionId": "mission_002",
        "title": "Refer a friend",
        "description": "Get your friend to sign up",
        "category": "special",
        "type": "referral",
        "target": 1,
        "currentProgress": 0,
        "rewards": {
          "karma": 200,
          "coins": 100
        },
        "expiresAt": null,
        "status": "active"
      }
    ],
    "dailyMissions": [...],
    "weeklyMissions": [...],
    "specialMissions": [...]
  }
}
```

---

#### Get Mission Progress

```http
GET /api/loyalty/missions/progress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeMissions": 5,
    "completedMissions": 23,
    "totalKarmaEarned": 4500,
    "missions": [
      {
        "missionId": "mission_001",
        "title": "Order 3 times this week",
        "progress": {
          "current": 1,
          "target": 3,
          "percentComplete": 33
        },
        "rewards": {
          "karma": 500,
          "bonus": "2x_karma"
        },
        "completedAt": null,
        "isExpired": false
      }
    ]
  }
}
```

---

#### Claim Mission Reward

```http
POST /api/loyalty/missions/:missionId/claim
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "missionId": "mission_001",
    "status": "completed",
    "rewardsClaimed": {
      "karma": 500,
      "coins": 0
    },
    "newKarmaBalance": 2950,
    "bonusApplied": "2x_karma_active"
  }
}
```

**Error Codes:**
| Code | Message |
|------|---------|
| MISSION_NOT_COMPLETE | Mission target not yet reached |
| MISSION_ALREADY_CLAIMED | Reward already claimed |
| MISSION_EXPIRED | Mission has expired |

---

### CSR Dashboard

#### Get CSR Overview

```http
GET /api/loyalty/csr/dashboard
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalKarmaPool": 5000000,
    "karmaRedeemed": 3200000,
    "karmaAvailable": 1800000,
    "activeCampaigns": 8,
    "totalBeneficiaries": 12500,
    "impactMetrics": {
      "mealsDonated": 15000,
      "treesPlanted": 500,
      "wasteReduced": "2500kg",
      "carbonOffset": "12000kg"
    },
    "topContributors": [
      {
        "userId": "user_001",
        "name": "Anonymous",
        "karmaContributed": 25000
      }
    ],
    "recentActivity": [
      {
        "type": "redemption",
        "userId": "user_abc",
        "amount": 500,
        "beneficiary": "Local Food Bank",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

#### Create CSR Campaign

```http
POST /api/loyalty/csr/campaigns
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Feed the Hungry",
  "description": "Donate karma to provide meals",
  "cause": "hunger_relief",
  "targetAmount": 100000,
  "karmaValue": 10,
  "beneficiaryId": "charity_001",
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "maxContributions": null,
  "imageUrl": "https://..."
}
```

**Causes:** `hunger_relief`, `education`, `healthcare`, `environment`, `animal_welfare`, `disaster_relief`

---

#### Get CSR Campaigns

```http
GET /api/loyalty/csr/campaigns
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | active/completed/pending |
| cause | string | Filter by cause |
| page | number | Page number |
| limit | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "campaignId": "csr_001",
        "name": "Feed the Hungry",
        "cause": "hunger_relief",
        "targetAmount": 100000,
        "currentAmount": 65000,
        "contributorCount": 1234,
        "status": "active",
        "endDate": "2024-03-31"
      }
    ],
    "pagination": {...}
  }
}
```

---

#### Contribute to CSR Campaign

```http
POST /api/loyalty/csr/campaigns/:campaignId/contribute
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "karmaAmount": 500,
  "message": "Happy to help!"
}
```

---

### Communities

#### Get Communities

```http
GET /api/loyalty/communities
```

**Response:**
```json
{
  "success": true,
  "data": {
    "communities": [
      {
        "communityId": "comm_001",
        "name": "Food Enthusiasts",
        "description": "For those who love exploring cuisines",
        "memberCount": 5420,
        "isPrivate": false,
        "icon": "community-food.png",
        "tags": ["food", "dining", "exploration"],
        "featured": true
      }
    ]
  }
}
```

---

#### Join Community

```http
POST /api/loyalty/communities/:communityId/join
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "communityId": "comm_001",
    "status": "member",
    "joinedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Get Community Feed

```http
GET /api/loyalty/communities/:communityId/feed
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| type | string | - | post/achievement/event |

**Response:**
```json
{
  "success": true,
  "data": {
    "feed": [
      {
        "postId": "post_001",
        "type": "achievement",
        "userId": "user_abc",
        "userName": "Priya S.",
        "content": "Just earned the Super Fan badge!",
        "media": ["https://..."],
        "likes": 45,
        "comments": 12,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### Streak System

#### Get User Streaks

```http
GET /api/loyalty/streaks/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 12,
    "longestStreak": 30,
    "streakStatus": "active",
    "lastActivityDate": "2024-01-15",
    "streakHistory": [
      {
        "date": "2024-01-15",
        "completed": true,
        "activities": ["order", "checkin"]
      }
    ],
    "streakMilestones": [
      {
        "days": 7,
        "reached": true,
        "reward": {"karma": 100, "badge": "badge_streak_7"}
      },
      {
        "days": 30,
        "reached": true,
        "reward": {"karma": 500, "badge": "badge_streak_30"}
      },
      {
        "days": 100,
        "reached": false,
        "current": 12,
        "reward": {"karma": 2000, "badge": "badge_streak_100"}
      }
    ],
    "upcomingReward": {
      "daysUntil": 3,
      "reward": {"karma": 50}
    }
  }
}
```

---

#### Record Streak Activity

```http
POST /api/loyalty/streaks/activity
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "activityType": "order|checkin|review|payment",
  "storeId": "store_abc123",
  "metadata": {
    "orderId": "order_xyz",
    "amount": 250
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "streakUpdated": true,
    "newStreakCount": 13,
    "bonusEarned": {
      "karma": 25,
      "streakBonus": 50
    },
    "milestoneReached": {
      "days": 13,
      "reward": {"karma": 25}
    }
  }
}
```

---

### Micro-Actions

#### Get Available Micro-Actions

```http
GET /api/loyalty/micro-actions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "microActions": [
      {
        "actionId": "micro_001",
        "title": "Complete your profile",
        "description": "Add a profile picture and bio",
        "actionType": "profile_completion",
        "karmaReward": 50,
        "coinReward": 25,
        "cooldown": null,
        "maxCompletions": 1,
        "currentCompletions": 0,
        "status": "available"
      },
      {
        "actionId": "micro_002",
        "title": "Daily login",
        "description": "Open the app today",
        "actionType": "daily_login",
        "karmaReward": 5,
        "coinReward": 2,
        "cooldown": "1d",
        "maxCompletions": 1,
        "currentCompletions": 0,
        "status": "available"
      },
      {
        "actionId": "micro_003",
        "title": "Share on social",
        "description": "Share your order on Twitter",
        "actionType": "social_share",
        "karmaReward": 30,
        "coinReward": 15,
        "cooldown": "1d",
        "maxCompletions": 1,
        "currentCompletions": 0,
        "platform": "twitter",
        "status": "available"
      }
    ],
    "totalAvailable": 8,
    "totalCompleted": 15
  }
}
```

---

#### Complete Micro-Action

```http
POST /api/loyalty/micro-actions/:actionId/complete
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "proof": {
    "type": "screenshot|share_link|verification",
    "url": "https://..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "actionId": "micro_001",
    "status": "completed",
    "rewards": {
      "karma": 50,
      "coins": 25
    },
    "newKarmaBalance": 3000,
    "newCoinBalance": 525
  }
}
```

---

#### Get Micro-Action History

```http
GET /api/loyalty/micro-actions/history
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "actionId": "micro_001",
        "title": "Complete your profile",
        "karmaEarned": 50,
        "coinsEarned": 25,
        "completedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

## Marketing/Campaigns Service

**Base Path**: `/api/campaigns`  
**Service**: `rez-marketing-service`  
**Authentication**: JWT Bearer token (admin) required

### Campaign Management

#### Create Campaign

```http
POST /api/campaigns
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Summer Sale 2024",
  "description": "Exciting summer discounts",
  "type": "promotional",
  "status": "draft",
  "targeting": {
    "segments": ["all_users", "high_spenders"],
    "excludeSegments": ["churned"],
    "minOrders": 3,
    "maxOrders": null,
    "lastOrderDays": 30,
    "locations": ["Mumbai", "Delhi"],
    "channels": ["push", "email", "sms"]
  },
  "schedule": {
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-06-30T23:59:59Z",
    "timezone": "Asia/Kolkata"
  },
  "budget": {
    "total": 500000,
    "dailyLimit": 25000,
    "spent": 0
  },
  "creative": {
    "title": "Summer Sale - Up to 50% Off!",
    "body": "Cool deals for the hot season",
    "imageUrl": "https://...",
    "ctaText": "Shop Now",
    "ctaUrl": "https://rez.money/summer-sale"
  },
  "offers": [
    {
      "type": "discount",
      "value": 20,
      "unit": "percent",
      "minOrderValue": 500,
      "maxDiscount": 200,
      "appliesTo": "entire_order"
    }
  ]
}
```

**Campaign Types:** `promotional`, `loyalty`, `re-engagement`, `seasonal`, `anniversary`, `abandoned_cart`

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "camp_abc123",
    "name": "Summer Sale 2024",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Get Campaigns

```http
GET /api/campaigns
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | draft/scheduled/active/paused/completed |
| type | string | Campaign type filter |
| page | number | Page number |
| limit | number | Items per page |
| startDate | ISO8601 | Filter start |
| endDate | ISO8601 | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "campaignId": "camp_abc123",
        "name": "Summer Sale 2024",
        "type": "promotional",
        "status": "active",
        "targetAudience": 25000,
        "sentCount": 18500,
        "openRate": 45.2,
        "clickRate": 12.5,
        "conversionRate": 3.2,
        "budget": {
          "total": 500000,
          "spent": 125000,
          "remaining": 375000
        },
        "schedule": {
          "startDate": "2024-06-01",
          "endDate": "2024-06-30"
        }
      }
    ],
    "pagination": {...}
  }
}
```

---

#### Get Campaign Details

```http
GET /api/campaigns/:campaignId
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "camp_abc123",
    "name": "Summer Sale 2024",
    "description": "Exciting summer discounts",
    "type": "promotional",
    "status": "active",
    "targeting": {...},
    "schedule": {...},
    "creative": {...},
    "offers": [...],
    "stats": {
      "targeted": 25000,
      "sent": 18500,
      "delivered": 18200,
      "opened": 8234,
      "clicked": 2288,
      "converted": 590,
      "revenue": 295000,
      "openRate": 45.2,
      "clickRate": 12.5,
      "conversionRate": 3.2
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

---

#### Update Campaign

```http
PUT /api/campaigns/:campaignId
Authorization: Bearer <adminToken>
```

**Request Body:** Same as Create (all fields optional)

**Note:** Cannot update active campaigns. Pause first to modify.

---

#### Pause/Resume Campaign

```http
POST /api/campaigns/:campaignId/status
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "status": "paused|active"
}
```

---

#### Delete Campaign

```http
DELETE /api/campaigns/:campaignId
Authorization: Bearer <adminToken>
```

**Note:** Only draft or completed campaigns can be deleted.

---

### Audience Targeting

#### Get Segments

```http
GET /api/campaigns/segments
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "segmentId": "seg_all_users",
        "name": "All Users",
        "description": "All registered users",
        "userCount": 150000,
        "criteria": {}
      },
      {
        "segmentId": "seg_high_spenders",
        "name": "High Spenders",
        "description": "Users with LTV > Rs.10,000",
        "userCount": 12500,
        "criteria": {
          "type": "ltv",
          "operator": "gt",
          "value": 10000
        }
      },
      {
        "segmentId": "seg_churned",
        "name": "Churned Users",
        "description": "No activity in 60+ days",
        "userCount": 8500,
        "criteria": {
          "type": "inactivity",
          "days": 60
        }
      },
      {
        "segmentId": "seg_new_users",
        "name": "New Users",
        "description": "Registered in last 30 days",
        "userCount": 3200,
        "criteria": {
          "type": "registration",
          "withinDays": 30
        }
      }
    ]
  }
}
```

---

#### Create Segment

```http
POST /api/campaigns/segments
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Weekend Diners",
  "description": "Users who order on weekends",
  "rules": [
    {
      "field": "order_day",
      "operator": "in",
      "value": ["saturday", "sunday"]
    },
    {
      "field": "order_count",
      "operator": "gte",
      "value": 4
    }
  ],
  "logic": "AND"
}
```

---

#### Preview Segment Audience

```http
POST /api/campaigns/segments/preview
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "rules": [
    {
      "field": "total_orders",
      "operator": "gte",
      "value": 5
    },
    {
      "field": "location",
      "operator": "eq",
      "value": "Mumbai"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedUsers": 8750,
    "sampleUsers": [
      {"userId": "user_001", "name": "John D.", "orders": 12},
      {"userId": "user_002", "name": "Priya S.", "orders": 8}
    ]
  }
}
```

---

### Broadcasts

#### Create Broadcast

```http
POST /api/campaigns/broadcasts
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "title": "System Maintenance Notice",
  "message": "Our app will be under maintenance from 2-4 AM.",
  "channels": ["push", "email", "sms"],
  "priority": "high",
  "targeting": {
    "segments": ["all_users"]
  },
  "schedule": {
    "sendAt": "2024-01-20T02:00:00Z",
    "timezone": "Asia/Kolkata"
  }
}
```

**Priority Levels:** `low`, `normal`, `high`, `urgent`

---

#### Get Broadcasts

```http
GET /api/campaigns/broadcasts
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | pending/sending/sent/failed |
| priority | string | Priority filter |
| page | number | Page number |
| limit | number | Items per page |

---

#### Cancel Broadcast

```http
DELETE /api/campaigns/broadcasts/:broadcastId
Authorization: Bearer <adminToken>
```

**Note:** Only pending broadcasts can be cancelled.

---

### Push Notifications

#### Send Push Notification

```http
POST /api/notifications/push
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user_abc123",
  "title": "Order Delivered!",
  "body": "Your order #RZ12345 has been delivered.",
  "data": {
    "type": "order_update",
    "orderId": "order_abc123",
    "actionUrl": "/orders/RZ12345"
  },
  "options": {
    "sound": "default",
    "badge": 1,
    "mutableContent": true,
    "category": "order"
  }
}
```

---

#### Send Bulk Push

```http
POST /api/notifications/push/bulk
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "userIds": ["user_001", "user_002"],
  "title": "Flash Sale!",
  "body": "50% off for the next 2 hours",
  "data": {...}
}
```

---

#### Get Push Stats

```http
GET /api/notifications/push/stats
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| startDate | ISO8601 | Filter start |
| endDate | ISO8601 | Filter end |
| campaignId | string | Filter by campaign |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 150000,
    "delivered": 148500,
    "opened": 67000,
    "clicked": 22000,
    "failed": 1500,
    "deliveredRate": 99.0,
    "openRate": 45.1,
    "clickRate": 14.8
  }
}
```

---

### Discounts & Offers

#### Create Discount

```http
POST /api/campaigns/discounts
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "SUMMER20",
  "description": "20% off on all orders",
  "type": "percentage",
  "value": 20,
  "minOrderValue": 500,
  "maxDiscount": 200,
  "usageLimit": {
    "total": 1000,
    "perUser": 1
  },
  "validity": {
    "startDate": "2024-06-01",
    "endDate": "2024-06-30"
  },
  "appliesTo": {
    "type": "entire_order|specific_products|categories",
    "productIds": [],
    "categoryIds": []
  },
  "userEligibility": {
    "segments": ["new_users"],
    "minOrders": 0
  },
  "stackable": false,
  "autoApply": true
}
```

**Discount Types:** `percentage`, `fixed_amount`, `buy_x_get_y`, `free_delivery`, `free_item`

---

#### Get Discounts

```http
GET /api/campaigns/discounts
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | active/expired/upcoming |
| type | string | Discount type |
| page | number | Page number |
| limit | number | Items per page |

---

#### Validate Discount

```http
POST /api/campaigns/discounts/validate
```

**Request Body:**
```json
{
  "code": "SUMMER20",
  "userId": "user_abc123",
  "orderValue": 800,
  "productIds": ["prod_001", "prod_002"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discount": {
      "type": "percentage",
      "value": 20,
      "calculatedDiscount": 160,
      "finalValue": 640
    },
    "message": "Discount applied successfully"
  }
}
```

---

#### Apply Discount

```http
POST /api/campaigns/discounts/apply
```

**Request Body:**
```json
{
  "code": "SUMMER20",
  "userId": "user_abc123",
  "orderId": "order_xyz789"
}
```

---

### Coupons

#### Generate Coupons

```http
POST /api/campaigns/coupons/generate
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "prefix": "SUMMER",
  "count": 100,
  "length": 8,
  "discount": {
    "type": "percentage",
    "value": 15
  },
  "usageLimit": {
    "total": 1,
    "perUser": 1
  },
  "validity": {
    "startDate": "2024-06-01",
    "endDate": "2024-06-30"
  },
  "metadata": {
    "campaignId": "camp_abc123",
    "batchName": "Summer Campaign Batch 1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "generated": 100,
    "coupons": [
      "SUMMER-A1B2C3D4",
      "SUMMER-E5F6G7H8"
    ],
    "csvDownloadUrl": "/exports/coupons_batch_xyz789.csv"
  }
}
```

---

#### Get Coupon Usage

```http
GET /api/campaigns/coupons/:couponCode/usage
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "couponCode": "SUMMER-A1B2C3D4",
    "discount": {
      "type": "percentage",
      "value": 15
    },
    "usage": {
      "totalAllowed": 1,
      "used": 1,
      "remaining": 0
    },
    "redemptions": [
      {
        "userId": "user_abc",
        "orderId": "order_xyz",
        "discountAmount": 75,
        "redeemedAt": "2024-06-05T14:30:00Z"
      }
    ],
    "validUntil": "2024-06-30T23:59:59Z",
    "status": "fully_redeemed"
  }
}
```

---

#### Deactivate Coupon

```http
POST /api/campaigns/coupons/:couponCode/deactivate
Authorization: Bearer <adminToken>
```

---

### Offer Management

#### Get Offers

```http
GET /api/campaigns/offers
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "offerId": "offer_001",
        "name": "Free Delivery",
        "description": "Free delivery on orders above Rs.300",
        "type": "free_delivery",
        "conditions": {
          "minOrderValue": 300
        },
        "validity": {
          "startDate": "2024-01-01",
          "endDate": "2024-12-31"
        },
        "usageCount": 5420,
        "status": "active"
      }
    ]
  }
}
```

---

#### Create Offer

```http
POST /api/campaigns/offers
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Combo Meal Deal",
  "description": "Burger + Fries + Drink at Rs.199",
  "type": "combo",
  "items": [
    {"productId": "prod_burger", "quantity": 1},
    {"productId": "prod_fries", "quantity": 1},
    {"productId": "prod_drink", "quantity": 1}
  ],
  "comboPrice": 199,
  "originalPrice": 280,
  "validity": {
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "hours": {
      "start": "11:00",
      "end": "22:00"
    }
  },
  "applicableStores": ["store_mum_001", "store_del_001"],
  "dailyLimit": 50,
  "remainingToday": 35
}
```

---

## Appointments Service

**Base Path**: `/api/appointments`  
**Service**: `rez-appointments-service`  
**Authentication**: JWT Bearer token required

### Booking Slots

#### Get Available Slots

```http
GET /api/appointments/slots
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| serviceId | string | Yes | Service ID |
| date | string | Yes | Date (YYYY-MM-DD) |
| staffId | string | No | Filter by staff |
| storeId | string | Yes | Store ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-20",
    "serviceId": "svc_001",
    "slots": [
      {
        "slotId": "slot_001",
        "startTime": "09:00",
        "endTime": "09:45",
        "staffId": "staff_001",
        "staffName": "Priya S.",
        "available": true,
        "bufferAfter": 15
      },
      {
        "slotId": "slot_002",
        "startTime": "09:45",
        "endTime": "10:30",
        "staffId": "staff_001",
        "staffName": "Priya S.",
        "available": false,
        "bookedBy": "John D."
      }
    ]
  }
}
```

---

#### Get Staff Availability

```http
GET /api/appointments/staff/:staffId/availability
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |
| serviceId | string | No | Filter by service |

**Response:**
```json
{
  "success": true,
  "data": {
    "staffId": "staff_001",
    "staffName": "Priya S.",
    "availability": [
      {
        "date": "2024-01-20",
        "dayOfWeek": "Saturday",
        "available": true,
        "slots": [
          {"time": "09:00", "available": true},
          {"time": "09:45", "available": false},
          {"time": "10:30", "available": true}
        ]
      },
      {
        "date": "2024-01-21",
        "dayOfWeek": "Sunday",
        "available": false,
        "reason": "day_off"
      }
    ]
  }
}
```

---

#### Book Appointment

```http
POST /api/appointments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "serviceId": "svc_001",
  "slotId": "slot_001",
  "storeId": "store_mum_001",
  "staffId": "staff_001",
  "customer": {
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com"
  },
  "date": "2024-01-20",
  "time": "09:00",
  "duration": 45,
  "notes": "First-time customer, prefers window seat",
  "preferences": {
    "reminder30min": true,
    "reminder1day": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointmentId": "apt_xyz789",
    "confirmationCode": "APT-2024-001234",
    "status": "confirmed",
    "service": {
      "id": "svc_001",
      "name": "Haircut & Styling",
      "duration": 45,
      "price": 500
    },
    "staff": {
      "id": "staff_001",
      "name": "Priya S."
    },
    "store": {
      "id": "store_mum_001",
      "name": "ReZ Salon - Andheri",
      "address": "123 Main St, Andheri West"
    },
    "date": "2024-01-20",
    "time": "09:00",
    "customer": {...},
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Get Appointments

```http
GET /api/appointments
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | - | pending/confirmed/completed/cancelled |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |
| storeId | string | - | Filter by store |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "appointmentId": "apt_xyz789",
        "confirmationCode": "APT-2024-001234",
        "status": "confirmed",
        "service": {...},
        "staff": {...},
        "date": "2024-01-20",
        "time": "09:00",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

#### Update Appointment

```http
PUT /api/appointments/:appointmentId
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "slotId": "slot_002",
  "date": "2024-01-21",
  "time": "14:00",
  "notes": "Updated preferences"
}
```

---

#### Cancel Appointment

```http
POST /api/appointments/:appointmentId/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Schedule conflict",
  "notifyStaff": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointmentId": "apt_xyz789",
    "status": "cancelled",
    "refundApplicable": true,
    "refundAmount": 500,
    "cancellationPolicy": "Free cancellation up to 2 hours before"
  }
}
```

---

#### Reschedule Appointment

```http
POST /api/appointments/:appointmentId/reschedule
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "newSlotId": "slot_003",
  "newDate": "2024-01-22",
  "newTime": "11:00"
}
```

---

### Walk-ins

#### Check-in Walk-in

```http
POST /api/appointments/walkin
Authorization: Bearer <staffToken>
```

**Request Body:**
```json
{
  "storeId": "store_mum_001",
  "customer": {
    "name": "Jane Smith",
    "phone": "+919876543211"
  },
  "serviceId": "svc_002",
  "queuePosition": null,
  "estimatedWait": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "walkinId": "walkin_001",
    "queuePosition": 3,
    "estimatedWaitMinutes": 30,
    "status": "waiting",
    "checkinTime": "2024-01-15T14:30:00Z"
  }
}
```

---

#### Get Walk-in Queue

```http
GET /api/appointments/walkin/queue/:storeId
Authorization: Bearer <staffToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "store_mum_001",
    "queue": [
      {
        "walkinId": "walkin_001",
        "customerName": "Jane Smith",
        "serviceName": "Massage",
        "checkinTime": "2024-01-15T14:30:00Z",
        "queuePosition": 1,
        "estimatedWait": 0,
        "status": "in_service"
      },
      {
        "walkinId": "walkin_002",
        "customerName": "Bob W.",
        "serviceName": "Haircut",
        "checkinTime": "2024-01-15T14:35:00Z",
        "queuePosition": 2,
        "estimatedWait": 20,
        "status": "waiting"
      }
    ],
    "totalInQueue": 5,
    "avgWaitTime": 25
  }
}
```

---

#### Complete Walk-in

```http
POST /api/appointments/walkin/:walkinId/complete
Authorization: Bearer <staffToken>
```

**Request Body:**
```json
{
  "actualDuration": 35,
  "notes": "Customer satisfied",
  "addToLoyalty": true
}
```

---

### Class Schedules

#### Get Class Schedule

```http
GET /api/appointments/classes/schedule
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| startDate | string | today | Start date |
| endDate | string | +7 days | End date |
| category | string | - | Class category |
| storeId | string | - | Filter by store |
| instructorId | string | - | Filter by instructor |

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "classId": "class_001",
        "name": "Morning Yoga",
        "category": "fitness",
        "description": "Start your day with energizing yoga",
        "instructor": {
          "id": "inst_001",
          "name": "Ravi K."
        },
        "store": {
          "id": "store_mum_001",
          "name": "ReZ Fitness - Bandra"
        },
        "schedule": {
          "date": "2024-01-20",
          "startTime": "06:00",
          "endTime": "07:00",
          "recurrence": "daily"
        },
        "capacity": {
          "total": 20,
          "booked": 15,
          "available": 5
        },
        "pricing": {
          "member": 0,
          "guest": 200
        }
      }
    ]
  }
}
```

---

#### Book Class

```http
POST /api/appointments/classes/:classId/book
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "date": "2024-01-20",
  "guests": 0,
  "paymentMethod": "wallet",
  "notes": "Beginner level"
}
```

---

#### Cancel Class Booking

```http
POST /api/appointments/classes/bookings/:bookingId/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Schedule conflict",
  "refund": true
}
```

---

### Capacity Management

#### Get Capacity Overview

```http
GET /api/appointments/capacity/overview
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| storeId | string | Store ID |
| date | string | Date (YYYY-MM-DD) |

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "store_mum_001",
    "date": "2024-01-20",
    "capacity": {
      "totalSlots": 80,
      "bookedSlots": 52,
      "availableSlots": 28,
      "utilizationRate": 65
    },
    "byService": [
      {
        "serviceId": "svc_001",
        "serviceName": "Haircut",
        "total": 30,
        "booked": 22,
        "available": 8
      }
    ],
    "byStaff": [
      {
        "staffId": "staff_001",
        "staffName": "Priya S.",
        "totalSlots": 20,
        "booked": 18,
        "available": 2
      }
    ],
    "peakHours": [
      {"time": "10:00", "booked": 12},
      {"time": "11:00", "booked": 15},
      {"time": "14:00", "booked": 14}
    ]
  }
}
```

---

#### Set Capacity Limits

```http
PUT /api/appointments/capacity/limits
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "storeId": "store_mum_001",
  "dailyCapacity": 100,
  "hourlyCapacity": {
    "09:00": 8,
    "10:00": 10,
    "11:00": 10,
    "12:00": 8
  },
  "serviceLimits": {
    "svc_001": {"hourly": 4},
    "svc_002": {"hourly": 2}
  },
  "staffLimits": {
    "staff_001": {"daily": 15},
    "staff_002": {"daily": 12}
  }
}
```

---

## Staff/Team Service

**Base Path**: `/api/staff`  
**Service**: `rez-staff-service`  
**Authentication**: JWT Bearer token required

### Team Management

#### Get Staff Members

```http
GET /api/staff
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| storeId | string | - | Filter by store |
| role | string | - | Filter by role |
| status | string | active | Filter by status |
| department | string | - | Filter by department |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "staffId": "staff_001",
        "employeeId": "EMP001",
        "name": "Priya Sharma",
        "email": "priya@rez.money",
        "phone": "+919876543210",
        "role": "stylist",
        "department": "salon",
        "store": {
          "id": "store_mum_001",
          "name": "ReZ Salon - Andheri"
        },
        "status": "active",
        "joinDate": "2023-06-15",
        "permissions": ["appointments.manage", "pos.access"]
      }
    ],
    "pagination": {...}
  }
}
```

---

#### Add Staff Member

```http
POST /api/staff
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Rahul Verma",
  "email": "rahul@rez.money",
  "phone": "+919876543211",
  "role": "cashier",
  "department": "retail",
  "storeId": "store_mum_001",
  "permissions": ["pos.access", "inventory.view"],
  "reportsTo": "staff_002",
  "joinDate": "2024-02-01",
  "employmentType": "full_time",
  "salary": {
    "amount": 25000,
    "currency": "INR",
    "frequency": "monthly"
  },
  "documents": {
    "aadhar": "doc_aadhar_001",
    "pan": "doc_pan_001"
  }
}
```

**Roles:** `admin`, `manager`, `supervisor`, `stylist`, `therapist`, `cashier`, `server`, `cook`, `delivery`

---

#### Get Staff Details

```http
GET /api/staff/:staffId
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staffId": "staff_001",
    "employeeId": "EMP001",
    "name": "Priya Sharma",
    "email": "priya@rez.money",
    "phone": "+919876543210",
    "role": "stylist",
    "department": "salon",
    "store": {...},
    "status": "active",
    "joinDate": "2023-06-15",
    "permissions": ["appointments.manage", "pos.access"],
    "reporting": {
      "reportsTo": {
        "staffId": "staff_002",
        "name": "Manager Name"
      },
      "directReports": []
    },
    "stats": {
      "appointmentsCompleted": 450,
      "avgRating": 4.8,
      "customersServed": 320
    }
  }
}
```

---

#### Update Staff Member

```http
PUT /api/staff/:staffId
Authorization: Bearer <adminToken>
```

**Request Body:** Same as Add (all fields optional)

---

#### Deactivate Staff

```http
POST /api/staff/:staffId/deactivate
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "reason": "Resignation",
  "lastWorkingDay": "2024-02-15",
  "exitInterview": true,
  "transferCustomers": true,
  "targetStaffId": "staff_003"
}
```

---

### Shifts

#### Get Shift Templates

```http
GET /api/staff/shifts/templates
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "templateId": "shift_001",
        "name": "Morning Shift",
        "startTime": "06:00",
        "endTime": "14:00",
        "breakDuration": 60,
        "applicableRoles": ["stylist", "therapist"]
      },
      {
        "templateId": "shift_002",
        "name": "Evening Shift",
        "startTime": "14:00",
        "endTime": "22:00",
        "breakDuration": 60,
        "applicableRoles": ["stylist", "therapist"]
      }
    ]
  }
}
```

---

#### Create Shift Schedule

```http
POST /api/staff/shifts/schedule
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "storeId": "store_mum_001",
  "weekStartDate": "2024-01-22",
  "shifts": [
    {
      "staffId": "staff_001",
      "templateId": "shift_001",
      "date": "2024-01-22",
      "customStartTime": "06:00",
      "customEndTime": "14:00"
    },
    {
      "staffId": "staff_002",
      "templateId": "shift_002",
      "date": "2024-01-22"
    }
  ],
  "notifyStaff": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduleId": "sched_001",
    "weekStartDate": "2024-01-22",
    "shiftsCreated": 14,
    "conflicts": []
  }
}
```

---

#### Get Shift Schedule

```http
GET /api/staff/shifts/schedule
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| storeId | string | Yes | Store ID |
| staffId | string | No | Filter by staff |
| startDate | string | Yes | Start date |
| endDate | string | Yes | End date |

**Response:**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "shiftId": "shift_abc",
        "staffId": "staff_001",
        "staffName": "Priya S.",
        "date": "2024-01-22",
        "startTime": "06:00",
        "endTime": "14:00",
        "duration": 8,
        "breakDuration": 1,
        "status": "scheduled",
        "clockedInAt": null,
        "clockedOutAt": null
      }
    ]
  }
}
```

---

#### Clock In

```http
POST /api/staff/shifts/:shiftId/clock-in
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "location": {
    "latitude": 19.1355,
    "longitude": 72.8349
  },
  "deviceId": "device_001",
  "notes": "Early arrival"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shiftId": "shift_abc",
    "status": "in_progress",
    "clockedInAt": "2024-01-22T05:55:00Z",
    "scheduledStart": "06:00",
    "earlyBy": 5
  }
}
```

---

#### Clock Out

```http
POST /api/staff/shifts/:shiftId/clock-out
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "location": {
    "latitude": 19.1355,
    "longitude": 72.8349
  },
  "notes": "Completed all appointments"
}
```

---

#### Swap Shifts

```http
POST /api/staff/shifts/swap
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "requesterShiftId": "shift_001",
  "targetStaffId": "staff_002",
  "reason": "Personal commitment"
}
```

---

#### Approve/Reject Shift Swap

```http
POST /api/staff/shifts/swap/:swapId/respond
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "action": "approve|reject",
  "reason": "Cover confirmed"
}
```

---

### Attendance

#### Get Attendance Records

```http
GET /api/staff/attendance
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| storeId | string | Filter by store |
| staffId | string | Filter by staff |
| startDate | string | Start date (YYYY-MM-DD) |
| endDate | string | End date (YYYY-MM-DD) |
| status | string | present/absent/late/leave |

**Response:**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "recordId": "att_001",
        "staffId": "staff_001",
        "staffName": "Priya S.",
        "date": "2024-01-15",
        "status": "present",
        "shift": {
          "scheduledStart": "06:00",
          "scheduledEnd": "14:00",
          "actualStart": "05:55",
          "actualEnd": "14:10"
        },
        "workHours": 8.25,
        "overtime": 0.25,
        "breaks": [
          {"start": "10:00", "end": "10:30", "duration": 30}
        ],
        "lateMinutes": 0,
        "earlyDeparture": 0
      }
    ],
    "summary": {
      "totalDays": 22,
      "present": 20,
      "absent": 1,
      "late": 1,
      "workHours": 176,
      "overtime": 4
    }
  }
}
```

---

#### Mark Attendance

```http
POST /api/staff/attendance/mark
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "staffId": "staff_001",
  "date": "2024-01-15",
  "status": "present",
  "workHours": 8,
  "notes": "Doctor appointment in afternoon"
}
```

---

#### Request Leave

```http
POST /api/staff/leave/request
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "leaveType": "sick|personal|vacation|emergency",
  "startDate": "2024-02-01",
  "endDate": "2024-02-03",
  "reason": "Family wedding",
  "attachments": ["doc_medical.pdf"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaveId": "leave_001",
    "status": "pending",
    "leaveType": "personal",
    "days": 3,
    "startDate": "2024-02-01",
    "endDate": "2024-02-03"
  }
}
```

---

#### Approve/Reject Leave

```http
POST /api/staff/leave/:leaveId/respond
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "action": "approve|reject",
  "reason": "Approved - team coverage arranged"
}
```

---

### Payroll

#### Get Payroll Summary

```http
GET /api/staff/payroll/summary
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| storeId | string | Yes | Store ID |
| period | string | Yes | Period (YYYY-MM) |
| staffId | string | No | Filter by staff |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "storeId": "store_mum_001",
    "staff": [
      {
        "staffId": "staff_001",
        "name": "Priya S.",
        "baseSalary": 25000,
        "workHours": 176,
        "overtimeHours": 4,
        "overtimePay": 1000,
        "incentives": 2500,
        "deductions": {
          "tds": 500,
          "advance": 1000
        },
        "grossPay": 28500,
        "netPay": 27000,
        "status": "pending"
      }
    ],
    "totals": {
      "grossPayroll": 450000,
      "deductions": 15000,
      "netPayroll": 435000
    }
  }
}
```

---

#### Generate Payslip

```http
GET /api/staff/payroll/payslip/:staffId
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | Yes | Period (YYYY-MM) |

**Response:**
```json
{
  "success": true,
  "data": {
    "payslipId": "payslip_001",
    "employee": {
      "staffId": "staff_001",
      "name": "Priya Sharma",
      "employeeId": "EMP001",
      "department": "Salon",
      "designation": "Senior Stylist"
    },
    "period": "2024-01",
    "earnings": {
      "baseSalary": 25000,
      "overtime": 1000,
      "incentives": 2500,
      "allowances": 0,
      "grossEarnings": 28500
    },
    "deductions": {
      "tds": 500,
      "providentFund": 1500,
      "advanceRecovery": 1000,
      "otherDeductions": 0,
      "totalDeductions": 3000
    },
    "netPay": 25500,
    "bankDetails": {
      "accountNumber": "****4567",
      "bankName": "HDFC Bank",
      "ifsc": "HDFC0001234"
    },
    "generatedAt": "2024-02-01T00:00:00Z"
  }
}
```

---

#### Process Payroll

```http
POST /api/staff/payroll/process
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "storeId": "store_mum_001",
  "period": "2024-01",
  "includeStaff": ["staff_001", "staff_002"],
  "options": {
    "deductAdvances": true,
    "calculateOvertime": true,
    "generatePayslips": true
  }
}
```

---

#### Disburse Salary

```http
POST /api/staff/payroll/disburse
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "payrollId": "payroll_001",
  "disbursementMethod": "bank_transfer",
  "processDate": "2024-02-05",
  "notes": "January 2024 salary"
}
```

---

## Finance Service - Extended

**Base Path**: `/api/finance`  
**Service**: `rez-finance-service`  
**Authentication**: JWT Bearer token required

### GST Management

#### Get GST Summary

```http
GET /api/finance/gst/summary
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | Yes | Period (YYYY-MM or YYYY-Q) |
| storeId | string | No | Filter by store |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "gstin": "27AABCU9603R1ZM",
    "summary": {
      "totalSales": 1500000,
      "taxableAmount": 1271186,
      "cgst": 127119,
      "sgst": 127119,
      "igst": 0,
      "cess": 0,
      "totalTax": 254238,
      "tcs": 2542
    },
    "byRate": [
      {"rate": 5, "taxableAmount": 500000, "cgst": 12500, "sgst": 12500},
      {"rate": 12, "taxableAmount": 400000, "cgst": 24000, "sgst": 24000},
      {"rate": 18, "taxableAmount": 371186, "cgst": 33407, "sgst": 33407}
    ],
    "amendments": {
      "additions": 5000,
      "deletions": 0
    }
  }
}
```

---

#### Get GST Returns (GSTR-1)

```http
GET /api/finance/gst/returns/gstr1
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| period | string | Yes | Period (YYYY-MM) |
| type | string | No | b2b/b2c/amendments |

**Response:**
```json
{
  "success": true,
  "data": {
    "gstin": "27AABCU9603R1ZM",
    "period": "2024-01",
    "filingStatus": "pending",
    "b2b": {
      "count": 45,
      "totalValue": 750000,
      "taxAmount": 135000
    },
    "b2c": {
      "count": 1250,
      "totalValue": 750000,
      "taxAmount": 135000
    },
    "amendments": {
      "count": 2,
      "originalValue": 10000,
      "amendedValue": 15000
    },
    "hsnSummary": [
      {"hsn": "9963", "description": "Restaurant Services", "quantity": 1500, "value": 1200000, "rate": 5, "tax": 60000}
    ]
  }
}
```

---

#### File GST Return

```http
POST /api/finance/gst/returns/file
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "returnType": "GSTR1",
  "period": "2024-01",
  "acknowledgmentNumber": "AA1234567890123",
  "filingDate": "2024-02-01",
  "arn": "ARN123456789"
}
```

---

### Tally Export

#### Export to Tally

```http
POST /api/finance/tally/export
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "exportType": "sales|purchases|expenses|all",
  "format": "xml",
  "includeInventory": true,
  "voucherType": "Sales|GST Sales"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "tally_exp_001",
    "status": "completed",
    "fileUrl": "/exports/tally_2024_01.xml",
    "recordCount": 150,
    "generatedAt": "2024-02-01T10:00:00Z",
    "expiresAt": "2024-02-08T10:00:00Z"
  }
}
```

---

#### Get Tally Mappings

```http
GET /api/finance/tally/mappings
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mappings": [
      {
        "category": "sales",
        "ledgerName": "Sales - Mumbai",
        "tallyGroup": "Sales Accounts",
        "gstRate": 18
      },
      {
        "category": "catering",
        "ledgerName": "Catering Income",
        "tallyGroup": "Sales Accounts",
        "gstRate": 5
      }
    ]
  }
}
```

---

#### Update Tally Mapping

```http
PUT /api/finance/tally/mappings
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "mappings": [
    {
      "category": "delivery",
      "ledgerName": "Delivery Charges",
      "tallyGroup": "Sales Accounts",
      "gstRate": 18,
      "taxable": true
    }
  ]
}
```

---

### Expenses

#### Get Expenses

```http
GET /api/finance/expenses
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | - | Expense category |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |
| status | string | - | pending/approved/rejected/paid |
| storeId | string | - | Filter by store |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "expenseId": "exp_001",
        "category": "supplies",
        "description": "Monthly cleaning supplies",
        "amount": 5000,
        "currency": "INR",
        "date": "2024-01-15",
        "vendor": {
          "id": "vendor_001",
          "name": "CleanCo Supplies"
        },
        "receipt": {
          "url": "https://...",
          "verified": true
        },
        "status": "approved",
        "paymentStatus": "paid",
        "storeId": "store_mum_001",
        "submittedBy": {
          "staffId": "staff_001",
          "name": "Priya S."
        },
        "approvedBy": {
          "staffId": "staff_002",
          "name": "Manager Name"
        }
      }
    ],
    "summary": {
      "totalAmount": 125000,
      "pendingAmount": 25000,
      "approvedAmount": 100000
    },
    "pagination": {...}
  }
}
```

---

#### Create Expense

```http
POST /api/finance/expenses
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "category": "supplies",
  "description": "Monthly cleaning supplies",
  "amount": 5000,
  "currency": "INR",
  "date": "2024-01-15",
  "vendorId": "vendor_001",
  "receipt": {
    "url": "https://storage.rez.money/receipts/rec_001.pdf"
  },
  "storeId": "store_mum_001",
  "paymentMethod": "cash",
  "notes": "Monthly recurring expense",
  "metadata": {
    "invoiceNumber": "INV-2024-001",
    "poNumber": "PO-2024-001"
  }
}
```

**Categories:** `supplies`, `utilities`, `rent`, `salaries`, `marketing`, `maintenance`, `travel`, `equipment`, `software`, `other`

---

#### Approve/Reject Expense

```http
POST /api/finance/expenses/:expenseId/approve
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "action": "approve|reject",
  "reason": "Approved for payment",
  "approvedAmount": 5000,
  "paymentDate": "2024-01-20"
}
```

---

### Suppliers

#### Get Suppliers

```http
GET /api/finance/suppliers
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| category | string | Supplier category |
| status | string | active/inactive |
| search | string | Search by name |

**Response:**
```json
{
  "success": true,
  "data": {
    "suppliers": [
      {
        "supplierId": "sup_001",
        "name": "Fresh Farms Produce",
        "contactPerson": "Rajesh Kumar",
        "email": "rajesh@freshfarms.in",
        "phone": "+919876543210",
        "gstin": "27AABCU9603R1ZM",
        "category": "produce",
        "address": {
          "line1": "123 Market Road",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001"
        },
        "paymentTerms": "NET30",
        "outstandingAmount": 25000,
        "status": "active",
        "rating": 4.5,
        "lastOrderDate": "2024-01-10"
      }
    ]
  }
}
```

---

#### Create Supplier

```http
POST /api/finance/suppliers
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Fresh Farms Produce",
  "contactPerson": "Rajesh Kumar",
  "email": "rajesh@freshfarms.in",
  "phone": "+919876543210",
  "gstin": "27AABCU9603R1ZM",
  "category": "produce",
  "address": {
    "line1": "123 Market Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "bankDetails": {
    "accountNumber": "1234567890",
    "bankName": "HDFC Bank",
    "ifsc": "HDFC0001234",
    "accountHolder": "Fresh Farms Pvt Ltd"
  },
  "paymentTerms": "NET30",
  "creditLimit": 100000
}
```

---

### Commission

#### Get Commission Structure

```http
GET /api/finance/commission/structure
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "structures": [
      {
        "structureId": "comm_001",
        "name": "Sales Commission",
        "type": "percentage",
        "appliesTo": "sales_team",
        "tiers": [
          {"minSales": 0, "maxSales": 50000, "rate": 2},
          {"minSales": 50000, "maxSales": 100000, "rate": 3},
          {"minSales": 100000, "maxSales": null, "rate": 5}
        ],
        "conditions": {
          "minOrderValue": 1000,
          "excludeCategories": ["delivery"]
        }
      }
    ]
  }
}
```

---

#### Calculate Commission

```http
POST /api/finance/commission/calculate
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "staffId": "staff_001",
  "period": "2024-01",
  "salesAmount": 85000,
  "orderCount": 45
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "staffId": "staff_001",
    "period": "2024-01",
    "structure": {
      "name": "Sales Commission",
      "type": "percentage"
    },
    "calculation": {
      "tier1": {"sales": 50000, "rate": 2, "commission": 1000},
      "tier2": {"sales": 35000, "rate": 3, "commission": 1050}
    },
    "totalCommission": 2050,
    "incentives": 500,
    "totalEarnings": 2550
  }
}
```

---

### Payouts

#### Get Payout History

```http
GET /api/finance/payouts
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | - | salary/commission/refund |
| status | string | - | pending/processing/completed/failed |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "payouts": [
      {
        "payoutId": "payout_001",
        "type": "salary",
        "amount": 25500,
        "currency": "INR",
        "status": "completed",
        "period": "2024-01",
        "processedAt": "2024-02-05T10:00:00Z",
        "transactionRef": "TXN123456",
        "bankAccount": "****4567"
      }
    ]
  }
}
```

---

#### Initiate Payout

```http
POST /api/finance/payouts/initiate
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "type": "vendor|refund|commission",
  "recipientId": "sup_001",
  "amount": 25000,
  "currency": "INR",
  "paymentMethod": "bank_transfer",
  "scheduledDate": "2024-02-10",
  "reference": "Invoice #INV-2024-001",
  "notes": "Monthly supplies payment"
}
```

---

## Inventory Service

**Base Path**: `/api/inventory`  
**Service**: `rez-inventory-service`  
**Authentication**: JWT Bearer token required

### Stock Tracking

#### Get Stock Levels

```http
GET /api/inventory/stock
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| storeId | string | - | Filter by store |
| warehouseId | string | - | Filter by warehouse |
| category | string | - | Product category |
| status | string | - | in_stock/low_stock/out_of_stock |
| search | string | - | Search by name/SKU |
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "stock": [
      {
        "productId": "prod_001",
        "sku": "SKU-CHicken-Biryani",
        "name": "Chicken Biryani",
        "category": "main_course",
        "locations": [
          {
            "storeId": "store_mum_001",
            "storeName": "ReZ Kitchen - Andheri",
            "quantity": 50,
            "reserved": 5,
            "available": 45,
            "reorderLevel": 20,
            "maxLevel": 100
          }
        ],
        "totalQuantity": 150,
        "totalReserved": 15,
        "totalAvailable": 135,
        "status": "in_stock",
        "lastUpdated": "2024-01-15T10:30:00Z"
      }
    ],
    "summary": {
      "totalProducts": 250,
      "inStock": 200,
      "lowStock": 35,
      "outOfStock": 15
    },
    "pagination": {...}
  }
}
```

---

#### Update Stock

```http
PUT /api/inventory/stock/:productId
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "storeId": "store_mum_001",
  "quantity": 45,
  "reason": "stock_count|delivery|return|adjustment",
  "notes": "Physical count verification",
  "reference": "Count-2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_001",
    "storeId": "store_mum_001",
    "previousQuantity": 50,
    "newQuantity": 45,
    "adjustedBy": 5,
    "reason": "stock_count",
    "newStatus": "in_stock"
  }
}
```

---

#### Stock Transfer

```http
POST /api/inventory/stock/transfer
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "productId": "prod_001",
  "fromLocation": {
    "type": "store|warehouse",
    "id": "store_mum_001"
  },
  "toLocation": {
    "type": "store|warehouse",
    "id": "store_mum_002"
  },
  "quantity": 20,
  "expectedDelivery": "2024-01-17",
  "notes": "Stock rebalancing"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "transfer_001",
    "status": "in_transit",
    "product": {
      "id": "prod_001",
      "name": "Chicken Biryani"
    },
    "quantity": 20,
    "from": {
      "type": "store",
      "id": "store_mum_001",
      "name": "ReZ Kitchen - Andheri"
    },
    "to": {
      "type": "store",
      "id": "store_mum_002",
      "name": "ReZ Kitchen - Bandra"
    },
    "expectedDelivery": "2024-01-17"
  }
}
```

---

#### Get Stock History

```http
GET /api/inventory/stock/:productId/history
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| storeId | string | - | Filter by store |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |
| type | string | - | in/out/transfer/adjustment |

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "entryId": "hist_001",
        "type": "in",
        "reason": "delivery",
        "quantity": 100,
        "balanceBefore": 50,
        "balanceAfter": 150,
        "reference": "PO-2024-001",
        "storeId": "store_mum_001",
        "createdBy": {
          "staffId": "staff_001",
          "name": "Priya S."
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### Smart Inventory

#### Get Smart Reorder Suggestions

```http
GET /api/inventory/smart/reorder
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "productId": "prod_001",
        "productName": "Chicken Biryani",
        "currentStock": 15,
        "reorderLevel": 20,
        "suggestedQuantity": 50,
        "avgDailyUsage": 8,
        "daysUntilStockout": 2,
        "supplier": {
          "id": "sup_001",
          "name": "Fresh Farms"
        },
        "lastOrderCost": 7500,
        "autoReorderEnabled": true
      }
    ],
    "autoOrdersQueued": 5,
    "totalOrderValue": 45000
  }
}
```

---

#### Enable Auto Reorder

```http
POST /api/inventory/smart/auto-reorder
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "productId": "prod_001",
  "storeId": "store_mum_001",
  "enabled": true,
  "reorderLevel": 20,
  "reorderQuantity": 50,
  "preferredSupplier": "sup_001",
  "orderDay": "monday",
  "maxStockLevel": 100
}
```

---

#### Get Demand Forecast

```http
GET /api/inventory/smart/forecast
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string | Yes | Product ID |
| storeId | string | No | Store ID |
| days | number | 30 | Forecast horizon |

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_001",
    "productName": "Chicken Biryani",
    "forecastHorizon": 30,
    "forecast": [
      {"date": "2024-01-20", "predicted": 45, "confidence": 0.92},
      {"date": "2024-01-21", "predicted": 50, "confidence": 0.90}
    ],
    "modelAccuracy": 0.87,
    "factors": {
      "seasonality": "high_weekend",
      "promotion": null,
      "weather": "favorable"
    },
    "recommendedStock": 200,
    "safetyStock": 30
  }
}
```

---

### Expiry Management

#### Get Expiring Stock

```http
GET /api/inventory/expiring
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| daysThreshold | number | 7 | Days until expiry |
| storeId | string | - | Filter by store |
| category | string | - | Product category |

**Response:**
```json
{
  "success": true,
  "data": {
    "expiringItems": [
      {
        "productId": "prod_015",
        "name": "Paneer Tikka",
        "batchId": "batch_001",
        "quantity": 15,
        "expiryDate": "2024-01-18",
        "daysUntilExpiry": 3,
        "status": "expiring_soon",
        "store": {
          "id": "store_mum_001",
          "name": "ReZ Kitchen - Andheri"
        },
        "actions": ["discount", "use_first", "donate"]
      }
    ],
    "summary": {
      "totalExpiring": 45,
      "totalQuantity": 500,
      "estimatedValue": 25000,
      "wasteRisk": "medium"
    }
  }
}
```

---

#### Mark for Discount

```http
POST /api/inventory/expiring/:productId/mark-discount
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "productId": "prod_015",
  "batchId": "batch_001",
  "storeId": "store_mum_001",
  "discountPercent": 30,
  "validUntil": "2024-01-17T23:59:59Z",
  "reason": "near_expiry"
}
```

---

#### Report Waste

```http
POST /api/inventory/waste
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "productId": "prod_015",
  "batchId": "batch_001",
  "storeId": "store_mum_001",
  "quantity": 5,
  "reason": "expired|damaged|contaminated|other",
  "notes": "Power outage caused spoilage",
  "costValue": 750
}
```

---

## Integrations Service

**Base Path**: `/api/integrations`  
**Service**: `rez-integration-service`  
**Authentication**: JWT Bearer token required

### Aggregator Hub

#### Get Connected Aggregators

```http
GET /api/integrations/aggregators
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "aggregators": [
      {
        "aggregatorId": "agg_zomato",
        "name": "Zomato",
        "status": "active",
        "storeMapping": {
          "localStoreId": "store_mum_001",
          "aggregatorStoreId": "ZOM-12345"
        },
        "syncStatus": {
          "menu": "synced",
          "orders": "synced",
          "inventory": "synced"
        },
        "lastSyncAt": "2024-01-15T10:00:00Z",
        "stats": {
          "ordersToday": 45,
          "revenueToday": 22500,
          "avgRating": 4.2
        }
      }
    ]
  }
}
```

---

#### Connect Aggregator

```http
POST /api/integrations/aggregators/connect
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "aggregator": "zomato|swiggy|blinkit|zepto",
  "credentials": {
    "apiKey": "zk_live_xxxxx",
    "storeId": "ZOM-12345"
  },
  "storeId": "store_mum_001",
  "syncSettings": {
    "syncMenu": true,
    "syncOrders": true,
    "syncInventory": true,
    "autoAcceptOrders": true,
    "estimatedPrepTime": 25
  }
}
```

---

#### Sync Aggregator Menu

```http
POST /api/integrations/aggregators/:aggregatorId/sync-menu
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "sync_001",
    "status": "in_progress",
    "itemsSynced": 0,
    "itemsUpdated": 25,
    "itemsFailed": 2,
    "errors": [
      {"itemId": "prod_001", "error": "Image format not supported"}
    ]
  }
}
```

---

#### Get Aggregator Orders

```http
GET /api/integrations/aggregators/orders
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| aggregator | string | - | Filter by aggregator |
| status | string | - | pending/accepted/preparing/ready/completed |
| startDate | ISO8601 | - | Filter start |
| endDate | ISO8601 | - | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "agg_ord_001",
        "aggregatorOrderId": "ZOM-ORD-12345",
        "aggregator": "zomato",
        "status": "preparing",
        "items": [
          {"productName": "Chicken Biryani", "quantity": 2, "price": 250}
        ],
        "totalAmount": 520,
        "platformFee": 52,
        "customer": {
          "name": "John D.",
          "deliveryAddress": "123 Main St, Andheri"
        },
        "createdAt": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

---

### Channel Manager

#### Get Channel Connections

```http
GET /api/integrations/channels
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "channelId": "ch_booking",
        "name": "Booking.com",
        "type": "ota",
        "status": "active",
        "propertyMapping": {
          "localPropertyId": "prop_001",
          "channelPropertyId": "BK-12345"
        },
        "lastSyncAt": "2024-01-15T10:00:00Z",
        "syncSettings": {
          "inventory": true,
          "pricing": true,
          "restrictions": true
        }
      },
      {
        "channelId": "ch_airbnb",
        "name": "Airbnb",
        "type": "ota",
        "status": "active",
        "propertyMapping": {...}
      }
    ]
  }
}
```

---

#### Connect Channel

```http
POST /api/integrations/channels/connect
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "channel": "booking|airbnb|expedia|makeMyTrip",
  "propertyId": "prop_001",
  "credentials": {
    "apiKey": "bk_live_xxxxx",
    "propertyId": "BK-12345"
  },
  "syncSettings": {
    "inventory": true,
    "pricing": true,
    "restrictions": true,
    "bookingRules": {
      "minStay": 1,
      "maxStay": 30,
      "checkInTime": "14:00",
      "checkOutTime": "11:00"
    }
  }
}
```

---

#### Update Channel Inventory

```http
PUT /api/integrations/channels/:channelId/inventory
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "roomTypeId": "room_001",
  "availability": {
    "2024-01-20": {"available": 5, "price": 3500},
    "2024-01-21": {"available": 3, "price": 4000}
  },
  "restrictions": {
    "2024-01-25": {"minStay": 2, "closed": false}
  }
}
```

---

#### Get Channel Bookings

```http
GET /api/integrations/channels/bookings
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| channel | string | Filter by channel |
| status | string | Filter by status |
| startDate | ISO8601 | Filter start |
| endDate | ISO8601 | Filter end |

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "bookingId": "ch_booking_001",
        "channelBookingId": "BK-789012",
        "channel": "booking",
        "status": "confirmed",
        "property": {
          "localId": "prop_001",
          "name": "ReZ Suites - Mumbai"
        },
        "roomType": {
          "localId": "room_001",
          "name": "Deluxe Suite"
        },
        "guest": {
          "name": "Jane Smith",
          "email": "jane@example.com",
          "phone": "+1234567890"
        },
        "dates": {
          "checkIn": "2024-02-01",
          "checkOut": "2024-02-03",
          "nights": 2
        },
        "pricing": {
          "roomRate": 3500,
          "totalRoomCharges": 7000,
          "taxes": 1260,
          "totalAmount": 8260,
          "channelCommission": 826,
          "netPayable": 7434
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### Webhooks

#### Get Webhook Endpoints

```http
GET /api/integrations/webhooks
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "webhookId": "wh_001",
        "name": "Order Updates",
        "url": "https://your-app.com/webhooks/orders",
        "events": ["order.created", "order.updated", "order.cancelled"],
        "status": "active",
        "secret": "whsec_xxxxx",
        "headers": {
          "X-Custom-Header": "custom-value"
        },
        "stats": {
          "delivered": 1500,
          "failed": 5,
          "lastDelivery": "2024-01-15T10:30:00Z"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### Create Webhook

```http
POST /api/integrations/webhooks
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Order Updates",
  "url": "https://your-app.com/webhooks/orders",
  "events": ["order.created", "order.updated", "order.cancelled"],
  "headers": {
    "X-Custom-Header": "custom-value"
  },
  "active": true
}
```

**Available Events:**
| Category | Events |
|----------|--------|
| Orders | `order.created`, `order.updated`, `order.cancelled`, `order.completed` |
| Payments | `payment.success`, `payment.failed`, `payment.refunded` |
| Customers | `customer.created`, `customer.updated` |
| Inventory | `inventory.low`, `inventory.out`, `inventory.updated` |
| Bookings | `booking.created`, `booking.modified`, `booking.cancelled` |

---

#### Update Webhook

```http
PUT /api/integrations/webhooks/:webhookId
Authorization: Bearer <adminToken>
```

---

#### Delete Webhook

```http
DELETE /api/integrations/webhooks/:webhookId
Authorization: Bearer <adminToken>
```

---

#### Test Webhook

```http
POST /api/integrations/webhooks/:webhookId/test
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "delivered": true,
    "statusCode": 200,
    "responseTime": 245,
    "payload": {...}
  }
}
```

---

#### Get Webhook Deliveries

```http
GET /api/integrations/webhooks/:webhookId/deliveries
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | - | delivered/failed/pending |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "deliveries": [
      {
        "deliveryId": "del_001",
        "event": "order.created",
        "payload": {...},
        "status": "delivered",
        "attempts": 1,
        "statusCode": 200,
        "responseTime": 245,
        "deliveredAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

## AI/Intelligence Service

**Base Path**: `/api/ai`  
**Service**: `rez-intelligence-service`  
**Authentication**: JWT Bearer token required

### Churn Prediction

#### Get Churn Risk Assessment

```http
GET /api/ai/churn/assessment
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| storeId | string | - | Filter by store |
| period | string | 30 | Days to analyze |

**Response:**
```json
{
  "success": true,
  "data": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "period": "30",
    "overview": {
      "totalCustomers": 5000,
      "atRisk": 450,
      "highRisk": 120,
      "mediumRisk": 200,
      "lowRisk": 130,
      "churnProbability": 9.0
    },
    "riskDistribution": [
      {"risk": "high", "count": 120, "percentage": 24},
      {"risk": "medium", "count": 200, "percentage": 40},
      {"risk": "low", "count": 130, "percentage": 36}
    ],
    "modelAccuracy": 0.87,
    "lastTrained": "2024-01-14T00:00:00Z"
  }
}
```

---

#### Get At-Risk Customers

```http
GET /api/ai/churn/at-risk
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| storeId | string | - | Filter by store |
| riskLevel | string | - | high/medium/low |
| limit | number | 50 | Number of results |

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "userId": "user_001",
        "name": "John D.",
        "phone": "+919876543210",
        "riskLevel": "high",
        "churnProbability": 0.85,
        "lastOrderDate": "2024-12-01",
        "daysSinceLastOrder": 45,
        "avgOrderFrequency": 7,
        "riskFactors": [
          {"factor": "declining_engagement", "impact": "high"},
          {"factor": "negative_sentiment", "impact": "medium"},
          {"factor": "price_sensitivity", "impact": "low"}
        ],
        "recommendedActions": [
          "send_personalized_offer",
          "request_feedback",
          "highlight_new_items"
        ]
      }
    ]
  }
}
```

---

#### Trigger Churn Prevention Campaign

```http
POST /api/ai/churn/campaign
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "segment": "high_risk",
  "excludeAlreadyTargeted": true,
  "content": {
    "channel": "push|email|sms",
    "offer": {
      "type": "discount",
      "value": 15,
      "minOrderValue": 300
    },
    "personalize": true
  },
  "maxRecipients": 100
}
```

---

### Demand Forecast

#### Get Demand Forecast

```http
GET /api/ai/forecast/demand
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| storeId | string | Yes | Store ID |
| productId | string | No | Specific product |
| category | string | No | Product category |
| horizon | number | 7 | Days to forecast |
| granularity | string | daily | daily/hourly |

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "store_mum_001",
    "generatedAt": "2024-01-15T10:30:00Z",
    "forecast": [
      {
        "date": "2024-01-16",
        "predictedDemand": 150,
        "confidence": 0.92,
        "lowerBound": 135,
        "upperBound": 165,
        "weekday": "Tuesday",
        "factors": {
          "historical": 145,
          "trend": 5,
          "seasonality": 0,
          "promotion": 0
        }
      },
      {
        "date": "2024-01-17",
        "predictedDemand": 180,
        "confidence": 0.89,
        "lowerBound": 160,
        "upperBound": 200,
        "weekday": "Wednesday"
      }
    ],
    "summary": {
      "totalPredicted": 1150,
      "avgDaily": 164,
      "peakDay": "2024-01-20",
      "peakValue": 220,
      "modelAccuracy": 0.91
    },
    "anomalies": [
      {
        "date": "2024-01-20",
        "reason": "Expected weekend surge",
        "adjusted": true
      }
    ]
  }
}
```

---

#### Get Inventory Forecast

```http
GET /api/ai/forecast/inventory
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| storeId | string | Yes | Store ID |
| horizon | number | 7 | Days to forecast |

**Response:**
```json
{
  "success": true,
  "data": {
    "storeId": "store_mum_001",
    "forecastDate": "2024-01-15",
    "recommendations": [
      {
        "productId": "prod_001",
        "productName": "Chicken Biryani",
        "currentStock": 50,
        "predictedDemand": 180,
        "recommendedStock": 220,
        "shortageRisk": "high",
        "suggestedOrder": 170,
        "orderUrgency": "immediate",
        "supplierLeadTime": 2
      },
      {
        "productId": "prod_002",
        "productName": "Paneer Butter Masala",
        "currentStock": 80,
        "predictedDemand": 60,
        "recommendedStock": 85,
        "shortageRisk": "low",
        "suggestedOrder": 5
      }
    ],
    "totalInvestment": 85000,
    "wasteRiskReduction": 15
  }
}
```

---

### Dynamic Pricing

#### Get Dynamic Price

```http
GET /api/ai/pricing/dynamic
Authorization: Bearer <token>
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string | Yes | Product ID |
| storeId | string | Yes | Store ID |
| quantity | number | 1 | Order quantity |

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_001",
    "storeId": "store_mum_001",
    "basePrice": 250,
    "currentPrice": 237,
    "adjustments": [
      {"factor": "demand", "adjustment": -5, "reason": "Low demand period"},
      {"factor": "time_of_day", "adjustment": -3, "reason": "Off-peak hours"},
      {"factor": "competition", "adjustment": -5, "reason": "Price match"}
    ],
    "minPrice": 200,
    "maxPrice": 300,
    "priceFloor": 200,
    "priceCeiling": 300,
    "validUntil": "2024-01-15T15:00:00Z",
    "confidence": 0.85
  }
}
```

---

#### Set Price Override

```http
POST /api/ai/pricing/override
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "productId": "prod_001",
  "storeId": "store_mum_001",
  "price": 225,
  "reason": "promotion|competitor|seasonal",
  "startDate": "2024-01-15",
  "endDate": "2024-01-20",
  "notes": "Weekend special promotion"
}
```

---

#### Get Pricing Rules

```http
GET /api/ai/pricing/rules
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "ruleId": "rule_001",
        "name": "Happy Hour Discount",
        "type": "time_based",
        "conditions": {
          "timeRange": {"start": "14:00", "end": "17:00"},
          "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        "action": {
          "type": "percentage_discount",
          "value": 15
        },
        "products": {"type": "all"},
        "minMargin": 10,
        "status": "active"
      },
      {
        "ruleId": "rule_002",
        "name": "High Demand Surge",
        "type": "demand_based",
        "conditions": {
          "demandThreshold": 1.3,
          "stockThreshold": 0.8
        },
        "action": {
          "type": "percentage_increase",
          "value": 10,
          "maxIncrease": 20
        },
        "minMargin": 20,
        "status": "active"
      }
    ]
  }
}
```

---

#### Create Pricing Rule

```http
POST /api/ai/pricing/rules
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "name": "Early Bird Special",
  "type": "time_based|demand_based|segment_based|inventory_based",
  "priority": 1,
  "conditions": {
    "timeRange": {"start": "06:00", "end": "09:00"},
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  },
  "action": {
    "type": "percentage_discount",
    "value": 20,
    "maxDiscount": 50
  },
  "products": {
    "type": "specific|category|all",
    "productIds": [],
    "categoryIds": []
  },
  "constraints": {
    "minOrderValue": 200,
    "minMargin": 10,
    "maxPriceReduction": 30
  },
  "active": true
}
```

---

#### Get Price Analytics

```http
GET /api/ai/pricing/analytics
Authorization: Bearer <adminToken>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| storeId | string | - | Store ID |
| startDate | ISO8601 | 7 days ago | Start date |
| endDate | ISO8601 | now | End date |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-01-08 to 2024-01-15",
    "pricingStats": {
      "totalAdjustments": 1250,
      "discounts": 800,
      "increases": 450,
      "avgDiscountPercent": 12.5,
      "avgIncreasePercent": 8.2
    },
    "revenueImpact": {
      "additionalRevenue": 25000,
      "revenueProtected": 15000,
      "marginProtected": 8.5
    },
    "conversionImpact": {
      "baselineConversion": 3.2,
      "dynamicPricingConversion": 4.1,
      "lift": 28.1
    },
    "topAdjustments": [
      {"factor": "time_of_day", "count": 450, "avgAdjustment": -8.5},
      {"factor": "demand", "count": 320, "avgAdjustment": 12.3}
    ]
  }
}
```

---

*Document Version: 80.0*  
*Last Updated: May 10, 2026*  
*Generated by: Claude Code (CTO)*  
*Coverage: ~85% (585/700 endpoints)*

| Code | HTTP | Description |
|------|------|-------------|
| AUTH_TOKEN_EXPIRED | 401 | JWT token has expired |
| AUTH_TOKEN_INVALID | 401 | JWT token is malformed |
| AUTH_UNAUTHORIZED | 403 | Not authorized for this resource |
| AUTH_MERCHANT_NOT_FOUND | 404 | Merchant account not found |

### Validation Errors

| Code | HTTP | Description |
|------|------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| VALIDATION_REQUIRED_FIELD | 400 | Required field is missing |

### Resource Errors

| Code | HTTP | Description |
|------|------|-------------|
| RESOURCE_NOT_FOUND | 404 | Requested resource not found |
| RESOURCE_ALREADY_EXISTS | 409 | Resource already exists |

### GDPR Errors

| Code | HTTP | Description |
|------|------|-------------|
| GDPR_DELETION_ALREADY_PENDING | 400 | Account deletion already scheduled |
| GDPR_CANNOT_CANCEL_PROCESSING | 400 | Cannot cancel deletion in processing state |
| GDPR_INVALID_REGION | 400 | Invalid data residency region |
| GDPR_CONSENT_INVALID_CATEGORY | 400 | Invalid consent category |

### Financial Errors

| Code | HTTP | Description |
|------|------|-------------|
| WITHDRAWAL_INSUFFICIENT_BALANCE | 400 | Not enough wallet balance |
| WITHDRAWAL_EXCEEDS_SETTLEMENT | 400 | Exceeds settled amount |
| WITHDRAWAL_ALREADY_PENDING | 400 | Withdrawal already in progress |
| WITHDRAWAL_LIMIT_EXCEEDED | 400 | Amount exceeds maximum |

### Rate Limiting

| Code | HTTP | Description |
|------|------|-------------|
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| OTP_RATE_LIMITED | 429 | Too many OTP requests |

---

*Document Version: 66.0*  
*Last Updated: May 10, 2026*  
*Generated by: Claude Code (CTO)*
