# ReZ Platform Integration Guide

**Version**: 1.0.0
**Last Updated**: 2026-05-04
**Total Systems**: 6

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Connections](#2-system-connections)
3. [Data Flow](#3-data-flow)
4. [API Contracts](#4-api-contracts)
5. [Environment Variables](#5-environment-variables)
6. [Deployment Order](#6-deployment-order)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. System Overview

The ReZ Platform consists of 6 interconnected systems:

| System | Port | Purpose | Database |
|--------|------|---------|----------|
| **Core Backend** | 4000-4100 | Auth, Merchant, Order, Payment, Wallet | MongoDB + PostgreSQL |
| **ReZ Mind** | 3001 | Intent capture, NLU, user profiling | MongoDB |
| **Event Platform** | 4010 | Event bus, cross-service communication | MongoDB |
| **Action Engine** | 3014 | Decision automation, procurement | MongoDB + Redis |
| **Feedback Service** | 4010 | Learning from decisions, feedback loop | MongoDB |
| **ML Services** | 4017, 3013 | Personalization, targeting, insights | MongoDB + Redis |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL CLIENTS                                    │
│                   Mobile App │ Web App │ Admin Portal │ Partner APIs            │
└─────────────────────────────────────┬───────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Auth Service   │  │ Gateway Service │  │  Load Balancer  │                  │
│  │    :4002        │  │    :3000        │  │                 │                  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘                  │
└───────────┼───────────────────┼─────────────────────────────────────────────────┘
            │                   │
            ▼                   ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              CORE BACKEND SERVICES                                │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Auth      │  │   Merchant   │  │    Order     │  │   Payment    │          │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │          │
│  │   :4002      │  │   :4005      │  │   :3006      │  │   :4001      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet     │  │   Catalog    │  │   Search     │  │   Marketing  │          │
│  │   Service    │  │   Service    │  │   Service    │  │  (Rendez)   │          │
│  │   :4004      │  │   :3005      │  │   :4003      │  │   :4000      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                                   │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           INTELLIGENCE LAYER                                       │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                              ReZ Mind                                        │   │
│  │                           Intent Graph :3001                                 │   │
│  │                                                                              │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │   │
│  │   │   Intent   │  │    NLU     │  │   Context   │  │   Profile   │         │   │
│  │   │   Capture  │  │   Engine    │  │   Manager   │  │   Builder   │         │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Personalize │  │  Targeting  │  │  Insights   │  │  Scheduler  │          │
│  │    Engine    │  │    Engine   │  │   Service   │  │   Service   │          │
│  │   :4017      │  │   :3013     │  │   :3008     │  │   :3012     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                                   │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                            AUTOMATION LAYER                                       │
│                                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │    Event Platform   │  │    Action Engine     │  │   Feedback Service   │    │
│  │        :4010        │  │       :3014          │  │       :4010          │    │
│  │                      │  │                      │  │                      │    │
│  │  ┌────────────────┐ │  │  ┌────────────────┐ │  │  ┌────────────────┐ │    │
│  │  │  Event Router  │ │  │  │  Decision      │ │  │  │  Learning      │ │    │
│  │  │  Event Store   │ │  │  │  Engine       │ │  │  │  Engine       │ │    │
│  │  │  Webhook       │ │  │  │  Guardrails   │ │  │  │  Analytics    │ │    │
│  │  └────────────────┘ │  │  └────────────────┘ │  │  └────────────────┘ │    │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘    │
│                                                                                   │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                           │
│                                                                                   │
│     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐                  │
│     │   MongoDB    │      │    Redis    │      │ PostgreSQL   │                  │
│     │   Replica   │      │   Cluster   │      │  (Rendez)    │                  │
│     │     Set     │      │             │      │              │                  │
│     │  :27017     │      │   :6379     │      │   :5432      │                  │
│     └──────────────┘      └──────────────┘      └──────────────┘                  │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Connections

### 2.1 Core Backend Connections

```
┌─────────────────┐         ┌─────────────────┐
│   Mobile/Web    │────────▶│  Auth Service   │
│     Client      │         │    :4002        │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │  Merchant  │  │   Wallet    │  │   Order     │
           │  Service   │  │   Service   │  │   Service   │
           │   :4005    │  │   :4004    │  │   :3006    │
           └─────┬───────┘  └──────┬──────┘  └──────┬──────┘
                 │                │                │
                 └────────────────┼────────────────┘
                                  │
                                  ▼
                         ┌─────────────┐
                         │   Payment   │
                         │   Service   │
                         │   :4001    │
                         └─────────────┘
```

### 2.2 ReZ Mind Connections

```
┌─────────────────┐         ┌─────────────────┐
│  Any Service    │────────▶│   ReZ Mind     │
│  (via HTTP)     │         │  Intent Graph  │
└─────────────────┘         │    :3001       │
                            └────────┬────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ User Profiles   │      │ Intent History  │      │ Behavior Events │
│ (per user)      │      │ (all sessions) │      │ (all actions)   │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 2.3 Event Platform Connections

```
┌─────────────────┐         ┌─────────────────┐
│  Event Sources  │────────▶│ Event Platform  │
│                 │         │    :4010       │
│  - Merchant     │         │                 │
│  - Order        │         │  ┌───────────┐ │
│  - Payment      │         │  │  Router   │ │
│  - Inventory    │         │  │  Store    │ │
└─────────────────┘         │  │  Webhook  │ │
                            │  └─────┬─────┘ │
                            └────────┼────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │ Action      │  │ Feedback    │  │ Analytics   │
           │ Engine      │  │ Service     │  │ Service     │
           │   :3014    │  │   :4010    │  │   :3008    │
           └─────────────┘  └─────────────┘  └─────────────┘
```

### 2.4 Action Engine Connections

```
┌─────────────────┐         ┌─────────────────┐
│ Event Platform  │────────▶│  Action Engine  │
│                 │         │    :3014       │
└─────────────────┘         └────────┬────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
           │ Decision    │  │  Guardrails │  │ Procurement │
           │ Engine      │  │  Check      │  │  Execution  │
           └─────────────┘  └─────────────┘  └─────────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │ Feedback Service│
                            │    :4010       │
                            └─────────────────┘
```

### 2.5 Cross-System Communication Matrix

| Source \ Target | Core Backend | ReZ Mind | Event Platform | Action Engine | Feedback | ML Services |
|----------------|--------------|----------|-----------------|---------------|----------|-------------|
| **Core Backend** | REST | HTTP POST | HTTP POST | HTTP POST | - | HTTP POST |
| **ReZ Mind** | REST | - | HTTP POST | - | - | - |
| **Event Platform** | - | - | - | Webhook | Webhook | - |
| **Action Engine** | REST | - | - | - | HTTP POST | - |
| **Feedback Service** | - | - | - | - | - | - |

---

## 3. Data Flow

### 3.1 Order-to-Decision Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│ Merchant│───▶│  Order  │───▶│Payment  │───▶│  Event  │───▶│  ReZ    │
│ Action  │    │ Service │    │ Service │    │ Service │    │Platform │    │  Mind   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └────┬────┘    └────┬────┘
                                                                  │              │
                                                                  ▼              ▼
                                                         ┌─────────────┐ ┌─────────────┐
                                                         │  Action     │ │   Intent    │
                                                         │  Engine     │ │  Captured   │
                                                         └──────┬──────┘ └─────────────┘
                                                                │
                                         ┌─────────────────────┼─────────────────────┐
                                         │                     │                     │
                                         ▼                     ▼                     ▼
                                  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
                                  │ Guardrails │      │  Decision  │      │   Procure  │
                                  │  Check     │      │   Made     │      │   Order    │
                                  └─────────────┘      └──────┬──────┘      │  Created   │
                                                            │              └──────┬──────┘
                                                            ▼                     │
                                                     ┌─────────────┐              │
                                                     │ Feedback   │◀─────────────┘
                                                     │ Service    │
                                                     └──────┬──────┘
                                                            │
                                                            ▼
                                                     ┌─────────────┐
                                                     │  Learning   │
                                                     │   Update   │
                                                     └─────────────┘
```

### 3.2 Intent-to-Insight Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │───▶│  ReZ    │───▶│  User   │───▶│Personal │───▶│Targeting│───▶│ Merchant│
│ Search  │    │  Mind   │    │ Profile │    │ Engine  │    │  Engine │    │ Campaign│
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
    │              │              │              │              │
    │              │              │              │              │
    ▼              ▼              ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ Behavior│  │ Intent  │  │ Prefs   │  │Recommend│  │  Ad     │
│ Event  │  │ Signal  │  │ Updated │  │ Generated│ │ Matched │
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

### 3.3 Feedback Loop Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Action  │───▶│Feedback │───▶│Learning │───▶│ Model   │───▶│ Improved│
│ Executed│    │Collected│    │ Applied │    │ Updated │    │ Actions │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## 4. API Contracts

### 4.1 Core Backend APIs

#### Authentication Service (`:4002`)

```typescript
// POST /api/v1/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface RegisterResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
}

// POST /api/v1/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// POST /api/v1/auth/refresh
interface RefreshRequest {
  refresh_token: string;
}

// GET /api/v1/auth/verify
interface VerifyResponse {
  valid: boolean;
  user_id?: string;
  expires_at?: string;
}
```

#### Merchant Service (`:4005`)

```typescript
// GET /api/v1/merchants/:id
interface MerchantResponse {
  merchant_id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

// POST /api/v1/merchants
interface CreateMerchantRequest {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

// PUT /api/v1/merchants/:id
interface UpdateMerchantRequest {
  name?: string;
  phone?: string;
  address?: Address;
}
```

#### Order Service (`:3006`)

```typescript
// POST /api/v1/orders
interface CreateOrderRequest {
  merchant_id: string;
  customer_id: string;
  items: OrderItem[];
  delivery_address: Address;
  payment_method: 'wallet' | 'card' | 'upi';
}

interface OrderItem {
  item_id: string;
  quantity: number;
  price: number;
  name: string;
}

interface OrderResponse {
  order_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
}

// GET /api/v1/orders/:id
// GET /api/v1/orders/user/:userId
// GET /api/v1/orders/merchant/:merchantId
```

#### Payment Service (`:4001`)

```typescript
// POST /api/v1/payments/initiate
interface InitiatePaymentRequest {
  order_id: string;
  amount: number;
  currency: 'INR';
  method: 'wallet' | 'card' | 'upi' | 'netbanking';
}

interface PaymentResponse {
  payment_id: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  transaction_id?: string;
}

// POST /api/v1/payments/verify/:paymentId
// GET /api/v1/payments/history/:userId
```

#### Wallet Service (`:4004`)

```typescript
// GET /api/v1/wallet/balance
interface BalanceResponse {
  user_id: string;
  balance: number;
  currency: 'INR';
  coins: number;
}

// POST /api/v1/wallet/topup
interface TopupRequest {
  amount: number;
  payment_method: string;
}

// POST /api/v1/wallet/transfer
interface TransferRequest {
  to_user_id: string;
  amount: number;
  note?: string;
}

// GET /api/v1/wallet/transactions
interface Transaction {
  transaction_id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}
```

---

### 4.2 ReZ Mind API (`:3001`)

```typescript
// POST /api/v1/intent/capture
interface CaptureIntentRequest {
  user_id: string;
  session_id: string;
  query: string;
  context?: {
    location?: { lat: number; lng: number };
    time?: string;
    device?: string;
  };
}

interface CaptureIntentResponse {
  intent_id: string;
  intent_type: string;
  entities: Entity[];
  confidence: number;
  suggestions?: string[];
}

// POST /api/v1/events
interface TrackEventRequest {
  user_id: string;
  event_type: string;
  properties: Record<string, any>;
  timestamp?: string;
}

// GET /api/v1/profile/user/:userId
interface UserProfile {
  user_id: string;
  preferences: {
    cuisines: string[];
    price_range: 'budget' | 'medium' | 'premium';
    time_pattern: string;
    dietary_restrictions: string[];
  };
  intent_signals: {
    current_intent: string;
    intent_confidence: number;
    purchase_probability: number;
  };
  behavior: {
    frequency: string;
    avg_order_value: number;
    engagement_level: 'low' | 'medium' | 'high';
  };
  segments: string[];
  lifetime_value: number;
  churn_risk: 'low' | 'medium' | 'high';
  updated_at: string;
}

// PUT /api/v1/profile/user/:userId
// POST /api/v1/profile/merge
```

---

### 4.3 Event Platform API (`:4010`)

```typescript
// POST /webhook/events
interface EventRequest {
  event_type: 'inventory.low' | 'order.completed' | 'payment.success' | 'user.signup';
  source: string;
  correlation_id: string;
  data: Record<string, any>;
  timestamp?: string;
}

interface EventResponse {
  received: boolean;
  event_id: string;
}

// POST /webhook/merchant/inventory
interface InventoryEventRequest {
  merchant_id: string;
  item_id: string;
  item_name?: string;
  current_stock: number;
  threshold: number;
  avg_daily_sales?: number;
  recent_orders_last_3_days?: number;
  unit_price?: number;
}

// GET /events/:correlationId
interface EventHistoryResponse {
  events: Event[];
  total: number;
}

// GET /health
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
}
```

---

### 4.4 Action Engine API (`:3014`)

```typescript
// POST /api/v1/decisions
interface CreateDecisionRequest {
  event_type: string;
  correlation_id: string;
  context: {
    merchant_id: string;
    item_id?: string;
    order_id?: string;
    amount?: number;
  };
}

interface DecisionResponse {
  decision_id: string;
  decision: string;
  action_level: 'SAFE' | 'SEMI_SAFE' | 'RISKY';
  confidence: number;
  recommendation: 'auto_execute' | 'suggest' | 'block';
  data: Record<string, any>;
}

// GET /api/v1/decisions/:id
// GET /api/v1/decisions/merchant/:merchantId
// GET /api/v1/decisions/history

// POST /api/v1/decisions/:id/approve
interface ApproveDecisionRequest {
  modifications?: Record<string, any>;
  reason?: string;
}

// POST /api/v1/decisions/:id/reject
interface RejectDecisionRequest {
  reason: string;
}

// GET /health/live
// GET /health/ready
```

---

### 4.5 Feedback Service API (`:4010`)

```typescript
// POST /feedback
interface FeedbackRequest {
  correlation_id: string;
  decision_id: string;
  outcome: 'approved' | 'rejected' | 'modified' | 'ignored';
  confidence: number;
  modifications?: {
    suggested: Record<string, any>;
    final: Record<string, any>;
  };
  reason_category?: string;
  reason_detail?: string;
}

interface FeedbackResponse {
  feedback_id: string;
  processed: boolean;
}

// GET /feedback/:correlationId
// GET /feedback/merchant/:merchantId
// GET /feedback/stats

// GET /health/live
```

---

### 4.6 ML Services APIs

#### Personalization Engine (`:4017`)

```typescript
// POST /api/v1/personalize
interface PersonalizeRequest {
  user_id: string;
  context: {
    location?: { lat: number; lng: number };
    time: string;
    device: string;
  };
  count?: number;
}

interface PersonalizeResponse {
  recommendations: Recommendation[];
  model_version: string;
}

// GET /api/v1/recommendations/:userId
// POST /api/v1/feedback
```

#### Targeting Engine (`:3013`)

```typescript
// POST /api/v1/target
interface TargetRequest {
  merchant_id: string;
  campaign_id?: string;
  budget: number;
  targeting_criteria: {
    demographics?: string[];
    locations?: string[];
    interests?: string[];
    behaviors?: string[];
  };
}

interface TargetResponse {
  target_count: number;
  estimated_reach: number;
  cpm: number;
  segments: string[];
}

// GET /health
```

---

### 4.7 Shared Event Schema

```typescript
interface BaseEvent {
  event_id: string;        // UUID
  event_type: string;      // 'inventory.low' | 'order.completed' | etc
  correlation_id: string;   // UUID - links entire flow
  source: string;          // Service that emitted event
  timestamp: string;        // ISO 8601
  version: string;          // Schema version
}

interface BaseDecision {
  decision_id: string;          // UUID
  correlation_id: string;        // Links to event
  event_type: string;
  decision: string;              // 'draft_po_suggested' | etc
  confidence: number;            // 0.0 - 1.0
  action_level: string;           // 'SAFE' | 'SEMI_SAFE' | 'RISKY'
  recommendation: string;        // 'auto_execute' | 'suggest' | 'block'
  timestamp: string;
}

interface BaseFeedback {
  feedback_id: string;
  correlation_id: string;       // Links to decision
  decision_id?: string;
  outcome: 'approved' | 'rejected' | 'modified' | 'ignored' | 'pending';
  confidence: number;
  timestamp: string;
}
```

---

## 5. Environment Variables

### 5.1 Core Backend Services

```bash
# ===========================================
# Core Backend Environment Variables
# ===========================================

# Node Environment
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_dev
MONGODB_URI_STAGING=mongodb+srv://user:pass@cluster.staging.mongodb.net/rez_staging
MONGODB_URI_PRODUCTION=mongodb+srv://user:pass@cluster.production.mongodb.net/rez_production

# PostgreSQL (for Rendez)
DATABASE_URL=postgresql://rez:password@localhost:5432/rez_dev

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (generate with: openssl rand -hex 64)
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ADMIN_SECRET=your-admin-secret
JWT_MERCHANT_SECRET=your-merchant-secret

# OTP Configuration
OTP_HMAC_SECRET=your-otp-secret
OTP_TOTP_ENCRYPTION_KEY=your-totp-key
EXPOSE_DEV_OTP=false

# Encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# Internal Service Communication
INTERNAL_SERVICE_TOKEN=dev-internal-service-token

# Service URLs
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_MERCHANT_SERVICE_URL=http://localhost:4005
REZ_MARKETING_SERVICE_URL=http://localhost:4000
```

### 5.2 ReZ Mind Services

```bash
# ===========================================
# ReZ Mind Environment Variables
# ===========================================

# Node Environment
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_intent_graph

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Service URLs
REZ_USER_INTELLIGENCE_URL=http://localhost:4020
REZ_EVENT_PLATFORM_URL=http://localhost:4010
```

### 5.3 Event Platform

```bash
# ===========================================
# Event Platform Environment Variables
# ===========================================

NODE_ENV=development
PORT=4010
LOG_LEVEL=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_events

# Downstream Services
ACTION_ENGINE_URL=http://localhost:3014
FEEDBACK_SERVICE_URL=http://localhost:4010

# Event Configuration
EVENT_RETENTION_DAYS=90
MAX_EVENT_BATCH_SIZE=100
```

### 5.4 Action Engine

```bash
# ===========================================
# Action Engine Environment Variables
# ===========================================

NODE_ENV=development
PORT=3014
LOG_LEVEL=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_action_engine

# Redis
REDIS_URL=redis://localhost:6379

# Downstream Services
FEEDBACK_SERVICE_URL=http://localhost:4010
MERCHANT_SERVICE_URL=http://localhost:4005

# Safety Thresholds
MAX_NEW_ITEM_DECISIONS=5
MIN_CONFIDENCE_RISKY=0.7
MIN_CONFIDENCE_SAFE=0.9
MAX_QUANTITY=50
MAX_VALUE_INR=100000
MAX_DELTA_PERCENT=50

# Feature Flags
LEARNING_ENABLED=true
AUTO_EXECUTE_SAFE=true
REQUIRE_APPROVAL_RISKY=true
```

### 5.5 Feedback Service

```bash
# ===========================================
# Feedback Service Environment Variables
# ===========================================

NODE_ENV=development
PORT=4010
LOG_LEVEL=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_feedback

# Redis
REDIS_URL=redis://localhost:6379

# Downstream Services
EVENT_PLATFORM_URL=http://localhost:4010

# Learning Configuration
LEARNING_WINDOW=50
MIN_DECISIONS_FOR_LEARNING=30
```

### 5.6 ML Services

```bash
# ===========================================
# ML Services Environment Variables
# ===========================================

NODE_ENV=development
PORT_PERSONALIZATION=4017
PORT_TARGETING=3013
LOG_LEVEL=debug

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez_personalization

# Redis
REDIS_URL=redis://localhost:6379

# Model Configuration
MODEL_VERSION=latest
CACHE_TTL=3600
```

### 5.7 Production Secrets Checklist

```bash
# Generate secrets for production:
openssl rand -hex 64   # Run 4 times for JWT secrets
openssl rand -hex 32   # Run 2 times for Redis/Encryption

# Required Production Secrets:
# - MONGODB_URI_PRODUCTION (MongoDB Atlas)
# - REDIS_URL_PRODUCTION (Upstash)
# - JWT_SECRET_PRODUCTION
# - JWT_REFRESH_SECRET_PRODUCTION
# - JWT_ADMIN_SECRET_PRODUCTION
# - JWT_MERCHANT_SECRET_PRODUCTION
# - RAZORPAY_KEY_ID
# - RAZORPAY_KEY_SECRET
```

---

## 6. Deployment Order

### Phase 1: Infrastructure (Day 1)

| Step | Task | Duration | Dependency |
|------|------|----------|------------|
| 1.1 | Deploy MongoDB Atlas (3-node replica) | 30 min | None |
| 1.2 | Deploy Redis (Upstash) | 15 min | None |
| 1.3 | Configure network access | 15 min | 1.1, 1.2 |
| 1.4 | Set up GitHub secrets | 20 min | 1.1, 1.2 |

### Phase 2: Core Backend (Day 1-2)

| Step | Service | Port | Duration | Dependency |
|------|---------|------|----------|------------|
| 2.1 | Auth Service | 4002 | 20 min | 1.1, 1.2 |
| 2.2 | Merchant Service | 4005 | 20 min | 2.1 |
| 2.3 | Wallet Service | 4004 | 20 min | 2.1 |
| 2.4 | Payment Service | 4001 | 25 min | 2.1, 2.2 |
| 2.5 | Order Service | 3006 | 25 min | 2.1, 2.2, 2.3, 2.4 |
| 2.6 | Catalog Service | 3005 | 20 min | 2.2 |
| 2.7 | Search Service | 4003 | 20 min | 2.1 |

### Phase 3: Intelligence Layer (Day 2)

| Step | Service | Port | Duration | Dependency |
|------|---------|------|----------|------------|
| 3.1 | ReZ Mind (Intent Graph) | 3001 | 25 min | 1.1, 1.2 |
| 3.2 | Personalization Engine | 4017 | 20 min | 1.1, 1.2, 3.1 |
| 3.3 | Targeting Engine | 3013 | 20 min | 1.1, 1.2, 3.1 |
| 3.4 | Insights Service | 3008 | 20 min | 1.1, 1.2 |

### Phase 4: Automation Layer (Day 2-3)

| Step | Service | Port | Duration | Dependency |
|------|---------|------|----------|------------|
| 4.1 | Event Platform | 4010 | 25 min | 1.1, 1.2 |
| 4.2 | Action Engine | 3014 | 30 min | 1.1, 1.2, 4.1 |
| 4.3 | Feedback Service | 4010 | 25 min | 1.1, 1.2, 4.1, 4.2 |
| 4.4 | Scheduler Service | 3012 | 20 min | 1.1, 1.2 |

### Phase 5: Frontend & Verification (Day 3)

| Step | Task | Duration | Dependency |
|------|------|----------|------------|
| 5.1 | Deploy Nextabizz Web | - | All Phase 2 |
| 5.2 | Deploy Merchant Dashboard | - | 2.2, 3.1 |
| 5.3 | Integration Testing | 60 min | 5.1, 5.2 |

### Deployment Commands

```bash
# ===========================================
# Deploy Core Services to Render
# ===========================================

# Set Render API Key
export RENDER_API_KEY=your_render_api_key

# Deploy in order:
cd rez-auth-service && render deploy --service=rez-auth-service --type=web --region=singapore
cd ../rez-merchant-service && render deploy --service=rez-merchant-service --type=web --region=singapore
cd ../rez-wallet-service && render deploy --service=rez-wallet-service --type=web --region=singapore
cd ../rez-payment-service && render deploy --service=rez-payment-service --type=web --region=singapore
cd ../rez-order-service && render deploy --service=rez-order-service --type=web --region=singapore

# ===========================================
# Deploy Intelligence Layer
# ===========================================

cd ../rez-intent-graph && render deploy --service=rez-intent-graph --type=web --region=singapore
cd ../rez-personalization-engine && render deploy --service=rez-personalization-engine --type=web --region=singapore
cd ../rez-targeting-engine && render deploy --service=rez-targeting-engine --type=web --region=singapore

# ===========================================
# Deploy Automation Layer
# ===========================================

cd ../rez-event-platform && render deploy --service=rez-event-platform --type=web --region=singapore
cd ../rez-action-engine && render deploy --service=rez-action-engine --type=web --region=singapore
cd ../rez-feedback-service && render deploy --service=rez-feedback-service --type=web --region=singapore
```

---

## 7. Testing Checklist

### 7.1 Pre-Deployment Tests

#### Infrastructure Tests

```bash
# Test MongoDB Connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/rez_test" --eval "db.runCommand({ping:1})"

# Test Redis Connection
redis-cli -u redis://:password@host.upstash.io:6379 ping

# Test PostgreSQL Connection
psql "postgresql://user:pass@host:5432/rez_dev" -c "SELECT 1;"
```

#### Health Check Tests

```bash
# Auth Service
curl -f http://localhost:4002/health

# Merchant Service
curl -f http://localhost:4005/health

# Wallet Service
curl -f http://localhost:4004/health

# Payment Service
curl -f http://localhost:4001/health

# Order Service
curl -f http://localhost:3006/health

# ReZ Mind
curl -f http://localhost:3001/health

# Event Platform
curl -f http://localhost:4010/health

# Action Engine
curl -f http://localhost:3014/health/live

# Feedback Service
curl -f http://localhost:4010/health/live

# Personalization Engine
curl -f http://localhost:4017/health

# Targeting Engine
curl -f http://localhost:3013/health
```

### 7.2 Integration Tests

#### Authentication Flow

```bash
# Test 1: User Registration
curl -X POST http://localhost:4002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
# Expected: 201 Created with user_id and tokens

# Test 2: User Login
curl -X POST http://localhost:4002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
# Expected: 200 OK with access_token

# Test 3: Token Verification
TOKEN=$(curl -s -X POST http://localhost:4002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' | jq -r '.access_token')

curl -X GET http://localhost:4002/api/v1/auth/verify \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"valid":true,"user_id":"..."}
```

#### Core Service Integration

```bash
# Test 4: Create Merchant
curl -X POST http://localhost:4005/api/v1/merchants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Restaurant","email":"test@restaurant.com","phone":"+919999999999"}'
# Expected: 201 Created with merchant_id

# Test 5: Create Order
curl -X POST http://localhost:3006/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "merchant_id":"merchant_123",
    "customer_id":"user_123",
    "items":[{"item_id":"item_1","quantity":2,"price":150,"name":"Biryani"}],
    "payment_method":"wallet"
  }'
# Expected: 201 Created with order_id

# Test 6: Payment Flow
curl -X POST http://localhost:4001/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"order_id":"order_123","amount":300,"currency":"INR","method":"wallet"}'
# Expected: 200 OK with payment_id

# Test 7: Wallet Balance
curl -X GET http://localhost:4004/api/v1/wallet/balance \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"user_id":"...","balance":1000,"coins":500}
```

#### ReZ Mind Integration

```bash
# Test 8: Capture Intent
curl -X POST http://localhost:3001/api/v1/intent/capture \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"user_123",
    "session_id":"session_456",
    "query":"I want to order biryani",
    "context":{"device":"mobile"}
  }'
# Expected: {"intent_id":"...","intent_type":"food_order","confidence":0.95}

# Test 9: Track Event
curl -X POST http://localhost:3001/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"user_123",
    "event_type":"search",
    "properties":{"query":"biryani","results_count":15}
  }'
# Expected: {"event_id":"..."}

# Test 10: Get User Profile
curl -X GET http://localhost:3001/api/v1/profile/user/user_123
# Expected: Full user profile object
```

#### Event Platform Integration

```bash
# Test 11: Send Inventory Event
curl -X POST http://localhost:4010/webhook/merchant/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id":"merchant_123",
    "item_id":"item_1",
    "item_name":"Biryani",
    "current_stock":3,
    "threshold":5
  }'
# Expected: {"received":true,"event_id":"..."}

# Test 12: Get Event History
curl -X GET "http://localhost:4010/events?correlation_id=correlation_123"
# Expected: Array of events

# Test 13: Send Order Event
curl -X POST http://localhost:4010/webhook/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_type":"order.completed",
    "source":"order-service",
    "correlation_id":"order_123",
    "data":{"order_id":"order_123","total":300}
  }'
# Expected: {"received":true}
```

#### Action Engine Integration

```bash
# Test 14: Create Decision
curl -X POST http://localhost:3014/api/v1/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "event_type":"inventory.low",
    "correlation_id":"inv_123",
    "context":{"merchant_id":"merchant_123","item_id":"item_1"}
  }'
# Expected: {"decision_id":"...","recommendation":"suggest","action_level":"SAFE"}

# Test 15: Approve Decision
curl -X POST http://localhost:3014/api/v1/decisions/decision_123/approve \
  -H "Content-Type: application/json" \
  -d '{"reason":"approved"}'
# Expected: {"approved":true}

# Test 16: Get Decision History
curl -X GET "http://localhost:3014/api/v1/decisions/merchant/merchant_123"
# Expected: Array of decisions
```

#### Feedback Loop Integration

```bash
# Test 17: Submit Feedback
curl -X POST http://localhost:4010/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "correlation_id":"decision_123",
    "decision_id":"decision_123",
    "outcome":"approved",
    "confidence":0.85
  }'
# Expected: {"feedback_id":"..."}

# Test 18: Get Feedback Stats
curl -X GET http://localhost:4010/feedback/stats
# Expected: {"total":100,"approved":80,"rejected":20}
```

#### ML Services Integration

```bash
# Test 19: Get Personalization
curl -X POST http://localhost:4017/api/v1/personalize \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"user_123",
    "context":{"time":"evening","device":"mobile"},
    "count":5
  }'
# Expected: {"recommendations":[...],"model_version":"v1.0"}

# Test 20: Get Targeting
curl -X POST http://localhost:3013/api/v1/target \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id":"merchant_123",
    "budget":10000,
    "targeting_criteria":{"locations":["mumbai"]}
  }'
# Expected: {"target_count":5000,"estimated_reach":10000}
```

### 7.3 End-to-End Flow Tests

#### Complete Order Flow

```bash
# 1. User registers
USER_RESPONSE=$(curl -s -X POST http://localhost:4002/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e@example.com","password":"Test123!","name":"E2E User"}')
TOKEN=$(echo $USER_RESPONSE | jq -r '.access_token')
USER_ID=$(echo $USER_RESPONSE | jq -r '.user_id')

# 2. User places order
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3006/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"merchant_id":"merchant_123","customer_id":"'$USER_ID'","items":[{"item_id":"item_1","quantity":1,"price":200,"name":"Pizza"}],"payment_method":"wallet"}')
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order_id')

# 3. Payment processed
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:4001/api/v1/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"order_id":"'$ORDER_ID'","amount":200,"currency":"INR","method":"wallet"}')

# 4. Event captured in ReZ Mind
curl -s -X POST http://localhost:3001/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"user_id":"'$USER_ID'","event_type":"order.placed","properties":{"order_id":"'$ORDER_ID'","amount":200}}'

# 5. Order event sent to Event Platform
curl -s -X POST http://localhost:4010/webhook/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"order.completed","source":"order-service","correlation_id":"'$ORDER_ID'","data":{"order_id":"'$ORDER_ID'"}}'

echo "E2E Flow Complete - Order ID: $ORDER_ID"
```

#### Complete Inventory Decision Flow

```bash
# 1. Low inventory event detected
curl -s -X POST http://localhost:4010/webhook/merchant/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id":"merchant_123",
    "item_id":"item_1",
    "item_name":"Paneer",
    "current_stock":2,
    "threshold":5,
    "unit_price":150
  }'

# 2. Check if decision was created
sleep 2
curl -s http://localhost:3014/api/v1/decisions/merchant/merchant_123 | jq '.[0]'

# 3. Approve decision
DECISION_ID=$(curl -s http://localhost:3014/api/v1/decisions/merchant/merchant_123 | jq -r '.[0].decision_id')
curl -s -X POST http://localhost:3014/api/v1/decisions/$DECISION_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"modifications":{"quantity":10},"reason":"Need more stock for weekend"}'

# 4. Submit feedback
curl -s -X POST http://localhost:4010/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "correlation_id":"'"$DECISION_ID"'",
    "decision_id":"'"$DECISION_ID"'",
    "outcome":"modified",
    "confidence":0.75,
    "modifications":{"suggested":{"quantity":5},"final":{"quantity":10}}
  }'

echo "Inventory Decision Flow Complete"
```

### 7.4 Test Summary Checklist

| Category | Test | Status | Notes |
|----------|------|--------|-------|
| **Infrastructure** | MongoDB Connection | [ ] | |
| | Redis Connection | [ ] | |
| | PostgreSQL Connection | [ ] | |
| **Health Checks** | Auth Service | [ ] | |
| | Merchant Service | [ ] | |
| | Wallet Service | [ ] | |
| | Payment Service | [ ] | |
| | Order Service | [ ] | |
| | ReZ Mind | [ ] | |
| | Event Platform | [ ] | |
| | Action Engine | [ ] | |
| | Feedback Service | [ ] | |
| | Personalization Engine | [ ] | |
| | Targeting Engine | [ ] | |
| **Authentication** | Register | [ ] | |
| | Login | [ ] | |
| | Token Verify | [ ] | |
| | Refresh Token | [ ] | |
| **Core Services** | Create Merchant | [ ] | |
| | Create Order | [ ] | |
| | Payment Initiate | [ ] | |
| | Wallet Balance | [ ] | |
| | Wallet Topup | [ ] | |
| | Wallet Transfer | [ ] | |
| **ReZ Mind** | Capture Intent | [ ] | |
| | Track Event | [ ] | |
| | Get User Profile | [ ] | |
| | Update Profile | [ ] | |
| **Event Platform** | Inventory Event | [ ] | |
| | Order Event | [ ] | |
| | Event History | [ ] | |
| **Action Engine** | Create Decision | [ ] | |
| | Approve Decision | [ ] | |
| | Reject Decision | [ ] | |
| | Decision History | [ ] | |
| **Feedback Service** | Submit Feedback | [ ] | |
| | Get Feedback Stats | [ ] | |
| **ML Services** | Personalize | [ ] | |
| | Target | [ ] | |
| **E2E Flows** | Complete Order Flow | [ ] | |
| | Inventory Decision Flow | [ ] | |

---

## Quick Reference

### Service URLs (Local Development)

```bash
Auth Service:           http://localhost:4002
Merchant Service:       http://localhost:4005
Wallet Service:         http://localhost:4004
Payment Service:       http://localhost:4001
Order Service:          http://localhost:3006
Catalog Service:        http://localhost:3005
Search Service:         http://localhost:4003
ReZ Mind:               http://localhost:3001
Event Platform:         http://localhost:4010
Action Engine:          http://localhost:3014
Feedback Service:       http://localhost:4010
Personalization Engine: http://localhost:4017
Targeting Engine:       http://localhost:3013
```

### Live URLs (Production)

```bash
Auth Service:           https://rez-auth-service.onrender.com
Merchant Service:       https://rez-merchant-service.onrender.com
Wallet Service:         https://rez-wallet-service.onrender.com
Payment Service:        https://rez-payment-service.onrender.com
Order Service:          https://rez-order-service.onrender.com
ReZ Mind:               https://rez-intent-graph.onrender.com
Event Platform:         https://rez-event-platform.onrender.com
Action Engine:          https://rez-action-engine.onrender.com
Feedback Service:       https://rez-feedback-service.onrender.com
```

### Key Environment Variables to Update After Deployment

```bash
# .env.local for frontend apps
NEXT_PUBLIC_API_URL=https://api.rezapp.com
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
REZ_MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
REZ_INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com
```

---

*Document Version: 1.0.0*
*Last Updated: 2026-05-04*
*Maintained by: ReZ Engineering Team*
