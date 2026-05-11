# Architecture Decision Record

## ADR-001: Communication Layers

### Context
We have three communication patterns: Redis, BullMQ, Socket.IO.

### Decision
Use Redis for caching only.
Use BullMQ for async jobs.
Use Socket.IO for real-time.

### Consequences
- Clear separation of concerns
- Easier debugging
- Better performance

---

## ADR-002: ML Models Location

### Context
Multiple services have ML models.

### Decision
Consolidate in intent-service.

### Consequences
- Single place for ML
- Shared model improvements
- Easier A/B testing
