# OPERATOR SPEC - QR Systems

**Version:** 1.0  
**Date:** May 3, 2026

---

# REZ NOW (now.rez.money/{slug})

## API: Scan → Pay → Earn → Discover

```
POST /api/v1/scan
├── Body: { uid, signature, userId, deviceId, location }
├── Validates signature
├── Awards coins
└── Returns merchant + offers

POST /api/payments/initiate
├── UPI/Card/Wallet
├── Idempotent (retry-safe
└── Webhook delivery <5s

GET /api/loyalty/profile
├── Rewards history
├── Tier status
└── Active offers

POST /api/offers/claim
├── Instant credit
└── Push notification
```

## REZ WEB MENU (web-menu.rez.money/{slug}

```
POST /api/orders
├── Cart validation
├── Inventory check
├── Kitchen queue
└── Payment link

PUT /api/orders/{id}/status
├── Preparing → Ready → Served
└── Socket.io broadcast

POST /api/table/{code}/join
├── 6-char code
├── Max 10 per table
└── Real-time sync

GET /api/orders/{id}/tracking
├── Live status
├── Estimated time
└── Staff updates
```

## ROOM QR (room.rez.money/{hotel}/{room}

```
GET /api/room/{hotel}/{room}
├── JWT validation
├── Services available
└── Guest profile

POST /api/requests
├── Priority queue
├── SLA tracking
├── Auto-assign staff
└── Push to hotel

POST /api/checkout
├── Folio review
├── Pay via wallet/card/UPI
└── Invoice PDF

Socket.io: room:{roomId}
├── request:created
├── request:status
└── checkout:completed
```

## ADS QR (adsqr.rez.money/c/{campaignId})

```
POST /api/attribution/scan
├── Device fingerprint
├── GPS validation
├── Fraud check
└── Reward check

POST /api/rewards/claim
├── Attribution match
├── Budget check
└── Instant credit

GET /api/campaigns/{id}/stats
├── Scans
├── Conversions
├── ROI
└── Fraud rate
```

---

# OPERATOR RULES

## Fraud Detection

| Rule | Threshold | Action |
|------|------------|--------|
| Velocity | >5 scans/device/hour | Flag |
| Impossible travel | >100km/hour | Block |
| Repeat device | Same QR, different users | Flag |
| GPS mismatch | >1km from declared | Flag |

## SLA Targets

| Operation | Target |
|-----------|---------|
| Scan verification | <2s |
| Payment initiation | <1s |
| Kitchen notification | <3s |
| Room request assign | <5s |
| Push delivery | <10s |
| Analytics dashboard | Real-time |

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Offline user | Queue action, sync on connect |
| Duplicate scan | Idempotency key |
| Expired campaign | Show "Campaign ended" |
| Zero inventory | Block add to cart |
| Payment timeout | 5min cleanup job |

---

# METRICS

| KPI | Target |
|-----|--------|
| Scan → Payment | <2s p99 |
| Order → Kitchen | <3s |
| Request → Staff notify | <5s |
| Fraud detection | <1s |
| Coin credit | <2s |
| Dashboard refresh | Real-time |

---

# DEPLOYMENT

```bash
# Environments
development → staging → production

# Branches
main → staging → production

# Secrets
JWT_SECRET, REDIS_URL, DATABASE_URL, WHATSAPP_TOKEN
```
