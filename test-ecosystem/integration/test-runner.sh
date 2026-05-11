#!/bin/bash

# Integration Test Runner for All ReZ Services
# This script runs all integration tests for the microservices ecosystem

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COVERAGE_DIR="$SCRIPT_DIR/coverage"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services to test
SERVICES=(
  "rez-analytics-v2"
  "rez-customer-platform-ui"
  "rez-inventory-v2-ui"
  "rez-staff-service"
  "rez-delivery-service"
  "rez-capital-service"
)

# Test results tracking
declare -A TEST_RESULTS
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0
TOTAL_TESTS=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   ReZ Ecosystem Integration Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Start Time: $(date)"
echo "Project Root: $PROJECT_ROOT"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check for Jest
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx is required but not installed${NC}"
    exit 1
fi

# Create coverage directory
mkdir -p "$COVERAGE_DIR"

# Function to run tests for a service
run_service_tests() {
  local service=$1
  local service_dir="$SCRIPT_DIR/$service"

  if [ ! -d "$service_dir" ]; then
    echo -e "${YELLOW}Warning: Directory for $service not found, skipping${NC}"
    return
  fi

  echo -e "${BLUE}------------------------------------------------${NC}"
  echo -e "${BLUE}Testing: $service${NC}"
  echo -e "${BLUE}------------------------------------------------${NC}"

  # Check if service-specific tests exist
  if [ ! -f "$service_dir/$service.test.ts" ]; then
    echo -e "${YELLOW}No test file found for $service, skipping${NC}"
    return
  fi

  # Run the tests
  local start_time=$(date +%s)

  if npx jest "$service_dir/$service.test.ts" \
    --config="$SCRIPT_DIR/jest.config.js" \
    --coverage \
    --coverageDirectory="$COVERAGE_DIR/$service" \
    --json \
    --outputFile="$COVERAGE_DIR/$service/results.json" \
    2>&1; then

    TEST_RESULTS[$service]="PASSED"
    echo -e "${GREEN}✓ $service tests passed${NC}"
  else
    TEST_RESULTS[$service]="FAILED"
    echo -e "${RED}✗ $service tests failed${NC}"
  fi

  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  echo "Duration: ${duration}s"
  echo ""
}

# Function to generate combined report
generate_report() {
  echo ""
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}   Test Results Summary${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""

  for service in "${SERVICES[@]}"; do
    local result=${TEST_RESULTS[$service]:-NOT_RUN}
    local status_icon="○"

    case $result in
      PASSED)
        status_icon="✓"
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
        ;;
      FAILED)
        status_icon="✗"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        ;;
      *)
        status_icon="○"
        TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
        ;;
    esac

    printf "%-40s %s\n" "$service" "$status_icon"
  done

  echo ""
  echo "------------------------------------------------"
  echo "Total Passed:  $TOTAL_PASSED"
  echo "Total Failed:  $TOTAL_FAILED"
  echo "Total Skipped: $TOTAL_SKIPPED"
  echo "Total:         ${#SERVICES[@]}"
  echo ""

  # Parse individual test results
  echo -e "${BLUE}Individual Test Results:${NC}"
  for service in "${SERVICES[@]}"; do
    local result_file="$COVERAGE_DIR/$service/results.json"
    if [ -f "$result_file" ]; then
      local tests=$(cat "$result_file" | grep -o '"numPassedTests":[0-9]*' | grep -o '[0-9]*' || echo "0")
      local suites=$(cat "$result_file" | grep -o '"numPassedTestSuites":[0-9]*' | grep -o '[0-9]*' || echo "0")
      echo "  $service: $tests tests in $suites suites passed"
    fi
  done

  echo ""
  echo "End Time: $(date)"
  echo ""

  # Generate HTML report
  cat > "$COVERAGE_DIR/report.html" << EOF
<!DOCTYPE html>
<html>
<head>
  <title>ReZ Integration Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .passed { color: green; }
    .failed { color: red; }
    .skipped { color: orange; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
  </style>
</head>
<body>
  <h1>ReZ Ecosystem Integration Test Report</h1>
  <p>Generated: $(date)</p>
  <table>
    <tr><th>Service</th><th>Status</th></tr>
EOF

  for service in "${SERVICES[@]}"; do
    local result=${TEST_RESULTS[$service]:-NOT_RUN}
    echo "    <tr><td>$service</td><td class=\"${result,,}\">$result</td></tr>" >> "$COVERAGE_DIR/report.html"
  done

  cat >> "$COVERAGE_DIR/report.html" << EOF
  </table>
  <h2>Summary</h2>
  <p>Passed: $TOTAL_PASSED | Failed: $TOTAL_FAILED | Skipped: $TOTAL_SKIPPED</p>
</body>
</html>
EOF

  echo -e "${BLUE}HTML Report: $COVERAGE_DIR/report.html${NC}"
}

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}Cleaning up...${NC}"
  # Add any cleanup logic here
}

# Parse command line arguments
RUN_SPECIFIC=""
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --service)
      RUN_SPECIFIC="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "  --service <name>  Run tests for a specific service only"
      echo "  --verbose         Enable verbose output"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Run tests
if [ -n "$RUN_SPECIFIC" ]; then
  echo -e "${YELLOW}Running tests for specific service: $RUN_SPECIFIC${NC}"
  run_service_tests "$RUN_SPECIFIC"
else
  for service in "${SERVICES[@]}"; do
    run_service_tests "$service"
  done
fi

# Generate final report
generate_report

# Cleanup on exit
cleanup

# Exit with appropriate code
if [ $TOTAL_FAILED -gt 0 ]; then
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
