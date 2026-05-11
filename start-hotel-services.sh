#!/bin/bash
# Hotel Ecosystem Startup Script
# Starts all services needed for the hotel platform

set -e

echo "=============================================="
echo "   Hotel Ecosystem Startup Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if port is in use
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start a service in background
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4

    log_info "Starting $name..."

    if check_port $port; then
        log_warn "$name is already running on port $port"
        return 0
    fi

    cd "$dir"
    $cmd &
    sleep 3

    if check_port $port; then
        log_info "$name started on port $port"
    else
        log_error "$name failed to start"
    fi
}

# ============================================
# Start Databases
# ============================================

log_info "Checking databases..."

# MongoDB
if pgrep -x mongod > /dev/null 2>&1; then
    log_info "MongoDB is already running"
else
    log_info "Starting MongoDB..."
    if command -v mongod &> /dev/null; then
        mkdir -p ~/data/db ~/data/logs
        mongod --dbpath ~/data/db --logpath ~/data/logs/mongodb.log --fork
        log_info "MongoDB started"
    elif command -v brew &> /dev/null; then
        brew services start mongodb/brew/mongodb-community
        log_info "MongoDB started via Homebrew"
    else
        log_warn "MongoDB not installed - services may fail"
    fi
fi

# PostgreSQL
if pgrep postgres > /dev/null 2>&1; then
    log_info "PostgreSQL is already running"
else
    log_warn "PostgreSQL not running - Hotel-PMS may not work"
fi

# Redis
if pgrep redis-server > /dev/null 2>&1; then
    log_info "Redis is already running"
else
    if command -v brew &> /dev/null; then
        brew services start redis
        log_info "Redis started via Homebrew"
    else
        log_warn "Redis not running - rate limiting may fail"
    fi
fi

# ============================================
# Start Services
# ============================================

echo ""
log_info "Starting hotel services..."

# StayOwn Service (Hotel OTA)
if check_port 4015; then
    log_warn "StayOwn is already running on port 4015"
else
    cd "/Users/rejaulkarim/Documents/ReZ Full App/rez-stayown-service"
    npm start &
    sleep 5
    if check_port 4015; then
        log_info "StayOwn (OTA) started on port 4015"
    fi
fi

# REZ Mind Hotel Service
if check_port 4017; then
    log_warn "REZ Mind is already running on port 4017"
else
    cd "/Users/rejaulkarim/Documents/ReZ Full App/rez-mind-hotel-service"
    npm start &
    sleep 5
    if check_port 4017; then
        log_info "REZ Mind (AI) started on port 4017"
    fi
fi

# Hotel-PMS (requires PostgreSQL)
if check_port 3008; then
    log_warn "Hotel-PMS is already running on port 3008"
else
    log_info "Attempting to start Hotel-PMS..."
    cd "/Users/rejaulkarim/Documents/ReZ Full App/Hotel-OTA"
    # Check if PostgreSQL is running
    if pgrep postgres > /dev/null 2>&1; then
        npm run dev:api &
        sleep 10
        if check_port 3008; then
            log_info "Hotel-PMS started on port 3008"
        else
            log_warn "Hotel-PMS failed to start - check PostgreSQL connection"
        fi
    else
        log_warn "Hotel-PMS requires PostgreSQL - not starting"
    fi
fi

# ============================================
# Verify Services
# ============================================

echo ""
log_info "Verifying services..."
echo ""

verify_service() {
    local name=$1
    local url=$2
    local port=$3

    if check_port $port; then
        if curl -s "$url" > /dev/null 2>&1; then
            log_info "$name: ${GREEN}HEALTHY${NC}"
        else
            log_warn "$name: ${YELLOW}PORT OPEN, HEALTH CHECK FAILED${NC}"
        fi
    else
        log_error "$name: ${RED}NOT RUNNING${NC}"
    fi
}

verify_service "StayOwn (OTA)" "http://localhost:4015/health" 4015
verify_service "Hotel-PMS" "http://localhost:3008/health" 3008
verify_service "REZ Mind (AI)" "http://localhost:4017/health" 4017

echo ""
echo "=============================================="
echo "   Services Status"
echo "=============================================="
echo ""
echo "StayOwn (OTA): http://localhost:4015"
echo "Hotel-PMS:     http://localhost:3008"
echo "REZ Mind (AI): http://localhost:4017"
echo ""
echo "=============================================="
echo ""
log_info "To stop services, run: pkill -f 'node dist/index.js' or kill the node processes"
