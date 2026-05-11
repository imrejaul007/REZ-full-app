# REZ Support Copilot Ecosystem - Source of Truth

**Last Updated:** 2026-05-09
**Version:** 2.0.0
**Status:** UPDATED - Voice AI Added

---

## REPOSITORY LOCATIONS

### Primary Support Copilot: `rez-merchant-service` (ACTIVE)

```
rez-merchant-service (ACTIVE)
├── src/
│ ├── routers/
│ │ └── support.ts ← SUPPORT COPILOT MAIN
│ │ ├── support.ts (tickets)
│ │ ├── disputes.ts
│ │ ├── fraud.ts
│ │ ├── audit.ts
│ │ ├── moderation.ts
│ │ ├── liability.ts
│ │ └── prive.ts
│ └── routes/
│ ├── voice.ts ← VOICE ORDERING
│ └── support.ts
└── index.ts
```

### Secondary (Archived): `REZ-support-copilot`

```
REZ-support-copilot (ARCHIVED - 403 push error)
├── src/
│ ├── index.js ← MAIN SUPPORT COPILOT (text)
│ ├── intents/
│ ├── services/
│ ├── webhooks/
│ └── voice/ (local only)
└── port: 4033
```

### Voice AI: `REZ-intelligence-hub` (ACTIVE)

```
REZ-intelligence-hub (ACTIVE)
├── src/
│ ├── index.ts (UPDATED with voice routes)
│ ├── voice/ (NEW - Voice AI module)
│ │ ├── agents/
│ │ │ ├── orderAgent.js
│ │ │ ├── bookingAgent.js
│ │ │ ├── supportAgent.js
│ │ │ ├── nluAgent.js
│ │ │ └── swarmOrchestrator.js
│ │ ├── services/
│ │ │ ├── stt.js (Speech-to-Text)
│ │ │ ├── tts.js (Text-to-Speech)
│ │ │ └── voiceRouter.js
│ │ └── webhooks/
│ │ ├── twilioWebhook.js
│ │ └── dailyWebhook.js
│ └── services/
│ └── routes/
└── port: 4020
```

---

## SUPPORT COPILOT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  SUPPORT COPILOT ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ CLIENTS (Who uses Support Copilot)                    │ │
│  │ Consumer App │ QR (rez-now) │ Merchant App │ Staff │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ SUPPORT COPILOT - rez-merchant-service (Port 3000)  │ │
│  │ ├── /api/v1/merchant/support ← Tickets             │ │
│  │ ├── /api/v1/merchant/voice ← Voice Ordering        │ │
│  │ ├── /api/v1/merchant/disputes ← Disputes          │ │
│  │ └── /api/v1/merchant/fraud ← Fraud                │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ VOICE AI - REZ-intelligence-hub (Port 4020)         │ │
│  │ ├── /api/voice/process ← Voice Processing           │ │
│  │ ├── /webhook/voice/twilio ← Phone Calls           │ │
│  │ └── 5 Autonomous Agents                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ SERVICES                                            │ │
│  │ Order │ Payment │ Wallet │ Loyalty │ Merchant       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## SUPPORT COPILOT SERVICES

### Production URLs

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Merchant Service** | https://rez-merchant-service-n3q2.onrender.com | 3000 | Active |
| **Intelligence Hub** | https://REZ-intelligence-hub.onrender.com | 4020 | Active |
| **Support Copilot** | https://REZ-support-copilot.onrender.com | 4033 | Archived |

### Environment Variables

```bash
# Merchant Service
REZ_MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com

# Intelligence Hub
REZ_MIND_URL=https://REZ-intelligence-hub.onrender.com
REZ_INTELLIGENCE_URL=https://REZ-intelligence-hub.onrender.com

# Support Copilot (archived)
REZ_SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com
```

---

## FEATURES

### Intent Detection (16 Intents)

| Intent | Keywords |
|--------|----------|
| ORDER | order, want, delivery, pickup, takeaway |
| BOOK | book, reserve, table, reservation |
| ENQUIRE | what, when, where, how, price |
| COMPLAINT | bad, wrong, cold, late, refund, issue |
| GREETING | hi, hello, hey, good morning |
| SEARCH | find, look for, nearby, recommend |
| USER_INFO | my profile, my orders, account |
| PAYMENT | pay, payment, refund, transaction |
| DELIVERY | deliver, track, ETA, arrive |
| FEEDBACK | review, rating, feedback, stars |
| RESCHEDULE | reschedule, change time, postpone |
| CANCEL | cancel, stop, remove, undo |
| DIETARY | vegetarian, vegan, halal, allergy |
| OPENING_HOURS | open, closed, hours, timing |
| LOCATION | address, where, directions |
| CONTACT | call, phone, email, whatsapp |

---

## VOICE AI (5 AUTONOMOUS AGENTS)

### Agents

| Agent | File | Purpose |
|-------|------|---------|
| **OrderAgent** | orderAgent.js | Create, track, cancel orders |
| **BookingAgent** | bookingAgent.js | Tables, appointments, classes |
| **SupportAgent** | supportAgent.js | Complaints, payments, refunds |
| **NLUAgent** | nluAgent.js | Entity extraction, sentiment |
| **SwarmOrchestrator** | swarmOrchestrator.js | Multi-agent coordination |

### Voice Intents

| Intent | Example |
|--------|---------|
| quick_order | "Order biryani for delivery" |
| track_order | "Track my order" |
| cancel_order | "Cancel my order" |
| restaurant_reserve | "Book a table for 4 at 7pm" |
| speak_agent | "Connect me to someone" |

### Voice APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/voice/process` | POST | Process voice/text |
| `/api/voice/text` | POST | Text with TTS |
| `/api/agents/status` | GET | Agent health |
| `/health/voice` | GET | Voice service health |
| `/webhook/voice/twilio` | POST | Phone calls |
| `/webhook/voice/daily` | POST | Video calls |

---

## WHO USES SUPPORT COPILOT?

### Client Apps

| App | File | Endpoint |
|-----|------|----------|
| **Consumer App** | rezMind.ts | /api/chat |
| **QR (rez-now)** | supportChat.ts | /api/chat |
| **Merchant App** | support.ts | /api/v1/merchant/support |

### Integration Code

```typescript
// Consumer App
const SUPPORT_URL = process.env.REZ_SUPPORT_COPILOT_URL || 'https://REZ-support-copilot.onrender.com';
await fetch(`${SUPPORT_URL}/api/chat`, { method: 'POST', body: {...} });

// QR (rez-now)
const SUPPORT_COPILOT_URL = process.env.NEXT_PUBLIC_SUPPORT_COPILOT_URL;
await fetch(`${SUPPORT_COPILOT_URL}/api/chat`, { method: 'POST' });

// Merchant
fetch('/api/v1/merchant/support/tickets', { method: 'GET' });
```

---

## DATABASE COLLECTIONS

### Merchant Service (Support)

| Collection | Purpose |
|------------|---------|
| supporttickets | Support ticket tracking |
| disputes | Settlement disputes |
| auditlogs | Activity trail |
| merchantliabilities | Settlement records |
| reviews | Moderation data |

### Intelligence Hub

| Collection | Purpose |
|------------|---------|
| user_profiles | User intelligence |
| conversations | Chat history |

---

## WEBHOOKS

### Inbound

| Endpoint | Trigger | Creates |
|----------|---------|---------|
| `/webhooks/order/created` | Order placed | Tracking ticket |
| `/webhooks/order/status` | Status change | Cancellation ticket |
| `/webhooks/order/issue` | Issue reported | Issue ticket |
| `/webhooks/order/refund` | Refund requested | Refund ticket |

### Outbound

| Destination | Trigger |
|-------------|---------|
| REZ Event Platform | All interactions |
| Merchant Copilot | Feedback |

---

## EXTERNAL SERVICE INTEGRATIONS

| Service | URL | Purpose |
|---------|-----|---------|
| REZ Mind | Port 4020 | AI intent enhancement |
| Order Service | Port 4012 | Order tracking |
| Booking Service | Port 4013 | Reservations |
| Event Platform | Port 4010 | Event logging |
| Knowledge Base | Port 4011 | FAQ resolution |

---

## GAPS IDENTIFIED

| Gap | Severity | Recommendation |
|-----|----------|------------------|
| Support copilot archived | Critical | Use merchant-service |
| Duplicate chat services | Medium | Consolidate |
| No ML model training | High | Implement BERT/TF-IDF |
| Hardcoded menus | Medium | Database-driven |
| Missing API versioning | Medium | Add /v1/ prefix |

---

## RECOMMENDATIONS

### Immediate (Week 1)

1. **Use merchant-service** for all support endpoints
2. **Add voice endpoints** to intelligence-hub
3. **Consolidate** duplicate chat services

### Short-term (Month 1)

1. Implement BERT/TF-IDF for intent classification
2. Add rate limiting to all endpoints
3. Database-driven room service menu

### Long-term (Quarter)

1. Full ML training pipeline
2. Multi-language support expansion
3. Real-time chat in support copilot

---

## FILES REFERENCE

### Support Copilot

```
REZ-support-copilot/
├── src/index.js              # Main server
├── src/intents/             # Intent handlers
├── src/services/            # Service integrations
├── src/webhooks/            # Webhook handlers
├── src/voice/               # Voice AI (local)
└── training-data/           # Training data
```

### Merchant Service

```
rez-merchant-service/
├── src/routers/support.ts   # Support routes
├── src/routes/voice.ts       # Voice ordering
└── src/routes/support.ts     # Support API
```

### Intelligence Hub

```
REZ-intelligence-hub/
├── src/index.ts             # Main server (updated)
└── src/voice/              # Voice AI module
    ├── agents/              # 5 autonomous agents
    ├── services/            # STT, TTS
    └── webhooks/            # Twilio, Daily.co
```

---

**Document Version:** 2.0.0
**Last Updated:** May 9, 2026
