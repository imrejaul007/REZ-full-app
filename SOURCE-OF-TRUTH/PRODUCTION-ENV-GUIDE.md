# PRODUCTION ENVIRONMENTS

**Date:** May 6, 2026
**Deployments:** 4 platforms

---

## DEPLOYMENT URLs

| Platform | URL |
|----------|-----|
| rez-ai-platform | https://rez-ai-platform.onrender.com |
| rez-marketing-backend | https://rez-marketing-backend.onrender.com |
| rez-utilities-platform | https://rez-utilities-platform.onrender.com |
| rez-core-platform | https://rez-core-platform.onrender.com |
| rez-core-intelligence | https://rez-core-intelligence.onrender.com |

---

## .env FILES CREATED

| Platform | File |
|----------|------|
| rez-ai-platform | .env.production |
| rez-marketing-backend | .env.production |
| rez-utilities-platform | .env.production |
| rez-core-platform | events.env.production |
| rez-core-platform | intelligence.env.production |

---

## MONGODB CLUSTER

All platforms use:
```
mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net
```

---

## REDIS

All platforms use:
```
redis://default:YOUR_PASSWORD@redis-cluster.redns.redis-cloud.com:12121
```

---

## EXTERNAL APIs NEEDED

### Twilio
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER

### WhatsApp
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_ID

### SendGrid
- SENDGRID_API_KEY

### Anthropic
- ANTHROPIC_API_KEY

### Sentry
- SENTRY_DSN

---

## INTERNAL SERVICE URLs

| Service | URL |
|---------|-----|
| REZ AI Platform | https://rez-ai-platform.onrender.com |
| REZ Marketing | https://rez-marketing-backend.onrender.com |
| REZ Utilities | https://rez-utilities-platform.onrender.com |
| REZ Core Events | https://rez-core-platform.onrender.com |
| REZ Core Intelligence | https://rez-core-intelligence.onrender.com |

---

## DEPLOY STEPS

1. Go to Render Dashboard
2. Select service
3. Environment → Environment Variables
4. Copy from .env.production files
5. Redeploy
