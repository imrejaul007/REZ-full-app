#!/bin/bash
# ReZ Platform - Deploy All Core Services
# Usage: ./DEPLOY-CORE-SERVICES.sh [service-name]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Services to deploy in order
SERVICES=(
  "rez-auth-service"
  "rez-wallet-service"
  "rez-payment-service"
  "rez-order-service"
  "rez-merchant-service"
)

PORT_BASE=4000

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ReZ Platform - Core Services Deploy${NC}"
echo -e "${GREEN}========================================${NC}"

deploy_service() {
  local service=$1
  local port=$2

  echo -e "\n${YELLOW}━━━ Deploying $service on port $port ━━━${NC}"

  if [ ! -d "$service" ]; then
    echo -e "${RED}Service directory not found: $service${NC}"
    return 1
  fi

  cd "$service"

  # Check if dependencies are installed
  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps 2>&1 | tail -5
  fi

  # Build TypeScript
  echo "Building TypeScript..."
  npm run build 2>&1 | tail -10

  # Copy .env.example to .env if not exists
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      cp .env.example .env
      echo -e "${YELLOW}Created .env file - configure it before starting!${NC}"
    fi
  fi

  # Check if service is already running
  if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}Service already running on port $port${NC}"
    cd ..
    return 0
  fi

  # Start service in background
  echo "Starting service..."
  PORT=$port npm run start > "$service.log" 2>&1 &
  PID=$!

  # Wait for service to start (max 30 seconds)
  for i in {1..30}; do
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ $service is running (PID: $PID)${NC}"
      cd ..
      return 0
    fi
    sleep 1
  done

  # Check log for errors
  echo -e "${RED}✗ $service failed to start${NC}"
  echo "Last 20 lines of log:"
  tail -20 "$service.log"
  cd ..

  return 1
}

deploy_all() {
  local port=$PORT_BASE
  local failed=0

  for service in "${SERVICES[@]}"; do
    if ! deploy_service "$service" "$port"; then
      ((failed++))
    fi
    ((port++))
  done

  echo -e "\n${GREEN}========================================${NC}"
  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}  All core services deployed!${NC}"
  else
    echo -e "${RED}  $failed service(s) failed${NC}"
  fi
  echo -e "${GREEN}========================================${NC}"

  echo -e "\n${YELLOW}Service URLs:${NC}"
  port=$PORT_BASE
  for service in "${SERVICES[@]}"; do
    echo "  $service: http://localhost:$port"
    ((port++))
  done
}

# Main
if [ -z "$1" ]; then
  deploy_all
else
  service=$1
  port=$((PORT_BASE + $(($(printf '%s\n' "${SERVICES[@]}" | grep -n "^$service$" | cut -d: -f1) - 1))))
  deploy_service "$service" "$port"
fi
