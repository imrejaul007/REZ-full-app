# PHASE 0: MAKE EVERYTHING READY
## Before Building - Fix What We Have

**Goal:** Production-ready ecosystem before any new services
**Timeline:** 2-3 weeks
**Priority:** CRITICAL

---

## 0.1 FIX CRITICAL ISSUES (Week 1)

### 0.1.1 Git Conflict Markers
| Service | File | Action |
|---------|------|--------|
| `rez-auth-service` | `package.json` | Resolve conflicts |
| `rez-order-service` | `package.json` | Resolve conflicts |
| `rez-gamification-service` | `package.json` | Resolve conflicts |

### 0.1.2 Package Issues
| Issue | Location | Fix |
|-------|----------|-----|
| Wrong name | `rez-scheduler-service/package.json` | Change "rez-workspace" → "rez-scheduler-service" |
| Missing source | `packages/rez-service-core/` | Restore or recreate source |
| Missing source | `packages/rez-ui/` | Restore or recreate source |
| Typo | `rez-app-marchant/` | Rename to `rez-app-merchant/` |

### 0.1.3 Security Basics
| Task | Impact | Priority |
|------|--------|----------|
| Enable MongoDB AUTH | CRITICAL | Week 1 |
| Enable Redis AUTH | CRITICAL | Week 1 |
| Rotate exposed credentials | HIGH | Week 1 |

---

## 0.2 PRODUCTION-READY AUDIT (Week 1-2)

### 0.2.1 Service Health Check
For each service, verify:
- [ ] Starts without errors
- [ ] Health endpoint responds
- [ ] Connects to MongoDB
- [ ] Connects to Redis
- [ ] Environment variables validated
- [ ] Graceful shutdown works

### 0.2.2 Dependency Audit
| Task | Purpose |
|------|---------|
| Audit all @types/* in dependencies | Move to devDependencies |
| Audit duplicate dependencies | Remove duplicates |
| Audit version mismatches | Align versions |
| Audit unused dependencies | Remove bloat |

### 0.2.3 TypeScript Audit
| Task | Purpose |
|------|---------|
| Check strict mode enabled | Catch errors early |
| Audit `any` type usage | Replace with proper types |
| Audit missing types | Add type definitions |
| Audit inconsistent interfaces | Unify across services |

---

## 0.3 CODE QUALITY FIXES (Week 2)

### 0.3.1 Error Handling
| Task | Scope |
|------|-------|
| Add try/catch to all async handlers | All services |
| Add error middleware | All services |
| Add Sentry to services missing it | CorpPerks services |
| Add logging to all entry points | All services |

### 0.3.2 API Consistency
| Task | Scope |
|------|-------|
| Standardize error response format | All services |
| Add rate limiting | Services missing it |
| Add request validation | All endpoints |
| Add CORS validation | All services |

### 0.3.3 Observability
| Task | Scope |
|------|-------|
| Add Prometheus metrics | Services missing it |
| Add health endpoints | All services |
| Add structured logging | All services |
| Add request IDs | All services |

---

## 0.4 DOCUMENTATION (Week 2)

### 0.4.1 README Files
Create README.md for each service with:
- Purpose
- Environment variables
- API endpoints
- Local setup
- Deployment

### 0.4.2 API Documentation
| Task | Service |
|------|---------|
| Add OpenAPI/Swagger | Core services |
| Create Postman collections | Core services |
| Document event schemas | All services |

---

## 0.5 PACKAGE CLEANUP (Week 2)

### 0.5.1 Remove Duplicates
| Task | Action |
|------|--------|
| Remove nested packages | `packages/shared-types/packages/*` |
| Remove archives | `archives/` |
| Unify shared-types | Single source |

### 0.5.2 Fix Package Names
| Current | Target |
|---------|--------|
| `@imrejaul007/rez-service-core` | `@rez/service-core` |
| `@rez/chat` (from rez-chat-service) | Consistent naming |
| All packages | `@rez/*` scope |

---

## 0.6 DATABASE READINESS (Week 2-3)

### 0.6.1 MongoDB
| Task | Purpose |
|------|---------|
| Enable AUTH | Security |
| Add connection pooling | Performance |
| Add indexes | Performance |
| Create migration scripts | Consistency |

### 0.6.2 Redis
| Task | Purpose |
|------|---------|
| Enable AUTH | Security |
| Configure persistence | Reliability |
| Set up replication | HA (future) |

---

## 0.7 TESTING FRAMEWORK (Week 3)

### 0.7.1 Unit Tests
| Task | Coverage Target |
|------|---------------|
| Add Jest/unit tests | Core services |
| Add type tests | Shared packages |
| Add integration tests | Critical paths |

### 0.7.2 CI/CD
| Task | Purpose |
|------|---------|
| Add GitHub Actions | Automated testing |
| Add lint checks | Code quality |
| Add type checks | Catch errors |

---

## PHASE 0 CHECKLIST

Before Phase 1, ALL must be ✅:

### Code Quality
- [ ] Git conflicts resolved
- [ ] Package names fixed
- [ ] No `any` type in critical paths
- [ ] Error handling consistent

### Security
- [ ] MongoDB AUTH enabled
- [ ] Redis AUTH enabled
- [ ] Credentials rotated
- [ ] Rate limiting on all endpoints

### Observability
- [ ] Health endpoints on all services
- [ ] Prometheus metrics on all services
- [ ] Structured logging
- [ ] Request tracing

### Documentation
- [ ] README on all services
- [ ] API docs for core services
- [ ] Environment variable docs

### Testing
- [ ] Unit tests on core services
- [ ] CI/CD pipeline working
- [ ] Type checks passing

---

## AGENT ASSIGNMENTS (8 Agents)

### Agent 1: CRITICAL FIXES
- Fix git conflicts in 3 services
- Fix package.json name
- Rename folder

### Agent 2: SECURITY
- Enable MongoDB AUTH
- Enable Redis AUTH
- Audit and fix security issues

### Agent 3: PACKAGE AUDIT
- Fix package names
- Remove duplicates
- Unify shared-types

### Agent 4: CODE QUALITY
- Fix error handling
- Add missing try/catch
- Add error middleware

### Agent 5: OBSERVABILITY
- Add health endpoints
- Add Prometheus metrics
- Add structured logging

### Agent 6: DOCUMENTATION
- Create README files
- Add API docs
- Document env vars

### Agent 7: TESTING
- Set up Jest
- Write unit tests
- Set up CI/CD

### Agent 8: DEPENDENCY AUDIT
- Move @types to devDependencies
- Remove duplicates
- Align versions

---

## SUCCESS CRITERIA

Phase 0 is complete when:

1. **Zero critical issues** in audit
2. **All services start** without errors
3. **Health endpoints respond** on all services
4. **MongoDB AUTH enabled** across all services
5. **Redis AUTH enabled** across all services
6. **README exists** for every service
7. **Unit tests pass** on CI
8. **Type checks pass** on CI

---

**Estimated Time:** 2-3 weeks with 8 agents working in parallel
