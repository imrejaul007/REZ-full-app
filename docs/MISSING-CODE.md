# Missing Code Report

Generated: 2026-05-03

---

## TODO Comments (132 total)

### Priority TODOs (requiring action):

| File | Line | Description |
|------|------|-------------|
| `rez-now/app/api/notifications/whatsapp/route.ts` | 139 | `TODO: Update message status in database` |
| `rez-now/hooks/usePushNotifications.ts` | 67 | `TODO: Send token to your backend` |
| `rez-app-merchant/app/pos/index.tsx` | 496 | `TODO: wire up to customer search API` |
| `rez-app-consumer/types/referral.types.ts` | 8 | `TODO: Replace hardcoded REFERRAL_TIERS with a hook (useReferralTiers)` |
| `rez-app-consumer/contexts/SocketContext.tsx` | 389 | `TODO: Backend team — ensure product_created socket event is emitted` |
| `rez-app-consumer/app/grocery/[category].tsx` | 511 | `TODO: use real rating from API` |
| `rez-app-consumer/utils/authStorage.ts` | 13 | `TODO: Gate localStorage reads/writes behind Platform.OS check` |
| `rez-app-merchant/services/offlinePOSQueue.ts` | 111 | `TODO (120): For full encryption at rest, use expo-sqlite with SQLCipher` |

### TypeScript Enhancement TODOs:

| File | Line | Description |
|------|------|-------------|
| `rez-app-merchant/components/ui/ThemeProvider.tsx` | 22 | `TODO (TS-L2 / TS-H5): When shared extraction lands, unify to a single` |

### Informational TODOs (placeholders for IDs/formatting - not actionable):

- Various `XXXX` patterns for gift card codes, phone numbers, GA tracking IDs
- `RZ-ROOM-XXXX` and `RZ-XXXXXX` QR code format comments
- Order number pattern `ORD-XXXXXXXX` documentation

---

## Empty Files

**No empty TypeScript files found.**

---

## Not Implemented Errors

| File | Line | Description |
|------|------|-------------|
| `rez-merchant-integrations/src/services/aggregators/channelManager.ts` | 53 | `throw new Error('Not implemented');` |
| `rez-merchant-integrations/src/services/aggregators/channelManager.ts` | 57 | `throw new Error('Not implemented');` |
| `rez-merchant-integrations/src/services/aggregators/channelManager.ts` | 61 | `throw new Error('Not implemented');` |
| `rez-merchant-integrations/src/services/aggregators/channelManager.ts` | 65 | `throw new Error('Not implemented');` |

---

## Missing Integrations (MISS markers)

| File | Line | Description |
|------|------|-------------|
| `rez-app-merchant/types/socket.ts` | 115 | `MISS-01/03: Refund events from payment-service via monolith Socket.IO` |
| `rez-app-merchant/types/socket.ts` | 127 | `MISS-02: Settlement credited event from wallet-service via monolith Socket.IO` |
| `rez-app-merchant/services/api/socket.ts` | 426 | `MISS-01/03: Refund events from payment-service via monolith Socket.IO` |
| `rez-app-merchant/services/api/socket.ts` | 445 | `MISS-02: Settlement credited event from wallet-service via monolith Socket.IO` |

---

## Placeholder/Hardcoded Values

### Environment Variables with Defaults:
- `APPLE_TEAM_ID` in `rez-now/app/.well-known/apple-app-site-association/route.ts`: `'XXXXXXXXXX'`
- `EXPO_PUBLIC_GA_TRACKING_ID` in `rez-app-consumer/config/monitoring.config.ts`: `'UA-XXXXX-Y'`

### Hardcoded Fallback Data:
- `rating: { average: 0, count: 0 }` in `rez-app-consumer/app/grocery/[category].tsx`

---

## Relative Import Depth Issues

**No overly-deep relative imports found** (5+ levels).

### Moderate Depth Imports (3+ levels):
Most are in `rez-app-consumer/app/mall/` and `rez-app-consumer/app/explore/` directories using 3-level deep imports like `../../../services/`.

---

## MongoDB Configuration

MongoDB is properly configured across services with fallback chain:
- Uses environment variables: `ADS_MONGO_URI` / `MONGO_URI` / `MONGODB_URI`
- Services checked: `rez-ads-service`

---

## Redis Configuration

Redis is properly configured:
- Services use `REDIS_URL` / `getRedis()` pattern
- Services checked: `rez-ads-service`

---

## Wallet Service Dependencies

Found references to `rez-wallet-service` across multiple services:
- `rez-app-merchant/services/api/socket.ts` - needs MISS-02 implementation
- `rez-app-consumer/utils/secureWalletStorage.ts` - references wallet storage
- `Resturistan App/restauranthub/apps/api/src/modules/fintech/fintech.service.ts`

---

## eslint-disable Comments

Found in `rez-now/`:
- Multiple `// eslint-disable-next-line` for TypeScript strict mode overrides
- `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- `// eslint-disable-next-line @next/next/no-img-element`
- `// eslint-disable-next-line react-hooks/exhaustive-deps`

---

## ts-ignore Comments

Found in build output (`.next/types/`):
- 20+ `// @ts-ignore` in `rez-now/.next/types/validator.ts`

**Note:** These are in generated build output, not source files.

---

## Summary

### Action Items:
1. **4 unimplemented methods** in `rez-merchant-integrations/src/services/aggregators/channelManager.ts`
2. **8 priority TODOs** requiring backend/frontend implementation
3. **4 MISS markers** for socket events needing implementation
4. **1 critical TODO** for SQLCipher encryption in offline POS queue

### Non-Actionable:
- `XXXX` patterns are informational placeholders for IDs/formats
- Generated build files (`.next/types/`) should be ignored
- eslint-disable comments are intentional suppressions
