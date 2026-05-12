# REZ CRM Dashboard - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Dashboard Interface](#2-dashboard-interface)
3. [Contact Management](#3-contact-management)
4. [Contact Timeline](#4-contact-timeline)
5. [Segment Builder](#5-segment-builder)
6. [Lead Scoring](#6-lead-scoring)
7. [Campaign Management](#7-campaign-management)
8. [Automation Rules](#8-automation-rules)
9. [Analytics & Reports](#9-analytics--reports)
10. [Integrations](#10-integrations)

---

# 1. OVERVIEW

## 1.1 What is REZ CRM Dashboard?

REZ CRM Dashboard provides **visual contact management** with AI-powered insights - enabling merchants to manage customer relationships, build segments, and automate communications.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRM DASHBOARD - WHAT YOU SEE │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ CUSTOMERS │ LEADS │ CAMPAIGNS │ AUTOMATIONS │ ANALYTICS           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐    │
│  │ OVERVIEW CARD         │  │                                        │    │
│  │                       │  │         CUSTOMER LIST                  │    │
│  │ Total Customers: 1,234 │  │                                        │    │
│  │ New This Week: 89      │  │  🔍 Search customers...               │    │
│  │ Active: 856            │  │  ──────────────────────────────────   │    │
│  │ At Risk: 45            │  │                                        │    │
│  │                       │  │  ⭐ John D. | john@...  │ ₹12,500 │    │
│  │ ┌───────────────────┐ │  │  🔥 Priya S. | priya@... │ ₹8,200  │    │
│  │ │ Chart: Customers │ │  │  🆕 Rahul M. | rahul@... │ ₹1,500  │    │
│  │ │ over time         │ │  │  ⚠️ At Risk                  │         │    │
│  │ └───────────────────┘ │  │                                        │    │
│  └───────────────────────┘  │  [Export] [Add Customer] [Segment]    │    │
│                              └────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ RECENT ACTIVITY                                                       │    │
│  │                                                                       │    │
│  │ • John D. placed order #1234 - 5 mins ago                          │    │
│  │ • Priya S. opened "Win-back Campaign" - 15 mins ago                │    │
│  │ • Rahul M. clicked "Order Now" - 1 hour ago                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Differentiators

| Feature | Competitors | REZ CRM Dashboard |
|---------|-------------|-------------------|
| **Visual Contact View** | List only | Timeline + Profile + Interactions |
| **AI-Powered Scoring** | Manual | ML-based lead scoring |
| **Segment Builder** | Basic | Drag & drop visual builder |
| **WhatsApp Native** | Third-party | Built-in messaging |
| **Automation** | Rules only | AI-powered triggers |
| **Real-time Sync** | Batch | Real-time with REZ Profile |

---

# 2. DASHBOARD INTERFACE

## 2.1 Main Navigation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [REZ Logo]  [Dashboard] [Contacts] [Leads] [Campaigns] [Automations]    │
│              [Analytics] [Settings]                    [🔔] [👤 Merchant]  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (when in Contacts)                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CONTACTS                                                                  │
│  ─────────────────────────────────                                         │
│  📊 All Contacts (1,234)                                                   │
│  ⭐ Customers (856)                                                        │
│  🆕 Leads (234)                                                           │
│  🏆 VIPs (45)                                                             │
│  ⚠️ At Risk (45)                                                          │
│  😴 Dormant (89)                                                          │
│                                                                              │
│  SEGMENTS                                                                  │
│  ─────────────────────────────────                                         │
│  📌 New This Week (89)                                                     │
│  📌 High LTV (156)                                                        │
│  📌 Cart Abandoners (23)                                                   │
│  📌 Win-back Eligible (156)                                                │
│                                                                              │
│  [+ Create Segment]                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Dashboard Overview

```typescript
interface DashboardOverview {
  // Key metrics
  metrics: {
    totalContacts: number;
    newContactsThisWeek: number;
    activeContacts: number;
    atRiskContacts: number;
    dormantContacts: number;
  };

  // Charts
  charts: {
    contactGrowth: TimeSeriesData;
    customerValue: DistributionData;
    activityBreakdown: PieData;
  };

  // Lists
  lists: {
    recentOrders: Order[];
    recentConversations: Conversation[];
    upcomingBirthdays: Contact[];
    expiringSubscriptions: Contact[];
  };

  // Alerts
  alerts: Alert[];
}

interface Alert {
  id: string;
  type: 'INFO' | 'WARNING' | 'ACTION_REQUIRED';
  title: string;
  description: string;
  action?: {
    label: string;
    url: string;
  };
  createdAt: Date;
}
```

---

# 3. CONTACT MANAGEMENT

## 3.1 Contact Profile

```typescript
interface ContactProfile {
  // Basic info
  contactId: string;
  merchantId: string;

  // Identity
  name: {
    firstName: string;
    lastName: string;
    displayName?: string;
    salutation?: 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.';
  };

  // Communication
  phone: string;
  email?: string;
  whatsappNumber?: string;
  preferredChannel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'CALL';

  // Demographics
  demographics?: {
    dateOfBirth?: Date;
    gender?: string;
    location?: {
      city: string;
      state: string;
      country: string;
      pincode?: string;
    };
    language?: string[];
    occupation?: string;
  };

  // Business
  business?: {
    company?: string;
    designation?: string;
    industry?: string;
    annualRevenue?: number;
    employeeCount?: number;
  };

  // Preferences
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      push: boolean;
    };
    marketingConsent: {
      granted: boolean;
      grantedAt?: Date;
      source?: string;
      withdrawnAt?: Date;
    };
    dietaryRestrictions?: string[];
    interests?: string[];
    favoriteCategories?: string[];
  };

  // Tags
  tags: string[];

  // Custom fields
  customFields: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}
```

## 3.2 Contact Card Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONTACT CARD                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ⭐ John Doe                                                               │
│  📧 john.doe@email.com                                                    │
│  📱 +91 98765 43210                                                       │
│  📍 Mumbai, Maharashtra                                                    │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  CUSTOMER TYPE: ⭐ Gold Customer                                           │
│  TOTAL ORDERS: 47  |  TOTAL SPENT: ₹12,500                               │
│  LAST ORDER: 3 days ago    |  AOV: ₹266                                   │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  SEGMENTS: [Gold Customer] [Food Lover] [Frequent Buyer]                  │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  AI INSIGHTS:                                                              │
│  🔥 High Intent - Ordered 3x this week                                     │
│  🎯 Propensity Score: 87%                                                 │
│  ⚠️ Churn Risk: 12% (Low)                                                 │
│                                                                              │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  [📱 Message] [📞 Call] [✏️ Edit] [📋 Add to Campaign]                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.3 Contact List View

```typescript
interface ContactListView {
  // Columns
  columns: Array<{
    id: string;
    name: string;
    width: number;
    sortable: boolean;
    visible: boolean;
    format?: 'TEXT' | 'CURRENCY' | 'DATE' | 'BADGE' | 'AVATAR';
  }>;

  // Default columns
  defaultColumns = [
    { id: 'avatar', name: '', width: 50 },
    { id: 'name', name: 'Name', width: 200, sortable: true },
    { id: 'phone', name: 'Phone', width: 150 },
    { id: 'type', name: 'Type', width: 120, format: 'BADGE' },
    { id: 'totalOrders', name: 'Orders', width: 80, sortable: true },
    { id: 'totalSpent', name: 'Spent', width: 100, format: 'CURRENCY', sortable: true },
    { id: 'lastOrder', name: 'Last Order', width: 120, format: 'DATE' },
    { id: 'churnRisk', name: 'Risk', width: 80, format: 'BADGE' },
    { id: 'actions', name: '', width: 150 }
  ];

  // Filters
  filters: Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  // Sort
  sort: {
    field: string;
    direction: 'ASC' | 'DESC';
  };

  // Pagination
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}
```

---

# 4. CONTACT TIMELINE

## 4.1 Timeline Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONTACT TIMELINE - John Doe                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ FILTER: [All ▼] [Orders] [Messages] [Notes] [Campaigns]              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  TODAY                                                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 📱 MESSAGE RECEIVED                                      10:30 AM    │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │ "Hi, I want to track my order #1234"                               │  │
│  │                                                                   │  │
│  │ [Reply] [View Order]                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 📦 ORDER DELIVERED                                      9:45 AM     │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │ Order #1234 - Chicken Biryani + Coke                               │  │
│  │ Total: ₹349 | Delivered in 35 mins                                  │  │
│  │                                                                   │  │
│  │ [View Order] [Request Review]                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  YESTERDAY                                                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 📧 CAMPAIGN SENT                                        6:00 PM     │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │ "Win-back: 20% off your next order"                                │  │
│  │ Campaign: Win-back Campaign                                         │  │
│  │                                                                   │  │
│  │ Status: Delivered ✓ | Opened: Yes ✓                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 💬 NOTE ADDED                                          3:30 PM     │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │ "Customer prefers spicy food. Always include extra green chutney    │  │
│  │  with biryani orders." - by Staff: Rahul                           │  │
│  │                                                                   │  │
│  │ [Edit Note] [Delete]                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 📱 MESSAGE SENT                                       2:15 PM      │  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │ "Your order is being prepared! Estimated delivery: 40 mins 🚀"    │  │
│  │                                                                   │  │
│  │ Status: Read ✓                                                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│  THIS WEEK                                                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ 📦 ORDER PLACED                                       May 10, 2:30 PM│  │
│  │ ─────────────────────────────────────────────────────────────────── │  │
│  │ Order #1233 - Paneer Tikka + Naan                                  │  │
│  │ Total: ₹299 | Payment: REZ Wallet                                  │  │
│  │                                                                   │  │
│  │ [View Order]                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Timeline Event Types

```typescript
interface TimelineEvent {
  eventId: string;
  contactId: string;
  merchantId: string;

  // Event type
  type: TimelineEventType;

  // Content
  content: {
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  };

  // Source
  source: {
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'CALL' | 'IN_APP' | 'SYSTEM' | 'MANUAL';
    type: 'ORDER' | 'CAMPAIGN' | 'NOTE' | 'CALL' | 'CHAT' | 'AUTOMATION';
  };

  // Related entities
  relatedEntities?: {
    orderId?: string;
    campaignId?: string;
    conversationId?: string;
    staffId?: string;
  };

  // Engagement metrics
  engagement?: {
    viewed?: boolean;
    clicked?: boolean;
    responded?: boolean;
    converted?: boolean;
  };

  // Timestamps
  createdAt: Date;
  occurredAt: Date;
}

type TimelineEventType =
  // Orders
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PREPARING'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_REFUNDED'

  // Messages
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_READ'
  | 'MESSAGE_CLICKED'

  // Campaigns
  | 'CAMPAIGN_SENT'
  | 'CAMPAIGN_OPENED'
  | 'CAMPAIGN_CLICKED'
  | 'CAMPAIGN_UNSUBSCRIBED'

  // Communication
  | 'CALL_INCOMING'
  | 'CALL_OUTGOING'
  | 'CALL_MISSED'
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'

  // Notes
  | 'NOTE_ADDED'
  | 'NOTE_UPDATED'
  | 'TAG_ADDED'
  | 'TAG_REMOVED'

  // System
  | 'PROFILE_CREATED'
  | 'PROFILE_UPDATED'
  | 'SEGMENT_ADDED'
  | 'SEGMENT_REMOVED'
  | 'AUTOMATION_TRIGGERED'
  | 'SCORE_UPDATED';
```

## 4.3 Timeline Quick Actions

```typescript
interface TimelineQuickActions {
  // Available actions
  actions: Array<{
    id: string;
    label: string;
    icon: string;
    action: 'MESSAGE' | 'CALL' | 'NOTE' | 'TAG' | 'CAMPAIGN' | 'SEGMENT';
    shortcut?: string;
  }>;

  // Context menu actions
  contextActions: {
    editContact: boolean;
    deleteContact: boolean;
    addToCampaign: boolean;
    createSegment: boolean;
    exportContact: boolean;
    viewFullProfile: boolean;
  };
}
```

---

# 5. SEGMENT BUILDER

## 5.1 Visual Segment Builder

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SEGMENT BUILDER                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Segment Name: [New Customers This Week                    ]                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CONDITIONS                                                             │   │
│  │ ──────────────────────────────────────────────────────────────────  │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ AND ▼ │ [Date Added ▼] [is in the last ▼] [7 ▼] [days]    │   │   │
│  │  │                                                           │   │   │
│  │  │  [+ Add condition]  [Add group]  [Remove]                  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ AND ▼ │ [Total Orders ▼] [is greater than ▼] [5]          │   │   │
│  │  │                                                           │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ AND ▼ │ [Segment ▼] [does not contain ▼] [Churned]       │   │   │
│  │  │                                                           │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  [+ Add condition]                                                  │   │
│  │                                                                      │   │
│  │  ─────────────────────────────────────────────────────────────────  │   │
│  │                                                                      │   │
│  │  🔍 Preview: 156 contacts match                                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [+ Save Segment]  [Cancel]                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5.2 Condition Types

```typescript
interface SegmentCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  connector: 'AND' | 'OR';
}

interface ConditionGroup {
  id: string;
  conditions: SegmentCondition[];
  connector: 'AND' | 'OR';
}

// Available fields
const segmentFields = {
  // Demographics
  'contact.name': { type: 'STRING', label: 'Name' },
  'contact.phone': { type: 'STRING', label: 'Phone' },
  'contact.email': { type: 'STRING', label: 'Email' },
  'contact.city': { type: 'STRING', label: 'City' },
  'contact.state': { type: 'STRING', label: 'State' },
  'contact.language': { type: 'STRING', label: 'Preferred Language' },
  'contact.dateAdded': { type: 'DATE', label: 'Date Added' },
  'contact.dateOfBirth': { type: 'DATE', label: 'Date of Birth' },

  // Orders
  'order.totalOrders': { type: 'NUMBER', label: 'Total Orders' },
  'order.totalSpent': { type: 'NUMBER', label: 'Total Spent' },
  'order.averageOrderValue': { type: 'NUMBER', label: 'Average Order Value' },
  'order.lastOrderDate': { type: 'DATE', label: 'Last Order Date' },
  'order.lastOrderAmount': { type: 'NUMBER', label: 'Last Order Amount' },
  'order.orderFrequency': { type: 'NUMBER', label: 'Orders per Month' },

  // Behavior
  'behavior.lastActivity': { type: 'DATE', label: 'Last Activity' },
  'behavior.messageOpenRate': { type: 'NUMBER', label: 'Message Open Rate' },
  'behavior.clickRate': { type: 'NUMBER', label: 'Click Rate' },
  'behavior.cartAbandonRate': { type: 'NUMBER', label: 'Cart Abandon Rate' },

  // Engagement
  'engagement.emailOpens': { type: 'NUMBER', label: 'Email Opens (30 days)' },
  'engagement.whatsappReplies': { type: 'NUMBER', label: 'WhatsApp Replies' },
  'engagement.campaignClicks': { type: 'NUMBER', label: 'Campaign Clicks' },

  // AI/ML
  'ai.churnRisk': { type: 'NUMBER', label: 'Churn Risk Score' },
  'ai.ltvScore': { type: 'NUMBER', label: 'LTV Score' },
  'ai.propensityScore': { type: 'NUMBER', label: 'Purchase Propensity' },
  'ai.preferredCategory': { type: 'STRING', label: 'Preferred Category' },

  // Segments
  'segment': { type: 'SEGMENT', label: 'In Segment' },
  'tag': { type: 'TAG', label: 'Has Tag' },

  // Custom
  'custom': { type: 'CUSTOM', label: 'Custom Field' }
};

// Operators per type
const operators = {
  STRING: ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
  NUMBER: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between'],
  DATE: ['is', 'is_not', 'is_before', 'is_after', 'is_in_the_last', 'is_more_than'],
  BOOLEAN: ['is', 'is_not'],
  TAG: ['contains', 'not_contains'],
  SEGMENT: ['is_in', 'is_not_in']
};
```

## 5.3 Segment Presets

```typescript
interface SegmentPreset {
  id: string;
  name: string;
  description: string;
  category: 'ACQUISITION' | 'ENGAGEMENT' | 'RETENTION' | 'REACTIVATION';
  conditions: SegmentCondition[];
}

// Pre-built segments
const presetSegments: SegmentPreset[] = [
  // Acquisition
  {
    id: 'new_customers',
    name: 'New Customers',
    description: 'Customers who made their first purchase in the last 7 days',
    category: 'ACQUISITION',
    conditions: [
      { field: 'order.totalOrders', operator: 'equals', value: 1 },
      { field: 'order.lastOrderDate', operator: 'is_in_the_last', value: 7 }
    ]
  },
  {
    id: 'recent_signups',
    name: 'Recent Signups',
    description: 'Users who signed up but haven\'t ordered yet',
    category: 'ACQUISITION',
    conditions: [
      { field: 'order.totalOrders', operator: 'equals', value: 0 },
      { field: 'contact.dateAdded', operator: 'is_in_the_last', value: 30 }
    ]
  },

  // Engagement
  {
    id: 'high_engagement',
    name: 'Highly Engaged',
    description: 'Users with 80%+ message open rate',
    category: 'ENGAGEMENT',
    conditions: [
      { field: 'behavior.messageOpenRate', operator: 'greater_or_equal', value: 80 },
      { field: 'behavior.messageOpenRate', operator: 'is_not_empty', value: null }
    ]
  },

  // Retention
  {
    id: 'vip_customers',
    name: 'VIP Customers',
    description: 'Top 10% by LTV',
    category: 'RETENTION',
    conditions: [
      { field: 'ai.ltvScore', operator: 'greater_or_equal', value: 90 }
    ]
  },
  {
    id: 'repeat_buyers',
    name: 'Loyal Repeat Buyers',
    description: 'Ordered 5+ times in last 90 days',
    category: 'RETENTION',
    conditions: [
      { field: 'order.totalOrders', operator: 'greater_or_equal', value: 5 },
      { field: 'order.lastOrderDate', operator: 'is_in_the_last', value: 90 }
    ]
  },

  // Reactivation
  {
    id: 'cart_abandoners',
    name: 'Cart Abandoners',
    description: 'Added to cart but didn\'t complete purchase in 7 days',
    category: 'REACTIVATION',
    conditions: [
      { field: 'behavior.cartAbandonDate', operator: 'is_in_the_last', value: 7 },
      { field: 'order.totalOrders', operator: 'equals', value: 0 }
    ]
  },
  {
    id: 'at_risk',
    name: 'At Risk',
    description: 'Churn risk > 70%, no order in 14+ days',
    category: 'REACTIVATION',
    conditions: [
      { field: 'ai.churnRisk', operator: 'greater_than', value: 70 },
      { field: 'order.lastOrderDate', operator: 'is_more_than', value: 14 }
    ]
  }
];
```

---

# 6. LEAD SCORING

## 6.1 Lead Score Model

```typescript
interface LeadScoringModel {
  modelId: string;
  merchantId: string;

  // Scoring dimensions
  dimensions: {
    engagement: {
      weight: number;              // e.g., 0.3 (30%)
      signals: ScoreSignal[];
    };
    recency: {
      weight: number;             // e.g., 0.25 (25%)
      signals: ScoreSignal[];
    };
    frequency: {
      weight: number;             // e.g., 0.2 (20%)
      signals: ScoreSignal[];
    };
    monetary: {
      weight: number;             // e.g., 0.25 (25%)
      signals: ScoreSignal[];
    };
  };

  // Overall score
  maxScore: number;               // e.g., 100
  scoreBreakdown: {
    cold: { min: 0, max: 25 };
    warm: { min: 26, max: 50 };
    hot: { min: 51, max: 75 };
    veryHot: { min: 76, max: 100 };
  };
}

interface ScoreSignal {
  field: string;
  condition: string;
  operator: string;
  value: any;
  points: number;
}

// Example scoring rules
const scoringRules: ScoreSignal[] = [
  // Engagement signals
  { field: 'behavior.whatsappReplies', operator: '>', value: 10, points: 10 },
  { field: 'behavior.whatsappReplies', operator: '>', value: 5, points: 5 },
  { field: 'behavior.messageOpenRate', operator: '>', value: 80, points: 10 },
  { field: 'behavior.campaignClicks', operator: '>', value: 5, points: 5 },

  // Recency signals
  { field: 'behavior.lastActivity', operator: 'within_days', value: 1, points: 20 },
  { field: 'behavior.lastActivity', operator: 'within_days', value: 7, points: 10 },
  { field: 'behavior.lastActivity', operator: 'within_days', value: 30, points: 5 },

  // Frequency signals
  { field: 'order.totalOrders', operator: '>', value: 10, points: 20 },
  { field: 'order.totalOrders', operator: '>', value: 5, points: 10 },
  { field: 'order.totalOrders', operator: '>', value: 2, points: 5 },

  // Monetary signals
  { field: 'order.totalSpent', operator: '>', value: 10000, points: 20 },
  { field: 'order.totalSpent', operator: '>', value: 5000, points: 10 },
  { field: 'order.averageOrderValue', operator: '>', value: 500, points: 10 }
];
```

## 6.2 Lead Score Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LEAD SCORE                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  SCORE: 78/100                                    🔥 Very Hot Lead   │  │
│  │  ─────────────────────────────────────────────────────────────────  │  │
│  │                                                                      │  │
│  │  ████████████████████████████████████░░░░░░░  78%                   │  │
│  │                                                                      │  │
│  │  Breakdown:                                                          │  │
│  │  ├── Engagement: +25/30                                             │  │
│  │  ├── Recency: +20/25                                                │  │
│  │  ├── Frequency: +18/20                                              │  │
│  │  └── Monetary: +15/25                                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  AI INSIGHTS                                                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  ✓ Highly engaged (opened 8 of last 10 messages)                           │
│  ✓ Active in last 24 hours                                                 │
│  ✓ Frequent orderer (8 orders this month)                                 │
│  ✓ High value (₹3,200 average order)                                     │
│                                                                              │
│  RECOMMENDED ACTION                                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  🎯 Priority outreach - Send personalized offer                           │
│  📱 WhatsApp: "Hey [Name]! We have an exclusive deal just for you..."    │
│  [Send Offer] [View Profile] [Add to Campaign]                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 7. CAMPAIGN MANAGEMENT

## 7.1 Campaign Types

```typescript
interface Campaign {
  campaignId: string;
  merchantId: string;

  // Basic info
  name: string;
  description?: string;
  type: CampaignType;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

  // Target
  target: {
    type: 'SEGMENT' | 'ALL' | 'CUSTOM' | 'IMPORT';
    segmentId?: string;
    contactIds?: string[];
    fileId?: string;
    excludeSegmentIds?: string[];
  };

  // Content
  content: CampaignContent;

  // Schedule
  schedule: {
    type: 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING';
    startDateTime?: Date;
    endDateTime?: Date;
    recurring?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
      interval: number;
      daysOfWeek?: number[];    // 0-6 for weekly
      daysOfMonth?: number[];  // 1-31 for monthly
    };
  };

  // Settings
  settings: {
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH';
    allowResend: boolean;
    resendDelayHours?: number;
    trackOpens: boolean;
    trackClicks: boolean;
    trackConversions: boolean;
    conversionWindowHours?: number;
  };

  // Results
  results?: CampaignResults;
}

type CampaignType =
  | 'PROMOTIONAL'
  | 'WELCOME'
  | 'WIN_BACK'
  | 'ABANDON_CART'
  | 'REORDER'
  | 'ANNOUNCEMENT'
  | 'SURVEY'
  | 'REENGAGEMENT'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'EDUCATIONAL';
```

## 7.2 Campaign Results

```typescript
interface CampaignResults {
  // Counts
  sent: number;
  delivered: number;
  failed: number;

  // Engagement
  opened?: number;              // For email
  openedRate?: number;
  clicked?: number;
  clickRate?: number;
  replied?: number;            // For WhatsApp/SMS
  replyRate?: number;

  // Conversion
  converted?: number;
  conversionRate?: number;
  revenue?: number;

  // Unsubscriptions
  unsubscribed?: number;
  unsubscribedRate?: number;

  // Complaints
  complained?: number;          // For email
  spamReports?: number;          // For WhatsApp

  // Timeline
  startedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}
```

---

# 8. AUTOMATION RULES

## 8.1 Automation Types

```typescript
interface Automation {
  automationId: string;
  merchantId: string;

  name: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';

  // Trigger
  trigger: {
    type: AutomationTriggerType;
    config: Record<string, any>;
  };

  // Conditions (optional filters)
  conditions?: SegmentCondition[];

  // Actions
  actions: AutomationAction[];

  // Settings
  settings: {
    allowRetrigger: boolean;
    retriggerDelayDays?: number;
    maxTriggersPerContact?: number;
  };

  // Stats
  stats: {
    totalTriggered: number;
    successfulActions: number;
    failedActions: number;
    lastTriggeredAt?: Date;
  };
}

type AutomationTriggerType =
  // Event-based
  | 'ORDER_PLACED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_FAILED'
  | 'CART_ABANDONED'
  | 'SIGNUP'
  | 'PROFILE_UPDATE'
  | 'TAG_ADDED'
  | 'TAG_REMOVED'
  | 'SEGMENT_ADDED'
  | 'SEGMENT_REMOVED'

  // Date-based
  | 'DATE_TRIGGER'         // Birthday, anniversary
  | 'RECURRING'            // Daily, weekly, etc.

  // Engagement
  | 'INACTIVE_DAYS'         // No activity for X days
  | 'LOW_ENGAGEMENT'        // Below threshold
  | 'HIGH_VALUE'            // LTV crosses threshold

  // AI-based
  | 'CHURN_RISK'            // Churn score > threshold
  | 'WIN_BACK_READY'        // Eligible for win-back
  | 'UPSELL_READY';         // Ready for upsell
```

## 8.2 Automation Actions

```typescript
type AutomationAction = {
  // Message
  type: 'SEND_MESSAGE';
  config: {
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH';
    template?: string;
    customMessage?: string;
    delay?: number; // seconds
  };
} | {
  // Add tag
  type: 'ADD_TAG';
  config: {
    tags: string[];
  };
} | {
  // Remove tag
  type: 'REMOVE_TAG';
  config: {
    tags: string[];
  };
} | {
  // Add to segment
  type: 'ADD_TO_SEGMENT';
  config: {
    segmentId: string;
  };
} | {
  // Remove from segment
  type: 'REMOVE_FROM_SEGMENT';
  config: {
    segmentId: string;
  };
} | {
  // Update lead score
  type: 'UPDATE_SCORE';
  config: {
    adjustment: number; // +/- points
  };
} | {
  // Send notification
  type: 'NOTIFY_STAFF';
  config: {
    channel: 'PUSH' | 'EMAIL' | 'SMS';
    staffIds?: string[];
    message: string;
  };
} | {
  // Assign to staff
  type: 'ASSIGN_TO_STAFF';
  config: {
    staffId: string;
    roundRobin?: boolean;
  };
} | {
  // Webhook
  type: 'WEBHOOK';
  config: {
    url: string;
    method: 'POST' | 'PUT';
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
} | {
  // Delay
  type: 'DELAY';
  config: {
    duration: number; // seconds
  };
} | {
  // Condition (branch)
  type: 'CONDITION';
  config: {
    conditions: SegmentCondition[];
    ifTrue: AutomationAction[];
    ifFalse?: AutomationAction[];
  };
};
```

## 8.3 Pre-built Automations

```typescript
const presetAutomations: Automation[] = [
  {
    name: 'Welcome Series',
    trigger: { type: 'SIGNUP' },
    actions: [
      { type: 'SEND_MESSAGE', config: { channel: 'WHATSAPP', delay: 0, template: 'welcome' } },
      { type: 'DELAY', config: { duration: 86400 } }, // 1 day
      { type: 'SEND_MESSAGE', config: { channel: 'WHATSAPP', delay: 0, template: 'welcome_day2' } }
    ]
  },
  {
    name: 'Cart Abandonment Recovery',
    trigger: { type: 'CART_ABANDONED' },
    actions: [
      { type: 'DELAY', config: { duration: 3600 } }, // 1 hour
      { type: 'SEND_MESSAGE', config: { channel: 'WHATSAPP', template: 'cart_reminder' } },
      { type: 'ADD_TAG', config: { tags: ['cart_abandoned'] } }
    ]
  },
  {
    name: 'Post-Delivery Follow-up',
    trigger: { type: 'ORDER_DELIVERED' },
    actions: [
      { type: 'DELAY', config: { duration: 86400 } }, // 1 day
      { type: 'SEND_MESSAGE', config: { channel: 'WHATSAPP', template: 'review_request' } }
    ]
  },
  {
    name: 'Win-Back Campaign',
    trigger: { type: 'INACTIVE_DAYS' },
    conditions: [
      { field: 'order.lastOrderDate', operator: 'is_more_than', value: 30 }
    ],
    actions: [
      { type: 'SEND_MESSAGE', config: { channel: 'WHATSAPP', template: 'win_back' } },
      { type: 'ADD_TAG', config: { tags: ['win_back_sent'] } }
    ]
  },
  {
    name: 'Birthday Wishes',
    trigger: { type: 'DATE_TRIGGER' },
    config: {
      dateField: 'contact.dateOfBirth'
    },
    actions: [
      { type: 'SEND_MESSAGE', config: { channel: 'WHATSAPP', template: 'birthday' } },
      { type: 'UPDATE_SCORE', config: { adjustment: 10 } }
    ]
  }
];
```

---

# 9. ANALYTICS & REPORTS

## 9.1 Reports Available

```typescript
interface Report {
  reportId: string;
  name: string;
  description: string;
  category: 'CONTACTS' | 'CAMPAIGNS' | 'REVENUE' | 'ENGAGEMENT' | 'CONVERSIONS';

  // Data source
  dataSource: {
    type: 'CONTACTS' | 'ORDERS' | 'CAMPAIGNS' | 'CONVERSATIONS';
    dateRange: { start: Date; end: Date };
  };

  // Dimensions
  dimensions: string[];

  // Metrics
  metrics: Array<{
    name: string;
    aggregation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT';
  }>;

  // Filters
  filters?: SegmentCondition[];

  // Visualization
  visualization: 'TABLE' | 'CHART' | 'NUMBER' | 'FUNNEL';
  chartType?: 'LINE' | 'BAR' | 'PIE' | 'AREA';
}

// Available reports
const reports: Report[] = [
  {
    name: 'Contact Growth',
    description: 'Track new contacts over time',
    category: 'CONTACTS',
    dimensions: ['date'],
    metrics: [{ name: 'newContacts', aggregation: 'COUNT' }]
  },
  {
    name: 'Campaign Performance',
    description: 'Compare campaign effectiveness',
    category: 'CAMPAIGNS',
    dimensions: ['campaignId'],
    metrics: [
      { name: 'sent', aggregation: 'SUM' },
      { name: 'opened', aggregation: 'SUM' },
      { name: 'clicked', aggregation: 'SUM' },
      { name: 'converted', aggregation: 'SUM' }
    ]
  },
  {
    name: 'Customer Lifetime Value',
    description: 'LTV distribution across customers',
    category: 'REVENUE',
    dimensions: ['ltvBucket'],
    metrics: [{ name: 'contacts', aggregation: 'COUNT' }]
  },
  {
    name: 'Engagement Funnel',
    description: 'Track engagement stages',
    category: 'ENGAGEMENT',
    dimensions: ['stage'],
    metrics: [{ name: 'contacts', aggregation: 'COUNT' }]
  },
  {
    name: 'Conversion Analysis',
    description: 'Track conversion rates',
    category: 'CONVERSIONS',
    dimensions: ['date', 'segment'],
    metrics: [
      { name: 'impressions', aggregation: 'SUM' },
      { name: 'conversions', aggregation: 'SUM' },
      { name: 'revenue', aggregation: 'SUM' }
    ]
  }
];
```

## 9.2 Dashboard Widgets

```typescript
interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { row: number; col: number; width: number; height: number };

  // Data
  data: {
    metric: string;
    aggregation: string;
    dateRange: string;
    segment?: string;
  };

  // Visualization
  visualization: {
    type: 'NUMBER' | 'CHART' | 'TABLE' | 'LIST';
    chartType?: string;
    showTrend?: boolean;
    showComparison?: boolean;
  };
}

type WidgetType =
  | 'metric_card'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'table'
  | 'contact_list'
  | 'recent_activity'
  | 'funnel'
  | 'gauge';
```

---

# 10. INTEGRATIONS

## 10.1 Data Sync

```typescript
interface DataSync {
  // REZ Profile sync
  profileSync: {
    enabled: boolean;
    syncDirection: 'PULL' | 'PUSH' | 'BIDIRECTIONAL';
    syncFields: string[];
    syncFrequency: 'REALTIME' | 'HOURLY' | 'DAILY';
  };

  // WhatsApp sync
  whatsappSync: {
    enabled: boolean;
    syncMessages: boolean;
    syncContacts: boolean;
    syncConversations: boolean;
  };

  // Order sync
  orderSync: {
    enabled: boolean;
    includeOrders: boolean;
    includeCarts: boolean;
    includeAbandonments: boolean;
  };
}
```

## 10.2 External Integrations

```typescript
interface ExternalIntegrations {
  // Email marketing
  email: {
    provider: 'SENDGRID' | 'MAILCHIMP' | 'OTHER';
    enabled: boolean;
    syncContacts: boolean;
    campaignTracking: boolean;
  };

  // SMS
  sms: {
    provider: 'TWILIO' | 'MSG91' | 'OTHER';
    enabled: boolean;
    twoWayMessaging: boolean;
  };

  // Analytics
  analytics: {
    googleAnalytics: boolean;
    facebookPixel: boolean;
    customTracking: boolean;
  };

  // CRM export
  export: {
    csv: boolean;
    excel: boolean;
    googleSheets: boolean;
    salesforce: boolean;
    hubspot: boolean;
    zapier: boolean;
  };
}
```

---

# APPENDIX

## A. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/crm/contacts` | GET | List contacts |
| `/api/crm/contacts` | POST | Create contact |
| `/api/crm/contacts/:id` | GET | Get contact |
| `/api/crm/contacts/:id` | PUT | Update contact |
| `/api/crm/contacts/:id` | DELETE | Delete contact |
| `/api/crm/contacts/:id/timeline` | GET | Get timeline |
| `/api/crm/contacts/:id/score` | GET | Get lead score |
| `/api/crm/segments` | GET | List segments |
| `/api/crm/segments` | POST | Create segment |
| `/api/crm/segments/:id` | PUT | Update segment |
| `/api/crm/segments/:id/contacts` | GET | Get segment contacts |
| `/api/crm/campaigns` | GET | List campaigns |
| `/api/crm/campaigns` | POST | Create campaign |
| `/api/crm/campaigns/:id/send` | POST | Send campaign |
| `/api/crm/automations` | GET | List automations |
| `/api/crm/reports` | GET | Get reports |

## B. Performance Targets

| Metric | Target |
|--------|--------|
| Contact List Load | < 500ms |
| Profile Load | < 300ms |
| Timeline Load | < 500ms |
| Segment Preview | < 2s |
| Campaign Send (1000) | < 30s |
| Report Generation | < 5s |
