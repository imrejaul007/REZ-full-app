# ReZ Ecosystem - Security Documentation

**Last Updated:** 2026-05-01
**Purpose:** Security hardening checklist and best practices

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [Security Checklist](#security-checklist)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Protection](#data-protection)
5. [Network Security](#network-security)
6. [Secrets Management](#secrets-management)
7. [Monitoring & Alerts](#monitoring--alerts)

---

## Critical Issues

### 🚨 CRITICAL - Must Fix Immediately

| # | Issue | Status | Fix Required |
|---|-------|--------|--------------|
| 1 | MongoDB AUTH not enabled | ❌ Not Fixed | Enable authentication on all MongoDB instances |
| 2 | Redis AUTH not enabled | ❌ Not Fixed | Enable password authentication on all Redis instances |
| 3 | Hardcoded secrets in docker-compose | ❌ Not Fixed | Remove secrets, use environment variables |
| 4 | Credentials not rotated | ❌ Not Fixed | Rotate all API keys, JWT secrets, database passwords |

### 🚨 HIGH - Fix Within 1 Week

| # | Issue | Status | Fix Required |
|---|-------|--------|--------------|
| 5 | No HashiCorp Vault | ❌ Not Implemented | Implement centralized secrets management |
| 6 | No network policies | ❌ Not Implemented | Add Kubernetes network policies |
| 7 | No container vulnerability scanning | ❌ Not Implemented | Add Trivy/CLAIR to CI pipeline |

---

## Security Checklist

### Authentication & Authorization

- [ ] Rate limiting on all API endpoints
- [ ] Fail-fast startup (env vars required)
- [ ] RBAC middleware implemented
- [ ] CORS explicit domains
- [ ] Security headers configured
- [ ] [ ] JWT token validation
- [ ] [ ] Internal service token authentication
- [ ] [ ] OAuth2 provider validation
- [ ] [ ] API key validation for partners

### Data Protection

- [ ] [ ] MongoDB authentication enabled
- [ ] [ ] Redis authentication enabled
- [ ] [ ] Database credentials rotated
- [ ] [ ] Encryption at rest (MongoDB)
- [ ] [ ] Encryption in transit (TLS)
- [ ] [ ] Sensitive data encrypted (bank details, etc.)
- [ ] [ ] No secrets in code/repository
- [ ] [ ] Environment variables for secrets

### Network Security

- [ ] [ ] Cloudflare WAF configured
- [ ] [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] [ ] CORS restricted to known origins
- [ ] [ ] API rate limiting
- [ ] [ ] DDoS protection
- [ ] [ ] IP allowlisting for admin endpoints

### Monitoring & Alerts

- [ ] [ ] Prometheus metrics enabled
- [ ] [ ] Grafana dashboards configured
- [ ] [ ] Alert rules for security events
- [ ] [ ] Failed login alerts
- [ ] [ ] Rate limit breach alerts
- [ ] [ ] Error spike alerts
- [ ] [ ] Sentry error tracking

---

## Authentication & Authorization

### JWT Token Structure

```typescript
interface JWTPayload {
  sub: string;           // User ID
  role: 'user' | 'merchant' | 'admin';
  iat: number;          // Issued at
  exp: number;          // Expiration
  iss: string;          // Issuer
  aud: string;          // Audience
}
```

### Service-to-Service Authentication

**Scoped Tokens (Recommended):**
```typescript
// Environment variable
INTERNAL_SERVICE_TOKENS_JSON = {
  "rez-auth-service": "token-abc123",
  "rez-wallet-service": "token-def456",
  "rez-payment-service": "token-ghi789"
};

// Request headers
{
  "x-internal-token": "token-abc123",
  "x-internal-service": "rez-order-service"
}
```

**Validation Middleware:**
```typescript
// From @rez/shared
import { internalServiceAuth } from '@rez/shared/middleware';

app.use('/internal/*', internalServiceAuth({
  tokens: process.env.INTERNAL_SERVICE_TOKENS_JSON,
  allowedServices: ['rez-auth-service', 'rez-wallet-service']
}));
```

### OAuth2 Partner Integration

**Partner Registration:**
```typescript
// In rez-auth-service
{
  client_id: 'adbazaar',
  client_secret: 'hashed-secret',
  redirect_uris: ['https://adbazaar.vercel.app'],
  scopes: ['profile', 'wallet:read']
}
```

**Token Exchange:**
```bash
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<auth-code>
&client_id=adbazaar
&client_secret=<secret>
&redirect_uri=https://adbazaar.vercel.app
```

---

## Data Protection

### Database Authentication

**MongoDB:**
```bash
# Enable auth in mongod.conf
security:
  authorization: enabled

# Create user
db.createUser({
  user: "rez_service",
  pwd: "<secure-password>",
  roles: [
    { role: "readWrite", db: "rez_auth" },
    { role: "readWrite", db: "rez_wallet" }
  ]
});

# Connection string
MONGODB_URI=mongodb://rez_service:<password>@mongo-host:27017/rez_auth?authSource=admin
```

**Redis:**
```bash
# Enable AUTH in redis.conf
requirepass <secure-password>

# Connection string
REDIS_URL=redis://:<password>@redis-host:6379
```

### Encryption

**Bank Details Encryption (Merchant Service):**
```typescript
import crypto from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

function encryptBankDetails(data: BankDetails): string {
  return crypto.AES.encrypt(
    JSON.stringify(data),
    ENCRYPTION_KEY
  ).toString();
}

function decryptBankDetails(encrypted: string): BankDetails {
  const bytes = crypto.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(crypto.enc.Utf8));
}
```

### Secrets Management

**Current State:**
```bash
# ❌ DON'T - Hardcoded secrets
JWT_SECRET=my-secret-key
RAZORPAY_KEY_SECRET=rzp_live_xxx

# ✅ DO - Environment variables
JWT_SECRET=${JWT_SECRET}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
```

**Recommended: HashiCorp Vault**
```bash
# Install Vault
vault server -dev

# Store secrets
vault kv put secret/rez \
  jwt_secret=xxx \
  razorpay_key_secret=xxx \
  mongodb_password=xxx

# Access in application
vault kv get -field=jwt_secret secret/rez
```

---

## Network Security

### Cloudflare WAF

**Location:** `/cloudflare/waf-workers/api-gateway/`

**Security Headers:**
```nginx
# From nginx.conf
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### Rate Limiting

**API Gateway Zones:**
| Zone | Limit | Purpose |
|------|-------|---------|
| `api_limit` | 50r/s | Global API |
| `auth_limit` | 100r/m | Auth endpoints |
| `merchant_limit` | 100r/s | Per-merchant |
| `pos_limit` | 30r/s | POS/billing |

**Implementation:**
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});
```

### CORS Configuration

```typescript
const corsOptions = {
  origin: [
    'https://rez.money',
    'https://www.rez.money',
    'https://rezapp.in',
    'https://admin.rez.money',
    'https://merchant.rez.money',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-token'],
};

app.use(cors(corsOptions));
```

---

## Monitoring & Alerts

### Prometheus Alert Rules

**Auth Service Alerts:**
```yaml
groups:
  - name: auth-service
    rules:
      - alert: OTPFailureSpike
        expr: rate(auth_otp_failures_total[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "OTP failure spike detected"
          
      - alert: TokenValidationFailures
        expr: rate(auth_token_validation_failures_total[5m]) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "JWT validation failures detected"
```

**Security Alerts:**
```yaml
  - alert: BruteForceAttack
    expr: rate(auth_login_failures_total[5m]) > 20
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Possible brute force attack"
      runbook_url: "https://docs.rez.money/runbooks/brute-force"
```

### Sentry Integration

**Error Tracking:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend: (event) => {
    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers['x-api-key'];
    }
    return event;
  },
});
```

---

## Compliance Checklist

### OWASP Top 10

| # | Category | Status | Implementation |
|---|----------|--------|----------------|
| 1 | Broken Access Control | ⚠️ Partial | RBAC middleware exists |
| 2 | Cryptographic Failures | ❌ Not Fixed | MongoDB/Redis AUTH not enabled |
| 3 | Injection | ✅ Fixed | Zod validation, parameterized queries |
| 4 | Insecure Design | ⚠️ Partial | Architecture review needed |
| 5 | Security Misconfiguration | ⚠️ Partial | Security headers configured |
| 6 | Vulnerable Components | ⚠️ Partial | Dependencies audited |
| 7 | Auth Failures | ✅ Fixed | JWT, OTP, TOTP implemented |
| 8 | Data Integrity Failures | ✅ Fixed | Webhook signature verification |
| 9 | Logging Failures | ⚠️ Partial | Winston logging configured |
| 10 | SSRF | ⚠️ Partial | Input validation exists |

### PCI DSS (Payment Handling)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Firewall | ✅ Cloudflare WAF |
| 2 | Password defaults | ✅ Changed |
| 3 | Cardholder data | ✅ Encrypted |
| 4 | Data transmission | ✅ TLS |
| 5 | Anti-virus | ⚠️ Not implemented |
| 6 | Secure systems | ⚠️ Partial |
| 7 | Access control | ⚠️ Partial |
| 8 | Unique IDs | ✅ Implemented |
| 9 | Physical access | N/A |
| 10 | Logging | ⚠️ Partial |
| 11 | Testing | ⚠️ Not regular |
| 12 | Policy | ⚠️ Needs update |

---

## Security Incident Response

### Steps

1. **Detect** - Alert triggered or incident reported
2. **Contain** - Isolate affected systems
3. **Eradicate** - Remove threat
4. **Recover** - Restore from backups
5. **Document** - Create incident report

### Contact

- Security Team: security@rez.money
- On-call: PagerDuty escalation

---

## Training

- [ ] All developers complete OWASP training
- [ ] Security champions in each team
- [ ] Regular security reviews

---

**Next:** [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
