# Incident Response Runbook

## High Error Rate

1. Check service logs
   ```bash
   kubectl logs -l app=<service-name>
   ```

2. Check database connections
   ```bash
   kubectl exec -it <pod> -- mysqladmin status
   ```

3. Scale if needed
   ```bash
   kubectl scale deployment <service-name> --replicas=3
   ```

## High Latency

1. Check database queries
   ```sql
   SELECT * FROM performance_schema.events_statements_summary_by_digest ORDER BY SUM_TIMER_WAIT DESC LIMIT 10;
   ```

2. Check Redis cache
   ```bash
   redis-cli info stats | grep hit_rate
   ```

3. Add indexes
   ```sql
   CREATE INDEX idx_<table>_<column> ON <table>(<column>);
   ```

## Service Down

1. Check pod status
   ```bash
   kubectl get pods -l app=<service-name>
   ```

2. Describe pod for events
   ```bash
   kubectl describe pod <pod-name>
   ```

3. Check resource limits
   ```bash
   kubectl top pod <pod-name>
   ```

4. Restart if needed
   ```bash
   kubectl rollout restart deployment <service-name>
   ```

## Memory Leak

1. Identify with metrics
   ```bash
   kubectl top pods --sort-by=memory
   ```

2. Generate heap dump
   ```bash
   kubectl exec <pod> -- node --inspectheapdump /tmp/heapdump.hprof
   ```

3. Analyze with Chrome DevTools
