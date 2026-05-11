#!/bin/bash
# ReZ Ecosystem Integration Tests
# Tests service-to-service communication

set -e

BASE_URL="${INTEGRATION_TEST_URL:-http://localhost:3000}"

echo "========================================"
echo "ReZ Ecosystem Integration Tests"
echo "========================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASS=0
FAIL=0

# ==========================================
# TEST: REZ Mind Integration
# ==========================================
echo ""
echo "Testing REZ Mind Integration..."

echo -n "  REZ Mind → Profile... "
if curl -s "$BASE_URL/api/v1/mind/profile" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

echo -n "  REZ Mind → Wallet... "
if curl -s "$BASE_URL/api/v1/mind/wallet" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

# ==========================================
# TEST: REE Integration
# ==========================================
echo ""
echo "Testing REE (Business Intelligence) Integration..."

echo -n "  REE → Orders... "
if curl -s "$BASE_URL/api/v1/ree/orders" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

echo -n "  REE → Users... "
if curl -s "$BASE_URL/api/v1/ree/users" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

echo -n "  REE → Revenue... "
if curl -s "$BASE_URL/api/v1/ree/revenue" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

# ==========================================
# TEST: Intent Graph Integration
# ==========================================
echo ""
echo "Testing Intent Graph Integration..."

echo -n "  Intent → User Context... "
if curl -s "$BASE_URL/api/v1/intent/context" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

echo -n "  Intent → Recommendations... "
if curl -s "$BASE_URL/api/v1/intent/recommendations" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

# ==========================================
# TEST: Support Copilot Integration
# ==========================================
echo ""
echo "Testing Support Copilot Integration..."

echo -n "  Copilot → Profile... "
if curl -s "$BASE_URL/api/v1/copilot/profile" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

echo -n "  Copilot → Products... "
if curl -s "$BASE_URL/api/v1/copilot/products" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

# ==========================================
# TEST: Loyalty Integration
# ==========================================
echo ""
echo "Testing Loyalty Integration..."

echo -n "  Karma → Points... "
if curl -s "$BASE_URL/api/v1/karma/points" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

echo -n "  Karma → Tiers... "
if curl -s "$BASE_URL/api/v1/karma/tiers" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASS++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAIL++))
fi

# ==========================================
# RESULTS
# ==========================================
echo ""
echo "========================================"
echo "Integration Test Results"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "========================================"

if [ $FAIL -gt 0 ]; then
  exit 1
fi

exit 0
