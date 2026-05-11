# ReZ Ecosystem - Detailed Features Documentation
**Date:** May 4, 2026
**Version:** 1.0

---

# MOBILE APPS - DETAILED FEATURES

## Consumer App (rez-app-consumer)

### Authentication
- Phone number login with OTP verification
- Social login (Google, Apple)
- Biometric authentication (Face ID, Fingerprint)
- Session management with JWT refresh tokens
- Device fingerprinting

### QR Scanner
- Camera-based QR code scanning
- Deep link handling for:
  - `rezapp://` - Internal app links
  - `menu.rez.money/{slug}` - Restaurant menus
  - `now.rez.money/{slug}` - Merchant profiles
  - `adsqr.rezapp.com/c/{id}` - Campaign QR
  - `verify.rez.money/s/{serial}` - Product verification
- QR type detection (payment, menu, store, campaign, verify)
- Offline QR caching

### Wallet & Coins
- View coin balance (ReZ coins, branded coins)
- Transaction history with filters
- Coin earning rules display
- Coin redemption at checkout
- Coin expiration notifications
- BNPL (Buy Now Pay Later) credit access
- Credit score display (300-900 range)

### Orders
- Create new order with cart
- Real-time order tracking with map
- Order status push notifications
- Order history with reorder
- Bill splitting with friends
- Tip management
- Delivery/pickup toggle
- Schedule future orders
- Cancel order (with rules)
- Rate and review orders

### Store Discovery
- Nearby stores with map view
- Search with filters (cuisine, rating, delivery time)
- Category browsing
- Featured collections
- Trending stores
- Store details (hours, ratings, photos)
- Follow/save stores
- Store reviews and ratings

### Payments
- Saved payment methods
- UPI, card, wallet, netbanking
- COD (Cash on Delivery)
- BNPL (Buy Now Pay Later)
- Razorpay integration
- Payment history
- Refund status tracking

### Loyalty & Gamification
- Karma score (300-900) with tier badges
- Achievement progress tracking
- Daily streak display
- Leaderboard position
- Perk redemption catalog
- Challenge completion
- Badge collection

### Profile & Settings
- Edit profile (name, photo, phone)
- Manage addresses (home, work, other)
- Notification preferences
- Language selection
- Privacy settings
- Help & support
- App feedback

### Booking Services
- **Hotel**: Search, book, manage reservations
- **Travel**: Flight, train, bus, cab booking
- **Parking**: Find and reserve parking
- **Recharge**: Mobile, DTH, electricity
- **Investments**: Gold, mutual funds

---

## Merchant App (rez-app-merchant)

### Dashboard
- Today's revenue and orders
- Order volume trends
- Customer metrics
- Rating overview
- Peak hours heatmap
- Inventory alerts

### Order Management (KDS)
- Live order feed with audio alerts
- Accept/reject orders
- Order preparation timers
- Mark items ready
- Printer integration (receipt, kitchen)
- Split order tickets
- Priority order marking
- Order bumping and pinning

### Menu Management
- Add/edit/delete products
- Category management
- Variant options (size, toppings, etc.)
- Modifier groups
- Price and offer management
- Image upload
- Availability toggle (out of stock)
- Tax configuration (GST)
- SKU management

### Inventory
- Stock level tracking
- Low stock alerts
- Ingredient mapping
- Purchase order generation
- Stock history
- Waste tracking

### Customer Management (CRM)
- Customer list with filters
- Order history per customer
- Customer lifetime value
- Feedback and ratings
- Loyalty program setup
- Tagging and segmentation
- Push notification to customers

### Staff Management
- Add/remove staff
- Role assignment (admin, manager, chef, delivery)
- Attendance tracking
- Performance metrics
- Shift scheduling
- Salary tracking

### Analytics & Reports
- Sales reports (daily, weekly, monthly)
- Category-wise revenue
- Peak hour analysis
- Customer demographics
- Marketing ROI
- Profit & loss
- Tax reports (GST)

### Marketing Tools
- Create offers (percentage, flat, BOGO)
- Running campaigns
- Push notification campaigns
- Loyalty program setup
- Gift card creation
- Table booking management
- Appointment slots

### Financial Management
- Earnings summary
- Settlement reports
- Bank account management
- Invoice generation
- Transaction history
- Payout schedule
- Khata (ledger) for credit customers

### Integration Hub
- Swiggy/Zomato sync (order imports)
- Delivery partner setup (Dunzo, Shadowfax)
- POS system integration
- Printer configuration
- WhatsApp business integration

### Hotel OTA Features
- Room inventory management
- Room type configuration
- Rate plan setup
- Booking calendar
- Housekeeping status
- Guest check-in/out

---

## Creator System (Consumer App)

### Creator Profile
- Display name, bio, avatar, cover image
- Social links (Instagram, YouTube, Twitter, TikTok, Website)
- Creator tags (Fashion, Beauty, Tech, Food, Fitness, Travel, Lifestyle, Gaming, Music, Art, Photography, Home, Books, Sports)

### Creator Dashboard
- Analytics on profile views
- Follower count
- Content performance
- Revenue from picks

### Creator Pick System
- Submit product/service picks
- Earn commissions from picks
- Track pick performance

### Creator QR
- `creator.rez.money/{creatorId}`
- Shareable creator profile link
- Attribution tracking

---

## Do App (do-app)

### Core Features
- Voice input (expo-speech)
- Camera scanning
- Location-based discovery
- Deep linking (do:// scheme)

### AI Integration
- 10+ AI Agents
- 15+ Intent Types
- 82+ Event Types
- Support Copilot (95.6% accuracy)
- Merchant Copilot
- User Intelligence

### Screens
- Authentication (auth/)
- Booking (booking/)
- Complaints (complaints/)
- Refunds (refunds/)
- Onboarding (onboarding/)

---

## Admin App (rez-app-admin)

### User Management
- Search users by phone/email
- View user profile and history
- Suspend/activate accounts
- Reset password
- View transaction history

### Merchant Management
- Approve/reject merchant applications
- Merchant verification status
- Store onboarding progress
- Contract management
- Commission configuration

### System Monitoring
- Service health dashboard
- Error rate tracking
- API response times
- Database performance
- Queue depth monitoring

### Coin Economy
- View coin transactions
- Audit coin movements
- Adjust user balances
- Set coin earning rules
- Configure expiry rules

### Fraud Detection
- Flag suspicious transactions
- View fraud reports
- Block fraudulent users
- Review dispute cases

### Content Moderation
- Review user-generated content
- Approve/reject reviews
- Flag inappropriate content
- Manage reported items

---

# WEB APPS - DETAILED FEATURES

## AdBazaar (adBazaar/)

### Campaign Management
- Create campaign with goals (awareness, traffic, engagement)
- Set campaign budget and schedule
- Define target audience
- Upload ad creative (image/video)
- A/B testing for ad variants

### QR Generation
- Single QR code generation
- Bulk QR import (CSV)
- QR code customization (color, logo)
- QR tracking pixels
- Download QR in multiple formats

### Attribution Tracking
- Scan tracking (unique/total)
- Visit tracking
- Purchase tracking (revenue attribution)
- Attribution window (1-30 days)
- UTM parameter handling

### Rewards System
- Coin reward configuration per scan/visit/purchase
- Reward caps (daily, per user, per campaign)
- Reward expiry rules
- Manual reward distribution

### Analytics Dashboard
- Campaign performance metrics
- Real-time scan counter
- Geographic distribution
- Device breakdown
- Conversion funnel
- ROI calculation

### Integration
- Razorpay for reward payouts
- Twilio for SMS notifications
- Upstash Redis for caching
- Supabase for database

---

## Rez Now (rez-now/) - Room QR

### Property Setup
- Hotel/merchant profile creation
- Room/table list management
- Service category configuration
- Price list setup
- Staff assignment

### Guest Services
- Digital menu browsing
- Room service ordering
- Service request (housekeeping, minibar, etc.)
- Checkout requests
- Bill viewing and payment
- Guest messaging

### Attribution & Marketing
- Reclaim integration for ad attribution
- Campaign creation
- Landing page customization
- Social sharing tools

### AI Features
- Claude-powered chatbot for guest queries
- RAG (Retrieval Augmented Generation) for property info
- Menu recommendations

### Real-time Updates
- Socket.IO for order updates
- Kitchen display integration
- Staff notification push

---

## Hotel OTA (Hotel OTA/)

### Hotel Panel (Admin)
- Property management
- Room inventory (types, rates)
- Booking calendar view
- Channel manager (OTAs sync)
- Rate plan management
- Housekeeping management
- Staff scheduling
- Financial reports

### OTA Web (Guest Booking)
- Hotel search with filters
- Date selection
- Room selection
- Guest details form
- Payment processing
- Booking confirmation
- Itinerary viewing

### Corporate Panel
- Company profile setup
- Employee directory sync (HRIS)
- Travel policy configuration
- Booking approvals
- Expense reporting

### Mobile App (Guest/Staff)
- Hotel search and booking
- Check-in/out
- Digital room key
- Housekeeping request
- Minibar orders
- Checkout

### API Backend
- Prisma ORM with PostgreSQL
- Redis for caching/sessions
- BullMQ for background jobs
- Socket.IO for real-time
- Razorpay for payments

---

## Verify Service (verify-service/)

### Brand Onboarding
- Brand registration
- Product catalog upload
- Serial number generation
- Batch import
- QR code generation per product

### Consumer Verification
- QR scan landing page
- Serial number search
- Product authentication result
- Brand story display
- Warranty information

### Anti-Counterfeiting
- Serial validity check
- Scan count tracking
- Fraud flagging
- Suspicious pattern detection

### Analytics
- Scan geography
- Scan timestamps
- Product performance
- Region breakdown

---

# BACKEND SERVICES - DETAILED FEATURES

## Auth Service (rez-auth-service)

### Authentication Methods
- Phone/OTP (SMS)
- Email/password
- Social login (Google, Apple, Facebook)
- Magic link
- Biometric (TOTP)

### Token Management
- JWT access tokens (15min expiry)
- Refresh tokens (7 days)
- Token rotation
- Revocation on logout

### Security Features
- Device fingerprinting
- Rate limiting per IP/phone
- Brute force protection
- Account lockout
- Suspicious activity detection

### Session Management
- Concurrent session limits
- Session list view
- Remote logout
- Remember device

### API Endpoints
- `POST /auth/phone/send` - Send OTP
- `POST /auth/phone/verify` - Verify OTP
- `POST /auth/login` - Email/password login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/sessions` - List sessions
- `DELETE /auth/sessions/:id` - Kill session
- `POST /auth/2fa/setup` - Setup TOTP
- `POST /auth/2fa/verify` - Verify TOTP

---

## Wallet Service (rez-wallet-service)

### Coin Types
- **ReZ Coins**: Platform-wide, never expire
- **Branded Coins**: Merchant-specific, 6-month expiry
- **Promo Coins**: Campaign-based, variable expiry
- **Cashback Coins**: Order-based, 1-year expiry
- **Prive Coins**: Premium tier coins
- **Referral Coins**: Invitation rewards

### Transaction Types
- Earn (order, promotion, referral, cashback)
- Spend (order payment, redemption)
- Expire (automatic on expiry)
- Reverse (refund)

### Features
- Real-time balance updates
- Transaction history with filters
- Idempotency protection (prevents double-credit)
- Coin expiry notifications
- Minimum balance rules
- Maximum balance caps

### BNPL Features
- Credit limit calculation
- EMI support
- Credit score reporting
- Overdue notifications

### API Endpoints
- `GET /wallets/:userId` - Get wallet
- `GET /wallets/:userId/transactions` - Transaction history
- `POST /wallets/debit` - Spend coins
- `POST /wallets/credit` - Earn coins
- `POST /wallets/transfer` - P2P transfer
- `GET /wallets/:userId/balance` - Quick balance

---

## Payment Service (rez-payment-service)

### Payment Methods
- UPI (Google Pay, PhonePe, Paytm)
- Credit/Debit Cards (Visa, Mastercard, RuPay)
- Net Banking (40+ banks)
- Wallet (ReZ wallet, third-party)
- COD (Cash on Delivery)
- BNPL (Buy Now Pay Later)
- Razorpay (primary gateway)
- Stripe (secondary)

### Payment States
1. pending - Created, awaiting payment
2. awaiting_payment - User redirected to gateway
3. processing - Gateway processing
4. authorized - Funds authorized (pre-auth)
5. paid - Payment confirmed
6. partially_refunded - Partial refund done
7. refunded - Full refund done
8. failed - Payment failed
9. cancelled - User cancelled

### Features
- Pre-auth and capture
- Automatic retry on failure
- Webhook handling (Razorpay, Stripe)
- Refund management (full/partial)
- Settlement to merchant wallet
- Invoice generation

### Reconciliation
- Daily settlement reports
- Bank statement matching
- Chargeback handling
- Dispute resolution

### API Endpoints
- `POST /payments/create` - Create order
- `GET /payments/:id` - Get status
- `POST /payments/:id/refund` - Initiate refund
- `POST /webhooks/razorpay` - Razorpay webhook
- `GET /payments/:id/invoice` - Get invoice

---

## Order Service (rez-order-service)

### Order States (14)
1. placed - Order created
2. confirmed - Merchant accepted
3. preparing - Being prepared
4. ready - Ready for pickup/delivery
5. dispatched - Sent to delivery
6. out_for_delivery - On the way
7. delivered - Completed
8. cancelled - Cancelled
9. cancelling - Cancellation in progress
10. returned - Items returned
11. refunded - Money refunded
12. failed_delivery - Delivery failed
13. return_requested - Return initiated
14. return_rejected - Return denied

### Fulfillment Types
- Delivery (home, office)
- Pickup (dine-in, takeaway)
- Drive-thru
- Dine-in (table service)

### Features
- Cart management
- Address validation
- Delivery fee calculation
- Discount/coupon application
- Bill splitting
- Order scheduling
- Preparation time estimation
- OTP verification (pickup/delivery)

### API Endpoints
- `POST /orders` - Create order
- `GET /orders/:id` - Get order
- `PATCH /orders/:id/status` - Update status
- `POST /orders/:id/cancel` - Cancel order
- `POST /orders/:id/refund` - Request refund
- `GET /orders` - List orders (with filters)
- `POST /orders/:id/rate` - Rate order

---

## Merchant Service (rez-merchant-service)

### Onboarding
- Business registration
- Document upload (GST, PAN, FSSAI)
- Bank account verification
- Store creation
- Category selection

### Store Management
- Store profile (name, address, hours)
- Location and map pin
- Photos and description
- Operating hours
- Delivery radius
- Minimum order value
- Preparation time

### Menu/Catalog
- Category hierarchy (up to 3 levels)
- Product variants
- Add-ons and modifiers
- Tax groups
- Availability toggle

### KDS (Kitchen Display)
- Order cards
- Timer display
- Bump bar support
- Audio alerts
- Multi-station support

### API Endpoints
- `POST /merchants` - Register
- `GET /merchants/:id` - Get profile
- `PATCH /merchants/:id` - Update
- `GET /stores/:id` - Get store
- `POST /stores/:id/menu` - Add menu item
- `GET /stores/:id/orders` - Store orders

---

## Notification Events (rez-notification-events)

### Channels
- Push (FCM, APN)
- SMS (Twilio)
- Email (SendGrid)
- WhatsApp (Meta)
- In-app

### Templates
- Order updates
- Promotional offers
- Reminders
- Alerts
- OTPs

### Features
- Template versioning
- Personalization variables
- Scheduling (immediate, delayed, recurring)
- Delivery tracking
- Bounce handling
- Preference center

### Triggers
- Order events (placed, dispatched, delivered)
- Payment events (success, failure, refund)
- Wallet events (earn, spend, expire)
- Marketing campaigns
- Time-based reminders

---

## Intent Graph (rez-intent-graph)

### Signal Types
- **Search**: Query terms, filters
- **View**: Product views, store visits
- **Wishlist**: Add to favorites
- **Cart**: Items added, removed
- **Purchase**: Completed orders
- **QR Scan**: Different QR types
- **Review**: Ratings given
- **Share**: Content shared

### Intent Models
- Short-term intent (current session)
- Medium-term intent (7-30 days)
- Long-term intent (30+ days)
- Dormant intent (inactive users)

### Predictions
- Purchase probability
- Churn risk
- Engagement score
- Life-time value

### Nudges
- Push notification triggers
- Timing optimization
- Channel selection
- A/B tested content

### Cross-App Aggregation
- Consumer app signals
- Merchant app signals
- Web signals
- QR scan signals

---

## Targeting Engine (rez-targeting-engine)

### Segmentation
- Demographic (age, gender, location)
- Behavioral (purchase history, frequency)
- Psychographic (interests, preferences)
- Technographic (device, OS)
- Firmographic (business size, industry)

### Campaign Rules
- Budget allocation
- Frequency capping
- Dayparting
- Geographic targeting
- Device targeting

### A/B Testing
- Creative variants
- Audience split
- Bid optimization
- Statistical significance

### API Endpoints
- `POST /campaigns` - Create campaign
- `GET /campaigns/:id/audience` - Preview audience
- `POST /campaigns/:id/target` - Get targeting params
- `GET /segments` - List segments
- `POST /segments` - Create segment

---

## Action Engine (rez-action-engine)

### Action Types
- Push notification
- In-app message
- Email
- SMS
- WhatsApp
- Chat bot response

### Policy Rules
- Do not disturb hours
- Frequency limits
- Content filters
- Brand safety

### Human-in-Loop
- Approval queue for sensitive actions
- Anomaly flagging
- Manual override

### Webhook Events
- QR scan detected
- Intent signal received
- User action triggered

---

## Recommendation Engine (rez-recommendation-engine)

### Algorithms
- Collaborative filtering
- Content-based filtering
- Matrix factorization
- Neural collaborative filtering
- Contextual bandits

### Recommendation Types
- **Homepage feed**: Personalized mix
- **Product recommendations**: "You may also like"
- **Similar items**: Visual similarity
- **Trending**: Popular in area/category
- **Frequently bought together**: Bundle suggestions
- **Nearby deals**: Location-based

### Real-time Ranking
- Freshness score
- Relevance score
- Diversity boost
- Price sensitivity

### API Endpoints
- `GET /recommendations/feed` - Personalized feed
- `GET /recommendations/products/:id` - Similar items
- `GET /recommendations/nearby` - Location deals
- `POST /recommendations/trending` - Trending items

---

## Gamification Service (rez-gamification-service)

### Achievements
- Order milestones (1st order, 10th order)
- Spending goals
- Review milestones
- Check-in streaks

### Streaks
- Daily login streak
- Order streak
- Review streak

### Leaderboards
- Global rankings
- Category rankings
- Friend comparisons

### Badges
- Bronze, Silver, Gold tiers
- Exclusive badges for events
- Special edition badges

### API Endpoints
- `GET /gamification/profile/:userId`
- `GET /gamification/achievements`
- `GET /gamification/leaderboard/:type`
- `POST /gamification/streaks/checkin`

---

## Karma Service (rez-karma-service)

### Karma Score (300-900)
- **300-400**: Starter
- **401-500**: Contributor
- **501-600**: Influencer
- **601-700**: Leader
- **701-800**: Expert
- **801-900**: Legend

### Scoring Factors
- Order frequency
- Payment reliability
- Review quality
- Engagement level
- Community contribution

### Benefits by Tier
- Discounts on services
- Priority support
- Early access to features
- Exclusive events
- Karma marketplace access

---

# SHARED PACKAGES - DETAILED EXPORTS

## @rez/shared-types

### Entities
```typescript
IUser, IUserProfile, IUserAuth, IUserWallet
IOrder, IOrderItem, IOrderTotals, IOrderAddress, IOrderDelivery
IProduct, IProductVariant, IProductModifier, IProductImage, IProductPricing
IPayment, IPaymentGatewayResponse, IPaymentUserDetails
IWallet, ICoin, IBrandedCoin, IWalletBalance
IMerchant, IMerchantProfile, IMerchantLocation
IStore, IStoreLocation, IStoreContact, IStoreOperationalInfo
ICampaign, IBaseCampaign, IMerchantCampaign
INotification, INotificationEvent, INotificationRecipient
IOffer, IOfferConditions
IFinanceTransaction
IBadge, IReward
IKarmaProfile, IKarmaEvent, IKarmaStats
IAnalyticsEvent, IAnalyticsEventContext
```

### Enums
```typescript
UserRole: USER | MERCHANT | ADMIN | SUPPORT
OrderStatus: placed | confirmed | preparing | ready | dispatched | delivered | cancelled | etc. (14 values)
PaymentStatus: pending | processing | completed | failed | refunded | etc.
PaymentMethod: upi | card | wallet | netbanking | cod | bnpl | razorpay | stripe
CoinType: PROMO | BRANDED | PRIVE | CASHBACK | REFERRAL | REZ
CampaignStatus: draft | active | paused | completed
NotificationType: order | payment | marketing | system
```

### Zod Schemas
```typescript
CreateOrderSchema, UpdateOrderStatusSchema
CreatePaymentSchema, UpdatePaymentStatusSchema
WalletDebitSchema, WalletCreditSchema, WalletBalanceSchema
CreateProductSchema, UpdateProductSchema
CoinSchema, TransactionSchema
```

### Branded IDs
```typescript
UserId, OrderId, PaymentId, WalletId, MerchantId, StoreId, ProductId
```

### FSM Helpers
```typescript
ORDER_STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]>
canOrderBeCancelled(order: IOrder): boolean
isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean
```

---

## @rez/qr-sdk

### Modules
```typescript
RoomModule: checkIn, checkOut, requestService, getBill, payBill
MenuModule: getMenu, addToCart, placeOrder, getOrderStatus
StoreModule: getStore, getOffers, getReviews, followStore
CampaignModule: scan, trackAttribution, claimReward
AIModule: chat, getRecommendations
AuthModule: login, logout, getToken
WalletModule: getBalance, pay, addCoins
```

---

## @rez/merchant-sdk

### Clients
```typescript
MerchantSDK: constructor(config)
StoreClient: getStore(), updateStore()
MenuClient: getMenu(), addItem(), updateItem()
HotelClient: getRooms(), bookRoom()
CampaignClient: create(), getAnalytics()
AnalyticsClient: getSales(), getCustomers()
```

---

# COMMUNICATION FLOWS

## Order Creation Flow
```
1. Consumer App → Order Service: POST /orders
2. Order Service → Payment Service: Create payment intent
3. Payment Service → Razorpay: Create order
4. Consumer → Payment Service: Complete payment (Razorpay SDK)
5. Razorpay → Payment Service: Webhook (payment.success)
6. Payment Service → Wallet Service: Debit coins if applicable
7. Payment Service → Order Service: Update payment status
8. Order Service → Notification Service: Send "Order Placed" push
9. Order Service → Merchant Service: New order notification
10. Order Service → Socket Service: Emit order:created
11. Merchant App ← Socket Service: Real-time order alert
```

## QR Scan Flow
```
1. Consumer scans QR code
2. App detects QR type (room/menu/store/campaign)
3. App calls appropriate API
4. Intent Graph records signal
5. Intent Graph updates user profile
6. If reward applicable → Wallet Service credits coins
7. If campaign → Ad tracking recorded
8. Push notification sent if applicable
9. Analytics event emitted
```

---

# DATABASE SCHEMAS

## PostgreSQL Tables (Resturistan)

### Core Tables
- users (id, phone, email, name, role, created_at)
- restaurants (id, owner_id, name, cuisine, rating, status)
- restaurant_addresses (restaurant_id, address, city, pincode, lat, lng)
- employees (restaurant_id, user_id, role, status)
- vendors (name, category, rating)
- jobs (restaurant_id, title, description, salary, status)

### Social Tables
- discussions (user_id, content, likes_count)
- discussion_comments (discussion_id, user_id, content)
- direct_messages (sender_id, receiver_id, content)

### Business Tables
- payments (order_id, amount, method, status, gateway_ref)
- notifications (user_id, type, title, body, read)
- analytics_events (event_type, user_id, properties, timestamp)

---

## MongoDB Collections

### users
```javascript
{
  _id, phone, email, name,
  role, status, karmaScore,
  addresses: [{ type, address, city, pincode, coordinates }],
  preferences: { notifications, language },
  auth: { otp, refreshTokens, devices },
  createdAt, updatedAt
}
```

### orders
```javascript
{
  _id, orderNumber, userId, storeId,
  items: [{ productId, name, quantity, price, variants }],
  totals: { subtotal, tax, delivery, discount, total },
  payment: { method, status, transactionId, gateway },
  delivery: { address, status, estimatedTime, otp },
  status, couponCode,
  createdAt, updatedAt
}
```

### wallets
```javascript
{
  _id, userId,
  coins: [{ type, amount, earnedDate, expiryDate, color }],
  brandedCoins: [{ merchantId, amount, earnedDate, expiryDate }],
  transactions: [{ type, amount, balance, description, timestamp }],
  createdAt, updatedAt
}
```

---

*Document generated: May 4, 2026*
