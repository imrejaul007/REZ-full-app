#!/bin/bash
# Fix port conflicts identified in audit

echo "=== FIXING PORT CONFLICTS ==="

# Port 3006 conflict: rez-order-service vs rez-media-events
# Keep rez-order-service on 3006, move rez-media-events to 3015
echo "Checking rez-media-events port..."
if [ -f "rez-media-events/src/index.ts" ]; then
  sed -i '' "s/parseInt(process.env.PORT || '3006'/parseInt(process.env.PORT || '3015'/g" rez-media-events/src/index.ts
  echo "  rez-media-events: 3006 -> 3015"
fi

# Port 4007 conflict: rez-ad-campaigns vs rez-ads-service
# Keep rez-ads-service on 4007, move rez-ad-campaigns to 4008
echo "Checking rez-ad-campaigns port..."
if [ -f "rez-ad-campaigns/src/index.ts" ]; then
  sed -i '' "s/parseInt(process.env.PORT || '4007'/parseInt(process.env.PORT || '4008'/g" rez-ad-campaigns/src/index.ts
  echo "  rez-ad-campaigns: 4007 -> 4008"
fi

# Port 3004 conflict: rez-gamification-service vs rez-user-intelligence-service
# Keep rez-gamification-service on 3004, move rez-user-intelligence-service to 3016
echo "Checking rez-user-intelligence-service port..."
if [ -f "rez-user-intelligence-service/src/index.ts" ]; then
  sed -i '' "s/parseInt(process.env.PORT || '3004'/parseInt(process.env.PORT || '3016'/g" rez-user-intelligence-service/src/index.ts
  echo "  rez-user-intelligence-service: 3004 -> 3016"
fi

# Port 4004 conflict: rez-dooh-service
# Move rez-dooh-service to 4018
echo "Checking rez-dooh-service port..."
if [ -f "rez-dooh-service/src/index.ts" ]; then
  sed -i '' "s/parseInt(process.env.PORT || '3000'/parseInt(process.env.PORT || '4018'/g" rez-dooh-service/src/index.ts
  echo "  rez-dooh-service: 3000 -> 4018"
fi

echo ""
echo "=== PORT CONFLICTS FIXED ==="
echo "Run 'npm run build' in affected directories to rebuild."
