#!/bin/bash
# ============================================================
# ReZ Ecosystem — Check Status of All Services
# ============================================================
# Checks status of all services from 9 company repos:
#   1. REZ-Intelligence   6. CorpPerks
#   2. REZ-Media          7. StayOwn-Hospitality
#   3. REZ-Consumer       8. RTNM-Group
#   4. REZ-Merchant       9. RTNM-Digital
#   5. RABTUL-Technologies
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Track overall status
TOTAL_RUNNING=0
TOTAL_STOPPED=0
TOTAL_ERRORS=0

echo ""
echo "============================================================"
echo "   ReZ Ecosystem — Service Status"
echo "============================================================"
echo ""

# Function to check status of a docker-compose directory
check_compose_status() {
    local dir="$1"
    local name="$2"
    local compose_file="${3:-docker-compose.yml}"

    echo -e "${CYAN}${BOLD}[$name]${NC}"

    if [ -f "$dir/$compose_file" ]; then
        cd "$dir"
        local output
        output=$(docker compose -f "$compose_file" ps 2>/dev/null || docker-compose -f "$compose_file" ps 2>/dev/null || echo "ERROR")

        if [ "$output" == "ERROR" ]; then
            echo -e "  ${RED}Error checking status${NC}"
            ((TOTAL_ERRORS++))
        else
            # Count running and stopped containers
            local running=$(echo "$output" | grep -c "Up" 2>/dev/null || echo "0")
            local stopped=$(echo "$output" | grep -cE "(Exit|Stopping|Stopping)" 2>/dev/null || echo "0")

            TOTAL_RUNNING=$((TOTAL_RUNNING + running))
            TOTAL_STOPPED=$((TOTAL_STOPPED + stopped))

            echo "$output" | head -20 | sed 's/^/  /'
        fi
        cd "$SCRIPT_DIR"
    else
        echo -e "  ${YELLOW}No docker-compose.yml found${NC}"
        ((TOTAL_ERRORS++))
    fi
    echo ""
}

# Check core infrastructure
echo -e "${BLUE}${BOLD}[CORE INFRASTRUCTURE]${NC}"
echo ""
docker compose -f docker-compose.yml ps 2>/dev/null || docker-compose -f docker-compose.yml ps 2>/dev/null | sed 's/^/  /'
echo ""

# Check all 9 company repos
echo "============================================================"
echo "   9 Company Repos Status"
echo "============================================================"
echo ""

check_compose_status "REZ-Intelligence" "REZ-Intelligence"
check_compose_status "REZ-Media" "REZ-Media"
check_compose_status "REZ-Consumer" "REZ-Consumer"
check_compose_status "REZ-Merchant" "REZ-Merchant"
check_compose_status "RABTUL-Technologies" "RABTUL-Technologies"
check_compose_status "CorpPerks" "CorpPerks"
check_compose_status "StayOwn-Hospitality" "StayOwn-Hospitality"
check_compose_status "RTNM-Group" "RTNM-Group"
check_compose_status "RTNM-Digital" "RTNM-Digital"

# Summary
echo "============================================================"
echo "   Summary"
echo "============================================================"
echo ""

# Get all containers
ALL_CONTAINERS=$(docker ps -a --format "{{.Names}}" 2>/dev/null | grep -E "(rez-|corpperks-|rtnm-|stayown-)" || echo "")
RUNNING=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -E "(rez-|corpperks-|rtnm-|stayown-)" | wc -l || echo "0")
STOPPED=$(echo "$ALL_CONTAINERS" | wc -w || echo "0")
STOPPED=$((STOPPED - RUNNING))

echo -e "  ${GREEN}Running Containers:${NC}  $RUNNING"
echo -e "  ${YELLOW}Stopped Containers:${NC} $STOPPED"
echo ""
echo "  Containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -E "(rez-|corpperks-|rtnm-|stayown-)" | head -30 | sed 's/^/    /' || echo "    None found"
echo ""
