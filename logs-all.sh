#!/bin/bash
# ============================================================
# ReZ Ecosystem — Get Logs from All Services
# ============================================================
# Gets logs from all services from 9 company repos:
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

# Default settings
LINES=50
TAIL_MODE=true
FOLLOW_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--lines)
            LINES="$2"
            TAIL_MODE=true
            shift 2
            ;;
        -f|--follow)
            FOLLOW_MODE=true
            shift
            ;;
        --all)
            # Show all logs (no tail)
            TAIL_MODE=false
            LINES=0
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -n, --lines N   Show last N lines (default: 50)"
            echo "  -f, --follow    Follow logs in real-time (like tail -f)"
            echo "  --all           Show all logs (no tail)"
            echo "  -h, --help      Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0               # Show last 50 lines from all services"
            echo "  $0 -n 100        # Show last 100 lines"
            echo "  $0 -f            # Follow all logs in real-time"
            echo "  $0 --all         # Show complete log history"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

TAIL_ARG=""
if [ "$TAIL_MODE" == "true" ]; then
    TAIL_ARG="--tail $LINES"
fi

FOLLOW_ARG=""
if [ "$FOLLOW_MODE" == "true" ]; then
    FOLLOW_ARG="-f"
fi

echo ""
echo "============================================================"
echo "   ReZ Ecosystem — Service Logs"
echo "============================================================"
echo ""

# Function to get logs from a docker-compose directory
get_compose_logs() {
    local dir="$1"
    local name="$2"
    local compose_file="${3:-docker-compose.yml}"

    if [ -f "$dir/$compose_file" ]; then
        echo ""
        echo -e "${CYAN}${BOLD}============================================================${NC}"
        echo -e "${CYAN}${BOLD}[$name]${NC}"
        echo -e "${CYAN}${BOLD}============================================================${NC}"
        echo ""

        cd "$dir"

        if [ "$FOLLOW_MODE" == "true" ]; then
            docker compose -f "$compose_file" logs --tail 100 2>&1 | head -100 &
            local pid=$!
            sleep 0.1
        else
            docker compose -f "$compose_file" logs $TAIL_ARG 2>&1 | tail -$LINES
        fi

        cd "$SCRIPT_DIR"
    fi
}

# Get logs from core infrastructure
echo ""
echo -e "${BLUE}${BOLD}============================================================${NC}"
echo -e "${BLUE}${BOLD}[CORE INFRASTRUCTURE]${NC}"
echo -e "${BLUE}${BOLD}============================================================${NC}"
echo ""
docker compose -f docker-compose.yml logs $TAIL_ARG 2>&1 | tail -$LINES

# Get logs from all 9 company repos
get_compose_logs "REZ-Intelligence" "REZ-Intelligence"
get_compose_logs "REZ-Media" "REZ-Media"
get_compose_logs "REZ-Consumer" "REZ-Consumer"
get_compose_logs "REZ-Merchant" "REZ-Merchant"
get_compose_logs "RABTUL-Technologies" "RABTUL-Technologies"
get_compose_logs "CorpPerks" "CorpPerks"
get_compose_logs "StayOwn-Hospitality" "StayOwn-Hospitality"
get_compose_logs "RTNM-Group" "RTNM-Group"
get_compose_logs "RTNM-Digital" "RTNM-Digital"

echo ""
echo "============================================================"
echo "   End of Logs"
echo "============================================================"
echo ""

# If follow mode was requested, wait for user to interrupt
if [ "$FOLLOW_MODE" == "true" ]; then
    echo ""
    echo -e "${YELLOW}Following logs... Press Ctrl+C to stop${NC}"
    echo ""

    # Wait for background jobs
    wait
fi
