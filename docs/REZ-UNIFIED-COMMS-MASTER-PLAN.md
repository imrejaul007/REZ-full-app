# REZ UNIFIED COMMUNICATION SYSTEM - MASTER PLAN

**Created:** May 12, 2026
**Last Updated:** May 12, 2026
**Status:** Complete - All Specifications Ready

---

## DETAILED SPECIFICATIONS

Each component has a detailed specification document:

| Specification | File | Description |
|--------------|------|-------------|
| WhatsApp Store | [SPEC-WHATSAPP-STORE.md](SPEC-WHATSAPP-STORE.md) | In-chat checkout, cart, payment |
| WhatsApp Commerce | [SPEC-WHATSAPP-COMMERCE.md](SPEC-WHATSAPP-COMMERCE.md) | Native catalog, product discovery |
| Chatbot Builder | [SPEC-CHATBOT-BUILDER.md](SPEC-CHATBOT-BUILDER.md) | Visual flow builder |
| CRM Dashboard | [SPEC-CRM-DASHBOARD.md](SPEC-CRM-DASHBOARD.md) | Visual contact management |
| AI Voice Agent | [SPEC-AI-VOICE-AGENT.md](SPEC-AI-VOICE-AGENT.md) | Voice commerce + IVR |
| Merchant Copilot | [SPEC-MERCHANT-COPILOT-ENHANCEMENT.md](SPEC-MERCHANT-COPILOT-ENHANCEMENT.md) | Enhanced with REZ Media |
| REZ Media Wallet | [SPEC-REZ-MEDIA-WALLET.md](SPEC-REZ-MEDIA-WALLET.md) | Credit system for merchants |
| Unified Engine | [SPEC-UNIFIED-ENGINE.md](SPEC-UNIFIED-ENGINE.md) | Connect all channels to Agent OS |

---

# TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [What We Have (Audit)](#what-we-have)
3. [What We Need To Build](#what-we-need-to-build)
4. [Complete Architecture](#complete-architecture)
5. [Service Specifications](#service-specifications)
6. [Business Model](#business-model)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Dependency Map](#dependency-map)
9. [Risk Assessment](#risk-assessment)

---

# EXECUTIVE SUMMARY

## Vision

Build a unified AI-powered communication platform that connects all REZ ecosystem touchpoints (WhatsApp, Voice, Copilot, Website) through a single AI brain (REZ Agent OS), enabling:

- **Merchants:** AI-powered sales, support, and marketing automation
- **Consumers:** Seamless commerce through any channel
- **Platform:** Self-improving AI that learns from every interaction

## Key Numbers

| Metric | Value |
|--------|-------|
| AI Agents | 38 (existing) |
| Communication Channels | 4 (WhatsApp, Voice, Copilot, Website) |
| Merchant Apps | 9 (existing) |
| Consumer Apps | 4+ (existing) |
| New Services To Build | 12 |
| Services To Upgrade | 3 |

## Revenue Model

| Revenue Stream | Description |
|--------------|-------------|
| WhatsApp Messages | ₹0.10/credit per message |
| AI Voice Calls | ₹0.50/credit per minute |
| Campaign Sends | ₹1.00/credit per recipient |
| Monthly Plans | ₹999 - ₹9,999/month |
| Merchant Wallet Recharge | 5-40% margin on credits |

---

# WHAT WE HAVE

## PART A: EXISTING SERVICES AUDIT

### A1. REZ Intelligence (70+ Services)

| Category | Services | Status |
|----------|----------|--------|
| **AI Agents** | 38 agents (Commerce, Autonomous, User) | WORKING |
| **Voice AI** | `rez-ai-voice`, STT (Whisper), TTS (ElevenLabs) | WORKING |
| **Intelligence Hub** | Intent Graph, Knowledge Graph, User Graph | WORKING |
| **ML Services** | AB Testing, Attribution, Analytics, Recommendation | WORKING |
| **Tools** | Support Copilot, AI Router, API Keys, Action Engine | WORKING |

### A2. REZ Media (30+ Services)

| Category | Services | Status |
|----------|----------|--------|
| **Communications** | WhatsApp, SMS, Email, Push | WORKING |
| **Marketing** | Campaigns, Automation, Lead Intelligence | WORKING |
| **Advertising** | Ad serving, Decision engine, AI optimization | WORKING |
| **Engagement** | Gamification, Feedback, Journey | WORKING |
| **Social** | Rendez, do-app, Creator platform | PARTIAL |

### A3. RABTUL Technologies (26 Services)

| Category | Services | Status |
|----------|----------|--------|
| **Auth** | JWT, MFA, OTP | WORKING |
| **Payments** | Razorpay, Wallet, BNPL | WORKING |
| **Commerce** | POS, Menu, KDS, Orders | WORKING |
| **Operations** | Food Delivery, Inventory, Staff | WORKING |
| **Core** | API Gateway, Webhook, Rate Limit | WORKING |

---

## PART B: DETAILED EXISTING SERVICE LIST

### B1. Merchant Copilot

**Location:** `/REZ-Merchant/rez-merchant-copilot/` (Port 4022)

| Feature | Status | Description |
|---------|--------|-------------|
| Health Score | WORKING | 0-100 score based on orders, revenue, customers, reviews, inventory |
| Recommendation Engine | WORKING | AI-generated marketing, pricing, operations recommendations |
| Competitor Analyzer | WORKING | Market intelligence, price gap, rating comparison |
| Decision Engine | WORKING | Actionable operational decisions |
| Live Data | WORKING | Real-time merchant, order, catalog integration |
| Industry-Specific | WORKING | Restaurant, Salon, Healthcare, Fitness |

**API Endpoints:**
```
GET /api/merchant/:id/profile
GET /api/merchant/:id/insights
GET /api/merchant/:id/recommendations
GET /api/merchant/:id/health-score
GET /api/merchant/:id/decisions
GET /api/merchant/:id/competitors
POST /api/merchant/:id/feedback
```

### B2. Consumer Wallet

**Location:** `/RABTUL-Technologies/rez-wallet-service/`

| Coin Type | Purpose | Status |
|-----------|---------|--------|
| REZ | Main currency | WORKING |
| PRIVE | Premium rewards | WORKING |
| BRANDED | Brand rewards | WORKING |
| PROMO | Promotional credits | WORKING |
| CASHBACK | Cashback rewards | WORKING |
| REFERRAL | Referral bonuses | WORKING |

**Features:**
- Balance: total, available, pending, cashback
- Spending Priority: Promo → Branded → Prive → Cashback → Referral → REZ
- Welcome Bonus: 50 coins on first login
- Loyalty Tiers: Bronze, Silver, Gold, Platinum, Diamond

### B3. Merchant Wallet

**Location:** `/RABTUL-Technologies/rez-wallet-service/merchantWalletService.ts`

| Feature | Status |
|---------|--------|
| Earnings tracking | WORKING |
| Bank withdrawal | WORKING |
| Bank verification | WORKING |
| Order credits | WORKING |
| Refund debits | WORKING |
| Coin awards | WORKING |

### B4. REZ Communications Platform

**Location:** `/REZ-Media/REZ-communications-platform/` (Port 3009)

| Feature | Status | Details |
|---------|--------|---------|
| WhatsApp Send/Receive | WORKING | Twilio WhatsApp Business API |
| WhatsApp Templates | WORKING | 6 template types |
| Agent Routes | WORKING | 8 agent types |
| Marketing Templates | WORKING | 15+ templates |
| Email | WORKING | SendGrid |
| SMS | WORKING | Twilio |
| Push | WORKING | Firebase |
| Multi-channel Orchestration | WORKING | Redis-backed queuing |

**WhatsApp Templates:**
1. `order_confirmation` - UTILITY
2. `delivery_update` - UTILITY
3. `appointment_reminder` - UTILITY
4. `abandonment_recovery` - MARKETING
5. `win_back` - MARKETING
6. `campaign_promotion` - MARKETING

### B5. REZ Agent OS

**Location:** `/REZ-Intelligence/REZ-AGENT-OS.md`

**Commerce Agents (15):**
| Agent | Schedule | Purpose |
|-------|----------|---------|
| DemandSignalAgent | `*/5 * * * *` | Aggregate demand signals |
| ScarcityAgent | `*/1 * * * *` | Monitor supply/demand |
| PriceElasticityAgent | `0 * * * *` | Price sensitivity |
| ReorderPredictorAgent | `*/5 * * * *` | Reorder probability |
| TasteEvolutionAgent | `0 0 * * *` | Preference changes |
| ChurnRiskAgent | `0 1 * * *` | Churn prediction |
| LTVPredictorAgent | `0 2 * * 0` | Lifetime value |
| InventoryAlertAgent | `*/5 * * * *` | Low stock alerts |
| DemandForecastAgent | `0 3 * * *` | 7-day prediction |
| CompetitorMonitorAgent | `0 4 * * *` | Competition tracking |
| TrendDetectorAgent | `0 * * * *` | Trend identification |
| PriceOptimizerAgent | `0 5 * * *` | Price optimization |
| OfferMatcherAgent | `*/15 * * * *` | Offer matching |
| CrossSellAgent | `0 * * * *` | Cross-sell suggestions |
| UrgencyTriggerAgent | `*/10 * * * *` | Urgency creation |

**Autonomous Agents (8):**
| Agent | Schedule | Purpose |
|-------|----------|---------|
| DemandSignalAgent | `*/5 * * * *` | Demand detection |
| ScarcityAgent | `*/1 * * * *` | Scarcity monitoring |
| PersonalizationAgent | Event | Personalization |
| AttributionAgent | Event | Conversion tracking |
| AdaptiveScoringAgent | `0 * * * *` | ML retraining |
| FeedbackLoopAgent | Event | Optimization |
| NetworkEffectAgent | `0 0 * * *` | Collaborative filtering |
| RevenueAttributionAgent | `*/15 * * * *` | Revenue tracking |

**User Agents (15):**
| Agent | Purpose |
|-------|---------|
| PersonalizationAgent | Content personalization |
| SegmentClassifierAgent | User classification |
| RecommendationAgent | Product recommendations |
| EngagementAgent | Engagement optimization |
| ChurnPredictionAgent | Churn detection |
| LTVScoringAgent | Value prediction |
| NextBestActionAgent | Action recommendations |
| PropensityModelAgent | Purchase likelihood |
| PreferenceLearningAgent | Preference extraction |
| AffinityMappingAgent | Interest mapping |
| RetentionStrategyAgent | Retention tactics |
| WinbackTriggerAgent | Re-engagement |
| UpgradePathAgent | Upsell opportunities |
| LifecycleStageAgent | Stage classification |
| EngagementFrequencyAgent | Contact optimization |

**Orchestrator:**
- Task decomposition
- Multi-agent coordination
- Marketing Hub integration

### B6. REZ Voice AI

**Location:** `/REZ-Intelligence/rez-ai-voice/`

| Feature | Status | Implementation |
|---------|--------|----------------|
| Speech-to-Text | WORKING | OpenAI Whisper API |
| Text-to-Speech | WORKING | ElevenLabs API |
| Voice Classifier | WORKING | Multi-language support |
| Swarm Orchestrator | WORKING | Multi-agent routing |
| Twilio Webhook | WORKING | Call handling |
| Vertical Handlers | WORKING | Restaurant, Salon, Fitness, Hotel |
| Intent Patterns | WORKING | Order, reserve, track, cancel, pay |

**Supported Languages:**
- English (en-IN)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)

### B7. REZ Auth Service

**Location:** `/RABTUL-Technologies/rez-auth-service/` (Port 4002)

| Feature | Status |
|---------|--------|
| JWT Authentication | WORKING |
| User/Admin/Merchant tokens | WORKING |
| TOTP MFA | WORKING |
| OTP via SMS/WhatsApp | WORKING |
| OAuth 2.0 | WORKING |
| Rate limiting | WORKING |

### B8. REZ Payment Service

**Location:** `/RABTUL-Technologies/rez-payment-service/` (Port 4001)

| Feature | Status |
|---------|--------|
| Razorpay Integration | WORKING |
| Payment Initiation | WORKING |
| Webhook Handling | WORKING |
| Refund Processing | WORKING |
| BNPL | WORKING |
| Multi-currency | WORKING |
| Atomic Transactions | WORKING |
| Replay Prevention | WORKING |

### B9. REZ User/Identity Graph

**Location:** `/REZ-Intelligence/REZ-user-graph/`, `/REZ-Intelligence/REZ-identity-graph/`

| Feature | Status |
|---------|--------|
| User Profile | WORKING |
| Identity Resolution | WORKING |
| Cross-device tracking | WORKING |
| Preference storage | WORKING |
| Order history | WORKING |

---

# WHAT WE NEED TO BUILD

## PART C: NEW SERVICES TO BUILD

### C1. REZ Media Wallet Service (NEW)

**Purpose:** Merchant credits for REZ Media services

**Features:**
- Credit balance tracking
- Auto-deduction on usage
- Purchase via Razorpay
- Auto-recharge
- Low balance alerts
- Spend analytics
- Refund credits

**API Endpoints:**
```
GET /api/wallet/:merchantId/balance
POST /api/wallet/:merchantId/recharge
GET /api/wallet/:merchantId/transactions
POST /api/wallet/:merchantId/auto-recharge
GET /api/wallet/:merchantId/usage
PUT /api/wallet/:merchantId/settings
```

### C2. REZ WhatsApp Provisioning Service (NEW)

**Purpose:** Multi-tenant WhatsApp Business API management

**Features:**
- Twilio Subaccount creation
- Phone number provisioning
- WABA management
- Template approval workflow
- Number-to-merchant mapping
- Template management per merchant

**API Endpoints:**
```
POST /api/whatsapp/merchant/:merchantId/provision
GET /api/whatsapp/merchant/:merchantId/numbers
POST /api/whatsapp/number/:numberId/assign
GET /api/whatsapp/number/:numberId/status
POST /api/whatsapp/merchant/:merchantId/template
GET /api/whatsapp/merchant/:merchantId/templates
```

### C3. REZ Voice Billing Service (NEW)

**Purpose:** AI voice call minutes tracking and billing

**Features:**
- Call duration tracking
- Per-minute credit deduction
- Rate limiting
- Call history
- Usage analytics
- Cost optimization

**API Endpoints:**
```
POST /api/voice/call/start
POST /api/voice/call/end
GET /api/voice/merchant/:merchantId/usage
GET /api/voice/merchant/:merchantId/history
```

### C4. REZ Unified Conversation Engine (NEW)

**Purpose:** Single engine routing all channels through REZ Agent OS

**Features:**
- Multi-channel message routing
- Session context management
- Intent detection
- Agent routing
- Response generation
- Conversation logging
- Multi-turn memory

**API Endpoints:**
```
POST /api/conversation/message
GET /api/conversation/session/:sessionId
POST /api/conversation/webhook/:channel
GET /api/conversation/merchant/:merchantId/history
```

### C5. REZ Sales Agent (NEW)

**Purpose:** Purpose-built agent for conversion optimization

**Triggers:**
- Product inquiry
- Price question
- "I want to buy"
- Cart abandoned

**Actions:**
- Show products
- Apply discounts
- Cross-sell/Upsell
- Create order
- Handle payment

### C6. REZ Support Agent (NEW)

**Purpose:** Purpose-built agent for customer issue resolution

**Triggers:**
- "Cancel order"
- "Refund"
- "Not working"
- "Problem"
- "Help"

**Actions:**
- Verify identity
- Look up account
- Take action
- Escalate
- Log for improvement

### C7. REZ Consultant Agent (NEW)

**Purpose:** Purpose-built agent for recommendations and guidance

**Triggers:**
- "What should I get?"
- "Which is better?"
- "Help me decide"
- "Recommend"

**Actions:**
- Qualifying questions
- Preference analysis
- Show recommendations
- Explain options
- Guide to decision

### C8. REZ Information Agent (NEW)

**Purpose:** Purpose-built agent for data retrieval

**Triggers:**
- "Where is...?"
- "What time...?"
- "How much...?"
- "Does your store...?"

**Actions:**
- Search knowledge base
- Pull real-time data
- Answer FAQs
- Provide directions

### C9. REZ WhatsApp Commerce (NEW)

**Purpose:** In-chat product catalog and checkout

**Features:**
- Product catalog display
- Interactive product cards
- Cart management
- In-chat checkout
- Order confirmation
- Payment integration

### C10. REZ Chatbot Builder (NEW)

**Purpose:** Visual flow builder for merchants

**Features:**
- Drag & drop interface
- Node types (message, question, action, condition)
- Flow testing
- Live deployment
- Analytics
- Template library

### C11. REZ Conversation Intelligence (NEW)

**Purpose:** Learn from every conversation

**Features:**
- Conversation logging
- Intent extraction
- Sentiment analysis
- Outcome tracking
- Training data export
- Feedback loop
- Model improvement

### C12. REZ Merchant WhatsApp Manager (NEW)

**Purpose:** Merchant dashboard for WhatsApp management

**Features:**
- Number management
- Template approval status
- Conversation history
- Response analytics
- Quick replies
- Auto-responses

---

## PART D: SERVICES TO UPGRADE

### D1. Merchant Copilot Upgrade

**Current:** Health score, recommendations, competitor analysis

**Add:**
- REZ Media insights
- WhatsApp campaign recommendations
- Voice usage stats
- Credit balance alerts
- Marketing spend recommendations
- Auto-create campaigns from recommendations

### D2. REZ Voice AI Integration

**Current:** Standalone voice service

**Upgrade:**
- Connect to Unified Conversation Engine
- Connect to REZ Agent OS
- Enable cross-channel memory
- Add more verticals
- Add vernacular support

### D3. REZ Communications Platform

**Current:** Template-based messaging

**Upgrade:**
- Add interactive messages (buttons, lists)
- Add product catalog
- Add commerce capabilities
- Add conversation logging

---

# COMPLETE ARCHITECTURE

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MERCHANT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │   Merchant OS       │  │   Industry OS        │  │   REZ Admin         │ │
│  │   (POS, Menu, KDS)  │  │   (Salon, Hotel)    │  │   Portal            │ │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘ │
│              │                        │                        │              │
│              └────────────────────────┼────────────────────────┘              │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     MERCHANT COPILOT (EXISTING + UPGRADE)           │    │
│  │                                                                       │    │
│  │  Health Score  │  Recommendations  │  Competitor  │  Decisions      │    │
│  │                                                                       │    │
│  │  + REZ Media Insights  │  + Campaign Recommendations  │  + Auto-Create │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    REZ MERCHANT DASHBOARD                            │    │
│  │                                                                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │    │
│  │  │ REZ Media   │  │ WhatsApp    │  │ AI Voice    │  │ Analytics  │ │    │
│  │  │ Wallet      │  │ Manager     │  │ Agent       │  │ Dashboard  │ │    │
│  │  │ (NEW)       │  │ (NEW)       │  │             │  │            │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │               CHATBOT BUILDER (NEW)                          │     │    │
│  │  │  Drag & Drop Flow  │  Templates  │  Analytics               │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REZ Profile
                                      │ (Auth + User Graph)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REZ AGENT OS LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   UNIFIED CONVERSATION ENGINE (NEW)                  │    │
│  │                                                                       │    │
│  │  Channel Router  │  Context Manager  │  Intent Processor  │  Memory │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         AGENT ROUTER                                 │    │
│  │                                                                       │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │    │
│  │  │ SALES   │  │ SUPPORT │  │CONSULT-│  │ INFO    │                 │    │
│  │  │ AGENT   │  │ AGENT   │  │ANT      │  │ AGENT   │                 │    │
│  │  │ (NEW)   │  │ (NEW)   │  │(NEW)    │  │ (NEW)   │                 │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘                 │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │                  REZ AGENT OS (38 AGENTS - EXISTING)        │     │    │
│  │  │                                                               │     │    │
│  │  │  Commerce │ Autonomous │ User │ Orchestrator               │     │    │
│  │  │  (15)     │ (8)        │ (15) │                             │     │    │
│  │  │                                                               │     │    │
│  │  │  + Agent Orchestrator                                          │     │    │
│  │  │  + Marketing Integration                                       │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    REZ INTELLIGENCE LAYER                            │    │
│  │                                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Intent       │  │ Knowledge    │  │ User        │               │    │
│  │  │ Graph        │  │ Graph        │  │ Graph       │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐     │    │
│  │  │            CONVERSATION INTELLIGENCE (NEW)                    │     │    │
│  │  │  Logger  │  Feedback  │  Training  │  Model Update            │     │    │
│  │  └─────────────────────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CHANNEL LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ WhatsApp    │  │ Voice       │  │ In-App      │  │ Website     │       │
│  │ (UPGRADE)   │  │ (EXISTING)  │  │ Copilot     │  │ Chat        │       │
│  │             │  │             │  │             │  │             │       │
│  │ + Commerce  │  │ + Agent OS  │  │ + Unified   │  │ + Unified   │       │
│  │ + Catalog   │  │ Integration │  │ Engine      │  │ Engine      │       │
│  │ + Checkout  │  │             │  │             │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│         │                │                │                │                 │
│         └────────────────┴────────────────┴────────────────┘                 │
│                              │                                                │
│                              ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │             WHATSAPP PROVISIONING SERVICE (NEW)                      │    │
│  │                                                                       │    │
│  │  Twilio Subaccounts  │  Number Pool  │  WABA Management              │    │
│  │  Template Approval   │  Multi-tenant │  Billing                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RABTUL LAYER (INFRASTRUCTURE)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ REZ Auth    │  │ REZ Payment │  │ REZ Wallet  │  │ REZ Order   │       │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │       │
│  │ (EXISTING)  │  │ (EXISTING)  │  │ (EXISTING)  │  │ (EXISTING)  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│         │                │                │                │                 │
│         │                │                ▼                │                 │
│         │                │      ┌─────────────────┐      │                 │
│         │                │      │ REZ MEDIA WALLET│      │                 │
│         │                │      │ (NEW)           │      │                 │
│         │                │      │                 │      │                 │
│         │                │      │ Credits         │      │                 │
│         │                │      │ Spend Tracking  │      │                 │
│         │                │      │ Auto-Recharge   │      │                 │
│         │                │      └─────────────────┘      │                 │
│         │                │                │                │                 │
│         ▼                ▼                ▼                ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           EXTERNAL SERVICES                           │    │
│  │                                                                       │    │
│  │  Twilio │ SendGrid │ Razorpay │ Razorpay │ OpenAI │ ElevenLabs        │    │
│  │  (SMS/  │ (Email)  │ (Pay)    │ (Voice)  │(Whisper)│ (TTS)          │    │
│  │  WhatsApp) │        │          │           │         │                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# SERVICE SPECIFICATIONS

## Service 1: REZ Media Wallet Service

**Path:** `RABTUL-Technologies/rez-media-wallet-service/`

### Files

```
rez-media-wallet-service/
├── src/
│ ├── index.ts
│ ├── config/
│ │   └── index.ts
│ ├── models/
│ │   ├── MediaWallet.ts
│   ├── Transaction.ts
│   └── Recharge.ts
│ ├── routes/
│ │   ├── wallet.routes.ts
│   ├── recharge.routes.ts
│   └── settings.routes.ts
│ ├── services/
│ │   ├── mediaWalletService.ts
│   ├── creditService.ts
│   ├── billingService.ts
│   └── notificationService.ts
│ ├── middleware/
│ │   ├── auth.middleware.ts
│ │   └── validation.middleware.ts
│ └── utils/
│       ├── errors.ts
│       └── helpers.ts
├── tests/
│   └── *.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Database Schema

```typescript
// MediaWallet
{
  merchantId: ObjectId,
  balance: number,           // Current credits
  reservedBalance: number,   // Reserved for pending
  lifetimePurchased: number, // Total purchased
  lifetimeUsed: number,      // Total spent
  autoRecharge: {
    enabled: boolean,
    threshold: number,       // Trigger at this balance
    amount: number,          // Recharge amount
    paymentMethodId: string
  },
  createdAt: Date,
  updatedAt: Date
}

// Transaction
{
  walletId: ObjectId,
  type: 'DEBIT' | 'CREDIT' | 'REFUND',
  service: 'WHATSAPP' | 'VOICE' | 'CAMPAIGN' | 'COPILOT',
  amount: number,            // Credits
  rate: number,              // Cost per credit
  amountInr: number,         // Actual cost
  reference: string,         // Call ID, Message ID, etc.
  metadata: {
    channel: string,
    duration?: number,       // For voice
    recipients?: number      // For campaign
  },
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
  balanceBefore: number,
  balanceAfter: number,
  createdAt: Date
}

// Recharge
{
  walletId: ObjectId,
  amount: number,             // Credits purchased
  priceInr: number,
  paymentId: string,
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED',
  razorpayOrderId: string,
  razorpayPaymentId: string,
  tier: 'STARTER' | 'BASIC' | 'PRO' | 'ENTERPRISE',
  bonusCredits: number,       // Loyalty bonus
  createdAt: Date
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet/:merchantId` | Get wallet details |
| GET | `/api/wallet/:merchantId/balance` | Get balance only |
| GET | `/api/wallet/:merchantId/transactions` | List transactions |
| GET | `/api/wallet/:merchantId/usage` | Usage breakdown |
| POST | `/api/wallet/:merchantId/recharge` | Recharge wallet |
| POST | `/api/wallet/:merchantId/validate-payment` | Validate payment |
| PUT | `/api/wallet/:merchantId/auto-recharge` | Set auto-recharge |
| DELETE | `/api/wallet/:merchantId/auto-recharge` | Disable auto-recharge |

### Credit Pricing

| Service | Credits | Cost |
|---------|---------|------|
| WhatsApp Message | 1 | ₹0.10 |
| AI Voice Call (per minute) | 1 | ₹0.50 |
| Campaign Send (per recipient) | 1 | ₹1.00 |
| AI Copilot Query | 1 | ₹0.05 |
| Analytics Export | 10 | ₹1.00 |

### Recharge Tiers

| Tier | Credits | Price | Per Credit | Bonus |
|------|---------|-------|------------|-------|
| Starter | 500 | ₹50 | ₹0.10 | 0% |
| Basic | 1,000 | ₹90 | ₹0.09 | 10% |
| Pro | 5,000 | ₹400 | ₹0.08 | 20% |
| Enterprise | 10,000 | ₹700 | ₹0.07 | 30% |
| Unlimited | 50,000 | ₹3,000 | ₹0.06 | 40% |

---

## Service 2: REZ WhatsApp Provisioning Service

**Path:** `REZ-Media/rez-whatsapp-provisioning/`

### Files

```
rez-whatsapp-provisioning/
├── src/
│ ├── index.ts
│ ├── config/
│ │   └── twilio.config.ts
│ ├── models/
│ │   ├── MerchantWhatsApp.ts
│ │   ├── PhoneNumber.ts
│ │   └── Template.ts
│ ├── routes/
│ │   ├── provision.routes.ts
│ │   ├── number.routes.ts
│ │   └── template.routes.ts
│ ├── services/
│ │   ├── twilioService.ts
│ │   ├── subaccountService.ts
│ │   ├── numberService.ts
│ │   ├── templateService.ts
│ │   └── webhookService.ts
│ └── utils/
│       ├── errors.ts
│       └── validation.ts
├── tests/
└── README.md
```

### Database Schema

```typescript
// MerchantWhatsApp
{
  merchantId: ObjectId,
  twilioSubaccountSid: string,
  twilioSubaccountToken: string,
  wabaId: string,
  phoneNumbers: [ObjectId],
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
  messageStats: {
    sent: number,
    delivered: number,
    read: number,
    failed: number
  },
  createdAt: Date,
  updatedAt: Date
}

// PhoneNumber
{
  merchantId: ObjectId,
  number: string,              // +91XXXXXXXXXX
  twilioSid: string,
  type: 'LOCAL' | 'TOLL_FREE',
  status: 'AVAILABLE' | 'ASSIGNED' | 'SUSPENDED',
  assignedAt: Date,
  capabilities: ['SMS', 'WHATSAPP', 'VOICE'],
  cost: number,               // Monthly cost
  metadata: {
    country: string,
    areaCode: string
  }
}

// Template
{
  merchantId: ObjectId,
  name: string,
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION',
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED',
  twilioContentSid: string,
  content: {
    body: string,
    header?: string,
    footer?: string,
    buttons?: []
  },
  variables: [{
    name: string,
    type: 'TEXT' | 'CURRENCY' | 'DATE_TIME'
  }],
  rejectionReason?: string,
  createdAt: Date,
  approvedAt?: Date
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/whatsapp/merchant/:merchantId/provision` | Create subaccount |
| GET | `/api/whatsapp/merchant/:merchantId` | Get merchant WhatsApp |
| GET | `/api/whatsapp/merchant/:merchantId/numbers` | List numbers |
| POST | `/api/whatsapp/merchant/:merchantId/number` | Purchase number |
| POST | `/api/whatsapp/number/:numberId/assign` | Assign to merchant |
| GET | `/api/whatsapp/number/:numberId` | Get number details |
| POST | `/api/whatsapp/merchant/:merchantId/template` | Create template |
| GET | `/api/whatsapp/merchant/:merchantId/templates` | List templates |
| POST | `/api/whatsapp/webhook/:merchantId` | Twilio webhook |

---

## Service 3: REZ Voice Billing Service

**Path:** `REZ-Media/rez-voice-billing/`

### Files

```
rez-voice-billing/
├── src/
│ ├── index.ts
│ ├── models/
│ │   ├── CallSession.ts
│   └── CallRecord.ts
│ ├── routes/
│ │   ├── call.routes.ts
│ │   └── usage.routes.ts
│ ├── services/
│ │   ├── callTracker.ts
│ │   ├── billingService.ts
│ │   └── creditService.ts
│ └── utils/
│       └── rateLimiter.ts
└── README.md
```

### Database Schema

```typescript
// CallSession
{
  callSid: string,             // Twilio Call SID
  merchantId: ObjectId,
  customerPhone: string,
  direction: 'INBOUND' | 'OUTBOUND',
  status: 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUSY',
  startTime: Date,
  endTime?: Date,
  duration: number,           // Seconds
  creditedAmount: number,      // Credits deducted
  agentType: string,           // Which AI agent
  ivrPath: [string],          // Menu path taken
  recordingUrl?: string,
  transcription?: string,
  createdAt: Date
}

// CallRecord (aggregated daily)
{
  merchantId: ObjectId,
  date: Date,
  totalCalls: number,
  totalMinutes: number,
  inboundCalls: number,
  outboundCalls: number,
  totalCredits: number,
  avgDuration: number,
  successRate: number,
  createdAt: Date
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/call/start` | Start call tracking |
| POST | `/api/voice/call/end` | End call tracking |
| POST | `/api/voice/call/event` | Call events |
| GET | `/api/voice/merchant/:merchantId/usage` | Usage summary |
| GET | `/api/voice/merchant/:merchantId/history` | Call history |
| GET | `/api/voice/merchant/:merchantId/analytics` | Analytics |

---

## Service 4: REZ Unified Conversation Engine

**Path:** `REZ-Intelligence/rez-unified-engine/`

### Files

```
rez-unified-engine/
├── src/
│ ├── index.ts
│ ├── config/
│ │   └── index.ts
│ ├── models/
│ │   ├── Conversation.ts
│ │   ├── Session.ts
│ │   └── Message.ts
│ ├── routes/
│ │   ├── message.routes.ts
│ │   ├── session.routes.ts
│ │   └── webhook.routes.ts
│ ├── services/
│ │   ├── channelRouter.ts
│ │   ├── contextManager.ts
│ │   ├── intentProcessor.ts
│ │   ├── agentRouter.ts
│ │   ├── responseGenerator.ts
│ │   ├── conversationLogger.ts
│ │   └── multiChannelAdapter.ts
│ ├── agents/
│ │   ├── SalesAgent.ts
│ │   ├── SupportAgent.ts
│ │   ├── ConsultantAgent.ts
│ │   └── InfoAgent.ts
│ ├── integrations/
│ │   ├── whatsapp.integration.ts
│ │   ├── voice.integration.ts
│ │   ├── copilot.integration.ts
│ │   └── agentOS.integration.ts
│ └── utils/
│       ├── sessionStore.ts
│       ├── messageParser.ts
│       └── errors.ts
├── tests/
└── README.md
```

### Database Schema

```typescript
// Conversation
{
  conversationId: string,      // UUID
  merchantId: ObjectId,
  customerId: ObjectId,
  channel: 'WHATSAPP' | 'VOICE' | 'COPILOT' | 'WEBSITE',
  status: 'ACTIVE' | 'CLOSED' | 'ESCALATED',
  agentType?: 'SALES' | 'SUPPORT' | 'CONSULTANT' | 'INFO',
  agentSessionId?: string,
  intent?: string,
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE',
  outcome?: 'CONVERTED' | 'ABANDONED' | 'ESCALATED' | 'RESOLVED',
  revenue?: number,
  messageCount: number,
  startedAt: Date,
  endedAt?: Date,
  metadata: {
    firstMessage?: string,
    lastMessage?: string,
    language?: string,
    location?: object
  },
  createdAt: Date,
  updatedAt: Date
}

// Session (for context)
{
  sessionId: string,
  conversationId: string,
  merchantId: ObjectId,
  customerId: ObjectId,
  channel: string,
  context: {
    user: object,
    merchant: object,
    cart?: object,
    order?: object,
    preferences: object
  },
  history: [{
    role: 'user' | 'agent',
    content: string,
    timestamp: Date,
    metadata: object
  }],
  variables: {},               // Flow variables
  currentNode?: string,        // For chatbot flows
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Message
{
  messageId: string,
  conversationId: string,
  sessionId: string,
  merchantId: ObjectId,
  customerId: ObjectId,
  channel: string,
  direction: 'INBOUND' | 'OUTBOUND',
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'INTERACTIVE' | 'TEMPLATE',
  content: string,
  parsedContent?: object,
  intent?: {
    name: string,
    confidence: number,
    entities: object
  },
  sentiment?: string,
  agent?: {
    type: string,
    response?: string,
    actionTaken?: string
  },
  metadata: object,
  createdAt: Date
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversation/message` | Send message |
| POST | `/api/conversation/webhook/:channel` | Webhook handler |
| GET | `/api/conversation/session/:sessionId` | Get session |
| GET | `/api/conversation/merchant/:merchantId` | List conversations |
| GET | `/api/conversation/:conversationId` | Get conversation |
| POST | `/api/conversation/:conversationId/close` | Close conversation |
| POST | `/api/conversation/:conversationId/escalate` | Escalate |
| GET | `/api/conversation/analytics` | Analytics |

### Intent Routing

```typescript
const intentRoutes = {
  // Sales intents
  'PRODUCT_INQUIRY': 'SALES',
  'PRICE_QUESTION': 'SALES',
  'WANT_TO_BUY': 'SALES',
  'CART_ABANDON': 'SALES',
  'QUOTE_REQUEST': 'SALES',

  // Support intents
  'ORDER_CANCEL': 'SUPPORT',
  'REFUND_REQUEST': 'SUPPORT',
  'ISSUE_REPORT': 'SUPPORT',
  'COMPLAINT': 'SUPPORT',
  'HELP_REQUEST': 'SUPPORT',

  // Consultant intents
  'WHAT_SHOULD_I_GET': 'CONSULTANT',
  'WHICH_IS_BETTER': 'CONSULTANT',
  'RECOMMEND': 'CONSULTANT',
  'HELP_DECIDE': 'CONSULTANT',

  // Info intents
  'LOCATION_QUERY': 'INFO',
  'TIMING_QUERY': 'INFO',
  'PRICE_QUERY': 'INFO',
  'AVAILABILITY_QUERY': 'INFO',
  'FAQ': 'INFO'
};
```

---

## Service 5-8: AI Agents

### REZ Sales Agent

**Path:** `REZ-Intelligence/rez-sales-agent/`

**Purpose:** Convert interest to revenue

**Capabilities:**
- Product recommendations
- Price negotiation
- Cross-sell/Upsell
- Discount application
- Order creation
- Payment handling

### REZ Support Agent

**Path:** `REZ-Intelligence/rez-support-agent/`

**Purpose:** Resolve customer issues

**Capabilities:**
- Identity verification
- Account lookup
- Order management
- Refund processing
- Escalation handling
- Ticket creation

### REZ Consultant Agent

**Path:** `REZ-Intelligence/rez-consultant-agent/`

**Purpose:** Guide users with recommendations

**Capabilities:**
- Qualifying questions
- Preference analysis
- Product matching
- Option comparison
- Decision guidance

### REZ Info Agent

**Path:** `REZ-Intelligence/rez-info-agent/`

**Purpose:** Answer questions, provide data

**Capabilities:**
- FAQ answers
- Store information
- Product details
- Order status
- Business hours
- Location/directions

---

## Service 9: REZ WhatsApp Commerce

**Path:** `REZ-Media/rez-whatsapp-commerce/`

### Files

```
rez-whatsapp-commerce/
├── src/
│ ├── index.ts
│ ├── models/
│ │   ├── Cart.ts
│ │   └── Checkout.ts
│ ├── services/
│ │   ├── catalogService.ts
│ │   ├── cartService.ts
│ │   ├── checkoutService.ts
│ │   ├── paymentService.ts
│ │   └── orderService.ts
│ ├── handlers/
│ │   ├── messageHandler.ts
│ │   ├── productHandler.ts
│ │   ├── cartHandler.ts
│ │   └── checkoutHandler.ts
│ └── utils/
│       ├── productFormatter.ts
│       └── interactiveMessages.ts
└── README.md
```

### Interactive Message Components

```typescript
// Product Card
{
  type: 'interactive',
  interactive: {
    type: 'product',
    header: { type: 'text', text: 'Product Name' },
    body: {
      text: '₹299 | Rating: 4.5 ⭐ (230 reviews)'
    },
    footer: { text: 'Tap to buy' },
    action: {
      catalog_id: 'CATALOG_ID',
      product_retailer_id: 'PRODUCT_ID'
    }
  }
}

// Quick Reply Buttons
{
  type: 'interactive',
  interactive: {
    type: 'button',
    body: { text: 'Your cart has 2 items. Total: ₹549' },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'VIEW_CART', title: '🛒 View Cart' } },
        { type: 'reply', reply: { id: 'CHECKOUT', title: '💳 Checkout' } },
        { type: 'reply', reply: { id: 'CONTINUE', title: '➕ Add More' } }
      ]
    }
  }
}

// List Message
{
  type: 'interactive',
  interactive: {
    type: 'list',
    header: { type: 'text', text: 'Our Menu' },
    body: { text: 'Select a category' },
    footer: { text: 'Powered by REZ' },
    action: {
      button: 'View Categories',
      sections: [
        {
          title: 'Main Course',
          rows: [
            { id: 'biryani', title: 'Biryani', description: 'From ₹249' },
            { id: 'curry', title: 'Curry', description: 'From ₹199' }
          ]
        }
      ]
    }
  }
}
```

---

## Service 10: REZ Chatbot Builder

**Path:** `REZ-Media/rez-chatbot-builder/`

### Node Types

```typescript
type FlowNodeType =
  | 'MESSAGE'        // Send message
  | 'QUESTION'       // Ask question
  | 'CONDITION'      // If/else
  | 'ACTION'         // Take action
  | 'API_CALL'       // External API
  | 'DELAY'          // Wait
  | 'RANDOM'         // Random branch
  | 'AIGENT'         // Connect to AI Agent
  | 'TRANSFER'       // Transfer to human
  | 'CLOSE'          // End conversation
  | 'HTTP_REQUEST';  // Webhook
```

### Flow Structure

```typescript
interface Flow {
  flowId: string;
  merchantId: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  trigger: {
    type: 'KEYWORD' | 'INTENT' | 'MENU' | 'WEBHOOK';
    value: string;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables: FlowVariable[];
  analytics: {
    started: number;
    completed: number;
    droppedOff: number;
    avgDuration: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface FlowNode {
  nodeId: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
    options?: QuickReply[];
    condition?: Condition;
    action?: Action;
    delay?: number;
    agentType?: string;
  };
}

interface FlowEdge {
  edgeId: string;
  source: string;
  target: string;
  label?: string;
  condition?: Condition;
}
```

---

## Service 11: REZ Conversation Intelligence

**Path:** `REZ-Intelligence/rez-conversation-intelligence/`

### Files

```
rez-conversation-intelligence/
├── src/
│ ├── index.ts
│ ├── models/
│ │   ├── ConversationSample.ts
│ │   ├── Feedback.ts
│ │   └── TrainingBatch.ts
│ ├── services/
│ │   ├── conversationLogger.ts
│ │   ├── intentExtractor.ts
│ │   ├── sentimentAnalyzer.ts
│ │   ├── outcomeTracker.ts
│ │   ├── feedbackLoop.ts
│ │   └── trainingExporter.ts
│ ├── pipelines/
│ │   ├── extraction.ts
│ │   ├── labeling.ts
│ │   └── export.ts
│ └── schedulers/
│       ├── dailyExport.ts
│       └── modelUpdate.ts
└── README.md
```

### Training Data Format

```typescript
interface TrainingSample {
  id: string;
  type: 'CONVERSATION' | 'INTENT' | 'RESPONSE';

  // Input
  input: {
    text: string;
    channel: string;
    context: {
      merchantId: string;
      userId: string;
      timeOfDay: string;
      dayOfWeek: string;
      location?: string;
      device?: string;
    };
    previousMessages?: string[];
  };

  // Labels
  labels: {
    intent: string;
    entities: Record<string, string>;
    sentiment?: string;
    correctResponse?: string;
    actionTaken?: string;
  };

  // Outcome (learned later)
  outcome?: {
    type: 'CONVERTED' | 'ABANDONED' | 'ESCALATED' | 'RESOLVED';
    revenue?: number;
    timeToResolution?: number;
    satisfactionScore?: number;
  };

  // Metadata
  metadata: {
    source: 'production' | 'manual' | 'synthetic';
    confidence: number;
    reviewed: boolean;
    createdAt: Date;
  };
}
```

---

## Service 12: REZ Merchant WhatsApp Manager

**Path:** `REZ-Media/rez-merchant-whatsapp-manager/`

### Features

```typescript
interface WhatsAppManagerFeatures {
  // Number Management
  numbers: {
    list: () => Promise<PhoneNumber[]>;
    add: (number: string) => Promise<void>;
    remove: (number: string) => Promise<void>;
    setDefault: (number: string) => Promise<void>;
  };

  // Template Management
  templates: {
    list: () => Promise<Template[]>;
    create: (template: TemplateInput) => Promise<Template>;
    checkStatus: (templateId: string) => Promise<Template>;
  };

  // Quick Replies
  quickReplies: {
    list: () => Promise<QuickReply[]>;
    create: (reply: QuickReplyInput) => Promise<QuickReply>;
    update: (id: string, reply: QuickReplyInput) => Promise<QuickReply>;
    delete: (id: string) => Promise<void>;
  };

  // Auto-Responses
  autoResponses: {
    getAwayMessage: () => Promise<string>;
    setAwayMessage: (message: string) => Promise<void>;
    getOfflineMessage: () => Promise<string>;
    setOfflineMessage: (message: string) => Promise<void>;
  };

  // Analytics
  analytics: {
    conversations: () => Promise<ConversationStats>;
    messages: () => Promise<MessageStats>;
    responseTime: () => Promise<ResponseTimeStats>;
  };

  // Conversation History
  conversations: {
    list: (filters: Filters) => Promise<Conversation[]>;
    view: (conversationId: string) => Promise<ConversationDetail>;
    export: (dateRange: DateRange) => Promise<string>;
  };
}
```

---

# BUSINESS MODEL

## Revenue Streams

| Stream | Description | Pricing |
|--------|-------------|---------|
| WhatsApp Messages | Per message credit | ₹0.10/credit |
| AI Voice Calls | Per minute credit | ₹0.50/credit |
| Campaign Sends | Per recipient | ₹1.00/credit |
| Monthly Plans | Subscription | ₹999 - ₹9,999/month |
| Credit Recharge | Margin on credits | 10-40% |

## Merchant Plans

| Feature | Starter | Professional | Enterprise |
|---------|---------|---------------|------------|
| Price | Free | ₹999/month | Custom |
| WhatsApp Messages | 100/month | 1,000/month | Unlimited |
| AI Voice Minutes | 0 | 100/month | Unlimited |
| WhatsApp Numbers | 1 | 3 | Unlimited |
| Chatbot Flows | 3 | 20 | Unlimited |
| AI Agents | Basic | Advanced | Custom |
| API Access | No | Yes | Yes |
| White-label | No | No | Yes |
| SLA | None | 99.9% | 99.99% |
| Support | Community | Email | Dedicated |

## Credit Pricing

| Bundle | Credits | Price | Per Credit | Savings |
|--------|---------|-------|------------|---------|
| Pay-as-you-go | 500 | ₹50 | ₹0.10 | - |
| Starter | 1,000 | ₹90 | ₹0.09 | 10% |
| Pro | 5,000 | ₹400 | ₹0.08 | 20% |
| Business | 10,000 | ₹700 | ₹0.07 | 30% |
| Enterprise | 50,000 | ₹3,000 | ₹0.06 | 40% |

---

# IMPLEMENTATION ROADMAP

## Phase 1: Foundation (Weeks 1-4)

### Week 1-2: REZ Media Wallet Service

| Task | Days | Owner |
|------|------|-------|
| Project setup | 1 | - |
| Database models | 1 | - |
| Core wallet service | 2 | - |
| Recharge integration | 2 | - |
| API endpoints | 1 | - |
| Testing | 1 | - |
| Documentation | 1 | - |

### Week 2-3: REZ WhatsApp Provisioning

| Task | Days | Owner |
|------|------|-------|
| Twilio subaccount setup | 2 | - |
| Number provisioning | 2 | - |
| WABA management | 2 | - |
| Template service | 1 | - |
| Testing | 2 | - |

### Week 3-4: Voice Billing Service

| Task | Days | Owner |
|------|------|-------|
| Call tracking | 2 | - |
| Credit deduction | 2 | - |
| Analytics | 1 | - |
| Testing | 2 | - |

## Phase 2: Core Intelligence (Weeks 5-8)

### Week 5-6: Unified Conversation Engine

| Task | Days | Owner |
|------|------|-------|
| Channel router | 2 | - |
| Context manager | 2 | - |
| Session storage | 1 | - |
| Intent processor | 2 | - |
| Agent router | 1 | - |
| Testing | 2 | - |

### Week 7-8: AI Agents (Sales, Support, Consultant, Info)

| Task | Days | Owner |
|------|------|-------|
| Sales Agent | 3 | - |
| Support Agent | 3 | - |
| Consultant Agent | 2 | - |
| Info Agent | 2 | - |
| Integration with Engine | 2 | - |

## Phase 3: Commerce (Weeks 9-12)

### Week 9-10: WhatsApp Commerce

| Task | Days | Owner |
|------|------|-------|
| Product catalog | 2 | - |
| Cart management | 2 | - |
| Checkout flow | 2 | - |
| Payment integration | 2 | - |
| Order creation | 1 | - |

### Week 11-12: Chatbot Builder

| Task | Days | Owner |
|------|------|-------|
| Flow engine | 2 | - |
| Node types | 2 | - |
| UI components | 3 | - |
| Testing | 2 | - |

## Phase 4: Intelligence (Weeks 13-16)

### Week 13-14: Conversation Intelligence

| Task | Days | Owner |
|------|------|-------|
| Logger | 2 | - |
| Intent extraction | 2 | - |
| Sentiment analysis | 1 | - |
| Outcome tracking | 2 | - |
| Training export | 1 | - |

### Week 15-16: Integrations & Polish

| Task | Days | Owner |
|------|------|-------|
| Voice AI integration | 2 | - |
| Merchant Copilot upgrade | 2 | - |
| Merchant Dashboard | 2 | - |
| E2E testing | 2 | - |

## Phase 5: Launch (Weeks 17-20)

| Task | Weeks | Owner |
|------|-------|-------|
| Beta testing | 1 | - |
| Bug fixes | 1 | - |
| Documentation | 1 | - |
| Training materials | 1 | - |
| Go live | 1 | - |

---

# DEPENDENCY MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPENDENCY GRAPH                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 0: Foundation (No dependencies)
│
├── REZ Auth Service (EXISTING)
├── REZ User Graph (EXISTING)
└── REZ Agent OS (EXISTING)
    │
    ▼
Layer 1: Infrastructure
│
├── REZ Media Wallet Service (NEW)
│   └── Dependencies: REZ Auth, RABTUL Wallet
│
├── REZ WhatsApp Provisioning (NEW)
│   └── Dependencies: REZ Auth, Twilio API
│
└── REZ Voice Billing (NEW)
    └── Dependencies: REZ Auth, Twilio Voice
    │
    ▼
Layer 2: Core Intelligence
│
├── REZ Unified Conversation Engine (NEW)
│   └── Dependencies: REZ Agent OS, REZ Intent Graph, All Layer 1 services
│
├── REZ Sales Agent (NEW)
│   └── Dependencies: REZ Agent OS, REZ Unified Engine
│
├── REZ Support Agent (NEW)
│   └── Dependencies: REZ Agent OS, REZ Unified Engine, REZ Order Service
│
├── REZ Consultant Agent (NEW)
│   └── Dependencies: REZ Agent OS, REZ Unified Engine, REZ Catalog
│
└── REZ Info Agent (NEW)
    └── Dependencies: REZ Agent OS, REZ Unified Engine, REZ Knowledge Graph
    │
    ▼
Layer 3: Commerce
│
├── REZ WhatsApp Commerce (NEW)
│   └── Dependencies: REZ Unified Engine, REZ Media Wallet, REZ Order Service
│
└── REZ Chatbot Builder (NEW)
    └── Dependencies: REZ Unified Engine, REZ WhatsApp Commerce
    │
    ▼
Layer 4: Intelligence & Learning
│
├── REZ Conversation Intelligence (NEW)
│   └── Dependencies: REZ Unified Engine, REZ Intent Graph
│
└── REZ Merchant WhatsApp Manager (NEW)
    └── Dependencies: REZ WhatsApp Provisioning, REZ Unified Engine
    │
    ▼
Layer 5: Integration & UI
│
├── Merchant Copilot Upgrade (UPGRADE)
│   └── Dependencies: REZ Media Wallet, REZ Conversation Intelligence
│
├── Merchant Dashboard (NEW)
│   └── Dependencies: All Layer 1-4 services
│
└── Voice AI Integration (UPGRADE)
    └── Dependencies: REZ Unified Engine, REZ Voice Billing
```

---

# RISK ASSESSMENT

## Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Twilio API changes | High | Medium | Abstraction layer, version pinning |
| WhatsApp policy changes | High | Medium | Compliance monitoring, flexible templates |
| Voice latency | Medium | Low | Multi-region deployment, fallback to text |
| Scalability | Medium | Low | Horizontal scaling, caching |
| Data privacy | High | Low | Encryption, GDPR compliance |

## Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Merchant adoption | High | Medium | Strong onboarding, success stories |
| Credit pricing | Medium | Low | Tiered pricing, flexibility |
| Competition | Medium | Medium | Continuous improvement, differentiation |
| Regulatory | Medium | Low | Legal review, compliance |

## Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Support load | Medium | Medium | Self-service tools, documentation |
| System downtime | High | Low | Monitoring, alerts, SLA |
| Data quality | Medium | Medium | Validation, feedback loops |

---

# SUCCESS METRICS

## Technical Metrics

| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| API Latency | < 200ms |
| Voice Latency | < 500ms |
| Message Delivery | 99.5% |
| Error Rate | < 0.1% |

## Business Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Active Merchants | 1,000 |
| Monthly Revenue | ₹50 Lakhs |
| WhatsApp Conversations | 10 Lakhs/month |
| Voice Minutes | 1 Lakh/month |
| AI Resolution Rate | 80% |
| Customer Satisfaction | 4.5/5 |

## AI Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Intent Accuracy | 95% |
| Response Relevance | 90% |
| Training Samples | 1 Lakh |
| Model Update Frequency | Weekly |
| Self-Improvement Rate | 10%/month |

---

# APPENDIX

## A. Service Ports

| Service | Port | Environment |
|---------|------|-------------|
| REZ Media Wallet | 4010 | Development |
| REZ WhatsApp Provisioning | 4011 | Development |
| REZ Voice Billing | 4012 | Development |
| REZ Unified Engine | 4013 | Development |
| REZ Sales Agent | 4064 | Development |
| REZ Support Agent | 4065 | Development |
| REZ Consultant Agent | 4066 | Development |
| REZ Info Agent | 4067 | Development |
| REZ WhatsApp Commerce | 4014 | Development |
| REZ Chatbot Builder | 4015 | Development |
| REZ Conversation Intelligence | 4016 | Development |
| REZ Merchant WhatsApp Manager | 4017 | Development |
| Merchant Copilot | 4022 | Development |
| REZ Voice AI | 4060 | Development |

## B. Environment Variables

```bash
# REZ Media Wallet
MEDIA_WALLET_PORT=4010
RAZORPAY_KEY_ID=xxx
RAZORPAY_KEY_SECRET=xxx
MEDIA_WALLET_ENCRYPTION_KEY=xxx

# REZ WhatsApp Provisioning
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
WHATSAPP_PROVISIONING_PORT=4011

# REZ Voice Billing
VOICE_BILLING_PORT=4012
VOICE_CREDITS_PER_MINUTE=1
VOICE_COST_PER_CREDIT=0.50

# REZ Unified Engine
UNIFIED_ENGINE_PORT=4013
INTENT_GRAPH_URL=http://localhost:4005
AGENT_OS_URL=http://localhost:4062

# WhatsApp Commerce
WHATSAPP_COMMERCE_PORT=4014
CATALOG_SERVICE_URL=http://localhost:4003
ORDER_SERVICE_URL=http://localhost:4001
```

## C. Database Connections

| Service | Database | Collection/Table |
|---------|----------|------------------|
| REZ Media Wallet | MongoDB | mediaWallets, transactions, recharges |
| REZ WhatsApp Provisioning | MongoDB | merchantWhatsApps, phoneNumbers, templates |
| REZ Voice Billing | MongoDB | callSessions, callRecords |
| REZ Unified Engine | MongoDB | conversations, sessions, messages |
| REZ Conversation Intelligence | MongoDB | conversationSamples, trainingBatches |
| All | Redis | Session cache, rate limiting |

## D. External Dependencies

| Service | Provider | Purpose |
|---------|-----------|---------|
| WhatsApp | Twilio | Business API |
| SMS | Twilio | SMS sending |
| Voice | Twilio | Voice calls |
| Payments | Razorpay | Credit purchase |
| STT | OpenAI Whisper | Speech to text |
| TTS | ElevenLabs | Text to speech |
| Email | SendGrid | Email sending |
| Push | Firebase | Notifications |
