# ReZ Try Discovery Platform - Feature Audit

**Audit Date:** 2026-05-07
**Service:** rez-try (try.rez.money)
**Repository:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-try`

---

## Architecture Overview

ReZ Try is a **Next.js 14** trial discovery and booking platform that allows users to discover local business trials and book them using a coin-based payment system with QR code verification.

### Tech Stack
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Prisma ORM |
| Authentication | JWT + bcryptjs |
| QR Generation | crypto + qrcode |
| Deployment | Render (Oregon region) |

---

## Feature Inventory

### Feature 1: Trial Discovery

| Field | Value |
|-------|-------|
| **Feature Name** | Trial Discovery |
| **Description** | Browse and search available trials at local businesses with category filtering and distance-based sorting |
| **User Benefit** | Users can discover new experiences near their location, filter by category (beauty, food, fitness, wellness, home, products), and view merchant details including ratings and review counts |
| **API Endpoint** | `GET /api/trials?lat={lat}&lng={lng}&category={category}` |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/trials/route.ts` |

**How it connects to other ReZ services:**
- Uses `REZ_CATALOG_SERVICE_URL` for product catalog data
- Uses `REZ_MERCHANT_SERVICE_URL` for merchant information
- Distance calculation using Haversine formula based on user coordinates

---

### Feature 2: Trial Booking with Coin Payment

| Field | Value |
|-------|-------|
| **Feature Name** | Trial Booking (Coin-based Payment) |
| **Description** | Book a trial slot by paying with coins and a refundable commitment fee |
| **User Benefit** | Low-risk trial experience - users pay a small refundable commitment fee plus coins to try products/services before committing to full purchase |
| **API Endpoint** | `POST /api/bookings` |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/bookings/route.ts` |

**Booking Flow:**
1. User selects a trial and time slot
2. System generates unique QR token and HMAC signature
3. Booking created with 2-hour QR expiration window
4. Coins deducted from user balance (assumed external)
5. Commitment fee held (assumed external payment processing)

**How it connects to other ReZ services:**
- Integrates with ReZ Auth Service for user authentication
- Uses external coin balance system (not implemented in this service)
- Booking links to Merchant Service for merchant verification

---

### Feature 3: QR Code Redemption System

| Field | Value |
|-------|-------|
| **Feature Name** | QR Code Redemption (Merchant Verification) |
| **Description** | Secure QR-based verification system for merchants to validate bookings on-site |
| **User Benefit** | Fraud-proof booking verification; ensures only legitimate bookings are redeemed; transparent trial completion |
| **API Endpoint** | `POST /api/bookings/[id]/redeem` |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/bookings/[id]/redeem/route.ts` |

**Security Features:**
- HMAC-SHA256 signature verification
- Time-limited QR codes (2-hour window)
- Unique booking tokens (32-character hex)
- Server-side signature validation

**How it connects to other ReZ services:**
- Validates against `QR_SECRET` environment variable
- Updates booking status in database for downstream reporting

---

### Feature 4: User Booking History

| Field | Value |
|-------|-------|
| **Feature Name** | User Booking History |
| **Description** | Retrieve a user's past and active trial bookings |
| **User Benefit** | Users can track their trial history, view upcoming bookings, and manage active trials |
| **API Endpoint** | `GET /api/bookings?userId={userId}` |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/bookings/route.ts` |

---

### Feature 5: Review & Rating System (Schema Only)

| Field | Value |
|-------|-------|
| **Feature Name** | Review & Rating System |
| **Description** | Users can leave reviews and ratings (1-5 stars) for completed trials, earning points for feedback |
| **Database Model** | `Review` model in Prisma schema |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` |

**Schema Details:**
- Reviews linked to User, Trial, Booking, and Merchant
- Points earned: 25 points per review
- Supports image attachments

**Note:** API endpoints for reviews NOT implemented yet.

---

### Feature 6: Gamification & Explorer Tiers

| Field | Value |
|-------|-------|
| **Feature Name** | Gamification (Explorer Tiers & Points) |
| **Description** | Users earn points for completing trials and leaving reviews, with tier progression |
| **Database Model** | `User` model with `points` and `tier` fields, `UserReward` model |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` |

**Explorer Tiers:**
| Tier | Description |
|------|-------------|
| CURIOUS | Default tier for new users |
| EXPLORER | Mid-tier (threshold unknown) |
| ADVENTURER | Higher engagement tier |
| PIONEER | Top-tier power users |

**Points Earning:**
- 100 points per completed trial redemption
- 25 points per review submitted

---

### Feature 7: Campaign System

| Field | Value |
|-------|-------|
| **Feature Name** | Campaign System (Missions & Promotions) |
| **Description** | Time-limited campaigns to drive user engagement with specific trials or categories |
| **Database Model** | `Campaign` model |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` |

**Campaign Types:**
| Type | Description |
|------|-------------|
| MISSION_SPRINT | Short-term intense engagement push |
| FESTIVAL | Seasonal/promotional campaigns |
| CATEGORY_PUSH | Promote specific trial categories |

---

### Feature 8: Mission System

| Field | Value |
|-------|-------|
| **Feature Name** | Mission System (Achievement Tasks) |
| **Description** | Task-based achievements that reward users with ReZ coins and Trial coins upon completion |
| **Database Model** | `Mission` model |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` |

**Reward Structure:**
- `rezCoinsReward`: ReZ platform currency
- `trialCoinsReward`: Trial-specific coins

---

### Feature 9: Coin Pack Purchasing

| Field | Value |
|-------|-------|
| **Feature Name** | Coin Pack System |
| **Description** | Pre-packaged coin bundles for purchase (in rupees) with bonus coins for larger packs |
| **Database Model** | `CoinPack` model |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` |

---

### Feature 10: User Rewards & Expiry

| Field | Value |
|-------|-------|
| **Feature Name** | User Rewards Tracking |
| **Description** | Track earned rewards with expiration dates and claim status |
| **Database Model** | `UserReward` model |
| **Implementation File** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` |

---

## Database Models Summary

| Model | Purpose | Relations |
|-------|---------|-----------|
| `User` | User accounts with auth, profile, gamification | bookings, reviews, rewards |
| `Merchant` | Business partners offering trials | trials, bookings, reviews |
| `Trial` | Available trial experiences | merchant, bookings, reviews |
| `Booking` | Trial reservations with QR data | user, trial, merchant, review |
| `Review` | User feedback on completed trials | user, trial, booking, merchant |
| `Campaign` | Promotional campaigns | None |
| `Mission` | Achievement tasks | None |
| `CoinPack` | Coin products for purchase | None |
| `UserReward` | Earned rewards tracking | user |

---

## Issues & Bugs Found

### Critical Issues

| Issue ID | Severity | Description |
|----------|----------|-------------|
| **BUG-001** | CRITICAL | **No authentication middleware** - All API endpoints are unauthenticated. Anyone can create bookings, view all bookings, or redeem any booking with just the booking ID. |
| **BUG-002** | CRITICAL | **User ID passed in request body** - The `/api/bookings POST` endpoint accepts `userId` from request body instead of extracting from auth token. Allows booking as any user. |
| **BUG-003** | CRITICAL | **Booking history has no auth check** - `GET /api/bookings?userId=X` returns bookings for any userId parameter without verifying the requester owns that account. |

### High Severity Issues

| Issue ID | Severity | Description |
|----------|----------|-------------|
| **BUG-004** | HIGH | **HMAC secret uses weak default** - `process.env.QR_SECRET || 'secret'` allows QR codes to be forged if env var is not set. |
| **BUG-005** | HIGH | **No rate limiting** - No protection against booking spam or enumeration attacks. |
| **BUG-006** | HIGH | **No slot availability check** - Booking creates reservations without checking if the time slot has availability (dailySlots field unused). |

### Medium Severity Issues

| Issue ID | Severity | Description |
|----------|----------|-------------|
| **BUG-007** | MEDIUM | **Signature verification flawed** - The redeem endpoint compares client-provided `signature` against expected HMAC, but the client should send the QR token and server should generate the signature. Current approach allows signature reuse. |
| **BUG-008** | MEDIUM | **No input validation** - Zod is listed as dependency but never used. No request body validation. |
| **BUG-009** | MEDIUM | **No slot overlap check** - User can book the same trial multiple times for overlapping time slots. |
| **BUG-010** | MEDIUM | **Missing index on booking lookup** - No index on `userId` column in Booking model for efficient user booking queries. |

### Low Severity Issues

| Issue ID | Severity | Description |
|----------|----------|-------------|
| **BUG-011** | LOW | **recharts dependency unused** - Listed in package.json but not used anywhere. |
| **BUG-012** | LOW | **qrcode dependency unused** - Listed in package.json but QR generation not implemented. |
| **BUG-013** | LOW | **date-fns dependency unused** - Listed in package.json but never imported. |
| **BUG-014** | LOW | **Frontend hardcoded coordinates** - Discovery page uses hardcoded `lat=12.97&lng=77.59` (Bangalore). Should use geolocation API. |

### Missing Features (Not Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| Review submission API | NOT IMPLEMENTED | Schema exists, API missing |
| User authentication | PARTIAL | JWT dependency exists, middleware missing |
| Coin balance deduction | NOT IMPLEMENTED | Booking assumes coins already deducted |
| Payment processing | NOT IMPLEMENTED | Commitment fee handling missing |
| Email/SMS notifications | NOT IMPLEMENTED | No notification system |
| Admin dashboard | NOT IMPLEMENTED | No merchant or admin interfaces |
| Health check endpoint | MISSING | Referenced in render.yaml but not implemented |

---

## Service Connections (Inter-service Dependencies)

### Configured Service URLs (from render.yaml)

| Service | URL | Purpose |
|---------|-----|---------|
| `NEXT_PUBLIC_API_URL` | https://api.rez.money | Core API |
| `REZ_AUTH_SERVICE_URL` | https://auth.rez.money | User authentication |
| `REZ_MERCHANT_SERVICE_URL` | https://merchant.rez.money | Merchant data |
| `REZ_CATALOG_SERVICE_URL` | https://catalog.rez.money | Product catalog |

### Expected Data Flows (Not Implemented)
- User session validation via Auth Service
- Merchant verification via Merchant Service
- Coin balance read/write via Core API
- Trial catalog sync via Catalog Service

---

## Recommendations

1. **Immediate:** Add authentication middleware to all API routes
2. **Immediate:** Extract userId from JWT token, not request body
3. **High:** Implement proper slot availability checking
4. **High:** Add rate limiting (e.g., 10 bookings per minute per user)
5. **Medium:** Implement review submission API
6. **Medium:** Use Zod for request validation
7. **Low:** Remove unused dependencies (recharts, qrcode, date-fns)
8. **Low:** Add geolocation for location-aware discovery

---

## Files Audited

| File Path | Purpose |
|-----------|---------|
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/package.json` | Dependencies and scripts |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/prisma/schema.prisma` | Database models |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/layout.tsx` | Root layout |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/page.tsx` | Discovery UI |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/trials/route.ts` | Trial discovery API |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/bookings/route.ts` | Booking management API |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/src/app/api/bookings/[id]/redeem/route.ts` | QR redemption API |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/render.yaml` | Deployment configuration |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/.env.example` | Environment variables |
| `/Users/rejaulkarim/Documents/ReZ Full App/rez-try/tsconfig.json` | TypeScript configuration |

---

**End of Audit Report**
