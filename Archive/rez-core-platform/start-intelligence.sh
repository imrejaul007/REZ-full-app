#!/bin/bash
# Start REZ Intelligence services

echo "Starting REZ Intelligence..."

# Feedback Service (4010)
cd services/feedback-service && npm start &
sleep 2

# Intelligence Hub (4020)
cd ../intelligence-hub && npm start &
sleep 2

# User Intelligence (3004)
cd ../user-intelligence && npm start &
sleep 2

# Merchant Intelligence (4012)
cd ../merchant-intelligence && npm start &

echo "Intelligence services started"
wait
