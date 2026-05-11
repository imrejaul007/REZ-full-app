#!/bin/bash
# Hotel Ecosystem Startup Script
# Starts all hotel-related services

echo "========================================"
echo "HOTEL ECOSYSTEM STARTUP"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
echo -e "\n${YELLOW}[1/5] Checking prerequisites...${NC}"

# Check MongoDB
if mongosh --eval "db.stats()" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MongoDB"
else
    echo -e "${RED}✗${NC} MongoDB not running. Start with: mongod --fork --logpath /data/logs/mongodb.log"
    exit 1
fi

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL"
else
    echo -e "${RED}✗${NC} PostgreSQL not running. Start PostgreSQL first."
    exit 1
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis"
else
    echo -e "${YELLOW}!${NC} Redis not running. Starting..."
    redis-server --daemonize yes
fi

# Create database if not exists
echo -e "\n${YELLOW}[2/5] Setting up database...${NC}"
PGPASSWORD=password psql -h localhost -U postgres -c "CREATE DATABASE hotel_pms;" 2>/dev/null || true
echo -e "${GREEN}✓${NC} Database ready"

# Push schema
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/Hotel-OTA/apps/api
npx prisma db push --skip-generate > /dev/null 2>&1 || true
echo -e "${GREEN}✓${NC} Schema pushed"

# Start services
echo -e "\n${YELLOW}[3/5] Starting services...${NC}"

# Hotel-PMS (API)
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/Hotel-OTA/apps/api
nohup node dist/index.js > /tmp/hotel-pms.log 2>&1 &
echo $! > /tmp/hotel-pms.pid
sleep 3

# StayOwn
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-stayown-service
nohup node dist/index.js > /tmp/stayown.log 2>&1 &
echo $! > /tmp/stayown.pid
sleep 2

# REZ Mind
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-mind-hotel-service
nohup node dist/index.js > /tmp/rez-mind.log 2>&1 &
echo $! > /tmp/rez-mind.pid
sleep 2

# Verify
echo -e "\n${YELLOW}[4/5] Verifying services...${NC}"

check_service() {
    local name=$1
    local port=$2
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name (port $port)"
    else
        echo -e "${RED}✗${NC} $name (port $port) - FAILED"
    fi
}

check_service "Hotel-PMS" 3008
check_service "StayOwn" 4015
check_service "REZ Mind" 4017

echo -e "\n${YELLOW}[5/5] Done!${NC}"
echo -e "\n${GREEN}Hotel Ecosystem Started Successfully!${NC}"
echo ""
echo "Services:"
echo "  Hotel-PMS:  http://localhost:3008"
echo "  StayOwn:    http://localhost:4015"
echo "  REZ Mind:   http://localhost:4017"
echo ""
echo "To stop: ./scripts/STOP_HOTEL.sh"
