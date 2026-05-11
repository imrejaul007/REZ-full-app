# ReZ Unified Agent Orchestration
**Version:** 1.0  
**Date:** May 3, 2026  
**Purpose:** Superchat-style execution layer for ReZ Mind

---

## 1. Concept

This is the **Superchat layer** — the execution engine that turns user intents into completed actions.

### The Core Idea
> User says what they want → ReZ agents coordinate → Tasks get done → User gets rewarded

Unlike chatbots that just answer, ReZ agents **DO things**:
- Book reservations
- Process payments
- Schedule deliveries
- Apply karma discounts
- Distribute coins

### The ReZ Execution Difference
```
Superchat: Single app → Multiple services
ReZ:       Multiple apps → Unified execution + Rewards
```

ReZ's advantage: Every action earns karma, every completion triggers coins. This creates a **reward loop** that Superchat lacks.

---

## 2. Current Agent Architecture

### 2.1 Existing 8 Agents (from REZ-AGENT-OS-EXTRACTION-PLAN.md)
```
┌─────────────────────────────────────────────────────────────┐
│                     REZ AGENT OS                            │
├─────────────────────────────────────────────────────────────┤
│  1. Discovery Agent    → Find venues, events, products      │
│  2. Booking Agent     → Reservations, appointments          │
│  3. Payment Agent     → Transactions, wallets               │
│  4. Notification Agent→ Alerts, reminders, updates          │
│  5. Loyalty Agent     → Karma, coins, rewards               │
│  6. Support Agent     → FAQ, troubleshooting               │
│  7. Feedback Agent   → Reviews, ratings                   │
│  8. Referral Agent    → Invites, sharing                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 What's Missing
| Capability | Current | Needed |
|------------|---------|--------|
| **Orchestration** | Agents work in isolation | Agents coordinate |
| **Natural Language** | API calls only | Conversational input |
| **Multi-step** | Single actions | Complex workflows |
| **Context** | Stateless | Persistent memory |
| **User Interface** | Backend only | Chat interface |

---

## 3. Orchestration Architecture

### 3.1 Three-Layer Design
```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                          │
│                     (ReZ Chat)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Intent     │  │  Workflow  │  │  Executor  │          │
│  │  Parser     │→ │  Planner    │→ │  Engine    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AGENT LAYER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Discovery │ Booking │ Payment │ Notification │ ...   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  Orders │ Wallet │ Payment │ Merchant │ Catalog │ etc.      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Responsibilities

#### Intent Parser
```typescript
// Routes user input to appropriate workflow
class IntentParser {
  parse(input: string, context: ConversationContext): ParsedIntent {
    // 1. Extract entities
    const entities = this.entityExtractor.extract(input);

    // 2. Classify intent
    const intent = this.classifier.classify(input, entities);

    // 3. Check for multi-intent
    const subIntents = this.splitter.splitIfMultiple(input);

    // 4. Resolve references ("that Italian place" → specific venue)
    const resolved = this.referenceResolver.resolve(subIntents, context);

    return {
      primary: intent,
      subIntents: resolved,
      entities,
      confidence: this.calculateConfidence(intent, entities),
    };
  }
}
```

#### Workflow Planner
```typescript
// Creates execution plans for complex intents
class WorkflowPlanner {
  plan(intent: ParsedIntent, context: UserContext): Workflow {
    const steps: WorkflowStep[] = [];

    // Step 1: Check prerequisites
    if (intent.requires('auth')) {
      steps.push({ type: 'AUTHENTICATE', agent: 'auth' });
    }

    // Step 2: Gather data
    if (intent.requires('venue')) {
      steps.push({ type: 'FETCH_VENUE', agent: 'discovery', params: intent.venue });
    }

    // Step 3: Calculate rewards
    if (intent.requires('rewards')) {
      steps.push({ type: 'CALCULATE_KARMA', agent: 'loyalty' });
    }

    // Step 4: Execute main action
    steps.push({
      type: intent.action,
      agent: intent.primaryAgent,
      params: intent.params,
      onSuccess: 'DISTRIBUTE_REWARDS',
      onFailure: 'HANDLE_ERROR',
    });

    // Step 5: Notify
    if (intent.shouldNotify()) {
      steps.push({ type: 'NOTIFY', agent: 'notification' });
    }

    return { steps, estimatedTime: this.estimate(steps) };
  }
}
```

#### Executor Engine
```typescript
// Runs workflows with error handling and rollback
class ExecutorEngine {
  async execute(workflow: Workflow, context: ExecutionContext): Promise<ExecutionResult> {
    const results: StepResult[] = [];
    const completedSteps: StepResult[] = [];

    for (const step of workflow.steps) {
      try {
        const result = await this.executeStep(step, context);

        // Check for rollback condition
        if (result.requiresRollback && completedSteps.length > 0) {
          await this.rollback(completedSteps);
          return { status: 'ROLLED_BACK', results, error: result.error };
        }

        results.push(result);
        completedSteps.push(result);

        // Store result for next steps
        context.setStepResult(step.id, result);

      } catch (error) {
        // Determine if we can continue or must stop
        if (step.critical) {
          await this.rollback(completedSteps);
          return { status: 'FAILED', results, error };
        }
        results.push({ status: 'SKIPPED', error });
      }
    }

    return { status: 'COMPLETED', results };
  }

  async rollback(steps: StepResult[]): Promise<void> {
    // Reverse completed steps
    for (const step of steps.reverse()) {
      if (step.rollback) {
        await step.rollback();
      }
    }
  }
}
```

---

## 4. Agent Specifications

### 4.1 Discovery Agent
```typescript
interface DiscoveryAgent {
  name: 'discovery';

  capabilities: [
    'search_venues',
    'search_trials',
    'search_events',
    'search_products',
    'get_recommendations',
    'compare_options',
  ];

  execute(intent: DiscoveryIntent, context: ExecutionContext): Promise<DiscoveryResult> {
    // 1. Build query from intent
    const query = this.buildQuery(intent);

    // 2. Apply user preferences from intent graph
    const personalizedQuery = this.personalize(query, context.user);

    // 3. Fetch from catalog
    const results = await this.catalog.search(personalizedQuery);

    // 4. Rank by relevance + karma + distance
    const ranked = await this.rank(results, context);

    // 5. Return top N with reasons
    return {
      items: ranked.slice(0, 10),
      total: ranked.length,
      suggestions: this.generateSuggestions(ranked),
    };
  }
}
```

### 4.2 Booking Agent
```typescript
interface BookingAgent {
  name: 'booking';

  capabilities: [
    'book_table',
    'book_trial',
    'book_event',
    'book_hotel',
    'schedule',
    'reserve',
  ];

  async execute(bookingIntent: BookingIntent, context: ExecutionContext): Promise<BookingResult> {
    const { venue, dateTime, partySize, preferences } = bookingIntent;

    // 1. Verify venue availability
    const availability = await this.checkAvailability(venue, dateTime, partySize);
    if (!availability.available) {
      return { status: 'UNAVAILABLE', alternatives: availability.alternatives };
    }

    // 2. Calculate karma discount
    const karmaDiscount = await this.loyaltyAgent.calculateDiscount(
      context.user.id,
      venue.id,
      availability.price
    );

    // 3. Create pending booking
    const booking = await this.orderService.createPending({
      type: 'booking',
      venue,
      dateTime,
      partySize,
      originalPrice: availability.price,
      karmaDiscount,
      finalPrice: availability.price - karmaDiscount.amount,
    });

    // 4. Confirm booking (may require payment)
    if (booking.finalPrice > 0) {
      const paymentResult = await this.paymentAgent.execute({
        amount: booking.finalPrice,
        userId: context.user.id,
        orderId: booking.id,
        paymentMethod: context.user.defaultPaymentMethod,
      });

      if (!paymentResult.success) {
        await this.orderService.cancel(booking.id);
        return { status: 'PAYMENT_FAILED', error: paymentResult.error };
      }
    }

    // 5. Confirm and notify
    const confirmedBooking = await this.orderService.confirm(booking.id);
    await this.notificationAgent.sendBookingConfirmation(confirmedBooking);

    // 6. Distribute karma + coins
    await this.loyaltyAgent.recordAction({
      userId: context.user.id,
      action: 'booking_completed',
      entityId: venue.id,
      karmaEarned: this.calculateKarmaEarned(venue, partySize),
    });

    return { status: 'CONFIRMED', booking: confirmedBooking };
  }
}
```

### 4.3 Payment Agent
```typescript
interface PaymentAgent {
  name: 'payment';

  capabilities: [
    'pay',
    'refund',
    'split_bill',
    'add_funds',
    'withdraw',
    'check_balance',
  ];

  async execute(paymentIntent: PaymentIntent, context: ExecutionContext): Promise<PaymentResult> {
    // 1. Validate balance
    const wallet = await this.walletService.getBalance(context.user.id);
    if (wallet.available < paymentIntent.amount) {
      return {
        status: 'INSUFFICIENT_FUNDS',
        available: wallet.available,
        required: paymentIntent.amount,
        suggestions: [
          { type: 'ADD_FUNDS', amount: paymentIntent.amount - wallet.available },
          { type: 'USE_KARMA', maxDiscount: await this.loyaltyAgent.getMaxDiscount(context.user.id) },
        ],
      };
    }

    // 2. Check for karma coins
    const karmaCoins = await this.loyaltyAgent.getKarmaCoins(context.user.id);
    const coinDiscount = Math.min(
      paymentIntent.karmaCoinsToUse || 0,
      karmaCoins,
      paymentIntent.amount * 0.2 // Max 20% from karma coins
    );

    // 3. Process payment
    const netAmount = paymentIntent.amount - coinDiscount;

    if (netAmount > 0) {
      const paymentResult = await this.paymentGateway.charge({
        amount: netAmount,
        method: paymentIntent.method,
        metadata: {
          userId: context.user.id,
          orderId: paymentIntent.orderId,
          coinDiscount,
        },
      });

      if (!paymentResult.success) {
        return { status: 'PAYMENT_FAILED', error: paymentResult.error };
      }
    }

    // 4. Deduct from wallet
    await this.walletService.debit(context.user.id, netAmount);

    // 5. Record transaction
    const transaction = await this.transactionService.record({
      userId: context.user.id,
      amount: paymentIntent.amount,
      coinDiscount,
      netAmount,
      status: 'COMPLETED',
    });

    return { status: 'SUCCESS', transaction };
  }
}
```

### 4.4 Loyalty Agent
```typescript
interface LoyaltyAgent {
  name: 'loyalty';

  capabilities: [
    'check_karma',
    'check_coins',
    'calculate_discount',
    'earn_karma',
    'earn_coins',
    'redeem_voucher',
    'check_tier',
  ];

  async calculateDiscount(userId: string, entityId: string, amount: number): Promise<KarmaDiscount> {
    const userKarma = await this.getKarmaProfile(userId);

    // Tier-based discount rates
    const tierDiscounts = {
      bronze: 0.05,
      silver: 0.10,
      gold: 0.15,
      platinum: 0.20,
    };

    const discountRate = tierDiscounts[userKarma.tier];
    const maxDiscount = amount * discountRate;

    // Check entity-specific bonuses
    const entityBonus = await this.getEntityBonus(entityId);
    const totalDiscount = Math.min(maxDiscount * (1 + entityBonus), amount * 0.3);

    return {
      amount: Math.round(totalDiscount),
      rate: discountRate,
      bonus: entityBonus,
      tier: userKarma.tier,
    };
  }

  async recordAction(action: LoyaltyAction): Promise<LoyaltyResult> {
    const { userId, action: actionType, entityId } = action;

    // Calculate karma earned
    const karmaEarned = this.calculateKarmaEarned(actionType, entityId);

    // Calculate coins earned
    const coinsEarned = this.calculateCoinsEarned(actionType, entityId);

    // Update user profile
    await this.karmaService.add(userId, karmaEarned);
    await this.coinService.add(userId, coinsEarned);

    // Check tier upgrade
    const newTier = await this.checkTierUpgrade(userId);

    return {
      karmaEarned,
      coinsEarned,
      newTier,
      tierProgress: await this.getTierProgress(userId),
    };
  }
}
```

---

## 5. Multi-Agent Workflows

### 5.1 "Book Dinner" Workflow
```typescript
const BOOK_DINNER_WORKFLOW: WorkflowTemplate = {
  id: 'book-dinner',
  name: 'Book Dinner',

  trigger: {
    intents: ['book_dinner', 'reserve_table', 'book_restaurant'],
    examples: [
      'Book a table for 2',
      'Reserve dinner at an Italian place',
      'Find a restaurant for tonight',
    ],
  },

  steps: [
    {
      id: 'discover',
      agent: 'discovery',
      action: 'search_venues',
      params: {
        type: 'restaurant',
        filters: { openNow: true },
      },
      output: 'venues',
    },

    {
      id: 'rank',
      agent: 'orchestration',
      action: 'rank_by_preference',
      input: 'venues',
      output: 'top_venues',
    },

    {
      id: 'select',
      agent: 'chat',
      action: 'present_options',
      input: 'top_venues',
      userInput: true, // User picks
      output: 'selected_venue',
    },

    {
      id: 'check_availability',
      agent: 'booking',
      action: 'check_availability',
      input: 'selected_venue',
      params: {
        dateTime: '{{user_specified}}',
        partySize: '{{user_specified}}',
      },
      output: 'availability',
    },

    {
      id: 'calculate_rewards',
      agent: 'loyalty',
      action: 'calculate_discount',
      params: {
        entityId: '{{selected_venue.id}}',
      },
      output: 'rewards',
    },

    {
      id: 'confirm',
      agent: 'booking',
      action: 'confirm_booking',
      params: {
        venue: '{{selected_venue}}',
        dateTime: '{{user_specified}}',
        partySize: '{{user_specified}}',
        karmaDiscount: '{{rewards.amount}}',
      },
      output: 'booking',
    },

    {
      id: 'distribute_rewards',
      agent: 'loyalty',
      action: 'record_booking',
      params: {
        userId: '{{user.id}}',
        entityId: '{{selected_venue.id}}',
        bookingId: '{{booking.id}}',
      },
    },

    {
      id: 'notify',
      agent: 'notification',
      action: 'send_confirmation',
      params: {
        booking: '{{booking}}',
        includeQR: true,
      },
    },
  ],
};
```

### 5.2 "Plan My Evening" Workflow (Superchat-style)
```typescript
const PLAN_EVENING_WORKFLOW: WorkflowTemplate = {
  id: 'plan-evening',
  name: 'Plan My Evening',

  trigger: {
    intents: ['plan_evening', 'what_should_i_do', 'im_bored'],
    examples: [
      'Plan my evening',
      "I'm bored tonight",
      'What should I do?',
    ],
  },

  steps: [
    {
      id: 'analyze_history',
      agent: 'discovery',
      action: 'get_user_preferences',
      output: 'preferences',
    },

    {
      id: 'check_context',
      agent: 'orchestration',
      action: 'get_current_context',
      output: 'context',
    },

    {
      id: 'find_options',
      agent: 'discovery',
      action: 'generate_evening_options',
      params: {
        preferences: '{{preferences}}',
        context: '{{context}}',
      },
      output: 'options',
    },

    {
      id: 'build_itinerary',
      agent: 'orchestration',
      action: 'combine_into_itinerary',
      input: 'options',
      output: 'itinerary',
    },

    {
      id: 'present',
      agent: 'chat',
      action: 'present_itinerary',
      input: 'itinerary',
      userInput: true,
      output: 'confirmed_items',
    },

    // For each confirmed item...
    parallel: true, // Book all in parallel
    forEach: '{{confirmed_items}}',
    steps: [
      {
        id: 'book_item',
        agent: 'booking',
        action: 'quick_book',
        params: {
          entity: '{{item}}',
          userId: '{{user.id}}',
        },
      },
      {
        id: 'add_karma',
        agent: 'loyalty',
        action: 'earn_for_action',
        params: {
          action: 'evening_plan_item',
          entity: '{{item}}',
        },
      },
    ],

    {
      id: 'finalize',
      agent: 'chat',
      action: 'show_complete_plan',
      output: {
        bookings: '{{all_bookings}}',
        totalKarma: '{{sum_karma}}',
        totalCoins: '{{sum_coins}}',
      },
    },
  ],
};
```

### 5.3 "Try Something New" Workflow (Trial Discovery)
```typescript
const TRIAL_DISCOVERY_WORKFLOW: WorkflowTemplate = {
  id: 'try-something-new',
  name: 'Try Something New',

  trigger: {
    intents: ['find_trial', 'try_something', 'new_experience'],
    examples: [
      'Show me trials',
      "Find me something to try",
      'New experiences nearby',
    ],
  },

  steps: [
    {
      id: 'get_unvisited',
      agent: 'discovery',
      action: 'find_trials_not_tried',
      params: {
        userId: '{{user.id}}',
        limit: 10,
      },
      output: 'available_trials',
    },

    {
      id: 'filter_by_balance',
      agent: 'loyalty',
      action: 'check_trial_affordability',
      input: 'available_trials',
      params: {
        userCoins: '{{user.coins}}',
      },
      output: 'affordable_trials',
    },

    {
      id: 'rank_by_affinity',
      agent: 'discovery',
      action: 'rank_by_taste_match',
      input: 'affordable_trials',
      params: {
        userPreferences: '{{user.preferences}}',
      },
      output: 'recommended_trials',
    },

    {
      id: 'present',
      agent: 'chat',
      action: 'show_trial_cards',
      input: 'recommended_trials',
      userInput: true,
      output: 'selected_trial',
    },

    {
      id: 'calculate_cost',
      agent: 'trial',
      action: 'get_trial_cost',
      params: {
        trialId: '{{selected_trial.id}}',
        karmaCoins: '{{user.karmaCoins}}',
      },
      output: 'cost_breakdown',
    },

    {
      id: 'book_trial',
      agent: 'trial',
      action: 'create_booking',
      params: {
        trial: '{{selected_trial}}',
        cost: '{{cost_breakdown}}',
      },
      output: 'booking',
    },

    {
      id: 'reward_explorer',
      agent: 'loyalty',
      action: 'record_trial_booking',
      params: {
        userId: '{{user.id}}',
        trialId: '{{selected_trial.id}}',
        explorerBonus: true, // Extra karma for trying new things
      },
    },
  ],
};
```

---

## 6. Error Handling & Fallbacks

### 6.1 Error Types & Responses
```typescript
const ERROR_RESPONSES: Record<string, ErrorResponseTemplate> = {
  VENUE_NOT_FOUND: {
    message: "I couldn't find a place matching that. Want me to search nearby?",
    actions: [
      { label: 'Search nearby', action: 'search_nearby' },
      { label: 'Try a different cuisine', action: 'refine_search' },
      { label: 'Show popular places', action: 'show_popular' },
    ],
  },

  BOOKING_UNAVAILABLE: {
    message: "That time is booked. Here's what's available:",
    actions: [
      { label: 'See alternatives', action: 'show_alternatives' },
      { label: 'Join waitlist', action: 'join_waitlist' },
      { label: 'Try nearby', action: 'show_nearby' },
    ],
  },

  PAYMENT_FAILED: {
    message: "Payment didn't go through. Try again?",
    actions: [
      { label: 'Try again', action: 'retry_payment' },
      { label: 'Use different method', action: 'change_payment_method' },
      { label: 'Use karma coins', action: 'apply_karma_coins' },
    ],
  },

  INSUFFICIENT_COINS: {
    message: "You need {required} coins but only have {available}.",
    actions: [
      { label: 'Buy more coins', action: 'buy_coins' },
      { label: 'Earn coins first', action: 'show_earn_options' },
      { label: 'Reduce trial scope', action: 'adjust_booking' },
    ],
  },
};
```

### 6.2 Graceful Degradation
```typescript
class GracefulDegradation {
  handleAgentFailure(agent: string, error: Error, workflow: Workflow): PartialWorkflowResult {
    // If optional agent fails, continue without it
    const step = workflow.steps.find(s => s.agent === agent);

    if (!step.critical) {
      return {
        status: 'PARTIAL',
        completedSteps: workflow.steps.slice(0, workflow.steps.indexOf(step)),
        skippedSteps: [step],
        message: `Skipped ${agent} step - continuing with rest of workflow`,
      };
    }

    // If critical agent fails, offer alternatives
    return {
      status: 'BLOCKED',
      blockedAt: step,
      alternatives: this.findAlternatives(step),
      message: `Couldn't complete that step. Here are alternatives:`,
    };
  }
}
```

---

## 7. Execution Monitoring

### 7.1 Telemetry Events
```typescript
const AGENT_TELEMETRY = {
  workflowStarted: {
    workflowId: string;
    intent: string;
    userId: string;
    timestamp: number;
  },

  stepStarted: {
    workflowId: string;
    stepId: string;
    agent: string;
    action: string;
  },

  stepCompleted: {
    workflowId: string;
    stepId: string;
    duration: number;
    result: StepResult;
  },

  stepFailed: {
    workflowId: string;
    stepId: string;
    error: Error;
    fallback: string;
  },

  workflowCompleted: {
    workflowId: string;
    totalDuration: number;
    stepsCompleted: number;
    rewardsEarned: {
      karma: number;
      coins: number;
    };
  },
};
```

### 7.2 Performance Metrics
```typescript
interface AgentMetrics {
  // Latency
  avgStepDuration: Record<string, number>;
  p99StepDuration: Record<string, number>;
  totalWorkflowDuration: number;

  // Reliability
  stepSuccessRate: Record<string, number>;
  workflowCompletionRate: number;
  rollbackRate: number;

  // Business
  karmaDistributed: number;
  coinsDistributed: number;
  conversionRate: number;
}
```

---

## 8. Security & Permissions

### 8.1 Action Permissions
```typescript
const ACTION_PERMISSIONS: Record<string, Permission[]> = {
  'pay': ['authenticated', 'verified_payment_method'],
  'book': ['authenticated'],
  'refer': ['authenticated', 'verified_phone'],
  'withdraw': ['authenticated', 'kyc_completed'],
};

// Permission check before execution
const checkPermissions = async (userId: string, action: string): Promise<boolean> => {
  const required = ACTION_PERMISSIONS[action];
  const userPermissions = await getUserPermissions(userId);

  return required.every(perm => userPermissions.includes(perm));
};
```

### 8.2 Rate Limiting
```typescript
const ACTION_RATE_LIMITS: Record<string, RateLimit> = {
  'book': { max: 10, window: 'hour' },
  'pay': { max: 50, window: 'hour' },
  'refer': { max: 5, window: 'day' },
  'search': { max: 100, window: 'minute' },
};
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation
- [ ] Unified Orchestration Layer
- [ ] Intent Parser connected to ReZ Mind
- [ ] Basic Chat Interface (from REZ-CHAT-INTERFACE-SPEC.md)

### Phase 2: Core Agents
- [ ] Discovery Agent with personalization
- [ ] Booking Agent with karma calculation
- [ ] Payment Agent with wallet integration

### Phase 3: Advanced Flows
- [ ] Multi-step workflow engine
- [ ] Error handling and fallbacks
- [ ] Real-time updates via WebSocket

### Phase 4: Optimization
- [ ] Agent performance optimization
- [ ] Predictive pre-fetching
- [ ] A/B testing for workflows

---

## 10. Integration Points

| Component | Integration | Protocol |
|-----------|-------------|----------|
| Chat Interface | Orchestration Layer | REST + WebSocket |
| ReZ Mind | Intent Graph | Internal API |
| Order Service | Booking Agent | gRPC |
| Wallet Service | Payment Agent | gRPC |
| Loyalty Service | Loyalty Agent | gRPC |
| Notification Service | All Agents | Event Bus |
