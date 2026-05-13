# REZ Agent OS v3 - Enterprise Architecture

**Version:** 3.0
**Date:** May 12, 2026
**Status:** Ready for Implementation

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Agent Categories](#3-agent-categories)
4. [Priority Hierarchy](#4-priority-hierarchy)
5. [Confidence Scoring](#5-confidence-scoring)
6. [Shared Event Schema](#6-shared-event-schema)
7. [Unified Agent SDK](#7-unified-agent-sdk)
8. [Internal Tool Registry](#8-internal-tool-registry)
9. [Agent Permission System](#9-agent-permission-system)
10. [Evaluation Framework](#10-evaluation-framework)
11. [Autonomous Commerce](#11-autonomous-commerce)
12. [Implementation Plan](#12-implementation-plan)

---

# 1. EXECUTIVE SUMMARY

## Current State
- 8 Industry Expert Agents
- Basic routing
- Simple collaboration

## v3 Improvements
| Improvement | Impact |
|-------------|--------|
| Agent Categorization | Clear separation of concerns |
| Priority Hierarchy | No more multi-agent chaos |
| Confidence Scoring | Better routing quality |
| Event Schema | Standardized communication |
| Unified SDK | Consistent agent development |
| Tool Registry | Shared capabilities |
| Permission System | Security and compliance |
| Evaluation Framework | Continuous improvement |

---

# 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ AGENT OS v3 │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ USER INTERFACE │
│ WhatsApp │ Voice │ Copilot │ Website │ App │ QR │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORCHESTRATION LAYER │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ORCHESTRATOR v3 │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ 1. Priority Resolver → Which type wins? │ │
│ │ 2. Confidence Scorer → Which agent is best? │ │
│ │ 3. Collaboration Manager → Who else is needed? │ │
│ │ 4. Permission Guard → Is agent allowed? │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ EVENT BUS │ │
│ │ Standardized events from ALL services │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌────────────────────────────┬─────────────────────────────────────────────┐
│ DOMAIN EXPERTS │ │ FUNCTIONAL EXPERTS │
├────────────────────────────┼─────────────────────────────────────────────┤
│ │ │
│ Hospitality │ │ Support │
│ Culinary │ │ Sales │
│ Travel │ │ Loyalty │
│ Fitness │ │ Fraud │
│ Health │ │ Wallet │
│ Retail │ │ Analytics │
│ Salon │ │ Campaign │
│ Education │ │ Notification │
│ │ │
│ Industry-specific │ │ Cross-industry │
│ Deep expertise │ │ System-wide │
│ Context-aware │ │ Policy-driven │
│ │ │
└────────────────────────────┴─────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SHARED LAYER │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ UNIFIED SDK │ │ TOOL REGISTRY │ │ EVENT SCHEMA │ │
│ │ Standard Agent │ │ payments │ │ │ │ │
│ │ Structure │ │ booking │ │ UserMessage │ │
│ │ │ │ loyalty │ │ AgentResponse │ │
│ │ │ │ crm │ │ ToolCall │ │
│ │ │ │ analytics │ │ Event │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CORE BRAIN │ │
│ │ Memory │ Session │ Personalization │ Loyalty │ Context │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PERMISSION SYSTEM │ │
│ │ Role-based access │ Finance │ Health │ User data │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. AGENT CATEGORIES

## Domain Experts (Industry-Specific)

| Expert | Industry | Primary Intents |
|--------|----------|-----------------|
| **Hospitality Expert** | Hotels, Stays | Check-in, room service, amenities |
| **Culinary Expert** | Restaurants, Food | Menu, order, dietary |
| **Travel Expert** | Tourism, Bookings | Itinerary, transport |
| **Fitness Expert** | Gyms, Wellness | Workout, progress |
| **Health Expert** | Healthcare, Clinics | Appointment, symptom |
| **Retail Expert** | Shopping, E-commerce | Products, sizing |
| **Salon Expert** | Beauty, Spa | Services, booking |
| **Education Expert** | Learning, Courses | Courses, progress |

### Domain Expert Characteristics

```typescript
interface DomainExpert {
  category: 'DOMAIN';
  
  // Industry knowledge
  industry: string;
  specializations: string[];
  
  // Deep expertise
  knowledgeBase: IndustryKnowledge;
  workflows: IndustryWorkflow[];
  responseTemplates: IndustryResponses;
  
  // Confidence per intent
  intentConfidence: Record<string, number>;
  
  // Tools they can use
  allowedTools: ToolType[];
  
  // Priority in their domain
  domainPriority: number; // 1-10
}
```

---

## Functional Experts (Cross-Industry)

| Expert | Purpose | Triggers |
|--------|---------|----------|
| **Support Agent** | Issues, complaints, refunds | "help", "problem", "refund", "cancel" |
| **Sales Agent** | Conversion, upsell, revenue | "buy", "upgrade", "discount" |
| **Loyalty Agent** | Points, rewards, tiers | "points", "reward", "tier", "benefit" |
| **Fraud Agent** | Risk, security, suspicious activity | Payment attempts, anomalies |
| **Wallet Agent** | Payments, credits, balance | "pay", "balance", "wallet", "coins" |
| **Analytics Agent** | Insights, reports, metrics | Request for data, trends |
| **Campaign Agent** | Marketing, promotions, outreach | Campaign triggers, lifecycle |
| **Notification Agent** | Alerts, reminders, updates | Scheduled notifications |

### Functional Expert Characteristics

```typescript
interface FunctionalExpert {
  category: 'FUNCTIONAL';
  
  // System-wide function
  function: FunctionType;
  scope: 'GLOBAL' | 'MERCHANT' | 'USER';
  
  // Policy-driven
  policies: Policy[];
  
  // Can override domain experts
  overridePriority: OverridePriority;
  
  // Tools they manage
  managedResources: ResourceType[];
  
  // Priority when triggered
  functionalPriority: number; // 1-10
}
```

---

## Category Resolution Rules

```typescript
const categoryPriority: Record<CategoryType, number> = {
  // FUNCTIONAL always wins for these intents
  PAYMENT_ISSUE: 'FUNCTIONAL',
  FRAUD_DETECTED: 'FUNCTIONAL',
  EMERGENCY: 'FUNCTIONAL',
  REFUND_REQUEST: 'FUNCTIONAL',
  
  // DOMAIN handles these
  MENU_INQUIRY: 'DOMAIN',
  ROOM_BOOKING: 'DOMAIN',
  WORKOUT_PLAN: 'DOMAIN',
  
  // COLLABORATION for these
  UPSELL_OPPORTUNITY: 'COLLABORATION',
  CROSS_SELL: 'COLLABORATION',
};
```

---

# 4. PRIORITY HIERARCHY

## Orchestration Priority Rules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PRIORITY RESOLUTION │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ RULE 1: EMERGENCY wins always │
│ ↓ │
│ RULE 2: PAYMENT/FRAUD wins over domain │
│ ↓ │
│ RULE 3: SUPPORT wins for issues │
│ ↓ │
│ RULE 4: DOMAIN expert for industry context │
│ ↓ │
│ RULE 5: SALES for conversion opportunities │
│ ↓ │
│ RULE 6: LOWEST priority = analytics/reporting │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Priority Matrix

| Situation | Highest Priority | Second Priority | Notes |
|-----------|------------------|----------------|-------|
| **Payment issue** | Wallet Agent | Support Agent | Financial - always first |
| **Emergency symptom** | Health Expert | Emergency Protocol | Human safety first |
| **Refund request** | Support Agent | Domain Expert | Policy-driven |
| **Booking request** | Domain Expert | Sales Agent | Industry context primary |
| **Upsell opportunity** | Sales Agent | Domain Expert | Revenue focus |
| **Fraud detected** | Fraud Agent | Wallet Agent | Security lock-in |
| **Loyalty question** | Loyalty Agent | Domain Expert | Points/policy |
| **Complaint** | Support Agent | Domain Expert | Resolution first |
| **Product inquiry** | Domain Expert | Sales Agent | Industry context |
| **Analytics request** | Analytics Agent | - | Lowest priority |

## Priority Implementation

```typescript
interface PriorityRule {
  condition: IntentCondition;
  priority: {
    category: 'EMERGENCY' | 'FUNCTIONAL' | 'DOMAIN' | 'COLLABORATION';
    agentType?: AgentType;
    override?: boolean;
  };
  collaboration?: {
    required: AgentType[];
    order: 'SEQUENTIAL' | 'PARALLEL';
  };
}

// Example rules
const priorityRules: PriorityRule[] = [
  {
    condition: { intent: 'EMERGENCY_MEDICAL' },
    priority: { category: 'EMERGENCY', agentType: 'HEALTH', override: true },
    collaboration: { required: ['HEALTH'], order: 'SEQUENTIAL' }
  },
  {
    condition: { intent: 'PAYMENT_FAILED' },
    priority: { category: 'FUNCTIONAL', agentType: 'WALLET', override: true },
    collaboration: { required: ['WALLET', 'SUPPORT'], order: 'SEQUENTIAL' }
  },
  {
    condition: { intent: 'REFUND_REQUEST' },
    priority: { category: 'FUNCTIONAL', agentType: 'SUPPORT', override: false },
    collaboration: { required: ['SUPPORT', 'CULINARY'], order: 'SEQUENTIAL' }
  },
  {
    condition: { intent: 'ROOM_BOOKING' },
    priority: { category: 'DOMAIN', agentType: 'HOSPITALITY', override: false },
    collaboration: { required: ['HOSPITALITY', 'SALES'], order: 'PARALLEL' }
  },
  {
    condition: { intent: 'UPSELL_OPPORTUNITY', context: { cart: { total: { gt: 500 } } } },
    priority: { category: 'COLLABORATION', agentType: 'SALES', override: false },
    collaboration: { required: ['HOSPITALITY', 'SALES'], order: 'PARALLEL' }
  },
];
```

---

# 5. CONFIDENCE SCORING

## Confidence Calculation

```typescript
interface ConfidenceScore {
  agentId: string;
  agentType: AgentType;
  
  // Components
  intentMatch: number;      // 0-100: How well intent matches
  contextRelevance: number; // 0-100: How relevant to context
  historyAccuracy: number;   // 0-100: Past success rate
  loadFactor: number;        // 0-100: Current capacity
  
  // Final score
  total: number;            // Weighted average
  
  // Breakdown
  reasoning: string;         // Why this score
}

// Weight configuration
const confidenceWeights = {
  intentMatch: 0.35,        // 35% - Primary factor
  contextRelevance: 0.30,   // 30% - Context matters
  historyAccuracy: 0.25,     // 25% - Track record
  loadFactor: 0.10,         // 10% - Availability
};

function calculateConfidence(
  intent: Intent,
  context: Context,
  agent: Agent
): ConfidenceScore {
  const intentMatch = calculateIntentMatch(intent, agent.capabilities);
  const contextRelevance = calculateContextRelevance(context, agent.industry);
  const historyAccuracy = agent.metrics.successRate;
  const loadFactor = 100 - (agent.currentLoad / agent.maxLoad * 100);
  
  const total = 
    (intentMatch * confidenceWeights.intentMatch) +
    (contextRelevance * confidenceWeights.contextRelevance) +
    (historyAccuracy * confidenceWeights.historyAccuracy) +
    (loadFactor * confidenceWeights.loadFactor);
  
  return {
    agentId: agent.id,
    agentType: agent.type,
    intentMatch,
    contextRelevance,
    historyAccuracy,
    loadFactor,
    total,
    reasoning: generateReasoning(intentMatch, contextRelevance, historyAccuracy)
  };
}
```

## Confidence-Based Routing

```typescript
interface RoutingDecision {
  primaryAgent: {
    agentId: string;
    agentType: AgentType;
    confidence: number;
  };
  
  fallbackAgent?: {
    agentId: string;
    agentType: AgentType;
    confidence: number;
  };
  
  collaboration?: {
    agents: Array<{
      agentType: AgentType;
      role: 'PRIMARY' | 'COLLABORATOR' | 'FALLBACK';
      confidence: number;
    }>;
    mode: 'SEQUENTIAL' | 'PARALLEL' | 'CONSULT';
  };
  
  reasoning: string;
}

// Example routing
function routeBasedOnConfidence(
  intent: Intent,
  context: Context,
  availableAgents: Agent[]
): RoutingDecision {
  // Calculate confidence for each agent
  const scores = availableAgents.map(agent => ({
    agent,
    score: calculateConfidence(intent, context, agent)
  }));
  
  // Sort by confidence
  scores.sort((a, b) => b.score.total - a.score.total);
  
  // Apply threshold
  const threshold = 70;
  
  if (scores[0].score.total >= threshold) {
    return {
      primaryAgent: {
        agentId: scores[0].agent.id,
        agentType: scores[0].agent.type,
        confidence: scores[0].score.total
      },
      fallbackAgent: scores[1] ? {
        agentId: scores[1].agent.id,
        agentType: scores[1].agent.type,
        confidence: scores[1].score.total
      } : undefined,
      reasoning: scores[0].score.reasoning
    };
  }
  
  // Below threshold - use collaboration
  return {
    primaryAgent: {
      agentId: scores[0].agent.id,
      agentType: scores[0].agent.type,
      confidence: scores[0].score.total
    },
    collaboration: {
      agents: scores.slice(0, 3).map((s, i) => ({
        agentType: s.agent.type,
        role: i === 0 ? 'PRIMARY' : 'COLLABORATOR',
        confidence: s.score.total
      })),
      mode: 'CONSULT'
    },
    reasoning: `Low confidence (${scores[0].score.total}%), using multi-agent consultation`
  };
}
```

## Confidence Examples

```
Intent: "I want to order biryani"

Agent Scores:
┌─────────────────┬──────────┬────────────────────────────────┐
│ Agent │ Confidence│ Reasoning │
├─────────────────┼──────────┼────────────────────────────────┤
│ Culinary │ 92% │ Intent match 95%, Context 90%, History 95% │
│ Support │ 34% │ Generic "order" matches, low domain │ │
│ Sales │ 28% │ No conversion context │ │
│ Fitness │ 12% │ Food intent, wrong domain │ │
└─────────────────┴──────────┴────────────────────────────────┘

→ ROUTING: Culinary Expert (92%)

---

Intent: "My payment failed and I need my order"

Agent Scores:
┌─────────────────┬──────────┬────────────────────────────────┐
│ Agent │ Confidence│ Reasoning │
├─────────────────┼──────────┼────────────────────────────────┤
│ Wallet │ 95% │ Payment intent 100%, policy match │ │
│ Support │ 78% │ Issue resolution high │ │
│ Culinary │ 45% │ Order context relevant │ │
│ Sales │ 12% │ No upsell opportunity │ │
└─────────────────┴──────────┴────────────────────────────────┘

→ ROUTING: Wallet Agent (95%)
→ COLLABORATION: Support (follow-up), Culinary (order context)
```

---

# 6. SHARED EVENT SCHEMA

## Event Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT BUS │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ All services emit standardized events │
│ ↓ │
│ Event Bus (Redis Pub/Sub + Kafka) │
│ ↓ │
│ All services subscribe to relevant events │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Schema

```typescript
// Base event structure
interface REZEvent {
  // Metadata
  eventId: string;           // UUID
  eventType: EventType;      // typed event
  timestamp: string;         // ISO 8601
  version: string;           // Schema version
  
  // Source
  source: {
    service: string;        // Service name
    instanceId: string;     // Instance ID
    region: string;         // Deployment region
  };
  
  // Context
  context: {
    userId?: string;
    merchantId?: string;
    sessionId?: string;
    channel: Channel;
    traceId: string;       // For distributed tracing
  };
  
  // Payload
  payload: Record<string, unknown>;
}

// Event types
type EventType = 
  // User events
  | 'USER_MESSAGE_RECEIVED'
  | 'USER_MESSAGE_SENT'
  | 'USER_SESSION_STARTED'
  | 'USER_SESSION_ENDED'
  
  // Intent events
  | 'INTENT_DETECTED'
  | 'INTENT_CONFidence_UPDATED'
  | 'INTENT_COMPLETED'
  
  // Routing events
  | 'ROUTING_REQUESTED'
  | 'AGENT_SELECTED'
  | 'AGENT_SWITCHED'
  | 'COLLABORATION_STARTED'
  | 'COLLABORATION_ENDED'
  
  // Agent events
  | 'AGENT_RESPONSE_GENERATED'
  | 'AGENT_TOOL_CALLED'
  | 'AGENT_ERROR'
  
  // Action events
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_COMPLETED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'REFUND_INITIATED'
  
  // System events
  | 'SERVICE_HEALTH_CHANGED'
  | 'CIRCUIT_BREAKER_OPENED'
  | 'CIRCUIT_BREAKER_CLOSED'
  | 'RATE_LIMIT_EXCEEDED';
```

## Event Examples

```typescript
// User message received
interface UserMessageEvent extends REZEvent {
  eventType: 'USER_MESSAGE_RECEIVED';
  payload: {
    messageId: string;
    channel: 'WHATSAPP' | 'VOICE' | 'WEB';
    content: string;
    mediaUrls?: string[];
    metadata: {
      waId?: string;
      from?: string;
      timestamp: string;
    };
  };
}

// Intent detected
interface IntentDetectedEvent extends REZEvent {
  eventType: 'INTENT_DETECTED';
  payload: {
    intent: {
      name: string;
      confidence: number;
      entities: Record<string, unknown>;
    };
    routing: {
      selectedAgent: {
        type: AgentType;
        id: string;
        confidence: number;
      };
      alternatives: Array<{
        type: AgentType;
        confidence: number;
      }>;
    };
  };
}

// Agent switched
interface AgentSwitchedEvent extends REZEvent {
  eventType: 'AGENT_SWITCHED';
  payload: {
    from: {
      type: AgentType;
      id: string;
      reason: string;
    };
    to: {
      type: AgentType;
      id: string;
      reason: string;
    };
    userInitiated: boolean;
    context: Record<string, unknown>;
  };
}

// Order created
interface OrderCreatedEvent extends REZEvent {
  eventType: 'ORDER_CREATED';
  payload: {
    orderId: string;
    merchantId: string;
    userId: string;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    currency: string;
    paymentMethod: string;
  };
}
```

## Event Bus Implementation

```typescript
// Event publisher
class EventBus {
  private redis: Redis;
  private kafka: Kafka;
  
  async publish(event: REZEvent): Promise<void> {
    // Add trace ID for distributed tracing
    event.context.traceId = getCurrentTraceId();
    
    // Publish to Redis for real-time subscribers
    await this.redis.publish(
      `events:${event.eventType}`,
      JSON.stringify(event)
    );
    
    // Publish to Kafka for persistence
    await this.kafka.send({
      topic: `rez-${event.eventType.toLowerCase()}`,
      messages: [{
        key: event.context.userId || event.context.traceId,
        value: JSON.stringify(event)
      }]
    });
  }
  
  // Subscribe to events
  subscribe<T extends REZEvent>(
    eventType: EventType,
    handler: (event: T) => Promise<void>
  ): void {
    this.redis.subscribe(`events:${eventType}`, (message) => {
      const event = JSON.parse(message) as T;
      handler(event);
    });
  }
}

// Usage in service
class CulinaryExpert {
  constructor(private eventBus: EventBus) {
    // Subscribe to relevant events
    this.eventBus.subscribe('USER_MESSAGE_RECEIVED', this.handleMessage);
    this.eventBus.subscribe('ORDER_COMPLETED', this.handleOrderCompleted);
  }
  
  async handleMessage(event: UserMessageEvent): Promise<void> {
    console.log(`Received message from user ${event.context.userId}`);
  }
  
  async handleOrderCompleted(event: OrderCreatedEvent): Promise<void> {
    // Update recommendations based on order
    await this.updateRecommendations(event.payload);
  }
}
```

---

# 7. UNIFIED AGENT SDK

## SDK Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED AGENT SDK │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ @rez/agent-sdk │
│ │
│ ├── Core │
│ │ ├── BaseAgent │ ← Abstract base class
│ │ ├── AgentConfig │ ← Configuration
│ │ ├── AgentContext │ ← Context management
│ │ └── AgentMetrics │ ← Metrics collection
│ │
│ ├── Capabilities │
│ │ ├── IntentClassifier │ ← Built-in intent detection
│ │ ├── ResponseGenerator │ ← Response generation
│ │ ├── ToolExecutor │ ← Tool calling
│ │ └── ContextBuilder │ ← Context aggregation
│ │
│ ├── Integration │
│ │ ├── CoreBrainClient │ ← Memory/personalization
│ │ ├── EventBus │ ← Event publishing
│ │ ├── ToolRegistry │ ← Tool discovery
│ │ └── PermissionGuard │ ← Permission checks
│ │
│ └── Utils │
│ ├── Logger │ ← Structured logging
│ ├── Validator │ ← Input validation
│ └── Metrics │ ← Prometheus metrics
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## SDK Implementation

```typescript
// Base agent class
export abstract class BaseAgent {
  // Configuration
  config: AgentConfig;
  
  // Dependencies
  protected coreBrain: CoreBrainClient;
  protected eventBus: EventBus;
  protected toolRegistry: ToolRegistry;
  protected permissionGuard: PermissionGuard;
  
  // Metrics
  protected metrics: AgentMetrics;
  
  // State
  protected isReady: boolean = false;
  
  // Abstract methods
  abstract detectIntent(message: string, context: AgentContext): Promise<IntentResult>;
  abstract generateResponse(intent: Intent, context: AgentContext): Promise<Response>;
  abstract getCapabilities(): AgentCapabilities;
  
  // Lifecycle
  async initialize(): Promise<void> {
    // Load configuration
    this.config = await loadConfig();
    
    // Initialize clients
    this.coreBrain = new CoreBrainClient(this.config.coreBrainUrl);
    this.eventBus = new EventBus(this.config.eventBusUrl);
    this.toolRegistry = new ToolRegistry(this.config.registryUrl);
    this.permissionGuard = new PermissionGuard(this.config.permissionUrl);
    
    // Register with agent registry
    await this.register();
    
    // Subscribe to events
    await this.subscribeToEvents();
    
    this.isReady = true;
  }
  
  // Main processing method
  async process(message: string, context: AgentContext): Promise<Response> {
    if (!this.isReady) {
      throw new Error('Agent not initialized');
    }
    
    // 1. Validate permissions
    await this.permissionGuard.check(context.userId, this.config.agentType);
    
    // 2. Enrich context
    const enrichedContext = await this.enrichContext(context);
    
    // 3. Detect intent
    const intentResult = await this.detectIntent(message, enrichedContext);
    
    // 4. Check confidence threshold
    if (intentResult.confidence < this.config.confidenceThreshold) {
      // Request collaboration
      return this.requestCollaboration(message, enrichedContext, intentResult);
    }
    
    // 5. Execute tools if needed
    const toolResults = await this.executeTools(intentResult.intent);
    
    // 6. Generate response
    const response = await this.generateResponse(
      intentResult.intent,
      enrichedContext,
      toolResults
    );
    
    // 7. Record metrics
    await this.recordMetrics(intentResult, response);
    
    // 8. Publish events
    await this.publishEvents(intentResult, response);
    
    return response;
  }
  
  // Helper methods
  protected async enrichContext(context: AgentContext): Promise<EnrichedContext> {
    const [userContext, sessionContext, personalization] = await Promise.all([
      this.coreBrain.getUserContext(context.userId),
      this.coreBrain.getSessionContext(context.sessionId),
      this.coreBrain.getPersonalization(context.userId),
    ]);
    
    return {
      ...context,
      user: userContext,
      session: sessionContext,
      personalization,
    };
  }
  
  protected async executeTools(intent: Intent): Promise<ToolResult[]> {
    const tools = intent.requiredTools || [];
    const results = [];
    
    for (const tool of tools) {
      const permission = await this.permissionGuard.checkToolAccess(
        this.config.agentType,
        tool
      );
      
      if (!permission.allowed) {
        results.push({ tool, error: 'Permission denied', allowed: false });
        continue;
      }
      
      const toolDef = await this.toolRegistry.getTool(tool);
      const result = await this.executeTool(toolDef, intent.entities);
      results.push({ tool, result, allowed: true });
    }
    
    return results;
  }
  
  protected async register(): Promise<void> {
    await this.eventBus.publish({
      eventType: 'AGENT_REGISTERED',
      payload: {
        agentId: this.config.agentId,
        agentType: this.config.agentType,
        capabilities: this.getCapabilities(),
        version: this.config.version,
      }
    });
  }
  
  protected async recordMetrics(
    intentResult: IntentResult,
    response: Response
  ): Promise<void> {
    this.metrics.record({
      intent: intentResult.intent.name,
      confidence: intentResult.confidence,
      responseTime: response.generationTimeMs,
      success: response.success,
    });
  }
}

// Domain expert base
export abstract class DomainExpert extends BaseAgent {
  abstract industry: string;
  abstract specializations: string[];
  
  // Industry-specific implementations
  protected abstract getIndustryKnowledge(): IndustryKnowledge;
  protected abstract getIndustryWorkflows(): IndustryWorkflow[];
}

// Functional expert base
export abstract class FunctionalExpert extends BaseAgent {
  abstract function: FunctionType;
  abstract scope: 'GLOBAL' | 'MERCHANT' | 'USER';
  
  // Policy-driven implementations
  protected abstract getPolicies(): Policy[];
  protected abstract getManagedResources(): ResourceType[];
}
```

## SDK Usage Example

```typescript
// Creating a new expert with SDK
import { DomainExpert, AgentConfig } from '@rez/agent-sdk';

class HospitalityExpertV2 extends DomainExpert {
  industry = 'HOSPITALITY';
  specializations = ['hotels', 'stays', 'resorts', 'vacation_rentals'];
  
  protected getIndustryKnowledge(): IndustryKnowledge {
    return {
      roomTypes: ROOM_TYPES,
      amenities: AMENITIES,
      checkInProcess: CHECKIN_WORKFLOW,
      policies: HOTEL_POLICIES,
    };
  }
  
  protected getIndustryWorkflows(): IndustryWorkflow[] {
    return [
      CHECKIN_WORKFLOW,
      CHECKOUT_WORKFLOW,
      ROOM_SERVICE_WORKFLOW,
      COMPLAINT_WORKFLOW,
    ];
  }
  
  async detectIntent(message: string, context: AgentContext): Promise<IntentResult> {
    // Use built-in classifier with industry-specific training
    return this.classifier.classify(message, {
      domain: 'HOSPITALITY',
      intents: HOSPITALITY_INTENTS,
      entities: HOTEL_ENTITIES,
    });
  }
  
  async generateResponse(
    intent: Intent,
    context: AgentContext,
    toolResults: ToolResult[]
  ): Promise<Response> {
    // Use industry-specific response templates
    return this.generator.generate(intent, {
      templates: HOSPITALITY_TEMPLATES,
      tone: context.personalization?.tone || 'professional',
      knowledge: this.getIndustryKnowledge(),
    });
  }
}

// Initialize
const agent = new HospitalityExpertV2({
  agentId: 'hospitality-v2',
  agentType: 'HOSPITALITY',
  coreBrainUrl: process.env.CORE_BRAIN_URL,
  eventBusUrl: process.env.EVENT_BUS_URL,
  confidenceThreshold: 0.7,
});

await agent.initialize();
await agent.start();
```

---

# 8. INTERNAL TOOL REGISTRY

## Tool Registry Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOOL REGISTRY │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Central registry of all tools agents can use │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ TOOLS │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ PAYMENT TOOLS │ BOOKING TOOLS │ CRM TOOLS │ ANALYTICS TOOLS │ │
│ │ • process_payment │ • create_booking │ • add_contact │ • track_event │ │
│ │ • refund │ • cancel_booking │ • update_contact │ • get_metrics │ │
│ │ • check_balance │ • update_booking │ • get_contact │ • generate_report │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ LOYALTY TOOLS │ NOTIFICATION TOOLS │ INVENTORY TOOLS │ │
│ │ • award_points │ • send_sms │ • check_stock │ │
│ │ • redeem_points │ • send_email │ • reserve_stock │ │
│ │ • get_tier │ • send_whatsapp │ • update_stock │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tool Schema

```typescript
interface Tool {
  // Identification
  toolId: string;
  name: string;
  description: string;
  version: string;
  
  // Category
  category: ToolCategory;
  subcategory?: string;
  
  // Permissions
  requiredPermissions: Permission[];
  allowedAgentTypes: AgentType[];
  
  // Schema
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  
  // Rate limiting
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  
  // Implementation
  handler: ToolHandler;
  
  // Metadata
  tags: string[];
  deprecated?: boolean;
}

// Tool categories
type ToolCategory = 
  | 'PAYMENT'
  | 'BOOKING'
  | 'CRM'
  | 'ANALYTICS'
  | 'LOYALTY'
  | 'NOTIFICATION'
  | 'INVENTORY'
  | 'MESSAGING'
  | 'MEDIA'
  | 'UTILITY';

// Example: Payment tool
const processPaymentTool: Tool = {
  toolId: 'payment.process',
  name: 'Process Payment',
  description: 'Process a payment for an order',
  version: '1.0.0',
  
  category: 'PAYMENT',
  
  requiredPermissions: ['PAYMENT_WRITE'],
  allowedAgentTypes: ['WALLET', 'SUPPORT', 'HOSPITALITY', 'CULINARY', 'RETAIL'],
  
  inputSchema: {
    type: 'object',
    required: ['orderId', 'amount', 'method'],
    properties: {
      orderId: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      method: { 
        type: 'string', 
        enum: ['UPI', 'CARD', 'WALLET', 'COD'] 
      },
      userId: { type: 'string' },
      metadata: { type: 'object' }
    }
  },
  
  outputSchema: {
    type: 'object',
    properties: {
      transactionId: { type: 'string' },
      status: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
      amount: { type: 'number' },
      timestamp: { type: 'string' }
    }
  },
  
  rateLimit: {
    requests: 100,
    windowMs: 60000
  },
  
  handler: async (input, context) => {
    // Check permissions
    await permissionService.check(context.userId, 'PAYMENT_WRITE');
    
    // Process payment
    const result = await paymentService.process({
      ...input,
      merchantId: context.merchantId
    });
    
    // Emit event
    await eventBus.publish({
      eventType: 'PAYMENT_COMPLETED',
      payload: result
    });
    
    return result;
  },
  
  tags: ['payment', 'transaction', 'commerce']
};
```

## Tool Registry API

```typescript
// Tool discovery
interface ToolRegistry {
  // List all tools (with filtering)
  listTools(filters?: {
    category?: ToolCategory;
    agentType?: AgentType;
    tags?: string[];
  }): Promise<Tool[]>;
  
  // Get specific tool
  getTool(toolId: string): Promise<Tool>;
  
  // Check tool access
  checkAccess(agentType: AgentType, toolId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }>;
  
  // Register new tool
  registerTool(tool: Tool): Promise<void>;
  
  // Update tool
  updateTool(toolId: string, updates: Partial<Tool>): Promise<void>;
  
  // Deprecate tool
  deprecateTool(toolId: string): Promise<void>;
}
```

---

# 9. AGENT PERMISSION SYSTEM

## Permission Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PERMISSION SYSTEM │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ PERMISSION MATRIX │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ │ HEALTH │ FINANCE │ USER_DATA │ ADMIN │ │
│ │ Hospitality │ ✗ │ ✓ │ ✓ │ ✗ │ │
│ │ Culinary │ ✗ │ ✓ │ ✓ │ ✗ │ │
│ │ Support │ ✗ │ ✓ │ ✓ │ ✗ │ │
│ │ Wallet │ ✗ │ ✓ │ ✗ │ ✗ │ │
│ │ Fraud │ ✗ │ ✓ │ ✓ │ ✗ │ │
│ │ Health │ ✓ │ ✗ │ ✓ │ ✗ │ │
│ │ Admin │ ✓ │ ✓ │ ✓ │ ✓ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Permission Types

```typescript
// Permission categories
enum PermissionCategory {
  HEALTH = 'HEALTH',
  FINANCE = 'FINANCE',
  USER_DATA = 'USER_DATA',
  ADMIN = 'ADMIN',
  CONTENT = 'CONTENT',
}

// Specific permissions
enum Permission {
  // Health permissions
  HEALTH_VIEW = 'HEALTH_VIEW',
  HEALTH_WRITE = 'HEALTH_WRITE',
  HEALTH_DIAGNOSIS = 'HEALTH_DIAGNOSIS',  // Very restricted
  
  // Finance permissions
  PAYMENT_READ = 'PAYMENT_READ',
  PAYMENT_WRITE = 'PAYMENT_WRITE',
  REFUND_AUTHORIZE = 'REFUND_AUTHORIZE',
  BALANCE_VIEW = 'BALANCE_VIEW',
  BALANCE_MODIFY = 'BALANCE_MODIFY',
  
  // User data permissions
  USER_PROFILE_READ = 'USER_PROFILE_READ',
  USER_PROFILE_WRITE = 'USER_PROFILE_WRITE',
  USER_HISTORY_READ = 'USER_HISTORY_READ',
  USER_CONSENT_MANAGE = 'USER_CONSENT_MANAGE',
  
  // Admin permissions
  AGENT_MANAGE = 'AGENT_MANAGE',
  SERVICE_CONFIG = 'SERVICE_CONFIG',
  AUDIT_VIEW = 'AUDIT_VIEW',
}

// Agent roles
interface AgentRole {
  roleId: string;
  name: string;
  permissions: Permission[];
  constraints?: {
    maxRefundAmount?: number;
    maxPaymentAmount?: number;
    allowedChannels?: Channel[];
    allowedMerchants?: string[];
  };
}

// Predefined roles
const AGENT_ROLES: Record<string, AgentRole> = {
  HOSPITALITY: {
    roleId: 'HOSPITALITY',
    name: 'Hospitality Expert',
    permissions: [
      Permission.PAYMENT_READ,
      Permission.BALANCE_VIEW,
      Permission.USER_PROFILE_READ,
      Permission.USER_HISTORY_READ,
      Permission.CONTENT_READ,
    ],
    constraints: {
      maxPaymentAmount: 100000,
      allowedChannels: ['WHATSAPP', 'WEB', 'VOICE'],
    }
  },
  
  WALLET: {
    roleId: 'WALLET',
    name: 'Wallet Agent',
    permissions: [
      Permission.PAYMENT_READ,
      Permission.PAYMENT_WRITE,
      Permission.REFUND_AUTHORIZE,
      Permission.BALANCE_VIEW,
      Permission.BALANCE_MODIFY,
    ],
    constraints: {
      maxRefundAmount: 50000,
      maxPaymentAmount: 500000,
    }
  },
  
  HEALTH: {
    roleId: 'HEALTH',
    name: 'Health Expert',
    permissions: [
      Permission.HEALTH_VIEW,
      Permission.HEALTH_WRITE,
      Permission.USER_PROFILE_READ,
    ],
    constraints: {
      allowedChannels: ['WHATSAPP', 'WEB'],
    }
  },
  
  FRAUD: {
    roleId: 'FRAUD',
    name: 'Fraud Detection Agent',
    permissions: [
      Permission.PAYMENT_READ,
      Permission.PAYMENT_WRITE,
      Permission.USER_PROFILE_READ,
      Permission.USER_HISTORY_READ,
    ],
    constraints: {
      maxPaymentAmount: 0,  // Can only flag, not process
    }
  },
  
  ADMIN: {
    roleId: 'ADMIN',
    name: 'System Administrator',
    permissions: Object.values(Permission),
  }
};
```

## Permission Guard Implementation

```typescript
class PermissionGuard {
  async check(
    agentType: AgentType,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    // Get agent role
    const role = AGENT_ROLES[agentType];
    if (!role) {
      return { allowed: false, reason: 'Unknown agent type' };
    }
    
    // Check permission
    if (!role.permissions.includes(permission)) {
      return { 
        allowed: false, 
        reason: `${agentType} does not have ${permission} permission` 
      };
    }
    
    // Check constraints
    if (role.constraints) {
      const constraintCheck = this.checkConstraints(role.constraints, context);
      if (!constraintCheck.allowed) {
        return constraintCheck;
      }
    }
    
    return { allowed: true };
  }
  
  async checkToolAccess(
    agentType: AgentType,
    tool: Tool
  ): Promise<PermissionResult> {
    // Check tool permissions
    for (const perm of tool.requiredPermissions) {
      const result = await this.check(agentType, perm);
      if (!result.allowed) {
        return result;
      }
    }
    
    // Check allowed agent types
    if (!tool.allowedAgentTypes.includes(agentType)) {
      return {
        allowed: false,
        reason: `${agentType} is not authorized to use ${tool.name}`
      };
    }
    
    return { allowed: true };
  }
  
  private checkConstraints(
    constraints: AgentRole['constraints'],
    context?: PermissionContext
  ): PermissionResult {
    if (!context || !constraints) {
      return { allowed: true };
    }
    
    if (constraints.maxPaymentAmount && context.amount > constraints.maxPaymentAmount) {
      return {
        allowed: false,
        reason: `Amount ${context.amount} exceeds limit ${constraints.maxPaymentAmount}`
      };
    }
    
    if (constraints.maxRefundAmount && context.refundAmount > constraints.maxRefundAmount) {
      return {
        allowed: false,
        reason: `Refund ${context.refundAmount} exceeds limit ${constraints.maxRefundAmount}`
      };
    }
    
    if (constraints.allowedChannels && !constraints.allowedChannels.includes(context.channel)) {
      return {
        allowed: false,
        reason: `Channel ${context.channel} is not allowed for this agent`
      };
    }
    
    return { allowed: true };
  }
}
```

---

# 10. EVALUATION FRAMEWORK

## Evaluation Metrics

```typescript
interface EvaluationMetrics {
  // Response quality
  responseQuality: {
    accuracy: number;           // Correct intent?
    completeness: number;      // All user needs addressed?
    relevance: number;        // On-topic?
    helpfulness: number;      // User rating
  };
  
  // Routing quality
  routingQuality: {
    accuracy: number;         // Correct agent selected?
    confidenceCalibration: number; // Confident when right?
    fallbackRate: number;      // How often needed fallback?
  };
  
  // Business metrics
  businessMetrics: {
    conversionRate: number;   // Orders/total conversations
    resolutionRate: number;   // Issues resolved?
    escalationRate: number;   // Human escalation rate
    responseTime: number;      // Average response time
  };
  
  // Safety metrics
  safetyMetrics: {
    hallucinationRate: number; // Made-up information?
    policyViolationRate: number;
    harmfulContentRate: number;
  };
}

// Example evaluation
interface EvaluationResult {
  evaluationId: string;
  timestamp: string;
  
  conversationId: string;
  agentType: AgentType;
  intent: string;
  
  metrics: EvaluationMetrics;
  
  annotations: {
    correctIntent: boolean;
    correctRouting: boolean;
    issues: string[];
    hallucinations: string[];
  };
  
  overallScore: number;  // 0-100
}
```

## Evaluation Pipeline

```typescript
class EvaluationFramework {
  // Collect real-time feedback
  async evaluateConversation(conversation: Conversation): Promise<EvaluationResult> {
    const metrics = await this.calculateMetrics(conversation);
    const annotations = await this.annotateConversation(conversation);
    
    return {
      evaluationId: generateId(),
      timestamp: new Date().toISOString(),
      conversationId: conversation.id,
      agentType: conversation.agentType,
      intent: conversation.intent,
      metrics,
      annotations,
      overallScore: this.calculateOverallScore(metrics, annotations)
    };
  }
  
  // Calculate metrics
  private async calculateMetrics(conversation: Conversation): Promise<EvaluationMetrics> {
    // Response quality from user feedback + AI evaluation
    const responseQuality = await this.evaluateResponseQuality(conversation);
    
    // Routing accuracy from intent detection + manual review
    const routingQuality = await this.evaluateRoutingQuality(conversation);
    
    // Business metrics from conversation outcomes
    const businessMetrics = await this.evaluateBusinessMetrics(conversation);
    
    // Safety from content analysis
    const safetyMetrics = await this.evaluateSafetyMetrics(conversation);
    
    return {
      responseQuality,
      routingQuality,
      businessMetrics,
      safetyMetrics
    };
  }
  
  // Generate reports
  async generateReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      agentType?: AgentType;
      merchantId?: string;
      channel?: Channel;
    }
  ): Promise<EvaluationReport> {
    const evaluations = await this.getEvaluations(startDate, endDate, filters);
    
    return {
      period: { start: startDate, end: endDate },
      filters,
      summary: this.calculateSummary(evaluations),
      agentBreakdown: this.calculateAgentBreakdown(evaluations),
      intentBreakdown: this.calculateIntentBreakdown(evaluations),
      trends: this.calculateTrends(evaluations),
      recommendations: this.generateRecommendations(evaluations),
    };
  }
}

// Dashboard metrics
interface DashboardMetrics {
  // Real-time
  activeConversations: number;
  averageResponseTime: number;
  currentFallbackRate: number;
  
  // Today
  todayConversations: number;
  todayResolutionRate: number;
  todayConversionRate: number;
  
  // Week over week
  weekOverWeekChange: {
    conversations: number;
    resolutionRate: number;
    responseTime: number;
  };
  
  // Alerts
  alerts: Array<{
    type: 'HALLUCINATION' | 'FALLBACK_SPIKE' | 'LATENCY_SPIKE' | 'ESCALATION_SPIKE';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    metric: number;
    threshold: number;
  }>;
}
```

---

# 11. AUTONOMOUS COMMERCE

## Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTONOMOUS COMMERCE │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ User: "Plan my Goa trip next weekend" │
│ │
│ ↓ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ SYSTEM AUTOMATICALLY: │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ 1. Travel Expert → Creates itinerary │ │
│ │ 2. Hotel Expert → Books accommodation │ │
│ │ 3. Culinary Expert → Suggests restaurants │ │
│ │ 4. Activity Expert → Schedules experiences │ │
│ │ 5. Wallet Agent → Processes payments │ │
│ │ 6. Notification Agent → Sends confirmations │ │
│ │ 7. Campaign Agent → Creates follow-up │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ↓ │
│ │
│ "Your Goa trip is planned! │ │
│ 🏨 Taj Holiday Village booked │ │
│ 🚗 Airport transfer arranged │ │
│ 🍽️ 3 restaurant reservations │ │
│ 🏖️ Beach activity scheduled │ │
│ Total: ₹45,000 │ │
│ Pay now?" │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Implementation

```typescript
// Autonomous commerce orchestrator
class AutonomousCommerceOrchestrator {
  async processGoal(
    userGoal: UserGoal,
    context: AgentContext
  ): Promise<CommercePlan> {
    // 1. Decompose goal into tasks
    const tasks = this.decomposeGoal(userGoal);
    
    // 2. Create execution plan
    const plan = await this.createExecutionPlan(tasks, context);
    
    // 3. Get user approval
    const approval = await this.requestApproval(plan);
    
    if (!approval.confirmed) {
      return { status: 'REJECTED', modifications: approval.suggestions };
    }
    
    // 4. Execute plan
    const results = await this.executePlan(plan);
    
    // 5. Handle failures
    const handledResults = await this.handleFailures(results);
    
    // 6. Send confirmations
    await this.sendConfirmations(handledResults);
    
    return {
      status: 'COMPLETED',
      bookings: handledResults.successful,
      totalCost: handledResults.totalCost,
      itinerary: handledResults.itinerary
    };
  }
  
  // Example: Goa trip
  async planGoaTrip(userId: string, dates: DateRange): Promise<CommercePlan> {
    // 1. Create itinerary
    const itinerary = await this.travelExpert.createItinerary({
      destination: 'Goa',
      dates,
      preferences: await this.coreBrain.getPreferences(userId)
    });
    
    // 2. Parallel booking tasks
    const bookingTasks = [
      // Hotel
      this.createBookingTask({
        type: 'ACCOMMODATION',
        expert: 'HOSPITALITY',
        params: {
          location: 'Goa Beach',
          dates,
          budget: itinerary.hotelBudget
        }
      }),
      
      // Transport
      this.createBookingTask({
        type: 'TRANSPORT',
        expert: 'TRAVEL',
        params: {
          from: 'Mumbai',
          to: 'Goa',
          date: dates.start,
          mode: 'FLIGHT'
        }
      }),
      
      // Restaurants
      this.createBookingTask({
        type: 'DINING',
        expert: 'CULINARY',
        params: {
          location: 'Goa',
          cuisine: itinerary.preferredCuisines,
          days: dates.dayCount
        }
      }),
      
      // Activities
      this.createBookingTask({
        type: 'ACTIVITY',
        expert: 'TRAVEL',
        params: {
          location: 'Goa',
          interests: itinerary.interests
        }
      })
    ];
    
    // 3. Execute in parallel where possible
    const bookings = await Promise.all(bookingTasks.map(t => this.executeTask(t)));
    
    // 4. Calculate total
    const total = bookings.reduce((sum, b) => sum + b.cost, 0);
    
    return {
      userId,
      destination: 'Goa',
      dates,
      items: bookings,
      totalCost: total,
      estimatedSavings: this.calculateSavings(bookings),
      confirmationRequired: true
    };
  }
}
```

---

# 12. IMPLEMENTATION PLAN

## Phase 1: Core Infrastructure (Week 1)

| Task | Deliverable | Effort |
|------|-------------|--------|
| Create Shared Event Schema | Event types, validation | Medium |
| Build Event Bus Service | Redis + Kafka pub/sub | High |
| Implement Tool Registry | Registry service + SDK | High |
| Create Permission System | Roles, guards, middleware | Medium |

## Phase 2: Agent SDK (Week 2)

| Task | Deliverable | Effort |
|------|-------------|--------|
| Build Unified SDK | Base classes, utilities | High |
| Update Domain Experts | Refactor to use SDK | Medium |
| Update Functional Experts | Refactor to use SDK | Medium |
| Create SDK Documentation | Usage guides | Low |

## Phase 3: Orchestration (Week 3)

| Task | Deliverable | Effort |
|------|-------------|--------|
| Implement Priority Rules | Priority resolver | Medium |
| Add Confidence Scoring | Scoring algorithm | Medium |
| Update Orchestrator | v2 → v3 | High |
| Add Permission Checks | Guard integration | Medium |

## Phase 4: Evaluation (Week 4)

| Task | Deliverable | Effort |
|------|-------------|--------|
| Build Evaluation Service | Metrics collection | Medium |
| Create Dashboard | Real-time metrics | Medium |
| Add Feedback Collection | User ratings | Low |
| Generate Reports | Weekly/monthly | Low |

## Phase 5: Autonomous Commerce (Future)

| Task | Deliverable | Effort |
|------|-------------|--------|
| Goal Decomposition | Task planner | High |
| Multi-Agent Execution | Parallel execution | High |
| Approval Flow | User confirmation | Medium |
| Failure Handling | Rollback, retry | High |

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Agent Categorization | Ready | Domain vs Functional |
| Priority Hierarchy | Ready | Emergency > Payment > Domain |
| Confidence Scoring | Ready | Intent + Context + History |
| Shared Event Schema | Ready | Standardized events |
| Unified Agent SDK | Ready | Base classes + utilities |
| Tool Registry | Ready | Centralized tools |
| Permission System | Ready | Role-based access |
| Evaluation Framework | Ready | Metrics + dashboard |
| Autonomous Commerce | Future | Goal decomposition |

---

**This architecture is ready for implementation.**
