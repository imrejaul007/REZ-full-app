# SECURITY

## RATE LIMITING

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

## HELMET

```javascript
app.use(helmet());
app.use(helmet.contentSecurityPolicy());
```

## CORS

```javascript
app.use(cors({
  origin: ['https://rez.money'],
  credentials: true
}));
```

## VALIDATION

```javascript
const schema = z.object({
  phone: z.string().regex(/^\d{10}$/),
  amount: z.number().positive()
});
```

## ENCRYPTION

- AES-256-GCM for data at rest
- TLS 1.3 for transit
- bcrypt for passwords
- JWT for tokens

## COMPLIANCE

| Standard | Status |
|----------|---------|
| PCI DSS | Required |
| GDPR | Required |
| SOC2 | Planned |
| ISO 27001 | Planned |

## SECRETS

```bash
# Rotate quarterly
# Use vault
# No hardcoded secrets
```

## AUDIT LOGGING

```javascript
const audit = {
  userId, action, resource, ip, timestamp
};
```
