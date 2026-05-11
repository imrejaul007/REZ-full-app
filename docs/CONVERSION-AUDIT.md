# REZ Conversion Audit

**Date**: 2026-04-29  
**Author**: Data Science Analysis  
**Scope**: Order Funnel, Merchant Onboarding, Ad Conversions, QR Scans

---

## Executive Summary

REZ implements a multi-layer conversion tracking system across consumer apps (`rez-now`), merchant services (`analytics-events`), and ad platform (`rez-targeting-engine`). Current tracking covers 4 primary conversion flows with measurable events at each stage.

### Key Findings

| Flow | Current State | Critical Gap |
|------|---------------|-------------|
| Order Funnel | 8 tracked events | No cart abandonment tracking |
| Merchant Onboarding | 6-step funnel | No step-level drop-off metrics |
| Ad Conversions | Impression → Click → Conversion | Attribution window undefined |
| QR Scans | 5 QR types, basic detection | Scan-to-action funnel not tracked |

---

## 1. Order Funnel Analysis

### Current Event Flow

```
store_viewed → menu_item_viewed → add_to_cart → cart_viewed → 
checkout_started → payment_initiated → order_placed → order_completed
```

**Implementation**: `/rez-now/lib/analytics/events.ts`

```typescript
export type AnalyticsEvent =
  | 'store_viewed'
  | 'menu_item_viewed'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_viewed'
  | 'checkout_started'
  | 'payment_initiated'
  | 'order_placed'
  | 'order_completed'
  | 'coupon_applied'
  | 'login_started'
  | 'login_completed'
  | 'scan_pay_initiated'
  | 'scan_pay_completed';
```

### Tracked Events by Location

| Event | Location | Data Captured |
|-------|----------|---------------|
| `store_viewed` | StorePageClient.tsx | storeSlug, storeType, hasMenu |
| `checkout_started` | checkout/page.tsx (line 156) | storeSlug |
| `payment_initiated` | checkout/page.tsx (line 234) | amount, paymentMethod |
| `coupon_applied` | checkout/page.tsx (line 245) | couponCode |

### Conversion Rate Calculation (Current Implementation)

**Location**: `analytics-events/src/routes/unifiedAnalyticsRoutes.ts`

```typescript
const ctr = adImpressions > 0 ? (adClicks / adImpressions) * 100 : 0;
const conversionRate = adClicks > 0 ? (conversions / adClicks) * 100 : 0;
```

**Benchmark Data** (from BenchmarkEngine.ts):

| Metric | REZ Peer Avg | Industry Benchmark | Gap |
|--------|--------------|-------------------|-----|
| Avg Order Value | Derived from revenue/orders | ₹250-350 (QSR) | TBD |
| Repeat Customer Rate | Tracked in merchantanalytics | 25-35% (restaurants) | TBD |
| Monthly Revenue | Aggregated daily | N/A | N/A |

### Industry Benchmarks for Comparison

| Funnel Stage | Industry Avg | REZ Target |
|--------------|-------------|------------|
| Browse → Cart | 8-15% | 12% |
| Cart → Checkout | 60-70% | 65% |
| Checkout → Payment | 70-80% | 75% |
| Payment → Complete | 85-95% | 90% |
| **Overall Conversion** | **2.5-6%** | **4%** |

### Critical Gaps Identified

1. **Cart Abandonment**: No `cart_abandoned` event tracked
2. **Checkout Drop-off**: No stage-level drop-off measurement
3. **Payment Failure**: No tracking of Razorpay failure reasons
4. **Session Level**: No cross-session user journey tracking

### A/B Testing Opportunities

| Hypothesis | Metric | Priority |
|------------|--------|----------|
| "Add to cart" CTA color change | Cart add rate | HIGH |
| Reduce checkout steps from 4 to 2 | Checkout completion | HIGH |
| Pre-fill tip suggestions (10% → 15%) | Tip conversion | MEDIUM |
| One-click reorder | Repeat order rate | MEDIUM |

---

## 2. Merchant Onboarding Funnel

### Current 6-Step Flow

```
Welcome (Step 1) → Business Info (Step 2) → Store Details (Step 3) → 
Bank Details (Step 4) → Documents (Step 5) → Review & Submit (Step 6)
```

**Implementation**: `/rez-app-merchant/constants/onboarding.ts`

```typescript
export const ONBOARDING_STEPS = [
  { stepNumber: 1, title: 'Welcome', route: '/onboarding/welcome' },
  { stepNumber: 2, title: 'Business Information', route: '/onboarding/business-info' },
  { stepNumber: 3, title: 'Store Details', route: '/onboarding/store-details' },
  { stepNumber: 4, title: 'Bank Details', route: '/onboarding/bank-details' },
  { stepNumber: 5, title: 'Documents', route: '/onboarding/documents' },
  { stepNumber: 6, title: 'Review & Submit', route: '/onboarding/review-submit' },
];
```

### Step Requirements (Required Fields)

| Step | Required Fields | Auto-save |
|------|-----------------|-----------|
| 2 | businessName, ownerName, ownerEmail, ownerPhone, businessType, businessCategory | Yes (30s) |
| 3 | storeName, storeType, storeAddress, storePhone | Yes |
| 4 | accountHolderName, accountNumber, bankName, ifscCode, panNumber, accountType | Yes |
| 5 | pan_card, aadhar, bank_statement, business_license | Yes |
| 6 | agreedToTerms, agreedToPrivacy | N/A |

### Document Verification Status

```typescript
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};
```

### Onboarding Status Transitions

```typescript
export const ONBOARDING_STATUS = {
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ON_HOLD: 'on_hold',
};
```

### Critical Gaps

1. **No Funnel Analytics**: Step completion rates not tracked in analytics-events
2. **Time in Funnel**: No duration measurement between steps
3. **Drop-off Points**: Abandonment reasons unknown
4. **First Order Metric**: `firstOrder` event not defined in analytics

### Industry Benchmarks

| Stage | Industry Avg | REZ Target |
|-------|-------------|------------|
| Start → Step 2 | 70% | 75% |
| Step 2 → Step 3 | 60% | 65% |
| Step 3 → Step 4 | 55% | 60% |
| Step 4 → Step 5 | 50% | 55% |
| Step 5 → Submit | 40% | 45% |
| **Overall Completion** | **3-5%** | **5%** |

### A/B Testing Opportunities

| Hypothesis | Metric | Priority |
|------------|--------|----------|
| Simplified Bank Details (skip optional fields) | Step 4 completion | HIGH |
| Document upload guidance tooltip | Upload success rate | HIGH |
| Pre-fill from GST lookup | Step 3 completion | MEDIUM |
| Progress celebration animations | Step transitions | MEDIUM |

---

## 3. Ad Conversion Tracking

### Current Event Pipeline

**Source**: `analytics-events/src/workers/eventPlatformConsumer.ts`

```
Queue: events-ad-impression → events-ad-click → events-conversion
```

### Event Types Tracked

| Event | Queue Name | Properties |
|-------|-----------|------------|
| `ad.impression` | events-ad-impression | adId, campaignId, merchantId, placement, deviceType, platform |
| `ad.click` | events-ad-click | adId, campaignId, merchantId, ctaClicked |
| `conversion` | events-conversion | conversionId, orderId, value, channel, source |

### Channel Configuration (from rez-targeting-engine)

```typescript
export const CHANNEL_CONFIG = {
  banner: {
    engagement_rate_baseline: 0.02,  // 2%
    delivery_rate: 0.98,
  },
  push: {
    engagement_rate_baseline: 0.15,   // 15%
    delivery_rate: 0.95,
  },
  in_app: {
    engagement_rate_baseline: 0.25,   // 25%
    delivery_rate: 1.0,
  },
  sms: {
    engagement_rate_baseline: 0.08,   // 8%
    delivery_rate: 0.90,
  },
  email: {
    engagement_rate_baseline: 0.05,   // 5%
    delivery_rate: 0.85,
  },
};
```

### Calculated Metrics

**Location**: `analytics-events/src/routes/unifiedAnalyticsRoutes.ts`

```typescript
const ctr = adImpressions > 0 ? (adClicks / adImpressions) * 100 : 0;
const conversionRate = adClicks > 0 ? (conversions / adClicks) * 100 : 0;
```

### Industry Benchmarks

| Metric | Industry Avg | REZ Baseline | Gap |
|--------|-------------|--------------|-----|
| CTR (Banner) | 0.5-1.5% | 0.5% (baseline) | TBD |
| CTR (Push) | 2-5% | 3% (baseline) | TBD |
| Conversion Rate | 2-10% | 5% (baseline) | TBD |
| ROAS | 3-5x | 4x (target) | TBD |

### Critical Gaps

1. **Attribution Window**: Not defined (industry standard: 7-30 days)
2. **View-through Attribution**: Not tracked
3. **Campaign-level ROAS**: Not calculated in analytics
4. **Frequency Capping**: Defined in config but not tracked

### A/B Testing Opportunities

| Hypothesis | Metric | Priority |
|------------|--------|----------|
| Personalized ad copy based on LTV | CTR | HIGH |
| Time-of-day targeting optimization | Conversion rate | HIGH |
| Dynamic creative rotation | Engagement | MEDIUM |
| Frequency cap increase (5→8/week) | Reach vs fatigue | MEDIUM |

---

## 4. QR Scan to Action Funnel

### QR Types Detected

**Implementation**: `/rez-now/components/web-qr-scanner/utils/detectQRType.ts`

```typescript
export type QRType = 
  | 'room-hub'      // Room Service (RZ-ROOM-XXXX)
  | 'menu-qr'       // Store Menu (now.rez.money/XXXX)
  | 'rez-now'       // REZ Now app
  | 'ads-qr'        // Campaign (ads.rez.money)
  | 'legacy';       // Legacy format conversion
```

### URL Patterns

| Type | Pattern | Example |
|------|---------|---------|
| REZ Now | `now.rez.money/*` | `now.rez.money/bangalore-restaurant` |
| Menu QR | `/menu` or `/order` paths | `example.com/menu` |
| Ads QR | `ads.rez.money/*` | `ads.rez.money/campaign-123` |
| Room Hub | `RZ-ROOM-*` | `RZ-ROOM-AB12CD` |

### Scanned Event Tracking

```typescript
// From checkout/page.tsx
track({
  event: 'scan_pay_initiated',
  storeSlug: store.slug,
});

track({
  event: 'scan_pay_completed',
  storeSlug: store.slug,
});
```

### Critical Gaps

1. **Scan Detection**: No count of QR scans without action
2. **Scan → Menu Browse**: No tracking of menu views from QR
3. **Scan → Add to Cart**: Conversion from QR entry point
4. **Ad QR Attribution**: Campaign ID extraction not linked to conversion

### Industry Benchmarks

| Metric | Industry Avg | REZ Target |
|--------|-------------|------------|
| QR Scan → Menu View | 70-80% | 75% |
| Menu View → Add to Cart | 15-25% | 20% |
| Add to Cart → Order | 50-60% | 55% |
| **Overall QR → Order** | **5-10%** | **7%** |

### A/B Testing Opportunities

| Hypothesis | Metric | Priority |
|------------|--------|----------|
| Personalized welcome after scan | Add to cart rate | HIGH |
| First-order discount via QR | First order conversion | HIGH |
| Scan confirmation animation | Scan completion | MEDIUM |

---

## 5. Analytics Infrastructure

### Data Collections

| Collection | Purpose | Location |
|------------|---------|----------|
| `appevents` | Raw user events | EventPlatformConsumer |
| `growth_events` | Marketing events | EventPlatformConsumer |
| `merchantanalytics` | Daily aggregations | Nightly job |
| `cointransactions` | Loyalty tracking | Separate pipeline |

### Key APIs

| Endpoint | Returns | Funnel Relevance |
|----------|---------|-----------------|
| `GET /api/analytics/unified/:merchantId` | Revenue, visitors, CTR, conversion rate | Order & Ad funnel |
| `GET /api/analytics/merchant/:merchantId/summary` | Revenue, visitors, newVsReturning | Order funnel |
| `GET /api/benchmarks/:merchantId` | Peer comparison metrics | Benchmark data |

### Benchmark Engine

**Location**: `analytics-events/src/engines/BenchmarkEngine.ts`

```typescript
export interface BenchmarkMetrics {
  merchantId: string;
  peerGroup: PeerGroup;
  foodCostPct: BenchmarkMetricPoint;
  avgOrderValue: BenchmarkMetricPoint;  // KEY: AOV comparison
  staffCostPct: BenchmarkMetricPoint;
  monthlyRevenue: BenchmarkMetricPoint;
  repeatCustomerRate: BenchmarkMetricPoint;  // KEY: Repeat customer %
  computedAt: string;
}
```

---

## 6. Recommendations

### Immediate Actions (30 Days)

1. **Add Cart Abandonment Tracking**
   - Track `cart_abandoned` event with cart value
   - Trigger on session timeout or navigation away

2. **Merchant Onboarding Step Analytics**
   - Add step entry/exit events to analytics
   - Calculate time-between-steps metrics

3. **Define Attribution Windows**
   - Set 7-day click-through, 1-day view-through
   - Document in analytics schema

### Medium-term (60-90 Days)

4. **QR Scan Funnel Analytics**
   - Track scan counts by QR type
   - Link ad QR campaigns to conversions

5. **A/B Testing Infrastructure**
   - Implement variant tracking in events
   - Create test group APIs

### Long-term (90+ Days)

6. **Machine Learning Funnel Optimization**
   - Predict cart abandonment probability
   - Personalize checkout flow based on user segment

---

## Appendix: Data Sources

### Event Tracking Files
- `/rez-now/lib/analytics/events.ts` - Core analytics hook
- `/rez-now/app/[storeSlug]/StorePageClient.tsx` - Store viewed tracking
- `/rez-now/app/[storeSlug]/checkout/page.tsx` - Checkout funnel tracking
- `/analytics-events/src/workers/eventPlatformConsumer.ts` - Event processing
- `/analytics-events/src/routes/unifiedAnalyticsRoutes.ts` - Analytics aggregation

### Merchant Onboarding Files
- `/rez-app-merchant/constants/onboarding.ts` - Step definitions
- `/rez-app-merchant/types/onboarding.ts` - Type definitions
- `/rez-app-merchant/contexts/OnboardingContext.tsx` - State management

### Ad Platform Files
- `/rez-targeting-engine/src/config/constants.ts` - Channel configurations
- `/analytics-events/src/routes/unifiedAnalyticsRoutes.ts` - Ad metrics

### QR Scanning Files
- `/rez-now/components/web-qr-scanner/utils/detectQRType.ts` - QR type detection
- `/rez-now/app/[storeSlug]/pay/page.tsx` - Scan & Pay tracking

---

**Document Version**: 1.0  
**Next Review**: 2026-05-29
