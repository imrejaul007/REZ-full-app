#!/bin/bash
# =============================================================================
# Quick Health Check - Single command service status
# =============================================================================
# Run this from the project root for a quick status overview
# =============================================================================

set -euo pipefail

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="${PROJECT_ROOT}/monitoring"
CONFIG_FILE="${MONITORING_DIR}/config/services.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default services to check if not configured
declare -A DEFAULT_SERVICES=(
    ["api-gateway"]="http://localhost:3000/health"
    ["auth-service"]="http://localhost:3001/health"
    ["intent-service"]="http://localhost:3002/health"
    ["ledger-service"]="http://localhost:3003/health"
    ["automation-service"]="http://localhost:3004/health"
)

# =============================================================================
# Main
# =============================================================================

main() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   ReZ Quick Health Check${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # Load services from config if available
    declare -A SERVICES=()
    if [[ -f "${CONFIG_FILE}" ]]; then
        while IFS='=' read -r key value; do
            [[ "${key}" =~ ^#.*$ ]] && continue
            [[ -z "${key}" ]] && continue
            value="${value//\"/}"
            SERVICES["${key}"]="${value}"
        done < "${CONFIG_FILE}"
    fi

    # Merge with defaults
    for key in "${!DEFAULT_SERVICES[@]}"; do
        [[ ! -v "SERVICES[$key]" ]] && SERVICES["$key"]="${DEFAULT_SERVICES[$key]}"
    done

    local total=0
    local healthy=0
    local unhealthy=0

    echo -e "${BLUE}Checking services...${NC}"
    echo ""

    for service in "${!SERVICES[@]}"; do
        url="${SERVICES[$service]}"
        ((total++))

        # Quick check
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${url}" 2>/dev/null) || http_code="000"
        response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "${url}" 2>/dev/null) || response_time="0"

        if [[ "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
            echo -e "  ${GREEN}[UP]${NC}   ${service}"
            echo -e "         ${url} (${response_time}s)"
            ((healthy++))
        else
            echo -e "  ${RED}[DOWN]${NC} ${service}"
            echo -e "         ${url} - HTTP ${http_code}"
            ((unhealthy++))
        fi
    done

    echo ""
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "Total: ${total} | ${GREEN}Healthy: ${healthy}${NC} | ${RED}Unhealthy: ${unhealthy}${NC}"
    echo ""

    if [[ ${unhealthy} -gt 0 ]]; then
        echo -e "${YELLOW}Run '${MONITORING_DIR}/check-all-services.sh' for detailed analysis${NC}"
        exit 1
    fi

    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
}

main "$@"
