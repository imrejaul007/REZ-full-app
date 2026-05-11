# REZ Mind - Complete Audit & Integration Plan

**Version:** 1.0.0
**Date:** 2026-05-01
**Purpose:** Complete audit of all apps/services with integration plan

---

## AUDIT SUMMARY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ AUDIT RESULTS ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ║
║ CONSUMER APPS: 5 ║
║ ├── rez-app-consumer - HAS existing intent tracking, needs REZ Mind ║
║ ├── rez-now - QR/Scan focused, needs integration ║
║ ├── rez-web-menu - Web ordering, needs integration ║
║ ├── rendez - Social/booking, needs integration ║
║ └── rez-karma-app - Rewards, low priority ║
║  ║
║ MERCHANT APPS: 3 ║
║ ├── rez-app-merchant - Comprehensive, needs inventory/payment events ║
║ ├── rez-restopapa - Restaurant focused, needs integration ║
║ └── rez-pms-app - Hotel PMS, needs integration ║
║  ║
║ BACKEND SERVICES: 6 ║
║ ├── rez-order-service - HAS intent tracking, needs REZ Mind upgrade ║
║ ├── rez-search-service - HAS intent tracking, needs REZ Mind upgrade ║
║ ├── rez-payment-service - NO tracking, needs integration ║
║ ├── rez-catalog-service - NO tracking, needs integration ║
║ ├── rez-gamification-service - Points/badges, low priority ║
║ └── rez-marketing-service - AdBazaar, needs integration ║
║  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## SECTION 1: CONSUMER APPS

### 1.1 rez-app-consumer

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer`
**Repo:** `imrejaul007/rez-app-consumer`
**Priority:** **HIGH**
**Status:** Has existing intent tracking via `intentCaptureService.ts`

#### Current State
- Uses `intentCaptureService.ts` to track events
- Already sends to `INTENT_CAPTURE_URL` env var
- Tracks: search, product view, cart actions, checkout

#### Key Screens for REZ Mind
| Screen | File | Event to Add |
|--------|------|--------------|
| Home | `app/(tabs)/index.tsx` | - |
| Search | `app/search.tsx` | `consumer.search` |
| Product Page | `app/product-page.tsx` | `consumer.view` |
| Checkout | `app/checkout.tsx` | `consumer.order` |
| Booking | `app/booking/*.tsx` | `consumer.booking` |
| Payment Success | `app/payment-success.tsx` | `consumer.payment` |

#### Integration Points
```
File: app/services/intentCaptureService.ts
Action: Upgrade to send to REZ Mind Event Platform

Changes needed:
1. Add REZ Mind webhook endpoint
2. Send consumer.order on checkout success
3. Send consumer.search on search submit
4. Send consumer.view on product view
5. Send consumer.booking on booking confirm
```

#### Code Changes Required
```typescript
// app/services/intentCaptureService.ts

// Add new method
async sendToRezMind(event: string, data: any) {
  const endpoint = {
    'search': '/webhook/consumer/search',
    'view': '/webhook/consumer/view',
    'order': '/webhook/consumer/order',
    'booking': '/webhook/consumer/booking'
  }[event];

  await fetch(`${REZ_MIND_URL}${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
```

#### Files to Modify
1. `app/services/intentCaptureService.ts` - Add REZ Mind integration
2. `app/search.tsx` - Send search event
3. `app/product-page.tsx` - Send view event
4. `app/checkout.tsx` - Send order event
5. `app/booking/*.tsx` - Send booking event

---

### 1.2 rez-now

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-now`
**Repo:** `imrejaul007/rez-now`
**Priority:** **HIGH**
**Status:** No existing event tracking

#### Key Screens for REZ Mind
| Screen | File | Event to Add |
|--------|------|--------------|
| QR Scanner | `app/scan/page.tsx` | `consumer.scan` |
| Store Menu | `app/[storeSlug]/page.tsx` | `consumer.view` |
| Cart | `app/[storeSlug]/cart/page.tsx` | `consumer.cart` |
| Checkout | `app/[storeSlug]/checkout/page.tsx` | `consumer.order` |
| Scan & Pay | `app/[storeSlug]/pay/page.tsx` | `consumer.payment` |
| Search | `app/search/page.tsx` | `consumer.search` |

#### Integration Points
```
File: app/services/order.ts or lib/api.ts
Action: Add REZ Mind calls on key actions

QR Scan → consumer.scan
Store View → consumer.view
Order → consumer.order
Payment → consumer.payment
```

#### Code Changes Required
```typescript
// Add to lib/rez-mind.ts
export const rezMind = {
  async sendScan(userId: string, storeId: string, action: string) {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/scan`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, store_id: storeId, action })
    });
  },
  async sendOrder(data: OrderData) {
    await fetch(`${REZ_MIND_URL}/webhook/consumer/order`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
```

#### Files to Modify
1. `app/scan/page.tsx` - Add scan event
2. `app/[storeSlug]/page.tsx` - Add view event
3. `app/[storeSlug]/checkout/page.tsx` - Add order event
4. `app/[storeSlug]/pay/page.tsx` - Add payment event

---

### 1.3 rez-web-menu

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-web-menu`
**Priority:** **MEDIUM**
**Status:** No existing event tracking

#### Key Screens
| Screen | Event to Add |
|--------|--------------|
| Store Menu | `consumer.view` |
| Cart | `consumer.cart` |
| Checkout | `consumer.order` |
| Search | `consumer.search` |

---

### 1.4 rendez

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rendez`
**Priority:** **MEDIUM**
**Status:** No existing event tracking

#### Key Screens
| Screen | Event to Add |
|--------|--------------|
| Profile View | `consumer.view` |
| Booking | `consumer.booking` |
| Match | `consumer.engage` |

---

### 1.5 rez-karma-app

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-app`
**Priority:** **LOW**
**Status:** Rewards-focused, different data model

#### Key Events
| Event | Data |
|-------|------|
| `karma.points_earned` | user_id, points, source |
| `karma.points_redeemed` | user_id, points, reward |

---

## SECTION 2: MERCHANT APPS

### 2.1 rez-app-merchant

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant`
**Repo:** `imrejaul007/rez-app-marchant`
**Priority:** **HIGH**
**Status:** Comprehensive app, needs inventory/payment events

#### Key Screens for REZ Mind
| Screen | File | Event to Add |
|--------|------|--------------|
| Live Orders | `app/(dashboard)/orders.tsx` | `merchant.order` |
| Order Detail | `app/orders/live.tsx` | `merchant.order` |
| Inventory | `app/products/inventory.tsx` | `merchant.inventory_low` |
| Stock Alerts | `app/products/stock-alerts.tsx` | `merchant.inventory_low` |
| Payments | `app/(dashboard)/payments.tsx` | `merchant.payment` |
| New Customer | Customer detail | `merchant.customer_new` |

#### Existing Services
- `services/api/orders.ts` - Order management
- `services/api/products.ts` - Product/inventory
- `services/api/payments.ts` - Payment tracking

#### Integration Points
```
File: services/api/orders.ts
Action: Add REZ Mind call on order received

File: services/api/products.ts
Action: Add REZ Mind call on stock low

File: services/api/payments.ts
Action: Add REZ Mind call on payment received
```

#### Code Changes Required
```typescript
// services/api/orders.ts
async function createOrder(orderData) {
  const order = await backend.createOrder(orderData);

  // Send to REZ Mind
  await rezMind.merchant.sendOrderCompleted({
    merchant_id: order.merchantId,
    order_id: order.id,
    customer_id: order.customerId,
    items: order.items,
    total_amount: order.total
  });

  return order;
}
```

#### Files to Modify
1. `services/api/orders.ts` - Add order event
2. `services/api/products.ts` - Add inventory event
3. `services/api/payments.ts` - Add payment event
4. `app/orders/live.tsx` - Trigger on new order
5. `app/products/stock-alerts.tsx` - Trigger on stock low

---

### 2.2 rez-restopapa

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-restopapa`
**Priority:** **HIGH**
**Status:** Restaurant-focused, needs integration

#### Key Events
| Event | Trigger |
|-------|---------|
| `merchant.order` | Order received |
| `merchant.inventory_low` | Stock below threshold |
| `merchant.review` | New review received |

---

### 2.3 rez-pms-app

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-pms-app`
**Priority:** **MEDIUM**
**Status:** Hotel PMS, needs integration

#### Key Events
| Event | Trigger |
|-------|---------|
| `merchant.booking` | Booking created |
| `merchant.checkin` | Guest checked in |
| `merchant.checkout` | Guest checked out |
| `merchant.service` | Room service ordered |

---

## SECTION 3: BACKEND SERVICES

### 3.1 rez-order-service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-order-service`
**Repo:** `imrejaul007/rez-order-service`
**Priority:** **HIGH**
**Status:** **HAS existing intent tracking via `intentCaptureService.ts`**

#### Current State
- Uses `intentCaptureService.ts` to track order lifecycle
- Already sends to `INTENT_CAPTURE_URL`
- Tracks: order.placed, order.confirmed, order.cancelled

#### Upgrade Required
```
Action: Redirect intent tracking to REZ Mind Event Platform

Current: Sends to Intent Graph
Target: Send to Event Platform + Intelligence
```

#### Key Routes
| Route | File | Current Tracking |
|--------|------|-----------------|
| POST /orders | `src/routes/orders.ts` | order.placed |
| PATCH /orders/:id/status | `src/routes/orders.ts` | order.status_changed |
| POST /orders/:id/cancel | `src/routes/orders.ts` | order.cancelled |

#### Event Bus Events
- `order.created`
- `order.updated`
- `order.cancelled`
- `order.completed`
- `order.status_changed`

#### Upgrade Code
```typescript
// src/services/intentCaptureService.ts

// Already exists - just redirect to REZ Mind
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

async captureIntent(intent: string, data: any) {
  // Keep existing intent tracking
  await this.sendToIntentGraph(intent, data);

  // Add REZ Mind
  await this.sendToRezMind(intent, data);
}
```

---

### 3.2 rez-search-service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-search-service`
**Priority:** **HIGH**
**Status:** **HAS existing intent tracking**

#### Current State
- Has `intentCaptureService.ts`
- Tracks: search.query, search.result_clicked

#### Key Routes
| Route | File | Current Tracking |
|--------|------|-----------------|
| GET /search | `src/routes/search.ts` | search.query |
| GET /search/suggestions | `src/routes/search.ts` | search.suggest |

#### Upgrade Required
```typescript
// src/services/intentCaptureService.ts

async captureSearch(userId: string, query: string, results: any) {
  // Send to REZ Mind
  await fetch(`${REZ_MIND_URL}/webhook/consumer/search`, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      query,
      results_count: results.length
    })
  });
}
```

---

### 3.3 rez-payment-service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-payment-service`
**Priority:** **MEDIUM**
**Status:** NO existing event tracking

#### Key Routes
| Route | Event to Add |
|-------|--------------|
| POST /initiate | `merchant.payment` on success |
| POST /webhook | `merchant.payment` on payment webhook |

#### Integration Required
```typescript
// On payment success
await rezMind.merchant.sendPaymentSuccess({
  merchant_id: payment.merchantId,
  transaction_id: payment.transactionId,
  amount: payment.amount
});
```

---

### 3.4 rez-catalog-service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-catalog-service`
**Priority:** **LOW**
**Status:** NO existing event tracking

#### Key Routes
| Route | Event to Add |
|-------|--------------|
| GET /products/:id | `consumer.view` |

---

### 3.5 rez-marketing-service

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-marketing-service`
**Priority:** **MEDIUM**
**Status:** AdBazaar integration exists

#### Key Routes
| Route | File | Description |
|-------|------|-------------|
| POST /adbazaar/broadcast | `src/routes/adbazaar.ts` | AdBazaar integration |

#### AdBazaar Integration
- Already integrated with AdBazaar
- Routes marketing campaigns through AdBazaar service

---

## SECTION 4: INTEGRATION IMPLEMENTATION PLAN

### Phase 1: Critical Path (Week 1)

```
┌─────────────────────────────────────────────────────────────────────┐
│ REZ Mind Event Platform must be deployed first                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 1. rez-order-service    - Upgrade existing intent to REZ Mind     │
│ 2. rez-search-service  - Upgrade existing intent to REZ Mind     │
│ 3. rez-app-consumer     - Add REZ Mind to intentCaptureService   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. rez-app-merchant    - Add inventory, order, payment events   │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Supporting (Week 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 5. rez-now            - Add scan, order, view events             │
│ 6. rez-payment-service - Add payment events                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Extended (Week 3-4)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 7. rez-web-menu      - Add search, view, order events            │
│ 8. rendez            - Add booking, profile events               │
│ 9. rez-restopapa     - Add restaurant-specific events             │
│ 10. rez-pms-app      - Add hotel booking events                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 5: FILE-BY-FILE INTEGRATION GUIDE

### Consumer App (rez-app-consumer)

#### File: `app/services/intentCaptureService.ts`
```typescript
// Add REZ Mind endpoint
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

async sendToReZMind(event: string, data: any) {
  const endpoints = {
    'search': '/webhook/consumer/search',
    'view': '/webhook/consumer/view',
    'order': '/webhook/consumer/order',
    'booking': '/webhook/consumer/booking'
  };

  try {
    await fetch(`${REZ_MIND_URL}${endpoints[event]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: 'rez-app-consumer'
      })
    });
  } catch (error) {
    console.error('REZ Mind error:', error);
  }
}

// Call on events
async captureProductView(userId: string, productId: string, duration: number) {
  await this.sendToReZMind('view', {
    user_id: userId,
    item_id: productId,
    duration_seconds: duration
  });
}

async captureSearch(userId: string, query: string, resultsCount: number) {
  await this.sendToReZMind('search', {
    user_id: userId,
    query,
    results_count: resultsCount
  });
}

async captureOrder(userId: string, order: Order) {
  await this.sendToReZMind('order', {
    user_id: userId,
    order_id: order.id,
    merchant_id: order.merchantId,
    items: order.items,
    total_amount: order.total
  });
}
```

#### File: `app/search.tsx`
```typescript
// Add after search results load
useEffect(() => {
  if (searchQuery && results.length > 0) {
    intentCaptureService.captureSearch(userId, searchQuery, results.length);
  }
}, [searchQuery, results]);
```

#### File: `app/product-page.tsx`
```typescript
// Add on product view
useEffect(() => {
  const startTime = Date.now();
  return () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    intentCaptureService.captureProductView(userId, productId, duration);
  };
}, [productId]);
```

#### File: `app/checkout.tsx`
```typescript
// Add on order success
const handleOrderSuccess = async (order: Order) => {
  // Existing order creation
  await createOrder(order);

  // Add REZ Mind
  intentCaptureService.captureOrder(userId, order);
};
```

---

### Merchant App (rez-app-merchant)

#### File: `services/api/orders.ts`
```typescript
import { rezMind } from '@/services/rezMind';

export async function createOrder(orderData: OrderData) {
  const order = await api.post('/orders', orderData);

  // Send to REZ Mind
  if (order.status === 'received') {
    await rezMind.merchant.sendOrderCompleted({
      merchant_id: orderData.merchantId,
      order_id: order.id,
      customer_id: order.customerId,
      items: orderData.items,
      total_amount: order.total,
      payment_method: order.paymentMethod
    });
  }

  return order;
}
```

#### File: `services/api/products.ts`
```typescript
import { rezMind } from '@/services/rezMind';

export async function updateStock(productId: string, newStock: number, threshold: number) {
  const product = await api.patch(`/products/${productId}`, { stock: newStock });

  // Send to REZ Mind if below threshold
  if (newStock <= threshold) {
    await rezMind.merchant.sendInventoryLow({
      merchant_id: currentMerchantId,
      item_id: productId,
      item_name: product.name,
      current_stock: newStock,
      threshold
    });
  }

  return product;
}
```

#### File: `services/api/payments.ts`
```typescript
import { rezMind } from '@/services/rezMind';

export async function confirmPayment(paymentId: string, amount: number) {
  const payment = await api.post(`/payments/${paymentId}/confirm`, { amount });

  // Send to REZ Mind
  await rezMind.merchant.sendPaymentSuccess({
    merchant_id: currentMerchantId,
    transaction_id: paymentId,
    amount
  });

  return payment;
}
```

---

### Backend Service (rez-order-service)

#### File: `src/services/intentCaptureService.ts`
```typescript
// Add REZ Mind redirect
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';

async captureAndForward(intent: string, data: any) {
  // Keep existing
  await this.captureIntent(intent, data);

  // Add REZ Mind forwarding
  try {
    await fetch(`${REZ_MIND_URL}/webhook/merchant/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: data.merchantId,
        order_id: data.orderId,
        items: data.items,
        total_amount: data.total,
        event: intent
      })
    });
  } catch (error) {
    console.error('REZ Mind forward error:', error);
  }
}
```

---

## SECTION 6: ENVIRONMENT VARIABLES

### Add to each app/service

```bash
# REZ Mind Event Platform
REZ_MIND_URL=http://localhost:4008  # Local
REZ_MIND_URL=https://rez-event-platform.onrender.com  # Production

# Or for frontend apps (Expo/Next.js)
EXPO_PUBLIC_REZ_MIND_URL=http://localhost:4008
NEXT_PUBLIC_REZ_MIND_URL=http://localhost:4008
```

---

## SECTION 7: TESTING CHECKLIST

### Local Testing
```bash
# 1. Start Event Platform
cd rez-event-platform && npm run dev

# 2. Check health
curl http://localhost:4008/health

# 3. Send test event
curl -X POST http://localhost:4008/webhook/merchant/order \
  -H "Content-Type: application/json" \
  -d '{"merchant_id":"test","order_id":"123","total_amount":500}'

# 4. Verify in logs
# Should see event in Event Platform logs
```

### Integration Testing
```bash
# Test each integration point:

# Consumer app - Search
curl -X POST http://localhost:4008/webhook/consumer/search \
  -d '{"user_id":"u1","query":"biryani","results_count":15}'

# Consumer app - View
curl -X POST http://localhost:4008/webhook/consumer/view \
  -d '{"user_id":"u1","item_id":"biryani_001","duration_seconds":30}'

# Consumer app - Order
curl -X POST http://localhost:4008/webhook/consumer/order \
  -d '{"user_id":"u1","order_id":"o123","total_amount":580}'

# Merchant app - Inventory
curl -X POST http://localhost:4008/webhook/merchant/inventory \
  -d '{"merchant_id":"m1","item_id":"biryani","current_stock":3,"threshold":5}'

# Merchant app - Payment
curl -X POST http://localhost:4008/webhook/merchant/payment \
  -d '{"merchant_id":"m1","transaction_id":"t123","amount":580}'
```

---

## SECTION 8: ROLLBACK PLAN

### If REZ Mind causes issues:

1. **Disable via Feature Flag**
   ```bash
   curl -X POST http://localhost:4030/flags/rez_mind_enabled/disable
   ```

2. **Code Rollback**
   - Remove REZ Mind calls from each file
   - Revert to previous version

3. **Environment Variable**
   - Set `REZ_MIND_ENABLED=false`
   - Services stop sending

---

## SECTION 9: COMPLETE FILE LIST

### Files to Modify

#### Consumer Apps
| App | File | Change |
|-----|------|--------|
| rez-app-consumer | `app/services/intentCaptureService.ts` | Add REZ Mind endpoint |
| rez-app-consumer | `app/search.tsx` | Add search event |
| rez-app-consumer | `app/product-page.tsx` | Add view event |
| rez-app-consumer | `app/checkout.tsx` | Add order event |
| rez-now | `app/scan/page.tsx` | Add scan event |
| rez-now | `app/[storeSlug]/page.tsx` | Add view event |
| rez-now | `app/[storeSlug]/checkout/page.tsx` | Add order event |

#### Merchant Apps
| App | File | Change |
|-----|------|--------|
| rez-app-merchant | `services/api/orders.ts` | Add order event |
| rez-app-merchant | `services/api/products.ts` | Add inventory event |
| rez-app-merchant | `services/api/payments.ts` | Add payment event |

#### Backend Services
| Service | File | Change |
|---------|------|--------|
| rez-order-service | `src/services/intentCaptureService.ts` | Redirect to REZ Mind |
| rez-search-service | `src/services/intentCaptureService.ts` | Redirect to REZ Mind |
| rez-payment-service | `src/routes/payment.ts` | Add payment event |

---

## SUMMARY

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ INTEGRATION SUMMARY ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  ║
║ FILES TO MODIFY: 20+ ║
║  ║
║ PHASE 1: 3 apps/services (Critical) ║
║ ├── rez-order-service ║
║ ├── rez-search-service ║
║ └── rez-app-consumer ║
║  ║
║ PHASE 2: 2 apps/services ║
║ ├── rez-app-merchant ║
║ └── rez-now ║
║  ║
║ PHASE 3: 5 apps/services ║
║ ├── rez-payment-service ║
║ ├── rez-web-menu ║
║ ├── rendez ║
║ ├── rez-restopapa ║
║ └── rez-pms-app ║
║  ║
║ TOTAL: ~15-20 files ║
║ ESTIMATED TIME: 1-2 weeks ║
║  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

Last updated: 2026-05-01
