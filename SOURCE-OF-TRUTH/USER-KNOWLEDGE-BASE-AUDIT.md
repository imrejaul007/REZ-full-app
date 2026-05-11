# User Knowledge Base Audit Report

**Date:** 2026-05-08
**Auditor:** Claude Code
**Scope:** Cross-app user knowledge base and profile systems

---

## Executive Summary

The ReZ ecosystem has **multiple fragmented user knowledge systems** that are **not well integrated**. There is no unified user knowledge base that spans all apps. Instead, each service maintains its own user profile/knowledge store with partial overlap.

---

## 1. Existing Knowledge Base Services

### 1.1 REZ Mind Hotel - User Knowledge Service

**Location:** `rez-mind-hotel-service/src/services/user-knowledge.service.ts`

**Purpose:** Hotel-specific user personalization and signal tracking

**What's Stored:**
```typescript
interface UserProfile {
  userId: string;
  preferences: UserPreferences;      // roomType, bedType, floor, smoking, earlyCheckin, lateCheckout
  history: UserHistory;             // bookings, avgStay, favoriteHotels, favoriteCities, avgRating
  signals: UserSignal[];            // behavioral events (last 1000 kept)
}
```

**Key Features:**
- Signal tracking with event types (booking_completed, rating_given, room_service, etc.)
- In-memory cache with 5-minute TTL
- Personalization scoring (loyalty, spend, engagement)
- User segmentation (new_user, loyal_customer, returning_customer, etc.)
- Recommendation engine for hotels and services

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/knowledge/signal` | POST | Add user signal |
| `/knowledge/profile/:userId` | GET | Get user profile |
| `/knowledge/preferences/:userId` | PUT | Update preferences |
| `/knowledge/personalization/:userId` | GET | Get personalization data |
| `/knowledge/recommendations/:userId` | GET | Get recommendations |

**Status:** Active but hotel-specific only

---

### 1.2 Auth Service - Profile Service

**Location:** `rez-auth-service/src/services/profile.service.ts`

**Purpose:** Cross-vertical user spending and engagement tracking

**What's Stored:**
```typescript
interface IUserProfile extends Document {
  userId: string;
  phone: string;
  verticals: {
    hotel: VerticalStats;
    restaurant: VerticalStats;
    fashion: VerticalStats;
    pharmacy: VerticalStats;
    retail: VerticalStats;
    d2c: VerticalStats;
  };
  totalLifetimeSpend: number;
  totalTransactions: number;
  averageOrderValue: number;
  favoriteCategories: string[];
  favoriteMerchants: string[];
  engagementScore: number;
  appOpenFrequency: number;
  lifetimeValue: number;
  preferredPaymentMethod: 'wallet' | 'upi' | 'card' | 'cod';
}
```

**Key Features:**
- Cross-vertical transaction tracking (6 verticals)
- LTV calculation with 15% margin
- Engagement scoring (0-100)
- Tier system (bronze/silver/gold/platinum)
- PII encryption for phone numbers

**Status:** Active, stores user spend/engagement data

---

### 1.3 Auth Service - REZ Mind Integration

**Location:** `rez-auth-service/src/services/rezMindService.ts`

**Purpose:** Send auth events to REZ Mind

**Events Sent:**
| Event | Webhook |
|-------|---------|
| Signup | `/webhook/auth/signup` |
| Login | `/webhook/auth/login` |
| Logout | `/webhook/auth/logout` |

**Status:** One-way sync only, no bidirectional flow

---

### 1.4 Intent Graph - Personalization Agent

**Location:** `rez-intent-graph/src/agents/personalization-agent.ts`

**Purpose:** Nudge/engagement personalization

**What's Stored:**
```typescript
interface UserResponseProfile {
  userId: string;
  openRates: Record<string, number>;
  clickRates: Record<string, number>;
  convertRates: Record<string, number>;
  optimalSendTimes: string[];
  preferredChannels: Channel[];
  tonePreferences: 'casual' | 'friendly' | 'urgent' | 'formal';
  avgSessionValue: number;
}
```

**Key Features:**
- Channel performance tracking (push, email, sms, in_app)
- Optimal send time calculation
- Tone preference detection
- A/B test variant selection

**Storage:** Redis (sharedMemory) with 24-hour TTL

**Status:** Active but focused on nudge/push personalization only

---

### 1.5 Intent Graph - Cross-App Aggregation

**Location:** `rez-intent-graph/src/services/CrossAppAggregationService.ts`

**Purpose:** Aggregate user intent across apps

**What's Stored:**
```typescript
interface ICrossAppIntentProfile {
  userId: string;
  travelAffinity: number;
  diningAffinity: number;
  retailAffinity: number;
  dominantCategory: 'TRAVEL' | 'DINING' | 'RETAIL' | 'MIXED';
  totalIntents: number;
  dormantIntents: number;
  conversions: number;
}
```

**Status:** Framework exists but data flows incomplete

---

### 1.6 Shared Types - User Entity

**Location:** `shared-types/src/entities/user.ts`

**Purpose:** Canonical user schema (used across services)

**What's Defined:**
```typescript
interface IUser {
  phoneNumber: string;
  email?: string;
  profile: IUserProfile;           // firstName, lastName, avatar, bio, location, etc.
  preferences: IUserPreferences;  // language, notifications, theme
  auth: IUserAuth;               // isVerified, isOnboarded, OTP, TOTP, PIN
  referral: IUserReferral;        // referralCode, referredBy, earnings
  verifications?: IUserVerifications;
  role: UserRole;
  pushTokens?: IUserPushToken[];
  loyaltyTier?: LoyaltyTier;
  // ... 50+ fields total
}
```

**Status:** Schema exists but implementation varies by service

---

## 2. User Profile Structures

### 2.1 Comparison Table

| Feature | REZ Mind Hotel | Auth Service | Intent Graph | Shared Types |
|---------|---------------|--------------|--------------|--------------|
| **User Identity** | userId | userId, phone | userId | phoneNumber, email |
| **Name/Avatar** | No | No | No | Yes |
| **Room Preferences** | Yes | No | No | No |
| **Spending Data** | No | Yes | No | No |
| **Booking History** | Yes | Aggregated | No | No |
| **Favorite Hotels** | Yes | Yes (via verticals) | No | No |
| **Favorite Cities** | Yes | No | No | No |
| **Engagement Score** | No | Yes | Yes (channel-specific) | No |
| **Location History** | No | No | No | Yes |
| **Verification Status** | No | No | No | Yes |
| **Push Tokens** | No | No | No | Yes |
| **Referral Info** | No | No | No | Yes |
| **Exclusive Zone Verification** | No | No | No | Yes (8 zones) |

---

## 3. Cross-App Integration Analysis

### 3.1 Apps with User Profiles

| App | Profile Storage | Uses REZ Mind KB | Uses Auth KB |
|-----|----------------|-------------------|--------------|
| **rez-auth-service** | MongoDB (IUserProfile) | Webhook sender | Source of truth |
| **rez-mind-hotel-service** | MongoDB (UserKnowledge) | Provider | No |
| **rez-intent-graph** | MongoDB + Redis | Consumer (partial) | No |
| **rez-app-consumer** | API calls to auth | No | Yes |
| **hotel-ota** | Prisma (local) + REZ sync | No | Partial (wallet sync) |
| **Resturistan** | Prisma (separate DB) | No | No |
| **rez-personalization-engine** | MongoDB | Unknown | Unknown |

### 3.2 Integration Points Found

1. **Auth -> REZ Mind:** Webhook events (signup, login, logout)
2. **Hotel OTA -> REZ:** Wallet balance sync endpoint
3. **Intent Graph:** Has cross-app profile framework but data flows not fully implemented
4. **Consumer App:** Calls `/user/profile` on auth-service

### 3.3 Data Flow Diagram

```
                        REZ ECOSYSTEM

  Auth Service ----> REZ Mind <---- Intent Graph
       |                |                |
       |                |                |
       v                v                v
  Hotel OTA      Hotel KB          CrossApp Profile
       |             |                   |
       |             |                   |
       v             v                   v
  Resturistan    Consumer App       Personalization
```

---

## 4. REZ Mind Connection Status

### 4.1 Connected Services

| Service | Connection Type | Direction |
|---------|----------------|-----------|
| Auth Service | Webhook | Outbound only |
| Intent Graph | Agent OS | Bidirectional |
| Consumer App | API calls | Inbound only |

### 4.2 Connection URLs

```typescript
// REZ Mind URL
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

// Knowledge Service URL (from hotel service)
const KNOWLEDGE_SERVICE_URL = process.env.KNOWLEDGE_SERVICE_URL || 'http://localhost:4018';
```

### 4.3 Gap Analysis

**What REZ Mind Has:**
- Intent tracking
- Personalization agent
- Cross-app aggregation framework
- Merchant knowledge base

**What REZ Mind Lacks:**
- Direct connection to auth user profiles
- Hotel-specific user knowledge (signals)
- Spending/transaction data
- Real-time profile updates from all apps

---

## 5. What's Missing

### 5.1 Critical Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| **No unified user profile** | Data silos, inconsistent user experience | Critical |
| **No real-time sync** | Profile updates not reflected across apps | High |
| **Missing profile fields** | Room preferences not in canonical schema | Medium |
| **No cross-app aggregation** | Can't see user activity across all verticals | High |
| **Intent Graph not connected to auth** | Personalization lacks user context | Medium |

### 5.2 Missing Profile Fields in Canonical Schema

Based on comparing all services, these fields are missing from `shared-types/src/entities/user.ts`:

- [ ] `roomPreferences: RoomPreferences`
- [ ] `favoriteHotels: string[]`
- [ ] `favoriteCities: string[]`
- [ ] `totalBookings: number`
- [ ] `avgStayDuration: number`
- [ ] `lifetimeValue: number`
- [ ] `engagementScore: number`
- [ ] `preferredChannels: Channel[]`
- [ ] `optimalSendTimes: string[]`
- [ ] `travelAffinity: number`
- [ ] `diningAffinity: number`
- [ ] `retailAffinity: number`

### 5.3 Missing Cross-App Data Flows

1. **Hotel KB -> Auth Profile:** No automatic sync of booking data
2. **Auth Profile -> Intent Graph:** No user spending/preferences flow
3. **Consumer App -> All KB:** No signals sent to REZ Mind
4. **Resturistan -> Cross-App:** Completely isolated

---

## 6. Recommendations

### 6.1 Immediate Actions (Week 1-2)

1. **Create Unified User Knowledge Service**
   - New service: `rez-user-knowledge-service`
   - Single source of truth for user profile
   - Merge Hotel KB, Auth Profile, and Intent Graph data

2. **Add Missing Profile Fields**
   - Update `shared-types/src/entities/user.ts`
   - Add room preferences, spending data, engagement scores

3. **Implement Bidirectional Sync**
   - Auth Service -> Unified KB (webhook)
   - Hotel Service -> Unified KB (webhook)
   - Intent Graph -> Unified KB (periodic sync)

### 6.2 Short Term (Week 3-4)

4. **Connect Consumer App**
   - Add signal tracking to consumer app
   - Send events to unified knowledge service

5. **Implement Cross-App Aggregation**
   - Connect Resturistan to unified profile
   - Add hotel booking data to auth profile

### 6.3 Long Term

6. **Real-time Profile Updates**
   - WebSocket connection for live updates
   - Event-driven architecture with Kafka

7. **360-Degree User View**
   - Dashboard showing all user activity
   - Unified recommendation engine

---

## 7. Appendix

### A. File Locations

| Component | File Path |
|-----------|-----------|
| Hotel User Knowledge Service | `rez-mind-hotel-service/src/services/user-knowledge.service.ts` |
| Hotel Knowledge Routes | `rez-mind-hotel-service/src/routes/knowledge-routes.ts` |
| Auth Profile Service | `rez-auth-service/src/services/profile.service.ts` |
| Auth REZ Mind Integration | `rez-auth-service/src/services/rezMindService.ts` |
| Auth User Profile Model | `rez-auth-service/src/models/UserProfile.ts` |
| Intent Graph Personalization Agent | `rez-intent-graph/src/agents/personalization-agent.ts` |
| Intent Graph Shared Memory | `rez-intent-graph/src/agents/shared-memory.ts` |
| Cross-App Aggregation | `rez-intent-graph/src/services/CrossAppAggregationService.ts` |
| Canonical User Entity | `shared-types/src/entities/user.ts` |
| User Schema | `shared-types/src/schemas/user.schema.ts` |

### B. Database Collections

| Collection | Service | Purpose |
|------------|---------|---------|
| `UserKnowledge` | Hotel Service | User signals and preferences |
| `UserProfile` | Auth Service | Cross-vertical spend tracking |
| `Intent` | Intent Graph | User intent tracking |
| `CrossAppIntentProfile` | Intent Graph | Cross-app aggregation |
| `DormantIntent` | Intent Graph | Dormant user tracking |
| `User` | Various | Canonical identity (varies by app) |

### C. API Endpoints

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `POST /knowledge/signal` | Hotel Service | Add user signal |
| `GET /knowledge/profile/:userId` | Hotel Service | Get user profile |
| `PUT /knowledge/preferences/:userId` | Hotel Service | Update preferences |
| `GET /knowledge/personalization/:userId` | Hotel Service | Get personalization |
| `GET /user/profile` | Auth Service | Get user profile |
| `PUT /user/profile` | Auth Service | Update user profile |
| `POST /user/rez-sync` | Hotel OTA | Sync REZ wallet |

---

**End of Report**
