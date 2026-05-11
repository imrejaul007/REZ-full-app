# ReZ AI Execution Plan - Based on ReZ Mind

**Version:** 1.0
**Date:** May 9, 2026
**Mission:** Make AI modular, pluggable, and extendable to all verticals

---

## Executive Summary

ReZ Mind is our AI foundation. This plan extends it to all verticals using **modular AI services** that can be plugged into any service.

### Current ReZ Mind Capabilities

| Module | Status | What It Does |
|--------|--------|--------------|
| **Intent Graph** | ✅ Built | Captures user intent signals |
| **Dormant Intent** | ✅ Built | Detects inactive users |
| **Nudge Engine** | ✅ Built | Triggers re-engagement |
| **User Intelligence** | ✅ Built | User profiles, churn, LTV |
| **Personalization** | ✅ Built | Recommendations, collab filtering |
| **ML Engine** | ✅ Built | Prediction models |
| **8 Autonomous Agents** | ✅ Built | Demand, Scarcity, Attribution, etc. |

---

## Architecture: Modular AI Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    REZ AI LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ ReZ Mind   │  │ ReZ Voice  │  │ ReZ Vision │         │
│  │ (Existing) │  │ (New)      │  │ (New)      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │           AI PLUGINS (Modular)              │       │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ │       │
│  │  │Restaurant│ │ Salon │ │Fitness│ │ Hotel │ │       │
│  │  └───────┘ └───────┘ └───────┘ └───────┘ │       │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ │       │
│  │  │Events │ │Health │ │Retail │ │ Generic│ │       │
│  │  └───────┘ └───────┘ └───────┘ └───────┘ │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │           VERTICAL SERVICES                    │       │
│  │  POS | Kitchen | Orders | Payments | CRM | Marketing│   │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: ReZ Mind - What's Built

### 1.1 Intent Graph (`rez-intent-graph`)

**Location:** `/rez-intent-graph/src/`

| Service | Purpose |
|---------|---------|
| `IntentCaptureService` | Capture user actions (view, cart, search, purchase) |
| `IntentScoringService` | Calculate intent confidence (0-100) |
| `IntentCacheService` | Redis caching for performance |
| `IntentStreamService` | Real-time event streaming |

**Models:**
```typescript
Intent {
  userId, entityId, entityType,
  signal, confidence, lastSignal,
  affinities: Map<Category, Score>
}

CrossAppIntentProfile {
  userId, intents: {DINING, TRAVEL, RETAIL},
  combinedSignals, lastActive
}
```

### 1.2 Dormant Intent (`DormantIntentService`)

**Purpose:** Detect inactive users and trigger revival

```typescript
// Detect dormant users
await dormantIntentService.detectAndMarkDormant(userId, {
  thresholdDays: 30,
  categories: ['restaurant', 'salon', 'fitness']
});

// Trigger revival
await dormantIntentService.triggerRevival(userId, {
  triggerType: 'price_drop' | 'seasonality' | 'offer_match'
});
```

### 1.3 Nudge Engine (`NudgeService`)

**Purpose:** Send targeted messages to re-engage users

```typescript
await nudgeService.send({
  userId: 'user_123',
  channel: 'whatsapp' | 'push' | 'sms',
  template: 'revival_price_drop',
  data: { restaurant: 'Pizza Hut', discount: '20%' }
});
```

### 1.4 User Intelligence (`rez-intelligence-hub`)

**Location:** `/rez-intelligence-hub/src/services/userIntelligenceService.ts`

```typescript
// Get enriched user profile
const profile = await userIntelligenceService.getUserProfile(userId);

// Predict churn
const churn = await userIntelligenceService.predictChurn(userId);

// Calculate LTV
const ltv = await userIntelligenceService.calculateLTV(userId);
```

### 1.5 Personalization (`rez-personalization-engine`)

**Location:** `/rez-personalization-engine/`

| Algorithm | Purpose |
|-----------|---------|
| Collaborative Filtering | "Users like you also ordered..." |
| Content-Based | Based on user preferences |
| Contextual Bandits | A/B testing, exploration |
| Diversity Manager | Avoid filter bubbles |

### 1.6 8 Autonomous Agents

| Agent | Schedule | Purpose |
|-------|----------|---------|
| `DemandSignalAgent` | 5 min | Aggregate demand per merchant |
| `ScarcityAgent` | 1 min | Urgency alerts |
| `PersonalizationAgent` | Event | User profiling |
| `AttributionAgent` | Event | Multi-touch conversion |
| `AdaptiveScoringAgent` | Hourly | ML retraining |
| `FeedbackLoopAgent` | Event | Closed-loop optimization |
| `NetworkEffectAgent` | Daily | Collaborative filtering |
| `RevenueAttributionAgent` | 15 min | GMV tracking |

---

## Part 2: Modular AI Extensions

### Architecture: Plugin Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PLUGIN INTERFACE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  interface AIPlugin {                                       │
│    name: string;                                           │
│    version: string;                                        │
│                                                             │
│    // Lifecycle                                             │
│    init(config: AIConfig): Promise<void>;                  │
│    shutdown(): Promise<void>;                              │
│                                                             │
│    // Events (subscribe to event bus)                     │
│    events: string[];  // ['order.created', 'user.login']   │
│                                                             │
│    // APIs (expose to other services)                     │
│    api: {                                                  │
│      predict(input: any): Promise<Prediction>;            │
│      recommend(userId: string, context: any): Promise<Recommendation[]>; │
│    };                                                      │
│                                                             │
│    // ML models this plugin provides                       │
│    models: string[];  // ['churn-model', 'ltv-model']    │
│  }                                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Registry

```typescript
// /rez-ai-plugins/src/registry.ts
class AIPluginRegistry {
  private plugins: Map<string, AIPlugin> = new Map();

  async register(plugin: AIPlugin): Promise<void> {
    // Initialize plugin
    await plugin.init(this.config);
    
    // Subscribe to events
    for (const event of plugin.events) {
      this.eventBus.subscribe(event, plugin.handleEvent.bind(plugin));
    }
    
    // Register API routes
    this.router.use(`/ai/${plugin.name}`, plugin.api);
    
    this.plugins.set(plugin.name, plugin);
  }

  async getPlugin(name: string): Promise<AIPlugin | null> {
    return this.plugins.get(name) || null;
  }

  async getPredictions(plugin: string, model: string, input: any) {
    const p = await this.getPlugin(plugin);
    return p?.api.predict({ model, input });
  }
}

export const registry = new AIPluginRegistry();
```

---

## Part 3: AI Extensions for Each Vertical

### 3.1 Restaurant AI Plugin

**Location:** `/rez-ai-restaurant/`

```typescript
// Plugin manifest
export const restaurantAI: AIPlugin = {
  name: 'restaurant',
  version: '1.0.0',
  events: [
    'order.created',
    'order.completed',
    'menu.viewed',
    'item.added_to_cart',
    'order.cancelled'
  ],
  models: [
    'demand-forecast',
    'prep-time-prediction',
    'menu-popularity',
    'optimal-pricing'
  ],
  api: {
    // Predict demand for a time slot
    predict: async (input) => {
      return demandForecast.predict(input);
    },
    // Get menu recommendations
    recommend: async (userId, context) => {
      return menuRecommendation.getRecommendations(userId, context);
    }
  }
};
```

### Services to Add

| Service | Purpose | Uses ReZ Mind |
|---------|---------|---------------|
| `DemandForecastService` | Predict orders per hour | Intent Graph |
| `PrepTimeService` | Predict kitchen prep time | ML Engine |
| `MenuOptimizerService` | Suggest profitable items | User Intelligence |
| `VoiceOrderingService` | Voice menu ordering | Nudge Engine |
| `SmartInventoryService` | Auto-reorder ingredients | Demand Signals |
| `DynamicPricingService` | Surge/happy hour pricing | Personalization |

### API Example

```typescript
// POST /ai/restaurant/demand-forecast
{
  "storeId": "store_123",
  "date": "2026-05-15",
  "timeSlots": ["12:00", "12:30", "13:00"],
  "context": {
    "weather": "sunny",
    "isHoliday": false,
    "hasEvent": false
  }
}

// Response
{
  "predictions": [
    { "time": "12:00", "predictedOrders": 45, "confidence": 0.92 },
    { "time": "12:30", "predictedOrders": 52, "confidence": 0.89 },
    { "time": "13:00", "predictedOrders": 38, "confidence": 0.85 }
  ],
  "staffRecommendation": 5,
  "inventoryAlerts": ["tomato: order 10kg", "cheese: order 5kg"]
}
```

### Code Structure

```
rez-ai-restaurant/
├── src/
│   ├── index.ts                    # Plugin manifest
│   ├── services/
│   │   ├── demandForecast.ts       # Demand prediction
│   │   ├── prepTimePrediction.ts   # Kitchen timing
│   │   ├── menuOptimizer.ts        # Menu engineering
│   │   ├── voiceOrdering.ts        # Voice commands
│   │   ├── smartInventory.ts       # Auto-reorder
│   │   └── dynamicPricing.ts       # Price optimization
│   ├── models/
│   │   ├── demandModel.ts         # Demand ML model
│   │   ├── prepTimeModel.ts       # Prep time model
│   │   └── menuModel.ts           # Menu optimization
│   ├── handlers/
│   │   ├── orderHandlers.ts       # Event handlers
│   │   └── menuHandlers.ts        # Menu events
│   └── api/
│       ├── forecast.ts             # Forecast endpoints
│       ├── optimize.ts             # Optimization endpoints
│       └── voice.ts                # Voice ordering
├── tests/
└── package.json
```

---

### 3.2 Salon AI Plugin

**Location:** `/rez-ai-salon/`

```typescript
export const salonAI: AIPlugin = {
  name: 'salon',
  version: '1.0.0',
  events: [
    'appointment.booked',
    'appointment.completed',
    'service.viewed',
    'stylist.rated'
  ],
  models: [
    'appointment-forecast',
    'stylist-recommendation',
    'service-trending'
  ],
  api: {
    predict: async (input) => {
      return salonForecast.predict(input);
    },
    recommend: async (userId, context) => {
      return stylistRecommendation.getRecommendations(userId, context);
    }
  }
};
```

### Services to Add

| Service | Purpose | Uses ReZ Mind |
|---------|---------|---------------|
| `AppointmentForecastService` | Predict bookings | Intent Graph |
| `StylistMatcherService` | Match client to stylist | Personalization |
| `ServiceTrendService` | Trending services | User Intelligence |
| `NoShowPredictor` | Predict no-shows | ML Engine |
| `PricingOptimizerService` | Optimal service pricing | Analytics |

---

### 3.3 Fitness AI Plugin

**Location:** `/rez-ai-fitness/`

```typescript
export const fitnessAI: AIPlugin = {
  name: 'fitness',
  version: '1.0.0',
  events: [
    'class.booked',
    'membership.renewed',
    'attendance.checked_in',
    'goal.achieved'
  ],
  models: [
    'class-forecast',
    'churn-prediction',
    'engagement-score'
  ],
  api: {
    predict: async (input) => {
      return fitnessForecast.predict(input);
    },
    recommend: async (userId, context) => {
      return classRecommendation.getRecommendations(userId, context);
    }
  }
};
```

### Services to Add

| Service | Purpose | Uses ReZ Mind |
|---------|---------|---------------|
| `ClassForecastService` | Predict class enrollment | Demand Signals |
| `ChurnPredictorService` | Predict member churn | User Intelligence |
| `EngagementScoringService` | Member engagement score | Dormant Intent |
| `NutritionRecommendationService` | Personalized meal plans | Personalization |
| `ProgressTrackingService` | Goal progress AI | Feedback Loop Agent |

---

### 3.4 Hotel AI Plugin

**Location:** `/rez-ai-hotel/`

```typescript
export const hotelAI: AIPlugin = {
  name: 'hotel',
  version: '1.0.0',
  events: [
    'booking.created',
    'booking.checked_in',
    'booking.checked_out',
    'room.service.ordered'
  ],
  models: [
    'occupancy-forecast',
    'upsell-prediction',
    'review-sentiment'
  ],
  api: {
    predict: async (input) => {
      return hotelForecast.predict(input);
    },
    recommend: async (userId, context) => {
      return upsellRecommendation.getRecommendations(userId, context);
    }
  }
};
```

### Services to Add

| Service | Purpose | Uses ReZ Mind |
|---------|---------|---------------|
| `OccupancyForecastService` | Predict occupancy | Demand Signals |
| `UpsellPredictorService` | Predict upsell opportunities | ML Engine |
| `ReviewSentimentService` | Analyze reviews | User Intelligence |
| `DynamicPricingService` | Room rate optimization | Personalization |
| `HousekeepingOptimizerService` | Optimize cleaning schedule | Demand Forecast |

---

### 3.5 Events AI Plugin

**Location:** `/rez-ai-events/`

```typescript
export const eventsAI: AIPlugin = {
  name: 'events',
  version: '1.0.0',
  events: [
    'event.ticket_purchased',
    'event.checkin',
    'event.rated'
  ],
  models: [
    'ticket-forecast',
    'attendance-prediction',
    'pricing-optimization'
  ],
  api: {
    predict: async (input) => {
      return ticketForecast.predict(input);
    },
    recommend: async (userId, context) => {
      return eventRecommendation.getRecommendations(userId, context);
    }
  }
};
```

### Services to Add

| Service | Purpose | Uses ReZ Mind |
|---------|---------|---------------|
| `TicketForecastService` | Predict ticket sales | Demand Signals |
| `AttendancePredictorService` | Predict no-shows | ML Engine |
| `DynamicPricingService` | Event pricing | Personalization |
| `SeatRecommendationService` | Best seat suggestions | Personalization |
| `MarketingTargetingService` | Find event audiences | Intent Graph |

---

### 3.6 Healthcare AI Plugin

**Location:** `/rez-ai-healthcare/`

```typescript
export const healthcareAI: AIPlugin = {
  name: 'healthcare',
  version: '1.0.0',
  events: [
    'appointment.scheduled',
    'appointment.completed',
    'prescription.issued',
    'lab.ordered'
  ],
  models: [
    'appointment-forecast',
    'no-show-prediction',
    'diagnosis-suggestion'
  ],
  api: {
    predict: async (input) => {
      return healthcareForecast.predict(input);
    },
    recommend: async (userId, context) => {
      return healthcareRecommendation.getRecommendations(userId, context);
    }
  }
};
```

### Services to Add

| Service | Purpose | Uses ReZ Mind |
|---------|---------|---------------|
| `AppointmentForecastService` | Predict patient flow | Demand Signals |
| `NoShowPredictorService` | Predict no-shows | ML Engine |
| `DiagnosisHelperService` | Suggest diagnoses | Medical AI |
| `MedicationReminderService` | Patient reminders | Nudge Engine |
| `FollowupSchedulerService` | Auto-schedule followups | User Intelligence |

---

## Part 4: Cross-Service AI Services

### 4.1 Voice AI Service (`rez-voice`)

**Purpose:** Universal voice ordering for all verticals

```typescript
// Unified voice service
class VoiceAIService {
  async processVoiceCommand(
    audio: Buffer,
    context: VoiceContext
  ): Promise<VoiceResponse> {
    
    // 1. Speech to text
    const text = await this.stt.transcribe(audio);
    
    // 2. Intent parsing (using ReZ Mind)
    const intent = await this.intentParser.parse(text, {
      vertical: context.vertical, // restaurant, salon, etc.
      userId: context.userId
    });
    
    // 3. Entity extraction
    const entities = await this.entityExtractor.extract(intent, {
      vertical: context.vertical
    });
    
    // 4. Action mapping
    const action = await this.actionMapper.map(intent, entities);
    
    // 5. Execute action
    const result = await this.executeAction(action);
    
    // 6. Text to speech
    const response = await this.tts.synthesize(result.message);
    
    return { audio: response, action: result };
  }
}
```

### Vertical Voice Commands

```typescript
// Restaurant
"Order biryani for delivery"
"I want to book a table for 4 at 7pm"
"Add extra cheese to my order"

// Salon
"Book a haircut with Rajesh"
"I want a message at 3pm"
"Show my upcoming appointments"

// Fitness
"Book a yoga class tomorrow"
"Add more protein to my diet plan"
"When is my next training session"

// Hotel
"Book a room for tonight"
"Upgrade my room"
"Order room service"
```

### Code Structure

```
rez-voice/
├── src/
│   ├── index.ts                    # Plugin manifest
│   ├── services/
│   │   ├── SpeechToText.ts        # STT service
│   │   ├── TextToSpeech.ts        # TTS service
│   │   ├── IntentParser.ts        # NLU using ReZ Mind
│   │   ├── EntityExtractor.ts     # Entity recognition
│   │   ├── ActionMapper.ts        # Command routing
│   │   └── VoiceResponseBuilder.ts # Response generation
│   ├── verticals/
│   │   ├── restaurant.ts          # Restaurant intents
│   │   ├── salon.ts              # Salon intents
│   │   ├── fitness.ts            # Fitness intents
│   │   ├── hotel.ts             # Hotel intents
│   │   └── events.ts             # Event intents
│   ├── handlers/
│   │   ├── voiceOrder.ts         # Voice ordering
│   │   ├── voiceBooking.ts        # Voice booking
│   │   └── voiceSearch.ts         # Voice search
│   └── api/
│       ├── process.ts             # Main voice endpoint
│       └── webhooks.ts           # Phone integration
├── integrations/
│   ├── twilio.ts                # Twilio Voice
│   ├── daily.co.ts              # Daily.co
│   └── voip.ts                 # VoIP providers
└── package.json
```

---

### 4.2 Vision AI Service (`rez-vision`)

**Purpose:** Computer vision for quality control and analytics

```typescript
class VisionAIService {
  // Food quality inspection
  async inspectFood(image: Buffer): Promise<QualityReport> {
    return this.model.predict(image, {
      task: 'food_quality',
      classes: ['fresh', 'stale', 'contaminated']
    });
  }
  
  // Customer counting
  async countPeople(image: Buffer): Promise<CountReport> {
    return this.model.predict(image, {
      task: 'object_detection',
      classes: ['person']
    });
  }
  
  // Menu item recognition
  async recognizeDish(image: Buffer): Promise<DishRecognition> {
    return this.model.predict(image, {
      task: 'dish_recognition',
      database: 'restaurant_menu'
    });
  }
}
```

### Use Cases

| Use Case | Vertical | Purpose |
|----------|----------|---------|
| Food Quality | Restaurant | Inspect ingredients |
| Queue Counting | All | Optimize staffing |
| Dish Recognition | Restaurant | Auto-categorize photos |
| Receipt Scanning | All | Auto-extract data |
| Face Detection | Hotel | Guest recognition |
| Table Occupancy | Restaurant | Track seating |

---

### 4.3 Recommendation Engine (`rez-recommendations`)

**Purpose:** Universal recommendations for all verticals

```typescript
interface UnifiedRecommendation {
  userId: string;
  vertical: 'restaurant' | 'salon' | 'fitness' | 'hotel' | 'events' | 'healthcare';
  recommendations: Recommendation[];
  context: {
    time: Date;
    location?: GeoPoint;
    weather?: WeatherCondition;
    recentActions: Action[];
  };
}

// Unified recommendation endpoint
POST /ai/recommendations
{
  "userId": "user_123",
  "vertical": "restaurant",
  "context": {
    "time": "2026-05-15T12:30:00Z",
    "location": { "lat": 28.6139, "lng": 77.2090 }
  }
}
```

---

## Part 5: Execution Timeline

### Phase 1: Foundation (Month 1)

| Task | Owner | Status |
|------|-------|--------|
| AI Plugin Registry | ReZ Core | 📋 To Do |
| ReZ Voice Service | ReZ AI | 📋 To Do |
| Restaurant AI Plugin | ReZ Restaurant | 📋 To Do |
| Integrate with ReZ Mind | All | 📋 To Do |

### Phase 2: Vertical Plugins (Month 2)

| Task | Owner | Status |
|------|-------|--------|
| Salon AI Plugin | ReZ Salon | 📋 To Do |
| Fitness AI Plugin | ReZ Fitness | 📋 To Do |
| Hotel AI Plugin | ReZ Hotel | 📋 To Do |
| Events AI Plugin | ReZ Events | 📋 To Do |
| Healthcare AI Plugin | ReZ Healthcare | 📋 To Do |

### Phase 3: Advanced AI (Month 3)

| Task | Owner | Status |
|------|-------|--------|
| ReZ Vision Service | ReZ AI | 📋 To Do |
| Voice AI for all verticals | ReZ Voice | 📋 To Do |
| Unified Recommendations | ReZ AI | 📋 To Do |
| A/B Testing Framework | ReZ AI | 📋 To Do |

---

## Part 6: API Contracts

### Universal AI Endpoints

```typescript
// All AI plugins expose these endpoints

// 1. Predictions
GET  /ai/:vertical/predict/:model
POST /ai/:vertical/predict

// 2. Recommendations
GET  /ai/:vertical/recommend
POST /ai/:vertical/recommend/batch

// 3. Insights
GET  /ai/:vertical/insights/:userId
GET  /ai/:vertical/insights/store/:storeId

// 4. Forecasts
GET  /ai/:vertical/forecast
POST /ai/:vertical/forecast

// 5. Voice
POST /ai/voice/process
POST /ai/voice/stream

// 6. Vision
POST /ai/vision/analyze
POST /ai/vision/batch
```

### Response Format

```typescript
// All AI responses follow this format
interface AIResponse<T> {
  success: boolean;
  data: T;
  meta: {
    model: string;
    version: string;
    confidence: number;
    latency: number;
    cached: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## Part 7: Integration with Existing Services

### With ReZ Mind

```typescript
// Every plugin uses ReZ Mind services
import { 
  IntentCaptureService,
  DormantIntentService,
  UserIntelligenceService 
} from '@rez/mind-client';

// In Restaurant AI Plugin
class RestaurantAI {
  constructor(
    private intentCapture: IntentCaptureService,
    private dormantIntent: DormantIntentService,
    private userIntelligence: UserIntelligenceService
  ) {}

  async onOrderCreated(order: Order) {
    // Capture intent
    await this.intentCapture.capture({
      userId: order.userId,
      entityId: order.storeId,
      signal: 'order_placed',
      metadata: { amount: order.total }
    });
    
    // Update user intelligence
    await this.userIntelligence.updateProfile(order.userId, {
      lastOrder: order.createdAt,
      totalOrders: { $inc: 1 }
    });
    
    // Check if this triggers dormancy revival
    await this.dormantIntent.markActive(order.userId);
  }
}
```

---

## Part 8: Testing Strategy

### Unit Tests

```typescript
// test/restaurant/demandForecast.test.ts
describe('DemandForecastService', () => {
  it('should predict demand with 85%+ accuracy', async () => {
    const forecast = await service.predict({
      storeId: 'store_123',
      date: '2026-05-15',
      timeSlots: ['12:00', '12:30', '13:00']
    });
    
    expect(forecast.confidence).toBeGreaterThan(0.85);
  });
});
```

### Integration Tests

```typescript
// test/integration/voiceOrdering.test.ts
describe('Voice Ordering E2E', () => {
  it('should process voice order end-to-end', async () => {
    const audio = await loadTestAudio('order_biryani.wav');
    
    const response = await voiceService.process({
      audio,
      context: { vertical: 'restaurant', userId: 'user_123' }
    });
    
    expect(response.action.type).toBe('CREATE_ORDER');
    expect(response.action.items).toContain('biryani');
  });
});
```

---

## Part 9: Monitoring & Observability

### AI Metrics

```typescript
// All AI services expose these metrics
const metrics = {
  // Prediction quality
  predictionAccuracy: Gauge,
  predictionConfidence: Histogram,
  
  // Latency
  predictionLatency: Histogram,
  recommendationLatency: Histogram,
  
  // Business impact
  aiConversionLift: Counter,
  aiRevenue: Counter,
  
  // Errors
  modelErrors: Counter,
  fallbackHits: Counter
};
```

### Dashboards

| Dashboard | Metrics |
|----------|---------|
| Model Performance | Accuracy, Confidence, Drift |
| Business Impact | Conversion, Revenue, Engagement |
| System Health | Latency, Errors, Availability |
| User Feedback | Ratings, Corrections |

---

## Summary: Modular AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HOW IT ALL FITS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────┐     │
│  │                 REZ MIND (Core)                 │     │
│  │  Intent Graph │ Dormant │ Nudge │ User Profile   │     │
│  └─────────────────────────────────────────────────┘     │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────┐     │
│  │              AI PLUGIN REGISTRY                 │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │     │
│  │  │Restaurant│ │  Salon  │ │ Fitness │         │     │
│  │  └─────────┘ └─────────┘ └─────────┘         │     │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │     │
│  │  │  Hotel  │ │ Events  │ │Healthcar│         │     │
│  │  └─────────┘ └─────────┘ └─────────┘         │     │
│  └─────────────────────────────────────────────────┘     │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────┐     │
│  │           CROSS-CUTTING AI SERVICES              │     │
│  │  Voice AI │ Vision AI │ Recommendations │ Chat  │     │
│  └─────────────────────────────────────────────────┘     │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────┐     │
│  │              VERTICAL SERVICES                  │     │
│  │  POS │ Kitchen │ Orders │ CRM │ Marketing        │     │
│  └─────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

```bash
# Start ReZ Mind
cd rez-intent-graph && npm start

# Start Restaurant AI Plugin
cd rez-ai-restaurant && npm start

# Start Voice Service
cd rez-voice && npm start

# Register all plugins
curl -X POST http://localhost:3000/ai/plugins/register/all

# Test voice ordering
curl -X POST http://localhost:3000/ai/voice/process \
  -F "audio=@test.wav" \
  -F "vertical=restaurant"
```

---

*Document Version: 1.0*
*Last Updated: May 9, 2026*
