# REZ Platform - Unified Monitoring Setup Guide

This guide sets up unified monitoring across all REZ ecosystem services.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED MONITORING                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Sentry  │  │ Grafana │  │  Loki   │  │Prometheus│      │
│  │ Errors  │  │ Dash-   │  │  Logs   │  │ Metrics │      │
│  │         │  │ boards  │  │         │  │         │      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘      │
│       │            │            │            │             │
│       └────────────┴────────────┴────────────┘             │
│                         │                                  │
│                         ▼                                  │
│              ┌─────────────────┐                           │
│              │  Alert Manager  │                           │
│              │  (PagerDuty,    │                           │
│              │   Slack, Email)  │                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Services with Monitoring Enabled

| Service | Sentry | Prometheus | Logs |
|---------|--------|------------|------|
| rez-auth-service | ✅ | ✅ | ✅ |
| rez-backend | ✅ | ✅ | ✅ |
| rez-merchant-service | ✅ | ✅ | ✅ |
| rez-wallet-service | ✅ | ✅ | ✅ |
| rez-payment-service | ✅ | ✅ | ✅ |
| rez-now | ✅ | - | ✅ |
| Hotel OTA API | ✅ | ✅ | ✅ |
| Rendez Backend | ✅ | - | ✅ |
| AdBazaar | ✅ | - | ✅ |
| NextaBiZ | ✅ | - | ✅ |

---

## Sentry Setup

### 1. Create Sentry Organization

1. Go to [sentry.io](https://sentry.io)
2. Create organization: `rez-platform`
3. Create projects for each service:
   - `rez-auth-service`
   - `rez-backend`
   - `rez-merchant-service`
   - `rez-wallet-service`
   - `rez-payment-service`
   - `hotel-ota`
   - `rendez-backend`
   - `adbazaar`

### 2. Get DSN for Each Service

For each project, get the DSN:
```
https://abc123@sentry.io/1234567
```

### 3. Add DSN to Environment Variables

```bash
# rez-auth-service
SENTRY_DSN=https://abc123@sentry.io/1234567

# rez-backend
SENTRY_DSN=https://def456@sentry.io/1234568

# Add to all other services similarly
```

### 4. Sentry Features to Enable

- [x] Issue Alerts
- [x] Performance Monitoring
- [x] Release Tracking
- [x] Source Maps (for TypeScript)
- [x] Stack Trace Linking to GitHub

---

## Prometheus Metrics

### Services with Custom Metrics

#### rez-auth-service
```
auth_login_total{status="success|failure"}
auth_otp_requests_total{status="success|failure"}
auth_mfa_verifications_total{status="success|failure"}
auth_sessions_active
```

#### rez-merchant-service
```
merchant_orders_total{status="created|completed|cancelled"}
merchant_karma_points_earned_total
merchant_signals_processed_total
```

#### Hotel OTA
```
hotel_bookings_total{status="pending|confirmed|checked_in|checked_out|cancelled"}
hotel_revenue_total
hotel_rooms_occupied
```

### Access Prometheus Metrics

Most services expose metrics at `/metrics` endpoint:
```bash
curl https://rez-auth-service.onrender.com/metrics
```

---

## Log Aggregation with Loki

### For Render Services

Render provides built-in log streaming. To send to Loki:

1. Install Grafana Agent on a dedicated server
2. Configure Render log drain to Grafana Agent
3. Agent forwards to Loki

### Quick Setup with Grafana Cloud

1. Create free [Grafana Cloud](https://grafana.com/cloud) account
2. Get Loki endpoint and credentials
3. Deploy Grafana Agent alongside services:

```yaml
# grafana-agent.yaml
metrics:
  configs:
    - name: rez_services
      scrape_configs:
        - job_name: 'rez-auth'
          static_configs:
            - targets: ['rez-auth-service.onrender.com']
        - job_name: 'rez-backend'
          static_configs:
            - targets: ['rez-backend.onrender.com']

logs:
  configs:
    - name: rez_logs
      clients:
        - url: https://logs-prod-xxx.grafana.net/loki/api/v1/push
          basic_auth:
            username: xxx
            password: xxx
      scrape_configs:
        - job_name: 'rez-services'
          static_configs:
            - targets: ['localhost']
              labels:
                job: 'rez-services'
```

---

## Grafana Dashboards

### Pre-built Dashboards

#### 1. Service Health Dashboard

```json
{
  "title": "REZ Platform - Service Health",
  "panels": [
    {
      "title": "Service Uptime",
      "type": "stat",
      "targets": [
        {
          "expr": "up{job='rez-services'}",
          "legendFormat": "{{service}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(http_requests_total{status=~'5..'}[5m])",
          "legendFormat": "{{service}} - {{status}}"
        }
      ]
    },
    {
      "title": "Response Time (p99)",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "{{service}}"
        }
      ]
    }
  ]
}
```

#### 2. Booking Metrics (Hotel OTA)

```json
{
  "title": "Hotel OTA - Bookings",
  "panels": [
    {
      "title": "Bookings by Status",
      "type": "piechart",
      "targets": [
        {
          "expr": "hotel_bookings_total",
          "legendFormat": "{{status}}"
        }
      ]
    },
    {
      "title": "Revenue",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(hotel_revenue_total)"
        }
      ]
    },
    {
      "title": "Booking Rate",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(hotel_bookings_total[1h])",
          "legendFormat": "{{status}}"
        }
      ]
    }
  ]
}
```

#### 3. Auth Service Metrics

```json
{
  "title": "REZ Auth - Authentication",
  "panels": [
    {
      "title": "Login Success Rate",
      "type": "gauge",
      "targets": [
        {
          "expr": "sum(rate(auth_login_total{status='success'}[5m])) / sum(rate(auth_login_total[5m])) * 100"
        }
      ]
    },
    {
      "title": "OTP Requests",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(auth_otp_requests_total[5m])",
          "legendFormat": "{{status}}"
        }
      ]
    },
    {
      "title": "Active Sessions",
      "type": "stat",
      "targets": [
        {
          "expr": "auth_sessions_active"
        }
      ]
    }
  ]
}
```

---

## Alerting

### Alert Rules

#### Critical Alerts

```yaml
# alerts.yaml
groups:
  - name: rez-critical
    rules:
      - alert: ServiceDown
        expr: up{job='rez-services'} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.service }} is down"
          runbook_url: "https://docs.rez.money/runbooks/service-down"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate above 5% for {{ $labels.service }}"

      - alert: HighLatency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency above 2s for {{ $labels.service }}"

      - alert: AuthFailureSpike
        expr: rate(auth_login_total{status='failure'}[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High auth failure rate - possible attack"
```

### Notification Channels

| Channel | Use Case | Setup |
|---------|----------|-------|
| Slack | Non-critical alerts | #alerts-platform |
| PagerDuty | Critical outages | Escalation policy |
| Email | Daily summary | Weekly digest |
| SMS | Critical night alerts | On-call rotation |

---

## Runbooks

### Service Down

1. Check Render dashboard for service status
2. Check recent deployments
3. Review error logs in Sentry
4. Check database connectivity
5. Rollback if needed

### High Error Rate

1. Identify affected endpoint
2. Check Sentry for error patterns
3. Review recent code changes
4. Enable feature flag if needed
5. Deploy hotfix

### Database Connection Issues

1. Check MongoDB Atlas status
2. Verify connection string
3. Check connection pool limits
4. Scale up if at capacity

---

## Dashboard URLs

| Dashboard | URL |
|-----------|-----|
| Grafana | https://grafana.rez.money |
| Sentry | https://sentry.io/organizations/rez-platform |
| Prometheus | https://prometheus.rez.money |
| PagerDuty | https://rez-platform.pagerduty.com |

---

## On-Call Schedule

| Week | Primary | Secondary |
|------|---------|-----------|
| Week 1 | Dev Lead | DevOps |
| Week 2 | Backend Dev | Dev Lead |
| Week 3 | DevOps | Backend Dev |

---

## Quick Commands

```bash
# Check service health
curl https://rez-auth-service.onrender.com/health

# View Prometheus metrics
curl https://rez-auth-service.onrender.com/metrics | grep -E "^auth_"

# Check recent errors in Sentry
# Visit: https://sentry.io/organizations/rez-platform/issues/

# View logs
# Visit Grafana > Explore > Loki
```
