# CREATOR QR - COMPLETE SOURCE OF TRUTH

**Last Updated:** 2026-05-12
**Status:** Production Ready
**Company:** REZ-Consumer

---

## EXECUTIVE SUMMARY

**Creator QR** is the personal commerce layer of the ReZ ecosystem that turns individuals into mini businesses. It allows creators, influencers, freelancers, coaches, consultants, and professionals to sell services, consultations, bookings, promotions, and digital products through QR codes, bio links, and ReZ ecosystem integrations.

### URL Structure

```
creators.rez.money/{username}
Example: creators.rez.money/rahulfitness
```

### URL Short Formats

| Type | Format | Example |
|------|--------|---------|
| Creator QR | `rez.app/c/{username}` | `rez.app/c/rahulfitness` |
| Listing QR | `rez.app/c/{listingId}` | `rez.app/c/abc123` |
| Booking QR | `rez.app/b/{bookingId}` | `rez.app/b/xyz789` |

---

## WHAT MAKES CREATOR QR DIFFERENT

| Platform | Focus | Model |
|---------|-------|-------|
| Linktree | Links | Link aggregation |
| Beacons | Content | Content-first |
| Stan Store | Subscriptions | Fan subscription |
| **Creator QR** | **Commerce** | **Transaction-first** |

Creator QR is **transaction-first, service-first, and commerce-first** — not just a link page.

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CREATOR QR ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      SERVICE LAYER                                     │  │
│  │   rez-creator-qr-service (Port 4008)                               │  │
│  │   ├── Creator Profiles → MongoDB                                     │  │
│  │   ├── Listings → MongoDB                                              │  │
│  │   ├── Bookings → MongoDB                                             │  │
│  │   ├── Promotions → MongoDB                                            │  │
│  │   ├── QR Codes → MongoDB                                             │  │
│  │   └── Analytics → Redis Cache                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                  REZ ECOSYSTEM INTEGRATIONS                           │  │
│  │                                                                       │  │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│  │   │ Wallet  │ │Payment  │ │  Chat   │ │  Mind   │ │  Karma  │  │  │
│  │   │Service  │ │Service  │ │Service  │ │Service  │ │Service  │  │  │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │
│  │                                                                       │  │
│  │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │  │
│  │   │BuzzLocal│ │  Auth   │ │ Intent  │ │  Karma  │               │  │
│  │   │Service  │ │Service  │ │ Service │ │  App    │               │  │
│  │   └─────────┘ └─────────┘ └─────────┘ └─────────┘               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FEATURE SPECIFICATIONS

### 1. CREATOR PROFILE

| Feature | Description | Required |
|---------|-------------|----------|
| `username` | Unique URL slug | Yes |
| `displayName` | Public name | Yes |
| `bio` | Description (500 chars) | No |
| `avatar` | Profile image URL | No |
| `coverImage` | Header image URL | No |
| `category` | Primary category | Yes |
| `tags` | Search keywords (10 max) | No |
| `socialLinks` | Social media links | No |

#### Categories

| Category | Code | Description |
|----------|------|-------------|
| Fitness | `fitness` | Trainers, coaches |
| Consulting | `consulting` | Business, career |
| Freelance | `freelance` | Designers, developers |
| Beauty | `beauty` | Makeup, skincare |
| Events | `events` | Event planners |
| Coaching | `coaching` | Life, business |
| Education | `education` | Tutors, courses |
| Business | `business` | Consultants |
| Lifestyle | `lifestyle` | Influencers |
| Tech | `tech` | Developers, designers |
| Other | `other` | Miscellaneous |

#### Social Platforms

| Platform | Code | Display |
|----------|------|---------|
| Instagram | `instagram` | Followers |
| YouTube | `youtube` | Subscribers |
| Twitter | `twitter` | Followers |
| LinkedIn | `linkedin` | Connections |
| TikTok | `tiktok` | Followers |
| Website | `website` | URL |

#### Trust Layer

| Metric | Calculation | Display |
|--------|------------|---------|
| Rating | Average of all reviews (1-5) | ⭐ 4.8 |
| Review Count | Total reviews | 156 reviews |
| Response Time | Avg time to respond | 2.5 hours |
| Completion Rate | Completed/Total bookings | 94% |
| Member Since | Account creation date | Mar 2024 |

---

### 2. TIER SYSTEM

| Tier | Min Bookings | Commission Rate | Badge |
|------|-------------|-----------------|-------|
| Starter | 0 | 10% | 🆕 |
| Bronze | 10 | 12% | 🥉 |
| Silver | 50 | 15% | 🥈 |
| Gold | 200 | 18% | 🥇 |
| Platinum | 500 | 20% | 💎 |

**Note:** Bookings include both service bookings and completed promotions.

---

### 3. LISTINGS SYSTEM (4 LOCKED TYPES)

#### Listing Schema

```typescript
interface Listing {
  _id: string;
  creatorId: string;
  type: 'service' | 'consulting' | 'booking' | 'promotion' | 'product';
  title: string; // max 200 chars
  description: string; // max 5000 chars
  price: number; // in INR
  currency: 'INR';
  delivery: 'instant' | 'scheduled' | 'manual';
  active: boolean;
  status: 'draft' | 'active' | 'paused' | 'archived';
  views: number;
  bookings: number;
  rating: number;
  createdAt: Date;
}
```

#### Service Listing

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | Yes |
| price | number | Yes |
| delivery | 'manual' | Yes |
| requirements | string[] | No |
| includes | string[] | No |

**Example:**
```
Personal Training Plan → ₹999
- Includes: Custom workout plan, diet guide, weekly check-ins
- Requirements: Current fitness level, goals
- Delivery: Manual (Google Drive link)
```

#### Consulting Listing

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | Yes |
| price | number | Yes |
| delivery | 'scheduled' | Yes |
| duration | number (minutes) | Yes |
| slots | TimeSlot[] | Yes |

**Example:**
```
Business Strategy Call → ₹4,999
- Duration: 60 minutes
- Slots: Mon-Fri, 10 AM - 6 PM
- Includes: Recording, action plan
- Delivery: Scheduled video call
```

#### Booking Listing

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | Yes |
| price | number | Yes |
| delivery | 'scheduled' | Yes |
| duration | number (minutes) | Yes |
| slots | TimeSlot[] | Yes |
| maxBookingsPerSlot | number | Yes |

**Example:**
```
Yoga Session → ₹499
- Duration: 45 minutes
- Slots: Daily, 6 AM - 9 PM
- Max per slot: 5 bookings
- Delivery: Video call
```

#### Promotion Listing

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | Yes |
| price | number | Yes |
| delivery | 'manual' | Yes |
| platform | enum | Yes |
| deliverables | string[] | Yes |
| revisions | number | No |

**Platforms:**

| Platform | Code | Price Range |
|----------|------|-------------|
| Instagram Story | `instagram_story` | ₹500-5,000 |
| Instagram Post | `instagram_post` | ₹1,000-15,000 |
| Instagram Reel | `instagram_reel` | ₹2,000-25,000 |
| YouTube | `youtube` | ₹5,000-50,000 |
| Twitter | `twitter` | ₹500-5,000 |
| TikTok | `tiktok` | ₹1,000-10,000 |

**Example:**
```
Instagram Reel Promotion → ₹5,000
- Platform: Instagram Reel (15-60 sec)
- Deliverables: 1 main reel, 2 story mentions
- Revisions: 1
- Includes: Brand mention, swipe-up link
```

#### Product Listing

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | Yes |
| price | number | Yes |
| delivery | 'instant' | Yes |
| fileUrl | string | Yes |
| fileType | string | No |

**Example:**
```
Complete Fitness E-Book → ₹299
- Format: PDF
- Pages: 120
- Delivery: Instant download link
```

---

### 4. BOOKING SYSTEM

#### Booking Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BOOKING FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User selects listing                                                 │
│         │                                                             │
│         ▼                                                             │
│  ┌─────────────────┐                                                │
│  │  Select Time     │ (For scheduled)                               │
│  │  Slot            │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Enter           │ (Requirements, notes)                         │
│  │  Requirements    │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Make Payment    │                                               │
│  │  (Escrow held)   │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Booking         │ (Status: pending → confirmed)              │
│  │  Created          │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Creator        │ (Accept/Decline within 24h)                  │
│  │  Confirmation    │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│    ┌─────┴─────┐                                                    │
│    │           │                                                    │
│    ▼           ▼                                                    │
│  Accepted    Declined                                               │
│    │           │                                                    │
│    ▼           ▼                                                    │
│  Delivery    Refund                                                 │
│    │                                                             │
│    ▼                                                             │
│  Completed                                                      │
│    │                                                             │
│    ▼                                                             │
│  Review Submitted                                                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Booking Statuses

| Status | Description | Buyer Action | Creator Action |
|--------|-------------|-------------|----------------|
| `pending` | Awaiting creator confirmation | Wait | Accept/Decline |
| `confirmed` | Creator accepted | View details | Deliver service |
| `in_progress` | Service being delivered | Wait | Submit work |
| `completed` | Service delivered | Confirm receipt | Get paid |
| `cancelled` | Booking cancelled | Refund (if applicable) | N/A |
| `disputed` | Dispute raised | Await resolution | Await resolution |

---

### 5. PROMOTION/COLLAB SYSTEM

#### Promotion Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PROMOTION FLOW                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Brand creates campaign brief                                         │
│         │                                                             │
│         ▼                                                             │
│  ┌─────────────────┐                                                │
│  │  Select Creator  │                                               │
│  │  Send Offer       │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Creator Reviews │                                               │
│  │  & Accepts       │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Payment Held    │ (Escrow)                                     │
│  │  in Escrow        │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Creator Creates │                                               │
│  │  Content          │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Brand Reviews   │ (Revision if needed)                          │
│  │  & Approves      │                                               │
│  └────────┬────────┘                                                │
│           │                                                          │
│    ┌─────┴─────┐                                                    │
│    │           │                                                    │
│    ▼           ▼                                                    │
│  Approved    Revision                                                 │
│    │           │ (Back to content creation)                          │
│    ▼           │                                                     │
│  Escrow Released                                                     │
│    │                                                             │
│    ▼                                                             │
│  Creator Paid                                                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Promotion Statuses

| Status | Description |
|--------|-------------|
| `draft` | Creator saved but not submitted |
| `pending_creator` | Awaiting creator acceptance |
| `in_progress` | Creator working on content |
| `submitted` | Content submitted for review |
| `revision_requested` | Brand requested changes |
| `completed` | Content approved, payment released |
| `cancelled` | Campaign cancelled |
| `disputed` | Dispute raised |

---

### 6. PAYMENT SYSTEM

#### Fee Structure

| Component | Amount | Description |
|-----------|--------|-------------|
| Platform Fee | 10% | Service fee |
| Creator Earnings | 90% | After platform fee |

**Escrow for Promotions:**
- Full amount held in escrow upon booking
- Released to creator upon brand approval
- Refunded to brand if cancelled

#### Payment Methods

| Method | Code | Processing |
|--------|------|------------|
| UPI | `upi` | Instant |
| Card | `card` | 2-3 days |
| Razorpay | `razorpay` | 2-3 days |
| Wallet | `wallet` | Instant |

#### Payout Schedule

| Tier | Payout | Timing |
|------|--------|--------|
| All tiers | Weekly | Every Friday |
| Platinum | Daily | Next business day |

---

### 7. QR CODES

#### QR Payload Structure

```typescript
// Creator QR
interface CreatorQRPayload {
  type: 'creator';
  creatorId: string;
  username: string;
  v: 1;
}

// Listing QR
interface ListingQRPayload {
  type: 'listing';
  creatorId: string;
  listingId: string;
  v: 1;
}

// Booking QR
interface BookingQRPayload {
  type: 'booking';
  creatorId: string;
  listingId: string;
  bookingId: string;
  v: 1;
}
```

#### QR URL Patterns

| QR Type | Short URL | Full URL |
|---------|-----------|----------|
| Creator | `rez.app/c/{username}` | `creators.rez.money/{username}` |
| Listing | `rez.app/c/{listingId}` | `creators.rez.money/{username}/{listingId}` |
| Booking | `rez.app/b/{bookingId}` | `creators.rez.money/{username}/bookings/{bookingId}` |

---

### 8. ANALYTICS

#### Creator Dashboard Metrics

| Section | Metrics |
|---------|---------|
| **Overview** | Total earnings, pending earnings, this month |
| **Bookings** | Total, pending, completed, cancelled |
| **Listings** | Views, clicks, conversion rate |
| **Promotions** | Active, completed, earnings |
| **QR Performance** | Scans, conversions |
| **Reviews** | Rating, review count |

#### QR Analytics

| Metric | Description |
|--------|-------------|
| Scans | Total QR scans |
| Conversions | Scans that resulted in bookings |
| Conversion Rate | Scans / Conversions |

---

### 9. REZ ECOSYSTEM CONNECTIONS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ECOSYSTEM INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   Creator QR ──┬──► ReZ Wallet ──► Payments, Payouts                 │
│               │                                                         │
│               ├──► ReZ Payment ──► UPI, Card, Razorpay               │
│               │                                                         │
│               ├──► ReZ Chat ───► Creator-Buyer messaging           │
│               │                                                         │
│               ├──► ReZ Mind ───► Intent tracking                   │
│               │         │                                             │
│               │         └──► Recommendations                        │
│               │                                                         │
│               ├──► ReZ Intent Graph ──► Attribution                │
│               │                                                         │
│               ├──► ReZ Karma ───► Points, rewards                   │
│               │                                                         │
│               ├──► AdBazaar ───► Creator marketplace                │
│               │         │                                             │
│               │         ├──► Creator sync                          │
│               │         ├──► Campaign push                          │
│               │         └──► Attribution tracking                   │
│               │                                                         │
│               ├──► BuzzLocal ───► Local creator network             │
│               │                                                         │
│               └──► REZ App ───► Consumer app                       │
│                           │                                         │
│                           └──► QR Scanner                          │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Service Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Wallet | `wallet.rezapp.com` | Balance, transactions |
| Payment | `payment.rezapp.com` | Checkout, refunds |
| Chat | `chat.rezapp.com` | Messaging |
| Mind | `mind.rezapp.com` | AI recommendations |
| Intent Graph | `intent.rezapp.com` | Attribution |
| Karma | `karma.rezapp.com` | Gamification |
| BuzzLocal | `buzzlocal.rezapp.com` | Local discovery |
| Auth | `auth.rezapp.com` | Identity |

---

## API REFERENCE

### Base URL

```
Production: https://creator-qr.rezapp.com/api
Staging: https://creator-qr-staging.rezapp.com/api
Local: http://localhost:3005/api
```

### Authentication

```bash
# Include JWT token in Authorization header
Authorization: Bearer <token>
# Internal service calls
X-Internal-Token: <service-token>
```

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators` | List all creators |
| GET | `/api/creators/featured` | Featured creators |
| GET | `/api/creators/:id` | Get creator by ID |
| GET | `/api/listings` | Get trending listings |
| GET | `/api/listings/:id` | Get listing details |
| GET | `/api/qr/:shortUrl` | Resolve QR code |
| GET | `/api/health` | Health check |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/creators` | Create creator profile |
| PUT | `/api/creators/:id` | Update profile |
| GET | `/api/creators/:id/analytics` | Creator analytics |
| POST | `/api/listings` | Create listing |
| PUT | `/api/listings/:id` | Update listing |
| DELETE | `/api/listings/:id` | Delete listing |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings/my` | My bookings |
| GET | `/api/bookings/:id` | Booking details |
| POST | `/api/bookings/:id/confirm` | Confirm booking |
| POST | `/api/bookings/:id/complete` | Complete booking |
| POST | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/bookings/:id/deliver` | Deliver content |

### Review Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews` | Get reviews |

### Promotion Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/promotions` | Create promotion |
| GET | `/api/promotions` | Get promotions |
| POST | `/api/promotions/:id/accept` | Accept promotion |
| POST | `/api/promotions/:id/reject` | Reject promotion |
| POST | `/api/promotions/:id/submit` | Submit content |
| POST | `/api/promotions/:id/request_revision` | Request revision |
| POST | `/api/promotions/:id/approve` | Approve & pay |

---

## DATABASE SCHEMAS

### Collections

| Collection | Purpose | Indexes |
|-----------|---------|---------|
| `creatorprofiles` | Creator profiles | userId, username, status, category |
| `listings` | All listings | creatorId, type, status |
| `bookings` | Bookings | creatorId, buyerId, status |
| `promotions` | Promotions | creatorId, brandUserId, status |
| `qrcodes` | QR codes | creatorId, shortUrl, type |
| `reviews` | Reviews | creatorId, bookingId |
| `disputes` | Disputes | bookingId, status |
| `payments` | Payments | userId, creatorId, status |

---

## STATUS

### Core Features

| Feature | Status |
|---------|--------|
| Creator Profiles | ✅ |
| Tier System | ✅ |
| 4 Listing Types | ✅ |
| Booking Flow | ✅ |
| Promotion Flow | ✅ |
| QR Codes | ✅ |
| Reviews | ✅ |
| Disputes | ✅ |
| Analytics | ✅ |

### Frontend Pages

| Page | Status |
|------|--------|
| Landing | ✅ |
| Creator Profile | ✅ |
| Listing Detail | ✅ |
| Booking Flow | ✅ |
| Dashboard | ✅ |
| Listings Manager | ✅ |
| Earnings | ✅ |
| My Bookings | ✅ |
| Explore | ✅ |
| QR Scanner | ✅ |
| Settings | ✅ |

### Backend APIs

| Endpoint | Status |
|----------|--------|
| Creators CRUD | ✅ |
| Listings CRUD | ✅ |
| Bookings CRUD | ✅ |
| Promotions | ✅ |
| Reviews | ✅ |
| Disputes | ✅ |
| QR Resolution | ✅ |
| Analytics | ✅ |
| Payout Cron | ✅ |

### Integrations

| Service | Status |
|---------|--------|
| ReZ Wallet | ✅ |
| ReZ Payment | ✅ |
| ReZ Chat | ✅ |
| ReZ Karma | ✅ |
| ReZ Auth | ✅ |
| ReZ Notifications | ✅ |
| AdBazaar | ✅ |

### Infrastructure

| Component | Status |
|-----------|--------|
| MongoDB Setup Script | ✅ |
| Sample Data Seed | ✅ |
| Vercel Config | ✅ |
| Render Config | ✅ |
| Environment Variables | ✅ |
| API Tests | ✅ |

---

## FILES REFERENCE

### Next.js App Structure

```
rez-creator-qr/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Landing page
│   │   ├── globals.css
│   │   ├── [username]/page.tsx          # Creator profile
│   │   ├── listing/[id]/page.tsx        # Listing detail
│   │   ├── book/[id]/page.tsx          # Booking flow
│   │   ├── dashboard/
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── listings/page.tsx        # Listings manager
│   │   │   └── earnings/page.tsx        # Earnings view
│   │   ├── bookings/page.tsx           # My bookings
│   │   ├── explore/page.tsx            # Browse creators
│   │   ├── scanner/page.tsx           # QR scanner
│   │   ├── settings/page.tsx           # Settings
│   │   └── api/
│   │       ├── creators/
│   │       ├── listings/
│   │       ├── bookings/
│   │       ├── promotions/
│   │       ├── reviews/
│   │       ├── disputes/
│   │       ├── qr/[shortUrl]/
│   │       └── cron/payouts/
│   ├── models/index.ts        # MongoDB schemas
│   └── lib/
│       ├── mongodb.ts          # DB connection
│       ├── wallet.ts           # ReZ Wallet client
│       ├── payment.ts         # ReZ Payment client
│       ├── chat.ts            # ReZ Chat client
│       ├── karma.ts           # ReZ Karma client
│       ├── auth.ts            # ReZ Auth client
│       ├── notifications.ts    # ReZ Notification client
│       ├── adsIntegration.ts  # AdBazaar client
│       └── logger.ts
├── scripts/
│   ├── setup-mongodb.js       # Create indexes
│   └── seed.js               # Sample data
├── tests/
│   └── api.test.js           # API tests
├── vercel.json               # Vercel config
├── render.yaml               # Render config
├── jest.config.js
├── .env.example
└── package.json
```

### Pages

| Page | URL | Purpose |
|------|-----|---------|
| Landing | `/` | Home/landing page |
| Creator Profile | `/:username` | Public creator page |
| Listing Detail | `/listing/:id` | View & book listing |
| Booking Flow | `/book/:id` | Multi-step booking |
| Dashboard | `/dashboard` | Creator home |
| Listings | `/dashboard/listings` | Manage services |
| Earnings | `/dashboard/earnings` | View payouts |
| My Bookings | `/bookings` | All bookings |
| Explore | `/explore` | Browse creators |
| Scanner | `/scanner` | Scan QR codes |
| Settings | `/settings` | Profile settings |

### Client Libraries (ReZ Ecosystem)

| File | Reuses | Purpose |
|------|--------|---------|
| `lib/wallet.ts` | `rez-wallet-service` | Balance, credit, debit, escrow |
| `lib/payment.ts` | `rez-payment-service` | Orders, capture, refund, UPI QR |
| `lib/chat.ts` | `rez-unified-chat` | Messaging, threads |
| `lib/karma.ts` | `rez-karma-service` | Points, rewards |
| `lib/auth.ts` | `rez-auth-service` | Verify, OTP, profile |
| `lib/notifications.ts` | `rez-notification-service` | WhatsApp, SMS, push |
| `lib/adsIntegration.ts` | `adBazaar` | Creator sync, campaign push, attribution |

### AdBazaar Integration

| Feature | Description |
|---------|-------------|
| Creator Sync | Auto-sync creator profiles to AdBazaar marketplace |
| Campaign Push | Push promotions as campaigns to AdBazaar |
| Attribution | Track QR scans as ad impressions |
| Performance | Get creator performance from AdBazaar |

---

## DEPLOYMENT

### Quick Start

```bash
# Install
npm install

# Setup
cp .env.example .env.local
npm run db:setup

# Develop
npm run dev
```

### Vercel (Recommended)

```bash
# Deploy
vercel --prod

# Or push to GitHub for auto-deploy
```

### Render

1. Create Web Service on [render.com](https://render.com)
2. Connect GitHub repo
3. Configure:
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. Add environment variables
5. Deploy

### Cron Jobs

Weekly payouts run every Friday at 9 AM:
- **Render:** Configured in `render.yaml`
- **Manual:** Add cron pointing to `/api/cron/payouts`

### Database Setup

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/creator-qr

# Local
MONGODB_URI=mongodb://localhost:27017/creator-qr

# Setup indexes
npm run db:setup

# Seed sample data
npm run db:seed
```

### Testing

```bash
npm test           # Run tests
npm run test:watch # Watch mode
```

### Environment Variables

```env
# Server
PORT=3005
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/creator-qr

# Security
JWT_SECRET=your-secret-key
INTERNAL_SERVICE_TOKEN=your-internal-token
CRON_SECRET=your-cron-secret

# ReZ Services
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
CHAT_SERVICE_URL=https://rez-unified-chat.onrender.com
KARMA_SERVICE_URL=https://rez-karma-service.onrender.com
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
NOTIFICATION_SERVICE_URL=https://rez-notification-service.onrender.com

# AdBazaar Integration
ADBAZAAR_API_URL=https://ad-bazaar.vercel.app/api
ADBAZAAR_INTERNAL_KEY=your-internal-key
```

### Environment Variables

See `.env.example` for all required variables.

---

**Last Updated:** 2026-05-12
**Owner:** REZ-Consumer Team
