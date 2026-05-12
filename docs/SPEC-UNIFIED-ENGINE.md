# REZ Unified Conversation Engine - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Channel Integration](#3-channel-integration)
4. [Context Management](#4-context-management)
5. [Agent Routing](#5-agent-routing)
6. [Message Processing](#6-message-processing)
7. [Session Management](#7-session-management)
8. [API Endpoints](#8-api-endpoints)

---

# 1. OVERVIEW

## 1.1 What is REZ Unified Engine?

REZ Unified Engine is the **central hub** that connects all communication channels (WhatsApp, Voice, Copilot, Website) to REZ Agent OS - enabling seamless, contextual conversations across any channel.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED ENGINE - THE CONNECTOR                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │WhatsApp │  │ Voice   │  │Copilot  │  │Website  │                 │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘                 │
│       │             │             │             │                        │
│       └─────────────┴──────┬─────┴─────────────┘                        │
│                             │                                              │
│                             ▼                                              │
│                    ┌────────────────┐                                    │
│                    │ UNIFIED ENGINE │                                    │
│                    │                │                                    │
│                    │ • Channel Router│                                    │
│                    │ • Context Manager│                                    │
│                    │ • Intent Processor│                                    │
│                    │ • Agent Router │                                    │
│                    │ • Session Store │                                    │
│                    └────────┬───────┘                                    │
│                             │                                              │
│       ┌────────────────────┼────────────────────┐                         │
│       │                    │                    │                         │
│       ▼                    ▼                    ▼                         │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐                  │
│  │  Sales  │        │ Support │        │Consult- │                  │
│  │  Agent  │        │  Agent  │        │   ant   │                  │
│  └─────────┘        └─────────┘        └─────────┘                  │
│                             │                                              │
│                             ▼                                              │
│                    ┌────────────────┐                                    │
│                    │   REZ AGENT   │                                    │
│                    │      OS        │                                    │
│                    │   (38 agents)  │                                    │
│                    └────────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Channel** | WhatsApp, Voice, Copilot, Website |
| **Unified Context** | Same conversation across channels |
| **Agent Routing** | Route to Sales/Support/Consultant/Info |
| **Session Memory** | Remember context across interactions |
| **Real-time** | Low-latency message processing |
| **Scalable** | Handle 10,000+ concurrent sessions |

---

# 2. ARCHITECTURE

## 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED ENGINE - DETAILED ARCHITECTURE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CHANNELS                                       │
│                                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │WhatsApp │  │ Voice   │  │Copilot  │  │Website  │                 │
│  │Webhook  │  │ Call    │  │ Chat    │  │ Chat    │                 │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘                 │
│       │             │             │             │                        │
└───────┼─────────────┼─────────────┼─────────────┼────────────────────────┘
        │             │             │             │
        └─────────────┴──────┬─────┴─────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CHANNEL ADAPTER LAYER                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        MESSAGE NORMALIZER                             │  │
│  │                                                                       │  │
│  │  WhatsApp Adapter │ Voice Adapter │ Copilot Adapter │ Web Adapter  │  │
│  │                                                                       │  │
│  │  • Parse message  • Transcribe  • Parse message  • Parse message    │  │
│  │  • Normalize     • Normalize   • Normalize     • Normalize         │  │
│  │  • Validate      • Validate    • Validate      • Validate          │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          UNIFIED MESSAGE                                    │
│                                                                              │
│  {                                                                           │
│    "messageId": "msg_123",                                                │
│    "channel": "WHATSAPP",                                                 │
│    "direction": "INBOUND",                                                 │
│    "userId": "user_456",                                                  │
│    "merchantId": "merchant_789",                                          │
│    "content": "I want to order biryani",                                   │
│    "language": "en",                                                       │
│    "intent": "ORDER_FOOD",                                                 │
│    "entities": { "food": "biryani" },                                     │
│    "metadata": { ... }                                                     │
│  }                                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CONTEXT & SESSION LAYER                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      SESSION MANAGER                                   │  │
│  │                                                                       │  │
│  │  • Load session context    • Update session    • Save to Redis    │  │
│  │  • Merge channel context   • Handle timeouts   • Cleanup old    │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                             │                                              │
│                             ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     CONTEXT AGGREGATOR                               │  │
│  │                                                                       │  │
│  │  • User profile           • Order history    • Cart state         │  │
│  │  • Conversation history  • Preferences     • Business context   │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTENT & ROUTING LAYER                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      INTENT PROCESSOR                                 │  │
│  │                                                                       │  │
│  │  • Extract intent          • Detect language  • Extract entities  │  │
│  │  • Analyze sentiment       • Check confidence • Determine urgency   │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                             │                                              │
│                             ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        AGENT ROUTER                                   │  │
│  │                                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│  │  │  Sales  │  │ Support │  │Consult- │  │  Info   │             │  │
│  │  │  Agent  │  │  Agent  │  │   ant   │  │  Agent  │             │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESPONSE LAYER                                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    RESPONSE GENERATOR                                 │  │
│  │                                                                       │  │
│  │  • Generate response     • Format for channel   • Add quick replies│  │
│  │  • Add personalization  • Apply tone/style     • Include CTAs    │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                             │                                              │
│                             ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       CHANNEL FORMatters                             │  │
│  │                                                                       │  │
│  │  WhatsApp Formatter │ Voice Formatter │ Copilot Formatter │ Web Form│  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                             │                                              │
└─────────────────────────────┼─────────────────────────────────────────────┘
                              │
                              ▼
                    ┌────────────────┐
                    │   CHANNELS     │
                    │    RESPOND     │
                    └────────────────┘
```

---

# 3. CHANNEL INTEGRATION

## 3.1 Channel Adapters

```typescript
interface ChannelAdapter {
  // Channel identifier
  channel: ChannelType;

  // Parse incoming message
  parseMessage(rawMessage: any): NormalizedMessage;

  // Format outgoing message
  formatMessage(message: Response): ChannelMessage;

  // Validate webhook
  validateWebhook(payload: any, headers: any): boolean;

  // Get typing indicator
  getTypingIndicator(durationMs?: number): any;
}

type ChannelType = 'WHATSAPP' | 'VOICE' | 'COPILOT' | 'WEBSITE' | 'SMS';
```

### WhatsApp Adapter

```typescript
class WhatsAppAdapter implements ChannelAdapter {
  channel: 'WHATSAPP';

  parseMessage(payload: TwilioWebhookPayload): NormalizedMessage {
    return {
      messageId: payload.MessageSid,
      channel: 'WHATSAPP',
      direction: 'INBOUND',

      userId: this.extractUserId(payload.From),
      merchantId: this.extractMerchantId(payload.To),

      content: payload.Body,
      contentType: 'text',

      metadata: {
        waId: payload.From,
        waName: payload.ProfileName,
        messageType: payload.MessageType,
        mediaUrl: payload.MediaUrl0,
        mediaType: payload.MediaContentType0
      }
    };
  }

  formatMessage(response: Response): WhatsAppMessage {
    if (response.type === 'text') {
      return {
        messaging_product: 'whatsapp',
        to: response.userId,
        type: 'text',
        text: {
          body: response.content
        }
      };
    }

    if (response.type === 'interactive') {
      return {
        messaging_product: 'whatsapp',
        to: response.userId,
        type: 'interactive',
        interactive: response.interactive
      };
    }

    // Template message
    return {
      messaging_product: 'whatsapp',
      to: response.userId,
      type: 'template',
      template: response.template
    };
  }
}
```

### Voice Adapter

```typescript
class VoiceAdapter implements ChannelAdapter {
  channel: 'VOICE';

  parseMessage(callData: VoiceCallData): NormalizedMessage {
    // Convert voice input to text
    const transcription = callData.transcription;
    const language = callData.language;

    return {
      messageId: callData.callSid,
      channel: 'VOICE',
      direction: 'INBOUND',

      userId: this.extractUserId(callData.from),
      merchantId: this.extractMerchantId(callData.to),

      content: transcription.text,
      contentType: 'voice',

      metadata: {
        callSid: callData.callSid,
        duration: callData.duration,
        language,
        confidence: transcription.confidence,
        audioUrl: callData.recordingUrl
      }
    };
  }

  formatMessage(response: Response): VoiceResponse {
    // Convert text response to audio
    return {
      callSid: response.userId, // For TwiML
      twiml: `
        <Response>
          <Say voice="Polly.Raveena">
            ${response.content}
          </Say>
          <Pause length="1"/>
          ${response.action ? `<Redirect>${response.action}</Redirect>` : ''}
        </Response>
      `
    };
  }
}
```

---

# 4. CONTEXT MANAGEMENT

## 4.1 Unified Message Format

```typescript
interface NormalizedMessage {
  // Identifiers
  messageId: string;
  channel: ChannelType;
  direction: 'INBOUND' | 'OUTBOUND';
  timestamp: Date;

  // Parties
  userId: string;
  merchantId: string;
  sessionId?: string;

  // Content
  content: string;
  contentType: 'text' | 'voice' | 'image' | 'video' | 'document' | 'location' | 'contact';

  // Parsed data
  language?: string;
  intent?: {
    name: string;
    confidence: number;
  };
  entities?: Record<string, any>;
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

  // Context
  metadata: Record<string, any>;
}

interface Response {
  type: 'text' | 'interactive' | 'template' | 'media' | 'voice';
  content: string;
  interactive?: InteractiveMessage;
  template?: TemplateMessage;
  quickReplies?: QuickReply[];
  action?: string;  // For voice: next action
}
```

## 4.2 Context Aggregation

```typescript
interface ConversationContext {
  // Session
  sessionId: string;
  channel: ChannelType;
  startedAt: Date;
  lastActivityAt: Date;

  // User
  user: {
    userId: string;
    name?: string;
    phone?: string;
    email?: string;
    preferredChannel?: ChannelType;
    language?: string;
    timezone?: string;
  };

  // Merchant
  merchant: {
    merchantId: string;
    name: string;
    category: string;
    settings: MerchantSettings;
  };

  // Business context
  business: {
    cart?: Cart;
    recentOrders?: Order[];
    activeOrder?: Order;
    preferences?: UserPreferences;
    tags?: string[];
  };

  // Conversation
  conversation: {
    history: ConversationTurn[];
    currentIntent?: string;
    currentFlow?: string;
    currentNode?: string;
    variables: Record<string, any>;
  };

  // AI
  ai: {
    activeAgent?: AgentType;
    suggestedProducts?: Product[];
    recommendations?: Recommendation[];
    urgencyScore?: number;
  };
}

interface ConversationTurn {
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: Date;
  intent?: string;
  metadata?: Record<string, any>;
}
```

## 4.3 Context Retrieval

```typescript
class ContextAggregator {
  async aggregateContext(
    userId: string,
    merchantId: string,
    channel: ChannelType
  ): Promise<ConversationContext> {
    // Parallel fetch all context sources
    const [
      session,
      user,
      merchant,
      cart,
      orders,
      conversation
    ] = await Promise.all([
      this.getSession(userId, merchantId, channel),
      this.userService.getUser(userId),
      this.merchantService.getMerchant(merchantId),
      this.cartService.getCart(userId, merchantId),
      this.orderService.getRecentOrders(userId, merchantId),
      this.conversationService.getHistory(userId, merchantId)
    ]);

    // Aggregate into unified context
    return {
      session: session,
      user: user,
      merchant: merchant,
      business: {
        cart: cart,
        recentOrders: orders.slice(0, 5),
        activeOrder: orders[0],
        preferences: user?.preferences,
        tags: user?.tags
      },
      conversation: {
        history: conversation,
        currentIntent: session?.currentIntent,
        currentFlow: session?.currentFlow,
        currentNode: session?.currentNode,
        variables: session?.variables || {}
      }
    };
  }
}
```

---

# 5. AGENT ROUTING

## 5.1 Intent to Agent Routing

```typescript
interface AgentRouter {
  // Route intent to appropriate agent
  routeIntent(intent: Intent, context: ConversationContext): AgentType;

  // Check if escalation needed
  shouldEscalate(agentType: AgentType, context: ConversationContext): boolean;
}

// Intent to Agent mapping
const intentAgentMapping: Record<string, AgentType> = {
  // Sales intents
  'ORDER_FOOD': 'SALES',
  'BROWSE_MENU': 'SALES',
  'VIEW_PRODUCT': 'SALES',
  'CHECKOUT': 'SALES',
  'ADD_TO_CART': 'SALES',
  'PRICE_INQUIRY': 'SALES',
  'DISCOUNT_INQUIRY': 'SALES',

  // Support intents
  'CANCEL_ORDER': 'SUPPORT',
  'REFUND_REQUEST': 'SUPPORT',
  'ORDER_ISSUE': 'SUPPORT',
  'COMPLAINT': 'SUPPORT',
  'TRACK_ORDER': 'SUPPORT',
  'ORDER_STATUS': 'SUPPORT',

  // Consultant intents
  'RECOMMENDATION': 'CONSULTANT',
  'WHAT_SHOULD_I_GET': 'CONSULTANT',
  'WHICH_IS_BETTER': 'CONSULTANT',
  'HELP_DECIDING': 'CONSULTANT',
  'COMPARE': 'CONSULTANT',

  // Info intents
  'STORE_HOURS': 'INFO',
  'STORE_LOCATION': 'INFO',
  'CONTACT_INFO': 'INFO',
  'FAQ': 'INFO',
  'DELIVERY_INFO': 'INFO',
  'POLICY_INFO': 'INFO'
};

// Fallback mapping
const fallbackAgents: AgentType[] = ['INFO', 'SALES', 'SUPPORT'];
```

## 5.2 Agent Selection Logic

```typescript
class AgentSelector {
  selectAgent(
    intent: string,
    context: ConversationContext
  ): AgentConfig {
    // Primary agent based on intent
    const primaryAgent = this.getPrimaryAgent(intent);

    // Check for escalation conditions
    if (this.shouldEscalate(primaryAgent, context)) {
      return this.getEscalationConfig(primaryAgent, context);
    }

    // Check for override conditions
    if (this.shouldOverride(primaryAgent, context)) {
      return this.getOverrideConfig(primaryAgent, context);
    }

    return {
      type: primaryAgent,
      context: this.prepareAgentContext(primaryAgent, context),
      capabilities: this.getAgentCapabilities(primaryAgent)
    };
  }

  private shouldEscalate(
    agent: AgentType,
    context: ConversationContext
  ): boolean {
    // Negative sentiment escalation
    if (context.conversation.history.length > 0) {
      const lastSentiment = context.conversation.history.at(-1).sentiment;
      if (lastSentiment === 'NEGATIVE') {
        return true;
      }
    }

    // Multiple failed attempts
    if (context.conversation.variables.failedAttempts >= 3) {
      return true;
    }

    // Explicit request for human
    if (context.conversation.history.some(h =>
      h.content.match(/speak.*agent|human|real.*person/i)
    )) {
      return true;
    }

    // High-value transaction
    if (context.business.cart?.total > 10000) {
      return true;
    }

    return false;
  }
}
```

---

# 6. MESSAGE PROCESSING

## 6.1 Processing Pipeline

```typescript
class UnifiedEngine {
  private async processMessage(
    rawMessage: any,
    channel: ChannelType
  ): Promise<Response> {
    try {
      // Step 1: Parse and normalize
      const message = this.adapters[channel].parseMessage(rawMessage);

      // Step 2: Get or create session
      const session = await this.sessionManager.getOrCreateSession(
        message.userId,
        message.merchantId,
        channel
      );
      message.sessionId = session.sessionId;

      // Step 3: Aggregate context
      const context = await this.contextAggregator.aggregateContext(
        message.userId,
        message.merchantId,
        channel
      );

      // Step 4: Process intent
      const intentResult = await this.intentProcessor.process(
        message.content,
        context
      );
      message.intent = intentResult.intent;
      message.entities = intentResult.entities;
      message.language = intentResult.language;
      message.sentiment = intentResult.sentiment;

      // Step 5: Route to agent
      const agentConfig = await this.agentRouter.selectAgent(
        intentResult.intent,
        context
      );

      // Step 6: Generate response
      const response = await this.agentExecutor.execute(
        agentConfig,
        message,
        context
      );

      // Step 7: Log conversation
      await this.conversationLogger.log({
        message,
        response,
        agent: agentConfig.type,
        context
      });

      // Step 8: Update session
      await this.sessionManager.updateSession(session.sessionId, {
        currentIntent: intentResult.intent.name,
        lastActivityAt: new Date()
      });

      return response;
    } catch (error) {
      return this.handleError(error, channel);
    }
  }
}
```

## 6.2 Intent Processing

```typescript
interface IntentProcessor {
  process(
    text: string,
    context: ConversationContext
  ): Promise<IntentResult>;
}

interface IntentResult {
  intent: {
    name: string;
    confidence: number;
  };
  entities: Record<string, any>;
  language: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Implementation using REZ Intent Graph
class REZIntentProcessor implements IntentProcessor {
  async process(
    text: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    // Detect language
    const language = await this.detectLanguage(text);

    // Process intent with context
    const intent = await this.intentGraph.analyze({
      text,
      language,
      context: {
        userId: context.user.userId,
        merchantId: context.merchant.merchantId,
        recentIntents: context.conversation.history.slice(-5).map(h => h.intent),
        entities: context.conversation.variables
      }
    });

    // Extract entities
    const entities = await this.entityExtractor.extract(text, intent.name, language);

    // Analyze sentiment
    const sentiment = await this.sentimentAnalyzer.analyze(text);

    // Determine urgency
    const urgency = this.determineUrgency(intent, entities, sentiment);

    return {
      intent: { name: intent.name, confidence: intent.confidence },
      entities,
      language,
      sentiment,
      urgency
    };
  }
}
```

---

# 7. SESSION MANAGEMENT

## 7.1 Session Store

```typescript
interface Session {
  sessionId: string;

  // Identification
  userId: string;
  merchantId: string;
  channel: ChannelType;

  // State
  status: 'ACTIVE' | 'IDLE' | 'EXPIRED' | 'CLOSED';

  // Conversation
  currentIntent?: string;
  currentFlow?: string;
  currentNode?: string;
  variables: Record<string, any>;

  // History
  messageCount: number;
  turns: ConversationTurn[];

  // Timing
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;

  // Meta
  metadata: Record<string, any>;
}

// Session TTL
const sessionTTL = {
  WHATSAPP: 24 * 60 * 60 * 1000,    // 24 hours
  VOICE: 30 * 60 * 1000,              // 30 minutes (call duration)
  COPILOT: 30 * 60 * 1000,           // 30 minutes
  WEBSITE: 2 * 60 * 60 * 1000        // 2 hours
};
```

## 7.2 Session Operations

```typescript
class SessionManager {
  async getOrCreateSession(
    userId: string,
    merchantId: string,
    channel: ChannelType
  ): Promise<Session> {
    // Try to find existing active session
    const existing = await this.redis.get(
      `session:${userId}:${merchantId}`
    );

    if (existing) {
      const session = JSON.parse(existing);

      // Check if expired
      if (new Date(session.expiresAt) < new Date()) {
        // Mark as expired, create new
        await this.closeSession(session.sessionId);
      } else {
        // Extend session
        session.lastActivityAt = new Date();
        session.expiresAt = new Date(Date.now() + sessionTTL[channel]);
        await this.saveSession(session);
        return session;
      }
    }

    // Create new session
    const session: Session = {
      sessionId: this.generateSessionId(),
      userId,
      merchantId,
      channel,
      status: 'ACTIVE',
      messageCount: 0,
      turns: [],
      variables: {},
      startedAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + sessionTTL[channel]),
      metadata: {}
    };

    await this.saveSession(session);
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    const session = await this.getSession(sessionId);
    Object.assign(session, updates);
    await this.saveSession(session);
  }
}
```

---

# 8. API ENDPOINTS

## 8.1 Message Endpoints

```typescript
// Send message to user
POST /api/unified/messages

Body: {
  userId: string;
  merchantId: string;
  channel: 'WHATSAPP' | 'COPILOT' | 'WEBSITE';
  content: string;
  type: 'text' | 'interactive';
  metadata?: Record<string, any>;
}

Response: {
  messageId: string;
  sessionId: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

// Webhook endpoints for channels
POST /api/unified/webhook/whatsapp
POST /api/unified/webhook/voice
POST /api/unified/webhook/copilot
POST /api/unified/webhook/website
```

## 8.2 Session Endpoints

```typescript
// Get session
GET /api/unified/sessions/:sessionId

Response: {
  session: Session;
  context: ConversationContext;
}

// Get conversation history
GET /api/unified/sessions/:sessionId/history

Query: {
  limit?: number;
  offset?: number;
}

// Close session
POST /api/unified/sessions/:sessionId/close
```

## 8.3 Context Endpoints

```typescript
// Update session variables
PUT /api/unified/sessions/:sessionId/variables

Body: {
  key: string;
  value: any;
}

// Clear session context
DELETE /api/unified/sessions/:sessionId/context
```

## 8.4 Analytics Endpoints

```typescript
// Get conversation analytics
GET /api/unified/analytics/conversations

Query: {
  merchantId: string;
  startDate: string;
  endDate: string;
  channel?: ChannelType;
}

Response: {
  totalConversations: number;
  avgDuration: number;
  intentBreakdown: Record<string, number>;
  agentBreakdown: Record<string, number>;
  sentimentBreakdown: Record<string, number>;
}
```

---

# APPENDIX

## A. Performance Targets

| Metric | Target |
|--------|--------|
| Message Processing Latency | < 200ms |
| Session Lookup | < 50ms |
| Context Aggregation | < 100ms |
| Total Response Time | < 500ms |
| Concurrent Sessions | 100,000 |

## B. Error Handling

| Error | Response |
|-------|----------|
| Invalid Channel | 400 Bad Request |
| Session Not Found | 404 Not Found |
| Rate Limited | 429 Too Many Requests |
| Service Unavailable | 503 Service Unavailable |
