# COMPLETE AUDIT - ALL SERVICES

**Date:** May 7, 2026

## INSIDE PLATFORMS

### REZ AI Platform (5 services)
| Service | Purpose |
|---------|---------|
| support-copilot | AI chat |
| push-service | Notifications |
| personalization-engine | User preferences |
| recommendation-engine | ML recommendations |
| targeting-engine | Ad targeting |
| observability | Monitoring |

### REZ Core Events (8 services)
| Service | Purpose |
|---------|---------|
| event-platform | Event ingestion |
| action-engine | Decision execution |
| feedback-service | Learning |
| first-loop | Orchestration |
| intent-graph | AI brain |
| intelligence-hub | Profiles |
| user-intelligence | User data |
| merchant-intelligence | Merchant data |

### REZ Marketing Backend (6 services)
| Service | Purpose |
|---------|----------|
| marketing-service | Campaigns |
| ads-service | Ad management |
| lead-intelligence | Lead scoring |
| abandonment-tracker | Cart recovery |
| decision-service | RDE decisions |
| unified-messaging | Multi-channel messaging |

### REZ Utilities (4 services)
| Service | Purpose |
|---------|----------|
| automation | Rules engine |
| scheduler | Job scheduling |
| insights | Analytics |
| worker | Background jobs |

## OUTSIDE - NEEDS MERGE

| Service | Inside? | Merge Into |
|---------|----------|-----------|
| REZ-support-copilot | YES (AI Platform) | Duplicate |
| rez-intelligence-hub | YES (Core Events) | Duplicate |
| rez-user-intelligence | YES (Core Events) | Duplicate |
| rez-merchant-intelligence | YES (Core Events) | Duplicate |
| rez-lead-intelligence | YES (Marketing) | Duplicate |
| rez-ad-campaigns | NO | Keep separate |
| rez-ml-engine | NO | Keep separate |
| rez-model-registry | NO | Keep separate |
| REZ-MIND-CLIENT | NO | Keep as SDK |
| rez-error-intelligence | NO | Keep separate |

## ACTION

DUPLICATES = Archive old repos after merge
