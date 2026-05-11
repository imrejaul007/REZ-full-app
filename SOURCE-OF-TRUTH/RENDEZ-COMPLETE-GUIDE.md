# RENDEZ - COMPLETE GUIDE
**Date:** May 7, 2026
**CEO:** Claude Code
**Status:** PRODUCTION READY

---

## WHAT IS RENDEZ?

**Rendez** is a social dating platform within the REZ ecosystem that connects people through real-world meetups, events, and shared experiences. Unlike traditional dating apps, Rendez emphasizes in-person connections and experience-based dating.

---

## OVERVIEW

| Attribute | Details |
|-----------|---------|
| **Type** | Social/Dating App |
| **Platform** | Standalone partner app in REZ ecosystem |
| **GitHub** | `imrejaul007/Rendez` |
| **Version** | v1.0.0 (Production), v1.1.0 (Latest) |
| **Status** | Production Ready |
| **Category** | Social |

---

## TECH STACK

| Component | Technology |
|-----------|------------|
| **Mobile App** | Expo SDK 50, React Native |
| **Backend** | Node.js/Express.js |
| **Database** | Prisma ORM, PostgreSQL 16 |
| **Cache/Queue** | Redis 7, BullMQ |
| **Real-time** | Socket.io with Redis adapter |
| **Admin Dashboard** | Next.js (Vercel) |
| **Image Storage** | Cloudinary |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **Error Tracking** | Sentry |
| **Hosting** | Render (backend), Vercel (admin) |

---

## APP STRUCTURE

### Rendez Mobile App (rendez-app/)

**Core Screens:**

1. **Auth Screens**
   - Splash Screen
   - Login
   - Register
   - Verify OTP
   - Welcome

2. **Onboarding (5 Steps)**
   - Profile Photo
   - Name & Birthday
   - Gender & Looking For
   - Passion & Interests
   - Location Access

3. **Main App Tabs**
   - **Discover** - Swipe cards, matches, filters
   - **Chats** - Conversations, messages, video calls
   - **Events** - Browse, create, join events
   - **Profile** - View/edit profile, settings

4. **Profile Screens**
   - View Profile
   - Edit Profile
   - Settings
   - Privacy
   - Notifications
   - Help & Support
   - Delete Account

5. **Premium Features**
   - Boost Profile
   - Super Likes
   - See Who Likes You

---

## CORE FEATURES

### 1. DISCOVERY & MATCHING

| Feature | Description |
|---------|-------------|
| **Location-based Discovery** | Find people nearby using GPS |
| **Swipe Cards** | Tinder-style card interface |
| **Gender Filter** | Filter by preference |
| **Age Filter** | Set age range (18-60) |
| **Distance Filter** | Set discovery radius |
| **Super Like** | Highlight interest (limited) |
| **Boost** | 30-min visibility boost |
| **Undo** | Rewind last swipe |

### 2. MATCHING SYSTEM

| Feature | Description |
|---------|-------------|
| **Like/Dislike** | Swipe right/left |
| **Super Like** | 5x more effective (limited) |
| **Match** | Mutual interest = match |
| **Match Queue** | View all matches |
| **Match Notifications** | Push when matched |

### 3. MESSAGING

| Feature | Description |
|---------|-------------|
| **Real-time Chat** | Socket.io messaging |
| **Typing Indicators** | Show when typing |
| **Read Receipts** | Message read status |
| **Image Messages** | Share photos in chat |
| **Voice Messages** | Send voice notes |
| **Video Calls** | In-app video chat |
| **Report User** | Report/block inappropriate |

### 4. EVENTS & EXPERIENCES

| Feature | Description |
|---------|-------------|
| **Event Discovery** | Browse local events |
| **Event Creation** | Create meetup events |
| **Event Categories** | Food, Adventure, Arts, etc. |
| **Event Chat** | Group conversation |
| **RSVP** | Join/leave events |
| **Event Filters** | Date, category, location |

### 5. USER PROFILES

| Feature | Description |
|---------|-------------|
| **Photos** | Up to 6 photos |
| **Bio** | Short introduction |
| **Job Title** | Work information |
| **Education** | School/college |
| **Interests** | Tags and passions |
| **Height** | Display preference |
| **Location** | Current city |
| **Verification** | Photo verification |

---

## BACKEND API

### Rendez Backend (rendez-backend/)

**Port:** 3009

**Base URL:** `https://rendez-backend.onrender.com/api/v1`

### API ENDPOINTS

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/send-otp` | Send OTP |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh token |

#### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get profile |
| PATCH | `/users/profile` | Update profile |
| DELETE | `/users/account` | Delete account |
| GET | `/users/discover` | Discover users |
| POST | `/users/report/:id` | Report user |

#### Swipes & Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/swipes` | Record swipe |
| GET | `/matches` | Get matches |
| DELETE | `/matches/:id` | Unmatch |

#### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/messages/:matchId` | Get messages |
| POST | `/messages` | Send message |
| GET | `/conversations` | Get conversations |

#### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events |
| POST | `/events` | Create event |
| GET | `/events/:id` | Get event |
| POST | `/events/:id/rsvp` | RSVP event |
| DELETE | `/events/:id/rsvp` | Cancel RSVP |

#### Premium
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/premium/subscribe` | Subscribe |
| GET | `/premium/status` | Check status |

---

## DATABASE SCHEMA

### Users Table
```prisma
model User {
  id            String    @id @default(uuid())
  phone         String    @unique
  name          String
  email         String?   @unique
  bio           String?
  gender        Gender
  lookingFor    Gender[]
  birthday      DateTime
  occupation    String?
  school        String?
  interests     String[]
  height        Int?
  city          String?
  lat           Float?
  lng           Float?
  photos        String[]
  isPremium     Boolean   @default(false)
  isVerified    Boolean   @default(false)
  boostUntil    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### Matches Table
```prisma
model Match {
  id          String    @id @default(uuid())
  user1Id     String
  user2Id     String
  user1Photo  String?
  user2Photo  String?
  createdAt   DateTime  @default(now())
}
```

### Messages Table
```prisma
model Message {
  id          String    @id @default(uuid())
  matchId     String
  senderId    String
  content     String
  type        MessageType
  read        Boolean   @default(false)
  createdAt   DateTime  @default(now())
}
```

### Events Table
```prisma
model Event {
  id          String    @id @default(uuid())
  creatorId   String
  title       String
  description String
  category    EventCategory
  date        DateTime
  location    String
  lat         Float?
  lng         Float?
  maxAttendees Int?
  rsvps       Int       @default(0)
  createdAt   DateTime  @default(now())
}
```

---

## SECURITY FEATURES

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT tokens with refresh |
| **Phone Verification** | OTP via SMS |
| **Rate Limiting** | BullMQ job limits |
| **Input Validation** | Zod schemas |
| **XSS Prevention** | Sanitized inputs |
| **CSRF Protection** | Token validation |
| **Privacy Controls** | Show online status, last seen |
| **Block/Report** | User blocking system |

---

## PREMIUM FEATURES

| Feature | Description | Cost |
|---------|-------------|------|
| **Unlimited Likes** | Like without limits | ₹299/month |
| **Super Likes** | 5 per day | Included |
| **Boost** | 30-min visibility | ₹99/boost |
| **See Who Likes** | View liked you | Included |
| **Rewind** | Undo swipes | Included |
| **Passport** | Change location | Included |

---

## SCREENS & NAVIGATION

### Mobile App Screens (40+)

```
├── Auth
│   ├── Splash
│   ├── Login
│   ├── Register
│   ├── VerifyOTP
│   └── Welcome
├── Onboarding
│   ├── ProfilePhoto
│   ├── NameBirthday
│   ├── GenderPreference
│   ├── Interests
│   └── Location
├── Main App
│   ├── Discover
│   │   ├── SwipeCard
│   │   ├── MatchModal
│   │   └── Filters
│   ├── Chats
│   │   ├── ConversationList
│   │   ├── ChatScreen
│   │   └── VideoCall
│   ├── Events
│   │   ├── EventList
│   │   ├── EventDetail
│   │   └── CreateEvent
│   └── Profile
│       ├── ViewProfile
│       ├── EditProfile
│       └── Settings
└── Premium
    ├── BoostScreen
    └── SuperLikesScreen
```

---

## ADMIN DASHBOARD (rendez-admin/)

**URL:** `https://rendez-admin.vercel.app`

### Admin Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | User stats, metrics |
| **User Management** | View, edit, delete users |
| **Match Analytics** | Match rates, trends |
| **Event Management** | Moderate events |
| **Report Queue** | Review user reports |
| **Premium Management** | View subscribers |
| **Content Moderation** | Photo/report review |

---

## FILES CREATED (Rendez in REZ)

Based on the REZ ecosystem audit, Rendez integration files were created:

| File | Purpose |
|------|---------|
| `rendez-backend/src/index.ts` | Main entry point |
| `rendez-backend/src/routes/*.ts` | API routes |
| `rendez-backend/src/middleware/*.ts` | Auth middleware |
| `rendez-backend/src/services/*.ts` | Business logic |
| `rendez-backend/src/models/*.ts` | Database models |
| `rendez-app/app/**` | Mobile app screens |
| `rendez-admin/**` | Admin dashboard |

---

## DEPLOYMENT

### Backend (Render)
```bash
# Deploy to Render
git push origin main
# Auto-deploys from GitHub
```

### Admin (Vercel)
```bash
cd rendez-admin
vercel --prod
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
CLOUDINARY_URL=...
SENTRY_DSN=...
```

---

## INTEGRATION WITH REZ ECOSYSTEM

Rendez can leverage REZ ecosystem features:

| REZ Feature | Rendez Use Case |
|-------------|----------------|
| **REZ Auth** | User authentication |
| **REZ Wallet** | Premium payments |
| **REZ Marketing** | User acquisition |
| **REZ Analytics** | User behavior tracking |
| **REZ Notifications** | Push notifications |
| **REZ AI** | Match recommendations |

---

## REVENUE MODEL

| Stream | Description |
|--------|-------------|
| **Premium Subscription** | ₹299/month |
| **Boosts** | ₹99/boost |
| **Super Likes Pack** | ₹49/5 likes |
| **Spotlight** | ₹199/15 min |

---

## METRICS

| Metric | Target |
|--------|--------|
| **Daily Active Users** | 10,000 |
| **Matches per Day** | 5,000 |
| **Messages per Day** | 100,000 |
| **Premium Conversion** | 5% |
| **Retention (30-day)** | 40% |

---

## STATUS

```
╔═══════════════════════════════════════════════════════════╗
║                                                            ║
║ RENDEZ - PRODUCTION READY                              ║
║                                                            ║
║ Version: v1.1.0                                        ║
║ Status: Deploy Pending                                 ║
║ Backend: Ready                                         ║
║ Mobile App: Ready                                      ║
║ Admin: Ready                                           ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

---

**Rendez - Where Real Connections Begin**
