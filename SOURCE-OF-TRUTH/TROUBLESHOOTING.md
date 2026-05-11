# ReZ Full App Troubleshooting Guide

## Common Issues

### Authentication Issues

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Token expiration | 401 errors, redirect to login | Refresh token or re-authenticate |
| CORS errors | Preflight failures, blocked requests | Verify `ALLOWED_ORIGINS` env var |
| Session timeout | User logged out unexpectedly | Check `SESSION_TIMEOUT` setting |

### Database Connection Issues

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Connection timeout | `ETIMEDOUT` errors | Verify `DB_HOST`, `DB_PORT` |
| Authentication failed | `ER_ACCESS_DENIED_ERROR` | Check `DB_USER`, `DB_PASSWORD` |
| Database not found | `ER_BAD_DB_ERROR` | Verify `DB_NAME` exists |

### Service Startup Failures

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| Port already in use | `EADDRINUSE` errors | Kill process on port or change `PORT` |
| Missing env vars | Service crashes on start | Check `.env` file completeness |
| Memory limits | OOMKilled in containers | Increase memory allocation |

## How to Debug

### Step 1: Check Service Health
```bash
curl http://localhost:<PORT>/health
```

### Step 2: Review Recent Logs
```bash
# Docker
docker logs <container_name> --tail 100

# Kubernetes
kubectl logs <pod_name> --tail 100

# Local
tail -f logs/app.log
```

### Step 3: Verify Environment Configuration
```bash
# List all env vars (excluding secrets)
env | grep -v SECRET | grep -v PASSWORD
```

### Step 4: Check Resource Usage
```bash
# Memory and CPU
docker stats

# Disk space
df -h
```

### Step 5: Test Connectivity
```bash
# Database
pg_isready -h $DB_HOST -p $DB_PORT

# Redis
redis-cli -h $REDIS_HOST ping

# External APIs
curl -I https://api.example.com/health
```

## Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| API Gateway | `GET /health` | `{"status": "healthy"}` |
| Auth Service | `GET /health` | `{"status": "ok"}` |
| ML Feature Store | `GET /health` | `{"status": "healthy"}` |
| ML Model Registry | `GET /health` | `{"status": "up"}` |
| Ad Platform | `GET /api/health` | `{"ok": true}` |
| Training Data Service | `GET /health` | `{"healthy": true}` |

## Log Locations

### Local Development
```
/Users/rejaulkarim/Documents/ReZ Full App/logs/
├── app.log           # Application logs
├── error.log         # Error-only logs
├── access.log        # HTTP access logs
└── debug.log         # Debug-level logs
```

### Docker Containers
```bash
# View logs
docker logs <container_name>

# Follow in real-time
docker logs -f <container_name>

# Export logs
docker logs <container_name> > app.log
```

### Kubernetes
```bash
# Pod logs
kubectl logs <pod_name>

# Previous logs (if crashed)
kubectl logs <pod_name> --previous

# All pods in deployment
kubectl logs -l app=<service_name>
```

### Production (CloudWatch/S3)
```
CloudWatch Log Groups:
  - /aws/ecs/rez-api
  - /aws/ecs/rez-auth
  - /aws/ecs/rez-ml-feature-store
  - /aws/ecs/rez-ml-model-registry
  - /aws/ecs/rez-ad-platform
  - /aws/ecs/rez-training-data-service
```

## Metrics Endpoints

| Service | Endpoint | Metrics Available |
|---------|----------|-------------------|
| API Gateway | `GET /metrics` | Request rate, latency, errors |
| Auth Service | `GET /metrics` | Auth attempts, token issuance |
| ML Feature Store | `GET /metrics` | Feature retrieval latency |
| ML Model Registry | `GET /metrics` | Model load times, inference counts |
| Ad Platform | `GET /api/metrics` | Ad requests, CTR, revenue |
| Training Data Service | `GET /metrics` | Data processing throughput |

### Prometheus Metrics Format
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 12345

# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 10000
```

### Grafana Dashboards
Access Grafana at `http://localhost:3000` (local) or via cloud endpoint.

Key dashboards:
- **System Overview**: CPU, memory, disk I/O
- **Service Health**: Uptime, error rates
- **Request Tracing**: Distributed trace visualization
- **Business Metrics**: DAU, revenue, conversion rates

## Emergency Contacts

| Role | Escalation |
|------|------------|
| On-call Engineer | PagerDuty rotation |
| Database Admin | Slack: #db-support |
| Security Incidents | security@rez.ai |

## Recovery Procedures

### Complete Service Restart
```bash
# Docker Compose
docker-compose down && docker-compose up -d

# Kubernetes
kubectl rollout restart deployment/<service_name>
```

### Database Recovery
```bash
# Check replication status
psql -c "SELECT * FROM pg_stat_replication;"

# Point-in-time recovery
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME backup.dump
```

### Clear Cache
```bash
# Redis flush (use with caution)
redis-cli FLUSHALL

# Application cache clear
curl -X POST http://localhost:<PORT>/admin/cache/clear
```
