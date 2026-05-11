# Growth Services Architecture

**Last Updated:** 2026-05-02

Comprehensive documentation for the Growth Services platform including Ads, Marketing, Notification, Analytics Hub, and Merchant Growth Dashboard.

---

## Table of Contents

1. [Overview](#overview)
2. [The 3 Core Growth Services](#the-3-core-growth-services)
3. [Integration Architecture](#integration-architecture)
4. [Analytics Hub](#analytics-hub)
5. [Merchant Growth Dashboard](#merchant-growth-dashboard)
6. [Event Flow Diagram](#event-flow-diagram)
7. [API Endpoints](#api-endpoints)
8. [Files Created](#files-created)
9. [Service-to-Service Communication](#service-to-service-communication)

---

## Overview

The Growth Services platform enables merchants to acquire, engage, and retain customers through a unified system of ads, marketing campaigns, notifications, and analytics. The platform follows an event-driven architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         GROWTH SERVICES ECOSYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐        │
│   │   rez-ads-      │    │  rez-marketing-  │    │  rez-notification- │        │
│   │   service       │    │  service         │    │  events            │        │
│   │                 │    │                  │    │                    │        │
│   │  Port: 4007    │    │  Port: 4000     │    │  Port: 3001        │        │
│   │                 │    │                  │    │                    │        │
│   │  - Ad Campaigns │    │  - Campaigns    │    │  - Push (Expo)    │        │
│   │  - Ad Serving   │    │  - Broadcasts   │    │  - Email (SG)     │        │
│   │  - Analytics    │    │  - Audience     │    │  - SMS (MSG91)    │        │
│   └────────┬────────┘    │  - Keywords     │    │  - WhatsApp       │        │
│            │              └────────┬─────────┘    └──────────┬────────┘        │
│            │                      │                          │                  │
│            ▼                      ▼                          ▼                  │
│   ┌─────────────────────────────────────────────────────────────────┐          │
│   │                      ANALYTICS HUB                               │          │
│   │                   (analytics-events)                             │          │
│   │                    Port: 3002                                   │          │
│   └─────────────────────────────────────────────────────────────────┘          │
│                                   │                                             │
│                                   ▼                                             │
│   ┌─────────────────────────────────────────────────────────────────┐          │
│   │                  MERCHANT GROWTH DASHBOARD                        │          │
│   │              (rez-merchant-service routes)                       │          │
│   │               Port: 4005 (integrated)                           │          │
│   └─────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## The 3 Core Growth Services

### 1. rez-ads-service (Port 4007)

**Purpose:** Self-serve display advertising platform for merchants

**Key Features:**
- Ad campaign lifecycle management (draft → pending_review → active/rejected → paused/completed)
- Self-serve ad creation with targeting (segments, location, interests)
- Admin review workflow for ad approval
- Ad serving to consumers with CPC/CPM bidding
- Atomic budget tracking with MongoDB aggregation pipeline updates
- Impression and click tracking

**Database:** MongoDB (`adcampaigns` collection)
**Queue:** None (synchronous HTTP)
**Auth:** JWT with three distinct middleware levels (consumer, merchant, admin)

**Data Model: AdCampaign**
```
AdCampaign {
  merchantId, storeId, title, headline, description
  ctaText, ctaUrl, imageUrl, placement
  targetSegment, targetLocation, targetInterests
  bidType (CPC|CPM), bidAmount, dailyBudget, totalBudget, totalSpent
  startDate, endDate, status
  impressions, clicks, ctr (virtual)
  reviewedBy, reviewedAt, rejectionReason
}
```

**Placement Types:**
- `home_banner` - Consumer app home screen
- `explore_feed` - Explore/Discovery section
- `store_listing` - Store detail page
- `search_result` - Search results page

---

### 2. rez-marketing-service (Port 4000)

**Purpose:** Cross-channel campaign engine for merchant-to-consumer outreach

**Key Features:**
- Multi-channel campaigns (WhatsApp, Push, SMS, Email, In-App)
- Audience segmentation (all, recent, lapsed, high_value, new_users, etc.)
- Broadcast messages to user segments
- Keyword bidding for search ads
- Interest-based audience building
- Birthday-targeted campaigns
- AdBazaar bridge for brand partnerships
- Campaign analytics and attribution tracking

**Database:** MongoDB (campaigns, userinterestprofiles, keywordbids)
**Queue:** BullMQ (`mkt-campaigns`, `mkt-interest-sync`)
**Channels:** WhatsApp (Meta Graph API), Push (Expo/FCM), SMS (MSG91/Twilio), Email (SMTP/SES)

**Data Models:**
```
MarketingCampaign {
  merchantId, name, objective, channel, message
  templateName, imageUrl, ctaUrl, ctaText
  audience { segment, location, interests, birthday, ... }
  status, scheduledAt, sentAt, stats
}

UserInterestProfile {
  userId, interests[], primaryLocation, locationHistory[]
  institution, recentSearches[], lastSyncedAt
}

KeywordBid {
  merchantId, keyword, matchType, channel
  bidAmount, bidType, dailyBudget, totalBudget, totalSpent
  impressions, clicks, headline, description, isActive
}
```

---

### 3. rez-notification-events (Port 3001)

**Purpose:** Notification delivery engine - pure worker process

**Key Features:**
- 5-channel notification delivery (Push, Email, SMS, WhatsApp, In-App)
- BullMQ job processing with 10 concurrent workers
- Rate limiting (200 jobs/second)
- Retry policy (5 attempts, exponential backoff)
- Dead Letter Queue (DLQ) handling
- Streak-at-risk scheduler (daily 7 PM UTC cron)
- DLQ log persistence to MongoDB

**Database:** MongoDB (notifications, userdevices, userstreaks, dlq_log)
**Queue:** BullMQ (`notification-events`, `notification-dlq`, `streak-at-risk-scheduler`)

**Job Structure (NotificationEvent):**
```typescript
{
  eventId: string;
  eventType: string; // "coin_earned" | "streak_milestone" | "merchant_broadcast" | ...
  userId: string;
  channels: ["push", "email", "sms", "whatsapp", "in_app"];
  payload: {
    title: string;
    body: string;
    data: {...};
    channelId: "default" | "streaks" | "marketing" | "promotions";
    priority: "default" | "high" | "normal";
    emailSubject?: string;
    emailHtml?: string;
    smsMessage?: string;
    whatsappTemplateId?: string;
    whatsappTemplateVars?: string[];
  };
  category: "behavioral" | "marketing" | "transactional";
  source: string;
  createdAt: string;
}
```

---

## Integration Architecture

### Service Integration Points

```
┌──────────────────┐         ┌──────────────────┐
│  rez-ads-service │         │ rez-marketing-   │
│                  │         │ service          │
│                  │         │                  │
│  [Ad Campaign]   │         │ [Campaign]       │
│  [Ad Serving]    │         │ [Broadcast]      │
└────────┬─────────┘         └────────┬─────────┘
         │                           │
         │  ┌────────────────────┐   │
         └─►│ notification-events│◄──┘
            │                    │
            │  BullMQ Queue      │
            │  Port: 3001        │
            └────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  analytics-events      │
         │  (Analytics Hub)      │
         │  Port: 3002           │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  rez-merchant-service │
         │  (Growth Dashboard)    │
         │  Port: 4005          │
         └───────────────────────┘
```

### Cross-Service Event Flow

| Source | Destination | Event | Purpose |
|--------|------------|-------|---------|
| rez-marketing-service | notification-events | `broadcast.send` job | Deliver campaign notifications |
| rez-marketing-service | notification-events | `campaign.dispatched` job | Campaign delivery tracking |
| rez-backend | notification-events | Behavioral events | Gamification notifications |
| rez-gamification | notification-events | `streak_at_risk` | Streak reminder |
| All services | analytics-events | Analytics events | Aggregate metrics |
| rez-ads-service | Internal | Impression/Click | Track ad performance |

---

## Analytics Hub

**Service:** `analytics-events` (Port 3002)

**Purpose:** Centralized analytics processing and merchant analytics API

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    analytics-events Service                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐     │
│  │  HTTP API   │    │ BullMQ       │    │ Aggregation    │     │
│  │  (Port3002) │    │ Worker       │    │ Scheduler     │     │
│  │             │    │ (analytics-  │    │ (nightly)     │     │
│  │ /api/       │    │  events)     │    │               │     │
│  │ analytics   │    │              │    │               │     │
│  │ /benchmarks │    │              │    │               │     │
│  └──────┬──────┘    └──────┬───────┘    └───────┬────────┘     │
│         │                   │                     │               │
│         └───────────────────┼─────────────────────┘               │
│                             │                                     │
│                             ▼                                     │
│                    ┌────────────────┐                            │
│                    │    MongoDB     │                            │
│                    │                │                            │
│                    │ analyticsevents│                            │
│                    │ dailymetrics   │                            │
│                    │ appevents      │                            │
│                    │ webevents      │                            │
│                    └────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **HTTP API Server (Port 3002)**
   - Merchant analytics queries
   - Benchmark data endpoints
   - Internal service routes

2. **BullMQ Worker (analytics-events queue)**
   - Idempotent event processing
   - Daily metrics aggregation
   - Concurrency: 15, Rate limit: 500/second

3. **Nightly Aggregation Scheduler**
   - Merchant analytics rollup
   - Benchmark calculations
   - Scheduled via node-cron

4. **Health Server (Port 3102)**
   - Liveness/readiness probes
   - Independent from main API

### Endpoints

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/analytics/merchant/:id` | GET | Internal | Merchant analytics data |
| `/api/analytics/summary` | GET | Internal | Summary metrics |
| `/benchmarks` | GET | Internal | Industry benchmarks |
| `/api/analytics/web-events` | POST | None | Web event ingestion |
| `/api/analytics/batch` | POST | None | App event batch ingest |
| `/metrics` | GET | Internal | Prometheus metrics |
| `/health` | GET | None | Health check |

---

## Merchant Growth Dashboard

**Location:** `rez-merchant-service/src/routes/growth.ts`

**Purpose:** Merchant-facing analytics and growth metrics

### Endpoints

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/merchant/growth/metrics` | GET | Merchant | 30-day revenue, customers, orders |
| `/api/merchant/growth/loyal-customers` | GET | Merchant | High-frequency customers |
| `/api/merchant/growth/customer-trend` | GET | Merchant | Monthly customer trends |
| `/api/merchant/growth/push-status` | GET | Merchant | Push notification status |
| `/api/merchant/growth/push` | POST | Merchant | Send push notification |

### Data Sources

1. **StorePayment** - Revenue and transaction data
2. **Store** - Store ownership verification
3. **analytics-events** - Aggregated metrics (via internal API)

### Security

- Store ownership verification on all endpoints
- Merchant ID extracted from JWT token
- Protected routes via `merchantAuth` middleware

---

## Event Flow Diagram

### Ad Campaign Flow

```
Merchant                    rez-ads-service              Admin                   Consumer
   │                             │                        │                          │
   ├── Create Ad ───────────────►│                        │                          │
   │◄─ Ad Created (draft) ───────┤                        │                          │
   │                             │                        │                          │
   ├── Submit for Review ───────►│                        │                          │
   │◄─ Pending Review ───────────┤                        │                          │
   │                             │                        │                          │
   │                             │◄── Approve/Reject ─────┤                          │
   │                             │                        │                          │
   │                             │◄── GET /ads/serve ─────────────────────────────►│
   │                             │                        │                          │
   │                             │◄── POST /ads/impression ────────────────────────│
   │                             │                        │                          │
   │                             │◄── POST /ads/click ────────────────────────────│
   │                             │                        │                          │
   ├── GET /merchant/ads ──────►│                        │                          │
   │◄─ Analytics Data ───────────┤                        │                          │
```

### Marketing Campaign Flow

```
Merchant              rez-marketing-service         notification-events          User
   │                         │                             │                      │
   ├── Create Campaign ─────►│                             │                      │
   │◄─ Campaign Created ─────┤                             │                      │
   │                         │                             │                      │
   ├── Launch Campaign ─────►│                             │                      │
   │                         │◄─ Redis Lock ───────────────│                      │
   │                         │                             │                      │
   │                         │◄─ Broadcast Job ────────────│                      │
   │◄─ Dispatched ───────────┤                             │                      │
   │                         │                             │                      │
   │                         │◄─── Notify User ─────────────────────────────────►│
   │                         │                             │                      │
   ├── GET /campaigns ──────►│                             │                      │
   │◄─ Campaign Stats ───────┤                             │                      │
```

### Analytics Flow

```
Consumer App          rez-merchant-service        analytics-events           MongoDB
    │                        │                          │                       │
    │◄─── User Actions ─────│                          │                       │
    │                        │                          │                       │
    │──► POST /batch ──────────────────────────────────►│                       │
    │                        │                          │                       │
    │                        │◄── GET /analytics/summary │                       │
    │◄── Analytics ──────────│                          │                       │
    │                        │                          │                       │
    │                        │                          │───► Idempotent Upsert │
    │                        │                          │                       │
    │                        │                          │───► Daily Aggregation │
    │                        │                          │                       │
```

---

## API Endpoints

### rez-ads-service (Port 4007)

#### Merchant Routes (`/merchant/ads`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/merchant/ads` | List merchant's ads |
| POST | `/merchant/ads` | Create new ad |
| GET | `/merchant/ads/analytics` | Aggregate stats |
| GET | `/merchant/ads/:id` | Get single ad |
| PUT | `/merchant/ads/:id` | Update draft/rejected ad |
| PATCH | `/merchant/ads/:id/submit` | Submit for review |
| PATCH | `/merchant/ads/:id/pause` | Pause active ad |
| PATCH | `/merchant/ads/:id/activate` | Reactivate paused ad |
| DELETE | `/merchant/ads/:id` | Soft-delete |

#### Admin Routes (`/admin/ads`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/ads` | List all ads |
| GET | `/admin/ads/stats` | Network stats |
| PATCH | `/admin/ads/:id/approve` | Approve ad |
| PATCH | `/admin/ads/:id/reject` | Reject ad |

#### Consumer Routes (`/ads`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/ads/serve?placement=` | Get active ad |
| POST | `/ads/impression` | Record impression |
| POST | `/ads/click` | Record click |

---

### rez-marketing-service (Port 4000)

#### Campaigns (`/campaigns`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/campaigns` | List campaigns |
| POST | `/campaigns` | Create campaign |
| PATCH | `/campaigns/:id` | Update campaign |
| POST | `/campaigns/:id/launch` | Launch campaign |
| POST | `/campaigns/:id/cancel` | Cancel campaign |

#### Broadcasts (`/broadcasts`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/broadcasts` | Create broadcast |
| GET | `/broadcasts/:merchantId` | List broadcasts |
| POST | `/broadcasts/send` | Segment-based send |

#### Audience (`/audience`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/audience/estimate` | Estimate audience size |
| GET | `/audience/interests` | Interest tags |
| GET | `/audience/locations` | Location data |
| POST | `/audience/search-signal` | Record search |

#### Keywords (`/keywords`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/keywords` | List bids |
| POST | `/keywords` | Create bid |
| GET | `/keywords/auction` | Auction results |

---

### analytics-events (Port 3002)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/analytics/merchant/:id` | Internal | Merchant analytics |
| GET | `/api/analytics/summary` | Internal | Summary metrics |
| GET | `/benchmarks` | Internal | Benchmarks |
| POST | `/api/analytics/web-events` | None | Web events |
| POST | `/api/analytics/batch` | None | App batch events |
| GET | `/metrics` | Internal | Prometheus |

---

## Files Created

### Core Growth Services

| File | Service | Purpose |
|------|---------|---------|
| `rez-ads-service/src/` | rez-ads-service | Ad campaign management |
| `rez-marketing-service/src/` | rez-marketing-service | Campaign orchestration |
| `rez-notification-events/src/` | rez-notification-events | Notification delivery |
| `analytics-events/src/` | analytics-events | Analytics processing |

### Merchant Service Routes

| File | Purpose |
|------|---------|
| `rez-merchant-service/src/routes/ads.ts` | Ad management integration |
| `rez-merchant-service/src/routes/campaigns.ts` | Campaign management |
| `rez-merchant-service/src/routes/broadcasts.ts` | Broadcast management |
| `rez-merchant-service/src/routes/growth.ts` | Growth dashboard metrics |
| `rez-merchant-service/src/routes/analytics.ts` | Analytics integration |

### Documentation

| File | Purpose |
|------|---------|
| `rez-ads-service/README.md` | Ads service documentation |
| `rez-marketing-service/README.md` | Marketing service documentation |
| `rez-notification-events/README.md` | Notification service documentation |
| `SOURCE-OF-TRUTH/GROWTH-SERVICES-ARCHITECTURE.md` | This document |

---

## Service-to-Service Communication

### Authentication Pattern

All internal service calls use scoped tokens:

```bash
# Environment variable
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}

# Request headers
x-internal-token: <token>
x-internal-service: <caller-service-name>
```

### Service URLs

| Service | Environment Variable | Default Port |
|---------|-------------------|--------------|
| rez-ads-service | `REZ_ADS_SERVICE_URL` | 4007 |
| rez-marketing-service | `MARKETING_SERVICE_URL` | 4000 |
| rez-notification-events | `NOTIFICATION_EVENTS_URL` | 3001 |
| analytics-events | `ANALYTICS_EVENTS_URL` | 3002 |

### Queue Configuration

| Queue | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `notification-events` | marketing, backend | notification-events | Notification delivery |
| `mkt-campaigns` | marketing | marketing | Campaign processing |
| `mkt-interest-sync` | marketing | marketing | Interest sync |
| `analytics-events` | all services | analytics-events | Analytics processing |

### Redis Keys

| Pattern | Service | Purpose | TTL |
|---------|---------|---------|-----|
| `wa:mkt:msgid:{messageId}` | marketing | WhatsApp receipt lookup | 7 days |
| `wa:mkt:dedup:{campaignId}:{phone}` | marketing | WhatsApp deduplication | 24 hours |
| `lock:campaign:launch:{id}` | marketing | Launch lock | 30 seconds |
| `ratelimit:web-event:{ip}` | analytics | Rate limiting | 60 seconds |

---

## Environment Variables

### Required for Growth Services

| Variable | Services | Description |
|----------|----------|-------------|
| `MONGODB_URI` | All | MongoDB connection string |
| `REDIS_URL` | marketing, notification, analytics | Redis connection URL |
| `JWT_SECRET` | ads | JWT signing secret |
| `INTERNAL_SERVICE_TOKENS_JSON` | marketing, analytics | Service auth tokens |

### Channel Providers

| Variable | Service | Description |
|----------|---------|-------------|
| `WHATSAPP_TOKEN` | marketing | Meta WhatsApp API token |
| `WHATSAPP_PHONE_ID` | marketing | Meta phone number ID |
| `SMTP_HOST/PORT/USER/PASS` | marketing | SMTP for email |
| `MSG91_AUTH_KEY` | marketing, notification | MSG91 for SMS |
| `SENDGRID_API_KEY` | notification | SendGrid for email |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN` | notification | Twilio WhatsApp |

---

**Last Updated:** 2026-05-02
