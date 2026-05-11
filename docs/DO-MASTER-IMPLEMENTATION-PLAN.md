# Do — Master Implementation Plan
**Version:** 1.0  
**Date:** May 3, 2026  
**Status:** Ready for Development

---

# EXECUTIVE SUMMARY

## What We're Building

**Do** is an AI-powered commerce operating system that:
- Discovers experiences (like Spontaa)
- Executes transactions (like Superchat)
- Rewards every action (unique to Do)
- Owns the complete behavior loop

## The Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DO APP                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Chat    │  │ Explore  │  │ Wallet   │  │ Profile  │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │               │               │               │                    │
│       └───────────────┴───────────────┴───────────────┘                    │
│                               │                                            │
│                    ┌──────────▼──────────┐                                 │
│                    │   DO API GATEWAY    │                                 │
│                    │  • Intent Parser    │                                 │
│                    │  • Workflow Engine  │                                 │
│                    │  • Response Gen    │                                 │
│                    └──────────┬──────────┘                                 │
└───────────────────────────────┼───────────────────────────────────────────┘
                                │
┌───────────────────────────────┼───────────────────────────────────────────┐
│                    REZ BACKEND │                                           │
│                               │                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Auth  │  │  Mind   │  │Discovery│  │  Order  │  │ Payment │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                               │                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ Wallet  │  │ Loyalty │  │Catalog  │  │Notifica │  │Merchant │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└───────────────────────────────────────────────────────────────────────────┘
```

## Build Sequence

```
Phase 1: Foundation (Week 1-2)
├── App shell + navigation
├── Chat interface core
├── Do backend API
└── Auth integration

Phase 2: Discovery (Week 3-4)
├── Explore feed
├── Intent classification
├── Entity cards
└── Discovery integration

Phase 3: Execution (Week 5-6)
├── Booking workflows
├── Payment flow
├── Karma integration
└── Confirmation + QR

Phase 4: Rewards (Week 7-8)
├── Coin animations
├── Karma display
├── Vouchers
└── Leaderboard

Phase 5: Polish (Week 9-10)
├── Voice input
├── Notifications
├── Error handling
└── Performance

Phase 6: Launch (Week 11-12)
├── Beta testing
├── Bug fixes
├── App Store submission
└── Launch
```

---

# PART 1: PROJECT STRUCTURE

## Repository Layout

```
do-app/
├── app/                              # Expo Router screens
│   ├── _layout.tsx                  # Root layout
│   ├── index.tsx                    # Chat (home)
│   ├── explore.tsx                  # Explore tab
│   ├── wallet.tsx                   # Wallet tab
│   ├── profile.tsx                  # Profile tab
│   ├── onboarding/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── phone.tsx
│   │   ├── otp.tsx
│   │   └── permissions.tsx
│   └── booking/
│       └── [bookingId].tsx          # Booking detail
│
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── EntityCard.tsx
│   │   │   ├── ActionCard.tsx
│   │   │   ├── RewardCard.tsx
│   │   │   ├── CoinAnimation.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── SuggestionChip.tsx
│   │   │
│   │   ├── explore/
│   │   │   ├── DiscoveryFeed.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── VenueCard.tsx
│   │   │   ├── TrialCard.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── MoodSelector.tsx
│   │   │   └── FilterBar.tsx
│   │   │
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── KarmaProgress.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── VoucherCard.tsx
│   │   │   └── EarnCoinsBanner.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── BookingHistory.tsx
│   │   │   ├── AchievementGrid.tsx
│   │   │   └── SettingsList.tsx
│   │   │
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Header.tsx
│   │       └── TabBar.tsx
│   │
│   ├── screens/
│   │   ├── chat/
│   │   │   ├── ChatScreen.tsx
│   │   │   └── ChatHooks.ts
│   │   ├── explore/
│   │   │   └── ExploreScreen.tsx
│   │   ├── wallet/
│   │   │   └── WalletScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   │
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useDo.ts
│   │   ├── useWallet.ts
│   │   ├── useProfile.ts
│   │   ├── useLocation.ts
│   │   └── useNotifications.ts
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── do.ts
│   │   │   ├── auth.ts
│   │   │   ├── wallet.ts
│   │   │   └── discovery.ts
│   │   ├── websocket.ts
│   │   └── storage.ts
│   │
│   ├── stores/
│   │   ├── chatStore.ts
│   │   ├── userStore.ts
│   │   ├── walletStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/
│   │   ├── intents.ts
│   │   ├── entities.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── types/
│   │   ├── chat.ts
│   │   ├── intent.ts
│   │   ├── entity.ts
│   │   ├── wallet.ts
│   │   └── api.ts
│   │
│   └── utils/
│       ├── animations.ts
│       ├── haptics.ts
│       └── logger.ts
│
├── do-backend/                      # Do backend services
│   ├── src/
│   │   ├── index.ts
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── chat.ts
│   │   │   │   ├── discover.ts
│   │   │   │   ├── wallet.ts
│   │   │   │   └── auth.ts
│   │   │   └── middleware/
│   │   │       ├── auth.ts
│   │   │       └── rateLimit.ts
│   │   │
│   │   ├── services/
│   │   │   ├── intentParser.ts
│   │   │   ├── workflowEngine.ts
│   │   │   ├── responseGenerator.ts
│   │   │   ├── sessionManager.ts
│   │   │   └── workflow/
│   │   │       ├── index.ts
│   │   │       ├── bookDinner.ts
│   │   │       ├── bookTrial.ts
│   │   │       ├── checkWallet.ts
│   │   │       ├── exploreNearby.ts
│   │   │       └── planEvening.ts
│   │   │
│   │   ├── integrations/
│   │   │   ├── rezMind.ts
│   │   │   ├── rezDiscovery.ts
│   │   │   ├── rezOrder.ts
│   │   │   ├── rezPayment.ts
│   │   │   ├── rezWallet.ts
│   │   │   └── rezLoyalty.ts
│   │   │
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── errors.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── assets/
│   ├── icons/
│   ├── images/
│   ├── animations/
│   └── fonts/
│
├── eas.json
├── app.json
├── babel.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

# PART 2: FRONTEND IMPLEMENTATION

## 2.1 App Setup

### package.json
```json
{
  "name": "do-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo build",
    "prebuild": "expo prebuild"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-linear-gradient": "~14.0.0",
    "expo-haptics": "~14.0.0",
    "expo-location": "~18.0.0",
    "expo-notifications": "~0.29.0",
    "expo-font": "~13.0.0",
    "expo-constants": "~17.0.0",
    "react": "18.3.1",
    "react-native": "0.76.5",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.3.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.7.0",
    "date-fns": "^4.0.0",
    "lottie-react-native": "~7.0.0",
    "moti": "^0.29.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.3.0",
    "typescript": "~5.3.0"
  }
}
```

### app.json
```json
{
  "expo": {
    "name": "Do",
    "slug": "do-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "do-app",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F0F12"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.do.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Do needs your location to find nearby places",
        "NSLocationAlwaysUsageDescription": "Do needs your location to find nearby places",
        "NSCameraUsageDescription": "Do uses camera for receipts and scanning",
        "NSPhotoLibraryUsageDescription": "Do accesses photos for profile pictures"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F0F12"
      },
      "package": "com.do.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Do to use your location"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## 2.2 Core Components

### src/components/common/Button.tsx
```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { clsx } from 'clsx';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? '#7C3AED' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  primary: {
    backgroundColor: '#7C3AED',
  },
  secondary: {
    backgroundColor: '#1A1A1F',
    borderWidth: 1,
    borderColor: '#2D2D33',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#EF4444',
  },
  size_sm: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  size_md: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
  },
  size_lg: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_ghost: {
    color: '#7C3AED',
  },
  text_danger: {
    color: '#FFFFFF',
  },
  textSize_sm: {
    fontSize: 14,
  },
  textSize_md: {
    fontSize: 16,
  },
  textSize_lg: {
    fontSize: 18,
  },
});
```

### src/components/common/Card.tsx
```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        styles[`padding_${padding}`],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: '#1A1A1F',
  },
  elevated: {
    backgroundColor: '#252529',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outlined: {
    backgroundColor: '#1A1A1F',
    borderWidth: 1,
    borderColor: '#2D2D33',
  },
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: 12,
  },
  padding_md: {
    padding: 16,
  },
  padding_lg: {
    padding: 24,
  },
});
```

### src/components/chat/ChatInput.tsx
```typescript
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mic, Send, X } from 'lucide-react-native';
import { useChatStore } from '@/stores/chatStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  quickActions?: string[];
  onQuickAction?: (action: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  quickActions = [],
  onQuickAction,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { isTyping } = useChatStore();

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleVoiceStart = () => {
    setIsRecording(true);
    // Start voice recording
  };

  const handleVoiceEnd = () => {
    setIsRecording(false);
    // Stop voice recording, get transcription
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Quick Actions */}
      {quickActions.length > 0 && !text && (
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => onQuickAction?.(action)}
            >
              <Text style={styles.quickActionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Ask Do anything..."
            placeholderTextColor="#71717A"
            multiline
            maxLength={500}
            editable={!isTyping}
          />

          {/* Voice Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording,
            ]}
            onPressIn={handleVoiceStart}
            onPressOut={handleVoiceEnd}
          >
            <Mic
              size={20}
              color={isRecording ? '#EF4444' : '#A1A1AA'}
            />
          </TouchableOpacity>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, text.trim() && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!text.trim() || isTyping}
        >
          <Send
            size={20}
            color={text.trim() ? '#FFFFFF' : '#71717A'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickAction: {
    backgroundColor: '#252529',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D2D33',
  },
  quickActionText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#0F0F12',
    borderTopWidth: 1,
    borderTopColor: '#2D2D33',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#1A1A1F',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  voiceButton: {
    padding: 4,
    marginLeft: 8,
  },
  voiceButtonRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#252529',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#7C3AED',
  },
});
```

### src/components/chat/MessageBubble.tsx
```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { clsx } from 'clsx';
import { Check, CheckCheck } from 'lucide-react-native';

interface MessageBubbleProps {
  type: 'user' | 'do';
  content: string;
  timestamp?: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  type,
  content,
  timestamp,
  status = 'sent',
}) => {
  const isUser = type === 'user';

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleDo]}>
        <Text style={[styles.text, isUser && styles.textUser]}>{content}</Text>
      </View>

      {isUser && timestamp && (
        <View style={styles.meta}>
          <Text style={styles.time}>
            {formatTime(timestamp)}
          </Text>
          {status === 'sent' && <Check size={14} color="#71717A" />}
          {status === 'delivered' && <CheckCheck size={14} color="#71717A" />}
          {status === 'read' && <CheckCheck size={14} color="#7C3AED" />}
        </View>
      )}
    </View>
  );
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  bubbleDo: {
    backgroundColor: '#1A1A1F',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  textUser: {
    color: '#FFFFFF',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 12,
    color: '#71717A',
  },
});
```

### src/components/chat/EntityCard.tsx
```typescript
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Star, Clock } from 'lucide-react-native';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface EntityCardProps {
  entity: {
    id: string;
    type: 'venue' | 'trial' | 'event';
    name: string;
    image?: string;
    subtitle: string;
    distance?: string;
    rating?: number;
    reviewCount?: number;
    priceRange?: string;
    openNow?: boolean;
    nextSlot?: string;
  };
  karmaDiscount?: number;
  coinEarning?: number;
  onAction: (action: string) => void;
  variant?: 'compact' | 'full';
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  karmaDiscount,
  coinEarning,
  onAction,
  variant = 'full',
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card style={styles.card} variant="elevated">
      {/* Image */}
      {entity.image && (
        <Image source={{ uri: entity.image }} style={styles.image} />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {entity.name}
          </Text>
          {karmaDiscount && (
            <View style={styles.karmaBadge}>
              <Text style={styles.karmaText}>-{karmaDiscount}%</Text>
            </View>
          )}
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {entity.subtitle}
        </Text>

        {/* Meta Row */}
        <View style={styles.meta}>
          {entity.distance && (
            <View style={styles.metaItem}>
              <MapPin size={14} color="#71717A" />
              <Text style={styles.metaText}>{entity.distance}</Text>
            </View>
          )}

          {entity.rating && (
            <View style={styles.metaItem}>
              <Star size={14} color="#FBBF24" fill="#FBBF24" />
              <Text style={styles.metaText}>
                {entity.rating}
                {entity.reviewCount && ` (${entity.reviewCount})`}
              </Text>
            </View>
          )}

          {entity.openNow !== undefined && (
            <View
              style={[
                styles.metaItem,
                entity.openNow ? styles.openNow : styles.closed,
              ]}
            >
              <Clock size={14} color={entity.openNow ? '#10B981' : '#EF4444'} />
              <Text
                style={[
                  styles.metaText,
                  { color: entity.openNow ? '#10B981' : '#EF4444' },
                ]}
              >
                {entity.openNow ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        {/* Reward Row */}
        {(coinEarning || entity.nextSlot) && (
          <View style={styles.rewardRow}>
            {coinEarning && (
              <Text style={styles.coinEarning}>+{coinEarning} coins</Text>
            )}
            {entity.nextSlot && (
              <Text style={styles.nextSlot}>Next: {entity.nextSlot}</Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            variant="primary"
            size="sm"
            onPress={() => onAction('book')}
            style={styles.primaryAction}
          >
            Book Now
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => onAction('directions')}
          >
            Directions
          </Button>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#252529',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  karmaBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  karmaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  openNow: {},
  closed: {},
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D2D33',
  },
  coinEarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FBBF24',
  },
  nextSlot: {
    fontSize: 13,
    color: '#71717A',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryAction: {
    flex: 1,
  },
});
```

### src/components/chat/RewardCard.tsx
```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Gift } from 'lucide-react-native';

interface RewardCardProps {
  coins?: number;
  karma?: number;
  tierProgress?: {
    current: string;
    next: string;
    percentage: number;
  };
  onAnimationComplete?: () => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({
  coins,
  karma,
  tierProgress,
  onAnimationComplete,
}) => {
  const coinScale = useSharedValue(0);
  const coinOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Coin bounce animation
    coinScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );

    coinOpacity.value = withSpring(1);
    textOpacity.value = withDelay(300, withSpring(1));
    textTranslateY.value = withDelay(300, withSpring(0));

    // Complete callback
    const timeout = setTimeout(() => {
      onAnimationComplete?.();
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  const coinAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinScale.value }],
    opacity: coinOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, coinAnimatedStyle]}>
        <View style={styles.iconCircle}>
          <Gift size={32} color="#FBBF24" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, textAnimatedStyle]}>
        {coins && (
          <Text style={styles.coinsText}>+{coins} coins earned!</Text>
        )}
        {karma && (
          <Text style={styles.karmaText}>+{karma} karma</Text>
        )}

        {tierProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {tierProgress.current} → {tierProgress.next}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${tierProgress.percentage}%` },
                ]}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  coinsText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FBBF24',
  },
  karmaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A78BFA',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
    width: '100%',
  },
  progressLabel: {
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2D2D33',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
});
```

### src/components/chat/TypingIndicator.tsx
```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  visible?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  visible = true,
}) => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      dot1Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      );

      dot2Opacity.value = withDelay(
        200,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        )
      );

      dot3Opacity.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 400 }),
            withTiming(0.3, { duration: 400 })
          ),
          -1,
          false
        )
      );
    }
  }, [visible]);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bubble: {
    backgroundColor: '#1A1A1F',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A1A1AA',
  },
});
```

## 2.3 Stores

### src/stores/chatStore.ts
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Message {
  id: string;
  type: 'user' | 'do';
  content: string | DoContent;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface DoContent {
  type: 'text' | 'card' | 'action' | 'reward' | 'suggestion';
  data: any;
}

interface ChatState {
  messages: Message[];
  sessionId: string;
  isTyping: boolean;
  pendingMessage: string | null;

  // Actions
  sendMessage: (text: string) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setTyping: (typing: boolean) => void;
  clearHistory: () => void;
  initializeSession: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      sessionId: '',
      isTyping: false,
      pendingMessage: null,

      initializeSession: () => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set({ sessionId, messages: [] });
      },

      sendMessage: (text: string) => {
        const { sessionId, messages } = get();

        // Add user message
        const userMessage: Message = {
          id: `msg_${Date.now()}`,
          type: 'user',
          content: text,
          timestamp: new Date(),
          status: 'sending',
        };

        set({
          messages: [...messages, userMessage],
          isTyping: true,
        });

        // TODO: Send to backend
        // This will be handled by the API call
      },

      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
          isTyping: false,
        }));
      },

      updateMessage: (id: string, updates: Partial<Message>) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },

      setTyping: (typing: boolean) => {
        set({ isTyping: typing });
      },

      clearHistory: () => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set({ messages: [], sessionId });
      },
    }),
    {
      name: 'do-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
      }),
    }
  )
);
```

### src/stores/userStore.ts
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
}

export interface KarmaState {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  pointsToNextTier: number;
  multiplier: number;
}

export interface WalletState {
  coins: number;
  vouchers: number;
}

interface UserState {
  profile: UserProfile | null;
  karma: KarmaState | null;
  wallet: WalletState | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setProfile: (profile: UserProfile) => void;
  setKarma: (karma: KarmaState) => void;
  setWallet: (wallet: WalletState) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      karma: null,
      wallet: null,
      isAuthenticated: false,
      isLoading: false,

      setProfile: (profile) => set({ profile, isAuthenticated: true }),
      setKarma: (karma) => set({ karma }),
      setWallet: (wallet) => set({ wallet }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          profile: null,
          karma: null,
          wallet: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'do-user-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

## 2.4 Services

### src/services/api/client.ts
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.rez.money';

interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || `${BASE_URL}/do`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle token expiration
          this.token = null;
          // TODO: Redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
```

### src/services/api/do.ts
```typescript
import apiClient from './client';
import type { Message, DoContent } from '@/stores/chatStore';
import type { UserProfile, KarmaState, WalletState } from '@/stores/userStore';

// Types
interface ChatMessageRequest {
  sessionId: string;
  message: string;
  context?: {
    location?: { lat: number; lng: number };
  };
}

interface ChatMessageResponse {
  sessionId: string;
  messages: {
    id: string;
    type: 'text' | 'card' | 'action' | 'reward' | 'suggestion';
    content: string | DoContent;
    timestamp: string;
  }[];
}

interface DiscoverResponse {
  items: Entity[];
  section: string;
}

interface Entity {
  id: string;
  type: 'venue' | 'trial' | 'event';
  name: string;
  image?: string;
  subtitle: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  openNow?: boolean;
  nextSlot?: string;
  karmaDiscount?: number;
  coinEarning?: number;
}

interface WalletResponse {
  coins: number;
  karma: KarmaState;
  vouchers: {
    id: string;
    title: string;
    discount: number;
    expiresAt: string;
  }[];
}

interface BookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending' | 'failed';
  confirmationCode?: string;
  qrCode?: string;
  karmaDiscount?: number;
  coinsEarned?: number;
}

// API Functions
export const doApi = {
  // Chat
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    return apiClient.post<ChatMessageResponse>('/chat/message', request);
  },

  // Discovery
  async discover(params: {
    intent?: string;
    lat: number;
    lng: number;
    category?: string;
  }): Promise<DiscoverResponse> {
    return apiClient.get<DiscoverResponse>('/discover', params);
  },

  async getMoodDiscovery(mood: string, lat: number, lng: number): Promise<DiscoverResponse> {
    return apiClient.get<DiscoverResponse>(`/discover/mood/${mood}`, { lat, lng });
  },

  async getTrending(lat: number, lng: number): Promise<DiscoverResponse> {
    return apiClient.get<DiscoverResponse>('/discover/trending', { lat, lng });
  },

  // Wallet
  async getWallet(): Promise<WalletResponse> {
    return apiClient.get<WalletResponse>('/wallet');
  },

  // Bookings
  async quickBook(params: {
    entityId: string;
    entityType: 'venue' | 'trial' | 'event';
    dateTime?: string;
    partySize?: number;
    useKarma?: boolean;
  }): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/booking/quick', params);
  },

  async getBooking(bookingId: string): Promise<any> {
    return apiClient.get(`/bookings/${bookingId}`);
  },

  async getBookingHistory(): Promise<any[]> {
    return apiClient.get('/bookings/history');
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/profile');
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/profile', data);
  },
};

export default doApi;
```

## 2.5 Screens

### app/_layout.tsx
```typescript
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0F0F12' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="wallet" />
            <Stack.Screen name="profile" />
            <Stack.Screen
              name="onboarding"
              options={{
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### app/index.tsx (Chat Screen)
```typescript
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Compass, Coins, User } from 'lucide-react-native';

import { useChatStore, Message } from '@/stores/chatStore';
import { useUserStore } from '@/stores/userStore';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { EntityCard } from '@/components/chat/EntityCard';
import { RewardCard } from '@/components/chat/RewardCard';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { doApi } from '@/services/api/do';

const QUICK_ACTIONS = [
  "I'm bored",
  'Book dinner',
  'Show my coins',
  'Find nearby',
];

export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    sessionId,
    isTyping,
    initializeSession,
    addMessage,
    setTyping,
  } = useChatStore();

  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    // Send message to API
    try {
      const response = await doApi.sendMessage({
        sessionId,
        message: text,
      });

      // Add response messages
      response.messages.forEach((msg) => {
        addMessage({
          id: msg.id,
          type: 'do',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        });
      });
    } catch (error) {
      // Handle error
      addMessage({
        id: `error_${Date.now()}`,
        type: 'do',
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  const handleEntityAction = (entityId: string, action: string) => {
    if (action === 'book') {
      // Handle booking
      handleSend(`Book ${entityId}`);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'user') {
      return (
        <MessageBubble
          type="user"
          content={item.content as string}
          timestamp={item.timestamp}
          status={item.status}
        />
      );
    }

    // Do messages can be text or content
    const content = item.content;
    if (typeof content === 'string') {
      return (
        <MessageBubble
          type="do"
          content={content}
          timestamp={item.timestamp}
        />
      );
    }

    // Handle structured content
    switch (content.type) {
      case 'card':
        return (
          <View style={styles.cardContainer}>
            <EntityCard
              entity={content.data}
              karmaDiscount={content.data.karmaDiscount}
              coinEarning={content.data.coinEarning}
              onAction={(action) => handleEntityAction(content.data.id, action)}
            />
          </View>
        );
      case 'reward':
        return (
          <View style={styles.rewardContainer}>
            <RewardCard
              coins={content.data.coins}
              karma={content.data.karma}
              tierProgress={content.data.tierProgress}
            />
          </View>
        );
      default:
        return (
          <MessageBubble
            type="do"
            content={String(content)}
            timestamp={item.timestamp}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Do</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <User size={24} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Hi, I'm Do</Text>
            <Text style={styles.emptyText}>
              Your AI that actually does.{'\n'}
              Tell me what you want.
            </Text>
          </View>
        }
        ListFooterComponent={isTyping ? <TypingIndicator /> : null}
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        quickActions={QUICK_ACTIONS}
        onQuickAction={handleQuickAction}
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <MessageCircle size={24} color="#7C3AED" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/explore')}
        >
          <Compass size={24} color="#A1A1AA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/wallet')}
        >
          <Coins size={24} color="#A1A1AA" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/profile')}
        >
          <User size={24} color="#A1A1AA" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D33',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#10B981',
  },
  messagesList: {
    paddingVertical: 16,
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  rewardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1F',
    borderTopWidth: 1,
    borderTopColor: '#2D2D33',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
```

---

# PART 3: BACKEND IMPLEMENTATION

## 3.1 Project Setup

### do-backend/package.json
```json
{
  "name": "do-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "compression": "^1.7.4",
    "ws": "^8.18.0",
    "dotenv": "^16.4.0",
    "jsonwebtoken": "^9.0.0",
    "ioredis": "^5.4.0",
    "axios": "^1.7.0",
    "date-fns": "^4.0.0",
    "zod": "^3.23.0",
    "winston": "^3.14.0",
    "express-rate-limit": "^7.4.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/ws": "^8.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^22.0.0",
    "typescript": "~5.3.0",
    "tsx": "^4.19.0"
  }
}
```

### do-backend/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 3.2 Core Services

### do-backend/src/index.ts
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { chatRouter } from './api/routes/chat';
import { discoverRouter } from './api/routes/discover';
import { walletRouter } from './api/routes/wallet';
import { authRouter } from './api/routes/auth';

import { errorHandler } from './api/middleware/errorHandler';
import { logger } from './utils/logger';
import { config } from './utils/config';

const app = express();
const server = createServer(app);

// WebSocket server for real-time chat
const wss = new WebSocketServer({ server, path: '/stream' });

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/do/auth', authRouter);
app.use('/do/chat', chatRouter);
app.use('/do/discover', discoverRouter);
app.use('/do/wallet', walletRouter);

// Error handler
app.use(errorHandler);

// WebSocket handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const sessionId = url.searchParams.get('sessionId');

  logger.info('WebSocket connected', { sessionId });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      // Handle incoming WebSocket messages
      await handleWebSocketMessage(ws, sessionId, message);
    } catch (error) {
      logger.error('WebSocket message error', { error });
    }
  });

  ws.on('close', () => {
    logger.info('WebSocket disconnected', { sessionId });
  });
});

// Start server
server.listen(config.PORT, () => {
  logger.info(`Do backend running on port ${config.PORT}`);
});

async function handleWebSocketMessage(
  ws: WebSocket,
  sessionId: string | null,
  message: any
) {
  if (!sessionId) return;

  switch (message.type) {
    case 'message':
      // Process chat message
      break;
    case 'typing':
      // Broadcast typing indicator
      break;
    case 'heartbeat':
      ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      break;
  }
}
```

### do-backend/src/services/intentParser.ts
```typescript
import { z } from 'zod';
import { logger } from '../utils/logger';

export enum DoIntent {
  // Discovery
  BROWSE = 'browse',
  SEARCH = 'search',
  MOOD_DISCOVERY = 'mood_discovery',

  // Actions
  BOOK = 'book',
  PAY = 'pay',
  ORDER = 'order',
  RESERVE = 'reserve',

  // Queries
  CHECK_BALANCE = 'check_balance',
  CHECK_KARMA = 'check_karma',
  CHECK_BOOKINGS = 'check_bookings',

  // Management
  CANCEL = 'cancel',
  MODIFY = 'modify',

  // Utility
  DIRECTIONS = 'directions',
  REMINDER = 'reminder',

  // Meta
  HELP = 'help',
  GREETING = 'greeting',
}

interface ParsedIntent {
  intent: DoIntent;
  confidence: number;
  entities: ExtractedEntities;
  parameters: Record<string, any>;
  suggestedActions: string[];
}

interface ExtractedEntities {
  venue?: {
    id?: string;
    name?: string;
    type?: string;
  };
  time?: {
    when: 'now' | 'today' | 'tomorrow' | 'specific';
    specific?: Date;
  };
  partySize?: number;
  location?: {
    lat: number;
    lng: number;
    description?: string;
  };
  amount?: number;
  mood?: string;
}

// Intent patterns
const INTENT_PATTERNS: Record<DoIntent, RegExp[]> = {
  [DoIntent.BROWSE]: [
    /show\s+me\s+(.+)/i,
    /what'?s?\s+(nearby|around|available)/i,
    /find\s+(.+)/i,
  ],
  [DoIntent.SEARCH]: [
    /search\s+for\s+(.+)/i,
    /look\s+(?:for|up)\s+(.+)/i,
    /(?:find|get)\s+(?:me\s+)?(.+)/i,
  ],
  [DoIntent.MOOD_DISCOVERY]: [
    /i'?m\s+(bored|tired|stressed)/i,
    /want\s+to\s+(relax|celebrate|have\s+fun)/i,
    /suggest\s+(?:something|what\s+to\s+do)/i,
    /(?:what|where)\s+should\s+i\s+(do|go|eat)/i,
  ],
  [DoIntent.BOOK]: [
    /book\s+(.+)/i,
    /reserve\s+(.+)/i,
    /make\s+a\s+(.+)\s+(?:for\s+(\d+))?/i,
  ],
  [DoIntent.PAY]: [
    /pay\s+(?:for\s+)?(.+)/i,
    /checkout/i,
    /complete\s+(?:the\s+)?payment/i,
  ],
  [DoIntent.ORDER]: [
    /order\s+(.+)/i,
    /get\s+(.+)\s+(?:delivered)?/i,
  ],
  [DoIntent.RESERVE]: [
    /reserve\s+(.+)/i,
    /book\s+(.+)/i,
  ],
  [DoIntent.CHECK_BALANCE]: [
    /how\s+much\s+(?:coins?|money)/i,
    /check\s+(?:my\s+)?balance/i,
    /show\s+(?:my\s+)?coins?/i,
  ],
  [DoIntent.CHECK_KARMA]: [
    /show\s+(?:my\s+)?karma/i,
    /what(?:\'?s)?\s+(?:my\s+)?tier/i,
    /karma\s+status/i,
  ],
  [DoIntent.CHECK_BOOKINGS]: [
    /my\s+bookings/i,
    /what\s+did\s+i\s+book/i,
    /booking\s+history/i,
  ],
  [DoIntent.CANCEL]: [
    /cancel\s+(.+)/i,
    /remove\s+(.+)/i,
  ],
  [DoIntent.MODIFY]: [
    /change\s+(.+)/i,
    /modify\s+(.+)/i,
    /update\s+(.+)/i,
  ],
  [DoIntent.DIRECTIONS]: [
    /directions?\s+to\s+(.+)/i,
    /how\s+do\s+i\s+get\s+(?:there|to\s+.+)/i,
    /where\s+is\s+(.+)/i,
  ],
  [DoIntent.REMINDER]: [
    /remind\s+(?:me\s+)?(.+)/i,
    /set\s+(?:a\s+)?reminder/i,
  ],
  [DoIntent.HELP]: [
    /help/i,
    /what\s+can\s+(?:you|i)\s+do/i,
    /how\s+(?:does|do)\s+this\s+work/i,
  ],
  [DoIntent.GREETING]: [
    /^(hi|hey|hello|yo|sup)/i,
    /^good\s+(morning|afternoon|evening)/i,
  ],
};

// Mood keywords
const MOOD_KEYWORDS: Record<string, string> = {
  bored: 'bored',
  'want to relax': 'relax',
  'want to celebrate': 'celebrate',
  'want to have fun': 'adventure',
  'looking for adventure': 'adventure',
  'date night': 'date',
  romantic: 'date',
  tired: 'relax',
  stressed: 'relax',
};

export class IntentParser {
  parse(input: string): ParsedIntent {
    const normalizedInput = input.toLowerCase().trim();

    // Try to match patterns
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = normalizedInput.match(pattern);
        if (match) {
          return {
            intent: intent as DoIntent,
            confidence: 0.9,
            entities: this.extractEntities(normalizedInput, match),
            parameters: this.extractParameters(normalizedInput, intent as DoIntent),
            suggestedActions: this.getSuggestedActions(intent as DoIntent),
          };
        }
      }
    }

    // Default to search with fallback
    return {
      intent: DoIntent.SEARCH,
      confidence: 0.5,
      entities: { venue: { name: normalizedInput } },
      parameters: {},
      suggestedActions: ['Search for venues'],
    };
  }

  private extractEntities(input: string, match: RegExpMatchArray): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // Extract party size
    const partyMatch = input.match(/(\d+)\s*(?:people|person|guests?)?/i);
    if (partyMatch) {
      entities.partySize = parseInt(partyMatch[1], 10);
    }

    // Extract time
    if (/now|immediately|asap/i.test(input)) {
      entities.time = { when: 'now' };
    } else if (/tonight|today/i.test(input)) {
      entities.time = { when: 'today' };
    } else if (/tomorrow/i.test(input)) {
      entities.time = { when: 'tomorrow' };
    } else {
      // Try to extract specific time
      const timeMatch = input.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
      if (timeMatch) {
        entities.time = {
          when: 'specific',
          specific: this.parseTime(timeMatch),
        };
      }
    }

    // Extract mood
    for (const [keyword, mood] of Object.entries(MOOD_KEYWORDS)) {
      if (input.includes(keyword)) {
        entities.mood = mood;
        break;
      }
    }

    // Extract venue type from captured group
    if (match[1]) {
      entities.venue = { name: match[1] };
    }

    return entities;
  }

  private extractParameters(input: string, intent: DoIntent): Record<string, any> {
    const params: Record<string, any> = {};

    // Intent-specific parameter extraction
    switch (intent) {
      case DoIntent.BOOK:
      case DoIntent.RESERVE:
        params.isBooking = true;
        break;
      case DoIntent.MOOD_DISCOVERY:
        // Already extracted mood in entities
        break;
    }

    return params;
  }

  private parseTime(match: RegExpMatchArray): Date {
    const now = new Date();
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    now.setHours(hours, minutes, 0, 0);
    return now;
  }

  private getSuggestedActions(intent: DoIntent): string[] {
    const suggestions: Record<DoIntent, string[]> = {
      [DoIntent.BROWSE]: ['Show popular', 'Show nearby', 'Show trending'],
      [DoIntent.SEARCH]: ['Search nearby', 'Try a different term'],
      [DoIntent.MOOD_DISCOVERY]: ["Surprise me", "Show me options"],
      [DoIntent.BOOK]: ['View details', 'Check availability', 'Book a different time'],
      [DoIntent.PAY]: ['Try again', 'Use different method'],
      [DoIntent.ORDER]: ['Track order', 'View menu'],
      [DoIntent.RESERVE]: ['View details', 'Different time'],
      [DoIntent.CHECK_BALANCE]: ['View transactions', 'Earn more coins'],
      [DoIntent.CHECK_KARMA]: ['View tier benefits', 'How to earn karma'],
      [DoIntent.CHECK_BOOKINGS]: ['Upcoming', 'Past bookings'],
      [DoIntent.CANCEL]: ['Confirm cancel', 'Keep booking'],
      [DoIntent.MODIFY]: ['Change details'],
      [DoIntent.DIRECTIONS]: ['Open in maps', 'Share location'],
      [DoIntent.REMINDER]: ['Change time', 'Cancel reminder'],
      [DoIntent.HELP]: ['Bookings', 'Payments', 'Rewards'],
      [DoIntent.GREETING]: ['Book dinner', 'Find nearby', 'Check my karma'],
    };

    return suggestions[intent] || [];
  }
}

export const intentParser = new IntentParser();
```

### do-backend/src/services/workflowEngine.ts
```typescript
import { logger } from '../utils/logger';
import { DoIntent, intentParser } from './intentParser';
import { rezDiscovery } from '../integrations/rezDiscovery';
import { rezOrder } from '../integrations/rezOrder';
import { rezWallet } from '../integrations/rezWallet';
import { rezLoyalty } from '../integrations/rezLoyalty';
import { responseGenerator } from './responseGenerator';

interface WorkflowStep {
  id: string;
  service: string;
  action: string;
  params: any;
  outputKey: string;
  critical?: boolean;
}

interface WorkflowResult {
  success: boolean;
  steps: Map<string, any>;
  response: any;
  error?: string;
}

export class WorkflowEngine {
  async execute(
    intent: DoIntent,
    entities: any,
    context: any
  ): Promise<WorkflowResult> {
    const steps = new Map<string, any>();
    let response: any;

    try {
      switch (intent) {
        case DoIntent.MOOD_DISCOVERY:
          response = await this.executeMoodDiscovery(entities, context);
          break;

        case DoIntent.BOOK:
        case DoIntent.RESERVE:
          response = await this.executeBooking(entities, context);
          break;

        case DoIntent.CHECK_BALANCE:
        case DoIntent.CHECK_KARMA:
          response = await this.executeWalletCheck(entities, context);
          break;

        case DoIntent.SEARCH:
        case DoIntent.BROWSE:
          response = await this.executeDiscovery(entities, context);
          break;

        default:
          response = await responseGenerator.generateDefaultResponse(intent);
      }

      return {
        success: true,
        steps,
        response,
      };
    } catch (error) {
      logger.error('Workflow execution failed', { intent, error });
      return {
        success: false,
        steps,
        response: responseGenerator.generateErrorResponse(error as Error),
        error: (error as Error).message,
      };
    }
  }

  private async executeMoodDiscovery(
    entities: any,
    context: any
  ): Promise<any> {
    const mood = entities.mood || 'bored';

    // Get user preferences from ReZ Mind
    const userProfile = await this.getUserProfile(context.userId);

    // Get venues based on mood
    const venues = await rezDiscovery.getByMood(
      mood,
      context.location,
      userProfile
    );

    // Calculate karma discounts
    const venuesWithDiscounts = await Promise.all(
      venues.map(async (venue: any) => {
        const discount = await rezLoyalty.calculateDiscount(
          context.userId,
          venue.id
        );
        return {
          ...venue,
          karmaDiscount: discount.amount,
          coinEarning: Math.round(venue.avgPrice * 0.05),
        };
      })
    );

    return {
      type: 'discovery',
      content: `Based on your mood, here are some ideas:`,
      data: {
        mood,
        items: venuesWithDiscounts.slice(0, 5),
      },
    };
  }

  private async executeBooking(
    entities: any,
    context: any
  ): Promise<any> {
    const { venue, time, partySize } = entities;

    // Get user karma for discount
    const karmaDiscount = await rezLoyalty.calculateDiscount(
      context.userId,
      venue?.id
    );

    // Check availability
    const availability = await rezOrder.checkAvailability({
      venueId: venue?.id,
      dateTime: time?.specific || new Date(),
      partySize: partySize || 2,
    });

    if (!availability.available) {
      return {
        type: 'text',
        content: `Sorry, ${availability.reason}. Here are some alternatives:`,
        data: {
          alternatives: availability.suggestions,
        },
      };
    }

    // Calculate total
    const subtotal = availability.price;
    const discountAmount = Math.round(subtotal * (karmaDiscount.rate || 0));
    const total = subtotal - discountAmount;

    // Create booking
    const booking = await rezOrder.createBooking({
      userId: context.userId,
      venueId: venue?.id,
      dateTime: time?.specific || new Date(),
      partySize: partySize || 2,
      karmaDiscount: discountAmount,
    });

    // Add karma reward
    const karmaEarned = Math.round(total * 0.1);
    const coinsEarned = Math.round(total * 0.05);

    await rezLoyalty.recordReward(context.userId, {
      type: 'booking',
      entityId: venue?.id,
      karmaAmount: karmaEarned,
      coinsAmount: coinsEarned,
    });

    return {
      type: 'confirmation',
      content: `Booking confirmed!`,
      data: {
        booking: {
          id: booking.id,
          confirmationCode: booking.confirmationCode,
          venue: availability.venue,
          dateTime: booking.dateTime,
          partySize: booking.partySize,
          subtotal,
          discount: discountAmount,
          total,
        },
        rewards: {
          karma: karmaEarned,
          coins: coinsEarned,
        },
      },
    };
  }

  private async executeWalletCheck(
    entities: any,
    context: any
  ): Promise<any> {
    const wallet = await rezWallet.getWallet(context.userId);
    const karma = await rezLoyalty.getKarmaStatus(context.userId);

    return {
      type: 'wallet_display',
      content: `Here's your status:`,
      data: {
        coins: wallet.balance,
        karma: {
          tier: karma.tier,
          points: karma.points,
          nextTier: karma.nextTier,
          progress: karma.progress,
        },
      },
    };
  }

  private async executeDiscovery(
    entities: any,
    context: any
  ): Promise<any> {
    const { venue } = entities;

    const venues = await rezDiscovery.search({
      query: venue?.name,
      location: context.location,
      limit: 10,
    });

    return {
      type: 'discovery',
      content: `Found ${venues.length} places:`,
      data: {
        items: venues,
      },
    };
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Get from ReZ Mind
    return {};
  }
}

export const workflowEngine = new WorkflowEngine();
```

### do-backend/src/services/responseGenerator.ts
```typescript
interface ResponseTemplate {
  type: 'text' | 'card' | 'action' | 'reward';
  template: string | ((params: any) => string);
}

const RESPONSES = {
  greeting: [
    "Hey! What can I do for you today?",
    "Hi there! Ready to help you out.",
    "Hello! Just say what you need.",
  ],

  booking_confirmed: [
    "All set! Your booking is confirmed.",
    "Done! See you there!",
    "Booked! Here's your confirmation.",
  ],

  coins_earned: (coins: number) => `+${coins} coins earned!`,

  karma_earned: (karma: number) => `+${karma} karma added!`,

  no_results: [
    "Couldn't find anything matching that. Want to try something different?",
    "Hmm, no results. Maybe try another search?",
    "Nothing here yet. Want to explore nearby instead?",
  ],

  error: [
    "Something went wrong. Let me try that again.",
    "Oops, error on my end. One more try?",
    "That didn't work. Give me another shot?",
  ],

  help: `
I can help you with:

• Booking restaurants, trials, events
• Finding places nearby
• Checking your coins and karma
• Planning your evening
• And more!

Just tell me what you need.
`.trim(),
};

export class ResponseGenerator {
  generateText(key: keyof typeof RESPONSES, ...args: any[]): string {
    const templates = RESPONSES[key];
    if (typeof templates === 'string') {
      return templates;
    }
    if (Array.isArray(templates)) {
      return templates[Math.floor(Math.random() * templates.length)];
    }
    if (typeof templates === 'function') {
      return templates(...args);
    }
    return "I'm not sure how to respond to that.";
  }

  generateDefaultResponse(intent: any): any {
    switch (intent) {
      case 'greeting':
        return {
          type: 'text',
          content: this.generateText('greeting'),
        };

      case 'help':
        return {
          type: 'text',
          content: RESPONSES.help,
          suggestions: ['Book dinner', 'Find nearby', 'Show my karma'],
        };

      default:
        return {
          type: 'text',
          content: "I'm not sure I understand. Try saying 'help' to see what I can do.",
        };
    }
  }

  generateErrorResponse(error: Error): any {
    return {
      type: 'error',
      content: this.generateText('error'),
      error: error.message,
    };
  }

  formatBookingConfirmation(booking: any): any {
    return {
      type: 'confirmation',
      content: this.generateText('booking_confirmed'),
      data: booking,
    };
  }

  formatReward(coins: number, karma: number): any {
    return {
      type: 'reward',
      content: '',
      data: {
        coins,
        karma,
      },
    };
  }
}

export const responseGenerator = new ResponseGenerator();
```

## 3.3 Integration Services

### do-backend/src/integrations/rezDiscovery.ts
```typescript
import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

const api = axios.create({
  baseURL: config.REZ_API_URL,
  timeout: 10000,
});

export const rezDiscovery = {
  async search(params: {
    query?: string;
    location: { lat: number; lng: number };
    category?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const response = await api.get('/discovery/search', {
        params: {
          q: params.query,
          lat: params.location.lat,
          lng: params.location.lng,
          category: params.category,
          limit: params.limit || 10,
        },
      });
      return response.data.items || [];
    } catch (error) {
      logger.error('ReZ Discovery search failed', { error });
      return [];
    }
  },

  async getByMood(
    mood: string,
    location: { lat: number; lng: number },
    userProfile?: any
  ): Promise<any[]> {
    try {
      const response = await api.get('/discovery/mood', {
        params: {
          mood,
          lat: location.lat,
          lng: location.lng,
          userId: userProfile?.id,
        },
      });
      return response.data.items || [];
    } catch (error) {
      logger.error('ReZ Discovery mood search failed', { error });
      return [];
    }
  },

  async getTrending(location: { lat: number; lng: number }): Promise<any[]> {
    try {
      const response = await api.get('/discovery/trending', {
        params: {
          lat: location.lat,
          lng: location.lng,
        },
      });
      return response.data.items || [];
    } catch (error) {
      logger.error('ReZ Discovery trending failed', { error });
      return [];
    }
  },

  async getVenue(venueId: string): Promise<any> {
    try {
      const response = await api.get(`/discovery/venue/${venueId}`);
      return response.data;
    } catch (error) {
      logger.error('ReZ Discovery get venue failed', { error });
      return null;
    }
  },
};
```

### do-backend/src/integrations/rezWallet.ts
```typescript
import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

const api = axios.create({
  baseURL: config.REZ_API_URL,
  timeout: 10000,
});

export const rezWallet = {
  async getWallet(userId: string): Promise<any> {
    try {
      const response = await api.get(`/wallet/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('ReZ Wallet get failed', { error });
      return { balance: 0, vouchers: [] };
    }
  },

  async debit(userId: string, amount: number, reason: string): Promise<any> {
    try {
      const response = await api.post(`/wallet/${userId}/debit`, {
        amount,
        reason,
      });
      return response.data;
    } catch (error) {
      logger.error('ReZ Wallet debit failed', { error });
      throw error;
    }
  },

  async credit(userId: string, amount: number, reason: string): Promise<any> {
    try {
      const response = await api.post(`/wallet/${userId}/credit`, {
        amount,
        reason,
      });
      return response.data;
    } catch (error) {
      logger.error('ReZ Wallet credit failed', { error });
      throw error;
    }
  },
};
```

### do-backend/src/integrations/rezLoyalty.ts
```typescript
import axios from 'axios';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

const api = axios.create({
  baseURL: config.REZ_API_URL,
  timeout: 10000,
});

const TIER_DISCOUNTS = {
  bronze: 0.05,
  silver: 0.10,
  gold: 0.15,
  platinum: 0.20,
};

export const rezLoyalty = {
  async getKarmaStatus(userId: string): Promise<any> {
    try {
      const response = await api.get(`/loyalty/${userId}/status`);
      return response.data;
    } catch (error) {
      logger.error('ReZ Loyalty status failed', { error });
      return {
        tier: 'bronze',
        points: 0,
        nextTier: 'silver',
        progress: 0,
      };
    }
  },

  async calculateDiscount(
    userId: string,
    venueId: string
  ): Promise<{ rate: number; amount: number }> {
    try {
      const response = await api.get(`/loyalty/${userId}/discount/${venueId}`);
      return response.data;
    } catch (error) {
      // Default to 5% discount for bronze
      return { rate: TIER_DISCOUNTS.bronze, amount: 0 };
    }
  },

  async recordReward(
    userId: string,
    reward: {
      type: string;
      entityId: string;
      karmaAmount: number;
      coinsAmount: number;
    }
  ): Promise<any> {
    try {
      const response = await api.post(`/loyalty/${userId}/reward`, reward);
      return response.data;
    } catch (error) {
      logger.error('ReZ Loyalty reward failed', { error });
      throw error;
    }
  },
};
```

---

# PART 4: DEPLOYMENT

## 4.1 Docker Configuration

### do-backend/Dockerfile
```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### docker-compose.yml (additions)
```yaml
services:
  do-backend:
    build: ./do-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REZ_API_URL=http://rez-api-gateway:3000
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
    restart: unless-stopped

  do-frontend:
    build:
      context: ./do-app
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - EXPO_PUBLIC_API_URL=https://api.rez.money
    depends_on:
      - do-backend
    restart: unless-stopped
```

## 4.2 Environment Variables

### do-backend/.env.example
```env
# Server
NODE_ENV=development
PORT=3000

# ReZ Services
REZ_API_URL=http://localhost:3000
REZ_API_KEY=your-api-key

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

---

# PART 5: LAUNCH CHECKLIST

## Pre-Launch

### Week 1-2: Foundation
- [ ] App shell with navigation
- [ ] Chat interface (messages, input)
- [ ] Do backend API setup
- [ ] Auth integration with ReZ
- [ ] Basic text responses

### Week 3-4: Discovery
- [ ] Explore tab with feed
- [ ] Intent classification
- [ ] Entity cards (venues)
- [ ] ReZ Discovery integration
- [ ] Location services

### Week 5-6: Execution
- [ ] Booking workflow
- [ ] Payment flow
- [ ] Karma discount calculation
- [ ] Booking confirmation + QR
- [ ] Notification integration

### Week 7-8: Rewards
- [ ] Coin animations
- [ ] Karma display
- [ ] Voucher cards
- [ ] Leaderboard
- [ ] Achievement system

### Week 9-10: Polish
- [ ] Voice input
- [ ] Error handling
- [ ] Loading states
- [ ] Performance optimization
- [ ] Accessibility

### Week 11-12: Launch
- [ ] Beta testing (internal)
- [ ] Bug fixes
- [ ] App Store submission
- [ ] Play Store submission
- [ ] Launch announcement

---

# PART 6: METRICS

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Engagement** | | |
| DAU/MAU | > 35% | Week 4 |
| Sessions/week | > 4 | Week 4 |
| Avg session length | > 2 min | Week 4 |
| | | |
| **Conversions** | | |
| Discovery CTR | > 15% | Week 6 |
| Booking rate | > 20% | Week 6 |
| Payment success | > 95% | Week 6 |
| | | |
| **Retention** | | |
| Day 1 retention | > 40% | Week 8 |
| Day 7 retention | > 25% | Week 8 |
| Day 30 retention | > 15% | Week 12 |
| | | |
| **Business** | | |
| Bookings/month | 10,000 | Month 1 |
| GMV/month | ₹50L | Month 1 |
| Merchants | 500 | Month 1 |

---

**End of Master Implementation Plan**
