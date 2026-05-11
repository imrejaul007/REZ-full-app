# Fixes Applied

## Date: May 3, 2026

### Issues Fixed

#### 1. Port Mismatch - Updated docker-compose.yml
- Updated header comments to reflect standard ports
- Fixed `REZ_WALLET_SERVICE_URL` in rez-now service from port 4001 to 4004

**Standard Ports:**
| Service | Port |
|---------|------|
| Auth | 4002 |
| Payment | 4001 |
| Order | 3006 |
| Wallet | 4004 |
| Merchant | 4005 |
| Catalog | 3005 |
| Search | 4003 |
| Gamification | 3001 |
| Ads | 4007 |
| Marketing | 4000 |
| Karma | 3009 |

#### 2. Missing Implementations - Added channelManager Methods
File: `rez-merchant-integrations/src/services/aggregators/channelManager.ts`

Added:
- `processOrder()` - Process order through channel
- `syncInventory()` - Sync inventory across channels
- `getChannelStatus()` - Get channel connection status
- `webhookHandler()` - Handle webhooks from aggregators

Added type exports:
- `ChannelEvent`
- `Order`
- `Product`
- `ChannelStatus`

#### 3. Missing Event Handlers - Added wallet/payment handlers
File: `rez-order-service/src/eventBus.ts`

Added:
- `handleSettlementCredited()` - Updates order with settlement info when wallet settlement is credited
- `handleRefundCompleted()` - Updates order with refund info when payment refund completes
- `registerHandler()` - Method to register event handlers
- `processIncomingEvent()` - Method to process incoming events

#### 4. Service URLs - Updated .env.example
File: `rez-now/.env.example`

Added all standard service URLs:
```bash
REZ_AUTH_SERVICE_URL=http://localhost:4002
REZ_WALLET_SERVICE_URL=http://localhost:4004
REZ_ORDER_SERVICE_URL=http://localhost:3006
REZ_PAYMENT_SERVICE_URL=http://localhost:4001
REZ_MERCHANT_SERVICE_URL=http://localhost:4005
REZ_CATALOG_SERVICE_URL=http://localhost:3005
REZ_SEARCH_SERVICE_URL=http://localhost:4003
REZ_GAMIFICATION_SERVICE_URL=http://localhost:3001
REZ_ADS_SERVICE_URL=http://localhost:4007
REZ_MARKETING_SERVICE_URL=http://localhost:4000
REZ_KARMA_SERVICE_URL=http://localhost:3009
```

#### 5. Shared Types - Created auth service types index
File: `rez-auth-service/src/types/index.ts`

Created index exporting:
- Shared types from `@rez/shared-types` (User, Session, Device)
- Local fallback types (AuthServiceUser)
- Common auth types (AuthToken, AuthResponse, TokenPayload, AuthProvider, RefreshTokenResult)

### Issues Remaining

1. **Shared types consolidation** (ongoing)
   - Other services may need similar type exports
   - Consider creating `@rez/shared-types` package to centralize

2. **Enum deduplication** (ongoing)
   - Some services may have duplicate enum definitions
   - Need to audit and consolidate enums

3. **Missing services in docker-compose**
   - wallet-api (port 4004)
   - order-api (port 3006)
   - catalog-api (port 3005)
   - search-api (port 4003)
   - gamification-api (port 3001)
   - ads-api (port 4007)
   - karma-api (port 3009)
   - payment-api (port 4001)

4. **Event bus consumers**
   - Need to implement event consumers that subscribe to the event stream
   - Consumers should call `processIncomingEvent()` for wallet/payment events
