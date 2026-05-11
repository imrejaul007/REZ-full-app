#!/bin/bash
# =============================================================================
# Install all dependencies for all services
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📦 Installing dependencies for all services..."
echo "=============================================="

services=(
    "rez-intent-service"
    "rez-copilot"
    "rez-decision-service"
    "rez-ad-platform"
    "api-gateway"
)

for service in "${services[@]}"; do
    if [ -d "$PROJECT_DIR/$service" ]; then
        echo ""
        echo "📦 Installing $service..."
        cd "$PROJECT_DIR/$service"
        npm install
        echo "✅ $service installed"
    else
        echo "⚠️ $service not found, skipping"
    fi
done

cd "$PROJECT_DIR"

echo ""
echo "=============================================="
echo "✅ All dependencies installed!"
echo ""
echo "Next steps:"
echo "  1. docker-compose -f docker-compose.unified.yml up -d"
echo "  2. ./scripts/health-all.sh"
