# ReZ Platform Go-Live Checklist

> **Document Version:** 1.0.0
> **Last Updated:** 2026-05-04
> **Owner:** Engineering Team
> **Status:** Active

This checklist ensures a controlled, safe production deployment. Complete all items before proceeding to the next phase.

---

## 1. Pre-Launch Checklist (50 Items)

Complete all items at least 7 days before the target launch date.

### 1.1 Infrastructure & Environment

- [ ] **1.** Production environment is provisioned and matches staging configuration
- [ ] **2.** All servers/instances are patched with latest security updates
- [ ] **3.** Load balancers configured with correct health checks
- [ ] **4.** Auto-scaling policies defined and tested
- [ ] **5.** CDN configured and caching rules verified
- [ ] **6.** DNS records updated and propagated
- [ ] **7.** SSL/TLS certificates installed and auto-renewal configured
- [ ] **8.** Database read replicas provisioned for high availability
- [ ] **9.** Database connection pooling configured (PgBouncer/Redis Pool)
- [ ] **10.** Backup jobs scheduled and tested (full + incremental)

### 1.2 Code & Build

- [ ] **11.** All feature branches merged to main
- [ ] **12.** Code freeze implemented (no new features to main)
- [ ] **13.** Latest production build successful with zero errors
- [ ] **14.** Build artifacts signed and checksummed
- [ ] **15.** Docker images tagged with semantic version and immutable
- [ ] **16.** Helm charts/manifests updated with production values
- [ ] **17.** Environment variables documented and secured in vault
- [ ] **18.** Feature flags configured for gradual rollout
- [ ] **19.** Feature flags have kill switches for all major features
- [ ] **20.** A/B testing framework configured and ready

### 1.3 Security & Compliance

- [ ] **21.** Security audit completed with no critical/high findings
- [ ] **22.** Penetration testing performed and signed off
- [ ] **23.** API rate limiting configured
- [ ] **24.** WAF rules configured and in blocking mode
- [ ] **25.** CSP headers implemented
- [ ] **26.** GDPR/CCPA compliance verified
- [ ] **27.** Data retention policies enforced
- [ ] **28.** Audit logging enabled for all sensitive operations
- [ ] **29.** Secret rotation credentials prepared
- [ ] **30.** MFA enforced for all admin accounts

### 1.4 Database & Data

- [ ] **31.** Database migrations tested in staging (zero downtime preferred)
- [ ] **32.** Seed data loaded for production
- [ ] **33.** Index optimization performed
- [ ] **34.** Query performance benchmarks within SLA
- [ ] **35.** Data integrity checks passed
- [ ] **36.** GDPR right-to-erasure procedures tested
- [ ] **37.** Data encryption at rest verified
- [ ] **38.** Data encryption in transit verified
- [ ] **39.** Sensitive data redaction configured for logs
- [ ] **40.** Database monitoring alerts configured

### 1.5 Monitoring & Observability

- [ ] **41.** Application Performance Monitoring (APM) deployed
- [ ] **42.** Distributed tracing enabled
- [ ] **43.** Log aggregation configured (ELK/Datadog/Splunk)
- [ ] **44.** Metrics dashboard created for key KPIs
- [ ] **45.** Alert thresholds set with PagerDuty/OpsGenie integration
- [ ] **46.** Uptime monitoring configured
- [ ] **47.** Error tracking (Sentry/Bugsnag) configured
- [ ] **48.** Synthetic monitoring scripts created
- [ ] **49.** Health check endpoints verified
- [ ] **50.** Runbook documentation created for all alerts

### 1.6 Documentation Sign-off

| Item | Owner | Status | Date |
|------|-------|--------|------|
| API Documentation | | [ ] | |
| Deployment Guide | | [ ] | |
| Incident Response Playbook | | [ ] | |
| User Documentation | | [ ] | |
| Architecture Diagram | | [ ] | |

---

## 2. Go-Live Day Checklist

Execute this checklist on launch day, starting 4 hours before the deployment window.

### 2.1 Pre-Deployment (T-4:00)

- [ ] **1.** All pre-launch items marked complete
- [ ] **2.** Go/No-Go meeting held with stakeholders
- [ ] **3.** Deployment window confirmed
- [ ] **4.** Rollback plan reviewed and ready
- [ ] **5.** Emergency contacts notified and on standby
- [ ] **6.** Slack/Teams channel created for deployment updates

### 2.2 Environment Freeze (T-3:00)

- [ ] **7.** Maintenance page deployed to CDN
- [ ] **8.** Database read-only mode enabled (if required)
- [ ] **9.** Scheduled jobs paused
- [ ] **10.** Inbound webhooks paused
- [ ] **11.** All admins notified maintenance window

### 2.3 Deployment Execution (T-2:00)

- [ ] **12.** Final backup completed and verified
- [ ] **13.** Database migrations executed
- [ ] **14.** New application version deployed (canary: 5%)
- [ ] **15.** Canary health checks passing
- [ ] **16.** Canary error rates within acceptable threshold
- [ ] **17.** Canary latency within SLA
- [ ] **18.** Gradual rollout to 25%
- [ ] **19.** Smoke tests executed
- [ ] **20.** Gradual rollout to 50%
- [ ] **21.** Integration tests executed
- [ ] **22.** Gradual rollout to 100%

### 2.4 Post-Deployment Verification (T+0)

- [ ] **23.** All instances healthy and serving traffic
- [ ] **24.** Zero critical errors in error tracker
- [ ] **25.** Database connections stable
- [ ] **26.** Cache hit rates normal
- [ ] **27.** CDN cache warmed
- [ ] **28.** All feature flags in correct state
- [ ] **29.** Maintenance page removed
- [ ] **30.** Scheduled jobs resumed
- [ ] **31.** Webhooks resumed

### 2.5 Stakeholder Communication (T+30min)

- [ ] **32.** Deployment success notification sent
- [ ] **33.** Marketing team notified for social media
- [ ] **34.** Customer support briefed on new features
- [ ] **35.** Status page updated to green

---

## 3. Post-Launch Monitoring Checklist

Monitor these metrics for 72 hours after launch.

### 3.1 Critical Metrics (Every 15 min for first 4 hours)

| Metric | Threshold | Current |
|--------|-----------|---------|
| Error Rate | < 0.1% | |
| P99 Latency | < 500ms | |
| P95 Latency | < 200ms | |
| CPU Usage | < 80% | |
| Memory Usage | < 85% | |
| Disk Usage | < 75% | |
| Database Connections | < 80% pool | |
| API Success Rate | > 99.9% | |

### 3.2 Business Metrics (Hourly for 72 hours)

- [ ] **1.** User login rate within expected range
- [ ] **2.** Key user flows completing successfully
- [ ] **3.** Revenue metrics stable
- [ ] **4.** Conversion rates within expected variance
- [ ] **5.** Support ticket volume within baseline

### 3.3 Technical Health (Every 30 min for 72 hours)

- [ ] **6.** All health checks passing
- [ ] **7.** No new error patterns identified
- [ ] **8.** No memory leaks detected
- [ ] **9.** No connection leaks detected
- [ ] **10.** Log volume within expected range
- [ ] **11.** Backup jobs completing successfully
- [ ] **12.** CDN cache hit ratio normal
- [ ] **13.** External API dependencies healthy
- [ ] **14.** SSL certificate expiration monitored
- [ ] **15.** Security events within baseline

### 3.4 Extended Monitoring (Days 4-7)

- [ ] **16.** Performance regression analysis completed
- [ ] **17.** User feedback collected and triaged
- [ ] **18.** Post-mortem meeting scheduled
- [ ] **19.** Lessons learned documented
- [ ] **20.** Checklist updated for future releases

---

## 4. Rollback Procedure

### 4.1 When to Rollback

Execute rollback immediately if ANY of the following occur:

| Condition | Threshold | Auto-Rollback |
|----------|-----------|---------------|
| Error Rate | > 5% | Yes |
| P99 Latency | > 2000ms for 5min | Yes |
| Database Down | Any | Yes |
| Security Incident | Any | Manual |
| Revenue Impact | > 10% drop | Manual |

### 4.2 Rollback Steps

#### Step 1: Initiate Rollback (T+0)
```bash
# Stop incoming traffic to new version
kubectl scale deployment rez-app --replicas=0 -n production

# OR use feature flag to disable new version
./scripts/feature-flag.sh disable REZ_V2
```

#### Step 2: Restore Previous Version (T+1)
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/rez-app -n production

# Verify rollback
kubectl rollout status deployment/rez-app -n production
```

#### Step 3: Database Rollback (if migrations applied)
```bash
# Check if rollback migration exists
ls -la migrations/rollback/

# Execute rollback migration (if safe)
migrate -path migrations -database $DATABASE_URL down 1

# Verify data integrity
./scripts/verify-data-integrity.sh
```

#### Step 4: Verify Restoration (T+2)
- [ ] Previous version serving traffic
- [ ] Error rates normal
- [ ] Latency within SLA
- [ ] Database operations normal
- [ ] Key user flows working

#### Step 5: Communicate (T+3)
- [ ] Incident declared in PagerDuty
- [ ] Stakeholders notified
- [ ] Status page updated
- [ ] Support team briefed

### 4.3 Post-Rollback Actions

| Action | Owner | Priority |
|--------|-------|----------|
| Root cause analysis | Engineering | P0 |
| Fix implementation | Engineering | P0 |
| Testing in staging | QA | P1 |
| Next deployment window | Release Manager | P1 |
| Stakeholder update | PM | P1 |

---

## 5. Emergency Contacts

### 5.1 Primary Team

| Role | Name | Phone | Slack | Email |
|------|------|-------|-------|-------|
| Engineering Lead | | | @ | @company.com |
| DevOps Lead | | | @ | @company.com |
| Database Admin | | | @ | @company.com |
| Security Lead | | | @ | @company.com |
| Product Manager | | | @ | @company.com |

### 5.2 On-Call Rotation

| Week | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| Week 1 | @ | @ | @ |
| Week 2 | @ | @ | @ |
| Week 3 | @ | @ | @ |
| Week 4 | @ | @ | @ |

### 5.3 External Contacts

| Service | Contact | Phone | Support ID |
|---------|---------|-------|------------|
| AWS/Azure/GCP | Vendor Support | | |
| Database (MongoDB/Postgres) | Vendor Support | | |
| CDN Provider | Vendor Support | | |
| Monitoring (Datadog/New Relic) | Vendor Support | | |
| Payment Processor | Vendor Support | | |
| SSL Certificate Provider | Vendor Support | | |

### 5.4 Escalation Matrix

```
P0 (Site Down) -> Engineering Lead -> CTO -> CEO
P1 (Major Feature Down) -> Engineering Lead -> VP Engineering
P2 (Minor Feature Down) -> On-Call Engineer -> Engineering Lead
P3 (Non-Critical) -> Jira Ticket -> Next Sprint
```

---

## Appendix A: Quick Commands

### Deployment Commands
```bash
# Canary deploy
kubectl set image deployment/rez-app app=$IMAGE_TAG -n production

# Scale deployment
kubectl scale deployment rez-app --replicas=10 -n production

# Check pod status
kubectl get pods -n production -l app=rez-app

# View logs
kubectl logs -f deployment/rez-app -n production
```

### Database Commands
```bash
# Connect to production database (requires VPN)
psql $DATABASE_URL

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check replication lag
SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;
```

### Monitoring Commands
```bash
# Check error rate in Datadog
# Go to: Metrics -> Explore -> Search "error.rate"

# Check latency
# Go to: APM -> Services -> rez-app -> Traces
```

---

## Appendix B: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-05-04 | Claude | Initial creation |

---

## Appendix C: Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | | | |
| DevOps Lead | | | |
| Product Manager | | | |
| Security Lead | | | |
| QA Lead | | | |
| CTO | | | |

---

*This document is the single source of truth for ReZ platform go-live procedures. Update before each major release.*
