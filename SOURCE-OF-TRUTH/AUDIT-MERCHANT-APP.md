# Merchant App Feature Audit - ReZ Platform

**Audit Date:** 2026-05-05
**Auditor:** Claude Code
**Projects Audited:**
- `rez-app-merchant` (React Native/Expo Merchant App)
- `rez-merchant-service` (Backend Microservice)
- `REZ-merchant-copilot` (AI Business Intelligence Service)

---

## TABLE OF CONTENTS

1. [Restaurant Features](#restaurant-features)
2. [Retail Features](#retail-features)
3. [Cross-Business Features](#cross-business-features)
4. [Summary](#summary)

---

# RESTAURANT FEATURES

## Point of Sale (POS)

### POS System (Main)
- **Business Type:** Restaurant
- **Description:** Full-featured Point of Sale system with product grid, cart management, and payment processing
- **Merchant Benefit:** Fast checkout, supports dine-in/takeaway orders, split bills, table numbers
- **System Benefit:** Real-time inventory updates, transaction logging, GST calculation
- **Connects To:** Order Service, Inventory Service, Payment Gateway
- **Status:** Working
- **Issues:** None identified

### POS Quick Bill
- **Business Type:** Restaurant
- **Description:** Quick billing feature for fast transactions without full cart flow
- **Merchant Benefit:** Faster checkout for simple orders
- **System Benefit:** Reduced transaction overhead
- **Connects To:** Order Service
- **Status:** Working
- **Issues:** None identified

### POS Shift Management
- **Business Type:** Restaurant
- **Description:** Open and close shift functionality with cash reconciliation
- **Merchant Benefit:** Track cash flow per shift, accountability for staff
- **System Benefit:** Accurate daily reconciliation, audit trail
- **Connects To:** Store Analytics, Wallet Service
- **Status:** Working
- **Issues:** None identified

### POS Refund Processing
- **Business Type:** Restaurant
- **Description:** Process refunds for completed orders
- **Merchant Benefit:** Handle customer complaints, maintain goodwill
- **System Benefit:** Accurate financial records, inventory restoration
- **Connects To:** Order Service, Payment Gateway
- **Status:** Working
- **Issues:** None identified

### POS Offline Mode
- **Business Type:** Restaurant
- **Description:** Continue selling when internet is unavailable, sync when back online
- **Merchant Benefit:** No lost sales during connectivity issues
- **System Benefit:** Queued transactions sync reliably
- **Connects To:** Order Service (with offline queue)
- **Status:** Working
- **Issues:** Queue management critical for reliability

### POS Payment Processing
- **Business Type:** Restaurant
- **Description:** Multi-payment method support including cash, card, UPI, wallets
- **Merchant Benefit:** Accept all payment types customers prefer
- **System Benefit:** Unified payment reconciliation
- **Connects To:** Payment Gateway, Store Analytics
- **Status:** Working
- **Issues:** None identified

---

## Kitchen Display System (KDS)

### KDS Main Display
- **Business Type:** Restaurant
- **Description:** Real-time kitchen order display with timer, status columns (New/Preparing/Ready)
- **Merchant Benefit:** Kitchen efficiency, order tracking, reduced wait times
- **System Benefit:** Order status updates, timing metrics
- **Connects To:** Order Service, WebSocket
- **Status:** Working
- **Issues:** None identified

### KDS Settings
- **Business Type:** Restaurant
- **Description:** Configure KDS behavior, sound alerts, display preferences
- **Merchant Benefit:** Customize kitchen workflow
- **System Benefit:** Stored preferences per store
- **Connects To:** Store Service
- **Status:** Working
- **Issues:** None identified

### KDS REZ Now Orders
- **Business Type:** Restaurant
- **Description:** Dedicated view for web-order incoming through REZ Now
- **Merchant Benefit:** Separate workflow for online orders
- **System Benefit:** Order source tracking
- **Connects To:** WebOrder Service, Order Service
- **Status:** Working
- **Issues:** None identified

---

## Menu Management

### Product Catalog
- **Business Type:** Restaurant
- **Description:** Full product CRUD with categories, variants, images, pricing
- **Merchant Benefit:** Complete control over menu items
- **System Benefit:** Centralized product data
- **Connects To:** Product Service, Inventory Service
- **Status:** Working
- **Issues:** None identified

### Product Add/Edit
- **Business Type:** Restaurant
- **Description:** Forms for adding/editing products with full metadata
- **Merchant Benefit:** Easy product management
- **System Benefit:** Data validation
- **Connects To:** Product Service
- **Status:** Working
- **Issues:** None identified

### Product Bulk Upload
- **Business Type:** Restaurant
- **Description:** Import products via CSV/Excel
- **Merchant Benefit:** Bulk product entry for large menus
- **System Benefit:** Batch processing
- **Connects To:** Product Service, Bulk Import Service
- **Status:** Working
- **Issues:** None identified

### Product Bulk Actions
- **Business Type:** Restaurant
- **Description:** Batch operations on products (status change, category update)
- **Merchant Benefit:** Efficient mass updates
- **System Benefit:** Reduced API calls
- **Connects To:** Product Service
- **Status:** Working
- **Issues:** None identified

### Product Variants
- **Business Type:** Restaurant
- **Description:** Size, color, and custom variants management
- **Merchant Benefit:** Flexible product offerings
- **System Benefit:** Variant-level inventory tracking
- **Connects To:** Product Service
- **Status:** Working
- **Issues:** None identified

### Product Export
- **Business Type:** Restaurant
- **Description:** Export product data to CSV/Excel
- **Merchant Benefit:** Data backup, offline access
- **System Benefit:** Standard export format
- **Connects To:** Export Service
- **Status:** Working
- **Issues:** None identified

### Product Restore
- **Business Type:** Restaurant
- **Description:** Restore previously deleted products
- **Merchant Benefit:** Recover from accidental deletions
- **System Benefit:** Soft-delete with recovery window
- **Connects To:** Product Service
- **Status:** Working
- **Issues:** None identified

### Product Combo/Bundle
- **Business Type:** Restaurant
- **Description:** Create combo meals and bundles from existing products
- **Merchant Benefit:** Upselling, promotional pricing
- **System Benefit:** Bundled pricing logic
- **Connects To:** Product Service, Order Service
- **Status:** Working
- **Issues:** None identified

---

## Category Management

### Category Management
- **Business Type:** Restaurant
- **Description:** Create, edit, organize product categories
- **Merchant Benefit:** Logical menu organization
- **System Benefit:** Category-based filtering and reporting
- **Connects To:** Category Service
- **Status:** Working
- **Issues:** None identified

### Category Organization
- **Business Type:** Restaurant
- **Description:** Drag-and-drop category ordering, nested categories
- **Merchant Benefit:** Visual menu management
- **System Benefit:** Sort order persistence
- **Connects To:** Category Service
- **Status:** Working
- **Issues:** None identified

---

## Table Management

### All Table Bookings
- **Business Type:** Restaurant
- **Description:** View and manage all store reservations
- **Merchant Benefit:** Centralized booking management
- **System Benefit:** Multi-store booking aggregation
- **Connects To:** Booking Service
- **Status:** Working
- **Issues:** None identified

### Dine-In Management
- **Business Type:** Restaurant
- **Description:** Manage dine-in orders, waiter mode, table sessions
- **Merchant Benefit:** Complete dine-in workflow
- **System Benefit:** Table state tracking
- **Connects To:** Order Service, Table Management Service
- **Status:** Working
- **Issues:** None identified

### Waiter Mode
- **Business Type:** Restaurant
- **Description:** Take orders at table using mobile device
- **Merchant Benefit:** Mobility, faster service
- **System Benefit:** Real-time order entry
- **Connects To:** Order Service
- **Status:** Working
- **Issues:** None identified

---

## Food Cost & Recipes

### Food Cost Analytics
- **Business Type:** Restaurant
- **Description:** Track ingredient costs vs selling price
- **Merchant Benefit:** Profit margin visibility
- **System Benefit:** Cost calculation engine
- **Connects To:** Recipe Service, Order Analytics
- **Status:** Working
- **Issues:** None identified

### Recipe Management
- **Business Type:** Restaurant
- **Description:** Create recipes with ingredients and portions
- **Merchant Benefit:** Standardization, cost control
- **System Benefit:** Ingredient-to-product mapping
- **Connects To:** Recipe Service, Inventory Service
- **Status:** Working
- **Issues:** None identified

### Waste Tracking
- **Business Type:** Restaurant
- **Description:** Log food waste for analytics
- **Merchant Benefit:** Identify loss areas, reduce waste
- **System Benefit:** Waste reporting
- **Connects To:** Inventory Service, Analytics
- **Status:** Working
- **Issues:** None identified

---

## Menu Engineering

### Menu Engineering Analysis
- **Business Type:** Restaurant
- **Description:** Analyze menu items by profit and popularity
- **Merchant Benefit:** Data-driven menu decisions
- **System Benefit:** Item classification (stars, plow horses, etc.)
- **Connects To:** Analytics Service
- **Status:** Working
- **Issues:** None identified

---

# RETAIL FEATURES

## Inventory Management

### Inventory Dashboard
- **Business Type:** Retail
- **Description:** Central view of all stock levels with alerts
- **Merchant Benefit:** Real-time stock visibility
- **System Benefit:** Centralized inventory data
- **Connects To:** Inventory Service, Product Service
- **Status:** Working
- **Issues:** None identified

### Inventory Alerts
- **Business Type:** Retail
- **Description:** Low stock and out-of-stock notifications
- **Merchant Benefit:** Proactive restocking
- **System Benefit:** Configurable threshold alerts
- **Connects To:** Notification Service, Inventory Service
- **Status:** Working
- **Issues:** None identified

### Inventory Stock Tracking
- **Business Type:** Retail
- **Description:** Track quantity changes, stock movements
- **Merchant Benefit:** Accurate stock counts
- **System Benefit:** Full audit trail
- **Connects To:** Inventory Service
- **Status:** Working
- **Issues:** None identified

### Product Stock Alerts
- **Business Type:** Retail
- **Description:** Per-product low stock threshold settings
- **Merchant Benefit:** Custom alert levels
- **System Benefit:** Threshold-based notifications
- **Connects To:** Inventory Service
- **Status:** Working
- **Issues:** None identified

### Purchase Orders
- **Business Type:** Retail
- **Description:** Create and manage supplier purchase orders
- **Merchant Benefit:** Restocking workflow
- **System Benefit:** PO tracking, receiving logic
- **Connects To:** Inventory Service, Supplier Service
- **Status:** Working
- **Issues:** None identified

---

## Barcode & SKU Management

### Barcode Scanning
- **Business Type:** Retail
- **Description:** Scan barcodes in POS to find/add products
- **Merchant Benefit:** Fast product lookup
- **System Benefit:** Barcode-to-product mapping
- **Connects To:** Product Service
- **Status:** Working
- **Issues:** None identified

### SKU Management
- **Business Type:** Retail
- **Description:** Assign and manage product SKUs
- **Merchant Benefit:** Internal product identification
- **System Benefit:** SKU-based reporting
- **Connects To:** Product Service
- **Status:** Working
- **Issues:** None identified

---

## Suppliers & Supply Chain

### Supplier Management
- **Business Type:** Retail
- **Description:** Manage supplier contacts and details
- **Merchant Benefit:** Organized vendor relationships
- **System Benefit:** Supplier linkage to purchase orders
- **Connects To:** Supplier Service
- **Status:** Working
- **Issues:** None identified

---

## Customer Credit (Khata)

### Khata (Credit Book)
- **Business Type:** Retail
- **Description:** Track customer credit/dues (common in Indian retail)
- **Merchant Benefit:** Credit management for regular customers
- **System Benefit:** Transaction logging for credit
- **Connects To:** Customer Service, Wallet Service
- **Status:** Working
- **Issues:** None identified

### Khata Customer Management
- **Business Type:** Retail
- **Description:** Add/manage khata customers
- **Merchant Benefit:** Customer credit limits
- **System Benefit:** Credit history tracking
- **Connects To:** Customer Service
- **Status:** Working
- **Issues:** None identified

---

# CROSS-BUSINESS FEATURES

## Authentication & Onboarding

### Merchant Authentication
- **Business Type:** All
- **Description:** Login, register, logout with JWT tokens
- **Merchant Benefit:** Secure access to platform
- **System Benefit:** Authentication infrastructure
- **Connects To:** Auth Service
- **Status:** Working
- **Issues:** None identified

### Multi-Step Onboarding
- **Business Type:** All
- **Description:** Guided merchant setup wizard
- **Merchant Benefit:** Easy platform adoption
- **System Benefit:** Structured data collection
- **Connects To:** Onboarding Service, Store Service
- **Status:** Working
- **Issues:** None identified

### REZ Now Setup
- **Business Type:** All
- **Description:** Configure REZ Now digital presence
- **Merchant Benefit:** Online ordering setup
- **System Benefit:** REZ Now integration
- **Connects To:** REZ Now Service
- **Status:** Working
- **Issues:** None identified

---

## Dashboard & Analytics

### Main Dashboard
- **Business Type:** All
- **Description:** Overview metrics - revenue, orders, customers, cashback
- **Merchant Benefit:** At-a-glance business health
- **System Benefit:** Real-time metric aggregation
- **Connects To:** Analytics Service, Store Analytics
- **Status:** Working
- **Issues:** Large file size (115KB) - consider splitting

### Analytics Dashboard
- **Business Type:** All
- **Description:** Comprehensive analytics with charts
- **Merchant Benefit:** Business performance insights
- **System Benefit:** Data visualization
- **Connects To:** Analytics Service
- **Status:** Working
- **Issues:** None identified

### Sales Analytics
- **Business Type:** All
- **Description:** Sales trends and patterns
- **Merchant Benefit:** Understand sales cycles
- **System Benefit:** Trend calculation
- **Connects To:** Analytics Service
- **Status:** Working
- **Issues:** None identified

### Revenue Analytics
- **Business Type:** All
- **Description:** Revenue breakdown and trends
- **Merchant Benefit:** Revenue insights
- **System Benefit:** Revenue aggregation
- **Connects To:** Store Analytics
- **Status:** Working
- **Issues:** None identified

### Customer Analytics
- **Business Type:** All
- **Description:** Customer behavior, segmentation, LTV
- **Merchant Benefit:** Customer insights
- **System Benefit:** Segmentation engine
- **Connects To:** Customer Insights Service
- **Status:** Working
- **Issues:** None identified

### Churn Risk Analysis
- **Business Type:** All
- **Description:** Identify customers at risk of leaving
- **Merchant Benefit:** Proactive retention
- **System Benefit:** Risk scoring
- **Connects To:** Customer Analytics
- **Status:** Working
- **Issues:** None identified

### LTV Segments
- **Business Type:** All
- **Description:** Customer lifetime value segmentation
- **Merchant Benefit:** Priority customers
- **System Benefit:** LTV calculation
- **Connects To:** Customer Analytics
- **Status:** Working
- **Issues:** None identified

### NPS Tracking
- **Business Type:** All
- **Description:** Net Promoter Score monitoring
- **Merchant Benefit:** Customer satisfaction metrics
- **System Benefit:** NPS calculation
- **Connects To:** Feedback Service
- **Status:** Working
- **Issues:** None identified

### Peak Hours Analysis
- **Business Type:** All
- **Description:** Identify busy periods
- **Merchant Benefit:** Staffing optimization
- **System Benefit:** Time-based aggregation
- **Connects To:** Store Analytics
- **Status:** Working
- **Issues:** None identified

### Growth Analytics
- **Business Type:** All
- **Description:** Growth trends and projections
- **Merchant Benefit:** Business trajectory
- **System Benefit:** Trend analysis
- **Connects To:** Analytics Service
- **Status:** Working
- **Issues:** None identified

### Comparison Analytics
- **Business Type:** All
- **Description:** Compare performance across stores/time periods
- **Merchant Benefit:** Benchmarking
- **System Benefit:** Multi-dimension comparison
- **Connects To:** Analytics Service
- **Status:** Working
- **Issues:** None identified

### Store Comparison
- **Business Type:** All
- **Description:** Multi-store performance comparison
- **Merchant Benefit:** Identify top/bottom performers
- **System Benefit:** Store-level aggregation
- **Connects To:** Store Analytics
- **Status:** Working
- **Issues:** None identified

### Trends Analysis
- **Business Type:** All
- **Description:** Historical trend analysis
- **Merchant Benefit:** Long-term insights
- **System Benefit:** Time-series data
- **Connects To:** Analytics Service
- **Status:** Working
- **Issues:** None identified

### Cohort Analysis
- **Business Type:** All
- **Description:** Customer cohort performance
- **Merchant Benefit:** Acquisition quality metrics
- **System Benefit:** Cohort grouping
- **Connects To:** Customer Analytics
- **Status:** Working
- **Issues:** None identified

### Sales Forecast
- **Business Type:** All
- **Description:** AI-powered sales predictions
- **Merchant Benefit:** Demand planning
- **System Benefit:** ML forecasting
- **Connects To:** ML Service, Analytics
- **Status:** Working
- **Issues:** None identified

### Demand Forecast
- **Business Type:** All
- **Description:** Product demand predictions
- **Merchant Benefit:** Inventory planning
- **System Benefit:** Demand modeling
- **Connects To:** ML Service, Inventory
- **Status:** Working
- **Issues:** None identified

### Pricing Suggestions
- **Business Type:** All
- **Description:** AI-driven price optimization
- **Merchant Benefit:** Maximize revenue/profit
- **System Benefit:** Price elasticity analysis
- **Connects To:** Pricing Service
- **Status:** Working
- **Issues:** None identified

### REZ Summary
- **Business Type:** All
- **Description:** AI-generated business summary
- **Merchant Benefit:** Quick insights
- **System Benefit:** NLP summary generation
- **Connects To:** AI Service
- **Status:** Working
- **Issues:** None identified

### Web Feedback Analytics
- **Business Type:** All
- **Description:** Customer feedback from web orders
- **Merchant Benefit:** Voice of customer
- **System Benefit:** Feedback aggregation
- **Connects To:** Feedback Service
- **Status:** Working
- **Issues:** None identified

### Inventory Analytics
- **Business Type:** All
- **Description:** Inventory performance metrics
- **Merchant Benefit:** Stock efficiency
- **System Benefit:** Inventory metrics
- **Connects To:** Inventory Analytics
- **Status:** Working
- **Issues:** None identified

### Expense Tracking
- **Business Type:** All
- **Description:** Track business expenses
- **Merchant Benefit:** Financial management
- **System Benefit:** Expense logging
- **Connects To:** Expense Service
- **Status:** Working
- **Issues:** None identified

### P&L (Profit & Loss)
- **Business Type:** All
- **Description:** Profit and loss statement
- **Merchant Benefit:** Financial health
- **System Benefit:** P&L calculation
- **Connects To:** Finance Service
- **Status:** Working
- **Issues:** None identified

### Food Cost Analytics
- **Business Type:** Restaurant
- **Description:** Ingredient cost tracking
- **Merchant Benefit:** Cost control
- **System Benefit:** Cost calculation
- **Connects To:** Recipe Service
- **Status:** Working
- **Issues:** None identified

### Demand Signals
- **Business Type:** All
- **Description:** Market demand indicators
- **Merchant Benefit:** Market intelligence
- **System Benefit:** Signal aggregation
- **Connects To:** Intelligence Service
- **Status:** Working
- **Issues:** None identified

---

## Orders Management

### Orders List
- **Business Type:** All
- **Description:** View and manage all orders
- **Merchant Benefit:** Order overview
- **System Benefit:** Order aggregation
- **Connects To:** Order Service
- **Status:** Working
- **Issues:** None identified

### Order Detail
- **Business Type:** All
- **Description:** Individual order view with status updates
- **Merchant Benefit:** Order handling
- **System Benefit:** Order state management
- **Connects To:** Order Service
- **Status:** Working
- **Issues:** None identified

### Order Live Tracking
- **Business Type:** All
- **Description:** Real-time order updates
- **Merchant Benefit:** Live order monitoring
- **System Benefit:** WebSocket updates
- **Connects To:** Order Service, WebSocket
- **Status:** Working
- **Issues:** None identified

### Order Analytics
- **Business Type:** All
- **Description:** Order metrics and trends
- **Merchant Benefit:** Order insights
- **System Benefit:** Order aggregation
- **Connects To:** Order Analytics
- **Status:** Working
- **Issues:** None identified

### Web Orders (REZ Now)
- **Business Type:** All
- **Description:** Orders from REZ Now platform
- **Merchant Benefit:** Online order management
- **System Benefit:** Channel aggregation
- **Connects To:** WebOrder Service
- **Status:** Working
- **Issues:** None identified

### Aggregator Orders
- **Business Type:** Restaurant
- **Description:** Orders from Swiggy, Zomato, etc.
- **Merchant Benefit:** Multi-platform management
- **System Benefit:** Aggregator integration
- **Connects To:** Aggregator Service
- **Status:** Working
- **Issues:** None identified

### Group Orders
- **Business Type:** Restaurant
- **Description:** Collaborative ordering (split bills)
- **Merchant Benefit:** Customer convenience
- **System Benefit:** Split calculation
- **Connects To:** Order Service
- **Status:** Working
- **Issues:** None identified

---

## Customer Management

### Customer List
- **Business Type:** All
- **Description:** View all customers
- **Merchant Benefit:** Customer database
- **System Benefit:** Customer aggregation
- **Connects To:** Customer Service
- **Status:** Working
- **Issues:** None identified

### Customer Details
- **Business Type:** All
- **Description:** Individual customer profile
- **Merchant Benefit:** Customer history
- **System Benefit:** Customer data
- **Connects To:** Customer Service
- **Status:** Working
- **Issues:** None identified

### Visits Tracking
- **Business Type:** All
- **Description:** Track customer visits
- **Merchant Benefit:** Engagement tracking
- **System Benefit:** Visit logging
- **Connects To:** Store Visit Service
- **Status:** Working
- **Issues:** None identified

---

## Promotions & Campaigns

### Deals Management
- **Business Type:** All
- **Description:** Create and manage deals
- **Merchant Benefit:** Promotional tools
- **System Benefit:** Deal logic
- **Connects To:** Deal Service
- **Status:** Working
- **Issues:** None identified

### Discount Builder
- **Business Type:** All
- **Description:** Visual discount creation
- **Merchant Benefit:** Easy discount setup
- **System Benefit:** Discount calculation
- **Connects To:** Discount Service
- **Status:** Working
- **Issues:** None identified

### Campaign ROI
- **Business Type:** All
- **Description:** Campaign return on investment tracking
- **Merchant Benefit:** Campaign effectiveness
- **System Benefit:** Attribution tracking
- **Connects To:** Campaign Analytics
- **Status:** Working
- **Issues:** None identified

### Campaign Simulator
- **Business Type:** All
- **Description:** Predict campaign outcomes before launch
- **Merchant Benefit:** Risk-free planning
- **System Benefit:** Simulation engine
- **Connects To:** Campaign Service
- **Status:** Working
- **Issues:** None identified

### Campaign Rules
- **Business Type:** All
- **Description:** Define campaign eligibility rules
- **Merchant Benefit:** Targeted promotions
- **System Benefit:** Rule engine
- **Connects To:** Campaign Service
- **Status:** Working
- **Issues:** None identified

### Campaign Recommendations
- **Business Type:** All
- **Description:** AI suggestions for campaigns
- **Merchant Benefit:** Best practices
- **System Benefit:** ML recommendations
- **Connects To:** AI Service
- **Status:** Working
- **Issues:** None identified

### Bonus Campaigns
- **Business Type:** All
- **Description:** Bonus offers for customers
- **Merchant Benefit:** Engagement boost
- **System Benefit:** Bonus calculation
- **Connects To:** Campaign Service
- **Status:** Working
- **Issues:** None identified

### TRY Trials
- **Business Type:** All
- **Description:** Trial offers for new customers
- **Merchant Benefit:** Acquisition
- **System Benefit:** Trial tracking
- **Connects To:** Trial Service
- **Status:** Working
- **Issues:** None identified

### Create Offer
- **Business Type:** All
- **Description:** Quick offer creation
- **Merchant Benefit:** Fast promotion launch
- **System Benefit:** Offer management
- **Connects To:** Offer Service
- **Status:** Working
- **Issues:** None identified

### Post-Purchase Rules
- **Business Type:** All
- **Description:** Automation after purchase
- **Merchant Benefit:** Automated engagement
- **System Benefit:** Trigger engine
- **Connects To:** Automation Service
- **Status:** Working
- **Issues:** None identified

### Growth Tools
- **Business Type:** All
- **Description:** Growth marketing tools
- **Merchant Benefit:** Growth tactics
- **System Benefit:** Growth tracking
- **Connects To:** Growth Service
- **Status:** Working
- **Issues:** None identified

### Offer Performance
- **Business Type:** All
- **Description:** Track offer effectiveness
- **Merchant Benefit:** ROI measurement
- **System Benefit:** Performance analytics
- **Connects To:** Offer Analytics
- **Status:** Working
- **Issues:** None identified

---

## Loyalty & Rewards

### Loyalty Program
- **Business Type:** All
- **Description:** Points-based loyalty system
- **Merchant Benefit:** Customer retention
- **System Benefit:** Points engine
- **Connects To:** Loyalty Service
- **Status:** Working
- **Issues:** None identified

### Punch Cards
- **Business Type:** Retail
- **Description:** Stamp-based loyalty (e.g., 10th coffee free)
- **Merchant Benefit:** Simple loyalty
- **System Benefit:** Stamp tracking
- **Connects To:** Loyalty Service
- **Status:** Working
- **Issues:** None identified

### Stamp Cards
- **Business Type:** All
- **Description:** Digital stamp collection
- **Merchant Benefit:** Visual loyalty
- **System Benefit:** Stamp engine
- **Connects To:** Loyalty Service
- **Status:** Working
- **Issues:** None identified

### Loyalty Settings
- **Business Type:** All
- **Description:** Configure loyalty program
- **Merchant Benefit:** Customization
- **System Benefit:** Config management
- **Connects To:** Loyalty Service
- **Status:** Working
- **Issues:** None identified

### Cashback Management
- **Business Type:** All
- **Description:** Cashback transactions and reconciliation
- **Merchant Benefit:** Customer incentive
- **System Benefit:** Cashback calculation
- **Connects To:** Cashback Service
- **Status:** Working
- **Issues:** None identified

### Coins/Rewards
- **Business Type:** All
- **Description:** Coin-based reward system
- **Merchant Benefit:** Gamification
- **System Benefit:** Coin ledger
- **Connects To:** Coin Service
- **Status:** Working
- **Issues:** None identified

### Gift Cards
- **Business Type:** All
- **Description:** Digital gift card management
- **Merchant Benefit:** Additional revenue
- **System Benefit:** Gift card engine
- **Connects To:** Gift Card Service
- **Status:** Working
- **Issues:** None identified

---

## Payments & Finance

### Wallet Management
- **Business Type:** All
- **Description:** Merchant wallet for transactions
- **Merchant Benefit:** Financial overview
- **System Benefit:** Balance tracking
- **Connects To:** Wallet Service
- **Status:** Working
- **Issues:** None identified

### Payments Management
- **Business Type:** All
- **Description:** Payment method settings
- **Merchant Benefit:** Payment configuration
- **System Benefit:** Payment aggregation
- **Connects To:** Payment Service
- **Status:** Working
- **Issues:** None identified

### Settlements
- **Business Type:** All
- **Description:** Payout reconciliation
- **Merchant Benefit:** Payment clarity
- **System Benefit:** Settlement processing
- **Connects To:** Settlement Service
- **Status:** Working
- **Issues:** None identified

### Payouts
- **Business Type:** All
- **Description:** Withdrawal management
- **Merchant Benefit:** Fund access
- **System Benefit:** Payout processing
- **Connects To:** Payout Service
- **Status:** Working
- **Issues:** None identified

### ReZ Capital
- **Business Type:** All
- **Description:** Business financing options
- **Merchant Benefit:** Working capital
- **System Benefit:** Finance integration
- **Connects To:** Capital Service
- **Status:** Working
- **Issues:** None identified

---

## Team Management

### Team Overview
- **Business Type:** All
- **Description:** View all team members
- **Merchant Benefit:** Team visibility
- **System Benefit:** Member aggregation
- **Connects To:** Team Service
- **Status:** Working
- **Issues:** None identified

### Team Member Detail
- **Business Type:** All
- **Description:** Individual team member profile
- **Merchant Benefit:** Performance tracking
- **System Benefit:** Member data
- **Connects To:** Team Service
- **Status:** Working
- **Issues:** None identified

### Team Invitations
- **Business Type:** All
- **Description:** Invite new team members
- **Merchant Benefit:** Team growth
- **System Benefit:** Invite workflow
- **Connects To:** Team Service, Auth Service
- **Status:** Working
- **Issues:** None identified

### Role Management
- **Business Type:** All
- **Description:** Define roles (owner, manager, staff)
- **Merchant Benefit:** Clear hierarchy
- **System Benefit:** Role-based access
- **Connects To:** RBAC Service
- **Status:** Working
- **Issues:** None identified

### Permissions Management
- **Business Type:** All
- **Description:** Granular permission control
- **Merchant Benefit:** Security
- **System Benefit:** Permission engine
- **Connects To:** RBAC Service
- **Status:** Working
- **Issues:** None identified

### Staff Clock In/Out
- **Business Type:** All
- **Description:** Staff attendance tracking
- **Merchant Benefit:** Time tracking
- **System Benefit:** Clock records
- **Connects To:** Attendance Service
- **Status:** Working
- **Issues:** None identified

### Staff Timesheets
- **Business Type:** All
- **Description:** Weekly/monthly time reports
- **Merchant Benefit:** Payroll data
- **System Benefit:** Time aggregation
- **Connects To:** Payroll Service
- **Status:** Working
- **Issues:** None identified

### Staff Commissions
- **Business Type:** All
- **Description:** Track staff commissions
- **Merchant Benefit:** Incentive management
- **System Benefit:** Commission calculation
- **Connects To:** Payroll Service
- **Status:** Working
- **Issues:** None identified

### Staff Shifts
- **Business Type:** All
- **Description:** Shift scheduling
- **Merchant Benefit:** Scheduling
- **System Benefit:** Shift management
- **Connects To:** Shift Service
- **Status:** Working
- **Issues:** None identified

### Staff Activity
- **Business Type:** All
- **Description:** Staff activity logs
- **Merchant Benefit:** Accountability
- **System Benefit:** Activity tracking
- **Connects To:** Audit Service
- **Status:** Working
- **Issues:** None identified

### Rota Planning
- **Business Type:** All
- **Description:** Staff rotation planning
- **Merchant Benefit:** Workforce management
- **System Benefit:** Rotation logic
- **Connects To:** Shift Service
- **Status:** Working
- **Issues:** None identified

---

## Store Management

### Store List
- **Business Type:** All
- **Description:** View all store locations
- **Merchant Benefit:** Multi-location overview
- **System Benefit:** Store aggregation
- **Connects To:** Store Service
- **Status:** Working
- **Issues:** None identified

### Add/Edit Store
- **Business Type:** All
- **Description:** Store configuration
- **Merchant Benefit:** Setup stores
- **System Benefit:** Store data
- **Connects To:** Store Service
- **Status:** Working
- **Issues:** None identified

### Store Locations
- **Business Type:** All
- **Description:** Geographic store info
- **Merchant Benefit:** Location management
- **System Benefit:** Geo data
- **Connects To:** Store Service
- **Status:** Working
- **Issues:** None identified

### Business Hours
- **Business Type:** All
- **Description:** Set operating hours per day
- **Merchant Benefit:** Time management
- **System Benefit:** Hour storage
- **Connects To:** Store Service
- **Status:** Working
- **Issues:** None identified

### Social Booking
- **Business Type:** Restaurant
- **Description:** Booking via social media
- **Merchant Benefit:** Social reach
- **System Benefit:** Channel integration
- **Connects To:** Booking Service
- **Status:** Working
- **Issues:** None identified

---

## QR & Digital Presence

### QR Code Generator
- **Business Type:** All
- **Description:** Generate QR codes for menu/products/tables
- **Merchant Benefit:** Digital touchpoints
- **System Benefit:** QR generation
- **Connects To:** QR Service
- **Status:** Working
- **Issues:** None identified

### QR Hub
- **Business Type:** All
- **Description:** Central QR management
- **Merchant Benefit:** QR overview
- **System Benefit:** QR tracking
- **Connects To:** QR Service
- **Status:** Working
- **Issues:** None identified

### REZ Now Configuration
- **Business Type:** All
- **Description:** Configure REZ Now online presence
- **Merchant Benefit:** Online ordering
- **System Benefit:** REZ Now sync
- **Connects To:** REZ Now Service
- **Status:** Working
- **Issues:** None identified

### Hotel OTA Integration
- **Business Type:** Hospitality
- **Description:** Connect with hotel OTAs
- **Merchant Benefit:** Channel management
- **System Benefit:** OTA sync
- **Connects To:** OTA Service
- **Status:** Working
- **Issues:** None identified

---

## Notifications & Communication

### Notification Center
- **Business Type:** All
- **Description:** All merchant notifications
- **Merchant Benefit:** Central inbox
- **System Benefit:** Notification aggregation
- **Connects To:** Notification Service
- **Status:** Working
- **Issues:** None identified

### Push Notifications
- **Business Type:** All
- **Description:** Customer push notification sender
- **Merchant Benefit:** Direct communication
- **System Benefit:** Push infrastructure
- **Connects To:** Push Service
- **Status:** Working
- **Issues:** None identified

### Broadcast Messages
- **Business Type:** All
- **Description:** Send bulk messages to customers
- **Merchant Benefit:** Mass outreach
- **System Benefit:** Broadcast engine
- **Connects To:** Broadcast Service
- **Status:** Working
- **Issues:** None identified

### Customer Messages
- **Business Type:** All
- **Description:** Direct customer communication
- **Merchant Benefit:** Engagement
- **System Benefit:** Message delivery
- **Connects To:** Messaging Service
- **Status:** Working
- **Issues:** None identified

---

## AI Copilot

### AI Copilot Dashboard
- **Business Type:** All
- **Description:** AI-powered business assistant
- **Merchant Benefit:** Smart recommendations
- **System Benefit:** AI inference
- **Connects To:** Copilot Service
- **Status:** Working
- **Issues:** None identified

### Health Score
- **Business Type:** All
- **Description:** Overall business health calculation
- **Merchant Benefit:** Quick health check
- **System Benefit:** Multi-metric scoring
- **Connects To:** Health Scorer Service
- **Status:** Working
- **Issues:** None identified

### AI Recommendations
- **Business Type:** All
- **Description:** Actionable AI suggestions
- **Merchant Benefit:** Best actions
- **System Benefit:** ML recommendations
- **Connects To:** Recommendation Engine
- **Status:** Working
- **Issues:** None identified

### Competitor Analysis
- **Business Type:** All
- **Description:** Competitive intelligence
- **Merchant Benefit:** Market position
- **System Benefit:** Competitor data
- **Connects To:** Competitor Analyzer
- **Status:** Working
- **Issues:** None identified

### Decision Engine
- **Business Type:** All
- **Description:** AI-driven operational decisions
- **Merchant Benefit:** Automated decisions
- **System Benefit:** Decision logic
- **Connects To:** Decision Engine
- **Status:** Working
- **Issues:** None identified

### Merchant Insights
- **Business Type:** All
- **Description:** Business intelligence summary
- **Merchant Benefit:** Smart insights
- **System Benefit:** Data synthesis
- **Connects To:** Intelligence Service
- **Status:** Working
- **Issues:** None identified

### Empty Slots Detection
- **Business Type:** Restaurant
- **Description:** Find slow time slots for promotions
- **Merchant Benefit:** Fill gaps
- **System Benefit:** Pattern detection
- **Connects To:** Intelligence Service
- **Status:** Working
- **Issues:** None identified

### Merchant Profile
- **Business Type:** All
- **Description:** Merchant data with AI metrics
- **Merchant Benefit:** Comprehensive view
- **System Benefit:** Profile aggregation
- **Connects To:** Profile Service
- **Status:** Working
- **Issues:** None identified

---

## Marketing & Ads

### Ads Manager
- **Business Type:** All
- **Description:** Create and manage ads
- **Merchant Benefit:** Advertising platform
- **System Benefit:** Ad serving
- **Connects To:** Ad Service
- **Status:** Working
- **Issues:** None identified

### Marketing Templates
- **Business Type:** All
- **Description:** Pre-built marketing templates
- **Merchant Benefit:** Easy creation
- **System Benefit:** Template library
- **Connects To:** Marketing Service
- **Status:** Working
- **Issues:** None identified

### Promotion Toolkit
- **Business Type:** All
- **Description:** Comprehensive promotion tools
- **Merchant Benefit:** Full arsenal
- **System Benefit:** Tool aggregation
- **Connects To:** Marketing Service
- **Status:** Working
- **Issues:** None identified

### Promote/Advertising
- **Business Type:** All
- **Description:** Ad promotion interface
- **Merchant Benefit:** Ad management
- **System Benefit:** Promotion system
- **Connects To:** Ad Service
- **Status:** Working
- **Issues:** None identified

---

## CRM & Support

### CRM Dashboard
- **Business Type:** All
- **Description:** Customer relationship management
- **Merchant Benefit:** Customer insights
- **System Benefit:** CRM data
- **Connects To:** CRM Service
- **Status:** Working
- **Issues:** None identified

### Support Tickets
- **Business Type:** All
- **Description:** Issue tracking
- **Merchant Benefit:** Resolution workflow
- **System Benefit:** Ticket system
- **Connects To:** Support Service
- **Status:** Working
- **Issues:** None identified

---

## Settings & Configuration

### Settings Index
- **Business Type:** All
- **Description:** Central settings hub
- **Merchant Benefit:** Configuration
- **System Benefit:** Settings storage
- **Connects To:** Settings Service
- **Status:** Working
- **Issues:** None identified

### Merchant Profile Settings
- **Business Type:** All
- **Description:** Profile configuration
- **Merchant Benefit:** Identity management
- **System Benefit:** Profile data
- **Connects To:** Profile Service
- **Status:** Working
- **Issues:** None identified

### Printer Settings
- **Business Type:** All
- **Description:** Receipt/kitchen printer config
- **Merchant Benefit:** Printing setup
- **System Benefit:** Printer management
- **Connects To:** Printer Service
- **Status:** Working
- **Issues:** None identified

### Notification Settings
- **Business Type:** All
- **Description:** Configure notifications
- **Merchant Benefit:** Control alerts
- **System Benefit:** Preference storage
- **Connects To:** Notification Service
- **Status:** Working
- **Issues:** None identified

### Cancellation Policy
- **Business Type:** All
- **Description:** Define cancellation rules
- **Merchant Benefit:** Policy setting
- **System Benefit:** Policy enforcement
- **Connects To:** Policy Service
- **Status:** Working
- **Issues:** None identified

### Calendar Sync
- **Business Type:** All
- **Description:** Sync with external calendars
- **Merchant Benefit:** Unified scheduling
- **System Benefit:** Calendar integration
- **Connects To:** Calendar Service
- **Status:** Working
- **Issues:** None identified

### Feature Flags
- **Business Type:** All
- **Description:** Enable/disable features
- **Merchant Benefit:** Gradual rollout
- **System Benefit:** Feature management
- **Connects To:** Feature Flag Service
- **Status:** Working
- **Issues:** None identified

### System Status
- **Business Type:** All
- **Description:** Service health monitor
- **Merchant Benefit:** Transparency
- **System Benefit:** Health tracking
- **Connects To:** Health Service
- **Status:** Working
- **Issues:** None identified

### Moderation Status
- **Business Type:** All
- **Description:** Content moderation view
- **Merchant Benefit:** Moderation visibility
- **System Benefit:** Moderation data
- **Connects To:** Moderation Service
- **Status:** Working
- **Issues:** None identified

### About/Meta Settings
- **Business Type:** All
- **Description:** App info and legal
- **Merchant Benefit:** Information access
- **System Benefit:** Static content
- **Connects To:** Static Service
- **Status:** Working
- **Issues:** None identified

---

## Integrations

### Integrations Hub
- **Business Type:** All
- **Description:** Third-party integrations
- **Merchant Benefit:** Ecosystem access
- **System Benefit:** Integration management
- **Connects To:** Integration Service
- **Status:** Working
- **Issues:** None identified

### Store Links
- **Business Type:** All
- **Description:** Link online presence to store
- **Merchant Benefit:** Online visibility
- **System Benefit:** Link management
- **Connects To:** Store Link Service
- **Status:** Working
- **Issues:** None identified

### API Integrations
- **Business Type:** All
- **Description:** API key management
- **Merchant Benefit:** Developer access
- **System Benefit:** API management
- **Connects To:** API Service
- **Status:** Working
- **Issues:** None identified

---

## Documents & Reports

### Reports & Exports
- **Business Type:** All
- **Description:** Generate and export reports
- **Merchant Benefit:** Data access
- **System Benefit:** Report generation
- **Connects To:** Report Service
- **Status:** Working
- **Issues:** None identified

### Audit Logs
- **Business Type:** All
- **Description:** Activity audit trail
- **Merchant Benefit:** Security visibility
- **System Benefit:** Compliance logging
- **Connects To:** Audit Service
- **Status:** Working
- **Issues:** None identified

### Documents
- **Business Type:** All
- **Description:** Business document management
- **Merchant Benefit:** Document storage
- **System Benefit:** Document management
- **Connects To:** Document Service
- **Status:** Working
- **Issues:** None identified

### Tally Export
- **Business Type:** All
- **Description:** Export to Tally accounting
- **Merchant Benefit:** Accounting sync
- **System Benefit:** Tally integration
- **Connects To:** Tally Service
- **Status:** Working
- **Issues:** None identified

### Analytics Export
- **Business Type:** All
- **Description:** Export analytics data
- **Merchant Benefit:** Data portability
- **System Benefit:** Export engine
- **Connects To:** Analytics Export
- **Status:** Working
- **Issues:** None identified

---

## Corporate & Enterprise

### Corporate Dashboard
- **Business Type:** All
- **Description:** Enterprise management view
- **Merchant Benefit:** Central control
- **System Benefit:** Multi-merchant view
- **Connects To:** Corporate Service
- **Status:** Working
- **Issues:** None identified

### Business Documents (BizDocs)
- **Business Type:** All
- **Description:** Business document templates
- **Merchant Benefit:** Formal documents
- **System Benefit:** Template system
- **Connects To:** BizDoc Service
- **Status:** Working
- **Issues:** None identified

---

## Dynamic Pricing

### Dynamic Pricing Engine
- **Business Type:** All
- **Description:** Automated price adjustments
- **Merchant Benefit:** Optimized pricing
- **System Benefit:** Price rules
- **Connects To:** Pricing Service
- **Status:** Working
- **Issues:** None identified

---

## Subscriptions

### Subscription Plans
- **Business Type:** All
- **Description:** View available subscription tiers
- **Merchant Benefit:** Upgrade options
- **System Benefit:** Plan management
- **Connects To:** Subscription Service
- **Status:** Working
- **Issues:** None identified

### Subscription Management
- **Business Type:** All
- **Description:** Manage current subscription
- **Merchant Benefit:** Plan control
- **System Benefit:** Subscription tracking
- **Connects To:** Subscription Service
- **Status:** Working
- **Issues:** None identified

---

## Additional Services

### Appointments
- **Business Type:** Services
- **Description:** Appointment booking
- **Merchant Benefit:** Scheduling
- **System Benefit:** Booking engine
- **Connects To:** Appointment Service
- **Status:** Working
- **Issues:** None identified

### Class Schedule
- **Business Type:** Fitness/Classes
- **Description:** Class scheduling
- **Merchant Benefit:** Class management
- **System Benefit:** Schedule engine
- **Connects To:** Class Service
- **Status:** Working
- **Issues:** None identified

### Consultation Forms
- **Business Type:** Services
- **Description:** Intake form builder
- **Merchant Benefit:** Lead capture
- **System Benefit:** Form engine
- **Connects To:** Form Service
- **Status:** Working
- **Issues:** None identified

### Events Management
- **Business Type:** Events
- **Description:** Event creation and tracking
- **Merchant Benefit:** Event hosting
- **System Benefit:** Event system
- **Connects To:** Event Service
- **Status:** Working
- **Issues:** None identified

### Treatment Rooms
- **Business Type:** Spa/Salon
- **Description:** Room management
- **Merchant Benefit:** Resource planning
- **System Benefit:** Room tracking
- **Connects To:** Room Service
- **Status:** Working
- **Issues:** None identified

### Service Packages
- **Business Type:** Services
- **Description:** Bundled services
- **Merchant Benefit:** Package deals
- **System Benefit:** Package engine
- **Connects To:** Package Service
- **Status:** Working
- **Issues:** None identified

### Disputes
- **Business Type:** All
- **Description:** Handle payment/order disputes
- **Merchant Benefit:** Resolution workflow
- **System Benefit:** Dispute tracking
- **Connects To:** Dispute Service
- **Status:** Working
- **Issues:** None identified

### Fraud Detection
- **Business Type:** All
- **Description:** Fraud pattern detection
- **Merchant Benefit:** Security
- **System Benefit:** Fraud scoring
- **Connects To:** Fraud Service
- **Status:** Working
- **Issues:** None identified

### Liabilities
- **Business Type:** All
- **Description:** Track merchant liabilities
- **Merchant Benefit:** Financial clarity
- **System Benefit:** Liability tracking
- **Connects To:** Liability Service
- **Status:** Working
- **Issues:** None identified

### Goals
- **Business Type:** All
- **Description:** Set and track business goals
- **Merchant Benefit:** Target setting
- **System Benefit:** Goal tracking
- **Connects To:** Goal Service
- **Status:** Working
- **Issues:** None identified

### Upsell Rules
- **Business Type:** All
- **Description:** Configure upsell triggers
- **Merchant Benefit:** Revenue boost
- **System Benefit:** Upsell engine
- **Connects To:** Upsell Service
- **Status:** Working
- **Issues:** None identified

### Automation Rules
- **Business Type:** All
- **Description:** Workflow automation
- **Merchant Benefit:** Efficiency
- **System Benefit:** Automation engine
- **Connects To:** Automation Service
- **Status:** Working
- **Issues:** None identified

### Social Media
- **Business Type:** All
- **Description:** Social media management
- **Merchant Benefit:** Content publishing
- **System Benefit:** Social integration
- **Connects To:** Social Service
- **Status:** Working
- **Issues:** None identified

### Videos
- **Business Type:** All
- **Description:** Video content management
- **Merchant Benefit:** Video marketing
- **System Benefit:** Video hosting
- **Connects To:** Video Service
- **Status:** Working
- **Issues:** None identified

### Gallery Management
- **Business Type:** All
- **Description:** Store image gallery
- **Merchant Benefit:** Visual appeal
- **System Benefit:** Gallery storage
- **Connects To:** Gallery Service
- **Status:** Working
- **Issues:** None identified

### Brand Management
- **Business Type:** All
- **Description:** Brand identity configuration
- **Merchant Benefit:** Branding
- **System Benefit:** Brand assets
- **Connects To:** Brand Service
- **Status:** Working
- **Issues:** None identified

### Loyalty Tiers
- **Business Type:** All
- **Description:** Tiered loyalty levels
- **Merchant Benefit:** VIP treatment
- **System Benefit:** Tier logic
- **Connects To:** Loyalty Service
- **Status:** Working
- **Issues:** None identified

### Karma/Perks
- **Business Type:** All
- **Description:** Karma points and perks system
- **Merchant Benefit:** Engagement
- **System Benefit:** Karma engine
- **Connects To:** Karma Service
- **Status:** Working
- **Issues:** None identified

### Private Membership
- **Business Type:** All
- **Description:** Exclusive membership tier
- **Merchant Benefit:** Premium access
- **System Benefit:** Membership logic
- **Connects To:** Membership Service
- **Status:** Working
- **Issues:** None identified

### Channel Manager
- **Business Type:** All
- **Description:** Multi-channel management
- **Merchant Benefit:** Channel control
- **System Benefit:** Channel sync
- **Connects To:** Channel Service
- **Status:** Working
- **Issues:** None identified

### ReZ Capital Offers
- **Business Type:** All
- **Description:** Financing offers display
- **Merchant Benefit:** Capital access
- **System Benefit:** Offer management
- **Connects To:** Capital Service
- **Status:** Working
- **Issues:** None identified

---

## SUMMARY

### Feature Counts by Category

| Category | Features |
|----------|----------|
| POS & Restaurant | 15 |
| Menu Management | 8 |
| Kitchen Display | 3 |
| Retail Inventory | 6 |
| Orders | 7 |
| Analytics | 26 |
| Loyalty & Rewards | 7 |
| Team Management | 11 |
| Marketing | 10 |
| Payments | 5 |
| AI Copilot | 9 |
| Settings | 10 |
| Integrations | 3 |
| Other Services | 20+ |
| **TOTAL** | **150+** |

### Business Type Distribution

| Business Type | Primary Features |
|---------------|------------------|
| **Restaurant** | POS, KDS, Menu, Dine-in, Waiter Mode, Food Cost, Aggregator Orders |
| **Retail** | Inventory, Barcode, SKU, Purchase Orders, Suppliers, Khata |
| **Services** | Appointments, Class Schedule, Treatment Rooms, Consultation Forms |
| **All** | Dashboard, Orders, Team, Marketing, Payments, AI Copilot, CRM |

### Architecture Overview

```
rez-app-merchant (React Native)
├── POS System
├── KDS (Kitchen Display)
├── Order Management
├── Product Management
├── Analytics Dashboard
├── AI Copilot Integration
├── Team Management
└── Settings

rez-merchant-service (Node.js Backend)
├── Products Service
├── Orders Service
├── Inventory Service
├── Customer Service
├── Analytics Service
├── Loyalty Service
├── Campaign Service
└── 80+ Data Models

REZ-merchant-copilot (AI Service)
├── Health Score Engine
├── Recommendation Engine
├── Competitor Analyzer
├── Decision Engine
└── Live Data Integration
```

### Key Integrations

| Service | Connection |
|---------|------------|
| Order Service | POS, KDS, Analytics |
| Product Service | POS, Inventory, Analytics |
| Customer Service | Orders, Loyalty, CRM |
| Notification Service | All features requiring alerts |
| Payment Gateway | POS, Settlements |
| WebSocket | KDS, Live Updates |
| ML Service | Forecasts, Recommendations |

---

*Document generated: 2026-05-05*
*Source: rez-app-merchant, rez-merchant-service, REZ-merchant-copilot*
