#!/bin/bash
# Deploy ad-platform
set -e

cd "$(dirname "$0")/../rez-ad-platform"

echo "📦 Deploying ad-platform..."

npm install
npm run build

PORT=4028 npm run dev &
PID=$!

echo "ad-platform started (PID: $PID)"
echo "Health: http://localhost:4028/health"
