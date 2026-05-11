#!/bin/bash
# Deploy decision-service
set -e

cd "$(dirname "$0")/../rez-decision-service"

echo "📦 Deploying decision-service..."

npm install
npm run build

PORT=4027 npm run dev &
PID=$!

echo "decision-service started (PID: $PID)"
echo "Health: http://localhost:4027/health"
