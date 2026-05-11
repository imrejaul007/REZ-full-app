# CorpPerks

**Enterprise Benefits Platform** - Part of the ReZ Ecosystem

> "One portal for companies to manage employee benefits, corporate spend, bookings, rewards, and impact initiatives."

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CorpPerks Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Admin Portal   │    │  Employee App (ReZ Karma)   │  │
│  │  (CorpPerks)    │    │  /karma/corp/*              │  │
│  └────────┬─────────┘    └────────────┬─────────────────┘  │
│           │                            │                      │
│           └──────────┬─────────────────┘                      │
│                      ▼                                      │
│         ┌───────────────────────────┐                       │
│         │  rez-corpperks-service   │ ← Port 4013          │
│         │  (Gateway API)           │                       │
│         └──────────┬────────────────┘                       │
│                    │                                       │
│    ┌───────────────┼───────────────┐                       │
│    │               │               │                       │
│    ▼               ▼               ▼                       │
│ ┌────────┐  ┌───────────┐  ┌────────────┐                  │
│ │ GST    │  │ Rewards   │  │ Campaigns  │                  │
│ │ Invoice│  │ & Tiers   │  │ Management │                  │
│ └────────┘  └───────────┘  └────────────┘                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Integration Layer                           │  │
│  │  ┌───────────┐  ┌────────────┐  ┌──────────────┐     │  │
│  │  │ Hotel OTA│  │ Procurement │  │ HRIS Sync    │     │  │
│  │  │Makcorps  │  │ NextaBizz  │  │ GreytHR     │     │  │
│  │  └───────────┘  └────────────┘  └──────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| **rez-corpperks-service** | 4013 | Gateway API |
| **rez-hotel-service** | 4011 | Makcorps proxy |
| **rez-procurement-service** | 4012 | NextaBizz proxy |

---

## Modules

| Module | Description |
|--------|-------------|
| **Benefits** | Meal, Travel, Wellness, Learning, Gift budgets |
| **Employees** | HRIS sync, enrollment, role-based access |
| **Hotel Bookings** | Makcorps OTA, GST-ready invoices |
| **GST Invoicing** | Invoice generation, GSTR-1 reports |
| **Corporate Gifting** | NextaBizz procurement, bulk orders |
| **Karma/CSR** | Volunteer campaigns, impact tracking |
| **ReZ Coins** | Tier system, milestone rewards |
| **Analytics** | Dashboard, reports |
| **Health** | Integration monitoring |
| **HRIS** | GreytHR, BambooHR, Zoho sync |

---

## Quick Start

### Docker Compose (Recommended)

```bash
# Copy env file
cp .env.example .env

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Manual

```bash
# CorpPerks Gateway
cd rez-corpperks-service && npm install && npm start

# Hotel Service
cd rez-hotel-service && npm install && npm start

# Procurement Service
cd rez-procurement-service && npm install && npm start
```

---

## API Endpoints

### Benefits & Employees
```
GET  /api/corp/benefits              List benefits
POST /api/corp/benefits              Create benefit
GET  /api/corp/employees             List employees
POST /api/corp/employees             Enroll employee
```

### Rewards
```
GET  /api/rewards/summary            My rewards
POST /api/rewards/award             Award coins
GET  /api/rewards/catalog           Reward catalog
POST /api/rewards/redeem            Redeem reward
```

### GST
```
POST /api/gst/calculate             Calculate GST
POST /api/gst/invoices              Create invoice
GET  /api/gst/invoices              List invoices
POST /api/gst/reports/gstr1         GSTR-1 report
```

### Hotels
```
GET  /api/hotels/search             Search hotels
POST /api/hotels/bookings           Create booking
```

### HRIS
```
GET  /api/hris/providers             List providers
POST /api/hris/connect              Connect HRIS
POST /api/hris/sync                 Sync employees
```

---

## SDK Usage

```bash
npm install @rez/corpperks-sdk
```

```typescript
import { CorpPerksClient } from '@rez/corpperks-sdk';

const corp = new CorpPerksClient({
  apiBaseUrl: 'https://api.rez.money',
  token: userToken,
});

// Benefits
const benefits = await corp.getMyBenefits();
const usage = await corp.getMyUsage();

// Hotels
const booking = await corp.createBooking({
  propertyId: 'P001',
  roomId: 'R001',
  checkIn: '2026-05-01',
  checkOut: '2026-05-05',
  guests: 1,
  guestDetails: [{ firstName: 'John', lastName: 'Doe', email: 'john@company.com' }],
});

// Rewards
const rewards = await corp.getMyRewards();
await corp.redeemReward('R001');
```

---

## Deploy

### Render (One-Click)

1. Go to [Render](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect GitHub and select this repo
4. Deploy

### Local Development

```bash
docker-compose -f docker-compose.yml up -d
```

---

## GitHub

**Repo:** `imrejaul007/CorpPerks`

---

## Part of ReZ Ecosystem

| Product | Purpose |
|---------|---------|
| **ReZ** | Consumer app |
| **BizOS** | Merchant software |
| **NextaBizz** | Business marketplace |
| **CorpPerks** | Enterprise layer |
| **RTMN Finance** | Corporate finance |
