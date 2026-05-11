# Savings Module - Complete Implementation

## Overview

The Savings Module tracks all money users save through cashback, rewards, referrals, and loyalty. It provides insights, projections, smart recommendations, and gamification features.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REZ APP (Frontend)                       │
├─────────────────────────────────────────────────────────────┤
│  SavingsContext  │  SavingsWidget  │  Deep Linking           │
│  useSavings()   │  SavingsHero   │  Notifications         │
└────────────────────────┬──────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               REZ-WALLET-SERVICE (Backend)                  │
├─────────────────────────────────────────────────────────────┤
│  savingsRoutes    │  savingsService  │  Admin Routes         │
│  /api/savings/*   │  recordSavings() │  /admin/savings/*   │
└────────┬──────────────────────────┬─────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌─────────────────┐
│    MongoDB      │      │     Redis       │
├─────────────────┤      ├─────────────────┤
│ savingsentries  │      │  Rate Limiting   │
│ savingsgoals   │      │  Caching        │
│ savingsstreaks  │      └─────────────────┘
│ savingsinsights│
│ projections    │
│ summaries      │
└─────────────────┘
```

---

## Backend Files

### Models (`rez-wallet-service/src/models/Savings.ts`)

| Model | Collection | Description |
|-------|------------|-------------|
| `SavingsEntry` | `savingsentries` | Individual savings records |
| `SavingsGoal` | `savingsgoals` | User savings goals |
| `SavingsStreak` | `savingsstreakschemas` | Streak tracking |
| `SavingsInsight` | `savingsinsights` | Generated insights |
| `SavingsProjection` | `savingsprojections` | 30/90/365 day projections |
| `UserSavingsSummary` | `usersavingssummaries` | Denormalized summary |

### Service (`rez-wallet-service/src/services/savingsService.ts`)

```typescript
// Core functions
recordSavings(params)           // Record new savings
getSavingsDashboard(userId)     // Full dashboard
getSavingsSummary(userId)       // Totals by type
getSavingsHistory(userId, ...)  // Paginated history
getSavingsStreak(userId)       // Streak info
getSavingsProjection(userId)     // 30/90/365 day projections
getSavingsInsights(userId)     // Personalized insights
getSavingsRecommendations(userId) // Actionable tips

// Goals
getSavingsGoals(userId)
createSavingsGoal(params)
updateSavingsGoalProgress(userId, goalId, amount)
deleteSavingsGoal(userId, goalId)
```

### Routes

**Consumer Routes** (`src/routes/savingsRoutes.ts`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/savings/dashboard` | GET | JWT | Full dashboard |
| `/api/savings/summary` | GET | JWT | Totals by type |
| `/api/savings/history` | GET | JWT | Paginated history |
| `/api/savings/streak` | GET | JWT | Streak info |
| `/api/savings/projection` | GET | JWT | 30/90/365 projections |
| `/api/savings/insights` | GET | JWT | Insights |
| `/api/savings/recommendations` | GET | JWT | Tips |
| `/api/savings/goals` | GET | JWT | List goals |
| `/api/savings/goals` | POST | JWT | Create goal |
| `/api/savings/goals/:goalId` | PATCH | JWT | Update progress |
| `/api/savings/goals/:goalId` | DELETE | JWT | Delete goal |

**Admin Routes** (`src/routes/savingsAdminRoutes.ts`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/admin/savings/overview` | GET | Admin | Stats overview |
| `/admin/savings/trends` | GET | Admin | Daily trends |
| `/admin/savings/categories` | GET | Admin | Category breakdown |
| `/admin/savings/streaks` | GET | Admin | Streak analytics |
| `/admin/savings/users/:userId` | GET | Admin | User details |
| `/admin/savings/export` | GET | Admin | CSV export |

### Indexes (`src/models/savingsIndexes.ts`)

Run after deployment:
```bash
cd rez-wallet-service
npx ts-node src/models/savingsIndexes.ts
```

Creates indexes for:
- User lookups by date/type/category
- Leaderboards (top savers, streaks)
- Aggregation pipelines

### Referral Integration (`src/services/savingsReferralIntegration.ts`)

```typescript
// Record referral bonus as savings
await recordReferralSavings({
  referrerId: user._id,
  refereeId: newUser._id,
  referralCode: 'REWARD50',
  bonusAmount: 50000, // 500 INR in paise
});
```

---

## Frontend Files

### API Service (`rez-app-consumer/services/savingsApi.ts`)

```typescript
// Types
SavingsDashboard    // Full dashboard response
SavingsSummary       // Totals by type
SavingsEntry        // Individual record
SavingsStreak       // Streak data
SavingsGoal         // Goal data
SavingsRecommendation // Tips

// API functions
getSavingsDashboard()
getSavingsSummary()
getSavingsHistory(params)
getSavingsStreak()
getSavingsGoals()
createSavingsGoal(params)
updateSavingsGoal(goalId, amount)
deleteSavingsGoal(goalId)
```

### Context (`rez-app-consumer/contexts/SavingsContext.tsx`)

```tsx
<SavingsProvider>
  <App />
</SavingsProvider>
```

### Hooks (`rez-app-consumer/hooks/useSavings.ts`)

```typescript
useSavings()              // Main hook
useSavingsSummary()       // Summary data
useSavingsStreak()        // Streak data
useSavingsGoals()         // Goals
useSavingsRecommendations() // Tips
```

### Notifications (`services/savingsNotificationService.ts`)

Notification types:
- `streak_reminder` - "Keep your streak alive!"
- `streak_achieved` - 7, 14, 30, 60, 90, 365 day milestones
- `goal_progress` - 25%, 50%, 75%, 90%, 95% milestones
- `goal_completed` - Goal reached!
- `savings_milestone` - ₹100, ₹500, ₹1K, ₹5K, ₹10K, ₹50K, ₹1L

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `SavingsDashboard` | `components/wallet/` | Full dashboard UI |
| `SavingsHero` | `components/wallet/` | Header with total savings |
| `SavingsWidget` | `components/wallet/` | Reusable widgets (compact/full/minimal) |
| `SavingsHomeWidget` | `components/home/` | Home screen embed |

### Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Savings | `/savings` | Full dashboard |
| Goals | `/savings/goals` | Goal management |
| History | `/savings/history` | Transaction history |

---

## Deep Linking

Add to `utils/notificationDeepLinkHandler.ts`:

```typescript
case 'streak_reminder':
case 'streak_achieved':
case 'savings_milestone':
  router.push('/savings');
  break;

case 'goal_progress':
case 'goal_completed':
  router.push('/savings/goals');
  break;
```

---

## Wallet Integration

In `app/wallet-screen.tsx`:

```tsx
import { useSavings } from '@/hooks/useSavings';
import { useSavingsNotifications } from '@/hooks/useSavingsNotifications';
import { SavingsQuickStats, SavingsStreakCard } from '@/components/wallet/SavingsWidget';

function WalletScreen() {
  const { dashboard, refreshDashboard } = useSavings();
  useSavingsNotifications();

  // Show savings section when user has savings
  {dashboard && dashboard.totalSavings > 0 && (
    <SavingsQuickStats />
    <SavingsStreakCard />
  )}
}
```

---

## Data Flow

### Recording Savings

```
User earns cashback/reward
        ↓
walletService.creditCoins()
        ↓
getSavingsType() maps source → type
        ↓
recordSavings() creates entry
        ↓
SavingsSummary updated (async)
SavingsStreak updated (async)
SavingsInsight generated (async)
```

### Loading Dashboard

```
App opens → SavingsContext mounts
        ↓
useSavings() calls getSavingsDashboard()
        ↓
API: GET /api/savings/dashboard
        ↓
Stores in context state
        ↓
Components re-render
```

---

## Savings Types

| Type | Description | Sources |
|------|-------------|---------|
| `cashback` | Cashback earned | orders, payments |
| `reward` | General rewards | achievements, games |
| `referral` | Referral bonuses | invitations |
| `loyalty` | Loyalty points | loyalty program |
| `promo` | Promotional credits | campaigns, bonuses |
| `cashback_bonus` | Bonus cashback | special offers |

---

## Savings Categories

| Category | Keywords |
|----------|----------|
| dining | restaurant, cafe, food, dining |
| groceries | grocery, supermarket, mart |
| entertainment | movie, cinema, game, ticket |
| shopping | shop, retail, mall, fashion |
| travel | flight, hotel, booking |
| health | pharmacy, medical, fitness |
| utilities | bill, recharge, payment |

---

## MongoDB Indexes

Created indexes optimize:

1. **User queries** - By date, type, category
2. **Leaderboards** - Top savers, longest streaks
3. **Aggregations** - Daily/monthly trends
4. **Search** - Full-text on descriptions

---

## Testing

### API Tests

```bash
# Get dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4004/api/savings/dashboard

# Create goal
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Vacation","targetAmount":50000}' \
  http://localhost:4004/api/savings/goals

# Admin export
curl -H "x-admin-token: $ADMIN_TOKEN" \
  "http://localhost:4004/admin/savings/export?period=month&format=csv"
```

### Unit Tests

```bash
cd rez-wallet-service
npm test -- --grep "savings"
```

---

## Environment Variables

### rez-wallet-service

```bash
AUTO_CREATE_INDEXES=true  # Auto-create MongoDB indexes on startup
```

### AML Thresholds (optional)

```bash
AML_DAILY_LIMIT=50000000        # ₹5L daily
AML_WEEKLY_LIMIT=200000000      # ₹20L weekly
AML_STR_THRESHOLD=5000000        # ₹5L STR trigger
AML_CASH_THRESHOLD=10000000      # ₹10L CTR trigger
```

---

## File Structure

```
rez-wallet-service/
├── src/
│   ├── models/
│   │   ├── Savings.ts           # Mongoose schemas
│   │   └── savingsIndexes.ts     # MongoDB indexes
│   ├── services/
│   │   ├── savingsService.ts     # Core business logic
│   │   └── savingsReferralIntegration.ts  # Referral tracking
│   └── routes/
│       ├── savingsRoutes.ts      # Consumer endpoints
│       └── savingsAdminRoutes.ts # Admin endpoints

rez-app-consumer/
├── services/
│   └── savingsApi.ts            # API client
├── contexts/
│   └── SavingsContext.tsx       # State management
├── hooks/
│   ├── useSavings.ts            # Main hook
│   └── useSavingsNotifications.ts  # Notifications
├── components/
│   ├── wallet/
│   │   ├── SavingsDashboard.tsx
│   │   ├── SavingsWidget.tsx
│   │   └── SavingsHero.tsx
│   └── home/
│       └── SavingsHomeWidget.tsx
├── app/
│   ├── savings.tsx               # Main screen
│   ├── savings/
│   │   ├── goals.tsx
│   │   └── history.tsx
└── utils/
    └── notificationDeepLinkHandler.ts  # Deep linking
```

---

## Changelog

### v1.0.0 - Initial Release
- Complete savings tracking system
- Streak tracking with notifications
- Savings goals with milestones
- 30/90/365 day projections
- Personalized insights
- Admin analytics dashboard
- Home screen widgets
- Deep linking for notifications
- MongoDB indexes
- Unit tests
- Referral integration
