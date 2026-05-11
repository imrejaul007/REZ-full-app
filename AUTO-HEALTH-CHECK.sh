#!/bin/bash
# ReZ Platform - Health Check All Services
# Usage: ./AUTO-HEALTH-CHECK.sh

set -e

echo "========================================"
echo "  ReZ Platform - Health Check"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# All services with ports
declare -A SERVICES=(
    ["API Gateway"]="3000"
    ["User Intelligence"]="3004"
    ["Order Service"]="3006"
    ["Intent Graph"]="3007"
    ["Targeting Engine"]="3013"
    ["Action Engine"]="3014"
    ["Payment Service"]="4001"
    ["Auth Service"]="4002"
    ["Wallet Service"]="4004"
    ["Merchant Service"]="4005"
    ["Merchant Intelligence"]="4012"
    ["Personalization Engine"]="4017"
    ["Intelligence Hub"]="4020"
    ["Consumer Copilot"]="4021"
    ["Merchant Copilot"]="4022"
    ["Support Copilot"]="4033"
    ["ML Feature Store"]="4100"
    ["ML Model Registry"]="4101"
    ["Training Data"]="4102"
    ["Fraud Detection"]="4103"
    ["Price Optimization"]="4104"
    ["A/B Testing"]="4105"
    ["Data Quality Monitor"]="4106"
    ["ML Retraining"]="4107"
    ["BBPS Service"]="4110"
    ["Recharge Service"]="4111"
    ["E-Invoice Service"]="4112"
)

TOTAL=0
HEALTHY=0
UNHEALTHY=0

for SERVICE in "${!SERVICES[@]}"; do
    PORT="${SERVICES[$SERVICE]}"
    ((TOTAL++))

    RESPONSE=$(curl -sf --max-time 5 "http://localhost:$PORT/health" 2>/dev/null || echo "")

    if [ -n "$RESPONSE" ]; then
        echo -e "  ${GREEN}✓${NC} $SERVICE (Port $PORT)"
        ((HEALTHY++))
    else
        echo -e "  ${RED}✗${NC} $SERVICE (Port $PORT) - Not responding"
        ((UNHEALTHY++))
    fi
done

echo ""
echo "========================================"
echo "  Health Check Summary"
echo "========================================"
echo -e "  Total Services: $TOTAL"
echo -e "  ${GREEN}Healthy: $HEALTHY${NC}"
echo -e "  ${RED}Unhealthy: $UNHEALTHY${NC}"
echo ""

if [ $UNHEALTHY -gt 0 ]; then
    echo -e "${YELLOW}Some services are not healthy. Check logs.${NC}"
    exit 1
else
    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
fi
