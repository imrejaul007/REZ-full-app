#!/bin/bash
# Health Check Script

echo "=== ReZ Platform Health Check ==="
echo ""

# Check each service
check_service() {
  local url=$1
  local name=$2
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$status" = "200" ]; then
    echo "✅ $name: HEALTHY"
  else
    echo "❌ $name: DOWN (HTTP $status)"
  fi
}

check_service "https://rez-api-gateway.onrender.com/health" "API Gateway"
check_service "https://rez-auth-service.onrender.com/health" "Auth Service"
check_service "https://rez-order-service.onrender.com/health" "Order Service"
check_service "https://rez-payment-service.onrender.com/health" "Payment Service"
check_service "https://rez-wallet-service.onrender.com/health" "Wallet Service"
check_service "https://rez-intent-graph.onrender.com/health" "Intent Graph"

echo ""
echo "=== Check Complete ==="
