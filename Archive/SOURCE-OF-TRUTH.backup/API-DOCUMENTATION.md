# REZ Platform - API Documentation

OpenAPI/Swagger specifications for all public APIs.

---

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.rez.money` |
| Staging | `https://api-staging.rez.money` |

---

## Authentication

### Bearer Token

All API requests require authentication via Bearer token:

```
Authorization: Bearer <token>
```

### API Keys

For server-to-server communication:

```
X-API-Key: <api_key>
```

---

## REZ Auth Service

### Base URL
```
https://rez-auth-service.onrender.com
```

### Endpoints

#### POST /auth/send-otp
Send OTP to phone number.

**Request:**
```json
{
  "phone": "+919876543210",
  "purpose": "login"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent",
  "expiresIn": 300
}
```

#### POST /auth/verify-otp
Verify OTP and get JWT token.

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": 3600
}
```

#### GET /auth/profile
Get authenticated user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user_123",
  "phone": "+919876543210",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## OAuth2 Partner API

### Base URL
```
https://rez-auth-service.onrender.com
```

### Endpoints

#### GET /oauth/authorize
Initiate OAuth authorization flow.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| client_id | string | Yes | Partner client ID |
| redirect_uri | string | Yes | Callback URL |
| response_type | string | Yes | Must be "code" |
| scope | string | No | Space-separated scopes |
| state | string | Yes | CSRF protection token |

**Response:** Redirects to redirect_uri with code parameter.

#### POST /oauth/token
Exchange authorization code for access token.

**Request:**
```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "redirect_uri": "https://partner-app.com/callback",
  "client_id": "partner-app",
  "client_secret": "client_secret"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token",
  "scope": "profile wallet:read"
}
```

#### GET /oauth/userinfo
Get authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "sub": "user_123",
  "phone": "+919876543210",
  "name": "John Doe",
  "email": "john@example.com",
  "scope": "profile wallet:read"
}
```

#### POST /oauth/refresh
Refresh access token.

**Request:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh_token",
  "client_id": "partner-app",
  "client_secret": "client_secret"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new_refresh_token"
}
```

---

## Wallet API

### Base URL
```
https://rez-wallet-service-36vo.onrender.com
```

### Endpoints

#### GET /api/wallet/balance
Get wallet balance.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "balance": 1500.00,
  "currency": "INR",
  "coins": 15000
}
```

#### POST /api/wallet/hold
Hold funds for transaction.

**Request:**
```json
{
  "amount": 100.00,
  "transactionId": "txn_123",
  "merchantId": "merchant_456",
  "description": "Purchase at Store"
}
```

**Response:**
```json
{
  "success": true,
  "holdId": "hold_789",
  "heldAmount": 100.00,
  "expiresAt": "2026-04-27T12:00:00Z"
}
```

#### POST /api/wallet/release
Release held funds.

**Request:**
```json
{
  "holdId": "hold_789"
}
```

**Response:**
```json
{
  "success": true,
  "releasedAmount": 100.00
}
```

#### POST /api/wallet/transfer
Transfer funds to another user.

**Request:**
```json
{
  "toUserId": "user_456",
  "amount": 50.00,
  "description": "Gift"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "txn_789",
  "newBalance": 1450.00
}
```

---

## Hotel OTA API

### Base URL
```
https://hotel-ota-api.onrender.com
```

### Endpoints

#### GET /v1/hotels
Search hotels.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| city | string | City name |
| checkin | date | Check-in date |
| checkout | date | Check-out date |
| guests | number | Number of guests |
| rooms | number | Number of rooms |

**Response:**
```json
{
  "success": true,
  "hotels": [
    {
      "id": "hotel_123",
      "name": "Grand Hotel",
      "city": "Delhi",
      "rating": 4.5,
      "pricePerNight": 2500,
      "amenities": ["wifi", "pool", "gym"]
    }
  ]
}
```

#### GET /v1/bookings/:id
Get booking details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "booking_123",
    "status": "confirmed",
    "checkinDate": "2026-05-01",
    "checkoutDate": "2026-05-03",
    "totalAmount": 5000,
    "paidAmount": 5000,
    "hotel": {
      "id": "hotel_123",
      "name": "Grand Hotel"
    },
    "rooms": [
      {
        "roomType": "Deluxe",
        "quantity": 1,
        "pricePerNight": 2500
      }
    ]
  }
}
```

### Booking Sync Webhooks

#### POST /booking-sync/webhook/status
Receive booking status updates.

**Request:**
```json
{
  "bookingId": "uuid-of-booking",
  "status": "checked_in",
  "reason": "Guest arrived",
  "timestamp": "2026-05-01T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "bookingId": "uuid-of-booking",
  "status": "checked_in",
  "updatedAt": "2026-05-01T14:00:00Z"
}
```

---

## NextaBiZ API

### Base URL
```
https://nextabizz-api.vercel.app
```

### Endpoints

#### POST /api/inventory/signal
Create inventory signal.

**Request:**
```json
{
  "merchantId": "merchant_123",
  "productName": "Item Name",
  "currentStock": 5,
  "threshold": 20,
  "severity": "high",
  "signalType": "low_stock"
}
```

**Response:**
```json
{
  "success": true,
  "signalId": "signal_123"
}
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "phone",
        "message": "Invalid phone format"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong"
  }
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/send-otp | 5 | per hour |
| /auth/verify-otp | 10 | per hour |
| /auth/* (other) | 100 | per minute |
| /api/wallet/* | 50 | per minute |
| /v1/hotels/* | 30 | per minute |
| /v1/bookings/* | 30 | per minute |

---

## Postman Collection

Import this into Postman for testing:

```json
{
  "info": {
    "name": "REZ Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://rez-auth-service.onrender.com"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Send OTP",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/auth/send-otp",
            "body": {
              "mode": "raw",
              "raw": "{\"phone\": \"+919876543210\", \"purpose\": \"login\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## SDKs

| Language | Package | Repository |
|----------|---------|------------|
| JavaScript | `@rez/sdk` | github.com/rez-platform/rez-sdk |
| Python | `rez-sdk` | github.com/rez-platform/rez-sdk-python |
| Go | `rez-go` | github.com/rez-platform/rez-sdk-go |

---

## Support

- Documentation: https://docs.rez.money
- API Status: https://status.rez.money
- Support Email: api-support@rez.money
