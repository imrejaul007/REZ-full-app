# NextaBizz B2B Platform - Feature Audit Report

**Date:** 2026-05-05
**Auditor:** Claude Code
**Platform:** Next.js 15 + Supabase + TypeScript Monorepo
**Repository:** `/Users/rejaulkarim/Documents/ReZ Full App/nextabizz/`

---

## Executive Summary

NextaBizz is a B2B procurement platform connecting restaurant/hotel merchants with suppliers. The platform consists of:
- **Merchant Portal** (Buyer-facing web app)
- **Supplier Portal** (Supplier-facing web app)
- **Backend Services** (Reorder Engine, Scoring Engine, Payment Settlement)
- **Webhook Handlers** (RestoPapa, ReZ Merchant, Hotel PMS integrations)
- **Shared Packages** (Types, SDKs, Auth clients)

**Overall Status:** Phase 1 implementation with extensive demo/mock data. Core architecture is solid, but production deployment requires completing API integrations and replacing mock data.

---

## MERCHANT PORTAL FEATURES (Buyer)

---

## INVENTORY SIGNAL DASHBOARD
- **User Type:** Buyer (Restaurant/Hotel/Salon/Retail/Pharmacy)
- **Description:** Centralized view of all low-stock and out-of-stock alerts from integrated platforms. Displays signals with filtering by source (RestoPapa, ReZ Merchant, Hotel PMS), severity (critical/low/out_of_stock), and date range.
- **Benefit:** Merchants can monitor procurement needs across all connected systems in one dashboard, reducing the need to check multiple platforms.
- **Connects To:** `inventory_signals` table, ReZ Intent Graph (intent tracking)
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - Uses hardcoded mock data instead of live API calls
  - Signal source filtering shows all platforms, but actual webhook integration needs verification
  - `signalType` field inconsistency: code uses `signalType: 'low_stock'` but schema expects `signalType: 'threshold_breach' | 'manual_request' | 'forecast_deficit'`

---

## SMART REORDER ENGINE
- **User Type:** Buyer
- **Description:** Automatic reorder suggestions derived from inventory signals. Displays urgency levels (high/medium/low), suggested quantities, and match confidence scores. One-tap "Create PO" functionality.
- **Benefit:** Reduces manual procurement effort by automating reorder decisions based on stock thresholds.
- **Connects To:** `reorder_signals` table, `reorder-engine` service
- **Status:** Working (Backend Service Implemented, UI Demo)
- **Issues:**
  - UI is demo/mock; backend service exists in `/services/reorder-engine/src/index.ts`
  - Urgency levels in UI (`low`, `medium`, `high`) don't match backend (`low`, `medium`, `high`, `urgent`)
  - Par-level calculation formula in backend (threshold * 2) may need customization per business type

---

## SUPPLIER CATALOG
- **User Type:** Buyer
- **Description:** Browse and search supplier products by category. Features include search by name/SKU, filters for MOQ/price/delivery time, and supplier profiles with ratings.
- **Benefit:** Enables merchants to discover and compare products across multiple suppliers.
- **Connects To:** `supplier_products`, `suppliers`, `supplier_categories` tables
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - Mock data in `/apps/web/app/(dashboard)/catalog/page.tsx`
  - Category filtering uses `category.name` instead of `categoryId` - potential mismatch
  - Product images are placeholder divs, not actual images
  - No pagination in UI, but `pageSize` variable exists

---

## PURCHASE ORDER MANAGEMENT
- **User Type:** Buyer
- **Description:** Create, view, and manage purchase orders. Features include:
  - Create POs manually or from reorder signals/RFQs
  - Add items from catalog or free-text
  - View PO history with status tracking
  - Cancel pending POs
  - Contract pricing support
- **Benefit:** Complete PO lifecycle management from creation to fulfillment.
- **Connects To:** `purchase_orders`, `po_items` tables
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - Mock data in `/apps/web/app/(dashboard)/orders/page.tsx`
  - Create PO Modal exists in `/apps/web/components/create-po-modal.tsx` but API integration not complete
  - PO statuses in UI (`draft`, `sent`, `confirmed`, `processing`, `shipped`, `delivered`) partially match schema (`draft`, `sent`, `confirmed`, `processing`, `shipped`, `received`, `cancelled`, `closed`)
  - Missing: PO editing after submission

---

## ORDER TRACKING
- **User Type:** Buyer
- **Description:** Real-time order status tracking with timeline view. Shows statuses: draft, submitted, confirmed, shipped, received.
- **Benefit:** Merchants can track order progress and anticipate deliveries.
- **Connects To:** `purchase_orders` table
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - No real-time updates (no Supabase Realtime subscriptions)
  - Variance tracking (received vs ordered) mentioned but not displayed in UI

---

## PAYMENT SETTLEMENT
- **User Type:** Buyer
- **Description:** Multiple payment options including:
  - Net Terms (pay within agreed days, default 30)
  - Partial Prepay (% upfront, balance on delivery)
  - Full Prepay (100% before shipment)
  - BNPL (Buy Now Pay Later via RTMN Finance)
- **Benefit:** Flexible payment terms improve cash flow management.
- **Connects To:** `credit_lines`, `payment-settlement` service, RTMN Finance
- **Status:** Working (Backend Service Implemented, UI Demo)
- **Issues:**
  - UI in `/apps/web/app/(dashboard)/finance/page.tsx` uses mock data
  - Actual Razorpay integration mentioned but not implemented in code
  - Overdue payment tracking exists in backend but not in UI
  - "Pay Now" button is a placeholder (`alert('Payment integration coming soon!')`)

---

## SUPPLIER MATCHING
- **User Type:** Buyer
- **Description:** Auto-match signals to best-fit suppliers based on price, score, delivery speed, and distance. Shows "Best value", "Fastest", "Cheapest" modes.
- **Benefit:** Intelligent supplier recommendations reduce sourcing time.
- **Connects To:** `suppliers`, `supplier_products`, `scoring-engine` service
- **Status:** Working (Matching Logic in Backend, UI Demo)
- **Issues:**
  - UI doesn't show supplier matching interface
  - Matching algorithm weights are hardcoded in `reorder-engine/src/index.ts` (price: 0.4, rating: 0.35, delivery: 0.2, availability: 0.05)
  - No UI for "Best value" vs "Fastest" vs "Cheapest" modes

---

## REZ SSO LOGIN
- **User Type:** Buyer
- **Description:** Single sign-on via existing REZ Auth credentials. Auto-links to ReZ Merchant account.
- **Benefit:** Seamless authentication across ReZ ecosystem.
- **Connects To:** REZ Auth Service, `/apps/web/lib/rezOAuth.ts`
- **Status:** Working
- **Issues:**
  - Settings page (`/apps/web/app/(dashboard)/settings/page.tsx`) shows manual "Link Account" workflow
  - Validation regex for merchant ID (`/^[a-f0-9]{24}$/i`) may not match actual ReZ merchant ID format
  - No automatic session refresh handling visible

---

## RFQ ENGINE (Request for Quote)
- **User Type:** Buyer
- **Description:** Post custom requirements as RFQs, receive quotes from multiple suppliers, compare side-by-side, award to chosen supplier, auto-convert to PO.
- **Benefit:** Competitive bidding for custom or bulk requirements.
- **Connects To:** `rfqs`, `rfq_responses`, `purchase_orders` tables
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - UI in `/apps/web/app/(dashboard)/rfqs/page.tsx` uses mock data
  - Quote comparison modal shows mock responses
  - Awarding RFQ doesn't actually create linked PO (local state only)
  - RFQ expiration handling not visible

---

## PROCUREMENT ANALYTICS
- **User Type:** Buyer
- **Description:** Dashboard with:
  - Total spend tracking
  - Orders this month
  - Top supplier identification
  - Spend by category (pie chart)
  - Spend by supplier (bar chart)
  - Order trends over time
  - Top reordered items
- **Benefit:** Data-driven procurement insights.
- **Connects To:** `purchase_orders` table
- **Status:** Working (Demo with Mock Charts)
- **Issues:**
  - Charts are SVG placeholders, not real data visualizations
  - No date range filtering actually affects data
  - "Enhanced Analytics Coming Soon" notice visible in UI

---

## SETTINGS & ACCOUNT MANAGEMENT
- **User Type:** Buyer
- **Description:** REZ account connection, merchant ID linking, session management.
- **Benefit:** Account configuration and platform connection.
- **Connects To:** REZ Auth, `/api/merchant/*` routes
- **Status:** Working
- **Issues:**
  - Check link status API (`/api/merchant/check-link-status`) exists but session update flow could be clearer
  - No logout functionality visible

---

## SUPPLIER PORTAL FEATURES

---

## SUPPLIER DASHBOARD
- **User Type:** Supplier
- **Description:** Overview page showing:
  - Active orders count
  - Pending RFQs
  - Monthly revenue
  - Average rating
  - Quick actions navigation
  - Recent orders table
  - Open RFQs list
  - Performance score card
- **Benefit:** Central business overview for suppliers.
- **Connects To:** All tables via mock data
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - Authentication check uses simple localStorage token (not secure for production)
  - Hardcoded supplier name "FreshFarm Supplies" in UI
  - All data is mock, no real API calls

---

## ORDER FULFILLMENT
- **User Type:** Supplier
- **Description:** Manage incoming POs with:
  - Status tabs (New, Confirmed, Processing, Shipped, Completed)
  - Accept/reject workflow
  - Status update with notes
  - Order timeline view
  - Variance/notes display
- **Benefit:** Complete order management from receipt to delivery.
- **Connects To:** `purchase_orders` table
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - UI in `/apps/supplier-portal/app/dashboard/orders/page.tsx` uses mock data
  - Status updates are console.log only, no actual API calls
  - Variance notes are read-only display, no input capability

---

## PRODUCT MANAGEMENT
- **User Type:** Supplier
- **Description:** Supplier product catalog management with:
  - Product listing with search/filter
  - Bulk actions (activate/deactivate)
  - Add product modal
  - Edit/delete capabilities
- **Benefit:** Control product catalog, pricing, and availability.
- **Connects To:** `supplier_products` table
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - UI in `/apps/supplier-portal/app/dashboard/products/page.tsx` uses mock data
  - Add product form doesn't submit to any API
  - SKU auto-generation mentioned but not implemented
  - Bulk pricing configuration in modal but not functional

---

## PERFORMANCE DASHBOARD
- **User Type:** Supplier
- **Description:** Supplier score visualization with:
  - Overall score (0-5) with circular gauge
  - Tier badges (Platinum/Gold/Silver/Bronze)
  - Score breakdown (On-Time Delivery, Quality, Price Consistency, Response Rate, Lead Time)
  - Score trend chart (6 months)
  - Credit boost indicator
  - Improvement tips
- **Benefit:** Track performance metrics and identify improvement areas.
- **Connects To:** `supplier_scores` table, `scoring-engine` service
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - UI in `/apps/supplier-portal/app/dashboard/performance/page.tsx` uses mock data
  - Tier ranges: Platinum >= 4.5, Gold >= 3.5, Silver >= 2.0, Bronze < 2.0 (may need review)
  - Score calculation weights displayed (On-Time 30%, Quality 25%, Response 20%, Price 15%, Lead 10%) don't match backend weights

---

## RFQ RESPONSES
- **User Type:** Supplier
- **Description:** View open RFQs and submit quotes with:
  - RFQ details (quantity, target price, delivery deadline)
  - Quote submission form (unit price, quantity, lead time, notes)
  - My quotes tracking with awarded status
- **Benefit:** Win new business through competitive bidding.
- **Connects To:** `rfqs`, `rfq_responses` tables
- **Status:** Working (Demo with Mock Data)
- **Issues:**
  - UI in `/apps/supplier-portal/app/dashboard/rfqs/page.tsx` uses mock data
  - Quote submission is console.log only, no API call
  - No duplicate quote prevention

---

## BACKEND SERVICES

---

## REORDER ENGINE SERVICE
- **Location:** `/services/reorder-engine/src/index.ts`
- **Description:** Background worker that:
  - Processes pending inventory signals
  - Generates reorder signals with suggested quantities
  - Matches signals to supplier products using scoring algorithm
  - Sends notifications to REZ Merchant
  - Logs events to events table
- **Benefit:** Automates procurement decision-making.
- **Connects To:** `inventory_signals`, `reorder_signals`, `supplier_products`, `events` tables
- **Status:** Working (Standalone Node.js Process)
- **Issues:**
  - Requires manual execution or cron scheduling
  - No built-in scheduling mechanism
  - REZ Merchant webhook URL is hardcoded with render.com domain
  - No retry logic for failed webhook calls
  - Uses snake_case in DB operations but camelCase in TypeScript types (inconsistency)

---

## SCORING ENGINE SERVICE
- **Location:** `/services/scoring-engine/src/calculator.ts`
- **Description:** Monthly scoring calculation for suppliers:
  - On-time delivery rate
  - Quality rejection rate
  - Price consistency
  - Response rate
  - Lead time score
  - Overall score (weighted average)
  - Credit boost calculation
- **Benefit:** Track and incentivize supplier performance.
- **Connects To:** `suppliers`, `purchase_orders`, `rfqs`, `rfq_responses`, `supplier_scores`, `events` tables
- **Status:** Working (Standalone Node.js Process)
- **Issues:**
  - Requires manual execution or cron scheduling
  - Price consistency is hardcoded to 1.0 (placeholder)
  - RFQ expiry date filtering may miss records without expires_at
  - No historical score tracking (upserts only)

---

## PAYMENT SETTLEMENT SERVICE
- **Location:** `/services/payment-settlement/src/index.ts`
- **Description:** Handles B2B payment operations:
  - BNPL payment settlement (increment credit line utilized)
  - Net Terms initiation
  - Credit availability checking
  - Razorpay webhook handling
  - Overdue payment detection
  - Payment reminder sending
- **Benefit:** Manage complex B2B payment workflows.
- **Connects To:** `credit_lines`, `purchase_orders`, `events` tables
- **Status:** Working (Standalone Node.js Process)
- **Issues:**
  - Requires manual execution or cron scheduling
  - No actual Razorpay integration (signature verification exists but no live endpoint)
  - Overdue detection uses `expected_delivery` but should use `tenor_days` from credit line
  - Payment reminders are logged only, not sent

---

## WEBHOOK INTEGRATIONS

---

## RESTOPAPA WEBHOOK
- **Location:** `/apps/web/api/webhooks/restopapa/route.ts`
- **Description:** Receives inventory signal webhooks from RestoPapa with:
  - HMAC signature verification
  - Payload validation (Zod schemas)
  - Supabase storage
  - REZ Intent Graph integration
- **Benefit:** Ingest real-time inventory data from RestoPapa merchants.
- **Connects To:** `inventory_signals` table, REZ Intent Graph
- **Status:** Working
- **Issues:**
  - Uses webhook-sdk from `@nextabizz/webhook-sdk`
  - Intent tracking is fire-and-forget (non-blocking) but no error handling
  - No idempotency handling visible

---

## REZ MERCHANT WEBHOOK
- **Location:** `/apps/web/api/webhooks/rez-merchant/route.ts`
- **Description:** Receives inventory signals from ReZ Merchant platform.
- **Benefit:** Connect ReZ Merchant users to NextaBizz procurement.
- **Connects To:** `inventory_signals` table
- **Status:** Working
- **Issues:** Same as RestoPapa webhook

---

## HOTEL PMS WEBHOOK
- **Location:** `/apps/web/api/webhooks/hotel-pms/route.ts`
- **Description:** Receives inventory signals from Hotel PMS systems (housekeeping, kitchen, spa supplies).
- **Benefit:** Hotel inventory procurement automation.
- **Connects To:** `inventory_signals` table
- **Status:** Working
- **Issues:** Same as other webhooks

---

## SHARED PACKAGES

---

## SHARED TYPES PACKAGE
- **Location:** `/packages/shared-types/src/`
- **Description:** Canonical TypeScript types, Zod schemas, and entities for:
  - Merchant, Supplier, SupplierProduct, SupplierCategory
  - PurchaseOrder, POItem
  - RFQ, RFQResponse
  - CreditLine, SupplierScore
  - InventorySignal, ReorderSignal
  - API request/response types
  - Event schemas
- **Status:** Working
- **Issues:**
  - Schema validation between frontend and backend needs verification
  - Some enum values don't match (e.g., POStatus vs actual DB statuses)

---

## WEBHOOK SDK
- **Location:** `/packages/webhook-sdk/src/`
- **Description:** SDK for handling incoming webhooks:
  - Signature verification
  - Payload validation
  - Common handlers for RestoPapa, ReZ Merchant, Hotel PMS
- **Status:** Working
- **Issues:** None identified

---

## REZ AUTH CLIENT
- **Location:** `/packages/rez-auth-client/src/`
- **Description:** Authentication client for REZ API SSO integration.
- **Status:** Working
- **Issues:** None identified

---

## INTENT CAPTURE SERVICE
- **Location:** `/apps/web/lib/intentCaptureService.ts`
- **Description:** Captures buyer intent signals for ReZ Mind recommendation engine:
  - product_search (0.15 confidence)
  - product_view (0.25)
  - inquiry_sent (0.30)
  - checkout_start (0.60)
  - order_placed (1.0)
- **Status:** Working
- **Issues:**
  - Fire-and-forget design (no error handling)
  - No retry mechanism
  - Intent confidence values are hardcoded, not configurable

---

## DATABASE SCHEMA

---

## SUPABASE SCHEMA
- **Location:** `/supabase/migrations/001_initial_schema.sql`
- **Status:** Implemented
- **Issues:**
  - Some column names use snake_case (DB) but code expects camelCase
  - Missing indexes on frequently queried columns
  - No RLS (Row Level Security) policies visible
  - Event table design (append-only) is good but no retention policy

---

## DOCUMENTED BUT NOT IMPLEMENTED

The following features are documented in `/docs/FEATURE_MAP.md` but NOT implemented in code:

| Feature | Phase | Status |
|---------|-------|--------|
| Budget Tracking | 2 | Not Implemented |
| Favorite Suppliers | 2 | Not Implemented |
| Multi-Location Procurement | 3 | Not Implemented |
| PO Approval Workflows | 3 | Not Implemented |
| Supplier SLAs | 3 | Not Implemented |
| Contract Pricing | 3 | Not Implemented |
| Demand Forecasting | 3 | Not Implemented |
| Price Intelligence | 3 | Not Implemented |
| Invoice Management | 3 | Not Implemented |
| App Discovery (SaaS) | 3 | Not Implemented |
| Subscription Management | 3 | Not Implemented |
| Supplier Discovery | 4 | Not Implemented |
| Bulk Inquiry | 4 | Not Implemented |
| Contract Management | 4 | Not Implemented |
| AdBazaar Integration | 4 | Not Implemented |
| Logistics Partner Integration | 4 | Not Implemented |
| Platform Admin Dashboard | All | Not Implemented |

---

## CRITICAL ISSUES SUMMARY

### High Priority
1. **All UI pages use mock data** - No production-ready API integration
2. **No real-time updates** - Missing Supabase Realtime subscriptions for order/signal updates
3. **Payment integration incomplete** - "Pay Now" is a placeholder alert
4. **Background services require manual execution** - No cron/scheduler built-in

### Medium Priority
1. **Schema mismatches** - snake_case vs camelCase, enum value differences
2. **No error boundaries** - Component errors can crash the app
3. **Authentication is simplified** - localStorage token not production-ready
4. **No input validation on forms** - Client-side only

### Low Priority
1. **Charts are SVG placeholders** - Not real data visualizations
2. **Hardcoded configuration values** - Webhook URLs, scoring weights
3. **No unit tests** - Test coverage unknown
4. **Missing loading states** - Some async operations lack feedback

---

## CONNECTIONS TO REZ ECOSYSTEM

| Service | Connection Type | Status |
|---------|----------------|--------|
| REZ Auth | SSO/Login | Working |
| REZ Merchant | Webhook (Inventory) | Working |
| REZ Intent Graph | Intent Capture | Working |
| RTMN Finance | BNPL/Credit | Partial |
| RestoPapa | Webhook (Inventory) | Working |
| Hotel PMS | Webhook (Inventory) | Working |
| Razorpay | Payment Gateway | Not Integrated |
| ReZ Wallet | B2B Payments | Planned |

---

## FILES AUDITED

### Core Applications
- `/apps/web/` - Merchant-facing Next.js application
- `/apps/supplier-portal/` - Supplier-facing Next.js application

### Backend Services
- `/services/reorder-engine/` - Reorder signal processing
- `/services/scoring-engine/` - Supplier score calculation
- `/services/payment-settlement/` - Payment processing

### Shared Packages
- `/packages/shared-types/` - TypeScript types and Zod schemas
- `/packages/webhook-sdk/` - Webhook handling SDK
- `/packages/rez-auth-client/` - REZ Auth integration

### Database
- `/supabase/migrations/001_initial_schema.sql` - Database schema
- `/supabase/seed.sql` - Seed data

### Documentation
- `/docs/FEATURE_MAP.md` - Feature specifications
- `/docs/PHASE1_DATA_MODEL.md` - Data model documentation
- `/docs/REPO_SCAFFOLDING.md` - Repository structure

---

*End of Audit Report*
