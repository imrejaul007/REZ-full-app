# REZ MIND - COMPLETE SYSTEM OVERVIEW

**Date:** 2026-05-02
**Status:** ACTIVE

---

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                         REZ MIND - COMPLETE SYSTEM                              ║
║                                                                                   ║
║                    AI-Powered Business Intelligence                             ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 WHAT IS REZ MIND?

**REZ MIND** is an AI-powered business intelligence system that:
- Understands customer intent from natural language
- Automates responses across all merchant types
- Learns from interactions to improve over time
- Connects all services in the REZ ecosystem
- Provides real-time insights to merchants

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ MIND CORE                                    │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │ REZ-SUPPORT-   │    │ REZ-MERCHANT-   │    │ REZ-USER-       │        │
│  │ COPILOT         │    │ COPILOT         │    │ INTELLIGENCE    │        │
│  │                 │    │                 │    │                 │        │
│  │ Customer AI     │    │ Business AI     │    │ Profile AI      │        │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘        │
│           │                      │                      │                  │
│           └──────────────────────┼──────────────────────┘                  │
│                                  │                                           │
│                    ┌─────────────┴─────────────┐                           │
│                    │   REZ-EVENT-PLATFORM    │                           │
│                    │   (Central Event Bus)    │                           │
│                    └─────────────┬─────────────┘                           │
│                                  │                                           │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────────────┐
│                         REZ ECOSYSTEM                                     │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ REZ NOW  │  │ HOTEL   │  │ CONSUMER │  │ MERCHANT │  │ ADMIN    │    │
│  │ (QR/Chat)│  │ OTA     │  │ APP      │  │ APP      │  │ PANEL    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ SEARCH   │  │ ORDER    │  │ WALLET   │  │ PAYMENT  │                   │
│  │ SERVICE  │  │ SERVICE  │  │ SERVICE  │  │ SERVICE  │                   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 REZ MIND SERVICES

### 1. REZ-SUPPORT-COPILOT (Customer AI)

**Purpose:** AI-powered customer support for all merchants

**Location:** `REZ-support-copilot/`

**What it does:**
```
Customer: "I want to order pizza for delivery"
         ↓
┌─────────────────────────────────────────────────────────────┐
│                 REZ-SUPPORT-COPILOT                         │
│                                                             │
│  1. INTENT DETECTION                                        │
│     └── Detects: ORDER, BOOK, SEARCH, COMPLAIN, GREET       │
│                                                             │
│  2. ENTITY EXTRACTION                                       │
│     └── Items: "pizza"                                      │
│     └── Location: extracted from context                    │
│     └── Preferences: from user profile                      │
│                                                             │
│  3. KNOWLEDGE LOOKUP                                        │
│     └── Restaurant menu from knowledge base                  │
│     └── Policies (delivery, offers)                         │
│     └── FAQs for common questions                           │
│                                                             │
│  4. RESPONSE GENERATION                                     │
│     └── Natural language response                           │
│     └── Action buttons (Order, View Menu)                   │
│                                                             │
│  5. ACTION EXECUTION                                        │
│     └── Create order via Order Service                      │
│     └── Log event to Event Platform                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Endpoints:**
```
POST /api/chat              - Main chat endpoint
POST /api/intent/detect     - Detect intent from text
GET  /api/merchant/:id      - Get merchant info
GET  /api/user/:id          - Get user profile
POST /api/order             - Create order
POST /webhooks/order/created - Order webhook
POST /webhooks/order/status  - Status webhook
```

**AI APIs Used:**
- Intent detection via pattern matching + keyword analysis
- Knowledge base matching for FAQ suggestions
- Integration with REZ-intent-predictor for complex cases

---

### 2. REZ-MERCHANT-COPILOT (Business AI)

**Purpose:** AI assistant for merchants to understand their business

**Location:** `REZ-merchant-copilot/`

**What it does:**
```
┌─────────────────────────────────────────────────────────────┐
│              REZ-MERCHANT-COPILOT                           │
│                                                             │
│  LIVE DATA INSIGHTS:                                        │
│  ├── Today's orders, revenue, trends                       │
│  ├── Customer behavior patterns                             │
│  ├── Peak hours analysis                                   │
│  └── Inventory alerts                                      │
│                                                             │
│  AI RECOMMENDATIONS:                                        │
│  ├── "Add a lunch combo to boost 2PM sales"               │
│  ├── "You have 15 pending reviews - respond now"          │
│  ├── "Consider extending evening hours on Friday"         │
│  └── "5 items low on stock"                               │
│                                                             │
│  COMPETITIVE INTELLIGENCE:                                  │
│  ├── Nearby competitors pricing                             │
│  ├── Market trends                                         │
│  └── Customer sentiment analysis                            │
│                                                             │
│  ALERTS:                                                   │
│  ├── Health score drops                                    │
│  ├── Unusual activity                                     │
│  └── Action items from support tickets                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time dashboard data
- AI-generated insights and recommendations
- Action tracking and follow-ups
- Competitor benchmarking
- Customer feedback analysis

**AI APIs Used:**
- Pattern analysis for trends
- Sentiment analysis for reviews
- Anomaly detection for alerts

---

### 3. REZ-USER-INTELLIGENCE (User Profile AI)

**Purpose:** Build and maintain user profiles for personalization

**Location:** `REZ-user-intelligence-service/`

**What it does:**
```
┌─────────────────────────────────────────────────────────────┐
│            REZ-USER-INTELLIGENCE                           │
│                                                             │
│  USER PROFILE:                                              │
│  ├── Preferences (spicy, vegetarian, allergies)            │
│  ├── Order history                                          │
│  ├── Favorite merchants                                     │
│  ├── Dietary restrictions                                  │
│  └── Preferred payment methods                              │
│                                                             │
│  BEHAVIOR PATTERNS:                                         │
│  ├── Order frequency                                       │
│  ├── Average order value                                   │
│  ├── Peak ordering times                                   │
│  └── Preferred cuisine types                               │
│                                                             │
│  PREDICTIONS:                                               │
│  ├── Churn risk                                           │
│  ├── Upsell opportunities                                  │
│  ├── Preferred communication times                         │
│  └── Birthday/anniversary alerts                           │
│                                                             │
│  SEGMENTATION:                                              │
│  ├── Regular customers                                     │
│  ├── Occasional visitors                                   │
│  ├── High-value VIPs                                       │
│  └── At-risk customers                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. REZ-INTENT-PREDICTOR

**Purpose:** Predict user intent for better response routing

**What it does:**
```
Input: "I need food for 10 people at 7pm"
         ↓
┌─────────────────────────────────────────────────────────────┐
│           REZ-INTENT-PREDICTOR                             │
│                                                             │
│  PREDICTED INTENTS (with confidence):                       │
│  ├── ORDER_CATERING: 85%                                   │
│  ├── RESERVATION: 72%                                      │
│  ├── ENQUIRE_VENUE: 45%                                    │
│                                                             │
│  EXTRACTED ENTITIES:                                        │
│  ├── Party size: 10                                        │
│  ├── Time: 7pm (19:00)                                     │
│  ├── Date: Today                                           │
│  └── Type: Food/Catering                                   │
│                                                             │
│  SUGGESTED ACTION:                                          │
│  └── Connect to restaurant with catering + 10+ capacity    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. REZ-EVENT-PLATFORM (Central Event Bus)

**Purpose:** Event-driven communication between all services

**What it logs:**
```
┌─────────────────────────────────────────────────────────────┐
│             REZ-EVENT-PLATFORM                            │
│                                                             │
│  EVENT TYPES:                                               │
│  ├── chat.message                                          │
│  ├── intent.detected                                       │
│  ├── order.created                                         │
│  ├── order.status_changed                                  │
│  ├── search.query                                          │
│  ├── merchant.insight_generated                            │
│  ├── merchant.health_score_changed                          │
│  ├── user.profile_updated                                  │
│  ├── recommendation.shown                                  │
│  └── support.ticket_created                                │
│                                                             │
│  CONSUMERS:                                                 │
│  ├── Analytics Dashboard                                   │
│  ├── Merchant Copilot                                      │
│  ├── User Intelligence                                     │
│  └── Marketing Service                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. REZ-ACTION-ENGINE

**Purpose:** Execute automated actions based on rules

**What it does:**
```
When: order.delivered + customer.no_review_24h
Then: Send review request

When: inventory.item_low + merchant.health_below_50
Then: Alert merchant + suggest reorder

When: customer.birthday + merchant.has_birthday_offer
Then: Send personalized offer
```

---

### 7. REZ-FEEDBACK-SERVICE

**Purpose:** Collect and analyze feedback

**What it does:**
```
- Post-order feedback collection
- Sentiment analysis
- Response generation
- Trend identification
- Root cause analysis for complaints
```

---

### 8. REZ-AD-COPILOT

**Purpose:** AI-powered advertising

**What it does:**
```
- Campaign optimization
- Audience targeting
- Ad copy generation
- Budget allocation
- Performance prediction
```

---

## 🔗 SERVICE CONNECTIONS

### How Services Talk to Each Other

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE CONNECTIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REZ-SUPPORT-COPILOT connects to:                                          │
│  ├── REZ-user-intelligence    → Get user preferences                       │
│  ├── REZ-event-platform       → Log all events                            │
│  ├── REZ-intent-predictor     → Get intent predictions                    │
│  ├── REZ-action-engine        → Execute actions                           │
│  ├── rez-knowledge-base       → Get merchant info, menus, policies         │
│  ├── rez-order-service        → Create/tracking orders                    │
│  └── REZ-merchant-copilot     → Forward support feedback                  │
│                                                                             │
│  REZ-MERCHANT-COPILOT connects to:                                         │
│  ├── REZ-event-platform       → Get all business events                   │
│  ├── REZ-user-intelligence    → Get customer insights                     │
│  ├── rez-order-service        → Get order data                           │
│  ├── rez-search-service        → Get search trends                        │
│  └── REZ-support-copilot      → Get support tickets                       │
│                                                                             │
│  REZ-USER-INTELLIGENCE connects to:                                        │
│  ├── REZ-event-platform       → Listen to all user events                │
│  ├── rez-order-service        → Get order history                        │
│  └── REZ-support-copilot     → Get conversation history                  │
│                                                                             │
│  REZ-EVENT-PLATFORM connects to:                                           │
│  ├── ALL SERVICES          → Central event bus                            │
│  └── Analytics Dashboard   → Reporting                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW EXAMPLES

### Example 1: Customer Orders Food

```
1. Customer chats: "Order biryani from Paradise"
         ↓
2. REZ-SUPPORT-COPILOT receives message
         ↓
3. Intent detected: ORDER_FOOD
         ↓
4. REZ-user-intelligence: Get customer preferences
         ↓
5. REZ-knowledge-base: Get Paradise menu + policies
         ↓
6. REZ-SUPPORT-COPILOT: Confirm order details
         ↓
7. Customer confirms
         ↓
8. REZ-order-service: Create order
         ↓
9. REZ-EVENT-PLATFORM: Log order.created event
         ↓
10. REZ-MERCHANT-COPILOT: Notify merchant dashboard
         ↓
11. Customer gets real-time updates
```

### Example 2: Merchant Gets AI Insight

```
1. REZ-EVENT-PLATFORM receives order.completed events
         ↓
2. REZ-USER-INTELLIGENCE: Analyze customer behavior
         ↓
3. Pattern detected: 60% customers order dessert but you don't offer one
         ↓
4. REZ-MERCHANT-COPILOT: Generate insight
         ↓
5. Dashboard shows: "Consider adding desserts - 60% want it!"
         ↓
6. Merchant acts on insight
```

### Example 3: Predictive Churn Prevention

```
1. REZ-USER-INTELLIGENCE: Analyze order patterns
         ↓
2. Detection: Customer orders weekly for 6 months, now none for 3 weeks
         ↓
3. Churn risk: HIGH
         ↓
4. REZ-EVENT-PLATFORM: Emit user.churn_risk event
         ↓
5. REZ-SUPPORT-COPILOT: Send personalized re-engagement
         ↓
6. "We miss you! Here's 20% off your next order 🍕"
```

---

## 🧠 HOW THE AI LEARNS

### Learning Mechanisms

```
┌─────────────────────────────────────────────────────────────┐
│                      LEARNING METHODS                       │
├─────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EVENT LOGGING (Continuous)                                              │
│     ├── All interactions logged to REZ-EVENT-PLATFORM                        │
│     ├── Used for pattern detection                                           │
│     └── Improves recommendations over time                                    │
│                                                                             │
│  2. FEEDBACK LOOPS                                                          │
│     ├── Customer responses to AI suggestions                                 │
│     ├── Merchant feedback on insights                                       │
│     └── Explicit ratings/thumbs up/down                                     │
│                                                                             │
│  3. INTENT PATTERN LEARNING                                                 │
│     ├── New phrases mapped to intents                                       │
│     ├── Confidence scores updated based on success                           │
│     └── Continuously improved intent detection                               │
│                                                                             │
│  4. KNOWLEDGE BASE UPDATES                                                  │
│     ├── Admin adds new FAQs                                                 │
│     ├── Merchant updates menu/policies                                      │
│     └── System learns from successful resolutions                           │
│                                                                             │
│  5. USER PROFILE EVOLUTION                                                   │
│     ├── Preferences updated from behavior                                    │
│     ├── Order history used for predictions                                  │
│     └── Segmentation refined continuously                                   │
│                                                                             │
│  6. MERCHANT-SPECIFIC LEARNING                                               │
│     ├── Each merchant has own knowledge base                                │
│     ├── Policies and offers are merchant-specific                           │
│     └── AI adapts to merchant type (restaurant, hotel, retail, etc.)        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI APIS & TECHNOLOGIES

### Intent Detection

```
Technology: Pattern Matching + Keyword Analysis
- Fast, deterministic responses
- Low latency
- Easily customizable rules
- Pattern: [order|want|need|get] + [food|pizza|burger] = ORDER_FOOD
```

### Intent Predictor

```
Technology: Machine Learning Classification
- Predicts intent from text
- Confidence scoring
- Handles ambiguous inputs
- Can be extended with more training data
```

### Knowledge Base Matching

```
Technology: Keyword + Semantic Search
- MongoDB full-text search
- FAQ matching
- Menu/policy lookups
- Fast, accurate for structured data
```

### User Intelligence

```
Technology: User Behavior Analysis
- RFM Analysis (Recency, Frequency, Monetary)
- Pattern detection
- Segmentation algorithms
- Predictive modeling
```

### Sentiment Analysis

```
Technology: Keyword-based Sentiment
- Detects positive/negative/neutral
- Emotion keywords
- Context awareness
- Used in feedback analysis
```

---

## 🏪 MERCHANT KNOWLEDGE BASE

### How Merchant-Specific AI Works

```
┌─────────────────────────────────────────────────────────────┐
│              MERCHANT KNOWLEDGE BASE                        │
├─────────────────────────────────────────────────────────────┤
│                                                                             │
│  Each merchant has unique knowledge:                                    │
│                                                                             │
│  RESTAURANT:                                                               │
│  ├── Menu items (names, prices, categories)                              │
│  ├── Policies (delivery fee, min order, timing)                         │
│  ├── Offers (happy hour, combos, discounts)                              │
│  ├── FAQs ( Dietary info, reservations)                                 │
│  └── Complimentary (free drink after 7pm?)                              │
│                                                                             │
│  HOTEL:                                                                    │
│  ├── Room types and pricing                                               │
│  ├── Check-in/out policies                                                │
│  ├── Amenities (breakfast, gym, pool)                                    │
│  ├── Late checkout options                                                │
│  └── Special offers                                                       │
│                                                                             │
│  RETAIL:                                                                   │
│  ├── Products and inventory                                               │
│  ├── Return policies                                                      │
│  ├── Loyalty programs                                                     │
│  ├── Exchange options                                                     │
│  └── Size guides                                                          │
│                                                                             │
│  SALON/SPA:                                                               │
│  ├── Services and pricing                                                 │
│  ├── Appointment requirements                                             │
│  ├── Packages and memberships                                             │
│  ├── Cancellation policies                                                │
│  └── Contraindications                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 35+ Merchant Types Supported

```
FOOD & BEVERAGE:
├── restaurant, cafe, cloud_kitchen, bakery, bar, food_court

HOSPITALITY:
├── hotel, hostel, homestay, resort, guesthouse

RETAIL:
├── retail, grocery, pharmacy, electronics, fashion, furniture

BEAUTY & WELLNESS:
├── salon, spa, gym, clinic

SERVICES:
├── laundry, repair, cleaning, service

TRANSPORT:
├── taxi, transport, parking

ENTERTAINMENT:
├── events, tickets, cinema, gaming

EDUCATION:
├── tuition, coaching, courses
```

---

## 📱 ECOSYSTEM CONNECTIONS

### How REZ MIND Connects to Apps

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ECOSYSTEM CONNECTIONS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  REZ NOW (QR Scanner + Chat)                                              │
│  ├── Scans QR → Identifies merchant                                       │
│  ├── Opens chat with REZ-SUPPORT-COPILOT                                  │
│  └── Shows merchant menu/policies from knowledge base                       │
│                                                                             │
│  HOTEL OTA APP                                                            │
│  ├── Room service orders → REZ-SUPPORT-COPILOT                             │
│  ├── Concierge chat → AI handles requests                                 │
│  └── Checkout → REZ-order-service + notifications                         │
│                                                                             │
│  CONSUMER APP                                                             │
│  ├── Order food → REZ-SUPPORT-COPILOT                                    │
│  ├── Track order → Real-time updates from REZ-order-service               │
│  └── Support → REZ-SUPPORT-COPILOT handles tickets                        │
│                                                                             │
│  MERCHANT APP                                                             │
│  ├── Dashboard → REZ-MERCHANT-COPILOT insights                           │
│  ├── Orders → Real-time from REZ-order-service                            │
│  └── Analytics → REZ-EVENT-PLATFORM data                                 │
│                                                                             │
│  ADMIN PANEL                                                              │
│  ├── Training → Feed data to knowledge base                               │
│  ├── Monitoring → Event platform dashboard                                │
│  └── Analytics → Cross-merchant insights                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 SERVICE LIFECYCLE

### How Events Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     EVENT LIFECYCLE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. EVENT OCCURS                                                           │
│     Customer sends message, order placed, review submitted, etc.            │
│                                                                             │
│  2. EVENT CAPTURED                                                        │
│     Service that detected event logs to REZ-EVENT-PLATFORM                 │
│                                                                             │
│  3. EVENT PROCESSED                                                       │
│     Subscribed services receive and process                                │
│                                                                             │
│  4. INSIGHTS GENERATED                                                    │
│     Patterns identified, predictions made                                   │
│                                                                             │
│  5. ACTIONS TAKEN                                                         │
│     Notifications sent, dashboards updated, AI responses generated         │
│                                                                             │
│  6. LEARNING APPLIED                                                      │
│     Success/failure logged, models updated                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 KEY METRICS TRACKED

```
┌─────────────────────────────────────────────────────────────┐
│                   METRICS TRACKED                          │
├─────────────────────────────────────────────────────────────┤
│                                                                             │
│  CUSTOMER METRICS:                                                          │
│  ├── Conversations handled by AI                                            │
│  ├── Intent detection accuracy                                             │
│  ├── Resolution time                                                       │
│  ├── Customer satisfaction score                                          │
│  └── Repeat interaction rate                                               │
│                                                                             │
│  MERCHANT METRICS:                                                          │
│  ├── AI-generated insights                                                  │
│  ├── Insight action rate                                                   │
│  ├── Health score trends                                                   │
│  ├── Competitor comparisons                                                │
│  └── Revenue impact                                                         │
│                                                                             │
│  SYSTEM METRICS:                                                            │
│  ├── Request latency                                                       │
│  ├── Service uptime                                                        │
│  ├── Error rates                                                           │
│  └── Knowledge base coverage                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 DEPLOYMENT STATUS

### Services Deployed

```
┌─────────────────────────────────────────────────────────────┐
│                   SERVICES STATUS                          │
├─────────────────────────────────────────────────────────────┤
│                                                                             │
│  REZ-SUPPORT-COPILOT           ✅ Deployed to Render                       │
│  REZ-MERCHANT-COPILOT          ✅ Deployed to Render                       │
│  REZ-USER-INTELLIGENCE         ✅ Deployed to Render                       │
│  REZ-INTENT-PREDICTOR          ✅ Deployed to Render                       │
│  REZ-EVENT-PLATFORM            ✅ Deployed to Render                       │
│  REZ-ACTION-ENGINE             ✅ Deployed to Render                       │
│  REZ-FEEDBACK-SERVICE          ✅ Deployed to Render                       │
│  REZ-AD-COPILOT                ✅ Deployed to Render                       │
│  REZ-KNOWLEDGE-BASE            ✅ Deployed to Render                       │
│  REZ-ADMIN-TRAINING-PANEL      ✅ Deployed to Render                       │
│                                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏁 SUMMARY

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║  REZ MIND IS:                                                                   ║
║                                                                                   ║
║  ✅ AI-powered customer support for ALL merchant types                           ║
║  ✅ Business intelligence for merchants                                          ║
║  ✅ User profile and personalization system                                       ║
║  ✅ Event-driven architecture for real-time responses                            ║
║  ✅ Learning system that improves over time                                      ║
║  ✅ Connected to entire REZ ecosystem                                            ║
║                                                                                   ║
║  IT HANDLES:                                                                    ║
║  ├── 35+ merchant types with specific policies                                   ║
║  ├── Natural language order placement                                           ║
║  ├── Predictive customer behavior                                                ║
║  ├── Merchant insights and recommendations                                       ║
║  ├── Automated actions and notifications                                        ║
║  └── Continuous learning from interactions                                      ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

**Last Updated:** 2026-05-02
**Status:** ACTIVE & LEARNING
