# ReZ Mind - Central Intelligence Hub

## Complete Shared System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REZ MIND                                       │
│                     (One Source of Truth)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ TRAINING & INTELLIGENCE                                        │   │
│  │                                                               │   │
│  │ • Intent Patterns (25+ types)                                │   │
│  │ • Sales Scripts & Templates                                    │   │
│  │ • Hinglish Patterns                                           │   │
│  │ • Objection Handlers (15+)                                   │   │
│  │ • Psychological Triggers                                       │   │
│  │ • Customer Personalities (6 types)                            │   │
│  │ • Conversation Flows                                           │   │
│  │ • Quick Actions                                               │   │
│  │ • Sentiment Patterns                                          │   │
│  │ • Escalation Rules                                            │   │
│  │ • Response Templates                                           │   │
│  │ • Transaction Patterns                                         │   │
│  │ • Purchase Intent Signals                                      │   │
│  │ • Upsell/Cross-sell Patterns                                  │   │
│  │ • Price Sensitivity Data                                       │   │
│  │ • Seasonal Promotions (12 months)                             │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ KNOWLEDGE BASE                                                │   │
│  │                                                               │   │
│  │ • FAQ (100+ questions)                                        │   │
│  │ • Policy Documents                                            │   │
│  │ • Menu Information                                            │   │
│  │ • Merchant Policies                                           │   │
│  │ • Pricing Rules                                              │   │
│  │ • Service Availability                                        │   │
│  │ • Refund Policies                                            │   │
│  │ • Cancellation Rules                                          │   │
│  │ • User Guides                                                │   │
│  │ • Troubleshooting Steps                                        │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ USER DATA                                                    │   │
│  │                                                               │   │
│  │ • User Profiles                                              │   │
│  │ • Transaction History                                         │   │
│  │ • Preferences                                                │   │
│  │ • Karma Tier                                                 │   │
│  │ • Wallet Balance                                             │   │
│  │ • Bookings                                                   │   │
│  │ • Complaints                                                 │   │
│  │ • Refunds                                                    │   │
│  │ • Feedback                                                   │   │
│  │ • Intent History                                             │   │
│  │ • Behavioral Patterns                                        │   │
│  │                                                               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │  DO APP   │ │ SUPPORT   │ │ OTHER     │
            │           │ │ COPILOT   │ │ APPS      │
            ├───────────┤ ├───────────┤ ├───────────┤
            │ Chat      │ │ Room QR   │ │ rez-app   │
            │ Wallet    │ │ All QR    │ │ Merchant  │
            │ Profile   │ │ Web Menu  │ │ Hotel     │
            │ Explore   │ │ Merchant  │ │ Restaurant│
            │ History   │ │ Dashboard │ │ ...       │
            └───────────┘ └───────────┘ └───────────┘
```

## What Gets Shared

| Category | What's Shared |
|-----------|---------------|
| **Training** | Intents, scripts, patterns, handlers |
| **Knowledge** | FAQ, policies, guides, troubleshooting |
| **Users** | Profiles, history, preferences |
| **Transactions** | All purchases, bookings, refunds |
| **Feedback** | Complaints, reviews, ratings |
| **Intelligence** | Insights, predictions, recommendations |

## API Endpoints

```
REZ MIND API
├── GET  /api/training-data        → All training patterns
├── POST /api/intent/detect        → Detect intent
├── POST /api/intent/capture       → Save intent
├── GET  /api/knowledge            → FAQ & policies
├── POST /api/knowledge/search     → Search knowledge base
├── GET  /api/user/:id/profile     → User profile
├── POST /api/user/:id/profile     → Update profile
├── GET  /api/user/:id/history    → Transaction history
├── POST /api/complaint            → Create complaint
├── GET  /api/complaint/:id        → Get complaint
├── POST /api/refund               → Request refund
├── GET  /api/refund/:id           → Get refund
├── POST /api/feedback             → Submit feedback
└── GET  /api/analytics            → Dashboard data
```

## How Apps Use It

```javascript
// Both apps fetch from ReZ Mind
const rezMind = {
  // Training
  await fetch('/api/training-data'),
  await fetch('/api/intent/detect', { text }),

  // Knowledge
  await fetch('/api/knowledge'),
  await fetch('/api/knowledge/search', { query }),

  // Users
  await fetch('/api/user/:id/profile'),
  await fetch('/api/user/:id/history'),

  // Support
  await fetch('/api/complaint', { ... }),
  await fetch('/api/refund', { ... }),
};
```

## Update Once, All Benefit

```
You update in ReZ Mind
         │
         ▼
┌─────────────────┐
│ ReZ Mind        │
│ Database        │
└────────┬────────┘
         │
         ▼
    All Apps Get Updated Data
         │
    ┌────┴────┐
    ▼ ▼ ▼ ▼ ▼
  Do Cop App Rest
```

## Real Examples

### New Intent Added
```
Input to ReZ Mind:
"Add BOOK_TURF intent"

Result:
✓ Do App can detect "book turf"
✓ Support Copilot can detect "book turf"
✓ All other apps can detect "book turf"
```

### FAQ Updated
```
Input to ReZ Mind:
"Update refund policy answer"

Result:
✓ Do App shows new refund policy
✓ Support Copilot shows new refund policy
✓ All apps show same policy
```

### User Data Shared
```
User books in Do App
         │
         ▼
┌─────────────────┐
│ ReZ Mind        │
│ Saves booking   │
└────────┬────────┘
         │
         ▼
User can see booking in Support Copilot (Room QR)
```

---

## Last Updated

**Everything is shared. Update once, all apps benefit.**
