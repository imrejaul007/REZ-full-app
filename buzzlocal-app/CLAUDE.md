# BuzzLocal App

Hyperlocal social + discovery app for the ReZ ecosystem. Users find all local info (events, news, places, offers) and earn ReZ Coins for contributing.

## Tech Stack

- **Framework**: React Native (Expo SDK 53)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **State**: Zustand
- **HTTP**: Axios
- **Maps**: react-native-maps
- **Animations**: react-native-reanimated

## Project Structure

```
buzzlocal-app/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Onboarding screens
│   ├── (main)/            # Main app screens
│   ├── _layout.tsx        # Root layout
│   ├── create.tsx         # Create post
│   ├── creator.tsx         # Creator dashboard
│   ├── search.tsx         # Search
│   └── wallet.tsx          # Wallet
│
├── src/
│   ├── components/        # UI components
│   │   ├── ui/           # Base components
│   │   └── feed/         # Feed components
│   ├── services/          # API services
│   │   ├── api.ts        # Axios instances
│   │   ├── auth.ts       # Auth service
│   │   ├── wallet.ts     # Wallet service
│   │   ├── feed.ts       # Feed service
│   │   ├── gamification.ts
│   │   └── analytics.ts  # Data collection
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
│
├── constants/             # Theme, config
└── SPEC.md               # Full specification
```

## Build Commands

```bash
npm install              # Install dependencies
npx expo prebuild       # Generate native projects
npx expo run:android    # Run on Android
npx expo run:ios        # Run on iOS
npx expo start          # Start Expo DevTools
```

## RABTUL Services Used

| Service | Purpose |
|---------|---------|
| `rez-auth-service` | Login, OTP, accounts |
| `rez-wallet-service` | ReZ Coins, transactions |
| `rez-gamification-service` | Badges, streaks |
| `rez-creator-earnings-service` | Creator payouts |

## Data Collection

All user actions are tracked and sent to:
- `rez-analytics-service` - Event tracking
- `rez-mind` - AI training data

Key signals collected:
- Location & movement (check-ins, searches)
- Intent (searches, saves, views)
- Commerce (offer views, redemptions)
- Social (follows, shares)

## Design System

Colors, spacing, and typography defined in `constants/theme.ts`.

See `SPEC.md` for full design system documentation.

## Security

- Never commit `.env` files
- Store tokens in SecureStore
- Validate all API responses
- Sanitize user inputs

## Related

- [REZ-Consumer](../REZ-Consumer/) - Main consumer app
- [rez-karma-mobile](../rez-karma-mobile/) - Gamification app
- [RABTUL-Technologies](../RABTUL-Technologies/) - Backend services
