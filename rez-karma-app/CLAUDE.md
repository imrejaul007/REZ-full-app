# CLAUDE.md

Karma web app - consumer-facing interface for the Karma gamification system.

---

## Project Overview

**Version**: 1.0.0 | **Last Updated**: May 2026

### Tech Stack
- Next.js 14 (App Router), TypeScript, TailwindCSS

---

## Build & Test Commands

```bash
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Lint code
npm run type-check # TypeScript check
```

---

## Project Structure

```
rez-karma-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── karma/            # Consumer routes
│   │   │   ├── home/
│   │   │   ├── my-karma/
│   │   │   ├── explore/
│   │   │   ├── event/[id]/
│   │   │   ├── missions/
│   │   │   ├── micro-actions/
│   │   │   ├── leaderboard/
│   │   │   ├── wallet/
│   │   │   ├── scan/
│   │   │   └── communities/
│   │   │       └── [slug]/
│   │   └── admin/            # Admin routes
│   │       ├── index.tsx
│   │       ├── karma-score/
│   │       └── perks/
│   ├── components/
│   │   └── ui/               # Reusable UI components
│   └── lib/                  # Utils, API clients
├── public/
└── package.json
```

---

## Key Pages

### Consumer
| Page | Description |
|------|-------------|
| `/karma/home` | Main hub with karma overview |
| `/karma/my-karma` | Passport & earn history |
| `/karma/explore` | Event listing |
| `/karma/event/[id]` | Event details |
| `/karma/missions` | Available missions |
| `/karma/micro-actions` | Quick actions |
| `/karma/leaderboard` | Rankings |
| `/karma/wallet` | Balance |
| `/karma/scan` | QR scanner |
| `/karma/communities` | Community list |

### Admin
| Page | Description |
|------|-------------|
| `/admin` | Dashboard |
| `/admin/karma-score` | KarmaScore admin |
| `/admin/perks` | Perk management |

---

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://rez-karma-service.onrender.com
NEXT_PUBLIC_AUTH_URL=https://rez-auth-service.onrender.com
```

---

## Brand Colors

| Name | Hex | Use |
|------|-----|-----|
| Primary | `#22C55E` | Impact/Growth |
| Secondary | `#FACC15` | Reward/Value |
| Trust | `#3B82F6` | Trust elements |

---

## Related Services

| Service | URL | Purpose |
|---------|-----|---------|
| rez-karma-service | :3009 | Backend API |
| rez-auth-service | External | Authentication |
| rez-wallet-service | External | Wallet/Balance |

---

## Security Rules

- NEVER commit `.env.local` or secrets
- Use `NEXT_PUBLIC_` prefix only for safe client vars
- Validate API responses before display
- Sanitize user input in forms
