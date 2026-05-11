#!/bin/bash
# Stop all services
set -e

echo "🛑 Stopping all services..."

services=(
    "intent-service"
    "copilot"
    "decision-service"
    "ad-platform"
    "api-gateway"
)

for svc in "${services[@]}"; do
    pkill -f "$svc" 2>/dev/null && echo "Stopped $svc" || echo "$svc not running"
done

echo "All services stopped"
