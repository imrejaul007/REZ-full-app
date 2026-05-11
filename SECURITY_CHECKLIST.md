# Security Checklist

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

## 2. API Key Rotation Steps

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

## 3. Secret Management

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

## 4. CORS Configuration

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

## 5. Rate Limiting

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

## 6. Input Validation

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

## 7. SQL Injection Prevention

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

## 8. XSS Prevention

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
