#!/bin/bash
# =============================================================================
# TEST_ALL_SERVICES.sh - Comprehensive Service Testing for ReZ Ecosystem
# =============================================================================
# Tests all services in the ReZ monorepo including:
# - Core services (auth, payment, api-gateway, webhooks)
# - Intelligence services
# - Media services
# - Merchant services
# - Consumer services
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_ROOT="/Users/rejaulkarim/Documents/ReZ Full App"
REPORT_DIR="${TEST_ROOT}/test-reports"
LOG_DIR="${REPORT_DIR}/logs"
mkdir -p "${LOG_DIR}"

# Service configurations
declare -A SERVICES=(
    # Core Services
    ["auth"]="http://localhost:4001"
    ["payment"]="http://localhost:4002"
    ["webhook"]="http://localhost:4003"
    ["ledger"]="http://localhost:4004"
    ["api-gateway"]="http://localhost:4000"

    # Intelligence Services
    ["insights"]="http://localhost:4010"
    ["recommendation"]="http://localhost:4011"
    ["personalization"]="http://localhost:4012"
    ["intent-graph"]="http://localhost:4013"
    ["event-bus"]="http://localhost:4014"

    # Media Services
    ["media-upload"]="http://localhost:4020"
    ["media-processing"]="http://localhost:4021"

    # Merchant Services
    ["merchant"]="http://localhost:4030"
    ["menu"]="http://localhost:4031"
    ["inventory"]="http://localhost:4032"
    ["orders"]="http://localhost:4033"

    # Consumer Services
    ["consumer"]="http://localhost:4040"
    ["loyalty"]="http://localhost:4041"
    ["wallet"]="http://localhost:4042"

    # Support Services
    ["notification"]="http://localhost:4050"
    ["analytics"]="http://localhost:4051"
)

# Test categories
CORE_SERVICES=("auth" "payment" "webhook" "ledger" "api-gateway")
INTELLIGENCE_SERVICES=("insights" "recommendation" "personalization" "intent-graph" "event-bus")
MEDIA_SERVICES=("media-upload" "media-processing")
MERCHANT_SERVICES=("merchant" "menu" "inventory" "orders")
CONSUMER_SERVICES=("consumer" "loyalty" "wallet")
SUPPORT_SERVICES=("notification" "analytics")

# Parse arguments
TEST_CATEGORY="${1:-all}"
VERBOSE=false
CONTINUE_ON_FAILURE=false
GENERATE_HTML=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --category|--services|--core|--intelligence|--media|--merchant|--consumer|--support|--all)
            TEST_CATEGORY="${1#--}"
            ;;
        --verbose|-v) VERBOSE=true ;;
        --continue|-c) CONTINUE_ON_FAILURE=true ;;
        --html) GENERATE_HTML=true ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --core         Test only core services (auth, payment, webhooks, etc.)"
            echo "  --intelligence Test only intelligence services"
            echo "  --media        Test only media services"
            echo "  --merchant     Test only merchant services"
            echo "  --consumer     Test only consumer services"
            echo "  --support      Test only support services"
            echo "  --all          Test all services (default)"
            echo "  --verbose      Verbose output"
            echo "  --continue     Continue testing even if some tests fail"
            echo "  --html         Generate HTML report"
            echo "  --help         Show this help message"
            exit 0
            ;;
    esac
    shift
done

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "${LOG_DIR}/test_${TIMESTAMP}.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${LOG_DIR}/test_${TIMESTAMP}.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${LOG_DIR}/test_${TIMESTAMP}.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${LOG_DIR}/test_${TIMESTAMP}.log"
}

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo -e "${CYAN}${BOLD} $1${NC}"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while ps -p $pid > /dev/null 2>&1; do
        local temp=${spinstr#?}
        printf " [%c] " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b\b"
}

check_service_health() {
    local service_name=$1
    local endpoint=$2
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "${endpoint}/health" > /dev/null 2>&1; then
            return 0
        fi
        ((attempt++))
    done
    return 1
}

run_service_test() {
    local service_name=$1
    local endpoint=$2
    local test_file=$3

    log_info "Testing ${service_name} (${endpoint})..."

    if [ -f "${TEST_ROOT}/tests/${test_file}" ]; then
        if npx jest "${TEST_ROOT}/tests/${test_file}" --testNamePattern="smoke" --passWithNoTests 2>&1; then
            log_success "${service_name}: smoke tests passed"
            return 0
        else
            log_warning "${service_name}: smoke tests had issues"
            return 1
        fi
    else
        # Fallback to direct health check
        if curl -sf "${endpoint}/health" > /dev/null 2>&1; then
            log_success "${service_name}: health check passed"
            return 0
        else
            log_error "${service_name}: health check failed"
            return 1
        fi
    fi
}

# Test execution functions
test_core_services() {
    log_section "CORE SERVICES TESTS"

    local passed=0
    local failed=0

    for service in "${CORE_SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"
        local test_file=""

        case $service in
            auth) test_file="auth.test.js" ;;
            payment) test_file="payment.test.js" ;;
            api-gateway) test_file="api.test.js" ;;
            webhook) test_file="webhooks.test.js" ;;
            *) test_file="${service}.test.js" ;;
        esac

        if run_service_test "$service" "$endpoint" "$test_file"; then
            ((passed++))
        else
            ((failed++))
            [ "$CONTINUE_ON_FAILURE" = false ] && [ $failed -ge 1 ] && return 1
        fi
    done

    log_info "Core services: ${passed} passed, ${failed} failed"
    return $failed
}

test_intelligence_services() {
    log_section "INTELLIGENCE SERVICES TESTS"

    local passed=0
    local failed=0

    for service in "${INTELLIGENCE_SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"

        if run_service_test "$service" "$endpoint" "${service}.test.js"; then
            ((passed++))
        else
            ((failed++))
            [ "$CONTINUE_ON_FAILURE" = false ] && [ $failed -ge 1 ] && return 1
        fi
    done

    log_info "Intelligence services: ${passed} passed, ${failed} failed"
    return $failed
}

test_media_services() {
    log_section "MEDIA SERVICES TESTS"

    local passed=0
    local failed=0

    for service in "${MEDIA_SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"

        if run_service_test "$service" "$endpoint" "${service}.test.js"; then
            ((passed++))
        else
            ((failed++))
            [ "$CONTINUE_ON_FAILURE" = false ] && [ $failed -ge 1 ] && return 1
        fi
    done

    log_info "Media services: ${passed} passed, ${failed} failed"
    return $failed
}

test_merchant_services() {
    log_section "MERCHANT SERVICES TESTS"

    local passed=0
    local failed=0

    for service in "${MERCHANT_SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"

        if run_service_test "$service" "$endpoint" "${service}.test.js"; then
            ((passed++))
        else
            ((failed++))
            [ "$CONTINUE_ON_FAILURE" = false ] && [ $failed -ge 1 ] && return 1
        fi
    done

    log_info "Merchant services: ${passed} passed, ${failed} failed"
    return $failed
}

test_consumer_services() {
    log_section "CONSUMER SERVICES TESTS"

    local passed=0
    local failed=0

    for service in "${CONSUMER_SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"

        if run_service_test "$service" "$endpoint" "${service}.test.js"; then
            ((passed++))
        else
            ((failed++))
            [ "$CONTINUE_ON_FAILURE" = false ] && [ $failed -ge 1 ] && return 1
        fi
    done

    log_info "Consumer services: ${passed} passed, ${failed} failed"
    return $failed
}

test_support_services() {
    log_section "SUPPORT SERVICES TESTS"

    local passed=0
    local failed=0

    for service in "${SUPPORT_SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"

        if run_service_test "$service" "$endpoint" "${service}.test.js"; then
            ((passed++))
        else
            ((failed++))
            [ "$CONTINUE_ON_FAILURE" = false ] && [ $failed -ge 1 ] && return 1
        fi
    done

    log_info "Support services: ${passed} passed, ${failed} failed"
    return $failed
}

test_all_services() {
    log_section "TESTING ALL SERVICES"

    local total_passed=0
    local total_failed=0

    for service in "${!SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"

        log_info "Testing ${service}..."

        if curl -sf "${endpoint}/health" > /dev/null 2>&1; then
            log_success "${service}: online"
        else
            log_warning "${service}: offline or unreachable"
            ((total_failed++))
        fi
    done

    log_info "Service availability: ${total_passed} online, ${total_failed} unreachable"
}

generate_html_report() {
    log_section "GENERATING HTML REPORT"

    local report_file="${REPORT_DIR}/test_report_${TIMESTAMP}.html"

    cat > "${report_file}" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReZ Service Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { border-left: 4px solid #27ae60; }
        .failed { border-left: 4px solid #e74c3c; }
        .warning { border-left: 4px solid #f39c12; }
        .services { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .service { background: white; padding: 15px; border-radius: 5px; }
        .online { color: #27ae60; }
        .offline { color: #e74c3c; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #34495e; color: white; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ReZ Ecosystem - Service Test Report</h1>
        <p>Generated: TIMESTAMP_PLACEHOLDER</p>
    </div>
    <div class="summary">
        <div class="card passed">
            <h3>Services Online</h3>
            <p style="font-size: 2em; margin: 0;">ONLINE_COUNT</p>
        </div>
        <div class="card failed">
            <h3>Services Offline</h3>
            <p style="font-size: 2em; margin: 0;">OFFLINE_COUNT</p>
        </div>
    </div>
    <h2>Service Status</h2>
    <table>
        <thead>
            <tr>
                <th>Service</th>
                <th>Endpoint</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            SERVICES_TABLE_PLACEHOLDER
        </tbody>
    </table>
</body>
</html>
EOF

    # Count online/offline
    local online_count=0
    local offline_count=0
    local services_html=""

    for service in "${!SERVICES[@]}"; do
        local endpoint="${SERVICES[$service]}"
        local status_class="offline"
        local status_text="Offline"

        if curl -sf "${endpoint}/health" > /dev/null 2>&1; then
            ((online_count++))
            status_class="online"
            status_text="Online"
        else
            ((offline_count++))
        fi

        services_html="${services_html}<tr><td>${service}</td><td>${endpoint}</td><td class='${status_class}'>${status_text}</td></tr>"
    done

    # Replace placeholders
    sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$(date)/g" "${report_file}"
    sed -i.bak "s/ONLINE_COUNT/${online_count}/g" "${report_file}"
    sed -i.bak "s/OFFLINE_COUNT/${offline_count}/g" "${report_file}"
    sed -i.bak "s|SERVICES_TABLE_PLACEHOLDER|${services_html}|g" "${report_file}"
    rm -f "${report_file}.bak"

    log_success "HTML report generated: ${report_file}"
}

# Main execution
main() {
    echo ""
    echo -e "${MAGENTA}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║        ReZ Ecosystem - Comprehensive Service Testing            ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "Test category: ${TEST_CATEGORY}"
    echo "Timestamp: ${TIMESTAMP}"
    echo "Log file: ${LOG_DIR}/test_${TIMESTAMP}.log"
    echo ""

    # Record start time
    START_TIME=$(date +%s)

    # Execute based on category
    case "$TEST_CATEGORY" in
        core)
            test_core_services
            ;;
        intelligence)
            test_intelligence_services
            ;;
        media)
            test_media_services
            ;;
        merchant)
            test_merchant_services
            ;;
        consumer)
            test_consumer_services
            ;;
        support)
            test_support_services
            ;;
        all|*)
            test_core_services || true
            test_intelligence_services || true
            test_media_services || true
            test_merchant_services || true
            test_consumer_services || true
            test_support_services || true
            test_all_services
            ;;
    esac

    # Generate HTML report if requested
    if [ "$GENERATE_HTML" = true ]; then
        generate_html_report
    fi

    # Calculate duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Summary
    log_section "TEST EXECUTION SUMMARY"
    echo -e "${BOLD}Total duration:${NC} ${DURATION} seconds"
    echo -e "${BOLD}Log file:${NC} ${LOG_DIR}/test_${TIMESTAMP}.log"
    echo -e "${BOLD}Test category:${NC} ${TEST_CATEGORY}"
    echo ""

    log_success "Test execution completed"
    echo ""
}

# Run main
main "$@"
