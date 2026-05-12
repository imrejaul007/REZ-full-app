# REZ AI Voice Agent - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Voice Pipeline](#3-voice-pipeline)
4. [IVR System](#4-ivr-system)
5. [Agent Types](#5-agent-types)
6. [Conversational AI](#6-conversational-ai)
7. [Multi-Language Support](#7-multi-language-support)
8. [Integrations](#8-integrations)
9. [Analytics & Monitoring](#9-analytics--monitoring)

---

# 1. OVERVIEW

## 1.1 What is REZ AI Voice Agent?

REZ AI Voice Agent is an **AI-powered voice system** that handles phone calls for merchants - answering queries, taking orders, booking appointments, and providing support - all through natural conversation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VOICE AGENT - USER EXPERIENCE                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CALLER: Dials merchant's number                                           │
│                                                                              │
│  AI VOICE: "Namaste! Welcome to Spice Kitchen. │
│             Main course ya drinks, kya chahiye?"                            │
│                                                                              │
│  CALLER: "Mujhe chicken biryani chahiye"                                   │
│                                                                              │
│  AI VOICE: "Chicken Biryani, perfect choice! │
│             Accha, quantity kya rakhni hai?"                                │
│                                                                              │
│  CALLER: "Ek aur ek free karke"                                            │
│                                                                              │
│  AI VOICE: "Done! Aapki order confirm ho gayi hai. │
│             Total 349 rupees. Koi aur chahiye?"                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **Natural Speech** | Human-like conversations in Hindi, English, Hinglish |
| **IVR System** | Multi-level phone menu system |
| **Order Taking** | Full voice-based ordering |
| **Appointment Booking** | Schedule management |
| **Customer Support** | FAQ, order tracking, cancellations |
| **Multi-language** | Hindi, English, regional languages |
| **24/7 Availability** | Always-on AI agent |
| **CRM Integration** | Sync with REZ CRM |

---

# 2. ARCHITECTURE

## 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VOICE AGENT - SYSTEM ARCHITECTURE                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHONE NETWORK                                     │
│                         (PSTN / Mobile)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TWILIO VOICE                                        │
│                     (Call Handling + SIP)                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        VOICE WEBHOK                                  │  │
│  │  • Incoming call events                                              │  │
│  │  • Call recording                                                    │  │
│  │  • Transcription                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REZ VOICE AGENT                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       STT (Speech-to-Text)                            │  │
│  │  • OpenAI Whisper API                                               │  │
│  │  • Multi-language support                                            │  │
│  │  • Noise cancellation                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    INTENT PROCESSOR                                   │  │
│  │  • Intent detection                                                  │  │
│  │  • Entity extraction                                                 │  │
│  │  • Language detection                                                │  │
│  │  • Sentiment analysis                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CONVERSATION ENGINE                                 │  │
│  │  • Context management                                                │  │
│  │  • Multi-turn dialog                                                │  │
│  │  • State machine                                                    │  │
│  │  • Memory management                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      AI AGENTS                                        │  │
│  │  • Sales Agent                                                       │  │
│  │  • Support Agent                                                     │  │
│  │  • Consultant Agent                                                  │  │
│  │  • Info Agent                                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    RESPONSE GENERATOR                                 │  │
│  │  • Natural language generation                                       │  │
│  │  • Multi-language support                                            │  │
│  │  • Personalization                                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    TTS (Text-to-Speech)                               │  │
│  │  • ElevenLabs API                                                   │  │
│  │  • Custom voice clones                                              │  │
│  │  • Multi-language                                                    │  │
│  │  • SSML support                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTERNAL SERVICES                                     │
│                                                                              │
│  • REZ Agent OS (38 agents)                                               │
│  • REZ Unified Engine (conversations)                                       │
│  • REZ CRM (customer data)                                                  │
│  • REZ WhatsApp Store (orders)                                              │
│  • REZ Payment (transactions)                                               │
│  • REZ Media Wallet (credits)                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. VOICE PIPELINE

## 3.1 Incoming Call Flow

```typescript
interface CallFlow {
  // Step 1: Call Received
  onCallReceived: async (callSid: string, from: string, to: string) => {
    // Log call
    const call = await createCallRecord({
      callSid,
      from,
      to,
      startTime: new Date()
    });

    // Check caller identity
    const caller = await identifyCaller(from);

    // Load caller context
    const context = await loadContext(caller);

    // Route to appropriate IVR
    return { call, caller, context };
  };

  // Step 2: IVR Greeting
  playGreeting: async (call: Call, context: CallerContext) => {
    // Generate personalized greeting
    const greeting = await generateGreeting(context);

    // Convert to speech
    const audio = await textToSpeech(greeting);

    // Play and wait for response
    return await twilio.playAndWait(call.callSid, audio);
  };

  // Step 3: Process Response
  processInput: async (audioUrl: string) => {
    // Transcribe
    const transcription = await speechToText(audioUrl);

    // Detect language
    const language = await detectLanguage(transcription.text);

    // Extract intent
    const intent = await extractIntent(transcription.text, language);

    return { transcription, language, intent };
  };
}
```

## 3.2 Speech-to-Text Configuration

```typescript
interface STTConfig {
  provider: 'whisper';
  
  // Model
  model: 'whisper-1';
  
  // Language
  language?: string; // Auto-detect if not specified
  
  // Response format
  responseFormat: 'verbose_json';
  
  // Timestamp
  timestampGranularities: ['word', 'segment'];
  
  // Filtering
  filterProfanity: boolean;
  removeDisfluencies: boolean;
  
  // Audio processing
  noiseReduction: boolean;
  echoCancellation: boolean;
  
  // Confidence threshold
  minConfidence: 0.7;
}

// Whisper model selection
const whisperModels = {
  'base': { speed: 'fast', accuracy: 'good', size: 'small' },
  'small': { speed: 'fast', accuracy: 'better', size: 'medium' },
  'medium': { speed: 'medium', accuracy: 'best', size: 'large' },
  'large': { speed: 'slow', accuracy: 'excellent', size: 'largest' }
};
```

## 3.3 Text-to-Speech Configuration

```typescript
interface TTSConfig {
  provider: 'elevenlabs';
  
  // Voice selection
  voice: {
    id: string;        // e.g., 'premade/帘聿'
    name: string;      // 'Adam' or custom clone
    language: string;  // 'hi', 'en', etc.
  };

  // Settings
  settings: {
    stability: number;       // 0-1, higher = more consistent
    similarityBoost: number; // 0-1, higher = more similar to original
    style: number;          // 0-1, higher = more expressive
    useSpeakerBoost: boolean;
  };

  // Output
  outputFormat: 'mp3_44100_128';
  
  // Optimization
  latency: 'normal' | 'balanced' | 'interactive';
}

// Indian voices
const indianVoices = {
  'premium_male': {
    id: 'premium_male_hindi',
    name: 'Raj',
    language: 'hi',
    description: 'Warm, friendly Hindi male voice'
  },
  'premium_female': {
    id: 'premium_female_hindi',
    name: 'Priya',
    language: 'hi',
    description: 'Professional Hindi female voice'
  },
  'english_male': {
    id: 'premium_male_english',
    name: 'Arjun',
    language: 'en',
    description: 'Indian English male voice'
  },
  'tamil': {
    id: 'premium_tamil',
    name: 'Karthik',
    language: 'ta',
    description: 'Tamil male voice'
  }
};
```

---

# 4. IVR SYSTEM

## 4.1 IVR Structure

```typescript
interface IVRMenu {
  menuId: string;
  merchantId: string;

  // Greeting
  greeting: {
    audioUrl?: string;      // Pre-recorded
    text?: string;          // TTS
    language: string;
  };

  // Menu options
  options: IVROption[];

  // Settings
  settings: {
    timeoutSeconds: number;
    maxRetries: number;
    timeoutMessage: string;
    errorMessage: string;
    noInputMessage: string;
  };

  // Fallback
  fallback?: {
    type: 'TRANSFER' | 'VOICEMAIL' | 'AGENT';
    destination?: string;
  };
}

interface IVROption {
  id: string;
  label: string;           // "Press 1 for English"
  dtmfKey?: string;       // '1', '2', etc.
  keywords?: string[];     // For voice: "English", "english"
  action: IVRAction;
}

interface IVRAction {
  type: 'MENU' | 'AGENT' | 'WEBHOOK' | 'TRANSFER' | 'VOICEMAIL' | 'MESSAGE';
  value?: string;
  agentType?: 'SALES' | 'SUPPORT' | 'CONSULTANT' | 'INFO';
}
```

## 4.2 IVR Menu Examples

### Main Menu (Hindi/English)

```typescript
const mainMenu: IVRMenu = {
  menuId: 'main',
  greeting: {
    text: "Namaste! Welcome to {merchantName}. For English, press 1. Agar aapko Hindi mein baat karni hai, toh 2 press karein.",
    language: 'multi'
  },
  options: [
    {
      id: 'english',
      label: 'English',
      dtmfKey: '1',
      keywords: ['english', 'press 1'],
      action: { type: 'MENU', value: 'main_english' }
    },
    {
      id: 'hindi',
      label: 'Hindi',
      dtmfKey: '2',
      keywords: ['hindi', 'हिंदी'],
      action: { type: 'MENU', value: 'main_hindi' }
    },
    {
      id: 'order',
      label: 'Place Order',
      dtmfKey: '3',
      keywords: ['order', 'खाना', 'food', 'biryani', 'pizza'],
      action: { type: 'AGENT', agentType: 'SALES' }
    },
    {
      id: 'track',
      label: 'Track Order',
      dtmfKey: '4',
      keywords: ['track', 'delivery', 'order status', 'कहाँ है'],
      action: { type: 'AGENT', agentType: 'INFO' }
    },
    {
      id: 'support',
      label: 'Customer Support',
      dtmfKey: '5',
      keywords: ['support', 'help', 'problem', 'cancel', 'refund', 'मदद'],
      action: { type: 'AGENT', agentType: 'SUPPORT' }
    },
    {
      id: 'hours',
      label: 'Store Hours',
      dtmfKey: '6',
      keywords: ['hours', 'timing', 'open', 'बंद', 'खुला'],
      action: { type: 'AGENT', agentType: 'INFO' }
    }
  ],
  settings: {
    timeoutSeconds: 5,
    maxRetries: 3,
    timeoutMessage: "Sorry, I didn't hear anything. Please select an option.",
    errorMessage: "Sorry, that's not a valid option. Please try again."
  },
  fallback: {
    type: 'AGENT',
    agentType: 'SUPPORT'
  }
};
```

### Order Menu (Hindi)

```typescript
const orderMenu: IVRMenu = {
  menuId: 'order_hindi',
  greeting: {
    text: "Order line! Aap kya order karna chahte hain?",
    language: 'hi'
  },
  options: [
    {
      id: 'browse',
      label: 'Browse Menu',
      keywords: ['menu', 'dekhna', 'show', 'biryani', 'pizza', 'dal', 'roti'],
      action: { type: 'AGENT', agentType: 'SALES' }
    },
    {
      id: 'special',
      label: "Today's Specials",
      keywords: ['special', 'today', 'offer', 'deal', 'offer'],
      action: { type: 'AGENT', agentType: 'SALES' }
    },
    {
      id: 'reorder',
      label: 'Reorder Previous',
      keywords: ['same', 'previous', 'last', 'pichla'],
      action: { type: 'AGENT', agentType: 'SALES' }
    },
    {
      id: 'speak_agent',
      label: 'Speak to Agent',
      keywords: ['agent', 'कर्मचारी', 'help', 'बात करना'],
      action: { type: 'AGENT', agentType: 'SALES' }
    }
  ]
};
```

---

# 5. AGENT TYPES

## 5.1 Sales Agent (Voice)

```typescript
interface VoiceSalesAgent {
  type: 'VOICE_SALES';

  // Capabilities
  capabilities: {
    takeOrders: true;
    modifyOrders: true;
    cancelOrders: true;
    applyDiscounts: boolean;
    maxDiscountPercent: number;
    acceptPayments: boolean;
    sendConfirmations: true;
  };

  // Conversation flow
  flows: {
    newOrder: OrderFlow;
    reorder: ReorderFlow;
    modify: ModifyOrderFlow;
  };

  // Voice settings
  voice: {
    personality: 'HELPFUL' | 'PERSUASIVE' | 'FRIENDLY';
    speakingRate: number;  // 0.8-1.2
    pitch: number;
    warmth: number;       // 0-1
  };
}

// Order flow states
const orderFlow = {
  states: [
    {
      id: 'GREETING',
      prompt: "Namaste! Aap order karna chahte hain? Main aapki kaise madad kar sakta hoon?",
      expect: ['CONFIRM', 'PRODUCT_INQUIRY', 'HELP']
    },
    {
      id: 'PRODUCT_SELECTION',
      prompt: "Accha! Kaunsa item add karna hai?",
      action: 'SHOW_CATALOG',
      expect: ['PRODUCT_SELECTED', 'CUSTOMIZATION']
    },
    {
      id: 'CUSTOMIZATION',
      prompt: "Kya aapko koi customization chahiye? Size, extras, ya special instructions?",
      expect: ['CUSTOMIZATION_COMPLETE', 'SKIP']
    },
    {
      id: 'QUANTITY',
      prompt: "Kitni quantity rakhni hai?",
      expect: ['QUANTITY']
    },
    {
      id: 'MORE_ITEMS',
      prompt: "Koi aur item add karna hai?",
      expect: ['YES', 'NO']
    },
    {
      id: 'ADDRESS',
      prompt: "Delivery address kya hai?",
      action: 'GET_ADDRESS',
      expect: ['ADDRESS_CONFIRMED']
    },
    {
      id: 'TIME',
      prompt: "ASAP delivery चाहते हैं या schedule करना है?",
      expect: ['ASAP', 'SCHEDULED']
    },
    {
      id: 'PAYMENT',
      prompt: "Payment mode select karein: REZ Wallet, UPI, ya Cash on Delivery?",
      expect: ['PAYMENT_METHOD']
    },
    {
      id: 'CONFIRMATION',
      prompt: "Order confirm karein? Total ₹{total} - Delivery ₹{delivery} = ₹{grandTotal}",
      expect: ['CONFIRMED']
    }
  ]
};
```

## 5.2 Support Agent (Voice)

```typescript
interface VoiceSupportAgent {
  type: 'VOICE_SUPPORT';

  // Capabilities
  capabilities: {
    cancelOrders: boolean;
    refundOrders: boolean;
    modifyOrders: boolean;
    trackOrders: boolean;
    fileComplaints: boolean;
    escalateToHuman: boolean;
    maxRefundAmount: number;
  };

  // Resolution types
  resolutionTypes: {
    cancel: { allowed: true; refundTimeline: 'INSTANT' | '24_HOURS' };
    refund: { allowed: true; maxAmount: number };
    replace: { allowed: boolean };
    exchange: { allowed: boolean };
    credit: { allowed: boolean };
  };

  // Escalation rules
  escalation: {
    conditions: [
      { type: 'COMPLAINT', severity: 'HIGH' },
      { type: 'AMOUNT', threshold: 5000 },
      { type: 'ATTEMPTS', max: 3 },
      { type: 'SENTIMENT', score: 0.2 }  // Negative sentiment
    ];
    transferTo: 'support_queue';
  };
}

// Support flow states
const supportFlow = {
  states: [
    {
      id: 'IDENTIFY',
      prompt: "Aapki help kya hai aaj? Order cancel, refund, ya koi aur problem?",
      expect: ['CANCEL', 'REFUND', 'TRACK', 'COMPLAINT', 'OTHER']
    },
    {
      id: 'VERIFY_IDENTITY',
      prompt: "Security ke liye, aapka order number bataiye?",
      action: 'VERIFY_ORDER'
    },
    {
      id: 'HANDLE_CANCEL',
      prompt: "Aapka order #{{orderId}} {{status}}. Cancel karna hai?",
      expect: ['CONFIRM']
    },
    {
      id: 'HANDLE_REFUND',
      prompt: "Refund {{amount}} rupees, aapke REZ wallet mein {{timeline}} mein aayega. Confirm hai?",
      expect: ['CONFIRM']
    },
    {
      id: 'HANDLE_TRACK',
      prompt: "Aapka order #{{orderId}} - {{status}}. {{eta}} mein deliver hoga.",
      expect: ['MORE_HELP', 'CLOSE']
    },
    {
      id: 'ESCALATE',
      prompt: "Main aapko our team se connect karta hoon. Please hold karein.",
      action: 'TRANSFER'
    }
  ]
};
```

## 5.3 Info Agent (Voice)

```typescript
interface VoiceInfoAgent {
  type: 'VOICE_INFO';

  // Knowledge base
  knowledgeBase: {
    categories: string[];
    sources: Array<{
      type: 'FAQ' | 'MENU' | 'BUSINESS_INFO' | 'POLICY';
      content: any;
    }>;
  };

  // Information types
  infoTypes: {
    businessHours: true;
    location: true;
    menu: true;
    pricing: true;
    policies: true;
    contactInfo: true;
    productInfo: true;
    orderStatus: true;
  };
}

// Info responses
const infoResponses = {
  hours: {
    prompt: "Hamari timing hai - Day 11 AM se 11 PM tak. Sunday ko 12 PM se start hota hai.",
    variations: [
      "खुलने का समय 11 बजे है, बंद 11 बजे",
      "We open at 11 AM and close at 11 PM"
    ]
  },
  location: {
    prompt: "Hamara address hai - {{address}}. Delivery available hai {{radius}} km radius mein.",
    variations: ["Location hai {{landmark}} ke paas"]
  },
  menu: {
    prompt: "Hamare pas bahut saare options hain - Starters, Main Course, Breads, Drinks, Desserts. Kya aapko kuch specific chahiye?"
  },
  pricing: {
    prompt: "Prices menu ke according hain. Items ₹49 se ₹499 tak available hain. Aap konsa section dekhna chahte hain?"
  }
};
```

---

# 6. CONVERSATIONAL AI

## 6.1 Intent Detection

```typescript
interface IntentDetection {
  // Supported intents
  intents = [
    // Sales
    'ORDER_FOOD',
    'BROWSE_MENU',
    'MODIFY_ORDER',
    'CANCEL_ORDER',
    'REORDER',
    'CHECK_PRICE',
    'ASK_RECOMMENDATION',

    // Support
    'TRACK_ORDER',
    'REQUEST_REFUND',
    'FILE_COMPLAINT',
    'GET_HELP',

    // Info
    'GET_HOURS',
    'GET_LOCATION',
    'GET_MENU_INFO',
    'GET_POLICY',

    // General
    'YES',
    'NO',
    'REPEAT',
    'SPEAK_TO_AGENT',
    'GOODBYE'
  ];

  // Examples per intent (for training)
  examples = {
    ORDER_FOOD: [
      "Mujhe pizza chahiye",
      "I want to order biryani",
      "Order karna hai",
      "Main food order karna chahta hoon",
      "Can I place an order?",
      "Khana order karna hai"
    ],
    TRACK_ORDER: [
      "Where is my order",
      "Order kahan hai",
      "Delivery kitni der mein aayegi",
      "Track my order",
      "Order status batao",
      "mera khana kab aayega"
    ]
  };
}
```

## 6.2 Entity Extraction

```typescript
interface EntityExtraction {
  // Entity types
  entities = {
    product: {
      patterns: ['biryani', 'pizza', 'burger', '₹299'],
      normalize: true
    },
    quantity: {
      patterns: ['ek', 'do', 'teen', 'one', 'two', '1', '2', '3'],
      toNumber: true
    },
    time: {
      patterns: ['abhi', 'now', 'ASAP', 'later', '7 baje', '7 o clock'],
      toISO: true
    },
    price: {
      patterns: ['₹299', '300 rupees', 'three hundred'],
      toNumber: true
    },
    address: {
      patterns: ['ghar pe', 'office', 'home', 'address'],
      extractFull: true
    },
    phone: {
      patterns: ['phone', 'number', 'mobile'],
      confirm: true
    }
  };
}
```

## 6.3 Context Management

```typescript
interface VoiceContext {
  // Call context
  callId: string;
  callerNumber: string;
  callerId?: string;
  merchantId: string;

  // Conversation state
  conversation: {
    history: ConversationTurn[];
    currentState: string;
    currentIntent?: string;
    currentEntities: Record<string, any>;
  };

  // User context
  user?: {
    userId: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
    preferences: string[];
    dietaryRestrictions: string[];
    recentOrders: Order[];
  };

  // Order context (if in order flow)
  order?: {
    orderId?: string;
    items: OrderItem[];
    deliveryAddress?: string;
    deliveryTime?: string;
    total: number;
  };

  // Settings
  settings: {
    language: 'en' | 'hi' | 'auto';
    voiceId: string;
    speakingRate: number;
  };
}
```

---

# 7. MULTI-LANGUAGE SUPPORT

## 7.1 Supported Languages

```typescript
interface SupportedLanguages {
  languages: Array<{
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    enabled: boolean;
    voiceId: string;
  }>;

  default = [
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', voiceId: 'premium_hindi_male' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', voiceId: 'premium_english_male' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', voiceId: 'premium_tamil_male' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', voiceId: 'premium_telugu_male' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', voiceId: 'premium_bengali_male' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', voiceId: 'premium_marathi_male' }
  ];
}
```

## 7.2 Language Detection

```typescript
interface LanguageDetection {
  // Detection method
  method: 'whisper' | 'custom';

  // Whisper auto-detection
  whisperAutoDetect: true;

  // Fallback
  fallbackLanguage: 'en';

  // Switching rules
  switchTriggers: [
    { pattern: 'hindi', 'हिंदी', target: 'hi' },
    { pattern: 'english', target: 'en' },
    { pattern: 'तमिल', target: 'ta' }
  ];

  // Mixed language (Hinglish)
  supportHinglish: true;
  hinglishDetection: {
    baseLanguage: 'hi',
    englishSegments: ['order', 'delivery', 'payment', 'confirm', 'total']
  };
}
```

## 7.3 Response Templates

```typescript
interface ResponseTemplates {
  // Per language
  templates: {
    // Hindi
    hi: {
      greeting: "Namaste! {merchantName} mein welcome!",
      orderConfirm: "Aapka order confirm ho gaya hai!",
      total: "Total hai ₹{amount}",
      delivery: "Delivery time hai {time} minutes"
    },
    // English
    en: {
      greeting: "Hello! Welcome to {merchantName}!",
      orderConfirm: "Your order has been confirmed!",
      total: "Your total is ₹{amount}",
      delivery: "Delivery time is {time} minutes"
    },
    // Hinglish (mixed)
    hn_en: {
      greeting: "Namaste! Welcome to {merchantName}!",
      orderConfirm: "Aapka order confirm ho gaya hai! Order #{{orderId}}",
      total: "Total bill hai ₹{amount}",
      delivery: "{time} minutes mein delivery ho jayegi"
    }
  };
}
```

---

# 8. INTEGRATIONS

## 8.1 External Services

```typescript
interface VoiceIntegrations {
  // Telephony
  telephony: {
    provider: 'TWILIO';
    accountSid: string;
    authToken: string;

    // Webhook URLs
    webhooks: {
      voice: string;
      status: string;
      recording: string;
    };

    // Phone numbers
    phoneNumbers: string[];
  };

  // AI Services
  aiServices: {
    stt: {
      provider: 'OPENAI_WHISPER';
      apiKey: string;
      model: 'whisper-1';
    };
    tts: {
      provider: 'ELEVENLABS';
      apiKey: string;
      voices: Record<string, string>;
    };
    llm: {
      provider: 'ANTHROPIC' | 'OPENAI';
      apiKey: string;
      model: 'claude-3-sonnet';
    };
  };
}
```

## 8.2 Internal Services

```typescript
interface InternalIntegrations {
  // REZ Agent OS
  agentOS: {
    url: string;
    timeout: number;
    retryAttempts: number;
  };

  // REZ CRM
  crm: {
    url: string;
    syncContacts: boolean;
    logConversations: boolean;
  };

  // REZ WhatsApp Store
  store: {
    url: string;
    createOrders: boolean;
    syncInventory: boolean;
  };

  // REZ Media Wallet
  wallet: {
    url: string;
    checkBalance: boolean;
    deductCredits: boolean;
  };
}
```

---

# 9. ANALYTICS & MONITORING

## 9.1 Call Metrics

```typescript
interface CallMetrics {
  // Volume
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  abandonedCalls: number;

  // Duration
  avgCallDuration: number;    // seconds
  avgTalkTime: number;
  avgHoldTime: number;
  maxCallDuration: number;

  // Resolution
  callsResolved: number;
  callsEscalated: number;
  resolutionRate: number;

  // Agents
  aiHandledCalls: number;
  humanHandledCalls: number;
  transferRate: number;

  // IVR
  ivrCompletionRate: number;
  ivrDropOffRate: number;
}

interface IntentMetrics {
  intent: string;
  count: number;
  avgConfidence: number;
  resolutionRate: number;
}

interface LanguageMetrics {
  language: string;
  callCount: number;
  avgSentiment: number;
  resolutionRate: number;
}
```

## 9.2 Real-time Monitoring

```typescript
interface VoiceDashboard {
  // Live stats
  live: {
    activeCalls: number;
    waitingCalls: number;
    avgWaitTime: number;
    agentsAvailable: number;
  };

  // Alerts
  alerts: Array<{
    type: 'ERROR_RATE' | 'LONG_WAIT' | 'TRANSFER_SPIKE';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    value: number;
    threshold: number;
  }>;

  // Quality
  quality: {
    avgSentiment: number;
    avgConfidence: number;
    errorRate: number;
    callQualityScore: number;
  };
}
```

---

# APPENDIX

## A. Voice Commands Reference

```typescript
const voiceCommands = {
  // Navigation
  'go back': 'Navigate to previous state',
  'main menu': 'Return to main menu',
  'repeat': 'Repeat last message',
  'speak slower': 'Reduce speaking rate',
  'speak faster': 'Increase speaking rate',

  // Actions
  'yes': 'Confirm action',
  'no': 'Decline action',
  'confirm': 'Confirm action',
  'cancel': 'Cancel current action',
  'place order': 'Start order flow',
  'track order': 'Start tracking',

  // Products
  'biryani': 'Show biryani options',
  'pizza': 'Show pizza options',
  'combo': 'Show combo meals',

  // Support
  'cancel my order': 'Start cancellation flow',
  'refund': 'Start refund flow',
  'speak to agent': 'Transfer to human',
  'not happy': 'Escalate to support'
};
```

## B. Error Handling

```typescript
const errorHandling = {
  // STT errors
  stt: {
    'no_audio': 'Sorry, I didn\'t catch that. Please try speaking again.',
    'low_confidence': 'I\'m not sure I heard you correctly. Could you please repeat?',
    'language_mismatch': 'Sorry, I can\'t understand that language. Please speak in Hindi or English.'
  },

  // Intent errors
  intent: {
    'low_confidence': 'I\'m not sure what you mean. Could you please clarify?',
    'unknown_intent': 'Sorry, I didn\'t understand that. Let me connect you to an agent.',
    'multiple_intents': 'I heard multiple things. Did you want to order food or track your order?'
  },

  // System errors
  system: {
    'service_unavailable': 'Sorry, we\'re experiencing technical difficulties. Please try again later.',
    'timeout': 'The system is taking too long to respond. Please wait.',
    'connection_lost': 'Connection seems to be lost. Please call again.'
  }
};
```

## C. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/call/start` | POST | Initiate outbound call |
| `/api/voice/call/end` | POST | End call |
| `/api/voice/call/event` | POST | Webhook for call events |
| `/api/voice/ivr/:merchantId` | GET | Get IVR configuration |
| `/api/voice/ivr/:merchantId` | PUT | Update IVR configuration |
| `/api/voice/usage/:merchantId` | GET | Get usage statistics |
| `/api/voice/recordings` | GET | List call recordings |
| `/api/voice/transcriptions` | GET | Get call transcriptions |
