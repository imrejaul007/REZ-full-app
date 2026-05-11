# ReZ Consumer App - Restaurant Features Audit

**Audit Date:** May 8, 2026
**App Directory:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/`
**Note:** The `app-consumer/` directory does not exist - only `rez-app-consumer/` exists.

---

## 1. Restaurant Discovery

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Restaurant listing | **EXISTS** | `app/StoreListPage.tsx`, `app/food.tsx`, `app/MainStorePage.tsx` | Full store listing with pagination, filtering |
| Search functionality | **EXISTS** | `app/search.tsx`, `app/StoreListPage.tsx`, `components/store-search/` | Search with debouncing, filters |
| Filters (cuisine, rating, price) | **EXISTS** | `app/StoreListPage.tsx`, `components/store-search/FilterChips.tsx` | Cuisine, rating, price range, delivery time filters |
| Restaurant details page | **EXISTS** | `app/Store.tsx`, `app/MainStorePage.tsx` | Store header, tabs (About, Menu, Reviews, Photos) |
| Reviews/Ratings display | **EXISTS** | `app/store-reviews.tsx`, `app/ReviewPage.tsx`, `components/store/ReviewsTabContent.tsx` | Full review system with photos |
| Photos gallery | **EXISTS** | `components/store/StoreGallerySection.tsx`, `components/store/GalleryViewerModal.tsx` | Gallery with zoom, preloader |
| Operating hours display | **EXISTS** | `services/storesApi.ts` (hours field), `components/store/DeliveryInfo.tsx` | Operational info with open/close times |

---

## 2. Menu & Ordering

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Browse menu by category | **EXISTS** | `app/MainStorePage.tsx` (MenuTabContent), `components/store/MenuTabContent.tsx` | Category-based menu browsing |
| Item details (description, price, image) | **EXISTS** | `app/product-page.tsx`, `services/menuApi.ts` | Full product details with images |
| Add to cart | **EXISTS** | `app/cart.tsx`, `services/cartApi.ts`, `stores/cartStore.ts` | Full cart functionality with state management |
| Customize items (add-ons, notes) | **PARTIAL** | `services/menuApi.ts` (specialInstructions field) | Basic customization via notes field |
| Apply offers/coupons | **EXISTS** | `app/checkout.tsx` (PromoCodeSection), `app/account/coupons.tsx` | Promo code application at checkout |
| Order summary | **EXISTS** | `app/checkout.tsx` (BillSummarySection), `components/checkout/BillSummarySection.tsx` | Full breakdown of charges |
| Place order | **EXISTS** | `app/checkout.tsx`, `services/ordersApi.ts` | Complete checkout flow |

---

## 3. Payment

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| UPI payment | **EXISTS** | `app/payment-methods.tsx`, `services/paymentService.ts` | UPI ID input, UPI apps integration |
| Card payment | **EXISTS** | `app/payment-methods.tsx`, `services/paymentService.ts` | Credit/debit card support |
| Wallet balance | **EXISTS** | `app/wallet-screen.tsx`, `services/rezWalletApi.ts` | ReZ wallet with balance display |
| Cash on delivery | **PARTIAL** | `services/paymentService.ts` | Mentioned in payment methods, not fully visible in UI |
| Payment gateway integration | **EXISTS** | `services/paymentService.ts`, `app/payment-razorpay.tsx` | Razorpay integration present |

---

## 4. Order Tracking

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Order confirmation | **EXISTS** | `app/order-confirmation.tsx`, `services/ordersApi.ts` | Confirmation screen with order details |
| Real-time tracking | **EXISTS** | `app/tracking.tsx`, `hooks/useOrderTracking.ts` | Live updates via socket connection |
| Estimated delivery time | **EXISTS** | `app/tracking.tsx`, `utils/orderProgress.ts` | ETA calculation and display |
| Order history | **EXISTS** | `app/order-history.tsx`, `components/order/OrderHistoryItem.tsx` | Full order history with tabs |
| Reorder from history | **EXISTS** | `services/reorderApi.ts`, `components/order/` | Reorder validation and execution |
| Cancel order | **EXISTS** | `services/orderApi.ts` (cancelOrder), `services/ordersApi.ts` | Cancel functionality with reason |
| Order details | **EXISTS** | `app/booking-detail.tsx`, `app/tracking.tsx` | Full order detail view |

---

## 5. Delivery Features

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Add delivery address | **EXISTS** | `app/account/addresses.tsx`, `components/account/AddAddressModal.tsx` | Full address management |
| Save multiple addresses | **EXISTS** | `app/account/addresses.tsx` | Multiple address types (Home, Office, Other) |
| Delivery time slots | **EXISTS** | `app/checkout.tsx` (DeliverySlotPicker), `components/checkout/` | Morning, Afternoon, Evening, Night slots |
| Delivery instructions | **EXISTS** | `services/menuApi.ts` (PreOrderRequest.instructions) | Instructions field available |
| Contact delivery partner | **PARTIAL** | `app/tracking.tsx` | Delivery person info shown but no direct contact |

---

## 6. Dine-in Features

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Scan QR code | **EXISTS** | `app/scan.tsx`, `app/qr-checkin.tsx` | Unified QR scanner with multiple intents |
| Table reservation | **EXISTS** | `app/store-visit.tsx`, `components/store/BookTableCard.tsx` | Date/time selection, slot booking |
| View table bill | **EXISTS** | `app/pay-in-store/`, `components/store/PayYourBillCard.tsx` | Pay at table functionality |
| Split bill | **MISSING** | - | No split bill functionality found |
| Pay at table | **EXISTS** | `app/pay-in-store/`, `app/scan.tsx` (intent routing) | QR scan routes to pay-in-store |

---

## 7. User Profile

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Login/Register | **EXISTS** | `app/sign-in.tsx`, `services/authService.ts` | Phone OTP authentication |
| Social login (Google, Apple) | **MISSING** | - | No Google/Apple sign-in found |
| Edit profile | **EXISTS** | `app/account/profile.tsx`, `app/account/` | Profile editing screens |
| Manage addresses | **EXISTS** | `app/account/addresses.tsx` | Full address CRUD operations |
| Payment methods | **EXISTS** | `app/account/payment-methods.tsx`, `app/account/` | Saved cards, UPI, wallets |
| Notification preferences | **EXISTS** | `app/notification-preferences.tsx`, `app/account/notifications.tsx` | Push, email, SMS, in-app settings |

---

## 8. Notifications

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Push notifications | **EXISTS** | `app/account/push-notifications.tsx`, `services/notificationService.ts` | Full push notification settings |
| Order updates | **EXISTS** | `app/account/notifications.tsx` (orderUpdates flag) | Dedicated order update notifications |
| Promotional notifications | **EXISTS** | `app/account/notifications.tsx` (promotions flag) | Marketing/promotional opt-in/out |
| Deep linking | **PARTIAL** | `app/scan.tsx` (QR routing) | QR-based deep linking works, URL deep linking unclear |

---

## Summary Statistics

| Category | Total Features | Implemented | Partial | Missing |
|----------|---------------|-------------|---------|---------|
| Restaurant Discovery | 7 | 7 | 0 | 0 |
| Menu & Ordering | 7 | 6 | 1 | 0 |
| Payment | 5 | 4 | 1 | 0 |
| Order Tracking | 7 | 7 | 0 | 0 |
| Delivery Features | 5 | 4 | 1 | 0 |
| Dine-in Features | 5 | 4 | 0 | 1 |
| User Profile | 6 | 5 | 0 | 1 |
| Notifications | 4 | 3 | 1 | 0 |
| **TOTAL** | **46** | **40** | **4** | **2** |

**Overall Coverage: 87% (40/46 features implemented, 4 partial, 2 missing)**

---

## Missing Features Detail

### 1. Split Bill (Dine-in Features)
- **Status:** MISSING
- **Required:** Implement bill splitting functionality for dine-in orders
- **Location to implement:** `app/pay-in-store/` or new `app/split-bill.tsx`

### 2. Social Login - Google/Apple (User Profile)
- **Status:** MISSING
- **Required:** Add Google Sign-In and Apple Sign-In support
- **Location to implement:** `app/sign-in.tsx`, `services/authService.ts`

---

## Partial Features Detail

### 1. Customize items (Menu & Ordering)
- **Status:** PARTIAL
- **Current:** Only special instructions text field available
- **Missing:** Add-on modifiers, size options, extra toppings selection
- **Location to enhance:** `services/menuApi.ts`, `app/product-page.tsx`

### 2. Cash on Delivery (Payment)
- **Status:** PARTIAL
- **Current:** Mentioned in code but not visible in payment UI
- **Missing:** Full COD option in payment selection screen
- **Location to enhance:** `app/payment-methods.tsx`, `services/paymentService.ts`

### 3. Contact delivery partner (Delivery)
- **Status:** PARTIAL
- **Current:** Delivery person info displayed but no click-to-call
- **Missing:** Direct contact button or in-app calling
- **Location to enhance:** `app/tracking.tsx`

### 4. Deep linking (Notifications)
- **Status:** PARTIAL
- **Current:** QR code deep linking works
- **Missing:** URL scheme deep linking for notifications
- **Location to implement:** `app.config.js`, `services/deepLinkService.ts`

---

## Key File Reference

| Category | Key Files |
|----------|-----------|
| **Store/Search** | `app/StoreListPage.tsx`, `app/MainStorePage.tsx`, `app/food.tsx`, `services/storesApi.ts` |
| **Menu** | `services/menuApi.ts`, `app/product-page.tsx`, `components/store/MenuTabContent.tsx` |
| **Cart/Checkout** | `app/cart.tsx`, `app/checkout.tsx`, `stores/cartStore.ts`, `services/cartApi.ts` |
| **Payment** | `app/payment.tsx`, `app/payment-methods.tsx`, `services/paymentService.ts` |
| **Orders** | `app/order-history.tsx`, `app/tracking.tsx`, `services/ordersApi.ts` |
| **Address** | `app/account/addresses.tsx`, `services/addressApi.ts` |
| **Dine-in** | `app/scan.tsx`, `app/store-visit.tsx`, `app/dinein-tracking.tsx` |
| **Auth** | `app/sign-in.tsx`, `services/authService.ts` |
| **Notifications** | `app/notification-preferences.tsx`, `services/notificationService.ts` |

---

## Recommendations

1. **High Priority:**
   - Implement Social Login (Google/Apple) for better user onboarding
   - Add Split Bill functionality for dine-in feature completeness

2. **Medium Priority:**
   - Enhance item customization with add-ons and modifiers
   - Implement contact delivery partner button with in-app calling
   - Add Cash on Delivery visible option in payment flow

3. **Low Priority:**
   - Add URL deep linking for push notifications
