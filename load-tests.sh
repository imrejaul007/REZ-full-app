#!/bin/bash
# ReZ Ecosystem Load Tests
# Simulates concurrent users and measures performance

set -e

BASE_URL="${LOAD_TEST_URL:-http://localhost:3000}"
CONCURRENT_USERS="${CONCURRENT:-10}"
DURATION="${DURATION:-30}"

echo "========================================"
echo "ReZ Ecosystem Load Tests"
echo "Concurrent Users: $CONCURRENT_USERS"
echo "Duration: ${DURATION}s"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL_LATENCY=0
TOTAL_REQUESTS=0

# Function to make a request and measure latency
make_request() {
  local endpoint=$1
  local start_time=$(date +%s%3N)
  local response=$(curl -s -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
  local end_time=$(date +%s%3N)
  local latency=$((end_time - start_time))

  local http_code="${response: -3}"
  local body="${response:0:${#response}-3}"

  TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))
  TOTAL_LATENCY=$((TOTAL_LATENCY + latency))

  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "  $endpoint: ${GREEN}PASS${NC} (${latency}ms)"
    PASS=$((PASS + 1))
  else
    echo "  $endpoint: ${RED}FAIL${NC} (${http_code})"
    FAIL=$((FAIL + 1))
  fi
}

# ==========================================
# TEST: Concurrent User Simulation
# ==========================================
echo ""
echo "Testing concurrent user load..."

for i in $(seq 1 $CONCURRENT_USERS); do
  echo "User $i:"
  make_request "/health"
  make_request "/api/v1/auth/health"
  make_request "/api/v1/profile/health"
  make_request "/api/v1/wallet/health"
  make_request "/api/v1/orders/health"
done

# ==========================================
# TEST: Rapid Fire Endpoints
# ==========================================
echo ""
echo "Testing rapid-fire requests..."

ENDPOINTS=(
  "/health"
  "/api/v1/auth/health"
  "/api/v1/profile/health"
  "/api/v1/wallet/health"
  "/api/v1/orders/health"
  "/api/v1/mind/health"
  "/api/v1/copilot/health"
  "/api/v1/ree/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  make_request "$endpoint"
done

# ==========================================
# TEST: Performance Thresholds
# ==========================================
echo ""
echo "Performance Thresholds:"

AVG_LATENCY=$((TOTAL_LATENCY / TOTAL_REQUESTS))
echo "  Average Latency: ${AVG_LATENCY}ms"

if [ $AVG_LATENCY -lt 200 ]; then
  echo -e "  Latency: ${GREEN}PASS${NC} (< 200ms)"
else
  echo -e "  Latency: ${RED}FAIL${NC} (> 200ms)"
fi

PASS_RATE=$(echo "scale=2; $PASS * 100 / $TOTAL_REQUESTS" | bc)
echo "  Pass Rate: ${PASS_RATE}%"

# ==========================================
# RESULTS
# ==========================================
echo ""
echo "========================================"
echo "Load Test Results"
echo "========================================"
echo "Total Requests: $TOTAL_REQUESTS"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Average Latency: ${AVG_LATENCY}ms"
echo "Pass Rate: ${PASS_RATE}%"
echo "========================================"

if [ $FAIL -gt 0 ] || [ $AVG_LATENCY -gt 200 ]; then
  exit 1
fi

exit 0
