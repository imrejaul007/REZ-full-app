#!/bin/bash
# Deploy intent-service
set -e

cd "$(dirname "$0")/../rez-intent-service"

echo "📦 Deploying intent-service..."

npm install
npm run build

# Run tests
npm test || warn "Tests failed"

# Start service
PORT=4009 npm run dev &
PID=$!

echo "intent-service started (PID: $PID)"
echo "Health: http://localhost:4009/health"
