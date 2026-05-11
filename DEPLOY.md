# REZ Loyalty Ecosystem - Deployment Guide

## Prerequisites

### 1. Install Docker

**macOS:**
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER
```

**Windows:**
Download Docker Desktop from: https://www.docker.com/products/docker-desktop

### 2. Verify Installation
```bash
docker --version
docker-compose --version
```

---

## Quick Start

### Option 1: One-Command Deploy

```bash
# Navigate to project
cd "/Users/rejaulkarim/Documents/ReZ Full App"

# Start all services
docker-compose -f docker-compose.loyalty-complete.yml up -d

# Check status
docker-compose -f docker-compose.loyalty-complete.yml ps
```

### Option 2: Using Deployment Script

```bash
# Make executable
chmod +x deploy-loyalty.sh

# Start services
./deploy-loyalty.sh up

# Check status
./deploy-loyalty.sh status

# View logs
./deploy-loyalty.sh logs

# Stop services
./deploy-loyalty.sh down
```

---

## Service URLs

| Service | Port | URL |
|---------|------|-----|
| DLQ Dashboard | 3000 | http://localhost:3000 |
| Profile Aggregator | 4025 | http://localhost:4025/health |
| Streak Service | 4026 | http://localhost:4026/health |
| Cross-Merchant | 4027 | http://localhost:4027/health |
| ReZ Score | 4028 | http://localhost:4028/health |
| Karma-Loyalty Bridge | 4029 | http://localhost:4029/health |
| Monitoring | 4030 | http://localhost:4030/health |
| Event Bus | 4031 | http://localhost:4031/health |
| Notifications | 4032 | http://localhost:4032/health |
| Identity Service | 4033 | http://localhost:4033/health |
| Webhooks | 4034 | http://localhost:4034/health |

---

## Environment Configuration

Edit `.env.loyalty` file:

```bash
# Database
MONGO_USER=admin
MONGO_PASSWORD=your-secure-password

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=your-password

# External Services (optional)
FCM_SERVER_KEY=your-fcm-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

---

## Verify Deployment

### Health Checks
```bash
# Check all services
curl http://localhost:4025/health
curl http://localhost:4026/health
curl http://localhost:4028/health
```

### View Logs
```bash
docker-compose -f docker-compose.loyalty-complete.yml logs -f
```

### Service Status
```bash
docker-compose -f docker-compose.loyalty-complete.yml ps
```

---

## Common Commands

```bash
# Start services
docker-compose -f docker-compose.loyalty-complete.yml up -d

# Stop services
docker-compose -f docker-compose.loyalty-complete.yml down

# Restart services
docker-compose -f docker-compose.loyalty-complete.yml restart

# Rebuild and start
docker-compose -f docker-compose.loyalty-complete.yml up -d --build

# View logs for specific service
docker-compose -f docker-compose.loyalty-complete.yml logs -f profile-aggregator

# Scale a service
docker-compose -f docker-compose.loyalty-complete.yml up -d --scale profile-aggregator=3
```

---

## Troubleshooting

### Services not starting
```bash
# Check Docker is running
docker ps

# Check logs
docker-compose -f docker-compose.loyalty-complete.yml logs

# Rebuild without cache
docker-compose -f docker-compose.loyalty-complete.yml build --no-cache
```

### Port conflicts
If ports are already in use:
```bash
# Edit docker-compose.loyalty-complete.yml and change ports
# Or stop other services using those ports
```

### Database connection issues
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Check logs
docker logs rez-mongodb
```

---

## Cloud Deployment

### AWS ECS
```bash
# Install AWS CLI and ECS CLI
aws ecs create-cluster --cluster-name rez-loyalty

# Deploy using ECS CLI
ecs-cli compose -f docker-compose.loyalty-complete.yml up
```

### Google Cloud Run
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/rez-loyalty

# Deploy
gcloud run deploy rez-loyalty --image gcr.io/PROJECT_ID/rez-loyalty
```

### Render.com (Already configured)
The services have `render.yaml` files. Connect to Render and deploy.

### Railway.app
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login

# Deploy
railway init
railway up
```

---

## Monitoring

### Prometheus Metrics
Metrics available at:
- http://localhost:4030/metrics

### Grafana Dashboard
Import dashboard from `grafana/dashboards/loyalty.json`

---

## Support

For issues, check:
1. Docker logs: `docker-compose logs`
2. Service health: `curl http://localhost:PORT/health`
3. MongoDB: `docker logs rez-mongodb`
4. Redis: `docker logs rez-redis`
