#!/bin/bash

# =============================================================================
# REZ Loyalty Ecosystem - Deployment Script
# =============================================================================

set -e

echo "🚀 REZ Loyalty Ecosystem Deployment"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Get docker compose command
DOCKER_COMPOSE="docker-compose"
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
fi

# Check .env file
if [ ! -f .env.loyalty ]; then
    echo -e "${YELLOW}⚠️  .env.loyalty not found. Creating from template...${NC}"
    cp .env.loyalty.example .env.loyalty 2>/dev/null || true
    echo -e "${YELLOW}Please edit .env.loyalty with your configuration${NC}"
fi

# Parse command
COMMAND=${1:-"up"}

case $COMMAND in
    up|start)
        echo -e "\n${GREEN}🚀 Starting REZ Loyalty Ecosystem...${NC}"

        # Pull latest images if on main
        echo -e "\n${YELLOW}📦 Pulling latest images...${NC}"
        $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml pull || true

        # Start services
        echo -e "\n${GREEN}🔄 Starting services...${NC}"
        $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml up -d

        # Wait for services
        echo -e "\n${YELLOW}⏳ Waiting for services to be healthy...${NC}"
        sleep 10

        # Check health
        echo -e "\n${GREEN}✅ Health Check:${NC}"
        for port in 3000 4025 4026 4027 4028 4029 4030 4031 4032 4033 4034; do
            if curl -sf http://localhost:$port/health > /dev/null 2>&1; then
                echo -e "  Port $port: ${GREEN}✅ Healthy${NC}"
            else
                echo -e "  Port $port: ${RED}❌ Not responding${NC}"
            fi
        done

        echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
        echo -e "\nService URLs:"
        echo "  - DLQ Dashboard:      http://localhost:3000"
        echo "  - Profile Aggregator: http://localhost:4025"
        echo "  - Streak Service:     http://localhost:4026"
        echo "  - Cross-Merchant:     http://localhost:4027"
        echo "  - ReZ Score:          http://localhost:4028"
        echo "  - Karma-Loyalty:      http://localhost:4029"
        echo "  - Monitoring:          http://localhost:4030"
        echo "  - Event Bus:           http://localhost:4031"
        echo "  - Notifications:      http://localhost:4032"
        echo "  - Identity:            http://localhost:4033"
        echo "  - Webhooks:            http://localhost:4034"
        ;;

    down|stop)
        echo -e "\n${YELLOW}🛑 Stopping REZ Loyalty Ecosystem...${NC}"
        $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml down
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;

    restart)
        echo -e "\n${YELLOW}🔄 Restarting REZ Loyalty Ecosystem...${NC}"
        $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml restart
        echo -e "${GREEN}✅ All services restarted${NC}"
        ;;

    logs)
        SERVICE=${2:-""}
        echo -e "\n${YELLOW}📋 Viewing logs...${NC}"
        if [ -z "$SERVICE" ]; then
            $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml logs -f
        else
            $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml logs -f $SERVICE
        fi
        ;;

    status)
        echo -e "\n${YELLOW}📊 Service Status:${NC}\n"
        $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml ps
        ;;

    rebuild)
        echo -e "\n${YELLOW}🔨 Rebuilding services...${NC}"
        $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml build --no-cache
        echo -e "${GREEN}✅ Build complete. Run './deploy-loyalty.sh up' to start.${NC}"
        ;;

    clean)
        echo -e "${RED}⚠️  This will remove all containers, volumes, and data!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
            $DOCKER_COMPOSE -f docker-compose.loyalty-complete.yml down -v --remove-orphans
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo "Cancelled."
        fi
        ;;

    help|*)
        echo -e "\n${GREEN}REZ Loyalty Ecosystem Deployment${NC}"
        echo "================================"
        echo ""
        echo "Usage: ./deploy-loyalty.sh <command>"
        echo ""
        echo "Commands:"
        echo "  up       - Start all services (default)"
        echo "  down     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  status   - Show service status"
        echo "  logs     - View logs (all services)"
        echo "  logs <s> - View logs for specific service"
        echo "  rebuild  - Rebuild Docker images"
        echo "  clean    - Remove all containers and volumes"
        echo "  help     - Show this help"
        ;;
esac
