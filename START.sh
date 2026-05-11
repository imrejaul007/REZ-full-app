#!/bin/bash
# ReZ Platform - Complete Startup Script
# Run this ONE script and everything deploys

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║           ReZ Platform - One-Command Deployment               ║"
echo "║                                                                ║"
echo "║           Complete Setup in One Script                         ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step function
step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}STEP $1:${NC} $2"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Success function
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Error function
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Warning function
warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
step "0" "Checking prerequisites..."
{
    command -v node >/dev/null 2>&1 || { error "Node.js not found. Install from https://nodejs.org"; }
    success "Node.js: $(node --version)"

    if command -v docker >/dev/null 2>&1; then
        success "Docker: $(docker --version)"
        DOCKER=true
    else
        warn "Docker not found. Will use npm instead."
        DOCKER=false
    fi

    if command -v npm >/dev/null 2>&1; then
        success "npm: $(npm --version)"
    fi
} || error "Prerequisites check failed"

# Setup environment
step "1" "Setting up environment..."

# Create .env if not exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    if [ -f "$SCRIPT_DIR/.env.docker.example" ]; then
        cp "$SCRIPT_DIR/.env.docker.example" "$SCRIPT_DIR/.env"
        warn "Created .env file - EDIT IT with your values!"
        warn "Required: MONGODB_URI, REDIS_URL, JWT_SECRET"
    fi
fi

# Check if .env is configured
if grep -q "your-" "$SCRIPT_DIR/.env" 2>/dev/null; then
    warn ".env file needs configuration!"
    warn "Edit $SCRIPT_DIR/.env with your MongoDB, Redis, and API keys"
fi

# Make scripts executable
chmod +x "$SCRIPT_DIR/AUTO-DEPLOY.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/AUTO-HEALTH-CHECK.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/TEST-TRANSACTION-LOOP.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/AUTO-GENERATE-TRAINING-DATA.sh" 2>/dev/null || true
success "Scripts made executable"

# Deploy core services
step "2" "Deploying Core Services..."

CORE_SERVICES=(
    "rez-auth-service:4002"
    "rez-wallet-service:4004"
    "rez-payment-service:4001"
    "rez-merchant-service:4005"
    "rez-order-service:3006"
    "rez-api-gateway:3000"
)

for svc in "${CORE_SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$svc"

    if [ -d "$SCRIPT_DIR/$name" ]; then
        echo "Starting $name on port $port..."

        cd "$SCRIPT_DIR/$name"

        # Install if needed
        if [ ! -d "node_modules" ]; then
            npm install --legacy-peer-deps 2>&1 | tail -3
        fi

        # Build if needed
        if [ -f "package.json" ] && grep -q '"build"' package.json; then
            npm run build 2>&1 | tail -3
        fi

        # Start in background
        PORT=$port npm run start > "$SCRIPT_DIR/logs/$name.log" 2>&1 &
        success "Started $name"

        cd "$SCRIPT_DIR"
    else
        warn "Service not found: $name"
    fi
done

# Wait for services
step "3" "Waiting for services to start..."
sleep 10

# Check health
step "4" "Checking service health..."
echo ""

FAILED=0
for port in 3000 4002 4004 4001 3006 4005; do
    if curl -sf --max-time 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        success "Port $port: OK"
    else
        error "Port $port: FAILED"
        ((FAILED++))
    fi
done

# Deploy AI services
step "5" "Deploying AI Services..."

AI_SERVICES=(
    "rez-intent-graph:3007"
    "rez-user-intelligence:3004"
    "rez-action-engine:3014"
    "rez-merchant-intelligence:4012"
)

for svc in "${AI_SERVICES[@]}"; do
    IFS=':' read -r name port <<< "$svc"

    if [ -d "$SCRIPT_DIR/$name" ]; then
        echo "Starting $name on port $port..."

        cd "$SCRIPT_DIR/$name"

        if [ ! -d "node_modules" ]; then
            npm install --legacy-peer-deps 2>&1 | tail -3
        fi

        if [ -f "package.json" ] && grep -q '"build"' package.json; then
            npm run build 2>&1 | tail -3
        fi

        PORT=$port npm run start > "$SCRIPT_DIR/logs/$name.log" 2>&1 &
        success "Started $name"

        cd "$SCRIPT_DIR"
    fi
done

# Final health check
step "6" "Final health check..."
echo ""

TOTAL=0
HEALTHY=0
for port in 3000 3004 3006 3007 3013 3014 4001 4002 4004 4005 4012 4017 4020; do
    ((TOTAL++))
    if curl -sf --max-time 3 "http://localhost:$port/health" > /dev/null 2>&1; then
        success "Port $port: OK"
        ((HEALTHY++))
    else
        warn "Port $port: Not responding"
    fi
done

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Health: $HEALTHY/$TOTAL services responding"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo "  API Gateway:     http://localhost:3000"
echo "  Auth Service:     http://localhost:4002"
echo "  Wallet Service:   http://localhost:4004"
echo "  Payment Service:  http://localhost:4001"
echo "  Order Service:    http://localhost:3006"
echo "  Merchant Service: http://localhost:4005"
echo "  Intent Graph:     http://localhost:3007"
echo ""
echo -e "${YELLOW}Quick Tests:${NC}"
echo "  Health:  curl http://localhost:3000/health"
echo "  Register: curl -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"Test123!\"}'"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  $SCRIPT_DIR/logs/"
echo ""

if [ $HEALTHY -eq $TOTAL ]; then
    echo -e "${GREEN}All services are healthy!${NC}"
else
    echo -e "${YELLOW}Some services failed. Check logs.${NC}"
fi

echo ""
