# Production Deployment

## Prerequisites
- Docker
- Kubernetes cluster (or Docker Compose for single node)
- MongoDB 7.0+
- Redis 7.0+

## Quick Start

```bash
# Copy environment
cp .env.prod.example .env.prod

# Edit with real values
vim .env.prod

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps
```

## Services

| Service | Port | Database |
|---------|------|----------|
| Analytics v2 | 3010 | rez_prod_analytics |
| Staff | 3011 | rez_prod_staff |
| Delivery | 3012 | rez_prod_delivery |
| Capital | 3013 | rez_prod_capital |
| CorpPerks | 3014 | rez_prod_corpperks |
| Merchant | 4005 | rez_prod |
| Order | 4012 | rez_prod_orders |
| Payment | 4008 | rez_prod_payments |
