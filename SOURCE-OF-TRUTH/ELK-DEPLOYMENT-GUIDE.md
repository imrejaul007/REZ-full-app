# ELK Stack Deployment Guide
**Date:** 2026-04-30

---

## Overview

This guide deploys the ELK stack (Elasticsearch, Logstash, Kibana) for centralized logging.

---

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Linux/macOS host

---

## Quick Start

```bash
# Clone the repo
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App

# Start ELK stack
docker-compose -f docker-compose.observability.yml up -d

# Check status
docker-compose -f docker-compose.observability.yml ps
```

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| Elasticsearch | 9200 | Search and analytics engine |
| Logstash | 5044 | Log processing pipeline |
| Kibana | 5601 | Visualization dashboard |
| Fluentd | 24224 | Log shipper |

---

## Configuration

### Environment Variables

Create `.env` file:
```env
ELASTIC_PASSWORD=your-secure-password
KIBANA_PASSWORD=your-secure-password
```

### Elasticsearch Memory

Edit `docker-compose.observability.yml`:
```yaml
services:
  elasticsearch:
    environment:
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"  # Adjust based on available RAM
```

---

## Accessing Kibana

1. Open browser: http://localhost:5601
2. Login with: `elastic` / `ELASTIC_PASSWORD`
3. Create index pattern: `rez-*`

---

## Log Shipper Configuration

### Fluentd (for services)

Create `fluentd/fluent.conf`:
```conf
<source>
  @type tail
  path /var/log/rez-*.log
  pos_file /var/log/rez.log.pos
  tag rez.service
  <parse>
    @type json
  </parse>
</source>

<filter rez.service>
  @type record_transformer
  <record>
    hostname "#{Socket.gethostname}"
    service ${tag}
  </record>
</filter>

<match rez.service>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix rez
  user elastic
  password ${ELASTIC_PASSWORD}
</match>
```

### Environment Variables for Services

Add to each service:
```env
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5044
```

---

## Log Format

Services should log in JSON format:
```json
{
  "timestamp": "2026-04-30T10:00:00Z",
  "level": "error",
  "service": "rez-order-service",
  "message": "Database connection failed",
  "correlationId": "req-123",
  "error": {
    "name": "MongoNetworkError",
    "message": "connect ECONNREFUSED"
  }
}
```

---

## Verification

```bash
# Check Elasticsearch
curl -u elastic:PASSWORD http://localhost:9200

# Check Kibana
curl -u elastic:PASSWORD http://localhost:5601/api/status

# Check logs
curl -u elastic:PASSWORD http://localhost:9200/rez-*/_search
```

---

## Production Considerations

1. **Enable TLS** - Add SSL certificates
2. **Set up authentication** - Use API keys
3. **Configure backups** - Elasticsearch snapshots
4. **Set resource limits** - Based on log volume

---

## Troubleshooting

### Elasticsearch won't start

```bash
# Check logs
docker-compose logs elasticsearch

# Increase memory
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Kibana can't connect

```bash
# Wait for Elasticsearch
docker-compose logs elasticsearch | grep "started"
```

---

## Cleanup

```bash
# Stop all services
docker-compose -f docker-compose.observability.yml down

# Remove data volumes (careful!)
docker-compose -f docker-compose.observability.yml down -v
```
