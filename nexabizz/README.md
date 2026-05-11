# NextaBiZ - B2B Procurement Platform

> **Business procurement marketplace connecting buyers with suppliers**

---

## Overview

NextaBiZ is a B2B procurement platform enabling businesses to manage purchasing, supplier relationships, and supply chain operations.

---

## Features

### For Buyers
- Catalog browsing with advanced filtering
- Request for Quotes (RFQ)
- Purchase order management
- Inventory signals (low stock alerts)
- Credit line (BNPL)
- Multiple supplier comparison

### For Suppliers
- Supplier portal for product listings
- Order fulfillment dashboard
- Inventory management
- Scoring engine feedback
- Payment settlement tracking

### Core Services
- Reorder engine (automated replenishment)
- Scoring engine (supplier/buyer ratings)
- Payment settlement service

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 |
| Monorepo | Turborepo + pnpm |
| Database | Supabase |
| Auth | NextAuth.js |
| Payments | Stripe |

### Monorepo Structure

```
apps/web (B2B dashboard)
apps/supplier-portal
packages/shared-types
packages/webhook-sdk
packages/rez-auth-client
services/reorder-engine
services/scoring-engine
services/payment-settlement
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account
- Stripe account

### Installation

```bash
cd nexabizz
pnpm install
```

### Configuration

```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
REZ_AUTH_URL=https://rez-auth-service.onrender.com
```

### Development

```bash
pnpm dev
```

---

## Project Structure

```
nexabizz/
├── apps/
│   ├── web/                 # Main B2B dashboard
│   │   ├── src/
│   │   │   ├── app/       # Next.js App Router
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── supplier-portal/    # Supplier-facing app
│       └── package.json
│
├── packages/
│   ├── shared-types/       # TypeScript types
│   ├── webhook-sdk/        # Webhook utilities
│   └── rez-auth-client/    # REZ auth integration
│
├── services/
│   ├── reorder-engine/      # Automated reordering
│   ├── scoring-engine/      # Rating system
│   └── payment-settlement/  # BNPL processing
│
├── turbo.json              # Turborepo config
├── pnpm-workspace.yaml     # Workspace config
└── package.json
```

---

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product |
| PUT | `/api/products/:id` | Update product |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order |
| PUT | `/api/orders/:id` | Update order |

### RFQ
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rfq` | Create RFQ |
| GET | `/api/rfq/:id` | Get RFQ |
| POST | `/api/rfq/:id/quotes` | Submit quote |

---

## REZ Integration

NextaBiZ integrates with the REZ ecosystem:

| Service | Integration |
|---------|-------------|
| **OAuth2** | SSO via REZ Auth |
| **Merchant** | Merchant lookup |
| **Intent Graph** | AI recommendations |

### Environment Variables

```env
REZ_AUTH_URL=https://rez-auth-service.onrender.com
REZ_MERCHANT_URL=https://rez-merchant-service.onrender.com
REZ_INTENT_URL=https://rez-intent-graph.onrender.com
```

---

## Deployment

### Vercel

```bash
# Connect GitHub repo to Vercel
vercel --prod
```

### Services

Deploy individual services:
```bash
cd services/reorder-engine && npm start
cd services/scoring-engine && npm start
cd services/payment-settlement && npm start
```

---

## Documentation

- [API Documentation](docs/API.md)
- [Integration Guide](docs/INTEGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## Related Products

| Product | Purpose |
|---------|---------|
| **CorpPerks** | Enterprise benefits |
| **REZ** | Consumer app |
| **BizOS** | Merchant software |

---

**Powered by ReZ Mind** - AI-powered commerce intelligence
