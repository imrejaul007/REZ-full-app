# ReZ Ecosystem - Quick Reference Card
**Date:** May 4, 2026

---

# APPS AT A GLANCE

## Mobile Apps (6)

| App | Package | SDK | Key Features |
|-----|---------|-----|-------------|
| Consumer | `money.rez.app` | 53 | QR, Wallet, Orders, Booking, Karma, **Creator System** |
| **Do App** | `com.do.app` | 52 | Voice AI, Camera, Location, Deep Links |
| Merchant | `com.rez.merchant` | 55 | POS, KDS, Menu, CRM, Analytics |
| Admin | `com.rez.admin` | 53 | Users, Merchants, Coins, Fraud |
| Karma | `com.rez.karma` | 52 | 300-900 Score, Tiers, Perks |
| Hotel OTA | `com.hotelota.app` | 49 | Book, Check-in, Room Service |

---

## Web Apps

| App | Framework | Purpose |
|-----|-----------|---------|
| rez-creators | Next.js 14 | Creator platform |
| adBazaar-creator | - | Ad campaign creator |
| AdBazaar | Next.js 16 | Campaign QR, Attribution |
| Rez Now | Next.js 16 | Room QR, Guest Services, AI Chat |
| AdsQr | Next.js 14 | Quick Campaign QR |
| Hotel Panel | Next.js 16 | Hotel Management |
| Hotel Admin | Next.js 16 | Admin Dashboard |
| OTA Web | Next.js 16 | Booking Site |
| Corporate Panel | Next.js 16 | Corporate Travel |
| Verify | Next.js | Product Authentication |
| Web Menu | Next.js | Restaurant Ordering |
| Rendez Admin | Next.js 14 | Dating Admin |

---

# THE 6 QR SYSTEMS

```
┌─────────────────────────────────────────────────────────────────┐
│                         6 QR SYSTEMS                               │
├──────────────┬──────────────────────────────────────────────────┤
│ Room QR      │ room.rez.money/{hotelId}/{roomId}                  │
│ Menu QR      │ menu.rez.money/{slug}                             │
│ Store QR     │ now.rez.money/{slug}                            │
│ Ads QR       │ adsqr.rez.money/c/{campaignId}                  │
│ Verify QR    │ verify.rez.money/s/{serial}                      │
│ Creator QR   │ creator.rez.money/{creatorId}                     │ ← NEW!
└──────────────┴──────────────────────────────────────────────────┘
```

---

# CREATOR SYSTEM

## Creator Profile Features
- Display name, bio, avatar, cover image
- Social links (Instagram, YouTube, Twitter, TikTok, Website)
- Creator tags (Fashion, Beauty, Tech, Food, Fitness, Travel, etc.)
- Public creator profile page
- Creator dashboard with analytics
- Follow/unfollow creators

## Creator Tags
Fashion, Beauty, Tech, Food, Fitness, Travel, Lifestyle, Gaming, Music, Art, Photography, Home, Books, Sports

---

# THE 5 CORE SERVICES

| Service | Port | Database | Key Responsibility |
|---------|------|----------|-------------------|
| Auth | 4002 | MongoDB | Phone/OTP, JWT, Sessions |
| Wallet | 4004 | MongoDB | Coins, Transactions |
| Payment | 4001 | MongoDB | Razorpay, Refunds |
| Order | 3006 | MongoDB | Order FSM, Tracking |
| Merchant | 4005 | MongoDB | Store, Menu, KDS |

---

# DO APP - AI SYSTEM

## 10 AI Agents
1. Autonomous Orchestrator
2. Adaptive Scoring Agent
3. Attribution Agent
4. Network Effect Agent
5. Personalization Agent
6. Demand Signal Agent
7. Scarcity Agent
8. Feedback Loop Agent
9. Support Agent
10. Revenue Attribution Agent

## 15+ Intent Types
- Discovery: browse, search, explore, mood_based
- Transactional: book, order, reserve, pay
- Informational: menu_hours, location, pricing, reviews
- Support: cancel, modify, refund, complain
- Loyalty: points_balance, redeem, refer, tier_status

## 82+ Event Types
Covering all user interactions

---

# CONSUMER APP SCREENS (150+)

## Categories
- Authentication: login, otp, account-recovery
- Shopping: home, explore, search, categories, food, beauty, fashion, etc.
- Orders: cart, checkout, order, order-history
- Payments: payment, payment-methods, bill-payment
- Booking: booking, hotel, flight, bus, cab
- Wallet: wallet, coins, bonus-zone
- Loyalty: karma, badges, achievements, challenges, leaderboard
- **Creator**: creator, creator-apply, creator-dashboard, creators
- UGC: articles, events, ugc
- Campaigns: campaign, campaigns, invite-friends
- Finance: gold-savings, investment, insurance, healthcare

---

# ORDER STATES (14)

```
placed → confirmed → preparing → ready → dispatched → out_for_delivery → delivered
                                                      ↓
    ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
    ↓
cancelled ← cancelling
    ↓
  returned → refunded

Also: failed_delivery, return_requested, return_rejected
```

---

# COIN TYPES (6)

| Coin | Purpose | Expiry |
|------|---------|--------|
| REZ | Platform currency | Never |
| BRANDED | Merchant coins | 6 months |
| PROMO | Campaigns | 3 months |
| CASHBACK | Order cashback | 1 year |
| PRIVE | Premium tier | 1 year |
| REFERRAL | Invitations | 6 months |

---

# KARMA TIERS

```
300-400   → Starter
401-500   → Contributor
501-600   → Influencer
601-700   → Leader
701-800   → Expert
801-900   → Legend
```

---

# SERVICE PORTS

```
3000  - API Gateway
3001  - Socket Service
3002  - Notification / Analytics Events
3004  - Gamification
3005  - Catalog
3006  - Order / Media Events
3008  - Insights
3009  - StayOwn
3011  - Insights Service
3012  - Scheduler

4000  - Marketing
4001  - Payment
4002  - Auth
4003  - Search
4004  - Wallet
4005  - Merchant
4006  - Finance
4007  - Ads
4010  - Feedback
4011  - Karma
4020  - Intelligence Hub
4025  - Knowledge Base
4030  - Corporate
```

---

# KEY FILES

| What | Where |
|------|-------|
| Complete Map | SOURCE-OF-TRUTH/REZ-ECOSYSTEM-COMPLETE-MAP-2026-05-04.md |
| Detailed Features | SOURCE-OF-TRUTH/REZ-ECOSYSTEM-DETAILED-FEATURES.md |
| Quick Reference | SOURCE-OF-TRUTH/REZ-ECOSYSTEM-QUICK-REFERENCE.md |
| Type Audit | SOURCE-OF-TRUTH/COMPLETE-TYPE-SYSTEM-AUDIT-2026-05-04.md |
| Patch Summary | SOURCE-OF-TRUTH/TYPE-SYSTEM-PATCH-SUMMARY-2026-05-04.md |

---

*Quick Reference Card v4.0 - May 4, 2026*
