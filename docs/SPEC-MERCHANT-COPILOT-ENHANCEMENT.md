# REZ Merchant Copilot Enhancement - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Current State](#2-current-state)
3. [Enhancement Features](#3-enhancement-features)
4. [AI Copilot Interface](#4-ai-copilot-interface)
5. [New Capabilities](#5-new-capabilities)
6. [Integrations](#6-integrations)

---

# 1. OVERVIEW

## 1.1 What We're Building

Enhancing REZ Merchant Copilot to include **REZ Media insights** - giving merchants AI-powered recommendations for WhatsApp marketing, voice campaigns, and customer engagement.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MERCHANT COPILOT - ENHANCED                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Current: Health Score + Recommendations + Decisions                       │
│                                                                              │
│  Adding:                                                                      │
│  ├── WhatsApp Marketing Insights                                           │
│  ├── AI Voice Campaign Recommendations                                    │
│  ├── Customer Engagement Analysis                                         │
│  ├── Campaign Performance Predictions                                     │
│  └── Auto-Campaign Creation                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. CURRENT STATE

## 2.1 Existing Features

| Feature | Status | Description |
|---------|--------|-------------|
| Health Score | Working | 0-100 score |
| Recommendation Engine | Working | AI recommendations |
| Competitor Analyzer | Working | Market intelligence |
| Decision Engine | Working | Actionable decisions |
| Live Data | Working | Real-time integration |
| Industry-Specific | Working | Per-vertical |

## 2.2 Enhancement Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ENHANCEMENT ROADMAP                                                       │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 1: REZ Media Insights
├── WhatsApp campaign recommendations
├── Message optimization tips
├── Audience recommendations
└── Timing suggestions

Phase 2: AI Voice Insights
├── Call volume predictions
├── IVR optimization
├── Common queries analysis
└── Voice campaign triggers

Phase 3: Unified Dashboard
├── All channels in one view
├── Cross-channel attribution
├── Unified customer view
└── Auto-campaign creation
```

---

# 3. ENHANCEMENT FEATURES

## 3.1 WhatsApp Marketing Insights

```typescript
interface WhatsAppMarketingInsights {
  // Campaign recommendations
  recommendations: Array<{
    id: string;
    type: 'WIN_BACK' | 'PROMOTION' | 'REMINDER' | 'ANNOUNCEMENT';
    title: string;
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedImpact: {
      additionalOrders: number;
      additionalRevenue: number;
    };
    targetAudience: {
      segmentId: string;
      description: string;
      size: number;
    };
    suggestedContent: {
      title: string;
      message: string;
      offer?: string;
    };
    timing: {
      bestTime: string;
      reason: string;
    };
    confidence: number;
    actions: {
      createCampaign: boolean;
      viewSegments: boolean;
    };
  }>;

  // Performance metrics
  performance: {
    totalCampaigns: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
    topPerformingTemplate: string;
    worstPerformingTemplate: string;
  };

  // Optimization tips
  optimizationTips: Array<{
    tip: string;
    expectedImpact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;

  // Audience insights
  audienceInsights: {
    activeContacts: number;
    engagedContacts: number;
    atRiskContacts: number;
    bestTimeToReach: string;
    preferredChannel: string;
  };
}
```

## 3.2 AI Voice Campaign Recommendations

```typescript
interface VoiceCampaignInsights {
  // Call analysis
  callAnalysis: {
    totalCalls: number;
    answeredCalls: number;
    avgDuration: number;
    peakCallHours: string[];
    commonIntents: Array<{
      intent: string;
      count: number;
      resolutionRate: number;
    }>;
  };

  // Recommendations
  recommendations: Array<{
    id: string;
    type: 'IVR_OPTIMIZATION' | 'CAMPAIGN' | 'AUTO_REPLY' | 'FAQ_UPDATE';
    title: string;
    description: string;
    estimatedImpact: {
      timeSaved: string;
      callsHandled: number;
    };
    actions: {
      implement: boolean;
      preview: boolean;
    };
  }>;

  // FAQ recommendations
  faqRecommendations: Array<{
    question: string;
    frequency: number;
    suggestedAnswer: string;
    addToIVR: boolean;
  }>;
}
```

## 3.3 Customer Engagement Analysis

```typescript
interface EngagementAnalysis {
  // Channel preferences
  channelPreferences: {
    whatsapp: { users: number; engagementRate: number };
    voice: { users: number; engagementRate: number };
    sms: { users: number; engagementRate: number };
    email: { users: number; engagementRate: number };
  };

  // Engagement scoring
  engagementScore: {
    overall: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    trendPercent: number;
  };

  // At-risk customers
  atRiskCustomers: {
    count: number;
    estimatedRevenue: number;
    topReasons: string[];
    recommendedAction: string;
  };

  // Growth opportunities
  growthOpportunities: Array<{
    opportunity: string;
    targetSegment: string;
    estimatedUplift: number;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}
```

---

# 4. AI COPILOT INTERFACE

## 4.1 Enhanced Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MERCHANT COPILOT - AI COPILOT                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  💬 Ask anything about your business...                               │  │
│  │  ─────────────────────────────────────────────────────────────────  │  │
│  │                                                                       │  │
│  │  "Which customers should I send a win-back campaign to?"             │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  TODAY'S INSIGHTS                                                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 🔥 IMMEDIATE ACTION                                                  │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                       │  │
│  │ 23 customers haven't ordered in 14+ days                               │  │
│  │ At-risk revenue: ₹45,600                                           │  │
│  │                                                                       │  │
│  │ [Send Win-Back Campaign] [View Customers] [Remind Me Later]        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 PERFORMANCE                                                       │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                       │  │
│  │ WhatsApp: 94% delivery rate | 67% open rate | 12% conversion      │  │
│  │ Voice: 156 calls today | 89% answered | 4.2 min avg                │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 AI RECOMMENDATIONS                                               │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │                                                                       │  │
│  │ 1. Send "Weekend Special" to "Weekend Diners" segment            │  │
│  │    Expected: +23 orders, +₹8,900 revenue                           │  │
│  │    [Create Campaign] [Preview]                                       │  │
│  │                                                                       │  │
│  │ 2. Update IVR to include "Order Status" as first option           │  │
│  │    Expected: 40% faster resolution                                  │  │
│  │    [Apply Change] [View Details]                                    │  │
│  │                                                                       │  │
│  │ 3. Add "Birthday Special" offer for next week                       │  │
│  │    12 customers have birthdays coming up                             │  │
│  │    [Create Offer] [View List]                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Natural Language Queries

```typescript
interface CopilotQueries {
  // Marketing queries
  marketing: [
    "Which customers should I send a win-back campaign to?",
    "What's my best performing message template?",
    "How many customers haven't heard from us in 30 days?",
    "Create a birthday campaign for next week",
    "What time should I send promotional messages?",
    "Show me customers at risk of churning"
  ];

  // Operations queries
  operations: [
    "What are the most common customer questions?",
    "How many calls did we get today?",
    "Why are customers calling support?",
    "Which menu items are most frequently asked about?",
    "Update my IVR menu"
  ];

  // Sales queries
  sales: [
    "What's my customer lifetime value trend?",
    "Which customers are likely to order more?",
    "What products should I recommend to each customer?",
    "Show me customers who might upgrade their orders"
  ];

  // General queries
  general: [
    "How's my business doing compared to last week?",
    "What's my health score and why?",
    "Give me a summary of today",
    "What should I focus on this week?"
  ];
}
```

## 4.3 AI Copilot Responses

```typescript
interface CopilotResponse {
  query: string;
  response: {
    text: string;
    data?: any;
    charts?: Chart[];
    tables?: Table[];
    actions?: Action[];
  };
  suggestions: string[];
}

// Example: Win-back recommendation
const winBackResponse = {
  query: "Which customers should I send a win-back campaign to?",
  response: {
    text: `I found 47 customers who haven't ordered in 14+ days.

Based on their order history and engagement, I've identified 3 priority groups:

🔥 HIGH PRIORITY (23 customers)
   - Avg previous order: ₹450
   - Last ordered: 14-21 days ago
   - Recommended: 20% off

📊 MEDIUM PRIORITY (15 customers)
   - Avg previous order: ₹280
   - Last ordered: 21-30 days ago
   - Recommended: 15% off

💤 LOW PRIORITY (9 customers)
   - Avg previous order: ₹150
   - Last ordered: 30+ days ago
   - Recommended: Free delivery offer

Total at-risk revenue: ₹45,600
Estimated recovery with campaign: ₹18,200 (40% recovery rate)
`,
    actions: [
      {
        id: 'create_campaign',
        label: 'Create Win-Back Campaign',
        type: 'CAMPAIGN',
        config: {
          segment: 'at_risk_14_days',
          template: 'win_back_20_off',
          scheduledTime: 'suggested'
        }
      }
    ]
  }
};
```

---

# 5. NEW CAPABILITIES

## 5.1 Auto-Campaign Creation

```typescript
interface AutoCampaign {
  // Campaign creation from natural language
  createFromPrompt: (prompt: string) => Campaign;

  // Pre-built campaign templates
  templates: {
    winBack: {
      name: 'Win-Back Campaign',
      trigger: '14_days_inactive',
      segments: ['at_risk', 'dormant'],
      offer: '20% off',
      timing: 'suggested'
    },
    birthday: {
      name: 'Birthday Special',
      trigger: 'birthday_upcoming',
      segments: ['birthday_week'],
      offer: 'Free dessert',
      timing: 'day_before'
    },
    reorder: {
      name: 'Reorder Reminder',
      trigger: 'reorder_pattern',
      segments: ['repeat_customers'],
      offer: '5% off',
      timing: 'order_usual_day'
    }
  };
}
```

## 5.2 Message Optimization

```typescript
interface MessageOptimizer {
  // Analyze message performance
  analyze: (messageId: string) => OptimizationResult;

  // Suggest improvements
  suggest: (message: string, context: Context) => Suggestion[];

  // A/B testing recommendations
  abTestRecommendations: {
    currentMessage: string;
    alternatives: Array<{
      message: string;
      reason: string;
      expectedLift: number;
    }>;
  };
}

interface OptimizationResult {
  messageId: string;
  performance: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
  benchmarks: {
    industryAvg: number;
    yourPastAvg: number;
  };
  issues: Array<{
    issue: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestion: string;
  }>;
}
```

## 5.3 Audience Intelligence

```typescript
interface AudienceIntelligence {
  // Customer segments
  segments: Array<{
    id: string;
    name: string;
    description: string;
    size: number;
    avgOrderValue: number;
    churnRisk: number;
    preferredChannel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'VOICE';
    bestTimeToReach: string;
    lifetimeValue: number;
  }>;

  // Predictive insights
  predictions: {
    nextOrderDate: Array<{
      customerId: string;
      predictedDate: Date;
      confidence: number;
    }>;
    churnRisk: Array<{
      customerId: string;
      riskScore: number;
      reasons: string[];
    }>;
    upSellPotential: Array<{
      customerId: string;
      potentialProducts: string[];
      estimatedUplift: number;
    }>;
  };

  // Campaign audience suggestions
  audienceSuggestions: Array<{
    campaignType: string;
    suggestedAudience: string;
    expectedSize: number;
    expectedPerformance: {
      openRate: number;
      conversionRate: number;
    };
  }>;
}
```

---

# 6. INTEGRATIONS

## 6.1 REZ Media Integration

```typescript
interface MediaIntegration {
  // WhatsApp
  whatsapp: {
    campaigns: boolean;
    templates: boolean;
    analytics: boolean;
    audienceSync: boolean;
  };

  // Voice
  voice: {
    ivrManagement: boolean;
    callAnalytics: boolean;
    campaignTriggers: boolean;
  };

  // CRM
  crm: {
    contactSync: boolean;
    segmentSync: boolean;
    activityLog: boolean;
  };

  // Analytics
  analytics: {
    crossChannelAttribution: boolean;
    customerJourney: boolean;
    revenueTracking: boolean;
  };
}
```

## 6.2 Action Buttons

```typescript
interface CopilotActions {
  // Available actions from recommendations
  available: [
    {
      action: 'CREATE_CAMPAIGN',
      label: 'Create Campaign',
      icon: '📨',
      requires: ['segment', 'template']
    },
    {
      action: 'SEND_MESSAGE',
      label: 'Send Message',
      icon: '💬',
      requires: ['audience', 'message']
    },
    {
      action: 'UPDATE_IVR',
      label: 'Update IVR',
      icon: '📞',
      requires: ['ivr_config']
    },
    {
      action: 'CREATE_OFFER',
      label: 'Create Offer',
      icon: '🎁',
      requires: ['offer_type', 'conditions']
    },
    {
      action: 'EXPORT_DATA',
      label: 'Export Data',
      icon: '📊',
      requires: ['data_type', 'format']
    }
  ];
}
```

---

# APPENDIX

## A. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/copilot/chat` | POST | Natural language query |
| `/api/copilot/recommendations` | GET | Get recommendations |
| `/api/copilot/whatsapp-insights` | GET | WhatsApp marketing insights |
| `/api/copilot/voice-insights` | GET | Voice campaign insights |
| `/api/copilot/campaigns` | POST | Create campaign from recommendation |
| `/api/copilot/audience` | GET | Audience intelligence |
| `/api/copilot/health-score` | GET | Updated health score with media metrics |
