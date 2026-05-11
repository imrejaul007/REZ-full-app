# Do — Premium Apple Design System
**Version:** 1.0  
**Date:** May 4, 2026  
**Status:** Production Ready

---

# Design Philosophy

## Apple-Inspired Principles

| Principle | Application |
|-----------|-------------|
| **Clarity** | Typography does the heavy lifting |
| **Depth** | Layers, blur, shadows create hierarchy |
| **Space** | Generous whitespace, breathing room |
| **Motion** | Fluid, physics-based animations |
| **Touch** | Large targets, haptic feedback |

---

# Typography System

## Font Stack

```typescript
// Primary: SF Pro Display (fallback to system)
const fontFamily = {
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
  text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
  mono: '"SF Mono", "JetBrains Mono", Menlo, monospace',
};
```

## Type Scale (Apple-Inspired)

```typescript
const typography = {
  // Display - Hero sections
  displayLarge: {
    fontSize: 34,
    fontWeight: 700,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  displaySmall: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 28,
    letterSpacing: 0.35,
  },

  // Title - Section headers
  titleLarge: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  titleSmall: {
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 22,
    letterSpacing: 0.38,
  },

  // Body - Content
  bodyLarge: {
    fontSize: 17,
    fontWeight: 400,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 18,
    letterSpacing: -0.08,
  },

  // Caption - Labels
  captionLarge: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 16,
    letterSpacing: 0,
  },
  captionMedium: {
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
  captionSmall: {
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 13,
    letterSpacing: 0.1,
  },

  // Button
  buttonLarge: {
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  buttonMedium: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
};
```

---

# Color System

## Light Mode (Primary)

```typescript
const lightColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#FFFFFF',
  backgroundGrouped: '#F2F2F7',
  backgroundGroupedSecondary: '#FFFFFF',

  // Fill
  fill: 'rgba(120, 120, 128, 0.2)',
  fillSecondary: 'rgba(120, 120, 128, 0.16)',
  fillTertiary: 'rgba(120, 120, 128, 0.12)',

  // Label
  label: '#000000',
  labelSecondary: '#3C3C43',
  labelTertiary: '#3C3C43',
  labelQuaternary: '#3C3C43',

  // Separator
  separator: 'rgba(60, 60, 67, 0.29)',
  separatorOpaque: '#C6C6C8',

  // System
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D55',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',

  // Gray
  gray: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',

  // White
  white: '#FFFFFF',
  black: '#000000',
};
```

## Dark Mode

```typescript
const darkColors = {
  // Backgrounds
  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  backgroundGrouped: '#000000',
  backgroundGroupedSecondary: '#1C1C1E',

  // Fill
  fill: 'rgba(120, 120, 128, 0.36)',
  fillSecondary: 'rgba(120, 120, 128, 0.32)',
  fillTertiary: 'rgba(120, 120, 128, 0.24)',

  // Label
  label: '#FFFFFF',
  labelSecondary: '#EBEBF5',
  labelTertiary: '#EBEBF5',
  labelQuaternary: '#EBEBF5',

  // Separator
  separator: 'rgba(84, 84, 88, 0.65)',
  separatorOpaque: '#38383A',

  // System (same as light)
  systemBlue: '#0A84FF',
  systemGreen: '#30D158',
  systemIndigo: '#5E5CE6',
  systemOrange: '#FF9F0A',
  systemPink: '#FF375F',
  systemPurple: '#BF5AF2',
  systemRed: '#FF453A',
  systemTeal: '#64D2FF',
  systemYellow: '#FFD60A',

  // Gray
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',

  // White
  white: '#FFFFFF',
  black: '#000000',
};
```

## Do Brand Colors

```typescript
const brandColors = {
  // Primary Purple
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryContrast: '#FFFFFF',

  // Accent Orange
  accent: '#F97316',
  accentLight: '#FB923C',
  accentContrast: '#FFFFFF',

  // Gold (Rewards)
  gold: '#FBBF24',
  goldLight: '#FCD34D',
  goldDark: '#D97706',

  // Karma Tiers
  karma: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FBBF24',
    platinum: '#E5E4E2',
  },
};
```

---

# Spacing System (8pt Grid)

```typescript
const spacing = {
  // Base unit: 4
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  16: 64,
  20: 80,
  24: 96,

  // Semantic
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Layout
  screenPadding: 16,
  cardPadding: 16,
  sectionSpacing: 24,
  listItemHeight: 44,
  buttonHeight: 50,
  tabBarHeight: 83,
  headerHeight: 44,
};
```

---

# Border Radius

```typescript
const borderRadius = {
  // Small
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,

  // Medium
  lg: 16,
  xl: 20,

  // Large
  2xl: 24,
  3xl: 28,

  // Full
  full: 9999,

  // Components
  button: 12,
  card: 16,
  modal: 20,
  sheet: 28,
  input: 10,
};
```

---

# Shadows (iOS Style)

```typescript
const shadows = {
  // None
  none: {},

  // Small - Cards
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Medium - Elevated cards
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Large - Modals
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },

  // Blur effect (simulated with opacity)
  blur: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },

  // Inner shadow (for pressed states)
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 0,
  },
};
```

---

# Component Specifications

## Button

### Primary Button
```typescript
const primaryButton = {
  // Default
  backgroundColor: '#7C3AED',
  borderRadius: 12,
  height: 50,
  paddingHorizontal: 24,
  alignItems: 'center',
  justifyContent: 'center',

  // Text
  fontSize: 17,
  fontWeight: 600,
  color: '#FFFFFF',

  // Pressed
  pressed: {
    opacity: 0.8,
    scale: 0.98,
  },

  // Disabled
  disabled: {
    opacity: 0.5,
  },

  // Loading
  loading: {
    opacity: 0.8,
  },
};
```

### Secondary Button
```typescript
const secondaryButton = {
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderColor: '#7C3AED',
  borderRadius: 12,
  height: 50,
  paddingHorizontal: 24,
  alignItems: 'center',
  justifyContent: 'center',

  fontSize: 17,
  fontWeight: 600,
  color: '#7C3AED',
};
```

### Destructive Button
```typescript
const destructiveButton = {
  backgroundColor: '#FF3B30',
  borderRadius: 12,
  height: 50,
  paddingHorizontal: 24,

  fontSize: 17,
  fontWeight: 600,
  color: '#FFFFFF',
};
```

## Card

### Standard Card
```typescript
const card = {
  backgroundColor: '#FFFFFF', // or dark: '#1C1C1E'
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 16,
  marginVertical: 8,

  // Shadow (iOS style)
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
};
```

### Elevated Card (on dark bg)
```typescript
const elevatedCard = {
  backgroundColor: '#1C1C1E',
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 16,
  marginVertical: 8,

  // Subtle inner glow
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
};
```

## Input Field

```typescript
const inputField = {
  // Container
  container: {
    backgroundColor: '#F2F2F7', // Light: gray6, Dark: gray5
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },

  // Focused
  focused: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },

  // Text
  text: {
    flex: 1,
    fontSize: 17,
    color: '#000000', // or dark: '#FFFFFF'
  },

  // Placeholder
  placeholder: {
    color: '#8E8E93',
  },
};
```

## Tab Bar

```typescript
const tabBar = {
  // Container
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 83, // + safe area
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.3)',

    // iOS specific
    paddingBottom: 34, // Safe area bottom
  },

  // Item
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },

  // Icon
  icon: {
    width: 28,
    height: 28,
  },

  // Label
  label: {
    fontSize: 10,
    fontWeight: 500,
    marginTop: 2,
  },

  // Active
  active: {
    color: '#7C3AED',
  },

  // Inactive
  inactive: {
    color: '#8E8E93',
  },
};
```

## Navigation Bar

```typescript
const navigationBar = {
  // Container
  container: {
    height: 44,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,

    // Large title
    largeTitle: {
      height: 96,
      backgroundColor: 'transparent',
    },
  },

  // Title
  title: {
    fontSize: 17,
    fontWeight: 600,
    color: '#000000', // or dark: '#FFFFFF'
    textAlign: 'center',
  },

  // Large title
  largeTitle: {
    fontSize: 34,
    fontWeight: 700,
    color: '#000000',
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
  },

  backButtonText: {
    fontSize: 17,
    color: '#7C3AED',
    marginLeft: -4,
  },
};
```

---

# Motion & Animation

## Timing

```typescript
const timing = {
  // Micro-interactions
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,

  // Transitions
  enter: 350,
  exit: 250,

  // Loading
  pulse: 1000,
  shimmer: 1500,

  // Celebration
  bounce: 600,
  confetti: 2000,
};
```

## Spring Configs

```typescript
const springs = {
  // Default - Natural feel
  default: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },

  // Bouncy - Playful elements
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 0.8,
  },

  // Gentle - Subtle movements
  gentle: {
    damping: 30,
    stiffness: 400,
    mass: 1,
  },

  // Snappy - UI feedback
  snappy: {
    damping: 25,
    stiffness: 500,
    mass: 0.6,
  },
};
```

## Standard Animations

### Fade In
```typescript
const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: 200,
  easing: 'ease-out',
};
```

### Slide Up
```typescript
const slideUp = {
  from: { transform: [{ translateY: 20 }], opacity: 0 },
  to: { transform: [{ translateY: 0 }], opacity: 1 },
  duration: 350,
  easing: springs.default,
};
```

### Scale Spring
```typescript
const scaleSpring = {
  from: { transform: [{ scale: 0.9 }], opacity: 0 },
  to: { transform: [{ scale: 1 }], opacity: 1 },
  config: springs.bouncy,
};
```

### Button Press
```typescript
const buttonPress = {
  active: {
    transform: [{ scale: 0.97 }],
    duration: 100,
  },
  release: {
    config: springs.snappy,
  },
};
```

---

# Haptic Feedback

```typescript
const haptics = {
  // Selection - Light tap
  selection: 'selection',

  // Impact - Different weights
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  impactHeavy: 'impactHeavy',

  // Notification - Success/Error/Warning
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
};
```

---

# Gestures

## Touch Target Size

```typescript
const touchTarget = {
  minimum: 44,
  recommended: 48,
  comfortable: 56,
};
```

## Swipe Gestures

```typescript
const swipeGestures = {
  // Horizontal swipe (navigation)
  horizontal: {
    threshold: 50,
    velocityThreshold: 500,
  },

  // Vertical swipe (dismiss)
  vertical: {
    threshold: 100,
    velocityThreshold: 500,
  },

  // Long press
  longPress: {
    duration: 500,
  },
};
```

---

# Accessibility

## Dynamic Type

```typescript
const accessibility = {
  // Support for larger text sizes
  dynamicType: true,

  // Minimum contrast ratios
  contrast: {
    normal: 4.5, // WCAG AA
    large: 3.0,  // WCAG AA for large text
  },

  // Reduce motion
  reduceMotion: {
    // Disable animations when enabled
    transform: [{ scale: 1 }],
    opacity: 1,
  },
};
```

---

# Dark Mode Implementation

```typescript
// useColorScheme hook
const colorScheme = useColorScheme(); // 'light' | 'dark'

// Theme provider
const colors = colorScheme === 'dark' ? darkColors : lightColors;

// Automatic switching
const useTheme = () => {
  const colorScheme = useColorScheme();
  return {
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    isDark: colorScheme === 'dark',
  };
};
```

---

# Implementation Guide

## Theme Provider

```typescript
// context/ThemeContext.tsx
import React, { createContext, useContext } from 'react';

const lightTheme = { /* ... */ };
const darkTheme = { /* ... */ };

const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
});

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark: colorScheme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

## Color Usage

```typescript
// Always use semantic naming
const Component = ({ style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.label }]}>
        Content
      </Text>
    </View>
  );
};
```

---

# iOS-Specific Considerations

## Safe Areas

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeContainer = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }}>
      {children}
    </View>
  );
};
```

## Notch Handling

```typescript
// Use SafeAreaView instead of View for top-level containers
import { SafeAreaView } from 'react-native';

const Screen = () => (
  <SafeAreaView style={styles.container}>
    {/* Content */}
  </SafeAreaView>
);
```

## Keyboard Handling

```typescript
// KeyboardAvoidingView with proper behavior
const KeyboardAwareContainer = ({ children }) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1 }}
  >
    {children}
  </KeyboardAvoidingView>
);
```

---

**End of Design System**
