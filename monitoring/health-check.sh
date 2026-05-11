#!/bin/bash
# =============================================================================
# Health Check Script - Comprehensive service health monitoring
# =============================================================================
# Usage: ./health-check.sh [service_name] [--all]
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/config/services.conf"
LOG_FILE="${SCRIPT_DIR}/logs/health-check.log"
ALERT_THRESHOLDS="${SCRIPT_DIR}/config/thresholds.conf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
    echo -e "[${timestamp}] [${level}] ${message}"
}

check_service_health() {
    local service_name="$1"
    local health_endpoint="$2"
    local timeout="${3:-10}"
    local start_time=$(date +%s%3N)

    # Perform health check
    local http_code
    local response_body
    local response_time

    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        --max-time "${timeout}" \
        -H "Accept: application/json" \
        "${health_endpoint}" 2>&1) || {
        log "ERROR" "${service_name}: Connection failed - ${response}"
        return 1
    }

    # Parse response
    http_code=$(echo "${response}" | tail -2 | head -1)
    response_time=$(echo "${response}" | tail -1)
    response_body=$(echo "${response}" | head -n -2)

    # Calculate response time in ms
    response_time_ms=$(echo "${response_time}" | awk '{printf "%.0f", $1 * 1000}')

    # Check HTTP status
    if [[ "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
        log "INFO" "${service_name}: HTTP ${http_code}, Response time: ${response_time_ms}ms"
        echo "${response_body}" | jq -e '.status == "healthy" or .healthy == true' > /dev/null 2>&1 && {
            log "INFO" "${service_name}: Service reports healthy status"
            return 0
        } || {
            log "WARN" "${service_name}: HTTP OK but service status unclear"
            return 0
        }
    else
        log "ERROR" "${service_name}: HTTP ${http_code}, Response time: ${response_time_ms}ms"
        return 1
    fi
}

check_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-5}"

    if command -v nc &> /dev/null; then
        nc -z -w "${timeout}" "${host}" "${port}" 2>/dev/null
    elif command -v timeout &> /dev/null; then
        timeout "${timeout}" bash -c "cat < /dev/null > /dev/tcp/${host}/${port}" 2>/dev/null
    else
        # Fallback using curl
        curl -s --max-time "${timeout}" "http://${host}:${port}/" > /dev/null 2>&1
    fi
}

check_process() {
    local process_name="$1"
    pgrep -f "${process_name}" > /dev/null 2>&1
}

check_disk_space() {
    local path="${1:-/}"
    local threshold="${2:-90}"

    local usage=$(df -h "${path}" | awk 'NR==2 {print $5}' | tr -d '%')
    if [[ ${usage} -ge ${threshold} ]]; then
        log "ERROR" "Disk usage at ${usage}% on ${path} (threshold: ${threshold}%)"
        return 1
    fi
    log "INFO" "Disk usage: ${usage}% on ${path}"
    return 0
}

check_memory() {
    local warning_threshold="${1:-80}"
    local critical_threshold="${2:-95}"

    local mem_info=$(free -m | awk 'NR==2 {printf "%.0f %.0f", $3, $2}')
    local used=$(echo "${mem_info}" | awk '{print $1}')
    local total=$(echo "${mem_info}" | awk '{print $2}')
    local usage_pct=$((used * 100 / total))

    if [[ ${usage_pct} -ge ${critical_threshold} ]]; then
        log "ERROR" "Memory usage at ${usage_pct}% (critical: ${critical_threshold}%)"
        return 2
    elif [[ ${usage_pct} -ge ${warning_threshold} ]]; then
        log "WARN" "Memory usage at ${usage_pct}% (warning: ${warning_threshold}%)"
        return 1
    fi
    log "INFO" "Memory usage: ${usage_pct}% (${used}MB / ${total}MB)"
    return 0
}

check_cpu() {
    local threshold="${1:-90}"
    local duration="${2:-1}"

    local usage=$(top -l "${duration}" -n 1 | grep "CPU usage" | awk '{print $3}' | tr -d '%')
    local usage_int=${usage%.*}

    if [[ ${usage_int} -ge ${threshold} ]]; then
        log "WARN" "CPU usage at ${usage} (threshold: ${threshold}%)"
        return 1
    fi
    log "INFO" "CPU usage: ${usage}"
    return 0
}

send_alert() {
    local severity="$1"
    local service="$2"
    local message="$3"
    local details="${4:-}"

    "${SCRIPT_DIR}/alert.sh" "${severity}" "${service}" "${message}" "${details}"
}

# =============================================================================
# Service Health Checks
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

    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        --max-time "${timeout}" \
        -H "User-Agent: HealthCheck/1.0" \
        -o /dev/null \
        "${url}" 2>&1) || {
        local error_msg=$(echo "${response}" | head -1)
        log "ERROR" "${name}: FAILED - ${error_msg}"
        send_alert "critical" "${name}" "Service unreachable" "URL: ${url}\nError: ${error_msg}"
        return 1
    }

    http_code=$(echo "${response}" | tail -2 | head -1)
    response_time=$(echo "${response}" | tail -1)

    if [[ "${http_code}" == "${expected_status}" ]]; then
        log "INFO" "${name}: OK - HTTP ${http_code} (${response_time}s)"
        return 0
    else
        log "ERROR" "${name}: FAILED - HTTP ${http_code} (expected ${expected_status})"
        send_alert "warning" "${name}" "Unexpected status code" "Expected: ${expected_status}, Got: ${http_code}"
        return 1
    fi
}

check_json_endpoint() {
    local name="$1"
    local url="$2"
    local timeout="${3:-10}"

    local start_time=$(date +%s%3N)
    local response
    local http_code
    local response_time

    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        --max-time "${timeout}" \
        -H "Accept: application/json" \
        "${url}" 2>&1) || {
        log "ERROR" "${name}: FAILED - ${response}"
        return 1
    }

    http_code=$(echo "${response}" | tail -2 | head -1)
    response_time=$(echo "${response}" | tail -1)
    response_body=$(echo "${response}" | head -n -2)

    if [[ ! "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
        log "ERROR" "${name}: HTTP ${http_code}"
        return 1
    fi

    # Parse JSON response
    local status=$(echo "${response_body}" | jq -r '.status // .healthy // "unknown"')
    local message=$(echo "${response_body}" | jq -r '.message // .error // empty')

    if [[ "${status}" == "healthy" ]] || [[ "${status}" == "ok" ]] || [[ "${status}" == "true" ]]; then
        log "INFO" "${name}: HEALTHY - ${status}"
        return 0
    else
        log "ERROR" "${name}: UNHEALTHY - ${status} ${message}"
        return 1
    fi
}

# =============================================================================
# Response Time Monitoring
# =============================================================================

monitor_response_time() {
    local name="$1"
    local url="$2"
    local samples="${3:-5}"
    local threshold_ms="${4:-1000}"

    local total_time=0
    local success_count=0
    local times=()

    log "INFO" "Measuring response time for ${name} (${samples} samples)..."

    for i in $(seq 1 ${samples}); do
        local time_ms
        local http_code

        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            --max-time 30 \
            "${url}" 2>&1) || continue

        http_code=$(echo "${response}" | tail -2 | head -1)
        local time_s=$(echo "${response}" | tail -1)
        time_ms=$(echo "${time_s}" | awk '{printf "%.0f", $1 * 1000}')

        if [[ "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
            times+=("${time_ms}")
            total_time=$((total_time + time_ms))
            ((success_count++))
        fi
    done

    if [[ ${success_count} -eq 0 ]]; then
        log "ERROR" "${name}: All samples failed"
        return 1
    fi

    local avg_time=$((total_time / success_count))
    local min_time=$(echo "${times[@]}" | tr ' ' '\n' | sort -n | head -1)
    local max_time=$(echo "${times[@]}" | tr ' ' '\n' | sort -n | tail -1)

    log "INFO" "${name}: Avg=${avg_time}ms, Min=${min_time}ms, Max=${max_time}ms (${success_count}/${samples} successful)"

    if [[ ${avg_time} -gt ${threshold_ms} ]]; then
        log "WARN" "${name}: Average response time (${avg_time}ms) exceeds threshold (${threshold_ms}ms)"
        send_alert "warning" "${name}" "Slow response time" "Avg: ${avg_time}ms, Threshold: ${threshold_ms}ms"
        return 1
    fi

    return 0
}

# =============================================================================
# Error Rate Monitoring
# =============================================================================

monitor_error_rate() {
    local name="$1"
    local url="$2"
    local samples="${3:-10}"
    local error_threshold="${4:-10}"

    local total=0
    local errors=0

    log "INFO" "Checking error rate for ${name} (${samples} samples)..."

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

    local error_pct=$((errors * 100 / total))

    log "INFO" "${name}: Error rate ${error_pct}% (${errors}/${total} requests failed)"

    if [[ ${error_pct} -gt ${error_threshold} ]]; then
        log "ERROR" "${name}: Error rate (${error_pct}%) exceeds threshold (${error_threshold}%)"
        send_alert "critical" "${name}" "High error rate" "Error rate: ${error_pct}%, Threshold: ${error_threshold}%"
        return 1
    fi

    return 0
}

# =============================================================================
# Uptime Monitoring
# =============================================================================

check_uptime() {
    local name="$1"
    local url="$2"
    local consecutive_failures=0
    local max_failures="${3:-3}"

    log "INFO" "Starting uptime check for ${name}..."

    while true; do
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null) || {
            ((consecutive_failures++))
            log "WARN" "${name}: Failed attempt ${consecutive_failures}/${max_failures}"
            if [[ ${consecutive_failures} -ge ${max_failures} ]]; then
                log "ERROR" "${name}: Uptime check failed after ${consecutive_failures} consecutive failures"
                send_alert "critical" "${name}" "Service down" "Failed ${consecutive_failures} consecutive health checks"
                consecutive_failures=0
            fi
            sleep 30
            continue
        }

        if [[ "${http_code}" =~ ^2[0-9][0-9]$ ]]; then
            if [[ ${consecutive_failures} -gt 0 ]]; then
                log "INFO" "${name}: Service recovered (${consecutive_failures} previous failures ignored)"
            fi
            consecutive_failures=0
        else
            ((consecutive_failures++))
        fi

        sleep 30
    done
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    local target="${1:-}"
    local mode="${2:-}"

    # Ensure log directory exists
    mkdir -p "${SCRIPT_DIR}/logs"

    log "INFO" "=========================================="
    log "INFO" "Health Check Started"
    log "INFO" "=========================================="

    # Load configuration if exists
    if [[ -f "${CONFIG_FILE}" ]]; then
        log "INFO" "Loading configuration from ${CONFIG_FILE}"
        source "${CONFIG_FILE}"
    fi

    # Check system resources
    log "INFO" "--- System Resource Checks ---"
    check_disk_space "/" 90
    check_disk_space "/home" 90
    check_memory 80 95

    # Check if specific service or all
    if [[ -n "${target}" ]]; then
        if [[ "${target}" == "--all" ]]; then
            log "INFO" "Running all configured checks..."
            # Source and run all service checks
            if declare -f run_all_checks &>/dev/null; then
                run_all_checks
            fi
        else
            log "INFO" "Checking service: ${target}"
            if declare -f "check_${target}" &>/dev/null; then
                "check_${target}"
            else
                log "ERROR" "Unknown check: ${target}"
                exit 1
            fi
        fi
    else
        log "INFO" "No specific target specified. Use --all for full check."
        log "INFO" "Available checks:"
        declare -F | grep -E 'check_[a-z]' | awk '{print "  - " $3}'
    fi

    log "INFO" "Health check completed"
}

# =============================================================================
# Usage Information
# =============================================================================

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Health Check Script for monitoring service health

OPTIONS:
    --all                   Run all configured health checks
    --service <name>        Check specific service
    --response-time         Monitor response times
    --error-rate           Check error rates
    --uptime               Continuous uptime monitoring
    --help                  Show this help message

EXAMPLES:
    $(basename "$0") --all
    $(basename "$0") --service api
    $(basename "$0") --response-time

EOF
}

# Parse arguments
case "${1:-}" in
    --all)
        main "" "--all"
        ;;
    --service)
        main "${2:-}" "--service"
        ;;
    --response-time)
        monitor_response_time "${2:-}" "${3:-}" "${4:-5}" "${5:-1000}"
        ;;
    --error-rate)
        monitor_error_rate "${2:-}" "${3:-}" "${4:-10}" "${5:-10}"
        ;;
    --uptime)
        check_uptime "${2:-}" "${3:-}" "${4:-3}"
        ;;
    --help|-h)
        usage
        exit 0
        ;;
    *)
        main "${1:-}" "${2:-}"
        ;;
esac
