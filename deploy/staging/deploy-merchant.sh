#!/bin/bash
# Deploy rez-merchant-service to staging

set -e

SERVICE="rez-merchant-service"
REGION="ap-south-1"
ENV="staging"

echo "Deploying $SERVICE to $ENV..."

# Build
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-merchant-service
npm run build

# Push to registry (if using containers)
# docker build -t rez-merchant:$TAG .
# docker push

echo "Build complete!"
echo "Next: Deploy to Render/Railway/Vercel"
echo ""
echo "API will be available at:"
echo "https://merchant-api-staging.rezapp.com"
