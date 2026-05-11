# REZ Platform Disaster Recovery Plan

**Document Version:** 1.0
**Last Updated:** May 4, 2026
**Status:** APPROVED
**Owner:** Infrastructure Team Lead
**Review Cycle:** Quarterly

---

## Executive Summary

This document outlines the comprehensive disaster recovery strategy for the REZ platform. It defines backup schedules, recovery objectives, failover procedures, and communication protocols to ensure business continuity in the event of a disaster.

---

## 1. Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

### 1.1 Target Metrics

| Service Tier | RTO | RPO | Priority |
|--------------|-----|-----|----------|
| **Critical (Core Platform)** | 15 minutes | 5 minutes | P0 |
| **High (User Data, Auth)** | 30 minutes | 15 minutes | P1 |
| **Medium (Analytics, Reports)** | 2 hours | 1 hour | P2 |
| **Low (Logs, Archives)** | 24 hours | 24 hours | P3 |

### 1.2 Definitions

- **RTO (Recovery Time Objective):** Maximum acceptable time to restore service after a disaster
- **RPO (Recovery Point Objective):** Maximum acceptable data loss measured in time

### 1.3 Technology Stack Coverage

| Component | Backup Frequency | Retention | Storage Location |
|-----------|-----------------|-----------|------------------|
| PostgreSQL (Primary DB) | Continuous replication + 4-hourly snapshots | 30 days | AWS RDS + S3 Cross-Region |
| MongoDB | Hourly Oplog + Daily full backup | 30 days | MongoDB Atlas + S3 |
| Redis (Session/Cache) | N/A (ephemeral) | N/A | N/A |
| S3 Data Lake | Real-time replication | 90 days | S3 Cross-Region + Glacier |
| File Storage | Nightly incremental | 30 days | S3 + Glacier |
| Kubernetes Config | On-change (GitOps) | Indefinite | GitHub |
| Secrets/Keys | On-change | 30 days | AWS Secrets Manager |

---

## 2. Backup Strategy

### 2.1 Daily Backup Schedule

| Time (UTC) | Task | Duration | Verification |
|------------|------|----------|--------------|
| 00:00 | PostgreSQL full backup | 30-45 min | SHA256 checksum |
| 01:00 | MongoDB incremental backup | 15-20 min | Backup size validation |
| 02:00 | S3 incremental sync | Variable | Object count reconciliation |
| 03:00 | Kubernetes manifests export | 5 min | Schema validation |
| 04:00 | Secrets rotation check | 2 min | Last rotation timestamp |

### 2.2 Weekly Backup Schedule

| Day | Time (UTC) | Task | Retention |
|-----|------------|------|-----------|
| Sunday | 00:00 | Full PostgreSQL backup | 12 weeks |
| Sunday | 02:00 | Full MongoDB backup | 12 weeks |
| Sunday | 04:00 | Cross-region replication verify | N/A |
| Wednesday | 00:00 | Database consistency check | 4 weeks |

### 2.3 Monthly Backup Schedule

| Day | Time (UTC) | Task | Retention |
|-----|------------|------|-----------|
| 1st Sunday | 00:00 | Yearly archive snapshot | 7 years |
| 2nd Sunday | 00:00 | Disaster recovery drill | N/A |
| 3rd Sunday | 00:00 | Backup integrity deep scan | N/A |

### 2.4 Backup Verification Process

```
1. Backup Completion → Trigger automated verification
2. Checksum Validation → Verify SHA256 match
3. Restore Test → Spin up temporary instance
4. Data Integrity Check → Run consistency queries
5. Performance Benchmark → Compare to baseline
6. Alert on Failure → PagerDuty escalation
```

---

## 3. Failover Procedures

### 3.1 Automatic Failover Triggers

| Condition | Threshold | Action | Grace Period |
|-----------|-----------|--------|--------------|
| Primary DB unreachable | 30 seconds | Auto-failover to replica | N/A |
| Health check failure | 3 consecutive | Restart + alert | 60 seconds |
| Disk usage critical | 90% capacity | Alert + scale | 15 minutes |
| Memory exhaustion | 95% OOM | Pod restart | N/A |
| Network partition | 60 seconds | Isolate + alert | N/A |

### 3.2 Manual Failover Procedure (Level 2)

**Pre-requisites:**
- P0 incident declared
- Incident Commander assigned
- Change control waiver obtained

**Steps:**

1. **Assessment (0-5 minutes)**
   ```
   - Verify primary is truly unreachable
   - Check monitoring dashboards
   - Identify scope of impact
   - Confirm no ongoing deployments
   ```

2. **Preparation (5-10 minutes)**
   ```
   - Enable maintenance mode
   - Notify stakeholders via Slack #incidents
   - Create incident ticket in Jira
   - Verify replica health and lag
   ```

3. **Execution (10-20 minutes)**
   ```
   - Promote PostgreSQL replica to primary
   - Update connection strings in AWS Secrets Manager
   - Restart affected Kubernetes pods
   - Verify application connectivity
   - Clear Redis cache (if needed)
   ```

4. **Validation (20-30 minutes)**
   ```
   - Run smoke tests against critical paths
   - Verify data integrity
   - Check replication lag on old primary
   - Monitor error rates
   ```

5. **Communication (Ongoing)**
   ```
   - Update status page every 15 minutes
   - Notify customer success team
   - Document timeline in incident ticket
   ```

### 3.3 Region Failover Procedure (Level 3 - Catastrophic)

**Trigger:** Primary region becomes unavailable for >2 hours

**Target Region:** us-west-2 (backup) → us-east-1 (warm standby)

**Steps:**

1. **Activate DR Region**
   ```
   - Spin up EKS clusters in us-east-1
   - Restore latest verified backups
   - Update DNS in Route53
   - Enable read replicas
   ```

2. **Database Promotion**
   ```
   - Promote us-east-1 PostgreSQL replica
   - Verify replication slot
   - Switch application connection strings
   ```

3. **Service Validation**
   ```
   - Deploy all microservices
   - Run full integration test suite
   - Enable write operations
   ```

---

## 4. Data Recovery Steps

### 4.1 Point-in-Time Recovery (PITR)

**Use when:** Data corruption, accidental deletion, or need to recover to specific timestamp

**Steps:**

1. Identify target recovery point (timestamp)
2. Stop application writes
3. Create snapshot of current state
4. Restore from base backup to target timestamp
5. Verify recovered data
6. Replay WAL to exact point
7. Validate application consistency
8. Resume operations

**Estimated Time:** 30 minutes to 4 hours depending on data volume

### 4.2 Full Database Recovery

**Use when:** Complete database failure requiring full restore

**Steps:**

1. Provision new database instance
2. Initiate full backup restore
3. Wait for restore completion
4. Verify data integrity
5. Update connection configuration
6. Redirect application traffic
7. Monitor for anomalies

**Estimated Time:** 1-4 hours depending on data volume

### 4.3 Object Storage Recovery

**Use when:** S3 bucket deletion, corruption, or encryption key loss

**Steps:**

1. Verify Glacier vault exists
2. Initiate restore from Glacier
3. Wait for restore (3-12 hours for standard)
4. Verify object integrity
5. Replicate to new bucket
6. Update application references
7. Enable versioning

### 4.4 Recovery Verification Checklist

- [ ] All critical tables accessible
- [ ] Row counts match expected values
- [ ] Foreign key relationships intact
- [ ] Indexes rebuilt
- [ ] User permissions restored
- [ ] Application can authenticate
- [ ] Transactions can complete
- [ ] Reports generate correctly
- [ ] No data corruption alerts
- [ ] Performance within SLA

---

## 5. Communication Plan

### 5.1 Incident Classification

| Severity | Definition | Response Time | Communication |
|----------|------------|---------------|---------------|
| **SEV1** | Complete service outage | 5 minutes | Immediate + every 15 min |
| **SEV2** | Major feature unavailable | 15 minutes | 30 minutes + hourly |
| **SEV3** | Minor feature degraded | 1 hour | Every 4 hours |
| **SEV4** | Cosmetic/non-critical | Next business day | Daily summary |

### 5.2 Communication Channels

| Audience | Channel | Timing |
|----------|---------|--------|
| Engineering Team | Slack #incidents | Immediate |
| On-call Engineers | PagerDuty | Immediate |
| Executive Team | Email + Slack #exec | 15 minutes |
| All-hands | Slack #company | 30 minutes |
| Customers | status.rez.com | 15 minutes |
| External Partners | Direct email | 30 minutes |

### 5.3 Status Page Updates

**Template:**

```
[RESOLVED] Service Degradation - {Date}
Time: {Start} - {End} UTC
Duration: {X hours Y minutes}
Affected: {Service names}
Summary: {What happened and resolution}
```

### 5.4 Customer Communication Templates

**Initial (within 15 minutes):**
```
We are currently investigating an issue affecting {service}.
Our team is actively working on a resolution.
Next update in 30 minutes.
```

**Update (every 30 minutes):**
```
Status: Investigating/Identified/Recovering
Impact: {Scope}
Next update: {Time}
```

**Resolution:**
```
This incident has been resolved.
Duration: {Time}
Affected: {Services}
Post-mortem will be available within 5 business days.
```

---

## 6. Contact List

### 6.1 Primary On-Call Rotation

| Role | Primary | Backup | Escalation |
|------|---------|--------|---------------|
| **Incident Commander** | {NAME} | {PHONE} | {MANAGER} |
| **Database Lead** | {NAME} | {PHONE} | {MANAGER} |
| **Platform Lead** | {NAME} | {PHONE} | {MANAGER} |
| **Security Lead** | {NAME} | {PHONE} | {MANAGER} |
| **Customer Success** | {NAME} | {PHONE} | {MANAGER} |

### 6.2 External Contacts

| Service | Contact | Phone | Account # |
|---------|---------|-------|-----------|
| AWS Support | TAM | {NUMBER} | {ACCOUNT_ID} |
| MongoDB Atlas | CSM | {NUMBER} | {ORG_ID} |
| CloudFlare | TAM | {NUMBER} | {ZONE_ID} |
| PagerDuty | Support | {EMAIL} | {ORG_KEY} |

### 6.3 Escalation Path

```
Level 1: On-call Engineer (5 min response)
    ↓ No response / P0 incident
Level 2: Engineering Manager (15 min response)
    ↓ No resolution / 30 min
Level 3: VP Engineering (30 min response)
    ↓ Critical business impact
Level 4: CTO / CEO (1 hour response)
```

---

## 7. Testing Schedule

### 7.1 Testing Frequency

| Test Type | Frequency | Participants | Duration |
|-----------|-----------|-------------|----------|
| **Tabletop Exercise** | Quarterly | On-call + Leadership | 2 hours |
| **Backup Verification** | Weekly | DevOps | 1 hour |
| **Partial Failover** | Monthly | DevOps + Eng | 4 hours |
| **Full DR Drill** | Quarterly | All hands | 8 hours |
| **Chaos Engineering** | Bi-weekly | Platform Team | 2 hours |

### 7.2 Tabletop Exercise Scenario

**Q1 Scenario:** Complete database failure with data corruption

```
Timeline:
- 09:00 - Scenario briefing
- 09:15 - Team split into response groups
- 09:30 - Walk through detection & assessment
- 10:00 - Walk through communication
- 10:30 - Walk through recovery procedures
- 11:00 - Identify gaps & improvements
- 11:30 - Document action items
- 12:00 - Complete
```

### 7.3 Full DR Drill Procedure

**Pre-drill Requirements:**
- 2 weeks notice to all teams
- Maintenance window approved
- Rollback plan documented
- Staging environment prepared

**Drill Timeline:**

| Time | Activity | Success Criteria |
|------|----------|-------------------|
| 00:00 | Begin drill | Isolation verified |
| 00:30 | Backup verification | All backups accessible |
| 01:00 | Infrastructure spin-up | All services green |
| 02:00 | Database restore | PITR successful |
| 03:00 | Application deployment | 100% deployment |
| 04:00 | Data validation | Integrity checks pass |
| 05:00 | Traffic switch | 100% routed to DR |
| 06:00 | Performance validation | Within SLA |
| 07:00 | Traffic switch back | Primary restored |
| 08:00 | Post-mortem | Action items captured |

### 7.4 Test Documentation

All tests must produce:
- Date and participants
- Scenario description
- Timeline of actions
- Issues encountered
- Recovery time achieved
- Gaps identified
- Recommendations
- Sign-off from Incident Commander

---

## 8. Appendices

### Appendix A: Runbooks

| Scenario | Runbook Link |
|----------|--------------|
| Database failover | `/runbooks/db-failover.md` |
| S3 data recovery | `/runbooks/s3-recovery.md` |
| Kubernetes cluster failure | `/runbooks/k8s-failure.md` |
| DDoS attack | `/runbooks/ddos-response.md` |
| Data breach | `/runbooks/breach-response.md` |

### Appendix B: Infrastructure URLs

| Resource | URL |
|----------|-----|
| AWS Console | https://console.aws.amazon.com |
| MongoDB Atlas | https://cloud.mongodb.com |
| Datadog | https://app.datadoghq.com |
| PagerDuty | https://rez.pagerduty.com |
| Status Page | https://status.rez.com |
| Runbooks | https://wiki.rez.com/runbooks |

### Appendix C: Key Metrics Dashboard

- Backup Success Rate: >99.5%
- Average Recovery Time: <RTO
- Data Loss: <RPO
- Test Completion: 100% quarterly
- Post-mortem Turnaround: 5 business days

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 4, 2026 | Infrastructure Team | Initial version |

**Review Schedule:** This document is reviewed quarterly and updated as needed.

**Approved By:** {CTO_NAME}
**Date:** {APPROVAL_DATE}
