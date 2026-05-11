#!/bin/bash
set -e

echo "=========================================="
echo "ReZ Production Deployment"
echo "=========================================="

# Check environment
if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found"
  exit 1
fi

# Load environment
set -a && source .env.prod && set +a

# Build all services
echo "Building Docker images..."
docker build -t rez/analytics-v2:latest ./rez-analytics-v2
docker build -t rez/staff-service:latest ./rez-staff-service
docker build -t rez/delivery-service:latest ./rez-delivery-service
docker build -t rez/capital-service:latest ./rez-capital-service
docker build -t rez/corpperks-service:latest ./rez-corpperks-service

# Tag for registry
docker tag rez/analytics-v2:latest $REGISTRY/rez/analytics-v2:latest
docker tag rez/staff-service:latest $REGISTRY/rez/staff-service:latest
docker tag rez/delivery-service:latest $REGISTRY/rez/delivery-service:latest
docker tag rez/capital-service:latest $REGISTRY/rez/capital-service:latest
docker tag rez/corpperks-service:latest $REGISTRY/rez/corpperks-service:latest

# Push to registry
echo "Pushing to registry..."
docker push $REGISTRY/rez/analytics-v2:latest
docker push $REGISTRY/rez/staff-service:latest
docker push $REGISTRY/rez/delivery-service:latest
docker push $REGISTRY/rez/capital-service:latest
docker push $REGISTRY/rez/corpperks-service:latest

# Deploy
echo "Deploying to production..."
kubectl apply -f k8s/

# Wait for rollout
echo "Waiting for rollout..."
kubectl rollout status deployment/analytics-v2
kubectl rollout status deployment/staff-service
kubectl rollout status deployment/delivery-service
kubectl rollout status deployment/capital-service
kubectl rollout status deployment/corpperks-service

echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
