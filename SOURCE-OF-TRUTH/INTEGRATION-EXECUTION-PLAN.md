# INTEGRATION EXECUTION PLAN

**Date:** 2026-05-02
**Status:** Research Complete - Ready to Execute

---

## RESEARCH SUMMARY

All 4 research agents completed. Here's what we found:

### Consumer Apps Research

| App | Tech Stack | Chat Status | Action |
|-----|------------|-------------|--------|
| **REZ NOW** | Next.js 16 + React 19 | Already integrated | Enhance |
| **rez-app-consumer** | Expo 53 + RN 0.79 | Full messaging system | Add AI layer |
| **Hotel OTA Mobile** | Expo 49 + RN 0.76 | Placeholder only | Add @rez/chat-rn |
| **Hotel OTA Web** | Next.js 16 + React 18 | Placeholder only | Add @rez/chat |

### Merchant Apps Research

| App | Tech Stack | Copilot Status | Action |
|-----|------------|---------------|--------|
| **REZ-merchant-copilot** | Node.js | Mock endpoints | Connect live APIs |
| **rez-app-merchant** | Expo 55 + RN 0.79 | Dashboard exists, hooks missing | Create hooks |
| **rez-admin-training-panel** | Vite + React | UI complete | Add analytics |

### Backend Services

| Service | Status | Integration Needed |
|---------|--------|-------------------|
| REZ-support-copilot | ✅ Built | Connect search, order, knowledge base |
| rez-search-service | ✅ Deployed | Add FAQ indexing, support triggers |
| rez-knowledge-base-service | ✅ Built | Add caching, search indexing |
| rez-order-service | ✅ Deployed | Add webhook to support copilot |

---

## INTEGRATION PRIORITY

### Priority 1: Consumer Chat (Week 1)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: CONSUMER CHAT INTEGRATION                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1.1 REZ NOW                                                              │
│      ├── Enhance existing RezChatIntegration                              │
│      ├── Add AI responses via REZ-support-copilot                        │
│      └── Connect to knowledge base                                        │
│                                                                             │
│  1.2 rez-app-consumer                                                    │
│      ├── Add AI chat layer to existing messaging                          │
│      ├── Connect to REZ-support-copilot                                  │
│      └── Add intent detection                                             │
│                                                                             │
│  1.3 Hotel OTA Mobile                                                    │
│      ├── Install @rez/chat-rn                                             │
│      ├── Add to SupportScreen.tsx                                        │
│      └── Configure socket connection                                       │
│                                                                             │
│  1.4 Hotel OTA Web                                                       │
│      ├── Install @rez/chat                                                │
│      ├── Add ChatWidget to support/page.tsx                              │
│      └── Connect to REZ-support-copilot                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Priority 2: Merchant Copilot (Week 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: MERCHANT COPILOT INTEGRATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  2.1 REZ-merchant-copilot                                                │
│      ├── Add authentication middleware                                     │
│      ├── Replace mock data with live API calls                             │
│      └── Add WebSocket for real-time updates                              │
│                                                                             │
│  2.2 rez-app-merchant                                                    │
│      ├── Create CopilotContext.tsx                                        │
│      ├── Create useCopilotInsights.ts hooks                              │
│      ├── Add chat component to copilot dashboard                          │
│      └── Connect to REZ-merchant-copilot API                              │
│                                                                             │
│  2.3 rez-admin-training-panel                                            │
│      ├── Deploy to Render                                                  │
│      ├── Add analytics implementation                                     │
│      └── Connect to knowledge base                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Priority 3: Backend Connections (Week 3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: BACKEND SERVICE CONNECTIONS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  3.1 REZ-support-copilot                                                │
│      ├── Add SEARCH intent → rez-search-service                           │
│      ├── Add ORDER intent → rez-order-service                             │
│      ├── Add KNOWLEDGE intent → rez-knowledge-base-service               │
│      └── Add USER intent → REZ-user-intelligence                         │
│                                                                             │
│  3.2 rez-search-service                                                   │
│      ├── Index FAQ content from knowledge base                            │
│      ├── Add support intent triggers                                       │
│      └── Connect to REZ-intelligence-hub                                  │
│                                                                             │
│  3.3 rez-knowledge-base-service                                          │
│      ├── Add Redis caching                                                │
│      ├── Index content for search                                         │
│      └── Add real-time updates                                           │
│                                                                             │
│  3.4 rez-order-service                                                   │
│      ├── Add webhook to REZ-support-copilot                               │
│      └── Track order issues → support tickets                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FILES TO CREATE/MODIFY

### Consumer Apps

```
REZ NOW:
├── src/components/ChatWidget/ ← NEW
├── src/lib/chat-ai.ts ← NEW
└── .env.local ← UPDATE

rez-app-consumer:
├── app/(tabs)/chat.tsx ← NEW
├── src/providers/AIChatProvider.tsx ← NEW
└── src/services/aiChatService.ts ← NEW

Hotel OTA Mobile:
├── src/screens/SupportScreen.tsx ← MODIFY
├── src/components/AIChatWidget.tsx ← NEW
└── package.json ← UPDATE

Hotel OTA Web:
├── src/components/ChatWidget.tsx ← NEW
├── src/app/support/page.tsx ← MODIFY
└── package.json ← UPDATE
```

### Merchant Apps

```
REZ-merchant-copilot:
├── src/middleware/auth.ts ← NEW
├── src/services/liveData.ts ← NEW
└── src/routes/websocket.ts ← NEW

rez-app-merchant:
├── src/contexts/CopilotContext.tsx ← NEW
├── src/hooks/useCopilotInsights.ts ← NEW
├── src/components/CopilotChat.tsx ← NEW
└── app/copilot/index.tsx ← MODIFY

rez-admin-training-panel:
├── src/services/analyticsApi.ts ← NEW
├── src/pages/Analytics.tsx ← MODIFY
└── .env ← UPDATE
```

### Backend Services

```
REZ-support-copilot:
├── src/services/searchIntegration.ts ← NEW
├── src/services/orderIntegration.ts ← NEW
├── src/services/knowledgeIntegration.ts ← NEW
└── src/intents/searchIntent.ts ← NEW

rez-search-service:
├── src/services/supportIntegration.ts ← NEW
├── src/routes/supportRoutes.ts ← NEW
└── src/index.ts ← MODIFY
```

---

## ENVIRONMENT VARIABLES

### Required for Consumer Apps

```env
# REZ NOW
REZ_SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com
REZ_SEARCH_URL=https://rez-search-service.onrender.com
KNOWLEDGE_BASE_URL=https://rez-knowledge-base-service.onrender.com

# rez-app-consumer
EXPO_PUBLIC_SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com

# Hotel OTA
NEXT_PUBLIC_SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com
NEXT_PUBLIC_CHAT_WS_URL=wss://REZ-support-copilot.onrender.com
```

### Required for Merchant Apps

```env
# REZ-merchant-copilot
MERCHANT_INTELLIGENCE_URL=https://REZ-merchant-intelligence.onrender.com
USER_INTELLIGENCE_URL=https://REZ-user-intelligence.onrender.com
INTENT_PREDICTOR_URL=https://REZ-intent-predictor.onrender.com

# rez-app-merchant
EXPO_PUBLIC_MERCHANT_COPILOT_URL=https://REZ-merchant-copilot.onrender.com
```

### Required for Backend Services

```env
# REZ-support-copilot
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
KNOWLEDGE_BASE_URL=https://rez-knowledge-base-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
USER_INTELLIGENCE_URL=https://REZ-user-intelligence.onrender.com

# rez-search-service
SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com
KNOWLEDGE_BASE_URL=https://rez-knowledge-base-service.onrender.com
```

---

## API CONNECTIONS

### REZ-support-copilot → External Services

```
When customer says:
  "Find me Italian restaurants"
  
→ Calls: GET /search/stores?q=Italian&location=...
← From: rez-search-service

When customer says:
  "Order biryani"
  
→ Calls: POST /orders
← To: rez-order-service

When customer says:
  "What are your hours?"
  
→ Calls: GET /api/merchants/{id}
← From: rez-knowledge-base-service

When customer says:
  "Track my order"
  
→ Calls: GET /orders/{id}
← From: rez-order-service
```

### rez-search-service → Support Copilot

```
When search fails:
  → Emit: search.failed event
  → To: REZ-support-copilot
  → Trigger: "I couldn't find that. Let me help you..."

When popular item searched:
  → Emit: search.popular item
  → To: REZ-support-copilot
  → Trigger: "Many customers are ordering X today!"
```

---

## TIMELINE

```
WEEK 1: Consumer Chat Integration
├── Day 1-2: REZ NOW enhancement
├── Day 3-4: rez-app-consumer AI layer
├── Day 5: Hotel OTA Mobile
└── Day 7: Hotel OTA Web

WEEK 2: Merchant Copilot Integration
├── Day 1-2: REZ-merchant-copilot live data
├── Day 3-4: rez-app-merchant hooks
└── Day 5: Admin panel analytics

WEEK 3: Backend Connections
├── Day 1-2: Search integration
├── Day 3-4: Order integration
└── Day 5: Testing & fixes

WEEK 4: Testing & Deployment
├── Day 1-2: E2E testing
├── Day 3-4: Bug fixes
└── Day 5: Production deployment
```

---

## NEXT STEPS

```
1. Deploy all backend services
2. Start with REZ NOW enhancement
3. Follow integration order by priority
4. Test each integration before moving on
5. Document any issues found
```

---

**Last Updated:** 2026-05-02
**Status:** Ready to Execute
