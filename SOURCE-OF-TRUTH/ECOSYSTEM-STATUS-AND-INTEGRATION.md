# ReZ Ecosystem — Full Product Status & ReZ Mind Integration Guide

**Updated:** 2026-04-28

---

## Part 1: ReZ Mind (Intent Graph) — What's Live

### Deployed Services

| Service | URL | GitHub |
|---------|-----|--------|
| **rez-intent-api** | https://rez-intent-graph.onrender.com | github.com/imrejaul007/rez-intent-graph |
| **rez-intent-agent** | https://rez-intent-agent.onrender.com | github.com/imrejaul007/rez-intent-graph |
| **npm package** | `rez-intent-graph@0.2.0` | npmjs.com/package/rez-intent-graph |

### Credentials

```bash
INTERNAL_SERVICE_TOKEN=g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o=
CRON_SECRET=6neTfu9UW+UwJoA5NbbUpikSKdFm8GMqRZCFjRtIT3c=
```

### API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `POST /api/intent/capture` | None (open) | Capture user intent |
| `GET /api/intent/user/:userId/active` | `x-internal-token` | Get active intents |
| `GET /api/intent/user/:userId/dormant` | `x-internal-token` | Get dormant intents |
| `POST /api/intent/nudge/send` | `x-internal-token` | Send nudge |
| `POST /api/intent/dormant/detect` | `x-cron-secret` | Trigger dormant detection |
| `GET /health` | None | Health check |

---

## Part 2: Product Deployment Status

### Currently LIVE (Deployed)

| Product | URL | Deploy | Git |
|---------|-----|--------|-----|
| **ReZ App Consumer** | EAS Build | Expo EAS | github.com/imrejaul007/rez-app |
| **ReZ App Admin** | https://rez-app-admin.vercel.app | Vercel | github.com/imrejaul007/rez-app-admin |
| **ReZ App Merchant** | https://rez-app-marchant.vercel.app | Vercel | github.com/imrejaul007/rez-app-merchant |
| **ReZ Web Menu** | https://menu.rez.money | Vercel | |
| **ReZ Merchants (OS)** | Vercel | Vercel | |
| **AdBazaar** | Vercel | Vercel | github.com/imrejaul007/adBazaar |
| **Hotel PMS** | Render | Render (Docker) | github.com/imrejaul007/ReZ-Hotel-pms |
| **Hotel OTA API** | Render | Render | github.com/imrejaul007/hotel-ota |
| **StayOwn** | Expo (mobile) | Expo EAS | Part of Hotel OTA monorepo |
| **rez-api-gateway** | https://rez-api-gateway.onrender.com | Render | |
| **rez-backend** | https://rez-backend-8dfu.onrender.com | Render | |
| **rez-auth-service** | https://rez-auth-service.onrender.com | Render | |
| **rez-merchant-service** | https://rez-merchant-service-n3q2.onrender.com | Render | |
| **rez-wallet-service** | https://rez-wallet-service-36vo.onrender.com | Render | |
| **rez-payment-service** | https://rez-payment-service.onrender.com | Render | |
| **rez-order-service** | https://rez-order-service-hz18.onrender.com | Render | |
| **rez-catalog-service** | https://rez-catalog-service-1.onrender.com | Render | |
| **rez-search-service** | https://rez-search-service.onrender.com | Render | |
| **rez-gamification-service** | https://rez-gamification-service-3b5d.onrender.com | Render | |
| **rez-ads-service** | https://rez-ads-service.onrender.com | Render | |
| **rez-marketing-service** | https://rez-marketing-service.onrender.com | Render | |
| **rez-intent-api** | https://rez-intent-graph.onrender.com | Render | |
| **rez-intent-agent** | https://rez-intent-agent.onrender.com | Render | |
| **rez-karma-service** | https://rez-karma-service.onrender.com | Render | |
| **analytics-events** | https://analytics-events-37yy.onrender.com | Render | |
| **rez-notification-events** | https://rez-notification-events-mwdz.onrender.com | Render | |
| **rez-media-events** | https://rez-media-events-lfym.onrender.com | Render | |

### NOT YET DEPLOYED

| Product | Dir | Deploy Target | Blockers | Status |
|---------|-----|-------------|----------|--------|
| **ReZ Now** | `rez-now/` | Vercel | NONE — all committed, `.env.local` in `.gitignore` | FIXED — commits `077e6f5`, `8cf5442` |
| **Rendez** | `Rendez/` | Render + Vercel | NONE — committed, `.env.local` in `.gitignore` | FIXED — commit `66ed553` |
| **NextaBiZ** | `nextabizz/` | Vercel | NONE — `vercel.json` fixed | FIXED — commit `86e2c24` |

### Room QR — NOT a Separate Product

Room QR is a **feature inside Hotel OTA**, not a standalone product. It connects via:

```
Room QR Scan → Hotel OTA (RoomHub) → Hotel PMS (service requests)
```

Access points:
- **StayOwn App** → Navigate to active booking → Room Hub
- **ReZ Now** → Hotel store page → Room-specific services (being built)
- **StayOwn web** → `https://stayown.app/room-hub`

### StayOwn — Part of Hotel OTA

StayOwn is the **mobile Expo app** inside the Hotel OTA monorepo:
- **Dir:** `Hotel OTA/apps/mobile/`
- **Package:** `@hotel-ota/mobile` (Expo SDK 52)
- **Deploy:** Expo EAS (mobile app, not web)

---

## Part 3: Deployment Fixes — All Resolved (2026-04-28)

### 3.1: NextaBiZ — FIXED
**File:** `nextabizz/apps/web/vercel.json` — duplicate `regions` key removed.
**Commit:** `86e2c24` pushed to `https://github.com/imrejaul007/nextabizz`

### 3.2: ReZ Now — FIXED
**Commit:** `077e6f5` pushed to `https://github.com/imrejaul007/rez-now.git` (48 files)
**Intent capture:** `lib/services/intentCaptureService.ts` added — `8cf5442`
**Vercel env vars to set in Vercel dashboard:**
- `NEXT_PUBLIC_API_URL` → `https://rez-api-gateway.onrender.com/api`
- `NEXT_PUBLIC_SOCKET_URL` → WebSocket endpoint
- `NEXT_PUBLIC_ANALYTICS_URL` → Analytics endpoint
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` → Razorpay live key
- `NEXT_PUBLIC_INTENT_CAPTURE_URL` → `https://rez-intent-graph.onrender.com`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → Push notification VAPID key
- `NEXT_PUBLIC_APP_NAME` → ReZ Now

### 3.3: Rendez — FIXED
**81 files** committed as `66ed553` pushed to `https://github.com/imrejaul007/Rendez.git`
- rendez-admin, rendez-app, rendez-backend all committed
- `.env.local` already in `.gitignore` (secrets not tracked)
- Intent capture service already exists in `rendez-backend/src/services/intentCapture.service.ts`

**Fix for secrets:**
```bash
cd Rendez
git checkout -- rendez-admin/.env.local   # Unstage admin secrets
```

**For deployment, the render.yaml is already configured.** Push backend to GitHub → Render auto-deploys.

**Vercel env vars for `rendez-admin` (set in Vercel dashboard):**
- `NEXT_PUBLIC_API_URL` → `https://rendez-backend.onrender.com`

**Render env vars (set in Render dashboard for rendez-backend):**
- `REDIS_URL`
- `REZ_PARTNER_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

### 3.4: Hotel PMS — FIXED
**Commit:** `398e674` — `autoDeploy: true` for both services
**Intent capture:** `1432920` — service request tracking wired into `guestServices.js` and `staffServicesController.js`
- `backend/src/services/intentCaptureService.ts` created
- `INTENT_CAPTURE_URL` env var added to `render.yaml`
**GitHub:** `https://github.com/imrejaul007/ReZ-Hotel-pms`

---

## Part 4: ReZ Mind Integration Guide

### 4.1: How Intent Capture Works

Every product captures user intents by calling the `/api/intent/capture` endpoint. This is a **fire-and-forget** call — it never blocks the user experience.

```
User Action → Analytics Event → Intent Capture → ReZ Mind API
                                             ↓
                                    MongoDB (Intent Graph)
                                             ↓
                                    Dormant Detection (daily cron)
                                             ↓
                                    Nudge Delivery (push/email)
```

### 4.2: Add Intent Capture to Any Product

**Step 1: Add the env var**

```bash
NEXT_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
```

**Step 2: Add capture function**

Create a file `services/intentCaptureService.ts` (or `lib/intentCapture.ts`):

```typescript
const INTENT_CAPTURE_URL = process.env.NEXT_PUBLIC_INTENT_CAPTURE_URL || '';

const EVENT_TO_INTENT_MAP: Record<string, { eventType: string; category: string; confidence: number }> = {
  // Adjust these based on your product's events
  search: { eventType: 'search', category: 'GENERAL', confidence: 0.15 },
  view: { eventType: 'view', category: 'GENERAL', confidence: 0.25 },
  wishlist: { eventType: 'wishlist', category: 'GENERAL', confidence: 0.30 },
  cart_add: { eventType: 'cart_add', category: 'GENERAL', confidence: 0.60 },
  checkout_start: { eventType: 'checkout_start', category: 'GENERAL', confidence: 0.80 },
  order_placed: { eventType: 'fulfilled', category: 'GENERAL', confidence: 1.0 },
};

export async function captureIntent(params: {
  userId: string;
  eventType: string;
  category: string;
  intentKey: string;
  metadata?: Record<string, unknown>;
  appType: string;
}): Promise<void> {
  if (!INTENT_CAPTURE_URL) return;
  try {
    await fetch(`${INTENT_CAPTURE_URL}/api/intent/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        appType: params.appType,
        eventType: params.eventType,
        category: params.category,
        intentKey: params.intentKey,
        metadata: params.metadata,
      }),
    });
  } catch {
    // Never throw — intent capture must never break UX
  }
}

export function track(params: {
  userId: string;
  event: string;
  appType: string;
  intentKey: string;
  properties?: Record<string, unknown>;
}): void {
  const config = EVENT_TO_INTENT_MAP[params.event];
  if (!config || !params.userId) return;
  captureIntent({
    userId: params.userId,
    appType: params.appType,
    eventType: config.eventType,
    category: config.category,
    intentKey: params.intentKey,
    metadata: params.properties,
  }).catch(() => {});
}
```

**Step 3: Wire it into your analytics**

Call `track()` from your existing analytics/event handlers:

```typescript
// Example: in your analytics track function
import { track } from '@/services/intentCaptureService';

// In your track() function:
track({
  userId: user.id,
  event: 'view',
  appType: 'your_product_name',
  intentKey: `product_${productId}`,
  properties: { category: 'electronics' },
});
```

**Step 4: Set env var in deployment**

Add `NEXT_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com` to:
- Vercel: Project Settings → Environment Variables
- Render: Service → Environment → Add Environment Variable
- Expo EAS: `eas secret:create` or `.env` for local

### 4.3: Product-Specific Integration

#### ReZ Now

**Status:** Code already exists at `lib/analytics/events.ts`
**Env var needed:** `NEXT_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com`
**Where to set:** Vercel dashboard

**appType:** `restaurant`
**Category:** `DINING`

```typescript
// Already wired — just set the env var in Vercel
// Event map in lib/analytics/events.ts lines 34-49
// captureIntentFromEvent() calls /api/intent/capture on lines 98-123
```

#### ReZ App Consumer

**Status:** Code already exists at `services/intentCaptureService.ts`
**Env var needed:** `NEXT_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com`
**Where to set:** EAS secret or build environment

**appType:** `hotel_ota`
**Category:** `TRAVEL`

```typescript
// Already wired — just set the env var
// Supports: captureFlightIntent, captureHotelIntent, captureTrainIntent,
// captureCabIntent, captureBillIntent
```

#### Hotel OTA

**Status:** Code already exists (intent capture via Hotel OTA API)
**Env var needed:** Already uses `INTENT_CAPTURE_URL` env var
**Where to set:** Render dashboard for hotel-ota-api

**appType:** `hotel_ota`
**Category:** `TRAVEL`

**Events to capture:**
- `hotel_search` → search
- `hotel_view` → view
- `booking_hold_created` → hold
- `booking_confirmed` → fulfilled
- `booking_cancelled` → abandoned

#### Room QR (Hotel OTA)

**Status:** Part of Hotel OTA — no separate integration needed
**appType:** `hotel_ota`
**Category:** `HOTEL_SERVICE`

**Events to capture:**
- QR scan → intent capture (scan event)
- Service request created → intent update
- Order placed → fulfilled

#### Rendez

**Status:** Intent capture service exists in `rendez-backend/src/services/intentCapture.service.ts`
**Priority:** LOW

**appType:** `rendez`
**Category:** `GENERAL`

**Events to capture:**
- User signup → search (finding people)
- Profile viewed → view
- Match created → cart_add equivalent
- Message sent → checkout_start equivalent
- Meetup created → fulfilled

#### NextaBiZ

**Status:** INTEGRATED — commit `ad4d480`
**Priority:** MEDIUM (has supplier/merchant flow)

**appType:** `nextabizz`
**Category:** `RETAIL`

**Events to capture:**
- Product search → search
- Product view → view
- Inquiry sent → wishlist
- Order/reorder → checkout_start / fulfilled

#### AdBazaar

**Status:** INTEGRATED — commit `2a6976c`
**Priority:** MEDIUM (has listing/bidding flow)

**appType:** `adbazaar`
**Category:** `RETAIL`

**Events to capture:**
- Listing viewed → view
- Offer made → hold
- Campaign created → fulfilled
- Listing searched → search

#### Hotel PMS

**Status:** INTEGRATED — commit `1432920`
**Priority:** LOW (B2B product)

**appType:** `hotel_pms`
**Category:** `HOTEL_SERVICE`

**Events to capture:**
- Service request created → search
- Staff assigned → view
- Request completed → fulfilled

#### StayOwn (Mobile)

**Status:** Part of Hotel OTA — shares API
**See:** Hotel OTA integration above

#### ReZ Web Menu

**Status:** INTEGRATED — commit `8cf5442` (same repo as ReZ Now)
**Priority:** MEDIUM

**appType:** `web_menu`
**Category:** `DINING`

#### ReZ Merchants OS (ReZ Merchant App)

**Status:** INTEGRATED — commit `dc19d94` (app) + `9b12ff1` (service)
**Priority:** MEDIUM (merchant side)

**appType:** `merchant_os`
**Category:** `GENERAL`

**Events to capture:**
- Menu viewed → view
- Order received → fulfilled
- Review received → cart_add equivalent

#### Karma

**Status:** INTEGRATED — commit `76c3e97`
**Priority:** LOW

**appType:** `karma`
**Category:** `GENERAL`

---

## Part 5: Existing Infrastructure (No Changes Needed)

These services use **Redis Pub/Sub** — no HTTP calls to intent graph, no env vars needed:

| Service | Integration Type | Works via |
|---------|-----------------|-----------|
| **rez-order-service** | Redis Pub/Sub | `intent-graph:*` channels |
| **rez-wallet-service** | Redis Pub/Sub | `intent-graph:*` channels |

---

## Part 6: Integration Checklist by Product

### Already Has Intent Capture Code
- [x] **ReZ Now** — Set `NEXT_PUBLIC_INTENT_CAPTURE_URL` in Vercel
- [ ] **ReZ App Consumer** — Set `NEXT_PUBLIC_INTENT_CAPTURE_URL` in EAS/Expo
- [ ] **Hotel OTA** — Already configured in render.yaml
- [x] **Rendez** — Already has `intentCapture.service.ts` in `rendez-backend/src/services/`

### Intent Capture Added (2026-04-28)
- [x] **NextaBiZ** — `apps/web/lib/intentCaptureService.ts` wired to catalog, RFQs, signals, PO creation. Commit `ad4d480`
- [x] **AdBazaar** — `src/services/intentCaptureService.ts` wired to browse, listing, inquiry, campaign creation. Commit `2a6976c`
- [x] **ReZ Web Menu** — `lib/services/intentCaptureService.ts` wired to analytics events. Commit `8cf5442`
- [x] **ReZ Merchant App (marchant)** — `services/intentCaptureService.ts` wired to live order socket. Commit `dc19d94`
- [x] **Hotel PMS** — `backend/src/services/intentCaptureService.ts` wired to guestServices. Commit `1432920`
- [x] **Karma** — `src/services/intentCapture.service.ts` wired to missionEngine, batchService, earnRecordService. Commit `76c3e97`

### Still Needs Intent Capture
- [ ] **ReZ App Consumer** — Set `NEXT_PUBLIC_INTENT_CAPTURE_URL` in EAS secrets
- [ ] **Hotel OTA** — Verify `INTENT_CAPTURE_URL` is set in Render dashboard
- [ ] **ReZ Merchant Service** (backend) — Consider adding HTTP intent capture for order events

### Not a Separate Deploy
- [ ] **Room QR** — Part of Hotel OTA, no separate integration
- [ ] **StayOwn** — Part of Hotel OTA (Expo mobile app)

---

## Part 7: Env Var Summary for ReZ Mind

Only add these if your product makes **HTTP calls** to the intent graph API:

```bash
# For client-side products (Vercel, Expo, Next.js public env vars):
NEXT_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com

# For server-side services that call protected endpoints:
INTENT_API_URL=https://rez-intent-graph.onrender.com
INTENT_AGENT_URL=https://rez-intent-agent.onrender.com
INTERNAL_SERVICE_TOKEN=g+TH3fuUF5BMuXB14dTOx5OgmuxZ8ObtLhziqNx422o=
```

**Current products that need these:**
| Product | Env Var Needed | Where to Set |
|---------|---------------|--------------|
| ReZ Now | `NEXT_PUBLIC_INTENT_CAPTURE_URL` | Vercel |
| ReZ App Consumer | `NEXT_PUBLIC_INTENT_CAPTURE_URL` | EAS secret |
| Hotel OTA | `INTENT_CAPTURE_URL` | Render |

---

*Last Updated: 2026-04-27*
