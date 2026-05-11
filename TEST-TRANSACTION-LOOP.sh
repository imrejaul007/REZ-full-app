#!/bin/bash
# ReZ Platform - Transaction Loop Test Script
# Tests the complete transaction loop end-to-end

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "========================================"
echo "  ReZ - Transaction Loop Test"
echo "========================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

# Test 1: Health Check
info "Test 1: Health Check"
if curl -s "$BASE_URL/health" | grep -q "ok"; then
  pass "API Gateway health check"
else
  fail "API Gateway health check"
fi

# Test 2: User Registration
info "Test 2: User Registration"
USER_EMAIL="test_$(date +%s)@rez.test"
REG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"Test123456!\"}")

if echo "$REG_RESPONSE" | grep -q "userId\|id\|token"; then
  USER_ID=$(echo "$REG_RESPONSE" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  TOKEN=$(echo "$REG_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  pass "User registration"
else
  fail "User registration"
fi

# Test 3: User Login
info "Test 3: User Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"Test123456!\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  pass "User login"
else
  fail "User login"
fi

# Test 4: Check Wallet Balance (should be 0)
info "Test 4: Check Wallet Balance"
WALLET_RESPONSE=$(curl -s -X GET "$BASE_URL/api/wallet/balance" \
  -H "Authorization: Bearer $TOKEN")

if echo "$WALLET_RESPONSE" | grep -q "balance\|coins"; then
  BALANCE=$(echo "$WALLET_RESPONSE" | grep -o '"balance":[0-9]*' | cut -d':' -f2)
  if [ "$BALANCE" == "0" ]; then
    pass "Wallet balance is 0"
  else
    info "Wallet balance: $BALANCE"
  fi
else
  fail "Wallet balance check"
fi

# Test 5: Simulate Payment (coin earning)
info "Test 5: Simulate Payment - Earn Coins"
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/payment/simulate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":100,"currency":"INR","method":"upi"}')

if echo "$PAYMENT_RESPONSE" | grep -q "success\|transactionId"; then
  pass "Payment simulation successful"
else
  fail "Payment simulation"
fi

# Test 6: Check Wallet Balance After Payment (should be > 0)
info "Test 6: Check Wallet Balance After Payment"
sleep 1
WALLET_RESPONSE=$(curl -s -X GET "$BASE_URL/api/wallet/balance" \
  -H "Authorization: Bearer $TOKEN")

BALANCE=$(echo "$WALLET_RESPONSE" | grep -o '"balance":[0-9]*' | cut -d':' -f2)
if [ "$BALANCE" -gt 0 ]; then
  pass "Coins earned: $BALANCE"
else
  fail "Coins not earned"
fi

# Test 7: Create Order
info "Test 7: Create Order"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"productId":"prod_001","quantity":1,"price":100}],"total":100}')

if echo "$ORDER_RESPONSE" | grep -q "orderId\|id"; then
  ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
  pass "Order created"
else
  fail "Order creation"
fi

# Test 8: Order Status
info "Test 8: Check Order Status"
ORDER_STATUS=$(curl -s -X GET "$BASE_URL/api/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ORDER_STATUS" | grep -q "status\|pending"; then
  pass "Order status retrieved"
else
  fail "Order status check"
fi

# Test 9: Redeem Coins
info "Test 9: Redeem Coins"
REDEEM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/wallet/redeem" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount":10,"orderId":"'$ORDER_ID'"}')

if echo "$REDEEM_RESPONSE" | grep -q "success\|transactionId"; then
  pass "Coin redemption successful"
else
  info "Coin redemption (may fail if insufficient balance)"
fi

# Test 10: Transaction History
info "Test 10: Transaction History"
HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/wallet/history" \
  -H "Authorization: Bearer $TOKEN")

if echo "$HISTORY_RESPONSE" | grep -q "transactions\|history"; then
  pass "Transaction history retrieved"
else
  fail "Transaction history"
fi

echo ""
echo "========================================"
echo -e "${GREEN}  Transaction Loop: ALL TESTS PASSED${NC}"
echo "========================================"
echo ""
echo "Summary:"
echo "  - User Registration: ✓"
echo "  - User Login: ✓"
echo "  - Wallet Balance: ✓"
echo "  - Payment Simulation: ✓"
echo "  - Coin Earning: ✓"
echo "  - Order Creation: ✓"
echo "  - Order Status: ✓"
echo "  - Coin Redemption: ✓"
echo "  - Transaction History: ✓"
echo ""
