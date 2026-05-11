# Event Catalog

Complete reference for all events in the REZ Loyalty System.

---

## Event Overview

Events follow a standardized format and are published via Redis pub/sub:

```typescript
interface Event<T = unknown> {
  event_id: string;       // UUID
  event_type: string;     // e.g., "order.completed"
  correlation_id?: string; // For tracing
  idempotency_key?: string; // Deduplication
  timestamp: string;       // ISO 8601
  source: string;          // Service name
  data: T;
}
```

---

## Commerce Events

### order.placed

Published when a new order is created.

**Published by:** Order Service
**Handlers:** Loyalty, Cashback, Gamification, Streak, Analytics

```typescript
interface OrderPlacedEvent {
  event_id: string;
  event_type: 'order.placed';
  timestamp: string;
  source: 'order-service';
  data: {
    orderId: string;
    userId: string;
    merchantId: string;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
      category: string;
    }>;
    totals: {
      subtotal: number;
      tax: number;
      delivery: number;
      discount: number;
      total: number;
    };
    fulfillmentType: 'delivery' | 'pickup' | 'dine_in' | 'drive_thru';
    paymentMethod: 'wallet' | 'card' | 'upi' | 'cod';
    couponCode?: string;
  };
}
```

**Example:**
```json
{
  "event_id": "evt_abc123",
  "event_type": "order.placed",
  "correlation_id": "ord_xyz789",
  "timestamp": "2026-05-08T10:30:00.000Z",
  "source": "order-service",
  "data": {
    "orderId": "ord_xyz789",
    "userId": "user123",
    "merchantId": "merchant456",
    "items": [
      {
        "productId": "prod_001",
        "name": "Margherita Pizza",
        "quantity": 2,
        "price": 299,
        "category": "pizza"
      }
    ],
    "totals": {
      "subtotal": 598,
      "tax": 53.82,
      "delivery": 40,
      "discount": 0,
      "total": 691.82
    },
    "fulfillmentType": "delivery",
    "paymentMethod": "wallet"
  }
}
```

---

### order.confirmed

Published when order is confirmed by merchant.

**Published by:** Order Service
**Handlers:** Notification, Analytics

```typescript
interface OrderConfirmedEvent {
  event_type: 'order.confirmed';
  data: {
    orderId: string;
    userId: string;
    merchantId: string;
    estimatedDeliveryTime?: string;
    confirmedAt: string;
  };
}
```

---

### order.preparing

Published when merchant starts preparing the order.

**Published by:** Order Service
**Handlers:** Notification, Analytics

```typescript
interface OrderPreparingEvent {
  event_type: 'order.preparing';
  data: {
    orderId: string;
    userId: string;
    estimatedReadyTime: string;
  };
}
```

---

### order.ready

Published when order is ready for pickup/delivery.

**Published by:** Order Service
**Handlers:** Notification, Delivery, Analytics

```typescript
interface OrderReadyEvent {
  event_type: 'order.ready';
  data: {
    orderId: string;
    userId: string;
    readyAt: string;
    pickupCode?: string;
  };
}
```

---

### order.delivered

Published when order is successfully delivered.

**Published by:** Order Service
**Handlers:** Loyalty, Cashback, Gamification, Streak, Intent, Analytics

```typescript
interface OrderDeliveredEvent {
  event_type: 'order.delivered';
  data: {
    orderId: string;
    userId: string;
    merchantId: string;
    deliveredAt: string;
    rating?: number;
    feedback?: string;
  };
}
```

---

### order.cancelled

Published when order is cancelled.

**Published by:** Order Service
**Handlers:** Loyalty, Cashback, Gamification, Notification, Analytics

```typescript
interface OrderCancelledEvent {
  event_type: 'order.cancelled';
  data: {
    orderId: string;
    userId: string;
    merchantId: string;
    reason: 'user_request' | 'merchant_unavailable' | 'payment_failed' | 'out_of_stock' | 'delivery_failed';
    cancelledBy: 'user' | 'merchant' | 'system';
    refundAmount: number;
    pointsReversed: number;
    cancelledAt: string;
  };
}
```

---

### order.completed

Published when order lifecycle is complete (alias for delivered).

**Published by:** Order Service
**Handlers:** All loyalty and analytics services

```typescript
type OrderCompletedEvent = OrderDeliveredEvent;
```

---

## Payment Events

### payment.initiated

Published when payment process starts.

**Published by:** Payment Service
**Handlers:** Order, Analytics

```typescript
interface PaymentInitiatedEvent {
  event_type: 'payment.initiated';
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    currency: 'INR';
    method: 'wallet' | 'card' | 'upi' | 'razorpay';
    status: 'pending';
  };
}
```

---

### payment.success

Published when payment is successfully processed.

**Published by:** Payment Service
**Handlers:** Order, Loyalty, Cashback, Wallet, Analytics

```typescript
interface PaymentSuccessEvent {
  event_type: 'payment.success';
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    method: 'wallet' | 'card' | 'upi' | 'razorpay';
    transactionId?: string;
    razorpayPaymentId?: string;
    status: 'paid';
    paidAt: string;
  };
}
```

---

### payment.failed

Published when payment fails.

**Published by:** Payment Service
**Handlers:** Order, Notification, Analytics

```typescript
interface PaymentFailedEvent {
  event_type: 'payment.failed';
  data: {
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    reason: string;
    errorCode: string;
    status: 'failed';
    failedAt: string;
  };
}
```

---

### refund.initiated

Published when refund is initiated.

**Published by:** Payment Service
**Handlers:** Order, Cashback, Analytics

```typescript
interface RefundInitiatedEvent {
  event_type: 'refund.initiated';
  data: {
    refundId: string;
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    reason: string;
    method: 'original' | 'wallet';
    status: 'pending';
    initiatedAt: string;
  };
}
```

---

### refund.completed

Published when refund is processed.

**Published by:** Payment Service
**Handlers:** Order, Wallet, Notification, Analytics

```typescript
interface RefundCompletedEvent {
  event_type: 'refund.completed';
  data: {
    refundId: string;
    paymentId: string;
    orderId: string;
    userId: string;
    amount: number;
    method: 'original' | 'wallet';
    status: 'completed';
    completedAt: string;
  };
}
```

---

## Loyalty Events

### loyalty.points.earned

Published when loyalty points are credited.

**Published by:** Loyalty Service
**Handlers:** Wallet, Notification, Analytics

```typescript
interface LoyaltyPointsEarnedEvent {
  event_type: 'loyalty.points.earned';
  data: {
    userId: string;
    points: number;
    source: 'order' | 'promotion' | 'referral' | 'milestone' | 'tier_bonus';
    sourceId?: string;
    orderId?: string;
    reason: string;
    newBalance: number;
    earnedAt: string;
  };
}
```

**Example:**
```json
{
  "event_type": "loyalty.points.earned",
  "data": {
    "userId": "user123",
    "points": 692,
    "source": "order",
    "sourceId": "ord_xyz789",
    "orderId": "ord_xyz789",
    "reason": "Points earned on order ord_xyz789",
    "newBalance": 5692,
    "earnedAt": "2026-05-08T10:35:00.000Z"
  }
}
```

---

### loyalty.points.redeemed

Published when points are redeemed.

**Published by:** Loyalty Service
**Handlers:** Wallet, Order, Notification, Analytics

```typescript
interface LoyaltyPointsRedeemedEvent {
  event_type: 'loyalty.points.redeemed';
  data: {
    userId: string;
    points: number;
    orderId?: string;
    rewardId?: string;
    reason: string;
    newBalance: number;
    redeemedAt: string;
  };
}
```

---

### loyalty.points.expired

Published when points expire (annual expiry).

**Published by:** Loyalty Service
**Handlers:** Notification, Analytics

```typescript
interface LoyaltyPointsExpiredEvent {
  event_type: 'loyalty.points.expired';
  data: {
    userId: string;
    points: number;
    reason: 'annual_expiry';
    expiredAt: string;
  };
}
```

---

### loyalty.tier.upgraded

Published when user tier is upgraded.

**Published by:** Loyalty Service
**Handlers:** Profile Aggregator, Notification, Analytics

```typescript
interface LoyaltyTierUpgradedEvent {
  event_type: 'loyalty.tier.upgraded';
  data: {
    userId: string;
    previousTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    newTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    bonusPoints: number;
    benefits: string[];
    upgradedAt: string;
  };
}
```

---

### loyalty.tier.downgraded

Published when user tier is downgraded.

**Published by:** Loyalty Service
**Handlers:** Profile Aggregator, Notification, Analytics

```typescript
interface LoyaltyTierDowngradedEvent {
  event_type: 'loyalty.tier.downgraded';
  data: {
    userId: string;
    previousTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    newTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    effectiveDate: string;
    downgradedAt: string;
  };
}
```

---

### loyalty.milestone.reached

Published when user reaches a milestone.

**Published by:** Loyalty Service
**Handlers:** Notification, Analytics

```typescript
interface LoyaltyMilestoneReachedEvent {
  event_type: 'loyalty.milestone.reached';
  data: {
    userId: string;
    milestone: {
      id: string;
      name: string;
      type: 'points' | 'orders' | 'days' | 'spend';
    };
    progress: number;
    target: number;
    bonus: {
      points?: number;
      cashback?: number;
      perks?: string[];
    };
    reachedAt: string;
  };
}
```

---

## Cashback Events

### cashback.earned

Published when cashback is credited.

**Published by:** Cashback Service
**Handlers:** Wallet, Notification, Analytics

```typescript
interface CashbackEarnedEvent {
  event_type: 'cashback.earned';
  data: {
    userId: string;
    amount: number;
    orderId: string;
    calculation: {
      baseRate: number;
      tierMultiplier: number;
      finalRate: number;
    };
    newBalance: number;
    earnedAt: string;
  };
}
```

---

### cashback.redeemed

Published when cashback is redeemed.

**Published by:** Cashback Service
**Handlers:** Wallet, Order, Analytics

```typescript
interface CashbackRedeemedEvent {
  event_type: 'cashback.redeemed';
  data: {
    userId: string;
    amount: number;
    orderId: string;
    newBalance: number;
    redeemedAt: string;
  };
}
```

---

### cashback.expired

Published when cashback expires.

**Published by:** Cashback Service
**Handlers:** Notification, Analytics

```typescript
interface CashbackExpiredEvent {
  event_type: 'cashback.expired';
  data: {
    userId: string;
    amount: number;
    reason: '90_day_expiry';
    expiredAt: string;
  };
}
```

---

## Gamification Events

### karma.earned

Published when karma points are awarded.

**Published by:** Gamification Service
**Handlers:** Karma Bridge, Analytics

```typescript
interface KarmaEarnedEvent {
  event_type: 'karma.earned';
  data: {
    userId: string;
    amount: number;
    action: 'review' | 'referral' | 'daily_login' | 'share' | 'checkin' | 'survey';
    sourceId?: string;
    multiplier?: number;
    newBalance: number;
    earnedAt: string;
  };
}
```

---

### karma.milestone.reached

Published when user reaches a karma milestone.

**Published by:** Gamification Service
**Handlers:** Notification, Analytics

```typescript
interface KarmaMilestoneReachedEvent {
  event_type: "karma.milestone.reached";
  data: {
    userId: string;
    milestone: {
      id: string;
      name: string;
      threshold: number;
    };
    rewards?: string[];
    reachedAt: string;
  };
}
```

---

### achievement.unlocked

Published when user unlocks an achievement.

**Published by:** Gamification Service
**Handlers:** Notification, Analytics

```typescript
interface AchievementUnlockedEvent {
  event_type: 'achievement.unlocked';
  data: {
    userId: string;
    achievement: {
      id: string;
      name: string;
      description: string;
      icon: string;
    };
    unlockedAt: string;
  };
}
```

---

## Streak Events

### streak.continued

Published when user maintains their streak.

**Published by:** Streak Service
**Handlers:** Loyalty, Analytics

```typescript
interface StreakContinuedEvent {
  event_type: 'streak.continued';
  data: {
    userId: string;
    currentStreak: number;
    longestStreak: number;
    action: string;
    continuedAt: string;
  };
}
```

---

### streak.broken

Published when user's streak is broken.

**Published by:** Streak Service
**Handlers:** Notification, Analytics

```typescript
interface StreakBrokenEvent {
  event_type: 'streak.broken';
  data: {
    userId: string;
    lastStreak: number;
    brokenAt: string;
  };
}
```

---

### streak.milestone.reached

Published when user reaches a streak milestone.

**Published by:** Streak Service
**Handlers:** Loyalty, Notification, Analytics

```typescript
interface StreakMilestoneReachedEvent {
  event_type: 'streak.milestone.reached';
  data: {
    userId: string;
    milestone: {
      days: number;
      name: string;
    };
    bonus: {
      points?: number;
      cashbackBoost?: number;
      perks?: string[];
    };
    reachedAt: string;
  };
}
```

---

## Intent Events

### intent.captured

Published when user intent is captured.

**Published by:** Intent Service
**Handlers:** Analytics

```typescript
interface IntentCapturedEvent {
  event_type: 'intent.captured';
  data: {
    userId: string;
    appType: string;
    eventType: string;
    category: string;
    intentKey: string;
    confidence: number;
    capturedAt: string;
  };
}
```

---

### intent.dormant

Published when intent becomes dormant.

**Published by:** Intent Service
**Handlers:** Decision, Analytics

```typescript
interface IntentDormantEvent {
  event_type: 'intent.dormant';
  data: {
    intentId: string;
    userId: string;
    intentKey: string;
    daysDormant: number;
    revivalScore: number;
    dormantAt: string;
  };
}
```

---

### intent.revived

Published when dormant intent is revived.

**Published by:** Intent Service
**Handlers:** Analytics

```typescript
interface IntentRevivedEvent {
  event_type: 'intent.revived';
  data: {
    intentId: string;
    userId: string;
    trigger: 'nudge_click' | 'organic' | 'search';
    revivedAt: string;
  };
}
```

---

## Nudge Events

### nudge.sent

Published when nudge is sent to user.

**Published by:** Notification Service
**Handlers:** Analytics

```typescript
interface NudgeSentEvent {
  event_type: 'nudge.sent';
  data: {
    nudgeId: string;
    userId: string;
    channel: 'push' | 'email' | 'sms' | 'in_app';
    template: string;
    intentKey?: string;
    sentAt: string;
  };
}
```

---

### nudge.delivered

Published when nudge is successfully delivered.

**Published by:** Notification Service
**Handlers:** Analytics

```typescript
interface NudgeDeliveredEvent {
  event_type: 'nudge.delivered';
  data: {
    nudgeId: string;
    userId: string;
    channel: 'push' | 'email' | 'sms' | 'in_app';
    deliveredAt: string;
  };
}
```

---

### nudge.clicked

Published when user clicks on nudge.

**Published by:** Notification Service
**Handlers:** Intent, Analytics

```typescript
interface NudgeClickedEvent {
  event_type: 'nudge.clicked';
  data: {
    nudgeId: string;
    userId: string;
    clickedAt: string;
  };
}
```

---

### nudge.converted

Published when nudge leads to conversion.

**Published by:** Notification Service
**Handlers:** Attribution, Analytics

```typescript
interface NudgeConvertedEvent {
  event_type: 'nudge.converted';
  data: {
    nudgeId: string;
    userId: string;
    orderId?: string;
    revenue: number;
    conversionValue: number;
    convertedAt: string;
  };
}
```

---

## User Events

### user.created

Published when new user registers.

**Published by:** Auth Service
**Handlers:** Profile Aggregator, Loyalty, Gamification, Analytics

```typescript
interface UserCreatedEvent {
  event_type: 'user.created';
  data: {
    userId: string;
    email?: string;
    phone: string;
    source: 'organic' | 'referral' | 'campaign';
    referrerId?: string;
    createdAt: string;
  };
}
```

---

### user.segment.changed

Published when user segment changes.

**Published by:** Decision Service
**Handlers:** Profile Aggregator, Notification, Analytics

```typescript
interface UserSegmentChangedEvent {
  event_type: 'user.segment.changed';
  data: {
    userId: string;
    previousSegments: string[];
    newSegments: string[];
    reason: string;
    changedAt: string;
  };
}
```

---

## Event Quick Reference

| Event Type | Category | Published By | Key Handlers |
|------------|----------|--------------|--------------|
| `order.placed` | Commerce | Order Service | Loyalty, Cashback |
| `order.confirmed` | Commerce | Order Service | Notification |
| `order.preparing` | Commerce | Order Service | Notification |
| `order.ready` | Commerce | Order Service | Notification |
| `order.delivered` | Commerce | Order Service | All loyalty services |
| `order.cancelled` | Commerce | Order Service | Loyalty, Cashback, Notification |
| `payment.success` | Payment | Payment Service | Order, Loyalty, Wallet |
| `payment.failed` | Payment | Payment Service | Order, Notification |
| `refund.initiated` | Payment | Payment Service | Order, Cashback |
| `refund.completed` | Payment | Payment Service | Order, Wallet |
| `loyalty.points.earned` | Loyalty | Loyalty Service | Wallet, Notification |
| `loyalty.points.redeemed` | Loyalty | Loyalty Service | Wallet, Order |
| `loyalty.tier.upgraded` | Loyalty | Loyalty Service | Profile, Notification |
| `cashback.earned` | Cashback | Cashback Service | Wallet, Notification |
| `cashback.redeemed` | Cashback | Cashback Service | Wallet, Order |
| `karma.earned` | Gamification | Gamification | Karma Bridge |
| `achievement.unlocked` | Gamification | Gamification | Notification |
| `streak.continued` | Gamification | Streak Service | Loyalty |
| `streak.milestone.reached` | Gamification | Streak Service | Loyalty, Notification |
| `intent.captured` | Intent | Intent Service | Analytics |
| `intent.dormant` | Intent | Intent Service | Decision |
| `nudge.sent` | Engagement | Notification | Analytics |
| `nudge.clicked` | Engagement | Notification | Intent, Analytics |
| `nudge.converted` | Engagement | Notification | Attribution, Analytics |

---

*For REE decision rules, see [DECISIONS.md](DECISIONS.md)*
*For API documentation, see [API_REFERENCE.md](API_REFERENCE.md)*
