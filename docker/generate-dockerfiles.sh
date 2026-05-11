#!/bin/bash
# Generate Dockerfiles for all services
# Usage: ./generate-dockerfiles.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Generating Dockerfiles for all services..."

# Services that need Dockerfiles
SERVICES=(
    "rez-auth-service"
    "rez-wallet-service"
    "rez-payment-service"
    "rez-order-service"
    "rez-merchant-service"
    "rez-api-gateway"
    "rez-intent-graph"
    "rez-user-intelligence"
    "rez-merchant-intelligence"
    "rez-personalization-engine"
    "rez-targeting-engine"
    "rez-action-engine"
    "rez-intelligence-hub"
    "rez-consumer-copilot"
    "rez-merchant-copilot"
    "rez-support-copilot"
    "rez-ml-feature-store"
    "rez-ml-model-registry"
    "rez-training-data-service"
    "rez-fraud-detection-service"
    "rez-price-optimization-service"
    "rez-ab-testing-service"
    "rez-data-quality-monitor"
    "rez-ml-retraining-pipeline"
    "rez-bbps-service"
    "rez-recharge-service"
    "rez-einvoice-service"
)

for service in "${SERVICES[@]}"; do
    if [ -d "$ROOT_DIR/$service" ]; then
        if [ ! -f "$ROOT_DIR/$service/Dockerfile" ]; then
            echo "Creating Dockerfile for $service..."
            cp "$SCRIPT_DIR/Dockerfile.service.template" "$ROOT_DIR/$service/Dockerfile"
        else
            echo "Dockerfile already exists for $service"
        fi
    else
        echo "Service not found: $service"
    fi
done

echo "Done!"
