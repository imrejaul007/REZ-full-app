# REZ Data Analytics Report

**Version:** 1.0.0
**Date:** 2026-05-04
**Status:** APPROVED
**Owner:** Data Analytics Lead

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Analytics Schema](#analytics-schema)
3. [KPI Definitions](#kpi-definitions)
4. [Dashboard Specifications](#dashboard-specifications)
5. [Event Tracking Plan](#event-tracking-plan)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Requirements](#technical-requirements)

---

## Executive Summary

This document establishes the unified analytics framework for the REZ ecosystem, providing a single source of truth for all data analytics requirements, KPI definitions, and dashboard specifications.

### Current State Assessment

| Component | Status | Notes |
|-----------|--------|-------|
| **Shared Types** | Partial | `IAnalyticsEvent` exists in `packages/shared-types` |
| **Consumer App** | Implemented | AnalyticsService with 30+ event types |
| **Merchant Service** | Partial | Prometheus metrics, no analytics endpoints |
| **Hotel OTA** | Partial | Module structure exists |
| **AdBazaar** | Manual | Static HTML dashboard only |
| **Grafana** | Operational | Unified monitoring dashboard |

### Key Gaps Identified

1. No unified event schema across all services
2. Missing analytics endpoints in merchant-service
3. AdBazaar lacks real-time analytics
4. No business intelligence dashboards
5. Inconsistent event naming conventions
6. Missing funnel analysis capabilities

---

## Analytics Schema

### Core Event Schema

```typescript
// packages/shared-types/src/entities/analytics.ts

import { EventType } from '../enums/index';

/**
 * Flat event properties — scalars and arrays of scalars only.
 * Analytics pipelines depend on stable property shapes.
 */
export type IAnalyticsProperties = Record<
  string,
  string | number | boolean | null | string[] | number[]
>;

export interface IAnalyticsEventContext {
  /** User identifier (optional for anonymous events) */
  userId?: string;
  /** Session identifier for grouping events */
  sessionId?: string;
  /** Device fingerprint for cross-device tracking */
  deviceId?: string;
  /** Client IP (server-set, for geo) */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Referring URL/page */
  referer?: string;
  /** Geographic location */
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface IAnalyticsEvent {
  /** Unique event identifier */
  _id?: string;
  /** Event type from EventType enum */
  type: EventType;
  /** Event name — dotted style, e.g. "checkout.started" */
  name: string;
  /** ISO 8601 timestamp */
  timestamp: Date | string;
  /** Event context (user, session, device) */
  context: IAnalyticsEventContext;
  /** Freeform event properties */
  properties?: IAnalyticsProperties;
  /** Numeric metrics for aggregation (sum, avg, percentiles) */
  metrics?: Record<string, number>;
  /** Source service/app identifier */
  source?: 'consumer-app' | 'merchant-app' | 'web-menu' | 'admin-panel' | 'api';
  /** Schema version for migrations */
  version?: string;
}
```

### Extended Schema for Commerce Events

```typescript
// Commerce-specific event properties

export interface ICommerceEventProperties {
  // Product properties
  productId?: string;
  productName?: string;
  productPrice?: number;
  productCategory?: string;
  productBrand?: string;
  variantId?: string;

  // Cart properties
  cartId?: string;
  cartValue?: number;
  cartItemCount?: number;

  // Order properties
  orderId?: string;
  orderValue?: number;
  orderStatus?: string;

  // Payment properties
  paymentMethod?: string;
  paymentGateway?: string;
  paymentStatus?: string;

  // Merchant properties
  merchantId?: string;
  merchantName?: string;
  storeId?: string;
}

export interface IUserEventProperties {
  // User properties
  userId?: string;
  userType?: 'guest' | 'registered' | 'verified' | 'vip';
  userSegment?: string;

  // Onboarding
  onboardingStep?: string;
  identityVerified?: boolean;

  // Engagement
  sessionDuration?: number;
  screenViews?: number;
  actionsPerformed?: number;
}
```

### Event Type Enum

```typescript
// packages/shared-types/src/enums/analytics.ts

export enum EventType {
  // Page events
  PAGE_VIEW = 'page_view',
  APP_OPEN = 'app_open',
  APP_CLOSE = 'app_close',

  // User actions
  USER_ACTION = 'user_action',
  CLICK = 'click',
  SEARCH = 'search',
  FILTER = 'filter',
  SORT = 'sort',

  // Commerce events
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  VIEW_CART = 'view_cart',
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_COMPLETE = 'checkout_complete',
  PURCHASE = 'purchase',

  // Engagement
  SHARE = 'share',
  REVIEW = 'review',
  WISHLIST_ADD = 'wishlist_add',
  WISHLIST_REMOVE = 'wishlist_remove',

  // Onboarding/Identity
  IDENTITY_GATE_SEEN = 'identity_gate_seen',
  IDENTITY_SELECTED = 'identity_selected',
  VERIFICATION_STARTED = 'verification_started',
  VERIFICATION_COMPLETED = 'verification_completed',

  // System events
  ERROR = 'error',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
}
```

---

## KPI Definitions

### Consumer Metrics

| KPI | Definition | Formula | Target | Frequency |
|-----|------------|---------|--------|-----------|
| **DAU** | Daily Active Users | Unique users with >=1 session/day | TBD | Daily |
| **MAU** | Monthly Active Users | Unique users with >=1 session/month | TBD | Monthly |
| **WAU** | Weekly Active Users | Unique users with >=1 session/week | TBD | Weekly |
| **DAU/MAU Ratio** | Stickiness | DAU / MAU * 100 | >20% | Monthly |
| **New Users** | First-time users | Users with first_session on date | TBD | Daily |
| **Retention D1** | Day 1 retention | Users returning next day / Cohort | >40% | Weekly |
| **Retention D7** | Week retention | Users returning day 7 / Cohort | >20% | Weekly |
| **Retention D30** | Month retention | Users returning day 30 / Cohort | >10% | Monthly |
| **Session Duration** | Avg session length | Total time / Sessions | >3 min | Daily |
| **Screen Views/Session** | Engagement depth | Total views / Sessions | >5 | Daily |
| **Bounce Rate** | Single-page sessions | 1-page sessions / Total | <40% | Daily |

### Commerce Metrics

| KPI | Definition | Formula | Target | Frequency |
|-----|------------|---------|--------|-----------|
| **Orders/Day** | Daily order volume | Count of completed orders | TBD | Daily |
| **Orders/Week** | Weekly order volume | Count of completed orders | TBD | Weekly |
| **Orders/Month** | Monthly order volume | Count of completed orders | TBD | Monthly |
| **AOV** | Average Order Value | Total GMV / Order count | >INR 500 | Daily |
| **GMV** | Gross Merchandise Value | Sum of order values | TBD | Daily |
| **Conversion Rate** | Browse to purchase | Purchases / Sessions * 100 | >3% | Daily |
| **Add-to-Cart Rate** | Product to cart | Add-to-cart / Product views | >10% | Daily |
| **Cart Abandonment** | Incomplete checkout | (Carts - Orders) / Carts | <60% | Daily |
| **Checkout Abandonment** | Incomplete payment | (Checkouts - Orders) / Checkouts | <40% | Daily |
| **Repeat Purchase Rate** | Returning customers | Repeat orders / Total orders | >30% | Monthly |

### Financial Metrics

| KPI | Definition | Formula | Target | Frequency |
|-----|------------|---------|--------|-----------|
| **Revenue** | Total earnings | Sum of (order_value - refunds) | TBD | Daily |
| **Transaction Volume** | Payment count | Count of successful payments | TBD | Daily |
| **Payment Success Rate** | Success ratio | Success / Total * 100 | >98% | Daily |
| **Refund Rate** | Refund ratio | Refunds / Revenue * 100 | <2% | Monthly |
| **Chargeback Rate** | Dispute ratio | Chargebacks / Transactions | <0.1% | Monthly |
| **GST Collected** | Tax collected | Sum of GST amounts | TBD | Monthly |
| **Wallet Balance** | User funds | Sum of user wallet balances | TBD | Weekly |
| **Payout Volume** | Merchant payouts | Sum of merchant payouts | TBD | Weekly |

### Merchant Metrics

| KPI | Definition | Formula | Target | Frequency |
|-----|------------|---------|--------|-----------|
| **Active Merchants** | Transacting merchants | Merchants with >=1 order/week | TBD | Weekly |
| **Merchant Growth** | New merchants | New merchants added | TBD | Monthly |
| **Product Catalog Size** | Total products | Sum of merchant products | TBD | Monthly |
| **Order Fulfillment Rate** | On-time delivery | Delivered on-time / Total | >95% | Weekly |
| **Merchant Rating** | Avg merchant score | Sum of ratings / Count | >4.0 | Weekly |
| **Merchant Churn** | Inactive merchants | Merchants with no orders/30d | <5% | Monthly |
| **Avg Processing Time** | Order to fulfillment | Avg time in minutes | <30 min | Daily |

### Ad Platform Metrics

| KPI | Definition | Formula | Target | Frequency |
|-----|------------|---------|--------|-----------|
| **Impressions** | Ad views | Count of ad displays | TBD | Daily |
| **Click-through Rate** | Ad engagement | Clicks / Impressions * 100 | >2% | Daily |
| **Conversion Rate** | Ad to action | Actions / Clicks * 100 | >5% | Daily |
| **Revenue Per Impression** | Ad value | Revenue / Impressions | >INR 0.05 | Daily |
| **Active Campaigns** | Running campaigns | Count of active campaigns | TBD | Daily |
| **Campaign ROI** | Return on ad spend | Revenue / Ad spend | >3x | Weekly |

---

## Dashboard Specifications

### 1. Executive Dashboard (CEO View)

**Purpose:** High-level business health and strategic metrics

**Refresh Rate:** Real-time (15-minute delay)

**Layout:**
```
+------------------------------------------+
|  HEADER: Company KPIs Summary            |
+------------------------------------------+
|  GMV Today | Orders | Revenue | Users    |
+------------------------------------------+
|                                          |
|  [Line Chart: GMV Over Time]             |
|                                          |
+------------------------------------------+
|                                          |
|  [Funnel: Acquisition to Purchase]       |
|                                          |
+------------------------------------------+
|  Top 5 Products | Top 5 Merchants        |
+------------------------------------------+
```

**KPI Cards:**
- GMV Today vs Target (%)
- Revenue Today
- Active Users (DAU)
- Orders Today
- Conversion Rate
- Average Order Value

**Charts:**
- GMV/Revenue trend (7-day, 30-day, 90-day)
- Orders trend with YoY comparison
- User acquisition funnel
- Geographic distribution map

**Data Sources:**
- `rez-order-service` (orders, GMV)
- `rez-payment-service` (revenue)
- `rez-profile-service` (users)

---

### 2. Operations Dashboard

**Purpose:** Real-time operational health and incident detection

**Refresh Rate:** Real-time (1-minute delay)

**Layout:**
```
+------------------------------------------+
|  HEADER: System Health Indicators        |
+------------------------------------------+
|  Services: [●] [●] [●] [●] [●] [○]     |
+------------------------------------------+
|                                          |
|  [Service Map: All Microservices]        |
|                                          |
+------------------------------------------+
|                                          |
|  [Error Rate Trending]  [Latency Graph]  |
|                                          |
+------------------------------------------+
|  Queue Depths | DB Connections | Cache   |
+------------------------------------------+
```

**KPI Cards:**
- Services Up/Down
- Error Rate (%)
- P99 Latency (ms)
- Queue Depth
- DB Connection Pool %
- Redis Memory %

**Panels:**
- Service health matrix (all services)
- Error rate by service
- Request latency distribution
- Database connection pool status
- Redis memory and hit rates
- Queue processing rates

**Alerts:**
- Service down notification
- Error rate >5%
- Latency >1s P99
- Queue depth >10,000

---

### 3. Merchant Dashboard

**Purpose:** Merchant performance and insights

**Refresh Rate:** Hourly

**Layout:**
```
+------------------------------------------+
|  HEADER: My Store Performance           |
+------------------------------------------+
|  Today's Sales | Orders | Rating | Views|
+------------------------------------------+
|                                          |
|  [Sales Chart: Today vs Yesterday]       |
|                                          |
+------------------------------------------+
|                                          |
|  [Recent Orders Table]                   |
|                                          |
+------------------------------------------+
|  Top Products | Customer Reviews | Alerts |
+------------------------------------------+
```

**KPI Cards:**
- Today's Sales
- Pending Orders
- Average Rating
- Store Views
- Conversion Rate
- Product Count

**Charts:**
- Sales trend (today, 7-day, 30-day)
- Order status breakdown
- Product performance ranking
- Customer location heatmap
- Revenue by hour/day

**Data Sources:**
- `rez-merchant-service` (merchant data)
- `rez-order-service` (orders)
- `rez-catalog-service` (products)

---

### 4. Finance Dashboard

**Purpose:** Financial operations and reporting

**Refresh Rate:** Daily (EOD)

**Layout:**
```
+------------------------------------------+
|  HEADER: Financial Summary              |
+------------------------------------------+
|  Revenue | GST | Payouts | Refunds       |
+------------------------------------------+
|                                          |
|  [Revenue Breakdown by Category]        |
|                                          |
+------------------------------------------+
|                                          |
|  [Transaction Success Rate]              |
|                                          |
+------------------------------------------+
|  Pending Payouts | Settlement Reports    |
+------------------------------------------+
```

**KPI Cards:**
- Today's Revenue
- Month-to-Date Revenue
- GST Collected
- Pending Payouts
- Refund Rate
- Transaction Success %

**Reports:**
- Daily/Weekly/Monthly revenue breakdown
- GST collection report
- Merchant payout report
- Refund analysis
- Payment gateway performance

**Data Sources:**
- `rez-payment-service` (transactions)
- `rez-finance-service` (settlements)
- `rez-wallet-service` (balances)

---

### 5. Growth Dashboard

**Purpose:** User acquisition, engagement, and retention analysis

**Refresh Rate:** Daily

**Layout:**
```
+------------------------------------------+
|  HEADER: Growth Metrics                  |
+------------------------------------------+
|  DAU    | MAU    | Retention | Sessions |
+------------------------------------------+
|                                          |
|  [User Acquisition Funnel]               |
|                                          |
+------------------------------------------+
|                                          |
|  [Cohort Retention Matrix]               |
|                                          |
+------------------------------------------+
|  Acquisition Channels | User Segments     |
+------------------------------------------+
```

**KPI Cards:**
- DAU / MAU (Stickiness)
- New Users Today
- D1/D7/D30 Retention
- Avg Session Duration
- Screens per Session
- User Segments

**Funnels:**
- Acquisition: Install → Signup → First Order
- Activation: Signup → First Purchase
- Retention: Daily/Weekly/Monthly cohort
- Revenue: Sessions → Add to Cart → Checkout → Purchase

**Segments:**
- New vs Returning
- Verified vs Unverified
- VIP vs Regular
- Geographic
- Device type

---

### 6. Ad Platform Dashboard (AdBazaar)

**Purpose:** Campaign performance and ad revenue

**Refresh Rate:** Real-time

**Layout:**
```
+------------------------------------------+
|  HEADER: Campaign Overview              |
+------------------------------------------+
|  Active | Impressions | CTR   | Revenue |
+------------------------------------------+
|                                          |
|  [Intent-Based Ad Flow Visualization]   |
|                                          |
+------------------------------------------+
|                                          |
|  [Campaign Performance Table]            |
|                                          |
+------------------------------------------+
|  User Segments | Ad Examples            |
+------------------------------------------+
```

**KPI Cards:**
- Active Campaigns
- Total Impressions
- Click-through Rate
- Ad Revenue
- Revenue per 1000 Impressions
- Active Segments

**Panels:**
- Intent detection flow (user intent → ad display)
- Campaign performance table
- User segment distribution
- Real-time ad activity log
- Privacy compliance status

---

## Event Tracking Plan

### Core User Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `app_open` | page_view | App launched | platform, version, source |
| `app_close` | user_action | App backgrounded | session_duration, screens_viewed |
| `page_view` | page_view | Screen displayed | screen_name, referrer |
| `session_start` | system | New session created | session_id, platform |
| `session_end` | system | Session timeout/close | session_duration, events_count |

### Commerce Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `product_view` | user_action | Product detail opened | product_id, product_name, price, category |
| `product_click` | user_action | Product tapped | product_id, store_id, position, source |
| `add_to_cart` | user_action | Add to cart tapped | product_id, quantity, cart_value, currency |
| `remove_from_cart` | user_action | Remove from cart | product_id, quantity |
| `view_cart` | page_view | Cart screen opened | cart_value, item_count |
| `checkout_start` | user_action | Checkout initiated | cart_value, payment_method |
| `checkout_complete` | user_action | Payment confirmed | order_id, order_value, payment_method |
| `purchase` | system | Order completed | order_id, products, total_amount, currency |

### Store/Merchant Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `store_impression` | user_action | Store in list | store_id, store_name, position, source |
| `store_click` | user_action | Store tapped | store_id, position, source |
| `category_click` | user_action | Category selected | category_id, category_name, position |
| `search` | user_action | Search executed | query, results_count, filters |
| `filter_applied` | user_action | Filter changed | filters, result_count_before, result_count_after |
| `sort_changed` | user_action | Sort option selected | sort_by, sort_order |

### Identity/Onboarding Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `identity_gate_seen` | user_action | Identity prompt displayed | - |
| `identity_selected` | user_action | Identity type chosen | identity_type |
| `identity_skip_clicked` | user_action | Identity skipped | - |
| `verification_started` | user_action | Verification initiated | identity_type |
| `verification_completed` | user_action | Verification passed | identity_type, verification_method |
| `verification_skipped` | user_action | Verification abandoned | - |

### Engagement Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `share` | user_action | Share action | content_type, content_id, platform |
| `review_write` | user_action | Review submitted | product_id, rating, has_text |
| `review_helpful` | user_action | Helpful voted | review_id |
| `wishlist_add` | user_action | Added to wishlist | product_id |
| `wishlist_remove` | user_action | Removed from wishlist | product_id |
| `notification_received` | system | Push notification | notification_id, campaign_id |
| `notification_opened` | user_action | Notification tapped | notification_id, action |

### Ad Platform Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `ad_impression` | system | Ad displayed | ad_id, campaign_id, intent_signal |
| `ad_click` | user_action | Ad tapped | ad_id, campaign_id |
| `ad_action` | user_action | Post-ad action | ad_id, action_type, order_id |
| `intent_detected` | system | User intent identified | intent_type, confidence, signals |

### Error & Performance Events

| Event Name | Type | Trigger | Properties |
|------------|------|--------|------------|
| `error` | system | Exception caught | error_type, error_message, stack |
| `performance` | system | Metric recorded | metric_name, value, unit |
| `api_error` | system | API call failed | endpoint, status_code, latency |
| `network_error` | system | Network failure | error_type, retry_count |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Objectives:**
- Establish unified analytics schema
- Deploy analytics service infrastructure
- Set up data pipeline

**Deliverables:**
- [ ] Update `packages/shared-types` with complete analytics schema
- [ ] Create `rez-analytics-service` microservice
- [ ] Deploy ClickHouse/Redshift for analytics storage
- [ ] Set up Kafka topic for analytics events
- [ ] Implement event validation and enrichment

**Technical Tasks:**
```
1. Create analytics schema types
2. Deploy ClickHouse cluster
3. Set up Kafka topic: analytics-events
4. Create analytics ingestion service
5. Implement event validation middleware
6. Set up data enrichment pipeline
```

### Phase 2: Event Tracking (Week 3-4)

**Objectives:**
- Instrument all applications
- Standardize event collection
- Validate data quality

**Deliverables:**
- [ ] Consumer app full instrumentation
- [ ] Merchant app event tracking
- [ ] Admin panel analytics
- [ ] Web menu tracking
- [ ] Data quality monitoring

**Technical Tasks:**
```
1. Update AnalyticsService in consumer app
2. Create merchant analytics module
3. Add admin panel tracking
4. Implement web analytics SDK
5. Create data quality dashboard
6. Set up event validation rules
```

### Phase 3: Dashboards (Week 5-6)

**Objectives:**
- Deploy business intelligence dashboards
- Set up automated reporting
- Configure alerting

**Deliverables:**
- [ ] Executive dashboard
- [ ] Operations dashboard
- [ ] Merchant dashboard
- [ ] Finance dashboard
- [ ] Growth dashboard
- [ ] Alert configurations

**Technical Tasks:**
```
1. Deploy Grafana business dashboards
2. Create Metabase/Superset BI layer
3. Set up automated report scheduling
4. Configure Slack/email alerts
5. Create KPI calculation queries
6. Implement dashboard SSO
```

### Phase 4: Advanced Analytics (Week 7-8)

**Objectives:**
- Implement funnel analysis
- Set up cohort tracking
- Enable predictive analytics

**Deliverables:**
- [ ] Funnel analysis dashboard
- [ ] Cohort retention matrix
- [ ] A/B testing framework
- [ ] Anomaly detection

**Technical Tasks:**
```
1. Implement funnel calculation service
2. Create cohort tracking system
3. Set up experimentation platform
4. Deploy anomaly detection models
5. Build recommendation engine hooks
6. Create predictive dashboards
```

---

## Technical Requirements

### Infrastructure

| Component | Specification | Purpose |
|-----------|---------------|---------|
| **ClickHouse** | 3-node cluster, 16 vCPU, 64GB RAM | Analytics data warehouse |
| **Kafka** | 3-node cluster, 500GB storage | Event streaming |
| **Grafana** | Enterprise with RBAC | Dashboards |
| **Metabase** | 4 vCPU, 16GB RAM | Business intelligence |
| **Redis** | 3-node cluster, 32GB | Caching, real-time |

### Data Retention

| Data Type | Hot Storage | Cold Storage | Archive |
|-----------|-------------|---------------|---------|
| Raw Events | 7 days | 90 days | 2 years |
| Aggregated Metrics | 30 days | 1 year | 5 years |
| User Sessions | 30 days | 90 days | 1 year |
| Financial Transactions | 7 years | - | - |

### API Endpoints

```typescript
// Analytics Ingestion API
POST   /api/v1/analytics/events        // Single event
POST   /api/v1/analytics/batch          // Batch events (max 100)
GET    /api/v1/analytics/events          // Query events (admin)

// Dashboard Data API
GET    /api/v1/dashboard/executive      // Executive KPIs
GET    /api/v1/dashboard/operations     // Operations metrics
GET    /api/v1/dashboard/merchant/:id   // Merchant metrics
GET    /api/v1/dashboard/finance        // Financial metrics
GET    /api/v1/dashboard/growth         // Growth metrics

// Report API
GET    /api/v1/reports/daily            // Daily summary
GET    /api/v1/reports/funnel           // Funnel analysis
GET    /api/v1/reports/cohort           // Cohort retention
POST   /api/v1/reports/export            // Export data
```

### Security Requirements

- All events must include valid session token
- PII fields must be hashed before storage
- Dashboard access requires RBAC permissions
- API rate limits: 1000 events/minute per client
- Data access audit logging enabled

---

## Appendix

### A. Existing Analytics References

| Service | File Path | Status |
|---------|-----------|--------|
| Shared Types | `packages/shared-types/src/entities/analytics.ts` | Implemented |
| Consumer App | `rez-app-consumer/services/analyticsService.ts` | Implemented |
| Merchant Metrics | `rez-merchant-service/src/metrics.ts` | Partial |
| Grafana Dashboards | `grafana/unified-dashboard.json` | Operational |
| AdBazaar Dashboard | `rez-adbazaar/src/dashboard.ts` | Static HTML |

### B. Event Naming Convention

Format: `{category}.{action}.{object}`

Examples:
- `commerce.purchase.complete`
- `identity.verification.started`
- `user.session.started`
- `ad.impression.displayed`

### C. Metric Naming Convention

Format: `{entity}_{metric}_{unit}`

Examples:
- `order_count_total`
- `revenue_sum_inr`
- `session_duration_avg_seconds`
- `conversion_rate_percent`

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-05-04 | Data Analytics Lead | Initial release |

**Reviewers**
- [ ] CTO
- [ ] Product Lead
- [ ] Engineering Lead

**Approval**
- [ ] CEO
