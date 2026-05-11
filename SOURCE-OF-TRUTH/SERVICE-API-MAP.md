# ReZ Platform — Service API Map

**Version:** 1.0
**Date:** May 7, 2026

---

## COMPLETE API MAP

### Authentication Flow

```
USER → Auth Service → JWT Token → All Services
```

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|---------|
| `/api/auth/send-otp` | POST | Send OTP | `{ success: true }` |
| `/api/auth/verify-otp` | POST | Verify OTP | `{ token, user }` |
| `/api/auth/refresh` | POST | Refresh token | `{ token }` |
| `/api/auth/logout` | POST | Invalidate token | `{ success: true }` |

---

## WALLET API MAP

### Coin Operations

| Endpoint | Method | Purpose | Body | Response |
|-----------|--------|---------|------|----------|
| `/api/wallet/balance` | GET | Get balance | - | `{ coins, cash }` |
| `/api/wallet/earn` | POST | Earn coins | `{ amount, reason }` | `{ newBalance }` |
| `/api/wallet/spend` | POST | Spend coins | `{ amount, orderId }` | `{ newBalance }` |
| `/api/wallet/transfer` | POST | Send coins | `{ to, amount }` | `{ success }` |
| `/api/transactions` | GET | History | - | `{ transactions }` |

---

## ORDER API MAP

### Order Lifecycle

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/orders` | POST | Create order | `{ items }` | `{ orderId }` |
| `/api/orders/:id` | GET | Get order | - | `{ order }` |
| `/api/orders/:id/confirm` | POST | Merchant confirms | - | `{ success }` |
| `/api/orders/:id/pay` | POST | Initiate payment | - | `{ paymentUrl }` |
| `/api/orders/:id/cancel` | POST | Cancel | `{ reason }` | `{ success }` |

---

## PAYMENT API MAP

### Payment Flow

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/payments/initiate` | POST | Start payment | `{ orderId, method }` | `{ paymentId }` |
| `/api/payments/:id/verify` | GET | Check status | - | `{ status }` |
| `/api/payments/webhook` | POST | Razorpay callback | `{ razorpay_signature }` | `{ success }` |

---

## MERCHANT API MAP

### Merchant Operations

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/merchants/profile` | GET | Get profile | - | `{ merchant }` |
| `/api/merchants/menu` | GET | Get menu | - | `{ menu }` |
| `/api/merchants/qr/generate` | POST | Create QR | `{ type }` | `{ qrUrl }` |
| `/api/merchants/orders` | GET | Get orders | - | `{ orders }` |
| `/api/merchants/analytics` | GET | Dashboard | - | `{ stats }` |

---

## CATALOG API MAP

### Product Management

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/catalog/products` | GET | List products | - | `{ products }` |
| `/api/catalog/products` | POST | Add product | `{ product }` | `{ id }` |
| `/api/catalog/categories` | GET | Categories | - | `{ categories }` |
| `/api/catalog/search` | GET | Search | `{ q }` | `{ results }` |

---

## INTENT GRAPH API MAP

### AI Operations

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/intent/capture` | POST | Log event | `{ userId, event }` | `{ success }` |
| `/api/intent/predict` | POST | Predict intent | `{ userId }` | `{ intents }` |
| `/api/intent/recommend` | POST | Get recommendations | `{ userId }` | `{ recommendations }` |

---

## NOTIFICATION API MAP

### Push/Email/SMS

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/notify/push` | POST | Send push | `{ userId, title }` | `{ success }` |
| `/api/notify/sms` | POST | Send SMS | `{ phone, message }` | `{ success }` |
| `/api/notify/email` | POST | Send email | `{ to, template }` | `{ messageId }` |
| `/api/notify/whatsapp` | POST | WhatsApp | `{ phone, template }` | `{ messageId }` |

---

## EVENT API MAP

### Analytics Events

| Endpoint | Method | Purpose | Body | Response |
|---------|--------|---------|------|----------|
| `/api/events/track` | POST | Log event | `{ event }` | `{ success }` |
| `/api/events/batch` | POST | Batch events | `{ events }` | `{ success }` |
| `/api/events/query` | POST | Query events | `{ filter }` | `{ events }` |

---

## SERVICE CONNECTIONS

### Order Creation Flow

```
1. POST /api/orders
   └─→ Creates order in MongoDB
   └─→ Publishes order.created event to Redis
   └─→ Triggers:
       ├─→ Payment intent
       ├─→ Inventory update
       └─→ Analytics event

2. POST /api/payments/initiate
   └─→ Creates Razorpay order
   └─→ Returns payment URL

3. Webhook receives Razorpay callback
   └─→ Updates order status
   └─→ Publishes payment.completed
   └─→ Credits merchant wallet
   └─→ Triggers notification

4. POST /api/wallet/earn
   └─→ Credits user coins
   └─→ Publishes coins.earned event
   └─→ Sends push notification
```

---

## REQUEST/RESPONSE EXAMPLES

### Create Order

```bash
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "merchantId": "mert_123",
  "items": [
    { "productId": "prod_456", "quantity": 2 }
  ],
  "total": 299,
  "paymentMethod": "UPI"
}

Response:
{
  "orderId": "ord_789",
  "status": "pending_payment",
  "paymentUrl": "https://api.razorpay.com/orders/..."
}
```

### Pay Order

```bash
POST /api/payments/initiate
{
  "orderId": "ord_789",
  "method": "upi"
}

Response:
{
  "paymentId": "pay_123",
  "status": "created"
}
```

### Webhook (Razorpay → Our Server)

```bash
POST /api/payments/webhook
{
  "event": "payment.captured",
  "payload": { "order": { "receipt": "ord_789" }
}

Response:
{
  "handled": true
}
```

### Earn Coins

```bash
POST /api/wallet/earn
{
  "userId": "user_123",
  "amount": 15,
  "reason": "order_completed"
}

Response:
{
  "newBalance": 150,
  "coins": 150
}
```

---

## PORT REFERENCE

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Main router |
| Auth | 4002 | Authentication |
| Wallet | 4004 | Coins/payments |
| Payment | 4001 | Payment gateway |
| Order | 3006 | Order management |
| Catalog | 3005 | Products/menu |
| Search | 4003 | Full-text search |
| Gamification | 3001 | Coins/points |
| Intent Graph | 3007 | AI/ML |
| Analytics | 4008 | Event tracking |
| Notifications | 4010 | Push/SMS/Email |

</parameter>
