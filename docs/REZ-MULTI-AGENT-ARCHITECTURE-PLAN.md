# REZ Agent OS - Multi-Agent Architecture Plan

**Version:** 2.0
**Status:** Ready for Implementation
**Created:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Layer 1: Global Core Brain](#3-layer-1-global-core-brain)
4. [Layer 2: Industry Expert Agents](#4-layer-2-industry-expert-agents)
5. [Layer 3: Functional Agents](#5-layer-3-functional-agents)
6. [Layer 4: Orchestrator](#6-layer-4-orchestrator)
7. [Context Engine](#7-context-engine)
8. [Agent Collaboration](#8-agent-collaboration)
9. [Dynamic Routing](#9-dynamic-routing)
10. [Implementation Plan](#10-implementation-plan)
11. [Service Specifications](#11-service-specifications)

---

# 1. EXECUTIVE SUMMARY

## The Vision

Build REZ Agent OS as a **multi-agent AI operating system** where specialized industry experts collaborate seamlessly to provide the best customer experience.

## Key Principles

| Principle | Description |
|-----------|-------------|
| **Invisible Switching** | Users never see agent changes |
| **Expert Specialization** | Each agent is an industry expert |
| **Shared Intelligence** | All agents share global context |
| **Dynamic Routing** | Intelligent routing based on context |
| **Seamless Collaboration** | Multiple agents can work together |

## User Experience

```
BEFORE (Old Model):
"Connecting you to Support Agent..."
"Transferring to Billing..."
[User frustration increases]

AFTER (New Model):
[Seamless expert handoff]
User: "Book me a gym nearby"
System: (silently switches expertise)
"Found 2 gyms near you!"
```

---

# 2. ARCHITECTURE OVERVIEW

## Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                                    │
│              WhatsApp │ Voice │ Copilot │ Website │ App                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONTEXT ENGINE                                        │
│     Entry Point │ Merchant Type │ Intent │ History │ Session Context        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR                                       │
│      Dynamic Routing │ Agent Selection │ Collaboration │ Escalation          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   LAYER 2        │    │   LAYER 2        │    │   LAYER 3         │
│ Industry Experts  │    │ Industry Experts │    │ Functional Agents │
│                   │    │                   │    │                   │
│ Hospitality      │    │ Culinary        │    │ Sales            │
│ Culinary         │    │ Travel         │    │ Support          │
│ Travel          │    │ Fitness        │    │ Billing          │
│ Fitness         │    │ Health         │    │ Fraud            │
│ Health          │    │ Retail         │    │ Recommendation   │
│ Retail          │    │ Salon          │    │ Notification     │
│ Salon           │    │ Education      │    │                  │
└───────────────────┘    └───────────────────┘    └───────────────────┘
              │                        │                        │
              └────────────────────────┼────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 1: GLOBAL CORE BRAIN                           │
│                                                                              │
│  Memory │ Identity │ Personalization │ Wallet │ Loyalty │ Intent Graph     │
│  Knowledge Graph │ User Graph │ Tone Engine │ Session Store                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. LAYER 1: GLOBAL CORE BRAIN

The foundation that powers all agents.

## Components

| Component | Purpose |
|----------|---------|
| **Memory** | Conversation history, preferences, context |
| **Identity** | User authentication, profiles, accounts |
| **Personalization** | User preferences, behavior, patterns |
| **Wallet** | REZ Coins, payments, transactions |
| **Loyalty** | Points, tiers, rewards |
| **Intent Graph** | Unified intent detection across all channels |
| **Knowledge Graph** | Entity relationships, business knowledge |
| **User Graph** | User profiles, connections, relationships |
| **Tone Engine** | Personality, language, communication style |
| **Session Store** | Redis-backed session management |

## Service: `rez-core-brain`

**Location:** `REZ-Intelligence/rez-core-brain/`

### Features

```typescript
interface CoreBrain {
  // Memory
  memory: {
    shortTerm: SessionMemory;     // Current conversation
    longTerm: UserMemory;         // User history
    shared: SharedContext;         // Cross-agent context
  };

  // Identity
  identity: {
    userId: string;
    merchantId: string;
    sessionId: string;
    merchantType: MerchantType;
    app: AppType;
    channel: Channel;
  };

  // Personalization
  personalization: {
    language: string;
    tone: ToneType;
    preferences: Record<string, any>;
    dietaryRestrictions?: string[];
    favoriteCategories?: string[];
  };

  // Context
  context: {
    entryPoint: EntryPoint;        // QR, App, Voice, etc.
    merchantCategory: string;
    currentWorkflow?: string;
    recentIntents: string[];
    activeAgents: string[];
  };
}
```

---

# 4. LAYER 2: INDUSTRY EXPERT AGENTS

Specialized agents for each industry vertical.

## Expert Agents

| Expert | Industry | Primary Use Cases |
|--------|----------|------------------|
| **Hospitality Expert** | Hotels, Stays, Resorts | Check-in/out, room service, concierge, housekeeping |
| **Culinary Expert** | Restaurants, Cloud Kitchens | Menu, ordering, dietary, recommendations |
| **Travel Expert** | Trips, Bookings | Itineraries, transport, destinations |
| **Fitness Expert** | Gyms, Wellness | Plans, bookings, progress tracking |
| **Health Expert** | Clinics, Healthcare | Appointments, symptoms, packages |
| **Retail Expert** | E-commerce, Shops | Products, sizing, comparisons |
| **Salon Expert** | Beauty, Spa | Services, bookings, treatments |
| **Education Expert** | Courses, Learning | Content, progress, recommendations |

## Expert Pack Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPERT PACK TEMPLATE │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ExpertAgent/ │
│ │
│ ├── src/ │
│ │   ├── index.ts              # Agent entry point │
│ │   │
│ │   ├── config/ │
│ │   │   ├── systemPrompt.ts   # Industry-specific system prompt │
│ │   │   ├── tone.ts          # Communication style │
│ │   │   └── knowledge.ts      # Industry knowledge base │
│ │   │
│ │   ├── services/ │
│ │   │   ├── expertise.ts      # Industry expertise │
│ │   │   ├── workflows.ts     # Industry workflows │
│ │   │   ├── recommendations.ts # Industry-specific recommendations │
│ │   │   └── apis.ts          # Industry API integrations │
│ │   │
│ │   ├── intents/ │
│ │   │   └── industryIntents.ts # Industry-specific intents │
│ │   │
│ │   ├── responses/ │
│ │   │   └── templates.ts     # Industry response templates │
│ │   │
│ │   └── utils/ │
│ │       └── industryHelpers.ts #
│ │
│ ├── tests/ │
│ └── README.md │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Industry Expert Details

### 4.1 Hospitality Expert

**Location:** `REZ-Intelligence/rez-hospitality-expert/`

```typescript
interface HospitalityExpert {
  industry = 'HOSPITALITY';
  
  // Expertise
  expertise = [
    'hotel_operations',
    'checkin_checkout',
    'room_service',
    'housekeeping',
    'concierge',
    'amenities',
    'local_recommendations',
    'booking_extensions',
    'complaints_resolution'
  ];

  // APIs
  apis = [
    'property_management',
    'booking_system',
    'housekeeping_system',
    'point_of_sale'
  ];

  // Tone
  tone = {
    professional: true,
    warm: true,
    anticipatory: true,  // Hospitality best practice
    formal: false
  };

  // Knowledge Base
  knowledge = {
    hotel_terms: [...],
    room_types: [...],
    amenities: [...],
    policies: [...],
    local_area: [...]
  };
}
```

### 4.2 Culinary Expert

**Location:** `REZ-Intelligence/rez-culinary-expert/`

```typescript
interface CulinaryExpert {
  industry = 'CULINARY';
  
  expertise = [
    'menu_navigation',
    'dietary_filtering',
    'food_pairing',
    'spice_levels',
    'allergen_awareness',
    'cuisine_types',
    'recommendations',
    'order_optimization',
    'dietary_psychology'
  ];

  apis = [
    'menu_service',
    'inventory',
    'kitchen_display',
    'delivery_tracking'
  ];

  tone = {
    friendly: true,
    enthusiastic: true,  // About food!
    knowledgeable: true,
    casual: true
  };

  knowledge = {
    cuisines: [...],
    ingredients: [...],
    allergens: [...],
    dietary_tags: [...],
    pairings: [...]
  };
}
```

### 4.3 Fitness Expert

**Location:** `REZ-Intelligence/rez-fitness-expert/`

```typescript
interface FitnessExpert {
  industry = 'FITNESS';
  
  expertise = [
    'workout_plans',
    'progress_tracking',
    'goal_setting',
    'nutrition_guidance',
    'class_bookings',
    'trainer_booking',
    'equipment_usage',
    'motivation'
  ];

  apis = [
    'booking_system',
    'workout_tracking',
    'nutrition_database'
  ];

  tone = {
    energetic: true,
    motivational: true,
    supportive: true,
    professional: false  // More buddy-like
  };
}
```

### 4.4 Health Expert

**Location:** `REZ-Intelligence/rez-health-expert/`

```typescript
interface HealthExpert {
  industry = 'HEALTHCARE';
  
  expertise = [
    'appointment_booking',
    'symptom_triage',
    'package_recommendations',
    'clinic_navigation',
    'medicine_reminders',
    'wellness_followup',
    'health_education'
  ];

  apis = [
    'appointment_system',
    'patient_records',
    'pharmacy'
  ];

  tone = {
    empathetic: true,
    clear: true,       // Health info must be clear
    reassuring: true,
    professional: true
  };
  
  // IMPORTANT: No medical diagnosis
  limitations = ['no_diagnosis', 'no_prescription'];
}
```

### 4.5 Travel Expert

**Location:** `REZ-Intelligence/rez-travel-expert/`

```typescript
interface TravelExpert {
  industry = 'TRAVEL';
  
  expertise = [
    'destination_recommendations',
    'itinerary_planning',
    'transport_booking',
    'accommodation',
    'activities',
    'budget_optimization',
    'visa_guidance',
    'packing_tips'
  ];

  tone = {
    adventurous: true,
    helpful: true,
    organized: true,  // Planning requires this
    inspiring: true
  };
}
```

### 4.6 Retail Expert

**Location:** `REZ-Intelligence/rez-retail-expert/`

```typescript
interface RetailExpert {
  industry = 'RETAIL';
  
  expertise = [
    'product_search',
    'size_guide',
    'product_comparison',
    'inventory_check',
    'return_policy',
    'wishlist_management',
    'styling_advice'
  ];

  tone = {
    helpful: true,
    detailed: true,     // Product info
    enthusiastic: true,
    casual: true
  };
}
```

### 4.7 Salon Expert

**Location:** `REZ-Intelligence/rez-salon-expert/`

```typescript
interface SalonExpert {
  industry = 'SALON';
  
  expertise = [
    'service_recommendations',
    'appointment_booking',
    'beauty_advisor',
    'treatment_explainer',
    'skincare_routine',
    'pre_post_care'
  ];

  tone = {
    warm: true,
    beauty_savvy: true,
    professional: true,
    approachable: true
  };
}
```

### 4.8 Education Expert

**Location:** `REZ-Intelligence/rez-education-expert/`

```typescript
interface EducationExpert {
  industry = 'EDUCATION';
  
  expertise = [
    'course_recommendations',
    'learning_path',
    'progress_tracking',
    'study_tips',
    'certification_guidance',
    'skill_assessment'
  ];

  tone = {
    encouraging: true,
    patient: true,
    knowledgeable: true,
    supportive: true
  };
}
```

---

# 5. LAYER 3: FUNCTIONAL AGENTS

Cross-industry agents for specific functions.

## Agents

| Agent | Purpose |
|-------|---------|
| **Sales Agent** | Convert interest to revenue |
| **Support Agent** | Resolve issues, complaints |
| **Billing Agent** | Payments, refunds, invoices |
| **Fraud Agent** | Risk detection, security |
| **Recommendation Agent** | Personalization engine |
| **Notification Agent** | Multi-channel messaging |

## Sales Agent

**Location:** `REZ-Intelligence/rez-sales-agent/` (EXISTS - Update)

```typescript
interface SalesAgent {
  function = 'SALES';
  
  capabilities = [
    'lead_qualification',
    'product_recommendation',
    'pricing_negotiation',
    'discount_approval',
    'cart_recovery',
    'cross_sell',
    'upsell',
    'checkout_completion'
  ];

  // Integrates with Industry Experts
  collaboration = {
    Hospitality: 'package_upsell',
    Culinary: 'combo_suggestion',
    Fitness: 'membership_upgrade',
    Retail: 'cross_category'
  };
}
```

## Support Agent

**Location:** `REZ-Intelligence/rez-support-agent/` (EXISTS - Update)

```typescript
interface SupportAgent {
  function = 'SUPPORT';
  
  capabilities = [
    'issue_resolution',
    'complaint_handling',
    'order_tracking',
    'cancellation',
    'refund_processing',
    'escalation_management'
  ];

  // Connects to Industry Experts for context
  contextSources = ['hospitality', 'culinary', 'travel', ...];
}
```

---

# 6. LAYER 4: ORCHESTRATOR

The brain that coordinates all agents.

**Location:** `REZ-Intelligence/rez-orchestrator-v2/`

## Orchestrator Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Agent Selection** | Choose best expert for context |
| **Dynamic Routing** | Route based on intent, context |
| **Agent Switching** | Seamless handoff between agents |
| **Collaboration** | Multi-agent coordination |
| **Escalation** | Human handoff when needed |
| **Fallback** | Handle unknown scenarios |

## Routing Logic

```typescript
interface Orchestrator {
  // Primary routing based on context
  route(context: Context): RoutingDecision;

  // Switch agent seamlessly
  switch(current: Agent, next: Agent, reason: string): void;

  // Multi-agent collaboration
  collaborate(agents: Agent[], task: Task): Response;

  // Human escalation
  escalate(context: Context, reason: EscalationReason): void;
}

// Routing priority
const routingPriority = [
  'EXPLICIT_INTENT',      // User said "I want to order food"
  'CONTEXT_OVERRIDE',     // Hotel guest = Hospitality Expert
  'ENTRY_POINT',          // REZ Web Menu = Culinary Expert
  'MERCHANT_CATEGORY',   // Clinic = Health Expert
  'CONVERSATION_HISTORY', // Continue previous context
  'FALLBACK'             // Info Agent
];
```

## Dynamic Routing Examples

```typescript
const routingRules: RoutingRule[] = [
  // Rule: QR Code determines base expert
  {
    condition: { entryPoint: 'QR', qrType: 'HOTEL' },
    defaultExpert: 'HOSPITALITY',
    canOverride: ['CULINARY', 'TRAVEL']
  },

  // Rule: App determines base expert
  {
    condition: { app: 'REZ_WEB_MENU' },
    defaultExpert: 'CULINARY'
  },

  // Rule: Merchant category
  {
    condition: { merchantCategory: 'FITNESS_CENTER' },
    defaultExpert: 'FITNESS'
  },

  // Rule: Intent override (user intent beats context)
  {
    condition: { intent: 'BOOK_APPOINTMENT' },
    expert: 'dynamic', // Based on merchant type
    alwaysApply: true
  },

  // Rule: Collaboration needed
  {
    condition: { 
      currentExpert: 'FITNESS',
      intent: 'HEALTHY_DINNER'
    },
    addExpert: 'CULINARY',
    mode: 'COLLABORATE'
  }
];
```

---

# 7. CONTEXT ENGINE

Determines initial routing and maintains context.

**Location:** `REZ-Intelligence/rez-context-engine/`

## Context Sources

```typescript
interface ContextSource {
  // Entry point
  entryPoint: {
    type: 'QR' | 'APP' | 'VOICE' | 'WEBSITE' | 'WHATSAPP';
    details: {
      qrType?: 'HOTEL' | 'RESTAURANT' | 'RETAIL' | 'SALON';
      appName?: string;
      phoneNumber?: string;
      websitePage?: string;
    };
  };

  // Merchant
  merchant: {
    id: string;
    category: MerchantCategory;
    name: string;
    services: string[];
  };

  // User
  user: {
    id: string;
    history: UserHistory;
    preferences: Preferences;
    loyaltyTier: string;
  };

  // Session
  session: {
    id: string;
    activeWorkflow?: string;
    recentIntents: string[];
    currentExpert?: string;
  };

  // Real-time
  realtime: {
    time: Date;
    location?: Location;
    weather?: Weather;
    localEvents?: Event[];
  };
}
```

## Entry Point Detection

```typescript
const entryPointMapping: Record<string, ExpertType> = {
  // QR codes
  'QR_HOTEL': 'HOSPITALITY',
  'QR_RESTAURANT': 'CULINARY',
  'QR_RETAIL': 'RETAIL',
  'QR_SALON': 'SALON',
  'QR_GYM': 'FITNESS',
  'QR_CLINIC': 'HEALTH',

  // Apps
  'REZ_WEB_MENU': 'CULINARY',
  'REZ_STAY': 'HOSPITALITY',
  'REZ_FIT': 'FITNESS',
  'REZ_HEALTH': 'HEALTH',
  'REZ_BOOK': 'TRAVEL',

  // Channels
  'WHATSAPP_MERCHANT': 'dynamic', // Based on merchant
  'VOICE_HOTEL': 'HOSPITALITY',
  'WEBSITE_RETAIL': 'RETAIL'
};
```

---

# 8. AGENT COLLABORATION

Multiple agents can work together seamlessly.

## Collaboration Modes

| Mode | Description | Example |
|------|-------------|---------|
| **SEQUENTIAL** | Agent A → Agent B | Fitness → Culinary for post-workout meal |
| **PARALLEL** | Agents A + B collaborate | Health + Culinary for dietary needs |
| **CONSULT** | Primary asks secondary | Culinary consults Health on restrictions |

## Collaboration Example

```typescript
// User: "I just finished my gym session. What should I eat?"

// Step 1: Fitness Expert detects user context
{
  currentExpert: 'FITNESS',
  context: { workout: 'HIIT', caloriesBurned: 400 }
}

// Step 2: Orchestrator detects collaboration need
{
  intent: 'MEAL_RECOMMENDATION',
  collaboration: ['CULINARY', 'HEALTH']
}

// Step 3: Multi-agent response
{
  // Fitness Expert
  context: 'User just burned 400 calories, needs protein',

  // Health Expert  
  context: 'User dietary goal: high protein, low carb',

  // Culinary Expert
  response: 'Based on your workout and goals, I recommend...'
}
```

## Collaboration Implementation

```typescript
interface AgentCollaboration {
  // Initiate collaboration
  async collaborate(
    primary: Agent,
    secondaries: Agent[],
    context: CollaborationContext
  ): Promise<CollaborativeResponse>;

  // Share context between agents
  async shareContext(
    from: Agent,
    to: Agent,
    context: SharedContext
  ): Promise<void>;

  // Merge responses
  mergeResponses(
    responses: AgentResponse[]
  ): UnifiedResponse;
}
```

---

# 9. DYNAMIC ROUTING

## Routing Decision Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ROUTING DECISION FLOW │
└─────────────────────────────────────────────────────────────────────────────┘

1. MESSAGE RECEIVED
         │
         ▼
2. EXTRACT CONTEXT
   - Entry point
   - Merchant type
   - User profile
   - Session state
   - Intent
         │
         ▼
3. CHECK ROUTING RULES
   │
   ├─► EXPLICIT INTENT?
   │     "I want to book a table"
   │     → Route to explicit intent expert
   │
   ├─► CONTEXT OVERRIDE?
   │     Hotel guest asking about gym
   │     → Hospitality (base) + Fitness (context)
   │
   ├─► ENTRY POINT DETERMINES BASE?
   │     Restaurant QR scanned
   │     → Culinary (base expert)
   │
   ├─► MERCHANT CATEGORY?
   │     Clinic merchant
   │     → Health Expert
   │
   └─► COLLABORATION NEEDED?
         "What wine with my steak?"
         → Culinary + (potential wine expertise)
         │
         ▼
4. SELECT EXPERT(S)
   Primary + Secondary (if collaboration)
         │
         ▼
5. ATTACH SHARED CONTEXT
   - User memory
   - Session history
   - Global brain data
         │
         ▼
6. GENERATE RESPONSE
   (Expert(s) + Global Brain + Context)
         │
         ▼
7. LOG & UPDATE
   - Conversation log
   - Intent updates
   - Session state
```

---

# 10. IMPLEMENTATION PLAN

## Phase 1: Foundation (Week 1)

| Task | Service | Files |
|------|---------|-------|
| Create Expert Pack Base Class | `rez-expert-base` | 10 |
| Create Core Brain Service | `rez-core-brain` | 15 |
| Create Context Engine | `rez-context-engine` | 12 |
| Create Orchestrator v2 | `rez-orchestrator-v2` | 15 |

## Phase 2: Industry Experts (Week 2-3)

| Expert | Service | Files | Priority |
|--------|---------|-------|----------|
| **Hospitality** | `rez-hospitality-expert` | 12 | HIGH |
| **Culinary** | `rez-culinary-expert` | 12 | HIGH |
| **Fitness** | `rez-fitness-expert` | 10 | MEDIUM |
| **Health** | `rez-health-expert` | 10 | MEDIUM |
| **Travel** | `rez-travel-expert` | 10 | LOW |
| **Retail** | `rez-retail-expert` | 10 | LOW |
| **Salon** | `rez-salon-expert` | 10 | LOW |
| **Education** | `rez-education-expert` | 10 | LOW |

## Phase 3: Collaboration & Testing (Week 4)

| Task | Service | Files |
|------|---------|-------|
| Implement Agent Collaboration | `rez-orchestrator-v2` | 10 |
| Update Existing Agents | Sales/Support | 5 each |
| Create Test Suite | `rez-agent-tests` | 20 |
| Integration Testing | - | - |

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| `rez-orchestrator-v2` | 4070 | Main orchestrator |
| `rez-context-engine` | 4071 | Context management |
| `rez-core-brain` | 4072 | Global brain |
| `rez-hospitality-expert` | 4080 | Hospitality Expert |
| `rez-culinary-expert` | 4081 | Culinary Expert |
| `rez-fitness-expert` | 4082 | Fitness Expert |
| `rez-health-expert` | 4083 | Health Expert |
| `rez-sales-agent` | 3001 | Sales Agent (EXISTS) |
| `rez-support-agent` | 3002 | Support Agent (EXISTS) |

---

# 11. SERVICE SPECIFICATIONS

## 11.1 Core Brain Service

### `rez-core-brain`

**Port:** 4072

### Models

```typescript
// UserMemory
{
  userId: string;
  shortTerm: {
    currentConversation: ConversationTurn[];
    activeWorkflow?: string;
    pendingActions: Action[];
  };
  longTerm: {
    preferences: Preferences;
    history: ConversationHistory[];
    patterns: UserPattern[];
  };
}

// SessionContext
{
  sessionId: string;
  userId: string;
  merchantId: string;
  channel: Channel;
  entryPoint: EntryPoint;
  currentExpert?: ExpertType;
  sharedContext: SharedContext;
  history: ConversationTurn[];
}

// GlobalPersonalization
{
  userId: string;
  language: string;
  tone: ToneType;
  preferences: {
    dietary: string[];
    style: string;
    communication: string;
  };
  loyalty: {
    tier: string;
    points: number;
    benefits: string[];
  };
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memory/:userId` | Get user memory |
| POST | `/api/memory/:userId/short` | Update short-term memory |
| POST | `/api/memory/:userId/long` | Update long-term memory |
| GET | `/api/session/:sessionId` | Get session context |
| POST | `/api/session/:sessionId/update` | Update session |
| GET | `/api/personalization/:userId` | Get personalization |
| POST | `/api/personalization/:userId` | Update personalization |

---

## 11.2 Context Engine

### `rez-context-engine`

**Port:** 4071

### Models

```typescript
// EntryContext
{
  entryPoint: {
    type: 'QR' | 'APP' | 'VOICE' | 'WEBSITE' | 'WHATSAPP';
    qrType?: 'HOTEL' | 'RESTAURANT' | 'RETAIL' | 'SALON' | 'GYM' | 'CLINIC';
    appId?: string;
    merchantId?: string;
    phoneNumber?: string;
  };
  merchant: {
    id: string;
    name: string;
    category: MerchantCategory;
    subcategory?: string;
    services: string[];
  };
  user?: {
    id: string;
    isGuest: boolean;
    isLoyal: boolean;
  };
  session: {
    isFirst: boolean;
    previousExpert?: ExpertType;
    recentIntents: string[];
  };
}

// RoutingDecision
{
  primaryExpert: ExpertType;
  secondaryExperts?: ExpertType[];
  collaborationMode?: 'SEQUENTIAL' | 'PARALLEL' | 'CONSULT';
  confidence: number;
  reasoning: string;
  contextToAttach: Record<string, any>;
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/context/extract` | Extract context from message |
| POST | `/api/routing/decide` | Get routing decision |
| GET | `/api/routing/rules` | Get routing rules |
| PUT | `/api/routing/rules` | Update routing rules |

---

## 11.3 Orchestrator v2

### `rez-orchestrator-v2`

**Port:** 4070

### Models

```typescript
// OrchestrationRequest
{
  message: string;
  context: SessionContext;
  channel: Channel;
  userId: string;
  merchantId: string;
}

// OrchestrationResponse
{
  response: string;
  expert: ExpertType;
  actions?: Action[];
  collaboration?: CollaborationDetails;
  metadata: {
    confidence: number;
    routingReason: string;
    responseTime: number;
  };
}

// CollaborationDetails
{
  mode: 'SEQUENTIAL' | 'PARALLEL' | 'CONSULT';
  agents: Agent[];
  sharedContext: SharedContext;
  mergedResponse: string;
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/message` | Process message |
| POST | `/api/route` | Get routing decision |
| POST | `/api/collaborate` | Multi-agent collaboration |
| POST | `/api/escalate` | Human escalation |
| GET | `/api/experts` | List available experts |
| GET | `/api/experts/:type/status` | Expert health |
| POST | `/api/switch` | Switch expert mid-conversation |

---

## 11.4 Expert Base Class

### `rez-expert-base`

```typescript
// ExpertAgent (Base Class)
abstract class ExpertAgent {
  abstract type: ExpertType;
  abstract industry: string;

  // Core methods
  abstract detectIntent(message: string, context: Context): IntentResult;
  abstract generateResponse(intent: Intent, context: Context): Response;
  abstract getRecommendations(context: Context): Recommendation[];

  // Collaboration
  async collaborateWith(other: ExpertAgent, context: Context): Promise<CollaborativeResponse>;
  async shareContext(context: Context): Promise<SharedContext>;

  // Lifecycle
  async initialize(): Promise<void>;
  async healthCheck(): Promise<HealthStatus>;
}

// Industry-specific override methods
interface ExpertConfig {
  systemPrompt: string;
  tone: ToneConfig;
  knowledgeBase: KnowledgeBase;
  intents: IntentDefinition[];
  workflows: Workflow[];
  apis: APIIntegration[];
}
```

---

## 11.5 Hospitality Expert

### `rez-hospitality-expert`

**Port:** 4080

### Intents

```typescript
const hospitalityIntents = [
  'CHECK_IN',
  'CHECK_OUT',
  'ROOM_SERVICE',
  'HOUSEKEEPING',
  'CONCIERGE',
  'AMENITIES',
  'LOCAL_RECOMMENDATIONS',
  'BOOKING_EXTENSION',
  'COMPLAINT',
  'ROOM_UPGRADE'
];
```

### System Prompt

```typescript
const hospitalitySystemPrompt = `
You are a REZ Hospitality Expert, specialized in hotel and accommodation services.

Your expertise includes:
- Check-in/check-out procedures
- Room service ordering
- Housekeeping requests
- Concierge services
- Local recommendations
- Amenity information
- Complaint resolution

Communication style:
- Warm and welcoming (guests expect hospitality)
- Professional but friendly
- Anticipatory (suggest before asked)
- Efficient with details

Always:
- Use guest name if available
- Acknowledge loyalty status
- Reference their booking details
- Suggest relevant upsells naturally
`;
```

---

## 11.6 Culinary Expert

### `rez-culinary-expert`

**Port:** 4081

### Intents

```typescript
const culinaryIntents = [
  'VIEW_MENU',
  'ORDER_FOOD',
  'MODIFY_ORDER',
  'DIETARY_FILTER',
  'RECOMMEND',
  'PAIRING',
  'ALLERGY_INFO',
  'TRACK_DELIVERY',
  'REORDER'
];
```

### System Prompt

```typescript
const culinarySystemPrompt = `
You are a REZ Culinary Expert, specialized in food and restaurant services.

Your expertise includes:
- Menu navigation and recommendations
- Dietary and allergen information
- Food pairings
- Order optimization
- Cuisine knowledge
- Restaurant-specific items

Communication style:
- Enthusiastic about food
- Knowledgeable about ingredients
- Helpful with dietary needs
- Friendly and casual

Always:
- Consider dietary restrictions
- Suggest complementary items
- Explain dishes clearly
- Be honest about preparation times
`;
```

---

# APPENDIX

## A. Environment Variables

```bash
# Core Brain
CORE_BRAIN_PORT=4072
REDIS_URL=redis://localhost:6379
MONGODB_URI=mongodb://localhost:27017

# Context Engine
CONTEXT_ENGINE_PORT=4071

# Orchestrator
ORCHESTRATOR_PORT=4070
ORCHESTRATOR_EXPERT_TIMEOUT=5000
ORCHESTRATOR_COLLABORATION_TIMEOUT=10000

# Expert Ports
HOSPITALITY_PORT=4080
CULINARY_PORT=4081
FITNESS_PORT=4082
HEALTH_PORT=4083
TRAVEL_PORT=4084
RETAIL_PORT=4085
SALON_PORT=4086
EDUCATION_PORT=4087
```

## B. Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "ioredis": "^5.3.2",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "uuid": "^9.0.0"
  }
}
```

## C. Testing Strategy

```typescript
// Test categories
const testSuites = [
  'routing_tests',        // Context → Expert routing
  'collaboration_tests',   // Multi-agent collaboration
  'intent_tests',          // Intent detection accuracy
  'context_tests',         // Context extraction
  'handoff_tests',         // Seamless switching
  'escalation_tests',      // Human handoff
  'integration_tests'       // End-to-end flows
];
```
