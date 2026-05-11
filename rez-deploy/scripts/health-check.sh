#!/usr/bin/env bash
# =============================================================================
# REZ Platform - Health Check Script
# =============================================================================
# Checks the health of all REZ microservices
# Usage: ./health-check.sh [service] [--verbose] [--json]
# Examples:
#   ./health-check.sh
#   ./health-check.sh rez-delivery-service
#   ./health-check.sh --json
# =============================================================================

set -uo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default settings
VERBOSE=false
JSON_OUTPUT=false
TIMEOUT=10
SERVICE_FILTER=""

# Service list with ports
SERVICES=(
    "rez-delivery-service:3000"
    "rez-analytics-service:3001"
    "rez-payment-links-service:3002"
    "rez-journey-service:3003"
    "rez-automation-service:3004"
    "rez-gdpr-service:3005"
    "rez-validation-service:3006"
    "rez-cohort-service:3007"
    "rez-currency-service:3008"
    "rez-invoice-service:3009"
    "rez-menu-service:3010"
    "rez-refund-service:3011"
    "rez-tracking-service:3012"
    "rez-websocket-hub:3013"
    "rez-rate-limit:3014"
)

# =============================================================================
# Parse Arguments
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose|-v)
                VERBOSE=true
                shift
                ;;
            --json|-j)
                JSON_OUTPUT=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            --timeout|-t)
                TIMEOUT="$2"
                shift 2
                ;;
            *)
                SERVICE_FILTER="$1"
                shift
                ;;
        esac
    done
}

show_help() {
    cat << EOF
REZ Platform Health Check Script

Usage: ./health-check.sh [service] [options]

Options:
  --verbose, -v     Show detailed output
  --json, -j        Output in JSON format
  --timeout, -t N   Set timeout in seconds (default: 10)
  --help, -h        Show this help message

Examples:
  ./health-check.sh                    # Check all services
  ./health-check.sh rez-delivery-service  # Check specific service
  ./health-check.sh --json             # Output in JSON format
  ./health-check.sh --verbose          # Show detailed output

Exit Codes:
  0 - All services healthy
  1 - One or more services unhealthy
  2 - Invalid arguments
EOF
}

# =============================================================================
# Utility Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

get_service_name() {
    echo "$1" | cut -d':' -f1
}

get_service_port() {
    echo "$1" | cut -d':' -f2
}

get_container_status() {
    local service_name=$1
    docker ps --filter "name=$service_name" --format "{{.Status}}" 2>/dev/null || echo "not found"
}

get_container_uptime() {
    local service_name=$1
    docker ps --filter "name=$service_name" --format "{{.RunningFor}}" 2>/dev/null || echo "N/A"
}

get_memory_usage() {
    local service_name=$1
    docker stats --no-stream --format "{{.MemUsage}}" "$service_name" 2>/dev/null || echo "N/A"
}

get_cpu_usage() {
    local service_name=$1
    docker stats --no-stream --format "{{.CPUPerc}}" "$service_name" 2>/dev/null || echo "N/A"
}

# =============================================================================
# Health Check Function
# =============================================================================

check_service_health() {
    local service_entry=$1
    local service_name=$(get_service_name "$service_entry")
    local port=$(get_service_port "$service_entry")

    local result=$(curl -sf --max-time "$TIMEOUT" "http://localhost:$port/health" 2>/dev/null || echo "FAILED")
    echo "$result"
}

get_health_details() {
    local service_entry=$1
    local service_name=$(get_service_name "$service_entry")
    local port=$(get_service_port "$service_entry")

    local result=$(curl -sf --max-time "$TIMEOUT" "http://localhost:$port/health" 2>/dev/null)
    echo "$result"
}

get_readiness_details() {
    local service_entry=$1
    local service_name=$(get_service_name "$service_entry")
    local port=$(get_service_port "$service_entry")

    local result=$(curl -sf --max-time "$TIMEOUT" "http://localhost:$port/ready" 2>/dev/null)
    echo "$result"
}

get_metrics() {
    local service_entry=$1
    local service_name=$(get_service_name "$service_entry")
    local port=$(get_service_port "$service_entry")

    local result=$(curl -sf --max-time "$TIMEOUT" "http://localhost:$port/metrics" 2>/dev/null | head -20 || echo "")
    echo "$result"
}

# =============================================================================
# JSON Output
# =============================================================================

output_json() {
    local service_name=$1
    local port=$2
    local status=$3
    local container_status=$4
    local uptime=$5
    local memory=$6
    local cpu=$7
    local details=$8

    cat << EOF
  {
    "service": "$service_name",
    "port": $port,
    "status": "$status",
    "container_status": "$container_status",
    "uptime": "$uptime",
    "memory_usage": "$memory",
    "cpu_usage": "$cpu"
  }
EOF
}

# =============================================================================
# Main Health Check
# =============================================================================

main() {
    parse_arguments "$@"

    local start_time=$(date +%s)
    local healthy_count=0
    local unhealthy_count=0
    local total_count=0
    local results=()
    local all_healthy=true

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{"
        echo "  \"timestamp\": \"$(date -Iseconds)\","
        echo "  \"services\": ["
    else
        echo ""
        echo "================================================================================"
        echo "REZ Platform Health Check"
        echo "================================================================================"
        echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "Timeout: ${TIMEOUT}s"
        echo ""
        printf "%-25s %-8s %-15s %-15s %-15s\n" "Service" "Port" "Status" "Uptime" "Container"
        echo "--------------------------------------------------------------------------------"
    fi

    for service_entry in "${SERVICES[@]}"; do
        service_name=$(get_service_name "$service_entry")
        port=$(get_service_port "$service_entry")

        # Filter by service if specified
        if [[ -n "$SERVICE_FILTER" && "$service_name" != "$SERVICE_FILTER" ]]; then
            continue
        fi

        total_count=$((total_count + 1))

        # Get container info
        local container_status=$(get_container_status "$service_name")
        local uptime=$(get_container_uptime "$service_name")
        local memory=$(get_memory_usage "$service_name")
        local cpu=$(get_cpu_usage "$service_name")

        # Perform health check
        local health_result=$(check_service_health "$service_entry")

        if [[ "$health_result" != "FAILED" ]]; then
            status="${GREEN}healthy${NC}"
            healthy_count=$((healthy_count + 1))
            results+=("$service_name:healthy")
        else
            status="${RED}unhealthy${NC}"
            unhealthy_count=$((unhealthy_count + 1))
            results+=("$service_name:unhealthy")
            all_healthy=false
        fi

        if [[ "$JSON_OUTPUT" == "true" ]]; then
            if [[ $total_count -gt 1 ]]; then
                echo ","
            fi
            output_json "$service_name" "$port" "${status%%${NC}*}${NC}" "$container_status" "$uptime" "$memory" "$cpu" "$health_result"
        else
            printf "%-25s %-8s %-15s %-15s %-15s\n" "$service_name" "$port" "$status" "$uptime" "$container_status"

            if [[ "$VERBOSE" == "true" && "$health_result" != "FAILED" ]]; then
                echo -e "    ${CYAN}Memory:${NC} $memory | ${CYAN}CPU:${NC} $cpu"
                echo ""
            fi
        fi
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo ""
        echo "  ],"
        echo "  \"summary\": {"
        echo "    \"total\": $total_count,"
        echo "    \"healthy\": $healthy_count,"
        echo "    \"unhealthy\": $unhealthy_count,"
        echo "    \"duration_seconds\": $duration"
        echo "  }"
        echo "}"
    else
        echo "--------------------------------------------------------------------------------"
        echo ""
        echo "Summary:"
        echo "  Total:     $total_count"
        echo "  Healthy:   ${GREEN}$healthy_count${NC}"
        echo "  Unhealthy: ${RED}$unhealthy_count${NC}"
        echo "  Duration:  ${duration}s"
        echo ""
        echo "================================================================================"
    fi

    # Return appropriate exit code
    if [[ $unhealthy_count -gt 0 ]]; then
        exit 1
    fi
    exit 0
}

# Run main function
main "$@"
