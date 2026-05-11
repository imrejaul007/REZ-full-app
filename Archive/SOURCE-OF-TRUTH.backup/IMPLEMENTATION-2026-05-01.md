# ReZ Ecosystem - Implementation Plan 2026-05-01

**Based on:** Comprehensive Audit 2026-05-01
**Status:** READY TO EXECUTE
**Priority:** CRITICAL → HIGH → MEDIUM

---

## EXECUTIVE SUMMARY

From audit: **Overall Score 8.5/10**

| Category | Score | Gap |
|----------|-------|-----|
| ReZ Mind Integration | 9/10 | Not wired to services |
| Event Bus | 7/10 | No Kafka, gaps exist |
| Hotel Integration | 7/10 | OTA ↔ PMS not event-driven |
| NextaBiZ | 6/10 | UI incomplete |
| Automation | 0/10 | No service exists |

---

## PHASE 1: WIRE REZ MIND (CRITICAL)

### 1.1 Create Intent Capture Calls

**Files to modify:**
```
rez-order-service/src/services/orderService.ts
rez-payment-service/src/services/paymentService.ts
rez-wallet-service/src/services/walletService.ts
rez-merchant-service/src/services/merchantService.ts
rez-catalog-service/src/services/catalogService.ts
```

**Add to each:**
```typescript
import { captureIntent } from '@rez/intent-capture-sdk';

// After order created
await captureIntent({
  userId: order.userId,
  appType: 'restaurant',
  eventType: 'order_placed',
  intentKey: `order_${order._id}`,
  category: order.category,
  metadata: { amount: order.total, merchant: order.merchantId }
});
```

### 1.2 Create rez-insights-service

**New service:**
```
rez-insights-service/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── insights.routes.ts
│   ├── models/
│   │   └── Insight.ts
│   └── services/
│       └── insightService.ts
└── package.json
```

**Endpoints:**
- POST /api/insights - Store AI insight
- GET /api/insights/user/:userId - Get user insights
- GET /api/insights/merchant/:merchantId - Get merchant insights
- POST /api/insights/action - Take action on insight

### 1.3 Wire ReZ Mind Output

**Add to ReZ Mind:**
```typescript
// After generating insight, emit to event bus
await emitEvent('insight.generated', {
  userId,
  insightType,
  recommendation,
  confidence
});
```

**Subscribe in services:**
- Copilot UI → rez-insights-service → display
- Order service → check insights before checkout
- Marketing → apply recommended offers

---

## PHASE 2: EVENT BUS ENHANCEMENT

### 2.1 Add ReZ Mind as Consumer

**File:** rez-scheduler-service/src/eventBus.ts

**Add:**
```typescript
// ReZ Mind consumer
const mindConsumer = new Consumer('rez-mind', ['order.*', 'payment.*', 'wallet.*']);
mindConsumer.on('order.completed', async (event) => {
  await fetch(`${INTENT_API_URL}/api/intent/capture`, {
    method: 'POST',
    body: JSON.stringify({ eventType: 'conversion', ...event.data })
  });
});
```

### 2.2 Create rez-automation-service

**Purpose:** Rule engine for automated triggers

**Rules to implement:**
```typescript
const rules = [
  { trigger: 'customer.inactive_30_days', action: 'send_offer' },
  { trigger: 'inventory.low', action: 'create_po_draft' },
  { trigger: 'occupancy.high', action: 'increase_price' },
  { trigger: 'order.completed', action: 'update_leaderboard' },
  { trigger: 'payment.failed', action: 'notify_support' }
];
```

### 2.3 Hotel ↔ PMS Events

**File:** rez-hotel-service/src/bridge.ts

**Add events:**
```typescript
// After booking
await emitEvent('booking.created', { bookingId, hotelId, roomType });

// After check-in
await emitEvent('room.checked_in', { bookingId, roomId });

// After checkout
await emitEvent('room.checked_out', { bookingId, roomId });
```

---

## PHASE 3: INTEGRATION CLOSURE

### 3.1 NextaBiZ UI Completion

**Missing:**
- Supplier dashboard
- PO creation UI
- Order tracking UI

**Files to create:**
```
nextabizz/src/app/(dashboard)/
├── suppliers/
│   ├── page.tsx
│   └── [id]/page.tsx
├── orders/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
└── analytics/
    └── page.tsx
```

### 3.2 RestoPapa Integration Decision

**Options:**
1. **Integrate:** Migrate to ReZ auth, orders, wallet
2. **Document as standalone:** Clear separation

**Recommendation:** Document as standalone with optional integration path

### 3.3 Rendez Deployment

**Required:**
1. Deploy rendez-backend to Render
2. Configure MongoDB
3. Set up Socket.io
4. Deploy rendez-consumer to Expo
5. Deploy rendez-admin

---

## PHASE 4: QUALITY IMPROVEMENTS

### 4.1 Refactor useWallet Hook

**Current issue:** Duplicate WalletContext

**Fix:**
```typescript
// hooks/useWallet.ts
export const useWallet = () => {
  const context = useWalletContext();
  // Add any additional logic here
  return context;
};
```

### 4.2 Migrate Auth to shared-types

**Current:** Local user.types.ts in rez-auth-service
**Target:** Import from @rez/shared-types

**Files to update:**
- rez-auth-service/src/types/user.types.ts
- shared-types/src/user.types.ts (add missing fields)

### 4.3 Package npm Publishing

**Priority order:**
1. shared-types
2. rez-shared
3. rez-intent-capture-sdk
4. rez-agent-memory

---

## TASK BREAKDOWN

### Task 1: Wire ReZ Mind Intent Capture
| Step | Action | Owner |
|------|--------|-------|
| 1.1 | Add intent capture to order service | Claude |
| 1.2 | Add intent capture to payment service | Claude |
| 1.3 | Add intent capture to wallet service | Claude |
| 1.4 | Add intent capture to merchant service | Claude |
| 1.5 | Test intent capture flow | Human |

### Task 2: Create rez-insights-service
| Step | Action | Owner |
|------|--------|-------|
| 2.1 | Scaffold service structure | Claude |
| 2.2 | Create Insight model | Claude |
| 2.3 | Create API routes | Claude |
| 2.4 | Wire to ReZ Mind output | Claude |
| 2.5 | Deploy to Render | Human |
| 2.6 | Test with sample insights | Human |

### Task 3: Create rez-automation-service
| Step | Action | Owner |
|------|--------|-------|
| 3.1 | Scaffold service | Claude |
| 3.2 | Define rule engine | Claude |
| 3.3 | Create rule definitions | Claude |
| 3.4 | Wire to event bus | Claude |
| 3.5 | Deploy | Human |

### Task 4: Hotel ↔ PMS Events
| Step | Action | Owner |
|------|--------|-------|
| 4.1 | Update bridge.ts with events | Claude |
| 4.2 | Add consumer in hotel-pms | Claude |
| 4.3 | Test booking flow | Human |

### Task 5: NextaBiZ UI
| Step | Action | Owner |
|------|--------|-------|
| 5.1 | Create supplier pages | Claude |
| 5.2 | Create order pages | Claude |
| 5.3 | Add analytics dashboard | Claude |
| 5.4 | Wire to backend | Claude |
| 5.5 | Test | Human |

### Task 6: Quality Fixes
| Step | Action | Owner |
|------|--------|-------|
| 6.1 | Refactor useWallet | Claude |
| 6.2 | Migrate auth types | Claude |
| 6.3 | Publish packages | Human |

---

## ESTIMATED TIME

| Task | Effort | Priority |
|------|--------|----------|
| Wire ReZ Mind | 4 hours | CRITICAL |
| rez-insights-service | 8 hours | HIGH |
| rez-automation-service | 8 hours | MEDIUM |
| Hotel events | 2 hours | HIGH |
| NextaBiZ UI | 16 hours | MEDIUM |
| Quality fixes | 4 hours | LOW |

**Total: 42 hours**

---

## ACCEPTANCE CRITERIA

### Phase 1 Complete When:
- [ ] Order creates intent in ReZ Mind
- [ ] Payment creates intent in ReZ Mind
- [ ] rez-insights-service stores AI outputs
- [ ] Copilot UI shows recommendations

### Phase 2 Complete When:
- [ ] ReZ Mind consumes events
- [ ] Automation rules trigger
- [ ] Hotel events flow both ways

### Phase 3 Complete When:
- [ ] NextaBiZ supplier UI complete
- [ ] RestoPapa decision documented
- [ ] Rendez deployed

---

**Created:** 2026-05-01
**Status:** READY FOR EXECUTION
