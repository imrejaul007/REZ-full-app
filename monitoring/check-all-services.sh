#!/bin/bash
# =============================================================================
# Check All Services - Comprehensive service monitoring script
# =============================================================================
# Performs health checks, response time monitoring, and error rate analysis
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# =============================================================================
# Configuration
# =============================================================================

# Output colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Thresholds
RESPONSE_TIME_THRESHOLD_MS=1000
ERROR_RATE_THRESHOLD_PERCENT=5
UPTIME_CHECK_SAMPLES=5

# Output files
REPORT_FILE="${SCRIPT_DIR}/reports/status-$(date +%Y%m%d-%H%M%S).json"
HTML_REPORT="${SCRIPT_DIR}/reports/status-$(date +%Y%m%d-%H%M%S).html"
SUMMARY_FILE="${SCRIPT_DIR}/logs/latest-status.txt"

# Services configuration (can be loaded from file)
declare -A SERVICES=(
    # Format: "service_name:url:expected_status:timeout"
)

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "[$(date '+%H:%M:%S')] $*"
}

log_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$*${NC}"
    echo -e "${CYAN}========================================${NC}"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# =============================================================================
# Service Definitions
# =============================================================================

load_services_from_config() {
    local config_file="${SCRIPT_DIR}/config/services.conf"

    if [[ -f "${config_file}" ]]; then
        log "Loading services from ${config_file}"
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ "${key}" =~ ^#.*$ ]] && continue
            [[ -z "${key}" ]] && continue

            # Remove quotes
            value="${value//\"/}"
            key="${key// /_}"

            SERVICES["${key}"]="${value}"
        done < "${config_file}"
    fi
}

discover_docker_services() {
    if ! command -v docker &> /dev/null; then
        return
    fi

    log "Discovering Docker services..."

    local containers
    containers=$(docker ps --format '{{.Names}}:{{.Ports}}' 2>/dev/null) || return

    while IFS=':' read -r name ports; do
        # Extract port from ports string
        local port=$(echo "${ports}" | grep -oE '[0-9]+->[0-9]+' | head -1 | cut -d'>' -f2)
        if [[ -n "${port}" ]]; then
            SERVICES["docker_${name}"]="http://localhost:${port}/health:${port}"
        fi
    done <<< "${containers}"
}

discover_node_services() {
    local package_files
    package_files=$(find "${PROJECT_ROOT}" -maxdepth 3 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null)

    for pkg_file in ${package_files}; do
        local dir
        dir=$(dirname "${pkg_file}")
        local name
        name=$(basename "${dir}")

        # Check if there's a health endpoint commonly used
        if [[ -f "${dir}/src/config/health.ts" ]] || \
           [[ -f "${dir}/src/routes/health.ts" ]] || \
           [[ -f "${dir}/health.js" ]]; then
            # Try common port patterns
            SERVICES["node_${name}"]="http://localhost:3000/health:3000"
        fi
    done
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_http_service() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local timeout="${4:-10}"

    local start_time=$(date +%s%3N)
    local response
    local http_code
    local response_time

    # Perform curl with timing
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        --max-time "${timeout}" \
        -H "User-Agent: ReZ-Monitor/1.0" \
        -H "Accept: application/json" \
        "${url}" 2>&1)

    local curl_exit=$?

    if [[ ${curl_exit} -ne 0 ]]; then
        echo "DOWN:${curl_exit}:0"
        return 1
    fi

    http_code=$(echo "${response}" | tail -2 | head -1)
    response_time=$(echo "${response}" | tail -1)
    response_body=$(echo "${response}" | head -n -2)

    # Convert response time to ms
    response_time_ms=$(echo "${response_time}" | awk '{printf "%.0f", $1 * 1000}')

    # Check status code
    if [[ "${http_code}" == "${expected_status}" ]]; then
        echo "UP:200:${response_time_ms}"
        return 0
    else
        echo "DOWN:${http_code}:${response_time_ms}"
        return 1
    fi
}

check_json_health() {
    local name="$1"
    local url="$2"
    local timeout="${3:-10}"

    local response
    local http_code
    local response_time

    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        --max-time "${timeout}" \
        -H "Accept: application/json" \
        "${url}" 2>&1)

    local curl_exit=$?

    if [[ ${curl_exit} -ne 0 ]]; then
        echo "DOWN:curl_failed:0"
        return 1
    fi

    http_code=$(echo "${response}" | tail -2 | head -1)
    response_time=$(echo "${response}" | tail -1)
    response_body=$(echo "${response}" | head -n -2)

    response_time_ms=$(echo "${response_time}" | awk '{printf "%.0f", $1 * 1000}')

    if [[ ! "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
        echo "DOWN:${http_code}:${response_time_ms}"
        return 1
    fi

    # Parse JSON status
    local status
    status=$(echo "${response_body}" | jq -r '.status // .healthy // "unknown"' 2>/dev/null)

    if [[ "${status}" == "healthy" ]] || [[ "${status}" == "ok" ]] || [[ "${status}" == "true" ]]; then
        echo "UP:200:${response_time_ms}"
        return 0
    else
        echo "DEGRADED:${status}:${response_time_ms}"
        return 2
    fi
}

# =============================================================================
# Monitoring Functions
# =============================================================================

monitor_response_times() {
    local name="$1"
    local url="$2"
    local samples="${3:-5}"

    log "  Measuring response time (${samples} samples)..."

    local total_time=0
    local success_count=0
    local times=()

    for i in $(seq 1 ${samples}); do
        local response
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            --max-time 30 \
            "${url}" 2>&1) || continue

        local http_code
        http_code=$(echo "${response}" | tail -2 | head -1)

        if [[ "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
            local time_s
            time_s=$(echo "${response}" | tail -1)
            local time_ms
            time_ms=$(echo "${time_s}" | awk '{printf "%.0f", $1 * 1000}')
            times+=("${time_ms}")
            total_time=$((total_time + time_ms))
            ((success_count++))
        fi
    done

    if [[ ${success_count} -eq 0 ]]; then
        echo "0:0:0"
        return 1
    fi

    local avg=$((total_time / success_count))
    local min=$(echo "${times[@]}" | tr ' ' '\n' | sort -n | head -1)
    local max=$(echo "${times[@]}" | tr ' ' '\n' | sort -n | tail -1)

    echo "${avg}:${min}:${max}"
    return 0
}

check_error_rate() {
    local name="$1"
    local url="$2"
    local samples="${3:-10}"

    log "  Checking error rate (${samples} samples)..."

    local total=0
    local errors=0

    for i in $(seq 1 ${samples}); do
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}" 2>/dev/null) || {
            ((errors++))
            ((total++))
            continue
        }

        ((total++))
        if [[ ! "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
            ((errors++))
        fi
    done

    if [[ ${total} -eq 0 ]]; then
        echo "100"
        return 1
    fi

    local error_pct=$((errors * 100 / total))
    echo "${error_pct}"
    return 0
}

# =============================================================================
# System Resource Checks
# =============================================================================

check_system_resources() {
    log_header "System Resources"

    # Disk Usage
    log "Disk Usage:"
    df -h | grep -E '^/dev/' | while read -r line; do
        local usage
        usage=$(echo "${line}" | awk '{print $5}' | tr -d '%')
        local mount
        mount=$(echo "${line}" | awk '{print $6}')
        if [[ ${usage} -ge 90 ]]; then
            log_error "  ${mount}: ${usage}% (CRITICAL)"
        elif [[ ${usage} -ge 80 ]]; then
            log_warning "  ${mount}: ${usage}%"
        else
            log_success "  ${mount}: ${usage}%"
        fi
    done

    # Memory Usage
    local mem_info
    mem_info=$(free -m | awk 'NR==2 {printf "%d:%d", $3, $2}')
    local used
    used=$(echo "${mem_info}" | cut -d: -f1)
    local total
    total=$(echo "${mem_info}" | cut -d: -f2)
    local mem_pct=$((used * 100 / total))

    if [[ ${mem_pct} -ge 95 ]]; then
        log_error "  Memory: ${mem_pct}% (${used}MB / ${total}MB) CRITICAL"
    elif [[ ${mem_pct} -ge 80 ]]; then
        log_warning "  Memory: ${mem_pct}% (${used}MB / ${total}MB)"
    else
        log_success "  Memory: ${mem_pct}% (${used}MB / ${total}MB)"
    fi

    # CPU Load
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}')
    log "  Load Average: ${load_avg}"
}

# =============================================================================
# Docker Status
# =============================================================================

check_docker_status() {
    if ! command -v docker &> /dev/null; then
        return
    fi

    log_header "Docker Status"

    local running
    running=$(docker ps --format '{{.Names}}' 2>/dev/null | wc -l | tr -d ' ')
    local total
    total=$(docker ps -a --format '{{.Names}}' 2>/dev/null | wc -l | tr -d ' ')

    log "  Containers: ${running} running / ${total} total"

    # Check for unhealthy containers
    local unhealthy
    unhealthy=$(docker ps --filter "health=unhealthy" --format '{{.Names}}' 2>/dev/null | wc -l | tr -d ' ')

    if [[ ${unhealthy} -gt 0 ]]; then
        log_warning "  Unhealthy containers: ${unhealthy}"
        docker ps --filter "health=unhealthy" --format '  - {{.Names}}: {{.Status}}' 2>/dev/null
    fi

    # Show running containers
    docker ps --format '  - {{.Names}} ({{.Image}}) - {{.Status}}' 2>/dev/null
}

# =============================================================================
# Generate Reports
# =============================================================================

generate_json_report() {
    local output_file="$1"
    mkdir -p "$(dirname "${output_file}")"

    local timestamp
    timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local hostname
    hostname=$(hostname)

    echo "{"
    echo "  \"report\": {"
    echo "    \"generated\": \"${timestamp}\","
    echo "    \"hostname\": \"${hostname}\","
    echo "    \"checks\": ["

    local first=true
    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r url expected_status timeout <<< "${SERVICES[$service]}"

        local result
        result=$(check_http_service "${service}" "${url}" "${expected_status}" "${timeout}" 2>/dev/null || echo "DOWN:0:0")

        IFS=':' read -r status http_code response_time <<< "${result}"

        if [[ "${first}" != "true" ]]; then
            echo ","
        fi
        first=false

        cat << EOF
      {
        "name": "${service}",
        "status": "${status}",
        "httpCode": "${http_code}",
        "responseTimeMs": ${response_time},
        "url": "${url}"
      }
EOF
    done

    echo ""
    echo "    ]"
    echo "  }"
    echo "}"
} > "${output_file}"

generate_html_report() {
    local output_file="$1"
    local json_file="${output_file%.html}.json"

    cat << 'HTMLEOF' > "${output_file}"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReZ Monitoring Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 20px; }
        .card { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; }
        .card-header { background: #2c3e50; color: white; padding: 15px 20px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; }
        .status-up { color: #27ae60; font-weight: 600; }
        .status-down { color: #e74c3c; font-weight: 600; }
        .status-degraded { color: #f39c12; font-weight: 600; }
        .timestamp { color: #666; font-size: 0.9em; }
        .footer { text-align: center; color: #666; margin-top: 20px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>ReZ Monitoring Report</h1>
        <div class="card">
            <div class="card-header">Service Status</div>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Response Time</th>
                        <th>URL</th>
                    </tr>
                </thead>
                <tbody>
HTMLEOF

    # Add service rows (this would be populated from the JSON report)
    if [[ -f "${json_file}" ]]; then
        # Extract data from JSON and generate rows
        jq -r '.report.checks[] | "<tr><td>\(.name)</td><td class=\"status-\(.status | ascii_downcase)\">\(.status)</td><td>\(.responseTimeMs)ms</td><td>\(.url)</td></tr>"' "${json_file}" >> "${output_file}"
    fi

    cat << 'HTMLEOF' >> "${output_file}"
                </tbody>
            </table>
        </div>
        <div class="footer">
            Generated at <span class="timestamp">__TIMESTAMP__</span>
        </div>
    </div>
</body>
</html>
HTMLEOF

    # Replace timestamp placeholder
    sed -i '' "s/__TIMESTAMP__/$(date '+%Y-%m-%d %H:%M:%S')/" "${output_file}"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log_header "ReZ Full App - Service Health Check"
    log "Started at $(date)"

    # Ensure directories exist
    mkdir -p "${SCRIPT_DIR}/logs" "${SCRIPT_DIR}/reports" "${SCRIPT_DIR}/config"

    # Discover or load services
    load_services_from_config
    discover_docker_services
    discover_node_services

    # If no services configured, use defaults
    if [[ ${#SERVICES[@]} -eq 0 ]]; then
        log_warning "No services configured. Adding default services."
        SERVICES["api-gateway"]="http://localhost:3000/health:200:10"
        SERVICES["auth-service"]="http://localhost:3001/health:200:10"
        SERVICES["intent-service"]="http://localhost:3002/health:200:10"
    fi

    # Check system resources
    check_system_resources

    # Check Docker
    check_docker_status

    # Check all services
    log_header "Service Health Checks"

    local overall_status="HEALTHY"
    local results=()

    for service in "${!SERVICES[@]}"; do
        IFS=':' read -r url expected_status timeout <<< "${SERVICES[$service]}"

        # Set defaults
        expected_status="${expected_status:-200}"
        timeout="${timeout:-10}"

        log ""
        log "${BLUE}Checking: ${service}${NC}"
        log "  URL: ${url}"

        # Basic health check
        local health_result
        health_result=$(check_http_service "${service}" "${url}" "${expected_status}" "${timeout}" 2>/dev/null || echo "DOWN:0:0")

        IFS=':' read -r status http_code response_time <<< "${health_result}"

        # Response time check
        local rt_result
        rt_result=$(monitor_response_times "${service}" "${url}" 3 2>/dev/null || echo "0:0:0")
        IFS=':' read -r avg_rt min_rt max_rt <<< "${rt_result}"

        # Error rate check
        local error_pct
        error_pct=$(check_error_rate "${service}" "${url}" 5 2>/dev/null || echo "100")

        # Report results
        if [[ "${status}" == "UP" ]]; then
            log_success "  Status: UP (HTTP ${http_code})"
            log "  Response Time: avg=${avg_rt}ms, min=${min_rt}ms, max=${max_rt}ms"
            log "  Error Rate: ${error_pct}%"

            if [[ ${avg_rt} -gt ${RESPONSE_TIME_THRESHOLD_MS} ]]; then
                log_warning "  Response time exceeds threshold (${avg_rt}ms > ${RESPONSE_TIME_THRESHOLD_MS}ms)"
                overall_status="DEGRADED"
            fi

            if [[ ${error_pct} -gt ${ERROR_RATE_THRESHOLD_PERCENT} ]]; then
                log_warning "  Error rate exceeds threshold (${error_pct}% > ${ERROR_RATE_THRESHOLD_PERCENT}%)"
                overall_status="DEGRADED"
            fi
        else
            log_error "  Status: DOWN (HTTP ${http_code})"
            log "  Response Time: ${response_time}ms"
            overall_status="UNHEALTHY"

            # Send alert
            "${SCRIPT_DIR}/alert.sh" critical "${service}" "Service is down" \
                "URL: ${url}\nHTTP Code: ${http_code}\nLast Check: $(date)"
        fi

        results+=("${service}:${status}:${http_code}:${response_time}:${avg_rt}:${error_pct}")
    done

    # Generate reports
    log_header "Generating Reports"
    generate_json_report "${REPORT_FILE}"
    generate_html_report "${HTML_REPORT}"

    log_success "JSON Report: ${REPORT_FILE}"
    log_success "HTML Report: ${HTML_REPORT}"

    # Update latest status
    {
        echo "Last Check: $(date)"
        echo "Overall Status: ${overall_status}"
        echo ""
        for result in "${results[@]}"; do
            IFS=':' read -r name status http_code response_time avg_rt error_pct <<< "${result}"
            echo "${name}: ${status} (${http_code}) - ${avg_rt}ms avg - ${error_pct}% errors"
        done
    } > "${SUMMARY_FILE}"

    # Summary
    log_header "Summary"
    log ""
    case "${overall_status}" in
        HEALTHY)
            log_success "All services are healthy"
            ;;
        DEGRADED)
            log_warning "Some services are degraded"
            ;;
        UNHEALTHY)
            log_error "Critical issues detected - immediate attention required"
            exit 1
            ;;
    esac

    log ""
    log "Check completed at $(date)"

    return 0
}

# Run
main "$@"
