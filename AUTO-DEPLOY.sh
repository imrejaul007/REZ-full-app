#!/bin/bash
# ReZ Platform - One-Command Full Deployment
# Usage: ./AUTO-DEPLOY.sh [env]
# env = development | production

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV="${1:-development}"

echo "========================================"
echo "  ReZ Platform - Auto Deploy"
echo "  Environment: $ENV"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
check_prereqs() {
    log "Checking prerequisites..."

    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not installed. Install from https://nodejs.org"
    fi

    # Docker
    if ! command -v docker &> /dev/null; then
        warn "Docker not installed. Will use npm instead."
        DOCKER=false
    else
        DOCKER=true
    fi

    # MongoDB
    if [ -z "$MONGODB_URI" ]; then
        warn "MONGODB_URI not set. Using local MongoDB."
    fi

    log "Prerequisites check complete"
}

# Setup environment
setup_env() {
    log "Setting up environment..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            warn "Created .env file. Edit it with your values!"
        fi
    fi

    # Load env vars
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."

    if [ ! -f "docker-compose.full.yml" ]; then
        error "docker-compose.full.yml not found"
    fi

    # Pull latest images
    docker-compose -f docker-compose.full.yml pull

    # Start services
    docker-compose -f docker-compose.full.yml up -d

    # Wait for services
    log "Waiting for services to start..."
    sleep 30

    # Check health
    check_health
}

# Deploy with npm
deploy_npm() {
    log "Deploying with npm..."

    # Core services
    CORE_SERVICES=(
        "rez-auth-service"
        "rez-wallet-service"
        "rez-payment-service"
        "rez-merchant-service"
        "rez-order-service"
        "rez-api-gateway"
    )

    for service in "${CORE_SERVICES[@]}"; do
        if [ -d "$service" ]; then
            log "Deploying $service..."
            cd "$service"

            npm install --legacy-peer-deps 2>&1 | tail -3
            npm run build 2>&1 | tail -3
            npm run start &

            cd "$SCRIPT_DIR"
        fi
    done

    # AI services
    AI_SERVICES=(
        "rez-intent-graph"
        "rez-user-intelligence"
        "rez-merchant-intelligence"
        "rez-action-engine"
        "rez-personalization-engine"
    )

    for service in "${AI_SERVICES[@]}"; do
        if [ -d "$service" ]; then
            log "Deploying $service..."
            cd "$service"

            npm install --legacy-peer-deps 2>&1 | tail -3
            npm run start &

            cd "$SCRIPT_DIR"
        fi
    done

    # Wait for services
    log "Waiting for services to start..."
    sleep 20

    check_health
}

# Check health of all services
check_health() {
    log "Checking service health..."

    PORTS=(3000 3004 3006 3007 3013 3014 4001 4002 4004 4005 4012 4017 4020 4021 4022 4033 4100 4101 4102 4103 4104 4105 4106 4107 4110 4111 4112)

    FAILED=0
    for port in "${PORTS[@]}"; do
        if curl -sf "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "  Port $port: ${GREEN}✓${NC}"
        else
            echo -e "  Port $port: ${RED}✗${NC}"
            ((FAILED++))
        fi
    done

    if [ $FAILED -eq 0 ]; then
        log "All services healthy!"
    else
        warn "$FAILED services not responding"
    fi
}

# Run tests
run_tests() {
    log "Running tests..."

    if [ -f "TEST-TRANSACTION-LOOP.sh" ]; then
        chmod +x TEST-TRANSACTION-LOOP.sh
        ./TEST-TRANSACTION-LOOP.sh
    else
        warn "TEST-TRANSACTION-LOOP.sh not found"
    fi
}

# Main
main() {
    cd "$SCRIPT_DIR"

    check_prereqs
    setup_env

    if [ "$DOCKER" = true ]; then
        deploy_docker
    else
        deploy_npm
    fi

    run_tests

    echo ""
    echo "========================================"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "  1. Check .env files are configured"
    echo "  2. Verify all health checks pass"
    echo "  3. Run TEST-TRANSACTION-LOOP.sh"
    echo "  4. Monitor logs for errors"
    echo ""
}

main "$@"
