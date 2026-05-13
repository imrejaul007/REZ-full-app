# REZ ECOSYSTEM - DOCUMENTATION INDEX

**Last Updated:** May 12, 2026

---

# QUICK START

## What is REZ?

REZ is a **Social Commerce Infrastructure Platform** with 200+ microservices providing:

- **Multi-Channel** communication (WhatsApp, Voice, Instagram, Website, App)
- **Multi-Agent** AI system (16+ specialized agents)
- **Commerce** platform (Orders, Payments, Wallet, Booking)
- **Intelligence** engine (ML, Recommendations, Personalization)

---

# DOCUMENTATION

## 1. STATE OF THE SYSTEM (SOT)

### Main Documentation
| Document | Description |
|---------|-------------|
| **[SOT-STATE-OF-THE-SYSTEM.md](SOT-STATE-OF-THE-SYSTEM.md)** | Complete system inventory, all 200+ services, ports, integrations |
| **[REZ-VISUAL-ARCHITECTURE.md](REZ-VISUAL-ARCHITECTURE.md)** | Visual diagrams of architecture, layers, flows |

### Architecture
| Document | Description |
|---------|-------------|
| **[REZ-AGENT-OS-v3-ARCHITECTURE.md](REZ-AGENT-OS-v3-ARCHITECTURE.md)** | Enterprise multi-agent architecture, priority hierarchy, confidence scoring |
| **[REZ-MULTI-AGENT-ARCHITECTURE-PLAN.md](REZ-MULTI-AGENT-ARCHITECTURE-PLAN.md)** | Multi-agent system design |

## 2. INTEGRATION

| Document | Description |
|---------|-------------|
| **[REZ-INTEGRATION-SPECS.md](REZ-INTEGRATION-SPECS.md)** | Service-to-service API contracts, data flows |
| **[SPEC-INSTAGRAM-INTEGRATION.md](SPEC-INSTAGRAM-INTEGRATION.md)** | Instagram channel integration spec |

## 3. COMMERCE

| Document | Description |
|---------|-------------|
| **[SPEC-WHATSAPP-STORE.md](SPEC-WHATSAPP-STORE.md)** | WhatsApp in-chat commerce |
| **[SPEC-WHATSAPP-COMMERCE.md](SPEC-WHATSAPP-COMMERCE.md)** | WhatsApp commerce features |

## 4. MASTER PLANS

| Document | Description |
|---------|-------------|
| **[REZ-UNIFIED-COMMS-MASTER-PLAN.md](REZ-UNIFIED-COMMS-MASTER-PLAN.md)** | Master plan for unified communications |

---

# SYSTEM OVERVIEW

## Services by Repository

### REZ-Intelligence (60+ services)
**Location:** `/REZ-Intelligence/`

| Category | Services |
|-----------|----------|
| **Orchestration** | Orchestrator v2, Context Engine, Core Brain, Event Bus |
| **Domain Experts** | Hospitality, Culinary, Fitness, Health, Travel, Retail, Salon, Education |
| **Functional Experts** | Sales, Support, Consultant, Info |
| **AI/ML** | ML Models, Recommendation Engine, Personalization Engine, Intent Predictor |
| **Infrastructure** | Agent Registry, Permission System, Priority Engine, Confidence Scorer |

### REZ-Media (40+ services)
**Location:** `/REZ-Media/`

| Category | Services |
|-----------|----------|
| **WhatsApp** | WhatsApp Store, WhatsApp Commerce, WhatsApp Provisioning |
| **Instagram** | Instagram Bridge, Instagram Sales Agent |
| **Marketing** | Marketing Dashboard, Automation Service, Attribution Dashboard |
| **Creative** | Creative Engine |

### RABTUL-Technologies (50+ services)
**Location:** `/RABTUL-Technologies/`

| Category | Services |
|-----------|----------|
| **Payments** | Payment Service, Wallet Service, Bill Payments |
| **Orders** | Order Service, Booking Service, Delivery Service |
| **Commerce** | Catalog Service, Search Service, Inventory |
| **Engagement** | Notifications Service, Gamification Service |
| **Analytics** | Analytics Service |
| **Auth** | Auth Service |

---

# KEY ARCHITECTURE

## Layer Architecture

```
USER INTERFACE
    │
    ├── WhatsApp
    ├── Voice
    ├── Instagram
    ├── Website
    └── App

CHANNEL BRIDGE LAYER
    │
    └── WhatsApp/Voice/Instagram/Web/App Bridges

ORCHESTRATION LAYER
    │
    ├── Orchestrator v2
    ├── Priority Engine
    ├── Confidence Scorer
    ├── Context Engine
    └── Event Bus

AGENT LAYER
    │
    ├── Domain Experts (8)
    │   ├── Hospitality
    │   ├── Culinary
    │   ├── Fitness
    │   ├── Health
    │   ├── Travel
    │   ├── Retail
    │   ├── Salon
    │   └── Education
    │
    └── Functional Experts (8)
        ├── Support
        ├── Sales
        ├── Loyalty
        ├── Fraud
        ├── Wallet
        ├── Analytics
        ├── Campaign
        └── Notification

COMMERCE LAYER
    │
    ├── Payment
    ├── Wallet
    ├── Order
    ├── Booking
    ├── Catalog
    ├── Search
    └── Delivery

INFRASTRUCTURE LAYER
    │
    ├── MongoDB
    ├── Redis
    ├── Kafka
    ├── Auth
    ├── Circuit Breaker
    └── Retry
```

---

# SERVICE PORTS

| Port Range | Service Type |
|------------|-------------|
| 3000-3010 | Expert Agents |
| 4001 | Payment Service |
| 4018 | Auth Service |
| 4020 | Booking Service |
| 4023 | Notification Service |
| 4024 | Search Service |
| 4026 | Marketing Service |
| 4070 | Orchestrator |
| 4071 | Context Engine |
| 4072 | Core Brain |
| 4073 | Agent Registry |
| 4076 | WhatsApp Bridge |
| 4080 | Priority Engine |
| 4081 | Confidence Scorer |
| 4082 | Event Bus |
| 4084 | Permission System |
| 4090 | Instagram Bridge |
| 4100 | Validation Dashboard |
| 4102 | ML Models |

---

# QUICK COMMANDS

## Start All Services
```bash
cd REZ-Intelligence && ./start-all.sh
```

## Start Individual Services
```bash
# Core services
cd rez-core-brain && npm run dev
cd rez-orchestrator-v2 && npm run dev
cd rez-context-engine && npm run dev

# Expert agents
cd rez-culinary-expert && npm run dev
cd rez-hospitality-expert && npm run dev

# Commerce
cd ../RABTUL-Technologies/rez-payment-service && npm run dev
cd ../RABTUL-Technologies/rez-order-service && npm run dev
```

## Environment Variables
```bash
# Common
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rez
REDIS_URL=redis://localhost:6379

# Auth
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}

# Service-specific
CORE_BRAIN_URL=http://localhost:4072
ORCHESTRATOR_URL=http://localhost:4070
```

---

# TROUBLESHOOTING

## Service Not Responding
```bash
# Check if service is running
curl http://localhost:PORT/health

# Check logs
tail -f logs/app.log
```

## Database Connection Issues
```bash
# Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# Check Redis
redis-cli ping
```

## Event Bus Issues
```bash
# Check Kafka
kafka-topics.sh --list --bootstrap-server localhost:9092

# Check Redis pub/sub
redis-cli PSUBSCRIBE '*'
```

---

# API ENDPOINTS

## Core Services

| Service | Base URL | Key Endpoint |
|---------|----------|--------------|
| Orchestrator | http://localhost:4070 | POST /api/message |
| Core Brain | http://localhost:4072 | GET /api/memory/:userId |
| Context Engine | http://localhost:4071 | POST /api/context |
| Event Bus | http://localhost:4082 | POST /api/events/publish |

## Expert Agents

| Expert | Base URL | Key Endpoint |
|--------|----------|--------------|
| Culinary | http://localhost:3001 | POST /api/chat |
| Hospitality | http://localhost:3000 | POST /api/chat |
| Fitness | http://localhost:3010 | POST /api/chat |

## Commerce

| Service | Base URL | Key Endpoint |
|---------|----------|--------------|
| Payment | http://localhost:4001 | POST /api/payments/initiate |
| Order | http://localhost:3008 | POST /api/orders |
| Booking | http://localhost:4020 | POST /api/bookings |
| Notification | http://localhost:4023 | POST /api/notifications/send |

---

# METRICS & MONITORING

## Health Checks
All services implement:
- GET /health - Basic health
- GET /health/detailed - With dependencies
- GET /health/ready - Kubernetes readiness

## Logs
- Format: JSON
- Location: logs/app.log
- Levels: error, warn, info, debug

## Metrics
- Exposed at /metrics (Prometheus format)

---

# SECURITY

## Authentication
- Internal services: X-Internal-Token header
- External APIs: JWT tokens

## Rate Limiting
- Per-service configurable
- Default: 100 requests/minute

## Circuit Breaker
- Threshold: 5 failures
- Reset timeout: 60 seconds

---

# NEXT STEPS

1. **Verify services** - Run npm install in each service
2. **Configure .env** - Copy .env.example to .env
3. **Start infrastructure** - MongoDB, Redis, Kafka
4. **Start services** - Use ./start-all.sh
5. **Test integration** - Send test message through orchestrator

---

# CONTACT & SUPPORT

For issues or questions:
1. Check service logs
2. Verify environment variables
3. Check infrastructure (MongoDB, Redis)
4. Review API contracts in REZ-INTEGRATION-SPECS.md

---

**REZ Ecosystem - Building the Future of Social Commerce**
