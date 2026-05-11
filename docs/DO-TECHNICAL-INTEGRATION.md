# Do — Technical Integration Spec
**Version:** 1.0  
**Date:** May 3, 2026  

---

# 1. Integration Overview

## How Do Connects to ReZ

```
┌─────────────────────────────────────────────────────────────────┐
│ │
│ DO APP │
│ (New frontend) │
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Chat Interface │ │
│ │ Intent Parser │ │
│ │ Entity Renderer │ │
│ │ Animation Engine │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
│ ↕ REST + WebSocket │
│ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ │
│ DO BACKEND │
│ (New API layer) │
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Session Manager │ │
│ │ Intent Classifier → ReZ Mind │ │
│ │ Workflow Engine │ │
│ │ Response Generator │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
│ ↕ Internal calls │
│ │
└────────────────────────────┬────────────────────────────────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
┌─────────┐            ┌─────────┐            ┌─────────┐
│ReZ Auth │            │ReZ Mind │            │ReZ Order│
│         │            │(Intent) │            │         │
│ JWT     │            │         │            │Bookings │
│ Verify  │            │Profile  │            │         │
└─────────┘            └─────────┘            └─────────┘
    │                        │                        │
    │                        │                        │
    ▼                        ▼                        ▼
┌─────────┐            ┌─────────┐            ┌─────────┐
│ReZ Wallet│            │ReZ Disc │            │ReZ Paymt│
│         │            │(Venues) │            │         │
│ Coins   │            │         │            │Payment  │
│ Karma   │            │Trials   │            │Gateway  │
└─────────┘            └─────────┘            └─────────┘
```

## Key Integration Points

| ReZ Service | Do Usage | Integration Type |
|-------------|----------|------------------|
| Auth | Phone + JWT | Direct |
| Intent Graph | User context, preferences | Direct |
| Discovery | Venues, trials, events | Direct |
| Order | Bookings, reservations | Direct |
| Payment | Transactions | Direct |
| Wallet | Coins, karma balance | Direct |
| Loyalty | Tiers, rewards | Direct |
| Notification | Reminders, confirmations | Event |

---

# 2. API Design

## 2.1 Do Chat API

### POST /do/chat/message
```typescript
// Request
interface ChatMessageRequest {
  sessionId: string;
  message: string;
  context?: {
    location?: { lat: number; lng: number };
    time?: string;
  };
}

// Response
interface ChatMessageResponse {
  sessionId: string;
  messages: DoMessage[];
  context: ConversationContext;
}
```

### Do Message Types

```typescript
interface DoMessage {
  id: string;
  type: 'text' | 'card' | 'action' | 'reward' | 'suggestion' | 'error';
  content: string | DoContent;
  timestamp: string;
}

interface TextContent {
  type: 'text';
  text: string;
}

interface CardContent {
  type: 'card';
  card: {
    id: string;
    entityType: 'venue' | 'trial' | 'event' | 'booking';
    title: string;
    subtitle: string;
    image?: string;
    metadata: Record<string, any>;
    actions: Action[];
    discount?: {
      amount: number;
      type: 'karma' | 'coins';
    };
  };
}

interface RewardContent {
  type: 'reward';
  coins?: number;
  karma?: number;
  tierProgress?: {
    current: string;
    next: string;
    percentage: number;
  };
}

interface ActionContent {
  type: 'action';
  action: {
    id: string;
    label: string;
    style: 'primary' | 'secondary';
    requiresConfirmation?: boolean;
  };
}
```

### WebSocket /do/chat/stream
```typescript
// Client → Server
interface ClientMessage {
  type: 'typing' | 'message' | 'heartbeat';
  payload?: any;
}

// Server → Client
interface ServerMessage {
  type: 'message' | 'typing' | 'suggestion' | 'error';
  payload: any;
}
```

## 2.2 Do Discovery API

### GET /do/discover
```typescript
// Request
interface DiscoverRequest {
  intent?: 'browse' | 'bored' | 'celebrate' | 'nearby';
  location: { lat: number; lng: number };
  filters?: {
    category?: string[];
    priceRange?: string[];
    openNow?: boolean;
  };
  limit?: number;
}

// Response
interface DiscoverResponse {
  items: DiscoveryItem[];
  section: string;
}
```

### GET /do/explore/mood
```typescript
// Request
interface MoodExploreRequest {
  mood: 'bored' | 'celebrate' | 'relax' | 'adventure' | 'date';
  location: { lat: number; lng: number };
}

// Response
interface MoodExploreResponse {
  title: string;
  subtitle: string;
  items: DiscoveryItem[];
}
```

## 2.3 Do Wallet API

### GET /do/wallet
```typescript
interface WalletResponse {
  coins: number;
  karma: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    points: number;
    nextTier: {
      name: string;
      pointsRequired: number;
      percentage: number;
    };
  };
  vouchers: Voucher[];
}
```

## 2.4 Do Booking API

### POST /do/booking/quick
```typescript
interface QuickBookingRequest {
  entityId: string;
  entityType: 'venue' | 'trial';
  dateTime?: string;
  partySize?: number;
  useKarma?: boolean;
}

// Response
interface QuickBookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'failed';
  confirmationCode?: string;
  qrCode?: string;
  karmaDiscount?: number;
  coinsEarned?: number;
  error?: {
    code: string;
    message: string;
    alternatives?: any[];
  };
}
```

---

# 3. Intent Classification

## 3.1 Intent Types

```typescript
enum DoIntent {
  // Discovery
  BROWSE = 'browse',
  SEARCH = 'search',
  MOOD_DISCOVERY = 'mood_discovery',  // "I'm bored", "want to celebrate"

  // Actions
  BOOK = 'book',
  PAY = 'pay',
  ORDER = 'order',
  RESERVE = 'reserve',

  // Queries
  CHECK_BALANCE = 'check_balance',
  CHECK_KARMA = 'check_karma',
  CHECK_BOOKINGS = 'check_bookings',

  // Management
  CANCEL = 'cancel',
  MODIFY = 'modify',
  REFUND = 'refund',

  // Utility
  DIRECTIONS = 'directions',
  REMINDER = 'reminder',
  SHARE = 'share',

  // Meta
  HELP = 'help',
  WHAT_CAN_YOU_DO = 'what_can_you_do',
}
```

## 3.2 Intent Parser

```typescript
// /do-backend/services/intent-parser.ts
class DoIntentParser {
  // Uses ReZ Mind for classification
  async parse(input: string, context: UserContext): Promise<ParsedIntent> {
    // 1. Basic pattern matching
    const patterns = this.matchPatterns(input);

    // 2. ReZ Mind classification
    const classification = await this.rezMind.classify(input, {
      userId: context.userId,
      sessionType: 'do_chat',
    });

    // 3. Entity extraction
    const entities = await this.extractEntities(input, context);

    // 4. Combine and resolve
    return {
      intent: classification.intent,
      confidence: classification.confidence,
      entities,
      parameters: this.extractParameters(input, entities),
      suggestedActions: this.getSuggestedActions(classification.intent),
    };
  }
}
```

## 3.3 Entity Extraction

```typescript
interface ExtractedEntities {
  venue?: {
    id?: string;      // Known venue ID
    name?: string;    // Extracted from text
    type?: string;    // "italian", "spa", etc.
  };
  time?: {
    when: 'now' | 'today' | 'tomorrow' | 'specific';
    specific?: Date;
  };
  partySize?: number;
  location?: {
    lat: number;
    lng: number;
    description?: string;
  };
  amount?: number;
  paymentMethod?: string;
}
```

---

# 4. Workflow Engine

## 4.1 Workflow Definition

```typescript
interface Workflow {
  id: string;
  name: string;
  trigger: {
    intent: DoIntent | DoIntent[];
    examples: string[];
  };
  steps: WorkflowStep[];
  fallbacks?: Workflow[];
}

interface WorkflowStep {
  id: string;
  service: 'discovery' | 'booking' | 'payment' | 'loyalty' | 'notification';
  action: string;
  params: Record<string, any>;
  input?: string;           // Reference to previous step output
  outputKey: string;        // Store result here
  onSuccess?: string;        // Next step
  onFailure?: string;       // Fallback step
  userConfirmation?: boolean; // Pause for user input
  critical?: boolean;        // Fail workflow if this fails
}
```

## 4.2 Pre-built Workflows

### "Book Dinner" Workflow
```typescript
const BOOK_DINNER_WORKFLOW: Workflow = {
  id: 'book-dinner',
  name: 'Book Dinner',
  trigger: {
    intent: [DoIntent.BOOK, DoIntent.RESERVE],
    examples: [
      'Book dinner for 2',
      'Reserve a table',
      'Find a restaurant for tonight',
    ],
  },
  steps: [
    {
      id: 'discover',
      service: 'discovery',
      action: 'search_venues',
      params: { type: 'restaurant' },
      outputKey: 'venues',
    },
    {
      id: 'rank',
      service: 'discovery',
      action: 'rank_by_preference',
      params: { venues: '{{venues}}', userId: '{{userId}}' },
      input: 'venues',
      outputKey: 'topVenues',
    },
    {
      id: 'present',
      service: 'notification',
      action: 'show_cards',
      params: { cards: '{{topVenues}}' },
      userConfirmation: true,
      outputKey: 'selectedVenue',
    },
    {
      id: 'check_availability',
      service: 'booking',
      action: 'check_availability',
      params: {
        venueId: '{{selectedVenue.id}}',
        dateTime: '{{time}}',
        partySize: '{{partySize}}',
      },
      outputKey: 'availability',
    },
    {
      id: 'calculate_karma',
      service: 'loyalty',
      action: 'calculate_discount',
      params: {
        userId: '{{userId}}',
        venueId: '{{selectedVenue.id}}',
        amount: '{{availability.price}}',
      },
      outputKey: 'karmaDiscount',
    },
    {
      id: 'confirm_booking',
      service: 'booking',
      action: 'create_booking',
      params: {
        venueId: '{{selectedVenue.id}}',
        userId: '{{userId}}',
        dateTime: '{{time}}',
        partySize: '{{partySize}}',
        karmaDiscount: '{{karmaDiscount.amount}}',
      },
      outputKey: 'booking',
      critical: true,
    },
    {
      id: 'add_reminder',
      service: 'notification',
      action: 'schedule_reminder',
      params: {
        userId: '{{userId}}',
        bookingId: '{{booking.id}}',
        type: 'one_hour_before',
      },
      outputKey: 'reminder',
    },
    {
      id: 'earn_rewards',
      service: 'loyalty',
      action: 'record_booking_reward',
      params: {
        userId: '{{userId}}',
        bookingId: '{{booking.id}}',
      },
      outputKey: 'rewards',
    },
  ],
};
```

### "Check Karma" Workflow
```typescript
const CHECK_KARMA_WORKFLOW: Workflow = {
  id: 'check-karma',
  name: 'Check Karma',
  trigger: {
    intent: [DoIntent.CHECK_KARMA, DoIntent.CHECK_BALANCE],
    examples: [
      'Show my karma',
      'How many coins do I have?',
      'What tier am I?',
    ],
  },
  steps: [
    {
      id: 'fetch_wallet',
      service: 'loyalty',
      action: 'get_wallet',
      params: { userId: '{{userId}}' },
      outputKey: 'wallet',
    },
    {
      id: 'fetch_tier_info',
      service: 'loyalty',
      action: 'get_tier_progress',
      params: { userId: '{{userId}}' },
      outputKey: 'tierProgress',
    },
    {
      id: 'format_response',
      service: 'notification',
      action: 'show_wallet',
      params: {
        wallet: '{{wallet}}',
        tierProgress: '{{tierProgress}}',
      },
      outputKey: 'response',
    },
  ],
};
```

---

# 5. Response Generation

## 5.1 Response Templates

```typescript
interface ResponseTemplate {
  intent: DoIntent;
  success: {
    primary: string | (params: any) => string;
    withData: (data: any) => DoMessage[];
  };
  failure: {
    reasons: Record<string, string | (params: any) => string>;
  };
}

const RESPONSE_TEMPLATES: Record<DoIntent, ResponseTemplate> = {
  [DoIntent.BOOK]: {
    success: {
      primary: 'Your {entityType} is booked!',
      withData: (data) => [
        {
          type: 'action',
          content: {
            title: '✓ Booking Confirmed',
            subtitle: `${data.venue.name} · ${data.dateTime} · ${data.partySize} people`,
            actions: [
              { label: 'Show QR', action: 'show_qr' },
              { label: 'Get Directions', action: 'directions' },
            ],
          },
        },
        {
          type: 'reward',
          content: {
            coins: data.coinsEarned,
            karma: data.karmaEarned,
          },
        },
      ],
    },
    failure: {
      reasons: {
        UNAVAILABLE: "That time is fully booked. Here are alternatives:",
        PAYMENT_FAILED: "Payment didn't go through. Want to try again?",
        LOCATION_REQUIRED: "I need to know where you are to find nearby places.",
      },
    },
  },
};
```

## 5.2 Personality Configuration

```typescript
const DO_PERSONALITY = {
  name: 'Do',
  tone: 'helpful, concise, slightly playful',

  // Writing rules
  rules: {
    maxSentenceLength: 20,
    useEmoji: ['🎉', '✨', '📍', '✅', '💰'],
    celebration: ['Great choice!', 'All set!', 'Done!', 'You\'re all set!'],
    suggestions: ['Want me to...', 'Should I...', 'Would you like...'],
  },

  // Response patterns
  patterns: {
    greeting: ['Hey!', 'Hi there!', 'What can I do for you?'],
    confirm: ['Done! ✓', 'All set! ✓', 'Got it! ✓'],
    reward: ['+{n} coins earned! 🎉', 'Nice! +{n} karma ⭐'],
    suggest: ['Want to...', 'How about...', 'You could...'],
  },
};
```

---

# 6. Real-time Updates

## 6.1 WebSocket Protocol

```typescript
// Connection
const ws = new WebSocket('wss://api.rez.money/do/stream');

// Auth
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt-token-here',
  sessionId: 'session-id',
}));

// Send message
ws.send(JSON.stringify({
  type: 'message',
  payload: {
    text: 'Book dinner for 2',
    context: { location: { lat: 1, lng: 1 } },
  },
}));

// Receive events
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'typing':
      // Show typing indicator
      break;
    case 'message':
      // Render message
      break;
    case 'suggestion':
      // Show suggestion chip
      break;
    case 'error':
      // Show error
      break;
  }
};
```

## 6.2 Push Notifications

```typescript
// Do sends notifications via ReZ Notification Service
interface DoNotification {
  type: 'booking_reminder' | 'payment_received' | 'karma_earned' | 'suggestion';
  title: string;
  body: string;
  data: {
    action: string;
    payload: any;
  };
}

// Example: Booking reminder
{
  type: 'booking_reminder',
  title: 'Dinner in 1 hour 🍝',
  body: 'Your table at La Trattoria is waiting!',
  data: {
    action: 'open_booking',
    payload: { bookingId: 'xxx' },
  },
}
```

---

# 7. Session Management

## 7.1 Session State

```typescript
interface DoSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;
  context: {
    location?: { lat: number; lng: number };
    recentIntents: DoIntent[];
    currentWorkflow?: string;
    pendingConfirmation?: {
      action: string;
      params: any;
    };
  };
  stats: {
    messagesSent: number;
    bookingsMade: number;
    coinsEarned: number;
  };
}
```

## 7.2 Session Lifecycle

```typescript
// Session created on first message
// Expires after 30 minutes of inactivity
// Context preserved for context-aware responses
// Stats tracked for analytics
```

---

# 8. Security

## 8.1 Authentication

```typescript
// Do uses ReZ Auth
// Phone OTP for initial auth
// JWT token stored securely
// Token refresh handled automatically
```

## 8.2 Permissions

```typescript
const DO_PERMISSIONS = {
  location: 'required',      // For discovery
  notifications: 'optional',  // For reminders
  camera: 'optional',        // For receipts
  contacts: 'optional',      // For invites
};
```

## 8.3 Rate Limiting

```typescript
const RATE_LIMITS = {
  messages: { max: 60, window: 'minute' },
  bookings: { max: 10, window: 'hour' },
  payments: { max: 20, window: 'hour' },
};
```

---

# 9. Analytics Events

## 9.1 Core Events

```typescript
const DO_EVENTS = {
  // Chat events
  message_sent: { text: string; intent: string },
  message_received: { type: string; latency: number },
  card_viewed: { cardId: string; cardType: string; position: number },
  action_taken: { cardId: string; action: string; latency: number },

  // Workflow events
  workflow_started: { workflowId: string },
  workflow_completed: { workflowId: string; duration: number },
  workflow_failed: { workflowId: string; error: string },

  // Business events
  booking_created: { venueId: string; karmaUsed: number },
  payment_completed: { amount: number; method: string },
  coins_earned: { amount: number; source: string },
};
```

## 9.2 Funnel Tracking

```
Intent → Message Sent → Intent Classified → Workflow Started → Workflow Completed → Reward Earned
 100%          80%              75%                60%                55%                 55%
```

---

# 10. Error Codes

## 10.1 Error Response Format

```typescript
interface DoError {
  code: string;
  message: string;
  details?: any;
  suggestions?: {
    label: string;
    action: string;
  }[];
}

// Example
{
  code: 'VENUE_NOT_FOUND',
  message: "I couldn't find any places matching that.",
  suggestions: [
    { label: 'Try nearby', action: 'search_nearby' },
    { label: 'Different type', action: 'refine_search' },
  ],
}
```

## 10.2 Error Code Reference

| Code | Description | User Message |
|------|-------------|--------------|
| UNAUTHORIZED | Not logged in | "Please sign in to continue" |
| LOCATION_REQUIRED | Location not available | "Enable location to find places nearby" |
| VENUE_NOT_FOUND | No venues match query | "Couldn't find anything like that" |
| SLOT_UNAVAILABLE | Time slot booked | "That time is taken. Try another?" |
| PAYMENT_FAILED | Payment didn't go through | "Payment failed. Try again?" |
| INSUFFICIENT_COINS | Not enough coins | "You need {n} more coins for this" |
| RATE_LIMITED | Too many requests | "Slow down! Take a breath 😄" |
| SERVICE_UNAVAILABLE | Backend error | "Something broke on our end. Retrying..." |

---

# 11. Deployment

## 11.1 Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ CDN (Cloudflare) │
│ │
│ ▼ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Do Frontend (React Native / Expo) │ │
│ │ • EAS Build │ │
│ │ • OTA Updates │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ▼ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Do Backend (Node.js) │ │
│ │ • Containerized │ │
│ │ • Auto-scaling │ │
│ │ • Multi-region │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ▼ │
│ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ReZ Services (Shared) │ │
│ │ Auth · Mind · Discovery · Order · Wallet · etc. │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

## 11.2 Environment Variables

```bash
# Do Backend
DO_PORT=3000
DO_JWT_SECRET=xxx
DO_REDIS_URL=redis://redis:6379
DO_REZ_API_URL=https://api.rez.money
DO_REZ_API_KEY=xxx

# ReZ Services (shared)
REZ_AUTH_SERVICE_URL=http://rez-auth-service:3001
REZ_MIND_SERVICE_URL=http://rez-mind-service:3002
REZ_DISCOVERY_SERVICE_URL=http://rez-discovery-service:3003
REZ_ORDER_SERVICE_URL=http://rez-order-service:3004
REZ_WALLET_SERVICE_URL=http://rez-wallet-service:3005
```

---

# 12. Monitoring

## 12.1 Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Chat response time (p95) | < 2s | > 3s |
| Chat availability | > 99.5% | < 99% |
| Workflow success rate | > 90% | < 85% |
| Error rate | < 2% | > 5% |

## 12.2 Dashboards

- Real-time chat monitoring
- Workflow funnel analysis
- Intent classification accuracy
- User satisfaction scores
- Revenue attribution

---

**End of Technical Integration Spec**
