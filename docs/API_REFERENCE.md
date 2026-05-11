# API Reference

Complete API documentation for the REZ Loyalty System services.

---

## Authentication

All internal service requests require an `X-Internal-Token` header:

```bash
curl -H "X-Internal-Token: your-internal-token" \
  http://localhost:4006/api/orders
```

### JWT Authentication (External)

For user-facing endpoints, use JWT Bearer tokens:

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  http://localhost:4006/api/orders/my
```

---

## Profile Aggregator API

### Base URL

```
http://localhost:4015/api
```

### Endpoints

#### GET /profile/:userId

Get complete user profile.

```bash
curl http://localhost:4015/api/profile/user123 \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "identities": {
    "email": "user@example.com",
    "phone": "+919876543210",
    "deviceIds": ["device1", "device2"]
  },
  "commerce": {
    "totalOrders": 45,
    "totalSpent": 125000,
    "averageOrderValue": 2777,
    "lastOrderDate": "2026-05-07T14:30:00Z",
    "preferredCategories": ["pizza", "biryani", "desserts"],
    "lifetimeValue": "premium"
  },
  "loyalty": {
    "points": 12500,
    "tier": "gold",
    "tierProgress": 0.65,
    "nextTierThreshold": 20000
  },
  "gamification": {
    "karmaScore": 2340,
    "streakDays": 14,
    "achievements": ["early_bird", "foodie_10", "reviewer"],
    "level": 12
  },
  "engagement": {
    "activeIntents": 3,
    "dormantIntents": 7,
    "lastActiveAt": "2026-05-08T09:00:00Z",
    "preferredChannels": ["push", "email"]
  },
  "behavioral": {
    "churnRisk": "low"
  },
  "segments": ["premium", "frequent_diner"],
  "updatedAt": "2026-05-08T10:30:00Z"
}
```

#### PUT /profile/:userId/preferences

Update user preferences.

```bash
curl -X PUT http://localhost:4015/api/profile/user123/preferences \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "preferredChannels": ["push", "sms"],
    "notificationSettings": {
      "orderUpdates": true,
      "promotions": false,
      "loyaltyAlerts": true
    }
  }'
```

---

## Loyalty Service API

### Base URL

```
http://localhost:4016/api
```

### Endpoints

#### GET /loyalty/:userId/balance

Get user's loyalty points balance.

```bash
curl http://localhost:4016/api/loyalty/user123/balance \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "points": 12500,
  "tier": "gold",
  "tierProgress": 0.65,
  "pointsToNextTier": 7500,
  "updatedAt": "2026-05-08T10:30:00Z"
}
```

#### GET /loyalty/:userId/transactions

Get loyalty points transaction history.

```bash
curl "http://localhost:4016/api/loyalty/user123/transactions?limit=20&offset=0" \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "transactions": [
    {
      "id": "txn_001",
      "type": "credit",
      "points": 692,
      "balance": 12500,
      "source": "order",
      "orderId": "ord_xyz789",
      "reason": "Points earned on order",
      "createdAt": "2026-05-08T10:35:00Z"
    },
    {
      "id": "txn_002",
      "type": "debit",
      "points": -500,
      "balance": 11808,
      "source": "redemption",
      "orderId": "ord_abc123",
      "reason": "Redeemed for discount",
      "createdAt": "2026-05-07T18:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /loyalty/:userId/credit

Credit points to user (internal use).

```bash
curl -X POST http://localhost:4016/api/loyalty/user123/credit \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "points": 100,
    "source": "promotion",
    "reason": "Welcome bonus",
    "orderId": "ord_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "transactionId": "txn_new001",
  "newBalance": 12600,
  "pointsCredited": 100
}
```

#### POST /loyalty/:userId/redeem

Redeem points for discount.

```bash
curl -X POST http://localhost:4016/api/loyalty/user123/redeem \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "points": 500,
    "orderId": "ord_new123",
    "reason": "Order discount"
  }'
```

**Response:**
```json
{
  "success": true,
  "transactionId": "txn_redeem001",
  "pointsRedeemed": 500,
  "newBalance": 12000,
  "discountAmount": 50
}
```

#### GET /loyalty/:userId/tier

Get tier status and progress.

```bash
curl http://localhost:4016/api/loyalty/user123/tier \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "currentTier": "gold",
  "tierProgress": 0.65,
  "lifetimePoints": 12500,
  "nextTier": "platinum",
  "pointsRequired": 37500,
  "benefits": {
    "cashbackMultiplier": 1.5,
    "freeDelivery": true,
    "prioritySupport": false,
    "exclusiveAccess": false
  },
  "renewalDate": "2027-05-01T00:00:00Z"
}
```

#### GET /loyalty/tiers

Get all tier definitions.

```bash
curl http://localhost:4016/api/loyalty/tiers \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "tiers": [
    {
      "name": "bronze",
      "minPoints": 0,
      "maxPoints": 4999,
      "benefits": {
        "cashbackMultiplier": 1.0,
        "freeDelivery": false
      }
    },
    {
      "name": "silver",
      "minPoints": 5000,
      "maxPoints": 19999,
      "benefits": {
        "cashbackMultiplier": 1.25,
        "freeDelivery": false
      }
    },
    {
      "name": "gold",
      "minPoints": 20000,
      "maxPoints": 49999,
      "benefits": {
        "cashbackMultiplier": 1.5,
        "freeDelivery": true
      }
    },
    {
      "name": "platinum",
      "minPoints": 50000,
      "maxPoints": null,
      "benefits": {
        "cashbackMultiplier": 2.0,
        "freeDelivery": true,
        "prioritySupport": true,
        "exclusiveAccess": true
      }
    }
  ]
}
```

---

## Cashback Service API

### Base URL

```
http://localhost:4017/api
```

### Endpoints

#### GET /cashback/:userId/balance

Get user's cashback balance.

```bash
curl http://localhost:4017/api/cashback/user123/balance \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "balance": 450.50,
  "pending": 25.00,
  "lastUpdated": "2026-05-08T10:30:00Z"
}
```

#### GET /cashback/:userId/transactions

Get cashback transaction history.

```bash
curl "http://localhost:4017/api/cashback/user123/transactions?limit=20" \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "transactions": [
    {
      "id": "cb_txn_001",
      "type": "credit",
      "amount": 15.00,
      "orderId": "ord_xyz789",
      "calculation": {
        "orderTotal": 1000,
        "cashbackRate": 0.015,
        "tierMultiplier": 1.5
      },
      "expiresAt": "2026-08-08T00:00:00Z",
      "createdAt": "2026-05-08T10:35:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

#### POST /cashback/:userId/calculate

Calculate cashback for an order (preview).

```bash
curl -X POST http://localhost:4017/api/cashback/user123/calculate \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "orderId": "ord_preview001",
    "orderTotal": 1000
  }'
```

**Response:**
```json
{
  "orderId": "ord_preview001",
  "cashbackAmount": 15.00,
  "breakdown": {
    "baseRate": 0.01,
    "tierMultiplier": 1.5,
    "streakBoost": 0,
    "finalRate": 0.015
  },
  "expiresAt": "2026-08-08T00:00:00Z"
}
```

---

## Gamification Service API

### Base URL

```
http://localhost:4010/api
```

### Endpoints

#### GET /gamification/:userId/karma

Get user's karma score.

```bash
curl http://localhost:4010/api/gamification/user123/karma \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "karmaScore": 2340,
  "level": 12,
  "pointsToNextLevel": 160,
  "totalEarned": 2500,
  "totalConverted": 160
}
```

#### GET /gamification/:userId/achievements

Get user's achievements.

```bash
curl http://localhost:4010/api/gamification/user123/achievements \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "achievements": [
    {
      "id": "early_bird",
      "name": "Early Bird",
      "description": "Placed order before 8 AM",
      "icon": "sun",
      "unlockedAt": "2026-03-15T07:30:00Z"
    },
    {
      "id": "foodie_10",
      "name": "Foodie",
      "description": "Ordered from 10 different categories",
      "icon": "utensils",
      "unlockedAt": "2026-04-20T12:00:00Z"
    }
  ],
  "available": [
    {
      "id": "super_foodie",
      "name": "Super Foodie",
      "description": "Order from 25 different categories",
      "progress": 10,
      "target": 25
    }
  ]
}
```

---

## Streak Service API

### Base URL

```
http://localhost:4018/api
```

### Endpoints

#### GET /streak/:userId

Get user's streak status.

```bash
curl http://localhost:4018/api/streak/user123 \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "currentStreak": 14,
  "longestStreak": 28,
  "lastActivityAt": "2026-05-07T18:00:00Z",
  "activeToday": false,
  "milestones": {
    "7_days": { "reached": true, "at": "2026-04-25" },
    "14_days": { "reached": true, "at": "2026-05-02" },
    "30_days": { "reached": false, "current": 14, "target": 30 }
  }
}
```

---

## Order Service API

### Base URL

```
http://localhost:4006/api
```

### Endpoints

#### GET /orders/:orderId

Get order details.

```bash
curl http://localhost:4006/api/orders/ord_xyz789 \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "orderId": "ord_xyz789",
  "orderNumber": "RZ-2026-00001",
  "userId": "user123",
  "merchantId": "merchant456",
  "items": [
    {
      "productId": "prod_001",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 299,
      "subtotal": 598
    }
  ],
  "totals": {
    "subtotal": 598,
    "tax": 53.82,
    "delivery": 40,
    "discount": 0,
    "cashback": 15,
    "total": 676.82,
    "paidAmount": 676.82
  },
  "status": "delivered",
  "fulfillmentType": "delivery",
  "paymentMethod": "wallet",
  "createdAt": "2026-05-08T10:00:00Z",
  "updatedAt": "2026-05-08T10:35:00Z"
}
```

#### POST /orders

Create a new order.

```bash
curl -X POST http://localhost:4006/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -H "Authorization: Bearer <user-jwt>" \
  -d '{
    "userId": "user123",
    "merchantId": "merchant456",
    "items": [
      { "productId": "prod_001", "quantity": 2 }
    ],
    "fulfillmentType": "delivery",
    "paymentMethod": "wallet",
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "Mumbai",
      "pincode": "400001"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "orderId": "ord_new123",
  "orderNumber": "RZ-2026-00002",
  "status": "placed",
  "totals": {
    "subtotal": 598,
    "tax": 53.82,
    "delivery": 40,
    "total": 691.82
  }
}
```

---

## Intent Service API

### Base URL

```
http://localhost:4009/api
```

### Endpoints

#### POST /intent/capture

Capture user intent signal.

```bash
curl -X POST http://localhost:4009/api/intent/capture \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "userId": "user123",
    "appType": "restaurant",
    "eventType": "view",
    "category": "pizza",
    "intentKey": "margherita_pizza",
    "intentQuery": "margherita pizza near me",
    "merchantId": "merchant456"
  }'
```

**Response:**
```json
{
  "success": true,
  "intentId": "intent_abc123",
  "confidence": 0.40,
  "status": "active"
}
```

#### GET /intent/active/:userId

Get active intents for user.

```bash
curl http://localhost:4009/api/intent/active/user123 \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "intents": [
    {
      "intentId": "intent_001",
      "category": "pizza",
      "intentKey": "margherita_pizza",
      "confidence": 0.85,
      "status": "active",
      "lastSeenAt": "2026-05-08T10:00:00Z",
      "signals": 5
    }
  ],
  "total": 3
}
```

#### GET /intent/dormant/:userId

Get dormant intents for user.

```bash
curl http://localhost:4009/api/intent/dormant/user123 \
  -H "X-Internal-Token: your-token"
```

**Response:**
```json
{
  "userId": "user123",
  "intents": [
    {
      "intentId": "intent_002",
      "category": "biryani",
      "intentKey": "chicken_biryani",
      "revivalScore": 0.65,
      "daysDormant": 12,
      "lastSeenAt": "2026-04-26T14:00:00Z"
    }
  ],
  "total": 7
}
```

#### POST /intent/revive

Trigger intent revival.

```bash
curl -X POST http://localhost:4009/api/intent/revive \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "dormantIntentId": "intent_002",
    "triggerType": "price_drop"
  }'
```

**Response:**
```json
{
  "success": true,
  "dormantIntentId": "intent_002",
  "revivalScore": 0.85,
  "nudgeMessage": "Prices dropped for your biryani search! Order now and save."
}
```

---

## Notification Service API

### Base URL

```
http://localhost:4005/api
```

### Endpoints

#### POST /notifications/send

Send notification.

```bash
curl -X POST http://localhost:4005/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "userId": "user123",
    "channel": "push",
    "template": "order_confirmation",
    "data": {
      "orderId": "ord_xyz789",
      "orderNumber": "RZ-2026-00001"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "notificationId": "notif_001",
  "channel": "push",
  "status": "queued"
}
```

---

## Common Error Responses

### 400 Bad Request

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "details": [
    { "field": "points", "message": "Must be a positive number" }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden

```json
{
  "error": "FORBIDDEN",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "RATE_LIMITED",
  "message": "Rate limit exceeded. Try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req_abc123"
}
```

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Public read | 100 req | 1 minute |
| Authenticated read | 1000 req | 1 minute |
| Internal service | Unlimited | - |
| Write operations | 100 req | 1 minute |

---

## WebSocket Events

Connect to WebSocket at `ws://localhost:4009/ws` with JWT authentication.

### Subscribe to Channels

```javascript
// Subscribe to user intent updates
socket.emit('subscribe', { channel: 'intent:user:user123' });

// Subscribe to order updates
socket.emit('subscribe', { channel: 'order:user:user123' });

// Subscribe to notification events
socket.emit('subscribe', { channel: 'nudge:user:user123' });
```

### Event Payloads

```javascript
// Intent update
{
  "type": "intent:updated",
  "channel": "intent:user:user123",
  "data": {
    "intentId": "intent_001",
    "confidence": 0.9,
    "status": "active"
  }
}

// Order status update
{
  "type": "order:status",
  "channel": "order:user:user123",
  "data": {
    "orderId": "ord_xyz789",
    "status": "preparing",
    "estimatedReadyTime": "2026-05-08T11:00:00Z"
  }
}
```

---

*For event schemas, see [EVENTS.md](EVENTS.md)*
*For REE decision rules, see [DECISIONS.md](DECISIONS.md)*
