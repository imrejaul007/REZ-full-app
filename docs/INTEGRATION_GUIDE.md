# Integration Guide

This guide explains how each service connects and integrates within the REZ Loyalty System.

---

## Service Connections

### Order → Everything

The Order Service is the central event publisher. Every order completion triggers a cascade of loyalty and engagement events.

```mermaid
sequenceDiagram
    participant Client
    participant OrderService
    participant EventBus
    participant ProfileAggregator
    participant LoyaltyService
    participant CashbackService
    participant GamificationService
    participant StreakService
    participant DecisionService
    participant NotificationService

    Client->>OrderService: Place order
    OrderService->>OrderService: Process order
    OrderService->>EventBus: Publish order.completed

    EventBus->>ProfileAggregator: order.completed
    EventBus->>LoyaltyService: order.completed
    EventBus->>CashbackService: order.completed
    EventBus->>GamificationService: order.completed
    EventBus->>StreakService: order.completed

    ProfileAggregator->>ProfileAggregator: Update user profile
    ProfileAggregator->>DecisionService: profile.updated

    LoyaltyService->>LoyaltyService: Calculate points
    LoyaltyService->>LoyaltyService: Check milestones
    LoyaltyService->>NotificationService: tier.upgrade (if applicable)

    CashbackService->>CashbackService: Calculate cashback
    CashbackService->>NotificationService: cashback.earned

    GamificationService->>GamificationService: Award karma
    GamificationService->>GamificationService: Check achievements

    StreakService->>StreakService: Update streak
    StreakService->>NotificationService: streak.milestone (if applicable)

    DecisionService->>DecisionService: Evaluate REE rules
    DecisionService->>NotificationService: Trigger nudges
```

**Step-by-step flow:**

1. **Order completed** - User completes a transaction
2. **Publish `order.completed` event** - Order Service publishes to event bus
3. **Profile Aggregator receives** - Updates unified user profile
4. **Triggers cascade:**
   - **Loyalty Service**: Credit points, check tier progress
   - **Cashback Service**: Calculate and credit cashback
   - **Gamification Service**: Award karma points, achievements
   - **Streak Service**: Update daily streak counter
5. **All updates published** - Services emit their own events

---

### Karma → Loyalty Bridge

Karma points earned through engagement are periodically converted to loyalty points.

```mermaid
sequenceDiagram
    participant EventBus
    participant KarmaBridge
    participant GamificationService
    participant LoyaltyService
    participant ProfileAggregator
    participant NotificationService

    EventBus->>KarmaBridge: karma.earned

    KarmaBridge->>GamificationService: Get karma balance
    GamificationService-->>KarmaBridge: Current karma

    KarmaBridge->>KarmaBridge: Check conversion threshold
    alt Threshold Met
        KarmaBridge->>KarmaBridge: Calculate loyalty points
        KarmaBridge->>LoyaltyService: Credit loyalty points
        LoyaltyService-->>KarmaBridge: Confirmed

        KarmaBridge->>GamificationService: Deduct karma (burn)
        GamificationService-->>KarmaBridge: Deducted

        KarmaBridge->>ProfileAggregator: Update cross-system balance
        KarmaBridge->>NotificationService: points.converted

        Note over KarmaBridge: Ratio: 10 Karma = 1 Loyalty Point
    else Threshold Not Met
        KarmaBridge->>KarmaBridge: Log for next cycle
    end
```

**Conversion Rules:**
- **Threshold**: 100 karma points minimum
- **Ratio**: 10 Karma = 1 Loyalty Point
- **Frequency**: Hourly batch processing
- **Cap**: Maximum 10,000 karma converted per day per user

---

### Intent → Dormant Revival

Dormant purchase intents are detected and revived through targeted nudges.

```mermaid
sequenceDiagram
    participant IntentService
    participant DormantService
    participant DecisionService
    participant NotificationService
    participant ProfileAggregator

    IntentService->>DormantService: Check intent activity

    DormantService->>DormantService: Mark dormant (7+ days inactive)

    DormantService->>ProfileAggregator: Get user preferences
    ProfileAggregator-->>DormantService: User profile

    DormantService->>DormantService: Calculate revival score
    DormantService->>DecisionService: Revival candidate

    DecisionService->>DecisionService: Evaluate timing
    DecisionService->>DecisionService: Select channel (push/email/SMS)
    DecisionService->>DecisionService: Generate personalized message

    DecisionService->>NotificationService: Send revival nudge

    Note over NotificationService: Message: "We noticed you were interested in X"

    NotificationService-->>IntentService: Nudge delivered

    alt User clicks nudge
        IntentService->>IntentService: Mark intent as active
        IntentService->>DormantService: Mark as revived
        IntentService->>ProfileAggregator: Update engagement score
    else User ignores
        DormantService->>DormantService: Increment nudge count
        DormantService->>DormantService: Adjust revival timing
    end
```

---

### Payment → Cashback

Payment confirmation triggers cashback calculation and crediting.

```mermaid
sequenceDiagram
    participant PaymentService
    participant EventBus
    participant CashbackService
    participant WalletService
    participant OrderService
    participant NotificationService

    PaymentService->>EventBus: payment.confirmed

    EventBus->>CashbackService: payment.confirmed

    CashbackService->>CashbackService: Determine cashback rate
    Note over CashbackService: Base rate: 1%<br/>Tier multipliers:<br/>- Bronze: 1x<br/>- Silver: 1.25x<br/>- Gold: 1.5x<br/>- Platinum: 2x

    CashbackService->>CashbackService: Calculate cashback amount

    CashbackService->>WalletService: Credit to wallet
    WalletService-->>CashbackService: Balance updated

    CashbackService->>CashbackService: Record transaction

    CashbackService->>NotificationService: cashback.credited

    OrderService->>EventBus: order.delivered (confirms cashback)
```

---

### Streak → Rewards

Daily engagement streaks unlock bonus rewards.

```mermaid
sequenceDiagram
    participant StreakService
    participant EventBus
    participant LoyaltyService
    participant CashbackService
    participant NotificationService

    Note over StreakService: User performs daily action<br/>(order, login, etc.)

    EventBus->>StreakService: engagement.action

    StreakService->>StreakService: Check if streak continues
    StreakService->>StreakService: Update streak counter

    alt Milestone reached
        StreakService->>StreakService: Calculate milestone bonus

        Note over StreakService: Milestones:<br/>- 7 days: 2x karma<br/>- 14 days: 50 bonus points<br/>- 30 days: 5% cashback boost<br/>- 60 days: Gold tier upgrade<br/>- 100 days: VIP access

        StreakService->>LoyaltyService: Credit milestone bonus
        StreakService->>CashbackService: Apply cashback boost
        StreakService->>NotificationService: streak.milestone
    end
```

---

### Profile Aggregator → All Services

The Profile Aggregator maintains the single source of truth for user data.

```mermaid
graph LR
    subgraph "Data Sources"
        Order[Order Service]
        Payment[Payment Service]
        Wallet[Wallet Service]
        Loyalty[Loyalty Service]
        Gamification[Gamification]
        Streak[Streak Service]
        Intent[Intent Service]
    end

    subgraph "Profile Aggregator"
        Enrich[Enrichment Engine]
        Store[(Profile Store)]
    end

    subgraph "Consumers"
        Decision[Decision Service]
        Notification[Notifications]
        Analytics[Analytics]
        Marketing[Marketing]
    end

    Order --> Enrich
    Payment --> Enrich
    Wallet --> Enrich
    Loyalty --> Enrich
    Gamification --> Enrich
    Streak --> Enrich
    Intent --> Enrich

    Enrich --> Store

    Store --> Decision
    Store --> Notification
    Store --> Analytics
    Store --> Marketing
```

**Profile Data Flow:**

| Source | Data Provided | Update Frequency |
|--------|---------------|------------------|
| Order Service | Total orders, spend, categories | Real-time |
| Payment Service | Payment methods, success rate | Real-time |
| Wallet Service | Balance, transaction history | Real-time |
| Loyalty Service | Points, tier, milestones | Real-time |
| Gamification | Karma score, achievements | Batch (hourly) |
| Streak Service | Current streak, longest streak | Real-time |
| Intent Service | Active intents, dormant intents | Real-time |

---

### Decision Service → REE Rules

The Decision Service evaluates REE (Real-time Event Engine) rules to determine actions.

```mermaid
sequenceDiagram
    participant EventBus
    participant DecisionService
    participant ProfileAggregator
    participant NotificationService
    participant LoyaltyService

    EventBus->>DecisionService: Any loyalty event

    DecisionService->>ProfileAggregator: Get user profile
    ProfileAggregator-->>DecisionService: Full profile

    DecisionService->>DecisionService: Evaluate rules

    Note over DecisionService: Rule: "New user first order"<br/>Condition: orders === 1<br/>AND totalSpent > 500<br/>Action: Credit 100 bonus points

    DecisionService->>DecisionService: Match rules

    alt Rules matched
        DecisionService->>LoyaltyService: Execute action
        LoyaltyService-->>DecisionService: Completed

        DecisionService->>NotificationService: Send confirmation

        DecisionService->>ProfileAggregator: Update engagement
    else No match
        DecisionService->>DecisionService: Log for analytics
    end
```

---

### Webhook Integrations

External systems integrate via webhooks for specific events.

```mermaid
graph LR
    subgraph "External Systems"
        Razorpay[Razorpay]
        HotelPMS[Hotel PMS]
        Delivery[Delivery Partner]
    end

    subgraph "REZ Platform"
        Webhook[Webhook Receiver]
        Auth[Auth Middleware]
        Handler[Event Handler]
    end

    Razorpay --> Webhook
    HotelPMS --> Webhook
    Delivery --> Webhook

    Webhook --> Auth
    Auth --> Handler

    Handler --> EventBus
```

**Webhook Events:**

| Source | Event | Action |
|--------|-------|--------|
| Razorpay | `payment.success` | Confirm order, credit cashback |
| Razorpay | `payment.failed` | Mark order failed, release hold |
| Hotel PMS | `checkout` | Trigger review request |
| Delivery | `delivered` | Mark order complete, update loyalty |

---

## Cross-Service Event Flows

### New User Onboarding

```mermaid
sequenceDiagram
    participant AuthService
    participant ProfileAggregator
    participant LoyaltyService
    participant GamificationService
    participant DecisionService
    participant NotificationService

    AuthService->>ProfileAggregator: user.created

    ProfileAggregator->>ProfileAggregator: Create profile
    ProfileAggregator->>LoyaltyService: Initialize loyalty
    ProfileAggregator->>GamificationService: Initialize karma

    LoyaltyService->>LoyaltyService: Create Bronze tier
    LoyaltyService->>NotificationService: welcome.bonus

    GamificationService->>GamificationService: Set karma = 0
    GamificationService->>GamificationService: Award "New Member" badge

    DecisionService->>DecisionService: Evaluate onboarding rules

    Note over DecisionService: Credit 100 welcome points
    Note over DecisionService: Schedule onboarding sequence

    DecisionService->>LoyaltyService: Credit welcome bonus
    DecisionService->>NotificationService: welcome.nudge
```

### Tier Upgrade

```mermaid
sequenceDiagram
    participant LoyaltyService
    participant ProfileAggregator
    participant DecisionService
    participant NotificationService
    participant WalletService

    LoyaltyService->>LoyaltyService: Check tier progress

    alt Tier threshold crossed
        LoyaltyService->>LoyaltyService: Upgrade tier
        LoyaltyService->>ProfileAggregator: Update profile

        DecisionService->>DecisionService: Apply tier benefits

        Note over DecisionService: Benefits:<br/>- Silver: 1.25x cashback<br/>- Gold: 1.5x cashback + free delivery<br/>- Platinum: 2x cashback + VIP support

        DecisionService->>WalletService: Credit tier bonus
        DecisionService->>NotificationService: tier.upgrade
    end
```

### Order Cancellation with Refund

```mermaid
sequenceDiagram
    participant OrderService
    participant EventBus
    participant LoyaltyService
    participant CashbackService
    participant WalletService
    participant NotificationService

    OrderService->>EventBus: order.cancelled

    EventBus->>LoyaltyService: order.cancelled
    EventBus->>CashbackService: order.cancelled

    LoyaltyService->>LoyaltyService: Reverse earned points
    LoyaltyService->>LoyaltyService: Recalculate tier progress

    CashbackService->>CashbackService: Reverse cashback
    CashbackService->>WalletService: Debit wallet
    WalletService-->>CashbackService: Balance updated

    CashbackService->>NotificationService: refund.processed
    LoyaltyService->>NotificationService: points.reversed
```

---

## Error Handling

### Retry Strategy

| Error Type | Retry | Backoff |
|------------|-------|---------|
| Network timeout | 3 times | Exponential (1s, 2s, 4s) |
| Service unavailable | 5 times | Exponential (1s, 2s, 4s, 8s, 16s) |
| Validation error | No retry | Immediate failure |
| Rate limited | 3 times | Linear (30s, 60s, 90s) |

### Dead Letter Queue

Failed events after max retries go to DLQ for manual review:

```mermaid
graph TD
    A[Event Published] --> B{Process Event}
    B -->|Success| Z[Complete]
    B -->|Failure| C{Retry < 3}
    C -->|Yes| B
    C -->|No| D[DLQ]
    D --> E[Alert]
    D --> F[Manual Review]
```

---

## Configuration

### Service URL Configuration

All service URLs are centralized in `src/config/services.ts`:

```typescript
export const SERVICE_URLS = {
  // Core Services
  wallet:       process.env.WALLET_SERVICE_URL,
  order:        process.env.ORDER_SERVICE_URL,
  payment:      process.env.PAYMENT_SERVICE_URL,
  merchant:     process.env.MERCHANT_SERVICE_URL,

  // Loyalty & Gamification
  gamification: process.env.GAMIFICATION_SERVICE_URL,
  loyalty:      process.env.LOYALTY_SERVICE_URL,
  cashback:     process.env.CASHBACK_SERVICE_URL,
  streak:       process.env.STREAK_SERVICE_URL,

  // Intelligence
  intent:       process.env.INTENT_SERVICE_URL,
  decision:     process.env.DECISION_SERVICE_URL,

  // Support
  notification: process.env.NOTIFICATION_SERVICE_URL,
  auth:         process.env.AUTH_SERVICE_URL,
} as const;
```

### Environment Variables

```bash
# Service URLs
WALLET_SERVICE_URL=http://localhost:4004
ORDER_SERVICE_URL=http://localhost:4006
PAYMENT_SERVICE_URL=http://localhost:4002
MERCHANT_SERVICE_URL=http://localhost:4003
NOTIFICATION_SERVICE_URL=http://localhost:4005
AUTH_SERVICE_URL=http://localhost:4001
CATALOG_SERVICE_URL=http://localhost:4007
SEARCH_SERVICE_URL=http://localhost:4008
MARKETING_SERVICE_URL=http://localhost:4009
GAMIFICATION_SERVICE_URL=http://localhost:4010
ADS_SERVICE_URL=http://localhost:4011
PMS_SERVICE_URL=http://localhost:4012
ANALYTICS_SERVICE_URL=http://localhost:4013
INSIGHTS_SERVICE_URL=http://localhost:4014
LOYALTY_SERVICE_URL=http://localhost:4016
CASHBACK_SERVICE_URL=http://localhost:4017
STREAK_SERVICE_URL=http://localhost:4018
KARMABRIDGE_SERVICE_URL=http://localhost:4019

# Internal Auth
INTERNAL_SERVICE_TOKEN=your-secure-token

# Database
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
```

---

## Testing Integrations

### Simulate Order Completion

```bash
curl -X POST http://localhost:4006/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "userId": "user123",
    "items": [{"productId": "prod1", "quantity": 2, "price": 100}],
    "total": 200
  }'
```

### Check Profile Updates

```bash
curl http://localhost:4015/api/profile/user123 \
  -H "X-Internal-Token: your-token"
```

### Verify Loyalty Credit

```bash
curl http://localhost:4016/api/loyalty/user123/balance \
  -H "X-Internal-Token: your-token"
```

---

*For complete event schemas, see [EVENTS.md](EVENTS.md)*
*For REE decision rules, see [DECISIONS.md](DECISIONS.md)*
