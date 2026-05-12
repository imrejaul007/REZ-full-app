# BuzzLocal App

**Hyperlocal Social + Discovery App for the ReZ Ecosystem**

Users find all local information (events, news, places, offers) and earn ReZ Coins for contributing. Every action trains the AI.

---

## Quick Start

```bash
# Install dependencies
npm install

# Generate native projects
npx expo prebuild

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Start Expo DevTools
npm start
```

---

## Screens

| Screen | File | Description |
|--------|------|-------------|
| Home Feed | `app/(main)/index.tsx` | Feed with AI cards, posts, alerts |
| Explore | `app/(main)/explore.tsx` | Search & discover |
| Events | `app/(main)/events.tsx` | Event discovery |
| Event Detail | `app/event/[id].tsx` | Event details, RSVP, tickets |
| Create Event | `app/create-event.tsx` | Create new event |
| Vibe Map | `app/(main)/vibe-map.tsx` | Mapbox map with crowd heatmap |
| Communities | `app/(main)/communities.tsx` | Area/interest groups |
| Community Detail | `app/community/[id].tsx` | Community posts, members |
| Create Community | `app/create-community.tsx` | Create new community |
| QR Check-in | `app/(main)/scan.tsx` | Camera-based check-in |
| Profile | `app/(main)/profile.tsx` | Badges, streaks, stats |
| Creator Dashboard | `app/creator.tsx` | Creator analytics & earnings |
| Wallet | `app/wallet.tsx` | Coins & transactions |
| Notifications | `app/notifications.tsx` | All notifications |
| Create Post | `app/create.tsx` | 6 post types |
| Search | `app/search.tsx` | Global search |

---

## Navigation

```
├── (auth)
│   └── Onboarding Flow
│       ├── Splash
│       ├── Interests
│       ├── Location
│       └── Connect Account
│
└── (main) - Bottom Tab Navigator
    ├── Home (Feed)
    ├── Explore
    ├── Events
    ├── Vibe Map
    └── Community
        ├── Wallet
        ├── Notifications
        └── Creator Dashboard
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native (Expo SDK 53) |
| Language | TypeScript |
| Navigation | Expo Router |
| State | Zustand |
| HTTP Client | Axios |
| Maps | react-native-maps + Mapbox |
| Animations | react-native-reanimated |
| Icons | @expo/vector-icons |
| Storage | AsyncStorage, SecureStore |
| Notifications | expo-notifications |

---

## Services

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Check-ins, Vibe Map |
| buzzlocal-community-service | 4004 | Communities |
| z-events-service | 4008 | Events, ticketing |
| buzzlocal-intelligence-service | 4010 | AI, REZ Mind |
| buzzlocal-notification-service | 4011 | Push notifications |
| buzzlocal-realtime-service | 4012 | WebSocket |
| buzzlocal-payment-service | 4013 | Payments |

---

## API Services

| Service | File | Purpose |
|---------|------|---------|
| auth | `src/services/auth.ts` | Login, OTP |
| wallet | `src/services/wallet.ts` | Coins, transactions |
| feed | `src/services/feed.ts` | Posts, feed |
| events | `src/services/events.ts` | Event discovery |
| notifications | `src/services/notifications.ts` | Push notifications |
| gamification | `src/services/gamification.ts` | Badges, streaks |
| analytics | `src/services/analytics.ts` | Data collection |

---

## Environment Variables

```env
# API URLs
EXPO_PUBLIC_API_URL=https://api.rezapp.io
EXPO_PUBLIC_AUTH_URL=https://rez-auth-service.onrender.com
EXPO_PUBLIC_WALLET_URL=https://rez-wallet-service.onrender.com
EXPO_PUBLIC_FEED_URL=http://localhost:4000
EXPO_PUBLIC_EVENTS_URL=http://localhost:4008
EXPO_PUBLIC_INTELLIGENCE_URL=http://localhost:4010

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=

# Expo
EXPO_PUBLIC_PROJECT_ID=
```

---

## Features

### Post Types
- **General** - Text, media, location, tags
- **Event** - Title, date, time, venue
- **Alert** - Category, location, severity
- **Place** - Name, category, photos
- **Deal** - Title, discount, expiry
- **Poll** - Question, options

### Coin Rewards
| Action | Coins |
|--------|-------|
| General Post | +20 |
| Event Post | +50 |
| Alert Post | +40 |
| Place Discovery | +30 |
| Deal Posted | +25 |
| Poll Created | +15 |
| Media Attached | +10 bonus |
| Check-in | +25 |
| Event Ticket | +10 |

### Data Collection
All user actions are tracked to REZ Mind:
```
check_in, check_out, post_view, post_like
event_view, event_rsvp, community_join
offer_view, coin_earn, coin_spend
```

---

## Related

- [buzzlocal-services](../buzzlocal-services/) - Backend services
- [REZ-Intelligence](../REZ-Intelligence/) - AI platform
