# ReZ Frontend UX/UI Training Guide

This document provides comprehensive training on the ReZ frontend architecture, patterns, and best practices. It covers React Native (Consumer App, Merchant App) and Next.js (rez-now, adBazaar, creators) applications.

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Design System Patterns](#2-design-system-patterns)
3. [State Management](#3-state-management)
4. [Styling Conventions](#4-styling-conventions)
5. [Responsive Design Patterns](#5-responsive-design-patterns)
6. [Animation/Interaction Patterns](#6-animationinteraction-patterns)
7. [Form Handling Patterns](#7-form-handling-patterns)
8. [Error Display Patterns](#8-error-display-patterns)
9. [Loading States](#9-loading-states)
10. [Empty States](#10-empty-states)
11. [Reusable Components to Create](#11-reusable-components-to-create)
12. [Design Tokens](#12-design-tokens)
13. [Accessibility Patterns](#13-accessibility-patterns)
14. [Performance Patterns](#14-performance-patterns)

---

## 1. Component Architecture

### 1.1 Directory Structure

```
rez-app-consumer/
├── app/                    # Expo Router screens
├── components/
│   ├── ui/                 # Primitive UI components (Button, Input, etc.)
│   ├── common/             # Shared components (EmptyState, ErrorState, etc.)
│   ├── skeletons/          # Loading skeleton components
│   ├── animations/         # Animation-specific components
│   └── [feature]/          # Feature-specific components
├── constants/               # Design tokens and constants
├── contexts/               # React Context providers
├── hooks/                  # Custom hooks
├── stores/                 # Zustand stores
├── services/               # API services
├── types/                  # TypeScript types
└── utils/                  # Utility functions

rez-app-merchant/
├── app/                    # Expo Router screens
├── components/
│   ├── ui/                 # Merchant-specific UI components
│   ├── common/             # Shared components
│   └── [feature]/          # Feature components
├── forms/                  # Form components
├── hooks/                  # Custom hooks
├── contexts/               # Context providers
├── services/               # API services
├── stores/                 # Zustand stores
└── types/                  # TypeScript types

rez-now/                    # Next.js web app
├── app/                    # Next.js App Router
├── components/
│   ├── ui/                 # Web-specific UI
│   ├── [feature]/          # Feature components
│   └── shared/             # Shared components
├── hooks/                  # Custom hooks
├── lib/                    # Utilities and libraries
└── src/                    # Additional source code
```

### 1.2 Component Types

#### Primitive UI Components
Located in `components/ui/`. These are the building blocks:
- `Button.tsx` - Multi-variant button with animations
- `Input.tsx` - Form input with validation states
- `Badge.tsx` - Status badges
- `Card.tsx` - Container card
- `Chip.tsx` - Filter/selection chips
- `Divider.tsx` - Section dividers
- `Toast.tsx` - Notification toasts
- `ShimmerSkeleton.tsx` - Loading skeleton

#### Common Components
Located in `components/common/`. Reusable patterns:
- `EmptyState.tsx` - Empty state display
- `ErrorState.tsx` - Error display with retry
- `ScreenSkeleton.tsx` - Full-page loading states
- `BottomSheet.tsx` - Modal sheet from bottom
- `FeatureErrorBoundary.tsx` - Feature-level error boundary
- `RetryButton.tsx` - Retry action button
- `OfflineBanner.tsx` - Offline indicator

#### Feature Components
Organized by domain:
- `homepage/` - Home page components
- `cart/` - Shopping cart
- `checkout/` - Checkout flow
- `product/` - Product details
- `search/` - Search functionality
- `wallet/` - Wallet features
- `profile/` - User profile

### 1.3 Component Patterns

#### Pattern: Atomic Design with React Native
```typescript
// Atoms (UI primitives)
components/ui/Button.tsx
components/ui/Input.tsx

// Molecules (Simple combinations)
components/common/EmptyState.tsx
components/common/ErrorState.tsx

// Organisms (Feature components)
components/product/ProductCard.tsx
components/cart/CartItem.tsx

// Templates (Page layouts)
components/layouts/PageLayout.tsx
```

#### Pattern: Component Composition
```typescript
// Use composition for flexibility
interface CardProps {
  header?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

function Card({ header, content, footer, children }: CardProps) {
  return (
    <View style={styles.card}>
      {header && <View style={styles.header}>{header}</View>}
      {content || children}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}
```

#### Pattern: Controlled vs Uncontrolled
```typescript
// Controlled component
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
}

// Uncontrolled component with ref
interface SearchInputProps {
  defaultValue?: string;
  onSubmit: (value: string) => void;
}
```

---

## 2. Design System Patterns

### 2.1 Design System Architecture

The design system is centralized in `constants/theme.ts` as the single source of truth:

```typescript
// Import from the canonical source
import { colors, spacing, typography, shadows } from '@/constants/theme';

// Legacy shims exist but should migrate to the new source
import { Colors, Spacing, BorderRadius } from '@/constants/DesignTokens';
```

### 2.2 Typography Scale

```typescript
typography = {
  // Display
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },

  // Headings
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.4 },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '600', letterSpacing: -0.2 },
  h4: { fontSize: 18, lineHeight: 24, fontWeight: '600' },

  // Body
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' },

  // Labels
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0.2 },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.3 },
  button: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0.5 },

  // Special
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2 },
  overline: { fontSize: 10, lineHeight: 12, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase' },
  link: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
}
```

### 2.3 Brand Palette

The REZ brand uses these core colors:

| Name | Hex | Usage |
|------|-----|-------|
| Nile Blue | `#1a3a52` | Primary dark, text |
| Light Mustard | `#ffcd57` | Primary accent, gold |
| Linen | `#faf1e0` | Light backgrounds |
| Light Peach | `#ffd7b5` | Secondary accent |
| Lavender Mist | `#dfebf7` | Tertiary accent |

### 2.4 Dark Mode Support

```typescript
// Theme-aware components use useTheme hook
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { colors, isDark, shadows } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background.primary }}>
      <Text style={{ color: colors.text.primary }}>Hello</Text>
    </View>
  );
}
```

Dark mode colors are defined in `darkColors` object with the same structure.

---

## 3. State Management

### 3.1 Zustand Store Pattern

The codebase uses Zustand for global state management with a specific pattern:

```typescript
// stores/appStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

interface AppStoreState {
  state: AppState;
  actions: {
    loadSettings: () => Promise<void>;
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  };
}

export const useAppStore = create<AppStoreState>((set: StoreSet, get: StoreGet) => ({
  state: initialAppState,

  actions: {
    loadSettings: async () => {
      // Async implementation
    },
    updateSettings: async (settings) => {
      set((s) => ({
        state: { ...s.state, settings: { ...s.state.settings, ...settings } }
      }));
    },
  },
}));

// Usage in components
const { state, actions } = useAppStore();
```

### 3.2 Context + Zustand Hybrid

For complex domains, use Context with Zustand underneath:

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  state: AuthState;
  actions: AuthActions;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Actions with stable refs to prevent re-renders
  const actionsRef = useRef({ sendOTP, login, logout });
  actionsRef.current = { sendOTP, login, logout };

  const stableActions = useMemo(() => ({
    sendOTP: (...args) => actionsRef.current.sendOTP(...args),
    login: (...args) => actionsRef.current.login(...args),
    logout: () => actionsRef.current.logout(),
  }), []);

  const contextValue = useMemo(() => ({ state, actions: stableActions }), [state, stableActions]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Hook with fallback
export function useAuth() {
  const context = useContext(AuthContext);
  const storeState = useAuthStore((s) => s.state);

  if (context !== undefined) return context;
  return { state: storeState, actions: useAuthStore.getState().actions };
}
```

### 3.3 Store Organization

```
stores/
├── index.ts           # Re-exports
├── authStore.ts       # Authentication state
├── appStore.ts        # App-level settings
├── cartStore.ts       # Shopping cart
├── walletStore.ts     # Wallet/balance
├── locationStore.ts   # Location state
├── notificationStore.ts
├── themeStore.ts
├── wishlistStore.ts
├── selectors/         # Selector functions
│   ├── cartSelectors.ts
│   └── authSelectors.ts
└── [feature]Store.ts
```

### 3.4 Persistence Pattern

```typescript
// Debounced persistence
let _saveTimeout: ReturnType<typeof setTimeout> | null = null;

function saveSettingsDebounced(settings: AppSettings) {
  if (_saveTimeout) clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, 500);
}
```

---

## 4. Styling Conventions

### 4.1 StyleSheet Pattern

```typescript
import { StyleSheet } from 'react-native';
import { spacing, borderRadius, colors } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.base,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
  },
  card: {
    shadowColor: colors.midnightNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
```

### 4.2 Platform-Specific Styling

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowColor: '#000' },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    }),
  },
});
```

### 4.3 Responsive Spacing

```typescript
// Use design tokens for consistency
const styles = StyleSheet.create({
  padding: {
    paddingHorizontal: spacing.lg,  // 24px
    paddingVertical: spacing.md,    // 12px
    gap: spacing.sm,               // 8px (for Flexbox gap)
  },
});
```

### 4.4 Component-Level vs Global Styles

```typescript
// Component-level (preferred for encapsulated components)
function Card({ style }) {
  return <View style={[styles.card, style]} />;
}

// Global styles (for shared layouts)
export const globalStyles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: colors.background.primary },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
});
```

---

## 5. Responsive Design Patterns

### 5.1 Breakpoint System

```typescript
layout = {
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  },
}
```

### 5.2 Responsive Grid Hook

```typescript
import { useResponsiveGrid } from '@/hooks/useResponsiveGrid';

function ProductGrid({ products }) {
  const { numColumns, cardWidth, gap } = useResponsiveGrid(150, 16);

  return (
    <FlatList
      data={products}
      numColumns={numColumns}
      renderItem={({ item }) => <ProductCard width={cardWidth} />}
    />
  );
}

// Custom configuration
function CustomGrid() {
  const { numColumns, cardWidth } = useResponsiveGridCustom({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
  }, 16);
}
```

### 5.3 Conditional Rendering by Screen Size

```typescript
import { useWindowDimensions } from 'react-native';

function AdaptiveLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <View style={styles.container}>
      {isTablet ? (
        <TabletLayout />
      ) : (
        <PhoneLayout />
      )}
    </View>
  );
}
```

### 5.4 Safe Area Handling

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {/* Content */}
    </View>
  );
}
```

---

## 6. Animation/Interaction Patterns

### 6.1 React Native Reanimated Patterns

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

// Press animation on Button
function AnimatedButton({ onPress, children }) {
  const scaleAnim = useSharedValue(1);

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.96, { damping: 14, stiffness: 180 });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { damping: 10, stiffness: 160 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

### 6.2 Spring Configurations

```typescript
timing = {
  springConfig: { damping: 15, stiffness: 150, mass: 1 },
  springBouncy: { damping: 10, stiffness: 100, mass: 0.8 },
  springSmooth: { damping: 20, stiffness: 200, mass: 1 },
}
```

### 6.3 Shimmer Loading Animation

```typescript
import { ShimmerSkeleton } from '@/components/ui/ShimmerSkeleton';

function LoadingCard() {
  return (
    <View>
      <ShimmerSkeleton variant="rect" width="100%" height={180} />
      <ShimmerSkeleton variant="text" width="60%" height={20} />
      <ShimmerSkeleton variant="text" width="40%" height={16} />
    </View>
  );
}
```

### 6.4 Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

function ButtonWithHaptics({ onPress }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return <Pressable onPress={handlePress} />;
}
```

### 6.5 Bottom Sheet Animation

```typescript
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

function BottomSheet({ visible, onClose, children }) {
  const slideAnim = useSharedValue(0);
  const backdropAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(1);
      backdropAnim.value = withTiming(1);
    } else {
      slideAnim.value = withTiming(0);
      backdropAnim.value = withTiming(0);
    }
  }, [visible]);

  const sheetSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(slideAnim.value, [0, 1], [sheetHeight, 0]) }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropAnim.value,
  }));

  return (
    <Modal visible={visible} transparent>
      <Animated.View style={[styles.backdrop, backdropStyle]} />
      <Animated.View style={[styles.sheet, sheetSlideStyle]}>
        {children}
      </Animated.View>
    </Modal>
  );
}
```

---

## 7. Form Handling Patterns

### 7.1 Input Component with Validation

```typescript
import Input from '@/components/ui/Input';
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  return (
    <Input
      label="Email"
      value={email}
      onChangeText={setEmail}
      error={error}
      placeholder="Enter your email"
      keyboardType="email-address"
      autoCapitalize="none"
    />
  );
}
```

### 7.2 React Hook Form Integration (Merchant App)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

function ContactForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Input {...register('name')} error={errors.name?.message} />
      <Input {...register('email')} error={errors.email?.message} />
      <Input {...register('phone')} error={errors.phone?.message} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### 7.3 Form State Management

```typescript
interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Use stores for multi-step forms
interface CheckoutFormStore {
  step: number;
  shipping: ShippingData;
  payment: PaymentData;
  setShipping: (data: ShippingData) => void;
  setPayment: (data: PaymentData) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}
```

---

## 8. Error Display Patterns

### 8.1 ErrorState Component

```typescript
import ErrorState from '@/components/common/ErrorState';

// Usage
function ProductPage({ error, onRetry }) {
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={onRetry}
        title="Failed to Load Product"
      />
    );
  }
  return <ProductContent />;
}
```

### 8.2 FeatureErrorBoundary

```typescript
import FeatureErrorBoundary from '@/components/common/FeatureErrorBoundary';

function WalletPage() {
  return (
    <FeatureErrorBoundary
      featureName="Wallet"
      onError={(error) => logError(error)}
      onReset={() => refetchWallet()}
    >
      <WalletContent />
    </FeatureErrorBoundary>
  );
}

// Compact mode for inline errors
function ProductList() {
  return (
    <FeatureErrorBoundary
      featureName="Products"
      compact
      onError={handleError}
    >
      <ProductGrid />
    </FeatureErrorBoundary>
  );
}
```

### 8.3 Error Modal Pattern

```typescript
import ErrorModal from '@/components/common/ErrorModal';

function MyScreen() {
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const handleError = (error) => {
    setErrorModal({
      visible: true,
      title: 'Error',
      message: error.message,
    });
  };

  return (
    <>
      <Content />
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
      />
    </>
  );
}
```

### 8.4 Network Error Detection

```typescript
function isNetworkError(error: Error): boolean {
  const msg = error?.message?.toLowerCase() ?? '';
  return msg.includes('network') ||
         msg.includes('fetch') ||
         msg.includes('timeout') ||
         msg.includes('failed to fetch');
}
```

---

## 9. Loading States

### 9.1 ScreenSkeleton Component

```typescript
import ScreenSkeleton from '@/components/common/ScreenSkeleton';

function ProductPage({ loading }) {
  if (loading) {
    return <ScreenSkeleton variant="detail" />;
  }
  return <ProductContent />;
}

// With header
function ProductsPage({ loading, header }) {
  if (loading) {
    return <ScreenSkeleton variant="list" header={<PageHeader />} />;
  }
  return (
    <>
      <PageHeader />
      <ProductList />
    </>
  );
}
```

### 9.2 Skeleton Variants

```typescript
type SkeletonVariant =
  | 'list'          // Transaction list
  | 'grid'          // Card grid
  | 'cards'         // Product cards
  | 'detail'        // Detail page
  | 'form'          // Form page
  | 'profile'       // Profile page
  | 'sections'       // Section list
  | 'chat'          // Chat messages
  | 'notifications' // Notification list
  | 'game'          // Game page
  | 'map'           // Map view
  | 'gallery'       // Gallery grid
  | 'categories';   // Category grid
```

### 9.3 Inline Loading States

```typescript
function LoadingButton({ loading, children }) {
  return (
    <Pressable disabled={loading}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        children
      )}
    </Pressable>
  );
}

// List loading footer
function ProductList({ loadingMore, onEndReached }) {
  return (
    <FlatList
      data={products}
      onEndReached={onEndReached}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={styles.loader} /> : null
      }
    />
  );
}
```

### 9.4 ShimmerSkeleton Variants

```typescript
import { ShimmerSkeleton } from '@/components/ui/ShimmerSkeleton';

// Rectangle
<ShimmerSkeleton variant="rect" width={100} height={100} />

// Circle (for avatars)
<ShimmerSkeleton variant="circle" width={48} height={48} />

// Text lines
<ShimmerSkeleton variant="text" width="80%" height={16} />
<ShimmerSkeleton variant="text" width="60%" height={14} />

// Card
<ShimmerSkeleton variant="card" width="100%" height={200} />
```

---

## 10. Empty States

### 10.1 EmptyState Component

```typescript
import EmptyState from '@/components/ui/EmptyState';

function CartPage({ items, onContinueShopping }) {
  if (items.length === 0) {
    return (
      <EmptyState
        iconName="cart-outline"
        title="Your cart is empty"
        subtitle="Add items to get started"
        actionLabel="Start Shopping"
        onAction={onContinueShopping}
        secondaryCTALabel="Browse Categories"
        onSecondaryAction={onBrowseCategories}
        trustText="Free shipping on orders over $50"
      />
    );
  }
  return <CartContent items={items} />;
}
```

### 10.2 Empty State Patterns by Context

| Context | Icon | Title Pattern | Action |
|---------|------|--------------|--------|
| Cart | `cart-outline` | "Your cart is empty" | "Start Shopping" |
| Search | `search-outline` | "No results found" | "Clear Search" |
| Wishlist | `heart-outline` | "No favorites yet" | "Explore Products" |
| Orders | `receipt-outline` | "No orders yet" | "Start Shopping" |
| Notifications | `notifications-outline` | "All caught up!" | None |
| Wallet | `wallet-outline` | "No transactions" | None |

### 10.3 Custom Empty States

```typescript
function CustomEmptyState() {
  return (
    <EmptyState
      icon="🎁"
      title="No rewards yet"
      subtitle="Complete activities to earn rewards"
      imageSource={require('@/assets/images/empty-rewards.png')}
      actionLabel="View Activities"
      onAction={() => router.push('/activities')}
    />
  );
}
```

---

## 11. Reusable Components to Create

### 11.1 Recommended New Components

Based on gaps in the current design system:

#### High Priority

1. **DataTable**
   - Sortable columns
   - Row selection
   - Pagination
   - Mobile-friendly horizontal scroll

2. **DateRangePicker**
   - Calendar view
   - Preset ranges (Last 7 days, This month, etc.)
   - Mobile-optimized touch targets

3. **Stepper/QuantitySelector**
   - Min/max bounds
   - Step increment
   - Accessibility compliant

4. **SearchBar**
   - Debounced input
   - Clear button
   - Voice input support
   - Recent searches

5. **Avatar**
   - Image with fallback initials
   - Online/offline indicator
   - Group avatar (stacked)

6. **Tabs**
   - Scrollable tabs for many items
   - Underline indicator
   - Badge support

#### Medium Priority

7. **Dropdown/Select**
   - Searchable option
   - Multi-select variant
   - Custom option rendering

8. **ProgressBar/ProgressStepper**
   - Linear and circular variants
   - Labeled steps

9. **Tag/ChipInput**
   - Add/remove tags
   - Autocomplete
   - Predefined suggestions

10. **Tooltip**
    - Hover (web) and long-press (mobile) trigger
    - Positioning logic

#### Lower Priority

11. **TreeView** - Nested data display
12. **Carousel** - Image/data carousel
13. **Pagination** - Page-based navigation
14. **CommandPalette** - Keyboard-navigable menu
15. **HighlightedText** - Search term highlighting

### 11.2 Component Template

```typescript
// components/ui/ComponentName/index.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { spacing, borderRadius, colors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ComponentNameProps {
  // Props with JSDoc
  /**
   * Description of the prop
   */
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
}

/**
 * ComponentName - Brief description
 *
 * @example
 * <ComponentName value="test" onChange={(v) => console.log(v)} />
 */
function ComponentName({
  value,
  onChange,
  disabled = false,
  error,
  style,
}: ComponentNameProps) {
  const { colors: themeColors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        error && { borderColor: themeColors.error },
        style,
      ]}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={value}
      accessibilityState={{ disabled }}
    >
      {/* Content */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Base styles
  },
});

export default React.memo(ComponentName);
export { ComponentName };
```

---

## 12. Design Tokens

### 12.1 Color Palette

```typescript
// Primary - Mustard/Gold
primary = {
  50: '#FFF9E6',  // Lightest
  100: '#FFF3CC',
  200: '#FFE799',
  300: '#FFDB66',
  400: '#FFD433',
  500: '#ffcd57', // Base
  600: '#ffcd57',
  700: '#E6B84E',
  800: '#CCA345',
  900: '#B38F3C', // Darkest
}

// Secondary - Nile Blue
secondary = {
  50: '#E8EEF3',
  100: '#D1DDE7',
  200: '#A3BBCF',
  300: '#7599B7',
  400: '#47779F',
  500: '#2A5577',
  600: '#1a3a52', // Base
  700: '#163148',
  800: '#12283D',
  900: '#0E1F33',
}

// Semantic Colors
error = '#EF4444'
warning = '#FF9F1C'
success = '#2ECC71'
info = '#1a3a52'
coin = '#ffcd57'

// Backgrounds
background = {
  primary: '#FFFFFF',
  secondary: '#faf1e0',
  tertiary: '#dfebf7',
  dark: '#1a3a52',
  accent: '#FFF9E6',
}

// Text
text = {
  primary: '#1a3a52',
  secondary: '#2A5577',
  tertiary: '#9AA7B2',
  inverse: '#FFFFFF',
  disabled: '#D4C9B0',
}
```

### 12.2 Spacing Scale (8px Grid)

```typescript
spacing = {
  xs: 4,      // 0.5x base
  sm: 8,      // 1x base
  md: 12,     // 1.5x base
  base: 16,   // 2x base (default)
  lg: 20,     // 2.5x base
  xl: 24,     // 3x base
  '2xl': 32,  // 4x base
  '3xl': 40,  // 5x base
  '4xl': 48,  // 6x base
  '5xl': 64,  // 8x base
  xxl: 48,    // Alias
  xxxl: 64,   // Alias
}
```

### 12.3 Border Radius

```typescript
borderRadius = {
  none: 0,
  xs: 2,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999,  // Pills/circles
}
```

### 12.4 Shadows

```typescript
shadows = {
  none: { elevation: 0 },
  subtle: { elevation: 1, shadowOpacity: 0.05 },
  medium: { elevation: 4, shadowOpacity: 0.08 },
  strong: { elevation: 8, shadowOpacity: 0.12 },
  // Purple-themed
  purpleSubtle: { elevation: 2, shadowColor: '#ffcd57' },
  purpleMedium: { elevation: 4, shadowOpacity: 0.25 },
  purpleStrong: { elevation: 8, shadowOpacity: 0.3 },
}
```

### 12.5 Timing/Animation

```typescript
timing = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  ripple: 200,
  tooltip: 150,
  modal: 300,
  drawer: 350,
  toast: 250,
  skeleton: 1500,
}

springConfig = {
  default: { damping: 15, stiffness: 150, mass: 1 },
  bouncy: { damping: 10, stiffness: 100, mass: 0.8 },
  smooth: { damping: 20, stiffness: 200, mass: 1 },
}
```

### 12.6 Typography Scale

```typescript
typography = {
  display: { fontSize: 32, lineHeight: 40, weight: 800 },
  h1: { fontSize: 28, lineHeight: 36, weight: 700 },
  h2: { fontSize: 24, lineHeight: 32, weight: 600 },
  h3: { fontSize: 20, lineHeight: 28, weight: 600 },
  h4: { fontSize: 18, lineHeight: 24, weight: 600 },
  bodyLarge: { fontSize: 16, lineHeight: 24, weight: 400 },
  body: { fontSize: 14, lineHeight: 20, weight: 400 },
  bodySmall: { fontSize: 12, lineHeight: 16, weight: 400 },
  label: { fontSize: 14, lineHeight: 20, weight: 600 },
  labelSmall: { fontSize: 12, lineHeight: 16, weight: 600 },
  button: { fontSize: 14, lineHeight: 20, weight: 600 },
  caption: { fontSize: 12, lineHeight: 16, weight: 500 },
  overline: { fontSize: 10, lineHeight: 12, weight: 600 },
}
```

### 12.7 Z-Index Scale

```typescript
zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
}
```

### 12.8 Icon Sizes

```typescript
iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
}
```

---

## 13. Accessibility Patterns

### 13.1 ARIA Labels and Roles

```typescript
// Button
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Add to cart"
  accessibilityHint="Double tap to add this item to your shopping cart"
>
  <Text>Add to Cart</Text>
</Pressable>

// Header
<Text accessibilityRole="header" accessibilityLevel={1}>
  Page Title
</Text>

// Alert/Error
<View accessibilityRole="alert" accessibilityLiveRegion="polite">
  <Text>Error message here</Text>
</View>

// Dialog/Modal
<View
  accessibilityRole="dialog"
  accessibilityLabel="Confirm delete"
  accessibilityViewIsModal={true}
>
  {/* Modal content */}
</View>

// List item
<View accessibilityRole="listitem">
  <Text>Item 1 of 10</Text>
</View>
```

### 13.2 Touch Target Sizes

```typescript
// WCAG 2.1 Level AA - minimum 44x44px touch target
const touchTarget = {
  small: 40,  // Minimum (48 is preferred)
  medium: 48, // Recommended
  large: 56,  // Large buttons
};

// In Button component
const SIZE_CONFIG = {
  small: { height: 48, paddingH: spacing.base },  // ACCESSIBILITY FIX
  medium: { height: 48, paddingH: spacing.lg },  // WCAG 2.1 Level AA
  large: { height: 56, paddingH: spacing.xl },
};
```

### 13.3 Screen Reader Announcements

```typescript
// Announce loading state
<View accessibilityLiveRegion="polite">
  <Text>Loading products...</Text>
</View>

// Announce completion
<View accessibilityLiveRegion="assertive">
  <Text>5 items added to cart</Text>
</View>
```

### 13.4 Focus Management

```typescript
// Auto-focus on mount
const inputRef = useRef<TextInput>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

// Scroll to error
const errorRef = useRef<View>(null);
if (error) {
  errorRef.current?.measure(() => {
    // Scroll to error
  });
}
```

### 13.5 Color Contrast

```typescript
// Ensure 4.5:1 for normal text, 3:1 for large text
// Primary text on white: #1a3a52 on #FFFFFF = 10.2:1 (passes AAA)
// Secondary text on white: #2A5577 on #FFFFFF = 7.2:1 (passes AA)
// Tertiary text on white: #9AA7B2 on #FFFFFF = 3.1:1 (minimum for large text)
```

### 13.6 Skip Links (Web)

```typescript
// For web apps
function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}
```

---

## 14. Performance Patterns

### 14.1 React.memo Usage

```typescript
// Memoize pure components
export default React.memo(Button);
export default React.memo(Card, (prevProps, nextProps) => {
  // Custom comparison - return true if props are equal
  return prevProps.value === nextProps.value;
});
```

### 14.2 useMemo and useCallback

```typescript
function ExpensiveComponent({ data, filter }) {
  // Memoize expensive computations
  const filteredData = useMemo(() => {
    return data.filter(item => item.category === filter);
  }, [data, filter]);

  // Memoize callbacks
  const handlePress = useCallback((id) => {
    navigation.navigate('Details', { id });
  }, [navigation]);

  return <List data={filteredData} onPress={handlePress} />;
}
```

### 14.3 FlatList Optimization

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  // State handlers
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  // Empty state
  ListEmptyComponent={<EmptyState />}
  // Footer
  ListFooterComponent={loading ? <Loader /> : null}
/>
```

### 14.4 Image Optimization

```typescript
import { CachedImage } from '@/components/ui/CachedImage';

// Lazy loading with placeholder
<CachedImage
  source={{ uri: item.imageUrl }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  placeholder={<ShimmerSkeleton variant="rect" />}
  cachePolicy="memory-disk"
/>

// Progressive loading
import { LazyImage } from '@/components/common/LazyImage';
<LazyImage
  source={imageUrl}
  lowQualitySource={thumbnailUrl}
  fullQualitySource={imageUrl}
/>
```

### 14.5 Code Splitting

```typescript
// Dynamic imports
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Route-based splitting with Expo Router
// app/about.tsx - auto-split by Next.js
```

### 14.6 Virtualization

```typescript
// For large lists, use FlashList (Shopify)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
  // Better performance than FlatList
/>
```

### 14.7 Debouncing

```typescript
import { useDebounce } from '@/hooks/useDebounce';
import useDebouncedCallback from 'use-debounce';

function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery);
    }
  }, [debouncedQuery]);
}

// Debounced callback
const debouncedSearch = useDebouncedCallback(
  (text) => searchAPI(text),
  300
);
```

### 14.8 Infinite Scroll Hook

```typescript
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

function ProductList() {
  const { data, loadingMore, hasMore, fetchMore, refresh } = useInfiniteScroll(
    (page, pageSize) => api.getProducts({ page, limit: pageSize }),
    { pageSize: 20, cacheKey: 'products' }
  );

  return (
    <FlatList
      data={data}
      onEndReached={fetchMore}
      onRefresh={refresh}
      ListFooterComponent={loadingMore && <ActivityIndicator />}
    />
  );
}
```

### 14.9 Offline Support

```typescript
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

function OfflineAwareComponent() {
  const { isOnline, queueAction, processQueue } = useOfflineQueue();

  const handleAction = async () => {
    if (!isOnline) {
      queueAction({ type: 'ADD_TO_CART', payload: { itemId, quantity } });
      return;
    }
    await performAction();
  };

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);
}
```

### 14.10 Performance Monitoring

```typescript
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

function TrackedComponent() {
  const { trackRender, trackInteraction } = usePerformanceMetrics('ComponentName');

  useEffect(() => {
    trackRender('mount');
  }, []);

  const handleClick = () => {
    const duration = trackInteraction('click');
    analytics.track('component_click', { duration });
  };

  return <Pressable onPress={handleClick} />;
}
```

---

## Appendix: Quick Reference

### Import Aliases

```typescript
// TypeScript paths configuration
{
  "paths": {
    "@/*": ["./*"],
    "@/components/*": ["./components/*"],
    "@/hooks/*": ["./hooks/*"],
    "@/stores/*": ["./stores/*"],
    "@/contexts/*": ["./contexts/*"],
    "@/constants/*": ["./constants/*"],
    "@/services/*": ["./services/*"],
    "@/types/*": ["./types/*"],
    "@/utils/*": ["./utils/*"]
  }
}
```

### Common Patterns Checklist

- [ ] Import design tokens from `@/constants/theme`
- [ ] Use `useTheme()` for dynamic theming
- [ ] Wrap components in `React.memo()` for pure components
- [ ] Use `StyleSheet.create()` for static styles
- [ ] Implement `accessibilityRole` on interactive elements
- [ ] Handle loading, error, and empty states
- [ ] Use Zustand stores for global state
- [ ] Use React Query for server state
- [ ] Implement proper error boundaries
- [ ] Follow mobile-first responsive design

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-05 | Initial comprehensive training document |

---

*Document generated from codebase analysis. Last updated: 2026-05-05*
