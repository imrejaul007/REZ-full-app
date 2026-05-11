# AdBazaar

> **Advertising marketplace with QR-based campaign tracking**

---

## Overview

AdBazaar is an advertising platform that enables businesses to create QR code campaigns, track attribution, and reward users with coins. Key features:

- **Campaign Management** - Create, pause, and manage ad campaigns
- **QR Generation** - Single and bulk QR code generation
- **Attribution Tracking** - Track scans, visits, and purchases
- **Reward System** - Coin rewards for user engagement
- **Analytics Dashboard** - ROI metrics and campaign performance

---

## Features

### Campaign Management

| Feature | Description |
|---------|-------------|
| Campaign Creation | Name, landing URL, budget, rewards |
| Status Control | Draft, active, paused, completed |
| Budget Tracking | Real-time spend monitoring |
| Multiple Landing Pages | 3 template options |

### QR System

| Feature | Description |
|---------|-------------|
| Single QR | Generate individual codes |
| Bulk QR | Generate up to 1000 codes per campaign |
| QR Customization | Logo, colors, size |
| QR Tracking | Per-code scan analytics |

### Attribution

| Feature | Description |
|---------|-------------|
| Multi-Step Tracking | Scan → Visit → Purchase |
| GPS Verification | Location-based visit confirmation |
| Cookie/Local Storage | Cross-device tracking |
| Attribution Window | Configurable (7/14/30 days) |

### Rewards

| Feature | Description |
|---------|-------------|
| Scan Rewards | Coins for scanning |
| Visit Rewards | Coins for visiting store |
| Purchase Rewards | Coins for completed purchase |
| Automatic Payout | Coin crediting via wallet |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- ReZ Wallet Service (for coins)

### Installation

```bash
cd adBazaar
npm install
```

### Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

REZ_WALLET_URL=http://localhost:3002
REZ_AUTH_URL=http://localhost:3001
INTERNAL_SERVICE_TOKEN=your-internal-token
```

### Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
adBazaar/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── campaigns/
│   │   │   ├── page.tsx          # Campaign list
│   │   │   ├── new/             # Create campaign
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Campaign details
│   │   │       ├── edit/        # Edit campaign
│   │   │       └── qrcodes/     # QR management
│   │   ├── analytics/
│   │   │   └── page.tsx         # Attribution data
│   │   ├── rewards/
│   │   │   └── page.tsx         # Reward history
│   │   └── api/
│   │       ├── campaigns/
│   │       ├── qrcodes/
│   │       ├── scan/
│   │       └── rewards/
│   │
│   ├── components/
│   │   ├── CampaignCard.tsx
│   │   ├── QRGenerator.tsx
│   │   ├── QRScanner.tsx
│   │   ├── RewardBadge.tsx
│   │   ├── AnalyticsChart.tsx
│   │   └── BulkQRModal.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── qrcode.ts
│   │   └── api.ts
│   │
│   └── types/
│       ├── campaign.ts
│       ├── qrcode.ts
│       └── attribution.ts
│
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql
│       └── 002_attribution_tracking.sql
│
├── public/
│   └── images/
│
├── package.json
└── README.md
```

---

## QR Code Format

```
rez://ad/{campaignId}?source=qr
```

Landing page URL:
```
{APP_URL}/campaign/{campaignId}?ref={qrSlug}
```

---

## API Endpoints

### Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns` | List campaigns |
| GET | `/api/campaigns/:id` | Get campaign |
| PUT | `/api/campaigns/:id` | Update campaign |
| DELETE | `/api/campaigns/:id` | Delete campaign |

### QR Codes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/campaigns/:id/qr` | Generate single QR |
| POST | `/api/campaigns/:id/qr/bulk` | Generate bulk QRs |
| GET | `/api/qrcodes/:id` | Get QR details |
| GET | `/api/qrcodes/:id/stats` | Get QR stats |

### Attribution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan/:slug` | Record scan |
| POST | `/api/visit` | Record visit |
| POST | `/api/purchase` | Record purchase |
| GET | `/api/analytics/attribution` | Get ROI metrics |

### Rewards

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rewards/claim` | Claim reward |
| GET | `/api/rewards/history` | Reward history |
| GET | `/api/rewards/balance` | Coin balance |

---

## Database Schema

### campaigns
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  landing_url TEXT,
  landing_template VARCHAR(50) DEFAULT 'basic',
  budget DECIMAL(12,2) NOT NULL,
  spent DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  rewards JSONB DEFAULT '{
    "scan": 0,
    "visit": 0,
    "purchase": 0
  }',
  start_date DATE,
  end_date DATE,
  attribution_window INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### qr_codes
```sql
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  qr_url TEXT,
  location VARCHAR(255),
  batch_id UUID,
  scan_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### scan_events
```sql
CREATE TABLE scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  user_id UUID,
  device_type VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  location VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### visit_events
```sql
CREATE TABLE visit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_event_id UUID REFERENCES scan_events(id),
  user_id UUID,
  verified BOOLEAN DEFAULT false,
  location VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### purchase_events
```sql
CREATE TABLE purchase_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_event_id UUID REFERENCES scan_events(id),
  user_id UUID,
  amount DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'INR',
  transaction_id VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### coin_transactions
```sql
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  amount INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Testing

```bash
# Run integration tests
npx tsx ../scripts/test-qr-integration.ts

# Test campaign creation
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "budget": 10000,
    "landingUrl": "https://example.com"
  }'

# Test QR scan
curl -X POST http://localhost:3000/api/scan/test-slug \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123", "deviceType": "mobile"}'
```

---

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Required environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `REZ_WALLET_URL`
- `REZ_AUTH_URL`
- `INTERNAL_SERVICE_TOKEN`

---

## Related Documentation

- [AdsQr README](../adsqr/README.md) - Campaign management app
- [QR Systems Complete Guide](../docs/QR-SYSTEMS-COMPLETE-GUIDE.md)
- [Quick Start Guide - Ads QR](../docs/QUICK-START/ADS-QR.md)
- [Environment Variables](../docs/ENV-VARIABLES.md)
- [Deployment Guide](../docs/DEPLOYMENT-GUIDE.md)

---

**Powered by ReZ Mind** - AI-powered commerce intelligence
