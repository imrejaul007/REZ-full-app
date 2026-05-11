#!/bin/bash
# Hotel Ecosystem Test Script
# Tests all endpoints

set -e

echo "=============================================="
echo "   Hotel Ecosystem API Tests"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Generate test token
JWT_SECRET="JhTlICvkMrytFfUINXwngdgeo8SDGV4KrCyUX4vIixK+LR0Ue+AqeZxcmZq1cN1b"
TOKEN=$(node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({sub:'test-user-id', name:'Test User', email:'test@example.com'}, '$JWT_SECRET'))")

# Test counter
PASS=0
FAIL=0

# Test function
test_api() {
    local name=$1
    local expected=$2
    local result=$3

    if [[ "$result" == *"$expected"* ]]; then
        echo -e "${GREEN}[PASS]${NC} $name"
        ((PASS++))
    else
        echo -e "${RED}[FAIL]${NC} $name"
        echo "  Expected: $expected"
        echo "  Got: $result"
        ((FAIL++))
    fi
}

echo "Testing StayOwn Service (port 4015)..."
echo ""

# Test Hotel Search
RESULT=$(curl -s "http://localhost:4015/api/hotels/search?city=Mumbai" -H "Authorization: Bearer $TOKEN")
test_api "Hotel Search" '"success":true' "$RESULT"

# Test Hotel Details
RESULT=$(curl -s "http://localhost:4015/api/hotels/P001" -H "Authorization: Bearer $TOKEN")
test_api "Hotel Details" '"name":"The Grand Mumbai"' "$RESULT"

# Test Room Availability
RESULT=$(curl -s "http://localhost:4015/api/hotels/P001/availability?checkIn=2026-05-10&checkOut=2026-05-15" -H "Authorization: Bearer $TOKEN")
test_api "Room Availability" '"available":true' "$RESULT"

# Test Pricing
RESULT=$(curl -s -X POST "http://localhost:4015/api/hotels/pricing/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"P001","roomId":"RT001","checkIn":"2026-05-10","checkOut":"2026-05-15"}')
test_api "Pricing Calculation" '"success":true' "$RESULT"

# Test Room QR Generation
QR_RESULT=$(curl -s -X POST "http://localhost:4015/api/room-qr/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "H001",
    "hotelName": "Test Hotel",
    "hotelSlug": "test-hotel",
    "roomId": "R101",
    "roomNumber": "101",
    "bookingId": "BK999",
    "guestId": "G999",
    "guestName": "Test Guest",
    "guestEmail": "test@example.com",
    "guestPhone": "9876543210",
    "checkIn": "2026-05-10",
    "checkOut": "2026-05-15"
  }')
test_api "Room QR Generation" '"success":true' "$QR_RESULT"

echo ""
echo "Testing REZ Mind Service (port 4017)..."
echo ""

# Test REZ Mind - Search Event
RESULT=$(curl -s -X POST "http://localhost:4017/api/events/search" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "sessionId": "session-123",
    "query": "hotels in Mumbai",
    "city": "Mumbai",
    "resultsCount": 5,
    "selectedHotelId": "H001"
  }')
test_api "REZ Mind - Search Event" '"success":true' "$RESULT"

# Test REZ Mind - AI Recommendations
RESULT=$(curl -s -X POST "http://localhost:4017/api/ai/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "city": "Mumbai",
    "budget": 10000
  }')
test_api "REZ Mind - AI Recommendations" '"success":true' "$RESULT"

# Test REZ Mind - Dynamic Pricing
RESULT=$(curl -s -X POST "http://localhost:4017/api/ai/pricing" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "H001",
    "baseRate": 5000,
    "checkIn": "2026-05-10",
    "checkOut": "2026-05-15"
  }')
test_api "REZ Mind - Dynamic Pricing" '"success":true' "$RESULT"

echo ""
echo "=============================================="
echo "   Test Results"
echo "=============================================="
echo ""
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
