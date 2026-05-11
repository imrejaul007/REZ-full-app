# ReZ Monitoring Setup Guide

## Overview

This directory contains a comprehensive monitoring and alerting system for the ReZ Full App microservices architecture.

## Directory Structure

```
monitoring/
├── health-check.sh           # Individual service health checks
├── alert.sh                  # Multi-channel alerting system
├── check-all-services.sh     # Comprehensive service monitoring
├── config/
│   ├── services.conf         # Service endpoint configuration
│   └── thresholds.conf        # Alert thresholds and channel config
├── logs/                     # Health check and alert logs
├── reports/                  # Generated status reports
└── state/                    # Alert state tracking
```

## Quick Start

### 1. Make Scripts Executable

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/monitoring
chmod +x health-check.sh alert.sh check-all-services.sh
```

### 2. Configure Services

Edit `config/services.conf` to add your service endpoints:

```bash
api_gateway=http://localhost:3000/health
auth_service=http://localhost:3001/health
```

### 3. Configure Alert Channels

Edit `config/thresholds.conf` with your notification settings:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
PAGERDUTY_ROUTING_KEY=your-integration-key
EMAIL_TO=team@example.com
```

### 4. Run Initial Check

```bash
./check-all-services.sh
```

## Usage

### Check All Services

```bash
./check-all-services.sh
```

### Individual Service Check

```bash
./health-check.sh --service api_gateway
```

### Response Time Monitoring

```bash
./health-check.sh --response-time http://localhost:3000/health 5 1000
#                           URL                       samples threshold_ms
```

### Error Rate Monitoring

```bash
./health-check.sh --error-rate http://localhost:3000/health 10 5
#                              URL                    samples threshold_%
```

### Send Test Alert

```bash
./alert.sh critical my-service "Test alert" "This is a test"
```

## Cron Setup

Add to your crontab for automated monitoring:

```bash
# Run health checks every 5 minutes
*/5 * * * * /Users/rejaulkarim/Documents/ReZ\ Full\ App/monitoring/check-all-services.sh >> /Users/rejaulkarim/Documents/ReZ\ Full\ App/monitoring/logs/cron.log 2>&1

# Run comprehensive check every hour
0 * * * * /Users/rejaulkarim/Documents/ReZ\ Full\ App/monitoring/check-all-services.sh --full
```

## Alert Channels

### Slack Integration

1. Create a Slack App at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Add webhook URL to `config/thresholds.conf`

### PagerDuty Integration

1. Create a PagerDuty integration
2. Copy the Routing Key to `config/thresholds.conf`
3. Critical and warning alerts auto-trigger

### Email Alerts

Configure SMTP settings in `config/thresholds.conf`:
```bash
EMAIL_TO=alerts@example.com
SMTP_HOST=smtp.example.com
```

### Discord Integration

1. Create a Discord webhook in your server settings
2. Add webhook URL to `config/thresholds.conf`

## Monitoring Metrics

### HTTP Health Checks
- Service availability (HTTP 200)
- Response time (avg, min, max)
- Error rate calculation

### System Resources
- Disk usage per mount
- Memory utilization
- CPU load average

### Docker Status
- Container health status
- Running vs total containers
- Unhealthy container detection

## Alert Cooldown

To prevent alert fatigue, the system tracks recent alerts:
- Default cooldown: 300 seconds (5 minutes)
- Configurable via `ALERT_COOLDOWN` in thresholds.conf
- Same service + severity = no re-alert until cooldown expires

## Log Files

| File | Description |
|------|-------------|
| `logs/health-check.log` | Health check results |
| `logs/alerts.log` | All sent alerts |
| `logs/latest-status.txt` | Most recent status summary |
| `reports/status-*.json` | JSON status reports |
| `reports/status-*.html` | HTML status reports |

## Troubleshooting

### Script Not Executable
```bash
chmod +x *.sh
```

### Curl Not Found
Install curl: `brew install curl`

### jq Not Found
Install jq: `brew install jq`

### Service Not Responding
1. Check service is running: `docker ps` or `pm2 list`
2. Verify endpoint URL in services.conf
3. Check firewall settings

### Alerts Not Sending
1. Verify webhook URLs are correct
2. Check network connectivity
3. View alert logs: `tail -f logs/alerts.log`

## Advanced Configuration

### Custom Response Time Thresholds

In `thresholds.conf`:
```bash
RESPONSE_TIME_WARNING=500
RESPONSE_TIME_CRITICAL=2000
```

### Custom Error Rate Thresholds

```bash
ERROR_RATE_WARNING=5
ERROR_RATE_CRITICAL=20
```

### Continuous Uptime Monitoring

For continuous monitoring mode:
```bash
./health-check.sh --uptime service-name http://url/health 3
```

## Integration Examples

### Prometheus + Grafana

Export metrics using the JSON reports:
```bash
# Parse reports for Prometheus
cat reports/latest.json | jq -r '.checks[] | "service_check{name=\"\(.name)\"} \(.status == \"UP\" ? 1 : 0)"'
```

### Health Checks in Docker Compose

Add to your docker-compose.yml:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:PORT/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Support

For issues or questions, check:
1. Log files in `logs/` directory
2. Service-specific documentation
3. Alert channel configuration
