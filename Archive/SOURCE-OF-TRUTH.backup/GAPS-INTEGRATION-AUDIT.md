# ReZ Ecosystem - Gaps, Integration Audit & Customer Support

**Last Updated**: 2026-04-27

---

## Current System Status

### ✅ Built
| Component | Status |
|-----------|--------|
| @rez/intent-graph package | ✅ Complete |
| 8 Commerce Memory Agents | ✅ Complete |
| rez-agent-os (Agent OS) | ✅ Complete |
| rez-chat-service | ✅ Complete |
| rez-chat-ai | ✅ Complete |
| rez-app-consumer | ⚠️ Partial |

### ❌ Missing / Gaps

---

## Critical Gaps

### 1. Chat NOT Connected to Commerce Memory ❌

**Problem**:
```
rez-chat-ai / rez-chat-service
        ↓
    NO INTENT DATA
        ↓
  Generic responses
        ↓
  No personalization
```

**What Should Happen**:
```
User chats: "I want to book a hotel"
        ↓
AI Handler checks Commerce Memory:
  • User searched "Goa hotels" 3 days ago
  • Intent went DORMANT
  • Revival score: 85%
        ↓
AI Response: "I see you were looking at Goa!
  Want me to show you those hotels?"
        ↓
[Commerce Memory context enriched]
```

**Files to Fix**:
- `packages/rez-chat-ai/src/` - Add Commerce Memory integration
- `packages/rez-chat-service/src/hooks/useAIChat.ts` - Pass intent context

---

### 2. Customer Support NOT Integrated ❌

**Problem**:
```
Support chat exists but:
• No access to user's browsing history
• No view of dormant intents
• Can't trigger revival from chat
• No context about what user was doing
```

**What Should Happen**:
```
User opens support chat:
        ↓
Agent sees:
┌─────────────────────────────────────────┐
│ 📋 Customer Context (from Commerce Memory) │
├─────────────────────────────────────────┤
│ User has DORMANT INTENT:               │
│ • "Goa hotel" - searched 3 days ago  │
│ • "Italian restaurant" - viewed 5 days ago │
│                                         │
│ Previous orders: ₹8,500 (loyalty: 65%) │
│ Preferred: Push notifications          │
│ Best contact time: 9 AM, 7 PM         │
└─────────────────────────────────────────┘
        ↓
Support agent can:
• "I see you were looking for Goa hotels!
  Let me help you find one."
• Trigger revival nudge while on chat
• Offer personalized discount
```

---

### 3. Agents NOT Triggering Actions ❌

**Current**: 8 agents run on cron, generate signals
**Missing**: Agents can't trigger real actions

**What Should Happen**:
```
[Demand Signal Agent] detects spike:
        ↓
[Scarcity Agent] sees low inventory:
        ↓
[Feedback Loop Agent] determines optimal action:
        ↓
[Triggers via Agent OS]:
• Send push notification
• Update merchant dashboard
• Trigger AI chat proactive message
• Adjust pricing automatically
```

---

## Integration Gaps Matrix

### User Apps

| App | Intent Capture | Commerce Memory | Chat AI | Support Context |
|-----|--------------|----------------|---------|-----------------|
| **ReZ App** | ⚠️ Partial | ❌ Not connected | ❌ Not integrated | ❌ No context |
| **ReZ Now** | ⚠️ Partial | ❌ Not connected | ❌ Not integrated | ❌ No context |
| **ReZ Web Menu** | ❌ Missing | ❌ Not connected | ❌ Not integrated | ❌ No context |
| **Rendez** | ❌ Missing | ❌ Not connected | ❌ Not integrated | ❌ No context |
| **Karma** | ❌ Missing | ❌ Not connected | ❌ Not integrated | ❌ No context |
| **Stay Own** | ⚠️ Partial | ❌ Not connected | ❌ Not integrated | ❌ No context |

### Merchant Apps

| App | Demand Dashboard | Scarcity Alerts | Agent Triggers | Auto Actions |
|-----|-----------------|-----------------|----------------|--------------|
| **ReZ Merchants** | ⚠️ Basic | ❌ Missing | ❌ Not connected | ❌ Missing |
| **AdBazzar** | ❌ Missing | ❌ Missing | ❌ Not connected | ❌ Missing |
| **NextaBiZ** | ❌ Missing | ❌ Missing | ❌ Not connected | ❌ Missing |
| **Hotel PMS** | ❌ Missing | ❌ Missing | ❌ Not connected | ❌ Missing |

### Internal Services

| Service | Intent Data | Chat AI | Customer Support | Auto Actions |
|---------|-------------|---------|-----------------|--------------|
| **rez-chat-service** | ❌ Not integrated | ✅ Exists | ✅ Exists | ❌ Missing |
| **rez-chat-ai** | ❌ Not integrated | ✅ Exists | ✅ Exists | ❌ Missing |
| **rez-intent-graph** | ✅ Complete | ✅ Complete | ❌ Not connected | ❌ Missing |
| **rez-agent-os** | ❌ Not integrated | ✅ Exists | ❌ Not connected | ❌ Missing |

---

## What's NOT Integrated

### ❌ Missing: Commerce Memory → Chat AI

```
WANTED FLOW:
User message → Chat AI → Commerce Memory check → Personalized response

ACTUAL FLOW:
User message → Chat AI → Generic response (NO CONTEXT)
```

**Files Needed**:
```
packages/rez-chat-ai/src/
├── memory/
│   ├── intentContext.ts      # NEW: Get user intent context
│   └── userProfile.ts        # NEW: Get user preferences
├── tools/
│   └── intentTools.ts       # NEW: Tool definitions
└── handlers/
    └── contextHandler.ts     # NEW: Merge context into prompts
```

---

### ❌ Missing: Commerce Memory → Customer Support

```
WANTED FLOW:
Support opens chat → System loads Commerce Memory → Shows user context

ACTUAL FLOW:
Support opens chat → Shows name/phone only (NO PURCHASE INTENT)
```

**Files Needed**:
```
packages/rez-chat-service/src/
├── providers/
│   └── CommerceMemoryProvider.tsx  # NEW: Provide context to support
└── hooks/
    └── useCustomerIntent.ts        # NEW: Load customer intents
```

---

### ❌ Missing: 8 Agents → Real Actions

```
WANTED FLOW:
Agent detects signal → Triggers action → Real system change

ACTUAL FLOW:
Agent detects signal → Saves to memory → NO EXTERNAL ACTION
```

**Agents can't currently**:
- Send push notifications
- Trigger chat messages
- Update prices
- Alert merchants
- Escalate to support

---

## Customer Support Integration Design

### Current Support Flow (Broken)
```
User → Support Chat → Agent (no context) → Generic help
```

### Desired Support Flow
```
User → Support Chat → Agent 
        ↓
    Commerce Memory
        ↓
    ┌─────────────────────────┐
    │ User Context:           │
    │ • Active intents (3)   │
    │ • Dormant intents (5)  │
    │ • Recent orders        │
    │ • Preferences          │
    │ • Pain points         │
    └─────────────────────────┘
        ↓
    AI-assisted response
        ↓
    Can trigger:
    • Revive nudge
    • Offer discount
    • Escalate properly
```

---

## Required Integrations

### 1. Connect Chat AI to Commerce Memory

```typescript
// packages/rez-chat-ai/src/memory/intentContext.ts

import { getEnrichedContext } from '@rez/intent-graph';

export async function getChatContext(userId: string) {
  // Get full intent context
  const context = await getEnrichedContext(userId);
  
  // Format for AI prompt
  return {
    activeIntents: context.activeIntents.map(i => ({
      what: i.key,
      confidence: Math.round(i.confidence * 100) + '%',
      when: formatTimeAgo(i.lastSeenAt)
    })),
    dormantIntents: context.dormantIntents.map(d => ({
      what: d.key,
      daysAgo: d.daysDormant,
      revivalScore: Math.round(d.revivalScore * 100) + '%',
      why: getRevivalReason(d)
    })),
    profile: {
      travelAffinity: context.crossAppProfile.travelAffinity,
      diningAffinity: context.crossAppProfile.diningAffinity,
      preferredChannel: getPreferredChannel(context.crossAppProfile)
    }
  };
}
```

### 2. Connect Support to Commerce Memory

```typescript
// packages/rez-chat-service/src/hooks/useCustomerIntent.ts

export function useCustomerIntent(userId: string) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from Commerce Memory
    getChatContext(userId).then(ctx => {
      setContext(ctx);
      setLoading(false);
    });
  }, [userId]);

  return { context, loading };
}
```

### 3. Connect 8 Agents to Actions

```typescript
// src/agents/action-triggers.ts

export async function triggerAgentAction(agent: string, signal: unknown) {
  switch (agent) {
    case 'demand-signal-agent':
      if (signal.spikeDetected) {
        await triggerPushNotification({
          type: 'demand_alert',
          merchantId: signal.merchantId,
          message: `High demand for ${signal.category}!`
        });
        await updateMerchantDashboard(signal);
      }
      break;

    case 'scarcity-agent':
      if (signal.urgencyLevel === 'critical') {
        await triggerUrgencyNudge({
          type: 'scarcity_alert',
          merchantId: signal.merchantId,
          urgency: signal.scarcityScore
        });
      }
      break;

    case 'feedback-loop-agent':
      if (signal.type === 'revenue_drop') {
        await alertSupportTeam(signal);
        await triggerRecoveryActions(signal);
      }
      break;
  }
}
```

---

## Action Plan

### Phase 1: Chat AI Integration (3 days)

```
□ Create intent context loader for chat
□ Add Commerce Memory tools to AI handler
□ Update AI prompts to include intent context
□ Test: "I want to book a hotel" → Shows Goa search context
```

### Phase 2: Support Integration (2 days)

```
□ Create useCustomerIntent hook
□ Build support context panel
□ Add "Trigger Revival" button for agents
□ Test: Support sees user browsing history
```

### Phase 3: Agent Actions (5 days)

```
□ Create action trigger system
□ Connect agents to:
  • Push notification service
  • Merchant dashboard updates
  • AI proactive messages
  • Price adjustment system
□ Test: Demand spike → Auto price increase
```

### Phase 4: Full Automation (7 days)

```
□ Implement dangerous auto-actions (skip permission)
□ Set up:
  • Auto price adjustments
  • Auto inventory alerts
  • Auto nudge triggers
  • Auto support escalation
□ Add safety thresholds
□ Test: End-to-end flow
```

---

## Dangerous Auto-Actions (Skip Permission)

These actions will happen AUTOMATICALLY without user confirmation:

### ✅ Approved Auto-Actions
| Action | Threshold | Risk |
|--------|-----------|------|
| Send nudge | Revival score > 70% | Low |
| Update dashboard | Always | None |
| Alert merchant | Scarcity > 70% | Low |
| Adjust price | Demand spike 3x | Medium |
| Pause nudge | Conversion < 1% | Low |

### ⚠️ Requires Approval
| Action | Threshold | Risk |
|--------|-----------|------|
| Send discount | Always ask | Medium |
| Trigger refund | Always ask | High |
| Cancel order | Always ask | Critical |
| Change user data | Always ask | High |

---

## Summary: What Needs to be Built

### Critical (Block Revenue)
1. ❌ Chat AI → Commerce Memory connection
2. ❌ Support → Commerce Memory connection
3. ❌ Agent → Action triggers

### High Priority (Impact)
4. ❌ Push notification integration
5. ❌ Merchant dashboard updates
6. ❌ Auto price adjustments

### Medium Priority
7. ❌ Proactive chat messages
8. ❌ Support escalation automation
9. ❌ Cross-app intent sync

---

## Quick Wins (This Week)

```
Day 1-2: Chat AI Context
□ Create getChatContext() function
□ Add to AI prompt injection
□ Test with sample user

Day 3-4: Support Panel  
□ Create useCustomerIntent hook
□ Build context panel component
□ Connect to support chat UI

Day 5-7: Agent Actions
□ Create action trigger system
□ Connect demand agent → notifications
□ Connect scarcity agent → alerts
□ Test end-to-end
```

---

## Files to Create/Modify

### Create
```
packages/rez-chat-ai/src/memory/intentContext.ts
packages/rez-chat-ai/src/tools/intentTools.ts
packages/rez-chat-service/src/hooks/useCustomerIntent.ts
src/agents/action-triggers.ts
```

### Modify
```
packages/rez-chat-ai/src/handlers/aiHandler.ts - Add context
packages/rez-chat-service/src/providers/ChatProvider.tsx - Add context
src/agents/*.ts - Add action triggers
```

---

*Status: Gaps identified, integration required*
*Next: Implement Phase 1-3*
