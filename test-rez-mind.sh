#!/bin/bash
# REZ Mind - Health Check Script (Tests DEPLOYED services)
# Tests against Render deployments

echo "=============================================="
echo "REZ MIND - HEALTH CHECK (DEPLOYED)"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check service health
check_health() {
    local name=$1
    local url=$2

    echo -n "Checking $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}OK${NC}"
        return 0
    elif [ "$response" = "000" ]; then
        echo -e "${RED}NOT DEPLOYED${NC}"
        return 1
    else
        echo -e "${YELLOW}HTTP $response${NC}"
        return 1
    fi
}

echo "REZ Mind Services:"
echo "-----------------"
check_health "Intent Graph" "https://rez-intent-graph.onrender.com/health"
check_health "Intelligence Hub" "https://rez-intelligence-hub.onrender.com/health"
check_health "Personalization" "https://rez-personalization.onrender.com/health"
check_health "Recommendation" "https://rez-recommendation.onrender.com/health"
check_health "Targeting" "https://rez-targeting.onrender.com/health"
check_health "Action Engine" "https://rez-action-engine.onrender.com/health"

echo ""
echo "Core Services:"
echo "--------------"
check_health "API Gateway" "https://rez-api-gateway.onrender.com/health"
check_health "Auth Service" "https://rez-auth-service.onrender.com/health"
check_health "Wallet" "https://rez-wallet-service.onrender.com/health"

echo ""
echo "=============================================="
echo "Health check complete"
echo "=============================================="
echo ""
echo "To test deployed services:"
echo "  curl https://rez-intelligence-hub.onrender.com/health"
echo "  curl https://rez-intelligence-hub.onrender.com/api/dashboard/stats"
