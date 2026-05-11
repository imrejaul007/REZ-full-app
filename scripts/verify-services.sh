#!/bin/bash
# REZ Services Health Check

SERVICES=(
  "rez-api-gateway:3000"
  "rez-auth-service:4002"
  "rez-merchant-service:4005"
)

for svc in "${SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$svc"
  if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "✓ $name OK"
  else
    echo "✗ $name FAILED"
  fi
done
