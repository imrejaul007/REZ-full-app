# Observability Implementation Plan
**Date:** 2026-04-30
**Status:** Planned

---

## Overview

This document outlines the observability implementation for the REZ ecosystem, covering logging, metrics, tracing, and alerting.

---

## Current State

### What's Already Implemented
- OpenTelemetry SDK in all services
- Prometheus metrics in wallet, order, payment services
- Structured logging in rez-shared
- Health check endpoints

### What's Missing
- Centralized log aggregation
- Distributed tracing UI
- Alert rules
- Dashboard panels

---

## Logging

### 1. Centralized Logging (ELK Stack)

**Components:**
- Elasticsearch: Log storage
- Logstash: Log processing
- Kibana: Log visualization
- Fluentd/Fluent Bit: Log shipping

**Configuration:**
```yaml
# docker-compose.yml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=true
    - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}

logstash:
  image: docker.elastic.co/logstash/logstash:8.11.0
  volumes:
    - ./logstash/pipeline:/usr/share/logstash/pipeline

kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  ports:
    - "5601:5601"
```

### 2. Log Shipping from Services

**Current:** Logs go to stdout/stderr (Render)

**Target:** Ship to ELK via Fluent Bit

```yaml
# fluent-bit.conf
[SERVICE]
    Flush        5
    Log_Level    info

[INPUT]
    Name        tail
    Path        /var/log/rez-*.log
    Parser       json

[OUTPUT]
    Name        es
    Match       *
    Host        elasticsearch
    Port        9200
    HTTP_User    elastic
    HTTP_Passwd  ${ELASTIC_PASSWORD}
```

### 3. Structured Log Format

**Current Format:**
```json
{
  "timestamp": "2026-04-30T10:00:00Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "rez-order-service"
}
```

**Enhanced Format:**
```json
{
  "timestamp": "2026-04-30T10:00:00Z",
  "level": "error",
  "service": "rez-order-service",
  "traceId": "abc123def456",
  "correlationId": "req-789",
  "message": "Database connection failed",
  "error": {
    "name": "MongoNetworkError",
    "message": "connect ECONNREFUSED",
    "stack": "..."
  },
  "metadata": {
    "host": "order-service-abc123",
    "region": "us-east-1"
  }
}
```

---

## Metrics

### 1. Prometheus Metrics (Already Implemented)

**Current Metrics:**
- `http_requests_total` - HTTP request counter
- `http_request_duration_seconds` - Request latency histogram
- `wallet_transactions_total` - Transaction counter

### 2. Add Business Metrics

```typescript
// Payment metrics
metrics.increment('payment.initiated', { merchantId });
metrics.increment('payment.completed', { merchantId, method });
metrics.histogram('payment.amount', amount);

// Order metrics
metrics.increment('order.created', { merchantId });
metrics.histogram('order.total', total);
```

### 3. Service Level Objectives (SLOs)

| Service | Availability | Latency (p99) |
|---------|---------------|-----------------|
| rez-order-service | 99.9% | 500ms |
| rez-payment-service | 99.9% | 1000ms |
| rez-wallet-service | 99.9% | 200ms |

---

## Tracing

### 1. OpenTelemetry (Already Implemented)

**Services with OTEL:**
- rez-auth-service
- rez-merchant-service
- rez-order-service
- rez-payment-service
- rez-wallet-service

### 2. Trace Propagation

**Add to all HTTP clients:**
```typescript
import { propagation, context } from '@opentelemetry/api';

const headers = {};
propagation.inject(context.active(), headers);
fetch(url, { headers });
```

### 3. Trace Visualization

**Options:**
- Jaeger (OSS)
- Zipkin (OSS)
- Datadog (SaaS)
- Honeycomb (SaaS)

---

## Alerting

### 1. Prometheus Alert Rules

**Already Created:**
- `SOURCE-OF-TRUTH/prometheus-alerts.yml`

**Add:**
```yaml
groups:
  - name: rez-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

### 2. Alert Routing

| Alert | Notify |
|-------|--------|
| High Error Rate | PagerDuty → On-call |
| High Latency | Slack #alerts |
| Service Down | PagerDuty → On-call |
| Disk Usage > 80% | Slack #infra |

---

## Dashboards

### 1. Service Overview

**Panels:**
- Request rate by service
- Error rate by service
- Latency (p50, p95, p99)
- Active connections

### 2. Payment Service

**Panels:**
- Payments per minute
- Payment success rate
- Average payment amount
- Failed payment reasons

### 3. Wallet Service

**Panels:**
- Transactions per minute
- Balance operations
- Failed transactions
- Top error codes

---

## Implementation Steps

| Phase | Tasks | Timeline |
|-------|-------|----------|
| 1 | Deploy ELK stack, configure log shipping | Week 1 |
| 2 | Add business metrics to all services | Week 2 |
| 3 | Configure alerting rules | Week 2 |
| 4 | Create dashboards | Week 3 |
| 5 | Set up on-call rotation | Week 3 |

---

## Verification

```bash
# Check Prometheus targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[]'

# Check logs in Kibana
GET /logs/_search
{
  "query": {
    "match": { "service": "rez-order-service" }
  }
}

# Check traces in Jaeger
GET /api/traces?service=rez-payment-service
```
