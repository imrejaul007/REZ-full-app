# REZ Platform — Complete Feature Map

**Last updated:** 2026-04-20
**Platform:** Consumer App + Merchant App + Admin App + REZ Now + Web Menu + Microservices

---

## Platform Summary

| App | Repo | Deploy | Screens | Primary Use |
|------|-------|--------|---------|-------------|
| **Consumer App** | `rez-app-consumer` | EAS + Vercel web | 617 screens | End users: discover, order, pay, earn coins |
| **Merchant App** | `rez-app-marchant` | EAS | ~280 routes | Merchants: manage store, POS, orders, analytics |
| **Admin App** | `rez-app-admin` | Vercel | ~139 screens | Platform admins: moderation, support, operations |
| **REZ Now** | `rez-now` | Vercel | ~80 routes | Merchant QR payment + public store page |
| **Web Menu** | `rez-web-menu` | Vercel | QR web menu | Consumer: scan QR, browse menu, order |
| **AdBazaar** | `adBazaar` | Vercel | Next.js | Brand ad campaigns + CPA/CPM marketplace |

---

# CONSUMER APP (`rez-app-consumer`)

**Stack:** Expo SDK 53, React Native 0.79, TypeScript, Expo Router, TanStack Query, Zustand, Victory Native, Socket.io, Razorpay, Sentry
**API:** `https://rez-api-gateway.onrender.com/api`
**Coin Economics:** 1 coin = ₹1 (earn 1/₹1, redeem 1/₹1)

## App Tabs

| Tab | Description |
|-----|-------------|
| Home / Discover | Personalized feed, store categories, featured offers |
| Earn | All ways to earn coins (scan, social, referrals, games) |
| Finance | Wallet, transactions, savings, investments |
| Play | Games, scratch cards, spin-to-win, challenges |
| Account | Profile, settings, order history, notifications |

---

## C1. Authentication & Account

| Feature | Screen | Description |
|---------|--------|-------------|
| Phone + OTP Login | `sign-in.tsx` | Login or register via 6-digit OTP. JWT stored in SecureStore. |
| Email/Password Login | `sign-in.tsx` | Email + password fallback |
| Guest Mode | `sign-in.tsx` | Guest browsing without account |
| Forgot Password | `account-recovery.tsx` | Email-based reset |
| PIN Login | `sign-in.tsx` | 4-digit PIN for returning users |
| Biometric Auth | `sign-in.tsx` | Face ID / fingerprint via `expo-local-authentication` |
| Session Management | `app/_layout.tsx` | JWT refresh, httpOnly cookies, token rotation |
| Account Deletion | `account/delete-account.tsx` | GDPR-compliant account deletion |
| Language Settings | `account/language.tsx` | In-app language switch |
| Notification Preferences | `account/email-notifications.tsx` | Push, email, SMS toggles |
| Delivery Preferences | `account/delivery.tsx` | Address management, courier preferences |
| Change Password | `account/change-password.tsx` | Authenticated password change |
| Onboarding | `onboarding/` | Multi-step onboarding: profile → preferences → permissions |

---

## C2. Wallet & Coins

| Feature | Screen | Description |
|---------|--------|-------------|
| Wallet Balance | `wallet-screen.tsx` | REZ coin balance with last transaction |
| Coin Transactions | `wallet-history.tsx` | Full ledger: earned, spent, expired, expired |
| Recharge Wallet | `recharge.tsx` | Add coins via Razorpay (UPI/card/netbanking) |
| REZ Cash | `rez-cash.tsx` | Cashback balance separate from coins |
| REZ Score | `rez-score.tsx` | Credit/reputation score display |
| Savings Goals | `savings-goals.tsx` | Set savings targets, track progress |
| Gold Savings | `gold-savings.tsx` | Digital gold purchase and storage |
| Smart Spending | `smart-spending.tsx` | AI-powered spending insights |
| Smart Spend | `smart-spend.tsx` | Spending categorization and tips |
| Share Savings | `share-savings.tsx` | Share savings goals with friends |
| Bill Payment | `bill-payment.tsx` | Pay utility bills, recharge, DTH |
| Bill History | `bill-history.tsx` | Past bill payments |
| Bill Upload | `bill-upload-enhanced.tsx` | Upload and earn cashback on bills |
| Bill Simulator | `bill-simulator.tsx` | Estimate monthly spending |

---

## C3. Stores & Discovery

| Feature | Screen | Description |
|---------|--------|-------------|
| Home Feed | `(tabs)/index.tsx` | Personalized store feed, categories, featured |
| Store Search | `search.tsx` | Search stores by name, category, location |
| Category Browse | `categories.tsx` | Browse by: Food, Beauty, Fashion, Grocery, Travel, Health, Fitness |
| Food | `food.tsx` | Restaurant and food delivery |
| Fashion | `fashion.tsx` | Clothing, apparel, beauty products |
| Electronics | `electronics.tsx` | Consumer electronics |
| Grocery | `grocery.tsx` | Supermarket and daily needs |
| Health & Beauty | `beauty.tsx` | Salon, spa, beauty products |
| Travel | `travel/` | Flights, hotels, trains, buses, cabs |
| Home Services | `home-services/` | Plumber, electrician, cleaning, pest control |
| Fitness | `fitness.tsx` | Gym, yoga, personal training |
| Healthcare | `healthcare.tsx` | Doctor consultations, medicine delivery |
| Mall | `mall.tsx` | Multi-brand shopping |
| Brand Stores | `brands.tsx` | Brand-specific pages |
| Store Detail | `Store.tsx` | Store page: menu, offers, reviews, loyalty |
| Store List | `StoreListPage.tsx` | Nearby stores with filters |
| Store Products | `StoreProductsPage.tsx` | Product catalog within a store |
| Store Reviews | `store-reviews.tsx` | Customer reviews and ratings |
| Store Products | `products/` | Browse products within a store |
| Product Detail | `product-page.tsx` | Full product info, pricing, reviews |
| Article Detail | `ArticleDetailScreen.tsx` | Editorial content and blog posts |
| Articles List | `articles.tsx` | Editorial and brand content |
| Compare | `compare.tsx` | Compare products side-by-side |
| Map / Near U | `map/` | Location-based store discovery |
| Near-U Discovery | `near-u/` | Hyperlocal nearby offerings |
| Explore Feed | `explore.tsx` | Infinite scroll discovery feed |
| Going Out | `going-out.tsx` | Nightlife, events, entertainment |
| Occasions | `occasions.tsx` | Seasonal/celebration deals |

---

## C4. Ordering & Checkout

| Feature | Screen | Description |
|---------|--------|-------------|
| Cart | `cart.tsx` | Add/remove items, quantity, modifiers |
| Checkout | `checkout.tsx` | Address selection, payment method, order summary |
| Payment | `payment.tsx` | UPI, card, wallet, REZ coins |
| Payment (Razorpay) | `payment-razorpay.tsx` | Native Razorpay sheet |
| Order Confirmation | `order-confirmation.tsx` | Success screen after order placed |
| Home Delivery | `home-delivery.tsx` | Delivery ordering flow |
| Order Tracking | `tracking.tsx` | Real-time order status and ETA |
| Order History | `order-history.tsx` | Past orders list |
| Booking | `booking.tsx` | Service appointments and reservations |
| Booking Detail | `booking-detail.tsx` | Full booking info with status |
| My Bookings | `my-bookings.tsx` | All active and past bookings |
| Dine-In Tracking | `dinein-tracking.tsx` | Table booking and in-restaurant tracking |
| Drive-Thru Tracking | `drivethru-tracking.tsx` | Drive-thru order status |
| Order Confirm | `order/` | Order flow sub-screens |
| Wallet Checkout | `checkout.tsx` | Pay with REZ coin balance |

---

## C5. Payments

| Feature | Screen | Description |
|---------|--------|-------------|
| Add Payment Method | `payment-methods.tsx` | Add UPI, debit/credit card, bank account |
| Pay In Store | `pay-in-store/` | QR scan to pay merchant in-store |
| Payment Success | `payment-success.tsx` | Post-payment confirmation |
| Coin Redemption | `redeem-coins.tsx` | Use coins to discount order total |
| Wallet Payment | `wallet-screen.tsx` | Pay directly from coin balance |

---

## C6. Loyalty & Rewards

| Feature | Screen | Description |
|---------|--------|-------------|
| Loyalty Program | `loyalty.tsx` | View tier status, earn rules, benefits |
| Tier Benefits | `tier-benefits.tsx` | Bronze/Silver/Gold/Platinum benefits |
| Punch Cards | `loyalty.tsx` | Visit-stamp cards for rewards |
| Stamp Cards | `loyalty.tsx` | Digital stamps for free items |
| Branded Coins | `BrandedCoinsScreen.tsx` | Merchant-branded coin programs |
| Coupons | `account/coupons.tsx` | Available and redeemed coupons |
| Vouchers | `my-vouchers.tsx` | Gift cards and vouchers |
| Cashback | `account/cashback.tsx` | Cashback balance and history |
| Coin System | `coin-system.tsx` | How to earn and redeem coins |
| REZ Cash | `rez-cash.tsx` | Cashback separate from coins |

---

## C7. Earn Coins (Gamified Discovery)

| Feature | Screen | Description |
|---------|--------|-------------|
| Scan & Earn | `qr-checkin.tsx` | Scan merchant QR → earn visit coins |
| Earn From Social Media | `earn-from-social-media.tsx` | Earn coins for social sharing |
| Invite Friends | `invite-friends.tsx` | Referral program — earn when friend joins and transacts |
| Referral Code | `referral.tsx` | Share code, track referrals |
| Earn Tab | `(tabs)/earn.tsx` | All earning methods in one place |
| Store Visit | `store-visit.tsx` | Log and earn from visiting a store |
| Check-In History | `checkin-history.tsx` | All QR scans and visits |
| Bill Upload Earn | `bill-upload-enhanced.tsx` | Upload bill → earn cashback coins |
| Scratch Card | `scratch-card.tsx` | Scratch to reveal bonus coins |
| Spin to Win | `playandearn.tsx` | Lucky spin for bonus rewards |
| Bonus Zone | `bonus-zone.tsx` | Daily bonus activities |
| Bonus Zone History | `bonus-zone-history.tsx` | Past bonus activity log |
| My Earnings | `my-earnings.tsx` | Total coins earned breakdown |
| Earnings History | `earnings-history.tsx` | Coin-earning transaction log |

---

## C8. Games & Entertainment

| Feature | Screen | Description |
|---------|--------|-------------|
| Play & Earn | `(tabs)/play.tsx` | Gaming hub with coin rewards |
| Scratch Card | `scratch-card.tsx` | Scratch-to-reveal bonus |
| Spin to Win | `playandearn.tsx` | Lucky wheel with rewards |
| Missions | `missions.tsx` | Complete tasks → earn coins |
| Mission Detail | `mission-detail.tsx` | Mission description and progress |
| Weekly Challenge | `weekly-challenge.tsx` | Weekly leaderboard challenges |
| Achievements | `achievements/` | Unlock badges and earn rewards |
| Leaderboard | `leaderboard.tsx` | Rank against other users |
| Games | `games/` | Arcade and casual games |
| Deal Store | `deal-store.tsx` | Time-limited deals |
| Flash Sale | `flash-sale-success.tsx` | Flash sale purchases |
| Lock Deals | `lock-deals.tsx` | Lock price on product for 24h |
| Group Buy | `group-buy.tsx` | Join group buys for discounts |

---

## C9. Gamification

| Feature | Screen | Description |
|---------|--------|-------------|
| Badges | `badges.tsx` | Achievement badges earned |
| Karma Score | `karma/` | Reputation and trust score |
| Streaks | `gamification/` | Daily streak rewards |
| Points | `gamification/` | Loyalty points tracking |
| Leveling | `gamification/` | User level progression |

---

## C10. Travel & Bookings

| Feature | Screen | Description |
|---------|--------|-------------|
| Flights | `flight/` | Flight search, booking, seat selection |
| Hotels | `hotel/` | Hotel search, room selection, payment, booking confirmation |
| Trains | `train/` | Train ticket booking with PNR |
| Bus Booking | `bus/` | Bus ticket booking |
| Cab Booking | `cab/` | Outstation and local cab booking |
| Package Deals | `travel/` | Holiday packages |
| Travel Booking Confirm | `travel-booking-confirmation.tsx` | Post-booking confirmation |
| Hotel Checkout | `app/travel/hotels/checkout.tsx` | Hotel payment screen |
| Room Details | `app/travel/` | Hotel room types and pricing |
| Hotel Offer | `app/travel/` | Hotel-specific deals |

---

## C11. Home Services

| Feature | Screen | Description |
|---------|--------|-------------|
| Service Categories | `home-services/` | Plumber, electrician, carpenter, cleaning, pest control, painting |
| Service Booking | `home-services/` | Book appointment with preferred time slot |
| Service Tracking | `tracking.tsx` | Track service provider ETA |
| Service History | `my-services.tsx` | Past home service bookings |
| Salon Booking | `beauty/` | Salon appointments |
| Spa & Wellness | `beauty/` | Spa and wellness services |

---

## C12. Reviews & Content

| Feature | Screen | Description |
|---------|--------|-------------|
| Write Review | `reviews/` | Star rating + text + photo upload |
| My Reviews | `my-reviews.tsx` | All reviews you've written |
| Store Reviews | `store-reviews.tsx` | Customer reviews on store pages |
| Article Content | `ArticleDetailScreen.tsx` | Branded editorial content |
| UGC Upload | `ugc-upload.tsx` | Share photo/video of purchase |
| UGC Detail | `UGCDetailScreen.tsx` | View customer-submitted media |
| Post Detail | `PostDetailScreen.tsx` | Social post detail |
| Social Feed | `social/` | Social content feed |
| Social Impact | `social-impact.tsx` | CSR events and volunteering |

---

## C13. Social & Community

| Feature | Screen | Description |
|---------|--------|-------------|
| Friends | `friends/` | Friend list and requests |
| Social Sharing | `social-media.tsx` | Share deals on social platforms |
| Social Impact | `social-impact.tsx` | Volunteer and donation events |
| Events | `events-list.tsx` | Local events and experiences |
| Event Detail | `EventPage.tsx` | Event info and RSVP |
| My Events | `my-events.tsx` | Attending and past events |
| Challenges | `challenges/` | Community challenges |
| Near-U | `near-u/` | Hyperlocal social discovery |
| Whats New | `whats-new.tsx` | Changelog and announcements |
| Learn | `learn/` | Educational content |
| Survey | `surveys/` | Earn coins for completing surveys |

---

## C14. Creator & Influencer

| Feature | Screen | Description |
|---------|--------|-------------|
| Creator Apply | `creator-apply.tsx` | Apply to become a REZ creator |
| Creator Dashboard | `creator-dashboard.tsx` | Content performance, earnings |
| Creators Browse | `creators.tsx` | Discover and follow creators |
| Picks | `picks/` | Creator-curated product picks |
| Prive | `prive/` | UGC hashtag campaigns with rewards |
| Prive Offers | `prive-offers/` | Creator-exclusive deals |
| Submit Pick | `submit-pick.tsx` | Submit product recommendations |
| Submission Detail | `submission-detail.tsx` | Pick submission tracking |

---

## C15. Offers & Deals

| Feature | Screen | Description |
|---------|--------|-------------|
| Offers Hub | `offers/` | All active deals and discounts |
| Card Offers | `CardOffersPage.tsx` | Debit/credit card-specific deals |
| Saved Offers | `saved-offers.tsx` | Bookmarked offers |
| Deal Success | `deal-success.tsx` | Post-deal purchase confirmation |
| My Deals | `my-deals.tsx` | Purchased deals and vouchers |
| Lock Deals | `lock-deals.tsx` | Price-lock feature |
| Flash Sales | `flash-sales/` | Time-limited flash sales |
| Online Vouchers | `online-voucher.tsx` | Digital vouchers |

---

## C16. Financial Products

| Feature | Screen | Description |
|---------|--------|-------------|
| Gold Savings | `gold-savings.tsx` | Buy and store digital gold |
| Insurance | `insurance.tsx` | Insurance products |
| Savings Goals | `savings-goals.tsx` | Goal-based savings |
| REZ Score | `rez-score.tsx` | Creditworthiness indicator |
| Smart Spend | `smart-spend.tsx` | Spending analytics |
| Share Savings | `share-savings.tsx` | Collaborative savings |
| Subscriptions | `subscriptions.tsx` | Recurring payments management |
| Cash Store | `cash-store/` | Cashback on purchases |
| Project Detail | `project-detail.tsx` | Investment project details |
| Projects | `projects.tsx` | Investment opportunities |

---

## C17. Support & Help

| Feature | Screen | Description |
|---------|--------|-------------|
| Help Center | `help/` | FAQ and support articles |
| Support | `support/` | Chat with support |
| Disputes | `disputes/` | Raise and track disputes |
| Legal | `legal/` | Terms, privacy, refunds policy |
| How REZ Works | `how-rez-works.tsx` | Platform education |
| How Cash Store Works | `how-cash-store-works.tsx` | Cashback explainer |
| FAQ | `faq.tsx` | Frequently asked questions |
| Notifications | `notifications/` | Push notification center |
| Notification Preferences | `notification-preferences.tsx` | Toggle notification types |

---

## C18. Account & Profile

| Feature | Screen | Description |
|---------|--------|-------------|
| Profile | `profile/` | Name, photo, bio, phone |
| Addresses | `account/addresses.tsx` | Manage delivery addresses |
| Order History | `order-history.tsx` | All past orders |
| Wishlist | `wishlist.tsx` | Saved products |
| Saved Cards | `payment-methods.tsx` | Stored payment methods |
| Language | `account/language.tsx` | App language |
| Settings | `settings.tsx` | App preferences |
| Share | `share.tsx` | Share REZ with friends |
| Ring Sizer | `ring-sizer.tsx` | AR ring size measurement |
| Products Videos | `products-videos.tsx` | Product video library |
| Learn | `learn/` | Platform tutorials |

---

## C19. Messaging

| Feature | Screen | Description |
|---------|--------|-------------|
| Messages | `messages/` | Merchant-consumer chat threads |
| Notifications | `notifications/` | App notification center |
| Notifications Tab | `(tabs)/notifications/` | Notification tab screen |

---

## C20. Khata (Credit Ledger)

| Feature | Screen | Description |
|---------|--------|-------------|
| Khata | `khata/` | Customer credit account with merchant |
| Khata Index | `khata/index.tsx` | List of khata accounts |
| Khata Detail | `khata/[id].tsx` | Transaction history, balance |

---

# MERCHANT APP (`rez-app-marchant`)

**Full reference:** [MERCHANT-APP.md](SOURCE-OF-TRUTH/MERCHANT-APP.md) — 290 features across 39 categories

---

# ADMIN APP (`rez-app-admin`)

**Stack:** Next.js 14+, TypeScript, Tailwind CSS
**Deploy:** Vercel
**Repo:** `imrejaul007/rez-app-admin`

## Screens

| Screen | Description |
|--------|-------------|
| Dashboard | Platform overview: GMV, merchants, users, active campaigns |
| Auth | `app/(auth)/login.tsx` — Email + password + TOTP MFA |
| Merchants | `app/(dashboard)/merchants/` — Merchant management, approval, suspension |
| Users | `app/(dashboard)/users/` — Consumer user management, search, block |
| Orders | `app/(dashboard)/orders/` — All platform orders with filters |
| Analytics | `app/(dashboard)/analytics/` — Platform-wide revenue, conversion, engagement |
| Campaigns | `app/(dashboard)/campaigns/` — Ad campaign management |
| Reports | `app/(dashboard)/reports/` — Financial and operational reports |
| Disputes | `app/(dashboard)/disputes/` — Support escalation queue |
| Support | `app/(dashboard)/support/` — Ticket management |
| Moderation | `app/(dashboard)/moderation/` — Review/UGC content approval |
| Audit Logs | `app/(dashboard)/audit/` — Admin action logs |
| Settings | `app/(dashboard)/settings/` — Platform configuration |
| Notifications | `app/(dashboard)/notifications/` — System notification broadcast |
| Fraud | `app/(dashboard)/fraud/` — Suspicious activity detection |

---

# REZ NOW (`rez-now`)

**Stack:** Next.js 14+, TypeScript, Tailwind CSS
**Deploy:** Vercel (`https://rez-now.vercel.app`)
**Repo:** `imrejaul007/rez-now`

## Features

| Feature | Description |
|---------|-------------|
| Public Store Page | Merchant-branded QR landing page with menu, offers, reviews |
| QR Code Payment | Scan QR → pay via UPI/card/Razorpay |
| Order Placement | Browse menu → add to cart → checkout → pay |
| Real-Time Order | Socket.io updates for order status |
| Coin Earning | Earn coins on every payment |
| Loyalty Display | Show available stamps, coins, tier benefits |
| Reviews | Browse and submit store reviews |
| Location-Based | Show nearby stores |
| Social Sharing | Share store page on social media |
| Multi-Store | Single link for multi-outlet merchants |
| WhatsApp Share | Share menu link via WhatsApp |
| Dark Mode | System theme detection |

---

# WEB MENU (`rez-web-menu`)

**Stack:** Next.js, React
**Deploy:** Vercel (`https://menu.rez.money`)
**Repo:** `imrejaul007/rez-web-menu`

## Features

| Feature | Description |
|---------|-------------|
| QR Code Menu | Mobile-optimized menu accessed via store QR |
| Category Browse | Browse products by category |
| Product Detail | Full product info with images |
| Cart | Add/remove items |
| Checkout | Enter name, phone → OTP → pay |
| UPI Payment | Generate UPI QR for payment |
| Order Confirmation | Success screen with order ID |
| Merchant Dashboard | Real-time order management |
| KDS View | Kitchen display for incoming orders |
| Socket.io | Real-time order sync |

---

# ADBAZAAR (`adBazaar`)

**Stack:** Next.js 14, Supabase, Razorpay, Tailwind CSS
**Deploy:** Vercel
**Repo:** `imrejaul007/adBazaar`

## Features

| Feature | Description |
|---------|-------------|
| Campaign Creation | Brands create ad campaigns with budget and targeting |
| CPA Campaigns | Pay per acquisition/conversion |
| CPM Campaigns | Pay per 1000 impressions |
| Fixed Daily Budget | Set daily spend caps |
| Placement Options | Home banner, explore feed, store listing, search results |
| Campaign Analytics | Views, clicks, CTR, spend, conversions, ROI |
| QR Scan Attribution | Track conversions from QR scans |
| Vendor Dashboard | Merchants manage campaign budgets and payouts |
| Earning Analytics | Vendor revenue breakdown |
| Payout Processing | Weekly payout requests and settlement |
| Ad Proof Upload | Upload creative proof for approval |
| Email XSS Protection | All user data escaped in 5 email templates |
| Inquiry System | Brand inquiry form with duplicate race protection |
| Campaign Booking | Brand books campaign → admin approves → live |
| Vendor Booking | Vendor books campaign slot → brand fulfills |
| Booking Payout | Automatic payout on booking completion |
| Booking Analytics | Per-booking revenue and cost tracking |
| Inquiry List | Vendor inquiry management |

---

# BACKEND MICROSERVICES

## Core Services

| Service | Deploy URL | Features |
|---------|-----------|---------|
| **API Gateway** | `rez-api-gateway.onrender.com` | nginx routing to all microservices |
| **rez-backend** | `rez-backend-8dfu.onrender.com` | Monolith: merchant auth, orders, QR, cashback, wallet legacy |
| **rez-auth-service** | `rez-auth-service.onrender.com` | Consumer OTP/login/session, JWT, PIN, admin MFA, refresh rotation |
| **rez-merchant-service** | `rez-merchant-service-n3q2.onrender.com` | Merchant profile, stores, onboarding |
| **rez-wallet-service** | `rez-wallet-service-36vo.onrender.com` | Coin balance, transactions, referral, credit score |
| **rez-payment-service** | `rez-payment-service.onrender.com` | Razorpay, wallet credit, refunds, coin redemption |
| **rez-order-service** | `rez-order-service-hz18.onrender.com` | Order CRUD, SSE live updates, IDOR protection |
| **rez-catalog-service** | `rez-catalog-service-1.onrender.com` | Product/category CRUD |
| **rez-search-service** | `rez-search-service.onrender.com` | Full-text search |
| **rez-gamification-service** | `rez-gamification-service-3b5d.onrender.com` | Points, missions, leaderboards, streaks |
| **rez-ads-service** | `rez-ads-service.onrender.com` | Campaign management, targeting, billing |
| **rez-marketing-service** | `rez-marketing-service.onrender.com` | Broadcast, email, push notifications |
| **analytics-events** | `analytics-events-37yy.onrender.com` | Event tracking, batch analytics |
| **rez-notification-events** | `rez-notification-events-mwdz.onrender.com` | BullMQ worker: push/email/SMS |
| **rez-media-events** | `rez-media-events-lfym.onrender.com` | BullMQ worker: image/video processing |

## Shared Infrastructure

| Component | Provider | Status |
|-----------|----------|--------|
| MongoDB | Atlas (cluster0.ku78x6g) | Live |
| Redis | Render Redis | Live |
| Sentry | sentry.io | Live |
| Cloudinary | dgqqkrsha | Live |
| Razorpay | Test mode | Live |
| SendGrid | noreply@rez.money | Live |
| Twilio | SMS test | Live |
| Firebase | rez-app-e450d | Live |

---

# ALL PLATFORM USE CASES

## UC-1: Consumer Discovers and Orders Food

1. Open REZ app → Home feed shows nearby restaurants
2. Browse categories or search → Find restaurant
3. View store page → Menu, reviews, offers
4. Add items to cart → Customize (modifiers, extras)
5. Checkout → Select delivery address
6. Pay via UPI/Razorpay/Wallet coins
7. Track order in real-time → ETA updates
8. Order delivered → Earn coins → Leave review

## UC-2: Consumer Pays In-Store via QR

1. Open REZ app → Scan merchant QR code
2. Earn visit_bonus_coins (first scan of the day)
3. Browse menu on web menu
4. Add to cart → Checkout
5. Enter phone → OTP verify
6. Pay via UPI QR displayed on screen
7. Merchant receives order via KDS
8. Coins credited to wallet after payment capture

## UC-3: Merchant Onboards and Goes Live

1. Download REZ Merchant app → Register with phone
2. Enter business details → PAN, GST, bank account
3. Upload documents → Business proof, ID
4. Submit → Pending approval
5. (Admin approves) → Account active
6. Set up REZ Now page → Upload logo, menu, hours
7. Print QR → Display at store
8. Start selling

## UC-4: Merchant Runs POS Sale

1. Open POS tab → Browse product catalog
2. Scan barcode to add items quickly
3. Add modifiers → Customer preferences
4. Apply loyalty discount or voucher
5. Split bill if needed
6. Select payment: Cash / UPI QR / Card via Razorpay
7. Print receipt
8. KDS updates kitchen automatically
9. Settlement auto-calculated at end of day

## UC-5: Merchant Launches Ad Campaign

1. Ads Manager → Create Campaign
2. Select placement: home banner / explore / store listing
3. Set budget (₹2000/day) → CPM bidding
4. AI recommends optimal bid and timing
5. Launch → Monitor views/clicks/conversions live
6. Campaign ends → Payout to merchant wallet
7. REZ earns platform commission

## UC-6: Consumer Earns Coins Multiple Ways

1. Morning: Scan store QR → +5 coins
2. Share deal on Instagram → +10 coins
3. Invite friend → Friend joins → +50 coins
4. Friend places order → +25 coins (referral bonus)
5. Upload bill → +5 coins
6. Complete survey → +3 coins
7. Scratch card → +2 coins
8. Write review → +5 coins
9. Total earned today → Spend at any REZ merchant

## UC-7: Brand Runs AdBazaar Campaign

1. Brand registers on AdBazaar → KYC approved
2. Create campaign → Select placement + budget
3. Submit for review → Platform approves
4. Campaign live → Vendors fulfill impressions/clicks
5. Monitor: views, CTR, conversions
6. Campaign ends → Payout processed automatically
7. ROI reported → Brand decides next campaign

## UC-8: Admin Moderates Platform

1. Login → TOTP MFA required
2. Review pending merchants → Approve or reject with reason
3. Check disputes → Message both parties → Resolve
4. Review flagged UGC → Approve or reject
5. Monitor fraud alerts → Suspend suspicious accounts
6. Broadcast system notification → Push to all users
7. Audit log tracks every action

## UC-9: Salon Merchant Manages Appointments

1. Add services → haircut, coloring, spa
2. Set up consultation form → Pre-appointment intake
3. Configure treatment rooms → Chair 1, Chair 2, Suite
4. Create staff → Assign roles and commission %
5. Staff sets weekly rota → Availability published
6. Customer books via merchant's REZ Now page
7. No-show protection → Deposit required for new clients
8. Patch test record → Track client allergy history
9. Service package → Sell 10-session bundle at discount

## UC-10: Customer Uses Loyalty Program

1. Visit merchant → Earn 1 stamp on punch card
2. 10th visit → Free dessert reward auto-applied
3. Birthday month → Tier upgrade to Gold
4. Gold tier → 2x coin earn rate on all purchases
5. Spend ₹5000 → Unlock Platinum trial
6. Referral → Share code → Friend joins → +100 bonus coins
7. Coins never expire → Spend anytime at any REZ merchant

## UC-11: Consumer Books Travel

1. Travel tab → Search flights/hotels/trains/buses
2. Select → Enter traveler details
3. Pay via Razorpay → Coins credited
4. Booking confirmed → PNR/ticket in app
5. Cancel → Refund processed (policy-based)
6. Rate experience → Earn coins → Help other travelers

## UC-12: Corporate Distributes Employee Rewards

1. Corporate registers on REZ → Bulk employee upload
2. Allocate coins to employees/departments
3. Employees see coins in their REZ wallet
4. Spend at any REZ merchant nationwide
5. HR tracks utilization → Export reports
6. REZ earns platform fee on coin purchase

## UC-13: Merchant Uses Khata (Credit Ledger)

1. Regular customer asks for credit → Add to Khata
2. Customer buys on credit → Log transaction
3. Monthly statement → WhatsApp to customer
4. Customer pays cash → Mark as settled
5. Outstanding balance tracked → Collector reminders
6. Customer defaults → Flag account

## UC-14: Consumer Plays Games to Earn

1. Play tab → Scratch card → Reveal coins
2. Spin to win → Lucky wheel with tiered prizes
3. Weekly challenge → Top 10 scorers get bonus
4. Achievement badges → Unlock by completing tasks
5. Leaderboard → Compete with friends
6. Streak rewards → Daily login → 7-day multiplier

## UC-15: Creator Earns via Prive Campaigns

1. Creator applies → Platform approves
2. Browse Prive campaigns → Select brand
3. Create content → Post with brand hashtag
4. Submit → Brand approves
5. Earn coins → Tracked via UTM/hashtag attribution
6. Dashboard → Track views, engagement, earnings
7. Payout → Weekly settlement to wallet

## UC-16: Hotel Guest Uses REZ Now

1. Scan QR at hotel reception → Opens hotel page
2. Browse restaurant, spa, amenities
3. Book spa appointment → Pay via REZ
4. Order room service → KDS updates
5. Pay at checkout → Coins credited to hotel's wallet
6. Earn coins → Redeem on next stay
7. Review experience → Earn bonus coins

## UC-17: Auto-Settlement (System)

1. End of settlement cycle → BullMQ job triggers
2. Calculate: orders - refunds - fees = net payout
3. Settlement created → Merchant notified
4. Bank transfer initiated → 1-3 business days
5. Funds arrive → Wallet credited → Settlement marked settled
6. Audit log entry created

## UC-18: Coin Expiry Processing (System)

1. BullMQ scheduled job runs daily
2. Scan coins with expiry < now
3. Deduct from wallet → Mark EXPIRED
4. Push notification → Customer informed
5. Transaction logged for audit

## UC-19: Fraud Detection (System)

1. Order pattern: 100 orders/minute from same IP/device
2. ML model flags → Account frozen
3. Push alert → Merchant and admin notified
4. Manual review → Confirm or release
5. Confirmed fraud → Permanent ban + police referral if severe

## UC-20: Campaign Budget Auto-Capping (System)

1. Campaign active → Real-time spend tracking
2. Daily budget reached → Pause impressions
3. Midnight reset → Resume if budget remains
4. Lifetime budget exhausted → Campaign ends
5. Unspent budget returned to merchant wallet

## UC-21: Multi-Store Franchisor Management

1. Create brand → Add 5 outlets
2. Central menu management → Push to all outlets
3. Per-outlet payment settings → Different UPI per store
4. Consolidated analytics → Total revenue across all outlets
5. Best-performing outlet → Top outlet badge
6. Staff at outlet → Role restricted to that outlet only

## UC-22: REZ TRY Trial Conversion

1. Merchant creates TRY trial → Service/Sample/Experience
2. Consumer browses → Signs up for free trial
3. QR code generated → Consumer scans at store
4. Staff verifies trial → Upsells to paid plan
5. Conversion tracked → Merchant earns bonus coins
6. No-show → Trial forfeited

---

# FEATURE COUNT SUMMARY

| Platform Layer | Features |
|---|---|
| Consumer App — Core (Wallet, Auth, Profile) | ~30 |
| Consumer App — Discovery & Stores | ~45 |
| Consumer App — Ordering & Payments | ~20 |
| Consumer App — Loyalty & Rewards | ~15 |
| Consumer App — Earn & Gamify | ~35 |
| Consumer App — Travel & Home Services | ~25 |
| Consumer App — Social & Content | ~30 |
| Consumer App — Financial Products | ~20 |
| Consumer App — Support & Account | ~20 |
| **Consumer App Total** | **~240** |
| **Merchant App Total** | **~290** |
| **Admin App Total** | **~30** |
| **REZ Now Total** | **~15** |
| **Web Menu Total** | **~15** |
| **AdBazaar Total** | **~20** |
| **Backend Services** | **~100** |
| **Platform Total** | **~810 features** |
