# ReZ Chat Interface Spec
**Version:** 1.0  
**Date:** May 3, 2026  
**Purpose:** Unified conversational interface for ReZ Mind

---

## 1. Concept & Vision

ReZ Chat is not a chatbot. It's a **conversational operating system** for the ReZ ecosystem.

> "Tell ReZ what you want → ReZ discovers, executes, and rewards you"

The interface should feel like texting a knowledgeable friend who:
- Remembers everything you've done
- Knows your taste (not just your data)
- Actually does things for you
- Rewards you for every action

**Personality:** Helpful, concise, slightly playful. Never robotic.

---

## 2. Design Language

### Color Palette
```css
:root {
  --rez-primary: #6366F1;      /* Indigo - main actions */
  --rez-secondary: #EC4899;    /* Pink - engagement/rewards */
  --rez-accent: #F59E0B;        /* Amber - coins/karma */
  --rez-success: #10B981;       /* Emerald - confirmations */
  --rez-warning: #F97316;       /* Orange - alerts */
  --rez-background: #0F172A;   /* Dark slate - bg */
  --rez-surface: #1E293B;       /* Lighter slate - cards */
  --rez-text: #F8FAFC;          /* White - primary text */
  --rez-text-muted: #94A3B8;    /* Slate - secondary text */
}
```

### Typography
```css
--font-display: 'Satoshi', sans-serif;  /* Headlines */
--font-body: 'Inter', sans-serif;        /* Body text */
--font-mono: 'JetBrains Mono', monospace; /* Codes, numbers */
```

### Spacing System
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

---

## 3. Layout & Structure

### Screen Layout
```
┌─────────────────────────────────────┐
│ ┌─────┐                    [≡] [👤] │  ← Header: Logo + Menu + Profile
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🤖 ReZ                      │   │  ← AI Status Indicator
│  │ "Ready to help"             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Message Bubble - User]            │  ← Messages (scrollable)
│                                     │
│       [Message Bubble - ReZ]        │
│       [Action Card]                 │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ┌───────────────────────┐ [Send]   │  ← Input: Text + Quick Actions
│ │ Type a message...     │   [🎤]   │
│ └───────────────────────┘          │
├─────────────────────────────────────┤
│ [🏠] [🔍] [📍] [🎁] [⚙️]           │  ← Bottom Nav: Home/Search/Map/Deals/Settings
└─────────────────────────────────────┘
```

### Message Types
| Type | Visual | Content |
|------|--------|---------|
| **User** | Right-aligned, primary color | User text |
| **ReZ Text** | Left-aligned, surface bg | Response text |
| **ReZ Card** | Left-aligned, rounded card | Entity preview (restaurant, trial, etc.) |
| **ReZ Action** | Left-aligned, bordered | Inline actions (buttons) |
| **ReZ Coin** | Left-aligned, amber bg | Coin gain notification |
| **ReZ Suggestion** | Left-aligned, dashed border | Suggested follow-up |
| **System** | Center-aligned, muted | Timestamps, status updates |

---

## 4. Core Components

### 4.1 ChatInput
```typescript
interface ChatInputProps {
  placeholder?: string;
  onSend: (message: string) => void;
  quickActions?: QuickAction[];
  disabled?: boolean;
}
```

**States:**
- Default: Border subtle, placeholder visible
- Focused: Border primary, keyboard visible
- Typing: Character count if limit exists
- Sending: Disabled, spinner on send button
- Error: Border red, retry option

**Quick Actions (chips above input):**
```
[I'm bored] [Book a table] [Show my karma] [Find trials near me]
```

### 4.2 MessageBubble
```typescript
interface MessageBubbleProps {
  type: 'user' | 'rez' | 'system';
  content: string | ReactNode;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  actions?: Action[];
  entities?: Entity[];
  coinDelta?: number;
}
```

**Variants:**
- User: Primary bg, white text, right-aligned
- ReZ Text: Surface bg, light text, left-aligned
- ReZ Card: Elevated card with entity preview
- ReZ Action: Contains clickable buttons
- Coin Delta: Amber gradient bg, "+50 coins" animation

### 4.3 ActionCard
```typescript
interface ActionCardProps {
  title: string;
  subtitle?: string;
  entityType: 'restaurant' | 'trial' | 'hotel' | 'event' | 'merchant';
  entity: Entity;
  actions: Action[];
  onAction: (action: Action) => void;
}
```

**Layout:**
```
┌────────────────────────────────────┐
│ [Image]                            │
│                                    │
│ Title                    [Karma] ★ │
│ Subtitle (distance, rating)        │
│                                    │
│ [Action 1] [Action 2] [Action 3]    │
└────────────────────────────────────┘
```

### 4.4 IntentClassifier
```typescript
interface IntentResult {
  primary: Intent;
  confidence: number;
  entities: ExtractedEntity[];
  context: ConversationContext;
  suggestedActions: Action[];
}

type Intent =
  | 'discovery'        // "I'm bored", "what's nearby"
  | 'booking'          // "Book a table", "order food"
  | 'transaction'     // "Pay", "check balance"
  | 'loyalty'          // "Show my karma", "my coins"
  | 'support'          // "Help", "report issue"
  | 'feedback'         // "Rate my order"
  | 'referral'         // "Invite friend", "share"
  | 'meta'             // "What can you do?"
```

---

## 5. Conversation Flows

### 5.1 Discovery Flow
```
User: "I'm bored tonight"
  │
  ├─→ Intent: discovery
  ├─→ Context: location, time (8pm), history
  │
ReZ: "Based on what you've been into lately, I have 3 ideas:"
  │
  ├─→ Card: "New Italian place - 0.8km - 4.8★"
  │       [Book Now] [Get Directions] [More Like This]
  │
  ├─→ Card: "Surprise Trial - Spa massage - 2km"
  │       [Try It - 100 coins] [Save For Later]
  │
  └─→ Card: "Event Tonight - Rooftop jazz - 1.2km"
          [Get Tickets] [Share With Friends]
```

### 5.2 Booking Flow
```
User: "Book that Italian place for 2 at 8pm"
  │
  ├─→ Intent: booking
  ├─→ Entities: Italian restaurant (from previous card), time, party size
  │
ReZ: "Booking La Trattoria for 2 at 8pm tonight."
  │
  ├─→ Action: Confirm Booking
  │         [Confirm ✓] [Change Time] [Change Party]
  │
User: "Confirm"
  │
ReZ: "✓ Booking confirmed! Here's your QR code."
  │
  ├─→ Action Card: Booking Confirmation
  │         [Show QR] [Get Directions] [Add to Calendar]
  │
  ├─→ Coin Animation: "+25 coins earned!"
  │
  └─→ Suggestion: "Want me to remind you 1 hour before?"
          [Yes, 7pm] [No thanks]
```

### 5.3 Multi-Step Execution Flow
```
User: "Plan my evening"
  │
ReZ: "Let me check your history and what's nearby..."
  │
  ├─→查询: Last 3 restaurants user visited
  ├─→查询: Trials user hasn't tried
  ├─→查询: Events tonight
  └─→查询: User karma + available coins
  │
ReZ: "Here's your evening plan:"
  │
  ├─→ Step 1: "7pm - Dinner at [Restaurant] - 2.4km"
  │        [Book Table - uses 50 karma] [Skip]
  │
  ├─→ Step 2: "8:30pm - Jazz at [Venue] - nearby"
  │        [Get Tickets - 200 coins] [Skip]
  │
  └─→ Total: "120 karma + 200 coins"
      [Execute All] [Customize] [Save For Later]
```

### 5.4 Loyalty Query Flow
```
User: "Show my karma"
  │
ReZ: ┌─────────────────────────────────┐
     │  YOUR REZ PROFILE              │
     │                                 │
     │  ⭐ Gold Member                 │
     │  ████████████░░ 2,450/3000     │
     │                                 │
     │  💰 1,250 coins                │
     │  🎫 3 vouchers                 │
     │                                 │
     │  This month:                   │
     │  • 12 visits                   │
     │  • 2,100 karma earned          │
     │  • 500 coins spent             │
     └─────────────────────────────────┘

ReZ: "You're Gold status! 550 more karma to Platinum.
      Here's how you're earning:"
  │
  ├─→ [View Karma History] [Redeem Rewards] [Refer Friends]
```

---

## 6. AI Integration

### 6.1 ReZ Mind Connection
```typescript
// Chat calls ReZ Mind for every message
import { classifyIntent, executeAction, getContext } from '@rez/mind';

const processMessage = async (userMessage: string, sessionId: string) => {
  // 1. Classify intent
  const intent = await classifyIntent(userMessage, sessionId);

  // 2. Get user context from intent graph
  const context = await getContext(sessionId);

  // 3. Generate response based on intent + context
  const response = await generateResponse(intent, context);

  // 4. Execute any actions
  if (intent.actionable) {
    await executeAction(intent, context);
  }

  // 5. Update intent graph with new interaction
  await updateGraph(sessionId, intent, response);

  return response;
};
```

### 6.2 Response Generation
```typescript
interface ReZResponse {
  type: 'text' | 'card' | 'action' | 'suggestion' | 'multi';
  content: {
    text?: string;
    cards?: ActionCard[];
    actions?: Action[];
    suggestions?: string[];
    coinDelta?: number;
  };
  metadata: {
    intent: IntentResult;
    confidence: number;
    latency: number;
  };
}
```

### 6.3 Personality Prompts
```typescript
const REZ_PERSONALITY = `
You are ReZ, a helpful AI assistant for the ReZ app.
Your personality:
- Concise: Max 2-3 sentences for simple queries
- Helpful: Always offer next steps
- Rewarding: Highlight coin/karma gains
- Playful: Light humor when appropriate
- Contextual: Remember previous conversations

Never:
- Give long explanations
- Be robotic or stiff
- Ask too many follow-up questions
- Miss an opportunity to reward the user
`;
```

---

## 7. Technical Architecture

### 7.1 Component Hierarchy
```
ChatScreen
├── ChatHeader
├── ConnectionStatus (ReZ Mind status)
├── MessageList (virtualized)
│   └── MessageBubble[]
│       ├── TextBubble
│       ├── CardBubble
│       ├── ActionBubble
│       └── CoinBubble
├── QuickActions (horizontal scroll)
├── ChatInput
│   ├── TextInput
│   ├── VoiceInput
│   └── SendButton
└── BottomNav
```

### 7.2 State Management
```typescript
interface ChatState {
  messages: Message[];
  sessionId: string;
  context: ConversationContext;
  intent: IntentResult | null;
  isTyping: boolean;
  error: Error | null;
}

// Reducers
- ADD_MESSAGE
- SET_TYPING
- SET_INTENT
- CLEAR_CONTEXT
- SET_ERROR
```

### 7.3 API Integration
```typescript
// POST /api/chat/message
interface ChatMessageRequest {
  sessionId: string;
  message: string;
  context?: ConversationContext;
}

interface ChatMessageResponse {
  response: ReZResponse;
  sessionId: string;
  updatedContext: ConversationContext;
}
```

### 7.4 WebSocket Real-time
```typescript
// Real-time suggestions and updates
const ws = new WebSocket('wss://api.rez.money/chat/stream');

ws.on('suggestion', (suggestion) => {
  // Show contextual suggestion while typing
});

ws.on('coinUpdate', (delta) => {
  // Animate coin gain
});

ws.on('intentUpdate', (intent) => {
  // Update UI based on detected intent
});
```

---

## 8. UX Micro-interactions

### 8.1 Message Send
```
User taps send
  ├─→ Input clears
  ├─→ Message appears with "sending..." state
  ├─→ ReZ shows "typing..." indicator
  │   ├─→ dots animate
  │   └─→ subtle pulse on avatar
  └─→ Response appears with slide-up animation
```

### 8.2 Card Appearance
```
Card enters with:
  ├─→ fade in (200ms)
  ├─→ slide up 8px (200ms, ease-out)
  ├─→ image loads with skeleton → fade in
  └─→ action buttons scale in sequentially (50ms delay each)
```

### 8.3 Coin Gain Animation
```
When coins are earned:
  ├─→ Coin icon bounces
  ├─→ "+XX" text animates up and fades
  ├─→ Coin icon particle effect
  └─→ Total balance increments
```

### 8.4 Voice Input
```
User holds mic button
  ├─→ Waveform animation
  ├─→ Real-time transcription appears in input
  ├─→ Release to send
  └─→ Fallback: tap to transcribe fully
```

---

## 9. Error Handling

### 9.1 Error States
| Error | User Message | Action |
|-------|--------------|--------|
| Network | "Oops, I lost connection. Retrying..." | Auto-retry 3x |
| Rate Limit | "Slow down! Thinking..." | Show typing indicator |
| Intent Unclear | "I'm not sure what you mean. Try:" | Show suggestions |
| Action Failed | "Couldn't complete that. Reason:" | Show retry + alternatives |
| Auth Expired | "Please log in again" | Redirect to auth |

### 9.2 Fallback Flows
```typescript
const handleFallback = (intent: IntentResult) => {
  if (intent.confidence < 0.6) {
    // Unclear intent
    return {
      type: 'suggestion',
      text: "I'm not sure I understood. Did you mean:",
      suggestions: [
        "Find places near me",
        "Show my karma",
        "Book a table",
        "Check my coins"
      ]
    };
  }

  if (intent.actionable && !intent.canExecute) {
    // Can't execute
    return {
      type: 'text',
      text: `I can help with that, but I need you to ${intent.missingRequirement}.`,
      actions: [
        { label: 'Allow Access', action: 'request_permission' }
      ]
    };
  }
};
```

---

## 10. Performance Requirements

| Metric | Target |
|--------|--------|
| Time to first message | < 500ms |
| Intent classification | < 200ms |
| Response generation | < 1s |
| Message render | < 100ms |
| Scroll FPS | 60fps |
| Memory (100 messages) | < 50MB |

---

## 11. Accessibility

- All interactive elements: minimum 44x44pt touch target
- Voice input for hands-free operation
- High contrast mode support
- Screen reader labels for all components
- Reduce motion option (disable animations)

---

## 12. Implementation Phases

### Phase 1: Core Chat
- [ ] Message input and display
- [ ] Basic text responses
- [ ] Session management

### Phase 2: Intelligence
- [ ] ReZ Mind intent classification
- [ ] Context retrieval from intent graph
- [ ] Entity cards

### Phase 3: Actions
- [ ] Action buttons on cards
- [ ] Booking flows
- [ ] Transaction flows

### Phase 4: Rewards
- [ ] Coin animations
- [ ] Karma display
- [ ] Achievement notifications

### Phase 5: Polish
- [ ] Voice input
- [ ] Suggestions
- [ ] Micro-interactions
- [ ] Offline support
