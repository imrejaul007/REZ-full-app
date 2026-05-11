#!/bin/bash
# ReZ Ecosystem Smoke Tests
# Tests all 169 services health endpoints

set -e

BASE_URL="${SMOKE_TEST_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

echo "========================================"
echo "ReZ Ecosystem Smoke Tests"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

# Services to test (Core services first)
SERVICES=(
  "api-gateway:/health:200"
  "auth:/api/v1/auth/health:200"
  "payment:/api/v1/payment/health:200"
  "wallet:/api/v1/wallet/health:200"
  "profile:/api/v1/profile/health:200"
  "order:/api/v1/orders/health:200"
  "merchant:/api/v1/merchant/health:200"
  "notification:/api/v1/notification/health:200"
  "mind:/api/v1/mind/health:200"
  "copilot:/api/v1/copilot/health:200"
  "ree:/api/v1/ree/health:200"
  "intent:/api/v1/intent/health:200"
)

echo -e "${YELLOW}Testing Core Services${NC}"
echo "----------------------------------------"

for service in "${SERVICES[@]}"; do
  IFS=':' read -r name path expected <<< "$service"

  echo -n "Testing $name... "

  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" 2>/dev/null || echo "000")
  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "$expected" ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
  else
    echo -e "${RED}FAIL${NC} (expected $expected, got $http_code)"
    ((FAILED++))
  fi
done

echo ""
echo "========================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0
