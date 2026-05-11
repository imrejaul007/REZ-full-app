# REZ MIND - APP INTEGRATIONS
**Version:** 1.1
**Date:** May 6, 2026

---

## OVERVIEW

ReZ Mind connects ALL apps in the ReZ ecosystem, sharing:
- **User Intent** - What users want across all apps
- **Behavioral Data** - How users behave
- **Commerce Memory** - Transaction history
- **AI Intelligence** - Learned patterns and predictions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REZ MIND                                       │
│                    (Shared Intelligence Layer)                              │
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Do App   │  │   Support   │  │  WhatsApp   │  │  Merchant   │       │
│   │  (do-app)  │  │   Copilot   │  │  Commerce   │  │   Apps      │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │             │
│          ├────────────────┼────────────────┼────────────────┤             │
│          │                │                │                │             │
│          │  ┌─────────────┴────────────────┴─────────────┐ │             │
│          │  │                                        │ │             │
│          │  │   UNIFIED MESSAGING PLATFORM (Chat)     │ │             │
│          │  │   (ReZ Unified Chat Component)         │ │             │
│          │  └─────────────────────────────────────────┘ │             │
│          │                │                │                │             │
│          └────────────────┴────────────────┴────────────────┘             │
│                                    │                                        │
│                                    ▼                                        │
│                    ┌───────────────────────────────────────┐               │
│                    │         CROSS-APP INTELLIGENCE       │               │
│                    │                                        │               │
│                    │  • Unified user profile              │               │
│                    │  • Shared intent signals             │               │
│                    │  • Cross-app recommendations        │               │
│                    │  • Dormant intent detection          │               │
│                    │  • Personalized nudges                │               │
│                    └───────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. DO APP INTEGRATION

**Location:** `/do-app/`

### What is Do App?
- Food delivery and ordering app
- Restaurant discovery and ordering
- Wallet and payments
- Order tracking

### ReZ Mind Integration

**File:** `do-app/do-backend/src/integrations/rezMindIntegration.ts`

```typescript
// Initialize ReZ Mind
import { ReZMindIntegration } from './integrations/rezMindIntegration';

const rezMind = new ReZMindIntegration();

// Capture user search intent
await rezMind.captureIntent({
  userId: 'user_123',
  intent: 'pizza_delivery',
  entities: { cuisine: 'italian', location: 'mumbai' },
  context: { device: 'mobile', time: 'evening' }
});

// Record transaction
await rezMind.recordTransaction({
  userId: 'user_123',
  transactionId: 'txn_456',
  type: 'purchase',
  category: 'food',
  amount: 500
});

// Get cross-app recommendations
const recommendations = await rezMind.getRecommendations('user_123', {
  limit: 10,
  categories: ['restaurant', 'grocery']
});
```

### Data Shared with ReZ Mind

| Event Type | Description | ReZ Mind Use |
|-----------|-------------|--------------|
| `search` | Restaurant/food search | Intent tracking |
| `view` | Restaurant or dish viewed | Affinity building |
| `order_placed` | Order completed | Transaction tracking |
| `payment_success` | Payment successful | Revenue attribution |
| `review_submitted` | Rating given | Quality scoring |
| `reorder` | Repeat order | Loyalty detection |

### Data Received from ReZ Mind

| Data | Description |
|------|-------------|
| User affinities | Dining preferences from other apps |
| Dormant intents | Users who browsed but didn't order |
| Personalized offers | AI-generated discounts |
| Recommendations | Cross-category suggestions |

---

## 2. REZ SUPPORT COPILOT INTEGRATION

**Location:** `/REZ-support-copilot/`

### What is Support Copilot?
- AI-powered customer support dashboard
- Ticket management for support agents
- User history enrichment
- Sentiment analysis

### ReZ Mind Integration

**File:** `REZ-support-copilot/src/services/userContextService.ts`

```typescript
// Get user context from ReZ Mind
const userContext = await getUserContextFromReZMind(userId);

// Response includes:
{
  "userId": "user_123",
  "totalOrders": 45,
  "totalSpent": 12500,
  "lifetimeValue": "high",
  "activeIntents": [...],
  "dormantIntents": [...],
  "recentInteractions": [...],
  "sentiment": "neutral",
  "riskScore": 0.15,
  "supportTickets": [
    {
      "ticketId": "tkt_001",
      "issue": "Order delayed",
      "sentiment": "frustrated",
      "resolved": true
    }
  ]
}
```

### ReZ Mind Data Used by Support

| Data | Purpose |
|------|---------|
| Order history | Context for support conversations |
| Transaction patterns | Identify issues quickly |
| Sentiment history | Prioritize tickets |
| Lifetime value | Tier-based support |
| Active intents | Anticipate needs |
| Previous tickets | Avoid repeating solutions |

### Support Context Enrichment

```typescript
// When support agent opens a ticket:
const enrichedContext = await enrichSupportTicket(ticketId, {
  includeOrderHistory: true,
  includeIntentHistory: true,
  includeSentimentTimeline: true
});

// Result:
// - Agent sees full user story
// - Agent knows user's other support history
// - Agent can see why user might be frustrated
// - Agent can offer relevant solutions
```

---

## 3. WHATSAPP COMMERCE INTEGRATION

**Location:** `/rez-now/app/api/whatsapp/`

### What is WhatsApp Commerce?
- Conversational commerce via WhatsApp
- Order food without leaving WhatsApp
- Receive order updates
- Customer support via chat

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WHATSAPP COMMERCE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Customer                    WhatsApp                  ReZ Now Backend         │
│     │                           │                            │                │
│     │  "Order pizza"           │                            │                │
│     │────────────────────────▶│                            │                │
│     │                          │                            │                │
│     │                          │  POST /api/whatsapp/bot   │                │
│     │                          │──────────────────────────▶│                │
│     │                          │                            │                │
│     │                          │                            │──▶ ReZ Mind     │
│     │                          │                            │   (Intent)     │
│     │                          │                            │──▶ Do App      │
│     │                          │                            │   (Order)      │
│     │                          │                            │──▶ Wallet      │
│     │                          │                            │   (Payment)    │
│     │                          │                            │                │
│     │   🍕 Order confirmed!    │                            │                │
│     │   Delivering in 30 min  │                            │                │
│     │◀────────────────────────│                            │                │
│     │                          │                            │                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### WhatsApp Bot Capabilities

| Feature | Implementation |
|---------|---------------|
| **Order Food** | Natural language ordering |
| **Track Order** | Real-time status updates |
| **Get Recommendations** | AI-powered suggestions |
| **Customer Support** | Automated FAQ + escalation |
| **Promotions** | Personalized offers |
| **Reorder** | Quick reorder from history |

### ReZ Mind Integration in WhatsApp

**File:** `rez-now/app/api/whatsapp/bot/route.ts`

```typescript
// WhatsApp message processing
async function processMessage(message: WhatsAppMessage) {
  const { from, text, type } = message;

  // 1. Capture user intent in ReZ Mind
  await captureWhatsAppIntent({
    userId: from,
    message: text,
    source: 'whatsapp',
    timestamp: new Date()
  });

  // 2. Get user context from ReZ Mind
  const context = await getUserContext(from);
  // Includes: order history, affinities, preferences

  // 3. Generate AI response
  const response = await generateWhatsAppResponse(text, context);

  // 4. Send via WhatsApp API
  await sendWhatsAppMessage(from, response);

  // 5. Track in ReZ Mind
  await trackWhatsAppInteraction({
    userId: from,
    message: text,
    response: response.content,
    intent: context.detectedIntent,
    success: context.actionCompleted
  });
}
```

### WhatsApp Events Tracked

| Event | ReZ Mind Use |
|-------|--------------|
| `whatsapp_message_sent` | Engagement tracking |
| `whatsapp_order_placed` | Transaction recording |
| `whatsapp_cart_abandoned` | Intent (dormant detection) |
| `whatsapp_order_completed` | Revenue attribution |
| `whatsapp_support_request` | Support prioritization |

### WhatsApp Nudge Delivery

ReZ Mind can send nudges via WhatsApp:

```typescript
// When user has dormant intent
const nudge = {
  userId: 'user_123',
  channel: 'whatsapp',
  message: {
    type: 'text',
    content: '🍕 Hey! You searched for pizza last week. 20% off your first order this week!'
  },
  action: 'open_restaurant',
  metadata: {
    restaurantId: 'rest_001',
    discountCode: 'PIZZA20'
  }
};

await sendNudgeViaWhatsApp(nudge);
```

---

## 4. UNIFIED MESSAGING PLATFORM

**Location:** `/rez-unified-chat/`

### What is Unified Messaging Platform?
- React component library for chat interfaces
- Used across all ReZ apps: Do App, Merchant Apps, Web Menus
- WhatsApp-style conversational UI
- Supports orders, bookings, and enquiries
- AI-powered responses via Support Copilot

### Components

| Component | Purpose |
|-----------|---------|
| `UnifiedChat` | Main chat interface |
| `ChatBubble` | Message bubbles |
| `OrderFlow` | Order placement flow |
| `BookingFlow` | Booking flow |
| `QuickActions` | Quick reply buttons |

### Supported Contexts

| Context | Use Case |
|---------|----------|
| `qr_now` | QR code → Order at table |
| `hotel_room` | Hotel room service |
| `web_menu` | Web menu ordering |

### Message Types

```typescript
type MessageType = 'text' | 'order' | 'booking' | 'enquiry' | 'system';
type SenderType = 'user' | 'bot' | 'system';
```

### Chat Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED CHAT FLOW                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User                    UnifiedChat                  Support Copilot         │
│    │                          │                            │                  │
│    │  "Order pizza"          │                            │                  │
│    │────────────────────────▶│                            │                  │
│    │                          │                            │                  │
│    │                          │  Get menu + recommendations                   │
│    │                          │──────────────────────────▶│                  │
│    │                          │                            │                  │
│    │                          │◀──────────────────────────│                  │
│    │                          │  (AI-powered response)       │                  │
│    │                          │                            │                  │
│    │  Quick replies:          │                            │                  │
│    │  "View Menu" "Book"    │                            │                  │
│    │◀────────────────────────│                            │                  │
│    │                          │                            │                  │
│    │  "View Menu"           │                            │                  │
│    │────────────────────────▶│                            │                  │
│    │                          │                            │                  │
│    │                          │  Show menu items          │                  │
│    │                          │  (with AI recommendations) │                  │
│    │◀────────────────────────│                            │                  │
│    │                          │                            │                  │
│    │  Select items           │                            │                  │
│    │────────────────────────▶│                            │                  │
│    │                          │  Order flow              │                  │
│    │                          │──────────────────────────▶│                  │
│    │                          │                            │                  │
│    │  Order confirmed!        │                            │                  │
│    │◀────────────────────────│                            │                  │
│    │                          │  ReZ Mind captures intent│                  │
│    │                          │──────────────────────────▶│                  │
│    │                          │                            │                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ReZ Mind Integration

**File:** `rez-unified-chat/src/services/chatService.ts`

```typescript
// Chat service connects to Support Copilot
const SUPPORT_COPILOT_API = process.env.SUPPORT_COPILOT_URL || 'http://localhost:4033';

// Send message to AI
async sendToAI(message: string, userId: string, context: string) {
  // Get user context from ReZ Mind
  const userContext = await fetch(`${REZ_MIND_URL}/api/user/${userId}/context`);

  // Send to Support Copilot
  const response = await fetch(`${SUPPORT_COPILOT_API}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      userId,
      context,
      userHistory: userContext.history,
      userProfile: userContext.profile
    })
  });

  return response;
}
```

### Events Tracked

| Event | ReZ Mind Use |
|-------|--------------|
| `chat_message_sent` | Engagement tracking |
| `chat_order_placed` | Transaction recording |
| `chat_booking_made` | Booking tracking |
| `chat_session_started` | User activity |
| `chat_session_ended` | Session analysis |

### Used In

| App | Usage |
|------|-------|
| Do App | Order placement, customer support |
| Rez Now | Restaurant ordering |
| Merchant Apps | Customer communication |
| Web Menus | Menu ordering |
| Hotel Apps | Room service |

### Configuration

```typescript
const chatConfig: ChatConfig = {
  restaurantId: 'rest_001',
  context: 'qr_now',  // qr_now | hotel_room | web_menu
  userId: 'user_123',
  tableNumber: 'T12',
  enableDarkMode: false,
  showTypingIndicator: true,
  apiBaseUrl: 'https://api.rez-support-copilot.com',
};
```

---

## 5. CROSS-APP USER JOURNEY

### Example: User Discovers on WhatsApp, Orders on Do App

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CROSS-APP USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DAY 1: WhatsApp Discovery                                                │
│  ───────────────────────────                                               │
│  User texts "pizza near me" on WhatsApp                                   │
│     │                                                                      │
│     ├──▶ ReZ Mind captures: intent=pizza_near_me                          │
│     ├──▶ ReZ Mind sees: first-time user                                    │
│     └──▶ WhatsApp returns: Restaurant list + "Order now" button           │
│                                                                              │
│  DAY 2: ReZ Mind Nudge                                                    │
│  ─────────────────────────                                               │
│  ReZ Mind detects: User browsed but didn't order                          │
│     │                                                                      │
│     ├──▶ Calculates: Dormant intent score                                  │
│     └──▶ Sends WhatsApp nudge: "20% off pizza today!"                     │
│                                                                              │
│  DAY 3: Do App Order                                                      │
│  ─────────────────────                                                    │
│  User opens Do App, sees personalized recommendation                        │
│     │                                                                      │
│     ├──▶ Order placed                                                     │
│     ├──▶ ReZ Mind records: transaction event                               │
│     └──▶ User earns coins                                                  │
│                                                                              │
│  DAY 4: Cross-App Loyalty                                                 │
│  ─────────────────────────                                                │
│  User browses groceries on Do App                                           │
│     │                                                                      │
│     ├──▶ ReZ Mind recognizes: dining affinity + new interest                │
│     └──▶ WhatsApp receives: grocery recommendations                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
WhatsApp                    Do App                    ReZ Mind
   │                          │                          │
   │  Search: "pizza"         │                          │
   │──────────────────────────▶│                          │
   │                          │  Capture Intent           │
   │                          │─────────────────────────▶│
   │                          │                          │
   │                          │                          │──▶ User Profile Updated
   │                          │                          │──▶ Intent Graph Updated
   │                          │                          │
   │  Restaurant List         │                          │
   │◀─────────────────────────│                          │
   │                          │                          │
   │  Browse (no order)      │                          │
   │◀─────────────────────────│                          │
   │                          │                          │
   │                          │  Browse Event            │
   │                          │─────────────────────────▶│
   │                          │                          │
   │                          │                          │──▶ Intent: DORMANT
   │                          │                          │
   │                          │                          │
   │  Nudge (24h later)      │                          │
   │  "20% off pizza!"        │                          │
   │◀─────────────────────────│                          │
   │                          │                          │
   │                          │                          │
   │  User orders (Click)    │                          │
   │─────────────────────────▶│                          │
   │                          │  Order Event            │
   │                          │─────────────────────────▶│
   │                          │                          │
   │                          │                          │──▶ Intent: FULFILLED
   │                          │                          │──▶ Revenue Recorded
   │                          │                          │──▶ Learn: What worked
   │                          │                          │
   │  Order Confirmed         │                          │
   │◀─────────────────────────│                          │
   │                          │                          │
```

---

## 5. UNIFIED USER PROFILE

ReZ Mind maintains a unified profile across all apps:

```typescript
interface UnifiedUserProfile {
  userId: string;

  // Basic Info (aggregated)
  basic: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    firstOrderDate: Date;
    lastOrderDate: Date;
    lifetimeValue: 'low' | 'medium' | 'high';
  };

  // App Usage
  apps: {
    doApp: { orders: number; lastUsed: Date };
    whatsapp: { messages: number; lastUsed: Date };
    support: { tickets: number; lastUsed: Date };
    merchant: { stores: number; lastUsed: Date };
  };

  // Affinities (cross-app)
  affinities: {
    dining: number;      // 0-1 score
    grocery: number;
    travel: number;
    entertainment: number;
    fashion: number;
  };

  // Active Intents
  activeIntents: Array<{
    key: string;
    confidence: number;
    source: string;
    lastSeen: Date;
  }>;

  // Dormant Intents (for nudging)
  dormantIntents: Array<{
    key: string;
    confidence: number;
    daysSince: number;
    revivalScore: number;
  }>;

  // Behavioral Patterns
  behavior: {
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
    preferredDay: 'weekday' | 'weekend';
    priceSensitivity: 'low' | 'medium' | 'high';
    brandLoyalty: number;
    crossBuyTendency: number;
  };

  // AI Predictions
  predictions: {
    churnRisk: number;           // 0-1
    upsellProbability: number;   // 0-1
    recommendations: string[];   // item IDs
    optimalNudgeTime: string;    // ISO time
  };
}
```

---

## 6. INTEGRATION POINTS SUMMARY

| App | Sends to ReZ Mind | Receives from ReZ Mind |
|-----|-------------------|------------------------|
| **Do App** | Intent, Transactions, Engagement | User profile, Recommendations, Dormant intents |
| **WhatsApp** | Messages, Orders, Support | Smart responses, Recommendations, Nudges |
| **Support Copilot** | Tickets, Issues | User context, History, Sentiment |
| **Merchant Apps** | Sales, Inventory, Reviews | Demand signals, Analytics, Health scores |
| **ReZ Now** | Orders, Payments, Bookings | Cross-app context, Recommendations |
| **Unified Chat** | Chat events, Orders, Bookings | AI responses, Recommendations, User context |

---

## 7. SERVICE CONNECTIONS

### Internal URLs

| Service | Port | Used By |
|---------|------|---------|
| ReZ Intent Graph | 3007 | All apps |
| ReZ Event Platform | 4008 | All apps |
| ReZ User Intelligence | 3004 | Support, WhatsApp, Unified Chat |
| ReZ Action Engine | 3014 | WhatsApp, Do App |
| ReZ Support Copilot | 4033 | Unified Chat, WhatsApp |

### Environment Variables

```bash
# Required in each app
REZ_MIND_URL=https://rez-intent-graph.onrender.com
REZ_EVENT_URL=https://rez-event-platform.onrender.com
SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com

# WhatsApp specific
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

---

## 8. TESTING INTEGRATIONS

### Test ReZ Mind Connection

```bash
# From Do App backend
curl -X POST http://localhost:3007/api/intent/capture \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "eventType": "search",
    "category": "DINING",
    "intentKey": "pizza_test",
    "source": "do-app"
  }'

# Check user profile
curl http://localhost:3007/api/intent/profile/test_user
```

### Test WhatsApp Integration

```bash
# Send test message (requires WhatsApp webhook setup)
curl -X POST http://localhost:3000/api/whatsapp/bot \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919999999999",
            "text": {"body": "Hello"}
          }]
        }
      }]
    }] 
  }'
```

---

## 9. DEPLOYMENT STATUS

| Integration | Status | Notes |
|-------------|--------|-------|
| Do App → ReZ Mind | ✅ Implemented | Full event capture |
| ReZ Mind → Do App | ✅ Implemented | Recommendations, nudges |
| WhatsApp → ReZ Mind | ✅ Implemented | Message, order events |
| ReZ Mind → WhatsApp | ✅ Implemented | Nudge delivery |
| Support Copilot → ReZ Mind | ✅ Implemented | Ticket enrichment |
| ReZ Mind → Support Copilot | ✅ Implemented | User context |

---

*Document Version: 1.0*
*Created: 2026-05-06*
