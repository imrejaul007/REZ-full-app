# Security Checklist

> **ReZ Platform Version:** 1.0.0
> **Last Updated:** May 12, 2026
> **Based on:** Claude Code Security Audit

---

## Table of Contents

1. [Pre-Launch Security Checks](#1-pre-launch-security-checks)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Payment Security](#3-payment-security)
4. [WebSocket Security](#4-websocket-security)
5. [API Key Rotation Steps](#5-api-key-rotation-steps)
6. [Secret Management](#6-secret-management)
7. [CORS Configuration](#7-cors-configuration)
8. [Rate Limiting](#8-rate-limiting)
9. [Input Validation](#9-input-validation)
10. [SQL Injection Prevention](#10-sql-injection-prevention)
11. [XSS Prevention](#11-xss-prevention)
12. [Summary Checklist](#summary-checklist)

---

## 1. Pre-Launch Security Checks

- [ ] **Environment Variables**
  - [ ] No hardcoded secrets in source code
  - [ ] `.env` files excluded from version control (`.gitignore`)
  - [ ] Environment-specific configs (dev/staging/prod) isolated
  - [ ] All required env vars documented

- [ ] **Dependencies**
  - [ ] `npm audit` / `pip audit` run with zero critical vulnerabilities
  - [ ] Outdated packages updated
  - [ ] Lock files committed (`package-lock.json`, `requirements.lock`)
  - [ ] No abandoned/unmaintained packages

- [ ] **Authentication**
  - [ ] Strong password policy enforced (min 12 chars, complexity)
  - [ ] JWT tokens have appropriate expiration (15-60 min)
  - [ ] Refresh tokens stored securely with rotation
  - [ ] MFA/2FA available for privileged accounts

- [ ] **Authorization**
  - [ ] Role-based access control (RBAC) implemented
  - [ ] Principle of least privilege applied
  - [ ] Admin endpoints protected and isolated
  - [ ] Session timeout configured (15-30 min inactivity)

- [ ] **Infrastructure**
  - [ ] TLS 1.2+ enforced on all endpoints
  - [ ] HTTPS redirect enabled
  - [ ] Security headers set (HSTS, CSP, X-Frame-Options, etc.)
  - [ ] Database not exposed publicly
  - [ ] Debug mode disabled in production

- [ ] **Logging & Monitoring**
  - [ ] Security events logged (login attempts, privilege changes)
  - [ ] Alerts configured for suspicious activity
  - [ ] Logs do not contain sensitive data (passwords, tokens)

---

## 2. Authentication & Authorization

### JWT Implementation

| Check | Status | Implementation |
|-------|--------|----------------|
| Algorithm constraint set | ✅ Required | `algorithms: ['HS256']` in jwt.verify() |
| Token expiry set | ✅ Required | Access: 15min, Refresh: 7 days |
| Refresh token rotation | ✅ Required | New refresh token on each use |
| Token blacklist on logout | ✅ Required | Redis-based |

```typescript
// CORRECT - Always specify algorithms
const decoded = jwt.verify(token, secret, {
  algorithms: ['HS256']  // Prevents alg:none attacks
});

// WRONG - Never omit algorithms
jwt.verify(token, secret);  // ❌ Vulnerable
```

**Location:** `RABTUL-Technologies/rez-auth-service/src/middleware/auth.ts`

### WebSocket Authentication

| Check | Status | Implementation |
|-------|--------|----------------|
| JWT validation on connect | ✅ | Validates HS256/384/512 |
| Constant-time token comparison | ✅ | Uses timingSafeEqual |
| Connection reject on invalid | ✅ | Returns 1008 close code |
| Internal service tokens | ✅ | X-Internal-Token header |

**Location:** `REZ-Intelligence/rez-intent-graph/src/websocket/server.ts`

### MFA/TOTP Requirements

| Check | Status | Implementation |
|-------|--------|----------------|
| TOTP RFC 6238 compliant | ✅ | Uses HMAC-SHA1 |
| Time window tolerance | ✅ | ±1 interval (30 seconds) |
| Backup codes | ✅ | 10 one-time codes |
| Common PIN detection | ✅ | Blocks 1234, 0000, etc. |
| Account lockout | ✅ | After 5 failed attempts |

**Location:** `RABTUL-Technologies/rez-auth-service/src/routes/mfaRoutes.ts`

### Internal Service Authentication

```typescript
// All internal service calls must include
X-Internal-Token: <service-specific-token>

// Tokens stored in
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}
```

**Location:** `RABTUL-Technologies/rez-auth-service/src/middleware/internalAuth.ts`

---

## 3. Payment Security

### Webhook Security Checklist

| Check | Status | Implementation |
|-------|--------|----------------|
| HMAC-SHA256 verification | ✅ | `webhookService.ts` |
| Event deduplication | ✅ | Redis 24-hour window |
| Amount verification | ✅ | Against Razorpay API |
| Replay prevention | ✅ | Redis nonce check |
| State FSM validation | ✅ | Before processing |
| MongoDB transactions | ✅ | Atomic updates |

**Location:** `RABTUL-Technologies/rez-payment-service/src/routes/paymentRoutes.ts`

### Webhook Verification Flow

```typescript
async function verifyWebhook(req, res) {
  // 1. Extract signature
  const signature = req.headers['x-razorpay-signature'];

  // 2. Verify HMAC-SHA256
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  )) {
    return res.status(400).send('Invalid signature');
  }

  // 3. Check Redis for deduplication
  const eventId = req.body.payload.payment.entity.id;
  const alreadyProcessed = await redis.set(
    `webhook:event:${eventId}`, '1', 'EX', 86400, 'NX'
  );
  if (!alreadyProcessed) {
    return res.status(200).send('Already processed');
  }

  // 4. Validate state transition
  // 5. Process with MongoDB transaction
}
```

### Payment State Machine

Valid transitions enforced in `config/paymentTransitions.ts`:

```
PENDING → AUTHORIZED → CAPTURED → REFUNDED
    ↓          ↓           ↓
CANCELLED  CANCELLED   CANCELLED
```

### Idempotency Keys

| Operation | Key Pattern | TTL |
|-----------|------------|-----|
| Payment init | `pay:idempotency:{key}` | 24 hours |
| Payment capture | `pay:nonce:{razorpayPaymentId}` | 25 hours |
| Webhook event | `webhook:event:{eventId}` | 24 hours |
| Wallet credit | `wallet:credit:{userId}:{idempotencyKey}` | 24 hours |

### Fail-Closed Behavior

```typescript
// If Redis is unavailable, reject payment operations
const redis = new Redis(REDIS_URL);

async function processPayment(paymentData) {
  try {
    // Try to check replay
    const isReplayed = await isReplayedPaymentId(razorpayPaymentId);
    if (isReplayed) {
      throw new Error('Payment already processed');
    }
  } catch (err) {
    // Redis error = fail closed for payments
    logger.error('[CRITICAL] Redis unavailable for payment', { err });
    throw new Error('Service temporarily unavailable');
  }
}
```

---

## 4. WebSocket Security

### Connection Validation

| Check | Status | Implementation |
|-------|--------|----------------|
| JWT validation | ✅ Fixed | Now validates properly |
| API key validation | ✅ | timingSafeEqual |
| Internal token validation | ✅ | timingSafeEqual |
| Bearer token fallback | ⚠️ | Dev mode only without JWT_SECRET |

### WebSocket Security Checklist

- [ ] JWT_SECRET_FOR_WS configured in production
- [ ] All tokens use timingSafeEqual comparison
- [ ] Connection rejected returns 1008 close code
- [ ] Heartbeat cleans up stale connections (60s threshold)
- [ ] Message validation with try/catch for JSON.parse

### Environment Variables Required

```bash
# Required for WebSocket production
JWT_SECRET_FOR_WS=<production-jwt-secret>

# Optional - uses JWT_SECRET if not set
JWT_SECRET=<production-jwt-secret>
```

---

## 5. API Key Rotation Steps

### Rotation Process

1. **Generate New Key**
   ```bash
   # Example: Generate secure API key
   openssl rand -hex 32
   ```

2. **Distribute New Key**
   - [ ] Update all applications using the old key
   - [ ] Deploy changes in parallel to avoid downtime
   - [ ] Maintain old key validity for grace period (24-48 hours)

3. **Validate New Key**
   - [ ] Verify all services authenticate correctly
   - [ ] Check monitoring for authentication failures

4. **Revoke Old Key**
   - [ ] Remove old key from all systems
   - [ ] Confirm old key returns 401 Unauthorized
   - [ ] Archive old key metadata (rotation date, reason)

### Key Rotation Schedule

| Key Type | Rotation Interval |
|----------|-------------------|
| Production API keys | Every 90 days |
| Service-to-service keys | Every 180 days |
| Database credentials | Every 90 days |
| Third-party integrations | Every 180 days |
| Encryption keys | Every 365 days |

### Emergency Key Rotation

- [ ] Documented procedure for compromised key rotation
- [ ] Automated rotation capability in place
- [ ] Incident response contact list available

---

## 6. Secret Management

### Storage Principles

- [ ] **Never store secrets in code** — use environment variables or secret managers
- [ ] **Never commit secrets** — pre-commit hooks configured to prevent accidental commits
- [ ] **Encrypt secrets at rest** — use AES-256 or equivalent
- [ ] **Encrypt secrets in transit** — TLS required for secret retrieval

### Recommended Tools

| Tool | Use Case |
|------|----------|
| HashiCorp Vault | Centralized secret management |
| AWS Secrets Manager | AWS-hosted applications |
| Azure Key Vault | Azure-hosted applications |
| Google Cloud Secret Manager | GCP-hosted applications |
| Doppler | Developer-friendly secret management |
| 1Password CLI | Local development secrets |

### Implementation Checklist

- [ ] Secrets injected at runtime, not build time
- [ ] Secrets scoped to specific environments
- [ ] Secret access logged and monitored
- [ ] Automatic secret rotation configured where possible
- [ ] Dead secrets cleaned up from all locations

### Secret Scanning

- [ ] CI/CD pipeline includes secret scanning
- [ ] Pre-commit hooks prevent secret commits
- [ ] Regular audits for exposed secrets (git history included)

---

## 7. CORS Configuration

### Development (Development Only)

```javascript
// INSECURE - Never use in production
app.use(cors({
  origin: '*',
  credentials: true
}));
```

### Production Configuration

- [ ] **Explicit Origins Only**
  ```javascript
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://app.yourdomain.com'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  ```

### Checklist

- [ ] `origin: '*'` not used in production
- [ ] Credentials (`Access-Control-Allow-Credentials`) only sent to trusted origins
- [ ] Allowed methods explicitly defined
- [ ] Allowed headers explicitly defined
- [ ] Preflight requests handled correctly
- [ ] CORS headers logged/monitored for anomalies
- [ ] Wildcard subdomains reviewed (e.g., `*.domain.com`)

### Security Headers

```javascript
// Apply these headers alongside CORS
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
```

---

## 8. Rate Limiting

### Implementation

- [ ] **Global Rate Limiting**
  ```javascript
  const rateLimit = require('express-rate-limit');

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
  ```

- [ ] **Endpoint-Specific Limits**
  ```javascript
  // Stricter limits for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  });

  app.use('/api/auth', authLimiter);
  ```

### Rate Limit Tiers

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| API endpoints | 100 requests | 15 minutes |
| File uploads | 10 requests | 15 minutes |
| Search/Query | 30 requests | 1 minute |
| Public endpoints | 200 requests | 15 minutes |

### Checklist

- [ ] Rate limiting applied at API gateway level
- [ ] Rate limiting applied at application level
- [ ] IP-based rate limiting configured
- [ ] User-based rate limiting configured (authenticated requests)
- [ ] Rate limit responses include `Retry-After` header
- [ ] Rate limit exceeded logged for monitoring
- [ ] Graceful degradation under load
- [ ] Rate limits tested under load

### DDoS Considerations

- [ ] CDN layer provides additional rate limiting
- [ ] Geographic IP blocking configured for known threats
- [ ] Connection limits per IP configured at infrastructure level

---

## 9. Input Validation

### Client-Side Validation (UI Only)

- [ ] Form fields validated on blur and submit
- [ ] Input length limits enforced
- [ ] File type validation before upload
- [ ] **Client-side validation is for UX only — never trust client data**

### Server-Side Validation

- [ ] **All inputs validated on server**
- [ ] **Validation libraries used** (not manual string checks)

```javascript
// Example with Joi/Zod
const schema = z.object({
  email: z.string().email().max(255),
  age: z.number().int().min(13).max(150),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
});

app.post('/api/register', async (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  // Proceed with valid data
});
```

### Validation Checklist

- [ ] String length enforced (min and max)
- [ ] Data types validated
- [ ] Email format validated with regex
- [ ] URL format validated
- [ ] File types and sizes validated
- [ ] JSON structure validated
- [ ] Enum values validated against allowed list
- [ ] SQL characters escaped (even if using parameterized queries)
- [ ] HTML/script tags stripped where not expected
- [ ] Null/undefined handled explicitly

### Sanitization

- [ ] Input sanitized before storage
- [ ] Output encoded appropriately (HTML, URL, JS, CSS context)
- [ ] Markdown processed safely (HTML stripped from user markdown)
- [ ] File paths validated (no path traversal: `../`)

---

## 10. SQL Injection Prevention

### Always Use Parameterized Queries

```javascript
// INSECURE - Never do this
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);

// SECURE - Parameterized query
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);
```

### ORM Usage

- [ ] ORM abstracts SQL (Sequelize, TypeORM, Prisma)
- [ ] Raw queries avoided unless necessary
- [ ] If raw queries required, parameterized exclusively

### Checklist

- [ ] No string concatenation in SQL queries
- [ ] No template literals with user input in SQL
- [ ] ORM/parameterized queries used everywhere
- [ ] User input validated before query construction
- [ ] Database user has minimal required permissions
- [ ] Error messages do not expose SQL structure
- [ ] Stored procedures reviewed for injection vectors

### ORM Security Settings

```javascript
// Example: Prisma configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
});
```

### Additional Protections

- [ ] Database web interface not exposed publicly
- [ ] Database connections use SSL/TLS
- [ ] Connection strings not logged
- [ ] Query logging does not capture user input values

---

## 11. XSS Prevention

### Types of XSS

1. **Reflected XSS** — User input returned in response
2. **Stored XSS** — User input stored and displayed to others
3. **DOM-based XSS** — Client-side code reads and executes user input

### Prevention Checklist

- [ ] **Context-Aware Output Encoding**

```javascript
// HTML context - escape special characters
const escapeHtml = (str) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, char => map[char]);
};

// URL context
const encodeUrl = (str) => encodeURIComponent(str);

// JavaScript context
const encodeJs = (str) => JSON.stringify(str);
```

- [ ] **Content Security Policy (CSP) Header**

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'nonce-{random}';
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourdomain.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
```

- [ ] **Input Validation** — Reject obviously malicious input
- [ ] **HTTPOnly Cookies** — Session tokens not accessible to JavaScript
- [ ] **X-XSS-Protection Header** — Legacy browser protection
- [ ] **X-Content-Type-Options: nosniff** — Prevent MIME sniffing

### DOM XSS Prevention

- [ ] `innerHTML` avoided — use `textContent` or safe DOM methods
- [ ] User input never passed to `eval()`, `setTimeout()` (string), `Function()`
- [ ] `document.write()` never used
- [ ] URL fragments (`#`) validated before DOM manipulation

```javascript
// INSECURE
element.innerHTML = userInput;

// SECURE
element.textContent = userInput;

// Or for trusted HTML only
DOMPurify.sanitize(userInput);
```

### Template Engines

- [ ] Auto-escaping enabled (default in most modern engines)
- [ ] No `| safe` filters on user-generated content
- [ ] Handlebars/Mustache used with context-aware escaping

### Framework-Specific

- [ ] React: No `dangerouslySetInnerHTML` without sanitization
- [ ] Angular: No `bypassSecurityTrustHtml` without validation
- [ ] Vue: No `v-html` with user-generated content

---

## Summary Checklist

### Before Every Deployment

- [ ] All items in Section 1 (Pre-Launch) verified
- [ ] Secrets not in code or git history
- [ ] Rate limiting tested
- [ ] Input validation tested
- [ ] XSS payload tests passed
- [ ] SQL injection tests passed
- [ ] Security headers configured
- [ ] CORS restricted to known origins
- [ ] Dependencies audited
- [ ] Logs reviewed for sensitive data exposure

### Monthly Review

- [ ] Rotate sensitive credentials per schedule
- [ ] Review access logs for anomalies
- [ ] Update dependency audit
- [ ] Review and update security headers
- [ ] Test backup/restore procedures

### Quarterly Review

- [ ] Full security audit
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Access control review (remove unused accounts)
- [ ] Secret inventory audit
