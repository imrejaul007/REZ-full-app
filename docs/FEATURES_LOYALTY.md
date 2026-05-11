# Loyalty System

## Overview

The ReZ Loyalty System is a comprehensive rewards program designed to incentivize customer retention and increase lifetime value. Users earn points on every purchase, unlock tiered benefits, and can refer friends for bonus rewards.

---

## Features

### Points System

The points system forms the foundation of our loyalty program. Every transaction contributes to a user's point balance.

#### Earning Points
- **Base earning rate**: 1 point per Rs. 10 spent
- **Bonus multipliers**: Points multiply based on tier status
- **Promotional periods**: 2x, 3x, or 5x point events announced via push notifications
- **Category bonuses**: Selected categories (e.g., dining, electronics) offer enhanced earning rates

#### Redeeming Points
- **Minimum redemption**: 100 points required to redeem
- **Conversion rate**: 10 points = Rs. 1 credit
- **Instant application**: Points applied immediately at checkout
- **Partial redemption**: Users can choose to redeem partial points

#### Points Expiry Policy
- Points expire 12 months after the date they were earned
- Users receive reminders 30 days and 7 days before point expiration
- Expired points are non-refundable and non-transferable
- Point expiry history is visible in user dashboard

### Tier System

Our tier system rewards consistent customers with progressively better benefits. Tiers are calculated based on cumulative points earned in the last 12 months.

| Tier | Points Required | Cashback | Free Delivery | Priority Support | Birthday Bonus |
|------|-----------------|----------|---------------|------------------|----------------|
| Bronze | 0 - 999 | 1% | No | No | 50 points |
| Silver | 1,000 - 2,499 | 2% | No | No | 100 points |
| Gold | 2,500 - 4,999 | 3% | Yes | No | 250 points |
| Platinum | 5,000+ | 5% | Yes | Yes | 500 points |

#### Tier Qualification Rules
- Tiers are recalculated monthly based on 12-month rolling history
- Tier downgrades occur if points fall below threshold for 2 consecutive months
- Users cannot skip tiers - must progress sequentially

#### Tier Benefits Detail

**Bronze Tier (Default)**
- 1% cashback on all purchases
- Birthday bonus: 50 points
- Access to basic rewards catalog
- Email support (48-hour response time)

**Silver Tier**
- 2% cashback on all purchases
- Birthday bonus: 100 points
- Early access to sales (24-hour early access)
- Access to silver-exclusive rewards
- Email support (24-hour response time)

**Gold Tier**
- 3% cashback on all purchases
- FREE delivery on all orders
- Birthday bonus: 250 points
- Early access to sales (48-hour early access)
- Gold-exclusive rewards catalog
- Live chat support (8-hour response time)

**Platinum Tier**
- 5% cashback on all purchases
- FREE delivery on all orders
- Priority support (2-hour response time)
- Birthday bonus: 500 points
- Access to platinum-exclusive rewards
- Exclusive platinum events and previews
- Dedicated support agent

### Referral System

The referral program encourages users to invite friends, benefiting both the referrer and the referred user.

#### How Referrals Work

1. **Get your code**: Navigate to "Refer & Earn" in the app
2. **Share**: Send your unique referral code via WhatsApp, SMS, email, or social media
3. **Friend signs up**: Your friend creates an account using your code
4. **First purchase**: Your friend completes their first order
5. **Both earn**: You receive 200 points, your friend receives 100 bonus points

#### Referral Tracking Dashboard

Users can track their referral performance in the dashboard:

```
┌─────────────────────────────────────────────────────────┐
│  Your Referral Stats                                    │
├─────────────────────────────────────────────────────────┤
│  Total Referrals:        12                             │
│  Successful Referrals:   8                              │
│  Pending Referrals:       4                             │
│  Points Earned:         1,600                           │
├─────────────────────────────────────────────────────────┤
│  Referral Code: REZA2024                               │
│  [Copy] [Share]                                       │
└─────────────────────────────────────────────────────────┘
```

#### Referral Guidelines
- Self-referrals are prohibited and will result in point forfeiture
- Referral codes are tied to individual user accounts
- Points are credited within 24 hours of qualifying purchase
- Minimum order value of Rs. 500 required for referral bonus

### Milestones

Milestone rewards celebrate customer loyalty at key order counts. These are one-time bonuses that auto-apply to the qualifying order.

| Milestone | Reward | Description |
|-----------|--------|-------------|
| 5th Order | 50 bonus points | "Getting Started" reward |
| 10th Order | 100 bonus points | "Regular Customer" badge |
| 25th Order | 250 bonus points | "Loyal Customer" badge |
| 50th Order | 500 bonus points | "Dedicated Fan" badge + exclusive coupon |
| 100th Order | 10% off next order | "Century Club" badge + exclusive 10% coupon |
| 250th Order | 15% off + free delivery | "Super Fan" badge |
| 500th Order | 20% off + free delivery + 1000 bonus points | "Legend" badge |

#### Milestone Display
- Unlocked milestones appear as achievement badges on user profile
- Current milestone progress shown on home screen
- Push notification sent when milestone is approaching (within 5 orders)

---

## User Guide

### Accessing Loyalty Features

1. Open the ReZ app
2. Navigate to "Rewards" tab at the bottom navigation
3. View your points balance, tier status, and available rewards

### Checking Your Points

```
┌────────────────────────────────────────┐
│  Available Points        Tier: Gold    │
│  ┌──────────────────────────────────┐  │
│  │         3,247 points             │  │
│  │   Worth approximately Rs. 324    │  │
│  └──────────────────────────────────┘  │
│  Points expiring in 30 days: 500      │
└────────────────────────────────────────┘
```

### Redeeming Points at Checkout

1. Add items to your cart
2. Proceed to checkout
3. Toggle "Use Rewards Points" switch
4. Adjust points to redeem (minimum 100)
5. See instant savings applied to total
6. Complete payment

### Viewing Tier Benefits

1. Go to "Rewards" > "My Tier"
2. View current tier and benefits
3. See progress to next tier
4. Preview next tier benefits

---

## Screenshots

### Points Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  ≡   My Rewards                           🔔  👤        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  Points Balance                                 │   │
│   │  3,247  |  ~Rs. 324 value                      │   │
│   │  Tier: Gold  ★  ★  ★                          │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   Progress to Platinum (5,000 pts needed)              │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 62%     │
│                                                         │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│   │  Refer &    │ │  Rewards    │ │  Points    │       │
│   │  Earn       │ │  History    │ │  Expiry    │       │
│   │  🎁        │ │  📜        │ │  ⏰        │       │
│   └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│   Available Rewards                                     │
│   ┌─────────────────────────────────────────────────┐   │
│   │  🎟️  Rs. 50 OFF     |  500 pts  |  [Redeem]  │   │
│   ├─────────────────────────────────────────────────┤   │
│   │  🚚  Free Delivery  |  200 pts  |  [Redeem]  │   │
│   ├─────────────────────────────────────────────────┤   │
│   │  ☕  Free Coffee    |  300 pts  |  [Redeem]  │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Tier Progression Screen
```
┌─────────────────────────────────────────────────────────┐
│  <  My Tier                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Current: Gold                                          │
│  ★ ★ ★                                                  │
│                                                         │
│  ═══════════════════════════════════════════════════    │
│  Bronze ──●─────────── Silver ──●────────── Gold ──●── │
│  0       1000         2500         5000  Platinum      │
│                                                         │
│  Your Progress: 3,247 / 5,000                          │
│  Distance to Platinum: 1,753 more points                │
│  Estimated: ~3 months at current rate                   │
│                                                         │
│  ═══════════════════════════════════════════════════    │
│                                                         │
│  GOLD BENEFITS                                          │
│  ✓ 3% Cashback on all purchases                        │
│  ✓ Free delivery on all orders                         │
│  ✓ 48-hour early access to sales                       │
│  ✓ Gold-exclusive rewards catalog                      │
│  ✓ Live chat support (8-hour response)                 │
│                                                         │
│  NEXT TIER: PLATINUM                                    │
│  Additional benefits at Platinum:                       │
│  + Priority support (2-hour response)                   │
│  + 5% Cashback                                          │
│  + Exclusive platinum events                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Points Calculation Formula

```
points_earned = floor(order_total / 10) * tier_multiplier

tier_multipliers = {
    "bronze": 1.0,
    "silver": 1.25,
    "gold": 1.5,
    "platinum": 2.0
}
```

### Points Expiry Cron Job

```javascript
// Runs daily at midnight
// Marks points older than 365 days as expired
const expireOldPoints = async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365);

    const result = await db.points.updateMany(
        {
            userId: { $exists: true },
            earnedDate: { $lt: cutoffDate },
            status: 'active'
        },
        {
            $set: { status: 'expired' }
        }
    );

    // Send notifications for points about to expire
    await sendExpiryReminders();
};
```

### Tier Recalculation Job

```javascript
// Runs monthly on the 1st at 2:00 AM
const recalculateAllTiers = async () => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const users = await db.users.find({}).toArray();

    for (const user of users) {
        const totalPoints = await db.points.aggregate([
            { $match: {
                userId: user._id,
                earnedDate: { $gte: twelveMonthsAgo },
                status: 'active'
            }},
            { $group: { _id: null, total: { $sum: 'amount' } } }
        ]);

        const points = totalPoints[0]?.total || 0;
        const newTier = calculateTier(points);

        if (newTier !== user.loyaltyTier) {
            await db.users.updateOne(
                { _id: user._id },
                {
                    $set: {
                        loyaltyTier: newTier,
                        tierUpdatedAt: new Date()
                    }
                }
            );

            // Send tier change notification
            await sendTierChangeNotification(user, newTier);
        }
    }
};
```

---

## API Reference

### GET /api/loyalty/points
Returns user's current points balance and history.

**Response:**
```json
{
    "availablePoints": 3247,
    "pendingPoints": 200,
    "lifetimePoints": 15420,
    "pointsExpiringSoon": {
        "amount": 500,
        "expiryDate": "2024-06-15"
    },
    "tier": {
        "name": "Gold",
        "multiplier": 1.5,
        "benefits": ["freeDelivery", "cashback3Percent"]
    }
}
```

### GET /api/loyalty/history
Returns paginated points transaction history.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `type` (string): Filter by type (earned, redeemed, expired, bonus)

### POST /api/loyalty/redeem
Redeem points for a reward.

**Request:**
```json
{
    "rewardId": "reward_abc123",
    "pointsToRedeem": 500
}
```

### GET /api/loyalty/tier
Returns current tier information and progress.

### GET /api/referrals
Returns referral statistics and generates shareable code.

---

## Troubleshooting

### Points Not Credited
1. Wait 5 minutes for processing
2. Check if order was completed (not just added to cart)
3. Verify order meets minimum point-earning threshold (Rs. 10)
4. Contact support with order ID if issue persists

### Tier Not Updating
1. Tiers recalculate monthly (1st of each month)
2. Points must be earned in the last 12 months
3. Expired points don't count toward tier
4. Contact support for manual review if discrepancy > 100 points

### Referral Code Not Working
1. Ensure friend enters code during sign-up (not after)
2. Code is case-sensitive
3. Each code can only be used once
4. Self-referrals are blocked automatically

---

## Support

- **In-app chat**: Available 9 AM - 9 PM IST
- **Email**: loyalty@rezapp.com
- **FAQ**: Available in Help Center
- **Response time**: Based on tier (2-48 hours)
