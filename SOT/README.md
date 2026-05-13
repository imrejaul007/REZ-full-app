# REZ ECOSYSTEM - COMPLETE SOURCE OF TRUTH

**Last Updated:** May 12, 2026  
**Version:** 3.0

---

## EXECUTIVE SUMMARY

The REZ Ecosystem is a **Hyperlocal Commerce AI Platform** with:
- **25+ Intelligence Services**
- **8 Industry Expert Systems**
- **5 Connected Apps**
- **Real ML Models**
- **Unified Agent OS**
- **Universal User Graph**
- **10M+ users potential**

---

## COMPANIES

| Company | Purpose | Apps |
|---------|---------|------|
| RTNM-Group | Holdings & Controls | admin.rez.money |
| RABTUL-Technologies | Core Infrastructure | Payment, Order, Wallet |
| REZ-Intelligence | AI/ML Platform | THE MOAT |
| REZ-Media | Ads & Marketing | AdBazaar, Creator |
| REZ-Merchant | Merchant OS | Dashboard, App |
| REZ-Consumer | Consumer Apps | Nuqta, Rendez, do-app |
| StayOwn-Hospitality | Hotels | Hotel-OTA |
| CorpPerks | Enterprise B2B | Corporate perks |

---

## APPS (5 CONNECTED)

### Consumer Apps
| App | Platform | Status |
|-----|----------|--------|
| do-app | React Native | Connected |
| Hotel OTA | React Native | Connected |
| AdBazaar | React | Connected |
| Rendez | React Native | Connected |
| Merchant App | React Native | Connected |

### Web Products
| Product | URL | Status |
|---------|-----|--------|
| admin.rez.money | Admin panel | Ready |
| merchant.rez.money | Merchant portal | Ready |
| rez.money | Consumer web | Ready |

---

## INTELLIGENCE SERVICES (25)

### Core AI Services
| Service | Port | Purpose |
|---------|------|---------|
| rez-intent-graph | 4050 | User intent understanding |
| rez-memory-engine | 4051 | Conversation memory |
| rez-identity-graph | 4050 | User identity |
| rez-taste-profile | 4041 | User preferences |
| rez-reorder-engine | 4040 | Purchase predictions |
| rez-demand-forecast | 4042 | Market trends |
| rez-price-predictor | 4043 | Dynamic pricing |
| rez-ai-router | 4052 | Multi-provider AI |

### Orchestration
| Service | Port | Purpose |
|---------|------|---------|
| rez-orchestrator-v2 | 4015 | Workflow orchestration |
| rez-autonomous-agents | 4062 | 30 AI agents |
| rez-agent-registry | 4011 | Agent management |
| rez-whatsapp-bridge | 4010 | WhatsApp integration |

### Expert Systems
| Service | Port | Industry |
|---------|------|---------|
| rez-travel-expert | 3003 | Travel |
| rez-hospitality-expert | 3003 | Hotels/Restaurants |
| rez-retail-expert | 3003 | Shopping |
| rez-health-expert | 3003 | Healthcare |
| rez-fitness-expert | 3003 | Gym/Wellness |
| rez-salon-expert | 3003 | Beauty/Spa |
| rez-culinary-expert | 3003 | Cooking/Recipes |
| rez-education-expert | 3003 | Learning |

### Business Services
| Service | Port | Purpose |
|---------|------|---------|
| rez-merchant-brain | 4061 | Merchant insights |
| rez-payments-brain | 4070 | Fraud detection |
| rez-creator-network | 4072 | Creator management |
| rez-inventory-sync | 4071 | Inventory sync |
| rez-merchant-os | 4073 | Merchant SaaS |

### Integration
| Service | Port | Purpose |
|---------|------|---------|
| rez-agent-os | 4100 | Unified chat |
| rez-universal-user-graph | 4101 | User profiles |
| rez-data-warehouse | 4105 | ETL pipelines |
| rez-ab-testing | 4110 | Experiments |
| rez-ml-production | 4080 | ML predictions |

---

## AGENT OS (THE MOAT)

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ REZ AGENT OS (Port 4100) │
├─────────────────────────────────────────────────────────────┤
│ │
│ VOICE ────────────────────► STT/TTS │
│ VOICE ────────────────────► Twilio │
│ │
│ CREDIT ──────────────────► Scoring │
│ CREDIT ──────────────────► BNPL │
│ CREDIT ──────────────────► Lending │
│ │
│ POS ─────────────────────► Inventory │
│ POS ─────────────────────► Orders │
│ POS ─────────────────────► Analytics │
│ │
│ SUPPORT COPILOT ──────────► All apps │
│ │
│ INTELLIGENCE ────────────► ML Services │
│ │
│ EXPERT SYSTEMS ───────────► Industry │
│ │
└─────────────────────────────────────────────────────────────┘
```

### Connected Apps via SDK
```javascript
// DO App
const doApp = new DOAppClient({ userId: 'user123' });
await doApp.trackBooking({ ... });
await doApp.chat('Book a massage');

// Hotel OTA
const hotel = new HotelOTAClient({ userId: 'user123' });
await hotel.trackBooking({ ... });

// AdBazaar
const ads = new AdBazaarClient({ userId: 'user123' });
await ads.trackImpression(adId, campaignId);

// Rendez
const rendez = new RendezClient({ userId: 'user123' });
await rendez.trackMatch(matchId);

// Merchant
const merchant = new MerchantClient({ userId: 'merchant_123' });
await merchant.trackSale({ ... });
```

---

## ML MODELS (REAL)

| Model | Algorithm | Purpose |
|-------|-----------|---------|
| Churn Prediction | GradientBoosting | User retention |
| LTV Prediction | RandomForest | Lifetime value |
| Reorder Engine | Heuristics+ML | Purchase predictions |
| Demand Forecast | ML | Market trends |
| Fraud Detection | Rules+ML | Anomaly detection |

### ML API Endpoints
```bash
# Churn prediction
POST /api/predict/churn

# LTV prediction
POST /api/predict/ltv

# Combined user prediction
POST /api/predict/user

# Batch predictions
POST /api/batch/churn
POST /api/batch/ltv
```

---

## DATA FLOW

### User Journey
```
User scans QR
    │
    ▼
App tracks event ──► Event Bus
    │
    ▼
Intent Detection ──► Intent Graph
    │
    ▼
User Identity ──► Identity Graph
    │
    ▼
Intelligence ──► Memory Engine
    │
    ▼
Prediction ──► ML Models (Churn, LTV)
    │
    ▼
Recommendation ──► Agent OS
    │
    ▼
Action ──► App/Copilot
```

### Event Types
- qr_scan
- page_view
- search
- order_started
- order_completed
- payment_success
- nudge_sent
- nudge_clicked
- nudge_converted

---

## DEPLOYMENT

### Docker Compose
```bash
cd REZ-Intelligence
docker-compose up -d
```

### Services Started
| Service | Port |
|---------|------|
| MongoDB | 27017 |
| Redis | 6379 |
| All 25 services | Various |

### Environment Variables
```bash
# Core
MONGODB_URI=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_TOKEN=your-token

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Payment
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# Notification
FCM_SERVER_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

---

## FILES CREATED

### REZ-Intelligence
```
REZ-Intelligence/
├── docker-compose.yml              # All services
├── REZ-unified-chat/              # Agent OS
├── REZ-integration-sdk/            # App connectors
├── REZ-ml-production/             # Real ML models
├── REZ-data-warehouse/           # ETL pipelines
├── REZ-ab-testing/                # Experiments
├── rez-ml-models/                # Python ML
└── rez-*-expert/                 # 8 industry experts
```

### Apps Connected
```
REZ-Consumer/do-app/services/REZConnector.js
StayOwn-Hospitality/Hotel-OTA/services/REZConnector.js
REZ-Media/adBazaar/services/REZConnector.js
REZ-Consumer/Rendez/services/REZConnector.js
REZ-Merchant/rez-app-merchant/services/REZConnector.js
```

---

## QUICK START

### 1. Start All Services
```bash
cd REZ-Intelligence
docker-compose up -d
```

### 2. Test Agent OS
```bash
curl -X POST http://localhost:4100/api/message \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","message":"Book a table for 2"}'
```

### 3. Test ML
```bash
curl -X POST http://localhost:4080/api/predict/churn \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","engagement_score":2}'
```

### 4. Connect App
```javascript
import { DOAppClient } from '@rez/agent-os-sdk';

const doApp = new DOAppClient({
  userId: 'user123',
  baseUrl: 'http://localhost:4100'
});

await doApp.chat('Book a massage');
```

---

## PORTS REFERENCE

| Port | Service |
|------|---------|
| 27017 | MongoDB |
| 6379 | Redis |
| 4000 | Auth Service |
| 4001 | Payment Service |
| 4003 | Order Service |
| 4004 | Wallet Service |
| 4008 | Event Platform |
| 4010 | WhatsApp Bridge |
| 4011 | Agent Registry |
| 4015 | Orchestrator v2 |
| 4033 | Support Copilot |
| 4040 | Reorder Engine |
| 4041 | Taste Profile |
| 4042 | Demand Forecast |
| 4043 | Price Predictor |
| 4050 | Intent Graph |
| 4051 | Memory Engine |
| 4052 | AI Router |
| 4060 | Knowledge Graph |
| 4061 | Merchant Brain |
| 4062 | Autonomous Agents |
| 4070 | Payments Brain |
| 4071 | Inventory Sync |
| 4072 | Creator Network |
| 4073 | Merchant OS |
| 4080 | ML Production |
| 4100 | Agent OS |
| 4101 | Universal User Graph |
| 4105 | Data Warehouse |
| 4110 | A/B Testing |
| 3003 | Expert Services |

---

## SUPPORT

For issues, contact the REZ Intelligence team.

---

## CHANGELOG

### v3.0 (May 12, 2026)
- Agent OS v3.0 with Voice, Credit, POS
- Real ML models (Churn, LTV)
- Universal User Graph
- Integration SDK
- 8 Industry Experts
- A/B Testing
- Data Warehouse

### v2.0 (May 11, 2026)
- 25 Intelligence Services
- Autonomous Agents (30)
- Support Copilot
- Event Bus
- Docker Compose deployment

### v1.0 (Earlier)
- Core services built

---

*This is the Source of Truth for the REZ Ecosystem.*

---

## COMPETITIVE GAPS

### Critical Gaps vs Industry Leaders

| Gap | Competitor | Revenue Impact | Build Time |
|-----|------------|--------------|------------|
| **Referral System | Referred, Exfr | High | 2 weeks |
| **SMS Marketing | Klaviyo, Attent | High | 2 weeks |
| **Loyalty Program | Smile.io, Yotpo | Medium | 2 weeks |
| **Merchant Banking | Stripe Balance, Mercury | High | 3 weeks |
| **Delivery Tracking | Onfleet, RoadWarrior | Medium | 3 weeks |
| **Gift Cards | Giftbit | Medium | 2 weeks |
| **POS Hardware | Square, Toast | High | 4 weeks |
| **Kitchen Display | Chownow, TouchBistro | Medium | 3 weeks |

### Missing vs Competitors

| Feature | REZ | Shopify | Stripe | Intercom | Klaviyo |
|---------|-----|---------|-------|---------|---------|
| Payments | Yes | Yes | Yes | No | No |
| POS | Partial | Yes | Yes | No | No |
| AI Chat | Yes | Yes | No | Yes | No |
| Fraud Detection | Rules | ML | ML | No | No |
| Marketing | No | Yes | No | Yes | Yes |
| Loyalty | No | Yes | No | No | Yes |
| Referrals | No | Yes | No | Yes | Yes |
| Banking | No | Yes | Yes | No | No |
| Marketplace | No | Yes | Yes | No | No |
| Delivery Tracking | No | Yes | No | No | No |
| Hardware Integration | No | Yes | Yes | No | No |

### Top 5 to Build Next

1. **Referral System** - Viral growth engine
2. **SMS Marketing** - Recovery campaigns
3. **Loyalty Program** - Retention engine
4. **Merchant Banking** - Financial services
5. **Delivery Tracking** - Real-time updates

### Competitive Position

| Tier | REZ | vs Startup |
|------|-----|-------------|
| Tier 1 (Revenue) | Payments, Orders, Events | = Competitors |
| Tier 2 (AI) | Agents, Intelligence | > Competitors |
| Tier 3 (Growth | Missing referral, loyalty, marketing | < Competitors |
| Tier 4 (Ops | Missing delivery, hardware, kitchen | < Competitors |

---

## ROADMAP

### Phase 1 (Current)
- [x] 25 Intelligence Services
- [x] 8 Expert Systems
- [x] Agent OS
- [x] ML Models
- [x] Integration SDK
- [x] Docker Compose

### Phase 2 (Next 3 months)
- [ ] Referral System
- [ ] SMS Marketing
- [ ] Loyalty Program
- [ ] Merchant Banking
- [ ] Delivery Tracking

### Phase 3 (Next 6 months)
- [ ] Gift Cards
- [ ] POS Hardware Integration
- [ ] Kitchen Display System
- [ ] Waitlist Management
- [ ] Staff Scheduling

### Phase 4 (Next 12 months)
- [ ] Multi-vendor Marketplace
- [ ] Restaurant POS
- [ ] Healthcare vertical
- [ ] Travel vertical
- [ ] Enterprise features
