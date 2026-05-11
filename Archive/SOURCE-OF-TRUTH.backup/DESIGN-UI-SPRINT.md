# ReZ UI Sprint Documentation
**Sprint Date**: 2026-05-04
**Status**: Active Sprint
**Team Lead**: UI Team

---

## 1. Design System Documentation

### 1.1 Brand Tokens Package: `@rez/brand-tokens`

**Location**: `/packages/rez-brand-tokens`

**Canonical Source**: `rez-app-consumer/constants/theme.ts`

The brand tokens package re-exports all design tokens from the canonical source for use across web and mobile applications.

#### Color Variables

```typescript
// Primary Mustard Palette
primary: {
  50: '#FFF9E6',
  100: '#FFF3CC',
  200: '#FFE799',
  300: '#FFDB66',
  400: '#FFD433',
  500: '#ffcd57',  // Main
  600: '#ffcd57',
  700: '#E6B84E',
  800: '#CCA345',
  900: '#B38F3C',
}

// Secondary Nile Blue Palette
secondary: {
  50: '#E8EEF3',
  100: '#D1DDE7',
  200: '#A3BBCF',
  300: '#7599B7',
  400: '#47779F',
  500: '#2A5577',
  600: '#1a3a52',  // Main
  700: '#163148',
  800: '#12283D',
  900: '#0E1F33',
}

// Neutral Grays
gray: {
  50: '#faf1e0',
  100: '#F5ECD8',
  200: '#E8DCC4',
  300: '#D4C9B0',
  400: '#9AA7B2',
  500: '#829AB1',
  600: '#627D98',
  700: '#486581',
  800: '#334E68',
  900: '#1a3a52',
}

// Semantic Colors
error: '#EF4444'
warning: '#FF9F1C'
success: '#2ECC71'
info: '#1a3a52'

// Brand Shortcuts
nileBlue: '#1a3a52'
lightMustard: '#ffcd57'
linen: '#faf1e0'
lightPeach: '#ffd7b5'
lavenderMist: '#dfebf7'
gold: '#ffcd57'
```

#### Tailwind Integration

The `tailwind-plugin.js` provides CSS classes for web applications:

```javascript
// Usage in tailwind.config.js
const rezBrandTokens = require('@rez/brand-tokens/tailwind-plugin');

module.exports = {
  plugins: [rezBrandTokens],
};
```

**Available CSS Classes**:
- `.glass` - Glassmorphism effect (white 70% opacity, blur 10px)
- `.glass-dark` - Dark glassmorphism (nile blue 30% opacity, blur 20px)
- `.text-gradient` - Gradient text effect
- `.focus-ring` - Focus ring for accessibility

#### Brand Color Palette

| Name | Hex Code | Usage |
|------|----------|-------|
| Nile Blue | `#1a3a52` | Primary dark, headers, text |
| Light Mustard | `#ffcd57` | Primary accent, CTAs, highlights |
| Linen | `#faf1e0` | Light backgrounds |
| Light Peach | `#ffd7b5` | Secondary accent |
| Lavender Mist | `#dfebf7` | Tertiary accent, info backgrounds |

---

## 2. Component Library Status

### 2.1 Consumer App Components

**Location**: `rez-app-consumer/components/ui/`

| Component | Status | File |
|-----------|--------|------|
| Button | Complete | `Button.tsx`, `PrimaryButton.tsx`, `AnimatedButton.tsx` |
| Card | Complete | `Card.tsx`, `GlassCard.tsx` |
| Input | Complete | `Input.tsx` |
| Badge | Complete | `Badge.tsx` |
| Chip | Complete | `Chip.tsx` |
| Toast | Complete | `Toast.tsx` |
| Modal | Complete | (in shared packages) |
| Divider | Complete | `Divider.tsx` |
| Text | Complete | `Text.tsx` |
| Icon | Complete | `IconSymbol.tsx` |
| Image | Complete | `CachedImage.tsx` |
| EmptyState | Complete | `EmptyState.tsx` |
| List | Complete | (in shared packages) |
| TabBar | Complete | `TabBarBackground.tsx` |
| Skeleton | Complete | `ShimmerSkeleton.tsx` |

### 2.2 Merchant App Components

**Location**: `rez-app-merchant/components/ui/`

| Component | Status | Notes |
|-----------|--------|-------|
| Button | Complete | Uses shared components |
| Card | Complete | Dashboard cards, analytics cards |
| Input | Complete | Forms and filters |
| Badge | Complete | Status indicators |
| Charts | Complete | Analytics visualizations |
| Forms | Complete | Input components, selectors |
| Layout | Complete | Navigation, headers |
| Notifications | Complete | Alert components |

### 2.3 Shared UI Package

**Location**: `packages/rez-ui/`

| Component | Status | File |
|-----------|--------|------|
| Button | Complete | `Button.js` |
| Card | Complete | `Card.js` |
| Input | Complete | `Input.js` |
| List | Complete | `List.js` |
| Modal | Complete | `Modal.js` |

---

## 3. Screen Completion Status

### 3.1 Consumer App (rez-app-consumer)

**Total Files**: 657 TypeScript/TSX files

#### Main Navigation Screens

| Screen | Status | Location |
|--------|--------|----------|
| Home | Complete | `app/_layout.tsx`, `components/home/` |
| Explore | Complete | `components/explore/` |
| Offers | Complete | `app/CardOffersPage.tsx`, `components/offers/` |
| Wallet | Complete | `app/wallet-screen.tsx`, `components/wallet/` |
| Profile | Complete | `components/profile/` |
| Search | Complete | `components/search/` |

#### Feature Screens

| Category | Screens | Status |
|----------|---------|--------|
| Store | MainStorePage, StoreListPage, StoreProductsPage, StoreSearchPage | Complete |
| Product | ProductPage, ProductDetail | Complete |
| Cart | Cart flow, CartPage | Complete |
| Checkout | CheckoutPage, Payment flow | Complete |
| Orders | OrderHistory, OrderDetails | Complete |
| Booking | BookingsPage, BookingDetails | Complete |
| Events | EventPage, EventDetails | Complete |
| Travel | Flight, Bus, Train, Hotel | Complete |
| Food | FoodDining, HomeDelivery | Complete |
| Mall | MallPages | Complete |
| Rewards | EarnPage, RewardsPage | Complete |
| Vouchers | VoucherPages | Complete |
| Reviews | ReviewPage, WriteReviewModal | Complete |
| Wallet | WalletScreen, TransactionHistory | Complete |
| Gamification | Challenges, ScratchCard, DailyCheckin | Complete |
| AI Chat | AIChatBubble | Complete |
| Profile | ProfilePages, Settings | Complete |
| Onboarding | Onboarding flow | Complete |

#### Category Pages

| Category | Status |
|----------|--------|
| Food & Dining | Complete |
| Fashion | Complete |
| Electronics | Complete |
| Travel | Complete |
| Financial | Complete |
| Education | Complete |
| Fitness | Complete |
| Healthcare | Complete |
| Beauty | Complete |
| Entertainment | Complete |
| Grocery | Complete |
| Home Services | Complete |

### 3.2 Merchant App (rez-app-merchant)

**Total Files**: 381 TypeScript/TSX files

#### Dashboard & Analytics

| Screen | Status |
|--------|--------|
| Dashboard | Complete |
| Analytics | Complete |
| Reports | Complete |

#### Store Management

| Screen | Status |
|--------|--------|
| Store List | Complete |
| Store Details | Complete |
| Product Management | Complete |
| Inventory | Complete |

#### Orders & Transactions

| Screen | Status |
|--------|--------|
| Order List | Complete |
| Order Details | Complete |
| Transaction History | Complete |

#### Promotions

| Screen | Status |
|--------|--------|
| Offers | Complete |
| Promotions | Complete |
| Campaigns | Complete |

#### Team Management

| Screen | Status |
|--------|--------|
| Team List | Complete |
| Permissions | Complete |
| Schedules | Complete |

#### Onboarding

| Screen | Status |
|--------|--------|
| Onboarding V2 | Complete |

---

## 4. Responsive Design Breakpoints

### 4.1 Breakpoint Definitions

| Breakpoint | Min Width | Max Width | Target Devices |
|------------|-----------|-----------|----------------|
| Mobile | 320px | 767px | iPhone SE, standard phones |
| Large Mobile | 375px | 429px | iPhone Pro/Plus |
| Tablet | 768px | 1023px | iPad Mini, iPad |
| Desktop | 1024px | 1439px | Laptops, small monitors |
| Large Desktop | 1440px+ | - | Desktop monitors |

### 4.2 Touch Target Requirements

| Element | Minimum Size | Standard |
|---------|--------------|----------|
| Buttons | 44x44px | iOS HIG |
| Tappable areas | 48x48px | Material Design |
| Form inputs | 44px height | iOS HIG |
| List items | 44px min height | Accessibility |

### 4.3 Typography Scaling

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| H1 | 28px | 32px | 36px |
| H2 | 24px | 28px | 32px |
| H3 | 20px | 24px | 28px |
| Body | 16px | 16px | 16px |
| Caption | 14px | 14px | 14px |
| Small | 12px | 12px | 12px |

### 4.4 Image Responsiveness

| Context | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hero images | 100vw | 768px max | 1024px max |
| Card images | 160px | 200px | 240px |
| Thumbnails | 80px | 100px | 120px |
| Avatars | 40px | 48px | 56px |

---

## 5. Design System Usage Guidelines

### 5.1 Import Pattern (React Native)

```typescript
import { colors, spacing, typography } from '../constants/theme';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
```

### 5.2 Import Pattern (Web)

```typescript
import { colors, spacing } from '@rez/brand-tokens';

// Or use Tailwind classes
<div className="bg-nileBlue text-mustard" />
```

### 5.3 Color Usage

| Color | Usage |
|-------|-------|
| `primary.500` | Primary buttons, links, active states |
| `secondary.600` | Headers, important text, backgrounds |
| `gray.50-100` | Light backgrounds, cards |
| `gray.800-900` | Body text, secondary text |
| `error` | Error states, destructive actions |
| `success` | Success states, positive feedback |
| `warning` | Warning states, caution |

### 5.4 Spacing Scale

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};
```

---

## 6. Accessibility Requirements

### 6.1 Color Contrast

| Element | Minimum Ratio | WCAG Level |
|---------|---------------|------------|
| Normal text | 4.5:1 | AA |
| Large text | 3:1 | AA |
| UI components | 3:1 | AA |
| Focus indicators | 3:1 | AA |

### 6.2 Focus Management

- All interactive elements must be focusable
- Focus order must be logical
- Focus must be visible (use `.focus-ring`)
- Focus must not be trapped unexpectedly

### 6.3 Screen Reader Support

- All images must have alt text
- Buttons must have accessible labels
- Form inputs must have associated labels
- Live regions for dynamic content

---

## 7. Sprint Tasks

### 7.1 Priority 1: Design System Documentation

- [ ] Create usage guide for @rez/brand-tokens
- [ ] Document all color variables with examples
- [ ] Add migration guide for legacy imports
- [ ] Create Storybook stories for components

### 7.2 Priority 2: Screen Verification

- [ ] Verify all 200+ Consumer App screens
- [ ] Fix any UI inconsistencies found
- [ ] Add missing loading/error states
- [ ] Verify all 78 Merchant App screens
- [ ] Fix responsive issues

### 7.3 Priority 3: Responsive Audit

- [ ] Audit mobile breakpoint compliance
- [ ] Audit tablet breakpoint compliance
- [ ] Fix touch target violations
- [ ] Fix typography scaling issues
- [ ] Fix image responsiveness

---

## 8. File Structure Reference

```
/packages/
  /rez-brand-tokens/        # Web design tokens
    /src/
      index.ts
    tailwind-plugin.js
  /rez-ui/                 # Shared UI components
    /dist/

/rez-app-consumer/
  /components/
    /ui/                   # UI components
    /home/                 # Home feature
    /wallet/               # Wallet feature
    ...
  /constants/
    theme.ts               # CANONICAL SOURCE OF TRUTH
  /app/                    # App routes

/rez-app-merchant/
  /components/
    /ui/                   # UI components
    /dashboard/            # Dashboard feature
    ...
  /app/                    # App routes

/SOURCE-OF-TRUTH/
  DESIGN-UI-SPRINT.md      # This document
```

---

## 9. Team Assignments

| Role | Count | Assignment |
|------|-------|------------|
| Senior Mobile UI Designer | 2 | Consumer App, Merchant App |
| Mid Mobile UI Designer | 3 | Screen verification, responsive fixes |
| Senior Web UI Designer | 2 | Web apps, brand tokens |
| Mid Web UI Designer | 3 | Documentation, Storybook |
| Motion Designer | 1 | Animations, transitions |

---

**Last Updated**: 2026-05-04 01:20
**Document Owner**: UI Team Lead
**Next Review**: 2026-05-05
