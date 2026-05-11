# REZ ECOSYSTEM - FINAL UNIFIED IMPLEMENTATION PLAN

**Date:** 2026-04-30
**Status:** COMPLETE - Ready for Implementation
**Source Documents:** 6 comprehensive audits + Phase 0 completion report

---

## EXECUTIVE SUMMARY

### Total Issues: 290 (De-duplicated)

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 49 | Must fix immediately |
| HIGH | 74 | Fix within 2 weeks |
| MEDIUM | 104 | Fix within 1 month |
| LOW | 63 | Fix within 3 months |

### Phases: 5

| Phase | Weeks | Focus | Issues |
|-------|-------|-------|--------|
| Phase 1 | 1-2 | Critical Foundation | 49 CRITICAL |
| Phase 2 | 3-4 | Core Integrations | 34 HIGH |
| Phase 3 | 5-6 | Business Logic | 40 HIGH |
| Phase 4 | 7-8 | Polish | 104 MEDIUM |
| Phase 5 | 9-12 | Scale | 63 LOW |

### Timeline: 12 Weeks (~3 Months)

---

## ISSUE TRACKER TABLE

### CRITICAL Issues (Priority 1)

| ID | Category | Issue | Dependency | Fix |
|----|----------|-------|------------|-----|
| C-01 | Finance | AML functions stubbed (return hardcoded values) | None | Implement real velocity/roundtrip checks |
| C-02 | Security | Razorpay webhook not verified | None | Add webhook signature verification |
| C-03 | Security | Stripe webhook not verified | None | Add webhook signature verification |
| C-04 | Security | MongoDB AUTH not enforced | None | Enable authentication on all DBs |
| C-05 | Gamification | Coin minting uncapped (no max issuance) | None | Add coin governor with limits |
| C-06 | Gamification | No anti-fraud detection (GPS spoofing, collusion) | None | Implement photo verification, anomaly detection |
| C-07 | Security | Secrets in git history | None | Rotate all exposed secrets |
| C-08 | Scheduler | Worker concurrency = 1 (serial bottleneck) | None | Increase to configurable pool size |
| C-09 | Error Intelligence | Empty error knowledge base | None | Configure Sentry alerts, capture errors |
| C-10 | Architecture | Hotel Admin not unified with REZ Admin | C-04 | Create integration bridge |
| C-11 | Architecture | No Event Bus (Kafka/Redis Streams) | None | Set up central event backbone |
| C-12 | ReZ Mind | intent-capture-sdk not connected | C-11 | Wire SDK through event bus |
| C-13 | ReZ Mind | Dangerous mode lacks audit trail | None | Add logging for all dangerous operations |
| C-14 | Finance | BNPL systems not synced (2 separate systems) | C-01 | Implement BNPL reconciliation |
| C-15 | Integration | Hotel OTA not connected to REZ Order | C-10 | Bridge service |
| C-16 | Integration | Hotel OTA not connected to REZ Payment | C-10 | Bridge service |
| C-17 | Integration | CorpPerks Admin separate from REZ Admin | C-10 | Merge into unified admin |
| C-18 | Database | Duplicate schemas (packages/shared-types nested) | None | Consolidate to single source |
| C-19 | Infrastructure | rez-now/package.json git conflicts | None | Resolve merge conflicts |
| C-20 | Infrastructure | rez-api-gateway missing package.json | None | Create or remove directory |
| C-21 | Security | Redis AUTH not enforced | C-04 | Enable authentication |
| C-22 | Auth | OTP brute force possible (no rate limit) | None | Add rate limiting on /auth/otp |
| C-23 | Auth | No rate limit on /auth/otp endpoint | C-22 | Implement throttling |
| C-24 | Gamification | gamification-service /internal/visit no auth | None | Add requireInternalToken |
| C-25 | Gamification | gamification-service /internal/dlq no auth | C-24 | Add requireInternalToken |
| C-26 | Finance | Webhook not idempotent | C-02, C-03 | Add idempotency keys |
| C-27 | Payment | No retry mechanism for webhooks | C-26 | Implement exponential backoff |
| C-28 | Scheduler | No job timeout enforcement | C-08 | Add timeout to all job types |
| C-29 | Scheduler | No DLQ monitoring | C-28 | Set up alerting for failed jobs |
| C-30 | Search | Hotel search separate from commerce search | C-11 | Unify search infrastructure |
| C-31 | Database | Missing indexes (performance risk) | None | Add critical indexes |
| C-32 | Architecture | Port inconsistencies across services | None | Standardize to defined ports |
| C-33 | Package | Mixed @rez/shared vs file:../ paths | None | Standardize all imports |
| C-34 | Package | Wrong package name (rez-workspace vs scheduler) | None | Fix package.json names |
| C-35 | Package | Folder typo (marchant vs merchant) | None | Rename directories |
| C-36 | Infrastructure | No security CI pipeline | None | Add GitHub Actions security scan |
| C-37 | Infrastructure | Health checks inconsistent | None | Standardize health endpoints |
| C-38 | Infrastructure | Docker not optimized (multi-stage) | None | Improve Dockerfiles |
| C-39 | Security | Hardcoded localhost URLs | None | Use environment variables |
| C-40 | ReZ Mind | No OpenAI integration (env var unused) | C-12 | Wire OpenAI to ReZ Mind |
| C-41 | Integration | makcorps (hotel booking) undocumented | C-15 | Document integration |
| C-42 | Marketing | No webhook verification | C-02, C-03 | Add signature verification |
| C-43 | CorpPerks | HRIS webhooks not verified | C-42 | Add webhook verification |
| C-44 | Analytics | Only 1 service with tracing | C-09 | Add OTEL to all services |
| C-45 | Error Intelligence | Wrong runbook docs (RestoPapa vs ReZ) | None | Update documentation |
| C-46 | Error Intelligence | No circuit breakers configured | None | Implement circuit breakers |
| C-47 | Error Intelligence | No Slack/PagerDuty alerts | C-09 | Configure alerting channels |
| C-48 | Database | Schema conflicts (multiple definitions) | C-18 | Consolidate schemas |
| C-49 | Database | No schema versioning | C-48 | Implement version control |

---

### HIGH Priority Issues (Priority 2)

| ID | Category | Issue | Dependency |
|----|----------|-------|------------|
| H-01 | Gamification | Challenge/Tournament not implemented | C-05 |
| H-02 | Gamification | No rate limiting on karma actions | C-22 |
| H-03 | Gamification | Achievement rollback missing | C-05 |
| H-04 | Gamification | Achievements hardcoded (requires deploy) | None |
| H-05 | Gamification | City/cause leaderboard incomplete | None |
| H-06 | Gamification | CSR pool exhaustion risk | C-05 |
| H-07 | Gamification | Micro-action karma farming possible | H-02 |
| H-08 | Gamification | Self-payment coin farming | C-06 |
| H-09 | Marketing | Voucher CRUD incomplete | None |
| H-10 | Marketing | Offer stacking not implemented | None |
| H-11 | Marketing | Attribution tracking weak | C-11 |
| H-12 | Marketing | Template versioning missing | None |
| H-13 | Search | No dedicated search engine (MongoDB text only) | None |
| H-14 | Search | Limited facets (only price, category) | H-13 |
| H-15 | Search | No personalization in search results | C-12 |
| H-16 | Finance | Interest rates hardcoded (no env config) | None |
| H-17 | Finance | BNPL interest calculation issues | C-14 |
| H-18 | Scheduler | DLQ not centralized (each service separate) | C-29 |
| H-19 | Scheduler | Redis pub/sub HA not configured | C-21 |
| H-20 | Scheduler | Socket scaling not documented | None |
| H-21 | Error Intelligence | No distributed tracing | C-44 |
| H-22 | Error Intelligence | Cannot correlate errors across services | H-21 |
| H-23 | Integration | RestoPapa standalone (not integrated) | C-10 |
| H-24 | Integration | AdBazaar separate admin | C-17 |
| H-25 | Integration | NextaBiZ separate admin | C-17 |
| H-26 | Architecture | intent-capture-sdk unused | C-12 |
| H-27 | Architecture | Monorepo package stale (0.1.0 vs 0.2.0) | None |
| H-28 | Mobile | Bundle ID mismatch (money.rez.app) | None |
| H-29 | Mobile | @karim legacy shared reference | C-33 |
| H-30 | Mobile | No offline mode | None |
| H-31 | Mobile | WebSocket reconnection not implemented | None |
| H-32 | Mobile | Deep linking not documented | None |
| H-33 | Package | zod: 7 different versions | None |
| H-34 | Package | mongoose: 4 different versions | None |
| H-35 | Package | express: 6 different versions | None |
| H-36 | Package | bullmq: 4 different versions | None |
| H-37 | Package | Orphan packages not imported | None |
| H-38 | Database | Variable name inconsistencies | C-39 |
| H-39 | Hotel | Real-time rate sync missing | C-15 |
| H-40 | Hotel | Inventory conflict resolution not handled | C-15 |
| H-41 | Hotel | PMS separate deploy | C-10 |
| H-42 | ReZ Mind | ReZ Mind not receiving events consistently | C-11 |
| H-43 | Order | State transitions need validation | None |
| H-44 | Order | TOTP recovery codes not implemented | None |
| H-45 | Order | Merchant approval workflow audit needed | None |
| H-46 | Analytics | Prometheus metrics inconsistent | C-37 |
| H-47 | Analytics | No circuit breaker observability | C-46 |
| H-48 | Infrastructure | Dependency audit CI missing | C-36 |
| H-49 | Infrastructure | Test coverage limited | None |
| H-50 | Infrastructure | GitHub Actions CI partial | None |
| H-51 | Payment | Payment state machine gaps | None |
| H-52 | Payment | Hardcoded test URLs in source | C-39 |
| H-53 | Auth | OTEL endpoint hardcoded | C-39 |
| H-54 | Auth | Test URLs hardcoded in payment tests | C-39 |
| H-55 | CorpPerks | makcorps integration undocumented | C-41 |
| H-56 | CorpPerks | Webhook verification missing | C-43 |
| H-57 | Integration | Hotel OTA admin separate | C-10 |
| H-58 | Integration | Hotel OTA PMS not unified | C-41 |
| H-59 | Search | No fuzzy matching in hotel search | H-13 |
| H-60 | Search | Hotel search results ranking weak | H-13 |
| H-61 | Finance | Double-entry reconciliation gaps | None |
| H-62 | Finance | Lost coins edge cases | None |
| H-63 | Finance | Bank detail encryption key rotation | None |
| H-64 | Gamification | Streak manipulation risk (mitigated) | C-06 |
| H-65 | Marketing | WhatsApp template approval workflow | None |
| H-66 | Marketing | SMS sender ID inconsistencies | None |
| H-67 | Scheduler | BullMQ connection pooling issues | C-08 |
| H-68 | Scheduler | Job retry logic inconsistent | None |
| H-69 | Error Intelligence | Sentry SDK inconsistent versions | None |
| H-70 | Error Intelligence | No error knowledge base UI | C-09 |
| H-71 | Package | @karim4987498/shared legacy | C-29 |
| H-72 | Package | file:../ references fragile | C-33 |
| H-73 | Package | Nested duplicates (shared-types) | C-18 |
| H-74 | Package | Empty nested directories | None |

---

## PHASE 1: Week 1-2 (Critical Foundation)

### What We're Fixing

**Primary Focus:** Security vulnerabilities, broken infrastructure, and data integrity issues that pose immediate risk.

| Category | Issues | IDs |
|----------|--------|-----|
| Security | Webhook verification, AUTH enforcement, secrets rotation | C-02, C-03, C-04, C-07, C-21, C-22, C-23 |
| Infrastructure | Git conflicts, missing files, port standardization | C-19, C-20, C-32, C-34, C-35 |
| Finance | AML functions, BNPL sync | C-01, C-14 |
| Scheduler | Worker concurrency, job timeouts | C-08, C-28 |

### Why In This Order

1. **Security first** - Payment fraud and database exposure are existential risks
2. **Infrastructure before integration** - Cannot build on broken foundations
3. **Finance critical path** - AML compliance is regulatory requirement
4. **Scheduler affects all** - Serial processing is bottleneck for everything else

### Dependencies

```
None - All Phase 1 issues are independent
```

### Success Criteria

- [ ] Razorpay/Stripe webhooks verified with signature validation
- [ ] MongoDB and Redis AUTH enforced on all services
- [ ] All secrets rotated (no exposed credentials in git)
- [ ] Git conflicts resolved, no broken package.json files
- [ ] Worker concurrency increased to 10+ (configurable)
- [ ] AML functions return real analysis (not hardcoded)
- [ ] No hardcoded URLs (all use env vars)

### Time Estimate

| Task | Hours | Owner |
|------|-------|-------|
| Webhook verification (Razorpay) | 8 | Payment team |
| Webhook verification (Stripe) | 8 | Payment team |
| MongoDB/Redis AUTH | 4 | DevOps |
| Secrets rotation | 6 | DevOps |
| Git conflict resolution | 4 | All teams |
| Port standardization | 8 | All teams |
| AML implementation | 12 | Finance team |
| Scheduler concurrency fix | 6 | Backend team |
| **Total** | **56 hours** | **~2 weeks** |

---

## PHASE 2: Week 3-4 (Core Integrations)

### What We're Fixing

**Primary Focus:** Event backbone and Hotel integration - the two critical architectural gaps.

| Category | Issues | IDs |
|----------|--------|-----|
| Architecture | Event Bus setup | C-11 |
| Integration | Hotel OTA bridges | C-10, C-15, C-16, C-57 |
| Integration | CorpPerks unification | C-17, C-24 |
| ReZ Mind | Intent SDK connection | C-12, C-26, C-42 |
| Gamification | Anti-fraud detection | C-06, C-08 |

### Why In This Order

1. **Event Bus is prerequisite** - All other integrations depend on it
2. **Hotel is largest gap** - Revenue impact significant
3. **ReZ Mind unlocks AI** - Enables all intelligent features
4. **Anti-fraud protects economy** - Coin system cannot be gamed

### Dependencies

```
Phase 1 completion (all security fixes must be done)
```

### Success Criteria

- [ ] Event Bus operational with 50+ event types defined
- [ ] ReZ Mind receiving 100% of commerce events
- [ ] Hotel integration service deployed
- [ ] OTA ↔ REZ Order connection working
- [ ] OTA ↔ REZ Payment connection working
- [ ] CorpPerks under unified admin
- [ ] GPS spoofing detection active
- [ ] Collusion detection implemented

### Time Estimate

| Task | Hours | Owner |
|------|-------|-------|
| Event Bus implementation | 24 | Backend team |
| Hotel integration service | 40 | Hotel team |
| CorpPerks unification | 16 | CorpPerks team |
| ReZ Mind wiring | 24 | AI team |
| Anti-fraud implementation | 32 | Security team |
| **Total** | **136 hours** | **~2 weeks** |

---

## PHASE 3: Week 5-6 (Business Logic)

### What We're Fixing

**Primary Focus:** Complete gamification system and marketing capabilities.

| Category | Issues | IDs |
|----------|--------|-----|
| Gamification | Challenge/Tournament system | H-01, H-03, H-04, H-05 |
| Gamification | Coin caps and rate limiting | C-05, H-02, H-06, H-07, H-08 |
| Marketing | Voucher CRUD and offer stacking | H-09, H-10, H-11, H-12 |
| Search | Dedicated search engine | H-13, H-14, H-15 |
| Auth | TOTP recovery codes | H-44 |
| Database | Schema consolidation | C-18, C-48, C-49 |

### Why In This Order

1. **Gamification drives engagement** - Core value proposition
2. **Marketing enables growth** - Revenue generation
3. **Search improves UX** - Discovery and conversion
4. **Database foundation** - Prevents future conflicts

### Dependencies

```
Phase 1 + Phase 2 completion
Event Bus must be operational
```

### Success Criteria

- [ ] Challenge/Tournament UI and backend complete
- [ ] Achievement system configurable (DB-based)
- [ ] Leaderboards working (global, city, cause, weekly)
- [ ] Coin minting capped with governor
- [ ] Karma rate limiting active
- [ ] Voucher CRUD fully functional
- [ ] Offer stacking rules implemented
- [ ] Elasticsearch/Meilisearch deployed
- [ ] Personalized search results
- [ ] Schema consolidated to single source

### Time Estimate

| Task | Hours | Owner |
|------|-------|-------|
| Challenge system | 40 | Gamification team |
| Achievement DB config | 16 | Backend team |
| Leaderboard completion | 24 | Backend team |
| Coin governor | 12 | Finance team |
| Voucher CRUD | 20 | Marketing team |
| Offer stacking | 24 | Marketing team |
| Search engine | 32 | Search team |
| Schema consolidation | 16 | All teams |
| **Total** | **184 hours** | **~2 weeks** |

---

## PHASE 4: Week 7-8 (Polish)

### What We're Fixing

**Primary Focus:** Error intelligence, observability, and mobile polish.

| Category | Issues | IDs |
|----------|--------|-----|
| Error Intelligence | Full tracing and alerting | C-09, C-44, C-45, C-46, C-47, H-21, H-22, H-69, H-70 |
| Infrastructure | Health checks and CI | C-36, C-37, H-48, H-49, H-50 |
| Mobile | Offline mode and reconnect | H-30, H-31, H-32 |
| Package | Version alignment | H-33, H-34, H-35, H-36 |
| Database | Indexes and optimization | C-31, H-38 |
| Integration | RestoPapa decision | H-23 |

### Why In This Order

1. **Observability enables maintenance** - Cannot manage what you cannot see
2. **Mobile is customer-facing** - Polish directly impacts retention
3. **Packages affect stability** - Version conflicts cause runtime errors
4. **Database performance** - Affects all operations

### Dependencies

```
Phase 1 + 2 + 3 completion
All services must be stable
```

### Success Criteria

- [ ] Distributed tracing on all services
- [ ] Circuit breakers implemented
- [ ] Slack/PagerDuty alerting active
- [ ] Error knowledge base populated
- [ ] Health checks standardized
- [ ] Security CI pipeline active
- [ ] Mobile offline mode working
- [ ] WebSocket auto-reconnect
- [ ] All package versions aligned
- [ ] Critical indexes added
- [ ] RestoPapa integration decision made

### Time Estimate

| Task | Hours | Owner |
|------|-------|-------|
| Distributed tracing | 24 | Platform team |
| Circuit breakers | 16 | Backend team |
| Alerting setup | 12 | DevOps team |
| Health check standardization | 8 | All teams |
| Security CI | 16 | DevOps team |
| Mobile offline mode | 32 | Mobile team |
| Package alignment | 16 | All teams |
| Database indexes | 16 | DBA team |
| **Total** | **140 hours** | **~2 weeks** |

---

## PHASE 5: Week 9-12 (Scale)

### What We're Fixing

**Primary Focus:** Long-term maintainability and advanced features.

| Category | Issues | IDs |
|----------|--------|-----|
| New Service | rez-insights-service (Copilot) | Implementation Plan |
| New Service | rez-automation-service | Implementation Plan |
| New Service | supplier-performance-service | Implementation Plan |
| Search | Fuzzy matching and ranking | H-59, H-60 |
| Finance | Advanced reconciliation | H-61, H-62, H-63 |
| Marketing | Template versioning | H-12 |
| Hotel | Real-time rate sync | H-39, H-40 |
| CorpPerks | HRIS integration polish | H-55, H-56 |
| Cleanup | Orphan packages | H-37, H-74 |
| Documentation | All runbooks updated | C-45 |

### Why In This Order

1. **Insights service enables Copilot** - Major value-add
2. **Automation reduces manual work** - Scale operations
3. **Polish remaining issues** - Technical debt reduction

### Dependencies

```
Phase 1 + 2 + 3 + 4 completion
Event Bus must be battle-tested
```

### Success Criteria

- [ ] rez-insights-service deployed
- [ ] Copilot dashboard in BizOS
- [ ] rez-automation-service deployed
- [ ] Supplier performance tracking
- [ ] Fuzzy search working
- [ ] Advanced reconciliation complete
- [ ] Template versioning active
- [ ] Real-time hotel rate sync
- [ ] All orphan packages removed or documented
- [ ] All runbooks updated

### Time Estimate

| Task | Hours | Owner |
|------|-------|-------|
| rez-insights-service | 48 | AI team |
| Copilot UI | 40 | Frontend team |
| rez-automation-service | 40 | Backend team |
| Supplier performance | 32 | Procurement team |
| Fuzzy search | 24 | Search team |
| Advanced reconciliation | 24 | Finance team |
| Template versioning | 16 | Marketing team |
| Hotel rate sync | 24 | Hotel team |
| Cleanup | 16 | All teams |
| **Total** | **264 hours** | **~4 weeks** |

---

## RISK ASSESSMENT

### High Risk Items

| Item | Risk | Mitigation |
|------|------|------------|
| MongoDB AUTH migration | Data loss if credentials wrong | Test on staging first, backup before |
| Webhook signature change | Payment failures | Canary deployment, rollback plan |
| Event Bus cutover | Event loss | Dual-write during transition |
| Hotel integration | Revenue impact | Parallel run for 2 weeks |
| Schema consolidation | Breaking changes | Versioned API, backward compat |

### Medium Risk Items

| Item | Risk | Mitigation |
|------|------|------------|
| Coin economy changes | User trust | Transparent communication |
| Search engine migration | Search quality dip | A/B testing |
| Anti-fraud false positives | User complaints | Gradual rollout, manual review |

### Low Risk Items

| Item | Risk | Mitigation |
|------|------|------------|
| Package version alignment | Dependency conflicts | Test thoroughly |
| Health check changes | False alarms | Monitor closely |

---

## RESOURCE ESTIMATE

### By Phase

| Phase | Hours | Team Size |
|-------|-------|-----------|
| Phase 1 | 56 | 4 |
| Phase 2 | 136 | 6 |
| Phase 3 | 184 | 6 |
| Phase 4 | 140 | 5 |
| Phase 5 | 264 | 5 |
| **Total** | **780 hours** | **~20 person-weeks** |

### By Team

| Team | Hours | Focus |
|------|-------|-------|
| Backend | 240 | Services, integrations, APIs |
| Security | 80 | Webhooks, AUTH, anti-fraud |
| Frontend | 80 | UI, Copilot, mobile |
| AI/ML | 120 | ReZ Mind, insights, automation |
| DevOps | 80 | Infrastructure, CI/CD, observability |
| Database | 60 | Schemas, indexes, optimization |
| Hotel | 80 | Integration, PMS bridge |
| Marketing | 60 | Vouchers, offers, campaigns |
| Finance | 60 | AML, reconciliation, BNPL |
| **Total** | **860 hours** | |

### Notes

- Some tasks overlap teams
- Week 1-2 can run in parallel with 4 developers
- Week 3-4 requires 6 developers for Hotel integration
- Phase 5 has longest tasks but most flexibility

---

## DEPENDENCY GRAPH

```
Phase 1 (Parallel - No Dependencies)
├── Security: Webhooks, AUTH, Secrets
├── Infrastructure: Git conflicts, Ports
├── Finance: AML functions
└── Scheduler: Concurrency

Phase 2 (Depends on Phase 1)
├── Event Bus ─────────────────────────────────────────────────┐
│    │                                                      │
│    ├── ReZ Mind Wiring ───────────────────────┐            │
│    │    │                                    │            │
│    │    └── Phase 3: Gamification             │            │
│    │         ├── Challenge/Tournament         │            │
│    │         ├── Leaderboards               │            │
│    │         └── Achievement Config          │            │
│    │                                           │            │
│    │    Phase 3: Marketing                    │            │
│    │         ├── Voucher CRUD                │            │
│    │         └── Offer Stacking              │            │
│    │                                           │            │
│    │    Phase 3: Search                       │            │
│    │         └── Elasticsearch               │            │
│    │                                           │            │
│    │    Phase 5: Insights Service ────────────┘            │
│    │         └── Copilot UI                        │
│    │                                               │
│    └── Hotel Integration ───────────────────┐    │
│         │                                 │    │
│         ├── Phase 2: CorpPerks             │    │
│         │     └── Unified Admin           │    │
│         │                                 │    │
│         ├── Phase 4: Error Intelligence    │    │
│         │     └── Tracing, Alerts         │    │
│         │                                 │    │
│         └── Phase 5: Hotel Polish          │    │
│               └── Real-time rates         │    │
│                                           │    │
└───────────────────────────────────────────┘    │
                                                    │
Phase 4: Polish ────────────────────────────────────┘
├── Mobile: Offline, Reconnect
├── Infrastructure: CI/CD, Health
└── Packages: Version Alignment
```

---

## SUCCESS METRICS

### Phase 1

- [ ] Zero payment fraud incidents
- [ ] Zero database breaches
- [ ] Scheduler throughput 10x improvement
- [ ] No exposed secrets in git

### Phase 2

- [ ] Event latency < 100ms
- [ ] ReZ Mind receiving 100% of events
- [ ] Hotel bookings syncing < 5s
- [ ] Zero coin farming incidents

### Phase 3

- [ ] Challenge participation > 1000 users/week
- [ ] Offer stacking conversion lift > 10%
- [ ] Search relevance score > 0.8

### Phase 4

- [ ] MTTR < 15 minutes
- [ ] Error detection < 5 minutes
- [ ] Mobile offline coverage > 80%

### Phase 5

- [ ] Copilot active merchants > 100
- [ ] Automation rules executed > 10000/week
- [ ] Supplier suggestions accepted > 20%

---

## DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-30 | Initial unified plan |

---

**Plan Status:** READY FOR IMPLEMENTATION
**Total Issues:** 290
**Timeline:** 12 weeks
**Total Effort:** ~860 hours
