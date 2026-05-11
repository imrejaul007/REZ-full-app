#!/bin/bash
# ============================================================
# ReZ Ecosystem — Restart All Services
# ============================================================
# Restarts all services from 9 company repos:
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
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "============================================================"
echo "   ReZ Ecosystem — Restarting All Services"
echo "============================================================"
echo ""

# Check if we should rebuild images
REBUILD=""
if [ "$1" == "--rebuild" ] || [ "$1" == "-r" ]; then
    REBUILD="--build"
    log_info "Rebuild flag detected - will rebuild images"
fi

# Check if we should remove volumes
REMOVE_VOLUMES=""
if [ "$1" == "--volumes" ] || [ "$1" == "-v" ]; then
    REMOVE_VOLUMES="--volumes"
    log_info "Volumes flag detected - will remove volumes"
fi

# Stop all services first
log_info "Stopping all services..."
echo ""
"$SCRIPT_DIR/stop-all.sh"
echo ""

# Wait for cleanup
log_info "Waiting for cleanup..."
sleep 3
echo ""

# Start all services
log_info "Starting all services..."
echo ""
"$SCRIPT_DIR/start-all.sh"

echo ""
echo "============================================================"
log_success "All services restarted!"
echo "============================================================"
echo ""
log_info "Run './status-all.sh' to check service status"
log_info "Run './logs-all.sh' to view service logs"
echo ""
