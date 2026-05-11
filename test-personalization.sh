#!/bin/bash
# REZ Mind - Test Personalization
# Tests the complete personalization flow

echo "=============================================="
echo "REZ MIND - TEST PERSONALIZATION"
echo "=============================================="
echo ""

BASE_URL="http://localhost:4020"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "1. Testing Intelligence Hub Health..."
echo "-------------------------------------"
response=$(curl -s "$BASE_URL/health" 2>/dev/null)
if [ -n "$response" ]; then
    echo -e "${GREEN}Health OK${NC}"
    echo "$response" | head -5
else
    echo -e "${RED}Failed${NC}"
fi
echo ""

echo "2. Testing Dashboard Stats..."
echo "-------------------------------------"
response=$(curl -s "$BASE_URL/api/dashboard/stats" 2>/dev/null)
if [ -n "$response" ]; then
    echo -e "${GREEN}Stats OK${NC}"
    echo "$response" | head -3
else
    echo -e "${RED}Failed${NC}"
fi
echo ""

echo "3. Testing Dashboard Health..."
echo "-------------------------------------"
response=$(curl -s "$BASE_URL/api/dashboard/health" 2>/dev/null)
if [ -n "$response" ]; then
    echo -e "${GREEN}Health OK${NC}"
    echo "$response"
else
    echo -e "${RED}Failed${NC}"
fi
echo ""

echo "4. Testing Segment Distribution..."
echo "-------------------------------------"
response=$(curl -s "$BASE_URL/api/dashboard/segments" 2>/dev/null)
if [ -n "$response" ]; then
    echo -e "${GREEN}Segments OK${NC}"
    echo "$response"
else
    echo -e "${RED}Failed${NC}"
fi
echo ""

echo "5. Testing User Profile (with mock user)..."
echo "-------------------------------------"
# Use a test user ID
TEST_USER="test_user_123"
response=$(curl -s "$BASE_URL/api/intelligence/user/$TEST_USER/profile" 2>/dev/null)
if [ -n "$response" ]; then
    echo -e "${GREEN}Profile OK${NC}"
    echo "$response" | head -3
else
    echo -e "${RED}Failed${NC}"
fi
echo ""

echo "=============================================="
echo "Test complete"
echo "=============================================="
