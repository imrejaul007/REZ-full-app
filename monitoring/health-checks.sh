#!/bin/bash

# Check all service health endpoints
services=("analytics" "staff" "delivery" "capital")

for service in "${services[@]}"; do
  if curl -f "http://$service:3000/health" 2>/dev/null; then
    echo "OK: $service"
  else
    echo "FAILED: $service"
  fi
done
