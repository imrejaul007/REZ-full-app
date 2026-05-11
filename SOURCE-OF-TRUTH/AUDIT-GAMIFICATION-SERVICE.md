# REZ Gamification Service - Audit Report

**Service:** `rez-gamification-service`
**Version:** 1.0.0
**Node:** 20.x
**Port:** 3004
**Audited:** 2026-05-05

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [How REZ Coins Work](#how-rez-coins-work)
4. [How Badges/Achievements Work](#how-badgesachievements-work)
5. [How Levels/Tiers Work](#how-levelstiers-work)
6. [How Streaks Work](#how-streaks-work)
7. [API Endpoints](#api-endpoints)
8. [Workers & Queues](#workers--queues)
9. [Database Collections](#database-collections)
10. [Issues & Bugs Found](#issues--bugs-found)
11. [Security Considerations](#security-considerations)
12. [File Structure](#file-structure)

---

## Architecture Overview

The Gamification Service is a **standalone BullMQ Worker Service** extracted from the REZ monolith using the Strangler Fig pattern. It handles:

- **Coins:** REZ coin credits via wallet service integration
- **Achievements/Badges:** Milestone-based unlockable badges
- **Streaks:** Daily activity tracking with IST timezone support
- **Leaderboards:** Top users by lifetime coins with Redis caching
- **Challenges:** Competition system (partially implemented)
- **Missions:** Task-based progress tracking
- **Notifications:** Multi-channel (push, email, SMS, in-app)

**Tech Stack:**
- Express.js (HTTP API)
- BullMQ (job queue processing)
- IORedis (Redis connections)
- Mongoose (MongoDB)
- Winston (logging)
- Sentry (error tracking)

**Multiple Redis Connections:**
- `bullmqRedis`: BullMQ queue operations
- `appRedis`: Application-level caching and rate limiting

---

## Features

### 1. REZ Coins System

**Source of Coins:**

| Source | Amount | Trigger |
|--------|--------|---------|
| Store Payment (online) | 50 coins | `store_payment_confirmed` event |
| POS Payment (in-store) | Varies | `pos_bill_paid` event |
| Visit Check-in | 10 coins | `visit_checked_in` event |
| Visit Milestone (7 visits) | 50 coins | `/internal/visit` endpoint |
| Visit Milestone (30 visits) | 200 coins | `/internal/visit` endpoint |
| Visit Milestone (100 visits) | 500 coins | `/internal/visit` endpoint |
| Achievement Unlocks | 25-200 coins | Achievement definitions |

**Coin Flow:**
1. Events published to `gamification-events` queue
2. Worker processes events and credits wallet service
3. Wallet service performs atomic `$inc` on `wallets` collection
4. Audit entry written to `coinledgers` collection

**Key Files:**
- `/src/httpServer.ts` - `creditCoinsViaWalletService()` function
- `/src/worker.ts` - `COIN_AWARD_DEFAULTS` mapping

---

### 2. Achievements/Badges System

**Achievement Definitions** (from `/src/workers/achievementWorker.ts`):

| ID | Name | Description | Coins | Condition |
|----|------|-------------|-------|-----------|
| `first_checkin` | First Visit | Complete your first store check-in | 25 | visit_count >= 1 |
| `fifth_checkin` | Regular | Visit stores 5 times | 75 | visit_count >= 5 |
| `tenth_checkin` | Loyal Customer | Visit stores 10 times | 150 | visit_count >= 10 |
| `first_streak` | Streak Starter | Achieve a 3-day streak | 50 | streak >= 3 |
| `week_streak` | Week Warrior | Achieve a 7-day streak | 150 | streak >= 7 |
| `coin_century` | Century Club | Earn 100 REZ coins | 50 | total_coins >= 100 |
| `coin_thousand` | High Roller | Earn 1000 REZ coins | 200 | total_coins >= 1000 |

**Achievement Processing:**
1. `visit_checked_in` event triggers achievement worker
2. Worker fetches user stats (visits, streak, coins)
3. Checks against all unearned achievements
4. Awards coins via wallet service (wallet FIRST, ledger SECOND)
5. Records achievement in `userachievements` collection
6. Sends achievement notification

---

### 3. Streaks System

**Streak Types:**

| Type | Trigger Events |
|------|----------------|
| `login` | `login`, `daily_checkin` events |
| `order` | `order_placed`, `order_delivered` events |
| `review` | `review_submitted` event |
| `store_visit` | `visit_checked_in`, `store_payment_confirmed`, `pos_bill_paid` events |
| `savings` | `store_payment_confirmed`, `pos_bill_paid` events |

**Streak Milestones** (from `/src/config/streakMilestones.ts`):

| Days | Bonus Coins |
|------|-------------|
| 3 | 50 coins |
| 7 | 200 coins |
| 30 | 500 coins |

**Streak Logic (IST Timezone):**
- Uses IST (UTC+5:30) for day boundaries
- Users active between 00:00-05:30 IST not penalized
- Consecutive day detection prevents double-counting
- Atomic upsert prevents TOCTOU race conditions

**Key File:** `/src/workers/storeVisitStreakWorker.ts`

---

### 4. Leaderboard System

**Leaderboard Types:**
- **Weekly Leaderboard:** Top users by weekly coins
- **Monthly Leaderboard:** Top users by monthly coins
- **Lifetime Leaderboard:** Top users by all-time coins
- **Challenge Leaderboard:** Per-challenge rankings

**Tier System** (from `/src/services/leaderboardService.ts`):

| Tier | Coin Range | Name |
|------|------------|------|
| Bronze | 0-499 | Bronze |
| Silver | 500-1999 | Silver |
| Gold | 2000-4999 | Gold |
| Platinum | 5000+ | Platinum |

**Caching:**
- Redis-backed cache with 60-second TTL
- Invalidation on leaderboard-affecting events
- Cross-instance cache coherency via shared Redis

---

### 5. Challenge System

**Challenge Interface:**
```typescript
interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'event';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  goals?: Array<{ target: number; reward: { type: string; amount?: number } }>;
  rewards?: Array<{ type: string; amount?: number }>;
  maxParticipants?: number;
}
```

**WARNING: Challenge Service is NOT fully implemented.** All database methods return stub values:
- `listChallenges()` returns `{ challenges: [], total: 0 }`
- `getChallenge()` returns `null`
- `getUserChallenges()` returns `[]`
- `joinChallenge()` does nothing
- `getUserRank()` returns `null`

---

### 6. Mission System

**Mission Tracking:**
- User missions stored in `usermissions` collection
- Tasks have `eventType` triggers
- Progress updated via `UserMission.updateMany()` in worker
- Supports task-based objectives with progress counters

---

### 7. Notification System

**Multi-Channel Support:**
- Push notifications
- In-app notifications
- Email
- SMS
- WhatsApp

**Notification Types:**
| Event | Channel | Priority |
|-------|---------|----------|
| `coin_earned` | push, in_app | default |
| `achievement_unlocked` | push, in_app | high |
| `streak_milestone` | push, in_app | high |
| `streak_at_risk` | push, email, sms | high |
| `leaderboard_rank_changed` | push, in_app | varies |
| `referral_bonus` | push, in_app | default |

---

## API Endpoints

### Health Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Liveness probe |
| GET | `/healthz` | None | Health alias |
| GET | `/health/live` | None | K8s liveness |
| GET | `/health/ready` | None | K8s readiness |
| GET | `/health/detailed` | None | Comprehensive health |

### Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/leaderboard` | Internal | Top 10 leaderboard |
| GET | `/challenges` | None | List challenges |
| GET | `/challenges/:id` | None | Get challenge details |
| GET | `/challenges/:id/leaderboard` | None | Challenge leaderboard |

### Authenticated Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/achievements/:userId` | JWT | User achievements |
| GET | `/streak/:userId` | JWT | User streak info |
| GET | `/leaderboard/me` | JWT | User's leaderboard rank |
| GET | `/challenges/active` | JWT | User's active challenges |
| POST | `/challenges/:id/join` | JWT | Join a challenge |
| GET | `/challenges/:id/leaderboard/me` | JWT | User's challenge rank |
| GET | `/karma-leaderboard` | Optional | Karma rankings |
| GET | `/karma-leaderboard/my-rank` | JWT | User's karma rank |

### Internal Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/internal/visit` | Internal Token | Record store visit |
| GET | `/internal/dlq/:queueName` | Internal Token | View DLQ entries |
| GET | `/metrics` | Internal Token | Prometheus metrics |
| POST | `/challenges` | Internal Token | Create challenge |
| PUT | `/challenges/:id/activate` | Internal Token | Activate challenge |
| DELETE | `/challenges/:id` | Internal Token | Cancel challenge |

---

## Workers & Queues

### Queue Architecture

```
gamification-events (Main Worker)
├── Achievement progress update
├── Challenge progress update
├── Streak update
├── Leaderboard invalidation
├── Mission progress
├── Coin earned notification
└── Forward to achievement-events (visit_checked_in)

achievement-events (Achievement Worker)
└── Visit check-in achievements

store-visit-events (Store Visit Streak Worker)
└── Streak tracking + milestone bonuses

notification-events (External Service)
└── Multi-channel notifications
```

### Worker Configuration

| Worker | Queue | Concurrency | Limiter |
|--------|-------|--------------|---------|
| Gamification Worker | `gamification-events` | 5 | 100/second |
| Achievement Worker | `achievement-events` | 5 | 100/second |
| Streak Worker | `store-visit-events` | 5 | 100/second |

### Event Types Processed

| Event Type | Achievement | Challenge | Streak | Leaderboard | Mission |
|------------|-------------|-----------|--------|-------------|---------|
| `order_placed` | orders_placed | order_count | order | Yes | Yes |
| `order_delivered` | orders_completed | order_count | order | Yes | No |
| `review_submitted` | reviews_written | review_count | review | Yes | No |
| `referral_completed` | referrals_made | refer_friends | No | Yes | No |
| `login` | login_count | login_streak | login | No | No |
| `daily_checkin` | checkin_count | login_streak | login | Yes | No |
| `bill_uploaded` | bills_uploaded | upload_bills | No | Yes | No |
| `social_share` | shares_count | share_deals | No | No | No |
| `offer_redeemed` | offers_redeemed | visit_stores | No | No | No |
| `game_won` | games_won | No | No | Yes | No |
| `store_payment_confirmed` | payments_made | visit_stores | savings | Yes | No |
| `pos_bill_paid` | payments_made | visit_stores | savings | Yes | No |
| `visit_checked_in` | No | No | No | No | No |

---

## Database Collections

### Gamification Collections

| Collection | Indexes | Purpose |
|------------|---------|---------|
| `userachievements` | `{ userId: 1 }`, `{ userId: 1, achievementId: 1 }` | Earned achievements |
| `userachievementprogresses` | `{ userId: 1 }` | Metric counters |
| `userstreaks` | `{ userId: 1, type: 1 }`, `{ type: 1, updatedAt: 1 }` | Streak data |
| `userchallengeprogresses` | `{ userId: 1, status: 1 }` | Challenge progress |
| `usermissions` | `{ userId: 1, status: 1 }` | Mission progress |
| `uservisitcounts` | `{ userId: 1 }` | Visit counters |
| `processedvisitevents` | `{ eventId: 1 }` | Idempotency |
| `coinledgers` | `{ dedupKey: 1 }` | Audit trail |

### Shared Collections

| Collection | Purpose |
|------------|---------|
| `wallets` | User coin balances |
| `cointransactions` | Coin transaction history |
| `storevisits` | Visit history |
| `users` | User profiles |
| `challenges` | Challenge definitions |

---

## Issues & Bugs Found

### Critical Issues

#### 1. **Challenge Service is Stub Implementation**
**File:** `/src/services/challengeService.ts`
**Severity:** Critical - Feature not functional

All database methods return stub/empty values:
- `listChallenges()` returns empty array
- `getChallenge()` returns null
- `joinChallenge()` does nothing
- `getUserRank()` returns null

**Impact:** Challenge feature is completely non-functional.

---

### High Priority Issues

#### 2. **Missing Database Index on `cointransactions`**
**File:** `/src/config/mongodb.ts` (comment at line 45)

The recommended index `{ type: 1, user: 1, amount: 1 }` is NOT created. Leaderboard queries do full collection scans.

**Impact:** Performance degradation as `cointransactions` grows.

---

### Medium Priority Issues

#### 3. **Marketing Service Queue Collision**
**File:** `/src/services/marketingService.ts` (line 16)

Marketing service uses `notification-events` queue (same as notification service).

**Impact:** Potential message ordering/conflicts between marketing and notification systems.

---

#### 4. **No Dead Letter Queue Consumer**
**File:** `/src/httpServer.ts` (DLQ endpoints only)

DLQ entries can be viewed but never reprocessed automatically.

**Impact:** Failed jobs accumulate without recovery mechanism.

---

#### 5. **Game Config Subscription Does Nothing**
**File:** `/src/gameConfigSubscription.ts`

Subscription receives config updates but does not apply them.

**Impact:** Dynamic configuration changes require service restart.

---

### Low Priority Issues

#### 6. **Intent Capture Failures Are Silent**
**File:** `/src/services/intentCaptureService.ts`

Failed intent tracking only logs warnings, no alerting or retry mechanism.

---

#### 7. **Rate Limiter Fails Closed**
**File:** `/src/middleware/rateLimiter.ts`

When Redis is unavailable, rate limiting returns 503. In multi-instance deployments, this could cause service degradation.

---

## Security Considerations

### Authentication

| Endpoint Type | Auth Method |
|---------------|-------------|
| Public | None |
| User endpoints | JWT (HS256) |
| Internal endpoints | HMAC token + IP allowlist |

### Security Fixes Applied

| Fix ID | Description |
|--------|-------------|
| GAM-SEC-01 | IDOR prevention on user-specific endpoints |
| GAM-HIGH-03 | Non-finite coin amount validation |
| GAM-HIGH-01 | Dead letter queue error propagation |
| BE-GAM-007 | Wallet service URL validation at startup |
| HIGH-09 | HMAC key loaded from environment |
| BAK-CROSS-012 | Blank token rejection |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `PORT` | No | 3004 | HTTP server port |
| `INTERNAL_SERVICE_TOKEN` | Yes | - | Internal API authentication |
| `WALLET_SERVICE_URL` | Yes | - | Wallet service endpoint |
| `INTENT_CAPTURE_URL` | Yes | - | Analytics endpoint |
| `JWT_SECRET` | Yes | - | JWT verification key |
| `SENTRY_DSN` | No | - | Sentry error tracking |
| `LOG_LEVEL` | No | info | Logging level |

---

## File Structure

```
rez-gamification-service/
├── src/
│   ├── index.ts                      # Main entry point
│   ├── httpServer.ts                 # Express HTTP server + endpoints
│   ├── worker.ts                     # Main gamification worker
│   ├── gameConfigSubscription.ts     # Dynamic config listener
│   ├── workers/
│   │   ├── achievementWorker.ts      # Achievement evaluation
│   │   └── storeVisitStreakWorker.ts # Streak tracking
│   ├── services/
│   │   ├── challengeService.ts       # Challenge system (STUB)
│   │   ├── leaderboardService.ts     # Leaderboard + tiers
│   │   ├── notificationService.ts    # Multi-channel notifications
│   │   ├── marketingService.ts       # Marketing integrations
│   │   └── intentCaptureService.ts   # Analytics tracking
│   ├── middleware/
│   │   ├── auth.ts                   # JWT authentication
│   │   ├── internalAuth.ts           # HMAC internal auth
│   │   ├── rateLimiter.ts            # Redis rate limiting
│   │   └── tracing.ts                # W3C trace propagation
│   ├── config/
│   │   ├── logger.ts                 # Winston logger
│   │   ├── redis.ts                  # Redis connections
│   │   ├── mongodb.ts                # MongoDB connection + indexes
│   │   └── streakMilestones.ts       # Streak milestone config
│   └── utils/
│       └── response.ts               # Response helpers
├── test/
│   └── gamification.test.ts          # (Does not exist yet)
├── Dockerfile
├── docker-compose.yml               # (Not present)
├── package.json
├── tsconfig.json
├── .env.example
├── .eslintrc.json
├── .gitignore
├── README.md
└── CLAUDE.md                        # Claude Code config
```

---

## Summary

**Total Features:** 7 major feature areas
**Fully Implemented:** 6
**Stub/Placeholder:** 1 (Challenge System)

### How REZ Coins Work:
1. Events trigger coin credits via wallet service
2. Wallet service performs atomic `$inc` on `wallets` collection
3. Audit trail written to `coinledgers`
4. Notifications sent for coin-earning events

### How Badges Work:
1. Achievement worker evaluates user stats on each visit
2. Unlocked achievements credit coins and notify user
3. Achievement definitions define conditions and rewards

### How Levels/Tiers Work:
1. Based on lifetime REZ coins
2. Bronze (0-499), Silver (500-1999), Gold (2000-4999), Platinum (5000+)
3. Displayed on leaderboard entries

### How Streaks Work:
1. IST timezone for day boundaries
2. Atomic upsert prevents race conditions
3. Milestone bonuses at 3, 7, 30 days
4. Idempotent processing via eventId dedup

---

*Report generated: 2026-05-05*
*Auditor: Claude Code*
