#!/bin/bash
# =============================================================================
# Prometheus Metrics Setup
# =============================================================================

set -e

echo "📊 Setting up Prometheus monitoring..."

# Create prometheus config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'intent-service'
    static_configs:
      - targets: ['localhost:4009']

  - job_name: 'copilot'
    static_configs:
      - targets: ['localhost:4026']

  - job_name: 'decision-service'
    static_configs:
      - targets: ['localhost:4027']

  - job_name: 'ad-platform'
    static_configs:
      - targets: ['localhost:4028']

  - job_name: 'api-gateway'
    static_configs:
      - targets: ['localhost:3000']
EOF

echo "Created prometheus.yml"

# Create docker-compose for monitoring
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
EOF

echo "Created docker-compose.monitoring.yml"
echo ""
echo "To start monitoring:"
echo "  docker-compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "Access:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001 (admin/admin)"
