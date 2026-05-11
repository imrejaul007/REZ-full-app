# E2E Test Script: QR to Order to Payment to Coins Flow

## Overview

This document describes the end-to-end test flow for the complete money flow: QR Code Scan -> Order Creation -> Payment Processing -> Coins Credit to Wallet.

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌───────────────┐    ┌─────────────┐
│ Consumer App│───>│ QR Scanner  │───>│ Order Service   │───>│ Payment Svc   │───>│ Wallet Svc  │
└─────────────┘    └─────────────┘    └─────────────────┘    └───────────────┘    └─────────────┘
                                              │                      │                     │
                                              v                      v                     v
                                        ┌─────────────┐        ┌─────────────┐       ┌─────────────┐
                                        │MongoDB      │        │MongoDB      │       │MongoDB      │
                                        │orders coll. │        │payments coll│       │wallets coll │
                                        └─────────────┘        └─────────────┘       └─────────────┘
```

## Prerequisites

1. All services running (order-service, payment-service, wallet-service, ledger-service)
2. MongoDB accessible
3. Redis accessible
4. Valid test user and merchant credentials
5. Razorpay test API keys configured

## Step-by-Step Test Flow

### Step 1: QR Code Scan -> Create Order

**API Endpoint:** `POST /api/orders/create`

**Request:**
```json
{
  "merchantId": "merchant_123",
  "userId": "user_456",
  "items": [
    { "itemId": "item_001", "name": "Coffee", "quantity": 2, "price": 50 }
  ],
  "totalAmount": 100,
  "qrCodeId": "qr_abc123"
}
```

**Database Verification (orders collection):**
```javascript
// MongoDB query
db.orders.findOne({
  merchantId: "merchant_123",
  userId: "user_456",
  status: "pending"
})

// Expected fields:
{
  _id: ObjectId,
  orderId: "ORD-XXXX",
  merchantId: "merchant_123",
  userId: "user_456",
  items: [...],
  totalAmount: 100,
  qrCodeId: "qr_abc123",
  status: "pending",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Event Verification:**
```javascript
// Redis stream check
XREAD STREAMS rez:events 0

// Expected event:
{
  type: "order.created",
  source: "rez-order-service",
  data: { orderId: "ORD-XXXX", merchantId: "merchant_123" }
}
```

### Step 2: Initiate Payment

**API Endpoint:** `POST /pay/initiate` (requires auth)

**Request:**
```json
{
  "orderId": "ORD-XXXX",
  "amount": 100,
  "paymentMethod": "upi",
  "purpose": "order_payment",
  "orchestratorIdempotencyKey": "idem_key_123"
}
```

**Database Verification (payments collection):**
```javascript
// MongoDB query
db.payments.findOne({
  orderId: "ORD-XXXX",
  status: "pending"
})

// Expected fields:
{
  _id: ObjectId,
  paymentId: "PAY-XXXX",
  orderId: "ORD-XXXX",
  userId: "user_456",
  amount: 100,
  paymentMethod: "upi",
  status: "pending",
  orchestratorIdempotencyKey: "idem_key_123",
  razorpayOrderId: "order_XXXX",
  createdAt: ISODate,
  walletCredited: false
}
```

### Step 3: Capture Payment (simulate UPI success)

**API Endpoint:** `POST /pay/capture` (requires auth)

**Request:**
```json
{
  "paymentId": "PAY-XXXX",
  "razorpayPaymentId": "pay_test123",
  "razorpayOrderId": "order_XXXX",
  "razorpaySignature": "valid_signature"
}
```

**Database Verification (payments collection):**
```javascript
// MongoDB query
db.payments.findOne({
  paymentId: "PAY-XXXX"
})

// Expected:
{
  status: "completed",
  razorpayPaymentId: "pay_test123",
  capturedAt: ISODate,
  walletCredited: true  // After wallet credit
}

// Redis replay check
GET pay:nonce:pay_test123  // Should exist
```

### Step 4: Wallet Credit (Coins)

**Internal Call:** Payment service -> Wallet service

**Database Verification (wallets collection):**
```javascript
// MongoDB query
db.wallets.findOne({
  userId: "user_456"
})

// Expected:
{
  _id: ObjectId,
  userId: "user_456",
  balance: 100,  // Initial balance + 100 coins
  coins: {
    rez: 100
  },
  lastTransactionId: "TXN-XXXX",
  updatedAt: ISODate
}
```

## Idempotency Test (Retry Payment)

### Purpose
Verify that retrying the same payment with the same idempotency key does not create duplicate transactions.

### Test Steps

1. **First payment attempt:**
```bash
curl -X POST http://localhost:4001/pay/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "orderId": "ORD-XXXX",
    "amount": 100,
    "paymentMethod": "upi",
    "orchestratorIdempotencyKey": "test_idem_001"
  }'
```

2. **Verify first payment created:**
```javascript
db.payments.countDocuments({
  orchestratorIdempotencyKey: "test_idem_001"
})  // Should return 1
```

3. **Retry with same idempotency key:**
```bash
curl -X POST http://localhost:4001/pay/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "orderId": "ORD-XXXX",
    "amount": 100,
    "paymentMethod": "upi",
    "orchestratorIdempotencyKey": "test_idem_001"
  }'
```

4. **Verify no duplicate created:**
```javascript
db.payments.countDocuments({
  orchestratorIdempotencyKey: "test_idem_001"
})  // Should still return 1
```

### Database Verification: Double-Charge Prevention

**Replay prevention via Redis:**
```javascript
// After capture, check Redis nonce
GET pay:nonce:pay_test123  // Should return "1"

// Attempting capture again should fail
// Response: { success: false, message: "Payment already captured" }
```

**MongoDB uniqueness:**
```javascript
// Payment IDs must be unique
db.payments.createIndex({ paymentId: 1 }, { unique: true })

// Order reference must be unique per user
db.payments.createIndex({ userId: 1, orderId: 1 }, { unique: true })
```

## Ledger Balance Verification

### Double-Entry Accounting Rule
Every transaction must have DEBIT = CREDIT. For a complete flow:
- When coins are credited: CUSTOMER_WALLET (DEBIT) = REVENUE (CREDIT)
- Total DEBIT and CREDIT must always balance to 0

### Database Verification

**Check ledger entries for a transaction:**
```javascript
// Query all ledger entries for a specific payment
db.ledgerEntries.find({
  metadata.paymentId: "PAY-XXXX"
})

// Expected: 2 entries minimum (DEBIT and CREDIT)
// Example for wallet credit:
// Entry 1: { account: "CUSTOMER_WALLET", type: "DEBIT", amount: 100 }
// Entry 2: { account: "REVENUE", type: "CREDIT", amount: 100 }
```

**Trial Balance Verification:**
```javascript
// Sum all debits and credits for the day
const entries = db.ledgerEntries.find({
  createdAt: { $gte: startOfDay, $lt: endOfDay }
}).toArray()

const totalDebits = entries
  .filter(e => e.type === "DEBIT")
  .reduce((sum, e) => sum + e.amount, 0)

const totalCredits = entries
  .filter(e => e.type === "CREDIT")
  .reduce((sum, e) => sum + e.amount, 0)

// Assert: totalDebits === totalCredits (within 0.001 precision)
assert(Math.abs(totalDebits - totalCredits) < 0.001,
  `Ledger unbalanced: Debits=${totalDebits}, Credits=${totalCredits}`)
```

**Account Balance Check:**
```javascript
// Get balance for customer wallet account
db.accounts.findOne({ name: "CUSTOMER_WALLET" })

// Balance should reflect all credits minus debits
// After a 100 coin credit: balance += 100
```

## Event Delivery Verification

### Event Flow
1. `order.created` - When order is created
2. `payment.initiated` - When payment flow starts
3. `payment.completed` - When payment is captured
4. `wallet.credited` - When coins are added to wallet

### Redis Stream Verification
```javascript
// Read events from stream
const events = await redis.xread('COUNT', 10, 'STREAMS', 'rez:events', '0')

// Filter for test transaction
events.filter(e =>
  e.data.orderId === "ORD-XXXX" ||
  e.data.paymentId === "PAY-XXXX"
)

// Expected events:
[
  { type: "order.created", data: { orderId: "ORD-XXXX" } },
  { type: "payment.initiated", data: { paymentId: "PAY-XXXX" } },
  { type: "payment.completed", data: { paymentId: "PAY-XXXX" } },
  { type: "wallet.credited", data: { userId: "user_456", amount: 100 } }
]
```

### Dead Letter Queue Check
```javascript
// Check if any events failed delivery
db.dlq.find({ originalEvent: /ORD-XXXX|PAY-XXXX/ })

// Should be empty for successful flows
```

## Test Data Cleanup

After each test, clean up test data:
```javascript
// Remove test orders
db.orders.deleteMany({
  merchantId: "merchant_123",
  userId: { $regex: /^test_/ }
})

// Remove test payments
db.payments.deleteMany({
  orderId: { $regex: /^ORD-TEST/ }
})

// Remove test wallets
db.wallets.deleteMany({
  userId: { $regex: /^test_/ }
})

// Clear Redis test keys
redis.keys("test_*").forEach(key => redis.del(key))
```

## Error Scenarios to Test

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid QR code | Return 400, do not create order |
| Order not found | Return 404 on payment init |
| Amount mismatch | Return 400, reject payment |
| Invalid payment signature | Return 400, do not capture |
| Duplicate payment capture | Return 409, idempotent response |
| Wallet service unavailable | Queue for retry, eventually credit |
| Invalid idempotency key | Return 400, validation error |

## Running the Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test
npm run test:e2e -- --grep "Happy path"

# Run with coverage
npm run test:e2e -- --coverage

# Run against staging
E2E_ENV=staging npm run test:e2e
```

## Environment Variables Required

```env
# Service URLs
ORDER_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4003
LEDGER_SERVICE_URL=http://localhost:4004

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_test

# Redis
REDIS_URL=redis://localhost:6379

# Test credentials
TEST_USER_ID=test_user_123
TEST_MERCHANT_ID=test_merchant_456
TEST_AUTH_TOKEN=eyJhbG...

# Razorpay (test mode)
RAZORPAY_KEY_ID=rzp_test_XXXX
RAZORPAY_KEY_SECRET=XXXX_test
```

## Success Criteria

1. All 4 steps (QR -> Order -> Payment -> Coins) complete successfully
2. Database records match expected schema at each step
3. Idempotency key prevents duplicate payments
4. Ledger DEBIT equals CREDIT (balance = 0)
5. All events published to stream
6. No errors in DLQ
7. Response times within SLA (< 2s per step)
