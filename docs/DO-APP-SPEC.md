# Do — App Specification
**Version:** 1.0  
**Date:** May 3, 2026  
**Status:** Ready for Development

---

# 1. Concept & Vision

## What is Do?

**Do** is an AI-powered personal assistant that actually completes tasks for you — not just answers questions.

> "Tell Do what you want → It discovers, books, pays, and rewards you"

Unlike chatbots that give you information, Do **takes action**. It's the middleman between "I want X" and "X is done."

## Tagline

**"Your AI that actually does"**

## Positioning

| Aspect | Detail |
|--------|--------|
| **Category** | AI Personal Assistant |
| **Target** | Busy professionals, urban millennials |
| **Differentiator** | Execution, not just answers |
| **Parent brand** | ReZ (shared services, independent branding) |

## The Core Loop

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ YOU SAY: "Book dinner for 2 tonight" │
│ │
│ ▼ │
│ │
│ DO FINDS: Best Italian place nearby │
│ │
│ ▼ │
│ │
│ DO BOOKS: Table reserved, karma applied │
│ │
│ ▼ │
│ │
│ DO REWARDS: +25 coins earned 🎉 │
│ │
│ ▼ │
│ │
│ YOU ENJOY: Show up, don't lift a finger │
│ │
└─────────────────────────────────────────────────────────────┘
```

---

# 2. Design Language

## Visual Identity

### Logo

```
┌─────────────────────────────────────┐
│ │
│  D O │
│ │
│  (Bold, clean, two-letter mark) │
│ │
└─────────────────────────────────────┘
```

**Design principles:**
- Two-letter wordmark
- Custom typography, not system fonts
- Scales from 16px to billboards
- Works in light and dark modes
- Animated dot animation on loading states

### Color Palette

```css
:root {
  /* Primary - Action Purple */
  --do-primary: #7C3AED;
  --do-primary-light: #A78BFA;
  --do-primary-dark: #5B21B6;

  /* Secondary - Warm Orange */
  --do-secondary: #F97316;
  --do-secondary-light: #FB923C;

  /* Accent - Success Green */
  --do-success: #10B981;
  --do-success-light: #34D399;

  /* Rewards - Gold */
  --do-gold: #FBBF24;
  --do-gold-light: #FCD34D;

  /* Neutrals */
  --do-bg: #0F0F12;
  --do-surface: #1A1A1F;
  --do-surface-elevated: #252529;
  --do-border: #2D2D33;

  /* Text */
  --do-text: #FFFFFF;
  --do-text-secondary: #A1A1AA;
  --do-text-muted: #71717A;
}
```

### Typography

```css
/* Headlines */
font-family: 'Inter', system-ui, sans-serif;
font-weight: 700;

/* Body */
font-family: 'Inter', system-ui, sans-serif;
font-weight: 400;

/* Mono (numbers, codes) */
font-family: 'JetBrains Mono', monospace;
```

### Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Motion Philosophy

| Principle | Description |
|-----------|-------------|
| **Purposeful** | Every animation has meaning |
| **Quick** | 150-300ms for micro-interactions |
| **Natural** | Ease-out curves, spring physics |
| **Celebratory** | Rewards get extra flourish |

```css
/* Timing */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;

/* Easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

# 3. Layout & Structure

## Screen Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │  Status Bar │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │  Header │ │
│ │  [D O] [● Online] [Profile] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ │ │
│ │  Chat Area │ │
│ │ │ │
│ │  [Messages scroll here] │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ │ │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ │ │
│ │  Quick Actions │ │
│ │  [I'm bored] [Book dinner] [Show my coins] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │  [Type here...] [🎤] [Send] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │  Tab Bar │ │
│ │  [Chat] [Explore] [Wallet] [Profile] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

## Tab Structure

| Tab | Icon | Purpose |
|-----|------|---------|
| **Chat** | Message bubble | Main interaction |
| **Explore** | Compass | Browse discoveries |
| **Wallet** | Coins | Karma & coins |
| **Profile** | User | Settings, history |

---

# 4. Features

## 4.1 Chat Interface (Primary)

### Core Chat

| Feature | Description |
|---------|-------------|
| **Text input** | Type naturally, Do understands |
| **Voice input** | Hold to speak, release to send |
| **Quick actions** | One-tap suggestions |
| **Typing indicator** | Shows when Do is "thinking" |
| **Read receipts** | See when Do sees your message |

### Message Types

#### User Message
```
┌─────────────────────────────────────────────────────────────┐
│                                          "Book dinner for 2" │
│                                          └──┘ │
│                                          Sent 2:34pm │
└─────────────────────────────────────────────────────────────┘
```

#### Do Text Response
```
┌─────────────────────────────────────────────────────────────┐
│ ┌──┐ │
│ │D │ Finding the best dinner spots near you... │
│ └──┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

#### Do Card (Entity)
```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────┐ │
│ │ [Image] │ │
│ │ │ │
│ │ La Trattoria 🍝 │ │
│ │ 0.8km · ⭐ 4.8 · Italian · $$ │ │
│ │ │ │
│ │ Open now · Next slot 7:30pm │ │
│ │ │ │
│ │ [Book Now] [Directions] [More Like This] │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Do Action (Confirmation)
```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ✓ Booking Confirmed │ │
│ │ │ │
│ │ La Trattoria │ │
│ │ Thursday, May 8 · 7:30pm · 2 people │ │
│ │ │ │
│ │ 📍 123 Main Street │ │
│ │ │ │
│ │ [Show QR] [Add to Calendar] [Get Directions] │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Do Reward (Coin Animation)
```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🎉 │ │
│ │ │ │
│ │ +25 coins earned! │ │
│ │ Total: 1,250 coins │ │
│ │ │ │
│ │ ████████████░░░░ 550 to Gold │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Do Suggestion
```
┌─────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Suggestions │ │
│ │ │ │
│ │ [Book again next week?] │ │
│ │ [Save as favorite] │ │
│ │ [Share with friends] │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 4.2 Intents & Capabilities

### What Do Understands

| Category | Examples |
|----------|----------|
| **Discovery** | "I'm bored tonight", "What should I do?", "Find me a spa" |
| **Bookings** | "Book a table for 2", "Reserve a massage", "Get tickets" |
| **Payments** | "Check my balance", "Pay for the meal", "Send coins" |
| **Loyalty** | "Show my karma", "What can I redeem?", "My tier status" |
| **Reminders** | "Remind me tomorrow at 9am", "Wake me up at 7" |
| **Navigation** | "Get directions", "How do I get there?", "Show on map" |
| **History** | "What did I book last week?", "My recent orders" |
| **Help** | "What can you do?", "Help me with..." |

### Example Conversations

#### "I'm bored"
```
You: "I'm bored tonight"
Do: "Based on what you're into, I have 3 ideas:

[Card 1: Jazz bar - 0.5km - 4.7★ - "You liked the last jazz place"]
[Card 2: Escape room - 1.2km - New experience - "+100 coins"]
[Card 3: Rooftop cinema - 0.8km - "Trending this week"]

Which one sounds good?"

You: "The escape room"
Do: "Nice choice! Here's what's available:

[Availability card - times, difficulty]

[Book This] [Try a different one]
```

#### "Plan my evening"
```
You: "Plan my evening"
Do: "Let me put something together based on your vibe..."

[Processing animation]

Do: "Here's your evening:

7:00pm - Dinner at La Trattoria
        [Booked ✓] [-50 karma]

8:30pm - Jazz at Blue Note
         [Get Tickets] [-200 coins]

9:30pm - Late coffee at Dark Horse
         [Save spot]

---
Total: 250 coins · 50 karma earned
       [Confirm All] [Change Something]"
```

#### Multi-step execution
```
You: "Book dinner for me and my wife, use my karma points, and remind me an hour before"

Do: "Got it! Finding romantic dinner spots..."

[Card: Italian place nearby]

You: "That one"
Do: "Booking for 2 at La Trattoria...

[Processing]

✓ Table reserved for 2 at 8pm
✓ Karma discount applied: -₹150
✓ Reminder set for 7pm

📍 You'll get a notification 1 hour before.
```

## 4.3 Explore Tab

### Discovery Feed

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ EXPLORE │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🔥 Trending near you │ │
│ │ │ │
│ │ [Horizontal scroll of cards] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ⭐ Your favorites │ │
│ │ │ │
│ │ Based on your history │ │
│ │ [Venue cards] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🎲 Surprise me │ │
│ │ │ │
│ │ "Something you've never tried" │ │
│ │ [Random trial card] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🏷️ Use your karma │ │
│ │ │ │
│ │ Gold tier discounts available │ │
│ │ [Venue cards with discount badges] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

## 4.4 Wallet Tab

### Balance & Rewards

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ WALLET │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 💰 Your Balance │ │
│ │ │ │
│ │ 1,250 │ │
│ │ coins │ │
│ │ │ │
│ │ ████████████░░░░ 550 to Gold │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🎫 Vouchers │ │
│ │ │ │
│ │ [Voucher card - 20% off at La Trattoria] │ │
│ │ [Voucher card - Free coffee at Dark Horse] │ │
│ │ │ │
│ │ [View All] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 📊 Activity │ │
│ │ │ │
│ │ Today │ │
│ │ +50 coins - Booking reward │ │
│ │ -200 coins - Jazz tickets │ │
│ │ │ │
│ │ This Week │ │
│ │ +250 coins earned │ │
│ │ 12 karma earned │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ [Earn More Coins] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

## 4.5 Profile Tab

### Settings & History

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ PROFILE │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ [Avatar] │ │
│ │ │ │
│ │ John Doe │ │
│ │ john@email.com │ │
│ │ │ │
│ │ ⭐ Gold Member │ │
│ │ 2,450 karma · 1,250 coins │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 📋 Booking History │ │
│ │ │ │
│ │ Last 5 bookings │ │
│ │ [Booking cards] │ │
│ │ │ │
│ │ [View All] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🎯 Achievements │ │
│ │ │ │
│ │ 12 badges earned │ │
│ │ [Badge icons] │ │
│ │ │ │
│ │ [View All] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ⚙️ Settings │ │
│ │ │ │
│ │ [Notifications] │ │
│ │ [Payment Methods] │ │
│ │ [Privacy] │ │
│ │ [Help & Support] │ │
│ │ [About Do] │ │
│ │ │ │
│ │ [Sign Out] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘
```

---

# 5. User Flows

## 5.1 First Launch

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ Step 1: Welcome Screen │
│ │ │
│ │ "Meet Do" │
│ │ │
│ │ Your AI that actually does │
│ │ │
│ │ [Get Started] │
│ │ │
│ ▼ │
│ │
│ Step 2: Phone Number │
│ │ │
│ │ "What's your number?" │
│ │ │
│ │ [+] [___] [___] [___] [___] [___] [___] [___] [___] [___] │
│ │ │
│ │ [Continue] │
│ │ │
│ ▼ │
│ │
│ Step 3: OTP Verification │
│ │ │
│ │ "Enter the code" │
│ │ │
│ │ [_] [_] [_] [_] │
│ │ │
│ │ [Resend Code] │
│ │ │
│ ▼ │
│ │
│ Step 4: Permissions │
│ │ │
│ │ "To help you better, Do needs:" │
│ │ │
│ │ [✓] Location - Find nearby places │
│ │ [✓] Notifications - Booking reminders │
│ │ [✓] Contacts - Easy invites │
│ │ │ │
│ │ [Continue] │
│ │ │
│ ▼ │
│ │
│ Step 5: First Prompt │
│ │ │
│ │ "What should I call you?" │
│ │ │
│ │ [Name input] │
│ │ │
│ │ "I'm Do. What can I do for you?" │
│ │ │
│ │ [I'm bored] [Book dinner] [Explore] │
│ │ │
└─────────────────────────────────────────────────────────────┘
```

## 5.2 Booking Flow

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ YOU: "Book dinner for 2 tonight around 8pm" │
│ │
│ ▼ │
│ │
│ DO: "Finding dinner spots for 2 at 8pm..." │
│ │
│ [Loading: "Checking availability..."] │
│ │
│ ▼ │
│ │
│ DO: [Card: La Trattoria] │
│ │
│ "Found 3 options. Here's the top pick:" │
│ │
│ ✓ Open at 8pm │
│ ✓ 2 person table available │
│ ✓ 4.8★ (234 reviews) │
│ ✓ 0.8km away │
│ │
│ [Book This] [Show Others] │
│ │
│ ▼ │
│ │
│ YOU: "Book this" │
│ │
│ ▼ │
│ │
│ DO: "Booking your table..." │
│ │
│ [Processing animation] │
│ │
│ ✓ Table reserved │
│ ✓ Karma discount applied │
│ ✓ Reminder set │
│ │
│ [QR Code appears] │
│ │
│ ▼ │
│ │
│ DO: "All done! 🎉 │
│ │
│ Your table at La Trattoria is booked │
│ for 2 at 8pm tonight. │
│ │
│ +25 coins earned! │
│ │
│ [Show QR] [Get Directions] [Add to Calendar] │
│ │
│ See you there! ✨ │
│ │
└─────────────────────────────────────────────────────────────┘
```

## 5.3 Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ YOU: "Pay for the dinner" │
│ │
│ ▼ │
│ │
│ DO: "Here's your bill:" │
│ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Bill Details │ │
│ │ │ │
│ │ La Trattoria │ │
│ │ May 3, 2026 │ │
│ │ │ │
│ │ Dinner for 2 │ │
│ │ ₹1,200 │ │
│ │ │ │
│ │ ───────────── │ │
│ │ Subtotal: ₹1,200 │ │
│ │ Karma Discount: -₹150 │ │
│ │ ───────────── │ │
│ │ Total: ₹1,050 │ │
│ │ │ │
│ │ Pay with: [Coins] [Card ****4521] │ │
│ │ │ │
│ │ [Confirm Payment] │ │
│ └───────────────────────────────────────────────────────┘ │
│ │
│ ▼ │
│ │
│ YOU: [Tap "Confirm Payment"] │
│ │
│ ▼ │
│ │
│ DO: "Payment successful! ✓ │
│ │
│ ₹1,050 charged to your card │
│ │
│ +50 karma earned │
│ +30 coins earned │
│ │
│ Thank you for dining with La Trattoria!" │
│ │
└─────────────────────────────────────────────────────────────┘
```

---

# 6. Technical Architecture

## 6.1 App Structure

```
do-app/
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Chat screen (home)
│   ├── explore.tsx              # Explore tab
│   ├── wallet.tsx               # Wallet tab
│   ├── profile.tsx              # Profile tab
│   └── +html.tsx               # Web fallback
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ActionCard.tsx
│   │   ├── EntityCard.tsx
│   │   ├── CoinAnimation.tsx
│   │   └── TypingIndicator.tsx
│   ├── explore/
│   │   ├── DiscoveryFeed.tsx
│   │   ├── VenueCard.tsx
│   │   └── MoodSelector.tsx
│   ├── wallet/
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionList.tsx
│   │   └── VoucherCard.tsx
│   └── common/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Avatar.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useDo.ts                # Do AI hook
│   ├── useWallet.ts
│   └── useProfile.ts
├── services/
│   ├── do-api.ts               # Do backend client
│   ├── websocket.ts            # Real-time connection
│   └── storage.ts              # Local storage
├── lib/
│   ├── intents.ts              # Intent definitions
│   ├── entities.ts             # Entity types
│   └── animations.ts           # Lottie/Framer configs
├── constants/
│   ├── colors.ts
│   ├── spacing.ts
│   └── copy.ts                 # Copywriting
└── types/
    ├── chat.ts
    ├── intent.ts
    └── entity.ts
```

## 6.2 State Management

```typescript
// Zustand store for chat
interface ChatStore {
  messages: Message[];
  isTyping: boolean;
  sessionId: string;

  // Actions
  sendMessage: (text: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setTyping: (typing: boolean) => void;
  clearHistory: () => void;
}

// Zustand store for user
interface UserStore {
  profile: UserProfile | null;
  wallet: WalletState | null;
  karma: KarmaState | null;

  // Actions
  fetchProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}
```

## 6.3 API Integration

```typescript
// Do API client
import { createClient } from '@do/api';

// Initialize with ReZ shared services
const doClient = createClient({
  baseURL: 'https://api.rez.money/do',
  auth: {
    type: 'jwt',
    getToken: () => authStore.getToken(),
  },
});

// Chat endpoint
const sendMessage = async (sessionId: string, message: string) => {
  const response = await doClient.post('/chat/message', {
    sessionId,
    message,
  });
  return response.data;
};

// WebSocket for real-time
const ws = doClient.subscribe('/chat/stream', {
  onMessage: (data) => {
    chatStore.handleEvent(data);
  },
});
```

## 6.4 Backend Services (Shared with ReZ)

| Service | Do Uses | Purpose |
|---------|---------|---------|
| **ReZ Auth** | ✓ | Phone auth, JWT |
| **ReZ Intent Graph** | ✓ | User context |
| **ReZ Discovery** | ✓ | Venues, trials |
| **ReZ Booking** | ✓ | Reservations |
| **ReZ Payment** | ✓ | Transactions |
| **ReZ Wallet** | ✓ | Coins, karma |
| **ReZ Loyalty** | ✓ | Tiers, rewards |
| **ReZ Notification** | ✓ | Reminders |

## 6.5 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ │
│ USER TYPES: "Book dinner for 2 tonight" │
│ │
│ ▼ │
│ │
│ APP: │
│ • Captures message │
│ • Shows in chat UI │
│ • Sends to backend │
│ │
│ ▼ │
│ │
│ BACKEND: │
│ • Intent Parser classifies │
│ • User profile fetched from ReZ │
│ • Venues queried │
│ • Karma discount calculated │
│ • Booking created │
│ • Rewards calculated │
│ │
│ ▼ │
│ │
│ RESPONSE: │
│ • Entity card with booking │
│ • Coin animation data │
│ • Suggestion follow-ups │
│ │
│ ▼ │
│ │
│ APP: │
│ • Renders message │
│ • Plays coin animation │
│ • Shows actions │
│ │
└─────────────────────────────────────────────────────────────┘
```

---

# 7. Component Inventory

## 7.1 Chat Components

### ChatInput
```typescript
interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  quickActions?: string[];
}

// States:
// - Default: Placeholder visible
// - Focused: Keyboard up, border glow
// - Typing: Text visible, send enabled
// - Voice: Recording animation
// - Sending: Disabled, loading
```

### MessageBubble
```typescript
interface MessageBubbleProps {
  type: 'user' | 'do';
  content: string | ReactNode;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'delivered';
}

// Variants:
// - User: Right-aligned, primary color
// - Do Text: Left-aligned, surface color
// - Do Card: Left-aligned, elevated card
// - Do Action: Left-aligned, confirmation style
// - Do Reward: Left-aligned, gold accent
```

### EntityCard
```typescript
interface EntityCardProps {
  entity: Entity;
  variant: 'compact' | 'full';
  showDiscount?: boolean;
  onAction: (action: string, entity: Entity) => void;
}

// Layout:
// [Image]
// Title
// Subtitle (distance, rating, type)
// Availability
// Action buttons
```

### CoinAnimation
```typescript
interface CoinAnimationProps {
  amount: number;
  trigger: boolean;
  onComplete?: () => void;
}

// Animation sequence:
// 1. Coin icon scales up
// 2. "+XX" text rises
// 3. Total updates
// 4. Particle effects
// Duration: 1.5s total
```

## 7.2 Common Components

### Button
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}
```

### Input
```typescript
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
```

---

# 8. Animations & Micro-interactions

## 8.1 Message Send
```
User taps send:
1. Input clears (fade)
2. Message appears with slide-up (200ms)
3. "Sending..." indicator (subtle pulse)
4. Do shows "typing..." (after 500ms delay)
```

## 8.2 Card Appear
```
New card enters:
1. Fade in (150ms)
2. Slide up 8px (200ms, ease-out)
3. Image loads with skeleton
4. Actions fade in sequentially (50ms each)
```

## 8.3 Coin Earn
```
Coins earned:
1. Coin icon bounces (spring)
2. "+XX" rises and fades (400ms)
3. Particle burst
4. Total number increments
5. Progress bar animates
Duration: 1.5s total
```

## 8.4 Voice Input
```
Hold mic button:
1. Icon changes to recording
2. Waveform animates
3. Real-time transcription
4. Release to send
5. Processing indicator
```

---

# 9. Error Handling

## 9.1 Error States

| Scenario | Message | Action |
|----------|---------|--------|
| Network error | "Oops, lost connection. Retrying..." | Auto-retry 3x |
| Location denied | "Enable location to find nearby places" | [Open Settings] |
| Auth expired | "Please sign in again" | Redirect to login |
| Booking failed | "Couldn't complete booking. Try again?" | [Retry] [Change] |
| Payment failed | "Payment didn't go through" | [Try Again] [Other Method] |

## 9.2 Fallback Messages

```typescript
const FALLBACK_RESPONSES = {
  dont_understand: [
    "I'm not sure I got that. Try: 'Book dinner', 'Find a spa', or 'Show my coins'",
    "Hmm, let me think... Can you try rephrasing?",
  ],
  cant_do: [
    "I can't do that yet, but I'm learning! Try something else?",
    "That's outside my powers right now. What else can I help with?",
  ],
  location_needed: [
    "I need to know where you are to find places nearby.",
    "Turn on location to discover places near you!",
  ],
};
```

---

# 10. Performance Requirements

| Metric | Target |
|--------|--------|
| App launch | < 2s |
| Chat load | < 500ms |
| Message send | < 300ms to show |
| Do response | < 2s (p95) |
| Card render | < 100ms |
| Scroll FPS | 60fps |
| Memory (100 messages) | < 50MB |

---

# 11. Accessibility

- All touch targets: minimum 44x44pt
- Voice input for hands-free
- High contrast support
- Screen reader labels
- Reduce motion option
- Dynamic text sizing

---

# 12. Launch Checklist

## Pre-Launch
- [ ] App icon and splash screen
- [ ] Onboarding flow
- [ ] Push notifications
- [ ] Deep links from ReZ
- [ ] Analytics setup
- [ ] Crash reporting

## Beta (Internal)
- [ ] 10 test users
- [ ] Core flows working
- [ ] Error rates < 5%
- [ ] Response time < 3s

## Launch
- [ ] App Store listing
- [ ] Play Store listing
- [ ] Landing page
- [ ] Social assets
- [ ] PR/announcement

---

# 13. Future Roadmap

## v1.0 (Launch)
- Chat interface
- Basic discovery
- Booking flow
- Wallet integration

## v1.1
- Voice input
- More entity types
- Social features

## v1.2
- Multimodal input (images)
- Advanced personalization
- A/B testing

## v2.0
- Autonomous agents
- Proactive suggestions
- Cross-app orchestration

---

**End of Spec**
