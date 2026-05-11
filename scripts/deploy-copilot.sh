#!/bin/bash
# Deploy copilot
set -e

cd "$(dirname "$0")/../rez-copilot"

echo "📦 Deploying copilot..."

npm install
npm run build

PORT=4026 npm run dev &
PID=$!

echo "copilot started (PID: $PID)"
echo "Health: http://localhost:4026/health"
