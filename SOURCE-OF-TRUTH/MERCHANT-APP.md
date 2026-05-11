# REZ Merchant App — Complete Feature Reference

**Last updated:** 2026-04-20
**Repo:** `imrejaul007/rez-app-marchant`
**Deploy:** EAS (iOS `money.rez.merchant`, Android `money.rez.merchant`) + Vercel web
**API:** `https://rez-api-gateway.onrender.com/api`
**Socket:** `https://rez-backend-8dfu.onrender.com`
**Tech Stack:** Expo SDK 53, React Native 0.79, TypeScript, Expo Router, TanStack Query, Victory Native, Socket.io, Razorpay, Sentry
**Deep Links:** `rezmerchant://`, `merchant.rez.money`

---

## Architecture

The app uses **vertical-based feature routing** (`utils/verticalFeatures.ts`) that maps 5 business types to their relevant dashboard features:
- **Restaurant** — POS, KDS, dine-in, floor plan, kitchen display
- **Salon** — Appointments, treatment rooms, class schedule, consultation forms, patch test
- **Hotel** — Hotel OTA dashboard, PMS connection, channel management
- **Grocery** — Inventory, purchase orders, suppliers
- **General** — Generic catalog, orders, analytics

---

## A. Authentication & Account

| Feature | File | Description |
|---------|------|-------------|
| Login (Email + Password) | `app/(auth)/login.tsx` | JWT auth with secure token storage (expo-secure-store). Show/hide password. |
| Phone + OTP Registration | `app/(auth)/register.tsx` | 3-step: phone → OTP verify → business name + owner name + email + password (10+ chars, complexity required) |
| Forgot Password | `app/(auth)/forgot-password.tsx` | Email reset link request with validation |
| Biometric Auth | `hooks/useBiometricAuth.ts` | Face ID / fingerprint gate via `expo-local-authentication` |
| Session Persistence | `stores/authStore.ts` | JWT survives app restarts |
| Deep Link Handling | `app/_layout.tsx` | `rezmerchant://` + `merchant.rez.money` universal links with allowlisted paths |
| Role-Based Access | `types/auth.ts` | owner / admin / manager / cashier / staff with fine-grained permissions |
| Suspension Detection | `services/socket.ts` | Socket listener on `merchant_suspended` and `merchant-status-changed` forces logout |

---

## B. Merchant Onboarding

| Feature | File | Description |
|---------|------|-------------|
| Onboarding Router | `app/onboarding/_layout.tsx` | Redirects by status: pending / in_progress / rejected / approved. Rejection banner with resubmit + support |
| Welcome Screen | `app/onboarding/welcome.tsx` | Branded intro with feature highlights |
| Step 1: Business Info | `app/onboarding/business-info.tsx` | Legal business name, type, PAN, GST |
| Step 2: Store Details | `app/onboarding/store-details.tsx` | Store name, type (online/offline/both), address, city, state, pincode (6-digit India), country, phone, website, description, tags |
| Step 3: Bank Details | `app/onboarding/bank-details.tsx` | Account number, IFSC, holder name, UPI ID |
| Step 4: Documents Upload | `app/onboarding/documents.tsx` | Business proof, address proof, ID proof via `expo-document-picker` |
| Step 5: Review & Submit | `app/onboarding/review.tsx` | Summary before final submission |
| ReZ Now Setup Wizard | `app/onboarding/rez-now-setup.tsx` | Post-approval: slug, branding, social links |
| Pending Approval Screen | `app/onboarding/pending.tsx` | Shown during review |
| Progress Checklist | `components/OnboardingChecklist.tsx` | Visual step tracker with completion status |

---

## C. Dashboard

| Feature | File | Description |
|---------|------|-------------|
| Metrics Overview | `app/(dashboard)/index.tsx` | Revenue, orders, cashback cards with quick actions and recent activity |
| Live Connection Status | `components/LiveStatusDot.tsx` | Pulsing green/red dot via Socket.io connection state |
| Multi-Store Selector | `components/StoreSelector.tsx` | Header dropdown to switch active store |
| Onboarding Checklist | `components/OnboardingChecklist.tsx` | Completion tracker surfaced on dashboard |
| Real-Time Updates | `hooks/useOrders.ts` | React Query invalidation on push notifications |

---

## D. Point of Sale (POS)

| Feature | File | Description |
|---------|------|-------------|
| Product Grid | `app/sell/index.tsx` | 2-column product cards with images, category tabs, search |
| Cart Management | `app/sell/cart.tsx` | Quantity, modifiers (required/optional, single/multi), GST slabs (0/5/12/18/28%) |
| Barcode Scanner | `app/sell/scan.tsx` | Camera-based via `expo-camera` for rapid product lookup |
| Cash Payment | `app/sell/payment.tsx` | Cash tendered, change calculation, shift reconciliation |
| QR/UPI Payment | `app/sell/payment.tsx` | Generate scannable UPI QR, share via WhatsApp deep link |
| Razorpay SDK | `services/api/payments.ts` | Native `react-native-razorpay` for card/netbanking/wallet |
| Split Bill | `app/sell/split-bill.tsx` | Divide by item or amount between payment methods |
| Partial Payment | `app/sell/partial.tsx` | Accept partial payments, track remaining balance |
| Quick Bill | `app/sell/quick-bill.tsx` | Custom amount → instant QR (no product selection) |
| Bill Generation | `services/api/bills.ts` | Auto bill numbers, itemized receipts with GST breakdown |
| Print Receipt | `services/api/print.ts` | escpos-printer via expo-print, 30s retry queue |
| Shift Open | `app/sell/shift.tsx` | Enter opening cash float, timestamp + staff name |
| Shift Close | `app/sell/shift.tsx` | End shift, reconcile cash, submit closing float |
| Refund | `app/sell/refund.tsx` | Full or partial, cash or original payment reversal, predefined reasons |
| Offline Mode | `services/offlineService.ts` | Queue orders when offline, sync on reconnect. Network banner via `@react-native-community/netinfo` |
| Haptic Feedback | `utils/haptics.ts` | Tactile feedback on cart add, payment confirm, scan |
| Catalog Availability | `app/catalog/index.tsx` | Toggle web-menu items as sold out in real-time |

---

## E. Kitchen Display System (KDS)

| Feature | File | Description |
|---------|------|-------------|
| Kanban Board | `app/kds/index.tsx` | 3-column: New → Preparing → Ready. Touch to advance. |
| Order Cards | `app/kds/components/` | Order number, customer name, table, items + quantities, special instructions, course tags, allergen info |
| Elapsed Timer | `app/kds/components/OrderCard.tsx` | Live timer: green (<10 min), amber (10-20 min), red (>20 min) |
| Status Transitions | `services/api/orders.ts` | placed → confirmed → preparing → ready → dispatched → delivered |
| Audio Alerts | `hooks/useKDS.ts` | `expo-av` notification sound on new orders |
| Socket.io Sync | `services/socket.ts` | Real-time order arrival, React Query cache invalidation |
| REZ Now Orders | `app/kds/rez-now.tsx` | Separate tab for QR-code web orders |
| KDS Settings | `app/kds/settings.tsx` | Sound alerts, auto-print tickets, display preferences |

---

## F. Products & Menu Management

| Feature | File | Description |
|---------|------|-------------|
| Product List | `app/products/index.tsx` | Searchable, filterable, category tabs, sort (name/price/stock/updated) |
| Add Product | `app/products/add.tsx` | Name, short description, SKU, barcode, category, subcategory, brand, price/cost/compare-at, GST rate, stock, low-stock threshold, backorder toggle, weight, dimensions, tags |
| Product Images | `app/products/images.tsx` | Multi-image upload via `expo-image-picker`, gallery with reorder |
| Product Video | `app/products/video.tsx` | Video upload for showcase |
| Edit Product | `app/products/[id].tsx` | All fields editable, version tracking |
| Product Variants | `app/products/variants.tsx` | Size/color/price combinations |
| Product Modifiers | `app/products/modifiers.tsx` | Add-ons and customization options (e.g., extra cheese +₹20) |
| Combo/Bundle Products | `app/products/bundles.tsx` | Grouped items at discounted price |
| Bulk Actions | `app/products/bulk.tsx` | Batch activate/deactivate, delete, change category, update prices |
| CSV Import | `app/products/import.tsx` | Mass product upload via CSV |
| CSV Export | `app/products/export.tsx` | Catalog export |
| Archive & Restore | `app/products/archived.tsx` | Soft-delete with recovery |
| Stock Tracking | `app/products/stock.tsx` | Per-product counts, auto-deduction on sale |
| Low-Stock Alerts | `app/products/stock.tsx` | Configurable thresholds |
| Barcode Lookup | `app/sell/scan.tsx` | Scan to find/edit products |

---

## G. Categories Management

| Feature | File | Description |
|---------|------|-------------|
| Category List | `app/categories/index.tsx` | With product counts, active/inactive status |
| Create Category | `app/categories/add.tsx` | Name, description, image, icon, sort order |
| Edit Category | `app/categories/[id].tsx` | Update all fields |
| Drag-and-Drop Reorder | `app/categories/reorder.tsx` | Visual category ordering |
| Subcategories | `app/categories/[id]/sub.tsx` | Nested parent/child hierarchy |
| Per-Store Categories | `app/stores/[id]/categories.tsx` | Multi-outlet category assignment |
| Service Categories | `app/services/index.tsx` | For consultation/service businesses |

---

## H. Orders Management

| Feature | File | Description |
|---------|------|-------------|
| All Orders List | `app/orders/index.tsx` | Filter by status (placed/confirmed/preparing/ready/dispatched/delivered/cancelled/returned/refunded), date range |
| Live Orders Dashboard | `app/orders/live.tsx` | Real-time pending orders with audio + haptic alerts |
| Order Detail | `app/orders/[id].tsx` | Customer name, phone, items, quantities, instructions, subtotal, GST, discounts, total, payment method, status history |
| Status Updates | `app/orders/[id].tsx` | Advance through full lifecycle with notes |
| Web Orders (REZ Now) | `app/orders/rez-now.tsx` | Platform-attributed QR-code orders |
| Aggregator Orders | `app/orders/aggregator.tsx` | Swiggy/Zomato/Dunzo view |
| Print Invoice | `app/orders/[id]/invoice.tsx` | GST invoice generation |
| Print Packing Slip | `app/orders/[id]/packing-slip.tsx` | Delivery documentation |
| Print Shipping Label | `app/orders/[id]/shipping-label.tsx` | Label with address and barcode |
| Reprint Bill | `app/orders/[id]/reprint.tsx` | Any previously printed bill |

---

## I. Inventory Management

| Feature | File | Description |
|---------|------|-------------|
| Inventory Overview | `app/inventory/index.tsx` | All tracked ingredients/raw materials |
| Stock Alerts | `app/inventory/alerts.tsx` | Low-stock alerts when below threshold |
| Manual Adjustments | `app/inventory/adjust.tsx` | Add/remove stock with reason logging |
| Inventory Valuation | `app/inventory/valuation.tsx` | Current stock value at cost price |
| Recipe Costing | `app/inventory/recipes.tsx` | Link ingredients to products for food cost calculation |

---

## J. Analytics & Reporting

| Feature | File | Description |
|---------|------|-------------|
| Analytics Overview | `app/analytics/index.tsx` | 6-stat: revenue, orders, customers, AOV, cashback, footfall. Daily chart, peak hours, top offers. Date presets: 7d/30d/90d/1y |
| Sales Report | `app/analytics/sales.tsx` | Revenue by period, product, category, payment method |
| Revenue Report | `app/analytics/revenue.tsx` | Gross/net with trend analysis |
| AOV Analytics | `app/analytics/aov.tsx` | AOV trends, upsell opportunities |
| Food Cost Report | `app/analytics/food-cost.tsx` | Per-dish cost % and margin |
| Menu Engineering | `app/analytics/menu-engineering.tsx` | Star / Puzzler / Plow Horse / Dog classification |
| Expense Tracker | `app/analytics/expenses.tsx` | Food, Utilities, Salary, Marketing, Rent, Supplies, Other |
| Waste Tracking | `app/analytics/waste.tsx` | Daily waste per dish/ingredient |
| NPS Dashboard | `app/analytics/nps.tsx` | Net Promoter Score from feedback surveys |
| Cohort Retention | `app/analytics/cohort.tsx` | Week-by-week customer return rates |
| Growth Dashboard | `app/analytics/growth.tsx` | Acquisition, retention, LTV metrics |
| Peak Hours Analysis | `app/analytics/peak-hours.tsx` | Busiest service hours for staffing |
| Sales Forecast | `app/analytics/forecast.tsx` | Predictive revenue forecasting |
| Stores Comparison | `app/analytics/stores.tsx` | Multi-outlet side-by-side |
| P&L Statement | `app/analytics/pnl.tsx` | Profit & loss |
| Web Feedback | `app/analytics/web-feedback.tsx` | Food quality, service speed, recommendation % from web orders |
| CSV Export | `app/analytics/export.tsx` | Transactions, customers, payouts |

---

## K. Customers & CRM

| Feature | File | Description |
|---------|------|-------------|
| Customer List | `app/customers/index.tsx` | Searchable, segmented directory |
| Customer Profile | `app/customers/[id].tsx` | LTV, visit history, purchase history, tags, segment |
| Customer Segments | `app/customers/segments.tsx` | Champion, Loyal, At-Risk, Lapsed, New |
| Behavioral Insights | `app/customers/insights.tsx` | Per-customer analytics |
| Tagging | `app/customers/[id].tsx` | Add/remove custom tags |
| Send Messages | `app/customers/[id]/message.tsx` | SMS, WhatsApp, push to individual customers |
| Visit Tracking | `app/visits.tsx` | Log and view customer check-in history |
| CRM List | `app/crm/index.tsx` | Full CRM with segment counts and LTV display |
| CRM Detail | `app/crm/[userId].tsx` | Visit history, notes, tags, LTV, AOV, per-visit coin earnings |

---

## L. Loyalty & Rewards

| Feature | File | Description |
|---------|------|-------------|
| Loyalty Program Config | `app/loyalty/index.tsx` | Tiered: Bronze/Silver/Gold. Earning/redemption rules per tier |
| Punch Cards | `app/loyalty/punch-cards.tsx` | N visits = reward. Toggle active/paused |
| Stamp Cards | `app/loyalty/stamp-cards.tsx` | Digital stamp equivalent |
| Branded Coins | `app/loyalty/branded-coins.tsx` | Custom logo, name |
| Coin Drops | `app/loyalty/coin-drops.tsx` | One-time bonus distributions |
| Coin Management | `app/loyalty/transactions.tsx` | Balances, transaction history, issuance/redemption ledger |
| Loyalty Settings | `app/loyalty/settings.tsx` | Per-category coin multiplier (hair/nails/spa/skin/makeup/massage/beard), points expiry, bonus multipliers |
| AOV Rewards | `app/loyalty/aov-rewards.tsx` | Bonus coins at basket size thresholds |

---

## M. Discounts & Promotions

| Feature | File | Description |
|---------|------|-------------|
| Discount Rules List | `app/discounts/index.tsx` | Active/inactive, % or fixed, min-spend, validity |
| Discount Builder | `app/discounts/create.tsx` | % or fixed, spend thresholds, validity, product/category restrictions |
| Dynamic Pricing | `app/discounts/dynamic.tsx` | Time-based (e.g., happy hour 2-6 PM) |
| Deals | `app/deals/index.tsx` | Create deals with terms and conditions |
| Vouchers | `app/vouchers/index.tsx` | Single/multi-use, custom amounts, validity |
| Bundles | `app/bundles/index.tsx` | Discounted item groups |
| Post-Purchase Rules | `app/automation/post-purchase.tsx` | Auto-trigger follow-up after every sale |

---

## N. Cashback

| Feature | File | Description |
|---------|------|-------------|
| Cashback Overview | `app/cashback/index.tsx` | Total issued, pending, redeemed, expired metrics |
| Requests List | `app/cashback/requests.tsx` | Filter by status, bulk approve/reject |
| Approve/Reject | `app/cashback/[id].tsx` | Review with notes |
| Cashback Analytics | `app/cashback/analytics.tsx` | Issuance volume, redemption rate, expiry charts |
| Social Media Cashback | `app/cashback/social.tsx` | Referral/share tracking |

---

## O. Payments, Settlements & Wallet

| Feature | File | Description |
|---------|------|-------------|
| Wallet Summary | `app/wallet/index.tsx` | Balance, pending payouts, total earned |
| Wallet Transactions | `app/wallet/transactions.tsx` | Full credit/debit ledger with timestamps |
| Settlements List | `app/settlements/index.tsx` | Cycle: active / pending_settlement / settled / disputed / void |
| Settlement Detail | `app/settlements/[id].tsx` | Per-settlement transaction breakdown, fees |
| Payout Requests | `app/payouts/index.tsx` | Bank transfer requests, history (pending/processing/paid/failed) |
| In-Store Payments | `app/payments/history.tsx` | Payment method breakdown (card/UPI/cash/wallet) |
| Dispute Management | `app/disputes/index.tsx` | View and respond to payment disputes |
| Per-Store Payment Config | `app/stores/[id]/payment-settings.tsx` | UPI, cards, Pay Later, REZ coins, promo coins, hybrid toggle, coin redemption %, visit milestone coins, review bonus, social share bonus |

---

## P. Team Management

| Feature | File | Description |
|---------|------|-------------|
| Team Members List | `app/team/index.tsx` | Role, status (active/invited/suspended), search, filter |
| Invite Team Member | `app/team/invite.tsx` | Phone/email, assign role + permissions |
| Role Management | `app/team/roles.tsx` | owner, admin, manager, cashier, staff |
| Fine-Grained Permissions | `app/team/permissions.tsx` | analytics:view, logs:view, team:invite, etc. |
| Staff Profile | `app/team/[id].tsx` | Performance, shift history, commission earnings |
| Commission Tracking | `app/team/commissions.tsx` | Per-staff, per-service-category % or fixed commission config |
| Timesheet | `app/team/timesheet.tsx` | Clock-in/out, hours worked |
| Payroll Reports | `app/team/payroll.tsx` | Per-staff summaries |
| Activity Feed | `app/team/activity.tsx` | Team action logs |
| Permissions Screen | `app/permissions.tsx` | Admin view of all role-permission mappings |

---

## Q. Staff Shifts & Scheduling

| Feature | File | Description |
|---------|------|-------------|
| Staff Rota | `app/shifts/rota.tsx` | Weekly schedule: assign staff to shifts per day |
| Shift Management | `app/shifts/index.tsx` | Open (cash float) → in-progress (breaks) → close (reconcile) |
| Clock In/Out | `app/shifts/clock.tsx` | Staff self-service attendance logging |
| Attendance Report | `app/shifts/attendance.tsx` | Daily/weekly summaries |
| Post-to-Hub | `app/shifts/post-to-hub.tsx` | Sync to external workforce system |

---

## R. Appointments & Bookings

| Feature | File | Description |
|---------|------|-------------|
| Appointments List | `app/appointments/index.tsx` | All statuses: pending/confirmed/in_progress/completed/cancelled/no_show |
| Appointment Detail | `app/appointments/[id].tsx` | Customer info, service, date/time, staff, notes |
| New Appointment | `app/appointments/new.tsx` | Select customer, service, date/time, staff |
| Calendar View | `app/appointments/calendar.tsx` | Visual calendar with appointment slots |
| Booking Link | `app/appointments/booking-link.tsx` | Public self-schedule link for customers. WhatsApp share button |
| Waitlist | `app/appointments/waitlist.tsx` | Overflow management when slots full |
| No-Show Protection | `app/appointments/no-show-protection.tsx` | Fixed or % deposit, new client vs all-client, cancellation window, late fee |
| Blocked Time | `app/appointments/blocked.tsx` | Mark unavailable slots |
| Patch Test | `app/appointments/patch-test.tsx` | Record management: service category, result, date, expiry, conducted by, notes |
| Service Packages | `app/service-packages/index.tsx` | Prepaid multi-session bundles: bundled services, sessions, price, validity |
| Class Schedule | `app/class-schedule/index.tsx` | Instructor, duration, capacity, price, recurring schedule, color coding, booked count |
| Treatment Rooms | `app/treatment-rooms/index.tsx` | CRUD: rooms, chairs, stations, suites, capacity, description, color coding, active status |
| Consultation Forms | `app/consultation-forms/index.tsx` | Form list with active/inactive toggle |
| Consultation Form Builder | `app/consultation-forms/builder.tsx` | 7 field types: text, textarea, select, multiselect, checkbox, date, phone. Drag-to-reorder, required toggle, placeholder text |

---

## S. Dine-In & Table Management

| Feature | File | Description |
|---------|------|-------------|
| Table Grid | `app/tables/index.tsx` | Visual grid: green (available) / red (occupied) / amber (reserved) |
| Table Orders | `app/tables/[id]/order.tsx` | Place and manage orders per table |
| Floor Plan Editor | `app/tables/editor.tsx` | Drag-and-drop: square 2/4, round 2/4/6, bar shapes |
| Waiter Mode | `app/tables/waiter.tsx` | Restricted order-taking for floor staff |
| Duration Tracking | `app/tables/index.tsx` | Color-coded urgency timer per occupied table |
| All Table Bookings | `app/all-table-bookings.tsx` | Cross-store: store filter, date selection, confirm/cancel/no-show |
| Per-Store Table Bookings | `app/stores/[id]/table-bookings.tsx` | Per-store booking management |

---

## T. Events

| Feature | File | Description |
|---------|------|-------------|
| Events List | `app/events/index.tsx` | Draft, published, cancelled, completed |
| Create Event | `app/events/create.tsx` | Name, description, date/time, location, capacity, ticket price |
| Edit Event | `app/events/[id]/edit.tsx` | Update all event details |
| Publish/Unpublish | `app/events/[id].tsx` | Toggle visibility |
| Event Bookings | `app/events/[id]/bookings.tsx` | View and manage registrations |
| Social Impact Events | `app/social-impact/index.tsx` | 10 types: blood donation, tree plantation, beach cleanup, digital literacy, food drive, health camp, skill training, women empowerment, education, environment |
| Social Impact: Add | `app/social-impact/add.tsx` | Sponsor management, media upload |
| Social Impact: Participants | `app/social-impact/[id]/participants.tsx` | Status filters, search, bulk actions, OTP verification, QR scanning |
| Social Impact: QR Scan | `app/social-impact/[id]/scan.tsx` | Participant check-in at events. Web fallback included |

---

## U. Marketing & Advertising

| Feature | File | Description |
|---------|------|-------------|
| Ads Manager | `app/ads/index.tsx` | Create campaigns: home banner, explore feed, store listing, search. Budget, CPM/CPA bidding |
| Campaign Analytics | `app/ads/[id].tsx` | Views, clicks, CTR, spend, conversions |
| Campaign Status | `app/ads/index.tsx` | Draft, pending review, active, paused, rejected |
| Campaign Performance | `app/campaigns/performance.tsx` | Budget tracking (spent vs. cap), redemption counts |
| Campaign Simulator | `app/campaigns/simulator.tsx` | ROI prediction before launch |
| Campaign ROI | `app/ads/[id]/roi.tsx` | Return-on-investment per campaign |
| AI Recommendations | `app/campaigns/recommendations.tsx` | AI-suggested campaign types with estimated impact, ROI, budget, target segment, urgency |
| Create Offer Campaign | `app/campaigns/create-offer.tsx` | Targeted customer offers with goals and audience |
| Broadcast | `app/(dashboard)/broadcast.tsx` | Multi-channel: push, WhatsApp, SMS, email, in-app with status tracking |
| Push to Subscribers | `app/customer-push.tsx` | Merchant-initiated push to loyal customers (3+ visits): special offer, new item, double cashback, custom. 2/week limit enforced |
| Promotional Videos | `app/stores/[id]/promotional-videos.tsx` | Upload, sort (newest/popular/views), analytics |
| Bonus Campaigns | `app/ads/bonus.tsx` | Platform-wide bonus tracking |
| Promote Hub | `app/(dashboard)/promote.tsx` | Unified: Campaigns + In-App Ads + Ad Bazaar in one tabbed interface |
| Promotion Toolkit | `app/promotion-toolkit.tsx` | Generate: QR poster, table tent card, "Scan to Save" sticker. Shareable via expo-sharing |
| Promote: Broadcast | `app/(dashboard)/broadcast.tsx` | Push, WhatsApp, SMS, email, in-app |
| Ad Bazaar | `app/ads/bazaar.tsx` | REZ's in-app ad marketplace listings |

---

## V. REZ Now (Public Store Page)

| Feature | File | Description |
|---------|------|-------------|
| REZ Now Setup | `app/rez-now/index.tsx` | Slug, logo, description, cover image, social links, operating hours |
| REZ Now Orders | `app/rez-now/orders.tsx` | QR-code orders from public web menu |
| Store Profile | `app/rez-now/profile.tsx` | Public-facing store info |
| Booking Link | `app/rez-now/booking.tsx` | Shareable order/booking link |
| QR Code Generator | `app/rez-now/qr.tsx` | Branded check-in QR for customer scanning |
| QR Check-In | `app/rez-now/checkin.tsx` | Display QR for customer scan + coin earning |
| Subscription Plans | `app/subscription/index.tsx` | Current plan, product/store limits, usage meters |
| Social Booking Links | `app/settings/social-booking.tsx` | Instagram "Book" button, Google My Business, Facebook direct booking |

---

## W. Coins & Incentives

| Feature | File | Description |
|---------|------|-------------|
| Coin Economics | `app/coins/index.tsx` | 1 coin = ₹1 earn, 1 coin = ₹1 redeem. Total distributed, redeemed, pending |
| Branded Coin Config | `app/coins/branded.tsx` | Custom name and logo |
| Coin Drops | `app/coins/drops.tsx` | One-time bonus campaigns |
| TRY Trials | `app/try/merchant/create.tsx` | Trial offer: title, category (Service/Sample Pickup/Experience/D2C Kit), original price, trial coin price, commitment fee (9/19/29), daily slots, QR window type, reward coins, upsell links |
| TRY Analytics | `app/try/merchant/analytics.tsx` | Redemption stats, conversion funnel |
| TRY Scanner | `app/try/merchant/scanner.tsx` | QR scanner for trial check-in with location tracking |
| Corporate Rewards | `app/(dashboard)/corporate.tsx` | Company registration, bulk CSV employee upload, coin distribution, utilization analytics, department breakdown |
| Creator Rewards | `app/stores/[id]/creator-analytics.tsx` | Creator picks management, product attribution, tier tracking |
| Earning Analytics | `app/stores/[id]/earning-analytics.tsx` | Store earning analytics |
| REZ Capital | `app/rez-capital/index.tsx` | Financing dashboard: 4-factor eligibility (GMV, repayment, consistency, cashback), pre-approved amount, monthly interest rate, improvement tips, apply CTA |
| TRY Trial Scanner | `app/(dashboard)/try-trials.tsx` | Trial listing with status management |

---

## X. Gift Cards & Vouchers

| Feature | File | Description |
|---------|------|-------------|
| Global Gift Cards | `app/gift-cards/index.tsx` | Issue, redeem, stats (active/redeemed amounts), expiry tracking |
| Per-Store Gift Cards | `app/stores/[id]/gift-cards.tsx` | Store-specific: code generation, balance tracking, customer phone linking |
| Store Vouchers List | `app/stores/[id]/vouchers.tsx` | Active/expired filter, total/redeemed/active amounts |
| Store Voucher Create | `app/stores/[id]/vouchers/add.tsx` | Value, validity, limits |
| Store Voucher Detail | `app/stores/[id]/vouchers/[voucherId].tsx` | Detail and redemption |

---

## Y. Documents & GST

| Feature | File | Description |
|---------|------|-------------|
| Documents Hub | `app/documents/index.tsx` | Central document access |
| Invoices | `app/invoices/index.tsx` | GST-compliant per order |
| POS Invoices | `app/invoices/pos.tsx` | Bill-level receipts |
| Packing Slips | `app/invoices/packing-slip.tsx` | Delivery documentation |
| Shipping Labels | `app/invoices/shipping-label.tsx` | Label with address and barcode |
| GSTR-1 Report | `app/gst/r1.tsx` | Monthly B2C filing data |
| GSTR-3B Summary | `app/gst/r3b.tsx` | Output tax liability |
| Credit Notes | `app/gst/credit-notes.tsx` | For returns/refunds |
| Delivery Challan | `app/gst/challan.tsx` | Inter-state transfers |
| Quotations | `app/quotations/index.tsx` | Price quotes for prospects |
| Tally Export | `app/gst/tally.tsx` | Tally-compatible data export |
| WhatsApp Invoice | `services/api/invoices.ts` | Send invoice PDF via WhatsApp |
| WhatsApp Purchase Order | `services/api/purchaseOrders.ts` | Send PO via WhatsApp with deep link |

---

## Z. Khata (Customer Credit Ledger)

| Feature | File | Description |
|---------|------|-------------|
| Khata List | `app/khata/index.tsx` | All customers with outstanding credit balances, search, filter |
| Add Khata Customer | `app/khata/add.tsx` | Name, phone, initial balance, notes |
| Khata Customer Detail | `app/khata/[customerId].tsx` | Customer info, current balance, full transaction history (credits/debits) |

---

## AA. In-App Merchant Chat

| Feature | File | Description |
|---------|------|-------------|
| Conversations List | `app/messages/index.tsx` | Status filters (all/active/archived), unread counts, search, pagination |
| Chat Thread | `app/messages/[conversationId].tsx` | 8 message types: text, image, video, file, location, product card, order card, system message |
| Messaging Service | `services/api/messaging.ts` | Full `MerchantConversation` and `MerchantMessage` types |

---

## AB. Customer Content (UGC)

| Feature | File | Description |
|---------|------|-------------|
| UGC Gallery | `app/stores/[id]/ugc.tsx` | Customer photos/videos: thumbnails, captions, tags, engagement (likes, comments, shares, views) |
| Store Gallery | `app/stores/[id]/gallery.tsx` | Drag-and-drop reorder, category assignment, image upload, active/inactive toggle |

---

## AC. Reviews & Moderation

| Feature | File | Description |
|---------|------|-------------|
| Reviews List | `app/stores/[id]/reviews.tsx` | Ratings, titles, comments, images, verified badges, helpful counts, moderation status |
| Merchant Response | `app/stores/[id]/reviews.tsx` | Reply to reviews |
| Moderation Status | `app/settings/moderation-status.tsxx` | Dashboard: approved/pending/rejected/featured counts |
| Web Ordering Reviews | `app/stores/[id]/reviews.tsx` | Imported from web ordering |

---

## AD. Prive Campaigns (Creator UGC)

| Feature | File | Description |
|---------|------|-------------|
| Campaign List | `app/stores/[id]/prive-campaigns/index.tsx` | Status tabs: active/draft/paused/ended. Submission counts, approval rates |
| Campaign Creator | `app/stores/[id]/prive-campaigns/create.tsx` | 4-step: title/hashtag, platform (Instagram/Twitter/YouTube), deadline, reward type (REZ coins or promo), max submissions, min follower requirement, PRIVE tier gating |
| Submission Review | `app/stores/[id]/prive-campaigns/submissions.tsx` | Approve/reject, thumbnail preview, platform indicator, rejection reason |

---

## AE. Integrations

| Feature | File | Description |
|---------|------|-------------|
| Aggregator Hub | `app/integrations.tsx` | Swiggy, Zomato, Dunzo: connection status (active/paused/error/pending_setup), sync mode (realtime/batch), last sync, error count |
| Merchant Integrations | `app/(dashboard)/integrations.tsx` | Per-merchant integrations management |
| Aggregator Orders | `app/orders/aggregator.tsx` | Aggregator order view |
| Hotel OTA Dashboard | `app/hotel-ota.tsx` | Hotel-specific: OTA booking summary, PMS connection status, channel management |

---

## AF. Operations & Logistics

| Feature | File | Description |
|---------|------|-------------|
| Purchase Orders | `app/purchase-orders/index.tsx` | Create and manage supplier orders |
| Suppliers List | `app/suppliers/index.tsx` | Name, contact, items supplied |
| Supplier Detail | `app/suppliers/[id].tsx` | History, outstanding payments |
| Upsell Rules | `app/upsell/index.tsx` | Trigger: any order, specific product, category, cart value threshold → suggest upsell items during POS |
| Automation Rules | `app/automation/index.tsx` | Triggers: rebooking overdue, birthday, post-visit review, visit anniversary, inactive client, first visit. Actions: push, SMS, email, give coins |
| Automation Editor | `app/automation/edit.tsx` | Configure trigger + action |
| Rebooking Template | `app/automation/rebooking-template.tsx` | Pre-built: weeks-after-visit, channel selection |
| Fraud Detection | `app/fraud/index.tsx` | Flag and review suspicious transactions |
| Maintenance Mode | `app/_layout.tsx` | App-level banner when backend is in maintenance |
| Force Update | `app/_layout.tsx` | Version check against minimum required |

---

## AG. Brand Management (Multi-Outlet)

| Feature | File | Description |
|---------|------|-------------|
| Brand Dashboard | `app/brand/index.tsx` | Outlet list, central menu toggle, brand-level analytics (total revenue, transactions, AOV, per-outlet breakdown, top outlet) |
| Brand Create | `app/brand/create.tsx` | New brand creation |
| Store Outlets | `app/stores/[id]/outlets.tsx` | Per-store: add/edit/deactivate outlets, location details |

---

## AH. Revenue Goals

| Feature | File | Description |
|---------|------|-------------|
| Goals Dashboard | `app/goals/index.tsx` | Monthly revenue goal and visit target setting with current vs. target, progress visualization, days-remaining countdown, monthly reset |

---

## AI. Notifications

| Feature | File | Description |
|---------|------|-------------|
| Notification Center | `app/notifications/index.tsx` | 6-tab: all/unread/orders/products/team/system. Icon mapping, read/unread, action navigation, pagination |
| Notification Preferences | `app/notifications/preferences.tsx` | Per-category toggles (orders/products/team/system/cashback/payments), quiet hours, auto-delete |
| Notification Settings | `app/notifications/settings.tsx` | Retention period, grouping options (none/by type/by date), badge display |
| Slide-In Overlay | `components/NotificationCenter.tsx` | Priority filtering (low/medium/high/urgent), category grouping, real-time data |
| Notifications Service | `services/api/notifications.ts` | Full API service |
| Notification Hooks | `hooks/queries/useNotifications.ts` | React Query hooks |
| Notification Context | `contexts/NotificationContext.tsx` | React context provider |

---

## AJ. Audit & Compliance

| Feature | File | Description |
|---------|------|-------------|
| Audit Logs | `app/audit/index.tsx` | Paginated, filterable, searchable. Severity levels (info, warning, critical), export |
| Audit Archives | `app/audit/archives.tsx` | Archived log files with retention statistics |
| Audit Compliance | `app/audit/compliance.tsx` | GDPR, SOC2, PCI DSS, ISO27001 frameworks with finding counts |
| Audit Timeline | `app/audit/timeline.tsx` | Visual timeline with time filters, severity color coding, actor avatars |

---

## AK. Subscription Plans

| Feature | File | Description |
|---------|------|-------------|
| Plan Limits | `app/subscription/index.tsx` | Current plan, product/store limits, usage meters |
| Plan Usage | `app/(dashboard)/subscription-plans.tsx` | SMS, WhatsApp, push usage per tier with limits tracking |

---

## AL. Support & About

| Feature | File | Description |
|---------|------|-------------|
| Support Tickets | `app/support/index.tsx` | View and reply to customer support conversations |
| About / App Info | `app/about.tsx` | Version, terms of service, privacy policy, contact support |
| System Status | `app/settings/system-status.tsx` | Health check of connected services |

---

## AM. Settings & Configuration

| Feature | File | Description |
|---------|------|-------------|
| Business Profile | `app/settings/profile.tsx` | Store name, logo, description, contact info |
| Business Hours | `app/settings/hours.tsx` | Daily open/close per day of week |
| Notification Preferences | `app/notifications/preferences.tsx` | Push, email, SMS toggles per event type |
| Printer Setup | `app/settings/printer.tsx` | Bluetooth/WiFi, paper size |
| Feature Flags | `app/settings/feature-flags.tsx` | View and toggle platform feature flags |
| Calendar Sync | `app/settings/calendar.tsx` | External calendar integration |
| Cancellation Policy | `app/settings/cancellation.tsx` | Configure cancellation and refund rules |
| Content Moderation | `app/settings/moderation-status.tsxx` | Read-only dashboard of review/photo moderation counts |
| Audit Logs | `app/audit/index.tsx` | Activity log with severity, export |
| Social Booking | `app/settings/social-booking.tsx` | Instagram, Google My Business, Facebook direct booking links |
| Per-Store Payment Settings | `app/stores/[id]/payment-settings.tsx` | UPI, cards, Pay Later, REZ coins, promo coins, hybrid toggle, coin % |
| Social Impact Events | `app/social-impact/index.tsx` | CRS event management |

---

## Feature Count Summary

| Category | Features |
|----------|---------|
| Authentication & Account | 8 |
| Onboarding | 10 |
| Dashboard | 5 |
| Point of Sale (POS) | 16 |
| Kitchen Display System | 8 |
| Products & Menu | 15 |
| Categories | 7 |
| Orders | 10 |
| Inventory | 5 |
| Analytics & Reporting | 17 |
| Customers & CRM | 9 |
| Loyalty & Rewards | 8 |
| Discounts & Promotions | 7 |
| Cashback | 5 |
| Payments, Settlements & Wallet | 8 |
| Team Management | 11 |
| Staff Shifts & Scheduling | 5 |
| Appointments & Bookings | 12 |
| Dine-In & Table Management | 7 |
| Events | 8 |
| Marketing & Advertising | 15 |
| REZ Now | 8 |
| Coins & Incentives | 11 |
| Gift Cards & Vouchers | 5 |
| Documents & GST | 12 |
| Khata (Credit Ledger) | 3 |
| In-App Chat | 3 |
| Customer Content (UGC) | 2 |
| Reviews & Moderation | 4 |
| Prive Campaigns | 4 |
| Integrations | 5 |
| Operations & Logistics | 7 |
| Brand Management | 3 |
| Revenue Goals | 1 |
| Notifications | 6 |
| Audit & Compliance | 4 |
| Subscription Plans | 2 |
| Support & About | 2 |
| Settings & Configuration | 13 |
| **Total** | **~290 features** |

---

## Tech Stack Details

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 53 |
| Runtime | React Native 0.79.6 |
| Language | TypeScript ~5.8 |
| Navigation | Expo Router (file-based routing) |
| State Management | Zustand + React Query (TanStack Query v5) |
| Forms | React Hook Form + Zod |
| Charts | Victory Native |
| Real-time | Socket.io client |
| Payments | react-native-razorpay |
| Logging | Sentry |
| Storage | expo-secure-store, AsyncStorage |
| Deep Linking | expo-linking |
| Camera | expo-camera |
| Biometrics | expo-local-authentication |
| QR Codes | react-native-qrcode-svg |
| Printing | expo-print + escpos-printer |
| Documents | expo-document-picker |
| Notifications | expo-notifications |

---

## API Endpoints (Merchant App → Gateway)

| Endpoint Pattern | Service | Notes |
|----------------|---------|-------|
| `/api/merchant/auth/*` | rez-backend (monolith) | Login, register, forgot password |
| `/api/orders/*` | rez-order-service | Orders CRUD, status updates |
| `/api/wallet/*` | rez-wallet-service | Merchant wallet, payouts |
| `/api/payment/*` | rez-payment-service | Razorpay integration |
| `/api/catalog/*` | rez-catalog-service | Products, categories |
| `/api/analytics/*` | rez-backend | Reports, revenue, customers |
| `/api/notifications/*` | rez-notification-events | Push notifications |
| Socket events | rez-backend | Real-time orders, KDS updates |

---

## Use Cases (Actor → Goal → Flow)

### Merchant (Owner/Admin)

**UC-01: First-time setup**
1. Download app → Open → See welcome screen
2. Enter phone → Receive OTP → Verify
3. Enter business details (name, type, PAN, GST)
4. Enter store details (address, phone, description)
5. Enter bank/UPI for payouts
6. Upload required documents
7. Review & Submit
8. See pending approval screen
9. (Admin approves) → Set up ReZ Now page → Go live

**UC-02: Daily POS sale**
1. Open app → Dashboard → Tap "Sell"
2. (If no shift open) → Open shift with cash float
3. Browse product grid → Add items to cart
4. Tap customer → Apply discount / modifier
5. Select payment: Cash / QR / Card / Split
6. Print receipt → Close shift
7. Order syncs to backend in real-time

**UC-03: Handle online order (REZ Now)**
1. KDS receives push notification + audio alert
2. New order appears in KDS "New" column
3. Tap card → Status: New → Preparing
4. Kitchen sees update
5. Food ready → Status: Preparing → Ready
6. Runner picks up → Dispatched → Delivered
7. Customer QR scan earns coins automatically

**UC-04: Process refund**
1. Orders → Find order → Tap "Refund"
2. Select full or partial (pick items)
3. Choose refund method: Cash / Original payment
4. Select reason from predefined list
5. Confirm → Coins reversed to customer wallet
6. Settlement updated

**UC-05: Manage team**
1. Team → Invite Member → Enter phone/email
2. Assign role (Manager / Cashier / Staff)
3. Set permissions (view-only analytics, process refunds, etc.)
4. Staff downloads app → Logs in → Sees restricted interface
5. Track commission via per-staff reports

**UC-06: Launch loyalty campaign**
1. Loyalty → Create Punch Card
2. Configure: 5 visits = free drink
3. Set active period
4. Customer earns stamp on every POS visit
5. 5th visit → Redeem reward → Coins auto-issued

**UC-07: Create ad campaign**
1. Ads → Create Campaign
2. Select placement: home banner / explore feed / store listing
3. Set budget (₹500/day) and bid type (CPM/CPA)
4. Target audience (location, demographics)
5. AI recommends optimal bid and timing
6. Launch → Monitor views/clicks/conversions
7. Payout via wallet when budget depletes

**UC-08: Resolve payment dispute**
1. Wallet → Disputes → View disputed transaction
2. See customer complaint and evidence
3. Submit merchant's side of the story
4. Platform mediates → Resolution applied
5. Funds released or reversed

**UC-09: Configure multi-outlet**
1. Brand → Create brand → Add outlets
2. Each outlet gets its own POS, KDS, and orders
3. Central brand dashboard shows consolidated revenue
4. Manage per-outlet payment settings, hours, categories
5. Compare outlet performance in analytics

**UC-10: Use Khata for regular customers**
1. Khata → Add Customer → Name, phone, initial credit
2. Customer buys on credit → Transaction logged
3. Customer pays cash later → Record as debit
4. Track outstanding balance per customer
5. Send reminder via WhatsApp when balance is high

### Staff (Cashier/Manager)

**UC-11: Process cash payment at POS**
1. Open shift with opening float
2. Customer selects items → Cart total ₹450
3. Customer pays ₹500 cash
4. System shows change ₹50
5. Print receipt → End of shift reconcile cash

**UC-12: Take table order (Dine-In)**
1. Tables → Select available table (green)
2. Waiter Mode → Browse menu
3. Add items → Send to kitchen (KDS auto-updates)
4. Table turns red (occupied) → Timer starts
5. Customer requests bill → Split by item → Partial payment
6. Close table → Mark available

**UC-13: Manage appointments**
1. Appointments → Calendar → New
2. Select customer → Service → Staff → Time slot
3. Blocked time for lunch break
4. Send booking link via WhatsApp to customer
5. Day of: Customer no-shows → Mark no-show → Deposit auto-forfeited

### Consumer (Customer-facing flows triggered by merchant)

**UC-14: Customer scans QR → Earns coins**
1. Merchant displays QR (REZ Now check-in)
2. Customer scans with REZ consumer app
3. Earns visit_bonus_coins (first visit of the day)
4. Coins credited to wallet

**UC-15: Customer receives referral bonus**
1. Customer shares referral code or QR
2. Friend signs up → Places first order
3. Referrer earns ₹50 worth of coins
4. REZ platform tracks attribution via UTM/QR

**UC-16: Customer redeems loyalty reward**
1. Customer has 5 stamps (punch card)
2. POS → Customer shows app → 5 stamps visible
3. Cashier marks all 5 as redeemed
4. Free item added to cart → ₹0
5. Customer satisfied → Repeat visit

### Platform (System automations)

**UC-17: Automatic settlement**
1. End of day → System calculates net settlement
2. Total orders - refunds - fees = merchant payout
3. Settlement created → Status: pending_settlement
4. Bank transfer initiated → Processing
5. Funds arrive in merchant account → Settled

**UC-18: Coin expiry processing**
1. BullMQ scheduled job runs daily
2. Checks coins with expiry timestamp in past
3. Marks expired → Deducts from wallet balance
4. Logs transaction as EXPIRED
5. Customer notified of expired coins

**UC-19: Fraud detection alert**
1. Order placed with unusual pattern (100 orders/minute from same IP)
2. Fraud detection flags the account
3. Merchant receives alert notification
4. Merchant reviews → Confirms or rejects
5. Account suspended if confirmed fraud

**UC-20: No-show deposit enforcement**
1. Customer books appointment with deposit required
2. Customer cancels within cancellation window → Deposit forfeited
3. System auto-credits deposit to merchant wallet
4. Customer notified via push notification

**UC-21: Low-stock alert → Auto-deactivation**
1. Product stock falls below threshold
2. Push notification to merchant
3. Merchant reviews → Either restocks or marks catalog unavailable
4. REZ Now web menu auto-updates (sold out)

**UC-22: Referral coin payout**
1. Referred customer places qualifying order
2. System checks referral attribution
3. Coins auto-credited to referrer's wallet
4. Transaction logged in wallet history

---

## File Architecture

```
app/
├── (auth)/                  # Auth screens: login, register, forgot-password
├── (tabs)/                 # Tab navigation
│   ├── _layout.tsx
│   ├── index.tsx           # Dashboard
│   ├── products/
│   ├── orders/
│   ├── analytics/
│   ├── sell/              # POS
│   ├── team/
│   ├── audit/
│   └── more/
├── (dashboard)/            # Non-tab screens
│   ├── appointments/
│   ├── loyalty/
│   ├── discounts/
│   ├── cashback/
│   ├── wallet/
│   ├── shifts/
│   ├── tables/
│   ├── events/
│   ├── integrations/
│   ├── ads/
│   ├── brand/
│   ├── corporate/
│   ├── social-impact/
│   ├── broadcast/
│   ├── promote/
│   ├── subscription-plans/
│   ├── try-trials/
│   ├── khata/
│   └── messages/
├── khata/                 # Customer credit ledger
├── messages/              # Merchant-customer chat
├── gift-cards/
├── notifications/
├── notifications/preferences.tsx
├── notifications/settings.tsx
├── notifications/index.tsx
├── inventory/
├── documents/
├── invoices/
├── gst/
├── quotations/
├── crm/
├── appointments/
│   ├── no-show-protection.tsx
│   └── patch-test.tsx
├── consultations/
├── service-packages/
├── treatment-rooms/
├── class-schedule/
├── social-impact/
├── rez-capital/
├── try/
│   └── merchant/
├── support/
├── audit/
│   ├── archives.tsx
│   ├── compliance.tsx
│   └── timeline.tsx
├── subscription/
├── messages/
├── hotel-ota.tsx
├── catalog/
├── goals/
├── rez-now/
├── onboarding/
├── settings/
├── store/[id]/
│   ├── gift-cards.tsx
│   ├── vouchers.tsx
│   ├── ugc.tsx
│   ├── gallery.tsx
│   ├── reviews.tsx
│   ├──prive-campaigns/
│   ├── creator-analytics.tsx
│   ├── earning-analytics.tsx
│   ├── promotional-videos.tsx
│   ├── outlets.tsx
│   ├── payment-settings.tsx
│   ├── categories.tsx
│   └── table-bookings.tsx
└── _layout.tsx            # Root layout with deep links, auth guard, socket init
```

---

## EAS Build Profiles

| Profile | Purpose | Notes |
|---------|---------|-------|
| `development` | Local dev | Debug, localhost |
| `preview` | TestFlight / Internal | Staging API |
| `production` | App Store / Play Store | Production API, Sentry, min version enforced |
