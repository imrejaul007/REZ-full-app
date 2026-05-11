#!/bin/bash
# ============================================================
# ReZ Ecosystem — Stop All Services
# ============================================================
# Stops all services from 9 company repos:
#   1. REZ-Intelligence   6. CorpPerks
#   2. REZ-Media          7. StayOwn-Hospitality
#   3. REZ-Consumer       8. RTNM-Group
#   4. REZ-Merchant       9. RTNM-Digital
#   5. RABTUL-Technologies
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "============================================================"
echo "   ReZ Ecosystem — Stopping All Services"
echo "============================================================"
echo ""

# Function to stop docker-compose in a directory
stop_docker_compose() {
    local dir="$1"
    local name="$2"
    local compose_file="${3:-docker-compose.yml}"

    if [ -f "$dir/$compose_file" ]; then
        log_info "Stopping $name services..."
        cd "$dir"
        (docker compose -f "$compose_file" down 2>/dev/null || docker-compose -f "$compose_file" down 2>/dev/null) || true
        cd "$SCRIPT_DIR"
    fi
}

# Stop all 9 company repos (reverse order)
log_info "Stopping services from all 9 repos..."

echo ""
log_info "[1/9] RTNM-Digital..."
if [ -f "RTNM-Digital/docker-compose.yml" ]; then
    (cd RTNM-Digital && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[2/9] RTNM-Group..."
if [ -f "RTNM-Group/docker-compose.yml" ]; then
    (cd RTNM-Group && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[3/9] StayOwn-Hospitality..."
if [ -f "StayOwn-Hospitality/docker-compose.yml" ]; then
    (cd StayOwn-Hospitality && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[4/9] CorpPerks..."
if [ -f "CorpPerks/docker-compose.yml" ]; then
    (cd CorpPerks && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[5/9] RABTUL-Technologies..."
if [ -f "RABTUL-Technologies/docker-compose.yml" ]; then
    (cd RABTUL-Technologies && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[6/9] REZ-Merchant..."
if [ -f "REZ-Merchant/docker-compose.yml" ]; then
    (cd REZ-Merchant && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[7/9] REZ-Consumer..."
if [ -f "REZ-Consumer/docker-compose.yml" ]; then
    (cd REZ-Consumer && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[8/9] REZ-Media..."
if [ -f "REZ-Media/docker-compose.yml" ]; then
    (cd REZ-Media && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

echo ""
log_info "[9/9] REZ-Intelligence..."
if [ -f "REZ-Intelligence/docker-compose.yml" ]; then
    (cd REZ-Intelligence && docker compose down 2>/dev/null || docker-compose down 2>/dev/null) || true
fi

# Stop core infrastructure (optional - use --volumes to remove data)
echo ""
log_info "Stopping Core Infrastructure..."
docker compose -f docker-compose.yml down 2>/dev/null || docker-compose -f docker-compose.yml down 2>/dev/null || true

echo ""
echo "============================================================"
log_success "All services stopped!"
echo "============================================================"
echo ""
log_info "To also remove volumes (delete data): ./stop-all.sh --volumes"
log_info "To start all services again: ./start-all.sh"
echo ""
