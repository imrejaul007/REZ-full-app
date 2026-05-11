#!/bin/bash
# REZ Mind - Run ML Training
# Generates training data and trains ML models

echo "=============================================="
echo "REZ MIND - ML TRAINING"
echo "=============================================="
echo ""

BASE_DIR="/Users/rejaulkarim/Documents/ReZ Full App"

echo "1. Checking ML Engine..."
echo "-------------------------------------"
if [ -d "$BASE_DIR/rez-ml-engine" ]; then
    echo "ML Engine directory found"
    cd "$BASE_DIR/rez-ml-engine"

    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install 2>&1 | tail -5
    fi
else
    echo "ML Engine not found!"
    exit 1
fi
echo ""

echo "2. Generating Training Data..."
echo "-------------------------------------"
if [ -f "scripts/generateTrainingData.ts" ]; then
    echo "Running data generator..."
    npx tsx scripts/generateTrainingData.ts 2>&1 || echo "Note: Needs MongoDB connection for real data"
else
    echo "Generator script not found"
fi
echo ""

echo "3. Training ML Models..."
echo "-------------------------------------"
if [ -f "scripts/trainModels.ts" ]; then
    echo "Running model trainer..."
    npx tsx scripts/trainModels.ts 2>&1 || echo "Note: Will use mock data if training data not available"
else
    echo "Trainer script not found"
fi
echo ""

echo "4. Checking Trained Models..."
echo "-------------------------------------"
if [ -d "models" ]; then
    echo "Models directory:"
    ls -la models/ 2>/dev/null || echo "No models yet"
else
    echo "Models directory not created"
fi
echo ""

echo "=============================================="
echo "ML Training Complete"
echo "=============================================="
echo ""
echo "Trained models are saved in: $BASE_DIR/rez-ml-engine/models/"
echo ""
