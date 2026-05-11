# Loyalty API Documentation

## Overview

The Loyalty API manages user loyalty points, rewards, tiers, and redemption functionality. All endpoints are prefixed with `/loyalty`.

## Base URL

```
/api/loyalty
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Points

#### GET /points/balance

Get current loyalty points balance and tier information.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentPoints": 1500,
    "tier": "gold",
    "nextTier": "platinum",
    "pointsToNextTier": 500,
    "lifetimePoints": 2500,
    "expiringPoints": 200,
    "expiryDate": "2026-12-31T23:59:59Z"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| currentPoints | number | Current redeemable points |
| tier | string | User's current tier (bronze/silver/gold/platinum/diamond) |
| nextTier | string | Next tier to unlock |
| pointsToNextTier | number | Points needed for next tier |
| lifetimePoints | number | Total points ever earned |
| expiringPoints | number | Points expiring soon |
| expiryDate | string | Date when expiring points will expire |

---

#### GET /tier

Get loyalty statistics and tier information.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarned": 5000,
    "totalRedeemed": 2500,
    "currentBalance": 1500,
    "rewardsRedeemed": 12,
    "tier": "gold",
    "tierBenefits": [
      "5% bonus points on all purchases",
      "Priority customer support",
      "Free delivery on orders above $50"
    ]
  }
}
```

---

#### GET /catalog

Get available rewards catalog.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (optional) |
| limit | number | Number of results (default: 20) |
| page | number | Page number (default: 1) |

**Response:**
```json
{
  "success": true,
  "data": {
    "rewards": [
      {
        "_id": "reward_123",
        "title": "$10 Store Credit",
        "description": "Get $10 off your next purchase",
        "points": 1000,
        "value": 10,
        "icon": "gift",
        "category": "voucher",
        "available": true,
        "expiryDate": "2026-12-31",
        "termsAndConditions": ["Valid for single use only"]
      }
    ],
    "total": 50
  }
}
```

---

#### GET /rewards/:rewardId

Get specific reward details.

**Response:**
```json
{
  "success": true,
  "data": {
    "reward": {
      "_id": "reward_123",
      "title": "$10 Store Credit",
      "description": "Get $10 off your next purchase",
      "points": 1000,
      "value": 10,
      "category": "voucher",
      "available": true
    }
  }
}
```

---

#### POST /redeem

Redeem points for a reward.

**Request:**
```json
{
  "rewardId": "reward_123",
  "points": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Reward redeemed successfully",
    "newBalance": 500,
    "voucher": {
      "code": "REWARD-ABC123",
      "expiryDate": "2026-12-31T23:59:59Z",
      "value": 10
    }
  }
}
```

---

#### GET /points/history

Get points transaction history.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type: earned/redeemed/expired/adjusted |
| limit | number | Number of results (default: 20) |
| offset | number | Offset for pagination |
| startDate | string | Filter start date (ISO 8601) |
| endDate | string | Filter end date (ISO 8601) |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "txn_123",
        "type": "earned",
        "source": "order_complete",
        "amount": 100,
        "description": "Points earned from order #ORD-456",
        "orderId": "ORD-456",
        "createdAt": "2026-05-01T10:00:00Z",
        "status": "APPROVED"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

---

#### GET /tier-info

Get detailed tier information and benefits.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentTier": "gold",
    "nextTier": "platinum",
    "pointsToNextTier": 500,
    "benefits": [
      "5% bonus points on all purchases",
      "Priority customer support",
      "Free delivery on orders above $50"
    ],
    "nextTierBenefits": [
      "10% bonus points on all purchases",
      "Dedicated account manager",
      "Free delivery on all orders",
      "Exclusive member-only deals"
    ]
  }
}
```

---

#### GET /earn-points

Get points earning opportunities.

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "earn_order",
        "title": "Make a Purchase",
        "description": "Earn 1 point per $1 spent",
        "points": 100,
        "icon": "shopping-bag",
        "action": "purchase"
      },
      {
        "id": "earn_review",
        "title": "Write a Review",
        "description": "Earn 50 points for each verified review",
        "points": 50,
        "icon": "star",
        "action": "review"
      }
    ]
  }
}
```

---

#### GET /rewards/:rewardId/can-redeem

Check if user can redeem a specific reward.

**Response:**
```json
{
  "success": true,
  "data": {
    "canRedeem": true,
    "pointsNeeded": 0,
    "reason": "Sufficient points"
  }
}
```

Or if insufficient points:
```json
{
  "success": true,
  "data": {
    "canRedeem": false,
    "pointsNeeded": 300,
    "reason": "Insufficient points"
  }
}
```

---

#### GET /redemptions

Get user's redeemed rewards/vouchers.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter: active/used/expired |
| limit | number | Number of results |
| page | number | Page number |

**Response:**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "_id": "voucher_123",
        "code": "SAVE20",
        "value": 20,
        "status": "active",
        "redeemedAt": "2026-05-01T10:00:00Z",
        "expiryDate": "2026-06-01T23:59:59Z"
      }
    ],
    "total": 5
  }
}
```

---

#### GET /homepage-summary

Get homepage loyalty section summary.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| latitude | number | User latitude |
| longitude | number | User longitude |

**Response:**
```json
{
  "success": true,
  "data": {
    "loyaltyHub": {
      "activeBrands": 25,
      "streaks": 7,
      "unlocked": 3,
      "tiers": 5
    },
    "featuredLockProduct": {
      "productId": "prod_123",
      "name": "Premium Headphones",
      "image": "https://example.com/headphones.jpg",
      "originalPrice": 199.99,
      "sellingPrice": 149.99,
      "savings": 50,
      "cashbackCoins": 500,
      "storeName": "TechStore",
      "storeId": "store_456"
    },
    "trendingService": null
  }
}
```

---

## Types

### LoyaltyPoints
```typescript
interface LoyaltyPoints {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  nextTier: string;
  pointsToNextTier: number;
  lifetimePoints: number;
  expiringPoints: number;
  expiryDate: string;
}
```

### Reward
```typescript
interface Reward {
  _id: string;
  title: string;
  description: string;
  points: number;
  value: number;
  icon: string;
  category: 'voucher' | 'discount' | 'cashback' | 'freebie';
  available: boolean;
  expiryDate?: string;
  termsAndConditions?: string[];
}
```

### LoyaltyStats
```typescript
interface LoyaltyStats {
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  rewardsRedeemed: number;
  tier: string;
  tierBenefits: string[];
}
```

### LoyaltyTransaction
```typescript
interface LoyaltyTransaction {
  _id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  source: string;
  amount: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  metadata?: Record<string, any>;
}
```

---

## Error Responses

All endpoints may return the following error responses:

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Rate Limiting

- **Points Balance**: 100 requests/minute
- **Transactions History**: 30 requests/minute
- **Redemption**: 10 requests/minute

---

## Caching

| Endpoint | Cache Duration |
|----------|----------------|
| /points/balance | 1 minute |
| /tier | 5 minutes |
| /catalog | 10 minutes |
| /rewards/:id | 5 minutes |

---

## Versioning

Current version: v1

All endpoints are versioned under `/api/v1/loyalty`.
