# Feature Flags

## Quick Toggle

```bash
# Enable new services
export USE_NEW_INTENT_SERVICE=true
export USE_NEW_COPILOT=true
export USE_NEW_DECISION_SERVICE=true
export USE_NEW_AD_PLATFORM=true

# Disable (rollback)
export USE_NEW_INTENT_SERVICE=false
```

## Migration Status

| Service | Flag | Status |
|---------|------|---------|
| intent-service | USE_NEW_INTENT_SERVICE | PENDING |
| copilot | USE_NEW_COPILOT | PENDING |
| decision-service | USE_NEW_DECISION_SERVICE | PENDING |
| ad-platform | USE_NEW_AD_PLATFORM | PENDING |

## Rollback

```bash
# Instant rollback
export USE_NEW_INTENT_SERVICE=false
```
