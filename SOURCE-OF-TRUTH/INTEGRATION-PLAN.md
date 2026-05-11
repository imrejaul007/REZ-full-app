# REZ Integration Plan: Unified Chat & AI Copilot

**Document Version:** 1.0.0
**Last Updated:** 2026-05-01
**Status:** Draft
**Owner:** Platform Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Integration Phase 1: Consumer Apps - Unified Chat](#phase-1-consumer-apps---unified-chat)
4. [Integration Phase 2: Merchant Apps - AI Copilot](#phase-2-merchant-apps---ai-copilot)
5. [Integration Phase 3: Backend Services](#phase-3-backend-services)
6. [Environment Configuration](#environment-configuration)
7. [Test Plan](#test-plan)
8. [Rollback Procedures](#rollback-procedures)
9. [Priority & Timeline](#priority--timeline)

---

## Executive Summary

This document outlines a comprehensive integration plan for connecting:

1. **Unified Chat** (`rez-unified-chat`) into consumer-facing applications
2. **AI Copilot** (`rez-merchant-copilot`) into merchant-facing applications
3. **Backend Services** (`REZ-support-copilot`, `rez-search-service`) for enterprise search and support

### Target Applications

| Application | Type | Integration |
|-------------|------|-------------|
| `rez-now` | Consumer Web App | Unified Chat |
| `rez-app-consumer` | Consumer Mobile App | Unified Chat |
| `Hotel OTA` | Hotel Platform | Unified Chat |
| `rez-web-menu` | Digital Menu | Unified Chat |
| `rez-app-merchant` | Merchant Mobile App | AI Copilot |
| `rez-merchant-copilot` | Merchant Dashboard | AI Copilot |
| `rez-admin-training-panel` | Admin Panel | AI Copilot |
| `REZ-support-copilot` | Backend Service | Search Integration |
| `rez-search-service` | Backend Service | Knowledge Base |

---

## Architecture Overview

### Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONSUMER APPS                                    │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ rez-now  │  │ rez-app-consumer │  │   Hotel OTA   │  │rez-web-menu│ │
│  └────┬─────┘  └────────┬─────────┘  └───────┬───────┘  └─────┬──────┘ │
└───────┼─────────────────┼───────────────────┼───────────────┼─────────┘
        │                 │                   │               │
        └─────────────────┴─────────┬─────────┴───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      rez-unified-chat         │
                    │    (Shared Component Lib)     │
                    │         Port: N/A             │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                                │
│  ┌──────────────────────┐    ┌─────────────────────────────────────────┐│
│  │ REZ-support-copilot  │◄───│         rez-search-service            ││
│  │     Port: 4033       │    │            Port: 4003                 ││
│  └──────────┬───────────┘    └────────────────────┬──────────────────┘│
│             │                                      │                   │
│             └──────────────┬───────────────────────┘                   │
│                            ▼                                            │
│             ┌──────────────────────────────┐                           │
│             │     MongoDB / Redis          │                           │
│             │   (Shared Data Layer)        │                           │
│             └──────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         MERCHANT APPS                                   │
│  ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────────┐│
│  │rez-app-merchant  │  │rez-merchant-copilot│  │rez-admin-training-panel││
│  └────────┬─────────┘  └─────────┬─────────┘  └───────────┬───────────┘│
└───────────┼──────────────────────┼─────────────────────────┼───────────┘
            │                      │                         │
            ▼                      ▼                         ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     AI Copilot Integration Layer                      │
    │              (Shared API client + UI components)                     │
    └─────────────────────────────────────────────────────────────────────┘
```

### API Endpoint Summary

| Service | Base URL | Key Endpoints |
|---------|----------|---------------|
| `REZ-support-copilot` | `http://localhost:4033` | `POST /api/chat`, `GET /api/merchants` |
| `rez-search-service` | `http://localhost:4003` | `GET /search`, `GET /homepage`, `GET /recommendations` |
| `rez-merchant-copilot` | `http://localhost:4022` | `GET /merchant/:id/insights` |

---

## Phase 1: Consumer Apps - Unified Chat

### 1.1 Integration for `rez-now` (Web App)

#### Prerequisites
- Node.js 20+
- npm dependencies installed
- Running REZ-support-copilot service (port 4033)

#### Step-by-Step Implementation

**Step 1.1.1: Update package.json dependencies**

Add the unified chat package:

```json
{
  "dependencies": {
    "@rez/unified-chat": "file:../rez-unified-chat"
  }
}
```

**Step 1.1.2: Create Chat Integration File**

Create `/src/lib/chat-integration.ts`:

```typescript
import { UnifiedChat, ChatService, ChatConfig } from '@rez/unified-chat';

const CHAT_API_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:4033';

export interface ChatConfigOptions {
  userId?: string;
  merchantId?: string;
  tableNumber?: string;
  restaurantId?: string;
}

export function createChatConfig(options: ChatConfigOptions): ChatConfig {
  return {
    apiBaseUrl: CHAT_API_BASE_URL,
    userId: options.userId,
    merchantId: options.merchantId,
    tableNumber: options.tableNumber,
    restaurantId: options.restaurantId,
    enableDarkMode: true,
    enableAnimations: true,
    showTypingIndicator: true,
    typingDelay: 1500,
  };
}

export { ChatService, UnifiedChat };
```

**Step 1.1.3: Create Chat Component Wrapper**

Create `/src/components/ChatWidget/index.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { UnifiedChat } from '@rez/unified-chat';
import { createChatConfig } from '@/lib/chat-integration';

interface ChatWidgetProps {
  merchantId?: string;
  userId?: string;
  tableNumber?: string;
  restaurantId?: string;
  position?: 'bottom-right' | 'bottom-left';
  className?: string;
}

export default function ChatWidget({
  merchantId,
  userId,
  tableNumber,
  restaurantId,
  position = 'bottom-right',
  className = '',
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatService, setChatService] = useState<any>(null);

  useEffect(() => {
    const config = createChatConfig({
      userId,
      merchantId,
      tableNumber,
      restaurantId,
    });
    const service = new ChatService(config);
    service.initSession().then((session: any) => {
      setChatService(service);
    });
  }, [userId, merchantId, tableNumber, restaurantId]);

  return (
    <div className={`chat-widget-container ${position} ${className}`}>
      {isOpen && chatService && (
        <UnifiedChat
          service={chatService}
          onClose={() => setIsOpen(false)}
          config={createChatConfig({ userId, merchantId, tableNumber, restaurantId })}
        />
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-btn"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
```

**Step 1.1.4: Add Chat Widget to Layout**

Modify `/src/app/layout.tsx` or relevant page:

```typescript
import ChatWidget from '@/components/ChatWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatWidget
          merchantId={process.env.NEXT_PUBLIC_MERCHANT_ID}
          userId={process.env.NEXT_PUBLIC_USER_ID}
          position="bottom-right"
        />
      </body>
    </html>
  );
}
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `package.json` | Edit | Add `@rez/unified-chat` dependency |
| `src/lib/chat-integration.ts` | Create | Chat service configuration |
| `src/components/ChatWidget/index.tsx` | Create | Chat widget wrapper component |
| `src/app/layout.tsx` | Edit | Add ChatWidget to layout |
| `.env.local` | Create | Add chat API URL |

#### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CHAT_API_URL=http://localhost:4033
NEXT_PUBLIC_MERCHANT_ID=merchant_123
NEXT_PUBLIC_USER_ID=user_456
```

---

### 1.2 Integration for `rez-app-consumer` (Mobile App)

#### Step-by-Step Implementation

**Step 1.2.1: Link the Chat Package**

```bash
cd rez-app-consumer
npm install @rez/unified-chat --legacy-peer-deps
```

**Step 1.2.2: Create Chat Screen**

Create `/app/(tabs)/chat.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatService, ChatConfig } from '@rez/unified-chat';
import { useLocalSearchParams } from 'expo-router';

const CHAT_API_URL = process.env.EXPO_PUBLIC_CHAT_API_URL || 'http://localhost:4033';

export default function ChatScreen() {
  const { merchantId, userId } = useLocalSearchParams();
  const [chatService, setChatService] = useState<ChatService | null>(null);

  useEffect(() => {
    const config: ChatConfig = {
      apiBaseUrl: CHAT_API_URL,
      merchantId: merchantId as string,
      userId: userId as string,
    };

    const service = new ChatService(config);
    service.initSession().then(() => {
      setChatService(service);
    });
  }, [merchantId, userId]);

  if (!chatService) {
    return <View style={styles.container}><ActivityIndicator /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Chat UI Implementation */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

**Step 1.2.3: Update Navigation**

Add to `/app/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';
import { ChatBubble } from '@rez/unified-chat';

export default function Layout() {
  return (
    <Tabs>
      {/* ... other tabs */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: () => <ChatBubble size={24} />,
        }}
      />
    </Tabs>
  );
}
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `package.json` | Edit | Add `@rez/unified-chat` dependency |
| `app/(tabs)/chat.tsx` | Create | Chat screen |
| `app/_layout.tsx` | Edit | Add chat tab to navigation |
| `app.config.ts` | Edit | Add chat deep link schema |
| `.env` | Create | Add chat API URL |

#### Environment Variables

```bash
# .env
EXPO_PUBLIC_CHAT_API_URL=http://localhost:4033
```

---

### 1.3 Integration for `Hotel OTA`

#### Step-by-Step Implementation

**Step 1.3.1: Install Dependencies**

```bash
cd "Hotel OTA"
npm install @rez/unified-chat
```

**Step 1.3.2: Create Hotel Chat Integration**

Create `/apps/hotel-panel/src/components/HotelChat.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { ChatService, ChatConfig, UnifiedChat } from '@rez/unified-chat';

const CHAT_API_URL = process.env.PUBLIC_CHAT_API_URL || 'http://localhost:4033';

interface HotelChatProps {
  hotelId: string;
  userId?: string;
  bookingId?: string;
}

export function HotelChat({ hotelId, userId, bookingId }: HotelChatProps) {
  const [service, setService] = useState<ChatService | null>(null);

  useEffect(() => {
    const config: ChatConfig = {
      apiBaseUrl: CHAT_API_URL,
      merchantId: hotelId,
      userId,
      context: { bookingId, type: 'hotel' },
    };

    const chatService = new ChatService(config);
    chatService.initSession().then((session) => {
      setService(chatService);
    });
  }, [hotelId, userId, bookingId]);

  if (!service) return null;

  return (
    <UnifiedChat
      service={service}
      config={{ enableDarkMode: false, enableAnimations: true }}
    />
  );
}
```

**Step 1.3.3: Add Chat to Hotel Panel**

Modify `/apps/hotel-panel/src/app/page.tsx`:

```typescript
import { HotelChat } from '@/components/HotelChat';

export default function HotelPage() {
  return (
    <main>
      {/* Existing hotel content */}
      <HotelChat
        hotelId={process.env.PUBLIC_HOTEL_ID || 'hotel_default'}
        userId={process.env.PUBLIC_USER_ID}
      />
    </main>
  );
}
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `package.json` | Edit | Add `@rez/unified-chat` |
| `apps/hotel-panel/src/components/HotelChat.tsx` | Create | Hotel-specific chat component |
| `apps/hotel-panel/src/app/page.tsx` | Edit | Add chat widget |
| `apps/hotel-panel/.env` | Create | Add environment variables |

---

### 1.4 Integration for `rez-web-menu`

#### Step-by-Step Implementation

**Step 1.4.1: Install Dependencies**

```bash
cd rez-web-menu
npm install @rez/unified-chat
```

**Step 1.4.2: Create Menu Chat Integration**

Create `/src/components/MenuChat.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { ChatService, ChatConfig, UnifiedChat } from '@rez/unified-chat';

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:4033';

interface MenuChatProps {
  menuId: string;
  merchantId: string;
}

export function MenuChat({ menuId, merchantId }: MenuChatProps) {
  const [service, setService] = useState<ChatService | null>(null);

  useEffect(() => {
    const config: ChatConfig = {
      apiBaseUrl: CHAT_API_URL,
      merchantId,
      restaurantId: menuId,
      context: { type: 'web-menu' },
    };

    const chatService = new ChatService(config);
    chatService.initSession().then(() => {
      setService(chatService);
    });
  }, [menuId, merchantId]);

  return service ? (
    <UnifiedChat service={service} config={{ enableDarkMode: true }} />
  ) : null;
}
```

**Step 1.4.3: Add to Web Menu Layout**

Create `/src/components/ChatFAB.tsx` for floating action button:

```typescript
import { useState } from 'react';
import { MenuChat } from './MenuChat';

export function ChatFAB({ menuId, merchantId }: { menuId: string; merchantId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      )}
      <div className={`chat-container ${isOpen ? 'open' : ''}`}>
        {isOpen && <MenuChat menuId={menuId} merchantId={merchantId} />}
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-white rounded-full w-14 h-14 shadow-lg"
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `package.json` | Edit | Add `@rez/unified-chat` |
| `src/components/MenuChat.tsx` | Create | Menu chat component |
| `src/components/ChatFAB.tsx` | Create | Floating action button |
| `src/App.tsx` | Edit | Add ChatFAB |
| `.env` | Create | Add chat API URL |

---

## Phase 2: Merchant Apps - AI Copilot

### 2.1 Integration for `rez-merchant-copilot`

The `rez-merchant-copilot` is the source AI copilot service. No integration needed - it serves as the backend.

#### Configuration Required

Update `/src/index.ts` to add environment-aware endpoints:

```typescript
const PORT = parseInt(process.env.PORT || '4022', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-merchant-copilot';
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4015';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4016';
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `src/index.ts` | Edit | Add service URLs from env |
| `.env.example` | Create | Environment template |

#### Environment Variables

```bash
# .env.example
PORT=4022
MONGODB_URI=mongodb://localhost:27017/rez-merchant-copilot
MERCHANT_SERVICE_URL=http://localhost:4015
ANALYTICS_SERVICE_URL=http://localhost:4016
REZ_MIND_URL=http://localhost:4008
```

---

### 2.2 Integration for `rez-app-merchant` (Mobile App)

#### Step-by-Step Implementation

**Step 2.2.1: Install Copilot Client**

```bash
cd rez-app-merchant
npm install @rez/merchant-copilot-client --legacy-peer-deps
```

**Step 2.2.2: Create Copilot Provider**

Create `/src/providers/CopilotProvider.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MerchantCopilotClient } from '@rez/merchant-copilot-client';

const COPILOT_API_URL = process.env.EXPO_PUBLIC_MERCHANT_COPILOT_URL || 'http://localhost:4022';

interface CopilotContextType {
  client: MerchantCopilotClient | null;
  isLoading: boolean;
  error: string | null;
}

const CopilotContext = createContext<CopilotContextType>({
  client: null,
  isLoading: true,
  error: null,
});

export function CopilotProvider({ merchantId, children }: { merchantId: string; children: React.ReactNode }) {
  const [client, setClient] = useState<MerchantCopilotClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const copilotClient = new MerchantCopilotClient({
      baseUrl: COPILOT_API_URL,
      merchantId,
    });

    copilotClient.healthCheck()
      .then(() => {
        setClient(copilotClient);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [merchantId]);

  return (
    <CopilotContext.Provider value={{ client, isLoading, error }}>
      {children}
    </CopilotContext.Provider>
  );
}

export const useCopilot = () => useContext(CopilotContext);
```

**Step 2.2.3: Create Insights Card Component**

Create `/src/components/CopilotInsights.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useCopilot } from '@/providers/CopilotProvider';

interface Insight {
  type: 'pattern' | 'alert' | 'trend' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
}

export function CopilotInsights() {
  const { client, isLoading, error } = useCopilot();
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!client) return;

    client.getInsights().then((data) => {
      setInsights(data.insights || []);
    });
  }, [client]);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Copilot unavailable</Text>;

  return (
    <View className="copilot-insights">
      <Text className="text-lg font-bold">AI Insights</Text>
      {insights.map((insight, index) => (
        <View key={index} className="insight-card">
          <Text className="insight-title">{insight.title}</Text>
          <Text className="insight-description">{insight.description}</Text>
          <Text className="insight-confidence">
            Confidence: {(insight.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      ))}
    </View>
  );
}
```

**Step 2.2.4: Create Recommendations Component**

Create `/src/components/CopilotRecommendations.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useCopilot } from '@/providers/CopilotProvider';
import { TouchableOpacity, View, Text } from 'react-native';

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  expected_impact: string;
}

export function CopilotRecommendations() {
  const { client } = useCopilot();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!client) return;

    client.getRecommendations().then((data) => {
      setRecommendations(data.recommendations || []);
    });
  }, [client]);

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  };

  return (
    <View className="copilot-recommendations">
      <Text className="text-lg font-bold mb-4">Recommendations</Text>
      {recommendations.map((rec) => (
        <TouchableOpacity key={rec.id} className="recommendation-card">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold">{rec.title}</Text>
            <View className={`px-2 py-1 rounded ${priorityColors[rec.priority]}`}>
              <Text className="text-white text-xs">{rec.priority.toUpperCase()}</Text>
            </View>
          </View>
          <Text className="text-gray-600 mt-1">{rec.description}</Text>
          <Text className="text-primary text-sm mt-2">Impact: {rec.expected_impact}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

**Step 2.2.5: Wrap App with Copilot Provider**

Modify `/app/_layout.tsx`:

```typescript
import { CopilotProvider } from '@/providers/CopilotProvider';

export default function Layout() {
  const merchantId = // Get from auth context

  return (
    <CopilotProvider merchantId={merchantId}>
      {/* Existing layout */}
    </CopilotProvider>
  );
}
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `package.json` | Edit | Add copilot client |
| `src/providers/CopilotProvider.tsx` | Create | Context provider |
| `src/components/CopilotInsights.tsx` | Create | Insights display |
| `src/components/CopilotRecommendations.tsx` | Create | Recommendations display |
| `app/_layout.tsx` | Edit | Add provider |
| `.env` | Create | Add copilot URL |

#### Environment Variables

```bash
# .env
EXPO_PUBLIC_MERCHANT_COPILOT_URL=http://localhost:4022
```

---

### 2.3 Integration for `rez-admin-training-panel`

#### Step-by-Step Implementation

**Step 2.3.1: Install Copilot Client**

```bash
cd rez-admin-training-panel
npm install axios
```

**Step 2.3.2: Create Training Copilot Service**

Create `/src/services/trainingCopilot.ts`:

```typescript
import axios from 'axios';

const COPILOT_API_URL = import.meta.env.VITE_MERCHANT_COPILOT_URL || 'http://localhost:4022';
const SUPPORT_COPILOT_URL = import.meta.env.VITE_SUPPORT_COPILOT_URL || 'http://localhost:4033';

export interface TrainingContent {
  id: string;
  type: 'book' | 'article' | 'faq' | 'policy';
  title: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseStats {
  totalDocuments: number;
  indexedDocuments: number;
  lastIndexTime: string;
  categories: Record<string, number>;
}

class TrainingCopilotService {
  private copilotClient = axios.create({
    baseURL: COPILOT_API_URL,
    timeout: 10000,
  });

  private supportClient = axios.create({
    baseURL: SUPPORT_COPILOT_URL,
    timeout: 10000,
  });

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.copilotClient.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  async getDashboardStats(): Promise<KnowledgeBaseStats> {
    const response = await this.supportClient.get('/dashboard');
    return response.data;
  }

  async searchKnowledgeBase(query: string): Promise<TrainingContent[]> {
    const response = await this.supportClient.post('/api/knowledge/search', { query });
    return response.data.data?.results || [];
  }

  async getTrainingRecommendations(): Promise<any[]> {
    const response = await this.copilotClient.get('/merchant/admin/recommendations');
    return response.data.recommendations || [];
  }

  async submitFeedback(decisionId: string, outcome: string, notes?: string): Promise<void> {
    await this.copilotClient.post('/merchant/admin/feedback', {
      decision_id: decisionId,
      outcome,
      notes,
    });
  }
}

export const trainingCopilotService = new TrainingCopilotService();
```

**Step 2.3.3: Create Training Dashboard Component**

Create `/src/components/TrainingDashboard.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { trainingCopilotService, KnowledgeBaseStats } from '@/services/trainingCopilot';

export function TrainingDashboard() {
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainingCopilotService.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="training-dashboard">
      <h1 className="text-2xl font-bold mb-6">AI Training Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Total Tickets</div>
          <div className="stat-value">{stats?.totalTickets || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Tickets</div>
          <div className="stat-value">{stats?.openTickets || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved Today</div>
          <div className="stat-value">{stats?.resolvedToday || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Urgent</div>
          <div className="stat-value text-red-500">{stats?.urgentTickets || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="panel">
          <h2 className="text-lg font-semibold mb-4">Intent Distribution</h2>
          <div className="chart-container">
            {/* Chart implementation */}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-lg font-semibold mb-4">Sentiment Analysis</h2>
          <div className="sentiment-breakdown">
            <div className="sentiment-item positive">
              <span>Positive</span>
              <span>{stats?.sentimentBreakdown?.positive || 0}</span>
            </div>
            <div className="sentiment-item neutral">
              <span>Neutral</span>
              <span>{stats?.sentimentBreakdown?.neutral || 0}</span>
            </div>
            <div className="sentiment-item negative">
              <span>Negative</span>
              <span>{stats?.sentimentBreakdown?.negative || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2.3.4: Add to Admin Panel**

Modify `/src/App.tsx`:

```typescript
import { TrainingDashboard } from '@/components/TrainingDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TrainingDashboard />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}
```

#### Files to Modify

| File Path | Modification Type | Description |
|-----------|------------------|-------------|
| `package.json` | Edit | Add axios |
| `src/services/trainingCopilot.ts` | Create | API service |
| `src/components/TrainingDashboard.tsx` | Create | Dashboard component |
| `src/App.tsx` | Edit | Add dashboard route |
| `.env` | Create | Add service URLs |

#### Environment Variables

```bash
# .env
VITE_MERCHANT_COPILOT_URL=http://localhost:4022
VITE_SUPPORT_COPILOT_URL=http://localhost:4033
```

---

## Phase 3: Backend Services

### 3.1 Connect REZ-support-copilot with rez-search-service

#### Step-by-Step Implementation

**Step 3.1.1: Update REZ-support-copilot to Use Search Service**

Modify `/src/index.js` to add search integration:

```javascript
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:4003';

// Add to searchKnowledgeBase function
async function searchWithSearchService(query, filters = {}) {
  try {
    const response = await axios.post(`${SEARCH_SERVICE_URL}/search`, {
      q: query,
      filters,
      limit: 10,
      source: 'support-copilot',
    }, { timeout: 5000 });
    return response.data;
  } catch (error) {
    logger.warn('Search service fallback', { error: error.message });
    return null;
  }
}

// Update the /api/knowledge/search endpoint
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, category, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required',
      });
    }

    // Try rez-search-service first
    let results = [];
    const searchResults = await searchWithSearchService(query, { category });

    if (searchResults?.data?.items) {
      results = searchResults.data.items.map(item => ({
        type: 'search_result',
        id: item.id,
        title: item.name || item.title,
        excerpt: item.description || item.excerpt,
        data: item,
      }));
    }

    // Fallback to local MongoDB if no results
    if (results.length === 0) {
      // ... existing local search logic
    }

    res.json({
      success: true,
      data: {
        results,
        query,
        total: results.length,
        source: searchResults ? 'search-service' : 'local',
      },
    });
  } catch (error) {
    logger.error('Knowledge search error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**Step 3.1.2: Update rez-search-service to Accept Support Context**

Modify `/src/routes/searchRoutes.ts`:

```typescript
import { Router } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

const router = Router();

interface SearchRequest {
  q: string;
  filters?: {
    category?: string;
    merchantId?: string;
    type?: string;
  };
  limit?: number;
  source?: string; // Track search source for analytics
}

// Search endpoint with support context
router.post('/search', async (req, res) => {
  const searchRequest: SearchRequest = req.body;
  const { q, filters = {}, limit = 20, source } = searchRequest;

  if (!q) {
    return res.status(400).json({ success: false, error: 'Query required' });
  }

  const cacheKey = `search:${q}:${JSON.stringify(filters)}:${source || 'unknown'}`;

  // Try cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info('[Search] Cache hit', { query: q, source });
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    logger.warn('[Search] Cache read error', { error: err });
  }

  // Perform search (MongoDB text search or Elasticsearch)
  // ... search implementation

  const results = {
    success: true,
    data: {
      items: [], // Search results
      query: q,
      total: 0,
    },
    metadata: {
      source,
      cached: false,
      responseTime: Date.now(),
    },
  };

  // Cache for 5 minutes
  try {
    await redis.setex(cacheKey, 300, JSON.stringify(results));
  } catch (err) {
    logger.warn('[Search] Cache write error', { error: err });
  }

  res.json(results);
});

export default router;
```

**Step 3.1.3: Add Health Check Dependencies**

Modify `/src/index.js` in REZ-support-copilot:

```javascript
// Add to health check endpoint
app.get('/health', (req, res) => {
  const dependencies = {
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    searchService: 'unknown',
  };

  // Check search service connectivity
  try {
    const searchHealth = await axios.get(`${SEARCH_SERVICE_URL}/healthz`, { timeout: 2000 });
    dependencies.searchService = searchHealth.data.status === 'ok' ? 'connected' : 'error';
  } catch {
    dependencies.searchService = 'disconnected';
  }

  res.json({
    status: 'healthy',
    service: 'rez-support-copilot',
    version: '1.1.0',
    dependencies,
    timestamp: new Date().toISOString(),
  });
});
```

#### Files to Modify

| Service | File Path | Modification Type | Description |
|---------|-----------|------------------|-------------|
| `REZ-support-copilot` | `src/index.js` | Edit | Add search service integration |
| `rez-search-service` | `src/routes/searchRoutes.ts` | Edit | Add support context handling |

#### Environment Variables

```bash
# REZ-support-copilot .env
SEARCH_SERVICE_URL=http://localhost:4003

# rez-search-service .env (already has required vars)
MONGODB_URI=mongodb://localhost:27017/rez-search
REDIS_URL=redis://localhost:6379
```

---

### 3.2 Verify Service Connectivity

Create `/scripts/verify-services.sh`:

```bash
#!/bin/bash
# Verify all integrated services are healthy

SERVICES=(
  "REZ-support-copilot:4033:http://localhost:4033/health"
  "rez-search-service:4003:http://localhost:4003/healthz"
  "rez-merchant-copilot:4022:http://localhost:4022/health"
)

echo "=== Service Connectivity Check ==="
all_healthy=true

for service in "${SERVICES[@]}"; do
  IFS=':' read -r name port url <<< "$service"
  echo -n "Checking $name ($port)... "

  if curl -s -f -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo "OK"
  else
    echo "FAILED"
    all_healthy=false
  fi
done

if $all_healthy; then
  echo -e "\n=== All services healthy ==="
  exit 0
else
  echo -e "\n=== Some services unavailable ==="
  exit 1
fi
```

---

## Environment Configuration

### Global Environment Variables Template

Create `/docs/ENV_TEMPLATE.md`:

```markdown
# REZ Integration Environment Variables

## Consumer Apps (Unified Chat)

### rez-now
```bash
NEXT_PUBLIC_CHAT_API_URL=http://localhost:4033
NEXT_PUBLIC_MERCHANT_ID=your_merchant_id
NEXT_PUBLIC_USER_ID=your_user_id
```

### rez-app-consumer
```bash
EXPO_PUBLIC_CHAT_API_URL=http://localhost:4033
```

### Hotel OTA
```bash
PUBLIC_CHAT_API_URL=http://localhost:4033
PUBLIC_HOTEL_ID=your_hotel_id
```

### rez-web-menu
```bash
VITE_CHAT_API_URL=http://localhost:4033
```

## Merchant Apps (AI Copilot)

### rez-app-merchant
```bash
EXPO_PUBLIC_MERCHANT_COPILOT_URL=http://localhost:4022
```

### rez-admin-training-panel
```bash
VITE_MERCHANT_COPILOT_URL=http://localhost:4022
VITE_SUPPORT_COPILOT_URL=http://localhost:4033
```

## Backend Services

### REZ-support-copilot
```bash
PORT=4033
MONGODB_URI=mongodb://localhost:27017/rez-support
REZ_MIND_URL=http://localhost:4008
REZ_EVENT_PLATFORM_URL=http://localhost:4010
KNOWLEDGE_BASE_URL=http://localhost:4011
REZ_ORDER_SERVICE_URL=http://localhost:4012
REZ_BOOKING_SERVICE_URL=http://localhost:4013
SEARCH_SERVICE_URL=http://localhost:4003
```

### rez-search-service
```bash
PORT=4003
HEALTH_PORT=4103
MONGODB_URI=mongodb://localhost:27017/rez-search
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
```

### rez-merchant-copilot
```bash
PORT=4022
MONGODB_URI=mongodb://localhost:27017/rez-merchant-copilot
MERCHANT_SERVICE_URL=http://localhost:4015
ANALYTICS_SERVICE_URL=http://localhost:4016
REZ_MIND_URL=http://localhost:4008
```
```

---

## Test Plan

### Phase 1: Consumer Apps - Unified Chat

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| TC-01 | User opens chat widget | Chat window appears with welcome message | P0 |
| TC-02 | User sends "order" | Bot responds with menu and quick replies | P0 |
| TC-03 | User completes order flow | Order confirmation displayed | P0 |
| TC-04 | User sends "book" | Booking flow initiated with date picker | P0 |
| TC-05 | User makes booking | Confirmation with details shown | P0 |
| TC-06 | User asks question | Bot responds with enquiry type options | P1 |
| TC-07 | Chat persists on refresh | Previous messages restored | P1 |
| TC-08 | Dark mode toggle | UI switches themes correctly | P2 |
| TC-09 | Network failure | Graceful error message shown | P1 |
| TC-10 | Mobile responsive | Chat UI adapts to screen sizes | P1 |

### Phase 2: Merchant Apps - AI Copilot

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| MC-01 | Insights load on dashboard | AI insights displayed with confidence scores | P0 |
| MC-02 | Recommendations visible | Actionable recommendations shown | P0 |
| MC-03 | Health score display | Overall and metric scores shown | P0 |
| MC-04 | Feedback submission | Decision feedback saved successfully | P1 |
| MC-05 | Competitor comparison | Similar merchants displayed | P2 |
| MC-06 | Trend analysis | Growth/decline indicators shown | P1 |
| MC-07 | Copilot unavailable | Fallback UI with retry option | P1 |
| MC-08 | Real-time updates | Dashboard auto-refreshes data | P2 |

### Phase 3: Backend Services

| Test ID | Test Case | Expected Result | Priority |
|---------|-----------|-----------------|----------|
| BS-01 | Support copilot health check | All dependencies shown as healthy | P0 |
| BS-02 | Chat API response time | < 500ms for simple queries | P0 |
| BS-03 | Knowledge base search | Results from search service returned | P0 |
| BS-04 | Search service cache hit | Subsequent queries faster | P1 |
| BS-05 | MongoDB connection | Data persists correctly | P0 |
| BS-06 | Redis connection | Caching functional | P1 |
| BS-07 | Service restart | Graceful shutdown and restart | P1 |
| BS-08 | Concurrent requests | Handles 100+ simultaneous requests | P1 |

### Test Execution Commands

```bash
# Consumer App Tests
cd rez-now && npm run test:e2e

# Merchant App Tests
cd rez-app-merchant && npm run test

# Backend Service Tests
cd REZ-support-copilot && npm test
cd rez-search-service && npm run test

# Integration Tests
npm run test --workspace=integration-tests
```

---

## Rollback Procedures

### Consumer Apps

If chat integration causes issues:

1. **Immediate Rollback (0-5 min)**
   ```bash
   # Remove chat widget from layout
   git checkout HEAD~1 -- src/app/layout.tsx
   npm run build
   ```

2. **Package Removal**
   ```bash
   # Remove from package.json and reinstall
   npm uninstall @rez/unified-chat
   rm -rf node_modules package-lock.json
   npm install
   ```

### Merchant Apps

If copilot integration causes issues:

1. **Feature Flag Disable**
   ```typescript
   // Add feature flag check
   const ENABLE_COPILOT = process.env.ENABLE_COPILOT === 'true';
   if (ENABLE_COPILOT) {
     // Show copilot
   }
   ```

2. **Service Isolation**
   ```bash
   # Stop copilot service only
   pm2 stop rez-merchant-copilot
   ```

### Backend Services

1. **Service Dependency Fallback**
   ```javascript
   // If search service unavailable, fall back to local search
   let results = [];
   try {
     results = await searchWithSearchService(query);
   } catch {
     logger.warn('Search service unavailable, using local fallback');
     results = await localSearch(query);
   }
   ```

2. **Database Rollback**
   ```bash
   # Restore MongoDB from backup
   mongorestore --uri="mongodb://localhost:27017" --db=rez-support backup/path
   ```

---

## Priority & Timeline

### Phase 1 Timeline (Consumer Apps - Unified Chat)

| Task | Duration | Dependencies | Priority |
|------|----------|--------------|----------|
| 1.1 rez-now integration | 2 days | None | P0 |
| 1.2 rez-app-consumer integration | 3 days | 1.1 | P0 |
| 1.3 Hotel OTA integration | 2 days | None | P1 |
| 1.4 rez-web-menu integration | 2 days | None | P1 |
| 1.5 E2E testing | 2 days | 1.1-1.4 | P0 |

**Phase 1 Total: 7-9 working days**

### Phase 2 Timeline (Merchant Apps - AI Copilot)

| Task | Duration | Dependencies | Priority |
|------|----------|--------------|----------|
| 2.1 rez-merchant-copilot config | 1 day | None | P0 |
| 2.2 rez-app-merchant integration | 3 days | 2.1 | P0 |
| 2.3 rez-admin-training-panel integration | 2 days | 2.1 | P1 |
| 2.4 Merchant dashboard testing | 2 days | 2.2-2.3 | P0 |

**Phase 2 Total: 5-6 working days**

### Phase 3 Timeline (Backend Services)

| Task | Duration | Dependencies | Priority |
|------|----------|--------------|----------|
| 3.1 Search service integration | 2 days | None | P0 |
| 3.2 Health check updates | 1 day | 3.1 | P1 |
| 3.3 Integration testing | 2 days | 3.1-3.2 | P0 |

**Phase 3 Total: 3-4 working days**

### Overall Timeline

```
Week 1: Phase 1 (rez-now, rez-app-consumer)
Week 2: Phase 1 (Hotel OTA, rez-web-menu) + Phase 2 start
Week 3: Phase 2 (merchant apps) + Phase 3 start
Week 4: Phase 3 + Integration testing + Bug fixes
```

---

## Appendix A: API Reference

### Unified Chat API

```typescript
// ChatService Configuration
interface ChatConfig {
  apiBaseUrl: string;
  userId?: string;
  merchantId?: string;
  restaurantId?: string;
  tableNumber?: string;
  context?: Record<string, any>;
  enableDarkMode?: boolean;
  enableAnimations?: boolean;
  showTypingIndicator?: boolean;
  typingDelay?: number;
}

// Methods
class ChatService {
  initSession(): Promise<ChatSession>;
  sendMessage(content: string, type?: MessageType): Promise<{ userMessage: ChatMessage; botMessage: ChatMessage }>;
  startFlow(flowType: 'order' | 'book' | 'enquire'): Promise<ChatMessage>;
  endFlow(): Promise<void>;
  getMenuItems(): Promise<MenuItem[]>;
  placeOrder(items: OrderItem[], tableNumber?: string): Promise<Order>;
  getAvailableSlots(date: Date): Promise<TimeSlot[]>;
  makeBooking(details: BookingFlowState): Promise<BookingDetails>;
}
```

### Support Copilot API

```typescript
// POST /api/chat
interface ChatRequest {
  message: string;
  sessionId: string;
  userId?: string;
  merchantId?: string;
  context?: Record<string, any>;
}

interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    intent: {
      type: 'ORDER' | 'BOOK' | 'ENQUIRE' | 'COMPLAINT' | 'GREETING' | 'UNKNOWN';
      confidence: number;
      entities: EntityExtraction;
    };
    suggestions: string[];
    context: { userId?: string; merchantId?: string; conversationId: string };
    aiEnhanced: boolean;
  };
}

// POST /api/knowledge/search
interface KnowledgeSearchRequest {
  query: string;
  category?: string;
  limit?: number;
}

interface KnowledgeSearchResponse {
  success: boolean;
  data: {
    results: KnowledgeResult[];
    query: string;
    total: number;
    source: 'search-service' | 'local';
  };
}
```

### Merchant Copilot API

```typescript
// GET /merchant/:id/insights
interface InsightsResponse {
  merchant_id: string;
  insights: Array<{
    type: 'pattern' | 'alert' | 'trend' | 'opportunity';
    title: string;
    description: string;
    confidence: number;
  }>;
  demand_trend: 'increasing' | 'decreasing' | 'stable';
  risk_signals: string[];
}

// GET /merchant/:id/recommendations
interface RecommendationsResponse {
  merchant_id: string;
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    expected_impact: string;
  }>;
}

// GET /merchant/:id/health-score
interface HealthScoreResponse {
  merchant_id: string;
  health_score: {
    overall: number;
    metrics: Record<string, { score: number; trend: string; change: string }>;
    risk_level: 'low' | 'medium' | 'high';
    alerts: string[];
  };
  checked_at: string;
}
```

---

## Appendix B: Error Codes

| Code | Service | Meaning | Resolution |
|------|---------|---------|------------|
| `CHAT_001` | Unified Chat | Session initialization failed | Check API connectivity |
| `CHAT_002` | Unified Chat | Message send failed | Retry with exponential backoff |
| `CHAT_003` | Unified Chat | Order creation failed | Validate order data |
| `COPILOT_001` | Merchant Copilot | Insights fetch failed | Check merchant service |
| `COPILOT_002` | Merchant Copilot | Health check failed | Verify MongoDB connection |
| `SEARCH_001` | Search Service | Query timeout | Retry or use cache |
| `SEARCH_002` | Search Service | Cache invalidation failed | Manual cache clear |

---

## Appendix C: Monitoring & Alerts

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|------------------|
| REZ-support-copilot | `GET /health` | `{ status: "healthy", dependencies: {...} }` |
| rez-search-service | `GET /healthz` | `{ status: "ok" }` |
| rez-merchant-copilot | `GET /health` | `{ status: "healthy" }` |

### Alert Thresholds

- Chat response time > 2s: Warning
- Chat response time > 5s: Critical
- Search cache hit rate < 50%: Warning
- Error rate > 5%: Warning
- Error rate > 10%: Critical

---

**Document End**

For questions or clarifications, contact the Platform Team.
