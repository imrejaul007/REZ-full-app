#!/bin/bash
# REZ Ecosystem - Service Startup
# Usage: ./scripts/start-ecosystem.sh --core

set -e

# Start infrastructure
docker compose -f docker-compose.infra.yml up -d

# Core services
SERVICES=(
  "rez-auth-service:4002"
  "rez-merchant-service:4005"
  "rez-api-gateway:3000"
)

for svc in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$svc"
  if [ -d "$name" ]; then
    echo "Starting $name..."
    (cd "$name" && npm start &)
  fi
done

echo "Services starting..."
echo "Run './scripts/verify-services.sh' to check health"
