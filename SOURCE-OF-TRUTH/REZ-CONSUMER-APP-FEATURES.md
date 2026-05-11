# REZ CONSUMER APP - COMPLETE FEATURES

**App:** ReZ Consumer (React Native/Expo)
**Platform:** iOS & Android
**Repository:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer`

---

## OVERVIEW

ReZ Consumer is the main mobile app for shoppers to:
- Browse and purchase products
- Earn ReZ Coins and cashback
- Track orders in real-time
- Manage wallet and referrals
- Discover nearby stores

---

## SCREENS & FEATURES

### 1. AUTHENTICATION

| Screen | Features |
|--------|---------|
| `sign-in.tsx` | Phone/email login, OTP verification |
| `otp.tsx` | OTP input, resend option |
| `forgot-password.tsx` | Password reset |

**Features:**
- Phone/Email OTP verification
- JWT token persistence
- Auto-refresh tokens
- Biometric authentication

---

### 2. HOME / SHOPPING

| Screen | Features |
|--------|---------|
| `home.tsx` | Featured products, categories, offers |
| `search.tsx` | Search with filters |
| `product-page.tsx` | Product details, reviews |
| `brands.tsx` | Brand directory |
| `fashion.tsx` | Fashion category |
| `shop.tsx` | Shop by category |

**Features:**
- Category browsing
- Search with filters (price, brand, rating)
- Featured products carousel
- Flash sales
- Trending items
- Personalized recommendations

---

### 3. STORES

| Screen | Features |
|--------|---------|
| `Store.tsx` | Store details, menu |
| `StoreListPage.tsx` | Nearby stores |
| `OutletsPage.tsx` | Store locations |
| `MainStorePage.tsx` | Store home |

**Features:**
- Store search
- Distance-based sorting
- Ratings and reviews
- Store categories
- Store details with images

---

### 4. ORDERS & CHECKOUT

| Screen | Features |
|--------|---------|
| `cart.tsx` | Cart management |
| `checkout.tsx` | Address, payment selection |
| `payment.tsx` | Payment methods |
| `order-history.tsx` | Past orders |
| `tracking.tsx` | Real-time order tracking |
| `booking-detail.tsx` | Booking details |

**Features:**
- Multi-item cart
- Saved addresses
- Multiple payment options
- Split bill
- Real-time tracking
- Order history
- Cancel/Return
- Complaint filing

---

### 5. WALLET & REWARDS

| Screen | Features |
|--------|---------|
| `wallet-screen.tsx` | Balance overview |
| `wallet-history.tsx` | Transaction history |
| `earnings-history.tsx` | Cashback history |
| `referral.tsx` | Referral program |
| `invite-friends.tsx` | Invite contacts |
| `coin-system.tsx` | ReZ Coins info |
| `rez-cash.tsx` | Cash rewards |
| `savings-goals.tsx` | Savings tracker |
| `rewards-history.tsx` | Points earned |

**Features:**
- ReZ Coins balance
- Cashback tracking
- Referral code sharing
- Transaction history
- Earnings breakdown
- Savings goals
- Tier progress (Bronze→Platinum)

---

### 6. BOOKINGS

| Screen | Features |
|--------|---------|
| `booking.tsx` | New booking |
| `my-bookings.tsx` | Past bookings |
| `booking-detail.tsx` | Booking details |
| `travel-booking-confirmation.tsx` | Travel booking |

**Features:**
- Hotel bookings
- Travel bookings
- Appointment bookings
- Booking history

---

### 7. OFFERS & DEALS

| Screen | Features |
|--------|---------|
| `campaigns.tsx` | Active campaigns |
| `deal-store.tsx` | Deal of the day |
| `deal-success.tsx` | Deal purchased |
| `flash-sale-success.tsx` | Flash sale win |
| `bonus-zone-history.tsx` | Bonus zone |

**Features:**
- Daily deals
- Flash sales
- Campaign offers
- Bonus zone rewards
- Limited-time offers

---

### 8. REWARDS & GAMIFICATION

| Screen | Features |
|--------|---------|
| `missions.tsx` | Daily missions |
| `mission-detail.tsx` | Mission details |
| `playandearn.tsx` | Play to earn |
| `earnings-history.tsx` | Rewards earned |
| `my-vouchers.tsx` | Voucher wallet |
| `streak.tsx` | Daily streak |

**Features:**
- Daily check-in rewards
- Mission completion
- Streak bonuses
- Achievement badges
- Voucher collection
- Leaderboard

---

### 9. CONTENT & SOCIAL

| Screen | Features |
|--------|---------|
| `articles.tsx` | Articles/Blogs |
| `ArticleDetailScreen.tsx` | Article view |
| `creators.tsx` | Creator profiles |
| `UGCDetailScreen.tsx` | User content |
| `ugc-upload.tsx` | Upload content |
| `my-reviews.tsx` | My reviews |
| `events-list.tsx` | Events |
| `my-events.tsx` | My events |

**Features:**
- Article reading
- Creator following
- User reviews
- Photo uploads
- Event discovery

---

### 10. SERVICES

| Screen | Features |
|--------|---------|
| `home-delivery.tsx` | Delivery service |
| `recharge.tsx` | Mobile recharge |
| `bill-payment.tsx` | Bill payments |
| `insurance.tsx` | Insurance products |
| `subscriptions.tsx` | Subscription mgmt |
| `group-buy.tsx` | Group purchases |

**Features:**
- Mobile recharge
- DTH recharge
- Bill payments (electricity, water, gas)
- Insurance products
- Subscription management
- Group buying

---

### 11. PROFILE & SETTINGS

| Screen | Features |
|--------|---------|
| `profile.tsx` | User profile |
| `settings.tsx` | App settings |
| `payment-methods.tsx` | Saved cards |
| `my-products.tsx` | Saved products |
| `wishlist.tsx` | Favorites |
| `surveys.tsx` | Feedback surveys |

**Features:**
- Profile editing
- Address management
- KYC verification
- Student verification
- Notification preferences
- Language settings
- Privacy controls

---

### 12. QR & CHECKIN

| Screen | Features |
|--------|---------|
| `qr-checkin.tsx` | QR code scanner |
| `store-visit.tsx` | Store visit checkin |
| `whats-new.tsx` | App updates |

**Features:**
- QR code scanning
- Store check-ins
- Loyalty point collection

---

### 13. TRAVEL & HOTEL

| Screen | Features |
|--------|---------|
| `travel-booking-confirmation.tsx` | Travel booked |
| `events-list.tsx` | Events nearby |

**Features:**
- Hotel booking
- Flight booking (via TBO API)
- Train booking (via IRCTC API)
- Cab booking (via Uber/Ola API)
- Event tickets

---

## TECHNICAL ARCHITECTURE

### Navigation Structure

```
app/
├── (auth)/              # Authentication screens
├── (tabs)/              # Main tab navigation
│   ├── home/           # Home feed
│   ├── wallet/         # Wallet & rewards
│   ├── orders/         # Order history
│   └── profile/        # Settings
├── product/            # Product details
├── checkout/           # Cart & payment
└── _layout.tsx         # Root layout
```

### API Client Features

| Feature | Description |
|---------|-------------|
| Auto-authentication | Tokens injected from secure storage |
| Request deduplication | Prevents double-submit |
| Concurrency limiting | Max 5 parallel requests |
| Retry logic | 3 attempts, exponential backoff |
| Timeout | Default 30 seconds |
| Region-aware | Auto-selects regional API |

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    pagination?: { page, limit, total, pages };
  };
}
```

---

## SERVICES (API CLIENTS)

| Service | File | Purpose |
|---------|------|---------|
| API Client | `services/apiClient.ts` | Main HTTP client |
| Orders | `services/ordersApi.ts` | Order operations |
| Products | `services/productsApi.ts` | Product data |
| Wallet | `services/walletApi.ts` | Wallet operations |
| Payment | `services/paymentService.ts` | Payment processing |
| Stores | `services/storesApi.ts` | Store data |
| Search | `services/searchApi.ts` | Search queries |
| Notifications | `services/notificationsApi.ts` | Push notifications |

---

## KEY INTEGRATIONS

| Integration | Purpose |
|-------------|---------|
| Firebase/FCM | Push notifications |
| Sentry | Error tracking |
| REZ Mind | Intent tracking |
| Payment Gateway | UPI, Cards, Wallets |
| Maps API | Location services |
| Camera API | QR scanning |

---

## FILES REFERENCE

### Screens (85+)
```
app/
├── sign-in.tsx
├── home.tsx
├── search.tsx
├── cart.tsx
├── checkout.tsx
├── payment.tsx
├── order-history.tsx
├── tracking.tsx
├── wallet-screen.tsx
├── wallet-history.tsx
├── referral.tsx
├── booking.tsx
├── my-bookings.tsx
├── campaigns.tsx
├── missions.tsx
├── products.tsx
├── Store.tsx
├── StoreListPage.tsx
├── profile.tsx
├── settings.tsx
├── wishlist.tsx
├── my-reviews.tsx
├── articles.tsx
├── creators.tsx
├── events.tsx
├── recharge.tsx
├── bill-payment.tsx
├── insurance.tsx
├── subscriptions.tsx
├── qr-checkin.tsx
└── ... (60+ more)
```

---

## STATUS

| Feature | Status |
|---------|--------|
| Authentication | ✅ Complete |
| Shopping | ✅ Complete |
| Cart & Checkout | ✅ Complete |
| Orders | ✅ Complete |
| Wallet | ✅ Complete |
| Referrals | ✅ Complete |
| Bookings | ✅ Complete |
| Gamification | ✅ Complete |
| Travel | ✅ Complete |
| Services | ✅ Complete |
| Profile | ✅ Complete |

---

**Last Updated:** 2026-05-03
