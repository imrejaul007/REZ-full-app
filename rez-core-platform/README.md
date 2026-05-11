# REZ Core Platform

Unified platform containing all REZ core services.

## Services

| Service | Port | Purpose |
|---------|------|---------|
| event-platform | 4008 | Event ingestion & routing |
| action-engine | 4009 | Decision execution |
| feedback-service | 4010 | Learning loop |
| first-loop | - | Agent orchestration |
| intent-graph | 3001 | AI brain |
| intelligence-hub | 4020 | User profiles |
| user-intelligence | 3004 | User behavior |
| merchant-intelligence | 4012 | Merchant profiles |

## Deployment

Each service deploys independently via Render.

## Ports

Services run on different internal ports to avoid conflicts.
