#!/bin/bash
# Fix dependency conflicts across services
# Standardize: zod v3, @sentry/node v7, helmet v7

echo "Fixing dependency conflicts..."

# Fix rez-payment-service (has zod v4)
if [ -f "rez-payment-service/package.json" ]; then
  echo "Fixing rez-payment-service zod version..."
  sed -i '' 's/"zod": "^4\.[0-9.]*"/"zod": "^3.23.x"/g' rez-payment-service/package.json
  sed -i '' 's/"@sentry\/node": "^8\.[0-9.]*"/"@sentry\/node": "^7.120.x"/g' rez-payment-service/package.json
  sed -i '' 's/"helmet": "^8\.[0-9.]*"/"helmet": "^7.1.x"/g' rez-payment-service/package.json
fi

# Fix rez-merchant-service (has sentry v8, helmet v8)
if [ -f "rez-merchant-service/package.json" ]; then
  echo "Fixing rez-merchant-service versions..."
  sed -i '' 's/"@sentry\/node": "^8\.[0-9.]*"/"@sentry\/node": "^7.120.x"/g' rez-merchant-service/package.json
  sed -i '' 's/"helmet": "^8\.[0-9.]*"/"helmet": "^7.1.x"/g' rez-merchant-service/package.json
fi

echo "Done. Run 'npm install' in affected directories to update lock files."
