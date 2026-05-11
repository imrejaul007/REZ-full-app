# Network Security - Source of Truth

## Overview
This document defines the network security requirements for the ReZ platform.

## TLS/SSL Configuration

### Requirements
- TLS 1.2 minimum, TLS 1.3 preferred
- Modern cipher suites only
- Strong certificate management
- HSTS enabled with max-age of 1 year

### Approved Ciphers
```
ECDHE-ECDSA-AES128-GCM-SHA256
ECDHE-RSA-AES128-GCM-SHA256
ECDHE-ECDSA-AES256-GCM-SHA384
ECDHE-RSA-AES256-GCM-SHA384
```

### Configuration Files
- `monitoring/nginx/security.conf` - Main TLS configuration
- `monitoring/nginx/api-gateway-security.conf` - API gateway security

## Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | SAMEORIGIN | Clickjacking protection |
| X-Content-Type-Options | nosniff | MIME type sniffing prevention |
| X-XSS-Protection | 1; mode=block | XSS filter (legacy browsers) |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Force HTTPS |
| Content-Security-Policy | default-src 'self' | Content injection prevention |

## API Gateway Security

### Rate Limiting
- Global limit: 10 requests/second per IP
- Burst allowance: 20 requests
- Zone size: 10MB

### IP Whitelisting
Internal networks allowed for admin routes:
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16 (development only)

## Kubernetes Network Policies

### API Gateway Policy
- Ingress: Only from frontend pods on port 3000
- Egress: Database (5432), Cache (6379), Internal services

### Default Deny
All pods default to deny-all ingress/egress unless explicitly allowed.

## Monitoring

### Log Retention
- Access logs: 90 days
- Security logs: 1 year
- Audit logs: 7 years

### Alert Thresholds
- Failed auth attempts: 10/minute
- Rate limit hits: 100/minute
- TLS errors: 5/minute

## Compliance
- PCI DSS (if handling payments)
- SOC 2 Type II
- GDPR data protection

## Review Schedule
- Security configs: Quarterly
- Certificate rotation: Annual
- Pen testing: Annual
