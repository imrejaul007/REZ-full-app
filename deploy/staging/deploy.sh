#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════"
echo "  ReZ Ecosystem - Staging Deployment"
echo "═══════════════════════════════════════════════════════"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STAGE="${1:-staging}"
COMPOSE_FILE="docker-compose.yml"

echo -e "${YELLOW}Deploying to $STAGE environment...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from example...${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env with your values!${NC}"
fi

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 30

# Check status
echo -e "\n${GREEN}Service Status:${NC}"
docker-compose -f $COMPOSE_FILE ps

# Health checks
echo -e "\n${GREEN}Health Checks:${NC}"

check_service() {
    local service=$1
    local port=$2
    local name=$3

    if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "  ✓ $name: ${GREEN}OK${NC}"
    else
        echo -e "  ✗ $name: ${RED}FAILED${NC}"
    fi
}

check_service merchant-service 4005 "Merchant (Loyalty)"
check_service order-service 4006 "Order Service"
check_service payment-service 4001 "Payment Service"
check_service wallet-service 4004 "Wallet Service"
check_service karma-service 4003 "Karma Service"
check_service marketing-service 4002 "Marketing Service"

echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "  Deployment Complete!"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}Service URLs:${NC}"
echo "  Merchant (Loyalty): http://localhost:4005"
echo "  Order Service:     http://localhost:4006"
echo "  Payment Service:   http://localhost:4001"
echo "  Wallet Service:    http://localhost:4004"
echo "  Karma Service:     http://localhost:4003"
echo "  Marketing Service: http://localhost:4002"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  View logs:     docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services:  docker-compose -f $COMPOSE_FILE down"
echo "  Restart:       docker-compose -f $COMPOSE_FILE restart"
echo "  Remove all:    docker-compose -f $COMPOSE_FILE down -v"
