# Deployment Setup Checklist

**Status:** Pending - Requires Manual Setup
**Estimated Time:** 2-4 hours
**Last Updated:** May 6, 2026

---

## Overview

This checklist sets up the complete REZ deployment infrastructure including:
- MongoDB Atlas (databases)
- Redis via Upstash (caching/sessions)
- Kubernetes clusters (staging/production)
- GitHub Actions CI/CD

---

## Step 1: MongoDB Atlas Setup (30 min)

### Create Account
- [ ] Go to https://www.mongodb.com/atlas
- [ ] Create account or sign in

### Staging Cluster
- [ ] Click **Build a Database**
- [ ] Select **M10** (or M0 for free tier)
- [ ] Region: **Asia Pacific (Mumbai)** or closest
- [ ] Click **Create**

### Production Cluster
- [ ] Click **Build a Database**
- [ ] Select **M30** or higher
- [ ] Enable **Multi-Region** redundancy
- [ ] Enable **Cloud Backup** (30-day retention)
- [ ] Click **Create**

### Create Database User
For each cluster:
- [ ] Go to **Security → Database Access**
- [ ] Click **Add New Database User**
- [ ] Username: `rez_app`
- [ ] Password: Run `openssl rand -base64 24` to generate
- [ ] Role: **Read and write to any database**
- [ ] Click **Add User**

### Configure Network Access
- [ ] Go to **Security → Network Access**
- [ ] Click **Add IP Address**
- [ ] Add: `0.0.0.0/0` (allows GitHub Actions)
- [ ] Confirm

### Get Connection String
- [ ] Go to **Deployment → Database**
- [ ] Click **Connect** on your cluster
- [ ] Select **Connect your application**
- [ ] Copy the connection string
- [ ] Replace `<password>` with your database user password

**Save these values:**
```
MONGODB_URI_STAGING=mongodb+srv://rez_app:PASSWORD@cluster-xxx.mongodb.net/rez_staging
MONGODB_URI_PRODUCTION=mongodb+srv://rez_app:PASSWORD@cluster-xxx.mongodb.net/rez_production
```

---

## Step 2: Redis Setup - Upstash (15 min)

### Create Account
- [ ] Go to https://upstash.com
- [ ] Sign up with GitHub

### Staging Database
- [ ] Click **Create Database**
- [ ] Name: `rez-staging`
- [ ] Region: Asia Pacific (Singapore)
- [ ] Tier: **Free**
- [ ] Click **Create**

### Production Database
- [ ] Click **Create Database**
- [ ] Name: `rez-production`
- [ ] Region: Asia Pacific (Singapore)
- [ ] Tier: **Pay-as-you-go**
- [ ] Enable **TLS**
- [ ] Click **Create**

### Get Connection URL
- [ ] Open each database
- [ ] Copy the **Redis URL** from dashboard

**Save these values:**
```
REDIS_URL_STAGING=redis://default:PASSWORD@xxx.upstash.io:6379
REDIS_URL_PRODUCTION=redis://default:PASSWORD@xxx.upstash.io:6379
```

---

## Step 3: Generate JWT Secrets (5 min)

Run these commands and save the output:

```bash
# Generate 4 secrets (run 4 times)
openssl rand -hex 64
```

**Save these values:**
```
JWT_SECRET_PRODUCTION=<output-1>
JWT_REFRESH_SECRET_PRODUCTION=<output-2>
JWT_ADMIN_SECRET_PRODUCTION=<output-3>
JWT_MERCHANT_SECRET_PRODUCTION=<output-4>
```

---

## Step 4: GitHub Secrets Setup (20 min)

### Navigate
1. Go to your GitHub repository
2. Click **Settings**
3. Left sidebar: **Security → Secrets and variables → Actions**

### Add Secrets

| Secret Name | Value |
|------------|-------|
| `STAGING_KUBECONFIG` | (from Step 5) |
| `PRODUCTION_KUBECONFIG` | (from Step 5) |
| `MONGODB_URI_STAGING` | `mongodb+srv://...` |
| `MONGODB_URI_PRODUCTION` | `mongodb+srv://...` |
| `REDIS_URL_STAGING` | `redis://...` |
| `REDIS_URL_PRODUCTION` | `redis://...` |
| `JWT_SECRET_PRODUCTION` | (64-char hex) |
| `JWT_REFRESH_SECRET_PRODUCTION` | (64-char hex) |
| `JWT_ADMIN_SECRET_PRODUCTION` | (64-char hex) |
| `JWT_MERCHANT_SECRET_PRODUCTION` | (64-char hex) |
| `RAZORPAY_KEY_ID` | `rzp_live_xxx` |
| `RAZORPAY_KEY_SECRET` | `xxx` |

---

## Step 5: Kubernetes Cluster Setup (30 min)

### Option A: Google Kubernetes Engine (GKE) - Recommended

1. Go to https://console.cloud.google.com/kubernetes
2. Click **Create Cluster**
3. Configure:
   - **Location type**: Regional
   - **Region**: asia-south1 (Mumbai)
   - **Machine type**: e2-medium (2 vCPU, 4GB)
   - **Nodes**: 3
4. Click **Create**
5. Wait for ready, then click **Connect**

### Option B: Amazon EKS

1. AWS Console → EKS
2. Click **Add cluster → Create**
3. Create node group with 3 t3.medium instances

### Option C: Azure AKS

1. Azure Portal → Kubernetes services
2. Create with 3 nodes, B2s size

### Get Kubeconfig

```bash
# GKE:
gcloud container clusters get-credentials CLUSTER_NAME \
  --region=asia-south1 --project=YOUR_PROJECT

# EKS:
aws eks update-kubeconfig --name CLUSTER_NAME --region=ap-south-1

# AKS:
az aks get-credentials --name CLUSTER_NAME --resource-group RESOURCE_GROUP
```

### Encode for GitHub

```bash
# Encode kubeconfig (creates one line)
cat ~/.kube/config | base64 | tr -d '\n'
```

**Save output as:**
```
STAGING_KUBECONFIG=<encoded>
PRODUCTION_KUBECONFIG=<encoded>
```

---

## Step 6: Verify GitHub Actions (10 min)

1. Go to **Actions** tab
2. Run **Infrastructure Setup** workflow
3. Select environment: **staging**
4. Click **Run workflow**
5. Verify all checks pass

---

## Step 7: Deploy to Staging (20 min)

### Option A: Push to develop branch (auto-deploy)
```bash
git checkout develop
git merge main
git push origin develop
```

### Option B: Manual trigger
1. **Actions → Deploy**
2. Click **Run workflow**
3. Select: **staging**
4. Click **Run workflow**

### Verify Staging
```bash
# Test health endpoints (update hostnames after DNS setup)
curl https://staging-api.rez.money/api/health
```

---

## Step 8: Production Deployment (15 min)

1. Create PR from develop → main
2. Get approval
3. Merge PR
4. **Actions → Deploy → Run workflow → production**
5. **Manual approval required** (GitHub notifies approvers)

### Verify Production
```bash
curl https://api.rez.money/api/health
```

---

## Quick Test: Local Docker Only (5 min)

No cloud setup needed:

```bash
cd "/Users/rejaulkarim/Documents/ReZ Full App"

# Use example env
cp docker-compose.example.env .env

# Generate test JWT
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env

# Start databases
docker compose up -d mongodb-primary redis

# Check status
docker compose ps
```

Expected:
```
NAME                   STATUS
rez-mongodb-primary    healthy (up 10 seconds)
rez-redis             healthy (up 5 seconds)
```

---

## Checklist Summary

| # | Task | Time |
|---|------|------|
| 1 | MongoDB Atlas Setup | 30 min |
| 2 | Redis (Upstash) Setup | 15 min |
| 3 | Generate JWT Secrets | 5 min |
| 4 | GitHub Secrets | 20 min |
| 5 | Kubernetes Cluster | 30 min |
| 6 | Verify GitHub Actions | 10 min |
| 7 | Deploy to Staging | 20 min |
| 8 | Deploy to Production | 15 min |

**Total: ~2 hours**

---

## Troubleshooting

### MongoDB Connection Failed?
- [ ] Check IP whitelist includes `0.0.0.0/0`
- [ ] Verify connection string password
- [ ] Test with mongosh locally

### Redis Connection Failed?
- [ ] Verify Upstash URL is correct
- [ ] Check TLS settings match
- [ ] Verify password

### GitHub Actions Failed?
- [ ] All secrets are set?
- [ ] Kubeconfig properly base64 encoded?
- [ ] Check workflow logs

---

## Post-Deployment Setup

After deployment, configure:
- [ ] DNS records for domains
- [ ] SSL certificates
- [ ] Monitoring (Grafana)
- [ ] Alerting (Slack/PagerDuty)
- [ ] Backup verification

---

*Created: May 6, 2026*
*Infrastructure: v1.0*
