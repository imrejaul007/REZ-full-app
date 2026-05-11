# ReZ Ecosystem - Packages Documentation

**Last Updated:** 2026-05-01
**Purpose:** Complete reference for all shared packages

---

## Table of Contents

1. [Core Packages](#core-packages)
2. [UI & Components](#ui--components)
3. [AI & Chat](#ai--chat)
4. [Infrastructure Packages](#infrastructure-packages)
5. [Package Usage Guide](#package-usage-guide)
6. [Deprecation Notice](#deprecation-notice)

---

## Core Packages

### 1. @rez/shared (Canonical)

| Attribute | Value |
|-----------|-------|
| **Version** | 2.0.0 |
| **Location** | `/rez-shared/` |
| **npm** | Published |
| **Purpose** | Core utilities, types, schemas, middleware, queue utilities |
| **Consumers** | 16+ services and apps |

**Exports:**
```typescript
// Main entry
import { /* utilities */ } from '@rez/shared';

// Types
import { User, Order, Payment } from '@rez/shared/types';
import { ApiRequest, ApiResponse } from '@rez/shared/types/api';

// Middleware
import { authMiddleware, rateLimitMiddleware } from '@rez/shared/middleware';

// Schemas
import { createUserSchema, createOrderSchema } from '@rez/shared/schemas';

// Queue utilities
import { createQueue, processJob } from '@rez/shared/queue';

// Webhook utilities
import { verifyWebhook, parseWebhook } from '@rez/shared/webhook';
```

**Key Dependencies:**
- axios, bullmq, crypto-js, express
- express-rate-limit, ioredis, mongoose
- rate-limit-redis, uuid, winston, zod

**Consumers:**
- rez-auth-service
- rez-order-service
- rez-payment-service
- rez-catalog-service
- rez-app-admin
- rez-app-merchant
- rez-now
- analytics-events
- rez-finance-service
- rez-gamification-service
- rez-marketing-service
- rez-merchant-service
- rez-notification-events
- rez-search-service

---

### 2. @rez/shared-types

| Attribute | Value |
|-----------|-------|
| **Version** | 2.0.0 |
| **Location** | `/packages/shared-types/` |
| **npm** | Published |
| **Purpose** | TypeScript interfaces, Zod schemas, FSM helpers, branded IDs |

**Exports:**
```typescript
// Main entry
import { /* all exports */ } from '@rez/shared-types';

// Enums
import { OrderStatus, PaymentStatus } from '@rez/shared-types';

// Entities
import { User, Order, Payment, Wallet } from '@rez/shared-types';

// FSM helpers
import { createPaymentFSM, createOrderFSM } from '@rez/shared-types/fsm';

// Runtime guards
import { isUser, isOrder } from '@rez/shared-types/guards';

// Branded IDs
import { OrderId, UserId, MerchantId } from '@rez/shared-types/branded';

// Validation schemas
import { userSchema, orderSchema } from '@rez/shared-types/validation';
```

**Features:**
- 67+ entity interfaces
- FSM helpers for Payment and Order state transitions
- Branded ID types for type safety
- Runtime guards without Zod dependency (for consumer apps)

**Consumers:**
- rez-app-consumer (via file reference)
- rez-app-merchant (via file reference)

---

### 3. @rez/service-core

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.1 |
| **Location** | `/packages/rez-service-core/` |
| **npm** | No |
| **Purpose** | Shared infrastructure for BullMQ microservices |
| **Status** | Incomplete - needs more implementations |

**Exports:**
```typescript
import { createRedisConnection } from '@rez/service-core/redis';
import { createMongoConnection } from '@rez/service-core/mongodb';
import { createLogger } from '@rez/service-core/logger';
import { healthCheck } from '@rez/service-core/health';
import { gracefulShutdown } from '@rez/service-core/gracefulShutdown';
import { initSentry } from '@rez/service-core/errorTracker';
```

**Dependencies:**
- @sentry/node, bullmq, express, ioredis, mongoose, pino

---

## UI & Components

### 4. @rez/ui

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-ui/` |
| **npm** | No |
| **Purpose** | ReZ UI component library |
| **Status** | Minimal - only 5 components |

**Exports:**
```typescript
import { Button, Card, Input, List, Modal } from '@rez/ui';
```

**Peer Dependencies:** react >=18.0.0

---

### 5. @rez/chat

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-chat-service/` |
| **npm** | No |
| **Purpose** | Unified real-time chat service |

**Features:**
- WebSocket-based messaging
- Room/thread management
- Message history
- Typing indicators
- Read receipts

---

### 6. @rez/chat-ai

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-chat-ai/` |
| **npm** | No |
| **Purpose** | AI-powered chat with Anthropic |
| **Dependency** | rez-intent-graph (via file path) |

**Features:**
- AI chat responses via Anthropic
- Intent-aware conversations
- Context preservation
- Multi-turn dialogue

---

### 7. @rez/chat-integration

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-chat-integration/` |
| **npm** | No |
| **Purpose** | Chat integration with ecosystem services |

**Features:**
- Integration with Hotel OTA (room chat)
- Integration with AdBazaar
- Integration with Rendez
- Unified conversation threading

---

### 8. @rez/chat-rn

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-chat-rn/` |
| **npm** | No |
| **Purpose** | React Native AI Chat Components |

**Features:**
- React Native compatible
- Message bubbles
- AI typing indicators
- Conversation history

---

## AI & Chat

### 9. @rez/intent-capture-sdk

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-intent-capture-sdk/` |
| **npm** | No |
| **Purpose** | Unified Intent Capture SDK for ReZ ecosystem apps |

**Usage:**
```typescript
import { IntentCapture } from '@rez/intent-capture-sdk';

const capture = new IntentCapture({
  apiUrl: 'https://rez-intent-graph.onrender.com',
  apiKey: 'your-api-key'
});

// Capture user intent
await capture.track({
  userId: 'user-123',
  event: 'view',
  entity: 'product',
  entityId: 'prod-456',
  context: { category: 'electronics' }
});
```

---

### 10. @rez/intent-graph

| Attribute | Value |
|-----------|-------|
| **Version** | 0.1.0 |
| **Location** | `/packages/rez-intent-graph/` |
| **npm** | No |
| **Type** | ESM module |
| **Purpose** | AI-powered commerce intelligence platform |

**Features:**
- Intent tracking
- Confidence scoring
- Dormant intent detection
- Cross-app user profiles

**Dependencies:** express, mongoose, zod

---

### 11. @rez/agent-memory

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-agent-memory/` |
| **npm** | No |
| **Purpose** | Shared memory layer for ReZ Agent OS |

**Dependencies:** @supabase/supabase-js, ioredis

---

## Infrastructure Packages

### 12. @rez/metrics

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/rez-metrics/` |
| **npm** | No |
| **Purpose** | Prometheus metrics middleware |
| **Status** | Empty - no implementations |

**Should Implement:**
- Request counter
- Response time histogram
- Error rate gauge
- Custom business metrics

---

### 13. @rez/eslint-plugin

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.0 |
| **Location** | `/packages/eslint-plugin-rez/` |
| **npm** | No |
| **Purpose** | ESLint rules for REZ codebase |
| **Status** | Empty - no rules implemented |

**Should Implement:**
- no-bespoke-buttons (use @rez/ui)
- no-console-log (use rez-shared/telemetry)
- no-bespoke-idempotency (use rez-shared/idempotency)
- no-bespoke-enums (use rez-shared/enums)
- no-math-random-for-ids (use uuid)

---

## Other Packages

### 14. @imrejaul007/rez-contracts

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0.1 |
| **Location** | `/rez-contracts/` |
| **npm** | No (dev dependency only) |
| **Purpose** | Shared API schemas, types, and validation |

**Structure:**
```
rez-contracts/
├── schemas/      # Zod validation schemas
├── types/       # TypeScript type definitions
├── validation/  # Validation utilities
└── package.json
```

---

## Infrastructure-Only Packages

These packages are not npm packages but are used for infrastructure:

### 15. rez-devops-config

| Attribute | Value |
|-----------|-------|
| **Location** | `/rez-devops-config/` |
| **Purpose** | Centralized GitHub Actions CI/CD configuration |
| **Type** | GitHub reusable workflows |

**Provides:**
- `ci.yml` - CI pipeline
- `deploy.yml` - Deployment pipeline

---

### 16. rez-error-intelligence

| Attribute | Value |
|-----------|-------|
| **Location** | `/rez-error-intelligence/` |
| **Purpose** | Central error knowledge base |
| **Type** | Documentation/tracking |

---

## Package Usage Guide

### For Services

```typescript
// Import from @rez/shared (canonical)
import { authMiddleware, createLogger } from '@rez/shared';
import { Order, User } from '@rez/shared/types';
import { createOrderSchema } from '@rez/shared/schemas';
```

### For Mobile Apps

```typescript
// Import from @rez/shared-types (type definitions only)
import { User, Order, OrderStatus } from '@rez/shared-types';
import { userSchema } from '@rez/shared-types/validation';
```

### For AI/Chat

```typescript
// Intent capture
import { IntentCapture } from '@rez/intent-capture-sdk';

// Chat
import { ChatProvider } from '@rez/chat';
import { AIChat } from '@rez/chat-ai';
```

### For UI

```typescript
// Only if using @rez/ui (currently minimal)
import { Button, Card, Input } from '@rez/ui';
```

---

## Deprecation Notice

### ⚠️ Duplicate @rez/shared Package

| Package | Version | Location | Status |
|---------|---------|----------|--------|
| `@rez/shared` | 2.0.0 | `/rez-shared/` | **Canonical** |
| `@rez/shared` | 1.0.0 | `/packages/rez-shared/` | **Deprecated** |

**Issue:** Two packages with identical npm name but different content and versions.

**Resolution Needed:**
1. Keep `/rez-shared/` (v2.0.0) as canonical
2. Deprecate `/packages/rez-shared/` (v1.0.0)
3. Update any consumers to use canonical path

**Action:** Document which services use the duplicate package.

---

## Package Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `@rez/` | @rez/shared, @rez/ui | All public packages |
| `@imrejaul007/` | @imrejaul007/rez-contracts | Legacy/unpublished |

**Recommendation:** Standardize all packages to `@rez/` prefix.

---

## Empty Packages Needing Implementation

| Package | Current Status | Should Implement |
|---------|---------------|------------------|
| @rez/metrics | Empty | Prometheus metrics collection |
| @rez/eslint-plugin | Empty | Code quality rules |

---

**Next:** [SECURITY.md](SECURITY.md) - Security hardening guide
