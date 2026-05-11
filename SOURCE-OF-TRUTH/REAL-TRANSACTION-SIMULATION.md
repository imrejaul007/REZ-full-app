# ReZ Platform — Real Transaction Simulation

**Version:** 1.0
**Date:** May 7, 2026
**Flow:** Complete order-to-earn transaction

---

## TRANSACTION SIMULATION: User Scans QR → Orders → Pays → Earns Coins

### Step 1: User Opens App

```
User Action: Open consumer.rez.money app
System: App launches, shows home screen
```

### Step 2: User Scans Merchant QR

```
User Action: Tap Scan → Camera opens → Point at QR Code
QR Data: https://menu.rez.money/store/merchant_abc123
System: QR decoded → API call made
```

### Step 3: API Gateway Routes to Auth Service

```
Request:
POST https://api.rez.money/api/auth/verify-qr
Headers: Authorization: Bearer <token>
Body: { qrId: "merchant_abc123" }

System Response:
{ valid: true, merchant: { id: "merchant_abc", name: "Cafe XYZ" }
```

### Step 4: Load Merchant Menu (Catalog Service)

```
Request:
GET https://api.rez.money/api/catalog/merchant/merchant_abc/menu
Headers: Authorization: Bearer <token>

System Response:
{
  merchant: { name: "Cafe XYZ" },
  categories: [
    { name: "Beverages", items: [...] },
    { name: "Food", items: [...] }
  ]
}
```

### Step 5: User Adds Items to Cart

```
User Action: Tap "Add" on items
System: Cart updated locally
App State: { items: [{ id: "p1", qty: 2 }, { id: "p2", qty: 1 }
```

### Step 6: Create Order (Order Service)

```
Request:
POST https://api.rez.money/api/orders
Headers: Authorization: Bearer <token>
Body: {
  merchantId: "merchant_abc",
  items: [
    { productId: "prod_123", quantity: 2, price: 149 },
    { productId: "prod_456", quantity: 1, price: 89 }
  ],
  total: 387,
  paymentMethod: "UPI"
}

System Response:
{
  orderId: "ord_987xyz",
  status: "pending_payment",
  total: 387,
  upiId: "cafe@razorpay"
}
```

### Step 7: Payment Link Generated (Payment Service)

```
Request:
POST https://payment.rez.money/api/create-link
Body: {
  orderId: "ord_987xyz",
  amount: 387,
  purpose: "order_payment"
}

System Response:
{
  link: "https://rzp.io/t/abc123",
  expiry: "2026-05-07T12:00:00Z"
}
```

### Step 8: User Pays via UPI App

```
User Action: Opens PhonePe/GooglePay
System: Shows "cafe@razorpay" to pay ₹387
User Action: Authenticates in UPI app
UPI Response: SUCCESS
```

### Step 9: Webhook Receives Payment (Payment Service)

```
Razorpay Webhook → POST /api/webhooks/razorpay
Body: {
  event: "payment.captured",
  payload: {
    payment: { id: "pay_abc123" },
    order: { receipt: "ord_987xyz" }
  }
}

System Actions:
1. Update order status to "paid"
2. Publish event "payment.completed"
3. Trigger coin earning calculation
4. Send push notification
```

### Step 10: Event Triggers Multiple Actions (Event Bus)

```
Event: payment.completed
  ├─→ Order Service: Confirms order
  ├─→ Wallet Service: Calculate coins
  ├─→ Inventory Service: Deduct stock
  └─→ Analytics: Log transaction
```

### Step 11: Coins Credited to User (Wallet Service)

```
Request: POST /api/wallet/earn
Body: {
  userId: "user_123",
  amount: 19,  # 5% of ₹387
  source: "order_completed",
  orderId: "ord_987xyz"
}

System Response:
{
  success: true,
  newBalance: 519,
  coinsEarned: 19,
  message: "₹19 credited!"
}
```

### Step 12: Push Notification Sent (Notification Service)

```
Request: Firebase FCM
Body: {
  to: "user_device_token",
  notification: {
    title: "Payment Successful! 🎉",
    body: "₹387 paid to Cafe XYZ. Earned 19 coins!"
  }
}

User Phone: Shows notification
```

### Step 13: Merchant Gets Order Alert (Merchant App)

```
Request: Firebase FCM to merchant_device_token
Body: {
  notification: {
    title: "New Order #987",
    body: "Order received from user_123"
  }
}

Merchant Phone: Shows new order popup
```

### Step 14: Order Prepared & Delivered

```
Merchant Action: Prepares order → Marks "ready"
System: Push notification to user
User: Picks up order → Confirms delivery
Order Status: completed
```

### Step 15: Transaction Logged (Analytics)

```
Event: order.completed
Metrics: {
  transaction_id: "ord_987xyz",
  merchant_id: "merchant_abc",
  user_id: "user_123",
  amount: 387,
  coins_earned: 19,
  time_to_prepare: "12 minutes"
}
```

---

## COMPLETE API CALL SEQUENCE

```
Timeline:

0.0s    USER opens app
0.5s    GET /api/auth/verify-qr
1.0s    GET /api/catalog/menu
1.5s    USER adds items to cart
2.0s    POST /api/orders
2.5s    POST /api/payments/initiate
3.0s    USER opens UPI app
5.0s    USER authenticates
5.5s    RAZORPAY webhook fires
6.0s    POST /api/webhooks/razorpay
6.5s    PUT /api/orders/ord_987xyz
7.0s    POST /api/wallet/earn
7.5s    POST /api/notifications/send
8.0s    Firebase push to user + merchant
8.5s    ORDER COMPLETE
```

---

## DATA CAPTURED

### User Profile Updated

```json
{
  "userId": "user_123",
  "orders": ["ord_987xyz"],
  "totalSpent": 387,
  "coinsBalance": 519,
  "lastOrder": "2026-05-07T10:30:00Z"
}
```

### Merchant Dashboard Updated

```json
{
  "merchantId": "merchant_abc",
  "dailyOrders": 47,
  "dailyRevenue": 23456,
  "pendingOrders": 2
}
```

### Intent Graph Updated

```json
{
  "userId": "user_123",
  "signals": [
    { "type": "cafe_visit", "merchant": "Cafe XYZ" },
    { "type": "beverage_order" },
    { "type": "coffee_purchase" }
  ]
}
```

---

## MONEY FLOW

```
User Pays: ₹387
         │
         ▼
    Merchant Receives: ₹387 (minus platform fee)
         │
         ├── Platform Fee: ₹7.74 (2%)
         │   └── Revenue: ₹7.74
         │
         └── Merchant Net: ₹379.26
                   │
                   └── Credited to merchant wallet
```

---

## COIN FLOW

```
User Earns: 19 coins (5% of ₹387)
         │
         ├── 19 coins → User wallet
         ├── 19 coins → ReZ treasury (30% platform share)
         │
         └── 13.3 coins → Merchant reward pool
```

---

## REVENUE GENERATED

| Stream | Amount | Status |
|--------|--------|--------|
| Transaction Fee (2%) | ₹7.74 | Captured |
| Coin Treasury (30% of coins) | ₹0.57 | Captured |
| **Total Revenue | **₹8.31 | **Generated |

---

## MONITORING

### Metrics Logged

```
order_created: 1
order_paid: 1
user_earned_coins: 1
merchant_received_payment: 1
intent_captured: 1
notification_sent: 2
```

### Alerts Triggered

```
Payment Webhook Received
Order Completed
Coin Balance Updated
```

---

## SUMMARY

| Step | API Called | Service |
|------|------------|---------|
| 1 | Verify QR | Auth Service |
| 2 | Get Menu | Catalog Service |
| 3 | Create Order | Order Service |
| 4 | Initiate Payment | Payment Service |
| 5 | Webhook | Payment Service |
| 6 | Credit Coins | Wallet Service |
| 7 | Push Notification | Notification Service |
| 8 | Update Dashboard | Merchant Service |
| 9 | Log Event | Analytics Service |
| 10 | Update Intent | Intent Graph |

**Total APIs Called:** 10
**Total Services Involved:** 7
**User Action Time:** ~5 seconds
**Background Processing:** ~3 seconds
**Total Revenue:** ₹8.31

**Simulation Complete!** ✅
