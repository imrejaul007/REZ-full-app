# REZ Platform - Launch Ready Checklist

Version: 1.0.0 | Updated: 2026-05-01

---

## Architecture State

```
All services exist ✅
All services connected via contracts ✅
Core flow active ✅
Advanced features behind flags ✅
```

---

## Phase 1 Checklist (Internal/Hidden)

### Core Flows
- [x] Event → Decision works
- [x] Decision → Feedback works
- [x] Feedback → Intelligence works
- [x] Correlation IDs trace full journey
- [x] No silent failures

### Safety System
- [x] SAFE → auto allowed
- [x] SEMI_SAFE → suggest only
- [x] RISKY → blocked
- [x] Hard caps (quantity, value)
- [x] Rollback switch ready

### Feature Flags
- [ ] Learning → OFF (default)
- [ ] Adaptive → OFF (default)
- [ ] Ads → OFF (default)
- [ ] Personalization → ON
- [ ] Push → ON

---

## Phase 2 Checklist (Controlled Users)

### Data Contracts
- [x] Event schema defined
- [x] Decision schema defined
- [x] Feedback schema defined
- [x] User profile schema defined
- [x] Merchant profile schema defined

### Observability
- [x] Event logs
- [x] Decision logs
- [x] Feedback logs
- [x] Audit trail
- [x] Correlation ID tracing

### Manual Override
- [ ] Merchant can override suggestions
- [ ] User not forced into personalization
- [ ] Ads not forced aggressively

---

## Phase 3 Checklist (Progressive Activation)

### Intelligence Hub
- [ ] Single source of truth
- [ ] All updates go through hub
- [ ] Read-only access for others

### Testing
- [ ] 200-300 merchant decisions tested
- [ ] 100-200 user journeys tested
- [ ] "This makes sense" feeling
- [ ] Failure scenarios tested

### Feature Flags
- [ ] learning_on/off
- [ ] adaptive_on/off
- [ ] ads_on/off
- [ ] personalization_on/off

---

## Failure Scenarios Tested

- [ ] Event platform down
- [ ] Action engine timeout
- [ ] Feedback missing
- [ ] Duplicate events
- [ ] Invalid data

---

## Services Status

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Event Platform | 4008 | Running | Event ingestion |
| Action Engine | 4009 | Running | Decisions |
| Feedback Service | 4010 | Running | Learning |
| User Intelligence | 3004 | Ready | User profiles |
| Merchant Intelligence | 4012 | Ready | Merchant profiles |
| Intent Predictor | 4018 | Ready | Intent |
| Intelligence Hub | 4020 | Ready | Unified profiles |
| Ad Copilot | 4021 | Ready | Ads |
| Merchant Copilot | 4022 | Ready | Insights |
| Targeting Engine | 3003 | Ready | Campaigns |
| Recommendation Engine | 3001 | Ready | Recs |
| Personalization Engine | 4017 | Ready | Ranking |
| Push Service | 4013 | Ready | Notifications |
| Feature Flags | 4030 | Ready | Flags |
| Observability | 4031 | Ready | Logs |
| Ops Dashboard | 4032 | Ready | Admin |

---

## Default Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| learning_enabled | OFF | Machine learning |
| adaptive_enabled | OFF | Adaptive decisions |
| personalization_enabled | ON | Personalized content |
| recommendations_enabled | ON | Product recommendations |
| intent_prediction_enabled | ON | Real-time intent |
| ads_enabled | OFF | Targeted ads |
| push_enabled | ON | Push notifications |
| auto_execute_safe | ON | Auto-execute SAFE |
| rollback_enabled | ON | Auto-rollback |

---

## Safety Thresholds

```javascript
RISKY: confidence < 0.7 OR decisions < 5
SEMI_SAFE: confidence >= 0.7 AND decisions >= 5
SAFE: confidence >= 0.9 AND approval_rate >= 0.8 AND decisions >= 10
```

---

## Rollback Triggers

```javascript
check_window: 50 decisions
min_decisions: 30
max_acceptable_drop: 5%
auto_disable: false (manual control)
```

---

## Launch Phases

### Phase 1: Internal (NOW)
- Merchant Copilot → ON
- Learning → OFF
- Ads → OFF
- Personalization → BASIC

### Phase 2: Controlled (5-20 merchants)
- Small user set
- Still safe mode
- Monitor closely

### Phase 3: Progressive
- Learning → ON (slowly)
- Personalization → FULL
- Ads → TARGETED

---

## Quick Commands

```bash
# Disable learning
curl -X POST http://localhost:4030/flags/learning_enabled/disable

# Enable shadow mode
curl -X POST http://localhost:4030/flags/adaptive_enabled/disable
curl -X POST http://localhost:4030/flags/learning_enabled/disable

# Full safe mode
curl -X POST http://localhost:4030/flags/ads_enabled/disable
curl -X POST http://localhost:4030/flags/adaptive_enabled/disable
```

---

Last updated: 2026-05-01
