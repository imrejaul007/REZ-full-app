# Security Deployment Checklist

## Pre-Deployment
- [ ] All secrets rotated in last 90 days
- [ ] Dependencies scanned for vulnerabilities
- [ ] CORS policy reviewed and approved
- [ ] Rate limits configured
- [ ] IP whitelist updated with current IPs

## Authentication & Authorization
- [ ] JWT secret minimum 256 bits
- [ ] Token expiration set correctly
- [ ] RBAC roles defined
- [ ] Admin endpoints protected

## Network Security
- [ ] TLS 1.3 enabled
- [ ] Firewalls configured
- [ ] Internal services not exposed
- [ ] Ports minimized

## Data Protection
- [ ] Encryption at rest enabled
- [ ] PII handling documented
- [ ] Logs sanitized
- [ ] Backup encryption verified

## Monitoring
- [ ] Audit logging enabled
- [ ] Alerts configured
- [ ] Log aggregation working
- [ ] Anomaly detection active

## Compliance
- [ ] SOC 2 controls met
- [ ] Data retention policy applied
- [ ] Access reviews scheduled
- [ ] Incident response plan ready
