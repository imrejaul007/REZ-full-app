# Consumer Features

## Overview

ReZ provides a comprehensive consumer experience across mobile and web platforms. This documentation covers all features available to end users of the ReZ application.

---

## Account Features

### Registration & Login

#### Sign Up Options

| Method | Description | Verification |
|--------|-------------|--------------|
| Phone Number | OTP verification | SMS verification |
| Email | Password-based | Email verification |
| Google | OAuth 2.0 | Google account |
| Facebook | OAuth 2.0 | Facebook account |
| Apple ID | Sign in with Apple | Apple account |

#### Sign Up Flow

```
┌─────────────────────────────────────────────────────────┐
│  Create Your Account                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📱 Phone Number                                  │   │
│  │  [+91] [_____________]                            │   │
│  │  We'll send you an OTP                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📧 Email                                        │   │
│  │  [________________________]                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [🔵] Continue with Google                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [🔵] Continue with Facebook                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [⚫] Sign in with Apple                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ────────────────────────────────────────────────────  │
│  By continuing, you agree to our                      │
│  Terms of Service and Privacy Policy                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Profile Management

#### Profile Features

- **Personal Information**: Name, phone, email, date of birth
- **Profile Picture**: Upload custom avatar
- **Address Book**: Multiple saved addresses
- **Payment Methods**: Cards, UPI, wallets
- **Communication Preferences**: Notifications, marketing opt-in
- **Security Settings**: Password, 2FA, session management

#### Profile Screen

```
┌─────────────────────────────────────────────────────────┐
│  ≡   My Profile                            🔔  👤       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👤 John Doe                                     │   │
│  │  john.doe@email.com                              │   │
│  │  +91 98765 43210                                │   │
│  │  Member since: January 2024                     │   │
│  │                               [Edit Profile ▶]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  MY REWARDS                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │  💎 Gold      │ │  3,247 pts    │ │  2,450 KP     │ │
│  │  Member       │ │  ~Rs. 324     │ │  Karma Points │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ │
│                                                         │
│  MY ORDERS              [View All ▶]                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🛒 Active Orders: 1                            │   │
│  │  📜 Order History                               │   │
│  │  ↩️  Returns & Refunds                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  MY ADDRESSES            [Manage ▶]                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏠 Home - 123 Main Street, Mumbai             │   │
│  │  🏢 Office - 456 Business Park, Mumbai          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PAYMENTS                   [Manage ▶]                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💳 HDFC Credit Card ****4567                   │   │
│  │  📱 Google Pay                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SETTINGS                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔔 Notifications                                │   │
│  │  🔐 Security & Privacy                          │   │
│  │  🌐 Language & Region                           │   │
│  │  ❓ Help & Support                              │   │
│  │  📜 Terms & Policies                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Log Out]                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Security Features

#### Two-Factor Authentication (2FA)

| Method | Description | Setup Time |
|--------|-------------|------------|
| SMS OTP | Code sent to registered phone | 1 minute |
| Authenticator App | TOTP codes from Google Auth/Microsoft | 2 minutes |
| WhatsApp OTP | Code via WhatsApp | 1 minute |

#### Account Security

- Password change (with current password verification)
- Biometric login (fingerprint/Face ID)
- Session management (view and revoke active sessions)
- Login history with location/device info
- Account deletion with data export

---

## Shopping Features

### Product Discovery

#### Search

| Feature | Description |
|---------|-------------|
| Text Search | Full-text search with autocomplete |
| Voice Search | Speech-to-text product search |
| Image Search | Search by uploading/sharing product image |
| Barcode Scanner | Scan product barcode for quick lookup |
| Recent Searches | Quick access to previous searches |
| Search Filters | Category, price, brand, rating, availability |

#### Search Interface

```
┌─────────────────────────────────────────────────────────┐
│  🔍  Search products, brands, stores...                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RECENT SEARCHES                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👕 Men T-Shirts                   [X]           │   │
│  │  ☕ Coffee Beans                     [X]           │   │
│  │  🎧 Wireless Headphones             [X]           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  TRENDING NOW                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Summer Dresses  •  Running Shoes  •  Power Bank │   │
│  │  Face Cream      •  Sunglasses    •  Smart Watch │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  CATEGORIES                                            │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│  │  👔  │ │  👗  │ │  📱  │ │  🏠  │              │
│  │ Men  │ │Women │ │Elec- │ │ Home │              │
│  │      │ │      │ │tronics│ │      │              │
│  └───────┘ └───────┘ └───────┘ └───────┘              │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│  │  💄  │ │  👟  │ │  📚  │ │  🎮  │              │
│  │Beauty│ │Sports│ │ Books │ │Games │              │
│  └───────┘ └───────┘ └───────┘ └───────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Category Navigation

- Hierarchical category structure
- Breadcrumb navigation
- Subcategory quick links
- Filter by attributes (color, size, brand)
- Sort by (relevance, price, rating, newest)

### Product Details

#### Product Page Elements

| Section | Content |
|---------|---------|
| Images | Multiple images, zoom, gallery view |
| Title | Product name, brand, key features |
| Price | Current price, original price, discount % |
| Rating | Star rating, review count |
| Variants | Color, size, style options |
| Description | Detailed product description |
| Specifications | Technical/physical specifications |
| Reviews | Customer reviews and ratings |
| Questions | Q&A from customers |
| Recommendations | "Similar items" suggestions |

#### Product Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  <  Product Details                            📤 Share│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         [Product Image Gallery]                  │   │
│  │                                                   │   │
│  │   [○] [○] [○] [●]                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Premium Cotton Crew Neck T-Shirt                      │
│  by Urban Outfitters                                   │
│                                                         │
│  ⭐⭐⭐⭐⭐ 4.2 (1,247 reviews)                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Rs. 799          Was Rs. 1,299                 │   │
│  │  SAVE 38%                                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SIZE                                                   │
│  [XS] [S] [●M] [L] [XL]                               │
│                                                         │
│  COLOR                                                  │
│  [●Black] [○White] [○Navy] [○Gray]                    │
│                                                         │
│  QUANTITY                                               │
│  [-] [1] [+]                                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ✓ In Stock                                     │   │
│  │  ✓ Free Delivery by May 12                     │   │
│  │  ✓ 7 day easy returns                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [🛒 Add to Cart]                               │   │
│  │  [⚡ Buy Now]                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [❤️ Add to Wishlist]  [📋 Compare]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  DESCRIPTION                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Premium 100% cotton t-shirt with a relaxed fit.│   │
│  │ Perfect for everyday wear. Machine washable.  │   │
│  │ [Read More ▼]                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  CUSTOMER REVIEWS                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⭐⭐⭐⭐⭐ by Rahul S. - "Perfect fit!"           │   │
│  │ ⭐⭐⭐⭐⭐ by Priya M. - "Great quality"          │   │
│  │ ⭐⭐⭐⭐ by Amit K. - "Nice but slightly tight"  │   │
│  │                                [View All 1,247]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Shopping Cart

#### Cart Features

| Feature | Description |
|---------|-------------|
| Add Items | Add from product page, wishlist, recommendations |
| Edit Quantity | Increase/decrease quantity |
| Remove Items | Swipe to delete or tap remove |
| Save for Later | Move items to wishlist |
| Apply Coupons | Enter promo codes |
| Price Breakdown | Item cost, delivery, taxes, total |
| Express Checkout | One-tap checkout for saved addresses |

#### Cart Screen

```
┌─────────────────────────────────────────────────────────┐
│  ≡   My Cart                              [2 items]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  DELIVER TO: Mumbai 400001           [Change ▶]        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [IMG] Premium Cotton T-Shirt - M - Black      │   │
│  │        Seller: Urban Outfitters                  │   │
│  │        Rs. 799              [-] 1 [+]           │   │
│  │        Delivery by May 12                       │   │
│  │                              [Remove] [Wishlist] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [IMG] Slim Fit Jeans - 32 - Blue               │   │
│  │        Seller: Denim Co                          │   │
│  │        Rs. 1,499             [-] 1 [+]          │   │
│  │        Delivery by May 14                        │   │
│  │                              [Remove] [Wishlist] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💰 Apply Coupon                                 │   │
│  │  [SUMMER20                    ] [Apply]          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PRICE DETAILS                                  │   │
│  │  ────────────────────────────────────────────   │   │
│  │  Bag Total (2 items)          Rs. 2,298        │   │
│  │  Delivery                           FREE       │   │
│  │  🎉 SUMMER20 Discount           - Rs. 460     │   │
│  │  ────────────────────────────────────────────   │   │
│  │  Total Amount                  Rs. 1,838       │   │
│  │                                          💰     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💰 Cash on Delivery available                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [🛒 Continue Shopping]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [✓ SECURE CHECKOUT]                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Wishlist

#### Wishlist Features

- Add products from any page
- Sync across devices
- Price drop alerts
- Stock availability alerts
- Share wishlist with friends/family
- Move items to cart

---

## Order Management

### Placing Orders

#### Checkout Flow

1. **Cart Review**: Verify items, quantities, prices
2. **Address Selection**: Choose or add delivery address
3. **Delivery Options**: Standard/Express delivery
4. **Payment Method**: Choose payment option
5. **Order Review**: Final review before confirmation
6. **Order Confirmation**: Order placed successfully

#### Payment Methods

| Method | Processing Time | Availability |
|--------|-----------------|--------------|
| Credit Card | Instant | All users |
| Debit Card | Instant | All users |
| UPI (GPay, PhonePe, Paytm) | Instant | All users |
| Net Banking | Instant | All users |
| Wallets (Paytm, Amazon Pay) | Instant | All users |
| EMI | Instant | Selected cards |
| Cash on Delivery | N/A | Orders < Rs. 50,000 |
| ReZ Credits | Instant | Users with balance |

### Order Tracking

#### Tracking Features

- Real-time order status updates
- Live delivery tracking map
- Estimated delivery time
- Delivery partner contact
- Push notifications at each stage

#### Order Status Stages

| Status | Description | User Action |
|--------|-------------|-------------|
| Order Confirmed | Payment successful, order placed | View details |
| Processing | Order being prepared | Track packing |
| Shipped | Order dispatched | Track shipment |
| Out for Delivery | Delivery partner en route | Track live |
| Delivered | Order delivered | Rate & review |
| Cancelled | Order cancelled | View reason |
| Returned | Return initiated/processed | Track return |

#### Tracking Screen

```
┌─────────────────────────────────────────────────────────┐
│  <  Order #RZ123456789                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ORDER STATUS                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🚚  Out for Delivery                           │   │
│  │                                                   │   │
│  │  Arriving by 2:00 PM - 4:00 PM                  │   │
│  │                                                   │   │
│  │  [        LIVE MAP PREVIEW           ]           │   │
│  │  📍 Warehouse ────────────── 📍 Your Location   │   │
│  │            ▲                                     │   │
│  │          You are here                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  DELIVERY PARTNER                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  👤 Rajesh Kumar                                │   │
│  │  🚚 DL 01 AB 1234                               │   │
│  │  📞 Call Driver                    [Chat ▶]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ORDER DETAILS                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Premium Cotton T-Shirt - M - Black             │   │
│  │  Qty: 1    Rs. 799                             │   │
│  │  [IMG]                                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  DELIVERY ADDRESS                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🏠 John Doe                                    │   │
│  │  123 Main Street, Apartment 4B                  │   │
│  │  Near Central Park, Andheri West                │   │
│  │  Mumbai, Maharashtra 400053                     │   │
│  │  +91 98765 43210                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  PAYMENT                                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  💳 HDFC Credit Card ****4567                   │   │
│  │  Billed: Rs. 799                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Need Help?] [Cancel Order]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Order History

#### Order History Features

- View all past orders
- Filter by status, date, store
- Reorder previous orders
- Download invoices
- Track returns/refunds
- Write and view reviews

---

## Delivery Features

### Delivery Options

| Option | Description | Timing | Cost |
|--------|-------------|--------|------|
| Standard | Regular delivery | 3-5 business days | Rs. 49/Free above Rs. 299 |
| Express | Priority handling | 1-2 business days | Rs. 79 |
| Same Day | Order today, receive today | Within 6 hours | Rs. 149 |
| Next Day | Order today, receive tomorrow | Next business day | Rs. 99 |
| Scheduled | Choose specific date/time | User-selected | Rs. 59+ |

### Delivery Preferences

- **Delivery Instructions**: Gate code, building name, landmark
- **Safe Drop**: Leave at door, with security, with neighbor
- **Contact Preference**: Call before delivery, don't call
- **Time Slot**: Morning (9AM-12PM), Afternoon (12PM-5PM), Evening (5PM-9PM)

### Green Delivery Options

| Option | Karma Points Earned | Description |
|--------|---------------------|-------------|
| Eco Packaging | 10 KP | Recyclable packaging |
| Zero Contact | 5 KP | No physical contact |
| Consolidated Delivery | 15 KP | Combined with other orders |
| Reduced Packaging | 10 KP | Minimal packaging |

---

## Returns & Refunds

### Return Policy

| Category | Return Window | Condition |
|----------|---------------|-----------|
| Clothing & Apparel | 7 days | Tags attached, unworn |
| Electronics | 7 days | Original packaging, working |
| Home & Furniture | 7 days | Unassembled, original condition |
| Food & Perishables | Non-returnable | N/A |
| Customized Items | Non-returnable | N/A |

### Return Process

1. **Request Return**: Select order > Request return
2. **Choose Reason**: Select reason from list
3. **Schedule Pickup**: Choose date/time for pickup
4. **Prepare Package**: Pack item securely
5. **Handover**: Give to delivery partner
6. **Refund Processing**: 5-7 business days

### Refund Methods

| Method | Processing Time | Transfer Time |
|--------|-----------------|---------------|
| Original Payment | 5-7 business days | Same as payment method |
| ReZ Credits | Instant | N/A |
| Bank Account | 5-7 business days | 1-2 days after processing |
| Gift Card | Instant | N/A |

---

## Reviews & Ratings

### Review Features

| Feature | Description |
|---------|-------------|
| Star Rating | 1-5 star rating |
| Text Review | Written review (min 20 characters) |
| Photo Reviews | Upload product photos |
| Video Reviews | Upload video review (30 sec max) |
| Pros & Cons | Structured feedback |
| Verified Purchase | Badge for verified buyers |
| Helpful Votes | Mark reviews as helpful |

### Review Display

```
┌─────────────────────────────────────────────────────────┐
│  CUSTOMER REVIEWS                                       │
│  ⭐⭐⭐⭐⭐ 4.2 out of 5                               │
│  Based on 1,247 reviews                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RATING BREAKDOWN                                       │
│  ⭐⭐⭐⭐⭐ (5)  ████████████████░░░ 68%              │
│  ⭐⭐⭐⭐ (4)  ██████░░░░░░░░░░░░░░ 18%              │
│  ⭐⭐⭐ (3)   ███░░░░░░░░░░░░░░░░  8%               │
│  ⭐⭐ (2)    █░░░░░░░░░░░░░░░░░░  4%               │
│  ⭐ (1)     █░░░░░░░░░░░░░░░░░░  2%               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⭐⭐⭐⭐⭐  by Priya M. · 2 days ago            │   │
│  │  ✓ Verified Purchase                            │   │
│  │                                                   │   │
│  │  Perfect t-shirt! The fabric is so soft and    │   │
│  │  the fit is exactly as shown. Love the color   │   │
│  │  too. Will definitely order more colors!       │   │
│  │                                                   │   │
│  │  [📷] [📷] [📷]                                │   │
│  │                                                   │   │
│  │  👍 Helpful (47)   💬 Reply (2)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⭐⭐⭐⭐ by Amit K. · 1 week ago               │   │
│  │  ✓ Verified Purchase                            │   │
│  │                                                   │   │
│  │  Nice quality but runs slightly small.          │   │
│  │  Ordered M and should have gone for L.         │   │
│  │  Still happy with the purchase overall.         │   │
│  │                                                   │   │
│  │  👍 Helpful (23)   💬 Reply (1)                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Write a Review]                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Help & Support

### Support Channels

| Channel | Availability | Response Time |
|---------|--------------|---------------|
| In-app Chat | 24/7 | < 1 minute (bot), < 30 min (agent) |
| Phone Support | 9 AM - 9 PM IST | Immediate |
| Email | 24/7 | Within 24 hours |
| Help Center | 24/7 | Self-service |
| Community Forum | 24/7 | Variable |

### Common Issues

| Issue | Self-Service Options |
|-------|----------------------|
| Order not delivered | Track order, check address, contact support |
| Payment failed | Retry with different method, check bank |
| Wrong item received | Request return, chat with support |
| Item damaged | Upload photos, request return/refund |
| Cancel order | Cancel button (if not shipped), chat support |
| Refund not received | Check refund status, bank processing time |

### Help Center Topics

- Getting Started (Account, First Order)
- Orders (Track, Cancel, Modify)
- Payments (Methods, Issues, Refunds)
- Delivery (Options, Tracking, Delays)
- Returns (Process, Refunds, Exceptions)
- Account (Profile, Security, Preferences)
- Rewards (Loyalty, Karma, Coupons)
- Technical (App issues, Browser support)

---

## App Features

### Mobile App Screens

#### Home Screen

```
┌─────────────────────────────────────────────────────────┐
│  ≡  ReZ                        🔔  👤  🛒  [2]          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍  Search products, brands, stores...                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │  [  BANNER CAROUSEL - PROMOTIONS  ]              │   │
│  │                                                   │   │
│  │  ● ○ ○ ○                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SHOP BY CATEGORY                                      │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐              │
│  │  👔  │ │  👗  │ │  📱  │ │  🏠  │              │
│  │ Fashion│ │Women │ │Elec- │ │ Home │              │
│  └───────┘ └───────┘ │tronics│ └───────┘              │
│  ┌───────┐ ┌───────┐ │      │ ┌───────┐              │
│  │  💄  │ │  👟  │ └───────┘ │  ☕  │              │
│  │Beauty│ │Sports│ ┌───────┐ │Food  │              │
│  └───────┘ └───────┘ │  📚  │ └───────┘              │
│                      │Books │                          │
│                      └───────┘                          │
│                                                         │
│  DEALS OF THE DAY                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⚡ FLASH SALE - Ends in 4:32:15                │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │   │
│  │  │ Rs. │ │ Rs. │ │ Rs. │ │ Rs. │              │   │
│  │  │ 299 │ │ 499 │ │ 799 │ │1,299│              │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  RECOMMENDED FOR YOU                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │     │ │     │ │     │ │     │ │     │              │
│  │[IMG]│ │[IMG]│ │[IMG]│ │[IMG]│ │[IMG]│              │
│  │     │ │     │ │     │ │     │ │     │              │
│  │ Rs. │ │ Rs. │ │ Rs. │ │ Rs. │ │ Rs. │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
│  🏠   🔍    🛒    ❤️    👤                           │
│  Home  Search Cart  Wishlist Profile                   │
└─────────────────────────────────────────────────────────┘
```

### Bottom Navigation

| Tab | Icon | Features |
|-----|------|----------|
| Home | 🏠 | Featured products, categories, deals |
| Search | 🔍 | Search, voice, image search |
| Cart | 🛒 | Cart, checkout |
| Wishlist | ❤️ | Saved items, price alerts |
| Profile | 👤 | Account, orders, settings |

### App Notifications

| Notification | Trigger | Action |
|--------------|---------|--------|
| Order Update | Status change | View order |
| Delivery Arriving | 30 min before | Track live |
| Price Drop | Wishlist item | View deal |
| Back in Stock | Wishlist item | Buy now |
| Review Reminder | After delivery | Write review |
| Offers | Campaign | View offer |
| Re-engagement | 7 days inactive | Open app |

### App Settings

| Setting | Options | Description |
|---------|---------|-------------|
| Language | English, Hindi, Regional | App language |
| Location | Auto/Manual | For localized results |
| Notifications | All/Important/None | Push notification level |
| Dark Mode | On/Off/System | App appearance |
| Biometric Login | On/Off | Fingerprint/Face ID |
| Data Saver | On/Off | Reduce data usage |
| Clear Cache | Manual | Free up storage |

---

## Accessibility Features

### Accessibility Options

| Feature | Description |
|---------|-------------|
| Screen Reader | Full TalkBack/VoiceOver support |
| Text Size | Small/Medium/Large/Extra Large |
| High Contrast | Enhanced color contrast mode |
| Reduce Motion | Minimize animations |
| Audio Descriptions | Audio for visual content |
| Keyboard Navigation | Full keyboard support |
| Voice Commands | Navigate by voice |

### Accessibility Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Next element |
| Shift+Tab | Previous element |
| Enter | Select/Activate |
| Escape | Close modal/go back |
| Arrow keys | Navigate within sections |

---

## Troubleshooting

### App Issues

**App not loading**
1. Check internet connection
2. Force close and reopen app
3. Clear app cache (Settings > Apps > ReZ > Clear Cache)
4. Update to latest version from app store
5. Uninstall and reinstall

**Payment failing**
1. Verify card/bank details are correct
2. Check sufficient balance/limit
3. Try different payment method
4. Contact bank for card authorization
5. Use ReZ Credits if available

**Can't track order**
1. Refresh order page
2. Check order status update notification
3. Contact support with order ID
4. Verify delivery address is correct

### Web Issues

**Site not loading**
1. Clear browser cache and cookies
2. Try different browser (Chrome recommended)
3. Disable browser extensions
4. Check firewall/proxy settings
5. Try incognito/private mode

**Cart not updating**
1. Refresh page
2. Clear browser cache
3. Ensure JavaScript is enabled
4. Try different browser
5. Contact support

---

## Data & Privacy

### Data We Collect

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Account Info | Service delivery | Until account deletion |
| Order History | Service delivery, returns | 3 years |
| Browsing History | Personalization | 90 days |
| Location | Delivery, local offers | Until manually deleted |
| Payment Info | Transaction processing | Per payment regulations |
| Device Info | Security, analytics | 1 year |

### Privacy Controls

- Download your data (GDPR/CCPA compliance)
- Delete account and data
- Opt out of marketing
- Manage advertising preferences
- Control location sharing
- Manage cookie preferences

### Security Measures

- End-to-end encryption for payments
- Two-factor authentication
- Biometric authentication
- Session timeout
- Secure password requirements
- Regular security audits

---

## Support Contact

| Channel | Contact |
|---------|---------|
| In-app Chat | Available 24/7 |
| Phone | 1800-123-4567 (toll-free) |
| Email | support@rezapp.com |
| Twitter | @ReZApp |
| Help Center | help.rezapp.com |

---

## Version History

| Version | Release Date | Key Updates |
|---------|--------------|-------------|
| 5.0 | May 2024 | New UI, faster checkout |
| 4.5 | March 2024 | Karma system launch |
| 4.0 | January 2024 | Loyalty 2.0, new rewards |
| 3.5 | November 2023 | Dark mode, accessibility |
| 3.0 | September 2023 | Redesigned home screen |
| 2.5 | July 2023 | Improved search |
| 2.0 | May 2023 | Order tracking 2.0 |
