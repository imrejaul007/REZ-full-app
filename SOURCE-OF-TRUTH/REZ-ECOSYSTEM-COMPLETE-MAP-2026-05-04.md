# ReZ Ecosystem Complete Map (Deep Audit v4.0)
**Date:** May 4, 2026
**Version:** 4.0 (Complete Audit with All Features)
**Status:** FULLY MAPPED

---

## Overview

The ReZ ecosystem is a massive super-app platform with:
- **6 Mobile Apps** (Consumer, Merchant, Admin, Karma, Hotel OTA, Do App)
- **20+ Web Apps** (Next.js, React, Express)
- **60+ Backend Services** (Core, AI/ML, Support, Copilots)
- **20+ Shared Packages** (SDKs, Types, Clients)
- **Multiple Database Systems** (PostgreSQL, MongoDB, Redis)
- **25+ External Integrations** (Payments, Notifications, AI)
- **64 Dockerfiles** & **35+ docker-compose files**
- **10 GitHub Workflows**

---

# MOBILE APPS (6)

## 1. ReZ Consumer App (rez-app-consumer)

**Package:** `money.rez.app`
**Bundle ID (iOS):** `money.rez.app`
**Framework:** React Native (Expo SDK 53)

### Core Screens (100+ screens)

#### Authentication & Profile
- login, otp, account, profile, settings
- account-recovery, notification-preferences
- help, faq, legal

#### Shopping & Discovery
- home, explore, search, categories
- food, beauty, fashion, electronics, health, fitness, grocery
- brand, brands, mall, deals, offers, flash-sales
- store, stores, categories, category

#### Orders & Payments
- cart, checkout, order, order-history, order-confirmation
- payment, payment-methods, payment-razorpay, payment-success
- bill-payment, bill-upload, bill-history
- pickup-tracking, dinein-tracking, drivethru-tracking

#### Booking Services
- booking, booking-detail, my-bookings
- hotel, flight, bus, cab
- parking, recharge
- appointment, appointments

#### Wallet & Coins
- wallet, coins, coin-system
- bonus-zone, bonus-zone-history
- gold-savings, investment
- earning, earnings-history
- pay-in-store, khata

#### Loyalty & Gamification
- karma, badges, achievements
- challenges, mission-detail, missions
- leaderboard, streak, checkin-history
- loyalty, loyalty-program

#### Creator System (NEW!)
- **creator** - Creator profile page
- **creator/edit** - Creator profile edit
- **creator/[id]** - Public creator profile
- **creator-apply** - Apply to become creator
- **creator-dashboard** - Creator dashboard
- **creators.tsx** - Creator listings
- **submit-pick** - Submit creator picks

#### Content & UGC
- articles, article, learn
- events, events-list, event
- ugc, ugc-detail, UGCDetailScreen

#### Campaigns & Marketing
- campaign, campaigns
- invite-friends, earn-from-social-media
- reviews, my-reviews, review

#### Experiences
- experience, occasions, going-out
- group-buy, flash-sale-success, deal-success

#### Other Features
- compare, disputes, maintenance
- package, travel, trip
- financial, insurance, healthcare
- home-services, hotel-ota
- map, location, near-u
- friends, messages, chat
- notifications, admin
- games, playandearn, playande
- picks, my-products, my-services, my-deals
- vouchers, my-vouchers
- hotel-booking, ride-booking
- qr (QR scanner)
- restaurant, istore
- subscription, bank-offers
- beauty, salon, spa

### Deep Link Handlers
- `rezapp://` - Internal app links
- `menu.rez.money/{slug}` - Restaurant menus
- `now.rez.money/{slug}` - Merchant profiles
- `adsqr.rezapp.com/c/{id}` - Campaign QR
- `verify.rez.money/s/{serial}` - Product verification
- `do://` - Do App deep links

### Creator Tags
Fashion, Beauty, Tech, Food, Fitness, Travel, Lifestyle, Gaming, Music, Art, Photography, Home, Books, Sports

### Creator Social Platforms
Instagram, YouTube, Twitter, TikTok, Website

---

## 2. Do App (do-app) - NEW!

**Package:** `com.do.app`
**Bundle ID (iOS):** `com.do.app`
**Framework:** React Native (Expo SDK 52)

### Features
- Voice input (expo-speech)
- Camera for receipts and scanning
- Location services for nearby places
- Deep linking (do:// scheme)
- Background audio, fetch, remote-notification

### Screens
- **auth** - Authentication
- **booking** - Booking management
- **complaints** - Issue reporting
- **refunds** - Refund requests
- **onboarding** - New user onboarding

### Backend
- **do-backend** - Express.js backend

### Features (from FEATURES.md)
- 10+ AI Agents
- 15+ Intent Types
- 82+ Event Types
- Intent Graph
- Support Copilot (15 intents, 95.6% accuracy)
- Merchant Copilot (health scores, recommendations)
- User Intelligence (behavioral scoring, LTV)
- Merchant Intelligence (trends, positioning)

---

## 3. ReZ Merchant App (rez-app-merchant)

**Package:** `merchant-app`
**Bundle ID (iOS):** `com.rez.merchant`
**Framework:** React Native (Expo SDK 55)

### Features
- POS (Point of Sale)
- KDS (Kitchen Display System)
- Inventory management
- Staff management
- QR code generation
- Analytics dashboard
- CRM
- Appointments
- Hotel OTA integration

### Screens
- (auth), (cashback), (dashboard), (orders), (products)
- ads, analytics, appointments, automation, brand, campaigns, catalog
- categories, consultation-forms, copilot, crm, customers, dine-in
- discounts, disputes, documents, events, expenses, floor-plan, fraud
- gift-cards, goals, gst, hotel-ota, inventory, kds, khata, loyalty
- marketing, messages, notifications, onboarding, orders, payments
- products, profile, reports, restaurant, settings, staff, store
- subscription, support, table-booking, transactions, wallet

---

## 4. ReZ Admin App (rez-app-admin)

**Package:** `rez-admin`
**Bundle ID (iOS):** `com.rez.admin`
**Framework:** React Native (Expo SDK 53)

### Screens
- (auth), (dashboard), Settings, index

---

## 5. Karma by ReZ (rez-karma-mobile)

**Package:** `rez-karma-mobile`
**Bundle ID (iOS):** `com.rez.karma`
**Framework:** React Native (Expo SDK 52)

### Screens
- admin, karma, login, index

---

## 6. Hotel OTA Mobile (Hotel OTA/apps/mobile)

**Package:** `@hotel-ota/mobile`
**Bundle ID (iOS):** `com.hotelota.app`
**Framework:** React Native (Expo SDK 49)

### Screens
- Home, Search, Bookings, BookingDetail, Profile
- Login, OTP, Onboarding
- BillPay, Wallet, Rewards
- Notifications, Support

---

# WEB APPS

## ReZ Creator Platform

### 1. rez-creators (creators/)
**Location:** `creators/`
**Package:** `rez-creators`
**Framework:** Next.js 14.1.0

### 2. adBazaar-creator
**Location:** `adBazaar-creator/`
**Purpose:** Ad campaign creator

---

## Do App Web Platforms

### do-app
**Location:** `do-app/`
**Package:** `do-app`
**Bundle ID:** `com.do.app`
**Framework:** Expo SDK 52

### do-app Screens
- auth/, booking/, complaints/, refunds/, onboarding/
- components/, hooks/, screens/, services/, stores/, theme/

---

# BACKEND SERVICES

## ReZ Mind AI System (REE-MIND)

### Intent Graph (rez-intent-graph)
**Location:** `rez-intent-graph/`

### AI Agents (10+)
1. **Autonomous Orchestrator** - Coordinates all other agents
2. **Adaptive Scoring Agent** - Dynamic intent scoring with ML
3. **Attribution Agent** - Revenue attribution across touchpoints
4. **Network Effect Agent** - Viral/referral mechanics
5. **Personalization Agent** - Content & offer personalization
6. **Demand Signal Agent** - Market trends, procurement insights
7. **Scarcity Agent** - Inventory-based urgency creation
8. **Feedback Loop Agent** - Outcome learning, model improvement
9. **Support Agent** - Customer service automation
10. **Revenue Attribution Agent** - ROI tracking, conversion attribution

### Intent Types (15+)
- **Discovery**: browse, search, explore, mood_based
- **Transactional**: book, order, reserve, pay
- **Informational**: menu_hours, location, pricing, reviews
- **Support**: cancel, modify, refund, complain
- **Loyalty**: points_balance, redeem, refer, tier_status

### Event Types (82+)
Organized by category covering all user interactions

---

# QR SYSTEMS (6 - Updated!)

| # | System | URL | Purpose |
|---|--------|-----|---------|
| 1 | **Room QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel room service |
| 2 | **Menu QR** | `menu.rez.money/{slug}` | Restaurant ordering |
| 3 | **Store QR** | `now.rez.money/{slug}` | Universal merchant QR |
| 4 | **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Campaign tracking |
| 5 | **Verify QR** | `verify.rez.money/s/{serial}` | Product authentication |
| 6 | **Creator QR** | `creator.rez.money/{creatorId}` | Creator profile link |

---

# ADDITIONAL EMBEDDED PROJECTS

## HTML Dashboards

### REE-Admin
**Location:** `REE-Admin/`
**File:** `ree-admin.html`
**Purpose:** Admin dashboard interface

### REE-Monitoring
**Location:** `REE-Monitoring/`
**File:** `monitor.html`
**Purpose:** Monitoring dashboard

---

# CONSUMER APP - ALL SCREENS (Categorized)

## Authentication
- login.tsx
- otp.tsx
- account-recovery.tsx
- maintenance.tsx

## Profile & Settings
- account.tsx
- profile (in tabs)
- settings (in tabs)
- notification-preferences.tsx
- help.tsx
- faq.tsx
- legal.tsx

## Shopping
- home.tsx (index)
- explore.tsx
- search.tsx
- categories.tsx
- food.tsx
- beauty.tsx
- fashion.tsx
- electronics.tsx
- health.tsx
- fitness.tsx
- grocery.tsx
- brand.tsx
- brands.tsx
- mall.tsx
- deal-store.tsx
- deal-success.tsx
- flash-sales (folder)
- flash-sale-success.tsx
- group-buy.tsx
- compare.tsx

## Stores & Products
- store.tsx
- Store.tsx
- StoreListPage.tsx
- StoreProductsPage.tsx
- MainStorePage.tsx
- MainStoreSection (folder)
- StoreSection (folder)
- category.tsx
- MainCategory (folder)
- category.tsx
- products, my-products.tsx

## Cart & Checkout
- cart.tsx
- checkout.tsx
- order-confirmation.tsx
- order.tsx
- order-history.tsx
- home-delivery.tsx
- home-delivery
- dinein-tracking.tsx
- drivethru-tracking.tsx
- pickup-tracking.tsx

## Payments
- payment.tsx
- payment-methods.tsx
- payment-razorpay.tsx
- payment-success.tsx
- bill-payment.tsx
- bill-upload.tsx
- bill-upload-enhanced.tsx
- bill-history.tsx
- pay-in-store.tsx

## Booking
- booking.tsx
- booking-detail.tsx
- my-bookings.tsx
- hotel.tsx
- hotel-booking.tsx
- flight.tsx
- bus.tsx
- cab.tsx
- appointment.tsx
- appointments (folder)
- parking.tsx
- recharge.tsx
- travel.tsx
- trip.tsx

## Wallet & Coins
- wallet.tsx (in tabs)
- coins.tsx
- coin-system.tsx
- bonus-zone.tsx
- bonus-zone-history.tsx
- gold-savings.tsx
- investment.tsx
- earning.tsx
- earnings-history.tsx
- khata.tsx

## Loyalty & Gamification
- karma.tsx (in tabs)
- badges.tsx (in tabs)
- achievements.tsx (in tabs)
- challenges (folder)
- mission-detail.tsx
- missions.tsx
- leaderboard.tsx (in tabs)
- checkin-history.tsx
- loyalty.tsx
- loyalty-program.tsx
- streak.tsx
- coins.tsx
- bonus-zone.tsx

## Creator System
- creator (folder)
  - [id].tsx - Public creator profile
  - edit.tsx - Edit creator profile
- creator-apply.tsx - Apply to become creator
- creator-dashboard.tsx - Creator dashboard
- creators.tsx - Creator listings
- submit-pick.tsx - Submit creator picks
- picks.tsx
- my-products.tsx
- my-services.tsx

## UGC & Content
- ugc.tsx
- UGCDetailScreen.tsx
- article.tsx
- articles.tsx
- ArticleDetailScreen.tsx
- learn.tsx
- events.tsx
- events-list.tsx
- EventPage.tsx
- events (folder)

## Campaigns & Marketing
- campaign.tsx
- campaigns.tsx
- invite-friends.tsx
- earn-from-social-media.tsx
- reviews.tsx
- my-reviews.tsx
- review.tsx
- my-deals.tsx
- my-vouchers.tsx
- voucher.tsx
- occassan.tsx
- occasions.tsx

## Experiences
- experience.tsx
- occasions.tsx
- going-out.tsx
- group-buy.tsx

## Games & Entertainment
- games.tsx
- playandearn.tsx
- playande (folder)

## Finance & Services
- financial.tsx
- insurance.tsx
- healthcare.tsx
- home-services.tsx
- beauty.tsx
- salon.tsx
- spa.tsx

## Other Features
- map.tsx
- location.tsx
- near-u.tsx
- friends.tsx
- messages.tsx
- notifications (folder)
- admin.tsx
- restaurant.tsx
- istore.tsx
- subscription.tsx
- bank-offers.tsx
- package.tsx
- ImageDetailScreen.tsx
- PostDetailScreen.tsx
- disputes.tsx
- how-rez-works.tsx
- how-cash-store-works.tsx
- +html.tsx
- not-found.tsx

---

# TAB NAVIGATION STRUCTURE

## Main Tabs (Bottom Navigation)
1. Home
2. Search
3. Cart
4. Orders
5. Wallet

## (tabs) Folder
Contains tab-specific screens

---

# SUMMARY STATISTICS

| Category | Count |
|----------|-------|
| Mobile Apps | 6 |
| Consumer App Screens | 150+ |
| Web Apps | 20+ |
| Backend Services | 60+ |
| AI Agents | 10+ |
| Intent Types | 15+ |
| Event Types | 82+ |
| Shared Packages | 20+ |
| QR Systems | 6 |
| External Integrations | 25+ |
| Dockerfiles | 64 |
| docker-compose files | 35+ |
| GitHub Workflows | 10 |

---

*Map generated: May 4, 2026*
*Deep Audit v4.0 - Complete with All Features*
