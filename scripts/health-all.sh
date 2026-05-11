#!/bin/bash
# Health check for all services
set -e

echo "🏥 ReZ Services Health Check"
echo "=============================="

check() {
    local name=$1
    local url=$2

    if curl -sf "$url" > /dev/null 2>&1; then
        echo "✅ $name: OK"
    else
        echo "❌ $name: FAILED"
    fi
}

check "intent-service" "http://localhost:4009/health"
check "copilot" "http://localhost:4026/health"
check "decision-service" "http://localhost:4027/health"
check "ad-platform" "http://localhost:4028/health"
check "api-gateway" "http://localhost:3000/health"

echo ""
echo "Done!"
