# MongoDB Authentication Guide

**Date:** 2026-05-01
**Version:** 2.0
**Status:** Production Ready

---

## Overview

This guide covers enabling MongoDB authentication for the entire ReZ ecosystem. All 16 services use MongoDB and require authenticated connections.

### Services Using MongoDB

| Service | Port | Database | Role Required |
|---------|------|----------|---------------|
| rez-auth-service | 4002 | rez_auth | readWrite |
| rez-wallet-service | 3010 | rez_wallet | readWrite |
| rez-order-service | 4001 | rez_order | readWrite |
| rez-payment-service | 4001 | rez_payment | readWrite |
| rez-merchant-service | 4004 | rez_merchant | readWrite |
| rez-catalog-service | 3005 | rez_catalog | readWrite |
| rez-search-service | 4006 | rez_search | readWrite |
| rez-gamification-service | 4007 | rez_gamification | readWrite |
| rez-ads-service | 4007 | rez_ads | readWrite |
| rez-marketing-service | 4000 | rez_marketing | readWrite |
| rez-scheduler-service | 4009 | rez_scheduler | readWrite |
| rez-finance-service | 4005 | rez_finance | readWrite |
| rez-karma-service | 4011 | rez_karma | readWrite |
| rez-corpperks-service | 4013 | rez_corpperks | readWrite |
| rez-hotel-service | 4015 | rez_hotel | readWrite |
| rez-procurement-service | 4012 | rez_procurement | readWrite |

---

## Part 1: Enable MongoDB Authentication

### Option A: Docker Compose (Local Development)

Add authentication to `docker-compose.yml`:

```yaml
mongodb-primary:
  image: mongo:7
  container_name: rez-mongodb-primary
  restart: unless-stopped
  ports:
    - '27017:27017'
  environment:
    MONGO_INITDB_ROOT_USERNAME: rez_admin
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
  volumes:
    - mongodb_primary_data:/data/db
  command: mongod --replSet rs0 --bind_ip_all --auth
  healthcheck:
    test: ['CMD', 'mongosh', '--eval', 'db.runCommand({ping:1})']
    -u rez_admin -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin
```

### Option B: Standalone MongoDB

Start MongoDB with auth enabled:

```bash
mongod --auth --replSet rs0 --bind_ip_all
```

---

## Part 2: Create Service Users

Connect to MongoDB as admin:

```bash
mongosh --host localhost:27017 -u rez_admin -p <password> --authenticationDatabase admin
```

### Create Root Admin User (One-time)

```javascript
use admin
db.createUser({
  user: "rez_admin",
  pwd: "<generate-strong-password>",
  roles: [
    { role: "root", db: "admin" }
  ]
})
```

### Create Service Users (Run for each service)

Execute the following for each service:

```javascript
// rez-auth-service
use rez_auth
db.createUser({
  user: "rez_auth_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_auth" }
  ]
})

// rez-wallet-service
use rez_wallet
db.createUser({
  user: "rez_wallet_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_wallet" }
  ]
})

// rez-order-service
use rez_order
db.createUser({
  user: "rez_order_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_order" }
  ]
})

// rez-payment-service
use rez_payment
db.createUser({
  user: "rez_payment_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_payment" }
  ]
})

// rez-merchant-service
use rez_merchant
db.createUser({
  user: "rez_merchant_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_merchant" }
  ]
})

// rez-catalog-service
use rez_catalog
db.createUser({
  user: "rez_catalog_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_catalog" }
  ]
})

// rez-search-service
use rez_search
db.createUser({
  user: "rez_search_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_search" }
  ]
})

// rez-gamification-service
use rez_gamification
db.createUser({
  user: "rez_gamification_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_gamification" }
  ]
})

// rez-ads-service
use rez_ads
db.createUser({
  user: "rez_ads_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_ads" }
  ]
})

// rez-marketing-service
use rez_marketing
db.createUser({
  user: "rez_marketing_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_marketing" }
  ]
})

// rez-scheduler-service
use rez_scheduler
db.createUser({
  user: "rez_scheduler_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_scheduler" }
  ]
})

// rez-finance-service
use rez_finance
db.createUser({
  user: "rez_finance_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_finance" }
  ]
})

// rez-karma-service
use rez_karma
db.createUser({
  user: "rez_karma_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_karma" }
  ]
})

// rez-corpperks-service
use rez_corpperks
db.createUser({
  user: "rez_corpperks_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_corpperks" }
  ]
})

// rez-hotel-service
use rez_hotel
db.createUser({
  user: "rez_hotel_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_hotel" }
  ]
})

// rez-procurement-service
use rez_procurement
db.createUser({
  user: "rez_procurement_user",
  pwd: "<generate-service-password>",
  roles: [
    { role: "readWrite", db: "rez_procurement" }
  ]
})
```

---

## Part 3: Update Connection Strings

### Connection String Format

```
mongodb://<username>:<password>@<host>:<port>/<database>?authSource=admin&replicaSet=rs0
```

### For Each Service

#### rez-auth-service
```env
MONGODB_URI=mongodb://rez_auth_user:<password>@localhost:27017/rez_auth?authSource=admin
```

#### rez-wallet-service
```env
MONGODB_URI=mongodb://rez_wallet_user:<password>@localhost:27017/rez_wallet?authSource=admin
```

#### rez-order-service
```env
MONGODB_URI=mongodb://rez_order_user:<password>@localhost:27017/rez_order?authSource=admin
```

#### rez-payment-service
```env
MONGODB_URI=mongodb://rez_payment_user:<password>@localhost:27017/rez_payment?authSource=admin
```

#### rez-merchant-service
```env
MONGODB_URI=mongodb://rez_merchant_user:<password>@localhost:27017/rez_merchant?authSource=admin
```

#### rez-catalog-service
```env
MONGODB_URI=mongodb://rez_catalog_user:<password>@localhost:27017/rez_catalog?authSource=admin
```

#### rez-search-service
```env
MONGODB_URI=mongodb://rez_search_user:<password>@localhost:27017/rez_search?authSource=admin
```

#### rez-gamification-service
```env
MONGODB_URI=mongodb://rez_gamification_user:<password>@localhost:27017/rez_gamification?authSource=admin
```

#### rez-ads-service
```env
MONGO_URI=mongodb://rez_ads_user:<password>@localhost:27017/rez_ads?authSource=admin
```

#### rez-marketing-service
```env
MONGODB_URI=mongodb://rez_marketing_user:<password>@localhost:27017/rez_marketing?authSource=admin
```

#### rez-scheduler-service
```env
MONGODB_URI=mongodb://rez_scheduler_user:<password>@localhost:27017/rez_scheduler?authSource=admin
```

#### rez-finance-service
```env
MONGODB_URI=mongodb://rez_finance_user:<password>@localhost:27017/rez_finance?authSource=admin
```

#### rez-karma-service
```env
MONGODB_URI=mongodb://rez_karma_user:<password>@localhost:27017/rez_karma?authSource=admin
```

#### rez-corpperks-service
```env
MONGODB_URI=mongodb://rez_corpperks_user:<password>@localhost:27017/rez_corpperks?authSource=admin
```

#### rez-hotel-service
```env
MONGODB_URI=mongodb://rez_hotel_user:<password>@localhost:27017/rez_hotel?authSource=admin
```

#### rez-procurement-service
```env
MONGODB_URI=mongodb://rez_procurement_user:<password>@localhost:27017/rez_procurement?authSource=admin
```

---

## Part 4: MongoDB Atlas Configuration

### Step 1: Create Database User (Atlas Console)

1. Go to **Security > Database Access**
2. Click **Add New Database User**
3. Select **Password** authentication
4. Choose **Read and write to any database** or scoped role
5. Copy the generated password

### Step 2: Update Connection String

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?authSource=admin&replicaSet=<replica-set>&w=majority
```

### Step 3: Network Whitelist

1. Go to **Security > Network Access**
2. Add IP whitelist entries
3. For local dev, add your home/office IP
4. For production, add application server IPs

---

## Part 5: Generate Secure Passwords

### Generate with OpenSSL

```bash
# Generate 24-character base64 password
openssl rand -base64 24

# Generate 32-character hex password
openssl rand -hex 32

# Generate URL-safe password
openssl rand -base64 32 | tr -d '=' | tr '+/' '-_'
```

### Password Requirements

- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, special characters
- No dictionary words
- No personally identifiable information

---

## Part 6: Verification

### Test Connection (Local)

```bash
# Test root admin connection
mongosh "mongodb://rez_admin:<password>@localhost:27017/admin?authSource=admin" --eval "db.runCommand({ ping: 1 })"

# Test service user connection
mongosh "mongodb://rez_auth_user:<password>@localhost:27017/rez_auth?authSource=admin" --eval "db.runCommand({ ping: 1 })"
```

Expected output:
```json
{ ok: 1 }
```

### Test Connection (Atlas)

```bash
mongosh "mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?authSource=admin&retryWrites=true&w=majority" --eval "db.runCommand({ ping: 1 })"
```

### Verify User Roles

```javascript
use admin
db.system.users.find().pretty()
```

---

## Part 7: Troubleshooting

### Error: Authentication Failed

1. Verify username and password are correct
2. Check authSource matches the database where user was created
3. Ensure MongoDB is running with `--auth` flag

### Error: Connection Refused

1. Verify MongoDB is running
2. Check port (default 27017)
3. Verify firewall rules

### Error: User Not Found

1. Connect as admin user
2. Run `db.getUsers()` in the target database
3. Recreate user if missing

### Error: Role Not Found

1. Verify role name is correct
2. For custom roles, create them first

### Error: Replica Set Not Found

1. Ensure replica set is initialized
2. Verify connection string includes `replicaSet=rs0`
3. Check all replica set members are reachable

---

## Part 8: Rollback Procedure

If authentication causes issues:

### Temporary Disable Auth (Development Only)

1. Stop MongoDB
2. Start without `--auth` flag
3. Debug and fix issues
4. Restart with auth enabled

### Emergency Connection String

```env
MONGODB_URI=mongodb://localhost:27017/rez_<service>
```

**WARNING:** Only use for debugging. Re-enable auth immediately after.

---

## Part 9: Environment Variables Reference

### Root Level (.env)

```env
# MongoDB Root Credentials
MONGO_ROOT_USERNAME=rez_admin
MONGO_ROOT_PASSWORD=<generate-with-openssl-rand-base64-24>

# Per-Service User Credentials
MONGO_AUTH_USER_PASSWORD=<password>
MONGO_WALLET_USER_PASSWORD=<password>
MONGO_ORDER_USER_PASSWORD=<password>
MONGO_PAYMENT_USER_PASSWORD=<password>
MONGO_MERCHANT_USER_PASSWORD=<password>
MONGO_CATALOG_USER_PASSWORD=<password>
MONGO_SEARCH_USER_PASSWORD=<password>
MONGO_GAMIFICATION_USER_PASSWORD=<password>
MONGO_ADS_USER_PASSWORD=<password>
MONGO_MARKETING_USER_PASSWORD=<password>
MONGO_SCHEDULER_USER_PASSWORD=<password>
MONGO_FINANCE_USER_PASSWORD=<password>
MONGO_KARMA_USER_PASSWORD=<password>
MONGO_CORPPERKS_USER_PASSWORD=<password>
MONGO_HOTEL_USER_PASSWORD=<password>
MONGO_PROCUREMENT_USER_PASSWORD=<password>

# Connection Settings
MONGODB_AUTH_SOURCE=admin
MONGODB_REPLICA_SET=rs0
```

---

## Part 10: Security Best Practices

1. **Use separate users per service** - Each service should have its own MongoDB user with minimal permissions
2. **Rotate passwords regularly** - Change passwords every 90 days
3. **Use strong passwords** - Minimum 24 characters, generated randomly
4. **Limit network access** - Use IP whitelisting in production
5. **Enable TLS** - Use `ssl=true` or `tls=true` in production connections
6. **Monitor access logs** - Review MongoDB logs for unauthorized access attempts
7. **Backup credentials** - Store passwords in a secure secrets manager

---

## Appendix: Quick Setup Script

Run this script to create all service users:

```bash
#!/bin/bash
# MongoDB User Setup Script
# Run: mongosh --host localhost:27017 -u rez_admin -p <password> --authenticationDatabase admin < setup-users.js

const services = [
  { name: 'rez_auth', user: 'rez_auth_user' },
  { name: 'rez_wallet', user: 'rez_wallet_user' },
  { name: 'rez_order', user: 'rez_order_user' },
  { name: 'rez_payment', user: 'rez_payment_user' },
  { name: 'rez_merchant', user: 'rez_merchant_user' },
  { name: 'rez_catalog', user: 'rez_catalog_user' },
  { name: 'rez_search', user: 'rez_search_user' },
  { name: 'rez_gamification', user: 'rez_gamification_user' },
  { name: 'rez_ads', user: 'rez_ads_user' },
  { name: 'rez_marketing', user: 'rez_marketing_user' },
  { name: 'rez_scheduler', user: 'rez_scheduler_user' },
  { name: 'rez_finance', user: 'rez_finance_user' },
  { name: 'rez_karma', user: 'rez_karma_user' },
  { name: 'rez_corpperks', user: 'rez_corpperks_user' },
  { name: 'rez_hotel', user: 'rez_hotel_user' },
  { name: 'rez_procurement', user: 'rez_procurement_user' }
];

services.forEach(service => {
  print(`Creating user for ${service.name}...`);
  db.getSiblingDB(service.name).createUser({
    user: service.user,
    pwd: '<GENERATE-AND-REPLACE-PASSWORD>',
    roles: [{ role: 'readWrite', db: service.name }]
  });
});

print('All users created successfully!');
```

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-30 | 1.0 | Initial draft |
| 2026-05-01 | 2.0 | Full production guide with all 16 services |
