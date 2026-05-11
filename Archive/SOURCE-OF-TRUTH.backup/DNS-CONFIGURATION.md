# DNS Configuration Guide for rez.money Domains

**Version:** 1.0.0
**Last Updated:** 2026-05-04
**Owner:** ReZ Engineering Team

---

## Overview

This document provides the authoritative DNS configuration for all `rez.money` domain subdomains. All DNS changes should be tracked against this source of truth.

---

## DNS Records

### 1. Core Infrastructure

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `api.rez.money` | CNAME | `proxy.rez.money` | 300 | - |
| `proxy.rez.money` | CNAME | `<your-hosting-provider>` | 300 | - |

### 2. Authentication & User Services

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `auth.rez.money` | CNAME | `rez-auth-service.render.com` | 300 | - |

### 3. Financial Services

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `wallet.rez.money` | CNAME | `rez-wallet-service.render.com` | 300 | - |
| `pay.rez.money` | CNAME | `rez-payment-service.render.com` | 300 | - |
| `verify.rez.money` | CNAME | `verify-service.render.com` | 300 | - |

### 4. Merchant & Commerce

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `merchant.rez.money` | CNAME | `rez-merchant-service.render.com` | 300 | - |

### 5. Web Platforms

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `now.rez.money` | CNAME | `rez-now.vercel.app` | 300 | - |
| `menu.rez.money` | CNAME | `rez-now.vercel.app` | 300 | - |
| `stayown.rez.money` | CNAME | `hotel-ota-web.vercel.app` | 300 | - |

### 6. AI Services

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `mind.rez.money` | CNAME | `rez-intent-graph.render.com` | 300 | - |

### 7. Marketing & Campaigns

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `try.rez.money` | CNAME | `rez-try.render.com` | 300 | - |
| `ads.rez.money` | CNAME | `ad-bazaar.vercel.app` | 300 | - |

### 8. Wildcard Records

| Subdomain | Record Type | Target | TTL | Priority |
|-----------|-------------|--------|-----|----------|
| `*.rez.money` | CNAME | `now.rez.money` | 300 | - |

The wildcard record handles all merchant/store subdomains automatically (e.g., `burgerking.rez.money`, `starbucks.rez.money`).

---

## Complete DNS Record Set

```dns
; === ReZ Money DNS Records ===

; API Gateway
api.rez.money          300     IN      CNAME   proxy.rez.money

; Authentication
auth.rez.money         300     IN      CNAME   rez-auth-service.render.com

; Financial Services
wallet.rez.money       300     IN      CNAME   rez-wallet-service.render.com
pay.rez.money          300     IN      CNAME   rez-payment-service.render.com
verify.rez.money       300     IN      CNAME   verify-service.render.com

; Merchant Services
merchant.rez.money     300     IN      CNAME   rez-merchant-service.render.com

; Web Platforms
now.rez.money         300     IN      CNAME   rez-now.vercel.app
menu.rez.money        300     IN      CNAME   rez-now.vercel.app
stayown.rez.money     300     IN      CNAME   hotel-ota-web.vercel.app

; AI Services
mind.rez.money        300     IN      CNAME   rez-intent-graph.render.com

; Marketing & Campaigns
try.rez.money         300     IN      CNAME   rez-try.render.com
ads.rez.money         300     IN      CNAME   ad-bazaar.vercel.app

; Wildcard for Merchant Subdomains
*.rez.money           300     IN      CNAME   now.rez.money
```

---

## DNS Provider Configuration

### Cloudflare

1. **Log in to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com
   - Select your `rez.money` domain

2. **Add DNS Records**
   - Go to **DNS** > **Records**
   - Click **Add record**
   - For each record:
     - **Type:** CNAME
     - **Name:** Subdomain (e.g., `auth`, `wallet`, `now`)
     - **Target:** Full target hostname
     - **Proxy status:** Set to **Proxied** (orange cloud) for CDN/WAF protection
     - **TTL:** 300 (or Auto)

3. **SSL/TLS Configuration**
   - Go to **SSL/TLS** > **Overview**
   - Set encryption mode to **Full** or **Flexible** (depending on backend)
   - Enable **Always Use HTTPS**
   - Enable **Automatic HTTPS Rewrites**

4. **Page Rules (Optional)**
   ```
   Pattern: http://*.rez.money/*
   Setting: Always Use HTTPS
   ```

### Vercel

1. **Link Your Domain**
   ```bash
   vercel domains add rez.money
   ```

2. **Add Records in Vercel Dashboard**
   - Project Settings > Domains
   - Add each subdomain pointing to the appropriate deployment

3. **Configure in your vercel.json**
   ```json
   {
     "redirects": [
       { "source": "/(.*)", "destination": "https://rez.money" }
     ]
   }
   ```

### Route53 (AWS)

1. **Create Hosted Zone**
   ```bash
   aws route53 create-hosted-zone --name rez.money --caller-reference $(date +%s)
   ```

2. **Add Records via CLI**
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z1234567890 \
     --change-batch file://dns-changes.json
   ```

3. **Sample change-batch format** (save as `dns-changes.json`):
   ```json
   {
     "Comment": "ReZ Money DNS Configuration",
     "Changes": [
       {
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "auth.rez.money",
           "Type": "CNAME",
           "TTL": 300,
           "ResourceRecords": [{"Value": "rez-auth-service.render.com"}]
         }
       }
     ]
   }
   ```

---

## SSL/TLS Requirements

### Certificate Types

| Environment | Certificate Type | Validation | Auto-Renewal |
|-------------|-----------------|------------|--------------|
| Production | Wildcard (`*.rez.money`) | DNS/OV | Required |
| Staging | SAN/Multi-domain | DNS | Required |
| Development | Self-signed | N/A | N/A |

### Provider-Specific Requirements

#### Cloudflare (Recommended)
- Free origin certificates available
- Universal SSL for all proxied subdomains
- Automatic renewal every 90 days
- No additional configuration needed

#### Let's Encrypt (Alternative)
```bash
certbot certonly --manual --preferred-challenges=dns \
  -d "rez.money" -d "*.rez.money"
```

#### AWS Certificate Manager
- Request public certificate
- Add DNS validation records
- Auto-renewal enabled

### Security Headers

Add to all responses:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

---

## Propagation & Verification

### Propagation Timeline

| Provider | Typical Propagation |
|----------|-------------------|
| Cloudflare | 1-5 minutes |
| Route53 | 30-60 seconds |
| GoDaddy | 5-30 minutes |
| Namecheap | 5-30 minutes |

### Verification Commands

```bash
# Check DNS resolution
dig +short auth.rez.money
nslookup wallet.rez.money

# Verify CNAME chain
dig +trace +short mind.rez.money

# Check SSL certificate
openssl s_client -connect api.rez.money:443 -servername api.rez.money </dev/null | openssl x509 -noout -subject -issuer

# Test HTTPS connectivity
curl -I https://auth.rez.money

# Verify wildcard resolution
dig +short randomstore.rez.money
```

### Online Tools

- [DNS Checker](https://dnschecker.org)
- [What's My DNS](https://whatsmydns.net)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## Environment-Specific Configurations

### Production (`rez.money`)

| Record | Value | Proxy |
|--------|-------|-------|
| All CNAMEs | As specified above | Proxied |
| SSL Mode | Full (strict) | Required |

### Staging (`staging.rez.money`)

```dns
api.staging.rez.money     CNAME   staging-proxy.rez.money
auth.staging.rez.money    CNAME   staging-auth.render.com
```

### Development (`dev.rez.money`)

Local development should use `/etc/hosts` or `.local` domains:

```bash
# /etc/hosts entries for local dev
127.0.0.1    api.rez.money.local
127.0.0.1    auth.rez.money.local
127.0.0.1    wallet.rez.money.local
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `NXDOMAIN` error | Record not created | Create CNAME record in DNS provider |
| SSL certificate mismatch | Wrong SNI | Ensure Server Name Indication matches |
| 301 redirects loop | Cloudflare SSL set to Flexible with HTTPS origin | Change to Full mode |
| Propagation delay | Long TTL | Wait or temporarily lower TTL |
| Wildcard not resolving | Provider limitations | Check if wildcard CNAMEs supported |

### Debug Steps

1. **Clear local DNS cache**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches

   # Windows
   ipconfig /flushdns
   ```

2. **Test from multiple locations**
   Use online DNS checking tools to verify global propagation.

3. **Check DNSSEC**
   Ensure DNSSEC is properly configured if enabled.

---

## Maintenance

### Review Schedule

- **Quarterly:** Verify all CNAME targets are still valid
- **After deployment:** Confirm new services have DNS entries
- **On service migration:** Update CNAME targets immediately

### Change Process

1. Review this document for the authoritative record
2. Make changes in DNS provider console
3. Update this document with new values
4. Verify propagation within 15 minutes
5. Document any temporary issues

---

## Emergency Contacts

| Role | Responsibility |
|------|----------------|
| Infrastructure Lead | DNS provider account access |
| DevOps Team | DNS propagation issues |
| Security Team | SSL certificate emergencies |

---

## Appendix: Terraform Configuration (Optional)

```hcl
# main.tf
resource "cloudflare_record" "rez_services" {
  for_each = toset([
    { name = "api",       value = "proxy.rez.money",             zone_id = var.cloudflare_zone_id },
    { name = "auth",      value = "rez-auth-service.render.com", zone_id = var.cloudflare_zone_id },
    { name = "wallet",    value = "rez-wallet-service.render.com", zone_id = var.cloudflare_zone_id },
    { name = "pay",       value = "rez-payment-service.render.com", zone_id = var.cloudflare_zone_id },
    { name = "merchant",  value = "rez-merchant-service.render.com", zone_id = var.cloudflare_zone_id },
    { name = "now",       value = "rez-now.vercel.app",         zone_id = var.cloudflare_zone_id },
    { name = "menu",      value = "rez-now.vercel.app",         zone_id = var.cloudflare_zone_id },
    { name = "stayown",   value = "hotel-ota-web.vercel.app",   zone_id = var.cloudflare_zone_id },
    { name = "mind",      value = "rez-intent-graph.render.com", zone_id = var.cloudflare_zone_id },
    { name = "try",       value = "rez-try.render.com",         zone_id = var.cloudflare_zone_id },
    { name = "ads",       value = "ad-bazaar.vercel.app",       zone_id = var.cloudflare_zone_id },
    { name = "verify",    value = "verify-service.render.com",  zone_id = var.cloudflare_zone_id },
  ])

  zone_id = each.value.zone_id
  name    = each.value.name
  value   = each.value.value
  type    = "CNAME"
  ttl     = 300
  proxied = true
}

# Wildcard record
resource "cloudflare_record" "wildcard" {
  zone_id = var.cloudflare_zone_id
  name    = "*"
  value   = "now.rez.money"
  type    = "CNAME"
  ttl     = 300
  proxied = true
}
```

---

**Document Classification:** Internal - Technical Infrastructure
**Version Control:** This document follows semantic versioning. Breaking changes require major version bump.
