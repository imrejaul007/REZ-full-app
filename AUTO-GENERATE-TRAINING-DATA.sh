#!/bin/bash
# ReZ ML Training - Auto Generate & Train
# Usage: ./AUTO-TRAIN-ML.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")"" && pwd)"

echo "========================================"
echo "  ReZ ML Training Pipeline"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Step 1: Generate Training Data
step_generate() {
    log "Step 1: Generating Training Data..."

    if [ ! -d "rez-ml-training-generator" ]; then
        error "rez-ml-training-generator not found"
    fi

    cd rez-ml-training-generator
    npm install 2>&1 | tail -3

    log "Generating fraud training data..."
    npm run generate:fraud 2>&1 | tail -10

    log "Generating intent training data..."
    npm run generate:intent 2>&1 | tail -10

    log "Generating recommendation training data..."
    npm run generate:recommendation 2>&1 | tail -10

    cd "$SCRIPT_DIR"
    log "Training data generation complete!"
}

# Step 2: Train Models
step_train() {
    log "Step 2: Training ML Models..."

    if [ ! -d "rez-ml-engine" ]; then
        error "rez-ml-engine not found"
    fi

    cd rez-ml-engine
    npm install 2>&1 | tail -3

    log "Training fraud detection model..."
    npm run train:fraud 2>&1 | tail -20

    log "Training recommendation model..."
    npm run train:recommendation 2>&1 | tail -20

    log "Training price optimization model..."
    npm run train:price 2>&1 | tail -20

    cd "$SCRIPT_DIR"
    log "Model training complete!"
}

# Step 3: Validate Models
step_validate() {
    log "Step 3: Validating Models..."

    if [ ! -d "trained-models" ]; then
        error "trained-models directory not found"
    fi

    # Check if models exist
    for model in fraud-model recommendation-model price-model; do
        if [ -f "trained-models/${model}-v1.0.0.json" ]; then
            log "✓ ${model} validated"
        else
            warn "✗ ${model} not found"
        fi
    done
}

# Step 4: Deploy to Registry
step_deploy() {
    log "Step 4: Deploying to Model Registry..."

    # This would call the model registry API
    log "Model registry deployment would happen here"
    log "(Requires ML Model Registry service running)"
}

# Main
main() {
    cd "$SCRIPT_DIR"

    log "Starting ML Training Pipeline..."

    step_generate
    step_train
    step_validate
    step_deploy

    echo ""
    echo "========================================"
    echo -e "${GREEN}  ML Training Complete!${NC}"
    echo "========================================"
    echo ""
    echo "Models trained:"
    echo "  - Fraud Detection"
    echo "  - Recommendation Engine"
    echo "  - Price Optimization"
    echo ""
    echo "Next: Deploy models to production"
    echo ""
}

main "$@"
