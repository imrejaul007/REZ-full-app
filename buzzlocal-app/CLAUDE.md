# BuzzLocal App

Hyperlocal social + discovery app for the ReZ ecosystem. Users find all local info (events, news, places, offers) and earn ReZ Coins for contributing.

## Screens

| Screen | File | Description |
|--------|------|-------------|
| Home Feed | `app/(main)/index.tsx` | Feed with AI cards, posts, alerts |
| Explore | `app/(main)/explore.tsx` | Search & discover |
| Events | `app/(main)/events.tsx` | Event discovery |
| Vibe Map | `app/(main)/vibe-map.tsx` | Real Mapbox map with crowd heatmap |
| Communities | `app/(main)/communities.tsx` | Area/interest groups |
| QR Check-in | `app/(main)/scan.tsx` | Camera-based check-in |
| Profile | `app/(main)/profile.tsx` | Badges, streaks, stats |
| Creator | `app/creator.tsx` | Creator dashboard |
| Wallet | `app/wallet.tsx` | Coins & transactions |
| Notifications | `app/notifications.tsx` | All notifications |
| Create Post | `app/create.tsx` | 6 post types |

## Tech Stack

- **Framework:** React Native (Expo SDK 53)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **State:** Zustand
- **HTTP:** Axios
- **Maps:** react-native-maps with Mapbox
- **Animations:** react-native-reanimated

## Build Commands

```bash
npm install              # Install dependencies
npx expo prebuild       # Generate native projects
npx expo run:android    # Run on Android
npx expo run:ios        # Run on iOS
npx expo start           # Start Expo DevTools
```

## API Services

| Service | File | Purpose |
|---------|------|---------|
| Auth | `src/services/auth.ts` | Login, OTP |
| Wallet | `src/services/wallet.ts` | Coins, transactions |
| Feed | `src/services/feed.ts` | Posts, feed |
| Events | `src/services/events.ts` | Event discovery |
| Gamification | `src/services/gamification.ts` | Badges, streaks |
| Analytics | `src/services/analytics.ts` | Data collection |

## Backend Services (from `buzzlocal-services/`)

| Service | Port | Purpose |
|---------|------|---------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards |
| buzzlocal-vibe-service | 4003 | Check-ins, Vibe Map |
| buzzlocal-community-service | 4004 | Communities |
| z-events-service | 4008 | Events, ticketing |

## Reused from RABTUL

| Service | Purpose |
|---------|---------|
| `rez-auth-service` | Login, OTP |
| `rez-wallet-service` | Coins, transactions |
| `rez-gamification-service` | Badges, streaks |

## Data Collection

All user actions are tracked and sent to ReZ Mind for AI training:

```
check_in, check_out, post_view, post_like, post_save
event_view, event_rsvp, offer_view, community_join
```

## State Management

Uses Zustand stores in `src/store/`:
- `authStore` - User, auth state
- `feedStore` - Feed items, post actions
- `locationStore` - Location, nearby areas
- `gamificationStore` - Badges, streaks, leaderboards
- `walletStore` - Balance, transactions

## Theme

Colors, spacing, typography in `constants/theme.ts`.

## Security

- NEVER commit `.env` files
- Store tokens in SecureStore
- Validate all API responses
- Sanitize user inputs
- Verify all auth tokens

## Related

- [buzzlocal-services](../buzzlocal-services/) - Backend services
- [REZ-Consumer](../REZ-Consumer/) - Main consumer app
- [RABTUL-Technologies](../RABTUL-Technologies/) - Other services
