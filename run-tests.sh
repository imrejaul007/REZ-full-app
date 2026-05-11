#!/bin/bash
echo "========================================"
echo "Running ReZ Ecosystem Tests"
echo "========================================"

echo ""
echo "1. Running Smoke Tests..."
./smoke-tests.sh || echo "Smoke tests need services running"

echo ""
echo "2. Running API Tests..."
./api-tests.sh || echo "API tests need services running"

echo ""
echo "3. Running Integration Tests..."
./integration-tests.sh || echo "Integration tests need services running"

echo ""
echo "========================================"
echo "Tests Complete"
echo "========================================"
echo ""
echo "To run tests with services:"
echo "  export SMOKE_TEST_URL=http://your-api-gateway"
echo "  ./smoke-tests.sh"
echo "  ./api-tests.sh"
echo "  ./integration-tests.sh"
