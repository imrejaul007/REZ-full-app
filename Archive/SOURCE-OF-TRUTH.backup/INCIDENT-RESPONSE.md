# Incident Response Plan

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|--------------|
| P0 | Data breach, service down | 15 minutes |
| P1 | Security vulnerability | 1 hour |
| P2 | Suspicious activity | 4 hours |
| P3 | Minor issue | 24 hours |

## Response Steps

1. **Detect** - Alert triggered
2. **Contain** - Isolate affected systems
3. **Eradicate** - Remove threat
4. **Recover** - Restore services
5. **Document** - Post-mortem

## Incident Contacts

| Role | Contact |
|------|---------|
| Security Lead | security@example.com |
| On-call Engineer | oncall@example.com |
| CTO | cto@example.com |

## Runbooks

### P0 - Data Breach
1. Immediately isolate affected systems
2. Notify security team via Slack #security-incidents
3. Begin forensic collection
4. Contact legal if customer data involved
5. Prepare breach notification

### P1 - Security Vulnerability
1. Assess scope and impact
2. Deploy emergency patch within 1 hour
3. If patch unavailable, implement compensating controls
4. Notify affected teams
5. Schedule full post-mortem

### P2 - Suspicious Activity
1. Investigate alert accuracy
2. Collect relevant logs
3. Escalate if confirmed malicious
4. Document findings

### P3 - Minor Issue
1. Log issue in tracking system
2. Assign to appropriate team
3. Resolve within 24 hours
