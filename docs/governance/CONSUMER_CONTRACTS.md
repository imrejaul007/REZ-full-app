# REZ Consumer Contracts

**Version:** 1.0
**Date:** May 9, 2026

This document defines the contract between event publishers and consumers.

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ EVENT BUS │
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PUBLISHER: order-service │ │
│ │ Publishes: order.completed │ │
│ │ Schema Version: 1.0 │ │
│ │ Guarantee: At-least-once │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
│ ▼ (fan-out) │
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │Profile │ │ Streak │ │ Loyalty │ │ Score │ │
│ │Agg │ │Service │ │Service │ │Service │ │
│ │ │ │ │ │ │
│ │Contract│ │Contract│ │Contract│ │Contract│ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Contract Definition

Each consumer MUST define:

```typescript
interface ConsumerContract {
  serviceName: string;
  version: string;
  
  // Events this service subscribes to
  subscriptions: Subscription[];
  
  // Idempotency requirements
  idempotencyPolicy: IdempotencyPolicy;
  
  // Error handling
  errorHandling: ErrorHandlingConfig;
  
  // Dead letter queue
  dlq: DLQConfig;
  
  // Health expectations
  healthExpectations: HealthExpectations;
}
```

---

## Profile Aggregator Contract

**Service:** `profile-aggregator`
**Port:** 4025
**Consumer ID:** `consumer-profile-aggregator`

```typescript
const profileAggregatorContract: ConsumerContract = {
  serviceName: 'profile-aggregator',
  version: '1.0',
  
  subscriptions: [
    {
      event: 'wallet.credited',
      version: '1.0',
      handler: 'handleWalletEvent',
      priority: 'high',
    },
    {
      event: 'wallet.debited',
      version: '1.0',
      handler: 'handleWalletEvent',
      priority: 'high',
    },
    {
      event: 'order.completed',
      version: '1.0',
      handler: 'handleOrderCompleted',
      priority: 'critical',
    },
    {
      event: 'order.refunded',
      version: '1.0',
      handler: 'handleOrderRefunded',
      priority: 'high',
    },
    {
      event: 'karma.earned',
      version: '1.0',
      handler: 'handleKarmaEarned',
      priority: 'medium',
    },
    {
      event: 'streak.updated',
      version: '1.0',
      handler: 'handleStreakUpdated',
      priority: 'high',
    },
    {
      event: 'score.updated',
      version: '1.0',
      handler: 'handleScoreUpdated',
      priority: 'medium',
    },
    {
      event: 'loyalty.tier_updated',
      version: '1.0',
      handler: 'handleTierUpdated',
      priority: 'high',
    },
  ],
  
  idempotencyPolicy: {
    required: true,
    events: ['order.completed', 'wallet.credited', 'loyalty.tier_updated'],
    ttl: {
      financial: 24 * 60 * 60,
      points: 24 * 60 * 60,
      tier: 7 * 24 * 60 * 60,
    },
  },
  
  errorHandling: {
    maxRetries: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: ['timeout', 'connection', 'rate_limit'],
    nonRetryableErrors: ['validation', 'schema_mismatch'],
  },
  
  dlq: {
    name: 'profile-aggregator.dlq',
    alertThreshold: 10,
    criticalThreshold: 50,
  },
  
  healthExpectations: {
    maxLatency: 100, // ms
    maxErrorRate: 0.01, // 1%
    minThroughput: 100, // events/sec
  },
};
```

---

## Karma-Loyalty Bridge Contract

**Service:** `karma-loyalty-bridge`
**Port:** 4029
**Consumer ID:** `consumer-karma-loyalty-bridge`

```typescript
const karmaBridgeContract: ConsumerContract = {
  serviceName: 'karma-loyalty-bridge',
  version: '1.0',
  
  subscriptions: [
    {
      event: 'karma.earned',
      version: '1.0',
      handler: 'handleKarmaEarned',
      priority: 'critical',
    },
    {
      event: 'karma.level_up',
      version: '1.0',
      handler: 'handleLevelUp',
      priority: 'critical',
    },
    {
      event: 'karma.badge_earned',
      version: '1.0',
      handler: 'handleBadgeEarned',
      priority: 'high',
    },
  ],
  
  idempotencyPolicy: {
    required: true,
    events: ['karma.earned', 'karma.level_up', 'karma.badge_earned'],
    ttl: {
      points: 24 * 60 * 60,
      badges: 7 * 24 * 60 * 60,
    },
  },
  
  errorHandling: {
    maxRetries: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: ['timeout', 'connection'],
    nonRetryableErrors: ['validation', 'schema_mismatch', 'duplicate_conversion'],
  },
  
  dlq: {
    name: 'karma-loyalty-bridge.dlq',
    alertThreshold: 5,
    criticalThreshold: 20,
  },
  
  healthExpectations: {
    maxLatency: 200, // ms
    maxErrorRate: 0.02,
    minThroughput: 50,
  },
};
```

---

## Streak Service Contract

**Service:** `streak-service`
**Port:** 4026
**Consumer ID:** `consumer-streak-service`

```typescript
const streakServiceContract: ConsumerContract = {
  serviceName: 'streak-service',
  version: '1.0',
  
  subscriptions: [
    {
      event: 'order.completed',
      version: '1.0',
      handler: 'handleOrderCompleted',
      priority: 'critical',
    },
    {
      event: 'order.cancelled',
      version: '1.0',
      handler: 'handleOrderCancelled',
      priority: 'medium',
    },
  ],
  
  idempotencyPolicy: {
    required: true,
    events: ['order.completed'],
    ttl: {
      default: 24 * 60 * 60,
    },
  },
  
  errorHandling: {
    maxRetries: 3,
    backoffStrategy: 'exponential',
    initialDelay: 500,
    maxDelay: 5000,
    retryableErrors: ['timeout', 'connection'],
    nonRetryableErrors: ['validation', 'streak_already_updated'],
  },
  
  dlq: {
    name: 'streak-service.dlq',
    alertThreshold: 10,
    criticalThreshold: 30,
  },
  
  healthExpectations: {
    maxLatency: 50, // ms (streak must be fast)
    maxErrorRate: 0.005,
    minThroughput: 200,
  },
};
```

---

## Cross-Merchant Service Contract

**Service:** `cross-merchant`
**Port:** 4027
**Consumer ID:** `consumer-cross-merchant`

```typescript
const crossMerchantContract: ConsumerContract = {
  serviceName: 'cross-merchant',
  version: '1.0',
  
  subscriptions: [
    {
      event: 'order.completed',
      version: '1.0',
      handler: 'handleOrderCompleted',
      priority: 'high',
    },
  ],
  
  idempotencyPolicy: {
    required: true,
    events: ['order.completed'],
    ttl: {
      badges: 7 * 24 * 60 * 60,
    },
  },
  
  errorHandling: {
    maxRetries: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryableErrors: ['timeout', 'connection'],
    nonRetryableErrors: ['validation', 'badge_already_earned'],
  },
  
  dlq: {
    name: 'cross-merchant.dlq',
    alertThreshold: 10,
    criticalThreshold: 30,
  },
  
  healthExpectations: {
    maxLatency: 100,
    maxErrorRate: 0.01,
    minThroughput: 100,
  },
};
```

---

## Score Service Contract

**Service:** `score-service`
**Port:** 4028
**Consumer ID:** `consumer-score-service`

```typescript
const scoreServiceContract: ConsumerContract = {
  serviceName: 'score-service',
  version: '1.0',
  
  subscriptions: [
    {
      event: 'order.completed',
      version: '1.0',
      handler: 'handleOrderCompleted',
      priority: 'medium',
    },
    {
      event: 'karma.earned',
      version: '1.0',
      handler: 'handleKarmaEarned',
      priority: 'medium',
    },
    {
      event: 'streak.updated',
      version: '1.0',
      handler: 'handleStreakUpdated',
      priority: 'medium',
    },
  ],
  
  idempotencyPolicy: {
    required: false, // Score updates are idempotent by nature
    events: [],
    ttl: {},
  },
  
  errorHandling: {
    maxRetries: 3,
    backoffStrategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 15000,
    retryableErrors: ['timeout', 'connection', 'rate_limit'],
    nonRetryableErrors: ['validation', 'schema_mismatch'],
  },
  
  dlq: {
    name: 'score-service.dlq',
    alertThreshold: 5,
    criticalThreshold: 20,
  },
  
  healthExpectations: {
    maxLatency: 200,
    maxErrorRate: 0.02,
    minThroughput: 50,
  },
};
```

---

## Notification Service Contract

**Service:** `notifications`
**Port:** 4032
**Consumer ID:** `consumer-notifications`

```typescript
const notificationContract: ConsumerContract = {
  serviceName: 'notifications',
  version: '1.0',
  
  subscriptions: [
    {
      event: 'streak.milestone_reached',
      version: '1.0',
      handler: 'handleStreakMilestone',
      priority: 'high',
    },
    {
      event: 'score.tier_changed',
      version: '1.0',
      handler: 'handleScoreTierChanged',
      priority: 'medium',
    },
    {
      event: 'cross_merchant.badge_earned',
      version: '1.0',
      handler: 'handleBadgeEarned',
      priority: 'high',
    },
    {
      event: 'loyalty.tier_updated',
      version: '1.0',
      handler: 'handleLoyaltyTierChanged',
      priority: 'medium',
    },
    {
      event: 'karma.level_up',
      version: '1.0',
      handler: 'handleKarmaLevelUp',
      priority: 'medium',
    },
  ],
  
  idempotencyPolicy: {
    required: false, // Duplicate notifications are acceptable
    events: [],
    ttl: {
      notifications: 1 * 60 * 60,
    },
  },
  
  errorHandling: {
    maxRetries: 2,
    backoffStrategy: 'linear',
    initialDelay: 500,
    maxDelay: 3000,
    retryableErrors: ['timeout', 'connection', 'rate_limit'],
    nonRetryableErrors: ['user_not_found', 'channel_disabled'],
  },
  
  dlq: {
    name: 'notifications.dlq',
    alertThreshold: 20,
    criticalThreshold: 50,
  },
  
  healthExpectations: {
    maxLatency: 500, // Notifications are async
    maxErrorRate: 0.05,
    minThroughput: 20,
  },
};
```

---

## Event Flow Summary

```
order.completed
    ↓
├── Profile Aggregator ──→ Updates wallet, activity, spend
├── Streak Service ──→ Updates streak
├── Cross-Merchant ──→ Checks badges
├── Score Service ──→ Recalculates score
└── Karma-Loyalty Bridge ──→ Converts to loyalty points
    ↓
    Profile Aggregator ──→ Updates unified profile
    ↓
Notification Service ──→ Sends congratulations
```

---

## Contract Verification

```bash
# Verify all contracts
rez-contract-cli verify all

# Verify specific consumer
rez-contract-cli verify profile-aggregator

# Check for contract violations
rez-contract-cli check --strict

# Generate contract report
rez-contract-cli report --format markdown
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | May 9, 2026 | Initial contracts |
