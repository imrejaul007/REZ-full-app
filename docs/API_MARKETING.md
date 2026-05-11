# Marketing API Documentation

## Overview

The Marketing API manages campaigns, offers, coupons, referrals, and promotional content. All endpoints are prefixed with `/campaigns`, `/offers`, `/coupons`, or `/referral`.

## Base URL

```
/api
```

## Authentication

Most endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Public endpoints (like viewing offers) do not require authentication.

---

## Campaigns API

### Campaign Endpoints

#### GET /campaigns/active

Get active campaigns.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type |
| limit | number | Number of results (default: 10) |

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "_id": "campaign_123",
        "campaignId": "CAMP-2026-001",
        "title": "Summer Sale",
        "subtitle": "Up to 50% off",
        "description": "Huge savings on summer collection",
        "badge": "HOT DEAL",
        "badgeBg": "#FF6B6B",
        "badgeColor": "#FFFFFF",
        "gradientColors": ["#FF6B6B", "#FF8E53"],
        "type": "cashback",
        "deals": [
          {
            "store": "Fashion Store",
            "storeId": "store_123",
            "image": "https://example.com/deal1.jpg",
            "cashback": "20%",
            "endsIn": "2 days"
          }
        ],
        "startTime": "2026-05-01T00:00:00Z",
        "endTime": "2026-06-30T23:59:59Z",
        "isActive": true,
        "priority": 1,
        "minOrderValue": 500,
        "maxBenefit": 1000
      }
    ],
    "total": 5
  }
}
```

---

#### GET /campaigns/exciting-deals

Get exciting deals for homepage section.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of results (default: 6) |

**Response:**
```json
{
  "success": true,
  "data": {
    "dealCategories": [
      {
        "id": "cat_1",
        "title": "Food & Dining",
        "subtitle": "Save on every meal",
        "badge": "FOODIE",
        "gradientColors": ["#FF6B6B", "#FF8E53"],
        "deals": [
          {
            "store": "Pizza Palace",
            "image": "https://example.com/pizza.jpg",
            "cashback": "30%",
            "endsIn": "5 days"
          }
        ]
      }
    ],
    "total": 8
  }
}
```

---

#### GET /campaigns/type/:type

Get campaigns by type.

**Response:** Same as `/campaigns/active`

---

#### GET /campaigns/:campaignId

Get single campaign details.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "campaign_123",
    "campaignId": "CAMP-2026-001",
    "title": "Summer Sale",
    "subtitle": "Up to 50% off",
    "description": "Huge savings on summer collection",
    "badge": "HOT DEAL",
    "gradientColors": ["#FF6B6B", "#FF8E53"],
    "type": "cashback",
    "deals": [...],
    "terms": [
      "Valid on minimum order of Rs. 500",
      "Maximum benefit Rs. 1000",
      "Not valid with other offers"
    ]
  }
}
```

---

### Redemptions

#### GET /campaigns/my-redemptions

Get user's redeemed deals (My Deals).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter: active/used/expired/cancelled/pending |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "redemptions": [
      {
        "id": "redemption_123",
        "code": "SUMMER50",
        "campaignId": "campaign_123",
        "dealSnapshot": {
          "store": "Fashion Store",
          "storeId": "store_123",
          "image": "https://example.com/deal.jpg",
          "cashback": "50%"
        },
        "campaignSnapshot": {
          "title": "Summer Sale",
          "subtitle": "50% off",
          "type": "cashback",
          "badge": "HOT DEAL",
          "endTime": "2026-06-30T23:59:59Z",
          "minOrderValue": 500
        },
        "status": "active",
        "redeemedAt": "2026-05-08T10:00:00Z",
        "expiresAt": "2026-06-30T23:59:59Z",
        "isPaid": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

#### GET /campaigns/redemptions/:code

Get single redemption by code.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "redemption_123",
    "code": "SUMMER50",
    "status": "active",
    "dealSnapshot": {...},
    "campaignSnapshot": {...}
  }
}
```

---

#### POST /campaigns/:campaignId/deals/:dealIndex/redeem

Redeem a deal (free or paid).

**Request:**
```json
{
  "successUrl": "https://app.example.com/deals/success",
  "cancelUrl": "https://app.example.com/deals/cancel"
}
```

**Response (Free Deal):**
```json
{
  "success": true,
  "data": {
    "type": "free",
    "redemption": {
      "id": "redemption_789",
      "code": "DEAL-ABC123",
      "status": "active",
      "expiresAt": "2026-06-30T23:59:59Z",
      "dealSnapshot": {...},
      "campaignSnapshot": {...}
    }
  }
}
```

**Response (Paid Deal):**
```json
{
  "success": true,
  "data": {
    "type": "paid",
    "checkoutUrl": "https://checkout.stripe.com/...",
    "sessionId": "cs_123",
    "redemptionId": "redemption_789",
    "amount": 99,
    "currency": "INR"
  }
}
```

---

#### POST /campaigns/redemptions/:code/use

Mark a redemption as used.

**Request:**
```json
{
  "orderId": "order_123",
  "benefitApplied": 250
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "redemption_123",
    "redemptionCode": "SUMMER50",
    "status": "used",
    "usedAt": "2026-05-10T14:00:00Z",
    "orderId": "order_123",
    "benefitApplied": 250
  }
}
```

---

#### DELETE /campaigns/redemptions/:id

Cancel a redemption.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Redemption cancelled successfully"
  }
}
```

---

#### POST /campaigns/deals/verify-payment

Verify payment for paid deal.

**Request:**
```json
{
  "sessionId": "cs_123",
  "redemptionId": "redemption_789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "redemption": {
      "id": "redemption_789",
      "code": "DEAL-ABC123",
      "status": "active",
      "expiresAt": "2026-06-30T23:59:59Z",
      "purchaseAmount": 99,
      "purchaseCurrency": "INR"
    }
  }
}
```

---

## Offers API

### Offer Endpoints

#### GET /offers

Get all offers with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| store | string | Filter by store ID |
| type | string | Filter by type |
| tags | string | Filter by tags (comma-separated) |
| featured | boolean | Filter featured only |
| trending | boolean | Filter trending only |
| isNew | boolean | Filter new arrivals only |
| minCashback | number | Minimum cashback percentage |
| maxCashback | number | Maximum cashback percentage |
| sortBy | string | Sort field |
| order | string | Sort order (asc/desc) |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "offer_123",
        "title": "50% Cashback on Pizza",
        "subtitle": "Limited time offer",
        "image": "https://example.com/pizza.jpg",
        "category": "food",
        "type": "cashback",
        "cashbackPercentage": 50,
        "originalPrice": 500,
        "discountedPrice": 250,
        "store": {
          "id": "store_123",
          "name": "Pizza Palace",
          "logo": "https://example.com/logo.png",
          "rating": 4.5
        },
        "validity": {
          "startDate": "2026-05-01",
          "endDate": "2026-05-31",
          "isActive": true
        },
        "restrictions": {
          "minOrderValue": 200,
          "maxDiscountAmount": 500
        },
        "metadata": {
          "isNew": false,
          "isTrending": true,
          "priority": 1,
          "tags": ["pizza", "italian", "weekend"]
        }
      }
    ],
    "totalCount": 100,
    "page": 1,
    "pageSize": 20,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

#### GET /offers/page-data

Get complete offers page data including hero banner and sections.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| lat | number | User latitude |
| lng | number | User longitude |

**Response:**
```json
{
  "success": true,
  "data": {
    "heroBanner": {
      "_id": "banner_123",
      "title": "Summer Bonanza",
      "subtitle": "Up to 70% off",
      "image": "https://example.com/banner.jpg",
      "ctaText": "Shop Now",
      "ctaAction": "browse",
      "backgroundColor": "#FF6B6B",
      "isActive": true,
      "priority": 1
    },
    "sections": {
      "mega": {
        "title": "Mega Deals",
        "offers": [...]
      },
      "students": {
        "title": "Student Special",
        "offers": [...]
      },
      "newArrivals": {
        "title": "New Arrivals",
        "offers": [...]
      },
      "trending": {
        "title": "Trending Now",
        "offers": [...]
      }
    },
    "userEngagement": {
      "likedOffers": ["offer_123", "offer_456"],
      "userPoints": 1500
    }
  }
}
```

---

#### GET /offers/mega

Get mega offers.

---

#### GET /offers/students

Get student-specific offers.

---

#### GET /offers/new-arrivals

Get new arrival offers.

---

#### GET /offers/:offerId

Get single offer details.

---

#### POST /offers/:offerId/like

Like an offer.

---

#### DELETE /offers/:offerId/like

Unlike an offer.

---

## Coupons API

### Coupon Endpoints

#### GET /coupons

Get available coupons.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| tag | string | Filter by tag |
| featured | boolean | Filter featured only |

**Response:**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "_id": "coupon_123",
        "couponCode": "SAVE20",
        "title": "20% Off on All Orders",
        "description": "Get 20% discount on your next purchase",
        "discountType": "PERCENTAGE",
        "discountValue": 20,
        "minOrderValue": 500,
        "maxDiscountCap": 1000,
        "validFrom": "2026-05-01T00:00:00Z",
        "validTo": "2026-05-31T23:59:59Z",
        "usageLimit": {
          "totalUsage": 1000,
          "perUser": 1,
          "usedCount": 450
        },
        "applicableTo": {
          "categories": [],
          "products": [],
          "stores": [],
          "userTiers": []
        },
        "autoApply": false,
        "autoApplyPriority": 0,
        "status": "active",
        "isNewlyAdded": true,
        "isFeatured": true,
        "viewCount": 1500,
        "claimCount": 450,
        "usageCount": 300
      }
    ],
    "total": 25
  }
}
```

---

#### GET /coupons/featured

Get featured coupons.

---

#### GET /coupons/my-coupons

Get user's claimed coupons.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter: available/used/expired |

**Response:**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "_id": "usercoupon_123",
        "user": "user_123",
        "coupon": {
          "_id": "coupon_123",
          "couponCode": "SAVE20",
          "title": "20% Off",
          "discountType": "PERCENTAGE",
          "discountValue": 20
        },
        "claimedDate": "2026-05-01T10:00:00Z",
        "expiryDate": "2026-05-31T23:59:59Z",
        "usedDate": null,
        "usedInOrder": null,
        "status": "available",
        "notifications": {
          "expiryReminder": true,
          "expiryReminderSent": null
        }
      }
    ],
    "summary": {
      "total": 5,
      "available": 3,
      "used": 1,
      "expired": 1
    }
  }
}
```

---

#### POST /coupons/:couponId/claim

Claim a coupon.

**Response:**
```json
{
  "success": true,
  "data": {
    "userCoupon": {
      "_id": "usercoupon_456",
      "coupon": {...},
      "status": "available",
      "expiryDate": "2026-05-31T23:59:59Z"
    }
  }
}
```

---

#### POST /coupons/validate

Validate coupon for cart.

**Request:**
```json
{
  "couponCode": "SAVE20",
  "cartData": {
    "items": [
      { "product": "prod_123", "quantity": 1, "price": 500 }
    ],
    "subtotal": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "discount": 100,
    "coupon": {
      "code": "SAVE20",
      "type": "PERCENTAGE",
      "value": 20
    }
  }
}
```

---

#### POST /coupons/best-offer

Get best coupon offer for cart.

---

#### DELETE /coupons/:couponId

Remove claimed coupon.

---

#### GET /coupons/search

Search coupons.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query |
| category | string | Filter by category |
| tag | string | Filter by tag |

---

#### GET /coupons/:couponId

Get coupon details.

---

## Referral API

### Referral Endpoints

#### GET /referral/data

Get referral program data.

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Refer & Earn",
    "subtitle": "Share the app with friends",
    "inviteButtonText": "Invite Friends",
    "inviteLink": "https://rez.app/ref/user123",
    "referralCode": "REZABC123",
    "earnedRewards": 500,
    "totalReferrals": 10,
    "pendingRewards": 100,
    "completedReferrals": 8,
    "isActive": true,
    "rewardPerReferral": 100,
    "maxReferrals": 50
  }
}
```

---

#### GET /referral/code

Get user's referral code (idempotent).

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "REZABC123",
    "referralLink": "https://rez.app/ref/REZABC123"
  }
}
```

---

#### GET /referral/history

Get referral history.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": "ref_123",
        "referredUser": {
          "id": "user_456",
          "name": "John Doe",
          "email": "john@example.com",
          "joinedAt": "2026-04-15T10:00:00Z"
        },
        "status": "completed",
        "rewardAmount": 100,
        "rewardStatus": "credited",
        "createdAt": "2026-04-15T10:00:00Z",
        "completedAt": "2026-04-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

#### GET /referral/statistics

Get referral statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 10,
    "completedReferrals": 8,
    "pendingReferrals": 2,
    "totalEarned": 800,
    "pendingEarnings": 200,
    "averageRewardPerReferral": 100,
    "conversionRate": 0.8
  }
}
```

---

#### POST /referral/generate-link

Generate referral link.

**Response:**
```json
{
  "success": true,
  "data": {
    "referralLink": "https://rez.app/ref/REZABC123",
    "referralCode": "REZABC123"
  }
}
```

---

#### POST /referral/share

Track referral share.

**Request:**
```json
{
  "platform": "whatsapp"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

#### POST /referral/claim-rewards

Claim pending referral rewards.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "totalClaimed": 200,
    "transactionId": "txn_123"
  }
}
```

---

#### GET /referral/leaderboard

Get referral leaderboard.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | Period: week/month/year |

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user_789",
        "userName": "Jane Smith",
        "totalReferrals": 50,
        "totalEarned": 5000
      }
    ],
    "userRank": {
      "rank": 15,
      "totalReferrals": 10,
      "totalEarned": 1000
    }
  }
}
```

---

## Types

### Campaign
```typescript
interface Campaign {
  _id: string;
  campaignId: string;
  title: string;
  subtitle: string;
  description?: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  gradientColors: string[];
  type: 'cashback' | 'coins' | 'bank' | 'bill' | 'drop' | 'new-user' | 'flash' | 'general';
  deals: CampaignDeal[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  priority: number;
  terms?: string[];
  minOrderValue?: number;
  maxBenefit?: number;
  region?: 'bangalore' | 'dubai' | 'all';
}
```

### CampaignDeal
```typescript
interface CampaignDeal {
  store?: string;
  storeId?: string;
  image: string;
  cashback?: string;
  coins?: string;
  bonus?: string;
  drop?: string;
  discount?: string;
  endsIn?: string;
  dealIndex?: number;
  price?: number;
  currency?: 'INR' | 'AED' | 'USD';
  isPaid?: boolean;
  purchaseLimit?: number;
  purchaseCount?: number;
  isSoldOut?: boolean;
}
```

### DealRedemption
```typescript
interface DealRedemption {
  id: string;
  code: string;
  campaignId?: string;
  dealSnapshot: any;
  campaignSnapshot: any;
  status: 'pending' | 'active' | 'used' | 'expired' | 'cancelled';
  redeemedAt: string;
  expiresAt: string;
  usedAt?: string;
  benefitApplied?: number;
  isPaid?: boolean;
  purchaseAmount?: number;
}
```

### Offer
```typescript
interface Offer {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  category: string;
  type: 'cashback' | 'discount' | 'voucher' | 'combo' | 'special' | 'walk_in';
  cashbackPercentage: number;
  originalPrice?: number;
  discountedPrice?: number;
  store: {
    id: string;
    name: string;
    logo?: string;
    rating?: number;
  };
  validity: {
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  restrictions: {
    minOrderValue?: number;
    maxDiscountAmount?: number;
  };
  metadata: {
    isNew?: boolean;
    isTrending?: boolean;
    priority: number;
    tags: string[];
  };
}
```

### Coupon
```typescript
interface Coupon {
  _id: string;
  couponCode: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap: number;
  validFrom: string;
  validTo: string;
  usageLimit: {
    totalUsage: number;
    perUser: number;
    usedCount: number;
  };
  applicableTo: {
    categories: string[];
    products: string[];
    stores: string[];
    userTiers: string[];
  };
  autoApply: boolean;
  status: 'active' | 'inactive' | 'expired';
  isNewlyAdded: boolean;
  isFeatured: boolean;
}
```

### ReferralData
```typescript
interface ReferralData {
  title: string;
  subtitle: string;
  inviteButtonText: string;
  inviteLink: string;
  referralCode: string;
  earnedRewards: number;
  totalReferrals: number;
  pendingRewards: number;
  completedReferrals: number;
  isActive: boolean;
  rewardPerReferral: number;
  maxReferrals: number;
}
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Offer not accessible |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Already redeemed |
| 410 | Gone - Campaign expired |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint | Rate Limit |
|----------|------------|
| /campaigns/* | 100 requests/minute |
| /offers/* | 100 requests/minute |
| /coupons/* | 50 requests/minute |
| /referral/* | 30 requests/minute |

---

## Caching

| Endpoint | Cache Duration |
|----------|----------------|
| /campaigns/active | 2 minutes |
| /campaigns/exciting-deals | 2 minutes |
| /offers | 5 minutes |
| /offers/page-data | 5 minutes |
| /coupons | 5 minutes |
| /coupons/featured | 5 minutes |

---

## Versioning

Current version: v1

All endpoints are versioned under `/api/v1`.
