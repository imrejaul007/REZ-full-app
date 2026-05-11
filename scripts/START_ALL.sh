#!/bin/bash
# START_ALL.sh - Start all ReZ services in correct order
# Usage: ./scripts/START_ALL.sh

set -e

# ANSI colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ReZ Full App - Starting All Services${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service health
wait_for_health() {
    local name=$1
    local url=$2
    local max_attempts=${3:-30}
    local attempt=1

    echo -n "  Waiting for $name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}OK${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
        attempt=$((attempt + 1))
    done
    echo -e " ${YELLOW}TIMEOUT${NC} (health check failed after ${max_attempts}s)"
    return 1
}

# Function to start a service
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local cmd=$4
    local health_url=${5:-""}

    echo -e "\n${YELLOW}[$name]${NC}"

    # Check if port is already in use
    if check_port $port; then
        echo -e "  ${YELLOW}Port $port already in use - skipping${NC}"
        return 0
    fi

    # Check if directory exists
    if [ ! -d "$dir" ]; then
        echo -e "  ${RED}Directory not found: $dir${NC}"
        return 1
    fi

    # Check if node_modules exists
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "  ${YELLOW}node_modules not found - running npm install...${NC}"
        (cd "$dir" && npm install) || {
            echo -e "  ${RED}npm install failed${NC}"
            return 1
        }
    fi

    # Start the service in background
    echo -e "  Starting on port $port..."
    cd "$dir"

    # Check if dist exists, if not build
    if [ ! -d "dist" ]; then
        echo -e "  Building..."
        npm run build 2>/dev/null || {
            echo -e "  ${RED}Build failed${NC}"
            return 1
        }
    fi

    # Start with nohup to detach
    nohup $cmd > "$SCRIPT_DIR/logs/${name}.log" 2>&1 &
    local pid=$!
    echo $pid > "$SCRIPT_DIR/pids/${name}.pid"

    echo -e "  PID: $pid"

    # Wait for health if URL provided
    if [ -n "$health_url" ]; then
        wait_for_health "$name" "$health_url"
    else
        sleep 2
        echo -e "  ${GREEN}Started${NC}"
    fi
}

# Create logs and pids directories
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/pids"

echo -e "\n${BLUE}Service Order:${NC}"
echo "  1. Shared packages (build first)"
echo "  2. rez-merchant-service (4005)"
echo "  3. rez-wallet-service (4004)"
echo "  4. rez-payment-service (4001)"
echo "  5. rez-order-service (4006)"
echo "  6. rez-socket-service (4007)"
echo "  7. ReStopapa backend (8000)"

# ============================================
# Phase 1: Build shared packages
# ============================================
echo -e "\n${BLUE}[Phase 1] Building shared packages...${NC}"

SHARED_PKG_DIR="$PROJECT_ROOT/packages/rez-shared"
SHARED_TYPES_DIR="$PROJECT_ROOT/packages/shared-types"

if [ -d "$SHARED_PKG_DIR" ]; then
    if [ -d "$SHARED_PKG_DIR/node_modules" ]; then
        echo "  Building @rez/shared..."
        (cd "$SHARED_PKG_DIR" && npm run build 2>/dev/null || npm run build) || true
    fi
fi

if [ -d "$SHARED_TYPES_DIR" ]; then
    if [ -d "$SHARED_TYPES_DIR/node_modules" ]; then
        echo "  Building @rez/shared-types..."
        (cd "$SHARED_TYPES_DIR" && npm run build 2>/dev/null || npm run build) || true
    fi
fi

# ============================================
# Phase 2: Start backend services
# ============================================
echo -e "\n${BLUE}[Phase 2] Starting backend services...${NC}"

# 1. rez-merchant-service
start_service \
    "rez-merchant-service" \
    "$PROJECT_ROOT/rez-merchant-service" \
    4005 \
    "node dist/index.js" \
    "http://localhost:4005/health"

# 2. rez-wallet-service
start_service \
    "rez-wallet-service" \
    "$PROJECT_ROOT/rez-wallet-service" \
    4004 \
    "node dist/index.js" \
    "http://localhost:4004/health"

# 3. rez-payment-service
start_service \
    "rez-payment-service" \
    "$PROJECT_ROOT/rez-payment-service" \
    4001 \
    "node dist/index.js" \
    "http://localhost:4001/health"

# 4. rez-order-service
start_service \
    "rez-order-service" \
    "$PROJECT_ROOT/rez-order-service" \
    4006 \
    "node dist/httpServer.js" \
    "http://localhost:4006/health"

# 5. rez-socket-service
start_service \
    "rez-socket-service" \
    "$PROJECT_ROOT/rez-socket-service" \
    4007 \
    "node dist/index.js" \
    ""

# ============================================
# Phase 3: Start ReStopapa backend
# ============================================
echo -e "\n${BLUE}[Phase 3] Starting ReStopapa backend...${NC}"

RESTOPAPA_DIR="/Users/rejaulkarim/Documents/ReStopapa/backend"
if [ -d "$RESTOPAPA_DIR" ]; then
    start_service \
        "ReStopapa-backend" \
        "$RESTOPAPA_DIR" \
        8000 \
        "npm run start:dev" \
        "http://localhost:8000/api/v1"
else
    echo -e "  ${YELLOW}ReStopapa backend not found at $RESTOPAPA_DIR${NC}"
fi

# ============================================
# Summary
# ============================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Startup Complete${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}Services Status:${NC}"
echo "  rez-merchant-service : $(check_port 4005 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}") (port 4005)"
echo "  rez-wallet-service   : $(check_port 4004 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}") (port 4004)"
echo "  rez-payment-service  : $(check_port 4001 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}") (port 4001)"
echo "  rez-order-service    : $(check_port 4006 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}") (port 4006)"
echo "  rez-socket-service   : $(check_port 4007 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}") (port 4007)"
echo "  ReStopapa-backend    : $(check_port 8000 && echo -e "${GREEN}RUNNING${NC}" || echo -e "${RED}STOPPED${NC}") (port 8000)"

echo -e "\n${YELLOW}Logs directory: $SCRIPT_DIR/logs/${NC}"
echo -e "${YELLOW}PIDs saved to: $SCRIPT_DIR/pids/${NC}"
echo ""
echo "To stop all services, run: $SCRIPT_DIR/STOP_ALL.sh"
echo ""
