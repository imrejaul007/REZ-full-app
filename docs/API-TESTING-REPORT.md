# ReZ Core APIs Testing Report

**Date:** 2026-04-29
**Services Tested:**
1. rez-auth-service - `/api/auth/login`
2. rez-payment-service - `/api/pay/initiate`
3. rez-merchant-service - `/api/orders`
4. rez-wallet-service - `/api/wallet/balance`

---

## Table of Contents

1. [rez-auth-service /api/auth/login](#1-rez-auth-service)
2. [rez-payment-service /api/pay/initiate](#2-rez-payment-service)
3. [rez-merchant-service /api/orders](#3-rez-merchant-service)
4. [rez-wallet-service /api/wallet/balance](#4-rez-wallet-service)

---

## 1. rez-auth-service

**Endpoint:** `POST /send-otp` (OTP-based login flow)
**Route File:** `rez-auth-service/src/routes/authRoutes.ts`

### 1.1 Expected Request/Response

#### Send OTP Request
```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "channel": "sms" | "whatsapp",
  "force": false
}
```

#### Send OTP Response (Success)
```json
{
  "success": true,
  "messageId": "string",
  "expiresAt": "ISO8601 timestamp",
  "isNewUser": true | false,
  "hasPIN": true | false
}
```

#### Verify OTP Request
```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "otp": "123456"
}
```

#### Verify OTP Response (Success)
```json
{
  "success": true,
  "isNewUser": true | false,
  "accessToken": "jwt_token",
  "refreshToken": "jwt_token",
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_token",
    "expiresIn": 900
  },
  "user": {
    "id": "string",
    "name": "string",
    "phone": "+919876543210",
    "role": "user",
    "isVerified": true,
    "isOnboarded": false
  },
  "deviceRisk": "trusted" | "new" | "suspicious",
  "mfaRequired": true | false,
  "mfaSessionToken": "string" // if MFA required
}
```

#### PIN Login Request
```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "pin": "1234"
}
```

### 1.2 Missing Validation

| Issue | Severity | Location |
|-------|----------|----------|
| No CAPTCHA/reCAPTCHA integration for OTP requests | Medium | `/send-otp` |
| No phone number format validation beyond regex (E.164 not enforced) | Low | `parsePhone()` |
| No device fingerprint validation beyond hash comparison | Medium | `verifyOTPHandler` |
| MFA backup codes stored in plaintext in MongoDB | High | `adminMfaVerifyHandler` |

### 1.3 Security Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **OTP Pumping** | High | 3 OTP requests per minute per phone - no daily cap. Attacker can exhaust victim's SMS quota. |
| **Timing Attack on has-pin** | Fixed | Previously leaked account existence - now returns identical response (BAK-AUTH-001). |
| **JWT Algorithm Confusion** | Fixed | `algorithms: ['HS256']` enforced in `requireAuth` middleware. |
| **Token Blacklist Fail-Open** | Fixed | Redis failure now returns 503 in production (PAY-011 fix). |
| **Common PIN Rejection** | Implemented | `COMMON_PINS` array blocks weak PINs (0000, 1234, etc.). |
| **Account Lockout** | Implemented | 5 failed PIN attempts = 15-minute lockout. |
| **bcrypt Cost Factor** | 12 | Standard cost, consider increasing to 14 for admin passwords. |

### 1.4 Test Cases

| ID | Category | Test Case | Expected Result |
|----|----------|-----------|----------------|
| AUTH-TC-001 | Happy Path | Valid phone + OTP verification | Access token returned |
| AUTH-TC-002 | Happy Path | PIN login for returning user | Access token returned |
| AUTH-TC-003 | Validation | Invalid phone format (letters) | 400 Bad Request |
| AUTH-TC-004 | Validation | Invalid phone format (too short) | 400 Bad Request |
| AUTH-TC-005 | Rate Limit | 4+ OTP requests per minute per phone | 429 Too Many Requests |
| AUTH-TC-006 | Rate Limit | 101 login requests per minute per IP | 429 Too Many Requests |
| AUTH-TC-007 | Security | Invalid OTP (wrong digits) | 401 Invalid OTP |
| AUTH-TC-008 | Security | Expired OTP | 401 OTP expired |
| AUTH-TC-009 | Security | 5 wrong PIN attempts | 429 Account locked |
| AUTH-TC-010 | Security | Common PIN (123456) rejected | 400 PIN too common |
| AUTH-TC-011 | Security | Token after logout | 401 Token revoked |
| AUTH-TC-012 | MFA | TOTP verification success | MFA token returned |
| AUTH-TC-013 | MFA | Invalid TOTP code | 401 Invalid code |
| AUTH-TC-014 | MFA | Expired MFA session token (>5min) | 401 Session expired |
| AUTH-TC-015 | Account | Deactivated account login | 403 Account deactivated |
| AUTH-TC-016 | Token | Refresh token rotation | New tokens returned, old blacklisted |
| AUTH-TC-017 | Token | Concurrent token refresh | 409 Conflict |

---

## 2. rez-payment-service

**Endpoint:** `POST /api/payment/initiate` and `POST /pay/initiate`
**Route File:** `rez-payment-service/src/routes/paymentRoutes.ts`

### 2.1 Expected Request/Response

#### Initiate Payment Request
```json
{
  "orderId": "string (MongoDB _id or orderNumber)",
  "amount": 1000.00,
  "paymentMethod": "upi" | "card" | "wallet" | "netbanking",
  "purpose": "order_payment" | "wallet_topup" | "event_booking" | "financial_service" | "other",
  "orchestratorIdempotencyKey": "uuid-v4",
  "idempotencyKey": "uuid-v4",
  "userDetails": { "key": "value" },
  "metadata": { "key": "value" }
}
```

#### Initiate Payment Response
```json
{
  "success": true,
  "data": {
    "paymentId": "string",
    "razorpayOrderId": "order_xxx",
    "razorpayKeyId": "rzp_xxx",
    "amount": 1000.00,
    "currency": "INR",
    "status": "pending",
    "checkoutUrl": "https://api.razorpay.com/...",
    "expiresAt": "ISO8601"
  }
}
```

#### Capture Payment Request
```json
{
  "paymentId": "string",
  "razorpayPaymentId": "pay_xxx",
  "razorpayOrderId": "order_xxx",
  "razorpaySignature": "hmac_sha256_signature"
}
```

### 2.2 Missing Validation

| Issue | Severity | Location |
|-------|----------|----------|
| `orderId` not validated against actual order existence | High | `initiateHandler` |
| `amount` precision not validated (floating point issues) | Medium | `initiateSchema` |
| No merchant verification that caller owns the order | High | `initiateHandler` |
| `purpose` enum mismatch between Zod and model | Fixed | Already aligned in code |
| No check for duplicate orders already paid | Medium | `initiateHandler` |

### 2.3 Security Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Replay Attack Prevention** | Implemented | Redis-based `razorpayPaymentId` deduplication with 25-hour TTL. |
| **Idempotency Key** | Implemented | Server-side generation if not provided. |
| **Amount Cap** | 500,000 | `.max(500000)` enforced in Zod schema. |
| **Webhook Signature Verification** | Implemented | HMAC-SHA256 verification on Razorpay webhooks. |
| **Webhook Event Deduplication** | Implemented | 24-hour Redis TTL for event IDs. |
| **Redis Fail-Closed** | Fixed | Webhook returns 503 if Redis unavailable (WH-01). |
| **IDOR on Settlements** | Fixed | `merchantId` from query validated against JWT (BE-PAY-017). |
| **Rate Limiting** | Implemented | `paymentLimiter` and `sensitiveLimiter` applied. |

### 2.4 Test Cases

| ID | Category | Test Case | Expected Result |
|----|----------|-----------|----------------|
| PAY-TC-001 | Happy Path | Valid payment initiation | 200 + razorpayOrderId |
| PAY-TC-002 | Validation | Amount = 0 | 400 Bad Request |
| PAY-TC-003 | Validation | Amount > 500000 | 400 Bad Request |
| PAY-TC-004 | Validation | Negative amount | 400 Bad Request |
| PAY-TC-005 | Validation | Invalid paymentMethod enum | 400 Bad Request |
| PAY-TC-006 | Validation | Missing orderId | 400 Bad Request |
| PAY-TC-007 | Security | Missing auth token | 401 Unauthorized |
| PAY-TC-008 | Security | Expired auth token | 401 Token expired |
| PAY-TC-009 | Rate Limit | 101 payment requests/min | 429 Too Many Requests |
| PAY-TC-010 | Idempotency | Same idempotencyKey twice | Same paymentId returned |
| PAY-TC-011 | Capture | Valid signature | 200 + captured status |
| PAY-TC-012 | Capture | Invalid signature | 400 Signature verification failed |
| PAY-TC-013 | Capture | Replay same razorpayPaymentId | 409 Already captured |
| PAY-TC-014 | Refund | Merchant refund own payment | 200 + refund initiated |
| PAY-TC-015 | Refund | Merchant refund other merchant | 403 Not allowed |
| PAY-TC-016 | Webhook | Valid Razorpay signature | 200 Processed |
| PAY-TC-017 | Webhook | Invalid signature | 400 Invalid signature |
| PAY-TC-018 | Webhook | Duplicate event ID | 200 (ignored as duplicate) |
| PAY-TC-019 | State | Payment failed -> completed transition | 400 Invalid transition |
| PAY-TC-020 | Concurrency | Concurrent captures same payment | Only one succeeds |

---

## 3. rez-merchant-service

**Endpoint:** `GET /orders` and `POST /orders`
**Route File:** `rez-merchant-service/src/routes/orders/list.ts`

### 3.1 Expected Request/Response

#### List Orders Request
```
GET /orders?storeId=xxx&page=1&limit=20&status=pending&dateFrom=2024-01-01&dateTo=2024-12-31
Authorization: Bearer <merchant_token>
```

#### List Orders Response
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "string",
        "orderNumber": "string",
        "status": "pending" | "confirmed" | "preparing" | "ready" | "dispatched" | "delivered" | "cancelled",
        "totals": {
          "subtotal": 100.00,
          "tax": 10.00,
          "total": 110.00,
          "merchantPayout": 90.00
        },
        "payment": {
          "status": "paid" | "pending" | "failed"
        },
        "items": [...],
        "customer": {...},
        "store": {
          "name": "string",
          "logo": "url"
        },
        "createdAt": "ISO8601",
        "updatedAt": "ISO8601"
      }
    ],
    "total": 100,
    "totalCount": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasMore": true
  }
}
```

#### Order Analytics Response
```json
{
  "success": true,
  "data": {
    "totalOrders": 100,
    "totalRevenue": 10000.00,
    "averageOrderValue": 100.00,
    "statusBreakdown": {
      "pending": 10,
      "confirmed": 20,
      "preparing": 15,
      "ready": 5,
      "delivered": 45,
      "cancelled": 5
    },
    "revenueGrowth": 5.2,
    "orderGrowth": 3.1,
    "topProducts": [...]
  }
}
```

### 3.2 Missing Validation

| Issue | Severity | Location |
|-------|----------|----------|
| `storeId` not verified against merchant ownership | High | `GET /orders` |
| No date range validation (can query entire history) | Medium | `GET /orders/analytics` |
| No maximum limit cap on query results | Medium | `GET /orders` |
| `status` filter not validated against enum | Low | `GET /orders` |
| No pagination boundary validation (negative page) | Low | `GET /orders` |

### 3.3 Security Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Merchant Auth** | Implemented | `merchantAuth` middleware required. |
| **Suspension Check** | Implemented | Redis check for `merchant:suspended:{id}` |
| **CORS Configuration** | Fixed | No wildcard origins allowed. |
| **Ownership Validation** | Partial | Store ownership validated via `getMerchantStoreIds()` |
| **Token Blacklist** | Implemented | `requireAuth` checks Redis blacklist. |
| **CSRF Protection** | Implemented | `csrf.ts` middleware present. |
| **Ownership Guard** | Implemented | `ownershipGuard.ts` middleware present. |

### 3.4 Test Cases

| ID | Category | Test Case | Expected Result |
|----|----------|-----------|----------------|
| MER-TC-001 | Happy Path | List orders with valid token | 200 + orders array |
| MER-TC-002 | Happy Path | List orders with pagination | 200 + paginated results |
| MER-TC-003 | Happy Path | Filter by storeId | 200 + filtered orders |
| MER-TC-004 | Happy Path | Filter by status | 200 + filtered orders |
| MER-TC-005 | Happy Path | Date range filter | 200 + filtered orders |
| MER-TC-006 | Validation | Invalid storeId format | 400 Invalid storeId |
| MER-TC-007 | Validation | Invalid dateFrom format | 400 Bad Request |
| MER-TC-008 | Validation | page = 0 | Default to page 1 |
| MER-TC-009 | Validation | limit = 1000 | Cap to 100 |
| MER-TC-010 | Security | Missing auth token | 401 Unauthorized |
| MER-TC-011 | Security | Invalid merchant token | 401 Invalid token |
| MER-TC-012 | Security | Suspended merchant | 403 Account suspended |
| MER-TC-013 | Security | Access orders from another merchant | 200 (empty or own orders only) |
| MER-TC-014 | Analytics | Get order analytics | 200 + aggregated data |
| MER-TC-015 | Analytics | Get stats summary | 200 + cached summary |
| MER-TC-016 | Performance | Large date range query | 200 (should use indexes) |

---

## 4. rez-wallet-service

**Endpoint:** `GET /api/wallet/balance`
**Route File:** `rez-wallet-service/src/routes/walletRoutes.ts`

### 4.1 Expected Request/Response

#### Get Balance Request
```
GET /api/wallet/balance
Authorization: Bearer <user_token>
```

#### Get Balance Response
```json
{
  "success": true,
  "data": {
    "balance": {
      "available": 1000,
      "locked": 100,
      "coinType": "rez"
    },
    "totalBalance": 1100,
    "coinType": "rez",
    "coinToRupeeRate": 0.01
  }
}
```

#### Credit Wallet Request (Admin Only)
```json
{
  "amount": 100,
  "coinType": "rez" | "prive" | "branded" | "promo" | "cashback" | "referral",
  "source": "admin_credit",
  "description": "Manual credit for promotion",
  "targetUserId": "user_id (optional)",
  "idempotencyKey": "uuid"
}
```

#### Debit Wallet Request
```json
{
  "amount": 50,
  "coinType": "rez",
  "source": "order_payment",
  "description": "Payment for order #123",
  "sourceId": "order_id",
  "idempotencyKey": "uuid"
}
```

### 4.2 Missing Validation

| Issue | Severity | Location |
|-------|----------|----------|
| `targetUserId` not validated against existence | Medium | `creditHandler` |
| `coinType` not validated for user-specific types | Medium | `creditHandler` |
| No maximum transaction amount validation | Medium | Both credit/debit |
| `sourceId` not validated against actual transaction | Medium | `debitHandler` |

### 4.3 Security Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Token Type Restriction** | Implemented | Only `user`/`consumer` roles allowed, merchant/admin rejected. |
| **Admin Role Check** | Implemented | Only `admin`/`super_admin`/`operator` can credit wallets. |
| **Rate Limiting** | Implemented | 10 debits/min, 20 credits/min per user. |
| **Redis Fail-Closed** | Implemented | Rate limiter returns false if Redis unavailable. |
| **Insufficient Balance** | Implemented | Returns 400 with `BIZ_INSUFFICIENT_BALANCE`. |
| **Idempotency** | Implemented | MongoDB unique index on `idempotencyKey`. |
| **XFF Spoofing Detection** | Implemented | Rejects loopback/private outermost IPs. |
| **Welcome Coins Race Condition** | Fixed | TOCTOU removed, idempotency key in transaction. |
| **Coin Credit Cap** | 10,000 | Per-transaction limit enforced. |

### 4.4 Test Cases

| ID | Category | Test Case | Expected Result |
|----|----------|-----------|----------------|
| WAL-TC-001 | Happy Path | Get balance for existing user | 200 + balance data |
| WAL-TC-002 | Happy Path | Get balance for new user | 200 + zero balance |
| WAL-TC-003 | Happy Path | Get transactions paginated | 200 + transactions array |
| WAL-TC-004 | Happy Path | Get transaction summary | 200 + aggregated data |
| WAL-TC-005 | Happy Path | Debit with sufficient balance | 200 + new balance |
| WAL-TC-006 | Validation | Debit with insufficient balance | 400 BIZ_INSUFFICIENT_BALANCE |
| WAL-TC-007 | Validation | Amount = 0 | 400 Bad Request |
| WAL-TC-008 | Validation | Amount > 1,000,000 | 400 Bad Request |
| WAL-TC-009 | Validation | Invalid coinType | 400 Bad Request |
| WAL-TC-010 | Validation | Missing required fields | 400 Bad Request |
| WAL-TC-011 | Security | Missing auth token | 401 Unauthorized |
| WAL-TC-012 | Security | Merchant token on user wallet | 403 Wrong token type |
| WAL-TC-013 | Security | Credit without admin role | 403 Admin required |
| WAL-TC-014 | Security | Credit to arbitrary user (non-admin) | 403 Forbidden |
| WAL-TC-015 | Rate Limit | 11+ debit requests/min | 429 Too Many Requests |
| WAL-TC-016 | Rate Limit | 21+ credit requests/min (admin) | 429 Too Many Requests |
| WAL-TC-017 | Idempotency | Same debit idempotencyKey twice | Same transaction ID |
| WAL-TC-018 | Welcome | First welcome coins claim | 200 + 50 coins credited |
| WAL-TC-019 | Welcome | 4th welcome coins claim in 1 day | 429 Daily limit exceeded |
| WAL-TC-020 | Conversion | Get conversion rate | 200 + current rate |
| WAL-TC-021 | Concurrency | Concurrent debits same amount | Only one succeeds |

---

## Cross-Cutting Concerns

### Rate Limiting Summary

| Service | Endpoint | Limit | Window |
|---------|----------|-------|--------|
| Auth | `/send-otp` (phone) | 3 | 1 min |
| Auth | `/verify-otp` (phone) | 5 | 1 min |
| Auth | `/auth/*` (IP) | 100 | 1 min |
| Auth | Admin login | 3 | 5 min |
| Payment | `/pay/initiate` | Varies | 1 min |
| Wallet | Debit operations | 10 | 1 min |
| Wallet | Credit operations | 20 | 1 min |
| Wallet | Welcome coins | 3 | 24 hours |

### Error Response Format

All services follow consistent error format:
```json
{
  "success": false,
  "message": "Human readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Authentication Methods

| Service | Auth Method | Token Location | Blacklist Check |
|---------|-------------|---------------|-----------------|
| Auth | JWT (HS256) | Authorization header | N/A |
| Payment | JWT (HS256) | Authorization header | Redis |
| Merchant | JWT (merchant secret) | Authorization header | Redis |
| Wallet | JWT (HS256) | Authorization header | Redis |

---

## Security Recommendations

### High Priority

1. **Add CAPTCHA to OTP endpoints** - Prevent automated OTP pumping attacks
2. **Implement IP-based phone binding** - Detect suspicious OTP request patterns from same IP targeting different phones
3. **Add transaction limits** - Daily/monthly transaction caps per user
4. **Implement request signing** - For high-value payment operations

### Medium Priority

1. **Increase bcrypt cost factor** - For admin password hashing (12 -> 14)
2. **Add MFA for high-value transactions** - Threshold-based TOTP requirement
3. **Implement API key rotation** - For Razorpay and internal service tokens
4. **Add request size limits** - Prevent payload DoS attacks

### Low Priority

1. **Add OpenAPI documentation** - All services have Swagger UI but specs may be incomplete
2. **Implement request/response logging** - For audit trails (respecting PII)
3. **Add webhook retry logic** - Client-side exponential backoff documentation

---

## Test Execution Notes

### Prerequisites
- MongoDB instance running with test data
- Redis instance running
- Environment variables configured in `.env`
- Service built: `npm run build`

### Running Tests
```bash
# Auth service
cd rez-auth-service
npm test

# Payment service
cd rez-payment-service
npm test

# Merchant service
cd rez-merchant-service
npm test

# Wallet service
cd rez-wallet-service
npm test
```

### Manual API Testing
```bash
# Send OTP
curl -X POST http://localhost:4002/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "countryCode": "+91"}'

# Initiate Payment
curl -X POST http://localhost:4003/api/payment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"orderId": "xxx", "amount": 100, "paymentMethod": "upi"}'

# Get Wallet Balance
curl http://localhost:4004/api/wallet/balance \
  -H "Authorization: Bearer <token>"
```

---

## Appendix: Service Ports

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| rez-auth-service | 4002 | `/health` |
| rez-payment-service | 4003 | `/health` |
| rez-merchant-service | 4005 | `/health` |
| rez-wallet-service | 4004 | `/health` |
