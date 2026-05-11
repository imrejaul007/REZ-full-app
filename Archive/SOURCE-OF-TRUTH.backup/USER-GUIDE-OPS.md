# Operations Guide

## Monitoring
- Grafana: http://grafana.rez.money
- Prometheus: http://prometheus.rez.money

## Logs
```bash
kubectl logs -l app=api-gateway
```

## Rollback
```bash
./scripts/rollback.sh --service=api-gateway
```
