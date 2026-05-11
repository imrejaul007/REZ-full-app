# REZ Loyalty System - Integration Tests

Comprehensive integration test suite for the REZ Loyalty System.

## Test Coverage

### 1. Order Completion Flow (`order-loyalty-flow.test.ts`)
Tests for loyalty rewards triggered by order completion:
- Loyalty points calculation and awarding
- Cashback percentage calculations
- Streak updates on order completion
- XP earning and level progression
- ReZ Score updates
- Cross-merchant badge checks

### 2. Karma-Loyalty Bridge (`kararma-loyalty-flow.test.ts`)
Tests for karma to loyalty point conversion:
- Karma point accumulation
- Milestone detection and bonuses
- Tier upgrades based on karma levels
- Karma badge awards

### 3. Streak Rewards Flow (`streak-rewards-flow.test.ts`)
Tests for streak tracking and rewards:
- Daily streak incrementing
- Streak reset on missed days
- Milestone rewards (7, 14, 30, 60, 90, 180, 365 days)
- Streak recovery mechanics
- Longest streak tracking

### 4. ReZ Score Calculation (`rez-score-flow.test.ts`)
Tests for ReZ Score system:
- Engagement score from karma
- Spending score from lifetime points
- Streak bonus calculations
- Tier multiplier applications
- Combined score calculations

### 5. Cross-Merchant Flow (`cross-merchant-flow.test.ts`)
Tests for cross-merchant achievements:
- Merchant visit tracking
- Explorer badge (3+ merchants)
- Master Explorer badge (all merchants)
- Progress tracking
- Cross-merchant bonus points

## Test Helpers

### Test Fixtures (`helpers/testFixtures.ts`)
Reusable test data generators:
- User profiles
- Loyalty profiles with various tiers
- Orders
- Karma activities
- Badges
- Scenario generators

### Service Mocks (`helpers/serviceMocks.ts`)
Mock implementations of external services:
- MockLoyaltyService - Core loyalty operations
- MockNotificationService - Notification dispatch
- MockCacheService - Caching layer
- MockAnalyticsService - Event tracking

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run tests for CI (sequential, verbose)
npm run test:ci
```

## Test Configuration

- **Framework**: Jest with ts-jest
- **Timeout**: 10 seconds per test
- **Coverage Threshold**: 70% for branches, functions, lines, statements
- **Environment**: Node.js

## Key Constants

### Loyalty Tiers
| Tier | Min Points | Multiplier |
|------|------------|------------|
| Bronze | 0 | 1.0x |
| Silver | 1,000 | 1.25x |
| Gold | 5,000 | 1.5x |
| Platinum | 15,000 | 1.75x |
| Diamond | 50,000 | 2.0x |

### Streak Milestones
| Days | Points | XP | Badge |
|------|--------|-----|-------|
| 7 | 100 | 50 | - |
| 14 | 250 | 100 | - |
| 30 | 500 | 250 | streak_30_days |
| 60 | 1,000 | 500 | streak_60_days |
| 90 | 2,000 | 1,000 | streak_90_days |
| 180 | 5,000 | 2,500 | streak_180_days |
| 365 | 15,000 | 7,500 | streak_365_days |

### Karma Milestones
| Karma | Badge | Loyalty Points |
|-------|-------|----------------|
| 100 | karma_newbie | 50 |
| 500 | karma_contributor | 200 |
| 1,000 | karma_expert | 500 |
| 5,000 | karma_master | 2,000 |
| 10,000 | karma_legend | 5,000 |
| 50,000 | karma_god | 15,000 |

### Points Configuration
- Base points per dollar: 10
- Karma multiplier: 0.5
- Streak bonus: 5%
- Cross-merchant bonus: 100 points

## Writing New Tests

### Using Test Fixtures
```typescript
import { generateUser, generateLoyaltyProfile, generateOrder } from './helpers/testFixtures';

// Create a user with a specific tier
const profile = generateLoyaltyProfile(userId, { tier: 'gold', totalPoints: 6000 });

// Create an order
const order = generateOrder(userId, merchantId, { totalAmount: 100 });
```

### Using Service Mocks
```typescript
import { createMockLoyaltyService } from './helpers/serviceMocks';

const loyaltyService = createMockLoyaltyService();

// Create a profile
await loyaltyService.createProfile(profile);

// Process an order
await loyaltyService.processOrder(order);

// Add points
await loyaltyService.addPoints(userId, 500);
```

### Event Testing
```typescript
let eventFired = false;

loyaltyService.on('streak:updated', (data) => {
  eventFired = true;
});

await loyaltyService.updateStreak(userId, new Date());

expect(eventFired).toBe(true);
```
