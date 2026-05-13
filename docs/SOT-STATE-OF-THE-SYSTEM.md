# REZ ECOSYSTEM - STATE OF THE SYSTEM (SOT)

**Version:** 3.0
**Date:** May 12, 2026
**Status:** Complete

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Service Inventory](#3-service-inventory)
4. [Integration Specifications](#4-integration-specifications)
5. [Service Connections](#5-service-connections)
6. [API Registry](#6-api-registry)
7. [Data Models](#7-data-models)
8. [Deployment](#8-deployment)
9. [Quick Reference](#9-quick-reference)

---

# 1. EXECUTIVE SUMMARY

## System Overview

REZ is a **Social Commerce Infrastructure Platform** with 200+ microservices providing:

| Capability | Description |
|------------|-------------|
| **Multi-Channel** | WhatsApp, Voice, Instagram, Website, App, Future: FB, Telegram, Email |
| **Multi-Agent** | 16+ AI agents (8 Domain + 8 Functional) |
| **Commerce** | Orders, Payments, Wallet, Booking, Catalog |
| **Intelligence** | ML, Recommendations, Personalization, Analytics |
| **Infrastructure** | Event Bus, Queue, Cache, Auth, Security |

## Key Numbers

| Metric | Count |
|--------|-------|
| **Total Services** | 200+ |
| **AI Agents** | 50+ |
| **Domain Experts** | 8 |
| **Functional Experts** | 8 |
| **API Endpoints** | 1000+ |
| **Databases** | MongoDB, Redis, Elasticsearch, Kafka |
| **Documentation** | 50+ specs |

---

# 2. ARCHITECTURE OVERVIEW

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WhatsApp     Voice      Website      App      Instagram      Future     │
│     │           │           │          │           │            │         │
│     └───────────┴───────────┴──────────┴───────────┴────────────┘         │
│                              │                                             │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHANNEL BRIDGE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WhatsApp Bridge  Voice Bridge   Web Widget   App Bridge   IG Bridge       │
│  (Port 4076)     (Port 4077)   (Port 4078) (Port 4079) (Port 4090)   │
│                                                                          │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  REZ ORCHESTRATOR v2 (Port 4070)                                   │  │
│  │  ├── Priority Engine (Port 4080)                                    │  │
│  │  ├── Confidence Scorer (Port 4081)                                  │  │
│  │  └── Context Engine (Port 4071)                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                               │                                            │
│                               ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  EVENT BUS (Port 4082)                                              │  │
│  │  └── Redis Pub/Sub + Kafka                                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                      │
│  │    DOMAIN EXPERTS    │  │  FUNCTIONAL EXPERTS  │                      │
│  ├──────────────────────┤  ├──────────────────────┤                      │
│  │ Hospitality (3000)  │  │ Support     (3002)   │                      │
│  │ Culinary     (3001)  │  │ Sales       (3001)   │                      │
│  │ Fitness      (3010)  │  │ Loyalty     (NEW)   │                      │
│  │ Health       (3011)  │  │ Fraud       (NEW)   │                      │
│  │ Travel       (3003)  │  │ Wallet      (EX)    │                      │
│  │ Retail       (3004)  │  │ Analytics   (EX)    │                      │
│  │ Salon        (3005)  │  │ Campaign    (EX)    │                      │
│  │ Education    (3006)  │  │ Notification(EX)    │                      │
│  └──────────────────────┘  └──────────────────────┘                      │
│                                                                          │
│  EX = Existing in RABTUL-Technologies                                   │
│                                                                          │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTELLIGENCE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐   │
│  │     CORE BRAIN      │  │    ML SERVICES       │  │  RECOMMENDATION│   │
│  │   Memory, Session,   │  │  ML Models, Feature │  │   ENGINE       │   │
│  │   Personalization,    │  │  Store, Registry    │  │  Products,     │   │
│  │   Loyalty, Context    │  │                     │  │  Users, Content│   │
│  │   (Port 4072)        │  │   (Port 4102)        │  │  (Port 4015)   │   │
│  └──────────────────────┘  └──────────────────────┘  └────────────────┘   │
│                                                                          │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMMERCE LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ PAYMENT   │ │  WALLET  │ │  ORDER   │ │ BOOKING  │ │ CATALOG  │  │
│  │ SERVICE   │ │ SERVICE  │ │ SERVICE  │ │ SERVICE  │ │ SERVICE  │  │
│  │(Port4001) │ │(EX)      │ │(Port3008)│ │(Port4020)│ │(EX)      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ DELIVERY  │ │NOTIFY   │ │ GAMIFY   │ │ ANALYTICS│ │ SEARCH   │  │
│  │ SERVICE   │ │SERVICE  │ │ SERVICE  │ │ SERVICE  │ │ SERVICE  │  │
│  │(EX)       │ │(Port4023)│ │(EX)      │ │(EX)      │ │(Port4024)│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                          │
│  EX = Existing in RABTUL-Technologies                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ MONGODB  │ │  REDIS   │ │ KAFKA    │ │ELASTIC   │ │AUTH      │  │
│  │ Database │ │  Cache   │ │  Queue   │ │ SEARCH   │ │ SERVICE  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │CIRCUIT   │ │  RETRY   │ │  DLQ     │ │ IDEMPOT  │ │ AUDIT   │  │
│  │BREAKER   │ │ SERVICE  │ │ SERVICE  │ │ SERVICE  │ │ SERVICE  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. SERVICE INVENTORY

## 3.1 REZ-Intelligence (AI Layer)

### Orchestration Services

| Service | Port | Description | Dependencies |
|---------|------|-------------|--------------|
| **rez-orchestrator-v2** | 4070 | Main orchestrator, routing, collaboration | Core Brain, Context Engine |
| **rez-context-engine** | 4071 | Entry point detection, routing rules | Redis |
| **rez-core-brain** | 4072 | Memory, session, personalization, loyalty | MongoDB, Redis |
| **rez-event-bus** | 4082 | Event publishing (Redis + Kafka) | Redis, Kafka |
| **rez-priority-engine** | 4080 | Priority resolution | Redis |
| **rez-confidence-scorer** | 4081 | Agent confidence scoring | MongoDB |

### Domain Expert Agents

| Service | Port | Industry | Intents |
|---------|------|----------|---------|
| **rez-hospitality-expert** | 3000 | Hotels, Stays | 16 |
| **rez-culinary-expert** | 3001 | Restaurants, Food | 20+ |
| **rez-fitness-expert** | 3010 | Gyms, Wellness | 14 |
| **rez-health-expert** | 3011 | Healthcare, Clinics | 14 |
| **rez-travel-expert** | 3003 | Tourism, Travel | 10+ |
| **rez-retail-expert** | 3004 | Shopping, E-commerce | 10+ |
| **rez-salon-expert** | 3005 | Beauty, Spa | 10+ |
| **rez-education-expert** | 3006 | Learning, Courses | 20 |

### Functional Expert Agents

| Service | Port | Function | Status |
|---------|------|----------|--------|
| **rez-sales-agent** | 3001 | Conversion, upsell | Built |
| **rez-support-agent** | 3002 | Issues, complaints | Built |
| **rez-consultant-agent** | 3003 | Consulting | Built |
| **rez-info-agent** | 3004 | Information | Built |
| **Loyalty Agent** | TBD | Points, rewards | Connect |
| **Fraud Agent** | TBD | Risk detection | Connect |
| **Analytics Agent** | TBD | Insights | Connect |
| **Campaign Agent** | TBD | Marketing | Connect |

### AI/ML Services

| Service | Port | Description |
|---------|------|-------------|
| **REZ-autonomous-agents** | 4062 | 30 AI agents |
| **REZ-recommendation-engine** | 4015 | Product/content recommendations |
| **REZ-personalization-engine** | 4017 | User behavior profiles |
| **REZ-identity-graph** | 4050 | Cross-app identity |
| **REZ-action-engine** | 4009 | Decision execution |
| **REZ-conversation-intelligence** | - | Chat analysis |
| **REZ-ml-models** | 4102 | ML inference |
| **REZ-intent-predictor** | - | Intent prediction |

### Infrastructure Services

| Service | Port | Description |
|---------|------|-------------|
| **rez-agent-registry** | 4073 | Agent registration, health |
| **rez-permission-system** | 4084 | Role-based access |
| **REZ-event-bus** | 4082 | Event publishing |
| **rez-tool-registry** | 4083 | Tool discovery |
| **REZ-validation-dashboard** | 4100 | KPI tracking |

---

## 3.2 REZ-Media (Commerce Layer)

### WhatsApp Commerce

| Service | Port | Description |
|---------|------|-------------|
| **rez-whatsapp-store** | - | In-chat checkout |
| **rez-whatsapp-commerce** | - | Native catalog |
| **rez-whatsapp-provisioning** | - | Multi-tenant WhatsApp |
| **rez-whatsapp-orchestrator-bridge** | 4080 | Bridge to Orchestrator |

### Instagram Commerce

| Service | Port | Description |
|---------|------|-------------|
| **rez-instagram-bridge** | 4090 | IG webhooks, DM routing |
| **rez-instagram-sales-agent** | 4091 | AI Instagram commerce |

### Marketing & Analytics

| Service | Port | Description |
|---------|------|-------------|
| **rez-marketing-dashboard** | - | Campaign dashboard |
| **REZ-attribution-dashboard** | - | Attribution tracking |
| **rez-automation-service** | - | Marketing automation |
| **REZ-lead-intelligence** | - | Lead scoring |
| **REZ-creative-engine** | - | AI ad copy |

### Notifications

| Service | Port | Description |
|---------|------|-------------|
| **REZ-communications-platform** | - | Multi-channel |
| **REZ-marketing** | 4026 | Email automation |

---

## 3.3 RABTUL-Technologies (Backend Services)

### Payments & Finance

| Service | Port | Description |
|---------|------|-------------|
| **rez-payment-service** | 4001 | Razorpay, payments |
| **rez-wallet-service** | - | REZ Coins, credits |
| **rez-bill-payments-service** | - | Bill payments |
| **REZ-ledger-service** | - | Double-entry bookkeeping |

### Orders & Fulfillment

| Service | Port | Description |
|---------|------|-------------|
| **rez-order-service** | 3008 | Order lifecycle |
| **rez-delivery-service** | - | Route optimization |
| **rez-return-service** | - | Return processing |

### Bookings

| Service | Port | Description |
|---------|------|-------------|
| **rez-booking-service** | 4020 | Reservations |

### Catalog & Search

| Service | Port | Description |
|---------|------|-------------|
| **rez-catalog-service** | - | Product catalog |
| **rez-search-service** | 4024 | Elasticsearch |

### Analytics & Notifications

| Service | Port | Description |
|---------|------|-------------|
| **rez-analytics-service** | - | Business intelligence |
| **rez-notifications-service** | 4023 | Push, SMS, email |

### Loyalty & Gamification

| Service | Port | Description |
|---------|------|-------------|
| **REZ-gamification-service** | - | Points, streaks, badges |
| **rez-cashback-service** | - | Cashback |
| **rez-creator-earnings-service** | - | Revenue sharing |

### Infrastructure

| Service | Port | Description |
|---------|------|-------------|
| **rez-auth-service** | 4018 | JWT, OTP, OAuth |
| **REZ-api-keys** | - | API key management |
| **REZ-contract-service** | - | Contracts |
| **REZ-secrets-manager** | - | Secret storage |

---

# 4. INTEGRATION SPECIFICATIONS

## 4.1 Orchestrator → Core Brain

### Purpose
Get user context before routing to expert.

### Endpoint
```
POST http://localhost:4072/api/context/:sessionId
```

### Request
```json
{
  "sessionId": "sess_123",
  "userId": "user_456",
  "merchantId": "merchant_789",
  "entryPoint": "WHATSAPP",
  "qrType": "RESTAURANT"
}
```

### Response
```json
{
  "user": {
    "id": "user_456",
    "name": "John",
    "loyaltyTier": "GOLD",
    "points": 5200,
    "preferences": {
      "dietary": ["vegetarian"],
      "language": "en"
    }
  },
  "merchant": {
    "id": "merchant_789",
    "category": "RESTAURANT",
    "services": ["delivery", "pickup"]
  },
  "session": {
    "history": [...],
    "recentIntents": ["VIEW_MENU"]
  }
}
```

### Integration Code
```typescript
// In Orchestrator messageProcessor.ts
const context = await fetch(`${CORE_BRAIN_URL}/api/context/${sessionId}`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_TOKEN },
  body: JSON.stringify({ sessionId, userId, merchantId, entryPoint })
});
```

---

## 4.2 Orchestrator → Expert Agent

### Purpose
Route message to best expert agent.

### Endpoint
```
POST http://localhost:3001/api/chat
```

### Request
```json
{
  "message": "I want to order biryani",
  "userId": "user_456",
  "merchantId": "merchant_789",
  "sessionId": "sess_123",
  "context": {
    "user": { "preferences": {...} },
    "merchant": { "category": "RESTAURANT" },
    "personalization": { "tone": "casual" }
  }
}
```

### Response
```json
{
  "response": "Here's our biryani menu! 🍚",
  "intent": "ORDER_FOOD",
  "confidence": 0.92,
  "actions": [{ "type": "SHOW_MENU", "items": [...] }]
}
```

### Integration Code
```typescript
// In Orchestrator agentSwitcher.ts
const response = await axios.post(`${expertUrl}/api/chat`, {
  message,
  userId,
  merchantId,
  sessionId,
  context: enrichedContext
}, {
  headers: { 'X-Internal-Token': INTERNAL_TOKEN },
  timeout: 5000
});
```

---

## 4.3 Expert → Payment Service

### Purpose
Process payment for order.

### Endpoint
```
POST http://localhost:4001/api/payments/initiate
```

### Request
```json
{
  "orderId": "order_123",
  "amount": 299,
  "currency": "INR",
  "method": "UPI",
  "userId": "user_456",
  "merchantId": "merchant_789",
  "callbackUrl": "http://rez-orchestrator/callback/payment"
}
```

### Response
```json
{
  "transactionId": "txn_abc123",
  "status": "PENDING",
  "paymentUrl": "https://razorpay.com/..."
}
```

### Integration Code
```typescript
// In Payment/Order service
const payment = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_TOKEN },
  body: JSON.stringify({ orderId, amount, method, userId })
});
```

---

## 4.4 Expert → Wallet Service

### Purpose
Check balance, deduct credits.

### Endpoint
```
POST http://localhost:4001/api/wallet/deduct
```

### Request
```json
{
  "userId": "user_456",
  "amount": 100,
  "type": "REZ_COINS",
  "merchantId": "merchant_789",
  "reference": "order_123"
}
```

### Response
```json
{
  "success": true,
  "newBalance": 500,
  "transactionId": "wallet_txn_456"
}
```

---

## 4.5 Expert → Notification Service

### Purpose
Send notifications to users.

### Endpoint
```
POST http://localhost:4023/api/notifications/send
```

### Request
```json
{
  "userId": "user_456",
  "channel": "WHATSAPP",
  "template": "order_confirmation",
  "data": {
    "orderId": "order_123",
    "items": ["Biryani"],
    "total": 299
  }
}
```

### Response
```json
{
  "notificationId": "notif_789",
  "status": "SENT"
}
```

---

## 4.6 Expert → Order Service

### Purpose
Create, update, track orders.

### Endpoint
```
POST http://localhost:3008/api/orders
```

### Request
```json
{
  "userId": "user_456",
  "merchantId": "merchant_789",
  "items": [
    { "productId": "prod_1", "quantity": 1, "price": 299 }
  ],
  "total": 299,
  "paymentMethod": "UPI"
}
```

### Response
```json
{
  "orderId": "order_123",
  "status": "CREATED",
  "estimatedDelivery": "30 mins"
}
```

---

## 4.7 Expert → Booking Service

### Purpose
Create reservations.

### Endpoint
```
POST http://localhost:4020/api/bookings
```

### Request
```json
{
  "userId": "user_456",
  "merchantId": "merchant_789",
  "type": "TABLE",
  "date": "2026-05-15",
  "time": "19:00",
  "guests": 4,
  "specialRequests": "Window seat"
}
```

### Response
```json
{
  "bookingId": "book_123",
  "status": "CONFIRMED",
  "confirmationCode": "ABC123"
}
```

---

## 4.8 Expert → Analytics Service

### Purpose
Track events, get insights.

### Endpoint
```
POST http://localhost:4001/api/events
```

### Request
```json
{
  "event": "INTENT_DETECTED",
  "userId": "user_456",
  "merchantId": "merchant_789",
  "data": {
    "intent": "ORDER_FOOD",
    "confidence": 0.92,
    "agentType": "CULINARY"
  },
  "timestamp": "2026-05-12T10:30:00Z"
}
```

---

## 4.9 Event Bus → All Services

### Purpose
Publish/subscribe to events.

### Publish Endpoint
```
POST http://localhost:4082/api/events/publish
```

### Request
```json
{
  "eventType": "ORDER_CREATED",
  "payload": {
    "orderId": "order_123",
    "userId": "user_456",
    "total": 299
  },
  "context": {
    "userId": "user_456",
    "merchantId": "merchant_789",
    "traceId": "trace_abc"
  }
}
```

### Subscribe (Redis Pub/Sub)
```
Channel: events:ORDER_CREATED
Message: { ... }
```

---

## 4.10 WhatsApp Bridge → Orchestrator

### Purpose
Route WhatsApp messages through orchestrator.

### Flow
```
User sends WhatsApp message
    ↓
WhatsApp webhook receives
    ↓
WhatsApp Bridge (Port 4076)
    ↓
Extract session/user context
    ↓
POST to Orchestrator /api/message
    ↓
Orchestrator routes to Expert
    ↓
Expert generates response
    ↓
WhatsApp Bridge sends reply
```

### Endpoint
```
POST http://localhost:4070/api/message
```

### Request
```json
{
  "message": "I want to order food",
  "channel": "WHATSAPP",
  "userId": "wa_user_123",
  "sessionId": "sess_123",
  "merchantId": "merchant_789"
}
```

---

# 5. SERVICE CONNECTIONS

## 5.1 Message Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MESSAGE FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────┘

User Message
     │
     ▼
┌─────────────┐
│   WhatsApp  │  ← User sends message on WhatsApp
└─────────────┘
     │
     ▼
┌─────────────────┐
│ WhatsApp Bridge  │  ← Receive webhook, extract context
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Orchestrator   │  ← Route to best expert
└─────────────────┘
     │
     ├──→ Context Engine (Get routing rules)
     │
     ├──→ Core Brain (Get user context)
     │
     └──→ Priority Engine (Resolve priority)
     │
     ▼
┌─────────────────┐
│ Expert Agent    │  ← Generate response
└─────────────────┘
     │
     ├──→ Payment Service (If payment needed)
     ├──→ Wallet Service (If coins needed)
     ├──→ Order Service (If order created)
     ├──→ Booking Service (If booking)
     └──→ Notification Service (Send updates)
     │
     ▼
┌─────────────────┐
│ Core Brain      │  ← Save to memory
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Event Bus       │  ← Publish event
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Expert Response │  ← Return to orchestrator
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ WhatsApp Bridge │  ← Send to user
└─────────────────┘
     │
     ▼
User receives reply
```

---

## 5.2 Order Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER FLOW                                           │
└─────────────────────────────────────────────────────────────────────────────┘

User: "Order biryani"
     │
     ▼
┌─────────────────┐
│ Culinary Expert │  ← Detect ORDER_FOOD intent
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Order Service   │  ← Create order (status: CREATED)
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Event: ORDER_CREATED │
└─────────────────┘
     │
     ├──→ Analytics (Track event)
     ├──→ Notification (Send confirmation)
     └──→ Orchestrator (Continue flow)
     │
     ▼
User: "Pay with REZ Coins"
     │
     ▼
┌─────────────────┐
│ Wallet Service  │  ← Deduct coins
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Payment Service │  ← Process payment
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Order Service   │  ← Update status: PAID
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Event: ORDER_PAID │
└─────────────────┘
     │
     ├──→ Analytics
     ├──→ Notification (Order confirmed)
     └──→ Delivery Service (If delivery)
     │
     ▼
User receives confirmation
```

---

## 5.3 Multi-Agent Collaboration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT COLLABORATION                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User: "What should I eat after gym?"
     │
     ▼
┌─────────────────┐
│ Orchestrator    │
└─────────────────┘
     │
     ├──→ Priority: DOMAIN (context is gym)
     └──→ Confidence: Fitness 85%, Culinary 70%
     │
     ▼
┌─────────────────┐
│ Fitness Expert  │
└─────────────────┘
     │
     Context: User burned 400 calories, needs protein
     │
     ▼
┌─────────────────┐
│ Culinary Expert │  ← Collaboration detected
└─────────────────┘
     │
     Receives: Fitness context
     │
     ▼
Response: "Based on your workout, I recommend Grilled Chicken 
          Bowl with 45g protein!"
```

---

# 6. API REGISTRY

## 6.1 Authentication

All internal service calls require:
```
Headers:
  X-Internal-Token: <service-token>
  Content-Type: application/json
```

## 6.2 Service Endpoints

### REZ-Intelligence

| Service | Port | Base URL | Key Endpoints |
|---------|------|----------|--------------|
| Orchestrator | 4070 | http://localhost:4070 | POST /api/message |
| Context Engine | 4071 | http://localhost:4071 | POST /api/context |
| Core Brain | 4072 | http://localhost:4072 | GET /api/memory/:userId |
| Event Bus | 4082 | http://localhost:4082 | POST /api/events/publish |
| Priority Engine | 4080 | http://localhost:4080 | POST /api/priority |
| Confidence Scorer | 4081 | http://localhost:4081 | POST /api/score |
| Agent Registry | 4073 | http://localhost:4073 | GET /api/agents |
| Permission System | 4084 | http://localhost:4084 | POST /api/check |

### Expert Agents

| Service | Port | Base URL | Key Endpoints |
|---------|------|----------|--------------|
| Hospitality | 3000 | http://localhost:3000 | POST /api/chat |
| Culinary | 3001 | http://localhost:3001 | POST /api/chat |
| Fitness | 3010 | http://localhost:3010 | POST /api/chat |
| Health | 3011 | http://localhost:3011 | POST /api/chat |
| Travel | 3003 | http://localhost:3003 | POST /api/chat |
| Retail | 3004 | http://localhost:3004 | POST /api/chat |
| Salon | 3005 | http://localhost:3005 | POST /api/chat |
| Education | 3006 | http://localhost:3006 | POST /api/chat |

### REZ-Media

| Service | Port | Base URL | Key Endpoints |
|---------|------|----------|--------------|
| WhatsApp Bridge | 4076 | http://localhost:4076 | POST /webhook/whatsapp |
| Instagram Bridge | 4090 | http://localhost:4090 | POST /webhook/instagram |
| IG Sales Agent | 4091 | http://localhost:4091 | POST /chat |

### RABTUL-Technologies

| Service | Port | Base URL | Key Endpoints |
|---------|------|----------|--------------|
| Payment | 4001 | http://localhost:4001 | POST /api/payments/initiate |
| Auth | 4018 | http://localhost:4018 | POST /api/auth/verify |
| Order | 3008 | http://localhost:3008 | POST /api/orders |
| Booking | 4020 | http://localhost:4020 | POST /api/bookings |
| Notifications | 4023 | http://localhost:4023 | POST /api/notifications/send |
| Search | 4024 | http://localhost:4024 | GET /api/search |
| Marketing | 4026 | http://localhost:4026 | POST /api/campaigns |

---

# 7. DATA MODELS

## 7.1 Core Entities

### User
```typescript
interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  loyalty: {
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    points: number;
    joinedAt: Date;
  };
  preferences: {
    language: string;
    tone: 'formal' | 'casual' | 'friendly';
    dietary?: string[];
  };
  linkedAccounts: {
    whatsapp?: string;
    instagram?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Merchant
```typescript
interface Merchant {
  id: string;
  name: string;
  category: 'RESTAURANT' | 'HOTEL' | 'RETAIL' | 'GYM' | 'CLINIC' | 'SALON';
  subcategory?: string;
  services: string[];
  address: Address;
  hours: BusinessHours;
  isActive: boolean;
  createdAt: Date;
}
```

### Order
```typescript
interface Order {
  id: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'CREATED' | 'PAID' | 'PREPARING' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  payment: {
    method: 'UPI' | 'CARD' | 'WALLET' | 'COD';
    transactionId?: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Session
```typescript
interface Session {
  id: string;
  userId: string;
  merchantId: string;
  channel: 'WHATSAPP' | 'VOICE' | 'INSTAGRAM' | 'WEB' | 'APP';
  entryPoint: 'QR' | 'APP' | 'DIRECT' | 'CAMPAIGN';
  currentExpert?: string;
  recentIntents: string[];
  context: Record<string, any>;
  startedAt: Date;
  lastActivityAt: Date;
}
```

---

# 8. DEPLOYMENT

## 8.1 Service Ports

| Port Range | Service Type |
|------------|-------------|
| 3000-3010 | Expert Agents |
| 4000-4100 | Business Services |
| 4070-4099 | Orchestration & Bridges |
| 4100+ | Analytics & ML |

## 8.2 Environment Variables

### Core Services
```bash
# Common
NODE_ENV=development
LOG_LEVEL=info

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Auth
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}

# Ports (service-specific)
PORT=3000
```

## 8.3 Start Scripts

```bash
# Start all services
cd REZ-Intelligence && ./start-all.sh

# Start specific layer
cd REZ-Intelligence && npm run dev --workspace=rez-core-brain
cd REZ-Intelligence && npm run dev --workspace=rez-orchestrator-v2

# Start agents
cd REZ-Intelligence && npm run dev --workspace=rez-culinary-expert
```

---

# 9. QUICK REFERENCE

## 9.1 Service Discovery

| Need | Use |
|------|-----|
| Find expert for intent | Agent Registry (Port 4073) |
| Get user context | Core Brain (Port 4072) |
| Publish event | Event Bus (Port 4082) |
| Check permissions | Permission System (Port 4084) |

## 9.2 Common Flows

| Scenario | Flow |
|----------|------|
| New user message | WhatsApp → Bridge → Orchestrator → Expert → Response |
| Create order | Expert → Order Service → Event Bus → Notification |
| Process payment | Expert → Payment Service → Wallet Service → Confirmation |
| Book table | Expert → Booking Service → Confirmation |

## 9.3 Troubleshooting

| Issue | Solution |
|-------|----------|
| Expert not responding | Check Agent Registry health |
| Context missing | Verify Core Brain connection |
| Events not publishing | Check Event Bus |
| Payment failing | Check Payment Service logs |

---

# APPENDIX A: DEPRECATED SERVICES

| Old Name | New Name | Notes |
|----------|----------|-------|
| REZ-agent-orchestrator | rez-orchestrator-v2 | Migrated |
| rez-whatsapp-service | rez-whatsapp-bridge | Renamed |
| REZ-conversation-engine | REZ-unified-engine | Consolidated |

# APPENDIX B: FUTURE SERVICES

| Service | Purpose | Status |
|---------|---------|--------|
| Fraud Agent | Risk detection | Planned |
| Analytics Agent | Insights | Planned |
| Campaign Agent | Marketing | Planned |
| Notification Agent | Alerts | Planned |

# APPENDIX C: SERVICE DEPRECATION POLICY

Services marked for deprecation will:
1. Show warning in logs for 30 days
2. Return `X-Deprecated` header
3. Have redirect endpoint to new service
4. Be removed after 60 days

---

**Document Version:** 3.0
**Last Updated:** May 12, 2026
**Next Review:** Monthly
