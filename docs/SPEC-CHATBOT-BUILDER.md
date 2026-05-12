# REZ Chatbot Builder - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Flow Builder Interface](#2-flow-builder-interface)
3. [Node Types](#3-node-types)
4. [Flow Logic](#4-flow-logic)
5. [AI Agent Integration](#5-ai-agent-integration)
6. [Testing & Debugging](#6-testing--debugging)
7. [Deployment](#7-deployment)
8. [Analytics](#8-analytics)
9. [Templates](#9-templates)
10. [Multi-Language Support](#10-multi-language-support)

---

# 1. OVERVIEW

## 1.1 What is REZ Chatbot Builder?

REZ Chatbot Builder is a **visual drag-and-drop flow builder** that enables merchants to create AI-powered conversational experiences without coding.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CHATBOT BUILDER - AT A GLANCE │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                     FLOW BUILDER INTERFACE                          │     │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │     │
│  │  │ TRIGGER  │───▶│ MESSAGE  │───▶│ QUESTION │───▶│  ACTION │      │     │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │     │
│  │       │               │               │               │               │     │
│  │       │          ┌────┴────┐    ┌────┴────┐    ┌────┴────┐        │     │
│  │       │          │         │    │         │    │         │        │     │
│  │       │     ┌────┴───┐ ┌───┴──┐ │    ┌────┴───┐ ┌───┴──┐ │    │     │
│  │       │     │ Text   │ │ Image │ │ Yes │    No  │ │ Save │ │    │     │
│  │       │     └────────┘ └───────┘ │    └────────┘ └──────┘ │    │     │
│  │       │                         │                         │    │     │
│  │       │                         └───────────────────────────┘    │     │
│  │       │                                                          │     │
│  └───────┼──────────────────────────────────────────────────────────┘     │
│          │                                                               │
│  ┌──────┴──────────────────────────────────────────────────────────┐      │
│  │                     NODE PALETTE                                   │      │
│  │  [Message] [Question] [Condition] [Action] [AI Agent] [Delay]  │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Differentiators

| Feature | Competitors | REZ Chatbot Builder |
|---------|-------------|-------------------|
| **No-Code** | All | Visual drag & drop |
| **AI Agents** | Basic | 38 AI agents integrated |
| **Multi-Channel** | Single | WhatsApp + Voice + Web |
| **Commerce** | None | Native catalog + checkout |
| **Learning** | None | Self-improving from conversations |
| **Templates** | Few | Industry-specific templates |
| **Testing** | Basic | Live preview + simulation |

---

# 2. FLOW BUILDER INTERFACE

## 2.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FLOW BUILDER - COMPLETE LAYOUT │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ [← Back]  Order Flow v2    [Draft ●]  [Preview] [Test] [Save] [Publish] │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────┬─────────────────────────────────────────────────┬─────────┐
│               │                                                 │         │
│  NODE PALETTE │              CANVAS                             │ SETTINGS│
│               │                                                 │         │
│ ┌───────────┐ │  ┌──────────────────────────────────────────┐  │ ┌─────┐ │
│ │ TRIGGERS  │ │  │                                          │  │ │Node │ │
│ │           │ │  │  ┌─────────┐     ┌─────────┐            │  │ │Settings│
│ │ [Keyword] │ │  │  │ START   │────▶│ MESSAGE │            │  │ │     │ │
│ │ [Intent]  │ │  │  └─────────┘     └────┬────┘            │  │ │Text │ │
│ │ [Menu]    │ │  │                       │                  │  │ │─────│ │
│ │ [Webhook] │ │  │                       ▼                  │  │ │     │ │
│ │ [Schedule]│ │  │                 ┌─────────┐              │  │ │     │ │
│ └───────────┘ │  │                 │QUESTION │              │  │ │     │ │
│               │  │                 └────┬────┘              │  │ │     │ │
│ ┌───────────┐ │  │                      │                   │  │ │     │ │
│ │ MESSAGES  │ │  │         ┌────────────┼────────────┐     │  │ │     │ │
│ │           │ │  │         ▼            ▼            ▼     │  │ │     │ │
│ │ [Text]    │ │  │   ┌─────────┐  ┌─────────┐  ┌─────────┐ │  │ │     │ │
│ │ [Image]   │ │  │   │  YES    │  │   NO    │  │ MAYBE   │ │  │ │     │ │
│ │ [Video]   │ │  │   └────┬────┘  └────┬────┘  └────┬────┘ │  │ │     │ │
│ │ [Audio]   │ │  │        │            │            │      │  │ │     │ │
│ │ [Document]│ │  │        │            │            │      │  │ │     │ │
│ │ [Location]│ │  │        ▼            ▼            ▼      │  │ │     │ │
│ │ [Card]    │ │  │   ┌────────┐ ┌────────┐ ┌────────┐    │  │ │     │ │
│ │ [Carousel]│ │  │   │Action A│ │Action B│ │Action C│    │  │ │     │ │
│ └───────────┘ │  │   └────────┘ └────────┘ └────────┘    │  │ │     │ │
│               │  │                                          │  │ │     │ │
│ ┌───────────┐ │  │                                          │  │ │     │ │
│ │ QUESTIONS │ │  │  ┌─────────┐                            │  │ │     │ │
│ │           │ │  │  │   +    │  ← Drag nodes here         │  │ │     │ │
│ │ [Choice]  │ │  │  └─────────┘                            │  │ │     │ │
│ │ [Input]   │ │  │                                          │  │ │     │ │
│ │ [Email]   │ │  └──────────────────────────────────────────┘  │ │     │ │
│ │ [Phone]   │ │                                                │  │ │     │ │
│ │ [Date]    │ │                                                │  │ │     │ │
│ │ [Number]  │ │                                                │  │ │     │ │
│ └───────────┘ │                                                │  │ │     │ │
│               │                                                │  │ │     │ │
│ ┌───────────┐ │                                                │  │ │     │ │
│ │ LOGIC     │ │                                                │  │ │     │ │
│ │           │ │                                                │  │ │     │ │
│ │ [Condition│ │                                                │  │ │     │ │
│ │ [Random]  │ │                                                │  │ │     │ │
│ │ [Wait]    │ │                                                │  │ │     │ │
│ │ [Go to]   │ │                                                │  │ │     │ │
│ └───────────┘ │                                                │  │ │     │ │
│               │                                                │  │ │     │ │
│ ┌───────────┐ │                                                │  │ │     │ │
│ │ ACTIONS   │ │                                                │  │ │     │ │
│ │           │ │                                                │  │ │     │ │
│ │ [API]     │ │                                                │  │ │     │ │
│ │ [Webhook] │ │                                                │  │ │     │ │
│ │ [Assign]  │ │                                                │  │ │     │ │
│ │ [Tag]     │ │                                                │  │ │     │ │
│ │ [Notify]  │ │                                                │  │ │     │ │
│ └───────────┘ │                                                │  │ │     │ │
│               │                                                │  │ │     │ │
│ ┌───────────┐ │                                                │  │ │     │ │
│ │ AI AGENTS │ │                                                │  │ │     │ │
│ │           │ │                                                │  │ │     │ │
│ │ [Sales]   │ │                                                │  │ │     │ │
│ │ [Support] │ │                                                │  │ │     │ │
│ │ [Consult] │ │                                                │  │ │     │ │
│ │ [Info]    │ │                                                │  │ │     │ │
│ │ [Custom]  │ │                                                │  │ │     │ │
│ └───────────┘ │                                                │  │ │     │ │
│               │                                                │  │ │     │ │
│ ┌───────────┐ │                                                │  │ │     │ │
│ │ INTEGRATE │ │                                                │  │ │     │ │
│ │           │ │                                                │  │ │     │ │
│ │ [Catalog] │ │                                                │  │ │     │ │
│ │ [Cart]    │ │                                                │  │ │     │ │
│ │ [Payment] │ │                                                │  │ │     │ │
│ │ [Calendar]│ │                                                │  │ │     │ │
│ └───────────┘ │                                                │  │ │     │ │
│               │                                                │  │ │     │ │
└───────────────┴─────────────────────────────────────────────────┴─────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CANVAS TOOLBAR                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Zoom: 100%] [Fit] [Grid: ●] [Snap: ●]  │  [Undo] [Redo] [Copy] [Delete] │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Node Types Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NODE TYPES QUICK REFERENCE                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRIGGERS (Starting Points)                                                  │
│ ─────────────────────────────                                                │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│ │Keyword  │ │ Intent  │ │  Menu   │ │ Webhook │ │Schedule │              │
│ │ Trigger │ │ Trigger │ │  Item   │ │         │ │         │              │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                              │
│ MESSAGES (Send Content)                                                     │
│ ─────────────────────────                                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│ │  Text   │ │  Image  │ │  Video  │ │ Carousel│ │  Card   │              │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                              │
│ QUESTIONS (Collect Input)                                                    │
│ ─────────────────────────                                                   │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│ │ Choice  │ │  Text   │ │  Email  │ │  Phone  │ │  Date   │              │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                              │
│ LOGIC (Control Flow)                                                        │
│ ─────────────────                                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │Condition│ │ Random  │ │  Wait   │ │ Go to   │                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
│                                                                              │
│ ACTIONS (Do Something)                                                      │
│ ─────────────────                                                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │API Call │ │ Assign  │ │   Tag   │ │ Notify  │                          │
│ │         │ │ Variable│ │  User   │ │ Staff   │                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
│                                                                              │
│ AI AGENTS (Smart Responses)                                                 │
│ ─────────────────────────                                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │  Sales  │ │ Support │ │Consult- │ │  Info   │                          │
│ │  Agent  │ │  Agent  │ │   ant   │ │  Agent  │                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
│                                                                              │
│ INTEGRATIONS (Commerce)                                                      │
│ ─────────────────────────                                                  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│ │ Show    │ │  Add to │ │Checkout │ │ Booking │                          │
│ │ Products │ │  Cart   │ │         │ │         │                          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. NODE TYPES

## 3.1 Trigger Nodes

### 3.1.1 Keyword Trigger

```typescript
interface KeywordTriggerNode {
  type: 'TRIGGER_KEYWORD';
  config: {
    keywords: string[];           // ["hi", "hello", "hey"]
    matchType: 'EXACT' | 'CONTAINS' | 'STARTS_WITH';
    caseSensitive: boolean;
    ignorePunctuation: boolean;
  };
}

// Example
{
  "type": "TRIGGER_KEYWORD",
  "position": { "x": 100, "y": 100 },
  "config": {
    "keywords": ["hi", "hello", "hey", "start", "help"],
    "matchType": "CONTAINS",
    "caseSensitive": false,
    "ignorePunctuation": true
  }
}
```

### 3.1.2 Intent Trigger

```typescript
interface IntentTriggerNode {
  type: 'TRIGGER_INTENT';
  config: {
    intents: string[];            // From REZ Intent Graph
    confidenceThreshold: number;  // 0.0 - 1.0
    fallbackFlow?: string;        // Flow ID if no match
  };
}

// Intents
const intents = [
  'ORDER_FOOD', 'VIEW_MENU', 'TRACK_ORDER', 'CANCEL_ORDER',
  'GET_INFO', 'BOOK_APPOINTMENT', 'ASK_QUESTION', 'PURCHASE',
  'SUPPORT_REQUEST', 'LEAVE_REVIEW'
];
```

### 3.1.3 Menu Trigger

```typescript
interface MenuTriggerNode {
  type: 'TRIGGER_MENU';
  config: {
    menuItems: Array<{
      id: string;
      label: string;            // "🛒 Shop Now"
      icon?: string;
      flowId?: string;          // Link to sub-flow
    }>;
    menuTitle?: string;
    menuMessage?: string;
  };
}
```

### 3.1.4 Schedule Trigger

```typescript
interface ScheduleTriggerNode {
  type: 'TRIGGER_SCHEDULE';
  config: {
    scheduleType: 'ONCE' | 'RECURRING';
    startDateTime?: Date;
    // For recurring
    cronExpression?: string;     // "0 9 * * *" = daily at 9 AM
    timezone: string;           // "Asia/Kolkata"
    maxRuns?: number;
    conditions?: {
      userSegment?: string;
      lastActivity?: {
        daysAgo: number;
        action?: string;
      };
    };
  };
}
```

## 3.2 Message Nodes

### 3.2.1 Text Message

```typescript
interface TextMessageNode {
  type: 'MESSAGE_TEXT';
  config: {
    text: string;               // Supports {{variables}}
    typingIndicator: boolean;   // Show "typing..." delay
    delayMs: number;           // Delay before sending
    quickReplies?: QuickReply[];
    personalization: {
      useFirstName: boolean;
      useLastName: boolean;
      useCustomFields: string[];
    };
  };
}

// Example
{
  "type": "MESSAGE_TEXT",
  "position": { "x": 300, "y": 100 },
  "config": {
    "text": "Hey {{user.firstName}}! 👋\n\nWelcome to {{merchant.name}}!\n\nHow can I help you today?",
    "typingIndicator": true,
    "delayMs": 500,
    "quickReplies": [
      { "id": "shop", "text": "🛒 Shop Now" },
      { "id": "track", "text": "📍 Track Order" },
      { "id": "help", "text": "❓ Help" }
    ],
    "personalization": {
      "useFirstName": true,
      "useLastName": false,
      "useCustomFields": ["membershipTier"]
    }
  }
}
```

### 3.2.2 Image Message

```typescript
interface ImageMessageNode {
  type: 'MESSAGE_IMAGE';
  config: {
    imageUrl: string;           // HTTPS URL
    caption?: string;            // Text below image
    buttons?: QuickReply[];
    altText?: string;
    sizeLimit?: {
      maxWidth: number;
      maxHeight: number;
      maxSizeMB: number;
    };
  };
}
```

### 3.2.3 Carousel Message

```typescript
interface CarouselMessageNode {
  type: 'MESSAGE_CAROUSEL';
  config: {
    cards: CarouselCard[];
    autoplay?: boolean;
    playInterval?: number;      // ms between cards
  };
}

interface CarouselCard {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: string;
  buttons: QuickReply[];
}

// Example
{
  "type": "MESSAGE_CAROUSEL",
  "config": {
    "cards": [
      {
        "id": "card_1",
        "imageUrl": "https://cdn.example.com/pizza1.jpg",
        "title": "Margherita Pizza 🍕",
        "subtitle": "Classic Italian",
        "price": "₹249",
        "buttons": [
          { "id": "add_1", "text": "🛒 Add" },
          { "id": "view_1", "text": "👁 View" }
        ]
      },
      {
        "id": "card_2",
        "imageUrl": "https://cdn.example.com/pizza2.jpg",
        "title": "Pepperoni Special 🌶️",
        "subtitle": "Extra cheesy",
        "price": "₹299",
        "buttons": [
          { "id": "add_2", "text": "🛒 Add" },
          { "id": "view_2", "text": "👁 View" }
        ]
      }
    ]
  }
}
```

### 3.2.4 Product Card

```typescript
interface ProductCardNode {
  type: 'MESSAGE_PRODUCT';
  config: {
    productId: string;          // From catalog
    displayType: 'CARD' | 'LIST';
    showPrice: boolean;
    showRating: boolean;
    showStock: boolean;
    buttons: QuickReply[];
    fallbackText?: string;      // If WhatsApp catalog not available
  };
}
```

## 3.3 Question Nodes

### 3.3.1 Choice Question

```typescript
interface ChoiceQuestionNode {
  type: 'QUESTION_CHOICE';
  config: {
    question: string;
    options: Array<{
      id: string;
      label: string;
      value: string;
      icon?: string;
      imageUrl?: string;
    }>;
    multiSelect: boolean;       // Allow multiple selections
    minSelections?: number;
    maxSelections?: number;
    required: boolean;
    saveAs: string;            // Variable name to save answer
    typingIndicator: boolean;
  };
}

// Example
{
  "type": "QUESTION_CHOICE",
  "config": {
    "question": "What would you like to order? 🍕",
    "options": [
      { "id": "veg", "label": "🥬 Vegetarian", "value": "veg" },
      { "id": "nonveg", "label": "🍗 Non-Veg", "value": "nonveg" },
      { "id": "both", "label": "🍽️ Both", "value": "both" },
      { "id": "surprise", "label": "🎲 Surprise me!", "value": "surprise" }
    ],
    "multiSelect": false,
    "required": true,
    "saveAs": "foodPreference",
    "typingIndicator": true
  }
}
```

### 3.3.2 Free Text Input

```typescript
interface TextInputNode {
  type: 'QUESTION_TEXT';
  config: {
    question: string;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    required: boolean;
    saveAs: string;
    validation?: {
      type: 'NONE' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'CUSTOM';
      pattern?: string;
      errorMessage?: string;
    };
    retryMessage?: string;
    maxRetries?: number;
  };
}
```

### 3.3.3 Date/Time Picker

```typescript
interface DateTimePickerNode {
  type: 'QUESTION_DATETIME';
  config: {
    question: string;
    pickerType: 'DATE' | 'TIME' | 'DATETIME';
    minDate?: Date;
    maxDate?: Date;
    minTime?: string;
    maxTime?: string;
    timeSlots?: Array<{
      start: string;  // "09:00"
      end: string;    // "10:00"
    }>;
    unavailableDays?: number[]; // 0 = Sunday
    saveAs: string;
    format?: string;           // Output format
  };
}
```

## 3.4 Logic Nodes

### 3.4.1 Condition

```typescript
interface ConditionNode {
  type: 'LOGIC_CONDITION';
  config: {
    conditions: Array<{
      field: string;           // Variable path
      operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
      value: any;
      connector?: 'AND' | 'OR';
    }>;
    defaultBranch: 'NO_MATCH'; // Where to go if no condition matches
  };
}

// Example
{
  "type": "LOGIC_CONDITION",
  "config": {
    "conditions": [
      {
        "field": "user.totalOrders",
        "operator": "GREATER_THAN",
        "value": 10,
        "connector": "AND"
      },
      {
        "field": "user.ltv",
        "operator": "GREATER_THAN",
        "value": 5000
      }
    ]
  }
}
```

### 3.4.2 Random Split

```typescript
interface RandomSplitNode {
  type: 'LOGIC_RANDOM';
  config: {
    branches: Array<{
      id: string;
      label: string;
      weight: number;           // Percentage (0-100)
    }>;
  };
}

// Example: A/B test
{
  "type": "LOGIC_RANDOM",
  "config": {
    "branches": [
      { "id": "control", "label": "Control (50%)", "weight": 50 },
      { "id": "variant_a", "label": "Variant A (50%)", "weight": 50 }
    ]
  }
}
```

### 3.4.3 Delay/Wait

```typescript
interface DelayNode {
  type: 'LOGIC_DELAY';
  config: {
    delayType: 'FIXED' | 'RANDOM' | 'UNTIL_TIME';
    duration: {
      min?: number;            // For RANDOM
      max?: number;            // For RANDOM
      value?: number;          // For FIXED (seconds)
    };
    action: 'CONTINUE' | 'RESEND_MESSAGE';
    message?: string;          // Message to resend
  };
}
```

## 3.5 Action Nodes

### 3.5.1 API Call

```typescript
interface APICallNode {
  type: 'ACTION_API';
  config: {
    api: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: object;
      timeout?: number;
    };
    mapping: {
      input: Array<{
        from: string;          // Variable path
        to: string;            // API param name
      }>;
      output: Array<{
        from: string;          // API response path
        to: string;            // Variable to save
      }>;
    };
    errorHandling: {
      onError: 'CONTINUE' | 'RETRY' | 'FALLBACK';
      retryCount?: number;
      fallbackValue?: any;
    };
  };
}
```

### 3.5.2 Assign Variable

```typescript
interface AssignVariableNode {
  type: 'ACTION_ASSIGN';
  config: {
    variables: Array<{
      name: string;
      value: string | number | boolean | object;
      operation: 'SET' | 'INCREMENT' | 'DECREMENT' | 'APPEND' | 'CLEAR';
    }>;
  };
}
```

### 3.5.3 Tag User

```typescript
interface TagUserNode {
  type: 'ACTION_TAG';
  config: {
    tags: string[];            // ["VIP", "interested_in_pizza", "new_customer"]
    action: 'ADD' | 'REMOVE' | 'TOGGLE';
    saveToProfile: boolean;    // Save to user profile
  };
}
```

## 3.6 AI Agent Nodes

### 3.6.1 Sales Agent

```typescript
interface SalesAgentNode {
  type: 'AGENT_SALES';
  config: {
    context: {
      goal: string;            // "Convert user to purchase"
      products?: string[];      // Specific products to recommend
      discountAllowed?: boolean;
      maxDiscount?: number;
    };
    behavior: {
      followUpEnabled: boolean;
      followUpDelay?: number;  // seconds
      maxFollowUps?: number;
      escalationEnabled: boolean;
      escalationCondition?: string;
    };
    responseStyle: 'FRIENDLY' | 'PROFESSIONAL' | 'URGENT';
  };
}
```

### 3.6.2 Support Agent

```typescript
interface SupportAgentNode {
  type: 'AGENT_SUPPORT';
  config: {
    context: {
      issueTypes: string[];    // ["order", "refund", "complaint"]
      canRefund: boolean;
      canCancel: boolean;
      maxRefundAmount?: number;
    };
    behavior: {
      autoResolve: boolean;
      escalationConditions: Array<{
        condition: string;
        priority: 'HIGH' | 'URGENT';
      }>;
      knowledgeBaseEnabled: boolean;
    };
    responseStyle: 'EMPATHETIC' | 'EFFICIENT';
  };
}
```

### 3.6.3 Consultant Agent

```typescript
interface ConsultantAgentNode {
  type: 'AGENT_CONSULTANT';
  config: {
    context: {
      domain: string;          // "food", "fashion", "health"
      expertiseLevel: 'BASIC' | 'ADVANCED';
      recommendProducts: boolean;
      explainRecommendations: boolean;
    };
    behavior: {
      askQualifyingQuestions: boolean;
      showComparisons: boolean;
      allowUserInput: boolean;
    };
  };
}
```

## 3.7 Integration Nodes

### 3.7.1 Show Products

```typescript
interface ShowProductsNode {
  type: 'INTEGRATION_CATALOG';
  config: {
    displayType: 'CAROUSEL' | 'LIST' | 'GRID';
    source: {
      type: 'CATEGORY' | 'SEARCH' | 'RECOMMENDED' | 'MANUAL';
      categoryId?: string;
      searchQuery?: string;
      productIds?: string[];
    };
    filters?: {
      maxPrice?: number;
      minRating?: number;
      dietary?: string[];
    };
    sortBy: 'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING';
    limit: number;
    showPrices: boolean;
    showRatings: boolean;
    addToCartEnabled: boolean;
  };
}
```

### 3.7.2 Add to Cart

```typescript
interface AddToCartNode {
  type: 'INTEGRATION_CART';
  config: {
    productId?: string;        // Fixed product
    useVariable?: string;       // From previous selection
    quantity?: number;
    allowCustomization: boolean;
    customizationNode?: string; // Node ID for customization
  };
}
```

### 3.7.3 Checkout

```typescript
interface CheckoutNode {
  type: 'INTEGRATION_CHECKOUT';
  config: {
    requireAddress: boolean;
    requirePayment: boolean;
    paymentMethods?: string[];
    defaultPaymentMethod?: string;
    allowSchedule: boolean;
    minOrderValue?: number;
    deliveryOptions: {
      delivery: boolean;
      pickup: boolean;
      both: boolean;
    };
  };
}
```

---

# 4. FLOW LOGIC

## 4.1 Flow Data Structure

```typescript
interface Flow {
  flowId: string;
  merchantId: string;

  // Metadata
  name: string;
  description?: string;
  version: number;
  status: 'DRAFT' | 'TESTING' | 'ACTIVE' | 'PAUSED';

  // Trigger configuration
  triggers: FlowTrigger[];

  // Flow definition
  nodes: FlowNode[];
  edges: FlowEdge[];

  // Variables
  variables: FlowVariable[];

  // Settings
  settings: FlowSettings;

  // AI settings
  ai: {
    enabled: boolean;
    fallbackToAgent?: string;   // Agent ID
    unknownIntentBehavior: 'END' | 'MAIN_MENU' | 'HUMAN' | 'SPECIFIC_FLOW';
  };

  // Analytics
  analytics: {
    totalStarts: number;
    totalCompletions: number;
    totalDropOffs: number;
    avgDuration: number;
  };

  // Versioning
  versions: FlowVersion[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface FlowNode {
  nodeId: string;
  type: string;                // Node type
  position: { x: number; y: number };
  data: NodeData;              // Node-specific configuration
  style?: NodeStyle;           // Visual styling
}

interface FlowEdge {
  edgeId: string;
  source: string;              // Source node ID
  target: string;              // Target node ID
  label?: string;
  condition?: EdgeCondition;
  style?: EdgeStyle;
}

interface FlowVariable {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY' | 'DATE';
  defaultValue?: any;
  scope: 'FLOW' | 'SESSION' | 'USER';
}
```

## 4.2 Flow Examples

### Example: Order Flow

```typescript
const orderFlow: Flow = {
  flowId: "flow_order_001",
  merchantId: "merchant_123",
  name: "Quick Order Flow",
  description: "Fast ordering from menu",
  status: "ACTIVE",
  triggers: [
    { type: "KEYWORD", keywords: ["order", "buy", "food"] },
    { type: "MENU", label: "🛒 Order Now" }
  ],
  nodes: [
    // Start
    {
      nodeId: "start",
      type: "START",
      position: { x: 100, y: 100 },
      data: {}
    },
    // Greeting
    {
      nodeId: "greeting",
      type: "MESSAGE_TEXT",
      position: { x: 300, y: 100 },
      data: {
        text: "Hey {{user.firstName}}! 🍕\nWhat would you like to order today?",
        quickReplies: [
          { id: "browse", text: "📋 Browse Menu" },
          { id: "search", text: "🔍 Search" },
          { id: "deals", text: "🔥 Today's Deals" }
        ]
      }
    },
    // Category Question
    {
      nodeId: "category",
      type: "QUESTION_CHOICE",
      position: { x: 500, y: 100 },
      data: {
        question: "What type of food are you in the mood for?",
        options: [
          { id: "veg", label: "🥬 Vegetarian", value: "veg" },
          { id: "nonveg", label: "🍗 Non-Veg", value: "nonveg" },
          { id: "beverages", label: "🥤 Beverages", value: "beverages" }
        ],
        saveAs: "foodCategory"
      }
    },
    // Show Products based on category
    {
      nodeId: "products",
      type: "INTEGRATION_CATALOG",
      position: { x: 700, y: 100 },
      data: {
        displayType: "CAROUSEL",
        source: { type: "CATEGORY", categoryId: "{{foodCategory}}" },
        limit: 10,
        showPrices: true,
        addToCartEnabled: true
      }
    },
    // Cart Check
    {
      nodeId: "cart_check",
      type: "LOGIC_CONDITION",
      position: { x: 900, y: 100 },
      data: {
        conditions: [
          { field: "cart.itemCount", operator: "GREATER_THAN", value: 0 }
        ]
      }
    },
    // Checkout (if cart has items)
    {
      nodeId: "checkout",
      type: "INTEGRATION_CHECKOUT",
      position: { x: 1100, y: 50 },
      data: {
        requireAddress: true,
        requirePayment: true
      }
    },
    // Empty Cart Message
    {
      nodeId: "empty_cart",
      type: "MESSAGE_TEXT",
      position: { x: 1100, y: 150 },
      data: {
        text: "Your cart is empty! 🛒\n\nWould you like to browse our menu?"
      }
    }
  ],
  edges: [
    { edgeId: "e1", source: "start", target: "greeting" },
    { edgeId: "e2", source: "greeting", target: "category" },
    { edgeId: "e3", source: "category", target: "products" },
    { edgeId: "e4", source: "products", target: "cart_check" },
    { edgeId: "e5", source: "cart_check", target: "checkout", condition: { field: "cart.itemCount", operator: "GREATER_THAN", value: 0 } },
    { edgeId: "e6", source: "cart_check", target: "empty_cart", condition: { field: "cart.itemCount", operator: "EQUALS", value: 0 } }
  ]
};
```

### Example: Lead Capture Flow

```typescript
const leadCaptureFlow: Flow = {
  flowId: "flow_lead_001",
  merchantId: "merchant_123",
  name: "Lead Capture",
  description: "Capture leads with WhatsApp",
  status: "ACTIVE",
  triggers: [
    { type: "KEYWORD", keywords: ["interested", "quote", "contact", "call me"] }
  ],
  nodes: [
    {
      nodeId: "start",
      type: "START",
      position: { x: 100, y: 100 },
      data: {}
    },
    {
      nodeId: "greeting",
      type: "MESSAGE_TEXT",
      position: { x: 300, y: 100 },
      data: {
        text: "Thanks for your interest! 🎉\n\nI'll need just a few details to help you. What's your name?"
      }
    },
    {
      nodeId: "name_input",
      type: "QUESTION_TEXT",
      position: { x: 500, y: 100 },
      data: {
        question: "",
        required: true,
        saveAs: "lead.name",
        validation: { type: "NONE" }
      }
    },
    {
      nodeId: "phone_input",
      type: "QUESTION_TEXT",
      position: { x: 700, y: 100 },
      data: {
        question: "Great, {{lead.name}}! And what's your phone number?",
        required: true,
        saveAs: "lead.phone",
        validation: { type: "PHONE" }
      }
    },
    {
      nodeId: "interest",
      type: "QUESTION_CHOICE",
      position: { x: 900, y: 100 },
      data: {
        question: "What service are you interested in?",
        options: [
          { id: "catering", label: "🍽️ Catering" },
          { id: "party", label: "🎈 Party Orders" },
          { id: "regular", label: "🍕 Regular Orders" }
        ],
        saveAs: "lead.interest"
      }
    },
    {
      nodeId: "save_lead",
      type: "ACTION_API",
      position: { x: 1100, y: 100 },
      data: {
        api: {
          url: "https://api.example.com/leads",
          method: "POST"
        },
        mapping: {
          input: [
            { from: "lead.name", to: "name" },
            { from: "lead.phone", to: "phone" },
            { from: "lead.interest", to: "interest" },
            { from: "user.userId", to: "sourceUserId" }
          ]
        }
      }
    },
    {
      nodeId: "confirm",
      type: "MESSAGE_TEXT",
      position: { x: 1300, y: 100 },
      data: {
        text: "Perfect! {{lead.name}}, we've got your details. 📝\n\nOur team will reach out to you at {{lead.phone}} within 24 hours about our {{lead.interest}} services!\n\nIs there anything else I can help with?"
      }
    },
    {
      nodeId: "tag_lead",
      type: "ACTION_TAG",
      position: { x: 1500, y: 100 },
      data: {
        tags: ["interested", "whatsapp_lead"],
        action: "ADD"
      }
    },
    {
      nodeId: "notify",
      type: "ACTION_NOTIFY",
      position: { x: 1700, y: 100 },
      data: {
        channel: "SLACK",
        message: "New lead: {{lead.name}} ({{lead.phone}}) interested in {{lead.interest}}"
      }
    }
  ],
  edges: [
    { edgeId: "e1", source: "start", target: "greeting" },
    { edgeId: "e2", source: "greeting", target: "name_input" },
    { edgeId: "e3", source: "name_input", target: "phone_input" },
    { edgeId: "e4", source: "phone_input", target: "interest" },
    { edgeId: "e5", source: "interest", target: "save_lead" },
    { edgeId: "e6", source: "save_lead", target: "confirm" },
    { edgeId: "e7", source: "confirm", target: "tag_lead" },
    { edgeId: "e8", source: "tag_lead", target: "notify" }
  ]
};
```

---

# 5. AI AGENT INTEGRATION

## 5.1 Agent Selection

```typescript
interface AgentSelector {
  selectAgent(context: AgentContext): AgentType;

  // Context includes:
  // - User history
  // - Current intent
  // - Conversation context
  // - Business rules
}

const agentSelectionRules: AgentSelectionRule[] = [
  {
    condition: (ctx) => ctx.intent === 'PURCHASE' || ctx.intent === 'PRODUCT_INQUIRY',
    agent: 'SALES'
  },
  {
    condition: (ctx) => ['CANCEL', 'REFUND', 'ISSUE'].includes(ctx.intent),
    agent: 'SUPPORT'
  },
  {
    condition: (ctx) => ctx.intent === 'RECOMMENDATION' || ctx.intent === 'COMPARISON',
    agent: 'CONSULTANT'
  },
  {
    condition: (ctx) => ['INFO', 'LOCATION', 'HOURS', 'FAQ'].includes(ctx.intent),
    agent: 'INFO'
  },
  {
    condition: () => true,
    agent: 'INFO' // Default
  }
];
```

## 5.2 Agent Handoff

```typescript
interface AgentHandoff {
  fromAgent: AgentType;
  toAgent: AgentType;
  reason: 'USER_REQUEST' | 'ESCALATION' | 'CONTEXT_CHANGE' | 'TIMEOUT';
  preserveContext: boolean;
}

// Preserve context when switching agents
const handoffContext = {
  conversationHistory: [],      // Last N messages
  userProfile: {},             // User data
  currentIntent: '',           // Active intent
  variables: {},              // Flow variables
  cartState: {},              // Cart data
  businessContext: {}          // Merchant, location, etc.
};
```

---

# 6. TESTING & DEBUGGING

## 6.1 Testing Modes

```typescript
interface TestingMode {
  mode: 'SIMULATE' | 'PREVIEW' | 'LIVE_TEST';

  // Simulation
  simulation?: {
    userProfile: UserProfile;
    userLocation?: Location;
    timeOfDay: string;
    userHistory: Conversation[];
  };

  // Preview
  preview?: {
    channel: 'WHATSAPP' | 'WEB';
    showTyping: boolean;
    showDeliveryStatus: boolean;
  };

  // Live Test
  liveTest?: {
    userPhone: string;
    notifyOnComplete: boolean;
    captureResponses: boolean;
  };
}
```

## 6.2 Debug Tools

```typescript
interface DebugTools {
  // Step-by-step execution
  stepMode: {
    enabled: boolean;
    breakPoints: string[];     // Node IDs
    variables: {
      showSystem: boolean;
      showUser: boolean;
      showFlow: boolean;
      showSession: boolean;
    };
  };

  // Variable inspector
  variableInspector: {
    currentValues: Record<string, any>;
    valueHistory: Array<{
      nodeId: string;
      variable: string;
      oldValue: any;
      newValue: any;
      timestamp: Date;
    }>;
  };

  // Execution log
  executionLog: Array<{
    step: number;
    nodeId: string;
    nodeType: string;
    input: any;
    output: any;
    duration: number;
    status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
    error?: string;
  }>;
}
```

---

# 7. DEPLOYMENT

## 7.1 Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DEPLOYMENT FLOW                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: VALIDATION                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ • Check all required fields                                                 │
│ • Validate API configurations                                              │
│ • Check for circular references                                            │
│ • Verify variable references                                               │
│ • Validate conditions                                                       │
│                                                                              │
│ ✅ All checks passed                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: TESTING                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ • Run test conversations                                                    │
│ • Check all paths                                                           │
│ • Verify integrations                                                      │
│ • Test edge cases                                                          │
│                                                                              │
│ ✅ 50 test cases passed                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: DEPLOYMENT OPTIONS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ [ ] Publish to Production                                                   │
│     All users will see this flow                                            │
│                                                                              │
│ [ ] Schedule Publication                                                    │
│     Publish at: [Date] [Time]                                               │
│                                                                              │
│ [x] Gradual Rollout                                                        │
│     Start with: [10%] of users                                              │
│     Increase by: [20%] every [1 hour]                                       │
│     Rollback if error rate > [5%]                                          │
│                                                                              │
│ [ ] A/B Test                                                                │
│     New flow: [50%]                                                         │
│     Current flow: [50%]                                                     │
│     Winner criteria: [Conversion rate]                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: MONITORING                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ • Real-time conversations                                                   │
│ • Error rate                                                                │
│ • User satisfaction                                                         │
│ • Conversion rate                                                           │
│ • Drop-off points                                                           │
│                                                                              │
│ ⚠️ Alert if error rate > 1%                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 7.2 Version Control

```typescript
interface FlowVersion {
  version: number;
  createdAt: Date;
  createdBy: string;
  changes: {
    added: string[];
    modified: string[];
    removed: string[];
  };
  changelog?: string;
  isRollback: boolean;
  rollbackFrom?: number;
}

// Version history
const versionHistory: FlowVersion[] = [
  {
    version: 1,
    createdAt: new Date('2026-05-01'),
    createdBy: 'admin@merchant.com',
    changes: { added: ['start', 'greeting'], modified: [], removed: [] },
    changelog: 'Initial flow creation'
  },
  {
    version: 2,
    createdAt: new Date('2026-05-05'),
    createdBy: 'admin@merchant.com',
    changes: { added: ['products'], modified: ['greeting'], removed: [] },
    changelog: 'Added product catalog integration'
  },
  {
    version: 3,
    createdAt: new Date('2026-05-10'),
    createdBy: 'admin@merchant.com',
    changes: { added: ['tag_lead'], modified: [], removed: [] },
    changelog: 'Added lead tagging'
  }
];
```

---

# 8. ANALYTICS

## 8.1 Flow Analytics

```typescript
interface FlowAnalytics {
  flowId: string;
  period: { start: Date; end: Date };

  // Overview
  overview: {
    totalStarts: number;
    totalCompletions: number;
    completionRate: number;
    avgDuration: number;        // seconds
    avgMessages: number;
  };

  // Funnel
  funnel: Array<{
    nodeId: string;
    nodeName: string;
    nodeType: string;
    reached: number;
    completed: number;
    dropped: number;
    dropRate: number;
    avgTimeSpent: number;
  }>;

  // Outcomes
  outcomes: {
    conversions: number;
    leadsCaptured: number;
    ordersPlaced: number;
    revenue: number;
    supportTickets: number;
  };

  // Paths
  pathAnalysis: Array<{
    path: string[];            // Node IDs
    count: number;
    avgDuration: number;
    conversionRate: number;
  }>;

  // Errors
  errors: Array<{
    nodeId: string;
    errorType: string;
    count: number;
    lastOccurrence: Date;
  }>;
}
```

## 8.2 Real-time Monitoring

```typescript
interface RealTimeMonitor {
  // Live conversations
  activeConversations: number;
  messagesPerMinute: number;

  // Health
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  errorRate: number;
  avgResponseTime: number;

  // Alerts
  alerts: Array<{
    type: 'ERROR_SPIKE' | 'DROPOUT_SPIKE' | 'PERFORMANCE';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    timestamp: Date;
    action?: string;
  }>;
}
```

---

# 9. TEMPLATES

## 9.1 Industry Templates

```typescript
interface FlowTemplate {
  templateId: string;
  name: string;
  description: string;
  industry: 'RESTAURANT' | 'RETAIL' | 'SALON' | 'HEALTHCARE' | 'REAL_ESTATE' | 'EDUCATION';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  features: string[];
  estimatedSetupTime: string;
  thumbnailUrl: string;
  flow: Flow;                  // Pre-built flow
}

// Available templates
const templates: FlowTemplate[] = [
  {
    templateId: "tpl_restaurant_order",
    name: "Quick Order Flow",
    description: "Let customers browse and order in minutes",
    industry: "RESTAURANT",
    difficulty: "BEGINNER",
    features: ["Product Catalog", "Cart", "Checkout", "Order Confirmation"],
    estimatedSetupTime: "10 minutes"
  },
  {
    templateId: "tpl_salon_booking",
    name: "Salon Appointment Booking",
    description: "Book appointments with staff selection",
    industry: "SALON",
    difficulty: "INTERMEDIATE",
    features: ["Service Selection", "Staff Preference", "Date/Time Picker", "Booking Confirmation"],
    estimatedSetupTime: "20 minutes"
  },
  {
    templateId: "tpl_lead_gen",
    name: "Lead Capture",
    description: "Capture and qualify leads automatically",
    industry: "REAL_ESTATE",
    difficulty: "BEGINNER",
    features: ["Name Capture", "Phone Capture", "Interest Selection", "CRM Integration"],
    estimatedSetupTime: "5 minutes"
  },
  {
    templateId: "tpl_customer_support",
    name: "Support Bot",
    description: "Handle common support queries",
    industry: "RETAIL",
    difficulty: "INTERMEDIATE",
    features: ["FAQ", "Order Lookup", "Cancellation", "Escalation"],
    estimatedSetupTime: "30 minutes"
  },
  {
    templateId: "tpl_reengagement",
    name: "Win Back Campaign",
    description: "Re-engage dormant customers",
    industry: "RESTAURANT",
    difficulty: "INTERMEDIATE",
    features: ["Segmentation", "Personalized Offer", "Limited Time", "One-Click Order"],
    estimatedSetupTime: "15 minutes"
  }
];
```

---

# 10. MULTI-LANGUAGE SUPPORT

## 10.1 Language Configuration

```typescript
interface MultiLanguageConfig {
  enabled: boolean;
  defaultLanguage: string;      // 'en', 'hi', etc.
  supportedLanguages: string[];
  autoDetect: boolean;

  // Per-message translations
  translations: {
    [messageId: string]: {
      [languageCode: string]: string;
    };
  };
}

// Supported languages
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳' }
];
```

## 10.2 Hinglish Support

```typescript
// Common Hinglish patterns
const hinglishMappings = {
  // Greetings
  "namaste": "hello",
  "hello": "hello",
  "hi": "hello",
  "hey": "hello",

  // Actions
  "order karna": "order",
  "khana": "food",
  "pizza": "pizza",
  "biryani": "biryani",
  "kitna time lagega": "delivery_time",

  // Quantities
  "ek": "1",
  "do": "2",
  "teen": "3",
  "chaar": "4",
  "paanch": "5"
};

// Intent mapping for Hinglish
const hinglishIntents = {
  "mujhe pizza chahiye": "ORDER_FOOD",
  "order karna hai": "ORDER_FOOD",
  "delivery kitne baje": "DELIVERY_TIME",
  "khaana kab aayega": "TRACK_ORDER"
};
```

---

# APPENDIX

## A. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + C` | Copy node |
| `Ctrl + V` | Paste node |
| `Ctrl + D` | Duplicate node |
| `Delete` | Delete node |
| `Space + Drag` | Pan canvas |
| `Scroll` | Zoom in/out |
| `Ctrl + A` | Select all |
| `Ctrl + S` | Save |
| `Ctrl + P` | Preview |

## B. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chatbot/flows` | GET | List flows |
| `/api/chatbot/flows` | POST | Create flow |
| `/api/chatbot/flows/:id` | GET | Get flow |
| `/api/chatbot/flows/:id` | PUT | Update flow |
| `/api/chatbot/flows/:id` | DELETE | Delete flow |
| `/api/chatbot/flows/:id/publish` | POST | Publish flow |
| `/api/chatbot/flows/:id/test` | POST | Test flow |
| `/api/chatbot/templates` | GET | List templates |
| `/api/chatbot/flows/:id/analytics` | GET | Get analytics |
| `/api/chatbot/flows/:id/versions` | GET | Version history |
