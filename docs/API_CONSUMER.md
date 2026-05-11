# Consumer API Documentation

## Overview

The Consumer API provides comprehensive endpoints for the ReZ consumer mobile application, including authentication, user profile, stores, products, orders, payments, wallet, gamification, and more.

## Base URL

```
/api
```

## Authentication

Most endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Public endpoints (like browsing stores, products, offers) do not require authentication.

---

## Table of Contents

1. [Authentication](#authentication-api)
2. [User Profile](#user-profile-api)
3. [Homepage](#homepage-api)
4. [Stores](#stores-api)
5. [Products](#products-api)
6. [Orders](#orders-api)
7. [Payments](#payments-api)
8. [Wallet](#wallet-api)
9. [Gamification](#gamification-api)
10. [Explore](#explore-api)
11. [Search](#search-api)
12. [Events](#events-api)
13. [Reviews](#reviews-api)
14. [Analytics](#analytics-api)
15. [Bookings](#bookings-api)
16. [Notifications](#notifications-api)

---

## Authentication API

### POST /auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+919876543210",
      "createdAt": "2026-05-08T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
  }
}
```

---

### POST /auth/login

Login with email/phone and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Or with phone:
```json
{
  "phone": "+919876543210",
  "password": "securePassword123"
}
```

---

### POST /auth/otp/send

Send OTP for authentication.

**Request:**
```json
{
  "phone": "+919876543210",
  "purpose": "login"
}
```

---

### POST /auth/otp/verify

Verify OTP.

**Request:**
```json
{
  "phone": "+919876543210",
  "otp": "123456",
  "purpose": "login"
}
```

---

### POST /auth/refresh

Refresh access token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

---

### POST /auth/logout

Logout user (invalidate tokens).

---

### GET /auth/me

Get current authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+919876543210",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2026-01-01T00:00:00Z",
    "preferences": {
      "notifications": true,
      "location": true
    }
  }
}
```

---

## User Profile API

### GET /profile

Get user profile.

---

### PUT /profile

Update user profile.

**Request:**
```json
{
  "name": "John Doe Updated",
  "avatar": "https://example.com/new-avatar.jpg",
  "bio": "Love shopping and saving money!",
  "dateOfBirth": "1990-05-15",
  "gender": "male"
}
```

---

### GET /profile/addresses

Get user addresses.

---

### POST /profile/addresses

Add new address.

**Request:**
```json
{
  "label": "Home",
  "address": "123 Main Street",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "coordinates": {
    "lat": 12.9716,
    "lng": 77.5946
  },
  "isDefault": true
}
```

---

### PUT /profile/addresses/:id

Update address.

---

### DELETE /profile/addresses/:id

Delete address.

---

## Homepage API

### GET /homepage

Get complete homepage data.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | User ID (optional) |
| region | string | Region code |
| segment | string | User segment |

**Response:**
```json
{
  "success": true,
  "data": {
    "sections": {
      "justForYou": [...],
      "newArrivals": [...],
      "trendingStores": [...],
      "events": [...],
      "offers": [...],
      "flashSales": [...]
    },
    "metadata": {
      "cached": true,
      "timestamp": "2026-05-08T10:00:00Z"
    },
    "userContext": {
      "walletBalance": 1500,
      "totalSaved": 500,
      "voucherCount": 3,
      "offersCount": 25,
      "cartItemCount": 5,
      "subscription": {
        "tier": "premium",
        "status": "active"
      }
    }
  }
}
```

---

### GET /homepage/sections/:sectionId

Get specific section data.

---

### GET /homepage/user-context

Get user context data for homepage.

**Response:**
```json
{
  "success": true,
  "data": {
    "walletBalance": 1500,
    "totalSaved": 500,
    "voucherCount": 3,
    "offersCount": 25,
    "cartItemCount": 5,
    "subscription": {
      "tier": "premium",
      "status": "active"
    }
  }
}
```

---

### POST /analytics/homepage

Track homepage analytics.

**Request:**
```json
{
  "sectionViews": { "section_1": 5 },
  "itemClicks": { "product_123": 2 },
  "timestamp": "2026-05-08T10:00:00Z"
}
```

---

## Stores API

### GET /stores

Get stores with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| search | string | Search query |
| lat | number | Latitude |
| lng | number | Longitude |
| radius | number | Search radius in km |
| sortBy | string | Sort by: rating/distance/name/newest |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "_id": "store_123",
        "name": "Fashion Hub",
        "category": {
          "name": "Fashion",
          "slug": "fashion"
        },
        "banner": ["https://example.com/banner.jpg"],
        "logo": "https://example.com/logo.png",
        "rating": {
          "average": 4.5,
          "count": 120
        },
        "cashbackRate": 15,
        "isOpen": true,
        "distance": 1.5,
        "isFeatured": true,
        "isTrending": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

### GET /stores/search

Search stores.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query |
| page | number | Page number |
| limit | number | Results per page |

---

### GET /stores/:storeId

Get store details.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "store_123",
    "name": "Fashion Hub",
    "description": "Your one-stop fashion destination",
    "banner": ["https://example.com/banner.jpg"],
    "logo": "https://example.com/logo.png",
    "images": [...],
    "rating": {
      "average": 4.5,
      "count": 120
    },
    "cashbackRate": 15,
    "isOpen": true,
    "operationalHours": {
      "monday": { "open": "09:00", "close": "21:00" },
      "tuesday": { "open": "09:00", "close": "21:00" }
    },
    "location": {
      "address": "123 Main Street",
      "city": "Bangalore",
      "coordinates": { "lat": 12.9716, "lng": 77.5946 }
    },
    "contact": {
      "phone": "+919876543210",
      "email": "contact@fashionhub.com"
    },
    "categories": [...],
    "offers": [...],
    "reviews": [...]
  }
}
```

---

### GET /stores/:storeId/products

Get store products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| sortBy | string | Sort by |
| page | number | Page number |
| limit | number | Results per page |

---

### GET /stores/:storeId/reviews

Get store reviews.

---

### GET /stores/:storeId/promotions

Get store promotions.

---

## Products API

### GET /products

Get products with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| store | string | Filter by store ID |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| rating | number | Minimum rating |
| sortBy | string | Sort by: price/rating/newest/popular |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "prod_123",
        "name": "Premium T-Shirt",
        "description": "Comfortable cotton t-shirt",
        "images": ["https://example.com/tshirt.jpg"],
        "pricing": {
          "original": 999,
          "selling": 499,
          "currency": "INR"
        },
        "cashbackPercentage": 10,
        "store": {
          "id": "store_123",
          "name": "Fashion Hub",
          "logo": "https://example.com/logo.png"
        },
        "rating": 4.5,
        "reviewCount": 50,
        "stock": 100,
        "variants": [
          {
            "size": "M",
            "color": "Blue",
            "stock": 25
          }
        ],
        "metadata": {
          "isNew": true,
          "isBestSeller": false
        }
      }
    ],
    "pagination": {...}
  }
}
```

---

### GET /products/:productId

Get product details.

---

### GET /products/:productId/reviews

Get product reviews.

---

### GET /products/:productId/related

Get related products.

---

## Orders API

### GET /orders

Get user orders.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_123",
        "orderNumber": "ORD-2026-00123",
        "status": "delivered",
        "items": [
          {
            "productId": "prod_123",
            "name": "Premium T-Shirt",
            "quantity": 2,
            "price": 499,
            "cashback": 50
          }
        ],
        "subtotal": 998,
        "deliveryFee": 50,
        "discount": 100,
        "total": 948,
        "paymentMethod": "wallet",
        "store": {
          "id": "store_123",
          "name": "Fashion Hub"
        },
        "deliveryAddress": {...},
        "createdAt": "2026-05-01T10:00:00Z",
        "deliveredAt": "2026-05-03T14:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### GET /orders/:orderId

Get order details.

---

### POST /orders

Create new order.

**Request:**
```json
{
  "storeId": "store_123",
  "items": [
    {
      "productId": "prod_123",
      "quantity": 2,
      "variantId": "var_123"
    }
  ],
  "deliveryAddress": {
    "id": "addr_123"
  },
  "paymentMethod": "wallet",
  "couponCode": "SAVE20"
}
```

---

### PUT /orders/:orderId/cancel

Cancel order.

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

---

### GET /orders/:orderId/track

Track order delivery.

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "status": "out_for_delivery",
    "estimatedDelivery": "2026-05-09T18:00:00Z",
    "tracking": [
      {
        "status": "order_placed",
        "timestamp": "2026-05-08T10:00:00Z",
        "message": "Order placed successfully"
      },
      {
        "status": "confirmed",
        "timestamp": "2026-05-08T10:15:00Z",
        "message": "Order confirmed by store"
      },
      {
        "status": "preparing",
        "timestamp": "2026-05-08T11:00:00Z",
        "message": "Your order is being prepared"
      }
    ],
    "deliveryPartner": {
      "name": "John Doe",
      "phone": "+919876543210",
      "image": "https://example.com/partner.jpg"
    }
  }
}
```

---

### POST /orders/:orderId/reorder

Reorder previous order.

---

## Payments API

### GET /payments/methods

Get saved payment methods.

**Response:**
```json
{
  "success": true,
  "data": {
    "methods": [
      {
        "id": "pm_123",
        "type": "card",
        "brand": "visa",
        "last4": "4242",
        "expiryMonth": 12,
        "expiryYear": 2027,
        "isDefault": true
      },
      {
        "id": "pm_wallet",
        "type": "wallet",
        "name": "ReZ Wallet",
        "balance": 1500
      }
    ]
  }
}
```

---

### POST /payments/methods

Add payment method.

---

### DELETE /payments/methods/:methodId

Remove payment method.

---

### POST /payments/initialize

Initialize payment for order.

**Request:**
```json
{
  "orderId": "order_123",
  "method": "razorpay",
  "amount": 948
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_123",
    "amount": 948,
    "currency": "INR",
    "status": "pending",
    "razorpayOrderId": "order_raz_123",
    "checkoutUrl": "https://checkout.razorpay.com/..."
  }
}
```

---

### POST /payments/verify

Verify payment status.

**Request:**
```json
{
  "paymentId": "pay_123",
  "razorpayPaymentId": "pay_raz_456",
  "razorpaySignature": "signature_abc"
}
```

---

### GET /payments/history

Get payment history.

---

## Wallet API

### GET /wallet/balance

Get wallet balance.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "total": 1500,
      "available": 1400,
      "pending": 100,
      "currency": "INR"
    },
    "bonus": {
      "total": 50,
      "expiresAt": "2026-05-31T23:59:59Z"
    }
  }
}
```

---

### GET /wallet/transactions

Get wallet transactions.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter: credit/debit |
| source | string | Filter by source |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "txn_123",
        "type": "credit",
        "source": "order_cashback",
        "amount": 50,
        "balanceAfter": 1550,
        "description": "Cashback from order #ORD-123",
        "orderId": "order_123",
        "createdAt": "2026-05-08T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### POST /wallet/redeem-coins

Redeem coins for discount.

**Request:**
```json
{
  "amount": 100,
  "orderId": "order_123"
}
```

**Note:** Minimum redemption is 50 coins.

---

### GET /wallet/expiring

Get expiring coins.

**Response:**
```json
{
  "success": true,
  "data": {
    "expiringCoins": {
      "INR": {
        "totalAmount": 100,
        "coins": [
          {
            "id": "coin_123",
            "amount": 50,
            "expiresAt": "2026-05-15T23:59:59Z",
            "type": "cashback"
          }
        ],
        "count": 2
      }
    },
    "totalExpiring": 100
  }
}
```

---

### POST /wallet/add-money

Add money to wallet.

**Request:**
```json
{
  "amount": 500,
  "paymentMethod": "razorpay",
  "paymentId": "pay_123"
}
```

---

### GET /wallet/gift-cards

Get gift card catalog.

---

### POST /wallet/gift-cards/purchase

Purchase gift card.

**Request:**
```json
{
  "giftCardId": "gc_123",
  "amount": 500,
  "recipient": {
    "name": "Jane Doe",
    "phone": "+919876543210",
    "email": "jane@example.com"
  }
}
```

---

### POST /wallet/send-gift

Send wallet balance as gift.

**Request:**
```json
{
  "recipientId": "user_456",
  "amount": 100,
  "message": "Happy Birthday!"
}
```

---

### GET /wallet/recharge/preview

Get recharge cashback preview.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| amount | number | Recharge amount |

**Response:**
```json
{
  "success": true,
  "data": {
    "rechargeAmount": 500,
    "cashbackPercentage": 5,
    "cashback": 25,
    "maxCashback": 50,
    "cappedAt": null
  }
}
```

---

## Gamification API

### GET /gamification/checkin-config

Get daily check-in configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "dayRewards": [10, 15, 20, 25, 30, 50, 100],
    "proTips": [
      "Check in at the same time daily to build a habit",
      "Share posters daily to maximize your affiliate earnings"
    ],
    "affiliateTip": "Share posters and earn coins!",
    "reviewTimeframe": "within 24 hours",
    "isEnabled": true
  }
}
```

---

### GET /gamification/streaks

Get streak data.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "hasCheckedInToday": true,
    "lastCheckInDate": "2026-05-07T10:00:00Z",
    "weeklyEarnings": 75,
    "totalEarned": 500,
    "checkInHistory": [...]
  }
}
```

---

### POST /gamification/streak/checkin

Perform daily check-in.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "streak": 6,
    "coinsEarned": 30,
    "bonusEarned": 0,
    "totalEarned": 30,
    "message": "Check-in successful! You earned 30 coins."
  }
}
```

---

### GET /gamification/spin-wheel/data

Get spin wheel configuration.

**Response:**
```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "id": "1",
        "label": "10 Coins",
        "value": 10,
        "color": "#FF6B6B",
        "type": "coins"
      }
    ],
    "spinsRemaining": 3,
    "spinsUsedToday": 0,
    "maxDailySpins": 3,
    "nextResetAt": "2026-05-09T00:00:00Z",
    "stats": {
      "totalSpins": 50,
      "todaySpins": 0,
      "totalCoinsWon": 500,
      "todayCoinsWon": 0
    }
  }
}
```

---

### GET /gamification/spin-wheel/eligibility

Get spin eligibility.

---

### POST /gamification/spin-wheel/spin

Execute spin.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "segmentId": "3",
    "segmentLabel": "50 Coins",
    "rewardType": "coins",
    "rewardValue": 50,
    "spinsRemaining": 2,
    "message": "Congratulations! You won 50 coins!",
    "newBalance": 1550,
    "coinsAdded": 50
  }
}
```

---

### GET /gamification/spin-wheel/history

Get spin history.

---

### GET /gamification/leaderboard

Get gamification leaderboard.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Leaderboard type (spending) |
| period | string | daily/weekly/monthly/all-time |
| limit | number | Number of entries |

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "rank": 1,
        "userId": "user_456",
        "username": "TopSaver",
        "fullName": "Jane Smith",
        "coins": 5000,
        "level": 10,
        "tier": "premium",
        "achievements": 25,
        "isCurrentUser": false
      }
    ],
    "userRank": {
      "rank": 150,
      "userId": "user_123",
      "username": "You",
      "coins": 500,
      "level": 5,
      "tier": "free",
      "achievements": 8,
      "isCurrentUser": true
    }
  }
}
```

---

### GET /gamification/stats

Get gamification stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "coins": {
      "balance": 1500,
      "lifetimeEarned": 5000
    },
    "streak": {...},
    "spinWheel": {...},
    "achievements": 8,
    "level": 5
  }
}
```

---

### GET /gamification/affiliate/stats

Get affiliate stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalShares": 50,
    "appDownloads": 10,
    "purchases": 3,
    "commissionEarned": 150
  }
}
```

---

### GET /gamification/promotional-posters

Get promotional posters for sharing.

---

### POST /gamification/affiliate/submit

Submit share post for review.

**Request:**
```json
{
  "posterId": "poster_123",
  "posterTitle": "Summer Sale",
  "postUrl": "https://instagram.com/p/abc123",
  "platform": "instagram",
  "shareBonus": 50
}
```

---

### GET /gamification/reviewable-items

Get items available for review.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "item_123",
        "type": "store",
        "name": "Fashion Hub",
        "image": "https://example.com/store.jpg",
        "category": "Fashion",
        "visitDate": "2026-05-01T14:00:00Z",
        "coins": 50,
        "hasReceipt": true
      }
    ],
    "totalPending": 5,
    "potentialEarnings": 250
  }
}
```

---

### GET /gamification/play-and-earn

Get comprehensive Play & Earn data.

**Response:**
```json
{
  "success": true,
  "data": {
    "dailySpin": {
      "spinsRemaining": 3,
      "maxSpins": 3,
      "canSpin": true
    },
    "challenges": {
      "active": [...],
      "totalActive": 3,
      "completedToday": 1
    },
    "streak": {
      "type": "daily_checkin",
      "currentStreak": 5,
      "longestStreak": 12,
      "nextMilestone": { "day": 7, "coins": 100 }
    },
    "surpriseDrop": {
      "available": true,
      "coins": 25,
      "expiresAt": "2026-05-08T23:59:59Z"
    },
    "coinBalance": 1500
  }
}
```

---

### GET /gamification/bonus-opportunities

Get time-limited bonus opportunities.

---

### POST /gamification/quiz/start

Start a quiz game.

**Request:**
```json
{
  "difficulty": "easy",
  "category": "shopping"
}
```

---

### POST /gamification/quiz/:quizId/answer

Submit quiz answer.

**Request:**
```json
{
  "questionId": "q_123",
  "selectedAnswer": 2
}
```

---

### POST /gamification/surprise-drop/claim

Claim surprise coin drop.

**Request:**
```json
{
  "dropId": "drop_123"
}
```

---

## Explore API

### GET /explore/stores

Get stores for explore page.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| search | string | Search query |
| page | number | Page number |
| limit | number | Results per page |
| sortBy | string | Sort by |

**Response:**
```json
{
  "success": true,
  "data": {
    "stores": [
      {
        "id": "store_123",
        "name": "Fashion Hub",
        "category": "Fashion",
        "image": "https://example.com/store.jpg",
        "rating": 4.5,
        "reviews": 120,
        "distance": "1.5 km",
        "cashback": "15%",
        "isOpen": true,
        "badge": "Featured"
      }
    ],
    "pagination": {...}
  }
}
```

---

### GET /explore/products

Get products for explore page.

---

### GET /explore/categories

Get all categories.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat_123",
        "name": "Fashion",
        "slug": "fashion",
        "icon": "shirt",
        "image": "https://example.com/cat.jpg",
        "storeCount": 150,
        "productCount": 2500
      }
    ]
  }
}
```

---

### GET /explore/nearby

Get nearby stores.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| lat | number | Latitude |
| lng | number | Longitude |
| radius | number | Radius in km |

---

### GET /explore/stats

Get explore page stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 15000,
    "earnedToday": 250000,
    "dealsLive": 500,
    "peopleNearby": 120,
    "peopleEarnedToday": 3500
  }
}
```

---

### GET /explore/reviews

Get verified reviews.

---

## Search API

### GET /search

Global search.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query |
| type | string | Filter by type: stores/products/offers |
| page | number | Page number |
| limit | number | Results per page |

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "pizza",
    "results": {
      "stores": [...],
      "products": [...],
      "offers": [...]
    },
    "totalResults": 50,
    "suggestions": ["pizza hut", "pizza palace", "dominos pizza"]
  }
}
```

---

### GET /search/history

Get search history.

---

### DELETE /search/history

Clear search history.

---

### GET /search/trending

Get trending searches.

---

## Events API

### GET /events

Get events.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| city | string | Filter by city |
| status | string | Filter by status |
| lat | number | Latitude |
| lng | number | Longitude |
| page | number | Page number |
| limit | number | Results per page |

---

### GET /events/:eventId

Get event details.

---

### POST /events/:eventId/register

Register for event.

---

### GET /events/:eventId/attendees

Get event attendees.

---

## Reviews API

### GET /reviews

Get reviews with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| storeId | string | Filter by store |
| productId | string | Filter by product |
| rating | number | Filter by rating |
| page | number | Page number |
| limit | number | Results per page |

---

### POST /reviews

Create review.

**Request:**
```json
{
  "storeId": "store_123",
  "rating": 5,
  "title": "Great experience!",
  "content": "Loved the quality and service...",
  "images": ["https://example.com/review1.jpg"],
  "verified": true
}
```

---

### PUT /reviews/:reviewId

Update review.

---

### DELETE /reviews/:reviewId

Delete review.

---

### POST /reviews/:reviewId/like

Like a review.

---

### POST /reviews/:reviewId/report

Report a review.

---

## Analytics API

### POST /analytics/event

Track analytics event.

**Request:**
```json
{
  "event": "page_view",
  "properties": {
    "page": "homepage",
    "timestamp": "2026-05-08T10:00:00Z"
  }
}
```

---

### POST /analytics/batch

Track batch of analytics events.

**Request:**
```json
{
  "events": [
    { "event": "page_view", "properties": {...} },
    { "event": "product_view", "properties": {...} }
  ]
}
```

---

### GET /analytics/dashboard

Get user analytics dashboard.

---

## Bookings API

### GET /bookings

Get user bookings.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type |
| status | string | Filter by status |
| page | number | Page number |
| limit | number | Results per page |

---

### GET /bookings/:bookingId

Get booking details.

---

### POST /bookings/:bookingId/cancel

Cancel booking.

---

## Notifications API

### GET /notifications

Get user notifications.

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
    "notifications": [
      {
        "_id": "notif_123",
        "type": "offer",
        "title": "New Offer!",
        "body": "Get 50% off on pizza",
        "image": "https://example.com/offer.jpg",
        "data": {
          "offerId": "offer_123"
        },
        "read": false,
        "createdAt": "2026-05-08T10:00:00Z"
      }
    ],
    "pagination": {...},
    "unreadCount": 5
  }
}
```

---

### PUT /notifications/:notificationId/read

Mark notification as read.

---

### PUT /notifications/read-all

Mark all notifications as read.

---

### DELETE /notifications/:notificationId

Delete notification.

---

### PUT /notifications/settings

Update notification settings.

**Request:**
```json
{
  "push": {
    "offers": true,
    "orders": true,
    "wallet": true
  },
  "email": {
    "offers": false,
    "weekly": true
  },
  "sms": {
    "orders": true
  }
}
```

---

### POST /notifications/register-token

Register push notification token.

**Request:**
```json
{
  "token": "fcm_token_here",
  "platform": "android"
}
```

---

## Types

### Store
```typescript
interface Store {
  _id: string;
  name: string;
  description?: string;
  banner: string[];
  logo?: string;
  rating: {
    average: number;
    count: number;
  };
  cashbackRate: number;
  isOpen: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  distance?: number;
  location: {
    address: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  contact?: {
    phone?: string;
    email?: string;
  };
  categories?: Category[];
  offers?: Offer[];
}
```

### Product
```typescript
interface Product {
  _id: string;
  name: string;
  description?: string;
  images: string[];
  pricing: {
    original: number;
    selling: number;
    currency: string;
  };
  cashbackPercentage: number;
  store: {
    id: string;
    name: string;
    logo?: string;
  };
  rating: number;
  reviewCount: number;
  stock: number;
  variants?: Variant[];
  metadata: {
    isNew?: boolean;
    isBestSeller?: boolean;
    isTrending?: boolean;
  };
}
```

### Order
```typescript
interface Order {
  _id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  store: {
    id: string;
    name: string;
  };
  deliveryAddress: Address;
  createdAt: string;
  deliveredAt?: string;
}
```

### Transaction
```typescript
interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  source: 'order_cashback' | 'checkin' | 'spin' | 'referral' | 'refund' | 'redeem' | 'purchase';
  amount: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  createdAt: string;
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
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Rate Limiting

| Category | Limit |
|----------|-------|
| Authentication | 10 requests/minute |
| Read operations | 100 requests/minute |
| Write operations | 30 requests/minute |
| Search | 60 requests/minute |
| Analytics | 200 requests/minute |

---

## Caching Strategy

| Endpoint | Cache Duration |
|----------|----------------|
| Homepage | 5 minutes |
| Stores listing | 10 minutes |
| Store details | 5 minutes |
| Products | 5 minutes |
| Categories | 30 minutes |
| Search trending | 15 minutes |
| User profile | 1 minute |

---

## Pagination

All list endpoints support pagination:

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 20, max: 100) |

**Pagination Response:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Versioning

Current version: v1

All endpoints are versioned under `/api/v1`.

---

## Region Support

The API supports region-specific data. Include the region header:

```
X-Rez-Region: bangalore
```

Supported regions: `bangalore`, `delhi`, `mumbai`, `chennai`, `hyd`, `pune`, `dubai`

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import apiClient from './apiClient';

// Get stores
const response = await apiClient.get('/stores', {
  category: 'fashion',
  limit: 20
});

// Create order
const order = await apiClient.post('/orders', {
  storeId: 'store_123',
  items: [{ productId: 'prod_123', quantity: 2 }],
  paymentMethod: 'wallet'
});
```

### React Native

```typescript
import { useEffect, useState } from 'react';
import storesApi from './storesApi';

function StoresScreen() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    async function fetchStores() {
      const response = await storesApi.getStores({ category: 'fashion' });
      if (response.success) {
        setStores(response.data.stores);
      }
    }
    fetchStores();
  }, []);

  return <StoreList stores={stores} />;
}
```
