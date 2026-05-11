# Marketing Features

## Overview

ReZ's Marketing Suite provides a comprehensive set of tools for promoting products, engaging customers, and driving conversions. The suite includes promotional campaigns, push notifications, personalized recommendations, and affiliate programs.

---

## Features

### Promotional Campaigns

ReZ supports multiple types of promotional campaigns to drive user engagement and increase order frequency.

#### Campaign Types

| Campaign Type | Description | Best For |
|--------------|-------------|----------|
| Percentage Off | Discounts based on % of order value | Clearance, sales events |
| Fixed Amount Off | Flat discount on orders | New user acquisition |
| Buy X Get Y | Free items on qualifying purchases | Inventory clearance, bundles |
| Free Delivery | Waived delivery fees | Conversion optimization |
| First Order Discount | Special offer for new users | Acquisition |
| Bulk Discount | Tiered discounts based on quantity | B2B, wholesale |
| Time-Limited Flash Sales | Short-duration deep discounts | Urgency creation |
| Category-Specific | Discounts on selected categories | Category growth |

#### Campaign Configuration

```
┌─────────────────────────────────────────────────────────┐
│  Create New Campaign                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Campaign Name: [Flash Weekend Sale              ]      │
│                                                         │
│  Campaign Type: [Percentage Off              ▼]        │
│                                                         │
│  Discount Value: [25           ] [%]                    │
│                                                         │
│  Minimum Order Value: [Rs. 500             ]           │
│                                                         │
│  Maximum Discount: [Rs. 200            ]                │
│                                                         │
│  Valid From: [May 10, 2024   ] [📅]                     │
│  Valid To:   [May 12, 2024   ] [📅]                     │
│                                                         │
│  Target Audience:                                       │
│  ○ All Users                                            │
│  ○ New Users Only                                       │
│  ○ Returning Users                                      │
│  ○ Specific Segment: [Select ▼]                        │
│                                                         │
│  Usage Limits:                                          │
│  Per User: [1    ] time(s)                              │
│  Total Uses: [Unlimited ▼]                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📱 Preview How Users See This                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  🎉 FLASH SALE!                         │    │   │
│  │  │  25% OFF sitewide                       │    │   │
│  │  │  Use code: FLASH25                      │    │   │
│  │  │  Ends May 12!                           │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Save Draft]  [Schedule Campaign]  [Launch Now]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Campaign Scheduling

- Schedule campaigns up to 30 days in advance
- Set start and end times with timezone awareness
- Auto-activate at scheduled time
- Auto-deactivate when campaign ends
- Option to extend campaign duration

### Push Notifications

Targeted push notifications to re-engage users and drive actions.

#### Notification Types

| Type | Trigger | Purpose |
|------|---------|---------|
| Welcome | New user signup | Onboarding |
| Order Confirmed | Payment successful | Confirmation |
| Order Delivered | Delivery completed | Status update |
| Cart Abandoned | 1 hour after cart abandonment | Recovery |
| Price Drop | Item in wishlist reduced | Engagement |
| Back in Stock | Out-of-stock item restocked | Re-engagement |
| Promotional | Campaign launch | Conversion |
| Re-engagement | 7 days inactive | Retention |
| Milestone | Order count achieved | Celebration |

#### Notification Personalization

```javascript
// Notification personalization tokens
const notificationTemplates = {
    cartAbandoned: {
        title: "Forgot something, {userName}?",
        body: "Your cart is waiting! Complete your order and get {discount}% off.",
        image: "{cartPreviewImage}",
        deepLink: "/cart",
        ctaButtons: [
            { text: "Complete Order", action: "checkout" },
            { text: "View Cart", action: "cart" }
        ]
    },
    priceDrop: {
        title: "Price Drop Alert!",
        body: "{itemName} is now {newPrice} (was {oldPrice}). Save {savings}!",
        image: "{itemImage}",
        deepLink: "/product/{itemId}",
        ctaButtons: [
            { text: "Buy Now", action: "buy" },
            { text: "View Details", action: "view" }
        ]
    }
};
```

#### Notification Scheduling

- Send immediately (real-time)
- Schedule for specific date/time
- Send at optimal time (AI-determined)
- A/B test different messages
- Frequency capping (max 3 per day per user)

### Coupon Management

Create and manage promotional codes with flexible configurations.

#### Coupon Types

| Type | Code Format | Example |
|------|-------------|---------|
| Public | ALLCAPS | SUMMER2024 |
| Private | Prefix + random | REZA8X2M |
| Single-use | Auto-generated | Generated per user |
| Multi-use | Standard format | SAVE20 |
| Referrer | REFXXXXXX | REFABC123 |

#### Coupon Configuration

```
┌─────────────────────────────────────────────────────────┐
│  Coupon Configuration                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Coupon Code: [SUMMER20                          ]     │
│  (Leave blank for auto-generate)                        │
│                                                         │
│  Discount Type: [Percentage Off              ▼]         │
│  Value: [20                       ] [%]                  │
│                                                         │
│  Restrictions:                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Minimum Order Value:     [Rs. 300         ]     │   │
│  │  Maximum Discount Amount: [Rs. 100         ]     │   │
│  │  Applicable Categories:   [Select ▼]            │   │
│  │  Applicable Products:     [Select ▼]            │   │
│  │  New Users Only:          [✓]                     │   │
│  │  First Order Only:        [✓]                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Usage Limits:                                          │
│  Per User:     [1    ] time(s)                          │
│  Total Uses:   [1000 ]                                  │
│  Current Uses: 247                                      │
│                                                         │
│  Validity:                                             │
│  Valid From: [May 1, 2024   ]                           │
│  Valid To:   [May 31, 2024  ]                           │
│                                                         │
│  Status: Active                                        │
│                                                         │
│  [Save Changes]  [Deactivate]  [View Analytics]        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Personalized Recommendations

AI-powered product recommendations to increase average order value.

#### Recommendation Engine

| Algorithm | Use Case | Placement |
|-----------|----------|-----------|
| Collaborative Filtering | "Users who bought this also bought..." | Product page, Cart |
| Content-Based | "Similar items you might like" | Home, Category pages |
| Personalized Ranking | "Recommended for you" | Home feed, Email |
| Trending | "Popular in your area" | Discovery sections |
| Frequently Bought Together | Bundling suggestions | Product page, Cart |
| Recently Viewed | "Viewed earlier" | Home, Category pages |

#### Recommendation Display

```
┌─────────────────────────────────────────────────────────┐
│  Recommended For You                                    │
│  Based on your browsing history and preferences         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  ┌───┐  │  │  ┌───┐  │  │  ┌───┐  │  │  ┌───┐  │     │
│  │  │   │  │  │  │   │  │  │  │   │  │  │  │   │  │     │
│  │  └───┘  │  │  └───┘  │  │  └───┘  │  │  └───┘  │     │
│  │Product 1│  │Product 2│  │Product 3│  │Product 4│     │
│  │ Rs.299  │  │ Rs.449  │  │ Rs.199  │  │ Rs.599  │     │
│  │ 4.2★    │  │ 4.8★    │  │ 4.5★    │  │ 4.1★    │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💡 Frequently Bought Together                   │   │
│  │                                                  │   │
│  │  [Current Product] + [Accessory] = Save 15%    │   │
│  │  [Add Bundle to Cart - Rs. 449]                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Affiliate Program

Partner with influencers and affiliates to drive new user acquisition.

#### Affiliate Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Affiliate Dashboard                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Your Affiliate Link                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  https://rezapp.com/ref/REZA8X2M                │   │
│  │  [📋 Copy]  [📤 Share]  [📱 SMS]               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PERFORMANCE SUMMARY                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                                         │
│  Link Clicks:     1,247      Conversions:  89           │
│  Conversion Rate: 7.1%       Revenue:     Rs. 45,230   │
│                                                         │
│  COMMISSION EARNINGS                                     │
│  ───────────────────────────────────────────────────   │
│  Base Commission:  Rs. 4,523                            │
│  Bonus Commission: Rs. 1,200 (10+ conversions)          │
│  TOTAL EARNINGS:   Rs. 5,723                            │
│                                                         │
│  Pending Payout: Rs. 5,723                              │
│  [Request Payout]                                       │
│                                                         │
│  COMMISSION STRUCTURE                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Conversions    Commission    Bonus              │   │
│  │  1-9           10%          -                   │   │
│  │  10-49         12%          Rs. 500             │   │
│  │  50-99         15%          Rs. 2,000           │   │
│  │  100+          20%          Rs. 5,000           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Affiliate Tools

| Tool | Description |
|------|-------------|
| Link Generator | Create tracking links for specific products/categories |
| Banner Ads | Pre-designed promotional banners |
| Deep Links | Direct links to specific products |
| QR Codes | Generate QR codes for offline promotion |
| Content Widgets | Embeddable product carousels |
| Performance API | Real-time commission tracking |

### Email Marketing

Integrated email campaigns with personalization and automation.

#### Email Campaign Types

| Campaign | Frequency | Purpose |
|----------|-----------|---------|
| Welcome Series | 3 emails over 7 days | Onboarding |
| Abandoned Cart | 3 emails over 48 hours | Recovery |
| Post-Purchase | 2 emails over 14 days | Engagement |
| Win-Back | Triggered after 30 days inactive | Retention |
| Newsletter | Weekly | Brand connection |
| Promotional | As scheduled | Conversion |

#### Email Personalization

```
┌─────────────────────────────────────────────────────────┐
│  Email Personalization Tokens                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Basic:                                                 │
│  {firstName}        - User's first name                 │
│  {lastName}         - User's last name                  │
│  {email}            - User's email address              │
│                                                         │
│  Purchase History:                                      │
│  {lastOrderDate}    - Last order date                   │
│  {lastOrderAmount}  - Last order value                  │
│  {totalOrders}      - Total order count                 │
│  {favoriteCategory} - Most purchased category          │
│                                                         │
│  Behavioral:                                            │
│  {viewedProducts}   - Recently viewed items             │
│  {wishlistItems}    - Wishlist contents                 │
│  {abandonedCart}    - Cart contents                     │
│  {recommendedProducts} - AI recommendations            │
│                                                         │
│  Dynamic Content:                                       │
│  {if VIP}           - Show VIP content                  │
│  {if birthday}      - Show birthday offer               │
│  {if location}      - Location-specific content         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Loyalty Program Marketing

Integrated marketing tools for the loyalty program.

#### Tier-Based Marketing

| Message Type | Bronze | Silver | Gold | Platinum |
|--------------|--------|--------|------|----------|
| Tier upgrade email | Yes | Yes | Yes | Yes |
| Exclusive offers | No | Yes | Yes | Yes |
| Early access | No | 24hr | 48hr | 72hr |
| VIP events | No | No | Yes | Yes |
| Personal manager | No | No | No | Yes |

#### Points Marketing

- Points expiration reminders (30 days, 7 days, 1 day)
- Tier upgrade notifications
- Milestone achievement celebrations
- Points redemption reminders
- Bonus points promotions

### Social Media Integration

Connect marketing efforts with social platforms.

#### Social Features

| Feature | Platforms | Description |
|---------|-----------|-------------|
| Share to Earn | All major platforms | Share products and earn points |
| Social Login | Google, Facebook, Apple | Easy signup/login |
| Product Reviews | Integrated | Customer review display |
| Wishlist Sharing | WhatsApp, Email | Share wishlists with friends |
| Order Sharing | All platforms | Celebrate purchases |

#### Social Sharing Campaign

```
┌─────────────────────────────────────────────────────────┐
│  Share & Earn Campaign                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Campaign: Spring Collection Launch                     │
│  Duration: May 1-15, 2024                               │
│                                                         │
│  How It Works:                                          │
│  1. Share any product on social media                  │
│  2. Use hashtag #ReZSpring                              │
│  3. Get 50 bonus points per share                       │
│  4. Extra 200 points if friend purchases!              │
│                                                         │
│  SHARING OPTIONS                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [📱 WhatsApp]  [📘 Facebook]  [🐦 Twitter]     │   │
│  │  [📸 Instagram] [💬 Telegram]  [📧 Email]        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Your Shares This Campaign: 3                           │
│  Points Earned: 150                                     │
│  Friends Who Purchased: 1                               │
│  Bonus Points: 100                                       │
│                                                         │
│  [Create Shareable Link]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## User Guide

### For Merchants: Creating Promotions

1. Log into Merchant Dashboard
2. Navigate to "Marketing" > "Promotions"
3. Click "Create New Promotion"
4. Select campaign type
5. Configure discount parameters
6. Set targeting criteria
7. Schedule or launch immediately
8. Monitor performance in real-time

### For Merchants: Managing Coupons

1. Go to "Marketing" > "Coupons"
2. Click "Create Coupon"
3. Set discount type and value
4. Configure restrictions and limits
5. Set validity period
6. Choose target audience
7. Generate and distribute code

### For Merchants: Push Notifications

1. Navigate to "Marketing" > "Notifications"
2. Select notification type
3. Compose message with personalization
4. Preview for different user segments
5. Schedule or send immediately
6. Monitor delivery and engagement

### For Affiliates: Getting Started

1. Apply through Affiliate Program page
2. Get approved within 48 hours
3. Access Affiliate Dashboard
4. Generate unique tracking links
5. Share on social media and websites
6. Track performance in real-time
7. Request monthly payouts

### For Users: Opting In/Out

1. Go to Settings > Notifications
2. Toggle notification categories
3. Set preferred notification times
4. Manage email preferences
5. Update marketing consent

---

## Screenshots

### Marketing Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  ≡   Marketing Dashboard                    🔔  👤     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  OVERVIEW                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Active Campaigns: 3                           │   │
│  │  Total Coupons: 12                              │   │
│  │  Push Notification Open Rate: 34.2%             │   │
│  │  Email Open Rate: 28.7%                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  QUICK ACTIONS                                          │
│  [Create Campaign] [Create Coupon] [Send Notification]│
│                                                         │
│  ACTIVE CAMPAIGNS                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎉 Summer Sale 2024                            │   │
│  │  Status: Active | Uses: 1,234/5,000            │   │
│  │  Revenue Generated: Rs. 1,45,230                 │   │
│  │  [View Details] [Edit] [End Early]               │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  🚚 Free Delivery Weekend                       │   │
│  │  Status: Active | Uses: 892/Unlimited           │   │
│  │  Revenue Generated: Rs. 89,450                  │   │
│  │  [View Details] [Edit] [End Early]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  RECENT PERFORMANCE                                     │
│  Chart: Revenue from campaigns over time                │
│  [📈] [📊] [📉]  [May 1] [May 5] [May 10]              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Campaign Analytics
```
┌─────────────────────────────────────────────────────────┐
│  <  Campaign Analytics                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SUMMER SALE 2024                                       │
│  May 1, 2024 - May 15, 2024                             │
│                                                         │
│  KEY METRICS                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │    1,234     │ │  Rs. 45,230  │ │    34.2%     │    │
│  │   Uses       │ │   Revenue    │ │  Conv. Rate  │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  USAGE OVER TIME                                        │
│  ════════════════════════════════════════════════      │
│  │                                                        │
│  │    ╭╮                                                │
│  │   ╭╯╰╮   ╭╮  ╭╮                                     │
│  │  ╭╯  ╰╮ ╭╯╰╮╭╯╰                                     │
│  │ ╭╯    ╰─╯  ╰╯  ╰─╮                                  │
│  │╭╯              ╰──╮                                │
│  │╰──╮                ╰──╮                            │
│  └──────╯                 ╰─────                        │
│  May1  May3  May5  May7  May9  May11                   │
│                                                         │
│  USER SEGMENTS                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  New Users:    456 uses   (37%)                 │   │
│  │  Returning:    778 uses   (63%)                  │   │
│  │  VIP:          234 uses   (19%)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  TOP PERFORMING COUPONS                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SUMMER20    - 456 uses  - Rs. 22,340 rev      │   │
│  │  SUMMER15    - 389 uses  - Rs. 18,200 rev      │   │
│  │  FLAT100     - 289 uses  - Rs. 14,560 rev      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Campaign Engine

```javascript
class CampaignEngine {
    async evaluateCampaigns(userId, cartValue, categories) {
        const user = await this.getUser(userId);
        const activeCampaigns = await this.getActiveCampaigns();

        const eligibleCampaigns = [];

        for (const campaign of activeCampaigns) {
            const eligibility = await this.checkEligibility(
                campaign,
                user,
                cartValue,
                categories
            );

            if (eligibility.eligible) {
                eligibleCampaigns.push({
                    campaign,
                    ...eligibility
                });
            }
        }

        // Sort by discount value (highest first)
        return eligibleCampaigns.sort((a, b) =>
            b.discountValue - a.discountValue
        );
    }

    async checkEligibility(campaign, user, cartValue, categories) {
        // Check basic eligibility
        if (cartValue < campaign.minOrderValue) {
            return { eligible: false, reason: 'minOrderNotMet' };
        }

        // Check user segment targeting
        if (!this.matchesTargetSegment(campaign.targetSegments, user)) {
            return { eligible: false, reason: 'notInTargetSegment' };
        }

        // Check usage limits
        const usage = await this.getUserCampaignUsage(user._id, campaign._id);
        if (usage.count >= campaign.maxUsesPerUser) {
            return { eligible: false, reason: 'usageLimitReached' };
        }

        // Calculate discount
        const discountValue = this.calculateDiscount(
            campaign,
            cartValue
        );

        return {
            eligible: true,
            discountValue,
            finalValue: cartValue - discountValue,
            code: campaign.autoApply ? null : campaign.code
        };
    }

    calculateDiscount(campaign, cartValue) {
        switch (campaign.type) {
            case 'percentage':
                let discount = cartValue * (campaign.value / 100);
                if (campaign.maxDiscount) {
                    discount = Math.min(discount, campaign.maxDiscount);
                }
                return Math.floor(discount);

            case 'fixed':
                return Math.min(campaign.value, cartValue);

            case 'buyXGetY':
                return this.calculateBuyXGetY(campaign, cartValue);

            default:
                return 0;
        }
    }
}
```

### Notification Delivery System

```javascript
class NotificationService {
    constructor() {
        this.providers = {
            fcm: new FCMProvider(),
            apns: new APNSProvider(),
            email: new SMTPProvider()
        };
    }

    async send(notification) {
        const user = await this.getUser(notification.userId);
        const channels = this.determineChannels(notification);

        const results = await Promise.allSettled(
            channels.map(channel =>
                this.sendViaChannel(channel, notification, user)
            )
        );

        // Log delivery status
        await this.logDelivery(notification, results);

        return results;
    }

    async scheduleCampaign(campaign) {
        const targetUsers = await this.getTargetUsers(
            campaign.targetCriteria
        );

        const notifications = targetUsers.map(user =>
            this.personalizeNotification(campaign, user)
        );

        // Batch insert for efficiency
        const batchSize = 1000;
        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            await this.queueNotifications(batch);
        }

        return { total: notifications.length };
    }

    async optimizeSendTime(userId) {
        // Get user's historical open times
        const userHistory = await this.getNotificationHistory(userId);

        if (userHistory.length < 10) {
            return '10:00 AM'; // Default optimal time
        }

        // Calculate most common open times
        const openTimes = userHistory
            .filter(h => h.opened)
            .map(h => h.sentTime);

        return this.findPeakTime(openTimes);
    }
}
```

### Recommendation Engine

```javascript
class RecommendationEngine {
    constructor() {
        this.algorithms = {
            collaborative: new CollaborativeFiltering(),
            contentBased: new ContentBased(),
            trending: new TrendingProducts(),
            frequentlyBought: new FrequentlyBoughtTogether()
        };
    }

    async getRecommendations(userId, context) {
        const user = await this.getUser(userId);
        const { pageType, currentProduct, limit = 10 } = context;

        let recommendations = [];

        switch (pageType) {
            case 'home':
                recommendations = await this.getHomeRecommendations(user);
                break;

            case 'product':
                recommendations = await this.getProductRecommendations(
                    user,
                    currentProduct
                );
                break;

            case 'cart':
                recommendations = await this.getCartRecommendations(
                    user,
                    currentProduct
                );
                break;

            case 'category':
                recommendations = await this.getCategoryRecommendations(
                    user,
                    context.category
                );
                break;
        }

        // Remove already purchased items
        recommendations = await this.filterPurchased(
            recommendations,
            user._id
        );

        // Apply diversity scoring
        recommendations = await this.applyDiversityScore(recommendations);

        return recommendations.slice(0, limit);
    }

    async getHomeRecommendations(user) {
        const personalized = await this.algorithms.collaborative.getForUser(
            user._id,
            20
        );

        const trending = await this.algorithms.trending.getForLocation(
            user.location,
            10
        );

        const recentlyViewed = await this.getRecentlyViewed(user._id, 10);

        // Blend recommendations with weights
        return this.blendRecommendations(
            personalized,
            trending,
            recentlyViewed,
            { personalized: 0.5, trending: 0.3, recent: 0.2 }
        );
    }

    async getFrequentlyBoughtTogether(productId) {
        return await this.algorithms.frequentlyBought.get(productId);
    }
}
```

---

## API Reference

### Campaigns

#### GET /api/campaigns
List all campaigns (merchant dashboard).

**Response:**
```json
{
    "campaigns": [
        {
            "id": "camp_abc123",
            "name": "Summer Sale 2024",
            "type": "percentage",
            "value": 25,
            "status": "active",
            "stats": {
                "totalUses": 1234,
                "revenue": 145230,
                "conversionRate": 0.342
            }
        }
    ],
    "pagination": {
        "page": 1,
        "total": 12
    }
}
```

#### POST /api/campaigns
Create new campaign.

#### PUT /api/campaigns/:id
Update campaign.

#### POST /api/campaigns/:id/activate
Activate campaign.

#### POST /api/campaigns/:id/deactivate
Deactivate campaign.

### Coupons

#### GET /api/coupons
List all coupons.

#### POST /api/coupons
Create new coupon.

#### POST /api/coupons/validate
Validate coupon code for user/order.

**Request:**
```json
{
    "code": "SUMMER20",
    "orderValue": 1500,
    "userId": "user_xyz"
}
```

**Response:**
```json
{
    "valid": true,
    "discount": 300,
    "finalValue": 1200,
    "message": "25% off applied"
}
```

### Notifications

#### GET /api/notifications
Get user's notification history.

#### PUT /api/notifications/preferences
Update notification preferences.

#### POST /api/notifications/send
Send notification to user (internal).

### Recommendations

#### GET /api/recommendations
Get personalized recommendations.

**Query Parameters:**
- `type`: home, product, cart, category
- `productId`: Current product ID (for product/cart pages)
- `categoryId`: Category ID (for category pages)
- `limit`: Number of recommendations (default: 10)

---

## Analytics & Reporting

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Campaign ROI | Revenue from campaign / Cost of campaign | > 500% |
| Conversion Rate | Uses / Impressions | > 5% |
| Email Open Rate | Opens / Delivered | > 25% |
| Push Open Rate | Opens / Delivered | > 15% |
| Cart Recovery Rate | Recovered carts / Abandoned | > 10% |
| Affiliate Conversion | Conversions / Clicks | > 3% |

### Reports Available

- Campaign performance report (daily/weekly/monthly)
- Coupon usage report with trends
- Notification engagement report
- Email campaign report
- Affiliate performance report
- A/B test results report

---

## Troubleshooting

### Campaign Not Applying
1. Check campaign is active and within date range
2. Verify minimum order value is met
3. Confirm user is in target segment
4. Check usage limits haven't been reached
5. Contact support with campaign and order details

### Coupon Code Not Working
1. Verify code is entered correctly (case-sensitive)
2. Check if order meets minimum requirements
3. Confirm coupon is still valid (not expired)
4. Check if user has already used the coupon max times
5. Try clearing app cache and retry

### Not Receiving Notifications
1. Check notification permissions in device settings
2. Verify notification preferences in app settings
3. Ensure app has latest version installed
4. Check if device is blocking notifications
5. Verify email address is correct for email notifications

### Affiliate Link Not Tracking
1. Clear browser cookies and try again
2. Ensure link hasn't been modified
3. Check if user made purchase within cookie window (7 days)
4. Verify tracking ID is included in link
5. Contact affiliate support with click timestamp

---

## Support

- **Merchant Support**: marketing-support@rezapp.com
- **Affiliate Support**: affiliate@rezapp.com
- **In-app Support**: Available 24/7
- **Merchant Dashboard**: Help section with tutorials
