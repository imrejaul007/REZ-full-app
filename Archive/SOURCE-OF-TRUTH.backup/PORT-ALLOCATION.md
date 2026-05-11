# ReZ Ecosystem - Port Allocation
**Date:** May 4, 2026
**Status:** OFFICIAL

---

## Port Ranges

| Range | Purpose |
|-------|---------|
| 3000-3099 | Infrastructure & Gateway |
| 3100-3999 | Worker Services |
| 4000-4099 | HTTP API Services |
| 4100-4199 | Health Check Ports |
| 4200-4999 | Specialized Services |
| 5000+ | Reserved |

---

## Infrastructure (3000-3099)

| Port | Service | Status |
|------|---------|--------|
| 3000 | API Gateway | ✅ |
| 3001 | Socket Service | ✅ |
| 3002 | Notification Events | ✅ |
| 3003 | RESERVED | - |
| 3004 | Gamification Service | ✅ |
| 3005 | Catalog Service | ✅ |
| 3006 | Order Service | ✅ |
| 3007 | RESERVED | - |
| 3008 | Insights Service | ✅ |
| 3009 | StayOwn Service | ✅ |
| 3010 | AdBazaar | ✅ |
| 3011 | Insights Service | ✅ |
| 3012 | Scheduler Service | ✅ |
| 3013-3019 | RESERVED | - |
| 3020-3099 | Available | - |

---

## HTTP API Services (4000-4099)

| Port | Service | Status |
|------|---------|--------|
| 4000 | Marketing Service | ✅ |
| 4001 | Payment Service | ✅ |
| 4002 | Auth Service | ✅ |
| 4003 | Search Service | ✅ |
| 4004 | Wallet Service | ✅ |
| 4005 | Merchant Service | ✅ |
| 4006 | Finance Service | ✅ |
| 4007 | Ads Service | ✅ |
| 4008-4009 | RESERVED | - |
| 4010 | Feedback Service | ✅ |
| 4011 | Karma Service | ✅ |
| 4012-4019 | RESERVED | - |
| 4020 | Intelligence Hub | ✅ |
| 4021-4024 | RESERVED | - |
| 4025 | Knowledge Base Service | ✅ |
| 4026-4029 | RESERVED | - |
| 4030 | Corporate Service | ✅ |
| 4031-4099 | Available | - |

---

## Health Check Ports (4100-4199)

| Port | Service | Status |
|------|---------|--------|
| 4101 | Payment Service | ✅ |
| 4102 | Auth Service | ✅ |
| 4103 | Search Service | ✅ |
| 4105 | Finance Service | ✅ |
| 4112 | Scheduler Service | ✅ |
| 4100, 4104, 4106-4199 | Available | - |

---

## Specialized Services (4200-4999)

| Port | Service | Status |
|------|---------|--------|
| 4000-4099 | Primary Range | See above |
| 4200-4999 | Available | - |

---

## Conflict Resolution

### Known Conflicts (To Fix)

| Conflict | Resolution | Status |
|----------|------------|--------|
| media-events (3006) | Media events should use 3013 | PENDING |
| analytics-events (3002) | Analytics should use 3014 | PENDING |

### Recommended Fixes

```bash
# media-events
export PORT=3013

# analytics-events
export PORT=3014
```

---

## Docker Port Mappings

```yaml
services:
  auth-service:
    ports:
      - "4002:4002"  # HTTP API
      - "4102:4102"  # Health check

  payment-service:
    ports:
      - "4001:4001"
      - "4101:4101"

  wallet-service:
    ports:
      - "4004:4004"

  order-service:
    ports:
      - "3006:3006"

  merchant-service:
    ports:
      - "4005:4005"

  notification-events:
    ports:
      - "3002:3002"

  socket-service:
    ports:
      - "3001:3001"
```

---

## External Services

| Service | Port | Protocol |
|---------|------|----------|
| MongoDB | 27017 | TCP |
| MongoDB Replica | 27018, 27019 | TCP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Redis Sentinel | 26379 | TCP |

---

## Development Ports

| Service | Dev Port |
|---------|---------|
| Next.js apps | 3000-3010 |
| Expo/React Native | 19000+ |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│                    PORT ALLOCATION                           │
├─────────────────┬─────────────────────────────────────────┤
│ 3000-3009      │ Infrastructure (Gateway, Socket, Queue) │
│ 3010-3099      │ Worker Services                         │
│ 4000-4009      │ Core APIs (Auth, Payment, Wallet)       │
│ 4010-4029      │ Specialized (Feedback, Karma, AI)       │
│ 4030+          │ Enterprise (Corporate, Integration)     │
│ 4100-4199      │ Health Checks                           │
└─────────────────┴─────────────────────────────────────────┘
```

---

*Generated: May 4, 2026*
