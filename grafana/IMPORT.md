# Grafana Dashboard Import Guide

## Dashboard: ReZ Unified Services Dashboard

**File:** `unified-dashboard.json`
**Location:** `/grafana/unified-dashboard.json`

---

## Import Methods

### Method 1: Grafana UI (Recommended)

1. **Navigate to Grafana**
   ```
   http://localhost:3000
   ```

2. **Create a new dashboard**
   - Click the **+** icon in the left sidebar
   - Select **Import**

3. **Upload the JSON file**
   - Click **Upload JSON file**
   - Select `unified-dashboard.json`
   - Or paste the JSON content directly

4. **Configure options**
   - Select your Prometheus datasource
   - Click **Import**

---

### Method 2: Auto-Provisioning (Docker/Kubernetes)

The dashboard is already configured for auto-provisioning. Copy the file to the provisioning directory:

```bash
# Copy dashboard to provisioning directory
cp unified-dashboard.json provisioning/dashboards/json/

# Restart Grafana or reload dashboards
```

---

### Method 3: API Import

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d @unified-dashboard.json \
  http://localhost:3000/api/dashboards/db
```

---

## Dashboard Sections

### 1. Service Health Overview
- Individual service status panels (UP/DOWN)
- Overall uptime percentage
- Services monitored:
  - Intent Service
  - Copilot
  - Decision Service
  - Ad Platform
  - Profile Service
  - Travel Service

### 2. Request Rate & Latency
- **Request Rate by Service** - Requests per second per service
- **Response Time (p50, p95, p99)** - Latency percentiles
- **HTTP Status Codes** - Stacked view of 2xx, 4xx, 5xx responses
- **Error Rate by Service** - 5xx error percentage

### 3. Database Connections
- **PostgreSQL Connection Pool Usage** - Current utilization %
- **MongoDB Connection Pool** - Current utilization %
- **PostgreSQL Connections Over Time** - Active, idle, max
- **Database Query Performance** - Mean and max query times

### 4. Redis Memory & Performance
- **Redis Memory Usage** - Current utilization %
- **Redis Memory Used** - Absolute memory consumed
- **Redis Memory Over Time** - Used vs max memory
- **Redis Operations/sec** - Commands, hits, misses
- **Redis Connected Clients** - Active and blocked clients
- **Redis Hit Rate** - Cache hit ratio

### 5. AI Agents & Business Metrics
- **AI Agent Activity** - Agent run rates
- **AI Agent Execution Time** - Per-agent execution duration
- **Revenue Over Time** - Revenue rate
- **Active Users** - Current active user count

### 6. System Resources
- **CPU Usage** - Per-instance CPU utilization
- **Memory Usage** - RAM utilization
- **Disk Usage** - Storage utilization
- **Network I/O** - RX/TX bandwidth
- **Disk I/O** - Read/write throughput

---

## Required Metrics

Ensure your services expose these Prometheus metrics:

### HTTP Metrics (Standard)
```promql
http_requests_total              # Counter with labels: service, status
http_request_duration_seconds_bucket  # Histogram with labels: service, le
up{job="<service-name>"}         # Service availability
```

### Database Metrics
```promql
pg_stat_activity_count           # PostgreSQL active connections
pg_settings_max_connections     # PostgreSQL max connections
pg_stat_statements_mean_exec_time_seconds  # Query timing
mongodb_connection_pool_size_used  # MongoDB pool usage
```

### Redis Metrics
```promql
redis_memory_used_bytes          # Memory usage
redis_memory_max_bytes          # Max memory config
redis_connected_clients         # Client count
redis_commands_processed_total  # Command rate
redis_keyspace_hits_total       # Cache hits
redis_keyspace_misses_total     # Cache misses
```

### System Metrics (Node Exporter)
```promql
node_cpu_seconds_total          # CPU usage
node_memory_MemAvailable_bytes  # Memory availability
node_filesystem_avail_bytes     # Disk space
node_network_receive_bytes_total # Network RX
node_disk_read_bytes_total      # Disk read
```

### Business Metrics
```promql
agent_runs_total                # AI agent invocations
agent_execution_time_seconds    # Agent execution time
revenue_total                   # Revenue counter
active_users                    # Active user gauge
```

---

## Prometheus Configuration

Ensure Prometheus scrapes your services. Example `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'intent-service'
    static_configs:
      - targets: ['intent-service:3000']
    metrics_path: /metrics

  - job_name: 'copilot'
    static_configs:
      - targets: ['copilot:3000']
    metrics_path: /metrics

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

---

## Datasources

The dashboard uses these datasources (configured in `provisioning/datasources/datasources.yml`):

| Datasource | Type | URL |
|------------|------|-----|
| Prometheus | prometheus | http://prometheus:9090 |
| Loki | loki | http://loki:3100 |
| Jaeger | jaeger | http://jaeger:16686 |

---

## Variables

The dashboard includes a **Service** variable for filtering:

- **Name:** `service`
- **Type:** Query
- **Query:** `label_values(up, job)`
- **Multi-select:** Enabled
- **Include All:** Enabled

---

## Alerting

To add alerts, duplicate panels and configure alert rules:

1. Click panel title > **Edit**
2. Switch to **Alert** tab
3. Click **Create Alert**
4. Configure conditions:
   - **Error Rate Alert:** `rate(http_requests_total{status=~"5.."}[5m]) > 0.01`
   - **Latency Alert:** `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000 > 500`
   - **Memory Alert:** `redis_memory_used_bytes / redis_memory_max_bytes * 100 > 85`

---

## Troubleshooting

### Dashboard shows "No data"
1. Verify Prometheus is accessible: `curl http://prometheus:9090/api/v1/query?query=up`
2. Check metric names match the queries
3. Ensure services are exposing `/metrics` endpoint

### Wrong datasource
1. Edit dashboard JSON
2. Update `uid` in each panel's `datasource` object
3. Or use Grafana UI: Click **dashboard settings > JSON Model** and replace `prometheus` with your datasource uid

### Missing panels
- Panels use Prometheus queries; if metrics don't exist, panels show no data
- Add the missing metrics to your services
