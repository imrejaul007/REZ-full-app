#!/bin/bash
# ReZ Ecosystem API Tests
# Tests all critical API endpoints

set -e

BASE_URL="${API_TEST_URL:-http://localhost:3000}"
TOKEN=""

echo "========================================"
echo "ReZ Ecosystem API Tests"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0

# ==========================================
# TEST: Authentication
# ==========================================
echo ""
echo "Testing Authentication..."

# Register
echo -n "  Register user... "
response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@rez.app","password":"Test123!","name":"Test User"}')
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# Login
echo -n "  Login user... "
response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@rez.app","password":"Test123!"}')
if echo "$response" | grep -q "token"; then
  TOKEN=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# TEST: Profile
# ==========================================
echo ""
echo "Testing Profile Service..."

echo -n "  Get profile... "
response=$(curl -s -X GET "$BASE_URL/api/v1/profile" \
  -H "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# TEST: Wallet
# ==========================================
echo ""
echo "Testing Wallet Service..."

echo -n "  Get balance... "
response=$(curl -s -X GET "$BASE_URL/api/v1/wallet/balance" \
  -H "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

echo -n "  Add funds... "
response=$(curl -s -X POST "$BASE_URL/api/v1/wallet/add-funds" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000}')
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# TEST: Orders
# ==========================================
echo ""
echo "Testing Order Service..."

echo -n "  Create order... "
response=$(curl -s -X POST "$BASE_URL/api/v1/orders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"test","quantity":1,"price":100}],"total":100}')
if echo "$response" | grep -q "success"; then
  ORDER_ID=$(echo "$response" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
  ORDER_ID="test-order"
fi

# ==========================================
# TEST: Payment
# ==========================================
echo ""
echo "Testing Payment Service..."

echo -n "  Process payment... "
response=$(curl -s -X POST "$BASE_URL/api/v1/payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\",\"amount\":100,\"method\":\"wallet\"}")
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# TEST: REZ Mind / Copilot
# ==========================================
echo ""
echo "Testing REZ Mind / Copilot..."

echo -n "  Chat with copilot... "
response=$(curl -s -X POST "$BASE_URL/api/v1/copilot/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Show me restaurants","sessionId":"test-session"}')
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# TEST: REE
# ==========================================
echo ""
echo "Testing REE (Business Intelligence)..."

echo -n "  Get recommendations... "
response=$(curl -s -X GET "$BASE_URL/api/v1/ree/recommendations" \
  -H "Authorization: Bearer $TOKEN")
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# TEST: Intent Graph
# ==========================================
echo ""
echo "Testing Intent Graph..."

echo -n "  Track intent... "
response=$(curl -s -X POST "$BASE_URL/api/v1/intent/track" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","intent":"browse_restaurants"}')
if echo "$response" | grep -q "success"; then
  echo -e "${GREEN}PASS${NC}"
  ((PASSED++))
else
  echo -e "${RED}FAIL${NC}"
  ((FAILED++))
fi

# ==========================================
# RESULTS
# ==========================================
echo ""
echo "========================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
  exit 1
fi

exit 0
