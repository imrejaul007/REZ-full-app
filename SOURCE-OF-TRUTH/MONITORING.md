# ReZ Platform - Monitoring & Alerts Configuration

**Document Type:** Operations
**Status:** Production Ready
**Owner:** Platform Team
**Last Updated:** 2026-05-07

---

## Table of Contents

1. [Health Check URLs](#health-check-urls)
2. [Alert Thresholds](#alert-thresholds)
3. [PagerDuty Integration](#pagerduty-integration)
4. [Slack Webhook Setup](#slack-webhook-setup)
5. [Daily Monitoring Checklist](#daily-monitoring-checklist)

---

## Health Check URLs

### Critical Services (Production)

| Service | Health Endpoint | Metrics Endpoint | Status |
|---------|----------------|-----------------|--------|
| **API Gateway** | `https://rez-api-gateway.onrender.com/health` | `/metrics` | Production |
| **Auth Service** | `https://rez-auth-service.onrender.com/health` | `/metrics` | Production |
| **Wallet Service** | `https://rez-wallet-service.onrender.com/health` | `/metrics` | Production |
| **Payment Service** | `https://rez-payment-service.onrender.com/health` | `/metrics` | Production |
| **BBPS Service** | `https://rez-bbps-service.onrender.com/health` | `/metrics` | Production |
| **Finance Service** | `https://rez-finance-service.onrender.com/health` | `/metrics` | Production |
| **Order Service** | `https://rez-order-service.onrender.com/health` | `/metrics` | Production |
| **Merchant Service** | `https://rez-merchant-service.onrender.com/health` | `/metrics` | Production |
| **Catalog Service** | `https://rez-catalog-service.onrender.com/health` | `/metrics` | Production |
| **Karma Service** | `https://rez-karma-service.onrender.com/health` | `/metrics` | Production |
| **Notification Service** | `https://rez-notification-service.onrender.com/health` | `/metrics` | Production |
| **Marketing Service** | `https://rez-marketing-service.onrender.com/health` | `/metrics` | Production |
| **Search Service** | `https://rez-search-service.onrender.com/health` | `/metrics` | Production |
| **Intent Service** | `https://rez-intent-service.onrender.com/health` | `/metrics` | Production |
| **ML Model Registry** | `https://rez-ml-model-registry.onrender.com/health` | `/metrics` | Production |
| **Ad Platform** | `https://rez-ads-platform.onrender.com/health` | `/metrics` | Production |

### External Services

| Service | Health Endpoint | Check Type |
|---------|----------------|------------|
| **MongoDB Atlas** | Atlas Status Page | External |
| **Redis (Upstash)** | Upstash Dashboard | External |
| **Cloudflare** | `https://cloudflare.com/system-status` | External |
| **Sentry** | `https://sentry.io/organizations/rez-platform/status` | External |
| **Render** | `https://render.com/status` | External |

### Health Check Response Format

All services implement standardized health endpoints:

```json
// GET /health/live
{
  "status": "alive",
  "timestamp": "2026-05-07T10:30:00.000Z"
}

// GET /health/ready
{
  "status": "ready",
  "checks": {
    "mongodb": "ok",
    "redis": "ok"
  },
  "timestamp": "2026-05-07T10:30:00.000Z"
}
```

### Health Check Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Healthy | No action needed |
| 503 | Unhealthy | Alert + investigate |
| 504 | Timeout | Alert + investigate |
| Connection refused | Service down | Critical alert + page |

---

## Alert Thresholds

### Critical Alerts (PagerDuty + Slack)

| Alert Name | Metric | Threshold | Duration | Severity |
|------------|--------|-----------|----------|----------|
| **ServiceDown** | `up{job="service"} == 0` | = 0 | 1m | Critical |
| **HighErrorRate** | `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` | > 1% | 2m | Critical |
| **PaymentFailureRate** | `rate(payment_failures_total[5m]) / rate(payment_initiated_total[5m])` | > 5% | 5m | Critical |
| **DBConnectionPoolExhausted** | `mongodb_pool_connections_available` | < 1 | 2m | Critical |
| **WalletServiceDown** | `up{job="wallet-service"} == 0` | = 0 | 1m | Critical |
| **CircuitBreakerOpen** | `circuit_breaker_state` | = 1 | 1m | Critical |
| **AuthenticationFailureSpike** | `rate(auth_login_total{status="failure"}[5m])` | > 50/min | 2m | Critical |
| **BBPSServiceDown** | `up{job="bbps-service"} == 0` | = 0 | 1m | Critical |

### Warning Alerts (Slack Only)

| Alert Name | Metric | Threshold | Duration | Severity |
|------------|--------|-----------|----------|----------|
| **HighAPILatency** | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` | > 600ms | 2m | Warning |
| **HighMemoryUsage** | `process_resident_memory_bytes` | > 400MB | 3m | Warning |
| **HighQueueBacklog** | `bullmq_queue_length{status="waiting"}` | > 5000 | 1m | Warning |
| **RedisCacheHitRatioLow** | `redis_keyspace_hits / (hits + misses)` | < 60% | 5m | Warning |
| **BBPSGatewayError** | `rate(bbps_requests_total{status=~"4..\|5.."}[5m])` | > 0.1/sec | 3m | Warning |
| **WalletTransactionFailure** | `rate(wallet_transaction_failures_total[5m])` | > 10/min | 5m | Warning |
| **HighDLQBacklog** | `bullmq_dlq_length` | > 100 | 5m | Warning |
| **IntentGraphSyncLag** | `intent_graph_sync_lag_seconds` | > 30s | 2m | Warning |
| **MLModelAccuracyLow** | `ml_model_accuracy` | < 0.85 | 10m | Warning |

### SLO-Based Alerts

| Service | Availability SLO | Latency p95 SLO | Latency p99 SLO |
|---------|-----------------|-----------------|-----------------|
| REZ API | 99.9% | 200ms | 500ms |
| Payment Service | 99.95% | 500ms | 1s |
| Wallet Service | 99.95% | 100ms | 250ms |
| ReZ Mind | 99.5% | 1s | 2s |
| BBPS | 99.5% | 2s | 5s |

### Prometheus Alert Rules Configuration

```yaml
# prometheus-alerts.yml
groups:
  - name: rez-critical
    rules:
      - alert: ServiceDown
        expr: up{job=~"rez-.*"} == 0
        for: 1m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"
          runbook_url: "https://wiki.rez.money/runbooks/service-down"

      - alert: HighErrorRate
        expr: |
          (
            rate(http_requests_total{status=~"5.."}[5m]) /
            rate(http_requests_total[5m])
          ) > 0.01
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
          runbook_url: "https://wiki.rez.money/runbooks/high-error-rate"

      - alert: PaymentFailureRate
        expr: |
          (
            rate(payment_failures_total[5m]) /
            rate(payment_initiated_total[5m])
          ) > 0.05
        for: 5m
        labels:
          severity: critical
          team: payments
        annotations:
          summary: "Payment failure rate above 5%"
          description: "Payment failure rate is {{ $value | humanizePercentage }}"
          runbook_url: "https://wiki.rez.money/runbooks/payment-failure"

      - alert: DatabaseConnectionPoolExhausted
        expr: mongodb_pool_connections_available < 1
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "MongoDB connection pool exhausted"
          description: "Available connections: {{ $value }}"
          runbook_url: "https://wiki.rez.money/runbooks/db-connection-pool"

  - name: rez-warning
    rules:
      - alert: HighAPILatency
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 0.6
        for: 2m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High API latency on {{ $labels.job }}"
          description: "p95 latency is {{ $value }}s"
          runbook_url: "https://wiki.rez.money/runbooks/high-latency"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes > 400000000
        for: 3m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "High memory usage on {{ $labels.job }}"
          description: "Memory usage is {{ humanize $value }}"
          runbook_url: "https://wiki.rez.money/runbooks/high-memory-usage"
```

---

## PagerDuty Integration

### Setup Steps

1. **Create PagerDuty Account**
   - Go to [pagerduty.com](https://pagerduty.com)
   - Create account with email: `oncall-platform@rez.money`

2. **Create Integration Key**
   ```
   1. Navigate to Services > Service Directory
   2. Click "New Service"
   3. Name: "ReZ Platform Production"
   4. Integration Type: "Prometheus AlertManager"
   5. Integration Key: Save this (used in AlertManager config)
   ```

3. **Configure AlertManager**

   ```yaml
   # alertmanager.yml
   global:
     resolve_timeout: 5m

   route:
     group_by: ['alertname', 'severity']
     group_wait: 10s
     group_interval: 10s
     repeat_interval: 4h
     receiver: 'pagerduty-critical'
     routes:
       - match:
           severity: critical
         receiver: 'pagerduty-critical'
         continue: true
       - match:
           severity: warning
         receiver: 'slack'
       - match:
           alertname: 'ServiceDown'
         receiver: 'pagerduty-critical'
         group_wait: 0s

   receivers:
     - name: 'pagerduty-critical'
       pagerduty_configs:
         - service_key: '${PAGERDUTY_ROUTING_KEY}'
           incident_key: '{{ .GroupLabels.alertname }}'
           severity: '{{ .Labels.severity }}'
           client: 'ReZ Platform'
           client_url: 'https://grafana.rez.money'
           description: '{{ .Annotations.summary }}'
           details:
             alert_name: '{{ .Labels.alertname }}'
             service: '{{ .Labels.job }}'
             description: '{{ .Annotations.description }}'
             runbook: '{{ .Annotations.runbook_url }}'
             grafana_url: 'https://grafana.rez.money'
             severity: '{{ .Labels.severity }}'

     - name: 'slack'
       slack_configs:
         - channel: '#alerts-platform'
           webhook_url: '${SLACK_WEBHOOK_URL}'
           send_resolved: true
           title: '{{ .Annotations.summary }}'
           text: |
             {{ range .Alerts }}
             *Alert:* {{ .Annotations.summary }}
             *Description:* {{ .Annotations.description }}
             *Service:* {{ .Labels.job }}
             *Severity:* {{ .Labels.severity }}
             *Runbook:* {{ .Annotations.runbook_url }}
             {{ end }}
```

4. **Set Environment Variables**

   ```bash
   export PAGERDUTY_ROUTING_KEY="your-integration-key-here"
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz"
   ```

5. **Create Escalation Policy**

   | Level | Delay | Target |
   |-------|-------|--------|
   | 1 | 0 min | Primary On-Call (Platform Team) |
   | 2 | 15 min | Secondary On-Call (Backend Team) |
   | 3 | 30 min | Engineering Manager |
   | 4 | 60 min | CTO |

### PagerDuty Alert Routing by Service

| Service | Routing Key | Escalation Policy |
|---------|------------|-------------------|
| Payment Service | PD-PAYMENT-KEY | Payment Escalation |
| Wallet Service | PD-WALLET-KEY | Payment Escalation |
| BBPS Service | PD-BBPS-KEY | Payment Escalation |
| Core API | PD-CORE-KEY | Platform On-Call |
| Auth Service | PD-AUTH-KEY | Platform On-Call |
| ML/AI Services | PD-ML-KEY | ML Team On-Call |

---

## Slack Webhook Setup

### Create Slack App for Alerts

1. **Create Slack App**
   ```bash
   # Using Slack CLI
   slack create rez-alerts --template https://github.com/slackapi/alerting-template
   ```

2. **Configure Incoming Webhooks**
   ```
   1. Go to https://api.slack.com/apps
   2. Select your app
   3. Navigate to "Incoming Webhooks"
   4. Enable Incoming Webhooks
   5. Click "Add New Webhook to Workspace"
   6. Select channel: #alerts-platform
   7. Copy Webhook URL
   ```

3. **Set Webhook URL in AlertManager**
   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
   ```

### Slack Channel Configuration

| Channel | Purpose | Members |
|---------|---------|---------|
| `#alerts-platform` | All production alerts | @oncall-platform |
| `#alerts-critical` | Critical alerts only | @oncall-platform, @engineering-manager |
| `#alerts-payments` | Payment service alerts | @payment-team |
| `#alerts-infra` | Infrastructure alerts | @devops |
| `#alerts-ml` | ML/AI service alerts | @ml-team |
| `#monitoring-daily` | Daily status updates | @all-engineers |

### Slack Alert Message Format

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": ":rotating_light: Alert: ServiceDown",
        "emoji": true
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Severity:*\ncritical"
        },
        {
          "type": "mrkdwn",
          "text": "*Service:*\nrez-auth-service"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Description:*\nService has been down for more than 1 minute"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Runbook"
          },
          "url": "https://wiki.rez.money/runbooks/service-down"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Grafana"
          },
          "url": "https://grafana.rez.money"
        },
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Acknowledge"
          },
          "action_id": "acknowledge_alert"
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Fired at: 2026-05-07T10:30:00Z | Alert ID: alert-12345"
        }
      ]
    }
  ]
}
```

### Slack Workflow for Alert Acknowledgment

```yaml
# slack-workflow-alerts.yml
workflows:
  - name: "Alert Acknowledgment"
    trigger:
      type: "webhook"
      url: "https://slack.com/api/workflows.trigger"
    steps:
      - name: "Send acknowledgment"
        id: "ack_step"
        function: "slack#/functions/send_message"
        inputs:
          channel_id: "alerts-platform"
          message: |
            :white_check_mark: Alert acknowledged by {{ user_name }}
            Alert: {{ alert_name }}
            Service: {{ service }}
            Acknowledged at: {{ timestamp }}
      - name: "Update PagerDuty"
        id: "pd_step"
        function: "pagerduty#/functions/acknowledge_incident"
        inputs:
          incident_id: "{{ alert_id }}"
```

---

## Daily Monitoring Checklist

### Morning Check (9:00 AM IST)

#### Infrastructure Status
- [ ] Check all services status on Render Dashboard
- [ ] Verify MongoDB Atlas status (no maintenance windows)
- [ ] Check Redis/Upstash dashboard
- [ ] Review Cloudflare status
- [ ] Check Sentry error count (last 24h)
- [ ] Review Grafana master dashboard

#### Alert Review
- [ ] Check for any unresolved alerts from overnight
- [ ] Review fired alerts count vs yesterday
- [ ] Verify on-call rotation is correct
- [ ] Check PagerDuty escalation status

#### Key Metrics Review
| Metric | Target | Check |
|--------|--------|-------|
| Error Rate | < 1% | `rate(http_requests_total{status=~"5.."}[5m])` |
| API Latency p95 | < 200ms | `histogram_quantile(0.95, ...)` |
| Payment Success Rate | > 95% | `rate(payment_success_total)` |
| Wallet Transactions | > 1000/day | Count from Grafana |
| Queue Backlog | < 1000 | `bullmq_queue_length` |

### Mid-Day Check (1:00 PM IST)

#### Load Review
- [ ] Check traffic patterns (compare to baseline)
- [ ] Verify no unusual spikes in error rates
- [ ] Check queue processing rates
- [ ] Monitor BBPS service status

#### Business Metrics
| Metric | Target | Check |
|--------|--------|-------|
| Active Users | > baseline | Check analytics dashboard |
| Revenue (24h) | > daily target | Check finance dashboard |
| New Signups | > 100/day | Check auth service logs |
| Successful Payments | > 95% | Check payment dashboard |

### Evening Check (6:00 PM IST)

#### End-of-Day Review
- [ ] Verify no critical alerts firing
- [ ] Check DLQ lengths (should be < 100)
- [ ] Review scheduled jobs completion
- [ ] Check backup status
- [ ] Verify no maintenance windows scheduled

#### Post-Handoff
- [ ] Update monitoring dashboard for night
- [ ] Set extended alert thresholds for off-hours
- [ ] Verify on-call phone is working
- [ ] Document any issues for next shift

### Weekly Review (Monday 10:00 AM IST)

- [ ] Review weekly SLO compliance
- [ ] Check infrastructure costs
- [ ] Review security audit logs
- [ ] Update runbooks if needed
- [ ] Schedule any required maintenance
- [ ] Review on-call rotation effectiveness

### Incident Response Checklist

When an alert fires:

1. **Acknowledge** (within 5 min for critical)
   - Acknowledge in PagerDuty
   - Acknowledge in Slack channel

2. **Assess** (within 10 min)
   - Identify affected service(s)
   - Check recent deployments
   - Review error logs in Sentry
   - Check database connectivity

3. **Communicate** (within 15 min)
   - Post initial assessment in Slack
   - Update status page if needed
   - Notify stakeholders if customer-impacting

4. **Mitigate**
   - Rollback if recent deployment caused issue
   - Scale up if load-related
   - Enable feature flags if needed
   - Deploy hotfix if root cause identified

5. **Resolve**
   - Verify metrics return to normal
   - Update incident timeline
   - Close PagerDuty incident
   - Post resolution in Slack

6. **Post-Mortem**
   - Schedule within 48h
   - Document root cause
   - Identify prevention steps
   - Create follow-up tickets

### Quick Reference Commands

```bash
# Check service health
curl https://rez-auth-service.onrender.com/health

# View Prometheus metrics
curl https://rez-api.onrender.com/metrics | grep -E "^http_"

# Check recent errors in Sentry
# Visit: https://sentry.io/organizations/rez-platform/issues/

# View logs in Grafana
# Navigate to: Explore > Loki > job="rez-services"

# Check PagerDuty incidents
pd incident list --status triggered,acknowledged

# Acknowledge alert
pd incident acknowledge <incident-id>
```

---

## Runbook URLs

| Alert | Runbook |
|-------|---------|
| ServiceDown | https://wiki.rez.money/runbooks/service-down |
| HighErrorRate | https://wiki.rez.money/runbooks/high-error-rate |
| HighLatency | https://wiki.rez.money/runbooks/high-latency |
| PaymentFailure | https://wiki.rez.money/runbooks/payment-failure |
| QueueBacklog | https://wiki.rez.money/runbooks/high-queue-backlog |
| DBConnectionPool | https://wiki.rez.money/runbooks/db-connection-pool |
| HighMemoryUsage | https://wiki.rez.money/runbooks/high-memory-usage |
| CircuitBreakerOpen | https://wiki.rez.money/runbooks/circuit-breaker |

---

## Dashboard URLs

| Dashboard | URL |
|-----------|-----|
| Grafana | https://grafana.rez.money |
| Sentry | https://sentry.io/organizations/rez-platform |
| Prometheus | https://prometheus.rez.money |
| PagerDuty | https://rez-platform.pagerduty.com |
| Status Page | https://status.rez.money |
| Runbooks Wiki | https://wiki.rez.money/runbooks |

---

**Document Owner:** Platform Team
**Review Frequency:** Weekly
**Last Review:** 2026-05-07
**Next Review:** 2026-05-14
