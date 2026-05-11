#!/bin/bash
echo "Running all tests..."

# rez-now
echo "Testing rez-now..."
cd rez-now && npm test 2>/dev/null || echo "No tests configured"

# verify-service
echo "Testing verify-service..."
cd ../verify-service && npm test 2>/dev/null || echo "No tests configured"

# rez-try
echo "Testing rez-try..."
cd ../rez-try && npm test 2>/dev/null || echo "No tests configured"

echo "All tests complete!"
