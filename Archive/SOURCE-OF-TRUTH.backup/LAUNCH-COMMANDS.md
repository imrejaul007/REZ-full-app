# Launch Commands Reference

## Pre-Launch Commands

### Check Backend Health
```bash
curl https://api.rez.money/health
curl https://auth.rez.money/health
curl https://wallet.rez.money/health
curl https://pay.rez.money/health
```

### Check EAS Builds
```bash
eas build:list
```

### Deploy Backend Services
```bash
./scripts/deploy-services.sh --all
```

---

## Launch Commands

### Run Launch Script
```bash
./scripts/launch.sh
```

### Verify Launch
```bash
# Check all services
curl https://api.rez.money/health

# Check monitoring
open https://grafana.rez.money
```

---

## Post-Launch Commands

### Check Logs
```bash
kubectl logs -l app=api-gateway
```

### Check Metrics
```bash
open https://grafana.rez.money/d/rez-overview
```

### Emergency Rollback
```bash
./scripts/rollback.sh --service=all --version=previous
```
