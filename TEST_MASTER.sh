#!/bin/bash
# =============================================================================
# TEST_MASTER.sh - Master Test Runner for ReZ Ecosystem
# =============================================================================
# Orchestrates all test suites across the monorepo
# Usage: ./TEST_MASTER.sh [options]
# Options:
#   --smoke        Run smoke tests only
#   --unit         Run unit tests only
#   --integration  Run integration tests only
#   --e2e          Run E2E tests only
#   --services     Run service-specific tests
#   --all          Run all tests (default)
#   --report       Generate test coverage report
#   --parallel     Run tests in parallel
#   --verbose      Verbose output
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_ROOT="/Users/rejaulkarim/Documents/ReZ Full App"
REPORT_DIR="${TEST_ROOT}/test-reports"
COVERAGE_DIR="${REPORT_DIR}/coverage"
LOG_FILE="${REPORT_DIR}/test_master_${TIMESTAMP}.log"

# Service endpoints for health checks
declare -A SERVICES=(
    ["auth"]="http://localhost:4001"
    ["payment"]="http://localhost:4002"
    ["api-gateway"]="http://localhost:4000"
    ["webhook"]="http://localhost:4003"
    ["ledger"]="http://localhost:4004"
)

# Parse arguments
RUN_MODE="${1:-all}"
VERBOSE=false
PARALLEL=false
GENERATE_REPORT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --smoke|--unit|--integration|--e2e|--services|--all)
            RUN_MODE="${1#--}"
            ;;
        --report) GENERATE_REPORT=true ;;
        --parallel) PARALLEL=true ;;
        --verbose) VERBOSE=true ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
    shift
done

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo -e "${CYAN}${BOLD} $1${NC}"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
}

check_service_health() {
    local service_name=$1
    local endpoint=$2
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "${endpoint}/health" > /dev/null 2>&1; then
            log_success "${service_name} is healthy"
            return 0
        fi
        log_warning "Attempt $attempt/$max_attempts: ${service_name} not responding"
        sleep 2
        ((attempt++))
    done

    log_error "${service_name} health check failed"
    return 1
}

check_all_services_healthy() {
    log_section "CHECKING SERVICE HEALTH"
    local all_healthy=true

    for service in "${!SERVICES[@]}"; do
        if ! check_service_health "$service" "${SERVICES[$service]}"; then
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = false ]; then
        log_warning "Some services are not healthy. Tests may fail."
    fi

    return 0
}

# Test runners
run_smoke_tests() {
    log_section "SMOKE TESTS"

    local test_files=(
        "${TEST_ROOT}/tests/auth.test.js"
        "${TEST_ROOT}/tests/payment.test.js"
        "${TEST_ROOT}/tests/api.test.js"
        "${TEST_ROOT}/tests/webhooks.test.js"
    )

    local passed=0
    local failed=0

    for test_file in "${test_files[@]}"; do
        if [ -f "$test_file" ]; then
            log_info "Running smoke tests from: $test_file"
            if npx jest "$test_file" --testNamePattern="smoke" --passWithNoTests 2>&1 | tee -a "$LOG_FILE"; then
                ((passed++))
            else
                ((failed++))
            fi
        fi
    done

    log_info "Smoke tests: ${passed} passed, ${failed} failed"
}

run_unit_tests() {
    log_section "UNIT TESTS"

    cd "${TEST_ROOT}"

    if [ "$VERBOSE" = true ]; then
        npx jest --testPathPattern="unit" --verbose 2>&1 | tee -a "$LOG_FILE"
    else
        npx jest --testPathPattern="unit" 2>&1 | tee -a "$LOG_FILE"
    fi
}

run_integration_tests() {
    log_section "INTEGRATION TESTS"

    check_all_services_healthy || true

    cd "${TEST_ROOT}"

    if [ "$VERBOSE" = true ]; then
        npx jest --testPathPattern="integration" --verbose 2>&1 | tee -a "$LOG_FILE"
    else
        npx jest --testPathPattern="integration" 2>&1 | tee -a "$LOG_FILE"
    fi
}

run_e2e_tests() {
    log_section "END-TO-END TESTS"

    check_all_services_healthy

    cd "${TEST_ROOT}"

    if [ "$VERBOSE" = true ]; then
        npx jest --testPathPattern="e2e" --verbose 2>&1 | tee -a "$LOG_FILE"
    else
        npx jest --testPathPattern="e2e" 2>&1 | tee -a "$LOG_FILE"
    fi
}

run_service_tests() {
    log_section "SERVICE-SPECIFIC TESTS"

    local test_files=(
        "${TEST_ROOT}/tests/auth.test.js"
        "${TEST_ROOT}/tests/payment.test.js"
        "${TEST_ROOT}/tests/api.test.js"
        "${TEST_ROOT}/tests/webhooks.test.js"
    )

    for test_file in "${test_files[@]}"; do
        if [ -f "$test_file" ]; then
            local test_name=$(basename "$test_file" .test.js)
            log_info "Running ${test_name} tests..."

            npx jest "$test_file" --verbose 2>&1 | tee -a "$LOG_FILE" || {
                log_error "${test_name} tests failed"
                return 1
            }
        fi
    done

    log_success "All service tests completed"
}

generate_report() {
    log_section "GENERATING TEST REPORT"

    local report_file="${REPORT_DIR}/report_${TIMESTAMP}.html"

    npx jest --coverage --coverageReporters=html --coverageReporters=lcov --coverageDirectory="${COVERAGE_DIR}" 2>&1 | tee -a "$LOG_FILE"

    if [ -d "${COVERAGE_DIR}" ]; then
        log_success "Coverage report generated at: ${COVERAGE_DIR}"
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           ReZ Ecosystem - Master Test Runner                ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo "Run mode: ${RUN_MODE}"
    echo "Timestamp: ${TIMESTAMP}"
    echo "Log file: ${LOG_FILE}"
    echo ""

    # Create report directory
    mkdir -p "${REPORT_DIR}"
    mkdir -p "${COVERAGE_DIR}"

    # Record start time
    START_TIME=$(date +%s)

    # Execute based on run mode
    case "$RUN_MODE" in
        smoke)
            run_smoke_tests
            ;;
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        services)
            run_service_tests
            ;;
        all|*)
            log_info "Running all tests..."
            check_all_services_healthy || true
            run_smoke_tests
            run_unit_tests
            run_integration_tests
            run_service_tests
            ;;
    esac

    # Generate report if requested
    if [ "$GENERATE_REPORT" = true ]; then
        generate_report
    fi

    # Calculate duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    # Summary
    log_section "TEST EXECUTION SUMMARY"
    echo -e "${BOLD}Total duration:${NC} ${DURATION} seconds"
    echo -e "${BOLD}Log file:${NC} ${LOG_FILE}"
    echo -e "${BOLD}Run mode:${NC} ${RUN_MODE}"
    echo ""

    if [ -f "$LOG_FILE" ]; then
        local total_tests=$(grep -c "Tests:" "$LOG_FILE" || echo "0")
        local passed_tests=$(grep -oP "passed: \K\d+" "$LOG_FILE" | awk '{s+=$1} END {print s}' || echo "0")
        local failed_tests=$(grep -oP "failed: \K\d+" "$LOG_FILE" | awk '{s+=$1} END {print s}' || echo "0")

        echo -e "${BOLD}Test Results:${NC}"
        echo -e "  ${GREEN}Passed: ${passed_tests}${NC}"
        echo -e "  ${RED}Failed: ${failed_tests}${NC}"
    fi

    echo ""
    log_success "Test execution completed"
    echo ""
}

# Run main
main "$@"
