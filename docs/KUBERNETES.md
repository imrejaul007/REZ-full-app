# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.25+)
- kubectl configured
- Helm 3+

## Quick Deploy

```bash
# Apply all services
kubectl apply -f k8s/services/

# Check status
kubectl get pods -l app=rez

# View logs
kubectl logs -l app=rez -f
```

## Individual Service

```bash
# Deploy intent-service
kubectl apply -f k8s/services/intent-service.yaml

# Scale
kubectl scale deployment intent-service --replicas=5

# Check health
kubectl get pods -l service=intent-service
```

## Monitoring

```bash
# Port forward to local
kubectl port-forward svc/intent-service 4009:4009

# View all services
kubectl get svc -l app=rez
```

## Secrets

```bash
# Create secrets
kubectl create secret generic rez-secrets \
  --from-literal=redis-url=redis://redis:6379 \
  --from-literal=mongodb-uri=mongodb://mongo:27017

# Or use sealed secrets for production
```

## HPA (Auto-scaling)

```bash
# Check HPA
kubectl get hpa

# Manual scale
kubectl scale deployment intent-service --replicas=10
```

## Troubleshooting

```bash
# Describe pod
kubectl describe pod intent-service-xxx

# Logs
kubectl logs intent-service-xxx -f

# Exec into pod
kubectl exec -it intent-service-xxx -- sh

# Restart deployment
kubectl rollout restart deployment/intent-service
```
