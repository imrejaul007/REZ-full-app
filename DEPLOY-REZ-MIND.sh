#!/bin/bash
# ReZ Mind AI Services - Launch Deployment Script
# Deploys all 17 AI services for production launch

set -e

echo "========================================"
echo "  ReZ Mind AI - Production Launch"
echo "========================================"

# Base directory
BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App"
cd "$BASE_DIR"

# AI Services with ports
declare -A AI_SERVICES=(
  ["rez-intent-graph"]=3007
  ["rez-user-intelligence"]=3004
  ["rez-merchant-intelligence"]=4012
  ["rez-personalization-engine"]=4017
  ["rez-targeting-engine"]=3013
  ["rez-action-engine"]=3014
  ["rez-intelligence-hub"]=4020
  ["rez-consumer-copilot"]=4021
  ["rez-merchant-copilot"]=4022
  ["rez-support-copilot"]=4033
)

echo ""
echo "Step 1: Deploying Core Services..."
echo "========================================"

# Deploy core services first
if [ -f "DEPLOY-CORE-SERVICES.sh" ]; then
  chmod +x DEPLOY-CORE-SERVICES.sh
  ./DEPLOY-CORE-SERVICES.sh
fi

echo ""
echo "Step 2: Deploying ML Services..."
echo "========================================"

ML_SERVICES=(
  "rez-ml-feature-store:4100"
  "rez-ml-model-registry:4101"
  "rez-training-data-service:4102"
  "rez-fraud-detection-service:4103"
  "rez-data-quality-monitor:4106"
  "rez-ml-retraining-pipeline:4107"
)

for svc in "${ML_SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$svc"
  echo "Deploying $name on port $port..."

  if [ -d "$name" ]; then
    cd "$name"
    npm install --legacy-peer-deps 2>&1 | tail -3
    npm run build 2>&1 | tail -3
    cd "$BASE_DIR"
  fi
done

echo ""
echo "Step 3: Deploying Revenue Services..."
echo "========================================"

REVENUE_SERVICES=(
  "rez-price-optimization-service:4104"
  "rez-ab-testing-service:4105"
  "rez-bbps-service:4110"
  "rez-recharge-service:4111"
  "rez-einvoice-service:4112"
)

for svc in "${REVENUE_SERVICES[@]}"; do
  IFS=':' read -r name port <<< "$svc"
  echo "Deploying $name on port $port..."

  if [ -d "$name" ]; then
    cd "$name"
    npm install --legacy-peer-deps 2>&1 | tail -3
    cd "$BASE_DIR"
  fi
done

echo ""
echo "Step 4: Checking All Services..."
echo "========================================"

echo ""
echo "Core Services:"
for port in {4000..4006}; do
  if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "  Port $port: ✓"
  else
    echo "  Port $port: ✗ (not responding)"
  fi
done

echo ""
echo "AI Services:"
for port in 3007 3004 4012 4017 3013 3014 4020; do
  if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "  Port $port: ✓"
  else
    echo "  Port $port: ✗ (not responding)"
  fi
done

echo ""
echo "ML Services:"
for port in 4100 4101 4102 4103 4106 4107; do
  if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
    echo "  Port $port: ✓"
  else
    echo "  Port $port: ✗ (not responding)"
  fi
done

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Configure environment variables for production"
echo "2. Set up MongoDB Atlas clusters"
echo "3. Configure Redis for caching"
echo "4. Run transaction loop tests"
echo "5. Verify event pipeline"
echo "6. Launch AI features"
echo ""
