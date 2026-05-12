# REZ Platform - Source of Truth (SOT)

**Last Updated:** May 12, 2026
**Version:** 3.0.0

---

## Repository Structure

| Repository | Purpose | Remote |
|------------|---------|--------|
| `REZ-Media` | Advertising, loyalty, marketing automation | `imrejaul007/REZ-Media` |
| `REZ-Intelligence` | AI/ML services, event bus, identity, Agent-OS (38 agents) | `imrejaul007/REZ-Intelligence` |
| `RABTUL-Technologies` | Core platform services (auth, wallet, payment) | `imrejaul007/RABTUL-Technologies` |
| `REZ-Consumer` | Mobile apps (Hotel OTA, Rendez, Food Delivery, **Do App**) | `imrejaul007/REZ-Consumer` |
| `REZ-Merchant` | Merchant OS, admin dashboards, integrations | `imrejaul007/REZ-Merchant` |
| `rez-merchant-service` | Core merchant API service | `imrejaul007/rez-merchant-service` |
| **`buzzlocal-app`** | **Hyperlocal social + discovery app** | `imrejaul007/buzzlocal-app` |
| **`buzzlocal-services`** | **Backend services for BuzzLocal** | `imrejaul007/buzzlocal-services` |

---

## BuzzLocal

**Hyperlocal social + discovery app** - Users find all local information (events, news, places, offers) and earn ReZ Coins for contributing.

### Location
- **Frontend**: `buzzlocal-app/` (Expo/React Native)
- **Backend**: `buzzlocal-services/` (8 microservices)

### Documentation
- [README.md](buzzlocal-app/README.md) - App documentation
- [SPEC.md](buzzlocal-app/SPEC.md) - Full specification
- [CLAUDE.md](buzzlocal-app/CLAUDE.md) - Development guidelines
- [Services README](buzzlocal-services/README.md) - Backend documentation

### Services

| Service | Port | Description |
|---------|------|-------------|
| buzzlocal-feed-service | 4000 | Posts, feed, AI cards, coin rewards |
| buzzlocal-vibe-service | 4003 | Vibe areas, check-ins, crowd heatmap |
| buzzlocal-community-service | 4004 | Communities, group posts, members |
| z-events-service | 4008 | Events, ticketing, QR check-in |
| buzzlocal-intelligence-service | 4010 | AI intelligence, REZ Mind integration |
| buzzlocal-notification-service | 4011 | Push notifications via Expo |
| buzzlocal-realtime-service | 4012 | WebSocket real-time updates |
| buzzlocal-payment-service | 4013 | Payments via Razorpay |

### Service URLs

#### Production
```
BUZZLOCAL_FEED=https://buzzlocal-feed.onrender.com
BUZZLOCAL_VIBE=https://buzzlocal-vibe.onrender.com
BUZZLOCAL_COMMUNITY=https://buzzlocal-community.onrender.com
BUZZLOCAL_EVENTS=https://buzzlocal-events.onrender.com
BUZZLOCAL_INTELLIGENCE=https://buzzlocal-intelligence.onrender.com
BUZZLOCAL_NOTIFICATIONS=https://buzzlocal-notifications.onrender.com
BUZZLOCAL_REALTIME=https://buzzlocal-realtime.onrender.com
BUZZLOCAL_PAYMENT=https://buzzlocal-payment.onrender.com
```

#### Development
```
BUZZLOCAL_FEED=http://localhost:4000
BUZZLOCAL_VIBE=http://localhost:4003
BUZZLOCAL_COMMUNITY=http://localhost:4004
BUZZLOCAL_EVENTS=http://localhost:4008
BUZZLOCAL_INTELLIGENCE=http://localhost:4010
BUZZLOCAL_NOTIFICATIONS=http://localhost:4011
BUZZLOCAL_REALTIME=http://localhost:4012
BUZZLOCAL_PAYMENT=http://localhost:4013
```

### API Endpoints

#### Feed Service (4000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feed` | Get personalized feed |
| POST | `/posts` | Create post |
| POST | `/posts/:id/like` | Like post |

#### Vibe Service (4003)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vibe/areas` | Get nearby vibe areas |
| POST | `/checkin` | Check in |

#### Events Service (4008)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | List events |
| POST | `/tickets` | Purchase ticket |

#### Intelligence Service (4010)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/cards` | Get AI cards |
| GET | `/ai/mood` | Predict area mood |

### Features
- **Post Types**: General, Event, Alert, Place, Deal, Poll
- **Coin Rewards**: 15-50 coins per action
- **Gamification**: Badges, streaks, leaderboards
- **REZ Mind**: All actions tracked for AI training

---

## Do App

**AI-powered chat commerce app** - The conversational interface for the ReZ ecosystem.

### Location
- **Frontend**: `REZ-Consumer/do-app/` (Expo/React Native)
- **Backend**: `REZ-Consumer/do-app/do-backend/` (Express.js)

### Documentation
- [CLAUDE.md](REZ-Consumer/do-app/CLAUDE.md) - Development guidelines
- [SECURITY.md](REZ-Consumer/do-app/do-backend/SECURITY.md) - Security rules
- [DO-APP-SPEC.md](docs/DO-APP-SPEC.md) - Full specification
- [DO-TECHNICAL-INTEGRATION.md](docs/DO-TECHNICAL-INTEGRATION.md) - API details

### Service URLs

#### Do App Backend (Production)
```
DO_API=https://do-backend.onrender.com
DO_WS=wss://do-backend.onrender.com/stream
```

#### Do App Backend (Development)
```
DO_API=http://localhost:3000
DO_WS=ws://localhost:3000/stream
```

### Security Requirements

| Variable | Requirement | Production Check |
|----------|-------------|-----------------|
| `JWT_SECRET` | 32+ characters | Fails if missing/short |
| `OTP_SECRET` | 32+ characters | Fails if missing/short |
| `CORS_ORIGIN` | Specific URL | Fails if `*` in prod |
| `NODE_ENV` | `production` | Enables security checks |

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/otp/send` | Public | Send OTP |
| POST | `/auth/otp/verify` | Public | Verify OTP |
| GET | `/auth/me` | JWT | Get current user |
| POST | `/auth/logout` | JWT | Logout |
| POST | `/auth/refresh` | Public | Refresh token |
| POST | `/do/chat/message` | JWT | AI chat |
| GET | `/discovery` | Optional | Search venues |
| GET | `/discovery/trending` | Optional | Trending |
| GET | `/wallet` | JWT | Balance |
| POST | `/wallet/debit` | JWT | Deduct (idempotent) |
| POST | `/wallet/credit` | JWT | Add (idempotent) |
| GET | `/bookings` | JWT | User bookings |

### Key Features
- [x] AI chat interface
- [x] Phone + OTP authentication
- [x] Wallet integration (coins, karma)
- [x] Venue discovery
- [x] Booking management
- [x] Real-time WebSocket
- [x] Offline support
- [x] Idempotent transactions
- [x] Rate limiting
- [x] Input validation (Zod)

---

---

## Service URLs

### Production
```
# RABTUL Core Services
AUTH_SERVICE=https://rez-auth-service.onrender.com
WALLET_SERVICE=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE=https://rez-payment-service.onrender.com
ORDER_SERVICE=https://rez-order-service.onrender.com
MERCHANT_SERVICE=https://rez-merchant-service.onrender.com
INTENT_SERVICE=https://rez-intent-graph.onrender.com
EVENT_BUS=https://rez-event-bus.onrender.com
IDENTITY_BRIDGE=https://rez-identity-bridge.onrender.com

# REZ-Media
ADS_SERVICE=https://rez-ads-service.onrender.com
DECISION_SERVICE=https://rez-decision-service.onrender.com
GAMIFICATION_SERVICE=https://rez-gamification-service.onrender.com
AUTOMATION_SERVICE=https://rez-automation-service.onrender.com
MEDIA_EVENTS=https://rez-media-events.onrender.com
COMMUNICATIONS_SERVICE=https://rez-communications.onrender.com

# REZ-Intelligence
EVENT_PLATFORM=https://rez-event-platform.onrender.com
INTELLIGENCE_HUB=https://rez-intelligence-hub.onrender.com
INSIGHTS_SERVICE=https://rez-insights-service.onrender.com
AGENT_ORCHESTRATOR=https://rez-agent-orchestrator.onrender.com
COMMERCE_AGENTS=https://rez-commerce-agents.onrender.com
AUTONOMOUS_AGENTS=https://rez-autonomous-agents.onrender.com
USER_AGENTS=https://rez-user-agents.onrender.com

# Messaging Services
NOTIFICATIONS_HUB=https://rez-notifications-hub.onrender.com
NOTIFICATIONS_SERVICE=https://rez-notifications-service.onrender.com
UNIFIED_MESSAGING=https://rez-unified-messaging.onrender.com
UNIFIED_CHAT=https://rez-unified-chat.onrender.com

# BuzzLocal
BUZZLOCAL_FEED=https://buzzlocal-feed.onrender.com
BUZZLOCAL_VIBE=https://buzzlocal-vibe.onrender.com
BUZZLOCAL_COMMUNITY=https://buzzlocal-community.onrender.com
BUZZLOCAL_EVENTS=https://buzzlocal-events.onrender.com
BUZZLOCAL_INTELLIGENCE=https://buzzlocal-intelligence.onrender.com
BUZZLOCAL_NOTIFICATIONS=https://buzzlocal-notifications.onrender.com
BUZZLOCAL_REALTIME=https://buzzlocal-realtime.onrender.com
BUZZLOCAL_PAYMENT=https://buzzlocal-payment.onrender.com
```

### Development (Local)
```
# RABTUL Core Services
AUTH_SERVICE=http://localhost:4002
WALLET_SERVICE=http://localhost:4001
PAYMENT_SERVICE=http://localhost:4003
ORDER_SERVICE=http://localhost:4006
MERCHANT_SERVICE=http://localhost:4005
INTENT_SERVICE=http://localhost:4050
EVENT_BUS=http://localhost:4051
IDENTITY_BRIDGE=http://localhost:4092

# REZ-Media
ADS_SERVICE=http://localhost:4007
DECISION_SERVICE=http://localhost:4027
GAMIFICATION_SERVICE=http://localhost:3004
AUTOMATION_SERVICE=http://localhost:4020
MEDIA_EVENTS=http://localhost:3008
COMMUNICATIONS_SERVICE=http://localhost:3009

# Messaging Services
NOTIFICATIONS_HUB=http://localhost:4009
NOTIFICATIONS_SERVICE=http://localhost:4010
UNIFIED_MESSAGING=http://localhost:4011
UNIFIED_CHAT=http://localhost:4012
```

---

## Security Configuration

### Internal Service Tokens

All services use **scoped tokens** via `INTERNAL_SERVICE_TOKENS_JSON`:

```json
{
  "auth-service": "<hex-token>",
  "wallet-service": "<hex-token>",
  "payment-service": "<hex-token>",
  "order-service": "<hex-token>",
  "merchant-service": "<hex-token>",
  "intent-service": "<hex-token>",
  "event-bus": "<hex-token>",
  "identity-bridge": "<hex-token>",
  "api-gateway": "<hex-token>",
  "ads-service": "<hex-token>",
  "decision-service": "<hex-token>",
  "gamification-service": "<hex-token>",
  "automation-service": "<hex-token>",
  "media-events": "<hex-token>"
}
```

**Generate tokens:**
```bash
openssl rand -hex 32
```

### Request Headers

#### Internal Service Calls
```
X-Internal-Token: <service-token>
X-Internal-Service: <service-name>
Content-Type: application/json
X-Request-Id: <uuid>
```

#### User Context
```
X-User-Id: <user-id>
X-User-Role: <role>
Authorization: Bearer <jwt>
```

### Webhook Signatures
```
X-Signature: <hmac-sha256-hex>
```

---

## Security Standards

### Must Have (Production)

- [x] `JWT_SECRET` - 64+ characters
- [x] `ENCRYPTION_KEY` - 64 hex characters or 32 bytes
- [x] `INTERNAL_SERVICE_TOKENS_JSON` - Scoped per-service tokens
- [x] `OTP_PEPPER` - Server-side OTP security
- [x] `INTERNAL_WEBHOOK_SECRET` - HMAC signing
- [x] Weak secret detection at startup
- [x] HSTS headers in production
- [x] CORS restricted to known origins
- [x] Rate limiting enabled
- [x] Redis-backed distributed rate limits

### Implemented Fixes

| Fix | Status | Repository |
|-----|--------|------------|
| CORS localhost in production | ✅ | rez-merchant-service |
| Refresh token 30-day expiry | ✅ | rez-merchant-service |
| Distributed withdrawal lock | ✅ | rez-merchant-service |
| HMAC webhook signatures | ✅ | rez-merchant-service |
| OTP pepper hashing | ✅ | rez-merchant-service |
| Weak secret detection | ✅ | All services |
| Auth middleware | ✅ | REZ-Intelligence |
| Rate limiting | ✅ | REZ-Intelligence |
| HSTS headers | ✅ | RABTUL-Technologies |
| **OTP bypass removed** | ✅ | **do-backend** |
| **Mock OTP exposure removed** | ✅ | **do-backend** |
| **WebSocket auth required** | ✅ | **do-backend** |
| **Wallet idempotency** | ✅ | **do-backend** |
| **Input validation (Zod)** | ✅ | **do-backend** |
| **Production secret enforcement** | ✅ | **do-backend** |

---

## Database Schemas

### Merchant (MongoDB)
```typescript
interface Merchant {
  _id: ObjectId;
  businessName: string;
  email: string;
  phone: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  refreshTokenHash?: string;
  refreshTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### UnifiedIdentity (MongoDB)
```typescript
interface UnifiedIdentity {
  _id: ObjectId;
  unifiedId: string;
  primaryIdentifier: 'phone' | 'email';
  linkedAccounts: [{
    appId: string;
    userId: string;
    linkedAt: Date;
    confidence: number;
  }];
  profile: { phone?: string; email?: string; name?: string };
  status: 'active' | 'merged' | 'flagged';
}
```

---

## Environment Variables

### Required for All Services

| Variable | Description | Format |
|----------|-------------|--------|
| `NODE_ENV` | Environment | `development` \| `staging` \| `production` |
| `PORT` | Service port | number |
| `MONGODB_URI` | MongoDB connection | mongodb://... |
| `REDIS_URL` | Redis connection | redis://... |
| `JWT_SECRET` | JWT signing secret | 64+ chars |
| `ENCRYPTION_KEY` | Data encryption key | 64 hex or 32 bytes |
| `INTERNAL_SERVICE_TOKENS_JSON` | Service tokens | JSON object |

### Service-Specific

| Service | Additional Required |
|---------|-------------------|
| Merchant | `JWT_MERCHANT_SECRET`, `OTP_PEPPER`, `INTERNAL_WEBHOOK_SECRET` |
| Auth | `JWT_ADMIN_SECRET`, `JWT_REFRESH_SECRET`, `OTP_HMAC_SECRET` |
| Payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Ads Service | `ADS_JWT_SECRET`, `INTENT_CAPTURE_URL`, `EVENT_PLATFORM_URL`, `RAZORPAY_WEBHOOK_SECRET` |
| Decision Service | `INTENT_CAPTURE_URL`, `INTELLIGENCE_HUB_URL`, `INSIGHTS_SERVICE_URL` |
| Gamification | `WALLET_SERVICE_URL`, `INTENT_CAPTURE_URL` |
| Automation | `ALLOWED_TRACK_DOMAINS`, `SMTP_*` |
| Media Events | `CLOUDINARY_*`, `CDN_URL` |
| Agent Orchestrator | `MARKETING_SERVICE_URL`, `COMMUNICATIONS_SERVICE_URL`, `AGENT_TOKENS` |
| Communications | `TWILIO_*, SENDGRID_*, FIREBASE_*` |

---

## API Endpoints

### Auth Service
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | User login |
| POST | `/api/auth/refresh` | Public | Refresh token |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/health` | None | Health check |

### Merchant Service
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/merchant/auth/login` | Public | Merchant login |
| POST | `/api/v1/merchant/auth/verify-otp` | Public | Verify OTP |
| GET | `/api/v1/merchant/orders` | JWT | List orders |
| POST | `/api/v1/merchant/wallet/withdraw` | JWT | Withdrawal |
| GET | `/health` | None | Health check |

### Event Bus
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/publish` | Internal | Publish event |
| GET | `/api/events/history` | Internal | Event history |
| GET | `/api/health` | None | Health check |

---

## Monitoring & Health

### Health Endpoints
All services expose:
- `/health` - Basic liveness
- `/ready` - Readiness (checks dependencies)
- `/health/detailed` - Full status

### Prometheus Metrics
All services expose `/metrics` for Prometheus scraping.

---

## Deployment Checklist

### Pre-Deployment
- [ ] Generate production secrets (`openssl rand -hex 64`)
- [ ] Verify `.env.example` has placeholder values only
- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm test` - all pass
- [ ] Security scan: `npm run security-scan`

### Post-Deployment
- [ ] Verify health endpoint returns `200`
- [ ] Check logs for startup errors
- [ ] Test authentication flow
- [ ] Verify rate limiting works
- [ ] Monitor error rates

---

## Troubleshooting

### Authentication Failures
1. Check `JWT_SECRET` matches across services
2. Verify `INTERNAL_SERVICE_TOKENS_JSON` format is valid JSON
3. Check token expiry hasn't passed

### Database Connection Issues
1. Verify `MONGODB_URI` is correct
2. Check network connectivity to MongoDB
3. Verify credentials if auth enabled

### Rate Limiting
1. Redis must be reachable
2. Check `X-RateLimit-*` headers in response
3. Adjust limits in environment if needed

---

## Contact

For issues or questions, refer to:
- Security: `security@rez.money`
- Platform: `platform@rez.money`
- Documentation: See individual service README.md

---

## Merchant Intelligence Platform

**Last Updated:** May 12, 2026

### Overview

The Merchant Intelligence Platform provides cross-merchant analytics and benchmarking, enabling merchants to compare performance against industry benchmarks, view demand heatmaps, and discover expansion opportunities.

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Intelligence Aggregator** | `REZ-Merchant/rez-merchant-intelligence-aggregator/` | Core aggregation service |
| **Market View UI** | `REZ-Merchant/REZ-dashboard/src/app/market/` | Dashboard analytics UI |
| **Consent Flow** | `REZ-Merchant/rez-app-merchant/app/settings/` | GDPR consent management |
| **Data Pipeline** | `REZ-Merchant/rez-merchant-service/src/services/intelligenceDataPipeline.ts` | Order-to-aggregator sync |

### Privacy-First Design

- **GDPR Compliant**: Consent-based data sharing
- **Anonymization**: All aggregated metrics use differential privacy
- **Thresholds**: Minimum 3 merchants required for aggregation
- **No PII**: No personally identifiable information in aggregated data

### Revenue Model - SaaS Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic analytics, own data only |
| **Pro** | $49/mo | Neighborhood trends, benchmarks |
| **Business** | $199/mo | Competitor analysis, AI recommendations |
| **Enterprise** | $999/mo | Full API access, custom reports |

### API Endpoints

#### Merchant Service - Intelligence

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/merchant/intelligence/market/heatmap/:city` | JWT | Demand heatmap |
| GET | `/api/v1/merchant/intelligence/market/neighborhood` | JWT | Neighborhood analysis |
| GET | `/api/v1/merchant/intelligence/market/trends/:locality` | JWT | Demand trends |
| GET | `/api/v1/merchant/intelligence/market/benchmark` | JWT | Industry benchmarks |
| GET | `/api/v1/merchant/intelligence/market/opportunities` | JWT | Expansion opportunities |
| POST | `/api/v1/merchant/intelligence/market/opt-in` | JWT | Join market intelligence |
| POST | `/api/v1/merchant/intelligence/market/opt-out` | JWT | Leave market intelligence |

#### Intelligence Aggregator - Internal

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/internal/aggregate` | Internal | Submit merchant metrics |
| POST | `/internal/consent` | Internal | Update consent |
| POST | `/internal/run-aggregation` | Internal | Trigger aggregation |

#### Intelligence Aggregator - Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/benchmark/industry/:industry` | Industry benchmarks |
| GET | `/api/v1/heatmap/demand/:city` | Demand heatmap |
| GET | `/api/v1/heatmap/neighborhood` | Neighborhood analysis |
| GET | `/api/v1/heatmap/trending` | Trending localities |
| GET | `/api/v1/heatmap/opportunities` | Opportunity areas |
| GET | `/api/v1/trends/demand/:locality` | Demand trends |

### Data Pipeline

```
Order Completed → Merchant Service → Intelligence Aggregator
                                          │
                                          └── Aggregation Engine
                                          └── Anonymize & Aggregate
                                          └── Store in MongoDB
                                          └── Cache in Redis
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `INTELLIGENCE_AGGREGATOR_URL` | URL of the aggregator service |

### Service URLs

```
# Development
MERCHANT_INTELLIGENCE_AGGREGATOR=http://localhost:4011

# Production
MERCHANT_INTELLIGENCE_AGGREGATOR=https://rez-merchant-intelligence-aggregator.onrender.com
```

---

## REZ-Media Platform

**Comprehensive advertising & marketing platform** - Like Google Ads + Meta Ads + DOOH Exchange

**Last Updated:** May 12, 2026

### Overview

REZ-Media combines digital advertising, DOOH, offline ads, QR campaigns, and broadcast marketing with AI-powered dynamic pricing.

### Ad Types (38 Total)

| Category | Count | Examples |
|----------|-------|----------|
| In-App Ads | 4 | Banner, Feed, Store, Search |
| DOOH | 7 | Mall LED, Restaurant TV, Gym, Office, Transit |
| Offline | 8 | Standees, Posters, Billboards, Table Tents |
| QR | 6 | Poster, Table Tent, Window, Receipt |
| Broadcast | 5 | WhatsApp, SMS, Email, Push, In-App |
| Influencer | 5 | Instagram, YouTube, Reels, TikTok |
| Search | 3 | Text, Product, Category |

### Services

| Service | Port | Description |
|---------|------|-------------|
| REZ-ads-service | 4007 | Ad campaigns, serving |
| REZ-pricing-engine | 4008 | AI dynamic pricing |
| REZ-marketing | 4000 | Broadcasts, segments |
| REZ-communications | 3009 | WhatsApp, SMS, Email, Push |
| REZ-gamification | 3004 | Points, badges, streaks |
| REZ-lead-intelligence | - | AI segments |
| REZ-decision-service | - | Personalization |
| REZ-automation | - | Workflow automation |
| REZ-media-events | - | Event tracking |
| REZ-economic-engine | - | Commission rules |
| adsqr | 3008 | QR campaigns |
| dooh-service | - | DOOH platform |

### UI Apps

| App | Description |
|-----|-------------|
| adBazaar | Ad marketplace |
| rez-marketing-dashboard | Merchant dashboard |
| dooh-screen-app | Screen owner web |
| dooh-mobile | Screen owner mobile |
| rez-whatsapp-store-ui | WhatsApp commerce |
| rez-chatbot-builder-ui | Chatbot builder |
| rez-crm-ui | CRM dashboard |

### AI Pricing Features

| Feature | Description |
|---------|-------------|
| Dynamic Pricing | Surge, demand, competition |
| Quality Score | Like Google Ads |
| Price Caps | Max 8x for DOOH |
| Minimum Spend | ₹300-5,000 |
| Inventory Liquidation | Auto-discount unsold |
| Smart Budget AI | Auto-allocate channels |

### Merchant Wallet Flow

```
1. Merchant adds funds to wallet
2. Create campaign → Reserve budget
3. Campaign runs → Deduct per event
4. Campaign ends → Release unused
```

### Service URLs (Development)

```bash
# REZ-Media Services
ADS_SERVICE=http://localhost:4007
PRICING_ENGINE=http://localhost:4008
MARKETING_SERVICE=http://localhost:4000
COMMUNICATIONS=http://localhost:3009
GAMIFICATION=http://localhost:3004
DOOH_SERVICE=http://localhost:4004
ADSQR=http://localhost:3008
```

### Service URLs (Production)

```bash
# REZ-Media Services
ADS_SERVICE=https://rez-ads-service.onrender.com
PRICING_ENGINE=https://rez-pricing-engine.onrender.com
MARKETING_SERVICE=https://rez-marketing.onrender.com
COMMUNICATIONS=https://rez-communications.onrender.com
GAMIFICATION=https://rez-gamification.onrender.com
```

### Key API Endpoints

```bash
# Pricing
POST /api/price - Calculate dynamic price
POST /api/price/allocate - Smart budget
POST /api/price/liquidation - Unsold discount

# Campaigns
POST /api/campaigns/unified - Create with wallet
GET /api/campaigns/:id/status - Wallet usage

# Ads
GET/POST /api/ads - List/Create ads
POST /api/serve - Serve ad
POST /api/events/click - Record click

# Broadcasts
POST /api/broadcasts/whatsapp
POST /api/broadcasts/sms
POST /api/broadcasts/email
POST /api/broadcasts/push
```

### Directory Structure

```
REZ-Media/
├── REZ-ads-service/           # Ad campaigns
├── REZ-pricing-engine/        # AI pricing
├── REZ-marketing/             # Broadcasts
├── REZ-communications-platform/ # WhatsApp, SMS, Email
├── REZ-gamification-service/  # Loyalty
├── REZ-lead-intelligence/     # AI segments
├── REZ-decision-service/      # Personalization
├── REZ-automation-service/    # Workflows
├── REZ-media-events/          # Event tracking
├── REZ-economic-engine/       # Commission rules
├── adsqr/                     # QR campaigns
├── dooh/                      # DOOH platform
├── dooh-screen-app/           # Screen owner UI
├── dooh-mobile/               # Screen owner app
├── rez-dooh-service/          # DOOH backend
├── adBazaar/                  # Ad marketplace
├── rez-whatsapp-store/        # Commerce
├── rez-whatsapp-provisioning/ # Multi-tenant
├── rez-marketing-dashboard/   # Merchant UI
├── rez-chatbot-builder-ui/     # Chatbot builder
├── rez-crm-ui/               # CRM dashboard
└── rez-ad-campaigns/         # Campaign mgmt
```

### Documentation

| Document | Description |
|----------|-------------|
| ARCHITECTURE.md | Complete architecture |
| FEATURES.md | All features |
| AD_TYPES_AND_WALLET_FLOW.md | Ad types & wallet |
| COMPLETE_GAP_AUDIT.md | Gap analysis |
| PRICING_MATRIX.md | Pricing details |
| MARKETING_HUB.md | Marketing platform |

### External API Dependencies

| Provider | Service | Status |
|----------|---------|--------|
| Twilio | WhatsApp, SMS | Credentials needed |
| SendGrid | Email | Credentials needed |
| Firebase | Push | Credentials needed |
| OpenAI | AI features | Credentials needed |
| Razorpay | Payments | Credentials needed |
