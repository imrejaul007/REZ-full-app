# Service Security Policy

## Authentication
- All services must use JWT authentication
- Tokens expire after 1 hour
- Refresh tokens expire after 7 days

## Authorization
- Role-based access control (RBAC)
- Least privilege principle

## Data Protection
- TLS 1.3 required
- Sensitive data encrypted at rest
- PII masked in logs
