# Troubleshooting Guide

## Common Issues

### Service Won't Start

#### Error: `Cannot connect to Redis`

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG

# If not, start Redis
docker run -d -p 6379:6379 redis:7-alpine
```

#### Error: `Cannot connect to MongoDB`

```bash
# Check MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# If not, start MongoDB
docker run -d -p 27017:27017 mongo:7
```

#### Error: `Port already in use`

```bash
# Find what's using the port
lsof -i :4009

# Kill the process
kill -9 <PID>
```

### Tests Failing

#### Error: `Connection refused`

```bash
# Make sure services are running
./scripts/health-all.sh

# Clear Redis cache
redis-cli FLUSHALL

# Restart services
./scripts/stop-all.sh
./scripts/deploy-all.sh
```

### Performance Issues

#### High latency

```bash
# Check Redis memory
redis-cli info memory

# Check Redis hit rate
redis-cli info stats | grep hit_rate

# Clear cache if needed
redis-cli FLUSHALL
```

#### High memory usage

```bash
# Check MongoDB stats
mongosh --eval "db.stats()"

# Check Redis keys
redis-cli --scan --pattern "intent:*" | wc -l
```

### Feature Flags Not Working

```bash
# Check environment variables
echo $USE_NEW_INTENT_SERVICE

# Should be: true or false

# Set in .env file
echo "USE_NEW_INTENT_SERVICE=true" >> .env
```

### Docker Issues

#### Container won't start

```bash
# Check logs
docker logs rez-redis
docker logs rez-mongo

# Restart container
docker restart rez-redis
```

#### Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove old containers
docker container prune
```

## Debug Mode

Enable debug logging:

```bash
# Set debug environment
export DEBUG=*
export LOG_LEVEL=debug

# Restart services
./scripts/stop-all.sh
./scripts/deploy-all.sh
```

## Health Check Commands

```bash
# All services
./scripts/health-all.sh

# Individual
curl http://localhost:4009/health
curl http://localhost:4026/health
curl http://localhost:4027/health
curl http://localhost:4028/health
```

## Log Locations

```
rez-intent-service/
├── logs/
│   └── intent-service.log
├── redis/
│   └── dump.rdb
└── mongo/
    └── data/

rez-copilot/
├── logs/
│   └── copilot.log

rez-decision-service/
├── logs/
│   └── decision-service.log

rez-ad-platform/
├── logs/
│   └── ad-platform.log
```

## Emergency Rollback

If all else fails:

```bash
# 1. Disable all new services
export USE_NEW_INTENT_SERVICE=false
export USE_NEW_COPILOT=false
export USE_NEW_DECISION_SERVICE=false
export USE_NEW_AD_PLATFORM=false

# 2. Stop new services
./scripts/stop-all.sh

# 3. Restart legacy services
# (use your existing deployment process)

# 4. Verify legacy services work
./scripts/health-all.sh
```

## Contact

For additional issues, check:
- Source of Truth: `SOURCE-OF-TRUTH.md`
- Migration Plan: `SOURCE-OF-TRUTH/SAFE-MIGRATION-PLAN.md`
- Feature Manifest: `SOURCE-OF-TRUTH/FEATURE-PRESERVATION-MANIFEST.md`
