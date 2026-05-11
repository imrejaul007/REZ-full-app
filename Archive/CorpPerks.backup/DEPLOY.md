# CorpPerks Deployment Guide

## Option 1: Render Blueprint (Recommended)

### Step 1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/atlas
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string

### Step 2: Deploy via Render Blueprint

1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect GitHub
4. Select `imrejaul007/CorpPerks`
5. Add environment variables:
   - `MONGODB_URI`: Your Atlas connection string
   - `MAKCORPS_API_KEY`: Get from Makcorps
   - `NEXTABIZZ_API_KEY`: Get from NextaBizz
6. Click "Apply"

### Services Deployed:
- corpperks-api (Port 4013)
- corpperks-hotel (Port 4011)
- corpperks-procurement (Port 4012)
- corpperks-redis (Redis)

---

## Option 2: Manual Deploy

### Deploy Each Service Separately

```bash
# 1. rez-corpperks-service
cd rez-corpperks-service
npm install
npm run seed  # Seed demo data
npm start

# 2. rez-hotel-service
cd ../rez-hotel-service
npm install
npm start

# 3. rez-procurement-service
cd ../rez-procurement-service
npm install
npm start
```

### Environment Variables Required

```env
# rez-corpperks-service
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/corpperks
CORS_ORIGIN=https://admin.rez.money
PORT=4013

# rez-hotel-service
MAKCORPS_API_KEY=your_key
PORT=4011

# rez-procurement-service
NEXTABIZZ_API_KEY=your_key
PORT=4012
```

---

## Option 3: Docker Compose (Local)

```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## After Deployment

### Verify Services

```bash
# Check health
curl https://your-api-url/health

# Check all routes
curl https://your-api-url/api/corp/benefits
curl https://your-api-url/api/rewards/summary
curl https://your-api-url/api/finance/wallet/C001
```

### Test with Postman

Import `CorpPerks.postman_collection.json` (create this)

---

## Troubleshooting

### MongoDB Connection Issues
- Check `MONGODB_URI` is correct
- Whitelist IP in Atlas
- Check Atlas database user permissions

### CORS Issues
- Update `CORS_ORIGIN` with your frontend domain

### Service Not Starting
- Check logs: `docker-compose logs -f`
- Verify port availability
- Check environment variables
